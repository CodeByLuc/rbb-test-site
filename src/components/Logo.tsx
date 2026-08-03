import type { Media } from '../payload-types'
import { bildDaten, type BildQuelle } from './Bild'

/**
 * Das Vereinswappen. Ist in den Einstellungen ein Logo hinterlegt, wird dieses
 * verwendet. Die SVG-Nachbildung darunter greift nur, solange keines hochgeladen
 * ist – sie zeigt dieselbe Schildform mit den drei Bändern.
 */
export function Logo({
  logo,
  className = 'h-14 w-auto',
}: {
  logo?: BildQuelle
  className?: string
}) {
  // Ohne Grössenangabe: die zugeschnittenen Varianten würden das hochkante
  // Wappen oben und unten beschneiden.
  const daten = bildDaten(logo as number | Media | null | undefined)

  if (daten) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={daten.url}
        alt="EHC Rot-Blau Bern-Bümpliz"
        width={daten.breite}
        height={daten.hoehe}
        className={`max-w-none shrink-0 ${className}`}
      />
    )
  }

  return <WappenSvg className={`max-w-none shrink-0 ${className}`} />
}

export function WappenSvg({ className = 'h-14 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 148"
      className={className}
      role="img"
      aria-label="Wappen EHC Rot-Blau Bern-Bümpliz"
    >
      <defs>
        <clipPath id="wappen-schild">
          <path d="M3 3H117V112L60 145L3 112Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#wappen-schild)">
        <rect x="0" y="0" width="120" height="148" fill="var(--color-rot)" />
        <rect x="0" y="54" width="120" height="6" fill="#fff" />
        <rect x="0" y="60" width="120" height="40" fill="var(--color-blau)" />
        <rect x="0" y="100" width="120" height="6" fill="#fff" />

        {/* Geflügeltes Emblem im blauen Band */}
        <circle cx="60" cy="72" r="7.5" fill="#fff" />
        <path d="M60 82 L74 82 L60 97 L46 82 Z" fill="#fff" />
        <g fill="#fff">
          <path d="M14 68H46l-4 4H14z" />
          <path d="M20 75h26l-4 4H20z" />
          <path d="M106 68H74l4 4h28z" />
          <path d="M100 75H74l4 4h22z" />
        </g>

        <text
          x="60"
          y="26"
          textAnchor="middle"
          fill="#fff"
          fontFamily="var(--font-display), sans-serif"
          fontSize="19"
          fontWeight="800"
        >
          EHC
        </text>
        <text
          x="60"
          y="47"
          textAnchor="middle"
          fill="#fff"
          fontFamily="var(--font-display), sans-serif"
          fontSize="19"
          fontWeight="800"
        >
          ROT-BLAU
        </text>
        <text
          x="60"
          y="127"
          textAnchor="middle"
          fill="#fff"
          fontFamily="var(--font-display), sans-serif"
          fontSize="16"
          fontWeight="800"
        >
          BERN-BÜMPLIZ
        </text>
      </g>

      <path
        d="M3 3H117V112L60 145L3 112Z"
        fill="none"
        stroke="#12171f"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
