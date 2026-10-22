# Matrix Code Rain

A small canvas tribute to the original Matrix trilogy, built with plain HTML, CSS and JavaScript.

The first sequence is **THE MATRIX (1999)**: falling code gathers into the title and year, holds, then falls away. Background rain continues through the sequence. The loop takes 15 seconds: three seconds of rain, four of formation, three holding the title, two releasing it, then three of rain.

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
| R | Restart the sequence |
| Mouse | Move a background rain column |
| ? button | Show controls; Escape closes them |

Title timing stays fixed when rain speed changes. Resizing preserves the current sequence phase and rebuilds the glyph layout for the new screen size. Screens requesting reduced motion start with a still title; Space explicitly starts animation.

## Verification

Run `node --check script.js` and `node tests/animation.cjs`.

The focused checks cover refresh-rate-independent timing, pause, pixel density, grid spacing, reduced motion, the title hold, resizing, looping and reset. They use a canvas stub; actual typography requires browser inspection.

Browser smoke verification covered title hold and release, pause freezing the canvas, controls opening and closing with Escape, and absence of JavaScript errors. Desktop and phone captures were inspected, including reduced motion. Captures and browser session files stay local and are ignored by Git.

## Next

Add **THE MATRIX RELOADED** and **THE MATRIX REVOLUTIONS** after reviewing the feel and readability of this first sequence. The title currently uses the browser's serif font as a glyph mask; it does not reproduce the film's custom lettering.
