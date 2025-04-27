const gameArea = document.getElementById('game-area');
const gorilla = document.getElementById('gorilla');
const scoreDisplay = document.getElementById('score');
const messageDiv = document.getElementById('message');
const messageText = document.getElementById('message-text');
const restartButton = document.getElementById('restart-button');
const boopSound = document.getElementById('boop-sound');
// const winSound = document.getElementById('win-sound');
// const bgMusic = document.getElementById('bg-music'); // Optional

const gameAreaRect = gameArea.getBoundingClientRect();
const gorillaSize = 50; // Match CSS width/height roughly
const manSize = 25;    // Match CSS width/height roughly
const gorillaSpeed = 15;
const manSpeed = 1.5; // Adjust for difficulty/silliness
const totalMen = 100;

let men = []; // Array to hold man elements and their state
let score = 0;
let gameOver = false;
let gameLoopInterval = null;
let keysPressed = {}; // Track multiple key presses

// --- Game Setup ---

function initGame() {
    // Reset state
    score = 0;
    gameOver = false;
    men.forEach(manData => manData.element.remove()); // Remove old men from DOM
    men = [];
    scoreDisplay.textContent = score;
    messageDiv.classList.add('hidden');
    gorilla.style.left = '50%';
    gorilla.style.bottom = '10px';
    gorilla.style.transform = 'translateX(-50%)'; // Reset position
    gorilla.style.display = 'block'; // Ensure gorilla is visible
    keysPressed = {};

    // Start background music (optional)
    // bgMusic?.play().catch(e => console.log("Audio autoplay blocked"));

    // Spawn initial men
    for (let i = 0; i < totalMen; i++) {
        createMan(i);
    }

    // Start game loop
    if (gameLoopInterval) clearInterval(gameLoopInterval); // Clear previous loop if any
    gameLoopInterval = setInterval(gameLoop, 50); // Update ~20 times/sec
}

function createMan(id) {
    const man = document.createElement('div');
    man.classList.add('man');
    man.id = `man-${id}`;
    man.textContent = '🧍'; // Simple man emoji (or use 👨‍🦱, 👨‍🦳, 🧍‍♂️)

    // Random starting position (mostly off-screen top/sides)
    const side = Math.random();
    let startX, startY;

    if (side < 0.33) { // Top
        startX = Math.random() * gameAreaRect.width;
        startY = -manSize * 2; // Start above the screen
    } else if (side < 0.66) { // Left
        startX = -manSize * 2;
        startY = Math.random() * (gameAreaRect.height * 0.7); // Start partway down
    } else { // Right
        startX = gameAreaRect.width + manSize;
        startY = Math.random() * (gameAreaRect.height * 0.7);
    }

    man.style.left = `${startX}px`;
    man.style.top = `${startY}px`; // Use top for positioning

    gameArea.appendChild(man);
    men.push({
        id: id,
        element: man,
        x: startX,
        y: startY,
        active: true,
        booped: false // Track boop state for animation
    });
}

// --- Game Loop ---

function gameLoop() {
    if (gameOver) return;

    moveGorilla();
    moveMen();
    checkCollisions();
}

// --- Movement ---

function moveGorilla() {
    let dx = 0;
    let dy = 0;

    if (keysPressed['ArrowLeft'] || keysPressed['a']) dx -= 1;
    if (keysPressed['ArrowRight'] || keysPressed['d']) dx += 1;
    if (keysPressed['ArrowUp'] || keysPressed['w']) dy -= 1;
    if (keysPressed['ArrowDown'] || keysPressed['s']) dy += 1;

    // Get current position (handle potential % values)
    let currentX = gorilla.offsetLeft;
    let currentY = gorilla.offsetTop;

    let nextX = currentX + dx * gorillaSpeed;
    let nextY = currentY + dy * gorillaSpeed;

    // Boundary checks (adjust for element size)
    nextX = Math.max(0, Math.min(gameAreaRect.width - gorillaSize, nextX));
    nextY = Math.max(0, Math.min(gameAreaRect.height - gorillaSize, nextY));

    // Flip gorilla based on horizontal movement
    if (dx > 0) {
        gorilla.style.transform = 'translateX(-50%) scaleX(-1)';
    } else if (dx < 0) {
        gorilla.style.transform = 'translateX(-50%) scaleX(1)';
    }
    // If only moving vertically, keep last horizontal direction or default
    else if (!gorilla.style.transform.includes('scaleX')) {
         gorilla.style.transform = 'translateX(-50%) scaleX(1)';
    }


    gorilla.style.left = `${nextX}px`;
    gorilla.style.top = `${nextY}px`; // Use top for positioning
    // We used 'bottom' initially in CSS, switch to 'top' for consistency
    gorilla.style.bottom = 'auto';
}

function moveMen() {
    const gorillaRect = gorilla.getBoundingClientRect();
    // Calculate gorilla center relative to the game area
    const gorillaCenterX = gorilla.offsetLeft + gorillaSize / 2;
    const gorillaCenterY = gorilla.offsetTop + gorillaSize / 2;

    men.forEach(manData => {
        if (!manData.active || manData.booped) return; // Skip inactive or booped men

        const man = manData.element;
        let currentX = manData.x;
        let currentY = manData.y;

        // Calculate direction towards gorilla center
        const angle = Math.atan2(gorillaCenterY - (currentY + manSize / 2), gorillaCenterX - (currentX + manSize / 2));

        // Add some wobble/randomness for silliness
        const wobble = (Math.random() - 0.5) * 0.5; // Small random angle deviation
        const currentSpeed = manSpeed + (Math.random() - 0.5) * 0.5; // Slight speed variation

        const dx = Math.cos(angle + wobble) * currentSpeed;
        const dy = Math.sin(angle + wobble) * currentSpeed;

        manData.x += dx;
        manData.y += dy;

        // Update DOM
        man.style.left = `${manData.x}px`;
        man.style.top = `${manData.y}px`;

        // Optional: Rotate man to roughly face gorilla (can look funny)
        // man.style.transform = `rotate(${angle * (180 / Math.PI) + 90}deg)`;
    });
}

// --- Collision Detection ---

function checkCollisions() {
    const gorillaRect = gorilla.getBoundingClientRect();

    men.forEach(manData => {
        if (!manData.active || manData.booped) return; // Check only active, non-booped men

        const man = manData.element;
        const manRect = man.getBoundingClientRect();

        // Simple AABB collision detection (Axis-Aligned Bounding Box)
        const hit = !(
            gorillaRect.right < manRect.left ||
            gorillaRect.left > manRect.right ||
            gorillaRect.bottom < manRect.top ||
            gorillaRect.top > manRect.bottom
        );

        if (hit) {
            handleCollision(manData);
        }
    });
}

function handleCollision(manData) {
    if (!manData.active || manData.booped) return; // Avoid double boops

    manData.booped = true; // Mark as booped immediately
    score++;
    scoreDisplay.textContent = score;

    // Play boop sound (optional)
    boopSound?.play();

    const manElement = manData.element;
    manElement.textContent = '😵'; // Change emoji on boop
    manElement.classList.add('booped'); // Add class for CSS animation

    // After animation, mark as inactive (remove or hide)
    setTimeout(() => {
        manData.active = false;
        // Option 1: Remove element (simpler, but might affect performance if done rapidly)
        // manElement.remove();
        // Option 2: Hide element (better performance for large numbers)
        manElement.style.display = 'none';
    }, 1000); // Match CSS transition duration

    // Check for win condition
    if (score >= totalMen) {
        endGame(true);
    }
}

// --- Game State Control ---

function endGame(gorillaWon) {
    gameOver = true;
    clearInterval(gameLoopInterval); // Stop the game loop
    // bgMusic?.pause(); // Pause music (optional)

    if (gorillaWon) {
        messageText.textContent = `GORILLA WINS! You booped all ${totalMen} men! Time for bananas! 🍌`;
        gorilla.textContent = '🥳'; // celebratory gorilla
        // winSound?.play(); // Optional win sound
    }
    // Note: In this setup, the gorilla can't really "lose" unless we add health/timer
    // else {
    //     messageText.textContent = "Oh no! The men overwhelmed the gorilla!";
    //     gorilla.textContent = '😵';
    // }

    messageDiv.classList.remove('hidden');
}

// --- Event Listeners ---

document.addEventListener('keydown', (e) => {
    // Use 'a' for left, 'd' for right, 'w' for up, 's' for down
    const key = e.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's'].includes(key)) {
        keysPressed[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keysPressed[key]) {
        delete keysPressed[key];
    }
});

restartButton.addEventListener('click', () => {
    gorilla.textContent = '🦍'; // Reset gorilla emoji
    initGame();
});

// --- Start the game ---
initGame(); // Initial call to start the game when the script loads
