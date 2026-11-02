# Le voci dell'epica — torneo sullo stesso dispositivo

Quiz di ripasso da **25 domande con quattro alternative**, sulla base del PDF «Le voci dell'epica» e degli appunti «Dal linguaggio all'epica» forniti dal docente.

## Uso
Apri `index.html` da un server statico oppure pubblica la repository con GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `(root)`).

1. Lo studente inserisce nome o soprannome.
2. Risponde alle 25 domande, una alla volta. La scelta viene bloccata dopo il clic.
3. **Punteggio in tempo reale:** 100 punti per risposta corretta, 0 per errata; massimo 2500. La barra in alto mostra il totale dopo ogni risposta.
4. Subito dopo la risposta appare la soluzione evidenziata e una breve spiegazione; lo studente passa poi alla domanda successiva.
5. Alla fine salva il risultato nella **classifica locale**, poi passa lo stesso dispositivo al successivo partecipante.
6. Classifica consultabile nel menu, azzerabile con conferma. La partita in corso può essere ripresa dopo aver chiuso la pagina dallo stesso browser.

**Non servono Firebase, account, database, abbonamenti o servizi a consumo.** Non c'è connessione tra dispositivi diversi: ogni browser mantiene separatamente dati e classifica nel proprio localStorage. I dati non sono inviati a un server. Non cancellare i dati del sito prima della fine della lezione.

## Scelte didattiche
Fonti:
- «Le voci dell'epica», verifica senza gioco, due pagine (PDF fornito).
- «Dal linguaggio all'epica», appunti del docente, sezioni 1–7.

Matrice di copertura:
- Q1–4: linguaggio sociopoietico, accordi sociali e decisioni della comunità.
- Q5–7: memoria collettiva, punto di vista, fatti e interpretazioni.
- Q8–10: funzione dell'epica, aedi, differenza dalla cronaca.
- Q11–12: Gilgamesh.
- Q13–15: Odisseo e Penelope.
- Q16–18: Enea e confronto con Odisseo.
- Q19–21: Rostam, Abū Zayd, appartenenza dei Banū Hilāl.
- Q22–23: Achille e Arjuna.
- Q24–25: confronto tra lutti e trasferimento individuo/comunità.

Le domande alternano richiamo, comprensione, confronto e applicazione a casi nuovi. Ogni distrattore rappresenta un fraintendimento plausibile del contenuto, non un'opzione ironica. Le risposte vengono mescolate in modo riproducibile per domanda e restano identificate per ID, non per posizione a schermo.

Skill di riferimento: `halmob01/corso-arabofoni/.agents/skills/verifiche-didattiche/SKILL.md`. Un quiz di 25 scelte multiple misura riconoscimento, comprensione e alcuni confronti: **non** misura produzione scritta o capacità di argomentare in autonomia. I punti sono ludici, non voti.

## Aspetto
Derivato da `halmob01/epica-romanzo`: **Alfa Slab One**, **Public Sans**, prugna `#76506f`, inchiostro `#211d2a`, carta `#f9f7fa`, titoli grandi, contorni e ombre spostate.

## Tecnica
- `questions.js`: dati, soluzioni, spiegazioni, scoring e mescolamento deterministico.
- `app.js`: flusso del torneo, feedback immediato, punteggio e classifica persistiti in localStorage.
- `styles.css`: grafica e layout mobile-first.
- `tests/questions.test.cjs`: controllo banca, punteggio e mescolamento.

Test: `node --test tests/*.test.cjs`. Non è previsto un backend.

Il precedente prototipo Firebase è stato rimosso dal percorso eseguibile; questa versione funziona interamente in locale. Il test con studenti su un telefono reale resta da effettuare.
