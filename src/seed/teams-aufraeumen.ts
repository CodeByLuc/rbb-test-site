import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Der Verein hat nur noch eine Aktivmannschaft. Dieses Script führt die beiden
 * bisherigen Teams zusammen: «1. Mannschaft» erhält die Angaben der 4. Liga,
 * «2. Mannschaft» wird entfernt und ihre Beiträge werden umgehängt.
 *
 *   npx tsx src/seed/teams-aufraeumen.ts
 */

async function main() {
  const payload = await getPayload({ config: await configPromise })

  const finde = async (name: string) => {
    const { docs } = await payload.find({
      collection: 'teams',
      where: { name: { equals: name } },
      limit: 1,
    })
    return docs[0] ?? null
  }

  const erste = await finde('1. Mannschaft')
  const zweite = await finde('2. Mannschaft')

  if (!erste) {
    console.log('Keine «1. Mannschaft» gefunden – zuerst "npm run seed" ausführen.')
    process.exit(1)
  }

  // Die verbleibende Mannschaft spielt in der 4. Liga.
  await payload.update({
    collection: 'teams',
    id: erste.id,
    data: {
      liga: '4. Liga',
      kurzbeschreibung:
        'Unsere Aktivmannschaft spielt in der 4. Liga und trägt die Vereinsfarben in der ganzen Region.',
      sihfTeamName: 'EHC Rot-Blau Bern-Bümpliz',
      sihfTeamId: '103916',
      sihfLeagueId: '19',
      tabellenUrl: 'https://www.sihf.ch/de/leagues-cup/clubs/aktivligen/#/clubs/4-league',
    } as never,
  })
  console.log('«1. Mannschaft» auf die 4. Liga gesetzt (Liga 19, Team 103916)')

  if (!zweite) {
    console.log('Keine «2. Mannschaft» vorhanden – nichts zu entfernen.')
    process.exit(0)
  }

  // Beiträge der zweiten Mannschaft auf die erste umhängen, damit nichts verwaist.
  const { docs: beitraege } = await payload.find({
    collection: 'posts',
    where: { team: { equals: zweite.id } },
    limit: 200,
    depth: 0,
  })
  for (const beitrag of beitraege) {
    await payload.update({
      collection: 'posts',
      id: beitrag.id,
      data: { team: erste.id } as never,
    })
    console.log(`  Beitrag «${beitrag.titel}» der 1. Mannschaft zugeordnet`)
  }

  // Ein Teamfoto retten, falls die erste Mannschaft noch keines hat.
  if (!erste.teamfoto && zweite.teamfoto) {
    await payload.update({
      collection: 'teams',
      id: erste.id,
      data: { teamfoto: typeof zweite.teamfoto === 'object' ? zweite.teamfoto.id : zweite.teamfoto } as never,
    })
    console.log('  Teamfoto übernommen')
  }

  await payload.delete({ collection: 'teams', id: zweite.id })
  console.log('«2. Mannschaft» entfernt')

  process.exit(0)
}

main().catch((fehler) => {
  console.error('Aufräumen fehlgeschlagen:', fehler)
  process.exit(1)
})
