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
