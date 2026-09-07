import 'dotenv/config'

import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

/**
 * Stellt fehlende Bilddateien aus den Quellordnern wieder her.
 *
 *   npx tsx src/seed/media-wiederherstellen.ts <quellordner...> [--probe]
 *
 * Beim Umstellen auf den Blob-Speicher hat Payload die lokalen Dateien
 * geloescht, waehrend das Hochladen scheiterte – die Eintraege zeigten danach
 * ins Leere. Hier wird zu jedem Eintrag die passende Quelldatei gesucht und
 * erneut gespeichert. Weil die Kennung erhalten bleibt, behalten Teams und
 * Beitraege ihre Bilder.
 *
 * Die Ordner werden in der angegebenen Reihenfolge durchsucht: entgruente
 * Fassungen zuerst, damit nicht versehentlich die Greenscreen-Originale
 * zurueckkommen.
 */

/** «img_0908-1.jpg» und «IMG_0908.JPG» sollen als dasselbe Bild gelten. */
function schluessel(dateiname: string): string {
  return path
    .basename(dateiname)
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/-\d+$/, '')
}

/** Alle Bilddateien eines Ordnerbaums, nach Schluessel abgelegt. */
function sammle(ordner: string, ablage: Map<string, string>) {
  if (!fs.existsSync(ordner)) return
  for (const eintrag of fs.readdirSync(ordner, { withFileTypes: true })) {
    const voll = path.join(ordner, eintrag.name)
    if (eintrag.isDirectory()) {
      // Aussortierte Bilder (unscharf, dunkel) bleiben aussen vor.
      if (/^(unscharf|dunkel|quer)$/i.test(eintrag.name)) continue
      sammle(voll, ablage)
    } else if (/\.(jpe?g|png)$/i.test(eintrag.name)) {
      const s = schluessel(eintrag.name)
      // Erster Fund gewinnt – darum die Ordner nach Vorrang uebergeben.
      if (!ablage.has(s)) ablage.set(s, voll)
    }
  }
}

async function main() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('\nBLOB_READ_WRITE_TOKEN ist gesetzt. Erst entfernen, sonst schlaegt es wieder fehl.\n')
    process.exit(1)
  }

  const ordner = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const nurEines = process.argv.includes('--probe')

  if (ordner.length === 0) {
    console.error('Quellordner angeben (Vorrang von links nach rechts).')
    process.exit(1)
  }

  const quellen = new Map<string, string>()
  for (const o of ordner) sammle(path.resolve(o), quellen)
  console.log(`\n${quellen.size} Quellbilder gefunden.\n`)

  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'media', limit: 500, depth: 0, sort: 'filename' })
  const zielordner = path.resolve('media')

  let wieder = 0
  let vorhanden = 0
  const ohneQuelle: string[] = []
  let fehler = 0

  for (const bild of docs) {
    if (!bild.filename) continue

    if (fs.existsSync(path.join(zielordner, bild.filename))) {
      vorhanden++
      continue
    }

    const quelle = quellen.get(schluessel(bild.filename))
    if (!quelle) {
      ohneQuelle.push(bild.filename)
      continue
    }

    try {
      await payload.update({ collection: 'media', id: bild.id, data: {}, filePath: quelle })
      wieder++
      if (wieder <= 3 || wieder % 25 === 0) {
        console.log(`  ${String(wieder).padStart(3)}  ${bild.filename}  <-  ${path.basename(quelle)}`)
      }
      if (nurEines) break
    } catch (f) {
      console.log(`  ${bild.filename}: ${(f as Error).message.slice(0, 80)}`)
      fehler++
    }
  }

  console.log(
    `\n${wieder} wiederhergestellt` +
      `${vorhanden > 0 ? `, ${vorhanden} waren vorhanden` : ''}` +
      `${ohneQuelle.length > 0 ? `, ${ohneQuelle.length} ohne Quelle` : ''}` +
      `${fehler > 0 ? `, ${fehler} fehlgeschlagen` : ''}`,
  )
  for (const f of ohneQuelle.slice(0, 10)) console.log(`     ohne Quelle: ${f}`)
  console.log('')
  process.exit(fehler > 0 ? 1 : 0)
}

main().catch((f) => {
  console.error('\nFehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
