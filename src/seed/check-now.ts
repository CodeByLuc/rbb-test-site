import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const einstellungen = await payload.findGlobal({ slug: 'einstellungen', depth: 2 })
  const logo = (einstellungen as any).logo
  console.log('Aktuelles Logo:', typeof logo, JSON.stringify(logo))
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
