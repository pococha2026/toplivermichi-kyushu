/* ===== platform/audio: 独自作曲の電子音（パルス2声＋三角波ベース＋ノイズ打楽器の4パート） ===== */
const SND = (()=>{
  let ac=null, master=null, bus=null, on=false, cur=null, timer=null, song=null, nextT=0, step=0, waves={}, noiseBuf=null;
  const NOTE={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11};
  const midi = s => { const m=s.match(/^([A-G][#b]?)(\d)$/); return m? 12*(+m[2]+1)+NOTE[m[1]] : null; };
  const hz = n => 440*Math.pow(2,(n-69)/12);
  const CH={"":[0,4,7],m:[0,3,7],"7":[0,4,7,10],m7:[0,3,7,10],maj7:[0,4,7,11],sus4:[0,5,7],dim:[0,3,6]};
  const chord = s => { const m=s.match(/^([A-G][#b]?)(.*)$/); return {root:NOTE[m[1]], q:CH[m[2]]||CH[""]}; };

  /* 曲データ：lead は8分音符ごと（- は伸ばす、. は休符）。chords は1小節ごと */
  const SONGS = {
    chugoku:{bpm:106,style:"harbor",chords:"F C Dm Am Bb F Gm C",lead:"A5 - C6 - F6 - E6 C6 | G5 - E5 - C6 - G5 - | A5 - D6 - F6 - E6 D6 | C6 - A5 - E5 - . . | D6 - F6 - Bb5 - A5 - | C6 - A5 - F5 - C6 - | Bb5 - D6 - G6 - F6 D6 | E6 - C6 - G5 - . ."},
    kinki:{bpm:122,style:"town",chords:"D A Bm F#m G D Em A",lead:"F#5 A5 D6 - E6 D6 A5 - | C#6 - E6 - A5 - . . | D6 - F#6 - E6 D6 B5 - | A5 - C#6 - F#5 - . . | B5 D6 G6 - F#6 D6 B5 - | A5 - F#5 - D6 - A5 - | G5 B5 E6 - D6 B5 G5 - | A5 - C#6 - E6 - . ."},
    hokuriku:{bpm:80,style:"soft",chords:"Eb Bb Cm Gm Ab Eb Fm Bb",lead:"G5 - Bb5 - Eb6 - - - | D6 - Bb5 - F5 - . . | G5 - C6 - Eb6 - D6 C6 | Bb5 - G5 - D5 - . . | C6 - Eb6 - Ab6 - G6 Eb6 | Bb5 - G5 - Eb5 - - - | Ab5 - C6 - F6 - Eb6 C6 | D6 - Bb5 - F5 - . ."},
    tohoku:{bpm:96,style:"march",chords:"G D Em Bm C G Am D",lead:"B5 - D6 - G6 - F#6 D6 | A5 - F#5 - D6 - . . | B5 - E6 - G6 - F#6 E6 | D6 - B5 - F#5 - . . | E6 - G6 - C6 - B5 - | D6 - B5 - G5 - - - | C6 - E6 - A5 - C6 E6 | F#6 - D6 - A5 - . ."},
    kanto:{bpm:132,style:"pop",chords:"C G Am Em F C Dm G",lead:"E6 - G6 - C6 D6 E6 G6 | B6 - A6 - G6 - D6 - | E6 - C6 - A5 B5 C6 E6 | G6 - E6 - B5 - . . | A6 - G6 - F6 E6 D6 C6 | E6 - G6 - C7 - G6 - | F6 - E6 - D6 - A5 - | B5 - D6 - G6 - . ."},
    encore:{bpm:138,style:"march",chords:"Dm Bb F C Gm Dm Bb A7",lead:"D6 - A5 - F6 - E6 D6 | F6 - D6 - Bb5 - . . | A5 C6 F6 - G6 F6 C6 - | E6 - C6 - G5 - . . | G5 Bb5 D6 - G6 - F6 - | E6 D6 A5 - F6 - D6 - | Bb5 D6 F6 - A6 G6 F6 D6 | C#6 - E6 - A6 - . ."},
    title:{ bpm:88, style:"soft", chords:"C G Am Em F C Dm G F G Em Am Dm G C C",
      lead:"E5 - G5 - C6 - B5 A5 | G5 - - - D5 - G5 - | A5 - C6 - E6 - D6 C6 | B5 - - - G5 - - - | A5 - F5 - C6 - A5 - | G5 - E5 - C5 - E5 G5 | F5 - A5 - D6 - C6 A5 | B5 - - - - - . . | A5 - C6 - F6 - E6 C6 | D6 - - - B5 - G5 - | E6 - G6 - E6 - B5 - | C6 - - - A5 - E5 - | F5 - A5 - D6 - C6 A5 | B5 - D6 - G6 - F6 D6 | E6 - - - G5 - C6 - | C6 - - - - - . ." },
    fukuoka:{ bpm:120, style:"town", chords:"F C Dm Bb F C Bb C Bb C Am Dm Gm C F F",
      lead:"C5 F5 A5 - G5 F5 E5 F5 | G5 - E5 - C5 - . . | D5 F5 A5 - C6 - A5 G5 | F5 - D5 - Bb4 - . . | C5 F5 A5 - C6 A5 Bb5 C6 | D6 - C6 - G5 - E5 - | F5 G5 A5 - Bb5 A5 G5 F5 | E5 - G5 - C6 - . . | D6 - F6 - D6 C6 Bb5 - | C6 - E6 - G6 - E6 C6 | A5 - C6 - E6 - C6 A5 | D6 - - - A5 - F5 - | G5 - Bb5 - D6 - C6 Bb5 | C6 - - - E6 - G6 - | F6 - C6 - A5 - C6 - | F5 - - - - - . ." },
    field:{ bpm:132, style:"march", chords:"Dm C Bb A Dm C Bb A7 Gm Dm Bb C Gm A Dm Dm",
      lead:"D5 - A4 - D5 E5 F5 - | E5 - C5 - G5 - E5 - | F5 - D5 - Bb5 - A5 G5 | A5 - - - E5 - C#5 - | D5 - F5 - A5 - D6 - | C6 - G5 - E5 - C5 - | D5 E5 F5 - G5 F5 E5 D5 | C#5 - E5 - A5 - . . | G5 - Bb5 - D6 - Bb5 G5 | F5 - A5 - D6 - A5 F5 | Bb5 - D6 - F6 - D6 Bb5 | C6 - - - G5 - E5 - | D6 - C6 Bb5 G5 - Bb5 - | A5 - C#6 - E6 - C#6 A5 | D6 - A5 - F5 - A5 - | D5 - - - - - . ." },
    battle:{ bpm:156, style:"battle", chords:"Am F G E Am F Dm E7 Dm Am F G Dm E Am E7",
      lead:"A5 - E5 A5 C6 - B5 A5 | F5 - A5 - C6 - A5 F5 | G5 - B5 - D6 - B5 G5 | G#5 - B5 - E6 - D6 B5 | A5 - C6 - E6 - D6 C6 | F6 - E6 - C6 - A5 - | D6 - C6 - A5 - F5 A5 | G#5 - E5 - B5 - E6 - | D6 - F6 - A6 - F6 D6 | C6 - E6 - A6 - E6 C6 | A5 - C6 - F6 - E6 C6 | B5 - D6 - G6 - D6 B5 | F6 - E6 - D6 - A5 - | G#5 - B5 - E6 - D6 B5 | A5 - C6 - E6 - A6 - | G#6 - E6 - B5 - G#5 -" },
    boss:{ bpm:144, style:"boss", chords:"Em C D B7 Em C Am B7 Am Em C B7 Am Em F# B7",
      lead:"E5 - - G5 F#5 - E5 - | G5 - E5 - C5 - E5 G5 | A5 - - F#5 D5 - A5 - | B5 - A5 - F#5 - D#5 - | E6 - B5 - G5 - E5 - | C6 - B5 - G5 - E5 G5 | A5 - C6 - E6 - D6 C6 | B5 - - - D#6 - B5 - | A5 - C6 - E6 - C6 A5 | B5 - - G5 E5 - G5 B5 | C6 - E6 - G6 - E6 C6 | D#6 - F#6 - A6 - F#6 D#6 | E6 - C6 - A5 - C6 E6 | G6 - E6 - B5 - E6 - | F#6 - C#6 - A#5 - C#6 F#6 | D#6 - - - B5 - - -" },
    stream:{ bpm:126, style:"pop", chords:"G D Em C G D C D Em C G D Em C Am D",
      lead:"B5 - D6 - G5 - A5 B5 | A5 - F#5 - D5 - . A5 | G5 - B5 - E6 - D6 B5 | C6 - - - G5 - E5 - | D6 - B5 - G5 A5 B5 D6 | F#6 - E6 - D6 - A5 - | E6 - D6 - C6 - B5 A5 | A5 - - - B5 - C6 - | G5 - B5 - E6 - D6 B5 | C6 - E6 - G6 - E6 C6 | D6 - B5 - G5 - B5 D6 | F#6 - - - D6 - A5 - | E6 - G6 - E6 - B5 - | C6 - - - E6 - G6 - | A6 - G6 - E6 - C6 - | D6 - - - F#6 - A6 -" },
    kitakyushu:{ bpm:112, style:"harbor", chords:"G Em C D G Em Am D C D Bm Em Am D G G",
      lead:"D5 G5 B5 - A5 G5 D5 - | E5 - G5 - B5 - A5 G5 | E5 - C5 - G5 - E5 - | F#5 - A5 - D6 - . . | B5 - D6 - B5 A5 G5 - | G5 - B5 - E6 - D6 B5 | C6 - A5 - E5 - C6 B5 | A5 - - - F#5 - D5 - | E5 G5 C6 - B5 - G5 - | F#5 A5 D6 - C6 - A5 - | B5 - D6 - F#6 - D6 B5 | G5 - - - E5 - B5 - | A5 - C6 - E6 - D6 C6 | D6 - C6 - A5 - F#5 - | G5 - B5 - D6 - B5 - | G5 - - - - - . ." },
    home:{ bpm:76, style:"soft", chords:"F Am Bb C F Dm Gm C",
      lead:"A5 - - - C6 - A5 - | E5 - - - A5 - C6 - | D6 - - - Bb5 - F5 - | G5 - - - E5 - C5 - | F5 - A5 - C6 - F6 - | E6 - D6 - A5 - F5 - | G5 - Bb5 - D6 - C6 Bb5 | A5 - - - G5 - - -" },
    victory:{ bpm:108, style:"town", chords:"C Am F G C Am Dm G",
      lead:"E5 - G5 - C6 - G5 - | A5 - E5 - C5 - E5 - | F5 - A5 - C6 - A5 - | B5 - D6 - G5 - . . | E6 - D6 C6 B5 - C6 - | A5 - - - E5 - A5 - | F5 - E5 - D5 - F5 - | G5 - - - B5 - D6 -" },
    saga:{ bpm:104, style:"town", chords:"D Bm G A D Bm Em A",
      lead:"F#5 - A5 - D6 - A5 - | B5 - - - F#5 - D5 - | G5 - B5 - D6 - B5 G5 | A5 - - - E5 - C#5 - | D5 F#5 A5 - D6 - E6 - | F#6 - D6 - B5 - A5 - | G5 - E5 - B5 - G5 - | A5 - - - - - . ." },
    nagasaki:{ bpm:100, style:"harbor", chords:"Am Dm E Am F Dm E7 Am",
      lead:"E5 - A5 - C6 - B5 A5 | D6 - - - A5 - F5 - | G#5 - B5 - E6 - D6 B5 | A5 - - - E5 - . . | F5 - A5 - C6 - F6 - | D6 - C6 - A5 - F5 - | E5 - G#5 - B5 - D6 - | A5 - - - - - . ." },
    kumamoto:{ bpm:116, style:"town", chords:"C G Am F C G F G",
      lead:"G5 - C6 - E6 - D6 C6 | B5 - - - G5 - D5 - | C5 - E5 - A5 - G5 E5 | F5 - A5 - C6 - . . | E6 - D6 C6 G5 - E5 - | D5 - G5 - B5 - D6 - | C6 - A5 - F5 - A5 - | G5 - - - - - . ." },
    oita:{ bpm:84, style:"soft", chords:"Eb Cm Ab Bb Eb Cm Fm Bb",
      lead:"G5 - - - Bb5 - Eb6 - | C6 - - - G5 - Eb5 - | Ab5 - C6 - Eb6 - C6 - | Bb5 - - - F5 - D5 - | Eb5 - G5 - Bb5 - Eb6 - | D6 - C6 - G5 - Eb5 - | F5 - Ab5 - C6 - Ab5 - | Bb5 - - - - - . ." },
    miyazaki:{ bpm:124, style:"pop", chords:"A E F#m D A E D E",
      lead:"C#6 - E6 - A5 - B5 C#6 | B5 - G#5 - E5 - . B5 | A5 - C#6 - F#6 - E6 C#6 | D6 - - - A5 - F#5 - | E6 - C#6 - A5 B5 C#6 E6 | G#6 - F#6 - E6 - B5 - | F#6 - E6 - D6 - C#6 B5 | B5 - - - - - . ." },
    kagoshima:{ bpm:110, style:"harbor", chords:"Em C D Bm Em C Am B7",
      lead:"B4 - E5 - G5 - B5 - | C6 - B5 - G5 - E5 - | D5 - F#5 - A5 - D6 - | B5 - - - F#5 - D5 - | E5 G5 B5 - E6 - D6 B5 | C6 - - - G5 - E5 - | A5 - C6 - E6 - C6 A5 | B5 - - - D#6 - B5 - " },
    okinawa:{ bpm:108, style:"harbor", chords:"C F G C C F G C",
      lead:"E5 F5 G5 - B5 - C6 - | F5 - - - E5 - C5 - | G5 - B5 - C6 B5 G5 - | E5 - - - C5 - . . | C6 - B5 - G5 - F5 E5 | F5 - G5 - C6 - . . | B5 - G5 - F5 - E5 F5 | C5 - - - - - . ." },
    omuta:{ bpm:118, style:"march", chords:"Dm Bb C A Dm Gm A Dm",
      lead:"D5 - F5 - A5 - D6 - | Bb5 - A5 - F5 - D5 - | C5 - E5 - G5 - C6 - | A5 - - - E5 - . . | D6 - C6 - A5 - F5 - | G5 - Bb5 - D6 - . . | C#6 - A5 - E5 - G5 F5 | D5 - - - - - . ." },
    ending:{ bpm:96, style:"soft", chords:"F G Em Am Dm G C C",
      lead:"A5 - - G5 F5 - C6 - | B5 - - A5 G5 - D6 - | E6 - D6 - B5 - G5 - | A5 - - - E5 - A5 - | F5 - A5 - D6 - C6 A5 | B5 - - - G5 - D6 - | E6 - - - D6 - C6 - | C6 - - - - - . ." }
  };
  const STYLE = {
    soft:  {bass:"r . . . 5 . . .", arp:"0 1 2 1 0 1 2 1", hat:"", kick:"", snare:"", leadVol:.32, arpVol:.08, bassVol:.5, pad:.05, harm:.12},
    harbor:{bass:"r . . 5 r8 . 5 .", arp:"0 1 2 1 0 2 1 2", hat:". x . x . x . x", kick:"x . . . x . . .", snare:". . . . x . . .", leadVol:.3, arpVol:.08, bassVol:.55, pad:.035, harm:.11, swing:.12},
    town:  {bass:"r . 5 . r8 . 5 .", arp:"0 1 2 1 0 1 2 1", hat:"x . x . x . x .", kick:"x . . . . . . .", snare:". . . . x . . .", leadVol:.3, arpVol:.09, bassVol:.55, pad:.03, harm:.1, swing:.1},
    march: {bass:"r . r 5 r . r 5", arp:"0 2 1 2 0 2 1 2", hat:"x x x x x x x x", kick:"x . . . x . . .", snare:". . x . . . x .", leadVol:.3, arpVol:.08, bassVol:.55, harm:.1, fill:true},
    battle:{bass:"r r8 r r8 r r8 r r8", arp:"0 1 2 3 2 1 0 1", hat:"x x x x x x x x", kick:"x . . x x . . .", snare:". . x . . . x .", leadVol:.3, arpVol:.1, bassVol:.6, harm:.1, fill:true, crash:true},
    boss:  {bass:"r r r r8 r r r 5", arp:"0 2 0 2 1 2 1 2", hat:"x . x x x . x x", kick:"x . x . x . x .", snare:". . . . x . . x", leadVol:.32, arpVol:.1, bassVol:.65, harm:.11, fill:true, crash:true, pad:.03},
    pop:   {bass:"r . r8 . 5 . r8 .", arp:"0 1 2 1 2 1 0 1", hat:"x x x x x x x x", kick:"x . . . x . . .", snare:". . x . . . x .", leadVol:.3, arpVol:.09, bassVol:.55, pad:.03, harm:.1, fill:true}
  };
  function compile(s){
    const st=STYLE[s.style]; const bars=s.chords.split(" ").map(chord);
    const toks=s.lead.replace(/\|/g," ").trim().split(/\s+/); const lead=[];
    toks.forEach((t,i)=>{ const n=midi(t); if(n!=null){ let len=1; while(toks[i+len]==="-") len++; lead.push({step:i,n,len}); } });
    const pat = p => p? p.split(" ") : [];
    const harm=[];
    if(st.harm) for(const e of lead){ if(e.len<2) continue; const ch=bars[Math.floor(e.step/8)%bars.length]; let best=null;
      for(let n=e.n-3;n>=e.n-9;n--){ const pc=((n-ch.root)%12+12)%12; if(ch.q.includes(pc)){ best=n; break; } }
      if(best!=null) harm.push({step:e.step, n:best, len:e.len}); }
    return { bpm:s.bpm, steps:bars.length*8, bars, lead, harm, st, bass:pat(st.bass), arp:pat(st.arp), hat:pat(st.hat), kick:pat(st.kick), snare:pat(st.snare) };
  }
  /* 音の通り道：パート別バス → 音色EQ → コンプレッサー → 出力。リバーブとディレイは送りで混ぜる */
  let bgmOut=null, musicBus=null, sfxBus=null, revIn=null, dlyIn=null, dly=null, musicFx=null, effectFx=null;
  const mix={bgm:0.65,sfx:0.65}, recentSfx=new Map();
  function mixValue(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0.65;}
  function ramp(node,value,seconds=0.06){if(!node||!ac)return;node.gain.cancelScheduledValues(ac.currentTime);node.gain.setValueAtTime(node.gain.value,ac.currentTime);node.gain.linearRampToValueAtTime(value,ac.currentTime+seconds);}
  function setMix(bgm,sfx){mix.bgm=mixValue(bgm);mix.sfx=mixValue(sfx);ramp(musicBus,0.5*mix.bgm);ramp(sfxBus,0.75*mix.sfx);}
  function makeEffects(output,buffer){
    const rev=ac.createGain(),conv=ac.createConvolver(),lp=ac.createBiquadFilter(),wet=ac.createGain();conv.buffer=buffer;lp.type="lowpass";lp.frequency.value=4200;wet.gain.value=0.34;rev.connect(conv);conv.connect(lp);lp.connect(wet);wet.connect(output);
    const send=ac.createGain(),delay=ac.createDelay(1.5),fb=ac.createGain(),dlp=ac.createBiquadFilter(),dw=ac.createGain();delay.delayTime.value=0.3;fb.gain.value=0.22;dlp.type="lowpass";dlp.frequency.value=2600;dw.gain.value=0.28;send.connect(delay);delay.connect(dlp);dlp.connect(fb);fb.connect(delay);dlp.connect(dw);dw.connect(output);
    return {rev,send,delay};
  }
  function impulse(sec,decay){ const len=Math.floor(ac.sampleRate*sec), b=ac.createBuffer(2,len,ac.sampleRate);
    for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<len;i++){ const t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*(i<ac.sampleRate*0.012?i/(ac.sampleRate*0.012):1); } } return b; }
  function init(){
    if(ac) return true;
    try{
      ac=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"balanced"});
      const comp=ac.createDynamicsCompressor(); comp.threshold.value=-16; comp.knee.value=12; comp.ratio.value=3.5; comp.attack.value=0.004; comp.release.value=0.18;
      master=ac.createGain(); master.gain.value=0; master.connect(comp); comp.connect(ac.destination);
      const low=ac.createBiquadFilter(); low.type="lowshelf"; low.frequency.value=140; low.gain.value=2.5;
      const high=ac.createBiquadFilter(); high.type="highshelf"; high.frequency.value=5200; high.gain.value=-5;
      low.connect(high); high.connect(master);
      musicBus=ac.createGain(); musicBus.gain.value=0.5*mix.bgm; musicBus.connect(low);
      sfxBus=ac.createGain(); sfxBus.gain.value=0.75*mix.sfx; sfxBus.connect(low);
      bus=musicBus;
      // Dry and wet signals share each channel's gain, so BGM 0 also silences its reverb.
      const room=impulse(1.25,2.8);musicFx=makeEffects(musicBus,room);effectFx=makeEffects(sfxBus,room);revIn=musicFx.rev;dlyIn=musicFx.send;dly=musicFx.delay;
      const pulse=d=>{ const N=48, re=new Float32Array(N), im=new Float32Array(N); for(let n=1;n<N;n++) re[n]=2/(n*Math.PI)*Math.sin(n*Math.PI*d)*Math.exp(-n/36); return ac.createPeriodicWave(re,im); };
      waves={p25:pulse(.25), p12:pulse(.125), p50:pulse(.5)};
      noiseBuf=ac.createBuffer(1,ac.sampleRate*1,ac.sampleRate); const nd=noiseBuf.getChannelData(0); for(let i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
      return true;
    }catch(e){ ac=null; return false; }
  }
  /* 1音：オシレーター（2本で厚み）→ 音量エンベロープ → ローパス → 定位 → バス＋送り */
  function voice(f, t, dur, wave, vol, opt={}){
    const fx=opt.out===sfxBus?effectFx:musicFx,out=opt.out||bgmOut||musicBus, A=opt.a??0.006, D=opt.d??0.08, S=opt.sus??0.7, R=opt.r??0.06;
    const nodes=[],endAt=t+Math.max(A+D,dur)+R+0.03;let active=0;
    const watch=o=>{active++;o.onended=()=>{try{o.disconnect();}catch(e){}if(--active===0)for(const n of nodes)try{n.disconnect();}catch(e){}};return o;};
    const g=ac.createGain(), flt=ac.createBiquadFilter();nodes.push(g,flt); flt.type="lowpass"; flt.Q.value=opt.q??0.7;
    const cut=opt.cutoff??4000; flt.frequency.setValueAtTime(cut+(opt.fenv||0),t); flt.frequency.exponentialRampToValueAtTime(Math.max(200,cut),t+Math.min(0.25,dur));
    const pan=ac.createStereoPanner?ac.createStereoPanner():null; if(pan){pan.pan.value=opt.pan||0;nodes.push(pan);}
    const mk=(det,lvl)=>{ const o=watch(ac.createOscillator()); if(waves[wave]) o.setPeriodicWave(waves[wave]); else o.type=wave; o.frequency.setValueAtTime(f,t); o.detune.value=det;
      if(opt.slide) o.frequency.exponentialRampToValueAtTime(opt.slide,t+dur);
      if(opt.vib && dur>0.22){ const l=watch(ac.createOscillator()), lg=ac.createGain();nodes.push(lg); l.frequency.value=5.2; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*0.01,t+0.2); l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(endAt); }
      const og=ac.createGain();nodes.push(og); og.gain.value=lvl; o.connect(og); og.connect(g); o.start(t); o.stop(endAt); };
    if(opt.detune){ mk(-opt.detune,0.55); mk(opt.detune,0.55); } else mk(0,1);
    if(opt.sub){ const o=watch(ac.createOscillator()); o.type="sine"; o.frequency.setValueAtTime(f/2,t); const og=ac.createGain();nodes.push(og); og.gain.value=0.6; o.connect(og); og.connect(g); o.start(t); o.stop(endAt); }
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+A); g.gain.linearRampToValueAtTime(vol*S,t+A+D);
    g.gain.setValueAtTime(vol*S,t+Math.max(A+D,dur)); g.gain.linearRampToValueAtTime(0.0001,t+Math.max(A+D,dur)+R);
    g.connect(flt); const last = pan? (flt.connect(pan),pan) : flt; last.connect(out);
    if(opt.rev){ const s=ac.createGain();nodes.push(s); s.gain.value=opt.rev; last.connect(s); s.connect(fx.rev); }
    if(opt.dly){ const s=ac.createGain();nodes.push(s); s.gain.value=opt.dly; last.connect(s); s.connect(fx.send); }
  }
  function noise(t, dur, vol, hp, opt={}){
    const nodes=[],fx=opt.out===sfxBus?effectFx:musicFx;const s=ac.createBufferSource(); s.buffer=noiseBuf; s.playbackRate.value=opt.rate||1;
    const f=ac.createBiquadFilter(); f.type=opt.type||"highpass"; f.frequency.value=hp; f.Q.value=opt.q??0.7;
    const g=ac.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    const pan=ac.createStereoPanner?ac.createStereoPanner():null; if(pan) pan.pan.value=opt.pan||0;
    nodes.push(s,f,g);if(pan)nodes.push(pan);s.onended=()=>{for(const n of nodes)try{n.disconnect();}catch(e){}};s.connect(f); f.connect(g); const last=pan?(g.connect(pan),pan):g; last.connect(opt.out||bgmOut||musicBus);
    if(opt.rev){ const r=ac.createGain();nodes.push(r); r.gain.value=opt.rev; last.connect(r); r.connect(fx.rev); }
    s.start(t, Math.random()*0.5); s.stop(t+dur+0.02);
  }
  function kick(t,out){ voice(165,t,0.13,"sine",1.0,{slide:42,a:0.002,d:0.05,sus:0.6,r:0.12,cutoff:900,out}); noise(t,0.012,0.35,2500,{out}); }
  function snare(t,out){ noise(t,0.16,0.5,1900,{type:"bandpass",q:0.6,rev:0.28,out}); voice(195,t,0.06,"triangle",0.35,{slide:140,a:0.001,d:0.03,sus:0.4,r:0.06,cutoff:1500,out}); }
  function hat(t,k,out){ noise(t,0.035,0.16,7800,{pan:k%2?0.3:-0.3,out}); }
  function schedule(){
    const S=song; if(!S||!ac||!on||document.hidden) return; const sd=60/S.bpm/2;
    // 処理が詰まって予定時刻を過ぎたら、遅れた音をまとめて鳴らさず今の時刻から続ける（音の団子・途切れ防止）
    if(nextT < ac.currentTime-0.05){ const lag=Math.ceil((ac.currentTime-nextT)/sd); step+=lag; nextT+=lag*sd; if(nextT<ac.currentTime+0.03) nextT=ac.currentTime+0.03; }
    while(nextT < ac.currentTime+0.35){
      const i=step%S.steps, bar=Math.floor(i/8), k=i%8, ch=S.bars[bar];
      const sw = S.st.swing && k%2 ? sd*S.st.swing : 0, t=nextT+sw; // 裏拍を少し遅らせて跳ねる（スウィング）
      for(const e of S.lead) if(e.step===i) voice(hz(e.n),t,sd*e.len*0.92,"p25",S.st.leadVol,{vib:true,detune:6,cutoff:3000,fenv:1800,q:1.2,rev:0.24,dly:0.2,a:0.008,d:0.1,sus:0.72,r:0.1});
      for(const e of S.harm) if(e.step===i) voice(hz(e.n),t,sd*e.len*0.9,"p12",S.st.harm,{pan:0.3,cutoff:2200,rev:0.35,a:0.02,d:0.12,sus:0.7,r:0.12});
      // パッド：小節の頭で和音を柔らかく伸ばす
      if(S.st.pad && k===0){ for(const iv of ch.q.slice(0,3)){ voice(hz(57+((ch.root+iv)%12)),nextT,sd*7.6,"triangle",S.st.pad,{cutoff:1600,rev:0.5,a:0.18,d:0.3,sus:0.8,r:0.3,pan:iv%2?0.25:-0.25}); } }
      // フィル：4小節目の後半は小太鼓を細かく、次の頭でシンバル
      if(S.st.fill && bar%4===3 && k>=5){ snare(t); }
      if(S.st.crash && bar%4===0 && k===0) noise(nextT,0.9,0.22,5200,{rev:0.4});
      const root=ch.root, bt=S.bass[k];
      if(bt && bt!=="."){ const base=36+root+(root>7?-12:0)+12; const n = bt==="r"?base: bt==="r8"?base+12 : base+7; voice(hz(n),nextT,sd*0.85,"triangle",S.st.bassVol,{sub:true,cutoff:1300,fenv:600,a:0.004,d:0.06,sus:0.85,r:0.05}); }
      const at=S.arp[k]; if(at!=null){ const q=ch.q; const n=60+root+(q[(+at)%q.length])+(+at>=q.length?12:0); voice(hz(n),nextT,sd*0.55,"p12",S.st.arpVol*1.2,{pan:k%2?0.4:-0.4,cutoff:2400,fenv:1200,rev:0.32,a:0.004,d:0.05,sus:0.45,r:0.08}); }
      if(S.hat[k]==="x") hat(t,k);
      if(S.kick[k]==="x") kick(nextT);
      if(S.snare[k]==="x" && !(S.st.fill && bar%4===3 && k>=5)) snare(t);
      nextT+=sd; step++;
    }
  }
  function play(name){
    if(jingleT){ clearTimeout(jingleT); jingleT=null; }
    if(cur===name && (timer||!on)) return;
    cur=name; stopBgm();
    if(!on||!ac||document.hidden||!SONGS[name]) return;
    bgmOut=ac.createGain(); bgmOut.gain.value=0; bgmOut.connect(musicBus);ramp(bgmOut,1,0.12);
    song=compile(SONGS[name]); step=0; nextT=ac.currentTime+0.06; if(dly) dly.delayTime.setValueAtTime(Math.min(1.2,60/song.bpm*0.75),ac.currentTime);
    schedule(); timer=setInterval(schedule,25);
  }
  /* ジングル：短い曲を1回鳴らし、終わったら next の曲へ（勝利・レベルアップ・全滅） */
  const JINGLES = {
    fanfare:{ bpm:150, lead:"C5 C5 C5 - C5 - G#4 - A#4 - C5 - A#4 C5 - - | G5 - - - - - . .", bass:"C3 . C3 . C3 . G#2 . A#2 . C3 . A#2 C3 . . | G2 - C3 - C2 - . ." , harm:"E4 E4 E4 - E4 - C4 - D4 - E4 - D4 E4 - - | B4 - - - - - . ." },
    levelup:{ bpm:168, lead:"G5 - B5 - D6 - G6 - | F#6 - D6 - A5 - D6 - | G6 - - - B6 - - - | G6 - - - - - . .", bass:"G3 - . - D3 - . - | D3 - . - F#3 - . - | G3 - . - D3 - . - | G2 - - - - - . .", harm:"D5 - G5 - B5 - D6 - | D6 - A5 - F#5 - A5 - | D6 - - - G6 - - - | D6 - - - - - . ." },
    lose:{ bpm:90, lead:"E5 - D#5 - D5 - C#5 - | C5 - - - B4 - - - | A4 - - - - - . .", bass:"A3 - - - G#3 - - - | F3 - - - E3 - - - | A2 - - - - - . .", harm:"C5 - B4 - A#4 - A4 - | G#4 - - - G4 - - - | E4 - - - - - . ." }
  };
  let jingleT=null;
  function jingle(name, next){
    clearTimeout(jingleT);
    const J=JINGLES[name]; if(!J) return;
    stopBgm(); cur=next||null;
    if(!on||!ac||document.hidden){ return; }
    bgmOut=ac.createGain();bgmOut.gain.value=1;bgmOut.connect(musicBus);const jingleOut=bgmOut;
    const sd=60/J.bpm/2; let t0=ac.currentTime+0.05, steps=0;
    const lane=(str,wave,vol,o)=>{ const toks=str.replace(/\|/g," ").trim().split(/\s+/); steps=Math.max(steps,toks.length);
      toks.forEach((tk,i)=>{ const n=midi(tk); if(n==null) return; let len=1; while(toks[i+len]==="-") len++; voice(hz(n),t0+i*sd,sd*len*0.92,wave,vol,{out:jingleOut,vib:len>2,...o}); }); };
    lane(J.lead,"p25",0.34,{detune:7,cutoff:3400,fenv:2000,q:1.2,rev:0.3,dly:0.15,sus:0.8,r:0.14});
    lane(J.harm,"p12",0.18,{pan:-0.35,cutoff:2600,rev:0.35,sus:0.7,r:0.12});
    lane(J.bass,"triangle",0.5,{sub:true,cutoff:1300,sus:0.9,r:0.08});
    for(let i=0;i<steps;i+=4) kick(t0+i*sd,jingleOut);
    jingleT=setTimeout(()=>{ jingleT=null; if(next){ const n=next; cur=null; play(n); } }, (steps*sd+0.25)*1000);
  }
  function stopBgm(){ if(timer){ clearInterval(timer); timer=null; }
    // 先読みで予約済みの音を短くフェードして止め、次の曲と重ならないようにする
    if(bgmOut&&ac){ const g=bgmOut; bgmOut=null; try{ g.gain.cancelScheduledValues(ac.currentTime); g.gain.setValueAtTime(g.gain.value,ac.currentTime); g.gain.linearRampToValueAtTime(0.0001,ac.currentTime+0.08); }catch(e){} setTimeout(()=>{ try{ g.disconnect(); }catch(e){} },700); } }
  /* 効果音とジングル */
  const SFX = {
    treasure:[["p12",72,.06],["p12",79,.06],["p25",84,.08],["p25",91,.16]], equip:[["p50",60,.03],["p25",72,.04],["p12",79,.08]],
    ok:[["p50",84,.05]], cancel:[["p50",72,.05],["p50",67,.07]], hit:[["noise",.06],["p25",55,.05]],
    heal:[["p25",76,.05],["p25",81,.05],["p25",88,.09]], step:[["noise",.02]], buy:[["p25",79,.05],["p25",84,.09]],
    enc:[["p50",88,.04],["p50",76,.04],["p50",88,.04],["p50",76,.04],["p50",91,.12]],
    clap:[["noise",.03],[null,.03],["noise",.03],[null,.03],["noise",.05]], kira:[["p12",88,.05],["p12",91,.05],["p12",96,.05],["p12",100,.14]],
    win:[["p25",72,.1],["p25",76,.1],["p25",79,.1],["p25",84,.12],[null,.05],["p25",79,.08],["p25",84,.3]],
    lose:[["p25",67,.18],["p25",63,.18],["p25",60,.4]],
    slash:[["noise",.03],["p50",88,.02],["p50",76,.02],["noise",.07],["p50",48,.06]],
    skillhit:[["p12",84,.03],["p12",91,.03],["p12",96,.03],["noise",.08],["p50",52,.05],["p50",45,.08]],
    allhit:[["p25",72,.04],["p25",79,.04],["p25",84,.04],["noise",.06],["noise",.06],["noise",.1],["p50",40,.12]],
    meter:[["p25",60,.05],["p25",67,.05],["p25",72,.05],["p25",79,.05],["p25",84,.05],["p25",91,.08],["noise",.15],["p50",36,.25]],
    defeat:[["p50",79,.04],["p50",72,.04],["p50",67,.04],["noise",.12]], damage:[["noise",.09],["p50",45,.05],["p50",40,.08]], down:[["noise",.12],["p50",50,.08],["p50",43,.1],["p50",36,.22]], level:[["p25",79,.07],["p25",83,.07],["p25",86,.07],["p25",91,.25]],
    rank:[["p25",72,.12],["p25",79,.12],["p25",84,.12],["p25",88,.12],["p25",91,.4]],
    crit:[["p12",96,.04],["p12",100,.04],["p12",103,.05],["noise",.06],["p50",48,.06],["p50",40,.1]],
    tsukon:[["p50",45,.06],["noise",.1],["p50",38,.08],["noise",.12],["p50",31,.25]]
  };
  function sfx(name){
    if(!on||!ac||document.hidden||!SFX[name]||mix.sfx===0)return;
    const now=ac.currentTime,last=recentSfx.get(name);if(last!==undefined&&now-last<0.055)return;recentSfx.set(name,now);let t=now+0.01;
    for(const s of (SFX[name]||[])){
      if(s[0]==="noise"){ noise(t,s[1]+0.03,0.5,1200,{type:"bandpass",q:0.5,out:sfxBus,rev:0.15}); noise(t,0.02,0.3,5000,{out:sfxBus}); t+=s[1]; }
      else if(s[0]===null){ t+=s[1]; }
      else { voice(hz(s[1]),t,s[2],s[0],0.42,{out:sfxBus,sus:0.8,detune:4,cutoff:4500,fenv:1500,rev:0.18,a:0.002,d:0.03,r:0.05}); t+=s[2]; }
    }
  }
  function setOn(v){
    if(v){ if(!init()){ on=false; return false; } if(ac.state==="suspended") ac.resume().catch(()=>{}); on=true;ramp(master,0.85,0.04); const c=cur; cur=null; if(c) play(c); }
    else { on=false;clearTimeout(jingleT);jingleT=null;stopBgm();ramp(master,0,0.025);recentSfx.clear(); }
    return on;
  }
  function suspend(){ clearTimeout(jingleT);jingleT=null;stopBgm();if(ac){ramp(master,0,0.02);if(ac.state==="running")ac.suspend().catch(()=>{});} }
  function resume(){ if(on&&ac&&!document.hidden){ ac.resume().catch(()=>{});ramp(master,0.85,0.04); const c=cur; cur=null; if(c) play(c); } }
  return { play, jingle, sfx, setOn, setMix, suspend, resume, get mix(){return {...mix};},get tracks(){return Object.keys(SONGS);},get on(){return on;}, get current(){return cur;} };
})();

