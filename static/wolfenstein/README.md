# Raycasting Game

A JavaScript implementation of a retro-style first-person game inspired by Wolfenstein 3D, using raycasting technology similar to what id Software pioneered in the early 1990s.

## Overview

This project demonstrates the raycasting rendering technique - the same technology that powered groundbreaking games like Wolfenstein 3D before true 3D engines like DOOM. The raycasting method creates a 3D-like environment by casting rays from the player's position and calculating wall distances.

### Features

- Authentic first-person raycasting engine
- Smooth player movement with physics (momentum, collision)
- Five unique maps to explore
- Dynamic lighting effects based on distance
- Real-time minimap display
- Stylish animated title screen
- Sound effects for movement
- Responsive controls

## How to Run

1. Open the `index.html` file in a web browser
2. Select a map from the dropdown
3. Click "Start Game"

### Controls

The game uses intuitive controls for navigation:

- **↑ (Up Arrow)**: Move forward
- **↓ (Down Arrow)**: Move backward
- **← (Left Arrow)**: Turn left
- **→ (Right Arrow)**: Turn right
- **ESC (Escape)**: Return to title screen

The movement system features momentum and smooth turning, similar to classic FPS games.

## Technical Implementation

### Raycasting Algorithm

The core rendering technique works by:

1. Casting rays from the player's position
2. Calculating intersections with walls
3. Determining the distance to walls
4. Rendering vertical strips with heights proportional to distances

For performance optimization, the game:
- Uses an optimized DDA (Digital Differential Analysis) algorithm for ray-wall intersection
- Applies distance-based shading to create depth
- Renders the minimap for spatial awareness
- Implements efficient collision detection around the player

## Project Structure

The project is organized with a modular code structure:

- `index.html` - Main HTML file with UI structure
- `/src/` - JavaScript source files
  - `background.js` - Animated title screen background
  - `map.js` - Map storage and collision detection
  - `player.js` - Player movement physics and state
  - `raycaster.js` - Core raycasting rendering engine
  - `game.js` - Game initialization and main loop

## Map Format

Maps are defined in the `map.js` file with the following structure:

```javascript
{
  name: "Map Name",
  grid: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1]
  ],
  playerStart: {
    x: 1.5,
    y: 1.5,
    angle: 0
  }
}
```

Where:
- `1` represents a wall
- `0` represents an empty space
- `playerStart` defines the initial position and direction of the player

## Textures

The game features high-resolution 256x256 textured walls to create a more immersive environment:

1. Red Brick (wall1.png) - Used for outer walls in the first map
2. Stone (wall2.png) - Used for inner room walls
3. Wood (wall3.png) - Used in the maze map
4. Metal (wall4.png) - Used in the castle map
5. Hedge (wall5.png) - Used in the corridors map

The high-resolution textures provide superior visual quality and detail, enhancing the gaming experience. Each texture uses a procedural generation technique that creates realistic material patterns.

To generate these textures, open the `images/generate_textures.html` file in a web browser and follow the instructions to save the textures to your images folder.

## Acknowledgments & Future Enhancements

This project was inspired by classic games like Wolfenstein 3D by id Software, which pioneered raycasting techniques in game development.

Potential enhancements for future development:

- Enhanced lighting effects (directional lighting, shadows, etc.)
- Additional wall textures and floor/ceiling textures
- Enemies with basic AI and combat mechanics
- Collectible items and objectives
- More complex map elements (doors, secret walls, interactive objects)
- Expanded sound effects (impacts, environment sounds, etc.)
- Background music for different levels
- Performance optimizations for larger maps
- Mobile touch controls
- Minimap improvements (tracked exploration, markers)

## License

This project is open source and available for educational purposes.