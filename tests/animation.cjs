// Run with: node tests/animation.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { setTransform() {}, fillRect() {}, fillText() {}, clearRect() {},
    createRadialGradient: () => ({ addColorStop() {} }),
    drawImage(image, x, y, width, height) { if (width !== undefined) this.lastArtwork = { image, x, y, width, height }; },
    getImageData: () => ({ data: new Uint8ClampedArray(800 * 600 * 4).fill(255) }) };
const canvas = { getContext: () => context, addEventListener() {}, removeEventListener() {},
    setAttribute(name, value) { this[name] = value; } };
const preference = { matches: false, addEventListener() {}, removeEventListener() {} };
const sandbox = {
    console, Math,
    window: { innerWidth: 800, innerHeight: 600, devicePixelRatio: 2,
        matchMedia: () => preference, addEventListener() {}, removeEventListener() {} },
    document: { getElementById: () => canvas, querySelector: () => null, createElement: () => ({ getContext: () => context }),
        addEventListener() {}, removeEventListener() {} },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('script.js', 'utf8') + '\nthis.MatrixRain = MatrixRain; this.MatrixColumn = MatrixColumn;', sandbox);

const rain = new sandbox.MatrixRain('matrixCanvas');
assert.equal(canvas.width, 1600);
assert.equal(canvas.height, 1200);
assert.equal(rain.columns.length, 40);

function framesAt(hz) {
    let frames = 0;
    rain.draw = () => frames++;
    rain.lastTime = null;
    rain.accumulator = 0;
    for (let i = 0; i <= hz * 2; i++) rain.animate(i * 1000 / hz);
    return frames;
}
assert.ok(Math.abs(framesAt(60) - framesAt(144)) <= 1, 'refresh rate must not change simulation speed');
rain.isPaused = true;
assert.equal(framesAt(60), 0, 'pause must freeze simulation');

const column = new sandbox.MatrixColumn(0, 600);
column.y = 0;
column.speed = 1.5;
column.update(3);
assert.equal(column.trail.length, 4);
assert.ok(column.trail.every(char => Number.isInteger(char.y)), 'glyphs must stay on the grid');
preference.matches = true;
const still = new sandbox.MatrixRain('matrixCanvas');
assert.equal(still.isPaused, true, 'reduced motion starts paused');
assert.equal(still.sequenceTime, 8, 'reduced motion shows the settled title');
assert.ok(still.titleGlyphs.length > 0);
preference.matches = false;
const moving = new sandbox.MatrixRain('matrixCanvas');
for (let i = 0; i < 225; i++) moving.draw();
assert.ok(moving.sequenceTime > 7 && moving.sequenceTime < 8, 'title reaches its hold');
moving.isPaused = true;
const pausedAt = moving.sequenceTime;
moving.draw();
assert.equal(moving.sequenceTime, pausedAt);
moving.handleResize();
assert.equal(moving.sequenceTime, pausedAt, 'resize preserves the sequence phase');
moving.isPaused = false;
for (let i = 0; i < 225; i++) moving.draw();
assert.ok(moving.sequenceTime < 0.1 || moving.sequenceTime > 14.9, 'sequence loops');
moving.reset();
assert.equal(moving.sequenceTime, 0, 'reset restarts the sequence');
assert.equal(moving.filmIndex, 0);
for (const [index, label] of [[1, 'RELOADED (2003)'], [2, 'REVOLUTIONS (2003)'], [0, 'THE MATRIX (1999)']]) {
    const previousIndex = moving.filmIndex;
    for (let i = 0; i < 452 && moving.filmIndex === previousIndex; i++) moving.draw();
    assert.equal(moving.filmIndex, index, 'films cycle in trilogy order');
    assert.ok(canvas['aria-label'].includes(label), 'accessible title matches the current film');
    moving.isPaused = true;
    moving.handleResize();
    assert.equal(moving.filmIndex, index, 'resize preserves the current film');
    moving.isPaused = false;
}
moving.filmIndex = 2;
moving.reset();
assert.equal(moving.filmIndex, 0, 'reset returns to the first film');
const artwork = [{ naturalWidth: 509, naturalHeight: 99 }, null,
    { naturalWidth: 1024, naturalHeight: 246 }];
const branded = new sandbox.MatrixRain('matrixCanvas', artwork);
assert.equal(context.lastArtwork.image, artwork[0], 'uses the supplied wordmark');
for (const [width, height] of [[390, 844], [844, 390], [1280, 800]]) {
    sandbox.window.innerWidth = width;
    sandbox.window.innerHeight = height;
    branded.filmIndex = 2;
    branded.handleResize();
    const drawn = context.lastArtwork;
    assert.equal(drawn.image, artwork[2]);
    assert.ok(drawn.x >= 0 && drawn.x + drawn.width <= width, 'artwork fits horizontally');
    assert.ok(drawn.y >= 0 && drawn.y + drawn.height <= height, 'artwork fits vertically');
    assert.ok(Math.abs(drawn.width / drawn.height - 1024 / 246) < 0.001, 'preserves wordmark proportions');
}
context.lastArtwork = null;
branded.filmIndex = 1;
branded.createTitle();
assert.equal(context.lastArtwork, null, 'missing artwork uses the text fallback');
assert.ok(branded.titleGlyphs.length > 0);
const feed = new sandbox.MatrixColumn(0, 600);
feed.lag = 0.1;
feed.y = 1;
feed.targets = [{ y: 50, caughtAt: null }, { y: 70, caughtAt: null }];
feed.targetIndex = 0;
feed.getRandomSymbol = () => 'Z';
moving.sequenceTime = 5;
feed.update(0, 2, source => moving.captureColumn(feed, source));
assert.equal(feed.targets[0].caughtAt, null, 'a title cannot catch a character before the stream reaches it');
feed.update(0, 3, source => moving.captureColumn(feed, source));
assert.equal(feed.targets[0].symbol, 'Z', 'title inherits the emitted rain character');
assert.ok(feed.targets[0].caughtAt !== null);
assert.equal(feed.targets[1].caughtAt, null);
assert.ok(!feed.trail.some(character => character.y === 3), 'caught character leaves the rain trail');
feed.update(0, 4, source => moving.captureColumn(feed, source));
assert.equal(feed.targets[1].symbol, 'Z');
moving.isPaused = true;
const positions = moving.columns.map(column => column.y);
moving.draw();
assert.deepEqual(moving.columns.map(column => column.y), positions, 'paused drawing must not move source streams');
moving.isPaused = false;
moving.sequenceTime = 6;
moving.filmIndex = 0;
moving.createTitle();
assert.ok(moving.titleGlyphs.some(glyph => glyph.caughtAt === null), 'first film is still forming at six seconds');
moving.filmIndex = 1;
moving.createTitle();
assert.ok(moving.titleGlyphs.every(glyph => glyph.caughtAt !== null), 'Reloaded forms sooner');
assert.ok(moving.distantColumns.every(column => column.fontSize < 20 && column.speed < 0.5), 'distant streams are smaller and slower');
moving.isPaused = true;
moving.filmIndex = 0;
moving.changeFilm(-1);
assert.equal(moving.filmIndex, 2, 'previous wraps to Revolutions');
assert.equal(moving.isPaused, true, 'navigation preserves pause');
assert.equal(moving.sequenceTime, 8, 'paused navigation shows a settled title');
moving.changeFilm(1);
assert.equal(moving.filmIndex, 0, 'next wraps to The Matrix');
moving.reset();
assert.equal(moving.sequenceTime, 8, 'paused reset shows the first title');
moving.handleKeyPress({ key: ' ', target: { closest: selector => selector === 'button, a' }, preventDefault() { throw Error('native button activation intercepted'); } });
assert.equal(moving.isPaused, true, 'Space on a button is handled by the native button');
const headBefore = moving.columns[0].y;
moving.handleMouseMove({ clientX: 1, clientY: 500 });
assert.equal(moving.columns[0].y, headBefore, 'pointer cannot move a paused stream');
console.log('Animation checks passed, including real stream capture, removal from trails, pause, film pacing, depth, artwork fit and fallback.');
