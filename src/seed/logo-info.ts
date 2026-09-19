import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  
  // Globale Einstellungen checken
  const verein = await payload.findGlobal({ slug: 'verein', depth: 1 })
  console.log('\nVerein Global:')
  console.log(JSON.stringify(verein.logo, null, 2))
  
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
