import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Trägt die echten Angaben der Hockeyschule ein.
 *
 *   npx tsx src/seed/hockeyschule-angaben.ts
 *
 * Die Werte stammen von der bisherigen Vereinswebsite. Bisher standen dort
 * meine Beispielzeiten – für Eltern die wichtigste Information der ganzen
 * Seite, und sie war schlicht falsch.
 */

async function main() {
  const payload = await getPayload({ config: await configPromise })

  const { docs } = await payload.find({
    collection: 'teams',
    where: { name: { equals: 'Hockeyschule' } },
    limit: 1,
  })

  const team = docs[0]
  if (!team) {
    console.error('Team «Hockeyschule» nicht gefunden.')
    process.exit(1)
  }

  const vorher = (team.trainingszeiten ?? []) as { tag?: string; zeit?: string }[]
  console.log('\nBisher hinterlegt:')
  for (const z of vorher) console.log(`  ${z.tag}: ${z.zeit}`)
  if (vorher.length === 0) console.log('  (nichts)')

  await payload.update({
    collection: 'teams',
    id: team.id,
    data: {
      trainingszeiten: [
        { tag: 'Dienstag', zeit: '16.45 – 17.45', ort: 'Kunsteisbahn Weyermannshaus' },
        { tag: 'Samstag', zeit: '12.45 – 13.45', ort: 'Kunsteisbahn Weyermannshaus' },
      ],
      kurzbeschreibung:
        'Hockey spielen für die Kleinsten: der Einstieg ins Eishockey, in der Regel ab Jahrgang 2021.',
    } as never,
  })

  console.log('\nNeu hinterlegt:')
  console.log('  Dienstag: 16.45 – 17.45, Kunsteisbahn Weyermannshaus')
  console.log('  Samstag:  12.45 – 13.45, Kunsteisbahn Weyermannshaus')

  // Kontaktadresse der Hockeyschule in den Einstellungen ergänzen, falls leer.
  const einstellungen = (await payload.findGlobal({ slug: 'einstellungen', depth: 0 })) as {
    email?: string | null
  }
  if (!einstellungen.email) {
    await payload.updateGlobal({
      slug: 'einstellungen',
      data: { email: 'hockeyschule@rot-blau.ch' } as never,
    })
    console.log('\nKontaktadresse hockeyschule@rot-blau.ch hinterlegt.')
  } else {
    console.log(`\nKontaktadresse bleibt: ${einstellungen.email}`)
  }

  console.log('')
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
