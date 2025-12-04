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
    DEFAULT_FPS: 30
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
    classic: ["#0F0", "#3F3", "#6F6", "#9F9"],
    bright: ["#0F0", "#3F3", "#6F6", "#9F9", "#CF9", "#FFF"],
    cyber: ["#00FF41", "#008F11", "#00FF41", "#FFFFFF"]
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
    }

    /**
     * Resets the column to start from the top
     * @param {number} canvasHeight - The height of the canvas
     */
    reset(canvasHeight) {
        this.y = Math.floor(Math.random() * canvasHeight / CONFIG.FONT_SIZE) * -1;
    }

    /**
     * Updates the column position
     */
    update() {
        this.y += this.speed;
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
        this.colourScheme = COLOUR_SCHEMES.bright;
        this.mouseColumn = null;

        this.initialise();
        this.setupEventListeners();
        this.start();
    }

    /**
     * Initialises the canvas and column arrays
     */
    initialise() {
        this.resizeCanvas();
        this.createColumns();
    }

    /**
     * Resizes the canvas to match the window size
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Creates the column objects based on canvas width
     */
    createColumns() {
        const columnCount = Math.floor(this.canvas.width / CONFIG.FONT_SIZE);
        this.columns = [];

        for (let i = 0; i < columnCount; i++) {
            this.columns.push(new MatrixColumn(i, this.canvas.height));
        }
    }

    /**
     * Sets up event listeners for user interaction
     */
    setupEventListeners() {
        // Window resize handler
        window.addEventListener("resize", () => this.handleResize());

        // Mouse movement handler
        this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));

        // Mouse leave handler
        this.canvas.addEventListener("mouseleave", () => {
            this.mouseColumn = null;
        });

        // Keyboard controls
        document.addEventListener("keydown", (e) => this.handleKeyPress(e));
    }

    /**
     * Handles window resize events
     */
    handleResize() {
        this.resizeCanvas();
        this.createColumns();
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
                this.cycleColourScheme();
                break;
            case "r":
                // R key resets the animation
                this.reset();
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
        const schemes = Object.values(COLOUR_SCHEMES);
        const currentIndex = schemes.indexOf(this.colourScheme);
        const nextIndex = (currentIndex + 1) % schemes.length;
        this.colourScheme = schemes[nextIndex];
        console.log("Colour scheme changed");
    }

    /**
     * Resets all columns to their initial state
     */
    reset() {
        this.columns.forEach(column => column.reset(this.canvas.height));
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
    }

    /**
     * Main animation loop using requestAnimationFrame
     */
    animate() {
        if (!this.isPaused) {
            this.draw();
        }
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Draws a single frame of the animation
     */
    draw() {
        // Create fade effect for trailing characters
        this.context.fillStyle = `rgba(0, 0, 0, ${CONFIG.FADE_ALPHA})`;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set font properties
        this.context.font = `${CONFIG.FONT_SIZE}px monospace`;

        // Draw each column
        this.columns.forEach((column, index) => {
            // Get random symbol for this frame
            const symbol = column.getRandomSymbol();

            // Select colour for the head character (brightest)
            const colour = this.colourScheme[Math.floor(Math.random() * this.colourScheme.length)];
            this.context.fillStyle = colour;

            // Calculate position
            const x = column.x * CONFIG.FONT_SIZE;
            const y = column.y * CONFIG.FONT_SIZE;

            // Draw the character
            this.context.fillText(symbol, x, y);

            // Update column position
            column.update();

            // Reset column if it goes off screen
            if (column.y * CONFIG.FONT_SIZE > this.canvas.height && Math.random() > CONFIG.RESET_PROBABILITY) {
                column.reset(this.canvas.height);
            }
        });
    }

    /**
     * Cleans up resources and stops the animation
     */
    destroy() {
        this.stop();
        window.removeEventListener("resize", this.handleResize);
        this.canvas.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("keydown", this.handleKeyPress);
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
        console.log("- R: Reset animation");
        console.log("- Mouse: Interact with columns");
        console.log("- Click ? button for help");
    } catch (error) {
        console.error("Failed to initialise Matrix Rain:", error);
    }
});
