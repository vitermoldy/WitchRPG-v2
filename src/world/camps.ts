import * as THREE from 'three'
import type { Target } from '../engine/lockon'
import { bakeByMaterial } from '../engine/models'
import type { Obstacles } from '../engine/obstacles'
import { heightMap, SPOTS, toWorld } from './map'

/**
 * Phase 1 creatures: packs of Imps standing in Hutan Pembuka so the camera and lock-on have
 * something to frame. They watch Ilyra but do not fight yet (that is phase 2).
 */
