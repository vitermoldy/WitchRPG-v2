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
