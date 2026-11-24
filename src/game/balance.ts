// Every tuning number lives here. Values come from the GDD tables and are starting points for
// playtesting, not final numbers.

/** Third-person movement on foot. No free jump or flight in v2: Space dodges. */
export const MOVE = {
  /** Default pace with WASD, and with Shift held. */
  jog: 4.4,
  sprint: 7.0,
  /** Speed changes are deliberately slow to start and quick to stop: weight without sliding. */
  accel: 16,
  decel: 22,
  /** How fast she turns toward the way she moves (radians per second). */
  turn: 11,
  radius: 0.38,
  height: 1.7,
  gravity: 22,
  /** Steepest slope she can walk up, as rise over run; the cliffs of Tebing Berangin are steeper. */
  maxSlope: 1.0,
  /** Deepest water she wades into; Danau Hitam and the swamp pools are deeper. */
  maxWade: 0.9,
  dodge: {
    distance: 4.2,
    time: 0.42,
    /** She cannot be hit between these two moments of the roll (seconds from its start). */
    iframeStart: 0.04,
    iframeEnd: 0.32,
    cooldown: 0.25,
  },
  dodgePerAgi: 0.05,
  interactRange: 3,
} as const

/**
 * Over-the-right-shoulder camera, numbers settled in the phase 0 previz (previz/PREVIZ.md).
 * fov is vertical, as PerspectiveCamera.fov counts it. height is the pivot above her feet.
 */
export const CAMERA = {
  normal: { dist: 3.4, shoulder: 0.8, height: 1.6, fov: 50 },
  aim: { dist: 2.0, shoulder: 0.65, height: 1.6, fov: 40 },
  pitch: -6,
  pitchMin: -55,
  pitchMax: 62,
  /** Rate the camera blends between normal and aim (1/s). */
  blend: 9,
  /** Radius of the sphere swept from the pivot to the camera; nothing may come closer. */
  radius: 0.24,
  /** Rate the camera eases back out after an obstacle stops blocking it (1/s). */
  release: 4,
  near: 0.1,
  far: 1200,
  sensitivity: 0.0022,
} as const

export const LOCKON = {
  range: 30,
  /** A locked target further than this, or hidden this long, lets go. */
