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
