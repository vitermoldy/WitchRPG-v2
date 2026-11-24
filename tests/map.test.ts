import { describe, expect, it } from 'vitest'
import { MOVE } from '../src/game/balance'
import { heightMap, inWaterRect, PATHS, SPOTS, WATER_LEVEL, ZONES, zoneAt, zoneWeights } from '../src/world/map'

describe('the forest valley', () => {
