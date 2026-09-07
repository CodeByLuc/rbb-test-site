import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Rechnet Fotos aus der Kamera auf Webgrösse herunter.
 *
 *   npx tsx src/seed/fotos-aufbereiten.ts <quellordner> <zielordner>
 *
 * Aus der Kamera kommen Bilder mit 5–8 MB. Für die Website genügen rund
 * 2200 Pixel Breite; das ergibt etwa 300–600 KB pro Bild bei gleicher
 * sichtbarer Qualität. Ausrichtungsangaben (EXIF) werden angewandt, damit
 * hochkante Aufnahmen nicht liegend erscheinen.
 */

async function main() {
  const quelle = process.argv[2]
  const ziel = process.argv[3]

  if (!quelle || !ziel) {
    console.error('Aufruf: fotos-aufbereiten.ts <quellordner> <zielordner>')
    process.exit(1)
  }

  fs.mkdirSync(ziel, { recursive: true })

  const dateien = fs
    .readdirSync(quelle)
    .filter((d) => /\.(jpe?g|png)$/i.test(d))
    .sort()

  console.log(`\n${dateien.length} Bilder in ${path.basename(quelle)}\n`)

  let vorher = 0
  let nachher = 0
  let fehler = 0

  for (const [index, datei] of dateien.entries()) {
    const von = path.join(quelle, datei)
    const nach = path.join(ziel, datei.replace(/\.[^.]+$/, '.jpg').toLowerCase())

    try {
      const groesseVorher = fs.statSync(von).size
      const info = await sharp(von)
        .rotate() // EXIF-Ausrichtung anwenden
        .resize({ width: 2200, withoutEnlargement: true })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(nach)

      const groesseNachher = fs.statSync(nach).size
      vorher += groesseVorher
      nachher += groesseNachher

      console.log(
        `  ${String(index + 1).padStart(2)}/${dateien.length}  ${datei.padEnd(16)}` +
          ` ${info.width}×${info.height}` +
          `  ${(groesseVorher / 1e6).toFixed(1)} MB → ${(groesseNachher / 1e6).toFixed(2)} MB`,
      )
    } catch (f) {
      fehler++
      console.log(`  ${datei}: übersprungen (${(f as Error).message.slice(0, 60)})`)
    }
  }

  console.log(
    `\nFertig: ${(vorher / 1e6).toFixed(0)} MB → ${(nachher / 1e6).toFixed(0)} MB` +
      `${fehler > 0 ? `, ${fehler} übersprungen` : ''}\n`,
  )
}

main().catch((f) => {
  console.error('Abgebrochen:', f?.message ?? f)
  process.exit(1)
})
