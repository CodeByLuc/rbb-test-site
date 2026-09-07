import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

/**
 * Schiebt alle Bilder der Mediathek in den Vercel-Blob-Speicher.
 *
 *   npx tsx src/seed/media-zu-blob.ts [--probe]
 *
 * Ohne Blob-Speicher legt Payload hochgeladene Bilder im Ordner «media» ab.
 * Auf Vercel ist das Dateisystem schreibgeschützt und dieser Ordner leer –
 * die Seite zeigte dort leere Bildflächen.
 *
 * Jeder Eintrag wird mit derselben Datei neu gespeichert. Weil die Kennung
 * erhalten bleibt, behalten Teams und Beiträge ihre Bilder; nur die Adresse
 * wandert von «/api/media/file/...» auf die Blob-Adresse.
 *
 * Mit «--probe» wird nur ein Bild übertragen, zum Prüfen der Einrichtung.
 */

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('\nBLOB_READ_WRITE_TOKEN fehlt in .env – ohne den Zugang geht nichts.\n')
    process.exit(1)
  }

  const nurEines = process.argv.includes('--probe')
  const payload = await getPayload({ config: await configPromise })
  const ordner = path.resolve('media')

  const { docs } = await payload.find({ collection: 'media', limit: 500, depth: 0, sort: 'filename' })
  console.log(`\n${docs.length} Einträge in der Mediathek, Quelle: ${ordner}\n`)

  let übertragen = 0
  let schonDort = 0
  let ohneDatei = 0
  let fehler = 0

  for (const bild of docs) {
    const name = bild.filename
    if (!name) continue

    // Liegt es bereits im Blob? Dann ist die Adresse absolut.
    if (bild.url?.startsWith('http')) {
      schonDort++
      continue
    }

    const datei = path.join(ordner, name)
    if (!fs.existsSync(datei)) {
      console.log(`  ${name}: Datei fehlt im Ordner media`)
      ohneDatei++
      continue
    }

    try {
      const neu = await payload.update({
        collection: 'media',
        id: bild.id,
        data: {},
        filePath: datei,
      })
      übertragen++
      if (übertragen <= 3 || übertragen % 25 === 0) {
        console.log(`  ${String(übertragen).padStart(3)}/${docs.length}  ${name}`)
        console.log(`         ${String(neu.url).slice(0, 80)}`)
      }
      if (nurEines) break
    } catch (f) {
      console.log(`  ${name}: ${(f as Error).message.slice(0, 90)}`)
      fehler++
    }
  }

  console.log(
    `\n${übertragen} übertragen` +
      `${schonDort > 0 ? `, ${schonDort} lagen schon im Blob` : ''}` +
      `${ohneDatei > 0 ? `, ${ohneDatei} ohne Datei` : ''}` +
      `${fehler > 0 ? `, ${fehler} fehlgeschlagen` : ''}\n`,
  )
  process.exit(fehler > 0 ? 1 : 0)
}

main().catch((f) => {
  console.error('\nFehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
