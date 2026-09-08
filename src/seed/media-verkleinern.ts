import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { getPayload } from 'payload'

/**
 * Rechnet zu gross gebliebene Originale in der Mediathek auf Webgrösse
 * herunter und speichert sie neu.
 *
 *   npx tsx src/seed/media-verkleinern.ts [Grenze in MB, Standard 1]
 *
 * media-wiederherstellen.ts hat für die U14 keine vorbearbeitete Fassung
 * gefunden und ist auf die unbearbeiteten Kameradateien (5152×3864, rund
 * 9 MB) zurückgefallen. Dieses Script sucht alle Einträge über der Grenze
 * und ersetzt sie durch eine Fassung mit 2200 Pixel Breite – wie es
 * fotos-importieren.ts normalerweise vor dem Hochladen tut.
 */

const MAX_BREITE = 2200

async function main() {
  const grenzeMB = Number(process.argv[2] ?? 1)
  const payload = await getPayload({ config: await configPromise })

  const { docs } = await payload.find({ collection: 'media', limit: 500, depth: 0 })
  const gross = docs.filter((b) => (b.filesize ?? 0) > grenzeMB * 1_000_000)

  console.log(`\n${gross.length} Einträge über ${grenzeMB} MB\n`)
  if (gross.length === 0) {
    process.exit(0)
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rbb-verkleinern-'))
  const ordner = path.resolve('media')
  let erledigt = 0
  let ohneDatei = 0

  for (const bild of gross) {
    if (!bild.filename) continue
    const quelle = path.join(ordner, bild.filename)

    if (!fs.existsSync(quelle)) {
      // Liegt schon im Blob – von dort holen, verkleinern, zurückspielen.
      if (bild.url?.startsWith('http')) {
        const antwort = await fetch(bild.url)
        if (!antwort.ok) {
          console.log(`  ${bild.filename}: Blob-Datei nicht erreichbar (${antwort.status})`)
          ohneDatei++
          continue
        }
        fs.writeFileSync(quelle, Buffer.from(await antwort.arrayBuffer()))
      } else {
        console.log(`  ${bild.filename}: Datei fehlt`)
        ohneDatei++
        continue
      }
    }

    const ziel = path.join(tmp, path.basename(bild.filename).replace(/\.[^.]+$/, '.jpg'))
    await sharp(quelle)
      .rotate()
      .resize({ width: MAX_BREITE, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(ziel)

    const vorherMB = ((bild.filesize ?? 0) / 1_000_000).toFixed(1)
    await payload.update({ collection: 'media', id: bild.id, data: {}, filePath: ziel })
    const nachher = fs.statSync(ziel).size
    console.log(`  ${bild.filename.padEnd(20)} ${vorherMB} MB  ->  ${(nachher / 1_000_000).toFixed(2)} MB`)
    erledigt++
  }

  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`\n${erledigt} verkleinert${ohneDatei > 0 ? `, ${ohneDatei} ohne Quelle` : ''}\n`)
  process.exit(0)
}

main().catch((f) => {
  console.error('\nFehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
