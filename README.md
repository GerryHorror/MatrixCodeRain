# Matrix Code Rain

A small canvas tribute to the original Matrix trilogy, built with plain HTML, CSS and JavaScript.

Falling code gathers into each film's title and year, holds, then falls away:

1. **THE MATRIX (1999)**
2. **THE MATRIX RELOADED (2003)**
3. **THE MATRIX REVOLUTIONS (2003)**

Background rain continues through the sequence. Each film takes 15 seconds: three seconds of rain, four of formation, three holding the title, two releasing it, then three of rain. The full trilogy repeats every 45 seconds.

## Run

Open [index.html](./index.html) in a browser. No installation or build step is needed.

For a local server, run `python3 -m http.server 8765` and open <http://localhost:8765>.

## Controls

| Input | Action |
| --- | --- |
| Space or P | Pause or resume the whole sequence |
| C | Cycle colour schemes |
| Up / + | Increase background rain speed |
| Down / - | Decrease background rain speed |
| R | Restart from THE MATRIX (1999) |
| Mouse | Move a background rain column |
| ? button | Show controls; Escape closes them |

Title timing stays fixed when rain speed changes. Resizing preserves the current film and sequence phase and rebuilds the glyph layout for the new screen size. Screens requesting reduced motion start with a still first title; Space explicitly starts animation.

## Verification

Run `node --check script.js` and `node tests/animation.cjs`.

The focused checks cover refresh-rate-independent timing, pause, pixel density, grid spacing, reduced motion, the title hold, resizing, trilogy order, accessible titles, looping, reset, artwork proportions and text fallback. They use a canvas stub; actual typography requires browser inspection.

Browser smoke verification covered all three films in order, their years, return to the first film, pause freezing the canvas, resizing while on a sequel, and absence of JavaScript errors. Desktop captures of both sequels and a phone capture of Revolutions were inspected. Earlier checks covered title release, reduced motion and controls opening and closing with Escape. Captures and browser session files stay local and are ignored by Git.

The wordmark pass also verified that all three artwork masks render, inspected settled titles at desktop and phone sizes, opened the page directly from disk with readable canvas pixels, and simulated failed image decoding to check the text fallback.

## Lettering

Each film uses sourced wordmark artwork as a mask, preserving its letter shapes, connected serifs, spacing and subtitle treatment. The rain renders those silhouettes using small glyphs rather than displaying the original images. Fine details are limited by glyph spacing and screen size; this is not a pixel-identical theatrical title recreation. Years remain browser text.

The masks are embedded locally, with no external fonts, image requests or build step. If artwork fails to decode, that film falls back to the previous browser text mask. See [artwork sources and preparation](./assets/wordmarks/SOURCES.md) for provenance and rights notes.
