/**
 * Raycaster class for handling the raycasting rendering technique
 */
class Raycaster {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Define colors (fallback in case textures don't load)
        this.colors = {
            floor: '#555555',
            ceiling: '#383838',
            wallDark: '#880000',
            wallMedium: '#AA0000',
            wallLight: '#CC0000',
            wallBright: '#FF0000'
        };
        
        // Field of view
        this.fov = Math.PI / 3; // 60 degrees
        
        // Texture related properties
        this.textures = {};
        this.textureSize = 256; // Each texture is 256x256 pixels
        this.useTextures = false; // Will be set to true once textures are loaded
        
        // Floor and ceiling textures
        this.floorTexture = null;
        this.ceilingTexture = null;
        this.useFloorTexture = false;
        this.useCeilingTexture = false;
        
        // Performance optimization: Create and cache texture data
        this._textureData = {};
        this._textureCanvas = document.createElement('canvas');
        this._textureCanvas.width = this.textureSize;
        this._textureCanvas.height = this.textureSize;
        this._textureCtx = this._textureCanvas.getContext('2d');
        
        // Create an image data buffer for faster pixel rendering
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.buffer = new Uint32Array(this.imageData.data.buffer);
        
        // Load textures
        this.loadTextures();
    }
    
    /**
     * Load wall textures from images folder
     */
    loadTextures() {
        // Define wall types
        const wallTypes = [1, 2, 3, 4, 5]; // We'll have 5 different wall textures
        let texturesLoaded = 0;
        let texturesTotal = wallTypes.length;
        
        // For tracking floor and ceiling textures
        let floorLoaded = false;
        let ceilingLoaded = false;
        
        // Increment total textures for floor and ceiling
        texturesTotal += 2;
        
        // Load wall textures
        wallTypes.forEach(type => {
            const texture = new Image();
            texture.onload = () => {
                // Pre-process the texture once loaded
                this._processTexture(type, texture);
                
                texturesLoaded++;
                if (texturesLoaded === texturesTotal) {
                    console.log('All textures loaded successfully');
                    this.useTextures = true;
                }
            };
            texture.onerror = () => {
                console.error(`Failed to load texture for wall type ${type}`);
                texturesTotal--; // Reduce expected total
            };
            
            // Set source (we're assuming these files exist)
            texture.src = `images/wall${type}.png`;
            
            // Store in textures object
            this.textures[type] = texture;
        });
        
        // Load floor texture
        this.floorTexture = new Image();
        this.floorTexture.onload = () => {
            // Pre-process floor texture
            this._processTexture('floor', this.floorTexture);
            
            floorLoaded = true;
            this.useFloorTexture = true;
            texturesLoaded++;
            if (texturesLoaded === texturesTotal) {
                console.log('All textures loaded successfully');
                this.useTextures = true;
            }
        };
        this.floorTexture.onerror = () => {
            console.error('Failed to load floor texture');
            texturesTotal--; // Reduce expected total
        };
        this.floorTexture.src = 'images/floor.png';
        
        // Load ceiling texture
        this.ceilingTexture = new Image();
        this.ceilingTexture.onload = () => {
            // Pre-process ceiling texture
            this._processTexture('ceiling', this.ceilingTexture);
            
            ceilingLoaded = true;
            this.useCeilingTexture = true;
            texturesLoaded++;
            if (texturesLoaded === texturesTotal) {
                console.log('All textures loaded successfully');
                this.useTextures = true;
            }
        };
        this.ceilingTexture.onerror = () => {
            console.error('Failed to load ceiling texture');
            texturesTotal--; // Reduce expected total
        };
        this.ceilingTexture.src = 'images/ceiling.png';
    }
    
    /**
     * Pre-process a texture into a pixel array for faster access
     */
    _processTexture(type, texture) {
        // Draw texture to canvas and get the pixel data
        this._textureCtx.clearRect(0, 0, this.textureSize, this.textureSize);
        this._textureCtx.drawImage(texture, 0, 0);
        const imageData = this._textureCtx.getImageData(0, 0, this.textureSize, this.textureSize);
        
        // Store pixel data for this texture
        this._textureData[type] = new Uint32Array(imageData.data.buffer);
    }
    
    /**
     * Cast rays from player's position to render the 3D view
     */
    castRays(player, map) {
        // Clear pixel buffer
        this.buffer.fill(0);
        
        // Prepare for floor and ceiling texturing
        const floorTextureData = this._textureData['floor'];
        const ceilingTextureData = this._textureData['ceiling'];
        
        // Get fallback colors
        const ceilingColor = this._hexToRgb(this.colors.ceiling);
        const floorColor = this._hexToRgb(this.colors.floor);
        
        // Draw ceiling and floor (with or without textures)
        if ((this.useFloorTexture && floorTextureData) || 
            (this.useCeilingTexture && ceilingTextureData)) {
            
            // Draw textured floor and ceiling
            this._renderTexturedFloorAndCeiling(player, floorTextureData, ceilingTextureData);
        } else {
            // Fallback to solid color for ceiling and floor
            for (let y = 0; y < this.height / 2; y++) {
                const offset = y * this.width;
                const bottomOffset = (this.height - y - 1) * this.width;
                
                for (let x = 0; x < this.width; x++) {
                    // Ceiling pixel
                    this.buffer[offset + x] = ceilingColor;
                    
                    // Floor pixel (at the bottom half)
                    this.buffer[bottomOffset + x] = floorColor;
                }
            }
        }
        
        // Performance optimization - calculate fewer rays and draw multiple columns
        const rayStep = 2; // Cast a ray every 2 pixels
        
        // Calculate direction vectors for the leftmost and rightmost rays
        const leftDir = player.direction - this.fov / 2;
        const rightDir = player.direction + this.fov / 2;
        
        // Cast rays for each column of the screen (with optimized step)
        for (let x = 0; x < this.width; x += rayStep) {
            // Calculate normalized progress across the screen (0 to 1)
            const screenPos = x / this.width;
            
            // Interpolate between left and right direction vectors
            const rayAngle = leftDir + screenPos * (rightDir - leftDir);
            
            // Calculate ray direction from angle
            const rayDirX = Math.cos(rayAngle);
            const rayDirY = Math.sin(rayAngle);
            
            // Current position in grid coordinates
            let mapX = Math.floor(player.x);
            let mapY = Math.floor(player.y);
            
            // Distance to next grid cell boundary
            let sideDistX, sideDistY;
            
            // Distance between grid boundaries in ray direction
            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);
            
            // Direction to step in x and y
            let stepX, stepY;
            
            // Was a wall hit?
            let hit = false;
            // Was the wall hit a north/south facing wall?
            let side = 0;
            
            // Calculate step and initial sideDist
            if (rayDirX < 0) {
                stepX = -1;
                sideDistX = (player.x - mapX) * deltaDistX;
            } else {
                stepX = 1;
                sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
            }
            
            if (rayDirY < 0) {
                stepY = -1;
                sideDistY = (player.y - mapY) * deltaDistY;
            } else {
                stepY = 1;
                sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
            }
            
            // DDA (Digital Differential Analysis) algorithm
            let perpWallDist;
            
            while (!hit) {
                // Jump to next map square in x or y direction
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }
                
                // Check if ray has hit a wall
                if (map.isWall(mapX, mapY)) {
                    hit = true;
                }
            }
            
            // Calculate distance projected on camera direction
            if (side === 0) {
                perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
            } else {
                perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
            }
            
            // Fix fisheye effect by using the corrected distance
            // This corrects the distance based on the angle between the ray and the player's direction
            const rayAngleOffset = rayAngle - player.direction;
            perpWallDist *= Math.cos(rayAngleOffset); // Correct distance by multiplying by cosine of angle
            
            // Calculate height of line to draw on screen
            const lineHeight = Math.floor(this.height / perpWallDist);
            
            // Calculate lowest and highest pixel to fill in current stripe
            let drawStart = Math.floor(-lineHeight / 2 + this.height / 2);
            if (drawStart < 0) drawStart = 0;
            let drawEnd = Math.floor(lineHeight / 2 + this.height / 2);
            if (drawEnd >= this.height) drawEnd = this.height - 1;
            
            // Get the wall type safely with bounds checking
            let wallType = 1; // Default to type 1
            if (mapY >= 0 && mapY < map.grid.length && 
                mapX >= 0 && mapX < map.grid[0].length) {
                wallType = map.grid[mapY][mapX] || 1;
            }
            
            if (this.useTextures && this._textureData[wallType]) {
                // Use texture mapping from pre-processed data
                
                // Calculate where exactly the wall was hit
                let wallX;
                if (side === 0) {
                    wallX = player.y + perpWallDist * rayDirY;
                } else {
                    wallX = player.x + perpWallDist * rayDirX;
                }
                wallX -= Math.floor(wallX);
                
                // Calculate the X coordinate on the texture
                let texX = Math.floor(wallX * this.textureSize);
                // Flip texture if we're looking at the other side of the wall
                if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
                    texX = this.textureSize - texX - 1;
                }
                
                // How much to increase the texture coordinate per screen pixel
                const step = this.textureSize / lineHeight;
                
                // Starting texture coordinate
                let texPos = (drawStart - this.height / 2 + lineHeight / 2) * step;
                
                // Get texture data
                const textureData = this._textureData[wallType];
                
                // Draw the textured wall column
                for (let y = drawStart; y < drawEnd; y++) {
                    // Calculate the Y coordinate on the texture
                    const texY = Math.min(Math.floor(texPos) & (this.textureSize - 1), this.textureSize - 1);
                    texPos += step;
                    
                    // Get the texture pixel directly from pre-processed data
                    const texel = textureData[texY * this.textureSize + texX];
                    
                    // Extract RGB components
                    const r = (texel & 0xff);
                    const g = (texel >> 8) & 0xff;
                    const b = (texel >> 16) & 0xff;
                    
                    // Apply depth shading based on distance
                    const shadeFactor = Math.min(1, 3 / perpWallDist);
                    const shadedR = Math.floor(r * shadeFactor);
                    const shadedG = Math.floor(g * shadeFactor);
                    const shadedB = Math.floor(b * shadeFactor);
                    
                    // Set pixel in buffer (RGBA format)
                    const color = (255 << 24) | (shadedB << 16) | (shadedG << 8) | shadedR;
                    
                    // Draw the pixel and fill any gaps for the rayStep
                    for (let i = 0; i < rayStep && (x + i) < this.width; i++) {
                        this.buffer[y * this.width + (x + i)] = color;
                    }
                }
            } else {
                // Fallback to colored walls if textures aren't loaded
                this._renderColoredStripeToBuffer(side, perpWallDist, x, drawStart, drawEnd, rayStep);
            }
        }
        
        // Put the image data to the canvas in one operation
        this.ctx.putImageData(this.imageData, 0, 0);
    }
    
    /**
     * Convert hex color to RGBA integer value for buffer
     */
    _hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Return in RGBA format for the buffer
        return (255 << 24) | (b << 16) | (g << 8) | r;
    }
    
    /**
     * Render textured floor and ceiling using raycasting
     */
    _renderTexturedFloorAndCeiling(player, floorTextureData, ceilingTextureData) {
        // Skip the floor/ceiling texture mapping if data is not available
        if ((!this.useFloorTexture || !floorTextureData) && 
            (!this.useCeilingTexture || !ceilingTextureData)) {
            return;
        }
        
        // Draw floor and ceiling with solid colors first (as fallback)
        const ceilingColor = this._hexToRgb(this.colors.ceiling);
        const floorColor = this._hexToRgb(this.colors.floor);
        
        // Fill floor and ceiling with solid color
        for (let y = 0; y < this.height / 2; y++) {
            for (let x = 0; x < this.width; x++) {
                // Ceiling (top half of screen)
                this.buffer[y * this.width + x] = ceilingColor;
                
                // Floor (bottom half of screen)
                const floorY = this.height - y - 1;
                this.buffer[floorY * this.width + x] = floorColor;
            }
        }
        
        // Only proceed with texture mapping if textures are available
        if (!this.useFloorTexture && !this.useCeilingTexture) {
            return;
        }
        
        // Use the EXACT same FOV and angle calculations as in the wall casting
        // This ensures the floor/ceiling and walls are perfectly aligned
        const leftDir = player.direction - this.fov / 2;
        const rightDir = player.direction + this.fov / 2;
        
        // For each row of the screen, from horizon (middle) to bottom
        for (let y = this.height / 2 + 1; y < this.height; y++) {
            // Current y position compared to the center of the screen (horizon)
            const rowFromHorizon = y - this.height / 2;
            
            // Calculate row distance - how far away this row is in the 3D space
            const rowDistance = 0.5 * this.height / rowFromHorizon;
            
            // For each pixel in this horizontal row
            for (let x = 0; x < this.width; x++) {
                // Calculate normalized position across the screen (0 to 1)
                const screenX = x / this.width;
                
                // Interpolate between left and right direction vectors
                // This MUST match how we do it for the walls
                const rayAngle = leftDir + screenX * (rightDir - leftDir);
                
                // Calculate ray direction from angle
                const rayDirX = Math.cos(rayAngle);
                const rayDirY = Math.sin(rayAngle);
                
                // Calculate world coordinates at this distance
                const worldX = player.x + rayDirX * rowDistance;
                const worldY = player.y + rayDirY * rowDistance;
                
                // Calculate texture coordinates scaled to make textures smaller
                const texScale = 1.0; // Increase for smaller/more repeated textures
                
                // Use world coordinates for texture mapping
                // The & (textureSize-1) ensures we wrap around texture (power of 2 size)
                const texX = Math.floor(this.textureSize * (worldX * texScale)) & (this.textureSize - 1);
                const texY = Math.floor(this.textureSize * (worldY * texScale)) & (this.textureSize - 1);
                
                // Calculate shading based on distance (make it match wall shading)
                const shadeFactor = Math.min(1, 3.0 / rowDistance);
                
                // Draw floor pixel
                if (this.useFloorTexture && floorTextureData) {
                    const floorTexel = floorTextureData[texY * this.textureSize + texX];
                    
                    // Extract RGB and apply shading
                    const r = Math.floor((floorTexel & 0xff) * shadeFactor);
                    const g = Math.floor(((floorTexel >> 8) & 0xff) * shadeFactor);
                    const b = Math.floor(((floorTexel >> 16) & 0xff) * shadeFactor);
                    
                    // Set pixel in buffer (RGBA format where A is the highest byte)
                    this.buffer[y * this.width + x] = (255 << 24) | (b << 16) | (g << 8) | r;
                }
                
                // Draw ceiling pixel (same x, mirrored y from bottom half)
                const ceilingY = this.height - y - 1;
                if (this.useCeilingTexture && ceilingTextureData && ceilingY >= 0) {
                    const ceilingTexel = ceilingTextureData[texY * this.textureSize + texX];
                    
                    // Extract RGB and apply shading
                    const r = Math.floor((ceilingTexel & 0xff) * shadeFactor);
                    const g = Math.floor(((ceilingTexel >> 8) & 0xff) * shadeFactor);
                    const b = Math.floor(((ceilingTexel >> 16) & 0xff) * shadeFactor);
                    
                    // Set pixel in buffer
                    this.buffer[ceilingY * this.width + x] = (255 << 24) | (b << 16) | (g << 8) | r;
                }
            }
        }
    }
    
    /**
     * Render a colored wall stripe to the pixel buffer (fallback when textures are not available)
     */
    _renderColoredStripeToBuffer(side, perpWallDist, x, drawStart, drawEnd, rayStep) {
        // Choose wall color based on side and distance
        let wallColor;
        if (side === 1) {
            if (perpWallDist < 1) {
                wallColor = this._hexToRgb(this.colors.wallBright);
            } else if (perpWallDist < 2) {
                wallColor = this._hexToRgb(this.colors.wallLight);
            } else {
                wallColor = this._hexToRgb(this.colors.wallMedium);
            }
        } else {
            if (perpWallDist < 1) {
                wallColor = this._hexToRgb(this.colors.wallLight);
            } else if (perpWallDist < 2) {
                wallColor = this._hexToRgb(this.colors.wallMedium);
            } else {
                wallColor = this._hexToRgb(this.colors.wallDark);
            }
        }
        
        // Draw the pixels directly to the buffer
        for (let y = drawStart; y < drawEnd; y++) {
            for (let i = 0; i < rayStep && (x + i) < this.width; i++) {
                this.buffer[y * this.width + (x + i)] = wallColor;
            }
        }
    }
    
    /**
     * Render a 2D minimap in the corner
     */
    renderMinimap(player, map) {
        const mapSize = 100; // Minimap size in pixels
        const cellSize = mapSize / Math.max(map.width, map.height);
        const mapX = this.width - mapSize - 10;
        const mapY = 10;
        
        // Draw background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(mapX, mapY, mapSize, mapSize);
        
        // Draw walls
        this.ctx.fillStyle = '#FFF';
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                if (map.grid[y][x] > 0) {
                    this.ctx.fillRect(
                        mapX + x * cellSize,
                        mapY + y * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
        
        // Draw player
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(
            mapX + player.x * cellSize,
            mapY + player.y * cellSize,
            cellSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw direction line
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(
            mapX + player.x * cellSize,
            mapY + player.y * cellSize
        );
        this.ctx.lineTo(
            mapX + (player.x + Math.cos(player.direction) * 1) * cellSize,
            mapY + (player.y + Math.sin(player.direction) * 1) * cellSize
        );
        this.ctx.stroke();
    }
}