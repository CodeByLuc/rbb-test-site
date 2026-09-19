import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const verein = await payload.findGlobal({ slug: 'verein', depth: 1 })
  const logo = verein.logo as any
  
  if (logo && typeof logo === 'object') {
    console.log('Logo ID:', logo.id)
    console.log('Logo filename:', logo.filename)
    console.log('Logo size:', logo.width + 'x' + logo.height)
  } else {
    console.log('Logo (plain):', logo)
  }
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
