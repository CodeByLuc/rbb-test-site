import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Schneidet das offizielle Clublogo frei und liest die echten Vereinsfarben aus.
 *
 *   npx tsx src/seed/logo-vorbereiten.ts <quelldatei>
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const quelle = process.argv[2]
if (!quelle) throw new Error('Bitte Pfad zur Logodatei angeben.')

const zielOrdner = path.resolve(dirname, '../../logo-quelle')

async function main() {
  const roh = sharp(quelle)
  const info = await roh.metadata()
  console.log(`Quelle: ${info.width}x${info.height}, ${info.format}`)

  // Weissen Rand entfernen und auf sinnvolle Grösse bringen.
  const zugeschnitten = await sharp(quelle)
    .trim({ threshold: 20 })
    .png()
    .toBuffer({ resolveWithObject: true })

  console.log(`Zugeschnitten: ${zugeschnitten.info.width}x${zugeschnitten.info.height}`)

  const { createWriteStream } = await import('fs')
  const { mkdir } = await import('fs/promises')
  await mkdir(zielOrdner, { recursive: true })

  const zielDatei = path.join(zielOrdner, 'logo.png')
  await sharp(zugeschnitten.data)
    .resize({ width: 600, fit: 'inside', withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(zielDatei)
  console.log(`Gespeichert: ${zielDatei}`)
  void createWriteStream

  // Farben zählen, um Rot und Blau exakt zu bestimmen.
  const { data, info: rgbInfo } = await sharp(zugeschnitten.data)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const zaehler = new Map<string, number>()
  for (let i = 0; i < data.length; i += rgbInfo.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Nur kräftige Farben zählen, Weiss und Grautöne überspringen.
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max - min < 60) continue
    const schluessel = `${Math.round(r / 12) * 12},${Math.round(g / 12) * 12},${Math.round(b / 12) * 12}`
    zaehler.set(schluessel, (zaehler.get(schluessel) ?? 0) + 1)
  }

  const hex = (s: string) =>
    '#' +
    s
      .split(',')
      .map((n) => Math.min(255, Number(n)).toString(16).padStart(2, '0'))
      .join('')

  console.log('\nHäufigste Vereinsfarben:')
  ;[...zaehler.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([farbe, anzahl]) => {
      console.log(`  ${hex(farbe).toUpperCase()}  (rgb ${farbe})  ${anzahl} Pixel`)
    })
}

main().catch((fehler) => {
  console.error(fehler)
  process.exit(1)
})
