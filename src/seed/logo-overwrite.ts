import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const bildDatei = process.argv[2]
  if (!bildDatei) {
    console.error('Bilddatei angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  // Altes Logo finden und löschen
  const alt = await payload.findByID({ collection: 'media', id: '1' })
  console.log('Lösche altes Logo:', alt.filename)
  await payload.delete({ collection: 'media', id: '1' })

  // Neues Logo hochladen
  const neuesLogo = await payload.create({
    collection: 'media',
    data: { alt: 'EHC Rot-Blau Bern-Bümpliz Wappen' },
    filePath: bildDatei,
  })

  console.log(`✓ Neues Logo hochgeladen: ID ${neuesLogo.id}`)

  // In Einstellungen speichern
  await payload.updateGlobal({
    slug: 'einstellungen',
    data: { logo: neuesLogo.id } as never,
  })

  console.log(`✓ Logo ${neuesLogo.id} in Einstellungen gespeichert`)
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
