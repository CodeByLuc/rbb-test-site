import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const einstellungen = await payload.findGlobal({ slug: 'einstellungen', depth: 2 })
  const logo = (einstellungen as any).logo
  
  console.log('Gespeichertes Logo:')
  if (logo && typeof logo === 'object') {
    console.log('  ID:', logo.id)
    console.log('  Filename:', logo.filename)
    console.log('  Größe:', logo.width + 'x' + logo.height)
    console.log('  URL:', logo.url)
  } else {
    console.log('  Wert:', logo)
  }
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
