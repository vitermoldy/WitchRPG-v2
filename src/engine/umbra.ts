import * as THREE from 'three'
import { RANKS, RITE, UNITS } from '../game/balance'
import { addShadow, hasUpgrade, isUnlocked, riteBlock, riteChance, type ShadowRecord } from '../game/progression'
import type { Game } from './game'
import { COLOR } from './palette'
import type { Unit } from './units'

export type WheelChoice = 'follow' | 'attack' | 'hold' | 'swap'

export interface UmbraInput {
  riteHeld: boolean
  ritePressed: boolean
  toggle: boolean
  wheelHeld: boolean
  wheelPressed: boolean
  dx: number
  dy: number
}

/** Soldiers of one call that each get their own pool; the rest rise out of the wide spill. */
const POOLS_PER_CALL = 90
/** Shadows further than this from her (and not holding a spot) are pulled back to her side. */
const LEASH = 45

/** How far from her the outer rank of an army this big stands (see the formation). */
function ringRadius(count: number) {
  let ring = 0
  let left = count
  while (left > 8 + ring * 4) {
    left -= 8 + ring * 4
    ring++
  }
  return 3.4 + ring * 1.8
}

interface Call {
  at: number
  rec: ShadowRecord
