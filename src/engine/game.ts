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
