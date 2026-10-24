/* ===== ui 共通 ===== */
const $ = s=>document.querySelector(s);
const esc = s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const P = ()=>esc(G.st.profile.name);
/* ヒロインの名前・性別（ゲーム開始時に設定）を画面の文へ反映する。主人公とヒロインの名前は置換から守る */
function heroSub(str){
  const st=G.st;
  if(typeof str==="string" && str.indexOf("〈ヒロイン〉")>=0) str=str.split("〈ヒロイン〉").join(st? heroineShort(st) : "ヒロイン"); // 公開版：名前を持たない版の置き場所
  if(!st||!heroineCustom(st)||typeof str!=="string") return str;
  const H=heroineOf(st), short=heroineShort(st), P=st.profile.name; let t=str;
  const keep=[]; const protect=(w)=>{ if(!w) return; t=t.split(w).join("\u0001"+keep.length+"\u0002"); keep.push(w); };
  [P,H.name,short,...Object.values(st.names||{})].filter((w,i,a)=>w&&a.indexOf(w)===i).sort((a,b)=>b.length-a.length).forEach(protect);
  const tok=w=>{ keep.push(w); return "\u0001"+(keep.length-1)+"\u0002"; };
  const full=tok(H.name), sh=tok(short);
  t=t.replace(/もえ/g,sh);
  if(H.gender==="男性") t=t.replace(/ヒロイン/g,"ヒーロー").replace(/元アイドル/g,"元アイドル").replace(/彼女/g,"彼").replace(/ひとりの女性/g,"ひとりの男性");
  return t.replace(/\u0001(\d+)\u0002/g,(m,i)=>keep[+i]);
}
function toast(msg){ msg=heroSub(msg); G.toast=msg; const el=$("#toast"); if(el){ el.textContent=msg; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>{el.hidden=true;},2600);} }
function hubOf(mapId){return mapId==='WORLD'&&G.st?worldHubAt(G.st.pos.x,G.st.pos.y):MAPS[mapId].hub;}
function curHub(){ return hubOf(G.st.mapId); }
function tileAt(m,x,y){ return (m.tiles[y]&&m.tiles[y][x])||"T"; }
function objAt(m,x,y){return m.mapScope==='world'?m.objectIndex[x+','+y]:m.objects.find(o=>o.x===x&&o.y===y);}
function walkable(m,x,y,st=G.st){if(m.mapScope==='world')return worldWalkableAt(x,y,st); const o=objAt(m,x,y); if(o) return !!o.walk; return ".,123w=".includes(tileAt(m,x,y)); }
function zoneAt(m,x,y){if(m.mapScope==='city'||m.kind==='in')return null;if(m.mapScope==='world')return worldAreaAt(x,y); const o=objAt(m,x,y); if(o&&o.walk) return null; return m.zones[tileAt(m,x,y)]||null; }
function isSafe(){ return !zoneAt(MAPS[G.st.mapId],G.st.pos.x,G.st.pos.y); }
function busyReason(){ const st=G.st; if(st.run) return "戦闘中です。"; return null; }
function streamPending(){ return Object.keys(QUESTS).find(k=>G.st.quests[k]==="combatDone"); }

/* 進行データから毎回算出する。既存セーブにも追加操作なしで適用。 */

/* 解放した事実は編成変更で失わない。入場レベルなどの条件は別途確認する。 */
function rememberSpecialUnlocks(st){if(!st||st.quests.M16!=='complete')return;const record=st.specialUnlocked||(st.specialUnlocked={});for(const a of SPECIAL_STAGES){if(!specialReason(st,a)||st.visitedMaps.includes(a.id)||st.bossDefeated[a.boss])record[a.id]=true;const d=trialOf(a.challenge),r=st.challenges?.[a.challenge];if(r?.attempts||r?.cleared||st.bossDefeated[a.boss]&&partyLevel(st)>=d.level-20)record[a.challenge]=true;}}
function questReward(Q){return {xp:regionalXP(Q.regionalLevel||Q.chapterLevel||5)*(Q.main?4:1),tickets:Q.main?200:80};}
function pendingTravelNotice(st){const q=Object.keys(QUESTS).find(k=>st.quests[k]==='combatDone');return q?`<p class="warn">配信待ち：${esc(q+' '+QUESTS[q].name)}。${esc(HUBS[QUESTS[q].hub].name)}で依頼帳から配信を完了してください。離れた街からは、この街への帰還だけ利用できます。</p>`:'';}
function hubTravelReason(st,to){if(G.readOnly)return 'このタブは閲覧のみです。';if(st.careerSession)return '活動準備を終えてから移動・戦闘へ進んでください。';if(G.screen!=='explore'||st.run||st.stream||G.dlg)return '戦闘・配信・会話を終えてから移動してください。';if(!MAPS[to]||!HUBS[to]||!hubUnlocked(st,to))return 'この街はまだ解放されていません。';if(st.mapId!=='WORLD'&&!isSafe())return '街の安全地帯から移動してください。';const pending=Object.keys(QUESTS).find(k=>st.quests[k]==='combatDone');if(pending&&QUESTS[pending].hub!==to)return '配信待ちの依頼'+pending+'を完了してください。'+HUBS[QUESTS[pending].hub].name+'へ戻ることはできます。';return '';}

function specialProgress(st){
 const kyushu=st.quests.M16==='complete',done=st.quests.M17==='complete',qstate=st.quests.M17;
 const omuta={id:'omuta',kind:'area',name:'大牟田市編',open:kyushu,done,where:'福岡県・大牟田市',level:bossRecommendedLevel(BOSSES.B16.q),reason:kyushu?'':'九州本編M16クリアで解放',progress:done?'本編M17クリア':qstate==='combatDone'?'M17：ボス撃破済み・配信待ち':qstate==='bossReady'?'M17：討伐達成・ボス未撃破':qstate==='active'?'M17：通常敵 '+(st.qprog.M17||0)+'/'+QUESTS.M17.kills+'体':st.visitedHubs.includes('KY17')?'訪問済み・M17未受注':'未訪問・M17未受注'};
 const regional=NATIONAL_SPECIALS.map(c=>({id:c.id,kind:'area',name:c.name,open:st.quests[c.unlock]==='complete',ready:st.quests[c.unlock]==='complete',done:st.quests[c.qid]==='complete',where:c.pref+'・'+c.city,level:c.level,reason:st.quests[c.unlock]==='complete'?'':c.unlock+'クリアで解放',progress:st.quests[c.qid]==='complete'?'共演クリア':st.quests[c.qid]==='combatDone'?'ボス撃破済み・配信待ち':st.visitedHubs.includes(c.id)?'訪問済み・共演未完了':'未訪問・共演未完了'}));
 const areas=[omuta,...regional,...SPECIAL_STAGES.map(a=>{const reason=specialReason(st,a);return {id:a.id,kind:'area',name:a.name,open:kyushu&&(!reason||!!st.specialUnlocked?.[a.id]||st.visitedMaps.includes(a.id)||!!st.bossDefeated[a.boss]),ready:!reason,done:!!st.bossDefeated[a.boss],where:'特設エリア '+a.id,level:a.level,reason,progress:st.bossDefeated[a.boss]?'守護者撃破・エリアクリア':st.mapId===a.id?'探索中・守護者未撃破':st.visitedMaps.includes(a.id)?'訪問済み・守護者未撃破':'未訪問・守護者未撃破'};})];
 const trials=SPECIAL_STAGES.map(a=>{const d=trialOf(a.challenge),reason=!kyushu?'九州本編M16クリアで解放':a.level>progressionCap(st)?'次の地域編による上限Lv'+a.level+'以上の解放が必要です。':!st.bossDefeated[a.boss]?'この特設エリアの守護者撃破で解放':partyLevel(st)<d.level-20?'パーティLv'+(d.level-20)+'以上で解放':'';return {id:a.challenge,kind:'trial',name:d.name,open:kyushu&&(!reason||!!st.specialUnlocked?.[a.challenge]||!!st.challenges?.[a.challenge]?.attempts||!!st.challenges?.[a.challenge]?.cleared),ready:!reason,done:!!st.challenges?.[a.challenge]?.cleared,where:'特設チャレンジ '+a.challenge,level:a.level,reason,progress:st.challenges?.[a.challenge]?.cleared?'課題達成・初回クリア済み':'守護者撃破に加え、制限ターン・職業技などの課題をすべて達成する'};});
 const pending=areas.filter(a=>a.open&&!a.done),trialPending=trials.filter(a=>a.open&&!a.done);return {areas,trials,pending,trialPending,total:pending.length+trialPending.length};
}
function specialReminder(st,compact=false){const p=specialProgress(st);if(!p.total)return '';const counts=[p.pending.length?'エリア未クリア '+p.pending.length+'件':'',p.trialPending.length?'特設挑戦未達 '+p.trialPending.length+'件':''].filter(Boolean).join('・'),first=(p.pending[0]||p.trialPending[0]).name;return `<button class="special-reminder" data-a="openSheet" data-k="specialTracker" aria-label="解放済み ${esc(counts)}。${esc(first)}。特別エリアの進行一覧を開く"><b>★ ${compact?'未クリア'+p.total+'件':esc(counts)}</b><span>${esc(first)}${p.total>1?' ほか'+(p.total-1)+'件':''}</span><em>一覧 ▶</em></button>`;}
function renderSpecialTracker(){
 const st=G.st,p=specialProgress(st),rows=[...p.areas,...p.trials],pending=rows.filter(a=>a.open&&!a.done),locked=rows.filter(a=>!a.open&&!a.done),complete=rows.filter(a=>a.done);
 const card=a=>`<section class="qcard ${a.open&&!a.done?'special-pending':''}"><div class="srow"><b>${esc(a.name)}</b><span class="special-state ${a.done?'good':a.open?'warn':'dim'}">${a.done?'✓ クリア済み':a.open?a.ready===false?'解放済み・準備待ち':'解放済み・未クリア':'未解放'}</span></div><p class="small">${esc(a.where)}／適正Lv${a.level}</p><p>${esc(a.progress)}</p>${a.reason&&!a.done?`<p class="small warn">${esc(a.reason)}</p>`:''}<button class="btn" data-a="specialGuide" data-v="${a.id}">${a.id==='omuta'?(curHub()==='KY17'?'大牟田の依頼を確認':'大牟田への行き方・依頼'):a.kind==='trial'?'チャレンジの条件を確認':'エリアの条件・入口を確認'}</button></section>`;
 return `<p><b>解放済み：エリア未クリア${p.pending.length}件／特設チャレンジ未達${p.trialPending.length}件</b></p><p class="small">本編を進めながら、後から挑戦できます。解放済みの未クリア項目は探索画面に案内が残ります。クリアすると案内から外れます。</p><h3 class="label">解放済み・未クリア</h3><div class="stack">${pending.map(card).join('')||'<p class="good">現在解放されている項目はすべてクリア済みです。</p>'}</div><details class="special-fold"><summary>未解放・育成待ち（${locked.length}件）</summary><div class="stack">${locked.map(card).join('')||'<p>未解放の項目はありません。</p>'}</div></details><details class="special-fold"><summary>クリア済み（${complete.length}件）</summary><div class="stack">${complete.map(card).join('')||'<p>クリア記録はまだありません。</p>'}</div></details><p class="small">大牟田市編：M17のボス撃破後、配信目標達成でクリア。特設エリア：守護者撃破でクリア。特設チャレンジ：各課題を満たした初回勝利でクリア。ボス戦・特別チャレンジでもオートを使えます。</p>`;
}
function openSpecialGuide(id){const st=G.st;if(NATIONAL_SPECIALS.some(c=>c.id===id))return openSheet('nationalSpecial',{id});const a=specialProgress(st),entry=[...a.areas,...a.trials].find(a=>a.id===id);if(!entry)return;if(id==='omuta'){if(curHub()==='KY17')return openSheet('quests',{questFilter:'all',questFocus:'M17'});const open=hubUnlocked(st,'KY17');return openSheet('omutaGuide',{open});}if(entry.kind==='trial')return openSheet('challenges',{specialFocus:id});return openSheet('specialWorld',{specialFocus:id});}
function renderOmutaGuide(){const st=G.st,open=hubUnlocked(st,'KY17'),can=open&&!hubTravelReason(st,'KY17');return `<p><b>大牟田市編 ${st.quests.M17==='complete'?'✓ クリア済み':open?'解放済み・未クリア':'未解放'}</b></p><p>九州本編M16クリア後、全国街外マップの道を福岡市から南へ進むか、街の駅の新幹線で向かえます。</p><p>大牟田市で本編M17「${esc(QUESTS.M17.name)}」を受注 → 通常敵${QUESTS.M17.kills}体 → 地域ボス → 依頼帳から配信目標を達成するとクリアです。</p><p class="small">受注は大牟田市の安全地帯で行います。現在の依頼・配信待ちは依頼帳で確認できます。</p><button class="btn primary" data-a="worldGo" data-v="KY17" ${can?'':'disabled'}>大牟田市へ向かう</button>${!can?`<p class="small warn">${!open?'九州本編M16のクリアで解放されます。':'戦闘・配信・会話を終え、配信待ちを完了して安全地帯から出発してください。'}</p>`:''}<button class="btn" data-a="openSheet" data-k="specialTracker">特別エリアの進行一覧に戻る</button>`;}
function objective(){
  const st=G.st; const q=st.activeQuest;
  if(streamPending()) return `${streamPending()}：配信目標を達成する（依頼帳から開始）`;
  if(q){ const Q=QUESTS[q];if(st.quests[q]==='bossReady'&&mainPropReason(st,Q.boss))return '事件・謎解き帳で本編の準備品を渡す：'+mainPropForBoss(Q.boss).title;if(q==='N607'&&st.quests[q]==='bossReady'&&nationalFinalReason(st))return "活動予定で六地域のグラドル出演・撮影会の経験をそろえる"; if(st.quests[q]==="bossReady") return `${q}：${BOSSES[Q.boss].name}に挑む（${MAPS[Q.hub].name}の奥地）`; return `${q}：通常敵 ${st.qprog[q]||0}/${Q.kills}体（${HUBS[Q.hub].name}のA1～A3）`; }
  const avail=[...NATIONAL_CHAPTERS.flatMap(c=>c.hubs.map(mainQuestOf)),...NATIONAL_ENCORES.map(c=>c.qid),...Object.keys(QUESTS)].find(k=>QUESTS[k].main&&st.quests[k]==="available"); if(avail){ const Q=QUESTS[avail];if(st.nationalClear)return "全国本編クリア！ 任意の追加遠征・地域特別エリアへ（次の追加遠征："+HUBS[Q.hub].name+"）"; return curHub()===Q.hub ? `依頼帳で「${avail} ${Q.name}」を受ける` : `${HUBS[Q.hub].name}へ向かい、依頼「${avail}」を受ける`; }
  if(st.nationalClear)return "全国ツアー本編クリア！ 東京ドームの大成功を祝って、地域特別エリアや追加遠征へ";
  if(st.omutaClear) return "特別編（大牟田市）もクリア！ 育成・図鑑・配信の盛り上がり更新を続けられます";
  if(st.kyushuClear&&st.quests.M17!=="complete") return "九州編クリア！ 福岡市の西「大牟田市への道」から特別エリアへ行けます";
  if(st.kyushuClear) return "九州編クリア！ 育成・図鑑・任意依頼・配信の盛り上がり更新を続けられます";
  return "探索して仲間を育てよう";
}

/* ===== 画面の描画 ===== */
/* v7.21: readable mobile layouts; no proportional zoom on text or tap targets. */
const MOBILE_UI={safe:null,timer:0,lastKey:'',mapPress:null};
function mobileInsets(){if(typeof getComputedStyle!=='function')return {top:0,bottom:0};if(!MOBILE_UI.safe){const p=document.createElement('i');p.setAttribute('aria-hidden','true');p.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';document.body.appendChild(p);MOBILE_UI.safe=p;}const s=getComputedStyle(MOBILE_UI.safe);return {top:parseFloat(s.paddingTop)||0,bottom:parseFloat(s.paddingBottom)||0};}
function mobileLayoutPlan(m,run=null){const width=Math.max(240,m.width||390),height=Math.max(160,m.height||844),top=Math.max(4,m.safeTop||0),bottom=Math.max(0,m.safeBottom||0),cut=Math.max(0,Math.min(height*.4,m.cut||0));let dock=m.dock===false||m.keyboard?0:width<360||height<700?88:104;if(height<420&&dock)dock=72;if(m.explore&&dock)dock=Math.max(104,dock);let available=Math.floor(height-top-bottom-cut-dock-8);if(available<240&&dock){available+=dock;dock=0;}const tiny=available<248,focus=available<420,compact=available<580,wide=width>=560,header=focus||compact?44:52,log=tiny?44:compact?58:76,action=44,rule=run&&!focus&&run.enemies.some(e=>e.boss)?44:0,cols=2,memberRows=Math.ceil((run?.party.length||4)/cols),memberHeight=tiny?52:compact?56:62,party=memberRows*memberHeight+Math.max(0,memberRows-1)*4,enemy=tiny?52:compact?90:120,focusSpace=available-header-log-action-12,memberPage=tiny?1:focusSpace>=116?4:2,foePage=tiny?1:3,panelMin=Math.max(enemy,Math.ceil(Math.min(memberPage,run?.party.length||4)/cols)*memberHeight);
 return {width,height,top,bottom,cut,dock,available,tiny,focus,compact,wide,header,log,action,rule,party,enemy,memberPage,foePage,panelMin,pickerSize:available<370?2:4,overviewHeight:header+log+action+(focus?panelMin:rule+party+enemy)+(focus?12:20),mapMin:120};}

function mobilePlan(run=null){const vv=window.visualViewport,zoomed=vv&&vv.scale>1.05,height=vv&&!zoomed?Math.min(window.innerHeight||844,vv.height):window.innerHeight||844,insets=mobileInsets();const result=mobileLayoutPlan({width:window.innerWidth||390,height,safeTop:insets.top,safeBottom:insets.bottom,cut:typeof VFIT!=='undefined'?VFIT.value:0,explore:G.screen==='explore',dock:(G.st?.settings||G.tmpSettings)?.dock!==false,keyboard:!zoomed&&vv&&window.innerHeight-vv.height>140},run);if(G.mobileForceFocus)result.focus=true;return result;}
function syncMobileLayout(){const p=mobilePlan(G.st?.run);G.mobilePlan=p;const root=document.documentElement;for(const [k,v]of Object.entries({'--app-height':p.height+'px','--play-height':p.available+'px','--mobile-top':p.top+'px','--dockH':p.dock+'px'}))root.style.setProperty(k,v);document.body.classList.toggle('mobile-dock-hidden',!p.dock);document.body.classList.toggle('mobile-short',p.compact);return p;}
function queueMobileLayout(){clearTimeout(MOBILE_UI.timer);MOBILE_UI.timer=setTimeout(()=>{const el=document.activeElement,typing=el&&['INPUT','TEXTAREA','SELECT'].includes(el.tagName),saved=typing?{id:el.id,value:el.value,start:el.selectionStart,end:el.selectionEnd}:null;PAD.reset?.();MOBILE_UI.mapPress=null;if(G.screen==='explore'){G.walk.path=[];G.walk.pending=null;G.walk.prog=0;}if(saved?.id==='battleSearch')G.battlePickerQuery=saved.value;if(saved?.id==='helloWorkSearch'&&G.sheet==='helloWork')G.sheetData={...G.sheetData,q:saved.value};render();if(saved?.id){const now=document.getElementById(saved.id);if(now){now.value=saved.value;try{now.focus({preventScroll:true});if(saved.start!=null)now.setSelectionRange(saved.start,saved.end);}catch(e){}}}},90);}
function mobileName(text,n=12){const g=graphemes(String(text));return g.length>n?g.slice(0,n).join('')+'…':String(text);}
function compactNumber(n){return n>=10000?(Math.floor(n/1000)/10)+'万':String(n);}
const EXPLORATION_MENU=[['map','全国・地図'],['items','道具'],['equip','装備'],['status','ステータス'],['party','編成'],['townStudio','街・活動'],['broadcastHistory','配信実績'],['challenges','特別挑戦'],['specialTracker','特別エリア'],['record','記録'],['collection','図鑑・収集品']];
function systemHelpPlace(){
 if(G.screen==='explore')return 'none';
 if(G.sheet==='systemGuide')return 'none';
 if(G.screen!=='new'&&mobilePlan(G.st?.run).dock>0)return 'dock';
 if(G.dlg)return 'floating';
 if(G.sheet)return 'sheet';
 if(G.screen==='title')return 'title';
 if(G.screen==='result'||G.screen==='battle'&&(G.battleInspect||G.st?.run?.state!=='input'))return 'end';
 if(G.screen==='explore')return 'map';
 if(G.screen==='battle')return 'battle';
 return 'floating';
}
function systemHelpButton(place,cls=''){return systemHelpPlace()===place?'<button class="btn map-help-button '+cls+'" data-a="systemHelp" aria-label="ゲームシステム解説"><span>解説</span></button>':'';}
function renderMobileMenu(){return '<p>行きたい項目を選んでください。街を歩かずに開ける項目だけをまとめています。</p><div class="mobile-menu-grid">'+EXPLORATION_MENU.map(([k,n])=>'<button class="btn" data-a="openSheet" data-k="'+k+'">'+n+'</button>').join('')+'<button class="btn" data-a="systemHelp">解説</button></div><p class="small">近くを調べる：ジョイスティック中央の決定。複数ある場合は一覧から選べます。</p>';}
function renderMobileMapInfo(){const st=G.st,m=MAPS[st.mapId],a=zoneAt(m,st.pos.x,st.pos.y);return '<h3>'+esc(m.name)+'</h3><p>'+esc(objective())+'</p><p>'+st.day+'日目／保存：'+esc(G.saveStatus)+'</p><p>'+esc(mapScopeText())+'</p><p>'+esc(a?AREAS[a].name+'：適正Lv'+recommendedAreaLevel(AREAS[a]):'安全地帯')+'</p><p>地面を短くタップすると移動。建物や住民を選ぶと近づいて調べます。指をずらして離した時は移動しません。全国地図はメニューの「全国・地図」から開けます。街へ戻る時は道しるべから街の入口を選べます。</p>'+specialReminder(st,false);}
function mobileMapGeometry(width,height,zoom=2,travel=false){const A=Math.max(16,width-8),H=Math.max(16,height-8),scale=Math.min([1,2,3].includes(zoom)?zoom:2,Math.max(1,Math.floor(Math.min(A,H)/16)));return {scale,cols:Math.max(1,Math.min(travel?36:28,Math.floor(A/(16*scale)))),rows:Math.max(1,Math.min(travel?36:20,Math.floor(H/(16*scale))))};}
function mobileMapTile(e,r,cam,vw,vh){if(!r.width||!r.height||e.clientX<r.left||e.clientX>=r.left+r.width||e.clientY<r.top||e.clientY>=r.top+r.height)return null;return {x:Math.floor(((e.clientX-r.left)*vw*16/r.width+cam.x)/16),y:Math.floor(((e.clientY-r.top)*vh*16/r.height+cam.y)/16)};}
function mobileMapPointerDown(e){if(e.isPrimary===false){MOBILE_UI.mapPress=null;return;}if(e.button>0)return;MOBILE_UI.mapPress={id:e.pointerId,x:e.clientX,y:e.clientY,at:Date.now(),camera:camera(),moving:!!G.walk.path.length,moved:false};}
function mobileMapPointerMove(e){const p=MOBILE_UI.mapPress;if(p&&p.id===e.pointerId&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>12)p.moved=true;}
function mobileMapPointerEnd(e){const p=MOBILE_UI.mapPress;MOBILE_UI.mapPress=null;if(!p||p.id!==e.pointerId||e.type!=='pointerup'||p.moved||Date.now()-p.at>650||G.sheet||G.dlg)return;if(p.moving){G.walk.path=[];G.walk.pending=null;G.walk.prog=0;drawMap();return;}onMapTap(e);}
function renderMobilePartyStrip(){const st=G.st;return '<button class="pstrip mobile-pstrip" data-a="openSheet" data-k="status" aria-label="全員のHP・MPとステータスを詳しく見る"><span class="pstop"><span>Lv'+partyLevel(st)+'／'+progressionCap(st)+'　'+compactNumber(st.gold)+'G</span><span>状態を詳しく ▶</span></span><span class="mobile-mini-grid" style="--members:'+st.party.length+'">'+st.party.map(cid=>{const s=charStats(st,cid,partyLevel(st)),v=vitalOf(cid);return '<span class="mobile-mini '+(v.hp<=0?'ko':isLow(v.hp,s.maxHP)?'low':'')+'" aria-label="'+esc(charName(st,cid))+' HP'+v.hp+'/'+s.maxHP+' MP'+v.c+'/'+s.startC+'"><b>'+esc(charName(st,cid))+'</b><span>HP '+compactNumber(v.hp)+'</span><span class="bar"><i style="width:'+Math.round(v.hp/s.maxHP*100)+'%"></i></span><span>MP '+compactNumber(v.c)+'</span><span class="bar mp"><i style="width:'+Math.round(v.c/s.startC*100)+'%"></i></span></span>';}).join('')+'</span></button>';}
function renderMobileExplore(){const st=G.st,m=MAPS[st.mapId],pending=specialProgress(st).total,plan=mobilePlan();return '<section class="explore mobile-explore '+(plan.available<380?'short-map ':'')+(plan.wide&&plan.available<420?'wide-map ':'')+'"><header class="xhead"><button class="map-heading" data-a="openSheet" data-k="mobileMapInfo" aria-label="場所・目的・保存状況を詳しく見る"><b>'+esc(m.name)+'</b><span class="map-scope">'+esc(mapScopeText())+'</span><span class="goal">'+esc(objective())+'</span><span class="xsave">'+st.day+'日目／v'+GAME_VERSION+'／保存：'+esc(G.saveStatus)+'</span></button>'+systemHelpButton('map','map-head-help')+'</header>'+renderWorldNavigation()+'<div class="mapwrap"><canvas id="map" aria-label="'+esc(m.name)+'の地図。短いタップで移動、ドラッグでは移動しません。"></canvas><nav class="map-tools" aria-label="地図の補助操作">'+(m.mapScope==='city'?'<button class="btn" data-a="leaveCity">街外へ</button>':'')+(pending?'<button class="btn special-alert" data-a="openSheet" data-k="specialTracker">特別 '+pending+'</button>':'')+'</nav></div>'+renderMobilePartyStrip()+(plan.dock===0?'<nav class="menu-grid mobile-quick compact-map-menu" aria-label="メニュー"><button class="btn" data-a="openSheet" data-k="guide">道しるべ</button><button class="btn" data-a="openSheet" data-k="mobileMenu">メニュー</button><button class="btn" data-a="openSheet" data-k="quests">依頼帳</button><button class="btn" data-a="openSheet" data-k="settings">設定・保存</button></nav>':'')+'</section>';}
function mobileBattleActor(run){const c=G.cmd,a=run.party[c.actor];if(!a||a.hp<=0||a.acted){const next=run.party.find(m=>m.hp>0&&!m.acted);G.cmd={actor:next?.pos??null};return next;}return a;}
function mobileBattleHeader(run,plan){const d=trialOf(run.challengeId),label=run.cue?.active?({guard:'2人ガード',comment:'2人コメント',damage:'2人攻撃'}[run.cue.kind]+' '+run.cue.bits.length+'/2'):d?'特別挑戦':run.enemies.some(e=>e.boss)?'ボス戦':'通常戦闘',chain=run.kiraDone?'キラコメ済':'キラ'+run.chain.stage+'/3';return '<header class="mobile-bhead"><div><b>T'+run.turn+' '+esc(DIFFICULTY[run.difficulty].name)+'</b> <span>'+label+'</span><div class="mobile-gauge"><span>エール <b>'+run.A+'</b></span><span class="bar ale"><i style="width:'+run.A+'%"></i></span><span>連携'+run.B+'・'+chain+'</span></div></div>'+(plan.focus?'<button class="btn" data-a="battlePanel">'+(G.battlePanel==='party'?'味方':'敵')+' ⇄</button>':'')+systemHelpButton('battle')+'<button class="btn" data-a="openSheet" data-k="mobileBattleMenu">メニュー</button></header>';}
function mobileEnemyCard(run,e){const t=enemyAction(run,e),target=t.target!=null?run.party[t.target]:null,next=e.hp<=0?'撃破':t.type==='c'?'ため・攻撃なし':t.type==='a'?'全員に'+t.power:(target?mobileName(target.name,4):'1人')+'に'+t.power;return '<button class="mobile-enemy '+(e.hp<=0?'down':'')+'" id="ec'+e.slot+'" data-a="mobileEnemyInfo" data-v="'+e.slot+'" aria-label="'+esc(e.display)+' HP'+e.hp+'/'+e.maxHP+' '+esc(next)+'。詳しく見る"><canvas data-enemy="'+e.slot+'" width="'+(e.boss?64:32)+'" height="'+(e.boss?64:32)+'" class="esprite '+(e.boss?'boss':'')+'" aria-hidden="true"></canvas><b class="enemy-name">'+esc(e.display)+'</b><span class="enemy-hp">HP '+e.hp+'<small>／'+e.maxHP+(e.rarity>1?' ★'+e.rarity:'')+'</small></span><span class="bar enemy"><i style="width:'+Math.round(e.hp/e.maxHP*100)+'%"></i></span><span class="enemy-next">'+esc(next)+(t.heavy?' !':'')+'</span></button>';}
function mobileMemberCard(run,m){const status=m.hp<=0?'戦闘不能':m.acted?'行動済':'選択可';return '<button class="pcard mobile-member '+(m.hp<=0?'ko':m.acted?'done':'ready')+' '+(G.cmd.actor===m.pos?'on':'')+'" data-a="mobileMember" data-i="'+m.pos+'" aria-label="'+esc(m.name)+' '+status+' HP'+m.hp+'/'+m.maxHP+' MP'+m.c+'/'+m.maxC+'"><span class="member-name"><b>'+esc(m.name)+'</b><small>'+status+'</small></span><span class="mobile-vital">HP <b>'+m.hp+'</b>/'+m.maxHP+'</span><span class="mobile-vital mp">MP <b>'+m.c+'</b>/'+m.maxC+(m.ward?'・護'+m.ward:'')+'</span></button>';}
function mobileBattleLogEntries(run,plan=mobilePlan(run)){const limit=Math.max(10,Math.floor((Math.min(plan.width,520)-118)/14))*(plan.tiny?1:2),parts=[],logs=(run.log||[]).slice(-80);for(const [logIndex,line]of logs.entries()){const g=graphemes(line);for(let i=0;i<g.length;i+=limit)parts.push({text:g.slice(i,i+limit).join(''),logIndex});}return parts.length?parts:[{text:'行動を選んでください。',logIndex:0}];}
function mobileBattleLogPages(run,plan=mobilePlan(run)){return mobileBattleLogEntries(run,plan).map(e=>e.text);}
function renderMobileLiveLog(run,plan){const entries=mobileBattleLogEntries(run,plan),logs=(run.log||[]).slice(-80),key=run.seq+':'+JSON.stringify(logs)+':'+plan.width+':'+plan.tiny,prior=G.mobileLogSeen;if(G.liveLogKey!==key){if(!prior||prior.seq!==run.seq)G.liveLogPage=0;else if(JSON.stringify(prior.logs)!==JSON.stringify(logs)){let overlap=0;for(let k=1;k<=Math.min(prior.logs.length,logs.length);k++)if(JSON.stringify(prior.logs.slice(-k))===JSON.stringify(logs.slice(0,k)))overlap=k;const start=entries.findIndex(e=>e.logIndex>=overlap);G.liveLogPage=Math.max(0,start);}G.liveLogKey=key;G.mobileLogSeen={seq:run.seq,logs:logs.slice()};}G.liveLogPage=Math.max(0,Math.min(entries.length-1,G.liveLogPage||0));G.liveLogPages=entries.length;return '<section class="mobile-log" aria-label="進行コメント"><button class="btn" data-a="liveLogPage" data-v="'+(G.liveLogPage-1)+'" '+(!G.liveLogPage?'disabled':'')+' aria-label="前の進行コメント">◀</button><button class="log-copy" data-a="battleInspect" data-v="log"><small>進行 '+(G.liveLogPage+1)+'/'+entries.length+'・全文を読む</small><span role="log" aria-live="polite">'+esc(entries[G.liveLogPage].text)+'</span></button><button class="btn" data-a="liveLogPage" data-v="'+(G.liveLogPage+1)+'" '+(G.liveLogPage>=entries.length-1?'disabled':'')+' aria-label="次の進行コメント">▶</button></section>';}

function mobileBattleRule(run){const d=trialOf(run.challengeId),cue=run.cue;if(cue?.active)return 'ため！ '+({guard:'2人でガード',comment:'2人でコメント',damage:'2人で攻撃'}[cue.kind])+' '+cue.bits.length+'/2 → 強攻撃20％減';if(d)return 'オート可・課題 '+trialConditions(run).filter(c=>c.ok).length+'/'+trialConditions(run).length+'／'+run.turn+'/'+run.turnLimit+'ターン';if(!run.enemies.some(e=>e.boss))return '通常戦闘・オート使用可';return 'オート可／シールド'+(run.A<40&&!run.kiraDone?'有効':'解除')+'・技は軽減なし';}
function renderMobileBattle(run){const plan=mobilePlan(run);mobileBattleActor(run);if(G.battlePicker)return renderMobilePicker(run,plan);if(G.battleCommand&&!G.auto)return renderMobileCommand(run,plan);const focus=plan.focus,panel=G.battlePanel==='party'?'party':'enemies',members=run.party;let shown=members;if(focus&&panel==='party'){const pages=Math.ceil(members.length/plan.memberPage);G.battleMemberPage=Math.max(0,Math.min(pages-1,G.battleMemberPage||0));shown=members.slice(G.battleMemberPage*plan.memberPage,(G.battleMemberPage+1)*plan.memberPage);}
 const foePages=Math.ceil(run.enemies.length/plan.foePage);G.battleFoePage=Math.max(0,Math.min(foePages-1,G.battleFoePage||0));const shownFoes=focus?run.enemies.slice(G.battleFoePage*plan.foePage,(G.battleFoePage+1)*plan.foePage):run.enemies;const foes='<div class="mobile-enemies" style="--foes:'+shownFoes.length+'">'+shownFoes.map(e=>mobileEnemyCard(run,e)).join('')+'</div>',party='<div class="mobile-members" style="--party-cols:'+2+'">'+shown.map(m=>mobileMemberCard(run,m)).join('')+'</div>',a=mobileBattleActor(run),auto=G.auto&&autoAllowed(run),action=auto?'<button class="btn" data-a="autoMode">'+(autoMode()==='tap'?'タップ進行':'自動進行')+'</button>'+(G.autoWait?'<button class="btn primary" data-a="autoNext">次の行動</button>':'')+'<button class="btn danger" data-a="autoOff">オート停止</button>':'<button class="btn primary" data-a="battleCommandOpen" data-default-focus>'+esc(a?mobileName(a.name,9):'仲間')+'：行動を選ぶ</button>';
 return '<section class="mobile-battle '+(plan.tiny?'tiny ':'')+(!plan.focus&&run.enemies.some(e=>e.boss)?'has-tactic ':'')+(plan.compact?'compact ':'')+(focus?'focus ':'')+'" style="--battle-header:'+plan.header+'px;--battle-log:'+plan.log+'px;--enemy-height:'+plan.enemy+'px;--party-height:'+plan.party+'px">'+mobileBattleHeader(run,plan)+(!focus&&run.enemies.some(e=>e.boss)?'<button class="btn mobile-tactic" data-a="battleInspect" data-v="rules">'+esc(mobileBattleRule(run))+'</button>':'')+(focus?'<div class="mobile-focus-panel">'+(panel==='party'?party:foes)+'</div>':foes+party)+'<div class="mobile-battle-action '+(auto?'auto':'')+'">'+action+'</div>'+renderMobileLiveLog(run,plan)+'</section>';}
const MOBILE_COMMANDS=[['attack','攻撃'],['skill','技・必殺技'],['comment','応援コメント'],['item','道具'],['guard','ガード'],['rest','ひと息'],['meter','全体攻撃'],['family','回復・復活'],['other','撤退・休止']];
function mobileSkillCandidates(run,a){const base={id:'',name:JOBS[a.job].skill,need:skillNeeds(a.job),cost:JOBS[a.job].cost,base:true,desc:JOBS[a.job].desc(a.S)};return [base,...(a.extraSkills||[]).map(id=>EXTRA_SKILLS[id]).filter(sk=>sk&&battleGearSkillAvailable(a,sk))];}
function mobileSkillCategory(sk){if(sk.ultimate)return 'ultimate';if(sk.ultra)return 'ultra';if(['heal','healAll','mp'].includes(sk.effect))return 'heal';if(['ward','wardAll','rally'].includes(sk.effect))return 'support';if(['strike','pierce','all'].includes(sk.effect))return 'attack';return 'base';}
function mobilePickerResults(run,a,plan=mobilePlan(run)){const mode=G.battlePicker,query=guideSearchText(G.battlePickerQuery||''),cat=G.battlePickerFilter||'all';let list=mode==='item'?(run.bag||[]).filter(x=>x.n>0&&ITEMS[x.id]&&canUseJobItem(a.job,a.R,ITEMS[x.id])).map(x=>({...ITEMS[x.id],id:x.id,n:x.n})):mobileSkillCandidates(run,a);list=list.filter(it=>(!query||guideSearchText(it.name+' '+(it.desc||it.text||'')).includes(query))&&(cat==='all'||mode==='item'&&it.cat===cat||mode==='skill'&&mobileSkillCategory(it)===cat));const pages=Math.max(1,Math.ceil(list.length/plan.pickerSize)),page=Math.max(0,Math.min(pages-1,G.battlePickerPage||0));return {list,pages,page,visible:list.slice(page*plan.pickerSize,(page+1)*plan.pickerSize)};}
function renderMobilePicker(run,plan){const a=mobileBattleActor(run),mode=G.battlePicker,r=mobilePickerResults(run,a,plan),cats=mode==='skill'?[['all','すべて'],['base','基本・引継'],['attack','攻撃'],['heal','回復・MP'],['support','防護・応援'],['ultimate','必殺技'],['ultra','超レア技']]:[['all','すべて'],...new Set((run.bag||[]).map(x=>ITEMS[x.id]?.cat).filter(Boolean))].map(x=>Array.isArray(x)?x:[x,x]);G.battlePickerPages=r.pages;G.battlePickerPage=r.page;return '<section class="mobile-command cmd mobile-picker '+(plan.available<350?'short':'')+'"><header class="command-head"><div><b>'+esc(a.name)+'：'+(mode==='skill'?'技・必殺技':'道具')+'</b><small>MP '+a.c+'/'+a.maxC+'／'+r.list.length+'件</small></div>'+systemHelpButton('battle')+'<button class="btn" data-a="battlePickerClose">戻る</button></header><form id="battleSearchForm" class="battle-search"><select id="battlePickerFilter" aria-label="技や道具の分類">'+cats.map(([k,n])=>'<option value="'+esc(k)+'" '+((G.battlePickerFilter||'all')===k?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select><input id="battleSearch" type="search" maxlength="60" value="'+esc(G.battlePickerQuery||'')+'" placeholder="名前・効果" aria-label="技や道具を検索"><button type="button" class="btn" data-a="battlePickerSearch">検索</button></form><div class="picker-list">'+r.visible.map(it=>{const wait=mode==='skill'&&!it.base?Math.max(0,(a.skillReady?.[it.id]||0)-run.turn):0,mp=mode==='skill'?it.base?it.cost:skillMpCost(a,it):0,locked=mode==='skill'&&(mp>a.c||wait>0||it.ultimate&&(run.turn<3||a.ultimateUsed||run.A<35));return '<button class="btn '+(locked?'unavailable':'')+'" data-a="battlePickerSelect" data-v="'+esc(it.id)+'"><b>'+esc(it.name)+'</b><small>'+(mode==='item'?'所持 '+it.n+'個':(mp>a.c?'MP不足 ':'')+'MP'+mp+(wait?'・待ち'+wait+'T':'')+(it.ultimate?'・エール35／3Tから・1戦1回':''))+'</small></button>';}).join('')+(!r.list.length?'<p>見つかりません。検索を消すか、種類を「すべて」にしてください。</p>':'')+'</div><nav class="picker-pages"><button class="btn" data-a="battlePickerPage" data-v="'+(r.page-1)+'" '+(!r.page?'disabled':'')+'>◀ 前</button><span>'+(r.page+1)+'/'+r.pages+'</span><button class="btn" data-a="battlePickerPage" data-v="'+(r.page+1)+'" '+(r.page>=r.pages-1?'disabled':'')+'>次 ▶</button></nav></section>';}
function renderMobileCommand(run,plan=mobilePlan(run)){const a=mobileBattleActor(run);if(!a)return '';const c=G.cmd;let body='',preview='',ok=false,act=null,need='none';const pick=(key,id,label,on,disabled=false)=>'<button class="btn '+(on?'on':'')+'" data-a="cmdSet" data-k="'+key+'" data-v="'+esc(id)+'" aria-pressed="'+!!on+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
 if(!c.type)body='<p class="command-hint">行動を選ぶ → 対象を選ぶ → 「確定」</p><div class="mobile-types">'+MOBILE_COMMANDS.map(([k,n])=>'<button class="btn" data-a="mobileCmdType" data-v="'+k+'" '+((k==='meter'&&run.A<80||k==='family'&&run.A<40)?'disabled':'')+'>'+n+(k==='meter'?'<small>エール80</small>':k==='family'?'<small>エール40</small>':'')+'</button>').join('')+'</div>';
 else{const sk=c.skill&&EXTRA_SKILLS[c.skill],it=c.item&&ITEMS[c.item];need=c.type==='attack'?'enemy':c.type==='comment'?'line':c.type==='skill'?(sk?.need||skillNeeds(a.job)):c.type==='item'?(it?itemNeeds(it):'none'):'none';if(c.type==='skill'||c.type==='item')body+='<button class="btn selected-tech" data-a="battlePickerOpen" data-v="'+c.type+'">'+esc(c.type==='skill'?(sk?.name||JOBS[a.job].skill):(it?.name||'道具を選ぶ'))+' <small>変更・検索 ▶</small></button>';
 const live=run.enemies.filter(e=>e.hp>0);if(need==='enemy'&&live.length===1)c.target=live[0].slot;
 if(need==='mode'){if(!(plan.available<300&&c.mode))body+='<div class="mobile-targets">'+((sk?.baseJob||a.job)==='J04'?[['hp','HP補給'],['c','MP補給']]:[['safe','堅実'],['bold','強気']]).map(([k,n])=>pick('mode',k,n,c.mode===k)).join('')+'</div>';need=c.mode==='hp'?'ally':c.mode==='c'?'allyOther':c.mode?'enemy':'none';}
 if(need==='enemy'&&plan.available<350)body+='<select class="native-target" id="nativeBattleTarget" data-k="target" aria-label="攻撃する敵"><option value="">敵を選ぶ</option>'+live.map(e=>'<option value="'+e.slot+'" '+(c.target===e.slot?'selected':'')+'>'+esc(e.display)+'</option>').join('')+'</select>';else if(need==='enemy')body+='<p class="target-label">攻撃する敵</p><div class="mobile-targets">'+live.map(e=>pick('target',e.slot,mobileName(e.display,12),c.target===e.slot)).join('')+'</div>';
 if(['ally','allyOther','down'].includes(need)){const list=run.party.filter(m=>need==='down'?m.hp<=0:m.hp>0&&(need!=='allyOther'||m!==a));if(list.length===1)c.ally=list[0].pos;if(plan.available<350)body+='<select class="native-target" id="nativeBattleTarget" data-k="ally" aria-label="使う相手"><option value="">味方を選ぶ</option>'+list.map(m=>'<option value="'+m.pos+'" '+(c.ally===m.pos?'selected':'')+'>'+esc(m.name)+' HP'+m.hp+'</option>').join('')+'</select>';else body+='<p class="target-label">使う相手</p><div class="mobile-targets">'+list.map(m=>pick('ally',m.pos,mobileName(m.name,10)+' HP'+m.hp,c.ally===m.pos)).join('')+'</div>'+(list.length?'':'<p>対象になる仲間がいません。</p>');}
 if(need==='line'&&plan.available<350)body+='<select class="native-target" id="nativeBattleTarget" data-k="line" aria-label="コメントを選ぶ"><option value="">コメントを選ぶ</option>'+['greet','plan','thanks'].map(k=>'<option value="'+k+'" '+(c.line===k?'selected':'')+'>'+LINE_NAMES[k]+'</option>').join('')+'</select>';else if(need==='line')body+='<p class="target-label">コメントを選ぶ</p><div class="mobile-targets">'+['greet','plan','thanks'].map(k=>pick('line',k,LINE_NAMES[k],c.line===k)).join('')+'</div>';
 if(c.type==='other'&&!c.o)body+='<div class="mobile-targets"><button class="btn" data-a="retreat">撤退</button><button class="btn" data-a="pauseBattle">休止</button></div>';
 act=buildAct(a);if(act){const p=planAction(run,a.pos,act);ok=p.ok;preview=p.ok?previewText(run,a,p):'<span class="warn">'+esc(p.reason)+'</span>';}else preview='<span>技・道具と対象を選んでください。</span>';
 }
 G.battlePreview=preview;return '<section class="mobile-command cmd '+(plan.available<350?'short':'')+'"><header class="command-head"><div><b>'+esc(a.name)+' '+(MOBILE_COMMANDS.find(([k])=>k===(c.type==='other'&&c.o?c.o:c.type))?.[1]||'行動選択')+'</b><small>HP '+a.hp+'/'+a.maxHP+'　MP '+a.c+'/'+a.maxC+'</small></div>'+systemHelpButton('battle')+'<button class="btn" data-a="battleCommandClose">戦況へ</button></header><div class="command-body">'+body+'</div>'+(c.type?'<button class="mobile-preview" data-a="battleInspect" data-v="preview" aria-label="効果予測を詳しく読む">'+preview+'</button><footer class="command-footer"><button class="btn" data-a="mobileCmdType" data-v="">行動を変更</button><button class="btn primary" data-a="mobileConfirm" '+(!act||!ok||G.readOnly?'disabled':'')+'>確定</button></footer>':'')+'</section>';}
function openMobileBattleDetail(group,name){ACT.battleInspect({dataset:{v:group}});if(G.endPager&&name){const i=G.endPager.pages.findIndex(p=>p.group===group&&p.blocks.some(b=>b.includes(esc(name))));if(i>=0){G.endPager.index=i;render();}}}
function renderMobileBattleMenu(){const run=G.st.run;return '<p>'+esc(mobileBattleRule(run))+'</p><div class="mobile-menu-grid"><button class="btn" data-a="mobileInspect" data-v="rules">ルール・課題</button><button class="btn" data-a="mobileInspect" data-v="foes">敵の詳細</button><button class="btn" data-a="mobileInspect" data-v="growth">味方の詳細</button><button class="btn" data-a="mobileInspect" data-v="support">応援・連携</button><button class="btn" data-a="mobileInspect" data-v="log">進行コメント全文</button>'+'<button class="btn" data-a="mobileAuto">'+(G.auto?'オート停止':'オート開始')+'</button>'+'<button class="btn" data-a="pauseBattle">休止・保存</button></div>';}

const RETIRED_MAP_CONTROL_SELECTOR='.mobile-explore .map-tools [data-k="world"],.mobile-explore .map-tools [data-a="worldReturn"],.mobile-explore .map-tools [data-a="mapZoom"]';
function removeRetiredMapControls(root=document){for(const el of root.querySelectorAll(RETIRED_MAP_CONTROL_SELECTOR))el.remove();}
function freshGameUrl(href,stamp=Date.now()){const u=new URL(href);u.searchParams.set('v',GAME_VERSION);u.searchParams.set('refresh',String(stamp));return u.href;}
function render(){
  if(G.st){normalizeChapterLocation(G.st);ensureWorld(G.st);rememberSpecialUnlocks(G.st);}
  checkSheetNavigation();
  syncAudioMix();
  syncMobileLayout();
  const root=$("#screen"); if(!root) return;
  stopBattleTimer();
  const s=G.screen;
  if(!(s==="result"||s==="battle"&&G.st&&G.st.run&&(G.st.run.state!=="input"||G.battleInspect)))G.endPager=null;
  let html="";
  if(s==="title") html=renderTitle();
  else if(s==="new") html=renderNew();
  else if(s==="explore") html=renderExplore();
  else if(s==="battle") html=renderBattle();
  else if(s==="result") html=renderResult();
  else if(s==="stream") html=renderStream();
  document.body.classList.toggle("in-battle", s==="battle"); document.body.classList.toggle("in-explore", s==="explore");
  document.body.classList.toggle("in-end",s==="result"||s==="battle"&&G.st&&G.st.run&&(G.st.run.state!=="input"||G.battleInspect));
  const dockOff = s==="new" || (G.st? G.st.settings.dock===false : (G.tmpSettings&&G.tmpSettings.dock===false));
  document.body.classList.toggle("no-dock", !!dockOff);
  document.body.classList.toggle("stick-left", padSide()==="left");
  document.body.classList.toggle("reduce-motion", !!(G.st&&G.st.settings.reduceMotion));
  root.innerHTML = heroSub(html + systemHelpButton('floating','help-fallback') + renderSheet() + renderDialog()) + `<div id="toast" class="toast" role="status" hidden></div>`;
  if(s==="explore"){removeRetiredMapControls(root);mountCanvas();}
  if(s==="battle"&&G.st.run&&G.st.run.state==="input"){ drawEnemies(); startBattleTimer(); }
  if(s==="new") mountNew();
  if(s==="title"){ drawTitleArt(); if(!G.titleRaf) G.titleRaf=requestAnimationFrame(titleLoop); }
  drawMiniSprites();
  const dh=document.querySelector("#dock [data-dock-hint]"); if(dh) dh.textContent = (s==="explore"&&!G.sheet&&!G.dlg)?"スティック：移動／決定：調べる":"スティック：カーソル／決定・戻る";
  if(G.dlg){ const b=$("#dlgNext"); if(b) b.focus({preventScroll:true}); }
  syncDockAuto();
  if(G.endPager&&G.endPager.resetScroll){G.endPager.resetScroll=false;if(typeof window.scrollTo==="function")window.scrollTo(0,0);}
  PAD.restore();
  fitEndView();fitBattleView();
  restoreSheetPosition();stampBattleControls();
}
/* 戦闘中だけ、スティックの隣にオートボタンを出す（オート中は「停止」に切り替わる） */
function syncDockAuto(){
  for(const id of ['dockGuide','dockMenu','dockQuests','dockSettings']){const el=document.getElementById(id);if(el)el.hidden=G.screen!=='explore';}
  const nearbyConfirm=G.screen==='explore'&&!G.sheet&&!G.dlg&&!G.readOnly;const stick=document.querySelector('#dock .stick');if(stick)stick.setAttribute('aria-label',nearbyConfirm?'スティック。ドラッグで移動、中央の決定で近くを調べる':'スティック。ドラッグでカーソル移動、中央で決定');

  const help=document.getElementById("dockHelp");if(help)help.hidden=systemHelpPlace()!=="dock";
  const da=document.getElementById("dockAuto"); if(!da) return;
  const run=G.st&&G.st.run; const show = G.screen==="battle" && run && run.state==="input" && !G.sheet && !G.dlg && !G.battleInspect && !G.battleCommand && !G.battlePicker;
  da.hidden=!show; if(!show) return;
  
  const on=!!G.auto; da.dataset.a=on?"autoOff":"autoOn"; da.classList.toggle("on",on); da.disabled=!!G.readOnly;
  da.innerHTML=on?"<b>停止</b><small>オート中</small>":"<b>AUTO</b><small>オート</small>";
  da.setAttribute("aria-label", on?"オートを中断する":"戦闘オートを始める");
}
function statusBar(){
  const st=G.st; const m=MAPS[st.mapId];
  return `<header class="status">
    <div class="srow"><span class="place">${esc(m.name)}</span><span>${st.day}日目</span></div>
    <div class="goal">${esc(objective())}</div>
      ${specialReminder(st,true)}
    ${(()=>{const t=townChange(st,curHub());return t?`<p class="small town-news">${esc(t.title)}：${esc(t.text)} ${esc(t.side)}${(st.townChoices||{})[curHub()]?"・"+esc(st.townChoices[curHub()]==="quiet"?"声の展示が街に残っている":"住民の交流会が続いている"):t.phase>=1?` <button class="btn" data-a="townEvent">街の特別イベント</button>`:""}</p>`:"";})()}
    <div class="srow small"><span>レベル${partyLevel(st)}／${progressionCap(st)}・${st.gold.toLocaleString()}ゴールド・チケット${st.tickets.toLocaleString()}</span><span>もえ ${MOE_RANKS[st.moeRank]}</span></div>
    <div class="small" aria-live="polite">保存：<span id="saveStat">${esc(G.saveStatus)}</span>${G.readOnly?"（別のタブで操作中のため閲覧のみ）":""}</div>
  </header>`;
}

/* ---- タイトル ---- */
function renderTitle(){
  return `<section class="title-screen">
    <canvas id="titleArt" width="160" height="64" aria-hidden="true"></canvas>
    <h1 class="logo"><span class="main">トップライバーへの道</span><span class="sub">昭和風ドットRPG</span></h1>
    <p class="note">2026年10月23日の初期化前のセーブ・バックアップは利用できません。</p>
    ${G.resetCleanup?.pending.length?`<p class="note">初期化前に開いていたゲームのタブを閉じ、更新版を開き直してください。</p>`:""}${G.resetCleanup?.localFailed||G.resetCleanup?.failed.length?`<p class="note">旧記録の消去を完了できない保存領域があります。初期化前の記録は読み込み対象から外れています。</p>`:""}
    <div class="menu">
      <button class="btn primary" data-a="newGame">はじめから</button>
      <button class="btn" data-a="continue" ${G.hasSave?"":"disabled"}>つづきから${G.hasSave?"":"（記録なし）"}</button>
      <button class="btn" data-a="openSheet" data-k="settings">設定</button>
      ${systemHelpButton("title")}
      <button class="btn" data-a="openSheet" data-k="about">この作品について</button>
      <button class="btn share-btn" data-a="openSheet" data-k="share">📣 友だちに教える（URLを共有）</button>
    </div>
    <p class="note">非公式の創作ゲームです。実在のサービス・アカウントとは連携しません。音と保存の案内は「設定」で確認できます。</p>
    <p class="note">${IS_PUBLIC?"公開版 ":""}v${GAME_VERSION}${window.TLR_BUILD?`（${window.TLR_BUILD}）`:""}</p>
  </section>`;
}

/* タイトル画面：星のまたたき・流れ雲・流れ星・2人の呼吸（v5.36） */
function titleStill(){ return !!((G.st&&G.st.settings.reduceMotion)||(G.tmpSettings&&G.tmpSettings.reduceMotion)); }
function drawTitleArt(){
  const c=$("#titleArt"); if(!c) return; const g=c.getContext("2d"); g.imageSmoothingEnabled=false;
  const now=performance.now(), still=titleStill(), f=still?1:Math.floor(now/400)%4;
  g.drawImage(ART.stage("KY02-A3",f),0,0);
  if(!still){
    for(let i=0;i<12;i++){ const x=(i*37+11)%160, y=(i*13+3)%22; const tw=(Math.floor(now/260)+i*3)%7; if(tw===0){ g.fillStyle=PAL.cream; g.fillRect(x-1,y,3,1); g.fillRect(x,y-1,1,3); } else if(tw<3){ g.fillStyle=PAL.gold; g.fillRect(x,y,1,1); } }
    const ph=now%7000; if(ph<700){ const k=ph/700, sx=150-k*90, sy=2+k*16; g.fillStyle=PAL.cream; g.fillRect(Math.round(sx),Math.round(sy),2,1); g.fillStyle="rgba(244,236,216,.5)"; g.fillRect(Math.round(sx)+2,Math.round(sy)-1,5,1); }
    for(let i=0;i<2;i++){ const x=Math.round(((now/110+i*110)%220)-40), y=6+i*8; g.fillStyle="rgba(244,236,216,.35)"; g.fillRect(x,y,20,3); g.fillRect(x+5,y-2,10,2); g.fillRect(x+3,y+3,15,1); }
  }
  for(let i=0;i<10;i++){const x=i*17-2,h=6+(i*7)%11;g.fillStyle=PAL.navy;g.fillRect(x,48-h,13,h);g.fillStyle=PAL.gold;g.fillRect(x+3,49-h,2,1);}
  g.fillStyle=PAL.ink;g.fillRect(0,55,160,9);g.fillStyle=PAL.gold;g.fillRect(0,55,160,1);for(let i=0;i<12;i++){g.fillStyle=i%2?PAL.aqua:PAL.coral;g.fillRect(4+i*14,58,2,1);}
  const b=still?0:Math.floor(now/520)%2;
  g.drawImage(ART.person("hero",PAL.ink,PAL.red,0,0,{}),58,34-b);
  g.drawImage(ART.person("moe",PAL.violet,PAL.cream,0,0,{long:true,ribbon:PAL.coral}),80,34-(1-b));
  g.drawImage(ART.object("tower",still?1:Math.floor(now/600)%2),134,6);
}
function titleLoop(){ if(G.screen!=="title"||document.hidden||!$("#titleArt")){ G.titleRaf=0; return; } drawTitleArt(); G.titleRaf=requestAnimationFrame(titleLoop); }

/* ---- 主人公設定（第06D・06E節） ---- */
function careerGearText(c){ const g=CAREER_GEAR_ID[c]; if(!g) return "なし"; const w=EQUIP[g[0]], a=EQUIP[g[1]]; const t=it=>it.text.replace(/（職歴.*$/,"").replace(/。$/,"");
  return `武器「${esc(w.name)}」（${esc(t(w))}）・防具「${esc(a.name)}」（${esc(t(a))}）`; }
function renderNew(){
  const n=G.newGame;
  const hn=n.hname||"", hg=n.hgender||null;
  if(n.step===2){
    const v=validateName(n.name), hv=validateName(hn);
    return `<section class="win">
      <h2 class="label">確認</h2>
      <div class="nrow"><canvas id="heroPrev" width="16" height="24" class="sprite-lg" aria-hidden="true"></canvas><canvas id="heroinePrev" width="16" height="24" class="sprite-lg" aria-hidden="true"></canvas></div>
      <h3 class="label">主人公</h3>
      <dl class="kv"><dt>名前</dt><dd>${esc(v.value)}（${v.count}文字）</dd><dt>性別</dt><dd>${esc(n.gender)}</dd>
      <dt>職歴</dt><dd>${esc(n.career)}</dd><dt>初期装備</dt><dd>${careerGearText(n.career)}</dd><dt>初期ジョブ</dt><dd>アイドルオタク</dd><dt>背景</dt><dd>32歳・福岡県福岡市出身</dd></dl>
      <h3 class="label">${hg==="男性"?"ヒーロー":"ヒロイン"}（メインライバー）</h3>
      <dl class="kv"><dt>名前</dt><dd>${esc(hv.value)}（${hv.count}文字）</dd><dt>性別</dt><dd>${esc(hg)}</dd>
      <dt>初期ジョブ</dt><dd>ライバー</dd><dt>背景</dt><dd>アイドルグループ「おやすみセカイ」元メンバー。脱退後に主人公と出会い、グラドル活動と配信を続けながら全国的な成功を目指す</dd></dl>
      <p class="small">名前と性別はこの冒険で固定されます。性別による能力・成長・結末の差はありません。</p>
      <div class="stack"><button class="btn primary" data-a="startGame">この2人で始める</button>
      <button class="btn" data-a="newBackH">ヒロインの設定に戻る</button><button class="btn" data-a="newBack">主人公の設定に戻る</button></div></section>`;
  }
  if(n.step==="h"){
    return `<section class="win">
      <h2 class="label">ヒロイン役の設定</h2>
      <p class="small">一緒に旅をするメインライバーです。名前と性別を決めてください。</p>
      <label for="nameInput" class="field-label">名前（全角1～${NAME_MAX}文字）</label>
      <input id="nameInput" class="input" autocomplete="off" enterkeyhint="done" value="${esc(hn)}" aria-describedby="nameHelp">
      <div id="nameHelp" class="small" aria-live="polite"></div>
      <fieldset class="gender"><legend class="field-label">性別（ゲーム内の設定）</legend>
        ${["女性","男性"].map(g=>`<button class="btn choice ${hg===g?"on":""}" data-a="pickHGender" data-v="${g}" aria-pressed="${hg===g}">${hg===g?"▶ ":""}${g}</button>`).join("")}
      </fieldset>
      <canvas id="heroinePrev" width="16" height="24" class="sprite-lg" aria-hidden="true"></canvas>
      <div class="stack"><button class="btn primary" id="toConfirm" data-a="newNextH">確認へ</button>
      <button class="btn" data-a="newBack">主人公の設定に戻る</button></div>
    </section>`;
  }
  return `<section class="win">
    <h2 class="label">主人公の設定</h2>
    <label for="nameInput" class="field-label">名前（全角1～${NAME_MAX}文字）</label>
    <input id="nameInput" class="input" autocomplete="off" enterkeyhint="done" value="${esc(n.name)}" aria-describedby="nameHelp">
    <div id="nameHelp" class="small" aria-live="polite"></div>
    <label for="careerSel" class="field-label">職歴（${CAREERS.length}種類から選ぶ・能力やジョブには影響しません）</label>
    <select id="careerSel" class="input" data-change="career" aria-describedby="careerHelp">
      <option value="" ${n.career?"":"selected"} disabled>選んでください</option>
      ${CAREER_GROUPS.map(([g,list])=>`<optgroup label="${esc(g)}">${list.map(c=>`<option value="${esc(c)}" ${n.career===c?"selected":""}>${esc(c)}</option>`).join("")}</optgroup>`).join("")}
    </select>
    <p id="careerHelp" class="small">${n.career?`選択中：<b>${esc(n.career)}</b>。冒険の前に就いていた仕事です（ジョブとは別）。<br>初期装備：${careerGearText(n.career)}`:"冒険の前に就いていた仕事を選んでください。職歴に合わせた武器・防具を装備して始めます。"}</p>
    <fieldset class="gender"><legend class="field-label">性別（ゲーム内の主人公設定）</legend>
      ${["男性","女性"].map(g=>`<button class="btn choice ${n.gender===g?"on":""}" data-a="pickGender" data-v="${g}" aria-pressed="${n.gender===g}">${n.gender===g?"▶ ":""}${g}</button>`).join("")}
    </fieldset>
    <canvas id="heroPrev" width="16" height="24" class="sprite-lg" aria-hidden="true"></canvas>
    <div class="stack"><button class="btn primary" id="toConfirm" data-a="newNext">次へ（ヒロイン役の設定）</button>
    <button class="btn" data-a="toTitle">タイトルへ戻る</button></div>
  </section>`;
}
function mountNew(){
  const n=G.newGame, isH=n.step==="h", key=isH?"hname":"name";
  const sel=$("#careerSel"); if(sel) sel.addEventListener("change",()=>{ const inp=$("#nameInput"); if(inp) n.name=inp.value; n.career=sel.value; render(); const s2=$("#careerSel"); if(s2) s2.focus({preventScroll:true}); });
  const pv=$("#heroPrev"); if(pv){ const g=pv.getContext("2d"); g.clearRect(0,0,16,24); if(n.gender) g.drawImage(heroSprite(0,0,n.gender),0,0); }
  const pv2=$("#heroinePrev"); if(pv2){ const g=pv2.getContext("2d"); g.clearRect(0,0,16,24); if(n.hgender) g.drawImage(heroineSprite(0,0,n.hgender),0,0); }
  const inp=$("#nameInput"); if(!inp) return;
  const extra=v=>{ if(isH){ const p=validateName(n.name).value; if(v.ok&&v.value===p) return "主人公と同じ名前は使えません。"; } return ""; };
  const upd=()=>{ const help=$("#nameHelp"); if(n.composing){ help.textContent="変換中"; return; }
    n[key]=inp.value; const v=validateName(inp.value); const ex=extra(v);
    help.innerHTML = `${v.count}／${NAME_MAX}文字` + ((v.errors.length&&inp.value)||ex? `<br>`+[...v.errors,ex].filter(Boolean).map(esc).join("<br>") : "");
    const b=$("#toConfirm"); if(b) b.disabled = !(v.ok && !ex && (isH ? n.hgender : (n.gender && n.career))); };
  inp.addEventListener("compositionstart",()=>{n.composing=true; upd();});
  inp.addEventListener("compositionend",()=>{n.composing=false; upd();});
  inp.addEventListener("input",e=>{ if(!e.isComposing) { n.composing=false; upd(); } });
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); inp.blur(); } });
  inp.addEventListener("blur",()=>{ if(!n.composing){ const v=validateName(inp.value); if(v.value!==inp.value && v.value){ inp.value=v.value; } upd(); } });
  upd();
}
function vitalOf(cid){ const st=G.st; ensureVitals(st); return st.vitals[cid]||{hp:0,c:0}; }
function attackPower(s,L){ return s.atk!=null ? s.atk : 10+2*L+Vof(L)*(s.wAtk+s.accAtk); }
function defensePower(s,L){ return s.defTotal!=null ? s.defTotal : Vof(L)*s.armorD; }
function gradeText(job){ const g=[...(JOB_STAT_GRADES[job]||"○○○○○")]; return STAT_KEYS.map((k,i)=>`${STAT_NAMES[k]}${g[i]}${JOB_SIG[job]===k?"★":""}`).join(" ")+"（★＝看板能力：さらに1.2倍伸びる）"; }
/* 能力値の表（基礎値と、装備を足した最終値） */
function statBlockHtml(s){
  const b=s.base;
  return `<div class="statgrid">${STAT_KEYS.map(k=>`<span class="sg"><span class="sgk">${STAT_NAMES[k]}</span><b>${b[k]}</b></span>`).join("")}</div>
  <table class="sdiff now final"><tbody>
    <tr><th>攻撃力</th><td colspan="4"><b>${s.atk}</b> <span class="dim">（ちから${b.str}＋装備${s.atk-b.str}）</span></td></tr>
    <tr><th>防御力</th><td colspan="4"><b>${s.defTotal}</b> <span class="dim">（身の守り${s.defBase}＋装備${s.defTotal-s.defBase}）</span></td></tr>
    <tr><th>会心率</th><td colspan="4"><b>${s.crit}%</b> <span class="dim">（すばやさ${round1(s.crit-s.gearCrit)}%＋装備${s.gearCrit}%）</span></td></tr>
    <tr><th>回避率</th><td colspan="4"><b>${s.eva}%</b> <span class="dim">（すばやさ）</span></td></tr>
    <tr><th>魅力補正</th><td colspan="4"><b>＋${s.cha}%</b> <span class="dim">（得るエールと技能の回復量）</span></td></tr>
  </tbody></table>`;
}
function partyStrip(){
  const st=G.st;
  return `<button class="pstrip" data-a="openSheet" data-k="status" aria-label="パーティーのステータスを開く"><span class="pstop"><span>レベル${partyLevel(st)}／${progressionCap(st)}・${st.gold.toLocaleString()}ゴールド・もえ ${MOE_RANKS[st.moeRank]}</span><span class="pmore">ステータス ▶</span></span>${st.party.map(cid=>{ const L=partyLevel(st), s=charStats(st,cid,L), v=vitalOf(cid);
    return `<span class="pmini ${v.hp<=0?"ko":""} ${isLow(v.hp,s.maxHP)?"low":""}"><span class="pmline"><b>${esc(charName(st,cid))}</b><span class="small">HP${v.hp}/${s.maxHP} MP${v.c}/${s.startC}</span></span><span class="bar"><i style="width:${Math.round(100*v.hp/s.maxHP)}%"></i></span></span>`; }).join("")}</button>`;
}
/* v7.28: bounded lists and explicit comparisons for status, shops and equipment. UI state is not saved. */
const MANAGE_PAGE_SIZE=6;
function manageCid(st=G.st,d=G.sheetData||{}){return st.roster.includes(d.cid)?d.cid:st.party[0]||st.roster[0];}
function manageNumber(v){return typeof v==='number'?v.toLocaleString():String(v);}
function managePerson(st,cid,label='表示する仲間'){const i=st.roster.indexOf(cid);return `<div class="m-person"><button class="btn" data-a="managePerson" data-v="${st.roster[(i+st.roster.length-1)%st.roster.length]}" aria-label="前の仲間">◀</button><label>${label}<select id="managePerson" data-manage-person aria-label="${label}">${st.roster.map(c=>`<option value="${c}" ${c===cid?'selected':''}>${esc(charName(st,c))}・Lv${characterLevel(st,c)}${st.party.includes(c)?'・同行':'・控え'}</option>`).join('')}</select></label><button class="btn" data-a="managePerson" data-v="${st.roster[(i+1)%st.roster.length]}" aria-label="次の仲間">▶</button></div>`;}
function manageTabs(list,current,action){return `<nav class="m-tabs" aria-label="表示の切り替え">${list.map(([k,t])=>`<button class="btn ${k===current?'on':''}" data-a="${action}" data-v="${k}" aria-pressed="${k===current}">${t}</button>`).join('')}</nav>`;}
function managePage(items,d=G.sheetData||{}){const pages=Math.max(1,Math.ceil(items.length/MANAGE_PAGE_SIZE)),page=Math.max(0,Math.min(pages-1,Math.trunc(Number(d.uiPage)||0)));return {items,pages,page,visible:items.slice(page*MANAGE_PAGE_SIZE,(page+1)*MANAGE_PAGE_SIZE)};}
function managePager(r){return `<nav class="m-pages" aria-label="一覧のページ"><button class="btn" data-a="managePage" data-v="${r.page-1}" ${!r.page?'disabled':''}>◀ 前</button><span role="status">${r.items.length}件・${r.page+1}/${r.pages}</span><button class="btn" data-a="managePage" data-v="${r.page+1}" ${r.page>=r.pages-1?'disabled':''}>次 ▶</button></nav>`;}
function manageSearch(d,options){return `<form id="manageSearchForm" class="m-search"><label>名前・効果で探す<input id="manageQuery" type="search" maxlength="60" value="${esc(d.uiQuery||'')}" placeholder="名前・効果・職業" enterkeyhint="search"></label><label>絞り込み<select id="manageFilter" aria-label="一覧の絞り込み">${options.map(([k,t])=>`<option value="${k}" ${(d.uiFilter||'all')===k?'selected':''}>${t}</option>`).join('')}</select></label><button class="btn primary" type="submit">検索</button><button class="btn" type="button" data-a="manageClear">解除</button></form>`;}
function manageMatch(text,q){return guideSearchText(q||'').split(' ').filter(Boolean).every(w=>guideSearchText(text).includes(w));}
function manageEmpty(){return '<p class="m-notice" role="status">見つかりません。検索の「解除」か、別の種類を選んでください。</p>';}
function manageNotice(d){return d.notice?`<p class="m-notice good" role="status">${esc(d.notice)}</p>`:'';}
function manageStats(s,v=null){const rows=v?[['HP',v.hp,'最大 '+manageNumber(s.maxHP)],['MP',v.c,'最大 '+manageNumber(s.startC)],['攻撃力',s.atk,'ちから＋武器など'],['防御力',s.defTotal,'身の守り＋防具']]:[['最大HP',s.maxHP,''],['最大MP',s.startC,''],['攻撃力',s.atk,''],['防御力',s.defTotal,'']];return `<div class="m-stats">${rows.map(([k,n,sub])=>`<div><span>${k}</span><b>${manageNumber(n)}</b>${v&&(k==='HP'||k==='MP')?`<span class="bar ${k==='MP'?'mp':''}"><i style="width:${Math.max(0,Math.min(100,n/(k==='HP'?s.maxHP:s.startC)*100))}%"></i></span>`:''}<small>${sub}</small></div>`).join('')}</div>`;}
function manageComparison(cur,nx){const a=statRows(cur,cur.L),b=statRows(nx,nx.L),card=(k,v,w)=>{const diff=typeof v==='number'&&typeof w==='number'?round1(w-v):null;return `<div class="m-diff"><span>${k}</span><span class="${diff>0?'up':diff<0?'down':''}">${diff===null?(v===w?'変化なし':'効果変更'):diff===0?'±0':(diff>0?'＋':'−')+manageNumber(Math.abs(diff))}</span><div><small>今</small> ${manageNumber(v)}</div><div><small>変更後</small> <b>${manageNumber(w)}</b></div></div>`;},key=['最大HP','最大MP','攻撃力','防御力'];return `<div class="m-compare" aria-label="変更前と変更後の能力">${key.map(k=>{const i=a.findIndex(x=>x[0]===k);return card(k,a[i][1],b[i][1]);}).join('')}</div><details class="m-details"><summary>その他の能力・効果の変化</summary><div class="m-compare">${a.flatMap(([k,v],i)=>!key.includes(k)&&v!==b[i][1]?[card(k,v,b[i][1])]:[]).join('')||'<p>その他の能力は変わりません。</p>'}</div></details>`;}
function manageGain(cur,nx){return [['攻撃',cur.atk,nx.atk],['防御',cur.defTotal,nx.defTotal],['HP',cur.maxHP,nx.maxHP],['MP',cur.startC,nx.startC]].map(([k,v,w])=>{const n=round1(w-v);return `<span class="${n>0?'up':n<0?'down':''}">${k} ${n>0?'＋':n<0?'−':'±'}${manageNumber(Math.abs(n))}</span>`;}).join(' ');}
function manageGearNote(st,cid,it){return canEquipC(st,cid,it)?'装備可能':equipRequirement(it)+'が必要（現在Lv'+characterLevel(st,cid)+'・'+JOBS[st.jobs[cid]].name+' 熟練度'+jobRank(st,cid,st.jobs[cid])+')';}
function manageSkills(st,cid,d){const s=charStats(st,cid,partyLevel(st)),known=new Set(s.extraSkills),base={id:'CURRENT',name:JOBS[s.job].skill,cost:JOBS[s.job].cost,desc:JOBS[s.job].desc(s.S),current:true};let list=[base,...Object.values(EXTRA_SKILLS).filter(sk=>sk.baseJob!==s.job&&(known.has(sk.id)||sk.id===ultimateId(cid)||sk.job===s.job&&!sk.baseJob)).map(sk=>({...sk,locked:!known.has(sk.id)}))];const f=d.uiFilter||'all';list=list.filter(sk=>manageMatch(sk.name+' '+sk.desc+' '+(sk.job?JOBS[sk.job]?.name:''),d.uiQuery)&&(f==='all'||f==='known'&&!sk.locked||f==='locked'&&sk.locked||f==='ultra'&&sk.ultra||f==='ultimate'&&sk.ultimate));return managePage(list,d);}
function equipmentChange(st,cid,slot,id){
 if(!st?.roster.includes(cid)||!['w','a','acc'].includes(slot)||id&&(!EQUIP[id]||EQUIP[id].slot!==slot))return {reason:'装備の部位・人物を選び直してください。'};
 const current=st.equip[cid][slot],cur=charStats(st,cid,partyLevel(st)),donor=id&&availableCount(st,id)<=0?st.roster.find(c=>c!==cid&&st.equip[c]?.[slot]===id):null;
 const key=JSON.stringify([cid,slot,id,st.roster.map(c=>[c,st.jobs[c],characterLevel(st,c),jpOf(st,c,st.jobs[c]),st.equip[c]]),id?st.owned[id]||0:0]);
 const reason=G.readOnly?'このタブは閲覧のみです。':st.run||st.stream?'戦闘・配信中は変更できません。':streamPending()?'配信待ちのイベントを終えてください。':!isSafe()?'装備の変更は安全地帯でできます。':id&&canEquipC(st,cid,EQUIP[id])===false?manageGearNote(st,cid,EQUIP[id]):current===id?'すでにこの装備です。':id&&availableCount(st,id)<=0&&!donor?'所持していません。':'';
 return {current,cur,donor,key,reason,nx:charStats(st,cid,partyLevel(st),null,{...st.equip[cid],[slot]:id})};
}
function equipmentResults(st,d){const stock=d.equipTab==='stock'||!!d.stock,cid=manageCid(st,d),slot=d.slot||'all',f=d.uiFilter||'all';let ids=Object.keys(st.owned).filter(id=>EQUIP[id]&&(st.owned[id]||0)>0&&(!stock||availableCount(st,id)>0)&&(slot==='all'||EQUIP[id].slot===slot));ids=sortEq(ids.filter(id=>{const it=EQUIP[id];return manageMatch(it.name+' '+it.text+' '+(it.job?JOBS[it.job].name:'共有'),d.uiQuery)&&(f==='all'||f==='usable'&&canEquipC(st,cid,it)||f==='free'&&canEquipC(st,cid,it)&&availableCount(st,id)>0||f==='ultra'&&it.ultra||f==='shared'&&!it.job);}));return managePage(ids,d);}
function manageRoster(st){return `<div class="m-roster">${st.roster.map(c=>{const s=charStats(st,c,partyLevel(st));return `<button class="btn m-card" data-a="equipView" data-c="${c}"><b>${esc(charName(st,c))}</b><span>${esc(JOBS[s.job].name)}・Lv${s.L}</span><span>${st.party.includes(c)?'同行中':'控え'}／熟練度${s.R}</span></button>`;}).join('')}</div>`;}
function shopPool(st,d){const S=SHOPS[d.shop];if(!S)return [];const tab=d.tab||'buy';if(tab==='item')return shopItemsFor(curHub()).filter(id=>ITEMS[id]);if(tab==='sell')return [...Object.keys(st.owned).filter(id=>EQUIP[id]&&(st.owned[id]||0)>0),...st.bag.filter(x=>x.n>0&&ITEMS[x.id]).map(x=>x.id)];return [...new Set([...S.items,...JOB_IDS.filter(j=>st.gifts.W[j]).map(j=>'JW'+j.slice(1)),...JOB_IDS.filter(j=>st.gifts.A[j]).map(j=>'JA'+j.slice(1))])].filter(id=>EQUIP[id]);}
function shopContextReason(st,d){if(G.readOnly)return 'このタブは閲覧のみです。';if(G.st!==st||G.screen!=='explore'||G.sheet!=='shop'||G.dlg||st.run||st.stream||st.careerSession||streamPending())return '戦闘・配信・イベントを終えてから店で取引してください。';const m=MAPS[st.mapId];if(!isSafe()||!SHOPS[d.shop]||!m?.objects.some(o=>o.type==='shop'&&o.shop===d.shop&&Math.abs(o.x-st.pos.x)+Math.abs(o.y-st.pos.y)<=1))return 'この街の店の前で利用してください。';return '';}
function shopQuote(st,d,context=false){
 if(!st)return {reason:'店に入り直してください。',max:0,q:0,unit:0,total:0,after:0};
 const id=d.item,isItem=Object.prototype.hasOwnProperty.call(ITEMS,id),it=isItem?ITEMS[id]:Object.prototype.hasOwnProperty.call(EQUIP,id)?EQUIP[id]:null,tab=d.tab||'buy',sell=tab==='sell',q=d.qty==null?1:Number(d.qty);let reason=context?shopContextReason(st,d):'';
 if(!['buy','item','sell'].includes(tab)||!it||!shopPool(st,d).includes(id)||!sell&&(tab==='item')!==isItem)reason=reason||'この店の一覧から商品を選び直してください。';
 if(!it||!shopPool(st,d).includes(id)||!['buy','item','sell'].includes(tab))return {reason:reason||'商品が見つかりません。',it:null,max:0,q,unit:0,total:0,after:st.gold};
 const rawUnit=sell?(isItem?it.sell:Math.floor(it.price/2)):it.price,unit=Math.max(0,rawUnit),own=isItem?bagCount(st.bag,id):st.owned[id]||0;
 let max=sell?(isItem?own:availableCount(st,id)):isItem?bagRoom(st.bag,id):Math.max(0,8-own);
 if(sell&&rawUnit<0)max=0;
 if(!sell){if(isItem&&!jobItemUnlocked(st,it)||!isItem&&it.nonSale)max=0;if(!isItem)while(max>0&&!eqCanAdd(st,id,max))max--;max=Math.min(max,unit>0?Math.floor(st.gold/unit):max);}
 max=Math.max(0,Math.min(99,max));
 if(!Number.isInteger(q)||q<1)reason=reason||'数量は1個以上の整数で選んでください。';
 if(!sell&&isItem&&!jobItemUnlocked(st,it))reason=reason||jobItemRequirement(it)+'を満たす仲間が必要です。';
 if(!sell&&!isItem&&it.nonSale)reason=reason||'この品は店で購入できません。';
 if(sell&&rawUnit<0)reason=reason||'この道具は売却できません。';
 if(!reason&&q>max)reason=max>0?'今は'+max+'個までです。数量を減らしてください。':sell?'売却できる未装備の品がありません。':!isItem&&own>=8?'1種類の所持上限は8個です。':isItem&&bagRoom(st.bag,id)<=0?'道具袋の種類数か個数がいっぱいです。':!isItem&&!eqCanAdd(st,id,1)?'未装備の持ち物の種類数がいっぱいです。':'ゴールドが足りません。';
 const total=Number.isInteger(q)&&q>0?unit*q:0;return {id,it,isItem,sell,q,unit,own,max,total,after:st.gold+(sell?total:-total),reason};
}
function shopResults(st,d){const cid=manageCid(st,d),tab=d.tab||'buy',f=d.uiFilter||'all';let ids=shopPool(st,d);ids=tab==='item'?sortItems(ids):[...sortEq(ids.filter(id=>EQUIP[id])),...sortItems(ids.filter(id=>ITEMS[id]))];ids=ids.filter(id=>{const it=ITEMS[id]||EQUIP[id],eq=!!EQUIP[id];return manageMatch(it.name+' '+(it.text||'')+' '+(it.job?JOBS[it.job].name:'共有'),d.uiQuery)&&(f==='all'||['w','a','acc'].includes(f)&&eq&&it.slot===f||f==='usable'&&eq&&canEquipC(st,cid,it)||f==='afford'&&shopQuote(st,{...d,item:id,qty:1}).max>0||f==='heal'&&!eq&&it.cat!=='攻撃'||f==='attack'&&!eq&&it.cat==='攻撃'||f==='sellable'&&shopQuote(st,{...d,item:id,qty:1}).max>0);});return managePage(ids,d);}
function shopListReturn(notice=null){const d=G.sheetData||{};let index=-1;for(let i=SHEET_NAV.frames.length-1;i>=0;i--){const f=SHEET_NAV.frames[i];if(f.sheet==='shop'&&f.data.shop===d.shop&&(f.data.tab||'buy')===(d.tab||'buy')&&!f.data.item){index=i;break;}}if(index>=0){const f=SHEET_NAV.frames[index];SHEET_NAV.frames.length=index;restoreSheetFrame({...f,data:{...f.data,notice}});}else{G.sheetData={...d,item:null,qty:1,notice};render();}}
function renderStatus(){
 const st=G.st,d=G.sheetData||{},cid=manageCid(st,d),s=charStats(st,cid,partyLevel(st)),actor=st.run?.party.find(a=>a.cid===cid),v=actor?{hp:actor.hp,c:actor.c}:vitalOf(cid),tab=['stats','skills','profile','job'].includes(d.uiTab)?d.uiTab:d.view==='job'?'job':'stats',jp=jpOf(st,cid,s.job),xp=st.memberXp?.[cid]??st.xp,cap=progressionCap(st);
 let body='';
 if(tab==='skills'){const r=manageSkills(st,cid,d);body='<p class="small">習得済みでも、戦闘ではMP・再使用待ち・必殺技の条件を満たす必要があります。</p>'+manageSearch(d,[['all','すべて'],['known','習得済み'],['locked','これから覚える'],['ultra','超レアの技'],['ultimate','人物の必殺技']])+managePager(r)+r.visible.map(sk=>`<article class="m-card"><div class="m-card-title"><b>${esc(sk.name)}</b><span class="tag">MP ${sk.current?sk.cost:skillMpCost({...s,maxC:s.startC},sk)}</span></div><p class="${sk.locked?'warn':'good'}">${sk.locked?(sk.ultimate?'未習得：仲間の物語 第1話で習得':'未習得：Lv'+sk.level+(sk.rank?'・熟練度'+sk.rank:'')+'で習得'):sk.ultra?'対応する超レアを装備中のみ使用可':'習得済み'+(sk.baseJob?'・前の職業から引き継ぎ':'')}</p><p>${esc(sk.desc)}</p>${sk.cooldown?`<p class="small">再使用まで${sk.cooldown}ターン</p>`:''}</article>`).join('')+(!r.items.length?manageEmpty():'')+managePager(r);}
 else if(tab==='profile')body=`<article class="m-card"><p>${esc([CHARS[cid].age?CHARS[cid].age+'歳':'',CHARS[cid].from||''].filter(Boolean).join('／'))}</p><p>経歴：${esc(cid==='hero'?(st.profile.career||CHARS[cid].career):CHARS[cid].career)}</p><p>${esc(CHARS[cid].pocoRole||'')}</p></article>`+characterProfileHtml(st,cid);
 else if(tab==='job')body=`<article class="m-card"><b>職業特性「${esc(JOB_TRAITS[s.job].name)}」</b><p>${esc(JOB_TRAITS[s.job].desc)}</p><p>伸び方：${gradeText(s.job)}</p><p>転職は街のハローワークで職業イベントをクリアしてから行います。</p><button class="btn" data-a="manageJobs">職業・転職条件を見る</button></article>${inheritanceHtml(st,cid)}<article class="m-card"><h3>熟練度のいまの効果</h3><p>基礎能力の補正 ＋${s.mastery}％／熟練度による最大MP ＋${Math.floor(s.R/2)}／技能強化 ${s.S}</p><p>${MASTERY_STEPS.find(n=>n>s.R)?'次の技能強化は熟練度'+MASTERY_STEPS.find(n=>n>s.R):'技能強化は最終段階です。'}</p><p>専用道具：${esc(ITEMS['JI'+s.job.slice(1)].name)}／熟練度10以上の本人が使用できます。</p><button class="btn" data-a="manageStatusTab" data-v="skills">習得技・これから覚える技を調べる</button></article>`;
 else body=manageStats(s,v)+`<div class="m-progress"><p>個人Lv <b>${s.L}/${cap}</b>　${s.L<cap?'次まで '+manageNumber(Math.max(0,xpFor(s.L+1)-xp))+' EXP':'現在の上限に到達'}</p><p>熟練度 <b>${s.R}/${cap}</b>　${s.R<cap?'次まで '+manageNumber(Math.max(0,jpFor(s.R+1)-jp))+' JP':'現在の上限に到達'}</p></div><h3 class="label">いまの装備</h3><div class="m-list">${Object.entries(EQ_SLOT_NAME).map(([slot,name])=>{const id=st.equip[cid][slot];return `<button class="btn m-card" data-a="manageEquipOpen" data-v="${slot}"><small>${name}</small><b>${id?esc(EQUIP[id].name):'装備なし'}</b><span>比較・変更する ▶</span></button>`;}).join('')}</div><details class="m-details"><summary>基礎能力・全能力・成長のくわしい説明</summary><p>累計経験値 ${manageNumber(xp)}／現在の職業の熟練度経験値 ${manageNumber(jp)}</p>${st.lastMpGrowth?.members?.some(m=>m.cid===cid)?`<p class="good">直近の最大MP：${st.lastMpGrowth.members.filter(m=>m.cid===cid).map(m=>m.before+' → '+m.after+'（＋'+(m.after-m.before)+'）').join('／')}</p>`:''}${statBlockHtml(s)}${statTableHtml(s,s.L)}<p>攻撃力はちからと装備、防御力は身の守りと防具を合計した数値です。HP・MPは宿屋や道具で回復します。</p>${progressionHtml(st)}</details>`;
 return `<div class="m-view"><p class="m-summary">パーティLv <b>${partyLevel(st)}/${cap}</b>　${manageNumber(st.gold)}G</p>${managePerson(st,cid)}<div class="m-card-title"><div class="m-identity"><canvas class="sprite-md" data-char="${cid}" width="16" height="24" aria-hidden="true"></canvas><div><h3>${esc(charName(st,cid))}</h3><p>${esc(JOBS[s.job].name)}・${st.party.includes(cid)?'同行中':'控え'}${v.hp<=0?'・戦闘不能':''}</p></div></div><button class="btn" data-a="renameOpen" data-c="${cid}" ${st.run||st.stream||G.readOnly?'disabled':''}>名前変更</button></div>${manageTabs([['stats','能力・装備'],['skills','技'],['profile','人物'],['job','職業']],tab,'manageStatusTab')}${body}</div>`;
}
function heroSprite(dir,frame,gender){ const f=(gender||G.st.profile.gender)==="女性"; return ART.person("hero",f?PAL.brown:PAL.ink,PAL.red,dir,frame,{long:f}); }
function heroineSprite(dir,frame,gender){ const g=gender||heroineOf(G.st).gender; return g==="男性"? ART.person("moe",PAL.violet,PAL.cream,dir,frame,{}) : ART.person("moe",PAL.violet,PAL.cream,dir,frame,{long:true,ribbon:PAL.coral}); }
function charSprite(cid,dir,frame){ if(cid==="hero") return heroSprite(dir,frame); if(cid==="moe") return heroineSprite(dir,frame); const c=CHARS[cid]; return ART.person(cid,c.hair,c.coat,dir,frame,{long:["mio","kayo","tsumugi"].includes(cid)}); }

/* ---- 探索 ---- */
function renderExplore(){return renderMobileExplore();}
function hereHtml(){
  const st=G.st, m=MAPS[st.mapId], near=nearbyObjects(), zone=zoneAt(m,st.pos.x,st.pos.y), ar=zone?AREAS[zone]:null;
  return `${ar?`<span class="tag danger">遭遇エリア</span> ${esc(ar.name)}（挑戦目安Lv${requiredAreaLevel(ar)}・適正Lv${recommendedAreaLevel(ar)}）`:`<span class="tag safe">安全地帯</span> ${esc(m.name)}`}${m.mapScope==='world'?`<span class="small">／${esc(WORLD_TERRAIN[tileAt(m,st.pos.x,st.pos.y)]?.[0]||'地形')}</span>`:''}${near.length?`<span class="small">／近く：${near.map(o=>esc(o.label)).join("・")}</span>`:""}`;
}
function nearbyObjects(){ const st=G.st, m=MAPS[st.mapId]; return m.objects.filter(o=>Math.max(Math.abs(o.x-st.pos.x),Math.abs(o.y-st.pos.y))<=1 && o.type!=="tower"); }
function mapTravelActive(){return false;} // Status and menus remain visible during travel.
function resizeExploreCanvas(){const wrap=$('.mapwrap'),cv=$('#map');if(!wrap||!cv||!G.st)return;const geo=mobileMapGeometry(wrap.clientWidth||358,wrap.clientHeight||240,G.st.settings.mapZoom||2,mapTravelActive());G.scale=geo.scale;G.vw=geo.cols;G.vh=geo.rows;if(cv.width!==G.vw*16*G.scale)cv.width=G.vw*16*G.scale;if(cv.height!==G.vh*16*G.scale)cv.height=G.vh*16*G.scale;cv.style.width=cv.width+'px';cv.style.height=cv.height+'px';}
function syncMapTravelLayout(force=false){const root=$('.mobile-explore');if(!root)return;const active=mapTravelActive();if(!force&&root._travelFocus===active)return;root._travelFocus=active;root.classList.toggle('walking-focus',active);resizeExploreCanvas();}

function mountCanvas(){
 const wrap=$(".mapwrap"),cv=$("#map");if(!wrap||!cv)return;G.cv=cv;
 syncMapTravelLayout(true);G.hereLast=null;
 cv.addEventListener('pointerdown',mobileMapPointerDown);cv.addEventListener('pointermove',mobileMapPointerMove);cv.addEventListener('pointerup',mobileMapPointerEnd);cv.addEventListener('pointercancel',()=>{MOBILE_UI.mapPress=null;});cv.addEventListener('contextmenu',e=>e.preventDefault());
 drawMap();startLoop();
}
function camera(){
  const st=G.st, m=MAPS[st.mapId]; const p=playerPixel();
  let cx=p.x+8-G.vw*8, cy=p.y+12-G.vh*8;
  cx=Math.max(0,Math.min(m.w*16-G.vw*16,cx)); cy=Math.max(0,Math.min(m.h*16-G.vh*16,cy));
  if(m.w*16<G.vw*16) cx=(m.w*16-G.vw*16)/2; if(m.h*16<G.vh*16) cy=(m.h*16-G.vh*16)/2;
  const k=G.scale||1; return {x:Math.round(cx*k)/k,y:Math.round(cy*k)/k};
}
function playerPixel(){
  const st=G.st, w=G.walk; let x=st.pos.x*16, y=st.pos.y*16;
  if(w.path.length){ const n=w.path[0]; x+= (n.x-st.pos.x)*16*w.prog; y+=(n.y-st.pos.y)*16*w.prog; }
  const k=G.scale||1; return {x:Math.round(x*k)/k, y:Math.round(y*k)/k};
}
function drawMap(){
  syncMapTravelLayout();
  const cv=G.cv; if(!cv||!cv.isConnected) return; const g=cv.getContext("2d"); g.setTransform(G.scale,0,0,G.scale,0,0); g.imageSmoothingEnabled=false;
  const VW=G.vw*16, VH=G.vh*16;
  const st=G.st, m=MAPS[st.mapId]; const cam=camera(); const now=performance.now();
  const still=st.settings.reduceMotion; const f=still?0:Math.floor(now/320)%4, f2=still?0:Math.floor(now/600)%2;
  g.fillStyle=PAL.ink; g.fillRect(0,0,VW,VH);
  if(m.mapScope==='world')ART.drawWorld(g,cam,VW,VH);else{const layer=ART.mapLayer(st.mapId,f);const sx=Math.max(0,cam.x),sy=Math.max(0,cam.y),w=Math.min(VW,layer.width-sx),h=Math.min(VH,layer.height-sy);g.drawImage(layer,sx,sy,w,h,sx-cam.x,sy-cam.y,w,h);}
  for(const d of m.pocoDecor||[]){const x=d.x*16-cam.x,y=d.y*16-cam.y;g.fillStyle=POCO_COLORS[(m.pocoTheme||0)%POCO_COLORS.length];g.fillRect(x+2,y+4,3,3);g.fillRect(x+6,y+4,3,3);g.fillRect(x+3,y+6,5,3);g.fillRect(x+4,y+9,3,1);}
  if(m.mapScope==='world'){
    const x0=Math.max(0,Math.floor(cam.x/16)),y0=Math.max(0,Math.floor(cam.y/16));
    for(let y=y0;y<Math.min(m.h,y0+G.vh+2);y++)for(let x=x0;x<Math.min(m.w,x0+G.vw+2);x++)if(worldOwnersAt(x,y).length&&!worldTileOpen(x,y)){g.fillStyle='rgba(10,15,25,.78)';g.fillRect(x*16-cam.x,y*16-cam.y,16,16);}

  }
  const sprites=[];
  for(const o of m.objects){
    if(o.x*16<cam.x-48||o.x*16>cam.x+VW+32||o.y*16<cam.y-48||o.y*16>cam.y+VH+48)continue;
    let img;
    if(o.type==="npc"){ const n=NPCS[o.npc]; img = o.npc==="moe"? charSprite("moe",0,f2*2) : ART.person(o.npc,n.sprite[1],n.sprite[0],0,f2*2,{long:n.long||["akari","chiyo","misuzu"].includes(o.npc)}); }
    else if(o.type==="shop"){ const n=NPCS[o.npc]; sprites.push({y:o.y-0.1,img:ART.object("shop",0),x:o.x}); img=ART.person(o.npc,n.sprite[1],n.sprite[0],0,f2*2); }
    else if(o.type==="inn"){ sprites.push({y:o.y-0.1,img:ART.object("inn",f),x:o.x}); img=ART.person("innkeeper",PAL.slate,PAL.navy,0,f2*2); }
    else if(o.type==='roadSign')img=ART.roadSign(worldSignRows(o)[0]?.bit||2);
    else if(o.type==='landmark')img=ART.scenicObject(o.style);
    else if(o.type==='port'||o.type==='railStation')img=ART.object('station',f);
    else if(o.type==="box") img=ART.object(st.boxes[o.box]?"boxOpen":"box",f);
    else if(o.type==="boss"){ if(st.bossDefeated[o.boss]&&BOSSES[o.boss]?.specialStage==null) continue; img=ART.object(m.mapScope==='world'?"gate":"boss",f); }
    else img=ART.object(o.type==='cityEntry'?'inn':o.type==='worldExit'?'gate':o.type==='specialExit'?'door':o.type==='challenge'?'board':o.type==='studio'?'inn':o.type==='helloWork'?'shop':o.type,f);
    sprites.push({y:o.y,x:o.x,img});
  }
  const moving=G.walk.path.length>0; const wf=!still&&moving?Math.floor(now/166)%4:0;
  const pp=playerPixel();
  // 同行者は最大4人。移動履歴を1マスずつ追い、待機者は描画しない。
  if(G.followMap!==st.mapId){G.followMap=st.mapId;G.followTrail=[];}
  const sailing=m.mapScope==='world'&&tileAt(m,st.pos.x,st.pos.y)==='E',lead=st.party[0];for(const member of (sailing?[]:followerPositions(st,G.followTrail||[],G.walk.prog,moving))){sprites.push({y:member.y/16,px:{x:Math.round(member.x),y:Math.round(member.y)},img:charSprite(member.cid,member.dir,moving?(wf+2)%4:0)});}
  sprites.push({y:pp.y/16+0.01, px:pp, img:sailing?ART.ship():charSprite(lead,st.dir,wf)});
  sprites.sort((a,b)=>a.y-b.y);
  for(const s of sprites){const x=(s.px?s.px.x:s.x*16)-cam.x,y=(s.px?s.px.y:s.y*16)-cam.y;g.fillStyle="rgba(16,24,32,.24)";g.fillRect(Math.round(x+3),Math.round(y+13),10,2);g.fillRect(Math.round(x+5),Math.round(y+12),6,1);}
  for(const s of sprites){ const x=s.px?s.px.x:s.x*16, y=s.px?s.px.y:s.y*16; g.drawImage(s.img,x-cam.x-(s.img.width>16?8:0),y-8-cam.y-(s.img.height>24?16:0)); }
  // 施設のマーク（看板）：店・宿・建物の入口・出口などの上に表示
  for(const o of m.objects){if(m.mapScope==='world'&&(o.x*16<cam.x-40||o.x*16>cam.x+VW+40||o.y*16<cam.y-40||o.y*16>cam.y+VH+40))continue; const F=FACILITY[o.type]; if(!F) continue; if(o.type==="door"&&o.walk) continue;
    const bx=o.x*16-cam.x+1, by=o.y*16-cam.y-(o.type==="shop"||o.type==="inn"?27:22); drawSignMark(g,bx,by,F); }
  // 話せる人の印（未会話は「！」、会話済みは「…」）
  for(const o of m.objects){ if(o.type!=="npc"||o.npc==="moe") continue; const talked=st.talked[o.npc];
    const bx=o.x*16-cam.x+5, by=o.y*16-cam.y-19-(f2&&!talked?1:0); g.fillStyle=talked?"rgba(16,24,32,.75)":PAL.gold; g.fillRect(bx,by,7,7); g.fillStyle=talked?PAL.cream:PAL.ink;
    if(talked){ g.fillRect(bx+1,by+3,1,1); g.fillRect(bx+3,by+3,1,1); g.fillRect(bx+5,by+3,1,1); } else { g.fillRect(bx+3,by+1,1,3); g.fillRect(bx+3,by+5,1,1); } }
  if(m.mapScope==='world')drawWorldWayfinding(g,st,cam,VW,VH);
  // 空気感（v5.36）：屋外は流れる雲の影と舞う花びら、屋内は灯りのぬくもり。周辺を少し暗くして奥行きを出す
  if(m.kind==="out"){
    if(!still){
      g.fillStyle="rgba(16,24,32,0.10)";
      for(let i=0;i<2;i++){ const W=m.w*16+240, x=((now/90+i*380)%W)-120-cam.x, y=((i*170+90)%(m.h*16))-cam.y; g.beginPath(); g.ellipse(x,y,48,20,0,0,Math.PI*2); g.ellipse(x+34,y+9,34,15,0,0,Math.PI*2); g.fill(); }
      for(let i=0;i<9;i++){ const t=now/1000+i*1.7; const x=Math.round(((i*53+t*14)%(VW+20))-10), y=Math.round(((i*37+t*21)%(VH+20))-10); g.fillStyle=i%3?PAL.cream:PAL.coral; g.fillRect(x,y,1,1); g.fillRect(x+(Math.floor(t*3)%2),y+1,1,1); }
    }
  } else { const lg=g.createRadialGradient(VW/2,VH*0.4,4,VW/2,VH*0.4,Math.max(VW,VH)*0.7); lg.addColorStop(0,"rgba(213,179,76,0.10)"); lg.addColorStop(1,"rgba(213,179,76,0)"); g.fillStyle=lg; g.fillRect(0,0,VW,VH); }
  { const vg=g.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.35,VW/2,VH/2,Math.max(VW,VH)*0.75); vg.addColorStop(0,"rgba(16,24,32,0)"); vg.addColorStop(1,"rgba(16,24,32,0.32)"); g.fillStyle=vg; g.fillRect(0,0,VW,VH); }
  if(moving){ const d=G.walk.path[G.walk.path.length-1]; const bl=still?0:Math.floor(now/250)%2; g.strokeStyle=bl?PAL.cream:PAL.gold; g.strokeRect(d.x*16-cam.x+3.5,d.y*16-cam.y+3.5,9,9); }
}
function facBadge(o){ const F=FACILITY[o.type]; if(F) return `<span class="fac" style="background:${F.color}" aria-label="${F.name}">${F.mark}</span>`; if(o.type==="npc") return `<span class="fac npc" aria-label="人">話</span>`; return ""; }
function drawSignMark(g,x,y,F){
  const w=14,h=12; g.fillStyle=PAL.ink; g.fillRect(x-1,y-1,w+2,h+2); g.fillStyle=F.color; g.fillRect(x,y,w,h);
  g.fillStyle=PAL.ink; g.fillRect(x+6,y+h+1,2,3); // 支柱
  g.save(); g.font="bold 10px 'DotGothic16','Noto Sans JP',sans-serif"; g.textAlign="center"; g.textBaseline="middle"; g.fillStyle=PAL.ink; g.fillText(F.mark,x+w/2,y+h/2); g.restore();
}
/* ---- 移動（v5.30 なめらか化）：1マスの所要時間、押しっぱなしの連続歩行、壁沿いのすべり ---- */
function moveStepMs(){ const s=G.st?G.st.settings:null; return s&&s.moveSpeed==="fast"?110:160; }
function faceToward(n){ const dx=n.x-G.st.pos.x, dy=n.y-G.st.pos.y; G.st.dir = dy>0?0:dy<0?1:dx<0?2:3; }
/* 押している方向（第1方向がふさがっていれば斜め入力のもう一方へすべる） */
function nextStepFor(h){
  const st=G.st, m=MAPS[st.mapId]; if(!h) return null;
  for(const d of [h.dir,h.alt]){ if(d==null) continue; const v=[[0,1],[0,-1],[-1,0],[1,0]][d]; const nx=st.pos.x+v[0], ny=st.pos.y+v[1]; if(!walkable(m,nx,ny)) continue;
    // 扉を通った直後は、いったん手を離すまで次の扉へは入らない（出入りの往復を防ぐ）
    if(G.bumpLock){ const o=objAt(m,nx,ny); if(o&&["door","gate","worldExit","cityEntry"].includes(o.type)) continue; }
    return {x:nx,y:ny,d}; }
  return null;
}
/* 1マス着いた瞬間に、押しっぱなしなら次の1マスを先に積む（止まらずに歩き続ける） */
function chainHeld(){
  const w=G.walk; if(w.path.length||w.pending||G.readOnly) return;
  const h=PAD.held(); if(!h||h.dir==null) return;
  const m=MAPS[G.st.mapId], o=objAt(m,G.st.pos.x,G.st.pos.y); if(o&&o.walk) return; // 扉・ボス地点では止まる
  const s=nextStepFor(h); if(s) w.path.push({x:s.x,y:s.y});
}
function startLoop(){
  cancelAnimationFrame(G.raf); G.lastTs=0;
  const loop=ts=>{
    if(G.screen!=="explore"||document.hidden){syncMapTravelLayout(); G.raf=0; return; }
    const dt = G.lastTs? Math.min(50, ts-G.lastTs) : 16; G.lastTs=ts; G.frame++;
    const w=G.walk;
    if(w.path.length && !G.dlg && !G.sheet && !G.lock){
      faceToward(w.path[0]);
      w.prog+=dt/moveStepMs();
      let guard=0;
      while(w.prog>=1 && w.path.length && guard++<3){
        const n=w.path[0], carry=w.prog-1;
        w.path.shift();if(G.followMap!==G.st.mapId){G.followMap=G.st.mapId;G.followTrail=[];}G.followTrail=[{...G.st.pos},...(G.followTrail||[])].slice(0,3); G.fol={...G.st.pos}; G.st.pos={x:n.x,y:n.y};
        chainHeld();
        arrive();
        // 余った進み具合を次のマスへ持ち越す（1マスごとの「止まり」をなくす）
        if(w.path.length && G.screen==="explore" && !G.dlg && !G.sheet){ w.prog=carry; faceToward(w.path[0]); }
        else { w.prog=0; break; }
      }
    }
    drawMap();
    G.raf=requestAnimationFrame(loop);
  };
  G.raf=requestAnimationFrame(loop);
}
function bfs(m,sx,sy,goal,preferRoad=true){
  const key=(x,y)=>y*m.w+x,prev=new Map(),q=[{x:sx,y:sy}];prev.set(key(sx,sy),null);
  const open=m.mapScope==='world'?new Set(HUB_ORDER.filter(id=>hubUnlocked(G.st,id))):null;
  const can=(x,y)=>{if(!open)return walkable(m,x,y);const k=x+','+y;if(!(m.owners[k]||[]).some(id=>open.has(id)))return false;return !!WORLD_TERRAIN[m.tiles[y]?.[x]]?.[2];};
  if(open&&preferRoad){const route=worldPreferredPath(m,sx,sy,goal,can);if(route?.length)return route;}
  for(let head=0;head<q.length;head++){const{x,y}=q[head];if(goal(x,y)&&!(x===sx&&y===sy)){const path=[];let k=key(x,y);while(k!==key(sx,sy)){path.push({x:k%m.w,y:Math.floor(k/m.w)});k=prev.get(k);}return path.reverse();}
    for(const[dx,dy]of [[0,1],[0,-1],[-1,0],[1,0]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=m.w||ny>=m.h)continue;const k=key(nx,ny);if(prev.has(k)||!can(nx,ny))continue;prev.set(k,key(x,y));q.push({x:nx,y:ny});}}
  return null;
}

function walkTo(x,y,pending,isNavigation=false){
  const st=G.st;if(!st||worldMoveReason(st))return;const m=MAPS[st.mapId];if(!m||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=m.w||y>=m.h)return; if(G.readOnly) return toast("閲覧のみのタブです。");
  let path;
  const obj=objAt(m,x,y);
  if(obj && !obj.walk && m.mapScope!=='world'){ if(Math.abs(obj.x-st.pos.x)+Math.abs(obj.y-st.pos.y)===1 || (Math.max(Math.abs(obj.x-st.pos.x),Math.abs(obj.y-st.pos.y))<=1)){if(m.mapScope==='world'&&!isNavigation){G.worldNav=null;G.worldNavState=null;G.walk.path=[];G.walk.pending=null;} interact(obj); return; }
    path=bfs(m,st.pos.x,st.pos.y,(px,py)=>Math.abs(px-x)+Math.abs(py-y)===1); pending=obj; }
  else { if(x===st.pos.x&&y===st.pos.y) return; if(!walkable(m,x,y)){if(m.mapScope==='world')toast(!worldTileOpen(x,y,st)?'未開放エリア：まだ移動できません。':'海・川には移動できません。');return;} path=bfs(m,st.pos.x,st.pos.y,(px,py)=>px===x&&py===y,m.mapScope!=='world'||!!obj||Object.hasOwn(m.walkRoadIndex,x+','+y)); }
  if(!path) return toast("そこへは行けません。");
  if(m.mapScope==='world'&&!isNavigation){G.worldNav=null;G.worldNavState=null;}G.walk.path=path; G.walk.prog=0; G.walk.pending=pending||(obj&&(obj.walk||m.mapScope==='world')?obj:null);syncMapTravelLayout();
}
function onMapTap(e){if(G.sheet||G.dlg||G.screen!=='explore'||G.readOnly)return;const cv=G.cv;if(!cv)return;const p=mobileMapTile(e,cv.getBoundingClientRect(),camera(),G.vw,G.vh),m=MAPS[G.st.mapId];if(p&&p.x>=0&&p.y>=0&&p.x<m.w&&p.y<m.h)walkTo(p.x,p.y);}

function arrive(){
  const st=G.st, m=MAPS[st.mapId]; const zone=zoneAt(m,st.pos.x,st.pos.y);
  if(SND.current!==exploreSong()) exploreBgm();
  if(zone){
    // 第07A・23G節：危険タイル到着ごとに1/24の独立抽選（戦えるメンバーがいない時は抽選しない）
    const canFight = st.party.some(c=>vitalOf(c).hp>0);
    if(canFight && randInt(24)===0){
      const rolls={count:randInt(100), picks:[randInt(10000),randInt(10000),randInt(10000)]};
      G.walk.path=[]; G.walk.pending=null;
      startBattle(createFieldRun(st,zone,rolls)); return;
    }
  }
  const o=objAt(m,st.pos.x,st.pos.y);
  if(!G.walk.path.length){
    // 立ち止まった時だけ保存する（歩いている最中の毎マス保存をやめて、カクつきを防ぐ）
    const pend=G.walk.pending; G.walk.pending=null;
    if(o&&o.walk) interact(o); else if(pend) interact(pend);
    commit(); refreshHere();
  } else if(o&&o.walk&&["door","cityEntry","worldExit"].includes(o.type)){ G.walk.path=[]; interact(o); }
  else refreshHere();
}
function exploreSong(){ const st=G.st; if(!st) return "title"; const m=MAPS[st.mapId]; if(zoneAt(m,st.pos.x,st.pos.y)) return "field"; if(m.kind==="in") return "home"; const hub=hubOf(st.mapId)||st.mapId;if(NATIONAL_ENCORES.some(c=>c.id===hub))return "encore";const region=NATIONAL_CHAPTERS.findIndex(c=>c.hubs.includes(hub)||c.special===hub);if(region>0)return ['','chugoku','kinki','hokuriku','tohoku','kanto'][region];return hub==="KY02"?"kitakyushu":(HUBS[hub]&&HUBS[hub].song)||"fukuoka"; }
function exploreBgm(){ SND.play(exploreSong()); }
/* 「現在地・近く」の行だけを軽く更新する（内容が変わった時だけ書き換える） */
function refreshHere(){
  if(G.screen!=="explore" || G.sheet) return;
  // Location, encounter area and nearby objects are refreshed in the top map information.
  const scope=$('.map-scope');if(scope)scope.textContent=mapScopeText();const nav=$('.world-nav-strip');if(nav){const html=renderWorldNavigation();if(html!==G.worldNavHtml){nav.outerHTML=html;G.worldNavHtml=html;}}
  const g=$(".goal"), ob=heroSub(objective()); if(g && g.textContent!==ob) g.textContent=ob;
}

/* ---- 調べる・会話 ---- */
function interact(o){
  const st=G.st; G.walk.path=[];
  const face=()=>{ const dx=o.x-st.pos.x, dy=o.y-st.pos.y; if(dx||dy) st.dir = Math.abs(dy)>=Math.abs(dx)?(dy>0?0:1):(dx<0?2:3); };
  face();
  switch(o.type){
    case "challenge": return openSheet("challenges");
    case "specialExit": {const r=st.specialReturn||{map:"KY16",x:MAPS.KY16.safeAnchor[0],y:MAPS.KY16.safeAnchor[1]};return travelMap(r.map,r.x,r.y);}
    case "studio": return openSheet("townStudio");
    case "helloWork": return openHelloWork();
    case 'railStation':return say([['新幹線駅','この駅は街中につながっています。街の入口へ入り、駅施設から乗車してください。線路上には歩いて入れません。']]);
    case 'roadSign':return openSheet('worldRoutes',{signId:o.id});
    case 'landmark':return say([[o.label,'日本の名所を参考にした景観です。地形や進入路はゲーム向けに簡略化しています。'],['',o.source||'この景観は創作です。']]);
    case 'port':return say([['港の案内','島への移動は浮標のある航路を進みます。航路上では船の姿に切り替わります。通常の海へは入れません。'],['','橋・港・道路・鉄道・航路はゲーム用の表現で、実際の運航・路線を示しません。']]);
    case "worldExit": return leaveCity();
    case "cityEntry": return enterWorldCity(o.to);
    case "station": return openSheet("station");
    case "npc": return talkNpc(o.npc);
    case "shop": return openSheet("shop",{shop:o.shop, npc:o.npc, tab:"buy"});
    case "door": return travelMap(o.to,o.tx,o.ty);
    case "gate": { if(!hubUnlocked(st,o.to)){ const q=hubRequirement(o.to); return say([["",`この先の${HUB_NAME_OF(o.to)}へは、${HUBS[QUESTS[q].hub].name}の本編依頼「${q} ${QUESTS[q].name}」を終えると進めます。`]]); }
      return openSheet("travel",{to:o.to,tx:o.tx,ty:o.ty}); }
    case "box": return openBox(o);
    case "sign": { const a=AREAS[o.area];if(a.specialStage!=null){const s=SPECIAL_STAGES[a.specialStage];return say([["特設案内板",s.name+"・適正Lv"+s.level+"。通常敵50種。守護者との決戦でもオートを使えます。"],["特設案内板",a.lore]]);} const b=Object.values(BOSSES).find(x=>x.areaId===o.area);
      return say([["案内板",`${a.name}（${o.area}）。強度q${a.q}・挑戦目安Lv${requiredAreaLevel(a)}・適正Lv${recommendedAreaLevel(a)}。`+(b?`この奥に地域ボス「${b.name}」（推奨レベル${(b.regionalLevel||b.chapterLevel||bossRecommendedLevel(b.q))}）。`:"")],["案内板",a.lore]]); }
    case "boss": return bossPrompt(o.boss);
    case "rest": return openSheet("rest");
    case "inn": return openSheet("inn",{label:o.label});
    case "board": return openSheet("party");
    case "shelf": return openSheet("record");
    case "bench": return say([["もえ",st.moeRank>=1?"ここから見る夕焼け、配信の最後に話したくなるね。":"夕焼けがきれい。……旅に出る前に、この景色を覚えておきたいな。"],[st.profile.name,"また帰ってこよう。"]]);
    case "tower": return say([["",o.desc||"放送塔が空へ伸びている。"]]);
  }
}
function chatStage(st){ return st.fukuokaClear?2: st.quests.M01==="complete"?1:0; }
function chatLine(id){ const st=G.st; const pool=NPC_CHAT[id]; if(!pool) return null; const arr=pool[chatStage(st)]||pool[0];
  st.talkCount=st.talkCount||{}; const k=id+":"+chatStage(st); const i=(st.talkCount[k]||0)%arr.length; st.talkCount[k]=(st.talkCount[k]||0)+1;
  return arr[i].split("{p}").join(st.profile.name); }
function heroineTownLine(st,hub){
 const q=mainQuestOf(hub),ht=HUB_TEXT[hub]||{},c=nationalEntry(hub)||NEXT_CHAPTER.find(x=>x.id===hub);let lines;
 if(st.quests[q]==='complete')lines=c?[c.after]:['この街で声を届けた日のこと、覚えているよ。',...(ht.moe||[]).slice(0,-1).map(t=>'あの頃を振り返ると――「'+t+'」')];
 else if(st.bossDefeated[QUESTS[q]?.boss])lines=['ノイズは静まったね。この街の配信はこれから。準備を確認して、一人ずつに声を届けよう。'];
 else lines=[ht.accept||'この街の人の話を聞きながら、一つずつ準備を進めよう。','まだこの街の本番は終わっていないね。私たちのペースで、できる準備から始めよう。'];
 st.talkCount=st.talkCount||{};const key='moe:'+hub,i=st.talkCount[key]||0;st.talkCount[key]=i+1;return lines[i%lines.length];
}
function talkNpc(id){
  const st=G.st, n=NPCS[id], p=st.profile.name;
  if(id==="moe"){ G.moeLine=heroineTownLine(st,curHub()); commit(); return openSheet("moe"); }
  let lines;
  if(!st.talked[id]){ lines=n.first(p); st.talked[id]=true; unlockSide(st);
    if(n.rep) lines.push(["",`${n.name}と話した。応援者帳に記録された（親密度1）。`]); }
  else {
    const sqd=Object.keys(QUESTS).find(k=>!QUESTS[k].main&&QUESTS[k].npc===id); const doneAfter = n.after && sqd && st.quests[sqd]==="complete";
    st.talkCount=st.talkCount||{};
    if(doneAfter && !st.talkCount[id+":after"]){ st.talkCount[id+":after"]=1; lines=n.after(p); }
    else { const t=chatLine(id); lines = t? [[n.name,t]] : (n.normal?n.normal(p):[[n.name,"……。"]]); }
  }
  const local=nationalEntry(n.hub)||NEXT_CHAPTER.find(c=>c.id===n.hub);if(local&&st.quests[mainQuestOf(n.hub)]==='complete')lines=lines.map(([who,text])=>[who,text.replaceAll(local.before,'この街で取り組んだ課題の記録：'+local.before)]);
  const gate=(st.streamRetryGate||{})[n.hub];if(gate&&id!=="moe"&&!gate.talks.includes(id))gate.talks.push(id);
  const town=townChange(st,n.hub);if(town){st.townSeen=st.townSeen||{};const key=n.hub+":"+town.phase+":"+!!town.side;if(!st.townSeen[key]){st.townSeen[key]=true;lines.push([n.name,town.text+(town.side?" "+town.side:"")]);}}
  if((st.festivals||{})[n.hub])lines.push([n.name,POCO_TOWNS[HUB_ORDER.indexOf(n.hub)][3]]);
  lines.push(...narrativeNpcLines(st,id));
  commit(); say(lines);
}
function openBox(o){
  const st=G.st; if(st.boxes[o.box]) return say([["","箱は開いている。記念カードは記録から見られます。"]]);
  const hub=o.box.slice(0,4); const sq = sideQuestOf(hub); const rep = QUESTS[sq].npc;
  const okA = o.box.endsWith("A") && st.talked[rep]; const okB = o.box.endsWith("B") && st.quests[sq]==="complete";
  if(!(okA||okB)) return say([["",o.box.endsWith("A")?`この箱は、${NPCS[rep].name}と初めて話すと開けられる。`:`この箱は、任意依頼${sq}を終えると開けられる。`]]);
  st.boxes[o.box]=true; st.tickets+=40; st.cards.push(o.box);
  const ev=ITEM_EVENTS[o.box.slice(0,4)+"-BOX-"+o.box.slice(-1)]; let extra=[];
  if(ev){ const g=giveItem(st,ev[0],ev[1]); const nm=ITEMS[ev[0]].name;
    if(g.got) extra.push(["",`道具「${nm}」×${g.got}も入っていた！（非売品）`]); if(g.kept) extra.push(["",`道具袋がいっぱいのため、${nm}×${g.kept}は宿屋の預かり所へ送った。`]); }
  commit(); SND.sfx("treasure");
  say([["",`応援箱を開けた！ チケット＋40、記念カード「${BOX_CARDS[o.box]}」を手に入れた。`],...extra]);
}
function bossPrompt(bid){
  if(MAPS[G.st?.mapId]?.mapScope==='city'){toast('地域ボスは街外にいます。全国街道へ出てください。');return;}
  if(mainPropGate(G.st,bid))return;
  if(bid==='NB607'&&nationalFinalReason(G.st)){toast(nationalFinalReason(G.st));return openSheet('careerTour');}
  if(BOSSES[bid]?.specialStage!=null)return openSheet("specialBoss",{bid});
  const st=G.st, b=BOSSES[bid]; const qid=Object.keys(QUESTS).find(k=>QUESTS[k].boss===bid);
  if(st.bossDefeated[bid]) return say([["","乱れは静まっている。図鑑から記録を見られます。"]]);
  if(st.quests[qid]!=="bossReady") return say([["",`奥から大きな重なりを感じる（${b.name}・推奨レベル${(b.regionalLevel||b.chapterLevel||bossRecommendedLevel(b.q))}）。依頼「${qid}」を受けて通常敵を倒すと挑戦できます。`]]);
  openSheet("boss",{bid});
}
function say(lines, after){ G.dlg={lines, i:0, after}; render(); }
function renderDialog(){
  const d=G.dlg; if(!d) return "";
  const [rawSp,rawTx]=d.lines[d.i];const sp=companionText(rawSp,G.st),tx=companionText(rawTx,G.st);
  return `<div class="overlay dlg-ov" role="dialog" aria-modal="true" aria-label="会話">
    <div class="win dlg">${sp?`<div class="speaker">${esc(sp)}</div>`:""}<p class="dlg-text">${esc(tx)}</p>
    <div class="row3"><button class="btn" data-a="dlgBack" ${d.i?"":"disabled"}>戻る</button>
    <button class="btn" data-a="dlgSkip">省略</button>
    <button class="btn primary" id="dlgNext" data-a="dlgNext">${d.i<d.lines.length-1?"次へ ▼":"閉じる"}</button></div>
    <div class="small">${d.i+1}／${d.lines.length}</div></div></div>`;
}
function playScene(id, after, replay=false){ const sc=SCENES[id]; if(id.startsWith("RANK_")) SND.sfx("rank"); if(id==="RANK_S6"||id==="OMUTA_END"){ SND.play("ending"); const a0=after; after=()=>{ exploreBgm(); if(a0) a0(); }; } G.st.scenes[id]=true; commit(); say([["",`― ${sc.title} ―`],...(replay?[["","過去の場面の読み返しです。解放の案内は当時の内容で、関係や任意の物語の追記は現在の記録に合わせて表示します。報酬や進行は追加されません。"]]:[]),...sc.lines(G.st.profile.name),...mainEmotionLines(G.st,id),...narrativeEndingLines(G.st,id),...nationalChapterEndingLines(G.st,id)], after); }

/* ---- 移動 ---- */
function travelMap(to,tx,ty){
  G.followTrail=[];G.followMap=to;
  const st=G.st;if(to!=='WORLD'){G.worldNav=null;G.worldNavState=null;} st.mapId=to; st.pos={x:tx,y:ty}; G.walk.path=[]; G.fol={x:tx,y:ty}; G.bumpLock = PAD.held().dir!=null;
  if(!st.visitedMaps.includes(to)) st.visitedMaps.push(to);
  const hub=MAPS[to].hub; if(to!=='WORLD'&&!st.visitedHubs.includes(hub)) st.visitedHubs.push(hub);
  commit(); G.sheet=null; render(); if(G.screen==="explore") exploreBgm();
}
function travelHub(to,tx,ty){
  const st=G.st;const reason=hubTravelReason(st,to);if(reason){toast(reason);return false;}
  const first=!st.visitedHubs.includes(to);
  travelMap(to,tx,ty);
  const j=JOIN_PLAN.find(x=>x.hub===to);
  const arrive = first && SCENES["ARRIVE_"+to];
  if(j && joinMember(st,j.cid)){ commit(); const L=[...(arrive?SCENES["ARRIVE_"+to].lines(st.profile.name):[]),["",`${HUBS[to]?HUBS[to].name:j.pref}で${CHARS[j.cid].full}と出会った。`],...(JOIN_TALK[j.cid]||[]),["",characterText(st,CHARACTER_ARCS[j.cid].background)],["",`固有特性「${CHARACTER_ARCS[j.cid].trait}」が有効です。ファミリー施設の「仲間の物語」で必殺技を習得できます。`],["",`${CHARS[j.cid].full}が仲間に加わった。街のファミリー施設で同行者を入れ替えられます。`]]; if(arrive) st.scenes["ARRIVE_"+to]=true; say(L,()=>openPendingName()); return; }
  if(arrive){ playScene("ARRIVE_"+to); return; }
  if(first && to==="KY02") say([["",`${HUBS[to].name}に着いた。港の風と倉庫の匂いがする。`],["もえ","ここが北九州……。港の音、配信に入れたら素敵だね。"]]);
}

/* ---- 戦闘 ---- */
function startBattle(run){
  if(MAPS[G.st?.mapId]?.mapScope==='city'||MAPS[G.st?.mapId]?.kind==='in'){toast('敵との戦闘は街外マップで行います。街の出口から出発してください。');return false;}
  const reason=battleEntryReason(G.st);if(reason){toast(reason);return false;}
  if(!alive(run).length){toast("同行者を復活させてから挑みましょう。");return false;}
  if(run.kind==='boss'&&mainPropGate(G.st,run.bossId))return false;
  G.battleInspect=false;G.battleChoiceKey=null;G.battlePreview="";
  stopBattleAutomation();
  const st=G.st; st.run=run; st.runSeq=run.seq;
  syncCollection(st);if(run.bossId&&BOSSES[run.bossId])st.collection.bosses[run.bossId]=true;for(const e of run.enemies) if(!e.boss) st.seen[e.id]=true;
  run.log=[`${run.enemies.map(e=>e.display).join("と")}が現れた！`,...(run.log||[])];
  G.cmd={};G.battleCommand=false;G.battlePicker=null;G.battlePanel="enemies";G.mobileForceFocus=false;G.battleFoePage=0;G.sheet=null;
  commit(); SND.sfx("enc");
  if(st.settings.reduceMotion){ G.screen="battle"; render(); }
  else { const f=document.createElement("div"); f.className="flash"; document.body.appendChild(f); setTimeout(()=>{f.remove();if(G.st!==st||st.run!==run||run.state!=="input"||G.screen!=="explore")return;G.screen="battle";render();},380); }
  SND.play(run.enemies.some(e=>e.boss)?"boss":"battle");
  return true;
}
function partyCard(m,i,run){
  const sel=G.cmd.actor===i; const pct=Math.round(100*m.hp/m.maxHP);
  const ko=m.hp<=0;
  const badges=[ko?"戦闘不能":m.acted?"行動済":"", m.ward?`防護${m.ward}`:"", m.guard?"ガード中":""].filter(Boolean);
  return `<button class="pcard ${sel?"on":""} ${ko?"ko":""} ${isLow(m.hp,m.maxHP)?"low":""} ${m.acted?"done":""}" data-a="pickActor" data-i="${i}" ${ko||m.acted||run.state!=="input"?"aria-disabled=\"true\"":""}>
    <span class="pline"><b>${sel?"▶":""}${esc(m.name)}</b><span class="pjob">${esc(JOBS[m.job].name)} 熟練度${m.R}</span>${badges.map(t=>`<span class="pst">${t}</span>`).join("")}</span>
    <span class="bar"><i style="width:${pct}%"></i></span>
    <span class="pstat"><span>HP <b>${m.hp}</b>/${m.maxHP}</span><span>MP <b>${m.c}</b>/${m.maxC||10}</span></span>
    <canvas class="psprite" data-char="${m.cid}" width="16" height="24" aria-hidden="true"></canvas>
  </button>`;
}
function teleText(run,t){
  const rg=t.rage?"【怒り】":"";
  if(t.type==="c") return rg+"次：ため（攻撃なし）";
  if(t.type==="a") return `${rg}次：全員へ${t.power}${t.heavy?"（強攻撃）":""}`;
  return `${rg}次：1人へ${t.power}→${esc(run.party[t.target]?run.party[t.target].name:"")}`;
}
function cueText(run){
  if(!run.cue) return "";
  const kindName={guard:"2人がガード",comment:"2人が応援コメント",damage:"2人が攻撃"}[run.cue.kind];
  if(run.cue.active) return `<div class="cue on">ため中：${kindName}か支援の技能 ${run.cue.bits.length}/2 → 強攻撃20%減・エール＋12</div>`;
  if(run.turn%4===0) return `<div class="cue on">${run.cue.ready?"対処成功：強攻撃20%軽減":"対処未達：強攻撃そのまま"}</div>`;
  return `<div class="cue">対処：${kindName}（3・7・11…ターン）</div>`;
}
function renderBattle(){const run=G.st.run;if(!run)return '';if(run.state!=='input')return renderBattleEnd(run);enforceAutoAvailability(run);if(G.battleInspect)return renderBattleInspect(run);return renderMobileBattle(run);}
function renderBattleInspect(run){const pages=[];const add=(group,title,html)=>pages.push({group,title,blocks:endTextBlocks(html.replace(/<[^>]*>/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&'),90)});
 add('rules','戦闘ルール','通常戦・ボス戦・特別チャレンジのすべてでオートを使えます。課題は自動達成されません。必要なら停止して手動で行動を選びましょう。');
 if(pocoBattleStatusFull(run))add('rules','戦闘ルール',pocoBattleStatusFull(run));if(run.cue)add('rules','ボス対処',cueText(run));
 if(G.battlePreview)add('preview','決定前の効果',G.battlePreview);
 add('support','応援・連携',renderBattleSupportHelp());if(run.supportNotice){const n=run.supportNotice;add('support','直前の応援効果',`${n.actor}：${n.action} エール${n.beforeA}→${n.afterA}${n.costA?`（${n.costA}消費）`:''}${n.kira?` キラコメ成功：追加エール${n.kira.gain}・防護が増えた味方${n.kira.protected}人`:''}`);}
 for(const e of run.enemies)add('foes','敵の状態',`${e.fullName||e.name} ★${e.rarity||1} HP ${e.hp}/${e.maxHP} 防御力${e.def} ${e.hp<=0?'鎮まった':teleText(run,enemyAction(run,e))}`);
 for(const m of run.party)add('growth','味方の状態',`${m.name} ${JOBS[m.job].name} 熟練度${m.R} HP ${m.hp}/${m.maxHP} MP ${m.c}/${m.maxC} ${m.acted?'行動済み':'未行動'} 防護${m.ward||0} ${m.guard?'ガード中':''}`);
 add('log','直近の戦闘ログ',(run.log||[]).slice(-12).join('／'));
 return renderEndFrame('battle-info:'+run.seq+':'+run.turn,pages,'戦闘の詳細','', 'battleInspectClose',G.battleInspectReturn?'戦闘メニューに戻る':'前の画面に戻る');}
function fitBattleView(){const view=document.querySelector('.mobile-battle');if(!view||!view.clientHeight)return;if(view.scrollHeight>view.clientHeight+2&&!view.classList.contains('focus')&&!G.mobileForceFocus){G.mobileForceFocus=true;render();}}

function renderBattleSupportHelp(){return `<p class="small">ここで説明する効果・数値・連携順序は、このゲーム独自のルールです。</p><h3>エール＝全員で共有する応援ゲージ</h3><p>応援コメントや技でためます。上限は100。40消費で「ファミリー応援」（全員のHP回復・戦闘不能から復活・生存者へ防護1）、80消費で「メーター突破」（敵全体への大ダメージ）が使えます。どちらも行動を1回使います。回復量やダメージは決定前の予測で確認できます。ガードのMP回復や復活HPも、実際に増える量を確認しましょう。撃破・連携・対処の固定ボーナスも上限100までで、ログには実際の増加量を出します。</p><h3>コメント連携＝次の攻撃への上乗せ</h3><p>応援コメントなどで連携値4を用意し、次の通常攻撃・対応する単体技に上乗せします。上乗せ量は成長係数や職業で変わり、対応する攻撃で使うと連携値を消費します。</p><h3>キラコメ＝別の3人で完成させる連携</h3><ol><li>1人目が応援コメントの「挨拶」</li><li>別の2人目が「作戦」</li><li>さらに別の3人目が「感謝」</li></ol><p>同じターンにこの順番で行います。途中で攻撃・道具などを挟むか、ターンが終わるとやり直しです。成功するとエール＋10（宮崎支援時は＋15）と、生きている味方全員に防護＋2。エール100・防護8の上限を超えた分は増えません。</p><p>防護は敵の攻撃ダメージを軽くし、敵の行動終了時に消えます。キラコメ完成は1戦闘に1回だけ。2人以下のパーティーでも、応援コメントによるエールとコメント連携の効果は使えます。</p>`;}

function skillNeeds(job){ return ({J01:"enemy",J02:"line",J03:"ally",J04:"mode",J05:"enemy",J06:"mode",J07:"none",J08:"ally",J09:"enemy",J10:"none",J11:"none",J12:"none",J13:"ally",J14:"none",J15:"enemy",J16:"enemy",J17:"none",J18:"ally",J19:"enemy",J20:"none",J21:"enemy",J22:"allyOther"})[job]; }
function renderCommand(run){return renderMobileCommand(run);}
function buildAct(a){
  const c=G.cmd; if(!c.type) return null;
  if(c.type==="attack") return c.target!=null?{type:"attack",target:c.target}:null;
  if(c.type==="comment") return c.line?{type:"comment",line:c.line}:null;
  if(c.type==="guard") return {type:"guard"};
  if(c.type==="rest") return {type:"rest"};
  if(c.type==="other"){ if(c.o==="meter") return {type:"meter"}; if(c.o==="family") return {type:"family"}; return null; }
  if(c.type==="item"){ const it=c.item&&ITEMS[c.item]; if(!it) return null; const nd=itemNeeds(it);
    if(nd==="enemy") return c.target!=null?{type:"item",item:c.item,target:c.target}:null;
    if(nd==="ally"||nd==="down") return c.ally!=null?{type:"item",item:c.item,ally:c.ally}:null;
    return {type:"item",item:c.item}; }
  if(c.type==="skill"){
    if(c.skill){const sk=EXTRA_SKILLS[c.skill];if(!sk||!(a.extraSkills||[]).includes(c.skill))return null;const out={type:"skill",skillId:c.skill};if(sk.need==="enemy"){if(c.target==null)return null;out.target=c.target;}if(sk.need==="ally"||sk.need==="allyOther"){if(c.ally==null)return null;out.ally=c.ally;}if(sk.need==="line"){if(!c.line)return null;out.line=c.line;}if(sk.need==="mode"){if(!c.mode)return null;out.mode=c.mode;if(c.mode==="hp"||c.mode==="c"){if(c.ally==null)return null;out.ally=c.ally;}else{if(c.target==null)return null;out.target=c.target;}}return out;}
    const need=skillNeeds(a.job);
    if(need==="none") return {type:"skill"};
    if(need==="enemy") return c.target!=null?{type:"skill",target:c.target}:null;
    if(need==="ally"||need==="allyOther") return c.ally!=null?{type:"skill",ally:c.ally}:null;
    if(need==="line") return c.line?{type:"skill",line:c.line}:null;
    if(need==="mode"){ if(!c.mode) return null; if(c.mode==="hp"||c.mode==="c") return c.ally!=null?{type:"skill",mode:c.mode,ally:c.ally}:null; return c.target!=null?{type:"skill",mode:c.mode,target:c.target}:null; }
  }
  return null;
}
function previewText(run,a,p){
  const out=[];
  if(p.cost.c) out.push(`MP−${p.cost.c}`); if(p.cost.a) out.push(`エール−${p.cost.a}`); if(p.cost.hp) out.push(`HP−${p.cost.hp}`);
  for(const d of p.dmg){ const e=run.enemies.find(x=>x.slot===d.slot); out.push(`${e.display}に${d.amt}ダメージ${d.raw>=e.hp?"（鎮まる）":""}${d.critRaw!=null&&a.crit?`（会心${a.crit}%：${Math.min(d.critRaw,e.hp)}）`:""}`); }
  for(const h of p.heal){ const t=run.party[h.pos]; if(h.revive) out.push(`${t.name}がHP${h.amt}で復帰`); else if(h.amt>0) out.push(`${t.name} HP＋${h.amt}`); }
  for(const g of p.cgain){ if(g.amt>0) out.push(`${run.party[g.pos].name} MP＋${g.amt}`); }
  for(const w of p.ward){ if(w.amt>0) out.push(`${run.party[w.pos].name} 防護＋${w.amt}`); }
  if(p.aGain) out.push(`エール＋${Math.min(p.aGain,100-run.A+p.cost.a)}`);
  if(p.consumeB&&run.B) out.push(`コメント連携${run.B}を使用`);
  if(p.setB!=null) out.push("コメント連携を4に");
  if(p.guard) out.push("受けるダメージ半分");
  if(p.chain){ out.push(p.chain.adv? (run.chain.stage===2?"キラコメ連携が発動！":`連携が進む（${run.chain.stage+1}/3）`) : "連携は進まない"); }
  if(p.chainReset) out.push("この行動で連携は途切れます");
  if(p.cue) out.push("ボス対処に参加");
  return `<span class="pv">${out.map(esc).join("／")}</span>`;
}
function drawEnemies(){
  const run=G.st.run; if(!run) return; const now=Date.now(); const still=G.st.settings.reduceMotion;
  const f=still?0:Math.floor(now/500)%2;
  const bg=document.querySelector("canvas.stagebg"); if(bg){ const g=bg.getContext("2d"); g.imageSmoothingEnabled=false; g.drawImage(ART.stage(run.areaId, still?0:Math.floor(now/400)%4),0,0);
    if(!still){ for(let i=0;i<2;i++){ const x=Math.round(((now/70+i*100)%220)-30), y=4+i*7; g.fillStyle="rgba(244,236,216,.45)"; g.fillRect(x,y,18,3); g.fillRect(x+4,y-2,10,2); g.fillRect(x+3,y+3,14,1); } }
    if(run.kind==="boss"){const a=still?0.12:0.1+(Math.sin(now/900)+1)*0.025;g.strokeStyle=`rgba(213,179,76,${a})`;g.strokeRect(1.5,1.5,157,61);} }
  document.querySelectorAll("canvas[data-enemy]").forEach(c=>{
    const e=run.enemies.find(x=>x.slot===+c.dataset.enemy); const g=c.getContext("2d"); g.imageSmoothingEnabled=false; g.clearRect(0,0,c.width,c.height);
    if(!e||e.hp<=0) return;
    let img = e.boss? ART.enemy(e.id,"",null,run.areaId,f,64,true) : ART.enemy(e.profile,e.species,e.attr,run.areaId,f);
    if(!still && G.flash && G.flash.until>now && G.flash.slots.includes(e.slot) && Math.floor(now/60)%2===0) img=ART.flashOf(img);
    g.fillStyle="rgba(16,24,32,.28)";g.fillRect(Math.round(c.width*.22),c.height-3,Math.round(c.width*.56),2);
    g.drawImage(img,0,0);
    if(e.boss){g.fillStyle=PAL.gold;g.fillRect(2,2,5,1);g.fillRect(2,2,1,5);g.fillRect(c.width-7,c.height-3,5,1);g.fillRect(c.width-3,c.height-7,1,5);}
  });
}
function dealtBy(before){ const run=G.st.run; return run && run.enemies.some(e=>e.hp<before.e[e.slot]); }
function isLow(hp,max){ return hp>0 && hp<=max*0.3; }
function battleFx(before){
  const run=G.st.run; if(!run) return;
  const hurt=run.party.some((m,i)=>m.hp<before.p[i]);
  if(hurt){
    const ko=run.party.some((m,i)=>m.hp<=0&&before.p[i]>0);
    setTimeout(()=>SND.sfx(ko?"down":"damage"),dealtBy(before)?380:90);
    if(!G.st.settings.reduceMotion){ const sc=document.querySelector(".battle"); if(sc){ sc.classList.remove("quake"); void sc.offsetWidth; sc.classList.add("quake"); setTimeout(()=>sc.classList.remove("quake"),420); }
      const fl=document.createElement("div"); fl.className="hurtflash"; document.body.appendChild(fl); setTimeout(()=>fl.remove(),260); }
  }
  if(G.st.settings.reduceMotion) return;
  const slots=[];
  run.enemies.forEach(e=>{ const d=before.e[e.slot]-e.hp; if(d>0){ slots.push(e.slot); pop($("#ec"+e.slot),`-${d}`,G.critNow?"crit":"dmg"); fxOn($("#ec"+e.slot), G.critNow?"fxburst":"fxslash", 420); } });
  run.party.forEach((m,i)=>{ if(m.hp>before.p[i]) fxOn(document.querySelector(`.pcard[data-i="${i}"]`),"fxheal",700); });
  run.party.forEach((m,i)=>{ const d=m.hp-before.p[i]; const el=document.querySelector(`.pcard[data-i="${i}"]`); if(d<0){ pop(el,`${d}`,"hurt"); el&&el.classList.add("shake"); } else if(d>0) pop(el,`+${d}`,"heal"); });
  if(slots.length){ G.flash={slots, until:Date.now()+360}; let n=0; const t=setInterval(()=>{ drawEnemies(); if(++n>7) clearInterval(t); },60); }
}
function fxOn(el,cls,ms){ if(!el) return; const d=document.createElement("span"); d.className="fx "+cls; d.setAttribute("aria-hidden","true"); el.appendChild(d); setTimeout(()=>d.remove(),ms); }
function pop(el,text,cls){ if(!el) return; const s=document.createElement("span"); s.className="pop "+cls; s.textContent=text; el.appendChild(s); setTimeout(()=>s.remove(),900); }
function startBattleTimer(){ stopBattleTimer(); if(!G.st.settings.reduceMotion) G.battleTimer=setInterval(drawEnemies,150); }
function stopBattleTimer(){ if(G.battleTimer){ clearInterval(G.battleTimer); G.battleTimer=0; } }
const BATTLE_CONTROL_ACTIONS=new Set(['battleCommandOpen','mobileCmdType','pickActor','cmdType','cmdSet','battlePickerOpen','battlePickerSelect','mobileConfirm','confirmAct','autoOn','autoNext','autoOff','mobileAuto','doRetreat','defeatReturn','retreat','pauseBattle','toResult']);
const BATTLE_CONTROL_RUNS=new WeakMap();let BATTLE_CONTROL_ID=0;
function battleControlToken(){const run=G.st?.run;if(G.screen!=='battle'||!run)return '';let id=BATTLE_CONTROL_RUNS.get(run);if(!id){id=++BATTLE_CONTROL_ID;BATTLE_CONTROL_RUNS.set(run,id);}return JSON.stringify([id,G.battleRenderVersion||0,run.turn,run.state,G.cmd,G.auto,G.autoWait,G.sheet,!!G.dlg,G.battleInspect,G.battleCommand,G.battlePicker]);}
function stampBattleControls(){if(G.screen!=='battle'||!G.st?.run)return;G.battleRenderVersion=(G.battleRenderVersion||0)+1;const key=battleControlToken();for(const el of document.querySelectorAll('[data-a],#nativeBattleTarget'))if(BATTLE_CONTROL_ACTIONS.has(el.dataset.a)||el.id==='nativeBattleTarget')el.dataset.battleKey=key;}
function battleControlIsCurrent(el){const key=battleControlToken();return !!key&&el.dataset.battleKey===key;}
function stopBattleAutomation(){clearTimeout(G.autoT);G.autoT=null;G.auto=false;G.autoWait=false;G.autoAct=null;G.autoLast=null;G.autoGeneration=(G.autoGeneration||0)+1;G.autoTicket=(G.autoTicket||0)+1;}
function battleInputRun(){const run=G.st?.run;return !G.readOnly&&G.screen==='battle'&&run?.state==='input'&&!G.sheet&&!G.dlg&&!G.battleInspect?run:null;}
function queueAutoStep(run,delay){clearTimeout(G.autoT);const ticket=G.autoTicket=(G.autoTicket||0)+1,state=G.st,generation=G.autoGeneration||0;if(!run||state?.run!==run)return;G.autoT=setTimeout(()=>{if(ticket!==G.autoTicket)return;autoStep(run,generation,state);},delay);}
function confirmAct(forced){
  const run=battleInputRun();if(!run||G.auto&&!forced||!Number.isInteger(G.cmd?.actor))return false;const st=G.st,a=run.party[G.cmd.actor];if(!a||a.hp<=0||a.acted)return false;const act=forced||buildAct(a);if(!act)return false;
  const before={e:Object.fromEntries(run.enemies.map(e=>[e.slot,e.hp])), p:run.party.map(m=>m.hp)};
  run.fx=[];
  const r=applyAction(run,G.cmd.actor,act);
  if(!r.ok) return toast(r.reason);
  const fx=run.fx||[]; run.fx=[]; G.critNow=fx.includes("crit");
  if(G.critNow){ setTimeout(()=>SND.sfx("crit"),60); if(!G.st.settings.reduceMotion){ const f=document.createElement("div"); f.className="critflash"; document.body.appendChild(f); setTimeout(()=>f.remove(),260); } }
  if(fx.includes("tsukon")) setTimeout(()=>SND.sfx("tsukon"),300);
  // 攻撃した時の効果音（通常攻撃・技能・全体攻撃・メーター突破で鳴り分け）
  const dealt = run.enemies.some(e=>e.hp<before.e[e.slot]);
  const killed = run.enemies.some(e=>e.hp<=0&&before.e[e.slot]>0);
  const atkSnd = act.type==="meter"?"meter": !dealt?null : act.type==="attack"?"slash" : run.enemies.filter(e=>e.hp<before.e[e.slot]).length>1?"allhit":"skillhit";
  SND.sfx(atkSnd || (r.log.some(l=>/HP＋|MP＋|防護/.test(l))?"heal":"ok"));
  if(killed && run.state!=="won") setTimeout(()=>SND.sfx("defeat"),180);
  if(r.log.some(l=>l.startsWith("パチパチ"))) SND.sfx("clap");
  if(r.log.some(l=>l.startsWith("キラコメ"))) SND.sfx("kira");
  G.cmd={};
  if(run.state==="lost") setTimeout(()=>SND.jingle("lose",null),450);
  if(run.state==="won"){stopBattleAutomation();toResult();return true;}
  commit(); render(); battleFx(before);return true;
}
/* ---- 戦闘オート（中断ボタンまで、戦闘終了まで自動で続く） ---- */
function autoStep(expectedRun=null,generation=null,expectedState=null){
  if(expectedRun&&(G.st!==expectedState||G.st?.run!==expectedRun||generation!==(G.autoGeneration||0)))return;
  G.autoTicket=(G.autoTicket||0)+1;clearTimeout(G.autoT);
  const st=G.st, run=st&&st.run;
  if(run&&!autoAllowed(run)){enforceAutoAvailability(run);render();return;}
  if(G.readOnly||!G.auto || G.screen!=="battle" || !run) { G.auto=false;G.autoWait=false;G.autoLast=null;return; }
  if(run.state!=="input"){ G.auto=false; G.autoLast=null; render(); return; }
  if(G.sheet||G.dlg||G.battleInspect||G.battleCommand||G.battlePicker||document.hidden){ queueAutoStep(run,400); return; }
  const pick=aiChoose(run);
  if(!pick){ G.auto=false; render(); return toast("オートで選べる行動がありません。"); }
  G.autoLast=`${pick.name}：${pick.label}`;
  G.cmd={actor:pick.idx}; G.autoAct=pick.act;
  const tap=autoMode()==="tap"; G.autoWait=tap; if(tap) G.cursorSig="autoNext||||||";
  confirmAct(pick.act);
  if(G.auto && run.state==="input"){ if(!tap) queueAutoStep(run,st.settings.reduceMotion?250:650); }
  else { G.auto=false; G.autoWait=false; G.cursorSig=run.state==="won"?"resultDone||||||":run.state==="lost"?"defeatReturn||||||":null; render(); }
}
function toResult(){
  const st=G.st,run=st?.run;if(G.readOnly||G.screen!=="battle"||!run||run.state!=="won")return;stopBattleAutomation();const res=applyVictory(st,run);
  if(res.levelAfter>res.levelBefore && Vof(res.levelAfter)>Vof(res.levelBefore)) res.notes.push("技能・装備の効果量が上昇（V"+Vof(res.levelAfter)+"）");
  const L0=res.levelBefore, L1=partyLevel(st);
  st.lastResult={seq:run.seq, kind:run.kind, bossId:run.bossId||null, turns:run.turn, ...res, log:(run.log||[]).slice(-80),
    enemies:run.enemies.map(e=>({name:e.display||e.name, boss:!!e.boss, rarity:e.rarity||0})),
    members:run.party.map(m=>{const rows=res.statDetail?.[m.cid]?.rows||[],hp=rows.find(r=>r[0]==="最大HP"),mp=rows.find(r=>r[0]==="最大MP");return {cid:m.cid,maxBefore:hp?.[1]??m.maxHP,maxAfter:hp?.[2]??m.maxHP,mpBefore:mp?.[1]??m.maxC,mpAfter:mp?.[2]??m.maxC};})};
  const back=run.returnPos; st.run=null;G.resultDetails=false;G.endPager=null;G.cursorSig="resultDone||||||";
  st.mapId=back.map; st.pos={x:back.x,y:back.y};
  commit(); G.screen="result"; render();
  if(res.characterGrowth?.some(g=>g.after>g.before)||res.levelAfter>res.levelBefore) SND.jingle("levelup","victory"); else SND.jingle("fanfare","victory");
}
/* 戦闘終了・結果：画面内のページ切替で全項目を確認する。 */
const END_GROUPS={rules:'ルール',support:'応援',preview:'予測',summary:'概要',growth:'成長',loot:'入手',challenge:'課題',notes:'通知',foes:'敵',log:'ログ',details:'詳細'};
function endTextBlocks(text,limit=84){const gs=graphemes(String(text||'')),out=[];for(let i=0;i<gs.length;i+=limit)out.push(`<p>${esc(gs.slice(i,i+limit).join(''))}</p>`);return out.length?out:['<p>記録なし</p>'];}
function endMemberBlock(st,cid,hp,maxHP,c,maxMP,rank,jpLabel=''){return `<div class="end-member"><b>${esc(charName(st,cid))}</b><span>HP ${hp}/${maxHP}</span><span>MP ${c}/${maxMP}</span>${rank!=null?`<span class="end-jp">熟練${rank}${jpLabel}</span>`:''}</div>`;}
function endSizeKey(){return `${window.innerWidth||390}:${window.innerHeight||844}:${typeof VFIT!=='undefined'?VFIT.value:0}`;}
function renderEndFrame(key,pages,title,subtitle,primary,button,extraTab=""){
 const fullKey=key+':'+endSizeKey();
 if(!G.endPager||G.endPager.key!==fullKey){G.endPager={key:fullKey,pages,index:0,primary,resetScroll:true};G.cursorSig=primary+'||||||';}
 const ui=G.endPager;ui.index=Math.max(0,Math.min(ui.pages.length-1,ui.index||0));const page=ui.pages[ui.index],groups=[...new Set(ui.pages.map(p=>p.group))];
 return `<section class="end-view ${mobilePlan().available<360?"short-end":""}" aria-labelledby="endTitle"><header class="end-head"><div><h2 id="endTitle">${esc(title)}</h2><p>${esc(page.title||subtitle)}</p></div>${systemHelpButton("end")}</header><nav class="end-tabs" aria-label="結果の表示切替" style="--end-tabs:${groups.length+(extraTab?1:0)}">${groups.map(g=>`<button class="btn ${page.group===g?'on':''}" data-a="endPage" data-k="${esc(ui.key)}" data-v="${ui.pages.findIndex(p=>p.group===g)}" ${page.group===g?'disabled aria-current="page"':''}>${END_GROUPS[g]||g}</button>`).join('')}${extraTab}</nav><div class="end-content" aria-label="${esc(page.title||END_GROUPS[page.group])}">${page.blocks.map(b=>`<div class="end-piece">${b}</div>`).join('')}</div><footer class="end-footer"><nav class="end-pages" aria-label="確認ページ"><button class="btn" data-a="endPage" data-k="${esc(ui.key)}" data-v="${ui.index-1}" ${ui.index<=0?'disabled':''}>◀ 前へ</button><span aria-live="polite">${esc(END_GROUPS[page.group])} ${ui.index+1}/${ui.pages.length}</span><button class="btn" data-a="endPage" data-k="${esc(ui.key)}" data-v="${ui.index+1}" ${ui.index>=ui.pages.length-1?'disabled':''}>次へ ▶</button></nav><button class="btn primary end-primary" data-end-primary data-a="${primary}">${esc(button)}</button></footer></section>`;
}
function fitEndView(){
 const view=document.querySelector('.end-view'),body=view&&view.querySelector('.end-content');if(!body||!body.clientHeight||!G.endPager)return;
 if(body.scrollHeight<=body.clientHeight+1)return;view.classList.add('tight');if(body.scrollHeight<=body.clientHeight+1)return;
 const ui=G.endPager,page=ui.pages[ui.index],moved=[];
 while(body.scrollHeight>body.clientHeight+1&&page.blocks.length>1){const last=body.lastElementChild;if(!last)break;last.remove();moved.unshift(page.blocks.pop());}
 if(moved.length){ui.pages.splice(ui.index+1,0,{group:page.group,title:page.title,blocks:moved});render();return;}
 // 極端に低い表示枠でも、一つの文章を次の確認ページへ分割する。
 const last=body.firstElementChild;if(!last)return;const text=last.textContent||'',gs=graphemes(text);
 if(gs.length>36){const mid=Math.ceil(gs.length/2);page.blocks=[`<p>${esc(gs.slice(0,mid).join(''))}</p>`];ui.pages.splice(ui.index+1,0,{group:page.group,title:page.title,blocks:[`<p>${esc(gs.slice(mid).join(''))}</p>`]});render();}
}
function endChallengeBlocks(conditions){return (conditions||[]).map(c=>`<p class="end-check ${c.ok?'good':'warn'}"><b>${c.ok?'✓':'未'}</b> ${esc(c.label)}<span>現在 ${esc(c.value)}</span></p>`);}
function renderBattleEnd(run){
 const st=G.st,won=run.state==='won',conditions=run.challengeId?trialConditions(run):[],passed=conditions.every(c=>c.ok),limit=run.turnLimit&&run.turn>run.turnLimit;
 const title=won?(run.challengeId?(passed?'チャレンジ課題達成！':'討伐成功・課題未達'):'勝利！'):(limit?'制限ターン終了':'戦闘終了・敗北');
 const summary=[`<p class="end-status">${won?'敵をすべて鎮めました。':run.challengeId?'追加のゴールド損失はありません。':`所持金の半分（${Math.floor(st.gold/2)}G）を失い、安全地点へ戻ります。`}</p>`];

 if(conditions.length)summary.push(`<p class="end-status ${passed?'good':'warn'}">課題 ${conditions.filter(c=>c.ok).length}/${conditions.length} 達成${!passed?'・課題ページで確認':''}</p>`);
 if(!won)summary.push('<p class="end-status">HP・MPは帰還時に全回復。受注・育成・所持品は保持します。</p>');
 const pages=[{group:'summary',blocks:summary}];
 if(conditions.length)pages.push({group:'challenge',blocks:endChallengeBlocks(conditions)});
 if(!won){pages.push({group:'foes',blocks:run.enemies.flatMap(e=>endTextBlocks(`${e.hp<=0?'撃破':'残存'}：${e.display||e.name}　HP ${e.hp}/${e.maxHP}`))});if(run.log?.length)pages.push({group:'log',blocks:run.log.flatMap(t=>endTextBlocks(t))});}
 return renderEndFrame('battle-end:'+run.seq+':'+run.state,pages,title,`${run.turn}ターン・${run.kind==='challenge'?'特別チャレンジ':run.kind==='boss'?'地域ボス':'通常戦闘'}`,won?'toResult':'defeatReturn',won?'結果・報酬を確認する':'安全な場所へ戻る');
}
function resultEndPages(st,r,details=false){
 const L=partyLevel(st),growth=(r.characterGrowth||[]).filter(g=>g.after>g.before),up=r.characterGrowth?growth.length>0:r.levelAfter>r.levelBefore,summary=[];
 summary.push(`<div class="end-rewards" style="--rewards:${r.tickets?3:2}"><span>経験値<b>＋${(r.xp||0).toLocaleString()}</b></span><span>ゴールド<b>＋${(r.gold||0).toLocaleString()}</b></span>${r.tickets?`<span>チケット<b>＋${r.tickets.toLocaleString()}</b></span>`:''}</div>`);
 if(up){for(const g of growth)summary.push(`<p class="good"><b>${esc(charName(st,g.cid))} Lv${g.before} → ${g.after}</b></p>`);if(!r.characterGrowth)summary.push(`<p class="good">Lv${r.levelBefore} → ${r.levelAfter}</p>`);summary.push('<p class="end-status good">レベルアップした仲間はHP・MP全回復。能力の変化は「成長」で確認できます。</p>');}
 for(const j of (r.jp||[]).filter(j=>j.R1>j.R0))summary.push(`<p class="end-status good">${esc(charName(st,j.cid))} 熟練度 ${j.R0} → ${j.R1}</p>`);
 if(r.challenge)summary.push(`<p class="end-status ${r.challenge.passed?'good':'warn'}">特別課題 ${r.challenge.conditions.filter(c=>c.ok).length}/${r.challenge.conditions.length}${r.challenge.first?'・初回報酬獲得':r.challenge.passed?'・練習クリア':'・未達成（詳細で条件を確認）'}</p>`);
 if(r.quest&&QUESTS[r.quest])summary.push(`<p class="end-status good">依頼 ${esc(r.quest)} 完了</p>`);else if(r.killQuest)summary.push(`<p class="end-status">討伐 ${esc(r.killQuest)}：${r.killNow}/${r.killNeed}</p>`);
 const loot=[...(r.gear||[]).map(x=>({name:EQUIP[x.id]?.name||x.id,quantity:1,why:x.why||'',ultra:!!EQUIP[x.id]?.ultra,status:x.kept?'預かり所へ':'装備品に追加'})),...(r.items||[]).map(x=>({name:ITEMS[x.id]?.name||x.id,quantity:x.n,why:x.why||'',status:'道具袋へ'})),...(r.itemsKept||[]).map(x=>({name:ITEMS[x.id]?.name||x.id,quantity:x.n,why:x.why||'',status:'預かり所へ'})),...(r.itemsLost||[]).map(x=>({name:ITEMS[x.id]?.name||x.id,quantity:x.n,why:x.why||'',status:'空き不足・受取不可',lost:true})),...(r.gifts||[]).map(id=>({name:EQUIP[id]?.name||id,quantity:1,ultra:!!EQUIP[id]?.ultra,status:(st.keep||[]).includes(id)?'贈り物・預かり所へ':'贈り物・装備品に追加'}))];
 for(const x of loot)summary.push(`<p class="end-status ${x.lost?'warn':x.ultra?'good':''}">${x.ultra?'超レア！ ':''}${esc(x.name)} ×${x.quantity}${x.lost||x.status.includes('預かり')?'／'+esc(x.status):''}</p>`);
 const participants=r.members?.map(m=>m.cid)||r.characterGrowth?.map(g=>g.cid)||st.party;
 if(participants.some(c=>{const v=vitalOf(c),s=charStats(st,c,L);return v.hp<=0||isLow(v.hp,s.maxHP);}))summary.push('<p class="end-status warn">HPが少ない仲間がいます。次の戦闘前に回復しましょう。</p>');
 const pages=[{group:'summary',blocks:summary}];
 const growing=new Set(growth.map(g=>g.cid));
 if(up&&r.statDetail){for(const [cid,d]of Object.entries(r.statDetail)){if(!st.roster.includes(cid)||r.characterGrowth&&!growing.has(cid))continue;const g=growth.find(x=>x.cid===cid);pages.push({group:'growth',title:charName(st,cid)+'のレベルアップ',blocks:[`<h3>${esc(charName(st,cid))}${g?` Lv${g.before} → ${g.after}`:'・能力上昇'}</h3>`,...d.rows.map(([label,a,b])=>`<div class="end-stat"><span>${esc(label)}</span><span>${a} → <b>${b}</b></span><strong class="${b>=a?'good':'warn'}">${b-a>=0?'＋':''}${b-a}</strong></div>`)]});}}
 else if(up&&r.statUps)for(const [cid,rows]of Object.entries(r.statUps)){if(r.characterGrowth&&!growing.has(cid))continue;pages.push({group:'growth',blocks:[`<h3>${esc(charName(st,cid))}・能力上昇</h3>`,...rows.map(([k,n])=>`<p>${esc(STAT_NAMES[k]||k)} ＋${n}</p>`)]});}
 const notes=[...new Set(r.notes||[])];if(notes.length)pages.push({group:'notes',blocks:notes.flatMap(t=>endTextBlocks(t))});
 if(details){
  const blocks=[`<p>パーティLv ${L}／上限${progressionCap(st)}・${L<progressionCap(st)?'次まで '+(xpFor(L+1)-partyExperience(st)).toLocaleString()+' EXP':'最大レベル'}</p>`];
  for(const x of r.members||[]){const s=charStats(st,x.cid,L),v=vitalOf(x.cid),j=(r.jp||[]).find(j=>j.cid===x.cid)||{gain:0};blocks.push(endMemberBlock(st,x.cid,v.hp,s.maxHP,v.c,s.startC,j.R1>j.R0?`${j.R0}→${j.R1}`:s.R,`（＋${j.gain} JP${s.R<progressionCap(st)?'／次まで'+(jpFor(s.R+1)-jpOf(st,x.cid,s.job)):''}）`));}
  for(const g of r.characterGrowth||[])blocks.push(`<p>${esc(charName(st,g.cid))}：EXP＋${g.gain}／Lv${g.before} → ${g.after}</p>`);
  blocks.push(...endChallengeBlocks(r.challenge?.conditions));
  blocks.push(...(r.enemies||[]).flatMap(e=>endTextBlocks('撃破：'+e.name+(e.boss?'（ボス）':e.rarity?'（★'+e.rarity+'）':''))));
  if(r.log?.length)blocks.push('<h3>戦闘の進行コメント</h3>',...r.log.flatMap(t=>endTextBlocks(t)));
  pages.push({group:'details',blocks});
  if(loot.length)pages.push({group:'loot',blocks:loot.map(x=>`<div class="end-loot ${x.lost?'warn':''}"><b>${esc(x.name)} ×${x.quantity}</b><span>${esc(x.status)}${x.why?'／'+esc(x.why):''}</span></div>`)});
 }
 return pages;
}
function renderResult(){const st=G.st,r=st.lastResult;if(!r)return '';const details=!!G.resultDetails,title=r.challenge?(r.challenge.passed?'特別チャレンジ達成！':'討伐成功・課題未達'):r.kind==='boss'?'ボスを鎮めた！':'勝利！';return renderEndFrame('result:'+r.seq+':'+details,resultEndPages(st,r,details),title,`${r.turns||0}ターン・戦闘結果`,'resultDone','確認して探索へ',`<button class="btn" data-a="resultDetails" aria-pressed="${details}">${details?'簡略':'詳細'}</button>`);}

function resultDone(){
  if(!G.st||G.readOnly||G.screen!=="result"||G.st.run||G.st.stream||!G.st.lastResult)return false;
  const r=G.st.lastResult; G.screen="explore"; keepFlush(); render(); exploreBgm();
  const Qd = r && r.quest && QUESTS[r.quest];
  if(Qd && Qd.scene && SCENES[Qd.scene] && !G.st.scenes[Qd.scene]) playScene(Qd.scene);
  else if(r && r.bossId){ const qb=Object.keys(QUESTS).find(k=>QUESTS[k].boss===r.bossId); const bs=qb&&QUESTS[qb].bossScene; if(bs && SCENES[bs] && !G.st.scenes[bs]) playScene(bs); }
}

/* ---- 配信（第13・14節） ---- */
function renderStream(){
  const st=G.st,s=st.stream;if(!s)return "";
  const req=s.requestIds,theme=STREAM_THEMES[s.theme];
  if(s.done){const pass=s.score>=80;return statusBar()+`<section class="win stream"><h2 class="label">22時00分 締め</h2><p class="big">${esc(streamGrade(s.score))}</p><p>${pass?"配信目標を達成しました！":"今回は目標に届きませんでした。街の声を聞き、冒険で準備を整えましょう。"}</p>${broadcastResultPanel(st,s)}<div class="stack">${pass?`<button class="btn primary" data-a="streamFinish" data-token="${streamSessionToken(s)}">報酬を受け取って終了</button>`:`<p>再挑戦条件：この街の異なる住民2人と話し、この地域の通常戦闘で1回勝利する。</p><button class="btn primary" data-a="streamRetry" data-token="${streamSessionToken(s)}">街に戻って準備する</button>`}</div></section>`;}
  const comments=[`初見です！ ${STREAM_ACTS[req[s.hand]].req}`,"こんばんは〜",s.hand?`${STREAM_ACTS[s.picks[s.hand-1].act].name}よかった！`:((HUB_TEXT[s.hub]||{}).stream||{}).from||"応援しています"];
  return statusBar()+`<section class="win stream"><div class="srow"><span class="label">九州エール便</span><span>${STREAM_TIMES[s.hand]}（${s.hand+1}／4手番）</span></div><p class="small">配信サポート：${esc(charName(st,s.host))}　テーマ：${esc(theme.name)}</p><p class="m-summary">ライブ指標（ゲーム推計）：視聴者 ${broadcastMetrics(st,s).viewers}人／最大同接 ${broadcastMetrics(st,s).peak}人／反応 ${s.score}点</p><details class="broadcast-fold"><summary>ここまでの反応を見る</summary>${renderBroadcastTimeline(broadcastTimeline(st,s))}</details><div class="comments">${comments.map(c=>`<div class="cmt">${esc(c)}</div>`).join("")}</div><p class="req">要望：「${esc(STREAM_ACTS[req[s.hand]].req)}」</p><div class="stack">${Object.entries(STREAM_ACTS).map(([k,v])=>`<button class="btn opt" data-a="streamAct" data-v="${k}" data-hand="${s.hand}" data-token="${streamSessionToken(s)}">${esc(v.name)}${s.used.includes(k)?"（使用済み）":""}</button>`).join("")}</div></section>`;
}
function streamAct(k,expectedHand,token){
  const st=G.st, s=st?.stream; if(!streamInputReady(s,token)||s.done||!Number.isInteger(expectedHand)||expectedHand!==s.hand||!STREAM_ACTS[k])return false; const r=streamPlay(s,k);
  const hs=(HUB_TEXT[s.hub]&&HUB_TEXT[s.hub].stream)||HUB_TEXT.KY02.stream;
  const lines={first:hs.first,local:hs.local,reply:hs.reply,thanks:"今日来てくれた人、本当にありがとう。全部の声、覚えておくね。",like:"いいねの光、順番に灯っていくね！",kira:"キラコメ、届いてる！ 光の文字がきれい。"};
  SND.sfx(r.total?"ok":"cancel");
  if(s.done&&s.score<80) markStreamFailure(st,s.hub);
  if(s.done){ s.best=Math.max(st.streamBest[s.prefId]||0,s.score); st.streamBest[s.prefId]=s.best; }
  commit(); say([["もえ",lines[k]],["",r.total?"視聴者から反応が届いた。":"同じ演出が続き、反応が落ち着いている。"]]);
}
function streamFinish(token){
  const st=G.st,s=st?.stream;if(!streamInputReady(s,token)||!s.done||s.score<80)return false;if(streamPending()==='N607'&&nationalFinalReason(st)){toast(nationalFinalReason(st));return;} const qid=streamPending(); if(!qid)return;if(!s.broadcastPlan)s.broadcastPlan={policy:'community',goal:100,incomeGoal:100,level:partyLevel(st),fans:0,qid}; delete (st.streamRetryGate||{})[st.stream.hub]; st.stream=null;
  const L0=partyLevel(st); const res={xp:0,tickets:0}; completeQuest(st,qid,res); const receipt=settleBroadcast(st,s,qid); const up=levelUpEffects(st,L0,partyLevel(st));
  commit(); G.screen="explore"; exploreBgm(); render();
  toast(`${qid}完了：配信利益＋${receipt?.net||0}G・ファン＋${receipt?.newFans||0}人／経験値＋${res.xp}・チケット＋${res.tickets}`+(res.notes?.length?'。'+res.notes.join(' '):'')+(up?`。レベル${partyLevel(st)}に上がり、HP・MPが全回復！ ${st.lastMpGrowth.members.map(m=>`${charName(st,m.cid)} 最大MP ${m.before}→${m.after}`).join("／")}`:""));
  const Qf=QUESTS[qid]; if(Qf && Qf.scene && SCENES[Qf.scene]) playScene(Qf.scene);
}

/* ---- シート（メニュー） ---- */
/* Searchable, story-free help. Skill and equipment entries read the live game data. */
const SYSTEM_GUIDE_CATEGORIES={all:'すべて',start:'はじめの一歩',battle:'戦闘・連携',growth:'レベル・転職',jobs:'職業',skills:'技・必殺技',rare:'超レア',gear:'装備・道具',special:'特別エリア',travel:'街・移動',save:'保存・困ったとき'};
const SYSTEM_GUIDE_PAGE_SIZE=12;
let SYSTEM_GUIDE_CACHE=null;
function guidePlain(html){return html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');}
function guideSearchText(s){return String(s).normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();}
function guideTechDetail(sk){
 if(sk.baseJob)return '<p>'+esc(JOBS[sk.baseJob].desc(Kof(1)))+'</p><p>上は熟練度1の例です。元の職業の熟練度が上がると効果も強くなります。転職後も、覚えた元職の技を選べます。</p>';
 if(sk.ultimate)return '<p>'+esc(sk.desc)+'</p>';
 const k=sk.power||1,ex=Math.floor((12+2*Kof(Math.max(1,sk.rank||1)))*k),v=sk.effect;
 const words={strike:'敵1体に、武器を使った強い攻撃。',pierce:'敵1体に、敵の防御力を無視する攻撃。',all:'生きている敵全員へ攻撃。武器の攻撃力を直接足す単体技とは計算が違います。',heal:'生きている味方1人のHPを回復。戦闘不能には効きません。',healAll:'生きている味方全員のHPを回復。戦闘不能には効きません。',ward:'味方1人に防護を足します。防護は最大8。',wardAll:'生きている味方全員に防護を足します。防護は最大8。',mp:'自分以外の、生きている味方1人のMPを回復。',rally:'エールをため、生きている味方全員に防護1。'};
 const formula={strike:'追加の攻撃値＝切り捨て((12＋技能強化×2)×技の倍率)。',pierce:'追加の攻撃値＝切り捨て((12＋技能強化×2)×技の倍率)。敵の防御力は0として計算。',all:'ダメージ＝切り捨て((ちから×0.65＋(8＋技能強化)×成長係数)×技の倍率)－敵の防御力。最低1。',heal:'回復量＝切り捨て(((18＋技能強化×2)×成長係数＋レベル)×技の倍率)。',healAll:'1人あたりの回復量＝切り捨て(((10＋技能強化)×成長係数＋レベル÷2)×技の倍率)。',ward:'防護＋'+Math.floor(5*k)+'。',wardAll:'防護＋'+Math.floor(4*k)+'。',mp:'MP回復量＝切り上げ((8＋切り捨て(レベル÷10))×技の倍率)。',rally:'エールの基本増加＝切り捨て((24＋技能強化)×技の倍率)。魅力などの補正を加えます。'};
 return '<p>'+esc(words[v]||sk.desc)+'</p><details><summary>くわしい数の決まり</summary><p>'+esc(formula[v]||sk.desc)+'</p><p>技の倍率：'+k.toFixed(2)+'倍。成長係数はLv1～20で1、Lv21～40で2、その後も20レベルごとに1増えます。技能強化は、職業技では元の職業、超レア技では現在の職業の熟練度で決まります。単体攻撃は「ちから＋成長係数×（追加攻撃値＋武器・アクセサリーの攻撃値＋コメント連携）－敵の防御力」が基本です。会心・職業特性などで最終値が変わります。</p></details>';
}
function guideGearSource(id,it){
 if(it.chapterUltra){const c=SYSTEM_CHAPTERS.find(c=>c.id===it.chapterUltra);return c.name+'の通常戦闘・ボス戦（地域特別・対応する特設エリアを含む）。通常戦闘の勝利ごとに1/'+CHAPTER_DROP_RULES.field+'、ボス勝利ごとに1/'+CHAPTER_DROP_RULES.boss+'で超レア抽選に当たり、その章の3品から1品。同じ確率なので、この1品の確率は通常1/600、ボス1/120。特別チャレンジでは落ちません。';}
 if(it.ultra)return '以前の版の超レア装備です。持っている品は残ります。固有技は対応する品を装備中のみ使用できます。現在の敵の超レア抽選は、章ごとの新しい3品が対象です。';
 if(it.gearSource){if(it.gearSource==='shop')return (HUBS[it.gearHub]?.name||it.gearHub)+'のギア店。';if(it.gearSource==='event')return (HUBS[it.gearHub]?.name||it.gearHub)+'のファミリー施設・装備依頼。住民2人と会話し、受注後にこの街の通常戦闘'+(2+Math.floor(it.gearTier/2))+'勝で受け取ります。';const hubs=[...new Set(Object.entries(AREAS).filter(([,a])=>gearTierForQ(a.q)===it.gearTier).map(([id])=>HUBS[id.slice(0,4)]?.name||MAPS[id.slice(0,4)]?.name).filter(Boolean))];return (it.gearSource==='enemy'?'通常敵のドロップ。敵1体ごとに、星5以上は1/5、星3以上は1/8、ほかは1/12で追加装備を抽選。':'地域ボスの追加装備。初回撃破で1品、再戦は1/3で抽選。特別チャレンジは対象外。')+'同じ段階の候補品から1品が選ばれます。対象の街・特設エリア：'+hubs.join('・')+'。';}
 const shops=[...new Set(Object.entries(SHOPS).filter(([,s])=>s.items.includes(id)).flatMap(([sid])=>Object.values(MAPS).filter(m=>m.objects?.some(o=>o.type==='shop'&&o.shop===sid)).map(m=>m.name)))];
 if(shops.length)return '購入できる街：'+shops.join('・')+'。購入価格'+it.price+'G。';
 const sp=NATIONAL_SPECIALS.find(c=>c.reward===id)||NEXT_CHAPTER.find(c=>c.reward===id)||SPECIAL_STAGES.find(c=>c.reward===id)||POCO_TRIALS.find(c=>c.reward===id);if(sp)return '初回報酬：'+(sp.name||HUBS[sp.id]?.name||sp.id)+'。保管場所が満杯なら空きを作り、再戦・受付で受け取り直せる報酬があります。';
 if(/^RR[WAX][1-3]$/.test(id))return '通常敵のレア抽選、またはボスのレア報酬。敵の強度で第1～3段階が決まります。「レアドロップの決まり」も見てください。';
 if(/^J[WA]/.test(id))return '職業の熟練度などの条件を満たすと、贈り物や店で手に入る職業装備です。';
 return it.nonSale?'非売品。初期装備・宝箱・依頼・イベントなどの報酬です。':'店・贈り物・宝箱などで入手。町のショップと図鑑も確認してください。';
}
function systemGuideEntries(){
 if(SYSTEM_GUIDE_CACHE)return SYSTEM_GUIDE_CACHE;
 const out=[],add=(id,cat,title,body,keys='')=>out.push({id,cat,title,body,search:guideSearchText(title+' '+keys+' '+guidePlain(body))}),p=s=>'<p>'+s+'</p>';
 add('first','start','はじめて遊ぶ人へ：何をしたらいい？',p('地面をタップするか、スティックで歩きます。近くの人や建物はスティック中央の「決定」で調べます。「戻」で詳細から1つ前へ戻ります。見出しの「マップへ／戦闘へ」で一覧の階層をまとめて閉じます。メニューの最上位では「戻」でも元の画面へ戻ります。メニューの詳細・分類・検索・ページを開いた後も、直前の項目と読んでいた位置へ戻れます。いちばん外側で戻るとMAPなどの元の画面へ戻ります。買い物・転職・事件の進み具合は巻き戻りません。')+p('探索の解説は「メニュー」の詳細一覧から開けます。戦闘中は左が解説、右がオートです。探索の操作パッドは上段「道しるべ・メニュー」、下段「依頼帳・設定・保存」です。操作パネルを消している時は、MAPや戦闘画面の上、メニューの見出しなどに解説が1つ出ます。解説を読んでいる間は、もう1つ解説ボタンを出しません。')+p('常時表示の「依頼帳」を開き、今できる依頼を選びましょう。「道しるべ」で施設を選ぶと、そこまで歩けます。職業を変える時は、街の「職」ハローワークで専用イベントをクリアしましょう。敵が出る道では戦闘になることがあります。'),'操作 コントローラー ジョイスティック');
 add('status-screen','start','ステータス：仲間と知りたいことを選ぶ',p('上の仲間選択か左右の矢印で、見たい仲間を切り替えます。「能力・装備」でHP・MP・攻撃力・防御力と次の成長までの必要量を確認。「技」「人物」「職業」で表示を分けています。名前変更もできます。')+p('技は名前や効果で検索し、習得済み・これから覚える技・超レア技・必殺技で絞り込み、6件ずつ確認します。習得済みでも、戦闘中はMP、再使用待ち、必殺技の条件が必要です。超レア技は対応装備を着けた時だけ表示・使用できます。')+p('能力のくわしい内訳と累計経験値は、能力タブの「基礎能力・全能力・成長のくわしい説明」を開きます。戦闘中に確認するHP・MPは、いま戦っている仲間の値です。'),'ステータス 人物選択 HP MP 技 検索 名前');
 add('shop-screen','gear','ショップ：個数・合計・残るゴールドを確認',p('Gはゴールドです。「装備を買う」「道具を買う」「売る」を選びます。名前・効果・職業のことばで検索し、種類や今買える品で絞り込めます。品は6件ずつです。仲間を選ぶと、その仲間の装備条件と能力の変化で比べられます。')+p('商品を選んで、1個・＋・−・最大のボタンで数を決めます。合計と取引後の所持金を確認してから購入・売却を確定します。「最大」は所持金と持ち物の空きから計算。装備は同じ品を8個まで、道具は'+BAG_KINDS+'種類・同じ品を'+BAG_STACK+'個までです。装備中の品は売れません。専用道具には職業と熟練度の条件があります。')+p('買っただけでは装備は変わりません。将来使う装備も買えますが、使う時には本人のレベル・職業・熟練度が必要です。取引後・取りやめ時は元の検索や一覧へ戻ります。売買はその街の店の前で行い、戦闘・配信・活動準備・会話中や閲覧のみのタブでは確定できません。'),'買い物 購入 売却 数量 合計 G 店 所持金 持ち物');
 add('equipment-screen','gear','装備：今と変更後を比べて確定する',p('「仲間の装備」から仲間と武器・防具・アクセサリーを選びます。名前や効果で検索し、「この仲間が装備可能」「未装備・装備可能」「超レア」などで絞り込めます。6件ずつ表示し、種類・職業・強さ・価格でも並べ替えられます。')+p('候補を押しただけでは装備は変わりません。最大HP・最大MP・攻撃力・防御力の今と変更後、増える数・減る数を確認して確定します。その他の能力差も開いて確認できます。外す時も能力差を確認します。ほかの仲間が着けている品は、その仲間の名前と外した後の能力も表示します。')+p('装備条件は本人のレベル・職業・熟練度で判定します。比較後に状態が変わった時は、候補から選び直してください。「未装備の持ち物」では所持数・装備中・未装備を区別。捨てる時は確認が必要で、装備中の最後の1個は捨てられません。装備変更や捨てる操作は安全地帯で行います。検索・選択・読んでいた位置は解説や別画面から戻っても復元します。'),'装備 比較 確認 付け替え 受け渡し レベル 熟練度 捨てる');
 add('party','start','同行者は2～4人：主人公とヒロインは必須',p('二人はいつも同行します。ほかの仲間は0～2人まで選べます。最大4人です。街のファミリー施設で「編成」を開くと、ほかの仲間を控えと入れ替えられます。主人公とヒロインは外せません。')+p('経験値と職業の熟練度をもらえるのは、その戦闘に参加した仲間だけです。控えの経験値は減りません。パーティレベルは、同行者の経験値の平均から決まるので、入れ替えると表示が変わることがあります。'),'人数 交代 控え 主人公 ヒロイン ファミリー 経験値');
 add('stats','growth','HP・MP・攻撃力・防御力の意味',p('HPは元気です。0になると戦闘不能。MPは技を使う力です。技を使うと減り、足りないと使えません。宿屋や回復道具で戻せます。')+p('攻撃力は「ちから＋武器など」、防御力は「身の守り＋防具」です。身の守りも防御力に入ります。装備の数値はレベルによる成長係数で強くなるものがあります。編成・ステータス画面で実際の合計値を確認できます。')+p('最大MPはレベルアップと熟練度で増えます。増え方は職業ごとに違います。レベルアップした本人のHPとMPは全回復。レベルが上がっていない仲間は全回復しません。'),'集中力 最大MP レベルアップ ステータス 身の守り');
 add('limits','growth','章ごとの上限とボス攻略の目安',p('レベルと職業熟練度は、章が解放されるたびに100ずつ上限が上がり、最後は999です。本編ボスは、強い装備と複数の職業技を使えば、その章の上限の半分くらいでも挑める目安にしました。人数・職業・操作・難易度で結果は変わります。超レア装備は必須ではありません。')+'<div class="guide-table"><table><thead><tr><th>章</th><th>上限</th><th>本編終盤の目安</th><th>地域特別の目安</th></tr></thead><tbody>'+SYSTEM_CHAPTERS.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+c.cap+'</td><td>Lv'+c.target+'＋強い装備・技</td><td>'+(c.special?'Lv'+c.cap+'＋強い装備':'高レベルの特設エリアで育成')+'</td></tr>').join('')+'</tbody></table></div>'+p('ここでいう地域特別の上限は、その地域の章の上限です。たとえば九州の特別エリアはLv100が目安です。次の章が開いて上限200になっていても、九州特別の目安は100です。上限に達すると経験値・熟練度の加算は止まり、次の上限が開いてから再び育ちます。'),'MAX レベル50 レベル100 レベル999 難易度');
 add('training','growth','レベルと熟練度は別のもの',p('レベルはキャラの育ち方、熟練度はその職業での練習量です。戦闘に参加して勝つと増えます。高くなるほど次の段階までに必要な量が増えます。弱い敵ばかりより、準備をして適正レベルの敵に挑む方が育成に向いています。')+p('技能強化が上がる熟練度：'+MASTERY_STEPS.join('・')+'。現在職の武器を使うと技能強化がさらに1増えます。')+p('職業の基礎能力補正は熟練度999で47％。熟練度による最大MPは「熟練度÷2」の小数点以下を切り捨てた分が加わります。'),'JP XP 育成 必要経験値');
 add('changeJob','growth','転職すると、何が残る？',p('街の「職」ハローワークで、その職業の専用イベントを3段階クリアします。その後「転職する」→仲間→職業→能力を確認して確定。クリア記録は仲間全員で共通、転職は無料です。編成画面から直接の転職はできません。職業で覚えた技と職業ごとの熟練度は残ります。前の職業の専用装備・専用道具は、違う職業では使えません。共有装備には本人のレベル条件があります。')+p('普段の能力と職業特性は、今の職業のものになります。前の職業から能力として持ち越せるのは「永続ボーナス」です。複数の職業の分を足し、各能力＋45％まで。熟練度'+JOB_BONUS_STEPS.join('・')+'で新しい段階に進みます。')+p('引き継いだ技の条件と強さには、その技の元の職業の熟練度を使います。レベルや上限の条件に届かない間は使えません。'),'ジョブチェンジ 引継ぎ 永続ボーナス 専用装備');
 add('turn','battle','ターン制バトル：予告を見てから行動',p('同行者が全員戦闘不能の時は戦闘を始められません。道具や宿屋で復活させましょう。途中の戦闘を再開して全員戦闘不能なら、敗北画面から安全な場所へ戻れます。戦闘中・敗北・撤退では報酬をもらえず、勝利した戦闘の報酬は1回だけです。')+p('生きている仲間が1回ずつ行動すると敵の番です。敵の「次」の表示で、単体・全体・ためを見分けましょう。防御や回復も大切な1回の行動です。')+p('通常戦・ボス戦・特別チャレンジのすべてでオートを使えます。「AUTO」で開始、「停止」で手動へ戻れます。自動で進む方法と、タップで1手ずつ進む方法があります。特別チャレンジは決められた課題も必要です。オートで必ず勝てるわけではありません。メニュー・解説・会話を開いている間や、ゲーム画面が隠れている間は次の行動を待ちます。')+p('ガードは受けるダメージを減らし、MPも1戻します。休息はMPを4＋装備などの休息ボーナス分戻します。防護は敵の攻撃を軽くしますが、敵の行動後に消えます。'),'オート 自動 手動 進行コメント 戦闘結果');
 add('links','battle','エール・コメント連携・キラコメの使い分け',renderBattleSupportHelp(),'連携技 挨拶 作戦 感謝 エール40 エール80 ファミリー応援 メーター突破');
 add('twoPeople','battle','2人編成でも戦える？ キラコメは？',p('主人公とヒロインの2人だけでも戦えます。地域ボスは、戦闘を始めた人数に合わせてHPや攻撃を調整します。')+p('キラコメは別の3人が必要なので2人では完成できません。2人でもエール、コメント連携、ファミリー応援、メーター突破は使えます。人数が少ない時は、回復と攻撃の役割を二人で分け、引き継いだ技も活用しましょう。'),'2人 3人 少人数');
 add('boss','battle','ボスの盾・ため攻撃・長期戦',p('身の守り・防具・防護でダメージを減らします。建築士の耐震設計は、一つの全体攻撃が始まった時に働いていれば、その攻撃の全員に効きます。建築士が倒れた後の、別の敵の攻撃には効きません。痛恨は防御と防護を無視しますが、ガードによる半減は残ります。')+p('ボスのノイズシールドは通常攻撃を35％減らします。エール40以上かキラコメ完成で解除でき、職業技は最初からこの軽減を受けません。')+p('ための予告で求められた行動を、別の2人で行うと、直後の強攻撃を20％軽減しエール＋12。求められるのはガード・応援コメント・攻撃などで、戦闘画面に表示されます。')+p('6ターン目以降は3ターンごとにボスの攻撃＋10％、最大＋50％。ボスのHPが40％以下になると怒りで攻撃がさらに25％増えます。回復だけを続けず、強い技で攻める時間も作りましょう。'),'対処 シールド 怒り');
 add('combo','battle','技の組み合わせ例：準備してから強く攻める',p('例1：システムエンジニアの「コメント整理」などでエールと連携を用意→トラック運転手の「巡回ストライク」などの単体攻撃で連携を使う。')+p('例2：建築士の全体防護→看護師の回復で立て直す→攻撃役が防御無視の技で攻める。例3：調理師のMP補給→ライバーや専業主婦の回復を続ける。')+p('転職で覚えた技を持ち寄ると、同じキャラでも役割を増やせます。再使用待ちのある技は連発できません。技の条件・消費MPを調べて、異なる技を順番に使いましょう。'),'連携技 コンボ 回復役 攻撃役');
 add('skillRules','skills','技の読み方：習得条件・MP・再使用待ち',p('職業技の課題は、現在職の基本技・追加の職業技・前職から覚えた職業技で進みます。超レア装備の固有技とキャラ固有の必殺技は、その回数に入りません。回復や防護などが何も増えず、減らした自分のMPを戻すだけの技は使いません。無効な行動ではMPも道具も減りません。')+p('「Lv」は本人のレベル、「熟練度」はその技の職業の熟練度です。両方の条件があれば、両方を満たします。「再使用待ち3ターン」は、使った後の3ターンは同じ技を使えず、その次のターンから使えます。')+p('超レア装備の固有技は、その装備を着けている本人だけが使えます。外す・別の品へ替える・装備条件を満たさなくなると使えません。持っているだけ、預かり所に置く、一度装備しただけでは使えません。別の仲間へ渡すと、装備した仲間だけが使えます。普通の職業技や人物固有の必殺技は、この装備ルールの対象ではありません。')+p('「単体」は1人または1体、「全体」は生きている対象全員。「防御無視」は敵の防御力を引かずに攻撃することです。小数点の切り捨ては端数を捨て、切り上げは次の整数にします。'),'用語 小学生 クールダウン');
 add('rareRules','rare','章限定の超レア：どこで、何％で落ちる？',p('各章に武器・防具・アクセサリーの3品があります。'+SYSTEM_CHAPTERS.length+'章で'+SYSTEM_CHAPTERS.reduce((n,c)=>n+c.ultra.length,0)+'品。どれも、その章と地域特別エリアの店売り最上位品を上回る性能です。全職業で装備できますが、本人のレベル条件は必要です。')+p('通常戦闘は勝利1回ごとに1/'+CHAPTER_DROP_RULES.field+'（0.5％）、ボスは1/'+CHAPTER_DROP_RULES.boss+'（2.5％）で超レアに当たり、その章の3品から同じ確率で1品を選びます。敵1体ごとの抽選ではありません。特別チャレンジは対象外です。')+p('何回戦っても必ず出る保証はありません。ボス再戦でも抽選されます。次の章の品が前の章で落ちることはありません。章限定超レアは、ふつうの共通装備より強い特別な例外です。'),'隠し要素 ドロップ 確率 0.5 2.5');
 add('rareOther','gear','レアドロップの決まり（超レアとは別）',p('通常敵は1体ごとにレア抽選があります。敵の星が5以上は1/5、星4は1/12、星3は1/40、ほかは1/150。抽選に当たると30％でレア装備、70％でレア道具を選びます。敵の強度で第1～3段階が決まります。')+p('ボスの初回撃破ではレア装備を1品、再戦では1/3でレア装備を抽選。レア道具も別に1/2で抽選します。追加装備1000品の抽選や章限定超レアとは別です。')+p('追加装備はショップ・通常敵・ボス・街の装備依頼に分かれています。図鑑や下の装備記事で入手先を確認しましょう。ふつうの共通装備は、職業専用品より性能を控えめにしています。'),'レアドロップ品 隠し要素 星 装備1000種類');
 add('bags','gear','持ち物がいっぱいになったら？',p('道具袋は'+BAG_KINDS+'種類まで、同じ道具は'+BAG_STACK+'個まで。装備品の持ち物は'+EQ_KINDS+'種類まで、同じ装備は最大8個。入りきらない報酬は預かり所へ送られ、預かり所も満杯だと受け取れない場合があります。空きを作ってから挑みましょう。')+p('特別イベント品は別の袋で'+EVENT_ITEM_LIMIT+'種類まで。同じ品は1個。資料→謎解き→準備品の受け渡しというように、使う場所が「特別イベント品」と「事件・謎解き帳」に表示されます。普段の道具袋は圧迫しません。'),'200種類 持ち物分類 預かり所 特別イベント品');
 add('side','special','特別エリア・チャレンジ・サブストーリーの違い',p('地域特別エリアは、各章をクリアすると出る寄り道です。その地域の章の上限近くまで育て、強い装備と技をそろえる高難易度です。本編の次の章へ行くための必須条件ではありません。')+p('特別チャレンジは、敵を倒すだけでなく「決められたターン内」「コメントを何回」などの条件も満たす腕試し。参加料が必要で、オートも使えます。課題は自動達成されないので、必要なら停止して行動を選びましょう。報酬・経験値・熟練度は初回達成だけです。')+p('任意サブストーリーは、クイズや状況判断で解く寄り道です。未解決でも本編を進められます。街の交流祭や撮影会を終えても、本編や別の事件が自動で終わることはありません。本編の準備品が必要な依頼は、事件帳に「本編の準備」と表示されます。準備品を渡した時は、ボスや本番へ挑むための準備が完了した合図です。ここでは問題の答えや物語の内容は載せません。'),'任意 未クリア 解放 隠しエリア サブイベント');
 for(const c of SYSTEM_CHAPTERS.filter(c=>c.special))add('regional-'+c.id,'special',HUBS[c.special].name+'：地域特別エリア',p('解放：'+esc(c.name)+'をクリア。育成目安はLv'+c.cap+'前後＋強い装備＋熟練技。次の章へ進むための必須条件ではありません。ボス戦もオートを使えます。')+p('「特別エリア・未クリア案内」で未達成を確認できます。超レア抽選は'+esc(c.name)+'の3品。まだ出会っていない人物や事件、結末の説明はここに載せません。'),c.special+' 特別エリア '+c.name);
 for(const a of SPECIAL_STAGES)add('stage-'+a.id,'special',(HUBS[a.id]?.name||a.name||a.id)+'：特設エリア',p('入口の条件：九州本編をクリア、解放上限Lv'+a.level+'以上、パーティLv'+Math.max(100,a.level-40)+'以上'+(a.index?'、前の特設エリアのボス撃破':'')+'。ボスと追加チャレンジの腕試しがある育成用エリアです。入口は「特設エリア・Lv999への道」。超レア抽選は'+esc(systemChapterForHub(a.id).name)+'の3品です。')+p('エリアボスもオートを使えます。対応チャレンジは、先にそのエリアのボスを倒し、パーティLv'+(a.level-20)+'以上などの参加条件を満たします。'),a.id+' Lv'+a.level);
 for(const d of POCO_TRIALS)add('trial-'+d.id,'special',d.name+'：チャレンジの条件',p('目安Lv'+d.level+'／参加料'+d.fee+'G。'+esc(trialRequirements(d)))+p('解放は本編依頼'+d.unlock+'の完了'+(d.specialStage!=null?'、該当の特設ボス撃破、上限Lv'+d.level+'以上、パーティLv'+(d.level-20)+'以上':'')+'など。街の安全地帯から挑戦します。戦闘・配信・会話中は始められません。報酬は初回条件達成時のみ。'),d.id+' 特別チャレンジ');
 add('facilities','travel','街の施設：買い物・宿屋・ファミリー・駅',p('ギア店で装備、道具売場で回復品を買えます。宿屋は所持金を払い、控えを含む仲間のHP・MPを回復して翌日に進みます。「日付を進める」だけではHP・MPは回復しません。')+p('ファミリー施設では同行者の入れ替え、仲間の物語、活動予定、装備依頼、倒したボスへの再戦などができます。活動予定では準備費・初回成功報酬・差引額を確認してから開始します。序盤は成功してもGが減る場合があり、失敗時の準備費は戻りません。駅では解放済みの街へ広域交通で移動できます。街の施設の種類や受けられる催しは、街ごとに変わります。'),'ショップ 新幹線 施設 入替');
 add('travel','travel','駅・新幹線の運賃と移動',p('まだ解放していない街には行けません。駅から選ぶと、路線距離が長いほど運賃が上がります。移動には運賃が必要です。金額を確認してから乗車できます。')+p('ゲーム内の路線距離は、街の代表点どうしの直線距離×1.25を切り上げた値。運賃は20＋路線距離です。島などへの移動も含むゲーム独自の広域交通で、現実の運賃や新幹線の駅とは違います。全国地図メニューからの移動には、駅の運賃はかかりません。'),'距離 ゴールド 瞬間移動 日本地図');
 add('stream','start','ライブ配信に不合格だったら？',p('依頼で必要な敵の討伐やボス戦などを終えた後、配信へ進みます。配信中の採点の数字は表示しません。')+p('不合格になると、そのまま連続してやり直せません。表示された再挑戦の条件を確認して、街での会話・戦闘など必要な準備をやり直してから挑みます。選択肢の答えや点数の一覧は、この解説には載せません。'),'不合格 再挑戦 配点 配信失敗');
 add('save','save','セーブとバックアップ：記録を守ろう',p('操作や戦闘の区切りで自動保存します。設定の「保存」の表示を確認してください。公開版の記録は遊んだ人のブラウザに残ります。別のスマホや別のブラウザには自動では移りません。')+p('設定の「バックアップを表示」で文字列を控え、別の端末の「記録の復元」に貼り付けると移せます。ブラウザの閲覧データを消す前に控えましょう。二つのタブで同時に遊ぶと、一方は閲覧だけになります。')+p('2026年10月23日の全ユーザー初期化より前の記録は復元できません。初期化後に始めた現在の記録は、今回の更新でも引き継ぎます。主人公やヒロインを控えにしていた旧編成は、二人が同行する編成へ直します。'),'保存できない セーブできない 復元 リセット');
 add('helpUpdates','save','この解説もゲームと一緒に更新します',p('説明の版は公開版v'+GAME_VERSION+'です。職業・技・装備・章ごとの目安は、実際のゲームデータから記事を作っています。技や装備が増えたら一覧にも反映されます。')+p('新しい仕組みを追加・変更するときは、その使い方、解放条件、数の決まり、注意点をこの解説に追記してから公開します。物語のあらすじ・人物の秘密・結末・クイズの正解は扱いません。'),'アップデート 新機能 更新');
 add('mobileMap','start','スマホの地図：大きく見る・止まる・メニュー',p('MAP上の全国・街へ戻る・拡大縮小ボタンは表示しません。全国地図はメニューから、街の入口へは道しるべから案内できます。ふつうは1マス32pxで表示します。画面がとても狭い時は、入る大きさへ調整します。地面を短くタップすると、その場所へ歩きます。指をずらした時や長く押した時は移動しません。歩いている時に地図をタップすると止まります。')+p('上の街の名前と目的をタップすると、長い目的・保存の状況を全部読めます。「メニュー」から装備・編成・全国地図などを開けます。特別エリアの未クリア件数は、地図の右上から確認できます。'),'スマホ MAP 拡大 縮小 誤操作');
 add('mobileBattle','battle','スマホの戦闘画面：戦況と行動選択',p('戦況とは、敵や仲間の今の状態です。いつもの画面でHP・MP・敵の次の攻撃・エール・進行コメントを確認します。行動できる仲間か「行動を選ぶ」を押すと、行動選択へ進みます。選ぶだけではMPや行動回数は減りません。最後に「確定」を押すと実行します。')+p('勝利すると報酬画面へ進みます。普段は経験値・ゴールド・入手した品・大切な通知を表示します。レベルが上がった仲間だけ「成長」に最大HP・最大MP・攻撃力・防御力と5つの基礎能力の変更前・変更後・増加量を表示します。熟練度アップも知らせます。「詳細」で全員のHP・MP・JPや課題・倒した敵・進行コメントを確認でき、「簡略」で戻れます。長い内容はスクロールせず前後のページで読みます。')+p('小さい画面でも、文字やボタンをまとめて縮小しません。とても低い画面では「敵⇄味方」で表示を切り替えます。必要なら同じボタンで次の敵・仲間へ進み、全員を確認できます。敵や行動済みの仲間を押すと、その人の詳細が開きます。'),'スマホ レイアウト 戦況 スクロール');
 add('mobileChoices','skills','技がたくさんある時の選び方',p('「技・必殺技」を選ぶと、技の一覧が開きます。名前や効果の検索と、攻撃・回復・防護・必殺などの種類で探せます。前後のページで、今使える職業技・必殺技・装備の固有技を見られます。MP不足や再使用待ちは表示されます。')+p('技を選ぶと一覧が閉じ、使う相手を選ぶ画面へ戻ります。技のページ送りと相手選びは別です。とても狭い画面では、相手やコメントは選択欄を押して選びます。予測を押すと効果を詳しく読めます。戻るボタンで一覧→行動選択→戦況の順に戻れます。'),'検索 技 道具 対象選択 ページ送り');
 add('mobileControls','save','スマホの操作・進行コメント・画面回転',p('決定操作はスティック中心の短いタップに集約しています。独立した丸ボタンは「戻」です。中心を長く押す・ドラッグする・途中で指の入力が取り消される時は、決定しません。アプリを切り替えた後に移動入力が残らないよう停止します。')+p('進行コメントは矢印で前後を読めます。本文を押すと全文の確認画面へ進みます。画面の向きを変えた時は、選択中の技や入力中の検索文字を保ちながら組み直します。設定でBGMと効果音を個別に0・35・65・100％へ調整できます。消音は両方を止めます。演出を減らす設定では背景・人物・移動先の点滅を止めます。画面がとても低い時やキーボードを開いた時は、操作パネルを一時的に隠して本文を優先します。'),'画面回転 横画面 ジョイスティック キーボード');
 add('jobEvents','growth','ハローワーク：職業イベントと転職',p('街の地図の「職」がハローワークです。道しるべから歩いて行けます。職業イベントは22職に1件ずつあり、各3段階の状況判断を進めます。違う選択は助言を読んでやり直せます。途中で閉じても記録され、別の街のハローワークで続けられます。')+p('1件クリアすると、その職業が仲間全員の転職先に追加されます。イベントと転職は無料で、経験値やゴールドの繰り返し報酬はありません。今の職業は続けられますが、別の職業へ移る時は専用イベントをクリアしてください。前に使っていた職業も、転職先に選ぶにはイベントのクリアが必要です。')+p('職業ごとの記事にイベント名と、その職業の能力・技を載せています。'),'ジョブ 解放 解禁 転職 職業イベント ハローワーク');
 for(const job of JOB_IDS){const j=JOBS[job],mp=JOB_MP[job];add('job-'+job,'jobs',j.name+'：職業の使い方',p('転職解放：ハローワークの専用イベント「'+esc(JOB_EVENT_DATA[job][0])+'」をクリア。'+esc(JOB_EVENT_DATA[job][1]))+p(esc(j.field)+'。基本技「'+esc(j.skill)+'」／MP'+j.cost+'。')+p(esc(j.desc(Kof(1)))+'（熟練度1の例）')+p('職業特性「'+esc(JOB_TRAITS[job].name)+'」：'+esc(JOB_TRAITS[job].desc))+p('最大MPの土台：初期'+mp[0]+'＋切り捨て((本人Lv－1)×'+mp[1]+')。さらに熟練度・装備を加算。永続ボーナス：熟練度999なら'+esc(jobBonusDescription(job))+'。')+p('技を覚える目安：'+Object.values(EXTRA_SKILLS).filter(sk=>sk.job===job&&!sk.baseJob).map(sk=>esc(sk.name)+'＝Lv'+sk.level+(sk.rank?'・熟練度'+sk.rank:'')).join('／')),job+' 固有技 職業専用 '+j.skill);}
 for(const sk of Object.values(EXTRA_SKILLS)){const job=sk.job&&JOBS[sk.job],source=sk.ultra?Object.values(ULTRA_GEAR).find(it=>it.skill===sk.id):null;add('skill-'+sk.id,'skills',sk.name, p((job?esc(job.name)+'の技。':'')+(sk.character?'人物固有の必殺技。職業は問いません。':'')+'習得・使用条件：本人Lv'+sk.level+(sk.rank?'以上、元職の熟練度'+sk.rank+'以上':'以上')+(sk.character?'、その人物の絆エピソード第1話':'')+(source?'、'+esc(source.name)+'を装備中のみ使用可能':'')+'。')+p('消費MP：'+(sk.ultimate?'最大MPの25％（最低8）＋エール35':sk.cost)+'。再使用待ち：'+(sk.ultimate?'1人1戦1回・3ターン目以降':sk.cooldown+'ターン')+'。')+guideTechDetail(sk),sk.id+' '+(job?.name||'')+' 熟練度'+(sk.rank||1)+' Lv'+sk.level+' '+(sk.ultra?'超レア装備':'職業固有技'));}
 for(const [id,it]of Object.entries(EQUIP)){const source=guideGearSource(id,it);add('gear-'+id,it.chapterUltra?'rare':'gear',it.name,p(EQ_SLOT_NAME[it.slot]+'／'+(it.job?esc(JOBS[it.job].name)+'専用・熟練度'+it.needR+'以上':'全職業共通')+'／本人Lv'+(it.needL||1)+'以上。')+p(esc(gearStatsText(it))||'追加能力なし。')+p(esc(source))+(it.ultra?p('装備中のみ使用可能：'+esc(it.tech)+'（MP'+it.cost+'／再使用待ち3ターン）。技の名前でも検索できます。'):''),id+' '+(it.job?JOBS[it.job].name:'共有装備 共通装備')+' '+(it.ultra?'超レア':'')+' '+source);}
 for(const [id,it]of Object.entries(ITEMS))add('item-'+id,'gear',it.name,p('分類：'+esc(it.cat)+'／対象：'+esc(it.target)+'。'+esc(itemText(it,1)))+p('上の数値は成長係数1の例です。レベルで変わる回復量は、使用画面で実際の値を確認できます。'+(it.job?esc(jobItemRequirement(it))+'。今の職業と熟練度で判定します。':'')),id+' 道具 専用アイテム '+(it.job?JOBS[it.job].name:''));
 return SYSTEM_GUIDE_CACHE=out;
}
function systemGuideResults(data={}){const cat=SYSTEM_GUIDE_CATEGORIES[data.cat]?data.cat:'all',q=guideSearchText(data.q||'').slice(0,100),words=q.split(' ').filter(Boolean),items=systemGuideEntries().filter(e=>(cat==='all'||e.cat===cat)&&words.every(w=>e.search.includes(w))),pages=Math.max(1,Math.ceil(items.length/SYSTEM_GUIDE_PAGE_SIZE)),page=Math.max(0,Math.min(pages-1,Math.trunc(Number(data.page)||0)));return {cat,q,items,pages,page,visible:items.slice(page*SYSTEM_GUIDE_PAGE_SIZE,(page+1)*SYSTEM_GUIDE_PAGE_SIZE)};}
function renderSystemGuide(){const r=systemGuideResults(G.sheetData);return '<p>ことばや名前を入れて調べられます。たとえば「MP」「超レア」「ライバー」「熟練度30」。物語のあらすじや結末は載せません。「戻る」で直前の分類・検索・ページへ戻れます。<span class="tag">公開版v'+GAME_VERSION+'</span></p><form id="systemGuideSearch" class="guide-search"><label for="systemQuery">調べたいこと</label><div class="row2"><input id="systemQuery" name="query" type="search" maxlength="100" value="'+esc(G.sheetData.q||'')+'" placeholder="MP、技の名前、装備の名前など"><button class="btn primary" type="button" data-a="guideSearch">検索する</button></div></form><nav class="guide-categories" aria-label="解説の分類">'+Object.entries(SYSTEM_GUIDE_CATEGORIES).map(([k,n])=>'<button class="btn '+(r.cat===k?'on':'')+'" data-a="guideCategory" data-v="'+k+'" '+(r.cat===k?'aria-current="true"':'')+'>'+n+'</button>').join('')+'</nav><p role="status">'+r.items.length+'件／'+(r.page+1)+'・'+r.pages+'ページ</p>'+(!r.items.length?'<p>見つかりませんでした。短いことばや、ひらがな・漢字の別の書き方でも調べてみましょう。分類を「すべて」にすると広く探せます。</p>':'')+'<div class="stack">'+r.visible.map(e=>'<article class="setcard guide-article"><span class="tag">'+SYSTEM_GUIDE_CATEGORIES[e.cat]+'</span><h3 class="label">'+esc(e.title)+'</h3>'+e.body+'</article>').join('')+'</div><nav class="row2" aria-label="解説のページ"><button class="btn" data-a="guidePage" data-v="'+(r.page-1)+'" '+(r.page<=0?'disabled':'')+'>◀ 前の12件</button><button class="btn" data-a="guidePage" data-v="'+(r.page+1)+'" '+(r.page>=r.pages-1?'disabled':'')+'>次の12件 ▶</button></nav>';}
/* 画面履歴は表示だけを記録する。セーブ状態や行動結果は巻き戻さない。 */
const SHEET_NAV={frames:[],state:null,context:'',active:null,pending:null,limit:80};
function sheetNavContext(){return [G.screen,G.st?.mapId||'',G.st?.run?.seq||''].join('|');}
function resetSheetNavigation(){SHEET_NAV.frames=[];SHEET_NAV.pending=null;SHEET_NAV.state=G.st;SHEET_NAV.context=sheetNavContext();SHEET_NAV.active=G.sheet;}
function checkSheetNavigation(){if(SHEET_NAV.state!==G.st||SHEET_NAV.context!==sheetNavContext()||SHEET_NAV.active!==G.sheet||!G.sheet&&SHEET_NAV.frames.length)resetSheetNavigation();}
function sheetDataKey(data){const clean=v=>Array.isArray(v)?v.map(clean):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!=null&&v[k]!==''&&v[k]!==false&&v[k]!==0&&!['notice','eqKey'].includes(k)&&(k!=='qty'||v.item)).map(k=>[k,clean(v[k])])):v;return JSON.stringify(clean(data||{}));}
function captureSheetFrame(){
 const sh=$('.sheet'),active=document.activeElement,drafts={};
 for(const id of ['systemQuery','helloWorkSearch','renameInput','restoreIn','manageQuery','manageFilter','managePerson']){const el=document.getElementById(id);if(el&&sh?.contains(el))drafts[id]={value:el.value,start:el.selectionStart,end:el.selectionEnd};}
 const focused=active&&sh?.contains(active)?{id:active.id||'',data:{...active.dataset}}:null;
 return {sheet:G.sheet,data:clone(G.sheetData||{}),dlg:G.dlg,scroll:sh?.scrollTop||0,cursor:G.cursorSig,focused,drafts,eqSort:G.eqSort,itSort:G.itSort};
}
function pushSheetFrame(frame){SHEET_NAV.frames.push(frame);if(SHEET_NAV.frames.length>SHEET_NAV.limit)SHEET_NAV.frames.shift();}
function restoreSheetFrame(frame){G.sheet=frame.sheet;G.sheetData=clone(frame.data);G.dlg=frame.dlg;G.cursorSig=frame.cursor;G.eqSort=frame.eqSort;G.itSort=frame.itSort;SHEET_NAV.active=G.sheet;SHEET_NAV.pending=frame;render();}
function restoreSheetPosition(){
 const frame=SHEET_NAV.pending;if(!frame)return;SHEET_NAV.pending=null;
 const sh=$('.sheet');
 for(const [id,d]of Object.entries(frame.drafts)){const el=document.getElementById(id);if(!el||!sh?.contains(el))continue;el.value=d.value;if(Number.isInteger(d.start)&&typeof el.setSelectionRange==='function')try{el.setSelectionRange(d.start,d.end);}catch(e){}}
 let el=frame.focused?.id?document.getElementById(frame.focused.id):null;
 if(!el&&frame.focused&&sh)el=[...sh.querySelectorAll('[data-a]')].find(e=>JSON.stringify({...e.dataset})===JSON.stringify(frame.focused.data));
 if(frame.dlg)el=document.getElementById('dlgNext');
 if(el&&!el.disabled)try{el.focus({preventScroll:true});}catch(e){}
 if(sh)sh.scrollTop=frame.scroll;
}
function findSheetAncestor(k,data,allowParent=false){const key=sheetDataKey(data);for(let i=SHEET_NAV.frames.length-1;i>=0;i--){const f=SHEET_NAV.frames[i];if(f.sheet===k&&(allowParent&&key==='{}'||sheetDataKey(f.data)===key))return i;}return -1;}
function openSystemGuide(){if(G.sheet==='systemGuide')return;openSheet('systemGuide',{cat:'start',q:'',page:0},{suspendDialog:true});}
function openSheet(k,data={},options={}){
 if(k==='regionalGuide'){const pref=data.regionalPref;k='collection';data={ctab:'local',cpref:pref==='KY17'?'大牟田市':REGIONAL_BY_PREF[pref]?.pref||'all'};}
 checkSheetNavigation();
 if(G.sheet===k&&sheetDataKey(G.sheetData)===sheetDataKey(data))return;
 const ancestor=sheetDataKey(data)==='{}'?findSheetAncestor(k,data,true):-1;
 if(ancestor>=0){const frame=SHEET_NAV.frames[ancestor];SHEET_NAV.frames.length=ancestor;restoreSheetFrame(frame);return;}
 pushSheetFrame(captureSheetFrame());G.sheet=k;G.sheetData=clone(data);if(options.suspendDialog)G.dlg=null;G.walk.path=[];SHEET_NAV.active=k;SHEET_NAV.pending=null;G.cursorSig=null;render();const el=$('.sheet');if(el)el.scrollTop=0;
}
function backSheet(fallback=null){checkSheetNavigation();let prev=SHEET_NAV.frames.pop();while(prev&&prev.sheet===G.sheet&&prev.dlg===G.dlg&&sheetDataKey(prev.data)===sheetDataKey(G.sheetData))prev=SHEET_NAV.frames.pop();if(prev){restoreSheetFrame(prev);return;}G.sheet=fallback;G.sheetData={};SHEET_NAV.active=G.sheet;G.cursorSig=null;render();}
function returnToPlay(){
 if(G.sheet==='rename'&&!G.readOnly){finishRename();return;}
 checkSheetNavigation();const origin=SHEET_NAV.frames.find(f=>!f.sheet),dlg=origin?origin.dlg:G.dlg;
 G.sheet=null;G.sheetData={};G.dlg=dlg;G.cursorSig=null;resetSheetNavigation();render();
}
function sheetHasParent(){checkSheetNavigation();return SHEET_NAV.frames.some(f=>f.sheet);}
function closeSheet(){if(G.sheet==='rename'&&!G.readOnly){finishRename();return;}if(['mobileMenu','mobileBattleMenu'].includes(G.sheet)||!sheetHasParent())return returnToPlay();backSheet();}
/* 同じメニュー内の分類・検索・詳細も「1つ前」に含める。購入や転職などの実行は記録しない。 */
function recordSheetAction(name,action){return function(...args){
 checkSheetNavigation();const before=captureSheetFrame(),key=sheetDataKey(before.data),result=action.apply(this,args),d=G.sheetData;
 if(G.sheet&&G.sheet===before.sheet&&key!==sheetDataKey(d)){
  const parent=['itemDropNo','eqDropNo'].includes(name)||name==='itemView'&&!d.item||name==='shopItem'&&!d.item||name==='questDetail'&&!d.questFocus||name==='partyView'&&!d.view&&(!d.cid||d.cid===before.data.cid)||name==='equipView'&&!d.slot&&!d.stock&&(!d.cid||d.cid===before.data.cid)||name==='dexNav'&&!d.detail&&!!before.data.detail;
  const i=parent?findSheetAncestor(G.sheet,d):-1;
  if(i>=0){const frame=SHEET_NAV.frames[i];SHEET_NAV.frames.length=i;restoreSheetFrame(frame);}else{pushSheetFrame(before);const sh=$('.sheet');if(sh&&!['collectionPage','collectionJump','collectionSearch','collectionLocate'].includes(name))sh.scrollTop=0;}
 }
 return result;
};}
function sheetWrap(title, body){ return `<div class="overlay" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="win sheet"><div class="sheet-head"><h2 class="label">${esc(title)}</h2>${systemHelpButton("sheet")}${sheetHasParent()&&!["rename","mobileMenu","mobileBattleMenu"].includes(G.sheet)?`<button class="btn" data-a="returnToPlay">${G.screen==="battle"?"戦闘へ":G.screen==="explore"?"マップへ":"元の画面へ"}</button>`:""}<button class="btn" data-a="${G.sheet==='rename'?'renameSave':'closeSheet'}">${G.sheet==="rename"?"名前を確定":sheetHasParent()&&!["mobileMenu","mobileBattleMenu"].includes(G.sheet)?"戻る":G.screen==="battle"?"戦闘へ":G.screen==="explore"?"マップへ":"戻る"}</button></div>${body}</div></div>`; }
function renderSheet(){
  const k=G.sheet; if(!k) return ""; const st=G.st; const d=G.sheetData;
  switch(k){
    case "systemGuide": return sheetWrap("ゲームシステム解説",renderSystemGuide());
    case "mobileMenu":return sheetWrap("メニュー",renderMobileMenu());
    case "mobileMapInfo":return sheetWrap("場所・目的・操作",renderMobileMapInfo());
    case "mobileBattleMenu":return sheetWrap("戦闘メニュー",renderMobileBattleMenu());
    case "about": return sheetWrap("この作品について",`<p>最大4人で戦う、ターン制バトルの昭和風ドットRPGです。</p>`);
    case "townEvent": {const t=townChange(st,curHub());return sheetWrap(t.title,`<p>${esc(t.text)}</p><p>住民の声を、どんな形で街に残しますか？ 選択は保存され、街の様子が変わります。</p><div class="stack"><button class="btn" data-a="townResolve" data-v="quiet">声を録って展示を作る</button><button class="btn" data-a="townResolve" data-v="live">住民の交流会を開く</button></div>`);}
    case "settings": return sheetWrap("設定・保存", renderSettings());
    case "share": return sheetWrap("友だちに教える", renderShare());
    case "nearby": { const near=nearbyObjects(); return sheetWrap("近くを調べる", near.length? `<div class="stack">${near.map(o=>`<button class="btn" data-a="interactId" data-v="${o.id}">${facBadge(o)}${esc(o.label)}</button>`).join("")}</div>` : `<p>近くに調べられるものはありません。道しるべから目的地を選べます。</p>`); }
    case "worldRoutes":return sheetWrap("県・街・ボス入口の方向案内",renderWorldRoutes());
    case "guide": { const m=MAPS[st.mapId]; return sheetWrap("道しるべ", `<p class="small">選ぶと、その場所まで実際に歩きます（途中の遭遇エリアでは抽選があります）。挑戦目安は低めの攻略目安、適正は育成・装備・熟練技を含む推奨です。通常エリアに入場レベル制限はありません。特設エリアには専用の解放条件があります。</p><div class="stack">${mapGuideObjects().map(o=>{ const a=o.area?AREAS[o.area]:null; return `<button class="btn" data-a="guideTo" data-v="${o.id}">${facBadge(o)}${esc(o.label)}${a?`（挑戦目安Lv${requiredAreaLevel(a)}・適正Lv${recommendedAreaLevel(a)}）`:""}</button>`; }).join("")}</div>`); }
    case "quests": return sheetWrap("イベント・依頼リスト", renderQuests());
    case "station": return sheetWrap("新幹線・街から街への移動", renderStation());
    case "railConfirm": {const fare=railFare(curHub(),d.to);return sheetWrap("乗車の確認",`<p>${esc(HUBS[curHub()].name)} → ${esc(HUBS[d.to].name)}</p><p>路線距離${railDistance(curHub(),d.to)}／運賃<b>${fare}ゴールド</b></p><p>所持金 ${st.gold} → ${st.gold-fare}ゴールド</p><div class="stack"><button class="btn primary" data-a="railBoard" data-v="${d.to}" ${st.gold<fare?"disabled":""}>運賃を払って移動する</button><button class="btn" data-a="openSheet" data-k="station">駅に戻る</button></div>`);}
    case "questAbandon": return sheetWrap("依頼の放棄を確認",`<p>「${esc(QUESTS[d.id].name)}」を放棄しますか？ 討伐数はリセットされます。</p><div class="stack"><button class="btn" data-a="abandonQuest" data-v="${d.id}">放棄する</button><button class="btn primary" data-a="openSheet" data-k="quests">続ける</button></div>`);
    case "map": return sheetWrap("全国ツアー・地図", renderWorld());
    case "travel": return sheetWrap("移動", `<p>${esc(HUBS[d.to].name)}へ向かいますか？</p><div class="stack"><button class="btn primary" data-a="doTravel">向かう</button><button class="btn" data-a="closeSheet">やめる</button></div>`);
    case "rest": return sheetWrap("休息", `${d.reason?`<p class="warn">${esc(d.reason)}</p>`:""}<p>費用なしで翌日に進めます。HPとMPは回復しません。回復は宿屋で。今は${st.day}日目です。</p><div class="stack"><button class="btn primary" data-a="doRest">日付を進める</button><button class="btn" data-a="closeSheet">やめる</button></div>`);
    case "party": return sheetWrap("編成", renderParty());
    case "helloWork": return sheetWrap("ハローワーク・職業イベントと転職",renderHelloWork());
    case "characterStories": return sheetWrap("仲間の物語・絆と約束",renderCharacterStories());
    case "rename": return sheetWrap("名前の変更",renderRename());
    case "challenges": return sheetWrap("特別チャレンジ",renderChallenges());
    case "nationalSpecial": {const c=NATIONAL_SPECIALS.find(c=>c.id===d.id);return sheetWrap("地域特別エリア",`<p>${esc(c.name)}／適正Lv${c.level}</p><p>${esc(c.theme)}。${c.unlock}クリアで解放。本編の次地域へ進む必須条件ではありません。</p><button class="btn" data-a="worldGo" data-v="${c.id}" ${hubTravelReason(st,c.id)?'disabled':''}>向かう</button><button class="btn" data-a="openSheet" data-k="specialTracker">進行一覧へ</button>`);}
    case "storyJournal": return sheetWrap("事件・謎解き帳",renderStoryJournal());
    case "eventItems": return sheetWrap("特別イベント品",renderEventItems());
    case "nextChapter": return sheetWrap("全国ツアーの進行",renderNextChapter());
    case "japanMap": return sheetWrap("日本地図と拠点の位置",renderJapanMap());
    case "relationships": return sheetWrap("人物相関図",renderRelationships());
    case "careerTour": return sheetWrap("活動予定と全国の経験",renderCareerTour());
    case "groupProfile": return sheetWrap("おやすみセカイの詳細",renderGroupProfile());
    case "specialTracker": return sheetWrap("特別エリア・未クリア案内",renderSpecialTracker());
    case "omutaGuide": return sheetWrap("大牟田市編・進め方",renderOmutaGuide());
    case "specialWorld": return sheetWrap("特設エリア・Lv999への道",renderSpecialWorld());
    case "specialBoss": return sheetWrap("特設ボス",renderSpecialBoss());
    case "gearCatalog": return sheetWrap("追加装備図鑑",renderGearCatalog());
    case "gearEvents": return sheetWrap("街の装備依頼",renderGearEvents());
    case "gearRematches": return sheetWrap("ボス再戦受付",renderGearRematches());
    case "townStudio": return sheetWrap("ファミリー交流所",renderTownStudio());
    case "status": return sheetWrap("パーティーのステータス", renderStatus());
    case "inn": { const hub=curHub(); const per=INN_PRICE[hub]||10; const n=st.roster.length; const total=per*n; const can=st.gold>=total;
      return sheetWrap(d.label||"宿屋", `<p>「いらっしゃいませ。お一人さま${per}ゴールド、${n}人で${total}ゴールドです。」</p>
      <p class="small">泊まると翌朝になり、全員のHPとMPが全回復します。所持${st.gold.toLocaleString()}ゴールド → 宿泊後${(st.gold-total).toLocaleString()}ゴールド。</p>
      <ul class="list">${st.roster.map(cid=>{const s=charStats(st,cid,partyLevel(st)),v=vitalOf(cid); return `<li>${esc(charName(st,cid))}：HP ${v.hp}/${s.maxHP}・MP ${v.c}/${s.startC}</li>`;}).join("")}</ul>
      ${can?"":`<p class="warn">ゴールドが足りません（あと${total-st.gold}）。通常敵を倒すとゴールドが手に入ります。</p>`}
      <div class="stack"><button class="btn primary" data-a="doInn" ${can?"":"disabled"}>泊まる（${total}ゴールド）</button><button class="btn" data-a="closeSheet">やめる</button></div>`); }
    case "record": return sheetWrap("記録", renderRecord());
    case "broadcastHistory": return sheetWrap("配信実績",renderBroadcastHistory());
    case "regionalGuide": return sheetWrap("ご当地名物・創作敵",renderRegionalGuide());
    case "items": return sheetWrap("道具", renderItems());
    case "equip": return sheetWrap("装備", renderEquip());
    case "collection": return sheetWrap("図鑑・収集品",renderCollection());
    case "dex": return sheetWrap("図鑑・収集品：敵の詳細", renderDex());
    case "shop": return sheetWrap(SHOPS[d.shop]?.name||"ショップ", renderShop());
    case "moe": return sheetWrap("もえ", renderMoe());
    case "boss": return sheetWrap("地域ボス",renderChapterBoss(BOSSES[d.bid],d.bid));
    case "streamSetup": return sheetWrap("配信の準備", renderStreamSetup());
    case "battleSupportHelp": return sheetWrap("エール応援・キラコメ連携",renderBattleSupportHelp());
    case "battleLog": return sheetWrap("戦闘ログ", `<div class="stack">${((G.st.run&&G.st.run.log)||[]).slice(-6).map(l=>`<p>${esc(l)}</p>`).join("")||"<p>まだありません。</p>"}</div>`);
    case "pause": return sheetWrap("休止中", `<p>戦闘はターン${st.run.turn}の入力待ちで保存されています。再開しても撤退・回復・報酬は発生しません。</p><div class="stack"><button class="btn primary" data-a="closeSheet">再開する</button></div>`);
    case "retreat": return sheetWrap("撤退", `<p>撤退は必ず成功します。この戦闘の報酬は0です。遭遇した位置へ戻ります。</p><div class="stack"><button class="btn primary" data-a="doRetreat">撤退する</button><button class="btn" data-a="closeSheet">戦闘を続ける</button></div>`);
  }
  return "";
}
function setCard(title, now, opts, desc, note){
  return `<div class="setcard"><div class="sethead"><span class="settitle">${title}</span><span class="setnow">現在：<b>${now}</b></span></div>
    <div class="seg seg${opts.length}" role="radiogroup" aria-label="${title}">${opts.map(o=>`<button class="segbtn ${o.on?"on":""}" role="radio" aria-checked="${o.on}" ${o.on?`data-a="noop"`:o.attrs} ${o.disabled?"disabled":""}><span class="segmark" aria-hidden="true">${o.on?"✓":""}</span><span class="seglabel">${o.label}</span>${o.sub?`<span class="segsub">${o.sub}</span>`:""}</button>`).join("")}</div>
    ${desc?`<p class="setdesc">${desc}</p>`:""}${note?`<p class="setnote">${note}</p>`:""}</div>`;
}
function renderSettings(){
  const st=G.st; const s=st?st.settings:G.tmpSettings||(G.tmpSettings={difficulty:"std",sound:soundPref(),reduceMotion:false});
  const busy = st&&st.run;
  const D=DIFFICULTY[s.difficulty]||DIFFICULTY.std;
  const diffDesc={easy:"敵のHP0.8倍・攻撃力0.75倍、戦闘開始時のエール＋20。",std:"配信ギア・回復・職業固有技を使い分ける強さ。",hard:"敵のHP1.2倍・攻撃力1.15倍。"};
  const snd=soundIsOn(), rm=!!s.reduceMotion, dock=s.dock!==false, am=autoMode(), ps=padSide();
  const padPic=side=>side==="right"?`<span class="padpic"><i class="pb">戻</i><i class="psp"></i><i class="pst"></i></span>`:`<span class="padpic"><i class="pst"></i><i class="psp"></i><i class="pb">戻</i></span>`;
  const dot=ok=>`<span class="sdot ${ok?"ok":"ng"}" aria-hidden="true"></span>`;
  const cloudOk=CLOUD.state()==="有効";
  return `<p class="small">タップするとすぐ切り替わり、自動で保存されます。<b>✓</b>と色が付いているのが今の設定です。</p>
    <h3 class="label setgroup">ゲーム</h3>
    ${setCard("難易度", D.name, Object.entries(DIFFICULTY).map(([k,v])=>({label:v.name, on:s.difficulty===k, attrs:`data-a="setOpt" data-k="difficulty" data-v="${k}"`, disabled:busy&&s.difficulty!==k})), diffDesc[s.difficulty]+"報酬・地域の強さ・物語は共通です。", busy?"戦闘中は変更できません（戦闘開始時に固定）。":"")}
    <h3 class="label setgroup">音と画面</h3>
    ${setCard("BGM・効果音", snd?"ON":"OFF（消音）", [{label:"ON",on:snd,attrs:`data-a="toggleSound"`},{label:"OFF",sub:"消音",on:!snd,attrs:`data-a="toggleSound"`}], snd?"音楽と効果音が鳴ります。":"音は鳴りません。文字と画面表示だけで遊べます。")}
    ${[['bgm','BGM音量'],['sfx','効果音音量']].map(([key,label])=>{const value=audioMixSettings()[key];return setCard(label,Math.round(value*100)+'%',[[0,'0%'],[0.35,'35%'],[0.65,'65%'],[1,'100%']].map(([v,l])=>({label:l,on:value===v,attrs:`data-a="audioLevel" data-k="${key}" data-v="${v}"`})),key==='bgm'?'旋律と伴奏、残響をまとめて調整します。':'決定・攻撃・回復・宝箱などを調整します。');}).join('')}
    ${setCard("演出を減らす", rm?"ON":"OFF", [{label:"OFF",sub:"通常",on:!rm,attrs:`data-a="setOpt" data-k="reduceMotion" data-v="false"`},{label:"ON",sub:"控えめ",on:rm,attrs:`data-a="setOpt" data-k="reduceMotion" data-v="true"`}], rm?"画面の揺れ・点滅・アニメーションを止め、切り替えを速くします。":"被弾時の揺れや点滅などの演出を表示します。")}
    <h3 class="label setgroup">操作</h3>
    ${setCard("戦闘オートの進め方", am==="tap"?"タップで次へ":"自動で次へ", [{label:"自動で次へ",sub:"一定時間で進む",on:am==="timer",attrs:`data-a="autoMode"`},{label:"タップで次へ",sub:"1手ずつ止まる",on:am==="tap",attrs:`data-a="autoMode"`}], am==="tap"?"1手ごとに止まります。メッセージ欄・次へ・スティック中央の決定で進みます。":"約0.65秒ごとに自動で次の行動へ進みます。", "全戦闘で使用できます。ボス戦・特別チャレンジの課題は自動達成されません。戦闘中もオート画面上部で切替できます。")}
    ${setCard("移動の速さ", s.moveSpeed==="fast"?"速い":"ふつう", [{label:"ふつう",sub:"1マス0.16秒",on:s.moveSpeed!=="fast",attrs:`data-a="setOpt" data-k="moveSpeed" data-v="normal"`},{label:"速い",sub:"1マス0.11秒",on:s.moveSpeed==="fast",attrs:`data-a="setOpt" data-k="moveSpeed" data-v="fast"`}], s.moveSpeed==="fast"?"町や草むらをきびきび歩きます。遭遇の確率は同じです。":"標準の歩く速さです。", "スティックを斜めに倒すと、壁に当たった時にもう一方の向きへすべって進みます。")}
    ${setCard("ジョイコントローラー", dock?"表示する":"表示しない", [{label:"表示する",on:dock,attrs:`data-a="setOpt" data-k="dock" data-v="true"`},{label:"表示しない",sub:"タップのみ",on:!dock,attrs:`data-a="setOpt" data-k="dock" data-v="false"`}], dock?"画面下に中央決定付きスティックと「戻」ボタンを出します。ゲームパッド・キーボードも使えます。":"画面下の操作帯を隠し、タップだけで操作します。")}
    ${setCard("スティックの位置", ps==="right"?"右（戻は左）":"左（戻は右）", [{label:"右",sub:padPic("right"),on:ps==="right",attrs:`data-a="setPad" data-v="right"`},{label:"左",sub:padPic("left"),on:ps==="left",attrs:`data-a="setPad" data-v="left"`}], ps==="right"?"スティックを右手、「戻」ボタンを左手で操作します（標準）。":"スティックを左手、「戻」ボタンを右手で操作します。")}
    ${(()=>{ const lm=VFIT.mode; return setCard("画面の下合わせ", lm==="auto"?`自動（${VFIT.value}px）`:`手動（${lm}px）`, [{label:"合わせる",sub:"上下で調整",on:lm!=="auto",attrs:`data-a="calibLift"`},{label:"自動",sub:"推定値を使う",on:lm==="auto",attrs:`data-a="setLift" data-v="auto"`}], "スティックやボタンが画面の下で切れる時は「合わせる」で一度調整してください。この端末に保存され、アプリを更新しても残ります。"); })()}
    <h3 class="label setgroup">記録</h3>
    ${st?`<div class="setcard"><div class="sethead"><span class="settitle">保存の状態</span></div>
      <dl class="kv savekv"><dt>この端末</dt><dd>${dot(!/未保存/.test(G.saveStatus))}${esc(G.saveStatus)}</dd>${IS_PUBLIC?"":`<dt>クラウド</dt><dd>${dot(cloudOk)}${esc(CLOUD.state())}</dd>`}</dl>
      ${IS_PUBLIC?`<p class="setdesc">行動を決めるたびに、この端末のブラウザへ自動保存します。閲覧データを消すと記録も消えるので、ときどきバックアップで控えを取ってください。</p>`:""}<p class="setdesc" ${IS_PUBLIC?"hidden":""}>行動を決めるたびに自動保存します。クラウドはあなただけが読める保存場所で、アプリの更新やタブを閉じても残ります。</p>
      <div class="stack"><button class="btn primary" data-a="saveNow">今すぐセーブ</button><button class="btn" data-a="showBackup">バックアップを表示（控えを取る）</button></div>
      ${G.sheetData.backup?`<textarea id="backupOut" class="input mono" rows="5" readonly>${esc(G.sheetData.backup)}</textarea><button class="btn" data-a="copyBackup">コピーする</button>`:""}</div>`:""}
    <div class="setcard"><div class="sethead"><span class="settitle">記録の復元</span></div>
      <p class="setdesc">2026年10月23日の全ユーザー初期化後に作ったバックアップだけ復元できます。初期化前のバックアップは利用できません。文字列を貼り付けて読み込みます。<b>今の記録は置き換わります。</b></p>
      <textarea id="restoreIn" class="input mono" rows="3" aria-label="バックアップの貼り付け"></textarea>
      <div class="stack"><button class="btn" data-a="restore">貼り付けた記録を読み込む</button></div></div>
    <h3 class="label setgroup">共有</h3>
    <div class="stack"><button class="btn share-btn" data-a="openSheet" data-k="share">📣 友だちに教える（URLを共有）</button></div>
    ${st&&G.screen!=="title"?`<div class="stack"><button class="btn" data-a="toTitle">タイトルへ戻る</button></div>`:""}`;
}
/* ---- 共有（URLのコピー・LINE・X・端末の共有メニュー） ---- */
const SHARE_ARTIFACT_URL = "https://claude.ai/artifact/G1jFAs8yyUcJhtvgKragNh";
const SHARE_TEXT = "最大4人で戦う、ターン制バトルの昭和風ドットRPG『トップライバーへの道』";
function shareUrl(){
  if(window.TLR_SHARE_URL) return String(window.TLR_SHARE_URL);
  if(IS_PUBLIC){ try{ return location.origin+location.pathname+"?v="+encodeURIComponent(GAME_VERSION); }catch(e){} } // 公開版：今開いているページのURL
  return SHARE_ARTIFACT_URL;
}
function shareMessage(){ return `${SHARE_TEXT}\n${shareUrl()}`; }
function copyText(text, okMsg){
  const fallback=()=>{ const t=$("#shareUrlBox"); if(t){ t.focus(); t.select(); } toast("URLを選択しました。長押しでコピーしてください。"); };
  try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(()=>{ SND.sfx("ok"); toast(okMsg); }, fallback); return; } }catch(e){}
  try{ const ta=document.createElement("textarea"); ta.value=text; ta.setAttribute("readonly",""); ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); const ok=document.execCommand("copy"); ta.remove(); if(ok){ SND.sfx("ok"); toast(okMsg); return; } }catch(e){}
  fallback();
}
function renderShare(){
  const url=shareUrl(), msg=shareMessage();
  const line="https://social-plugins.line.me/lineit/share?url="+encodeURIComponent(url)+"&text="+encodeURIComponent(SHARE_TEXT);
  const x="https://twitter.com/intent/tweet?text="+encodeURIComponent(SHARE_TEXT)+"&url="+encodeURIComponent(url);
  const canShare=typeof navigator!=="undefined"&&!!navigator.share;
  return `<p>このゲームのURLを、友だちやリスナーさんに送れます。</p>
    <label for="shareUrlBox" class="field-label">ゲームのURL</label>
    <input id="shareUrlBox" class="input mono share-url" value="${esc(url)}" readonly aria-label="ゲームのURL">
    <div class="stack">
      ${canShare?`<button class="btn primary wide" data-a="shareNative">スマホの共有メニューを開く</button>`:""}
      <button class="btn ${canShare?"":"primary "}wide" data-a="shareCopyUrl">URLだけコピー</button>
      <button class="btn wide" data-a="shareCopyMsg">紹介文つきでコピー</button>
      <div class="row2"><a class="btn share-line" href="${esc(line)}" target="_blank" rel="noopener" data-a="noop">LINEで送る</a><a class="btn share-x" href="${esc(x)}" target="_blank" rel="noopener" data-a="noop">Xでポスト</a></div>
    </div>
    <h3 class="label">コピーされる紹介文</h3>
    <p class="small share-preview">${esc(msg).replace(/\n/g,"<br>")}</p>
    <p class="small dim">記録（セーブ）は送られません。受け取った人は「はじめから」で遊べます。</p>`;
}
function renderQuests(){
 const st=G.st,hub=curHub(),safe=isSafe(),d=G.sheetData,filter=d.questFilter||'recommended';
 const labels={locked:'未解放',available:'受注可能',active:'進行中',bossReady:'ボスに挑戦',combatDone:'配信待ち',complete:'完了'},order={combatDone:0,bossReady:1,active:2,available:3,locked:4,complete:5};
 const visible=Object.entries(QUESTS).filter(([id,q])=>st.quests[id]!=='locked'||st.visitedHubs.includes(q.hub)||(q.main&&hubUnlocked(st,q.hub)));
 const list=visible.filter(([id,q])=>filter==='complete'?st.quests[id]==='complete':filter==='active'?['active','bossReady','combatDone'].includes(st.quests[id]):filter==='all'?st.quests[id]!=='complete':st.quests[id]!=='complete'&&(q.hub===hub||['active','bossReady','combatDone'].includes(st.quests[id]))).sort((a,b)=>(order[st.quests[a[0]]]-order[st.quests[b[0]]])||(a[1].hub===hub?-1:1)-(b[1].hub===hub?-1:1)||Number(b[1].main)-Number(a[1].main)||a[0].localeCompare(b[0]));
 let h=`<button class="btn primary" data-a="openSheet" data-k="storyJournal">本編の準備・任意の事件・謎解き帳</button>${specialReminder(st)}<div class="qsummary"><b>${esc(HUBS[hub].name)}のイベント・依頼</b><p class="small">依頼の受注は同時に1件</p><p>${esc(objective())}</p></div><div class="qfilters">${[['recommended','この街・おすすめ'],['active','進行中'],['all','一覧'],['complete','完了']].map(([v,n])=>`<button class="btn ${filter===v?'primary':''}" aria-pressed="${filter===v}" data-a="questFilter" data-v="${v}">${n}</button>`).join('')}</div>`;
 for(const[id,q]of list){const state=st.quests[id],progress=Math.min(q.kills,st.qprog[id]||0),expanded=d.questFocus===id;let action='',reason='';
 if(state==='available'){reason=st.activeQuest?'別の依頼を進行中':q.hub!==hub?HUBS[q.hub].name+'で受注できます':!safe?'安全地帯へ移動してください':'';action=`<button class="btn primary wide" data-a="acceptQuest" data-v="${id}" ${reason?'disabled':''}>この依頼を受注する</button>`;}
 if(state==='active')reason=`通常敵の討伐：あと${Math.max(0,q.kills-progress)}体`;
 if(state==='bossReady')reason=`${BOSSES[q.boss].name}への挑戦準備が整っています`;
 if(state==='combatDone'){const ready=hub===q.hub&&safe;action=`<button class="btn primary wide" data-a="openSheet" data-k="streamSetup" ${ready?'':'disabled'}>配信の準備へ</button>${retryDescription(st,q.hub)}`;if(!ready)reason=HUBS[q.hub].name+'の安全地帯で配信できます';}
 if(state==='locked')reason=q.main?'前の街の本編依頼を完了すると解放':NPCS[q.npc].name+'に話しかけると解放';
 h+=`<section class="qcard ${state}"><div class="srow"><span class="tag">${q.main?'本編':'任意'}・${labels[state]}</span><span class="small">${esc(HUBS[q.hub].name)}</span></div><button class="btn quest-title" data-a="questDetail" data-v="${id}" aria-expanded="${expanded}"><b>${esc(q.name)}</b><span class="small">${id}　${expanded?'詳細を閉じる':'目的・報酬を見る'}</span></button>${['active','bossReady','combatDone'].includes(state)?`<p class="small">討伐 ${progress}/${q.kills}</p><progress value="${progress}" max="${q.kills}" aria-label="討伐の進行"></progress>`:''}${reason?`<p class="small ${state==='locked'?'dim':'warn'}">${esc(reason)}</p>`:''}${expanded?`<div class="qdetails"><p>${esc(q.goal)}</p><p class="small">完了報酬：経験値${questReward(q).xp}・チケット${questReward(q).tickets}（ボス報酬は別途）</p>${['active','bossReady'].includes(state)?`<button class="btn" data-a="questAbandonPrompt" data-v="${id}">依頼を放棄する…</button>`:''}</div>`:''}${action}</section>`;
 }
 return h+(list.length?'':'<p class="small">この分類に該当する依頼はありません。「一覧」からほかの街も確認できます。</p>');
}

function legacyXpFor(L){return 10*(L-1)*(L+6);}
function remapProgress(value,previous,next){
 const old=Math.max(0,Math.min(previous(999),Number.isFinite(value)?value:0));let lo=1,hi=999;
 while(lo<hi){const mid=(lo+hi+1)>>1;if(previous(mid)<=old)lo=mid;else hi=mid-1;}
 if(lo===999)return next(999);
 return next(lo)+Math.floor((old-previous(lo))*(next(lo+1)-next(lo))/(previous(lo+1)-previous(lo)));
}
function migrateExperience(st){
 if(st.xpCurveVersion!==3){const previous=st.xpCurveVersion===2?previousXpFor:legacyXpFor;st.xp=remapProgress(st.xp,previous,xpFor);st.xpCurveVersion=3;}
 if(st.jpCurveVersion!==2){for(const record of Object.values(st.jp||{}))for(const job of Object.keys(record))record[job]=remapProgress(record[job],previousJpFor,jpFor);st.jpCurveVersion=2;}
}
function stationNear(st){const m=MAPS[st.mapId];return m&&m.kind==='out'&&m.objects.some(o=>o.type==='station'&&Math.max(Math.abs(o.x-st.pos.x),Math.abs(o.y-st.pos.y))<=1);}
function railUnlocked(st,id){return hubUnlocked(st,id);}
function stationDestinations(st){return HUB_ORDER.filter(id=>id!==MAPS[st.mapId].hub&&railUnlocked(st,id));}
const RAIL_LENGTHS=[70,100,45,95,65,180,60,90,35,210,40,160,60,350,70];
function railDistance(from,to){return geographicalRailDistance(from,to);}
function railFare(from,to){const d=railDistance(from,to);return d===null?null:d===0?0:20+d;}
function railTravel(st,to){if(st!==G.st||!stationNear(st)||!stationDestinations(st).includes(to))return false;const reason=hubTravelReason(st,to);if(reason){toast(reason);return false;}const fare=railFare(curHub(),to);if(fare===null||st.gold<fare){toast('運賃が足りません。必要'+fare+'ゴールド／所持'+st.gold+'ゴールド');return false;}const m=MAPS[to],station=m.objects.find(o=>o.type==='station');if(!station)return false;const p=[[0,1],[1,0],[0,-1],[-1,0]].map(([dx,dy])=>[station.x+dx,station.y+dy]).find(([x,y])=>walkable(m,x,y)&&!zoneAt(m,x,y));if(!p)return false;st.gold-=fare;travelHub(to,...p);return true;}
function renderStation(){const st=G.st;return `${pendingTravelNotice(st)}<p>所持金：<b>${st.gold.toLocaleString()}ゴールド</b></p><p class="small">運賃は基本20＋ゲーム内距離（地名代表点間の直線距離×1.25を切り上げ）。距離係数・路線はゲーム内の創作です。実際の運賃や直通路線を示しません。前の街の本編クリアで次の駅が解放されます。</p><div class="stack">${stationDestinations(st).map(id=>{const d=railDistance(curHub(),id),fare=railFare(curHub(),id);return `<button class="btn" data-a="railGo" data-v="${id}" ${st.gold<fare||hubTravelReason(st,id)?'disabled':''}><b>${esc(HUBS[id].pref)}・${esc(HUBS[id].name)}</b><span class="small">路線距離${d}／運賃${fare}ゴールド${st.gold<fare?`（あと${fare-st.gold}不足）`:''}</span></button>`;}).join('')||'<p>ほかの街はまだ解放されていません。</p>'}</div>`;}
function renderWorld(){
  const st=G.st; const safe=isSafe();
  let h=renderNationalAtlas()+`<div class="row3"><button class="btn" data-a="openSheet" data-k="japanMap">日本地図</button><button class="btn" data-a="openSheet" data-k="relationships">人物相関図</button><button class="btn" data-a="openSheet" data-k="careerTour">活動予定</button><button class="btn" data-a="openSheet" data-k="storyJournal">事件・謎解き帳</button></div>${pendingTravelNotice(st)}${specialReminder(st)}<button class="btn" data-a="openSheet" data-k="specialTracker">特別エリア・クリア状況</button><button class="btn primary" data-a="openSheet" data-k="nextChapter">全国ツアーの進行・出発</button><p class="small">街の出口から街外マップへ切り替え、街道を歩いて次の街へ進みます。新幹線は街の駅から利用できます。中国・四国エリア編は九州本編M16クリアで解放（大牟田編のクリアは不要）。</p><div class="stack">`;
  for(const id of HUB_ORDER){ const H=HUBS[id]; if(!H) continue;
    const here=curHub()===id; const visited=st.visitedHubs.includes(id); const open=hubUnlocked(st,id);
    if(!open){ h+=`<div class="qcard locked"><div class="srow"><b>${id} ${esc(H.pref)}・${esc(H.name)}</b><span class="tag">未解放</span></div></div>`; continue; }
    h+=`<div class="qcard ${id==='KY17'&&st.quests.M17!=='complete'?'special-pending':''}"><div class="srow"><b>${id} ${esc(H.pref)}・${esc(H.name)}${H.home?"（故郷）":""}</b><span class="tag">${id==='KY17'?st.quests.M17==='complete'?'✓ 特別編クリア／':'★ 解放済み・未クリア／':''}${here?"現在地":visited?"訪問済み":"未訪問"}</span></div>
      ${here?"":`<button class="btn" data-a="worldGo" data-v="${id}" ${hubTravelReason(st,id)?"disabled":""}>街外を歩いて向かう</button>`}</div>`;
  }
  h+=`</div><p class="small dim">前の拠点の本編依頼を終えると、次の拠点へ進めます。</p>`;
  return h;
}
function renderParty(){
  const st=G.st; const d=G.sheetData; const L=partyLevel(st);
  const locked = !!st.run || !isSafe() || !!streamPending();
  const lockMsg = st.run?"戦闘中は変更できません。":!isSafe()?"安全地帯でのみ変更できます。":streamPending()?"配信待ちの間はジョブと装備を変更できません。":"";
  if(d.cid){
    const cid=d.cid; const cur=charStats(st,cid,L);
    if(d.view==="job"){
      return `<p><b>${esc(charName(st,cid))}</b>のジョブ（現在：${esc(JOBS[cur.job].name)}）</p><p>転職は街のハローワークで行います。各職業の専用イベントをクリアすると仲間全員に解放されます。</p><button class="btn" data-a="helloWorkGuide">ハローワークへ道案内</button>${lockMsg?`<p class="warn">${lockMsg}</p>`:""}
      <div class="stack">${JOB_IDS.map(j=>{ const nx=charStats(st,cid,L,j,previewEquipFor(st,cid,j)); const jp=jpOf(st,cid,j);
        return `<div class="jcard ${j===cur.job?"on":""}"><div class="srow"><b>${j===cur.job?"▶ ":""}${j} ${esc(JOBS[j].name)}</b><span>熟練度${nx.R}${nx.R>=progressionCap(st)?"・最大":`・次まで${jpFor(nx.R+1)-jp}`}</span></div>
        <p class="small">${esc(JOBS[j].field)}｜${esc(JOBS[j].skill)}：MP${JOBS[j].cost}。${esc(JOBS[j].desc(nx.S))}</p>
        <p class="small trait">特性「${esc(JOB_TRAITS[j].name)}」：${esc(JOB_TRAITS[j].desc)}</p>
        <p class="small">転職後も残る固有ボーナス：${esc(jobBonusDescription(j,nx.R))}／熟練度999では${esc(jobBonusDescription(j))}。複数職の合計は各能力45％まで。</p><p class="small">能力の伸び方：${gradeText(j)}／MP成長：初期${JOB_MP[j][0]}・レベルごとに${JOB_MP[j][1]}（端数切り捨て）</p><p class="small">追加技：${Object.values(EXTRA_SKILLS).filter(sk=>sk.job===j).map(sk=>`${esc(sk.name)}（Lv${sk.level}${sk.rank?`・熟練度${sk.rank}`:""}・MP${sk.cost}）`).join("／")}</p>
        ${j===cur.job?"":statDiffHtml(cur,nx,L)}
        ${j===cur.job?"":`<p class="small ${jobUnlocked(st,j)?"good":"warn"}">${jobUnlocked(st,j)?"転職解放済み・ハローワークで選択できます":"未解放：職業イベント「"+esc(JOB_EVENT_DATA[j][0])+"」をクリアしてください"}</p>`}</div>`; }).join("")}</div>
      <button class="btn" data-a="partyView" data-c="${cid}" data-v="">人物へ戻る</button>`;
    }
    if(d.view && d.view.startsWith("eq:")){
      const slot=d.view.slice(3); const items=sortEq(Object.keys(EQUIP).filter(id=>EQUIP[id].slot===slot && (st.owned[id]||0)>0));
      return eqSortBar()+`<p><b>${esc(charName(st,cid))}</b>の${{w:"武器",a:"防具",acc:"アクセサリー"}[slot]}</p>${lockMsg?`<p class="warn">${lockMsg}</p>`:""}
        <div class="stack"><button class="btn" data-a="setEquip" data-c="${cid}" data-s="${slot}" data-v="" ${locked?"disabled":""}>外す</button>
        ${items.map(id=>{ const it=EQUIP[id]; const mine=st.equip[cid][slot]===id; const avail=availableCount(st,id)+(mine?1:0);
          const elig=canEquipC(st,cid,it); const eq2={...st.equip[cid],[slot]:id}; const nx=charStats(st,cid,L,null,eq2);
          return `<div class="jcard ${mine?"on":""}"><div class="srow"><b>${mine?"▶ ":""}${eqBadge(id)}${esc(it.name)}</b><span>所持${st.owned[id]}・未装備${availableCount(st,id)}</span></div><p class="small">${esc(itemText(it,Vof(partyLevel(st))))}</p>
          ${mine?`<p class="small dim">装備中（下の候補と比べられます）</p>`:statDiffHtml(cur,nx,L)}
          ${mine?"":(()=>{ const holder=avail<=0?st.roster.find(c=>c!==cid&&st.equip[c]&&st.equip[c][slot]===id):null; const can=!locked&&elig&&(avail>0||!!holder);
          return `<button class="btn" data-a="setEquip" data-c="${cid}" data-s="${slot}" data-v="${id}" ${can?"":"disabled"}>${avail<=0&&holder?`${esc(charName(st,holder))}から付け替える`:"装備する"}</button>${elig?"":`<p class="small warn">${esc(equipRequirement(it))}。今のジョブ・熟練度では装備できません。</p>`}`; })()}</div>`; }).join("")}</div>
        <button class="btn" data-a="partyView" data-c="${cid}" data-v="">人物へ戻る</button>`;
    }
    const e=st.equip[cid]; const C=CHARS[cid];
    return `<div class="who"><canvas class="sprite-md" data-char="${cid}" width="16" height="24" aria-hidden="true"></canvas><div><b>${esc(charName(st,cid))}</b>　${[C.age?C.age+"歳":"",C.from?esc(C.from):""].filter(Boolean).join("・")}<br><span class="small">${cid==="moe"?"経歴":"職歴"}：${esc((cid==="hero"?(st.profile.career||C.career):C.career))}（ジョブとは別）</span><p class="small">${esc(C.pocoRole||"")}</p></div></div>
      <dl class="kv"><dt>ジョブ</dt><dd>${esc(JOBS[cur.job].name)}　熟練度${cur.R}・技能強化${cur.S}</dd><dt>HP</dt><dd>${vitalOf(cid).hp}／${cur.maxHP}</dd><dt>MP</dt><dd>${vitalOf(cid).c}／${cur.startC}</dd>
      <dt>武器</dt><dd>${e.w?esc(EQUIP[e.w].name):"なし"}</dd><dt>防具</dt><dd>${e.a?esc(EQUIP[e.a].name):"なし"}</dd><dt>アクセサリー</dt><dd>${e.acc?esc(EQUIP[e.acc].name):"なし"}</dd></dl>
      ${characterProfileHtml(st,cid)}<h3 class="label">使用できる技</h3><p>${esc(JOBS[cur.job].skill)}（MP${JOBS[cur.job].cost}）</p><ul class="list">${Object.values(EXTRA_SKILLS).filter(sk=>cur.extraSkills.includes(sk.id)||sk.job===cur.job&&!sk.baseJob).map(sk=>`<li>${esc(sk.name)}：MP${sk.ultimate?"最大値の25％（最低8）":sk.cost}・${esc(sk.desc)}${sk.job&&!cur.extraSkills.includes(sk.id)?`（Lv${sk.level}${sk.rank?`・熟練度${sk.rank}`:""}で習得）`:(sk.ultra?"（対応装備を着けている間のみ）":"（習得済み）")}</li>`).join("")}</ul>
      <div class="stack"><button class="btn" data-a="partyView" data-c="${cid}" data-v="job">職業・転職条件を見る</button>
      <button class="btn" data-a="partyView" data-c="${cid}" data-v="eq:w">武器</button><button class="btn" data-a="partyView" data-c="${cid}" data-v="eq:a">防具</button><button class="btn" data-a="partyView" data-c="${cid}" data-v="eq:acc">アクセサリー</button>
      <button class="btn" data-a="partyView" data-c="" data-v="">一覧へ</button></div>`;
  }
  const bond = npc => !st.talked[npc]?0: 1 + (npc==="akari"? (st.quests.M01==="complete"?1:0)+(st.quests.S01==="complete"?1:0) : (st.quests.M02==="complete"?1:0)+(st.quests.S02==="complete"?1:0));
  const supOk = st.talked.akari && st.quests.M01==="complete" && st.quests.S01==="complete";
  return `<button class="btn primary" data-a="openSheet" data-k="characterStories">仲間の物語・固有特性・必殺技</button>${lockMsg?`<p class="warn">${lockMsg}</p>`:""}<p class="small">パーティレベルは同行者それぞれの現在の上限内の経験値を平均して算出します。旧セーブの上限超過分は保留し、次の上限解放後に有効になります。先頭から順に隊列0～3。タップで人物の詳細、↑で並びを前へ。同行は主人公とヒロインを含む2～4人。二人は必須で、控えにはできません。経験値・熟練度は戦闘に同行したキャラのみ入手します。待機者は成長しません。入れ替え・隊列変更は街のファミリー施設で行います。仲間は旅の各地で加わります。</p>
    ${st.party.length===4?`<p class="small">交代させる枠を選択：</p><div class="row4">${st.party.map((c,i)=>`<button class="btn ${companionReplaceSlot(st)===i?"on":""}" data-a="partyReplaceSlot" data-v="${i}" ${requiredCompanion(c)?"disabled":""}>${i+1} ${esc(charName(st,c))}${requiredCompanion(c)?"（必須）":""}</button>`).join("")}</div>`:""}<h3 class="label">同行メンバー</h3><div class="stack">${st.party.map((c,i)=>`<div class="prow"><button class="btn grow" data-a="partyView" data-c="${c}" data-v="">${i+1}. ${esc(charName(st,c))}${requiredCompanion(c)?"（必須）":""}・${esc(JOBS[st.jobs[c]].name)}<br><span class="small">${partyStatLine(st,c,L)}<br>固有：${esc(CHARACTER_ARCS[c].trait)}／物語${characterRecord(st,c).seen}/4話</span></button>${i?`<button class="btn sq" data-a="partyUp" data-v="${i}" aria-label="前へ" ${!atFamily(st)?"disabled":""}>↑</button>`:""}${!requiredCompanion(c)&&st.party.length>2?`<button class="btn sq" data-a="partyOut" data-v="${i}" aria-label="控えへ" ${!atFamily(st)?"disabled":""}>↓</button>`:""}</div>`).join("")}</div>
    ${st.roster.length>st.party.length?`<h3 class="label">控え</h3><div class="stack">${st.roster.filter(c=>!st.party.includes(c)).map(c=>`<div class="prow"><button class="btn grow" data-a="partyView" data-c="${c}" data-v="">${esc(charName(st,c))}・${esc(JOBS[st.jobs[c]].name)}<br><span class="small">${partyStatLine(st,c,L)}<br>固有：${esc(CHARACTER_ARCS[c].trait)}／物語${characterRecord(st,c).seen}/4話</span></button><button class="btn" data-a="partyIn" data-v="${c}" ${!atFamily(st)?"disabled":""}>${st.party.length<4?"同行者に入れる":"選択枠と入れ替え"}</button></div>`).join("")}</div>`:""}
    <h3 class="label">地域支援</h3><p class="small">コア応援者がいる県の効果を1つ選べます（戦闘開始時に固定）。</p>
    <div class="stack"><button class="btn ${!st.support?"on":""}" data-a="setSupport" data-v="">${!st.support?"▶ ":""}なし</button>
    <button class="btn ${st.support==="PR01"?"on":""}" data-a="setSupport" data-v="PR01" ${supOk?"":"disabled"}>${st.support==="PR01"?"▶ ":""}福岡：戦闘開始時のエール＋10（灯里 親密度${bond("akari")}/3）</button>
    ${Object.entries(SUPPORTS).filter(([pr])=>pr!=="PR01").map(([pr,S])=>{ const npc=S.npc; const sq=Object.keys(QUESTS).find(k=>!QUESTS[k].main&&QUESTS[k].npc===npc); const hub=sq&&QUESTS[sq].hub; if(!hub||!st.visitedHubs.includes(hub)) return ""; const mq=mainQuestOf(hub); const lv=!st.talked[npc]?0:1+(st.quests[mq]==="complete"?1:0)+(st.quests[sq]==="complete"?1:0); const ok=lv>=3; return `<button class="btn ${st.support===pr?"on":""}" data-a="setSupport" data-v="${pr}" ${ok?"":"disabled"}>${st.support===pr?"▶ ":""}${PREF_NAMES[pr]}：${esc(S.text)}（${esc(NPCS[npc].name)} 親密度${lv}/3）</button>`; }).join("")}</div>`;
}
function previewEquipFor(st,cid,job){const e={...st.equip[cid]};for(const slot of ["w","a","acc"]){const it=e[slot]&&EQUIP[e[slot]];if(it&&(characterLevel(st,cid)<(it.needL||1)||it.job&&(it.job!==job||jobRank(st,cid,job)<it.needR)))e[slot]=null;}return e;}
function renderRecord(){
  const st=G.st; const L=partyLevel(st);
  const milestones=[["E1","新規開始"],...Object.keys(QUESTS).filter(k=>QUESTS[k].main&&!QUESTS[k].post&&!QUESTS[k].chapterLevel).map(k=>[MOE_RANKS[QUESTS[k].rank],k+"完了"])];
  return `${progressionHtml(st)}<dl class="kv"><dt>総合レベル</dt><dd>${L}（経験値 ${partyExperience(st).toLocaleString()}${L<progressionCap(st)?`・次まで${(xpFor(L+1)-partyExperience(st)).toLocaleString()}`:"・最大"}）</dd>
    <dt>もえのシナリオ到達ランク</dt><dd>${MOE_RANKS[st.moeRank]}</dd><dt>旅</dt><dd>${st.day}日目</dd></dl>
    <p class="small">もえのランクは物語上の到達記録です。レベル・熟練度・実際の応援ポイントとは別に表示します。</p>
    <ul class="list">${milestones.map(([r,c],i)=>`<li>${MOE_RANKS.indexOf(r)<=st.moeRank?"●":"○"} ${r}：${c}</li>`).join("")}</ul>
    <h3 class="label">仲間</h3><ul class="list">${st.roster.map(c=>{const s=charStats(st,c,L); return `<li>${esc(charName(st,c))}：${esc(JOBS[s.job].name)} 熟練度${s.R}・最大HP${s.maxHP}</li>`;}).join("")}</ul>
    <h3 class="label">九州アルバム</h3><ul class="list">${Object.entries(BOX_CARDS).map(([k,n])=>`<li>${st.cards.includes(k)?"● "+esc(n):"○ 未取得"}</li>`).join("")}</ul>
    <h3 class="label">応援者帳</h3><ul class="list">${Object.entries(NPCS).filter(([k,n])=>n.rep&&st.visitedHubs.includes(n.hub)).map(([k,n])=>`<li>${esc(n.name)}（${esc(HUBS[n.hub].name)}）：${st.talked[k]?"話を聞いた":"未会話"}</li>`).join("")}</ul>
    <h3 class="label">配信記録</h3>${Object.entries(PREF_NAMES).filter(([pr])=>st.streamBest[pr]!=null||pr==="PR01").map(([pr,n])=>`<p>${n}の配信反応：${st.streamBest[pr]!=null?streamGrade(st.streamBest[pr]):"未配信"}</p>`).join("")}
    ${st.lastResult?`<h3 class="label">直前の戦闘結果</h3><p class="small">経験値＋${st.lastResult.xp}・${st.lastResult.gold}ゴールド・${st.lastResult.jp.map(j=>`${esc(j.name)} 熟練度経験値＋${j.gain}`).join("、")}</p>`:""}`;
}
function normalizedDexData(data={}){if(!data||typeof data!=='object'||Array.isArray(data))data={};const area=Object.prototype.hasOwnProperty.call(AREAS,data.area)?data.area:'KY01-A1',raw=Number(data.page),page=Number.isInteger(raw)&&Number.isFinite(raw)?Math.max(0,Math.min(4,raw)):0;let detail=null;if(typeof data.detail==='string'){const bits=data.detail.split('|'),i=Number(bits[1]);if(bits.length===2&&Object.prototype.hasOwnProperty.call(AREAS,bits[0])&&/^(0|[1-4]?[0-9])$/.test(bits[1])&&Number.isInteger(i)&&i>=0&&i<AREAS[bits[0]].list.length)detail=bits[0]+'|'+i;}return {area,page,detail};}
function validNormalEnemyId(id){if(typeof id!=='string')return false;const m=/^EN-(.+)-(\d{3})$/.exec(id);return !!m&&Object.prototype.hasOwnProperty.call(AREAS,m[1])&&Number(m[2])>=1&&Number(m[2])<=AREAS[m[1]].list.length;}
function validateInventoryState(s){const obj=v=>v&&typeof v==='object'&&!Array.isArray(v),validBag=bag=>Array.isArray(bag)&&bag.length<=BAG_KINDS&&new Set(bag.map(e=>e?.id)).size===bag.length&&bag.every(e=>obj(e)&&typeof e.id==='string'&&Object.prototype.hasOwnProperty.call(ITEMS,e.id)&&Number.isSafeInteger(e.n)&&e.n>=1&&e.n<=BAG_STACK);if((s.itemsVersion||s.bag!==undefined)&&!validBag(s.bag))throw Error('bad item bag');if(s.run?.bag!==undefined&&!validBag(s.run.bag))throw Error('bad battle item bag');if(s.keep!==undefined&&(!Array.isArray(s.keep)||s.keep.length>KEEP_MAX||s.keep.some(id=>typeof id!=='string'||!Object.prototype.hasOwnProperty.call(ITEMS,id)&&!Object.prototype.hasOwnProperty.call(EQUIP,id))))throw Error('bad storage items');if(!obj(s.owned)||Object.entries(s.owned).some(([id,n])=>!Object.prototype.hasOwnProperty.call(EQUIP,id)||!Number.isSafeInteger(n)||n<0||n>8))throw Error('bad equipment stock');if(!obj(s.seen)||Object.entries(s.seen).some(([id,v])=>!validNormalEnemyId(id)||typeof v!=='boolean'))throw Error('bad enemy encounter records');if(!obj(s.killCount)||Object.values(s.killCount).some(n=>!Number.isSafeInteger(n)||n<0))throw Error('bad enemy kill records');}
function renderDex(data=G.sheetData,embedded=false){
  const st=G.st; const d=normalizedDexData(data);const area=d.area,page=d.page;
  if(d.detail){
    const [a,i]=d.detail.split("|"); const e=enemyDef(a,+i); const seen=st.seen[e.id];
    const q=e.q,stats=fieldEnemyStats(e,q); const steps=stats.cycle.map(({t,p})=>t==="c"?"ため":`${t==="s"?"単体":"全体"}${p}`).join(" → ");
    return `<div class="who"><canvas class="sprite-lg" data-dex="${a}|${i}" width="32" height="32" aria-hidden="true"></canvas><div><b>${esc(e.name)}</b><br><span class="small">${e.id}</span></div></div>
      <dl class="kv"><dt>種族／属性／種類</dt><dd>${esc(e.species)}／${esc(e.attr)}／${esc(e.type)}</dd><dt>レア度</dt><dd>${"★".repeat(e.rarity)} ${["","通常","やや珍しい","希少","極希少","幻影"][e.rarity]}</dd>
      <dt>エリア</dt><dd>${esc(AREAS[a].name)}・挑戦目安Lv${requiredAreaLevel(AREAS[a])}・適正Lv${recommendedAreaLevel(AREAS[a])}</dd><dt>HP／防御力</dt><dd>${stats.hp}／${stats.def}（標準・通常状態）</dd>
      <dt>行動周期</dt><dd>${steps}</dd><dt>対処</dt><dd>${esc(e.counter)}</dd>
      <dt>1枠の出現率</dt><dd>${(e.weight/100).toFixed(2)}%</dd><dt>歩行遭遇率</dt><dd>危険タイル1歩ごとに1/24</dd>
      <dt>記録</dt><dd>${seen?"遭遇済み":"未遭遇"}・討伐${st.killCount[e.id]||0}</dd></dl>
      ${embedded?'':'<button class="btn" data-a="dexNav" data-k="detail" data-v="">一覧へ戻る</button>'}`;
  }
  const list=AREAS[area].list.map((_,i)=>enemyDef(area,i));
  const seenN=list.filter(e=>st.seen[e.id]).length;
  return `<button class="btn primary" data-a="openSheet" data-k="collection">全地域の収集数・未遭遇一覧</button><label class="dex-area-select">出現エリア<select id="dexAreaSelect">${Object.keys(AREAS).filter(a=>st.visitedHubs.includes(a.slice(0,4))||st.visitedMaps.includes(a.slice(0,4))||a===area).map(a=>`<option value="${a}" ${a===area?'selected':''}>${esc(MAPS[a.slice(0,4)].name)}・${esc(AREAS[a].name)}</option>`).join("")}</select></label>
    <p class="small">${esc(AREAS[area].name)}：50件中 遭遇済み${seenN}件（${page*10+1}～${page*10+10}件目を表示）</p>
    <div class="stack">${list.slice(page*10,page*10+10).map((e,k)=>`<button class="btn dexrow" data-a="dexNav" data-k="detail" data-v="${area}|${page*10+k}"><span>${st.seen[e.id]?"●":"○"} ${esc(e.name)}</span><span class="small">${esc(e.species)}／${esc(e.attr)}／${"★".repeat(e.rarity)}</span></button>`).join("")}</div>
    <div class="row3"><button class="btn" data-a="dexNav" data-k="page" data-v="${page-1}" ${page>0?"":"disabled"}>前の10件</button><span></span><button class="btn" data-a="dexNav" data-k="page" data-v="${page+1}" ${page<4?"":"disabled"}>次の10件</button></div>`;
}
function renderShop(){
 const st=G.st,d=G.sheetData||{},S=SHOPS[d.shop];if(!S)return '<p>この店は見つかりません。戻って店に入り直してください。</p>';
 const tab=['buy','item','sell'].includes(d.tab)?d.tab:'buy',cid=manageCid(st,d),reason=shopContextReason(st,d),head=`<p class="m-summary">所持 <b>${manageNumber(st.gold)}G</b>／道具 ${st.bag.length}/${BAG_KINDS}種類／未装備 ${eqStockKinds(st)}/${EQ_KINDS}種類</p>${manageNotice(d)}${manageTabs([['buy','装備を買う'],['item','道具を買う'],['sell','売る']],tab,'shopTab')}${reason&&!d.item?`<p class="m-notice warn">${esc(reason)}</p>`:''}`;
 let body='';
 if(d.item){const t=shopQuote(st,{...d,tab},true),it=t.it;if(!it)return `<div class="m-view">${head}<p>商品を選び直してください。</p><button class="btn" data-a="shopItem" data-v="">一覧へ</button></div>`;body=`<article class="m-card">${t.isItem?itemBadge(it):eqBadge(d.item)}<h3>${esc(it.name)}</h3><p>${esc(itemText(it,Vof(partyLevel(st))))}</p><p>${esc(t.isItem?jobItemRequirement(it):equipRequirement(it))}</p><p>所持 ${t.own}${t.isItem?'/'+BAG_STACK:'個（装備中 '+equippedCount(st,d.item)+'個）'}／単価 <b>${manageNumber(t.unit)}G</b></p>${it.nonSale&&t.sell?'<p class="warn">非売品は店で買い直せません。</p>':''}<div class="m-quantity" aria-label="取引する個数"><button class="btn" data-a="shopQty" data-v="1" ${t.q<=1?'disabled':''}>1個</button><button class="btn" data-a="shopQty" data-v="${t.q-1}" ${t.q<=1?'disabled':''} aria-label="1個減らす">−</button><b>${t.q}個</b><button class="btn" data-a="shopQty" data-v="${t.q+1}" ${t.q>=t.max?'disabled':''} aria-label="1個増やす">＋</button><button class="btn" data-a="shopQty" data-v="${t.max}" ${t.max<=0||t.q===t.max?'disabled':''}>最大${t.max}</button></div><p class="m-total">${t.sell?'受取':'合計'} <b>${manageNumber(t.total)}G</b><br>${t.after<0?'不足額':'取引後の所持金'} <b>${manageNumber(Math.abs(t.after))}G</b></p>${t.reason?`<p class="m-notice warn">${esc(t.reason)}</p>`:''}<div class="m-actions"><button class="btn primary" data-a="shopDo" ${t.reason?'disabled':''}>${t.q}個を${t.sell?'売る':'購入する'}</button><button class="btn" data-a="shopItem" data-v="">取引せず一覧へ</button></div>${!t.isItem&&!t.sell?'<p>購入だけでは装備は変わりません。「装備」画面で変更してください。</p>':''}</article>`;
  if(!t.isItem&&!t.sell){const s=charStats(st,cid,partyLevel(st)),nx=charStats(st,cid,partyLevel(st),null,{...st.equip[cid],[it.slot]:d.item});body+=managePerson(st,cid,'装備を比べる仲間')+`<h3 class="label">${esc(charName(st,cid))}の変更前後</h3><p class="${canEquipC(st,cid,it)?'good':'warn'}">${esc(manageGearNote(st,cid,it))}</p>${canEquipC(st,cid,it)?manageComparison(s,nx):'<p>条件を満たしてから装備できます。将来のために購入することはできます。</p>'}`;}}
 else{const filters=tab==='item'?[['all','すべて'],['heal','回復・蘇生'],['attack','攻撃道具'],['afford','今買える品']]:tab==='sell'?[['all','すべて'],['w','武器'],['a','防具'],['acc','アクセサリー'],['sellable','今売れる品']]:[['all','すべて'],['w','武器'],['a','防具'],['acc','アクセサリー'],['usable','選んだ仲間が装備可能'],['afford','今買える品']];const r=shopResults(st,{...d,tab}),s=charStats(st,cid,partyLevel(st));body=(tab==='buy'?managePerson(st,cid,'装備を比べる仲間'):'')+manageSearch(d,filters)+(tab==='item'?itSortBar(false):eqSortBar())+managePager(r)+`<div class="m-list">${r.visible.map(id=>{const it=ITEMS[id]||EQUIP[id],eq=!!EQUIP[id],t=shopQuote(st,{...d,tab,item:id,qty:1}),unit=t.unit;return `<button class="btn m-card" data-a="shopItem" data-v="${id}"><div class="m-card-title"><b>${esc(it.name)}</b><strong>${tab==='sell'&&ITEMS[id]&&it.sell<0?'売却不可':manageNumber(unit)+'G'}</strong></div>${eq?eqBadge(id):itemBadge(it)}<span>${esc(itemText(it,Vof(partyLevel(st))))}</span><span>所持 ${t.own}${tab==='sell'&&eq?'・未装備 '+availableCount(st,id):''}</span>${eq&&tab==='buy'?`<span class="${canEquipC(st,cid,it)?'good':'warn'}">${esc(manageGearNote(st,cid,it))}</span>${canEquipC(st,cid,it)?`<span class="m-gain">${manageGain(s,charStats(st,cid,partyLevel(st),null,{...st.equip[cid],[it.slot]:id}))}</span>`:''}`:''}<small>${t.max>0?'詳細・数量・合計を確認 ▶':t.reason||'現在は取引できません。詳細を確認 ▶'}</small></button>`;}).join('')}</div>`+(!r.items.length?manageEmpty():'')+managePager(r);}
 return `<div class="m-view">${head}${body}</div>`;
}
function itemText(it,V){ return it.text.replace(/(\d+)×V/g,(m,n)=>String(+n*V)).replace("−防御のダメージ","から敵の防御力を引いたダメージ"); }

/* ---- 装備によるステータス（変化量の表示用） ---- */
function statRows(s,L){
  L=s.L||L;const V=s.V||Vof(L);
  return [
    ["攻撃力", attackPower(s,L)], ["防御力", defensePower(s,L)], ["会心率(%)", s.crit], ["回避率(%)", s.eva], ["魅力補正(%)", s.cha],
    ["最大HP", s.maxHP], ["最大MP", s.startC],
    ["技能強化", s.S], ["応援コメントのエール", 18+s.commentA+(s.job==="J22"?6:0)], ["ひと息のMP回復", 4+s.rest],
    ["メーター突破の威力", 24+6*L+V*s.meter+Math.floor(s.base.cha/3)], ["ファミリー応援の回復", Math.ceil((12+s.family)*V*(1+s.cha/100))], ["回復・蘇生の道具", s.pouch?"2倍":"等倍"]
  ];
}
function statDiffHtml(cur,nx,L){
  const a=statRows(cur,L), b=statRows(nx,L); const rows=[];
  a.forEach(([k,v],i)=>{ const w=b[i][1]; if(v===w) return;
    const d = typeof v==="number" ? round1(w-v) : null;
    rows.push(`<tr><th>${k}</th><td>${v}</td><td>→</td><td><b>${w}</b></td><td class="${d==null?(w==="2倍"?"up":"down"):d>0?"up":"down"}">${d==null?(w==="2倍"?"▲":"▼"):d>0?`▲＋${d}`:`▼−${-d}`}</td></tr>`); });
  if(!rows.length) return `<p class="small dim">ステータスの変化なし</p>`;
  return `<table class="sdiff" aria-label="装備後のステータス変化"><tbody>${rows.join("")}</tbody></table>`;
}
function statTableHtml(s,L){
  return `<table class="sdiff now"><tbody>${statRows(s,L).map(([k,v])=>`<tr><th>${k}</th><td colspan="4"><b>${v}</b></td></tr>`).join("")}</tbody></table>`;
}
function renderEquip(){
 const st=G.st,d=G.sheetData||{},cid=manageCid(st,d),stock=d.equipTab==='stock'||!!d.stock,head=`<p class="m-summary">未装備 ${eqStockKinds(st)}/${EQ_KINDS}種類／1種類は装備中を含め8個まで</p>${manageNotice(d)}`;
 let body='';
 if(d.stock&&EQUIP[d.stock]){const id=d.stock,it=EQUIP[id],av=availableCount(st,id);body=`<article class="m-card">${eqBadge(id)}<h3>${esc(it.name)}</h3><p>${esc(it.text)}</p><p>${esc(equipRequirement(it))}</p><p>所持 ${st.owned[id]||0}・装備中 ${equippedCount(st,id)}・未装備 ${av}</p><p>売値 ${manageNumber(Math.floor(it.price/2))}G</p><p>${esc(whoCanText(st,it))}</p>${av>0?d.confirmDrop?`<div class="m-notice warn"><p>「${esc(it.name)}」を1個捨てます。${it.nonSale?'非売品は店で買い直せません。':''}</p><div class="row2"><button class="btn danger" data-a="eqDropDo" ${G.readOnly?'disabled':''}>1個捨てる</button><button class="btn" data-a="eqDropNo">やめる</button></div></div>`:`<button class="btn danger" data-a="eqDrop" ${G.readOnly||st.run||st.stream||!isSafe()||streamPending()?'disabled':''}>捨てる前に確認する</button>`:'<p>未装備の品がありません。</p>'}<button class="btn" data-a="closeSheet">${d.confirmDrop?'1つ前へ戻る':'持ち物の一覧に戻る'}</button></article>`;}
 else if(d.cid&&['w','a','acc'].includes(d.slot)){
  const slot=d.slot,s=charStats(st,cid,partyLevel(st)),now=st.equip[cid][slot];body=managePerson(st,cid)+manageTabs(Object.entries(EQ_SLOT_NAME),slot,'manageSlot')+`<p class="m-notice">${esc(charName(st,cid))}の${EQ_SLOT_NAME[slot]}：${now?esc(EQUIP[now].name):'装備なし'}</p>`;
  if(d.eqChoice){const id=d.eqChoice==='_off'?null:d.eqChoice,p=equipmentChange(st,cid,slot,id);if(!p.nx)body+=`<p>${esc(p.reason)}</p><button class="btn" data-a="closeSheet">候補に戻る</button>`;else{const stale=d.eqKey!==p.key,reason=p.reason|| (stale?'状態が変わりました。候補から選び直してください。':'');body+=`<article class="m-card"><h3>${id?esc(EQUIP[id].name):'装備を外す'}</h3>${id?eqBadge(id)+'<p>'+esc(EQUIP[id].text)+'</p><p>'+esc(equipRequirement(EQUIP[id]))+'</p>':''}${p.donor?`<p class="m-notice warn">${esc(charName(st,p.donor))}が装備中です。確定すると、この仲間から外して付け替えます。</p>`:''}${manageComparison(p.cur,p.nx)}${p.donor?`<details class="m-details"><summary>${esc(charName(st,p.donor))}の外した後の能力も確認</summary>${manageComparison(charStats(st,p.donor,partyLevel(st)),charStats(st,p.donor,partyLevel(st),null,{...st.equip[p.donor],[slot]:null}))}</details>`:''}${reason?`<p class="warn">${esc(reason)}</p>`:''}<div class="m-actions"><button class="btn primary" data-a="equipApply" ${reason?'disabled':''}>${p.donor?'付け替えを確定':id?'この装備に変更':'外すことを確定'}</button><button class="btn" data-a="closeSheet">変更せず候補へ戻る</button></div></article>`;}}
  else{const r=equipmentResults(st,d);body+=manageSearch(d,[['all','すべて'],['usable','この仲間が装備可能'],['free','未装備・装備可能'],['ultra','超レアのみ']])+eqSortBar()+managePager(r)+(now?'<button class="btn" data-a="equipChoose" data-v="_off">外した場合の能力を見る</button>':'')+`<div class="m-list">${r.visible.map(id=>{const it=EQUIP[id],p=equipmentChange(st,cid,slot,id),mine=now===id;return `<button class="btn m-card ${mine?'on':''}" data-a="equipChoose" data-v="${id}">${eqBadge(id)}<b>${esc(it.name)}</b><span>${mine?'装備中':availableCount(st,id)>0?'未装備 '+availableCount(st,id)+'個':'他の仲間が装備中'}</span><span class="m-gain">${manageGain(s,p.nx)}</span><span class="${canEquipC(st,cid,it)?'good':'warn'}">${esc(manageGearNote(st,cid,it))}</span><small>効果と変更前後を確認 ▶</small></button>`;}).join('')}</div>`+(!r.items.length?manageEmpty():'')+managePager(r);}
 }
 else if(d.cid&&!stock){const s=charStats(st,cid,partyLevel(st));body=managePerson(st,cid)+manageStats(s)+`<div class="m-list">${Object.entries(EQ_SLOT_NAME).map(([slot,name])=>{const id=st.equip[cid][slot];return `<button class="btn m-card" data-a="manageSlot" data-v="${slot}"><small>${name}</small><b>${id?esc(EQUIP[id].name):'装備なし'}</b><span>候補を検索・比較 ▶</span></button>`;}).join('')}</div>`;}
 else{body=manageTabs([['characters','仲間の装備'],['stock','未装備の持ち物']],stock?'stock':'characters','manageEquipTab');if(stock){const r=equipmentResults(st,d);body+=manageTabs([['all','全部位'],...Object.entries(EQ_SLOT_NAME)],d.slot||'all','manageSlot')+manageSearch(d,[['all','すべて'],['shared','共有装備'],['ultra','超レアのみ']])+eqSortBar()+managePager(r)+`<div class="m-list">${r.visible.map(id=>`<button class="btn m-card" data-a="equipStock" data-v="${id}">${eqBadge(id)}<b>${esc(EQUIP[id].name)}</b><span>未装備 ${availableCount(st,id)}個／所持 ${st.owned[id]}個</span><span>${esc(EQUIP[id].text)}</span></button>`).join('')}</div>`+(!r.items.length?manageEmpty():'')+managePager(r);}else body='<p>変更したい仲間を選んでください。</p>'+manageRoster(st);}
 return `<div class="m-view">${head}${body}</div>`;
}
function keepFlush(){ const st=G.st; if(!st||st.run||!st.keep||!st.keep.length) return 0; if(G.screen==="explore"&&!isSafe()) return 0; const n=flushKeep(st); if(n) toast(`預かり所から${n}個受け取った。`); return n; }
function renderItems(){
  const st=G.st, d=G.sheetData||{}; const L=partyLevel(st);
  const eventHead=`<button class="btn" data-a="openSheet" data-k="collection">道具・装備の入手記録とコンプ数</button><div class="row2"><button class="btn" data-a="openSheet" data-k="eventItems">特別イベント品 ${eventItemCount(st)}/${EVENT_ITEM_LIMIT}種類</button><button class="btn" data-a="openSheet" data-k="storyJournal">事件・謎解き帳</button></div>`;
  if(d.item && ITEMS[d.item] && bagCount(st.bag,d.item)>0){
    const it=ITEMS[d.item], n=bagCount(st.bag,d.item), nd=itemNeeds(it);
    let use="";
    if(it.battleOnly) use=`<p class="small">攻撃の道具は戦闘中の「道具」から使います。</p>`;
    else if(nd==="allyAll"||nd==="downAll") use=`<button class="btn primary" data-a="itemUse">使う（${nd==="downAll"?"戦闘不能の全員":"全員"}）</button>`;
    else use=`<h3 class="label">誰に使う？</h3>`+st.roster.map(c=>{const s=charStats(st,c,L),v=vitalOf(c); const dis = (nd==="down"? v.hp>0 : v.hp<=0)||!canUseJobItem(s.job,s.R,it); return `<button class="btn ${isLow(v.hp,s.maxHP)?"low":""}" data-a="itemUse" data-c="${c}" ${dis?"disabled":""}>${esc(charName(st,c))}　HP ${v.hp}/${s.maxHP}・MP ${v.c}/${s.startC}${v.hp<=0?"（戦闘不能）":""}</button>`;}).join("");
    return eventHead+`<p class="small">${esc(jobItemRequirement(it))}${it.job?"。移動中は条件を満たす本人、戦闘中は使用者のジョブ・熟練度で判定。":""}</p><p>${itemBadge(it)}<b>${esc(it.name)}</b>　×${n}</p><p class="small">${esc(ITEM_RARITY[it.stars])}・${esc(it.cat)}・入手：${esc(ITEM_ACQ[it.acq])}${it.sell>=0?`・売値${it.sell}ゴールド`:"・売却不可"}</p><p>${esc(itemText(it,Vof(partyLevel(st))))}。${it.battleOnly?"戦闘中だけ使えます。":"戦闘中・移動中に使えます。"}</p>
      <div class="stack">${use}${it.acq==="E"?`<p class="small">非売品のため捨てられません。</p>`:d.confirmDrop?`<div class="confirmbox" role="alertdialog" aria-label="捨てる確認"><p class="warn">本当に「${esc(it.name)}」を1個捨てますか？<br>捨てた道具は戻りません。${it.sell<0?"この道具は店では買えません。":""}</p><div class="row2"><button class="btn danger" data-a="itemDropDo">捨てる</button><button class="btn" data-a="itemDropNo">やめる</button></div></div>`:`<button class="btn" data-a="itemDrop">捨てる</button>`}<button class="btn" data-a="itemView" data-v="">一覧へ</button></div>`;
  }
  const total=st.bag.reduce((a,e)=>a+e.n,0);
  return eventHead+`<div class="capline"><span>道具袋 <b>${st.bag.length}</b>/${BAG_KINDS}種類</span><span>合計 <b>${total}</b>個（1種類${BAG_STACK}個まで）</span></div><p class="small">回復・蘇生は移動中にも使えます。</p>${itSortBar(true)}
    <div class="stack">${sortItems(st.bag).map(e=>{const it=ITEMS[e.id]; return `<button class="btn dexrow" data-a="itemView" data-v="${e.id}"><span>${itemBadge(it)}${esc(it.name)}　×${e.n}　<span class="small">${"★".repeat(it.stars)}</span></span><span class="small">${esc(itemText(it,Vof(partyLevel(st))))}${it.battleOnly?"（戦闘のみ）":""}</span></button>`;}).join("")||`<p>道具を持っていません。ショップで買えます。</p>`}</div>
    ${st.keep&&st.keep.length?`<h3 class="label">宿屋の預かり所（${st.keep.length}/${KEEP_MAX}）</h3><p class="small">袋に空きができると、安全な場所で自動的に受け取ります。</p><ul class="list">${st.keep.map(id=>`<li>${esc((ITEMS[id]||EQUIP[id]||{name:id}).name)}</li>`).join("")}</ul>`:""}`;
}
function qtyRow(q,max){ return `<div class="row3"><button class="btn" data-a="shopQty" data-v="${q-1}" ${q>1?"":"disabled"}>−</button><span class="qty">数量 ${q}</span><button class="btn" data-a="shopQty" data-v="${q+1}" ${q<max?"":"disabled"}>＋</button></div>`; }
function renderMoe(){
  const st=G.st; const r=MOE_RANKS[st.moeRank];
  const line0 = st.moeRank===0?"まずは福岡の声を整えよう。放送塔の丘の奥で、大きな重なりが起きてるみたい。": st.moeRank===1?"北九州の港で、初めての採点配信をしたいな。準備、手伝ってくれる？":"福岡、ありがとう。次の街でも、一人ずつの声に返事をしていきたい。";
  const ht=HUB_TEXT[curHub()]; const line = G.moeLine || (st.moeRank>=3&&ht&&ht.moe?ht.moe[0]:line0);
  const read=Object.keys(SCENES).filter(k=>st.scenes[k]);
  return `<div class="who"><canvas class="sprite-md" data-char="moe" width="16" height="24" aria-hidden="true"></canvas><div><b>もえ</b><br><span class="small">メインライバー・シナリオ到達ランク ${r}</span></div></div>
    <p class="dlg-text">「${esc(line)}」</p>
    <button class="btn" data-a="moeTalk">もっと話す</button><button class="btn primary" data-a="characterStoryOpen" data-c="moe">絆の物語・二人の約束</button>
    <h3 class="label">物語を読み返す</h3><div class="stack">${read.length?read.map(k=>`<button class="btn" data-a="replay" data-v="${k}">${esc(SCENES[k].title)}</button>`).join(""):`<p class="small">まだありません。</p>`}</div>`;
}
function renderStreamSetup(){
  const st=G.st; const d=G.sheetData;
  const hosts=st.roster.filter(c=>c!=="moe");
  d.host=d.host||hosts[0]; d.theme=d.theme||"newbie"; d.style=d.style||"video";
  d.incomeGoal=BROADCAST_GOALS.includes(Number(d.incomeGoal))?Number(d.incomeGoal):100;
  d.policy=BROADCAST_POLICIES[d.policy]?d.policy:'community';d.viewerGoal=BROADCAST_GOALS.includes(Number(d.viewerGoal))?Number(d.viewerGoal):100;
  const req=STREAM_REQ[HUBS[curHub()].prefId]||STREAM_REQ.PR01;
  return `<p>メインライバーはもえ。配信サポート担当とテーマを選びます。街で聞いた声を思い出し、視聴者の要望に合わせて番組を組み立てましょう。</p>
    <h3 class="label">配信サポート担当</h3><div class="opts">${hosts.map(c=>`<button class="btn opt ${d.host===c?"on":""}" data-a="ssSet" data-k="host" data-v="${c}">${d.host===c?"▶ ":""}${esc(charName(st,c))}</button>`).join("")}</div>
    <h3 class="label">番組テーマ</h3><div class="opts">${Object.entries(STREAM_THEMES).map(([k,t])=>`<button class="btn opt ${d.theme===k?"on":""}" data-a="ssSet" data-k="theme" data-v="${k}">${d.theme===k?"▶ ":""}${t.name}（${STREAM_ACTS[t.act].name}を生かすテーマ）</button>`).join("")}</div>
    <h3 class="label">スタイル</h3><div class="opts">${[["video","映像あり"],["voice","声中心"]].map(([k,n])=>`<button class="btn opt ${d.style===k?"on":""}" data-a="ssSet" data-k="style" data-v="${k}">${d.style===k?"▶ ":""}${n}</button>`).join("")}</div>
    <h3 class="label">配信方針</h3><div class="opts">${Object.entries(BROADCAST_POLICIES).map(([k,p])=>`<button class="btn opt ${d.policy===k?'on':''}" data-a="ssSet" data-k="policy" data-v="${k}">${p.name}</button>`).join('')}</div><p class="small">新規重視は視聴者、交流重視はファン、収益重視は応援収入を伸ばします。テーマによる得点とは別の設定です。</p>
    <h3 class="label">視聴者目標</h3><div class="row2">${BROADCAST_GOALS.map(n=>`<button class="btn ${Number(d.viewerGoal)===n?'on':''}" data-a="ssSet" data-k="viewerGoal" data-v="${n}">${n}人</button>`).join('')}</div><p class="small">目標は挑戦の目安です。未達でも本編の合格点80点以上なら進めます。収益はゲーム内Gで、現実のお金ではありません。</p>
    <h3 class="label">利益目標（ゲーム内G）</h3><div class="row2">${BROADCAST_GOALS.map(n=>`<button class="btn ${Number(d.incomeGoal)===n?'on':''}" data-a="ssSet" data-k="incomeGoal" data-v="${n}">${n}G</button>`).join('')}</div><p class="small">目標値を変えても収入そのものは増えません。演出・方針・成長によって結果が決まります。</p>
    ${renderBroadcastForecast(st,d)}
    <h3 class="label">4手番の予定</h3><ol class="list">${req.map((r,i)=>`<li>${STREAM_TIMES[i]}：「${esc(STREAM_ACTS[r].req)}」→ ${esc(STREAM_ACTS[r].name)}</li>`).join("")}</ol>
    <p class="small">同じ演出を繰り返さず、街の魅力と視聴者の声を大切にしましょう。</p>${retryDescription(st,curHub())}
    <button class="btn primary wide" data-a="streamStart">配信を始める</button>`;
}

