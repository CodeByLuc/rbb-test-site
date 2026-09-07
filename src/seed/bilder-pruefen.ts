import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Zeigt alle hinterlegten Bilder und wohin ihre Adressen zeigen.
 *
 *   npx tsx src/seed/bilder-pruefen.ts
 *
 * Damit lässt sich erkennen, ob der Blob-Speicher greift: dann beginnen die
 * Adressen mit «https://…blob.vercel-storage.com». Liegen sie unter
 * «/api/media/file/…», wurden sie im lokalen Ordner abgelegt und sind auf
 * Vercel nicht erreichbar.
 */

async function main() {
  const payload = await getPayload({ config: await configPromise })

  const { docs, totalDocs } = await payload.find({
    collection: 'media',
    limit: 100,
    depth: 0,
    sort: '-createdAt',
  })

  console.log(`\nBilder in der Datenbank: ${totalDocs}\n`)

  if (totalDocs === 0) {
    console.log('  Noch kein einziges Bild hinterlegt.')
    console.log('  Ein erfolgreicher Upload würde hier sofort erscheinen.\n')
    process.exit(0)
  }

  let imBlob = 0
  let lokal = 0

  for (const bild of docs) {
    const adresse = bild.url ?? '(keine)'
    const blob = adresse.includes('blob.vercel-storage.com')
    if (blob) imBlob++
    else lokal++

    const angelegt = bild.createdAt
      ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'short', timeStyle: 'short' }).format(
          new Date(bild.createdAt),
        )
      : '?'

    console.log(`  ${blob ? '[Blob] ' : '[lokal]'} ${String(bild.filename).slice(0, 44)}`)
    console.log(`          ${bild.width}×${bild.height}, angelegt ${angelegt}`)
    console.log(`          ${adresse.slice(0, 110)}`)
  }

  console.log(`\n  Im Blob-Speicher: ${imBlob}   Nur lokal: ${lokal}`)
  if (lokal > 0) {
    console.log('  Die lokal abgelegten Bilder sind auf der Vercel-Seite nicht sichtbar.')
  }
  console.log('')

  process.exit(0)
}

main().catch((fehler) => {
  console.error('Fehler:', fehler?.message ?? fehler)
  process.exit(1)
})
