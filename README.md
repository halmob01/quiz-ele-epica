# Le voci dell’epica — classifica condivisa

Quiz di 25 domande con punteggio immediato: +100 per risposta corretta, massimo 2.500. Ogni studente può giocare dal proprio telefono. Il foglio Google riceve aggiornamenti ogni cinque risposte e alla fine; la classifica si aggiorna circa ogni dieci secondi.

## Attivazione Google Sheets + Apps Script

Il foglio è stato creato nel Drive collegato:
https://docs.google.com/spreadsheets/d/1C3jCI4tcoDFzsceYvk5Y7TBGXzIDTW-wjSC0-o61PCs/edit

1. Apri il foglio. Lascialo privato e scegli **Estensioni → Apps Script**.
2. Sostituisci il contenuto di `Code.gs` con il file [apps-script/Code.gs](apps-script/Code.gs) della repository; salva.
3. Premi **Distribuisci → Nuova distribuzione → App web**. Scegli **Esegui come: Me** e **Accesso: Chiunque**, autorizza e distribuisci.
4. Copia l'URL risultante, che termina con `/exec`.
5. Modifica [sheets-config.js](sheets-config.js) su GitHub, impostando:
   `window.EPICA_SHEETS_URL = 'https://script.google.com/macros/s/ID_DISTRIBUZIONE/exec';`
6. Salva su `main` e ricarica GitHub Pages dopo la pubblicazione.

Controllo: aprendo l'URL dello script dovresti vedere un JSON con `"ok":true`. Sul quiz, dopo cinque risposte, controlla che una riga sia apparsa nella scheda Classifica.

Per proiettare la classifica sulla LIM, apri il sito con `?classifica=1` aggiunto all'URL.

## Comportamento

- Punteggio individuale aggiornato subito sul telefono con spiegazione della risposta.
- Classifica condivisa con soprannomi, punti parziali e numero di risposte completate.
- Il browser mantiene una copia locale e ritenta gli invii in sospeso.
- Nessun Firebase e nessun servizio di pagamento; Apps Script ha quote operative proprie.
- Il foglio non va condiviso con gli studenti; la Web App deve invece essere accessibile.
- Per azzerare, apri Apps Script ed esegui `resetClassifica` oppure elimina le righe dati, conservando l'intestazione.
- Usa soprannomi, non dati personali. Questa è un'attività ludica: i punteggi non sono adatti a valutazioni ufficiali.

Le 25 domande derivano dal PDF «Le voci dell’epica» e dagli appunti «Dal linguaggio all’epica». I controlli di progettazione seguono la skill `verifiche-didattiche` della repository `corso-arabofoni`.

## Stato dei test

La partita locale completa e l'invio del primo checkpoint sono stati simulati. La Web App non è ancora pubblicata: il collaudo reale con più telefoni richiede la distribuzione dal tuo account Google.
