import { holeLigaSpiele, saisonAlias } from '../lib/sihf'

async function main() {
  console.log('Aktuelle Saison-Alias:', saisonAlias())
  
  const spiele = await holeLigaSpiele({ ligaId: '19' })
  console.log(`Liga 19 (1. Mannschaft): ${spiele.length} Spiele total`)
  if (spiele.length > 0) {
    console.log('Erstes Spiel:', JSON.stringify(spiele[0], null, 2))
  }
  process.exit(0)
}
main().catch(f => { console.error('FEHLER:', f); process.exit(1) })
