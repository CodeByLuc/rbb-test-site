import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  
  // Das neue Logo (ID 12) speichern
  // Payload relationship Felder akzeptieren IDs als Zahlen oder Strings
  await payload.updateGlobal({
    slug: 'einstellungen',
    data: { 
      logo: 12  // Als Zahl versuchen
    } as any,
  })
  
  // Überprüfen
  const check = await payload.findGlobal({ slug: 'einstellungen', depth: 2 })
  const saved = (check as any).logo
  console.log('Gespeichert:', saved?.id || saved)
  
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
