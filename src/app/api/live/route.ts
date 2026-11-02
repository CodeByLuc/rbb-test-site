import { type NextRequest, NextResponse } from 'next/server'

import { holeSpielStand } from '../../../lib/sihf'

export const dynamic = 'force-dynamic'

/**
 * Live-Stand einzelner Spiele für die Anzeige im Browser.
 *
 *   GET /api/live?spiele=20270009262840,20270009258371
 *
 * Die Seiten fragen hier alle 30 Sekunden nach, solange ein Spiel läuft.
 * Die Antwort wird auf Vercel kurz zwischengespeichert, damit nicht jeder
 * Besucher einzeln bei sihf.ch anklopft.
 */
export async function GET(anfrage: NextRequest) {
  const ids = [
    ...new Set(
      (anfrage.nextUrl.searchParams.get('spiele') ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => /^\d{8,20}$/.test(id)),
    ),
  ].slice(0, 12)

  const staende = await Promise.all(ids.map((id) => holeSpielStand(id, 20)))

  return NextResponse.json(
    { spiele: staende.filter((stand) => stand !== null) },
    { headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40' } },
  )
}
