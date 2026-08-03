import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Prüft, mit welcher Datenbank die Website spricht und ob die Tabellen stehen.
 *
 *   npx tsx src/seed/datenbank-pruefen.ts
 *
 * Für Neon die Verbindung vorher setzen:
 *   $env:DATABASE_URI = "postgresql://…"
 */

async function main() {
  const verbindung = process.env.DATABASE_URI || process.env.DATABASE_URL || '(keine)'
  const istPostgres = verbindung.startsWith('postgres')

  // Passwort nicht ausgeben.
  const anzeige = verbindung.replace(/:\/\/[^@]*@/, '://***@')
  console.log(`\nDatenbank: ${istPostgres ? 'PostgreSQL (Neon)' : 'SQLite (lokal)'}`)
  console.log(`Adresse:   ${anzeige}\n`)

  const payload = await getPayload({ config: await configPromise })
  console.log('Verbindung steht.\n')

  const sammlungen = ['posts', 'teams', 'sponsoren', 'media', 'dokumente', 'users'] as const
  for (const sammlung of sammlungen) {
    try {
      const { totalDocs } = await payload.count({ collection: sammlung })
      console.log(`  ${sammlung.padEnd(11)} ${String(totalDocs).padStart(4)} Einträge`)
    } catch (fehler) {
      console.log(`  ${sammlung.padEnd(11)} FEHLER – ${(fehler as Error).message.slice(0, 70)}`)
    }
  }

  console.log('')
  process.exit(0)
}

main().catch((fehler) => {
  console.error('\nFehlgeschlagen:', fehler?.message ?? fehler)
  process.exit(1)
})
