import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  
  // Neue ID 174 direkt speichern
  const result = await payload.updateGlobal({
    slug: 'einstellungen',
    data: { logo: 174 } as any,
  })
  
  console.log('✓ Logo aktualisiert auf ID 174')
  
  // Überprüfen
  const check = await payload.findGlobal({ slug: 'einstellungen', depth: 2 })
  const logo = (check as any).logo
  console.log('Gespeichert:', logo?.id || logo)
  
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
