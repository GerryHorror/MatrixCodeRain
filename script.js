/**
 * Matrix Code Rain Animation
 * A modular implementation of the classic Matrix digital rain effect
 */

/**
 * Configuration constants for the animation
 */
const CONFIG = {
    FONT_SIZE: 20,
    FADE_ALPHA: 0.05,
    RESET_PROBABILITY: 0.95,
    MIN_SPEED: 0.5,
    MAX_SPEED: 1.5,
    HEAD_BRIGHTNESS: 1.0,
    TRAIL_BRIGHTNESS: 0.6,
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
    constructor(x, canvasHeight) {
        this.x = x;
        this.reset(canvasHeight);
        this.speed = CONFIG.MIN_SPEED + Math.random() * (CONFIG.MAX_SPEED - CONFIG.MIN_SPEED);
        this.trail = [];
        this.trailLength = 15 + Math.floor(Math.random() * 10);
    }

    /**
     * Resets the column to start from the top
     * @param {number} canvasHeight - The height of the canvas
     */
    reset(canvasHeight) {
        this.y = Math.floor(Math.random() * canvasHeight / CONFIG.FONT_SIZE) * -1;
        this.trail = [];
    }

    /**
     * Updates the column position
     * @param {number} speedMultiplier - Global speed multiplier
     */
    update(speedMultiplier = 1.0) {
        const previousRow = Math.floor(this.y);
        this.y += this.speed * speedMultiplier;

        // Update trail
        for (let row = Math.max(1, previousRow + 1); row <= Math.floor(this.y); row++) {
            this.trail.unshift({
                y: row,
                symbol: this.getRandomSymbol()
            });

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
    constructor(canvasId) {
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
        this.motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
        this.isPaused = this.motionPreference.matches;

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
        const mask = document.createElement("canvas");
        mask.width = this.width;
        mask.height = this.height;
        const ink = mask.getContext("2d");
        const size = Math.min(this.width / 4.5, this.height / 3, 180);
        ink.textAlign = "center";
        ink.textBaseline = "middle";
        ink.fillStyle = "white";
        ink.font = `bold ${size * 0.34}px serif`;
        ink.fillText("THE", this.width / 2, this.height / 2 - size * 0.56);
        ink.font = `bold ${size}px serif`;
        ink.fillText("MATRIX", this.width / 2, this.height / 2 + size * 0.12);
        ink.font = `bold ${size * 0.4}px monospace`;
        ink.fillText("1999", this.width / 2, this.height / 2 + size * 0.9);
        const pixels = ink.getImageData(0, 0, mask.width, mask.height).data;
        this.titleCell = Math.max(3, Math.min(8, size / 18));
        this.titleGlyphs = [];
        for (let y = this.titleCell; y < this.height; y += this.titleCell) {
            for (let x = this.titleCell; x < this.width; x += this.titleCell) {
                if (pixels[(Math.floor(y) * mask.width + Math.floor(x)) * 4 + 3] < 128) continue;
                this.titleGlyphs.push({
                    x, y,
                    startY: -Math.random() * this.height,
                    arrival: 0.8 + Math.random() * 3.2,
                    release: Math.random() * 0.8,
                    symbol: SYMBOLS.all.charAt(Math.floor(Math.random() * SYMBOLS.all.length))
                });
            }
        }
        this.sequenceTime = this.motionPreference.matches ? 7 : 0;
    }

    drawTitle() {
        const time = this.sequenceTime;
        if (time < 3 || time >= 12) return;
        const ctx = this.context;
        const scheme = COLOUR_SCHEMES[this.currentScheme];
        ctx.font = `${this.titleCell}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const glyph of this.titleGlyphs) {
            const progress = Math.min(1, (time - 3) / glyph.arrival);
            const released = Math.max(0, time - 10 - glyph.release);
            const y = glyph.startY + (glyph.y - glyph.startY) * progress
                + released * released * this.height;
            if (y < 0 || y > this.height) continue;
            if (progress < 1 && Math.random() < 0.2) {
                glyph.symbol = SYMBOLS.all.charAt(Math.floor(Math.random() * SYMBOLS.all.length));
            }
            ctx.globalAlpha = released > 0 ? Math.max(0, 1 - released) : 1;
            ctx.fillStyle = progress < 1 || released > 0 ? scheme.head : scheme.body;
            ctx.fillText(glyph.symbol, glyph.x, y);
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
            this.columns.push(new MatrixColumn(i, this.height));
        }
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
        const sequenceTime = this.sequenceTime;
        this.resizeCanvas();
        this.createColumns();
        this.createTitle();
        this.sequenceTime = sequenceTime;
        if (this.isPaused) this.draw();
    }

    /**
     * Handles mouse movement over the canvas
     * @param {MouseEvent} e - The mouse event
     */
    handleMouseMove(e) {
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
        this.createTitle();
        this.context.clearRect(0, 0, this.width, this.height);
        this.accumulator = 0;
        if (this.isPaused) this.draw();
        console.log("Animation reset");
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
            this.sequenceTime = (this.sequenceTime + 1 / CONFIG.DEFAULT_FPS) % 15;
        }
        // Create fade effect with darker background
        const titleActive = this.sequenceTime >= 3 && this.sequenceTime < 12;
        this.context.fillStyle = `rgba(0, 0, 0, ${titleActive ? 0.24 : CONFIG.FADE_ALPHA})`;
        this.context.fillRect(0, 0, this.width, this.height);

        // Set font properties with bold for better visibility
        this.context.font = `bold ${CONFIG.FONT_SIZE}px monospace`;

        // Get current colour scheme
        const scheme = COLOUR_SCHEMES[this.currentScheme];
        this.context.globalAlpha = titleActive ? 0.22 : 1;

        // Draw each column
        this.columns.forEach((column) => {
            const x = column.x * CONFIG.FONT_SIZE;

            // Draw the trail
            column.trail.forEach((char, index) => {
                // Calculate opacity based on position in trail
                const opacity = 1 - (index / column.trailLength);

                // Determine colour based on position
                let colour;
                if (index === 0) {
                    // Brightest head character
                    colour = scheme.head;
                } else if (index < 3) {
                    // Near head - bright body colour
                    colour = scheme.body;
                } else {
                    // Fading tail
                    colour = scheme.tail;
                }

                // Parse hex colour and add opacity
                const r = parseInt(colour.slice(1, 3), 16);
                const g = parseInt(colour.slice(3, 5), 16);
                const b = parseInt(colour.slice(5, 7), 16);

                this.context.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                this.context.fillText(char.symbol, x, char.y * CONFIG.FONT_SIZE);
            });

            // Update column position with speed multiplier
            column.update(this.speedMultiplier);

            // Reset column if it goes off screen
            if ((column.y - column.trailLength) * CONFIG.FONT_SIZE > this.height && Math.random() > CONFIG.RESET_PROBABILITY) {
                column.reset(this.height);
            }
        });
        this.context.globalAlpha = 1;
        this.drawTitle();
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
    constructor() {
        this.overlay = document.querySelector(".controls-overlay");
        this.showButton = document.getElementById("showControls");
        this.closeButton = document.getElementById("closeControls");

        if (!this.overlay || !this.showButton || !this.closeButton) {
            console.warn("UI controls not found in DOM");
            return;
        }

        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for UI controls
     */
    setupEventListeners() {
        // Show controls overlay
        this.showButton.addEventListener("click", () => this.showControls());

        // Close controls overlay
        this.closeButton.addEventListener("click", () => this.hideControls());

        // Close on escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && this.overlay.classList.contains("visible")) {
                this.hideControls();
            }
        });

        // Close when clicking outside the controls content
        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) {
                this.hideControls();
            }
        });
    }

    /**
     * Shows the controls overlay
     */
    showControls() {
        this.overlay.classList.add("visible");
    }

    /**
     * Hides the controls overlay
     */
    hideControls() {
        this.overlay.classList.remove("visible");
    }
}

/**
 * Initialise the application when the DOM is fully loaded
 */
document.addEventListener("DOMContentLoaded", () => {
    try {
        // Initialise the matrix rain animation
        const matrixRain = new MatrixRain("matrixCanvas");

        // Initialise the UI controller
        const uiController = new UIController();

        // Display controls information in console
        console.log("Matrix Rain Controls:");
        console.log("- SPACE or P: Pause/Resume");
        console.log("- C: Cycle colour schemes");
        console.log("- ↑ or +: Increase speed");
        console.log("- ↓ or -: Decrease speed");
        console.log("- R: Reset animation");
        console.log("- Mouse: Interact with columns");
        console.log("- Click ? button for help");
    } catch (error) {
        console.error("Failed to initialise Matrix Rain:", error);
    }
});
