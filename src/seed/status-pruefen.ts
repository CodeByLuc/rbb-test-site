import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/** Zeigt Veröffentlichungsstatus der Beiträge und den Inhalt des Vorstands. */

async function main() {
  const payload = await getPayload({ config: await configPromise })

  const { docs } = await payload.find({
    collection: 'posts',
    limit: 100,
    depth: 0,
    sort: '-datum',
  })

  console.log(`\nBeiträge insgesamt: ${docs.length}`)
  for (const post of docs) {
    const status = (post as { _status?: string })._status ?? '(kein Status)'
    console.log(`  ${status.padEnd(10)} ${String(post.titel).slice(0, 58)}`)
  }

  const veroeffentlicht = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 100,
    depth: 0,
  })
  console.log(`\nMit Filter «published»: ${veroeffentlicht.totalDocs}`)

  const verein = (await payload.findGlobal({ slug: 'verein', depth: 0 })) as {
    vorstand?: { name?: string; funktion?: string }[]
    geschichte?: unknown
  }
  console.log(`\nVorstand: ${verein.vorstand?.length ?? 0} Einträge`)
  for (const person of verein.vorstand ?? []) {
    console.log(`  ${person.funktion} – ${person.name}`)
  }
  console.log(`Geschichte hinterlegt: ${verein.geschichte ? 'ja' : 'nein'}`)

  process.exit(0)
}

main().catch((f) => {
  console.error('Fehler:', f?.message ?? f)
  process.exit(1)
})
