// Game active state
let gameActive = true;

// Bricks array
let bricks = [];
// Initialize bricks array
function initBricks() {
    bricks = [];
    brickOffsetLeft = (canvas.width - (brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding)) / 2;
    let maxHealth = Math.min(2 + Math.floor(level/2), 5); // Max health increases with level
    for(let c=0; c<brickColumnCount; c++) {
        bricks[c] = [];
        for(let r=0; r<brickRowCount; r++) {
            // Assign random health between 1 and maxHealth
            let health = Math.floor(Math.random() * maxHealth) + 1;
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                health: health
            };
        }
    }
    console.log('Bricks initialized:', bricks);
}

// Simple Block Breaker Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let ballRadius = 8;
let x = canvas.width / 2;
let y = canvas.height - 30;
let dx = 0;
let dy = 0;
let waitingToShoot = true; // Start in aiming mode
let aimAngle = Math.PI / 4; // Default angle
let mouseAimX = x + 60 * Math.cos(aimAngle);
function collisionDetection() {
    // Ball and brick collision (improved: check ball overlap with brick using radius)
    for(let c=0; c<brickColumnCount; c++) {
        if (!bricks[c]) { continue; }
        for(let r=0; r<brickRowCount; r++) {
            if (!bricks[c][r]) { continue; }
            let b = bricks[c][r];
            if(b && b.status === 1) {
                // Improved collision: check if ball overlaps brick
                let closestX = Math.max(b.x, Math.min(x, b.x + brickWidth));
                let closestY = Math.max(b.y, Math.min(y, b.y + brickHeight));
                let distX = x - closestX;
                let distY = y - closestY;
                let distance = Math.sqrt(distX * distX + distY * distY);
                if(distance < ballRadius) {
                    dy = -dy;
                    b.health--;
                    if(b.health <= 0) {
                        b.status = 0;
                        score += 10; // Add points for breaking a brick
                        spawnPowerUp(b.x + brickWidth/2, b.y + brickHeight/2);
                    }
                }
            }
        }
    }
    // Ball and paddle collision
    if(y + dy > canvas.height - ballRadius - paddleHeight) {
        if(x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        }
    }
}
let mouseAimY = y - 60 * Math.sin(aimAngle);
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;

let brickRowCount = 5;
let brickColumnCount = 7;
let brickWidth = 75;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 0; // will be recalculated
let score = 0;
let lives = 3;
let level = 1;

// Power-up system
let powerUps = [];
const powerUpTypes = ['life', 'wide', 'slow', 'multi', 'sticky'];
function spawnPowerUp(x, y) {
    // 5% chance to spawn a power-up (was 10%)
    if (Math.random() < 0.05) {
        // Make extra life exceptionally rare
        let type;
        if (Math.random() < 0.01) { // 1% chance among power-ups (was 2%)
            type = 'life';
        } else {
            // Choose among other power-ups
            const otherTypes = ['wide', 'slow', 'multi', 'sticky'];
            // Reduce chance for each power-up type
            // 25% wide, 25% slow, 25% multi, 25% sticky
            type = otherTypes[Math.floor(Math.random() * otherTypes.length)];
        }
        powerUps.push({ x, y, type, active: true });
    }
}
let baseBallSpeed = 6; // 1.5x original speed (original was 4)
function draw() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Always ensure bricks are initialized before drawing
    if (!bricks || !bricks.length || !bricks[0] || !bricks[0].length) {
        initBricks();
    }
    drawBricks();
    drawBall();
    drawPaddle();
    updateStats();
    // updateLeaderboard(); // Commenting out leaderboard update
    // Draw power-ups
    powerUps.forEach(pu => {
        if(pu.active) {
            ctx.beginPath();
            ctx.arc(pu.x, pu.y, 10, 0, Math.PI*2);
            ctx.fillStyle = pu.type === 'life' ? '#4caf50' : pu.type === 'wide' ? '#2196f3' : pu.type === 'slow' ? '#ff9800' : pu.type === 'multi' ? '#9c27b0' : '#f44336';
            ctx.fill();
            ctx.closePath();
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(pu.type.toUpperCase(), pu.x, pu.y+4);
        }
    });

    if (!waitingToShoot) {
        collisionDetection();

        // Ball movement
        if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) {
            dx = -dx;
            // Add small random angle to prevent perfect horizontal bouncing
            let angleAdjust = (Math.random() - 0.5) * 0.3;
            let speed = Math.sqrt(dx*dx + dy*dy);
            let angle = Math.atan2(dy, dx) + angleAdjust;
            dx = speed * Math.cos(angle);
            dy = speed * Math.sin(angle);
        }
        if(y + dy < ballRadius) {
            dy = -dy;
            // Add small random angle to prevent perfect vertical bouncing
            let angleAdjust = (Math.random() - 0.5) * 0.3;
            let speed = Math.sqrt(dx*dx + dy*dy);
            let angle = Math.atan2(dy, dx) + angleAdjust;
            dx = speed * Math.cos(angle);
            dy = speed * Math.sin(angle);
        }
        // Paddle collision and life loss
        else if(y + dy > canvas.height-ballRadius) {
            // Only bounce if ball center is within paddle bounds (not just touching edge)
            if(x > paddleX - ballRadius && x < paddleX + paddleWidth + ballRadius) {
                dy = -dy;
                // Add larger random angle for unpredictable bounce
                let angleAdjust = (Math.random() - 0.5) * 0.8; // More chaotic
                let speed = Math.sqrt(dx*dx + dy*dy);
                let angle = Math.atan2(dy, dx) + angleAdjust;
                dx = speed * Math.cos(angle);
                dy = speed * Math.sin(angle);
                // Sticky effect
                if(window.stickyActive) {
                    dx = 0;
                    dy = 0;
                    waitingToShoot = true;
                    window.stickyActive = false;
                }
            }
            else {
                lives--;
                if(lives <= 0) {
                    gameOver();
                } else {
                    x = canvas.width/2;
                    y = canvas.height-30;
                    dx = 0;
                    dy = 0;
                    paddleX = (canvas.width - paddleWidth) / 2;
                    resetAiming();
                    // Only reset paddleX when losing a life or finishing a level
                }
            }
        }

        // Check for level completion
        let allBricksGone = true;
        for(let c=0; c<brickColumnCount; c++) {
            for(let r=0; r<brickRowCount; r++) {
                if(bricks[c][r] && bricks[c][r].status === 1) {
                    allBricksGone = false;
                    break;
                }
            }
            if(!allBricksGone) break;
        }
        if(allBricksGone) {
            level++;
            showLevelUpMessage();
            initBricks();
            x = canvas.width/2;
            y = canvas.height-30;
            dx = 0;
            dy = 0;
            paddleX = (canvas.width - paddleWidth) / 2;
            resetAiming();
            updateStats();
        }

        // Power-up movement and collision
        powerUps.forEach(pu => {
            if(pu.active) {
                pu.y += 3;
                // Paddle catch (improved bounds check)
                if(
                    pu.y + 10 > canvas.height - paddleHeight &&
                    pu.y - 10 < canvas.height &&
                    pu.x + 10 > paddleX &&
                    pu.x - 10 < paddleX + paddleWidth
                ) {
                    pu.active = false;
                    if(pu.type === 'life') {
                        lives++;
                    } else if(pu.type === 'wide') {
                        paddleWidth = Math.min(paddleWidth + 40, canvas.width);
                        setTimeout(() => { paddleWidth = 75; }, 10000);
                    } else if(pu.type === 'slow') {
                        dx *= 0.7;
                        dy *= 0.7;
                        setTimeout(() => {
                            let speed = baseBallSpeed + level * 0.7;
                            let angle = Math.atan2(dy, dx);
                            dx = speed * Math.cos(angle);
                            dy = speed * Math.sin(angle);
                        }, 10000);
                    } else if(pu.type === 'multi') {
                        // Spawn a second ball with slightly different angle
                        let speed = baseBallSpeed + level * 0.7;
                        let angle = Math.atan2(dy, dx) + 0.3;
                        // Add a new ball to the game (multi-ball)
                        // For now, just give extra points as a visible effect
                        score += 50;
                        // You can implement true multi-ball by tracking multiple balls
                    } else if(pu.type === 'sticky') {
                        // Next paddle catch will stick the ball
                        window.stickyActive = true;
                    }
                }
                // Missed power-up
                if(pu.y > canvas.height) {
                    pu.active = false;
                }
            }
        });

        if(rightPressed && paddleX < canvas.width-paddleWidth) {
            paddleX += 7;
        }
        else if(leftPressed && paddleX > 0) {
            paddleX -= 7;
        }

        x += dx;
        y += dy;
        requestAnimationFrame(draw);
    } else {
        // Draw aiming arrow using aimAngle
        const arrowLength = 60;
        const arrowX = x + arrowLength * Math.cos(aimAngle);
        const arrowY = y + arrowLength * Math.sin(aimAngle);
        ctx.save();
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();
        ctx.restore();

        // Draw instruction
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#ff6347';
        ctx.textAlign = 'center';
        ctx.fillText('AIM: ←/→ or A/D | SHOOT: SPACE', canvas.width/2, canvas.height/2);
        // No animation frame until shot
        requestAnimationFrame(draw);
    }
}
// Leaderboard logic

function showLevelUpMessage() {
    const statsDiv = document.getElementById('gameStats');
    if (statsDiv) {
        const oldHTML = statsDiv.innerHTML;
        statsDiv.innerHTML = `<span style="color:#4caf50;font-weight:bold;">Level Up! Difficulty Increased.</span>`;
        setTimeout(() => { statsDiv.innerHTML = oldHTML; }, 2000);
    }
}


function getRandomColor() {
    const colors = ['#ff69b4', '#ffd700', '#40e0d0', '#ff6347', '#7b68ee', '#00fa9a', '#ffa500', '#1e90ff'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = '#e53935'; // Ninja red
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
    // Draw shuriken spokes
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for(let i=0; i<4; i++) {
        ctx.rotate(Math.PI/2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ballRadius+4, 0);
        ctx.stroke();
    }
    ctx.restore();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = '#222'; // Ninja black
    ctx.shadowColor = '#e53935';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
    // Draw ninja sash
    ctx.save();
    ctx.fillStyle = '#e53935';
    ctx.fillRect(paddleX, canvas.height-paddleHeight+2, paddleWidth, 4);
    ctx.restore();
}

function drawBricks() {
    if (!Array.isArray(bricks) || !bricks.length || !Array.isArray(bricks[0])) { console.log('Bricks not initialized:', bricks); return; }
    for(let c=0; c<brickColumnCount; c++) {
        if (!bricks[c]) continue;
        for(let r=0; r<brickRowCount; r++) {
            let b = bricks[c][r];
            if (!b) continue;
            if(b.status === 1) {
                let brickX = (c*(brickWidth+brickPadding))+brickOffsetLeft;
                let brickY = (r*(brickHeight+brickPadding))+brickOffsetTop;
                b.x = brickX;
                b.y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                // Ninja colors: red, black, gray
                let color = b.health === 3 ? '#e53935' : b.health === 2 ? '#222' : '#757575';
                ctx.fillStyle = color;
                ctx.shadowColor = '#e53935';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.closePath();
                ctx.shadowBlur = 0;
                // Draw health number
                ctx.font = 'bold 14px Ninja Naruto, Arial';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';
                ctx.fillText(b.health, brickX + brickWidth/2, brickY + brickHeight/2 + 5);
            }
        }
    }
}


// Update statistics in external HTML
function updateStats() {
    const statsDiv = document.getElementById('gameStats');
    if (statsDiv) {
        statsDiv.innerHTML = `<span style="color:#ff6347;font-weight:bold;">Score:</span> ${score} &nbsp; <span style="color:#0095DD;font-weight:bold;">Lives:</span> ${lives} &nbsp; <span style="color:#7b68ee;font-weight:bold;">Level:</span> ${level}`;
    }
}

// Paddle movement and aiming controls

document.addEventListener('keydown', function(e) {
    if (waitingToShoot) {
        // Only allow aiming controls when waiting to shoot
        if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            aimAngle += Math.PI / 36; // rotate right
        } else if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            aimAngle -= Math.PI / 36; // rotate left
        } else if(e.code === 'Space') {
            // Shoot the ball in the aimed direction
            dx = baseBallSpeed * Math.cos(aimAngle);
            dy = baseBallSpeed * Math.sin(aimAngle); // Remove the negative sign
            waitingToShoot = false;
            // Reset paddle movement flags to prevent stuck movement
            rightPressed = false;
            leftPressed = false;
        }
    } else {
        // Only allow paddle controls when not aiming
        if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = true;
        } else if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = true;
        }
    }
});
document.addEventListener('keyup', function(e) {
    if (!waitingToShoot) {
        if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = false;
        } else if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = false;
        }
    }
});

draw();

function resetAiming() {
    waitingToShoot = true;
    aimAngle = Math.PI / 4;
    dx = 0;
    dy = 0;
    // paddleX reset removed
    console.log('Aiming mode activated');
}
// Scoreboard system
let scoreboard = [];

function showScoreFormModal() {
    gameActive = false;
    document.getElementById('scoreFormModal').style.display = 'flex';
    document.getElementById('playerNameModal').value = '';
    document.getElementById('submitScoreModal').onclick = function() {
        let name = document.getElementById('playerNameModal').value.trim() || 'Anonymous';
        let finalScore = score; // Capture score before reset
        // Save to localStorage for modal leaderboard
        let scores = [];
        try {
            scores = JSON.parse(localStorage.getItem('leaderboard')) || [];
        } catch (e) {}
        scores.push({ name, score: finalScore });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('leaderboard', JSON.stringify(scores));
        // Also update in-memory scoreboard for legacy code
        scoreboard.push({ name, score: finalScore });
        updateScoreboard();
        document.getElementById('scoreFormModal').style.display = 'none';
        gameActive = true;
        lives = 3;
        score = 0;
        level = 1;
        initBricks();
        x = canvas.width/2;
        y = canvas.height-30;
        dx = 0;
        dy = 0;
        paddleX = (canvas.width - paddleWidth) / 2;
        resetAiming();
        updateStats();
    };
}

function updateScoreboard() {
    let board = document.getElementById('scoreboard');
    if (!board) return;
    board.style.display = 'block';
    let sorted = scoreboard.slice().sort((a, b) => b.score - a.score);
    let html = '<b>Scoreboard</b><br><table style="width:100%;color:#fff;font-size:18px;margin-top:8px;">';
    html += '<tr><th>Name</th><th>Score</th></tr>';
    sorted.forEach(entry => {
        html += `<tr><td>${entry.name}</td><td>${entry.score}</td></tr>`;
    });
    html += '</table>';
    board.innerHTML = html;
}

function gameOver() {
    lives = 2;
    showScoreFormModal();
}

// In the main draw loop, add:
// if (!gameActive) return;
// ...existing code...


