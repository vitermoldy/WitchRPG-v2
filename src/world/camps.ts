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
  { c: [250, 30], pack: { harpy: 3, centaur: 1 }, levels: [4, 5] },
  { c: [302, -6], pack: { centaur: 2, harpy: 1 }, levels: [5, 5] },
  { c: [360, 10], pack: { harpy: 4 }, levels: [5, 5] },
  { c: [336, -128], pack: { harpy: 3, centaur: 1 }, levels: [5, 6] },
  { c: [392, -62], pack: { centaur: 3 }, levels: [6, 6] },
  // Rawa Berkabut (Tier III, Lv 7 to 9): Naga in the swamp, Minotaurs on the drier ground, two lairs
  { c: [-140, -70], pack: { naga: 3 }, levels: [7, 7] },
  { c: [-222, -42], pack: { naga: 2, minotaur: 1 }, levels: [7, 8] },
  { c: [-252, 40], pack: { minotaur: 2 }, levels: [8, 8] },
  { c: [-300, 120], pack: { naga: 4 }, levels: [8, 8] },
  { c: [-200, 108], pack: { minotaur: 1, naga: 2 }, levels: [8, 9] },
  { c: [-332, 30], pack: { medusa: 1, naga: 2 }, levels: [9, 9] },
  { c: [-252, 190], pack: { chimera: 1 }, levels: [9, 9] },
]

export interface Camp {
  def: CampDef
  /** Centre on the ground (world). */
  pos: THREE.Vector3
  state: 'idle' | 'active' | 'cleared'
  units: Unit[]
  respawnAt: number
  roused: boolean
}

const STONES = 7

/**
 * The creature camps: they wake when she comes near, rouse when she or a shadow comes close, walk home
 * when she runs, clear when every creature has fallen, and stand again later out of her sight.
 * A ring of stones with amber shards marks each camp; the shards go dark while it is cleared.
 */
export class Camps {
  readonly camps: Camp[]
  readonly group = new THREE.Group()
  private readonly g: Game
  private readonly shards: THREE.InstancedMesh
  private readonly lit = new THREE.Color(COLOR.rift).multiplyScalar(2.2)
  private readonly dark = new THREE.Color(0x3a2a20)
  private readonly c = new THREE.Color()
  private time = 0
  /** The Minotaur's shield is explained once, the first time a pack with one is roused. */
  private toldShield = false

  constructor(g: Game) {
    this.g = g
    this.group.name = 'camps'
    this.camps = CAMP_DEFS.map((def) => {
      const [x, z] = toWorld(def.c[0], def.c[1])
      return { def, pos: new THREE.Vector3(x, heightMap(def.c[0], def.c[1]), z), state: 'idle', units: [], respawnAt: 0, roused: false }
    })
    const stoneGeo = new THREE.DodecahedronGeometry(0.45, 0)
    const stones = new THREE.InstancedMesh(stoneGeo, new THREE.MeshStandardMaterial({ color: 0x3b3633, roughness: 0.95 }), this.camps.length * STONES)
    const shardGeo = new THREE.OctahedronGeometry(0.16, 0)
    shardGeo.scale(1, 2.4, 1)
    this.shards = new THREE.InstancedMesh(shardGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), this.camps.length * STONES)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    let i = 0
    for (const camp of this.camps) {
      for (let k = 0; k < STONES; k++, i++) {
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
