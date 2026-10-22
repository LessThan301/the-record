// Impressum and privacy policy. Operator details come from site.config.json -> "operator".
// Empty fields render as clearly marked placeholders. Never fill these with invented data.
import { esc } from '../src/render.js';

const ph = (v, label) => (v ? esc(v) : `<mark class="placeholder">[${esc(label)}]</mark>`);

export function imprintHTML({ op }) {
  const missing = !op.name || !op.street || !op.city || !op.email;
  return `${missing ? '<p class="notice" role="note"><strong>Entwurf / Draft:</strong> Die markierten Platzhalter müssen vor der Veröffentlichung ersetzt werden. The marked placeholders must be filled in before going public.</p>' : ''}
<section lang="de"><h1>Impressum</h1>
<h2>Angaben gemäß § 5 DDG</h2>
<p>${ph(op.name, 'VOR- UND NACHNAME')}<br>${ph(op.street, 'STRASSE UND HAUSNUMMER (ggf. Anschrift des Adressdienstes)')}<br>${ph(op.city, 'PLZ UND ORT')}<br>Deutschland</p>
<h2>Kontakt</h2>
<p>E-Mail: ${op.email ? `<a href="mailto:${esc(op.email)}">${esc(op.email)}</a>` : ph('', 'E-MAIL-ADRESSE')}<br>Zweiter Kontaktweg: ${ph(op.secondContact, 'TELEFON ODER KONTAKTFORMULAR')}</p>
<h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
<p>${ph(op.name, 'VOR- UND NACHNAME')}, Anschrift wie oben</p>
<h2>Haftung für Links</h2>
<p>Die Karten verlinken auf externe Quellen. Für deren Inhalte sind die jeweiligen Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir solche Links umgehend.</p>
<h2>Unabhängigkeit</h2>
<p>The Record ist ein unabhängiges redaktionelles Angebot und steht in keiner Verbindung zu Tesla, SpaceX, xAI oder Elon Musk.</p></section>
<hr>
<section lang="en"><h2>Imprint (English)</h2>
<p>Information according to § 5 DDG (German Digital Services Act):</p>
<p>${ph(op.name, 'FULL NAME')}<br>${ph(op.street, 'STREET ADDRESS (or address service)')}<br>${ph(op.city, 'POSTCODE AND CITY')}<br>Germany</p>
<p>Email: ${op.email ? `<a href="mailto:${esc(op.email)}">${esc(op.email)}</a>` : ph('', 'EMAIL ADDRESS')}<br>Second contact channel: ${ph(op.secondContact, 'PHONE OR CONTACT FORM')}</p>
<p>Responsible for content under § 18(2) MStV: ${ph(op.name, 'FULL NAME')}, address as above.</p>
<p>The Record is independent and not affiliated with Tesla, SpaceX, xAI or Elon Musk. The German version above is the binding one.</p></section>`;
}

export function privacyHTML({ op, counter, repo, analytics = false }) {
  let n = 4; const nx = () => ++n;
  const ctrl = `${ph(op.name, 'VOR- UND NACHNAME / FULL NAME')}, ${ph(op.street, 'ANSCHRIFT / ADDRESS')}, ${ph(op.city, 'PLZ ORT / POSTCODE CITY')}, ${op.email ? esc(op.email) : ph('', 'E-MAIL')}`;
  return `${!op.name ? '<p class="notice" role="note"><strong>Entwurf / Draft:</strong> Platzhalter vor Veröffentlichung ersetzen. Fill in the placeholders before going public.</p>' : ''}
<section lang="de"><h1>Datenschutzerklärung</h1>
<h2>1. Verantwortlicher</h2><p>${ctrl}</p>
<h2>2. Kurz gesagt</h2><p>Keine Cookies, ${analytics ? 'nur eine cookielose Reichweitenmessung (siehe unten), keine Werbedienste' : 'keine Analyse- oder Werbedienste'}, keine Konten, keine externen Schriftarten. Alle Schriften und Dateien werden von unserem eigenen Hosting geladen${analytics ? ', mit Ausnahme des Analyse-Skripts von Cloudflare' : ''}.</p>
<h2>3. Hosting (GitHub Pages)</h2><p>Die Website wird über GitHub Pages der GitHub Inc. (88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA) ausgeliefert. Beim Aufruf verarbeitet GitHub technisch notwendige Verbindungsdaten, insbesondere die IP-Adresse, Datum und Uhrzeit, die aufgerufene Adresse und Browserangaben, um die Seite auszuliefern und vor Missbrauch zu schützen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren und funktionierenden Website). GitHub ist unter dem EU-US Data Privacy Framework zertifiziert. Mehr dazu in der <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">Datenschutzerklärung von GitHub</a>.</p>
<h2>4. Speicherung auf deinem Gerät</h2><p>Die Seite speichert im lokalen Speicher deines Browsers (localStorage) nur deine Sprachauswahl${counter ? ' und, bei welchen Karten du bereits abgestimmt hast' : ''}. Diese Daten verlassen dein Gerät nicht und lassen sich jederzeit über die Browsereinstellungen löschen. Es werden keine Cookies gesetzt.</p>
${analytics ? `<h2>${nx()}. Reichweitenmessung (Cloudflare Web Analytics)</h2><p>Wir nutzen Cloudflare Web Analytics (Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA, zertifiziert unter dem EU-US Data Privacy Framework). Das Skript setzt keine Cookies, nutzt keinen lokalen Speicher und erstellt kein Profil. Erfasst werden nur zusammengefasste Daten wie aufgerufene Seite, Referrer, Browser- und Gerätetyp, Land und Ladezeiten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer datensparsamen Reichweitenmessung).</p>` : ''}
${counter ? `<h2>${nx()}. Anonymer Zähler „Hast du das geglaubt?“</h2><p>Wenn du auf einer Karte „Ja“ oder „Nein“ antwortest, senden wir nur die Kennung der Karte und deine Antwort an einen Zähldienst auf Cloudflare Workers (Cloudflare, Inc., USA, zertifiziert unter dem EU-US Data Privacy Framework). Wir speichern dabei weder IP-Adressen noch Cookies oder andere Kennungen, sondern nur Summen pro Karte. Cloudflare verarbeitet zur Auslieferung technisch notwendige Verbindungsdaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>` : ''}
<h2>${nx()}. Teilen und Korrekturen</h2><p>„Karte teilen“ nutzt die Teilen-Funktion deines Geräts oder kopiert den Link; wir erhalten dabei nichts. „Korrektur vorschlagen“ öffnet ein Formular auf GitHub (github.com/${esc(repo)}); dort gilt die Datenschutzerklärung von GitHub.</p>
<h2>${nx()}. Externe Links</h2><p>Quellenlinks führen zu fremden Websites. Erst wenn du einen Link anklickst, werden Daten an den jeweiligen Anbieter übertragen.</p>
<h2>${nx()}. Deine Rechte</h2><p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15 bis 21 DSGVO) sowie das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p>
<p class="muted">Stand: ${ph(op.policyDate, 'DATUM')}</p></section>
<hr>
<section lang="en"><h2>Privacy policy (English)</h2>
<p><strong>Controller:</strong> ${ctrl}</p>
<p><strong>Summary:</strong> no cookies, ${analytics ? 'only cookieless visitor statistics (see below), no advertising' : 'no analytics or advertising'}, no accounts, no third-party fonts. Everything loads from our own hosting${analytics ? ', except the Cloudflare analytics script' : ''}.</p>
<p><strong>Hosting:</strong> GitHub Pages (GitHub Inc., USA) delivers the site and processes technically necessary connection data such as your IP address, time, requested page and browser details to serve the site and prevent abuse (Art. 6(1)(f) GDPR). GitHub is certified under the EU-US Data Privacy Framework.</p>
<p><strong>On your device:</strong> your browser's local storage keeps only your language choice${counter ? ' and which cards you already answered' : ''}. It never leaves your device. No cookies are set.</p>
${analytics ? '<p><strong>Visitor statistics:</strong> we use Cloudflare Web Analytics (Cloudflare, Inc., USA). It sets no cookies, uses no local storage and builds no profile. It records only aggregated data such as page, referrer, browser and device type, country and load times (Art. 6(1)(f) GDPR).</p>' : ''}
${counter ? '<p><strong>Anonymous counter:</strong> if you answer “Did you believe this?”, only the card ID and your yes/no are sent to a counter on Cloudflare Workers (Cloudflare, Inc., USA). We store no IP addresses, cookies or identifiers, only totals per card (Art. 6(1)(f) GDPR).</p>' : ''}
<p><strong>Sharing and corrections:</strong> sharing uses your device's share sheet or copies the link. “Suggest a correction” opens a GitHub form, where GitHub's privacy policy applies.</p>
<p><strong>Your rights:</strong> access, rectification, erasure, restriction, portability and objection (Art. 15 to 21 GDPR), and the right to complain to a data protection authority. The German version above is the binding one.</p></section>`;
}
