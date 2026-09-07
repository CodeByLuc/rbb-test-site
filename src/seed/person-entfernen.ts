import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Entfernt eine Person aus dem Kader oder der Betreuung eines Teams.
 *
 *   npx tsx src/seed/person-entfernen.ts "1. Mannschaft" "Rettenmund Remo"
 */

async function main() {
  const teamName = process.argv[2]
  const personName = process.argv[3]

  if (!teamName || !personName) {
    console.error('Aufruf: person-entfernen.ts "<Team>" "<Name>"')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  const { docs } = await payload.find({
    collection: 'teams',
    where: { name: { equals: teamName } },
    limit: 1,
  })
  const team = docs[0]
  if (!team) {
    console.error(`Team «${teamName}» nicht gefunden.`)
    process.exit(1)
  }

  const gesucht = personName.trim().toLowerCase()
  const spieler = (team.spieler ?? []) as { name: string }[]
  const trainer = (team.trainer ?? []) as { name: string; funktion?: string | null }[]

  const spielerNeu = spieler.filter((p) => p.name.trim().toLowerCase() !== gesucht)
  const trainerNeu = trainer.filter((p) => p.name.trim().toLowerCase() !== gesucht)

  const entfernt = spieler.length - spielerNeu.length + (trainer.length - trainerNeu.length)

  if (entfernt === 0) {
    console.log(`\n«${personName}» wurde bei «${teamName}» nicht gefunden.`)
    console.log('Vorhandene Namen:')
    for (const p of [...spieler, ...trainer]) console.log(`  ${p.name}`)
    console.log('')
    process.exit(1)
  }

  await payload.update({
    collection: 'teams',
    id: team.id,
    data: { spieler: spielerNeu, trainer: trainerNeu } as never,
  })

  console.log(`\n«${personName}» bei «${teamName}» entfernt.\n`)
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
