/* ===== 操作パネルの位置合わせ：表示枠の下が画面外に出ている分（--vcut）だけ持ち上げる ===== */
const VFIT=(()=>{
  /* 3段構え：①実測（IntersectionObserver） ②iPhoneアプリ枠の推定 ③利用者が一度だけ合わせた値（最優先・端末に永久保存） */
  const KEY="tlr-kyushu-lift", OK="tlr-kyushu-lift-ok";
  let ioCut=0, last=-1, preview=null;
  const inFrame=(()=>{ try{ return window.top!==window.self; }catch(e){ return true; } })();
  const touch=(()=>{ try{ return matchMedia("(pointer:coarse)").matches; }catch(e){ return false; } })();
  function manual(){ try{ const v=localStorage.getItem(KEY); if(v&&v!=="auto"&&!isNaN(+v)) return +v; }catch(e){} return null; }
  function guess(){ /* アプリ内の枠が画面の高さぶん確保され、上のバー分だけ下が隠れるケースを推定 */
    if(!inFrame||!touch) return 0;
    const sw=screen.width||0, sh=screen.height||0; if(!sw||!sh) return 0;
    const portrait=window.innerHeight>=window.innerWidth;
    const H=portrait?Math.max(sw,sh):Math.min(sw,sh);
    return Math.max(0, window.innerHeight-(H-(portrait?100:44))); }
  function autoCut(){ return Math.max(ioCut, guess()); }
  function cur(){ if(preview!=null) return preview; const m=manual(); return m!=null?m:autoCut(); }
  function apply(){ let cut=cur();
    cut=Math.max(0,Math.min(Math.round(cut),Math.round(window.innerHeight*0.4)));
    if(Math.abs(cut-last)<2) return; last=cut; document.documentElement.style.setProperty("--vcut",cut+"px");requestAnimationFrame(()=>{fitEndView();fitBattleView();});
    window.dispatchEvent(new Event("resize")); }
  function calibrate(first){
    if(document.getElementById("vfitCal")) return;
    preview=Math.round(cur()); apply();
    const o=document.createElement("div"); o.id="vfitCal"; o.setAttribute("role","dialog"); o.setAttribute("aria-label","画面の下合わせ");
    o.innerHTML=`<div class="vc-box"><b class="vc-t">${first?"はじめに一度だけ：":""}画面の下合わせ</b>
      <p class="vc-d">画面いちばん下の<span style="color:var(--gold)">黄色い帯</span>が、<b>下の線まで全部</b>見えるように「上へ」「下へ」で合わせて「決定」を押してください。この端末に保存され、次からは自動で使われます。</p>
      <div class="vc-row"><button class="btn" data-v="10">▲ 上へ</button><button class="btn" data-v="-10">▼ 下へ</button></div>
      <p class="vc-n">持ち上げ：<span id="vcNum"></span>px</p>
      <div class="vc-row"><button class="btn" data-k="auto">自動の値に戻す</button><button class="btn primary" data-k="ok">決定</button></div></div>
      <div class="vc-band">▼ この帯の下の線まで見えればOK ▼</div>`;
    document.body.appendChild(o);
    const num=o.querySelector("#vcNum"); const show=()=>{ num.textContent=Math.round(preview); };
    show();
    o.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return;
      if(b.dataset.v){ preview=Math.max(0,Math.min(Math.round(window.innerHeight*0.4),preview+(+b.dataset.v))); last=-1; apply(); show(); }
      else if(b.dataset.k==="auto"){ preview=Math.round(autoCut()); last=-1; apply(); show(); }
      else if(b.dataset.k==="ok"){ try{ localStorage.setItem(KEY,String(Math.round(preview))); localStorage.setItem(OK,"1"); }catch(e){} preview=null; o.remove(); last=-1; apply(); try{ render(); }catch(e){} try{ toast("画面の下合わせを保存しました。"); }catch(e){} }
    }); }
  try{
    const sd=document.createElement("div"); sd.setAttribute("aria-hidden","true");
    sd.style.cssText="position:fixed;left:0;top:0;bottom:0;width:2px;pointer-events:none;opacity:0;z-index:-1";
    document.body.appendChild(sd);
    if("IntersectionObserver" in window){ const th=[]; for(let i=0;i<=100;i++) th.push(i/100);
      new IntersectionObserver(es=>{ for(const e of es){ if(e.isIntersecting) ioCut=Math.max(0,e.boundingClientRect.bottom-e.intersectionRect.bottom); } apply(); },{threshold:th}).observe(sd); }
  }catch(e){}
  window.addEventListener("orientationchange",()=>setTimeout(()=>{ last=-1; apply(); },300));
  apply();
  /* アプリ内（枠の中）でスマホ表示の時、まだ合わせていなければ初回だけ下合わせを出す */
  let asked=false; try{ asked=!!localStorage.getItem(OK)||manual()!=null; }catch(e){ asked=true; }
  if(inFrame&&touch&&!asked) setTimeout(()=>calibrate(true),700);
  return { apply, calibrate, get mode(){ const m=manual(); return m==null?"auto":String(m); }, get value(){ return Math.round(cur()); } };
})();
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ G.walk.path=G.walk.path.slice(0,1); if(G.st&&G.screen==="explore") commit(); SND.suspend(); } else { SND.resume(); if(G.screen==="explore") startLoop(); } });
window.addEventListener("resize",()=>{G.mobileForceFocus=false;queueMobileLayout();});
window.visualViewport?.addEventListener("resize",queueMobileLayout);
window.addEventListener("orientationchange",()=>{G.mobileForceFocus=false;queueMobileLayout();});

if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{fitEndView();fitBattleView();}).catch(()=>{});

async function boot(){
  await cleanupLegacySaves();
  acquireLock(); PAD.mount(); SND.play("title");
  try{ const ls=JSON.parse(localStorage.getItem(SAVE_LOCAL_KEY)||"null"); G.hasSave=validSaveRecord(ls); }catch(e){}
  CLOUD.init();
  loadSave().then(s=>{ const had=G.hasSave; G.hasSave=!!s; if(G.screen==="title"&&had!==G.hasSave){ render(); drawTitleArt(); } }).catch(()=>{});
  const hot=window.claude&&window.claude.hot;
  if(hot&&hot.snapshot) hot.snapshot(()=>({st:G.st, screen:G.screen}));
  const data = hot&&hot.data;
  if(data&&data.st){try{validateState(data.st);G.st=migrate(data.st);G.screen=data.screen==="new"?"title":data.screen==="battle"&&!G.st.run?"explore":data.screen;G.hasSave=true;}catch(e){G.st=null;G.screen="title";}}
  render(); if(G.screen==="title") drawTitleArt();
}


/* ===== input: ジョイコントローラー（画面上のスティック＋決定/戻る、ゲームパッド、キーボード） ===== */
const PAD = (()=>{
  let dir=null, repeatT=0, lastMove=0;            // dir: 0下 1上 2左 3右
  const VEC=[[0,1],[0,-1],[-1,0],[1,0]];
  const isMoveMode=()=> G.screen==="explore" && !G.sheet && !G.dlg && G.st && !G.readOnly;

  /* ---- 画面上のスティック ---- */
  function mount(){
    const dock=document.getElementById("dock");if(!dock)return;dock.querySelector("[data-pad=a]")?.remove?.();if(dock.dataset.ready)return;dock.dataset.ready="1";
    const base=dock.querySelector(".stick"), knob=dock.querySelector(".knob");
    let pid=null,centerTap=false,tapX=0,tapY=0,tapAt=0;
    const feedback=()=>{base.classList.add("confirmed");setTimeout(()=>base.classList.remove("confirmed"),180);};
    const isCenter=(e,release=false)=>{const r=base.getBoundingClientRect();return Math.hypot(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2)<=Math.max(release?26:22,r.width*(release?0.40:0.32));};
    const isTap=e=>isCenter(e,true)&&Math.hypot(e.clientX-tapX,e.clientY-tapY)<=Math.max(10,base.getBoundingClientRect().width*0.16);
    const upd=e=>{
      const r=base.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2, R=r.width*0.34;
      let dx=e.clientX-cx, dy=e.clientY-cy; const d=Math.hypot(dx,dy);
      if(d>R){ dx=dx/d*R; dy=dy/d*R; }
      knob.style.transform=`translate(${dx}px,${dy}px)`;
      const mag=Math.hypot(dx,dy)/R;
      if(mag<0.28){ stickAlt=null; setDir(null,"stick"); return; }
      // 斜め付近で向きがパタパタ切り替わらないよう、今の向きを少し優先する（ヒステリシス）
      const ax=Math.abs(dx), ay=Math.abs(dy), hd=dx<0?2:3, vd=dy<0?1:0, cur=sources.stick;
      let nd;
      if((cur===2||cur===3) && ax>=ay*0.75) nd=hd; else if((cur===0||cur===1) && ay>=ax*0.75) nd=vd; else nd = ax>ay?hd:vd;
      // 斜めに倒している時のもう一方の向き（壁に当たったらこちらへすべる）
      stickAlt = nd===hd ? (ay>R*0.3?vd:null) : (ax>R*0.3?hd:null);
      setDir(nd, "stick");
    };
    base.addEventListener("pointerdown",e=>{ if(pid!==null||e.button>0)return;tapAt=Date.now();centerTap=isCenter(e);tapX=e.clientX;tapY=e.clientY;pid=e.pointerId; base.setPointerCapture(pid); base.classList.add("on"); SND.sfx("step"); if(centerTap){stickAlt=null;setDir(null,"stick");}else upd(e); e.preventDefault(); });
    base.addEventListener("pointermove",e=>{ if(e.pointerId===pid){if(centerTap&&!isTap(e))centerTap=false;if(!centerTap)upd(e);e.preventDefault();} });
    const end=e=>{ if(e.pointerId!==pid) return;const confirm=e.type==="pointerup"&&centerTap&&isTap(e)&&Date.now()-tapAt<=650;pid=null;centerTap=false;base.classList.remove("on");knob.style.transform="";stickAlt=null;setDir(null,"stick");if(confirm){e.preventDefault();feedback();pressA();} };
    base.tabIndex=0;base.setAttribute("aria-label","スティック。中央タップで決定、ドラッグで移動");base.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();if(!e.repeat){feedback();pressA();}}});
    MOBILE_UI.releaseStick=()=>{const old=pid;pid=null;centerTap=false;base.classList.remove("on");knob.style.transform="";stickAlt=null;setDir(null,"stick");try{if(old!=null)base.releasePointerCapture(old);}catch(e){}};
    base.addEventListener("pointerup",end); base.addEventListener("pointercancel",end); base.addEventListener("lostpointercapture",end);
    dock.querySelector("[data-pad=b]").addEventListener("click",()=>pressB());
    requestAnimationFrame(tick);
  }
  const sources={}; let stickAlt=null, keyAlt=null, keyStack=[];
  /* 今押している向き（dir）と、斜め入力のもう一方（alt） */
  function held(){ if(dir==null) return {dir:null,alt:null}; const alt = sources.key===dir? keyAlt : sources.gamepad===dir? null : stickAlt; return {dir, alt}; }
  function setDir(d, src){
    sources[src]=d;
    const nd = ["key","gamepad","stick"].map(s=>sources[s]).find(x=>x!=null) ?? null;
    if(nd===dir) return;
    dir=nd; updateArrow();
    if(dir==null){ if(isMoveMode() && G.walk.path.length>1) G.walk.path=G.walk.path.slice(0,1); return; }
    if(!isMoveMode()){ moveCursor(dir); repeatT=performance.now()+380; }
  }
  function updateArrow(){ const a=document.querySelector("#dock .stick"); if(a) a.dataset.dir = dir==null?"":["下","上","左","右"][dir]; }

  /* 毎フレーム：移動の継続、カーソルの連続移動、ゲームパッドの読み取り */
  let prevBtn={}, bump={id:null,t:0};
  function tick(now){
    pollGamepad();
    if(dir==null) G.bumpLock=false;
    if(dir!=null){
      if(isMoveMode()){
        if(!G.walk.path.length){
          const st=G.st, m=MAPS[st.mapId]; const s=nextStepFor(held()); const nx=st.pos.x+VEC[dir][0], ny=st.pos.y+VEC[dir][1];
          if(s){ G.walk.path=[{x:s.x,y:s.y}]; G.walk.prog=0; G.walk.pending=null; faceToward(s); }
          else if(st.dir!==dir){ st.dir=dir; }
          else {
            // 扉・街の出口へ向かって押し続けると、そのまま入る（約0.25秒）
            const o=objAt(m,nx,ny);
            if(o && !G.bumpLock && ["door","gate","worldExit","cityEntry"].includes(o.type)){ if(bump.id!==o.id){ bump={id:o.id,t:now}; } else if(now-bump.t>250){ bump={id:null,t:0}; interact(o); } }
            else bump={id:null,t:0};
            if(now-lastMove>400){ lastMove=now; if(o) refreshHere(); }
          }
        } else bump={id:null,t:0};
      } else if(now>repeatT){ moveCursor(dir); repeatT=now+170; }
    }
    requestAnimationFrame(tick);
  }

  /* ---- カーソル（▶）の移動：今見えている一番手前の画面の中だけで動く ---- */
  function scope(){ const d=document.querySelector(".dlg-ov"); if(d) return d; const s=document.querySelector(".overlay"); if(s) return s; return document.getElementById("screen"); }
  function focusables(sc){
    return [...sc.querySelectorAll("button,input,textarea,select,[data-a]")].filter(el=>{
      if(el.disabled||el.getAttribute("aria-disabled")==="true") return false;
      if(el.closest("[hidden]")) return false; const r=el.getBoundingClientRect(); return r.width>0&&r.height>0;
    });
  }
  function current(sc){ const k=sc.querySelector(".kfocus"); if(k) return k; const a=document.activeElement; return a&&sc.contains(a)&&a!==document.body?a:null; }
  function setCursor(el){
    document.querySelectorAll(".kfocus").forEach(x=>x.classList.remove("kfocus"));
    if(!el) return; el.classList.add("kfocus");
    try{ el.focus({preventScroll:true}); }catch(e){}
    el.scrollIntoView({block:"nearest",inline:"nearest"});
    G.cursorSig = sig(el);
  }
  function sig(el){ return [el.dataset.a,el.dataset.k,el.dataset.v,el.dataset.i,el.dataset.c,el.dataset.s,el.id].join("|"); }
  function moveCursor(d){
    const sc=scope(); if(!sc) return; const list=focusables(sc); if(!list.length) return;
    const cur=current(sc);
    if(cur&&cur.tagName==="SELECT"&&(d===0||d===1)){const next=Math.max(0,Math.min(cur.options.length-1,cur.selectedIndex+(d===0?1:-1)));if(next!==cur.selectedIndex){G.cursorSig=sig(cur);cur.selectedIndex=next;cur.dispatchEvent(new Event("change",{bubbles:true}));}return;}
    if(!cur || !list.includes(cur)){
      const primary=list.find(el=>el.hasAttribute("data-default-focus"));
      const pref = primary || (sc.querySelector(".cmd") ? list.find(el=>el.closest(".cmd")) : sc.querySelector(".sheet") ? list.find(el=>el.closest(".sheet")&&el.dataset.a!=="closeSheet") : null);
      setCursor(pref||list[0]); SND.sfx("ok"); return; }
    const r=cur.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
    let best=null, bs=Infinity;
    for(const el of list){ if(el===cur) continue; const q=el.getBoundingClientRect(), x=q.left+q.width/2, y=q.top+q.height/2;
      const dx=x-cx, dy=y-cy; let main, side;
      if(d===0){ main=dy; side=dx; } else if(d===1){ main=-dy; side=dx; } else if(d===2){ main=-dx; side=dy; } else { main=dx; side=dy; }
      if(main<=4) continue; const s=main+Math.abs(side)*2.2; if(s<bs){ bs=s; best=el; } }
    if(best){ setCursor(best); SND.sfx("step"); }
  }
  /* 再描画の後、同じボタンへカーソルを戻す */
  function restore(){
    if(!G.cursorSig || isMoveMode()) return;
    const sc=scope(); if(!sc) return; const el=focusables(sc).find(e=>sig(e)===G.cursorSig);
    if(el){ el.classList.add("kfocus"); try{ el.focus({preventScroll:true}); }catch(e){} } else G.cursorSig=null;
  }

  /* ---- 決定（A）と戻る（B） ---- */
  function pressA(){
    const sc=scope();
    if(isMoveMode()){G.walk.path=[];G.walk.pending=null;G.walk.prog=0; const near=nearbyObjects(); if(!near.length) return toast("近くに調べられるものはありません。"); if(near.length===1) return interact(near[0]); return openSheet("nearby"); }
    if(G.dlg){ const b=document.getElementById("dlgNext"); if(b) b.click(); return; }
    const cur=sc&&current(sc);
    if(cur && focusables(sc).includes(cur)){if(cur.tagName==="SELECT"&&typeof cur.showPicker==="function"){try{cur.showPicker();return;}catch(e){}}cur.click(); return; }
    moveCursor(0);
  }
  function pressB(){
    if(G.dlg){ ACT.dlgSkip(); return; }
    if(G.sheet){ const back=document.querySelector(".overlay [data-a=closeSheet]"); if(back) back.click(); return; }
    if(G.battleInspect&&G.screen==="battle"){ACT.battleInspectClose();return;}
    if(G.auto && !G.sheet && G.screen==="battle"){ ACT.autoOff(); return; }
    if(G.screen==="battle"&&G.auto){ ACT.autoOff(); return; }
    if(G.screen==="battle"&&G.battlePicker){G.battlePicker=null;render();return;}
    if(G.screen==="battle"&&G.battleCommand){G.battleCommand=false;G.cursorSig="battleCommandOpen||||||";render();return;}
    if(G.screen==="battle"&&G.st&&G.st.run&&G.st.run.state==="input"){ G.cmd={actor:G.cmd.actor}; G.cursorSig=null; render(); SND.sfx("cancel"); return; }
    if(isMoveMode()){ G.walk.path=G.walk.path.slice(0,1); G.walk.pending=null; return; }
    SND.sfx("cancel");
  }

  /* ---- ゲームパッド（Joy-Con・Proコントローラー・一般のコントローラー） ---- */
  function pollGamepad(){
    let pads=[]; try{ pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[]; }catch(e){}
    if(!pads.length){ if(sources.gamepad!=null) setDir(null,"gamepad"); return; }
    const gp=pads[0]; const b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed);
    let d=null;
    if(b(12)) d=1; else if(b(13)) d=0; else if(b(14)) d=2; else if(b(15)) d=3;
    else { const x=gp.axes[0]||0, y=gp.axes[1]||0; if(Math.hypot(x,y)>0.5) d = Math.abs(x)>Math.abs(y)?(x<0?2:3):(y<0?1:0); }
    setDir(d,"gamepad");
    // 任天堂系は右ボタン(標準1番)が決定、それ以外は下ボタン(標準0番)が決定
    const nin=/joy-?con|nintendo|pro controller|057e/i.test(gp.id||"");
    const aIdx=nin?1:0, bIdx=nin?0:1;
    const now={a:b(aIdx), b:b(bIdx), start:b(9)};
    if(now.a&&!prevBtn.a) pressA();
    if(now.b&&!prevBtn.b) pressB();
    if(now.start&&!prevBtn.start&&isMoveMode()) openSheet("status");
    prevBtn=now;
  }
  window.addEventListener("gamepadconnected",e=>toast(`コントローラーを接続しました（${(e.gamepad.id||"").slice(0,24)}）`));

  /* ---- キーボード（パソコンでの確認用） ---- */
  const KEYS={ArrowDown:0,ArrowUp:1,ArrowLeft:2,ArrowRight:3,s:0,w:1,a:2,d:3};
  document.addEventListener("keydown",e=>{
    const t=e.target; if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT")) return;
    if(KEYS[e.key]!=null){ e.preventDefault(); if(!e.repeat){ const d=KEYS[e.key]; keyStack=keyStack.filter(x=>x!==d); keyStack.push(d); updKey(); } return; }
    if(e.key==="Enter"||e.key===" "||e.key==="z"){ e.preventDefault(); if(!e.repeat) pressA(); }
    if(e.key==="Escape"||e.key==="x"||e.key==="Backspace"){ e.preventDefault(); if(!e.repeat) pressB(); }
  });
  /* 複数キー同時押し：最後に押した向きを優先し、直交するもう一方を斜め入力として扱う */
  function updKey(){ const d=keyStack.length?keyStack[keyStack.length-1]:null; const p=keyStack.length>1?keyStack[keyStack.length-2]:null;
    keyAlt = (d!=null&&p!=null&&((d<2)!==(p<2)))?p:null; setDir(d,"key"); }
  document.addEventListener("keyup",e=>{ if(KEYS[e.key]!=null){ const d=KEYS[e.key]; keyStack=keyStack.filter(x=>x!==d); updKey(); } });
  window.addEventListener("blur",()=>{keyStack=[];sources.gamepad=null;sources.stick=null;MOBILE_UI.releaseStick?.();updKey();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){keyStack=[];sources.gamepad=null;sources.stick=null;MOBILE_UI.releaseStick?.();updKey();}});
  document.addEventListener("pointerdown",e=>{ if(!e.target.closest("#dock")){ document.querySelectorAll(".kfocus").forEach(x=>x.classList.remove("kfocus")); G.cursorSig=null; } },true);

  /* BGMは初期ON：ブラウザの制限で、最初に画面へ触れた時に鳴らし始める */
  function wantSound(){ if(G.soundWant!=null) return G.soundWant; if(G.st && G.st.settings && G.st.settings.sound===false) return false; return soundPref(); }
  const unlock=()=>{ if(SND.on) return; if(wantSound()){ SND.setOn(true); } };
  ["pointerdown","keydown","touchend"].forEach(ev=>document.addEventListener(ev,unlock,{capture:true,passive:true}));
  function reset(){keyStack=[];sources.key=null;sources.gamepad=null;sources.stick=null;MOBILE_UI.releaseStick?.();updKey();}
  return { mount, restore, pressA, pressB, held, reset };
})();

if(window.claude&&window.claude.hot&&window.claude.hot.ready) window.claude.hot.ready(()=>boot()); else boot();

