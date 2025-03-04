/**
 * Player class to handle player movement and state
 */
class Player {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction; // Angle in radians
        this.moveSpeed = 0.08;
        this.rotationSpeed = 0.06;
        
        // Add a radius for collision detection
        this.radius = 0.2;
        
        // Add smooth movement with momentum
        this.velocity = {
            x: 0,
            y: 0,
            rotation: 0
        };
        
        // Movement physics parameters
        this.acceleration = 0.01;
        this.friction = 0.85;
        this.rotationAcceleration = 0.01;
        this.rotationFriction = 0.7;
        this.maxVelocity = 0.1;
        this.maxRotationVelocity = 0.08;
    }

    // Update player position and rotation based on inputs and time
    update(map) {
        // Apply friction to gradually slow down
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.rotation *= this.rotationFriction;
        
        // Update position with current velocity
        const newX = this.x + this.velocity.x;
        const newY = this.y + this.velocity.y;
        
        // Check for collisions and update position
        this._tryMove(newX, newY, map);
        
        // Update rotation with current rotation velocity
        this.direction += this.velocity.rotation;
        
        // Keep direction angle in [0, 2π] range
        while (this.direction < 0) this.direction += Math.PI * 2;
        while (this.direction >= Math.PI * 2) this.direction -= Math.PI * 2;
    }

    // Move the player forward
    moveForward(map) {
        // Accelerate in the direction the player is facing
        this.velocity.x += Math.cos(this.direction) * this.acceleration;
        this.velocity.y += Math.sin(this.direction) * this.acceleration;
        
        // Cap maximum velocity
        this._capVelocity();
    }

    // Move the player backward
    moveBackward(map) {
        // Accelerate in the opposite direction the player is facing
        this.velocity.x -= Math.cos(this.direction) * this.acceleration;
        this.velocity.y -= Math.sin(this.direction) * this.acceleration;
        
        // Cap maximum velocity
        this._capVelocity();
    }

    // Rotate the player left
    rotateLeft() {
        // Apply rotation acceleration
        this.velocity.rotation -= this.rotationAcceleration;
        
        // Cap maximum rotation velocity
        if (this.velocity.rotation < -this.maxRotationVelocity) {
            this.velocity.rotation = -this.maxRotationVelocity;
        }
    }

    // Rotate the player right
    rotateRight() {
        // Apply rotation acceleration
        this.velocity.rotation += this.rotationAcceleration;
        
        // Cap maximum rotation velocity
        if (this.velocity.rotation > this.maxRotationVelocity) {
            this.velocity.rotation = this.maxRotationVelocity;
        }
    }

    // Helper method to cap velocity to maximum value
    _capVelocity() {
        // Calculate current speed
        const currentSpeed = Math.sqrt(
            this.velocity.x * this.velocity.x + 
            this.velocity.y * this.velocity.y
        );
        
        // If speed exceeds maximum, scale it down
        if (currentSpeed > this.maxVelocity) {
            const scale = this.maxVelocity / currentSpeed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
        }
    }

    // Helper method to check if movement is valid
    _tryMove(newX, newY, map) {
        // Try to move along X axis
        if (!this._checkCollision(newX, this.y, map)) {
            this.x = newX;
        } else {
            // If collision detected, stop movement in this direction
            this.velocity.x = 0;
        }
        
        // Try to move along Y axis
        if (!this._checkCollision(this.x, newY, map)) {
            this.y = newY;
        } else {
            // If collision detected, stop movement in this direction
            this.velocity.y = 0;
        }
    }
    
    // Check for collisions at a given position
    _checkCollision(x, y, map) {
        // Check for collisions around the player's radius
        const numPoints = 8; // Check 8 points around the player
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const checkX = x + Math.cos(angle) * this.radius;
            const checkY = y + Math.sin(angle) * this.radius;
            
            if (map.isWall(checkX, checkY)) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }
}