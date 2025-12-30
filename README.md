# wall_hugger

Clockwise wall-following Snowfight bot. Behavior:
- Navigate to the nearest wall (assumes default 1000x1000 field centered at 0,0).
- Travel clockwise along the boundary, turning at corners.
- Throw forward when a target is within 150 units and roughly in line.

Run a match:
```bash
snowfight match tmp/example-bots/wall_hugger/wall_hugger.js sample_bot/spiral_hunter.js
```
