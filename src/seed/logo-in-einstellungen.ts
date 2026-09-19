import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  
  // Logo in "einstellungen" speichern
  await payload.updateGlobal({
    slug: 'einstellungen',
    data: { logo: '174' } as never,
  })
  
  console.log('✓ Logo (ID 174) in Einstellungen gespeichert')
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
