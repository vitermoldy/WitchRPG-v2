import { describe, expect, it } from 'vitest'
import { MOVE } from '../src/game/balance'
import { heightMap, inWaterRect, PATHS, SPOTS, WATER_LEVEL, ZONES, zoneAt, zoneWeights } from '../src/world/map'

describe('the forest valley', () => {
  it('lets her walk every path end to end: no cliff steeper than she can climb, no deep water', () => {
