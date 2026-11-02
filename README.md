# LE VOCI DELL'EPICA
Quiz di classe in quattro turni. Basato sulla verifica «Le voci dell’epica» (versione senza gioco, due pagine).

**Repository:** `halmob01/quiz-ele-epica`  
**Riferimento grafico:** `halmob01/epica-romanzo`  
**Stato:** torneo locale funzionante; partita multiplayer implementata ma **non attivabile finché non viene configurato Firebase**. Non ancora collaudata su una classe e su dispositivi reali.

## Che cosa fa
- Quattro quesiti, ognuno con quattro alternative e una risposta corretta, sui cantori aedi, Gilgamesh, Odisseo/Enea e Rostam/Abū Zayd.
- **Prova locale:** su un unico dispositivo, ogni partecipante inserisce un nome, risponde a quattro domande e compare nella classifica locale. 100 punti per risposta corretta, massimo 400. I risultati rimangono nel browser.
- **Partita online:** il docente crea una stanza con un codice di sei caratteri; ogni studente entra dal proprio dispositivo con codice e soprannome. Il docente avvia le domande, che durano 35 secondi; le risposte si bloccano alla scadenza. Feedback e classifica diventano visibili dopo la chiusura del turno. Risposta corretta: 100 punti + fino a 50 di bonus per la rapidità (massimo 600).
- La domanda successiva si apre dal dispositivo del docente. Quest'ultimo può riprendere la stanza dopo aver chiuso il browser, purché resti lo stesso profilo di autenticazione anonima.
- Non è una verifica certificata: i punti sono un indicatore ludico, non un voto scolastico.

## Come provarlo subito
1. Pubblica il sito su GitHub Pages: **Settings → Pages → Build and deployment → Deploy from a branch → main / (root)**.
2. Apri il link generato dalla sezione Pages e seleziona **GIOCA SU UN DISPOSITIVO**.
3. Scrivi il nome del primo partecipante e svolgi le quattro domande. Salva il risultato; passa il telefono al secondo partecipante per ottenere la classifica.

Per eseguire in locale, dalla directory della repo: `python3 -m http.server 8000`, poi apri `http://localhost:8000`. Non occorre Node o un bundler per il sito.

## Attivare il multiplayer online

La pubblicazione su GitHub Pages **non sincronizza da sola** telefoni e punteggi. Per il multiplayer è stato predisposto Firebase Realtime Database con accesso anonimo.

1. Vai alla [console Firebase](https://console.firebase.google.com/) e crea un progetto (piano Spark gratuito se disponibile e sufficiente).
2. Aggiungi un'app **Web** nelle impostazioni del progetto. Recupera l'oggetto pubblico `firebaseConfig`.
3. In **Authentication → Sign-in method** abilita il provider **Anonymous**.
4. In **Build → Realtime Database** crea un database, preferibilmente in una regione UE e in modalità bloccata. Apri la scheda **Rules** e pubblica **l'intero contenuto di `database.rules.json`**: non usare regole generiche `.read: true` o `.write: true`.
5. In `firebase-config.js`, sostituisci `null` con la configurazione dell'app Web. Includi **databaseURL**, oltre a `apiKey`, `projectId`, `authDomain` e `appId`. Non inserire chiavi private o credenziali di servizio. La configurazione Web è pubblica per natura: l'accesso è governato da Authentication e dalle regole del database.
6. Esegui commit, attendi la pubblicazione di Pages e prova con **due browser/dispositivi distinti**: uno docente e uno studente. Verifica l'accesso, le quattro domande, la scadenza, il punteggio e la classifica.

**Limite del piano Spark, alla data della progettazione:** 100 connessioni simultanee alla Realtime Database, 1 GB archiviato e 10 GB scaricati al mese. Controlla sempre i limiti correnti nel [listino ufficiale](https://firebase.google.com/pricing). Le funzioni online non sono state verificate qui contro un progetto Firebase reale.

## Gestione della classe
Il docente apre **CREA UNA PARTITA**, mostra il codice e aspetta che gli studenti entrino. Poi preme **Avvia la prima domanda**. Ogni studente sceglie una sola alternativa sul proprio telefono. Alla scadenza (o quando il docente chiude prima), compaiono la soluzione, una breve spiegazione, la distribuzione delle risposte e la classifica. Il docente prosegue fino al podio finale.

Gli studenti devono usare **soprannomi**, non cognomi o dati personali. Nel database Firebase rimangono registrati soprannomi, risposte e punteggi fino a eliminazione manuale. Cancella il nodo della stanza sotto `rooms/<codice>` dalla console Realtime Database dopo la lezione. Non utilizzare il progetto per voti ufficiali o dati sensibili. Le regole limitano letture e scritture ai percorsi autorizzati, ma non costituiscono una protezione da tentativi intenzionali di manomissione dei risultati tramite un client alterato: le risposte corrette sono incluse nel JavaScript pubblico.

## Design
Si riprendono dalla versione corrente di `epica-romanzo`:
- Titoli e wordmark: **Alfa Slab One**. Corpo del testo e interfaccia: **Public Sans**.
- Inchiostro `#211d2a`, prugna `#76506f`, prugna scura `#563951`, carta `#f9f7fa`, fondo tenue `#f2eaf1`.
- Riquadri con bordo da 3px, ombre spostate, pulsanti grandi e proporzioni editoriali. Nessuna fotografia stock.
- Uso di marchio tipografico `EPICA / ROMANZO` e piccolo segno astratto in pagina; non viene presentato come un logo ufficiale differente.

## Architettura
- `index.html`: shell accessibile, caricamento delle risorse.
- `styles.css`: design responsive.
- `questions.js`: banca e scoring locale, senza DOM.
- `app.js`: modalità locale, controller docente/studente, sincronizzazione Firebase.
- `firebase-config.js`: configurazione pubblica opzionale, inizialmente disattivata.
- `database.rules.json`: autorizzazione per stanze, partecipanti, risposte e risultati.
- `tests/questions.test.cjs`: controllo strutturale della banca e del punteggio.

Il multiplayer usa Firebase SDK importato dinamicamente solo quando viene avviata la modalità online. Per la modalità locale non serve Firebase.

## Qualità didattica
Skill di riferimento: `corso-arabofoni/.agents/skills/verifiche-didattiche/SKILL.md` con checklist, controllo dei distrattori e della copertura.

| Domanda | Obiettivo | Difficoltà |
|---|---|---|
| Aedi | Trasmissione orale, formule ed epiteti | Base |
| Gilgamesh | Mortalità e memoria collettiva | Intermedia |
| Odisseo ed Enea | Confronto fra ritorno e fondazione di una nuova patria | Intermedia |
| Rostam e Abū Zayd | Lealtà, guerra, solidarietà e comunità | Avanzata |

**Audit svolto:** controllo delle quattro chiavi univoche, lunghezza dei distrattori, distinzione degli obiettivi, distribuzione delle chiavi A/B/C/D e simulazione manuale del flusso locale. Nella fonte vengono confrontate anche le conseguenze delle scelte degli eroi. **Non** è stato eseguito l'auditor Python originale della skill su JSON normalizzato né un test multiplayer con Firebase Emulator. Servono revisione docente, prova su telefono e test delle regole Firebase prima dell'utilizzo con la classe.

Test disponibili: `node --test tests/*.test.cjs`.

Fonti tecniche: [Firebase Web SDK](https://firebase.google.com/docs/web/setup), [regole Realtime Database](https://firebase.google.com/docs/database/security), [Firebase pricing](https://firebase.google.com/pricing).
