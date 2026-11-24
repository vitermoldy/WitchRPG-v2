import * as THREE from 'three'
import { CHAOS, UNITS, type UnitKind } from '../game/balance'
import type { Zone } from '../world/map'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

/** Phase 1 HUD: the zone banner, the lock-on mark, the aim dot, a control hint and the debug readout. */
export class Hud {
  private readonly root = $('hud')
  private readonly banner = $('zone-banner')
  private readonly bannerName = $('zone-name')
  private readonly bannerTier = $('zone-tier')
  private readonly lockMark = $('lock-mark')
  private readonly aimDot = $('aim-dot')
  private readonly hint = $('hint')
  private readonly debugEl = $('debug')
  private bannerTime = 0
  private hintTime = 0
  private zoneKey = ''

  show(on: boolean) {
    this.root.hidden = !on
    if (on && this.hintTime === 0) this.hintTime = 14
  }

  zone(z: Zone) {
    if (z.key === this.zoneKey) return
    this.zoneKey = z.key
    this.bannerName.textContent = z.name
    this.bannerTier.textContent = `Tier ${z.tier}, makhluk Lv ${z.levels[0]} sampai ${z.levels[1]}`
    this.banner.classList.add('show')
    this.bannerTime = 3.6
  }

  /** Screen position of the locked target in pixels, or null when nothing is locked. */
  lock(at: { x: number; y: number } | null) {
    if (!at) {
      this.lockMark.classList.remove('show')
      return
    }
    this.lockMark.classList.add('show')
    this.lockMark.style.transform = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px)`
  }

  aim(on: boolean) {
    this.aimDot.classList.toggle('show', on)
  }

  debug(text: string | null) {
    this.debugEl.hidden = text === null
    if (text !== null) this.debugEl.textContent = text
  }

  update(dt: number) {
    if (this.bannerTime > 0) {
      this.bannerTime -= dt
      if (this.bannerTime <= 0) this.banner.classList.remove('show')
    }
    if (this.hintTime > 0) {
      this.hintTime -= dt
      this.hint.classList.toggle('show', this.hintTime > 0)
    }
  }
}
