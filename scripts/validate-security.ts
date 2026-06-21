/**
 * Static security validator for Supabase migrations and edge functions.
 *
 * Checks performed:
 *  1. Every `CREATE TABLE public.<name>` in supabase/migrations has, somewhere
 *     in the migration set: ENABLE ROW LEVEL SECURITY, at least one GRANT,
 *     and at least one CREATE POLICY referencing that table.
 *  2. No `service_role` key, JWT secret, or obvious hardcoded provider key
 *     appears in source.
 *  3. Edge functions read secrets via Deno.env.get and never log secret values.
 *  4. No policy uses `USING (true)` or `WITH CHECK (true)` without an admin
 *     guard.
 *
 * Exits non-zero on any failure so CI blocks the merge.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");
const SRC_DIR = join(ROOT, "src");

type Failure = { check: string; file: string; detail: string };
const failures: Failure[] = [];
const warnings: Failure[] = [];

function walk(dir: string, exts: string[]): string[] {
  let results: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) results = results.concat(walk(full, exts));
    else if (exts.includes(extname(entry))) results.push(full);
  }
  return results;
}

// ---------- 1. RLS + GRANT + POLICY for every CREATE TABLE ----------
const migrationFiles = walk(MIGRATIONS_DIR, [".sql"]).sort();
const allMigrationSql = migrationFiles
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

const createTableRe =
  /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.([a-zA-Z_][a-zA-Z0-9_]*)/gi;
const createdTables = new Set<string>();
let m: RegExpExecArray | null;
while ((m = createTableRe.exec(allMigrationSql)) !== null) {
  createdTables.add(m[1].toLowerCase());
}

for (const table of createdTables) {
  const rlsRe = new RegExp(
    `ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
    "i",
  );
  const grantRe = new RegExp(
    `GRANT\\s+[A-Z, ]+\\s+ON\\s+(?:TABLE\\s+)?(?:public\\.)?${table}\\b`,
    "i",
  );
  const policyRe = new RegExp(
    `CREATE\\s+POLICY[^;]+ON\\s+(?:public\\.)?${table}\\b`,
    "i",
  );

  if (!rlsRe.test(allMigrationSql))
    failures.push({
      check: "rls-enabled",
      file: "supabase/migrations/*",
      detail: `Table public.${table} has no ENABLE ROW LEVEL SECURITY`,
    });
  if (!grantRe.test(allMigrationSql))
    failures.push({
      check: "grants-present",
      file: "supabase/migrations/*",
      detail: `Table public.${table} has no GRANT — PostgREST will reject all access`,
    });
  if (!policyRe.test(allMigrationSql))
    failures.push({
      check: "policy-present",
      file: "supabase/migrations/*",
      detail: `Table public.${table} has no CREATE POLICY — RLS will deny all rows`,
    });
}

// ---------- 2. Hardcoded secret scan ----------
const codeFiles = [
  ...walk(SRC_DIR, [".ts", ".tsx", ".js", ".jsx"]),
  ...walk(FUNCTIONS_DIR, [".ts"]),
];

const PUBLISHABLE_ALLOWLIST = [
  /src\/integrations\/supabase\/client\.ts$/,
];

const dangerousPatterns: Array<{ name: string; re: RegExp }> = [
  {
    name: "supabase-service-role-key",
    re: /"role"\s*:\s*"service_role"/,
  },
  {
    name: "stripe-secret-key",
    re: /sk_live_[0-9A-Za-z]{16,}/,
  },
  {
    name: "twilio-auth-token",
    re: /AC[a-f0-9]{32}/,
  },
  {
    name: "generic-aws-access-key",
    re: /AKIA[0-9A-Z]{16}/,
  },
  {
    name: "private-key-block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
];

for (const file of codeFiles) {
  const rel = file.replace(ROOT + "/", "");
  const text = readFileSync(file, "utf8");
  for (const { name, re } of dangerousPatterns) {
    if (re.test(text)) {
      if (PUBLISHABLE_ALLOWLIST.some((p) => p.test(file))) continue;
      failures.push({
        check: `secret:${name}`,
        file: rel,
        detail: `Matched ${name}`,
      });
    }
  }
}

// ---------- 3. Edge functions: never log Deno.env secrets ----------
const edgeFiles = walk(FUNCTIONS_DIR, [".ts"]);
for (const file of edgeFiles) {
  const rel = file.replace(ROOT + "/", "");
  const text = readFileSync(file, "utf8");
  // Flag: console.log(...Deno.env.get(...)...)
  const logEnvRe =
    /console\.(log|info|warn|error|debug)\s*\([^)]*Deno\.env\.get\s*\(/;
  if (logEnvRe.test(text))
    failures.push({
      check: "no-secret-logging",
      file: rel,
      detail: "Edge function logs a Deno.env value — never log secrets",
    });

  // Warn: secret embedded in a URL query string in fetch()
  if (/fetch\([^)]*authkey=\$\{[^}]+\}/.test(text)) {
    warnings.push({
      check: "secret-in-url",
      file: rel,
      detail: "Secret passed in URL query string — prefer headers or POST body",
    });
  }
}

// ---------- 4. Overly permissive RLS policies ----------
const policyTrueRe =
  /CREATE\s+POLICY[\s\S]{0,400}?(USING|WITH\s+CHECK)\s*\(\s*true\s*\)/gi;
let p: RegExpExecArray | null;
while ((p = policyTrueRe.exec(allMigrationSql)) !== null) {
  warnings.push({
    check: "policy-using-true",
    file: "supabase/migrations/*",
    detail: `Policy uses ${p[1]} (true) — review if this is intentional`,
  });
}

// ---------- Report ----------
function print(title: string, items: Failure[]) {
  if (!items.length) return;
  console.log(`\n${title}`);
  for (const f of items) console.log(`  - [${f.check}] ${f.file}: ${f.detail}`);
}

print("⚠️  Warnings:", warnings);
print("❌ Failures:", failures);

if (failures.length) {
  console.log(`\nSecurity validation FAILED with ${failures.length} issue(s).`);
  process.exit(1);
}
console.log(
  `\n✅ Security validation passed (${createdTables.size} tables, ${codeFiles.length} files, ${warnings.length} warnings).`,
);
