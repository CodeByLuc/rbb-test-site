/**
 * Sucht die Liga-Nummern, in denen Rot-Blau spielt.
 *
 *   npx tsx src/seed/ligen-suchen.ts [vonNr] [bisNr]
 *
 * Die Schnittstelle von Swiss Ice Hockey kennt keine Suche nach Verein. Darum
 * werden die Ligen der Reihe nach abgefragt und jene gemeldet, in denen eine
 * Mannschaft mit «Rot-Blau» auftaucht. So lassen sich U12, U16 und Senioren
 * anbinden, ohne die Nummern zu raten.
 */

const BASIS = 'https://data.sihf.ch/statistic/api/cms/cache300'
const LIGA_GRUPPEN = '1,2,3,4,5,6,7,8,9,10,11,90'

function saisonAlias(datum = new Date()): string {
  const jahr = datum.getFullYear()
  return String(datum.getMonth() >= 6 ? jahr + 1 : jahr)
}

async function ligaPruefen(ligaId: number, saison: string) {
  const query = new URLSearchParams({
    alias: 'results',
    searchQuery: `${LIGA_GRUPPEN}//${ligaId}`,
    filterQuery: `${saison}/all/all/all`,
    orderBy: 'date',
    orderByDescending: 'false',
    take: '400',
    filterBy: 'season,league,region,phase',
    skip: '0',
    language: 'de',
  })

  try {
    const antwort = await fetch(`${BASIS}?${query}`, { headers: { Accept: 'application/json' } })
    if (!antwort.ok) return null

    const roh = (await antwort.json()) as { data?: unknown[] }
    const zeilen = roh.data ?? []
    if (zeilen.length === 0) return null

    // Jede Zeile ist ein Array; die Teamnamen stehen in verschachtelten Feldern.
    const alsText = JSON.stringify(zeilen)
    if (!/rot-blau/i.test(alsText)) return null

    // Ligabezeichnung und Gegnernamen einsammeln.
    const namen = new Set<string>()
    for (const treffer of alsText.matchAll(/"name"\s*:\s*"([^"]{3,60})"/g)) namen.add(treffer[1])

    return { ligaId, spiele: zeilen.length, namen: [...namen].slice(0, 6) }
  } catch {
    return null
  }
}

async function main() {
  const von = Number(process.argv[2] ?? 1)
  const bis = Number(process.argv[3] ?? 200)
  const saison = process.argv[4] ?? saisonAlias()

  console.log(`\nSuche Rot-Blau in den Ligen ${von} bis ${bis}, Saison ${saison}\n`)

  const treffer: NonNullable<Awaited<ReturnType<typeof ligaPruefen>>>[] = []
  const gleichzeitig = 12

  for (let start = von; start <= bis; start += gleichzeitig) {
    const teil = []
    for (let id = start; id < start + gleichzeitig && id <= bis; id++) teil.push(id)

    const ergebnisse = await Promise.all(teil.map((id) => ligaPruefen(id, saison)))
    for (const e of ergebnisse) {
      if (!e) continue
      treffer.push(e)
      console.log(`  Liga ${String(e.ligaId).padStart(3)}  ${e.spiele} Spiele`)
      for (const n of e.namen) console.log(`             ${n}`)
    }
    process.stdout.write(`\r  … bis ${Math.min(start + gleichzeitig - 1, bis)} geprüft   `)
  }

  console.log(`\n\n${treffer.length} Ligen mit Rot-Blau gefunden: ${treffer.map((t) => t.ligaId).join(', ')}\n`)
}

main().catch((f) => {
  console.error('Fehlgeschlagen:', f?.message ?? f)
  process.exit(1)
})
