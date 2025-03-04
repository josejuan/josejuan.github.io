/**
 * Main game class that initializes and runs the game
 */
class Game {
    constructor() {
        // Game elements
        this.canvas = document.getElementById('gameCanvas');
        this.titleScreen = document.getElementById('titleScreen');
        this.mapSelector = document.getElementById('mapSelector');
        this.startButton = document.getElementById('startGame');
        this.backButton = document.getElementById('backToTitle');
        this.gameOverlay = document.querySelector('.game-overlay');
        
        // Game objects
        this.map = new GameMap();
        this.player = null;
        this.raycaster = new Raycaster(this.canvas);
        
        // Game state
        this.isRunning = false;
        this.keysPressed = {};
        this.isMoving = false;
        this.lastFootstepTime = 0;
        
        // Sound effects
        this.footstepSound = this._createFootstepSound();
        
        // Bind event handlers
        this._bindEvents();
    }
    
    /**
     * Create a simple footstep sound effect using Web Audio API
     */
    _createFootstepSound() {
        // We'll create the AudioContext later when user interacts
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null; // Browser doesn't support Web Audio API
        
        let audioCtx = null;
        
        // Function to play footstep sound
        return function playFootstep() {
            // Create audio context on first use (requires user interaction first)
            if (!audioCtx) {
                audioCtx = new AudioContext();
            }
            
            // Create oscillator
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Connect nodes
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // Set parameters
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(60, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            // Start and stop
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        };
    }
    
    /**
     * Initialize the game with the selected map
     */
    async startGame() {
        const mapName = this.mapSelector.value;
        
        // Load the map
        const success = await this.map.loadMap(mapName);
        if (!success) {
            alert('Failed to load map!');
            return false;
        }
        
        // Create player at map start position
        this.player = new Player(
            this.map.playerStartX,
            this.map.playerStartY,
            this.map.playerStartAngle
        );
        
        // Hide title screen, show game
        this.titleScreen.style.display = 'none';
        this.canvas.style.display = 'block';
        this.gameOverlay.style.display = 'block';
        
        // Set game as running
        this.isRunning = true;
        
        // Start game loop
        this._gameLoop();
        
        // Focus canvas for keyboard input
        this.canvas.focus();
        
        return true;
    }
    
    /**
     * Return to the title screen
     */
    returnToTitle() {
        // Stop the game
        this.isRunning = false;
        
        // Hide game, show title screen
        this.canvas.style.display = 'none';
        this.gameOverlay.style.display = 'none';
        this.titleScreen.style.display = 'block';
        
        // Reset player
        this.player = null;
    }
    
    /**
     * Main game loop
     */
    _gameLoop() {
        if (!this.isRunning) return;
        
        // Handle player movement based on keys pressed
        this._handleInput();
        
        // Update player position
        this.player.update(this.map);
        
        // Render the scene
        this.raycaster.castRays(this.player, this.map);
        this.raycaster.renderMinimap(this.player, this.map);
        
        // Draw map name in the corner
        this._drawMapInfo();
        
        // Request next frame
        requestAnimationFrame(() => this._gameLoop());
    }
    
    /**
     * Draw map information overlay
     */
    _drawMapInfo() {
        const ctx = this.raycaster.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 30);
        
        ctx.font = '16px Courier New';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Map: ${this.map.name}`, 20, 30);
    }
    
    /**
     * Handle user input
     */
    _handleInput() {
        // Track movement state for footstep sounds
        const wasMoving = this.isMoving;
        this.isMoving = false;
        
        // Movement
        if (this.keysPressed['ArrowUp']) {
            this.player.moveForward(this.map);
            this.isMoving = true;
        }
        if (this.keysPressed['ArrowDown']) {
            this.player.moveBackward(this.map);
            this.isMoving = true;
        }
        if (this.keysPressed['ArrowLeft']) {
            this.player.rotateLeft();
        }
        if (this.keysPressed['ArrowRight']) {
            this.player.rotateRight();
        }
        
        // Play footstep sounds when moving
        if (this.isMoving && this.footstepSound) {
            const now = performance.now();
            const timeSinceLastFootstep = now - this.lastFootstepTime;
            
            // Play footstep sound every 350ms while moving
            if (timeSinceLastFootstep > 350) {
                this.footstepSound();
                this.lastFootstepTime = now;
            }
        }
        
        // Return to title screen on Escape
        if (this.keysPressed['Escape']) {
            this.returnToTitle();
            // Clear the key to prevent repeated triggering
            this.keysPressed['Escape'] = false;
        }
    }
    
    /**
     * Bind event handlers for keyboard input and buttons
     */
    _bindEvents() {
        // Start game button
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Back to title button
        this.backButton.addEventListener('click', () => {
            this.returnToTitle();
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keysPressed[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keysPressed[e.key] = false;
        });
        
        // Prevent arrow keys from scrolling the page
        window.addEventListener('keydown', (e) => {
            if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.isRunning) {
                // Adjust canvas size if needed
                this._resizeCanvas();
            }
        });
    }
    
    /**
     * Resize canvas to fit window while maintaining aspect ratio
     */
    _resizeCanvas() {
        // Implement if needed for responsive design
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create the game instance
    const game = new Game();
});