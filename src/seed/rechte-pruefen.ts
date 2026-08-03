import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Prüft die Zugriffsrechte direkt gegen Payloads Berechtigungslogik.
 * Damit ist belegt, dass Autor:innen nichts kaputt machen können.
 *
 *   npx tsx src/seed/rechte-pruefen.ts
 */

let bestanden = 0
let gescheitert = 0

const pruefe = async (beschreibung: string, erwartung: 'erlaubt' | 'verboten', aktion: () => Promise<unknown>) => {
  try {
    await aktion()
    if (erwartung === 'erlaubt') {
      console.log(`  OK       ${beschreibung}`)
      bestanden++
    } else {
      console.log(`  PROBLEM  ${beschreibung} – war erlaubt, sollte verboten sein!`)
      gescheitert++
    }
  } catch (fehler) {
    const text = String(fehler)
    if (erwartung === 'verboten') {
      console.log(`  OK       ${beschreibung} (abgewiesen)`)
      bestanden++
    } else {
      console.log(`  PROBLEM  ${beschreibung} – wurde abgewiesen: ${text.slice(0, 120)}`)
      gescheitert++
    }
  }
}

async function main() {
  const payload = await getPayload({ config: await configPromise })

  const { docs: autoren } = await payload.find({
    collection: 'users',
    where: { email: { equals: 'autor@rot-blau.ch' } },
    limit: 1,
  })
  const { docs: admins } = await payload.find({
    collection: 'users',
    where: { email: { equals: 'admin@rot-blau.ch' } },
    limit: 1,
  })

  const autor = autoren[0]
  const admin = admins[0]
  if (!autor || !admin) throw new Error('Konten fehlen – zuerst "npm run seed" ausführen.')

  const alsAutor = { user: autor, overrideAccess: false } as const

  console.log('\n=== Was eine Autor:in darf ===')

  let eigenerBeitragId: number | null = null
  await pruefe('Beitrag erstellen', 'erlaubt', async () => {
    const beitrag = await payload.create({
      collection: 'posts',
      data: {
        titel: 'Rechtetest: eigener Beitrag',
        inhalt: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                type: 'paragraph',
                version: 1,
                format: '',
                indent: 0,
                direction: 'ltr',
                textFormat: 0,
                children: [
                  { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: 'Test' },
                ],
              },
            ],
          },
        },
        datum: new Date().toISOString(),
        _status: 'draft',
      } as never,
      ...alsAutor,
    })
    eigenerBeitragId = beitrag.id
    return beitrag
  })

  await pruefe('eigenen Beitrag bearbeiten', 'erlaubt', () =>
    payload.update({
      collection: 'posts',
      id: eigenerBeitragId!,
      data: { titel: 'Rechtetest: eigener Beitrag (geändert)' },
      ...alsAutor,
    }),
  )

  await pruefe('Beiträge lesen', 'erlaubt', () =>
    payload.find({ collection: 'posts', limit: 1, ...alsAutor }),
  )

  await pruefe('Teams lesen', 'erlaubt', () =>
    payload.find({ collection: 'teams', limit: 1, ...alsAutor }),
  )

  console.log('\n=== Was eine Autor:in NICHT darf ===')

  // Beitrag der Administration – darf die Autor:in nicht anfassen.
  const fremderBeitrag = await payload.create({
    collection: 'posts',
    data: {
      titel: 'Rechtetest: fremder Beitrag',
      inhalt: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            {
              type: 'paragraph',
              version: 1,
              format: '',
              indent: 0,
              direction: 'ltr',
              textFormat: 0,
              children: [
                { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: 'Test' },
              ],
            },
          ],
        },
      },
      datum: new Date().toISOString(),
      autor: admin.id,
      _status: 'draft',
    } as never,
  })

  await pruefe('fremden Beitrag bearbeiten', 'verboten', () =>
    payload.update({
      collection: 'posts',
      id: fremderBeitrag.id,
      data: { titel: 'Übernommen' },
      ...alsAutor,
    }),
  )

  await pruefe('fremden Beitrag löschen', 'verboten', () =>
    payload.delete({ collection: 'posts', id: fremderBeitrag.id, ...alsAutor }),
  )

  await pruefe('Team anlegen', 'verboten', () =>
    payload.create({
      collection: 'teams',
      data: { name: 'Rechtetest-Team', kategorie: 'aktiv' } as never,
      ...alsAutor,
    }),
  )

  const { docs: teams } = await payload.find({ collection: 'teams', limit: 1 })
  await pruefe('Team ändern', 'verboten', () =>
    payload.update({
      collection: 'teams',
      id: teams[0].id,
      data: { name: 'Umbenannt' },
      ...alsAutor,
    }),
  )

  const { docs: sponsoren } = await payload.find({ collection: 'sponsoren', limit: 1 })
  await pruefe('Sponsor ändern', 'verboten', () =>
    payload.update({
      collection: 'sponsoren',
      id: sponsoren[0].id,
      data: { name: 'Umbenannt' },
      ...alsAutor,
    }),
  )

  await pruefe('Einstellungen ändern', 'verboten', () =>
    payload.updateGlobal({
      slug: 'einstellungen',
      data: { vereinsname: 'Gekapert' } as never,
      ...alsAutor,
    }),
  )

  await pruefe('Seite «Verein» ändern', 'verboten', () =>
    payload.updateGlobal({
      slug: 'verein',
      data: { gruendungsjahr: 1900 } as never,
      ...alsAutor,
    }),
  )

  await pruefe('weiteres Konto anlegen', 'verboten', () =>
    payload.create({
      collection: 'users',
      data: { email: 'test@test.ch', password: 'x', name: 'Test', role: 'autor' } as never,
      ...alsAutor,
    }),
  )

  // Sich selbst zum Admin machen: Payload wirft hier keinen Fehler, sondern
  // ignoriert das gesperrte Feld. Darum prüfen wir das Ergebnis.
  console.log('\n=== Rollenwechsel ===')
  await payload.update({
    collection: 'users',
    id: autor.id,
    data: { role: 'admin' } as never,
    ...alsAutor,
  })
  const nachher = await payload.findByID({ collection: 'users', id: autor.id })
  if (nachher.role === 'autor') {
    console.log('  OK       Autor:in bleibt Autor:in (Rollenfeld ist gesperrt)')
    bestanden++
  } else {
    console.log(`  PROBLEM  Rolle wurde auf "${nachher.role}" geändert!`)
    gescheitert++
  }

  // Testdaten aufräumen
  if (eigenerBeitragId) await payload.delete({ collection: 'posts', id: eigenerBeitragId })
  await payload.delete({ collection: 'posts', id: fremderBeitrag.id }).catch(() => {})

  console.log(`\nErgebnis: ${bestanden} in Ordnung, ${gescheitert} Probleme`)
  process.exit(gescheitert === 0 ? 0 : 1)
}

main().catch((fehler) => {
  console.error('Rechteprüfung fehlgeschlagen:', fehler)
  process.exit(1)
})
