import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'media', where: { filename: { like: process.argv[2] } }, limit: 10, depth: 0 })
  console.log(`\n${docs.length} Treffer fuer "${process.argv[2]}":\n`)
  for (const d of docs) console.log(`  id=${d.id}  ${d.filename}  ${d.url}`)
  console.log('')
  process.exit(0)
}
main().catch((f) => { console.error(f?.message ?? f); process.exit(1) })
