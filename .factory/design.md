# ScopeStamp visual system

## Direction: the field notebook becomes evidence

ScopeStamp looks like the working notebook a careful consultant brings to a site
visit: warm graph paper, blue-black ink, numbered entries, red proof marks and
physical tabs. It is deliberately more procedural than a proposal template and
more human than a CRM. The page texture and ruled baselines help explain that
each acceptance is an entry in a continuous record rather than disposable UI
chrome.

The visual test is: “could I find the agreed scope in this during a tense phone
call?” Decoration must reinforce sequence, provenance or status. There is no
generic gradient, glass card grid or decorative dashboard chart.

## Palette

Light is the primary treatment, like a notebook under a desk lamp. Dark mode is
an ink-negative night-desk treatment rather than a recolor.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| paper | `#F4F0E5` | `#171B1D` | page/background |
| sheet | `#FFFDF7` | `#202629` | raised working sheet |
| ink | `#172B36` | `#F4F0E5` | primary text |
| graphite | `#52616A` | `#B7C2C5` | supporting text |
| rule | `#BCC7C1` | `#465357` | rules and outlines |
| blueprint | `#0B5E75` | `#70C4D8` | primary action/focus |
| proof red | `#A43C32` | `#F19283` | warnings, declined, proof marks |
| field green | `#396947` | `#83C792` | accepted/verified |
| amber tape | `#D4A63A` | `#E9C361` | pending/offline/update |

All body/text combinations meet WCAG AA. Status always has a word and symbol;
color is never its only carrier.

## Type and measures

- Headings and record numerals: Georgia, `Times New Roman`, serif. The bookish
  contrast makes immutable records feel authored without importing a font.
- UI and body: `ui-rounded`, `Avenir Next`, `Segoe UI`, system sans-serif.
- Body is 16–18px at 1.55 line height; labels are never below 13px. Financial
  values and hashes use tabular figures / `ui-monospace`.
- Long text stops at 68 characters. The application shell tops out at 1180px.

No external fonts are used, keeping first load private and fast.

## Spacing and shape

The base unit is 4px; common gaps are 8, 12, 16, 24, 32 and 48px. Corners are
2–8px, like clipped paper and labels—not bubbly SaaS cards. Sheets use a hard
2px offset shadow. Independent quotes and change cards may be boxed; related
form fields are grouped by whitespace and ruled headings instead.

Desktop uses a 240px index rail and a flexible workbench. At 760px the rail
becomes a compact top index, two-column forms stack, tables become labelled
rows, and sticky controls respect safe-area insets. Every target is at least
44px.

## Interaction grammar

- Primary actions resemble a dark fountain-pen stamp: solid blueprint ink,
  square-ish edge, short pressed translation.
- Pending client action is marked with an amber “paper tab”; accepted and
  declined use an explicit stamped word plus icon.
- Hashes and timestamps sit in marginal notes, visually quieter but always
  available. Opening “Record details” reveals the full provenance.
- Destructive actions name the exact quote and require confirmation. Draft
  edits autosave locally; locked revisions cannot be silently edited.
- Toasts are short taped notes at the lower edge and use an `aria-live` region.

## Motion

State changes use 160–220ms opacity and transform: sheets lift by 2px, tabs
slide from their physical edge, and the acceptance stamp settles once. There
are no loops. Under `prefers-reduced-motion: reduce`, transitions and movement
are removed and state changes are communicated instantly with text and border.

## Illustration and assets

The hero illustration is an original overhead still life: an open graph-paper
field notebook showing abstract scope blocks, a brass date stamp, carbon-copy
slip and pencil on a worn worktable. The right side remains calm enough to sit
behind/alongside product copy. It communicates “specific record, deliberately
accepted” without showing a fake UI or readable contract.

Prompt sheet:

- Subject: open graph notebook, numbered abstract entries, red approval stamp,
  brass date stamp, carbon-copy slip, carpenter pencil.
- World/materials: honest paper fibre, graphite, ink, worn oak, small pieces of
  amber drafting tape.
- Light/lens: warm north-window light, overhead editorial still life, 50mm,
  crisp centre with gentle falloff.
- Palette words: warm ivory, blue-black ink, muted blueprint teal, proof red,
  amber tape, field green.
- Negative list: no people or hands, no logos, no legible text, no watermark,
  no signature, no computer screen, no glossy 3D, no gradient background.

Asset provenance:

- `public/assets/scopestamp-notebook.webp` (and AVIF/PNG source) generated for
  ScopeStamp with Azure OpenAI image generation (`factory-image`) on
  2026-08-28 using the prompt sheet above. Original AI-generated artwork; no
  third-party marks or source material. The retained generation prompt is in
  `assets/src/scopestamp-notebook.prompt.json`.
- App icons and UI glyphs are hand-authored SVG/CSS shapes in this repository,
  MIT licensed with the product.

## Accessibility and performance intent

Focus is a 3px blueprint outline with a 3px paper offset. Print removes chrome,
preserves the acceptance record and renders black on white. The hero has fixed
dimensions and responsive sources; mobile WebP stays below 300KB. Initial JS
is capped at 200KB and CSS at 50KB. Notebook ruling is CSS, so it adds no
request or accessibility noise.
