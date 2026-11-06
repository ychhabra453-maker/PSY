import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Maximize2,
  Trophy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Lock,
  RefreshCw,
  Shuffle,
  X,
  Download,
  HeartPulse,
  Crosshair,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  CHARACTERS,
  CharacterId,
  PETS,
  PET_MAP,
  PetId,
  WEAPONS,
  WeaponId,
} from './data/gameData';
import { ArenaCanvas, HudSnapshot, MatchEndSummary } from './components/ArenaCanvas';
import { VirtualJoystick, JoystickVector } from './components/VirtualJoystick';
import {
  CartoonOperativeSvg,
  AvatarCustomization,
  DEFAULT_CUSTOMIZATIONS,
  PetAvatarSvg,
  WeaponIconSvg,
} from './components/SpriteRenderer';
import { soundFx } from './utils/soundFx';
import { usePWAInstall } from './utils/usePWAInstall';

type ScreenView =
  | 'HOME'
  | 'PLAY_ONLINE'
  | 'CUSTOM_BATTLE'
  | 'AVATAR'
  | 'ARMORY_PETS'
  | 'PROFILE'
  | 'PLAYING'
  | 'PAUSED'
  | 'ROUND_SUMMARY';

const ACCENT_SWATCHES = [
  '#A855F7',
  '#F59E0B',
  '#10B981',
  '#38BDF8',
  '#EC4899',
  '#C4B5FD',
  '#A3E635',
  '#F5F5DC',
];

const HEADGEAR_OPTIONS = [
  { id: 'NEON HEADSET', label: 'NEON HEADSET', free: true },
  { id: 'BARE HEAD', label: 'BARE HEAD', free: true },
  { id: 'PSY BANDANA', label: 'PSY BANDANA', free: true },
  { id: 'AMBER BANDANA', label: 'AMBER BANDANA', free: true },
  { id: 'PSY CAP', label: 'PSY CAP', rankReq: 'RANK 2 · CHAT REGULAR' },
  { id: 'STUDIO CAP', label: 'STUDIO CAP', coinCost: 40 },
  { id: 'BUILDER BUCKET', label: 'BUILDER BUCKET', coinCost: 60 },
  { id: 'STREAM HEADSET', label: 'STREAM HEADSET', rankReq: 'RANK 4 · BLOCK BUILDER' },
  { id: 'NIGHT BEANIE', label: 'NIGHT BEANIE', coinCost: 80 },
  { id: 'FROST BEANIE', label: 'FROST BEANIE', free: true },
  { id: 'EMBER CAP', label: 'EMBER CAP', free: true },
];

const HAIR_OPTIONS = ['PSY QUIFF', 'RECON SPIKES', 'BLAZE QUIFF', 'CLASSIC CREW'];
const FACE_OPTIONS = ['TACTICAL FRAMES', 'HAWKEYE FRAMES', 'COMMANDO FRAMES', 'CYBER VISOR'];
const SKIN_OPTIONS = ['TAN', 'WARM', 'LIGHT', 'DEEP'];
const TOP_OPTIONS = ['NEON PSY JACKET', 'AEGIS JACKET', 'PHANTOM JACKET', 'NITRO JACKET'];
const JOGGERS_OPTIONS = ['NEON TRACK JOGGERS', 'STEALTH JOGGERS', 'BLAZE JOGGERS'];
const SNEAKERS_OPTIONS = ['NEON SNEAKERS', 'EMERALD KICKS', 'SOLAR SNEAKERS'];

const PSY_RANKS = [
  { rank: 1, name: 'PSY ROOKIE', xpRequired: 0 },
  { rank: 2, name: 'SHERU HANDLER', xpRequired: 100 },
  { rank: 3, name: 'SQUADMATE', xpRequired: 200 },
  { rank: 4, name: 'SNIPER MARKSMAN', xpRequired: 300 },
  { rank: 5, name: 'OUTPOST EXPLORER', xpRequired: 500 },
  { rank: 6, name: 'CLUTCH PLAYER', xpRequired: 800 },
  { rank: 7, name: 'RAID CAPTAIN', xpRequired: 1200 },
  { rank: 8, name: 'PSY VETERAN', xpRequired: 1800 },
  { rank: 9, name: 'APEX COMMANDER', xpRequired: 2500 },
  { rank: 10, name: 'PSY LEGEND', xpRequired: 3200 },
];

const MAP_CARDS = [
  {
    id: 'psy_outpost',
    name: 'PSY OUTPOST',
    subtitle: 'The PSY Squad home base',
    pilots: 'BEST FOR 2–6 PILOTS',
    sky: '#C4B5FD',
    ground: '#65A30D',
    dirt: '#854D0E',
  },
  {
    id: 'sheru_cavern',
    name: 'SHERU CAVERN',
    subtitle: 'Underground sniper vault',
    pilots: 'BEST FOR 4–6 PILOTS',
    sky: '#FDE68A',
    ground: '#CA8A04',
    dirt: '#713F12',
  },
  {
    id: 'sniper_tower',
    name: 'SNIPER TOWER',
    subtitle: 'High-altitude twin spires',
    pilots: 'BEST FOR SNIPERS',
    sky: '#BAE6FD',
    ground: '#4ADE80',
    dirt: '#78350F',
  },
  {
    id: 'raid_bunker',
    name: 'RAID BUNKER',
    subtitle: 'Close-quarters fortress',
    pilots: 'FAST ACTION',
    sky: '#FBCFE8',
    ground: '#34D399',
    dirt: '#57534E',
  },
];

export default function App() {
  const [screen, setScreen] = useState<ScreenView>('HOME');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Core Player Identity & Operatives (Parth, Siddharth, Yug)
  const [gamerTag, setGamerTag] = useState<string>('PSY Player');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('yug');
  const [customizations, setCustomizations] = useState<Record<CharacterId, AvatarCustomization>>(
    DEFAULT_CUSTOMIZATIONS
  );
  const [avatarPartTab, setAvatarPartTab] = useState<'HEADGEAR' | 'HAIR' | 'FACE' | 'SKIN' | 'TOP'>(
    'HEADGEAR'
  );
  const [equippedPose, setEquippedPose] = useState<string>('PSY SALUTE');

  // Pets Progression (1. Sheru, 2. Wolfs, 3. Draky, 4. Pegasus, 5. Poink)
  // 1 Game = 100 XP, 2 Games = 200 XP
  const [selectedPet, setSelectedPet] = useState<PetId>('sheru');
  const [unlockedPets, setUnlockedPets] = useState<Record<PetId, boolean>>({
    sheru: true, // 1. Sheru: Most popular pet
    wolfs: false, // 2. Wolfs
    draky: false, // 3. Draky
    pegasus: false, // 4. Pegasus
    poink: false, // 5. Poink
  });
  const [petLevels, setPetLevels] = useState<Record<PetId, number>>({
    sheru: 1,
    wolfs: 1,
    draky: 1,
    pegasus: 1,
    poink: 1,
  });

  // Career & Economy State (1 Game = 100 XP, 2 Games = 200 XP)
  const [gamesCompleted, setGamesCompleted] = useState<number>(1);
  const [winsCount, setWinsCount] = useState<number>(1);
  const [totalKills, setTotalKills] = useState<number>(6);
  const [totalDeaths, setTotalDeaths] = useState<number>(2);
  const [xp, setXp] = useState<number>(100); // 1 game = 100 XP ready to test
  const [coins, setCoins] = useState<number>(300);
  const [medkitsInventory, setMedkitsInventory] = useState<number>(6); // Up to 10 medkits in inventory

  // Custom Battle Config
  const [selectedMap, setSelectedMap] = useState<string>('psy_outpost');
  const [selectedMode, setSelectedMode] = useState<'DM' | 'TDM' | 'CTF' | 'SURV' | 'VIP' | 'BOMB'>('DM');
  const [botCount, setBotCount] = useState<number>(4);
  const [botSkill, setBotSkill] = useState<'EASY' | 'NORMAL' | 'HARD'>('EASY');
  const [matchTimeMin, setMatchTimeMin] = useState<number>(3);
  const [killLimit, setKillLimit] = useState<number>(15);
  const [friendlyFire, setFriendlyFire] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [listRoomPublicly, setListRoomPublicly] = useState<boolean>(false);

  // Settings Modal State matching Screenshot 7 & 14
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(65);
  const [alwaysShowTouch, setAlwaysShowTouch] = useState<boolean>(true);
  const [moveSensitivity, setMoveSensitivity] = useState<number>(80);
  const [aimSpeed, setAimSpeed] = useState<number>(80);
  const [stickSize, setStickSize] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('LARGE');
  const [stickPlacement, setStickPlacement] = useState<'FIXED' | 'FLOATING'>('FLOATING');
  const [aimSmoothing, setAimSmoothing] = useState<'STEADY' | 'NORMAL' | 'QUICK'>('QUICK');
  const [aimAssist, setAimAssist] = useState<boolean>(true);
  const [vibration, setVibration] = useState<boolean>(true);

  const [toastText, setToastText] = useState<string | null>(null);
  const [lastMatchSummary, setLastMatchSummary] = useState<MatchEndSummary | null>(null);

  // Live HUD State during PLAYING
  const [hud, setHud] = useState<HudSnapshot>({
    hp: CHARACTERS.yug.maxHp,
    maxHp: CHARACTERS.yug.maxHp,
    jetpack: CHARACTERS.yug.maxJetpack,
    maxJetpack: CHARACTERS.yug.maxJetpack,
    activeWeapon: CHARACTERS.yug.startingWeapon,
    secondaryWeapon: CHARACTERS.yug.secondaryWeapon,
    ammo: WEAPONS[CHARACTERS.yug.startingWeapon].magSize,
    reserveAmmo: WEAPONS[CHARACTERS.yug.startingWeapon].magSize * 5,
    maxAmmo: WEAPONS[CHARACTERS.yug.startingWeapon].magSize,
    reloading: false,
    isScopedOut: false,
    canScopeOut: true,
    scopeZoomLabel: '1X',
    scopeWarningText: null,
    medkits: 6,
    maxMedkits: 10,
    grenades: 3,
    abilityCooldownLeft: 0,
    abilityActiveLeft: 0,
    nearbyGroundWeapon: null,
    kills: 0,
    deaths: 0,
    killLimit: 15,
    matchCoinsEarned: 0,
    timeRemaining: 180,
    killFeed: [],
  });

  const moveJoystickRef = useRef<JoystickVector>({ x: 0, y: 0, magnitude: 0, active: false });
  const aimJoystickRef = useRef<JoystickVector>({ x: 0, y: 0, magnitude: 0, active: false });
  const actionsRef = useRef({
    triggerPickup: false,
    triggerScopeToggle: false,
    triggerMedkit: false,
    triggerAbility: false,
    triggerGrenade: false,
    triggerSwapWeapon: false,
    triggerReload: false,
    holdFireButton: false,
  });

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.muted = !next;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const startBattle = () => {
    if (selectedCharacter === 'yug' && medkitsInventory < 10) {
      setMedkitsInventory((prev) => Math.min(10, prev + 1));
    }
    setScreen('PLAYING');
  };

  const handleMatchEnd = useCallback((summary: MatchEndSummary) => {
    setLastMatchSummary(summary);
    setGamesCompleted((prev) => prev + 1);
    if (summary.victory) setWinsCount((prev) => prev + 1);
    setTotalKills((prev) => prev + summary.kills);
    setTotalDeaths((prev) => prev + summary.deaths);
    setXp((prev) => prev + summary.xpEarned); // Strictly +100 XP per game!
    setCoins((prev) => prev + summary.coinsEarned);
    setScreen('ROUND_SUMMARY');
    soundFx.playPetUpgrade();
  }, []);

  const handleAddMedkit = (countToAdd: number) => {
    if (medkitsInventory >= 10) {
      showToast('Medkit Inventory is at maximum capacity (10/10)!');
      return;
    }
    const canAdd = Math.min(countToAdd, 10 - medkitsInventory);
    const cost = canAdd * 15;
    if (coins >= cost) {
      setCoins((prev) => prev - cost);
    }
    setMedkitsInventory((prev) => Math.min(10, prev + canAdd));
    soundFx.playMedkitHeal();
    showToast(`Added +${canAdd} Medkit(s)! Inventory: ${Math.min(10, medkitsInventory + canAdd)}/10`);
  };

  const handleSimulateGameXp = () => {
    setGamesCompleted((prev) => prev + 1);
    setWinsCount((prev) => prev + 1);
    setXp((prev) => prev + 100); // 1 Game = 100 XP
    setCoins((prev) => prev + 150);
    soundFx.playPetUpgrade();
    showToast('+1 Game Completed! Earned +100 XP & +150 Coins!');
  };

  const handleUnlockOrUpgradePet = (petId: PetId) => {
    const spec = PET_MAP[petId];
    const isUnlocked = unlockedPets[petId];
    const currentLvl = petLevels[petId];

    if (!isUnlocked) {
      if (xp < spec.unlockXp || coins < spec.unlockCoins) {
        soundFx.playScopeDenied();
        showToast(
          `Requires ${spec.unlockXp} XP & ${spec.unlockCoins} Coins to unlock ${spec.name}! (1 Game = 100 XP)`
        );
        return;
      }
      setXp((prev) => prev - spec.unlockXp);
      setCoins((prev) => prev - spec.unlockCoins);
      setUnlockedPets((prev) => ({ ...prev, [petId]: true }));
      setSelectedPet(petId);
      soundFx.playPetUpgrade();
      showToast(`Unlocked & Equipped ${spec.order}. ${spec.name}!`);
    } else {
      const upgradeXpCost = spec.baseUpgradeXp;
      const upgradeCoinCost = Math.round(spec.baseUpgradeCoins * (1 + (currentLvl - 1) * 0.35));
      if (xp < upgradeXpCost || coins < upgradeCoinCost) {
        soundFx.playScopeDenied();
        showToast(
          `Requires ${upgradeXpCost} XP & ${upgradeCoinCost} Coins to upgrade ${spec.name} to Lv.${currentLvl + 1}!`
        );
        return;
      }
      setXp((prev) => prev - upgradeXpCost);
      setCoins((prev) => prev - upgradeCoinCost);
      setPetLevels((prev) => ({ ...prev, [petId]: prev[petId] + 1 }));
      setSelectedPet(petId);
      soundFx.playPetUpgrade();
      showToast(`${spec.name} upgraded to Level ${currentLvl + 1}!`);
    }
  };

  const cycleCustomization = (
    field: keyof AvatarCustomization,
    options: string[],
    dir: 1 | -1
  ) => {
    const cur = customizations[selectedCharacter][field] as string;
    const idx = Math.max(0, options.indexOf(cur));
    const nextIdx = (idx + dir + options.length) % options.length;
    setCustomizations((prev) => ({
      ...prev,
      [selectedCharacter]: {
        ...prev[selectedCharacter],
        [field]: options[nextIdx],
      },
    }));
    soundFx.playPickup();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const pad3 = (n: number) => String(Math.max(0, n)).padStart(3, '0');

  const currentRankObj =
    [...PSY_RANKS].reverse().find((r) => xp >= r.xpRequired) || PSY_RANKS[0];

  const activeCharSpec = CHARACTERS[selectedCharacter];
  const activeCustom = customizations[selectedCharacter];
  const activePetSpec = PET_MAP[selectedPet];
  const activeWeaponSpec = WEAPONS[hud.activeWeapon];
  const activeMapCard = MAP_CARDS.find((m) => m.id === selectedMap) || MAP_CARDS[0];

  const joystickPixelSize = stickSize === 'SMALL' ? 124 : stickSize === 'MEDIUM' ? 142 : 162;

  // Shared Top Sub-Screen Header (`< BACK`, Title, Avatar + Shield Pill)
  const renderSubHeader = (title: string) => (
    <div className="w-full max-w-xl mx-auto flex items-center justify-between gap-3 px-4 pt-4 pb-3 shrink-0">
      <button
        onClick={() => {
          soundFx.playPickup();
          setScreen('HOME');
        }}
        className="px-5 py-2.5 rounded-2xl bg-[#473270] hover:bg-[#563d87] border-2 border-[#7355ab] shadow-[0_4px_0_#24183b] text-white font-display font-black text-xl tracking-wide flex items-center gap-2 active:translate-y-0.5 cursor-pointer"
      >
        <ChevronLeft className="w-6 h-6 stroke-[3]" />
        <span>BACK</span>
      </button>

      <h1 className="text-3xl sm:text-4xl font-display font-black tracking-wider text-white uppercase drop-shadow-[0_3px_0_rgba(0,0,0,0.6)] truncate">
        {title}
      </h1>

      <button
        onClick={() => setScreen('PROFILE')}
        className="px-2.5 py-1.5 rounded-2xl bg-[#312252] hover:bg-[#3f2c69] border-2 border-[#6b4ea3] flex items-center gap-2 shrink-0 cursor-pointer"
      >
        <CartoonOperativeSvg
          characterId={selectedCharacter}
          custom={activeCustom}
          headOnly
          className="w-9 h-9"
        />
        <div className="w-7 h-8 rounded bg-[#7C3AED] border-2 border-white flex items-center justify-center">
          <div className="w-3 h-2 border-t-2 border-l-2 border-amber-300 rotate-45 translate-y-0.5" />
        </div>
      </button>
    </div>
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#17112B] text-white select-none font-sans">
      {/* Toast Banner */}
      {toastText && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-[#271B45] border-2 border-[#18F2B2] text-[#18F2B2] font-bold text-xs sm:text-sm shadow-2xl pointer-events-none">
          {toastText}
        </div>
      )}

      {/* =====================================================================
          SCREEN 1: HOME LOBBY (MATCHING SCREENSHOT 6)
      ====================================================================== */}
      {screen === 'HOME' && (
        <div
          style={{
            background:
              'radial-gradient(circle at 80% 25%, #4C2885 0%, #241744 48%, #140E26 100%)',
          }}
          className="relative w-full h-full flex flex-col justify-between overflow-y-auto"
        >
          {/* Dotted Pixel Grid Overlay */}
          <div
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
            }}
            className="fixed inset-0 pointer-events-none"
          />

          {/* Stepped Dark Cavern Silhouette at Bottom matching Screenshot 6 */}
          <div className="fixed bottom-0 inset-x-0 h-44 pointer-events-none flex items-end opacity-85">
            <div className="w-1/4 h-36 bg-[#0F0B1D]" />
            <div className="w-1/4 h-28 bg-[#0F0B1D]" />
            <div className="w-1/4 h-40 bg-[#0F0B1D]" />
            <div className="w-1/4 h-32 bg-[#0F0B1D]" />
          </div>

          {/* Top Bar matching Screenshot 6 */}
          <header className="relative z-10 w-full max-w-xl mx-auto flex items-center justify-between gap-2 px-4 pt-4">
            <button
              onClick={() => {
                soundFx.playPickup();
                setScreen('ARMORY_PETS');
              }}
              className="px-6 py-3 rounded-2xl bg-[#442F6E] hover:bg-[#533A85] border-2 border-[#7152AD] shadow-[0_4px_0_#211538] font-display font-black text-xl tracking-wider text-white uppercase cursor-pointer active:translate-y-0.5"
            >
              ARMORY
            </button>

            <button
              onClick={() => setScreen('PROFILE')}
              className="px-3 py-1.5 rounded-2xl bg-[#312252] hover:bg-[#3E2B66] border-2 border-[#6C4EA6] shadow-[0_4px_0_#1D1333] flex items-center gap-2.5 cursor-pointer"
            >
              <CartoonOperativeSvg
                characterId={selectedCharacter}
                custom={activeCustom}
                headOnly
                className="w-10 h-10"
              />
              <div className="w-7 h-8 rounded-b-lg bg-[#7C3AED] border-2 border-white flex items-center justify-center">
                <div className="w-3 h-3 border-t-2 border-l-2 border-amber-300 rotate-45 translate-y-0.5" />
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playPickup();
                  setShowApkModal(true);
                }}
                title="Android APK & GitHub Release"
                className="w-12 h-12 rounded-2xl bg-[#312252] hover:bg-[#3E2B66] border-2 border-[#18F2B2] shadow-[0_4px_0_#1D1333] flex items-center justify-center text-[#18F2B2] cursor-pointer"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                title="Fullscreen"
                className="w-12 h-12 rounded-2xl bg-[#312252] hover:bg-[#3E2B66] border-2 border-[#6C4EA6] shadow-[0_4px_0_#1D1333] flex items-center justify-center text-white cursor-pointer"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={toggleSound}
                title="Toggle Sound"
                className="w-12 h-12 rounded-2xl bg-[#312252] hover:bg-[#3E2B66] border-2 border-[#6C4EA6] shadow-[0_4px_0_#1D1333] flex items-center justify-center text-white cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Center Main Column */}
          <main className="relative z-10 w-full max-w-xl mx-auto px-5 py-3 flex flex-col items-center">
            {/* Hero Logo Lockup: Big Cartoon Head + Giant Extruded PSY Title */}
            <div className="w-full flex items-center justify-center gap-4 my-2">
              <div
                onClick={() => setScreen('AVATAR')}
                className="cursor-pointer transition-transform hover:scale-105 shrink-0"
              >
                <CartoonOperativeSvg
                  characterId={selectedCharacter}
                  custom={activeCustom}
                  headOnly
                  className="w-28 h-28 sm:w-32 sm:h-32"
                />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl sm:text-7xl font-display font-black tracking-wider text-white drop-shadow-[0_6px_0_#1B1130]">
                    PSY
                  </span>
                  <span className="text-4xl sm:text-5xl font-display font-black tracking-wider text-[#B67CFF] drop-shadow-[0_5px_0_#241445]">
                    ARENA
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#B67CFF] text-[#17112B] font-mono font-black text-xs">
                    PSY
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-slate-200 uppercase">
                    PARTH · SIDDHARTH · YUG
                  </span>
                </div>
              </div>
            </div>

            {/* Character Quick-Switch Pills (Parth, Siddharth, Yug) */}
            <div className="flex items-center gap-2 my-1.5">
              {(['parth', 'siddharth', 'yug'] as CharacterId[]).map((cid) => {
                const c = CHARACTERS[cid];
                const active = selectedCharacter === cid;
                return (
                  <button
                    key={cid}
                    onClick={() => {
                      setSelectedCharacter(cid);
                      soundFx.playPickup();
                    }}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#18F2B2] text-[#0E2923] border-white shadow-md scale-105'
                        : 'bg-[#251A40]/90 text-slate-300 border-[#583E8E] hover:text-white'
                    }`}
                  >
                    {c.letter} · {c.name}
                  </button>
                );
              })}
            </div>

            {/* Status Pill */}
            <div className="my-2 px-5 py-1.5 rounded-full bg-[#162C3D]/90 border border-[#18F2B2]/60 flex items-center gap-2.5 text-xs font-mono tracking-wider text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-[#18F2B2]" />
              <span>
                PET: {activePetSpec.name.toUpperCase()} LV.{petLevels[selectedPet]} · MEDKITS: {medkitsInventory}/10 · {xp} XP
              </span>
            </div>

            {/* 3 Main Stacked Buttons matching Screenshot 6 */}
            <div className="w-full space-y-3.5 mt-2">
              <button
                onClick={() => {
                  soundFx.playPickup();
                  setScreen('PLAY_ONLINE');
                }}
                className="w-full py-4 rounded-2xl bg-[#18F2B2] hover:bg-[#2FFAC0] border-2 border-[#70FCD4] shadow-[0_6px_0_#0B8A64] text-[#0B2620] font-display font-black text-2xl sm:text-3xl tracking-wider uppercase transition-transform active:translate-y-1 cursor-pointer"
              >
                PLAY ONLINE
              </button>

              <button
                onClick={startBattle}
                className="w-full py-4 rounded-2xl bg-[#3D2966] hover:bg-[#4B337D] border-2 border-[#6B4CA8] shadow-[0_6px_0_#1D1236] text-white font-display font-black text-2xl sm:text-3xl tracking-wider uppercase transition-transform active:translate-y-1 cursor-pointer"
              >
                PLAY VS BOTS
              </button>

              <button
                onClick={() => {
                  soundFx.playPickup();
                  setScreen('CUSTOM_BATTLE');
                }}
                className="w-full py-4 rounded-2xl bg-[#3D2966] hover:bg-[#4B337D] border-2 border-[#6B4CA8] shadow-[0_6px_0_#1D1236] text-white font-display font-black text-2xl sm:text-3xl tracking-wider uppercase transition-transform active:translate-y-1 cursor-pointer"
              >
                CUSTOM BATTLE
              </button>
            </div>

            {/* Control Subtitle */}
            <div className="mt-4 text-center space-y-1">
              <div className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                {activeMapCard.name} · {selectedMode} · {botCount} BOTS
              </div>
              <div className="text-xs font-mono tracking-wider text-slate-400 uppercase">
                A / D MOVE · SPACE JETPACK · MOUSE AIM + FIRE · Z SNIPER SCOPE
              </div>
            </div>

            {/* Gold Daily Challenges / Pet Evolution Pill */}
            <button
              onClick={() => setScreen('ARMORY_PETS')}
              className="mt-4 px-6 py-2 rounded-full bg-[#241B38] hover:bg-[#2F234A] border-2 border-[#F59E0B] flex items-center gap-3 cursor-pointer shadow-lg"
            >
              <span className="text-[#F59E0B] text-base">★</span>
              <span className="font-display font-bold tracking-wider text-sm sm:text-base text-white uppercase">
                PETS ({activePetSpec.name}) & MEDKITS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#17112B] font-mono font-black text-xs">
                {medkitsInventory}/10
              </span>
            </button>

            <div className="mt-3 text-[11px] font-mono tracking-wider text-slate-400 uppercase text-center">
              TWO THUMBS TO PLAY · 1 GAME = 100 XP · 2 GAMES = 200 XP
            </div>
          </main>

          {/* Bottom 2x2 Navigation Grid matching Screenshot 6 */}
          <footer className="relative z-10 w-full max-w-xl mx-auto px-5 pb-5 pt-1">
            <div className="text-center text-[11px] font-mono tracking-widest text-slate-400 uppercase mb-2.5">
              PSY SQUAD EDITION · PARTH · SIDDHARTH · YUG + 5 PETS
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => setScreen('AVATAR')}
                className="py-3.5 rounded-2xl bg-[#3D2966] hover:bg-[#4D3480] border-2 border-[#6C4CA8] shadow-[0_5px_0_#1B1130] font-display font-black text-xl tracking-wider text-white uppercase cursor-pointer active:translate-y-0.5"
              >
                AVATAR ({activeCharSpec.letter})
              </button>
              <button
                onClick={() => setScreen('ARMORY_PETS')}
                className="py-3.5 rounded-2xl bg-[#3D2966] hover:bg-[#4D3480] border-2 border-[#6C4CA8] shadow-[0_5px_0_#1B1130] font-display font-black text-xl tracking-wider text-white uppercase cursor-pointer active:translate-y-0.5"
              >
                PETS & MEDKITS
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="py-3.5 rounded-2xl bg-[#3D2966] hover:bg-[#4D3480] border-2 border-[#6C4CA8] shadow-[0_5px_0_#1B1130] font-display font-black text-xl tracking-wider text-white uppercase cursor-pointer active:translate-y-0.5"
              >
                SETTINGS
              </button>
              <button
                onClick={() => setScreen('PROFILE')}
                className="py-3.5 rounded-2xl bg-[#3D2966] hover:bg-[#4D3480] border-2 border-[#6C4CA8] shadow-[0_5px_0_#1B1130] font-display font-black text-xl tracking-wider text-white uppercase cursor-pointer active:translate-y-0.5"
              >
                STATS
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* =====================================================================
          SCREEN 2: PLAY ONLINE (MATCHING SCREENSHOT 1)
      ====================================================================== */}
      {screen === 'PLAY_ONLINE' && (
        <div
          style={{
            background: 'linear-gradient(180deg, #1E1438 0%, #140E26 100%)',
          }}
          className="w-full h-full flex flex-col overflow-y-auto pb-8"
        >
          {renderSubHeader('PLAY ONLINE')}

          <div className="w-full max-w-xl mx-auto px-4 space-y-4">
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-4 shadow-xl">
              {/* Gamer Tag Row */}
              <div className="flex items-center gap-3.5">
                <CartoonOperativeSvg
                  characterId={selectedCharacter}
                  custom={activeCustom}
                  headOnly
                  className="w-16 h-16 shrink-0"
                />
                <div className="flex-1">
                  <label className="block text-xs font-mono font-bold tracking-wider text-slate-300 uppercase mb-1">
                    GAMER TAG ({activeCharSpec.name.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={gamerTag}
                    onChange={(e) => setGamerTag(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white font-bold text-base focus:outline-none focus:border-[#18F2B2]"
                  />
                </div>
              </div>

              {/* Quick Match Button */}
              <button
                onClick={startBattle}
                className="w-full py-4 rounded-2xl bg-[#18F2B2] hover:bg-[#2FFAC0] border-2 border-[#70FCD4] shadow-[0_5px_0_#0B8A64] text-[#0B2620] font-display font-black text-2xl tracking-wider uppercase cursor-pointer active:translate-y-0.5"
              >
                QUICK MATCH
              </button>
              <p className="text-sm text-slate-300">
                Drop into a public PSY deathmatch with {activePetSpec.name}. Bots hold empty seats.
              </p>

              {/* Create Room Button */}
              <button
                onClick={startBattle}
                className="w-full py-3.5 rounded-2xl bg-[#3D2966] hover:bg-[#4B337D] border-2 border-[#6B4CA8] shadow-[0_5px_0_#1D1236] text-white font-display font-black text-2xl tracking-wider uppercase cursor-pointer"
              >
                CREATE ROOM
              </button>

              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={listRoomPublicly}
                  onChange={(e) => setListRoomPublicly(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#18F2B2]"
                />
                <span className="text-sm font-medium text-white">List my room publicly</span>
              </label>

              <div>
                <label className="block text-xs font-mono font-bold tracking-wider text-slate-300 uppercase mb-1.5">
                  ROOM PASSWORD · OPTIONAL
                </label>
                <input
                  type="text"
                  placeholder="Empty = open room"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white placeholder-slate-500 font-bold text-sm focus:outline-none"
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeMapCard.name} · DEATHMATCH. The host can change rules in the room.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="C O D E"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3.5 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white placeholder-slate-500 font-mono font-bold text-lg tracking-widest focus:outline-none"
                />
                <button
                  onClick={startBattle}
                  className="px-6 py-3.5 rounded-2xl bg-[#4A347A] hover:bg-[#5B4096] border-2 border-[#7859B8] text-white font-display font-black text-xl tracking-wider uppercase cursor-pointer"
                >
                  JOIN ROOM
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold tracking-wider text-slate-300 uppercase mb-1.5">
                  PASSWORD · ONLY FOR LOCKED ROOMS
                </label>
                <input
                  type="password"
                  placeholder="Leave empty for open rooms"
                  className="w-full px-4 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white placeholder-slate-500 font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Server List Card */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                  SERVER LIST
                </span>
                <button
                  onClick={() => showToast('Refreshed PSY Lobby Rooms!')}
                  className="w-11 h-11 rounded-2xl bg-[#312252] border-2 border-[#6B4EA3] flex items-center justify-center text-white cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#140F24] border border-[#382B59] flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">PSY Outpost #1 (Sniper + Pets)</div>
                  <div className="text-xs text-slate-400">Parth, Siddharth & Yug Arena · 5/6 Players</div>
                </div>
                <button
                  onClick={startBattle}
                  className="px-4 py-2 rounded-xl bg-[#18F2B2] text-[#0B2620] font-display font-black text-sm uppercase cursor-pointer"
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 3: CUSTOM BATTLE (MATCHING SCREENSHOT 8 & 9)
      ====================================================================== */}
      {screen === 'CUSTOM_BATTLE' && (
        <div
          style={{
            background: 'linear-gradient(180deg, #1E1438 0%, #140E26 100%)',
          }}
          className="w-full h-full flex flex-col overflow-y-auto pb-8"
        >
          {renderSubHeader('CUSTOM BATTLE')}

          <div className="w-full max-w-xl mx-auto px-4 space-y-4">
            {/* MAP CARD */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                  MAP
                </span>
                <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                  4 LOCATIONS
                </span>
              </div>

              {/* Featured Map Preview Graphic matching Screenshot 8 */}
              <div
                style={{ backgroundColor: activeMapCard.sky }}
                className="relative h-44 rounded-2xl border-2 border-[#18122B] overflow-hidden flex flex-col justify-end p-4"
              >
                {/* Floating Rock Islands in Preview */}
                <div
                  style={{ backgroundColor: activeMapCard.dirt }}
                  className="absolute top-6 left-10 w-20 h-10 rounded-lg border-4 border-black"
                />
                <div
                  style={{ backgroundColor: activeMapCard.dirt }}
                  className="absolute top-8 right-16 w-24 h-12 rounded-lg border-4 border-black"
                />
                <div
                  style={{ backgroundColor: activeMapCard.ground }}
                  className="absolute inset-x-0 bottom-0 h-20 border-t-4 border-black"
                />
                <div className="relative z-10 flex items-end justify-between gap-2">
                  <h2 className="text-3xl font-display font-black text-white uppercase drop-shadow-[0_3px_0_#000]">
                    {activeMapCard.name}
                  </h2>
                  <div className="text-right text-xs font-bold text-white drop-shadow-[0_2px_0_#000]">
                    <div>{activeMapCard.subtitle}</div>
                    <div>{activeMapCard.pilots}</div>
                  </div>
                </div>
              </div>

              {/* Map Thumbnails Strip */}
              <div className="grid grid-cols-4 gap-2.5 pt-1">
                {MAP_CARDS.map((m) => {
                  const active = selectedMap === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMap(m.id);
                        soundFx.playPickup();
                      }}
                      className={`rounded-xl p-1.5 border-2 text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-[#2E1F4D] border-[#A855F7]'
                          : 'bg-[#140F24] border-[#382B59] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div
                        style={{ backgroundColor: m.sky }}
                        className="h-14 rounded-lg border border-black relative overflow-hidden mb-1.5"
                      >
                        <div
                          style={{ backgroundColor: m.ground }}
                          className="absolute inset-x-0 bottom-0 h-6 border-t-2 border-black"
                        />
                      </div>
                      <div className="text-[10px] font-mono font-bold text-white truncate">
                        {m.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GAME MODE & SETTINGS CARD */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-4 shadow-xl">
              <span className="block text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                GAME MODE
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'DM', label: 'DEATHMATCH' },
                  { id: 'TDM', label: 'TEAM DEATHMATCH' },
                  { id: 'CTF', label: 'CAPTURE THE FLAG' },
                  { id: 'SURV', label: 'SURVIVAL' },
                  { id: 'VIP', label: 'VIP GUARD' },
                  { id: 'BOMB', label: 'PLANT THE BOMB' },
                ].map((gm) => {
                  const active = selectedMode === gm.id;
                  return (
                    <button
                      key={gm.id}
                      onClick={() => setSelectedMode(gm.id as typeof selectedMode)}
                      className={`py-3 px-2 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        active
                          ? 'bg-[#B666FF] border-white text-white shadow-md'
                          : 'bg-[#140F24] border-[#382B59] text-white hover:border-[#6B4CA8]'
                      }`}
                    >
                      <span className="font-display font-black text-xl">{gm.id}</span>
                      <span className="text-[9px] font-mono uppercase tracking-wider opacity-90 truncate max-w-full">
                        {gm.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-slate-300">
                Every operative for themselves. First to the kill limit wins (+100 XP per game).
              </p>

              {/* 2x2 Dropdowns: BOTS, BOT SKILL, TIME, KILL LIMIT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    BOTS
                  </label>
                  <select
                    value={botCount}
                    onChange={(e) => setBotCount(Number(e.target.value))}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white font-bold text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    BOT SKILL
                  </label>
                  <select
                    value={botSkill}
                    onChange={(e) => setBotSkill(e.target.value as typeof botSkill)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white font-bold text-sm"
                  >
                    <option value="EASY">EASY</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    TIME
                  </label>
                  <select
                    value={matchTimeMin}
                    onChange={(e) => setMatchTimeMin(Number(e.target.value))}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white font-bold text-sm"
                  >
                    <option value={2}>2 MIN</option>
                    <option value={3}>3 MIN</option>
                    <option value={5}>5 MIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    KILL LIMIT
                  </label>
                  <select
                    value={killLimit}
                    onChange={(e) => setKillLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white font-bold text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                  </select>
                </div>
              </div>

              {/* Friendly Fire Toggle */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                  FRIENDLY FIRE
                </label>
                <button
                  onClick={() => setFriendlyFire(!friendlyFire)}
                  className="px-4 py-2 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-xs font-mono font-bold text-white cursor-pointer"
                >
                  {friendlyFire ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Gamer Tag */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                  GAMER TAG
                </label>
                <input
                  type="text"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white font-bold text-base focus:outline-none"
                />
              </div>

              {/* START MATCH CTA */}
              <button
                onClick={startBattle}
                className="w-full py-4 rounded-2xl bg-[#18F2B2] hover:bg-[#2FFAC0] border-2 border-[#70FCD4] shadow-[0_6px_0_#0B8A64] text-[#0B2620] font-display font-black text-3xl tracking-wider uppercase cursor-pointer active:translate-y-0.5"
              >
                START MATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 4: AVATAR & OPERATIVES (PARTH, SIDDHARTH, YUG — SCREENSHOT 4, 10, 12, 13)
      ====================================================================== */}
      {screen === 'AVATAR' && (
        <div
          style={{
            background: 'linear-gradient(180deg, #1E1438 0%, #140E26 100%)',
          }}
          className="w-full h-full flex flex-col overflow-y-auto pb-8"
        >
          {renderSubHeader('AVATAR')}

          <div className="w-full max-w-xl mx-auto px-4 space-y-4">
            {/* 3 Core PSY Operatives Selector Card (Parth, Siddharth, Yug) */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-[#18F2B2] uppercase">
                  SELECT PSY OPERATIVE (UNIQUE ABILITIES)
                </span>
                <span className="text-xs font-mono text-amber-300 font-bold">
                  ACTIVE: {activeCharSpec.name.toUpperCase()} ({activeCharSpec.letter})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {(['parth', 'siddharth', 'yug'] as CharacterId[]).map((cid) => {
                  const c = CHARACTERS[cid];
                  const isSel = selectedCharacter === cid;
                  return (
                    <button
                      key={cid}
                      onClick={() => {
                        setSelectedCharacter(cid);
                        soundFx.playPickup();
                      }}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${
                        isSel
                          ? 'bg-[#2E1F4D] border-[#18F2B2] shadow-lg'
                          : 'bg-[#140F24] border-[#382B59] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <CartoonOperativeSvg
                        characterId={cid}
                        custom={customizations[cid]}
                        className="w-20 h-24"
                      />
                      <div className="mt-1 font-display font-black text-xl text-white">
                        {c.letter} · {c.name}
                      </div>
                      <div className="text-[10px] font-mono text-[#18F2B2] font-bold uppercase mt-0.5">
                        {c.abilityName}
                      </div>
                      <span
                        className={`mt-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isSel ? 'bg-[#18F2B2] text-[#0B2620]' : 'bg-[#312252] text-slate-300'
                        }`}
                      >
                        {isSel ? 'EQUIPPED' : 'SELECT'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Character Ability Details */}
              <div className="p-3 rounded-2xl bg-[#140F24] border border-[#382B59] text-xs space-y-1">
                <div className="font-mono font-bold text-amber-400">
                  {activeCharSpec.name} ({activeCharSpec.letter}) Ability — {activeCharSpec.abilityName}:
                </div>
                <div className="text-slate-200">{activeCharSpec.abilityDescription}</div>
                <div className="text-sky-300 font-mono text-[11px]">
                  Passive ({activeCharSpec.passiveName}): {activeCharSpec.passiveDescription}
                </div>
              </div>
            </div>

            {/* Big Center Character Preview + Swatches + Part Cyclers matching Screenshot 4 & 10 */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-4 shadow-xl">
              <div className="flex flex-col items-center justify-center py-2">
                <CartoonOperativeSvg
                  characterId={selectedCharacter}
                  custom={activeCustom}
                  holdingGun
                  className="w-52 h-60"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
                  GAMER TAG
                </label>
                <input
                  type="text"
                  value={gamerTag}
                  onChange={(e) => setGamerTag(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0F0C1B] border-2 border-[#382B59] text-white font-bold text-base focus:outline-none"
                />
              </div>

              {/* Color Swatches matching Screenshot 4 */}
              <div className="flex flex-wrap items-center gap-2.5">
                {ACCENT_SWATCHES.map((hex) => {
                  const active = activeCustom.accentColor === hex;
                  return (
                    <button
                      key={hex}
                      onClick={() => {
                        setCustomizations((prev) => ({
                          ...prev,
                          [selectedCharacter]: {
                            ...prev[selectedCharacter],
                            accentColor: hex,
                          },
                        }));
                        soundFx.playPickup();
                      }}
                      style={{ backgroundColor: hex }}
                      className={`w-12 h-12 rounded-xl border-2 transition-transform cursor-pointer ${
                        active ? 'border-white scale-110 shadow-lg' : 'border-black/60'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Left / Right Part Cyclers matching Screenshot 10 */}
              <div className="space-y-2.5 pt-2">
                {[
                  { label: 'HEADGEAR', field: 'headgear' as const, list: HEADGEAR_OPTIONS.map((h) => h.id) },
                  { label: 'HAIR', field: 'hair' as const, list: HAIR_OPTIONS },
                  { label: 'FACE', field: 'face' as const, list: FACE_OPTIONS },
                  { label: 'SKIN', field: 'skin' as const, list: SKIN_OPTIONS },
                  { label: 'TOP', field: 'top' as const, list: TOP_OPTIONS },
                  { label: 'JOGGERS', field: 'joggers' as const, list: JOGGERS_OPTIONS },
                  { label: 'SNEAKERS', field: 'sneakers' as const, list: SNEAKERS_OPTIONS },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => cycleCustomization(row.field, row.list, -1)}
                      className="w-12 h-12 rounded-2xl bg-[#18122B] hover:bg-[#271D45] border-2 border-[#3D2E63] flex items-center justify-center text-white cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {row.label}
                      </div>
                      <div className="text-sm sm:text-base font-display font-black tracking-wider text-white uppercase">
                        {activeCustom[row.field]}
                      </div>
                    </div>
                    <button
                      onClick={() => cycleCustomization(row.field, row.list, 1)}
                      className="w-12 h-12 rounded-2xl bg-[#18122B] hover:bg-[#271D45] border-2 border-[#3D2E63] flex items-center justify-center text-white cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* FRESH FITS & HEADGEAR GRID matching Screenshot 12 & 13 */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                  FRESH FITS
                </span>
                <span className="text-xs font-mono text-slate-300 uppercase">
                  FREE · TAP TO EQUIP
                </span>
              </div>

              {/* Category Filter Pills + Random */}
              <div className="flex flex-wrap items-center gap-2">
                {(['HEADGEAR', 'HAIR', 'FACE', 'SKIN', 'TOP'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAvatarPartTab(tab)}
                    className={`px-4 py-2 rounded-xl font-mono font-bold text-xs uppercase cursor-pointer ${
                      avatarPartTab === tab
                        ? 'bg-[#18F2B2] text-[#0B2620]'
                        : 'bg-[#140F24] text-white border border-[#382B59]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                <button
                  onClick={() => {
                    const randColor =
                      ACCENT_SWATCHES[Math.floor(Math.random() * ACCENT_SWATCHES.length)];
                    setCustomizations((prev) => ({
                      ...prev,
                      [selectedCharacter]: {
                        ...prev[selectedCharacter],
                        accentColor: randColor,
                      },
                    }));
                    soundFx.playPickup();
                  }}
                  className="ml-auto px-4 py-2 rounded-xl bg-[#140F24] border-2 border-[#382B59] text-xs font-mono font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>RANDOM</span>
                </button>
              </div>

              <div className="text-xs font-mono text-slate-300">
                <strong className="text-amber-400">{coins}</strong> COINS EARNED IN MATCHES
              </div>

              {/* 3-Column Headgear / Cosmetics Grid matching Screenshot 12 & 13 */}
              <div className="grid grid-cols-3 gap-2.5">
                {HEADGEAR_OPTIONS.map((item) => {
                  const equipped = activeCustom.headgear === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCustomizations((prev) => ({
                          ...prev,
                          [selectedCharacter]: {
                            ...prev[selectedCharacter],
                            headgear: item.id,
                          },
                        }));
                        soundFx.playPickup();
                      }}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                        equipped
                          ? 'bg-[#2E1F4D] border-[#18F2B2]'
                          : 'bg-[#140F24] border-[#2C2247] hover:border-[#58428C]'
                      }`}
                    >
                      <CartoonOperativeSvg
                        characterId={selectedCharacter}
                        custom={{ ...activeCustom, headgear: item.id }}
                        headOnly
                        className="w-16 h-16"
                      />
                      <div className="mt-2 font-display font-black text-xs text-white uppercase">
                        {item.label}
                      </div>
                      {equipped ? (
                        <div className="mt-1 text-[10px] font-mono font-bold text-[#B67CFF]">
                          EQUIPPED
                        </div>
                      ) : item.rankReq ? (
                        <div className="mt-1 text-[9px] font-mono text-rose-300">
                          {item.rankReq}
                        </div>
                      ) : item.coinCost ? (
                        <div className="mt-1 text-[10px] font-mono text-amber-300">
                          {item.coinCost} COINS
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] font-mono text-[#18F2B2]">FREE</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 5: ARMORY, PET EVOLUTION LAB (SHERU -> POINK) & MEDKITS (UP TO 10)
      ====================================================================== */}
      {screen === 'ARMORY_PETS' && (
        <div
          style={{
            background: 'linear-gradient(180deg, #1E1438 0%, #140E26 100%)',
          }}
          className="w-full h-full flex flex-col overflow-y-auto pb-8"
        >
          {renderSubHeader('PETS & ARMORY')}

          <div className="w-full max-w-xl mx-auto px-4 space-y-4">
            {/* XP & Coins Conversion Banner: 1 Game = 100 XP, 2 Games = 200 XP */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                  COMPANION PET EVOLUTION
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {xp} XP · {coins} COINS
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#140F24] border border-[#382B59] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <div className="text-white font-bold">
                    1 GAME = <span className="text-[#18F2B2]">100 XP</span> · 2 GAMES ={' '}
                    <span className="text-[#18F2B2]">200 XP</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Games Played: {gamesCompleted} ({gamesCompleted * 100} Total XP Earned)
                  </div>
                </div>
                <button
                  onClick={handleSimulateGameXp}
                  className="px-3.5 py-2 rounded-xl bg-[#18F2B2] text-[#0B2620] font-bold text-xs uppercase cursor-pointer"
                >
                  +1 Game (+100 XP & +150 Coins)
                </button>
              </div>

              {/* 5 Ordered Pets List: 1. Sheru, 2. Wolfs, 3. Draky, 4. Pegasus, 5. Poink */}
              <div className="space-y-3 pt-1">
                {PETS.map((pet) => {
                  const isUnlocked = unlockedPets[pet.id];
                  const isEquipped = selectedPet === pet.id;
                  const lvl = petLevels[pet.id];
                  const upgradeXp = pet.baseUpgradeXp;
                  const upgradeCoins = Math.round(pet.baseUpgradeCoins * (1 + (lvl - 1) * 0.35));

                  return (
                    <div
                      key={pet.id}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        isEquipped
                          ? 'bg-[#2E1F4D] border-[#18F2B2] shadow-lg'
                          : 'bg-[#140F24] border-[#382B59]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <PetAvatarSvg petId={pet.id} className="w-16 h-16 shrink-0" />
                          <div>
                            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                              {pet.popularityTag}
                            </div>
                            <h3 className="text-2xl font-display font-black text-white">
                              {pet.order}. {pet.name}{' '}
                              {isUnlocked && (
                                <span className="text-sm font-mono text-[#18F2B2]">LV.{lvl}</span>
                              )}
                            </h3>
                            <div className="text-xs font-bold text-sky-300">
                              Ability: {pet.abilityName}
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">{pet.abilitySummary}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[#382B59] flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-[#18F2B2]">
                          {pet.passiveBonusText}
                        </span>
                        <div className="flex items-center gap-2">
                          {isUnlocked ? (
                            <>
                              <button
                                onClick={() => handleUnlockOrUpgradePet(pet.id)}
                                className="px-3 py-1.5 rounded-xl bg-[#473270] hover:bg-[#593E8C] border border-[#7C5BB8] text-white font-mono font-bold text-xs uppercase cursor-pointer"
                              >
                                Upgrade Lv.{lvl + 1} ({upgradeXp} XP + {upgradeCoins}C)
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPet(pet.id);
                                  soundFx.playPickup();
                                }}
                                className={`px-4 py-1.5 rounded-xl font-display font-black text-sm uppercase cursor-pointer ${
                                  isEquipped
                                    ? 'bg-[#18F2B2] text-[#0B2620]'
                                    : 'bg-[#312252] text-white'
                                }`}
                              >
                                {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleUnlockOrUpgradePet(pet.id)}
                              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#17112B] font-mono font-black text-xs uppercase cursor-pointer"
                            >
                              UNLOCK ({pet.unlockXp} XP + {pet.unlockCoins} COINS)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MEDKIT INVENTORY (UP TO 10 MEDKITS) */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                  INSTANT HEAL MEDKIT INVENTORY
                </span>
                <span className="text-sm font-mono font-bold text-white">
                  {medkitsInventory} / 10 MEDKITS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Add up to <strong>10 Medkits</strong> in your inventory. Tap the{' '}
                <strong className="text-[#18F2B2]">MEDKIT</strong> button during battle for an instant +65 HP heal!
              </p>

              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, i) => {
                  const active = i < medkitsInventory;
                  return (
                    <div
                      key={i}
                      className={`h-12 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-xs ${
                        active
                          ? 'bg-[#143D35] border-[#18F2B2] text-[#18F2B2]'
                          : 'bg-[#140F24] border-[#2C2247] text-slate-600'
                      }`}
                    >
                      <HeartPulse className="w-4 h-4 mr-1" />#{i + 1}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => handleAddMedkit(1)}
                  disabled={medkitsInventory >= 10}
                  className="flex-1 py-3 rounded-2xl bg-[#18F2B2] disabled:opacity-40 text-[#0B2620] font-display font-black text-lg uppercase cursor-pointer"
                >
                  +1 MEDKIT
                </button>
                <button
                  onClick={() => handleAddMedkit(10 - medkitsInventory)}
                  disabled={medkitsInventory >= 10}
                  className="flex-1 py-3 rounded-2xl bg-[#3D2966] border-2 border-[#6B4CA8] disabled:opacity-40 text-white font-display font-black text-lg uppercase cursor-pointer"
                >
                  FILL MAX (10/10)
                </button>
              </div>
            </div>

            {/* SNIPER SCOPE ZOOM-OUT VS STANDARD WEAPONS ARSENAL */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-3 shadow-xl">
              <span className="block text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                GROUND WEAPONS & SNIPER SCOPE ZOOM-OUT
              </span>
              <p className="text-xs text-slate-300">
                Collect these weapons from the ground using the <strong>PICK UP</strong> button. Only{' '}
                <strong className="text-sky-300">Sniper Guns</strong> have the{' '}
                <strong>Scope Zoom-Out (1X → 0.5X)</strong> feature—other guns cannot zoom out.
              </p>
              <div className="space-y-2">
                {(Object.keys(WEAPONS) as WeaponId[]).map((wid) => {
                  const w = WEAPONS[wid];
                  return (
                    <div
                      key={wid}
                      className="p-3 rounded-2xl bg-[#140F24] border border-[#382B59] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <WeaponIconSvg weaponId={wid} className="w-16 h-8 shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-white">{w.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            DMG: {w.damage} · MAG: {w.magSize}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg ${
                          w.isSniper
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {w.isSniper ? 'SCOPE ZOOM-OUT' : 'NO SCOPE ZOOM'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 6: PROFILE, CAREER & PSY RANKS (MATCHING SCREENSHOT 3, 5, 11)
      ====================================================================== */}
      {screen === 'PROFILE' && (
        <div
          style={{
            background: 'linear-gradient(180deg, #1E1438 0%, #140E26 100%)',
          }}
          className="w-full h-full flex flex-col overflow-y-auto pb-8"
        >
          {renderSubHeader('PROFILE')}

          <div className="w-full max-w-xl mx-auto px-4 space-y-4">
            {/* Character Pose & Rank Card matching Screenshot 11 */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-4 shadow-xl">
              <div className="flex flex-col items-center py-2">
                <CartoonOperativeSvg
                  characterId={selectedCharacter}
                  custom={activeCustom}
                  holdingGun={false}
                  className="w-48 h-56"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-16 rounded-b-2xl bg-[#7C3AED] border-4 border-white flex items-center justify-center shrink-0 shadow-md">
                  <div className="w-5 h-5 border-t-4 border-l-4 border-amber-300 rotate-45 translate-y-1" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-slate-300 uppercase">
                    RANK {currentRankObj.rank}
                  </div>
                  <div className="text-3xl font-display font-black tracking-wider text-white uppercase">
                    {currentRankObj.name}
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    {gamerTag} · {activeCharSpec.name} ({activeCharSpec.letter})
                  </div>
                </div>
              </div>

              {/* Purple XP Bar (1 Game = 100 XP) */}
              <div className="relative w-full h-8 rounded-xl bg-[#120D20] overflow-hidden border border-[#382B59] flex items-center justify-center">
                <div
                  style={{ width: `${Math.min(100, (xp % 200) / 2)}%` }}
                  className="absolute inset-y-0 left-0 bg-[#B666FF]"
                />
                <span className="relative z-10 font-mono font-black text-xs text-white">
                  {xp} XP (1 GAME = 100 XP)
                </span>
              </div>
            </div>

            {/* DAILY PSY CHALLENGES matching Screenshot 5 & 11 */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                  DAILY PSY CHALLENGES
                </span>
                <span className="text-xs font-mono text-slate-300">1/3 DONE · +100 XP/GAME</span>
              </div>

              {[
                {
                  title: 'SNIPER SCOPE MASTER',
                  desc: 'Zoom out with a Sniper Scope and score 3 eliminations',
                  prog: `${Math.min(3, totalKills)}/3`,
                  reward: 'REWARD: CLUTCH HEADSET + 100 XP',
                },
                {
                  title: 'SHERU & PET EVOLUTION',
                  desc: 'Upgrade Sheru or unlock Wolfs with match XP',
                  prog: `${petLevels.sheru > 1 || unlockedPets.wolfs ? 1 : 0}/1`,
                  reward: 'REWARD: VICTORY FLEX POSE + 50 COINS',
                },
                {
                  title: 'PSY SQUAD TOUR',
                  desc: 'Play matches with Parth, Siddharth, or Yug',
                  prog: `${Math.min(3, gamesCompleted)}/3`,
                  reward: 'REWARD: +200 XP + 100 COINS',
                },
              ].map((ch) => (
                <div
                  key={ch.title}
                  className="p-3.5 rounded-2xl bg-[#140F24] border-2 border-[#382B59] flex items-center gap-3.5"
                >
                  <CartoonOperativeSvg
                    characterId={selectedCharacter}
                    custom={activeCustom}
                    headOnly
                    className="w-14 h-14 shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="font-display font-black text-lg text-white uppercase">
                      {ch.title}
                    </div>
                    <div className="text-xs text-slate-300">{ch.desc}</div>
                    <div className="w-full h-5 rounded bg-[#0B0814] border border-[#382B59] flex items-center justify-center text-[11px] font-mono font-bold text-white">
                      {ch.prog}
                    </div>
                    <div className="text-[11px] font-mono font-bold text-amber-400">
                      {ch.reward}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* VICTORY POSE GRID matching Screenshot 5 */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                  VICTORY POSE
                </span>
                <span className="text-xs font-mono text-slate-300 uppercase">
                  STRUCK ON THE RESULTS SCREEN
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  'PSY SALUTE',
                  'BIG WAVE',
                  'CAMERA POINT',
                  'VICTORY FLEX',
                  'JETPACK HOVER',
                  'TROPHY LIFT',
                ].map((pose) => {
                  const active = equippedPose === pose;
                  return (
                    <button
                      key={pose}
                      onClick={() => {
                        setEquippedPose(pose);
                        soundFx.playPickup();
                      }}
                      className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center cursor-pointer ${
                        active
                          ? 'bg-[#2E1F4D] border-[#18F2B2]'
                          : 'bg-[#140F24] border-[#2C2247]'
                      }`}
                    >
                      <CartoonOperativeSvg
                        characterId={selectedCharacter}
                        custom={activeCustom}
                        holdingGun={false}
                        className="w-16 h-20"
                      />
                      <div className="mt-1 font-display font-black text-xs text-white uppercase">
                        {pose}
                      </div>
                      <div
                        className={`text-[10px] font-mono font-bold ${
                          active ? 'text-[#B67CFF]' : 'text-slate-400'
                        }`}
                      >
                        {active ? 'EQUIPPED' : 'TAP TO EQUIP'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CAREER STATS 2x4 GRID matching Screenshot 3 */}
            <div className="rounded-3xl bg-[#211936] border-2 border-[#4C3A75] p-5 space-y-3 shadow-xl">
              <span className="block text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                CAREER
              </span>

              <div className="grid grid-cols-2 gap-3 font-mono tabular-nums">
                {[
                  { label: 'MATCHES', val: gamesCompleted },
                  { label: 'WINS', val: winsCount },
                  { label: 'KILLS', val: totalKills },
                  { label: 'DEATHS', val: totalDeaths },
                  {
                    label: 'K/D',
                    val: (totalKills / Math.max(1, totalDeaths)).toFixed(2),
                  },
                  {
                    label: 'WIN RATE',
                    val: `${Math.round((winsCount / Math.max(1, gamesCompleted)) * 100)}%`,
                  },
                  { label: 'TOTAL XP', val: xp },
                  { label: 'COINS', val: coins },
                ].map((st) => (
                  <div
                    key={st.label}
                    className="py-4 px-3 rounded-2xl bg-[#110D1D] border border-[#2C2247] text-center"
                  >
                    <div className="text-3xl font-display font-black text-white">{st.val}</div>
                    <div className="text-xs font-mono text-slate-400 uppercase mt-0.5">
                      {st.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* PSY RANKS LADDER matching Screenshot 3 */}
              <span className="block pt-3 text-lg font-display font-black tracking-wider text-[#18F2B2] uppercase">
                PSY RANKS (1 GAME = 100 XP)
              </span>
              <div className="space-y-2">
                {PSY_RANKS.map((rk) => {
                  const isCurrent = currentRankObj.rank === rk.rank;
                  return (
                    <div
                      key={rk.rank}
                      className={`px-4 py-3 rounded-2xl flex items-center justify-between font-mono text-sm font-bold ${
                        isCurrent
                          ? 'bg-[#B666FF] text-[#140E26]'
                          : 'bg-[#110D1D] text-slate-300 border border-[#2C2247]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-7 rounded-b bg-[#7C3AED] border border-white flex items-center justify-center">
                          <div className="w-2 h-2 border-t-2 border-l-2 border-amber-300 rotate-45" />
                        </div>
                        <span>{rk.name}</span>
                      </div>
                      <span>{rk.xpRequired} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 7: ACTIVE 2D ARENA GAMEPLAY + MINI MILITIA HUD (SCREENSHOT 2)
      ====================================================================== */}
      {(screen === 'PLAYING' || screen === 'PAUSED') && (
        <>
          <ArenaCanvas
            gamerTag={gamerTag}
            characterId={selectedCharacter}
            petId={selectedPet}
            petLevel={petLevels[selectedPet]}
            initialMedkits={medkitsInventory}
            botCount={botCount}
            killLimit={killLimit}
            matchDurationSec={matchTimeMin * 60}
            moveSensitivity={moveSensitivity / 100}
            aimSpeed={aimSpeed / 100}
            isPaused={screen === 'PAUSED'}
            moveJoystickRef={moveJoystickRef}
            aimJoystickRef={aimJoystickRef}
            actionsRef={actionsRef}
            onHudUpdate={setHud}
            onMedkitCountChange={setMedkitsInventory}
            onMatchEnd={handleMatchEnd}
          />

          {/* Low-Occlusion Perimeter HUD matching Screenshot 2 */}
          <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-4 z-20">
            {/* TOP HUD ROW */}
            <div className="flex items-start justify-between gap-2">
              {/* Top-Left: HP & Jetpack Pill + 1X Scope & Pause Circular Buttons */}
              <div className="flex flex-col items-start gap-2 pointer-events-auto">
                <div className="w-44 sm:w-56 rounded-2xl bg-[#2B2442]/95 border-2 border-[#6B5B9E] px-3.5 py-2.5 space-y-2 shadow-lg">
                  {/* Heart + Mint HP Bar */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-white text-xs">♥</span>
                    <div className="flex-1 h-3 rounded-full bg-[#161224] overflow-hidden">
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%`,
                        }}
                        className="h-full bg-gradient-to-r from-[#2CE5A7] to-[#18F2B2] rounded-full transition-all duration-75"
                      />
                    </div>
                  </div>
                  {/* Crystal + Lavender Jetpack Bar */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-white text-xs">♦</span>
                    <div className="flex-1 h-3 rounded-full bg-[#161224] overflow-hidden">
                      <div
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (hud.jetpack / hud.maxJetpack) * 100)
                          )}%`,
                        }}
                        className="h-full bg-gradient-to-r from-[#C084FC] to-[#9333EA] rounded-full transition-all duration-75"
                      />
                    </div>
                  </div>
                </div>

                {/* Circular 1X (Sniper Scope Zoom-Out), Pause (||), & Operative Ability Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      actionsRef.current.triggerScopeToggle = true;
                    }}
                    title="Sniper Scope Zoom-Out (Sniper Only)"
                    className={`w-12 h-12 rounded-full border-2 font-mono font-black text-sm flex items-center justify-center shadow-lg cursor-pointer transition-all ${
                      hud.canScopeOut
                        ? hud.isScopedOut
                          ? 'bg-[#18F2B2] text-[#0B2620] border-white scale-105'
                          : 'bg-[#2B2442]/95 text-white border-[#6B5B9E]'
                        : 'bg-[#2B2442]/70 text-slate-400 border-slate-600'
                    }`}
                  >
                    {hud.scopeZoomLabel}
                  </button>

                  <button
                    onClick={() => setScreen('PAUSED')}
                    className="w-12 h-12 rounded-full bg-[#2B2442]/95 border-2 border-[#6B5B9E] text-white flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Pause className="w-5 h-5" />
                  </button>

                  {/* Character Ability Button (Parth / Siddharth / Yug) */}
                  <button
                    onClick={() => {
                      actionsRef.current.triggerAbility = true;
                    }}
                    className={`px-3 h-12 rounded-full border-2 font-mono font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer ${
                      hud.abilityActiveLeft > 0
                        ? 'bg-amber-400 text-slate-950 border-white animate-pulse'
                        : hud.abilityCooldownLeft <= 0
                        ? 'bg-[#432E73]/95 text-[#18F2B2] border-[#18F2B2]'
                        : 'bg-[#2B2442]/80 text-slate-400 border-[#6B5B9E]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {hud.abilityActiveLeft > 0
                        ? `${hud.abilityActiveLeft}s`
                        : hud.abilityCooldownLeft > 0
                        ? `${hud.abilityCooldownLeft}s`
                        : `${activeCharSpec.letter} ABILITY`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Top-Center: Giant Outlined Timer & DEATHMATCH 0/15 Pill matching Screenshot 2 */}
              <div className="flex flex-col items-center pointer-events-auto">
                <div className="text-3xl sm:text-4xl font-display font-black text-white tracking-wider drop-shadow-[0_3px_0_#000]">
                  {formatTimer(hud.timeRemaining)}
                </div>
                <div className="mt-0.5 px-4 py-1 rounded-xl bg-[#2B2442]/95 border-2 border-[#6B5B9E] text-center shadow-md">
                  <div className="text-[10px] font-mono font-extrabold text-white tracking-wider uppercase">
                    DEATHMATCH
                  </div>
                  <div className="text-xs font-mono font-black text-amber-400">
                    {hud.kills}/{hud.killLimit}
                  </div>
                </div>

                {hud.scopeWarningText && (
                  <div className="mt-2 px-3 py-1 rounded-xl bg-rose-950/95 border-2 border-rose-400 text-rose-200 text-xs font-mono font-bold shadow-lg">
                    {hud.scopeWarningText}
                  </div>
                )}
              </div>

              {/* Top-Right: Weapon Ammo Box + Circular Grenade, Fullscreen & Trophy (+100 XP) Buttons */}
              <div className="flex flex-col items-end gap-2 pointer-events-auto">
                <div className="w-44 sm:w-56 rounded-2xl bg-[#2B2442]/95 border-2 border-[#6B5B9E] px-3.5 py-2 flex flex-col items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <WeaponIconSvg weaponId={hud.activeWeapon} className="w-12 h-6" />
                    <span className="text-[11px] font-mono font-bold text-white">
                      {activeWeaponSpec.shortName}
                    </span>
                  </div>
                  <div className="w-full flex items-center justify-between font-mono font-black text-sm sm:text-base text-white tabular-nums mt-0.5">
                    <span>{hud.reloading ? 'REL' : pad3(hud.ammo)}</span>
                    <span className="text-slate-300">{pad3(hud.reserveAmmo)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      actionsRef.current.triggerGrenade = true;
                    }}
                    className="relative w-12 h-12 rounded-full bg-[#2B2442]/95 border-2 border-[#6B5B9E] text-white flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <span className="text-base">💣</span>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black border border-white text-[10px] font-mono font-bold flex items-center justify-center">
                      {hud.grenades}
                    </span>
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="w-12 h-12 rounded-full bg-[#2B2442]/95 border-2 border-[#6B5B9E] text-white flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() =>
                      handleMatchEnd({
                        kills: hud.kills,
                        deaths: hud.deaths,
                        coinsEarned: hud.matchCoinsEarned + 80 + hud.kills * 25,
                        xpEarned: 100,
                        victory: true,
                      })
                    }
                    title="Finish Match & Claim +100 XP"
                    className="w-12 h-12 rounded-full bg-[#2B2442]/95 border-2 border-amber-400 text-amber-300 flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Trophy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM CONTROLS: ACTION CIRCLES + MOVE+FLY & AIM+FIRE JOYSTICKS (SCREENSHOT 2) */}
            <div className="flex flex-col gap-2">
              {/* Row of Circular Tactical Buttons right above the Joysticks */}
              <div className="flex items-center justify-between px-2 sm:px-6 pointer-events-auto">
                {/* Left Cluster: GRENADE, PICK UP (Ground Gun), MEDKIT (Instant Heal up to 10) */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* GRENADE */}
                  <button
                    onClick={() => {
                      actionsRef.current.triggerGrenade = true;
                    }}
                    className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#7A5434]/90 border-2 border-[#C89664] flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer"
                  >
                    <span className="text-xl">💣</span>
                    <span className="text-[9px] font-mono font-extrabold text-white uppercase mt-0.5">
                      GRENADE
                    </span>
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/90 border border-amber-400 text-[10px] font-mono font-bold text-white flex items-center justify-center">
                      {hud.grenades}
                    </span>
                  </button>

                  {/* PICK UP GROUND GUN BUTTON */}
                  <button
                    onClick={() => {
                      actionsRef.current.triggerPickup = true;
                    }}
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer transition-all ${
                      hud.nearbyGroundWeapon
                        ? 'bg-[#18F2B2]/95 text-[#0B2620] border-white scale-110'
                        : 'bg-[#2A2438]/80 text-white border-white/40'
                    }`}
                  >
                    <span className="text-xl">✋</span>
                    <span className="text-[9px] font-mono font-extrabold uppercase mt-0.5">
                      {hud.nearbyGroundWeapon
                        ? WEAPONS[hud.nearbyGroundWeapon.weaponId].shortName
                        : 'PICK UP'}
                    </span>
                  </button>

                  {/* MEDKIT INSTANT HEAL BUTTON (UP TO 10 IN INVENTORY) */}
                  <button
                    onClick={() => {
                      actionsRef.current.triggerMedkit = true;
                    }}
                    className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#134E42]/90 border-2 border-[#18F2B2] flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer"
                  >
                    <HeartPulse className="w-6 h-6 text-[#18F2B2]" />
                    <span className="text-[9px] font-mono font-extrabold text-white uppercase mt-0.5">
                      MEDKIT
                    </span>
                    <span className="absolute top-0.5 right-0.5 px-1.5 py-0.2 rounded-full bg-black border border-[#18F2B2] text-[10px] font-mono font-bold text-[#18F2B2]">
                      {hud.medkits}/10
                    </span>
                  </button>
                </div>

                {/* Right Cluster: SNIPER SCOPE, RELOAD, SWAP */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* SNIPER SCOPE ZOOM-OUT BUTTON */}
                  <button
                    onClick={() => {
                      actionsRef.current.triggerScopeToggle = true;
                    }}
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer transition-all ${
                      hud.canScopeOut
                        ? hud.isScopedOut
                          ? 'bg-[#38BDF8] text-slate-950 border-white scale-105'
                          : 'bg-[#1E3A5F]/90 text-white border-[#38BDF8]'
                        : 'bg-[#2A2438]/60 text-slate-400 border-slate-600'
                    }`}
                  >
                    <Crosshair className="w-6 h-6" />
                    <span className="text-[9px] font-mono font-extrabold uppercase mt-0.5">
                      {hud.canScopeOut ? (hud.isScopedOut ? '0.5X ON' : 'SCOPE') : 'NO SCOPE'}
                    </span>
                  </button>

                  {/* RELOAD BUTTON */}
                  <button
                    onClick={() => {
                      actionsRef.current.triggerReload = true;
                    }}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#1C4D54]/90 border-2 border-[#4FD1C5] flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-6 h-6 text-white" />
                    <span className="text-[9px] font-mono font-extrabold text-white uppercase mt-0.5">
                      RELOAD
                    </span>
                  </button>

                  {/* SWAP GUN BUTTON */}
                  <button
                    onClick={() => {
                      actionsRef.current.triggerSwapWeapon = true;
                    }}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#5C3D91]/90 border-2 border-[#A78BFA] flex flex-col items-center justify-center shadow-xl active:scale-95 cursor-pointer"
                  >
                    <span className="text-xl font-bold text-white">⇄</span>
                    <span className="text-[9px] font-mono font-extrabold text-white uppercase mt-0.5">
                      SWAP
                    </span>
                  </button>
                </div>
              </div>

              {/* Dual Concentric Joysticks: MOVE + FLY (Left) & AIM + FIRE (Right) */}
              <div className="flex items-end justify-between px-2 sm:px-6 pb-1">
                <VirtualJoystick
                  label="MOVE + FLY"
                  variant="move"
                  size={joystickPixelSize}
                  onMove={(vec) => {
                    moveJoystickRef.current = vec;
                  }}
                />

                <VirtualJoystick
                  label="AIM + FIRE"
                  variant="aim"
                  size={joystickPixelSize}
                  onMove={(vec) => {
                    aimJoystickRef.current = vec;
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          PAUSED OVERLAY MODAL
      ====================================================================== */}
      {screen === 'PAUSED' && (
        <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#211936] border-2 border-[#6B4CA8] p-6 space-y-4 shadow-2xl">
            <h2 className="text-3xl font-display font-black text-white uppercase text-center">
              GAME PAUSED
            </h2>
            <div className="p-3.5 rounded-2xl bg-[#140F24] border border-[#382B59] text-xs font-mono space-y-1">
              <div>Operative: <strong className="text-[#18F2B2]">{activeCharSpec.name} ({activeCharSpec.letter})</strong></div>
              <div>Companion Pet: <strong className="text-amber-400">{activePetSpec.name} Lv.{petLevels[selectedPet]}</strong></div>
              <div>Medkit Supply: <strong className="text-white">{hud.medkits}/10</strong></div>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => setScreen('PLAYING')}
                className="w-full py-3.5 rounded-2xl bg-[#18F2B2] text-[#0B2620] font-display font-black text-xl uppercase cursor-pointer"
              >
                RESUME MATCH
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full py-3 rounded-2xl bg-[#3D2966] border-2 border-[#6B4CA8] text-white font-display font-black text-lg uppercase cursor-pointer"
              >
                TOUCH & AUDIO SETTINGS
              </button>
              <button
                onClick={() => setScreen('HOME')}
                className="w-full py-3 rounded-2xl bg-[#140F24] border border-[#382B59] text-slate-300 font-display font-black text-lg uppercase cursor-pointer"
              >
                QUIT TO LOBBY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ROUND SUMMARY (+100 XP PER GAME & PET UPGRADE SCREEN)
      ====================================================================== */}
      {screen === 'ROUND_SUMMARY' && lastMatchSummary && (
        <div className="fixed inset-0 z-40 bg-[#140E26]/95 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full rounded-3xl bg-[#211936] border-2 border-[#6B4CA8] p-6 space-y-4 shadow-2xl">
            <div className="text-center">
              <div className="text-xs font-mono font-bold text-[#18F2B2] uppercase">
                MATCH COMPLETE · +100 XP EARNED (1 GAME = 100 XP)
              </div>
              <h2 className="text-4xl font-display font-black text-white uppercase mt-1">
                {lastMatchSummary.victory ? 'VICTORY!' : 'ROUND FINISHED!'}
              </h2>
            </div>

            <div className="flex flex-col items-center">
              <CartoonOperativeSvg
                characterId={selectedCharacter}
                custom={activeCustom}
                holdingGun={false}
                className="w-36 h-40"
              />
              <div className="text-xs font-mono text-[#B67CFF] font-bold uppercase">
                POSE: {equippedPose}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
              <div className="p-3 rounded-2xl bg-[#110D1D] border border-[#382B59]">
                <div className="text-2xl font-display font-black text-[#18F2B2]">
                  +{lastMatchSummary.xpEarned} XP
                </div>
                <div className="text-[10px] text-slate-400">TOTAL: {xp} XP</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#110D1D] border border-[#382B59]">
                <div className="text-2xl font-display font-black text-amber-400">
                  +{lastMatchSummary.coinsEarned}
                </div>
                <div className="text-[10px] text-slate-400">COINS: {coins}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#110D1D] border border-[#382B59]">
                <div className="text-2xl font-display font-black text-white">
                  {lastMatchSummary.kills} KILLS
                </div>
                <div className="text-[10px] text-slate-400">GAMES: {gamesCompleted}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setScreen('ARMORY_PETS')}
                className="flex-1 py-3.5 rounded-2xl bg-[#3D2966] border-2 border-[#6B4CA8] text-white font-display font-black text-lg uppercase cursor-pointer"
              >
                UPGRADE {activePetSpec.name.toUpperCase()} / PETS
              </button>
              <button
                onClick={startBattle}
                className="flex-1 py-3.5 rounded-2xl bg-[#18F2B2] text-[#0B2620] font-display font-black text-xl uppercase cursor-pointer"
              >
                PLAY AGAIN (+100 XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SETTINGS MODAL (MATCHING SCREENSHOT 7 & 14)
      ====================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-[#1E1732] border-2 border-[#543E85] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-display font-black tracking-wider text-white uppercase mx-auto pl-8">
                SETTINGS
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-11 h-11 rounded-2xl bg-[#2E224A] border-2 border-[#5E4694] flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="font-display font-black text-lg tracking-wider uppercase">
                SOUND EFFECTS
              </span>
              <button
                onClick={toggleSound}
                className="w-20 h-11 rounded-2xl bg-[#110D1D] border border-white/15 p-1 flex items-center cursor-pointer"
              >
                <span
                  className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase transition-all ${
                    soundEnabled
                      ? 'ml-auto bg-[#B666FF] text-white'
                      : ' bg-[#2E2640] text-slate-300'
                  }`}
                >
                  {soundEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center justify-between gap-6 py-2 border-b border-white/10">
              <span className="font-display font-black text-lg tracking-wider uppercase">
                VOLUME
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-48 accent-[#B666FF]"
              />
            </div>

            {/* Always Show Touch Controls */}
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="font-display font-black text-lg tracking-wider uppercase">
                ALWAYS SHOW TOUCH CONTROLS
              </span>
              <button
                onClick={() => setAlwaysShowTouch(!alwaysShowTouch)}
                className="w-20 h-11 rounded-2xl bg-[#110D1D] border border-white/15 p-1 flex items-center cursor-pointer"
              >
                <span
                  className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase transition-all ${
                    alwaysShowTouch
                      ? 'ml-auto bg-[#B666FF] text-white'
                      : 'bg-[#2E2640] text-slate-300'
                  }`}
                >
                  {alwaysShowTouch ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* TOUCH CONTROLS SECTION */}
            <div className="space-y-4">
              <div className="text-sm font-mono font-black tracking-wider text-amber-400 uppercase">
                TOUCH CONTROLS
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-display font-black text-lg uppercase">MOVE SENSITIVITY</div>
                  <div className="text-xs font-mono text-slate-300">{moveSensitivity}%</div>
                </div>
                <input
                  type="range"
                  min={30}
                  max={150}
                  value={moveSensitivity}
                  onChange={(e) => setMoveSensitivity(Number(e.target.value))}
                  className="w-48 accent-[#B666FF]"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-display font-black text-lg uppercase">AIM SPEED</div>
                  <div className="text-xs font-mono text-slate-300">{aimSpeed}%</div>
                </div>
                <input
                  type="range"
                  min={30}
                  max={150}
                  value={aimSpeed}
                  onChange={(e) => setAimSpeed(Number(e.target.value))}
                  className="w-48 accent-[#B666FF]"
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Lower values make thumb movements more forgiving. Changes apply immediately.
              </p>

              {/* STICK SIZE */}
              <div>
                <div className="font-display font-black text-lg uppercase mb-2">STICK SIZE</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['SMALL', 'MEDIUM', 'LARGE'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setStickSize(sz)}
                      className={`py-3 rounded-2xl font-mono font-bold text-xs uppercase cursor-pointer ${
                        stickSize === sz
                          ? 'bg-[#B666FF] text-[#140E26]'
                          : 'bg-[#140F24] border border-[#382B59] text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* STICK PLACEMENT */}
              <div>
                <div className="font-display font-black text-lg uppercase mb-2">
                  STICK PLACEMENT
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['FIXED', 'FLOATING'] as const).map((pl) => (
                    <button
                      key={pl}
                      onClick={() => setStickPlacement(pl)}
                      className={`py-3 rounded-2xl font-mono font-bold text-xs uppercase cursor-pointer ${
                        stickPlacement === pl
                          ? 'bg-[#B666FF] text-[#140E26]'
                          : 'bg-[#140F24] border border-[#382B59] text-white'
                      }`}
                    >
                      {pl}
                    </button>
                  ))}
                </div>
              </div>

              {/* AIM SMOOTHING */}
              <div>
                <div className="font-display font-black text-lg uppercase mb-2">AIM SMOOTHING</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['STEADY', 'NORMAL', 'QUICK'] as const).map((sm) => (
                    <button
                      key={sm}
                      onClick={() => setAimSmoothing(sm)}
                      className={`py-3 rounded-2xl font-mono font-bold text-xs uppercase cursor-pointer ${
                        aimSmoothing === sm
                          ? 'bg-[#B666FF] text-[#140E26]'
                          : 'bg-[#140F24] border border-[#382B59] text-white'
                      }`}
                    >
                      {sm}
                    </button>
                  ))}
                </div>
              </div>

              {/* AIM ASSIST & VIBRATION */}
              <div className="flex items-center justify-between py-2 border-t border-white/10">
                <div>
                  <span className="font-display font-black text-lg uppercase mr-2">AIM ASSIST</span>
                  <span className="text-xs font-mono text-slate-400">TOUCH ONLY</span>
                </div>
                <button
                  onClick={() => setAimAssist(!aimAssist)}
                  className="w-20 h-11 rounded-2xl bg-[#110D1D] border border-white/15 p-1 flex items-center cursor-pointer"
                >
                  <span
                    className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase ${
                      aimAssist ? 'ml-auto bg-[#B666FF] text-white' : 'bg-[#2E2640] text-slate-300'
                    }`}
                  >
                    {aimAssist ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-white/10">
                <div>
                  <span className="font-display font-black text-lg uppercase mr-2">VIBRATION</span>
                  <span className="text-xs font-mono text-slate-400">HITS · KILLS · DEATHS</span>
                </div>
                <button
                  onClick={() => setVibration(!vibration)}
                  className="w-20 h-11 rounded-2xl bg-[#110D1D] border border-white/15 p-1 flex items-center cursor-pointer"
                >
                  <span
                    className={`px-3 py-1.5 rounded-xl font-mono font-bold text-xs uppercase ${
                      vibration ? 'ml-auto bg-[#B666FF] text-white' : 'bg-[#2E2640] text-slate-300'
                    }`}
                  >
                    {vibration ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  setMoveSensitivity(80);
                  setAimSpeed(80);
                  setStickSize('LARGE');
                  setStickPlacement('FLOATING');
                  setAimSmoothing('QUICK');
                  showToast('Touch controls reset to default!');
                }}
                className="px-5 py-3 rounded-2xl bg-[#140F24] border-2 border-[#382B59] font-display font-black text-base uppercase text-white cursor-pointer"
              >
                RESET TOUCH CONTROLS
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-8 py-3.5 rounded-2xl bg-[#18F2B2] text-[#0B2620] font-display font-black text-xl uppercase cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ANDROID APK & GITHUB ACTIONS RELEASE MODAL
      ====================================================================== */}
      {showApkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full max-h-[92vh] overflow-y-auto rounded-3xl bg-[#1E1732] border-2 border-[#18F2B2] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-[#18F2B2] uppercase">
                  GITHUB ACTIONS APK PIPELINE CONFIGURED
                </div>
                <h2 className="text-3xl font-display font-black tracking-wider text-white uppercase">
                  PSY ANDROID APK & GITHUB
                </h2>
              </div>
              <button
                onClick={() => setShowApkModal(false)}
                className="w-11 h-11 rounded-2xl bg-[#2E224A] border-2 border-[#5E4694] flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Install to Device (PWA / Android Standalone) */}
            {!isInstalled && (
              <div className="p-4 rounded-2xl bg-[#140F24] border-2 border-[#18F2B2]/60 space-y-2.5">
                <div className="text-xs font-mono font-bold text-[#18F2B2] uppercase">
                  OPTION 1 · DIRECT PHONE INSTALL
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Install <strong>PSY</strong> directly onto your phone home screen right now in fullscreen standalone mode, or use the automated GitHub Actions `.apk` builder below.
                </p>
                {isInstallable ? (
                  <button
                    onClick={async () => {
                      const ok = await install();
                      if (ok) showToast('PSY installed to device home screen!');
                    }}
                    className="w-full py-3 rounded-xl bg-[#18F2B2] text-[#0B2620] font-display font-black text-lg uppercase cursor-pointer"
                  >
                    INSTALL PSY APP NOW
                  </button>
                ) : isIOS ? (
                  <div className="text-xs font-mono text-amber-300">
                    On iOS Safari: Tap Share → Add to Home Screen.
                  </div>
                ) : (
                  <div className="text-xs font-mono text-slate-400">
                    Standalone Web App Manifest & Service Worker active (`com.psy.arena`).
                  </div>
                )}
              </div>
            )}

            {/* GitHub Actions APK Build Workflow Details */}
            <div className="p-4 rounded-2xl bg-[#140F24] border border-[#382B59] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#B67CFF] uppercase">
                  OPTION 2 · GITHUB ACTIONS APK RELEASE
                </span>
                <span className="text-[11px] font-mono text-[#18F2B2] font-bold">
                  READY IN REPO
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This project includes <code className="text-amber-300">.github/workflows/build-apk.yml</code> and <code className="text-amber-300">capacitor.config.json</code> (<code className="text-sky-300">com.psy.arena</code>).
              </p>
              <ol className="text-xs text-slate-200 space-y-1.5 list-decimal list-inside font-mono">
                <li>Push or export this project to your GitHub repository.</li>
                <li>GitHub Actions automatically runs <strong>Build Android APK (PSY Arena)</strong> on every push to <code className="text-[#18F2B2]">main</code> / <code className="text-[#18F2B2]">master</code>.</li>
                <li>Download <strong>PSY-Arena.apk</strong> directly from your repo&apos;s <strong>GitHub Releases (latest-apk)</strong> or workflow <strong>Artifacts</strong>!</li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setShowApkModal(false)}
                className="px-7 py-3 rounded-2xl bg-[#18F2B2] text-[#0B2620] font-display font-black text-lg uppercase cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
