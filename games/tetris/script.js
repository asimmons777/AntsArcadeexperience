// Basic Tetris functionality (no styling, pure logic)
const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;
let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let score = 0;
let lines = 0;
let gameActive = true;
let currentPiece = null;
let currentX = 3;
let currentY = 0;
let dropInterval = 1000;
let dropTimer = null;
let waitingToStart = true;

const PIECES = [
    // Tetromino shapes
    { shape: [[1,1,1,1]], color: 1 }, // I
    { shape: [[1,1,1],[0,1,0]], color: 2 }, // T
    { shape: [[0,1,1],[1,1,0]], color: 3 }, // S
    { shape: [[1,1,0],[0,1,1]], color: 4 }, // Z
    { shape: [[1,0,0],[1,1,1]], color: 5 }, // J
    { shape: [[0,0,1],[1,1,1]], color: 6 }, // L
    { shape: [[1,1],[1,1]], color: 7 } // O
];

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) {
                ctx.fillStyle = 'gray';
                ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#222';
                ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
    if (currentPiece) drawPiece();
}

function showStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#222';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TETRIS', canvas.width/2, canvas.height/2 - 40);
    ctx.font = '20px Arial';
    ctx.fillText('Press A or D to Start', canvas.width/2, canvas.height/2 + 10);
    ctx.font = '16px Arial';
    ctx.fillText('W/A/S/D = Move/Rotate/Drop', canvas.width/2, canvas.height/2 + 40);
}

function resetGame() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    score = 0;
    lines = 0;
    gameActive = true;
    currentPiece = null;
    currentX = 3;
    currentY = 0;
    updateStats();
    spawnPiece();
    drawBoard();
}

function showGameOverModal() {
    const modal = document.getElementById('gameOverModal');
    const scoreDiv = document.getElementById('gameOverScore');
    const finalScore = score; // Capture score before reset
    if (modal && scoreDiv) {
        scoreDiv.textContent = `Your Score: ${finalScore}`;
        modal.style.display = 'flex';
    }
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.onclick = function() {
            modal.style.display = 'none';
            waitingToStart = true;
            showStartScreen();
        };
    }
    const submitScoreBtn = document.getElementById('submitScoreBtn');
    if (submitScoreBtn) {
        submitScoreBtn.onclick = function() {
            const nameInput = document.getElementById('playerNameInput');
            let name = nameInput.value.trim() || 'Anonymous';
            let scores = [];
            try {
                scores = JSON.parse(localStorage.getItem('tetrisLeaderboard')) || [];
            } catch (e) {}
            scores.push({ name, score: finalScore });
            scores.sort((a, b) => b.score - a.score);
            localStorage.setItem('tetrisLeaderboard', JSON.stringify(scores));
            modal.style.display = 'none';
            showLeaderboardModal();
        };
    }
}

function showLeaderboardModal() {
    const modal = document.getElementById('leaderboardModal');
    const content = document.getElementById('leaderboardContent');
    let scores = [];
    try {
        scores = JSON.parse(localStorage.getItem('tetrisLeaderboard')) || [];
    } catch (e) {}
    if (scores.length > 0) {
        content.innerHTML = '<ol style="text-align:left;">' + scores.slice(0,10).map(s => `<li><strong>${s.name}</strong>: ${s.score}</li>`).join('') + '</ol>';
    } else {
        content.innerHTML = 'No scores yet.';
    }
    modal.style.display = 'flex';
    const closeBtn = document.getElementById('closeLeaderboardBtn');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            waitingToStart = true;
            showStartScreen();
        };
    }
}

const showLeaderboardBtn = document.getElementById('showLeaderboardBtn');
if (showLeaderboardBtn) {
    showLeaderboardBtn.onclick = function() {
        showLeaderboardModal();
    };
}

function spawnPiece() {
    const idx = Math.floor(Math.random() * PIECES.length);
    currentPiece = PIECES[idx];
    currentX = 3;
    currentY = 0;
    if (collides(currentPiece.shape, currentX, currentY)) {
        gameActive = false;
        waitingToStart = true;
        showGameOverModal();
    }
}

function drawPiece() {
    for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
            if (currentPiece.shape[r][c]) {
                ctx.fillStyle = 'blue';
                ctx.fillRect((currentX + c) * BLOCK_SIZE, (currentY + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#222';
                ctx.strokeRect((currentX + c) * BLOCK_SIZE, (currentY + r) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

function collides(shape, x, y) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                let newX = x + c;
                let newY = y + r;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
            if (currentPiece.shape[r][c]) {
                board[currentY + r][currentX + c] = currentPiece.color;
            }
        }
    }
}

function updateStats() {
    const statsDiv = document.getElementById('gameStats');
    if (statsDiv) {
        statsDiv.innerHTML = `<span style='color:#e0e8f0;font-weight:bold;'>Score:</span> ${score} &nbsp; <span style='color:#e0e8f0;font-weight:bold;'>Lines:</span> ${lines}`;
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell)) {
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            r++; // recheck same row
        }
    }
    if (linesCleared) {
        // Standard Tetris scoring: 1=100, 2=300, 3=500, 4=800
        const scores = [0, 100, 300, 500, 800];
        score += scores[linesCleared] || (linesCleared * 100);
        lines += linesCleared;
        updateStats();
    }
}

function drop() {
    if (!gameActive) return;
    if (!currentPiece) spawnPiece();
    // Check if piece would go out of board bounds (not just canvas)
    if (!collides(currentPiece.shape, currentX, currentY + 1)) {
        currentY++;
    } else {
        mergePiece();
        clearLines();
        spawnPiece();
    }
    drawBoard();
}

dropTimer = setInterval(function() {
    if (!gameActive || waitingToStart) return;
    drop();
}, dropInterval);

document.addEventListener('keydown', function(e) {
    // Prevent default scrolling for Arrow keys
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
    }
    if (waitingToStart) {
        if (
            e.key === 'a' || e.key === 'A' ||
            e.key === 'd' || e.key === 'D' ||
            e.key === 'ArrowLeft' || e.key === 'ArrowRight'
        ) {
            waitingToStart = false;
            resetGame();
        }
        return;
    }
    if (!gameActive) return;
    if (!currentPiece) return;
    // Move left
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        if (!collides(currentPiece.shape, currentX - 1, currentY)) {
            currentX--;
        }
    }
    // Move right
    else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        if (!collides(currentPiece.shape, currentX + 1, currentY)) {
            currentX++;
        }
    }
    // Soft drop
    else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        if (!collides(currentPiece.shape, currentX, currentY + 1)) {
            currentY++;
        }
    }
    // Rotate
    else if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        // Rotate piece (clockwise)
        let rotated = rotateMatrix(currentPiece.shape);
        if (!collides(rotated, currentX, currentY)) {
            currentPiece.shape = rotated;
        }
    }
    // Hard drop
    else if (e.key === ' ') {
        while (!collides(currentPiece.shape, currentX, currentY + 1)) {
            currentY++;
        }
        drop();
    }
    drawBoard();
});

function rotateMatrix(matrix) {
    // Transpose and reverse rows for clockwise rotation
    const rows = matrix.length;
    const cols = matrix[0].length;
    let result = [];
    for (let c = 0; c < cols; c++) {
        result[c] = [];
        for (let r = rows - 1; r >= 0; r--) {
            result[c][rows - 1 - r] = matrix[r][c];
        }
    }
    return result;
}

// Initial start screen
showStartScreen();
