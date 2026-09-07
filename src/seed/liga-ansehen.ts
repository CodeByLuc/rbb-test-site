/**
 * Zeigt, welche Spiele Rot-Blau in einer Liga hat.
 *
 *   npx tsx src/seed/liga-ansehen.ts <ligaId> [saison]
 */
import { holeLigaSpiele } from '../lib/sihf'

async function main() {
  const ligaId = process.argv[2]
  const saison = process.argv[3]
  if (!ligaId) {
    console.error('Liga-Nummer angeben.')
    process.exit(1)
  }

  const spiele = await holeLigaSpiele({ ligaId, saison, revalidate: 0 })
  const unsere = spiele.filter(
    (s) => /rot-blau/i.test(s.heim.name) || /rot-blau/i.test(s.gast.name),
  )

  console.log(`\nLiga ${ligaId}, Saison ${saison ?? 'aktuell'}: ${spiele.length} Spiele, davon ${unsere.length} mit Rot-Blau\n`)

  const gegner = new Set<string>()
  for (const s of spiele) {
    gegner.add(s.heim.name)
    gegner.add(s.gast.name)
  }
  console.log('  Teams in der Liga:')
  for (const g of [...gegner].sort()) console.log(`    ${g}`)

  console.log('\n  Erste Spiele von Rot-Blau:')
  for (const s of unsere.slice(0, 6)) {
    console.log(
      `    ${s.wochentag} ${s.datum}  ${s.heim.name} ${s.toreHeim ?? '-'}:${s.toreGast ?? '-'} ${s.gast.name}`,
    )
  }
  console.log('')
}

main().catch((f) => { console.error(f?.message ?? f); process.exit(1) })
