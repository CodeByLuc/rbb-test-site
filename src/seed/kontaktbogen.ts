import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Legt aus einem Ordner einen Kontaktbogen an: viele kleine Vorschaubilder auf
 * einem Blatt. So lässt sich ein ganzer Ordner auf einen Blick sichten, statt
 * Bild für Bild zu öffnen.
 *
 *   npx tsx src/seed/kontaktbogen.ts <ordner> <zieldatei.jpg> [spalten]
 */

const KACHEL = 260

async function main() {
  const ordner = process.argv[2]
  const ziel = process.argv[3]
  const spalten = Number(process.argv[4] ?? 6)

  if (!ordner || !ziel) {
    console.error('Aufruf: kontaktbogen.ts <ordner> <zieldatei.jpg> [spalten]')
    process.exit(1)
  }

  const dateien = fs
    .readdirSync(ordner)
    .filter((d) => /\.(jpe?g|png)$/i.test(d))
    .sort()

  if (dateien.length === 0) {
    console.error('Keine Bilder gefunden.')
    process.exit(1)
  }

  const zeilen = Math.ceil(dateien.length / spalten)

  /** Nummer auf die Kachel schreiben, damit sich Bilder benennen lassen. */
  const nummer = (n: number) =>
    Buffer.from(
      `<svg width="${KACHEL}" height="44">
         <rect x="0" y="0" width="52" height="34" fill="#f03c30"/>
         <text x="26" y="25" font-family="sans-serif" font-size="21" font-weight="bold"
               fill="#fff" text-anchor="middle">${n}</text>
       </svg>`,
    )

  const kacheln = (
    await Promise.all(
      dateien.map(async (datei, i) => {
        const bild = await sharp(path.join(ordner, datei))
          .rotate()
          .resize(KACHEL, KACHEL, { fit: 'cover', position: 'centre' })
          .composite([{ input: nummer(i + 1), top: 0, left: 0 }])
          .jpeg({ quality: 70 })
          .toBuffer()
        return {
          input: bild,
          left: (i % spalten) * KACHEL,
          top: Math.floor(i / spalten) * KACHEL,
        }
      }),
    )
  ).flat()

  // Zuordnung Nummer → Dateiname ausgeben, damit die Auswahl eindeutig ist.
  dateien.forEach((d, i) => console.log(`  ${String(i + 1).padStart(3)}  ${d}`))

  await sharp({
    create: {
      width: spalten * KACHEL,
      height: zeilen * KACHEL,
      channels: 3,
      background: { r: 20, g: 28, b: 54 },
    },
  })
    .composite(kacheln)
    .jpeg({ quality: 72 })
    .toFile(ziel)

  console.log(
    `${dateien.length} Bilder auf ${spalten}×${zeilen} Kacheln → ${path.basename(ziel)}` +
      ` (${(fs.statSync(ziel).size / 1e6).toFixed(1)} MB)`,
  )
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
