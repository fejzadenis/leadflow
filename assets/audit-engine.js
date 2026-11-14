// audit-engine.js — mechanical n8n workflow checks. No network, no storage, no telemetry.
// Every finding must be provable from the workflow JSON alone. If a rule cannot point at
// a node (or at workflow settings) it does not ship.

const TRIGGER_RE = /trigger|webhook|schedule|cron|interval|manual/i;
const WRITE_RE = /googleSheets|airtable|microsoftExcel|postgres|mysql|mongoDb|supabase|notion|hubspot|crm/i;
const DEDUPE_TYPES = new Set([
  "n8n-nodes-base.if",
  "n8n-nodes-base.filter",
  "n8n-nodes-base.switch",
  "n8n-nodes-base.removeDuplicates",
  "n8n-nodes-base.compareDatasets",
]);
const SECRET_KEY_RE = /(api[_-]?key|apikey|access[_-]?token|auth[_-]?token|token|secret|passwd|password|authorization|bearer|webhook[_-]?secret)/i;
const SECRET_VAL_RE = /^(sk-[A-Za-z0-9]{12,}|xox[baprs]-|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._-]{20,})/;
const PLACEHOLDER_RE = /(YOUR[_ \-]?(API|KEY|TOKEN|DOMAIN|EMAIL|ID)|changeme|replace[_-]?me|<your|xxx{2,}|example\.com|TODO[_: ])/i;
// Placeholders only matter in configuration fields. Code bodies, notes and page copy are not
// live values, and flagging them is how a checker loses the reader's trust on the first run.
const CODE_FIELDS = new Set(["jsCode", "content", "description", "html", "notes", "text", "code", "title", "subject", "message"]);

export const CHECKS = [
  { id: "open-webhook", severity: "high", label: "Webhook with no authentication" },
  { id: "hardcoded-secret", severity: "high", label: "Secret written into a node instead of a credential" },
  { id: "placeholder-value", severity: "high", label: "Placeholder left in a live field" },
  { id: "disabled-node", severity: "high", label: "Disabled node still wired into the flow" },
  { id: "broken-expression", severity: "high", label: "Expression references a node that does not exist" },
  { id: "no-error-workflow", severity: "medium", label: "No error workflow: a failed run stops silently" },
  { id: "no-retry", severity: "medium", label: "HTTP call with no retry" },
  { id: "no-dedupe", severity: "medium", label: "Writes rows with no de-duplication step anywhere" },
  { id: "multiple-triggers", severity: "medium", label: "More than one trigger in a single workflow" },
  { id: "orphan-node", severity: "low", label: "Node not connected to anything" },
];

function walkStrings(obj, path, out) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === "string") { out.push([path, obj]); return; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => walkStrings(v, path + "[" + i + "]", out)); return; }
  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) walkStrings(obj[k], path ? path + "." + k : k, out);
  }
}

function connectionEnds(connections) {
  const sources = new Set();
  const targets = new Set();
  const outgoing = new Map(); // name -> [target names]
  for (const [from, outputs] of Object.entries(connections || {})) {
    for (const channel of Object.values(outputs || {})) {
      if (!Array.isArray(channel)) continue;
      for (const branch of channel) {
        if (!Array.isArray(branch)) continue;
        for (const link of branch) {
          if (!link || !link.node) continue;
          sources.add(from);
          targets.add(link.node);
          if (!outgoing.has(from)) outgoing.set(from, []);
          outgoing.get(from).push(link.node);
        }
      }
    }
  }
  return { sources, targets, outgoing };
}

function ancestors(name, incomingMap) {
  const seen = new Set();
  const stack = [...(incomingMap.get(name) || [])];
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n)) continue;
    seen.add(n);
    for (const p of incomingMap.get(n) || []) stack.push(p);
  }
  return seen;
}

/**
 * Audit one workflow object.
 * @returns {{findings: Array, counts: object, nodes: number}}
 */
export function auditWorkflow(wf) {
  const findings = [];
  const nodes = Array.isArray(wf?.nodes) ? wf.nodes : [];
  const connections = wf?.connections || {};
  const names = new Set(nodes.map((n) => n.name));
  const { sources, targets } = connectionEnds(connections);

  const incomingMap = new Map();
  for (const [from, outs] of Object.entries(connections || {})) {
    for (const channel of Object.values(outs || {})) {
      if (!Array.isArray(channel)) continue;
      for (const branch of channel) {
        if (!Array.isArray(branch)) continue;
        for (const link of branch) {
          if (!link || !link.node) continue;
          if (!incomingMap.has(link.node)) incomingMap.set(link.node, []);
          incomingMap.get(link.node).push(from);
        }
      }
    }
  }

  const triggers = nodes.filter((n) => TRIGGER_RE.test(String(n.type || "").split(".").pop()));

  for (const node of nodes) {
    const type = String(node.type || "");
    const params = node.parameters || {};

    // 1. Webhook without authentication
    if (type === "n8n-nodes-base.webhook") {
      const auth = params.authentication;
      if (!auth || auth === "none") {
        findings.push({
          check: "open-webhook", severity: "high", node: node.name,
          detail: "Webhook node accepts any caller. Anyone who learns the URL can post data into this workflow.",
        });
      }
    }

    // 2 + 3. Secrets and placeholders inside node parameters
    const strings = [];
    walkStrings(params, "", strings);
    const reportedSecret = new Set();
    const reportedPlaceholder = new Set();
    for (const [path, value] of strings) {
      if (!value || value.startsWith("={{") || value.startsWith("={{")) continue;
      const leafKey = path.split(".").pop() || "";
      // A high-confidence token shape is flagged wherever it sits. A field whose *name* says
      // token/password is flagged when its value is an opaque literal (not a sentence, not an expression).
      const looksLikeToken = SECRET_VAL_RE.test(value);
      const namedLikeSecret =
        SECRET_KEY_RE.test(leafKey) && value.length >= 8 && !/\s/.test(value) && /^[A-Za-z0-9._\-+/=]{8,}$/.test(value);
      if ((looksLikeToken || namedLikeSecret) && !reportedSecret.has(leafKey + "|" + value)) {
        reportedSecret.add(leafKey + "|" + value);
        findings.push({
          check: "hardcoded-secret", severity: "high", node: node.name,
          detail: "Field `" + leafKey + "` contains a literal credential. It travels with the JSON export and with every copy of the workflow.",
        });
      }
      if (PLACEHOLDER_RE.test(value) && !reportedPlaceholder.has(value) && !CODE_FIELDS.has(leafKey) && value.length <= 120) {
        reportedPlaceholder.add(value);
        findings.push({
          check: "placeholder-value", severity: "high", node: node.name,
          detail: "Field `" + (leafKey || "value") + "` still holds a placeholder: " + JSON.stringify(value.slice(0, 40)) + ". This run will fail or write junk at the first real execution.",
        });
      }
    }

    // 4. Disabled node still connected
    if (node.disabled === true) {
      const wired = sources.has(node.name) || targets.has(node.name);
      if (wired) {
        findings.push({
          check: "disabled-node", severity: "high", node: node.name,
          detail: "Node is disabled but still connected. The branch around it runs with data it was never designed to handle.",
        });
      }
    }

    // 5. Expressions pointing at nodes that do not exist
    const exprHits = new Set();
    for (const [, value] of strings) {
      if (typeof value !== "string") continue;
      const re = /\$\(\s*['"]([^'"]+)['"]\s*\)|\$node\[\s*['"]([^'"]+)['"]\s*\]/g;
      let m;
      while ((m = re.exec(value)) !== null) {
        const ref = m[1] || m[2];
        if (ref && !names.has(ref) && !exprHits.has(ref)) {
          exprHits.add(ref);
          findings.push({
            check: "broken-expression", severity: "high", node: node.name,
            detail: "Expression reads from a node named " + JSON.stringify(ref) + ", which is not in this workflow. It resolves to null at runtime.",
          });
        }
      }
    }

    // 6. HTTP without retry
    if (type === "n8n-nodes-base.httpRequest") {
      const opts = params.options || {};
      const hasRetry = opts.retry !== undefined && opts.retry !== null && opts.retry !== "";
      const handled = node.onError === "continueErrorOutput" || node.onError === "continueRegularOutput";
      if (!hasRetry && !handled) {
        findings.push({
          check: "no-retry", severity: "medium", node: node.name,
          detail: "No retry and no error branch. One timeout from the API ends the run and every item after it.",
        });
      }
    }
  }

  // 7. No error workflow
  const errWf = wf?.settings?.errorWorkflow;
  if (!errWf || String(errWf).trim() === "") {
    findings.push({
      check: "no-error-workflow", severity: "medium", node: null,
      detail: "Workflow settings name no error workflow, and no node handles failures. A failed run leaves no trace beyond the executions list.",
    });
  }

  // 8. Writes with no de-duplication anywhere upstream
  const hasDedupe = nodes.some((n) => DEDUPE_TYPES.has(String(n.type || "")));
  if (!hasDedupe) {
    for (const node of nodes) {
      const type = String(node.type || "");
      const op = String(node.parameters?.operation || "").toLowerCase();
      if (WRITE_RE.test(type) && /append|insert|upsert|create|update/.test(op)) {
        findings.push({
          check: "no-dedupe", severity: "medium", node: node.name,
          detail: "Writes rows and no If / Filter / Remove-duplicates node exists in the workflow. A retry or a repeated trigger writes the same record twice.",
        });
        break;
      }
    }
  }

  // 9. More than one trigger
  if (triggers.length > 1) {
    findings.push({
      check: "multiple-triggers", severity: "medium", node: null,
      detail: triggers.length + " trigger nodes (" + triggers.map((t) => t.name).join(", ") + ") in one workflow. Two entry points in one canvas is how half-executed states happen.",
    });
  }

  // 10. Orphan nodes
  for (const node of nodes) {
    const isTrigger = TRIGGER_RE.test(String(node.type || "").split(".").pop());
    if (isTrigger) continue;
    if (!sources.has(node.name) && !targets.has(node.name)) {
      findings.push({
        check: "orphan-node", severity: "low", node: node.name,
        detail: "Node is connected to nothing. It never runs, so whatever it was meant to do is not happening.",
      });
    }
  }

  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  return { findings, counts, nodes: nodes.length, triggers: triggers.length };
}

/**
 * Accept a pasted export: one workflow, an array of workflows, or an n8n export wrapper.
 */
export function parseExport(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : [data];
  const workflows = [];
  for (const item of list) {
    if (item && Array.isArray(item.nodes)) workflows.push(item);
    else if (item && Array.isArray(item.workflows)) workflows.push(...item.workflows.filter((w) => w && Array.isArray(w.nodes)));
  }
  if (workflows.length === 0) throw new Error("No workflow with a nodes array found in that JSON.");
  return workflows;
}

export function auditText(text) {
  const workflows = parseExport(text);
  return workflows.map((wf) => ({
    name: wf.name || "(unnamed workflow)",
    ...auditWorkflow(wf),
  }));
}
