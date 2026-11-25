import { describe, expect, it } from 'vitest'
// @ts-expect-error the server is plain JavaScript without type declarations
import { cleanProfile } from '../server/app.js'
import { V2_KINDS } from '../src/game/balance'
import { ALTARS } from '../src/world/map'
import { SKILLS } from '../src/game/skills'
import { addShadow, newProfile } from '../src/game/progression'

const NOW = Date.parse('2026-11-26T00:00:00Z')

describe('the server checks a witch before it keeps her', () => {
  it('takes a fresh witch as she is', () => {
    const p = cleanProfile({ ...newProfile(), updatedAt: '2026-11-25T10:00:00Z' }, NOW)
    expect(p.error).toBeUndefined()
    expect(p.level).toBe(1)
    expect(p.world).toEqual({ altars: ['pembuka'], last: 'pembuka' })
    expect(p.settings.detail).toBe(20)
  })

  it('knows every creature that can be raised, every skill and every altar of the game', () => {
    const p = newProfile()
    p.level = 12
    for (const kind of V2_KINDS) addShadow(p, kind, 5)
    for (const s of SKILLS) p.upgrades[s.id] = true
    p.world = { altars: ALTARS.map((a) => a.key), last: 'bara' }
    const c = cleanProfile(p, NOW)
    expect(c.error).toBeUndefined()
    expect(c.shadows.map((s: { kind: string }) => s.kind)).toEqual(V2_KINDS)
    expect(c.upgrades.sort()).toEqual(SKILLS.map((s) => s.id).sort())
    expect(c.world.altars.sort()).toEqual(ALTARS.map((a) => a.key).sort())
    expect(c.world.last).toBe('bara')
