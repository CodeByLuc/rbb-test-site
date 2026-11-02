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
 * nächstes Spiel rückt das darauffolgende nach. Auf dem Telefon erscheint
 * dasselbe in der Kurzübersicht.
 */
export function TeamSpieleLive({
  tabelle,
  letztes,
  naechste,
  kandidat,
  eigenerName,
  liga,
  tabellenLink,
}: {
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

  return (
    <>
      <TeamKompakt
        tabelle={tabelle}
        letztes={anzeige}
        naechstes={naechstes}
        eigenerName={eigenerName}
        liga={liga}
        tabellenLink={tabellenLink}
        live={live}
        periode={stand?.periode}
        className="lg:hidden"
      />

      <div className="hidden gap-5 lg:grid lg:content-start">
        {naechstes && <NaechstesSpiel spiel={naechstes} eigenerName={eigenerName} />}
        {anzeige && (
          <LetztesResultat
            spiel={anzeige}
            eigenerName={eigenerName}
            live={live}
            periode={stand?.periode}
          />
        )}
      </div>
    </>
  )
}
