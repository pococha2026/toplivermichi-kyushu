/* ===== platform: 保存（IndexedDB＋世代）と排他 ===== */
const IS_PUBLIC = typeof window!=="undefined" && !!window.TLR_PUBLIC; // GitHub公開版ではclaude.aiのクラウド保存を使わない
const DB = (()=>{
  let db=null;
  function open(){ return new Promise((res,rej)=>{ try{ const r=indexedDB.open(SAVE_DB_NAME,1); r.onupgradeneeded=()=>r.result.createObjectStore("saves"); r.onsuccess=()=>{db=r.result;db.onversionchange=()=>{db.close();db=null;};res(db);}; r.onerror=()=>rej(r.error);}catch(e){rej(e);} }); }
  async function tx(mode, fn){ if(!db) await open(); return new Promise((res,rej)=>{ let t; try{ t=db.transaction("saves",mode,{durability:"strict"}); }catch(e){ t=db.transaction("saves",mode); } const s=t.objectStore("saves"); let out; fn(s,v=>out=v); t.oncomplete=()=>res(out); t.onerror=()=>rej(t.error); t.onabort=()=>rej(t.error); }); }
  const get=k=>tx("readonly",(s,set)=>{ const r=s.get(k); r.onsuccess=()=>set(r.result); });
  const putPair=(cur,prev)=>tx("readwrite",s=>{ if(prev) s.put(prev,"auto-prev"); s.put(cur,"auto"); });
  const remove=k=>tx("readwrite",s=>s.delete(k));
  return { get, putPair, remove };
})();
function storageDeadline(p){ return new Promise((resolve,reject)=>{ const timer=setTimeout(()=>reject(new Error("保存領域の応答待ち時間を超えました")),2000); Promise.resolve(p).then(v=>{clearTimeout(timer);resolve(v);},e=>{clearTimeout(timer);reject(e);}); }); }
function checksum(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return (h>>>0).toString(16); }

const G = { st:null, screen:"title", saveStatus:"未保存", readOnly:false, hasSave:false,
  walk:{path:[], prog:0, pending:null}, cv:null, vw:11, vh:9, scale:2, raf:0, lastTs:0, frame:0,
  cmd:{}, dlg:null, sheet:null, sheetData:{}, toast:null, newGame:{name:"",gender:null,composing:false,step:1},
  battleTimer:0, lastLog:[] };
let saveChain = Promise.resolve();
/* ---- クラウド保存（claude.aiのArtifact db：この人だけが読める data/users/<id>/ に保存。更新・タブを閉じても消えない） ---- */
const CLOUD=(()=>{
  let db=null, uid=null, ready=null, pending=null, writing=false, timer=0, last=null, prevAt=0, state="確認中";
  function init(){
    if(ready) return ready;
    ready=(async()=>{ try{ if(IS_PUBLIC){ state="公開版では使いません"; return false; } if(!window.claude||!window.claude.use){ state="使えません"; return false; }
      const [d,u]=await Promise.all([window.claude.use("db"), window.claude.use("user")]); if(!d||!u){ state="使えません"; return false; }
      const id=await u.id(); if(!id){ state="使えません（サインインが必要）"; return false; }
      db=d; uid=id; state="有効"; return true; }catch(e){ state="使えません"; return false; } })();
    return ready;
  }
  const ref=k=>db.doc("data/users/"+uid+"/"+SAVE_EPOCH+"-"+k);
  async function load(){ if(!await init()) return {}; const out={};
    for(const k of ["save-auto","save-prev"]){ try{ const sn=await ref(k).get(); if(sn.exists) out[k]=sn.data(); }catch(e){} }
    last=out["save-auto"]||null; return out; }
  function push(rec){ pending=rec; if(!writing){ clearTimeout(timer); timer=setTimeout(flush, 0); } } // 書き込み中に来た保存は最新1件だけ後で送る
  async function flush(){
    clearTimeout(timer); if(writing||!pending) return; if(!await init()){ pending=null; return; }
    writing=true; const rec=pending; pending=null;
    try{
      if(rec.state.length>240000) throw {code:"too_big"};
      // 1つ前の世代は5分に1回だけ控える（書き込み回数を抑える）
      if(last && last.state && Date.now()-prevAt>300000 && last.time<rec.time){ await ref("save-prev").set(last); prevAt=Date.now(); }
      await ref("save-auto").set(rec); last=rec; state="有効"; afterCloud(true);
    }catch(e){
      if(e&&e.code==="unavailable" && !pending){ pending=rec; setTimeout(flush, 1500+Math.random()*1000); }
      state = e&&e.code==="too_big"?"記録が大きすぎて保存できません":"一時的に保存できません"; afterCloud(false);
    }
    writing=false; if(pending) push(pending);
  }
  return { init, load, push, flush, dirty:()=>!!pending||writing, state:()=>state, on:()=>!!db };
})();
function afterCloud(ok){ if(!G.localOK) return; setSave(ok?"保存済み（端末とクラウド）":"保存済み（端末のみ。クラウド："+CLOUD.state()+"）"); }
function commit(){
  const st=G.st; if(!st) return Promise.resolve();
  if(!currentSaveState(st)){G.localOK=false;G.hasSave=false;setSave("初期化前の記録は保存できません。更新版ではじめから開始してください。");return Promise.resolve();}
  if(G.readOnly){ G.localOK=false; setSave("未保存：別のタブを閉じ、この画面を再読み込みしてください。"); return Promise.resolve(); }
  syncCollection(st);delete st.slots;normalizeChapterLocation(st);learnEquipped(st);rememberSpecialUnlocks(st);
  if(!st.run) ensureVitals(st);
  st.saveGeneration=(Number.isFinite(st.saveGeneration)?st.saveGeneration:0)+1;
  const json=JSON.stringify(st); const rec={app:"toplivermichi-kyushu", gen:st.saveGeneration, time:Date.now(), state:json, sum:checksum(json)};
  setSave("保存中…"); G.localOK=false;
  // 端末内：まずlocalStorageへ同期的に書く（タブを閉じても残る）→ IndexedDBへ2世代
  let ls=false; try{ localStorage.setItem(SAVE_LOCAL_KEY, JSON.stringify(rec)); ls=true; G.localOK=true; G.hasSave=true; setSave("保存済み（端末）"); }catch(e){}
  CLOUD.push(rec);
  saveChain = saveChain.catch(()=>{}).then(async()=>{
    try{ const prev=await storageDeadline(DB.get("auto")); await storageDeadline(DB.putPair(rec, validSaveRecord(prev)&&prev.time<rec.time?prev:null)); G.localOK=true; G.hasSave=true; }
    catch(e){ G.localOK=ls; }
    if(G.localOK) setSave(CLOUD.on()? (CLOUD.dirty()?"保存済み（端末）・クラウドへ送信中…":"保存済み（端末とクラウド）") : "保存済み（端末）");
    else if(!CLOUD.on()) setSave("未保存：この端末では保存できません。設定からバックアップを書き出してください。");
  });
  return saveChain;
}
async function loadSave(){
  await cleanupLegacySaves();
  const valid=validSaveRecord;
  const cur=[], prev=[];
  try{ const a=await storageDeadline(DB.get("auto")); if(valid(a))cur.push({...a,src:"端末"});else if(foreignSaveRecord(a))await storageDeadline(DB.remove("auto"));const b=await storageDeadline(DB.get("auto-prev")); if(valid(b))prev.push({...b,src:"端末"});else if(foreignSaveRecord(b))await storageDeadline(DB.remove("auto-prev"));}catch(e){}
  try{ const l=JSON.parse(localStorage.getItem(SAVE_LOCAL_KEY)||"null"); if(valid(l))cur.push({...l,src:"端末"});else if(foreignSaveRecord(l))localStorage.removeItem(SAVE_LOCAL_KEY);}catch(e){}
  try{ const c=await CLOUD.load(); if(valid(c["save-auto"])) cur.push({...c["save-auto"],src:"クラウド"}); if(valid(c["save-prev"])) prev.push({...c["save-prev"],src:"クラウド"}); }catch(e){}
  const pick = arr => arr.sort((x,y)=>(y.time-x.time)||(y.gen-x.gen))[0];
  const best = pick(cur) || null;
  if(best) return {state:JSON.parse(best.state), time:best.time, src:best.src};
  const p = pick(prev);
  if(p) return {state:JSON.parse(p.state), time:p.time, src:p.src, fromPrev:true};
  return null;
}
window.addEventListener("pagehide",()=>{ CLOUD.flush(); });
document.addEventListener("visibilitychange",()=>{ if(document.hidden) CLOUD.flush(); });
window.addEventListener("beforeunload",e=>{ if(CLOUD.dirty()){ CLOUD.flush(); e.preventDefault(); e.returnValue=""; } });
function setSave(t){ G.saveStatus=t; const el=document.getElementById("saveStat"); if(el) el.textContent=t; }
let releaseSaveLock=null;
window.addEventListener("pagehide",()=>{ if(G.st&&!G.readOnly) commit(); if(releaseSaveLock){ releaseSaveLock(); releaseSaveLock=null; } });
window.addEventListener("pageshow",e=>{if(e.persisted){if(IS_PUBLIC)location.replace(freshGameUrl(location.href));else location.reload();}});
function acquireLock(){
  try{ if(navigator.locks){ navigator.locks.request(SAVE_LOCK_NAME,{ifAvailable:true}, lock=>{ if(!lock){ G.readOnly=true; setSave("未保存：別のタブで起動中です。他のタブを閉じて再読み込みしてください。"); render(); return; } return new Promise(resolve=>{ releaseSaveLock=resolve; }); }); } }catch(e){}
}

