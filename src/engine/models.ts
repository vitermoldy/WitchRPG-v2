import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MOVE } from '../game/balance'
import { COLOR } from './palette'
import type { Player } from './player'

const loader = new GLTFLoader()

/** Loads a model exported by previz/blender/export_glb.py. */
export async function loadModel(url: string): Promise<THREE.Group> {
  const gltf = await loader.loadAsync(url)
  gltf.scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    m.castShadow = true
    const mat = m.material as THREE.MeshStandardMaterial
    // emission strengths from Blender are tuned for its renderer; bloom here needs far less
    if (mat.emissive && mat.emissiveIntensity > 0 && mat.emissive.getHex() !== 0) mat.emissiveIntensity = Math.min(mat.emissiveIntensity, 3.5)
  })
  return gltf.scene
}

/** Bakes a static model into one geometry per material, for instanced crowds. */
export function bakeByMaterial(root: THREE.Object3D): { geometry: THREE.BufferGeometry; material: THREE.Material }[] {
  root.updateMatrixWorld(true)
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>()
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const g = m.geometry.clone()
    g.applyMatrix4(m.matrixWorld)
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
    const mat = m.material as THREE.Material
    if (!groups.has(mat)) groups.set(mat, [])
    groups.get(mat)!.push(g.index ? g.toNonIndexed() : g)
  })
  return [...groups].map(([material, geos]) => ({ geometry: mergeGeometries(geos), material }))
}

const rad = (d: number) => (d * Math.PI) / 180

/**
 * Ilyra's model with procedural motion on its named parts: the walk cycle of the previz animatic,
 * a forward roll for the dodge, a raised left hand while aiming, breathing when still.
 */
export class IlyraModel {
  readonly root = new THREE.Group()
  private readonly pivot = new THREE.Group()
  private readonly parts: Record<string, THREE.Object3D> = {}
  private readonly sigils: THREE.MeshStandardMaterial[] = []
  private t = 0

  constructor(model: THREE.Group) {
    this.root.name = 'ilyra'
    // the roll turns about her hips, not her feet
    this.pivot.position.y = 0.9
    model.position.y -= 0.9
    this.pivot.add(model)
    this.root.add(this.pivot)
    model.traverse((o) => {
      this.parts[o.name] = o
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (m && m.name.includes('sigil_staff') && !this.sigils.includes(m)) this.sigils.push(m)
    })
    for (const [side, col] of [['L', COLOR.chaos], ['R', COLOR.umbra]] as const) {
      const hand = this.parts['hand_' + side]
      if (!hand) continue
      const l = new THREE.PointLight(col, 2.2, 5, 2)
      l.position.set(0, -0.06, 0.04)
      hand.add(l)
    }
  }

  private rot(name: string, x: number, y = 0, z = 0) {
    const p = this.parts[name]
    if (p) p.rotation.set(rad(x), rad(y), rad(z))
  }

  update(dt: number, p: Player, aim: number) {
    this.t += dt
    this.root.position.set(p.pos.x, p.pos.y, p.pos.z)
    // her yaw faces -z at 0; the model faces +z
    this.root.rotation.y = p.facing + Math.PI
    const amp = Math.min(1.6, p.speed / MOVE.jog)
    const sprint = Math.max(0, (p.speed - MOVE.jog) / (MOVE.sprint - MOVE.jog))
    const s = Math.sin(p.stride)
    const breath = Math.sin(this.t * 2.2) * (1 - Math.min(1, amp))
