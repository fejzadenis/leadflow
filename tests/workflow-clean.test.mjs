// Regression tests against the real Code nodes in the free workflows.
// Run: node tests/workflow-clean.test.mjs
import fs from "fs";
import path from "path";

const root = path.resolve(".");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

function nodeCode(wfPath, nodeName) {
  const wf = JSON.parse(read(wfPath));
  const n = wf.nodes.find(x => x.name === nodeName);
  if (!n) throw new Error("node not found: " + nodeName + " in " + wfPath);
  // n8n executes Code nodes inside a function body: top-level return is legal there.
  return new Function("$json", "$input", "console", n.parameters.jsCode);
}

const messy = read("sample/before.csv");
const cleanFn = nodeCode("free/leadflow-free-clean-csv.json", "Clean and validate rows");
const dedupeFn = nodeCode("free/leadflow-free-lead-dedupe.json", "Dedupe by email");

let pass = 0, fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? " :: " + detail : "")); }
};
const shim = (items) => ({ all: () => items, first: () => items[0], last: () => items[items.length - 1] });
const one = (fn, input) => {
  const out = fn(input, shim([{ json: input }]), console);
  if (!Array.isArray(out) || !out[0] || !out[0].json) throw new Error("code node returned no items");
  return out[0].json;
};

console.log("workflow 01 - clean :: sample/before.csv");
const r = one(cleanFn, { csv: messy });
check("parses the header row", Array.isArray(r.headers) && r.headers.length > 0);
check("counts every input row", r.rows_in === 12, "rows_in=" + r.rows_in);
check("keeps 10 importable rows (dedupe is workflow 01b, not this node)", r.cleaned.length === 10, "cleaned=" + r.cleaned.length);
check("rejects exactly the 2 unfixable addresses", r.rejected.length === 2, "rejected=" + r.rejected.length);
check("every rejection carries a reason", r.rejected.every(x => x && x.reason && String(x.reason).length > 3));
check("no cleaned row lacks an email", r.cleaned.every(x => /@/.test(x.email || "")));
check("emails are lowercased", r.cleaned.every(x => x.email === String(x.email).toLowerCase()));
check("diacritics survive in names", r.cleaned.some(x => /[\u00C0-\u024F]/.test((x.full_name || "") + (x.first_name || ""))));

console.log("workflow 01b - dedupe :: the same cleaned rows");
const dedupeItems = dedupeFn({ rows: r.cleaned }, shim(r.cleaned.map(x => ({ json: x }))), console);
  const unique = dedupeItems.map(i => i.json);
  check("collapses 10 cleaned rows to 7 unique leads", unique.length === 7, "unique=" + unique.length);
  check("keeps one row per email, case-insensitively", new Set(unique.map(x => String(x.email).toLowerCase())).size === unique.length);

console.log("workflow 01 - edge cases");
check("empty file returns an empty report, no throw", one(cleanFn, { csv: "" }).rows_in === 0);
check("header-only file yields zero leads", one(cleanFn, { csv: "email,first name\n" }).cleaned.length === 0);
const semi = one(cleanFn, { csv: "email;first name;company\nana@x.io;Ana;North\n" });
check("semicolon export is split, not glued", semi.cleaned.length === 1 && semi.cleaned[0].email === "ana@x.io");
const title = one(cleanFn, { csv: "Export 10.11.2026\nemail,first name\nana@x.io,Ana\n" });
check("title row above the header is skipped", title.cleaned.length === 1 && title.cleaned[0].email === "ana@x.io");
const quoted = one(cleanFn, { csv: 'email,first name,note\nana@x.io,Ana,"line one\nline two"\nbo@x.io,Bo,plain\n' });
check("quoted newline does not create a phantom row", quoted.rows_in === 2 && quoted.cleaned.length === 2, "rows_in=" + quoted.rows_in);
const bom = one(cleanFn, { csv: "\uFEFFemail,first name\nana@x.io,Ana\n" });
check("UTF-8 BOM does not break the header", bom.cleaned.length === 1 && bom.cleaned[0].email === "ana@x.io");

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
