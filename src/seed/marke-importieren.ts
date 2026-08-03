import 'dotenv/config'

import configPromise from '@payload-config'
import { mkdir } from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

/**
 * Zerlegt das Vereinslogo in Wappen und Spielergrafik, legt beides zusammen mit
 * den Fotos im Redaktionssystem ab und hinterlegt das Wappen in den Einstellungen.
 *
 *   npx tsx src/seed/marke-importieren.ts
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const quelle = path.resolve(dirname, '../../logo-quelle')
const aufbereitet = path.join(quelle, 'aufbereitet')

/** Das Originalbild enthält links das Wappen und rechts die Spielergrafik. */
async function logoZerlegen() {
  const original = path.join(quelle, 'logo-gross.png')
  const { width = 0, height = 0 } = await sharp(original).metadata()
  await mkdir(aufbereitet, { recursive: true })

  const wappenDatei = path.join(aufbereitet, 'ehc-rot-blau-wappen.png')
  await sharp(original)
    .extract({ left: 0, top: 0, width: Math.round(width * 0.56), height })
    .trim({ threshold: 15 })
    .resize({ width: 600, fit: 'inside' })
    // Ohne Rand liegt die schwarze Umrandung genau auf der Bildkante und wird
    // beim Skalieren angeschnitten. Ein paar transparente Pixel lösen das.
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(wappenDatei)

  const spielerDatei = path.join(aufbereitet, 'ehc-rot-blau-spieler.png')
  await sharp(original)
    .extract({
      left: Math.round(width * 0.58),
      top: 0,
      width: width - Math.round(width * 0.58),
      height,
    })
    .trim({ threshold: 15 })
    .resize({ width: 700, fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(spielerDatei)

  for (const datei of [wappenDatei, spielerDatei]) {
    const m = await sharp(datei).metadata()
    console.log(`  ${path.basename(datei)}: ${m.width}x${m.height}`)
  }

  return { wappenDatei, spielerDatei }
}

async function main() {
  console.log('Logo zerlegen …')
  const { wappenDatei, spielerDatei } = await logoZerlegen()

  const payload = await getPayload({ config: await configPromise })

  // Mit "--ersetzen" werden vorhandene Dateien überschrieben statt übersprungen.
  const ersetzen = process.argv.includes('--ersetzen')

  /** Legt ein Bild an, sofern es noch nicht existiert. */
  const bildAnlegen = async (dateipfad: string, alt: string) => {
    const dateiname = path.basename(dateipfad)
    const { docs } = await payload.find({
      collection: 'media',
      where: { filename: { equals: dateiname } },
      limit: 1,
    })
    if (docs[0] && !ersetzen) {
      console.log(`  ${dateiname} ist bereits vorhanden`)
      return docs[0]
    }
    if (docs[0]) {
      const aktualisiert = await payload.update({
        collection: 'media',
        id: docs[0].id,
        data: { alt },
        filePath: dateipfad,
      })
      console.log(`  ersetzt: ${dateiname}`)
      return aktualisiert
    }
    const erstellt = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: dateipfad,
    })
    console.log(`  hochgeladen: ${dateiname}`)
    return erstellt
  }

  console.log('\nBilder ablegen …')
  const wappen = await bildAnlegen(wappenDatei, 'Wappen des EHC Rot-Blau Bern-Bümpliz')
  await bildAnlegen(spielerDatei, 'Eishockeyspieler als Zeichnung, Vereinsgrafik')

  const fotos = [
    { datei: 'foto-1.jpg', alt: 'Nachwuchsteams gemeinsam auf dem Eis beim Rot-Blau Cup' },
    { datei: 'foto-2.jpg', alt: 'Spielszene aus dem Eisstadion Weyermannshaus' },
    { datei: 'foto-3.jpg', alt: 'Spielszene aus dem Eisstadion Weyermannshaus' },
    { datei: 'foto-4.jpg', alt: 'Vereinsleben beim EHC Rot-Blau Bern-Bümpliz' },
  ]

  const hochgeladeneFotos = []
  for (const foto of fotos) {
    hochgeladeneFotos.push(await bildAnlegen(path.join(quelle, foto.datei), foto.alt))
  }

  console.log('\nEinstellungen und Inhalte verknüpfen …')
  await payload.updateGlobal({
    slug: 'einstellungen',
    data: { logo: wappen.id } as never,
  })
  console.log('  Wappen als Vereinslogo hinterlegt')

  // Das Turnierfoto passt zum Beitrag über den Rot-Blau Cup.
  const { docs: cupBeitrag } = await payload.find({
    collection: 'posts',
    where: { titel: { like: 'Rot-Blau Cup' } },
    limit: 1,
  })
  if (cupBeitrag[0] && hochgeladeneFotos[0]) {
    await payload.update({
      collection: 'posts',
      id: cupBeitrag[0].id,
      data: { titelbild: hochgeladeneFotos[0].id } as never,
    })
    console.log('  Turnierfoto beim Cup-Beitrag hinterlegt')
  }

  // Weitere Fotos den ersten Teams zuweisen, damit die Übersicht nicht leer ist.
  const { docs: teams } = await payload.find({ collection: 'teams', limit: 4, sort: 'reihenfolge' })
  for (let i = 0; i < teams.length && i + 1 < hochgeladeneFotos.length; i++) {
    if (teams[i].teamfoto) continue
    await payload.update({
      collection: 'teams',
      id: teams[i].id,
      data: { teamfoto: hochgeladeneFotos[i + 1].id } as never,
    })
    console.log(`  Foto bei Team «${teams[i].name}» hinterlegt`)
  }

  console.log('\nFertig.')
  process.exit(0)
}

main().catch((fehler) => {
  console.error('Import fehlgeschlagen:', fehler)
  process.exit(1)
})
