import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'

import {
  alsListe,
  baueAuszug,
  baueInhalt,
  baueTitel,
  sammleWoche,
  spielwoche,
} from '../../../lib/wochenresultate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Vercel schickt den Cron-Auftrag mit dem Geheimschlüssel im
 * Authorization-Header; von Hand geht es mit `?secret=`. Wer im
 * Redaktionsbereich als Administrator eingeloggt ist, braucht keinen Schlüssel.
 */
async function berechtigt(anfrage: NextRequest, payload: Payload): Promise<boolean> {
  const erwartet = process.env.CRON_SECRET
  const kopfGeheimnis = anfrage.headers.get('authorization')?.replace('Bearer ', '')
  const uebergeben = anfrage.nextUrl.searchParams.get('secret') ?? kopfGeheimnis
  if (erwartet && uebergeben === erwartet) return true

  try {
    const { user } = await payload.auth({ headers: anfrage.headers })
    return (user as { role?: string } | null)?.role === 'admin'
  } catch {
    return false
  }
}

const TAG_MS = 24 * 60 * 60 * 1000

/**
 * Erstellt den Wochenrückblick: einen kurzen Blog-Beitrag mit den Resultaten
 * aller Teams von Montag bis Sonntag.
 *
 * Läuft auf Vercel jeden Sonntagabend (siehe vercel.json, 22 Uhr UTC = 23 Uhr
 * Schweizer Winterzeit) und kann jederzeit von Hand ausgelöst werden:
 *
 *   GET /api/wochenresultate?secret=<CRON_SECRET>
 *   (oder ohne secret, wenn man im Redaktionsbereich als Admin eingeloggt ist)
 *
 * Zusatzparameter:
 *   &vorschau=1   – zeigt, was erstellt würde, ohne etwas zu speichern
 *   &stichtag=2026-11-01  – nimmt die Woche, die am letzten Sonntag bis zu diesem Datum endet
 *   &von=2026-10-30  – beginnt erst an diesem Tag, z. B. nur das Wochenende (Freitag bis Sonntag)
 */
export async function GET(anfrage: NextRequest) {
  const params = anfrage.nextUrl.searchParams
  const payload = await getPayload({ config: await configPromise })

  if (!(await berechtigt(anfrage, payload))) {
    return NextResponse.json({ fehler: 'Nicht berechtigt' }, { status: 401 })
  }

  const stichtagText = params.get('stichtag')
  const stichtag = stichtagText ? new Date(stichtagText) : new Date()
  if (Number.isNaN(stichtag.getTime())) {
    return NextResponse.json({ fehler: 'Stichtag ist kein gültiges Datum' }, { status: 400 })
  }

  const nurVorschau = params.get('vorschau') === '1'
  const woche = spielwoche(stichtag)

  const vonText = params.get('von')
  if (vonText) {
    const von = /^\d{4}-\d{2}-\d{2}$/.test(vonText) ? new Date(`${vonText}T00:00:00Z`) : null
    if (!von || Number.isNaN(von.getTime()) || von >= woche.bis || woche.bis.getTime() - von.getTime() > 31 * TAG_MS) {
      return NextResponse.json(
        { fehler: '«von» muss ein Datum (JJJJ-MM-TT) höchstens einen Monat vor dem Sonntag sein' },
        { status: 400 },
      )
    }
    woche.von = von
  }

  try {
    const wochen = await sammleWoche(payload, woche)
    const resultate = alsListe(wochen)

    const titel = baueTitel(woche)
    const inhalt = baueInhalt(wochen, woche)
    const zusammenfassung = {
      zeitraum: { von: woche.von.toISOString(), bis: woche.bis.toISOString() },
      titel,
      spiele: resultate.map(({ team, spiel }) => ({
        team: team.name,
        datum: spiel.datum,
        partie: `${spiel.heim.name} ${spiel.toreHeim}:${spiel.toreGast} ${spiel.gast.name}`,
      })),
    }

    if (nurVorschau) {
      return NextResponse.json({ vorschau: true, ...zusammenfassung, auszug: baueAuszug(wochen), inhalt })
    }

    // In der Sommerpause wird wochenlang nicht gespielt. Ohne diese Bremse
    // entstünde jeden Sonntag ein Beitrag «keine Meisterschaftsspiele
    // ausgetragen», der die echten Vereinsnachrichten nach unten schiebt.
    if (resultate.length === 0) {
      return NextResponse.json({
        angelegt: false,
        grund: 'In diesem Zeitraum wurden keine Spiele ausgetragen.',
        ...zusammenfassung,
      })
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
      auszug: baueAuszug(wochen),
      inhalt: inhalt as never,
      // Jetzt, bei einem Testlauf für eine alte Woche deren Sonntagabend.
      datum: new Date(Math.min(Date.now(), woche.bis.getTime() - 60_000)).toISOString(),
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
