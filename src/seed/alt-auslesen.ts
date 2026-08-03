import fs from 'fs'
import path from 'path'

/**
 * Liest die gespeicherten Seiten der alten ClubDesk-Website aus.
 *
 * ClubDesk baut jede Seite aus Blöcken mit der Klasse «cd-block-content».
 * Beiträge bestehen aus h1-Titel, Fliesstext und Bildern hinter signierten
 * Adressen («fileservlet?type=image&id=…»). Personen stehen in Kacheln mit der
 * Klasse «cd-tile-v-box», gruppiert unter einer h3-Überschrift (Spieler,
 * Goalie, Betreuer).
 */

const BASIS = 'https://www.rot-blau.ch/'

export type AlterBeitrag = {
  titel: string
  datum?: string
  absaetze: string[]
  bilder: string[]
  /** Verlinkte fremde Seiten, z. B. die eines Sponsors. */
  verweise: string[]
}

export type AltePerson = {
  name: string
  nummer?: number
  gruppe: string
  angaben: Record<string, string>
  /** Adresse des Kontaktfotos, falls kein Platzhalter. */
  foto?: string
}

export type AlteSeite = {
  quelle: string
  titel?: string
  beitraege: AlterBeitrag[]
  personen: AltePerson[]
  /** Liga aus dem Seitentitel, z. B. «3. Liga». */
  liga?: string
  /**
   * Alle Absätze der Seite, auch aus Blöcken ohne Überschrift. Nötig für Seiten
   * wie «Geschichte», deren Text keinen eigenen Titel trägt.
   */
  absaetze: string[]
}

/** &uuml; und Konsorten zurück in Buchstaben. */
export function entwirren(text: string): string {
  const namen: Record<string, string> = {
    auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
    szlig: 'ß', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç',
    nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    ndash: '–', mdash: '—', laquo: '«', raquo: '»', hellip: '…',
    rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', shy: '',
  }
  return text
    .replace(/&#(\d+);/g, (_, z) => String.fromCodePoint(Number(z)))
    .replace(/&#x([0-9a-f]+);/gi, (_, z) => String.fromCodePoint(parseInt(z, 16)))
    .replace(/&([a-zA-Z]+);/g, (ganz, name) => namen[name] ?? ganz)
}

/** Entfernt Auszeichnungen und normalisiert Leerraum. */
function nurText(html: string): string {
  return entwirren(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const monate: Record<string, number> = {
  januar: 1, februar: 2, märz: 3, maerz: 3, april: 4, mai: 5, juni: 6,
  juli: 7, august: 8, september: 9, oktober: 10, november: 11, dezember: 12,
}

/** Datumsangaben wie «Mittwoch, 18. Februar 2026» oder «18.02.2026». */
export function findeDatum(text: string): string | undefined {
  const lang = text.match(/(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\s+(\d{4})/)
  if (lang) {
    const monat = monate[lang[2].toLowerCase()]
    if (monat) {
      return `${lang[3]}-${String(monat).padStart(2, '0')}-${String(Number(lang[1])).padStart(2, '0')}`
    }
  }
  const kurz = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (kurz) return `${kurz[3]}-${kurz[2].padStart(2, '0')}-${kurz[1].padStart(2, '0')}`
  return undefined
}

/** Schneidet den Rest des öffnenden Tags weg, damit keine Attribute im Text landen. */
function abTagEnde(teil: string): string {
  const ende = teil.indexOf('>')
  return ende >= 0 ? teil.slice(ende + 1) : teil
}

/**
 * Personen aus den Kontaktlisten.
 *
 * ClubDesk kennt zwei Darstellungen: Kacheln («cd-tile-v-box», mit Foto und
 * Angaben wie der Rückennummer) und eine Tabelle («cd-contactlist-table», Name
 * in der ersten Spalte, Nummer in der zweiten). Die Gruppenüberschrift ist je
 * nach Seite h2 oder h3.
 */
function lesePersonen(rumpf: string): AltePerson[] {
  const personen: AltePerson[] = []

  // Manche Seiten (U16) listen Kacheln ohne Gruppenüberschrift – dann steht der
  // erste Abschnitt vor jedem h2/h3 und würde sonst übersehen.
  const abschnitte = rumpf.split(/<h[23][^>]*>/i)
  const ohneUeberschrift = abschnitte[0].includes('cd-tile-v-box')
    ? [`Spieler</h3>${abschnitte[0]}`]
    : []

  for (const gruppe of [...ohneUeberschrift, ...abschnitte.slice(1)]) {
    const ende = gruppe.search(/<\/h[23]>/i)
    if (ende < 0) continue
    const gruppenName = nurText(gruppe.slice(0, ende))
    if (!gruppenName) continue
    // Nur bis zur nächsten Gruppe schauen.
    const rest = gruppe.slice(ende).split(/<h[23][^>]*>/i)[0]

    // Darstellung 1: Kacheln
    for (const kachel of rest.split(/<div[^>]*class="cd-tile-v-box[^"]*"/i).slice(1)) {
      const inhalt = abTagEnde(kachel)
      const name = nurText(
        inhalt.match(/<div[^>]*class="cd-tile-v-main-heading"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? '',
      )
      if (!name) continue

      const angaben: Record<string, string> = {}
      for (const paar of inhalt.matchAll(
        /<div[^>]*class="cd-tile-v-detail-label"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="cd-tile-v-detail-value"[^>]*>([\s\S]*?)<\/div>/gi,
      )) {
        const schluessel = nurText(paar[1])
        const wert = nurText(paar[2])
        if (schluessel && wert) angaben[schluessel] = wert
      }

      // Kontaktfotos sind teils echte Bilder, teils Platzhalter.
      const foto = inhalt.match(/<img[^>]+src="([^"]*fileservlet[^"]*)"/i)?.[1]

      const nummer = Number(angaben['Rückennummer'])
      personen.push({
        name,
        nummer: Number.isFinite(nummer) ? nummer : undefined,
        gruppe: gruppenName,
        angaben,
        foto: foto ? BASIS + entwirren(foto) : undefined,
      })
    }

    // Darstellung 2: Tabelle
    const tabelle = rest.match(
      /<div[^>]*class="cd-contactlist-table[^"]*"[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i,
    )
    if (tabelle) {
      for (const zeile of tabelle[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
        const zellen = [...zeile[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((z) =>
          nurText(z[1]),
        )
        const name = zellen[0]
        if (!name || /^(name|team)$/i.test(name)) continue
        const nummer = Number(zellen[1])
        personen.push({
          name,
          nummer: Number.isFinite(nummer) && zellen[1] ? nummer : undefined,
          gruppe: gruppenName,
          angaben: {},
        })
      }
    }
  }

  return personen
}

/** Zerlegt eine gespeicherte Seite in Beiträge und Personen. */
export function leseSeite(dateipfad: string): AlteSeite {
  const html = fs.readFileSync(dateipfad, 'utf8')

  // Navigation und Fusszeile stören – nur den Inhaltsbereich betrachten.
  const start = html.indexOf('id="cd-page-content"')
  const rumpf = start > 0 ? html.slice(start) : html

  const seitentitel = nurText(rumpf.slice(0, 400).match(/^[^<]*/)?.[0] ?? '')
  const liga = seitentitel.match(/\((\d\.\s*Liga)\)/)?.[1]

  const beitraege: AlterBeitrag[] = []
  const alleAbsaetze: string[] = []

  for (const teil of rumpf.split(/<div[^>]*class="cd-block-content"/i).slice(1)) {
    const inhalt = abTagEnde(teil)

    // Text jedes Blocks sammeln, unabhängig von einer Überschrift.
    const blockText = nurText(inhalt.replace(/<div[^>]*class="cd-group-contact-list[\s\S]*$/i, ''))
    for (const absatz of blockText.split(/\n\n+/)) {
      const sauber = absatz.replace(/\s+/g, ' ').trim()
      if (sauber.length > 40 && !/Powered by ClubDesk|ClubDesk Login/i.test(sauber)) {
        alleAbsaetze.push(sauber)
      }
    }

    const titelTreffer = inhalt.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    if (!titelTreffer) continue
    const titel = nurText(titelTreffer[1])
    if (!titel) continue

    // Kontaktkacheln gehören nicht in den Fliesstext.
    const ohneKacheln = inhalt.replace(/<div[^>]*class="cd-group-contact-list[\s\S]*$/i, '')
    const text = nurText(ohneKacheln).replace(titel, '').trim()

    const bilder = [...inhalt.matchAll(/<img[^>]+src="([^"]+)"/gi)]
      .map((m) => entwirren(m[1]))
      .filter((quelle) => quelle.includes('fileservlet'))
      .map((quelle) => (quelle.startsWith('http') ? quelle : BASIS + quelle))

    // Verweise auf fremde Seiten – manche Beiträge bestehen nur daraus.
    const verweise = [...inhalt.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"/gi)]
      .map((m) => entwirren(m[1]))
      .filter((z) => !z.includes('rot-blau.ch') && !z.includes('clubdesk'))

    beitraege.push({
      titel,
      datum: findeDatum(text),
      absaetze: text
        .split(/\n\n+/)
        .map((a) => a.replace(/\s+/g, ' ').trim())
        .filter((a) => a.length > 25),
      bilder: [...new Set(bilder)],
      verweise: [...new Set(verweise)],
    })
  }

  return {
    quelle: path.basename(dateipfad, '.html'),
    titel: seitentitel || undefined,
    liga,
    beitraege,
    personen: lesePersonen(rumpf),
    absaetze: [...new Set(alleAbsaetze)],
  }
}

// Direkt aufgerufen: Übersicht ausgeben.
if (process.argv[1]?.includes('alt-auslesen')) {
  const ordner = process.argv[2]
  if (!ordner) {
    console.error('Ordner mit den gespeicherten Seiten angeben.')
    process.exit(1)
  }

  for (const datei of fs.readdirSync(ordner).filter((d) => d.endsWith('.html'))) {
    const seite = leseSeite(path.join(ordner, datei))
    if (seite.beitraege.length === 0 && seite.personen.length === 0) continue

    console.log(`\n=== ${seite.quelle}${seite.liga ? `  (${seite.liga})` : ''}`)
    for (const b of seite.beitraege) {
      console.log(
        `  Beitrag: ${b.titel.slice(0, 62)}${b.datum ? `  [${b.datum}]` : ''}` +
          `  ${b.absaetze.length} Absätze, ${b.bilder.length} Bilder`,
      )
      if (b.absaetze[0]) console.log(`     ${b.absaetze[0].slice(0, 95)}…`)
    }
    const nachGruppe = new Map<string, AltePerson[]>()
    for (const p of seite.personen) {
      if (!nachGruppe.has(p.gruppe)) nachGruppe.set(p.gruppe, [])
      nachGruppe.get(p.gruppe)!.push(p)
    }
    for (const [gruppe, leute] of nachGruppe) {
      console.log(`  ${gruppe} (${leute.length}):`)
      console.log(
        '     ' +
          leute.map((p) => `${p.name}${p.nummer != null ? ` #${p.nummer}` : ''}`).join(', '),
      )
    }
  }
}
