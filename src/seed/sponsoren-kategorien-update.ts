import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'sponsoren', limit: 100, depth: 0 })
  
  let aktualisiert = 0
  for (const s of docs) {
    if (s.kategorie === 'goenner') {
      await payload.update({
        collection: 'sponsoren',
        id: s.id,
        data: { kategorie: 'sponsor' } as never,
      })
      console.log(`  ✓ ${s.name}: goenner → sponsor`)
      aktualisiert++
    }
  }
  
  console.log(`\n${aktualisiert} Sponsoren aktualisiert.\n`)
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
