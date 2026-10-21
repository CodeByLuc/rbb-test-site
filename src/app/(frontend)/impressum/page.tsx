import type { Metadata } from 'next'
import Link from 'next/link'

import { holeEinstellungen } from '../../../lib/daten'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Impressum & Datenschutz',
  description: 'Impressum und Datenschutzerklärung des EHC Rot-Blau Bern-Bümpliz.',
}

export default async function ImpressumSeite() {
  const einstellungen = await holeEinstellungen()

  return (
    <div className="inhalt space-y-10 py-14">
      <section className="kachel bg-white p-6 shadow-sm sm:p-8">
        <h1 className="abschnittstitel mb-4 text-4xl text-nacht sm:text-6xl">Impressum</h1>
        <div className="fliesstext">
          <p>
            <strong>Eishockeyclub Rot-Blau Bern-Bümpliz</strong>
            <br />
            Postfach 691
            <br />
            3018 Bern
          </p>
          <p>
            Website:{' '}
            <a href="https://www.rot-blau.ch" target="_blank" rel="noopener noreferrer">
              www.rot-blau.ch
            </a>
            {einstellungen.email && (
              <>
                <br />
                E-Mail: <a href={`mailto:${einstellungen.email}`}>{einstellungen.email}</a>
              </>
            )}
            <br />
            MwSt.-Nr.: CHE-112.689.207
          </p>
          <p>
            Die Ansprechpersonen des Vereins finden sich auf der Seite{' '}
            <Link href="/vorstand">Vorstand</Link>.
          </p>
        </div>
      </section>

      <section id="datenschutz" className="kachel bg-white p-6 shadow-sm sm:p-8">
        <h2 className="abschnittstitel mb-4 text-4xl text-nacht sm:text-6xl">Datenschutzerklärung</h2>
        <div className="fliesstext">
          <p>
            Die vorliegende Datenschutzerklärung orientiert über die Bearbeitung von Personendaten
            durch den EHC Rot-Blau Bern-Bümpliz.
          </p>

          <h3>1. Verantwortlicher für die Datenbearbeitung</h3>
          <p>
            Verantwortlich für die Datenbearbeitung ist der EHC Rot-Blau Bern-Bümpliz, ein Verein
            gemäss Artikel 60 ff. des Schweizerischen Zivilgesetzbuches mit Sitz in Bern. Anliegen in
            Zusammenhang mit dem Datenschutz sind zu richten an: EHC Rot-Blau Bern-Bümpliz, Postfach
            691, 3018 Bern.
          </p>

          <h3>2. Zwecke der Datenbearbeitung</h3>
          <p>
            Der EHC Rot-Blau Bern-Bümpliz bearbeitet Personendaten im Rahmen der Ausübung seines
            statutarischen Zwecks, das heisst insbesondere zur Vereinsadministration, zur
            Organisation des Trainings- und Spielbetriebs und zur Mittelbeschaffung. Darunter fallen
            insbesondere:
          </p>
          <ul>
            <li>
              Führen eines Verzeichnisses der Mitglieder, ehemaligen Mitglieder, Sponsoren, Gönner
              und Sympathisanten des Vereins etc.
            </li>
            <li>Information der Mitglieder, Sponsoren, Gönner und Sympathisanten des Vereins</li>
            <li>Erstellung, Druck und Vertrieb des Cluborgans («Bully»)</li>
            <li>
              Vertragsanbahnung und Durchführung von Verträgen, welche in Zusammenhang mit der
              Vereinstätigkeit stehen
            </li>
            <li>Buchführung, Rechnungsstellung, Debitoren- und Kreditorenmanagement etc.</li>
            <li>
              Betrieb einer Website des Vereins und Pflege von Social Media-Accounts des Vereins
              (beispielsweise Instagram)
            </li>
            <li>
              Zusammenarbeit mit Sportverbänden (insbesondere Swiss Ice Hockey [SIHF /
              RegioLeague], Kantonal Bernischer Eishockey-Verband [KBEHV])
            </li>
            <li>
              Zusammenarbeit mit Einheiten der zentralen und dezentralen Verwaltung von Bund,
              Kantonen und Gemeinden (insbesondere Bundesamt für Sport [BASPO], Jugend + Sport
              [J+S], Sportfonds des Kantons Bern, Sportamt der Stadt Bern)
            </li>
            <li>Gewinnung von respektive Zusammenarbeit mit Sponsoren</li>
            <li>Organisation von Vereinsanlässen</li>
            <li>
              Durchführung von respektive Teilnahme an Förderungs- und Präventionsprogrammen
              Dritter (beispielsweise Sportverbände, Sportamt der Stadt Bern, J+S etc.)
            </li>
          </ul>

          <h3>3. Personendaten</h3>
          <p>
            Im Rahmen der vorstehend erläuterten Zwecke bearbeitet der EHC Rot-Blau Bern-Bümpliz
            insbesondere die folgenden Personendaten:
          </p>
          <ul>
            <li>
              Namen (bei Minderjährigen auch der gesetzlichen Vertreter) respektive Firmen
            </li>
            <li>
              Kontaktdaten (Postadressen, E-Mail-Adressen, Telefonnummern; bei Minderjährigen auch
              der gesetzlichen Vertreter)
            </li>
            <li>Angaben zu Geschlecht, Nationalität und Alter</li>
            <li>
              Angaben betreffend bestehende oder frühere Mitgliedschaften in anderen
              Eishockeyvereinen
            </li>
            <li>
              Angaben zu Beruf und/oder Ausbildung, soweit dies für den Trainings- und Spielbetrieb,
              die Rechnungsstellung oder dergleichen erforderlich ist
            </li>
            <li>
              Lizenznummern und vergleichbare Angaben, wie sie in den Datensammlungen von Swiss Ice
              Hockey und/oder J+S und/oder des KBEHV hinterlegt sind
            </li>
            <li>
              Mannschaftsbilder, Spielerporträts sowie Bilder des Trainings- und Spielbetriebs sowie
              von Vereinsanlässen für die Verwendung auf der Website und/oder im Cluborgan
              («Bully») und/oder auf den Social Media-Accounts des Vereins (beispielsweise
              Instagram)
            </li>
          </ul>
          <p>Der EHC Rot-Blau Bern-Bümpliz beschafft diese Personendaten:</p>
          <ul>
            <li>aufgrund der Angaben durch die betroffenen Personen selber</li>
            <li>aus den Datensammlungen von Swiss Ice Hockey</li>
            <li>aus den Datensammlungen von J+S</li>
            <li>aus den Datensammlungen des KBEHV</li>
            <li>
              aus öffentlich einsehbaren Registern und Datenbanken (beispielsweise Zentraler
              Firmenindex Zefix, www.local.ch, öffentlich einsehbare Social Media-Accounts etc.)
            </li>
          </ul>

          <h3>4. Grundlagen der Datenbearbeitung</h3>
          <p>
            Der EHC Rot-Blau Bern-Bümpliz bearbeitet Personendaten gestützt auf die Einwilligung der
            betroffenen Person, aufgrund überwiegenden Interesses oder aufgrund gesetzlicher
            Verpflichtung.
          </p>

          <h3>5. Bekanntgabe</h3>
          <p>
            Die gestützt auf die Grundlagen der Datenbearbeitung (vorne, Ziffer 4) erhobenen
            Personendaten (vorne, Ziffer 3) werden einzig im Rahmen des Bearbeitungszwecks (vorne,
            Ziffer 2) an Dritte weitergegeben. Diese Dritte können sein:
          </p>
          <ul>
            <li>
              Andere Vereinsmitglieder, Vereinsfunktionäre und Helfer (beispielsweise Bekanntgabe an
              Trainer zwecks Organisation des Trainings- und Spielbetriebs)
            </li>
            <li>
              Sportverbände (insbesondere Swiss Ice Hockey [SIHF / RegioLeague], Kantonal Bernischer
              Eishockey-Verband [KBEHV])
            </li>
            <li>
              Einheiten der zentralen und dezentralen Verwaltung von Bund, Kantonen und Gemeinden
              (insbesondere Bundesamt für Sport [BASPO], Jugend + Sport [J+S], Sportfonds des
              Kantons Bern, Sportamt der Stadt Bern)
            </li>
            <li>Sponsoren mit laufenden Sponsoringverträgen</li>
            <li>
              Organisatoren von Anlässen, in deren Rahmen der EHC Rot-Blau Bern-Bümpliz Mitglieder
              als Helfer und dergleichen einsetzt
            </li>
            <li>
              Anbieter respektive Betreiber von Software, Websites und dergleichen, welche der EHC
              Rot-Blau Bern-Bümpliz zur Vereinsadministration einsetzt (beispielsweise reeweb ag als
              Betreiberin von ClubDesk, TWINT AG als Betreiberin des Zahlungssystems TWINT)
            </li>
          </ul>

          <h3>6. Dauer der Aufbewahrung von Personendaten</h3>
          <p>
            Die gestützt auf die Grundlagen der Datenbearbeitung (vorne, Ziffer 4) erhobenen
            Personendaten (vorne, Ziffer 3) werden solange aufbewahrt, wie es für die mit der
            Bearbeitung verfolgten Zwecke (vorne, Ziffer 2) oder im Rahmen berechtigter
            Vereinsinteressen erforderlich ist sowie darüber hinaus gemäss allfälligen gesetzlichen
            Aufbewahrungs- und Dokumentationspflichten.
          </p>

          <h3>7. Rechte der von der Datenbearbeitung betroffenen Personen</h3>
          <p>
            Personen, welche von der Datenbearbeitung durch den EHC Rot-Blau Bern-Bümpliz betroffen
            sind, können gegenüber dem EHC Rot-Blau Bern-Bümpliz die ihnen aufgrund des
            Bundesgesetzes über den Datenschutz (DSG) zustehenden Rechte geltend machen, namentlich:
          </p>
          <ul>
            <li>
              <strong>Auskunft:</strong> Betroffene Personen können Auskunft darüber verlangen, ob
              und falls ja, welche Personendaten über sie erhoben werden.
            </li>
            <li>
              <strong>Berichtigung:</strong> Betroffene Personen können verlangen, dass falsche
              Personendaten berichtigt werden.
            </li>
            <li>
              <strong>Löschung:</strong> Betroffene Personen können verlangen, dass Personendaten,
              für deren Erhebung keine rechtliche Grundlage (vorne, Ziffer 4) besteht, gelöscht
              werden.
            </li>
            <li>
              <strong>Bekanntgabe an Dritte:</strong> Betroffene Personen können verlangen, dass
              bestimmte Personendaten Dritten nicht bekanntgegeben werden. Vorbehalten bleiben
              gesetzliche Verpflichtungen des Vereins zur Bekanntgabe, beispielsweise im Rahmen
              eines Strafverfahrens.
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}
