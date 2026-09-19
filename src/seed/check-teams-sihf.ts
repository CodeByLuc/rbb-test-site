import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'teams', limit: 50, depth: 0 })
  
  console.log(`\n${docs.length} Teams:`)
  for (const t of docs) {
    const hatSihf = !!(t.sihfLeagueId && (t.sihfTeamId || t.sihfTeamName))
    console.log(`  ${hatSihf ? '✓' : '✗'} ${t.name} (slug: ${t.slug})`)
    console.log(`      liga: ${t.sihfLeagueId ?? '–'}  teamId: ${t.sihfTeamId ?? '–'}  teamName: ${t.sihfTeamName ?? '–'}`)
  }
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
