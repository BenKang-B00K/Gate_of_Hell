# Project Mandates

- **Git Workflow:** 
    - Automatically `commit` all changes immediately without asking for permission.
    - `push` is ONLY performed upon explicit user request.
    - Default push target is the **gh-pages** branch.
    - `push` to the **main** branch ONLY when specifically requested (e.g., "Push to main").

### 🚀 Development & CLI Workflow
- **Total Function Replacement:** When providing code updates, always provide the full function scope to ensure error-free pasting via CLI.
- **Strict Logic Separation:** Keep core logic in `script.js` and modular systems in their respective `allies_*.js` or `enemies.js` files.
- **UI Sync:** Any data change (HP, Cost, Damage) must be accompanied by its corresponding UI update call (e.g., `updateGauges()` or `updateSummonButtonState()`).
- **Defensive Coding:** Always include null/undefined checks for game objects to prevent script crashes during high-density waves.


## 📏 Resolution & Coordinate Mandates

- **Strict Logical Coordinates:**
    - All game logic (collision, movement speed, projectile paths) MUST be calculated within the **360x640** logical coordinate system.
    - Never use `window.innerWidth` or real-time `canvas.width` for internal logic calculations.

- **Pixel-Perfect Integer Positioning:**
    - When rendering to the Canvas, use `Math.floor()` or `Math.round()` for all X and Y coordinates to prevent anti-aliasing blur.
    - Floating-point coordinates are strictly prohibited in `ctx.drawImage` or `ctx.fillText` calls.

- **Unified Scaling Strategy:**
    - Use the global `scaleFactor` (based on `LOGICAL_WIDTH`) only at the final rendering stage.
    - CSS elements must include `image-rendering: pixelated;` and `image-rendering: crisp-edges;` to maintain the 1-bit/pixel-art aesthetic.

- **UI & HUD Isolation:**
    - In-game UI (HP bars, damage numbers) must follow the 360x640 grid.
    - External HUD elements (defined in `ui.css`) may use higher-fidelity layouts but must not interfere with the logical game area.

- **Safe Zone Adherence:**
    - Keep all critical interactive elements within a **10px horizontal / 20px vertical** safe zone to ensure compatibility across various mobile aspect ratios.