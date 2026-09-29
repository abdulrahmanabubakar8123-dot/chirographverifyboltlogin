// Verifies that every themed surface/text pairing is readable in BOTH themes.
// Reads the real :root / html.light blocks from index.css so it cannot drift.
import { readFileSync } from 'node:fs';

const css = readFileSync(process.argv[2], 'utf8');
const grab = (sel) => {
  const i = css.indexOf(sel);
  if (i < 0) throw new Error(`missing ${sel}`);
  const body = css.slice(i, css.indexOf('\n  }', i));
  const out = {};
  for (const m of body.matchAll(/--cv-([a-z0-9-]+):\s*([\d\s]+);/g))
    out[m[1]] = m[2].trim().split(/\s+/).map(Number);
  return out;
};

const srgb = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) =>
  0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const themes = { dark: grab(':root {'), light: grab('html.light {') };

// [label, foreground token, background token, WCAG AA minimum for body text]
const pairs = [
  ['body text on canvas', 'secondary', 'canvas', 4.5],
  ['headings on canvas', 'primary', 'canvas', 4.5],
  ['text on panel', 'secondary', 'surface-2', 4.5],
  ['headings on panel', 'primary', 'surface-2', 4.5],
  ['text on raised surface', 'secondary', 'surface-3', 4.5],
  ['headings on raised surface', 'primary', 'surface-3', 4.5],
  ['muted label on canvas', 'muted', 'canvas', 4.5],
  ['micro label on panel', 'text-micro', 'surface-2', 4.5],
  ['success on canvas', 'success-ink', 'canvas', 4.5],
  ['success on panel', 'success-ink', 'surface-2', 4.5],
  ['danger on canvas', 'danger', 'canvas', 4.5],
  ['warning on canvas', 'warning', 'canvas', 4.5],
];

let fail = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name.toUpperCase()}`);
  for (const [label, fg, bg, min] of pairs) {
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) fail++;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`,
    );
  }
}
console.log(fail ? `\n${fail} FAILING PAIR(S)` : '\nAll pairs pass in both themes.');

/*
 * Components-layer guard.
 *
 * The pairs above only compare TOKENS, so a component rule that hardcodes a
 * colour instead of using one is completely invisible to them. That is how
 * `hover:bg-white` on .btn-primary survived: its label is `text-canvas`, which
 * is white in the light theme, so hovering produced white-on-white (contrast
 * 1.0) and the button vanished. The same raw white appeared in
 * .plan-cta-primary.
 *
 * Every colour in this design system is meant to be a token, so the light theme
 * can repaint the whole console atomically (see the note in index.css). A bare
 * `bg-white` / `text-white` in the components layer breaks that invariant, so
 * fail the build. Alpha forms (`bg-white/20`, `bg-white/[0.06]`) are overlays,
 * not surface colours, and remain allowed.
 */
const componentsStart = css.indexOf('@layer components');
const components = componentsStart < 0 ? '' : css.slice(componentsStart);
const hardcoded = [];
for (const m of components.matchAll(/(bg|text)-white\b(?!\/)/g)) {
  const line = components.slice(0, m.index).split('\n').length;
  hardcoded.push(`  line ${line}: ${m[0]}`);
}

if (hardcoded.length) {
  console.log(
    `\nHARDCODED COLOUR IN COMPONENTS LAYER (${hardcoded.length}) — use a theme token:\n` +
      hardcoded.join('\n'),
  );
  fail += hardcoded.length;
}

process.exit(fail ? 1 : 0);
