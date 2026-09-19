import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  
  // Das richtige Logo finden
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { contains: 'ehc-wappen-upscaled-1789853823048' } },
    limit: 1,
  })
  
  if (docs.length === 0) {
    console.log('Logo nicht gefunden. Suche nach ehc-wappen...')
    const { docs: alle } = await payload.find({
      collection: 'media',
      where: { filename: { contains: 'ehc-wappen' } },
      limit: 20,
    })
    console.log('Verfügbare Logos:')
    for (const d of alle) {
      console.log(`  ${d.id}: ${d.filename}`)
    }
    process.exit(1)
  }
  
  const logoId = docs[0].id
  console.log(`Setze Logo ID ${logoId}: ${docs[0].filename}`)
  
  // In einstellungen speichern
  await payload.updateGlobal({
    slug: 'einstellungen',
    data: { logo: logoId } as never,
  })
  
  console.log('✓ Logo in einstellungen gespeichert')
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
