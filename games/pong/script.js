// ========== DOM ELEMENT REFERENCES ==========
// Get reference to the canvas element from HTML where we'll draw the game
const canvas = document.getElementById('gameCanvas');
// Get the 2D drawing context - this gives us methods to draw shapes, text, etc.
const ctx = canvas.getContext('2d');
// Get reference to player score display so we can update it when player scores
const playerScoreElement = document.getElementById('player-score');
// Get reference to high score display so we can show the best score
const highScoreElement = document.getElementById('high-score');
// Get reference to scoreboard button and modal elements
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
// Boolean flag to track if the game is currently running or paused
let gameRunning = false;
// Stores the ID returned by requestAnimationFrame so we can cancel it later
let animationId;

// ========== MAIN GAME OBJECT ==========
// Object that holds overall game settings and state
const game = {
    // Width of the game area (same as canvas width)
    width: canvas.width,
    // Height of the game area (same as canvas height)
    height: canvas.height,
    // Player's current score (only player can score points)
    playerScore: 0,
    // Track if game is over
    gameOver: false
};

// ========== BALL OBJECT ==========
// Object representing the ball with all its properties
const ball = {
    // X position - starts in center of screen
    x: game.width / 2,
    // Y position - starts in center of screen
    y: game.height / 2,
    // Size of the ball (radius in pixels)
    radius: 10,
    // How fast the ball moves horizontally (positive = right, negative = left) - INCREASED SPEED
    velocityX: 8,
    // How fast the ball moves vertically (positive = down, negative = up) - INCREASED SPEED
    velocityY: 5,
    // Base speed value for resetting ball speed - INCREASED
    speed: 8,
    // Color of the ball (white)
    color: '#fff'
};

// ========== PADDLE CREATION FUNCTION ==========
// Function that creates a paddle object with specified position
// Parameters: x = horizontal position, y = vertical position
function createPaddle(x, y) {
    // Returns an object with all paddle properties
    return {
        // Horizontal position of paddle
        x: x,
        // Vertical position of paddle
        y: y,
        // Width of paddle in pixels
        width: 15,
        // Height of paddle in pixels
        height: 80,
        // Color of paddle (white)
        color: '#fff',
        // How fast the paddle can move (pixels per frame) - INCREASED SPEED
        speed: 12
    };
}

// ========== PADDLE INSTANCES ==========
// Create the player paddle on the left side of screen
// X position: 10 pixels from left edge
// Y position: centered vertically (half screen height minus half paddle height)
const playerPaddle = createPaddle(10, game.height / 2 - 40);

// Create the AI paddle on the right side of screen
// X position: 25 pixels from right edge (800 - 25 = 775)
// Y position: centered vertically
const aiPaddle = createPaddle(game.width - 25, game.height / 2 - 40);

// ========== AI DIFFICULTY SYSTEM ==========
// Object to manage AI behavior and difficulty scaling
const ai = {
    // Base speed for AI paddle movement (starts faster but manageable)
    baseSpeed: 3,
    // Current speed (will increase as player scores)
    currentSpeed: 3,
    // How much speed increases per player point scored - INCREASED SCALING
    speedIncrease: 0.6,
    // Maximum speed the AI can reach - INCREASED MAX
    maxSpeed: 14,
    // How accurately AI predicts ball position (starts somewhat inaccurate)
    accuracy: 0.4,
    // How much accuracy increases per player point - INCREASED SCALING
    accuracyIncrease: 0.06,
    // Maximum accuracy the AI can reach
    maxAccuracy: 0.9
};

// ========== INPUT HANDLING ==========
// Object to track which keys are currently pressed
const keys = {
    // W key for moving player paddle up
    w: false,
    // S key for moving player paddle down
    s: false
};

// ========== KEYBOARD EVENT LISTENERS ==========
// Listen for when a key is pressed down
document.addEventListener('keydown', (e) => {
    // Check if the pressed key is one we care about
    if (e.key in keys) {
        // Mark that key as being pressed
        keys[e.key] = true;
        
        // Auto-start game when player presses movement keys
        if (!gameRunning && !game.gameOver) {
            startGame();
        }
        
        // Prevent the browser from doing its default action for this key
        e.preventDefault();
    }
});

// Listen for when a key is released
document.addEventListener('keyup', (e) => {
    // Check if the released key is one we care about
    if (e.key in keys) {
        // Mark that key as no longer being pressed
        keys[e.key] = false;
        // Prevent the browser from doing its default action for this key
        e.preventDefault();
    }
});

// ========== BUTTON EVENT LISTENERS ==========
// Add click event to scoreboard button - shows scoreboard modal
scoreboardBtn.addEventListener('click', showScoreboard);
// Add click event to close modal button
closeModal.addEventListener('click', hideScoreboard);
// Add click event to submit score button
submitScoreBtn.addEventListener('click', submitScore);
// Add click event to skip score button
skipScoreBtn.addEventListener('click', skipScore);
// Add click event to clear scores button
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
// Function to draw a rectangle on the canvas
// Parameters: x, y (position), width, height (size), color
function drawRect(x, y, width, height, color) {
    // Set the fill color for the rectangle
    ctx.fillStyle = color;
    // Draw a filled rectangle at the specified position and size
    ctx.fillRect(x, y, width, height);
}

// Function to draw a circle on the canvas
// Parameters: x, y (center position), radius (size), color
function drawCircle(x, y, radius, color) {
    // Set the fill color for the circle
    ctx.fillStyle = color;
    // Begin a new path for drawing
    ctx.beginPath();
    // Draw a circle arc from 0 to 2π (full circle)
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    // Fill the circle with the specified color
    ctx.fill();
}

// Function to draw the dashed net line in the center of the screen
function drawNet() {
    // Set the line dash pattern: 5 pixels dash, 15 pixels gap
    ctx.setLineDash([5, 15]);
    // Begin a new path for the line
    ctx.beginPath();
    // Move to the top center of the screen
    ctx.moveTo(game.width / 2, 0);
    // Draw line to the bottom center of the screen
    ctx.lineTo(game.width / 2, game.height);
    // Set line color to retro green
    ctx.strokeStyle = '#00ff00';
    // Set line thickness to 2 pixels
    ctx.lineWidth = 2;
    // Draw the line
    ctx.stroke();
    // Reset line dash to solid line for other drawing
    ctx.setLineDash([]);
}

// Function to draw a paddle using the drawRect function
// Parameter: paddle object containing position, size, and color
function drawPaddle(paddle) {
    // Use the drawRect function to draw the paddle in retro green
    drawRect(paddle.x, paddle.y, paddle.width, paddle.height, '#00ff00');
}

// Function to draw the ball using the drawCircle function
function drawBall() {
    // Use the drawCircle function to draw the ball in retro green
    drawCircle(ball.x, ball.y, ball.radius, '#00ff00');
}

// ========== GAME LOGIC FUNCTIONS ==========

// Function to update player paddle position based on keyboard input
function updatePlayerPaddle() {
    // Check if W key is pressed AND paddle isn't at top edge
    if (keys.w && playerPaddle.y > 0) {
        // Move paddle up by its speed value
        playerPaddle.y -= playerPaddle.speed;
    }
    // Check if S key is pressed AND paddle isn't at bottom edge
    if (keys.s && playerPaddle.y < game.height - playerPaddle.height) {
        // Move paddle down by its speed value
        playerPaddle.y += playerPaddle.speed;
    }
}

// Function to update AI paddle position with intelligent movement
function updateAIPaddle() {
    // Calculate the center position of the AI paddle
    const aiPaddleCenter = aiPaddle.y + aiPaddle.height / 2;
    // Calculate where the ball will be (with error based on accuracy) - REDUCED ERROR RANGE FOR FASTER RESPONSE
    const errorRange = (1 - ai.accuracy) * 100; // Less error = more responsive AI
    const targetY = ball.y + (Math.random() - 0.5) * errorRange;
    
    // Calculate the distance between paddle center and target
    const distance = targetY - aiPaddleCenter;
    
    // Only move if the distance is significant (prevents jittery movement) - REDUCED THRESHOLD
    if (Math.abs(distance) > 5) {
        // Determine movement direction based on where target is
        const direction = distance > 0 ? 1 : -1;
        // Calculate movement amount (limited by AI speed)
        const moveAmount = Math.min(Math.abs(distance), ai.currentSpeed) * direction;
        
        // Update AI paddle position with bounds checking
        aiPaddle.y += moveAmount;
        
        // Keep AI paddle within screen bounds (top edge)
        if (aiPaddle.y < 0) {
            aiPaddle.y = 0;
        }
        // Keep AI paddle within screen bounds (bottom edge)
        if (aiPaddle.y > game.height - aiPaddle.height) {
            aiPaddle.y = game.height - aiPaddle.height;
        }
    }
}

// Function to update ball position and handle all ball physics
function updateBall() {
    // Move ball horizontally by its X velocity
    ball.x += ball.velocityX;
    // Move ball vertically by its Y velocity
    ball.y += ball.velocityY;

    // ========== WALL COLLISION DETECTION ==========
    // Check if ball hits top wall or bottom wall
    if (ball.y + ball.radius > game.height || ball.y - ball.radius < 0) {
        // Reverse vertical direction (bounce off wall)
        ball.velocityY = -ball.velocityY;
        // Clamp ball position to just inside the wall to prevent sticking
        if (ball.y + ball.radius > game.height) {
            ball.y = game.height - ball.radius;
        } else if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
        }
    }

    // ========== PLAYER PADDLE COLLISION ==========
    // Check if ball collides with player paddle (left side)
    // Conditions: ball's right edge hits paddle's right edge AND
    //            ball is within paddle's vertical boundaries AND
    //            ball is moving left (negative X velocity)
    if (ball.x - ball.radius < playerPaddle.x + playerPaddle.width &&
        ball.y > playerPaddle.y &&
        ball.y < playerPaddle.y + playerPaddle.height &&
        ball.velocityX < 0) {
        
        // Reverse horizontal direction
        ball.velocityX = -ball.velocityX;
        // Calculate where on paddle the ball hit (-1 to 1, where 0 is center)
        let hitPos = (ball.y - (playerPaddle.y + playerPaddle.height / 2)) / (playerPaddle.height / 2);
        // Apply angle to ball based on hit position (adds strategy) - INCREASED ANGLE EFFECT
        ball.velocityY = hitPos * 7;
    }

    // ========== AI PADDLE COLLISION ==========
    // Check if ball collides with AI paddle (right side)
    // Similar logic to player paddle but for right side
    if (ball.x + ball.radius > aiPaddle.x &&
        ball.y > aiPaddle.y &&
        ball.y < aiPaddle.y + aiPaddle.height &&
        ball.velocityX > 0) {
        
        // Reverse horizontal direction
        ball.velocityX = -ball.velocityX;
        // Calculate hit position and apply angle - INCREASED ANGLE EFFECT
        let hitPos = (ball.y - (aiPaddle.y + aiPaddle.height / 2)) / (aiPaddle.height / 2);
        ball.velocityY = hitPos * 7;
    }

    // ========== SCORING SYSTEM ==========
    // Check if ball goes off left edge (AI scores - GAME OVER!)
    if (ball.x < 0) {
        // Player loses when AI scores
        gameOver();
        return; // Exit function to prevent further updates
    } 
    // Check if ball goes off right edge (Player scores - Level up!)
    else if (ball.x > game.width) {
        // Increase player score
        game.playerScore++;
        // Make AI harder after player scores
        increaseAIDifficulty();
        // Reset ball to center
        resetBall();
        // Update score display
        updateScore();
    }
}

// ========== AI DIFFICULTY FUNCTION ==========
// Function to make the AI progressively harder when player scores
function increaseAIDifficulty() {
    // Increase AI speed but don't exceed maximum
    ai.currentSpeed = Math.min(ai.currentSpeed + ai.speedIncrease, ai.maxSpeed);
    // Increase AI accuracy but don't exceed maximum
    ai.accuracy = Math.min(ai.accuracy + ai.accuracyIncrease, ai.maxAccuracy);
    
    // Optional: Show difficulty increase in console for debugging
    console.log(`Score: ${game.playerScore}, AI Speed: ${ai.currentSpeed.toFixed(1)}, Accuracy: ${(ai.accuracy * 100).toFixed(1)}%`);
}

// ========== BALL RESET FUNCTION ==========
// Function to reset ball to center after a point is scored
function resetBall() {
    // Put ball back in center of screen horizontally
    ball.x = game.width / 2;
    // Put ball back in center of screen vertically
    ball.y = game.height / 2;
    // Reverse horizontal direction so ball goes toward the other player
    ball.velocityX = -ball.velocityX;
    // Set random vertical velocity between -4 and 4 - INCREASED RANGE
    ball.velocityY = (Math.random() - 0.5) * 8;
}

// ========== GAME OVER FUNCTION ==========
// Function called when player loses (AI scores)
function gameOver() {
    // Stop the game
    gameRunning = false;
    // Set game over flag
    game.gameOver = true;
    // Cancel animation frame if running
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // Always prompt for name input if player scored at least 1 point
    const currentScore = game.playerScore;
    if (currentScore > 0) {
        // Show name input for any score after a short delay
        setTimeout(() => {
            showNameInput(currentScore);
        }, 800);
    } else {
        // If no points scored, reset immediately
        setTimeout(() => {
            resetGame();
        }, 300);
    }
    
    // Optional: Show final score in console for debugging
    console.log(`Game Over! Final Score: ${currentScore} points`);
}

// ========== SCOREBOARD SYSTEM ==========

// Function to get scores from localStorage
function getStoredScores() {
    // Get scores from browser storage, return empty array if none exist
    const scores = localStorage.getItem('pongHighScores');
    return scores ? JSON.parse(scores) : [];
}

// Function to save scores to localStorage
function saveScores(scores) {
    // Save scores array to browser storage as JSON string
    localStorage.setItem('pongHighScores', JSON.stringify(scores));
}

// Function to get the current high score
function getHighScore() {
    // Get all stored scores
    const scores = getStoredScores();
    // Return the highest score, or 0 if no scores exist
    return scores.length > 0 ? scores[0].score : 0;
}

// Function to check if current score is a high score
function isHighScore(score) {
    // Get all stored scores
    const scores = getStoredScores();
    // If less than 10 scores or score beats the 10th place, it's a high score
    return scores.length < 10 || score > scores[9]?.score || 0;
}

// Function to add a new score to the scoreboard
function addScore(name, score) {
    // Get current scores
    const scores = getStoredScores();
    // Add new score
    scores.push({ name: name.trim(), score: score, date: new Date().toLocaleDateString() });
    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    // Keep all scores (no limit for storage, but display only top 10)
    // Note: If you want to limit total stored scores, change this number
    // For now, we'll keep all scores for complete history
    // Save updated scores
    saveScores(scores);
    // Update high score display
    updateHighScoreDisplay();
}

// Function to update the high score display
function updateHighScoreDisplay() {
    // Get the current high score and update the display
    const highScore = getHighScore();
    highScoreElement.textContent = highScore;
}

// Function to show the scoreboard modal
function showScoreboard() {
    // Display the modal
    scoreboardModal.style.display = 'block';
    // Populate the scoreboard with current scores
    displayScoreboard();
}

// Function to hide the scoreboard modal
function hideScoreboard() {
    // Hide the modal
    scoreboardModal.style.display = 'none';
}

// Function to display scores in the scoreboard
function displayScoreboard() {
    // Get current scores
    const scores = getStoredScores();
    // Clear existing content
    scoreboardList.innerHTML = '';
    
    // If no scores exist, show empty message
    if (scores.length === 0) {
        scoreboardList.innerHTML = '<div class="empty-scoreboard">No scores yet! Be the first to play!</div>';
        return;
    }
    
    // Show only top 10 scores in the display (but all are stored)
    const topScores = scores.slice(0, 10);
    
    // Create score entries for each top score
    topScores.forEach((scoreData, index) => {
        const scoreEntry = document.createElement('div');
        scoreEntry.className = 'score-entry';
        
        // Add special styling for top 3 scores
        if (index === 0) scoreEntry.classList.add('rank-1');
        else if (index === 1) scoreEntry.classList.add('rank-2');
        else if (index === 2) scoreEntry.classList.add('rank-3');
        
        // Create the score entry HTML
        scoreEntry.innerHTML = `
            <div class="score-rank">#${index + 1}</div>
            <div class="score-name">${scoreData.name}</div>
            <div class="score-points">${scoreData.score}</div>
        `;
        
        // Add to scoreboard
        scoreboardList.appendChild(scoreEntry);
    });
}

// Function to show name input modal for high scores
function showNameInput(score) {
    // Set the final score in the modal
    finalScoreElement.textContent = score;
    // Clear the input field
    playerNameInput.value = '';
    // Show the modal
    nameModal.style.display = 'block';
    // Focus on the input field
    setTimeout(() => playerNameInput.focus(), 100);
}

// Function to submit the score with player name
function submitScore() {
    // Get the player name from input
    const playerName = playerNameInput.value.trim();
    
    // Validate name input
    if (playerName === '') {
        alert('Please enter your name!');
        return;
    }
    
    // Get the current score
    const score = game.playerScore;
    
    // Add score to scoreboard
    addScore(playerName, score);
    
    // Hide the name input modal
    nameModal.style.display = 'none';
    
    // Show success message and reset game
    setTimeout(() => {
        alert(`Score saved! ${playerName}: ${score} points`);
        // Reset the game after submitting score
        resetGame();
    }, 100);
}

// Function to skip saving the score
function skipScore() {
    // Hide the name input modal
    nameModal.style.display = 'none';
    // Reset the game after skipping score entry
    resetGame();
}

// Function to clear all scores
function clearAllScores() {
    // Confirm before clearing
    if (confirm('Are you sure you want to clear all high scores? This cannot be undone!')) {
        // Clear from storage
        localStorage.removeItem('pongHighScores');
        // Update displays
        updateHighScoreDisplay();
        displayScoreboard();
        // Show confirmation
        alert('All scores cleared!');
    }
}

// ========== SCORE UPDATE FUNCTION ==========
// Function to update the score display
function updateScore() {
    // Update player score text in the HTML
    playerScoreElement.textContent = game.playerScore;
}
// Function to draw everything on the screen
function render() {
    // Clear the entire canvas (erase previous frame)
    ctx.clearRect(0, 0, game.width, game.height);
    
    // Draw all game elements in order
    drawNet();              // Draw center line first (background)
    drawPaddle(playerPaddle); // Draw player paddle
    drawPaddle(aiPaddle);   // Draw AI paddle
    drawBall();             // Draw ball last (foreground)
}

// ========== MAIN GAME LOOP ==========
// Function that runs continuously to update and draw the game
function gameLoop() {
    // If game is not running or game is over, stop the loop
    if (!gameRunning || game.gameOver) return;
    
    // Update game state
    updatePlayerPaddle();  // Handle player input
    updateAIPaddle();      // Update AI behavior
    updateBall();          // Update ball physics
    render();              // Draw everything on screen
    
    // Schedule this function to run again on the next frame
    // requestAnimationFrame provides smooth 60fps animation
    animationId = requestAnimationFrame(gameLoop);
}

// ========== GAME CONTROL FUNCTIONS ==========

// Function to start the game
function startGame() {
    // Check if game is currently not running and not over
    if (!gameRunning && !game.gameOver) {
        // Set game state to running
        gameRunning = true;
        // Start the game loop
        gameLoop();
    }
}

// Function to completely reset the game to initial state
function resetGame() {
    // Stop the game if it's running
    gameRunning = false;
    // Cancel any scheduled animation frames
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    // ========== RESET ALL GAME STATE ==========
    // Reset player score to zero
    game.playerScore = 0;
    // Reset game over state
    game.gameOver = false;
    
    // ========== RESET AI DIFFICULTY ==========
    // Reset AI back to beginner level
    ai.currentSpeed = ai.baseSpeed;
    ai.accuracy = 0.4;
    
    // ========== RESET BALL POSITION AND VELOCITY ==========
    // Put ball back in center
    ball.x = game.width / 2;
    ball.y = game.height / 2;
    // Reset ball velocity to initial values - INCREASED INITIAL SPEED
    ball.velocityX = 8;
    ball.velocityY = 5;
    
    // ========== RESET PADDLE POSITIONS ==========
    // Put player paddle back in center-left
    playerPaddle.y = game.height / 2 - 40;
    // Put AI paddle back in center-right
    aiPaddle.y = game.height / 2 - 40;
    
    // ========== UPDATE UI ELEMENTS ==========
    // Update score display to show zeros
    updateScore();
    
    // Draw the initial game state
    render();
}

// Function called when game ends (someone reaches 10 points) - REMOVED
// This function is no longer used since only AI scoring ends the game

// ========== GAME INITIALIZATION ==========
// Function to set up the game when page loads
function init() {
    // Draw the initial game state (empty court with paddles and ball)
    render();
    // Set initial score display
    updateScore();
    // Load and display high score
    updateHighScoreDisplay();
}

// ========== START THE GAME ==========
// Call init function when the JavaScript file loads
// This sets up the initial game state immediately
init();
