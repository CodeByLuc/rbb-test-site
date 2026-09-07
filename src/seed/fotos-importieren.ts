import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'
import type { Payload } from 'payload'

/**
 * Lädt Fotos in die Mediathek und verknüpft sie mit einem Team.
 *
 * Ein Ordner, ein Team:
 *   npm exec -- tsx src/seed/fotos-importieren.ts "<ordner>" "U12"
 *
 * Alle Teams auf einmal – jeder Unterordner ist ein Team («u12», «damen», …):
 *   npm exec -- tsx src/seed/fotos-importieren.ts "<elternordner>" --pro-ordner
 *
 * Zusätzlich ein Beitrag mit Bildergalerie:
 *   … --beitrag "Turniertag der U9"
 *
 * Vorhandene Bilder erneut hochladen (etwa nach Einrichten des Blob-Speichers):
 *   … --erneuern
 *
 * Zu grosse Bilder werden vor dem Hochladen selbst heruntergerechnet – Fotos
 * direkt aus der Kamera haben mehrere Megabyte, fürs Web genügen rund 2200
 * Pixel Breite.
 */

const MAX_BREITE = 2200
const MAX_BYTES = 1_200_000

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

/** Ordnername auf ein Team abbilden: aus «u12» wird die U12. */
function passendesTeam<T extends { name: string }>(ordnername: string, teams: T[]): T | undefined {
  const sauber = (t: string) => t.toLowerCase().replace(/[\s._-]/g, '')
  const gesucht = sauber(ordnername)
  return (
    teams.find((t) => sauber(t.name) === gesucht) ??
    teams.find((t) => sauber(t.name).includes(gesucht) || gesucht.includes(sauber(t.name)))
  )
}

/**
 * Rechnet ein Bild herunter, falls nötig, und gibt den Pfad zur Fassung
 * zurück, die hochgeladen werden soll.
 */
async function fuersWeb(dateipfad: string, ablage: string): Promise<string> {
  const groesse = fs.statSync(dateipfad).size
  const info = await sharp(dateipfad).metadata()

  if (groesse <= MAX_BYTES && (info.width ?? 0) <= MAX_BREITE) return dateipfad

  const ziel = path.join(ablage, path.basename(dateipfad).replace(/\.[^.]+$/, '.jpg').toLowerCase())
  await sharp(dateipfad)
    .rotate() // EXIF-Ausrichtung anwenden, sonst liegen Hochformate quer
    .resize({ width: MAX_BREITE, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(ziel)
  return ziel
}

type Optionen = { erneuern: boolean; beitragTitel?: string }

/** Importiert einen Ordner und verknüpft ihn mit einem Team. */
async function importiereOrdner(
  payload: Payload,
  ordner: string,
  teamName: string | undefined,
  optionen: Optionen,
): Promise<number> {
  const dateien = fs
    .readdirSync(ordner)
    .filter((d) => /\.(jpe?g|png|webp|heic)$/i.test(d))
    .sort()

  if (dateien.length === 0) {
    console.log(`  ${path.basename(ordner)}: keine Bilder`)
    return 0
  }

  const ablage = fs.mkdtempSync(path.join(os.tmpdir(), 'rbb-web-'))
  const angelegt: number[] = []
  let neu = 0
  let vorhanden = 0
  let verkleinert = 0

  try {
    for (const datei of dateien) {
      const quelle = path.join(ordner, datei)
      const name = datei.replace(/\.[^.]+$/, '.jpg').toLowerCase()

      const { docs } = await payload.find({
        collection: 'media',
        where: { filename: { equals: name } },
        limit: 1,
      })

      if (docs[0] && !optionen.erneuern) {
        angelegt.push(docs[0].id as number)
        vorhanden++
        continue
      }

      try {
        const hochzuladen = await fuersWeb(quelle, ablage)
        if (hochzuladen !== quelle) verkleinert++

        if (docs[0]) {
          const aktualisiert = await payload.update({
            collection: 'media',
            id: docs[0].id,
            data: {},
            filePath: hochzuladen,
          })
          angelegt.push(aktualisiert.id as number)
        } else {
          const bild = await payload.create({
            collection: 'media',
            data: {
              alt: teamName
                ? `${teamName} des EHC Rot-Blau Bern-Bümpliz`
                : 'EHC Rot-Blau Bern-Bümpliz',
            },
            filePath: hochzuladen,
          })
          angelegt.push(bild.id as number)
          neu++
        }
      } catch (fehler) {
        console.log(`    ${datei}: fehlgeschlagen – ${(fehler as Error).message.slice(0, 70)}`)
      }
    }
  } finally {
    fs.rmSync(ablage, { recursive: true, force: true })
  }

  console.log(
    `  ${(teamName ?? path.basename(ordner)).padEnd(14)} ${String(angelegt.length).padStart(3)} Bilder` +
      ` (${neu} neu, ${vorhanden} bereits vorhanden` +
      `${verkleinert > 0 ? `, ${verkleinert} verkleinert` : ''})`,
  )

  // Teamfoto setzen, falls noch keines hinterlegt ist.
  if (teamName && angelegt.length > 0) {
    const { docs } = await payload.find({
      collection: 'teams',
      where: { name: { equals: teamName } },
      limit: 1,
    })
    const team = docs[0]
    if (team && !team.teamfoto) {
      await payload.update({
        collection: 'teams',
        id: team.id,
        data: { teamfoto: angelegt[0] } as never,
      })
      console.log(`                 Teamfoto gesetzt`)
    }
  }

  // Beitrag mit Bildergalerie.
  if (optionen.beitragTitel && angelegt.length > 0) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { titel: { equals: optionen.beitragTitel } },
      limit: 1,
    })

    const daten = {
      titel: optionen.beitragTitel,
      auszug: `Bilder ${teamName ? `der ${teamName} ` : ''}vom Eis in Bern-Bümpliz.`,
      inhalt: alsFliesstext([
        `Eindrücke ${teamName ? `unserer ${teamName} ` : ''}von der Kunsteisbahn Weyermannshaus.`,
      ]),
      titelbild: angelegt[0],
      galerie: angelegt.slice(1, 25).map((id) => ({ bild: id })),
      datum: new Date().toISOString().slice(0, 10),
      typ: 'news',
      _status: 'published',
    }

    if (docs[0]) {
      await payload.update({ collection: 'posts', id: docs[0].id, data: daten as never })
    } else {
      await payload.create({ collection: 'posts', data: daten as never })
    }
    console.log(`                 Beitrag «${optionen.beitragTitel}» mit ${daten.galerie.length} Bildern`)
  }

  return angelegt.length
}

async function main() {
  const ordner = process.argv[2]
  const teamName = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : undefined

  const beitragIndex = process.argv.indexOf('--beitrag')
  const optionen: Optionen = {
    erneuern: process.argv.includes('--erneuern'),
    beitragTitel: beitragIndex > -1 ? process.argv[beitragIndex + 1] : undefined,
  }

  if (!ordner || !fs.existsSync(ordner)) {
    console.error('Ordner mit den Fotos angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  console.log(
    `\nSpeicher: ${
      process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob (live sichtbar)' : 'lokaler Ordner /media'
    }\n`,
  )

  if (process.argv.includes('--pro-ordner')) {
    const { docs: teams } = await payload.find({ collection: 'teams', limit: 100, depth: 0 })
    const unterordner = fs
      .readdirSync(ordner, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()

    let gesamt = 0
    for (const name of unterordner) {
      const team = passendesTeam(name, teams as { name: string }[])
      if (!team) console.log(`  ${name}: kein passendes Team – Bilder werden nur abgelegt`)
      gesamt += await importiereOrdner(payload, path.join(ordner, name), team?.name, optionen)
    }
    console.log(`\n${gesamt} Bilder aus ${unterordner.length} Ordnern.\n`)
  } else {
    await importiereOrdner(payload, ordner, teamName, optionen)
    console.log('')
  }

  process.exit(0)
}

main().catch((fehler) => {
  console.error('\nImport fehlgeschlagen:', fehler?.message ?? fehler)
  process.exit(1)
})
