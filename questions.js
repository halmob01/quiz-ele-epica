/* Le voci dell'epica — quesiti ricavati esclusivamente dal PDF fornito.
 * Una sola risposta valida per quesito. Le chiavi non sono un segreto:
 * questo e' un ripasso ludico, non una verifica protetta. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EpicaQuiz = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const QUESTIONS = Object.freeze([
    {
      id: 'aedi', objective: 'Comprendere la trasmissione orale dell’epica',
      difficulty: 'base',
      prompt: 'Perché gli aedi usavano formule ed epiteti quando recitavano le storie?',
      options: [
        { id: 'A', text: 'Per trasformare i racconti in cronache esatte.' },
        { id: 'B', text: 'Per ricordare e ripetere meglio i racconti.' },
        { id: 'C', text: 'Per scegliere quali eroi meritassero il potere.' },
        { id: 'D', text: 'Per nascondere i nomi degli eroi al pubblico.' }
      ],
      answer: 'B',
      explanation: 'Formule ed epiteti sono espressioni ricorrenti: aiutavano i cantori a ricordare e recitare le storie.'
    },
    {
      id: 'gilgamesh', objective: 'Interpretare il rapporto fra mortalità e memoria',
      difficulty: 'intermedia',
      prompt: 'Perché Gilgamesh guarda le mura di Uruk dopo il suo viaggio?',
      options: [
        { id: 'A', text: 'Le opere comuni possono durare oltre una vita.' },
        { id: 'B', text: 'Le mura possono proteggerlo dalla vecchiaia.' },
        { id: 'C', text: 'La pianta perduta è nascosta sotto la città.' },
        { id: 'D', text: 'Il suo regno deve essere lasciato per sempre.' }
      ],
      answer: 'A',
      explanation: 'Non trova l’immortalità personale. Riconosce però che ciò che costruiamo per la comunità può restare.'
    },
    {
      id: 'viaggi', objective: 'Confrontare le scelte di Odisseo ed Enea',
      difficulty: 'intermedia',
      prompt: 'Quale differenza descrive meglio il viaggio di Odisseo e quello di Enea?',
      options: [
        { id: 'A', text: 'Odisseo cerca Troia; Enea cerca di tornare a Itaca.' },
        { id: 'B', text: 'Odisseo lascia Penelope; Enea rimane con Didone.' },
        { id: 'C', text: 'Odisseo conquista Uruk; Enea difende la città.' },
        { id: 'D', text: 'Odisseo torna in patria; Enea cerca una nuova patria.' }
      ],
      answer: 'D',
      explanation: 'Odisseo rinuncia all’immortalità per tornare a Itaca. Enea lascia Didone e prosegue verso l’Italia per il futuro del suo popolo.'
    },
    {
      id: 'rostam-abu-zayd', objective: 'Confrontare le conseguenze delle scelte per il gruppo',
      difficulty: 'avanzata',
      prompt: 'Quale confronto è fedele alle storie di Rostam e Abū Zayd?',
      options: [
        { id: 'A', text: 'Rostam abbandona la guerra; Abū Zayd rifiuta di migrare.' },
        { id: 'B', text: 'Rostam salva Sohrab; Abū Zayd abbandona la tribù.' },
        { id: 'C', text: 'Rostam perde il figlio in battaglia; Abū Zayd esplora per la tribù.' },
        { id: 'D', text: 'Rostam cerca l’immortalità; Abū Zayd torna a Itaca.' }
      ],
      answer: 'C',
      explanation: 'La lealtà di Rostam verso lo schieramento ha un costo tragico. Abū Zayd usa l’astuzia per aiutare la propria comunità in viaggio.'
    }
  ]);

  function validate() {
    if (QUESTIONS.length !== 4) throw Error('La partita richiede quattro domande');
    const ids = new Set();
    for (const q of QUESTIONS) {
      if (ids.has(q.id)) throw Error('ID ripetuto');
      ids.add(q.id);
      if (!q.prompt || !q.objective || !q.explanation || q.options.length !== 4) throw Error('Quesito incompleto: ' + q.id);
      if (new Set(q.options.map(o => o.id)).size !== 4 ||
          q.options.filter(o => o.id === q.answer).length !== 1) throw Error('Risposta ambigua: ' + q.id);
    }
    return true;
  }

  function score(answers) {
    return QUESTIONS.reduce((sum, q) => sum + (answers && answers[q.id] === q.answer ? 100 : 0), 0);
  }

  validate();
  return Object.freeze({ QUESTIONS, validate, score });
});
