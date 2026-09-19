import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sharp from 'sharp'
import { getPayload } from 'payload'

/**
 * Ersetzt die Platzhalter-Sponsoren durch die echten Partner samt Logo.
 *
 *   npx tsx src/seed/sponsoren-importieren.ts <ordner>
 *
 * Der Ordner enthält die Logo-Dateien, benannt nach dem Sponsor (z. B.
 * «comset-logo.webp»). Vorhandene Sponsoren-Einträge werden vollständig ersetzt,
 * weil keiner der bisherigen Platzhalternamen («Beispiel Hauptsponsor AG»
 * usw.) zu einem echten Partner passt.
 *
 * Jedes Logo wird vor dem Hochladen als PNG auf über 1800 Pixel Breite
 * gebracht, siehe Begründung bei ZIEL_BREITE weiter unten.
 */

type SponsorEintrag = {
  name: string
  datei: string
  kategorie: 'hauptsponsor' | 'sponsor' | 'goenner'
}

// Reihenfolge = Anzeigereihenfolge auf der Sponsorenseite.
const SPONSOREN: SponsorEintrag[] = [
  { name: 'ComSet', datei: 'rbb1789852981867-comset-logo.webp', kategorie: 'sponsor' },
  { name: 'Bären Elektro', datei: 'rbb1789852981867-baeren-elektro.png', kategorie: 'sponsor' },
  { name: 'Mächler Sanitär Service', datei: 'rbb1789852981867-maechler.svg', kategorie: 'sponsor' },
  { name: 'HAZA', datei: 'rbb1789852981867-haza.svg', kategorie: 'sponsor' },
  { name: 'Prefa', datei: 'rbb1789852981867-prefa.png', kategorie: 'sponsor' },
  { name: 'Sportbörse Niederwangen', datei: 'rbb1789852981867-sportboerse-niederwangen.jpg', kategorie: 'sponsor' },
  { name: 'Vogel Gartenbau', datei: 'rbb1789852981867-vogel-gartenbau.png', kategorie: 'sponsor' },
  { name: 'rubmedia', datei: 'rbb1789852981867-rubmedia.svg', kategorie: 'sponsor' },
  { name: 'Trattoria Bella Italia', datei: 'rbb1789852981867-trattoria.png', kategorie: 'sponsor' },
  { name: 'Jäger Bethlehem', datei: 'rbb1789852981867-jaeger-bethlehem.gif', kategorie: 'sponsor' },
  { name: 'Stiftung Freude herrscht', datei: 'rbb1789852981867-stiftung-freude-herrscht.jpg', kategorie: 'sponsor' },
]

/*
  Die Medien-Sammlung erzeugt automatisch vier Bildgrössen (400/600/900/1800
  Pixel Breite) mit «withoutEnlargement». Sponsoren-Logos sind fast immer
  kleiner als alle vier Zielbreiten – dann klemmen alle vier Varianten auf
  dieselbe tatsächliche Breite und wollen beim Hochladen dieselbe Datei
  gleichzeitig anlegen, was Vercel Blob ablehnt («already exists»).
  Deshalb wird jedes Logo – auch SVG und GIF – vor dem Hochladen auf über
  1800 Pixel Breite gebracht, damit alle vier Varianten unterschiedlich
  ausfallen. Bei einfachen, meist einfarbigen Logos, die ohnehin klein
  angezeigt werden, fällt das nicht auf.
*/
const ZIEL_BREITE = 1900

async function fuersWeb(quelle: string, ablage: string): Promise<string> {
  const ziel = path.join(ablage, `${path.basename(quelle).replace(/\.[^.]+$/, '')}.png`)
  await sharp(quelle)
    .resize({ width: ZIEL_BREITE })
    .png()
    .toFile(ziel)
  return ziel
}

async function main() {
  const ordner = process.argv[2]
  if (!ordner || !fs.existsSync(ordner)) {
    console.error('Ordner mit den Logo-Dateien angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  console.log(
    `\nSpeicher: ${
      process.env.BLOB_READ_WRITE_TOKEN ? 'Vercel Blob (live sichtbar)' : 'lokaler Ordner /media'
    }\n`,
  )

  // Alte Platzhalter-Sponsoren vollstaendig entfernen.
  const { docs: alte } = await payload.find({ collection: 'sponsoren', limit: 100, depth: 0 })
  for (const s of alte) {
    await payload.delete({ collection: 'sponsoren', id: s.id })
    console.log(`  entfernt: ${s.name}`)
  }
  if (alte.length > 0) console.log('')

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rbb-sponsoren-'))
  let angelegt = 0

  try {
    for (const [index, eintrag] of SPONSOREN.entries()) {
      const quelle = path.join(ordner, eintrag.datei)
      if (!fs.existsSync(quelle)) {
        console.log(`  ${eintrag.name}: Datei ${eintrag.datei} fehlt – übersprungen`)
        continue
      }

      const hochzuladen = await fuersWeb(quelle, tmp)

      const logo = await payload.create({
        collection: 'media',
        data: { alt: `Logo ${eintrag.name}` },
        filePath: hochzuladen,
      })

      await payload.create({
        collection: 'sponsoren',
        data: {
          name: eintrag.name,
          logo: logo.id,
          kategorie: eintrag.kategorie,
          reihenfolge: (index + 1) * 10,
          aktiv: true,
        } as never,
      })

      angelegt++
      console.log(`  ${String(angelegt).padStart(2)}/${SPONSOREN.length}  ${eintrag.name.padEnd(26)} ${eintrag.kategorie}`)
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }

  console.log(`\n${angelegt} Sponsoren angelegt.\n`)
  process.exit(0)
}

main().catch((f) => {
  console.error('\nFehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
