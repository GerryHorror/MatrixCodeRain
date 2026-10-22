// Run with: node tests/animation.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { setTransform() {}, fillRect() {}, fillText() {}, clearRect() {},
    getImageData: () => ({ data: new Uint8ClampedArray(800 * 600 * 4).fill(255) }) };
const canvas = { getContext: () => context, addEventListener() {}, removeEventListener() {},
    setAttribute(name, value) { this[name] = value; } };
const preference = { matches: false, addEventListener() {}, removeEventListener() {} };
const sandbox = {
    console, Math,
    window: { innerWidth: 800, innerHeight: 600, devicePixelRatio: 2,
        matchMedia: () => preference, addEventListener() {}, removeEventListener() {} },
    document: { getElementById: () => canvas, createElement: () => ({ getContext: () => context }),
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
assert.equal(still.sequenceTime, 7, 'reduced motion shows the settled title');
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
console.log('Animation checks passed: timing, pause, pixel density, glyph grid, reduced motion, title hold, resize, loop, reset, trilogy order and accessible titles.');
