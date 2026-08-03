import 'dotenv/config'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * Füllt eine leere Datenbank mit Startinhalten: Konten, Teams, Sponsoren und
 * Beispielbeiträge. Erneut ausführbar – vorhandene Einträge werden übersprungen.
 *
 *   npm run seed
 */

const richText = (bloecke: (string | { h2: string })[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: bloecke.map((block) =>
      typeof block === 'string'
        ? {
            type: 'paragraph',
            version: 1,
            format: '',
            indent: 0,
            direction: 'ltr',
            textFormat: 0,
            children: [
              { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: block },
            ],
          }
        : {
            type: 'heading',
            tag: 'h2',
            version: 1,
            format: '',
            indent: 0,
            direction: 'ltr',
            children: [
              { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text: block.h2 },
            ],
          },
    ),
  },
})

/**
 * Die SIHF-Angaben wurden am 25.07.2026 gegen data.sihf.ch geprüft (Saison 2025/26).
 *
 * Der Verein hat nur noch eine Aktivmannschaft. Hinterlegt ist die 4. Liga
 * (Liga-ID 19, Team-ID 103916). Spielt das Team in der 3. Liga, sind im
 * Redaktionsbereich unter «Teams → Spielplan (SIHF)» diese Werte einzutragen:
 * Liga-ID 18, Team-ID 102013.
 */
const teams = [
  {
    name: '1. Mannschaft',
    kategorie: 'aktiv',
    liga: '4. Liga',
    reihenfolge: 10,
    kurzbeschreibung:
      'Unsere Aktivmannschaft spielt in der 4. Liga und trägt die Vereinsfarben in der ganzen Region.',
    sihfTeamName: 'EHC Rot-Blau Bern-Bümpliz',
    sihfTeamId: '103916',
    sihfLeagueId: '19',
    tabellenUrl: 'https://www.sihf.ch/de/leagues-cup/clubs/aktivligen/#/clubs/4-league',
    trainingszeiten: [
      { tag: 'Dienstag', zeit: '20:15 – 21:45', ort: 'Eisstadion Weyermannshaus' },
      { tag: 'Donnerstag', zeit: '20:15 – 21:45', ort: 'Eisstadion Weyermannshaus' },
    ],
  },
  {
    name: 'Damen',
    kategorie: 'aktiv',
    liga: 'SWHL D',
    reihenfolge: 30,
    kurzbeschreibung:
      'Unser Damenteam spielt in der SWHL D und freut sich immer über neue Spielerinnen.',
    sihfTeamName: 'EHC Rot-Blau Bern-Bümpliz',
    sihfTeamId: '105234',
    sihfLeagueId: '104',
    tabellenUrl: 'https://www.sihf.ch/de/leagues-cup/women',
    trainingszeiten: [{ tag: 'Mittwoch', zeit: '20:00 – 21:30', ort: 'Eisstadion Weyermannshaus' }],
  },
  {
    name: 'U16',
    kategorie: 'nachwuchs',
    liga: 'U16',
    reihenfolge: 40,
    kurzbeschreibung: 'Die Ältesten im Nachwuchs auf dem Weg zu den Aktiven.',
    trainingszeiten: [{ tag: 'Montag', zeit: '18:30 – 20:00', ort: 'Eisstadion Weyermannshaus' }],
  },
  {
    name: 'U14',
    kategorie: 'nachwuchs',
    liga: 'U14-A',
    reihenfolge: 50,
    kurzbeschreibung: 'Technik, Taktik und Teamgeist – unser U14 spielt in der Kategorie U14-A.',
    sihfTeamName: 'EHC Rot-Blau Bern-Bümpliz',
    sihfTeamId: '105386',
    sihfLeagueId: '124',
    tabellenUrl: 'https://www.sihf.ch/de/leagues-cup/junioren',
    trainingszeiten: [{ tag: 'Mittwoch', zeit: '18:00 – 19:30', ort: 'Eisstadion Weyermannshaus' }],
  },
  {
    name: 'U12',
    kategorie: 'nachwuchs',
    liga: 'U12',
    reihenfolge: 60,
    kurzbeschreibung: 'Spielerisch lernen, mit viel Eiszeit für jedes Kind.',
    trainingszeiten: [{ tag: 'Freitag', zeit: '17:30 – 19:00', ort: 'Eisstadion Weyermannshaus' }],
  },
  {
    name: 'U9',
    kategorie: 'nachwuchs',
    liga: 'U9',
    reihenfolge: 70,
    kurzbeschreibung: 'Die Kleinsten im Turnierbetrieb – Freude am Spiel steht über allem.',
    trainingszeiten: [{ tag: 'Samstag', zeit: '08:00 – 09:30', ort: 'Eisstadion Weyermannshaus' }],
  },
  {
    name: 'Hockeyschule',
    kategorie: 'nachwuchs',
    reihenfolge: 80,
    kurzbeschreibung:
      'Der Einstieg ins Eishockey ab vier Jahren. Ohne Vorkenntnisse, jederzeit zum Schnuppern.',
    trainingszeiten: [{ tag: 'Samstag', zeit: '09:30 – 10:30', ort: 'Eisstadion Weyermannshaus' }],
  },
  {
    name: 'Senioren',
    kategorie: 'breitensport',
    reihenfolge: 90,
    kurzbeschreibung: 'Eishockey mit Freunden, ohne Meisterschaftsdruck – dafür mit viel Freude.',
    trainingszeiten: [{ tag: 'Sonntag', zeit: '20:30 – 22:00', ort: 'Eisstadion Weyermannshaus' }],
  },
] as const

const sponsoren = [
  { name: 'Beispiel Hauptsponsor AG', kategorie: 'hauptsponsor', reihenfolge: 10 },
  { name: 'Bümpliz Bau GmbH', kategorie: 'hauptsponsor', reihenfolge: 20 },
  { name: 'Sportgeschäft Weyermannshaus', kategorie: 'sponsor', reihenfolge: 30 },
  { name: 'Restaurant zum Eismeister', kategorie: 'sponsor', reihenfolge: 40 },
  { name: 'Garage Bern West', kategorie: 'sponsor', reihenfolge: 50 },
  { name: 'Bäckerei Stauffer', kategorie: 'sponsor', reihenfolge: 60 },
  { name: 'Familie Müller', kategorie: 'goenner', reihenfolge: 70 },
  { name: 'Quartierverein Bümpliz', kategorie: 'goenner', reihenfolge: 80 },
] as const

async function main() {
  const payload = await getPayload({ config: await configPromise })

  // --- Konten -------------------------------------------------------------
  const konten = [
    {
      email: 'admin@rot-blau.ch',
      password: 'RotBlau2026!',
      name: 'Vereinsadministration',
      role: 'admin' as const,
    },
    {
      email: 'autor@rot-blau.ch',
      password: 'RotBlau2026!',
      name: 'Beispiel Autorin',
      role: 'autor' as const,
    },
  ]

  let adminId: number | null = null
  for (const konto of konten) {
    const { docs } = await payload.find({
      collection: 'users',
      where: { email: { equals: konto.email } },
      limit: 1,
    })
    if (docs[0]) {
      console.log(`  Konto ${konto.email} existiert bereits`)
      if (konto.role === 'admin') adminId = docs[0].id
      continue
    }
    const erstellt = await payload.create({ collection: 'users', data: konto })
    if (konto.role === 'admin') adminId = erstellt.id
    console.log(`  Konto angelegt: ${konto.email} / ${konto.password}`)
  }

  // --- Teams --------------------------------------------------------------
  const teamIds = new Map<string, number>()
  for (const team of teams) {
    const { docs } = await payload.find({
      collection: 'teams',
      where: { name: { equals: team.name } },
      limit: 1,
    })
    if (docs[0]) {
      teamIds.set(team.name, docs[0].id)
      console.log(`  Team ${team.name} existiert bereits`)
      continue
    }
    const erstellt = await payload.create({ collection: 'teams', data: team as never })
    teamIds.set(team.name, erstellt.id)
    console.log(`  Team angelegt: ${team.name}`)
  }

  // --- Sponsoren ----------------------------------------------------------
  for (const sponsor of sponsoren) {
    const { docs } = await payload.find({
      collection: 'sponsoren',
      where: { name: { equals: sponsor.name } },
      limit: 1,
    })
    if (docs[0]) continue
    await payload.create({ collection: 'sponsoren', data: { ...sponsor, aktiv: true } })
    console.log(`  Sponsor angelegt: ${sponsor.name}`)
  }

  // --- Beiträge -----------------------------------------------------------
  const beitraege = [
    {
      titel: 'Rot-Blau Cup: Turnierwochenende in Bümpliz',
      auszug:
        'Zwölf Nachwuchsteams, volle Ränge und ein Turniersieg, der lange in Erinnerung bleibt – der Rot-Blau Cup war ein Fest für den ganzen Verein.',
      inhalt: richText([
        'Am vergangenen Wochenende war das Eisstadion Weyermannshaus zwei Tage lang der Mittelpunkt des Nachwuchseishockeys. Zwölf Teams aus der ganzen Region kämpften am Rot-Blau Cup um den Turniersieg.',
        { h2: 'Ein Wochenende voller Höhepunkte' },
        'Bereits die Gruppenspiele am Samstag zeigten, wie eng die Teams beieinander liegen. Entschieden wurde manche Partie erst im Penaltyschiessen – und jedes Mal war die Stimmung auf den Rängen entsprechend.',
        'Ein besonderer Dank geht an die vielen Helferinnen und Helfer. Ohne die Eltern an der Kasse, im Buffet und an der Bande wäre ein Turnier dieser Grösse nicht möglich.',
      ]),
      datum: '2026-03-15T18:00:00.000Z',
    },
    {
      titel: 'Wir suchen Helferinnen und Helfer für den Matchbetrieb',
      auszug:
        'Für Kasse, Buffet und Anschriftentisch suchen wir Menschen, die ab und zu ein paar Stunden mit anpacken.',
      inhalt: richText([
        'Ein Heimspiel läuft nur, wenn rund um das Eis alles stimmt. Für die kommende Saison suchen wir darum Verstärkung im Matchbetrieb.',
        { h2: 'Das sind die Aufgaben' },
        'An der Kasse begrüssen Sie die Zuschauerinnen und Zuschauer, im Buffet sorgen Sie für Verpflegung, und am Anschriftentisch halten Sie Tore und Strafen fest. Alles wird vorher gemeinsam angeschaut – Vorkenntnisse braucht es nicht.',
        'Wer sich ein paar Einsätze pro Saison vorstellen kann, meldet sich am besten direkt beim Vorstand.',
      ]),
      datum: '2026-04-02T09:30:00.000Z',
    },
    {
      titel: 'Sommertraining startet im Mai',
      auszug:
        'Ab Mai wird ausserhalb des Eises trainiert: Kraft, Koordination und Schusstechnik stehen auf dem Programm.',
      inhalt: richText([
        'Nach der Saison ist vor der Saison. Ab Mai startet unser Sommertraining, offen für alle Aktiven und den älteren Nachwuchs.',
        'Im Zentrum stehen Athletik, Koordination und – im Shootingtraining – die Schusstechnik. Die genauen Termine stehen auf der Seite «Eishockey».',
      ]),
      datum: '2026-04-20T07:00:00.000Z',
      team: '1. Mannschaft',
    },
  ]

  for (const beitrag of beitraege) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { titel: { equals: beitrag.titel } },
      limit: 1,
    })
    if (docs[0]) continue

    const { team, ...rest } = beitrag
    await payload.create({
      collection: 'posts',
      data: {
        ...rest,
        ...(team && teamIds.has(team) ? { team: teamIds.get(team) } : {}),
        ...(adminId ? { autor: adminId } : {}),
        typ: 'news',
        _status: 'published',
      } as never,
    })
    console.log(`  Beitrag angelegt: ${beitrag.titel}`)
  }

  // --- Seiteninhalte ------------------------------------------------------
  await payload.updateGlobal({
    slug: 'einstellungen',
    data: {
      vereinsname: 'EHC Rot-Blau Bern-Bümpliz',
      claim: 'Eishockey aus dem Westen von Bern – für alle, die aufs Eis wollen.',
      adresse: 'EHC Rot-Blau Bern-Bümpliz\nPostfach\n3018 Bern',
      email: 'info@rot-blau.ch',
      eishalle: 'Eisstadion Weyermannshaus, Bern',
      sozialeMedien: [
        { plattform: 'instagram', url: 'https://www.instagram.com/' },
        { plattform: 'facebook', url: 'https://www.facebook.com/' },
      ],
      sponsoringText: richText([
        'Als Partner des EHC Rot-Blau erreichen Sie über 200 Aktive und ihre Familien im Westen von Bern – auf dem Eis, auf dieser Website und an unseren Anlässen.',
        'Wir stellen gerne ein Paket zusammen, das zu Ihrem Unternehmen passt: von der Bandenwerbung über das Trikot bis zur Partnerschaft für ein Nachwuchsturnier.',
      ]),
      sponsoringKontakt: 'Sponsoring-Verantwortliche, sponsoring@rot-blau.ch',
    } as never,
  })
  console.log('  Einstellungen gespeichert')

  await payload.updateGlobal({
    slug: 'eishockey',
    data: {
      einleitung:
        'Eishockey ist schnell, körperbetont und einfacher zu verstehen, als es aussieht. Hier die wichtigsten Regeln und unsere Trainingsangebote.',
      regeln: richText([
        'Gespielt wird dreimal 20 Minuten mit je fünf Feldspielern und einem Torhüter pro Team. Gewertet wird jedes Tor, das vollständig die Torlinie überquert.',
        { h2: 'Offside und Icing' },
        'Offside bedeutet: kein Angreifer darf die blaue Linie vor dem Puck überqueren. Icing wird gepfiffen, wenn ein Team den Puck von der eigenen Hälfte über die gegnerische Torlinie schlägt, ohne dass ihn jemand berührt.',
        { h2: 'Strafen' },
        'Die kleine Strafe dauert zwei Minuten, das fehlbare Team spielt in Unterzahl. Für schwerere Vergehen gibt es fünf Minuten oder eine Spieldauerstrafe.',
        { h2: 'Verlängerung und Penaltyschiessen' },
        'Steht es nach 60 Minuten unentschieden, folgt eine Verlängerung in Unterzahl. Fällt auch dort kein Tor, entscheidet das Penaltyschiessen.',
      ]),
      regelwerkLink: 'https://www.iihf.com/en/statichub/rulebook',
      angebote: [
        {
          titel: 'Sommertraining',
          beschreibung:
            'Athletik, Koordination und Ausdauer als Grundlage für die neue Saison. Für Aktive und den älteren Nachwuchs.',
          termine: 'Mai bis August, jeweils Dienstag 19:00 – 20:30',
          ort: 'Sportplatz Weyermannshaus',
          kontakt: 'training@rot-blau.ch',
        },
        {
          titel: 'Shootingtraining',
          beschreibung:
            'Schusstechnik, Handgelenke und Präzision – auf der Schussanlage, unabhängig vom Eis.',
          termine: 'Ganzjährig, Donnerstag 18:30 – 20:00',
          ort: 'Trainingshalle Bümpliz',
          kontakt: 'training@rot-blau.ch',
        },
        {
          titel: 'Goalie-Training',
          beschreibung:
            'Spezialtraining für Torhüterinnen und Torhüter aller Teams: Stellungsspiel, Beinarbeit und Puckkontrolle.',
          termine: 'Mittwoch 17:00 – 18:00',
          ort: 'Eisstadion Weyermannshaus',
          kontakt: 'goalies@rot-blau.ch',
        },
      ],
    } as never,
  })
  console.log('  Seite «Eishockey» gespeichert')

  await payload.updateGlobal({
    slug: 'verein',
    data: {
      gruendungsjahr: 1949,
      geschichte: richText([
        'Der EHC Rot-Blau Bern-Bümpliz ist im Westen der Stadt Bern zu Hause. Aus einer Gruppe von Quartierfreunden, die auf Natureis spielten, wurde über die Jahrzehnte ein Verein mit mehreren Mannschaften und einer eigenen Hockeyschule.',
        { h2: 'Rot und Blau' },
        'Die Vereinsfarben stehen seit den Anfängen für das, was den Klub ausmacht: Zusammenhalt auf dem Eis und ein offenes Haus für alle, die Eishockey spielen wollen.',
        'Diese Geschichte ist ein Platzhalter. Sie lässt sich im Redaktionsbereich unter «Seite Verein» durch die echte Vereinsgeschichte ersetzen.',
      ]),
      aktuell: richText([
        'Heute betreibt der Verein zwei Aktivmannschaften, ein Damenteam, mehrere Nachwuchsteams, eine Hockeyschule und eine Seniorengruppe. Trainiert und gespielt wird im Eisstadion Weyermannshaus.',
        'Getragen wird der Betrieb von Freiwilligen: Trainerinnen und Trainer, Betreuende, Eltern und Helferinnen und Helfer im Matchbetrieb.',
      ]),
      vorstand: [
        { name: 'Vorname Name', funktion: 'Präsident', email: 'praesident@rot-blau.ch' },
        { name: 'Vorname Name', funktion: 'Kassier', email: 'kasse@rot-blau.ch' },
        { name: 'Vorname Name', funktion: 'Sportchef', email: 'sport@rot-blau.ch' },
        { name: 'Vorname Name', funktion: 'Nachwuchsverantwortliche', email: 'nachwuchs@rot-blau.ch' },
      ],
      mitgliedschaft: richText([
        'Mitmachen ist einfach: Komm zu einem Training vorbei und schau dir alles an. Ein Schnuppertraining ist immer kostenlos und unverbindlich.',
        'Für Kinder in der Hockeyschule stellen wir Leihmaterial zur Verfügung. Wer danach dabeibleiben möchte, füllt das Anmeldeformular aus.',
      ]),
    } as never,
  })
  console.log('  Seite «Verein» gespeichert')

  console.log('\nFertig. Login unter /admin mit admin@rot-blau.ch / RotBlau2026!')
  process.exit(0)
}

main().catch((fehler) => {
  console.error('Seed fehlgeschlagen:', fehler)
  process.exit(1)
})
