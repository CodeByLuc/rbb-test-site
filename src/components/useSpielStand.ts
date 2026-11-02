'use client'

import { useEffect, useState } from 'react'

import { LIVE_NACHLAUF_MS, LIVE_VORLAUF_MS, type SihfSpiel, type SpielStand } from '../lib/sihf'

/** Abstand zwischen zwei Abfragen, solange ein Spiel läuft. */
const TAKT_MS = 30_000

/**
 * Fragt im Browser den Live-Stand eines Spiels ab – ab 15 Minuten vor dem
 * Anspiel alle 30 Sekunden, bis das Spiel beendet ist. Ausserhalb dieses
 * Fensters passiert nichts; bleibt die Seite bis zum Anspiel offen, beginnt
 * die Abfrage von selbst.
 */
export function useSpielStand(spiel?: SihfSpiel | null): SpielStand | null {
  const [stand, setStand] = useState<SpielStand | null>(null)
  const gameId = spiel?.gameId
  const zeitpunkt = spiel?.zeitpunkt

  useEffect(() => {
    const start = zeitpunkt ? Date.parse(zeitpunkt) : NaN
    if (!gameId || !Number.isFinite(start)) return

    let timer: ReturnType<typeof setTimeout> | undefined
    let vorbei = false

    const abfragen = async () => {
      const jetzt = Date.now()
      if (jetzt > start + LIVE_NACHLAUF_MS) return
      if (jetzt < start - LIVE_VORLAUF_MS) {
        const warten = start - LIVE_VORLAUF_MS - jetzt
        // Nur warten, wenn das Spiel noch heute beginnt.
        if (warten < 24 * 60 * 60 * 1000) timer = setTimeout(abfragen, warten)
        return
      }

      try {
        const antwort = await fetch(`/api/live?spiele=${gameId}`)
        const daten = (await antwort.json()) as { spiele?: SpielStand[] }
        const neu = daten.spiele?.[0] ?? null
        if (vorbei) return
        if (neu) setStand(neu)
        if (neu?.zustand === 'beendet' || neu?.zustand === 'abgesagt') return
      } catch {
        // Netz weg oder sihf.ch nicht erreichbar: beim nächsten Takt nochmals.
      }
      if (!vorbei) timer = setTimeout(abfragen, TAKT_MS)
    }

    abfragen()
    return () => {
      vorbei = true
      clearTimeout(timer)
    }
  }, [gameId, zeitpunkt])

  return stand
}
