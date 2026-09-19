import { holeTeamSpielplan } from '../lib/sihf'

async function test(name: string, ligaId: string, teamId?: string, teamName?: string) {
  const plan = await holeTeamSpielplan({ ligaId, teamId, teamName })
  console.log(`\n=== ${name} ===`)
  console.log(`Tabelle: ${plan.tabelle.length} Zeilen`)
  console.log(`Spiele total: ${plan.spiele.length}`)
  const gespielt = plan.spiele.filter(s => s.toreHeim !== null && s.toreHeim !== undefined)
  console.log(`Gespielte Spiele (mit Resultat): ${gespielt.length}`)
  if (gespielt.length > 0) {
    const letztes = gespielt[gespielt.length - 1]
    console.log(`Letztes Resultat: ${letztes.heim.name} ${letztes.toreHeim}:${letztes.toreGast} ${letztes.gast.name} (${letztes.datum})`)
  }
  const kommend = plan.spiele.find(s => s.toreHeim === null || s.toreHeim === undefined)
  if (kommend) {
    console.log(`Nächstes Spiel: ${kommend.heim.name} vs ${kommend.gast.name} (${kommend.datum})`)
  }
  if (plan.tabelle.length > 0) {
    console.log(`Tabellenführer: ${plan.tabelle[0].name} (${plan.tabelle[0].punkte} Pkt)`)
  }
}

async function main() {
  await test('1. Mannschaft', '19', '103916', 'EHC Rot-Blau Bern-Bümpliz')
  await test('Damen', '104', '105234', 'EHC Rot-Blau Bern-Bümpliz')
  await test('U14', '124', '105386', 'EHC Rot-Blau Bern-Bümpliz')
  process.exit(0)
}
main().catch(f => { console.error('FEHLER:', f?.message ?? f); process.exit(1) })
