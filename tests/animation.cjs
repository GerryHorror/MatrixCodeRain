// Run with: node tests/animation.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { setTransform() {}, fillRect() {}, fillText() {}, clearRect() {} };
const canvas = { getContext: () => context, addEventListener() {}, removeEventListener() {} };
const preference = { matches: false, addEventListener() {}, removeEventListener() {} };
const sandbox = {
    console, Math,
    window: { innerWidth: 800, innerHeight: 600, devicePixelRatio: 2,
        matchMedia: () => preference, addEventListener() {}, removeEventListener() {} },
    document: { getElementById: () => canvas, addEventListener() {}, removeEventListener() {} },
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
console.log('Animation checks passed: timing, pause, pixel density, glyph grid, reduced motion.');
