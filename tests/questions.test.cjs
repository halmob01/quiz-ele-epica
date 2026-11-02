const test = require('node:test');
const assert = require('node:assert/strict');
const quiz = require('../questions.js');

test('la banca contiene esattamente quattro domande con quattro scelte', () => {
  assert.equal(quiz.QUESTIONS.length, 4);
  assert.equal(quiz.validate(), true);
  for (const q of quiz.QUESTIONS) {
    assert.equal(q.options.length, 4);
    assert.equal(q.options.filter(o => o.id === q.answer).length, 1);
    assert.ok(q.objective && q.explanation);
  }
});

test('le chiavi coprono A, B, C, D senza posizione privilegiata', () => {
  assert.deepEqual(quiz.QUESTIONS.map(q => q.answer).sort(), ['A','B','C','D']);
});

test('punteggi locali deterministici da zero a 400', () => {
  assert.equal(quiz.score({}), 0);
  const correct = Object.fromEntries(quiz.QUESTIONS.map(q => [q.id,q.answer]));
  assert.equal(quiz.score(correct), 400);
  correct[quiz.QUESTIONS[0].id] = 'IMPOSSIBILE';
  assert.equal(quiz.score(correct), 300);
});

test('nessuna ripetizione testuale e chiavi ID univoche', () => {
  const seen = new Set();
  for (const q of quiz.QUESTIONS) {
    const normalized=q.prompt.toLowerCase().trim();
    assert.ok(!seen.has(normalized));
    seen.add(normalized);
    assert.equal(new Set(q.options.map(o=>o.id)).size,4);
    assert.equal(new Set(q.options.map(o=>o.text)).size,4);
  }
});

test('la risposta corretta non è sempre la più lunga', () => {
  const longest = quiz.QUESTIONS.filter(q => {
    const correct=q.options.find(o=>o.id===q.answer).text.length;
    return q.options.every(o=>o.id===q.answer||correct>o.text.length);
  });
  assert.ok(longest.length < quiz.QUESTIONS.length);
});
