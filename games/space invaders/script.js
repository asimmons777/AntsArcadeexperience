// ========== DOM ELEMENT REFERENCES ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreElement = document.getElementById('player-score');
const playerLivesElement = document.getElementById('player-lives');
const highScoreElement = document.getElementById('high-score');
const comboDisplayElement = document.getElementById('combo-display');
const scoreboardBtn = document.getElementById('scoreboardBtn');
const scoreboardModal = document.getElementById('scoreboardModal');
const nameModal = document.getElementById('nameModal');
const closeModal = document.getElementById('closeModal');
const playerNameInput = document.getElementById('playerNameInput');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const skipScoreBtn = document.getElementById('skipScoreBtn');
const clearScoresBtn = document.getElementById('clearScoresBtn');
const finalScoreElement = document.getElementById('finalScore');
const scoreboardList = document.getElementById('scoreboardList');

// ========== GAME STATE VARIABLES ==========
let gameRunning = false;
let animationId;

// ========== MAIN GAME OBJECT ==========
const game = {
    width: canvas.width,
    height: canvas.height,
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    combo: 0,
    maxCombo: 0,
    scoreMultiplier: 1,
    comboTimer: 0,
    lastHitTime: 0,
    bossLevel: false,
    bossDefeated: false
};

// ========== SCORE ANIMATION SYSTEM ==========
const scoreAnimations = [];

function createScoreAnimation(x, y, points, isBonus = false) {
    scoreAnimations.push({
        x: x,
        y: y,
        points: points,
        opacity: 1,
        scale: 1,
        time: 0,
        isBonus: isBonus,
        velocity: { x: 0, y: -2 }
    });
}

// ========== PLAYER SHIP OBJECT ==========
const player = {
    x: game.width / 2 - 25,
    y: game.height - 60,
    width: 50,
    height: 30,
    speed: 8,
    color: '#00ff00'
};

// ========== BULLET ARRAYS ==========
const playerBullets = [];
const invaderBullets = [];

// ========== INVADERS GRID ==========
const invaders = [];
const invaderRows = 5;
const invaderCols = 10;
const invaderWidth = 30;
const invaderHeight = 20;
const invaderSpacing = 10;

// ========== SPECIAL INVADERS AND POWER-UPS ==========
const specialInvaders = [];
const powerUps = [];

// Power-up types
const POWER_UP_TYPES = {
    RAPID_FIRE: { color: '#ff6600', duration: 5000, name: 'RAPID FIRE' },
    MULTI_SHOT: { color: '#ff0066', duration: 8000, name: 'MULTI SHOT' },
    SCORE_BOOST: { color: '#ffd700', duration: 10000, name: 'SCORE BOOST' },
    SHIELD: { color: '#00ffff', duration: 6000, name: 'SHIELD' }
};

// ========== BOSS SYSTEM ==========
const boss = {
    alive: false,
    x: 0,
    y: 0,
    width: 120,
    height: 80,
    speed: 2,
    direction: 1,
    health: 100,
    maxHealth: 100,
    phase: 1,
    maxPhases: 3,
    bossNumber: 1,
    currentPhasePattern: 0,
    attackTimer: 0,
    lastAttack: 0,
    movementPattern: 0,
    specialAttackTimer: 0,
    vulnerableTimer: 0,
    isVulnerable: true
};

// Active power-ups
const activePowerUps = [];

// Enhanced invader types with fewer, more focused varieties
const INVADER_TYPES = {
    // Basic formation enemies
    SCOUT: { 
        color: '#00ff41', 
        points: 10, 
        health: 1, 
        speed: 1, 
        shootChance: 0.001,
        description: 'Basic scout - fast and numerous'
    },
    SOLDIER: { 
        color: '#ff4444', 
        points: 20, 
        health: 1, 
        speed: 1, 
        shootChance: 0.002,
        description: 'Standard soldier - balanced threat'
    },
    CAPTAIN: { 
        color: '#ff6600', 
        points: 30, 
        health: 1, 
        speed: 1, 
        shootChance: 0.003,
        description: 'Officer class - high value target'
    },
    
    // Special enemy types
    HEAVY: { 
        color: '#cc4400', 
        points: 100, 
        health: 3, 
        speed: 0.7, 
        shootChance: 0.004,
        size: { width: 40, height: 30 },
        description: 'Heavy armor - slow but tough'
    },
    SPEEDER: { 
        color: '#4466ff', 
        points: 80, 
        health: 1, 
        speed: 2, 
        shootChance: 0.005,
        size: { width: 25, height: 15 },
        description: 'Fast attack craft - hard to hit'
    }
};

// Enemy behavior patterns
const BEHAVIOR_PATTERNS = {
    ZIGZAG: 'zigzag',
    DIVING: 'diving',
    CIRCULAR: 'circular',
    FORMATION: 'formation',
    KAMIKAZE: 'kamikaze',
    DEFENSIVE: 'defensive'
};

// ========== INVADER MOVEMENT ==========
let invaderDirection = 1; // 1 = right, -1 = left
let invaderSpeed = 1;
let invaderDropDistance = 20;
let lastInvaderShot = 0;

// ========== INPUT HANDLING ==========
const keys = {
    a: false,
    d: false,
    ' ': false, // spacebar
    ArrowLeft: false,
    ArrowRight: false
};

// ========== KEYBOARD EVENT LISTENERS ==========
document.addEventListener('keydown', (e) => {
    if (
        e.key.toLowerCase() === 'a' ||
        e.key.toLowerCase() === 'd' ||
        e.key === ' ' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
    ) {
        // Set the correct key to true
        if (e.key.toLowerCase() === 'a') keys.a = true;
        else if (e.key.toLowerCase() === 'd') keys.d = true;
        else if (e.key === ' ') keys[' '] = true;
        else if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
        else if (e.key === 'ArrowRight') keys.ArrowRight = true;

        // Auto-start game when player presses movement keys
        if (!gameRunning && !game.gameOver) {
            startGame();
        }
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (
        e.key.toLowerCase() === 'a' ||
        e.key.toLowerCase() === 'd' ||
        e.key === ' ' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
    ) {
        if (e.key.toLowerCase() === 'a') keys.a = false;
        else if (e.key.toLowerCase() === 'd') keys.d = false;
        else if (e.key === ' ') keys[' '] = false;
        else if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
        else if (e.key === 'ArrowRight') keys.ArrowRight = false;
        e.preventDefault();
    }
});

// ========== BUTTON EVENT LISTENERS ==========
scoreboardBtn.addEventListener('click', showScoreboard);
closeModal.addEventListener('click', hideScoreboard);
submitScoreBtn.addEventListener('click', submitScore);
skipScoreBtn.addEventListener('click', skipScore);
clearScoresBtn.addEventListener('click', clearAllScores);

// Close modals when clicking outside them
window.addEventListener('click', (e) => {
    if (e.target === scoreboardModal) {
        hideScoreboard();
    }
    if (e.target === nameModal) {
        skipScore();
    }
});

// Submit score when pressing Enter in name input
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitScore();
    }
});

// ========== DRAWING FUNCTIONS ==========
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawPlayer() {
    // Draw shield effect if active
    const shieldActive = activePowerUps.find(p => p.type === 'SHIELD');
    if (shieldActive) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 35, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Main ship body - detailed triangle design
    ctx.fillStyle = player.color;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 8;
    
    // Main hull
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y); // Top point
    ctx.lineTo(player.x + 5, player.y + player.height); // Bottom left
    ctx.lineTo(player.x + player.width - 5, player.y + player.height); // Bottom right
    ctx.closePath();
    ctx.fill();
    
    // Wing details
    ctx.fillStyle = '#008844';
    ctx.beginPath();
    ctx.moveTo(player.x + 8, player.y + player.height - 5);
    ctx.lineTo(player.x, player.y + player.height + 3);
    ctx.lineTo(player.x + 12, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(player.x + player.width - 8, player.y + player.height - 5);
    ctx.lineTo(player.x + player.width, player.y + player.height + 3);
    ctx.lineTo(player.x + player.width - 12, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit detail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine details
    ctx.fillStyle = '#004422';
    ctx.fillRect(player.x + player.width / 2 - 8, player.y + player.height - 3, 4, 6);
    ctx.fillRect(player.x + player.width / 2 + 4, player.y + player.height - 3, 4, 6);
    
    ctx.shadowBlur = 0;
    
    // Engine glow with more detail
    const engineGlow = Math.sin(Date.now() / 100) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0, 136, 255, ${engineGlow})`;
    ctx.beginPath();
    ctx.ellipse(player.x + player.width / 2 - 6, player.y + player.height + 8, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(player.x + player.width / 2 + 6, player.y + player.height + 8, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Weapon systems indicator
    const rapidFire = activePowerUps.find(p => p.type === 'RAPID_FIRE');
    const multiShot = activePowerUps.find(p => p.type === 'MULTI_SHOT');
    
    if (rapidFire || multiShot) {
        ctx.strokeStyle = rapidFire ? '#ff6600' : '#ff0066';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x + 5, player.y + 5);
        ctx.lineTo(player.x + player.width - 5, player.y + 5);
        ctx.stroke();
    }
}

function drawInvaders() {
    invaders.forEach((invader, index) => {
        if (invader.alive) {
            const invaderType = INVADER_TYPES[invader.type];
            
            // Calculate health percentage for visual effects
            const healthPercent = invader.health / invader.maxHealth;
            
            // Draw different shapes based on type
            ctx.fillStyle = invader.color;
            ctx.shadowColor = invader.color;
            ctx.shadowBlur = 6;
            
            drawInvaderByType(invader, invaderType);
            
            ctx.shadowBlur = 0;
            
            // Draw health bar for damaged enemies
            if (invader.health < invader.maxHealth && invader.maxHealth > 1) {
                drawHealthBar(invader, healthPercent);
            }
            
            // Draw special effects based on type
            drawInvaderEffects(invader, invaderType);
        }
    });
    
    // Draw special invaders with enhanced visuals
    specialInvaders.forEach(invader => {
        if (invader.alive) {
            const invaderType = INVADER_TYPES[invader.type];
            const healthPercent = invader.health / invader.maxHealth;
            
            ctx.fillStyle = invader.color;
            ctx.shadowColor = invader.color;
            ctx.shadowBlur = 10;
            
            drawInvaderByType(invader, invaderType);
            
            ctx.shadowBlur = 0;
            
            // Health bar for special invaders
            if (invader.health < invader.maxHealth) {
                drawHealthBar(invader, healthPercent);
            }
            
            // Special effects
            drawInvaderEffects(invader, invaderType);
        }
    });
}

function drawInvaderByType(invader, invaderType) {
    const time = Date.now() / 1000;
    
    switch(invader.type) {
        case 'SCOUT':
            // Detailed triangle scout ship
            ctx.beginPath();
            ctx.moveTo(invader.x + invader.width/2, invader.y);
            ctx.lineTo(invader.x + 5, invader.y + invader.height);
            ctx.lineTo(invader.x + invader.width - 5, invader.y + invader.height);
            ctx.closePath();
            ctx.fill();
            
            // Scout details
            ctx.fillStyle = '#003d1a';
            ctx.fillRect(invader.x + invader.width/2 - 2, invader.y + 5, 4, 8);
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(invader.x + invader.width/2, invader.y + 3, 1, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'SOLDIER':
            // Detailed rectangular soldier ship
            ctx.fillRect(invader.x + 3, invader.y, invader.width - 6, invader.height);
            
            // Soldier details - weapons and cockpit
            ctx.fillStyle = '#000';
            ctx.fillRect(invader.x + 5, invader.y + 2, 3, 4);
            ctx.fillRect(invader.x + invader.width - 8, invader.y + 2, 3, 4);
            ctx.fillRect(invader.x + invader.width/2 - 2, invader.y + 8, 4, 6);
            
            // Engine details
            ctx.fillStyle = '#220000';
            ctx.fillRect(invader.x + 8, invader.y + invader.height - 2, 4, 4);
            ctx.fillRect(invader.x + invader.width - 12, invader.y + invader.height - 2, 4, 4);
            
            // Cockpit window
            ctx.fillStyle = '#88ccff';
            ctx.fillRect(invader.x + invader.width/2 - 3, invader.y + 3, 6, 3);
            break;
            
        case 'CAPTAIN':
            // Detailed pentagon captain ship
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                const px = invader.x + invader.width/2 + 12 * Math.cos(angle);
                const py = invader.y + invader.height/2 + 10 * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            
            // Captain details - command center and weapons
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(invader.x + invader.width/2, invader.y + invader.height/2, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(invader.x + invader.width/2, invader.y + invader.height/2, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Weapon ports
            ctx.fillStyle = '#330000';
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI) / 5;
                const px = invader.x + invader.width/2 + 8 * Math.cos(angle);
                const py = invader.y + invader.height/2 + 6 * Math.sin(angle);
                ctx.fillRect(px - 1, py - 1, 2, 2);
            }
            break;
            
        case 'HEAVY':
            // Large, detailed heavy ship
            ctx.fillRect(invader.x - 5, invader.y - 5, invader.width + 10, invader.height + 10);
            
            // Heavy armor plating
            ctx.fillStyle = '#663300';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(invader.x - 3 + i * 8, invader.y - 3, 6, 4);
                ctx.fillRect(invader.x - 3 + i * 8, invader.y + invader.height - 1, 6, 4);
            }
            
            // Central command section
            ctx.fillStyle = '#000';
            ctx.fillRect(invader.x + invader.width/2 - 6, invader.y + 2, 12, 8);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(invader.x + invader.width/2 - 4, invader.y + 4, 8, 4);
            
            // Heavy weapons
            ctx.fillStyle = '#330000';
            ctx.fillRect(invader.x + 2, invader.y + invader.height/2 - 2, 8, 4);
            ctx.fillRect(invader.x + invader.width - 10, invader.y + invader.height/2 - 2, 8, 4);
            
            // Engine exhausts
            ctx.fillStyle = '#ff6600';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(invader.x + 5 + i * 10, invader.y + invader.height + 2, 4, 6);
            }
            break;
            
        case 'SPEEDER':
            // Sleek diamond speeder
            ctx.beginPath();
            ctx.moveTo(invader.x + invader.width/2, invader.y);
            ctx.lineTo(invader.x + invader.width, invader.y + invader.height/2);
            ctx.lineTo(invader.x + invader.width/2, invader.y + invader.height);
            ctx.lineTo(invader.x, invader.y + invader.height/2);
            ctx.closePath();
            ctx.fill();
            
            // Speed details - aerodynamic features
            ctx.fillStyle = '#2244aa';
            ctx.beginPath();
            ctx.moveTo(invader.x + invader.width/2, invader.y + 2);
            ctx.lineTo(invader.x + invader.width - 3, invader.y + invader.height/2);
            ctx.lineTo(invader.x + invader.width/2, invader.y + invader.height - 2);
            ctx.lineTo(invader.x + 3, invader.y + invader.height/2);
            ctx.closePath();
            ctx.fill();
            
            // Engine trails
            ctx.fillStyle = '#8899ff';
            ctx.fillRect(invader.x + invader.width/2 - 1, invader.y + invader.height, 2, 4);
            
            // Cockpit
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(invader.x + invader.width/2, invader.y + invader.height/2, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

function drawHealthBar(invader, healthPercent) {
    const barWidth = invader.width;
    const barHeight = 3;
    const barX = invader.x;
    const barY = invader.y - 8;
    
    // Background
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthColor = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
}

function drawInvaderEffects(invader, invaderType) {
    const time = Date.now() / 1000;
    
    switch(invader.type) {
        case 'SPEEDER':
            // Speed trails
            ctx.fillStyle = 'rgba(68, 102, 255, 0.4)';
            for (let i = 1; i <= 2; i++) {
                const alpha = 0.4 / i;
                ctx.fillStyle = `rgba(68, 102, 255, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(invader.x + invader.width/2, invader.y + invader.height + i * 8);
                ctx.lineTo(invader.x + invader.width/2 + 3, invader.y + invader.height + i * 8 + 4);
                ctx.lineTo(invader.x + invader.width/2, invader.y + invader.height + i * 8 + 8);
                ctx.lineTo(invader.x + invader.width/2 - 3, invader.y + invader.height + i * 8 + 4);
                ctx.closePath();
                ctx.fill();
            }
            break;
            
        case 'HEAVY':
            // Smoke/exhaust from engines
            ctx.fillStyle = 'rgba(100, 50, 0, 0.3)';
            for (let i = 0; i < 3; i++) {
                const offsetX = invader.x + 5 + i * 10 + 2;
                const offsetY = invader.y + invader.height + 8;
                ctx.beginPath();
                ctx.arc(offsetX, offsetY + Math.sin(time * 4 + i) * 3, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }
}

// Helper drawing functions
function drawTriangle(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();
}

function drawPentagon(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

function drawDiamond(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
}

function drawOval(x, y, width, height) {
    ctx.beginPath();
    ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function drawBoss() {
    if (!boss.alive) return;
    
    const time = Date.now() / 1000;
    const healthPercent = boss.health / boss.maxHealth;
    
    // Boss glow effect based on phase
    let glowColor = '#ff0000';
    switch (boss.phase) {
        case 1: glowColor = '#ff6600'; break;
        case 2: glowColor = '#ff0066'; break;
        case 3: glowColor = '#ff0000'; break;
    }
    
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    
    // Main boss body (large hexagon)
    ctx.fillStyle = glowColor;
    drawHexagon(boss.x + boss.width/2, boss.y + boss.height/2, boss.width/3);
    
    // Boss core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(boss.x + boss.width/2, boss.y + boss.height/2, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Phase indicators (side weapons)
    for (let i = 0; i < boss.phase; i++) {
        const sideX = boss.x + (i * boss.width / (boss.phase + 1)) + boss.width / (boss.phase + 1);
        const sideY = boss.y + boss.height - 10;
        
        ctx.fillStyle = '#ffff00';
        drawTriangle(sideX, sideY, 8);
    }
    
    // Boss engines (animated)
    const engineGlow = Math.sin(time * 10) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 100, 0, ${engineGlow})`;
    for (let i = 0; i < 4; i++) {
        const engineX = boss.x + (i * boss.width / 3) + boss.width / 6;
        const engineY = boss.y + boss.height;
        ctx.fillRect(engineX, engineY, 8, 12);
    }
    
    // Boss health bar
    const barWidth = boss.width;
    const barHeight = 8;
    const barX = boss.x;
    const barY = boss.y - 15;
    
    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Health
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    ctx.shadowBlur = 0;
    
    // Boss name and phase display
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS - PHASE ${boss.phase}`, boss.x + boss.width/2, boss.y - 25);
    ctx.textAlign = 'left';
}

function drawBullets() {
    // Draw player bullets with enhanced effects
    playerBullets.forEach(bullet => {
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        drawRect(bullet.x, bullet.y, bullet.width, bullet.height, '#ffff00');
        ctx.shadowBlur = 0;
        
        // Add trail effect
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        drawRect(bullet.x - 1, bullet.y + bullet.height, bullet.width + 2, 10, 'rgba(255, 255, 0, 0.3)');
    });
    
    // Draw invader bullets with different types and effects
    invaderBullets.forEach(bullet => {
        switch(bullet.type) {
            case 'heavy':
                ctx.fillStyle = '#cc4400';
                ctx.shadowColor = '#cc4400';
                ctx.shadowBlur = 8;
                break;
            case 'fast':
                ctx.fillStyle = '#4466ff';
                ctx.shadowColor = '#4466ff';
                ctx.shadowBlur = 6;
                break;
            default:
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 6;
        }
        
        drawRect(bullet.x, bullet.y, bullet.width, bullet.height, ctx.fillStyle);
        ctx.shadowBlur = 0;
        
        // Add type-specific effects
        if (bullet.type === 'heavy') {
            // Smoke trail for heavy bullets
            ctx.fillStyle = 'rgba(204, 68, 0, 0.2)';
            drawRect(bullet.x - 2, bullet.y + bullet.height, bullet.width + 4, 8, 'rgba(204, 68, 0, 0.2)');
        } else if (bullet.type === 'fast') {
            // Energy trail for fast bullets
            ctx.fillStyle = 'rgba(68, 102, 255, 0.3)';
            drawRect(bullet.x, bullet.y + bullet.height, bullet.width, 6, 'rgba(68, 102, 255, 0.3)');
        }
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        if (powerUp.active) {
            // Draw power-up with rotating glow effect
            const time = Date.now() / 1000;
            const pulse = Math.sin(time * 4) * 0.3 + 0.7;
            
            ctx.fillStyle = powerUp.color;
            ctx.shadowColor = powerUp.color;
            ctx.shadowBlur = 15 * pulse;
            
            // Draw hexagon shape
            drawHexagon(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 12);
            ctx.shadowBlur = 0;
            
            // Draw icon/letter in center
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(powerUp.type.charAt(0), powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 4);
        }
    });
}

function drawHexagon(x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) {
            ctx.moveTo(hx, hy);
        } else {
            ctx.lineTo(hx, hy);
        }
    }
    ctx.closePath();
    ctx.fill();
}

function drawScoreAnimations() {
    for (let i = scoreAnimations.length - 1; i >= 0; i--) {
        const anim = scoreAnimations[i];
        
        // Update animation
        anim.time += 1;
        anim.y += anim.velocity.y;
        anim.opacity = Math.max(0, 1 - anim.time / 60);
        anim.scale = 1 + anim.time / 120;
        
        if (anim.opacity <= 0) {
            scoreAnimations.splice(i, 1);
            continue;
        }
        
        // Draw score text
        ctx.save();
        ctx.globalAlpha = anim.opacity;
        ctx.font = `${Math.floor(16 * anim.scale)}px Arial`;
        ctx.textAlign = 'center';
        
        if (anim.isBonus) {
            ctx.fillStyle = '#ffd700';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.fillText(`+${anim.points} BONUS!`, anim.x, anim.y);
        } else {
            ctx.fillStyle = '#00ff41';
            ctx.shadowColor = '#00ff41';
            ctx.shadowBlur = 5;
            ctx.fillText(`+${anim.points}`, anim.x, anim.y);
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

function drawComboMeter() {
    if (game.combo > 1) {
        const x = 20;
        const y = 50;
        const width = 200;
        const height = 8;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);
        
        // Combo bar
        const comboProgress = Math.min(1, (Date.now() - game.lastHitTime) / 3000);
        ctx.fillStyle = `hsl(${120 - comboProgress * 120}, 100%, 50%)`;
        ctx.fillRect(x, y, width * (1 - comboProgress), height);
        
        // Combo text
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`COMBO x${game.combo}`, x, y - 5);
    }
}

// ========== GAME LOGIC FUNCTIONS ==========
function updatePlayer() {
    // Move player left
    if ((keys.a || keys.ArrowLeft) && player.x > 0) {
        player.x -= player.speed;
    }
    // Move player right
    if ((keys.d || keys.ArrowRight) && player.x < game.width - player.width) {
        player.x += player.speed;
    }
    
    // Shoot bullet
    if (keys[' '] && canPlayerShoot()) {
        shootPlayerBullet();
    }
}

let lastPlayerShot = 0;
function canPlayerShoot() {
    const rapidFire = activePowerUps.find(p => p.type === 'RAPID_FIRE');
    const cooldown = rapidFire ? 100 : 250; // Faster shooting with rapid fire
    return Date.now() - lastPlayerShot > cooldown;
}

function shootPlayerBullet() {
    const multiShot = activePowerUps.find(p => p.type === 'MULTI_SHOT');
    
    if (multiShot) {
        // Shoot multiple bullets
        for (let i = -1; i <= 1; i++) {
            playerBullets.push({
                x: player.x + player.width / 2 - 2 + (i * 10),
                y: player.y,
                width: 4,
                height: 10,
                speed: 10
            });
        }
    } else {
        // Normal single shot
        playerBullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: 10
        });
    }
    
    lastPlayerShot = Date.now();
}

function updateBullets() {
    // Update player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.y -= bullet.speed;
        
        // Remove bullets that go off screen
        if (bullet.y < 0) {
            playerBullets.splice(i, 1);
        }
    }
    
    // Update invader bullets with enhanced movement for boss bullets
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        
        // Handle different bullet movement patterns
        switch (bullet.type) {
            case 'spread':
            case 'missile':
            case 'hell':
                // Angled movement
                bullet.x += Math.sin(bullet.angle) * bullet.speed;
                bullet.y += Math.cos(bullet.angle) * bullet.speed;
                break;
            default:
                // Standard downward movement
                bullet.y += bullet.speed;
        }
        
        // Remove bullets that go off screen
        if (bullet.y > game.height || bullet.x < -10 || bullet.x > game.width + 10) {
            invaderBullets.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    // Update power-up positions
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += powerUp.velocity.y;
        
        // Remove power-ups that fall off screen
        if (powerUp.y > game.height) {
            powerUps.splice(i, 1);
        }
    }
    
    // Update active power-ups (remove expired ones)
    for (let i = activePowerUps.length - 1; i >= 0; i--) {
        if (Date.now() >= activePowerUps[i].endTime) {
            activePowerUps.splice(i, 1);
        }
    }
    
    // Reset combo if too much time has passed
    if (Date.now() - game.lastHitTime > 3000 && game.combo > 1) {
        game.combo = 0;
        game.scoreMultiplier = 1;
    }
}

function updateSpecialInvaders() {
    // Move special invaders with their unique behaviors
    specialInvaders.forEach(invader => {
        if (invader.alive) {
            updateInvaderBehavior(invader);
            
            // Special invader shooting
            if (Math.random() < invader.shootChance) {
                shootInvaderBulletFromPosition(invader);
            }
        }
    });
    
    // Spawn rate increases with level but caps the max number
    const baseSpawnRate = 0.0002;
    const levelSpawnRate = baseSpawnRate * (1 + game.level * 0.1); // 10% increase per level
    const maxSpecialInvaders = Math.min(1 + Math.floor(game.level / 3), 3); // Max 3 at level 6+
    
    if (Math.random() < levelSpawnRate && specialInvaders.filter(inv => inv.alive).length < maxSpecialInvaders) {
        spawnSpecialInvader();
    }
    
    // Remove dead special invaders
    for (let i = specialInvaders.length - 1; i >= 0; i--) {
        if (!specialInvaders[i].alive) {
            specialInvaders.splice(i, 1);
        }
    }
}

function spawnSpecialInvader() {
    // Only spawn HEAVY and SPEEDER as special enemies
    const specialTypes = ['HEAVY', 'SPEEDER'];
    
    const type = specialTypes[Math.floor(Math.random() * specialTypes.length)];
    const invaderType = INVADER_TYPES[type];
    
    // Use custom size if defined, otherwise use default
    const size = invaderType.size || { width: invaderWidth, height: invaderHeight };
    
    const invader = {
        x: Math.random() * (game.width - size.width),
        y: -size.height,
        width: size.width,
        height: size.height,
        alive: true,
        type: type,
        color: invaderType.color,
        points: invaderType.points,
        health: invaderType.health,
        maxHealth: invaderType.health,
        speed: invaderType.speed,
        shootChance: invaderType.shootChance,
        // Behavior properties
        behaviorTimer: Date.now(),
        behaviorState: 0,
        originalX: Math.random() * (game.width - size.width),
        originalY: -size.height
    };
    
    specialInvaders.push(invader);
    
    // Show spawn notification
    createScoreAnimation(invader.x + invader.width/2, invader.y - 20, `${type} INCOMING!`, true);
}

function initializeInvaders() {
    invaders.length = 0; // Clear existing invaders
    
    // Create formation with diverse enemy types
    for (let row = 0; row < invaderRows; row++) {
        for (let col = 0; col < invaderCols; col++) {
            let type;
            
            // Assign types based on row (officers in front, scouts in back)
            if (row === 0) {
                type = 'CAPTAIN';
            } else if (row < 3) {
                type = 'SOLDIER';
            } else {
                type = 'SCOUT';
            }
            
            const invaderType = INVADER_TYPES[type];
            
            invaders.push({
                x: 75 + col * (invaderWidth + invaderSpacing),
                y: 50 + row * (invaderHeight + invaderSpacing),
                width: invaderWidth,
                height: invaderHeight,
                alive: true,
                type: type,
                color: invaderType.color,
                health: invaderType.health,
                maxHealth: invaderType.health,
                points: invaderType.points,
                speed: invaderType.speed,
                shootChance: invaderType.shootChance,
                // Behavior properties
                behaviorTimer: Math.random() * 1000,
                behaviorState: 0,
                originalX: 75 + col * (invaderWidth + invaderSpacing),
                originalY: 50 + row * (invaderHeight + invaderSpacing)
            });
        }
    }
    
    // Clear special invaders when resetting formation
    specialInvaders.length = 0;
}

function updateInvaders() {
    let moveDown = false;
    
    // Check if any invader hits the edge
    invaders.forEach(invader => {
        if (invader.alive) {
            if ((invader.x <= 0 && invaderDirection === -1) || 
                (invader.x >= game.width - invader.width && invaderDirection === 1)) {
                moveDown = true;
            }
        }
    });
    
    // Move invaders with individual behaviors
    if (moveDown) {
        invaderDirection *= -1;
        invaders.forEach(invader => {
            if (invader.alive) {
                invader.y += invaderDropDistance;
                // Reset behavior states on direction change
                invader.behaviorTimer = Date.now();
                invader.behaviorState = 0;
            }
        });
    } else {
        invaders.forEach(invader => {
            if (invader.alive) {
                updateInvaderBehavior(invader);
            }
        });
    }
    
    // Individual shooting for each invader type
    invaders.forEach(invader => {
        if (invader.alive && Math.random() < invader.shootChance) {
            shootInvaderBulletFromPosition(invader);
        }
    });
    
    // Check if invaders reached the bottom
    invaders.forEach(invader => {
        if (invader.alive && invader.y + invader.height >= player.y) {
            gameOver();
        }
    });
}

function updateInvaderBehavior(invader) {
    const time = Date.now();
    const invaderType = INVADER_TYPES[invader.type];
    
    switch(invader.type) {
        case 'SCOUT':
        case 'SOLDIER':
        case 'CAPTAIN':
            // Standard formation movement
            invader.x += invaderSpeed * invaderDirection * invaderType.speed;
            break;
            
        case 'HEAVY':
            // Slow, steady movement with slight vertical drift
            invader.x += invaderSpeed * invaderDirection * invaderType.speed;
            invader.y += Math.sin(time / 1000) * 0.3;
            break;
            
        case 'SPEEDER':
            // Fast, erratic movement with zigzag
            invader.x += invaderSpeed * invaderDirection * invaderType.speed;
            if (time - invader.behaviorTimer > 150) {
                invader.behaviorState = (invader.behaviorState + 1) % 6;
                invader.behaviorTimer = time;
            }
            invader.y += Math.sin(invader.behaviorState) * 1.5;
            break;
            
        default:
            invader.x += invaderSpeed * invaderDirection;
    }
}

function shootInvaderBulletFromPosition(invader) {
    const invaderType = INVADER_TYPES[invader.type];
    
    switch(invader.type) {
        case 'HEAVY':
            // Shoots larger, slower bullet
            invaderBullets.push({
                x: invader.x + invader.width / 2 - 3,
                y: invader.y + invader.height,
                width: 6,
                height: 12,
                speed: 2,
                type: 'heavy'
            });
            break;
            
        case 'SPEEDER':
            // Fast, small bullets
            invaderBullets.push({
                x: invader.x + invader.width / 2 - 1,
                y: invader.y + invader.height,
                width: 2,
                height: 8,
                speed: 5,
                type: 'fast'
            });
            break;
            
        default:
            // Standard bullet for scouts, soldiers, captains
            invaderBullets.push({
                x: invader.x + invader.width / 2 - 2,
                y: invader.y + invader.height,
                width: 4,
                height: 10,
                speed: 3,
                type: 'normal'
            });
    }
}

function shootInvaderBullet() {
    const aliveInvaders = invaders.filter(invader => invader.alive);
    if (aliveInvaders.length > 0) {
        const randomInvader = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        invaderBullets.push({
            x: randomInvader.x + randomInvader.width / 2 - 2,
            y: randomInvader.y + randomInvader.height,
            width: 4,
            height: 10,
            speed: 3
        });
    }
}

function checkCollisions() {
    // Player bullets hitting invaders
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        
        // Check regular invaders
        for (let j = 0; j < invaders.length; j++) {
            const invader = invaders[j];
            
            if (invader.alive &&
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {
                
                playerBullets.splice(i, 1);
                
                // Handle different health systems
                invader.health--;
                
                if (invader.health <= 0) {
                    invader.alive = false;
                    
                    // Calculate score with combo multiplier
                    const invaderType = INVADER_TYPES[invader.type];
                    let basePoints = invaderType.points;
                    
                    // Apply power-up bonus
                    const scoreBoost = activePowerUps.find(p => p.type === 'SCORE_BOOST');
                    if (scoreBoost) basePoints *= 2;
                    
                    // Apply combo multiplier
                    updateCombo();
                    const finalPoints = Math.floor(basePoints * game.scoreMultiplier);
                    
                    game.score += finalPoints;
                    createScoreAnimation(invader.x + invader.width/2, invader.y, finalPoints);
                    updateScore();
                    
                    // Chance to spawn power-up (reduced frequency)
                    let powerUpChance = 0.02; // Reduced from 0.05
                    if (['CAPTAIN', 'HEAVY'].includes(invader.type)) {
                        powerUpChance = 0.06; // Reduced from 0.12
                    }
                    
                    if (Math.random() < powerUpChance) {
                        spawnPowerUp(invader.x, invader.y);
                    }
                } else {
                    // Show damage feedback for multi-health enemies
                    createScoreAnimation(invader.x + invader.width/2, invader.y - 10, "HIT!", false);
                }
                
                break;
            }
        }
        
        // Check special invaders
        for (let j = 0; j < specialInvaders.length; j++) {
            const invader = specialInvaders[j];
            
            if (invader.alive &&
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {
                
                playerBullets.splice(i, 1);
                
                invader.health--;
                
                if (invader.health <= 0) {
                    invader.alive = false;
                    updateCombo();
                    
                    const invaderType = INVADER_TYPES[invader.type];
                    let basePoints = invaderType.points;
                    
                    const scoreBoost = activePowerUps.find(p => p.type === 'SCORE_BOOST');
                    if (scoreBoost) basePoints *= 2;
                    
                    const finalPoints = Math.floor(basePoints * game.scoreMultiplier);
                    game.score += finalPoints;
                    createScoreAnimation(invader.x + invader.width/2, invader.y, finalPoints, true);
                    updateScore();
                    
                    // Reduced power-up from special invaders (50% chance instead of guaranteed)
                    if (Math.random() < 0.5) {
                        spawnPowerUp(invader.x, invader.y);
                    }
                } else {
                    createScoreAnimation(invader.x + invader.width/2, invader.y - 10, "HIT!", false);
                }
                
                break;
            }
        }
        
        // Check boss collision
        if (boss.alive && boss.isVulnerable &&
            bullet.x < boss.x + boss.width &&
            bullet.x + bullet.width > boss.x &&
            bullet.y < boss.y + boss.height &&
            bullet.y + bullet.height > boss.y) {
            
            playerBullets.splice(i, 1);
            
            boss.health -= 5; // Boss takes more damage per hit
            
            if (boss.health <= 0) {
                boss.alive = false;
                game.bossDefeated = true;
                updateCombo();
                
                // Massive score bonus for defeating boss
                const bossPoints = 5000 + (game.level * 1000);
                const scoreBoost = activePowerUps.find(p => p.type === 'SCORE_BOOST');
                const finalPoints = scoreBoost ? bossPoints * 2 : bossPoints;
                
                game.score += finalPoints;
                createScoreAnimation(boss.x + boss.width/2, boss.y, finalPoints, true);
                updateScore();
                
                // Spawn fewer power-ups for boss defeat (reduced from 3 to 2)
                for (let k = 0; k < 2; k++) {
                    setTimeout(() => {
                        spawnPowerUp(boss.x + Math.random() * boss.width, boss.y + Math.random() * boss.height);
                    }, k * 200);
                }
            } else {
                createScoreAnimation(boss.x + boss.width/2, boss.y - 20, `${boss.health}HP`, false);
            }
            
            break;
        }
    }
    
    // Player collecting power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        if (powerUp.active &&
            powerUp.x < player.x + player.width &&
            powerUp.x + powerUp.width > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + powerUp.height > player.y) {
            
            activatePowerUp(powerUp.type);
            powerUps.splice(i, 1);
            
            // Bonus points for collecting power-up
            const bonusPoints = 50;
            game.score += bonusPoints;
            createScoreAnimation(powerUp.x + powerUp.width/2, powerUp.y, bonusPoints, true);
            updateScore();
        }
    }
    
    // Invader bullets hitting player (with shield check)
    const shieldActive = activePowerUps.find(p => p.type === 'SHIELD');
    if (!shieldActive) {
        for (let i = invaderBullets.length - 1; i >= 0; i--) {
            const bullet = invaderBullets[i];
            
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                
                // Player hit!
                invaderBullets.splice(i, 1);
                playerHit();
                break;
            }
        }
    } else {
        // Bullets bounce off shield
        for (let i = invaderBullets.length - 1; i >= 0; i--) {
            const bullet = invaderBullets[i];
            const dx = bullet.x - (player.x + player.width/2);
            const dy = bullet.y - (player.y + player.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 35) {
                invaderBullets.splice(i, 1);
                // Create deflection effect
                createScoreAnimation(bullet.x, bullet.y, "BLOCKED!", true);
            }
        }
    }
}

function updateCombo() {
    const now = Date.now();
    if (now - game.lastHitTime < 3000) { // 3 second combo window
        game.combo++;
        if (game.combo > game.maxCombo) game.maxCombo = game.combo;
    } else {
        game.combo = 1;
    }
    
    game.lastHitTime = now;
    game.scoreMultiplier = 1 + (game.combo - 1) * 0.25; // 25% bonus per combo hit
    updateComboDisplay();
}

// ========== BOSS SYSTEM FUNCTIONS ==========
function updateBoss() {
    if (!boss.alive) return;
    
    const time = Date.now();
    
    // Update boss movement patterns
    boss.movementPattern = Math.floor(time / 3000) % 3;
    
    switch (boss.movementPattern) {
        case 0: // Side to side movement
            boss.x += boss.speed * boss.direction;
            if (boss.x <= 0 || boss.x >= game.width - boss.width) {
                boss.direction *= -1;
            }
            break;
            
        case 1: // Diagonal movement
            boss.x += boss.speed * boss.direction;
            boss.y += Math.sin(time / 500) * 0.8;
            if (boss.x <= 0 || boss.x >= game.width - boss.width) {
                boss.direction *= -1;
            }
            break;
            
        case 2: // Figure-8 movement
            boss.x = game.width/2 + Math.sin(time / 1000) * 150 - boss.width/2;
            boss.y = 80 + Math.sin(time / 2000) * 30;
            break;
    }
    
    // Keep boss in bounds
    boss.x = Math.max(0, Math.min(boss.x, game.width - boss.width));
    boss.y = Math.max(30, Math.min(boss.y, 150));
    
    // Update boss phase based on health with more phases for advanced bosses
    const healthPercent = boss.health / boss.maxHealth;
    const maxPhases = boss.maxPhases || 3;
    
    if (maxPhases >= 5) {
        // 5-phase boss (very advanced)
        if (healthPercent > 0.8) boss.phase = 1;
        else if (healthPercent > 0.6) boss.phase = 2;
        else if (healthPercent > 0.4) boss.phase = 3;
        else if (healthPercent > 0.2) boss.phase = 4;
        else boss.phase = 5;
    } else if (maxPhases >= 4) {
        // 4-phase boss (advanced)
        if (healthPercent > 0.75) boss.phase = 1;
        else if (healthPercent > 0.5) boss.phase = 2;
        else if (healthPercent > 0.25) boss.phase = 3;
        else boss.phase = 4;
    } else {
        // 3-phase boss (standard)
        if (healthPercent > 0.66) boss.phase = 1;
        else if (healthPercent > 0.33) boss.phase = 2;
        else boss.phase = 3;
    }
    
    // Boss attacks
    updateBossAttacks(time);
}

function updateBossAttacks(time) {
    // Regular attacks
    if (time - boss.lastAttack > getBossAttackInterval()) {
        performBossAttack();
        boss.lastAttack = time;
    }
    
    // Special attacks based on phase
    if (time - boss.specialAttackTimer > 5000) {
        performBossSpecialAttack();
        boss.specialAttackTimer = time;
    }
}

function getBossAttackInterval() {
    // Progressively faster attacks based on boss number and phase
    const baseInterval = {
        1: 800,
        2: 600,
        3: 400,
        4: 300,
        5: 200
    };
    
    const currentInterval = baseInterval[Math.min(boss.phase, 5)] || 400;
    
    // Each boss gets significantly faster attacks
    const bossMultiplier = Math.max(0.2, 1 - (boss.bossNumber * 0.15)); // -15% per boss, min 20%
    const levelMultiplier = Math.max(0.3, 1 - (game.level * 0.03)); // Additional level scaling
    
    return Math.floor(currentInterval * bossMultiplier * levelMultiplier);
}

function performBossAttack() {
    const bossNumber = boss.bossNumber || 1;
    
    switch (boss.phase) {
        case 1:
            // Basic attacks scale with boss number
            if (bossNumber >= 3) {
                // Triple shot for boss 3+
                for (let i = -1; i <= 1; i++) {
                    shootBossBullet(boss.x + boss.width/2 + i * 20, boss.y + boss.height, 'normal');
                }
            } else {
                // Single shot for early bosses
                shootBossBullet(boss.x + boss.width/2, boss.y + boss.height, 'normal');
            }
            break;
            
        case 2:
            // Enhanced attacks
            const shotCount = Math.min(5, 3 + bossNumber);
            for (let i = 0; i < shotCount; i++) {
                const offset = (i - Math.floor(shotCount/2)) * 15;
                shootBossBullet(boss.x + boss.width/2 + offset, boss.y + boss.height, 'normal');
            }
            break;
            
        case 3:
            // Spread pattern scales with boss level
            const spreadCount = Math.min(7, 5 + bossNumber);
            for (let i = 0; i < spreadCount; i++) {
                const angle = ((i / (spreadCount - 1)) - 0.5) * Math.PI * 0.6; // 60 degree spread
                shootBossBullet(boss.x + boss.width/2, boss.y + boss.height, 'spread', angle);
            }
            break;
            
        case 4:
            // Advanced pattern for 4+ phase bosses
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                shootBossBullet(boss.x + boss.width/2, boss.y + boss.height, 'missile', angle);
            }
            break;
            
        case 5:
            // Ultimate pattern for 5-phase bosses
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                setTimeout(() => {
                    shootBossBullet(boss.x + boss.width/2, boss.y + boss.height, 'hell', angle);
                }, i * 30);
            }
            break;
    }
}

function performBossSpecialAttack() {
    switch (boss.phase) {
        case 1:
            // Laser beam
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    shootBossBullet(boss.x + boss.width/2, boss.y + boss.height, 'laser');
                }, i * 100);
            }
            break;
            
        case 2:
            // Missile barrage
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const angle = (i / 8) * Math.PI * 2;
                    shootBossBullet(boss.x + boss.width/2, boss.y + boss.height, 'missile', angle);
                }, i * 150);
            }
            break;
            
        case 3:
            // Bullet hell
            for (let i = 0; i < 16; i++) {
                setTimeout(() => {
                    const angle = (i / 16) * Math.PI * 2;
                    shootBossBullet(boss.x + boss.width/2, boss.y + boss.height, 'hell', angle);
                }, i * 50);
            }
            break;
    }
}

function shootBossBullet(x, y, type, angle = 0) {
    let bullet = {
        x: x - 3,
        y: y,
        width: 6,
        height: 12,
        speed: 4,
        type: type,
        angle: angle
    };
    
    switch (type) {
        case 'laser':
            bullet.width = 8;
            bullet.height = 20;
            bullet.speed = 6;
            break;
        case 'missile':
            bullet.width = 5;
            bullet.height = 15;
            bullet.speed = 3;
            break;
        case 'hell':
            bullet.width = 4;
            bullet.height = 8;
            bullet.speed = 5;
            break;
    }
    
    invaderBullets.push(bullet);
}

function spawnPowerUp(x, y) {
    const types = Object.keys(POWER_UP_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        width: 24,
        height: 24,
        type: randomType,
        color: POWER_UP_TYPES[randomType].color,
        active: true,
        velocity: { x: 0, y: 1 }
    });
}

function activatePowerUp(type) {
    // Remove existing power-up of same type
    for (let i = activePowerUps.length - 1; i >= 0; i--) {
        if (activePowerUps[i].type === type) {
            activePowerUps.splice(i, 1);
        }
    }
    
    // Add new power-up
    activePowerUps.push({
        type: type,
        endTime: Date.now() + POWER_UP_TYPES[type].duration
    });
    
    // Show activation message
    createScoreAnimation(player.x + player.width/2, player.y - 20, POWER_UP_TYPES[type].name, true);
}

function playerHit() {
    game.lives--;
    updateLives();
    
    // Reset combo when hit
    game.combo = 0;
    game.scoreMultiplier = 1;
    updateComboDisplay();
    
    if (game.lives <= 0) {
        gameOver();
    } else {
        // Reset player position and clear enemy bullets
        player.x = game.width / 2 - 25;
        invaderBullets.length = 0;
        
        // Brief invincibility effect
        createScoreAnimation(player.x + player.width/2, player.y - 20, "HIT!", false);
        
        // Flash effect for damage feedback
        setTimeout(() => {
            if (game.lives > 0) {
                createScoreAnimation(player.x + player.width/2, player.y - 20, `${game.lives} LIVES LEFT`, true);
            }
        }, 500);
    }
}

function checkLevelComplete() {
    // Check if it's a boss level
    if (game.bossLevel) {
        if (!boss.alive) {
            nextLevel();
        }
        return;
    }
    
    // Regular level completion check
    const aliveInvaders = invaders.filter(invader => invader.alive);
    if (aliveInvaders.length === 0) {
        nextLevel();
    }
}

function nextLevel() {
    game.level++;
    
    // Apply progressive difficulty scaling
    applyDifficultyScaling();
    
    // Much more restrictive bonus life system
    let bonusLifeAwarded = false;
    if (game.bossLevel && game.level >= 6) {
        // Only boss levels 6, 12, 18, etc. give bonus lives
        if (game.level % 6 === 0) {
            game.lives++;
            updateLives();
            createScoreAnimation(game.width/2, game.height/2 - 30, "BONUS LIFE!", true);
            bonusLifeAwarded = true;
        }
    }
    
    // Check if next level should be a boss level (every 3rd level)
    if (game.level % 3 === 0) {
        startBossLevel();
    } else {
        startRegularLevel();
    }
    
    playerBullets.length = 0;
    invaderBullets.length = 0;
    
    // Show level announcement with difficulty indicator
    const levelText = game.bossLevel ? `BOSS LEVEL ${game.level}` : `LEVEL ${game.level}`;
    const difficultyText = getDifficultyText();
    createScoreAnimation(game.width/2, game.height/2, levelText, true);
    setTimeout(() => {
        createScoreAnimation(game.width/2, game.height/2 + 30, difficultyText, false);
    }, 500);
    
    // Show bonus life notification if awarded
    if (bonusLifeAwarded) {
        setTimeout(() => {
            createScoreAnimation(game.width/2, game.height/2 + 60, "BOSS REWARD!", true);
        }, 1000);
    }
}

function startBossLevel() {
    game.bossLevel = true;
    game.bossDefeated = false;
    
    // Clear regular invaders
    invaders.length = 0;
    specialInvaders.length = 0;
    
    // Initialize boss with exponentially scaling difficulty
    boss.alive = true;
    boss.x = game.width / 2 - boss.width / 2;
    boss.y = 50;
    
    // Exponential health scaling - bosses get significantly harder
    const baseHealth = 100;
    const bossNumber = Math.floor(game.level / 3); // 1st boss = level 3, 2nd = level 6, etc.
    const healthMultiplier = Math.pow(1.6, bossNumber - 1); // 1x, 1.6x, 2.56x, 4.1x, etc.
    boss.maxHealth = Math.floor(baseHealth * healthMultiplier);
    boss.health = boss.maxHealth;
    
    // Progressive speed increase - faster with each boss
    const baseSpeed = 2;
    const speedMultiplier = 1 + (bossNumber - 1) * 0.3; // +30% speed per boss
    boss.speed = Math.min(6, baseSpeed * speedMultiplier); // Cap at speed 6
    
    // Enhanced phases for higher level bosses
    boss.maxPhases = Math.min(5, 3 + Math.floor(bossNumber / 2)); // More phases for later bosses
    boss.currentPhasePattern = bossNumber % 3; // Different attack patterns per boss
    
    boss.phase = 1;
    boss.attackTimer = 0;
    boss.lastAttack = 0;
    boss.movementPattern = 0;
    boss.specialAttackTimer = 0;
    boss.vulnerableTimer = 0;
    boss.isVulnerable = true;
    boss.direction = 1;
    boss.bossNumber = bossNumber;
    
    // Show enhanced boss stats
    createScoreAnimation(game.width/2, 100, `BOSS ${bossNumber} - HP: ${boss.maxHealth}`, true);
    setTimeout(() => {
        createScoreAnimation(game.width/2, 120, `SPEED: ${boss.speed.toFixed(1)}x`, false);
    }, 300);
}

function startRegularLevel() {
    game.bossLevel = false;
    boss.alive = false;
    
    // Enhanced formation with more diverse enemies at higher levels
    initializeInvaders();
    
    // Add more special invaders based on level
    const specialInvaderCount = Math.min(Math.floor(game.level / 2), 3); // Max 3 special invaders
    for (let i = 0; i < specialInvaderCount; i++) {
        setTimeout(() => {
            spawnSpecialInvader();
        }, 1000 + (i * 500));
    }
}

// ========== DIFFICULTY SCALING SYSTEM ==========
function applyDifficultyScaling() {
    // Increase invader movement speed
    const speedIncrease = 0.2 + (game.level * 0.1); // Exponential speed increase
    invaderSpeed = 1 + speedIncrease;
    
    // Increase invader shooting frequency based on level
    const shootMultiplier = 1 + (game.level * 0.15);
    Object.keys(INVADER_TYPES).forEach(type => {
        INVADER_TYPES[type].shootChance = INVADER_TYPES[type].shootChance * shootMultiplier;
    });
    
    // Decrease invader drop distance slightly for tighter formation
    invaderDropDistance = Math.max(15, 20 - game.level);
    
    console.log(`Level ${game.level} Difficulty:`, {
        speed: invaderSpeed.toFixed(2),
        shootMultiplier: shootMultiplier.toFixed(2),
        dropDistance: invaderDropDistance
    });
}

function getDifficultyText() {
    if (game.level <= 3) return "EASY";
    if (game.level <= 6) return "NORMAL";
    if (game.level <= 9) return "HARD";
    if (game.level <= 12) return "EXPERT";
    if (game.level <= 15) return "NIGHTMARE";
    return "IMPOSSIBLE";
}

function resetDifficultyScaling() {
    // Reset all difficulty values to base levels
    invaderSpeed = 1;
    invaderDropDistance = 20;
    
    // Reset invader shooting chances to original values
    INVADER_TYPES.SCOUT.shootChance = 0.001;
    INVADER_TYPES.SOLDIER.shootChance = 0.002;
    INVADER_TYPES.CAPTAIN.shootChance = 0.003;
    INVADER_TYPES.HEAVY.shootChance = 0.004;
    INVADER_TYPES.SPEEDER.shootChance = 0.005;
}

// ========== GAME OVER FUNCTION ==========
function gameOver() {
    gameRunning = false;
    game.gameOver = true;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Show name input if player scored points
    if (game.score > 0) {
        setTimeout(() => {
            showNameInput(game.score);
        }, 800);
    } else {
        setTimeout(() => {
            resetGame();
        }, 300);
    }
    
    console.log(`Game Over! Final Score: ${game.score} points`);
}

// ========== SCOREBOARD SYSTEM ==========
function getStoredScores() {
    const scores = localStorage.getItem('spaceInvadersHighScores');
    return scores ? JSON.parse(scores) : [];
}

function saveScores(scores) {
    localStorage.setItem('spaceInvadersHighScores', JSON.stringify(scores));
}

function getHighScore() {
    const scores = getStoredScores();
    return scores.length > 0 ? scores[0].score : 0;
}

function addScore(name, score) {
    const scores = getStoredScores();
    scores.push({ name: name.trim(), score: score, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    saveScores(scores);
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    const highScore = getHighScore();
    highScoreElement.textContent = highScore;
}

function showScoreboard() {
    scoreboardModal.style.display = 'block';
    displayScoreboard();
}

function hideScoreboard() {
    scoreboardModal.style.display = 'none';
}

function displayScoreboard() {
    const scores = getStoredScores();
    scoreboardList.innerHTML = '';
    
    if (scores.length === 0) {
        scoreboardList.innerHTML = '<div class="empty-scoreboard">No scores yet! Be the first to defend Earth!</div>';
        return;
    }
    
    const topScores = scores.slice(0, 10);
    
    topScores.forEach((scoreData, index) => {
        const scoreEntry = document.createElement('div');
        scoreEntry.className = 'score-entry';
        
        if (index === 0) scoreEntry.classList.add('rank-1');
        else if (index === 1) scoreEntry.classList.add('rank-2');
        else if (index === 2) scoreEntry.classList.add('rank-3');
        
        scoreEntry.innerHTML = `
            <div class="score-rank">#${index + 1}</div>
            <div class="score-name">${scoreData.name}</div>
            <div class="score-points">${scoreData.score}</div>
        `;
        
        scoreboardList.appendChild(scoreEntry);
    });
}

function showNameInput(score) {
    finalScoreElement.textContent = score;
    playerNameInput.value = '';
    nameModal.style.display = 'block';
    setTimeout(() => playerNameInput.focus(), 100);
}

function submitScore() {
    const playerName = playerNameInput.value.trim();
    
    if (playerName === '') {
        alert('Please enter your name!');
        return;
    }
    
    const score = game.score;
    addScore(playerName, score);
    nameModal.style.display = 'none';
    
    setTimeout(() => {
        alert(`Score saved! ${playerName}: ${score} points`);
        resetGame();
    }, 100);
}

function skipScore() {
    nameModal.style.display = 'none';
    resetGame();
}

function clearAllScores() {
    if (confirm('Are you sure you want to clear all high scores? This cannot be undone!')) {
        localStorage.removeItem('spaceInvadersHighScores');
        updateHighScoreDisplay();
        displayScoreboard();
        alert('All scores cleared!');
    }
}

// ========== SCORE UPDATE FUNCTIONS ==========
function updateScore() {
    playerScoreElement.textContent = game.score.toLocaleString();
}

function updateLives() {
    playerLivesElement.textContent = game.lives;
}

function updateComboDisplay() {
    if (comboDisplayElement) {
        comboDisplayElement.textContent = `x${game.scoreMultiplier.toFixed(2)}`;
        
        // Update color based on combo
        if (game.combo > 5) {
            comboDisplayElement.style.color = '#ffd700';
            comboDisplayElement.style.textShadow = '0 0 10px #ffd700';
        } else if (game.combo > 2) {
            comboDisplayElement.style.color = '#ff6600';
            comboDisplayElement.style.textShadow = '0 0 8px #ff6600';
        } else {
            comboDisplayElement.style.color = '#00ff41';
            comboDisplayElement.style.textShadow = '0 0 5px #00ff41';
        }
    }
}

// ========== RENDER FUNCTION ==========
function render() {
    // Clear canvas with a deep space gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.3, '#1a0a2e');
    gradient.addColorStop(0.6, '#2d1b3d');
    gradient.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);
    
    // Draw enhanced starfield effect
    drawStarfield();
    
    // Draw all game elements
    drawPlayer();
    drawInvaders();
    drawBoss();
    drawBullets();
    drawPowerUps();
    drawScoreAnimations();
    drawComboMeter();
    drawPowerUpIndicators();
    drawLivesDisplay();
}

function drawStarfield() {
    const time = Date.now();
    
    // Optimized starfield - reduced layers and removed expensive shadow effects
    for (let layer = 0; layer < 2; layer++) { // Reduced from 3 to 2 layers
        const layerSpeed = (layer + 1) * 25;
        const layerSize = (layer + 1) * 0.4;
        const layerCount = 20 - (layer * 6); // Reduced star count
        
        for (let i = 0; i < layerCount; i++) {
            const x = (time / layerSpeed + i * 157) % game.width;
            const y = (time / (layerSpeed * 0.7) + i * 263) % game.height;
            const twinkle = Math.sin(time / 1200 + i * 0.5) * 0.2 + 0.8; // Reduced twinkle intensity
            const size = layerSize * twinkle;
            
            // Simplified star colors
            const starColors = ['#ffffff', '#ffffcc'];
            ctx.fillStyle = starColors[i % starColors.length];
            ctx.globalAlpha = twinkle * 0.8; // Reduced opacity
            
            // Draw star without shadow (much faster)
            ctx.fillRect(x, y, size, size);
        }
    }
    
    // Draw fewer larger stars without expensive effects
    for (let i = 0; i < 4; i++) { // Reduced from 8 to 4
        const x = (time / 120 + i * 234) % game.width;
        const y = (time / 90 + i * 456) % game.height;
        const pulse = Math.sin(time / 1000 + i) * 0.3 + 0.7; // Reduced calculation frequency
        
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = pulse * 0.6;
        
        // Simple cross without shadow
        ctx.fillRect(x - 1, y - 2, 2, 4);
        ctx.fillRect(x - 2, y - 1, 4, 2);
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;
}

function drawLivesDisplay() {
    // Draw lives display in bottom left corner
    const livesX = 20;
    const livesY = game.height - 40;
    const shipSize = 12;
    const spacing = 20;
    
    // Draw "LIVES:" label
    ctx.fillStyle = '#00ffff';
    ctx.font = '14px Orbitron, monospace';
    ctx.fillText('LIVES:', livesX, livesY - 20);
    
    // Draw mini player ships for each life
    for (let i = 0; i < game.lives; i++) {
        const shipX = livesX + (i * spacing);
        const shipY = livesY;
        
        // Draw mini ship similar to the player ship but smaller
        ctx.save();
        ctx.translate(shipX + shipSize/2, shipY);
        
        // Ship body (triangle)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(0, -shipSize/2);
        ctx.lineTo(-shipSize/3, shipSize/2);
        ctx.lineTo(shipSize/3, shipSize/2);
        ctx.closePath();
        ctx.fill();
        
        // Ship details
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -shipSize/4, 4, shipSize/3);
        
        // Ship engines
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-shipSize/4, shipSize/3, 3, 3);
        ctx.fillRect(shipSize/4 - 3, shipSize/3, 3, 3);
        
        ctx.restore();
    }
}

function drawPowerUpIndicators() {
    if (activePowerUps.length > 0) {
        const startY = 100;
        activePowerUps.forEach((powerUp, index) => {
            const timeLeft = powerUp.endTime - Date.now();
            const duration = POWER_UP_TYPES[powerUp.type].duration;
            const progress = timeLeft / duration;
            
            const x = 20;
            const y = startY + index * 30;
            
            // Background bar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, 150, 20);
            
            // Progress bar
            ctx.fillStyle = POWER_UP_TYPES[powerUp.type].color;
            ctx.fillRect(x, y, 150 * progress, 20);
            
            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(POWER_UP_TYPES[powerUp.type].name, x + 5, y + 14);
        });
    }
}

// ========== MAIN GAME LOOP ==========
function gameLoop() {
    if (!gameRunning || game.gameOver) return;
    
    updatePlayer();
    updateBullets();
    updateInvaders();
    updateSpecialInvaders();
    updateBoss();
    updatePowerUps();
    checkCollisions();
    checkLevelComplete();
    render();
    
    animationId = requestAnimationFrame(gameLoop);
}

// ========== GAME CONTROL FUNCTIONS ==========
function startGame() {
    if (!gameRunning && !game.gameOver) {
        gameRunning = true;
        gameLoop();
    }
}

function resetGame() {
    gameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Reset game state
    game.score = 0;
    game.lives = 3; // Ensure player starts with exactly 3 lives
    game.level = 1;
    game.gameOver = false;
    game.combo = 0;
    game.maxCombo = 0;
    game.scoreMultiplier = 1;
    game.comboTimer = 0;
    game.lastHitTime = 0;
    game.bossLevel = false;
    game.bossDefeated = false;
    
    // Reset difficulty scaling
    resetDifficultyScaling();
    
    // Reset player
    player.x = game.width / 2 - 25;
    player.y = game.height - 60;
    
    // Reset invaders
    invaderDirection = 1;
    initializeInvaders();
    
    // Reset boss
    boss.alive = false;
    boss.health = 100; // Reset to base health
    boss.maxHealth = 100;
    boss.phase = 1;
    boss.maxPhases = 3;
    boss.bossNumber = 1;
    boss.currentPhasePattern = 0;
    boss.speed = 2; // Reset to base speed
    
    // Clear all arrays
    playerBullets.length = 0;
    invaderBullets.length = 0;
    specialInvaders.length = 0;
    powerUps.length = 0;
    activePowerUps.length = 0;
    scoreAnimations.length = 0;
    
    // Update displays
    updateScore();
    updateLives();
    
    render();
}

// ========== GAME INITIALIZATION ==========
function init() {
    initializeInvaders();
    render();
    updateScore();
    updateLives();
    updateComboDisplay();
    updateHighScoreDisplay();
}

// ========== START THE GAME ==========
init();
