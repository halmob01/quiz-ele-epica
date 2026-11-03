const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const quiz = require('../questions.js');

function harness() {
  const source=fs.readFileSync(path.join(__dirname,'../apps-script/Code.gs'),'utf8');
  const HEADERS=['ID sessione','Soprannome','Punteggio','Risposte','Completato','Aggiornato (ISO)','Token SHA-256','Risposte JSON'];
  let rows=[HEADERS];
  const sheet={
    getLastRow(){return rows.length;},
    getRange(row,col,count,width){
      assert.equal(col,1); assert.equal(width,8);
      return {
        getValues(){return rows.slice(row-1,row-1+count).map(x=>x.slice());},
        setValues(data){assert.equal(count,1);rows[row-1]=data[0].slice();},
        clearContent(){rows=rows.slice(0,row-1);}
      };
    },
    appendRow(values){rows.push(values.slice());}
  };
  function output(content) {
    return {
      body:String(content),
      getContent(){return this.body;},
      setMimeType(m){this.type=m;return this;}
    };
  }
  const sandbox={
    SpreadsheetApp:{openById(){return{getSheetByName(name){assert.equal(name,'Classifica');return sheet;}}}},
    LockService:{getScriptLock(){let locked=false;return {
      tryLock(){locked=true;return true;},
      hasLock(){return locked;},
      releaseLock(){locked=false;}
    };}},
    Utilities:{
      DigestAlgorithm:{SHA_256:'sha256'},
      Charset:{UTF_8:'utf8'},
      computeDigest(_alg,text){return Array.from(crypto.createHash('sha256').update(text,'utf8').digest()).map(x=>x>127?x-256:x);}
    },
    ContentService:{createTextOutput:output,MimeType:{JSON:'json',JAVASCRIPT:'javascript'}},
    Date,JSON,String,Number,Array,Object,RegExp,Error
  };
  vm.runInNewContext(source,sandbox);
  const request=data=>JSON.parse(sandbox.doPost({postData:{contents:JSON.stringify(data)}}).getContent());
  const get=()=>JSON.parse(sandbox.doGet({parameter:{}}).getContent());
  return {request,get,reset:()=>sandbox.resetClassifica(),rows:()=>rows};
}

test('checkpoint crea una riga e conta i punti corretti sul server',()=>{
  const t=harness(),keys=quiz.QUESTIONS.map(q=>q.answer);
  const user={id:'a'.repeat(32),token:'b'.repeat(64),name:'Studente A',answers:keys.slice(0,5)};
  const first=t.request(user);
  assert.equal(first.ok,true);
  assert.equal(first.score,500);
  assert.equal(first.answered,5);
  assert.equal(t.rows().length,2);
  assert.equal(t.get().rows[0].score,500);
  assert.equal(t.get().rows[0].answered,5);
  assert.equal('token' in t.get().rows[0],false,'Il segreto non deve finire nella classifica pubblica');
  const final=t.request({...user,answers:keys});
  assert.equal(final.ok,true);
  assert.equal(final.score,2500);
  assert.equal(final.complete,true);
  assert.equal(t.rows().length,2,'Lo stesso ID deve aggiornare la riga, non duplicarla');
});

test('checkpoint rifiuta token errato, riscrittura e regressione del progresso',()=>{
  const t=harness(),keys=quiz.QUESTIONS.map(q=>q.answer);
  const p={id:'e'.repeat(32),token:'f'.repeat(64),name:'Alex',answers:keys.slice(0,10)};
  assert.equal(t.request(p).ok,true);
  assert.equal(t.request({...p,token:'d'.repeat(64)}).ok,false);
  assert.equal(t.request({...p,answers:keys.slice(0,5)}).ok,false);
  const tampered=keys.slice(0,15);tampered[0]=tampered[0]==='A'?'B':'A';
  assert.equal(t.request({...p,answers:tampered}).ok,false);
  assert.equal(t.rows().length,2);
});

test('risposte errate producono zero e nickname formula-like sono respinti',()=>{
  const t=harness(),keys=quiz.QUESTIONS.map(q=>q.answer);
  const wrong=keys.map(a=>a==='A'?'B':'A');
  const p={id:'1'.repeat(32),token:'2'.repeat(64),name:'Studente',answers:wrong};
  assert.equal(t.request(p).score,0);
  assert.equal(t.request({...p,id:'3'.repeat(32),name:'=SOMMA(A1:A5)'}).ok,false);
  assert.equal(t.rows().length,2);
});

test('JSONP con callback limitata, reset e foglio intatto',()=>{
  const t=harness();
  const result=t.get();
  assert.equal(result.ok,true);
  assert.equal(result.rows.length,0);
  t.reset();
  assert.equal(t.rows().length,1);
});
