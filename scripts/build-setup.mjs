// scripts/build-setup.mjs — يولّد supabase/setup.sql و lib/setup-sql.ts من supabase/setup.src.sql
// كل عبارة تُغلَّف بكتلة DO تسجّل خطأها في setup_log بدل إيقاف التهيئة كلها (آمنة لإعادة التنفيذ).
// التشغيل: node scripts/build-setup.mjs   (يعمل تلقائياً قبل next build عبر prebuild)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const PART_LIMIT = 11000; // حدّ حجم الجزء الواحد (اللصق على الهاتف يُقصّ عند ~20 ألف حرف)

const PREAMBLE = [
  "create table if not exists setup_log (id serial primary key, step text, error text, at timestamptz default now());",
  "alter table setup_log enable row level security;",
  "create or replace function setup_fail(s text, e text) returns void language sql as $$ insert into setup_log (step, error) values (s, e) $$;",
];
const FINAL_SELECT =
  "select 'تمت التهيئة — ' || coalesce((select string_agg(step || ' → ' || error, E'\\n') from setup_log), 'بلا أخطاء') as result;";
const partSelect = (i, n) =>
  `select 'الجزء ${i} من ${n} — ' || coalesce((select string_agg(step || ' → ' || error, E'\\n') from setup_log), 'بلا أخطاء') as result;`;

/** يقسّم النص إلى عبارات على «;» مع احترام الاقتباسات والتعليقات و$tag$ */
export function splitStatements(src) {
  const out = [];
  let i = 0, start = -1;
  const n = src.length;
  const begin = () => { if (start < 0) start = i; };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "-" && d === "-") { // تعليق سطري
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && d === "*") { // تعليق كتلي
      const e = src.indexOf("*/", i + 2);
      i = e < 0 ? n : e + 2;
      continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    if (c === ";") {
      if (start >= 0) { out.push(src.slice(start, i).trim()); start = -1; }
      i++;
      continue;
    }
    begin();
    if (c === "'") { // نص مقتبس
      i++;
      while (i < n) {
        if (src[i] === "'" && src[i + 1] === "'") { i += 2; continue; }
        if (src[i] === "'") break;
        i++;
      }
      i++;
      continue;
    }
    if (c === '"') { // معرّف مقتبس
      i++;
      while (i < n && src[i] !== '"') i++;
      i++;
      continue;
    }
    if (c === "$") { // $tag$ ... $tag$
      const m = /^\$([A-Za-z_\u0600-\u06FF][\w\u0600-\u06FF]*)?\$/.exec(src.slice(i, i + 64));
      if (m) {
        const tag = m[0];
        const e = src.indexOf(tag, i + tag.length);
        i = e < 0 ? n : e + tag.length;
        continue;
      }
    }
    i++;
  }
  if (start >= 0) { const t = src.slice(start).trim(); if (t) out.push(t); }
  return out;
}

export function wrap(stmt) {
  const label = stmt.replace(/\s+/g, " ").slice(0, 50).replace(/'/g, "''");
  return `do $s$ begin ${stmt}; exception when others then perform setup_fail('${label}', sqlerrm); end $s$;`;
}

export function build(src, limit = PART_LIMIT) {
  const wrapped = splitStatements(src).map(wrap);
  const head = (i, n) => `-- خيال — setup الجزء ${i} من ${n}: الصقه كاملاً في SQL Editor ثم Run، ثم انتقل للجزء التالي بالترتيب. آمن لإعادة التنفيذ.`;
  // تجميع الأجزاء بالحجم
  const groups = [[]];
  let size = 0;
  for (const w of wrapped) {
    if (size + w.length > limit && groups[groups.length - 1].length) { groups.push([]); size = 0; }
    groups[groups.length - 1].push(w);
    size += w.length + 1;
  }
  const N = groups.length;
  const parts = groups.map((g, k) => {
    const lines = [head(k + 1, N), ...PREAMBLE];
    if (k === 0) lines.push("truncate setup_log;");
    lines.push(...g, partSelect(k + 1, N));
    return lines.join("\n") + "\n";
  });
  const full =
    "-- خيال — setup.sql (كامل، مُولَّد من setup.src.sql). على الهاتف استخدم الأجزاء setup-1..N.sql لأن اللصق يُقصّ عند ~20 ألف حرف.\n" +
    [...PREAMBLE, "truncate setup_log;", ...wrapped, FINAL_SELECT].join("\n") + "\n";
  return { full, parts };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const root = join(fileURLToPath(import.meta.url), "..", "..");
  const src = readFileSync(join(root, "supabase/setup.src.sql"), "utf8");
  const { full, parts } = build(src);
  writeFileSync(join(root, "supabase/setup.sql"), full);
  writeFileSync(
    join(root, "lib/setup-sql.ts"),
    "// مُولَّد من supabase/setup.src.sql عبر scripts/build-setup.mjs — لا تعدّله يدوياً\n" +
      `export const SETUP_PARTS: string[] = ${JSON.stringify(parts)};\n` +
      `export const SETUP_SQL = ${JSON.stringify(full)};\n`
  );
  console.log(`setup: ${splitStatements(src).length} عبارة، ${parts.length} أجزاء، ${full.length} حرفاً`);
}
