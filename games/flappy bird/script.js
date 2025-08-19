// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const modalHighScoreElement = document.getElementById('modalHighScore');
const gameOverModal = document.getElementById('gameOverModal');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const darkModeToggle = document.getElementById('darkModeToggle');

// Leaderboard elements
const nameInputSection = document.getElementById('nameInputSection');
const playerNameInput = document.getElementById('playerNameInput');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const leaderboardList = document.getElementById('leaderboardList');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');

// Game state
let gameRunning = false;
let gameStarted = false;
let score = 0;
let highScore = 0;
let currentPlayerName = '';

// Leaderboard data
let leaderboard = [];

// Bird object
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 30,
    height: 25,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -8,
    color: '#FFD700'
};

// Pipes array
let pipes = [];
const pipeWidth = 60;
const basePipeGap = 150;
let pipeGap = basePipeGap;
const basePipeSpeed = 2;
let pipeSpeed = basePipeSpeed;

// Ground
const groundHeight = 50;

// Initialize game
function init() {
    // Load high score and leaderboard
    highScore = parseInt(localStorage.getItem('flappyBirdHighScore')) || 0;
    highScoreElement.textContent = highScore;
    loadLeaderboard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show start screen
    showStartScreen();
}

function setupEventListeners() {
    // Footer leaderboard button
    const viewLeaderboardBtnFooter = document.getElementById('viewLeaderboardBtnFooter');
    if (viewLeaderboardBtnFooter) {
        viewLeaderboardBtnFooter.addEventListener('click', () => {
            hideStartScreen();
            showLeaderboard();
        });
    }
    // Button events
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', () => {
        hideGameOverModal();
        showStartScreen();
    });
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Leaderboard events
    submitScoreBtn.addEventListener('click', submitScore);
    viewLeaderboardBtn.addEventListener('click', showLeaderboard);
    closeLeaderboardBtn.addEventListener('click', hideLeaderboard);
    
    // Enter key for name input
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitScore();
        }
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            // If start screen is visible, start game
            if (!gameStarted && !startScreen.classList.contains('hidden')) {
                startGame();
            } else if (gameRunning) {
                jump();
            }
        }
    });
    
    // Mouse/touch controls
    canvas.addEventListener('click', (e) => {
        e.preventDefault();
        if (!gameStarted) {
            startGame();
        } else if (gameRunning) {
            jump();
        }
    });
}

function startGame() {
    gameRunning = true;
    gameStarted = true;
    score = 0;
    
    // Reset bird
    bird.x = 50;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    
    // Reset pipe speed, gap, and bird gravity
    pipeSpeed = basePipeSpeed;
    pipeGap = basePipeGap;
    bird.gravity = 0.5;
    
    // Clear pipes
    pipes = [];
    
    // Hide modals
    hideStartScreen();
    hideGameOverModal();
    
    // Update score display
    updateScore();
    
    // Start game loop
    gameLoop();
}

function jump() {
    if (gameRunning) {
        bird.velocity = bird.jumpPower;
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Check if bird hits ground or ceiling
    if (bird.y + bird.height > canvas.height - groundHeight || bird.y < 0) {
        gameOver();
        return;
    }
    
    // Update pipes
    updatePipes();
    
    // Check collisions
    checkCollisions();
}

function updatePipes() {
    // Add new pipe
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        addPipe();
    }
    
    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        
        // Score when bird passes pipe
        if (!pipes[i].scored && pipes[i].x + pipeWidth < bird.x) {
            score++;
            pipes[i].scored = true;
            updateScore();
            
            // Increase speed every 3 points (more aggressive scaling)
            pipeSpeed = basePipeSpeed + Math.floor(score / 3) * 0.5;
            
            // Make gap smaller every 5 points (minimum gap of 120)
            pipeGap = Math.max(basePipeGap - Math.floor(score / 5) * 10, 120);
            
            // Also increase gravity slightly every 10 points to make it harder
            if (score % 10 === 0 && score > 0) {
                bird.gravity = Math.min(bird.gravity + 0.05, 0.8);
            }
        }
        
        // Remove pipes that are off screen
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }
}

function addPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - groundHeight - pipeGap - minHeight;
    const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        scored: false
    });
}

function checkCollisions() {
    for (let pipe of pipes) {
        // Check if bird is within pipe's x range
        if (bird.x < pipe.x + pipeWidth && bird.x + bird.width > pipe.x) {
            // Check collision with top or bottom pipe
            if (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY) {
                gameOver();
                return;
            }
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background gradient (check for dark mode)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        // Dark mode background
        gradient.addColorStop(0, '#2C1810');
        gradient.addColorStop(0.5, '#1A1A2E');
        gradient.addColorStop(1, '#0F0F23');
    } else {
        // Light mode background
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.5, '#4ECDC4');
        gradient.addColorStop(1, '#45B7D1');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw pipes
    drawPipes();
    
    // Draw bird
    drawBird();
    
    // Draw ground
    drawGround();
    
    // Draw difficulty indicator on canvas
    drawDifficultyDisplay();
}

function drawBird() {
    const x = bird.x;
    const y = bird.y;
    const w = bird.width;
    const h = bird.height;
    
    // Bird rotation based on velocity
    const rotation = Math.min(Math.max(bird.velocity * 0.1, -0.5), 0.5);
    
    ctx.save();
    ctx.translate(x + w/2, y + h/2);
    ctx.rotate(rotation);
    
    // Bird body (main oval)
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird body gradient for depth
    const gradient = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
    gradient.addColorStop(0, '#FFB6C1');
    gradient.addColorStop(1, '#FF1493');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing
    ctx.fillStyle = '#8A2BE2';
    ctx.beginPath();
    ctx.ellipse(-2, 2, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing details
    ctx.strokeStyle = '#6A1B9A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(-2, 2, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.stroke();
    
    // Beak
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(w/2 - 2, -2);
    ctx.lineTo(w/2 + 8, 0);
    ctx.lineTo(w/2 - 2, 2);
    ctx.closePath();
    ctx.fill();
    
    // Beak outline
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Eye white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(5, -3, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye black pupil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(7, -3, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(8, -4, 1, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird outline
    ctx.strokeStyle = '#C2185B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
}

function drawPipes() {
    for (let pipe of pipes) {
        // Pipe gradient for depth
        const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        pipeGradient.addColorStop(0, '#9C27B0');
        pipeGradient.addColorStop(0.3, '#7B1FA2');
        pipeGradient.addColorStop(0.7, '#6A1B9A');
        pipeGradient.addColorStop(1, '#4A148C');
        
        // Top pipe body
        ctx.fillStyle = pipeGradient;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight - 20);
        
        // Top pipe cap
        const capGradient = ctx.createLinearGradient(pipe.x - 5, 0, pipe.x + pipeWidth + 5, 0);
        capGradient.addColorStop(0, '#BA68C8');
        capGradient.addColorStop(0.5, '#9C27B0');
        capGradient.addColorStop(1, '#6A1B9A');
        ctx.fillStyle = capGradient;
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        
        // Bottom pipe body
        ctx.fillStyle = pipeGradient;
        const bottomHeight = canvas.height - groundHeight - pipe.bottomY - 20;
        ctx.fillRect(pipe.x, pipe.bottomY + 20, pipeWidth, bottomHeight);
        
        // Bottom pipe cap
        ctx.fillStyle = capGradient;
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
        
        // Pipe highlights and shadows for 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(pipe.x, 0, 3, pipe.topHeight - 20);
        ctx.fillRect(pipe.x, pipe.bottomY + 20, 3, bottomHeight);
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, 3, 20);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, 3, 20);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(pipe.x + pipeWidth - 3, 0, 3, pipe.topHeight - 20);
        ctx.fillRect(pipe.x + pipeWidth - 3, pipe.bottomY + 20, 3, bottomHeight);
        ctx.fillRect(pipe.x + pipeWidth + 2, pipe.topHeight - 20, 3, 20);
        ctx.fillRect(pipe.x + pipeWidth + 2, pipe.bottomY, 3, 20);
        
        // Pipe texture lines
        ctx.strokeStyle = '#4A148C';
        ctx.lineWidth = 1;
        for (let i = 0; i < pipe.topHeight - 20; i += 15) {
            ctx.beginPath();
            ctx.moveTo(pipe.x, i);
            ctx.lineTo(pipe.x + pipeWidth, i);
            ctx.stroke();
        }
        
        for (let i = pipe.bottomY + 20; i < canvas.height - groundHeight; i += 15) {
            ctx.beginPath();
            ctx.moveTo(pipe.x, i);
            ctx.lineTo(pipe.x + pipeWidth, i);
            ctx.stroke();
        }
        
        // Pipe outlines
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 2;
        
        // Top pipe outline
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight - 20);
        ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        
        // Bottom pipe outline
        ctx.strokeRect(pipe.x, pipe.bottomY + 20, pipeWidth, bottomHeight);
        ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
    }
}

function drawGround() {
    const groundY = canvas.height - groundHeight;
    
    // Ground gradient
    const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
    groundGradient.addColorStop(0, '#8D6E63');
    groundGradient.addColorStop(0.3, '#5D4037');
    groundGradient.addColorStop(1, '#3E2723');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
    
    // Grass gradient
    const grassGradient = ctx.createLinearGradient(0, groundY, 0, groundY + 15);
    grassGradient.addColorStop(0, '#66BB6A');
    grassGradient.addColorStop(0.7, '#4CAF50');
    grassGradient.addColorStop(1, '#388E3C');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, groundY, canvas.width, 15);
    
    // Grass texture
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 8) {
        for (let i = 0; i < 3; i++) {
            const grassX = x + Math.random() * 6;
            const grassHeight = 3 + Math.random() * 8;
            ctx.beginPath();
            ctx.moveTo(grassX, groundY + 15);
            ctx.lineTo(grassX + Math.random() * 2 - 1, groundY + 15 - grassHeight);
            ctx.stroke();
        }
    }
    
    // Ground texture (dirt pattern)
    ctx.fillStyle = 'rgba(93, 64, 55, 0.7)';
    for (let x = 0; x < canvas.width; x += 20) {
        for (let y = groundY + 20; y < canvas.height; y += 15) {
            if (Math.random() > 0.7) {
                ctx.fillRect(x + Math.random() * 10, y + Math.random() * 10, 3, 2);
            }
        }
    }
    
    // Ground top highlight
    ctx.strokeStyle = '#A1887F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
}

function drawDifficultyDisplay() {
    // Calculate difficulty level
    const difficultyLevel = Math.min(Math.floor(score / 5) + 1, 5);
    
    // Set up text style
    ctx.save();
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Check for dark mode to adjust text color
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Draw text shadow/outline for better visibility
    ctx.strokeStyle = isDarkMode ? '#000000' : '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.strokeText(`Difficulty: ${difficultyLevel}`, 15, 15);
    
    // Draw main text
    ctx.fillStyle = isDarkMode ? '#FFFFFF' : '#2C3E50';
    ctx.fillText(`Difficulty: ${difficultyLevel}`, 15, 15);
    
    // Add difficulty level indicator with color coding
    const colors = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];
    const difficultyColor = colors[difficultyLevel - 1] || '#F44336';
    
    // Draw difficulty level bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(15, 40, 100, 8);
    
    ctx.fillStyle = difficultyColor;
    const barWidth = (difficultyLevel / 5) * 100;
    ctx.fillRect(15, 40, barWidth, 8);
    
    // Draw bar outline
    ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#2C3E50';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 40, 100, 8);
    
    ctx.restore();
}

function updateScore() {
    scoreElement.textContent = score;
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('flappyBirdHighScore', highScore);
    }
}

function gameOver() {
    gameRunning = false;
    
    // Update modal scores
    finalScoreElement.textContent = score;
    modalHighScoreElement.textContent = highScore;
    
    // Check if this score qualifies for leaderboard (top 10 or empty leaderboard)
    const qualifiesForLeaderboard = leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1].score;
    
    if (qualifiesForLeaderboard) {
        nameInputSection.classList.remove('hidden');
        playerNameInput.value = '';
        playerNameInput.focus();
    } else {
        nameInputSection.classList.add('hidden');
    }
    
    // Show game over modal after a short delay
    setTimeout(() => {
        showGameOverModal();
    }, 500);
}

function showStartScreen() {
    startScreen.classList.remove('hidden');
    gameStarted = false;
}

function hideStartScreen() {
    startScreen.classList.add('hidden');
}

function showGameOverModal() {
    gameOverModal.classList.remove('hidden');
}

function hideGameOverModal() {
    gameOverModal.classList.add('hidden');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Update button text
    darkModeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    
    // Save preference
    localStorage.setItem('flappyBirdDarkMode', isDarkMode);
}

function loadDarkModePreference() {
    const isDarkMode = localStorage.getItem('flappyBirdDarkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Light Mode';
    }
}

// Leaderboard Functions
function loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem('flappyBirdLeaderboard');
    if (savedLeaderboard) {
        leaderboard = JSON.parse(savedLeaderboard);
    } else {
        leaderboard = [];
    }
}

function saveLeaderboard() {
    localStorage.setItem('flappyBirdLeaderboard', JSON.stringify(leaderboard));
}

function submitScore() {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    // Add score to leaderboard
    leaderboard.push({
        name: playerName,
        score: score,
        date: new Date().toLocaleDateString()
    });
    
    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    leaderboard = leaderboard.slice(0, 10);
    
    // Save to localStorage
    saveLeaderboard();
    
    // Store current player name for highlighting
    currentPlayerName = playerName;
    
    // Hide name input section
    nameInputSection.classList.add('hidden');
    
    // Show success message in site
    const msgDiv = document.getElementById('scoreSubmitMessage');
    if (msgDiv) {
        const rank = leaderboard.findIndex(entry => entry.name === playerName && entry.score === score) + 1;
        msgDiv.textContent = `Score submitted! You ranked #${rank}`;
        msgDiv.style.display = 'block';
        setTimeout(() => { msgDiv.style.display = 'none'; }, 3500);
    }
}

function showLeaderboard() {
    renderLeaderboard();
    hideGameOverModal();
    leaderboardModal.classList.remove('hidden');
}

function hideLeaderboard() {
    leaderboardModal.classList.add('hidden');
    // Reset game state and show start screen
    gameRunning = false;
    gameStarted = false;
    showStartScreen();
}

function renderLeaderboard() {
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="empty-leaderboard">No scores yet! Be the first to set a record!</div>';
        return;
    }
    
    let html = '';
    leaderboard.forEach((entry, index) => {
        const rank = index + 1;
        const isCurrentPlayer = entry.name === currentPlayerName && entry.score === score;
        let rankClass = '';
        
        if (rank === 1) rankClass = 'top-1';
        else if (rank === 2) rankClass = 'top-2';
        else if (rank === 3) rankClass = 'top-3';
        
        html += `
            <div class="leaderboard-entry ${rankClass} ${isCurrentPlayer ? 'current-player' : ''}">
                <div class="leaderboard-rank">${getRankDisplay(rank)}</div>
                <div class="leaderboard-name">${entry.name}</div>
                <div class="leaderboard-score">${entry.score}</div>
            </div>
        `;
    });
    
    leaderboardList.innerHTML = html;
}

function getRankDisplay(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
}

// Start the game
loadDarkModePreference();
init();
