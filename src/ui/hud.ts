import * as THREE from 'three'
import { CHAOS, UNITS, type UnitKind } from '../game/balance'
import { xpToNext } from '../game/progression'
import type { Game } from '../engine/game'
import type { Zone } from '../world/map'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

type Tone = 'info' | 'chaos' | 'umbra' | 'level'

/** How to fight each mini-boss, under its bar. */
const BOSS_HINT: Partial<Record<UnitKind, string>> = {
  medusa: 'Tatapannya membatukan: tahan C saat lingkarannya penuh, atau pasang Hex Barrier.',
  chimera: 'Api di depan, seruduk kambing dari jauh, sengat ular di belakang. Ia memanggil Imp.',
}

/**
 * The fight overlay, kept to the screen edges: her vitals and Chaos on the left, skills in the middle,
 * the army on the right, creature bars over the creatures, prompts under the middle of the view.
 * Writes to the DOM only when a value changes.
 */
export class Hud {
  private readonly g: Game
  private readonly root = $('hud')
  private readonly banner_ = $('zone-banner')
  private readonly bannerName = $('zone-name')
  private readonly bannerTier = $('zone-tier')
  private readonly lockMark = $('lock-mark')
  private readonly aimEl = $('aim')
  private readonly hitmark = $('hitmark')
  private readonly hint = $('hint')
  private readonly debugEl = $('debug')
  private readonly feed = $('feed')
  private readonly bigBanner = $('banner')
  private readonly prompt = $('prompt')
  private readonly bars = $('hpbars')
  private readonly wheel = $('wheel')
  private readonly army = $('army-slots')
  private readonly hurtVeil = $('hurt-veil')
  private readonly cache = new Map<string, string>()
  private readonly pool: HTMLDivElement[] = []
  private readonly v = new THREE.Vector3()
  private bannerTime = 0
  private bigBannerTime = 0
  private hintTime = 0
  private hitTime = 0
  private hurt = 0
  private manaFlash = 0
  private zoneKey = ''

  constructor(g: Game) {
    this.g = g
  }

  show(on: boolean) {
    this.root.hidden = !on
    if (on && this.hintTime === 0) this.hintTime = 16
  }

  private set(id: string, key: 'text' | 'transform' | 'class', value: string) {
    const k = id + key
    if (this.cache.get(k) === value) return
    this.cache.set(k, value)
    const el = $(id)
    if (key === 'text') el.textContent = value
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
