'use client'

import Link from 'next/link'

import { mitStand, type SihfSpiel } from '../lib/sihf'
import { BeendetMarke, LiveMarke } from './Spiele'
import { useSpielStand } from './useSpielStand'

const ausgangText = { S: 'Sieg', N: 'Niederlage', U: 'Unentschieden' } as const
const ausgangFarbe = {
  S: 'bg-white text-rot-dunkel',
  N: 'bg-nacht text-white',
  U: 'bg-white/10 text-white',
} as const
const entscheidungText: Record<string, string> = {
  OT: 'nach Verlängerung',
  SO: 'nach Penaltyschiessen',
}

/**
 * Ein Resultat im roten Balken der Startseite – Anzeigetafel statt Kachel.
 *
 * Läuft das Spiel des Teams gerade, steht hier der aktuelle Spielstand mit
 * der Marke «Live» und dem Spielabschnitt. Danach und bei allen älteren
 * Spielen trägt das Resultat die Marke «Beendet».
 */
export function ResultatLive({
  teamName,
  teamSlug,
  eigenerName,
  letztes,
  kandidat,
}: {
  teamName: string
  teamSlug?: string | null
  eigenerName: string
  letztes: SihfSpiel | null
  kandidat: SihfSpiel | null
}) {
  const stand = useSpielStand(kandidat)
  const live = stand?.zustand === 'live' && stand.toreHeim !== null
  const beendet = stand?.zustand === 'beendet' && stand.toreHeim !== null
  const spiel = kandidat && (live || beendet) ? mitStand(kandidat, stand) : letztes
  if (!spiel || spiel.toreHeim === null || spiel.toreGast === null) return null

  const wirSindHeim = spiel.heim.name.toLowerCase().includes(eigenerName.toLowerCase())
  const eigene = wirSindHeim ? spiel.toreHeim : spiel.toreGast
  const fremde = wirSindHeim ? spiel.toreGast : spiel.toreHeim
  const gegner = wirSindHeim ? spiel.gast.name : spiel.heim.name
  const ausgang = eigene > fremde ? 'S' : eigene < fremde ? 'N' : 'U'
  const zusatz = live ? stand?.periode : entscheidungText[spiel.entscheidung]

  return (
    <li className="md:min-w-0" aria-live={live ? 'polite' : undefined}>
      <Link
        href={`/teams/${teamSlug}`}
        className="group flex items-center justify-between gap-6 md:justify-start"
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 font-display text-xs tracking-[0.2em] text-white uppercase">
            {teamName} · {spiel.wochentag} {spiel.datum.slice(0, 6)}
            {!live && <BeendetMarke />}
          </span>
          <span className="mt-1.5 block font-display text-xl leading-none tracking-wide uppercase decoration-2 underline-offset-4 group-hover:underline">
            {wirSindHeim ? 'gegen' : 'bei'} {gegner}
          </span>
          {zusatz && <span className="mt-1 block text-xs text-white">{zusatz}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="tafelzahl text-5xl">
            {eigene}
            <span className="text-white/70">:</span>
            {fremde}
          </span>
          {live ? (
            <LiveMarke hell />
          ) : (
            <span
              className={`etikett px-2 py-1 font-display text-xs tracking-[0.15em] uppercase ${ausgangFarbe[ausgang]}`}
            >
              {ausgangText[ausgang]}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
