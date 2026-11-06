export type CharacterId = 'parth' | 'siddharth' | 'yug';
export type PetId = 'sheru' | 'wolfs' | 'draky' | 'pegasus' | 'poink';
export type WeaponId =
  | 'awm_sniper'
  | 'barrett_sniper'
  | 'ak47_rifle'
  | 'm4_carbine'
  | 'spas_shotgun'
  | 'rpg_launcher'
  | 'plasma_smg';

export interface CharacterSpec {
  id: CharacterId;
  letter: 'P' | 'S' | 'Y';
  name: string;
  codename: string;
  role: string;
  primaryColor: string;
  secondaryColor: string;
  visorColor: string;
  maxHp: number;
  maxJetpack: number;
  moveSpeedMult: number;
  damageMult: number;
  sniperBonusMult: number;
  abilityName: string;
  abilityDescription: string;
  passiveName: string;
  passiveDescription: string;
  abilityCooldown: number; // seconds
  abilityDuration: number; // seconds
  startingWeapon: WeaponId;
  secondaryWeapon: WeaponId;
}

export interface WeaponSpec {
  id: WeaponId;
  name: string;
  shortName: string;
  category: 'SNIPER' | 'ASSAULT' | 'SHOTGUN' | 'HEAVY' | 'SMG';
  isSniper: boolean;
  scopeZoom: number; // < 1 means zoomed out so player sees much wider battlefield
  damage: number;
  fireInterval: number; // seconds between shots
  magSize: number;
  reloadTime: number; // seconds
  bulletSpeed: number;
  pellets: number;
  spread: number; // radians
  explosiveRadius: number;
  color: string;
  laserSight: boolean;
  description: string;
}

export interface PetSpec {
  id: PetId;
  order: number;
  name: string;
  title: string;
  popularityTag: string;
  primaryColor: string;
  accentColor: string;
  unlockXp: number;
  unlockCoins: number;
  baseUpgradeXp: number;
  baseUpgradeCoins: number;
  abilityName: string;
  abilitySummary: string;
  passiveBonusText: string;
  attackDamage: number;
  attackCooldown: number;
  healPerSec: number;
  speedBonus: number;
  damageBonus: number;
  jetpackBonus: number;
  damageReduction: number;
  projectileType: 'claw' | 'frost' | 'fireball' | 'lightning' | 'nova';
}

export const CHARACTERS: Record<CharacterId, CharacterSpec> = {
  parth: {
    id: 'parth',
    letter: 'P',
    name: 'Parth',
    codename: 'VANGUARD-P1',
    role: 'Heavy Assault & Aegis Tank',
    primaryColor: '#38BDF8',
    secondaryColor: '#0284C7',
    visorColor: '#7DD3FC',
    maxHp: 135,
    maxJetpack: 105,
    moveSpeedMult: 1.0,
    damageMult: 1.05,
    sniperBonusMult: 1.0,
    abilityName: 'Aegis Overdrive',
    abilityDescription: 'Projects an energy dome absorbing 70% damage while boosting fire rate by +50% for 6s.',
    passiveName: 'Titanium Plated Core',
    passiveDescription: '+35 Max HP and +25% faster Jetpack fuel recovery.',
    abilityCooldown: 12,
    abilityDuration: 6,
    startingWeapon: 'awm_sniper',
    secondaryWeapon: 'ak47_rifle',
  },
  siddharth: {
    id: 'siddharth',
    letter: 'S',
    name: 'Siddharth',
    codename: 'PHANTOM-S2',
    role: 'Recon Marksman & Sniper Ace',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    visorColor: '#6EE7B7',
    maxHp: 105,
    maxJetpack: 115,
    moveSpeedMult: 1.15,
    damageMult: 1.1,
    sniperBonusMult: 1.3,
    abilityName: 'Hawk-Eye Railcharge',
    abilityDescription: 'Supercharges sniper & rifle rounds for +65% piercing damage and thermal target vectors for 6s.',
    passiveName: 'Long-Range Optics',
    passiveDescription: '+30% Sniper Rifle damage, wider sniper scope view, and +15% movement agility.',
    abilityCooldown: 11,
    abilityDuration: 6,
    startingWeapon: 'barrett_sniper',
    secondaryWeapon: 'plasma_smg',
  },
  yug: {
    id: 'yug',
    letter: 'Y',
    name: 'Yug',
    codename: 'BLAZE-Y3',
    role: 'Demolition & Jetpack Commando',
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    visorColor: '#FDE68A',
    maxHp: 120,
    maxJetpack: 135,
    moveSpeedMult: 1.08,
    damageMult: 1.2,
    sniperBonusMult: 1.05,
    abilityName: 'Meteor Cluster Surge',
    abilityDescription: 'Launches 5 homing micro-missiles at enemies and grants infinite jetpack fuel for 6s.',
    passiveName: 'Ordnance Specialist',
    passiveDescription: '+20% All-Weapon Damage, +35% Jetpack Fuel tank, and explosive blast mastery.',
    abilityCooldown: 13,
    abilityDuration: 6,
    startingWeapon: 'awm_sniper',
    secondaryWeapon: 'rpg_launcher',
  },
};

export const WEAPONS: Record<WeaponId, WeaponSpec> = {
  awm_sniper: {
    id: 'awm_sniper',
    name: 'AWM-X Viper Sniper',
    shortName: 'AWM Sniper',
    category: 'SNIPER',
    isSniper: true,
    scopeZoom: 0.54, // Zooms out camera significantly so player can snipe across platforms
    damage: 65,
    fireInterval: 0.95,
    magSize: 8,
    reloadTime: 1.6,
    bulletSpeed: 1550,
    pellets: 1,
    spread: 0.005,
    explosiveRadius: 0,
    color: '#EF4444',
    laserSight: true,
    description: 'High-velocity bolt sniper with tactical Scope Zoom-Out optics and crimson laser sight.',
  },
  barrett_sniper: {
    id: 'barrett_sniper',
    name: 'Barrett M82 Railgun',
    shortName: 'M82 Sniper',
    category: 'SNIPER',
    isSniper: true,
    scopeZoom: 0.45, // Maximum wide-field zoom out for cross-arena sniping
    damage: 85,
    fireInterval: 1.25,
    magSize: 6,
    reloadTime: 1.9,
    bulletSpeed: 1800,
    pellets: 1,
    spread: 0.002,
    explosiveRadius: 28,
    color: '#38BDF8',
    laserSight: true,
    description: 'Heavy anti-materiel sniper with ultra-wide Scope Zoom-Out and micro-concussive impact.',
  },
  ak47_rifle: {
    id: 'ak47_rifle',
    name: 'AK-47 Kalash Assault',
    shortName: 'AK-47',
    category: 'ASSAULT',
    isSniper: false,
    scopeZoom: 1.0,
    damage: 20,
    fireInterval: 0.14,
    magSize: 30,
    reloadTime: 1.4,
    bulletSpeed: 980,
    pellets: 1,
    spread: 0.045,
    explosiveRadius: 0,
    color: '#F59E0B',
    laserSight: false,
    description: 'Reliable full-auto assault rifle. Standard iron sights (No Scope Zoom-Out).',
  },
  m4_carbine: {
    id: 'm4_carbine',
    name: 'M4A1 Phantom Carbine',
    shortName: 'M4A1',
    category: 'ASSAULT',
    isSniper: false,
    scopeZoom: 1.0,
    damage: 16,
    fireInterval: 0.105,
    magSize: 36,
    reloadTime: 1.25,
    bulletSpeed: 1080,
    pellets: 1,
    spread: 0.03,
    explosiveRadius: 0,
    color: '#10B981',
    laserSight: false,
    description: 'Low-recoil rapid tactical carbine. Standard optics (No Scope Zoom-Out).',
  },
  spas_shotgun: {
    id: 'spas_shotgun',
    name: 'SPAS-12 Trench Breacher',
    shortName: 'SPAS-12',
    category: 'SHOTGUN',
    isSniper: false,
    scopeZoom: 1.0,
    damage: 15,
    fireInterval: 0.62,
    magSize: 10,
    reloadTime: 1.5,
    bulletSpeed: 860,
    pellets: 6,
    spread: 0.22,
    explosiveRadius: 0,
    color: '#EC4899',
    laserSight: false,
    description: 'Fires 6 heavy buckshot pellets per blast. Close-quarters shredder (No Scope Zoom-Out).',
  },
  rpg_launcher: {
    id: 'rpg_launcher',
    name: 'RPG-7 Hydra Launcher',
    shortName: 'RPG-7',
    category: 'HEAVY',
    isSniper: false,
    scopeZoom: 1.0,
    damage: 78,
    fireInterval: 1.5,
    magSize: 4,
    reloadTime: 2.0,
    bulletSpeed: 680,
    pellets: 1,
    spread: 0.02,
    explosiveRadius: 115,
    color: '#F97316',
    laserSight: false,
    description: 'Launches high-explosive warheads with massive splash damage (No Scope Zoom-Out).',
  },
  plasma_smg: {
    id: 'plasma_smg',
    name: 'Vector-Z Plasma SMG',
    shortName: 'Vector SMG',
    category: 'SMG',
    isSniper: false,
    scopeZoom: 1.0,
    damage: 12,
    fireInterval: 0.075,
    magSize: 44,
    reloadTime: 1.1,
    bulletSpeed: 940,
    pellets: 1,
    spread: 0.06,
    explosiveRadius: 0,
    color: '#A855F7',
    laserSight: false,
    description: 'Blistering rate of fire for aerial dogfights (No Scope Zoom-Out).',
  },
};

export const PETS: PetSpec[] = [
  {
    id: 'sheru',
    order: 1,
    name: 'Sheru',
    title: 'Cyber-Bengal Guardian Tiger',
    popularityTag: '1. MOST POPULAR PET',
    primaryColor: '#F59E0B',
    accentColor: '#FEF08A',
    unlockXp: 0,
    unlockCoins: 0,
    baseUpgradeXp: 100,
    baseUpgradeCoins: 100,
    abilityName: 'Royal Tiger Pounce & Vital Roar',
    abilitySummary: 'Heals +5 HP/sec continuously and slashes nearby enemies with golden tiger claws (26 DMG).',
    passiveBonusText: '+5 HP/s Regen · Tiger Claw Strike',
    attackDamage: 26,
    attackCooldown: 1.9,
    healPerSec: 5,
    speedBonus: 0.05,
    damageBonus: 0.05,
    jetpackBonus: 0.05,
    damageReduction: 0.05,
    projectileType: 'claw',
  },
  {
    id: 'wolfs',
    order: 2,
    name: 'Wolfs',
    title: 'Alpha Frost Pack Wolf',
    popularityTag: '2. PACK HUNTER',
    primaryColor: '#38BDF8',
    accentColor: '#E0F2FE',
    unlockXp: 100, // 1 Game = 100 XP
    unlockCoins: 150,
    baseUpgradeXp: 100,
    baseUpgradeCoins: 150,
    abilityName: 'Blizzard Fang & Pack Sprint',
    abilitySummary: 'Boosts player movement speed by +20% and launches cryo-fangs (34 DMG) that chill targets.',
    passiveBonusText: '+20% Move Speed · Cryo Fang Attack',
    attackDamage: 34,
    attackCooldown: 1.65,
    healPerSec: 4,
    speedBonus: 0.2,
    damageBonus: 0.1,
    jetpackBonus: 0.1,
    damageReduction: 0.08,
    projectileType: 'frost',
  },
  {
    id: 'draky',
    order: 3,
    name: 'Draky',
    title: 'Crimson Ember Wyvern',
    popularityTag: '3. AERIAL DRAKE',
    primaryColor: '#EF4444',
    accentColor: '#FCA5A5',
    unlockXp: 200, // 2 Games = 200 XP
    unlockCoins: 250,
    baseUpgradeXp: 100,
    baseUpgradeCoins: 220,
    abilityName: 'Dragonfire Breath & Scorch Aura',
    abilitySummary: 'Increases all weapon damage by +25% and breathes explosive homing fireballs (44 DMG).',
    passiveBonusText: '+25% Weapon DMG · Homing Fireballs',
    attackDamage: 44,
    attackCooldown: 1.45,
    healPerSec: 6,
    speedBonus: 0.12,
    damageBonus: 0.25,
    jetpackBonus: 0.2,
    damageReduction: 0.12,
    projectileType: 'fireball',
  },
  {
    id: 'pegasus',
    order: 4,
    name: 'Pegasus',
    title: 'Celestial Thunder Steed',
    popularityTag: '4. SKY CELESTIAL',
    primaryColor: '#818CF8',
    accentColor: '#E0E7FF',
    unlockXp: 300, // 3 Games = 300 XP
    unlockCoins: 400,
    baseUpgradeXp: 200,
    baseUpgradeCoins: 300,
    abilityName: 'Aether Wings & Storm Lance',
    abilitySummary: 'Grants +60% Jetpack Fuel, +8 HP/sec regeneration, and calls down chain lightning (54 DMG).',
    passiveBonusText: '+60% Jetpack Fuel · Chain Lightning',
    attackDamage: 54,
    attackCooldown: 1.25,
    healPerSec: 8,
    speedBonus: 0.22,
    damageBonus: 0.28,
    jetpackBonus: 0.6,
    damageReduction: 0.18,
    projectileType: 'lightning',
  },
  {
    id: 'poink',
    order: 5,
    name: 'Poink',
    title: 'Apex Cosmic Hog-Mecha',
    popularityTag: '5. ULTIMATE MYTHIC PET',
    primaryColor: '#EC4899',
    accentColor: '#FBCFE8',
    unlockXp: 400, // 4 Games = 400 XP
    unlockCoins: 600,
    baseUpgradeXp: 200,
    baseUpgradeCoins: 450,
    abilityName: 'Gravity Nova & Golden Truffle Shield',
    abilitySummary: 'Blocks 30% of incoming damage, heals +12 HP/sec, and fires cosmic plasma novas (68 Splash DMG).',
    passiveBonusText: '30% DMG Shield · +12 HP/s · Plasma Nova',
    attackDamage: 68,
    attackCooldown: 1.1,
    healPerSec: 12,
    speedBonus: 0.28,
    damageBonus: 0.35,
    jetpackBonus: 0.65,
    damageReduction: 0.3,
    projectileType: 'nova',
  },
];

export const PET_MAP: Record<PetId, PetSpec> = {
  sheru: PETS[0],
  wolfs: PETS[1],
  draky: PETS[2],
  pegasus: PETS[3],
  poink: PETS[4],
};

export interface ArenaPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'steel' | 'bunker' | 'high_tower';
}

export const ARENA_WIDTH = 2600;
export const ARENA_HEIGHT = 1400;

export const ARENA_PLATFORMS: ArenaPlatform[] = [
  // Main floor
  { x: 0, y: 1260, w: 2600, h: 140, type: 'ground' },
  // Left & Right Lower Bunkers
  { x: 180, y: 1050, w: 420, h: 32, type: 'bunker' },
  { x: 2000, y: 1050, w: 420, h: 32, type: 'bunker' },
  // Center Low Bridge
  { x: 920, y: 1090, w: 760, h: 30, type: 'steel' },
  // Mid-Tier Platforms
  { x: 460, y: 840, w: 450, h: 28, type: 'steel' },
  { x: 1690, y: 840, w: 450, h: 28, type: 'steel' },
  // Center Command Deck
  { x: 1050, y: 690, w: 500, h: 32, type: 'bunker' },
  // High Sniper Towers (Left & Right)
  { x: 140, y: 560, w: 340, h: 28, type: 'high_tower' },
  { x: 2120, y: 560, w: 340, h: 28, type: 'high_tower' },
  // Upper Sky Bridges
  { x: 640, y: 450, w: 420, h: 26, type: 'high_tower' },
  { x: 1540, y: 450, w: 420, h: 26, type: 'high_tower' },
  // Apex Crown Platform (Center Top)
  { x: 1120, y: 290, w: 360, h: 26, type: 'high_tower' },
];

export const WEAPON_SPAWN_POINTS: { x: number; y: number; defaultWeapon: WeaponId }[] = [
  { x: 380, y: 1015, defaultWeapon: 'awm_sniper' },
  { x: 2210, y: 1015, defaultWeapon: 'barrett_sniper' },
  { x: 1300, y: 1055, defaultWeapon: 'spas_shotgun' },
  { x: 680, y: 805, defaultWeapon: 'ak47_rifle' },
  { x: 1910, y: 805, defaultWeapon: 'm4_carbine' },
  { x: 1300, y: 655, defaultWeapon: 'rpg_launcher' },
  { x: 310, y: 525, defaultWeapon: 'barrett_sniper' },
  { x: 2290, y: 525, defaultWeapon: 'awm_sniper' },
  { x: 850, y: 415, defaultWeapon: 'plasma_smg' },
  { x: 1750, y: 415, defaultWeapon: 'spas_shotgun' },
  { x: 1300, y: 255, defaultWeapon: 'barrett_sniper' },
  { x: 750, y: 1225, defaultWeapon: 'awm_sniper' },
  { x: 1850, y: 1225, defaultWeapon: 'ak47_rifle' },
];
