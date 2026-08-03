import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Initialisiert die Neon PostgreSQL-Datenbank für Production.
 * Führe diesen Script lokal aus (mit DATABASE_URL auf deine Neon-Datenbank gesetzt):
 *
 *   export DATABASE_URL="postgresql://..." && npx tsx src/seed/neon-init.ts
 *
 * Das Script:
 * - Erstellt alle Payload-Tabellen (Collections + Globals)
 * - Fügt einen Demo-Admin-User hinzu (Passwort: "demo")
 * - Fertig für den ersten Deploy
 *
 * Nach diesem Script kann Vercel deployen ohne Fehler.
 */

async function main() {
  const db = (await configPromise).db
  const dbName = process.env.DATABASE_URL?.includes('neon') ? 'Neon' : 'SQLite'

  console.log(`\n🗄️  Initialisiere Payload CMS auf ${dbName}...`)

  try {
    const payload = await getPayload({ config: await configPromise })
    console.log('✅ Payload CMS connected')

    // Prüfe, ob bereits Users existieren (als Zeichen, dass alles initialisiert ist)
    const { docs: users } = await payload.find({
      collection: 'users',
      limit: 1,
      overrideAccess: true,
    })

    if (users.length > 0) {
      console.log('✅ Datenbank ist bereits initialisiert')
      process.exit(0)
    }

    // Admin-User erstellen
    const admin = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@rot-blau.ch',
        password: 'demo',
        role: 'admin',
      },
      draft: false,
      overrideAccess: true,
    })

    console.log(`✅ Admin-User erstellt: admin@rot-blau.ch (Passwort: demo)`)
    console.log(`\n🎉 Datenbank ist bereit für Production!`)
    console.log(`\nNächste Schritte:`)
    console.log(`  1. Neue Redaktoren unter admin@rot-blau.ch/demo im /admin hinzufügen`)
    console.log(`  2. Passwort ändern!`)
    console.log(`  3. Teams, News, Sponsoren im /admin erfassen`)
    console.log(`\n`)

    process.exit(0)
  } catch (fehler) {
    console.error('❌ Fehler beim Initialisieren der Datenbank:', fehler)
    process.exit(1)
  }
}

main()
