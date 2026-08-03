import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Entfernt ein Trainingsangebot von der Seite «Eishockey».
 *
 *   npx tsx src/seed/angebot-entfernen.ts "Shootingtraining"
 *
 * Der Titel wird ohne Rücksicht auf Gross- und Kleinschreibung verglichen.
 */

async function main() {
  const gesucht = process.argv[2]
  if (!gesucht) {
    console.error('Titel des Angebots angeben, z. B. "Shootingtraining".')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  const inhalt = (await payload.findGlobal({ slug: 'eishockey', depth: 0 })) as {
    angebote?: { titel?: string }[]
  }
  const vorher = inhalt.angebote ?? []

  if (vorher.length === 0) {
    console.log('Es sind keine Trainingsangebote hinterlegt.')
    process.exit(0)
  }

  console.log('\nVorhandene Angebote:')
  for (const angebot of vorher) console.log(`  • ${angebot.titel}`)

  const nachher = vorher.filter(
    (angebot) => (angebot.titel ?? '').trim().toLowerCase() !== gesucht.trim().toLowerCase(),
  )

  if (nachher.length === vorher.length) {
    console.log(`\n«${gesucht}» ist nicht vorhanden – nichts geändert.`)
    process.exit(0)
  }

  await payload.updateGlobal({
    slug: 'eishockey',
    data: { angebote: nachher } as never,
  })

  console.log(`\n«${gesucht}» entfernt. Verbleibend:`)
  for (const angebot of nachher) console.log(`  • ${angebot.titel}`)
  console.log('')

  process.exit(0)
}

main().catch((fehler) => {
  console.error('Fehlgeschlagen:', fehler?.message ?? fehler)
  process.exit(1)
})
