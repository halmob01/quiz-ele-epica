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
        { id: 'A', text: 'Per rendere i racconti storicamente più precisi.' },
        { id: 'B', text: 'Per ricordare e ripetere meglio i racconti.' },
        { id: 'C', text: 'Per distinguere gli eroi dai personaggi comuni.' },
        { id: 'D', text: 'Per cambiare i nomi degli eroi a ogni recita.' }
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
        { id: 'B', text: 'Le mura possono difenderlo anche dalla morte.' },
        { id: 'C', text: 'La pianta di giovinezza si trova nella città.' },
        { id: 'D', text: 'Deve abbandonare Uruk per dimenticare Enkidu.' }
      ],
      answer: 'A',
      explanation: 'Non trova l’immortalità personale. Riconosce però che ciò che costruiamo per la comunità può restare.'
    },
    {
      id: 'viaggi', objective: 'Confrontare le scelte di Odisseo ed Enea',
      difficulty: 'intermedia',
      prompt: 'Quale differenza descrive meglio il viaggio di Odisseo e quello di Enea?',
      options: [
        { id: 'A', text: 'Odisseo cerca un'altra patria; Enea torna a Troia.' },
        { id: 'B', text: 'Odisseo resta con Calipso; Enea rimane con Didone.' },
        { id: 'C', text: 'Odisseo cerca l'immortalità; Enea torna a Troia.' },
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
        { id: 'A', text: 'Rostam riconosce Sohrab prima del duello; Abū Zayd esplora travestito.' },
        { id: 'B', text: 'Rostam ferisce Sohrab ma lo salva; Abū Zayd esplora per la tribù.' },
        { id: 'C', text: 'Rostam perde il figlio in battaglia; Abū Zayd esplora per la tribù.' },
        { id: 'D', text: 'Rostam perde Sohrab dopo averlo riconosciuto; Abū Zayd rimane nella sua terra.' }
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
