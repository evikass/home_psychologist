"use client";

import { motion } from "framer-motion";

/**
 * SVG-отрисовка метафорической карты.
 * Каждая карта — уникальное визуальное изображение.
 */
export function MetaphorCardImage({ cardId }: { cardId: string }) {
  const image = renderCardImage(cardId);
  return (
    <div className="relative w-full max-w-[320px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-primary/20">
      <svg viewBox="0 0 240 320" className="w-full h-full" role="img" aria-label={`Карта: ${cardId}`}>
        {image}
      </svg>
    </div>
  );
}

function renderCardImage(cardId: string): React.ReactNode {
  switch (cardId) {
    case "lighthouse-storm":
      return <LighthouseStorm />;
    case "bridge-fog":
      return <BridgeFog />;
    case "tree-roots":
      return <TreeRoots />;
    case "key-door":
      return <KeyDoor />;
    case "broken-pot-flowers":
      return <BrokenPot />;
    case "wolf-moon":
      return <WolfMoon />;
    case "nest-eggs":
      return <NestEggs />;
    case "mirror-shadow":
      return <MirrorShadow />;
    case "river-dam":
      return <RiverDam />;
    case "compass-crossroads":
      return <CompassCrossroads />;
    case "caterpillar-cocoon":
      return <Cocoon />;
    case "two-hands-light":
      return <TwoHandsLight />;
    default:
      return <DefaultCard />;
  }
}

// === Индивидуальные SVG для каждой карты ===

function LighthouseStorm() {
  return (
    <>
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <radialGradient id="ls-light" cx="50%" cy="30%" r="40%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="320" fill="url(#ls-sky)" />
      {/* Волны */}
      <path d="M0 250 Q60 240 120 250 T240 250 L240 320 L0 320 Z" fill="#1e3a5f" opacity="0.7" />
      <path d="M0 270 Q60 260 120 270 T240 270 L240 320 L0 320 Z" fill="#0f172a" opacity="0.8" />
      {/* Скала */}
      <path d="M90 250 L100 200 L140 200 L150 250 Z" fill="#334155" />
      {/* Маяк */}
      <rect x="105" y="100" width="30" height="100" fill="#e2e8f0" />
      <rect x="100" y="95" width="40" height="10" fill="#94a3b8" />
      <rect x="108" y="70" width="24" height="25" fill="#fef3c7" />
      <rect x="103" y="65" width="34" height="8" fill="#94a3b8" />
      {/* Свет */}
      <circle cx="120" cy="82" r="60" fill="url(#ls-light)" />
      <circle cx="120" cy="82" r="8" fill="#fef3c7" />
      {/* Молния */}
      <path d="M180 30 L170 60 L185 55 L175 90" fill="none" stroke="#fef3c7" strokeWidth="2" opacity="0.6" />
    </>
  );
}

function BridgeFog() {
  return (
    <>
      <defs>
        <linearGradient id="bf-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <radialGradient id="bf-fog" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="320" fill="url(#bf-bg)" />
      {/* Пропасть */}
      <path d="M0 280 L240 280 L240 320 L0 320 Z" fill="#1e293b" />
      {/* Мост */}
      <rect x="40" y="200" width="160" height="12" fill="#78350f" rx="2" />
      <line x1="50" y1="200" x2="50" y2="190" stroke="#92400e" strokeWidth="3" />
      <line x1="190" y1="200" x2="190" y2="190" stroke="#92400e" strokeWidth="3" />
      <line x1="55" y1="195" x2="55" y2="205" stroke="#92400e" strokeWidth="2" />
      <line x1="185" y1="195" x2="185" y2="205" stroke="#92400e" strokeWidth="2" />
      {/* Перила */}
      <line x1="40" y1="195" x2="200" y2="195" stroke="#92400e" strokeWidth="2" />
      <line x1="40" y1="190" x2="200" y2="190" stroke="#92400e" strokeWidth="2" />
      {/* Туман */}
      <rect width="240" height="320" fill="url(#bf-fog)" />
      <ellipse cx="200" cy="180" rx="60" ry="40" fill="#f1f5f9" opacity="0.6" />
    </>
  );
}

function TreeRoots() {
  return (
    <>
      <defs>
        <linearGradient id="tr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id="tr-earth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
      </defs>
      <rect width="240" height="160" fill="url(#tr-sky)" />
      <rect y="160" width="240" height="160" fill="url(#tr-earth)" />
      {/* Ствол */}
      <rect x="105" y="40" width="30" height="130" fill="#78350f" rx="4" />
      {/* Крона */}
      <circle cx="120" cy="40" r="50" fill="#16a34a" opacity="0.8" />
      <circle cx="90" cy="55" r="35" fill="#15803d" opacity="0.7" />
      <circle cx="150" cy="55" r="35" fill="#15803d" opacity="0.7" />
      {/* Корни — обнажённые */}
      <path d="M105 170 Q80 200 60 250 Q50 280 45 310" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
      <path d="M120 170 Q120 210 120 260 Q120 290 120 315" fill="none" stroke="#78350f" strokeWidth="7" strokeLinecap="round" />
      <path d="M135 170 Q160 200 180 250 Q190 280 195 310" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
      {/* Мелкие корни */}
      <path d="M110 175 Q95 200 85 230" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
      <path d="M130 175 Q145 200 155 230" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function KeyDoor() {
  return (
    <>
      <defs>
        <linearGradient id="kd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#44403c" />
          <stop offset="100%" stopColor="#1c1917" />
        </linearGradient>
      </defs>
      <rect width="240" height="320" fill="url(#kd-wall)" />
      {/* Дверь */}
      <rect x="70" y="40" width="100" height="240" fill="#78350f" rx="4" />
      <rect x="78" y="48" width="84" height="224" fill="#92400e" rx="2" />
      {/* Петли */}
      <rect x="68" y="70" width="6" height="12" fill="#525252" />
      <rect x="68" y="240" width="6" height="12" fill="#525252" />
      {/* Замочная скважина */}
      <circle cx="120" cy="160" r="8" fill="#1c1917" />
      <rect x="118" y="160" width="4" height="14" fill="#1c1917" />
      {/* Свет из щели */}
      <rect x="168" y="48" width="3" height="224" fill="#fef3c7" opacity="0.5" />
      {/* Ключ в руке */}
      <g transform="translate(50, 270)">
        <circle cx="15" cy="15" r="10" fill="none" stroke="#ca8a04" strokeWidth="3" />
        <rect x="22" y="13" width="25" height="4" fill="#ca8a04" />
        <rect x="42" y="13" width="3" height="8" fill="#ca8a04" />
        <rect x="47" y="13" width="3" height="6" fill="#ca8a04" />
      </g>
    </>
  );
}

function BrokenPot() {
  return (
    <>
      <rect width="240" height="320" fill="#fef3c7" />
      {/* Земля */}
      <ellipse cx="120" cy="290" rx="100" ry="20" fill="#92400e" opacity="0.3" />
      {/* Кувшин */}
      <path d="M80 180 Q70 200 75 240 Q80 275 120 280 Q160 275 165 240 Q170 200 160 180 Z" fill="#a78bfa" opacity="0.7" />
      <ellipse cx="120" cy="180" rx="40" ry="8" fill="#7c3aed" opacity="0.6" />
      {/* Трещина */}
      <path d="M120 180 L115 200 L125 220 L118 240 L122 270" fill="none" stroke="#1c1917" strokeWidth="2" opacity="0.4" />
      {/* Цветы из трещины */}
      <circle cx="118" cy="200" r="6" fill="#ec4899" />
      <circle cx="118" cy="200" r="2" fill="#fef3c7" />
      <circle cx="125" cy="225" r="7" fill="#f59e0b" />
      <circle cx="125" cy="225" r="2.5" fill="#fef3c7" />
      <circle cx="120" cy="255" r="6" fill="#ec4899" />
      <circle cx="120" cy="255" r="2" fill="#fef3c7" />
      {/* Стебли */}
      <path d="M120 180 L118 200 L125 225 L120 255" fill="none" stroke="#16a34a" strokeWidth="2" />
      {/* Листья */}
      <ellipse cx="112" cy="215" rx="5" ry="3" fill="#16a34a" transform="rotate(-30 112 215)" />
      <ellipse cx="130" cy="240" rx="5" ry="3" fill="#16a34a" transform="rotate(30 130 240)" />
    </>
  );
}

function WolfMoon() {
  return (
    <>
      <defs>
        <radialGradient id="wm-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id="wm-glow" cx="50%" cy="40%" r="40%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="320" fill="#0f172a" />
      {/* Звёзды */}
      {[[30,40],[60,25],[200,50],[180,30],[50,80],[210,90],[100,20],[160,15]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1" fill="#fef3c7" opacity="0.6" />
      ))}
      {/* Луна */}
      <circle cx="170" cy="80" r="40" fill="url(#wm-glow)" />
      <circle cx="170" cy="80" r="28" fill="url(#wm-moon)" />
      {/* Холм */}
      <path d="M0 280 Q120 230 240 280 L240 320 L0 320 Z" fill="#1e293b" />
      {/* Волк */}
      <g transform="translate(80, 220)">
        {/* Тело */}
        <ellipse cx="30" cy="40" rx="25" ry="15" fill="#334155" />
        {/* Голова */}
        <ellipse cx="50" cy="25" rx="12" ry="10" fill="#334155" />
        {/* Уши */}
        <path d="M45 18 L43 8 L48 15 Z" fill="#334155" />
        <path d="M55 18 L57 8 L52 15 Z" fill="#334155" />
        {/* Морда */}
        <path d="M58 25 L68 22 L65 28 Z" fill="#334155" />
        {/* Ноги */}
        <rect x="20" y="50" width="4" height="15" fill="#334155" />
        <rect x="28" y="50" width="4" height="15" fill="#334155" />
        <rect x="38" y="50" width="4" height="15" fill="#334155" />
        <rect x="46" y="50" width="4" height="15" fill="#334155" />
        {/* Хвост */}
        <path d="M10 35 Q0 25 5 15" fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        {/* Глаз */}
        <circle cx="53" cy="23" r="1.5" fill="#fde68a" />
      </g>
    </>
  );
}

function NestEggs() {
  return (
    <>
      <rect width="240" height="320" fill="#f0fdf4" />
      {/* Ветвь */}
      <rect x="40" y="200" width="160" height="8" fill="#78350f" rx="4" />
      {/* Гнездо */}
      <ellipse cx="120" cy="200" rx="55" ry="18" fill="#92400e" />
      <ellipse cx="120" cy="195" rx="50" ry="15" fill="#a16207" />
      {/* Веточки гнезда */}
      {Array.from({length: 12}).map((_,i)=>{
        const a = (180 / 12) * i - 90;
        const rad = (a * Math.PI) / 180;
        const x1 = 120 + 50 * Math.cos(rad);
        const y1 = 195 + 15 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x1+8} y2={y1-2} stroke="#78350f" strokeWidth="2" opacity="0.6" />
      })}
      {/* Осколки скорлупы */}
      <path d="M100 198 Q105 190 110 195 Z" fill="#fef3c7" opacity="0.8" />
      <path d="M130 196 Q135 188 140 193 Z" fill="#fef3c7" opacity="0.8" />
      {/* Пух */}
      <circle cx="95" cy="188" r="3" fill="#f1f5f9" opacity="0.7" />
      <circle cx="140" cy="185" r="2.5" fill="#f1f5f9" opacity="0.7" />
      <circle cx="115" cy="182" r="2" fill="#f1f5f9" opacity="0.6" />
      {/* Пустота в центре */}
      <ellipse cx="120" cy="195" rx="25" ry="8" fill="#78350f" opacity="0.3" />
      {/* Листья */}
      <ellipse cx="70" cy="195" rx="8" ry="4" fill="#16a34a" transform="rotate(-20 70 195)" />
      <ellipse cx="170" cy="198" rx="8" ry="4" fill="#16a34a" transform="rotate(20 170 198)" />
    </>
  );
}

function MirrorShadow() {
  return (
    <>
      <rect width="240" height="320" fill="#1e1b1b" />
      {/* Зеркало */}
      <ellipse cx="120" cy="160" rx="60" ry="90" fill="#334155" opacity="0.3" />
      <ellipse cx="120" cy="160" rx="55" ry="85" fill="#1e293b" />
      {/* Силуэт человека */}
      <ellipse cx="120" cy="110" rx="18" ry="22" fill="#475569" />
      <rect x="105" y="130" width="30" height="60" rx="10" fill="#475569" />
      {/* Тень в зеркале — другой силуэт */}
      <ellipse cx="120" cy="110" rx="18" ry="22" fill="#0f172a" opacity="0.8" />
      <rect x="105" y="130" width="30" height="60" rx="10" fill="#0f172a" opacity="0.8" />
      {/* Глаза тени — светящиеся */}
      <circle cx="113" cy="105" r="2" fill="#7c3aed" opacity="0.8" />
      <circle cx="127" cy="105" r="2" fill="#7c3aed" opacity="0.8" />
      {/* Рамка зеркала */}
      <ellipse cx="120" cy="160" rx="60" ry="90" fill="none" stroke="#525252" strokeWidth="3" />
      {/* Трещина на зеркале */}
      <path d="M120 80 L115 120 L125 160 L118 200 L122 240" fill="none" stroke="#525252" strokeWidth="1" opacity="0.5" />
    </>
  );
}

function RiverDam() {
  return (
    <>
      <defs>
        <linearGradient id="rd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id="rd-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      <rect width="240" height="320" fill="url(#rd-sky)" />
      {/* Вода до плотины */}
      <rect x="0" y="140" width="130" height="180" fill="url(#rd-water)" />
      {/* Волны давления */}
      <path d="M0 150 Q30 145 60 150 T120 155" fill="none" stroke="#7dd3fc" strokeWidth="2" opacity="0.5" />
      <path d="M0 165 Q30 160 60 165 T120 170" fill="none" stroke="#7dd3fc" strokeWidth="2" opacity="0.4" />
      {/* Плотина */}
      <rect x="125" y="120" width="20" height="200" fill="#525252" />
      <rect x="125" y="120" width="20" height="200" fill="url(#rd-sky)" opacity="0.3" />
      {/* Трещины в плотине */}
      <path d="M135 180 L132 200 L137 220" fill="none" stroke="#1c1917" strokeWidth="1.5" />
      <path d="M130 240 L133 260" fill="none" stroke="#1c1917" strokeWidth="1" />
      {/* Вода после плотины — тонкая струйка */}
      <rect x="145" y="220" width="95" height="100" fill="url(#rd-water)" opacity="0.5" />
      <path d="M145 220 Q160 240 155 270 Q150 290 160 310" fill="none" stroke="#0ea5e9" strokeWidth="3" opacity="0.6" />
      {/* Брызги */}
      <circle cx="140" cy="215" r="2" fill="#7dd3fc" opacity="0.6" />
      <circle cx="148" cy="210" r="1.5" fill="#7dd3fc" opacity="0.5" />
    </>
  );
}

function CompassCrossroads() {
  return (
    <>
      <rect width="240" height="320" fill="#fef3c7" />
      {/* Земля */}
      <ellipse cx="120" cy="280" rx="120" ry="40" fill="#a16207" opacity="0.3" />
      {/* 4 дороги */}
      <path d="M120 160 L60 320" stroke="#78350f" strokeWidth="12" opacity="0.5" />
      <path d="M120 160 L180 320" stroke="#78350f" strokeWidth="12" opacity="0.5" />
      <path d="M120 160 L20 320" stroke="#78350f" strokeWidth="8" opacity="0.4" />
      <path d="M120 160 L220 320" stroke="#78350f" strokeWidth="8" opacity="0.4" />
      {/* Компас */}
      <circle cx="120" cy="160" r="50" fill="#fef3c7" stroke="#ca8a04" strokeWidth="3" />
      <circle cx="120" cy="160" r="45" fill="none" stroke="#ca8a04" strokeWidth="1" opacity="0.5" />
      {/* Стрелка компаса — дрожащая */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "120px 160px" }}
      >
        <path d="M120 120 L126 160 L120 200 L114 160 Z" fill="#dc2626" />
        <path d="M120 120 L126 160 L120 160 Z" fill="#ef4444" />
      </motion.g>
      <circle cx="120" cy="160" r="4" fill="#1c1917" />
      {/* N S E W */}
      <text x="120" y="118" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1c1917">N</text>
      <text x="120" y="208" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1c1917">S</text>
      <text x="168" y="164" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1c1917">E</text>
      <text x="72" y="164" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1c1917">W</text>
    </>
  );
}

function Cocoon() {
  return (
    <>
      <defs>
        <linearGradient id="co-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <radialGradient id="co-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="320" fill="url(#co-bg)" />
      {/* Звёзды */}
      {[[40,40],[200,60],[100,30],[180,100],[60,90]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="1" fill="#c4b5fd" opacity="0.5" />
      ))}
      {/* Ветка */}
      <path d="M40 60 Q120 80 200 60" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      {/* Кокон */}
      <ellipse cx="120" cy="170" rx="35" ry="65" fill="#7c3aed" opacity="0.6" />
      <ellipse cx="120" cy="170" rx="32" ry="62" fill="#6d28d9" opacity="0.7" />
      {/* Свечение внутри */}
      <ellipse cx="120" cy="160" rx="20" ry="35" fill="url(#co-glow)" />
      {/* Трещины */}
      <path d="M115 120 L118 140 L112 155 L120 175" fill="none" stroke="#fde68a" strokeWidth="1" opacity="0.6" />
      <path d="M125 130 L122 150 L128 170" fill="none" stroke="#fde68a" strokeWidth="0.8" opacity="0.5" />
      {/* Нить подвеса */}
      <line x1="120" y1="80" x2="120" y2="105" stroke="#e2e8f0" strokeWidth="1" opacity="0.4" />
      {/* Листья на ветке */}
      <ellipse cx="70" cy="55" rx="8" ry="4" fill="#16a34a" transform="rotate(-20 70 55)" />
      <ellipse cx="170" cy="55" rx="8" ry="4" fill="#16a34a" transform="rotate(20 170 55)" />
    </>
  );
}

function TwoHandsLight() {
  return (
    <>
      <defs>
        <radialGradient id="th-light" cx="50%" cy="50%" r="30%">
          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#fde68a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="320" fill="#1e293b" />
      {/* Свет между руками */}
      <circle cx="120" cy="160" r="60" fill="url(#th-light)" />
      {/* Левая рука */}
      <path d="M20 140 Q40 150 60 155 Q75 158 85 160 Q95 162 100 165 L100 175 Q90 172 80 170 Q65 168 50 165 Q35 162 20 160 Z" fill="#d4a574" />
      <rect x="85" y="160" width="18" height="5" rx="2" fill="#d4a574" />
      {/* Правая рука */}
      <path d="M220 140 Q200 150 180 155 Q165 158 155 160 Q145 162 140 165 L140 175 Q150 172 160 170 Q175 168 190 165 Q205 162 220 160 Z" fill="#d4a574" />
      <rect x="137" y="160" width="18" height="5" rx="2" fill="#d4a574" />
      {/* Ядро света */}
      <circle cx="120" cy="165" r="12" fill="#fef3c7" opacity="0.8" />
      <circle cx="120" cy="165" r="6" fill="#ffffff" opacity="0.6" />
    </>
  );
}

function DefaultCard() {
  return (
    <>
      <rect width="240" height="320" fill="#f0fdf4" />
      <circle cx="120" cy="160" r="60" fill="#16a34a" opacity="0.2" />
      <text x="120" y="165" textAnchor="middle" fontSize="14" fill="#16a34a">?</text>
    </>
  );
}
