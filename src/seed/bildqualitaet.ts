import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

/**
 * Beurteilt Fotos vor dem Import: Ausrichtung, Schärfe und Helligkeit.
 *
 *   npx tsx src/seed/bildqualitaet.ts <ordner> [--verschieben]
 *
 * Aus der Kamera kommen Bilder, die quer liegen, verwackelt oder zu dunkel
 * sind. Auf der Website fallen die sofort auf. Mit «--verschieben» wandern die
 * auffälligen Bilder in Unterordner («quer», «unscharf», «dunkel»), der Rest
 * bleibt liegen und kann importiert werden.
 *
 * Schärfe wird über die Streuung der Helligkeitsunterschiede geschätzt: ein
 * scharfes Bild hat viele harte Kanten, ein verwackeltes kaum welche.
 */

type Befund = {
  datei: string
  breite: number
  hoehe: number
  quer: boolean
  schaerfe: number
  helligkeit: number
}

/** Grobe Schärfeschätzung über Unterschiede zwischen Nachbarpixeln. */
async function messe(dateipfad: string): Promise<Befund> {
  const bild = sharp(dateipfad).rotate()
  const info = await bild.metadata()

  // Klein rechnen, in Graustufen – das genügt für die Beurteilung und ist schnell.
  const { data, info: roh } = await bild
    .clone()
    .resize({ width: 320, withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let summe = 0
  let kantenSumme = 0
  let kantenQuadrate = 0
  let anzahl = 0

  for (let y = 1; y < roh.height - 1; y++) {
    for (let x = 1; x < roh.width - 1; x++) {
      const i = y * roh.width + x
      summe += data[i]
      // Laplace-Näherung: Abweichung vom Mittel der vier Nachbarn.
      const kante =
        4 * data[i] - data[i - 1] - data[i + 1] - data[i - roh.width] - data[i + roh.width]
      kantenSumme += kante
      kantenQuadrate += kante * kante
      anzahl++
    }
  }

  const mittel = kantenSumme / anzahl
  const streuung = kantenQuadrate / anzahl - mittel * mittel

  return {
    datei: path.basename(dateipfad),
    breite: info.width ?? 0,
    hoehe: info.height ?? 0,
    quer: (info.width ?? 0) > (info.height ?? 0),
    schaerfe: Math.round(streuung),
    helligkeit: Math.round(summe / anzahl),
  }
}

async function main() {
  const ordner = process.argv[2]
  const verschieben = process.argv.includes('--verschieben')

  if (!ordner || !fs.existsSync(ordner)) {
    console.error('Ordner angeben.')
    process.exit(1)
  }

  const dateien = fs.readdirSync(ordner).filter((d) => /\.(jpe?g|png)$/i.test(d)).sort()
  const befunde: Befund[] = []
  for (const datei of dateien) befunde.push(await messe(path.join(ordner, datei)))

  // Schwellen aus dem Bestand ableiten, nicht fest vorgeben – die Streuung
  // hängt stark von Motiv und Kamera ab.
  const schaerfen = befunde.map((b) => b.schaerfe).sort((a, b) => a - b)
  const mittlereSchaerfe = schaerfen[Math.floor(schaerfen.length / 2)]
  const grenzeSchaerfe = mittlereSchaerfe * 0.35
  const grenzeDunkel = 45

  /*
    Das Seitenverhältnis sagt hier nichts aus: alle Aufnahmen sind 6000×4000
    quer, auch die richtig ausgerichteten. Ob jemand kopfsteht, lässt sich ohne
    Gesichtserkennung nicht zuverlässig feststellen – das bleibt Handarbeit.
    Beurteilt werden darum nur Schärfe und Helligkeit.
  */
  const problem = (b: Befund) =>
    b.schaerfe < grenzeSchaerfe ? 'unscharf' : b.helligkeit < grenzeDunkel ? 'dunkel' : null

  console.log(`\n${path.basename(ordner)}: ${befunde.length} Bilder`)
  console.log(`  mittlere Schärfe ${mittlereSchaerfe}, Grenze ${Math.round(grenzeSchaerfe)}\n`)

  const gruppen: Record<string, Befund[]> = { unscharf: [], dunkel: [], gut: [] }
  for (const b of befunde) gruppen[problem(b) ?? 'gut'].push(b)

  for (const [name, liste] of Object.entries(gruppen)) {
    if (liste.length === 0) continue
    console.log(`  ${name.padEnd(9)} ${String(liste.length).padStart(3)}`)
    if (name !== 'gut') {
      for (const b of liste.slice(0, 6)) {
        console.log(
          `      ${b.datei.padEnd(16)} ${b.breite}×${b.hoehe}` +
            `  Schärfe ${String(b.schaerfe).padStart(4)}  Helligkeit ${b.helligkeit}`,
        )
      }
      if (liste.length > 6) console.log(`      … und ${liste.length - 6} weitere`)
    }
  }

  if (verschieben) {
    for (const [name, liste] of Object.entries(gruppen)) {
      if (name === 'gut' || liste.length === 0) continue
      const ziel = path.join(ordner, name)
      fs.mkdirSync(ziel, { recursive: true })
      for (const b of liste) {
        fs.renameSync(path.join(ordner, b.datei), path.join(ziel, b.datei))
      }
      console.log(`\n  ${liste.length} Bilder nach «${name}» verschoben`)
    }
    console.log(`\n  ${gruppen.gut.length} Bilder bleiben zum Import liegen.`)
  }

  console.log('')
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
