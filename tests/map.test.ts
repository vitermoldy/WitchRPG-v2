import { describe, expect, it } from 'vitest'
import { MOVE } from '../src/game/balance'
import { heightMap, inWaterRect, PATHS, SPOTS, WATER_LEVEL, ZONES, zoneAt, zoneWeights } from '../src/world/map'

describe('the forest valley', () => {
  it('lets her walk every path end to end: no cliff steeper than she can climb, no deep water', () => {
    const step = 1
    for (const line of PATHS) {
      for (let i = 0; i < line.length - 1; i++) {
        const [ax, ay] = line[i]
        const [bx, by] = line[i + 1]
        const len = Math.hypot(bx - ax, by - ay)
        let prev = heightMap(ax, ay)
        for (let d = step; d <= len; d += step) {
          const x = ax + ((bx - ax) * d) / len
          const y = ay + ((by - ay) * d) / len
          const h = heightMap(x, y)
          const rise = h - prev
          expect(rise, `path ${line[0]} at ${x.toFixed(0)}, ${y.toFixed(0)}`).toBeLessThanOrEqual(MOVE.maxSlope * step)
          if (inWaterRect(x, y)) expect(WATER_LEVEL - h, `water at ${x.toFixed(0)}, ${y.toFixed(0)}`).toBeLessThanOrEqual(MOVE.maxWade)
