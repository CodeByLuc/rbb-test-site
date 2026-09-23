import sharp from 'sharp'

/**
 * Entfernt den hellen "Fransen"-Saum, der beim Freistellen eines Logos von
 * weissem Hintergrund oft übrig bleibt: halbtransparente Randpixel, die noch
 * einen Rest der alten Hintergrundfarbe tragen. Auf dunklem Grund erscheinen
 * sie als dünner weisser Rand ums Motiv.
 *
 *   npx tsx src/seed/logo-entfransen.ts <quelle.png> <ziel.png>
 *
 * Macht den Alphakanal binär (voll deckend oder voll transparent), statt ihn
 * weich auslaufen zu lassen – das frisst genau diese Randpixel.
 */
async function main() {
  const quelle = process.argv[2]
  const ziel = process.argv[3]
  if (!quelle || !ziel) {
    console.error('Aufruf: logo-entfransen.ts <quelle.png> <ziel.png>')
    process.exit(1)
  }

  const { data, info } = await sharp(quelle).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const SCHWELLE = 220
  for (let i = 0; i < data.length; i += channels) {
    data[i + 3] = data[i + 3] >= SCHWELLE ? 255 : 0
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(ziel)
  console.log(`✓ Entfranst: ${ziel}`)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
