# Title artwork sources

These masks preserve the sourced wordmark silhouettes, including the connected serifs and letter spacing. They are used only to position falling glyphs. Release years are separate browser text.

| Film | Source | Original asset |
| --- | --- | --- |
| The Matrix | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:The_Matrix_(franchise_logo).svg), attributed there to Warner Bros. | [SVG](https://commons.wikimedia.org/wiki/Special:FilePath/The%20Matrix%20(franchise%20logo).svg), 509 × 99 |
| The Matrix Reloaded | [TMDB logos](https://www.themoviedb.org/movie/604-the-matrix-reloaded/images/logos), uploaded by Simon_H | [PNG](https://image.tmdb.org/t/p/original/n4ZWRLXdndwzTUF9no5An006Yf4.png), 2000 × 513 |
| The Matrix Revolutions | [TMDB logos](https://www.themoviedb.org/movie/605-the-matrix-revolutions/images/logos), uploaded by gustavohdh | [PNG](https://image.tmdb.org/t/p/original/vMOWKUoME0s8HtbXxGzvIJknUHX.png), 3000 × 720 |

Retrieved 22 October 2026. These are sourced reproductions of the film lettering, not newly drawn letterforms or a claim of a pixel-identical recreation of every theatrical title treatment.

## Preparation

[wordmarks.js](../wordmarks.js) embeds three data URLs in trilogy order. The SVG is embedded unchanged. Each PNG's alpha channel was cropped to its non-transparent bounds and proportionally reduced to a maximum width of 1024 pixels with Pillow's Lanczos resampling. White RGB with that alpha channel was saved as an optimised RGBA PNG. Colours and textures are unnecessary because the animation samples opacity and supplies its own glyph colours.

Embedding the artwork allows direct opening of the HTML file without cross-origin canvas restrictions. No external artwork requests or runtime dependencies are needed. If an image cannot decode, its film uses the previous text mask.

Original source SHA-256 hashes:

```text
matrix.svg          02972a9bb9ca0226fe4099e8b63e80f5ccc76de0b54db1677832f0efba0a9f1f
reloaded-solid.png  83277bdaee10d3434710342d11fb4ded99a95e2abb446fa108099e349c472de7
revolutions.png     2322dc5c4256a70b90194df0071eda1101dec94d0f04b0063df0ab1113a30347
```

## Rights notes

Wikimedia labels the main wordmark PD-textlogo and also marks it as a trademark. The sequel images are sourced from TMDB; no open-content licence for those images was verified. Download availability is not a licence grant. Film names and marks belong to their respective owners; this source record does not assert ownership, endorsement or additional reuse rights.
