'use client'

import { mitStand, type SihfSpiel, type TabellenLink, type TabellenZeile } from '../lib/sihf'
import { LetztesResultat, NaechstesSpiel } from './Spiele'
import { TeamKompakt } from './TeamKompakt'
import { useSpielStand } from './useSpielStand'

/**
 * Letztes und nächstes Spiel auf der Teamseite – mit Live-Stand.
 *
 * Läuft das Spiel des Teams gerade (oder ging es eben zu Ende), steht es
 * mit dem aktuellen Resultat an der Stelle des letzten Spiels, und als
 * nächstes Spiel rückt das darauffolgende nach.
 *
 * `ansicht="kompakt"` ist die Kurzübersicht fürs Telefon (direkt unter dem
 * Foto), `ansicht="karten"` die beiden grossen Karten in der rechten Spalte.
 */
export function TeamSpieleLive({
  ansicht,
  className = '',
  tabelle,
  letztes,
  naechste,
  kandidat,
  eigenerName,
  liga,
  tabellenLink,
}: {
  ansicht: 'kompakt' | 'karten'
  className?: string
  tabelle: TabellenZeile[]
  letztes: SihfSpiel | null
  naechste: SihfSpiel[]
  kandidat: SihfSpiel | null
  eigenerName: string
  liga?: string | null
  tabellenLink?: TabellenLink | null
}) {
  const stand = useSpielStand(kandidat)
  const aktuell =
    kandidat && stand && (stand.zustand === 'live' || stand.zustand === 'beendet')
      ? mitStand(kandidat, stand)
      : null

  const live = stand?.zustand === 'live'
  const anzeige = aktuell ?? letztes
  const naechstes = naechste.find((spiel) => !aktuell || spiel.gameId !== aktuell.gameId) ?? null

  if (ansicht === 'kompakt') {
    return (
      <TeamKompakt
        tabelle={tabelle}
        letztes={anzeige}
        naechstes={naechstes}
        eigenerName={eigenerName}
        liga={liga}
        tabellenLink={tabellenLink}
        live={live}
        periode={stand?.periode}
        className={className}
      />
    )
  }

  if (!naechstes && !anzeige) return null
  return (
    <div className={`gap-5 ${className}`}>
      {naechstes && <NaechstesSpiel spiel={naechstes} eigenerName={eigenerName} />}
      {anzeige && (
        <LetztesResultat spiel={anzeige} eigenerName={eigenerName} live={live} periode={stand?.periode} />
      )}
    </div>
  )
}
