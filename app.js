/* Le voci dell'epica — demo locale + partita realtime Firebase.
   Contenuto separato in questions.js; interfaccia priva di dipendenze di build. */
(function () {
  'use strict';
  const el = document.getElementById('app');
  const bank = window.EpicaQuiz;
  const qs = bank.QUESTIONS;
  const DURATION = 35000;
  const ABC = ['A', 'B', 'C', 'D'];
  const SDK = '13.1.0';
  let screen = 'home';
  let demo = { players: [], name: '', index: 0, answers: {}, phase: 'entry' };
  let firebase = null, roomCode = '', role = '', user = null;
  let roomState = null, roomPlayers = {}, roomScores = {}, roomResult = null;
  let response = null, currentCount = 0, serverOffset = 0;
  let stopRoom = [], stopAnswers = null, answerIndex = -1;
  let busy = false, errorMessage = '';
  const safe = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const msg = text => text ? '<div class="feedback-error" role="alert">' + safe(text) + '</div>' : '';
  const short = s => String(s || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  const configAvailable = () => !!(window.QUIZ_FIREBASE_CONFIG && window.QUIZ_FIREBASE_CONFIG.apiKey && window.QUIZ_FIREBASE_CONFIG.databaseURL && window.QUIZ_FIREBASE_CONFIG.projectId);
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
  const rootUrl = () => location.href.split('?')[0].split('#')[0];
  const escCode = code => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  const clock = () => Date.now() + serverOffset;
  const roomLink = () => rootUrl() + '?room=' + encodeURIComponent(roomCode);
  const namesList = players => Object.entries(players || {}).map(([id,p]) => ({id, name:String(p && p.name || 'Studente').slice(0,24)}));
  const order = (a,b) => a.name.localeCompare(b.name, 'it');
  function leaderboard(players, scores) {
    return namesList(players).map(p => ({...p, score:Number(scores[p.id] || 0)}))
      .sort((a,b) => b.score-a.score || order(a,b));
  }
  function bar(index) {
    return '<div class="stepbar" aria-label="Domanda ' + (index+1) + ' di 4">' +
      qs.map((_,i)=>'<i class="' + (i < index ? 'done' : i === index ? 'current' : '') + '"></i>').join('')+'</div>';
  }
  function shuffle(q, seed) {
    let h = 2166136261;
    const text = seed + ':' + q.id;
    for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h,16777619); }
    const arr = q.options.slice();
    for (let i=arr.length-1;i>0;i--) {
      h=(Math.imul(h,1664525)+1013904223)>>>0;
      const j=h%(i+1);
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }
  function opts(q, seed, {interactive=false, selected=null, reveal=false}={}) {
    const list = shuffle(q, seed);
    return '<div class="answers">' + list.map((o,i) => {
      const classes = ['answer'];
      if (selected === o.id) classes.push('selected');
      if (reveal && o.id === q.answer) classes.push('right');
      if (reveal && selected === o.id && selected !== q.answer) classes.push('wrong');
      const disabled = !interactive ? 'disabled' : '';
      return '<button type="button" class="' + classes.join(' ') + '" ' +
        (interactive ? 'data-action="answer" data-choice="' + safe(o.id) + '" ' : '') + disabled +
        '><span class="answer-key">' + ABC[i] + '</span><span>' + safe(o.text) + '</span></button>';
    }).join('') + '</div>';
  }
  function board(players, scores, limit=40) {
    const ranking = leaderboard(players,scores).slice(0,limit);
    return '<div class="score-wrap"><table class="score-table"><thead><tr><th>Pos.</th><th>Partecipante</th><th>Punti</th></tr></thead><tbody>' +
      (ranking.length ? ranking.map((p,i) => '<tr><td class="rank">' + (i+1) + '</td><td>' + safe(p.name) + '</td><td>' + p.score + '</td></tr>').join('')
      : '<tr><td colspan="3">Nessun partecipante ancora.</td></tr>') +
      '</tbody></table></div>';
  }
  function render() {
    if (screen === 'home') return renderHome();
    if (screen === 'demo') return renderDemo();
    if (screen === 'live') return renderLive();
    if (screen === 'setup') return renderSetup();
  }
  function renderHome() {
    const code = escCode(new URLSearchParams(location.search).get('room'));
    el.innerHTML = '<section class="hero">' +
      '<span class="kicker">LETTERATURA · IL MONDO DEGLI EROI</span>' +
      '<h1>LE VOCI <em>DELL’EPICA</em></h1>' +
      '<p class="lead">Gilgamesh, Odisseo, Enea, Rostam e Abū Zayd. Quattro domande, quattro possibilità per ogni scelta. Una classifica per tutta la classe.</p>' +
      '<div class="hero-art" aria-hidden="true"><span>I</span><span>II</span><span>III</span><span>IV</span></div>' +
      '</section><div class="button-grid">' +
      '<button class="action-card" data-action="join-page"><small>01 · Studente</small><strong>ENTRA IN PARTITA</strong><span>Scrivi il codice e scegli un nome.</span></button>' +
      '<button class="action-card" data-action="host"><small>02 · Docente</small><strong>CREA UNA PARTITA</strong><span>Gestisci il tempo, le domande e la classifica.</span></button>' +
      '<button class="action-card ghost" data-action="demo"><small>03 · Prova locale</small><strong>GIOCA SU UN DISPOSITIVO</strong><span>Prova il quiz passando il telefono tra i partecipanti.</span></button>' +
      (configAvailable() && load('epica-last-host','') ? '<button class="action-card ghost" data-action="resume"><small>04 · Docente</small><strong>RIPRENDI LA PARTITA</strong><span>Rientra nella stanza ' + safe(load('epica-last-host','')) + ' dopo una chiusura accidentale.</span></button>' : '') +
      '</div>' +
      '<p class="notice">' + (configAvailable()
        ? 'Modalità online configurata. Per una partita condivisa tutti aprono questo sito dal proprio dispositivo.'
        : 'La modalità locale funziona subito. Per la partita simultanea su più telefoni occorre configurare Firebase come descritto nel README.') + '</p>';
    if (code) { screen='setup'; renderSetup(code); }
  }
  function renderSetup(prefill='') {
    const code = prefill || escCode(new URLSearchParams(location.search).get('room'));
    el.innerHTML = '<section class="panel"><div class="panel-head"><span class="kicker">PARTECIPA · LE VOCI DELL’EPICA</span><h1>ENTRA IN CLASSE</h1><p class="lead">Per entrare bastano il codice della partita e un nome o soprannome.</p></div>' +
      '<form class="form-grid" id="join-form"><div class="field"><label for="code">Codice partita</label><input class="code-input" id="code" maxlength="6" autocomplete="off" autocapitalize="characters" value="' + safe(code) + '" required></div>' +
      '<div class="field"><label for="nickname">Nome visualizzato</label><input id="nickname" maxlength="24" autocomplete="nickname" placeholder="Es. Alex" required></div>' +
      msg(errorMessage) + '<div class="btn-row"><button class="btn" type="submit">Entra nella partita</button><button class="btn secondary" type="button" data-action="home">Indietro</button></div></form>' +
      '<p class="note-small">Usa preferibilmente un soprannome: i nomi e i punteggi sono visibili agli altri partecipanti della stanza.</p></section>';
  }
  function renderDemo() {
    const ranking = [...demo.players].sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name,'it'));
    if (demo.phase === 'entry' || demo.phase === 'board') {
      el.innerHTML = '<section class="panel wide"><span class="kicker">MODALITÀ LOCALE · UN SOLO DISPOSITIVO</span>' +
        '<h1>IL TORNEO DELL’EPICA</h1><p class="lead">Ogni partecipante risponde alle stesse quattro domande, poi passa il dispositivo al successivo. La classifica rimane in questo browser.</p>' +
        '<form id="demo-form" class="form-grid"><div class="field"><label for="demo-name">Nome del prossimo partecipante</label><input id="demo-name" maxlength="24" placeholder="Inserisci un nome" required></div>' +
        msg(errorMessage) + '<div class="btn-row"><button class="btn" type="submit">Inizia le 4 domande</button><button class="btn secondary" data-action="home" type="button">Torna all’inizio</button></div></form>' +
        (ranking.length ? '<h2>CLASSIFICA</h2>' + board(Object.fromEntries(ranking.map((p,i)=>[String(i),p])), Object.fromEntries(ranking.map((p,i)=>[String(i),p.score]))) : '') +
        (ranking.length ? '<button class="btn secondary tiny" data-action="reset-demo">Azzera il torneo</button>' : '') +
        '<p class="note-small">Questa è una prova locale: i punteggi non vengono condivisi fra telefoni.</p></section>';
      return;
    }
    if (demo.phase === 'question') {
      const q=qs[demo.index];
      el.innerHTML = '<div class="quiz-top"><span class="kicker">PROVA LOCALE · ' + safe(demo.name) + '</span><span class="tag">DOMANDA ' + (demo.index+1) + ' / 4</span></div>' +
        bar(demo.index) + '<section class="question-area"><h2 class="question-stem">' + safe(q.prompt) + '</h2>' +
        opts(q,'DEMO',{interactive:true}) +
        '<p class="note-small">Scegli una risposta. Non potrai modificarla.</p></section>';
      return;
    }
    if (demo.phase === 'result') {
      const score=bank.score(demo.answers);
      el.innerHTML = '<section class="panel"><span class="kicker">PARTITA CONCLUSA</span><h1>' + safe(demo.name) + '</h1>' +
        '<p class="lead">Hai terminato le quattro domande.</p><div class="room-code">' + score + ' <span style="font-size:.3em">/ 400</span></div>' +
        '<div class="feedback-card"><strong>CHE COSA HAI IMPARATO?</strong><p>Per ogni risposta puoi riprendere gli episodi di Gilgamesh, Odisseo, Enea, Rostam e Abū Zayd dal testo.</p></div>' +
        '<div class="btn-row"><button class="btn" data-action="demo-save">Salva e aggiorna la classifica</button></div></section>';
    }
  }
  async function startFirebase() {
    if (!configAvailable()) throw Error('Partita online non ancora configurata. Consulta il README per attivarla.');
    if (firebase) return firebase;
    const v=SDK, p='https://www.gstatic.com/firebasejs/' + v + '/';
    const [app, auth, database] = await Promise.all([
      import(p+'firebase-app.js'), import(p+'firebase-auth.js'), import(p+'firebase-database.js')
    ]);
    const application = app.initializeApp(window.QUIZ_FIREBASE_CONFIG);
    const a = auth.getAuth(application);
    await a.authStateReady();
    user = a.currentUser || (await auth.signInAnonymously(a)).user;
    const db = database.getDatabase(application);
    firebase = {app,auth,database,db};
    database.onValue(database.ref(db,'.info/serverTimeOffset'), snap => {serverOffset = Number(snap.val()) || 0;});
    return firebase;
  }
  const rref = suffix => firebase.database.ref(firebase.db, 'rooms/' + roomCode + (suffix ? '/' + suffix : ''));
  function cleanup() {
    for(const unsubscribe of stopRoom.splice(0)) try {unsubscribe();} catch (_) {}
    if (stopAnswers) {stopAnswers();stopAnswers=null;}
    answerIndex=-1; roomCode='';roomState=null;roomPlayers={};roomScores={};roomResult=null;response=null;currentCount=0;
  }
  async function createRoom() {
    if (busy) return; busy=true;errorMessage='';
    try {
      const f = await startFirebase();
      const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code='';
      for(let attempt=0;attempt<8;attempt++) {
        const bytes=new Uint8Array(6);
        crypto.getRandomValues(bytes);
        const candidate=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
        const snap=await f.database.get(f.database.ref(f.db,'rooms/'+candidate+'/meta'));
        if(!snap.exists()) {code=candidate;break;}
      }
      if (!code) throw Error('Impossibile ottenere un codice libero. Riprova.');
      const data = {meta:{hostUid:user.uid,createdAt:f.database.serverTimestamp()},state:{phase:'lobby',index:0}};
      await f.database.set(f.database.ref(f.db,'rooms/'+code),data);
      save('epica-last-host',code);
      bindRoom(code,'host');
    } catch (e) {errorMessage=e.message || 'Impossibile creare la partita.';screen='setup';renderErrorPage('CREAZIONE NON RIUSCITA',errorMessage);}
    finally {busy=false;}
  }
  async function resumeHost() {
    if(busy) return;
    busy=true;errorMessage='';
    try {
      const f=await startFirebase(), code=escCode(load('epica-last-host',''));
      if(!code) throw Error('Non è stata salvata una stanza precedente.');
      const snap=await f.database.get(f.database.ref(f.db,'rooms/'+code+'/meta'));
      if(!snap.exists() || snap.val().hostUid!==user.uid)
        throw Error('La stanza non esiste o questo dispositivo non è quello che l’ha creata.');
      bindRoom(code,'host');
    }catch(e){errorMessage=e.message;renderErrorPage('IMPOSSIBILE RIPRENDERE',errorMessage);}
    finally{busy=false;}
  }
  async function joinRoom(code,name) {
    if (busy) return;busy=true;errorMessage='';
    try {
      const f=await startFirebase();
      code=escCode(code);name=short(name);
      if(code.length!==6 || name.length<1) throw Error('Inserisci un codice di 6 caratteri e un nome.');
      const base=f.database.ref(f.db,'rooms/'+code);
      const [meta,state,old]=await Promise.all([
        f.database.get(f.database.ref(f.db,'rooms/'+code+'/meta')),
        f.database.get(f.database.ref(f.db,'rooms/'+code+'/state')),
        f.database.get(f.database.ref(f.db,'rooms/'+code+'/players/'+user.uid))
      ]);
      if(!meta.exists()) throw Error('Codice non trovato. Controllalo con il docente.');
      if(!old.exists() && (!state.exists() || state.val().phase!=='lobby')) throw Error('La partita è già iniziata: non è possibile aggiungere nuovi partecipanti.');
      if(!old.exists()) await f.database.set(f.database.ref(f.db,'rooms/'+code+'/players/'+user.uid),
        {name,joinedAt:f.database.serverTimestamp()});
      save('epica-last-join',{code,name});
      bindRoom(code,'player');
    } catch(e) {errorMessage=e.message || 'Non è stato possibile entrare nella partita.';screen='setup';renderSetup(code);}
    finally {busy=false;}
  }
  function bindRoom(code,newRole) {
    cleanup();
    roomCode=code;role=newRole;screen='live';errorMessage='';
    const {database:d}=firebase;
    stopRoom.push(d.onValue(rref('state'),snap=>{roomState=snap.val();handleStateChange();},onRoomError));
    stopRoom.push(d.onValue(rref('players'),snap=>{roomPlayers=snap.val()||{};render();},onRoomError));
    stopRoom.push(d.onValue(rref('scores'),snap=>{roomScores=snap.val()||{};render();},onRoomError));
    render();
  }
  function onRoomError(e) {errorMessage=e && e.message || 'Connessione non disponibile.';render();}
  async function handleStateChange() {
    roomResult=null;
    const s=roomState;
    if(!s) {render();return;}
    if(s.phase==='question') {
      attachAnswers(s.index);
    } else {
      if (stopAnswers) {stopAnswers();stopAnswers=null;}
      answerIndex=-1;
    }
    if(s.phase==='reveal' || s.phase==='finished') {
      const index=s.index;
      try {
        const snapshot=await firebase.database.get(rref('results/'+index));
        if(roomState && roomState.index===index) roomResult=snapshot.val();
      } catch (_) {roomResult=null;}
    }
    render();
  }
  function attachAnswers(index) {
    if (answerIndex===index) return;
    if (stopAnswers) stopAnswers();
    answerIndex=index;response=null;currentCount=0;
    const path=role==='host' ? 'submissions/'+index : 'submissions/'+index+'/'+user.uid;
    stopAnswers=firebase.database.onValue(rref(path),snapshot=>{
      if(role==='host') currentCount=snapshot.exists()?Object.keys(snapshot.val()||{}).length:0;
      else response=snapshot.val();
      render();
    },onRoomError);
  }
  function renderErrorPage(title,description) {
    el.innerHTML='<section class="panel"><span class="kicker">PARTITA ONLINE</span><h1>'+safe(title)+'</h1><p class="lead">'+safe(description)+'</p>' +
      '<button class="btn secondary" data-action="home">Torna all’inizio</button></section>';
  }
  function renderLive() {
    if(!roomState) {
      el.innerHTML='<section class="loading"><span class="kicker">STANZA '+safe(roomCode)+'</span><h2>Connessione alla partita…</h2></section>';
      return;
    }
    const s=roomState, count=Object.keys(roomPlayers).length;
    if(s.phase==='lobby') {
      if(role==='host') {
        el.innerHTML='<section class="panel wide"><span class="kicker">SALA D’ATTESA · DOCENTE</span><h1>LA CLASSE SI PREPARA</h1>' +
          '<div class="room-flex"><div><p class="subhead">Codice di accesso da mostrare alla classe</p><div class="room-code">'+safe(roomCode)+'</div>' +
          '<div class="btn-row"><button class="btn secondary tiny" data-action="copy-link">Copia link d’invito</button></div>' +
          '<p class="note-small" style="margin-top:12px">Ogni studente apre il sito, inserisce il codice e un soprannome.</p></div>' +
          '<div class="stat-board"><span class="eyebrow">PARTECIPANTI CONNESSI</span><strong>'+count+'</strong>' +
          '<div class="people">'+namesList(roomPlayers).map(p=>'<span class="person">'+safe(p.name)+'</span>').join('')+'</div></div></div>' +
          msg(errorMessage)+'<div class="btn-row"><button class="btn" data-action="start-round" '+(!count?'disabled':'')+'>Avvia la prima domanda</button><button class="btn secondary" data-action="home">Esci</button></div></section>';
      } else {
        el.innerHTML='<section class="panel"><span class="kicker">SEI ENTRATO · STANZA '+safe(roomCode)+'</span>' +
          '<h1>CI SIAMO!</h1><p class="lead">Il docente avvierà la partita. Sul tuo telefono appariranno le quattro risposte possibili.</p>' +
          '<div class="feedback-info">Partecipanti presenti: <strong>'+count+'</strong>. Puoi lasciare questa pagina aperta.</div>' +
          '<p class="note-small">Resta su questa schermata: la prima domanda arriverà automaticamente.</p></section>';
      }
      return;
    }
    if(s.phase==='question') return renderQuestion();
    if(s.phase==='reveal') return renderReveal();
    if(s.phase==='finished') return renderFinished();
    renderErrorPage('STATO NON RICONOSCIUTO','Aggiorna la pagina o chiedi al docente di creare una nuova stanza.');
  }
  function renderQuestion() {
    const s=roomState,q=qs[s.index],remaining=Math.max(0,s.deadlineAt-clock());
    const ended=remaining<=0,selected=response&&response.choice;
    const canAnswer=role==='player'&&!selected&&!ended;
    el.innerHTML='<div class="quiz-top"><span class="kicker">STANZA '+safe(roomCode)+' · '+(role==='host'?'DOCENTE':'STUDENTE')+'</span>' +
      '<span class="tag">DOMANDA '+(s.index+1)+' / 4</span></div>' + bar(s.index) +
      '<section class="question-area"><div class="quiz-top"><span class="eyebrow">'+safe(q.objective)+'</span><div id="timer" class="timer '+(ended?'expired':'')+'">'+Math.ceil(remaining/1000)+'</div></div>' +
      '<h2 class="question-stem">'+safe(q.prompt)+'</h2>'+
      opts(q,roomCode,{interactive:canAnswer,selected:selected}) +
      (role==='host'
        ? '<div class="stats-line"><span class="eyebrow">RISPOSTE ARRIVATE</span><strong>'+currentCount+' / '+Object.keys(roomPlayers).length+'</strong></div>' +
          '<div class="btn-row"><button class="btn" data-action="reveal">Mostra la soluzione</button></div>'
        : selected
          ? '<div class="feedback-info">Risposta registrata. La soluzione comparirà quando il docente chiuderà il turno.</div>'
          : ended ? '<div class="notice">Tempo terminato. Attendi la soluzione.</div>'
          : '<p class="note-small">Hai una sola risposta. Dopo la scelta non puoi modificarla.</p>') +
      msg(errorMessage)+'</section>';
  }
  function renderReveal() {
    const s=roomState,q=qs[s.index],result=roomResult,entries=shuffle(q,roomCode);
    const total=result&&result.counts?Object.values(result.counts).reduce((a,b)=>a+Number(b||0),0):0;
    el.innerHTML='<div class="quiz-top"><span class="kicker">STANZA '+safe(roomCode)+'</span><span class="tag success">SOLUZIONE · '+(s.index+1)+'/4</span></div>' +bar(s.index)+
      '<section class="question-area"><h2 class="question-stem">'+safe(q.prompt)+'</h2>'+
      opts(q,roomCode,{selected:response&&response.choice,reveal:true})+
      '<div class="feedback-card"><strong>'+safe(q.options.find(o=>o.id===q.answer).text)+'</strong><p>'+safe(q.explanation)+'</p></div>' +
      (result?'<div class="distribution"><span class="eyebrow">COME HA RISPOSTO LA CLASSE</span>' +
        entries.map((o,i)=>'<div class="distribution-row"><b>'+ABC[i]+'</b><div class="bar-bg"><div class="bar-fill" style="width:'+(total?Math.round((result.counts[o.id]||0)/total*100):0)+'%"></div></div><span>'+Number(result.counts[o.id]||0)+'</span></div>').join('')+'</div>':'<p>Caricamento dei risultati…</p>')+
      '<h2>CLASSIFICA AGGIORNATA</h2>'+board(roomPlayers,roomScores,10)+
      (role==='host'?'<div class="btn-row"><button class="btn" data-action="next-round">'+(s.index===3?'Vai alla classifica finale':'Prossima domanda')+'</button></div>':
        '<div class="feedback-info">Il docente passerà alla prossima domanda.</div>')+msg(errorMessage)+'</section>';
  }
  function renderFinished() {
    const ranking=leaderboard(roomPlayers,roomScores);
    el.innerHTML='<section class="completion"><span class="kicker">TORNEO CONCLUSO · QUATTRO DOMANDE</span><h1>LE VOCI DELL’EPICA</h1>' +
      '<p class="lead">Un viaggio tra le scelte degli eroi e i valori delle loro comunità.</p>' +
      (ranking.length?'<div class="podium">1° · '+safe(ranking[0].name)+'</div>':'')+
      board(roomPlayers,roomScores)+
      '<p class="note-small">Punteggio di gioco, non voto scolastico. Ogni risposta corretta vale 100 punti più un bonus velocità fino a 50.</p>'+
      (role==='host'?'<div class="btn-row"><button class="btn" data-action="host">Nuova partita</button><button class="btn secondary" data-action="home">Torna all’inizio</button></div>':
        '<button class="btn secondary" data-action="home">Torna all’inizio</button>')+
      '</section>';
  }
  function tick() {
    if(screen!=='live'||!roomState||roomState.phase!=='question')return;
    const remaining=Math.max(0,roomState.deadlineAt-clock());
    const target=document.getElementById('timer');
    if(target) {
      const val=Math.ceil(remaining/1000);
      if(target.textContent!==String(val))target.textContent=String(val);
      target.classList.toggle('expired',remaining<=0);
    }
    if(remaining===0 && role==='host'&&!busy) revealRound();
    if(remaining===0 && role==='player') {
      const buttons=el.querySelectorAll('[data-action="answer"]');
      for(const b of buttons) b.disabled=true;
    }
  }
  async function startRound() {
    if(busy || role!=='host')return;
    busy=true;errorMessage='';
    try{
      const now=clock();
      await firebase.database.set(rref('state'),{phase:'question',index:0,startedAt:now,deadlineAt:now+DURATION});
    }catch(e){errorMessage=e.message;render();}
    finally{busy=false;}
  }
  async function sendAnswer(id) {
    if(busy || role!=='player' || !roomState || roomState.phase!=='question' || response)return;
    if(clock()>=roomState.deadlineAt)return;
    const q=qs[roomState.index];
    if(!q.options.some(o=>o.id===id))return;
    busy=true;errorMessage='';
    try{
      await firebase.database.set(rref('submissions/'+roomState.index+'/'+user.uid),
        {choice:id,submittedAt:firebase.database.serverTimestamp()});
      response={choice:id};render();
    }catch(e){errorMessage='Risposta non registrata: '+(e.code==='PERMISSION_DENIED'?'tempo scaduto o risposta già inviata':e.message);render();}
    finally{busy=false;}
  }
  async function revealRound() {
    if(busy || role!=='host' || !roomState || roomState.phase!=='question')return;
    busy=true;errorMessage='';
    const s={...roomState},index=s.index,q=qs[index];
    try{
      const d=firebase.database;
      const [sub,scoreSnap]=await Promise.all([d.get(rref('submissions/'+index)),d.get(rref('scores'))]);
      const submissions=sub.val() || {},points={...(scoreSnap.val()||{})},counts={A:0,B:0,C:0,D:0};
      for(const [uid,answer] of Object.entries(submissions)){
        if(!roomPlayers[uid] || !q.options.some(o=>o.id===answer.choice))continue;
        counts[answer.choice]++;
        if(answer.choice===q.answer){
          const t=Number(answer.submittedAt||s.deadlineAt);
          const bonus=Math.round(50*Math.max(0,Math.min(1,(s.deadlineAt-t)/DURATION)));
          points[uid]=Number(points[uid]||0)+100+bonus;
        }
      }
      await d.set(rref('scores'),points);
      await d.set(rref('results/'+index),{counts,answer:q.answer});
      await d.set(rref('state'),{phase:'reveal',index,startedAt:s.startedAt,deadlineAt:s.deadlineAt});
    }catch(e){errorMessage=e.message;render();}
    finally{busy=false;}
  }
  async function nextRound() {
    if(busy || role!=='host' || !roomState || roomState.phase!=='reveal')return;
    busy=true;errorMessage='';
    try{
      const index=roomState.index;
      if(index===qs.length-1) await firebase.database.set(rref('state'),{phase:'finished',index});
      else {
        const now=clock();
        await firebase.database.set(rref('state'),{phase:'question',index:index+1,startedAt:now,deadlineAt:now+DURATION});
      }
    }catch(e){errorMessage=e.message;render();}
    finally{busy=false;}
  }
  async function copyLink() {
    try{await navigator.clipboard.writeText(roomLink());}
    catch(_){window.prompt('Copia il link di invito',roomLink());}
  }
  async function action(elm) {
    const a=elm.dataset.action;
    if(a==='home'){cleanup();screen='home';errorMessage='';history.replaceState(null,'',rootUrl());return render();}
    if(a==='join-page'){screen='setup';errorMessage='';return render();}
    if(a==='host'){cleanup();return createRoom();}
    if(a==='resume'){cleanup();return resumeHost();}
    if(a==='demo'){cleanup();demo=load('epica-demo-v1',{players:[],name:'',index:0,answers:{},phase:'entry'});
      if(!Array.isArray(demo.players)||!['entry','board'].includes(demo.phase))demo={players:[],name:'',index:0,answers:{},phase:'entry'};
      screen='demo';errorMessage='';return render();}
    if(a==='reset-demo'){demo={players:[],name:'',index:0,answers:{},phase:'entry'};save('epica-demo-v1',demo);return render();}
    if(a==='demo-save') {
      if(demo.phase!=='result')return;
      demo.players.push({name:demo.name,score:bank.score(demo.answers)});
      demo.phase='board';demo.index=0;demo.name='';demo.answers={};
      save('epica-demo-v1',demo);return render();
    }
    if(a==='answer'){
      if(screen==='demo'){
        const q=qs[demo.index],value=elm.dataset.choice;
        if(!q.options.some(o=>o.id===value))return;
        demo.answers[q.id]=value;demo.index++;
        if(demo.index>=qs.length)demo.phase='result';
        return render();
      }
      return sendAnswer(elm.dataset.choice);
    }
    if(a==='copy-link')return copyLink();
    if(a==='start-round')return startRound();
    if(a==='reveal')return revealRound();
    if(a==='next-round')return nextRound();
  }
  el.addEventListener('click', event=>{
    const trigger=event.target.closest('[data-action]');
    if(trigger && el.contains(trigger) && !trigger.disabled) action(trigger).catch(e=>{errorMessage=e.message;render();});
  });
  el.addEventListener('submit', event=>{
    if(event.target.id==='join-form'){
      event.preventDefault();
      const code=document.getElementById('code').value,name=document.getElementById('nickname').value;
      joinRoom(code,name);
    }
    if(event.target.id==='demo-form'){
      event.preventDefault();
      const name=short(document.getElementById('demo-name').value);
      if(!name){errorMessage='Scrivi un nome per iniziare.';return render();}
      demo.name=name;demo.index=0;demo.answers={};demo.phase='question';errorMessage='';render();
    }
  });
  setInterval(tick,250);
  const initial=escCode(new URLSearchParams(location.search).get('room'));
  if(initial){screen='setup';renderSetup(initial);} else render();
})();
