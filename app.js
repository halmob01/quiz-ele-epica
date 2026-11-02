/* Torneo locale, nessun server, nessun account e nessun servizio di fatturazione.
   Ogni studente gioca a turno sullo stesso dispositivo. */
(function () {
 'use strict';
 const root=document.getElementById('app'), bank=window.EpicaQuiz, questions=bank.QUESTIONS;
 const KEY='quiz-ele-epica-local-v2';
 const fresh=()=>({players:[],current:null});
 const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));return v&&Array.isArray(v.players)?v:fresh()}catch(_){return fresh()}};
 let state=read();
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){root.insertAdjacentHTML('beforeend','<p role="alert">Il browser non permette di salvare i risultati.</p>')}};
 const ranks=()=>state.players.slice().sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'it'));
 const current=()=>state.current;
 const score=()=>bank.score(current().answers);
 const answered=()=>Object.keys(current().answers).length;
 function leaderboard() {
  const ranked=ranks();
  return '<div class="score-wrap"><table class="score-table"><thead><tr><th>Pos.</th><th>Partecipante</th><th>Punti</th></tr></thead><tbody>'+
   (ranked.length?ranked.map((p,i)=>'<tr><td class="rank">'+(i+1)+'</td><td>'+esc(p.name)+'</td><td>'+p.score+'</td></tr>').join(''):'<tr><td colspan="3">La classifica è vuota.</td></tr>')+'</tbody></table></div>';
 }
 function controls() {return '<div class="btn-row"><button class="btn secondary" data-action="home">Torna al menu</button></div>';}
 function renderHome() {
  root.innerHTML='<section class="hero"><span class="kicker">LETTERATURA · LINGUAGGIO, COMUNITÀ, MEMORIA</span>'+
  '<h1>LE VOCI <em>DELL’EPICA</em></h1>'+
  '<p class="lead">25 domande, quattro alternative ciascuna. Il punteggio cambia dopo ogni risposta. Alla fine scopri la tua posizione nella classifica.</p>'+
  '<div class="hero-art" aria-hidden="true"><span>I</span><span>II</span><span>III</span><span>IV</span></div></section>'+
  '<div class="button-grid"><button class="action-card" data-action="'+(current()?'resume':'new')+'"><small>01 · Il torneo</small><strong>'+(current()?'RIPRENDI IL QUIZ':'INIZIA IL QUIZ')+'</strong><span>'+(current()?'Continua la partita interrotta.':'Inserisci un nome e comincia.')+'</span></button>'+
  '<button class="action-card ghost" data-action="leaderboard"><small>02 · Punteggi</small><strong>CLASSIFICA</strong><span>Consulta i risultati già completati.</span></button></div>'+
  '<p class="notice">Un solo dispositivo, passato da uno studente all’altro. Risposte e classifica restano in questo browser, anche dopo aver chiuso la pagina. Nessun Firebase e nessun costo di servizio.</p>';
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
  root.innerHTML='<div class="quiz-top"><span class="kicker">'+esc(q.topic)+' · '+esc(q.difficulty)+'</span><span class="tag">DOMANDA '+(s.index+1)+' / '+questions.length+'</span></div>'+
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
  root.innerHTML='<section class="panel wide"><span class="kicker">RISULTATI · UN SOLO DISPOSITIVO</span><h1>CLASSIFICA</h1>'+
    '<p class="lead">Ogni risposta corretta vale 100 punti. Il massimo è '+bank.MAX_SCORE+' punti. In caso di parità, i partecipanti hanno lo stesso punteggio.</p>'+
    leaderboard()+'<div class="btn-row"><button type="button" class="btn" data-action="new">Nuovo partecipante</button>'+
    '<button type="button" class="btn secondary" data-action="home">Menu</button>'+
    '<button type="button" class="btn secondary" data-action="reset">Azzera classifica</button></div>'+
    '<p class="note-small">I risultati non sono voti scolastici e non vengono trasmessi ad alcun server.</p></section>';
 }
 function renderEnd() {
  const s=current(), scoreValue=score();
  root.innerHTML='<section class="panel wide"><span class="kicker">25 / 25 · TORNEO COMPLETATO</span><h1>'+esc(s.name)+'</h1>'+
   '<p class="lead">Hai risposto a tutte le domande. Ecco il risultato da registrare nella classifica.</p>'+
   '<div class="room-code">'+scoreValue+' <span style="font-size:.38em">/ '+bank.MAX_SCORE+'</span></div>'+
   '<p>'+Math.round(scoreValue/bank.MAX_SCORE*100)+'% di risposte corrette.</p>'+
   '<div class="btn-row"><button type="button" data-action="save-result" class="btn">Registra e mostra la classifica</button></div></section>';
 }
 function render() {
  if(current()){if(current().index>=questions.length)renderEnd();else renderQuestion();return}
  if(screen==='new')renderNew();else if(screen==='board')renderBoard();else renderHome();
 }
 let screen='home';
 function start(name) {
  if(current())return;
  const normalized=name.trim().replace(/\s+/g,' ').slice(0,24);
  if(!normalized)return renderNew('Inserisci un nome.');
  state.current={name:normalized,index:0,answers:{},seed:'epica-2026'};
  save();render();
 }
 function act(action,choice) {
  if(action==='home'){screen='home';return render()}
  if(action==='new'){if(current())return render();screen='new';return render()}
  if(action==='resume')return render();
  if(action==='leaderboard'){if(current())return render();screen='board';return render()}
  if(action==='answer'){
   const s=current();if(!s||s.index>=questions.length)return;
   const q=questions[s.index];if(Object.prototype.hasOwnProperty.call(s.answers,q.id))return;
   if(!q.options.some(o=>o.id===choice))return;
   s.answers[q.id]=choice;save();return render();
  }
  if(action==='next'){
   const s=current();if(!s||s.index>=questions.length)return;
   if(!Object.prototype.hasOwnProperty.call(s.answers,questions[s.index].id))return;
   s.index++;save();return render();
  }
  if(action==='save-result'){
   const s=current();if(!s||s.index<questions.length||answered()!==questions.length)return;
   state.players.push({name:s.name,score:score(),correct:score()/bank.POINTS});
   state.current=null;screen='board';save();return render();
  }
  if(action==='reset'){
   if(!confirm('Eliminare tutti i risultati della classifica?'))return;
   state=fresh();screen='board';save();return render();
  }
 }
 root.addEventListener('click',ev=>{const b=ev.target.closest('[data-action]');if(b&&!b.disabled&&root.contains(b))act(b.dataset.action,b.dataset.choice)});
 root.addEventListener('submit',ev=>{if(ev.target.id==='start-form'){ev.preventDefault();start(ev.target.elements.player.value)}});
 render();
})();