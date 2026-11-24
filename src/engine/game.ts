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
