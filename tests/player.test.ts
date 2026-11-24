import { describe, expect, it } from 'vitest'
import { MOVE } from '../src/game/balance'
import { CYL, Obstacles } from '../src/engine/obstacles'
import { Player, type Ground, type MoveInput } from '../src/engine/player'

const idle: MoveInput = { x: 0, y: 0, sprint: false, dodge: false }
const flat: Ground = { height: () => 0, obstacles: null, blocked: () => false }

function run(p: Player, input: MoveInput, seconds: number, g = flat, camYaw = 0) {
  const dt = 1 / 120
  for (let t = 0; t < seconds; t += dt) {
    p.update(dt, input, camYaw, null, false, g)
    input = { ...input, dodge: false }
  }
}

describe('Ilyra on foot', () => {
  it('moves the way the camera looks', () => {
    const p = new Player()
    run(p, { ...idle, y: 1 }, 1)
    // camera yaw 0 looks north (-z)
    expect(p.pos.z).toBeLessThan(-3.5)
    expect(Math.abs(p.pos.x)).toBeLessThan(1e-6)
    const q = new Player()
    run(q, { ...idle, x: 1 }, 1, flat, Math.PI / 2)
    // camera turned left to face west: its right is north
    expect(q.pos.z).toBeLessThan(-3.5)
  })

  it('jogs at 4.4 m/s and sprints at 7 m/s', () => {
    const p = new Player()
    run(p, { ...idle, y: 1 }, 2)
    expect(p.speed).toBeCloseTo(MOVE.jog, 1)
    run(p, { ...idle, y: 1, sprint: true }, 2)
    expect(p.speed).toBeCloseTo(MOVE.sprint, 1)
  })

  it('rolls 4.2 m in 0.42 s, untouchable from 0.04 s to 0.32 s', () => {
    const p = new Player()
    const dt = 1 / 240
    const seen: [number, boolean][] = []
    p.update(dt, { ...idle, x: 1, dodge: true }, 0, null, false, flat)
    while (p.dodging) {
      seen.push([p.dodgeT, p.invulnerable])
      p.update(dt, { ...idle, x: 1 }, 0, null, false, flat)
    }
    expect(p.pos.x).toBeGreaterThan(MOVE.dodge.distance * 0.95)
    expect(p.pos.x).toBeLessThan(MOVE.dodge.distance * 1.08)
    for (const [t, inv] of seen) {
      expect(inv).toBe(t >= MOVE.dodge.iframeStart && t <= MOVE.dodge.iframeEnd)
    }
    expect(seen.some(([, inv]) => inv)).toBe(true)
  })

  it('steps back when she rolls with no direction held', () => {
    const p = new Player()
    p.facing = 0
    run(p, { ...idle, dodge: true }, 0.6)
    // facing north, a backstep goes south (+z)
    expect(p.pos.z).toBeGreaterThan(3.5)
  })

