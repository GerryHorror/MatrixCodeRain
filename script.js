// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('matrixCanvas');
const context = canvas.getContext('2d');

// Set the canvas size to match the window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define the symbols to be displayed in the matrix animation
const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789カキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン🐂🌟💧🔥';

// Define the font size for the symbols
const fontSize = 20;

// Calculate the number of columns based on the canvas width and font size
let columns = canvas.width / fontSize;

// Initialize an array to store the vertical position of each symbol
const drops = [];

// Define an array of colors for the symbols
const colors = ['#0F0', '#3F3', '#6F6', '#9F9', '#CF9', '#FFF'];

// Initialize the vertical position of each symbol randomly
for (let x = 0; x < columns; x++) {
    drops[x] = Math.floor(Math.random() * canvas.height);
}

// Function to draw the matrix animation
function draw() {
    // Set the background color with low opacity to create a trailing effect
    context.fillStyle = 'rgba(0, 0, 0, 0.05)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Iterate through each column
    for (let i = 0; i < drops.length; i++) {
        // Select a random symbol from the symbols array
        const text = symbols.charAt(Math.floor(Math.random() * symbols.length));

        // Select a random color from the colors array
        context.fillStyle = colors[Math.floor(Math.random() * colors.length)];

        // Set the font size and font family
        context.font = `${fontSize}px monospace`;

        // Draw the symbol at the current position
        context.fillText(text, i * fontSize, drops[i] * fontSize);

        // If the symbol reaches the bottom of the canvas and a random condition is met, reset its position to the top
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
            drops[i] = 0;
        }

        // Increment the vertical position of the symbol
        drops[i]++;
    }
}

// Function to resize the canvas when the window size changes
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = canvas.width / fontSize;

    // Reinitialize the vertical position of each symbol randomly
    for (let x = 0; x < columns; x++) {
        drops[x] = Math.floor(Math.random() * canvas.height);
    }
}

// Add a resize event listener to the window
window.addEventListener('resize', resize);

// Call the draw function repeatedly with a fixed interval to create the animation
setInterval(draw, 33);

// Add a mousemove event listener to the canvas
canvas.addEventListener('mousemove', function(e) {
    // Get the mouse coordinates
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Calculate the column index based on the mouse position and font size
    const column = Math.floor(mouseX / fontSize);

    // Set the vertical position of the symbol in the selected column based on the mouse position
    drops[column] = Math.floor(mouseY / fontSize);
});
