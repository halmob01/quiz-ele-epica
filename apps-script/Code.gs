/**
 * LE VOCI DELL'EPICA — Google Apps Script per la classifica.
 * Incollare questo contenuto in Estensioni > Apps Script del foglio creato.
 * Distribuire come App Web: esegui come Me, accesso Chiunque.
 *
 * Il foglio NON deve essere condiviso pubblicamente.
 * API pubblica con ID casuale + token per sessione, non adatta a voti ufficiali.
 */
const QUIZ_SHEET_ID = '1C3jCI4tcoDFzsceYvk5Y7TBGXzIDTW-wjSC0-o61PCs';
const QUIZ_TAB = 'Classifica';
const ANSWER_KEY = ["B","C","A","D","C","B","D","A","C","B","A","D","B","C","A","D","B","C","D","A","B","C","D","A","C"];
const MAX = ANSWER_KEY.length;
const HEADERS = ['ID sessione','Soprannome','Punteggio','Risposte','Completato','Aggiornato (ISO)','Token SHA-256','Risposte JSON'];

function sheet_() {
  const ss=SpreadsheetApp.openById(QUIZ_SHEET_ID);
  let sh=ss.getSheetByName(QUIZ_TAB);
  if(!sh) throw Error('Scheda Classifica mancante');
  return sh;
}
function digest_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8)
    .map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
}
function response_(obj, callback) {
  const encoded=JSON.stringify(obj).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  if(callback && /^[A-Za-z_$][A-Za-z0-9_$]{0,63}$/.test(callback))
    return ContentService.createTextOutput(callback+'('+encoded+');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(encoded).setMimeType(ContentService.MimeType.JSON);
}
function rows_() {
  const sh=sheet_(), last=sh.getLastRow();
  return last>1 ? sh.getRange(2,1,last-1,8).getValues() : [];
}
function doGet(e) {
  try {
    const list=rows_().map(r=>({
      id:String(r[0]||''),
      name:String(r[1]||'').slice(0,24),
      score:Number(r[2])||0,
      answered:Number(r[3])||0,
      complete:r[4]===true||String(r[4]).toUpperCase()==='TRUE',
      updated:String(r[5]||'')
    })).filter(r=>r.name&&r.answered>=0).sort((a,b)=>b.score-a.score||b.answered-a.answered||a.name.localeCompare(b.name)).slice(0,150);
    return response_({ok:true,rows:list,at:new Date().toISOString()},e&&e.parameter&&e.parameter.callback);
  } catch(err) {
    return response_({ok:false,error:'LETTURA_NON_DISPONIBILE'},e&&e.parameter&&e.parameter.callback);
  }
}
function doPost(e) {
  const lock=LockService.getScriptLock();
  try {
    const body=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    const id=String(body.id||'');
    const token=String(body.token||'');
    const name=String(body.name||'').trim().replace(/\s+/g,' ').slice(0,24);
    const answers=body.answers;
    if(!/^[a-zA-Z0-9_-]{16,80}$/.test(id)||!/^[a-f0-9]{32,128}$/.test(token)||
       !name||/^[=+\-@]/.test(name)||/[\x00-\x1f]/.test(name)||
       !Array.isArray(answers)||answers.length>MAX||answers.some(a=>!['A','B','C','D'].includes(a)))
       return response_({ok:false,error:'DATI_NON_VALIDI'});
    if(!lock.tryLock(15000))return response_({ok:false,error:'RIPROVA'});
    const sh=sheet_(), rows=rows_(), key=digest_(token);
    const index=rows.findIndex(r=>String(r[0])===id);
    if(index>=0) {
      const old=rows[index],prev=JSON.parse(String(old[7]||'[]'));
      if(String(old[6])!==key||String(old[1])!==name||answers.length<prev.length||
         prev.some((value,i)=>answers[i]!==value))
        return response_({ok:false,error:'SESSIONE_NON_VALIDA'});
    }
    const points=answers.reduce((total,answer,i)=>total+(answer===ANSWER_KEY[i]?100:0),0);
    const complete=answers.length===MAX;
    const values=[id,name,points,answers.length,complete,new Date().toISOString(),key,JSON.stringify(answers)];
    if(index===-1)sh.appendRow(values);
    else sh.getRange(index+2,1,1,8).setValues([values]);
    return response_({ok:true,score:points,answered:answers.length,complete});
  } catch(err) {
    return response_({ok:false,error:'SCRITTURA_NON_DISPONIBILE'});
  } finally {
    if(lock.hasLock())lock.releaseLock();
  }
}
/** Solo il proprietario deve eseguirla dall'editor, per una nuova classe. */
function resetClassifica() {
  const sh=sheet_(),last=sh.getLastRow();
  if(last>1)sh.getRange(2,1,last-1,8).clearContent();
}
