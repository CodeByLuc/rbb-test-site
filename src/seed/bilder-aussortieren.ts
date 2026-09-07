import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Entfernt einzelne Bilder aus der Mediathek, etwa quer liegende oder
 * verwackelte Aufnahmen.
 *
 *   npx tsx src/seed/bilder-aussortieren.ts dscn0007.jpg dscn0009.jpg …
 *
 * Bilder, die noch als Teamfoto oder in einem Beitrag verwendet werden, bleiben
 * stehen – sonst entstünden leere Stellen auf der Website. Solche Fälle werden
 * gemeldet, damit dort zuerst ein Ersatz gewählt werden kann.
 */

async function main() {
  const namen = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  if (namen.length === 0) {
    console.error('Dateinamen der auszusortierenden Bilder angeben.')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  let entfernt = 0
  let inVerwendung = 0
  let unbekannt = 0

  for (const name of namen) {
    const { docs } = await payload.find({
      collection: 'media',
      where: { filename: { equals: name } },
      limit: 1,
    })
    const bild = docs[0]
    if (!bild) {
      console.log(`  ${name}: nicht in der Mediathek`)
      unbekannt++
      continue
    }

    // Wird das Bild noch gebraucht?
    const { totalDocs: alsTeamfoto } = await payload.count({
      collection: 'teams',
      where: { teamfoto: { equals: bild.id } },
    })
    const { totalDocs: alsTitelbild } = await payload.count({
      collection: 'posts',
      where: { titelbild: { equals: bild.id } },
    })

    if (alsTeamfoto > 0 || alsTitelbild > 0) {
      console.log(
        `  ${name}: wird noch verwendet (${alsTeamfoto} Team, ${alsTitelbild} Beitrag) – bleibt stehen`,
      )
      inVerwendung++
      continue
    }

    await payload.delete({ collection: 'media', id: bild.id })
    console.log(`  ${name}: entfernt`)
    entfernt++
  }

  console.log(
    `\n${entfernt} entfernt` +
      `${inVerwendung > 0 ? `, ${inVerwendung} noch in Verwendung` : ''}` +
      `${unbekannt > 0 ? `, ${unbekannt} nicht gefunden` : ''}\n`,
  )
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
