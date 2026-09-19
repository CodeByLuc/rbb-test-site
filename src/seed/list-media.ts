import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'media', limit: 100 })
  
  console.log(`\n${docs.length} Mediadateien:`)
  for (const m of docs.filter(m => m.filename?.includes('wappen') || m.filename?.includes('ehc'))) {
    console.log(`  ${m.id}  ${m.filename}  ${m.width}x${m.height}`)
  }
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
