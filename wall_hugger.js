// Snowfight example bot: Wall Hugger (clockwise)
// Strategy:
// 1) Move to the nearest wall using field defaults (1000x1000, centered at 0,0).
// 2) Once near a wall (<= margin), travel clockwise along the boundary.
// 3) Opportunistically throw forward when a target is in front within 150 units.

const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 1000;
const HALF_W = FIELD_WIDTH / 2;
const HALF_H = FIELD_HEIGHT / 2;
const MARGIN = 40;      // distance from wall to consider "hugging"
const STEP = 12;        // forward move distance when cruising

function normalize(angle) {
  angle %= 360;
  if (angle < 0) angle += 360;
  return angle;
}

function deltaAngle(target, current) {
  let diff = normalize(target - current);
  if (diff > 180) diff -= 360;
  return diff; // [-180,180]
}

function bearingTo(targetX, targetY, fromX, fromY) {
  const dx = targetX - fromX;
  const dy = targetY - fromY;
  // Convert to game bearing (0 = north, 90 = east, clockwise)
  const angle = Math.atan2(dx, dy) * 180 / Math.PI;
  return normalize(angle);
}

function nearestWallDistances(pos) {
  return {
    left: pos.x + HALF_W,
    right: HALF_W - pos.x,
    top: HALF_H - pos.y,
    bottom: pos.y + HALF_H,
  };
}

function determineHeading(pos) {
  const d = nearestWallDistances(pos);
  const nearTop = d.top <= MARGIN;
  const nearRight = d.right <= MARGIN;
  const nearBottom = d.bottom <= MARGIN;
  const nearLeft = d.left <= MARGIN;

  // Corners take priority for smooth clockwise turns
  if (nearTop && nearRight) return 180;  // turn south at NE corner
  if (nearRight && nearBottom) return 270; // turn west at SE corner
  if (nearBottom && nearLeft) return 0;   // turn north at SW corner
  if (nearLeft && nearTop) return 90;     // turn east at NW corner

  if (nearTop) return 90;      // move east along top wall
  if (nearRight) return 180;   // move south along right wall
  if (nearBottom) return 270;  // move west along bottom wall
  if (nearLeft) return 0;      // move north along left wall

  // Not near any wall: head to closest wall center point
  const walls = [
    {dist: d.top, angle: 0, target: {x: pos.x, y: HALF_H - MARGIN}},
    {dist: d.right, angle: 90, target: {x: HALF_W - MARGIN, y: pos.y}},
    {dist: d.bottom, angle: 180, target: {x: pos.x, y: -HALF_H + MARGIN}},
    {dist: d.left, angle: 270, target: {x: -HALF_W + MARGIN, y: pos.y}},
  ];
  walls.sort((a, b) => a.dist - b.dist);
  return bearingTo(walls[0].target.x, walls[0].target.y, pos.x, pos.y);
}

function run(state) {
  const pos = position();
  const dir = direction();

  // Attack if a target is almost straight ahead
  const scanArc = 30;
  const sightings = scan(dir, scanArc);
  if (sightings.length > 0) {
    const target = sightings[0];
    if (target.distance <= 150 && Math.abs(deltaAngle(target.angle, dir)) <= 10) {
      const throwDist = Math.max(1, Math.min(150, Math.round(target.distance)));
      toss(throwDist);
      return;
    }
  }

  const heading = determineHeading(pos);
  const diff = deltaAngle(heading, dir);

  // Turn toward the desired heading first.
  if (Math.abs(diff) > 8) {
    // Limit turn per tick for smoother path
    const turnStep = Math.max(-45, Math.min(45, diff));
    turn(turnStep);
    return;
  }

  // Move forward while hugging. If drifting away (> 1.5 * margin), steer back instead of moving.
  const d = nearestWallDistances(pos);
  const minDist = Math.min(d.left, d.right, d.top, d.bottom);
  if (minDist > MARGIN * 1.5) {
    // drifted inward; nudge back to nearest wall
    const targetHeading = determineHeading(pos);
    const adjustDiff = deltaAngle(targetHeading, dir);
    const turnStep = Math.max(-30, Math.min(30, adjustDiff));
    turn(turnStep);
    return;
  }

  move(STEP);
}
