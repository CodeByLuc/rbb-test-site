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

type Zugang = { ok: true } | { ok: false; grund: 'login' | 'rolle'; name?: string }

/**
 * Vercel schickt den Cron-Auftrag mit dem Geheimschlüssel im
 * Authorization-Header; von Hand geht es mit `?secret=`. Wer im
 * Redaktionsbereich als Administrator eingeloggt ist, braucht keinen Schlüssel.
 */
async function pruefeZugang(anfrage: NextRequest, payload: Payload): Promise<Zugang> {
  const erwartet = process.env.CRON_SECRET
  const kopfGeheimnis = anfrage.headers.get('authorization')?.replace('Bearer ', '')
  const uebergeben = anfrage.nextUrl.searchParams.get('secret') ?? kopfGeheimnis
  if (erwartet && uebergeben === erwartet) return { ok: true }

  try {
    const { user } = await payload.auth({ headers: anfrage.headers })
    const konto = user as { role?: string; name?: string; email?: string } | null
    if (!konto) return { ok: false, grund: 'login' }
    if (konto.role === 'admin') return { ok: true }
    return { ok: false, grund: 'rolle', name: konto.name || konto.email }
  } catch {
    return { ok: false, grund: 'login' }
  }
}

/**
 * Wurde der Link im Browser angeklickt (statt vom Cron-Auftrag oder mit curl
 * aufgerufen)? Dann gibt es eine lesbare Seite statt JSON.
 */
const imBrowser = (anfrage: NextRequest) => (anfrage.headers.get('accept') ?? '').includes('text/html')

const ohneHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Schlichte Hinweisseite; `inhalt` ist eigenes, bereits sicheres HTML. */
function hinweis(titel: string, inhalt: string, status: number) {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titel}</title><style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.55;color:#0f1d33}a{color:#b8261c;font-weight:600}li{margin:.4rem 0}</style></head><body><h1>${titel}</h1>${inhalt}</body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
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
  const browser = imBrowser(anfrage)
  const payload = await getPayload({ config: await configPromise })

  const zugang = await pruefeZugang(anfrage, payload)
  if (!zugang.ok) {
    if (!browser) return NextResponse.json({ fehler: 'Nicht berechtigt' }, { status: 401 })
    return zugang.grund === 'rolle'
      ? hinweis(
          'Keine Berechtigung',
          `<p>Du bist als <strong>${ohneHtml(zugang.name ?? 'Autor')}</strong> eingeloggt. Den Rückblick dürfen nur Administratoren erstellen.</p>`,
          403,
        )
      : hinweis(
          'Bitte zuerst einloggen',
          `<p>In diesem Browser bist du nicht im Redaktionsbereich eingeloggt.</p><ol><li><a href="/admin" target="_blank" rel="noopener">Redaktionsbereich öffnen und einloggen</a> (neuer Tab)</li><li>Danach diese Seite hier neu laden.</li></ol>`,
          401,
        )
  }

  const stichtagText = params.get('stichtag')
  const stichtag = stichtagText ? new Date(stichtagText) : new Date()
  if (Number.isNaN(stichtag.getTime())) {
    if (browser) return hinweis('Ungültiger Link', '<p>«stichtag» ist kein gültiges Datum.</p>', 400)
    return NextResponse.json({ fehler: 'Stichtag ist kein gültiges Datum' }, { status: 400 })
  }

  const nurVorschau = params.get('vorschau') === '1'
  const woche = spielwoche(stichtag)

  const vonText = params.get('von')
  if (vonText) {
    const von = /^\d{4}-\d{2}-\d{2}$/.test(vonText) ? new Date(`${vonText}T00:00:00Z`) : null
    if (!von || Number.isNaN(von.getTime()) || von >= woche.bis || woche.bis.getTime() - von.getTime() > 31 * TAG_MS) {
      const fehler = '«von» muss ein Datum (JJJJ-MM-TT) höchstens einen Monat vor dem Sonntag sein'
      if (browser) return hinweis('Ungültiger Link', `<p>${fehler}.</p>`, 400)
      return NextResponse.json({ fehler }, { status: 400 })
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
      if (browser) {
        return hinweis('Kein Beitrag erstellt', '<p>In diesem Zeitraum wurden keine Spiele ausgetragen.</p>', 200)
      }
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
      datum: new Date().toISOString(),
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

    // Im Browser direkt zum fertigen Beitrag.
    if (browser && beitrag.slug) {
      return NextResponse.redirect(new URL(`/news/${beitrag.slug}`, anfrage.url), 303)
    }

    return NextResponse.json({
      erfolg: true,
      aktion: vorhanden[0] ? 'aktualisiert' : 'erstellt',
      beitragId: beitrag.id,
      slug: beitrag.slug,
      ...zusammenfassung,
    })
  } catch (fehler) {
    console.error('Wochenresultate fehlgeschlagen', fehler)
    if (browser) {
      return hinweis(
        'Das hat nicht geklappt',
        `<p>Der Beitrag konnte nicht erstellt werden:</p><pre style="white-space:pre-wrap">${ohneHtml(String(fehler))}</pre>`,
        500,
      )
    }
    return NextResponse.json(
      { fehler: 'Wochenresultate konnten nicht erstellt werden', details: String(fehler) },
      { status: 500 },
    )
  }
}
