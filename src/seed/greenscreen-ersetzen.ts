import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Ersetzt den grünen Hintergrund von Studioaufnahmen durch Vereinsblau.
 *
 *   npx tsx src/seed/greenscreen-ersetzen.ts <quellordner> <zielordner>
 *
 * Die Porträts der Damen und der 1. Mannschaft wurden vor einem grünen Tuch
 * aufgenommen – gedacht zum Freistellen. Unbearbeitet leuchtet auf der Website
 * eine grüne Fläche.
 *
 * Erkannt wird Grün daran, dass der Grünanteil deutlich über Rot und Blau
 * liegt. Am Rand wird weich übergeblendet, damit Haare nicht ausfransen, und
 * verbliebener Grünstich auf der Person wird abgeschwächt.
 */

// Vereinsblau als neuer Hintergrund, oben etwas heller für Tiefe.
const HINTERGRUND = { r: 0x0f, g: 0x3a, b: 0x70 }

/** Wie stark sticht Grün heraus? 0 = gar nicht, 1 = eindeutig Hintergrund. */
function gruenAnteil(r: number, g: number, b: number): number {
  const vergleich = Math.max(r, b)
  if (g <= vergleich) return 0
  // Abstand des Grüns zum stärkeren der beiden anderen Kanäle.
  const abstand = (g - vergleich) / 255
  // Unter 8 % Abstand ist es kein Hintergrund, über 22 % sicher.
  return Math.min(1, Math.max(0, (abstand - 0.08) / 0.14))
}

export async function ersetzeHintergrund(quelle: string, ziel: string, breite = 1600) {
  const { data, info } = await sharp(quelle)
    .rotate()
    .resize({ width: breite, withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let ersetzt = 0

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    const anteil = gruenAnteil(r, g, b)
    if (anteil <= 0) continue

    if (anteil > 0.5) ersetzt++

    // Grünstich mindern: Grün höchstens auf das Niveau der Nachbarkanäle.
    const entgruent = Math.min(g, Math.max(r, b))

    data[i] = Math.round(r * (1 - anteil) + HINTERGRUND.r * anteil)
    data[i + 1] = Math.round(entgruent * (1 - anteil) + HINTERGRUND.g * anteil)
    data[i + 2] = Math.round(b * (1 - anteil) + HINTERGRUND.b * anteil)
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(ziel)

  return { breite: info.width, hoehe: info.height, anteilErsetzt: ersetzt / (info.width * info.height) }
}

async function main() {
  const quelle = process.argv[2]
  const ziel = process.argv[3]

  if (!quelle || !ziel) {
    console.error('Aufruf: greenscreen-ersetzen.ts <quellordner> <zielordner>')
    process.exit(1)
  }

  fs.mkdirSync(ziel, { recursive: true })
  const dateien = fs.readdirSync(quelle).filter((d) => /\.(jpe?g|png)$/i.test(d)).sort()

  console.log(`\n${dateien.length} Bilder\n`)

  for (const datei of dateien) {
    const zielDatei = path.join(ziel, datei.replace(/\.[^.]+$/, '.jpg').toLowerCase())
    const ergebnis = await ersetzeHintergrund(path.join(quelle, datei), zielDatei)
    console.log(
      `  ${datei.padEnd(18)} ${ergebnis.breite}×${ergebnis.hoehe}` +
        `  Hintergrund ${(ergebnis.anteilErsetzt * 100).toFixed(0)} %`,
    )
  }

  console.log('')
}

if (process.argv[1]?.includes('greenscreen-ersetzen')) {
  main().catch((f) => {
    console.error('Fehlgeschlagen:', f?.message ?? f)
    process.exit(1)
  })
}
