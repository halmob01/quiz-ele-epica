const test=require('node:test');
const assert=require('node:assert/strict');
const quiz=require('../questions.js');

test('25 domande, quattro alternative con risposta univoca e fonti',()=>{
  assert.equal(quiz.QUESTIONS.length,25);
  assert.equal(quiz.validate(),true);
  const ids=new Set(),stems=new Set();
  for(const q of quiz.QUESTIONS){
    assert.ok(q.objective&&q.explanation&&q.source&&q.topic);
    assert.equal(q.options.length,4);
    assert.equal(q.options.filter(o=>o.id===q.answer).length,1);
    assert.equal(new Set(q.options.map(o=>o.text)).size,4);
    assert.ok(!ids.has(q.id)&&!stems.has(q.prompt));
    ids.add(q.id);stems.add(q.prompt);
  }
});

test('punteggio live: +100 soltanto quando la risposta è corretta',()=>{
  assert.equal(quiz.MAX_SCORE,2500);
  assert.equal(quiz.score({}),0);
  let answers={};
  for(let i=0;i<quiz.QUESTIONS.length;i++){
    const q=quiz.QUESTIONS[i];
    answers[q.id]=q.answer;
    assert.equal(quiz.score(answers),(i+1)*100);
  }
  answers[quiz.QUESTIONS[0].id]='ERRATA';
  assert.equal(quiz.score(answers),2400);
});

test('il mescolamento è riproducibile, completo e non cambia la chiave',()=>{
  for(const q of quiz.QUESTIONS){
    const first=quiz.shuffledOptions(q,'epica-2026');
    const second=quiz.shuffledOptions(q,'epica-2026');
    assert.deepEqual(first,second);
    assert.deepEqual(first.map(o=>o.id).sort(),['A','B','C','D']);
    assert.equal(first.filter(o=>o.id===q.answer).length,1);
  }
});

test('le chiavi sorgenti sono distribuite e la corretta non è sistematicamente la più lunga',()=>{
  const counts={A:0,B:0,C:0,D:0};
  let longest=0;
  for(const q of quiz.QUESTIONS){
    counts[q.answer]++;
    const correct=q.options.find(o=>o.id===q.answer).text.length;
    if(q.options.every(o=>o.id===q.answer||correct>o.text.length))longest++;
  }
  assert.ok(Math.max(...Object.values(counts))-Math.min(...Object.values(counts))<=2);
  assert.ok(longest<13);
});

test('Google Apps Script corregge le stesse 25 risposte della banca', () => {
 const fs = require('node:fs');
 const path = require('node:path');
 const script=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
 const match=script.match(/const ANSWER_KEY = (\[[^;]+\]);/);
 assert.ok(match,'Chiavi Apps Script presenti');
 assert.deepEqual(JSON.parse(match[1]),quiz.QUESTIONS.map(q=>q.answer));
});
