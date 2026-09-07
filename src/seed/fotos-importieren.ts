import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

/**
 * Lädt aufbereitete Fotos in die Mediathek und verknüpft sie mit einem Team.
 *
 *   npx tsx src/seed/fotos-importieren.ts <ordner> [Teamname] [--beitrag "Titel"]
 *
 * Beispiel:
 *   npx tsx src/seed/fotos-importieren.ts ./u9-web U9 --beitrag "Turniertag der U9"
 *
 * Das erste Bild wird zum Teamfoto, sofern noch keines hinterlegt ist. Mit
 * «--beitrag» entsteht zusätzlich ein Beitrag mit allen Bildern als Galerie.
 *
 * Die Fotos vorher mit «fotos-aufbereiten.ts» herunterrechnen – direkt aus der
 * Kamera sind sie mehrere Megabyte gross.
 */

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
  const teamName = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : undefined

  const beitragIndex = process.argv.indexOf('--beitrag')
  const beitragTitel = beitragIndex > -1 ? process.argv[beitragIndex + 1] : undefined

  if (!ordner || !fs.existsSync(ordner)) {
    console.error('Ordner mit den aufbereiteten Fotos angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  const imBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  console.log(`\nSpeicher: ${imBlob ? 'Vercel Blob (live sichtbar)' : 'lokaler Ordner /media'}`)
  if (!imBlob) {
    console.log('Hinweis: Ohne BLOB_READ_WRITE_TOKEN sind die Bilder auf Vercel nicht sichtbar.')
  }

  const dateien = fs
    .readdirSync(ordner)
    .filter((d) => /\.(jpe?g|png|webp)$/i.test(d))
    .sort()

  console.log(`\n${dateien.length} Bilder werden geladen …\n`)

  const angelegt: number[] = []
  let uebersprungen = 0

  for (const [index, datei] of dateien.entries()) {
    const dateipfad = path.join(ordner, datei)

    // Schon vorhanden? Dann nicht doppelt anlegen.
    const { docs } = await payload.find({
      collection: 'media',
      where: { filename: { equals: datei } },
      limit: 1,
    })
    if (docs[0]) {
      angelegt.push(docs[0].id as number)
      uebersprungen++
      continue
    }

    try {
      const bild = await payload.create({
        collection: 'media',
        data: {
          alt: teamName
            ? `${teamName} des EHC Rot-Blau Bern-Bümpliz auf dem Eis`
            : 'EHC Rot-Blau Bern-Bümpliz',
        },
        filePath: dateipfad,
      })
      angelegt.push(bild.id as number)
      console.log(
        `  ${String(index + 1).padStart(2)}/${dateien.length}  ${datei}  ${bild.width}×${bild.height}`,
      )
    } catch (fehler) {
      console.log(`  ${datei}: fehlgeschlagen – ${(fehler as Error).message.slice(0, 80)}`)
    }
  }

  if (uebersprungen > 0) console.log(`  (${uebersprungen} bereits vorhanden)`)
  console.log(`\n${angelegt.length} Bilder in der Mediathek.`)

  // Teamfoto setzen
  if (teamName && angelegt.length > 0) {
    const { docs } = await payload.find({
      collection: 'teams',
      where: { name: { equals: teamName } },
      limit: 1,
    })
    const team = docs[0]
    if (!team) {
      console.log(`Team «${teamName}» nicht gefunden – kein Teamfoto gesetzt.`)
    } else if (team.teamfoto) {
      console.log(`Team «${teamName}» hat bereits ein Teamfoto – unverändert.`)
    } else {
      await payload.update({
        collection: 'teams',
        id: team.id,
        data: { teamfoto: angelegt[0] } as never,
      })
      console.log(`Teamfoto für «${teamName}» gesetzt.`)
    }
  }

  // Beitrag mit Galerie
  if (beitragTitel && angelegt.length > 0) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { titel: { equals: beitragTitel } },
      limit: 1,
    })

    const daten = {
      titel: beitragTitel,
      auszug: `Bilder ${teamName ? `der ${teamName} ` : ''}vom Eis in Bern-Bümpliz.`,
      inhalt: alsFliesstext([
        `Eindrücke ${teamName ? `unserer ${teamName} ` : ''}von der Kunsteisbahn Weyermannshaus.`,
      ]),
      titelbild: angelegt[0],
      bildergalerie: angelegt.slice(1, 25).map((id) => ({ bild: id })),
      datum: new Date().toISOString().slice(0, 10),
      typ: 'news',
      _status: 'published',
    }

    if (docs[0]) {
      await payload.update({ collection: 'posts', id: docs[0].id, data: daten as never })
      console.log(`Beitrag «${beitragTitel}» aktualisiert (${daten.bildergalerie.length} Bilder).`)
    } else {
      await payload.create({ collection: 'posts', data: daten as never })
      console.log(`Beitrag «${beitragTitel}» angelegt (${daten.bildergalerie.length} Bilder).`)
    }
  }

  console.log('')
  process.exit(0)
}

main().catch((fehler) => {
  console.error('\nImport fehlgeschlagen:', fehler?.message ?? fehler)
  process.exit(1)
})
