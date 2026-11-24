import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { CAMERA, CHAOS, COMBAT, EFFECTS, MOVE, REVIVE, RITE, V2_KINDS, type AttackSpec, type UnitKind, type V2Kind } from '../game/balance'
import { addShadow, chaosFromDamage, derive, gainXp, xpForUnit, type Derived } from '../game/progression'
import { loadProfile, saveProfile } from '../game/save'
import { SKILLS, skillById } from '../game/skills'
import { Hud } from '../ui/hud'
import { Atmosphere, water } from '../world/atmosphere'
import { Altars } from '../world/altars'
import { Camps } from '../world/camps'
import { addColliders, Forest, scatter } from '../world/forest'
import { heightAt, inWaterRect, PLAY_HALF, SPOTS, toMap, toWorld, WATER_LEVEL, ZONES } from '../world/map'
import { Terrain } from '../world/terrain'
import { Sfx } from './audio'
import { CameraRig, yawTo, type CamPose } from './camera'
import { resolveDefense } from './combat'
import { Fight } from './fight'
import { LightPool, Particles, Rings, ShadowPools } from './fx'
import { Input } from './input'
import { LockOn, lockPoint } from './lockon'
import { idlePose, IlyraModel, loadModel, type IlyraPose } from './models'
import { Obstacles } from './obstacles'
import { COLOR } from './palette'
import { Player, type Ground, type MoveInput } from './player'
import { Projectiles } from './projectiles'
import { Rigs } from './rigs'
import { Spells } from './spells'
import { Telegraphs } from './telegraph'
import { Umbra } from './umbra'
import { shieldShare, Unit, UnitSystem, type DamageKind, type Foe, type UnitHost } from './units'

export type State = 'loading' | 'title' | 'playing' | 'paused'

/** Inputs a ?debug bot can hold instead of the keyboard and mouse; buttons go through `input.press`. */
export interface BotInput {
  x: number
  y: number
  sprint: boolean
  aim: boolean
  /** Turn the camera by this much per second (radians). */
  turn: number
}

export interface AimHit {
  point: THREE.Vector3
  dist: number
  unit: Unit | null
}

const FRAME_SAMPLES = 900
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

export class Game implements UnitHost {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(CAMERA.normal.fov, 16 / 9, CAMERA.near, CAMERA.far)
  readonly input: Input
  readonly rig = new CameraRig()
  readonly player = new Player()
  readonly lockon = new LockOn()
  readonly obstacles = new Obstacles()
  readonly profile = loadProfile().profile
  readonly sfx = new Sfx()
  readonly units: UnitSystem
  readonly fight: Fight
  readonly spells: Spells
  readonly umbra: Umbra
  readonly hud: Hud
  readonly shots: Projectiles
  derived: Derived
  glow!: Particles
  smoke!: Particles
  lights!: LightPool
  rings!: Rings
  pools!: ShadowPools
  telegraphs!: Telegraphs
  rigs!: Rigs
  camps!: Camps
  altars!: Altars
  ilyra!: IlyraModel
  ground!: Ground
  state: State = 'loading'
  /** ?debug: run the simulation this many fixed steps per frame. */
  debugSpeed = 1
  /** ?debug: wait for the GPU after every frame (reads one pixel), so frame times include all GPU work. */
  syncFrames = false
  /** ?debug: when set, the bot drives her instead of the keyboard. */
  bot: BotInput | null = null
  /** ?debug: called at the start of every simulation step, so a bot can react on the exact frame. */
  botThink: ((g: Game, dt: number) => void) | null = null
  /** ?debug: holds her in a pose for the animation check sheet. */
  debugPose: Partial<IlyraPose> | null = null
  /** ?debug: a fixed camera around her (angle from her facing, radians; distance in metres). */
  debugCam: { angle: number; dist: number } | null = null
  /** Game seconds played (simulation time, includes debugSpeed). */
  t = 0
  sensitivity = 1
  onPause: (() => void) | null = null
  readonly counts = { kills: 0, campsCleared: 0, falls: 0, damageTaken: 0, levelUps: 0 }
  /** ?debug: every blow that reached her and how it resolved, for the test bot's report. */
  readonly strikeLog: { t: number; kind: string; strike: string; res: string; angle: number; blocking: boolean; since: number; swing: boolean; rolling: boolean }[] = []
  /** The target of creatures' blows: her feet, her size, and whether she stands. */
  readonly foe: Foe = { pos: new THREE.Vector3(), radius: MOVE.radius, alive: true }

  private readonly debug: boolean
  private readonly composer: EffectComposer
  private readonly bloom: UnrealBloomPass
  private readonly timer = new THREE.Timer()
  private terrain!: Terrain
  private forest!: Forest
  private atmosphere!: Atmosphere
  private pivotY = 0
  private cullIn = 0
  private botDodge = false
  private botLock = false
  private lastFrame = 0
  private readonly frames = new Float32Array(FRAME_SAMPLES)
  private frameCount = 0
  private minClearance = Infinity
  private readonly v = new THREE.Vector3()
  private gpu = ''
  private readonly pixel = new Uint8Array(4)
  private hitstopT = 0
  private trauma = 0
  private hurtGrace = 0
  private calm = 0
  private deadT = 0
  private saveIn = -1
  private readonly pose = idlePose()
  private readonly ray = new THREE.Ray()
  private readonly sphere = new THREE.Sphere()

  constructor(canvas: HTMLCanvasElement, debug: boolean) {
    this.debug = debug
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    // counted over every pass of a frame (shadows, scene, bloom), reset by hand in tick()
    this.renderer.info.autoReset = false
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    const gl = this.renderer.getContext()
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    this.gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown'

    this.input = new Input(canvas)
    this.input.virtualLock = debug
    this.input.onLockChange = (locked) => {
      if (!locked && this.state === 'playing' && !this.debug) this.pause()
    }
    this.sensitivity = this.profile.settings.sensitivity
    this.derived = derive(this.profile.stats, this.profile.level)
    this.applyDerived(true)
    this.units = new UnitSystem(this)
    this.fight = new Fight(this)
    this.spells = new Spells(this)
    this.umbra = new Umbra(this)
    this.hud = new Hud(this)
    this.shots = new Projectiles(this)
    this.scene.add(this.shots.group)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    // One NaN pixel blurred by bloom turns the whole screen black (v1). Zero any that slip through.
    this.composer.addPass(
      new ShaderPass({
        uniforms: { tDiffuse: { value: null } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        // isnan() is optimised away by the D3D compiler behind ANGLE, so test the exponent bits.
        fragmentShader: [
          'uniform sampler2D tDiffuse;',
          'varying vec2 vUv;',
          'bool bad(float v) { return (floatBitsToUint(v) & 0x7f800000u) == 0x7f800000u; }',
          'void main() {',
          '  vec4 c = texture2D(tDiffuse, vUv);',
          '  if (bad(c.r) || bad(c.g) || bad(c.b) || bad(c.a)) c = vec4(0.0);',
          '  gl_FragColor = clamp(c, 0.0, 60000.0);',
          '}',
        ].join('\n'),
      }),
    )
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.5, 0.86)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  // ------------------------------------------------------------ UnitHost

  height(x: number, z: number) {
    return heightAt(x, z)
  }

  blocked(x: number, z: number) {
    return this.ground.blocked(x, z)
  }

  /** A creature's blow on her lands now: dodge, parry, block or hit. */
  strikePlayer(u: Unit, atk: AttackSpec = u.atk) {
    const p = this.player
    if (!p.alive || this.hurtGrace > 0) return
    const strike = atk.strike
    const angle = wrap(yawTo(p.pos.x, p.pos.z, u.pos.x, u.pos.z) - p.facing)
    const res = resolveDefense(this.t, strike, p.invulnerable || this.fight.invulnerable, this.fight.blocking, this.fight.blockPressedAt, angle)
    if (this.debug && this.strikeLog.length < 2000) this.strikeLog.push({ t: this.t, kind: u.kind, strike, res, angle: +angle.toFixed(2), blocking: this.fight.blocking, since: +(this.t - this.fight.blockPressedAt).toFixed(3), swing: !!this.fight.combo.current, rolling: p.dodging })
    const mid = this.v.set((p.pos.x + u.pos.x) / 2, p.pos.y + 1.1, (p.pos.z + u.pos.z) / 2)
    if (res === 'dodge') {
      this.fight.stats.dodged++
      return
    }
    if (res === 'parry') {
      this.fight.stats.parries++
      this.fight.parried()
      this.units.hurt(u, 0, p.pos, COMBAT.parry.stun, 5)
      this.spells.addChaos(4)
      this.sfx.parry()
      this.hitstop(COMBAT.hitstop.parry)
      this.addTrauma(0.15)
      this.glow.emit({ pos: mid, count: 26, color: 0xfff2e0, intensity: 3.2, life: 0.3, size: 0.1, sizeEnd: 0.01, speed: 7, gravity: 8 })
      this.lights.flash(mid, COLOR.chaosHot, 10, 6, 0.2)
      this.hud.parry()
      return
    }
    if (res === 'block') {
      this.fight.stats.blocks++
      this.units.hurt(u, 0, p.pos, 6, 2)
      p.nudge(p.pos.x - u.pos.x, p.pos.z - u.pos.z, 0.35, 0.14)
      this.sfx.clank()
      this.hitstop(COMBAT.hitstop.light)
      this.glow.emit({ pos: mid, count: 10, color: COLOR.rift, intensity: 2.4, life: 0.25, size: 0.08, speed: 4, gravity: 8 })
      return
    }
    if (strike === 'ring') this.fight.stats.hitRing++
    else this.fight.stats.hitLine++
    this.hurtPlayer(u.damage * (atk.damage ?? 1), u.pos)
    if (!p.alive) return
    if (atk.effect === 'petrify' && this.spells.barrierT <= 0) {
      p.petrified = EFFECTS.petrify
      this.fight.reset(true)
      this.hud.message(`${u.spec.name} membatukan Ilyra. Tahan C saat tatapannya penuh, atau pasang Hex Barrier.`, 'chaos')
    }
    if (atk.effect === 'poison') {
      p.poisonT = EFFECTS.poisonTime
      p.poisonDps = u.damage * EFFECTS.poisonShare
    }
  }

  /** A blow between a creature and a shadow. */
  strikeUnit(u: Unit, target: Unit, atk?: AttackSpec) {
    const focus = u.team === 'shadow' && target === u.focus ? 1 + u.focusBonus : 1
    this.hurtUnit(target, u.damage * focus * (atk?.damage ?? 1), u.pos, u.team === 'shadow' ? 4 : 0, 1.5, u.team === 'shadow' ? 'shadow' : 'enemy', 'shadow')
  }

  fire(u: Unit, atk: AttackSpec) {
    this.shots.fire(u, atk)
  }

  summoned(h: Unit) {
    this.pools.open(h.pos, 1 + h.radius * 1.5, 1)
    this.glow.emit({ pos: h.center(), count: 18, color: COLOR.rift, intensity: 2.2, life: 0.6, size: 0.18, speed: 2.5 })
  }

  impact(u: Unit, other: Unit | null, speed: number) {
    this.spells.impact(u, other, speed)
  }

  died(u: Unit) {
    if (u.team === 'shadow') {
      this.umbra.shadowFell(u)
      return
    }
    this.counts.kills++
    this.reward(u)
    this.smoke.emit({ pos: u.pos, count: 6, color: 0x2a2024, life: 1, size: 0.6, sizeEnd: 1.2, speed: 0.8, alpha: 0.5 })
  }

  telegraph(u: Unit) {
    if (u.team !== 'enemy') return
    this.telegraphs.show(u)
    // both kinds have their own sound too, so the warning does not depend on sight alone
    const near = Math.hypot(u.pos.x - this.player.pos.x, u.pos.z - this.player.pos.z) < 30
    if (near) this.sfx.warn(u.spec.strike ?? 'ring')
  }

  clearTelegraph(u: Unit) {
    this.telegraphs?.clear(u)
  }

  // ------------------------------------------------------------ setup

  /** Builds the valley, loads the models and warms the shaders. */
  async init(progress: (step: string) => void) {
    progress('Membentuk lembah')
    await frame()
    this.terrain = new Terrain()
    this.scene.add(this.terrain.group)
    this.atmosphere = new Atmosphere(this.scene)
    this.scene.add(water())
    this.ground = {
      height: heightAt,
      obstacles: this.obstacles,
      blocked: (x, z) => {
        const [mx, my] = toMap(x, z)
        if (Math.abs(mx) > PLAY_HALF || Math.abs(my) > PLAY_HALF) return true
        return inWaterRect(mx, my) && WATER_LEVEL - heightAt(x, z) > MOVE.maxWade
      },
    }
    this.glow = new Particles(5000, 'glow')
    this.smoke = new Particles(1400, 'smoke')
    this.scene.add(this.glow.points, this.smoke.points)
    // every point light is paid for by every lit pixel of the forest, every frame: keep the pool small
    this.lights = new LightPool(this.scene, 4)
    this.rings = new Rings(this.scene, 12)
    this.pools = new ShadowPools(this.scene, 140)
    this.telegraphs = new Telegraphs(this.scene, heightAt)
    progress('Menanam hutan')
    await frame()
    const trees = scatter()
    addColliders(trees, this.obstacles)
    this.forest = new Forest(trees)
    this.scene.add(this.forest.mesh)
    progress('Memanggil Ilyra dan makhluk hutan')
    const [ilyra, ...creatures] = await Promise.all([
      loadModel('./models/ilyra.glb'),
      ...V2_KINDS.map((k) => loadModel(`./models/${k}.glb`)),
      ...V2_KINDS.map((k) => loadModel(`./models/${k}_lod.glb`)),
    ])
    this.ilyra = new IlyraModel(ilyra)
    this.scene.add(this.ilyra.root)
    const models: Partial<Record<UnitKind, THREE.Group>> = {}
    const lods: Partial<Record<UnitKind, THREE.Group>> = {}
    V2_KINDS.forEach((k, i) => {
      models[k] = creatures[i]
      lods[k] = creatures[V2_KINDS.length + i]
    })
    this.rigs = new Rigs(models, lods)
    this.rigs.detail = this.profile.settings.detail
    this.rigs.prepare([...V2_KINDS])
    this.scene.add(this.rigs.group)
    this.camps = new Camps(this)
    this.scene.add(this.camps.group)
    this.altars = new Altars(this)
    this.scene.add(this.altars.group)
    this.spawn(SPOTS.hero[0], SPOTS.hero[1], 0.3, 1)
    progress('Menyiapkan cahaya dan shader')
    await frame()
    this.terrain.prepare(this.camera.position)
    this.forest.cull(this.player.pos.x, this.player.pos.z)
    this.renderer.compile(this.scene, this.camera)
    this.state = 'title'
  }

  /** Puts her at a map point facing a map direction, with the camera behind her. */
  spawn(mx: number, my: number, fx = 0, fy = 1) {
    const [x, z] = toWorld(mx, my)
    this.placeAt(x, z, yawTo(0, 0, fx, -fy))
  }

  /** Puts her at a world point facing `yaw`, with the camera behind her. */
  placeAt(x: number, z: number, yaw: number) {
    this.player.place(x, z, this.ground, yaw)
    this.obstacles.pushOut(this.player.pos, MOVE.radius, MOVE.height)
    this.player.pos.y = heightAt(this.player.pos.x, this.player.pos.z)
    this.rig.yaw = yaw
    this.rig.pitch = (CAMERA.pitch * Math.PI) / 180
    this.rig.aim = 0
    this.rig.lock = 0
    this.rig.frac = 1
    this.pivotY = this.player.pos.y + CAMERA.normal.height
    this.lockon.current = null
    this.place(1 / 60, true)
    this.ilyra.update(0, this.player, 0, this.pose)
  }

  start() {
    this.state = 'playing'
    this.input.capture = true
    this.sfx.start()
    this.sfx.setVolume(this.profile.settings.volume)
    this.hud.show(true)
    this.lastFrame = performance.now()
  }

  pause() {
    if (this.state !== 'playing') return
    this.state = 'paused'
    this.input.capture = false
    this.sfx.suspend()
    this.saveNow()
    this.onPause?.()
  }

  /** A menu (the Ledger, an altar) holds the game without the pause screen. */
  openMenu() {
    if (this.state !== 'playing') return
    this.state = 'paused'
    this.input.capture = false
    this.input.releaseAll()
  resume() {
    if (this.state !== 'paused') return
    this.state = 'playing'
    this.input.capture = true
    this.lastFrame = performance.now()
  }

  run() {
    this.timer.connect(document)
    this.renderer.setAnimationLoop((ts) => {
      this.timer.update(ts)
      this.tick()
    })
  }

  private tick() {
    // Timer.reset() measures with performance.now() while update() gets the frame timestamp; the next
    // delta can come out negative (v1's black-screen bug). Never let time run backwards.
    const dt = Math.min(1 / 30, Math.max(0, this.timer.getDelta()))
    const now = performance.now()
    if (this.state === 'playing') {
      this.frames[this.frameCount % FRAME_SAMPLES] = now - this.lastFrame
      this.frameCount++
      for (let i = 0; i < this.debugSpeed; i++) {
        this.simulate(dt)
        if (i < this.debugSpeed - 1) this.input.endFrame()
      }
    } else if (this.state === 'title') {
      // a slow drift around her while the title is up
      this.rig.yaw += dt * 0.05
      this.place(dt, false)
      this.ilyra.update(dt, this.player, 0)
    }
    this.lastFrame = now
    this.hud.update(dt)
    this.renderer.info.reset()
    this.composer.render(dt)
    if (this.syncFrames) {
      const gl = this.renderer.getContext()
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixel)
    }
    this.input.endFrame()
  }

  private simulate(dt: number) {
    this.t += dt
    const inp = this.input
    const b = this.bot
    const aiming = b ? b.aim : inp.held('Mouse2')
    const move: MoveInput = b
      ? { x: b.x, y: b.y, sprint: b.sprint, dodge: this.botDodge }
      : {
          x: (inp.held('KeyD') ? 1 : 0) - (inp.held('KeyA') ? 1 : 0),
          y: (inp.held('KeyW') ? 1 : 0) - (inp.held('KeyS') ? 1 : 0),
          sprint: inp.held('ShiftLeft') || inp.held('ShiftRight'),
          dodge: inp.pressed('Space'),
        }
    this.botDodge = false
    if (b) this.rig.look(-b.turn * dt / (CAMERA.sensitivity * this.sensitivity), 0, CAMERA.sensitivity * this.sensitivity)
    else this.rig.look(inp.dx, inp.dy, CAMERA.sensitivity * this.sensitivity)

    const targets = this.camps.targets
    const p = this.player
    if (inp.pressed('Mouse1') || this.botLock) this.lockon.toggle(targets, p.pos, this.rig.yaw)
    this.botLock = false
    const cur = this.lockon.current
    let visible = true
    if (cur) {
      const lp = lockPoint(cur)
      const c = this.camera.position
      visible = this.obstacles.sweep(c.x, c.y, c.z, lp.x, lp.y, lp.z, 0) > 0.97
    }
    this.lockon.update(dt, targets, p.pos, b ? 0 : inp.dx, visible)

    const target = this.lockon.current
    const face = target ? yawTo(p.pos.x, p.pos.z, target.x, target.z) : aiming ? this.rig.yaw : null
    p.update(dt, move, this.rig.yaw, face, aiming, this.ground)
    this.place(dt, false, aiming)

    this.cullIn -= dt
    if (this.cullIn <= 0) {
      this.forest.cull(p.pos.x, p.pos.z)
      this.cullIn = 0.5
    }
    this.camps.update(dt, this.t, this.v.set(p.pos.x, p.pos.y, p.pos.z))
    this.ilyra.update(dt, p, this.rig.aim)
    this.hud.zone(ZONES[this.atmosphere.zone])
    this.hud.aim(this.rig.aim > 0.5)
    if (target) {
      const lp = lockPoint(target)
      this.v.set(lp.x, lp.y, lp.z).project(this.camera)
      const w = this.renderer.domElement.clientWidth
      const h = this.renderer.domElement.clientHeight
      this.hud.lock(this.v.z < 1 ? { x: (this.v.x * 0.5 + 0.5) * w, y: (-this.v.y * 0.5 + 0.5) * h } : null)
    } else this.hud.lock(null)
    if (this.debug) this.hud.debug(this.debugText())
  }

  /** Camera, terrain detail, fog and shadows for the current state. */
  private place(dt: number, snap: boolean, aiming = false) {
    const p = this.player
    // the pivot follows her height softly so small bumps in the ground do not shake the view
    const wantY = p.pos.y + CAMERA.normal.height
    this.pivotY = snap ? wantY : this.pivotY + (wantY - this.pivotY) * Math.min(1, dt * 12)
    const pivot = { x: p.pos.x, y: this.pivotY, z: p.pos.z }
    const target = this.lockon.current
    const pose: CamPose = this.rig.update(dt, pivot, aiming, target ? { point: lockPoint(target), height: target.height } : null, this.obstacles, heightAt)
    const c = this.camera
    c.position.set(pose.pos.x, pose.pos.y, pose.pos.z)
    c.lookAt(pose.pos.x + pose.dir.x, pose.pos.y + pose.dir.y, pose.pos.z + pose.dir.z)
    if (Math.abs(c.fov - pose.fov) > 1e-3) {
      c.fov = pose.fov
      c.updateProjectionMatrix()
    }
    const clear = Math.min(this.obstacles.clearance(c.position.x, c.position.y, c.position.z), c.position.y - heightAt(c.position.x, c.position.z))
    if (this.state === 'playing') this.minClearance = Math.min(this.minClearance, clear)
    this.atmosphere.update(dt, this.v.set(p.pos.x, p.pos.y, p.pos.z), c.position, snap)
    this.terrain.update(c.position, snap ? 1000 : 1)
  }

  private resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h, false)
    this.composer.setSize(w, h)
    this.bloom.resolution.set(w / 2, h / 2)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  // ------------------------------------------------------------ measurements for ?debug and the bot

  /** Frame times (ms) of the recent frames while playing, and their median and 95th percentile. */
  frameStats() {
    const n = Math.min(this.frameCount, FRAME_SAMPLES)
    const arr = Array.from(this.frames.slice(0, n)).filter((v) => v > 0).sort((a, b) => a - b)
    const at = (q: number) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(q * arr.length))] : 0)
    return { samples: arr.length, median: at(0.5), p95: at(0.95), gpu: this.gpu }
  }

  resetStats() {
    this.frameCount = 0
    this.frames.fill(0)
    this.minClearance = Infinity
  }

  stats() {
    const info = this.renderer.info
    return {
      ...this.frameStats(),
      minClearance: this.minClearance,
      calls: info.render.calls,
      triangles: info.render.triangles,
      chunks: this.terrain.built,
      trees: this.forest.trees.filter((t) => t.kind !== 'rock' && t.kind !== 'rock_big').length,
      rocks: this.forest.trees.filter((t) => t.kind === 'rock' || t.kind === 'rock_big').length,
      obstacles: this.obstacles.shapes.length,
      t: this.t,
      zone: ZONES[this.atmosphere.zone].name,
      pos: toMap(this.player.pos.x, this.player.pos.z).map((v) => Math.round(v)),
      dodges: this.player.dodges,
      locked: !!this.lockon.current,
      width: this.renderer.domElement.width,
      height: this.renderer.domElement.height,
    }
  }

  dodge() {
    this.botDodge = true
  }

  toggleLock() {
    this.botLock = true
  }

  /** ?debug: the bot's stand-in for a quick sideways mouse flick while locked on. */
  flick(side: number) {
    return this.lockon.switchSide(this.camps.targets, this.player.pos, side)
  }

  /** Imps within this distance of her (for the bot to know when a lock-on can find something). */
  targetsNear(range: number) {
    const p = this.player.pos
    return this.camps.targets.filter((t) => t.alive && Math.hypot(t.x - p.x, t.z - p.z) < range).length
  }

  /** The nearest living Imp (world position), so the bot can look at it before locking on. */
  nearestTarget(range: number) {
    const p = this.player.pos
    let best: { x: number; z: number } | null = null
    let bd = range
    for (const t of this.camps.targets) {
      const d = Math.hypot(t.x - p.x, t.z - p.z)
      if (t.alive && d < bd) {
        bd = d
        best = { x: t.x, z: t.z }
      }
    }
    return best
  }

  private debugText() {
    const s = this.frameStats()
    const i = this.renderer.info.render
    const [mx, my] = toMap(this.player.pos.x, this.player.pos.z)
    return [
      `frame ${s.median.toFixed(1)} ms (p95 ${s.p95.toFixed(1)})`,
      `draw ${i.calls}, segitiga ${(i.triangles / 1000).toFixed(0)}k`,
      `peta ${mx.toFixed(0)}, ${my.toFixed(0)}  ${ZONES[this.atmosphere.zone].name}`,
      `kamera bebas ${this.minClearance.toFixed(2)} m`,
      s.gpu,
    ].join('\n')
  }
}

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
