import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  
  // Logo ID 12 in verein speichern
  await payload.updateGlobal({
    slug: 'verein',
    data: { logo: '12' } as never,
  })
  
  console.log('✓ Logo ID 12 in verein gespeichert')
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
