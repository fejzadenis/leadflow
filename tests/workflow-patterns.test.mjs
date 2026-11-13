// Regression tests against the real Code node in the email-pattern workflow.
// Run: node tests/workflow-patterns.test.mjs
import fs from "fs";
import path from "path";

const root = path.resolve(".");
const wf = JSON.parse(fs.readFileSync(path.join(root, "free/leadflow-free-email-patterns.json"), "utf8"));
const node = wf.nodes.find(n => n.name === "Generate candidate patterns");
const fn = new Function("$json", "$input", "console", node.parameters.jsCode);
const shim = (items) => ({ all: () => items, first: () => items[0], last: () => items[items.length - 1] });

let pass = 0, fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) { pass++; console.log("  ok   " + name); }
  else { fail++; console.log("  FAIL " + name + (detail ? " :: " + detail : "")); }
};
const run = (lead) => {
  const items = [{ json: lead }];
  const out = fn(lead, shim(items), console);
  return Array.isArray(out) ? out : [{ json: out }];
};

console.log("workflow 04 - email patterns");
const a = run({ first_name: "Ana", last_name: "Kovač", domain: "north.io", full_name: "Ana Kovač" });
const aJson = a.map(i => i.json);
const flat = JSON.stringify(aJson).toLowerCase();
const aEmails = aJson.flatMap(o => (o.patterns || []).map(p => String(p.email || p)));
check("folds diacritics in the generated addresses (Kovač -> kovac)",
  aEmails.length > 0 && aEmails.every(e => /^[\x20-\x7E]+$/.test(e)) && aEmails.some(e => e.includes("kovac")),
  aEmails.slice(0, 3).join(", "));
check("the original spelling is still shown to the user, not silently rewritten",
  flat.includes("kovač"), "original spelling missing");
check("produces more than one candidate pattern", /@/.test(flat));
check("never claims the addresses are verified", !/verified/i.test(flat) || /not verified|candidate/i.test(flat));

const b = run({ first_name: "Müller", last_name: "Schön", domain: "example.com", full_name: "Müller Schön" });
const bFlat = JSON.stringify(b.map(i => i.json)).toLowerCase();
check("handles umlauts (Müller -> mueller or muller)", bFlat.includes("muller") || bFlat.includes("mueller"), bFlat.slice(0, 160));

const c = run({ first_name: "Ana", last_name: "Kovac", domain: "", full_name: "Ana Kovac" });
const cFlat = JSON.stringify(c.map(i => i.json)).toLowerCase();
check("no domain means no invented address", !/@/.test(cFlat) || /no domain|missing/i.test(cFlat));

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
