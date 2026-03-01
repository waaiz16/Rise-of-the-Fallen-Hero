# Shadow Street: Rise of the Fallen Hero

A high-fidelity horror-puzzle thriller built with Three.js. Navigate a dark, foggy environment, solve word deduction puzzles, and survive the onslaught of the Shadow Servants.

## Features
- **4 Intense Levels**: Tutorial, Street Puzzle, Basement Maze, and Boss Arena.
- **Dynamic Puzzles**: Randomized word-based logic (FIRE, DARK, DOOR, etc.).
- **Action Combat**: 3rd-person shooting mechanics with health and ammo systems.
- **Atmospheric Horror**: Volumetric fog, thunder/lightning effects, and suspenseful lighting.
- **Epic Boss Battle**: A 12-foot "Monster" with multi-phase AI (Fireballs, Teleportation).

## Prerequisites
- Node.js (v16.0.0 or higher)
- A modern web browser with WebGL support

## Installation
1. Clone or extract the project files.
2. Open your terminal in the project root.
3. Install dependencies:
    `npm install`
4. Start the development server:
    `npm run dev`

## Controls
- **W, A, S, D**: Move Hero
- **Mouse**: Look Around
- **Left Mouse Button**: Shoot
- **Space**: Jump
- **Left Shift**: Sprint
- **E**: Interact (Cards, House selection, Letters)

## Level Guide
1. **Level 1 (Tutorial)**: Master movement and reach the far wall to fly into Level 2.
2. **Level 2 (Street)**: Find the cyan Clue Card. Remember the word. Go to the house with that label. Press 'E' to enter. Wrong house = Death.
3. **Level 3 (Basement)**: Stand on the letter tiles in the correct sequence of the clue word. Press 'E' on each.
4. **Level 4 (Arena)**: Defeat 5 Shadow Servants to summon the Final Boss. Survive his fireballs and teleport attacks to win.

## Scoring System
- +50 for solving the Street Clue
- +100 for the Basement Floor Puzzle
- +30 per Shadow Servant defeated
- +200 for slaying the Final Boss

## Troubleshooting
- **Performance**: Ensure Hardware Acceleration is enabled in your browser settings.
- **Controls**: If the mouse doesn't move the camera, click "ENTER THE DARKNESS" or click anywhere on the screen to engage Pointer Lock.
- **Glitchy Movement**: If the player gets stuck, jump (Space) to reset physics contact.
