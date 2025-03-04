let ship;
let asteroids = [];
let bullets = [];
let particles = [];
let stars = []; // Array to hold background stars
let spaceObjects = []; // Array to hold planets and galaxies
let score = 0;
let lives = 3;
let gameOver = false;
let lastAsteroidTime = 0; // Track when the last asteroid was added
let message = ""; // Warning message text
let messageTimer = 0; // Timer for how long to show the message
let shipImage; // Variable to hold the ship image
let galaxyImages = []; // Array to hold galaxy images
let planetImages = []; // Array to hold planet images

function preload() {
  // Load ship image with error handling
  shipImage = loadImage('img/spaceship.png', 
    // Success callback
    () => console.log('Ship image loaded successfully!'),
    // Error callback
    () => console.error('Failed to load ship image')
  );
  
  // Load galaxy images
  try {
    galaxyImages[0] = loadImage('img/galaxy1.png');
    galaxyImages[1] = loadImage('img/galaxy2.png');
    console.log('Galaxy images loaded successfully!');
  } catch (e) {
    console.error('Failed to load galaxy images', e);
  }
  
  // Load planet images
  try {
    planetImages[0] = loadImage('img/planet1.png');
    planetImages[1] = loadImage('img/planet2.png');
    planetImages[2] = loadImage('img/planet3.png');
    console.log('Planet images loaded successfully!');
  } catch (e) {
    console.error('Failed to load planet images', e);
  }
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('game-canvas');
  
  // Create the ship
  ship = new Ship();
  
  // Create initial asteroids
  for (let i = 0; i < 5; i++) {
    asteroids.push(new Asteroid());
  }
  
  // Create starfield (300-500 stars depending on screen size)
  let starCount = floor(map(width * height, 0, 1920 * 1080, 300, 500));
  for (let i = 0; i < starCount; i++) {
    stars.push(new Star());
  }
  
  // Create distant space objects (planets and galaxies)
  // Add 1-2 galaxies
  let galaxyCount = floor(random(1, 3));
  for (let i = 0; i < galaxyCount; i++) {
    if (galaxyImages.length > 0) {
      spaceObjects.push(new SpaceObject('galaxy', i % galaxyImages.length));
    }
  }
  
  // Add 2-4 planets
  let planetCount = floor(random(2, 5));
  for (let i = 0; i < planetCount; i++) {
    if (planetImages.length > 0) {
      spaceObjects.push(new SpaceObject('planet', i % planetImages.length));
    }
  }
  
  lastAsteroidTime = millis(); // Initialize the timer
  updateScoreDisplay();
  updateLivesDisplay();
}

function draw() {
  background(0);

  if (gameOver) {
    // Still show stars in the background for game over screen
    updateAndDisplayStars();
    displayGameOver();
    return;
  }
  
  // Check if it's time to add a new asteroid (every 10 seconds)
  let currentTime = millis();
  if (currentTime - lastAsteroidTime > 10000) { // 10000 ms = 10 seconds
    asteroids.push(new Asteroid());
    lastAsteroidTime = currentTime;
    
    // Show a warning message
    showMessage("WARNING: New asteroid approaching!");
  }

  // First draw the background stars with parallax effect
  updateAndDisplayStars();
  
  // Update and display ship
  ship.update();
  ship.display();

  // Update and display bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();
    
    // Remove bullets that are off-screen
    if (bullets[i].isOffScreen()) {
      bullets.splice(i, 1);
      continue;
    }

    // Check bullet-asteroid collisions
    for (let j = asteroids.length - 1; j >= 0; j--) {
      if (bullets[i] && collideCircleCircle(
        bullets[i].pos.x, bullets[i].pos.y, bullets[i].r * 2,
        asteroids[j].pos.x, asteroids[j].pos.y, asteroids[j].r * 2
      )) {
        // Create explosion particles
        createExplosion(asteroids[j].pos.x, asteroids[j].pos.y);
        
        // Split asteroid or remove it
        if (asteroids[j].r > 20) {
          let newAsteroids = asteroids[j].split();
          asteroids = asteroids.concat(newAsteroids);
        }
        
        // Remove the asteroid and bullet
        asteroids.splice(j, 1);
        bullets.splice(i, 1);
        
        // Increase score
        score += 100;
        updateScoreDisplay();
        
        // Create new asteroid if few remain
        if (asteroids.length < 5) {
          asteroids.push(new Asteroid());
        }
        
        break;
      }
    }
  }

  // Update and display asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    asteroids[i].update();
    asteroids[i].display();
    
    // Check ship-asteroid collisions
    if (!ship.isInvulnerable && collideCircleCircle(
      ship.pos.x, ship.pos.y, ship.r * 2,
      asteroids[i].pos.x, asteroids[i].pos.y, asteroids[i].r * 2
    )) {
      lives--;
      updateLivesDisplay();
      
      if (lives <= 0) {
        gameOver = true;
      } else {
        ship.respawn();
      }
    }
  }

  // Update and display particles
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    
    if (particles[i].lifespan <= 0) {
      particles.splice(i, 1);
    }
  }
  
  // Display warning message if active
  if (messageTimer > 0) {
    displayMessage();
    messageTimer--;
  }
}

function displayMessage() {
  textAlign(CENTER, CENTER);
  textSize(24);
  fill(255, 0, 0);
  text(message, width / 2, 80);
}

function keyPressed() {
  if (gameOver && keyCode === ENTER) {
    restartGame();
    return;
  }

  if (keyCode === 32) { // SPACE
    // Create a bullet at the ship's position
    // We need to calculate the front position of the ship based on ship's heading
    let bulletPos = createVector(
      ship.pos.x + cos(ship.heading) * ship.imageWidth/2,
      ship.pos.y + sin(ship.heading) * ship.imageWidth/2
    );
    bullets.push(new Bullet(bulletPos, ship.heading));
  }
}

function updateScoreDisplay() {
  document.getElementById('score-value').textContent = score;
}

function updateLivesDisplay() {
  document.getElementById('lives-value').textContent = lives;
}

function displayGameOver() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(64);
  text('GAME OVER', width / 2, height / 2 - 40);
  textSize(24);
  text('Final Score: ' + score, width / 2, height / 2 + 40);
  text('Press ENTER to restart', width / 2, height / 2 + 80);
}

function restartGame() {
  ship = new Ship();
  asteroids = [];
  bullets = [];
  particles = [];
  score = 0;
  lives = 3;
  gameOver = false;
  message = "";
  messageTimer = 0;
  lastAsteroidTime = millis();
  
  for (let i = 0; i < 5; i++) {
    asteroids.push(new Asteroid());
  }
  
  updateScoreDisplay();
  updateLivesDisplay();
}

function showMessage(text) {
  message = text;
  messageTimer = 180; // Show for 3 seconds (60 frames per second)
}

function createExplosion(x, y) {
  for (let i = 0; i < 20; i++) {
    particles.push(new Particle(x, y));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Adjust star positions for new screen size
  for (let star of stars) {
    if (star.pos.x > width) star.pos.x = random(width);
    if (star.pos.y > height) star.pos.y = random(height);
  }
  
  // Adjust space objects (planets/galaxies) for new screen size
  for (let obj of spaceObjects) {
    // Keep objects that are off-screen somewhat close to the edges
    let buffer = obj.size;
    if (obj.pos.x > width + buffer) obj.pos.x = width + random(buffer);
    if (obj.pos.y > height + buffer) obj.pos.y = height + random(buffer);
  }
}

// Function to update and display stars with parallax effect
function updateAndDisplayStars() {
  // Create proper depth layering:
  // 1. Galaxies (farthest)
  // 2. Stars (middle)
  // 3. Planets (closest, but still in background)
  
  // First update all objects
  for (let obj of spaceObjects) {
    obj.update();
  }
  for (let star of stars) {
    star.update();
  }
  
  // Sort stars by z-depth so the closer ones are drawn on top
  stars.sort((a, b) => a.z - b.z);
  
  // Now display in proper order - galaxies first
  for (let obj of spaceObjects) {
    if (obj.type === 'galaxy') {
      obj.display();
    }
  }
  
  // Then draw stars
  for (let star of stars) {
    star.display();
  }
  
  // Then draw planets on top of stars
  for (let obj of spaceObjects) {
    if (obj.type === 'planet') {
      obj.display();
    }
  }
}

// Ship class
class Ship {
  constructor() {
    this.pos = createVector(width / 2, height / 2);
    this.r = 20; // Radius for collision detection
    this.heading = 0;
    this.rotation = 0;
    this.vel = createVector(0, 0);
    this.isBoosting = false;
    this.isInvulnerable = false;
    this.invulnerabilityTime = 0;
    this.imageWidth = 50; // Width of the ship image
    this.imageHeight = 50; // Height of the ship image
  }

  update() {
    if (this.isInvulnerable) {
      this.invulnerabilityTime--;
      if (this.invulnerabilityTime <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Rotate ship
    if (keyIsDown(LEFT_ARROW)) {
      this.rotation = -0.1;
    } else if (keyIsDown(RIGHT_ARROW)) {
      this.rotation = 0.1;
    } else {
      this.rotation = 0;
    }
    
    this.heading += this.rotation;
    
    // Apply thrust - REMOVING the PI/2 adjustment to match our new image rotation
    this.isBoosting = keyIsDown(UP_ARROW);
    if (this.isBoosting) {
      const force = p5.Vector.fromAngle(this.heading);
      force.mult(0.2);
      this.vel.add(force);
    }
    
    // Apply friction
    this.vel.mult(0.98);
    
    // Update position
    this.pos.add(this.vel);
    
    // Wrap around edges
    this.edges();
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    
    // Blinking effect when invulnerable
    if (!this.isInvulnerable || frameCount % 10 < 5) {
      // We need to make the ship point in the heading direction
      // In p5.js, 0 degrees points EAST (right)
      // If your ship starts pointing LEFT but should point UP,
      // we need to adjust by -PI/2 (90° clockwise)
      
      // The issue is that we don't know exactly which way the image points,
      // so we need to try different rotations until it looks right
      
      // Let's try a different approach
      push();
      // First apply the base ship heading without any adjustment
      rotate(this.heading);
      
      // If sprite is looking left when ship is looking up,
      // we need to rotate it 90° COUNTER-clockwise (PI/2)
      push();
      rotate(PI/2);  // 90° counter-clockwise rotation
      imageMode(CENTER);
      image(shipImage, 0, 0, this.imageWidth, this.imageHeight);
      pop();
      
      // Draw thrust flame with blinking effect
      if (this.isBoosting) {
        // Move to the left side of the ship
        push();
        translate(-this.imageWidth/2, 0);
        
        // Create a flame effect that's rotated 45° clockwise (pointing left-down)
        // Use frameCount to create blinking/pulsing effect on opacity and size
        
        // Calculate pulsing values based on frameCount
        let flameOpacity = map(sin(frameCount * 0.2), -1, 1, 150, 250);
        let flamePulse = map(sin(frameCount * 0.3), -1, 1, 0.85, 1.15);
        
        // First draw the outer orange flame
        fill(255, 120, 0, flameOpacity);
        noStroke();
        beginShape();
        vertex(0, -5);
        vertex(-15 * flamePulse, 15 * flamePulse);
        vertex(-10 * flamePulse, 0);
        vertex(-20 * flamePulse, 0);
        vertex(-10 * flamePulse, -5);
        vertex(-15 * flamePulse, -15 * flamePulse);
        endShape(CLOSE);
        
        // Then draw the inner yellow flame with different pulse rate
        let innerPulse = map(sin(frameCount * 0.4), -1, 1, 0.7, 1.2);
        fill(255, 255, 0, flameOpacity + 20);
        beginShape();
        vertex(0, -3);
        vertex(-10 * innerPulse, 10 * innerPulse);
        vertex(-7 * innerPulse, 0);
        vertex(-12 * innerPulse, 0);
        vertex(-7 * innerPulse, -3);
        vertex(-10 * innerPulse, -10 * innerPulse);
        endShape(CLOSE);
        pop();
      }
      pop();
    }
    pop();
  }

  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }

  respawn() {
    this.pos = createVector(width / 2, height / 2);
    this.vel = createVector(0, 0);
    this.isInvulnerable = true;
    this.invulnerabilityTime = 180; // 3 seconds at 60fps
  }
}

// Asteroid class
class Asteroid {
  constructor(pos, r) {
    if (pos) {
      this.pos = pos.copy();
    } else {
      // Start asteroids away from the ship
      let safeDist = 200;
      let x, y;
      do {
        x = random(width);
        y = random(height);
      } while (dist(x, y, width/2, height/2) < safeDist);
      
      this.pos = createVector(x, y);
    }
    
    this.r = r || random(30, 50);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 3));
    
    // Create more complex 3D-like shape
    this.totalVertices = floor(random(8, 16));
    
    // Multiple layers for 3D effect
    this.layers = floor(random(3, 6));
    this.layerOffsets = [];
    
    // Create varied offsets for each layer and vertex
    for (let layer = 0; layer < this.layers; layer++) {
      this.layerOffsets[layer] = [];
      for (let i = 0; i < this.totalVertices; i++) {
        this.layerOffsets[layer][i] = random(0.5, 1.0);
      }
    }
    
    // 3D rotation parameters (x, y, z axes)
    this.rotX = random(-0.02, 0.02);
    this.rotY = random(-0.02, 0.02);
    this.rotZ = random(-0.02, 0.02);
    this.angleX = random(TWO_PI);
    this.angleY = random(TWO_PI);
    this.angleZ = random(TWO_PI);
    
    // Meteor color
    this.baseColor = color(random(30, 80), random(30, 60), random(30, 60));
    this.craterColor = color(random(20, 40), random(20, 40), random(20, 40));
    
    // Create random craters
    this.craters = [];
    let craterCount = floor(random(3, 8));
    for (let i = 0; i < craterCount; i++) {
      this.craters.push({
        angle: random(TWO_PI),
        dist: random(0.2, 0.8) * this.r,
        size: random(0.1, 0.3) * this.r,
        layer: floor(random(0, this.layers))
      });
    }
  }

  update() {
    this.pos.add(this.vel);
    // Update rotation angle (just Z-axis in 2D)
    this.angleZ += this.rotZ;
    
    // Simulate X/Y rotation by adjusting the layer rendering
    // This is handled in the display method
    this.edges();
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    
    // Apply rotation (use only Z rotation since we're in 2D mode)
    // We'll simulate 3D rotation using layering effects instead
    rotate(this.angleZ);
    
    // Draw each layer from back to front
    for (let layer = 0; layer < this.layers; layer++) {
      // Calculate layer depth color (darker in back, lighter in front)
      let layerShade = map(layer, 0, this.layers-1, 0.6, 1.0);
      let asteroidColor = color(
        red(this.baseColor) * layerShade,
        green(this.baseColor) * layerShade,
        blue(this.baseColor) * layerShade
      );
      
      fill(asteroidColor);
      stroke(255, 200);
      strokeWeight(1);
      
      // Draw the layer shape
      beginShape();
      for (let i = 0; i < this.totalVertices; i++) {
        let angle = map(i, 0, this.totalVertices, 0, TWO_PI);
        let r = this.r * this.layerOffsets[layer][i] * map(layer, 0, this.layers-1, 0.7, 1.0);
        let x = r * cos(angle);
        let y = r * sin(angle);
        vertex(x, y);
      }
      endShape(CLOSE);
      
      // Draw craters on this layer
      noStroke();
      fill(this.craterColor);
      for (let crater of this.craters) {
        if (crater.layer === layer) {
          let craterX = crater.dist * cos(crater.angle);
          let craterY = crater.dist * sin(crater.angle);
          ellipse(craterX, craterY, crater.size);
        }
      }
      
      // Add lighting effect
      if (layer === this.layers - 1) {
        // Highlight edge
        noFill();
        stroke(255, 100);
        strokeWeight(2);
        arc(0, 0, this.r * 2 * 0.9, this.r * 2 * 0.9, PI * 0.75, PI * 1.75);
      }
    }
    pop();
  }

  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }

  split() {
    let newAsteroids = [];
    let newRadius = this.r / 2;
    
    for (let i = 0; i < 2; i++) {
      let newAsteroid = new Asteroid(this.pos, newRadius);
      newAsteroid.vel = p5.Vector.random2D();
      newAsteroid.vel.mult(random(3, 5));
      // Pass on some of the parent asteroid's properties for visual consistency
      newAsteroid.baseColor = this.baseColor;
      newAsteroids.push(newAsteroid);
    }
    
    return newAsteroids;
  }
}

// Bullet class
class Bullet {
  constructor(shipPos, angle) {
    this.pos = createVector(shipPos.x, shipPos.y);
    // Use the angle directly now that we fixed the ship movement
    this.vel = p5.Vector.fromAngle(angle);
    this.vel.mult(10);
    this.r = 4;
    this.lifespan = 60; // frames
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan--;
  }

  display() {
    push();
    stroke(255);
    strokeWeight(4);
    point(this.pos.x, this.pos.y);
    pop();
  }

  isOffScreen() {
    return (this.pos.x < 0 || this.pos.x > width || 
            this.pos.y < 0 || this.pos.y > height ||
            this.lifespan <= 0);
  }
}

// Particle class (for explosions)
class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 5));
    this.acc = createVector(0, 0);
    this.r = random(2, 5);
    this.lifespan = 255;
    this.color = color(255, random(150, 255), 0);
  }

  update() {
    this.vel.mult(0.97);
    this.pos.add(this.vel);
    this.lifespan -= 6;
  }

  display() {
    if (this.lifespan <= 0) return;
    
    push();
    noStroke();
    fill(this.color, this.lifespan);
    ellipse(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}

// Star class for parallax background effect
class Star {
  constructor() {
    // Random position across the screen
    this.pos = createVector(random(width), random(height));
    
    // Z-depth for parallax effect (0 is far, 1 is close)
    this.z = random(0, 1);
    
    // Speed based on depth - closer stars move faster
    this.baseSpeed = map(this.z, 0, 1, 0.5, 5);
    
    // Size based on depth - closer stars are larger
    this.size = map(this.z, 0, 1, 0.5, 3);
    
    // Brightness based on depth - closer stars are brighter
    this.brightness = map(this.z, 0, 1, 120, 255);
    
    // Slight color variation
    this.color = color(
      random(200, 255),  // R
      random(200, 255),  // G
      random(200, 255),  // B
      this.brightness    // A
    );
    
    // For twinkling effect
    this.twinkleSpeed = random(0.02, 0.05);
    this.twinkleOffset = random(TWO_PI);
  }
  
  // Update star position based on ship's movement
  update() {
    // Get ship's velocity 
    let shipVel = ship.vel.copy();
    
    // Calculate movement based on ship velocity and star depth
    // Negate the ship velocity to create the opposite movement direction
    let moveX = -shipVel.x * this.z * 0.5;
    let moveY = -shipVel.y * this.z * 0.5;
    
    // Move the star
    this.pos.x += moveX;
    this.pos.y += moveY;
    
    // Wrap around screen edges
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }
  
  display() {
    // Calculate twinkling effect
    let twinkle = sin(frameCount * this.twinkleSpeed + this.twinkleOffset);
    let brightness = map(twinkle, -1, 1, this.brightness * 0.5, this.brightness);
    
    // Draw the star
    push();
    noStroke();
    
    // Apply twinkle and set color
    fill(red(this.color), green(this.color), blue(this.color), brightness);
    
    // Draw star as a small circle
    ellipse(this.pos.x, this.pos.y, this.size);
    
    // For closer stars, add a subtle glow
    if (this.z > 0.7) {
      // Draw a subtle halo/glow for the closest stars
      fill(red(this.color), green(this.color), blue(this.color), brightness * 0.2);
      ellipse(this.pos.x, this.pos.y, this.size * 3);
    }
    pop();
  }
}

// Class for distant space objects (planets and galaxies)
class SpaceObject {
  constructor(type, imageIndex) {
    // Type is either 'planet' or 'galaxy'
    this.type = type;
    this.imageIndex = imageIndex;
    
    // Choose the right image based on type
    if (this.type === 'galaxy') {
      this.img = galaxyImages[this.imageIndex];
    } else {
      this.img = planetImages[this.imageIndex];
    }
    
    // Random position - keep objects more toward the edges
    let edgePadding = width * 0.1;
    if (random() < 0.5) {
      // Place near horizontal edges
      this.pos = createVector(
        random() < 0.5 ? random(edgePadding) : random(width - edgePadding, width),
        random(height)
      );
    } else {
      // Place near vertical edges
      this.pos = createVector(
        random(width),
        random() < 0.5 ? random(edgePadding) : random(height - edgePadding, height)
      );
    }
    
    // Depth factor - extreme difference between galaxies and planets
    // (0 is farthest, 1 is closest)
    if (this.type === 'galaxy') {
      // Galaxies are extremely far - barely move with parallax
      this.z = random(0, 0.03); 
    } else {
      // Planets are much closer than stars - more parallax movement
      this.z = random(0.6, 1.0); 
    }
    
    // Size based on object type and depth
    if (this.type === 'galaxy') {
      // Galaxies are enormous but appear small due to extreme distance
      this.size = random(80, 200) * map(this.z, 0, 0.03, 0.4, 0.8);
    } else {
      // Planets have more variance in apparent size
      this.size = random(20, 70) * map(this.z, 0.6, 1.0, 0.8, 1.5);
    }
    
    // Rotation for planet/galaxy
    this.angle = random(TWO_PI);
    // Galaxies rotate slower than planets
    this.rotSpeed = this.type === 'galaxy' ? 
                    random(-0.0005, 0.0005) : // Very slow galaxy rotation
                    random(-0.002, 0.002);    // Faster planet rotation
    
    // Opacity based on depth - galaxies much more transparent
    if (this.type === 'galaxy') {
      this.opacity = map(this.z, 0, 0.03, 40, 80); // Very transparent galaxies
    } else {
      this.opacity = map(this.z, 0.6, 1.0, 180, 255); // More opaque planets
    }
    
    // Subtle pulsing effect for galaxies
    this.pulseSpeed = random(0.005, 0.01);
    this.pulseOffset = random(TWO_PI);
  }
  
  update() {
    // Get ship's velocity for parallax
    let shipVel = ship.vel.copy();
    
    // Movement based on ship's velocity and object depth
    if (this.type === 'galaxy') {
      // Extremely subtle movement for distant galaxies (40x slower than stars)
      let moveX = -shipVel.x * this.z * 0.025;
      let moveY = -shipVel.y * this.z * 0.025;
      
      // Move the galaxy
      this.pos.x += moveX;
      this.pos.y += moveY;
    } else {
      // Faster movement for closer planets (1.5x faster than stars)
      let moveX = -shipVel.x * this.z * 0.75;
      let moveY = -shipVel.y * this.z * 0.75;
      
      // Move the planet
      this.pos.x += moveX;
      this.pos.y += moveY;
    }
    
    // Update rotation angle very slowly
    this.angle += this.rotSpeed;
    
    // Wrap around screen edges
    let buffer = this.size;
    if (this.pos.x < -buffer) this.pos.x = width + buffer;
    if (this.pos.x > width + buffer) this.pos.x = -buffer;
    if (this.pos.y < -buffer) this.pos.y = height + buffer;
    if (this.pos.y > height + buffer) this.pos.y = -buffer;
  }
  
  display() {
    if (!this.img) return; // Skip if image not loaded
    
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    
    // Apply effects based on object type
    let displaySize = this.size;
    let displayOpacity = this.opacity;
    
    if (this.type === 'galaxy') {
      // More dramatic pulsing for galaxies
      let pulse = sin(frameCount * this.pulseSpeed + this.pulseOffset);
      displaySize *= map(pulse, -1, 1, 0.92, 1.08);
      displayOpacity = map(pulse, -1, 1, this.opacity * 0.7, this.opacity * 1.3);
      
      // Create a subtle glow effect for galaxies
      noFill();
      for (let i = 3; i > 0; i--) {
        let glowSize = displaySize * (1 + i * 0.2);
        let glowOpacity = displayOpacity * (0.1 / i);
        strokeWeight(i);
        stroke(255, 200, 255, glowOpacity);
        ellipse(0, 0, glowSize);
      }
    } else {
      // Enhanced planet effects
      // Create atmospheric glow for planets
      if (this.z > 0.7) {
        // Stronger glow for closer planets
        noFill();
        
        // Outer atmospheric glow
        strokeWeight(3);
        stroke(200, 220, 255, 40);
        ellipse(0, 0, displaySize * 1.25);
        
        // Inner atmospheric glow
        strokeWeight(2);
        stroke(255, 255, 255, 60);
        ellipse(0, 0, displaySize * 1.12);
      }
    }
    
    // Draw the image with proper blending and opacity
    imageMode(CENTER);
    tint(255, displayOpacity);
    image(this.img, 0, 0, displaySize, displaySize);
    
    pop();
  }
}