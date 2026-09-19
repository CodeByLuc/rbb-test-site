import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const einstellungen = await payload.findGlobal({ slug: 'einstellungen', depth: 2 })
  const logo = (einstellungen as any).logo
  
  if (logo) {
    if (typeof logo === 'object' && 'id' in logo) {
      console.log('Logo ist ein Objekt:')
      console.log('  ID:', logo.id)
      console.log('  URL:', logo.url)
    } else if (typeof logo === 'number' || typeof logo === 'string') {
      console.log('Logo ist eine ID:', logo)
    } else {
      console.log('Logo:', logo)
    }
  } else {
    console.log('Logo ist undefined oder null')
  }
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
