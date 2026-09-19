import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  
  // Neues Logo mit ID 174 in globalen Einstellungen speichern
  await payload.updateGlobal({
    slug: 'verein',
    data: { logo: '174' } as never,
  })
  
  console.log('✓ Logo (ID 174) in globalen Einstellungen gespeichert')
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
