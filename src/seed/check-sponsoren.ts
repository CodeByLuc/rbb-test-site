import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'sponsoren', limit: 100, depth: 0 })
  
  const kategorien: Record<string, string[]> = {}
  for (const s of docs) {
    const k = s.kategorie as string
    if (!kategorien[k]) kategorien[k] = []
    kategorien[k].push(s.name)
  }
  
  console.log('\nSponsoren nach Kategorie:')
  for (const [kat, names] of Object.entries(kategorien)) {
    console.log(`  ${kat}: ${names.length}`)
  }
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
