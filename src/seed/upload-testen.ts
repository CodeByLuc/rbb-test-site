import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { getPayload } from 'payload'
import sharp from 'sharp'

/**
 * Prüft, ob das Hochladen von Bildern funktioniert – mit einem hochkanten Bild
 * in den Proportionen eines Plakats (wie die Textil-Kollektion).
 *
 *   npx tsx src/seed/upload-testen.ts
 *
 * Zeigt, ob der Speicher erreichbar ist und welche Grössenvarianten entstehen.
 */

async function main() {
  const payload = await getPayload({ config: await configPromise })

  const blobAktiv = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  console.log(`\nSpeicher: ${blobAktiv ? 'Vercel Blob' : 'lokaler Ordner /media'}`)

  // Dateiname frei wählbar – Leerzeichen und Sonderzeichen sind der Knackpunkt.
  const name = process.argv[2] ?? 'rbb-upload-test.png'
  const datei = path.join(os.tmpdir(), name)
  await sharp({
    create: { width: 589, height: 830, channels: 4, background: { r: 240, g: 60, b: 48, alpha: 1 } },
  })
    .png()
    .toFile(datei)
  console.log(`Testbild: «${name}», 589×830 (hochkant), ${fs.statSync(datei).size} Bytes\n`)

  try {
    const bild = await payload.create({
      collection: 'media',
      data: { alt: 'Testbild Upload-Prüfung' },
      filePath: datei,
    })

    console.log('Hochladen erfolgreich.')
    console.log(`  Dateiname: ${bild.filename}`)
    console.log(`  Original:  ${bild.width}×${bild.height}`)
    console.log(`  Adresse:   ${bild.url}`)

    const groessen = (bild.sizes ?? {}) as Record<
      string,
      { width?: number | null; height?: number | null; url?: string | null }
    >
    console.log('  Varianten:')
    for (const [name, wert] of Object.entries(groessen)) {
      console.log(
        `    ${name.padEnd(10)} ${wert.width ?? '?'}×${wert.height ?? '?'}` +
          `${wert.url ? '' : '   (keine Adresse!)'}`,
      )
    }

    // Wieder aufräumen, damit kein Testbild in der Mediathek liegen bleibt.
    await payload.delete({ collection: 'media', id: bild.id })
    console.log('\nTestbild wieder entfernt.')
  } catch (fehler) {
    console.error('\nHochladen fehlgeschlagen:')
    console.error(`  ${(fehler as Error).message}`)
    const ursache = (fehler as { cause?: unknown }).cause
    if (ursache) console.error(`  Ursache: ${String(ursache).slice(0, 300)}`)
    process.exit(1)
  } finally {
    fs.rmSync(datei, { force: true })
  }

  process.exit(0)
}

main().catch((fehler) => {
  console.error('Abgebrochen:', fehler?.message ?? fehler)
  process.exit(1)
})
