import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'sponsoren', limit: 50, depth: 1, sort: 'reihenfolge' })
  console.log(`\n${docs.length} Sponsoren:\n`)
  for (const s of docs) {
    const logo = s.logo && typeof s.logo === 'object' ? (s.logo as { filename?: string }).filename : s.logo
    console.log(`  ${String(s.name).padEnd(28)} ${String(s.kategorie).padEnd(12)} Logo: ${logo ?? '(keins)'}  Website: ${s.website ?? '-'}`)
  }
  console.log('')
  process.exit(0)
}
main().catch((f) => { console.error(f?.message ?? f); process.exit(1) })
