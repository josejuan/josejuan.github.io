/**
 * This script creates placeholder texture images for the game
 * Generate textures using HTML Canvas and save them as PNG files
 */

// Assuming this script will be executed in Node.js with a Canvas implementation
// You can run this script to generate the texture images

// Import required modules (Node.js environment)
const fs = require('fs');
const { createCanvas } = require('canvas');

// Texture generation settings
const texSize = 256; // 256x256 pixel textures
const wallTypes = 5; // We have 5 different wall types
const colors = [
  { main: '#CC0000', accent: '#880000' }, // Red brick
  { main: '#888888', accent: '#333333' }, // Stone
  { main: '#A0522D', accent: '#654321' }, // Wood
  { main: '#4682B4', accent: '#1E4D6B' }, // Metal
  { main: '#006400', accent: '#003200' }  // Hedge
];

// Create texture patterns
function generateTextures() {
  console.log('Generating texture images...');
  
  const wallPatterns = [
    createBrickTexture,
    createStoneTexture,
    createWoodTexture,
    createMetalTexture,
    createHedgeTexture
  ];
  
  for (let i = 0; i < wallTypes; i++) {
    const canvas = createCanvas(texSize, texSize);
    const ctx = canvas.getContext('2d');
    
    // Call the appropriate texture generator
    wallPatterns[i](ctx, colors[i]);
    
    // Save the texture as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./wall${i + 1}.png`, buffer);
    
    console.log(`Created wall${i + 1}.png`);
  }
  
  console.log('All textures generated successfully!');
}

// Brick wall pattern
function createBrickTexture(ctx, color) {
  const { main, accent } = color;
  
  // Background
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, texSize, texSize);
  
  // Draw bricks
  ctx.fillStyle = accent;
  
  // Horizontal lines (mortar)
  for (let y = 0; y < texSize; y += 16) {
    ctx.fillRect(0, y, texSize, 2);
  }
  
  // Vertical lines (brick edges)
  for (let x = 0; x < texSize; x += 16) {
    for (let y = 0; y < texSize; y += 32) {
      ctx.fillRect(x, y + 2, 2, 14);
      ctx.fillRect(x + 8, y + 18, 2, 14);
    }
  }
}

// Stone wall pattern
function createStoneTexture(ctx, color) {
  const { main, accent } = color;
  
  // Background
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, texSize, texSize);
  
  // Draw stone pattern
  ctx.fillStyle = accent;
  
  // Irregular stone blocks
  const blocks = [
    [0, 0, 16, 16], [16, 0, 32, 16], [48, 0, 16, 32],
    [0, 16, 32, 32], [32, 16, 16, 16], [32, 32, 32, 32],
    [0, 48, 16, 16], [16, 48, 16, 16], [32, 48, 16, 16], [48, 48, 16, 16]
  ];
  
  // Draw cracks between blocks
  blocks.forEach(([x, y, w, h]) => {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  });
  
  // Add some texture noise
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * texSize);
    const y = Math.floor(Math.random() * texSize);
    ctx.fillRect(x, y, 2, 2);
  }
}

// Wood texture
function createWoodTexture(ctx, color) {
  const { main, accent } = color;
  
  // Background
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, texSize, texSize);
  
  // Draw wood grain
  ctx.fillStyle = accent;
  
  // Vertical planks
  for (let x = 0; x < texSize; x += 16) {
    ctx.fillRect(x, 0, 1, texSize);
    
    // Wood grain lines
    for (let i = 0; i < 5; i++) {
      const xOffset = x + 2 + Math.floor(Math.random() * 10);
      ctx.fillRect(xOffset, 0, 1, texSize);
    }
  }
  
  // Horizontal details
  for (let y = 0; y < texSize; y += 32) {
    ctx.fillRect(0, y, texSize, 2);
  }
}

// Metal texture
function createMetalTexture(ctx, color) {
  const { main, accent } = color;
  
  // Background
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, texSize, texSize);
  
  // Draw metal pattern
  ctx.fillStyle = accent;
  
  // Rivets
  for (let x = 8; x < texSize; x += 16) {
    for (let y = 8; y < texSize; y += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Metal plate divisions
  ctx.fillRect(0, texSize / 2, texSize, 2);
  ctx.fillRect(texSize / 2, 0, 2, texSize);
  
  // Scratches
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * texSize);
    const y = Math.floor(Math.random() * texSize);
    const length = 5 + Math.floor(Math.random() * 15);
    const angle = Math.random() * Math.PI;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillRect(0, 0, length, 1);
    ctx.restore();
  }
}

// Hedge/foliage texture
function createHedgeTexture(ctx, color) {
  const { main, accent } = color;
  
  // Background
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, texSize, texSize);
  
  // Draw leaf pattern
  ctx.fillStyle = accent;
  
  // Small leaf clusters
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * texSize);
    const y = Math.floor(Math.random() * texSize);
    const size = 2 + Math.floor(Math.random() * 4);
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Larger leaf shapes
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * texSize);
    const y = Math.floor(Math.random() * texSize);
    
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 4, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Export the function for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateTextures };
} else {
  // If running in browser
  generateTextures();
}

console.log('Note: This is a helper script to generate textures.');
console.log('For actual use, 64x64 PNG images need to be created and placed in the images folder.');
console.log('Suggested texture size: 64x64 pixels, named wall1.png through wall5.png');