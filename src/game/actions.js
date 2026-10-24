/* ===== 操作の受付 ===== */
const ACT = {
  regionalPref(el){if(G.sheet!=="regionalGuide"||!REGIONAL_BY_PREF[el.dataset.v]&&el.dataset.v!=='KY17')return;G.sheetData={...G.sheetData,regionalPref:el.dataset.v};render();drawMiniSprites();},
  broadcastSuggest(){if(G.sheet!=='streamSetup'||!G.st)return;const d=G.sheetData,p=broadcastForecast(G.st,d).find(x=>x.policy===d.policy)||broadcastForecast(G.st,d)[1],m=p.scenarios[1];G.sheetData={...d,viewerGoal:broadcastGoalFor(m.viewers),incomeGoal:broadcastGoalFor(m.net)};render();},
  broadcastReuse(){if(G.sheet!=='streamSetup'||!G.st)return;const r=G.st.broadcastStats?.history?.[0];if(!r)return;G.sheetData={...G.sheetData,policy:r.policy,theme:r.theme,style:r.style,viewerGoal:r.goal,incomeGoal:r.incomeGoal};render();},
  broadcastFilter(el){if(G.sheet!=='broadcastHistory'||!['all','passed','failed'].includes(el.dataset.v))return;G.sheetData={...G.sheetData,broadcastFilter:el.dataset.v};render();},
  managePerson(el){if(!['status','equip','shop'].includes(G.sheet)||!G.st.roster.includes(el.dataset.v))return;G.sheetData={...G.sheetData,cid:el.dataset.v,eqChoice:null,eqKey:null,notice:null,uiPage:0};render();},
  manageStatusTab(el){if(G.sheet!=='status'||!['stats','skills','profile','job'].includes(el.dataset.v))return;G.sheetData={...G.sheetData,uiTab:el.dataset.v,uiQuery:'',uiFilter:'all',uiPage:0};render();},
  manageEquipTab(el){if(G.sheet!=='equip'||!['characters','stock'].includes(el.dataset.v))return;G.sheetData={equipTab:el.dataset.v,uiQuery:'',uiFilter:'all',uiPage:0};render();},
  manageSlot(el){if(G.sheet!=='equip'||!['all','w','a','acc'].includes(el.dataset.v)||el.dataset.v==='all'&&G.sheetData.equipTab!=='stock')return;G.sheetData={...G.sheetData,slot:el.dataset.v,eqChoice:null,eqKey:null,notice:null,uiPage:0};render();},
  manageSearch(){if(!['status','equip','shop'].includes(G.sheet))return;const query=($('#manageQuery')?.value||'').slice(0,60),filter=$('#manageFilter')?.value||'all';if(!['all','known','locked','ultra','ultimate','usable','free','shared','w','a','acc','afford','heal','attack','sellable'].includes(filter))return;G.sheetData={...G.sheetData,uiQuery:query,uiFilter:filter,uiPage:0};render();},
  manageClear(){if(!['status','equip','shop'].includes(G.sheet))return;G.sheetData={...G.sheetData,uiQuery:'',uiFilter:'all',uiPage:0};render();},
  managePage(el){if(!['status','equip','shop'].includes(G.sheet))return;const d=G.sheetData,r=G.sheet==='shop'?shopResults(G.st,d):G.sheet==='equip'?equipmentResults(G.st,d):manageSkills(G.st,manageCid(),d),page=Number(el.dataset.v);if(!Number.isInteger(page)||page<0||page>=r.pages)return;G.sheetData={...d,uiPage:page};render();},
  manageJobs(){if(G.sheet==='status')openSheet('party',{cid:manageCid(),view:'job'});},
  manageEquipOpen(el){if(G.sheet!=='status'||!['w','a','acc'].includes(el.dataset.v))return;openSheet('equip',{cid:manageCid(),slot:el.dataset.v,uiFilter:'usable'});},
  equipStock(el){if(G.sheet!=='equip'||!EQUIP[el.dataset.v]||availableCount(G.st,el.dataset.v)<=0)return;G.sheetData={...G.sheetData,stock:el.dataset.v,confirmDrop:false};render();},
  equipChoose(el){const st=G.st,d=G.sheetData,id=el.dataset.v;if(G.sheet!=='equip'||!d.cid||!['w','a','acc'].includes(d.slot)||id!=='_off'&&(!EQUIP[id]||EQUIP[id].slot!==d.slot||(st.owned[id]||0)<=0))return;const p=equipmentChange(st,manageCid(st,d),d.slot,id==='_off'?null:id);if(!p.nx)return;G.sheetData={...d,eqChoice:id,eqKey:p.key};render();},
  equipApply(){const st=G.st,d=G.sheetData;if(G.sheet!=='equip'||!d.eqChoice)return;const cid=manageCid(st,d),id=d.eqChoice==='_off'?null:d.eqChoice,p=equipmentChange(st,cid,d.slot,id);if(p.reason||d.eqKey!==p.key)return toast(p.reason||'状態が変わりました。候補から選び直してください。');ACT.setEquip({dataset:{c:cid,s:d.slot,v:id||''}});if(st.equip[cid][d.slot]!==id)return;const message=charName(st,cid)+'の'+EQ_SLOT_NAME[d.slot]+'を'+(id?EQUIP[id].name:'装備なし')+'に変更しました。',top=SHEET_NAV.frames[SHEET_NAV.frames.length-1];if(top?.sheet==='equip'&&top.data.cid===d.cid&&top.data.slot===d.slot&&!top.data.eqChoice){SHEET_NAV.frames.pop();restoreSheetFrame({...top,data:{...top.data,notice:message}});}else{G.sheetData={...d,eqChoice:null,eqKey:null,notice:message};render();}},

  storyOpen(el){const c=NARRATIVE_CASES.find(c=>c.id===el.dataset.v);if(c&&(hubUnlocked(G.st,c.hub)||G.st.visitedHubs.includes(c.hub)||caseRecord(G.st,c.id)))openSheet('storyJournal',{caseId:c.id});},
  storyBegin(el){storyBegin(el.dataset.v);},storyInspect(el){storyInspect(el.dataset.v,Number(el.dataset.i));},storyAnswer(el){storyAnswer(el.dataset.v,Number(el.dataset.i));},storyUse(el){storyConclude(el.dataset.v,el.dataset.route);},
  storyFilter(el){if(['here','main','sub','done','all'].includes(el.dataset.v))openSheet('storyJournal',{storyFilter:el.dataset.v});},storyPage(el){G.sheetData.storyPage=Math.max(0,Number(el.dataset.v)||0);render();},
  eventKind(el){if(['all','clue','prop','memory'].includes(el.dataset.v))openSheet('eventItems',{eventKind:el.dataset.v});},eventPage(el){G.sheetData.eventPage=Math.max(0,Number(el.dataset.v)||0);render();},
  storyReplay(el){const c=NARRATIVE_CASES.find(c=>c.id===el.dataset.v);if(c&&caseRecord(G.st,c.id)?.done)say(storyResolutionLines(G.st,c));},
  storyRelations(el){if(knownRelationshipPeople(G.st).some(p=>p.id==='npc:'+el.dataset.v))openSheet('relationships',{person:'npc:'+el.dataset.v,peopleMode:'npc'});},
  storyForNpc(el){const c=NARRATIVE_CASES.find(c=>c.cast.includes(el.dataset.v)&&!caseRecord(G.st,c.id)?.done&&(hubUnlocked(G.st,c.hub)||G.st.visitedHubs.includes(c.hub)))||NARRATIVE_CASES.find(c=>c.cast.includes(el.dataset.v)&&caseRecord(G.st,c.id));if(c)openSheet('storyJournal',{caseId:c.id});else openSheet('storyJournal',{storyFilter:'all'});},
  careerBegin(el){careerBegin(el.dataset.v);},careerPick(el){careerPick(el.dataset.v,Number(el.dataset.step),el.dataset.token);},
  geoSelect(el){geographySelect(el.dataset.v);},geoMove(el){geographyMove(el.dataset.v);},geoPage(el){G.sheetData.geoPage=Math.max(0,Number(el.dataset.v)||0);render();},
  relationFocus(el){if(!knownRelationshipPeople(G.st).some(p=>p.id===el.dataset.v))return;G.sheetData.person=el.dataset.v;G.sheetData.relationPage=0;render();},
  relationPage(el){G.sheetData.relationPage=Math.max(0,Number(el.dataset.v)||0);render();},
  relationMode(el){G.sheetData.peopleMode=['all','npc'].includes(el.dataset.v)?el.dataset.v:'main';G.sheetData.peoplePage=0;G.sheetData.relationPage=0;if(el.dataset.v==='npc'){const all=knownRelationshipPeople(G.st),edge=relationshipEdges(G.st,all).find(e=>e.a.startsWith('npc:')&&e.b.startsWith('npc:'));if(edge)G.sheetData.person=edge.a;else{const p=all.find(p=>p.npc);if(p)G.sheetData.person=p.id;}}render();},
  peoplePage(el){G.sheetData.peoplePage=Math.max(0,Number(el.dataset.v)||0);render();},
  characterStoryOpen(el){if(!G.st.roster.includes(el.dataset.c))return;openSheet('characterStories',{cid:el.dataset.c});},
  characterEpisode(el){playCharacterEpisode(el.dataset.c,Number(el.dataset.v));},
  relationshipChoose(el){chooseRelationship(el.dataset.v);},
  railGo(el){const to=el.dataset.v;if(!stationNear(G.st)||!stationDestinations(G.st).includes(to))return;openSheet("railConfirm",{to});},
  railBoard(el){railTravel(G.st,el.dataset.v);},
  supportQuick(el){if(G.auto||!G.st.run||G.st.run.state!=="input"||!["meter","family"].includes(el.dataset.v))return;const a=G.st.run.party.find(m=>m.hp>0&&!m.acted);if(!a)return;G.cmd={actor:a.pos,type:"other",o:el.dataset.v};render();},
  questFilter(el){if(!['recommended','active','all','complete'].includes(el.dataset.v))return;G.sheetData.questFilter=el.dataset.v;G.sheetData.questFocus=null;render();},
  questAbandonPrompt(el){const id=el.dataset.v;if(!QUESTS[id]||!["active","bossReady"].includes(G.st.quests[id]))return;openSheet("questAbandon",{id});},
  questDetail(el){G.sheetData.questFocus=G.sheetData.questFocus===el.dataset.v?null:el.dataset.v;render();},
  townEvent(){const t=townChange(G.st,curHub());if(!t||t.phase<1)return;openSheet("townEvent");},
  townResolve(el){const st=G.st,hub=curHub(),t=townChange(st,hub);if(!t||t.phase<1||!["quiet","live"].includes(el.dataset.v)||(st.townChoices||{})[hub])return;st.townChoices=st.townChoices||{};st.townChoices[hub]=el.dataset.v;st.tickets+=1;commit();G.sheet=null;render();say([["",t.title+"："+t.text],["",el.dataset.v==="quiet"?"住民の声を短く録り、街に声の展示を残した。静かに楽しむ人が集まり始めた。":"住民が交代で話す交流会を開いた。初めて会う人同士が挨拶を交わし始めた。"],["","街の協力へのお礼にチケットを1枚受け取った。"]]);},
  newGame(){ G.newGame={name:"",gender:null,composing:false,step:1}; G.screen="new"; render(); },
  pickGender(el){ G.newGame.gender=el.dataset.v; const inp=$("#nameInput"); if(inp) G.newGame.name=inp.value; render(); },
  newNext(){ const inp=$("#nameInput"); if(inp) G.newGame.name=inp.value; const v=validateName(G.newGame.name); if(!v.ok) return toast(v.errors[0]); if(!G.newGame.gender) return toast("性別を選んでください。"); if(!G.newGame.career) return toast("職歴を選んでください。"); G.newGame.name=v.value; G.newGame.step="h"; render(); },
  pickHGender(el){ G.newGame.hgender=el.dataset.v; const inp=$("#nameInput"); if(inp) G.newGame.hname=inp.value; render(); },
  newNextH(){ const n=G.newGame; const inp=$("#nameInput"); if(inp) n.hname=inp.value; const v=validateName(n.hname||""); if(!v.ok) return toast(v.errors[0]); if(v.value===validateName(n.name).value) return toast("主人公と同じ名前は使えません。"); if(!n.hgender) return toast("性別を選んでください。"); n.hname=v.value; n.step=2; render(); },
  newBackH(){ G.newGame.step="h"; render(); },
  newBack(){ G.newGame.step=1; render(); },
  async startGame(el){
    if(G.starting) return; G.starting=true; el.disabled=true;
    const v=validateName(G.newGame.name); if(!v.ok){ G.starting=false; return toast(v.errors[0]); }
    const snd=soundIsOn(); const hv=validateName(G.newGame.hname||""); if(!hv.ok||!G.newGame.hgender){ G.starting=false; G.newGame.step="h"; render(); return toast("ヒロイン役の名前と性別を決めてください。"); } G.st=newGame(v.value, G.newGame.gender, {name:hv.value, gender:G.newGame.hgender}, G.newGame.career||"社会福祉士"); if(G.tmpSettings) Object.assign(G.st.settings,G.tmpSettings); G.st.settings.sound=snd; G.st.settings.soundV=2; G.st.settings.padSide=padSide(); G.st.settings.autoAdvance=autoMode(); G.soundWant=null;
    await commit(); G.starting=false; G.hasSave=true;
    G.screen="explore"; exploreBgm(); render(); playScene("HS00");
  },
  async continue(){ const s=await loadSave(); if(!s) return toast("記録が見つかりません。"); G.st=migrate(s.state); G.soundWant=null; if(G.st.settings.sound===false&&SND.on) SND.setOn(false); else if(G.st.settings.sound!==false&&!SND.on) SND.setOn(true); if(s.fromPrev) toast("最新の記録が壊れていたため、1つ前の世代から復元しました。"); else if(s.src==="クラウド") toast("クラウドに保存した記録から再開しました。");
    commit();
    if(G.st.run){ G.screen="battle"; SND.play(G.st.run.enemies.some(e=>e.boss)?"boss":"battle"); } else if(G.st.stream){ G.screen="stream"; SND.play("stream"); } else { G.screen="explore"; exploreBgm(); }
    render(); if(G.screen==="explore"){if(G.st.careerSession)openSheet("careerTour");else openPendingName();} },
  async toTitle(){ await commit(); G.sheet=null; G.screen="title"; G.dlg=null; SND.play("title"); render(); },
  trialStart(el){startChallenge(el.dataset.v);},
  festivalClaim(){claimFestival();},
  renameOpen(el){if(G.st.run||G.st.stream)return toast("名前は戦闘・配信の終了後に変更できます。");if(!G.st.roster.includes(el.dataset.c))return;openSheet("rename",{cid:el.dataset.c,back:"status"});},
  renameSave(){const r=setCharacterName(G.st,G.sheetData.cid,($("#renameInput")||{}).value||"");if(!r.ok)return toast(r.reason);finishRename();SND.sfx("ok");},
  renameDefault(){const cid=G.sheetData.cid;if(cid!=="hero"&&cid!=="moe"){const r=setCharacterName(G.st,cid,CHARS[cid].name);if(!r.ok)return toast(r.reason);delete G.st.names[cid];finishRename();}},
  mapZoom(el){const st=G.st;if(G.screen!=="explore"||G.sheet||G.dlg)return;st.settings.mapZoom=Math.max(1,Math.min(3,(st.settings.mapZoom||2)+Number(el.dataset.v)));G.walk.path=[];G.walk.pending=null;G.walk.prog=0;commit();render();},
  battleCommandOpen(el){const run=battleInputRun();if(!run||G.auto)return;mobileBattleActor(run);G.battleCommand=true;G.battlePicker=null;G.cursorSig=null;render();},
  battleCommandClose(){G.battleCommand=false;G.battlePicker=null;G.cursorSig="battleCommandOpen||||||";render();},
  mobileMember(el){if(G.screen!=="battle"||!G.st?.run)return;const run=G.st?.run,m=run?.party[Number(el.dataset.i)];if(!m)return;if(m.hp<=0||m.acted||G.auto)return openMobileBattleDetail("growth",m.name);G.cmd={actor:m.pos};G.battleCommand=true;G.cursorSig=null;render();},
  battlePanel(){if(G.screen!=="battle"||!G.st?.run)return;const p=mobilePlan(G.st.run),pages=Math.ceil(G.st.run.party.length/p.memberPage);if(G.battlePanel!=="party"){if((G.battleFoePage||0)+1<Math.ceil(G.st.run.enemies.length/p.foePage))G.battleFoePage=(G.battleFoePage||0)+1;else{G.battlePanel="party";G.battleMemberPage=0;}}else if((G.battleMemberPage||0)+1<pages)G.battleMemberPage++;else{G.battlePanel="enemies";G.battleMemberPage=0;G.battleFoePage=0;}render();},
  mobileCmdType(el){if(!battleInputRun()||G.auto)return;const t=el.dataset.v;if(t&&!MOBILE_COMMANDS.some(([k])=>k===t))return;G.cmd={actor:G.cmd.actor,type:t};G.battleCommand=true;G.battlePicker=null;if(t==="meter"||t==="family")G.cmd={actor:G.cmd.actor,type:"other",o:t};if(t==="skill"||t==="item"){G.battlePicker=t;G.battlePickerQuery="";G.battlePickerFilter="all";G.battlePickerPage=0;}G.cursorSig=null;render();},
  battlePickerOpen(el){if(!battleInputRun()||G.auto||!['skill','item'].includes(el.dataset.v))return;G.battlePicker=el.dataset.v;G.battlePickerQuery="";G.battlePickerFilter="all";G.battlePickerPage=0;render();},
  battlePickerClose(){G.battlePicker=null;render();},
  battlePickerSelect(el){const run=battleInputRun();if(!run||G.auto||!['skill','item'].includes(G.battlePicker))return;const a=mobileBattleActor(run),id=el.dataset.v;if(G.battlePicker==="skill"){if(!mobileSkillCandidates(run,a).some(s=>s.id===id))return;G.cmd.skill=id;}else{if(!(run.bag||[]).some(it=>it.id===id&&it.n>0&&ITEMS[id]&&canUseJobItem(a.job,a.R,ITEMS[id])))return;G.cmd.item=id;}delete G.cmd.ally;delete G.cmd.target;delete G.cmd.mode;G.battlePicker=null;G.cursorSig=null;render();},
  battlePickerSearch(){G.battlePickerQuery=($("#battleSearch")?.value||"").slice(0,60);G.battlePickerPage=0;render();},
  battlePickerPage(el){const n=Number(el.dataset.v);if(!Number.isInteger(n)||n<0||n>=G.battlePickerPages)return;G.battlePickerPage=n;render();},
  mobileInspect(el){ACT.battleInspect(el);},
  mobileEnemyInfo(el){if(G.screen!=="battle"||!G.st?.run)return;const e=G.st.run.enemies.find(e=>e.slot===Number(el.dataset.v));openMobileBattleDetail("foes",e&&(e.fullName||e.name));},
  mobileAuto(){if(G.readOnly||G.screen!=="battle"||G.st?.run?.state!=="input"||G.dlg||G.sheet&&G.sheet!=="mobileBattleMenu")return;G.sheet=null;G.battleCommand=false;G.battlePicker=null;if(G.auto)ACT.autoOff();else ACT.autoOn();},
  mobileConfirm(el){if(!battleInputRun()||G.auto||G.mobileConfirmUntil>Date.now())return;const a=mobileBattleActor(G.st.run),act=buildAct(a);if(!act)return;const valid=planAction(G.st.run,a.pos,act);if(!valid.ok){toast(valid.reason);render();return;}G.mobileConfirmUntil=Date.now()+280;if(el)el.disabled=true;G.battleCommand=false;G.battlePicker=null;confirmAct();if(G.st?.run?.state==="input")G.cursorSig="battleCommandOpen||||||";},
  systemHelp(){openSystemGuide();},
  guideSearch(){G.sheetData={...G.sheetData,q:($("#systemQuery")?.value||"").slice(0,100),cat:"all",page:0};render();},
  guideCategory(el){if(!SYSTEM_GUIDE_CATEGORIES[el.dataset.v])return;G.sheetData={...G.sheetData,cat:el.dataset.v,page:0};render();},
  guidePage(el){if(G.sheet!=="systemGuide")return;const page=Number(el.dataset.v),r=systemGuideResults(G.sheetData);if(!Number.isInteger(page)||page<0||page>=r.pages)return;G.sheetData={...G.sheetData,page};render();const e=$(".sheet");if(e)e.scrollTop=0;},
  openSheet(el){ if(el.dataset.k==="collection")return openCollectionFromLink(el);if(el.dataset.k==="systemGuide")return openSystemGuide();if(el.dataset.k==="items"||el.dataset.k==="equip") keepFlush(); openSheet(el.dataset.k); }, closeSheet(){ closeSheet(); }, returnToPlay(){returnToPlay();},
  itemView(el){ G.sheetData={item:el.dataset.v||null}; render(); },
  itemUse(el){ const st=G.st, id=G.sheetData.item; const r=useItemField(st,id,el.dataset.c||null); if(!r.ok) return toast(r.reason); commit(); SND.sfx("heal"); if(bagCount(st.bag,id)<=0) G.sheetData={item:null}; render(); toast(r.log.join("・")); },
  itemDrop(el){ G.sheetData.confirmDrop=true; render(); },
  itemDropDo(el){ const st=G.st, id=G.sheetData.item; if(ITEMS[id].acq==="E") return toast("非売品は捨てられません。"); bagRemove(st.bag,id,1); keepFlush(); commit(); G.sheetData={item:bagCount(st.bag,id)?id:null}; render(); toast(`${ITEMS[id].name}を1個捨てた。`); },
  itemDropNo(){ G.sheetData.confirmDrop=false; render(); },
  dlgNext(){ const d=G.dlg; if(d.i<d.lines.length-1){ d.i++; render(); } else { G.dlg=null; render(); if(d.after) d.after(); } },
  dlgBack(){ if(G.dlg.i>0){ G.dlg.i--; render(); } },
  dlgSkip(){ const d=G.dlg; G.dlg=null; render(); if(d.after) d.after(); },
  step(el){ if(G.sheet||G.dlg) return; const d=+el.dataset.d; const st=G.st; const m=MAPS[st.mapId]; st.dir=d; const v=[[0,1],[0,-1],[-1,0],[1,0]][d];
    const nx=st.pos.x+v[0], ny=st.pos.y+v[1]; const o=objAt(m,nx,ny); if(o&&!o.walk&&m.mapScope!=='world') return interact(o); if(walkable(m,nx,ny)){ G.walk.path=[{x:nx,y:ny}]; G.walk.prog=0; } },
  stop(){ if(G.walk.path.length>1) G.walk.path=G.walk.path.slice(0,1); G.walk.pending=null; },
  interactId(el){ const o=MAPS[G.st.mapId].objects.find(x=>x.id===el.dataset.v); G.sheet=null; render(); interact(o); },
  guideTo(el){if(G.readOnly||G.screen!=='explore'||G.dlg)return;const o=mapGuideObjects().find(x=>x.id===el.dataset.v);if(!o)return;if(G.st.mapId==='WORLD'&&MAPS.WORLD.targets[o.id])return navigateWorldTarget(o.id);G.sheet=null;render();walkTo(o.x,o.y);},
  leaveCity(){leaveCity();},
  worldReturn(){if(G.st?.mapId==='WORLD')walkNationalTo(curHub());},
  doTravel(){walkNationalTo(G.sheetData.to);},
  worldGo(el){walkNationalTo(el.dataset.v);},
  worldNavigate(el){navigateWorldTarget(el.dataset.v);},
  worldResume(){if(G.st?.mapId==='WORLD'&&G.worldNavState===G.st&&G.worldNav)navigateWorldTarget(G.worldNav.id);},
  mapGuidanceToggle(){if(!G.st||G.readOnly||G.screen!=='explore')return;G.st.settings.mapGuidance=!mapGuidanceVisible();commit();render();},
  worldNavStop(){if(G.st?.mapId!=='WORLD')return;G.worldNav=null;G.walk.path=[];G.walk.pending=null;render();},
  doInn(el){ el.disabled=true; const st=G.st; const total=(INN_PRICE[curHub()]||10)*st.roster.length; if(st.gold<total) return toast("ゴールドが足りません。"); st.gold-=total; restoreAll(st); st.day++; keepFlush(); commit(); G.sheet=null; render(); SND.sfx("heal"); say([["",`${total}ゴールドを払って泊まった。`],["",`${st.day}日目の朝。全員のHPとMPが全回復した！`]]); },
  doRest(){ const st=G.st; st.day++; commit(); G.sheet=null; render(); toast(`${st.day}日目の朝。新しい一日が始まった。`); },
  acceptQuest(el){ const st=G.st, id=el.dataset.v,Q=QUESTS[id];if(!Q||st.quests[id]!=="available"||st.activeQuest||Q.hub!==curHub()||!isSafe()||st.run||st.stream)return toast("この依頼は今は受注できません。");
    st.quests[id]="active"; st.activeQuest=id; st.qprog[id]=st.qprog[id]||0; commit(); G.sheet=null; render();
    say([["",`依頼「${id} ${QUESTS[id].name}」を受けた。`],["もえ",QUESTS[id].main&&HUB_TEXT[QUESTS[id].hub]?HUB_TEXT[QUESTS[id].hub].accept:"一緒に考えよう。"],["",QUESTS[id].goal]]); },
  abandonQuest(el){ const st=G.st, id=el.dataset.v; st.quests[id]="available"; st.qprog[id]=0; st.activeQuest=null; G.sheet="quests";G.sheetData={};commit(); render(); toast("依頼を放棄した。受注費は戻りません。"); },
  bossGo(el){ startRegionalBoss(el.dataset.v); },
  pickActor(el){const run=battleInputRun();if(!run||G.auto)return;const i=Number(el.dataset.i),m=Number.isInteger(i)?run.party[i]:null;if(!m||m.hp<=0||m.acted)return; G.cmd={actor:i}; render(); },
  liveLogPage(el){const n=Number(el.dataset.v);if(Number.isInteger(n)&&n>=0&&n<G.liveLogPages){G.liveLogPage=n;if(G.auto){G.auto=false;G.autoWait=false;clearTimeout(G.autoT);}render();}},
  battleChoicePage(el){const n=Number(el.dataset.v);if(Number.isInteger(n)&&n>=0&&n<G.battleChoicePages){G.battleChoicePage=n;render();}},
  battleInspect(el){checkSheetNavigation();G.battleInspectReturn=G.sheet==="mobileBattleMenu"?{frame:captureSheetFrame(),frames:SHEET_NAV.frames.slice(),state:G.st,context:sheetNavContext()}:null;if(G.sheet==="mobileBattleMenu")G.sheet=null;G.battleReturnCursor=G.cursorSig;G.battleInspect=true;G.endPager=null;render();const group=el.dataset.v;if(G.endPager){const i=G.endPager.pages.findIndex(p=>p.group===group);if(i>=0){G.endPager.index=i;render();}}},
  battleInspectClose(){const prev=G.battleInspectReturn;G.battleInspectReturn=null;G.battleInspect=false;G.endPager=null;G.cursorSig=G.battleReturnCursor||null;if(prev&&prev.state===G.st&&prev.context===sheetNavContext()&&G.st?.run?.state==="input"){resetSheetNavigation();SHEET_NAV.frames=prev.frames;restoreSheetFrame(prev.frame);}else render();},
  cmdType(el){if(!battleInputRun()||G.auto)return;const t=el.dataset.v;if(!['attack','skill','item','guard','rest','family','meter','comment','other'].includes(t))return;G.cmd={actor:G.cmd.actor, type:t}; render(); },
  cmdSet(el){if(!battleInputRun()||G.auto)return;const k=el.dataset.k;if(!['target','ally','mode','item','skill','line','o'].includes(k))return;let v=el.dataset.v; if(k==="target"||k==="ally") v=+v; G.cmd[k]=v; if(k==="mode"||k==="item"||k==="skill"){ delete G.cmd.ally; delete G.cmd.target; } render(); },
  confirmAct(el){if(!battleInputRun()||G.auto)return;if(el)el.disabled=true;confirmAct();},
  autoOn(){const run=battleInputRun();if(!run||G.auto||!autoAllowed(run))return;stopBattleAutomation(); G.battleCommand=false;G.battlePicker=null;G.auto=true; G.autoLast=null; G.cursorSig="autoOff||||||"; render(); SND.sfx("ok"); queueAutoStep(G.st?.run,300); },
  autoNext(){if(!battleInputRun()||!G.auto||!G.autoWait)return; G.autoWait=false; G.cursorSig="autoOff||||||"; SND.sfx("ok"); autoStep(); },
  autoMode(){if(G.readOnly)return;const st=G.st; const nv=autoMode()==="tap"?"timer":"tap"; if(st){ st.settings.autoAdvance=nv; commit(); } else { G.tmpSettings=G.tmpSettings||{difficulty:"std",sound:soundPref(),reduceMotion:false}; G.tmpSettings.autoAdvance=nv; }
    try{ localStorage.setItem("tlr-kyushu-autoadv",nv); }catch(e){}
    if(G.auto){ if(nv==="timer"&&G.autoWait){ G.autoWait=false; G.cursorSig="autoOff||||||"; clearTimeout(G.autoT); queueAutoStep(G.st?.run,300); }
      else if(nv==="tap"&&!G.autoWait){clearTimeout(G.autoT);G.autoTicket=(G.autoTicket||0)+1; if(G.autoLast){ G.autoWait=true; G.cursorSig="autoNext||||||"; } else queueAutoStep(G.st?.run,300); } }
    render(); toast(nv==="tap"?"オートはタップで1手ずつ進みます。":"オートは一定時間で自動的に進みます。"); },
  autoOff(){if(G.readOnly||G.screen!=="battle"||G.st?.run?.state!=="input"||!G.auto)return;stopBattleAutomation();G.cmd={}; G.cursorSig=null; render(); SND.sfx("cancel"); toast("オートを中断しました。手動で操作できます。"); },
  toResult(){ toResult(); },
  resultDone(){ resultDone(); },
  resultDetails(){if(G.screen!=="result"||!G.st.lastResult)return;G.resultDetails=!G.resultDetails;G.endPager=null;render();},
  endPage(el){const p=G.endPager;if(!p||el.dataset.k!==p.key)return;const n=Number(el.dataset.v);if(!Number.isInteger(n)||n<0||n>=p.pages.length)return;p.index=n;G.cursorSig=n<p.pages.length-1?["endPage",p.key,String(n+1),"","","",""].join("|"):p.primary+"||||||";render();},
  defeatReturn(){const st=G.st,run=st?.run;if(G.readOnly||G.screen!=="battle"||!run||run.state!=="lost")return;stopBattleAutomation();G.sheet=null;G.battleInspect=false;G.cmd={}; if(run.bag) st.bag=clone(run.bag); st.run=null; const m=MAPS[run.returnPos.map],safe=run.returnPos.map==='WORLD'?(WORLD_NODES[run.hub]||WORLD_NODES.KY01).spawn:{x:m.safeAnchor[0],y:m.safeAnchor[1]}; st.mapId=run.returnPos.map; st.pos={...safe}; G.fol={...st.pos};
    const lost=run.kind==="challenge"?0:Math.floor(st.gold/2); st.gold-=lost; restoreAll(st); commit(); G.screen="explore"; exploreBgm(); render(); say([["",`安全な場所へ運ばれた。${run.kind==="challenge"?"特別挑戦の追加ペナルティはありません。":"所持ゴールドの半分（"+lost+"）を失った。"}`],["","全員のHPとMPが回復した。"]]); },
  retreat(){if(!battleInputRun())return;openSheet("retreat");},
  doRetreat(){const st=G.st,run=st?.run;if(G.readOnly||G.screen!=="battle"||G.sheet!=="retreat"||!run||run.state!=="input")return;stopBattleAutomation();G.battleInspect=false;G.cmd={}; storeVitals(st,run); if(run.bag) st.bag=clone(run.bag); st.run=null; st.mapId=run.returnPos.map; st.pos={x:run.returnPos.x,y:run.returnPos.y}; G.sheet=null; commit(); G.screen="explore"; exploreBgm(); render(); toast("撤退した。"); },
  pauseBattle(){if(!battleInputRun())return; commit(); openSheet("pause"); },
  noop(){},
  shareCopyUrl(){ copyText(shareUrl(),"URLをコピーしました。LINEやDMに貼り付けて送れます。"); },
  shareCopyMsg(){ copyText(shareMessage(),"紹介文とURLをコピーしました。"); },
  shareNative(){ try{ navigator.share({title:"トップライバーへの道", text:SHARE_TEXT, url:shareUrl()}).catch(e=>{ if(!e||e.name!=="AbortError") copyText(shareUrl(),"共有メニューが使えないため、URLをコピーしました。"); }); }catch(e){ copyText(shareUrl(),"共有メニューが使えないため、URLをコピーしました。"); } },
  moeTalk(){ G.moeLine=chatLine("moe"); commit(); render(); drawMiniSprites(); },
  audioLevel(el){const key=el.dataset.k,value=Number(el.dataset.v);if(!['bgm','sfx'].includes(key)||![0,0.35,0.65,1].includes(value))return;const m=audioMixSettings();m[key]=value;const settings=G.st?G.st.settings:(G.tmpSettings=G.tmpSettings||{});settings[key==='bgm'?'bgmVolume':'sfxVolume']=value;try{localStorage.setItem('tlr-audio-mix',JSON.stringify(m));}catch(e){}if(G.st)commit();SND.setMix(m.bgm,m.sfx);if(key==='sfx'&&value>0)SND.sfx('ok');render();},
  setOpt(el){ const k=el.dataset.k; let v=el.dataset.v; if(v==="true")v=true; if(v==="false")v=false; const s=G.st?G.st.settings:(G.tmpSettings=G.tmpSettings||{difficulty:"std",sound:soundPref(),reduceMotion:false}); s[k]=v; if(G.st) commit(); render();
    const msg = k==="difficulty"?`難易度を「${DIFFICULTY[v].name}」にしました。`: k==="reduceMotion"?`演出を減らす：${v?"ON":"OFF"}にしました。`: k==="dock"?`ジョイコントローラーを${v?"表示":"非表示に"}しました。`: k==="moveSpeed"?`移動の速さを「${v==="fast"?"速い":"ふつう"}」にしました。`:""; if(msg) toast(msg); SND.sfx("ok"); },
  calibLift(){ VFIT.calibrate(false); },
  setLift(el){ const v=el.dataset.v==="auto"?"auto":(isNaN(+el.dataset.v)?"auto":String(Math.max(0,Math.min(400,Math.round(+el.dataset.v))))); try{ localStorage.setItem("tlr-kyushu-lift",v); }catch(e){} VFIT.apply(); render(); toast(v==="auto"?"操作パネルの高さを自動にしました。":"操作パネルを上に移動しました。"); },
  setPad(el){ const v=el.dataset.v==="left"?"left":"right"; if(G.st){ G.st.settings.padSide=v; commit(); } else { G.tmpSettings=G.tmpSettings||{difficulty:"std",sound:soundPref(),reduceMotion:false}; G.tmpSettings.padSide=v; }
    try{ localStorage.setItem("tlr-kyushu-pad",v); }catch(e){} render(); toast(v==="right"?"スティックを右、「戻」ボタンを左にしました。":"スティックを左、「戻」ボタンを右にしました。"); },
  toggleSound(){ const want=!soundIsOn(); const on=SND.setOn(want); G.soundWant=want; try{ localStorage.setItem("tlr-kyushu-sound", want?"1":"0"); }catch(e){}
    if(G.st){ G.st.settings.sound=want; commit(); } if(G.tmpSettings) G.tmpSettings.sound=want;
    if(want&&!on) toast("この端末では音を出せませんでした。消音で続けます。"); render(); },
  async saveNow(){ await commit(); render(); toast(G.localOK?"この端末にセーブしました。":G.saveStatus); },
  showBackup(){ G.sheetData.backup=JSON.stringify({app:"toplivermichi-kyushu",version:GAME_VERSION,state:G.st}); render(); },
  copyBackup(){ const t=$("#backupOut"); try{ navigator.clipboard.writeText(t.value).then(()=>toast("コピーしました。メモ帳などへ貼り付けて保管してください。"),()=>{t.select();toast("文字列を選択しました。コピーしてください。");}); }catch(e){ t.select(); toast("文字列を選択しました。コピーしてください。"); } },
  async restore(){ const t=$("#restoreIn"); const raw=(t.value||"").trim(); if(raw.length>5000000) return toast("大きすぎます（上限5,000,000バイト）。");
    try{ const o=JSON.parse(raw); if(o.app!=="toplivermichi-kyushu"||!o.state||!o.state.profile)throw 0;if(!currentSaveState(o.state))return toast("全ユーザー初期化前のバックアップは復元できません。はじめから開始してください。");validateState(o.state);
      G.st=migrate(o.state); await commit(); G.hasSave=true; G.sheet=null; G.screen=G.st.run?"battle":G.st.stream?"stream":"explore"; if(G.screen==="battle")SND.play(G.st.run.enemies.some(e=>e.boss)?"boss":"battle");else if(G.screen==="stream")SND.play("stream");else exploreBgm(); render(); if(G.screen==="explore"){if(G.st.careerSession)openSheet("careerTour");else openPendingName();}toast("記録を読み込みました。"); }
    catch(e){ toast("読み込めませんでした。文字列が途中で切れていないか確認してください。"); } },
  partyView(el){ G.sheetData={cid:el.dataset.c||null, view:el.dataset.v||""}; render(); drawMiniSprites(); },
  specialGuide(el){openSpecialGuide(el.dataset.v);},
  specialEnter(el){if(!enterSpecial(el.dataset.v))toast('解放条件と現在の状態を確認してください。');},
  specialBossGo(el){const st=G.st,s=SPECIAL_STAGES.find(s=>s.boss===el.dataset.v);if(battleEntryReason(st)||streamPending()||!s||st.mapId!==s.id||specialReason(st,s))return toast('特設エリア内で挑戦してください。');startBattle(createBossRun(st,s.boss));},
  familyParty(){const st=G.st;if(st.run||st.stream||streamPending()||!isSafe()||!MAPS[st.mapId].objects.some(o=>o.type==='studio'&&Math.abs(o.x-st.pos.x)+Math.abs(o.y-st.pos.y)<=1))return toast('街のファミリー施設で利用してください。');G.familyRosterMap=st.mapId;openSheet('party');},
  partyReplaceSlot(el){const n=Number(el.dataset.v);if(!Number.isInteger(n)||!G.st.party[n]||requiredCompanion(G.st.party[n]))return;G.sheetData.replaceSlot=n;render();},
  partyUp(el){if(changeCompanions(G.st,'up',el.dataset.v)){commit();render();}else toast('同行者の変更は街のファミリー施設で行います。');},
  partyOut(el){if(changeCompanions(G.st,'out',el.dataset.v)){commit();render();}else toast('同行者の変更は街のファミリー施設で行います。');},
  partyIn(el){if(changeCompanions(G.st,'in',el.dataset.v)){commit();render();}else toast('ファミリー施設で、交代する同行者を選んでください。');},
  helloWorkMode(el){if(G.sheet!=="helloWork")return;G.sheetData={...G.sheetData,mode:el.dataset.v==="change"?"change":"events",page:0,job:null};render();},
  helloWorkCharacter(el){if(G.sheet!=="helloWork"||!G.st.roster.includes(el.dataset.v))return;G.sheetData={...G.sheetData,cid:el.dataset.v};render();},
  helloWorkJob(el){if(G.sheet!=="helloWork"||!JOBS[el.dataset.v])return;G.sheetData={...G.sheetData,job:el.dataset.v};render();const e=$(".sheet");if(e)e.scrollTop=0;},
  helloWorkSearch(){if(G.sheet!=="helloWork")return;G.sheetData={...G.sheetData,q:($("#helloWorkSearch")?.value||"").slice(0,60),page:0};render();},
  helloWorkPage(el){if(G.sheet!=="helloWork")return;const r=helloWorkResults(G.st,G.sheetData),page=Number(el.dataset.v);if(!Number.isInteger(page)||page<0||page>=r.pages)return;G.sheetData={...G.sheetData,page};render();const e=$(".sheet");if(e)e.scrollTop=0;},
  helloWorkGuide(){const st=G.st,m=st&&MAPS[st.mapId],o=m?.objects.find(o=>o.type==="helloWork");if(G.screen!=="explore"||st.run||st.stream||!o)return toast("街の道しるべからハローワークを探してください。");G.sheet=null;render();walkTo(o.x,o.y);},
  jobEventStart(el){if(jobEventStart(G.st,el.dataset.v)){commit();render();}else toast("ハローワークで未クリアの職業イベントを選んでください。");},
  jobEventPick(el){const st=G.st,j=el.dataset.j;if(jobEventPick(st,j,Number(el.dataset.s),Number(el.dataset.v))){commit();render();if(jobUnlocked(st,j))toast(JOBS[j].name+"への転職が仲間全員に解放されました。");}},
  jobEventCancel(){if(G.readOnly||!atHelloWork(G.st)||!G.st.jobEvent)return;G.st.jobEvent=null;commit();render();},
  setJob(el){ const st=G.st,cid=el.dataset.c,j=el.dataset.v;const reason=jobChangeReason(st,cid,j);if(reason)return toast(reason);rememberSkills(st,cid,characterLevel(st,cid)); if(!eqChangeOk(st,t=>{ t.equip[cid]=previewEquipFor(st,cid,j); })) return toast(`ジョブ専用の装備を外すと、装備品の持ち物が${EQ_KINDS}種類を超えます。先に捨てるか売ってください。`); st.jobs[cid]=j; st.equip[cid]=previewEquipFor(st,cid,j);rememberSkills(st,cid,characterLevel(st,cid));
    for(const [s,id] of [["w","CW01"],["a","CA01"]]) if(!st.equip[cid][s]&&availableCount(st,id)>0) st.equip[cid][s]=id;
    commit(); G.sheetData={...G.sheetData,mode:"change",cid,job:j}; render(); drawMiniSprites(); toast(`${charName(st,cid)}のジョブを${JOBS[j].name}にした。`); },
  setEquip(el){ const st=G.st,cid=el.dataset.c,s=el.dataset.s,id=el.dataset.v||null;if(G.readOnly||st.run||st.stream||streamPending()||!isSafe())return toast("安全地帯で装備を変更してください。");if(!st.roster.includes(cid)||!["w","a","acc"].includes(s)||id&&(!EQUIP[id]||EQUIP[id].slot!==s||!canEquipC(st,cid,EQUIP[id])))return toast("この装備は職業・熟練度・部位の条件を満たしていません。");if(st.equip[cid][s]===id)return toast("装備は変更済みです。");let took="",donor=null;if(id&&availableCount(st,id)<=0){donor=st.roster.find(c=>c!==cid&&st.equip[c]&&st.equip[c][s]===id);if(!donor)return toast("未装備の在庫がありません。");took=charName(st,donor);}
    if(!eqChangeOk(st,t=>{if(donor)t.equip[donor][s]=null;t.equip[cid][s]=id;})) return toast(`装備品の持ち物が${EQ_KINDS}種類でいっぱいのため外せません。いらない装備品を捨てるか売ってください。`);
    const old=st.equip[cid][s];if(donor)st.equip[donor][s]=null;st.equip[cid][s]=id; commit(); SND.sfx("equip");
    if(G.sheet==="equip") G.sheetData={cid}; else G.sheetData={cid,view:""};
    render(); drawMiniSprites(); toast(id?(took?`${took}から付け替えて、${charName(st,cid)}は${EQUIP[id].name}を装備した。`:`${charName(st,cid)}は${EQUIP[id].name}を装備した。`):`${charName(st,cid)}は${EQUIP[old].name}を外した。`); },
  eqSort(el){if(!['type','job','power','price'].includes(el.dataset.v))return;G.eqSort=el.dataset.v;if(['equip','shop'].includes(G.sheet))G.sheetData={...G.sheetData,uiSort:el.dataset.v,uiPage:0};render();drawMiniSprites();},
  itSort(el){if(!['type','stars','count'].includes(el.dataset.v))return;G.itSort=el.dataset.v;if(G.sheet==='shop')G.sheetData={...G.sheetData,uiItemSort:el.dataset.v,uiPage:0};render();},
  equipView(el){ try{ if(keepFlush()) commit(); }catch(e){} const v=el.dataset; G.sheetData={cid:v.c||null, slot:v.s||null, stock:v.v||null}; render(); drawMiniSprites(); const sh=$(".sheet"); if(sh) sh.scrollTop=0; },
  eqDrop(){const st=G.st,d=G.sheetData;if(G.sheet!=='equip'||G.readOnly||!d.stock||!EQUIP[d.stock]||availableCount(st,d.stock)<=0||st.run||st.stream||!isSafe()||streamPending())return;G.sheetData.confirmDrop=true;render();},
  eqDropNo(){ G.sheetData.confirmDrop=false; render(); },
  eqDropDo(){const st=G.st,d=G.sheetData,id=d.stock;if(G.sheet!=='equip'||!d.confirmDrop||G.readOnly||!EQUIP[id]||availableCount(st,id)<=0||st.run||st.stream||!isSafe()||streamPending())return;st.owned[id]-=1;const moved=keepFlush();commit();const notice=EQUIP[id].name+'を1個捨てました。'+(moved?' 預かり所から'+moved+'個受け取りました。':'');if(availableCount(st,id)>0){G.sheetData={...d,confirmDrop:false,notice};render();}else{let index=-1;for(let i=SHEET_NAV.frames.length-1;i>=0;i--){const f=SHEET_NAV.frames[i];if(f.sheet==='equip'&&!f.data.stock&&(f.data.equipTab==='stock'||!f.data.cid)){index=i;break;}}if(index>=0){const f=SHEET_NAV.frames[index];SHEET_NAV.frames.length=index;restoreSheetFrame({...f,data:{...f.data,notice}});}else{G.sheetData={equipTab:'stock',notice};render();}}},
  setSupport(el){ G.st.support=el.dataset.v||null; commit(); render(); },
  collectionLocate(el){if(G.sheet!=='collection'||!Object.prototype.hasOwnProperty.call(COLLECTION_LABELS,el.dataset.v))return;const q=($('#collectionQuery')?.value??G.sheetData.cq??'').slice(0,60);const memory=collectionViewMemory();memory[collectionResults(G.st,G.sheetData).tab]={...G.sheetData};G.sheetData={ctab:el.dataset.v,cq:q,cdensity:G.sheetData.cdensity,csize:G.sheetData.csize,csort:G.sheetData.csort,cpage:0};render();collectionMoveToList();},
  collectionTab(el){if(G.sheet!=='collection'||!Object.prototype.hasOwnProperty.call(COLLECTION_LABELS,el.dataset.v))return;const memory=collectionViewMemory(),current=collectionResults(G.st,G.sheetData).tab;memory[current]={...G.sheetData};G.sheetData={...(memory[el.dataset.v]||{}),ctab:el.dataset.v,cdensity:G.sheetData.cdensity};render();},
  collectionPage(el){if(G.sheet!=='collection')return;const r=collectionResults(G.st,G.sheetData),n=Number(el.dataset.v);if(!Number.isInteger(n)||n<0||n>=r.pages)return;G.sheetData.cpage=n;render();collectionMoveToList();},
  collectionSearch(){if(G.sheet!=='collection')return;G.sheetData={...G.sheetData,cq:($('#collectionQuery')?.value||'').slice(0,60),cpage:0};render();collectionMoveToList();},
  collectionClear(){if(G.sheet!=='collection')return;G.sheetData={ctab:G.sheetData.ctab||'enemy',cdensity:G.sheetData.cdensity,csize:G.sheetData.csize,csort:G.sheetData.csort};render();},
  collectionFilter(el){if(G.sheet!=='collection'||!['cstatus','cpref','ctype','csort','csize'].includes(el.dataset.k))return;G.sheetData={...G.sheetData,cq:($('#collectionQuery')?.value??G.sheetData.cq??'').slice(0,60),[el.dataset.k]:el.dataset.v,cpage:0,cfilters:!!$('[data-collection-fold]')?.open};render();},
  collectionDensity(el){if(G.sheet!=='collection'||!['compact','comfortable'].includes(el.dataset.v))return;const r=collectionResults(G.st,G.sheetData),first=r.page*r.size;G.sheetData.cdensity=el.dataset.v;const next=collectionResults(G.st,G.sheetData);G.sheetData.cpage=Math.floor(first/next.size);render();},
  collectionJump(){if(G.sheet!=='collection')return;const n=Number($('#collectionPageNumber')?.value),r=collectionResults(G.st,G.sheetData);if(!Number.isInteger(n)||n<1||n>r.pages)return toast('1～'+r.pages+'のページ番号を指定してください。');ACT.collectionPage({dataset:{v:String(n-1)}});},
  collectionTop(){if(G.sheet!=='collection')return;const sheet=$('.sheet');if(sheet)sheet.scrollTop=0;$('#collectionCategory')?.focus({preventScroll:true});},
  dexNav(el){if(G.sheet!=='dex')return;const k=el.dataset.k,v=el.dataset.v;if(k==='area'){if(!Object.prototype.hasOwnProperty.call(AREAS,v))return;G.sheetData={area:v,page:0};}else if(k==='page'){const n=Number(v);if(!Number.isInteger(n)||n<0||n>4)return;G.sheetData={...normalizedDexData(G.sheetData),page:n,detail:null};}else if(k==='detail'){if(v&&!normalizedDexData({detail:v}).detail)return;G.sheetData={...normalizedDexData(G.sheetData),detail:v||null};}else return;render();drawMiniSprites();const sheet=$('.sheet');if(sheet)sheet.scrollTop=0; },
  gearPage(el){const n=Number(el.dataset.v);if(Number.isInteger(n)&&n>=0){G.sheetData.gearPage=n;render();}},
  gearFilter(el){if(!['gearSource','gearGroup','gearSlot'].includes(el.dataset.k))return;G.sheetData[el.dataset.k]=el.dataset.v;G.sheetData.gearPage=0;render();},
  gearEventAccept(el){if(!acceptGearEvent(G.st,el.dataset.v))return toast('今は受注できません。');commit();render();toast('装備依頼を受注しました。');},
  gearEventClaim(el){if(!claimGearEvent(G.st,el.dataset.v))return toast('条件や持ち物の空きを確認してください。');commit();render();toast('装備依頼の報酬を受け取りました。');},
  gearEventCancel(){if(G.readOnly)return;G.st.gearEvent=null;commit();render();},
  gearRematch(el){if(!gearRematch(G.st,el.dataset.v))toast('場所・参加料・挑戦条件を確認してください。');},
  shopTab(el){if(G.sheet!=='shop'||!['buy','item','sell'].includes(el.dataset.v))return;G.sheetData={...G.sheetData,tab:el.dataset.v,item:null,qty:1,uiQuery:'',uiFilter:'all',uiPage:0,notice:null};render();},
  shopItem(el){if(G.sheet!=='shop')return;const id=el.dataset.v;if(!id)return shopListReturn();if(G.sheetData.item===id)return;if(!shopPool(G.st,G.sheetData).includes(id))return toast('この店の一覧から選んでください。');checkSheetNavigation();pushSheetFrame(captureSheetFrame());G.sheetData={...G.sheetData,item:id,qty:1,notice:null};render();},
  shopQty(el){if(G.sheet!=='shop'||!G.sheetData.item)return;const n=Number(el.dataset.v),t=shopQuote(G.st,G.sheetData);if(!Number.isInteger(n)||n<1||n>t.max)return;G.sheetData={...G.sheetData,qty:n};render();},
  shopDo(el){if(el)el.disabled=true;const st=G.st,d=G.sheetData;if(!st||G.sheet!=='shop')return;const t=shopQuote(st,d,true);if(t.reason){render();return toast(t.reason);}if(t.isItem){if(t.sell)bagRemove(st.bag,t.id,t.q);else bagAdd(st.bag,t.id,t.q);}else st.owned[t.id]=(st.owned[t.id]||0)+(t.sell?-t.q:t.q);st.gold=t.after;const moved=t.sell?keepFlush():0;commit();SND.sfx('buy');shopListReturn(t.it.name+'×'+t.q+'を'+(t.sell?'売りました。':'購入しました。')+' 所持金 '+manageNumber(st.gold)+'G。'+(moved?' 預かり所から'+moved+'個受け取りました。':''));},
  replay(el){ G.sheet=null; playScene(el.dataset.v,undefined,true); },
  ssSet(el){ G.sheetData[el.dataset.k]=el.dataset.v; render(); },
  streamStart(){ const st=G.st, d=G.sheetData,qid=st&&streamPending();if(!st||G.readOnly||G.screen!=="explore"||G.sheet!=="streamSetup"||G.dlg||st.run||st.stream||!qid||QUESTS[qid].hub!==curHub()||!isSafe()||!st.roster.includes(d.host)||d.host==="moe"||!STREAM_THEMES[d.theme]||!["video","voice"].includes(d.style))return false;if(st.careerSession)return toast("活動準備を先に終えてください。"); if(!retryReady(st,curHub()))return toast("再挑戦の準備が必要です。住民2人との会話と通常戦闘1勝を達成してください。"); st.stream=newStream(st,curHub(),d.host,d.theme,d.style,d); commit(); G.sheet=null; G.screen="stream"; SND.play("stream"); render(); },
  streamAct(el){ streamAct(el.dataset.v,Number(el.dataset.hand),el.dataset.token); },
  streamRetry(el){return streamRetry(el?.dataset.token);},
  streamLeave(){ G.st.stream=null; commit(); G.screen="explore"; exploreBgm(); render(); },
  streamFinish(el){ return streamFinish(el?.dataset.token); }
};
for(const name of ['collectionLocate','collectionDensity','collectionJump','collectionTop','collectionTab','collectionPage','collectionSearch','collectionClear','collectionFilter','regionalPref','broadcastFilter','broadcastSuggest','broadcastReuse','guideSearch','guideCategory','guidePage','itemView','itemDrop','itemDropNo','partyView','equipView','eqDrop','eqDropNo','dexNav','shopTab','questFilter','questDetail','helloWorkMode','helloWorkCharacter','helloWorkJob','helloWorkSearch','helloWorkPage','storyPage','eventPage','geoSelect','geoMove','geoPage','relationFocus','relationPage','relationMode','peoplePage','gearPage','gearFilter','showBackup','managePerson','manageStatusTab','manageEquipTab','manageSlot','manageSearch','manageClear','managePage','equipStock','equipChoose','eqSort','itSort'])ACT[name]=recordSheetAction(name,ACT[name]);
function drawMiniSprites(){
  document.querySelectorAll("canvas[data-char]").forEach(c=>{ const g=c.getContext("2d"); g.clearRect(0,0,16,24); const id=c.dataset.char; g.drawImage(id==="moe"?heroineSprite(0,0):charSprite(id,0,0),0,0); });
  document.querySelectorAll("canvas[data-dex]").forEach(c=>{ const [a,i]=c.dataset.dex.split("|"); const e=enemyDef(a,+i); const g=c.getContext("2d"); g.imageSmoothingEnabled=false; g.drawImage(ART.enemy(e.profile,e.species,e.attr,a,0),0,0); });
}
function validateBattleSnapshot(r,roster){
 if(!r)return;
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v),num=v=>Number.isFinite(v)&&v>=0,int=v=>Number.isSafeInteger(v)&&v>=0;
 if(!['field','boss','challenge'].includes(r.kind)||!['input','won','lost'].includes(r.state)||!int(r.seq)||!int(r.turn)||r.turn<1||!num(r.A)||r.A>100||!num(r.B)||r.B>4||!Array.isArray(r.party)||r.party.length<1||r.party.length>4||!Array.isArray(r.enemies)||!r.enemies.length||r.enemies.length>3)throw Error('bad battle snapshot');
 if(new Set(r.party.map(m=>m.cid)).size!==r.party.length||new Set(r.enemies.map(e=>e.slot)).size!==r.enemies.length)throw Error('duplicate battle participant');
 for(const [i,m]of r.party.entries())if(!obj(m)||!roster.includes(m.cid)||m.pos!==i||!JOBS[m.job]||!num(m.maxHP)||!m.maxHP||!num(m.hp)||m.hp>m.maxHP||!num(m.maxC)||!m.maxC||!num(m.c)||m.c>m.maxC||!num(m.ward)||m.ward>8||!num(m.armorD)||!num(m.defBase)||typeof m.acted!=='boolean'||typeof m.guard!=='boolean'||m.skillReady&&(!obj(m.skillReady)||Object.entries(m.skillReady).some(([id,n])=>!EXTRA_SKILLS[id]||!int(n))))throw Error('bad battle member');
 for(const e of r.enemies)if(!obj(e)||!int(e.slot)||!num(e.maxHP)||!e.maxHP||!num(e.hp)||e.hp>e.maxHP||!num(e.def)||!Array.isArray(e.cycle)||!e.cycle.length||e.cycle.some(a=>!obj(a)||!['s','a','c'].includes(a.t)||!num(a.p))||e.boss&&(!num(e.atkMult)||!e.atkMult))throw Error('bad battle enemy');
 if(r.turnLimit!==undefined&&(!int(r.turnLimit)||r.turnLimit<1))throw Error('bad battle turn limit');
}
function validateState(s){
  if(!currentSaveState(s))throw Error("reset epoch mismatch");
  validateNarrative(s);validateJobSystem(s);
  const obj=v=>v&&typeof v==="object"&&!Array.isArray(v),num=v=>Number.isFinite(v)&&v>=0;
  if(!obj(s)||s.schemaVersion!==SCHEMA_VERSION||!obj(s.profile)||typeof s.profile.name!=="string"||!obj(s.settings))throw Error("bad state");
  if(s.collection!==undefined){const c=s.collection;if(!obj(c)||c.version!==1)throw Error('bad collection');for(const[k,defs]of [['items',ITEMS],['gear',EQUIP],['bosses',BOSSES]])if(!obj(c[k])||Object.entries(c[k]).some(([id,v])=>!Object.prototype.hasOwnProperty.call(defs,id)||v!==true))throw Error('bad collection '+k);if(c.events!==undefined&&(!obj(c.events)||Object.entries(c.events).some(([id,v])=>!Object.prototype.hasOwnProperty.call(EVENT_ITEMS,id)||v!==true)))throw Error('bad collection events');}
  if(!num(s.xp)||s.xp>XP_CAP||!num(s.gold)||!num(s.tickets)||!num(s.day)||(s.slots!==undefined&&!num(s.slots))||!MAPS[s.mapId]||!obj(s.pos)||!Number.isInteger(s.pos.x)||!Number.isInteger(s.pos.y))throw Error("bad values");
  for(const k of ["jobs","jp","equip","owned","quests","qprog","talked","boxes","bossDefeated","killCount","streamBest"])if(!obj(s[k]))throw Error("bad "+k);
  if(!Array.isArray(s.roster)||!REQUIRED_PARTY.every(c=>s.roster.includes(c))||new Set(s.roster).size!==s.roster.length||s.roster.some(c=>!CHARS[c]))throw Error("bad roster");
  if(s.memberXp&&(!obj(s.memberXp)||Object.entries(s.memberXp).some(([c,n])=>!s.roster.includes(c)||!Number.isInteger(n)||n<0||n>XP_CAP)))throw Error('bad member experience');
  if(s.learnedSkills&&(!obj(s.learnedSkills)||Object.entries(s.learnedSkills).some(([c,ids])=>!s.roster.includes(c)||!Array.isArray(ids)||ids.some(id=>!EXTRA_SKILLS[id]))))throw Error('bad learned skills');
  if(s.specialReturn&&(!obj(s.specialReturn)||!MAPS[s.specialReturn.map]||!Number.isInteger(s.specialReturn.x)||!Number.isInteger(s.specialReturn.y)))throw Error('bad special return');
  if(s.characterStories&&(!obj(s.characterStories)||Object.entries(s.characterStories).some(([c,r])=>!s.roster.includes(c)||!obj(r)||!Number.isInteger(r.seen)||r.seen<0||r.seen>4||!Number.isSafeInteger(r.wins)||r.wins<0)))throw Error('bad character story records');
  if(s.nationalRewards&&(!obj(s.nationalRewards)||Object.entries(s.nationalRewards).some(([id,v])=>!NATIONAL_SPECIALS.some(c=>c.id===id)||v!==true)))throw Error('bad national reward records');
  if(s.careerTour&&(!obj(s.careerTour)||Object.entries(s.careerTour).some(([h,r])=>nationalChapterForHub(h)<0||!obj(r)||Object.entries(r).some(([k,v])=>!['photo','event'].includes(k)||v!==true))))throw Error('bad career records');
  if(s.careerSession&&(!obj(s.careerSession)||nationalChapterForHub(s.careerSession.hub)<0||!['photo','event'].includes(s.careerSession.kind)||!Number.isInteger(s.careerSession.step)||s.careerSession.step<0||s.careerSession.step>2||!Array.isArray(s.careerSession.picks)||s.careerSession.picks.length!==s.careerSession.step||s.careerSession.picks.some(v=>!['careful','rush'].includes(v))))throw Error('bad career session');
  if(s.relationshipChoice!==undefined&&!['romance','partner'].includes(s.relationshipChoice))throw Error('bad relationship choice');
  if(s.names&&(!obj(s.names)||Object.entries(s.names).some(([c,n])=>!CHAR_ORDER.includes(c)||!s.roster.includes(c)||typeof n!=="string"||!validateName(n).ok)))throw Error("bad names");
  if(s.pendingNames&&(!Array.isArray(s.pendingNames)||s.pendingNames.some(c=>!s.roster.includes(c))))throw Error("bad pending names");
  if(!Array.isArray(s.party)||!s.party.length||s.party.length>4||new Set(s.party).size!==s.party.length||s.party.some(c=>!s.roster.includes(c)))throw Error("bad party");
  if(s.partyRulesVersion===2&&(s.party.length<2||!REQUIRED_PARTY.every(c=>s.party.includes(c))))throw Error("required companions missing");
  for(const c of s.roster)if(!JOBS[s.jobs[c]]||!obj(s.jp[c])||!obj(s.equip[c]))throw Error("bad character");
  for(const key of ["challenges","festivals","townBattles"])if(s[key]&&!obj(s[key]))throw Error("bad "+key);
  if(s.challenges)for(const [id,r]of Object.entries(s.challenges))if(!trialOf(id)||!obj(r)||(r.attempts!==undefined&&(!Number.isInteger(r.attempts)||r.attempts<0))||(r.cleared!==undefined&&typeof r.cleared!=="boolean"))throw Error("bad challenge record");
  if(s.specialUnlocked&&(!obj(s.specialUnlocked)||Object.entries(s.specialUnlocked).some(([id,v])=>!SPECIAL_STAGES.some(a=>a.id===id||a.challenge===id)||v!==true)))throw Error('bad special unlock records');
  if(s.chapterRewards&&(!obj(s.chapterRewards)||Object.entries(s.chapterRewards).some(([id,v])=>!NEXT_CHAPTER.some(c=>c.id===id)||v!==true)))throw Error('bad chapter reward records');
  if(s.gearEventDone&&(!obj(s.gearEventDone)||Object.entries(s.gearEventDone).some(([id,v])=>EQUIP[id]?.gearSource!=='event'||v!==true)))throw Error('bad gear event records');
  if(s.gearEvent&&(!obj(s.gearEvent)||EQUIP[s.gearEvent.id]?.gearSource!=='event'||!Number.isInteger(s.gearEvent.wins)||s.gearEvent.wins<0))throw Error('bad gear event');
  if(s.run&&s.run.challengeId&&!trialOf(s.run.challengeId))throw Error("bad challenge");
  if(s.run&&(!Array.isArray(s.run.party)||!s.run.party.length||!Array.isArray(s.run.enemies)||!s.run.enemies.length||!obj(s.run.returnPos)||!MAPS[s.run.returnPos.map]))throw Error("bad battle");
  validateInventoryState(s);validateBattleSnapshot(s.run,s.roster);
  if(s.stream&&(!HUBS[s.stream.hub]||!STREAM_THEMES[s.stream.theme]||!CHARS[s.stream.host]||!Array.isArray(s.stream.requestIds)||s.stream.requestIds.length!==4||s.stream.requestIds.some(k=>!STREAM_ACTS[k])||!Array.isArray(s.stream.used)||!Array.isArray(s.stream.picks)||!num(s.stream.score)||!Number.isInteger(s.stream.hand)||s.stream.hand<0||s.stream.hand>4))throw Error("bad stream");
  validateStreamSnapshot(s.stream);
  validateBroadcastData(s);
}

function autoMode(){ const s=G.st?G.st.settings:G.tmpSettings; if(s&&(s.autoAdvance==="tap"||s.autoAdvance==="timer")) return s.autoAdvance; try{ const v=localStorage.getItem("tlr-kyushu-autoadv"); if(v==="tap"||v==="timer") return v; }catch(e){} return "timer"; }
function padSide(){ const s=G.st?G.st.settings:G.tmpSettings; if(s&&(s.padSide==="left"||s.padSide==="right")) return s.padSide; try{ const v=localStorage.getItem("tlr-kyushu-pad"); if(v==="left"||v==="right") return v; }catch(e){} return "right"; }
function audioMixSettings(){const saved=G.st?.settings||G.tmpSettings||{};let fallback={};try{fallback=JSON.parse(localStorage.getItem('tlr-audio-mix')||'{}')||{};}catch(e){}const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1;return {bgm:valid(saved.bgmVolume)?saved.bgmVolume:valid(fallback.bgm)?fallback.bgm:0.65,sfx:valid(saved.sfxVolume)?saved.sfxVolume:valid(fallback.sfx)?fallback.sfx:0.65};}
function syncAudioMix(){const m=audioMixSettings();SND.setMix(m.bgm,m.sfx);return m;}
function soundIsOn(){ if(G.soundWant!=null) return G.soundWant; if(G.st&&G.st.settings) return G.st.settings.sound!==false; return soundPref(); }
function soundPref(){ try{ return localStorage.getItem("tlr-kyushu-sound")!=="0"; }catch(e){ return true; } }
function migrate(s){if(!currentSaveState(s))throw Error("初期化前の記録は引き継げません");delete s.slots;ensureJobSystem(s);ensureNarrative(s,true);s.gearEventDone=s.gearEventDone||{};s.challenges=s.challenges||{};s.festivals=s.festivals||{};s.townBattles=s.townBattles||{};s.names=s.names||{};ensureCharacterStories(s);s.pendingNames=(s.pendingNames||[]).filter(c=>s.roster.includes(c)); migrateExperience(s);ensureMemberXp(s);normalizeRequiredParty(s);syncPartyExperience(s); try{ fixQuestChain(s); }catch(e){} if(s.profile&&!s.profile.career) s.profile.career="社会福祉士"; if(s.profile&&!s.profile.heroine) s.profile.heroine={...HEROINE_DEFAULT}; if(!s.itemsVersion){ s.bag=INITIAL_ITEMS.map(([id,n])=>({id,n})); s.keep=[]; s.itemsVersion=1; s.gameVersion=GAME_VERSION; } if(s.run&&!s.run.bag) s.run.bag=clone(s.bag); if(s.settings&&s.settings.soundV!==2){ s.settings.sound=true; s.settings.soundV=2; } if(s.vitals===undefined) s.vitals=null; s.jobs.moe=s.jobs.moe||"J08"; s.jp.moe=s.jp.moe||{}; s.equip.moe=s.equip.moe||{w:null,a:null,acc:null}; s.settings=Object.assign({difficulty:"std",sound:soundPref(),reduceMotion:false},s.settings||{}); s.scenes=s.scenes||{}; s.cards=s.cards||[]; for(const c of s.roster)s.equip[c]=previewEquipFor(s,c,s.jobs[c]);learnEquipped(s);if(s.run){s.run.levelCap=progressionCap(s);s.run.L=partyLevel(s);s.run.V=Vof(s.run.L);for(const m of s.run.party){const cs=charStats(s,m.cid,s.run.L);m.name=charName(s,m.cid);m.L=cs.L;m.V=cs.V;m.jobRanks=clone(s.jp[m.cid]);m.wAtk=cs.wAtk;m.accAtk=cs.accAtk;m.armorD=cs.armorD;m.R=cs.R;m.S=cs.S;m.maxHP=cs.maxHP;m.hp=Math.min(m.hp,m.maxHP);m.defBase=cs.defBase;m.str=cs.base.str;m.crit=cs.crit;m.eva=cs.eva;m.cha=cs.cha;m.chaStat=cs.base.cha;m.maxC=m.maxMP=cs.startC;m.c=Math.min(m.maxC,m.c);m.equip=previewEquipFor(s,m.cid,cs.job);m.extraSkills=cs.extraSkills;m.commentA=cs.commentA;m.rest=cs.rest;m.meter=cs.meter;m.family=cs.family;m.pouch=cs.pouch;m.skillReady=m.skillReady||{};}}if(s.run?.state==="input"){if(!alive(s.run).length){s.run.state="lost";s.run.log=[...(s.run.log||[]),"同行者が全員戦闘不能です。安全な場所へ戻れます。"]; }else if(s.run.enemies.every(e=>e.hp<=0))s.run.state="won";}s.gameVersion=GAME_VERSION;normalizeChapterLocation(s);ensureVitals(s);ensureWorld(s);rememberSpecialUnlocks(s);syncCollection(s); return s; }

document.addEventListener("change",e=>{if(e.target.id==="worldAtlasLayer"&&G.sheet==="world"&&G.screen==="explore"&&["walk","rail","highway","all"].includes(e.target.value)){G.sheetData.atlasLayer=e.target.value;render();return;}if(e.target.id==="worldAtlasRegion"&&G.sheet==="world"&&G.screen==="explore"&&Object.hasOwn(WORLD_ATLAS_REGIONS,e.target.value)){G.sheetData.atlasRegion=e.target.value;render();return;}if(e.target.id==="battlePickerFilter"){G.battlePickerFilter=e.target.value;G.battlePickerQuery=($("#battleSearch")?.value||"").slice(0,60);G.battlePickerPage=0;render();}if(e.target.id==="nativeBattleTarget"&&e.target.value!==""&&battleControlIsCurrent(e.target))ACT.cmdSet({dataset:{k:e.target.dataset.k,v:e.target.value}});});
document.addEventListener("submit",e=>{if(e.target.id==="battleSearchForm"){e.preventDefault();ACT.battlePickerSearch();}});
document.addEventListener("submit",e=>{if(e.target.id==="helloWorkSearchForm"){e.preventDefault();ACT.helloWorkSearch();}});
document.addEventListener("toggle",e=>{if(G.sheet==='collection')collectionDetailToggle(e.target);},true);
document.addEventListener("change",e=>{if(e.target.id==='dexAreaSelect'&&AREAS[e.target.value])ACT.dexNav({dataset:{k:'area',v:e.target.value}});if(e.target.id==='regionalAreaSelect')ACT.regionalPref({dataset:{v:e.target.value}});if(e.target.id==='collectionCategory')ACT.collectionTab({dataset:{v:e.target.value}});const k={collectionStatus:"cstatus",collectionPref:"cpref",collectionType:"ctype",collectionSort:"csort",collectionSize:"csize"}[e.target.id];if(k)ACT.collectionFilter({dataset:{k,v:e.target.value}});});
document.addEventListener("submit",e=>{if(e.target.id==="collectionJumpForm"){e.preventDefault();ACT.collectionJump();}});
document.addEventListener("submit",e=>{if(e.target.id==="collectionSearchForm"){e.preventDefault();ACT.collectionSearch();}});
document.addEventListener("submit",e=>{if(e.target.id==="systemGuideSearch"){e.preventDefault();ACT.guideSearch();}});

document.addEventListener('submit',e=>{if(e.target.id==='manageSearchForm'){e.preventDefault();ACT.manageSearch();}});
document.addEventListener('change',e=>{if(e.target.id==='managePerson')ACT.managePerson({dataset:{v:e.target.value}});if(e.target.id==='manageFilter')ACT.manageSearch();});
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-a]"); if(!el||el.disabled) return;
  if(el.getAttribute("aria-disabled")==="true") return;
  const f=ACT[el.dataset.a]; if(!f) return;
  if(BATTLE_CONTROL_ACTIONS.has(el.dataset.a)&&!battleControlIsCurrent(el))return;
  if(G.readOnly && !["collectionLocate","collectionDensity","collectionJump","collectionTop","collectionTab","collectionPage","collectionSearch","collectionClear","collectionFilter","regionalPref","broadcastFilter","broadcastSuggest","broadcastReuse","mobileEnemyInfo","mobileMember","battlePanel","mobileInspect","battlePickerSearch","battlePickerPage","battlePickerClose","systemHelp","guideSearch","guideCategory","guidePage","specialGuide","managePerson","manageStatusTab","manageEquipTab","manageSlot","manageSearch","manageClear","managePage","manageJobs","manageEquipOpen","equipStock","equipChoose","shopQty","eqSort","itSort","openSheet","closeSheet","questFilter","questDetail","dlgNext","dlgBack","dlgSkip","toTitle","dexNav","partyView","shopTab","shopItem","equipView","itemView","endPage","battleInspect","battleInspectClose","battleChoicePage","liveLogPage","gearPage","gearFilter","partyReplaceSlot","noop","shareCopyUrl","shareCopyMsg","shareNative"].includes(el.dataset.a)) return toast("別のタブで遊んでいるため、このタブは閲覧のみです。");
  f(el);
  if(el.dataset.a==="openSheet") drawMiniSprites();
});

