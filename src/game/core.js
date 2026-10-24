/* ===== core: 計算・条件・報酬（状態はJSONで保持し、純粋関数で更新） ===== */
/* Pocochaの用語を題材にしたゲーム独自の物語・数値。実サービスの計算式とは別。 */
const POCO_TOWNS=[
 ['初見歓迎の商店街','屋台の自己紹介リレー','初見さんがコメントをためらう通りで、まず相手の呼び名を覚えよう。','屋台の提灯に「おかえり」の声が戻り、初見さんの席もできた。','初見ロスト'],
 ['パチパチ港フェス','港の拍手リレー','届いた応援を流さず拾うため、荷揚げ場で拍手の合図を練習する。','船の汽笛とパチパチが重なり、港から遠い枠にも感謝が届いた。','拍手かくし'],
 ['キラコメ松原','推し色の灯り祭','声の大きさだけを競う松原で、挨拶・作戦・感謝を別々の仲間へつなぐ。','推し色の灯りが松原を渡り、違う役割の応援が一つの景色になった。','キラコメ崩し'],
 ['ファミリー水路','水辺のファミリー会議','配信方針がすれ違う水路で、無理なく参加できる応援を相談する。','水路の掲示板に役割が並び、来られない日も安心して帰れる枠になった。','方針すれ違い'],
 ['ぽこナイト造船所','ナイト隊の出航式','一人の応援へ頼りきった造船所で、守り・回復・攻撃の交代を学ぶ。','ナイトの旗を全員で支え、誰か一人だけが頑張る船を卒業した。','ナイト孤立'],
 ['アーカイブ坂道','坂道お礼めぐり','いつもの視聴者だけで話が閉じる坂で、途中から来た人へ話題を渡す。','坂の踊り場に話題の案内ができ、途中参加でも笑い声に混ざれる。','話題置き去り'],
 ['ランクメーター城下','城下の作戦ボード','メーターを気にして笑顔を失う城下で、目標と休む時間を一緒に決める。','城下に作戦ボードが立ち、目標へ進む日も休む日も仲間が見守る。','ボーダー焦り'],
 ['エール草原','草原のコア交流会','数字だけで応援を比べる草原で、長く一緒に過ごした言葉を探す。','草原の名札には数字より先に思い出が書かれ、枠の絆が育った。','エール空回り'],
 ['おやすみ温泉街','湯けむり休息ラジオ','連戦で疲れた温泉街で、配信も冒険も休息を予定へ組み込む。','湯けむりの灯りがゆっくり揺れ、休んだ仲間が笑顔で戻ってきた。','連投疲れ'],
 ['アシスタント府内','府内の進行台本会','指示が飛び交う広場で、案内・回復・声かけの担当を決める。','府内の台本が読みやすくなり、ライバーもリスナーも会話へ集中できる。','進行こんがらがり'],
 ['バースデー南国通り','南国の記念日ライブ','主役の気持ちより演出が先走る通りで、伝えたいお祝いを聞き取る。','祝福の灯りが南国を照らし、主役の好きな歌が最後まで響いた。','記念日暴走'],
 ['コラボ運河','運河のコラボ橋渡し','違う枠の文化がぶつかる運河で、相手の挨拶とペースを尊重する。','運河にコラボ橋が架かり、初めての枠どうしにも挨拶が行き交う。','コラボ迷子'],
 ['プラ１の霧島参道','参道の目標宣言会','霧で目標を見失う参道で、装備・職業・回復の準備を一つずつ確認する。','参道の霧が晴れ、作戦と育成の積み重ねが次の目標を照らした。','準備わすれ'],
 ['イベラス火山街','火山街の締め前総練習','締め前に焦る街で、固有技とエールを使う順番を最後まで相談する。','火山街に最後の感謝が響き、締めまで役割を果たした仲間が肩を並べた。','イベラス焦燥'],
 ['S帯の島ステージ','島唄ファミリーフェス','大きくなった枠で一人の声を見失わないよう、島の小さな舞台へ戻る。','島唄とコメントが重なり、人数が増えても呼びかける声は近いままだ。','人気の空洞'],
 ['S6ドリーム舞台','九州グランドフィナーレ','S6到達だけをゴールにせず、配信を続けたい理由を仲間と確かめる。','九州の推し色を集める交流の場ができ、本番を目指す人どうしに次の配信の約束が生まれた。','S6プレッシャー'],
 ['炭都アンコール街','大蛇山アンコール祭','九州編クリア後の炭都で、これまで支えてくれた人へアンコールを届ける。','炭都の櫓にアンコールの灯りがともり、九州の思い出が新しい挑戦を呼ぶ。','アンコール試練']
];
POCO_TOWNS.push(...NEXT_CHAPTER.map(c=>[c.pref+'の合同配信街',c.title+'・交流祭',c.before,c.name+'の交流祭を住民と開催した。案内と休憩の担当がそろい、話を聞き合う場ができた。本編の依頼・任意の事件はそれぞれ別に進む。',['休息取り残し','声量競争','当番固定','文化すれ違い','予定過密','初見迷子','感謝忘れ','締め前焦り','絆分断'][c.index]]));
POCO_TOWNS.push(...NATIONAL_ALL_EXTRA.map(c=>[c.title,c.title+'の交流祭',c.before,c.name+'の交流祭を住民と開催した。撮影や配信を支える人の交流が深まった。本編の依頼・任意の事件はそれぞれ別に進む。','距離と期待のノイズ']));
const POCO_ROLES={hero:'旅・撮影会・出演・配信の準備を整える補佐・共同制作者。九州のS6から全国・東京ドームへの道を共に歩む。',moe:'元アイドルのメインライバー。応援の数字の向こうにいる一人へ歌と会話を届ける。',kohei:'配信遠征の輸送担当。初見案内と枠の進行を滞らせない。',naoki:'配信照明と電源の担当。ナイト隊の守りと攻撃の切り替えを見守る。',mio:'ライバーとファミリーの体調管理役。回復の順番を読み、無理な連戦を止める。',kayo:'長時間イベントの補給担当。MPと休息の計画でイベラスを支える。',tsumugi:'配信機材とコメント導線の設計役。キラコメ連携の橋渡しが得意。',makoto:'ステージの安全設計と防護担当。締め前の強攻撃から全員を守る。',gaku:'音声・回線のトラブル対応役。敵の守りを見抜き、通る声をつくる。'};
for(const [c,role]of Object.entries(POCO_ROLES))CHARS[c].pocoRole=role;
Object.assign(FACILITY,{challenge:{mark:'挑',name:'特別チャレンジ受付',color:'#E8A5BE'},studio:{mark:'絆',name:'ファミリー交流所',color:'#83B9AE'}});
const POCO_COLORS=['#E8A5BE','#83B9AE','#D5B34C','#A6B9DF'];
HUB_ORDER.forEach((hub,i)=>{
 const [title,festival,before,after,noise]=POCO_TOWNS[i],m=MAPS[hub];
 m.pocoTheme=i;m.objects.push({id:'challenge_'+hub,x:23,y:18,type:'challenge',label:title+'・特別チャレンジ受付'},{id:'studio_'+hub,x:25,y:18,type:'studio',label:festival+'・ファミリー交流所'});
 for(const o of m.objects){if(o.type==='shop')o.label='配信ギア工房・'+o.label;if(o.type==='inn')o.label='おやすみ控室・'+o.label;}
 const ht=HUB_TEXT[hub]||(HUB_TEXT[hub]={});ht.accept=(ht.accept||'街の声を集めよう。')+' '+before;ht.moe=[...(ht.moe||[]),before];
 for(const [aid,a]of Object.entries(AREAS))if(aid.startsWith(hub)){a.lore+=' '+before;a.motif=title;}
 for(const [bid,b]of Object.entries(BOSSES))if(b.hub===hub){const old=b.name;b.name=noise+'・'+old;b.pocoTheme=i;for(const q of Object.values(QUESTS))if(q.boss===bid)q.goal=q.goal.split(old).join(b.name);}
 const main=Object.values(QUESTS).find(q=>q.hub===hub&&q.main);const scene=main&&SCENES[main.scene];if(scene){const old=scene.lines;scene.lines=p=>[...old(p),['もえ','本編の壁を越えたね。次は住民と「'+festival+'」を完成させよう。'],['',festival+'の準備が進んだ。ファミリー交流所では本編と別の街イベントに参加できる。']];}
 const arrival=SCENES['ARRIVE_'+hub];if(arrival){const old=arrival.lines;arrival.lines=p=>[...old(p),['',title+'では「'+festival+'」の準備が進んでいる。'],['もえ',before]];}
 for(const n of Object.values(NPCS))if(n.hub===hub&&n.first){const old=n.first;n.first=p=>[...old(p),[n.name,before]];}
});
if(SCENES.HS00){const old=SCENES.HS00.lines;SCENES.HS00.lines=p=>[...old(p),['もえ','元アイドルの私が目指すのはPocochaのS6。でも、数字の向こうの一人へ、歌と返事を届け続けたい。'],['', '旅で戦うのは応援する人ではなく、枠に生まれる迷いやすれ違いのノイズ。育成・装備・職業技で街の声を守ろう。'],['', '街の「絆」はファミリー交流所、「挑」は本編と別の特別チャレンジ受付。配信の用語を題材にしたゲーム独自の物語です。']];}
for(const [j,job]of Object.entries(JOBS))job.skill='枠技・'+job.skill;
for(const sk of Object.values(EXTRA_SKILLS))if(!sk.ultra)sk.name=(sk.rank?'ファミリー':'配信')+'・'+sk.name;
for(const it of Object.values(EQUIP)){
 const oldAtk=it.atk,oldD=it.d;if(oldAtk)it.atk=Math.ceil(oldAtk*1.3);if(oldD)it.d=Math.ceil(oldD*1.3);
 if(it.text){if(oldAtk)it.text=it.text.replace(/(攻撃力[＋+]?)(\d+)/g,(m,a,n)=>+n===oldAtk?a+it.atk:m);if(oldD)it.text=it.text.replace(/(防御[力＋+]*)(\d+)/g,(m,a,n)=>+n===oldD?a+it.d:m);}
}
const POCO_ITEMS=[
 ['PC01','初見歓迎ののど飴','HP回復','味方1人',['hp',28],1,30,'初見案内の声を整える。味方1人のHPを28×V回復'],
 ['PC02','コア交流の差し入れ','HP・MP回復','味方1人',['hpc',42,12],2,110,'ファミリーとの交流で受け取る差し入れ。HP42×V・MP12回復'],
 ['PC03','おやすみ配信メモ','MP回復','味方1人',['c',24],3,180,'休息の段取りを書いたメモ。味方1人のMP24回復'],
 ['PC04','キラコメ紙吹雪','攻撃','敵全体',['dmg',58],4,480,'推し色の紙吹雪。敵全体へ58×V−防御のダメージ'],
 ['PC05','イベラスの花火札','攻撃','敵1体',['dmg',120],7,850,'締め前の一撃。敵1体へ120×V−防御のダメージ'],
 ['PC06','アンコールのお守り','蘇生','味方1人',['rev',65],8,900,'もう一度ステージへ。戦闘不能の味方1人を最大HPの65％で復活']
];
for(const[id,name,cat,target,eff,tier,price,text]of POCO_ITEMS)ITEMS[id]={id,name,cat,target,eff,tier,price,text,stars:Math.min(5,Math.ceil(tier/2)),acq:'S',sell:Math.floor(price/2),battleOnly:cat==='攻撃'};
const POCO_TRIALS=[
 {id:'CH01',name:'初見歓迎リレー',unlock:'M01',q:5,level:6,fee:80,turns:16,comments:3,people:2,desc:'初見へ挨拶し、違う人へ話題を渡す。',gear:{slot:'acc',name:'初見案内のインカム',commentA:8,hp:10}},
 {id:'CH02',name:'松原キラコメ夜祭',unlock:'M03',q:12,level:14,fee:140,turns:18,kira:true,party:3,desc:'3人の挨拶・作戦・感謝で推し色をつなぐ。',gear:{slot:'w',name:'キラコメの光棒',atk:17,commentA:4}},
 {id:'CH03',name:'コアファン絆の防衛',unlock:'M05',q:21,level:24,fee:240,turns:18,family:1,skills:3,desc:'毎ターンエール6を失う舞台。ファミリー応援と職業固有技で全員を支える。',gear:{slot:'a',name:'ファミリー隊の法被',d:11,hp:24}},
 {id:'CH04',name:'ぽこナイト交代戦',unlock:'M07',q:29,level:33,fee:340,turns:16,guards:2,masters:1,desc:'防御力1.5倍の敵。守りを交代し、熟練技や防御無視の技で突破する。',gear:{slot:'w',name:'ぽこナイトの旗槍',atk:28,crit:6}},
 {id:'CH05',name:'22時締め前ラッシュ',unlock:'M09',q:37,level:42,fee:450,turns:12,skills:5,desc:'限られたターンでMPと火力を計画する。',gear:{slot:'acc',name:'締め前の進行時計',c:12,meter:12}},
 {id:'CH06',name:'アシスタント実技試験',unlock:'M11',q:45,level:51,fee:580,turns:16,masters:2,jobs:3,desc:'毎ターン全員のMPを2消耗。異なる3職業以上の連携と熟練技を示す。',gear:{slot:'a',name:'統括アシスタントコート',d:17,c:8}},
 {id:'CH07',name:'九州イベラス総力戦',unlock:'M13',q:54,level:62,fee:740,turns:14,masters:3,kira:true,party:4,desc:'ボスと追加ノイズ1体。4人の編成でキラコメと熟練技を両立する。',gear:{slot:'w',name:'イベラス共鳴マイク',atk:42,c:8}},
 {id:'CH08',name:'S6アンコール・極',unlock:'M16',q:68,level:78,fee:1000,turns:14,masters:4,kira:true,family:1,jobs:4,party:4,desc:'ボスと追加ノイズ2体。4職業、キラコメ、熟練技、ファミリー応援の総決算。',gear:{slot:'a',name:'S6ファミリーの正装',d:24,hp:64,c:12}}
];
for(const[t,d]of POCO_TRIALS.entries()){
 d.boss='CB'+String(t+1).padStart(2,'0');d.reward='CE'+String(t+1).padStart(2,'0');
 EQUIP[d.reward]={...d.gear,price:0,nonSale:true,text:'特別チャレンジ「'+d.name+'」の初回達成報酬。'+(d.gear.atk?'攻撃力＋'+d.gear.atk+'。':'')+(d.gear.d?'防御'+d.gear.d+'。':'')+(d.gear.hp?'最大HP＋'+d.gear.hp+'。':'')+(d.gear.c?'最大MP＋'+d.gear.c+'。':'')+(d.gear.commentA?'コメントのエール＋'+d.gear.commentA+'。':'')+(d.gear.meter?'メーター突破＋'+d.gear.meter+'。':'')+(d.gear.crit?'会心率＋'+d.gear.crit+'％。':'')};
 BOSSES[d.boss]={name:d.name+'のノイズマスター',q:d.q,areaId:'KY01-A3',cue:'guard',hub:'KY01',shape:'lantern',col:[PAL.gold,PAL.violet]};
}

/* v6.14: 1,000 permanent, deterministic equipment definitions and real acquisition routes. */
const GEAR_SOURCES={shop:'ショップ',enemy:'通常敵',boss:'ボス',event:'街の装備依頼'};
const GEAR_STAGES=['初見歓迎','コメント交流','コアの絆','キラコメ共鳴','ぽこナイト','締め前決戦','イベラス','S6への誓い'];
const GEAR_VARIANTS=['フロアマイク','スタッフベスト','交流バッジ','ミニ拡声器','防音パーカー','声援チャーム','折り畳み指示棒','配信ジャケット','連携リボン','卓上マイク','控室コート','拍手ストラップ','声合わせリモコン','遮光ケープ','初見ノート','進行ハンドマイク','巡回ユニフォーム','コアの腕輪','応援ベル','耐風ポンチョ','キラコメブローチ','配信タクト','ステージベスト','配信時計','声届けアンテナ','リスナーコート','サポートリング','進行ポインター','ファミリー衣装','進行インカム','返事のメガホン','応援スタッフ服','配信ペンダント','交流ハンドベル','舞台ジャケット','見守りチョーカー','共鳴ペンライト'];
const NEW_GEAR_IDS=[];
function gearStatsText(it){return [['atk','攻撃力'],['d','防御力'],['hp','最大HP'],['c','最大MP'],['crit','会心率'],['commentA','コメントのエール'],['meter','メーター突破'],['family','全員回復'],['rest','休息のMP回復']].filter(([k])=>it[k]).map(([k,n])=>`${n}＋${it[k]}${k==='crit'?'％':''}`).concat(it.pouch?['回復・蘇生道具の効果2倍']:[]).join('／');}
function gearTierForQ(q){return Math.max(0,Math.min(7,Math.floor((q-1)/8)));}
function gearHome(t,n){return HUB_ORDER[Math.min(16,t*2+n%(t===7?3:2))];}
function gearSourceText(it){const lo=it.gearTier*8+1,hi=it.gearTier===7?'以上':`～${lo+7}`;return it.gearSource==='shop'?`${MAPS[it.gearHub].name}のショップ`:it.gearSource==='event'?`${MAPS[it.gearHub].name}のファミリー交流所・装備依頼`:`強度q${lo}${hi}の${it.gearSource==='enemy'?'通常敵（1体ごとに抽選）':'地域・深層ボス（特別チャレンジは対象外）'}`;}
(function expandGear(){
 // Existing ordinary commercial gear is weaker; starter, rare, ultra and event gear retain their roles.
 for(const it of Object.values(EQUIP))if(!it.job&&!it.rare&&!it.ultra&&!it.nonSale&&it.price>0){for(const k of ['atk','d','hp','c','crit','commentA','meter','family','rest'])if(it[k])it[k]=Math.max(1,Math.floor(it[k]*0.75));it.text='共通装備。'+gearStatsText(it)+'。';}
 const put=(id,it)=>{if(it.gearSource==='enemy'){if(it.slot==='w')it.crit=(it.crit||0)+1;else if(it.slot==='a')it.hp=(it.hp||0)+2;else it.c=(it.c||0)+1;}if(it.gearSource==='boss'){if(it.slot==='w')it.atk+=it.job?2:1;else if(it.slot==='a')it.d+=1;else it.c=(it.c||0)+1;}if(it.gearSource==='event'){if(it.slot==='w')it.commentA=(it.commentA||0)+1;else if(it.slot==='a')it.hp=(it.hp||0)+4;else it.family=(it.family||0)+(it.job?2:1);}it.id=id;it.expansion=614;it.nonSale=it.gearSource!=='shop';it.rare=['boss','event'].includes(it.gearSource);it.price=it.gearSource==='event'?0:(it.job?300:80)+it.gearTier*(it.job?260:140);it.text=(it.job?`${JOBS[it.job].name}専用・熟練度${it.needR}以上。`:'共通装備（専用品より控えめな性能）。')+gearStatsText(it)+'。入手：'+gearSourceText(it)+'。';EQUIP[id]=it;NEW_GEAR_IDS.push(id);};
 for(let i=0;i<296;i++){const t=Math.floor(i/37),v=i%37,slot=['w','a','acc'][v%3],source=Object.keys(GEAR_SOURCES)[i%4];let stats;
  if(slot==='w')stats={atk:2+t*2+v%2,...(Math.floor(v/3)%3===0?{commentA:1}:Math.floor(v/3)%3===1?{crit:1}:{family:1})};else if(slot==='a')stats={d:1+Math.floor(t/2),hp:4+2*t,...(Math.floor(v/3)%3===0?{hp:6+2*t}:Math.floor(v/3)%3===1?{c:1}:{rest:1})};else stats=v%3===2&&v%2?{c:1+Math.floor(t/4)}:{hp:4+2*t,crit:1};
  put('NC'+String(i+1).padStart(4,'0'),{slot,name:GEAR_STAGES[t]+'・'+GEAR_VARIANTS[v],gearSource:source,gearTier:t,gearHub:gearHome(t,v),...stats});
 }
 JOB_IDS.forEach((job,j)=>{for(let k=0;k<32;k++){const t=Math.floor(k/4),source=Object.keys(GEAR_SOURCES)[k%4],slot=['w','a','acc'][(t+k%4+j)%3],offensive=['strike','pierce','all'].includes(JOB_TECHS[j][2]);let stats;
  if(slot==='w')stats={atk:7+5*t+(offensive?2:0),crit:offensive?3:1,...(!offensive?{c:2+Math.floor(t/3),commentA:2+Math.floor(t/2)}:{})};
  else if(slot==='a')stats={d:4+2*t,hp:12+6*t,c:2+Math.floor(t/2)};
  else stats={c:3+Math.floor(t/2),hp:8+3*t,...(offensive?{crit:3+Math.floor(t/2)}:{commentA:3+Math.floor(t/2),rest:1})};
  put('NJ'+job.slice(1)+String(k+1).padStart(2,'0'),{slot,job,needR:[2,4,7,10,15,20,30,40][t],name:GEAR_STAGES[t]+'・'+(slot==='w'?JW_NAMES[j]:slot==='a'?JA_NAMES[j]:JOBS[job].name+'の配信証')+'〈'+['工房','巡回','決戦','絆'][k%4]+'〉',gearSource:source,gearTier:t,gearHub:gearHome(t,j+k),...stats});
 }});
 for(const id of NEW_GEAR_IDS){const it=EQUIP[id];if(it.gearSource==='shop'){const shop=SHOPS['SH'+it.gearHub.slice(2)];if(shop)shop.items.push(id);}}
})();
function newGearPool(source,tier){return NEW_GEAR_IDS.filter(id=>EQUIP[id].gearSource===source&&EQUIP[id].gearTier===tier);}
function chooseNewGear(st,pool){const known=pool.filter(id=>!(st.owned[id]||0)&&!(st.keep||[]).includes(id));if(known.length)pool=known;const relevant=pool.filter(id=>!EQUIP[id].job||st.party.some(c=>st.jobs[c]===EQUIP[id].job));if(relevant.length&&randInt(10)<7)pool=relevant;return pool[randInt(pool.length)];}
function newGearDrop(st,run,res){if(!['field','boss'].includes(run.kind))return;const pool=newGearPool(run.kind==='field'?'enemy':'boss',gearTierForQ(run.q));if(!pool.length)return;
 const award=why=>{const id=chooseNewGear(st,pool);if(!giveGear(st,id,res,why))res.notes.push(EQUIP[id].name+'は持ち物と預かり所が満杯で受け取れませんでした。');};
 if(run.kind==='field'){for(const e of run.enemies)if(randInt(e.rarity>=5?5:e.rarity>=3?8:12)===0)award(e.display+'の装備ドロップ');}
 else if(!st.bossDefeated[run.bossId]||randInt(3)===0)award('ボス決戦装備（'+(BOSSES[run.bossId]?.name||'ボス')+'）');
}
function gearRematchList(st,hub){return Object.entries(BOSSES).filter(([id,b])=>b.hub===hub&&b.specialStage==null&&st.bossDefeated[id]&&!id.startsWith('CB'));}

function battleEntryReason(st){if(!st||st!==G.st||G.readOnly)return 'このタブでは戦闘を開始できません。';if(st.careerSession)return '活動準備を終えてから移動・戦闘へ進んでください。';if(st.party.every(c=>st.vitals?.[c]&&st.vitals[c].hp<=0))return '同行者が全員戦闘不能です。道具や宿屋で復活させてから挑みましょう。';if(G.screen!=='explore'||st.run||st.stream||G.dlg)return '戦闘・配信・会話を終えてから挑戦してください。';return '';}
function startRegionalBoss(id){const st=G.st;if(battleEntryReason(st))return false;if(mainPropGate(st,id))return false;if(id==='NB607'&&nationalFinalReason(st)){openSheet('careerTour');return false;}const b=BOSSES[id],qid=Object.keys(QUESTS).find(k=>QUESTS[k].boss===id);if(battleEntryReason(st)||!b||b.specialStage!=null||curHub()!==b.hub||st.bossDefeated[id]||!qid||st.quests[qid]!=='bossReady'){toast('この地域の本編依頼とボスの挑戦条件を確認してください。');return false;}if(!exteriorBattleReady(st))return false;return startBattle(createBossRun(st,id));}

function gearRematch(st,id){const b=BOSSES[id],fee=b?30+5*b.q:0;if(battleEntryReason(st)||!b||!isSafe()||streamPending()||!gearRematchList(st,curHub()).some(([bid])=>bid===id)||st.gold<fee)return false;if(!exteriorBattleReady(st))return false;const run=createBossRun(st,id);run.rematch=true;st.gold-=fee;startBattle(run);return true;}
function gearEventReason(st,id,claim=false){const it=EQUIP[id],event=st.gearEvent;if(!it||it.gearSource!=='event')return '対象外の装備です。';if(st.run||streamPending()||!isSafe()||it.gearHub!==curHub()||!hubUnlocked(st,it.gearHub))return '該当する街の安全地帯で受け付けます。';if(st.gearEventDone?.[id])return '受取済みです。';if(!claim)return event?'受注中の装備依頼を先に達成するか取り消してください。':'';
 if(!event||event.id!==id)return 'この装備依頼は未受注です。';const need=2+Math.floor(it.gearTier/2),wins=Math.max(0,(st.townBattles?.[it.gearHub]||0)-event.wins);if(localFestivalStatus(st,it.gearHub).talks<2||wins<need)return '住民2人と会話し、受注後にこの街で通常戦闘'+need+'勝が必要です。';if(!eqCanAdd(st,id,1)&&(st.keep||[]).length>=KEEP_MAX)return '持ち物か預かり所に空きを作ってください。';return '';
}
function acceptGearEvent(st,id){if(G.readOnly||gearEventReason(st,id))return false;st.gearEvent={id,wins:st.townBattles?.[curHub()]||0};return true;}
function claimGearEvent(st,id){if(G.readOnly||gearEventReason(st,id,true))return false;const res={gear:[]};if(!giveGear(st,id,res,'街の装備依頼'))return false;st.gearEventDone=st.gearEventDone||{};st.gearEventDone[id]=true;st.gearEvent=null;return true;}
function gearPager(ids,size=12){const d=G.sheetData,pages=Math.max(1,Math.ceil(ids.length/size)),page=Math.max(0,Math.min(pages-1,d.gearPage||0));d.gearPage=page;return {list:ids.slice(page*size,page*size+size),nav:`<div class="choice-pages"><button class="btn" data-a="gearPage" data-v="${page-1}" ${page===0?'disabled':''}>◀ 前</button><span>${ids.length}種・${page+1}/${pages}</span><button class="btn" data-a="gearPage" data-v="${page+1}" ${page===pages-1?'disabled':''}>次 ▶</button></div>`};}
function renderGearCatalog(){const d=G.sheetData,source=d.gearSource||'all',group=d.gearGroup||'all',slot=d.gearSlot||'all';const filter=(k,vals)=>`<div class="sortbar">${vals.map(([v,n])=>`<button class="chip ${d[k]===v||!d[k]&&v==='all'?'on':''}" data-a="gearFilter" data-k="${k}" data-v="${v}">${n}</button>`).join('')}</div>`;
 const ids=NEW_GEAR_IDS.filter(id=>{const it=EQUIP[id];return(source==='all'||it.gearSource===source)&&(group==='all'||(group==='common'?!it.job:!!it.job))&&(slot==='all'||it.slot===slot);}),p=gearPager(ids);
 return `<p>追加装備1,000種：共通296種・職業専用704種。各職業32種。入手先ごとに250種。</p><p class="small">共通装備はつなぎ用。職業専用装備は熟練度2～40が必要です。同じ成長段階・部位では専用品の基礎性能が上回ります。</p>${filter('gearSource',[['all','全入手先'],...Object.entries(GEAR_SOURCES)])}${filter('gearGroup',[['all','全職業'],['common','共通'],['job','職業専用']])}${filter('gearSlot',[['all','全部位'],['w','武器'],['a','防具'],['acc','アクセサリー']])}${p.nav}<div class="stack">${p.list.map(id=>{const it=EQUIP[id];return `<div class="setcard"><b>${eqBadge(id)}${esc(it.name)}</b><p class="small">${esc(it.text)}</p><p class="small">成長段階${it.gearTier+1}/8 ${G.st.owned[id]||G.st.keep?.includes(id)?'・所持／預かり中':''}</p></div>`;}).join('')}</div>${p.nav}`;
}
function renderGearEvents(){const st=G.st,hub=curHub(),ev=st.gearEvent,it=ev&&EQUIP[ev.id];const p=gearPager(NEW_GEAR_IDS.filter(id=>EQUIP[id].gearSource==='event'&&EQUIP[id].gearHub===hub));return `<p>本編とは別の装備依頼。1件ずつ受注し、各報酬は1回だけ。受注前の勝利は数えません。</p>${it?`<section class="setcard"><b>受注中：${esc(it.name)}</b><p>${esc(MAPS[it.gearHub].name)}の住民2人と会話＋受注後の通常戦闘${2+Math.floor(it.gearTier/2)}勝（現在${Math.max(0,(st.townBattles?.[it.gearHub]||0)-ev.wins)}勝）。</p><p>${esc(gearEventReason(st,ev.id,true)||'達成！ 報酬を受け取れます。')}</p><button class="btn primary" data-a="gearEventClaim" data-v="${ev.id}" ${gearEventReason(st,ev.id,true)?'disabled':''}>報酬を受け取る</button><button class="btn" data-a="gearEventCancel">取り消す（報酬なし）</button></section>`:''}${p.nav}<div class="stack">${p.list.map(id=>{const e=EQUIP[id];return `<section class="setcard"><b>${eqBadge(id)}${esc(e.name)}</b><p class="small">${esc(e.text)}</p><p>住民2人と会話＋受注後の通常戦闘${2+Math.floor(e.gearTier/2)}勝</p><button class="btn" data-a="gearEventAccept" data-v="${id}" ${gearEventReason(st,id)?'disabled':''}>${st.gearEventDone?.[id]?'受取済み':'この報酬の依頼を受ける'}</button></section>`;}).join('')}</div>${p.nav}`;}
function renderGearRematches(){const st=G.st;return `<p>撃破済みボスと再戦し、装備を集められます。オート使用可。初回限定報酬は再支給されません。再戦でも経験値・ゴールド、通常のドロップ抽選があります。</p>${gearRematchList(st,curHub()).map(([id,b])=>`<section class="setcard"><b>${esc(b.name)}</b><p>推奨Lv${(b.regionalLevel||b.chapterLevel||bossRecommendedLevel(b.q))}／参加料${30+5*b.q}G／追加決戦装備は再戦勝利時1/3で抽選</p><button class="btn primary" data-a="gearRematch" data-v="${id}" ${st.gold<30+5*b.q||!isSafe()||st.run||streamPending()?'disabled':''}>街外へ移動・参加料を払い再戦</button></section>`).join('')||'<p>この街で撃破したボスはまだいません。</p>'}`;}

/* v6.15: active companions, personal experience, permanent job learning. */
function ensureMemberXp(st){if(!st.memberXp){st.memberXp={};for(const c of st.roster)st.memberXp[c]=Math.min(XP_CAP,st.xp||0);}for(const c of st.roster)if(st.memberXp[c]==null)st.memberXp[c]=Math.min(XP_CAP,st.xp||0);return st.memberXp;}
function characterLevel(st,cid){return Math.min(progressionCap(st),levelOf(st.memberXp?.[cid]??st.xp));}
function syncPartyExperience(st){ensureMemberXp(st);st.xp=Math.floor(st.party.reduce((n,c)=>n+st.memberXp[c],0)/st.party.length);}
function awardExperience(st,amount,cids=st.party){ensureMemberXp(st);const before=Object.fromEntries(cids.filter(c=>st.roster.includes(c)).map(c=>[c,{L:characterLevel(st,c),MP:charStats(st,c,characterLevel(st,c)).startC}]));const gains={};for(const c of new Set(cids)){if(!st.roster.includes(c))continue;const n=Math.max(0,Math.min(xpFor(progressionCap(st))-st.memberXp[c],Math.floor(amount)));st.memberXp[c]+=n;gains[c]=n;}syncPartyExperience(st);if(!st.run){const grown=[];for(const [c,b]of Object.entries(before))if(characterLevel(st,c)>b.L){const cs=charStats(st,c,characterLevel(st,c));st.vitals=st.vitals||{};st.vitals[c]={hp:cs.maxHP,c:cs.startC,maxMP:cs.startC};grown.push({cid:c,before:b.MP,after:cs.startC});}if(grown.length)st.lastMpGrowth={members:grown};}return gains;}
const JOB_BONUS_STEPS=[10,30,60,100,200,400,700,999],JOB_BONUS_POINTS=[1,2,3,4,6,9,13,18];
function jobBonusPoints(R){let p=0;JOB_BONUS_STEPS.forEach((n,i)=>{if(R>=n)p=JOB_BONUS_POINTS[i];});return p;}
function jobBonusDescription(job,R=999){const p=jobBonusPoints(R),primary=JOB_SIG[job],secondary=STAT_KEYS[(JOB_IDS.indexOf(job)+1)%5];return STAT_NAMES[primary]+'＋'+p+'％'+(secondary!==primary?'・'+STAT_NAMES[secondary]+'＋'+Math.floor(p/2)+'％':'');}
function permanentJobBonus(st,cid){const out={vit:0,str:0,def:0,agi:0,cha:0};for(const [i,j]of JOB_IDS.entries()){const p=jobBonusPoints(jobRank(st,cid,j));out[JOB_SIG[j]]+=p;const secondary=STAT_KEYS[(i+1)%5];if(secondary!==JOB_SIG[j])out[secondary]+=Math.floor(p/2);}for(const k of STAT_KEYS)out[k]=Math.min(45,out[k]);return out;}
JOB_IDS.forEach(job=>{const id='BASE_'+job;EXTRA_SKILLS[id]={id,job,baseJob:job,name:JOBS[job].skill+'（引継）',need:skillNeeds(job),cost:JOBS[job].cost,desc:'習得済みの'+JOBS[job].skill+'。効果は元の職業技と同じ。元職の熟練度で技能強化を計算。職業特性は現在職のみ。',level:1,cooldown:0};});
function rememberSkills(st,cid,L){if(!st.learnedSkills){st.learnedSkills={};for(const c of st.roster){st.learnedSkills[c]=[];for(const j of JOB_IDS)if(j===st.jobs[c]||jpOf(st,c,j)>0)for(const sk of Object.values(EXTRA_SKILLS))if(sk.job===j&&!sk.ultra&&characterLevel(st,c)>=sk.level&&jobRank(st,c,j)>=(sk.rank||1))st.learnedSkills[c].push(sk.id);}}
 const list=st.learnedSkills[cid]||(st.learnedSkills[cid]=[]),job=st.jobs[cid];for(const sk of Object.values(EXTRA_SKILLS))if(sk.job===job&&!sk.ultra&&L>=sk.level&&jobRank(st,cid,job)>=(sk.rank||1)&&!list.includes(sk.id))list.push(sk.id);return list;}
function followerPositions(st,trail,progress,moving){return st.party.slice(1,4).flatMap((cid,i)=>{const from=trail[i];if(!from)return [];const to=i===0?st.pos:trail[i-1],dx=to.x-from.x,dy=to.y-from.y,k=moving?Math.max(0,Math.min(1,progress)):0;return [{cid,x:(from.x+dx*k)*16,y:(from.y+dy*k)*16,dir:dy>0?0:dy<0?1:dx<0?2:dx>0?3:st.dir}];});}
function atFamily(st=G.st){const m=MAPS[st.mapId];return G.screen==='explore'&&!!m&&m.kind==='out'&&!st.run&&!st.stream&&!streamPending()&&isSafe()&&m.objects.some(o=>o.type==='studio'&&Math.abs(o.x-st.pos.x)+Math.abs(o.y-st.pos.y)<=1)&&G.sheet==='party'&&G.familyRosterMap===st.mapId;}
function changeCompanions(st,kind,value){if(G.readOnly||!atFamily(st))return false;rememberSpecialUnlocks(st);if(kind==='up'){const i=Number(value);if(!Number.isInteger(i)||i<1||i>=st.party.length)return false;[st.party[i-1],st.party[i]]=[st.party[i],st.party[i-1]];}
 else if(kind==='out'){const i=Number(value);if(!Number.isInteger(i)||i<0||i>=st.party.length||st.party.length<=2||requiredCompanion(st.party[i]))return false;st.party.splice(i,1);}
 else if(kind==='in'){if(!st.roster.includes(value)||st.party.includes(value))return false;if(st.party.length>=4){const i=companionReplaceSlot(st);if(i<0||requiredCompanion(st.party[i]))return false;st.party[i]=value;}else st.party.push(value);}else return false;syncPartyExperience(st);return true;}
function captureCompanionStats(st,cids){return Object.fromEntries(cids.map(c=>[c,{L:characterLevel(st,c),s:charStats(st,c,partyLevel(st)),xp:st.memberXp?.[c]??st.xp}]));}
function finishCompanionGrowth(st,run,res,before){const detail={},growth=[];st.lastMpGrowth={members:[]};for(const m of run.party){const c=m.cid,a=before[c],L=characterLevel(st,c),b=charStats(st,c,L);growth.push({cid:c,before:a.L,after:L,gain:st.memberXp[c]-a.xp});detail[c]={job:b.job,rows:[['最大HP',a.s.maxHP,b.maxHP,'main'],['最大MP',a.s.startC,b.startC,'main'],['攻撃力',a.s.atk,b.atk,'main'],['防御力',a.s.defTotal,b.defTotal,'main'],...STAT_KEYS.map(k=>[STAT_NAMES[k],a.s.base[k],b.base[k],''])]};if(L>a.L){st.vitals[c]={hp:b.maxHP,c:b.startC,maxMP:b.startC};st.lastMpGrowth.members.push({cid:c,before:a.s.startC,after:b.startC});}rememberSkills(st,c,L);}
 res.characterGrowth=growth;res.statDetail=detail;res.statUps=null;if(!st.lastMpGrowth.members.length)delete st.lastMpGrowth;ensureVitals(st);}
const SPECIAL_LEVELS=[120,200,300,400,500,600,700,800,900,999];
FACILITY.specialExit={mark:'帰',name:'特設エリア帰還口',color:'#83B9AE'};

/* 新章は特設エリアと並行して育成できる。本編進行を下限レベルで強制制限しない。 */
for(const c of NEXT_CHAPTER){for(let j=1;j<=3;j++){const a=AREAS[c.id+'-A'+j];a.chapterLevel=c.level+(j-1)*5;a.chapterIndex=c.index;}BOSSES[c.bid].chapterLevel=c.level+10;BOSSES[c.bid].chapterIndex=c.index;QUESTS[c.qid].chapterLevel=c.level;QUESTS[c.sid].chapterLevel=c.level;
 const shop=SHOPS[c.shopId];
 JOB_IDS.forEach((job,i)=>{for(const [k,slot]of ['w','a','acc'].entries()){const id='NXG'+c.id.slice(2)+job.slice(1)+k,needR=30+c.index*10;const stats=slot==='w'?{atk:55+c.index*10,commentA:4+c.index}:slot==='a'?{d:25+c.index*5,hp:110+c.index*20}:{c:18+c.index*4,hp:65+c.index*12};EQUIP[id]={slot,job,needR,expansion:616,name:c.pref+'遠征・'+JOBS[job].name+'の'+['指示具','防護服','連携証'][k],...stats,price:7000+c.index*2000,text:JOBS[job].name+'専用・熟練度'+needR+'以上。'+gearStatsText(stats)+'。入手：'+c.name+'のギア店。'};shop.items.push(id);}});
 const reward='NXR'+c.id.slice(2);EQUIP[reward]={slot:'acc',name:c.pref+'の合同枠の絆',c:20+c.index*4,hp:100+c.index*20,commentA:10+c.index,rare:true,nonSale:true,price:0,text:'地域ボス初回撃破報酬。最大MP＋'+(20+c.index*4)+'／最大HP＋'+(100+c.index*20)+'／コメントのエール＋'+(10+c.index)+'。'};c.reward=reward;
}
function chapterXP(L){return regionalXP(L);}
function chapterBossReward(st,run,res){const area=NATIONAL_SPECIALS.find(c=>c.bid===run.bossId);if(area&&run.kind==='boss'){st.nationalRewards=st.nationalRewards||{};if(!st.nationalRewards[area.id]){if(giveGear(st,area.reward,res,'地域特別ボス初回報酬'))st.nationalRewards[area.id]=true;else res.notes.push('地域特別報酬は保管場所が満杯です。空きを作って再戦すると受け取れます。');}}const c=NEXT_CHAPTER.find(c=>c.bid===run.bossId);if(!c||run.kind!=='boss')return;st.chapterRewards=st.chapterRewards||{};if(!st.chapterRewards[c.id]){if(giveGear(st,c.reward,res,'新章ボス初回報酬'))st.chapterRewards[c.id]=true;else res.notes.push('新章の絆報酬は保管場所が満杯です。空きを作り、ボス再戦で受け取れます。');}}


function renderChapterBoss(b,bid){const st=G.st,L=b.regionalLevel||b.chapterLevel,ps=bossScale(bid,st.party.length),df=DIFFICULTY[st.settings.difficulty],c=NEXT_CHAPTER.find(c=>c.bid===bid),profile=regionBossProfile(b,df,ps),counter={guard:'ガード',comment:'応援コメント',damage:'攻撃'}[b.cue];return `<p><b>${esc(b.name)}</b>／適正Lv${L}・現在Lv${partyLevel(st)}</p><p class="warn">オート使用可。必要な場面では停止して手動で行動を選べます。</p><p>HP ${profile.hp}／防御力 ${profile.def}／難易度 ${esc(df.name)}</p>${mainPropForBoss(bid)?`<p class="small">本番の準備：${caseRecord(st,mainPropForBoss(bid).id)?.done||chapterPropPast(st,mainPropForBoss(bid))?"✓ 完了":"準備品の使用が必要"} <button class="btn" data-a="storyOpen" data-v="${mainPropForBoss(bid).id}">事件帳で確認</button></p>`:""}<p>行動周期：単体${Math.ceil(profile.cycle[0].p*profile.atkMult)} → 全体${Math.ceil(profile.cycle[1].p*profile.atkMult)} → ため → 全体強攻撃${Math.ceil(profile.cycle[3].p*profile.atkMult)}。</p><p>ため予告中に異なる2人が${counter}すると、直後の強攻撃を20％軽減しエール＋12。攻撃しない回復・防護・エールの技能も対処に数えます。</p><p>通常攻撃を35％軽減するノイズシールドは、エール40以上かキラコメ完成で解除。職業技は軽減されません。6ターン目以降、3ターンごとに敵の攻撃が10％増加（最大50％）。装備・固有技・MP回復を準備しましょう。</p><p>初回の地域限定報酬：${c?esc(EQUIP[c.reward].name)+'。'+esc(gearStatsText(EQUIP[c.reward])):'地域装備・熟練度の職業装備'}。保管場所が満杯なら、空きを作ってファミリー施設で再戦すると受け取れます。ボスから経験値・ゴールドも獲得。</p><p class="small">敗北・撤退しても受注と討伐数は保持。準備を整えて再挑戦できます。</p><div class="stack"><button class="btn primary" data-a="bossGo" data-v="${bid}">挑戦する</button><button class="btn" data-a="closeSheet">準備する</button></div>`;}

function renderNextChapter(){return renderNationalTour();}

const SPECIAL_THEMES=['初見の星路','コアの回廊','コメント万華鏡','キラコメ星雲','ぽこナイト城','締め前時空','ファミリー銀河','イベラス深淵','S6天頂宮','九州アンコール神域'];
const SPECIAL_STAGES=SPECIAL_LEVELS.map((level,i)=>({id:'SP'+String(i+1).padStart(2,'0'),area:'SP'+String(i+1).padStart(2,'0')+'-A1',boss:'SB'+String(i+1).padStart(2,'0'),challenge:'SC'+String(i+1).padStart(2,'0'),level,name:SPECIAL_THEMES[i],index:i}));
(function addSpecialWorld(){for(const s of SPECIAL_STAGES){const i=s.index,q=Math.ceil((s.level-5)/1.5),template=AREAS['KY17-A3'];AREAS[s.area]={...template,id:s.area,name:s.name,prefix:s.name,lore:'S6を目指した九州の声が集まった特設訓練域。同行4人の育成・転職技・永続ボーナスを組み合わせる。',q,specialStage:i,list:template.list.map(r=>r.slice())};
 MAPS[s.id]={hub:'KY16',name:s.name,kind:'in',w:24,h:18,safeAnchor:[3,15],tiles:buildMap(24,18,[['.',1,1,22,16],['1',6,2,16,11],['T',9+i%5,4,2,4+i%3],[',',1,14,22,3]]),zones:{'1':s.area},objects:[{id:'specialExit',x:3,y:16,type:'specialExit',label:'ファミリー施設へ戻る'},{id:'specialSign',x:5,y:14,type:'sign',area:s.area,label:'特設エリア案内'},{id:'specialBoss',x:21,y:2,type:'boss',boss:s.boss,label:s.name+'の守護者'}]};
 STAGE_KIND[s.area]=STAGE_KIND['KY17-A3'];AREA_SKY[s.area]=AREA_SKY['KY17-A3'];
 BOSSES[s.boss]={name:s.name+'・配信の守護者',hub:'KY16',q,areaId:s.area,cue:['guard','comment','damage'][i%3],shape:'lantern',col:[PAL.gold,PAL.violet],specialStage:i};
 const gear='SG'+String(i+1).padStart(2,'0'),slot=['w','a','acc'][i%3],stats=slot==='w'?{atk:50+i*8,crit:5,c:15}:slot==='a'?{d:24+i*4,hp:80+i*15,c:15+3*i}:{c:18+i*3,hp:60+i*10,commentA:12+i};EQUIP[gear]={slot,name:s.name+'の継承具',...stats,price:0,rare:true,nonSale:true,text:'特設ボスの初回報酬。'+gearStatsText(stats)+'。'};s.reward=gear;
 const tid='STG'+String(i+1).padStart(2,'0');EQUIP[tid]={slot:'acc',name:s.name+'の挑戦証',c:25+i*4,hp:100+i*20,crit:6,price:0,nonSale:true,rare:true,text:'特設チャレンジ初回報酬。最大MP＋'+(25+i*4)+'、最大HP＋'+(100+i*20)+'、会心率＋6％。'};
 const cb='SBC'+String(i+1).padStart(2,'0');BOSSES[cb]={...BOSSES[s.boss],name:s.name+'・極限枠主'};POCO_TRIALS.push({id:s.challenge,name:s.name+'・継承実技',unlock:'M16',boss:cb,reward:tid,q,level:s.level,fee:1000+i*500,turns:26+i*2,party:4,jobs:3,skills:6+i,masters:3+Math.floor(i/2),guards:2,kira:i>=2,desc:'レベル999へ向けた特設チャレンジ。現在職と前職の習得技を使い分け、敵の予告に対処する。',specialStage:i});
 }} )();

/* v6.20: a chapter unlocks one 100-level band; raw earned experience is retained. */
const FINAL_LEVEL_CAP=999;
const PROGRESSION_CHAPTERS=[...NATIONAL_CHAPTERS.map(c=>({id:c.id,name:c.name,hubs:c.hubs,unlock:c.unlock})),...NATIONAL_ENCORES.map(c=>({id:c.id,name:c.name,hubs:[c.id],unlock:c.unlock}))];
const chapterLimit=n=>Math.min(FINAL_LEVEL_CAP,Math.max(1,n)*100);
function chapterUnlocked(st,c){return !!st&&c.hubs.length>0&&c.hubs.every(id=>!!HUBS[id]&&!!MAPS[id])&&(!c.unlock||st.quests[c.unlock]==='complete');}
function progressionCap(st){let n=0;for(const c of PROGRESSION_CHAPTERS){if(!chapterUnlocked(st,c))break;n++;}return chapterLimit(n);}
// st.xp keeps the historical raw average for save compatibility; reserved XP must not raise the active party level.
function partyExperience(st){const cap=xpFor(progressionCap(st));return st.memberXp?Math.floor(st.party.reduce((n,c)=>n+Math.min(cap,st.memberXp[c]??st.xp),0)/st.party.length):Math.min(cap,st.xp);}
function partyLevel(st){return levelOf(partyExperience(st));}
function jobRank(st,cid,job){return Math.min(progressionCap(st),rankOf(jpOf(st,cid,job)));}
function skillAvailable(st,cid,sk,job=st.jobs[cid]){return (!sk.ultra||equippedUltraSkills(st,cid,job).includes(sk.id))&&(!sk.character||sk.character===cid&&characterRecord(st,cid).seen>=1)&&characterLevel(st,cid)>=(sk.level||1)&&(!sk.job||jobRank(st,cid,sk.job)>=(sk.rank||1));}

function normalizeChapterLocation(st){if(!st||st.run)return;const a=SPECIAL_STAGES.find(a=>a.id===st.mapId);if(!a||a.level<=progressionCap(st))return;const old=st.specialReturn,m=old&&MAPS[old.map],target=m&&!SPECIAL_STAGES.some(a=>a.id===old.map)?old.map:'KY16',map=MAPS[target];st.mapId=target;st.pos={x:map.safeAnchor[0],y:map.safeAnchor[1]};st.progressionMigrationNote='地域編の上限調整で未解放となった特設エリアから、安全地帯へ移動しました。経験値・所持品・クリア記録は保持しています。';}

function progressionHtml(st){const cap=progressionCap(st),reserve=st.roster.filter(c=>levelOf(st.memberXp?.[c]??st.xp)>cap||Object.values(st.jp[c]||{}).some(j=>rankOf(j)>cap));return `${st.progressionMigrationNote?`<p class="small warn">${esc(st.progressionMigrationNote)}</p>`:""}<section class="setcard"><b>解放上限：レベル・職業熟練度 ${cap}／最終999</b><p>九州100→中国・四国200→近畿・東海300→北陸・甲信越400→東北・北海道500→関東600。全国本編クリア後の任意の追加遠征で700→800→900→999です。</p><p class="small">現在の地域編で上限に達すると、経験値・熟練度の加算は止まります。次の地域編の解放後に育成を再開できます。中国・四国編クリアで近畿・東海編が解放され、上限300になります。</p>${reserve.length?'<p class="small warn">旧セーブの上限超過分は保留しています。獲得済みの経験値・熟練度・習得記録を保持し、次の上限解放時に有効になります。</p>':''}</section>`;}
function regionalXP(L){L=Math.max(1,Math.min(999,Math.round(L)));const step=xpFor(L===999?999:L+1)-xpFor(L===999?998:L);return Math.max(4,Math.ceil(step*.06));}
function battleTrainingLevel(run){const b=BOSSES[run.bossId],a=AREAS[run.areaId];return b?.regionalLevel||b?.chapterLevel||(b?.specialStage!=null?SPECIAL_STAGES[b.specialStage].level:0)||a?.regionalLevel||a?.chapterLevel||(a?.specialStage!=null?SPECIAL_STAGES[a.specialStage].level:0)||Math.max(1,Math.min(999,Math.round(run.q*1.5+5)));}
function regionalJP(L,boss=false){L=Math.max(1,Math.min(999,Math.round(L)));const step=jpFor(L===999?999:L+1)-jpFor(L===999?998:L);return Math.max(6,Math.ceil(step*(boss?0.65:0.12)));}
function regionBossProfile(b,df,ps){const L=b.regionalLevel||b.chapterLevel||SPECIAL_STAGES[b.specialStage].level,scale=b.mainBalance?1.25:b.nationalSpecial?1.18:b.specialStage!=null?1.12:1;return {hp:Math.ceil(L*(120+L*.6)*scale*(b.mainBalance?1.15:1)*df.hp*ps.hp),def:Math.ceil(L*.6),atkMult:df.atk*ps.atk,cycle:[{t:'s',p:Math.ceil(L*(4.5+L*.012)*scale)},{t:'a',p:Math.ceil(L*(2.8+L*.008)*scale)},{t:'c',p:0},{t:'a',p:Math.ceil(L*(6+L*.012)*scale),heavy:true}]};}
(function tuneChapterGrowth(){
 const kyLevels=[5,10,16,22,28,34,40,46,52,58,64,70,76,82,88,96,100];
 for(const [i,hub]of HUB_ORDER.filter(id=>id.startsWith('KY')).entries()){const L=kyLevels[i],qid=mainQuestOf(hub),q=QUESTS[qid],boss=BOSSES[q.boss];for(let j=1;j<=3;j++)AREAS[hub+'-A'+j].regionalLevel=Math.min(100,L+j-1);boss.regionalLevel=Math.min(100,L+3);q.regionalLevel=L;QUESTS[sideQuestOf(hub)].regionalLevel=L;}
 for(const c of NEXT_CHAPTER){const boss=BOSSES[c.bid];boss.chapterLevel=boss.regionalLevel=Math.min(200,c.level+5);for(let j=1;j<=3;j++){const a=AREAS[c.id+'-A'+j];a.chapterLevel=a.regionalLevel=Math.min(200,c.level+j-1);}for(const [id,it]of Object.entries(EQUIP))if(it.expansion===616&&SHOPS[c.shopId].items.includes(id)){it.needR=[40,50,60,70,85,100,120,140,160][c.index];if(it.slot==='w')it.atk=48+c.index*5;if(it.slot==='a')it.d=20+c.index*3;it.text=JOBS[it.job].name+'専用・熟練度'+it.needR+'以上。'+gearStatsText(it)+'。入手：'+c.name+'のギア店。';}const reward=EQUIP[c.reward];reward.hp=60+c.index*6;reward.c=12+c.index*2;reward.text='地域ボス初回報酬。'+gearStatsText(reward)+'。';}
 for(const d of POCO_TRIALS)if(d.specialStage==null)BOSSES[d.boss].regionalLevel=d.level;
 for(const [id,it]of Object.entries(EQUIP)){if(it.job)continue;let level=it.needL||1;if(it.needL!=null)level=it.needL;else if(it.expansion===614)level=1+it.gearTier*12;else if(/^R[WAX]\d{2}$/.test(id)){const n=+id.slice(2);level=n<=8?[8,18,30,42,54,66,78,90][n-1]:NEXT_CHAPTER[n-9].level-10;}else if(/^S[WAX][1-4]$/.test(id))level=[20,40,65,85][+id.slice(2)-1];else if(id.startsWith('OM'))level=95;else if(/^RR[WAX]/.test(id))level=[30,60,90][+id.slice(-1)-1]||30;else if(it.ultra)level=80;else if(/^NXR/.test(id))level=NEXT_CHAPTER[+id.slice(3)-1].level;else if(/^S(TG|G)\d/.test(id)){const n=+id.replace(/\D/g,'')-1;level=SPECIAL_STAGES[n].level-10;}else if(/^CE/.test(id)){level=POCO_TRIALS.find(d=>d.reward===id)?.level||1;}else if(!it.nonSale&&!['CW01','CA01'].includes(id))level=Math.min(85,Math.max(1,Math.floor(Math.max(it.atk||0,(it.d||0)*2,(it.c||0)*3)*1.2)));it.needL=Math.max(1,Math.min(999,Math.round(level)));if(it.ultra)EXTRA_SKILLS[it.skill].level=it.needL;it.text=(it.text||'')+' 装備条件：個人Lv'+it.needL+'以上。';}
 for(const job of JOB_IDS){const a=EXTRA_SKILLS[job+'M1'],b=EXTRA_SKILLS[job+'M2'];a.rank=a.level=30;b.rank=80;b.level=75;const i=JOB_IDS.indexOf(job);for(let n=0;n<2;n++){const effect=JOB_TECHS[i][2+n],[need,cost,desc]=TECH_INFO[effect],id=job+'C'+(n+1),rank=n?180:130;EXTRA_SKILLS[id]={id,job,name:(n?'広域奥義・':'合同枠技・')+JOB_TECHS[i][n],effect,need,cost:cost+(n?18:12),level:rank,rank,cooldown:n?5:4,power:n?2.15:1.85,desc:desc+'。攻撃・回復・支援を強化、MPと再使用待ちが必要。'};}}
})();

const GAME_GEO={"KY01":{"lat":33.59,"lon":130.401672,"query":"福岡県福岡市役所","title":"福岡県福岡市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%A6%8F%E5%B2%A1%E7%9C%8C%E7%A6%8F%E5%B2%A1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY02":{"lat":33.883411,"lon":130.875229,"query":"福岡県北九州市役所","title":"福岡県北九州市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%A6%8F%E5%B2%A1%E7%9C%8C%E5%8C%97%E4%B9%9D%E5%B7%9E%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY03":{"lat":33.449802,"lon":129.967682,"query":"佐賀県唐津市役所","title":"佐賀県唐津市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E4%BD%90%E8%B3%80%E7%9C%8C%E5%94%90%E6%B4%A5%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY04":{"lat":33.263512,"lon":130.300888,"query":"佐賀県佐賀市役所","title":"佐賀県佐賀市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E4%BD%90%E8%B3%80%E7%9C%8C%E4%BD%90%E8%B3%80%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY05":{"lat":33.17992,"lon":129.715088,"query":"長崎県佐世保市役所","title":"長崎県佐世保市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%95%B7%E5%B4%8E%E7%9C%8C%E4%BD%90%E4%B8%96%E4%BF%9D%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY06":{"lat":32.749527,"lon":129.879807,"query":"長崎県長崎市役所","title":"長崎県長崎市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%95%B7%E5%B4%8E%E7%9C%8C%E9%95%B7%E5%B4%8E%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY07":{"lat":32.803333,"lon":130.708054,"query":"熊本県熊本市役所","title":"熊本県熊本市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%86%8A%E6%9C%AC%E7%9C%8C%E7%86%8A%E6%9C%AC%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY08":{"lat":32.952099,"lon":131.121277,"query":"熊本県阿蘇市","title":"熊本県阿蘇市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%86%8A%E6%9C%AC%E7%9C%8C%E9%98%BF%E8%98%87%E5%B8%82","kind":"市区町村の地名代表点"},"KY09":{"lat":33.284721,"lon":131.491104,"query":"大分県別府市役所","title":"大分県別府市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%A4%A7%E5%88%86%E7%9C%8C%E5%88%A5%E5%BA%9C%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY10":{"lat":33.239445,"lon":131.609726,"query":"大分県大分市役所","title":"大分県大分市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%A4%A7%E5%88%86%E7%9C%8C%E5%A4%A7%E5%88%86%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY11":{"lat":31.907681,"lon":131.420288,"query":"宮崎県宮崎市役所","title":"宮崎県宮崎市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%AE%AE%E5%B4%8E%E7%9C%8C%E5%AE%AE%E5%B4%8E%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY12":{"lat":31.60181,"lon":131.378754,"query":"宮崎県日南市役所","title":"宮崎県日南市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%AE%AE%E5%B4%8E%E7%9C%8C%E6%97%A5%E5%8D%97%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY13":{"lat":31.740877,"lon":130.76329,"query":"鹿児島県霧島市役所","title":"鹿児島県霧島市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%B9%BF%E5%85%90%E5%B3%B6%E7%9C%8C%E9%9C%A7%E5%B3%B6%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY14":{"lat":31.596861,"lon":130.557022,"query":"鹿児島県鹿児島市役所","title":"鹿児島県鹿児島市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%B9%BF%E5%85%90%E5%B3%B6%E7%9C%8C%E9%B9%BF%E5%85%90%E5%B3%B6%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY15":{"lat":26.212374,"lon":127.679108,"query":"沖縄県那覇市役所","title":"沖縄県那覇市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%B2%96%E7%B8%84%E7%9C%8C%E9%82%A3%E8%A6%87%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY16":{"lat":26.591667,"lon":127.977501,"query":"沖縄県名護市役所","title":"沖縄県名護市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%B2%96%E7%B8%84%E7%9C%8C%E5%90%8D%E8%AD%B7%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KY17":{"lat":33.030277,"lon":130.446106,"query":"福岡県大牟田市役所","title":"福岡県大牟田市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%A6%8F%E5%B2%A1%E7%9C%8C%E5%A4%A7%E7%89%9F%E7%94%B0%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX01":{"lat":33.839165,"lon":132.76564,"query":"愛媛県松山市役所","title":"愛媛県松山市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%84%9B%E5%AA%9B%E7%9C%8C%E6%9D%BE%E5%B1%B1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX02":{"lat":33.558723,"lon":133.531097,"query":"高知県高知市","title":"高知県高知市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%AB%98%E7%9F%A5%E7%9C%8C%E9%AB%98%E7%9F%A5%E5%B8%82","kind":"市区町村の地名代表点"},"NX03":{"lat":34.070091,"lon":134.554703,"query":"徳島県徳島市役所","title":"徳島県徳島市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%BE%B3%E5%B3%B6%E7%9C%8C%E5%BE%B3%E5%B3%B6%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX04":{"lat":34.342758,"lon":134.046524,"query":"香川県高松市役所","title":"香川県高松市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%A6%99%E5%B7%9D%E7%9C%8C%E9%AB%98%E6%9D%BE%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX05":{"lat":34.655186,"lon":133.919754,"query":"岡山県岡山市役所","title":"岡山県岡山市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%B2%A1%E5%B1%B1%E7%9C%8C%E5%B2%A1%E5%B1%B1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX06":{"lat":35.494453,"lon":134.222153,"query":"鳥取県鳥取市役所","title":"鳥取県鳥取市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%B3%A5%E5%8F%96%E7%9C%8C%E9%B3%A5%E5%8F%96%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX07":{"lat":35.467815,"lon":133.048523,"query":"島根県松江市役所","title":"島根県松江市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%B3%B6%E6%A0%B9%E7%9C%8C%E6%9D%BE%E6%B1%9F%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX08":{"lat":34.177845,"lon":131.473022,"query":"山口県山口市役所","title":"山口県山口市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%B1%B1%E5%8F%A3%E7%9C%8C%E5%B1%B1%E5%8F%A3%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"NX09":{"lat":34.385277,"lon":132.455276,"query":"広島県広島市役所","title":"広島県広島市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%BA%83%E5%B3%B6%E7%9C%8C%E5%BA%83%E5%B3%B6%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT01":{"lat":34.718613,"lon":136.505676,"query":"三重県津市役所","title":"三重県津市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E4%B8%89%E9%87%8D%E7%9C%8C%E6%B4%A5%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT02":{"lat":34.230556,"lon":135.170837,"query":"和歌山県和歌山市役所","title":"和歌山県和歌山市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%92%8C%E6%AD%8C%E5%B1%B1%E7%9C%8C%E5%92%8C%E6%AD%8C%E5%B1%B1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT03":{"lat":34.685001,"lon":135.804718,"query":"奈良県奈良市役所","title":"奈良県奈良市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%A5%88%E8%89%AF%E7%9C%8C%E5%A5%88%E8%89%AF%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT04":{"lat":34.69389,"lon":135.502228,"query":"大阪府大阪市役所","title":"大阪府大阪市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%A4%A7%E9%98%AA%E5%BA%9C%E5%A4%A7%E9%98%AA%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT05":{"lat":34.689423,"lon":135.195755,"query":"兵庫県神戸市役所","title":"兵庫県神戸市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%85%B5%E5%BA%AB%E7%9C%8C%E7%A5%9E%E6%88%B8%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT06":{"lat":35.011669,"lon":135.768112,"query":"京都府京都市役所","title":"京都府京都市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E4%BA%AC%E9%83%BD%E5%BA%9C%E4%BA%AC%E9%83%BD%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT07":{"lat":35.017776,"lon":135.854721,"query":"滋賀県大津市役所","title":"滋賀県大津市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%BB%8B%E8%B3%80%E7%9C%8C%E5%A4%A7%E6%B4%A5%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT08":{"lat":35.426201,"lon":136.759933,"query":"岐阜県岐阜市役所","title":"岐阜県岐阜市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%B2%90%E9%98%9C%E7%9C%8C%E5%B2%90%E9%98%9C%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT09":{"lat":35.181438,"lon":136.90657,"query":"愛知県名古屋市役所","title":"愛知県名古屋市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%84%9B%E7%9F%A5%E7%9C%8C%E5%90%8D%E5%8F%A4%E5%B1%8B%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KT10":{"lat":34.975185,"lon":138.383286,"query":"静岡県静岡市役所","title":"静岡県静岡市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%9D%99%E5%B2%A1%E7%9C%8C%E9%9D%99%E5%B2%A1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"HK01":{"lat":36.064075,"lon":136.219589,"query":"福井県福井市役所","title":"福井県福井市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%A6%8F%E4%BA%95%E7%9C%8C%E7%A6%8F%E4%BA%95%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"HK02":{"lat":36.56105,"lon":136.656494,"query":"石川県金沢市役所","title":"石川県金沢市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%9F%B3%E5%B7%9D%E7%9C%8C%E9%87%91%E6%B2%A2%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"HK03":{"lat":36.695904,"lon":137.213715,"query":"富山県富山市役所","title":"富山県富山市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%AF%8C%E5%B1%B1%E7%9C%8C%E5%AF%8C%E5%B1%B1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"HK04":{"lat":36.648537,"lon":138.194824,"query":"長野県長野市役所","title":"長野県長野市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%95%B7%E9%87%8E%E7%9C%8C%E9%95%B7%E9%87%8E%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"HK05":{"lat":35.662231,"lon":138.568298,"query":"山梨県甲府市役所","title":"山梨県甲府市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%B1%B1%E6%A2%A8%E7%9C%8C%E7%94%B2%E5%BA%9C%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"HK06":{"lat":37.916077,"lon":139.036545,"query":"新潟県新潟市役所","title":"新潟県新潟市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%96%B0%E6%BD%9F%E7%9C%8C%E6%96%B0%E6%BD%9F%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"TH01":{"lat":37.76083,"lon":140.474747,"query":"福島県福島市役所","title":"福島県福島市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%A6%8F%E5%B3%B6%E7%9C%8C%E7%A6%8F%E5%B3%B6%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"TH02":{"lat":38.268162,"lon":140.869507,"query":"宮城県仙台市役所","title":"宮城県仙台市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%AE%AE%E5%9F%8E%E7%9C%8C%E4%BB%99%E5%8F%B0%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"TH03":{"lat":38.255459,"lon":140.339767,"query":"山形県山形市役所","title":"山形県山形市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%B1%B1%E5%BD%A2%E7%9C%8C%E5%B1%B1%E5%BD%A2%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"TH04":{"lat":39.719959,"lon":140.103516,"query":"秋田県秋田市役所","title":"秋田県秋田市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%A7%8B%E7%94%B0%E7%9C%8C%E7%A7%8B%E7%94%B0%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"TH05":{"lat":39.702068,"lon":141.154465,"query":"岩手県盛岡市役所","title":"岩手県盛岡市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%B2%A9%E6%89%8B%E7%9C%8C%E7%9B%9B%E5%B2%A1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"TH06":{"lat":40.822639,"lon":140.746964,"query":"青森県青森市役所","title":"青森県青森市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E9%9D%92%E6%A3%AE%E7%9C%8C%E9%9D%92%E6%A3%AE%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"TH07":{"lat":43.062077,"lon":141.354401,"query":"北海道札幌市役所","title":"北海道札幌市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%8C%97%E6%B5%B7%E9%81%93%E6%9C%AD%E5%B9%8C%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KN01":{"lat":36.365852,"lon":140.471588,"query":"茨城県水戸市役所","title":"茨城県水戸市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E8%8C%A8%E5%9F%8E%E7%9C%8C%E6%B0%B4%E6%88%B8%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KN02":{"lat":36.555115,"lon":139.882599,"query":"栃木県宇都宮市役所","title":"栃木県宇都宮市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%A0%83%E6%9C%A8%E7%9C%8C%E5%AE%87%E9%83%BD%E5%AE%AE%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KN03":{"lat":36.389462,"lon":139.063461,"query":"群馬県前橋市役所","title":"群馬県前橋市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%BE%A4%E9%A6%AC%E7%9C%8C%E5%89%8D%E6%A9%8B%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KN04":{"lat":35.861683,"lon":139.645676,"query":"埼玉県さいたま市役所","title":"埼玉県さいたま市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%9F%BC%E7%8E%89%E7%9C%8C%E3%81%95%E3%81%84%E3%81%9F%E3%81%BE%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KN05":{"lat":35.607037,"lon":140.106064,"query":"千葉県千葉市役所","title":"千葉県千葉市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%8D%83%E8%91%89%E7%9C%8C%E5%8D%83%E8%91%89%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KN06":{"lat":35.450336,"lon":139.634216,"query":"神奈川県横浜市役所","title":"神奈川県横浜市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E7%A5%9E%E5%A5%88%E5%B7%9D%E7%9C%8C%E6%A8%AA%E6%B5%9C%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"KN07":{"lat":35.707817,"lon":139.752655,"query":"東京都文京区役所","title":"東京都文京区","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%96%87%E4%BA%AC%E5%8C%BA%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"EN01":{"lat":34.409161,"lon":133.205627,"query":"広島県尾道市役所","title":"広島県尾道市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%BA%83%E5%B3%B6%E7%9C%8C%E5%B0%BE%E9%81%93%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"EN02":{"lat":37.446533,"lon":138.851486,"query":"新潟県長岡市役所","title":"新潟県長岡市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%96%B0%E6%BD%9F%E7%9C%8C%E9%95%B7%E5%B2%A1%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"EN03":{"lat":38.268162,"lon":140.869507,"query":"宮城県仙台市役所","title":"宮城県仙台市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%AE%AE%E5%9F%8E%E7%9C%8C%E4%BB%99%E5%8F%B0%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"EN04":{"lat":35.707817,"lon":139.752655,"query":"東京都文京区役所","title":"東京都文京区","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%96%87%E4%BA%AC%E5%8C%BA%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"RS02":{"lat":34.341156,"lon":132.90535,"query":"広島県竹原市役所","title":"広島県竹原市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%BA%83%E5%B3%B6%E7%9C%8C%E7%AB%B9%E5%8E%9F%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"RS03":{"lat":34.328224,"lon":136.829666,"query":"三重県志摩市役所","title":"三重県志摩市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E4%B8%89%E9%87%8D%E7%9C%8C%E5%BF%97%E6%91%A9%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"RS04":{"lat":37.039131,"lon":137.862701,"query":"新潟県糸魚川市役所","title":"新潟県糸魚川市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%96%B0%E6%BD%9F%E7%9C%8C%E7%B3%B8%E9%AD%9A%E5%B7%9D%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"RS05":{"lat":41.768688,"lon":140.728943,"query":"北海道函館市役所","title":"北海道函館市","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E5%8C%97%E6%B5%B7%E9%81%93%E5%87%BD%E9%A4%A8%E5%B8%82%E5%BD%B9%E6%89%80","kind":"市区町村の地名代表点"},"RS06":{"lat":27.094267,"lon":142.191925,"query":"東京都小笠原村役場","title":"東京都小笠原村","source":"https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%B0%8F%E7%AC%A0%E5%8E%9F%E6%9D%91%E5%BD%B9%E5%A0%B4","kind":"市区町村の地名代表点"}};
function mercatorPoint(lat,lon,z){const n=256*2**z,p=Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/180;return {x:(lon+180)/360*n,y:(1-Math.log(Math.tan(p)+1/Math.cos(p))/Math.PI)/2*n};}
function mercatorLocation(x,y,z){const n=256*2**z;return {lon:x/n*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI};}
function geographyKnownHubs(st){return HUB_ORDER.filter(id=>hubUnlocked(st,id)||st.visitedHubs.includes(id));}
function geographySelect(id){if(!geographyKnownHubs(G.st).includes(id)||!GAME_GEO[id])return false;G.sheetData={...G.sheetData,geoFocus:id,geoZoom:9,geoLat:GAME_GEO[id].lat,geoLon:GAME_GEO[id].lon};render();return true;}
function geographyMove(kind){const d=G.sheetData,z=Math.max(5,Math.min(14,d.geoZoom||5));let lat=d.geoLat??35,lon=d.geoLon??135.5;const p=mercatorPoint(lat,lon,z);if(kind==='in'||kind==='out')d.geoZoom=Math.max(5,Math.min(14,z+(kind==='in'?1:-1)));else if(kind==='all'){d.geoZoom=5;lat=35;lon=135.5;}else{const delta={north:[0,-200],south:[0,200],west:[-200,0],east:[200,0]}[kind];if(!delta)return;const q=mercatorLocation(p.x+delta[0],p.y+delta[1],z);lat=Math.max(20,Math.min(48,q.lat));lon=Math.max(120,Math.min(150,q.lon));}d.geoLat=lat;d.geoLon=lon;render();}
function renderJapanMap(){const st=G.st,d=G.sheetData,z=Math.max(5,Math.min(14,d.geoZoom||5)),W=720,H=800,center=mercatorPoint(d.geoLat??35,d.geoLon??135.5,z),left=center.x-W/2,top=center.y-H/2,known=geographyKnownHubs(st),selected=known.includes(d.geoFocus)?d.geoFocus:st.mapId in GAME_GEO?st.mapId:curHub(),target=GAME_GEO[selected],labels=known.filter(id=>GAME_GEO[id]),tiles=[];for(let x=Math.floor(left/256);x<=Math.floor((left+W)/256);x++)for(let y=Math.floor(top/256);y<=Math.floor((top+H)/256);y++){if(x<0||y<0||x>=2**z||y>=2**z)continue;tiles.push(`<image href="https://cyberjapandata.gsi.go.jp/xyz/blank/${z}/${x}/${y}.png" x="${x*256-left}" y="${y*256-top}" width="256" height="256"/>`);}const marks=labels.map(id=>{const g=GAME_GEO[id],p=mercatorPoint(g.lat,g.lon,z),x=p.x-left,y=p.y-top;if(x<0||y<0||x>W||y>H)return '';return `<circle cx="${x}" cy="${y}" r="${id===selected?10:6}" fill="${id===selected?'#b74743':'#1f5862'}" stroke="#fff" stroke-width="2"/><text opacity="${z>=8||id===selected?1:0}" x="${x+11}" y="${y+4}" fill="#101820" stroke="#fff" stroke-width="3" paint-order="stroke" font-size="18">${esc(HUBS[id].name)}</text>`;}).join('');const official=target?'https://maps.gsi.go.jp/#12/'+target.lat+'/'+target.lon+'/&base=blank&ls=blank&disp=1':'';const page=Math.max(0,Math.min(Math.ceil(known.length/12)-1,d.geoPage||0));return `<p>県境・海岸線は国土地理院の白地図を表示。解放済み・訪問済みの街を、国土地理院の地名検索で確認した位置に示します。地名代表点は市区町村内の目印で、区域全体や撮影会場の入口を表すものではありません。</p><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="日本地図と解放済みの拠点" style="width:100%;max-width:620px;max-height:62vh;background:#dcecf2;overflow:hidden;border:2px solid #84959c"><rect width="${W}" height="${H}" fill="#dcecf2"/>${tiles.join('')}${marks}</svg><p class="small">出典：<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">国土地理院 地理院タイル 白地図</a>／地名代表点：国土地理院の地名検索。地図画像には通信が必要です。取得できない時は位置座標と公式地図リンクを利用できます。</p><div class="row3"><button class="btn" data-a="geoMove" data-v="in" ${z>=14?'disabled':''}>拡大＋</button><button class="btn" data-a="geoMove" data-v="out" ${z<=5?'disabled':''}>縮小－</button><button class="btn" data-a="geoMove" data-v="all">日本全体</button></div><div class="row4">${[['north','北へ'],['south','南へ'],['west','西へ'],['east','東へ']].map(([k,v])=>`<button class="btn" data-a="geoMove" data-v="${k}">${v}</button>`).join('')}</div>${target?`<section class="setcard"><b>${esc(HUBS[selected].pref)}・${esc(HUBS[selected].name)}</b><p>${target.kind}／北緯${target.lat.toFixed(6)}度・東経${target.lon.toFixed(6)}度</p><p class="small">照合した地名：${esc(target.title)}。距離や緯度経度の位置関係は実地理、ゲームの駅・会場・移動時間は創作です。</p><a class="btn" href="${official}" target="_blank" rel="noopener noreferrer">地理院地図で詳しく見る</a>${selected==='KN07'?'<a class="btn" href="https://www.tokyo-dome.co.jp/dome/access" target="_blank" rel="noopener noreferrer">東京ドームの公式アクセス地図</a>':''}</section>`:''}<div class="opts">${known.slice(page*12,page*12+12).map(id=>`<button class="btn" data-a="geoSelect" data-v="${id}">${esc(HUBS[id].pref+'・'+HUBS[id].name)}</button>`).join('')}</div><div class="choice-pages"><button class="btn" data-a="geoPage" data-v="${page-1}" ${page?'':'disabled'}>前へ</button><span>${page+1}/${Math.max(1,Math.ceil(known.length/12))}</span><button class="btn" data-a="geoPage" data-v="${page+1}" ${(page+1)*12<known.length?'':'disabled'}>次へ</button></div><p class="small">地域区分は本作の章立てです。三重県は近畿・東海編、新潟県は北陸・甲信越編に一度だけ含めます。北海道の後に関東へ戻り、東京で本編を完結します。</p>`;}
function geographicalRailDistance(from,to){if(!GAME_GEO[from]||!GAME_GEO[to])return null;if(from===to)return 0;const a=GAME_GEO[from],b=GAME_GEO[to],rad=x=>x*Math.PI/180,dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon),v=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;return Math.max(1,Math.ceil(6371*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v))*1.25));}

/* National chapters, post-clear growth bands and equipment. */
for(const c of NATIONAL_ALL_EXTRA){BOSSES[c.bid].nationalSpecial=c.id.startsWith('RS');const cap=('chapter'in c)?NATIONAL_CHAPTERS[c.chapter].cap:c.level;for(let j=1;j<=3;j++){const ar=AREAS[c.id+'-A'+j];ar.regionalLevel=ar.chapterLevel=Math.min(cap,c.level+j-1);}const b=BOSSES[c.bid];b.regionalLevel=b.chapterLevel=Math.min(cap,c.level+5);for(const id of [c.qid,c.sid])QUESTS[id].regionalLevel=QUESTS[id].chapterLevel=c.level;
 const shop=SHOPS[c.shopId];shop.items=shop.items.filter(id=>EQUIP[id]||ITEMS[id]);for(const job of JOB_IDS)for(const [k,slot]of ['w','a','acc'].entries()){const id='NG'+c.id+job+k,R=Math.max(1,c.level-20),x=Math.max(0,c.level-200),stats=slot==='w'?{atk:72+Math.floor(x*.2),commentA:6}:slot==='a'?{d:50+Math.floor(x*.14),hp:120+Math.floor(c.level*.7)}:{c:30+Math.floor(c.level*.1),hp:60+Math.floor(c.level*.3),family:4};EQUIP[id]={slot,job,needR:R,name:c.pref+'共演・'+JOBS[job].name+'の'+['指示具','防護服','交流証'][k],...stats,price:Math.ceil(c.level*55),text:JOBS[job].name+'専用・熟練度'+R+'以上。'+gearStatsText(stats)+'。入手：'+c.name+'のギア店。'};shop.items.push(id);}for(const [k,slot]of ['w','a','acc'].entries()){const id='NGC'+c.id+k,stats=slot==='w'?{atk:Math.floor(35+c.level*.07)}:slot==='a'?{d:Math.floor(14+c.level*.05),hp:Math.floor(c.level*.2)}:{c:Math.floor(10+c.level*.03)};EQUIP[id]={slot,name:c.pref+'の共通'+['マイク','ジャケット','リボン'][k],needL:Math.max(1,c.level-10),...stats,price:Math.ceil(c.level*25),text:'共通装備・個人Lv'+(c.level-10)+'以上。'+gearStatsText(stats)+'。'};shop.items.push(id);}}
for(const job of JOB_IDS)for(const R of [280,380,480,580,680,780,880,980]){const i=JOB_IDS.indexOf(job),effect=JOB_TECHS[i][R%200===80?2:3],[need,cost,desc]=TECH_INFO[effect],id=job+'N'+R;EXTRA_SKILLS[id]={id,job,name:'全国奥義'+R+'・'+JOB_TECHS[i][R%200===80?0:1],effect,need,cost:cost+Math.ceil(R/15),level:R,rank:R,cooldown:6,power:2.3+(R-280)/700,desc:desc+'。全国共演で磨いた上位職業技。'};}
for(const c of NATIONAL_SPECIALS){c.reward='NSR'+c.id;const hp=100+Math.floor(c.level*.4),mp=10+Math.floor(c.level*.08);EQUIP[c.reward]={slot:'acc',name:c.name+'の共演証',hp,c:mp,family:3,needL:c.level-5,price:0,rare:true,nonSale:true,text:'地域特別ボスの初回報酬。個人Lv'+(c.level-5)+'以上。最大HP＋'+hp+'、最大MP＋'+mp+'、ファミリー応援＋3。'};}
/* v7.20: one source for chapter balance, chapter loot and the system guide. */
const REQUIRED_PARTY=['hero','moe'];
const requiredCompanion=cid=>REQUIRED_PARTY.includes(cid);
function companionReplaceSlot(st){const n=Number(G.sheetData?.replaceSlot);return Number.isInteger(n)&&n>=0&&n<st.party.length&&!requiredCompanion(st.party[n])?n:st.party.findIndex(c=>!requiredCompanion(c));}
function normalizeRequiredParty(st){
 const old=st.party.slice(),next=REQUIRED_PARTY.every(c=>old.includes(c))?old:[...old.filter(requiredCompanion),...REQUIRED_PARTY.filter(c=>!old.includes(c)),...old.filter(c=>!requiredCompanion(c)).slice(0,2)];
 st.party=next;st.partyRulesVersion=2;
 if(old.join()!==next.join()){
  if(st.run?.state==='input'&&st.run.party.map(m=>m.cid).join()!==next.join()){
   storeVitals(st,st.run);st.bag=clone(st.run.bag||st.bag);st.mapId=st.run.returnPos.map;st.pos={x:st.run.returnPos.x,y:st.run.returnPos.y};st.run=null;
   st.progressionMigrationNote='編成ルール更新：主人公とヒロインが同行しました。進行中の戦闘は報酬なしで終了し、戦闘前の場所へ戻りました。経験値・所持品・依頼の記録は保持しています。';
  }else st.progressionMigrationNote='編成ルール更新：主人公とヒロインを必須の同行者にしました。ほかの仲間はファミリー施設で入れ替えられます。';
 }
}
const SYSTEM_CHAPTERS=[...NATIONAL_CHAPTERS.map((c,i)=>({id:c.id,name:c.name,cap:c.cap,hubs:c.hubs,unlock:c.unlock,clear:c.clear,special:c.special,index:i})),...NATIONAL_ENCORES.map((c,i)=>({id:c.id,name:c.name,cap:c.level,hubs:[c.id],unlock:c.unlock,clear:c.qid,index:i+6}))].map(c=>({...c,target:Math.round(c.cap/2),ultra:[]}));
const CHAPTER_DROP_RULES={field:200,boss:40};
function systemChapterForHub(hub){return SYSTEM_CHAPTERS.find(c=>c.hubs.includes(hub)||c.special===hub)|| (SPECIAL_STAGES.some(a=>a.id===hub)?SYSTEM_CHAPTERS.find(c=>c.cap>=SPECIAL_STAGES.find(a=>a.id===hub).level)||SYSTEM_CHAPTERS.at(-1):null);}
function chapterShopGear(c){return [...new Set(c.hubs.flatMap(h=>Object.values(SHOPS).filter(s=>s.hub===h).flatMap(s=>s.items)).concat(c.hubs.flatMap(h=>(MAPS[h]?.objects||[]).filter(o=>o.type==='shop').flatMap(o=>SHOPS[o.shop]?.items||[]))))].filter(id=>EQUIP[id]&&!EQUIP[id].nonSale);}
(function chapterCombatAndLoot(){
 for(const c of SYSTEM_CHAPTERS){
  for(const [i,hub]of c.hubs.entries()){
   const L=c.hubs.length===1?c.target:Math.max(2,Math.round((c.index*50+4)+(c.target-c.index*50-4)*i/(c.hubs.length-1)));
   HUBS[hub].combatLevel=L;
   for(let j=1;j<=3;j++){const ar=AREAS[hub+'-A'+j];if(ar){ar.regionalLevel=L+j-1;ar.chapterLevel=L+j-1;ar.systemChapter=c.id;}}
   const q=QUESTS[mainQuestOf(hub)],b=q&&BOSSES[q.boss];
   if(b){b.regionalLevel=b.chapterLevel=Math.min(c.target,L+2);b.systemChapter=c.id;b.mainBalance=true;}
   for(const qid of [mainQuestOf(hub),sideQuestOf(hub)])if(QUESTS[qid])QUESTS[qid].regionalLevel=QUESTS[qid].chapterLevel=L;
  }
  const ids=chapterShopGear(c);c.shopGear=ids;c.shopCeilingGear=c.special?[...new Set([...ids,...chapterShopGear({...c,hubs:[c.special]})])]:ids;
  for(const id of ids){const it=EQUIP[id];if(it.job&&(/^NG/.test(id)||it.expansion===616)){it.needR=Math.max(10,Math.floor(it.needR/2));it.text=JOBS[it.job].name+'専用・熟練度'+it.needR+'以上。'+gearStatsText(it)+'。章内のギア店で購入。';}else if(!it.job&&it.needL>c.target&&!it.ultra){it.needL=Math.max(1,Math.round(it.needL/2));it.text='共通装備・個人Lv'+it.needL+'以上。'+gearStatsText(it)+'。';}}
  const prefix=['博多星響','瀬戸内蒼波','伊勢共鳴','北陸雪灯','北天暁光','首都虹彩','七星共演','八重声援','九光連携','極星永響'][c.index];
  for(const [k,slot]of ['w','a','acc'].entries()){
   const shop=c.shopCeilingGear.map(id=>EQUIP[id]).filter(it=>it.slot===slot),keys=slot==='w'?['atk','c','crit','commentA','meter','family']:slot==='a'?['d','hp','c','rest']:['atk','hp','c','crit','commentA','meter','family','rest'],stats={};
   for(const key of keys){const best=Math.max(0,...shop.map(it=>it[key]||0));if(best)stats[key]=Math.ceil(best*1.25)+1;}
   if(slot==='w')stats.atk=Math.max(stats.atk||0,12);if(slot==='a'){stats.d=Math.max(stats.d||0,8);stats.hp=Math.max(stats.hp||0,Math.ceil(c.cap*1.5));}if(slot==='acc'){stats.c=Math.max(stats.c||0,8);stats.hp=Math.max(stats.hp||0,Math.ceil(c.cap*.65));}
   const id='CU'+String(c.index+1).padStart(2,'0')+k,effect=['pierce','wardAll','healAll'][k],skill='CS'+String(c.index+1).padStart(2,'0')+k,needL=Math.max(1,Math.floor(c.cap*.4)),cost=TECH_INFO[effect][1]+Math.ceil(c.target/25),tech=prefix+'・'+['一閃','結界','祈り'][k];
   const it={id,slot,name:prefix+'の'+['マイク','ステージコート','ファミリー証'][k],...stats,needL,skill,tech,effect,need:TECH_INFO[effect][0],cost,chapterUltra:c.id,ultra:true,rare:true,nonSale:true,price:0};
   it.text=c.name+'限定の超レア装備。個人Lv'+needL+'以上・全職業共通。'+gearStatsText(it)+'。装備中のみ「'+tech+'」を使用可能。通常戦闘で1/200、ボスで1/40の抽選後、章の3品から同じ確率で選択。';
   EQUIP[id]=ULTRA_GEAR[id]=it;c.ultra.push(id);
   EXTRA_SKILLS[skill]={id:skill,name:tech,effect,need:it.need,cost,desc:TECH_INFO[effect][2]+'。章限定の超レア装備を着けている間だけ使える固有技。',level:needL,cooldown:3,power:1.5+c.index*.1,ultra:true};
  }
 }
 /* Special areas retain the cleared chapter's full-cap target; the next chapter may already be open. */
 for(const c of SYSTEM_CHAPTERS.filter(c=>c.special)){const q=QUESTS[mainQuestOf(c.special)],b=q&&BOSSES[q.boss];if(b){b.regionalLevel=b.chapterLevel=c.cap;b.nationalSpecial=true;b.mainBalance=false;}for(let j=1;j<=3;j++){const ar=AREAS[c.special+'-A'+j];if(ar)ar.regionalLevel=ar.chapterLevel=c.cap;}if(q)q.regionalLevel=q.chapterLevel=c.cap;}
 for(const c of [...NEXT_CHAPTER,...NATIONAL_CITIES,...NATIONAL_ENCORES]){const d=SYSTEM_CHAPTERS.find(x=>x.hubs.includes(c.id));if(!d)continue;c.combatLevel=HUBS[c.id].combatLevel;const ct=KYUSHU.find(h=>h.id===c.id);if(ct?.arrive)for(const row of ct.arrive)row[1]=row[1].replace(/適正Lv\d+/, '適正Lv'+c.combatLevel);if(ct?.npc2?.first)for(const row of ct.npc2.first)row[1]=row[1].replace(/適正レベルはおよそ\d+/, '適正レベルはおよそ'+c.combatLevel);}
})();

const NATIONAL_PEOPLE=[
 {id:'tour_mao',name:'柊 真央',hub:'KY02',role:'全国ツアー制作担当',from:'東京',line:'まず一息。目の前の一人から、次の会場へつなごう。',bio:'地元の交流会を支える制作担当。ヒロインと主人公の全国での仕事を、本人たちの選択を尊重して調整する。',relation:'全国ツアーの制作を共同で進める協力者'},
 {id:'photo_kei',name:'早川 景',hub:'KT01',role:'ポートレート写真家',from:'三重',line:'撮られる人にも、撮るのをやめる権利がある。ええ時間を作ろう。',bio:'撮影者の都合だけで現場を動かしていた過去を見直し、対話を重んじる撮影会を作る。',relation:'グラビア表現と撮影会運営の相談相手'},
 {id:'gravure_yuri',name:'三好 由里',hub:'KT02',role:'グラビアアイドルの友人',from:'和歌山',line:'ほいで、今日はどんな自分を見せたい？ 比べる前に聞かせて。',bio:'ヒロインと同じ催しに出演する同業者。嫉妬も励ましも言葉にしながら、互いの成功を祝える友人になる。',relation:'グラドル活動で競い合い支え合う友人'},
 {id:'liver_rin',name:'風間 凛',hub:'HK01',role:'ライバーの競争相手',from:'福井',line:'ほやね。勝負はする。でも相手の声を消す勝ち方はしたくない。',bio:'合同配信で出会うライバー。人気の競争と、人を尊重することを両立しようとしている。',relation:'全国共演へ向けて技を磨き合う競争相手'},
 {id:'oys_kanon',name:'花音',hub:'KT04',role:'おやすみセカイ時代の仲間',gender:'女性',from:'大阪',line:'ええやん。戻っておいでより、今の夢を見せてって言いたい。',bio:'おやすみセカイのまとめ役。脱退したヒロインを引き戻すのでなく、新しい活動を一人の表現者として応援する。',relation:'同じグループで活動した元同僚。今は違う舞台から応援する仲間'},
 {id:'oys_ao',name:'蒼',hub:'KT09',role:'おやすみセカイ時代の仲間',gender:'男性',from:'愛知',line:'そうだがね。昔の映像にも、今の気持ちで返事をしよう。',bio:'映像と演出に関心がある元の仲間。過去映像の扱いを本人と確認しながら、新しい紹介映像へ協力する。',relation:'元同僚。思い出の記録を新しい表現へつなぐ協力者'},
 {id:'oys_rio',name:'莉央',hub:'HK02',role:'おやすみセカイ時代の仲間',gender:'女性',from:'石川',line:'選びまっし。昔の色に、今のあなたを閉じ込めんでいいげんよ。',bio:'衣装作りが好きな元の仲間。懐かしさだけでなく、今の本人が動きやすい衣装を一緒に考える。',relation:'元同僚。衣装と素顔を相談できる友人'},
 {id:'oys_ren',name:'蓮',hub:'TH02',role:'おやすみセカイ時代の仲間',gender:'男性',from:'宮城',line:'いい声だっちゃ。昔の肩書より、今の話を聞かせて。',bio:'ラジオで言葉を届けることに取り組む元の仲間。対談を通じて、活動を続ける理由を語り合う。',relation:'元同僚。声だけの対談で再会する表現者'},
 {id:'oys_minato',name:'湊',hub:'KN06',role:'おやすみセカイ時代の仲間',gender:'男性',from:'神奈川',line:'いいじゃん。六人の過去と、それぞれの今を、同じ舞台で鳴らそう。',bio:'音楽の構成が得意な元の仲間。全国で出会った人の出番が消えないフィナーレを組み立てる。',relation:'元同僚。東京ドームでの共演を支える音楽の協力者'}
];
/* v7.10: adult fictional NPC ensembles, regional mysteries and event-only inventory. */
const EVENT_ITEM_LIMIT=200;
const TALE_CAST=[
 {region:0,people:[
 {id:'tale_akari',name:'朝倉 灯里',hub:'KY01',role:'喫茶店主・交流会の企画者',from:'福岡',age:28,line:'よかよ。気持ちも注文も、急がんで聞くけん。',bio:'閉店した母の喫茶店を小さな交流の場として再開した。昔の相棒・海斗との約束を、言葉にできずにいる。'},
 {id:'tale_kaito',name:'波多野 海斗',hub:'KY09',role:'広域交通の案内係・音楽好き',from:'大分',age:29,line:'大丈夫やけん。行き先も気持ちも確かめよう。',bio:'灯里の店へ通っていた幼なじみ。転勤の連絡が行き違い、店の再開を知らないまま距離ができた。'},
 {id:'tale_kanade',name:'榎本 奏',hub:'KY15',role:'音響技師・二人の友人',from:'沖縄',age:31,line:'ゆっくりでいいさー。残った音にも、理由があるよ。',bio:'交流会の録音を担当する灯里と海斗の共通の友人。依頼書の宛先違いを自分のせいだと抱え込む。'}]},
 {region:1,people:[
 {id:'tale_toru',name:'瀬戸 透',hub:'NX01',role:'旅の写真家',from:'愛媛',age:33,line:'かまんよ。写ってない気持ちも、話してみよう。',bio:'雑誌記者・澄香の元恋人。共同作品のクレジットが抜けた事件で、相手に裏切られたと思い込んだ。'},
 {id:'tale_sumika',name:'吉野 澄香',hub:'NX05',role:'地域雑誌の記者',from:'岡山',age:32,line:'ぼっけえ大事な話じゃけえ、最後まで聞かせて。',bio:'取材先の声を丁寧に残す記者。透と別れた後も、共同作品の原稿を大切に保管していた。'},
 {id:'tale_ritsu',name:'大原 律',hub:'NX08',role:'編集者・取材班のまとめ役',from:'山口',age:41,line:'ぶち急いでも、確かめる一行は省かんよ。',bio:'誌面の差し替えを任された編集者。校正ミスを隠した過去を認め、二人に作品と信頼を返そうとする。'}]},
 {region:2,people:[
 {id:'tale_chitose',name:'白石 千歳',hub:'KT01',role:'衣装工房の職人',from:'三重',age:30,line:'せやな。ほどいた糸も、つなぎ直せるよ。',bio:'祖父から継いだ工房で衣装を作る。照明技師・悠真との交際を、資金繰りの不安から遠ざけている。'},
 {id:'tale_yuma',name:'桐生 悠真',hub:'KT06',role:'舞台照明技師',from:'京都',age:31,line:'おおきに。明るさの外にいる人も見たいんや。',bio:'千歳の恋人。彼女の工房へ無断で支援を集めかけ、親切と押し付けの違いを学ぶ。'},
 {id:'tale_sawa',name:'真壁 佐和',hub:'KT09',role:'制作会計・工房の相談役',from:'愛知',age:45,line:'そうだがね。数字の理由も、本人に聞かんとね。',bio:'工房とイベントの会計を分けて管理する相談役。仮払金を借金と誤解され、二人との説明がこじれた。'}]},
 {region:3,people:[
 {id:'tale_sara',name:'水城 紗良',hub:'HK01',role:'山間イベントの進行係',from:'福井',age:29,line:'ほやね。待つ予定も、一緒に立てよう。',bio:'山間の小劇場で催しを運営する。遠距離の恋人・朔に返信できない夜を、一人で耐えようとする。'},
 {id:'tale_saku',name:'相沢 朔',hub:'HK04',role:'無線・配信設備の技術者',from:'長野',age:30,line:'ずく出して確かめるよ。決めつけるのは後だでね。',bio:'設備の復旧で各地を巡る紗良の恋人。遅い返信を別れの予告と勘違いし、帰省をためらっている。'},
 {id:'tale_fumino',name:'黒田 文乃',hub:'HK05',role:'小劇場の管理人・朔の母',from:'山梨',age:57,line:'ほうけ。待っとる人にも、帰る場所はあるよ。',bio:'紗良の勤務先を支える朔の母。二人を心配するあまり、本人を通さず予定を決めかけた。'}]},
 {region:4,people:[
 {id:'tale_rikka',name:'天野 六花',hub:'TH01',role:'地域ラジオのパーソナリティ',from:'福島',age:28,line:'そうだねえ。届かなかった声も、もう一度聞くべ。',bio:'匿名の手紙を読む番組を持つ。幼なじみ・直人への想いを放送の仕事に隠してしまう。'},
 {id:'tale_naoto',name:'橘 直人',hub:'TH04',role:'遠征チームの料理人',from:'秋田',age:30,line:'んだな。あったかいうちに、言葉も渡そう。',bio:'旅の出演者へ食事を用意する料理人。六花に宛てた手紙が、別人への告白として紹介されかけた。'},
 {id:'tale_yui',name:'村上 結',hub:'TH06',role:'字幕・読み上げ案内の制作者',from:'青森',age:34,line:'ゆっくり読めばええ。小さい印も、ちゃんと見よう。',bio:'番組の案内と字幕を担当する二人の友人。似た封筒を混ぜたことに気付き、放送前に真相を探す。'}]},
 {region:5,people:[
 {id:'tale_haruka',name:'藤崎 遥',hub:'KN01',role:'全国公演の制作進行',from:'茨城',age:27,line:'だいじだよ。分からない役目は、確かめていい。',bio:'全国公演の進行担当。通訳者・司の恋人だが、仕事の評価と私生活を混ぜないよう気を張っている。'},
 {id:'tale_tsukasa',name:'牧野 司',hub:'KN04',role:'手話通訳・会場案内の調整役',from:'埼玉',age:29,line:'焦らなくていいよ。届く形を、一緒に選ぼう。',bio:'遥と交際する通訳者。自分の仕事が恋人の紹介だけで得られたという噂に、実績で向き合おうとする。'},
 {id:'tale_rei',name:'江崎 玲',hub:'KN06',role:'舞台監督・制作チームの先輩',from:'神奈川',age:38,line:'いいじゃん。任せる前に、役目を並べてみよう。',bio:'遥と司の仕事を見てきた舞台監督。変更前の進行表を配ってしまい、二重配置の原因を調べる。'}]}
];
for(const arc of TALE_CAST)for(const p of arc.people)NATIONAL_PEOPLE.push({...p,relation:'地域の事件・恋愛・仕事を通じて関わる協力者',taleRegion:arc.region});
const TALE_EPISODES=[
 [
 ['再開喫茶の消えた約束','灯里の店に届いた予約票は、海斗が約束を破ったように見えた。奏の録音と配達印を照らし合わせ、宛先の行き違いを解こう。',
 ['店の配達控え','予約票は「港北・2号店」宛て。灯里の再開店は「港南・本店」。日付は同じ。','奏の録音メモ','海斗は「港北の店には着いた」と話している。灯里を避けた発言はない。'],
 ['証言の照合','二人が会えなかった原因として資料から分かるのは？',['海斗が約束を忘れた','灯里が店を閉めた','本店と2号店を取り違えた'],2,'配達先と録音の地名が違う。同じ日付でも場所が違えば会えない。'],
 ['状況判断','奏は自分だけが悪いと謝っている。最初に整えることは？',['配達先を三人で確認し、次の待ち合わせを決める','海斗の噂を店に掲示する','理由を聞かず奏を担当から外す'],0,'原因の確認と次の約束を分ければ、誰か一人に責任を押し付けず立て直せる。'],
 '本店宛ての再会招待状','宛先の誤解が解け、灯里と海斗はもう一度会う約束をした。'],
 ['別府に残った留守番電話','海斗が再会を断ったという伝言には、録音の続きがあった。二つの時刻から、途切れた言葉の意味を確かめる。',
 ['通話の時刻表','18:10「今日は行けない」。18:12に灯里へ再発信。','録音の続き','「明日の便なら戻れる。閉店後、話を聞かせて」と続いていた。'],
 ['時系列','正しい順序は？',['断り→翌日の提案→再会の調整','翌日の提案→交際解消→断り','再会→提案→最初の通話'],0,'最初の断りの後に、翌日の提案が録音されている。'],
 ['言葉の読解','「今日は行けない」だけで判断できないことは？',['当日が難しかったこと','会いたい気持ちがなくなったこと','再発信があったこと'],1,'続きには再会の提案がある。会う意思がないという断定はできない。'],
 '明日の帰港時刻メモ','灯里は寂しかったと伝え、海斗は黙って待たせたことを謝った。友人の奏も、二人だけで話す時間を作った。'],
 ['海辺の小さな告白','奏の交流会で、灯里と海斗は互いの想いを伝えると決めた。壊れた演出順を直し、二人が自分の言葉で話せる時間を残そう。',
 ['演出係の合図表','青＝音量を下げる、白＝二人の会話、金＝拍手。','三人の希望カード','灯里と海斗は「互いに気持ちを伝えたい」。奏は会話を遮らず、最後に拍手を送りたい。'],
 ['合図の暗号','希望に合う合図の順序は？',['金→青→白','白→金→青','青→白→金'],2,'音量を下げ、会話を確保し、その後に拍手を送る。'],
 ['状況判断','二人が話し始めたら制作側は？',['予定通り途中でCMを流す','言葉が終わるまで演出を待つ','告白の答えを代わりに決める'],1,'二人の選択を代弁せず、本人たちが話し終える時間を守る。'],
 '海辺の告白用進行カード','二人は互いの想いを認め、恋人として店と旅の仕事を支え合う。奏は二人の大切な友人のまま、音を残していく。']
 ],
 [
 ['消えた撮影者の名前','透の写真展で撮影者の名前だけが消えた。澄香の原稿と律の校正紙を照合し、意図的な横取りだったのか調べる。',
 ['澄香の初稿','写真：瀬戸透／文章：吉野澄香と記載。','律の差し替え履歴','最終版で写真欄の一行が欠落。初稿の署名欄は変更されていない。'],
 ['資料の比較','名前の欠落が初めて起きたのは？',['透の撮影前','最終版への差し替え時','澄香の初稿作成前'],1,'初稿には名前があり、最終版で初めて欠けている。'],
 ['状況判断','二人の共同作品を戻す手順は？',['透だけの名義で再刊する','律の説明を待たず犯人扱いする','原稿と履歴を添えて訂正を出す'],2,'記録に基づく訂正なら、二人の仕事を取り戻し原因も説明できる。'],
 '著者確認済みの訂正原稿','律は校正ミスを認めて訂正した。透と澄香は互いを疑ったことを初めて言葉にした。'],
 ['余白に残した宛名','澄香が透へ送らなかった手紙には、写真の番号が宛名の代わりに書かれていた。展示の対応表から、伝えたかった相手を探す。',
 ['展示番号の対応表','01＝港、02＝透の横顔、03＝雑誌の表紙。','余白の手紙','「02の人へ。作品が戻る日を、あなたと見たい」とある。'],
 ['対応表の謎','手紙の相手は？',['透','雑誌の読者全員','港の船長'],0,'02は透の横顔に対応する。'],
 ['状況判断','手紙を見つけた主人公たちは？',['本人に確認せず朗読会で読む','澄香に渡す意思を確かめる','透の返事を先に書く'],1,'手紙の送り方は澄香が決める。主人公は届ける準備を手伝う。'],
 '封を戻した手紙','澄香は自分の手で手紙を渡した。二人は仕事だけでなく、また一緒に過ごしたい気持ちを認め始める。'],
 ['瀬戸内の再編集','広島へ向かう展示の最後の一枚。律の進行表を整え、仕事の訂正と恋のやり直しを混ぜずに届けよう。',
 ['展示の締切表','公開15:00。訂正確認は公開前、二人の返事は閉展後に行う。','律の役割メモ','律＝訂正の説明、透と澄香＝作品紹介。閉展後の二人の時間には入らない。'],
 ['順序推理','記録と希望に合う順番は？',['恋の返事→公開→訂正','公開→訂正→返事','訂正確認→公開→閉展後の返事'],2,'訂正は公開前、私的な返事は閉展後という別々の条件を守る。'],
 ['状況判断','律が二人に示すべきことは？',['謝罪と再発防止を説明し、返事を急がせない','復縁すれば訂正すると約束する','展示の成功でミスをなかったことにする'],0,'仕事の責任は恋愛の結果と切り離して果たす。'],
 '再編集展の閉展カード','透と澄香は復縁を選んだ。律は二人に謝罪を受け取ってもらい、作品を確実に届ける編集者として信頼を積み直す。']
 ],
 [
 ['二重になった工房請求書','千歳の工房に同じ額の支払いが二件ある。悠真は工房が借金を隠していると心配するが、佐和の帳簿には別の印があった。',
 ['工房の帳簿','番号A17、3,000Gは「仮払」。','精算控え','同じA17、3,000Gは「仮払を充当、追加支払0G」。'],
 ['会計の謎','この二枚から必要な追加支払いはいくら？',['6,000G','3,000G','0G'],2,'同じ番号の仮払を充当済みで、精算控えの追加支払は0G。'],
 ['状況判断','不安を感じた悠真が最初にすることは？',['無断で募金を始める','千歳と佐和に帳簿の意味を聞く','工房の閉店を告知する'],1,'本人たちの説明を聞かず支援や閉店を決めれば、別の問題を作る。'],
 '仮払を照合した精算書','佐和の説明で二重請求の誤解が解けた。悠真は千歳に、心配を理由に選択を奪いかけたと謝る。'],
 ['舞台袖の三本の糸','京都の合同公演で衣装箱の鍵が入れ替わった。色の札と照明の順番から、千歳の大切な衣装を見つける。',
 ['衣装箱の色札','赤＝客席係、青＝出演者、緑＝制作係。','照明合わせのメモ','千歳の衣装は出演者用。照明合わせでは青札の箱から取り出す。'],
 ['分類の謎','開けるべき箱は？',['赤札','青札','緑札'],1,'衣装は出演者用で、メモも青札を指定している。'],
 ['状況判断','衣装を受け取った悠真は？',['着替える時間を確保し、千歳に必要な手伝いを聞く','衣装を勝手に別の人へ貸す','間違いを隠すため公演を急がせる'],0,'衣装が見つかっても、本人が準備できる時間と手伝いの希望を確認する。'],
 '衣装箱の受渡し札','千歳は悠真に、不安な時こそ相談したいと話した。悠真も支える側だけでなく、弱さを話せる恋人でいたいと答える。'],
 ['未来を縫う注文書','名古屋の工房展で、千歳と悠真は一緒に暮らす話を始めた。仕事の契約と将来の約束を、同じ紙に混ぜずに整える。',
 ['佐和の契約条件','仕事の注文書には納期・費用・担当を記載する。','二人の相談ノート','二人とも同居を望む。ただし仕事の契約とは別に、通勤と休みを相談したい。'],
 ['文書の区別','仕事の注文書に書くべき組合せは？',['納期・費用・担当','同居の承諾・交際期間・記念日','悠真だけの希望'],0,'注文書は仕事の条件を扱い、生活の約束は二人の相談として分ける。'],
 ['状況判断','未来の計画が食い違った時は？',['どちらかの転職を勝手に決める','仕事が成功するまで話題を禁止する','双方の生活を並べ、すぐ決まらない点も残す'],2,'合意できたことと未決のことを分けると、二人で計画を続けられる。'],
 '二人で署名した相談ノート','二人は恋人として同居の準備を始めた。工房の仕事は佐和と条件を明確にし、暮らしは千歳と悠真自身で相談していく。']
 ],
 [
 ['雪で止まった返信','紗良の返信が途切れた夜、朔に別れの噂が届いた。劇場の運営記録と無線の記録から、連絡できなかった理由を探る。',
 ['劇場の運営記録','19:00から停電。案内と待機場所の整理を行い、翌朝に設備復旧。','無線の交信記録','紗良は19:05「全員待機、復旧後に連絡」と送信。別れを伝える記録はない。'],
 ['記録の推理','記録が直接示す返信遅延の理由は？',['交際を終えたから','停電と現地対応で連絡が止まったから','朔の連絡先を消したから'],1,'停電と現地対応は記録にあるが、別れや連絡先削除は示されていない。'],
 ['状況判断','復旧後に朔が送る言葉としてよいのは？',['返事がないなら別れだと決める','何度も責める内容だけ送る','無事を確かめ、話せる時間を相談する'],2,'まず無事と連絡可能な時間を確認する。返事の速さだけで気持ちを決めつけない。'],
 '復旧後の連絡メモ','誤解は解けた。紗良は心細さを、朔は見捨てられる不安を話し、二人で連絡の仕方を考え直す。'],
 ['帰省日が二つある','文乃が用意した帰省予定と朔の勤務表が食い違う。二つの「休み」の意味を読み分け、家族の善意による行き違いを解く。',
 ['朔の勤務表','12日＝夜勤明け、13日＝終日休暇。','文乃の宿泊メモ','12日を終日休みだと思い、昼からの予定を作った。'],
 ['予定の謎','移動と休養の相談を始める基準日は？',['12日の昼に固定する','本人に聞かず両日を予約する','終日休暇の13日を候補に本人へ確認する'],2,'夜勤明けと終日休暇は別。13日を候補にして本人の希望を確かめる。'],
 ['状況判断','文乃の善意を受け止めつつ直すには？',['感謝を伝え、二人の予定は本人たちで決めると話す','紗良だけが全て従う','予定の違いを朔に隠す'],0,'心配への感謝と予定を決める主体を分けて伝える。'],
 '三人で確認した帰省候補表','文乃は先回りしすぎたと認めた。紗良と朔は家族への感謝を保ちながら、自分たちの生活を相談する。'],
 ['雪解けの無線合図','甲府の劇場で、離れていても続けられる約束を結ぶ。過密になった連絡ルールを直し、二人が守れる合図を選ぼう。',
 ['連絡用の合図表','1回＝今は対応中、2回＝後で話せる、3回＝予定変更。','二人の希望','仕事中は返信を急がせず、後で話す予定を作りたい。'],
 ['合図の謎','後で話す予定を作る合図は？',['1回','2回','3回'],1,'対応中は1回、後で話せる合図は2回と定めている。'],
 ['状況判断','二人で続ける連絡ルールは？',['毎分の返信を義務にする','予定変更を隠す','難しい日は合図し、話せる時刻を改めて相談する'],2,'無理な即時返信より、難しい時の合図と再調整の約束を作る。'],
 '二人の無線約束カード','紗良と朔は遠距離でも恋人として歩く約束を確かめた。文乃は劇場の灯りを守り、二人が自分で帰る日を選ぶのを待つ。']
 ],
 [
 ['宛名のないラジオ便り','六花の番組へ届いた手紙が、別の出演者への告白だと噂になった。封筒の印を照合し、本来の宛先を探そう。',
 ['番組の封筒対応表','雪印＝六花、麦印＝料理企画、星印＝音楽企画。','直人の封筒','雪印があり、本文には「番組の声を聞くたび、また会いたい」とある。'],
 ['印の暗号','この手紙の宛先は？',['六花','料理企画の出演者','音楽企画の出演者'],0,'番組内の対応表で雪印は六花を示している。'],
 ['状況判断','結が放送前にすることは？',['噂を番組の宣伝に使う','差出人に宛先と公開範囲を確認する','名前を推測して先に発表する'],1,'当人へ確認すれば、誤った宛先や望まない公開を防げる。'],
 '宛先確認済みの便り','直人は六花へ届けたかったと認めた。六花は放送ではなく、自分の声で返事をしたいと話す。'],
 ['温かな差し入れの順番','秋田で直人の差し入れが別会場へ運ばれた。受取票を整理し、六花への返事の時間を取り戻す。',
 ['配送の受取票','A＝控室、B＝調理室、C＝ラジオブース。返事の待合せはC。','結の整理メモ','温め直しはB、受け渡しはC。Aには出演者用の別の箱を届ける。'],
 ['順序の謎','六花への差し入れの正しい経路は？',['C→A','A→B','B→C'],2,'Bで温め直し、待合せ場所のCへ届ける。'],
 ['状況判断','到着が遅れた直人は？',['遅れた理由と謝意を伝え、今話せるか聞く','差し入れを渡せば説明は不要とする','結に恋の返事を代わりに聞かせる'],0,'物を渡すだけでなく、遅れの説明と話す時間の相談を行う。'],
 'ラジオブースの受取票','六花は直人に会いたかったと伝えた。仕事の声とは違う照れた声を、直人は大切に受け止めた。'],
 ['北行きの返事','青森の公開収録の後、六花と直人は互いに好きだと伝える。結は字幕と音声の締めを整え、二人の私的な時間を守りたい。',
 ['収録の切替表','赤＝放送中、青＝収録終了、白＝私的な会話。','結の制作メモ','青の後にマイクを切り、白の時間を作る。告白を番組素材にはしない。'],
 ['切替の謎','二人だけの返事を始める正しい順は？',['赤→白のまま録音','青→マイクを切る→白','白→赤→マイクを入れる'],1,'収録を終え、マイクを切ってから私的な会話に移る。'],
 ['状況判断','仲間の結が二人を応援する方法は？',['返事の内容をその場で投稿する','仕事を恋人のどちらかへ一方的に寄せる','二人の意思を聞き、伝えてよい範囲で祝う'],2,'仕事と私生活を分け、本人たちが伝えてよい範囲で祝福する。'],
 '収録終了の白い合図札','六花と直人は恋人として旅を続けることを選んだ。結は二人の友人として、誰にでも届く案内を作り続ける。']
 ],
 [
 ['二人に届いた同じ役目','遥と司が同じ時間に別会場へ呼ばれた。玲の進行表には更新番号の違う二枚があり、二重配置の原因を探る。',
 ['旧進行表v1','14時：遥＝東口、司＝南口。後に変更予定。','承認済み進行表v2','14時：遥＝制作室、司＝南口。玲が承認し、これを最新版とする。'],
 ['更新履歴の謎','14時に遥が行く場所は？',['承認済みv2の制作室','旧v1の東口','司と同じ南口'],0,'承認済みの最新版はv2で、遥の担当は制作室。'],
 ['状況判断','玲が全員へ伝える内容は？',['司の私生活を説明する','遥に黙って二つの役目を任せる','旧版を撤回し、承認済みの担当を再共有する'],2,'原因は表の混在。担当と最新版をそろえることが直接の対応になる。'],
 '承認済みの担当表','二重配置が解けた。玲は旧版を配ったことを謝り、二人は恋人である前に、それぞれの仕事を任された仲間だと確認した。'],
 ['紹介だけという噂','司の仕事は遥の紹介だけだという噂が広がった。選考資料を読み、噂への返答と本人への支え方を考える。',
 ['匿名の実技審査記録','候補A＝18点、B＝24点、C＝21点。合格は最高得点者。','封印された対応表','A＝外部候補、B＝司、C＝別の候補。審査後に開封された。'],
 ['記録と数値の謎','記録上の合格者は誰？',['Aの候補','Bの司','Cの候補'],1,'最高得点24点のBが司。審査時点では名前の対応表は封印されていた。'],
 ['状況判断','遥と玲が噂へ対応するなら？',['必要な審査経緯だけ説明し、私生活を証明材料にしない','恋愛の全履歴を公開する','噂した人全員を犯人だと決めつける'],0,'仕事の審査経緯が根拠になる。私生活の詳細を出す必要はない。'],
 '実技審査の説明書','司は自分の仕事を説明し、遥はそばで支える。玲は説明役を独占せず、本人が話せる場を整える。'],
 ['幕が上がる前の約束','横浜の最終打合せで、遥と司は成功の後も一緒にいたいと話す。玲の担当表から、二人が無理なく帰れる段取りを組む。',
 ['終演後の担当表','遥＝記録回収、司＝案内終了確認、玲＝全体確認。二人の担当終了後に合流できる。','二人の待合せメモ','どちらかが仕事を残して来るのではなく、両方の担当が終わってから会う。'],
 ['条件の謎','合流できる条件は？',['遥だけが終わればよい','司だけが終わればよい','遥と司の両方の担当が完了する'],2,'待合せメモは双方の担当完了を条件としている。'],
 ['状況判断','遅れが出た時の対応は？',['連絡して合流時刻を変え、仕事を引き継ぐ時は担当を明確にする','片方が黙って持ち場を離れる','玲へ私生活の決定を全て任せる'],0,'仕事の責任と二人の約束を両立させるため、連絡と明確な引継ぎを行う。'],
 '終演後の待合せカード','遥と司は恋人として互いの仕事を尊重し、次の暮らしも相談すると約束した。玲は二人の選択を見守る先輩として、全国公演の幕を上げる。']
 ]
];
const MAIN_PROPS=[
 ['九州アンコールの宛先','各地の声を一つのアンコールへつなぐには、出演者の受け渡しと舞台の合図をそろえる必要がある。',
 ['各県の出演メモ','挨拶→地域紹介→アンコールの順。最後の合図は金。','奏の音響メモ','青で音量を下げ、白で紹介、金で歌を始める。'],
 ['順番の謎','地域紹介の後に始めるのは？',['挨拶を最初から','アンコール','撤収'],1,'出演メモは挨拶、地域紹介、アンコールの順。'],
 ['合図の謎','歌を始める合図は？',['金','青','白'],0,'音響メモで金が歌の開始を示す。'],
 '九州アンコール共演台本','九州の声を結ぶ台本を舞台へ渡した。S6という最初の目標に挑むため、本番前の準備が整った。'],
 ['瀬戸内巡回展の引継ぎ','グラビア撮影会の作品と配信の声を、同じ巡回展として届ける。透と澄香のチェック表で作品番号を確かめよう。',
 ['巡回展の展示表','写真A＝入口、写真B＝配信の背景、写真C＝出口。','制作の照合票','配信に使う写真はB。写真担当と文章担当の名前を並べて表示する。'],
 ['対応の謎','配信の背景に使う作品は？',['A','C','B'],2,'展示表と照合票の両方がBを示している。'],
 ['状況判断','作品紹介に必要な表記は？',['写真担当と文章担当の両方','有名な出演者の名前だけ','誰の名前も記さない'],0,'制作の照合票で両方の担当を並べると決めている。'],
 '瀬戸内巡回展の作品引継票','作品引継票を制作担当へ渡した。写真と文章の作者名、展示と配信の受け渡しがそろい、本番を迎える準備が整った。'],
 ['今の名前で上がる舞台','おやすみセカイの思い出と今の活動を、別々の出番としてつなぐ。過去へ戻す演出でなく、新しい共演を準備する。',
 ['花音の出番メモ','前半＝思い出の紹介、後半＝現在のグラドル活動と配信。','衣装引継票','後半は本人が選んだ今の衣装。昔の衣装への変更はしない。'],
 ['構成の謎','後半で紹介するのは？',['グループ復帰の発表','現在の活動','昔の紹介だけの繰返し'],1,'メモでは後半に今のグラドル活動と配信を紹介する。'],
 ['状況判断','後半の衣装は？',['昔の衣装へ勝手に戻す','観客の噂で決める','本人が選んだ今の衣装'],2,'引継票で今の衣装と決めている。'],
 '現在の活動を結ぶ共演構成表','今の活動を紹介する共演構成表を渡した。衣装と出番を本人の希望で確定し、元の仲間との共演を迎える準備が整った。'],
 ['雪の会場の二つの予定','天候で予定が変わった会場では、古い時刻のまま配信を始められない。紗良と凛の連絡表で、変更後の予定をそろえる。',
 ['旧時刻の告知','開始17:00。変更時は新しい告知を優先する。','承認済み変更票','開始18:00、入場17:30。出演・撮影会の案内を同時に更新する。'],
 ['時刻の謎','変更後の開始時刻は？',['18:00','17:00','17:30'],0,'変更票は18時開始、17時30分は入場時刻。'],
 ['状況判断','更新する案内の範囲は？',['配信だけ','出演・撮影会・配信の関連案内をそろえる','変更を会場内だけに隠す'],1,'複数の予定に関わる変更を同じ内容で伝え、古い時刻の混在を防ぐ。'],
 '雪の会場の変更済み進行票','変更済み進行票を渡した。出演・撮影会・配信の案内が同じ時刻にそろい、集まる人へ感謝を届ける本番の準備が整った。'],
 ['遠くの声をつなぐ回線','北海道の会場へ、東北で集めた便りを届ける。蓮と結の接続表を読み、遠隔の出演と現地の出番を結ぼう。',
 ['接続の担当表','回線1＝現地、回線2＝東北の遠隔出演、回線3＝予備。','蓮の確認メモ','便りの朗読は東北の遠隔出演から受け、現地の返事を最後につなぐ。'],
 ['回線の謎','便りの朗読を受ける回線は？',['回線3','回線2','回線1'],1,'担当表の回線2が東北の遠隔出演を示す。'],
 ['順序の謎','メモに合う進行は？',['現地の返事→朗読を省略','予備回線だけを紹介','遠隔の朗読→現地の返事'],2,'遠隔の便りを受けた後に、現地から返事を届ける。'],
 '全国便りリレーの接続票','全国便りリレーの接続票を渡した。遠隔の朗読と現地の返事の順番を確認し、本番で声をつなぐ準備が整った。'],
 ['東京ドームの最後の一枚','全国の出番を一人で抱え込まない。湊と玲の台本を照合し、最後の公演を二人と仲間の共同制作として完成させる。',
 ['全国の出番台本','全国の紹介→ヒロインの挨拶→全国合同アンコール。','舞台監督の引継票','全国紹介の担当者へ順番を渡す。最終合図は舞台監督が出し、主人公はヒロインを補佐する。'],
 ['順番の謎','ヒロインの挨拶の次は？',['全国合同アンコール','全国紹介へ戻って繰り返す','終演の発表'],0,'出番台本の最後は全国合同アンコール。'],
 ['状況判断','主人公が本番前に行うのは？',['全員の担当を取り上げる','担当へ引継ぎ、ヒロインと最後の準備をする','予定を知らせず一人で変更する'],1,'台本の担当を尊重し、共同制作として本番を迎える。'],
 '東京ドーム全国共演最終台本','全国の出番をまとめた最終台本を渡した。ヒロインと主人公、各地の仲間が役目を引き受け、東京ドーム本番へ挑む準備が整った。']
];
const NARRATIVE_CASES=[];const EVENT_ITEMS={};
for(const arc of TALE_CAST){const i=arc.region,c=NATIONAL_CHAPTERS[i],hubs=[c.hubs[0],c.hubs[Math.floor(c.hubs.length/2)],c.hubs[c.hubs.length-2]];for(let e=0;e<3;e++){const row=TALE_EPISODES[i][e],id='SUB'+(i+1)+(e+1);NARRATIVE_CASES.push({id,region:i,ep:e,main:false,hub:hubs[e],prior:e?'SUB'+(i+1)+e:null,cast:arc.people.map(p=>p.id),title:row[0],intro:row[1],evidence:[{name:row[2][0],text:row[2][1]},{name:row[2][2],text:row[2][3]}],puzzles:[row[3],row[4]].map(q=>({kind:q[0],question:q[1],choices:q[2],answer:q[3],why:q[4]})),propName:row[5],ending:row[6]});}
 const r=MAIN_PROPS[i],existing=['tour_mao','tour_mao','oys_kanon','liver_rin','oys_ren','oys_minato'][i];NARRATIVE_CASES.push({id:'MAINPROP'+(i+1),region:i,ep:0,main:true,hub:c.hubs.at(-1),prior:null,clear:c.clear,boss:QUESTS[c.clear].boss,cast:[existing,...arc.people.map(p=>p.id)],title:r[0],intro:r[1],evidence:[{name:r[2][0],text:r[2][1]},{name:r[2][2],text:r[2][3]}],puzzles:[r[3],r[4]].map(q=>({kind:q[0],question:q[1],choices:q[2],answer:q[3],why:q[4]})),propName:r[5],ending:r[6]});
}
for(const c of NARRATIVE_CASES){if(c.main)QUESTS[c.clear].goal+=' ボス前に事件・謎解き帳で「'+c.title+'」の準備品を渡す。';c.clues=c.evidence.map((ev,i)=>{const id=c.id+'_CLUE'+(i+1);EVENT_ITEMS[id]={id,name:ev.name,caseId:c.id,kind:'clue',text:ev.text,where:'証拠を2件照合して「'+c.title+'」の謎を解く'};return id;});c.prop=c.id+'_PROP';c.memory=c.id+'_MEMORY';EVENT_ITEMS[c.prop]={id:c.prop,name:c.propName,caseId:c.id,kind:'prop',text:c.main?'この地域の本編終盤の舞台準備を完了する品。':'事件の解決とNPCの関係を次の段階へ進める品。',where:HUBS[c.hub].name+'・'+c.title+'で使用'};EVENT_ITEMS[c.memory]={id:c.memory,name:c.title+'の記録',caseId:c.id,kind:'memory',text:'解決後の選択と会話を読み返せる記念品。再報酬はありません。',where:'事件帳から結末を読み返す（消費しない）'};}
const NPC_PAIR_LABELS=[
 ['行き違いで疎遠な幼なじみ','宛先の誤解が解け、再会を約束','互いの寂しさを話せる二人','想いを伝え合った恋人'],
 ['作品の誤解で別れた元恋人','著者名を取り戻し、疑いを話した二人','手紙を渡し、想いを確かめる二人','作品も暮らしも相談する復縁した恋人'],
 ['仕事の心配で距離ができた恋人','無断の支援を見直し、相談を再開','弱さも話せる恋人','同居の準備を相談する恋人'],
 ['返信の行き違いを抱えた遠距離の恋人','停電の誤解を解き、不安を話した恋人','家族と自分たちの予定を分ける二人','無理のない連絡を約束した遠距離の恋人'],
 ['気持ちを隠していた幼なじみ','手紙の宛先が分かった二人','互いに会いたかったと話した二人','仕事と私生活を尊重する恋人'],
 ['仕事の評価を気にする恋人','それぞれの仕事を任された仲間でもある恋人','噂を記録で解き、支え合う恋人','成功の後の暮らしも相談する恋人']
];

for(const p of NATIONAL_PEOPLE){NPCS[p.id]={name:p.name,hub:p.hub,role:p.role,from:p.from,national:true,sprite:[PAL.violet,PAL.aqua],first:()=>[[p.name,p.line],[p.name,p.bio]],normal:()=>[[p.name,p.line]]};MAPS[p.hub].objects.push({id:p.id,type:'npc',npc:p.id,x:9,y:18,label:p.name+'（'+p.role+'）'});const old=SCENES['ARRIVE_'+p.hub];SCENES['ARRIVE_'+p.hub]={title:old?.title||HUBS[p.hub].name+'での出会い',lines:hero=>[...(old?old.lines(hero):[['',HUBS[p.hub].name+'に着いた。']]),[p.name,p.line],['',p.name+(G.st?.talked[p.id]||G.st?.narrative?.people.includes(p.id)?'とこの街で合流した。':'が登場した。')+'人物相関図で役割と関係を確認できます。']]};}
const REGIONAL_SPEECH={福岡:'よかね。',佐賀:'がばい嬉しかね。',長崎:'よかばい。',熊本:'よかったたい。',大分:'大丈夫やけん。',宮崎:'てげ嬉しいね。',鹿児島:'よかど。',沖縄:'めんそーれ。',愛媛:'かまんよ。',高知:'一緒に準備しゆうよ。',徳島:'ほなけん、ゆっくり話そう。',香川:'ほんまやのう。',岡山:'ぼっけえ嬉しいね。',鳥取:'そうだがな。',島根:'だんだん。',山口:'ぶち嬉しいね。',広島:'そうじゃけえ。'};
for(const [id,n]of Object.entries(NPCS)){if(id==='moe'||n.national)continue;const pref=HUBS[n.hub]?.pref,c=NATIONAL_ALL_EXTRA.find(c=>c.id===n.hub);n.catchphrase=c?.dialect||REGIONAL_SPEECH[pref]||'焦らず、一人ずつ話を聞こう。';for(const key of ['first','normal'])if(n[key]){const old=n[key];n[key]=p=>{const lines=old(p);return lines.some(a=>a[1].includes(n.catchphrase))?lines:[...lines,[n.name,n.catchphrase]];};}}
for(const [cid,from]of Object.entries({hero:'福岡',naoki:'福岡',kohei:'佐賀',mio:'大分',kayo:'長崎',tsumugi:'熊本',makoto:'宮崎',gaku:'鹿児島'}))CHARS[cid].catchphrase=REGIONAL_SPEECH[from];CHARS.moe.catchphrase='今日も、あなたの声を聞かせてね。';for(const cid of Object.keys(JOIN_TALK))JOIN_TALK[cid].push([CHARS[cid].name,CHARS[cid].catchphrase]);
const GROUP_SETTING={name:'おやすみセカイ',detail:'男女混合6人グループ（ヒロイン在籍時の編成）',members:['moe',...NATIONAL_PEOPLE.filter(p=>p.id.startsWith('oys_')).map(p=>p.id)]};
function nationalChapterForHub(hub){return NATIONAL_CHAPTERS.findIndex(c=>c.hubs.includes(hub));}
function nationalEntry(hub){return NATIONAL_ALL_EXTRA.find(c=>c.id===hub);}
/* v7.32: runtime-only identity rejects stale activity controls across renders and restores. */
const CAREER_TOKENS=new WeakMap();let careerTokenSeq=0;
function careerSessionToken(session){if(!CAREER_TOKENS.has(session))CAREER_TOKENS.set(session,String(++careerTokenSeq));return CAREER_TOKENS.get(session);}
function careerQuote(st,hub){const area=AREAS[hub+'-A1'],L=area?recommendedAreaLevel(area):1,fee=Math.max(30,L*2),reward=L*4;return {fee,reward,net:reward-fee};}
function careerRecord(st,hub){return st.careerTour?.[hub]||{};}
function nationalCareerChecks(st){return NATIONAL_CHAPTERS.map((c,i)=>({chapter:c,index:i,photo:c.hubs.some(h=>careerRecord(st,h).photo),event:c.hubs.some(h=>careerRecord(st,h).event)}));}
function nationalCareerReady(st){return nationalCareerChecks(st).every(c=>c.photo&&c.event);}
function nationalFinalReason(st){const missing=nationalCareerChecks(st).filter(c=>!c.photo||!c.event);return missing.length?'東京ドーム本番には、全6地域でグラドル出演と撮影会を各1件以上成功させる必要があります。未達：'+missing.map(c=>c.chapter.name+(!c.photo?'・撮影会':'')+(!c.event?'・出演':'')).join('／'):'';}
function careerBaseReason(st){if(!st||st!==G.st||G.readOnly||G.screen!=='explore'||st.run||st.stream||G.dlg)return '戦闘・配信・会話を終えてから準備してください。';if(!isSafe()||streamPending())return '街の安全地帯で、配信待ちのイベントを先に完了してください。';if(vitalOf('moe').hp<=0)return 'ヒロインを道具や宿屋で復活させてから活動しましょう。';return '';}
function careerBegin(kind){const st=G.st;if(!st||G.sheet!=='careerTour')return false;const hub=curHub(),c=nationalChapterForHub(hub),reason=careerBaseReason(st);if(reason||c<0||!['photo','event'].includes(kind)||st.careerSession||careerRecord(st,hub)[kind])return false;const {fee}=careerQuote(st,hub);if(st.gold<fee){toast('活動準備には'+fee+'Gが必要です。');return false;}st.gold-=fee;st.careerSession={hub,kind,step:0,picks:[]};commit();openSheet('careerTour');return true;}
const CAREER_STEPS={photo:[['衣装と撮影範囲','本人の希望と撮影ルールを確認する','確認を省いて撮影を急ぐ'],['参加者への案内','休憩・撮影順・連絡方法を共有する','現地で何とかしてもらう'],['公開前の確認','本人と協力者に掲載内容を確認する','許可を待たず宣伝する']],event:[['出演前の相談','控室・出演順・本人の希望を共有する','出演者に当日任せきる'],['地域との共演','協力者の名前と役割を紹介する','数字だけを売りにする'],['終演後の案内','帰路とお礼、次回の案内を整える','告知だけしてすぐ帰る']]};
function careerPick(value,expectedStep,token){const st=G.st;if(!st||G.sheet!=='careerTour')return false;const s=st.careerSession;if(careerBaseReason(st)||!s||s.hub!==curHub()||!CAREER_STEPS[s.kind]||careerRecord(st,s.hub)[s.kind]||!['careful','rush'].includes(value)||!Number.isInteger(expectedStep)||expectedStep!==s.step||token!==careerSessionToken(s)||s.step!==s.picks.length||s.step>=3)return false;s.picks.push(value);s.step++;if(s.step<3){commit();render();return true;}const passed=s.picks.every(x=>x==='careful'),reward=careerQuote(st,s.hub).reward,name=s.kind==='photo'?'グラビア撮影会':'グラドル活動イベント';st.careerSession=null;const lines=[['',HUBS[s.hub].name+'・'+name]];if(passed){st.careerTour=st.careerTour||{};st.careerTour[s.hub]={...careerRecord(st,s.hub),[s.kind]:true};st.gold+=reward;st.tickets+=20;const local=nationalEntry(s.hub);lines.push(['',s.kind==='photo'?(local?.venue||HUBS[s.hub].name+'の撮影会場')+'で、本人と参加者が確認した撮影を終え、活動記録に一枚を残した。':(local?.venue||HUBS[s.hub].name+'の交流広場')+'でグラドル出演を終え、協力者の名前と街の声を活動記録に残した。本編の依頼と任意の事件は、別に進行します。']);lines.push(['もえ',s.kind==='photo'?'撮られる私にも、選べる時間があった。今日の写真を、私の言葉で届けたい。':'舞台に立つ私だけじゃなく、ここを作ってくれた人の名前も覚えて帰りたい。'],[st.profile.name,'その気持ちが伝わるように、記録と次の予定を一緒に整えよう。'],['','活動成功。経験を全国ツアーの記録へ残した。報酬'+reward+'G・チケット20。']);}else{lines.push(['','準備に不足があり、本番は見送った。今回の準備費は戻らない。'],['もえ','急いで進むより、ちゃんと確かめてから立ちたい。もう一度、相談しよう。'],['','本人確認・参加者案内・公開や終演後の確認を整えて再挑戦できます。']);}commit();G.sheet=null;say(lines,()=>openSheet('careerTour'));return true;}
function renderCareerTour(){const st=G.st,s=st.careerSession,hub=curHub(),idx=nationalChapterForHub(hub),reason=careerBaseReason(st);if(s){const step=CAREER_STEPS[s.kind][s.step];return `<p><b>${esc(HUBS[s.hub].name)}／${s.kind==='photo'?'撮影会':'グラドル出演'}の準備 ${s.step+1}/3</b></p><p>${esc(step[0])}</p><div class="stack"><button class="btn primary" data-a="careerPick" data-v="careful" data-step="${s.step}" data-token="${careerSessionToken(s)}" ${reason?'disabled':''}>${esc(step[1])}</button><button class="btn" data-a="careerPick" data-v="rush" data-step="${s.step}" data-token="${careerSessionToken(s)}" ${reason?'disabled':''}>${esc(step[2])}</button></div><p class="small">準備は保存されます。3項目を確認すると結果を確認できます。活動中は別の街や戦闘へ移れません。</p>`;}
 const {fee,reward,net}=careerQuote(st,hub),record=careerRecord(st,hub),c=nationalEntry(hub);return `<p>各地でグラドル出演・グラビア撮影会を経験し、配信にも街の魅力を持ち帰ります。会場や催しは物語上の創作です。</p><p><b>現在地：${esc(HUBS[hub].name)}</b>／会場：${esc(c?.venue||HUBS[hub].name+'の交流広場')}</p><p>準備は3項目。1件につき準備費${fee}G。初回成功で${reward}G・チケット20と活動記録。<b>成功時の差引 ${net<0?'−':'＋'}${Math.abs(net)}G</b>。${net<0?'成功しても準備費との差額が持ち出しになります。':'準備費を差し引いた金額です。'}失敗時は報酬なし・準備費は戻りません。成功済みの活動は再受注できません。</p>${reason?'<p class="warn">'+esc(reason)+'</p>':''}<div class="stack">${[['photo','グラビア撮影会'],['event','グラドル活動イベント']].map(([kind,name])=>`<button class="btn" data-a="careerBegin" data-v="${kind}" ${record[kind]||idx<0||reason||st.gold<fee?'disabled':''}>${record[kind]?'✓ 成功済み：':'準備する：'}${name}</button>`).join('')}</div>${idx<0?'<p>地域特別エリアでは活動の新規受注はありません。通常の街で準備してください。</p>':''}<h3 class="label">東京ドームへ向けた六地域の経験</h3><div class="stack">${nationalCareerChecks(st).map(c=>`<p>${esc(c.chapter.name)}：撮影会${c.photo?'✓':'未'}／グラドル出演${c.event?'✓':'未'}</p>`).join('')}</div><p>${esc(nationalFinalReason(st)||'全地域の経験がそろいました。関東編の本編を進め、東京ドームの本番へ。')}</p>`;}
function renderNationalTour(){const st=G.st;return `${progressionHtml(st)}<p>おやすみセカイ脱退後に出会った二人が、撮影会・グラドル出演・配信を続けながら全国を巡ります。北方へ舞台を広げ、北海道から最終章の関東へ集結します。厳密に緯度の順に進む旅ではありません。</p><div class="row3"><button class="btn" data-a="openSheet" data-k="japanMap">実地理の日本地図</button><button class="btn" data-a="openSheet" data-k="relationships">人物相関図</button><button class="btn" data-a="openSheet" data-k="careerTour">活動予定</button><button class="btn" data-a="openSheet" data-k="storyJournal">事件・謎解き帳</button></div><div class="stack">${NATIONAL_CHAPTERS.map((c,i)=>`<section class="setcard"><h3 class="label">第${i+1}章 ${esc(c.name)}${st.quests[c.clear]==='complete'?' ✓':''}</h3><p>${esc(c.theme)}／上限${c.cap}。</p><p>${c.unlock?'解放条件：'+c.unlock+'クリア':'福岡市から旅立つ'}</p><div class="opts">${c.hubs.map(id=>`<button class="btn" data-a="worldGo" data-v="${id}" ${id===curHub()||hubTravelReason(st,id)?'disabled':''}>${esc(HUBS[id].name)}${id===curHub()?'（現在地）':''}</button>`).join('')}</div><p class="small">地域特別エリア：${esc(HUBS[c.special].name)}。本編クリア後に任意で挑戦できます。</p><button class="btn" data-a="worldGo" data-v="${c.special}" ${hubTravelReason(st,c.special)?'disabled':''}>特別エリアへ</button></section>`).join('')}</div><details><summary>関東編クリア後の追加遠征</summary><p>本編のハッピーエンド後に挑戦する任意の4編。上限700→800→900→999。関東編が本編の最終章であることは変わりません。</p>${NATIONAL_ENCORES.map(c=>`<p>${esc(c.name)}／上限${c.level}／${c.unlock}クリアで解放 <button class="btn" data-a="worldGo" data-v="${c.id}" ${hubTravelReason(st,c.id)?'disabled':''}>向かう</button></p>`).join('')}</details>`;}
function renderGroupProfile(){const st=G.st,h=st?charName(st,'moe'):'もえ';return `<p><b>アイドルグループ「おやすみセカイ」</b></p><p>詳細設定：${GROUP_SETTING.detail}。${esc(h)}は脱退後に主人公と出会い、グラビアアイドル・ライバーとして全国を巡ります。グループへの復帰を全国ツアーの目的にはしません。</p><p>当時の6人はヒロインと元の仲間5人。脱退後の補充や編成の変動は本編で断定せず、今はそれぞれの活動を尊重する関係を描きます。本作独自の物語設定で、実際の経歴や編成を示すものではありません。</p><ul class="list"><li>${esc(h)}：元メンバー／現在はグラビアアイドル・ライバー</li>${NATIONAL_PEOPLE.filter(p=>p.id.startsWith('oys_')).map(p=>`<li>${st?.visitedHubs.includes(p.hub)?esc(p.name)+'：'+esc(p.bio):'未登場のメンバー（全国ツアーで出会います）'}</li>`).join('')}</ul>`;}
function knownRelationshipPeople(st){const people=st.roster.map(cid=>({id:'char:'+cid,name:charName(st,cid),kind:'仲間',role:cid==='hero'?'旅と制作の補佐・共同制作者':cid==='moe'?'グラビアアイドル・ライバー':CHARS[cid].pocoRole||CHARS[cid].career,cid}));if(!st.roster.includes('naoki')&&st.scenes.RANK_D2)people.push({id:'char:naoki',name:charName(st,'naoki'),kind:'登場済み・加入前',role:'北九州で出会った電気工事士',cid:'naoki',preview:true});for(const [id,n]of Object.entries(NPCS)){if(id==='moe'||!n.hub||!st.visitedHubs.includes(n.hub)&&!st.talked[id]&&!st.narrative?.people.includes(id))continue;people.push({id:'npc:'+id,name:n.name,kind:n.national?'主要NPC':'地域NPC',role:n.role||(n.rep?'街の協力者':'地域の住民'),npc:id,hub:n.hub});}return people;}
function relationshipEdges(st,people){const ids=new Set(people.map(p=>p.id)),edges=[],add=(a,b,label)=>{if(ids.has(a)&&ids.has(b))edges.push({a,b,label});};add('char:hero','char:moe',st.relationshipChoice==='romance'?'互いの夢を支える恋人':st.relationshipChoice==='partner'?'かけがえのない相棒':'旅と活動を支え合い、気持ちを確かめる二人');for(const p of people){if(p.preview){add('char:hero',p.id,'北九州の港で声を交わし、次の旅を見送ってくれた人');add('char:moe',p.id,'北九州で配信を聞いてくれた応援者');}else if(p.cid&&!['hero','moe'].includes(p.cid)){add('char:hero',p.id,characterText(st,CHARACTER_ARCS[p.cid].hero));add('char:moe',p.id,characterText(st,CHARACTER_ARCS[p.cid].heroine));}if(p.npc){const spec=NATIONAL_PEOPLE.find(n=>n.id===p.npc),n=NPCS[p.npc];add('char:moe',p.id,spec?.relation||(st.talked[p.npc]?'この街で声を交わした協力者':'この街に登場した人物・まだ会話していない'));add('char:hero',p.id,spec?'旅程や制作の相談で関わる人物':st.talked[p.npc]?'地域の相談を聞き、準備を手伝う関係':'この街で出会う人物');}}return [...edges,...narrativeRelations(st,people)];}
function renderRelationships(){const st=G.st,d=G.sheetData,all=knownRelationshipPeople(st),focus=all.find(p=>p.id===d.person)||all.find(p=>p.cid==='moe'),fullEdges=relationshipEdges(st,all),edges=fullEdges.filter(e=>(e.a===focus.id||e.b===focus.id)&&(d.peopleMode!=='npc'||e.a.startsWith('npc:')&&e.b.startsWith('npc:'))),page=Math.max(0,Math.min(Math.ceil(edges.length/4)-1,d.relationPage||0)),show=edges.slice(page*4,page*4+4),targets=show.map(e=>all.find(p=>p.id===(e.a===focus.id?e.b:e.a))),np=NATIONAL_PEOPLE.find(n=>n.id===focus.npc);const positions=[[72,65],[288,65],[72,235],[288,235]],svg=`<svg viewBox="0 0 360 300" role="img" aria-label="${esc(focus.name)}を中心にした人物相関図" style="width:100%;max-width:520px;background:#172736;border:1px solid #84959c">${show.map((e,i)=>`<line x1="180" y1="150" x2="${positions[i][0]}" y2="${positions[i][1]}" stroke="#d5b34c" stroke-width="2"/>`).join('')}<rect x="120" y="120" width="120" height="60" rx="6" fill="#d5b34c"/><text x="180" y="154" text-anchor="middle" font-size="16" fill="#101820">${esc(focus.name.slice(0,7))}</text>${targets.map((p,i)=>`<g><rect x="${positions[i][0]-58}" y="${positions[i][1]-27}" width="116" height="54" rx="5" fill="#f4ecd8"/><text x="${positions[i][0]}" y="${positions[i][1]}" text-anchor="middle" font-size="14" fill="#101820">${esc(p.name.slice(0,7))}</text><text x="${positions[i][0]}" y="${positions[i][1]+17}" text-anchor="middle" font-size="10" fill="#30485c">関係${i+1}</text></g>`).join('')}</svg>`;const relatedNpc=new Set(fullEdges.filter(e=>e.a.startsWith('npc:')&&e.b.startsWith('npc:')).flatMap(e=>[e.a,e.b]));const candidates=d.peopleMode==='npc'?all.filter(p=>p.npc&&relatedNpc.has(p.id)):d.peopleMode==='all'?all:all.filter(p=>p.kind!=='地域NPC'),listPage=Math.max(0,Math.min(Math.ceil(candidates.length/12)-1,d.peoplePage||0));return `<p>登場した人物だけを表示。新しい街への到着や会話、仲間加入、二人の約束の選択に合わせて関係を更新します。図の線の意味は下の関係一覧で確認できます。</p><div class="row3"><button class="btn" data-a="relationMode" data-v="main">主要人物</button><button class="btn" data-a="relationMode" data-v="all">全人物 ${all.length}人</button><button class="btn" data-a="relationMode" data-v="npc">NPC同士</button><button class="btn" data-a="openSheet" data-k="groupProfile">グループ詳細</button></div><div class="opts">${candidates.slice(listPage*12,listPage*12+12).map(p=>`<button class="btn" data-a="relationFocus" data-v="${p.id}">${esc(p.name)}</button>`).join('')}</div><div class="choice-pages"><button class="btn" data-a="peoplePage" data-v="${listPage-1}" ${listPage?'':'disabled'}>前へ</button><span>${listPage+1}/${Math.max(1,Math.ceil(candidates.length/12))}</span><button class="btn" data-a="peoplePage" data-v="${listPage+1}" ${(listPage+1)*12<candidates.length?'':'disabled'}>次へ</button></div><h3 class="label">${esc(focus.name)}・${esc(focus.role)}</h3>${np?'<p>'+esc(np.bio)+'</p><p>'+(np.age?np.age+'歳／':'')+'出身・話し方：'+esc(np.from)+'／「'+esc(np.line)+'」</p><button class="btn" data-a="storyForNpc" data-v="'+np.id+'">この人物の事件・物語</button>':focus.cid?'<p>口癖：「'+esc(CHARS[focus.cid].catchphrase||'')+'」</p>':''}${svg}<div class="stack">${show.map((e,i)=>`<section class="setcard"><b>関係${i+1}：${esc(targets[i].name)}</b><p>${esc(e.label)}</p><button class="btn" data-a="relationFocus" data-v="${targets[i].id}">この人物を中心に見る</button></section>`).join('')}</div><div class="choice-pages"><button class="btn" data-a="relationPage" data-v="${page-1}" ${page?'':'disabled'}>前の関係</button><span>${page+1}/${Math.max(1,Math.ceil(edges.length/4))}</span><button class="btn" data-a="relationPage" data-v="${page+1}" ${(page+1)*4<edges.length?'':'disabled'}>次の関係</button></div>`;}
function nationalChapterEndingLines(st,id){
 const i=NATIONAL_CHAPTERS.findIndex(c=>QUESTS[c.clear].scene===id);if(i<0)return [];
 if(i<5){const c=NATIONAL_CHAPTERS[i],next=NATIONAL_CHAPTERS[i+1],first=HUBS[next.hubs[0]].name,lines=[];if(i===0)lines.push(['','S6は九州でたどり着いた最初の目標。全国での出演・撮影・配信の旅は、ここからも続いていく。']);else lines.push(['',c.name+'を終えた。次は'+next.name+'。'+first+'へ、これまでの記録と出会いを持って出発しよう。'],[charName(st,'moe'),['','','元の仲間とも今の自分の言葉で会いたい。写真と配信の表現を、もっと広げていこう。','表現を広げた次は、反応が揺れる日にも続けられるペースを探したい。','離れた人にも声が届くように、便りと配信をつなぐ旅を続けよう。','北へ広げた旅はここで南へ折り返す。関東で準備を結び、東京の本番へ向かおう。'][i+1]]);
 lines.push(['',HUBS[c.special].name+'の地域特別エリアも解放。任意の寄り道なので、未クリアでも'+next.name+'へ進めます。']);if(i)lines.push(['','レベル・職業熟練度の上限は'+c.cap+'→'+next.cap+'。次の拠点は'+first+'です。']);return lines;}
 const h=charName(st,'moe'),p=charName(st,'hero');return [['','東京ドーム。開演の灯りが満員の客席を照らす。全国で受け取った声が、今ここで重なった。'],[h,'アイドルグループ「おやすみセカイ」を脱退してから、新しい声に出会い直す旅を続けてきました。'],[h,'撮影会で目を合わせた人、イベントを作ってくれた人、配信でおかえりと言ってくれた人。今日は一人ひとりへ返事をする日です。'],[p,'全国のみんなが、それぞれの場所からここを作ってくれた。補佐としてだけでなく、共同制作者として、この成功を一緒に受け取りたい。'],['','全国に名を知られるトップライバー、そしてグラビアや発信でも活躍するインフルエンサーへ。二人の挑戦は、大成功を収めた。'],[h,st.relationshipChoice==='romance'?'好きです。成功した私だけじゃなく、その先の日常も、恋人として一緒に選んでいきたい。':st.relationshipChoice==='partner'?'一番大切な相棒へ。成功の先の日常も、二人で相談しながら歩いていこう。':'成功の先の日常も、あなたと相談しながら歩いていきたい。私たちの気持ちの名前は、急がず二人で確かめよう。'],[p,st.relationshipChoice==='romance'?'私も好きです。夢と暮らし、両方を大切にしていこう。':'うん。次の夢も、帰る場所も、一緒に作っていこう。'],['','おやすみセカイの仲間、全国の協力者、旅の仲間の拍手が続く。違う道を歩く人も、同じ瞬間を喜んでいた。'],['','翌朝。二人はいつものように朝ごはんを食べ、全国から届いたお礼の便りに返事を書いた。幸せは、大きな舞台の後にも続いていく。'],['','― 全国ツアー本編 完 ハッピーエンド ―'],['','関東の地域特別エリアと、上限700・800・900・999へ進む任意の追加遠征が解放されました。']];}

/* v6.22: character identity is independent of jobs; all dialogue is fictional. */
function caseRecord(st,id){return st.narrative?.cases?.[id]||null;}
function chapterPropPast(st,c){return st.quests[c.clear]==='complete'||st.quests[c.clear]==='combatDone'||!!st.bossDefeated[c.boss]||st.run?.bossId===c.boss;}
function ensureNarrative(st,legacy=false){st.eventItems=st.eventItems||{};st.narrative=st.narrative||{version:1,cases:{},people:[]};if(legacy)for(const c of NARRATIVE_CASES.filter(c=>c.main))if(!caseRecord(st,c.id)&&chapterPropPast(st,c)){st.narrative.cases[c.id]={found:[],step:2,done:true,route:'legacy',wrong:0,legacy:true};if(Object.keys(st.eventItems).length<EVENT_ITEM_LIMIT)st.eventItems[c.memory]=1;}st.narrative.people=[...new Set(NARRATIVE_CASES.filter(c=>caseRecord(st,c.id)&&!caseRecord(st,c.id).legacy).flatMap(c=>c.cast))];return st.narrative;}
function eventItemCount(st){return Object.keys(st.eventItems||{}).length;}
function eventCanAdd(st,id){return Object.prototype.hasOwnProperty.call(EVENT_ITEMS,id)&&!!(st.eventItems?.[id]||eventItemCount(st)<EVENT_ITEM_LIMIT);}
function giveEventItem(st,id){if(!eventCanAdd(st,id))return false;st.eventItems=st.eventItems||{};st.eventItems[id]=1;collectionMark(st,id);return true;}
function storyActionReason(st,c){if(!st||st!==G.st||G.readOnly)return 'このタブは閲覧のみです。';if(!c)return 'この事件は見つかりません。';if(G.screen!=='explore'||st.run||st.stream||st.careerSession||G.dlg||streamPending())return '戦闘・配信・活動準備・会話を終えてから進めてください。';if(curHub()!==c.hub||!isSafe())return HUBS[c.hub].name+'の安全地帯で調べられます。';if(!hubUnlocked(st,c.hub))return 'この街の解放が必要です。';if(c.prior&&!caseRecord(st,c.prior)?.done)return '前の物語「'+NARRATIVE_CASES.find(x=>x.id===c.prior).title+'」の解決が必要です。';return '';}
function storyBegin(id){const st=G.st,c=NARRATIVE_CASES.find(c=>c.id===id);if(storyActionReason(st,c)||caseRecord(st,id))return false;ensureNarrative(st);st.narrative.cases[id]={found:[],step:0,done:false,route:null,wrong:0};for(const p of c.cast)if(!st.narrative.people.includes(p))st.narrative.people.push(p);commit();say([['',c.title],['',c.intro],['','この事件の協力者：'+c.cast.map(p=>NPCS[p].name+'（'+(NPCS[p].role||'制作の協力者')+'）').join('・')+'。別の街にいる協力者とは、手紙や通話でも資料を照合します。'],[NPCS[c.cast[0]].name,'資料を二つ確かめてから、一緒に考えてもらえる？'],['','事件帳の「調べる」で証拠を集め、謎を解いてから、手に入れた特別イベント品を使用します。']],()=>openSheet('storyJournal',{caseId:id}));return true;}
function storyInspect(id,index){const st=G.st,c=NARRATIVE_CASES.find(c=>c.id===id),r=caseRecord(st,id);if(storyActionReason(st,c)||!r||r.done||![0,1].includes(index)||r.found.includes(index))return false;const item=c.clues[index];if(!giveEventItem(st,item)){toast('特別イベント品は200種類までです。手元の品の使用先を確認してください。');return false;}r.found.push(index);commit();say([['','特別イベント品「'+EVENT_ITEMS[item].name+'」を入手。'],['',EVENT_ITEMS[item].text]],()=>openSheet('storyJournal',{caseId:id}));return true;}
function storyAnswer(id,choice){const st=G.st,c=NARRATIVE_CASES.find(c=>c.id===id),r=caseRecord(st,id);if(storyActionReason(st,c)||!r||r.done||r.found.length!==2||r.step>=2||!Number.isInteger(choice)||choice<0||choice>2||!c.clues.every(k=>st.eventItems[k]))return false;const q=c.puzzles[r.step];if(choice!==q.answer){r.wrong++;commit();G.sheetData={caseId:id,feedback:'まだ資料と合いません。'+q.why};render();return false;}if(r.step===1&&!giveEventItem(st,c.prop)){toast('特別イベント品が満杯です。別の品の使用先を確認してください。');return false;}r.step++;commit();G.sheetData={caseId:id,feedback:'照合できました。'+q.why};if(r.step===2)say([['','二つの謎が解けた。「'+c.propName+'」を手に入れた。'],['','使用先：'+HUBS[c.hub].name+'・'+c.title+'。持ち物の「特別イベント品」か、この事件帳から渡してください。']],()=>openSheet('storyJournal',{caseId:id}));else render();return true;}
function storyConclude(id,route){const st=G.st,c=NARRATIVE_CASES.find(c=>c.id===id),r=caseRecord(st,id);if(storyActionReason(st,c)||!r||r.done||r.step!==2||!(c.main?route==='handover':['private','celebrate'].includes(route))||![...c.clues,c.prop].every(k=>st.eventItems?.[k]))return false;for(const k of [...c.clues,c.prop])delete st.eventItems[k];giveEventItem(st,c.memory);r.done=true;r.route=route;st.gold+=(c.main?2:3)*NATIONAL_CHAPTERS[c.region].cap;st.tickets+=60;commit();say(storyResolutionLines(st,c),()=>openSheet('storyJournal',{caseId:id}));return true;}
function storyResolutionLines(st,c){const r=caseRecord(st,c.id),lines=[['',c.title+'・'+(r?.legacy?'旧記録を引継ぎ':c.main?'本編の準備完了':'事件解決')],['',c.ending]];if(r?.legacy)lines.push(['','既に進んだ本編を維持しています。新しい準備品のやり直しは必要ありません。']);else if(!c.main){lines.push([NPCS[c.cast[0]].name,r.route==='private'?'少し、私たちだけで話す時間をもらうね。':'私たちで話してから、伝えたいことを仲間にも届けるね。'],[NPCS[c.cast[1]].name,'うん。これからのことは、一緒に決めよう。']);}lines.push(['',c.main?'台本・引継票を渡したことで、この地域の本編終盤のボスへ進む準備が整った。':'二人と協力者の関係が相関図に反映された。任意の物語なので、未解決でも本編を進められる。']);return lines;}
function mainPropForBoss(bid){return NARRATIVE_CASES.find(c=>c.main&&c.boss===bid);}
function mainPropReason(st,bid){const c=mainPropForBoss(bid);return c&&!caseRecord(st,c.id)?.done&&!chapterPropPast(st,c)?'本番の準備品「'+c.propName+'」が必要です。事件帳で資料を照合し、この街で渡してください。':'';}
function mainPropGate(st,bid){const c=mainPropForBoss(bid),reason=mainPropReason(st,bid);if(!reason)return false;toast(reason);openSheet('storyJournal',{caseId:c.id});return true;}
function storyArcStage(st,region){let n=0;for(let ep=1;ep<=3;ep++){if(caseRecord(st,'SUB'+(region+1)+ep)?.done)n=ep;else break;}return n;}
function narrativeRelations(st,people){const known=new Set(people.map(p=>p.id)),edges=[],add=(a,b,label)=>{a='npc:'+a;b='npc:'+b;if(known.has(a)&&known.has(b)){const prior=edges.find(e=>e.a===a&&e.b===b||e.a===b&&e.b===a);if(prior)prior.label+='／'+label;else edges.push({a,b,label});}};for(const arc of TALE_CAST){const [a,b,c]=arc.people,n=storyArcStage(st,arc.region),last=caseRecord(st,'SUB'+(arc.region+1)+n);add(a.id,b.id,NPC_PAIR_LABELS[arc.region][n]+(n&&last?.route==='private'?'／当人たちの時間を大切にした':n?'／本人たちが選んだ範囲で仲間に報告':''));add(a.id,c.id,arc.region===3?n>=2?'予定を尊重し合う劇場仲間':'仕事と家族の距離を相談する劇場仲間':n?'事件を照合して信頼を結び直す協力者':'事件の行き違いを抱える協力者');add(b.id,c.id,arc.region===3?'親子／'+(n>=2?'先回りせず予定を尊重する':'帰省の予定が行き違っている'):n?'それぞれの役目を尊重する仲間':'事件の理由を確かめたい仕事仲間');const main=NARRATIVE_CASES.find(c=>c.main&&c.region===arc.region);add(main.cast[0],a.id,caseRecord(st,main.id)?.done?'地域の共演準備を一緒に完了した制作仲間':'地域の共演準備を相談する制作仲間');}for(const [a,b,label]of [['photo_kei','tale_toru','写真の表現と作者名を尊重する同業者'],['oys_ao','tale_chitose','映像と衣装の表現を相談する制作仲間'],['oys_rio','tale_chitose','今の本人が着たい衣装を作る職人仲間'],['oys_ren','tale_rikka','声と便りを届ける番組仲間'],['oys_minato','tale_yuma','音楽と照明の出番を合わせる制作仲間'],['tour_mao','tale_haruka','全国公演の仕事を引き継ぐ制作の先輩と後輩']])add(a,b,label);return edges;}
function narrativeEndingLines(st,id){const c=NARRATIVE_CASES.find(c=>c.main&&QUESTS[c.clear].scene===id);if(!c)return [];const lines=[];if(caseRecord(st,c.id)?.done&&!caseRecord(st,c.id).legacy)lines.push(['',c.propName+'を使って整えた段取りが、舞台を支えた。']);const arcs=id==='N607_DONE'?TALE_CAST:[TALE_CAST[c.region]];for(const arc of arcs){const n=storyArcStage(st,arc.region);if(!n)continue;const ep=NARRATIVE_CASES.find(x=>x.id==='SUB'+(arc.region+1)+n);lines.push(['',ep.ending]);}return lines;}
function narrativeNpcLines(st,id){const arc=TALE_CAST.find(a=>a.people.some(p=>p.id===id));if(!arc)return [];const n=storyArcStage(st,arc.region);return [[NPCS[id].name,n?NARRATIVE_CASES.find(c=>c.id==='SUB'+(arc.region+1)+n).ending:'この地域で行き違ってしまった約束がある。事件帳の任意サブストーリーで、資料を一緒に確かめてほしい。'],['','「全国・地図」または「イベント・依頼」から事件・謎解き帳を開けます。']];}
function renderStoryJournal(){const st=G.st,d=G.sheetData||{},c=NARRATIVE_CASES.find(c=>c.id===d.caseId);if(c){const r=caseRecord(st,c.id),reason=storyActionReason(st,c);let h=`<button class="btn" data-a="openSheet" data-k="storyJournal">事件一覧へ</button><p><span class="tag">${c.main?'本編の準備':'任意サブストーリー'}</span> ${esc(NATIONAL_CHAPTERS[c.region].name)}／${esc(HUBS[c.hub].name)}</p><h3 class="label">${esc(c.title)}</h3><p>${esc(c.intro)}</p><p class="small">登場人物：${c.cast.map(id=>knownRelationshipPeople(st).some(p=>p.id==='npc:'+id)||r&&!r.legacy?esc(NPCS[id].name):'これから出会う協力者').join('・')}</p><p class="small">${c.main?'この地域の終盤ボス前に、準備品をここで渡します。':'本編の依頼とは別に進められます。未解決でも本編を進められます。'}</p>${reason?'<p class="warn">'+esc(reason)+'</p>':''}`;
 if(r?.done)return h+`<p class="good">✓ ${c.main?'準備完了':'解決済み'}${r.legacy?'（旧記録を維持）':''}</p><p>${esc(c.ending)}</p>${!r.legacy&&!c.main?'<p>選んだ支え方：'+(r.route==='private'?'当人たちの時間を優先':'本人たちが選んだ範囲で仲間に報告')+'</p>':''}<div class="row2"><button class="btn" data-a="storyReplay" data-v="${c.id}">結末を読み返す</button><button class="btn" data-a="storyRelations" data-v="${c.cast[0]}">人物相関図</button></div><p class="small">再報酬はありません。記録と関係は保存されています。</p>`;
 if(!r)return h+`<p>資料2件を調査→謎2問を照合→特別イベント品を使用。間違えても資料は失わず再挑戦できます。</p><button class="btn primary" data-a="storyBegin" data-v="${c.id}" ${reason?'disabled':''}>${c.main?'本編の準備を始める':'この事件を引き受ける'}</button>`;
 h+=`<h3 class="label">調べる・証拠を読む ${r.found.length}/2</h3><div class="stack">${c.clues.map((id,i)=>`<section class="setcard"><b>${r.found.includes(i)?'✓ ':''}${esc(EVENT_ITEMS[id].name)}</b>${r.found.includes(i)?'<p>'+esc(EVENT_ITEMS[id].text)+'</p>':`<p class="small">${esc(NPCS[c.cast[Math.min(i,c.cast.length-1)]].name)}の資料を確認する</p><button class="btn" data-a="storyInspect" data-v="${c.id}" data-i="${i}" ${reason?'disabled':''}>この資料を調べる</button>`}</section>`).join('')}</div>`;
 if(d.feedback)h+='<p class="warn" role="status">'+esc(d.feedback)+'</p>';
 if(r.found.length<2)return h+'<p>両方の資料を集めると、照合と謎解きへ進めます。</p>';
 if(r.step<2){const q=c.puzzles[r.step];return h+`<h3 class="label">謎 ${r.step+1}/2・${esc(q.kind)}</h3><p>${esc(q.question)}</p><div class="stack">${q.choices.map((v,i)=>`<button class="btn" data-a="storyAnswer" data-v="${c.id}" data-i="${i}" ${reason?'disabled':''}>${esc(v)}</button>`).join('')}</div><p class="small">上の証拠を読み返せます。誤答してもアイテム・ゴールド・進行は失いません。</p>`;}
 return h+`<section class="setcard"><b>使用する品：${esc(c.propName)}</b><p>使用先：${esc(HUBS[c.hub].name)}・${esc(c.title)}</p><p>資料2件と準備品を渡し、解決の記録を受け取ります。報酬：${(c.main?2:3)*NATIONAL_CHAPTERS[c.region].cap}G・チケット60（1回のみ）。</p><div class="stack">${(c.main?[['handover','準備品を舞台へ渡す']]:[['private','品を渡し、当人たちが話す時間を優先する'],['celebrate','品を渡し、本人たちが選んだ範囲で仲間へ報告する']]).map(([v,label])=>`<button class="btn primary" data-a="storyUse" data-v="${c.id}" data-route="${v}" ${reason?'disabled':''}>${label}</button>`).join('')}</div></section>`;
 }
 const filter=['here','main','sub','done','all'].includes(d.storyFilter)?d.storyFilter:'here',visible=NARRATIVE_CASES.filter(c=>hubUnlocked(st,c.hub)||st.visitedHubs.includes(c.hub)||caseRecord(st,c.id));const list=visible.filter(c=>filter==='here'?c.hub===curHub():filter==='main'?c.main:filter==='sub'?!c.main:filter==='done'?caseRecord(st,c.id)?.done:true),page=Math.max(0,Math.min(Math.ceil(list.length/8)-1,d.storyPage||0));return `<p>本編の舞台準備6件と、NPC同士の事件・恋愛・トラブルを解く任意の連作18話。任意の連作は各地域3話で、前の話の解決後に続きへ進めます。</p><div class="opts">${[['here','この街'],['main','本編の準備'],['sub','任意の物語'],['done','解決済み'],['all','全事件']].map(([k,v])=>`<button class="btn ${filter===k?'primary':''}" data-a="storyFilter" data-v="${k}">${v}</button>`).join('')}</div><div class="stack">${list.slice(page*8,page*8+8).map(c=>{const r=caseRecord(st,c.id);return `<button class="btn dexrow" data-a="storyOpen" data-v="${c.id}"><span>${c.main?'本編準備':'任意'}・${esc(c.title)}</span><span class="small">${esc(HUBS[c.hub].name)}／${r?.done?'✓ 完了':r?r.step===2?'準備品を使う':`資料${r.found.length}/2・謎${r.step}/2`:c.prior&&!caseRecord(st,c.prior)?.done?'前の話を解決すると開始':'未開始'}</span></button>`;}).join('')||'<p>この分類の事件はありません。ほかの分類や、解放された街を確認してください。</p>'}</div><div class="choice-pages"><button class="btn" data-a="storyPage" data-v="${page-1}" ${page?'':'disabled'}>前へ</button><span>${page+1}/${Math.max(1,Math.ceil(list.length/8))}</span><button class="btn" data-a="storyPage" data-v="${page+1}" ${(page+1)*8<list.length?'':'disabled'}>次へ</button></div><button class="btn" data-a="openSheet" data-k="eventItems">特別イベント品 ${eventItemCount(st)}/${EVENT_ITEM_LIMIT}種類</button>`;}
function renderEventItems(){const st=G.st,d=G.sheetData||{},kind=['all','clue','prop','memory'].includes(d.eventKind)?d.eventKind:'all',names={all:'すべて',clue:'証拠品',prop:'使用待ちの品',memory:'解決の記録'},ids=Object.keys(st.eventItems||{}).filter(id=>kind==='all'||EVENT_ITEMS[id].kind===kind),page=Math.max(0,Math.min(Math.ceil(ids.length/10)-1,d.eventPage||0));return `<div class="capline"><b>特別イベント品 ${eventItemCount(st)}/${EVENT_ITEM_LIMIT}種類</b><span>各1個・通常の道具袋とは別枠</span></div><p class="small">売却・破棄はできません。証拠品と準備品は事件の解決時に渡し、「解決の記録」へ置き換わります。使用先を開いて手順を確認できます。</p><div class="opts">${Object.entries(names).map(([k,v])=>`<button class="btn ${k===kind?'primary':''}" data-a="eventKind" data-v="${k}">${v}</button>`).join('')}</div><div class="stack">${ids.slice(page*10,page*10+10).map(id=>{const it=EVENT_ITEMS[id],c=NARRATIVE_CASES.find(c=>c.id===it.caseId);return `<section class="setcard"><b>${esc(it.name)}</b><p class="small">${names[it.kind]}／${esc(HUBS[c.hub].name)}</p><p>${esc(it.text)}</p><p class="good">使用先：${esc(it.where)}</p><button class="btn" data-a="storyOpen" data-v="${c.id}">${it.kind==='memory'?'結末を読む':it.kind==='prop'?'使用する場面を開く':'証拠の照合へ'}</button></section>`;}).join('')||'<p>この分類の品はありません。事件帳で資料を調べると手に入ります。</p>'}</div><div class="choice-pages"><button class="btn" data-a="eventPage" data-v="${page-1}" ${page?'':'disabled'}>前へ</button><span>${page+1}/${Math.max(1,Math.ceil(ids.length/10))}</span><button class="btn" data-a="eventPage" data-v="${page+1}" ${(page+1)*10<ids.length?'':'disabled'}>次へ</button></div><button class="btn" data-a="openSheet" data-k="items">通常の道具袋へ</button>`;}
function validateNarrative(s){const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);if(s.eventItems&&(!obj(s.eventItems)||Object.keys(s.eventItems).length>EVENT_ITEM_LIMIT||Object.entries(s.eventItems).some(([id,n])=>!Object.prototype.hasOwnProperty.call(EVENT_ITEMS,id)||n!==1)))throw Error('bad special event items');if(!s.narrative)return;if(!obj(s.narrative)||s.narrative.version!==1||!obj(s.narrative.cases)||!Array.isArray(s.narrative.people)||new Set(s.narrative.people).size!==s.narrative.people.length||s.narrative.people.some(id=>!NATIONAL_PEOPLE.some(p=>p.id===id)))throw Error('bad narrative records');for(const [id,r]of Object.entries(s.narrative.cases)){const c=NARRATIVE_CASES.find(c=>c.id===id);if(!c||!obj(r)||!Array.isArray(r.found)||new Set(r.found).size!==r.found.length||r.found.some(i=>![0,1].includes(i))||!Number.isInteger(r.step)||r.step<0||r.step>2||typeof r.done!=='boolean'||!Number.isSafeInteger(r.wrong)||r.wrong<0||!(r.route===null||['private','celebrate','handover','legacy'].includes(r.route))||r.legacy!==undefined&&r.legacy!==true||r.legacy&&(!c.main||!r.done||r.route!=='legacy')||r.done&&r.step!==2||!r.legacy&&(r.step>0&&r.found.length!==2||r.done&&(c.main?r.route!=='handover':!['private','celebrate'].includes(r.route))||!r.done&&r.route!==null))throw Error('bad mystery case '+id);if(!r.done&&!r.legacy&&(r.found.some(i=>!s.eventItems?.[c.clues[i]])||r.step===2&&!s.eventItems?.[c.prop]))throw Error('missing story evidence '+id);}}

const CHARACTER_ARCS={
 hero:{trait:'希望の伴走',effect:'職業に関係なく、応援コメントで得るエール＋3。',comment:3,title:'同じ明日を選ぶ人',background:'頼られるたびに自分の望みを後回しにしてきた。福岡の交流会で{h}に出会い、応援するだけでなく、自分も誰かと未来を選びたいと気づく。',hero:'誰かの役に立てない日にも、自分には価値があると知っていく。',heroine:'夢を代わりに決める人ではなく、迷う夜にも隣で話を聞く対等な旅の相棒。',quests:[null,'M01','M10','M16'],ultimate:'隣に灯す約束',need:'none',desc:'生存者全員のHPを最大値の18％回復（魅力補正あり）、防護2、コメント連携4。',epilogue:'人を支えるだけだった旅人は、自分の行きたい明日を、自分の言葉で選べるようになった。'},
 moe:{trait:'帰る声',effect:'戦闘開始時、エール＋6。職業を変えても発動。',title:'舞台の外でも笑う人',background:'グループを脱退してから、拍手が止んだ後の静けさが怖かった。S6を目指すのは、失った席を取り戻すためではない。画面の向こうの一人と、自分の声で出会い直したいから。',hero:'{p}が無理を隠すことにも気づく。支えられるだけでなく、相手の夢も聞ける人になりたい。',heroine:'舞台で輝く自分と、疲れて言葉が出ない自分。その両方を大切にする物語。',quests:[null,'M02','M10','M16'],ultimate:'ゼロからのアンコール',need:'none',desc:'敵全体へ強攻撃。自分以外の生存者に防護1。',epilogue:'数字のない朝にも、返したい挨拶がある。舞台の外で笑う自分を、もう隠さなくなった。'},
 kohei:{trait:'約束の帰り道',effect:'ガードすると、自分に防護2を追加。職業不問。',title:'帰り道を伝える人',background:'長距離の仕事を言い訳に、恋人との約束を何度も延期した。別れ際の「無事でいて」だけが耳に残り、届けられなかった手紙を今も荷物に入れている。',hero:'黙って背負い込む{p}に昔の自分を見る。予定だけでなく、今の気持ちも伝えろと背中を押す。',heroine:'配信を「声の荷物」と呼ぶ。{h}には、待つ人へ帰る時間も守ってほしいと思っている。',quests:[null,'M03','M06','M16'],ultimate:'必ず帰るキャラバン',need:'enemy',desc:'敵1体へ強攻撃し、生存者全員に防護3。',epilogue:'手紙の返事を急かさず、会える日に会おうと伝えた。帰り道は、一人で決めるものではなくなった。'},
 kayo:{trait:'食卓のぬくもり',effect:'戦闘開始時、生存者全員のMP＋2（最大値まで）。',title:'おかえりを残す人',background:'亡き伴侶と営んだ小さな食堂を、長く一人で守ってきた。新しい献立を作ることを、思い出への裏切りのように感じていた。旅のために炊く一鍋が、止まっていた時間を動かす。',hero:'{p}には、頑張りを説明できない日にもご飯を食べていいと教える。',heroine:'{h}を娘の代わりにせず、一人の夢を持つ人として見守る。恋を応援しながら、自分の明日も作る。',quests:[null,'M05','M08','M16'],ultimate:'ただいまの温かな食卓',need:'none',desc:'生存者全員のHPを最大値の10％回復（魅力補正あり）、MPを最大値の15％回復。',epilogue:'食堂の献立には、懐かしい料理と旅で覚えた新しい一皿が並ぶ。大切な人を忘れずに、生きる喜びを増やしていく。'},
 tsumugi:{trait:'言葉を結ぶ糸',effect:'キラコメ連携が進む応援コメントで、エール＋3。職業不問。',title:'送信を押せた人',background:'かつて好きだった人への気持ちを、下書きにしたまま送れなかった。安全な正解ばかり探す癖がつき、誰かの配信を分析することで、自分の言葉から逃げていた。',hero:'分析が行き詰まった時、「どうしたい？」と尋ねる{p}に助けられる。答えを預けない友情を育てる。',heroine:'{h}の声が震える日も記録から消さない。不完全な声が誰かに届くことを、二人で確かめる。',quests:[null,'M07','M10','M16'],ultimate:'届かなかった言葉の架け橋',need:'none',desc:'敵全体へ攻撃し、コメント連携を4にする。キラコメの完成条件は省略しない。',epilogue:'昔の恋を美化した下書きではなく、今の自分の言葉を送った。返事がどんな形でも、伝えた気持ちまで失敗にはならない。'},
 mio:{trait:'小さな脈拍',effect:'自分が技能で与えるHP回復量＋10％。職業不問。',title:'弱さを預けられる人',background:'大切な人との別れを、もっと気づけていれば防げたはずだと思い続けた。誰かの疲れには敏感なのに、自分が助けてと言うことは苦手。旅の中で、救うことと一緒に悲しむことの違いを知る。',hero:'{p}とは互いの無理を見抜く友人。助ける側と助けられる側を固定しない約束をする。',heroine:'{h}が人前で泣けない夜に、答えを求めず隣に座る。恋心も不安も、本人の言葉になるまで待つ。',quests:[null,'M09','M12','M16'],ultimate:'明日へつなぐ鼓動',need:'none',desc:'生存者全員のHPを最大値の30％回復（魅力・固有特性補正あり）。戦闘不能者は最大HPの25％で復帰。',epilogue:'「今日は私が話を聞いてほしい」。その短い言葉を言えるようになった。過去の別れを抱えたまま、新しい優しさを受け取る。'},
 makoto:{trait:'居場所の設計図',effect:'職業に関係なく、自分の身の守り＋10％。防御力に反映。',defPercent:10,title:'余白を分け合う人',background:'遠くで暮らす恋人に贈る家の図面を、何年も一人で描き直している。完璧になってから迎えようとするほど、二人の会話は減った。未完成の控室を仲間と直す中で、余白を分ける意味を学ぶ。',hero:'支える場所を一人で用意しようとする{p}に、自分の失敗を重ねる。相談は相手を信じることだと伝える。',heroine:'{h}にはステージだけでなく、失敗して帰れる居場所を作りたい。どの夢を選ぶかは本人に任せる。',quests:[null,'M11','M14','M16'],ultimate:'帰る場所のステージ',need:'none',desc:'生存者全員のHPを最大値の20％回復（魅力補正あり）、防護6（上限8）。',epilogue:'図面の空白に恋人が窓を一つ描いた。完成した家ではなく、一緒に直していける家を、二人で選び始める。'},
 gaku:{trait:'遠回りの底力',effect:'道具以外でボスへ与えるダメージ＋8％。職業不問。',title:'もう一度戸をたたく人',background:'家の事情が苦しかった頃、婚約していた相手に何も説明せず町を出た。「巻き込みたくない」という言葉で、自分が傷つくことからも逃げていた。修理を頼まれた古い蛇口が、置いてきた暮らしを思い出させる。',hero:'{p}に、黙って去ることは優しさと同じではないと打ち明ける。大切な人の選ぶ権利を奪わないよう願う。',heroine:'{h}が脱退した後も歌を続ける姿に、去った場所と向き合う勇気をもらう。',quests:[null,'M13','M16','M16'],ultimate:'遠回りの流星',need:'enemy',desc:'自分の最大HPの10％も払い、敵1体へ防御無視の強攻撃。支払い後HP1以上が必要。',epilogue:'復縁の約束を求める前に、あの日のことを謝った。相手の今を聞くところから、途切れた会話をつなぎ直していく。'},
 naoki:{trait:'灯をつなぐ手',effect:'職業に関係なく、ひと息つくのMP回復＋3。',rest:3,title:'消えない灯を見つけた人',background:'仕事場の明かりを直して回るうち、自宅の食卓を暗くしてしまった。別居中の妻から届く短い連絡に、まだ返せていない言葉がある。北九州で見送った一行を追いかけたのは、誰かの挑戦を最後まで見届けたかったから。',hero:'{p}に支えることの誇りを認めつつ、好きな人へ帰る勇気も忘れるなと伝える。',heroine:'北九州から声を聞いていた応援者。{h}が弱音を言える舞台なら、誰も置き去りにならないと思っている。',quests:[null,'M15','M16','M16'],ultimate:'消えない灯の回路',need:'enemy',desc:'敵1体へ防御無視の強攻撃。自分以外の生存者に防護2。',epilogue:'妻に、直せた配線ではなく直せなかった会話の話をした。返ってきた「まず一緒にご飯を」に、ゆっくりうなずいた。'}
};
const CHARACTER_EPISODES={
 hero:[['応援席の空白', [['','交流会の広場で、空の椅子を片づけていた。'],['{h}','今日は、あなた自身は何が楽しかった？'],['{p}','考えたことがなかった。役に立てたか、そればかりで。'],['{h}','私は、あなたが笑ってくれた時が嬉しかった。'],['','応援する人にも、帰りを待つ声がある。二人は一脚だけ残し、並んで夜風に当たった。']]],
 ['差し出された傘',[['','帰り道、一本の傘を相手に押しつけようとして、二人とも濡れた。'],['{p}','自分だけ我慢すれば済むと思ってた。'],['{h}','それだと、一緒に帰れないよ。'],['','傘を真ん中に持ち直す。近づいた肩の温度に、言葉が少し遅れた。']]],
 ['役に立てない夜',[['{p}','今日は、何も上手くできなかった。'],['{h}','じゃあ今日は、私があなたの話を聞く番。'],['{p}','困らせたくなくて、平気なふりをしてた。'],['{h}','好きな人たちに、平気なふりをされる方が寂しいな。'],['','「ありがとう」が、慰めを受け取る言葉になった夜だった。']]],
 ['自分の明日',[['','灯台の光の下で、旅の始まりの写真を開いた。'],['{p}','これからも支えたい。でもそれだけじゃなく、一緒にまだ見ていない景色へ行きたい。'],['{h}','うん。私も、あなたの行きたい場所を知りたい。'],['','誰かの夢についていくだけだった道に、自分の足跡が重なった。']]]],
 moe:[['拍手のあとの名前',[['{h}','舞台を降りた後、自分の名前が薄くなった気がしたの。'],['{p}','今ここで話している人の名前は、ちゃんと聞こえてる。'],['{h}','上手に歌えない日も？'],['{p}','その日も。話したくない日は、隣で黙っててもいい。'],['','彼方の拍手ではなく、目の前の返事を信じてみようと思った。']]],
 ['数字のない朝',[['','朝の港。配信画面を閉じたまま、温かい飲み物を分けた。'],['{h}','昨日より数字が低かったら、嫌いになる？'],['{p}','頑張るあなたも、休むあなたも、同じ人だよ。'],['{h}','……その言葉、私からもあなたに返したい。'],['','二人は初めて、次の目標を決めずに朝日を眺めた。']]],
 ['言わなかった一曲',[['{h}','前の舞台に、歌い残した曲がある。でも戻るためだけに歌いたくない。'],['{p}','今のあなたなら、誰に届けたい？'],['{h}','一人で眠れない人。それから、すぐそばで眠るのを忘れる人。'],['','差し出された小さな歌は、励ましよりも静かだった。'],['{h}','あなたがここにいてくれること、当たり前にしたくない。']]],
 ['締めの先の約束',[['','S6の夜が明けても、岬には同じ波が寄せていた。'],['{h}','S6という最初の目標を越えたら、何も怖くなくなると思ってた。'],['{h}','でも大切な人を失う怖さは、消えないんだね。'],['{p}','怖い時も、話そう。勝った日だけじゃなく。'],['','次の挨拶を交わす約束は、順位の付かない宝物になった。']]]],
 kohei:[['荷台の手紙',[['','荷物の隙間から、宛名だけ書かれた封筒が落ちた。'],['{n}','昔、待っててくれた人がいてな。無事ならいいって、最後まで言ってくれた。'],['{p}','何て返したの？'],['{n}','……それを、まだ考えてる。'],['{h}','返事の締め切りを、相手の沈黙に決めさせなくてもいいんじゃないかな。']]],
 ['帰宅予定',[['{n}','この道は早い。でも今日は遠回りする。途中で電話したいんだ。'],['{p}','急ぐ旅だからこそ、必要な寄り道もあるね。'],['{n}','「着いたら連絡する」だけじゃなかった。会いたいと、先に言えばよかった。'],['','電話は留守番だった。それでも自分の声で、一言を残した。']]],
 ['受取人の時間',[['','封筒の裏に、何度も書き直した跡があった。'],['{n}','返事がなかったら、届かなかったことにしたくなる。'],['{h}','届いてから考える時間も、相手のものだよね。'],['{n}','そうだな。俺の荷物を、勝手に受取済みにしちゃいけない。']]],
 ['別々の道の待ち合わせ',[['','短い返事には、「今は忙しい。でも読んだよ」とあった。'],['{n}','これだけで、今夜は帰れる気がする。'],['{p}','結論を急がなくてもいいね。'],['{n}','ああ。次は約束を取りつける前に、相手の今を聞くよ。']]]],
 kayo:[['二人分の味',[['','鍋の塩を確かめた後、佳代は空いた隣を見た。'],['{n}','昔はね、ここで必ず「もう少し薄く」って言う人がいたの。'],['{h}','今も、その人の分を作る？'],['{n}','ええ。忘れなくていいって、思えるから。'],['','誰も急いで慰めず、湯気が消えるまで一緒に座った。']]],
 ['新しい一皿',[['{n}','旅で覚えた料理、店で出していいかしら。あの人は食べたことがないのに。'],['{p}','一緒に好きだったものが、新しく増えるのかもしれない。'],['{n}','……そうね。思い出を守るのと、自分を止めるのは違うわね。'],['','献立帳の空白に、久しぶりに新しい料理名が書かれた。']]],
 ['泣く日の食卓',[['{h}','今日は元気な顔を作れないの。'],['{n}','じゃあ今日は、元気を出さずに食べましょう。'],['{p}','話さなくても、ここにいていい？'],['{n}','もちろん。食卓は、上手に笑える人だけの場所じゃないわ。']]],
 ['おかえりの献立',[['','食堂の看板を書き直す日、佳代は伴侶の古い字を一文字残した。'],['{n}','過去と未来、両方を同じ鍋に入れてもいいのね。'],['{h}','いつか、私たちもここに帰ってくるね。'],['{n}','約束よ。でも予定が変わったら、ちゃんと連絡して。温め直して待つから。']]]],
 tsumugi:[['送信前の言葉',[['','紬の端末には、何年も前の下書きが残っていた。'],['{n}','「好きでした」の次が決まらないまま、季節だけ増えました。'],['{p}','今、伝えたいのは同じ言葉？'],['{n}','……昔の自分を、失敗じゃなかったことにしたいのかもしれません。']]],
 ['正解のない返信',[['{h}','返事が来たら、何て返すの？'],['{n}','全パターンを用意してます。でも、どれも自分の言葉に見えなくて。'],['{p}','その時に聞いて、その時に考えてもいいと思う。'],['','完璧な返信例のファイルを閉じて、紬は少し笑った。']]],
 ['震えた声の記録',[['{n}','今日の配信、声が震えたところも残しましょう。'],['{h}','そこ、消したかったんだけど。'],['{n}','私、あそこで初めて、自分も伝えてみたいと思えたんです。'],['','不完全な記録が、誰かの勇気になった。紬は下書きに今日の日付を入れた。']]],
 ['送信',[['','「あの時好きだったことと、今元気でいてほしいことを伝えたかった」。送信済みの印が灯った。'],['{n}','恋が叶うかどうかと、私が言えたかどうかは別なんですね。'],['{h}','うん。言えた紬に、おめでとう。'],['','返事を待つ画面を伏せ、紬は仲間のいる方へ歩いた。']]]],
 mio:[['気づけなかった日',[['{n}','大切な人が離れていった時、もっと早く疲れに気づけたはずだって、ずっと思ってた。'],['{p}','気づけなかったことを、今も一人で背負ってる？'],['{n}','そうしないと、優しくできなくなりそうで。'],['{h}','その優しさで、澪自身を傷つけないでほしい。']]],
 ['助ける人の椅子',[['','澪がいつものように立ち上がる前に、仲間が椅子を引いた。'],['{n}','私まで休んだら、誰がみんなを見るの。'],['{p}','今日は、みんなで見るよ。'],['','頼られなくなったのではなく、頼っていいのだと気づくまで、少し時間がかかった。']]],
 ['沈黙の五分',[['{h}','好きな人にまで、泣くところを見せたくない時があるの。'],['{n}','答えを用意しなくていいよ。五分だけ、何も言わないでいよう。'],['','五分が過ぎても、誰も時計を見なかった。'],['{n}','……私も、寂しかった。今それを、やっと言えた。']]],
 ['私の話を聞いて',[['{n}','今日は私の話、聞いてくれる？'],['{p}','もちろん。'],['{n}','昔の別れを、なくせるとは思ってない。でも、全部私のせいだったことにするのは、やめたい。'],['{h}','話してくれてありがとう。澪の明日にも、ちゃんと私たちを入れてね。']]]],
 makoto:[['一人で描いた窓',[['','図面には二人分の部屋があるのに、相談した跡がなかった。'],['{n}','完璧になったら、恋人を呼ぼうと思っていたんです。'],['{p}','その人は、どんな窓が好き？'],['{n}','……ずいぶん長く、聞いていませんでした。']]],
 ['未完成を見せる',[['{n}','途中の図面を送りました。手が、こんなに震えるとは。'],['{h}','一緒に考えたい人には、途中を見せてもらえる方が嬉しいかも。'],['','返ってきたのは、「ここに鉢植えを置きたい」という短い言葉だった。'],['{n}','ずっと欲しかった答えより、ずっと生活の匂いがしますね。']]],
 ['余白のある控室',[['','片づけ切れていない控室で、仲間が思い思いに笑っていた。'],['{n}','整っていないのに、居心地がいい。'],['{p}','誰かが使える余白があるからかな。'],['{n}','相手の場所まで、私が描き切らなくてよかったんですね。']]],
 ['二人の設計図',[['','恋人から届いた図面には、見覚えのない窓が増えていた。'],['{n}','私なら描かなかった窓です。でも、ここからの朝を見たい。'],['{h}','完成のお祝いより、最初のお茶会に呼んでね。'],['{n}','ええ。片づいていないところも、笑って見てください。']]]],
 gaku:[['閉めたままの栓',[['','古い蛇口を直す岳の手が、途中で止まった。'],['{n}','昔、こんな台所で、一緒に暮らす約束をした。'],['{p}','その人には、町を出る理由を話せた？'],['{n}','話せなかった。「巻き込みたくない」で全部塞いだ。']]],
 ['優しさのふり',[['{n}','心配をかけないつもりだった。でも、待つかどうかも相手には選べなかった。'],['{h}','私も去った舞台に、言えなかったことがある。'],['{p}','謝るために、戻ってもいいと思う。許してもらう約束はなくても。'],['','岳は、覚えている住所をゆっくり書いた。']]],
 ['返事を求めない手紙',[['','手紙の最後から、「また一緒に」を消した。'],['{n}','先に言うべきことがあった。寂しくさせたこと、何も言わなかったこと。'],['{p}','今度は、相手が選べる言葉になるね。'],['','封をした手は震えた。それでも、今度は黙って去らなかった。']]],
 ['もう一度の戸口',[['','「話なら聞く」。届いた返事を、岳は何度も読み返した。'],['{n}','元に戻れるとは思ってない。今、どんな暮らしをしてるか、聞いてくる。'],['{h}','私たちにも、帰ったら話してね。'],['','遠回りした道は消えない。その先の一歩を、今度は二人の言葉で確かめる。']]]],
 naoki:[['家の明かり',[['{n}','よその灯りは直せるのに、自分ちの食卓は暗いままだ。'],['{p}','奥さんとは、話してる？'],['{n}','連絡は来る。返事を「今忙しい」で止めて、そのままだ。'],['{h}','追いかけて来てくれた勇気、帰る方にも使ってほしいな。']]],
 ['見届けたい理由',[['{n}','北九州でお前たちを見送った時、まだ間に合うことを見た気がした。'],['{p}','何に？'],['{n}','大事な人の挑戦を、最後まで見届けることにさ。家でも、そうすりゃよかった。'],['','遠い町の灯りを見ながら、直樹は妻の連絡を開いた。']]],
 ['直せない話',[['{n}','「どこが悪かったか教えてくれ」って、修理の聞き方をしてた。'],['{h}','答えを直すより、気持ちを聞いてほしい時もあるよね。'],['{n}','ああ。今日は言い訳せず、寂しくさせたことを話してみる。'],['','工具を置いた手で、直樹は電話をかけた。']]],
 ['まず一緒にご飯',[['','妻からの返事は、短かった。「帰ったら、まず一緒にご飯を」。'],['{n}','まだ許してもらえたわけじゃない。でも、椅子は一つ残してくれた。'],['{p}','座って、ちゃんと話してきて。'],['{n}','ああ。灯りをつけるだけじゃなく、その下にいるよ。']]]]
};
function characterText(st,text){return text.replaceAll('{p}',charName(st,'hero')).replaceAll('{h}',charName(st,'moe'));}
function characterRecord(st,cid){return st.characterStories?.[cid]||{seen:0,wins:0};}
function ensureCharacterStories(st){st.characterStories=st.characterStories||{};for(const cid of st.roster)st.characterStories[cid]=st.characterStories[cid]||{seen:0,wins:0};}
function ultimateId(cid){return 'CHAR_'+cid;}
function ultimateMp(a){return Math.max(8,Math.ceil((a.maxC||a.maxMP||8)*.25));}
function skillMpCost(a,sk){return sk.ultimate?ultimateMp(a):sk.cost;}
function characterStoryReason(st,cid,episode){if(!st.roster.includes(cid)||!CHARACTER_ARCS[cid]||!Number.isInteger(episode)||episode<1||episode>4)return '仲間と話数を確認してください。';const r=characterRecord(st,cid);if(episode<=r.seen)return '';if(episode!==r.seen+1)return '前のエピソードを読んでください。';const q=CHARACTER_ARCS[cid].quests[episode-1],need=[0,3,8,15][episode-1];if(q&&st.quests[q]!=='complete')return '本編'+q+'クリアで解放';if(r.wins<need)return 'この仲間を同行させ、対象戦闘であと'+(need-r.wins)+'勝（累計'+need+'勝）';return '';}
function characterStoryActionReason(st){return battleEntryReason(st)||(!isSafe()?'街の安全地帯で話しましょう。':streamPending()?'配信待ちのイベントを先に終えてください。':'');}
function characterEpisodeLines(st,cid,episode){const [title,lines]=CHARACTER_EPISODES[cid][episode-1],names={'{p}':charName(st,'hero'),'{h}':charName(st,'moe'),'{n}':charName(st,cid)};return [['','― '+charName(st,cid)+'・'+title+' ―'],['','九州の旅で育んだ絆の記録。いまの居場所を移す場面ではありません。'],...lines.map(([who,text])=>[names[who]||who,characterText(st,text)]),...(episode===1?[['','固有必殺技「'+CHARACTER_ARCS[cid].ultimate+'」を習得。転職しても、この人物だけが使えます。']]:[])];}
function playCharacterEpisode(cid,episode){const st=G.st,reason=characterStoryActionReason(st)||characterStoryReason(st,cid,episode);if(reason){toast(reason);return false;}ensureCharacterStories(st);const rec=st.characterStories[cid];rec.seen=Math.max(rec.seen,episode);commit();G.sheet=null;say(characterEpisodeLines(st,cid,episode),()=>openSheet('characterStories',{cid}));return true;}
function relationshipReason(st){return characterStoryActionReason(st)||(st.quests.M10!=='complete'?'本編M10クリア後に気持ちを伝えられます。':'');}
function chooseRelationship(choice){const st=G.st;if(!['romance','partner'].includes(choice)||relationshipReason(st))return false;st.relationshipChoice=choice;commit();G.sheet=null;say(choice==='romance'?[[charName(st,'hero'),'夢を応援するだけじゃなく、一人の大切な人として、これからも隣にいたい。'],[charName(st,'moe'),'私も。あなたを支える側にもなりたい。ゆっくり、二人の時間を作っていこう。'],['','二人は、互いの夢を尊重しながら恋人として歩くことを選んだ。']]:[[charName(st,'hero'),'誰よりも大切な旅の相棒として、これからも一緒に景色を見たい。'],[charName(st,'moe'),'うん。言葉にしてくれてありがとう。私たちなりの約束を大切にしよう。'],['','二人は、互いの夢を尊重するかけがえのない相棒として歩くことを選んだ。']],()=>openSheet('characterStories',{cid:'moe'}));return true;}
function recordCharacterVictory(st,run,res){if(run.kind==='challenge'&&!res.challenge?.first)return;ensureCharacterStories(st);for(const a of run.party){if(!st.roster.includes(a.cid)||battleTrainingLevel(run)<Math.max(1,(a.L||run.L)-20))continue;const r=st.characterStories[a.cid],before=r.wins;r.wins++;for(const goal of [3,8,15])if(before<goal&&r.wins>=goal)res.notes.push(a.name+'：同行勝利'+goal+'回。ファミリー施設の「仲間の物語」で続きを確認できます。');}}
for(const [cid,a]of Object.entries(CHARACTER_ARCS)){const id=ultimateId(cid);EXTRA_SKILLS[id]={id,character:cid,ultimate:true,name:'必殺・'+a.ultimate,need:a.need,cost:8,cooldown:0,level:1,desc:a.desc+' 3ターン目以降・1人1戦1回・最大MPの25％（最低8）とエール35を消費。'};}
function characterProfileHtml(st,cid){const a=CHARACTER_ARCS[cid],r=characterRecord(st,cid);return `<section class="setcard"><h3 class="label">固有特性「${esc(a.trait)}」</h3><p>${esc(a.effect)}</p><p><b>固有必殺技：${esc(a.ultimate)}</b><br>${esc(a.desc)}</p><p class="small">最大MPの25％（最低8）＋エール35／3ターン目以降／1人1戦1回。${r.seen?'習得済み・転職しても使用可能':'絆エピソード第1話で習得'}</p><p class="small">${esc(characterText(st,a.background))}</p><button class="btn" data-a="characterStoryOpen" data-c="${cid}">背景・関係性・絆の物語（${r.seen}/4話）</button></section>`;}
function renderCharacterStories(){const st=G.st,cid=st.roster.includes(G.sheetData.cid)?G.sheetData.cid:st.roster[0],a=CHARACTER_ARCS[cid],r=characterRecord(st,cid),locked=characterStoryActionReason(st),relation=relationshipReason(st);return `<p>仲間一人ひとりの物語。固有特性は加入時から、必殺技は第1話で解放。恋愛と相棒の選択による戦闘能力の差はありません。</p><div class="opts">${st.roster.map(c=>`<button class="btn ${c===cid?'on':''}" data-a="characterStoryOpen" data-c="${c}">${esc(charName(st,c))} ${characterRecord(st,c).seen}/4</button>`).join('')}</div><h3 class="label">${esc(charName(st,cid))}の背景</h3><p>${esc(characterText(st,a.background))}</p><dl class="kv"><dt>${cid==='hero'?'自身の課題':'主人公との関係'}</dt><dd>${esc(characterText(st,a.hero))}</dd><dt>${cid==='moe'?'自身の願い':'ヒロインとの関係'}</dt><dd>${esc(characterText(st,a.heroine))}</dd><dt>固有特性</dt><dd>${esc(a.trait)}：${esc(a.effect)}</dd><dt>必殺技</dt><dd>${esc(a.ultimate)}：${esc(a.desc)}</dd><dt>同行勝利</dt><dd>${r.wins}回／物語 ${r.seen}/4話${r.seen===4?'／称号「'+esc(a.title)+'」':''}</dd></dl><p class="small">通常戦・地域ボスへの勝利と、特別チャレンジの初回課題達成で加算。戦闘の適正Lvが本人Lv−20以上の時のみ。控え・敗北・撤退・報酬なしの練習は加算されません。第2話3勝／第3話8勝／第4話15勝＋各話の本編条件。続きは安全地帯で読めます。</p>${locked?'<p class="warn">'+esc(locked)+'</p>':''}<div class="stack">${CHARACTER_EPISODES[cid].map(([title],i)=>{const reason=characterStoryReason(st,cid,i+1);return `<section class="setcard"><b>第${i+1}話 ${esc(title)}</b><p class="small">${i<r.seen?'✓ 読了':esc(reason||'読むことができます')}</p><button class="btn primary" data-a="characterEpisode" data-c="${cid}" data-v="${i+1}" ${reason||locked?'disabled':''}>${i<r.seen?'読み返す':'この話を読む'}</button></section>`;}).join('')}</div><section class="setcard"><h3 class="label">主人公とヒロインの約束</h3><p>${st.relationshipChoice==='romance'?'恋人として、互いの夢を尊重する約束を交わしています。':st.relationshipChoice==='partner'?'かけがえのない旅の相棒として歩いています。':'旅の中で、少しずつ気持ちを確かめ合っています。'}</p><p class="small">${esc(relation||'物語の節目とエンディングの会話に反映します。選び直すこともできます。')}</p><div class="stack"><button class="btn" data-a="relationshipChoose" data-v="romance" ${relation?'disabled':''}>恋人として隣にいたいと伝える</button><button class="btn" data-a="relationshipChoose" data-v="partner" ${relation?'disabled':''}>大切な相棒として歩きたいと伝える</button></div></section>`;}
function planCharacterUltimate(run,a,sk,p,h){if(sk.character!==a.cid){p.ok=false;p.reason='この人物専用の必殺技です。';return;}if(a.ultimateUsed){p.ok=false;p.reason='必殺技は1人につき1戦1回です。';return;}if(run.turn<3){p.ok=false;p.reason='必殺技は3ターン目から使えます。';return;}if(run.A<35){p.ok=false;p.reason='必殺技にはエール35が必要です。';return;}if(!h.payC(ultimateMp(a)))return;p.cost.a=35;const {L,V}=h;
 const hit=(n,pierce=false)=>{if(h.attackSingle(n,{ignoreDef:pierce}))return true;p.ok=false;p.reason='対象の敵を選んでください。';return false;};
 const groupHit=(power)=>{for(const e of h.en){const raw=Math.max(1,Math.floor(a.str*power+V*(a.wAtk+a.accAtk+20+L*.7))-effectiveEnemyDefense(a,e));p.dmg.push({slot:e.slot,raw,amt:Math.min(raw,e.hp)});}p.valid=true;p.all=true;};
 const recover=(percent,ward=0)=>{for(const t of h.al){h.heal(t,Math.ceil(t.maxHP*percent));if(ward)h.addWard(t,ward);}};
 switch(a.cid){case 'hero':recover(.18,2);if(run.B!==4)p.valid=true;p.setB=4;break;
 case 'moe':groupHit(1.8);for(const t of h.al)if(t!==a)h.addWard(t,1);break;
 case 'kohei':if(!hit(20+Math.floor(L*.45)))return;h.al.forEach(t=>h.addWard(t,3));break;
 case 'mio':recover(.3);for(const t of run.party.filter(t=>t.hp<=0)){p.heal.push({pos:t.pos,amt:Math.max(1,Math.ceil(t.maxHP*.25)),revive:true});p.valid=true;}break;
 case 'kayo':recover(.1);h.al.forEach(t=>h.addC(t,Math.max(1,Math.ceil(t.maxC*.15))));break;
 case 'tsumugi':groupHit(.85);p.setB=4;break;
 case 'makoto':recover(.2,6);break;
 case 'gaku':p.cost.hp=Math.max(1,Math.ceil(a.maxHP*.1));if(a.hp<=p.cost.hp){p.ok=false;p.reason='最大HPの10％を払った後、HP1以上が必要です。';return;}if(!hit(45+Math.floor(L*.8),true))return;break;
 case 'naoki':if(!hit(28+Math.floor(L*.65),true))return;h.al.filter(t=>t!==a).forEach(t=>h.addWard(t,2));break;
 default:p.ok=false;p.reason='必殺技が見つかりません。';return;}
 p.aGain=0;if(!p.valid){p.ok=false;p.reason='今は必殺技の効果がありません。';return;}p.ultimate=a.cid;}
function mainEmotionLines(st,id){if(!st)return [];const p=charName(st,'hero'),h=charName(st,'moe'),romance=st.relationshipChoice==='romance',partner=st.relationshipChoice==='partner';
 if(id===QUESTS.M02.scene)return [['','配信の後の港で、二人は同じ歩幅になっていることに気づいた。'],[h,'今度は配信のためじゃなく、あなたの好きな景色を見たいな。'],[p,'じゃあ少しだけ、遠回りして帰ろう。']];
 if(id===QUESTS.M08.scene)return [[h,'明るく話せない日まで、旅に連れてきてよかったのかな。'],[p,'置いていかなくていいよ。元気な日だけのあなたと旅をしたいわけじゃない。'],['','言葉の代わりに、小さく肩が触れた。離れるまでの時間を、どちらも急がなかった。']];
 if(id===QUESTS.M12.scene)return [[h,'好きな人を応援するって、自分の寂しさを隠すことだと思ってた。'],[p,'会いたい日は、会いたいと言おう。二人で決められるように。'],['','締めの時計を止めた控室で、二人は初めて、旅が終わった後の朝を話した。']];
 if(id===QUESTS.M16.scene)return [['','誰かの勝利を支える手も、拍手の後には少し震えていた。'],[h,romance?'S6になれた私だけじゃなく、その先の私も、あなたと生きていきたい。好きです。':partner?'一番近くで歩いてくれた相棒へ。これからは、あなたの夢にも私を連れていって。':'夢が叶った後も、あなたに最初のおはようを言いたい。この気持ちを、いつかちゃんと言葉にするね。'],[p,romance?'私も好きです。嬉しい日も、怖い日も、二人で話して決めていこう。':'うん。次の一歩は、二人とも行きたい場所へ。'],['','指先を'+(romance?'そっと重ねた。':'軽く合わせた。')+'灯台の光が遠ざかっても、すぐ隣のぬくもりは消えなかった。']];
 if(id===QUESTS.C04.scene)return [[h,'旅が続くと、当たり前になることが増えるね。だから今日は、手紙を書いてみた。'],['','「今日も隣にいてくれてありがとう」。二枚の手紙は、よく似た一行から始まっていた。']];
 if(id==='OMUTA_END')return [['','大牟田の配信を終え、九州で始まった旅のアルバムに新しい一枚を加えた。'],[h,st.nationalClear?'東京ドームの後にも、こうして会いに来られる街がある。成功の先の日々も、大切にしたいね。':'本編の次の街へ向かう時も、寄り道へ戻る時も、今日聞いた声を忘れないよ。'],[p,'うん。次の行き先は、二人で今の予定を確かめて決めよう。']];
 if(id===QUESTS.C09.scene){const lines=[['','旅のアルバムには、勝った日の写真だけでなく、黙って寄り添った夜も残った。'],[h,romance?'次の街でも、恋人として、夢を持つ仲間として、一緒に歩こう。':'次の街でも、一緒に朝ごはんを食べてから出発しよう。'],[p,'うん。帰る場所も、これから向かう場所も、みんなで増やしていこう。']];for(const c of st.roster)if(characterRecord(st,c).seen===4)lines.push(['',charName(st,c)+'：'+CHARACTER_ARCS[c].epilogue]);return lines;}return [];}

function recommendedAreaLevel(ar){return ar.regionalLevel||ar.chapterLevel|| (ar.specialStage!=null?SPECIAL_STAGES[ar.specialStage].level:areaRecommendedLevel(ar.q));}
function requiredAreaLevel(ar){return ar.regionalLevel?Math.max(1,ar.regionalLevel-12):ar.chapterLevel?Math.max(1,ar.chapterLevel-12):ar.specialStage!=null?Math.max(100,SPECIAL_STAGES[ar.specialStage].level-40):areaRequiredLevel(ar.q);}
function specialReason(st,s){if(!s)return '特設エリアが見つかりません。';if(st.quests.M16!=='complete')return '本編M16クリア後に解放されます。';if(s.level>progressionCap(st))return '次の地域編による上限Lv'+s.level+'以上の解放が必要です。';if(partyLevel(st)<Math.max(100,s.level-40))return 'パーティLv'+Math.max(100,s.level-40)+'以上で解放されます。';if(s.index&&!st.bossDefeated[SPECIAL_STAGES[s.index-1].boss])return '前の特設エリアのボスを撃破してください。';return '';}
function enterSpecial(id){const st=G.st,s=SPECIAL_STAGES.find(s=>s.id===id);if(battleEntryReason(st)||streamPending()||!isSafe()||G.sheet!=='specialWorld'||specialReason(st,s))return false;st.specialReturn={map:st.mapId,x:st.pos.x,y:st.pos.y};travelMap(s.id,3,15);return true;}
function specialXP(s){return Math.max(1000,Math.ceil((xpFor(Math.min(999,s.level+1))-xpFor(s.level===999?998:s.level))*0.65));}
function specialBossReward(st,run,res){const b=BOSSES[run.bossId];if(b?.specialStage==null||run.kind!=='boss')return;const s=SPECIAL_STAGES[b.specialStage];st.specialRewards=st.specialRewards||{};if(!st.specialRewards[s.id]){if(giveGear(st,s.reward,res,'特設ボス初回報酬'))st.specialRewards[s.id]=true;else res.notes.push('特設ボス報酬は保管場所が満杯です。空きを作り、同じ守護者を再撃破すると受け取れます。');}}
function renderSpecialWorld(){const st=G.st;return `${specialReminder(st)}<button class="btn" data-a="openSheet" data-k="specialTracker">特別エリア・クリア状況</button><p>本編M16クリア後の特設エリア。通常敵500種・ボス10体・特設チャレンジ10件。現在の上限は${progressionCap(st)}。次の地域編の実装・解放で100ずつ増え、最終999です。</p><div class="stack">${[...SPECIAL_STAGES].sort((a,b)=>Number(b.id===G.sheetData.specialFocus)-Number(a.id===G.sheetData.specialFocus)).map(s=>`<section class="setcard ${!specialReason(st,s)&&!st.bossDefeated[s.boss]?'special-pending':''}"><b>${esc(s.name)}</b><p class="special-state ${st.bossDefeated[s.boss]?'good':!specialReason(st,s)?'warn':'dim'}">${st.bossDefeated[s.boss]?'✓ エリアクリア':!specialReason(st,s)?'★ 解放済み・未クリア':st.specialUnlocked?.[s.id]||st.visitedMaps.includes(s.id)?'解放済み・準備待ち':'未解放'}</p><p>適正Lv${s.level}／通常敵50種／守護者${st.bossDefeated[s.boss]?'撃破済み':'未撃破'}</p><p>${esc(specialReason(st,s)||'挑戦できます。帰還口から出発した施設へ戻れます。')}</p><button class="btn" data-a="specialEnter" data-v="${s.id}" ${specialReason(st,s)?'disabled':''}>エリアへ移動</button></section>`).join('')}</div>`;}
function renderSpecialBoss(){const st=G.st,s=SPECIAL_STAGES.find(s=>s.boss===G.sheetData.bid);if(!s)return '<p>対象外です。</p>';return `<p>${esc(BOSSES[s.boss].name)}／適正Lv${s.level}</p><p>オート使用可。予告を見てボス対処・回復・MP補給を使い分けます。</p><p>初回報酬：${esc(EQUIP[s.reward].name)}。再挑戦でも経験値・熟練度を獲得します。</p><button class="btn primary" data-a="specialBossGo" data-v="${s.boss}">挑戦する</button>`;}

/* レベルごとの必要量を段階的に増加。到達済みのレベルは移行時に保持する。 */
const previousXpFor=L=>legacyXpFor(L)+Math.floor(0.12*Math.max(0,L-20)**3);
const previousJpFor=R=>2*R*(R+1)-4;
function progressionTable(previous,startPercent,stepPercent,capPercent){
 const table=[0,0];for(let n=1;n<999;n++){const percent=Math.min(capPercent,startPercent+stepPercent*(n-1));table[n+1]=table[n]+Math.ceil((previous(n+1)-previous(n))*percent/100);}return Object.freeze(table);
}
const XP_THRESHOLDS=progressionTable(previousXpFor,180,3,300);
const JP_THRESHOLDS=progressionTable(previousJpFor,200,4,400);
const xpFor=L=>XP_THRESHOLDS[Math.max(1,Math.min(999,Math.trunc(L)))];
const jpFor=R=>JP_THRESHOLDS[Math.max(1,Math.min(999,Math.trunc(R)))];
const XP_CAP=xpFor(999),JP_CAP=jpFor(999);
function levelOf(xp){ let lo=1,hi=999; while(lo<hi){const m=(lo+hi+1)>>1; if(xpFor(m)<=xp) lo=m; else hi=m-1;} return lo; }
function rankOf(jp){ let lo=1,hi=999; while(lo<hi){const m=(lo+hi+1)>>1; if(jpFor(m)<=jp) lo=m; else hi=m-1;} return lo; }
const Vof = L => 1+Math.floor((L-1)/20);
const MASTERY_STEPS=[3,6,10,20,40,60,100,200,400,700,999];
const Kof = R => MASTERY_STEPS.filter(n=>R>=n).length;
const masteryPercent=R=>Math.floor(50*(R-1)/(R+49));
const clone = o => JSON.parse(JSON.stringify(o));
const HEROINE_DEFAULT = {name:"もえ", gender:"女性"};
function heroineOf(st){ const h=(st&&st.profile&&st.profile.heroine)||HEROINE_DEFAULT; return {name:h.name||HEROINE_DEFAULT.name, gender:h.gender||"女性"}; }
function heroineShort(st){ const n=heroineOf(st).name; return n===HEROINE_DEFAULT.name?"もえ":n; }
function heroineCustom(st){ const h=heroineOf(st); return h.name!==HEROINE_DEFAULT.name || h.gender!=="女性"; }
const charName = (st,cid) => (st.names&&st.names[cid]) || (cid==="hero" ? st.profile.name : cid==="moe" ? heroineShort(st) : CHARS[cid].name);
function setCharacterName(st,cid,raw){
 if(!st||!st.roster.includes(cid))return {ok:false,reason:"仲間が見つかりません。"};
 if(st.run||st.stream)return {ok:false,reason:"戦闘・配信中は名前を変更できません。"};
 const v=validateName(raw);if(!v.ok)return {ok:false,reason:v.errors[0]};
 if(st.roster.some(c=>c!==cid&&charName(st,c)===v.value))return {ok:false,reason:"ほかの仲間と同じ名前は使えません。"};
 st.names=st.names||{};
 if(cid==='hero'){st.profile.name=v.value;delete st.names[cid];}
 else if(cid==='moe'){st.profile.heroine={...heroineOf(st),name:v.value};delete st.names[cid];}
 else st.names[cid]=v.value;
 return {ok:true};
}
function companionText(text,st){
 if(!st||typeof text!=='string')return text;
 const pairs=Object.entries(st.names||{}).filter(([c,n])=>CHARS[c]&&c!=='hero'&&c!=='moe'&&n!==CHARS[c].name);
 if(!pairs.length)return text;
 const keep=[];let t=text;const token=w=>{keep.push(w);return '\u0003'+(keep.length-1)+'\u0004';};
 const protectedNames=[...st.roster.map(c=>charName(st,c))].sort((a,b)=>b.length-a.length);
 for(const n of new Set(protectedNames))t=t.split(n).join(token(n));
 const replacements=pairs.flatMap(([c,n])=>[[CHARS[c].full,n],[CHARS[c].name,n]]).sort((a,b)=>b[0].length-a[0].length);
 for(const [old,n]of replacements)t=t.split(old).join(token(n));
 return t.replace(/\u0003(\d+)\u0004/g,(m,i)=>keep[+i]);
}
function openPendingName(){const st=G.st;if(!st||G.readOnly||st.run||st.stream||G.dlg)return;const cid=(st.pendingNames||[]).find(c=>st.roster.includes(c));if(cid)openSheet('rename',{cid,joining:true});}
function finishRename(){
 if(!G.st||G.readOnly)return;const d=G.sheetData||{};
 G.st.pendingNames=(G.st.pendingNames||[]).filter(c=>c!==d.cid);commit();backSheet(d.back||null);if(!G.sheet)openPendingName();
}
function renderRename(){const st=G.st,d=G.sheetData,cid=d.cid;if(!st.roster.includes(cid))return '<p>仲間が見つかりません。</p>';
 return `<p>${d.joining?'新しい仲間が加入しました。名前を変更できます。':'名前は何度でも変更できます。'}</p><p>現在の名前：<b>${esc(charName(st,cid))}</b></p><label for="renameInput">新しい名前（全角${NAME_MAX}文字以内）</label><input class="input" id="renameInput" value="${esc(typeof d.nameDraft==='string'?d.nameDraft:charName(st,cid))}" autocomplete="off" enterkeyhint="done"><p class="small">ひらがな・カタカナ・漢字・全角英数字。空白・記号は使用できません。名前を変えても装備や物語の進行は引き継ぎます。</p><div class="stack"><button class="btn primary" data-a="renameSave">この名前にする</button>${cid!=='hero'&&cid!=='moe'?`<button class="btn" data-a="renameDefault">元の名前「${esc(CHARS[cid].name)}」に戻す</button>`:''}<button class="btn" data-a="closeSheet">${d.joining?'今の名前で進む':'変更せず戻る'}</button></div>`;
}

/* ---- 新規開始（第06D・16節） ---- */
function newGame(name, gender, heroine, career){
  const st = {
    schemaVersion:SCHEMA_VERSION, saveEpoch:SAVE_EPOCH, gameVersion:GAME_VERSION, saveGeneration:0, partyRulesVersion:2, xpCurveVersion:3, jpCurveVersion:2,
    profile:{name, gender, career:career||"社会福祉士", heroine:{name:(heroine&&heroine.name)||HEROINE_DEFAULT.name, gender:(heroine&&heroine.gender)||"女性"}}, day:1, jobEvents:{},jobEvent:null, mapId:"KY01", pos:{x:19,y:19}, dir:0,
    visitedMaps:["KY01"], visitedHubs:["KY01"], xp:0,
    names:{},pendingNames:[],roster:["hero","moe"], party:["hero","moe"], vitals:null,
    jobs:{}, jp:{}, equip:{}, owned:{CW01:8, CA01:8}, favorite:{},
    challenges:{},festivals:{},townBattles:{},gold:0, tickets:200, gifts:{W:{},A:{}},
    bag:INITIAL_ITEMS.map(([id,n])=>({id,n})), keep:[], itemsVersion:1,
    quests:{M01:"available", M02:"locked", S01:"locked", S02:"locked"}, qprog:{}, activeQuest:null,
    talked:{}, boxes:{}, cards:[], bossDefeated:{}, seen:{}, killCount:{},
    moeRank:0, run:null, runSeq:0, stream:null, lastResult:null, streamBest:{},
    support:null, scenes:{}, fukuokaClear:false,
    settings:{difficulty:"std", sound:true, soundV:2, reduceMotion:false, follow:false}
  };
  for(const c of CHAR_ORDER){
    st.jobs[c]=CHARS[c].initJob; st.jp[c]={};
    st.equip[c]={w:null,a:null,acc:null};
  }
  for(const c of st.roster){ st.equip[c].w="CW01"; st.equip[c].a="CA01"; }
  // 主人公は職歴に合わせた初期装備（非売品・各1個）を装備して始める
  const cg=CAREER_GEAR_ID[st.profile.career]; if(cg){ st.owned[cg[0]]=1; st.owned[cg[1]]=1; st.equip.hero.w=cg[0]; st.equip.hero.a=cg[1]; }
  ensureCharacterStories(st);
  ensureNarrative(st);
  fixQuestChain(st);
  ensureWorld(st);syncCollection(st);
  return st;
}

/* v7.25: the 22 job events unlock party-wide transfers at a physical facility. */
const JOB_EVENT_DATA={
 J01:['夜の機材便','配信会場へ大切な機材を届ける。',[
 ['壊れやすいマイクを運ぶ準備は？',['荷物を固定して送り先を確認','荷台へばらばらに積む','早さだけを優先'],0,'安全な運搬と確かな届け先が、ステージを支えます。'],
 ['道路の通行止めを知ったら？',['そのまま進む','安全な別ルートと到着予定を相談','連絡せず帰る'],1,'変更は会場へ伝え、無理のない道を選びましょう。'],
 ['疲れて集中できない時は？',['急いで走り切る','応援の数で決める','安全な場所で休み、到着予定を連絡'],2,'休む判断も輸送担当の大切な仕事です。']]],
 J02:['消えない「おかえり」','初見コメントが流れてしまう受付画面を整える。',[
 ['画面を直す前にすることは？',['記録を全部消す','困っている場面と手順を確かめる','見た目だけ変える'],1,'何が起きたかを確かめてから直します。'],
 ['同じ受付が連続して届いたら？',['押された回数だけ登録','先の記録を勝手に上書き','重複を確かめて一度だけ登録'],2,'連打があっても記録が二重にならないようにします。'],
 ['変更を公開する前は？',['控えを残し、保存と読み込みを確認','説明だけ読んで公開','前の記録を捨てる'],0,'使う人の記録を守りながら確認しましょう。']]],
 J03:['私が選ぶ一枚','本人の気持ちを大切にする撮影会を準備する。',[
 ['撮影するポーズは誰が決める？',['主催だけで決定','本人の希望と合意を確かめる','人気の数字だけで決定'],1,'本人が納得して表現を選べることが大切です。'],
 ['写真を公開する前は？',['すぐに全写真を公開','他の人に任せきる','本人と公開範囲・選ぶ写真を確認'],2,'撮影への合意と公開への合意は別に確かめます。'],
 ['予定より疲れが出たら？',['休憩を取り、進行を相談','予定を無理に全部実行','疲れを隠すよう頼む'],0,'安心できる現場が、次の表現につながります。']]],
 J04:['その人に合う補給','冒険と配信を支える道具相談の受付をする。',[
 ['仲間のMPが足りない時、まず何を聞く？',['一番高い品をすすめる','見た目の好みだけ','必要な回復と予算を聞く'],2,'欲しい効果と使えるお金を確かめましょう。'],
 ['品の説明を求められたら？',['効果と使えない場面も説明','良い点だけを強調','説明を省く'],0,'選ぶ人が分かるように、条件も伝えます。'],
 ['予算に合わない時は？',['購入を急がせる','合う品や別の準備方法を相談','質問を断る'],1,'無理なく準備できる提案を考えます。']]],
 J05:['拍手の会計リレー','交流会の販売台で正確な会計をつなぐ。',[
 ['会計を始める時は？',['品数と値段を一緒に確認','印象だけで合計','後ろの列だけを見る'],0,'早さより先に、何を何個買うかを確認します。'],
 ['お釣りが違うと言われたら？',['相手を責める','記録と受取額を落ち着いて確認','列を理由に無視'],1,'一つずつ照合して、食い違いを解決します。'],
 ['混雑中の連携は？',['担当を決めず全員同時に作業','個人情報を大声で復唱','会計と袋詰めの担当を分ける'],2,'役割を分けると、確認を落とさず進められます。']]],
 J06:['引き際の勝負札','作中の勝負ゲームで、使える資源と危険を見きわめる。',[
 ['勝負前に決めることは？',['負けた分を必ず取り戻す','失ってもよい上限を決める','仲間の資金も使い切る'],1,'使う上限を先に決め、生活や仲間の資源を守ります。'],
 ['続けて負けたら次は必ず勝てる？',['連敗したほど確実に勝つ','応援すれば確実','次の結果は保証されない'],2,'過去の負けが、次の勝ちを保証することはありません。'],
 ['決めた上限に達したら？',['勝負を終えて別の作戦へ','上限を増やし続ける','仲間に追加を迫る'],0,'引く判断も、強い作戦の一つです。']]],
 J07:['小さな再出発','休息のあと、自分のペースで仲間を支える。',[
 ['一度に全部できない時は？',['できる小さな役割から相談','他人と比べて責める','休まず全部引き受ける'],0,'小さく始めても、仲間の役に立てます。'],
 ['休んでいる仲間への声かけは？',['働き方を勝手に決める','本人の気持ちとできることを聞く','参加しない人を責める'],1,'その人に合うペースを一緒に考えます。'],
 ['調子が戻ってきたら？',['急に全部引き受ける','休息をやめる','少しずつ役割を増やして振り返る'],2,'続けられるペースを確かめながら進みましょう。']]],
 J08:['初見さんの帰る場所','初めて来た人も話しやすい配信を作る。',[
 ['初見さんが無言で見ていたら？',['コメントを強制','すぐ退出を求める','気軽な挨拶をし、見るだけでも歓迎'],2,'参加の仕方を選べる、安心な入口を作ります。'],
 ['会話がすれ違った時は？',['相手の意図を確かめて話題を整理','勢いで言い返す','全部の人を同じ意見にする'],0,'決めつけず、一度聞き直しましょう。'],
 ['配信の終わりに伝えるのは？',['使った金額だけを比較','一緒に過ごした時間への感謝','次回の支援を強制'],1,'数字の向こうにいる一人へ感謝を届けます。']]],
 J09:['ステージを守る検品','配信イベントの記念グッズを確かめる。',[
 ['検品の基準は？',['担当の気分で変更','見本と確認項目をそろえる','見ないで合格'],1,'同じ基準を共有すると、抜けを防げます。'],
 ['不具合を見つけたら？',['隠して配る','数だけ合わせる','分けて記録し、担当へ知らせる'],2,'問題を隠さず、使う人へ届く前に止めます。'],
 ['最後の引継ぎは？',['確認済み数と注意点を記録','口頭で「だいたい大丈夫」','残りを混ぜる'],0,'次の担当が迷わない記録を残します。']]],
 J10:['一分間の街だより','街の交流会を短い動画にまとめる。',[
 ['撮影前にすることは？',['映る人と撮影範囲を確認','全員を無断撮影','他人の動画を借りて自作とする'],0,'映る人の希望を確かめて撮ります。'],
 ['短く編集する時は？',['都合よく発言を逆の意味にする','元の意味が伝わるよう整える','目立つ所だけ切り取る'],1,'短くしても、話した人の意図を変えません。'],
 ['公開前の確認は？',['再生しないで公開','字幕の数字だけ確認','字幕・音・許可・出典を見直す'],2,'見る人にも、映った人にも届く形を確認します。']]],
 J11:['広がる声の責任','街のよい品を紹介する投稿を作る。',[
 ['紹介を頼まれたら？',['使っていなくても絶対と断言','条件や依頼の関係を明らかにする','関係を隠す'],1,'どんな立場で紹介しているかを伝えます。'],
 ['情報の根拠が不明なら？',['人気なので広める','強い言葉へ書き換える','確かめるまで断定して広めない'],2,'広がる前に、情報を確かめましょう。'],
 ['公開後に誤りが分かったら？',['訂正した点が分かる形で直す','黙って他人のせいにする','反応を全部消す'],0,'誤りへの向き合い方も信頼につながります。']]],
 J12:['おかえりの食卓','遠征から戻る仲間の暮らしを整える。',[
 ['買物の前は？',['家にある品と必要数を確認','同じ品を大量に購入','予算を見ない'],0,'今ある物を知ると、無駄を減らせます。'],
 ['仕事が一人に集まったら？',['その人だけに任せる','できる役割を話し合って分ける','感謝だけで済ませる'],1,'段取りを共有して、負担を分けましょう。'],
 ['予定が崩れた日は？',['休憩を全部削る','失敗した人を責める','優先することを決め、休む時間も残す'],2,'完璧より、みんなが続けられる暮らしを考えます。']]],
 J13:['声を聞くケア受付','交流会で具合の悪い人を見つけた時の連携を学ぶ。',[
 ['つらそうな参加者に気づいたら？',['勝手に薬を渡す','撮影を続ける','本人へ声をかけ、会場の救護担当につなぐ'],2,'決めつけずに状態を聞き、必要な担当へつなぎます。'],
 ['健康の話を聞いたら？',['必要な担当だけへ丁寧に引き継ぐ','配信で話題にする','人の多い所で大声で伝える'],0,'本人のプライバシーを守りながら引き継ぎます。'],
 ['担当へ伝える記録は？',['推測を事実として書く','見聞きした事実と本人の言葉を分ける','時間を省く'],1,'事実と推測を区別し、伝わる記録を残します。']]],
 J14:['みんなの差し入れ台所','食べる人に合う差し入れを準備する。',[
 ['献立を決める前に？',['見た目だけで決める','食べられない物や希望を確認','前回と同じ物を無断で出す'],1,'アレルギーなどの確認を先に行います。'],
 ['調理の準備は？',['汚れた道具をそのまま使う','急ぐため確認を省く','手や道具を清潔にし、表示を確かめる'],2,'食べる人が安心できる準備をそろえます。'],
 ['配る時に大切なのは？',['中身を説明し、希望に合う量を渡す','全員に無理に食べてもらう','材料の質問を断る'],0,'選ぶ人へ必要な情報を伝えましょう。']]],
 J15:['灯りをつなぐ前に','配信会場の電源トラブルを安全に担当へ伝える。',[
 ['傷んだ配線を見つけたら？',['触らず使用を止め、資格のある担当へ連絡','自分の判断でつなぐ','布で隠す'],0,'安全を優先し、危険な作業を自己判断で行いません。'],
 ['会場の相談で先に伝えるのは？',['好きな色だけ','使う機器と場所、必要な確認事項','人気の順位だけ'],1,'担当が確認できるよう、必要な情報をそろえます。'],
 ['再開の判断は？',['点灯しただけで再開','予定時刻だから再開','担当の安全確認と会場の合意を待つ'],2,'見た目だけで安全と判断しません。']]],
 J16:['水音の向こうのステージ','水回りの不具合と配信の動線を整理する。',[
 ['水漏れに気づいたら？',['映らない場所へ隠す','来場者に放置を頼む','近づかない案内をし、施設担当へ連絡'],2,'人と機材を守り、担当へ状況を伝えます。'],
 ['通路を直す間は？',['安全な別の通り道を案内','混雑をそのままにする','閉鎖箇所へ誘導'],0,'困っている場所を避けて、流れをつなぎ直します。'],
 ['作業後の引継ぎは？',['直ったと思うので立ち去る','確認済み範囲と残る注意点を共有','注意札を全部外す'],1,'何を確認したかを次の担当へ残します。']]],
 J17:['みんなが見える舞台','人の集まるステージの安全な使い方を考える。',[
 ['会場配置で先に確かめるのは？',['装飾の数だけ','出入口と避難の通り道','最前列だけ'],1,'出入りする人の安全を先に考えます。'],
 ['構造が心配と言われたら？',['見た目で大丈夫と決める','応援で乗り切る','使用を止め、専門の担当へ確認'],2,'根拠なく安全と言い切りません。'],
 ['天候が悪化したら？',['安全基準に沿って中断や変更を相談','来場者を急がせる','予定だけを優先'],0,'無事に帰れることもイベントの成功です。']]],
 J18:['一人ずつの参加方法','来場に不安のある人の相談を受ける。',[
 ['困りごとを聞く時は？',['本人の希望と必要な支えを聞く','先に答えを決める','他人と同じ方法を強制'],0,'その人の言葉を起点に、一緒に考えます。'],
 ['ほかの担当につなぐ時は？',['すべてを無断で共有','本人に説明し、必要な範囲で共有','誰にも何も伝えない'],1,'同意と情報の範囲を確かめます。'],
 ['相談した後は？',['一度案内したら終わり','来られなかった人を責める','合う方法だったか確かめ、必要なら調整'],2,'支えは、一回決めて終わりではありません。']]],
 J19:['はじめての撮影係','街の交流会の思い出を写真へ残す。',[
 ['人を撮る前は？',['無言で近づく','断られても撮る','撮影してよいか声をかける'],2,'まず相手の希望を聞きましょう。'],
 ['明るさが合わない時は？',['試し撮りして設定と立ち位置を見直す','何も見ず連写','他人の写真を使う'],0,'小さく試して、結果から工夫します。'],
 ['撮った後は？',['全部を無断公開','選んだ写真と公開してよい範囲を確認','失敗を隠して他人を責める'],1,'残す写真も、本人と確認します。']]],
 J20:['迷わない街めぐり','初めて訪れたファミリーを街へ案内する。',[
 ['案内を始める前は？',['全員に同じ速さを強制','行き先と歩けるペースを確認','地図を見ない'],1,'行きたい場所と無理のない進み方を聞きます。'],
 ['地名の位置が不確かな時は？',['似た名前で決める','自信だけで案内','地図で県と街の位置を照合'],2,'名前だけでなく、位置関係も確かめます。'],
 ['途中で道が使えなくなったら？',['安全な別ルートと集合場所を共有','一人だけ先に行く','参加者を責める'],0,'変更した理由と、次の目印を伝えます。']]],
 J21:['約束を写す仕事','撮影を頼む人の意図を成果物へつなぐ。',[
 ['撮影の打合せでは？',['用途・納期・公開範囲を確認','機材の値段だけを話す','全部あとで決める'],0,'何のための写真かを共有して始めます。'],
 ['本番の撮影では？',['確認なしで条件を変える','光と構図を試し、希望に沿って調整','他の人の作品をそのまま使う'],1,'技術を、頼んだ人の目的に合わせます。'],
 ['納品する時は？',['未確認のまま全画像を送る','許可外の写真も公開','選定・保存・利用条件を確認して渡す'],2,'撮る前の約束を、渡す時まで大切にします。']]],
 J22:['推し色を押しつけない','初見も常連も一緒に楽しめる応援を考える。',[
 ['応援の参加を呼びかける時は？',['全員に同じ金額を要求','参加しない人を責める','見る・コメントするなど自由な方法を案内'],2,'応援の方法と参加するかどうかは、その人が選びます。'],
 ['初見さんが入りづらそうなら？',['内輪の言葉を説明して話題を渡す','常連だけで会話','知識の多さを競う'],0,'知らない人にも開かれた入口を作ります。'],
 ['推しが自分と違う選択をしたら？',['応援を理由に決定を迫る','本人の意思を尊重し、言葉を交わす','仲間に攻撃を頼む'],1,'応援は、相手の選ぶ力を支えるものです。']]]
};
FACILITY.helloWork={mark:'職',name:'ハローワーク',color:'#D5B34C'};
function ensureJobSystem(st){st.jobEvents=st.jobEvents||{};if(st.jobEvent===undefined)st.jobEvent=null;}
function jobUnlocked(st,j){return !!JOBS[j]&&st.jobEvents?.[j]===true;}
function atHelloWork(st=G.st){const m=st&&MAPS[st.mapId];return st===G.st&&G.screen==='explore'&&G.sheet==='helloWork'&&G.helloWorkMap===st.mapId&&!G.dlg&&!st.run&&!st.stream&&!st.careerSession&&!streamPending()&&isSafe()&&m?.kind==='out'&&m.objects.some(o=>o.type==='helloWork'&&Math.abs(o.x-st.pos.x)+Math.abs(o.y-st.pos.y)<=1);}
function openHelloWork(){G.helloWorkMap=G.st.mapId;openSheet('helloWork',{mode:'events',page:0,q:''});}
function jobEventStart(st,j){if(G.readOnly||!atHelloWork(st)||!JOB_EVENT_DATA[j]||jobUnlocked(st,j)||st.jobEvent)return false;ensureJobSystem(st);st.jobEvent={job:j,hub:curHub(),step:0,picks:[],wrong:null};return true;}
function jobEventPick(st,j,step,value){const x=st.jobEvent,q=JOB_EVENT_DATA[j]?.[2]?.[step];if(G.readOnly||!atHelloWork(st)||!x||x.job!==j||x.step!==step||!q||!Number.isInteger(value)||value<0||value>=q[1].length||jobUnlocked(st,j))return false;if(value!==q[2]){x.wrong=value;return true;}x.picks.push(value);x.step++;x.wrong=null;if(x.step===3){st.jobEvents[j]=true;st.jobEvent=null;}return true;}
function jobChangeReason(st,cid,j){if(!st.roster.includes(cid)||!JOBS[j])return '仲間と職業を確認してください。';if(G.readOnly)return 'このタブは閲覧のみです。';if(!atHelloWork(st))return '街のハローワークを訪ねてください。';if(st.jobs[cid]===j)return '現在の職業です。';if(!jobUnlocked(st,j))return '職業イベント「'+JOB_EVENT_DATA[j][0]+'」のクリアが必要です。';return '';}
function validateJobSystem(st){const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);if(st.jobEvents!==undefined&&(!obj(st.jobEvents)||Object.entries(st.jobEvents).some(([j,v])=>!JOB_EVENT_DATA[j]||v!==true)))throw Error('bad job events');const x=st.jobEvent;if(x==null)return;const data=JOB_EVENT_DATA[x.job];if(!obj(x)||!data||!HUBS[x.hub]||!Number.isInteger(x.step)||x.step<0||x.step>=3||!Array.isArray(x.picks)||x.picks.length!==x.step||x.picks.some((v,i)=>v!==data[2][i][2])||x.wrong!==null&&(!Number.isInteger(x.wrong)||x.wrong<0||x.wrong>=3||x.wrong===data[2][x.step][2])||jobUnlocked(st,x.job))throw Error('bad job event session');}
function helloWorkResults(st,data={}){const q=guideSearchText(data.q||'').slice(0,60),words=q.split(' ').filter(Boolean),mode=data.mode==='change'?'change':'events',list=JOB_IDS.filter(j=>words.every(w=>guideSearchText(JOBS[j].name+' '+JOBS[j].field+' '+JOB_EVENT_DATA[j][0]).includes(w))),pages=Math.max(1,Math.ceil(list.length/6)),page=Math.max(0,Math.min(pages-1,Math.trunc(Number(data.page)||0)));return {mode,list,pages,page,visible:list.slice(page*6,page*6+6)};}
function renderHelloWork(){const st=G.st,d=G.sheetData||{},r=helloWorkResults(st,d),cid=st.roster.includes(d.cid)?d.cid:st.party[0],active=atHelloWork(st),session=st.jobEvent;let h='<p>職業イベントをクリアすると、その職業へ転職できます。クリア記録は仲間全員で共通です。現在の職業はそのまま続けられます。転職自体は無料です。</p>'+(!active?'<p class="warn">街の「職」ハローワークへ近づいて調べてください。戦闘・配信・活動の準備中は利用できません。</p>':'')+'<div class="row2"><button class="btn '+(r.mode==='events'?'primary':'')+'" data-a="helloWorkMode" data-v="events">職業イベント</button><button class="btn '+(r.mode==='change'?'primary':'')+'" data-a="helloWorkMode" data-v="change">転職する</button></div>';
 if(session&&r.mode==='events'){const j=session.job,e=JOB_EVENT_DATA[j],q=e[2][session.step];h+='<section class="setcard"><h3>'+esc(JOBS[j].name)+'／'+esc(e[0])+'</h3><p>'+esc(e[1])+'</p><p>体験 '+(session.step+1)+'/3：'+esc(q[0])+'</p>'+(session.wrong!==null?'<p class="warn">もう一度考えよう。'+esc(q[3])+'</p>':'')+'<div class="stack">'+q[1].map((v,i)=>'<button class="btn" data-a="jobEventPick" data-j="'+j+'" data-s="'+session.step+'" data-v="'+i+'" '+(!active||G.readOnly?'disabled':'')+'>'+esc(v)+'</button>').join('')+'</div><p class="small">途中で閉じても進み具合を保存します。どの街のハローワークでも続けられます。取り消した体験は最初からです。</p><button class="btn" data-a="jobEventCancel" '+(!active||G.readOnly?'disabled':'')+'>この体験を取り消して選び直す</button></section>';return h;}
 if(session&&r.mode==='change')h+='<p class="small">職業体験は中断中です。「職業イベント」で続きに戻れます。</p>';
 if(r.mode==='change')h+='<h3 class="label">転職する仲間</h3><div class="row2">'+st.roster.map(c=>'<button class="btn '+(c===cid?'on':'')+'" data-a="helloWorkCharacter" data-v="'+c+'">'+esc(charName(st,c))+'／'+esc(JOBS[st.jobs[c]].name)+(c===cid?'（選択中）':'')+'</button>').join('')+'</div>';
 const focus=r.mode==='change'&&JOBS[d.job]?d.job:null;if(focus){const j=focus,s=charStats(st,cid,partyLevel(st)),next=charStats(st,cid,partyLevel(st),j,previewEquipFor(st,cid,j)),reason=jobChangeReason(st,cid,j);h+='<section class="setcard"><h3>'+esc(charName(st,cid))+' → '+esc(JOBS[j].name)+'</h3><p>'+esc(JOBS[j].field)+'／熟練度'+next.R+'</p>'+statDiffHtml(s,next,partyLevel(st))+'<p class="small">職業技・職業別熟練度・永続ボーナスを保持。前職の専用装備は外れます。超レア固有技は対応装備を着けている間のみ使えます。</p>'+(reason?'<p class="warn">'+esc(reason)+'</p>':'')+'<button class="btn primary" data-a="setJob" data-c="'+cid+'" data-v="'+j+'" '+(reason?'disabled':'')+'>この職業へ転職する（無料）</button></section>';}
 h+='<form id="helloWorkSearchForm" class="work-search"><input id="helloWorkSearch" type="search" maxlength="60" aria-label="職業やイベント名を検索" value="'+esc(d.q||'')+'" placeholder="職業・イベント名"><button class="btn" type="submit" data-a="helloWorkSearch">検索</button></form><p class="small">解放済み '+JOB_IDS.filter(j=>jobUnlocked(st,j)).length+'/22職／'+r.list.length+'件・'+(r.page+1)+'/'+r.pages+'ページ</p><div class="stack">';
 for(const j of r.visible){const e=JOB_EVENT_DATA[j],unlocked=jobUnlocked(st,j);h+='<section class="setcard"><h3>'+esc(JOBS[j].name)+' <span class="tag">'+(unlocked?'✓ 転職解放済み':'体験未クリア')+'</span></h3><p>'+esc(JOBS[j].field)+'</p><p>専用イベント「'+esc(e[0])+'」</p><p class="small">'+esc(e[1])+'</p>'+(r.mode==='change'?'<button class="btn" data-a="helloWorkJob" data-v="'+j+'">能力と転職条件を見る</button>':unlocked?'<p class="good">イベントクリア済み。「転職する」から仲間と職業を選べます。</p>':'<button class="btn" data-a="jobEventStart" data-v="'+j+'" '+(!active||G.readOnly?'disabled':'')+'>職業イベントを始める（無料・3段階）</button>')+'</section>';}
 return h+'</div>'+(!r.list.length?'<p>見つかりません。検索を短くするか、空欄で検索してください。</p>':'')+'<nav class="row2"><button class="btn" data-a="helloWorkPage" data-v="'+(r.page-1)+'" '+(!r.page?'disabled':'')+'>◀ 前</button><button class="btn" data-a="helloWorkPage" data-v="'+(r.page+1)+'" '+(r.page>=r.pages-1?'disabled':'')+'>次 ▶</button></nav>';} 

/* 街ごとの乱数はセーブへ保存し、再訪・再読込で配置を維持する。 */
const WORLD_BASE=Object.fromEntries(Object.entries(MAPS).map(([id,m])=>[id,JSON.parse(JSON.stringify(m))]));
let activeWorldSeed=null;
function worldRng(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function generateTown(id,seed){
  const base=WORLD_BASE[id],m=JSON.parse(JSON.stringify(base)),i=HUB_ORDER.indexOf(id),r=worldRng((seed^parseInt(checksum(id),16))>>>0);
  const ri=(a,b)=>a+Math.floor(r()*(b-a+1)),grid=Array.from({length:m.h},(_,y)=>Array.from({length:m.w},(_,x)=>x===0||y===0||x===m.w-1||y===m.h-1?'T':'.'));
  const put=(x,y,t)=>{if(x>0&&y>0&&x<m.w-1&&y<m.h-1)grid[y][x]=t;};
  const rect=(x,y,w,h,t)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,t);};
  const cx=ri(17,30),cy=ri(12,20),style=i%7;
  // 港・運河・城下・丘陵・島状・緑道・段丘で地形を分ける。
  if(style===0)rect(1,25,46,6,'~');
  if(style===1)rect(ri(12,19),1,3,30,'~');
  if(style===2){rect(7,6,34,2,'#');rect(7,6,2,17,'#');rect(39,6,2,17,'#');}
  if(style===3)for(let y=5;y<28;y+=7)rect(3,y,42,2,'T');
  if(style===4){rect(1,1,46,30,'~');rect(4,4,16,22,'.');rect(27,3,16,23,'.');rect(18,cy-2,12,5,'=');}
  if(style===5){rect(4,4,5,24,'T');rect(35,4,6,23,'T');rect(17,9,8,3,'~');}
  if(style===6)for(let y=6;y<29;y+=6)rect(5,y,38,1,'#');
  for(let b=0;b<18;b++){const x=ri(3,41),y=ri(3,26);rect(x,y,ri(2,4),ri(2,3),b%3?'T':'#');if(b%3===0)rect(x,y-1,3,1,'c');}
  rect(cx-3,cy-3,7,7,',');
  m.objects.push({id:"station_"+id,x:24,y:20,type:"station",label:m.name+(id.startsWith("NX")?"広域交通駅（連絡船など）":"駅（新幹線）")},{id:"helloWork_"+id,x:26,y:20,type:"helloWork",label:m.name+"・ハローワーク（職業イベント・転職）"});
  const pinned=m.objects.filter(o=>['door','gate','boss','tower'].includes(o.type));
  const used=new Set(pinned.map(o=>o.x+','+o.y));
  const anchors=[base.safeAnchor.slice(),[19,19]];
  for(const other of Object.values(WORLD_BASE))for(const o of other.objects)if(o.to===id&&Number.isFinite(o.tx)&&Number.isFinite(o.ty))anchors.push([o.tx,o.ty]);
  const safeKeys=new Set(anchors.map(a=>a.join(',')));
  for(const o of m.objects){if(pinned.includes(o))continue;let x,y;do{x=ri(4,43);y=ri(5,27);}while(used.has(x+','+y)||safeKeys.has(x+','+y)||Math.abs(x-cx)+Math.abs(y-cy)<2);o.x=x;o.y=y;used.add(x+','+y);rect(x-1,y-1,3,3,',');}
  const blockedCells=new Set(m.objects.filter(o=>!o.walk).map(o=>o.x+","+o.y));
  const blocked=(x,y)=>blockedCells.has(x+","+y);
  function route(tx,ty){ // 障害物を避ける道をBFSで掘る。水上は橋。
    const q=[[cx,cy]],prev=new Map([[cx+','+cy,null]]);let end=null;
    for(let k=0;k<q.length;k++){const [x,y]=q[k];if(x===tx&&y===ty){end=[x,y];break;}const ds=(i%2)?[[1,0],[0,1],[-1,0],[0,-1]]:[[0,1],[1,0],[0,-1],[-1,0]];
      for(const [dx,dy]of ds){const a=x+dx,b=y+dy,key=a+','+b;if(a<1||b<1||a>=m.w-1||b>=m.h-1||prev.has(key)||blocked(a,b))continue;prev.set(key,[x,y]);q.push([a,b]);}}
    while(end){const[x,y]=end;if(!'123'.includes(grid[y][x]))put(x,y,grid[y][x]==='~'?'=':',');end=prev.get(x+','+y);}
  }
  for(const a of anchors){if(!blocked(...a))route(...a);}
  for(const o of m.objects){if(o.walk){route(o.x,o.y);continue;}const adj=[[o.x,o.y+1],[o.x+1,o.y],[o.x-1,o.y],[o.x,o.y-1]].find(([x,y])=>x>0&&y>0&&x<m.w-1&&y<m.h-1&&!blocked(x,y));if(adj)route(...adj);}
  // 安全な町中とは別に、A1～A3を毎回異なる輪郭で配置する。
  const centers=[];
  for(let z=1;z<=3;z++){let x,y;for(let t=0;t<200;t++){x=ri(4,43);y=ri(4,27);if(Math.abs(x-cx)+Math.abs(y-cy)>9&&centers.every(a=>Math.abs(x-a[0])+Math.abs(y-a[1])>9)&&!m.objects.some(o=>Math.abs(x-o.x)+Math.abs(y-o.y)<5))break;}
    centers.push([x,y]);route(x,y);for(let yy=y-3;yy<=y+3;yy++)for(let xx=x-4;xx<=x+4;xx++){if(xx<1||yy<1||xx>=m.w-1||yy>=m.h-1)continue;if(Math.abs(xx-x)+Math.abs(yy-y)>ri(4,6))continue;if(m.objects.some(o=>Math.max(Math.abs(xx-o.x),Math.abs(yy-o.y))<=2)||anchors.some(a=>Math.max(Math.abs(xx-a[0]),Math.abs(yy-a[1]))<=2)||Math.abs(xx-cx)+Math.abs(yy-cy)<6)continue;put(xx,yy,String(z));}
    // 各危険地帯に最低1マスを保証する。
    if(!grid.some(row=>row.includes(String(z)))){for(let yy=2;yy<m.h-2;yy++){let done=false;for(let xx=2;xx<m.w-2;xx++)if(grid[yy][xx]===','&&!blocked(xx,yy)&&!m.objects.some(o=>Math.max(Math.abs(xx-o.x),Math.abs(yy-o.y))<=2)&&!anchors.some(a=>Math.max(Math.abs(xx-a[0]),Math.abs(yy-a[1]))<=2)){put(xx,yy,String(z));done=true;break;}if(done)break;}}
  }
  // 看板は対応する危険地帯の境界に置き、施設・安全地点と重ねない。
  const signDirs=[[0,1],[1,0],[0,-1],[-1,0]];
  for(const o of m.objects.filter(o=>o.type==='sign'&&o.area)){
    const z=Object.keys(m.zones).find(z=>m.zones[z]===o.area),oldKey=o.x+','+o.y;
    const candidates=[];
    for(let y=2;y<m.h-2;y++)for(let x=2;x<m.w-2;x++)if(grid[y][x]===z)for(const[dx,dy]of signDirs){const a=x+dx,b=y+dy;if(a<2||b<2||a>=m.w-2||b>=m.h-2||!'.,'.includes(grid[b][a])||m.objects.some(v=>v!==o&&v.x===a&&v.y===b)||anchors.some(v=>v[0]===a&&v[1]===b))continue;const stand=signDirs.map(([xx,yy])=>[a+xx,b+yy]).find(([xx,yy])=>xx>0&&yy>0&&xx<m.w-1&&yy<m.h-1&&!(xx===x&&yy===y)&&!blocked(xx,yy));if(stand)candidates.push({x:a,y:b,stand,score:Math.abs(a-cx)+Math.abs(b-cy)});}
    candidates.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);let c=candidates[0];
    if(!c){ // 境界に空きがない場合は小さな専用エリアと安全な看板前を作る。
      for(let margin=3;margin>=1&&!c;margin--)for(let y=3;y<m.h-4&&!c;y++)for(let x=3;x<m.w-3&&!c;x++){
        if(m.objects.some(v=>v!==o&&Math.max(Math.abs(v.x-x),Math.abs(v.y-(y+1)))<=margin)||anchors.some(v=>Math.max(Math.abs(v[0]-x),Math.abs(v[1]-(y+1)))<=margin)||[0,1,2].some(d=>'123'.includes(grid[y+d][x])))continue;
        put(x,y,z);put(x,y+1,',');put(x,y+2,',');c={x,y:y+1,stand:[x,y+2]};
      }
    }
    if(!c)throw Error('看板を配置できません: '+id+' '+z);
    blockedCells.delete(oldKey);o.x=c.x;o.y=c.y;blockedCells.add(o.x+','+o.y);put(o.x,o.y,',');route(...c.stand);
    const ds=signDirs.find(([dx,dy])=>grid[o.y+dy]&&grid[o.y+dy][o.x+dx]===z);const direction=ds?(ds[0]===1?'東':ds[0]===-1?'西':ds[1]===1?'南':'北'):'';
    o.label='案内板（'+AREAS[o.area].name+'・'+direction+'側）';o.zoneDirection=direction;
  }
  // 看板の移設後に入口と全施設の経路を再接続する。
  for(const a of anchors)if(!blocked(...a))route(...a);
  for(const o of m.objects){if(o.walk){route(o.x,o.y);continue;}const adj=signDirs.map(([dx,dy])=>[o.x+dx,o.y+dy]).find(([x,y])=>x>0&&y>0&&x<m.w-1&&y<m.h-1&&!blocked(x,y));if(adj)route(...adj);}
  const decor=[];for(let y=2;y<m.h-2;y++)for(let x=2;x<m.w-2;x++)if(grid[y][x]===','&&!m.objects.some(o=>Math.max(Math.abs(o.x-x),Math.abs(o.y-y))<=1))decor.push({x,y,key:r()});m.pocoDecor=decor.sort((a,b)=>a.key-b.key).slice(0,10);
  m.tiles=grid;m.layoutKey=seed+':'+id;m.safeAnchor=base.safeAnchor.slice();m.layoutStyle=style;return m;
}
/* Japan-inspired geographic overworld. Coast and transport are simplified game geometry. */
const WORLD_NODES={},WORLD_ROADS=[];
const WORLD_GEO={west:126,north:46.5,sx:34,sy:44,w:720,h:984,version:2};
const WORLD_TERRAIN={ '~':['海','#215970',false],G:['草原','#7b9b58',true],T:['森林','#3d6847',true],M:['山岳','#777d78',true],N:['雪山','#c7d8d4',true],R:['川・湖','#4f9fae',false],B:['橋','#c2ab79',true],P:['港','#778e9b',true],S:['砂浜','#dfc892',true],D:['砂漠（創作）','#d2ac63',true],W:['荒野','#a69b7b',true],F:['田んぼ','#6c9d73',true],U:['荒れ道','#9f8964',true],A:['舗装道路','#6f7c83',true],L:['新幹線線路','#a6b7bb',true],H:['高速道路','#46586b',true],V:['市街地','#9ca28d',true],C:['都市部','#7e91a1',true],E:['港を結ぶ航路（ゲーム内）','#367b91',true]};
const WORLD_COASTS=[
 ['北海道',[[139.75,41.4],[140.4,41.4],[140.8,42.2],[141.8,42.5],[143.2,42],[144.4,42.8],[145.8,43.35],[145.1,43.8],[145.35,44.35],[144.1,44.05],[142,45.5],[141.6,45.4],[141.6,44.4],[141.15,43.7],[140.35,43.35],[140.1,42.6],[139.8,42.2]]],
 ['本州',[[130.85,34.1],[131.3,34.55],[132.1,34.85],[132.8,35.45],[133.45,35.65],[134.4,35.65],[135.15,35.8],[135.9,35.55],[136.1,36.2],[136.7,37.2],[137.3,37.5],[137.05,36.85],[137.7,36.8],[138.3,37.4],[139.45,38.3],[140,39.4],[139.9,40.3],[140.4,41.25],[140.8,41.2],[141.2,41.5],[141.5,41.35],[141.4,40.8],[141.85,40.35],[142.05,39.6],[141.55,38.95],[141.55,38.3],[141,37.8],[140.85,36.9],[140.7,36.2],[140.9,35.75],[140.4,35.15],[139.85,34.9],[139.75,35.4],[139.15,35.15],[138.85,34.6],[138.5,34.65],[138.2,34.9],[137.6,34.6],[136.9,34.65],[136.8,34.3],[136,33.45],[135.5,33.45],[135.05,33.9],[135.05,34.25],[135.4,34.65],[134.6,34.75],[134.15,34.5],[133.5,34.3],[132.55,34.15],[132.1,33.85],[131.45,33.95]]],
 ['四国',[[132.05,33.35],[132.6,33],[132.75,32.75],[133.2,33.2],[133.9,33.3],[134.3,33.2],[134.8,33.85],[134.6,34.25],[134.1,34.4],[133.5,34.25],[133,34.1],[132.7,33.8]]],
 ['九州',[[129.55,33.35],[129.85,33.6],[130.25,33.8],[130.65,33.95],[131.05,33.95],[131.65,33.7],[131.85,33.45],[131.55,33],[131.95,32.8],[131.6,31.7],[131.3,31.35],[131.05,31],[130.7,31],[130.7,31.55],[130.5,31.6],[130.45,31.15],[130.1,31.2],[130.15,31.8],[130.4,32.4],[130.15,32.7],[129.65,32.55],[129.6,32.85],[129.75,33.1]]],
 ['沖縄',[[127.62,26.04],[127.8,26.2],[127.84,26.45],[128.1,26.65],[128.27,26.86],[128.31,26.88],[128.05,26.85],[127.92,26.65],[127.72,26.43],[127.64,26.2]]],
 ['奄美',[[129.15,28],[129.7,28.15],[129.75,28.5],[129.4,28.55]]],
 ['屋久島',[[130.35,30.2],[130.7,30.2],[130.7,30.5],[130.35,30.5]]],
 ['種子島',[[130.85,30.3],[131.05,30.4],[131.1,30.85],[130.95,30.85]]],
 ['佐渡',[[138.15,37.8],[138.55,38],[138.5,38.35],[138.25,38.35]]],
 ['淡路島',[[134.65,34.15],[134.9,34.2],[135.02,34.6],[134.8,34.5]]],
 ['小笠原',[[142.12,27.02],[142.25,27.02],[142.25,27.17],[142.12,27.17]]]
];
const WORLD_LANDMARKS=[
 ['fuji','富士山',35.36,138.73,'mountain','https://www.japan.travel/en/spot/1308/'],
 ['aso','阿蘇山',32.88,131.1,'volcano','https://www.env.go.jp/en/park/aso/data/mtasovc/explore-mt-aso.html'],
 ['miyajima','厳島神社・宮島',34.3,132.32,'shrine','https://www.japan.travel/en/spot/887/'],
 ['biwa','琵琶湖',35.25,136.08,'lake','https://www.japan.travel/en/spot/1052/'],
 ['osaka','大阪城',34.687,135.526,'castle','https://www.japan.travel/en/spot/1087/'],
 ['himeji','姫路城',34.839,134.694,'castle','https://www.japan.travel/en/spot/1030/'],
 ['shuri','首里城',26.217,127.719,'palace','https://www.japan.travel/en/spot/574/'],
 ['clock','札幌市時計台',43.063,141.354,'clock','https://www.japan.travel/en/spot/1921/'],
 ['shirakawa','白川郷',36.26,136.906,'village','https://www.japan.travel/en/spot/2031/'],
 ['tottori','鳥取砂丘',35.54,134.235,'dune','https://www.japan.travel/en/spot/949/']
].map(([id,name,lat,lon,style,source])=>({id,name,lat,lon,style,source}));
function worldProject(lon,lat){return {x:Math.round(16+(lon-WORLD_GEO.west)*WORLD_GEO.sx),y:Math.round(16+(WORLD_GEO.north-lat)*WORLD_GEO.sy)};}
function worldUnproject(x,y){return {lon:WORLD_GEO.west+(x-16)/WORLD_GEO.sx,lat:WORLD_GEO.north-(y-16)/WORLD_GEO.sy};}
function worldPolygonContains(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i].y>y)!==(p[j].y>y)&&x<(p[j].x-p[i].x)*(y-p[i].y)/(p[j].y-p[i].y)+p[i].x)inside=!inside;return inside;}
/* Connected transport, explicit footpaths and roadside direction boards. */
function worldPrefectureName(hub){const p=HUBS[hub]?.pref||'';return p==='東京'?'東京都':p==='大阪'||p==='京都'?p+'府':/[都道府県]$/.test(p)?p:p+'県';}
function worldDirection(dx,dy){if(!dx&&!dy)return {arrow:'●',name:'到着',bit:0};return Math.abs(dx)>Math.abs(dy)?dx>0?{arrow:'→',name:'東',bit:2}:{arrow:'←',name:'西',bit:8}:dy>0?{arrow:'↓',name:'南',bit:4}:{arrow:'↑',name:'北',bit:1};}
function refineWorldLayout(m,land,rooms,route,put){
 const key=(x,y)=>x+','+y,steps=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]];
 m.walkRoadIndex={};m.transportIndex={};m.transportBase={};m.transportNetworks=[];m.routeSegments=[];m.targets={};m.transport=[];m.layoutKey='japan-wayfinding-v3';
 function foot(path,hub,kind,target=null){for(const p of path){const k=key(p.x,p.y),old=m.tiles[p.y][p.x];m.walkRoadIndex[k]=0;put(p.x,p.y,hub,m.areas[k]||hub+'-A1',['B','E','P'].includes(old)?old:['~','R'].includes(old)?'B':kind==='main'||kind==='city'||old==='A'?'A':'U');}m.routeSegments.push({hub,kind,target,path});}
 const between=(a,b)=>{const out=[{x:a.x,y:a.y}];let{x,y}=a;while(x!==b.x){x+=Math.sign(b.x-x);out.push({x,y});}while(y!==b.y){y+=Math.sign(b.y-y);out.push({x,y});}return out;};
 for(const r of WORLD_ROADS)foot(r.path,r.to,'main','city_'+r.to);
 for(const id of HUB_ORDER){const n=WORLD_NODES[id];foot(between(n.road,n),id,'city','city_'+id);foot(between({x:n.x-3,y:n.y+3},{x:n.x+3,y:n.y+3}),id,'field');for(const o of m.objects.filter(o=>o.type==='boss'&&BOSSES[o.boss].hub===id)){foot(between({x:n.x,y:o.y},o),id,'boss',o.id);}n.rail={x:n.x+5,y:n.y-1};}
 for(const o of m.landmarks){const access=route(WORLD_NODES[o.hub].road,o);foot(access,o.hub,'landmark',o.id);}
 // Every target is an actual map object; signs never occupy the walking road.
 const occupied=new Set(m.objects.filter(o=>o.type!=='sign').map(o=>key(o.x,o.y)));
 function roadside(anchor,hub){for(let r=1;r<=12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=anchor.x+dx,y=anchor.y+dy,k=key(x,y);if(x<1||y<1||x>=m.w-1||y>=m.h-1||occupied.has(k)||Object.hasOwn(m.walkRoadIndex,k)||!(m.owners[k]||[]).includes(hub)||!WORLD_TERRAIN[m.tiles[y][x]]?.[2])continue;const access=steps.map(([a,b])=>({x:x+a,y:y+b})).find(p=>Object.hasOwn(m.walkRoadIndex,key(p.x,p.y)));if(access){occupied.add(k);m.tiles[y][x]='G';return {x,y,anchor:access};}}throw Error('no roadside space '+hub);}
 for(const o of m.objects.filter(o=>o.type==='sign')){const hub=o.area.slice(0,4),n=WORLD_NODES[hub],i=Number(o.area.at(-1))-1,p=roadside({x:n.x-3+i*3,y:n.y+3},hub);Object.assign(o,p);}
 function target(o){const hub=o.to||o.hub||BOSSES[o.boss]?.hub||o.area?.slice(0,4),kind=o.type==='cityEntry'?'city':o.type==='boss'?'boss':o.type==='landmark'?'landmark':o.type==='sign'?'area':'port';m.targets[o.id]={id:o.id,x:o.x,y:o.y,hub,kind,label:kind==='city'?worldPrefectureName(hub)+'・'+HUBS[hub].name:kind==='boss'?'ボス入口・'+BOSSES[o.boss].name:o.label};}
 for(const o of m.objects)if(['cityEntry','boss','landmark','sign','port'].includes(o.type))target(o);
 function addBoard(anchor,hub,rows,suffix){const p=roadside(anchor,hub),destinations=rows.filter(Boolean).map(r=>({...r,...worldDirection(r.dx,r.dy)}));m.objects.push({id:'route_sign_'+hub+'_'+suffix,...p,type:'roadSign',hub,label:worldPrefectureName(hub)+'・街道分岐の案内',walk:false,destinations});}
 for(const hub of HUB_ORDER){const n=WORLD_NODES[hub],rows=[{target:'city_'+hub,dx:0,dy:-1}];for(const r of WORLD_ROADS){if(r.from!==hub&&r.to!==hub)continue;const path=r.from===hub?r.path.slice().reverse():r.path,other=r.from===hub?r.to:r.from;const p=path.find(p=>p.x!==n.road.x||p.y!==n.road.y);if(p)rows.push({target:'city_'+other,dx:p.x-n.road.x,dy:p.y-n.road.y});}addBoard(n.road,hub,rows,'town');const bosses=m.objects.filter(o=>o.type==='boss'&&BOSSES[o.boss].hub===hub);if(bosses.length)addBoard({x:n.x,y:n.y+6},hub,bosses.map(o=>({target:o.id,dx:o.x-n.x,dy:o.y-(n.y+6)})),'boss');}
 const railChains=[['KY14','KY07','KY01','KY02','NX08','NX09','NX05','KT05','KT04','KT06','KT09','KT10','KN06','KN07'],['KN07','KN04','KN02','TH01','TH02','TH05','TH06','RS05','TH07'],['KN04','HK04','HK03','HK02','HK01','KT06'],['KN04','HK06'],['KY02','KY04','KY06']];
 const highwayChains=[['KY14','KY07','KY01','KY02','NX08','NX09','NX05','KT05','KT04','KT09','KT10','KN06','KN07','KN04','KN02','TH01','TH02','TH05','TH06'],['NX01','NX04','NX03','NX02'],['RS05','TH07']];
 function transport(a,b,type){const na=WORLD_NODES[a],nb=WORLD_NODES[b],pa=type==='rail'?na.rail:{x:na.x-5,y:na.y+8},pb=type==='rail'?nb.rail:{x:nb.x-5,y:nb.y+8};if(type==='highway'){foot(between(na.road,pa),a,'city');foot(between(nb.road,pb),b,'city');}else{for(const n of [na,nb]){const id='rail_station_'+n.hub,x=n.x+3,y=n.y-1;if(!m.objects.some(o=>o.id===id)){m.objects.push({id,x,y,type:'railStation',hub:n.hub,label:HUBS[n.hub].name+'の新幹線駅（街中から乗車）',walk:false});occupied.add(key(x,y));}}}const path=route(pa,pb,type),full=type==='rail'?[...between({x:na.x+3,y:na.y-1},pa).slice(0,-1),...path.slice().reverse(),...between(pb,{x:nb.x+3,y:nb.y-1}).slice(1)]:path.slice().reverse();
  m.transportNetworks.push({from:a,to:b,type,path:full});for(let i=0;i<full.length;i++){const p=full[i],k=key(p.x,p.y),t=m.transportIndex[k]||(m.transportIndex[k]={rail:0,highway:0}),old=m.tiles[p.y][p.x];for(const q of [full[i-1],full[i+1]])if(q)t[type]|=worldDirection(q.x-p.x,q.y-p.y).bit;if(['~','R','E','B','P'].includes(old))t[type+'Water']=true;if(!m.transportBase[k])m.transportBase[k]=old;if(!Object.hasOwn(m.walkRoadIndex,k)&&!occupied.has(k)&&land[p.y*m.w+p.x]&&!rooms[p.y*m.w+p.x])m.tiles[p.y][p.x]=type==='rail'?'L':'H';m.transport.push({x:p.x,y:p.y,type:type==='rail'?'L':'H'});}
 }
 for(const chain of railChains)for(let i=1;i<chain.length;i++)transport(chain[i-1],chain[i],'rail');for(const chain of highwayChains)for(let i=1;i<chain.length;i++)transport(chain[i-1],chain[i],'highway');
 // Road signs must not be under a rail or motorway; move them to a clear shoulder.
 for(const o of m.objects.filter(o=>o.type==='sign'||o.type==='roadSign'))if(m.transportIndex[key(o.x,o.y)]||Object.hasOwn(m.walkRoadIndex,key(o.x,o.y))){occupied.delete(key(o.x,o.y));let p=null;for(let r=1;r<=15&&!p;r++)for(let dy=-r;dy<=r&&!p;dy++)for(let dx=-r;dx<=r&&!p;dx++){const x=o.anchor.x+dx,y=o.anchor.y+dy,k=key(x,y);if(x<1||y<1||x>=m.w-1||y>=m.h-1||occupied.has(k)||m.transportIndex[k]||Object.hasOwn(m.walkRoadIndex,k)||!(m.owners[k]||[]).includes(o.hub||o.area.slice(0,4))||!WORLD_TERRAIN[m.tiles[y][x]]?.[2])continue;const access=steps.map(([a,b])=>({x:x+a,y:y+b})).find(q=>Object.hasOwn(m.walkRoadIndex,key(q.x,q.y)));if(access)p={x,y,anchor:access};}if(!p)throw Error('sign rail overlap');Object.assign(o,p);m.tiles[o.y][o.x]='G';occupied.add(key(o.x,o.y));}
 // Cardinal masks are shared by rendering, guidance and path validation.
 for(const k of Object.keys(m.walkRoadIndex)){const[x,y]=k.split(',').map(Number);m.walkRoadIndex[k]=steps.reduce((mask,[dx,dy,bit])=>mask|(Object.hasOwn(m.walkRoadIndex,key(x+dx,y+dy))?bit:0),0);}
 for(const o of m.objects)if(Object.hasOwn(m.targets,o.id))target(o);
 m.objectIndex=Object.fromEntries(m.objects.map(o=>[key(o.x,o.y),o]));
}

function buildNationalOverworld(){
 const {w,h}=WORLD_GEO,m={hub:'KY01',name:'日本列島・全国街外マップ',kind:'out',mapScope:'world',w,h,tiles:Array.from({length:h},()=>Array(w).fill('~')),objects:[],zones:{},owners:{},areas:{},landmarks:[],rivers:[],transport:[],coasts:[],layoutKey:'japan-geographic-v2',safeAnchor:[0,0]};
 const size=w*h,rooms=new Uint8Array(size),land=new Uint8Array(size),baseLand=[];
 const projectedCities=HUB_ORDER.map(id=>({id,...worldProject(GAME_GEO[id].lon,GAME_GEO[id].lat)}));
 const nearest=(x,y)=>{let best='KY01',dist=Infinity;for(const p of projectedCities){const id=p.id,d=(p.x-x)**2+(p.y-y)**2;if(d<dist){dist=d;best=id;}}return best;};
 const put=(x,y,hub,area=null,t=null)=>{if(x<1||y<1||x>=w-1||y>=h-1)return;const k=x+','+y;if(t)m.tiles[y][x]=t;const a=m.owners[k]||(m.owners[k]=[]);if(!a.includes(hub))a.push(hub);if(area)m.areas[k]=area;};
 for(const[name,poly]of WORLD_COASTS){const p=poly.map(([lon,lat])=>worldProject(lon,lat));m.coasts.push({name,points:p});const x0=Math.max(1,Math.min(...p.map(a=>a.x))),x1=Math.min(w-2,Math.max(...p.map(a=>a.x))),y0=Math.max(1,Math.min(...p.map(a=>a.y))),y1=Math.min(h-2,Math.max(...p.map(a=>a.y)));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(worldPolygonContains(x,y,p)){m.tiles[y][x]='G';land[y*w+x]=1;}}
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++)if(land[y*w+x]){const hub=nearest(x,y),geo=worldUnproject(x,y),v=Math.sin(x*.17+y*.11)+Math.cos(x*.09-y*.13);let t=v>1.35?'M':v< -1.25?'T':v>.6?'W':v< -.6?'F':'G';if(geo.lat>42.8&&v>1)t='N';if(!land[y*w+x-1]||!land[y*w+x+1]||!land[(y-1)*w+x]||!land[(y+1)*w+x])t='S';const center=worldProject(GAME_GEO[hub].lon,GAME_GEO[hub].lat),distance=Math.hypot(x-center.x,y-center.y);put(x,y,hub,hub+'-A'+(distance<18?1:distance<36?2:3),t);baseLand.push([x,y]);}
 // Major mountain belts, rivers and lake: simplified geography rather than random grid rooms.
 function line(points,visit){for(let i=1;i<points.length;i++){let{x,y}=points[i-1],b=points[i],dx=Math.abs(b.x-x),dy=Math.abs(b.y-y),sx=x<b.x?1:-1,sy=y<b.y?1:-1,err=dx-dy;for(;;){visit(x,y);if(x===b.x&&y===b.y)break;const e=2*err;if(e> -dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}}}}
 const geoLine=(arr,visit)=>line(arr.map(([lon,lat])=>worldProject(lon,lat)),visit);
 for(const arr of [[[137.2,36.7],[137.7,36.2],[138.1,35.5]],[[140.7,40.6],[140.8,39.4],[140.4,38.4]],[[130.6,32.7],[131.05,32.3],[130.8,31.8]],[[142.5,44.3],[142.7,43.4],[143,42.7]]])geoLine(arr,(x,y)=>{for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(land[(y+dy)*w+x+dx])m.tiles[y+dy][x+dx]=worldUnproject(x,y).lat>42?'N':'M';});
 const rivers=[['石狩川',[[142.5,43.7],[141.9,43.6],[141.45,43.25],[141.3,43.15]]],['信濃川',[[138.2,36.8],[138.6,37.2],[138.85,37.5],[139.05,37.95]]],['利根川',[[139,36.7],[139.5,36.2],[140.1,35.95],[140.8,35.75]]],['淀川',[[135.9,35],[135.7,34.9],[135.5,34.65]]],['四万十川',[[133,33.5],[132.9,33.2],[132.95,32.95]]],['筑後川',[[131.1,33.3],[130.7,33.4],[130.3,33.1]]]];
 for(const[name,points]of rivers){const ps=points.map(([lon,lat])=>worldProject(lon,lat));m.rivers.push({name,points:ps});line(ps,(x,y)=>{if(land[y*w+x])m.tiles[y][x]='R';});}
 const lake=worldProject(136.08,35.25);for(let y=lake.y-7;y<=lake.y+7;y++)for(let x=lake.x-3;x<=lake.x+3;x++)if(((x-lake.x)/3)**2+((y-lake.y)/7)**2<1&&land[y*w+x])m.tiles[y][x]='R';
 // Preserve true geographic markers; offset only entrance symbols where dense cities overlap.
 for(const hub of HUB_ORDER){const geo=worldProject(GAME_GEO[hub].lon,GAME_GEO[hub].lat);let n=null;for(let r=0;r<=44&&!n;r++)for(let dy=-r;dy<=r&&!n;dy++)for(let dx=-r;dx<=r&&!n;dx++){if(r&&Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=geo.x+dx,y=geo.y+dy;if(x<8||y<3||x>=w-8||y>=h-10)continue;let free=true;for(let yy=y-2;yy<=y+8&&free;yy++)for(let xx=x-5;xx<=x+5;xx++)if(rooms[yy*w+xx]){free=false;break;}if(free)n={hub,x,y,geoX:geo.x,geoY:geo.y,lat:GAME_GEO[hub].lat,lon:GAME_GEO[hub].lon,spawn:{x,y:y+1},road:{x,y:y+8}};}
  if(!n)throw Error('city placement failed '+hub);WORLD_NODES[hub]=n;const{x,y}=n;for(let yy=y-1;yy<=y+7;yy++)for(let xx=x-4;xx<=x+4;xx++)rooms[yy*w+xx]=1;
  const areaIds=Object.keys(AREAS).filter(a=>a.slice(0,4)===hub);for(let yy=y-1;yy<=y+7;yy++)for(let xx=x-4;xx<=x+4;xx++){m.owners[xx+','+yy]=[hub];put(xx,yy,hub,areaIds[Math.min(2,Math.floor((xx-x+4)/3))],yy<y+2?(Math.abs(xx-x)<2?'C':'V'):['G','F','U'][Math.min(2,Math.floor((xx-x+4)/3))]);}
  for(let yy=y;yy<=y+8;yy++){m.owners[x+','+yy]=[hub];put(x,yy,hub,areaIds[1],yy<y+2?'A':'U');}
  m.objects.push({id:'city_'+hub,x,y,type:'cityEntry',label:HUBS[hub].name+'に入る',to:hub,walk:true});areaIds.forEach((area,j)=>m.objects.push({id:'field_'+area,x:x-4+j*3,y:y+2,type:'sign',label:AREAS[area].name,area}));
  Object.entries(BOSSES).filter(([id,b])=>b.hub===hub&&b.specialStage==null&&!id.startsWith('CB')).forEach(([boss,b],j)=>m.objects.push({id:'world_boss_'+boss,x:x-3+j*2,y:y+6,type:'boss',label:b.name,boss,walk:true}));
 }
 // Weighted A* follows land when practical, using ferry lanes for long island crossings.
 const dist=new Float64Array(size),prev=new Int32Array(size),seen=new Uint32Array(size),closed=new Uint32Array(size);let epoch=0;
 function route(a,b,mode='walk'){epoch++;const start=a.y*w+a.x,end=b.y*w+b.x,heap=[];const push=(id,c)=>{let i=heap.length;heap.push({id,c});while(i){let p=(i-1)>>1;if(heap[p].c<=c)break;heap[i]=heap[p];i=p;}heap[i]={id,c};};const pop=()=>{const root=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].c<heap[c].c)c++;if(heap[c].c>=last.c)break;heap[i]=heap[c];i=c;}heap[i]=last;}return root;};dist[start]=0;prev[start]=-1;seen[start]=epoch;push(start,0);let count=0;while(heap.length&&count++<size*3){const{id}=pop();if(closed[id]===epoch)continue;closed[id]=epoch;if(id===end)break;const x=id%w,y=Math.floor(id/w);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=ny*w+nx;if(nx<1||ny<1||nx>=w-1||ny>=h-1||rooms[k])continue;const t=m.tiles[ny][nx],cost=mode!=='walk'?(['~','E'].includes(t)?50:t==='R'?15:t==='M'||t==='N'?5:Object.hasOwn(m.walkRoadIndex,nx+','+ny)?8:1):t==='~'?5:t==='M'||t==='N'?3:t==='R'?2:1,nd=dist[id]+cost;if(closed[k]===epoch||seen[k]===epoch&&nd>=dist[k])continue;seen[k]=epoch;dist[k]=nd;prev[k]=id;push(k,nd+2*(Math.abs(nx-b.x)+Math.abs(ny-b.y)));}}
  if(seen[end]!==epoch||prev[end]<0)throw Error('national connection missing');const out=[];for(let k=end;k>=0;k=prev[k]){out.push({x:k%w,y:Math.floor(k/w)});if(k===start)break;}return out;}
 for(const hub of HUB_ORDER.slice(1)){const req=hubRequirement(hub),parent=QUESTS[req]?.hub||'KY01',a=WORLD_NODES[parent]||WORLD_NODES.KY01,b=WORLD_NODES[hub],path=route(a.road,b.road),area=hub+'-A1';let sea=0;for(const p of path)if(['~','E'].includes(m.tiles[p.y][p.x]))sea++;for(const p of path){const old=m.tiles[p.y][p.x];put(p.x,p.y,hub,area,['E','B','P'].includes(old)?old:old==='~'?(sea>12?'E':'B'):old==='R'?'B':(p.x+p.y)%11<4?'A':'U');}WORLD_ROADS.push({from:parent,to:hub,path,seaTiles:sea});if(sea>12)for(const p of [path[0],path.at(-1)]){put(p.x,p.y,hub,area,'P');if(!m.objects.some(o=>o.x===p.x&&o.y===p.y))m.objects.push({id:'port_'+hub+'_'+p.x,x:p.x,y:p.y,type:'port',label:'港・離島航路案内',hub,walk:true});}}
 // Spots retain their reference coordinates; nearby footpaths are game access paths.
 for(const spot of WORLD_LANDMARKS){const p=worldProject(spot.lon,spot.lat),hub=nearest(p.x,p.y),n=WORLD_NODES[hub];let best=null;for(let r=0;r<35&&!best;r++)for(let dy=-r;dy<=r&&!best;dy++)for(let dx=-r;dx<=r&&!best;dx++){const x=p.x+dx,y=p.y+dy;if(x<2||y<2||x>=w-2||y>=h-2||rooms[y*w+x]||m.objects.some(o=>o.x===x&&o.y===y))continue;best={x,y};}
  if(!best)continue;const access=route(n.road,best);for(const q of access)put(q.x,q.y,hub,hub+'-A1',['E','B','P'].includes(m.tiles[q.y][q.x])?m.tiles[q.y][q.x]:['~','R'].includes(m.tiles[q.y][q.x])?'B':'U');const o={...spot,...best,type:'landmark',label:spot.name,hub,walk:true,geoX:p.x,geoY:p.y};put(o.x,o.y,hub,null,spot.style==='dune'?'S':'G');m.landmarks.push(o);m.objects.push(o);
 }
 const dunes=worldProject(134.235,35.54);for(let y=dunes.y-4;y<=dunes.y+4;y++)for(let x=dunes.x-8;x<=dunes.x+8;x++)if(land[y*w+x]&&!rooms[y*w+x]&&['G','F','W','S'].includes(m.tiles[y][x]))m.tiles[y][x]=x<dunes.x?'D':'S';
 refineWorldLayout(m,land,rooms,route,put);
 m.scenicNote='街・観光地は緯度経度を参考に配置。海岸線・地形・道路・鉄道・航路はゲーム用に簡略化。砂漠は創作。';
 m.objectIndex=Object.fromEntries(m.objects.map(o=>[o.x+','+o.y,o]));m.safeAnchor=[WORLD_NODES.KY01.spawn.x,WORLD_NODES.KY01.spawn.y];m.terrainCounts={};for(const row of m.tiles)for(const t of row)m.terrainCounts[t]=(m.terrainCounts[t]||0)+1;MAPS.WORLD=m;
}
buildNationalOverworld();
// Physical signboards are abolished; area destinations remain virtual road waypoints.
for(const map of Object.values(MAPS)){if(map.mapScope==='world'){for(const o of map.objects.filter(o=>o.type==='sign')){const t=map.targets[o.id];if(t){t.x=o.anchor.x;t.y=o.anchor.y;t.virtual=true;}}}map.objects=map.objects.filter(o=>!['sign','roadSign'].includes(o.type));if(map.mapScope==='world')map.objectIndex=Object.fromEntries(map.objects.map(o=>[o.x+','+o.y,o]));}


function separateCityMap(m){
 m.mapScope='city';m.zones={};m.tiles=m.tiles.map(row=>row.map(t=>'123'.includes(t)?'.':t));
 m.objects=m.objects.filter(o=>o.type!=='boss'&&o.type!=='sign');
 for(const o of m.objects)if(o.type==='gate'){o.type='worldExit';o.label='街外へ出る・全国街道';delete o.to;}
 if(!m.objects.some(o=>o.type==='worldExit')){const x=m.safeAnchor[0],y=m.safeAnchor[1]+1;m.objects.push({id:'world_exit_'+m.hub,x,y,type:'worldExit',label:'街外へ出る・全国街道',walk:true});m.tiles[y][x]=',';}
 return m;
}
function worldRoadSearch(m,start,goal,can,roadOnly){const key=p=>p.x+','+p.y,q=[{...start}],prev=new Map([[key(start),null]]);for(let head=0;head<q.length;head++){const p=q[head];if(goal(p.x,p.y)){const path=[];let k=key(p);while(prev.get(k)){const[x,y]=k.split(',').map(Number);path.push({x,y});k=prev.get(k);}return path.reverse();}for(const[dx,dy]of [[0,-1],[1,0],[0,1],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=x+','+y;if(prev.has(k)||!can(x,y)||roadOnly&&!Object.hasOwn(m.walkRoadIndex,k))continue;prev.set(k,key(p));q.push({x,y});}}return null;}
function worldPreferredPath(m,sx,sy,goal,can){let approach=[],start={x:sx,y:sy};if(!Object.hasOwn(m.walkRoadIndex,sx+','+sy)){approach=worldRoadSearch(m,start,(x,y)=>Object.hasOwn(m.walkRoadIndex,x+','+y),can,false);if(!approach)return null;start=approach.at(-1)||start;}const route=worldRoadSearch(m,start,goal,can,true);return route?approach.concat(route):null;}
const WORLD_SIGN_CACHE=new WeakMap();
function worldSignRows(o,st=G.st){const m=MAPS.WORLD,open=HUB_ORDER.filter(id=>hubUnlocked(st,id)),sig=open.join(','),cache=WORLD_SIGN_CACHE.get(st)||new Map();WORLD_SIGN_CACHE.set(st,cache);const k=sig+'|'+o.id;if(cache.has(k))return cache.get(k);const can=(x,y)=>worldWalkableAt(x,y,st),rows=o.destinations.map(row=>{const target=m.targets[row.target],unlocked=target&&hubUnlocked(st,target.hub);let direction={arrow:row.arrow,name:row.name,bit:row.bit};if(unlocked){const path=worldPreferredPath(m,o.anchor.x,o.anchor.y,(x,y)=>x===target.x&&y===target.y,can);if(path)direction=path.length?worldDirection(path[0].x-o.anchor.x,path[0].y-o.anchor.y):worldDirection(0,0);}return {...row,...direction,target,unlocked,label:target?.label||'行先不明'};});if(cache.size>512)cache.clear();cache.set(k,rows);return rows;}
function navigateWorldTarget(id){const st=G.st,m=MAPS.WORLD,t=Object.hasOwn(m.targets,id)?m.targets[id]:null;if(!t||worldMoveReason(st)||!hubUnlocked(st,t.hub)){toast('未開放の行先や移動できない状態です。');return false;}if(st.mapId!=='WORLD'&&!leaveCity())return false;G.sheet=null;G.worldNav={id};G.worldNavState=st;G.walk.path=[];G.walk.pending=null;walkTo(t.x,t.y,null,true);if(G.st.mapId==='WORLD')render();const o=objAt(m,t.x,t.y),dx=Math.abs(st.pos.x-t.x),dy=Math.abs(st.pos.y-t.y);return G.walk.path.length>0||(t.virtual||o?.walk?dx+dy===0:Math.max(dx,dy)<=1);}
function worldNavigationInfo(){const st=G.st;if(!st||st.mapId!=='WORLD'||G.worldNavState!==st||!G.worldNav)return null;const t=MAPS.WORLD.targets[G.worldNav.id];if(!t||!hubUnlocked(st,t.hub))return null;const step=G.walk.path[0],arrived=(t.virtual||objAt(MAPS.WORLD,t.x,t.y)?.walk)?st.pos.x===t.x&&st.pos.y===t.y:Math.max(Math.abs(st.pos.x-t.x),Math.abs(st.pos.y-t.y))<=1,direction=step?worldDirection(step.x-st.pos.x,step.y-st.pos.y):null;return {target:t,arrived,direction,remaining:G.walk.path.length};}
function mapGuidanceVisible(){return G.st?.settings?.mapGuidance!==false;}
function mapGuidanceLevel(){const st=G.st,m=MAPS[st.mapId];if(m.mapScope==='city'||m.kind==='in')return '適正Lv —（安全地帯）';const nav=worldNavigationInfo(),t=nav?.target,o=t&&objAt(MAPS.WORLD,t.x,t.y),b=o?.boss&&BOSSES[o.boss];if(b)return '適正Lv '+(b.regionalLevel||b.chapterLevel||bossRecommendedLevel(b.q));const area=t?.kind==='area'?t.id.replace(/^field_/,''):zoneAt(m,st.pos.x,st.pos.y);if(AREAS[area])return '適正Lv '+recommendedAreaLevel(AREAS[area]);const hub=t?.hub||curHub(),levels=Object.entries(AREAS).filter(([id])=>id.slice(0,4)===hub).map(([,a])=>recommendedAreaLevel(a));return levels.length?'適正Lv '+Math.min(...levels)+(Math.min(...levels)!==Math.max(...levels)?'〜'+Math.max(...levels):''):'適正Lv —';}
function renderWorldNavigation(){const st=G.st;if(!st)return '';const show=mapGuidanceVisible(),world=st.mapId==='WORLD',n=world?worldNavigationInfo():null;const direction=n?.direction?n.direction.arrow+' '+n.direction.name+'へ':n?.arrived?'● 到着':n?'案内中断・再開可':world?'↑ 北｜行先を選択':MAPS[st.mapId].kind==='in'?'屋内':'街中';return '<div class="world-nav-strip map-guidance '+(show?'':'guidance-off')+'">'+(show?'<button class="btn" data-a="openSheet" data-k="'+(world?'worldRoutes':'guide')+'">行先</button><span class="map-guidance-copy"><b>'+esc(direction)+' <em>'+esc(mapGuidanceLevel())+'</em></b><small>'+esc(n?n.target.label:mapScopeText())+'</small><span class="map-location-info">'+hereHtml()+'</span></span>':'<span class="guidance-hidden-label">マップ案内</span>')+'<button class="btn guidance-toggle" data-a="mapGuidanceToggle" aria-pressed="'+show+'" aria-label="方向・適正レベル案内を'+(show?'非表示':'表示')+'">案内 '+(show?'ON':'OFF')+'</button></div>';}

function renderWorldRoutes(){const st=G.st,m=MAPS.WORLD,hub=curHub(),sign=m.objects.find(o=>o.id===G.sheetData.signId&&o.type==='roadSign');const rows=sign?worldSignRows(sign).map(r=>r.target):Object.values(m.targets).filter(t=>t.hub===hub&&['city','boss','landmark','area'].includes(t.kind));const extra=sign?[]:WORLD_ROADS.filter(r=>r.from===hub||r.to===hub).map(r=>m.targets['city_'+(r.from===hub?r.to:r.from)]);return (worldNavigationInfo()?'<div class="row2"><button class="btn" data-a="worldResume">案内を再開</button><button class="btn" data-a="worldNavStop">案内を解除</button></div>':'')+'<p>北が画面の上です。街道・橋・港を結ぶ道マスを優先して歩きます。案内中の金色の枠が進路です。戦闘後は「再開」で同じ行先へ進めます。</p><div class="stack">'+[...new Map([...rows,...extra].filter(Boolean).map(t=>[t.id,t])).values()].map(t=>{const row=sign?worldSignRows(sign).find(r=>r.target?.id===t.id):null,open=hubUnlocked(st,t.hub);return '<button class="btn" data-a="worldNavigate" data-v="'+t.id+'" '+(open?'':'disabled')+'>'+(row?row.arrow+' '+row.name+'へ　':'')+esc(t.label)+(open?'':'／未開放エリア')+'</button>';}).join('')+'</div><button class="btn" data-a="openSheet" data-k="world">全国の県・街から選ぶ</button>';}
function worldViewportLabels(st,cam,vw,vh){const m=MAPS.WORLD,labels=[],nav=worldNavigationInfo(),candidates=[];function add(o,lines,priority,color){const x=o.x*16-cam.x+8,y=o.y*16-cam.y;if(x<0||y<0||x>vw||y>vh)return;candidates.push({id:o.id,x,y,lines,priority,color});}
 for(const o of m.objects){if(o.type==='cityEntry')add(o,[worldPrefectureName(o.to),HUBS[o.to].name+'・入口'],nav?.target.id===o.id?0:o.to===worldHubAt(st.pos.x,st.pos.y,st)?0.5:1,hubUnlocked(st,o.to)?'#f6df9e':'#a8b4b9');else if(o.type==='boss'&&!st.bossDefeated[o.boss])add(o,['ボス入口',BOSSES[o.boss].name],nav?.target.id===o.id?0:2,'#f3b09b');else if(o.type==='roadSign'&&Math.abs(o.x-st.pos.x)+Math.abs(o.y-st.pos.y)<=10){const rows=worldSignRows(o,st).slice(0,2);add(o,rows.map(r=>r.arrow+' '+(r.unlocked?'':'未開放：')+r.label),3,'#d6e2c1');}else if(o.type==='landmark')add(o,[o.name],4,'#e9cfa3');}
 const occupied=[{x:0,y:0,w:55,h:19},{x:Math.max(0,vw-230),y:0,w:230,h:48},{x:st.pos.x*16-cam.x-2,y:st.pos.y*16-cam.y-10,w:20,h:30}];const width=s=>[...s].reduce((n,c)=>n+(c.charCodeAt(0)>255?10:6),0);
 for(const c of candidates.sort((a,b)=>a.priority-b.priority||a.y-b.y)){const lines=c.lines.map(s=>{let out='';for(const ch of s){if(width(out+ch)>146)return out+'…';out+=ch;}return out;}),w=Math.min(vw-4,Math.max(48,...lines.map(width))+10),h=lines.length*13+6;if(h>vh-24||w>vw-4)continue;let rect=null,bestCost=Infinity;for(const[dx,dy]of [[-w/2,-h-23],[-w/2,18],[12,-h/2],[-w-12,-h/2]]){const r={x:Math.max(2,Math.min(vw-w-2,c.x+dx)),y:Math.max(20,Math.min(vh-h-2,c.y+dy)),w,h};if(!occupied.some(o=>r.x<o.x+o.w+3&&r.x+r.w+3>o.x&&r.y<o.y+o.h+3&&r.y+r.h+3>o.y)){let cost=0;for(let y=Math.floor((r.y+cam.y)/16);y<=Math.floor((r.y+r.h+cam.y)/16);y++)for(let x=Math.floor((r.x+cam.x)/16);x<=Math.floor((r.x+r.w+cam.x)/16);x++){if(Object.hasOwn(m.walkRoadIndex,x+','+y))cost+=4;if(objAt(m,x,y))cost+=8;}if(cost<bestCost){bestCost=cost;rect=r;}}}if(rect){occupied.push(rect);labels.push({...rect,id:c.id,lines,color:c.color,priority:c.priority,anchorX:c.x,anchorY:c.y-10});}}
 return labels;
}
function drawWorldWayfinding(g,st,cam,vw,vh){g.save();g.font="bold 10px 'Noto Sans JP',sans-serif";g.textAlign='center';g.textBaseline='middle';const n=worldNavigationInfo();if(n&&mapGuidanceVisible()){for(const p of G.walk.path.slice(0,48)){const x=p.x*16-cam.x,y=p.y*16-cam.y;if(x< -16||x>vw||y< -16||y>vh)continue;g.strokeStyle='#f4d577';g.strokeRect(x+3.5,y+3.5,9,9);}}
 for(const l of worldViewportLabels(st,cam,vw,vh)){const x=Math.max(l.x,Math.min(l.x+l.w,l.anchorX)),y=Math.max(l.y,Math.min(l.y+l.h,l.anchorY));g.fillStyle=l.color;g.fillRect(Math.min(x,l.anchorX),y,Math.max(1,Math.abs(l.anchorX-x)),1);g.fillRect(l.anchorX,Math.min(y,l.anchorY),1,Math.max(1,Math.abs(l.anchorY-y)));g.fillStyle='#0e2331eb';g.fillRect(l.x,l.y,l.w,l.h);g.fillStyle=l.color;g.fillRect(l.x,l.y,2,l.h);l.lines.forEach((line,i)=>g.fillText(line,l.x+l.w/2,l.y+l.h/2+(i-(l.lines.length-1)/2)*13));}g.restore();}

function worldOwnersAt(x,y){return MAPS.WORLD.owners[x+','+y]||[];}
function worldHubAt(x,y,st=G.st){const owners=worldOwnersAt(x,y),open=owners.filter(id=>st&&hubUnlocked(st,id));return open[0]||owners[0]||st?.overworldHome||'KY01';}
function worldTileOpen(x,y,st=G.st){return !!st&&worldOwnersAt(x,y).some(id=>hubUnlocked(st,id));}
function worldWalkableAt(x,y,st=G.st){if(!worldTileOpen(x,y,st))return false;return !!WORLD_TERRAIN[tileAt(MAPS.WORLD,x,y)]?.[2];}
function worldAreaAt(x,y,st=G.st){if(!worldWalkableAt(x,y,st))return null;const k=x+','+y,o=objAt(MAPS.WORLD,x,y);if(o||['A','V','C','P','E','B'].includes(tileAt(MAPS.WORLD,x,y)))return null;const a=MAPS.WORLD.areas[k];return a&&hubUnlocked(st,a.slice(0,4))?a:Object.keys(AREAS).find(id=>id.slice(0,4)===worldHubAt(x,y,st))||null;}
function mapGuideObjects(){const m=MAPS[G.st.mapId],hub=curHub(),list=m.objects.filter(o=>o.type!=='tower'&&(m.mapScope!=='world'||o.to===hub||o.area?.slice(0,4)===hub||BOSSES[o.boss]?.hub===hub||o.hub===hub));if(m.mapScope==='world')for(const t of Object.values(m.targets).filter(t=>t.kind==='area'&&t.hub===hub))list.push({...t,type:'areaWaypoint',area:t.id.replace(/^field_/,''),walk:true});return list;}

function mapScopeText(st=G.st){return st.mapId==='WORLD'?'街外｜'+worldPrefectureName(worldHubAt(st.pos.x,st.pos.y,st))+'・'+HUBS[worldHubAt(st.pos.x,st.pos.y,st)].name+'周辺':MAPS[st.mapId].mapScope==='city'?'街中｜敵との遭遇なし':MAPS[st.mapId].kind==='in'?'屋内｜敵との遭遇なし':'街外｜特設エリア';}
function exteriorBattleReady(st){if(MAPS[st.mapId]?.mapScope==='city')return leaveCity();if(MAPS[st.mapId]?.kind==='in'){toast('街外へ出てから挑戦してください。');return false;}return true;}
function worldMoveReason(st){if(!st||st!==G.st||G.readOnly||G.screen!=='explore'||st.run||st.stream||st.careerSession||G.dlg)return '戦闘・配信・会話・準備を終えてから移動してください。';return '';}
function leaveCity(){const st=G.st,reason=worldMoveReason(st);if(reason){toast(reason);return false;}const n=WORLD_NODES[curHub()];if(!n||!['city'].includes(MAPS[st.mapId].mapScope)){toast('街の出口から出発してください。');return false;}if(streamPending()){toast('配信待ちの依頼を完了してから街外へ出てください。');return false;}st.overworldHome=n.hub;travelMap('WORLD',n.spawn.x,n.spawn.y);return true;}
function enterWorldCity(to){const st=G.st,n=WORLD_NODES[to];if(worldMoveReason(st)||st.mapId!=='WORLD'||!n||Math.abs(st.pos.x-n.x)+Math.abs(st.pos.y-n.y)>1)return false;if(!hubUnlocked(st,to)){toast('未開放エリア：'+HUBS[to].name);return false;}const m=MAPS[to];st.overworldHome=to;travelHub(to,...m.safeAnchor);return true;}
function walkNationalTo(to){return navigateWorldTarget('city_'+to);}

function migrateNationalLocation(st){
 if((st.mapTravelVersion||0)<2){const hub=hubUnlocked(st,st.overworldHome)?st.overworldHome:st.run&&WORLD_NODES[st.run.hub]&&hubUnlocked(st,st.run.hub)?st.run.hub:'KY01',n=WORLD_NODES[hub];if(st.mapId==='WORLD'){st.mapId='WORLD';st.pos={...n.spawn};}if(st.run?.returnPos?.map==='WORLD'){const r=WORLD_NODES[st.run.hub]||n;st.run.returnPos={map:'WORLD',...r.spawn};}}
 if(st.mapId==='WORLD'&&(!worldTileOpen(st.pos.x,st.pos.y,st)||!walkable(MAPS.WORLD,st.pos.x,st.pos.y,st))){const hub=hubUnlocked(st,st.overworldHome)?st.overworldHome:'KY01';st.mapId=hub;st.pos={x:MAPS[hub].safeAnchor[0],y:MAPS[hub].safeAnchor[1]};}
 if(st.run&&MAPS[st.run.returnPos?.map]?.mapScope==='city'){const n=WORLD_NODES[st.run.hub]||WORLD_NODES[st.run.returnPos.map];if(n){if(hubUnlocked(st,n.hub)){st.run.returnPos={map:'WORLD',x:n.spawn.x,y:n.spawn.y};st.mapId='WORLD';st.pos={...n.spawn};}}}
 st.mapTravelVersion=2;
}
const WORLD_ATLAS_REGIONS={all:'日本全体',near:'現在地周辺',kyushu:'九州',okinawa:'沖縄',shikoku:'四国',chugoku:'中国',kinki:'近畿・東海',hokuriku:'北陸・甲信越',tohoku:'東北',hokkaido:'北海道',kanto:'関東',ogasawara:'小笠原'};
function worldAtlasRegionHub(id,region){const g=GAME_GEO[id];if(region==='all'||region==='near')return true;return region==='kyushu'?id.startsWith('KY')&&g.lat>30:region==='okinawa'?g.lon<130&&g.lat<30:region==='shikoku'?['NX01','NX02','NX03','NX04'].includes(id):region==='chugoku'?['NX05','NX06','NX07','NX08','NX09','EN01','RS02'].includes(id):region==='kinki'?id.startsWith('KT')||id==='RS03':region==='hokuriku'?id.startsWith('HK')||['EN02','RS04'].includes(id):region==='tohoku'?id.startsWith('TH')&&g.lat<41.5||id==='EN03':region==='hokkaido'?g.lat>41.5:region==='kanto'?id.startsWith('KN')||id==='EN04':region==='ogasawara'?id==='RS06':false;}
function worldAtlasBounds(region){if(region==='all')return {x:0,y:0,w:WORLD_GEO.w,h:WORLD_GEO.h};if(region==='near'){const p=G.st.mapId==='WORLD'?G.st.pos:WORLD_NODES[curHub()];return {x:Math.max(0,p.x-44),y:Math.max(0,p.y-36),w:88,h:72};}const nodes=HUB_ORDER.filter(id=>worldAtlasRegionHub(id,region)).map(id=>WORLD_NODES[id]),x=Math.min(...nodes.map(n=>n.x))-24,y=Math.min(...nodes.map(n=>n.y))-28;return {x,y,w:Math.max(70,Math.max(...nodes.map(n=>n.x))-x+24),h:Math.max(65,Math.max(...nodes.map(n=>n.y))-y+28)};}
function renderNationalAtlas(){
 const st=G.st,region=Object.hasOwn(WORLD_ATLAS_REGIONS,G.sheetData.atlasRegion)?G.sheetData.atlasRegion:'all',b=worldAtlasBounds(region),m=MAPS.WORLD,stroke=region==='all'?.85:1.1,font=region==='all'?7:3.2;
 const layer=['walk','rail','highway','all'].includes(G.sheetData.atlasLayer)?G.sheetData.atlasLayer:'walk';
 const transportLines=m.transportNetworks.filter(n=>layer==='all'||layer===n.type).map(n=>'<polyline data-layer="'+n.type+'" points="'+n.path.map(p=>p.x+','+p.y).join(' ')+'" fill="none" stroke="'+(n.type==='rail'?'#d6ebe0':'#91a9c6')+'" stroke-width="'+(n.type==='rail'?1:1.8)+'" '+(n.type==='rail'?'stroke-dasharray="3 1"':'')+'/>').join('');
 const poly=m.coasts.map(c=>'<polygon points="'+c.points.map(p=>p.x+','+p.y).join(' ')+'" fill="#647f60" stroke="#a7b991" stroke-width=".65"><title>'+esc(c.name)+'</title></polygon>').join('');
 const rivers=m.rivers.map(r=>'<polyline points="'+r.points.map(p=>p.x+','+p.y).join(' ')+'" fill="none" stroke="#79bacb" stroke-width="1.6"><title>'+esc(r.name)+'</title></polyline>').join('');
 const roads=WORLD_ROADS.map(r=>'<polyline points="'+r.path.map(p=>p.x+','+p.y).join(' ')+'" fill="none" stroke="'+(hubUnlocked(st,r.to)?r.seaTiles>12?'#86c7d1':'#e4c67b':'#424e57')+'" stroke-width="'+stroke+'" '+(r.seaTiles>12?'stroke-dasharray="2 2"':'')+'/>').join('');
 const major=['KY01','KY15','NX09','KT04','KT09','HK06','TH02','TH07','KN07','RS06'];
 const nodes=HUB_ORDER.map(id=>{const n=WORLD_NODES[id],open=hubUnlocked(st,id),here=curHub()===id,show=region!=='all'||major.includes(id);return '<g><title>'+esc(HUBS[id].name)+'／'+(open?'解放済み':'未開放エリア')+'</title><line x1="'+n.geoX+'" y1="'+n.geoY+'" x2="'+n.x+'" y2="'+n.y+'" stroke="#cad0b5" stroke-width=".4"/><circle cx="'+n.x+'" cy="'+n.y+'" r="'+(here?2.7:1.6)+'" fill="'+(here?'#fff0ac':open?'#e0cc94':'#52606b')+'"/>'+(show?'<text x="'+n.x+'" y="'+(n.y-4)+'" text-anchor="middle" dominant-baseline="middle" font-size="'+font+'" fill="'+(open?'#fff2d2':'#a8b1b7')+'">'+esc(region==='all'?HUBS[id].name:worldPrefectureName(id)+'・'+HUBS[id].name)+'</text>':'')+'</g>';}).join('');
 const spots=m.landmarks.map(o=>'<g><title>'+esc(o.name)+'</title><path d="M'+o.geoX+' '+(o.geoY-2)+' l2 3 -4 0 z" fill="#e4a77b"/>'+(region!=='all'?'<text x="'+o.geoX+'" y="'+(o.geoY-4)+'" text-anchor="middle" dominant-baseline="middle" font-size="2.6" fill="#ffcf9b">'+esc(o.name)+'</text>':'')+'</g>').join('');
 return '<label class="atlas-region">表示地域<select id="worldAtlasRegion">'+Object.entries(WORLD_ATLAS_REGIONS).map(([k,v])=>'<option value="'+k+'" '+(region===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label class="atlas-region">道・交通表示<select id="worldAtlasLayer">'+[['walk','街道・徒歩ルート'],['rail','線路・駅'],['highway','高速道路'],['all','すべて重ねる']].map(([k,v])=>'<option value="'+k+'" '+(layer===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label><div class="national-atlas japan-atlas"><svg viewBox="'+[b.x,b.y,b.w,b.h].join(' ')+'" role="img" aria-label="日本列島の全国街道の接続図。暗い街は未開放。"><rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="#173d53"/>'+poly+rivers+transportLines+((layer==='walk'||layer==='all')?roads:'')+spots+nodes+'<text x="'+(b.x+5)+'" y="'+(b.y+9)+'" fill="#e5e7cd" font-size="'+font+'">N ↑　'+WORLD_ATLAS_REGIONS[region]+'</text></svg></div><p class="small">街の緯度経度を参考にした日本列島マップ。密集地は入口記号をずらし、細線で投影位置を結びます。金色＝街道／水色の破線＝港を結ぶ航路／暗色＝未開放。地形・交通経路はゲーム向けの概略です。</p><details class="terrain-legend"><summary>地形・交通・名所の見方</summary><div class="terrain-grid">'+Object.entries(WORLD_TERRAIN).map(([k,v])=>'<span><i style="background:'+v[1]+'"></i>'+v[0]+'</span>').join('')+'</div><p>未開放エリアと海・川のマスには入れません。開放済みの森林・山・雪山・線路・高速道路などの陸地を移動できます。水上は橋・港・浮標のある航路を使います。砂漠は鳥取砂丘の周辺に加えた創作の景観です。</p><p><a href="https://maps.gsi.go.jp/" target="_blank" rel="noopener noreferrer">位置の参考：国土地理院 地理院地図</a></p><div class="stack">'+m.landmarks.map(o=>'<a href="'+o.source+'" target="_blank" rel="noopener noreferrer">'+esc(o.name)+'の公式案内</a>').join('')+'</div></details>';
}


function ensureWorld(st){
  if(!st)return;
  if(!Number.isInteger(st.worldSeed))st.worldSeed=(Math.floor(Math.random()*4294967295)>>>0);
  const changed=activeWorldSeed!==st.worldSeed||st.worldLayoutVersion!==3;
  if(changed){for(const id of HUB_ORDER)MAPS[id]=separateCityMap(generateTown(id,st.worldSeed));activeWorldSeed=st.worldSeed;}
  const repair=(p,id)=>{const m=MAPS[id];if(!m||m.kind!=='out'||m.mapScope==='world'||!p)return;const same=p.x===m.safeAnchor[0]&&p.y===m.safeAnchor[1];if(!walkable(m,p.x,p.y)||(changed&&zoneAt(m,p.x,p.y))||(changed&&!same&&!bfs(m,m.safeAnchor[0],m.safeAnchor[1],(x,y)=>x===p.x&&y===p.y))){p.x=m.safeAnchor[0];p.y=m.safeAnchor[1];}};
  repair(st.pos,st.mapId);if(st.run&&st.run.returnPos)repair(st.run.returnPos,st.run.returnPos.map);st.worldLayoutVersion=3;migrateNationalLocation(st);
}

/* ---- v5.33 能力値（ユーザー指定）：体力・ちから・身の守り・すばやさ・魅力。職業ごとに初期値と伸び方が違う ----
   ◎=1.25倍 ○=1.0倍 △=0.8倍（標準の初期値・1レベルあたりの伸びに掛ける）
   体力→最大HP／ちから→攻撃力／身の守り→防御力／すばやさ→会心率・回避率／魅力→得るエールと技能の回復量 */
const STAT_KEYS = ["vit","str","def","agi","cha"];
const STAT_NAMES = {vit:"体力", str:"ちから", def:"身の守り", agi:"すばやさ", cha:"魅力"};
const STAT_STD = {vit:[25,3.0], str:[12,2.0], def:[4,1.0], agi:[8,1.5], cha:[8,1.5]};
const GRADE = {"◎":1.4, "○":1.0, "△":0.72};
/* 職業ごとの「看板能力」：レベルアップでさらに1.2倍伸びる（成長の特色） */
const JOB_SIG = {J01:"vit",J02:"agi",J03:"cha",J04:"def",J05:"agi",J06:"str",J07:"def",J08:"cha",J09:"def",J10:"cha",J11:"cha",J12:"vit",J13:"cha",J14:"vit",J15:"str",J16:"def",J17:"def",J18:"cha",J19:"agi",J20:"agi",J21:"str",J22:"cha"};
function growthLabel(job){ const g=[...(JOB_STAT_GRADES[job]||"○○○○○")]; const hi=STAT_KEYS.filter((k,i)=>g[i]==="◎"&&k!==JOB_SIG[job]).map(k=>STAT_NAMES[k]); return `${STAT_NAMES[JOB_SIG[job]]||"体力"}★`+(hi.length?`・${hi.join("・")}◎`:""); }
const JOB_STAT_GRADES = { // 体力 ちから 身の守り すばやさ 魅力
  // v5.35：どの職業も伸びの総量（◎1.25・○1・△0.8の合計）が5.0〜5.1になるよう整理。得意を伸ばすと苦手が残る
  J01:"◎◎○△△", J02:"△○○◎○", J03:"○△○○◎", J04:"○○○○○", J05:"○○△◎○", J06:"△◎△◎○",
  J07:"◎△◎△○", J08:"○△○○◎", J09:"◎○◎△△", J10:"○○△○◎", J11:"△○○○◎", J12:"◎○○△○",
  J13:"○△○○◎", J14:"◎○○△○", J15:"○◎○○△", J16:"◎○◎△△", J17:"○○◎△○", J18:"○△○○◎",
  J19:"△○○◎○", J20:"○△○◎○", J21:"△◎○◎△", J22:"○○△○◎"
};
function baseStats(job, L){
  const g=[...(JOB_STAT_GRADES[job]||"○○○○○")]; const o={};
  STAT_KEYS.forEach((k,i)=>{ const m=GRADE[g[i]]||1, sg=JOB_SIG[job]===k?1.2:1; const [b,gr]=STAT_STD[k]; o[k]=Math.round(b*m)+Math.floor(gr*m*sg*(L-1)); });
  return o;
}
const round1 = x => Math.round(x*10)/10;
/* ---- 能力の導出（第16E・16G・17A節） ---- */
function jpOf(st,cid,job){ return (st.jp[cid]&&st.jp[cid][job])||0; }
function charStats(st, cid, L, jobOverride, equipOverride, exactLevel=false){
  if(!exactLevel)L=st.memberXp?characterLevel(st,cid):Math.min(L,progressionCap(st));
  const job = jobOverride || st.jobs[cid];
  const R = jobRank(st,cid,job);
  const V = Vof(L);
  const eq = equipOverride || st.equip[cid];
  const w = eq.w?EQUIP[eq.w]:null, a = eq.a?EQUIP[eq.a]:null, acc = eq.acc?EQUIP[eq.acc]:null;
  const ok = it => it && L>=(it.needL||1) && (!it.job || (it.job===job && R>=it.needR));
  const W = ok(w)?w:null, A = ok(a)?a:null, X = ok(acc)?acc:null;
  const S = Kof(R) + (W && W.job===job ? 1 : 0);
  const supportHP = 0;
  const rawBase = baseStats(job, L), mastery=masteryPercent(R);
  const permanent=permanentJobBonus(st,cid);
  const base=Object.fromEntries(STAT_KEYS.map(k=>[k,Math.floor(rawBase[k]*(100+mastery+permanent[k])/100)]));
  if(CHARACTER_ARCS[cid]?.defPercent)base.def=Math.floor(base.def*(100+CHARACTER_ARCS[cid].defPercent)/100);
  const gearCrit = ((W&&W.crit)||0)+((A&&A.crit)||0)+((X&&X.crit)||0);
  const maxHP = 2*base.vit + 2*Math.floor(R/2) + V*(((A&&A.hp)||0)+((X&&X.hp)||0)+supportHP);
  const mp=JOB_MP[job]||[16,1.4];
  const startC = Math.min(9999,mp[0]+Math.floor((L-1)*mp[1])+Math.floor(R/2)+((W&&W.c)||0)+((A&&A.c)||0)+((X&&X.c)||0));
  const wAtk=(W&&W.atk)||0, accAtk=(X&&X.atk)||0, armorD=(A&&A.d)||0;
  const defBase = base.def;
  return { L, permanent, job, R, S, V, maxHP, startC, maxMP:startC, extraSkills:extraSkillsFor(st,cid,L,job), base, rawBase, mastery,
    atk: base.str + V*(wAtk+accAtk),               // 最終攻撃力＝ちから＋装備
    defBase, defTotal: defBase + V*armorD,          // 最終防御力＝身の守り＋装備
    crit: Math.min(30, round1(1 + base.agi/6 + gearCrit)), // 会心率％＝すばやさ÷6＋1＋装備
    eva: Math.min(10, round1(base.agi/12)),        // 回避率％
    cha: Math.floor(base.cha/4),                    // 魅力補正％＝魅力÷4（エール・技能の回復量）
    gearCrit,
    wAtk:(W&&W.atk)||0, accAtk:(X&&X.atk)||0, armorD:(A&&A.d)||0,
    commentA:((W&&W.commentA)||0)+((X&&X.commentA)||0)+(CHARACTER_ARCS[cid]?.comment||0),
    rest:((A&&A.rest)||0)+((X&&X.rest)||0)+(CHARACTER_ARCS[cid]?.rest||0),
    meter:((W&&W.meter)||0)+((X&&X.meter)||0),
    family:((W&&W.family)||0)+((X&&X.family)||0),
    pouch:!!(X&&X.pouch), jobWeapon: !!(W && W.job===job) };
}

/* ---- 乱数（抽選値はcommandへ固定する） ---- */
function rand16(){ try{ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]; }catch(e){ return Math.floor(Math.random()*4294967296); } }
function randInt(n){ // 0..n-1 一様（棄却法）
  const lim = Math.floor(4294967296/n)*n; let r; do{ r=rand16(); }while(r>=lim); return r%n;
}

const REGIONAL_SPECIALTIES=[{"id":"R01","pref":"北海道","prefecture":"北海道","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hokkaido.html","foods":[{"name":"石狩鍋","sourceTitle":"石狩鍋","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hokkaido.html"},{"name":"いももち","sourceTitle":"いももち／いもだんご","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hokkaido.html"},{"name":"札幌味噌ラーメン","sourceTitle":"札幌味噌ラーメン","source":"https://www.japan.travel/en/guide/ramen/","kind":"ramen","item":"RGX001"},{"name":"いかめし","sourceTitle":"いかめし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/ikameshi_hokkaido.html","kind":"squid","item":"RGX004"},{"name":"ザンギ","sourceTitle":"ザンギ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/zangi_hokkaido.html","kind":"grill","item":"SFI001","series":"soul-food"}]},{"id":"R02","pref":"青森","prefecture":"青森県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/aomori.html","foods":[{"name":"せんべい汁","sourceTitle":"せんべい汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/aomori.html"},{"name":"けの汁","sourceTitle":"けの汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/aomori.html"},{"name":"イカメンチ","sourceTitle":"イカメンチ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/ika_menchi_aomori.html","kind":"grill","item":"SFI002","series":"soul-food"}]},{"id":"R03","pref":"岩手","prefecture":"岩手県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/iwate.html","foods":[{"name":"ひっつみ","sourceTitle":"ひっつみ／ひっつみ汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/iwate.html"},{"name":"まめぶ汁","sourceTitle":"まめぶ汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/iwate.html"},{"name":"盛岡駄菓子・味噌パン","sourceTitle":"盛岡駄菓子・味噌パン","source":"https://iwatetabi.jp/spots/6780/","kind":"candy","item":"RGX008"},{"name":"お茶もち","sourceTitle":"お茶もち","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/28_11_iwate.html","kind":"candy","item":"SFI003","series":"soul-food"}]},{"id":"R04","pref":"宮城","prefecture":"宮城県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/miyagi.html","foods":[{"name":"ずんだ餅","sourceTitle":"ずんだ餅","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/miyagi.html"},{"name":"はらこ飯","sourceTitle":"はらこ飯","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/miyagi.html"},{"name":"仙台駄菓子","sourceTitle":"仙台駄菓子","source":"https://www.maff.go.jp/j/keikaku/syokubunka/traditional-foods/menu/sendai-dagasi.html","kind":"candy","item":"RGX007"},{"name":"油麩丼","sourceTitle":"油麩丼","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/aburafu_don_miyagi.html","kind":"bowl","item":"SFI004","series":"soul-food"}]},{"id":"R05","pref":"秋田","prefecture":"秋田県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/akita.html","foods":[{"name":"きりたんぽ鍋","sourceTitle":"きりたんぽ鍋","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/akita.html"},{"name":"いぶりがっこ","sourceTitle":"いぶりがっこ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/akita.html"},{"name":"だまこ鍋","sourceTitle":"だまこ鍋","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/29_4_akita.html","kind":"stew","item":"SFI005","series":"soul-food"}]},{"id":"R06","pref":"山形","prefecture":"山形県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamagata.html","foods":[{"name":"芋煮","sourceTitle":"芋煮","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamagata.html"},{"name":"玉こんにゃく","sourceTitle":"玉こんにゃく","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamagata.html"},{"name":"だし","sourceTitle":"だし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/dashi_yamagata.html","kind":"stew","item":"SFI006","series":"soul-food"}]},{"id":"R07","pref":"福島","prefecture":"福島県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukushima.html","foods":[{"name":"こづゆ","sourceTitle":"こづゆ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukushima.html"},{"name":"いかにんじん","sourceTitle":"いかにんじん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukushima.html"},{"name":"喜多方ラーメン","sourceTitle":"喜多方ラーメン","source":"https://www.japan.travel/en/spot/2125/","kind":"ramen","item":"RGX002"},{"name":"みそかんぷら","sourceTitle":"みそかんぷら","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/30_9_fukushima.html","kind":"stew","item":"SFI007","series":"soul-food"}]},{"id":"R08","pref":"茨城","prefecture":"茨城県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ibaraki.html","foods":[{"name":"干しいも","sourceTitle":"干しいも","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ibaraki.html"},{"name":"そぼろ納豆","sourceTitle":"そぼろ納豆／しょぼろ納豆","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ibaraki.html"},{"name":"つけけんちん","sourceTitle":"つけけんちん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/tukekenchin_ibaraki.html","kind":"stew","item":"SFI008","series":"soul-food"}]},{"id":"R09","pref":"栃木","prefecture":"栃木県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tochigi.html","foods":[{"name":"しもつかれ","sourceTitle":"しもつかれ／シモツカレ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tochigi.html"},{"name":"耳うどん","sourceTitle":"耳うどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tochigi.html"},{"name":"ちたけうどん（そば）","sourceTitle":"ちたけうどん（そば）","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/31_9_tochigi.html","kind":"bowl","item":"SFI009","series":"soul-food"}]},{"id":"R10","pref":"群馬","prefecture":"群馬県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/gunma.html","foods":[{"name":"焼きまんじゅう","sourceTitle":"焼きまんじゅう","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/gunma.html"},{"name":"おきりこみ","sourceTitle":"おきりこみ／おっきりこみ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/gunma.html"},{"name":"ソースカツ丼","sourceTitle":"ソースカツ丼","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/32_20_gunma.html","kind":"bowl","item":"SFI010","series":"soul-food"}]},{"id":"R11","pref":"埼玉","prefecture":"埼玉県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/saitama.html","foods":[{"name":"いがまんじゅう","sourceTitle":"いがまんじゅう","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/saitama.html"},{"name":"煮ぼうとう","sourceTitle":"煮ぼうとう／ひもかわ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/saitama.html"},{"name":"ゼリーフライ","sourceTitle":"ゼリーフライ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/33_8_saitama.html","kind":"grill","item":"SFI011","series":"soul-food"}]},{"id":"R12","pref":"千葉","prefecture":"千葉県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/chiba.html","foods":[{"name":"なめろう","sourceTitle":"なめろう","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/chiba.html"},{"name":"ゆで落花生","sourceTitle":"ゆで落花生","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/chiba.html"},{"name":"さんが焼き","sourceTitle":"さんが焼き","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sanga_yaki_chiba.html","kind":"grill","item":"SFI012","series":"soul-food"}]},{"id":"R13","pref":"東京","prefecture":"東京都","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tokyo.html","foods":[{"name":"深川めし","sourceTitle":"深川めし／深川丼","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tokyo.html"},{"name":"もんじゃ焼き","sourceTitle":"もんじゃ焼き","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tokyo.html"},{"name":"親子丼","sourceTitle":"親子丼","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/34_12_tokyo.html","kind":"bowl","item":"SFI013","series":"soul-food"}]},{"id":"R14","pref":"神奈川","prefecture":"神奈川県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kanagawa.html","foods":[{"name":"けんちん汁","sourceTitle":"けんちん汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kanagawa.html"},{"name":"小田原かまぼこ","sourceTitle":"小田原かまぼこ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kanagawa.html"},{"name":"サンマーメン","sourceTitle":"サンマーメン","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/35_16_kanagawa.html","kind":"bowl","item":"SFI014","series":"soul-food"}]},{"id":"R15","pref":"山梨","prefecture":"山梨県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamanasi.html","foods":[{"name":"ほうとう","sourceTitle":"ほうとう","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamanasi.html"},{"name":"鳥もつ煮","sourceTitle":"鳥もつ煮","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamanasi.html"},{"name":"吉田のうどん","sourceTitle":"吉田のうどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/yoshida_no_udon_yama_nashi.html","kind":"bowl","item":"SFI015","series":"soul-food"}]},{"id":"R16","pref":"長野","prefecture":"長野県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nagano.html","foods":[{"name":"おやき","sourceTitle":"おやき","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nagano.html"},{"name":"野沢菜漬","sourceTitle":"野沢菜漬","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nagano.html"},{"name":"五平餅","sourceTitle":"五平餅","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/gohei_mochi_nagano.html","kind":"candy","item":"SFI016","series":"soul-food"}]},{"id":"R17","pref":"静岡","prefecture":"静岡県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shizuoka.html","foods":[{"name":"静岡おでん","sourceTitle":"静岡おでん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shizuoka.html"},{"name":"安倍川もち","sourceTitle":"安倍川もち","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shizuoka.html"},{"name":"黒はんぺんフライ","sourceTitle":"黒はんぺんフライ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/36_1_shizuoka.html","kind":"grill","item":"SFI017","series":"soul-food"}]},{"id":"R18","pref":"新潟","prefecture":"新潟県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/niigata.html","foods":[{"name":"笹団子","sourceTitle":"笹団子","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/niigata.html"},{"name":"へぎそば","sourceTitle":"へぎそば","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/niigata.html"},{"name":"タレかつ丼","sourceTitle":"タレかつ丼","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/tare_katsudon_niigata.html","kind":"bowl","item":"SFI018","series":"soul-food"}]},{"id":"R19","pref":"富山","prefecture":"富山県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/toyama.html","foods":[{"name":"ます寿司","sourceTitle":"ます寿司","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/toyama.html"},{"name":"白えびのかき揚げ","sourceTitle":"白えびのかき揚げ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/toyama.html"},{"name":"ほたるいかの酢味噌和え","sourceTitle":"ほたるいかの酢味噌和え","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/37_1_toyama.html","kind":"squid","item":"RGX005"},{"name":"とろろ昆布のおにぎり","sourceTitle":"とろろ昆布のおにぎり","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/37_7_toyama.html","kind":"stew","item":"SFI019","series":"soul-food"}]},{"id":"R20","pref":"石川","prefecture":"石川県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ishikawa.html","foods":[{"name":"じぶ煮","sourceTitle":"じぶ煮","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ishikawa.html"},{"name":"かぶらずし","sourceTitle":"かぶらずし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ishikawa.html"},{"name":"めった汁","sourceTitle":"めった汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/mettajiru_ishikawa.html","kind":"stew","item":"SFI020","series":"soul-food"}]},{"id":"R21","pref":"福井","prefecture":"福井県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukui.html","foods":[{"name":"へしこ","sourceTitle":"へしこ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukui.html"},{"name":"おろしそば","sourceTitle":"おろしそば","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukui.html"},{"name":"厚揚げの煮たの","sourceTitle":"厚揚げの煮たの","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/atsuage_nitano_fukui.html","kind":"stew","item":"SFI021","series":"soul-food"}]},{"id":"R22","pref":"岐阜","prefecture":"岐阜県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/gifu.html","foods":[{"name":"朴葉味噌","sourceTitle":"朴葉味噌","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/gifu.html"},{"name":"栗きんとん","sourceTitle":"栗きんとん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/gifu.html"},{"name":"飛騨駄菓子・豆板","sourceTitle":"飛騨駄菓子・豆板","source":"https://www.city.takayama.lg.jp/shisei/1015267/1009393/index.html","kind":"candy","item":"RGX009"},{"name":"飛騨駄菓子・こくせん","sourceTitle":"飛騨駄菓子・こくせん","source":"https://www.hidatakayama.or.jp/special/detail_290.html","kind":"candy","item":"RGX010"},{"name":"鶏ちゃん","sourceTitle":"鶏ちゃん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/38_2_gifu.html","kind":"grill","item":"SFI022","series":"soul-food"}]},{"id":"R23","pref":"愛知","prefecture":"愛知県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/aichi.html","foods":[{"name":"きしめん","sourceTitle":"きしめん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/aichi.html"},{"name":"味噌煮込みうどん","sourceTitle":"味噌煮込みうどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/aichi.html"},{"name":"味噌おでん","sourceTitle":"味噌おでん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/misooden_aichi.html","kind":"stew","item":"SFI023","series":"soul-food"}]},{"id":"R24","pref":"三重","prefecture":"三重県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/mie.html","foods":[{"name":"伊勢うどん","sourceTitle":"伊勢うどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/mie.html"},{"name":"てこねずし","sourceTitle":"てこねずし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/mie.html"},{"name":"いばら餅","sourceTitle":"いばら餅","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/ibara_mochi_mie.html","kind":"candy","item":"SFI024","series":"soul-food"}]},{"id":"R25","pref":"滋賀","prefecture":"滋賀県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shiga.html","foods":[{"name":"ふなずし","sourceTitle":"ふなずし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shiga.html"},{"name":"赤こんにゃく煮","sourceTitle":"赤こんにゃく煮","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shiga.html"},{"name":"鯖そうめん","sourceTitle":"鯖そうめん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/saba_soumen_shiga.html","kind":"bowl","item":"SFI025","series":"soul-food"}]},{"id":"R26","pref":"京都","prefecture":"京都府","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kyoto.html","foods":[{"name":"宇治金時","sourceTitle":"宇治金時","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kyoto.html"},{"name":"水無月","sourceTitle":"水無月","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kyoto.html"},{"name":"にしん茄子／茄子とにしんの炊いたん","sourceTitle":"にしん茄子／茄子とにしんの炊いたん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/nishinnasu_kyoto.html","kind":"stew","item":"SFI026","series":"soul-food"}]},{"id":"R27","pref":"大阪","prefecture":"大阪府","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/osaka.html","foods":[{"name":"たこ焼き","sourceTitle":"たこ焼き","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/osaka.html"},{"name":"きつねうどん","sourceTitle":"きつねうどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/osaka.html"},{"name":"串カツ","sourceTitle":"串カツ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/39_28_osaka.html","kind":"grill","item":"SFI027","series":"soul-food"}]},{"id":"R28","pref":"兵庫","prefecture":"兵庫県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hyogo.html","foods":[{"name":"明石焼","sourceTitle":"明石焼／玉子焼","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hyogo.html"},{"name":"イカナゴのくぎ煮","sourceTitle":"イカナゴのくぎ煮","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hyogo.html"},{"name":"かつめし","sourceTitle":"かつめし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/40_4_hyogo.html","kind":"bowl","item":"SFI028","series":"soul-food"}]},{"id":"R29","pref":"奈良","prefecture":"奈良県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nara.html","foods":[{"name":"柿の葉寿司","sourceTitle":"柿の葉寿司","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nara.html"},{"name":"飛鳥鍋","sourceTitle":"飛鳥鍋","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nara.html"},{"name":"茶粥","sourceTitle":"茶粥","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/chagayu_nara.html","kind":"stew","item":"SFI029","series":"soul-food"}]},{"id":"R30","pref":"和歌山","prefecture":"和歌山県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/wakayama.html","foods":[{"name":"梅干し","sourceTitle":"梅干し","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/wakayama.html"},{"name":"めはりずし","sourceTitle":"めはりずし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/wakayama.html"},{"name":"しらす丼","sourceTitle":"しらす丼","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/shirasu_don_wakayama.html","kind":"bowl","item":"SFI030","series":"soul-food"}]},{"id":"R31","pref":"鳥取","prefecture":"鳥取県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tottori.html","foods":[{"name":"とうふちくわ","sourceTitle":"とうふちくわ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tottori.html"},{"name":"らっきょう漬け","sourceTitle":"らっきょう漬け","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tottori.html"},{"name":"いただき","sourceTitle":"いただき","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/itadaki_tottori.html","kind":"stew","item":"SFI031","series":"soul-food"}]},{"id":"R32","pref":"島根","prefecture":"島根県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shimane.html","foods":[{"name":"出雲そば","sourceTitle":"出雲そば","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shimane.html"},{"name":"しじみ汁","sourceTitle":"しじみ汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/shimane.html"},{"name":"うずめ飯","sourceTitle":"うずめ飯","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/uzumemeshi_shimane.html","kind":"bowl","item":"SFI032","series":"soul-food"}]},{"id":"R33","pref":"岡山","prefecture":"岡山県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/okayama.html","foods":[{"name":"まつりずし","sourceTitle":"まつりずし／ばらずし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/okayama.html"},{"name":"ママカリの酢漬け","sourceTitle":"ママカリの酢漬け","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/okayama.html"},{"name":"ホルモンうどん","sourceTitle":"ホルモンうどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/41_19_okayama.html","kind":"bowl","item":"SFI033","series":"soul-food"}]},{"id":"R34","pref":"広島","prefecture":"広島県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hiroshima.html","foods":[{"name":"お好み焼き","sourceTitle":"お好み焼き","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hiroshima.html"},{"name":"かきの土手鍋","sourceTitle":"かきの土手鍋","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/hiroshima.html"},{"name":"あなご飯","sourceTitle":"あなご飯","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/42_30_hiroshima.html","kind":"bowl","item":"SFI034","series":"soul-food"}]},{"id":"R35","pref":"山口","prefecture":"山口県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamaguchi.html","foods":[{"name":"瓦そば","sourceTitle":"瓦そば","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamaguchi.html"},{"name":"岩国寿司","sourceTitle":"岩国寿司","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/yamaguchi.html"},{"name":"チキンチキンごぼう","sourceTitle":"チキンチキンごぼう","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/43_17_yamaguchi.html","kind":"stew","item":"SFI035","series":"soul-food"}]},{"id":"R36","pref":"徳島","prefecture":"徳島県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tokushima.html","foods":[{"name":"そば米雑炊","sourceTitle":"そば米雑炊／そば米汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tokushima.html"},{"name":"半田そうめん","sourceTitle":"半田そうめん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/tokushima.html"},{"name":"祖谷のでこまわし","sourceTitle":"祖谷のでこまわし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/44_3_tokushima.html","kind":"grill","item":"SFI036","series":"soul-food"}]},{"id":"R37","pref":"香川","prefecture":"香川県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kagawa.html","foods":[{"name":"しっぽくうどん","sourceTitle":"しっぽくうどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kagawa.html"},{"name":"しょうゆ豆","sourceTitle":"しょうゆ豆","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kagawa.html"},{"name":"まんばのけんちゃん","sourceTitle":"まんばのけんちゃん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/manbano_kenchan_kagawa.html","kind":"stew","item":"SFI037","series":"soul-food"}]},{"id":"R38","pref":"愛媛","prefecture":"愛媛県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ehime.html","foods":[{"name":"鯛めし","sourceTitle":"鯛めし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ehime.html"},{"name":"じゃこ天","sourceTitle":"じゃこ天","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/ehime.html"},{"name":"今治焼き鳥","sourceTitle":"今治焼き鳥","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/imabari_yakitori_ehime.html","kind":"grill","item":"SFI038","series":"soul-food"}]},{"id":"R39","pref":"高知","prefecture":"高知県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kochi.html","foods":[{"name":"かつおのたたき","sourceTitle":"かつおのたたき","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kochi.html"},{"name":"皿鉢料理","sourceTitle":"皿鉢料理","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kochi.html"},{"name":"田舎ずし","sourceTitle":"田舎ずし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/inakazushi_kochi.html","kind":"stew","item":"SFI039","series":"soul-food"}]},{"id":"R40","pref":"福岡","prefecture":"福岡県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukuoka.html","foods":[{"name":"がめ煮","sourceTitle":"がめ煮","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukuoka.html"},{"name":"若鶏の水炊き","sourceTitle":"若鶏の水炊き","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/fukuoka.html"},{"name":"博多ラーメン","sourceTitle":"博多ラーメン","source":"https://www.crossroadfukuoka.jp/en/spot/13220","kind":"ramen","item":"RGX003"},{"name":"イカタル弁当","sourceTitle":"イカタル弁当","source":"https://one-plate.city.omuta.lg.jp/articles/detail/6b1e7dfa-8b55-41fe-8c20-ca894fb57ed4","kind":"bento","item":"OMI001","hub":"KY17","city":"大牟田市"},{"name":"高専ダゴ","sourceTitle":"高専ダゴ","source":"https://one-plate.city.omuta.lg.jp/courses/detail/dbd4232a-5e8e-4f0e-a564-2b8d5ace16af","kind":"dago","item":"OMI002","hub":"KY17","city":"大牟田市"},{"name":"草木饅頭","sourceTitle":"草木饅頭","source":"https://one-plate.city.omuta.lg.jp/gifts/detail/1de59f8c-0fe6-4caf-8e9f-b33f676a6247","kind":"manju","item":"OMI003","hub":"KY17","city":"大牟田市"},{"name":"かしわめし","sourceTitle":"かしわめし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kashiwa_meshi_fukuoka.html","kind":"bowl","item":"SFI040","series":"soul-food"}]},{"id":"R41","pref":"佐賀","prefecture":"佐賀県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/saga.html","foods":[{"name":"須古ずし","sourceTitle":"須古ずし","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/saga.html"},{"name":"だぶ","sourceTitle":"だぶ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/saga.html"},{"name":"呼子のイカ","sourceTitle":"呼子のイカ","source":"https://www.asobo-saga.jp/galleries/detail/4e507602-a274-4fcc-a667-3f5e0c6f8814","kind":"squid","item":"RGX006"},{"name":"呉豆腐のごま醤油かけ","sourceTitle":"呉豆腐のごま醤油かけ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/45_14_saga.html","kind":"stew","item":"SFI041","series":"soul-food"}]},{"id":"R42","pref":"長崎","prefecture":"長崎県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nagasaki.html","foods":[{"name":"ちゃんぽん","sourceTitle":"ちゃんぽん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nagasaki.html"},{"name":"かんころ餅","sourceTitle":"かんころ餅","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/nagasaki.html"},{"name":"皿うどん","sourceTitle":"皿うどん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/46_7_nagasaki.html","kind":"bowl","item":"SFI042","series":"soul-food"}]},{"id":"R43","pref":"熊本","prefecture":"熊本県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kumamoto.html","foods":[{"name":"からし蓮根","sourceTitle":"からし蓮根","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kumamoto.html"},{"name":"いきなり団子","sourceTitle":"いきなり団子","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kumamoto.html"},{"name":"太平燕","sourceTitle":"太平燕","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/taipiien_kumamoto.html","kind":"bowl","item":"SFI043","series":"soul-food"}]},{"id":"R44","pref":"大分","prefecture":"大分県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/oita.html","foods":[{"name":"とり天","sourceTitle":"とり天","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/oita.html"},{"name":"やせうま","sourceTitle":"やせうま","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/oita.html"},{"name":"りゅうきゅう","sourceTitle":"りゅうきゅう","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/ryukyu_oita.html","kind":"stew","item":"SFI044","series":"soul-food"}]},{"id":"R45","pref":"宮崎","prefecture":"宮崎県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/miyazaki.html","foods":[{"name":"チキン南蛮","sourceTitle":"チキン南蛮","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/miyazaki.html"},{"name":"冷や汁","sourceTitle":"冷や汁","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/miyazaki.html"},{"name":"おび天","sourceTitle":"おび天","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/obiten_miyazaki.html","kind":"grill","item":"SFI045","series":"soul-food"}]},{"id":"R46","pref":"鹿児島","prefecture":"鹿児島県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kagoshima.html","foods":[{"name":"つけあげ","sourceTitle":"つけあげ","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kagoshima.html"},{"name":"かるかん","sourceTitle":"かるかん","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/kagoshima.html"},{"name":"鶏飯","sourceTitle":"鶏飯","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/keihan_kagoshima.html","kind":"bowl","item":"SFI046","series":"soul-food"}]},{"id":"R47","pref":"沖縄","prefecture":"沖縄県","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/okinawa.html","foods":[{"name":"ゴーヤーチャンプルー","sourceTitle":"ゴーヤーチャンプルー","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/okinawa.html"},{"name":"サーターアンダーギー","sourceTitle":"サーターアンダーギー","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/area/okinawa.html"},{"name":"沖縄そば","sourceTitle":"沖縄そば","source":"https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/47_20_okinawa.html","kind":"bowl","item":"SFI047","series":"soul-food"}]}];
const REGIONAL_ENEMY_SLOTS=[0,10,25,40,49,5,15,20,35,45];
const REGIONAL_ENEMY_TITLES=['湯気の精','ころころ丸','包みの番人','串ノイズ','おかわり小僧','名物の精','旅の番人','鉄板の精','白あん小僧','ふるさとの番人'];
const REGIONAL_BY_PREF=Object.assign(Object.create(null),Object.fromEntries(REGIONAL_SPECIALTIES.map(r=>[r.pref,r])));
for(const [ri,r]of REGIONAL_SPECIALTIES.entries())for(const [fi,f]of r.foods.entries()){const id=f.item||'RGI'+String(ri*2+fi+1).padStart(3,'0');f.item=id;ITEMS[id]={id,name:(f.city||r.pref)+'・'+f.name+'の旅包み',cat:(fi===1||f.kind==='candy'||f.kind==='manju')?'MP回復':'HP回復',target:'味方1人',eff:(fi===1||f.kind==='candy'||f.kind==='manju')?['c',5]:['hp',25],stars:2,tier:1,acq:'SD',price:(fi===1||f.kind==='candy'||f.kind==='manju')?40:24,sell:(fi===1||f.kind==='candy'||f.kind==='manju')?20:12,battleOnly:false,regionalPref:r.pref,regionalHub:f.hub||null,source:f.source,text:((fi===1||f.kind==='candy'||f.kind==='manju')?'味方1人のMPを5回復。':'味方1人のHPを25×V回復。')+(f.city||r.prefecture)+'の郷土料理「'+f.name+'」をモチーフにした創作道具。実物の健康効果ではありません。'};}
function regionalForHub(hub){const r=REGIONAL_BY_PREF[HUBS[hub]?.pref];return r?{...r,foods:r.foods.filter(f=>!f.hub||f.hub===hub)}:null;}
function regionalEnemy(areaId,idx){const r=regionalForHub(areaId.slice(0,4)),variant=REGIONAL_ENEMY_SLOTS.indexOf(idx);if(!r||variant<0)return null;const f=r.foods[variant<5?variant%2:variant-3];if(!f)return null;return {region:r,food:f,variant,name:(f.city?f.city+'・':'')+f.name+'の'+REGIONAL_ENEMY_TITLES[variant],profile:'RG:'+r.id+':'+variant+(f.kind?':'+f.kind:'')};}
function regionalItemDrop(st,run,e,res){if(!ITEMS[e.regionalItem]?.regionalPref)return false;const roll=run.regionalDropRolls?.[e.slot]??randInt(12);if(roll!==0)return false;giveItem(st,e.regionalItem,1,res,'名物モチーフの創作敵から');return true;}
function regionalGuideEnemyRefs(region,primaryArea,city){const areas=[primaryArea,...(city?[]:[...new Set(region.foods.map(f=>f.hub).filter(Boolean))].map(h=>h+'-A1'))];return areas.flatMap(area=>REGIONAL_ENEMY_SLOTS.map(idx=>({area,idx,data:regionalEnemy(area,idx)})).filter(x=>x.data&&(area===primaryArea||x.data.food.hub===area.slice(0,4))));}
function renderRegionalGuide(){const selected=G.sheetData.regionalPref,city=selected==='KY17'||(!selected&&curHub()==='KY17'),pref=REGIONAL_BY_PREF[selected]?.pref||HUBS[curHub()]?.pref||REGIONAL_SPECIALTIES[0].pref,hub=city?'KY17':Object.keys(HUBS).find(id=>HUBS[id].pref===pref&&id!=='KY17'),r=city?regionalForHub(hub):REGIONAL_BY_PREF[pref],hubs=Object.entries(HUBS).filter(([id,h])=>city?id==='KY17':h.pref===r.pref),area=hub+'-A1',V=Vof(partyLevel(G.st));return '<button class="btn primary" data-a="openSheet" data-k="collection">入手済み・未入手とコンプ数を見る</button><details class="regional-guide-note"><summary>ご当地図鑑の見方・出典</summary><p>47都道府県・154品。地元で親しまれる料理・郷土食を「ソウルフード」として47品追加。大牟田市限定のイカタル弁当・高専ダゴ・草木饅頭も収録。ラーメン・イカ料理・伝統駄菓子も収録。地域との対応は農林水産省・JNTO・自治体・公式観光資料を参照。道具の効果、敵の名前・姿はゲーム独自の創作です。県内の郷土料理を採用しており、各拠点の市町村が発祥とは限りません。</p></details><label class="dex-area-select">地域を選ぶ<select id="regionalAreaSelect">'+REGIONAL_SPECIALTIES.map(x=>'<option value="'+x.pref+'" '+(!city&&x.pref===r.pref?'selected':'')+'>'+x.pref+'</option>').join('')+'<option value="KY17" '+(city?'selected':'')+'>大牟田市（限定名物）</option></select></label><h3 class="label">'+(city?'大牟田市':r.prefecture)+'の名物（'+r.foods.length+'品）</h3><p class="small">県共通品の販売地域：'+hubs.map(([id,h])=>esc(h.name)).join('・')+'</p><div class="stack">'+r.foods.map(f=>{const it=ITEMS[f.item];return '<article class="m-card"><h3>'+esc(f.name)+(f.hub?' <span class="tag">'+esc(f.city)+'限定</span>':'')+(f.series==='soul-food'?' <span class="tag">ソウルフード</span>':'')+'</h3><p>'+esc(it.name)+'／'+it.price+'G</p><p>'+esc(itemText(it,V))+'</p><p class="small">'+(f.hub?'大牟田市限定。九州本編M16クリア後に訪問できる大牟田の店で購入。':'同じ都道府県の店で購入。')+'名物モチーフ敵の撃破時にも1/12で1個を抽選。所持上限・預かり所は通常道具と共通。</p><p><a href="'+esc(f.source)+'" target="_blank" rel="noopener noreferrer">地域・名物の出典</a></p></article>';}).join('')+'</div><h3 class="label">名物モチーフの創作敵</h3><div class="stack">'+regionalGuideEnemyRefs(r,area,city).map(({area:enemyArea,idx,data:d})=>{return '<article class="m-card"><div class="who"><canvas data-dex="'+enemyArea+'|'+idx+'" width="32" height="32" aria-hidden="true"></canvas><b>'+esc(d.name)+'</b></div><p class="small">'+esc(d.food.name)+'をモチーフにした架空のキャラクター。実在の料理・生産者を敵として扱う設定ではありません。</p></article>';}).join('')+'</div><p><a class="btn" href="'+r.source+'" target="_blank" rel="noopener noreferrer">都道府県の郷土料理資料を確認</a></p>';}

/* ---- 敵（第11・11E・11F・11J節） ---- */
function enemyDef(areaId, idx){ // idx 0..49
  const ar = AREAS[areaId]; const [pn, rr] = ar.list[idx]; const p = PROFILES[pn-1],local=regionalEnemy(areaId,idx);
  const out={ id:`EN-${areaId}-${String(idx+1).padStart(3,"0")}`, areaId, profile:p[0], shortName:(ar.specialStage!=null?"星域残響・":"")+["コメント渋滞","初見ロスト","枠テンポ乱し","エール空回り","ボーダー焦り"][idx%5]+"・"+p[1], name:`${ar.prefix}の${["コメント渋滞","初見ロスト","枠テンポ乱し","エール空回り","ボーダー焦り"][idx%5]}・${p[1]}`,
    species:p[2], attr:p[3], type:p[4], baseHP:p[5], baseDEF:p[6], cycle:p[7], trait:p[8], counter:p[9],
    rarity:rr, weight:[0,250,200,125,60,20][rr], q:ar.q };
  if(local)Object.assign(out,{profile:local.profile,shortName:local.name,name:local.region.pref+"・"+local.name,regionalItem:local.food.item,regionalFlavor:local.food.name,trait:out.trait+" 名物をモチーフにした創作敵。"});return out;
}
function pickEnemyIndex(areaId, r){ // r: 0..9999
  const ar=AREAS[areaId]; let acc=0;
  for(let i=0;i<50;i++){ acc+=[0,250,200,125,60,20][ar.list[i][1]]; if(r<acc) return i; }
  return 49;
}
function letters(i){ let s=""; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26);} return s; }
function assignLabels(enemies){
  const groups={}; enemies.forEach(e=>{ (groups[e.id]=groups[e.id]||[]).push(e); });
  Object.values(groups).forEach(g=>{ g.sort((a,b)=>a.slot-b.slot); g.forEach((e,i)=>{ e.display = g.length===1? e.name : `${e.name} ${letters(i)}`; }); });
}

/* ---- 戦闘run作成（第07B・08節） ---- */
function buildParty(st, L, supportStartA){
  ensureMemberXp(st);learnEquipped(st);
  return st.party.map((cid,pos)=>{
    const s = charStats(st,cid,L);
    const v = (st.vitals&&st.vitals[cid]) || {hp:s.maxHP, c:s.startC};
    return { cid, pos, L:s.L,V:s.V,jobRanks:clone(st.jp[cid]),name:charName(st,cid), job:s.job, R:s.R, S:s.S, maxHP:s.maxHP, hp:Math.max(0,Math.min(s.maxHP,v.hp)), c:Math.max(0,Math.min(s.startC,v.c)), maxC:s.startC, maxMP:s.startC, equip:previewEquipFor(st,cid,s.job), extraSkills:s.extraSkills, skillReady:{},
      ward:0, guard:false, acted:false, pouch:s.pouch, wAtk:s.wAtk, accAtk:s.accAtk, armorD:s.armorD,
      str:s.base.str, defBase:s.defBase, crit:s.crit, eva:s.eva, cha:s.cha, chaStat:s.base.cha,
      commentA:s.commentA, rest:s.rest, meter:s.meter, family:s.family, valid:0 };
  });
}
function trialOf(id){return POCO_TRIALS.find(t=>t.id===id);}
function trialMetrics(run){return run.trialMetrics||(run.trialMetrics={comments:0,people:[],skills:0,masters:0,family:0,guards:0,guardPeople:[]});}
function recordTrialAction(run,a,act){if(!run.challengeId)return;const m=trialMetrics(run);if(act.type==='comment'){m.comments++;if(!m.people.includes(a.cid))m.people.push(a.cid);}if(act.type==='skill'&&(!act.skillId||EXTRA_SKILLS[act.skillId]?.job||EXTRA_SKILLS[act.skillId]?.baseJob)){m.skills++;if(act.skillId&&EXTRA_SKILLS[act.skillId]&&EXTRA_SKILLS[act.skillId].rank)m.masters++;}if(act.type==='family')m.family++;if(act.type==='guard'){m.guards++;if(!m.guardPeople.includes(a.cid))m.guardPeople.push(a.cid);}}
function trialConditions(run){const d=trialOf(run.challengeId);if(!d)return [];const m=trialMetrics(run),out=[{label:`${d.turns}ターン以内`,ok:run.turn<=d.turns,value:run.turn}];
 const add=(key,label,val)=>{if(d[key])out.push({label:label+d[key],ok:val>=d[key],value:val});};
 add('comments','応援コメント ',m.comments);add('people','コメントした人数 ',m.people.length);add('skills','職業技の使用 ',m.skills);add('masters','熟練技・奥義の使用 ',m.masters);add('family','ファミリー応援 ',m.family);add('guards','ガードした人数 ',m.guardPeople.length);add('jobs','編成した職業数 ',new Set(run.party.map(p=>p.job)).size);add('party','編成人数 ',run.party.length);if(d.kira)out.push({label:'キラコメ連携を完成',ok:run.kiraDone,value:run.kiraDone?1:0});return out;
}
function trialRequirements(d){return [`${d.turns}ターン以内に撃破`,d.comments&&`応援コメント${d.comments}回`,d.people&&`異なる${d.people}人でコメント`,d.skills&&`職業技${d.skills}回`,d.masters&&`熟練技・奥義${d.masters}回`,d.family&&`ファミリー応援${d.family}回`,d.guards&&`異なる${d.guards}人がガード`,d.jobs&&`${d.jobs}職業以上`,d.party&&`${d.party}人編成`,d.kira&&'キラコメ連携完成'].filter(Boolean).join('／');}
function trialEntryReason(st,d){
 if(d?.specialStage!=null){if(d.level>progressionCap(st))return '次の地域編による上限Lv'+d.level+'以上の解放が必要です。';const s=SPECIAL_STAGES[d.specialStage];if(!st.bossDefeated[s.boss])return '該当する特設エリアのボス撃破で解放';if(partyLevel(st)<d.level-20)return 'パーティLv'+(d.level-20)+'以上が必要です。';}
 if(!d||st.quests[d.unlock]!=='complete')return `本編${d?d.unlock:''}のクリアで解放`;
 if(st.run||st.stream||st.careerSession||streamPending()||G.dlg||G.screen!=='explore'||!isSafe())return '街の安全地帯で、戦闘・配信・会話を終えてから挑戦できます。';
 const min=d.party||2;if(st.party.length<min)return `${min}人以上で編成してください。`;
 if(st.party.some(c=>vitalOf(c).hp<=0))return '戦闘メンバー全員を復活させてください。';
 if(d.jobs&&new Set(st.party.map(c=>st.jobs[c])).size<d.jobs)return `${d.jobs}種類の職業を編成してください。`;
 if(d.masters&&!st.party.some(c=>extraSkillsFor(st,c,characterLevel(st,c),st.jobs[c]).some(id=>EXTRA_SKILLS[id].rank)))return 'Lv・熟練度30以上などの条件を満たし、熟練技を使える仲間が必要です。';
 if(st.gold<d.fee)return `参加料${d.fee}ゴールドが必要です。`;
 if(!(st.challenges&&st.challenges[d.id]&&st.challenges[d.id].cleared)&&!eqCanAdd(st,d.reward,1)&&(st.keep||[]).length>=KEEP_MAX)return '初回報酬を受け取るため、装備品か預かり所に空きを作ってください。';
 return '';
}
function createChallengeRun(st,d){const run=createBossRun(st,d.boss);run.kind='challenge';run.challengeId=d.id;run.hub=curHub();run.areaId=Object.keys(AREAS).find(a=>a.startsWith(run.hub))||'KY01-A3';run.turnLimit=d.turns;trialMetrics(run);for(const e of run.enemies){e.maxHP=e.hp=Math.ceil(e.maxHP*1.15);e.atkMult*=1.12;}
 if(d.specialStage!=null)run.mpLeak=2+d.specialStage;
 if(d.id==='CH01')run.enemies[0].cycle[1]={t:'c',p:0};
 if(d.id==='CH03')run.aleLeak=6;
 if(d.id==='CH04')run.enemies[0].def=Math.ceil(run.enemies[0].def*1.5);
 if(d.id==='CH06')run.mpLeak=2;
 if(d.id==='CH07'||d.id==='CH08')for(let k=0;k<(d.id==='CH08'?2:1);k++){const hp=Math.ceil(run.enemies[0].maxHP*0.18),name=k?'コメント詰まりの残響':'ボーダーの残響';run.enemies.push({slot:k+1,id:d.id+'ADD'+k,name,display:name,profile:'P01',species:PROFILES[0][2],attr:PROFILES[0][3],rarity:3,maxHP:hp,hp,def:Math.floor(d.q/3)+5,cycle:[{t:'s',p:Math.ceil(8+d.q*.8)},{t:'c',p:0},{t:'a',p:Math.ceil(5+d.q*.5)}]});}
 return run;}
function startChallenge(id){const st=G.st,d=trialOf(id);if(battleEntryReason(st))return false;const reason=trialEntryReason(st,d);if(reason){toast(reason);return false;}if(!exteriorBattleReady(st))return false;const run=createChallengeRun(st,d);st.gold-=d.fee;st.challenges=st.challenges||{};const r=st.challenges[id]||(st.challenges[id]={});r.attempts=(r.attempts||0)+1;G.sheet=null;startBattle(run);return true;}
function challengeReward(st,run,res){
 const d=trialOf(run.challengeId),passed=d&&trialConditions(run).every(c=>c.ok);st.challenges=st.challenges||{};const record=st.challenges[run.challengeId]||(st.challenges[run.challengeId]={attempts:1});const first=!!passed&&!record.cleared;
 res.challenge={id:run.challengeId,name:d?d.name:'特別チャレンジ',passed:!!passed,first,conditions:trialConditions(run)};
 if(!passed){res.notes.push('討伐は成功しましたが、課題未達のためチャレンジは未クリアです。報酬・経験値・熟練度は得られません。');return;}
 if(!first){res.notes.push('クリア済みの練習挑戦です。報酬・経験値・熟練度は初回達成時のみです。');return;}
 if(!giveGear(st,d.reward,res,'特別チャレンジ初回達成')){res.challenge.first=false;res.challenge.passed=false;res.notes.push('報酬の保管場所がいっぱいです。空きを作って再挑戦してください。');return;}
 record.cleared=true;record.bestTurns=run.turn;record.day=st.day;res.xp=d.specialStage!=null?specialXP(SPECIAL_STAGES[d.specialStage])*5:60+d.q*6;res.gold=150+d.q*20;res.tickets=100;res.xp=Math.max(0,...Object.values(awardExperience(st,res.xp,run.party.map(m=>m.cid))));st.gold+=res.gold;st.tickets+=res.tickets;res.notes.push('特別チャレンジ「'+d.name+'」初回達成！ 限定装備を獲得。');
}
function renderChallenges(){const st=G.st;return `<p>Pocochaを題材にした特別実技チャレンジ。本編とは別の達成記録です。</p><p class="small">ボス戦・特別チャレンジでもオート使用可。課題は自動達成されません。街の安全地帯から挑戦。参加料は毎回必要です。HP・MP・道具は持ち越し、制限ターン超過は失敗。全滅時の追加ゴールド損失はありません。報酬・経験値・熟練度は初回達成のみ。</p><div class="stack">${[...POCO_TRIALS].sort((a,b)=>Number(b.id===G.sheetData.specialFocus)-Number(a.id===G.sheetData.specialFocus)).map(d=>{const r=(st.challenges||{})[d.id]||{},reason=trialEntryReason(st,d);return `<section class="setcard"><h3 class="label">${esc(d.name)} ${r.cleared?'✓ 達成済み':''}</h3><p>${esc(d.desc)}</p><p class="small">推奨レベル${d.level}／参加料${d.fee}G／挑戦${r.attempts||0}回</p><p>${esc(trialRequirements(d))}</p><p class="small good">初回報酬：${esc(EQUIP[d.reward].name)}・経験値${d.specialStage!=null?specialXP(SPECIAL_STAGES[d.specialStage])*5:60+d.q*6}・${150+d.q*20}G・チケット100</p>${reason?`<p class="small warn">${esc(reason)}</p>`:''}<button class="btn primary" data-a="trialStart" data-v="${d.id}" ${reason?'disabled':''}>${r.cleared?'練習に挑戦（報酬なし）':'参加料を払って挑戦'}</button></section>`;}).join('')}</div>`;}
function localFestivalStatus(st,hub){return {talks:Object.entries(NPCS).filter(([id,n])=>n.hub===hub&&id!=='moe'&&st.talked[id]).length,wins:(st.townBattles||{})[hub]||0,rank:Math.max(...st.roster.map(c=>jobRank(st,c,st.jobs[c])))};}
function renderTownStudio(){const st=G.st,hub=curHub(),theme=POCO_TOWNS[HUB_ORDER.indexOf(hub)];if(!theme)return '<p>街の交流所で利用できます。</p>';const s=localFestivalStatus(st,hub),done=(st.festivals||{})[hub];return `${specialReminder(st)}<button class="btn" data-a="openSheet" data-k="specialTracker">特別エリア・クリア状況</button><button class="btn primary" data-a="familyParty">同行者の編成・入れ替え（最大4人）</button><button class="btn primary" data-a="openSheet" data-k="characterStories">仲間の物語・固有必殺技・恋愛</button><div class="row3"><button class="btn" data-a="openSheet" data-k="careerTour">グラドル活動</button><button class="btn" data-a="openSheet" data-k="storyJournal">事件・謎解き帳</button><button class="btn" data-a="openSheet" data-k="relationships">人物相関図</button><button class="btn" data-a="openSheet" data-k="japanMap">日本地図</button></div><button class="btn primary" data-a="openSheet" data-k="nextChapter">全国ツアーの進行</button><button class="btn" data-a="openSheet" data-k="specialWorld">特設エリア・Lv999への道</button><h3 class="label">${esc(theme[1])}</h3><p>${esc(done?theme[3]:theme[2])}</p><p class="small">各街1回の任意イベント。本編の受注枠は使いません。</p><ul class="list"><li>${s.talks>=2?'✓':'未'} 住民2人と会話（${s.talks}人）</li><li>${s.wins>=2?'✓':'未'} この街の通常戦闘に2勝（${s.wins}勝・本更新後の勝利）</li><li>${s.rank>=3?'✓':'未'} 現在の職業で熟練度3以上の仲間（最高${s.rank}）</li></ul><p>報酬：${60+HUB_ORDER.indexOf(hub)*20}G・チケット40・コア交流の差し入れ2個</p><button class="btn primary" data-a="festivalClaim" ${done||s.talks<2||s.wins<2||s.rank<3?'disabled':''}>${done?'祭り開催済み':'街イベントを達成する'}</button><button class="btn" data-a="openSheet" data-k="challenges">特別チャレンジ受付</button><button class="btn" data-a="openSheet" data-k="gearEvents">街の装備依頼（報酬250種）</button><button class="btn" data-a="openSheet" data-k="gearRematches">ボス再戦受付</button><button class="btn" data-a="openSheet" data-k="gearCatalog">追加装備図鑑（1,000種）</button><p class="small">戦闘のエール・連携・技・運賃はゲーム独自の設定です。実サービスの応援ポイント計算式やイベント条件を再現するものではありません。</p>`;}
function claimFestival(){const st=G.st,hub=curHub(),s=localFestivalStatus(st,hub);if(G.readOnly||st.run||st.stream||!isSafe()||s.talks<2||s.wins<2||s.rank<3||(st.festivals||{})[hub])return false;st.festivals=st.festivals||{};st.festivals[hub]=true;st.gold+=60+HUB_ORDER.indexOf(hub)*20;st.tickets+=40;giveItem(st,'PC02',2,null,'街イベント');commit();render();say([['',POCO_TOWNS[HUB_ORDER.indexOf(hub)][3]],['もえ','私たちの枠にも、この街でできた家族みたいな絆を持って帰ろう。']]);return true;}
function pocoBattleStatusFull(run){if(!run.pocoRules)return '';const d=trialOf(run.challengeId);return `<div class="poco-battle"><b>${d?'特別チャレンジ：'+esc(d.name):run.enemies.some(e=>e.boss)?'ライバル枠との決戦':'枠を乱すノイズ戦'}</b>${run.enemies.some(e=>e.boss)?`<p class="small">ノイズシールド：${run.A<40&&!run.kiraDone?'通常攻撃を35％軽減。エール40以上・キラコメ完成で解除。職業技は軽減されません。':'解除中'}／6ターン目以降は3ターンごとに敵攻撃＋10％（最大50％）</p>`:''}${run.aleLeak?'<p class="small">毎ターン、エール−'+run.aleLeak+'</p>':''}${run.mpLeak?'<p class="small">毎ターン、生存者全員のMP−'+run.mpLeak+'</p>':''}${d?`<ul class="list">${trialConditions(run).map(c=>`<li>${c.ok?'✓':'未'} ${esc(c.label)}（現在${c.value}）</li>`).join('')}</ul>`:''}</div>`;}

function pocoBattleStatus(run){const d=trialOf(run.challengeId),boss=run.enemies.some(e=>e.boss);if(!boss&&!d)return '';const conditions=d?trialConditions(run):[];return `<button class="battle-rule" data-a="battleInspect" data-v="rules">オート使用可${boss&&run.pocoRules?`／シールド${run.A<40&&!run.kiraDone?'有効':'解除'}`:''}${d?`／課題${conditions.filter(c=>c.ok).length}/${conditions.length}・${run.turn}/${run.turnLimit}T`:''} ▶</button>`;}
function baseRun(st, kind){
  const L = partyLevel(st), diff = DIFFICULTY[st.settings.difficulty];
  let A0 = diff.startA; const sup = st.support && SUPPORTS[st.support];
  if(sup) A0 += sup.startA||0;
  return { seq: st.runSeq+1, kind, levelCap:progressionCap(st), pocoRules:1, L, V:Vof(L), difficulty:st.settings.difficulty, support:st.support,
    party: buildParty(st,L), enemies:[], turn:1, A:Math.min(100,A0), B:0,
    chain:{stage:0, members:[]}, kiraDone:false, firstKill:false,
    cue:null, log:[], state:"input", rewardsApplied:false, bag:clone(st.bag||[]) };
}
/* 戦闘開始時とターン開始時の職業特性 */
function traitsBattleStart(run){
  for(const m of run.party){ if(m.hp<=0) continue;
    if(m.cid==='moe'){const old=run.A;run.A=Math.min(100,run.A+6);run.log.push(m.name+'の固有特性「帰る声」：エール＋'+(run.A-old));}
    if(m.cid==='kayo'){for(const t of alive(run)){const g=Math.min(2,t.maxC-t.c);if(g>0){t.c+=g;run.log.push(m.name+'の「食卓のぬくもり」：'+t.name+' MP＋'+g);}}}
    if(hasTrait(m,"J02")){run.B=4;run.log.push(m.name+"の自動化スクリプト：コメント連携4。");}
    if(hasTrait(m,"J08")){const g=battleAleGain(run,10);run.log.push(m.name+"の配信慣れ：エール＋"+g+"（上限100）。");}
    if(hasTrait(m,"J20")){const g=battleAleGain(run,6);for(const t of alive(run))t.ward=Math.min(8,t.ward+2);run.log.push(m.name+"の道案内：生存者に防護＋2（上限8）、エール＋"+g+"（上限100）。");}
  }
  traitsTurnStart(run, run.log);
}
function traitsTurnStart(run, log){
  const al=alive(run);
  for(const m of al){
    if(hasTrait(m,"J01")) m.ward=Math.min(8,m.ward+1);
    if(hasTrait(m,"J12")){ const t=al.slice().sort((x,y)=>x.hp/x.maxHP-y.hp/y.maxHP)[0]; const g=Math.min((3+m.S)*(m.V||run.V), t.maxHP-t.hp); if(g>0){ t.hp+=g; log.push(`${m.name}のやりくり：${t.name}のHP＋${g}`); } }
    if(hasTrait(m,"J14")){ const o=al.filter(t=>t!==m).sort((x,y)=>x.c-y.c)[0]; if(o&&o.c<(o.maxC||10)){ o.c+=1; log.push(`${m.name}のまかない：${o.name}のMP＋1`); } }
  }
}
function fieldEnemyStats(d,q,diff=DIFFICULTY.std){const ar=AREAS[d.areaId];if(ar?.regionalLevel){const L=ar.regionalLevel,r=(d.rarity||1)-1;return {hp:Math.ceil((d.baseHP+L*(16+L*.045))*(1+r*.12)*diff.hp),def:Math.ceil(L*.4)+d.baseDEF,cycle:d.cycle.map(([t])=>({t,p:t==='c'?0:Math.ceil(L*(t==='s'?3.8+L*.006:2.6+L*.004)*(1+r*.04)*diff.atk)}))};}const stage=AREAS[d.areaId]?.specialStage;if(stage!=null){const s=SPECIAL_STAGES[stage],L=s.level,r=(d.rarity||1)-1;return {hp:Math.ceil(L*(42+stage*2)*(1+r*.1)*diff.hp),def:Math.ceil(L*.65),cycle:d.cycle.map(([t])=>({t,p:t==='c'?0:Math.ceil(L*(t==='s'?4+stage*.12:3.4+stage*.1)*(1+r*.04)*diff.atk)}))};}const T=ENEMY_TUNE,rb=(d.rarity||1)-1,x=areaStrength(q);return {
 hp:Math.ceil((d.baseHP+12*(q-1))*diff.hp*T.hp*(1+T.rarHp*rb)*x.hp),
 def:d.baseDEF+Math.floor((q-1)/3)+T.def+(rb>=2?1:0)+x.def,
 cycle:d.cycle.map(([t,p])=>({t,p:t==='c'?0:Math.ceil((p*T.atkMul+T.atkAdd+Math.floor(4*(q-1)/5))*(1+T.rarAtk*rb)*diff.atk*x.atk)}))};}
function createFieldRun(st, areaId, rolls){ // rolls: {count:0|1, picks:[r0,r1]}
  const run = baseRun(st,"field"); const ar=AREAS[areaId]; const q=ar.q; const diff=DIFFICULTY[run.difficulty];
  run.areaId=areaId; run.q=q; run.hub=areaId.slice(0,4); run.returnPos={map:st.mapId,x:st.pos.x,y:st.pos.y};
  const n = encounterSize(q, rolls.count);
  for(let s=0;s<n;s++){
    const d = enemyDef(areaId, pickEnemyIndex(areaId, rolls.picks[s]));
    const stats=fieldEnemyStats(d,q,diff),hp=stats.hp;
    run.enemies.push({ slot:s, id:d.id, name:d.shortName, fullName:d.name, profile:d.profile, species:d.species, attr:d.attr, rarity:d.rarity,regionalItem:d.regionalItem||null,regionalFlavor:d.regionalFlavor||null,
      maxHP:hp, hp, def:stats.def,
      cycle:stats.cycle });
  }
  assignLabels(run.enemies);
  traitsBattleStart(run);
  return run;
}
function createBossRun(st, bossId){
  const run = baseRun(st,"boss"); const b=BOSSES[bossId]; const q=b.q; const diff=DIFFICULTY[run.difficulty];
  run.bossId=bossId; run.areaId=b.areaId; run.q=q; run.hub=b.hub; run.returnPos={map:st.mapId,x:st.pos.x,y:st.pos.y};
  // 少人数補正：戦闘開始時の人数で固定（4人で指示書どおり）
  const ps = bossScale(bossId, run.party.length);
  run.partyScale = ps;
  const hp = Math.ceil((100+36*q)*diff.hp*ps.hp*BOSS_HP_UP*ENEMY_TUNE.bossHp); // v5.32：メーター突破の一点集中と支援対処の分、HPを上げて手応えを保つ
  run.enemies.push({ slot:0, id:bossId, name:b.name, display:b.name, boss:true, maxHP:hp, hp, def:8+Math.floor(q*0.6),
    cycle:[{t:"s",p:12+q+ENEMY_TUNE.bossAdd},{t:"a",p:6+Math.floor(q/2)+ENEMY_TUNE.bossAdd},{t:"c",p:0},{t:"a",p:10+3*q+ENEMY_TUNE.bossAdd,heavy:true}], atkMult:diff.atk*ps.atk*ENEMY_TUNE.bossAtk });
  if(b.specialStage!=null){const s=SPECIAL_STAGES[b.specialStage],L=s.level,e=run.enemies[0];e.maxHP=e.hp=Math.ceil(L*(145+s.index*8)*diff.hp);e.def=Math.ceil(L*.9);e.atkMult=diff.atk;e.cycle=[{t:'s',p:Math.ceil(L*(4.8+s.index*.16))},{t:'a',p:Math.ceil(L*(3.4+s.index*.1))},{t:'c',p:0},{t:'a',p:Math.ceil(L*(5.6+s.index*.18)),heavy:true}];}
  if(b.regionalLevel||b.chapterLevel||b.specialStage!=null){const x=regionBossProfile(b,diff,ps),e=run.enemies[0];Object.assign(e,{maxHP:x.hp,hp:x.hp,def:x.def,atkMult:x.atkMult,cycle:x.cycle});}
  run.cue = {kind:b.cue, bits:[], ready:false, active:false};
  traitsBattleStart(run);
  return run;
}

/* ---- 予告（第08・11D節） ---- */
function alive(run){ return run.party.filter(p=>p.hp>0); }
function pickTarget(run, pos){
  const tank = run.party.find(m=>m.hp>0 && m.guard && hasTrait(m,"J03"));
  if(tank) return tank.pos;
  const t = run.party[pos];
  if(t && t.hp>0) return pos;
  const al = alive(run); if(!al.length) return -1;
  let best = al[0]; for(const p of al){ if(p.hp<best.hp) best=p; }
  return best.pos;
}
function enemyAction(run, e){
  const step = e.cycle[(run.turn-1)%e.cycle.length];
  let power = step.p;
  if(e.boss){
    const cueMult = (step.heavy && run.cue && run.cue.ready) ? 0.8 : 1;
    power = step.t==="c" ? 0 : Math.ceil(step.p * e.atkMult * cueMult);
  }
  if(e.boss&&run.pocoRules&&run.turn>=6&&power>0)power=Math.ceil(power*(1+Math.min(0.5,0.1*(1+Math.floor((run.turn-6)/3)))));
  if(e.rage && power>0) power = Math.ceil(power*(e.boss?ENEMY_TUNE.bossRage:ENEMY_TUNE.rage));
  const res = { type: step.t, power, heavy: !!step.heavy, rage: !!e.rage };
  if(step.t==="s") res.target = pickTarget(run, (run.turn-1+e.slot)%run.party.length);
  return res;
}
function telegraph(run){ return run.enemies.filter(e=>e.hp>0).map(e=>({slot:e.slot, ...enemyAction(run,e)})); }
function startTurnCue(run){
  // 怒り：ターン開始時にHPが一定以下なら以後の攻撃が強くなる（予告にも反映）
  for(const e of run.enemies){ if(e.hp>0 && !e.rage && e.hp<=e.maxHP*(e.boss?ENEMY_TUNE.bossRageAt:ENEMY_TUNE.rageAt)){ e.rage=true; run.rageNew=(run.rageNew||[]).concat(e.slot); } }
  if(!run.cue) return;
  if(run.turn%4===3){ run.cue.active=true; run.cue.bits=[]; run.cue.ready=false; }
  else run.cue.active=false;
}

/* ---- 行動の検証と適用（第09・10・10F節） ---- */
function effectiveEnemyDefense(actor,enemy,ignore=false){return ignore?0:hasTrait(actor,"J16")?Math.floor(enemy.def/2):enemy.def;}
function battleQuake(run){return run.party.some(m=>m.hp>0&&hasTrait(m,"J17"))?2*run.V:0;}
function incomingDamage(run,target,act,critical=false,quake=battleQuake(run)){
 let n=critical?Math.ceil(act.power*1.5):Math.max(0,act.power-(target.defBase||0)-(target.V||run.V)*(target.armorD+target.ward)-(act.type==='a'?quake:0));
 return target.guard?Math.ceil(n/2):n;
}
function battleAleGain(run,amount){const old=run.A;run.A=Math.min(100,run.A+amount);return run.A-old;}
function singleDamage(run, actor, extra, enemy, opts={}){
  const L=actor.L||run.L, V=actor.V||run.V;
  const def=effectiveEnemyDefense(actor,enemy,opts.ignoreDef);
  const atk = opts.noGear ? 0 : actor.wAtk + actor.accAtk;
  let ex = extra, B = run.B;
  if(opts.kind==="attack" && hasTrait(actor,"J05")) ex+=3;
  if(hasTrait(actor,"J06") && actor.hp<=actor.maxHP*0.3) ex+=8;
  if(hasTrait(actor,"J19")){ const st=enemy.cycle[(run.turn-1)%enemy.cycle.length]; if(st&&st.t==="c") ex+=6; }
  if(hasTrait(actor,"J21")) B=Math.ceil(B*1.5);
  const power = actor.str!=null ? actor.str : 10+2*L;
  const damage=Math.max(1,power+V*(ex+atk+B)-def);
  return opts.kind==="attack"&&enemy.boss&&run.pocoRules&&run.A<40&&!run.kiraDone?Math.max(1,Math.floor(damage*0.65)):damage;
}
function chainAdvance(run, actor, line){
  if(run.kiraDone) return false;
  const st=run.chain.stage, mem=run.chain.members.includes(actor.cid);
  return (line==="greet"&&st===0) || (line==="plan"&&st===1&&!mem) || (line==="thanks"&&st===2&&!mem);
}
function cueProgress(run, actor, kind){
  return !!(run.cue && run.cue.active && !run.cue.ready && run.cue.kind===kind && !run.cue.bits.includes(actor.cid));
}
/* 行動の予測と可否。effects 配列は適用用の差分を表す */
function planAction(run, idx, act){
  const a = run.party[idx];
  if(!a || a.hp<=0) return {ok:false, reason:"戦闘不能です。"};
  const S=a.S, V=a.V||run.V, L=a.L||run.L;
  if(a.acted) return {ok:false, reason:"このターンは行動済みです。"};
  if(run.state!=="input") return {ok:false, reason:"入力待ちではありません。"};
  const al = alive(run); const en = run.enemies.filter(e=>e.hp>0);
  const p = { ok:true, cost:{c:0,a:0,hp:0}, dmg:[], heal:[], cgain:[], ward:[], aGain:0, setB:null, consumeB:false, chain:null, cue:null, text:[], valid:false, kind:act.type };
  const needEnemy = () => { const e = run.enemies.find(x=>x.slot===act.target && x.hp>0); return e; };
  const needAlly = (other) => { const t = run.party[act.ally]; if(!t||t.hp<=0) return null; if(other && t===a) return null; return t; };
  const heal = (t,amt)=>{ if(act.type==="skill" && a.cha) amt=Math.ceil(amt*(1+a.cha/100)); // 魅力補正：技能の回復量
    if(a.cid==="mio"&&act.type==="skill")amt=Math.ceil(amt*1.1);
    if(hasTrait(a,"J13") && t.hp<=t.maxHP*0.3) amt=Math.ceil(amt*1.5);
    const g=Math.min(amt, t.maxHP-t.hp); p.heal.push({pos:t.pos, amt:g}); if(g>0) p.valid=true;
    if(g>0 && hasTrait(a,"J18")) addWard(t,2);
    return g; };
  const addC = (t,amt,afterPay)=>{ const base = t===a? a.c - p.cost.c : t.c; const g=Math.min(amt, (t.maxC||10)-base); p.cgain.push({pos:t.pos, amt:Math.max(0,g)}); if(g>(t===a?p.cost.c:0)) p.valid=true; return g; };
  const addWard=(t,amt)=>{ const g=Math.min(amt, 8-t.ward-p.ward.filter(w=>w.pos===t.pos).reduce((s,w)=>s+w.amt,0)); p.ward.push({pos:t.pos, amt:Math.max(0,g)}); if(g>0) p.valid=true;
    if(g>0 && hasTrait(a,"J03") && t!==a && !(p.j03c||[]).includes(t.pos)){ (p.j03c||(p.j03c=[])).push(t.pos); addC(t,1); } };
  const gainA=(amt)=>{ const g=Math.min(amt, 100-run.A-p.aGain+p.cost.a); p.aGain+=amt; if(g>0) p.valid=true; };
  const attackSingle=(extra,opts={})=>{
    const e=needEnemy(); if(!e) return false;
    const d=singleDamage(run,a,extra,e,opts); const cr=Math.ceil(singleDamage(run,a,extra,e,{...opts,ignoreDef:true})*1.5);
    p.dmg.push({slot:e.slot, amt:Math.min(d,e.hp), raw:d, critRaw:cr}); p.valid=true;
    p.consumeB=true; p.aGain+=8; return true;
  };
  const payC=(n)=>{ if(a.c<n){ p.ok=false; p.reason=`MPが足りません（必要${n}）。`; return false;} p.cost.c=n; return true; };
  const commentLike=(baseA)=>{
    const line=act.line; if(!LINE_NAMES[line]){ p.ok=false; p.reason="台詞を選んでください。"; return; }
    if(!payC(1)) return;
    const aAmt = baseA + a.commentA + (hasTrait(a,"J22")?6:0);
    const aRoom = 100-run.A; const bChange = run.B!==4;
    const adv = chainAdvance(run,a,line); const cue = cueProgress(run,a,"comment");
    p.aGain += aAmt+(a.cid==='tsumugi'&&adv?3:0); p.setB=4; p.chain={line, adv}; p.cue = cue?"comment":null;
    p.valid = aRoom>0 || bChange || adv || cue;
    if(!p.valid){ p.ok=false; p.reason="エール100・コメント連携4で、連携も進まないため効果がありません。"; }
  };
  switch(act.type){
    case "attack":
      if(!attackSingle(0,{kind:"attack"})){ p.ok=false; p.reason="対象の敵を選んでください。"; }
      p.text.push("通常攻撃"); if(hasTrait(a,"J05")) p.aGain+=4;
      break;
    case "comment":
      commentLike(18);
      break;
    case "guard":
      p.guard=true; if(a.cid==='kohei')addWard(a,2); p.cgain.push({pos:a.pos, amt:Math.min(1,(a.maxC||10)-a.c)}); p.cue = cueProgress(run,a,"guard")?"guard":null;
      { const pv=p.valid; p.valid=false; if(hasTrait(a,"J09")) al.forEach(t=>addWard(t,1)); p.valid = pv || !!p.cue || p.valid || (hasTrait(a,"J03") && run.enemies.some(e=>e.hp>0 && enemyAction(run,e).type==="s")); }
      break;
    case "rest": {
      const g=Math.min(4+a.rest, (a.maxC||10)-a.c);
      const hh = hasTrait(a,"J07") ? Math.min((6+S)*V, a.maxHP-a.hp) : 0;
      if(g<=0 && hh<=0){ p.ok=false; p.reason=hasTrait(a,"J07")?"MPもHPも最大です。":"MPは最大です。"; break; }
      if(g>0) p.cgain.push({pos:a.pos, amt:g}); if(hh>0) p.heal.push({pos:a.pos, amt:hh}); p.valid=false; break; }
    case "family": {
      if(run.A<40){ p.ok=false; p.reason="エールが40必要です。"; break; }
      p.cost.a=40; const amt=Math.ceil((12+a.family)*V*(1+(a.cha||0)/100)); let any=false; /* 魅力補正が効く */
      for(const t of run.party){ if(t.hp<=0){ p.heal.push({pos:t.pos, amt:Math.min(amt,t.maxHP), revive:true}); any=true; } else { const g=Math.min(amt,t.maxHP-t.hp); p.heal.push({pos:t.pos,amt:g}); if(g>0) any=true; } }
      for(const t of al){const before=p.ward.length;addWard(t,1);if(p.ward.slice(before).some(w=>w.amt>0))any=true;}p.valid=any; if(!any){ p.ok=false; p.reason="全員のHPと防護が最大です。"; }
      break; }
    case "meter": {
      if(run.A<80){ p.ok=false; p.reason="エールが80必要です。"; break; }
      p.cost.a=80;
      // 一点集中：残る敵が1体なら威力1.5倍（v5.32 ボス戦向け）
      for(const e of en){ let d=Math.max(1, 24+6*L + V*a.meter + Math.floor((a.chaStat||0)/3) - effectiveEnemyDefense(a,e)); /* 使う人の魅力÷3を上乗せ */ if(en.length===1) d=Math.ceil(d*1.5); p.dmg.push({slot:e.slot, amt:Math.min(d,e.hp), raw:d}); }
      p.valid=true; p.all=true; break; }
    case "item": planItem(run,a,act,p,{needEnemy,needAlly,heal,addC,V}); break;
    case "skill": planSkill(run,a,act,p,{needEnemy,needAlly,heal,addC,addWard,attackSingle,payC,commentLike,gainA,S,V,L,al,en}); break;
    default: p.ok=false; p.reason="不明な行動です。";
  }
  if(p.ok&&act.type==='skill'&&!p.valid){p.ok=false;p.reason='今は効果がありません。';}
  if(p.ok&&a.cid==='gaku'&&!p.item)for(const d of p.dmg){const e=run.enemies.find(e=>e.slot===d.slot);if(e?.boss){d.raw=Math.ceil(d.raw*1.08);d.amt=Math.min(e.hp,d.raw);if(d.critRaw!=null)d.critRaw=Math.ceil(d.critRaw*1.08);}}
  // エールの倍率（拡散力・魅力補正）は計画の段階で掛け、確定前の表示と実際を一致させる（v5.34）
  if(p.ok && p.aGain>0 && !p.item){ if(hasTrait(a,"J11")) p.aGain=Math.ceil(p.aGain*1.3); if(a.cha) p.aGain=Math.ceil(p.aGain*(1+a.cha/100)); }
  // コメント以外の確定行動は連携を0へ
  if(p.ok && !p.chain) p.chainReset = run.chain.stage>0;
  // 攻勢型ボス対処（道具は対処に数えない）
  if(p.ok && !p.item && p.dmg.some(d=>d.amt>0) && cueProgress(run,a,"damage")) p.cue="damage";
  // 支援で対処：ボスの「ため」中に、攻撃しない技能（回復・防護・エール）を使っても対処に数える（v5.32）
  if(p.ok && !p.cue && act.type==="skill" && !p.dmg.length && p.valid && run.cue && run.cue.active && !run.cue.ready && !run.cue.bits.includes(a.cid)) p.cue=run.cue.kind;
  return p;
}
function planSkill(run,a,act,p,h){
  if(act.skillId){const sk=EXTRA_SKILLS[act.skillId];if(sk?.job&&sk.job!==a.job)h={...h,S:Kof(Math.min(run.levelCap||100,rankOf(a.jobRanks?.[sk.job]||0)))};return planExtraSkill(run,a,act,p,h);}
  const {S,V,L}=h;
  const need=(m)=>{ p.ok=false; p.reason=m; };
  switch(act.castJob||a.job){
    case "J01": if(!h.payC(3))return; if(!h.attackSingle(8+2*S)){need("対象の敵を選んでください。");return;} h.addWard(a,2); break;
    case "J02": if(!h.payC(1))return; h.commentLike(30+S); break;
    case "J03": { if(!h.payC(2))return; const t=h.needAlly(); if(!t){need("対象を選んでください。");return;} h.addWard(t,7+Math.floor(S/2)); h.gainA(16); if(run.B!==4)p.valid=true; p.setB=4; break; }
    case "J04": {
      if(act.mode==="c"){ if(!h.payC(1))return; const t=h.needAlly(true); if(!t){need("自分以外の対象を選んでください。");return;} h.addC(t,4+Math.floor(S/2)); h.gainA(6); }
      else { if(!h.payC(1))return; const t=h.needAlly(); if(!t){need("対象を選んでください。");return;} h.heal(t,(14+2*S)*V+L); h.gainA(6); }
      if(!p.valid){need("効果がありません。");} break; }
    case "J05": if(!h.payC(2))return; if(!h.attackSingle(8+S)){need("対象の敵を選んでください。");return;} p.aGain+=8; break;
    case "J06": {
      if(!h.payC(3))return;
      if(act.mode==="bold"){ if(a.hp < 10*V+1){need(`強気にはHP${10*V+1}以上が必要です。`);return;} p.cost.hp=10*V; if(!h.attackSingle(18+2*S)){need("対象の敵を選んでください。");return;} }
      else { if(!h.attackSingle(10+2*S)){need("対象の敵を選んでください。");return;} h.addWard(a,1); }
      break; }
    case "J07": if(!h.payC(1))return; h.addC(a,5); h.addWard(a,3+Math.floor(S/2)); h.gainA(20); if(!p.valid){need("MP・防護・エールが最大のため効果がありません。");} break;
    case "J08": { if(!h.payC(2))return; const t=h.needAlly(); if(!t){need("回復する対象を選んでください。");return;} h.gainA(30+S); h.heal(t,(10+S)*V); if(!p.valid){need("効果がありません。");} break; }
    case "J09": if(!h.payC(3))return; if(!h.attackSingle(6+2*S)){need("対象の敵を選んでください。");return;} h.al.forEach(t=>h.addWard(t,1)); break;
    case "J10": { if(!h.payC(3))return; for(const e of h.en){ const df=effectiveEnemyDefense(a,e); const d=Math.max(1,Math.floor((a.str!=null?a.str:10+2*L)*0.6)+(6+S)*V-df); p.dmg.push({slot:e.slot,amt:Math.min(d,e.hp),raw:d}); } p.aGain+=6; p.valid=true; p.all=true; break; }
    case "J11": if(!h.payC(3))return; h.gainA(34+2*S); h.al.forEach(t=>h.addWard(t,2)); if(!p.valid){need("効果がありません。");} break;
    case "J12": if(!h.payC(3))return; h.al.forEach(t=>{h.heal(t,(12+S)*V); h.addC(t,1);}); h.gainA(8); if(!p.valid){need("効果がありません。");} break;
    case "J13": { if(!h.payC(3))return; const t=h.needAlly(); if(!t){need("対象を選んでください。");return;} h.heal(t,(18+3*S)*V+2*L); h.addWard(t,2); h.gainA(6); if(!p.valid){need("効果がありません。");} break; }
    case "J14": if(!h.payC(2))return; h.al.filter(t=>t!==a).forEach(t=>h.addC(t,3+Math.floor(S/2))); h.al.forEach(t=>h.heal(t,(5+S)*V)); h.gainA(18); if(!p.valid){need("効果がありません。");} break;
    case "J15": if(!h.payC(3))return; if(!h.attackSingle(12+2*S)){need("対象の敵を選んでください。");} break;
    case "J16": if(!h.payC(2))return; if(!h.attackSingle(4+S,{ignoreDef:true})){need("対象の敵を選んでください。");} break;
    case "J17": if(!h.payC(3))return; h.al.forEach(t=>h.addWard(t,6+Math.floor(S/2))); h.gainA(14); if(!p.valid){need("効果がありません。");} break;
    case "J18": { if(!h.payC(2))return; const t=h.needAlly(); if(!t){need("対象を選んでください。");return;} h.heal(t,(12+2*S)*V+2*L); h.gainA(8); if(run.B!==4)p.valid=true; p.setB=4; if(!p.valid){need("効果がありません。");} break; }
    case "J19": if(!h.payC(3))return; if(!h.attackSingle(8+2*S)){need("対象の敵を選んでください。");return;} p.setBAfter=4; break;
    case "J20": if(!h.payC(2))return; h.gainA(28+S); if(run.B!==4)p.valid=true; p.setB=4; h.al.forEach(t=>h.addWard(t,1)); if(!p.valid){need("効果がありません。");} break;
    case "J21": if(!h.payC(4))return; if(!h.attackSingle(18+2*S)){need("対象の敵を選んでください。");} break;
    case "J22": { if(!h.payC(2))return; const t=h.needAlly(true); if(!t){need("自分以外の生存者を選んでください。");return;} h.gainA(32+2*S); h.addC(t,2+Math.floor(S/2)+(t.job==="J08"?1:0)); if(!p.valid){need("エール100かつ対象のMPが最大のため効果がありません。");} break; }
  }
}
/* 確定（validate → reduce）。戻り値はログ配列 */
function applyAction(run, idx, act){
  const p = planAction(run, idx, act);
  if(!p.ok) return {ok:false, reason:p.reason};
  const a = run.party[idx]; const log=[]; const nm=a.name;const beforeA=run.A;let kiraEvent=null;
  if(p.ultimate){a.ultimateUsed=true;log.push('固有必殺技！ この戦闘では再使用できません。');}
  if(p.tech){a.skillReady=a.skillReady||{};a.skillReady[p.tech]=run.turn+p.techCooldown+1;}
  recordTrialAction(run,a,act);
  const label = actLabel(run,a,act);
  log.push(`${nm}の${label}！`);
  a.c -= p.cost.c; run.A -= p.cost.a; if(p.cost.hp){ a.hp -= p.cost.hp; log.push(`${nm}はHPを${p.cost.hp}払った。`); }
  // 攻撃（単体攻撃は会心の一撃の抽選あり：防御を無視して1.5倍）
  let killedNow=0;
  for(const d of p.dmg){
    const e = run.enemies.find(x=>x.slot===d.slot); if(!e||e.hp<=0) continue;
    let raw=d.raw;
    if(d.critRaw!=null && !run.noRand && randInt(1000) < Math.round((a.crit||0)*10)){ raw=d.critRaw; log.push("会心の一撃！"); run.fx=(run.fx||[]).concat("crit"); }
    const real = Math.min(raw, e.hp); e.hp -= real; log.push(`${e.display}に${real}ダメージ。`);
    if(e.hp<=0){ killedNow++; log.push(`${e.display}を鎮めた。`); }
  }
  if(killedNow>0 && !p.item){
    if(hasTrait(a,"J10")){ const g=battleAleGain(run,8*killedNow);log.push(`バズった！ エール＋${g}（上限100）`); }
    if(hasTrait(a,"J15") && !p.all && a.c<(a.maxC||10)){ const g=Math.min(2,(a.maxC||10)-a.c); a.c+=g; log.push(`${nm}のMP＋${g}（通電チェック）`); }
  }
  if(p.consumeB){ run.B=0; }
  if(p.setBAfter){ run.B=p.setBAfter; }
  if(p.aGain>0){ const before=run.A; run.A=Math.min(100,run.A+p.aGain); if(run.A>before) log.push(`エール＋${run.A-before}（${run.A}）`); }
  if(p.setB!=null){ run.B=p.setB; }
  for(const h of p.heal){ const t=run.party[h.pos]; if(h.revive){ t.hp=Math.min(h.amt,t.maxHP); t.acted=true; log.push(`${t.name}が復帰（HP${t.hp}）。`); } else if(h.amt>0){ t.hp+=h.amt; log.push(`${t.name}のHP＋${h.amt}`); } }
  for(const g of p.cgain){ const t=run.party[g.pos]; if(g.amt>0){ t.c=Math.min(t.maxC||10,t.c+g.amt); log.push(`${t.name}のMP＋${g.amt}`); } }
  for(const w of p.ward){ const t=run.party[w.pos]; if(w.amt>0){ t.ward=Math.min(8,t.ward+w.amt); log.push(`${t.name}に防護${w.amt}`); } }
  if(p.guard){ a.guard=true; log.push(`${nm}は身構えた。`); }
  if(p.item){ bagRemove(run.bag, p.item, 1); }
  // キラコメ連携
  let chainProg=false;
  if(p.chain){
    const {line, adv}=p.chain;
    if(run.kiraDone){ run.chain={stage:0,members:[]}; }
    else if(line==="greet"){ run.chain={stage:1,members:[a.cid]}; chainProg=adv; }
    else if(adv && line==="plan"){ run.chain.stage=2; run.chain.members.push(a.cid); chainProg=true; }
    else if(adv && line==="thanks"){
      chainProg=true; run.kiraDone=true; run.chain={stage:0,members:[]};
      const bonus = run.support==="PR06"?15:10,oldA=run.A; run.A=Math.min(100,run.A+bonus);
      let protectedCount=0;for(const t of alive(run)){const old=t.ward;t.ward=Math.min(8,t.ward+2);if(t.ward>old)protectedCount++;}
      kiraEvent={gain:run.A-oldA,protected:protectedCount};
      log.push(`キラコメ連携成功！ エール＋${run.A-oldA}（上限100）、防護＋2（上限8・${protectedCount}人に効果）。`);
    } else { run.chain={stage:0,members:[]}; }
  } else if(p.chainReset){ run.chain={stage:0,members:[]}; }
  if(chainProg && hasTrait(a,"J02")){const g=battleAleGain(run,4);log.push(`自動化スクリプト：エール＋${g}（上限100）`);}
  // ボス対処
  if(p.cue && run.cue && !run.cue.bits.includes(a.cid)){
    run.cue.bits.push(a.cid);
    if(run.cue.bits.length>=2){ run.cue.ready=true;const g=battleAleGain(run,12);log.push(`対処成功！ 次の強攻撃が20%軽くなり、エール＋${g}（上限100）。`); }
  }
  // 初撃破のパチパチ
  if(killedNow>0 && !run.firstKill && !p.item){ run.firstKill=true;const g=battleAleGain(run,10);log.push(`パチパチ！ 拍手でエール＋${g}（上限100）。`); }
  a.acted=true;
  if(p.valid || chainProg) a.valid++;
  run.supportNotice={actor:a.name,action:label,beforeA,afterA:run.A,costA:p.cost.a,kira:kiraEvent};
  // 勝敗
  if(run.enemies.every(e=>e.hp<=0)){ run.state="won"; log.push("ノイズ体をすべて鎮めた！"); }
  else if(alive(run).every(m=>m.acted)){ log.push(...enemyPhase(run)); }
  run.log = [...(run.log||[]), ...log].slice(-80);
  return {ok:true, log};
}
function actLabel(run,a,act){
  if(act.type==="attack") return "アタック";
  if(act.type==="comment") return "応援コメント"+`（${LINE_NAMES[act.line]}）`;
  if(act.type==="guard") return "ガード";
  if(act.type==="rest") return "ひと息つく";
  if(act.type==="family") return "ファミリー応援";
  if(act.type==="meter") return "メーター突破";
  if(act.type==="item") return ITEMS[act.item]?ITEMS[act.item].name:"道具";
  if(act.type==="skill") return (act.skillId&&EXTRA_SKILLS[act.skillId]?EXTRA_SKILLS[act.skillId].name:JOBS[a.job].skill) + (act.mode==="bold"?"（強気）":act.mode==="safe"?"（堅実）":act.mode==="c"?"（MP補給）":act.mode==="hp"?"（HP補給）":"") + (act.line?`（${LINE_NAMES[act.line]}）`:"");
  return "行動";
}
function enemyPhase(run){
  const log=[];
  for(const e of run.enemies.filter(x=>x.hp>0).sort((x,y)=>x.slot-y.slot)){
    const act = enemyAction(run,e);
    if(act.type==="c"){ log.push(`${e.display}は力をためている。`); continue; }
    const targets = act.type==="a" ? alive(run) : [run.party[pickTarget(run, (run.turn-1+e.slot)%run.party.length)]].filter(Boolean);
    const quake=battleQuake(run);
    for(const t of targets){
      // すばやさによる回避
      if(!run.noRand && t.eva && randInt(1000) < Math.round(t.eva*10)){ log.push(`${e.display}の${act.type==="a"?"全体攻撃":"攻撃"}。${t.name}はひらりと身をかわした！`); continue; }
      // 痛恨の一撃（単体攻撃のみ）：防御・防護を無視して1.5倍。ガードなら半分
      const tsukon = act.type==="s" && !run.noRand && randInt(1000) < (e.boss?50:31);
      const inc=incomingDamage(run,t,act,tsukon,quake);
      t.hp = Math.max(0, t.hp-inc);
      if(e.boss&&act.type==="a"&&run.turn%4===0&&inc>0){const loss=Math.min(t.c,Math.max(1,Math.min(6,Math.ceil((t.maxC||10)*0.08))));t.c-=loss;if(loss)log.push(`${t.name}はMPを${loss}失った。`);}
      if(tsukon){ log.push(`${e.display}の痛恨の一撃！`); run.fx=(run.fx||[]).concat("tsukon"); }
      log.push(`${e.display}の${act.type==="a"?"全体攻撃":"攻撃"}。${t.name}に${inc}。`+(t.hp===0?` ${t.name}は戦闘不能。`:""));
    }
    if(alive(run).length===0){ run.state="lost"; log.push("全員が戦闘不能になった……"); return log; }
  }
  if(run.cue && run.turn%4===0){ run.cue.bits=[]; run.cue.ready=false; }
  for(const m of run.party){ m.guard=false; m.ward=0; m.acted=false; }
  if(run.aleLeak){const lost=Math.min(run.A,run.aleLeak);run.A-=lost;if(lost)log.push('枠のノイズでエール−'+lost);}
  if(run.mpLeak)for(const m of alive(run)){const lost=Math.min(m.c,run.mpLeak);m.c-=lost;if(lost)log.push(m.name+'は進行の混乱でMP−'+lost);}
  run.turn++; run.chain={stage:0,members:[]};
  if(run.turnLimit&&run.turn>run.turnLimit){run.state="lost";log.push("締めの合図！ 制限ターンを超え、特別チャレンジは失敗した。");return log;}
  startTurnCue(run);
  if(run.rageNew){ for(const sl of run.rageNew){ const e=run.enemies.find(x=>x.slot===sl); if(e) log.push(`${e.display}は怒っている！ 攻撃が強くなった。`); } run.rageNew=null; }
  traitsTurnStart(run, log);
  return log;
}

/* ---- 戦闘報酬（第17B・17H節）。一度だけ適用 ---- */
function applyVictory(st, run){
  const res = { xp:0, gold:0, tickets:0, jp:[], levelBefore:partyLevel(st), levelAfter:0, gifts:[], quest:null, kills:0, notes:[] };
  if(run.rewardsApplied||run.state!=="won") return res;
  storeVitals(st, run); st.bag = clone(run.bag||st.bag||[]); res.items=[]; res.itemsKept=[]; res.itemsLost=[];
  ensureMemberXp(st);const beforeMembers=captureCompanionStats(st,run.party.map(m=>m.cid));
  const n = run.enemies.length;
  if(run.kind==="challenge")challengeReward(st,run,res);
  specialBossReward(st,run,res);chapterBossReward(st,run,res);newGearDrop(st,run,res);
  if(run.kind==="field"){st.townBattles=st.townBattles||{};st.townBattles[run.hub]=(st.townBattles[run.hub]||0)+1;}
  if(run.kind==="field"){
    res.xp = n*regionalXP(battleTrainingLevel(run)); res.gold = n*(AREAS[run.areaId]?.chapterLevel?Math.ceil(AREAS[run.areaId].chapterLevel*6):24+3*run.q);
    res.xp=Math.max(0,...Object.values(awardExperience(st,res.xp,run.party.map(m=>m.cid)))); st.gold += res.gold;
    for(const e of run.enemies) st.killCount[e.id]=(st.killCount[e.id]||0)+1;
    // 道具のドロップ：倒した敵ごとに1回だけ抽選（1体から最大1個）
    for(const e of run.enemies){ const dr=ITEM_DROPS[e.id]; if(!dr) continue;
      const roll = run.dropRolls && run.dropRolls[e.slot]!=null ? run.dropRolls[e.slot] : randInt(dr[1]);
      if(roll===0) giveItem(st, dr[0], 1, res, `${e.display}が落とした`); }
    for(const e of run.enemies)regionalItemDrop(st,run,e,res);
    for(const e of run.enemies) rareDrop(st, run, e, res);
    // 依頼の討伐数
    const qid = st.activeQuest;
    if(qid && QUESTS[qid].hub===run.hub && ["active"].includes(st.quests[qid])){
      st.qprog[qid]=Math.min(QUESTS[qid].kills,(st.qprog[qid]||0)+n);
      res.kills=n; res.killQuest=qid; res.killNow=st.qprog[qid]; res.killNeed=QUESTS[qid].kills;
      if(st.qprog[qid]>=QUESTS[qid].kills){
        if(QUESTS[qid].main){ st.quests[qid]="bossReady"; res.notes.push(`${qid}：ボスに挑めるようになった。`); }
        else { completeQuest(st,qid,res); }
      }
    }
  }
  if(run.kind==="boss"){
    res.xp=regionalXP(battleTrainingLevel(run))*6; res.gold=BOSSES[run.bossId]?.chapterLevel?BOSSES[run.bossId].chapterLevel*25:100+20*run.q;
    res.xp=Math.max(0,...Object.values(awardExperience(st,res.xp,run.party.map(m=>m.cid)))); st.gold+=res.gold;
  }
  if(run.kind==="field" && st.streamRetryGate && st.streamRetryGate[run.hub]) st.streamRetryGate[run.hub].battle=true;
  if(run.kind!=="challenge")ultraDrop(st,run,res);
  // JP
  for(const m of run.party){
    const base=run.kind==='challenge'&&!res.challenge?.first?0:regionalJP(battleTrainingLevel(run),run.kind!=='field');
    const cur = jpOf(st,m.cid,m.job); const R0=Math.min(progressionCap(st),rankOf(cur));
    const gain = Math.max(0,Math.min(jpFor(progressionCap(st))-cur, base)); st.jp[m.cid][m.job]=cur+gain; const R1=Math.min(progressionCap(st),rankOf(cur+gain));
    res.jp.push({cid:m.cid, name:m.name, job:m.job, gain, R0, R1});
    for(const need of [10,30,80,130,180])if(R0<need&&R1>=need)res.notes.push(`${m.name}：${JOBS[m.job].name}熟練度${need}に到達。${need===10?"専用道具が解禁！":need===30?"熟練技の条件を達成！":"上位技の熟練条件を達成！"}`);
    if(run.kind!=="challenge"||res.challenge?.first){if(R1>=4)giftCheck(st,m.job,"W",res);if(R1>=7)giftCheck(st,m.job,"A",res);}
  }
  if(run.kind==="boss"){
    const firstBoss=!st.bossDefeated[run.bossId];
    st.bossDefeated[run.bossId]=true; rareBossDrop(st, run, firstBoss, res);
    const qid = Object.keys(QUESTS).find(k=>QUESTS[k].boss===run.bossId);
    if(qid && st.quests[qid]==="bossReady"){
      if(QUESTS[qid].stream){ st.quests[qid]="combatDone"; res.notes.push("配信の準備が整った。"); }
      else completeQuest(st,qid,res);
    }
  }
  res.levelAfter = partyLevel(st);
  // v5.33 レベルアップしたら、全員のHP・MPを全回復（戦闘不能も復帰）。能力値の上がり幅を記録
  recordCharacterVictory(st,run,res);
  finishCompanionGrowth(st,run,res,beforeMembers);
  ensureVitals(st);
  run.rewardsApplied = true;
  return res;
}
function levelUpEffects(st, L0, L1){
  if(st.memberXp){ensureVitals(st);return null;}
  if(L1<=L0) return null;
  st.lastMpGrowth={from:L0,to:L1,members:st.party.map(cid=>({cid,before:charStats(st,cid,L0,null,null,true).startC,after:charStats(st,cid,L1,null,null,true).startC}))};
  const ups={};
  for(const cid of st.party){ const a=charStats(st,cid,L0,null,null,true).base, b=charStats(st,cid,L1,null,null,true).base; ups[cid]=STAT_KEYS.map(k=>[k,b[k]-a[k]]).filter(x=>x[1]>0); }
  ensureVitals(st);for(const c of st.party){const cs=charStats(st,c,partyLevel(st));st.vitals[c]={hp:cs.maxHP,c:cs.startC,maxMP:cs.startC};}
  if(st.run)for(const m of st.run.party){const cs=charStats(st,m.cid,L1);m.name=charName(st,m.cid);m.L=cs.L;m.V=cs.V;m.jobRanks=clone(st.jp[m.cid]);m.R=cs.R;m.S=cs.S;m.maxHP=cs.maxHP;m.hp=m.maxHP;m.defBase=cs.defBase;m.str=cs.base.str;m.wAtk=cs.wAtk;m.accAtk=cs.accAtk;m.armorD=cs.armorD;m.crit=cs.crit;m.eva=cs.eva;m.cha=cs.cha;m.chaStat=cs.base.cha;m.maxC=m.maxMP=cs.startC;m.c=cs.startC;}
  return ups;
}
function giftCheck(st,job,kind,res){
 if(st.gifts[kind][job])return true;const id=(kind==='W'?'JW':'JA')+job.slice(1);
 if(eqCanAdd(st,id,1)){st.owned[id]=(st.owned[id]||0)+1;res.gifts.push(id);st.gifts[kind][job]=true;return true;}
 st.keep=st.keep||[];if(st.keep.length<KEEP_MAX){st.keep.push(id);res.gifts.push(id);st.gifts[kind][job]=true;res.notes.push(EQUIP[id].name+'は装備品の持ち物が満杯のため、宿屋の預かり所へ送りました。');return true;}
 res.notes.push('熟練度報酬「'+EQUIP[id].name+'」は持ち物と預かり所が満杯のため受取待ちです。空きを作り、この職業で通常戦闘か地域ボスに勝利すると受け取れます。');return false;
}

/* ---- 装備品の持ち物（未装備の在庫）：最大20種類、1種類は装備中を含め8個まで ---- */
function eqStockKinds(st){ return Object.keys(st.owned).filter(id=>availableCount(st,id)>0).length; }
function eqCanAdd(st,id,n){ // 在庫へn個加えられるか
  if(typeof id!=='string'||!Object.prototype.hasOwnProperty.call(EQUIP,id)||!Number.isSafeInteger(n)||n<=0)return false;
  if((st.owned[id]||0)+n>8) return false;
  if(availableCount(st,id)>0) return true;
  return eqStockKinds(st) < EQ_KINDS;
}
function eqChangeOk(st, mutate){ // 装備の付け替え・ジョブ変更の前後で、持ち物の種類数が上限を超えて増えないか
  const before=eqStockKinds(st); const t=clone({owned:st.owned, equip:st.equip, roster:st.roster});
  mutate(t); const after=Object.keys(t.owned).filter(id=>availableCount(t,id)>0).length;
  return true; /* 付け替え・外す・ジョブ変更は常に許可（種類数の上限は新しく手に入れる時だけ） */
}
function completeQuest(st, qid, res){
  if(st.quests[qid]==="complete") return;
  const beforeCap=progressionCap(st),Q=QUESTS[qid]; st.quests[qid]="complete"; st.activeQuest=null;
  const reward=questReward(Q),xp=reward.xp,tk=reward.tickets;
  const ev = ITEM_EVENTS[qid]; if(ev) giveItem(st, ev[0], ev[1], res, `依頼${qid}の達成`);
  const actualXP=Math.max(0,...Object.values(awardExperience(st,xp))); st.tickets+=tk;
  if(res){ res.xp+=actualXP; res.tickets+=tk; res.quest=qid; }
  if(Q.main){ if(Q.rank!=null) st.moeRank=Math.max(st.moeRank,Q.rank); fixQuestChain(st); }
  if(qid==="M02") st.fukuokaClear=true;
  if(qid==="M16") st.kyushuClear=true;
  if(qid==="M17") st.omutaClear=true;
  if(qid==="C09") st.shikokuChugokuClear=true;
  if(qid==="N607")st.nationalClear=true;
  if(progressionCap(st)>beforeCap&&res){res.notes=res.notes||[];res.notes.push('新しい地域編が解放！ レベル・職業熟練度の上限が'+beforeCap+' → '+progressionCap(st)+'になりました。');}
  unlockSide(st);
}
/* ---- HP・MPの持ち越し（ユーザー指定：戦闘後も残り、宿屋で全回復） ---- */
function ensureVitals(st){
  st.vitals=st.vitals||{}; const L=partyLevel(st);
  for(const cid of st.roster){ const s=charStats(st,cid,L); const v=st.vitals[cid];
    if(!v) st.vitals[cid]={hp:s.maxHP, c:s.startC, maxMP:s.startC};
    else { v.hp=Math.max(0,Math.min(s.maxHP,v.hp)); v.c=Math.max(0,Math.min(s.startC,v.c)); } st.vitals[cid].maxMP=s.startC; }
}
function storeVitals(st, run){
  st.vitals=st.vitals||{}; const L=partyLevel(st);
  for(const m of run.party){ const s=charStats(st,m.cid,L); st.vitals[m.cid]={hp:Math.max(0,Math.min(s.maxHP,m.hp)), c:Math.max(0,Math.min(s.startC,m.c)), maxMP:s.startC}; }
}
function restoreAll(st){ st.vitals={}; ensureVitals(st); }
function joinMember(st,cid){
  if(st.roster.includes(cid)) return false;
  ensureMemberXp(st);st.memberXp[cid]=partyExperience(st);st.roster.push(cid); st.pendingNames=st.pendingNames||[];st.pendingNames.push(cid); if(st.party.length<4) st.party.push(cid); syncPartyExperience(st); ensureCharacterStories(st); joinEquip(st,cid); if(st.vitals) delete st.vitals[cid]; ensureVitals(st); return true;
}
function joinEquip(st,cid){
  for(const [slot,id] of [["w","CW01"],["a","CA01"]]){ if(availableCount(st,id)>0) st.equip[cid][slot]=id; }
}
function unlockSide(st){
  for(const [id,Q] of Object.entries(QUESTS)){ if(Q.main||!Q.npc) continue;
    const mq=mainQuestOf(Q.hub);
    if(st.talked[Q.npc] && st.quests[id]==="locked" && (!mq || st.quests[mq]!=="locked")) st.quests[id]="available"; }
}
function equippedCount(st,id){ let n=0; for(const c of st.roster){ const e=st.equip[c]; if(e.w===id)n++; if(e.a===id)n++; if(e.acc===id)n++; } return n; }
function availableCount(st,id){ return (st.owned[id]||0)-equippedCount(st,id); }

/* ---- 配信（第13・13A節） ---- */

function markStreamFailure(st,hub){st.streamRetryGate=st.streamRetryGate||{};if(!st.streamRetryGate[hub]||st.streamRetryGate[hub].cleared)st.streamRetryGate[hub]={talks:[],battle:false};}
function retryReady(st,hub){const g=(st.streamRetryGate||{})[hub];return !g||(g.talks.length>=2&&g.battle);}
function retryDescription(st,hub){const g=(st.streamRetryGate||{})[hub];return g?`<p class="setdesc">再挑戦の準備：この街の住民との会話 ${Math.min(2,g.talks.length)}/2人・通常戦闘 ${g.battle?"達成":"未達成"}</p>`:"";}
const TOWN_FEATURES=[
["屋台の声つなぎ","屋台の店主たちが互いの呼び声を聞く練習を始めた。","広場に紹介文の看板が並び、旅人へ順番に声が届くようになった。"],
["港の灯りリレー","港の作業員が灯りを合図に拍手の間を合わせている。","波止場の灯りがつながり、船出を見送る声が配信にも届いた。"],
["松原の風便り","松林で風の弱い場所を探す取材会が始まった。","朝市の呼び込みが交代制になり、松原からの中継が定着した。"],
["水路と気球の便り","水路沿いで気球を見送る声を集めている。","水辺に住民の案内札が増え、気球の便りが集まるようになった。"],
["港の異文化便り","港で違う言葉の挨拶を教え合っている。","旅人の挨拶を集めた交流掲示板が完成した。"],
["坂道の声案内","坂道の休憩所で道案内の練習をしている。","坂の途中に配信を聞く小さな休憩席ができた。"],
["城下の復興便り","城下で住民が大切にしたい景色を聞き取っている。","通りに住民おすすめの散策札が並んだ。"],
["水と草原の取材","水音を邪魔しない中継場所を探している。","草原の案内人が静かに景色を紹介する番組を始めた。"],
["温泉街のひと息","湯けむりの街で休憩を挟んだ配信の練習をしている。","休憩所に声の便りが届き、旅人が感想を残すようになった。"],
["石畳の昔語り","石畳を歩きながら昔の話を聞き集めている。","住民の昔語りを交代で届ける時間ができた。"],
["海風の便り","海辺で波と声の音量を合わせる練習をしている。","海辺の夕景を住民が交代で紹介するようになった。"],
["城下の暮らし案内","古い通りの暮らしを聞き取る会が開かれた。","通りの店に手書きの紹介札が増えた。"],
["火山の景色便り","景色の変化を住民が短い言葉にまとめている。","展望場所に住民の景色案内が掲示された。"],
["島への手紙","船を待つ人が島への便りを持ち寄っている。","船着き場で便りを読み上げる時間が始まった。"],
["島唄と返事","歌い手と聞き手が返事の間を合わせている。","広場の輪に旅人も加わり、歌と返事がつながった。"],
["海を越えるエール","各地の住民から届いた便りを整理している。","旅した街の便りが並び、九州の仲間の声がつながった。"],
["故郷の特別公演","故郷の人たちが特別公演の準備を進めている。","故郷に旅の記録を飾る場所ができた。"]];
TOWN_FEATURES.push(...NEXT_CHAPTER.map(c=>[c.title,'ノイズは静まり、'+c.side+'の合同配信準備が進んでいる。',c.after]));
TOWN_FEATURES.push(...NATIONAL_ALL_EXTRA.map(c=>[c.title,c.before,c.after]));
function townChange(st,hub){const i=HUB_ORDER.indexOf(hub),f=TOWN_FEATURES[i];if(!f)return null;const q=mainQuestOf(hub),sq=sideQuestOf(hub);const phase=st.quests[q]==="complete"?2:st.bossDefeated[(QUESTS[q]||{}).boss]?1:0;return {phase,title:f[0],text:phase===2?f[2]:phase===1?f[1]:`${f[0]}の準備中。住民はまだ声を届けるきっかけを探している。`,side:sq&&st.quests[sq]==="complete"?"任意依頼の協力者も加わり、街の案内を手伝っている。":""};}

function newStream(st, hub, host, theme, style, options){
  if(st.streamRetryGate&&retryReady(st,hub))delete st.streamRetryGate[hub];
  return { hub, prefId:HUBS[hub].prefId, requestIds:STREAM_REQ[HUBS[hub].prefId].slice(), host, theme, style,
    hand:0, score:0, used:[], themeBonusUsed:false, picks:[], done:false, broadcastPlan:broadcastPlan(st,options) };
}
function streamPlay(s, act){
  const gain = { first:0, match:0, theme:0 };
  if(!s.used.includes(act)){ gain.first=20; if(s.requestIds[s.hand]===act) gain.match=20;
    if(!s.themeBonusUsed && STREAM_THEMES[s.theme].act===act){ gain.theme=10; s.themeBonusUsed=true; }
    s.used.push(act); }
  const total=gain.first+gain.match+gain.theme; s.score+=total; s.picks.push({act,total}); s.hand++;
  if(s.hand>=4) s.done=true;
  return {gain,total};
}
const BROADCAST_POLICIES=Object.freeze(Object.assign(Object.create(null),{reach:{name:'新規視聴者重視',reach:125,support:85,fans:100},community:{name:'交流・ファン重視',reach:100,support:100,fans:150},income:{name:'収益重視',reach:85,support:150,fans:90}}));
const BROADCAST_GOALS=[50,100,300,1000];
function broadcastPlan(st,options={}){return {policy:BROADCAST_POLICIES[options.policy]?options.policy:'community',goal:BROADCAST_GOALS.includes(Number(options.viewerGoal))?Number(options.viewerGoal):100,incomeGoal:BROADCAST_GOALS.includes(Number(options.incomeGoal))?Number(options.incomeGoal):100,level:partyLevel(st),fans:Math.min(1000000000,st.broadcastStats?.fans||0),qid:Object.keys(QUESTS).find(q=>st.quests[q]==='combatDone')||null};}
function broadcastMetrics(st,s){const p=s.broadcastPlan||{policy:'community',goal:100,incomeGoal:100,level:partyLevel(st),fans:0},policy=BROADCAST_POLICIES[p.policy],score=s.score,passed=s.done&&score>=80,base=40+p.level*3+Math.floor(p.fans/10),viewers=Math.max(1,Math.min(10000000,Math.floor(base*(40+score)/100*policy.reach/100))),peak=Math.max(1,Math.min(viewers,Math.floor(viewers*(35+Math.floor(score/5))/100))),average=Math.max(1,Math.floor(peak*.65)),support=passed?Math.floor(viewers*score*policy.support/70000):0,program=passed?10+p.level*2+Math.floor(score*.75):0,gross=program+support,costs=Math.floor(gross*(s.style==='video'?20:10)/100),net=gross-costs,fans=passed?Math.min(1000000000-p.fans,Math.max(1,Math.floor(viewers*score*policy.fans/200000))):0;return {policy:p.policy,goal:p.goal,incomeGoal:p.incomeGoal||100,incomeGoalMet:net>=(p.incomeGoal||100),score,passed,viewers,peak,average,newFans:fans,program,support,gross,costs,net,goalMet:viewers>=p.goal};}
function emptyBroadcastStats(){return {attempts:0,fans:0,gross:0,costs:0,net:0,paid:{},history:[]};}
function settleBroadcast(st,s,qid){if(s.broadcastReceipt)return s.broadcastReceipt;if(!s.done)return null;const m=broadcastMetrics(st,s),stats=st.broadcastStats||emptyBroadcastStats(),eligible=m.passed&&!!QUESTS[qid]?.stream&&QUESTS[qid].hub===s.hub&&(!s.broadcastPlan||s.broadcastPlan.qid===qid),paid=eligible&&!stats.paid[qid],r={...m,hub:s.hub,theme:s.theme,style:s.style,qid:qid||null,paid,index:stats.attempts+1,timeline:broadcastTimeline(st,s),newFans:paid?Math.min(m.newFans,1000000000-stats.fans):0,program:paid?m.program:0,support:paid?m.support:0,gross:paid?m.gross:0,costs:paid?m.costs:0,net:paid?m.net:0};if(!Number.isSafeInteger(st.gold+r.net)||!Number.isSafeInteger(stats.net+r.net)||stats.attempts>=1000000000)return null;st.broadcastStats=stats;stats.attempts++;stats.fans=Math.min(1000000000,stats.fans+r.newFans);stats.gross+=r.gross;stats.costs+=r.costs;stats.net+=r.net;if(paid){stats.paid[qid]=true;st.gold+=r.net;}stats.history.unshift(r);stats.history.length=Math.min(20,stats.history.length);s.broadcastReceipt=r;return r;}
function broadcastResultPanel(st,s){const m=broadcastMetrics(st,s),already=!!st.broadcastStats?.paid[s.broadcastPlan?.qid||streamPending()],rows=[['総視聴者',m.viewers+'人'],['最大同時視聴者',m.peak+'人'],['平均同時視聴者',m.average+'人'],['獲得ファン予定',(already?0:m.newFans)+'人'],['番組報酬',m.program+'G'],['応援収入',m.support+'G'],['収入合計',m.gross+'G'],['制作経費','−'+m.costs+'G'],['差引利益予定',(already?0:m.net)+'G']];return '<section class="m-card"><h3>配信リザルト</h3><p>'+BROADCAST_POLICIES[m.policy].name+'／視聴者目標 '+m.goal+'人：'+(m.goalMet?'達成':'次回に挑戦')+'／利益目標 '+m.incomeGoal+'G：'+(m.incomeGoalMet?'達成':'次回に挑戦')+'</p><dl class="broadcast-grid">'+rows.map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('')+'</dl><p class="small">視聴者数はゲーム独自の推計値。Gはゲーム内通貨で、実際のPocochaの報酬・円換算ではありません。'+(m.passed?already?'この本編配信の収益は受取済みです。':'終了ボタンで利益・ファンを確定します。本編配信1件につき1回。':'目標点未達のため収入・経費・ファン獲得は0です。')+'</p><p class="small">次回のヒント：'+(s.used.length<4?'同じ演出の連続を避け、4種類の演出を試そう。':s.score<160?'各手番の視聴者の要望とテーマに合う演出を選ぼう。':'要望への対応が好評。別の配信方針も試してみよう。')+'</p><h3>4手の振り返り</h3>'+renderBroadcastTimeline(broadcastTimeline(st,s))+broadcastComparison(st,s)+'<h3>次回の改善プラン</h3><ul>'+broadcastAdvice(st,s).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></section>';}
function renderBroadcastHistory(){const x=G.st.broadcastStats||emptyBroadcastStats(),d=G.sheetData||{},filter=['all','passed','failed'].includes(d.broadcastFilter)?d.broadcastFilter:'all',list=x.history.filter(r=>filter==='all'||(filter==='passed'?r.passed:!r.passed));return '<p class="small">ゲーム内の配信実績。現実の視聴者数や金銭とは関係ありません。</p><div class="m-total">配信 '+x.attempts+'回／獲得ファン '+x.fans.toLocaleString()+'人<br>累計収入 '+x.gross.toLocaleString()+'G − 経費 '+x.costs.toLocaleString()+'G<br><b>累計利益 '+x.net.toLocaleString()+'G</b></div><h3 class="label">直近20回</h3>'+broadcastHistoryControls(G.st,d)+'<div class="stack">'+(list.map(r=>'<article class="m-card"><b>#'+r.index+' '+esc(HUBS[r.hub].name)+'／'+streamGrade(r.score)+'</b><p>'+r.viewers.toLocaleString()+'人・最大同接 '+r.peak.toLocaleString()+'人・平均同接 '+r.average.toLocaleString()+'人</p><p>収入 '+r.gross+'G − 経費 '+r.costs+'G＝利益 '+r.net+'G／ファン＋'+r.newFans+'人</p><p class="small">'+BROADCAST_POLICIES[r.policy].name+'／目標'+r.goal+'人 '+(r.goalMet?'達成':'未達')+'／'+(r.paid?'報酬確定':r.passed?'受取対象外・受取済み':'未達成・報酬なし')+'</p><details class="broadcast-fold"><summary>手番ごとの反応</summary>'+renderBroadcastTimeline(r.timeline,true)+'</details></article>').join('')||'<p>この条件の記録はありません。配信を終えるか、表示条件を変更してください。</p>')+'</div>';}
function broadcastForecast(st,options={}){const p=broadcastPlan(st,options),style=options.style==='voice'?'voice':'video';return Object.keys(BROADCAST_POLICIES).map(policy=>({policy,scenarios:[80,120,170].map(score=>broadcastMetrics(st,{score,done:true,style,broadcastPlan:{...p,policy}}))}));}
function broadcastGoalFor(value){return BROADCAST_GOALS.filter(n=>n<=value).at(-1)||BROADCAST_GOALS[0];}
function broadcastTimeline(st,s){const probe={requestIds:s.requestIds,theme:s.theme,used:[],themeBonusUsed:false,picks:[],hand:0,score:0,done:false},rows=[];for(const p of s.picks){const repeat=probe.used.includes(p.act),r=streamPlay(probe,p.act),m=broadcastMetrics(st,{...probe,style:s.style,broadcastPlan:s.broadcastPlan});rows.push({act:p.act,gain:r.total,score:probe.score,viewers:m.viewers,match:r.gain.match>0,themeBonus:r.gain.theme>0,repeat});}return rows;}
function renderBroadcastTimeline(rows,archived=false){if(!rows?.length)return '<p class="small">'+(archived?'旧版の記録には手番の内訳がありません。':'演出を選ぶと手番ごとの反応が表示されます。')+'</p>';const max=Math.max(1,...rows.map(r=>r.viewers));return '<ol class="broadcast-timeline">'+rows.map((r,i)=>'<li><b>'+STREAM_TIMES[i]+' '+esc(STREAM_ACTS[r.act].name)+'</b><span>＋'+r.gain+'点／累計'+r.score+'点・視聴者'+r.viewers.toLocaleString()+'人</span><span class="broadcast-track" aria-hidden="true"><i style="width:'+Math.round(r.viewers/max*100)+'%"></i></span><small>'+(r.repeat?'使用済みの演出：追加反応なし':r.match?'視聴者の要望に一致':'初めての演出：基本反応')+(r.themeBonus?'／テーマ加点あり':'')+'</small></li>').join('')+'</ol>';}
function broadcastAdvice(st,s){const m=broadcastMetrics(st,s),timeline=broadcastTimeline(st,s),out=[];if(timeline.some(r=>r.repeat))out.push('同じ演出の再使用は加点0。次回は4種類を使い分けましょう。');if(timeline.some(r=>!r.repeat&&!r.match))out.push('要望に一致しなかった手番があります。各手番の「要望」と予定表を見比べましょう。');if(!s.themeBonusUsed)out.push('テーマに対応する演出を一度入れると、テーマの10点を獲得できます。');if(!m.goalMet)out.push('視聴者目標は未達。新規視聴者重視、ファンの蓄積、現状に合う目標への調整を試しましょう。');if(!m.incomeGoalMet&&s.style==='video')out.push('利益目標を目指すなら声中心も比較。制作経費率が20％から10％になります。');if(!out.length)out.push('要望とテーマへの対応が好調です。次回は3方針の見込みを比べて目標を一段上げてみましょう。');return out.slice(0,3);}
function broadcastComparison(st,s){const history=st.broadcastStats?.history||[],previous=history.find(r=>r.hub===s.hub)||history[0];if(!previous)return '<p class="small">初回のため比較対象はありません。</p>';const m=broadcastMetrics(st,s),delta=n=>(n>0?'＋':n<0?'−':'±')+Math.abs(n).toLocaleString();return '<section class="m-notice"><h3>前回との参考比較</h3><p>'+esc(HUBS[previous.hub].name)+' #'+previous.index+'との比較：視聴者 '+delta(m.viewers-previous.viewers)+'人／利益予定 '+delta(m.net-previous.net)+'G</p><p class="small">'+(previous.hub===s.hub?'直近の同じ街の記録':'同じ街の記録がないため別の街の記録')+'です。成長・設定・得点の違いも含み、同条件の比較ではありません。</p></section>';}
function renderBroadcastForecast(st,d){const list=broadcastForecast(st,d),selected=list.find(x=>x.policy===d.policy)||list[1],m=selected.scenarios[1],last=st.broadcastStats?.history?.[0];return '<section class="m-notice"><h3>開始前の比較・見込み</h3><p class="small">80点／120点／170点の仮定で計算。成功や目標達成を保証する数字ではありません。</p><div class="stack">'+list.map(x=>{const a=x.scenarios[0],b=x.scenarios[1],c=x.scenarios[2];return '<article class="m-card"><b>'+BROADCAST_POLICIES[x.policy].name+(d.policy===x.policy?'（選択中）':'')+'</b><p>視聴者 '+a.viewers+'〜'+c.viewers+'人／利益 '+a.net+'〜'+c.net+'G</p><p class="small">120点なら：視聴者'+b.viewers+'人・利益'+b.net+'G・ファン＋'+b.newFans+'人</p></article>';}).join('')+'</div><p class="small">選択中の方針で170点でも届かない目標：'+([Number(d.viewerGoal)>selected.scenarios[2].viewers?'視聴者':'',Number(d.incomeGoal)>selected.scenarios[2].net?'利益':''].filter(Boolean).join('・')||'なし')+'。目標未達でも80点以上なら本編は進行します。</p><div class="stack"><button class="btn" data-a="broadcastSuggest">120点の見込みに合わせて目標を設定</button>'+(last?'<button class="btn" data-a="broadcastReuse">前回の方針・テーマ・スタイル・目標を使う</button>':'')+'</div></section>';}
function broadcastHistoryControls(st,d){const history=st.broadcastStats?.history||[],count=history.filter(r=>r.passed).length;return '<p class="small">直近'+history.length+'回：成功'+count+'回／未達成'+(history.length-count)+'回（累計全期間の成功率ではありません）</p><div class="row3">'+[['all','すべて'],['passed','成功'],['failed','未達成']].map(([k,n])=>'<button class="btn '+((d.broadcastFilter||'all')===k?'on':'')+'" data-a="broadcastFilter" data-v="'+k+'">'+n+'</button>').join('')+'</div>';}
function validateBroadcastTimeline(r){if(r.timeline===undefined)return;if(!Array.isArray(r.timeline)||r.timeline.length!==4)throw Error('bad broadcast timeline');const probe={requestIds:STREAM_REQ[HUBS[r.hub].prefId],theme:r.theme,used:[],themeBonusUsed:false,picks:[],hand:0,score:0,done:false};let viewers=0;for(const x of r.timeline){if(!x||!Object.prototype.hasOwnProperty.call(STREAM_ACTS,x.act)||!Number.isSafeInteger(x.viewers)||x.viewers<1||x.viewers>10000000||x.viewers<viewers)throw Error('bad broadcast timeline entry');const repeat=probe.used.includes(x.act),v=streamPlay(probe,x.act);if(x.gain!==v.total||x.score!==probe.score||x.repeat!==repeat||x.match!==(v.gain.match>0)||x.themeBonus!==(v.gain.theme>0))throw Error('inconsistent broadcast timeline');viewers=x.viewers;}if(probe.score!==r.score||viewers!==r.viewers)throw Error('broadcast timeline total mismatch');}
function validateBroadcastData(st){const x=st.broadcastStats,int=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max,plan=st.stream?.broadcastPlan;if(plan&&(!BROADCAST_POLICIES[plan.policy]||!BROADCAST_GOALS.includes(plan.goal)||plan.incomeGoal!==undefined&&!BROADCAST_GOALS.includes(plan.incomeGoal)||!int(plan.level,999)||plan.level<1||!int(plan.fans,1000000000)||plan.qid!==null&&(!QUESTS[plan.qid]?.stream||QUESTS[plan.qid].hub!==st.stream.hub)))throw Error('bad broadcast plan');if(!x)return;if(!int(x.attempts,1000000000)||!int(x.fans,1000000000)||!int(x.gross)||!int(x.costs)||!int(x.net)||x.gross-x.costs!==x.net||!x.paid||typeof x.paid!=='object'||Array.isArray(x.paid)||Object.entries(x.paid).some(([q,v])=>!QUESTS[q]?.stream||v!==true)||!Array.isArray(x.history)||x.history.length>20)throw Error('bad broadcast stats');let previous=x.attempts+1;for(const r of x.history){if(!r||!HUBS[r.hub]||!BROADCAST_POLICIES[r.policy]||!BROADCAST_GOALS.includes(r.goal)||!BROADCAST_GOALS.includes(r.incomeGoal)||!STREAM_THEMES[r.theme]||!['video','voice'].includes(r.style)||typeof r.goalMet!=='boolean'||typeof r.incomeGoalMet!=='boolean'||r.passed!==(r.score>=80)||r.qid!==null&&(!QUESTS[r.qid]?.stream||QUESTS[r.qid].hub!==r.hub)||typeof r.paid!=='boolean'||typeof r.passed!=='boolean'||!int(r.index,x.attempts)||r.index<1||r.index>=previous||!['viewers','peak','average','newFans','program','support','gross','costs','net','score'].every(k=>int(r[k]))||r.score>170||r.peak>r.viewers||r.average>r.peak||r.gross!==r.program+r.support||r.net!==r.gross-r.costs||r.paid&&(!x.paid[r.qid]||!r.passed)||!r.paid&&(r.net||r.gross||r.costs||r.newFans))throw Error('bad broadcast history');validateBroadcastTimeline(r);previous=r.index;}if(st.stream?.broadcastReceipt)throw Error('settled stream should already be closed');}
const STREAM_UI_TOKENS=new WeakMap();let streamUiSerial=0;
function streamSessionToken(s){if(!STREAM_UI_TOKENS.has(s))STREAM_UI_TOKENS.set(s,'stream-'+(++streamUiSerial));return STREAM_UI_TOKENS.get(s);}
function streamInputReady(s,token){return !!G.st&&!G.readOnly&&G.screen==='stream'&&!G.st.run&&!G.sheet&&!G.dlg&&G.st.stream===s&&!!s&&streamSessionToken(s)===token;}
function streamRetry(token){const st=G.st,s=st?.stream;if(!streamInputReady(s,token)||!s.done||s.score>=80)return false;markStreamFailure(st,s.hub);settleBroadcast(st,s,streamPending());st.stream=null;commit();G.screen='explore';exploreBgm();render();return true;}
function validateStreamSnapshot(s){if(!s)return;const a=s.picks;if(!Array.isArray(a)||a.length!==s.hand||typeof s.done!=='boolean'||s.done!==(s.hand===4)||!['video','voice'].includes(s.style))throw Error('inconsistent stream progress');const probe={requestIds:s.requestIds,theme:s.theme,used:[],themeBonusUsed:false,picks:[],hand:0,score:0,done:false};for(const p of a){if(!p||!STREAM_ACTS[p.act])throw Error('invalid stream pick');const r=streamPlay(probe,p.act);if(p.total!==r.total)throw Error('inconsistent stream gain');}if(s.score!==probe.score||s.themeBonusUsed!==probe.themeBonusUsed||JSON.stringify(s.used)!==JSON.stringify(probe.used))throw Error('inconsistent stream score');}
function streamGrade(score){ return score>=160?"大盛況":score>=120?"好評":score>=80?"目標達成":score>=60?"温かな反応":"もう一歩"; }

/* ---- 名前の検証（第06E節。文字数はユーザー指定で1～12文字） ---- */
const NAME_MAX = 12;
const HW_KANA = "｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
const FW_KANA = "。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン";
function normalizeName(raw){
  let s = raw.replace(/^[ 　]+|[ 　]+$/g,"");
  s = s.replace(/[A-Za-z0-9]/g, ch=>String.fromCharCode(ch.charCodeAt(0)+0xFEE0));
  let out="";
  for(let i=0;i<s.length;i++){
    const ch=s[i], k=HW_KANA.indexOf(ch);
    if(k>=0){ let f=FW_KANA[k]; const nx=s[i+1];
      if(nx==="ﾞ"){ const v=(f+"゙").normalize("NFC"); if(v.length===1){ f=v; i++; } }
      else if(nx==="ﾟ"){ const v=(f+"゚").normalize("NFC"); if(v.length===1){ f=v; i++; } }
      out+=f; }
    else if(ch==="ﾞ") out+="゙"; else if(ch==="ﾟ") out+="゚";
    else out+=ch;
  }
  return out.normalize("NFC");
}
function graphemes(s){
  try{ if(Intl.Segmenter) return Array.from(new Intl.Segmenter("ja",{granularity:"grapheme"}).segment(s), x=>x.segment); }catch(e){}
  return Array.from(s.normalize("NFC"));
}
function nameCharOk(g){
  if(g.length>2) return false;
  if([...g].length!==1) return false;
  const c=g.codePointAt(0);
  if(c>=0x3041&&c<=0x3096) return true;
  if(c>=0x30A1&&c<=0x30FA) return true;
  if("々〆〇ーゝゞヽヾ".includes(g)) return true;
  if((c>=0xFF21&&c<=0xFF3A)||(c>=0xFF41&&c<=0xFF5A)||(c>=0xFF10&&c<=0xFF19)) return true;
  try{ return /^\p{Script=Han}$/u.test(g); }catch(e){ return (c>=0x4E00&&c<=0x9FFF)||(c>=0x3400&&c<=0x4DBF)||(c>=0x20000&&c<=0x2FFFF)||(c>=0xF900&&c<=0xFAFF); }
}
function validateName(raw){
  const s=normalizeName(raw); const gs=graphemes(s); const errors=[];
  gs.forEach((g,i)=>{ if(!nameCharOk(g)) errors.push(`${i+1}文字目「${/\s/.test(g)?"空白":g}」は使えません（使える文字：ひらがな・カタカナ・漢字・全角英数字）。`); });
  if(gs.length===0) errors.push("名前を入力してください。");
  if(gs.length>NAME_MAX) errors.push(`${gs.length}文字です。${NAME_MAX}文字以内に直してください。`);
  return { value:s, count:gs.length, errors, ok:errors.length===0 };
}

if(typeof module!=="undefined") module.exports={};

/* ---- 戦闘オートのAI（ユーザー指定）：候補行動を複製上で試し、評価が最も高い行動を選ぶ ---- */
function aiCandidates(run, a){
  const out=[]; const en=run.enemies.filter(e=>e.hp>0).map(e=>e.slot);
  const al=run.party.filter(m=>m.hp>0).map(m=>m.pos), others=al.filter(p=>p!==a.pos), all=run.party.map(m=>m.pos);
  en.forEach(t=>out.push({type:"attack",target:t}));
  ["greet","plan","thanks"].forEach(l=>out.push({type:"comment",line:l}));
  out.push({type:"guard"},{type:"rest"},{type:"meter"},{type:"family"});
  // 道具：持っている種類ごとに対象を試す
  const downs=run.party.filter(m=>m.hp<=0).map(m=>m.pos);
  for(const e of (run.bag||[])){ const it=ITEMS[e.id]; if(!it||e.n<=0) continue; const nd=itemNeeds(it);
    if(nd==="enemy") en.forEach(t=>out.push({type:"item",item:e.id,target:t}));
    else if(nd==="ally") al.forEach(p=>out.push({type:"item",item:e.id,ally:p}));
    else if(nd==="down") downs.forEach(p=>out.push({type:"item",item:e.id,ally:p}));
    else out.push({type:"item",item:e.id}); }
  const need={J01:"enemy",J02:"line",J03:"ally",J04:"mode",J05:"enemy",J06:"mode",J07:"none",J08:"ally",J09:"enemy",J10:"none",J11:"none",J12:"none",J13:"ally",J14:"none",J15:"enemy",J16:"enemy",J17:"none",J18:"ally",J19:"enemy",J20:"none",J21:"enemy",J22:"allyOther"}[a.job];
  if(need==="enemy") en.forEach(t=>out.push({type:"skill",target:t}));
  if(need==="ally") al.forEach(p=>out.push({type:"skill",ally:p}));
  if(need==="allyOther") others.forEach(p=>out.push({type:"skill",ally:p}));
  if(need==="line") ["greet","plan","thanks"].forEach(l=>out.push({type:"skill",line:l}));
  if(need==="none") out.push({type:"skill"});
  if(need==="mode"){
    if(a.job==="J04"){ al.forEach(p=>out.push({type:"skill",mode:"hp",ally:p})); others.forEach(p=>out.push({type:"skill",mode:"c",ally:p})); }
    else en.forEach(t=>{ out.push({type:"skill",mode:"safe",target:t}); out.push({type:"skill",mode:"bold",target:t}); });
  }
  for(const id of a.extraSkills||[]){const sk=EXTRA_SKILLS[id];if(sk.need==="enemy")en.forEach(t=>out.push({type:"skill",skillId:id,target:t}));else if(sk.need==="ally"||sk.need==="allyOther")(sk.need==="allyOther"?others:al).forEach(t=>out.push({type:"skill",skillId:id,ally:t}));else if(sk.need==="line")["greet","plan","thanks"].forEach(line=>out.push({type:"skill",skillId:id,line}));else if(sk.need==="mode"){if(sk.baseJob==="J04"){al.forEach(ally=>out.push({type:"skill",skillId:id,mode:"hp",ally}));others.forEach(ally=>out.push({type:"skill",skillId:id,mode:"c",ally}));}else en.forEach(target=>["safe","bold"].forEach(mode=>out.push({type:"skill",skillId:id,target,mode})));}else out.push({type:"skill",skillId:id});}
  return out;
}
function aiIncoming(run, m){
  if(m.hp<=0) return 0; let sum=0;
  for(const t of telegraph(run)){
    if(t.type==="c") continue;
    if(t.type==="s" && t.target!==m.pos) continue;
    sum+=incomingDamage(run,m,t);
  }
  return sum;
}
function aiScore(before, after){
  if(after.state==="won") return after.challengeId&&!trialConditions(after).every(c=>c.ok)?-5e5:1e6-after.turn*10;
  if(after.state==="lost") return -1e6;
  let s=0;
  if(after.challengeId){const d=trialOf(after.challengeId),a=trialMetrics(after),b=trialMetrics(before);const ratio=(m)=>Math.min(1,m.comments/(d.comments||Infinity))+Math.min(1,m.people.length/(d.people||Infinity))+Math.min(1,m.skills/(d.skills||Infinity))+Math.min(1,m.masters/(d.masters||Infinity))+Math.min(1,m.family/(d.family||Infinity))+Math.min(1,m.guardPeople.length/(d.guards||Infinity));s+=(ratio(a)-ratio(b))*1800;if(d.kira){s+=after.kiraDone&&!before.kiraDone?2400:Math.max(0,after.chain.stage-before.chain.stage)*600;}}
  // 敵へのダメージと撃破
  for(const e of after.enemies){ const b=before.enemies.find(x=>x.slot===e.slot); s += (b.hp-e.hp)*3; if(b.hp>0&&e.hp<=0) s+=120; if(e.hp>0) s -= e.hp*0.5; }
  // 味方の生存とHP（敵フェーズ前なら予告から被ダメージを見込む）
  const phaseDone = after.turn>before.turn;
  for(const m of after.party){
    const pred = phaseDone? 0 : aiIncoming(after,m);
    const eff = m.hp - pred;
    if(m.hp<=0) { s-=260; continue; }
    if(eff<=0) s-=220; else s += 150*Math.min(1,eff/m.maxHP) + 40;
    s += Math.min(m.c,10)*3 + (m.c<3?-15:0);
  }
  // エールはメーター突破（80で敵全体へ大ダメージ）の元手。残っている敵のHPから1点あたりの価値を見積もる（v5.31）
  { const live=after.enemies.filter(e=>e.hp>0); const bestCha=Math.max(0,...after.party.filter(m=>m.hp>0).map(m=>m.chaStat||0)); const md=live.reduce((t,e)=>t+Math.min(e.hp, Math.max(1,24+6*after.L+Math.floor(bestCha/3)-e.def)*(live.length===1?1.5:1)),0);
    const perA = Math.max(0.6, 3.5*md/80*0.75);
    s += Math.min(after.A,80)*perA + Math.max(0,after.A-80)*0.5 + after.B*4; }
  if(after.cue && after.cue.ready && !(before.cue&&before.cue.ready)) s+=90;
  if(after.kiraDone && !before.kiraDone) s+=40;
  if(after.chain.stage>before.chain.stage) s+=12*after.chain.stage;
  return s;
}
function aiChoose(run){
  let best=null;
  for(const a of run.party){
    if(a.hp<=0||a.acted) continue;
    for(const act of aiCandidates(run,a)){
      const p=planAction(run,a.pos,act); if(!p.ok) continue;
      const sim=JSON.parse(JSON.stringify(run)); sim.log=[]; sim.noRand=true;
      const r=applyAction(sim,a.pos,act); if(!r.ok) continue;
      let sc=aiScore(run,sim);
      if(act.type==="attack") sc+=0.5;            // 同点なら通常攻撃
      if(act.type==="skill" && p.valid) sc+=12;   // 技能の先の効果（エールの積み上げ・防護・連携）を見込んで、職業の技能をやや優先（v5.31）
      if(act.type==="item"){ const it=ITEMS[act.item]; sc -= 10 + 12*it.stars + Math.min(60,Math.max(it.price,it.sell,40)/4); } // 道具は数に限りがあるため控えめに（レアほど温存）
      if(!best||sc>best.score) best={idx:a.pos, act, score:sc, label:actLabel(run,a,act), name:a.name};
    }
  }
  return best;
}

/* ---- 道具袋（20種類×各9個。入らない分は預かり所へ） ---- */
function bagCount(bag,id){ const e=(bag||[]).find(x=>x.id===id); return e?e.n:0; }
function bagRoom(bag,id){ if(typeof id!=='string'||!Object.prototype.hasOwnProperty.call(ITEMS,id))return 0;const e=bag.find(x=>x.id===id); if(e) return BAG_STACK-e.n; return bag.length<BAG_KINDS?BAG_STACK:0; }
/* v7.44: permanent collection records; optional for legacy saves. */
const COLLECTION_BAGS=new WeakMap();
function collectionMark(st,id){if(!Object.prototype.hasOwnProperty.call(ITEMS,id)&&!Object.prototype.hasOwnProperty.call(EQUIP,id)&&!Object.prototype.hasOwnProperty.call(EVENT_ITEMS,id))return;const c=st.collection||(st.collection={version:1,items:{},gear:{},bosses:{}});if(EVENT_ITEMS[id]){c.events=c.events||{};c.events[id]=true;}else (ITEMS[id]?c.items:c.gear)[id]=true;}
function syncCollection(st){if(!st)return;st.collection=st.collection||{version:1,items:{},gear:{},bosses:{}};for(const bag of [st.bag,st.run?.bag])if(Array.isArray(bag)){COLLECTION_BAGS.set(bag,st);for(const e of bag)if(e.n>0)collectionMark(st,e.id);}for(const id of st.keep||[])collectionMark(st,id);for(const[id,n]of Object.entries(st.owned||{}))if(n>0)collectionMark(st,id);for(const e of Object.values(st.equip||{}))for(const id of Object.values(e))if(id)collectionMark(st,id);for(const[id,v]of Object.entries(st.bossDefeated||{}))if(v&&BOSSES[id])st.collection.bosses[id]=true;if(st.run?.bossId&&BOSSES[st.run.bossId])st.collection.bosses[st.run.bossId]=true;st.collection.events=collectionEventSnapshot(st);}
function collectionBagOwner(bag){return COLLECTION_BAGS.get(bag)||(typeof G!=='undefined'&&G.st&&(bag===G.st.bag||bag===G.st.run?.bag)?G.st:null);}
function collectionEventSnapshot(st){const events={...st.collection?.events};for(const[id,n]of Object.entries(st.eventItems||{}))if(n===1&&EVENT_ITEMS[id])events[id]=true;for(const c of NARRATIVE_CASES){const r=caseRecord(st,c.id);if(!r)continue;if(!r.legacy){for(const i of r.found||[])if(c.clues[i])events[c.clues[i]]=true;if(r.step===2)events[c.prop]=true;}if(r.done)events[c.memory]=true;}return events;}
function collectionSnapshot(st){const items={...st.collection?.items},gear={...st.collection?.gear},bosses={...st.collection?.bosses};for(const bag of [st.bag,st.run?.bag])for(const e of bag||[])if(e.n>0&&ITEMS[e.id])items[e.id]=true;for(const id of st.keep||[])if(ITEMS[id])items[id]=true;else if(EQUIP[id])gear[id]=true;for(const[id,n]of Object.entries(st.owned||{}))if(n>0&&EQUIP[id])gear[id]=true;for(const e of Object.values(st.equip||{}))for(const id of Object.values(e))if(EQUIP[id])gear[id]=true;for(const[id,v]of Object.entries(st.bossDefeated||{}))if(v&&BOSSES[id])bosses[id]=true;return {items,gear,bosses,events:collectionEventSnapshot(st)};}
let COLLECTION_CACHE=null;
function collectionCatalog(){if(COLLECTION_CACHE)return COLLECTION_CACHE;const food=Object.fromEntries(REGIONAL_SPECIALTIES.flatMap(r=>r.foods.map(f=>[f.item,{...f,pref:r.pref}]))),list=[];for(const[a,ar]of Object.entries(AREAS))for(let i=0;i<ar.list.length;i++){const e=enemyDef(a,i);list.push({id:e.id,group:'enemy',type:'normal',name:e.name,pref:HUBS[a.slice(0,4)]?.pref||'特設',where:(MAPS[a.slice(0,4)]?.name||a)+'・'+ar.name,area:a,index:i});}for(const[id,b]of Object.entries(BOSSES))list.push({id,group:'enemy',type:'boss',name:b.name,pref:HUBS[b.hub]?.pref||'特設',where:(MAPS[b.hub]?.name||b.hub)+'・ボス'});for(const[id,it]of Object.entries(ITEMS)){const f=food[id];list.push({id,group:'item',type:'consumable',name:it.name,pref:f?.pref||'共通',food:f,where:f?(f.city||REGIONAL_BY_PREF[f.pref].prefecture)+'の店・名物敵':(it.acq==='S'?'ショップ':it.acq==='D'?'敵のドロップ':it.acq==='SD'?'ショップ・敵のドロップ':'宝箱・依頼・報酬など')});}for(const[id,it]of Object.entries(EVENT_ITEMS)){const c=NARRATIVE_CASES.find(c=>c.id===it.caseId);list.push({id,group:'item',type:'event',name:it.name,pref:HUBS[c?.hub]?.pref||'共通',where:(HUBS[c?.hub]?.name||'')+'・'+it.where});}for(const[id,it]of Object.entries(EQUIP))list.push({id,group:'item',type:it.slot,ultra:!!it.ultra,name:it.name,pref:HUBS[it.gearHub]?.pref||'共通',where:it.ultra?guideGearSource(id,it):it.gearSource?gearSourceText(it):'店・宝箱・依頼・報酬など'});return COLLECTION_CACHE=list;}
function collectionKnown(st,s,e){return e.group==='enemy'?(e.type==='boss'?s.bosses[e.id]===true:st.seen?.[e.id]===true||(st.killCount?.[e.id]||0)>0):s[e.type==='consumable'?'items':e.type==='event'?'events':'gear'][e.id]===true;}
function collectionGroup(e,tab){const category=e.group==='enemy'?'enemy':e.ultra?'ultra':e.food?(e.food.series==='soul-food'?'soul':'local'):['w','a','acc'].includes(e.type)?'gear':e.type==='event'?'event':'consumable';return tab==='item'?e.group==='item'&&!e.food&&!e.ultra:category===tab;}
const COLLECTION_COLLATOR=new Intl.Collator('ja',{numeric:true});
function collectionResults(st,d={}){
 const all=collectionCatalog(),snapshot=collectionSnapshot(st),tabs=Object.keys(COLLECTION_LABELS),tab=d.ctab==='item'?'consumable':tabs.includes(d.ctab)?d.ctab:'enemy',status=['all','yes','no'].includes(d.cstatus)?d.cstatus:'all',type=['all','normal','boss','consumable','event','w','a','acc'].includes(d.ctype)?d.ctype:'all',q=guideSearchText(d.cq||'').slice(0,60),pref=d.cpref||'all',sort=['default','name','region','missing'].includes(d.csort)?d.csort:'default',size=[6,12,24].includes(Number(d.csize))?Number(d.csize):d.cdensity==='comfortable'?6:12;
 const summary=Object.fromEntries(tabs.map(t=>{const a=all.filter(e=>collectionGroup(e,t));return [t,{total:a.length,current:a.filter(e=>collectionKnown(st,snapshot,e)).length}]})),base=all.filter(e=>collectionGroup(e,tab)),scope=base.filter(e=>(type==='all'||e.type===type)&&(pref==='all'||e.pref===pref||e.food?.city===pref)),list=scope.filter(e=>(status==='all'||collectionKnown(st,snapshot,e)===(status==='yes'))&&manageMatch(e.name+' '+e.id+' '+e.where+' '+e.pref,q));
 const compare=(a,b)=>COLLECTION_COLLATOR.compare(a.name,b.name)||COLLECTION_COLLATOR.compare(a.id,b.id);if(sort!=='default')list.sort((a,b)=>sort==='missing'?Number(collectionKnown(st,snapshot,a))-Number(collectionKnown(st,snapshot,b))||compare(a,b):sort==='region'?COLLECTION_COLLATOR.compare(a.food?.city||a.pref,b.food?.city||b.pref)||compare(a,b):compare(a,b));
 const pages=Math.max(1,Math.ceil(list.length/size)),page=Math.max(0,Math.min(pages-1,Math.trunc(Number(d.cpage)||0)));return {tab,status,type,q,pref,sort,size,summary,snapshot,base,list,pages,page,scope,visible:list.slice(page*size,page*size+size)};
}
function collectionDetailToggle(detail){if(!detail.open||!detail.closest?.('.collection-list'))return;for(const other of document.querySelectorAll('.collection-list .collection-row details'))if(other!==detail&&other.open)other.open=false;}
function openCollectionFromLink(el){const allowed=Object.keys(COLLECTION_LABELS),tab=allowed.includes(el.dataset.tab)?el.dataset.tab:G.sheet==='regionalGuide'?'local':G.sheet==='items'?'consumable':G.sheet==='equip'?'gear':'enemy';let pref='all';if(G.sheet==='regionalGuide'){const selected=G.sheetData.regionalPref;pref=selected==='KY17'||!selected&&curHub()==='KY17'?'大牟田市':REGIONAL_BY_PREF[selected]?.pref||HUBS[curHub()]?.pref||'all';}if(!G.collectionViews||G.collectionViews.state!==G.st)G.collectionViews={state:G.st,tabs:{}};openSheet('collection',{ctab:tab,cpref:pref});}

function collectionSearchGroups(st,data){const q=guideSearchText(data.cq||'').slice(0,60);if(!q)return [];const matches=collectionCatalog().filter(e=>manageMatch(e.name+' '+e.id+' '+e.where+' '+e.pref,q));return Object.keys(COLLECTION_LABELS).map(tab=>({tab,list:matches.filter(e=>collectionGroup(e,tab))})).filter(g=>g.list.length);}
function renderCollectionSearchHelp(st,data,r){if(!r.q)return '';const groups=collectionSearchGroups(st,data).filter(g=>g.tab!==r.tab||!r.list.length);if(!groups.length)return '';return '<aside class="collection-search-help"><b>ほかの分類・全地域にも検索</b><p class="small">現在は「'+esc(COLLECTION_LABELS[r.tab])+'」内を表示しています。下の分類名を押すと地域・入手状況の条件を外して該当品を表示します。</p>'+groups.map(g=>'<button class="btn" data-a="collectionLocate" data-v="'+g.tab+'">'+esc(COLLECTION_LABELS[g.tab])+'：'+g.list.length+'件</button><p class="small">'+g.list.slice(0,2).map(e=>esc(e.name)).join('／')+(g.list.length>2?' ほか':'')+'</p>').join('')+'</aside>';}
function collectionProgress(current,total,label){return '<div class="collection-progress"><b>'+esc(label)+' '+current+'／'+total+'種類'+(total>0&&current===total?'　コンプリート！':'')+'</b><progress value="'+current+'" max="'+Math.max(1,total)+'" aria-label="'+esc(label)+'">'+current+'/'+total+'</progress><small>残り '+(total-current)+'種類・'+(total?Math.floor(current*100/total):0)+'%</small></div>';}
const COLLECTION_LABELS={enemy:'敵',gear:'装備品',consumable:'消費アイテム',event:'イベントアイテム',ultra:'超レア品',local:'ご当地品',soul:'ソウルフード'};
function collectionMoveToList(){const sheet=$('.sheet'),list=$('#collectionList');if(sheet&&list){const y=list.getBoundingClientRect().top-sheet.getBoundingClientRect().top;sheet.scrollTop=Math.max(0,sheet.scrollTop+y-52);}}
function collectionViewMemory(){if(!G.collectionViews||G.collectionViews.state!==G.st){if(G.collectionViews)G.sheetData={ctab:G.sheetData.ctab||'enemy',cdensity:G.sheetData.cdensity};G.collectionViews={state:G.st,tabs:{}};}return G.collectionViews.tabs;}
function renderCollection(){
 collectionViewMemory();const st=G.st,d=G.sheetData,r=collectionResults(st,d),labels=COLLECTION_LABELS,comfy=d.cdensity==='comfortable';
 const select=(id,label,vals,v)=>'<label>'+label+'<select id="'+id+'">'+vals.map(([k,n])=>'<option value="'+esc(k)+'" '+(v===k?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label>';
 const pager=(bottom=false)=>'<nav class="collection-pages '+(bottom?'collection-bottom':'')+'" aria-label="収集一覧のページ"><button class="btn" data-a="collectionPage" data-v="'+(r.page-1)+'" '+(!r.page?'disabled':'')+'>◀ 前</button><span><b>'+(r.page+1)+'</b>／'+r.pages+'</span><button class="btn" data-a="collectionPage" data-v="'+(r.page+1)+'" '+(r.page>=r.pages-1?'disabled':'')+'>次 ▶</button></nav>';
 const filtered=r.status!=='all'||r.pref!=='all'||r.type!=='all'||!!r.q,scope=r.scope.filter(e=>collectionKnown(st,r.snapshot,e)).length;
 return '<section class="collection-view '+(comfy?'comfortable':'compact')+'"><div class="collection-selector">'+select('collectionCategory','図鑑の分類',Object.entries(labels),r.tab)+'<button class="btn" data-a="collectionDensity" data-v="'+(comfy?'compact':'comfortable')+'" aria-pressed="'+comfy+'">'+(comfy?'一覧をコンパクトに':'文字をゆったり')+'</button></div>'+collectionProgress(r.summary[r.tab].current,r.summary[r.tab].total,r.tab==='enemy'?'遭遇済み':'入手済み')+'<details class="collection-category-list"><summary>ほかの分類の達成状況</summary><nav class="collection-tabs" aria-label="コンプ分類">'+Object.entries(labels).map(([t,n])=>{const x=r.summary[t];return '<button class="btn '+(r.tab===t?'on':'')+'" data-a="collectionTab" data-v="'+t+'" '+(r.tab===t?'aria-current="page"':'')+'><b>'+n+'</b><small>'+x.current+'／'+x.total+'</small></button>';}).join('')+'</nav></details><form id="collectionSearchForm" class="collection-search"><input id="collectionQuery" type="search" inputmode="search" enterkeyhint="search" maxlength="60" value="'+esc(r.q)+'" placeholder="名前・地域・ID" aria-label="図鑑を検索"><button class="btn" data-a="collectionSearch" type="button">検索</button><button class="btn" data-a="collectionClear" type="button" '+(!filtered?'disabled':'')+'>解除</button></form><div class="collection-quick" aria-label="記録で絞り込む">'+[['all','全部'],['no',r.tab==='enemy'?'未遭遇':'未入手'],['yes',r.tab==='enemy'?'遭遇済み':'入手済み']].map(([k,n])=>'<button class="btn '+(r.status===k?'on':'')+'" data-a="collectionFilter" data-k="cstatus" data-v="'+k+'" aria-pressed="'+(r.status===k)+'">'+n+'</button>').join('')+'</div><details class="collection-filter-fold" '+(d.cfilters?'open':'')+' data-collection-fold><summary>地域・並び順・表示件数'+(r.pref!=='all'?'：'+esc(r.pref):'')+'</summary><div class="collection-filters">'+select('collectionPref','地域',[['all','すべて'],...[...new Set(r.base.flatMap(e=>[e.pref,...(e.food?.city?[e.food.city]:[])]))].map(p=>[p,p])],r.pref)+select('collectionType','種類',r.tab==='enemy'?[['all','すべて'],['normal','通常敵'],['boss','ボス']]:['gear','ultra'].includes(r.tab)?[['all','すべて'],['w','武器'],['a','防具'],['acc','アクセサリー']]:r.tab==='event'?[['all','すべて'],['event','イベントアイテム']]:[['all','すべて'],['consumable',r.tab==='consumable'?'消費アイテム':'食品']],r.type)+select('collectionSort','並び順',[['default','図鑑の順'],['name','名前順'],['region','地域順'],['missing','未入手・未遭遇優先']],r.sort)+select('collectionSize','1ページの件数',[['6','6件'],['12','12件'],['24','24件']],String(r.size))+'</div></details>'+(r.pref!=='all'||r.type!=='all'?collectionProgress(scope,r.scope.length,'選択地域・種類'):'')+renderCollectionSearchHelp(st,d,r)+(r.pref!=='all'||r.type!=='all'?'<p class="collection-active-filter">表示条件：'+esc(r.pref==='all'?'全地域':r.pref)+'／'+esc(r.type==='all'?'全種類':({normal:'通常敵',boss:'ボス',consumable:'消費・食品',event:'イベント',w:'武器',a:'防具',acc:'アクセサリー'}[r.type]||r.type))+'</p>':'')+'<p class="collection-result-count" role="status">'+r.list.length+'件'+(r.list.length?'中 '+(r.page*r.size+1)+'～'+Math.min((r.page+1)*r.size,r.list.length)+'件目':'')+'／分類全体 '+r.base.length+'件</p>'+pager()+'<div id="collectionList" class="collection-list" aria-label="図鑑の一覧">'+r.visible.map(e=>{
 const known=collectionKnown(st,r.snapshot,e),defeated=e.group==='enemy'&&(e.type==='boss'?!!st.bossDefeated[e.id]:(st.killCount[e.id]||0)>0),it=ITEMS[e.id]||EQUIP[e.id]||EVENT_ITEMS[e.id],held=e.group==='item'?(e.type==='event'?(st.eventItems?.[e.id]||0):e.type==='consumable'?bagCount(st.run?.bag||st.bag,e.id)+(st.keep||[]).filter(id=>id===e.id).length:(st.owned[e.id]||0)+(st.keep||[]).filter(id=>id===e.id).length):0;
 return '<article class="collection-row '+(known?'collected':'missing')+'"><div class="collection-row-head"><b>'+esc(e.name)+'</b><span class="collection-badge">'+(known?'✓ ':'○ ')+(known?(e.group==='enemy'?'遭遇済み':'入手済み'):(e.group==='enemy'?'未遭遇':'未入手'))+'</span></div><p class="collection-row-meta">'+esc(e.food?.city||e.pref)+' <span>'+(e.group==='enemy'?(defeated?'討伐済み':'未討伐'):'所持 '+held+'個')+'</span></p><details name="collection-detail"><summary>詳細・'+(e.group==='enemy'?'出現地域':'入手先')+'</summary><p>'+esc(e.where)+'</p><p class="small">'+esc(e.id)+'</p>'+(it?'<p>'+esc(it.text||it.name)+'</p>':'<p>遭遇すると図鑑に記録。討伐数：'+(st.killCount[e.id]||0)+'</p>')+(e.group==='enemy'&&e.type==='normal'?renderDex({detail:e.area+'|'+e.index},true):'')+(e.group==='item'&&!['consumable','event'].includes(e.type)?'<p>'+esc(guideGearSource(e.id,it))+'</p>':'')+(e.food?'<p>購入地域：'+esc(e.food.city||REGIONAL_BY_PREF[e.food.pref].prefecture)+(e.food.hub?'限定（九州本編M16クリア後）':'')+'。名物敵からも1/12で抽選。</p><a href="'+esc(e.food.source)+'" target="_blank" rel="noopener noreferrer">公式出典</a>':'')+'</details></article>';
 }).join('')+(!r.list.length?'<div class="collection-empty"><b>条件に合う項目がありません</b><p>「解除」で絞り込みを戻せます。未入手（記録なし）の品も名前で検索できます。</p><button class="btn" data-a="collectionClear">条件を解除</button></div>':'')+'</div>'+pager(true)+'<form id="collectionJumpForm" class="collection-jump"><label>ページ指定<input id="collectionPageNumber" type="number" inputmode="numeric" min="1" max="'+r.pages+'" value="'+(r.page+1)+'" aria-label="移動するページ番号"></label><button class="btn" data-a="collectionJump" type="button">移動</button><button class="btn" data-a="collectionTop" type="button">条件へ戻る ↑</button></form><details class="collection-note"><summary>記録の見方・旧セーブの引き継ぎ</summary><p>敵は遭遇で登録し、討伐は別に表示。アイテムは一度入手すれば使う・売る・捨てる後も記録が残ります。装備品・消費アイテム・イベントアイテム・超レア品・ご当地品・ソウルフードは重複せず別集計です。超レア装備は「超レア品」だけに分類し、「装備品」には含めません。ご当地品とソウルフードも通常の消費アイテムには含めません。</p><p>旧セーブは現在の持ち物・装備・預かり所と既存の敵記録、事件帳の明確な取得記録を反映します。追加前に使い切った・売った品の履歴がない場合は復元できません。「未入手（記録なし）」は入手記録がない状態です。通常のセーブ・バックアップに含まれます。</p></details></section>';
}

function bagAdd(bag,id,n){ if(typeof id!=='string'||!Object.prototype.hasOwnProperty.call(ITEMS,id)||!Number.isSafeInteger(n)||n<=0)return 0; const add=Math.min(n,bagRoom(bag,id)); if(add<=0) return 0; const e=bag.find(x=>x.id===id); if(e) e.n+=add; else bag.push({id,n:add}); const owner=collectionBagOwner(bag);if(owner)collectionMark(owner,id);return add; }
function bagRemove(bag,id,n){ if(!Number.isSafeInteger(n)||n<=0)return 0; const i=bag.findIndex(x=>x.id===id); if(i<0) return 0; const r=Math.min(n,bag[i].n); bag[i].n-=r; if(bag[i].n<=0) bag.splice(i,1); return r; }
function giveItem(st,id,n,res,why){
  if(typeof id!=='string'||!Object.prototype.hasOwnProperty.call(ITEMS,id)||!Number.isSafeInteger(n)||n<=0)return {got:0,kept:0,lost:0};
  st.bag=st.bag||[]; st.keep=st.keep||[];
  const got=bagAdd(st.bag,id,n); let rest=n-got, kept=0;
  while(rest>0 && st.keep.length<KEEP_MAX){ st.keep.push(id); rest--; kept++; }
  if(res){ res.items=res.items||[]; res.itemsKept=res.itemsKept||[]; res.itemsLost=res.itemsLost||[];
    if(got) res.items.push({id,n:got,why}); if(kept) res.itemsKept.push({id,n:kept}); if(rest) res.itemsLost.push({id,n:rest}); }
  if(got||kept)collectionMark(st,id);return {got,kept,lost:rest};
}
function flushKeep(st){ // 預かり所から袋へ（安全地帯で呼ぶ）
  if(!st.keep||!st.keep.length) return 0; let moved=0; const left=[];
  for(const id of st.keep){
    if(EQUIP[id]){ if(eqCanAdd(st,id,1)){ st.owned[id]=(st.owned[id]||0)+1; moved++; } else left.push(id); }
    else if(bagAdd(st.bag,id,1)) moved++; else left.push(id); }
  st.keep=left; return moved;
}
function itemAmount(it, k, maxHP, V, boost){
  const e=it.eff; let v=0;
  if(k==="hp"){ if(e[0]==="hp"||e[0]==="hpc") v=e[1]*V; else if(e[0]==="hp%"||e[0]==="hpc%") v=Math.ceil(maxHP*e[1]/100); }
  if(k==="rev"){ v=Math.ceil(maxHP*e[1]/100); }
  return boost? Math.ceil(v*2) : v;
}
function itemC(it, capRoom){ const e=it.eff; if(e[0]==="c") return e[1]; if(e[0]==="cfull") return capRoom; if(e[0]==="hpc") return e[2]; if(e[0]==="hpc%") return capRoom; return 0; }
function itemNeeds(it){ // 対象の種類
  if(it.cat==="攻撃") return it.target==="敵全体"?"enemyAll":"enemy";
  if(it.cat==="蘇生") return it.target.includes("全員")?"downAll":"down";
  return it.target.includes("全員")?"allyAll":"ally";
}
/* 戦闘中の道具（1行動。エール・コメント連携・JPの有効行動・初撃破エール・ボス対処には数えない） */
function planItem(run,a,act,p,h){
  const it=ITEMS[act.item]; p.item=act.item; p.chain=null;
  if(!it){ p.ok=false; p.reason="道具を選んでください。"; return; }
  if(!canUseJobItem(a.job,a.R,it)){p.ok=false;p.reason=jobItemRequirement(it);return;}
  if(bagCount(run.bag,it.id)<=0){ p.ok=false; p.reason="その道具は持っていません。"; return; }
  const need=itemNeeds(it), V=h.V, boost=a.pouch && it.cat!=="攻撃";
  const mk=(v)=> hasTrait(a,"J04") && it.cat!=="攻撃" ? Math.ceil(v*1.25) : v;
  const healOne=(t)=>{ const hp=mk(itemAmount(it,"hp",t.maxHP,V,boost)); if(hp) h.heal(t,hp); const cc=itemC(it,(t.maxC||10)-t.c); if(cc) h.addC(t,mk(cc)); };
  if(need==="enemy"||need==="enemyAll"){
    const list = need==="enemy" ? [h.needEnemy()].filter(Boolean) : run.enemies.filter(e=>e.hp>0);
    if(!list.length){ p.ok=false; p.reason="対象の敵を選んでください。"; return; }
    for(const e of list){ const d=Math.max(1, it.eff[1]*V - e.def); p.dmg.push({slot:e.slot, amt:Math.min(d,e.hp), raw:d}); }
    if(need==="enemyAll") p.all=true;
  } else if(need==="ally"){ const t=h.needAlly(); if(!t){ p.ok=false; p.reason="対象を選んでください。"; return; } healOne(t); }
  else if(need==="allyAll"){ for(const t of run.party.filter(m=>m.hp>0)) healOne(t); }
  else { // 蘇生
    const downs = run.party.filter(m=>m.hp<=0);
    const list = need==="downAll" ? downs : downs.filter(m=>m.pos===act.ally);
    if(!downs.length){ p.ok=false; p.reason="戦闘不能の仲間がいません。"; return; }
    if(!list.length){ p.ok=false; p.reason="復活させる仲間を選んでください。"; return; }
    for(const t of list) p.heal.push({pos:t.pos, amt:Math.min(t.maxHP,mk(itemAmount(it,"rev",t.maxHP,V,boost))), revive:true});
  }
  const effect = p.dmg.length || p.heal.some(x=>x.amt>0||x.revive) || p.cgain.some(x=>x.amt>0);
  if(!effect){ p.ok=false; p.reason="今は効果がありません。"; return; }
  p.valid=false; p.aGain=0;
}
/* 移動中の道具（攻撃道具は使えない）。MPの上限は最大MP */
function useItemField(st, id, cid){
  const it=ITEMS[id]; if(!it) return {ok:false, reason:"道具がありません。"};
  if(it.battleOnly) return {ok:false, reason:"戦闘中だけ使える道具です。"};
  if(st.run) return {ok:false, reason:"戦闘中は戦闘の道具コマンドから使います。"};
  if(it.job&&(!st.roster.includes(cid)||!canUseJobItem(st.jobs[cid],jobRank(st,cid,st.jobs[cid]),it)))return {ok:false,reason:jobItemRequirement(it)+"（移動中は本人に使用）"};
  if(bagCount(st.bag,id)<=0) return {ok:false, reason:"その道具は持っていません。"};
  ensureVitals(st); const L=partyLevel(st), V=Vof(L), need=itemNeeds(it);
  const all = need==="allyAll"||need==="downAll";
  const targets = all ? st.roster.slice() : [cid];
  const log=[]; let any=false;
  for(const c of targets){
    const s=charStats(st,c,L), v=st.vitals[c]; if(!v) continue; const boost=s.pouch;
    if(need==="down"||need==="downAll"){ if(v.hp>0) continue; v.hp=Math.min(s.maxHP,itemAmount(it,"rev",s.maxHP,V,boost)); any=true; log.push(`${charName(st,c)}が復活（HP${v.hp}）`); continue; }
    if(v.hp<=0){ continue; }
    const hp=Math.min(itemAmount(it,"hp",s.maxHP,V,boost), s.maxHP-v.hp); const cc=Math.min(itemC(it,s.startC-v.c), s.startC-v.c);
    if(hp>0){ v.hp+=hp; any=true; log.push(`${charName(st,c)}のHP＋${hp}`); }
    if(cc>0){ v.c+=cc; any=true; log.push(`${charName(st,c)}のMP＋${cc}`); }
  }
  if(!any) return {ok:false, reason: (need==="down"||need==="downAll") ? "戦闘不能の仲間がいません。" : "今は効果がありません（戦闘不能の人には回復道具が効きません）。"};
  bagRemove(st.bag,id,1);
  return {ok:true, log};
}

