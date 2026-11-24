import * as THREE from 'three'
import type { Target } from '../engine/lockon'
import { bakeByMaterial } from '../engine/models'
import type { Obstacles } from '../engine/obstacles'
import { heightMap, SPOTS, toWorld } from './map'

/**
 * Phase 1 creatures: packs of Imps standing in Hutan Pembuka so the camera and lock-on have
