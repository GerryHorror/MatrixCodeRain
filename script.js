/**
 * Matrix Code Rain Animation
 * A modular implementation of the classic Matrix digital rain effect
 */

/**
 * Configuration constants for the animation
 */
const CONFIG = {
    FONT_SIZE: 20,
    RESET_PROBABILITY: 0.95,
    MIN_SPEED: 0.5,
    MAX_SPEED: 1.5,
    DEFAULT_FPS: 30,
    SPEED_INCREMENT: 0.2,
    MIN_SPEED_MULTIPLIER: 0.3,
    MAX_SPEED_MULTIPLIER: 3.0
};

/**
 * Symbol sets for the matrix animation
 */
const SYMBOLS = {
    latin: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    katakana: "カキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
    get all() {
        return this.latin + this.katakana;
    }
};

const FILMS = [
    { subtitle: "", year: "1999", formAt: 3, formFor: 4, releaseAt: 10, releaseFor: 2, sweep: 1.3, stagger: 0.3 },
    { subtitle: "RELOADED", year: "2003", formAt: 2, formFor: 3, releaseAt: 9, releaseFor: 2, sweep: 0.8, stagger: 0.15 },
    { subtitle: "REVOLUTIONS", year: "2003", formAt: 3, formFor: 4, releaseAt: 10, releaseFor: 3, sweep: 1.1, stagger: 0.9 }
];

/**
 * Colour schemes for the animation
 */
const COLOUR_SCHEMES = {
    classic: {
        name: "Classic Green",
        head: "#FFFFFF",
        body: "#00FF00",
        tail: "#003300"
    },
    bright: {
        name: "Bright Matrix",
        head: "#FFFFFF",
        body: "#00FF41",
        tail: "#008F11"
    },
    cyber: {
        name: "Cyber Blue",
        head: "#FFFFFF",
        body: "#00FFFF",
        tail: "#0066AA"
    },
    amber: {
        name: "Amber Terminal",
        head: "#FFFFFF",
        body: "#FFAA00",
        tail: "#664400"
    }
};

/**
 * Represents a single column of falling characters in the matrix animation
 */
class MatrixColumn {
    /**
     * Creates a new matrix column
     * @param {number} x - The x position (column index)
     * @param {number} canvasHeight - The height of the canvas
     */
    constructor(x, canvasHeight, fontSize = CONFIG.FONT_SIZE) {
        this.x = x;
        this.fontSize = fontSize;
        this.reset(canvasHeight);
        this.speed = CONFIG.MIN_SPEED + Math.random() * (CONFIG.MAX_SPEED - CONFIG.MIN_SPEED);
        this.trail = [];
        this.trailLength = 15 + Math.floor(Math.random() * 10);
        this.baseTrailLength = this.trailLength;
    }

    /**
     * Resets the column to start from the top
     * @param {number} canvasHeight - The height of the canvas
     */
    reset(canvasHeight) {
        this.y = Math.floor(Math.random() * canvasHeight / this.fontSize) * -1;
        this.trail = [];
    }

    /**
     * Updates the column position
     * @param {number} speedMultiplier - Global speed multiplier
     */
    update(speedMultiplier = 1.0, targetY = null, onRow = null) {
        const previousRow = Math.floor(this.y);
        this.y = targetY === null ? this.y + this.speed * speedMultiplier : targetY;

        // Update trail
        for (let row = Math.max(1, previousRow + 1); row <= Math.floor(this.y); row++) {
            const character = {
                y: row,
                symbol: this.getRandomSymbol()
            };
            if (onRow && onRow(character)) continue;
            this.trail.unshift(character);

            // Keep trail at specified length
            if (this.trail.length > this.trailLength) {
                this.trail.pop();
            }
        }
    }

    /**
     * Gets a random symbol from the symbol set
     * @returns {string} A random character
     */
    getRandomSymbol() {
        return SYMBOLS.all.charAt(Math.floor(Math.random() * SYMBOLS.all.length));
    }
}

/**
 * Main Matrix Rain Animation Controller
 */
class MatrixRain {
    /**
     * Initialises the matrix rain animation
     * @param {string} canvasId - The ID of the canvas element
     */
    constructor(canvasId, wordmarks = []) {
        this.wordmarks = wordmarks;
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with ID "${canvasId}" not found`);
        }

        this.context = this.canvas.getContext("2d");
        if (!this.context) {
            throw new Error("Unable to get 2D context from canvas");
        }

        this.columns = [];
        this.animationId = null;
        this.isPaused = false;
        this.currentScheme = "bright";
        this.mouseColumn = null;
        this.speedMultiplier = 1.0;
        this.lastTime = null;
        this.accumulator = 0;
        this.filmIndex = 0;
        this.motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
        this.isPaused = this.motionPreference.matches;
        this.sequenceTime = this.isPaused ? 8 : 0;

        this.initialise();
        this.setupEventListeners();
        this.start();
        if (this.isPaused) this.draw();
    }

    /**
     * Initialises the canvas and column arrays
     */
    initialise() {
        this.resizeCanvas();
        this.createColumns();
        this.createTitle();
    }

    /** Sample a text mask into glyphs that fall, settle, then rejoin the rain. */
    createTitle() {
        const film = FILMS[this.filmIndex];
        const mask = document.createElement("canvas");
        mask.width = this.width;
        mask.height = this.height;
        const ink = mask.getContext("2d");
        const size = Math.min(this.width / 4.5, this.height / 3, 180);
        ink.textAlign = "center";
        ink.textBaseline = "middle";
        ink.fillStyle = "white";
        const wordmark = this.wordmarks[this.filmIndex];
        if (wordmark) {
            const width = Math.min(this.width * 0.88, this.height * 2, 1100);
            const height = width * wordmark.naturalHeight / wordmark.naturalWidth;
            const top = this.height / 2 - height / 2 - size * 0.25;
            ink.drawImage(wordmark, (this.width - width) / 2, top, width, height);
            ink.font = `bold ${Math.max(22, size * 0.35)}px monospace`;
            ink.fillText(film.year, this.width / 2, top + height + size * 0.45);
        } else {
            // Keep the sequence usable if a local artwork asset cannot decode.
            const centreY = this.height / 2 - (film.subtitle ? size * 0.22 : 0);
            ink.font = `bold ${size * 0.34}px serif`;
            ink.fillText("THE", this.width / 2, centreY - size * 0.56);
            ink.font = `bold ${size}px serif`;
            ink.fillText("MATRIX", this.width / 2, centreY + size * 0.12);
            if (film.subtitle) {
                ink.font = `bold ${size * 0.5}px monospace`;
                ink.fillText(film.subtitle, this.width / 2, centreY + size * 0.85);
            }
            ink.font = `bold ${size * 0.4}px monospace`;
            ink.fillText(film.year, this.width / 2, centreY + size * (film.subtitle ? 1.5 : 0.9));
        }
        const pixels = ink.getImageData(0, 0, mask.width, mask.height).data;
        this.titleMask = mask;
        this.tintTitle();
        this.titleCell = wordmark ? Math.max(1.5, Math.min(4, size / 40)) : Math.max(3, Math.min(8, size / 18));
        this.titleGlyphs = [];
        this.columns.forEach(column => {
            column.trailLength = Math.round(column.baseTrailLength * (this.filmIndex === 1 ? 1.4 : 1));
            column.targets = [];
            column.targetIndex = 0;
        });
        for (let y = this.titleCell; y < this.height; y += this.titleCell) {
            for (let x = this.titleCell; x < this.width; x += this.titleCell) {
                if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] < 128) continue;
                const column = this.columns[Math.min(this.columns.length - 1, Math.floor(x / CONFIG.FONT_SIZE))];
                const glyph = { x, y, column, caughtAt: null, symbol: "",
                    release: (y / this.height * 0.65 + column.lag * 0.35) * film.stagger };
                this.titleGlyphs.push(glyph);
                column.targets.push(glyph);
            }
        }
        this.streamsPrepared = false;
        this.formationComplete = false;
        if (this.sequenceTime >= film.formAt) this.formTitle();
        this.titleShade = this.context.createRadialGradient(this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, Math.max(this.width * 0.55, this.height * 0.35));
        this.titleShade.addColorStop(0, "rgba(0, 0, 0, 0.8)");
        this.titleShade.addColorStop(1, "rgba(0, 0, 0, 0)");
        const title = `THE MATRIX${film.subtitle ? " " + film.subtitle : ""} (${film.year})`;
        this.canvas.setAttribute("aria-label", `Digital rain forms ${title}, holds, then falls away. Use Space to pause or resume.`);
        this.onStateChange?.();
    }

    tintTitle() {
        this.titleGlow = document.createElement("canvas");
        this.titleGlow.width = this.width;
        this.titleGlow.height = this.height;
        const glow = this.titleGlow.getContext("2d");
        glow.drawImage(this.titleMask, 0, 0);
        glow.globalCompositeOperation = "source-in";
        glow.fillStyle = COLOUR_SCHEMES[this.currentScheme].body;
        glow.fillRect(0, 0, this.width, this.height);
    }

    /** Sweep the existing streams through the mask, catching their real characters. */
    formTitle() {
        const film = FILMS[this.filmIndex];
        if (!this.streamsPrepared) {
            this.columns.forEach(column => {
                column.y = -column.lag * this.height / CONFIG.FONT_SIZE;
                column.trail = [];
            });
            this.streamsPrepared = true;
        }
        const progress = Math.min(1, Math.max(0, (this.sequenceTime - film.formAt) / film.formFor)) ** film.sweep;
        this.columns.forEach(column => {
            const end = this.height / CONFIG.FONT_SIZE + 1;
            column.update(0, end * (progress * (1 + column.lag) - column.lag),
                character => this.captureColumn(column, character));
        });
        this.formationComplete = progress >= 1;
    }

    captureColumn(column, source) {
        let consumed = false;
        while (column.targetIndex < column.targets.length) {
            const glyph = column.targets[column.targetIndex];
            if (glyph.y > source.y * CONFIG.FONT_SIZE) break;
            glyph.symbol = source.symbol;
            const film = FILMS[this.filmIndex];
            const phase = (source.y / (this.height / CONFIG.FONT_SIZE + 1) + column.lag) / (1 + column.lag);
            glyph.caughtAt = Math.min(this.sequenceTime, film.formAt + phase ** (1 / film.sweep) * film.formFor);
            consumed = true;
            column.targetIndex++;
        }
        return consumed;
    }

    drawTitle() {
        const time = this.sequenceTime;
        const film = FILMS[this.filmIndex];
        if (time < film.formAt || time >= film.releaseAt + film.releaseFor) return;
        const ctx = this.context;
        const scheme = COLOUR_SCHEMES[this.currentScheme];
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const resolved = Math.min(1, Math.max(0, (time - film.formAt - film.formFor) / 0.6));
        if (resolved > 0 && time < film.releaseAt) {
            ctx.globalAlpha = resolved * 0.32;
            ctx.shadowColor = scheme.body;
            ctx.shadowBlur = 9;
            ctx.drawImage(this.titleGlow, 0, 0);
            ctx.shadowBlur = 0;
        }
        for (const glyph of this.titleGlyphs) {
            if (glyph.caughtAt === null) continue;
            const settle = Math.min(1, Math.max(0, (time - glyph.caughtAt) / 0.4));
            const released = Math.max(0, time - film.releaseAt - glyph.release);
            const fall = released * released * this.height * (this.filmIndex === 2 ? 0.55 : 1);
            const sourceX = glyph.column.x * CONFIG.FONT_SIZE;
            const x = sourceX + (glyph.x - sourceX) * settle * Math.max(0, 1 - released);
            const y = glyph.y + fall;
            if (y < 0 || y > this.height) continue;
            ctx.font = `${this.titleCell + (CONFIG.FONT_SIZE - this.titleCell) * (1 - settle)}px monospace`;
            ctx.globalAlpha = Math.max(0, 1 - released / film.releaseFor);
            ctx.fillStyle = settle < 1 || released > 0 ? scheme.head : scheme.body;
            ctx.fillText(glyph.symbol, x, y);
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
    }

    /**
     * Resizes the canvas to match the window size
     */
    resizeCanvas() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        const pixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(this.width * pixelRatio);
        this.canvas.height = Math.round(this.height * pixelRatio);
        this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    /**
     * Creates the column objects based on canvas width
     */
    createColumns() {
        const columnCount = Math.ceil(this.width / CONFIG.FONT_SIZE);
        this.columns = [];

        for (let i = 0; i < columnCount; i++) {
            const column = new MatrixColumn(i, this.height);
            column.lag = Math.random() * 0.35;
            this.columns.push(column);
        }
        this.distantColumns = Array.from({ length: Math.ceil(this.width / 28) }, (_, i) => {
            const column = new MatrixColumn(i * 28 / 12, this.height, 12);
            column.speed *= 0.3;
            column.y = Math.random() * this.height / 12;
            return column;
        });
    }

    /**
     * Sets up event listeners for user interaction
     */
    setupEventListeners() {
        // Window resize handler
        this.onResize = () => this.handleResize();
        window.addEventListener("resize", this.onResize);

        // Mouse movement handler
        this.onMouseMove = (e) => this.handleMouseMove(e);
        this.canvas.addEventListener("mousemove", this.onMouseMove);

        // Mouse leave handler
        this.onMouseLeave = () => {
            this.mouseColumn = null;
        };
        this.canvas.addEventListener("mouseleave", this.onMouseLeave);

        // Keyboard controls
        this.onKeyDown = (e) => this.handleKeyPress(e);
        document.addEventListener("keydown", this.onKeyDown);
        this.onMotionChange = (e) => {
            this.isPaused = e.matches;
            this.reset();
        };
        this.motionPreference.addEventListener("change", this.onMotionChange);
    }

    /**
     * Handles window resize events
     */
    handleResize() {
        this.resizeCanvas();
        this.createColumns();
        this.createTitle();
        if (this.isPaused) this.draw();
    }

    /**
     * Handles mouse movement over the canvas
     * @param {MouseEvent} e - The mouse event
     */
    handleMouseMove(e) {
        if (this.isPaused || (this.sequenceTime >= FILMS[this.filmIndex].formAt && !this.formationComplete)) return;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const columnIndex = Math.floor(mouseX / CONFIG.FONT_SIZE);

        if (columnIndex >= 0 && columnIndex < this.columns.length) {
            this.mouseColumn = columnIndex;
            this.columns[columnIndex].y = Math.floor(mouseY / CONFIG.FONT_SIZE);
        }
    }

    /**
     * Handles keyboard input for controls
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleKeyPress(e) {
        if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || document.querySelector("dialog[open]")) return;
        if (e.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
        if (e.key === " " && e.target?.closest?.("button, a")) return;
        switch(e.key.toLowerCase()) {
            case " ":
            case "p":
                // Spacebar or P key toggles pause
                e.preventDefault();
                this.togglePause();
                break;
            case "c":
                // C key cycles through colour schemes
                e.preventDefault();
                this.cycleColourScheme();
                break;
            case "r":
                // R key resets the animation
                e.preventDefault();
                this.reset();
                break;
            case "arrowleft":
            case "arrowright":
                e.preventDefault();
                this.changeFilm(e.key.toLowerCase() === "arrowleft" ? -1 : 1);
                break;
            case "arrowup":
            case "+":
            case "=":
                // Arrow up or + increases speed
                e.preventDefault();
                this.increaseSpeed();
                break;
            case "arrowdown":
            case "-":
            case "_":
                // Arrow down or - decreases speed
                e.preventDefault();
                this.decreaseSpeed();
                break;
        }
    }

    /**
     * Toggles the pause state of the animation
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        this.onStateChange?.();
        console.log(this.isPaused ? "Animation paused" : "Animation resumed");
    }

    /**
     * Cycles through available colour schemes
     */
    cycleColourScheme() {
        const schemeNames = Object.keys(COLOUR_SCHEMES);
        const currentIndex = schemeNames.indexOf(this.currentScheme);
        const nextIndex = (currentIndex + 1) % schemeNames.length;
        this.currentScheme = schemeNames[nextIndex];
        this.tintTitle();
        if (this.isPaused) this.draw();
        const schemeName = COLOUR_SCHEMES[this.currentScheme].name;
        console.log(`Colour scheme: ${schemeName}`);
    }

    /**
     * Increases the animation speed
     */
    increaseSpeed() {
        this.speedMultiplier = Math.min(
            CONFIG.MAX_SPEED_MULTIPLIER,
            this.speedMultiplier + CONFIG.SPEED_INCREMENT
        );
        console.log(`Speed: ${this.speedMultiplier.toFixed(1)}x`);
    }

    /**
     * Decreases the animation speed
     */
    decreaseSpeed() {
        this.speedMultiplier = Math.max(
            CONFIG.MIN_SPEED_MULTIPLIER,
            this.speedMultiplier - CONFIG.SPEED_INCREMENT
        );
        console.log(`Speed: ${this.speedMultiplier.toFixed(1)}x`);
    }

    /**
     * Resets all columns to their initial state
     */
    reset() {
        this.columns.forEach(column => column.reset(this.height));
        this.filmIndex = 0;
        this.sequenceTime = this.isPaused ? 8 : 0;
        this.createTitle();
        this.context.clearRect(0, 0, this.width, this.height);
        this.accumulator = 0;
        if (this.isPaused) this.draw();
        console.log("Animation reset");
    }

    changeFilm(direction) {
        this.filmIndex = (this.filmIndex + direction + FILMS.length) % FILMS.length;
        this.sequenceTime = this.isPaused ? 8 : 0;
        this.columns.forEach(column => column.reset(this.height));
        this.accumulator = 0;
        this.createTitle();
        this.draw();
    }

    /**
     * Starts the animation loop
     */
    start() {
        if (this.animationId === null) {
            this.animate();
        }
    }

    /**
     * Stops the animation loop
     */
    stop() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.lastTime = null;
    }

    /**
     * Main animation loop using requestAnimationFrame
     */
    animate(time) {
        const elapsed = this.lastTime === null || time === undefined ? 0 : Math.min(time - this.lastTime, 100);
        this.lastTime = time === undefined ? null : time;
        if (!this.isPaused) {
            this.accumulator += elapsed;
            const step = 1000 / CONFIG.DEFAULT_FPS;
            while (this.accumulator >= step) {
                this.draw();
                this.accumulator -= step;
            }
        }
        this.animationId = requestAnimationFrame((timestamp) => this.animate(timestamp));
    }

    /**
     * Draws a single frame of the animation
     */
    draw() {
        if (!this.isPaused) {
            this.sequenceTime += 1 / CONFIG.DEFAULT_FPS;
            if (this.sequenceTime >= 15) {
                this.sequenceTime -= 15;
                this.filmIndex = (this.filmIndex + 1) % FILMS.length;
                this.createTitle();
            }
        }
        const film = FILMS[this.filmIndex];
        const forming = this.sequenceTime >= film.formAt && this.sequenceTime <= film.formAt + film.formFor;
        const titleActive = this.sequenceTime >= film.formAt && this.sequenceTime < film.releaseAt + film.releaseFor;
        if (!this.isPaused) {
            if (this.sequenceTime >= film.formAt && !this.formationComplete) this.formTitle();
            for (const column of [...this.columns, ...this.distantColumns]) {
                if (!forming || column.fontSize !== CONFIG.FONT_SIZE) column.update(this.speedMultiplier);
                if ((!forming || column.fontSize !== CONFIG.FONT_SIZE) && (column.y - column.trailLength) * column.fontSize > this.height && Math.random() > CONFIG.RESET_PROBABILITY) {
                    column.reset(this.height);
                }
            }
        }
        this.context.fillStyle = "black";
        this.context.fillRect(0, 0, this.width, this.height);
        this.drawColumns(this.distantColumns, titleActive ? 0.09 : 0.16);
        this.drawColumns(this.columns, titleActive ? 0.48 : 0.85);
        if (titleActive) {
            this.context.globalAlpha = Math.min(1, (this.sequenceTime - film.formAt) / film.formFor);
            this.context.fillStyle = this.titleShade;
            this.context.fillRect(0, 0, this.width, this.height);
        }
        this.context.globalAlpha = 1;
        this.drawTitle();
    }

    drawColumns(columns, opacity) {
        const ctx = this.context;
        const scheme = COLOUR_SCHEMES[this.currentScheme];
        for (const column of columns) {
            ctx.font = `${column.fontSize === CONFIG.FONT_SIZE ? "bold " : ""}${column.fontSize}px monospace`;
            column.trail.forEach((character, index) => {
                ctx.globalAlpha = opacity * (1 - index / column.trailLength) ** 1.5;
                ctx.fillStyle = index === 0 && column.fontSize === CONFIG.FONT_SIZE ? scheme.head : scheme.body;
                ctx.fillText(character.symbol, column.x * column.fontSize, character.y * column.fontSize);
            });
        }
        ctx.globalAlpha = 1;
    }

    /**
     * Cleans up resources and stops the animation
     */
    destroy() {
        this.stop();
        window.removeEventListener("resize", this.onResize);
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
        this.canvas.removeEventListener("mouseleave", this.onMouseLeave);
        document.removeEventListener("keydown", this.onKeyDown);
        this.motionPreference.removeEventListener("change", this.onMotionChange);
    }
}

/**
 * UI Controller for managing the controls overlay
 */
class UIController {
    /**
     * Initialises the UI controller
     */
    constructor(rain) {
        this.rain = rain;
        this.overlay = document.querySelector(".controls-overlay");
        this.showButton = document.getElementById("showControls");
        this.closeButton = document.getElementById("closeControls");
        this.tools = document.querySelector(".viewing-controls");
        this.pauseButton = document.getElementById("togglePause");
        this.fullscreenButton = document.getElementById("toggleFullscreen");
        this.filmLabel = document.getElementById("currentFilm");
        this.message = document.getElementById("viewerMessage");
        this.rain.onStateChange = () => this.update();
        this.setupEventListeners();
        this.update();
        this.showTools();
    }

    /**
     * Sets up event listeners for UI controls
     */
    setupEventListeners() {
        this.showButton.addEventListener("click", () => this.showControls());
        this.closeButton.addEventListener("click", () => this.hideControls());
        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) this.hideControls();
        });
        this.overlay.addEventListener("close", () => {
            this.showButton.focus();
            this.showTools();
        });
        this.pauseButton.addEventListener("click", () => this.rain.togglePause());
        document.getElementById("previousFilm").addEventListener("click", () => this.rain.changeFilm(-1));
        document.getElementById("nextFilm").addEventListener("click", () => this.rain.changeFilm(1));
        this.fullscreenButton.disabled = !document.fullscreenEnabled;
        this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
        document.addEventListener("fullscreenchange", () => this.update());
        window.addEventListener("pointermove", () => this.showTools());
        window.addEventListener("pointerdown", () => this.showTools());
        document.addEventListener("focusin", () => this.showTools());
        document.addEventListener("keydown", (e) => {
            this.showTools();
            if (e.key.toLowerCase() === "f" && !e.repeat && !e.altKey && !e.ctrlKey && !e.metaKey && !this.overlay.open
                && !e.target?.closest?.("input, textarea, select, [contenteditable='true']")) {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
    }

    showControls() {
        this.overlay.showModal();
        this.showTools();
    }

    hideControls() {
        this.overlay.close();
    }

    update() {
        const film = FILMS[this.rain.filmIndex];
        this.filmLabel.textContent = `THE MATRIX${film.subtitle ? " " + film.subtitle : ""} · ${film.year}`;
        this.pauseButton.textContent = this.rain.isPaused ? "Play" : "Pause";
        this.pauseButton.setAttribute("aria-label", this.rain.isPaused ? "Resume animation" : "Pause animation");
        this.pauseButton.setAttribute("aria-pressed", String(this.rain.isPaused));
        this.fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen");
        if (this.rain.isPaused) this.showTools();
    }

    showTools() {
        clearTimeout(this.idleTimer);
        this.tools.classList.remove("controls-hidden");
        this.idleTimer = setTimeout(() => {
            if (!this.rain.isPaused && !this.overlay.open && !this.tools.contains(document.activeElement) && !this.tools.matches(":hover")) {
                this.tools.classList.add("controls-hidden");
            }
        }, 2500);
    }

    async toggleFullscreen() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
            this.message.textContent = "";
        } catch {
            this.message.textContent = "Fullscreen isn't available in this browser.";
            this.showTools();
        }
    }
}

/**
 * Initialise the application when the DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const wordmarks = typeof TITLE_WORDMARKS === "undefined" ? [] : await Promise.all(
            TITLE_WORDMARKS.map(async (source) => {
                const image = new Image();
                image.src = source;
                try {
                    await image.decode();
                    return image;
                } catch (error) {
                    console.warn("Title artwork unavailable; using text fallback", error);
                    return null;
                }
            })
        );
        // Initialise the matrix rain animation
        const matrixRain = new MatrixRain("matrixCanvas", wordmarks);

        // Initialise the UI controller
        new UIController(matrixRain);
    } catch (error) {
        console.error("Failed to initialise Matrix Rain:", error);
    }
});
