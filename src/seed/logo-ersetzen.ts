import 'dotenv/config'

import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Ersetzt das Club-Logo (Vereinswappen) durch eine neue Version.
 *
 *   npx tsx src/seed/logo-ersetzen.ts <bilddatei>
 */

async function main() {
  const bildDatei = process.argv[2]
  if (!bildDatei) {
    console.error('Bilddatei angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  // Bild vergrößern auf 1900px Breite minimum um Blob-Collision zu vermeiden
  const upscaledPath = path.join(path.dirname(bildDatei), `ehc-wappen-upscaled-${Date.now()}.png`)
  const img = sharp(bildDatei)
  const meta = await img.metadata()
  const targetWidth = Math.max(1900, meta.width || 1900)

  await sharp(bildDatei)
    .resize({ width: targetWidth, withoutEnlargement: false })
    .png()
    .toFile(upscaledPath)

  console.log(`✓ Bild vergrößert auf ${targetWidth}px Breite`)

  // Neues Logo hochladen
  const neuesLogo = await payload.create({
    collection: 'media',
    data: { alt: 'EHC Rot-Blau Bern-Bümpliz Wappen' },
    filePath: upscaledPath,
  })

  console.log(`✓ Neues Logo hochgeladen: ${neuesLogo.id}`)

  // Upscaled-Datei löschen
  fs.unlinkSync(upscaledPath)

  // Globale Einstellung aktualisieren
  await payload.updateGlobal({
    slug: 'verein',
    data: { logo: neuesLogo.id } as never,
  })

  console.log(`✓ Logo-ID in globalen Einstellungen gespeichert`)
  console.log(`✓ Fertig!\n`)

  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
