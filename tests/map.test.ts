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
          prev = h
        }
      }
    }
  })

  it('starts her and every previz spot on dry ground', () => {
    for (const [name, [x, y]] of Object.entries(SPOTS)) {
      expect(heightMap(x, y), name).toBeGreaterThan(WATER_LEVEL + 0.3)
    }
  })

  it('blends zones that add up to one and name the zone at its own centre', () => {
    for (const z of ZONES) {
      const w = zoneWeights(z.c[0], z.c[1])
      expect(w.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 5)
      expect(zoneAt(z.c[0], z.c[1]).key).toBe(z.key)
    }
