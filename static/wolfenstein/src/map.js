/**
 * Map class to handle loading and interacting with map data
 */
class GameMap {
    constructor() {
        this.grid = [];
        this.name = '';
        this.playerStartX = 0;
        this.playerStartY = 0;
        this.playerStartAngle = 0;
        
        // Pre-define maps to avoid loading from files
        this.maps = {
            map1: {
                name: "Simple Room",
                grid: [
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 0, 0, 2, 2, 2, 2, 0, 0, 1],
                    [1, 0, 0, 2, 0, 0, 2, 0, 0, 1],
                    [1, 0, 0, 2, 0, 0, 2, 0, 0, 1],
                    [1, 0, 0, 2, 2, 2, 2, 0, 0, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                ],
                playerStart: {
                    x: 2,
                    y: 2,
                    angle: 0
                }
            },
            map2: {
                name: "Maze",
                grid: [
                    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                    [3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3],
                    [3, 0, 3, 3, 3, 0, 3, 0, 3, 3, 3, 3, 3, 0, 3],
                    [3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 0, 0, 3, 0, 3],
                    [3, 0, 3, 0, 3, 0, 0, 0, 3, 0, 3, 0, 3, 0, 3],
                    [3, 0, 3, 0, 3, 3, 3, 3, 3, 0, 3, 0, 3, 0, 3],
                    [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 3],
                    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3, 0, 3],
                    [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3],
                    [3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 3],
                    [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
                    [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
                ],
                playerStart: {
                    x: 1,
                    y: 1,
                    angle: 0
                }
            },
            map3: {
                name: "Castle",
                grid: [
                    [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
                    [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
                    [4, 0, 4, 4, 0, 4, 4, 4, 4, 4, 0, 4, 4, 0, 4],
                    [4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4],
                    [4, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 4],
                    [4, 0, 4, 0, 2, 0, 0, 0, 0, 0, 2, 0, 4, 0, 4],
                    [4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4],
                    [4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4],
                    [4, 0, 4, 0, 2, 0, 0, 0, 0, 0, 2, 0, 4, 0, 4],
                    [4, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 4],
                    [4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 4],
                    [4, 0, 4, 4, 0, 4, 4, 4, 4, 4, 0, 4, 4, 0, 4],
                    [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
                    [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
                ],
                playerStart: {
                    x: 7,
                    y: 7,
                    angle: 0
                }
            },
            map4: {
                name: "Corridors",
                grid: [
                    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
                    [5, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
                    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
                    [5, 0, 0, 0, 5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 5],
                    [5, 5, 0, 5, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 5],
                    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 5],
                    [5, 0, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 5],
                    [5, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
                    [5, 0, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 5],
                    [5, 0, 0, 0, 5, 0, 0, 0, 0, 0, 5, 0, 0, 0, 5],
                    [5, 0, 0, 0, 5, 5, 5, 0, 5, 5, 5, 0, 0, 0, 5],
                    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
                    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5],
                    [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
                ],
                playerStart: {
                    x: 1.5,
                    y: 1.5,
                    angle: 0
                }
            },
            map5: {
                name: "Labyrinth",
                grid: [
                    [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5],
                    [5, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                    [4, 0, 1, 2, 3, 4, 5, 1, 0, 2, 0, 3, 4, 5, 1, 2, 3, 4, 0, 2],
                    [3, 0, 5, 0, 0, 0, 0, 2, 0, 3, 0, 4, 0, 0, 0, 0, 0, 5, 0, 3],
                    [2, 0, 4, 0, 3, 2, 0, 3, 0, 0, 0, 5, 0, 1, 2, 3, 0, 1, 0, 4],
                    [1, 0, 3, 0, 2, 0, 0, 4, 0, 1, 0, 1, 0, 5, 0, 0, 0, 2, 0, 5],
                    [5, 0, 2, 0, 1, 5, 4, 5, 0, 2, 0, 2, 0, 4, 0, 3, 2, 3, 0, 1],
                    [4, 0, 1, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 0, 0, 2],
                    [3, 0, 5, 4, 3, 2, 1, 5, 4, 4, 0, 4, 0, 2, 1, 5, 4, 3, 0, 3],
                    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 2, 0, 4],
                    [1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 1, 5, 4, 3, 2, 0, 1, 0, 5],
                    [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 1],
                    [4, 0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 4, 0, 2],
                    [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
                    [2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3, 2, 1, 5, 4, 3]
                ],
                playerStart: {
                    x: 1.5,
                    y: 1.5,
                    angle: 0
                }
            }
        };
    }

    // Load map data from predefined maps
    async loadMap(mapName) {
        try {
            const mapData = this.maps[mapName];
            if (!mapData) {
                throw new Error(`Map '${mapName}' not found`);
            }
            
            this.name = mapData.name;
            this.grid = mapData.grid;
            this.playerStartX = mapData.playerStart.x;
            this.playerStartY = mapData.playerStart.y;
            this.playerStartAngle = mapData.playerStart.angle;
            return true;
        } catch (error) {
            console.error('Error loading map:', error);
            return false;
        }
    }

    // Check if a position is a wall
    isWall(x, y) {
        // Convert floating point position to grid index
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);
        
        // Check if out of bounds
        if (gridY < 0 || gridY >= this.grid.length || 
            !this.grid[gridY] || 
            gridX < 0 || gridX >= this.grid[gridY].length) {
            return true; // Treat out of bounds as walls
        }
        
        // Check if the cell is a wall (any non-zero value)
        return this.grid[gridY][gridX] > 0;
    }

    // Get width of the map
    get width() {
        return this.grid[0] ? this.grid[0].length : 0;
    }

    // Get height of the map
    get height() {
        return this.grid.length;
    }
}