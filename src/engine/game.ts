import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { CAMERA, MOVE } from '../game/balance'
import { derive } from '../game/progression'
import { loadProfile } from '../game/save'
import { Hud } from '../ui/hud'
import { Atmosphere, water } from '../world/atmosphere'
import { Camps } from '../world/camps'
import { addColliders, Forest, scatter } from '../world/forest'
import { heightAt, inWaterRect, PLAY_HALF, SPOTS, toMap, toWorld, WATER_LEVEL, ZONES } from '../world/map'
import { Terrain } from '../world/terrain'
import { CameraRig, yawTo, type CamPose } from './camera'
import { Input } from './input'
import { LockOn, lockPoint } from './lockon'
import { IlyraModel, loadModel } from './models'
import { Obstacles } from './obstacles'
import { Player, type Ground, type MoveInput } from './player'

export type State = 'loading' | 'title' | 'playing' | 'paused'

/** Inputs a ?debug bot can hold instead of the keyboard and mouse. */
export interface BotInput {
  x: number
  y: number
  sprint: boolean
  aim: boolean
  /** Turn the camera by this much per second (radians). */
  turn: number
}

const FRAME_SAMPLES = 900

export class Game {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(CAMERA.normal.fov, 16 / 9, CAMERA.near, CAMERA.far)
  readonly input: Input
  readonly hud = new Hud()
  readonly rig = new CameraRig()
  readonly player = new Player()
  readonly lockon = new LockOn()
  readonly obstacles = new Obstacles()
  readonly profile = loadProfile().profile
  state: State = 'loading'
  /** ?debug: run the simulation this many fixed steps per frame. */
  debugSpeed = 1
  /** ?debug: wait for the GPU after every frame (reads one pixel), so frame times include all GPU work. */
  syncFrames = false
  /** ?debug: when set, the bot drives her instead of the keyboard. */
  bot: BotInput | null = null
  /** Game seconds played (simulation time, includes debugSpeed). */
  t = 0
  sensitivity = 1
  onPause: (() => void) | null = null

  private readonly debug: boolean
  private readonly composer: EffectComposer
  private readonly bloom: UnrealBloomPass
  private readonly timer = new THREE.Timer()
  private terrain!: Terrain
  private forest!: Forest
  private atmosphere!: Atmosphere
  private camps!: Camps
  private ilyra!: IlyraModel
  private ground!: Ground
  private pivotY = 0
  private cullIn = 0
  private botDodge = false
  private botLock = false
  private lastFrame = 0
  private readonly frames = new Float32Array(FRAME_SAMPLES)
  private frameCount = 0
  /** Smallest distance between the camera and any trunk, crown, rock or the ground since the last reset. */
  private minClearance = Infinity
  private readonly v = new THREE.Vector3()
  private gpu = ''
  private readonly pixel = new Uint8Array(4)

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
    this.player.speedMult = derive(this.profile.stats, this.profile.level).speedMult
    this.player.dodgeDistance = derive(this.profile.stats, this.profile.level).dodgeDistance

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

  /** Builds the valley, loads the models and warms the shaders. */
  async init(progress: (step: string) => void) {
    progress('Membentuk lembah')
    await frame()
    this.terrain = new Terrain()
    this.scene.add(this.terrain.group)
    this.atmosphere = new Atmosphere(this.scene)
    this.scene.add(water())
    progress('Menanam hutan')
    await frame()
    const trees = scatter()
    addColliders(trees, this.obstacles)
    this.forest = new Forest(trees)
    this.scene.add(this.forest.mesh)
    progress('Memanggil Ilyra')
    const [ilyra, imp] = await Promise.all([loadModel('./models/ilyra.glb'), loadModel('./models/imp.glb')])
    this.ilyra = new IlyraModel(ilyra)
    this.scene.add(this.ilyra.root)
    this.camps = new Camps(imp, this.obstacles)
    this.scene.add(this.camps.group)
    this.ground = {
      height: heightAt,
      obstacles: this.obstacles,
      blocked: (x, z) => {
        const [mx, my] = toMap(x, z)
        if (Math.abs(mx) > PLAY_HALF || Math.abs(my) > PLAY_HALF) return true
        return inWaterRect(mx, my) && WATER_LEVEL - heightAt(x, z) > MOVE.maxWade
      },
    }
    this.spawn(SPOTS.hero[0], SPOTS.hero[1], 0.86, 0.5)
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
    const yaw = yawTo(0, 0, fx, -fy)
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
    this.ilyra.update(0, this.player, 0)
  }

  start() {
    this.state = 'playing'
    this.input.capture = true
    this.hud.show(true)
    this.lastFrame = performance.now()
  }

  pause() {
    if (this.state !== 'playing') return
    this.state = 'paused'
    this.input.capture = false
    this.onPause?.()
  }

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

