import { MOVE } from '../game/balance'
import { forward, rightOf, type HeightFn } from './camera'
import type { Obstacles } from './obstacles'

export interface MoveInput {
  /** Strafe (-1 left, 1 right) and forward (-1 back, 1 forward), relative to the camera. */
  x: number
  y: number
  sprint: boolean
  dodge: boolean
}

export interface Ground {
  height: HeightFn
  obstacles: Obstacles | null
  /** True where she may not stand: deep water, past the map edge. */
  blocked: (x: number, z: number) => boolean
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

/**
 * Ilyra on foot: weighty acceleration, turning toward where she goes, and a roll on Space with a short
 * window in which nothing can hit her. Her yaw uses the camera convention (0 faces north, -z).
 */
export class Player {
  readonly pos = { x: 0, y: 0, z: 0 }
  vx = 0
  vz = 0
  vy = 0
  facing = 0
  /** Seconds into the current roll, or -1. */
  dodgeT = -1
  dodgeX = 0
  dodgeZ = 0
  dodgeCd = 0
  dodgeDistance: number = MOVE.dodge.distance
  speedMult = 1
  /** Walk cycle phase for the procedural animation (radians). */
  stride = 0
  /** Every roll started, for the debug readout and the bot. */
  dodges = 0

  get speed() {
    return Math.hypot(this.vx, this.vz)
  }

  get dodging() {
    return this.dodgeT >= 0
  }

  get invulnerable() {
    return this.dodgeT >= MOVE.dodge.iframeStart && this.dodgeT <= MOVE.dodge.iframeEnd
  }

  place(x: number, z: number, g: Ground, facing = 0) {
    this.pos.x = x
    this.pos.z = z
    this.pos.y = g.height(x, z)
    this.vx = this.vz = this.vy = 0
    this.facing = facing
    this.dodgeT = -1
  }

  /**
   * face: a yaw to keep facing (lock-on target, aim direction), or null to turn toward the movement.
   * Aiming slows her to a careful walk and rules out sprinting.
   */
  update(dt: number, input: MoveInput, camYaw: number, face: number | null, aiming: boolean, g: Ground) {
    const f = forward(camYaw, 0)
    const r = rightOf(camYaw)
    let wx = f.x * input.y + r.x * input.x
    let wz = f.z * input.y + r.z * input.x
    const wl = Math.hypot(wx, wz)
    if (wl > 1) {
      wx /= wl
      wz /= wl
    }

