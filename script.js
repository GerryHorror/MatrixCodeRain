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
        body: "#0F0",
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
        this.y += this.speed * speedMultiplier;

        // Update trail
        if (this.y > 0) {
            this.trail.unshift({
                y: this.y,
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
        // Create fade effect with darker background
        this.context.fillStyle = `rgba(0, 0, 0, 0.1)`;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set font properties with bold for better visibility
        this.context.font = `bold ${CONFIG.FONT_SIZE}px monospace`;

        // Get current colour scheme
        const scheme = COLOUR_SCHEMES[this.currentScheme];

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
        console.log("- ↑ or +: Increase speed");
        console.log("- ↓ or -: Decrease speed");
        console.log("- R: Reset animation");
        console.log("- Mouse: Interact with columns");
        console.log("- Click ? button for help");
    } catch (error) {
        console.error("Failed to initialise Matrix Rain:", error);
    }
});
