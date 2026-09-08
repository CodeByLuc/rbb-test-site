import 'dotenv/config'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({ collection: 'media', limit: 500, depth: 0 })

  console.log(`\n${docs.length} Einträge, prüfe Erreichbarkeit über localhost:3000 ...\n`)

  let ok = 0
  const fehler: string[] = []
  for (const d of docs) {
    if (!d.url) continue
    const url = d.url.startsWith('http') ? d.url : `http://localhost:3000${d.url}`
    try {
      const r = await fetch(url, { method: 'GET' })
      if (r.ok) ok++
      else fehler.push(`${d.filename}: ${r.status}`)
    } catch (e) {
      fehler.push(`${d.filename}: ${(e as Error).message.slice(0, 50)}`)
    }
  }

  console.log(`  erreichbar: ${ok}`)
  console.log(`  fehlgeschlagen: ${fehler.length}`)
  for (const f of fehler.slice(0, 15)) console.log(`     ${f}`)
  console.log('')
  process.exit(fehler.length > 0 ? 1 : 0)
}
main().catch((f) => { console.error(f?.message ?? f); process.exit(1) })
