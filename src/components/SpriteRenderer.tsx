import React from 'react';
import { CharacterId, PetId, WeaponId } from '../data/gameData';

export interface AvatarCustomization {
  accentColor: string;
  headgear: string;
  hair: string;
  face: string;
  skin: string;
  top: string;
  joggers: string;
  sneakers: string;
  pose?: 'idle' | 'salute' | 'wave' | 'point' | 'flex' | 'hover' | 'trophy';
}

export const DEFAULT_CUSTOMIZATIONS: Record<CharacterId, AvatarCustomization> = {
  parth: {
    accentColor: '#38BDF8',
    headgear: 'NEON HEADSET',
    hair: 'PSY QUIFF',
    face: 'TACTICAL FRAMES',
    skin: 'TAN',
    top: 'AEGIS JACKET',
    joggers: 'TRACK JOGGERS',
    sneakers: 'NEON SNEAKERS',
    pose: 'salute',
  },
  siddharth: {
    accentColor: '#10B981',
    headgear: 'SNIPER HEADSET',
    hair: 'RECON SPIKES',
    face: 'HAWKEYE FRAMES',
    skin: 'WARM',
    top: 'PHANTOM JACKET',
    joggers: 'STEALTH JOGGERS',
    sneakers: 'EMERALD KICKS',
    pose: 'point',
  },
  yug: {
    accentColor: '#F59E0B',
    headgear: 'AMBER BANDANA',
    hair: 'BLAZE QUIFF',
    face: 'COMMANDO FRAMES',
    skin: 'TAN',
    top: 'NITRO JACKET',
    joggers: 'BLAZE JOGGERS',
    sneakers: 'SOLAR SNEAKERS',
    pose: 'flex',
  },
};

const SKIN_HEX: Record<string, string> = {
  TAN: '#D99B66',
  WARM: '#C68642',
  LIGHT: '#F1C27D',
  DEEP: '#8D5524',
};

export const CartoonOperativeSvg: React.FC<{
  characterId: CharacterId;
  custom?: Partial<AvatarCustomization>;
  holdingGun?: boolean;
  headOnly?: boolean;
  className?: string;
}> = ({ characterId, custom, holdingGun = true, headOnly = false, className = 'w-32 h-32' }) => {
  const base = { ...DEFAULT_CUSTOMIZATIONS[characterId], ...custom };
  const accent = base.accentColor;
  const skinColor = SKIN_HEX[base.skin] || '#D99B66';
  const letter = characterId === 'parth' ? 'P' : characterId === 'siddharth' ? 'S' : 'Y';

  if (headOnly) {
    return (
      <svg viewBox="0 0 120 120" className={className} fill="none">
        {/* Background Circle */}
        <circle cx="60" cy="62" r="50" fill="#18122B" stroke="#2D224C" strokeWidth="3" />
        {/* Hair Quiff behind */}
        <path
          d="M25 56C22 30 42 14 68 16C78 16 86 12 90 8C92 18 86 26 82 28C94 34 96 48 94 58Z"
          fill="#1F1924"
          stroke="#09070B"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Head */}
        <ellipse
          cx="60"
          cy="66"
          rx="34"
          ry="30"
          fill={skinColor}
          stroke="#09070B"
          strokeWidth="4.5"
        />
        {/* Headband / Bandana if selected */}
        {base.headgear.includes('BANDANA') && (
          <path
            d="M27 54C36 46 84 46 93 54L91 44C80 38 40 38 29 44Z"
            fill={accent}
            stroke="#09070B"
            strokeWidth="3.5"
          />
        )}
        {base.headgear.includes('BEANIE') && (
          <path
            d="M26 52C28 26 92 26 94 52Z"
            fill={accent}
            stroke="#09070B"
            strokeWidth="4"
          />
        )}
        {base.headgear.includes('CAP') && (
          <g>
            <path
              d="M26 50C28 26 92 26 94 50Z"
              fill={accent}
              stroke="#09070B"
              strokeWidth="4"
            />
            <path d="M50 46H104V52H50Z" fill={accent} stroke="#09070B" strokeWidth="3.5" />
          </g>
        )}
        {/* Eyebrows */}
        <path d="M39 52Q47 48 55 52" stroke="#141118" strokeWidth="4" strokeLinecap="round" />
        <path d="M65 52Q73 48 81 52" stroke="#141118" strokeWidth="4" strokeLinecap="round" />
        {/* Glasses / Frames */}
        <rect
          x="34"
          y="55"
          width="23"
          height="16"
          rx="4"
          fill="#E2E8F0"
          fillOpacity="0.85"
          stroke="#A78BFA"
          strokeWidth="3.5"
        />
        <rect
          x="63"
          y="55"
          width="23"
          height="16"
          rx="4"
          fill="#E2E8F0"
          fillOpacity="0.85"
          stroke="#A78BFA"
          strokeWidth="3.5"
        />
        <line x1="57" y1="62" x2="63" y2="62" stroke="#A78BFA" strokeWidth="3.5" />
        {/* Pupils */}
        <circle cx="46" cy="63" r="4.5" fill="#1E293B" />
        <circle cx="74" cy="63" r="4.5" fill="#1E293B" />
        <circle cx="44.5" cy="61.5" r="1.5" fill="#FFFFFF" />
        <circle cx="72.5" cy="61.5" r="1.5" fill="#FFFFFF" />
        {/* Big Cartoon Grin */}
        <path
          d="M43 77Q60 92 77 77Z"
          fill="#FFFFFF"
          stroke="#09070B"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Headset Ear Cups */}
        {(base.headgear.includes('HEADSET') || base.headgear === 'NEON HEADSET') && (
          <>
            <rect
              x="14"
              y="52"
              width="13"
              height="26"
              rx="6"
              fill="#1E293B"
              stroke="#09070B"
              strokeWidth="4"
            />
            <rect x="18" y="57" width="4" height="16" rx="2" fill={accent} />
            <rect
              x="93"
              y="52"
              width="13"
              height="26"
              rx="6"
              fill="#1E293B"
              stroke="#09070B"
              strokeWidth="4"
            />
            <rect x="98" y="57" width="4" height="16" rx="2" fill={accent} />
          </>
        )}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 220" className={className} fill="none">
      {/* Ground Shadow */}
      <ellipse cx="90" cy="204" rx="46" ry="8" fill="rgba(0,0,0,0.45)" />

      {/* Jetpack Thruster Pack Behind Torso */}
      <rect
        x="52"
        y="108"
        width="76"
        height="48"
        rx="10"
        fill="#1E1B2E"
        stroke="#09070B"
        strokeWidth="4.5"
      />
      <rect x="57" y="116" width="8" height="30" rx="3" fill={accent} />
      <rect x="115" y="116" width="8" height="30" rx="3" fill={accent} />

      {/* Legs / Joggers */}
      <rect
        x="68"
        y="158"
        width="18"
        height="28"
        fill="#161922"
        stroke="#09070B"
        strokeWidth="4.5"
      />
      <rect
        x="94"
        y="158"
        width="18"
        height="28"
        fill="#161922"
        stroke="#09070B"
        strokeWidth="4.5"
      />
      <line x1="72" y1="162" x2="72" y2="184" stroke={accent} strokeWidth="3" />
      <line x1="108" y1="162" x2="108" y2="184" stroke={accent} strokeWidth="3" />

      {/* Sneakers */}
      <path
        d="M58 184H88V198H54C54 190 56 184 58 184Z"
        fill={accent}
        stroke="#09070B"
        strokeWidth="4"
      />
      <rect x="54" y="194" width="34" height="6" rx="2" fill="#FFFFFF" stroke="#09070B" strokeWidth="3" />
      <path
        d="M92 184H122C124 184 126 190 126 198H92V184Z"
        fill={accent}
        stroke="#09070B"
        strokeWidth="4"
      />
      <rect x="92" y="194" width="34" height="6" rx="2" fill="#FFFFFF" stroke="#09070B" strokeWidth="3" />

      {/* Jacket / Torso */}
      <rect
        x="60"
        y="112"
        width="60"
        height="50"
        rx="12"
        fill="#1A2634"
        stroke="#09070B"
        strokeWidth="4.5"
      />
      {/* Neon Jacket Stripes & Character Emblem (P / S / Y) */}
      <line x1="90" y1="114" x2="90" y2="158" stroke={accent} strokeWidth="4" />
      <rect
        x="96"
        y="124"
        width="14"
        height="14"
        rx="3"
        fill={accent}
        stroke="#09070B"
        strokeWidth="2.5"
      />
      <text
        x="103"
        y="135"
        textAnchor="middle"
        fill="#09070B"
        fontSize="11"
        fontWeight="900"
        fontFamily="monospace"
      >
        {letter}
      </text>

      {/* Hair Quiff */}
      <path
        d="M46 68C42 34 66 14 98 16C112 16 122 10 128 6C130 18 122 30 116 32C132 40 136 58 132 72Z"
        fill="#1E1926"
        stroke="#09070B"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Big Cartoon Head */}
      <ellipse
        cx="90"
        cy="78"
        rx="42"
        ry="36"
        fill={skinColor}
        stroke="#09070B"
        strokeWidth="5"
      />

      {/* Optional Bandana / Cap / Beanie */}
      {base.headgear.includes('BANDANA') && (
        <path
          d="M49 62C62 52 118 52 131 62L129 50C114 42 66 42 51 50Z"
          fill={accent}
          stroke="#09070B"
          strokeWidth="4"
        />
      )}

      {/* Eyebrows */}
      <path d="M62 60Q72 55 82 60" stroke="#141118" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M98 60Q108 55 118 60" stroke="#141118" strokeWidth="4.5" strokeLinecap="round" />

      {/* Glasses / Goggles */}
      <rect
        x="56"
        y="64"
        width="29"
        height="20"
        rx="5"
        fill="#E2E8F0"
        fillOpacity="0.9"
        stroke="#A78BFA"
        strokeWidth="4"
      />
      <rect
        x="95"
        y="64"
        width="29"
        height="20"
        rx="5"
        fill="#E2E8F0"
        fillOpacity="0.9"
        stroke="#A78BFA"
        strokeWidth="4"
      />
      <line x1="85" y1="73" x2="95" y2="73" stroke="#A78BFA" strokeWidth="4" />

      {/* Eyes */}
      <circle cx="71" cy="74" r="5.5" fill="#1E293B" />
      <circle cx="109" cy="74" r="5.5" fill="#1E293B" />
      <circle cx="69" cy="72" r="2" fill="#FFFFFF" />
      <circle cx="107" cy="72" r="2" fill="#FFFFFF" />

      {/* Big Friendly Cartoon Smile */}
      <path
        d="M68 91Q90 109 112 91Z"
        fill="#FFFFFF"
        stroke="#09070B"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Headset Ear Cups */}
      <rect
        x="32"
        y="60"
        width="16"
        height="34"
        rx="8"
        fill="#17212B"
        stroke="#09070B"
        strokeWidth="4.5"
      />
      <rect x="38" y="67" width="4.5" height="20" rx="2" fill={accent} />
      <rect
        x="132"
        y="60"
        width="16"
        height="34"
        rx="8"
        fill="#17212B"
        stroke="#09070B"
        strokeWidth="4.5"
      />
      <rect x="137.5" y="67" width="4.5" height="20" rx="2" fill={accent} />

      {/* Gun or Pose Arms */}
      {holdingGun ? (
        <g>
          {/* Rifle Across Chest */}
          <path
            d="M48 134L126 106L130 116L52 146Z"
            fill="#1E242B"
            stroke="#09070B"
            strokeWidth="4"
          />
          <line x1="120" y1="110" x2="144" y2="101" stroke="#1E242B" strokeWidth="6" strokeLinecap="round" />
          {/* Hands */}
          <circle cx="62" cy="142" r="9" fill={skinColor} stroke="#09070B" strokeWidth="4" />
          <circle cx="114" cy="136" r="9" fill={skinColor} stroke="#09070B" strokeWidth="4" />
        </g>
      ) : (
        <g>
          {/* Salute / Wave Pose Arm */}
          <path
            d="M118 126L134 94L120 76"
            stroke="#1A2634"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="56" cy="142" r="9" fill={skinColor} stroke="#09070B" strokeWidth="4" />
          <circle cx="120" cy="74" r="9" fill={skinColor} stroke="#09070B" strokeWidth="4" />
        </g>
      )}
    </svg>
  );
};

export const CharacterAvatarSvg: React.FC<{
  characterId: CharacterId;
  className?: string;
}> = ({ characterId, className = 'w-16 h-16' }) => {
  return <CartoonOperativeSvg characterId={characterId} headOnly className={className} />;
};

export const PetAvatarSvg: React.FC<{
  petId: PetId;
  className?: string;
}> = ({ petId, className = 'w-16 h-16' }) => {
  switch (petId) {
    case 'sheru':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="26" cy="26" r="12" fill="#D97706" stroke="#09070B" strokeWidth="4" />
          <circle cx="74" cy="26" r="12" fill="#D97706" stroke="#09070B" strokeWidth="4" />
          <circle cx="50" cy="54" r="30" fill="#F59E0B" stroke="#09070B" strokeWidth="4.5" />
          <path d="M44 28L50 40L56 28" stroke="#09070B" strokeWidth="4" strokeLinecap="round" />
          <path d="M22 50L32 52" stroke="#09070B" strokeWidth="4" strokeLinecap="round" />
          <path d="M78 50L68 52" stroke="#09070B" strokeWidth="4" strokeLinecap="round" />
          <circle cx="38" cy="50" r="5.5" fill="#09070B" />
          <circle cx="62" cy="50" r="5.5" fill="#09070B" />
          <circle cx="36.5" cy="48.5" r="2" fill="#FFF" />
          <circle cx="60.5" cy="48.5" r="2" fill="#FFF" />
          <ellipse cx="50" cy="64" rx="14" ry="10" fill="#FEF3C7" stroke="#09070B" strokeWidth="3" />
          <polygon points="46,59 54,59 50,65" fill="#EF4444" />
        </svg>
      );
    case 'wolfs':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <polygon points="22,42 16,12 42,30" fill="#0284C7" stroke="#09070B" strokeWidth="4" />
          <polygon points="78,42 84,12 58,30" fill="#0284C7" stroke="#09070B" strokeWidth="4" />
          <polygon points="50,22 82,50 68,84 32,84 18,50" fill="#38BDF8" stroke="#09070B" strokeWidth="4.5" />
          <circle cx="37" cy="52" r="5" fill="#09070B" />
          <circle cx="63" cy="52" r="5" fill="#09070B" />
          <polygon points="40,62 60,62 50,80" fill="#E0F2FE" stroke="#09070B" strokeWidth="3" />
        </svg>
      );
    case 'draky':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M22 52L4 24L14 68L28 64Z" fill="#991B1B" stroke="#09070B" strokeWidth="3.5" />
          <path d="M78 52L96 24L86 68L72 64Z" fill="#991B1B" stroke="#09070B" strokeWidth="3.5" />
          <path d="M36 30L24 10L44 26Z" fill="#F59E0B" stroke="#09070B" strokeWidth="3" />
          <path d="M64 30L76 10L56 26Z" fill="#F59E0B" stroke="#09070B" strokeWidth="3" />
          <circle cx="50" cy="54" r="25" fill="#EF4444" stroke="#09070B" strokeWidth="4.5" />
          <circle cx="40" cy="50" r="5" fill="#FEF08A" stroke="#09070B" strokeWidth="2.5" />
          <circle cx="60" cy="50" r="5" fill="#FEF08A" stroke="#09070B" strokeWidth="2.5" />
          <path d="M44 72L50 92L56 72Z" fill="#F59E0B" />
        </svg>
      );
    case 'pegasus':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M24 58C8 44 6 24 22 20C26 34 30 42 34 48Z" fill="#818CF8" stroke="#09070B" strokeWidth="3.5" />
          <path d="M76 58C92 44 94 24 78 20C74 34 70 42 66 48Z" fill="#818CF8" stroke="#09070B" strokeWidth="3.5" />
          <polygon points="44,28 50,6 56,28" fill="#FACC15" stroke="#09070B" strokeWidth="3" />
          <circle cx="50" cy="54" r="25" fill="#EEF2FF" stroke="#09070B" strokeWidth="4.5" />
          <circle cx="40" cy="50" r="5" fill="#4F46E5" />
          <circle cx="60" cy="50" r="5" fill="#4F46E5" />
        </svg>
      );
    case 'poink':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <ellipse cx="50" cy="14" rx="22" ry="6" stroke="#FACC15" strokeWidth="3.5" />
          <polygon points="22,38 14,20 34,28" fill="#DB2777" stroke="#09070B" strokeWidth="3.5" />
          <polygon points="78,38 86,20 66,28" fill="#DB2777" stroke="#09070B" strokeWidth="3.5" />
          <circle cx="50" cy="54" r="28" fill="#EC4899" stroke="#09070B" strokeWidth="4.5" />
          <rect x="30" y="38" width="40" height="11" rx="5" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
          <ellipse cx="50" cy="62" rx="13" ry="9" fill="#FBCFE8" stroke="#09070B" strokeWidth="3.5" />
          <circle cx="45" cy="62" r="3" fill="#09070B" />
          <circle cx="55" cy="62" r="3" fill="#09070B" />
        </svg>
      );
  }
};

export const WeaponIconSvg: React.FC<{
  weaponId: WeaponId;
  className?: string;
}> = ({ weaponId, className = 'w-14 h-7' }) => {
  const isSniper = weaponId === 'awm_sniper' || weaponId === 'barrett_sniper';
  const color =
    weaponId === 'awm_sniper'
      ? '#EF4444'
      : weaponId === 'barrett_sniper'
      ? '#38BDF8'
      : weaponId === 'ak47_rifle'
      ? '#F59E0B'
      : weaponId === 'm4_carbine'
      ? '#10B981'
      : weaponId === 'spas_shotgun'
      ? '#EC4899'
      : weaponId === 'rpg_launcher'
      ? '#F97316'
      : '#A855F7';

  return (
    <svg viewBox="0 0 100 40" className={className} fill="none">
      <polygon points="6,18 22,16 22,28 6,26" fill="#334155" stroke="#09070B" strokeWidth="2.5" />
      <rect x="22" y="14" width="38" height="12" rx="2" fill={color} stroke="#09070B" strokeWidth="2.5" />
      <polygon points="38,26 46,26 43,38 35,38" fill="#475569" stroke="#09070B" strokeWidth="2" />
      <rect x="60" y="17" width={isSniper ? '36' : '24'} height="5" fill="#E2E8F0" stroke="#09070B" strokeWidth="2" />
      {isSniper && (
        <rect x="28" y="6" width="26" height="6" rx="2" fill="#0F172A" stroke={color} strokeWidth="2" />
      )}
    </svg>
  );
};
