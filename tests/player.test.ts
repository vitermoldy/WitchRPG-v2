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
