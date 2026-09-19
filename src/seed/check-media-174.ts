import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const media = await payload.findByID({ collection: 'media', id: '174' })
  
  console.log('ID:', media.id)
  console.log('Filename:', media.filename)
  console.log('Größe:', media.width + 'x' + media.height)
  console.log('URL:', media.url)
  
  process.exit(0)
}
main().catch(f => { console.error(f?.message ?? f); process.exit(1) })
