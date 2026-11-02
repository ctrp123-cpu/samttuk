// Firebase(Firestore) 연동 — firebase-config.js에 설정이 있고, 연동 코드(room)가 있을 때만 동작
const cfg=window.FIREBASE_CONFIG;
let room=null; try{ room=JSON.parse(localStorage.getItem('samttuk.room')||'null'); }catch{}
if(cfg && room){
  try{
    const V='10.12.2';
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
    const app=initializeApp(cfg); const db=fs.getFirestore(app);
    const base=['rooms',room];
    const S=window.Store; S.room=room;
    const col=n=>fs.collection(db,...base,n), d=(n,id)=>fs.doc(db,...base,n,id);
    // 처음 연결 시 이 폰의 기존 데이터를 올림
    const firstKey='samttuk.migrated.'+room;
    if(!localStorage.getItem(firstKey)){
      for(const [id,v] of Object.entries(S.state.checks)){ const at=typeof v==='number'?v:(v&&v.at)||Date.now(); await fs.setDoc(d('checks',id),{at,by:(v&&v.by)||''}); }
      for(const m of S.state.memos){ await fs.setDoc(d('memos',m.id),{text:m.text,cat:m.cat||'일반',createdAt:m.createdAt||Date.now(),by:m.by||''}); }
      for(const v of (S.state.visits||[])) await fs.setDoc(d('visits',v.id),v);
      const bs=await fs.getDoc(d('meta','budget')); if(!bs.exists()) await fs.setDoc(d('meta','budget'),S.state.budget);
      localStorage.setItem(firstKey,'1');
    }
    S.cloud={
      setCheck:(id,v)=> v? fs.setDoc(d('checks',id),{at:v.at,by:v.by||''}) : fs.deleteDoc(d('checks',id)),
      setMemo:m=> fs.setDoc(d('memos',m.id),{text:m.text,cat:m.cat||'일반',createdAt:m.createdAt,by:m.by||''}),
      delMemo:id=> fs.deleteDoc(d('memos',id)),
      setBudget:b=> fs.setDoc(d('meta','budget'),JSON.parse(JSON.stringify(b))),
      setDue:v=> fs.setDoc(d('meta','settings'),{due:v},{merge:true}),
      setDoc:(n,id,v)=> fs.setDoc(d(n,id),v),
      delDoc:(n,id)=> fs.deleteDoc(d(n,id))
    };
    const ss=await fs.getDoc(d('meta','settings')); if(!ss.exists()||!ss.data().due){ const lv=localStorage.getItem('samttuk.due'); if(lv) await fs.setDoc(d('meta','settings'),{due:JSON.parse(lv)},{merge:true}); }
    S.mode='cloud'; S.emit('mode');
    fs.onSnapshot(d('meta','settings'),s=>{ const v=s.exists()&&s.data().due; if(v && v!==JSON.parse(localStorage.getItem('samttuk.due')||'null')){ localStorage.setItem('samttuk.due',JSON.stringify(v)); window.onDueChanged&&window.onDueChanged(); } });
    fs.onSnapshot(col('checks'),snap=>{ const o={}; snap.forEach(x=>o[x.id]=x.data()); S.state.checks=o; localStorage.setItem('samttuk.checks',JSON.stringify(o)); S.emit('checks'); });
    fs.onSnapshot(col('visits'),snap=>{ const a=[]; snap.forEach(x=>a.push({id:x.id,...x.data()})); S.state.visits=a; localStorage.setItem('samttuk.visits',JSON.stringify(a)); S.emit('visits'); });
    fs.onSnapshot(col('memos'),snap=>{ const a=[]; snap.forEach(x=>a.push({id:x.id,...x.data()})); S.state.memos=a; localStorage.setItem('samttuk.memos',JSON.stringify(a)); S.emit('memos'); });
    fs.onSnapshot(d('meta','budget'),s=>{ if(s.exists() && !document.activeElement?.closest?.('.btable')){ const bd=s.data(); const m1=window.migrateBudget&&window.migrateBudget(bd), m2=window.cleanIncome&&window.cleanIncome(bd); if(m1||m2) fs.setDoc(d('meta','budget'),bd); S.state.budget=bd; localStorage.setItem('samttuk.budget',JSON.stringify(S.state.budget)); S.emit('budget'); } });
  }catch(e){ console.error('sync failed',e); const t=document.getElementById('todoStatus'); if(t) t.textContent='⚠️ 연동 서버에 연결하지 못했어요. 이 폰에 임시 저장 중이에요.'; }
}
