// tests/audit.test.mjs — the rule engine is only allowed to ship if these pass.
import { auditWorkflow, auditText } from "../assets/audit-engine.js";
import fs from "node:fs";

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (extra ? "  -> " + extra : "")); }
}
function ids(res) { return res.findings.map((f) => f.check).sort(); }

// ---------- fixture 1: deliberately broken ----------
const broken = {
  name: "broken fixture",
  settings: {},
  nodes: [
    { name: "Webhook", type: "n8n-nodes-base.webhook", parameters: { path: "leads" }, position: [0, 0] },
    { name: "HTTP Request", type: "n8n-nodes-base.httpRequest", parameters: { url: "https://api.example.com/v1/leads", authentication: "none", headerParameters: { parameters: [{ name: "Authorization", value: "Bearer sk-live-9f8a7b6c5d4e3f2a1b" }] } }, position: [200, 0] },
    { name: "Old format", type: "n8n-nodes-base.set", parameters: { values: { string: [{ name: "key", value: "YOUR_API_KEY" }] } }, disabled: true, position: [400, 0] },
    { name: "Dead end", type: "n8n-nodes-base.noOp", parameters: {}, position: [600, 200] },
    { name: "Append rows", type: "n8n-nodes-base.googleSheets", parameters: { operation: "append", sheetName: "Leads" }, position: [600, 0] },
    { name: "Second trigger", type: "n8n-nodes-base.scheduleTrigger", parameters: { rule: { interval: [{ field: "hours", hoursInterval: 1 }] } }, position: [0, 200] },
  ],
  connections: {
    "Webhook": { main: [[{ node: "HTTP Request", type: "main", index: 0 }]] },
    "HTTP Request": { main: [[{ node: "Old format", type: "main", index: 0 }]] },
    "Old format": { main: [[{ node: "Append rows", type: "main", index: 0 }]] },
  },
};
const b = auditWorkflow(broken);
const bid = ids(b);
for (const want of ["open-webhook", "hardcoded-secret", "placeholder-value", "disabled-node", "no-error-workflow", "no-retry", "no-dedupe", "multiple-triggers", "orphan-node"]) {
  ok("broken fixture reports " + want, bid.includes(want), "got: " + bid.join(","));
}
ok("broken fixture: word 'none' is not treated as a placeholder", !b.findings.some((f) => f.check === "placeholder-value" && /none/.test(f.detail)));
ok("broken fixture: severity counts add up", b.counts.high + b.counts.medium + b.counts.low === b.findings.length);

// ---------- fixture 2: clean ----------
const clean = {
  name: "clean fixture",
  settings: { errorWorkflow: "Error handler" },
  nodes: [
    { name: "Schedule", type: "n8n-nodes-base.scheduleTrigger", parameters: { rule: { interval: [{ field: "hours", hoursInterval: 6 }] } } },
    { name: "Fetch", type: "n8n-nodes-base.httpRequest", parameters: { url: "https://api.example.org/leads", options: { retry: { retryOnFail: true, maxTries: 3 } } } },
    { name: "Dedupe", type: "n8n-nodes-base.removeDuplicates", parameters: { compare: "selectedFields" } },
    { name: "Write", type: "n8n-nodes-base.airtable", parameters: { operation: "append" } },
  ],
  connections: {
    "Schedule": { main: [[{ node: "Fetch", type: "main", index: 0 }]] },
    "Fetch": { main: [[{ node: "Dedupe", type: "main", index: 0 }]] },
    "Dedupe": { main: [[{ node: "Write", type: "main", index: 0 }]] },
  },
};
const c = auditWorkflow(clean);
ok("clean fixture reports zero findings", c.findings.length === 0, JSON.stringify(c.findings.map((f) => f.check + ":" + f.detail)));

// ---------- fixture 3: expression pointing at a missing node ----------
const exprCase = {
  name: "expr",
  settings: { errorWorkflow: "x" },
  nodes: [
    { name: "Trigger", type: "n8n-nodes-base.manualTrigger", parameters: {} },
    { name: "Set", type: "n8n-nodes-base.set", parameters: { values: { string: [{ name: "email", value: "={{ $('Fetch leads').item.json.email }}" }] } } },
  ],
  connections: { "Trigger": { main: [[{ node: "Set", type: "main", index: 0 }]] } },
};
const e = auditWorkflow(exprCase);
ok("missing node reference is caught", ids(e).includes("broken-expression"), ids(e).join(","));
ok("existing node is not a false positive", auditWorkflow({
  name: "expr2", settings: { errorWorkflow: "x" },
  nodes: [
    { name: "Trigger", type: "n8n-nodes-base.manualTrigger", parameters: {} },
    { name: "Set", type: "n8n-nodes-base.set", parameters: { values: { string: [{ name: "email", value: "={{ $('Trigger').item.json.email }}" }] } } },
  ],
  connections: { "Trigger": { main: [[{ node: "Set", type: "main", index: 0 }]] } },
}).findings.filter((f) => f.check === "broken-expression").length === 0);

// ---------- fixture 4: our own shipped workflows must not be flagged as broken ----------
const realFiles = [
  "../free/leadflow-free-lead-dedupe.json",
  "../free/leadflow-free-clean-csv.json",
  "../free/leadflow-free-email-patterns.json",
];
for (const rel of realFiles) {
  if (!fs.existsSync(new URL(rel, import.meta.url))) { console.log("SKIP  " + rel + " (not in this checkout)"); continue; }
  const text = fs.readFileSync(new URL(rel, import.meta.url), "utf8");
  const out = auditText(text);
  const highs = out.reduce((a, w) => a + w.counts.high, 0);
  ok(rel + " has no high-severity findings", highs === 0, JSON.stringify(out.map((w) => w.findings.filter((f) => f.severity === "high"))));
}

// ---------- fixture 5: parser ----------
ok("parser accepts a bare workflow", auditText(JSON.stringify(clean)).length === 1);
ok("parser rejects junk", (() => { try { auditText("{\"a\":1}"); return false; } catch { return true; } })());

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
