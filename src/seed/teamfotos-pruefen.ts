import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Zeigt, welches Bild bei welchem Team als Teamfoto hinterlegt ist, und wie
 * viele Bilder es insgesamt gibt.
 *
 *   npx tsx src/seed/teamfotos-pruefen.ts [Team] [Dateiname]
 *
 * Mit beiden Angaben wird das Teamfoto gesetzt:
 *   npx tsx src/seed/teamfotos-pruefen.ts "Damen" img_0930.jpg
 */

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const zielTeam = process.argv[2]
  const zielDatei = process.argv[3]

  if (zielTeam && zielDatei) {
    const { docs: teams } = await payload.find({
      collection: 'teams',
      where: { name: { equals: zielTeam } },
      limit: 1,
    })
    const { docs: bilder } = await payload.find({
      collection: 'media',
      where: { filename: { equals: zielDatei } },
      limit: 1,
    })

    if (!teams[0]) {
      console.error(`Team «${zielTeam}» nicht gefunden.`)
      process.exit(1)
    }
    if (!bilder[0]) {
      console.error(`Bild «${zielDatei}» nicht gefunden.`)
      process.exit(1)
    }

    await payload.update({
      collection: 'teams',
      id: teams[0].id,
      data: { teamfoto: bilder[0].id } as never,
    })
    console.log(`\nTeamfoto von «${zielTeam}» auf ${zielDatei} gesetzt.\n`)
    process.exit(0)
  }

  const { docs: teams } = await payload.find({
    collection: 'teams',
    limit: 100,
    sort: 'reihenfolge',
    depth: 1,
  })

  console.log('\nTeamfotos:\n')
  for (const team of teams) {
    const foto = team.teamfoto
    const name =
      foto && typeof foto === 'object'
        ? (foto as { filename?: string }).filename
        : foto
          ? `(nur Verweis ${foto})`
          : '—'
    console.log(`  ${String(team.name).padEnd(16)} ${name}`)
  }

  const { totalDocs } = await payload.count({ collection: 'media' })
  console.log(`\nBilder in der Mediathek: ${totalDocs}\n`)
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
