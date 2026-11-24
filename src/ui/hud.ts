import type { Zone } from '../world/map'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

/** Phase 1 HUD: the zone banner, the lock-on mark, the aim dot, a control hint and the debug readout. */
export class Hud {
  private readonly root = $('hud')
  private readonly banner = $('zone-banner')
  private readonly bannerName = $('zone-name')
  private readonly bannerTier = $('zone-tier')
