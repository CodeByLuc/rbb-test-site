import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'media', limit: 100 })
  
  const logos = docs.filter(d => d.filename?.includes('ehc-wappen'))
  
  console.log(`\nWappen-Dateien (${logos.length}):`)
  for (const m of logos) {
    console.log(`  ID ${m.id}: ${m.filename} (${m.width}x${m.height})`)
    console.log(`    URL: ${m.url}`)
  }
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
