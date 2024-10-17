// Updated game.js with enhanced UI and improved speed control

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Original canvas dimensions
const ORIGINAL_WIDTH = 600;
const ORIGINAL_HEIGHT = 800;

// Set initial canvas dimensions
canvas.width = ORIGINAL_WIDTH;
canvas.height = ORIGINAL_HEIGHT;

// Game settings
const LANE_WIDTH = ORIGINAL_WIDTH / 3;
const CAR_WIDTH = 105;
const CAR_HEIGHT = 162;
const OBSTACLE_WIDTH = 150;
const OBSTACLE_HEIGHT = 150;

// Load images
const backgroundImg = new Image();
backgroundImg.src = 'background.png';

const carImg = new Image();
carImg.src = 'spaceship.png';

const obstacleImg = new Image();
obstacleImg.src = 'asteroid.png';

// Game variables
let lanes = [
    LANE_WIDTH * 0.5 - CAR_WIDTH * 0.5,
    LANE_WIDTH * 1.5 - CAR_WIDTH * 0.5,
    LANE_WIDTH * 2.5 - CAR_WIDTH * 0.5
];
let carX = lanes[1];
let carY = ORIGINAL_HEIGHT - CAR_HEIGHT - 20;
let carTargetX = carX;
let obstacles = [];
let speed = 3;
let score = 0;
let moveCooldown = 200; // milliseconds
let lastMoveTime = 0;
let lastObstacleTime = 0;
let obstacleInterval = 1500; // milliseconds
let gameState = 'start'; // 'start', 'playing', 'gameover'
let lastFrameTime = performance.now();
let smoothMovementSpeed = 10;
let dataCollection = [];
let frameCounter = 0;


// Resize canvas for responsive design
function resizeCanvas() {
    const aspectRatio = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let newWidth, newHeight;

    if (windowWidth / windowHeight < aspectRatio) {
        newWidth = windowWidth * 0.8; // Reduce canvas size to fit better
        newHeight = newWidth / aspectRatio;
    } else {
        newHeight = windowHeight * 0.8;
        newWidth = newHeight * aspectRatio;
    }

    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    canvas.style.display = 'block';
    canvas.style.margin = '20px auto'; // Center the canvas
    canvas.style.border = '3px solid #444';
    canvas.style.borderRadius = '10px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawText(text, fontSize, x, y, color = '#FFF', align = 'center') {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

function startMenu() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    drawText('Press START to Begin', 36, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2);
}

function endMenu() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);
    drawText(`Game Over! Score: ${score}`, 36, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2 - 50);
    drawText('Press RESTART to Play Again', 24, ORIGINAL_WIDTH / 2, ORIGINAL_HEIGHT / 2);
}

function resetGame() {
    carX = lanes[1];
    carY = ORIGINAL_HEIGHT - CAR_HEIGHT - 20;
    carTargetX = carX;
    obstacles = [];
    speed = 3;
    score = 0;
    lastMoveTime = 0;
    lastObstacleTime = 0;
    frameCounter = 0;
    dataCollection = [];
    gameState = 'playing';
    updateButtonTexts();
}

function updateButtonTexts() {
    if (gameState === 'start') {
        leftButton.innerText = 'START';
        rightButton.style.display = 'none';
    } else if (gameState === 'gameover') {
        leftButton.innerText = 'RESTART';
        rightButton.style.display = 'none';
    } else {
        leftButton.innerText = 'LEFT';
        rightButton.innerText = 'RIGHT';
        rightButton.style.display = 'block';
    }
    leftButton.classList.add('btn', 'btn-primary', 'control-button');
    rightButton.classList.add('btn', 'btn-primary', 'control-button');
}

function update(deltaTime) {
    frameCounter++;
    if (gameState !== 'playing') return;

    // Smooth movement towards target x position
    if (carX < carTargetX) {
        carX += Math.min(smoothMovementSpeed, carTargetX - carX);
    } else if (carX > carTargetX) {
        carX -= Math.min(smoothMovementSpeed, carX - carTargetX);
    }

    // Update speed based on score
    if (score % 3 === 0 && score <= 15) {
        speed = Math.min(3 + Math.floor(score / 3), 10);
    } else if (score > 15 && score % 6 === 0) {
        speed = Math.min(4 + Math.floor(score / 6), 12);
    }

    // Spawn obstacles
    if (performance.now() - lastObstacleTime > obstacleInterval) {
        spawnObstacles();
        lastObstacleTime = performance.now();
    }

    // Move obstacles and check for collisions
    obstacles.forEach(obstacle => {
        obstacle.y += speed * 0.5;
        if (!obstacle.scored && obstacle.y > carY + CAR_HEIGHT) {
            score++;
            obstacle.scored = true;
        }
    });
    obstacles = obstacles.filter(obstacle => obstacle.y <= ORIGINAL_HEIGHT + OBSTACLE_HEIGHT);

    // Collision detection
    const carRect = { x: carX, y: carY, width: CAR_WIDTH, height: CAR_HEIGHT };
    for (let obstacle of obstacles) {
        if (checkCollision(carRect, obstacle)) {
            gameState = 'gameover';
            updateButtonTexts();
            break;
        }
    }

   
}

function spawnObstacles() {
    const numObstacles = Math.random() < 0.7 ? 1 : 2;
    const laneIndices = [0, 1, 2];
    shuffleArray(laneIndices);

    for (let i = 0; i < numObstacles; i++) {
        const laneIndex = laneIndices[i];
        const x = lanes[laneIndex] + getRandomInt(-20, 20);
        const y = -OBSTACLE_HEIGHT - i * (CAR_HEIGHT * 2.5);
        obstacles.push({ x: x, y: y, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT, scored: false });
    }
}

function getClosestObstacleDistances() {
    const distances = [1, 1, 1];
    const carCenterY = carY + (CAR_HEIGHT / 2);

    obstacles.forEach(obstacle => {
        const laneIndex = lanes.findIndex(lane => Math.abs(obstacle.x - lane) < LANE_WIDTH / 2);
        if (laneIndex !== -1 && obstacle.y < carY) {
            const distance = (carCenterY - (obstacle.y + OBSTACLE_HEIGHT)) / carY;
            distances[laneIndex] = Math.min(distances[laneIndex], Math.max(distance, 0));
        }
    });

    return distances;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function render() {
    ctx.drawImage(backgroundImg, 0, 0, ORIGINAL_WIDTH, ORIGINAL_HEIGHT);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(LANE_WIDTH, 0);
    ctx.lineTo(LANE_WIDTH, ORIGINAL_HEIGHT);
    ctx.moveTo(LANE_WIDTH * 2, 0);
    ctx.lineTo(LANE_WIDTH * 2, ORIGINAL_HEIGHT);
    ctx.stroke();

    ctx.drawImage(carImg, carX, carY, CAR_WIDTH, CAR_HEIGHT);

    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
    });

    drawText(`Score: ${score}`, 24, 10, 30, '#FFF', 'left');
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    if (gameState === 'start') {
        startMenu();
    } else if (gameState === 'playing') {
        update(deltaTime);
        render();
    } else if (gameState === 'gameover') {
        endMenu();
    }

    requestAnimationFrame(gameLoop);
}

// Initialize event listeners for buttons
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

leftButton.addEventListener('click', () => {
    if (gameState === 'playing') {
        if (carTargetX > lanes[0]) {
            carTargetX -= LANE_WIDTH;
        }
    } else if (gameState === 'start' || gameState === 'gameover') {
        resetGame();
    }
});

rightButton.addEventListener('click', () => {
    if (gameState === 'playing') {
        if (carTargetX < lanes[2]) {
            carTargetX += LANE_WIDTH;
        }
    }
});


// Start the game loop
backgroundImg.onload = carImg.onload = obstacleImg.onload = () => {
    requestAnimationFrame(gameLoop);
};
