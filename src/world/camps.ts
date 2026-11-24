import * as THREE from 'three'
import { CAMP, type V2Kind } from '../game/balance'
import type { Game } from '../engine/game'
import { COLOR } from '../engine/palette'
import type { Unit } from '../engine/units'
import { heightMap, toWorld } from './map'

export interface CampDef {
  /** Map point (x east, y north). */
  c: [number, number]
  pack: Partial<Record<V2Kind, number>>
  levels: [number, number]
}

/**
 * Hutan Pembuka (Tier I, Lv 1 to 3): Imps and Hellhounds, the first camps along the path north of the
 * start clearing. Tebing Berangin (Tier II, Lv 4 to 6): Harpies and Centaurs on the plateau. Rawa
 * Berkabut (Tier III, Lv 7 to 9): Naga, Minotaurs, and the lairs of Medusa and the Chimera. Levels rise
 * with the distance from the start, inside each zone's band.
 */
export const CAMP_DEFS: CampDef[] = [
  { c: [-20, -292], pack: { imp: 4 }, levels: [1, 1] },
  { c: [-44, -384], pack: { imp: 4 }, levels: [1, 1] },
  { c: [30, -300], pack: { imp: 5 }, levels: [1, 2] },
  { c: [-72, -292], pack: { hellhound: 3 }, levels: [1, 2] },
  { c: [72, -358], pack: { hellhound: 3 }, levels: [2, 2] },
  { c: [-112, -330], pack: { imp: 5, hellhound: 1 }, levels: [2, 2] },
  { c: [12, -228], pack: { imp: 4, hellhound: 2 }, levels: [2, 3] },
  { c: [110, -280], pack: { imp: 6 }, levels: [2, 3] },
  { c: [-150, -250], pack: { hellhound: 4 }, levels: [3, 3] },
  { c: [40, -168], pack: { imp: 4, hellhound: 2 }, levels: [3, 3] },
  { c: [286, -70], pack: { harpy: 3 }, levels: [4, 4] },
  { c: [222, -78], pack: { centaur: 2 }, levels: [4, 4] },
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
      const mesh = new THREE.InstancedMesh(b.geometry, b.material, this.targets.length)
      mesh.castShadow = true
      mesh.frustumCulled = false
      this.meshes.push(mesh)
      this.group.add(mesh)
    }
    this.update(0, 0, new THREE.Vector3(1e6, 0, 1e6))
  }

  update(dt: number, t: number, player: THREE.Vector3) {
    this.targets.forEach((imp, i) => {
      const dx = player.x - imp.x
      const dz = player.z - imp.z
      if (dx * dx + dz * dz < 18 * 18) {
        // turn to watch her; the model faces +z
        const want = Math.atan2(dx, dz)
        const d = Math.atan2(Math.sin(want - imp.yaw), Math.cos(want - imp.yaw))
        imp.yaw += d * Math.min(1, dt * 3)
      }
      const bob = Math.sin(t * 3.1 + imp.phase) * 0.05
      this.q.setFromAxisAngle(this.up, imp.yaw)
      this.m.compose(this.v.set(imp.x, imp.y + bob, imp.z), this.q, this.one)
      for (const mesh of this.meshes) mesh.setMatrixAt(i, this.m)
    })
    for (const mesh of this.meshes) mesh.instanceMatrix.needsUpdate = true
  }
}
