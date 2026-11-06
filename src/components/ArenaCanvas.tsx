import React, { useEffect, useRef } from 'react';
import {
  ARENA_HEIGHT,
  ARENA_PLATFORMS,
  ARENA_WIDTH,
  CHARACTERS,
  CharacterId,
  PET_MAP,
  PetId,
  WEAPON_SPAWN_POINTS,
  WEAPONS,
  WeaponId,
} from '../data/gameData';
import { JoystickVector } from './VirtualJoystick';
import { soundFx } from '../utils/soundFx';

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  jetpack: number;
  maxJetpack: number;
  activeWeapon: WeaponId;
  secondaryWeapon: WeaponId;
  ammo: number;
  reserveAmmo: number;
  maxAmmo: number;
  reloading: boolean;
  isScopedOut: boolean;
  canScopeOut: boolean;
  scopeZoomLabel: string;
  scopeWarningText: string | null;
  medkits: number;
  maxMedkits: number;
  grenades: number;
  abilityCooldownLeft: number;
  abilityActiveLeft: number;
  nearbyGroundWeapon: { id: string; weaponId: WeaponId; distance: number } | null;
  kills: number;
  deaths: number;
  killLimit: number;
  matchCoinsEarned: number;
  timeRemaining: number;
  killFeed: { id: string; text: string; color: string }[];
}

export interface MatchEndSummary {
  kills: number;
  deaths: number;
  coinsEarned: number;
  xpEarned: number; // Strictly 100 XP per game!
  victory: boolean;
}

interface ArenaCanvasProps {
  gamerTag: string;
  characterId: CharacterId;
  petId: PetId;
  petLevel: number;
  initialMedkits: number;
  botCount?: number;
  killLimit?: number;
  matchDurationSec?: number;
  moveSensitivity?: number;
  aimSpeed?: number;
  isPaused: boolean;
  moveJoystickRef: React.MutableRefObject<JoystickVector>;
  aimJoystickRef: React.MutableRefObject<JoystickVector>;
  actionsRef: React.MutableRefObject<{
    triggerPickup: boolean;
    triggerScopeToggle: boolean;
    triggerMedkit: boolean;
    triggerAbility: boolean;
    triggerGrenade: boolean;
    triggerSwapWeapon: boolean;
    triggerReload: boolean;
    holdFireButton: boolean;
  }>;
  onHudUpdate: (hud: HudSnapshot) => void;
  onMedkitCountChange: (newCount: number) => void;
  onMatchEnd: (summary: MatchEndSummary) => void;
}

interface FighterEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  characterId: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  jetpack: number;
  maxJetpack: number;
  aimAngle: number;
  facing: 1 | -1;
  activeWeapon: WeaponId;
  secondaryWeapon: WeaponId;
  ammo: number;
  reserveAmmo: number;
  reloadingTimer: number;
  fireCooldown: number;
  abilityTimer: number;
  abilityCooldown: number;
  hitFlashTimer: number;
  respawnTimer: number;
  aiTargetTimer: number;
  aiMoveDir: number;
  aiJetpackActive: boolean;
  kills: number;
  deaths: number;
}

interface BulletEntity {
  id: string;
  ownerId: string;
  isPlayer: boolean;
  isPet: boolean;
  isGrenade?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  radius: number;
  explosiveRadius: number;
  homing: boolean;
  life: number;
  trail: { x: number; y: number }[];
}

interface GroundItem {
  id: string;
  kind: 'weapon' | 'medkit' | 'coin';
  weaponId?: WeaponId;
  x: number;
  y: number;
  respawnTimer: number;
  bobOffset: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  gamerTag,
  characterId,
  petId,
  petLevel,
  initialMedkits,
  botCount = 4,
  killLimit = 15,
  matchDurationSec = 180,
  moveSensitivity = 0.8,
  aimSpeed = 0.8,
  isPaused,
  moveJoystickRef,
  aimJoystickRef,
  actionsRef,
  onHudUpdate,
  onMedkitCountChange,
  onMatchEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const charSpec = CHARACTERS[characterId];
    const petSpec = PET_MAP[petId];

    const petPowerMult = 1 + (petLevel - 1) * 0.18;
    const effectiveMaxHp = Math.round(charSpec.maxHp * (1 + petSpec.damageReduction * 0.3));
    const effectiveMaxJetpack = Math.round(charSpec.maxJetpack * (1 + petSpec.jetpackBonus));

    const player: FighterEntity = {
      id: 'player',
      name: `${gamerTag || charSpec.name} (YOU)`,
      isPlayer: true,
      characterId,
      x: 960,
      y: 980,
      vx: 0,
      vy: 0,
      radius: 26,
      hp: effectiveMaxHp,
      maxHp: effectiveMaxHp,
      jetpack: effectiveMaxJetpack,
      maxJetpack: effectiveMaxJetpack,
      aimAngle: 0,
      facing: 1,
      activeWeapon: charSpec.startingWeapon,
      secondaryWeapon: charSpec.secondaryWeapon,
      ammo: WEAPONS[charSpec.startingWeapon].magSize,
      reserveAmmo: WEAPONS[charSpec.startingWeapon].magSize * 5,
      reloadingTimer: 0,
      fireCooldown: 0,
      abilityTimer: 0,
      abilityCooldown: 0,
      hitFlashTimer: 0,
      respawnTimer: 0,
      aiTargetTimer: 0,
      aiMoveDir: 0,
      aiJetpackActive: false,
      kills: 0,
      deaths: 0,
    };

    const allBotTemplates: { name: string; char: CharacterId; x: number; y: number; gun: WeaponId }[] = [
      { name: 'Viper_Sniper', char: 'siddharth', x: 420, y: 940, gun: 'awm_sniper' },
      { name: 'Titan_Parth', char: 'parth', x: 2150, y: 940, gun: 'ak47_rifle' },
      { name: 'Blaze_Yug', char: 'yug', x: 680, y: 740, gun: 'spas_shotgun' },
      { name: 'Ghost_Recon', char: 'siddharth', x: 1850, y: 740, gun: 'm4_carbine' },
      { name: 'Apex_Scout', char: 'parth', x: 1300, y: 580, gun: 'plasma_smg' },
      { name: 'Nova_Hunter', char: 'yug', x: 1550, y: 380, gun: 'barrett_sniper' },
    ];

    const activeBots = allBotTemplates.slice(0, Math.max(1, Math.min(6, botCount)));

    const fighters: FighterEntity[] = [
      player,
      ...activeBots.map((b, i) => ({
        id: `bot_${i}`,
        name: b.name,
        isPlayer: false,
        characterId: b.char,
        x: b.x,
        y: b.y,
        vx: 0,
        vy: 0,
        radius: 26,
        hp: CHARACTERS[b.char].maxHp,
        maxHp: CHARACTERS[b.char].maxHp,
        jetpack: 100,
        maxJetpack: 100,
        aimAngle: 0,
        facing: (i % 2 === 0 ? 1 : -1) as 1 | -1,
        activeWeapon: b.gun,
        secondaryWeapon: 'ak47_rifle' as WeaponId,
        ammo: WEAPONS[b.gun].magSize,
        reserveAmmo: WEAPONS[b.gun].magSize * 4,
        reloadingTimer: 0,
        fireCooldown: 0.5,
        abilityTimer: 0,
        abilityCooldown: 6,
        hitFlashTimer: 0,
        respawnTimer: 0,
        aiTargetTimer: 0,
        aiMoveDir: i % 2 === 0 ? 1 : -1,
        aiJetpackActive: false,
        kills: 0,
        deaths: 0,
      })),
    ];

    const groundItems: GroundItem[] = WEAPON_SPAWN_POINTS.map((sp, idx) => ({
      id: `wpn_${idx}`,
      kind: 'weapon',
      weaponId: sp.defaultWeapon,
      x: sp.x,
      y: sp.y,
      respawnTimer: 0,
      bobOffset: idx * 0.7,
    }));

    const medkitCoords = [
      { x: 1300, y: 1222 },
      { x: 480, y: 1012 },
      { x: 2080, y: 1012 },
      { x: 1180, y: 652 },
      { x: 1300, y: 252 },
      { x: 740, y: 805 },
    ];
    medkitCoords.forEach((mc, idx) => {
      groundItems.push({
        id: `med_${idx}`,
        kind: 'medkit',
        x: mc.x,
        y: mc.y,
        respawnTimer: 0,
        bobOffset: idx * 1.1,
      });
    });

    const bullets: BulletEntity[] = [];
    const particles: Particle[] = [];
    const floatingTexts: FloatingText[] = [];
    const killFeed: { id: string; text: string; color: string }[] = [];

    const petState = {
      x: player.x - 48,
      y: player.y - 42,
      attackTimer: 1.0,
      healAccum: 0,
      bobPhase: 0,
    };

    let isScopedOut = false;
    let currentCameraZoom = 1.0;
    let cameraX = player.x;
    let cameraY = player.y;
    let screenShake = 0;
    let hitstopTimer = 0;
    let scopeWarningText: string | null = null;
    let scopeWarningTimer = 0;

    let medkitsCount = Math.min(10, Math.max(0, initialMedkits));
    let grenadesCount = 3;
    let matchCoinsEarned = 0;
    let matchTimeRemaining = matchDurationSec;
    let matchEnded = false;

    const keysHeld = new Set<string>();
    let mouseScreenX = window.innerWidth / 2;
    let mouseScreenY = window.innerHeight / 2;
    let mouseAimActive = false;
    let mouseDownHeld = false;

    const addKillFeed = (text: string, color: string) => {
      killFeed.unshift({ id: `${Date.now()}_${Math.random()}`, text, color });
      if (killFeed.length > 4) killFeed.pop();
    };

    const spawnParticles = (
      x: number,
      y: number,
      color: string,
      count: number,
      speed: number = 220
    ) => {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = (0.25 + Math.random() * 0.75) * speed;
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: 2.5 + Math.random() * 4,
          color,
          alpha: 1,
          life: 0.25 + Math.random() * 0.35,
          maxLife: 0.6,
        });
      }
    };

    const spawnFloatingText = (x: number, y: number, text: string, color: string) => {
      floatingTexts.push({ x, y, text, color, life: 1.1 });
    };

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysHeld.add(code);
      if (code === 'KeyE') {
        actionsRef.current.triggerPickup = true;
      } else if (code === 'KeyZ') {
        actionsRef.current.triggerScopeToggle = true;
      } else if (code === 'KeyH') {
        actionsRef.current.triggerMedkit = true;
      } else if (code === 'KeyF') {
        actionsRef.current.triggerAbility = true;
      } else if (code === 'KeyG') {
        actionsRef.current.triggerGrenade = true;
      } else if (code === 'KeyQ') {
        actionsRef.current.triggerSwapWeapon = true;
      } else if (code === 'KeyR') {
        actionsRef.current.triggerReload = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.delete(e.code);
    };

    const onWindowBlur = () => {
      keysHeld.clear();
      mouseDownHeld = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseScreenX = e.clientX;
      mouseScreenY = e.clientY;
      mouseAimActive = true;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDownHeld = true;
      } else if (e.button === 2) {
        e.preventDefault();
        actionsRef.current.triggerScopeToggle = true;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDownHeld = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    const fireWeapon = (shooter: FighterEntity, weaponSpec = WEAPONS[shooter.activeWeapon]) => {
      const shooterChar = CHARACTERS[shooter.characterId];
      let damageMult = shooterChar.damageMult;
      if (weaponSpec.isSniper) {
        damageMult *= shooterChar.sniperBonusMult;
      }
      if (shooter.isPlayer) {
        damageMult *= 1 + petSpec.damageBonus * petPowerMult;
      }
      if (shooter.abilityTimer > 0 && shooter.characterId === 'siddharth') {
        damageMult *= 1.65;
      }

      const gunTipDist = shooter.radius + 20;
      const tipX = shooter.x + Math.cos(shooter.aimAngle) * gunTipDist;
      const tipY = shooter.y + 4 + Math.sin(shooter.aimAngle) * gunTipDist;

      for (let p = 0; p < weaponSpec.pellets; p++) {
        const spreadOffset = (Math.random() - 0.5) * weaponSpec.spread;
        const angle = shooter.aimAngle + spreadOffset;
        bullets.push({
          id: `b_${Date.now()}_${Math.random()}`,
          ownerId: shooter.id,
          isPlayer: shooter.isPlayer,
          isPet: false,
          x: tipX,
          y: tipY,
          vx: Math.cos(angle) * weaponSpec.bulletSpeed,
          vy: Math.sin(angle) * weaponSpec.bulletSpeed,
          damage: Math.round(weaponSpec.damage * damageMult),
          color:
            shooter.abilityTimer > 0 && shooter.characterId === 'siddharth'
              ? '#10B981'
              : weaponSpec.color,
          radius: weaponSpec.isSniper ? 5.5 : weaponSpec.explosiveRadius > 0 ? 7.5 : 4.2,
          explosiveRadius: weaponSpec.explosiveRadius,
          homing: false,
          life: weaponSpec.isSniper ? 1.9 : 1.25,
          trail: [{ x: tipX, y: tipY }],
        });
      }

      spawnParticles(tipX, tipY, '#FFFBEB', weaponSpec.isSniper ? 10 : 5, 180);

      if (shooter.isPlayer) {
        soundFx.playShoot(weaponSpec.isSniper, weaponSpec.explosiveRadius > 0);
        screenShake = Math.max(screenShake, weaponSpec.isSniper ? 8 : 3);
      }
    };

    let lastTime = performance.now();
    let hudSyncAccum = 0;
    let animFrameId = 0;

    const updateSimulation = (dt: number) => {
      if (matchEnded) return;

      matchTimeRemaining = Math.max(0, matchTimeRemaining - dt);
      if (matchTimeRemaining <= 0 || player.kills >= killLimit) {
        matchEnded = true;
        onMatchEnd({
          kills: player.kills,
          deaths: player.deaths,
          coinsEarned: matchCoinsEarned + 80 + player.kills * 25,
          xpEarned: 100, // Strictly 100 XP per game!
          victory: player.kills >= player.deaths,
        });
        return;
      }

      if (scopeWarningTimer > 0) {
        scopeWarningTimer -= dt;
        if (scopeWarningTimer <= 0) {
          scopeWarningText = null;
        }
      }

      // Enforce Sniper-Only Scope Zoom-Out rule
      const currentPlayerWeapon = WEAPONS[player.activeWeapon];
      if (!currentPlayerWeapon.isSniper && isScopedOut) {
        isScopedOut = false;
      }

      // 1. Scope Toggle (Zoom-Out only with Sniper!)
      if (actionsRef.current.triggerScopeToggle) {
        actionsRef.current.triggerScopeToggle = false;
        if (currentPlayerWeapon.isSniper) {
          isScopedOut = !isScopedOut;
          soundFx.playScopeToggle(isScopedOut);
          spawnFloatingText(
            player.x,
            player.y - 48,
            isScopedOut ? 'SNIPER SCOPE: ZOOMED OUT (0.5X)' : 'SCOPE: 1X NORMAL',
            '#18F2B2'
          );
        } else {
          isScopedOut = false;
          soundFx.playScopeDenied();
          scopeWarningText = `${currentPlayerWeapon.shortName} CANNOT ZOOM OUT (SNIPER ONLY!)`;
          scopeWarningTimer = 2.4;
          spawnFloatingText(player.x, player.y - 48, 'SNIPER REQUIRED TO ZOOM OUT!', '#F43F5E');
        }
      }

      // 2. Swap Weapon
      if (actionsRef.current.triggerSwapWeapon) {
        actionsRef.current.triggerSwapWeapon = false;
        const temp = player.activeWeapon;
        player.activeWeapon = player.secondaryWeapon;
        player.secondaryWeapon = temp;
        player.ammo = WEAPONS[player.activeWeapon].magSize;
        player.reserveAmmo = WEAPONS[player.activeWeapon].magSize * 4;
        player.reloadingTimer = 0;
        soundFx.playPickup();

        if (!WEAPONS[player.activeWeapon].isSniper && isScopedOut) {
          isScopedOut = false;
          scopeWarningText = 'SCOPE RESET TO 1X (NON-SNIPER EQUIPPED)';
          scopeWarningTimer = 1.8;
        }
      }

      // 3. Reload Weapon
      if (actionsRef.current.triggerReload) {
        actionsRef.current.triggerReload = false;
        if (player.reloadingTimer <= 0 && player.ammo < currentPlayerWeapon.magSize) {
          player.reloadingTimer = currentPlayerWeapon.reloadTime;
          soundFx.playPickup();
        }
      }

      // 4. Throw Grenade
      if (actionsRef.current.triggerGrenade) {
        actionsRef.current.triggerGrenade = false;
        if (grenadesCount > 0 && player.hp > 0) {
          grenadesCount -= 1;
          soundFx.playShoot(false, true);
          bullets.push({
            id: `grenade_${Date.now()}`,
            ownerId: player.id,
            isPlayer: true,
            isPet: false,
            isGrenade: true,
            x: player.x,
            y: player.y - 10,
            vx: Math.cos(player.aimAngle) * 580,
            vy: Math.sin(player.aimAngle) * 580 - 160,
            damage: 90,
            color: '#10B981',
            radius: 9,
            explosiveRadius: 135,
            homing: false,
            life: 1.5,
            trail: [{ x: player.x, y: player.y - 10 }],
          });
        }
      }

      // 5. Instant Heal Medkit Button (up to 10 in inventory)
      if (actionsRef.current.triggerMedkit) {
        actionsRef.current.triggerMedkit = false;
        if (medkitsCount > 0 && player.hp > 0 && player.hp < player.maxHp) {
          medkitsCount -= 1;
          onMedkitCountChange(medkitsCount);
          const healAmount = Math.min(65, player.maxHp - player.hp);
          player.hp = Math.min(player.maxHp, player.hp + 65);
          soundFx.playMedkitHeal();
          spawnParticles(player.x, player.y, '#18F2B2', 20, 240);
          spawnFloatingText(player.x, player.y - 44, `+${Math.round(healAmount)} HP INSTANT HEAL!`, '#18F2B2');
        } else if (medkitsCount <= 0) {
          soundFx.playScopeDenied();
          spawnFloatingText(player.x, player.y - 44, '0/10 MEDKITS LEFT!', '#F43F5E');
        } else if (player.hp >= player.maxHp) {
          spawnFloatingText(player.x, player.y - 44, 'HP FULL!', '#18F2B2');
        }
      }

      // 6. Character Special Ability (Parth, Siddharth, Yug)
      if (actionsRef.current.triggerAbility) {
        actionsRef.current.triggerAbility = false;
        if (player.abilityCooldown <= 0 && player.hp > 0) {
          player.abilityTimer = charSpec.abilityDuration;
          player.abilityCooldown = charSpec.abilityCooldown;
          soundFx.playAbility();
          spawnParticles(player.x, player.y, charSpec.primaryColor, 26, 300);
          spawnFloatingText(
            player.x,
            player.y - 54,
            `${charSpec.name.toUpperCase()}: ${charSpec.abilityName.toUpperCase()}!`,
            charSpec.primaryColor
          );

          if (player.characterId === 'yug') {
            player.jetpack = player.maxJetpack;
            for (let m = 0; m < 5; m++) {
              const ang = -Math.PI / 2 + (m - 2) * 0.35;
              bullets.push({
                id: `yug_missile_${Date.now()}_${m}`,
                ownerId: player.id,
                isPlayer: true,
                isPet: false,
                x: player.x,
                y: player.y - 20,
                vx: Math.cos(ang) * 640,
                vy: Math.sin(ang) * 640,
                damage: 45,
                color: '#F59E0B',
                radius: 7,
                explosiveRadius: 90,
                homing: true,
                life: 2.4,
                trail: [{ x: player.x, y: player.y - 20 }],
              });
            }
          }
        }
      }

      // Find nearest ground weapon to player
      let nearestWeaponItem: GroundItem | null = null;
      let nearestWeaponDist = Infinity;
      for (const item of groundItems) {
        if (item.respawnTimer > 0) continue;
        const d = Math.hypot(item.x - player.x, item.y - player.y);
        if (item.kind === 'weapon' && d < 155 && d < nearestWeaponDist) {
          nearestWeaponDist = d;
          nearestWeaponItem = item;
        } else if (item.kind === 'medkit' && d < 52 && player.hp > 0) {
          if (medkitsCount < 10) {
            medkitsCount = Math.min(10, medkitsCount + 1);
            onMedkitCountChange(medkitsCount);
            item.respawnTimer = 14;
            soundFx.playPickup();
            spawnFloatingText(player.x, player.y - 38, '+1 MEDKIT (INVENTORY)', '#18F2B2');
          } else if (player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 40);
            item.respawnTimer = 14;
            soundFx.playMedkitHeal();
            spawnFloatingText(player.x, player.y - 38, '+40 HP MEDKIT', '#18F2B2');
          }
        } else if (item.kind === 'coin' && d < 65 && player.hp > 0) {
          matchCoinsEarned += 25;
          item.respawnTimer = 999;
          soundFx.playPickup();
          spawnFloatingText(item.x, item.y - 20, '+25 COINS', '#FACC15');
        }
      }

      // 7. Pick Up Ground Weapon Button
      if (actionsRef.current.triggerPickup) {
        actionsRef.current.triggerPickup = false;
        if (nearestWeaponItem && nearestWeaponItem.weaponId) {
          const pickedWeapon = nearestWeaponItem.weaponId;
          const droppedWeapon = player.activeWeapon;
          player.activeWeapon = pickedWeapon;
          player.ammo = WEAPONS[pickedWeapon].magSize;
          player.reserveAmmo = WEAPONS[pickedWeapon].magSize * 4;
          player.reloadingTimer = 0;
          nearestWeaponItem.weaponId = droppedWeapon;
          nearestWeaponItem.respawnTimer = 0.4;
          soundFx.playPickup();
          spawnFloatingText(
            player.x,
            player.y - 46,
            `PICKED UP ${WEAPONS[pickedWeapon].shortName.toUpperCase()}`,
            '#FFFFFF'
          );
          if (!WEAPONS[pickedWeapon].isSniper && isScopedOut) {
            isScopedOut = false;
          }
        } else {
          spawnFloatingText(player.x, player.y - 38, 'MOVE CLOSER TO A GUN TO PICK UP', '#FEF08A');
        }
      }

      for (const item of groundItems) {
        if (item.respawnTimer > 0 && item.respawnTimer < 500) {
          item.respawnTimer = Math.max(0, item.respawnTimer - dt);
        }
        item.bobOffset += dt * 3;
      }

      // Update Fighters
      for (const f of fighters) {
        if (f.respawnTimer > 0) {
          f.respawnTimer -= dt;
          if (f.respawnTimer <= 0) {
            f.hp = f.maxHp;
            f.jetpack = f.maxJetpack;
            f.x = 320 + Math.random() * (ARENA_WIDTH - 640);
            f.y = 260;
            f.vx = 0;
            f.vy = 0;
            f.ammo = WEAPONS[f.activeWeapon].magSize;
            f.reserveAmmo = WEAPONS[f.activeWeapon].magSize * 4;
            if (f.isPlayer) {
              grenadesCount = 3;
            }
            spawnParticles(f.x, f.y, CHARACTERS[f.characterId].primaryColor, 16, 220);
          }
          continue;
        }

        if (f.hitFlashTimer > 0) f.hitFlashTimer = Math.max(0, f.hitFlashTimer - dt);
        if (f.abilityTimer > 0) f.abilityTimer = Math.max(0, f.abilityTimer - dt);
        if (f.abilityCooldown > 0) f.abilityCooldown = Math.max(0, f.abilityCooldown - dt);
        if (f.fireCooldown > 0) f.fireCooldown = Math.max(0, f.fireCooldown - dt);

        const fWeapon = WEAPONS[f.activeWeapon];
        if (f.reloadingTimer > 0) {
          f.reloadingTimer -= dt;
          if (f.reloadingTimer <= 0) {
            f.ammo = fWeapon.magSize;
          }
        }

        const fChar = CHARACTERS[f.characterId];
        const sensMult = f.isPlayer ? 0.65 + moveSensitivity * 0.45 : 0.88;
        const moveMult =
          fChar.moveSpeedMult * (f.isPlayer ? 1 + petSpec.speedBonus * petPowerMult : 1) * sensMult;
        const maxSpeed = 340 * moveMult;

        if (f.isPlayer) {
          let moveX = moveJoystickRef.current.active ? moveJoystickRef.current.x : 0;
          let moveY = moveJoystickRef.current.active ? moveJoystickRef.current.y : 0;

          if (keysHeld.has('KeyA') || keysHeld.has('ArrowLeft')) moveX -= 1;
          if (keysHeld.has('KeyD') || keysHeld.has('ArrowRight')) moveX += 1;
          if (keysHeld.has('KeyW') || keysHeld.has('ArrowUp') || keysHeld.has('Space')) moveY -= 1;
          if (keysHeld.has('KeyS') || keysHeld.has('ArrowDown')) moveY += 1;

          f.vx = moveX * maxSpeed;

          const wantsJetpack = moveY < -0.25;
          const infiniteJetpack = f.abilityTimer > 0 && f.characterId === 'yug';

          if (wantsJetpack && (f.jetpack > 2 || infiniteJetpack)) {
            f.vy = Math.max(f.vy - 1180 * dt, -430);
            if (!infiniteJetpack) {
              f.jetpack = Math.max(0, f.jetpack - 32 * dt);
            }
            if (Math.random() < 0.8) {
              particles.push({
                x: f.x - f.facing * 14,
                y: f.y + 22,
                vx: (Math.random() - 0.5) * 65,
                vy: 140 + Math.random() * 90,
                radius: 4 + Math.random() * 3,
                color: infiniteJetpack ? '#FACC15' : '#A78BFA',
                alpha: 0.95,
                life: 0.2,
                maxLife: 0.2,
              });
            }
          } else {
            const regenRate = f.characterId === 'parth' ? 30 : 24;
            f.jetpack = Math.min(f.maxJetpack, f.jetpack + regenRate * dt);
          }

          let wantsFire = actionsRef.current.holdFireButton || mouseDownHeld;
          if (aimJoystickRef.current.active && aimJoystickRef.current.magnitude > 0.1) {
            const targetAng = Math.atan2(aimJoystickRef.current.y, aimJoystickRef.current.x);
            f.aimAngle = targetAng;
            mouseAimActive = false;
            if (aimJoystickRef.current.magnitude > 0.38) {
              wantsFire = true;
            }
          } else if (mouseAimActive) {
            const worldMouseX =
              cameraX + (mouseScreenX - canvas.width / 2) / currentCameraZoom;
            const worldMouseY =
              cameraY + (mouseScreenY - canvas.height / 2) / currentCameraZoom;
            f.aimAngle = Math.atan2(worldMouseY - f.y, worldMouseX - f.x);
          }

          f.facing = Math.cos(f.aimAngle) >= 0 ? 1 : -1;

          if (wantsFire && f.reloadingTimer <= 0 && f.fireCooldown <= 0) {
            if (f.ammo > 0) {
              f.ammo -= 1;
              const fireIntervalMult =
                f.abilityTimer > 0 && f.characterId === 'parth' ? 0.62 : 1.0;
              f.fireCooldown = fWeapon.fireInterval * fireIntervalMult;
              fireWeapon(f, fWeapon);
              if (f.ammo <= 0) {
                f.reloadingTimer = fWeapon.reloadTime;
              }
            } else {
              f.reloadingTimer = fWeapon.reloadTime;
            }
          }
        } else {
          // Bot AI
          f.aiTargetTimer -= dt;
          let target: FighterEntity | null = null;
          let bestDist = Infinity;
          for (const other of fighters) {
            if (other.id === f.id || other.respawnTimer > 0) continue;
            const d = Math.hypot(other.x - f.x, other.y - f.y);
            const weightedD = other.isPlayer ? d * 0.85 : d;
            if (weightedD < bestDist) {
              bestDist = weightedD;
              target = other;
            }
          }

          if (f.aiTargetTimer <= 0) {
            f.aiTargetTimer = 0.6 + Math.random() * 0.8;
            if (target) {
              const dx = target.x - f.x;
              f.aiMoveDir = Math.abs(dx) > 220 ? Math.sign(dx) : Math.random() < 0.5 ? -1 : 1;
              f.aiJetpackActive = target.y < f.y - 70 || Math.random() < 0.35;
            } else {
              f.aiMoveDir = Math.random() < 0.5 ? -1 : 1;
              f.aiJetpackActive = false;
            }
          }

          f.vx = f.aiMoveDir * maxSpeed * 0.72;
          if (f.aiJetpackActive && f.jetpack > 15) {
            f.vy = Math.max(f.vy - 980 * dt, -340);
            f.jetpack = Math.max(0, f.jetpack - 28 * dt);
          } else {
            f.jetpack = Math.min(f.maxJetpack, f.jetpack + 20 * dt);
          }

          if (target) {
            const desiredAngle = Math.atan2(target.y - f.y, target.x - f.x);
            f.aimAngle = desiredAngle + (Math.random() - 0.5) * 0.08;
            f.facing = Math.cos(f.aimAngle) >= 0 ? 1 : -1;

            const distToTarget = Math.hypot(target.x - f.x, target.y - f.y);
            if (distToTarget < 900 && f.reloadingTimer <= 0 && f.fireCooldown <= 0) {
              if (f.ammo > 0) {
                f.ammo -= 1;
                f.fireCooldown = fWeapon.fireInterval * 1.5;
                fireWeapon(f, fWeapon);
                if (f.ammo <= 0) {
                  f.reloadingTimer = fWeapon.reloadTime;
                }
              } else {
                f.reloadingTimer = fWeapon.reloadTime;
              }
            }
          }
        }

        // Gravity & Platform Collisions
        f.vy = Math.min(f.vy + 780 * dt, 680);
        const prevBottom = f.y + f.radius;
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        f.x = Math.max(f.radius + 24, Math.min(ARENA_WIDTH - f.radius - 24, f.x));
        if (f.y < f.radius + 30) {
          f.y = f.radius + 30;
          f.vy = Math.max(0, f.vy);
        }

        const newBottom = f.y + f.radius;
        for (const plat of ARENA_PLATFORMS) {
          if (
            f.x + f.radius * 0.7 > plat.x &&
            f.x - f.radius * 0.7 < plat.x + plat.w &&
            f.vy >= 0 &&
            prevBottom <= plat.y + 16 &&
            newBottom >= plat.y
          ) {
            f.y = plat.y - f.radius;
            f.vy = 0;
            break;
          }
        }
      }

      // Update Pet Companion (Sheru, Wolfs, Draky, Pegasus, Poink)
      if (player.respawnTimer <= 0) {
        petState.bobPhase += dt * 4.5;
        const targetPetX = player.x - player.facing * 52;
        const targetPetY = player.y - 42 + Math.sin(petState.bobPhase) * 8;
        petState.x += (targetPetX - petState.x) * Math.min(1, dt * 8);
        petState.y += (targetPetY - petState.y) * Math.min(1, dt * 8);

        const healPerSec = petSpec.healPerSec * petPowerMult;
        if (player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + healPerSec * dt);
          petState.healAccum += healPerSec * dt;
          if (petState.healAccum >= 10) {
            petState.healAccum = 0;
            spawnParticles(player.x, player.y, '#18F2B2', 4, 90);
          }
        }

        petState.attackTimer -= dt;
        if (petState.attackTimer <= 0) {
          let nearestEnemy: FighterEntity | null = null;
          let minDist = 720;
          for (const f of fighters) {
            if (f.isPlayer || f.respawnTimer > 0) continue;
            const d = Math.hypot(f.x - petState.x, f.y - petState.y);
            if (d < minDist) {
              minDist = d;
              nearestEnemy = f;
            }
          }

          if (nearestEnemy) {
            petState.attackTimer = Math.max(0.55, petSpec.attackCooldown / Math.sqrt(petPowerMult));
            const ang = Math.atan2(nearestEnemy.y - petState.y, nearestEnemy.x - petState.x);
            bullets.push({
              id: `pet_proj_${Date.now()}`,
              ownerId: player.id,
              isPlayer: true,
              isPet: true,
              x: petState.x,
              y: petState.y,
              vx: Math.cos(ang) * 780,
              vy: Math.sin(ang) * 780,
              damage: Math.round(petSpec.attackDamage * petPowerMult),
              color: petSpec.primaryColor,
              radius: 7,
              explosiveRadius:
                petSpec.projectileType === 'nova' || petSpec.projectileType === 'fireball' ? 65 : 0,
              homing: true,
              life: 1.6,
              trail: [{ x: petState.x, y: petState.y }],
            });
            spawnParticles(petState.x, petState.y, petSpec.accentColor, 6, 140);
          } else {
            petState.attackTimer = 0.35;
          }
        }
      }

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.life -= dt;
        if (b.isGrenade) {
          b.vy += 640 * dt;
        }
        if (b.life <= 0) {
          if (b.explosiveRadius > 0) {
            spawnParticles(b.x, b.y, '#F97316', 24, 320);
            screenShake = Math.max(screenShake, 9);
            for (const f of fighters) {
              if (f.id === b.ownerId || f.respawnTimer > 0) continue;
              const d = Math.hypot(f.x - b.x, f.y - b.y);
              if (d <= b.explosiveRadius + f.radius) {
                applyDamage(
                  f,
                  b.ownerId,
                  Math.round(b.damage * (1 - d / (b.explosiveRadius * 1.5))),
                  b.isPet
                );
              }
            }
          }
          bullets.splice(i, 1);
          continue;
        }

        if (b.homing) {
          let closestTarget: FighterEntity | null = null;
          let minD = 550;
          for (const f of fighters) {
            if (f.id === b.ownerId || f.respawnTimer > 0) continue;
            const d = Math.hypot(f.x - b.x, f.y - b.y);
            if (d < minD) {
              minD = d;
              closestTarget = f;
            }
          }
          if (closestTarget) {
            const desiredAngle = Math.atan2(closestTarget.y - b.y, closestTarget.x - b.x);
            const speed = Math.hypot(b.vx, b.vy);
            b.vx += (Math.cos(desiredAngle) * speed - b.vx) * Math.min(1, dt * 6);
            b.vy += (Math.sin(desiredAngle) * speed - b.vy) * Math.min(1, dt * 6);
          }
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 7) b.trail.shift();

        let hitWall = false;
        for (const plat of ARENA_PLATFORMS) {
          if (
            b.x >= plat.x &&
            b.x <= plat.x + plat.w &&
            b.y >= plat.y &&
            b.y <= plat.y + plat.h
          ) {
            hitWall = true;
            break;
          }
        }

        let hitFighter: FighterEntity | null = null;
        for (const f of fighters) {
          if (f.id === b.ownerId || f.respawnTimer > 0) continue;
          if (Math.hypot(f.x - b.x, f.y - b.y) <= f.radius + b.radius) {
            hitFighter = f;
            break;
          }
        }

        if (hitFighter || hitWall) {
          if (b.explosiveRadius > 0) {
            spawnParticles(b.x, b.y, '#F97316', 24, 320);
            screenShake = Math.max(screenShake, 8);
            for (const f of fighters) {
              if (f.id === b.ownerId || f.respawnTimer > 0) continue;
              const d = Math.hypot(f.x - b.x, f.y - b.y);
              if (d <= b.explosiveRadius + f.radius) {
                applyDamage(
                  f,
                  b.ownerId,
                  Math.round(b.damage * (1 - d / (b.explosiveRadius * 1.5))),
                  b.isPet
                );
              }
            }
          } else if (hitFighter) {
            applyDamage(hitFighter, b.ownerId, b.damage, b.isPet);
          } else {
            spawnParticles(b.x, b.y, '#FFFFFF', 5, 110);
          }
          bullets.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
      }

      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.life -= dt;
        ft.y -= 38 * dt;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
      }

      const targetZoom =
        isScopedOut && currentPlayerWeapon.isSniper
          ? currentPlayerWeapon.scopeZoom * (player.characterId === 'siddharth' ? 0.92 : 1.0)
          : 1.0;
      currentCameraZoom += (targetZoom - currentCameraZoom) * Math.min(1, dt * 7.5);

      const lookAheadDist = isScopedOut ? 220 : 55;
      const targetCamX = player.x + Math.cos(player.aimAngle) * lookAheadDist;
      const targetCamY = player.y + Math.sin(player.aimAngle) * lookAheadDist * 0.65;

      cameraX += (targetCamX - cameraX) * Math.min(1, dt * 8);
      cameraY += (targetCamY - cameraY) * Math.min(1, dt * 8);
      screenShake = Math.max(0, screenShake - dt * 24);
    };

    const applyDamage = (
      victim: FighterEntity,
      attackerId: string,
      rawDamage: number,
      fromPet: boolean
    ) => {
      let dmg = rawDamage;
      if (victim.abilityTimer > 0 && victim.characterId === 'parth') {
        dmg = Math.round(dmg * 0.3);
      }
      if (victim.isPlayer) {
        dmg = Math.round(dmg * (1 - petSpec.damageReduction));
      }

      victim.hp -= dmg;
      victim.hitFlashTimer = 0.12;
      spawnParticles(victim.x, victim.y, '#EF4444', 9, 190);
      spawnFloatingText(
        victim.x + (Math.random() - 0.5) * 20,
        victim.y - 32,
        `-${dmg}${fromPet ? ` (${petSpec.name})` : ''}`,
        fromPet ? petSpec.primaryColor : '#FF4D6D'
      );

      if (attackerId === player.id) {
        soundFx.playHit(victim.hp <= 0);
      }

      if (victim.hp <= 0) {
        victim.hp = 0;
        victim.deaths += 1;
        victim.respawnTimer = 3.0;
        spawnParticles(victim.x, victim.y, CHARACTERS[victim.characterId].primaryColor, 28, 340);

        const attacker = fighters.find((f) => f.id === attackerId);
        if (attacker) {
          attacker.kills += 1;
          if (attacker.isPlayer) {
            matchCoinsEarned += 40;
            hitstopTimer = 0.045;
            screenShake = Math.max(screenShake, 11);
            spawnFloatingText(victim.x, victim.y - 54, 'ELIMINATED! +40 COINS', '#FACC15');
          }
          addKillFeed(
            `${attacker.name}${fromPet ? ` + ${petSpec.name}` : ''} K.O. ${victim.name}`,
            attacker.isPlayer ? '#18F2B2' : '#FACC15'
          );
        }

        groundItems.push({
          id: `drop_coin_${Date.now()}_${Math.random()}`,
          kind: 'coin',
          x: victim.x,
          y: victim.y - 10,
          respawnTimer: 0,
          bobOffset: 0,
        });
      }
    };

    const renderArena = () => {
      ctx.save();

      // 1. Bright Mini-Militia Turquoise/Sky Backdrop matching Screenshot 2
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#85DCEB');
      skyGrad.addColorStop(0.55, '#68C9BA');
      skyGrad.addColorStop(1, '#3CA385');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Soft Sun & Clouds in Sky
      const sunScreenX = canvas.width * 0.76 - (cameraX - 1300) * 0.05;
      const sunScreenY = canvas.height * 0.22 - (cameraY - 700) * 0.04;
      ctx.beginPath();
      ctx.arc(sunScreenX, sunScreenY, 54, 0, Math.PI * 2);
      ctx.fillStyle = '#FDF6C7';
      ctx.fill();

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.beginPath();
      ctx.roundRect(sunScreenX - 95, sunScreenY - 30, 120, 32, 16);
      ctx.roundRect(sunScreenX + 20, sunScreenY - 12, 95, 26, 13);
      ctx.fill();

      // Distant Hills Silhouette
      ctx.beginPath();
      ctx.arc(canvas.width * 0.35 - cameraX * 0.08, canvas.height * 0.85, 420, Math.PI, 0);
      ctx.arc(canvas.width * 0.8 - cameraX * 0.08, canvas.height * 0.9, 380, Math.PI, 0);
      ctx.fillStyle = 'rgba(69, 162, 158, 0.45)';
      ctx.fill();

      // Camera Transform + Scope Zoom-Out
      const shakeX = (Math.random() - 0.5) * screenShake * 2;
      const shakeY = (Math.random() - 0.5) * screenShake * 2;

      ctx.translate(canvas.width / 2 + shakeX, canvas.height / 2 + shakeY);
      ctx.scale(currentCameraZoom, currentCameraZoom);
      ctx.translate(-cameraX, -cameraY);

      // Background Dark Brown Cavern Pillars (connecting islands like Screenshot 2)
      ctx.fillStyle = '#4B3628';
      ctx.fillRect(260, 560, 140, 700);
      ctx.fillRect(2180, 560, 140, 700);
      ctx.fillRect(620, 840, 130, 420);
      ctx.fillRect(1820, 840, 130, 420);
      ctx.fillRect(1220, 690, 160, 570);

      // Vibrant Green Grass Tufts behind main ledges
      ctx.fillStyle = '#7CE089';
      for (let gx = 120; gx < ARENA_WIDTH - 120; gx += 160) {
        ctx.beginPath();
        ctx.moveTo(gx, 1260);
        ctx.lineTo(gx - 24, 1190);
        ctx.lineTo(gx - 4, 1230);
        ctx.lineTo(gx + 10, 1180);
        ctx.lineTo(gx + 22, 1230);
        ctx.lineTo(gx + 40, 1195);
        ctx.lineTo(gx + 28, 1260);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Organic Rocky Dirt Platforms with Bright Green Grass Tops & Thick Black Outlines
      for (const plat of ARENA_PLATFORMS) {
        ctx.save();
        const depth = plat.type === 'ground' ? 140 : 68;

        // Organic bevel rock shape
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y + 8);
        ctx.lineTo(plat.x + 10, plat.y);
        ctx.lineTo(plat.x + plat.w - 10, plat.y);
        ctx.lineTo(plat.x + plat.w, plat.y + 8);
        ctx.lineTo(plat.x + plat.w - 16, plat.y + depth * 0.72);
        ctx.lineTo(plat.x + plat.w * 0.65, plat.y + depth);
        ctx.lineTo(plat.x + plat.w * 0.35, plat.y + depth * 0.92);
        ctx.lineTo(plat.x + 16, plat.y + depth * 0.72);
        ctx.closePath();

        // Rich terracotta brown fill
        ctx.fillStyle = '#9E6846';
        ctx.fill();

        // Inner lighter tan rock highlight
        ctx.strokeStyle = '#BA8560';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Outer Bold Black Cartoon Outline
        ctx.strokeStyle = '#1C120C';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Bright Emerald Grass Strip along top surface
        ctx.beginPath();
        ctx.roundRect(plat.x + 4, plat.y - 3, plat.w - 8, 11, 5);
        ctx.fillStyle = '#12B952';
        ctx.fill();
        ctx.strokeStyle = '#1C120C';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
      }

      // Draw Ground Weapons (with Soft White Radial Glow) & White/Red Medkits
      for (const item of groundItems) {
        if (item.respawnTimer > 0) continue;
        const bobY = item.y + Math.sin(item.bobOffset) * 4;

        if (item.kind === 'weapon' && item.weaponId) {
          const wSpec = WEAPONS[item.weaponId];
          const distToPlayer = Math.hypot(item.x - player.x, item.y - player.y);
          const isNear = distToPlayer < 155;

          ctx.save();
          // Soft White Radial Glow matching Screenshot 2
          const glowGrad = ctx.createRadialGradient(item.x, bobY, 4, item.x, bobY, 38);
          glowGrad.addColorStop(0, isNear ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.75)');
          glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(item.x, bobY, 38, 0, Math.PI * 2);
          ctx.fill();

          // Cartoon Gun Sprite with crisp dark outline
          ctx.fillStyle = wSpec.color;
          ctx.strokeStyle = '#18181B';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(item.x - 18, bobY - 6, 30, 11, 2);
          ctx.fill();
          ctx.stroke();

          // Barrel & Grip
          ctx.fillStyle = '#3F3F46';
          ctx.fillRect(item.x + 12, bobY - 4, wSpec.isSniper ? 20 : 12, 5);
          ctx.strokeRect(item.x + 12, bobY - 4, wSpec.isSniper ? 20 : 12, 5);
          ctx.fillRect(item.x - 8, bobY + 5, 7, 10);
          ctx.strokeRect(item.x - 8, bobY + 5, 7, 10);

          if (wSpec.isSniper) {
            // Sniper Scope on top
            ctx.fillStyle = '#18181B';
            ctx.fillRect(item.x - 10, bobY - 13, 18, 5);
          }

          if (isNear) {
            ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            const txt = `${wSpec.shortName}${wSpec.isSniper ? ' [SCOPE]' : ''}`;
            ctx.strokeText(txt, item.x, bobY - 22);
            ctx.fillStyle = '#18F2B2';
            ctx.fillText(txt, item.x, bobY - 22);
          }
          ctx.restore();
        } else if (item.kind === 'medkit') {
          // Exact White Box with Red Cross from Screenshot 2
          ctx.save();
          const glowGrad = ctx.createRadialGradient(item.x, bobY, 2, item.x, bobY, 30);
          glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(item.x, bobY, 30, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#18181B';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(item.x - 13, bobY - 11, 26, 22, 4);
          ctx.fill();
          ctx.stroke();

          // Red Cross
          ctx.fillStyle = '#E11D48';
          ctx.fillRect(item.x - 3, bobY - 7, 6, 14);
          ctx.fillRect(item.x - 7, bobY - 3, 14, 6);
          ctx.restore();
        } else if (item.kind === 'coin') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(item.x, bobY, 11, 0, Math.PI * 2);
          ctx.fillStyle = '#FACC15';
          ctx.fill();
          ctx.strokeStyle = '#18181B';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Dashed Aim Line (- - - -) for Player & Sniper Laser Sight
      for (const f of fighters) {
        if (f.respawnTimer > 0) continue;
        const wSpec = WEAPONS[f.activeWeapon];
        if (f.isPlayer) {
          ctx.save();
          ctx.beginPath();
          const startX = f.x + Math.cos(f.aimAngle) * 34;
          const startY = f.y + 4 + Math.sin(f.aimAngle) * 34;
          const aimLen = isScopedOut && wSpec.isSniper ? 1600 : 240;
          ctx.setLineDash([10, 10]);
          ctx.moveTo(startX, startY);
          ctx.lineTo(
            startX + Math.cos(f.aimAngle) * aimLen,
            startY + Math.sin(f.aimAngle) * aimLen
          );
          ctx.strokeStyle =
            isScopedOut && wSpec.isSniper
              ? 'rgba(239, 68, 68, 0.85)'
              : 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Cartoon Chibi Fighters (Parth, Siddharth, Yug & Bots) matching Screenshot 2
      for (const f of fighters) {
        if (f.respawnTimer > 0) continue;
        const cSpec = CHARACTERS[f.characterId];
        const wSpec = WEAPONS[f.activeWeapon];

        ctx.save();
        ctx.translate(f.x, f.y);

        // Parth Aegis Shield Dome
        if (f.abilityTimer > 0 && f.characterId === 'parth') {
          ctx.beginPath();
          ctx.arc(0, 0, f.radius + 18, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#38BDF8';
          ctx.stroke();
        }

        // Jetpack Backpack
        ctx.fillStyle = '#1E1B2E';
        ctx.strokeStyle = '#09070B';
        ctx.lineWidth = 3;
        ctx.fillRect(-f.facing * 16 - 6, -4, 12, 22);
        ctx.strokeRect(-f.facing * 16 - 6, -4, 12, 22);

        // Chibi Legs & Sneakers
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-9, 14, 7, 11);
        ctx.fillRect(2, 14, 7, 11);
        ctx.fillStyle = cSpec.primaryColor;
        ctx.fillRect(-11, 22, 10, 5);
        ctx.fillRect(1, 22, 10, 5);

        // Chibi Torso Jacket
        ctx.fillStyle = f.hitFlashTimer > 0 ? '#FFFFFF' : '#1A2634';
        ctx.beginPath();
        ctx.roundRect(-13, 0, 26, 18, 5);
        ctx.fill();
        ctx.stroke();
        // Neon center stripe
        ctx.fillStyle = cSpec.primaryColor;
        ctx.fillRect(-2, 2, 4, 14);

        // Chibi Head
        ctx.beginPath();
        ctx.arc(0, -10, 15, 0, Math.PI * 2);
        ctx.fillStyle = f.hitFlashTimer > 0 ? '#FFFFFF' : '#D99B66';
        ctx.fill();
        ctx.stroke();

        // Dark Hair Quiff
        ctx.fillStyle = '#1E1926';
        ctx.beginPath();
        ctx.arc(0, -15, 14, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Glasses & Headset Earcup
        ctx.fillStyle = '#E2E8F0';
        ctx.strokeStyle = '#A78BFA';
        ctx.lineWidth = 2;
        ctx.fillRect(f.facing > 0 ? 0 : -12, -14, 11, 7);
        ctx.strokeRect(f.facing > 0 ? 0 : -12, -14, 11, 7);

        // Glowing Neon Earphone Cup
        ctx.fillStyle = cSpec.primaryColor;
        ctx.strokeStyle = '#09070B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-f.facing * 6 - 4, -15, 7, 12, 3);
        ctx.fill();
        ctx.stroke();

        // Aiming Gun & Hand
        ctx.save();
        ctx.rotate(f.aimAngle);
        ctx.fillStyle = wSpec.color;
        ctx.strokeStyle = '#09070B';
        ctx.lineWidth = 2.5;
        ctx.fillRect(10, -3, wSpec.isSniper ? 26 : 18, 7);
        ctx.strokeRect(10, -3, wSpec.isSniper ? 26 : 18, 7);
        if (wSpec.isSniper) {
          ctx.fillStyle = '#09070B';
          ctx.fillRect(14, -8, 12, 4);
        }
        ctx.restore();

        // Health Bar & Bold Outlined Name Tag above Head matching Screenshot 2
        const barW = 54;
        const barH = 6;
        const hpRatio = Math.max(0, f.hp / f.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barW / 2, -40, barW, barH);
        ctx.fillStyle = f.isPlayer ? '#22C55E' : '#EF4444';
        ctx.fillRect(-barW / 2 + 1, -39, (barW - 2) * hpRatio, barH - 2);

        ctx.font = '900 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.strokeText(f.name, 0, -46);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(f.name, 0, -46);

        ctx.restore();
      }

      // Draw Player's Active Pet Companion (Sheru, Wolfs, Draky, Pegasus, Poink)
      if (player.respawnTimer <= 0) {
        ctx.save();
        ctx.translate(petState.x, petState.y);

        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = petSpec.primaryColor;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#09070B';
        ctx.stroke();

        // Cute Pet Eyes
        ctx.fillStyle = '#09070B';
        ctx.beginPath();
        ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '900 10px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(`${petSpec.name} Lv.${petLevel}`, 0, -20);
        ctx.fillStyle = petSpec.accentColor;
        ctx.fillText(`${petSpec.name} Lv.${petLevel}`, 0, -20);
        ctx.restore();
      }

      // Bullets
      for (const b of bullets) {
        ctx.save();
        if (b.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(b.trail[0].x, b.trail[0].y);
          for (let t = 1; t < b.trail.length; t++) {
            ctx.lineTo(b.trail[t].x, b.trail[t].y);
          }
          ctx.strokeStyle = b.color;
          ctx.lineWidth = b.radius;
          ctx.globalAlpha = 0.65;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.isGrenade ? '#10B981' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#09070B';
        ctx.stroke();
        ctx.restore();
      }

      // Particles
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      }

      // Floating Combat Texts
      for (const ft of floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, ft.life * 1.4);
        ctx.font = '900 14px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore();

      // Draw Red Triangular Enemy Direction Indicators around screen perimeter matching Screenshot 2
      for (const f of fighters) {
        if (f.isPlayer || f.respawnTimer > 0) continue;
        const screenX = canvas.width / 2 + (f.x - cameraX) * currentCameraZoom;
        const screenY = canvas.height / 2 + (f.y - cameraY) * currentCameraZoom;
        const margin = 44;

        if (
          screenX < margin ||
          screenX > canvas.width - margin ||
          screenY < margin + 70 ||
          screenY > canvas.height - margin - 120
        ) {
          const angle = Math.atan2(f.y - cameraY, f.x - cameraX);
          const indicatorX = Math.max(
            margin,
            Math.min(canvas.width - margin, canvas.width / 2 + Math.cos(angle) * (canvas.width * 0.42))
          );
          const indicatorY = Math.max(
            margin + 75,
            Math.min(
              canvas.height - margin - 130,
              canvas.height / 2 + Math.sin(angle) * (canvas.height * 0.36)
            )
          );

          ctx.save();
          ctx.translate(indicatorX, indicatorY);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(14, 0);
          ctx.lineTo(-10, -11);
          ctx.lineTo(-10, 11);
          ctx.closePath();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.fill();
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#FF1E1E';
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    const gameLoop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      if (!pausedRef.current) {
        if (hitstopTimer > 0) {
          hitstopTimer -= dt;
        } else {
          updateSimulation(dt);
        }
      }

      renderArena();

      hudSyncAccum += dt;
      if (hudSyncAccum >= 0.065) {
        hudSyncAccum = 0;
        let nearGun: { id: string; weaponId: WeaponId; distance: number } | null = null;
        let minD = 155;
        for (const item of groundItems) {
          if (item.respawnTimer <= 0 && item.kind === 'weapon' && item.weaponId) {
            const d = Math.hypot(item.x - player.x, item.y - player.y);
            if (d < minD) {
              minD = d;
              nearGun = { id: item.id, weaponId: item.weaponId, distance: Math.round(d) };
            }
          }
        }

        const wSpec = WEAPONS[player.activeWeapon];
        onHudUpdate({
          hp: Math.round(player.hp),
          maxHp: player.maxHp,
          jetpack: Math.round(player.jetpack),
          maxJetpack: player.maxJetpack,
          activeWeapon: player.activeWeapon,
          secondaryWeapon: player.secondaryWeapon,
          ammo: player.ammo,
          reserveAmmo: player.reserveAmmo,
          maxAmmo: wSpec.magSize,
          reloading: player.reloadingTimer > 0,
          isScopedOut,
          canScopeOut: wSpec.isSniper,
          scopeZoomLabel: isScopedOut && wSpec.isSniper ? '0.5X' : '1X',
          scopeWarningText,
          medkits: medkitsCount,
          maxMedkits: 10,
          grenades: grenadesCount,
          abilityCooldownLeft: Math.ceil(player.abilityCooldown),
          abilityActiveLeft: Math.ceil(player.abilityTimer),
          nearbyGroundWeapon: nearGun,
          kills: player.kills,
          deaths: player.deaths,
          killLimit,
          matchCoinsEarned,
          timeRemaining: Math.ceil(matchTimeRemaining),
          killFeed: [...killFeed],
        });
      }

      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
    };
  }, [characterId, petId, petLevel, botCount, killLimit, matchDurationSec, moveSensitivity, aimSpeed, gamerTag]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
    </div>
  );
};
