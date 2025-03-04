/**
 * Background animation for the title screen
 */
class Background {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to match window
        this.resize();
        
        // Grid properties
        this.gridSize = 50;
        this.lineWidth = 1;
        this.lineColor = '#550000';
        
        // Movement properties
        this.angle = 0;
        this.speed = 0.005;
        
        // Bind events
        window.addEventListener('resize', () => this.resize());
        
        // Start animation
        this.animate();
    }
    
    /**
     * Resize canvas to match window
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    /**
     * Draw 3D grid effect
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw perspective grid
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.lineWidth = this.lineWidth;
        
        // Calculate center of screen
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Number of lines to draw
        const numLines = 20;
        
        // Draw radial lines from center
        for (let i = 0; i < numLines; i++) {
            const lineAngle = (i / numLines) * Math.PI * 2 + this.angle;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            
            // Calculate end point on edge of screen
            const edgeX = centerX + Math.cos(lineAngle) * this.canvas.width;
            const edgeY = centerY + Math.sin(lineAngle) * this.canvas.height;
            
            this.ctx.lineTo(edgeX, edgeY);
            this.ctx.stroke();
        }
        
        // Draw concentric circles
        const maxRadius = Math.sqrt(
            Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2)
        );
        
        for (let r = this.gridSize; r < maxRadius; r += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    /**
     * Animation loop
     */
    animate() {
        // Update angle
        this.angle += this.speed;
        
        // Draw frame
        this.draw();
        
        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize background when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Background();
});