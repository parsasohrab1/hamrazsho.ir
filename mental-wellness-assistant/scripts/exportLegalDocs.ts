/**
 * Writes the privacy policy and terms as standalone HTML pages into
 * ../store/legal/, for hosting at BRAND.privacyPolicyUrl / termsUrl (the
 * store listings must link to a public privacy policy URL). Generated from
 * src/data/legalDocs.ts so the website and the in-app text never differ.
 *
 *   npm run export:legal
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { PRIVACY_POLICY, TERMS_OF_USE, LegalDoc } from "@/data/legalDocs";
import { BRAND } from "@/config/brand";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const page = (doc: LegalDoc) => `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(doc.title)}</title>
<style>
  :root { color-scheme: light dark; --bg:#ffffff; --fg:#0f172a; --muted:#475569; --accent:${BRAND.colors.primary}; }
  @media (prefers-color-scheme: dark) { :root { --bg:${BRAND.colors.background}; --fg:${BRAND.colors.text}; --muted:${BRAND.colors.textMuted}; } }
  body { margin:0; background:var(--bg); color:var(--fg); font-family: Vazirmatn, Tahoma, sans-serif; line-height:1.9; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 1.6rem; margin: 0 0 4px; } h2 { font-size: 1.15rem; margin-top: 28px; color: var(--accent); }
  .updated { color: var(--muted); font-size: .9rem; } p { margin: 6px 0; }
</style>
</head>
<body><main>
<h1>${esc(doc.title)}</h1>
<div class="updated">آخرین به‌روزرسانی: ${esc(doc.updated)}</div>
${doc.sections.map((s) => `<h2>${esc(s.heading)}</h2>\n${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n")}`).join("\n")}
</main></body></html>
`;

const outDir = path.resolve(__dirname, "../../store/legal");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "privacy.html"), page(PRIVACY_POLICY));
writeFileSync(path.join(outDir, "terms.html"), page(TERMS_OF_USE));
console.log(`Wrote privacy.html and terms.html to ${outDir}`);
