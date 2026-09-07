import 'dotenv/config'
import configPromise from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

/** Prueft, ob zu jedem Eintrag der Mediathek die Datei vorhanden ist. */
async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'media', limit: 500, depth: 0, sort: 'filename' })
  const ordner = path.resolve('media')

  let ok = 0
  const fehlend: string[] = []
  for (const b of docs) {
    if (!b.filename) continue
    if (fs.existsSync(path.join(ordner, b.filename))) ok++
    else fehlend.push(b.filename)
  }

  console.log(`\nEintraege: ${docs.length}`)
  console.log(`  Datei vorhanden: ${ok}`)
  console.log(`  Datei fehlt:     ${fehlend.length}`)
  for (const f of fehlend.slice(0, 12)) console.log(`     ${f}`)
  if (fehlend.length > 12) console.log(`     ... und ${fehlend.length - 12} weitere`)

  // Werden Teamfotos noch aufgeloest?
  const { docs: teams } = await payload.find({ collection: 'teams', limit: 20, depth: 1 })
  console.log('\nTeamfotos:')
  for (const t of teams) {
    const f = t.teamfoto
    const n = f && typeof f === 'object' ? (f as { filename?: string }).filename : f ? `id ${f}` : '—'
    console.log(`  ${String(t.name).padEnd(16)} ${n}`)
  }
  console.log('')
  process.exit(0)
}
main().catch((f) => { console.error(f?.message ?? f); process.exit(1) })
