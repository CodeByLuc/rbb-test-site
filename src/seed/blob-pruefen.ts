import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'DSCN0008-1.JPG' } },
    limit: 1,
    depth: 0,
  })
  console.log(JSON.stringify(docs[0], null, 2))
  process.exit(0)
}
main().catch((f) => { console.error(f?.message ?? f); process.exit(1) })
