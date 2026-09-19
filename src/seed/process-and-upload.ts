import 'dotenv/config'
import sharp from 'sharp'
import path from 'path'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const bildDatei = process.argv[2]
  if (!bildDatei) {
    console.error('Bilddatei angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  // Bild leicht verändern (auf 1900px Breite bringen + PNG), damit Vercel Blob
  // es nicht als Duplikat einer früher hochgeladenen Datei erkennt.
  const verarbeitet = path.join(path.dirname(bildDatei), `processed-${Date.now()}.png`)
  const meta = await sharp(bildDatei).metadata()
  const zielBreite = Math.max(1900, meta.width ?? 1900)

  await sharp(bildDatei)
    .resize({ width: zielBreite })
    .png({ compressionLevel: 9 })
    .toFile(verarbeitet)

  console.log(`✓ Bild verarbeitet: ${verarbeitet} (${zielBreite}px breit)`)

  const neuesLogo = await payload.create({
    collection: 'media',
    data: { alt: 'EHC Rot-Blau Bern-Bümpliz Wappen' },
    filePath: verarbeitet,
  })

  console.log(`✓ Logo hochgeladen: ID ${neuesLogo.id}`)

  await payload.updateGlobal({
    slug: 'einstellungen',
    data: { logo: neuesLogo.id } as never,
  })

  console.log(`✓ Logo ${neuesLogo.id} als Hauptlogo (einstellungen) gespeichert`)
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
