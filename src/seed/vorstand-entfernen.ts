import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Entfernt eine Person aus dem Vorstand (Seite «Verein»).
 *
 *   npx tsx src/seed/vorstand-entfernen.ts "Flavio Gerber"
 */

async function main() {
  const personName = process.argv[2]
  if (!personName) {
    console.error('Aufruf: vorstand-entfernen.ts "<Name>"')
    process.exit(1)
  }

  const payload = await getPayload({ config: await configPromise })

  const verein = (await payload.findGlobal({ slug: 'verein', depth: 0 })) as {
    vorstand?: { name?: string; funktion?: string }[]
  }
  const vorstand = verein.vorstand ?? []

  const gesucht = personName.trim().toLowerCase()
  const neu = vorstand.filter((p) => (p.name ?? '').trim().toLowerCase() !== gesucht)

  if (neu.length === vorstand.length) {
    console.log(`\n«${personName}» ist nicht im Vorstand hinterlegt.`)
    console.log('Vorhandene Namen:')
    for (const p of vorstand) console.log(`  ${p.funktion}: ${p.name}`)
    console.log('')
    process.exit(1)
  }

  await payload.updateGlobal({
    slug: 'verein',
    data: { vorstand: neu } as never,
  })

  console.log(`\n«${personName}» aus dem Vorstand entfernt. Verbleibend:`)
  for (const p of neu) console.log(`  ${p.funktion}: ${p.name}`)
  console.log('')
  process.exit(0)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
