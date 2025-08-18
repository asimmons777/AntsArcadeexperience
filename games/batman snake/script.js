function scrollToHub() {
    window.location.href = '../../index.html';
}
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverDiv = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = [
    {x: 10, y: 10}
];
let dx = 0;
let dy = 0;
let appleX = 15;
let appleY = 15;
let score = 0;
let gameRunning = false;
let gameStarted = false;

function drawGame() {
    // Clear canvas with Gotham night sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(0.3, '#001d3d');
    gradient.addColorStop(0.7, '#003566');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Gotham city grid
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw Batmobile (Snake)
    for (let i = 0; i < snake.length; i++) {
        const x = snake[i].x * gridSize;
        const y = snake[i].y * gridSize;
        
        if (i === 0) {
            // Batmobile front with glowing effect
            const headGradient = ctx.createRadialGradient(
                x + gridSize/2, y + gridSize/2, 0,
                x + gridSize/2, y + gridSize/2, gridSize/2
            );
            headGradient.addColorStop(0, '#FFD700');
            headGradient.addColorStop(0.6, '#FFA500');
            headGradient.addColorStop(1, '#FF8C00');
            
            ctx.fillStyle = headGradient;
            ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
            
            // Batman logo on front
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', x + gridSize/2, y + gridSize/2 + 4);
            
            // Glowing outline
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, gridSize - 2, gridSize - 2);
            ctx.shadowBlur = 0;
        } else {
            // Batmobile body segments
            const bodyGradient = ctx.createLinearGradient(x, y, x + gridSize, y + gridSize);
            bodyGradient.addColorStop(0, '#2c3e50');
            bodyGradient.addColorStop(0.5, '#34495e');
            bodyGradient.addColorStop(1, '#1a252f');
            
            ctx.fillStyle = bodyGradient;
            ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
            
            // Tech details
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.7;
            ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
            ctx.globalAlpha = 1;
        }
    }

    // Draw criminal with menacing effect
    const crimX = appleX * gridSize;
    const crimY = appleY * gridSize;
    
    // Pulsing danger effect
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    
    const crimGradient = ctx.createRadialGradient(
        crimX + gridSize/2, crimY + gridSize/2, 0,
        crimX + gridSize/2, crimY + gridSize/2, gridSize/2
    );
    crimGradient.addColorStop(0, `rgba(255, 0, 0, ${pulse})`);
    crimGradient.addColorStop(0.7, `rgba(220, 20, 60, ${pulse})`);
    crimGradient.addColorStop(1, `rgba(139, 0, 0, ${pulse})`);
    
    ctx.fillStyle = crimGradient;
    ctx.fillRect(crimX + 1, crimY + 1, gridSize - 2, gridSize - 2);
    
    // Criminal symbol
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💀', crimX + gridSize/2, crimY + gridSize/2 + 3);
    
    // Danger glow
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 1;
    ctx.globalAlpha = pulse;
    ctx.strokeRect(crimX + 1, crimY + 1, gridSize - 2, gridSize - 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}

function moveSnake() {
    if (!gameRunning) return;

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Check if ate apple
    if (head.x === appleX && head.y === appleY) {
        score++;
        scoreElement.textContent = 'Criminals Captured: ' + score;
        generateApple();
    } else {
        snake.pop();
    }
}

function generateApple() {
    do {
        appleX = Math.floor(Math.random() * tileCount);
        appleY = Math.floor(Math.random() * tileCount);
    } while (snake.some(segment => segment.x === appleX && segment.y === appleY));
}

function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    
    // Check if score qualifies for leaderboard
    if (score > 0) {
        document.getElementById('nameInput').style.display = 'block';
        document.getElementById('restartBtn').style.display = 'none';
        var feedback = document.getElementById('scoreFeedback');
        if (feedback) feedback.style.display = 'none';
    } else {
        document.getElementById('nameInput').style.display = 'none';
        document.getElementById('restartBtn').style.display = 'block';
    }
    
    gameOverDiv.style.display = 'block';
}

// Leaderboard Functions
function saveScore() {
    const playerName = document.getElementById('playerName').value.trim();
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    // Get existing scores from localStorage
    let scores = JSON.parse(localStorage.getItem('batmanSnakeScores')) || [];
    
    // Add new score
    scores.push({
        name: playerName,
        score: score,
        date: new Date().toLocaleDateString()
    });
    
    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    scores = scores.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('batmanSnakeScores', JSON.stringify(scores));
    
    // Hide name input and show restart button
    document.getElementById('nameInput').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'block';
    document.getElementById('playerName').value = '';
    
    // Show feedback only in the mission failed modal, not in the name input area
    var feedback = document.getElementById('scoreFeedback');
    if (feedback) {
        feedback.textContent = 'Score saved! You are now part of Gotham\'s finest!';
        feedback.style.display = 'block';
    }
}

function showLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('batmanSnakeScores')) || [];
    const leaderboardList = document.getElementById('leaderboardList');
    
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align: center; color: #00FFFF;">No scores yet. Be the first to protect Gotham!</p>';
    } else {
        let html = '';
        scores.forEach((entry, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
            html += `
                <div class="leaderboard-entry">
                    <span class="leaderboard-rank">${medal}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score}</span>
                </div>
            `;
        });
        leaderboardList.innerHTML = html;
    }
    
    document.getElementById('leaderboard').style.display = 'block';
}

function closeLeaderboard() {
    document.getElementById('leaderboard').style.display = 'none';
}

function clearLeaderboard() {
    if (confirm('Are you sure you want to clear all leaderboard records?')) {
        localStorage.removeItem('batmanSnakeScores');
        closeLeaderboard();
        alert('Leaderboard cleared!');
    }
}

// Add Enter key support for name input
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('playerName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveScore();
        }
    });
});

function startGame() {
    console.log('Starting game...');
    snake = [{x: 10, y: 10}];
    dx = 1; // Start moving to the right by default
    dy = 0;
    score = 0;
    scoreElement.textContent = 'Criminals Captured: 0';
    generateApple();
    gameOverDiv.style.display = 'none';
    gameRunning = true;
    gameStarted = true;
}

function gameLoop() {
    moveSnake();
    drawGame();
}

// Handle keyboard input
document.addEventListener('keydown', function(e) {
    console.log('Key pressed:', e.key, 'Game running:', gameRunning);
    
    // Only prevent default for game keys if not typing in an input
    const active = document.activeElement;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key) && !(active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'))) {
        e.preventDefault();
    }

    // Start game on first movement if not already running
    if (!gameRunning && !gameStarted) {
        startGame();
    }

    if (!gameRunning) return;

    // Prevent reverse direction
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { dx = 0; dy = -1; }
            console.log('Moving up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { dx = 0; dy = 1; }
            console.log('Moving down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { dx = -1; dy = 0; }
            console.log('Moving left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { dx = 1; dy = 0; }
            console.log('Moving right');
            break;
    }
});

// Click canvas to focus it
canvas.addEventListener('click', function() {
    canvas.focus();
    console.log('Canvas focused');
});

// Focus canvas on page load
window.addEventListener('load', function() {
    canvas.focus();
    console.log('Page loaded, canvas focused');
});

// Start game loop
setInterval(gameLoop, 100);
drawGame();