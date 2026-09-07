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

/**
 * Nachbildung des Vereinswappens, solange in den Einstellungen kein Logo
 * hinterlegt ist.
 *
 * Die Schrift steht bewusst nur im oberen, breiten Teil des Schildes. Früher
 * sass «BERN-BÜMPLIZ» in der auslaufenden Spitze und wurde links und rechts
 * abgeschnitten. Zusätzlich begrenzt «textLength» die Zeilen, damit sie auch
 * dann passen, wenn die Hausschrift noch nicht geladen ist und eine breitere
 * Ersatzschrift einspringt.
 */
export function WappenSvg({ className = 'h-14 w-auto' }: { className?: string }) {
  const schild = 'M3 3H117V120L60 148L3 120Z'

  return (
    <svg
      viewBox="0 0 120 152"
      className={className}
      role="img"
      aria-label="Wappen EHC Rot-Blau Bern-Bümpliz"
    >
      <defs>
        <clipPath id="wappen-schild">
          <path d={schild} />
        </clipPath>
      </defs>

      <g clipPath="url(#wappen-schild)">
        <rect x="0" y="0" width="120" height="152" fill="var(--color-rot)" />
        <rect x="0" y="52" width="120" height="5" fill="#fff" />
        <rect x="0" y="57" width="120" height="40" fill="var(--color-blau)" />
        <rect x="0" y="97" width="120" height="5" fill="#fff" />

        {/* Geflügeltes Emblem im blauen Band */}
        <circle cx="60" cy="70" r="7" fill="#fff" />
        <path d="M60 79 L73 79 L60 93 L47 79 Z" fill="#fff" />
        <g fill="#fff">
          <path d="M15 66H46l-4 4H15z" />
          <path d="M21 73h25l-4 4H21z" />
          <path d="M105 66H74l4 4h27z" />
          <path d="M99 73H74l4 4h21z" />
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
          y="46"
          textAnchor="middle"
          fill="#fff"
          fontFamily="var(--font-display), sans-serif"
          fontSize="19"
          fontWeight="800"
          textLength="80"
          lengthAdjust="spacingAndGlyphs"
        >
          ROT-BLAU
        </text>
        <text
          x="60"
          y="116"
          textAnchor="middle"
          fill="#fff"
          fontFamily="var(--font-display), sans-serif"
          fontSize="14"
          fontWeight="800"
          textLength="88"
          lengthAdjust="spacingAndGlyphs"
        >
          BERN-BÜMPLIZ
        </text>
      </g>

      <path d={schild} fill="none" stroke="#12171f" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  )
}
