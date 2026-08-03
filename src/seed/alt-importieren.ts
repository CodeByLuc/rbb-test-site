import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import { leseSeite, type AltePerson } from './alt-auslesen'

/**
 * Übernimmt Beiträge, Kader und Vereinsangaben von der alten ClubDesk-Website.
 *
 *   npx tsx src/seed/alt-importieren.ts <ordner-mit-html>
 *
 * Der Import ist wiederholbar: Beiträge werden am Titel erkannt, Kader werden
 * ersetzt statt ergänzt. Mehrmals laufen lassen erzeugt also keine Dubletten.
 *
 * Wichtig: Die 1. und die frühere 2. Mannschaft sind zusammengelegt. Ihre Kader
 * werden zu einem Team vereint; die Ligazugehörigkeit (4. Liga) bleibt
 * unangetastet, denn die alte Website ist dort veraltet.
 */

/** Aus «Spieler», «Spielerin», «Goalie» usw. die Position im neuen System. */
function position(gruppe: string): 'goalie' | 'verteidigung' | 'sturm' | undefined {
  if (/goalie|torh/i.test(gruppe)) return 'goalie'
  return undefined
}

function istBetreuung(gruppe: string): boolean {
  return /trainer|betreuer|verantwortlich|coach|schiedsrichter/i.test(gruppe)
}

/** Doppelte Namen entfernen, erste Nennung gewinnt. */
function ohneDubletten(personen: AltePerson[]): AltePerson[] {
  const gesehen = new Set<string>()
  return personen.filter((p) => {
    const schluessel = p.name.toLowerCase().replace(/\s+/g, ' ')
    if (gesehen.has(schluessel)) return false
    gesehen.add(schluessel)
    return true
  })
}

/** Absätze in das Format des Editors bringen. */
function alsFliesstext(absaetze: string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: absaetze.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      })),
    },
  }
}

async function main() {
  const ordner = process.argv[2]
  if (!ordner || !fs.existsSync(ordner)) {
    console.error('Ordner mit den gespeicherten HTML-Seiten angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })
  const seite = (name: string) => leseSeite(path.join(ordner, `${name}.html`))

  // ── Beiträge ───────────────────────────────────────────────────────────────
  console.log('\nBeiträge')
  const start = seite('willkommen')
  let neu = 0
  let ersetzt = 0

  for (const beitrag of start.beitraege) {
    // Manche Beiträge bestehen nur aus Titel und einem Verweis – dann wird der
    // Verweis der Inhalt, damit der Beitrag nicht verloren geht.
    const absaetze =
      beitrag.absaetze.length > 0
        ? beitrag.absaetze
        : beitrag.verweise.length > 0
          ? [`Mehr dazu: ${beitrag.verweise[0]}`]
          : []

    if (absaetze.length === 0) {
      console.log(`  übersprungen (kein Inhalt): ${beitrag.titel.slice(0, 58)}`)
      continue
    }

    const daten = {
      titel: beitrag.titel,
      auszug: absaetze[0].slice(0, 300),
      inhalt: alsFliesstext(absaetze),
      // Ohne Datum auf der alten Seite: älter einsortieren, damit datierte
      // Beiträge oben stehen.
      datum: beitrag.datum ?? '2024-01-01',
      typ: 'news',
      _status: 'published',
    }

    const { docs } = await payload.find({
      collection: 'posts',
      where: { titel: { equals: beitrag.titel } },
      limit: 1,
    })

    if (docs[0]) {
      await payload.update({ collection: 'posts', id: docs[0].id, data: daten as never })
      ersetzt++
      console.log(`  aktualisiert: ${beitrag.titel.slice(0, 58)}`)
    } else {
      await payload.create({ collection: 'posts', data: daten as never })
      neu++
      console.log(`  neu: ${beitrag.titel.slice(0, 58)}${beitrag.datum ? ` [${beitrag.datum}]` : ''}`)
    }
  }
  console.log(`  → ${neu} neu, ${ersetzt} aktualisiert`)

  // ── Kader ──────────────────────────────────────────────────────────────────
  console.log('\nKader')

  // Die frühere 2. Mannschaft ist Teil der einen Aktivmannschaft.
  const aktivmannschaft = ohneDubletten([
    ...seite('teams_1_mannschaft').personen,
    ...seite('teams_2_mannschaft').personen,
  ])

  const zuordnung: { team: string; personen: AltePerson[] }[] = [
    { team: '1. Mannschaft', personen: aktivmannschaft },
    { team: 'Damen', personen: seite('teams_damen').personen },
    { team: 'U16', personen: seite('teams_u16').personen },
    { team: 'U14', personen: seite('teams_u14_').personen },
    { team: 'U12', personen: seite('teams_u12_').personen },
    { team: 'U9', personen: seite('teams_u9').personen },
    { team: 'Senioren', personen: seite('teams_senioren').personen },
  ]

  for (const { team: teamName, personen } of zuordnung) {
    if (personen.length === 0) {
      console.log(`  ${teamName}: keine Personen gefunden`)
      continue
    }

    const { docs } = await payload.find({
      collection: 'teams',
      where: { name: { equals: teamName } },
      limit: 1,
    })
    if (!docs[0]) {
      console.log(`  ${teamName}: Team fehlt in der Datenbank`)
      continue
    }

    const spielende = personen.filter((p) => !istBetreuung(p.gruppe))
    const betreuende = personen.filter((p) => istBetreuung(p.gruppe))

    await payload.update({
      collection: 'teams',
      id: docs[0].id,
      data: {
        spieler: spielende.map((p) => ({
          name: p.name,
          nummer: p.nummer ?? null,
          position: position(p.gruppe) ?? null,
        })),
        trainer: betreuende.map((p) => ({
          name: p.name,
          funktion: p.gruppe,
          email: p.angaben['E-Mail'] ?? null,
        })),
      } as never,
    })

    const goalies = spielende.filter((p) => position(p.gruppe) === 'goalie').length
    console.log(
      `  ${teamName.padEnd(14)} ${String(spielende.length).padStart(2)} Spielende` +
        ` (davon ${goalies} im Tor), ${betreuende.length} Betreuung`,
    )
  }

  // ── Vorstand und Geschichte ────────────────────────────────────────────────
  console.log('\nVerein')

  const vorstand = [
    { funktion: 'Präsident', name: 'Michael Füllemann', email: 'michael.fuellemann@rot-blau.ch' },
    { funktion: 'Vizepräsident', name: 'Dominic Zaman', email: 'dominic.zaman@rot-blau.ch' },
    { funktion: 'TK-Chef', name: 'Roman Stalder', email: 'roman.stalder@rot-blau.ch' },
    { funktion: 'Finanzchefin', name: 'Sandra Palli', email: 'sandra.palli@rot-blau.ch' },
    { funktion: 'Marketingchef', name: 'vakant', email: null },
    { funktion: 'Nachwuchsverantwortlicher', name: 'Alex Thalmann', email: 'alex.thalmann@rot-blau.ch' },
    { funktion: 'Chef Veranstaltungen', name: 'Flavio Gerber', email: 'flavio.gerber@rot-blau.ch' },
  ]

  // Die Geschichtsseite hat keine Blocküberschriften – daher alle Absätze nehmen.
  const geschichteText = seite('verein_geschichte').absaetze

  await payload.updateGlobal({
    slug: 'verein',
    data: {
      vorstand,
      ...(geschichteText.length > 0 ? { geschichte: alsFliesstext(geschichteText) } : {}),
      gruendungsjahr: 1942,
    } as never,
  })
  console.log(`  Vorstand: ${vorstand.length} Personen`)
  console.log(
    geschichteText.length > 0
      ? `  Geschichte: ${geschichteText.length} Absätze`
      : '  Geschichte: kein Text gefunden (Seite prüfen)',
  )

  // ── Beschreibungen der Teams ohne Kaderliste ───────────────────────────────
  const beschreibungen: { team: string; quelle: string }[] = [
    { team: 'Hockeyschule', quelle: 'teams_hockeyschule' },
    { team: 'U16', quelle: 'teams_u16' },
  ]

  for (const { team: teamName, quelle } of beschreibungen) {
    const absaetze = seite(quelle).absaetze
    if (absaetze.length === 0) continue

    const { docs } = await payload.find({
      collection: 'teams',
      where: { name: { equals: teamName } },
      limit: 1,
    })
    if (!docs[0]) continue

    await payload.update({
      collection: 'teams',
      id: docs[0].id,
      data: {
        beschreibung: alsFliesstext(absaetze),
        kurzbeschreibung: absaetze[0].slice(0, 200),
      } as never,
    })
    console.log(`  Beschreibung «${teamName}»: ${absaetze.length} Absätze`)
  }

  console.log('\nFertig.\n')
  process.exit(0)
}

main().catch((fehler) => {
  console.error('\nImport fehlgeschlagen:', fehler?.message ?? fehler)
  process.exit(1)
})
