/* Torneo: punteggio immediato in locale; classifica condivisa opzionale
   tramite Google Sheets + Apps Script, senza Firebase. */
(function () {
 'use strict';
 const root=document.getElementById('app'), bank=window.EpicaQuiz, questions=bank.QUESTIONS;
 const KEY='quiz-ele-epica-local-v2';
 const WEB_APP_URL=String(window.EPICA_SHEETS_URL||'').trim();
 const configured=/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(WEB_APP_URL);
 let sharedRows=[],sharedStatus=configured?'loading':'not-configured';
 let lastSyncAttempt=0, lastPoll=0, syncBusy=false, pollBusy=false;
 const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 const freshId=()=>hex(crypto.getRandomValues(new Uint8Array(16)));
 const freshToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
 const safeName=name=>name.trim().replace(/\s+/g,' ').replace(/^[=+@-]+/,'').slice(0,24);
 const answerList=s=>questions.slice(0,questions.length).map(q=>s.answers[q.id]).filter(a=>a!==undefined);
 function fullPrefix(s) {
  const result=[];
  for(const q of questions) {
   if (!Object.prototype.hasOwnProperty.call(s.answers,q.id)) break;
   result.push(s.answers[q.id]);
  }
  return result;
 }
 function ensureIds(s){
  if(!s.id||!s.token){s.id=freshId();s.token=freshToken()}
  return s;
 }
 const endpoint=() => WEB_APP_URL + (WEB_APP_URL.includes('?')?'&':'?');
 function readJsonp() {
  return new Promise((resolve,reject)=>{
   const callback='epicaCb'+Math.floor(Math.random()*1e9).toString(36);
   const script=document.createElement('script');
   const timeout=setTimeout(()=>finish(new Error('timeout')),12000);
   let done=false;
   function finish(error,result){
    if(done)return;done=true;clearTimeout(timeout);
    delete window[callback];script.remove();
    if(error)reject(error);else resolve(result);
   }
   window[callback]=data=>finish(null,data);
   script.onerror=()=>finish(new Error('network'));
   script.src=endpoint()+'callback='+callback+'&t='+Date.now();
   document.head.appendChild(script);
  });
 }
 async function pollShared(force=false){
  if(!configured||pollBusy||(!force&&document.hidden))return;
  pollBusy=true;
  try{
   const answer=await readJsonp();
   if(!answer||answer.ok!==true||!Array.isArray(answer.rows))throw Error('response');
   sharedRows=answer.rows.filter(r=>r&&typeof r.id==='string'&&typeof r.name==='string'&&
    Number.isFinite(Number(r.score))&&Number.isInteger(Number(r.answered)));
   sharedStatus='ok';lastPoll=Date.now();
   const ack=state.current&&sharedRows.find(r=>r.id===state.current.id);
   if(ack&&state.current){state.current.remoteAck=Math.max(state.current.remoteAck||0,Number(ack.answered)||0);save()}
   const before=state.outbox.length;
   state.outbox=state.outbox.filter(s=>!sharedRows.some(r=>r.id===s.id&&r.answered>=s.answers.length));
   if(before!==state.outbox.length)save();
   if(screen==='board'&&!state.current)renderBoard();
  }catch(_){sharedStatus='error';if(screen==='board'&&!state.current)renderBoard()}
  finally{pollBusy=false}
 }
 async function postCheckpoint(session){
  if(!configured||syncBusy||!session||!session.id||!session.token)return;
  const answers=Array.isArray(session.answers)?session.answers:fullPrefix(session);
  if(!answers.length||answers.length>questions.length)return;
  syncBusy=true;lastSyncAttempt=Date.now();
  try{
   await fetch(WEB_APP_URL,{
    method:'POST',mode:'no-cors',redirect:'follow',keepalive:false,
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({id:session.id,token:session.token,name:session.name,answers})
   });
   // no-cors ha risposta opaca: confermare solo leggendo il record dal foglio.
   setTimeout(()=>pollShared(true),1800);
  }catch(_){sharedStatus='error'}
  finally{syncBusy=false}
 }
 function maybeSync(force=false){
  if(!configured||syncBusy||Date.now()-lastSyncAttempt<4000)return;
  const pending=state.outbox[0];
  if(pending){postCheckpoint(pending);return}
  const s=state.current;
  if(!s)return;
  const count=fullPrefix(s).length;
  if(count>0&&(force||count===25||count%5===0)&&(count>(s.remoteAck||0)))
   postCheckpoint(s);
 }

 const fresh=()=>({players:[],current:null,outbox:[]});
 const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return v&&Array.isArray(v.players)?v:fresh()}catch(_){return fresh()}};
 let state=read();
 if(!Array.isArray(state.outbox))state.outbox=[];
 if(state.current&&configured){ensureIds(state.current)}
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){root.insertAdjacentHTML('beforeend','<p role="alert">Il browser non permette di salvare i risultati.</p>')}};
 const ranks=()=>state.players.slice().sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'it'));
 const rankEntries=()=>configured&&sharedStatus==='ok'
   ?sharedRows.slice().sort((a,b)=>b.score-a.score||b.answered-a.answered||a.name.localeCompare(b.name,'it'))
   :configured?[]:ranks();
 const current=()=>state.current;
 const score=()=>bank.score(current().answers);
 const answered=()=>Object.keys(current().answers).length;
 function leaderboard() {
  const ranked=rankEntries();
  return '<div class="score-wrap"><table class="score-table"><thead><tr><th>Pos.</th><th>Partecipante</th><th>Punti</th></tr></thead><tbody>'+
   (ranked.length?ranked.map((p,i)=>'<tr><td class="rank">'+(i+1)+'</td><td>'+esc(p.name)+(p.complete?'':' <small>('+Number(p.answered||0)+'/25)</small>')+'</td><td>'+Number(p.score)+'</td></tr>').join(''):'<tr><td colspan="3">Nessun punteggio disponibile.</td></tr>')+'</tbody></table></div>';
 }
 function controls() {return '<div class="btn-row"><button class="btn secondary" data-action="home">Torna al menu</button></div>';}
 // QR verificato: https://halmob01.github.io/quiz-ele-epica/?gioca=1
 // Matrice incorporata: nessun servizio esterno, QR utilizzabile anche offline.
 const QR_JOIN_URL='https://halmob01.github.io/quiz-ele-epica/?gioca=1';
 const QR_JOIN_ROWS=`000000000000
000000000000
000000000000
000000000000
01fd7ec6c7f0
01051f875410
017480be75d0
0174fd4b95d0
017415f3c5d0
0104ab2cd410
01fd555557f0
0000a595b000
008755555830
0013102bd9a0
007f3ed4f670
01db672647b0
0165c68536a0
0192c5363a60
0174bca9b290
011b6a204fd0
007eb6fa9d50
0062f5cd3a00
0105e4f2f050
00ea06e50600
00062f95cfd0
000836667300
0067ac2824f0
01b0d1976e30
01e7f6e3dca0
0163597ed400
0176ebe40670
0141d95169f0
013e9977dff0
0001157a91a0
01fd135215f0
0104ec991180
0174a3fdff50
0174d214f4a0
0174c9970ad0
01057c065e90
01fcc9f11c90
000000000000
000000000000
000000000000
000000000000`.trim().split(/\s+/);
 function joinQrSvg() {
  const path=[];
  for(let y=0;y<QR_JOIN_ROWS.length;y++){
   const row=BigInt('0x'+QR_JOIN_ROWS[y]);
   let begin=-1;
   for(let x=0;x<=45;x++){
    const dark=x<45 && (row & (1n << BigInt(44-x)))!==0n;
    if(dark&&begin<0)begin=x;
    if(!dark&&begin>=0){
     path.push('M'+begin+' '+y+'h'+(x-begin)+'v1H'+begin+'z');
     begin=-1;
    }
   }
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" aria-hidden="true" focusable="false" shape-rendering="crispEdges">'+
   '<rect width="45" height="45" fill="#fff"/><path fill="#211d2a" d="'+path.join('')+'"/></svg>';
 }
 function renderHome() {
  root.innerHTML='<section class="home-intro"><div class="hero"><span class="kicker">LETTERATURA · LINGUAGGIO, COMUNITÀ, MEMORIA</span>'+
  '<h1>LE VOCI <em>DELL’EPICA</em></h1>'+
  '<p class="lead">25 domande, quattro alternative ciascuna. Il punteggio cambia dopo ogni risposta. Confrontati con la classe nella classifica condivisa.</p>'+
  '<div class="hero-art" aria-hidden="true"><span>I</span><span>II</span><span>III</span><span>IV</span></div></div>'+ 
  '<aside class="qr-invite"><span class="kicker">ENTRA DAL TELEFONO</span>'+ 
  '<a class="qr-invite-link" href="'+QR_JOIN_URL+'" aria-label="Apri il quiz sul telefono">'+joinQrSvg()+'</a>'+ 
  '<strong>INQUADRA E GIOCA</strong><p>Inserisci il tuo nome e inizia.</p></aside></section>'+
  '<div class="button-grid"><button class="action-card" data-action="'+(current()?'resume':'new')+'"><small>01 · Il torneo</small><strong>'+(current()?'RIPRENDI IL QUIZ':'INIZIA IL QUIZ')+'</strong><span>'+(current()?'Continua la partita interrotta.':'Inserisci un nome e comincia.')+'</span></button>'+
  '<button class="action-card ghost" data-action="leaderboard"><small>02 · Punteggi</small><strong>CLASSIFICA</strong><span>Consulta i risultati già completati.</span></button></div>'+
  '';
 }
 function renderNew(error='') {
  root.innerHTML='<section class="panel"><span class="kicker">NUOVO PARTECIPANTE</span><h1>COME TI CHIAMI?</h1>'+
   '<p class="lead">Usa il nome o un soprannome. Le 25 domande saranno le stesse per tutti.</p>'+
   '<form id="start-form" class="form-grid"><div class="field"><label for="player-name">Nome per la classifica</label><input id="player-name" name="player" maxlength="24" required autocomplete="off" placeholder="Es. Alex"></div>'+
   (error?'<p role="alert" class="feedback-error">'+esc(error)+'</p>':'')+
   '<div class="btn-row"><button type="submit" class="btn">Comincia</button><button type="button" data-action="home" class="btn secondary">Indietro</button></div></form>'+
   '<p class="note-small">Rispondi a una domanda per volta. Non puoi cambiare una risposta già confermata.</p></section>';
 }
 function progress(n) {
  return '<div class="stepbar" aria-label="Avanzamento '+n+' su '+questions.length+'">'+questions.map((_,i)=>'<i class="'+(i<n?'done':i===n?'current':'')+'"></i>').join('')+'</div>';
 }
 function scoreboard() {
  return '<div class="live-strip" aria-live="polite"><span><b>'+esc(current().name)+'</b> · '+answered()+' / '+questions.length+' risposte</span>'+
   '<strong>'+score()+' <small>/ '+bank.MAX_SCORE+' punti</small></strong></div>';
 }
 function renderQuestion() {
  const s=current(), q=questions[s.index], chosen=s.answers[q.id], hasAnswer=chosen!==undefined;
  const opts=bank.shuffledOptions(q,s.seed);
  root.innerHTML='<div class="quiz-top"><button type="button" class="btn secondary tiny" data-action="back">← Indietro</button><span class="kicker">'+esc(q.topic)+' · '+esc(q.difficulty)+'</span><span class="tag">DOMANDA '+(s.index+1)+' / '+questions.length+'</span></div>'+
   scoreboard()+progress(s.index)+
   '<section class="question-area"><h2 class="question-stem">'+esc(q.prompt)+'</h2><div class="answers">'+
   opts.map((o,i)=>'<button class="answer'+(hasAnswer&&o.id===chosen?' selected':'')+(hasAnswer&&o.id===q.answer?' right':'')+(hasAnswer&&o.id===chosen&&chosen!==q.answer?' wrong':'')+'" type="button" data-choice="'+esc(o.id)+'" data-action="answer" '+(hasAnswer?'disabled':'')+'><span class="answer-key">'+('ABCD'[i])+'</span><span>'+esc(o.text)+'</span></button>').join('')+
   '</div>'+
   (hasAnswer?'<div class="feedback-card" role="status"><strong>'+(chosen===q.answer?'RISPOSTA CORRETTA · +100 PUNTI':'RISPOSTA ERRATA · +0 PUNTI')+'</strong><p>'+esc(q.explanation)+'</p></div>'+
   '<div class="btn-row"><button type="button" class="btn" data-action="next">'+(s.index===questions.length-1?'Termina e vai alla classifica':'Prossima domanda')+'</button></div>':
   '<p class="note-small">Scegli una sola risposta. Il punteggio si aggiornerà immediatamente.</p>')+
   '</section>';
 }
 function renderBoard() {
  root.innerHTML='<section class="panel wide"><span class="kicker">RISULTATI · '+(configured?'GOOGLE SHEETS':'DISPOSITIVO')+'</span><h1>CLASSIFICA</h1>'+
    '<p class="lead">Ogni risposta corretta vale 100 punti. Il massimo è '+bank.MAX_SCORE+' punti.</p>'+
    (configured?'<div class="feedback-info">'+(sharedStatus==='ok'?'Classifica condivisa · aggiornamento ogni 10 secondi':sharedStatus==='error'?'Connessione al foglio non disponibile: ricontrolla il collegamento.':'In collegamento con Google Sheets…')+(state.outbox.length?' · '+state.outbox.length+' risultato/i in attesa di conferma':'')+'</div>':'<p class="note-small">Classifica locale: il foglio non è ancora collegato.</p>')+
    leaderboard()+'<div class="btn-row"><button type="button" class="btn" data-action="new">Nuovo partecipante</button>'+
    '<button type="button" class="btn secondary" data-action="home">Menu</button>'+
    (configured?'<button type="button" class="btn secondary" data-action="refresh">Aggiorna adesso</button>':'<button type="button" class="btn secondary" data-action="reset">Azzera classifica locale</button>')+'</div>'+
    '</section>';
 }
 function renderEnd() {
  const s=current(), scoreValue=score();
  root.innerHTML='<section class="panel wide"><span class="kicker">25 / 25 · TORNEO COMPLETATO</span><h1>'+esc(s.name)+'</h1>'+
   '<p class="lead">Hai risposto a tutte le domande. Ecco il risultato da registrare nella classifica.</p>'+
   '<div class="room-code">'+scoreValue+' <span style="font-size:.38em">/ '+bank.MAX_SCORE+'</span></div>'+
   '<p>'+Math.round(scoreValue/bank.MAX_SCORE*100)+'% di risposte corrette.</p>'+
   '<div class="btn-row"><button type="button" data-action="back" class="btn secondary">← Indietro</button><button type="button" data-action="save-result" class="btn">Registra e mostra la classifica</button></div></section>';
 }
 function render() {
  if(current() && screen!=='home'){if(current().index>=questions.length)renderEnd();else renderQuestion();return}
  if(screen==='new')renderNew();else if(screen==='board')renderBoard();else renderHome();
 }
 let screen=state.current?'playing':'home';
 function start(name) {
  if(current())return;
  const normalized=safeName(name);
  if(!normalized)return renderNew('Inserisci un nome.');
  state.current={name:normalized,index:0,answers:{},seed:'epica-2026',id:freshId(),token:freshToken(),remoteAck:0};
  screen='playing';save();render();
 }
 function act(action,choice) {
  if(action==='home'){screen='home';return render()}
  if(action==='new'){if(current())return render();screen='new';return render()}
  if(action==='resume'){screen='playing';return render()}
  if(action==='back'){
   const s=current();
   if(!s){screen='home';return render()}
   if(s.index>0){s.index--;screen='playing';save();return render()}
   screen='home';return render();
  }
  if(action==='leaderboard'){if(current())return render();screen='board';return render()}
  if(action==='answer'){
   const s=current();if(!s||s.index>=questions.length)return;
   const q=questions[s.index];if(Object.prototype.hasOwnProperty.call(s.answers,q.id))return;
   if(!q.options.some(o=>o.id===choice))return;
   s.answers[q.id]=choice;save();maybeSync();return render();
  }
  if(action==='next'){
   const s=current();if(!s||s.index>=questions.length)return;
   if(!Object.prototype.hasOwnProperty.call(s.answers,questions[s.index].id))return;
   s.index++;save();maybeSync();return render();
  }
  if(action==='save-result'){
   const s=current();if(!s||s.index<questions.length||answered()!==questions.length)return;
   state.players.push({name:s.name,score:score(),correct:score()/bank.POINTS});
   if(configured)state.outbox.push({id:s.id,token:s.token,name:s.name,answers:fullPrefix(s)});
   state.current=null;screen='board';save();maybeSync(true);pollShared(true);return render();
  }
  if(action==='refresh'){pollShared(true);return}
  if(action==='reset'){
   if(!confirm('Eliminare tutti i risultati della classifica?'))return;
   state=fresh();screen='board';save();return render();
  }
 }
 // Il marchio è fuori da #app: senza questo handler il link ricaricherebbe
 // la pagina e riprenderebbe la partita invece di mostrare la home.
 const brandLink=document.querySelector('.wordmark');
 if(brandLink)brandLink.addEventListener('click',ev=>{
  if(ev.button!==0||ev.metaKey||ev.ctrlKey||ev.shiftKey||ev.altKey)return;
  ev.preventDefault();
  act('home');
 });
 root.addEventListener('click',ev=>{const b=ev.target.closest('[data-action]');if(b&&!b.disabled&&root.contains(b))act(b.dataset.action,b.dataset.choice)});
 root.addEventListener('submit',ev=>{if(ev.target.id==='start-form'){ev.preventDefault();start(ev.target.elements.player.value)}});
 if(configured){
  pollShared(true);
  maybeSync(true);
  setInterval(()=>{
   if(!document.hidden){pollShared();maybeSync()}
  },10000);
  document.addEventListener('visibilitychange',()=>{
   if(!document.hidden){pollShared(true);maybeSync(true)}
  });
 }
 const startParams=new URLSearchParams(location.search);
 if(!state.current && startParams.has('classifica'))screen='board';
 else if(!state.current && startParams.has('gioca'))screen='new';
 render();
})();