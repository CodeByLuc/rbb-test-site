# Website EHC Rot-Blau Bern-Bümpliz

Neue Vereinswebsite mit eingebautem Redaktionssystem. Vereinsmitglieder schreiben
Beiträge selbst, die Resultate aller Teams kommen automatisch von Swiss Ice Hockey.

## Erste Schritte

```bash
npm install
npm run seed
npm run dev
```

Die Website läuft dann auf http://localhost:3000, der Redaktionsbereich auf
http://localhost:3000/admin.

**Zugänge nach dem Seed** (bitte Passwörter nach dem ersten Login ändern):

| Konto               | Passwort      | Rolle                          |
| ------------------- | ------------- | ------------------------------ |
| admin@rot-blau.ch   | RotBlau2026!  | Administration – darf alles    |
| autor@rot-blau.ch   | RotBlau2026!  | Autor:in – darf Beiträge       |

## Wer darf was

Es gibt bewusst nur zwei Rollen:

- **Autor:in** – schreibt Beiträge und lädt Bilder hoch. Kann eigene Beiträge
  bearbeiten und löschen, aber nichts anderes. Teams, Sponsoren, Seiteninhalte und
  Konten sind für sie gesperrt. So kann beim Schreiben nichts durcheinandergeraten.
- **Administration** – darf alles, inklusive Teams, Sponsoren, Seiteninhalte und
  neue Konten.

Geprüft wird das automatisch:

```bash
npx tsx src/seed/rechte-pruefen.ts
```

## Einen Beitrag schreiben

1. Auf http://localhost:3000/admin einloggen
2. Links auf **Beiträge → Neu**
3. Titel eintragen, Titelbild hochladen (einfach ins Feld ziehen), Text schreiben
4. Oben rechts auf **Veröffentlichen**

Die Adresse des Beitrags entsteht automatisch aus dem Titel – darum muss sich
niemand kümmern. Wer noch nicht fertig ist, speichert stattdessen einen Entwurf;
der ist auf der Website nicht sichtbar.

Der Editor enthält absichtlich nur wenige Werkzeuge: Zwischentitel, fett, kursiv,
unterstrichen, Links, Listen, Zitat, Bild und Trennlinie. Die Werkzeugleiste ist
immer sichtbar.

## Resultate von Swiss Ice Hockey

Die Website holt Spielpläne und Resultate direkt von `data.sihf.ch` – ohne Login
und ohne Vertrag.

**Wo das erscheint**

- Startseite: Kachel mit dem letzten Resultat jedes Teams
- Teamseite: letztes Resultat gross, dazu der komplette Spielplan mit
  Drittelsergebnissen und ein Link zur Tabelle auf sihf.ch
- Jeden Montag: automatisch ein Beitrag «Resultate der Woche» mit allen Spielen

**Welche Teams angebunden sind** (geprüft am 25.07.2026, Saison 2025/26):

| Team          | Liga    | Liga-ID | Team-ID |
| ------------- | ------- | ------- | ------- |
| 1. Mannschaft | 3. Liga | 18      | 102013  |
| 2. Mannschaft | 4. Liga | 19      | 103916  |
| Damen         | SWHL D  | 104     | 105234  |
| U14           | U14-A   | 124     | 105386  |

U16, U12, U9, Hockeyschule und Senioren spielen keine Meisterschaft, die bei der
SIHF veröffentlicht wird – für sie zeigt die Website nur Trainingszeiten.

**Anbindung ändern:** Im Redaktionsbereich unter **Teams → Team → Spielplan (SIHF)**.
Dort stehen Liga-ID, Team-ID und der Link zur Tabelle. Ob die 1. oder die
2. Mannschaft in der 3. Liga spielt, lässt sich dort korrigieren.

**Liga-IDs zum Nachschlagen:** 1 = NL, 2 = SL, 3 = 1. Liga, 10 = 2. Liga,
18 = 3. Liga, 19 = 4. Liga, 43/101/104 = SWHL B/C/D, 119–121 = U16 Elit/Top/A,
122–124 = U14 Elit/Top/A, 125 = U12, 33–37 = Senioren A–D.

**Die Team-ID einer neuen Mannschaft finden:** Diese Adresse im Browser öffnen
(Liga-ID und Saison anpassen, Saison = Endjahr, 2025/26 also `2026`) und nach
«Rot-Blau» suchen:

```
https://data.sihf.ch/statistic/api/cms/cache300?alias=results&searchQuery=1,2,4,8,10,11,12//19&filterQuery=2026/all/all/all&orderBy=date&orderByDescending=false&take=900&filterBy=season,league,region,phase&skip=0&language=de
```

Wichtig: `date` darf in `filterBy` **nicht** vorkommen – sonst liefert die
Schnittstelle nur die Spiele eines einzelnen Tages statt der ganzen Saison.

## Montags-Beitrag

Auf Vercel läuft der Job automatisch jeden Montag um 08:00 (`vercel.json`).

Von Hand auslösen oder testen:

```bash
curl "http://localhost:3000/api/wochenresultate?secret=DEIN_CRON_SECRET&vorschau=1"
```

- `vorschau=1` zeigt nur, was erstellt würde, ohne zu speichern
- `stichtag=2026-02-02` rechnet die Woche vor diesem Datum – gut zum Testen
  ausserhalb der Saison
- ohne `vorschau` wird der Beitrag erstellt und veröffentlicht

Läuft der Job zweimal für dieselbe Woche, wird der bestehende Beitrag
aktualisiert statt ein zweiter angelegt.

## Seiteninhalte pflegen

Texte, die keine Beiträge sind, stehen im Redaktionsbereich unter
**Seiteninhalte**:

- **Seite «Eishockey»** – Regeln, Sommertraining, Shootingtraining, Goalie-Training
- **Seite «Verein»** – Geschichte, Aktuelles, Vorstand, Mitgliedschaft
- **Einstellungen** – Logo, Kontakt, soziale Medien, Sponsoring-Unterlagen

## Marke und Design

Das Design ist aus dem echten Vereinswappen abgeleitet, nicht erfunden:

- **Farben direkt aus der Logodatei ausgelesen**: Rot `#F03C30`, Blau `#18549C`
- **Trikotband** (rot–weiss–blau) als Trennlinie – die Bänder des Wappens
- **Spitze Schildform** als Formsprache, roter Schrägbalken vor Abschnittstiteln
- Schriften: Barlow Condensed 800 für Titel, Source Sans 3 für Fliesstext
- Dunkle Abschnitte im Anzeigetafel-Stil für Resultate, Spielplan und Tabelle

Wappen, Spielergrafik und Fotos stammen von der bisherigen Website und wurden ins
Redaktionssystem importiert:

```bash
npx tsx src/seed/marke-importieren.ts
```

Das Script trennt Wappen und Spielergrafik aus der Logodatei, legt alles unter
**Bilder** ab und hinterlegt das Wappen in den Einstellungen. Die Quelldateien
liegen in `logo-quelle/`.

## Tabelle

Die Tabelle wird **aus den Resultaten selbst berechnet** (`berechneGruppenTabelle`
in [src/lib/sihf.ts](src/lib/sihf.ts)), weil die SIHF keine brauchbare
Tabellen-Schnittstelle anbietet. Punkte nach Swiss-Ice-Hockey-Regel: Sieg 3,
Sieg nach Verlängerung oder Penaltyschiessen 2, Niederlage nach Verlängerung 1,
Niederlage 0.

Eine Liga besteht oft aus mehreren Gruppen. Damit die Tabelle stimmt, wird nur die
Gruppe des eigenen Teams gewertet: alle Gegner, gegen die es angetreten ist, und
die Spiele dieser Teams untereinander.

## Was noch fehlt

- **Mehr eigene Fotos.** Vier Bilder von der alten Website sind übernommen. Weitere
  unter **Bilder** hochladen und bei Teams, Beiträgen, Vorstand und Sponsoren
  zuweisen – besonders Teamfotos für U16, U12, U9, Hockeyschule und Senioren.
- **Echte Vereinsgeschichte und Vorstandsnamen.** Aktuell stehen dort Platzhalter.
- **Echte Sponsoren mit Logos.** Die acht Einträge sind Beispiele ohne Logo.

## Technik

- Next.js 16 (App Router) mit Payload CMS 3 in derselben Anwendung
- SQLite für die Entwicklung (`rot-blau.db`); für den Betrieb auf Postgres wechseln
- Tailwind CSS 4, Schriften Barlow Condensed und Source Sans 3

```
src/
  access/            Rollen und Berechtigungen
  collections/       Beiträge, Teams, Sponsoren, Bilder, Dokumente, Benutzer
  globals/           Seiteninhalte (Eishockey, Verein, Einstellungen)
  components/        Bausteine der Website
  lib/sihf.ts        Schnittstelle zu Swiss Ice Hockey
  lib/wochenresultate.ts  Logik für den Montags-Beitrag
  seed/              Startinhalte und Rechteprüfung
  app/(frontend)/    Die öffentliche Website
  app/api/           Der Montags-Job
```

## Veröffentlichen

Für den Betrieb bei Vercel sind drei Dinge nötig:

1. In `src/payload.config.ts` von `@payloadcms/db-sqlite` auf
   `@payloadcms/db-postgres` wechseln (z. B. mit einer Gratis-Datenbank bei Neon)
2. Bild-Uploads auf einen Speicherdienst umstellen
   (`@payloadcms/storage-vercel-blob`), weil Vercel keine Dateien dauerhaft ablegt
3. Umgebungsvariablen setzen: `DATABASE_URI`, `PAYLOAD_SECRET`, `CRON_SECRET`
