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
  private readonly meshes: THREE.InstancedMesh[] = []
  private readonly m = new THREE.Matrix4()
  private readonly q = new THREE.Quaternion()
  private readonly v = new THREE.Vector3()
  private readonly one = new THREE.Vector3(1, 1, 1)
  private readonly up = new THREE.Vector3(0, 1, 0)

  constructor(model: THREE.Group, obstacles: Obstacles) {
    this.group.name = 'camps'
    let seed = 11
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (const camp of CAMPS) {
      for (let i = 0; i < camp.n; i++) {
        const a = rnd() * Math.PI * 2
        const r = 1.5 + rnd() * 3.5
        const [wx, wz] = toWorld(camp.c[0] + Math.cos(a) * r, camp.c[1] + Math.sin(a) * r)
        const p = { x: wx, y: 0, z: wz }
        obstacles.pushOut(p, 0.5, 1.3)
        p.y = heightMap(p.x, -p.z)
        this.targets.push({ x: p.x, y: p.y, z: p.z, height: 1.3, alive: true, yaw: rnd() * Math.PI * 2, phase: rnd() * 10 })
      }
    }
    for (const b of bakeByMaterial(model)) {
