import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  baueAuszug,
  baueInhalt,
  baueTitel,
  letzteWoche,
  sammleWochenresultate,
} from '../../../lib/wochenresultate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Erstellt den wöchentlichen Resultate-Beitrag.
 *
 * Läuft auf Vercel jeden Montag um 08:00 (siehe vercel.json) und kann jederzeit
 * von Hand ausgelöst werden:
 *
 *   GET /api/wochenresultate?secret=<CRON_SECRET>
 *
 * Zusatzparameter zum Testen:
 *   &vorschau=1   – zeigt, was erstellt würde, ohne etwas zu speichern
 *   &stichtag=2026-02-02  – rechnet die Woche vor diesem Datum
 */
export async function GET(anfrage: NextRequest) {
  const params = anfrage.nextUrl.searchParams
  const erwartet = process.env.CRON_SECRET

  // Vercel schickt den Cron-Auftrag mit einem Authorization-Header.
  const kopfGeheimnis = anfrage.headers.get('authorization')?.replace('Bearer ', '')
  const uebergeben = params.get('secret') ?? kopfGeheimnis

  if (!erwartet || uebergeben !== erwartet) {
    return NextResponse.json({ fehler: 'Nicht berechtigt' }, { status: 401 })
  }

  const stichtagText = params.get('stichtag')
  const stichtag = stichtagText ? new Date(stichtagText) : new Date()
  if (Number.isNaN(stichtag.getTime())) {
    return NextResponse.json({ fehler: 'Stichtag ist kein gültiges Datum' }, { status: 400 })
  }

  const nurVorschau = params.get('vorschau') === '1'
  const zeitraum = letzteWoche(stichtag)

  try {
    const payload = await getPayload({ config: await configPromise })
    const resultate = await sammleWochenresultate(payload, zeitraum)

    const titel = baueTitel(zeitraum)
    const zusammenfassung = {
      zeitraum: { von: zeitraum.von.toISOString(), bis: zeitraum.bis.toISOString() },
      titel,
      spiele: resultate.map(({ team, spiel }) => ({
        team: team.name,
        datum: spiel.datum,
        partie: `${spiel.heim.name} ${spiel.toreHeim}:${spiel.toreGast} ${spiel.gast.name}`,
      })),
    }

    if (nurVorschau) {
      return NextResponse.json({ vorschau: true, ...zusammenfassung })
    }

    // Läuft der Job zweimal, wird der bestehende Beitrag aktualisiert statt verdoppelt.
    const { docs: vorhanden } = await payload.find({
      collection: 'posts',
      where: { and: [{ typ: { equals: 'resultate' } }, { titel: { equals: titel } }] },
      limit: 1,
      depth: 0,
    })

    const daten = {
      titel,
      auszug: baueAuszug(resultate),
      inhalt: baueInhalt(resultate, zeitraum) as never,
      datum: zeitraum.bis.toISOString(),
      typ: 'resultate' as const,
      _status: 'published' as const,
    }

    const beitrag = vorhanden[0]
      ? await payload.update({ collection: 'posts', id: vorhanden[0].id, data: daten })
      : await payload.create({ collection: 'posts', data: daten })

    // Startseite und News-Liste sofort neu aufbauen.
    revalidatePath('/')
    revalidatePath('/news')
    if (beitrag.slug) revalidatePath(`/news/${beitrag.slug}`)

    return NextResponse.json({
      erfolg: true,
      aktion: vorhanden[0] ? 'aktualisiert' : 'erstellt',
      beitragId: beitrag.id,
      slug: beitrag.slug,
      ...zusammenfassung,
    })
  } catch (fehler) {
    console.error('Wochenresultate fehlgeschlagen', fehler)
    return NextResponse.json(
      { fehler: 'Wochenresultate konnten nicht erstellt werden', details: String(fehler) },
      { status: 500 },
    )
  }
}
