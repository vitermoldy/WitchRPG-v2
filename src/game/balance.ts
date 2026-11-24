// Every tuning number lives here. Values come from the GDD tables and are starting points for
// playtesting, not final numbers.

/** Third-person movement on foot. No free jump or flight in v2: Space dodges. */
export const MOVE = {
  /** Default pace with WASD, and with Shift held. */
  jog: 4.4,
  sprint: 7.0,
  /** Speed changes are deliberately slow to start and quick to stop: weight without sliding. */
  accel: 16,
  decel: 22,
  /** How fast she turns toward the way she moves (radians per second). */
  turn: 11,
  radius: 0.38,
  height: 1.7,
  gravity: 22,
  /** Steepest slope she can walk up, as rise over run; the cliffs of Tebing Berangin are steeper. */
  maxSlope: 1.0,
  /** Deepest water she wades into; Danau Hitam and the swamp pools are deeper. */
  maxWade: 0.9,
  dodge: {
    distance: 4.2,
    time: 0.42,
    /** She cannot be hit between these two moments of the roll (seconds from its start). */
    iframeStart: 0.04,
    iframeEnd: 0.32,
    cooldown: 0.25,
  },
  dodgePerAgi: 0.05,
  interactRange: 3,
} as const

/**
 * Over-the-right-shoulder camera, numbers settled in the phase 0 previz (previz/PREVIZ.md).
 * fov is vertical, as PerspectiveCamera.fov counts it. height is the pivot above her feet.
 */
export const CAMERA = {
  normal: { dist: 3.4, shoulder: 0.8, height: 1.6, fov: 50 },
  aim: { dist: 2.0, shoulder: 0.65, height: 1.6, fov: 40 },
  pitch: -6,
  pitchMin: -55,
  pitchMax: 62,
  /** Rate the camera blends between normal and aim (1/s). */
  blend: 9,
  /** Radius of the sphere swept from the pivot to the camera; nothing may come closer. */
  radius: 0.24,
  /** Rate the camera eases back out after an obstacle stops blocking it (1/s). */
  release: 4,
  near: 0.1,
  far: 1200,
  sensitivity: 0.0022,
} as const

export const LOCKON = {
  range: 30,
  /** A locked target further than this, or hidden this long, lets go. */
  keepRange: 40,
  lostTime: 1.5,
  /** Half-angle in front of the camera a new target is picked from (radians). */
  cone: 0.95,
  /** Mouse travel (px) in one frame that switches to the next target on that side. */
  flick: 38,
  /** Target point sits at 2/3 of the width and 1/3 of the height from the top. */
  thirdX: 1 / 3,
  thirdY: 1 / 3,
  /** Targets taller than this pull the camera back and widen the view a little. */
  bigHeight: 6,
  pullback: 1.6,
  fovBoost: 6,
  turn: 7,
} as const

export const PLAYER = {
  baseHp: 100,
  hpPerVit: 10,
  baseMana: 100,
  manaPerSpr: 5,
  manaRegen: 7,
  manaRegenPerSpr: 0.04,
  damagePerHex: 0.02,
  /** The Ledger steadies her Chaos as she grows: +5% damage and +8 HP per level. */
  damagePerLevel: 0.05,
  hpPerLevel: 8,
  speedPerAgi: 0.01,
  hurtInvuln: 0.25,
} as const

export const CHAOS = {
  max: 100,
  perDamageDealt: 0.05,
  perDamageTaken: 0.45,
  overloadTime: 12,
  overloadDamage: 1.5,
  backlashTime: 3,
  backlashHpLoss: 0.1,
} as const

export const SPELL = {
  // v2: a bolt also fills the stun meter and knocks a hovering Harpy down for `down` seconds
  bolt: { damage: 12, mana: 0, cooldown: 0.4, speed: 48, life: 1.6, radius: 0.28, spreadDamage: 6, spreadAngle: 0.07, stun: 6, down: 2.5 },
  grip: { manaPerSec: 4, maxMass: 500, range: 26, holdDistance: 6.5, throwSpeed: 30, heavyThrowSpeed: 18, aimCone: 0.07, flight: 0.9, flightGravity: 0.12 },
  impact: { coefficient: 0.14, exponent: 0.6, minSpeed: 6 },
  burst: { damage: 40, mana: 30, cooldown: 8, radius: 8, radiusUpgrade: 2, range: 24, push: 14, lift: 6 },
  snare: { mana: 25, cooldown: 12, radius: 6, duration: 6, durationUpgrade: 2, slow: 0.4, vulnerability: 0.25, range: 24 },
  barrier: { mana: 20, cooldown: 15, duration: 3, absorb: 150, absorbUpgrade: 50, blastRadius: 6, blastDamage: 25, push: 12 },
  warp: { mana: 60, cooldown: 30, radius: 10, duration: 5, durationUpgrade: 2, range: 26, liftHeight: 3.6, reflectDamage: 1.6 },
} as const

export const RITE = {
  window: 20,
  range: 10,
  castTime: 1.5,
  castTimeUpgraded: 1,
  mana: 40,
  /** Holding R near several glowing bodies raises them all in one cast; each extra body costs this much more mana. */
  massRadius: 12,
  massManaPerExtra: 8,
  /** The Shadow Room has no slots; this only guards the save from running away. */
  maxShadows: 2000,
  /** A fallen shadow can be called again after this many seconds. */
  reform: 45,
  summonCooldown: 2.5,
  /** Each UMB point above 5 makes every shadow 2% tougher and stronger. */
  powerPerUmb: 0.02,
  /** How many shadows stand on the field at once. A setting: more costs frame rate. */
  /** Shadows nearest the camera drawn with their own animated model; the rest are drawn as one crowd. */
  // v2: 20 by default (v1: 40); its GLB creatures cost about ten times v1's procedural ones per animated shadow
  detail: { default: 20, min: 10, max: 120 },
  shadowXpShare: 0.3,
  minChance: 0.1,
  maxChance: 0.9,
  swapCooldown: 10,
  swapCooldownUpgraded: 6,
  focusBonus: 0.2,
  plainCorpseTime: 6,
} as const

export const XP = {
  base: 80,
  exponent: 1.5,
  perEnemyLevel: 10,
  perBossLevel: 15,
  statPointsPerLevel: 3,
  skillPointsPerLevel: 1,
  startStat: 5,
  maxLevel: 30,
  /**
   * The GDD's curve covers Lv 1 to 9. Above that each level costs this much more per level past 9,
   * so Tier IV and V take a few Rifts per level instead of one Rift for five.
   */
  lateSteep: 0.5,
} as const

export type RankId = 'prajurit' | 'ksatria' | 'jenderal' | 'marsekal'

export const RANKS: Record<RankId, { label: string; base: number }> = {
  prajurit: { label: 'Prajurit', base: 0.6 },
  ksatria: { label: 'Ksatria', base: 0.45 },
  jenderal: { label: 'Jenderal', base: 0.3 },
  marsekal: { label: 'Marsekal', base: 0.15 },
}

export type UnitKind =
  | 'husk' | 'hound' | 'spitter' | 'warden' | 'riftlord' | 'hollow' | 'harrier' | 'bombard'
  | 'imp' | 'hellhound' | 'harpy' | 'centaur' | 'naga' | 'minotaur' | 'medusa' | 'chimera'

/** v2 creatures of the forest; the v1 kinds above stay for the v1 formula tests and later phases. */
export const V2_KINDS = ['imp', 'hellhound', 'harpy', 'centaur', 'naga', 'minotaur', 'medusa', 'chimera'] as const
export type V2Kind = (typeof V2_KINDS)[number]

/**
 * One attack of a v2 creature. ring: a slow amber circle where it lands, blockable and parryable.
 * line: a fast flashing band along its path, only a roll avoids it. A creature with several attacks
 * picks one that fits the distance (and `behind` ones only when she is behind it).
 */
export interface AttackSpec {
  name: string
  strike: 'ring' | 'line'
  windup: number
  recover: number
  /** Starts when the target is within this reach (m), and not closer than minRange. */
  range: number
  minRange?: number
  /** Multiplier on the creature's damage. */
  damage?: number
  lungeSpeed?: number
  lungeTime?: number
  /** Radius of the circle a ring attack lands on (default 1.4 m). */
  ring?: number
  /** The circle lies this far in front of the creature (a breath) instead of on her. */
  ahead?: number
  /** Fires a projectile instead of lunging: an arrow along the line, or a glob onto the circle. */
  shot?: { speed: number; gravity: number; radius: number }
  /** What a landed blow does besides damage. petrify: she cannot move or act. poison: damage over time. */
  effect?: 'petrify' | 'poison'
  /** Used only when she is behind the creature (the Chimera's snake tail). */
  behind?: boolean
  /** Seconds before this attack can be used again. */
  cooldown?: number
}

/** What petrifying and poison do to her. */
export const EFFECTS = { petrify: 2.2, poisonTime: 4, poisonShare: 0.15 } as const

export interface UnitSpec {
  name: string
  rank: RankId
  hp: number
  damage: number
  speed: number
  radius: number
  height: number
  mass: number
  attackRange: number
  windup: number
  recover: number
  cooldown: number
  lungeSpeed?: number
  lungeTime?: number
  /** Fires globs instead of hitting in melee. `blast`: the glob bursts over this radius where it lands. */
  shot?: { speed: number; gravity: number; radius: number; keepAway: number; blast?: number }
  /** Flies: hovers this high over the ground and dives at its target instead of walking. */
  fly?: { height: number }
  /** Share of damage a raised shield stops when hit from the front. */
  shield?: number
  /** Ground slam: everything of the other side inside this radius is hit. */
  slam?: number
  /** Calls husks out of the Rift every few seconds. */
  summon?: { every: number; count: number; max: number }
  /** Too big to be lifted or flipped by Reality Warp. */
  anchored?: boolean
  /** v2: how its attack is announced. ring: slow amber pulse, can be blocked or parried. line: fast amber flash, must be dodged. */
  strike?: 'ring' | 'line'
  /** v2: stun meter size; heavy blows, parries, bolts and the thrown staff fill it. */
  stun?: number
  /** v2: circles to her side before it attacks. */
  flank?: boolean
  /** v2: its attacks; without them it has one attack made from the fields above. */
  attacks?: AttackSpec[]
  /** v2: keeps this far from her while it shoots, backing off when she comes closer. */
  keepAway?: number
  /** v2: dives out of reach for this many seconds when hurt, and comes up a few metres away. */
  dive?: number
  /** v2: the helpers its summons call. */
  summonKind?: UnitKind
  /** v2: a mini-boss, with the big health bar at the top of the screen. */
  boss?: boolean
}

export const UNITS: Record<UnitKind, UnitSpec> = {
  husk: {
    name: 'Husk',
    rank: 'prajurit',
    hp: 40,
    damage: 10,
    speed: 3.1,
    radius: 0.45,
    height: 1.8,
    mass: 70,
    attackRange: 1.7,
    windup: 0.55,
    recover: 0.8,
    cooldown: 1.3,
  },
  hound: {
    name: 'Rift Hound',
    rank: 'prajurit',
    hp: 26,
    damage: 12,
    speed: 6.4,
    radius: 0.5,
    height: 1.1,
    mass: 45,
    attackRange: 7.5,
    windup: 0.45,
    recover: 0.9,
    cooldown: 1.8,
    lungeSpeed: 15,
    lungeTime: 0.45,
  },
  spitter: {
    name: 'Spitter',
    rank: 'prajurit',
    hp: 30,
    damage: 11,
    speed: 2.6,
    radius: 0.45,
    height: 1.5,
    mass: 55,
    attackRange: 26,
    windup: 0.6,
    recover: 0.5,
    cooldown: 2.4,
    shot: { speed: 17, gravity: 9, radius: 0.3, keepAway: 11 },
  },
  warden: {
    name: 'Warden',
    rank: 'ksatria',
    hp: 110,
    damage: 18,
    speed: 2.3,
    radius: 0.62,
    height: 2.25,
    mass: 260,
    attackRange: 2.3,
    windup: 0.8,
    recover: 1,
    cooldown: 2,
    shield: 0.85,
  },
  riftlord: {
    name: 'Rift Lord',
    rank: 'jenderal',
    hp: 260,
    damage: 22,
    speed: 2.5,
    radius: 0.95,
    height: 3.2,
    mass: 900,
    attackRange: 4.2,
    windup: 1.1,
    recover: 1.1,
    cooldown: 3.2,
    slam: 5,
    summon: { every: 14, count: 3, max: 6 },
    anchored: true,
  },
  hollow: {
    name: 'The Hollow Warden',
    rank: 'marsekal',
    hp: 2400,
    damage: 22,
    speed: 2.8,
    radius: 1.35,
    height: 4.6,
    mass: 3000,
    attackRange: 4.8,
    // A long windup and a circle that fits on a pillar: the slam is there to be stepped out of.
    windup: 1.3,
    recover: 1,
    cooldown: 2.6,
    slam: 5,
    summon: { every: 15, count: 6, max: 10 },
    anchored: true,
  },
  // Tier IV: hovers out of reach and dives. Telekinesis pulls it down, Chaos Burst knocks it out of the air.
  harrier: {
    name: 'Harrier',
    rank: 'prajurit',
    hp: 32,
    damage: 16,
    speed: 7,
    radius: 0.55,
    height: 1,
    mass: 30,
    attackRange: 15,
    windup: 0.7,
    recover: 1.4,
    cooldown: 2.6,
    lungeSpeed: 19,
    lungeTime: 0.9,
    fly: { height: 7 },
  },
  // Tier V: lobs a heavy charge onto a warning circle. Hex Barrier eats it, Reality Warp sends it back.
  bombard: {
    name: 'Bombard',
    rank: 'ksatria',
    hp: 140,
    damage: 20,
    speed: 1.7,
    radius: 0.75,
    height: 2.3,
    mass: 420,
    attackRange: 34,
    windup: 1.3,
    recover: 1,
    cooldown: 5.5,
    // A slow, high arc (about 12 m at 26 m range) clears street cover and gives time to step out of the circle.
    shot: { speed: 10, gravity: 14, radius: 0.55, keepAway: 16, blast: 3.5 },
  },
  // v2, Hutan Pembuka: crowds in. Leaps and claws after a 0.5 s crouch under a slow amber ring: block or parry it.
  imp: {
    name: 'Imp',
    rank: 'prajurit',
    hp: 34,
    damage: 9,
    speed: 3.6,
    radius: 0.42,
    height: 1.3,
    mass: 30,
    attackRange: 2.2,
    windup: 0.5,
    recover: 0.8,
    cooldown: 1.6,
    lungeSpeed: 7,
    lungeTime: 0.3,
    strike: 'ring',
    stun: 30,
  },
  // v2, Hutan Pembuka: packs of three to five. Circles to her side and lunges along a flashing line: dodge it.
  hellhound: {
    name: 'Hellhound',
    rank: 'prajurit',
    hp: 30,
    damage: 12,
    speed: 6.2,
    radius: 0.55,
    height: 1.6,
    mass: 45,
    attackRange: 7.5,
    windup: 0.55,
    recover: 0.9,
    cooldown: 2.2,
    lungeSpeed: 15,
    lungeTime: 0.45,
    strike: 'line',
    stun: 30,
    flank: true,
  },
  // v2, Tebing Berangin: hovers, screams for 0.7 s, then dives along a flashing line. A Hex Bolt or Telekinesis brings it down.
  harpy: {
    name: 'Harpy',
    rank: 'prajurit',
    hp: 30,
    damage: 14,
    speed: 6.5,
    radius: 0.55,
    height: 1.7,
    mass: 35,
    attackRange: 15,
    windup: 0.7,
    recover: 1.3,
    cooldown: 2.8,
    lungeSpeed: 18,
    lungeTime: 0.8,
    fly: { height: 6 },
    strike: 'line',
    stun: 25,
  },
  // v2, Tebing Berangin: shoots from range and backs away. The arrow flies along a flashing line: roll aside.
  centaur: {
}

/** Enemy growth per level. Kept below the witch's own growth so higher tiers stay fair. */
export const GROWTH = { hpPerLevel: 0.15, damagePerLevel: 0.1 } as const

export const SHADOW = { hpMult: 2.2, damageMult: 1.2, speedMult: 1.15, followDistance: 3.2, engageRange: 14, leash: 22, regen: 0.04 } as const

/** What raised shadows of the bigger ranks can do on their own. */
export const SHADOW_SKILL = {
  /** Rift Lord (Jenderal): calls two short-lived shadow husks. */
  call: { every: 20, count: 2, lasts: 15 },
  /** Hollow Warden (Marsekal): drags enemies in and stuns them. */
  pull: { every: 12, radius: 11, stun: 1.5 },
} as const

/**
 * Tier IV and V creatures can be elite: tougher, worth more XP, and with one trait.
 * berlapis: hard to hurt except by a throw. gesit: quick. meledak: bursts when it falls.
 * penjaga: other creatures near it take less damage while it stands.
 */
export type EliteTrait = 'berlapis' | 'gesit' | 'meledak' | 'penjaga'

export const ELITE = {
  traits: ['berlapis', 'gesit', 'meledak', 'penjaga'] as EliteTrait[],
  label: { berlapis: 'Berlapis', gesit: 'Gesit', meledak: 'Meledak', penjaga: 'Penjaga' } as Record<EliteTrait, string>,
  hp: 2.4,
  damage: 1.25,
  scale: 1.15,
  xp: 3,
  /** Share of damage that still lands on a berlapis elite, unless it comes from a throw. */
  armor: 0.45,
  swift: { speed: 1.45, tempo: 0.7 },
  burst: { radius: 4.5, delay: 1.6, damage: 2 },
  /** Share of damage that lands on creatures near a penjaga elite. */
  ward: { radius: 9, share: 0.65 },
} as const

/** `elites`: how many of the wave come out elite. `eliteLords`: every Rift Lord of the wave is one. */
export type WaveSpec = Partial<Record<Exclude<UnitKind, 'hollow'>, number>> & { levels: [number, number]; elites?: number; eliteLords?: boolean }

export type TierId = 1 | 2 | 3 | 4 | 5

export const TIER_IDS: TierId[] = [1, 2, 3, 4, 5]

export interface TierSpec {
  tier: TierId
  name: string
  roman: string
  unlock: number
  waves: WaveSpec[]
  maxAlive: number
  /** Tier III ends in the Hollow Warden's lair. */
  boss?: { level: number; unlock: number }
  /** Opens only once The Hollow Warden has fallen. */
  needsBoss?: boolean
}

export const TIERS: Record<TierId, TierSpec> = {
  1: {
    tier: 1,
    name: 'Rift Tier I',
    roman: 'I',
    unlock: 1,
    maxAlive: 16,
    waves: [
      { husk: 6, levels: [1, 1] },
      { husk: 8, hound: 2, levels: [1, 1] },
      { husk: 10, hound: 4, levels: [1, 2] },
      { husk: 12, hound: 5, levels: [2, 2] },
      { husk: 14, hound: 6, levels: [2, 3] },
    ],
  },
  2: {
    tier: 2,
    name: 'Rift Tier II',
    roman: 'II',
    unlock: 4,
    maxAlive: 17,
    waves: [
      { husk: 6, hound: 2, spitter: 2, levels: [4, 4] },
      { husk: 8, hound: 3, spitter: 2, levels: [4, 5] },
      { husk: 9, hound: 3, spitter: 3, levels: [5, 5] },
      { husk: 10, hound: 4, spitter: 3, levels: [5, 6] },
      { husk: 11, hound: 5, spitter: 4, levels: [6, 6] },
    ],
  },
  3: {
    tier: 3,
    name: 'Rift Tier III',
    roman: 'III',
    unlock: 7,
    maxAlive: 18,
    waves: [
      { husk: 10, hound: 4, spitter: 3, warden: 2, levels: [7, 7] },
      { husk: 11, hound: 5, spitter: 4, warden: 3, levels: [7, 8] },
      { husk: 12, hound: 6, spitter: 4, warden: 4, levels: [8, 8] },
      { riftlord: 1, husk: 8, spitter: 3, warden: 2, levels: [8, 9] },
    ],
    // Phase 3 can only be won inside Reality Warp (Lv 10), so the lair opens at that level.
    boss: { level: 10, unlock: 10 },
  },
  // Past the GDD's first version: enemies Lv 10 and up, elite combinations.
  4: {
    tier: 4,
    name: 'Rift Tier IV',
    roman: 'IV',
    unlock: 10,
    needsBoss: true,
    maxAlive: 18,
    waves: [
      { husk: 7, hound: 3, harrier: 3, levels: [10, 10], elites: 1 },
      { husk: 7, hound: 3, spitter: 2, harrier: 4, levels: [10, 11], elites: 2 },
      { husk: 7, hound: 3, spitter: 2, warden: 2, harrier: 4, levels: [11, 11], elites: 3 },
      { husk: 8, hound: 4, spitter: 3, warden: 3, harrier: 4, levels: [11, 12], elites: 3 },
      { riftlord: 1, husk: 6, warden: 2, harrier: 4, levels: [12, 12], elites: 2, eliteLords: true },
    ],
  },
  5: {
    tier: 5,
    name: 'Rift Tier V',
    roman: 'V',
    unlock: 13,
    needsBoss: true,
    maxAlive: 19,
    waves: [
      { husk: 7, hound: 3, harrier: 3, bombard: 1, levels: [13, 13], elites: 2 },
      { husk: 7, hound: 3, spitter: 2, harrier: 3, bombard: 2, levels: [13, 14], elites: 2 },
      { husk: 7, hound: 3, spitter: 2, warden: 3, harrier: 4, bombard: 2, levels: [14, 14], elites: 3 },
      { husk: 8, hound: 4, spitter: 3, warden: 3, harrier: 4, bombard: 2, levels: [14, 15], elites: 4 },
      { husk: 7, hound: 3, warden: 3, harrier: 4, bombard: 2, levels: [15, 15], elites: 4 },
      { riftlord: 2, husk: 5, warden: 2, bombard: 2, levels: [15, 15], elites: 2, eliteLords: true },
    ],
  },
}

export const RIFT = {
  spawnInterval: 0.8,
  breather: 6,
  /** Share of max HP restored when a wave ends; the GDD has no other healing yet. */
  breatherHeal: 0.2,
  /** Seconds the last three or fewer of a wave may hang back before they come for the witch. */
  straggle: 20,
} as const

export const BOSS = {
  /** HP shares where the fight moves to phase 2 and phase 3. */
  phase2At: 0.66,
  phase3At: 0.33,
  /** Phase 2: bolts barely scratch the shell; thrown bodies do full damage. */
  shellBoltShare: 0.1,
  volleyEvery: 3.6,
  volleyShots: 3,
  /** Share of the boss's hit that one glob carries; volleys are meant to be dodged, not tanked. */
  volleyDamage: 0.28,
  volleySpread: 3.2,
  /** The globs of its volleys (kept off the unit spec so phase 1 stays a melee fight). */
  shot: { speed: 15, gravity: 6, radius: 0.45, keepAway: 0 },
  /** Each new phase gives the witch a breath: a share of HP and some mana back. */
  phaseHeal: 0.25,
  phaseMana: 30,
  /** Phase 3: slower volleys, and the husks it swallows heal it a little. */
  volleyEvery3: 4.2,
  /** Damage taken while caught in Reality Warp in phase 3. */
  warpDamage: 1.5,
  swallowHeal: 0.015,
  feedEvery: 22,
  /** Falling into the void costs this share of max HP. */
  fallDamage: 0.15,
  hoverHeight: 6.5,
} as const

export const WORLD = { maxPhysicsProps: 20, arenaHalf: 38 } as const
