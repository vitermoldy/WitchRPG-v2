import * as THREE from 'three'
import type { Target } from '../engine/lockon'
import { bakeByMaterial } from '../engine/models'
import type { Obstacles } from '../engine/obstacles'
import { heightMap, SPOTS, toWorld } from './map'

/**
 * Phase 1 creatures: packs of Imps standing in Hutan Pembuka so the camera and lock-on have
 * something to frame. They watch Ilyra but do not fight yet (that is phase 2).
 */
const CAMPS: { c: [number, number]; n: number }[] = [
  { c: [SPOTS.hero[0] + 9, SPOTS.hero[1] + 6], n: 6 },
  { c: [30, -300], n: 4 },
  { c: [-72, -292], n: 4 },
  { c: [12, -228], n: 5 },
  { c: [-44, -382], n: 3 },
  { c: [72, -358], n: 4 },
  { c: [-112, -330], n: 3 },
  { c: [40, -168], n: 4 },
  { c: [-150, -250], n: 4 },
  { c: [110, -280], n: 4 },
]

export interface Imp extends Target {
  yaw: number
  phase: number
}

export class Camps {
  readonly group = new THREE.Group()
  readonly targets: Imp[] = []
