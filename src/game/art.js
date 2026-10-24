/* ===== art: ドット素材をコードで生成（16色パレット基調・新規デザイン） ===== */
const ART = (()=>{
  const cache = {};
  function mk(w,h){ const c=document.createElement("canvas"); c.width=w; c.height=h; const g=c.getContext("2d"); g.imageSmoothingEnabled=false; return [c,g]; }
  const px=(g,x,y,w,h,col)=>{ g.fillStyle=col; g.fillRect(x,y,w,h); };
  function seeded(str){ let h=2166136261; for(const ch of String(str)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%10000)/10000; }; }
  function hex(c){ const n=parseInt(c.slice(1),16); return [n>>16&255,n>>8&255,n&255]; }
  function mix(a,b,t){ const A=hex(a),B=hex(b); return "#"+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,"0")).join(""); }
  const dark=(c,t=.3)=>mix(c,PAL.ink,t), light=(c,t=.3)=>mix(c,PAL.cream,t);
  /* 透明部分に接する画素を濃紺の輪郭にする */
  function outline(c, col=PAL.ink){
    const g=c.getContext("2d"), w=c.width, h=c.height, d=g.getImageData(0,0,w,h), a=d.data, src=new Uint8ClampedArray(a);
    const op=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&src[(y*w+x)*4+3]>200;
    const [r,gg,b]=hex(col);
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const i=(y*w+x)*4; if(src[i+3]>200) continue;
      if(op(x-1,y)||op(x+1,y)||op(x,y-1)||op(x,y+1)){ a[i]=r;a[i+1]=gg;a[i+2]=b;a[i+3]=255; } }
    g.putImageData(d,0,0);
  }

  /* ---- 地形 16×16（周囲のタイルを見て縁を描く） ---- */
  const WATER="~=", SOLID="#cT";
  function drawTile(g, X, Y, t, nb, frame, seed){
    const r=seeded(seed); const P=(x,y,w,h,c)=>px(g,X+x,Y+y,w,h,c);
    const grass=()=>{ P(0,0,16,16,PAL.leaf);
      for(let i=0;i<5;i++){ const x=Math.floor(r()*14), y=Math.floor(r()*13); P(x,y+1,1,2,PAL.forest); P(x+1,y,1,2,PAL.forest); }
      if(r()<.18){ const x=2+Math.floor(r()*11), y=2+Math.floor(r()*11); P(x,y,1,1,r()<.5?PAL.coral:PAL.cream); P(x-1,y+1,1,1,PAL.forest); }
      if(r()<.3){ P(Math.floor(r()*15),Math.floor(r()*15),1,1,"#7E9A63"); } };
    if('GMRBPSDWFUALHVCE N'.replace(/ /g,'').includes(t)&&t.length===1){
      const colors={G:'#7f9d5e',M:'#8a9184',N:'#b9cdc9',R:'#4d98ac',B:'#ae9870',P:'#7e8d94',S:'#e2cc96',D:'#d9b578',W:'#a49d7c',F:'#6caa84',U:'#aa956f',A:'#68767e',L:'#8b9da2',H:'#4c5f70',V:'#94a18c',C:'#8399a6',E:'#2d7186'};
      P(0,0,16,16,colors[t]);
      if(t==='G'){for(let i=0;i<7;i++){const x=Math.floor(r()*15),y=Math.floor(r()*15);P(x,y,1,2,i%2?'#a6b875':'#5a7d4c');}if(r()<.09)P(7,5,2,2,'#ebd69a');}
      if(t==='M'||t==='N'){P(0,12,16,4,'#586d62');for(let y=1;y<15;y++){const x=8-Math.floor(y*.55);P(x,y,Math.ceil(y*1.05),1,y<5?(t==='N'?'#f2f1e3':'#c2c8b2'):y%3?'#879185':'#677c72');}P(9,7,2,5,'#a2ab99');}
      if(t==='R'||t==='E'){for(let i=0;i<3;i++)P((i*6+frame*2)%13,3+i*5,4,1,'#7dc0ca');if(t==='E'){P(7,7,2,2,'#e6cf93');P(7,8,1,3,'#b49160');}}
      if(t==='B'||t==='P'){P(0,0,16,2,'#6c8990');P(0,14,16,2,'#6c8990');for(let x=0;x<16;x+=4){P(x,3,3,10,'#cdb78b');P(x,3,1,10,'#e0cda1');}P(0,2,16,1,'#4d5d5d');P(0,13,16,1,'#4d5d5d');if(t==='P'){P(11,5,2,6,'#58696c');P(10,6,4,1,'#d5d9c1');}}
      if(t==='S'||t==='D'){for(let y=2;y<16;y+=5){P((y%3),y,12,1,t==='D'?'#b88c54':'#bea876');P(3,y+1,11,1,t==='D'?'#ebce91':'#efdcad');}if(t==='S'&&['~','R'].includes(nb(0,-1)))P(0,0,16,2,'#cae0c8');}
      if(t==='W'||t==='U'){for(let i=0;i<8;i++){const x=Math.floor(r()*14),y=Math.floor(r()*14);P(x,y,2,1,i%2?'#c8bc91':'#817d62');}if(t==='W'){P(8,9,4,3,'#7a7f70');P(8,8,3,1,'#b4b29a');}}
      if(t==='F'){P(0,0,16,2,'#afa47b');P(0,0,2,16,'#afa47b');for(let y=4;y<16;y+=4)for(let x=4;x<16;x+=4){P(x,y,1,3,'#b7c67e');P(x-1,y+1,3,1,'#356b53');}P(2,2,14,1,'#8ac1b0');}
      if(t==='A'||t==='H'){const vertical=['A','H','B'].includes(nb(0,-1))||['A','H','B'].includes(nb(0,1));if(vertical){P(1,0,1,16,'#a5b4b6');P(14,0,1,16,'#a5b4b6');P(7,1,1,5,'#eadcad');P(7,10,1,5,'#eadcad');}else{P(0,1,16,1,'#a5b4b6');P(0,14,16,1,'#a5b4b6');P(1,7,5,1,'#eadcad');P(10,7,5,1,'#eadcad');}if(t==='H'){P(0,0,16,1,'#d0cdb6');P(0,15,16,1,'#182e40');}}
      if(t==='L'){const horizontal=nb(-1,0)==='L'||nb(1,0)==='L';if(horizontal){for(let x=1;x<16;x+=4)P(x,2,1,12,'#5a665f');P(0,4,16,1,'#f0e9d3');P(0,11,16,1,'#f0e9d3');P(0,5,16,1,'#d7e0d8');}else{for(let y=1;y<16;y+=4)P(2,y,12,1,'#5a665f');P(4,0,1,16,'#f0e9d3');P(11,0,1,16,'#f0e9d3');}}
      if(t==='V'||t==='C'){P(0,12,16,4,'#687c79');P(11,0,5,16,'#6e8086');P(2,4,7,7,t==='C'?'#c6d1ce':'#d3c4a3');P(1,3,9,2,t==='C'?'#a5bfc4':'#957b66');P(3,6,2,2,'#5b7e86');P(7,6,1,2,'#5b7e86');if(t==='C'){P(5,0,4,4,'#c6d1ce');P(6,1,1,2,'#709ca6');}P(12,5,1,4,'#c3d0c4');}
      return;
    }
    switch(t){
      case ".": grass(); break;
      case ",": { P(0,0,16,16,PAL.sand);
        for(let y=0;y<16;y+=4) for(let x=((y/4)%2)*3-3;x<16;x+=6){ P(x+1,y+1,4,2,"#DFC394"); P(x,y+3,6,1,"#BE9E6E"); }
        if(r()<.3) P(Math.floor(r()*14),Math.floor(r()*14),2,1,PAL.skin);
        const g2=(d)=>!",=w123".includes(nb(d[0],d[1]))&&!WATER.includes(nb(d[0],d[1]))&&!SOLID.includes(nb(d[0],d[1]));
        if(g2([0,-1])) for(let x=0;x<16;x+=2) P(x,0,1,1+((x>>1)%2),PAL.leaf);
        if(g2([0,1])) for(let x=1;x<16;x+=2) P(x,15-((x>>1)%2),1,1+((x>>1)%2),PAL.leaf);
        if(g2([-1,0])) for(let y=0;y<16;y+=2) P(0,y,1+((y>>1)%2),1,PAL.leaf);
        if(g2([1,0])) for(let y=1;y<16;y+=2) P(15-((y>>1)%2),y,1+((y>>1)%2),1,PAL.leaf);
        break; }
      case "~": { P(0,0,16,16,PAL.sea);
        const o=frame%4; for(let k=0;k<3;k++){ const yy=(k*5+3)%16, xx=(k*7+o*2+Math.floor(seed.length))%16; P(xx,yy,4,1,PAL.aqua); P((xx+4)%16,yy+1,2,1,"#5E9AA5"); }
        if(o===1||o===3) P((seed.length*3+o)%15,(seed.length*5)%15,1,1,PAL.cream);
        const land=d=>!WATER.includes(nb(d[0],d[1]));
        if(land([0,-1])){ P(0,0,16,2,PAL.aqua); for(let x=(o%2);x<16;x+=3) P(x,2,1,1,PAL.cream); }
        if(land([-1,0])){ P(0,0,2,16,PAL.aqua); for(let y=(o%2);y<16;y+=3) P(2,y,1,1,PAL.cream); }
        if(land([1,0])){ P(14,0,2,16,PAL.aqua); for(let y=(o%2);y<16;y+=3) P(13,y,1,1,PAL.cream); }
        if(land([0,1])) P(0,15,16,1,PAL.aqua);
        break; }
      case "T": { grass();
        const above=nb(0,-1)==="T", below=nb(0,1)==="T";
        P(2,13,12,3,"rgba(16,24,32,.35)");
        if(!below){ P(7,10,2,5,PAL.brown); P(8,10,1,5,dark(PAL.brown)); }
        const top = above?0:1, bot = below?16:12;
        P(1,top+1,14,bot-top-2,PAL.forest); P(2,top,12,bot-top,PAL.forest);
        for(let i=0;i<7;i++){ const x=2+Math.floor(r()*10), y=top+1+Math.floor(r()*(bot-top-4)); P(x,y,3,2,PAL.leaf); P(x,y,1,1,"#7E9A63"); }
        P(3,top+1,2,1,"#7E9A63"); if(!below) P(2,bot-1,12,1,dark(PAL.forest,.4));
        break; }
      case "#": { const isWall=true; P(0,0,16,16,PAL.sand);
        P(0,0,16,2,PAL.brown); P(0,0,1,16,PAL.brown); P(15,0,1,16,dark(PAL.brown));
        const kind=Math.floor(r()*3);
        if(kind===0){ P(3,4,10,7,PAL.cream); P(4,5,8,5,PAL.navy); P(8,5,1,5,PAL.cream); P(4,7,8,1,PAL.cream); P(5,5,2,1,PAL.sea); }
        else if(kind===1){ P(2,4,12,9,PAL.brown); for(let x=3;x<14;x+=2) P(x,5,1,7,dark(PAL.brown)); }
        else { P(3,4,4,6,PAL.navy); P(9,4,4,6,PAL.navy); P(3,4,4,1,PAL.cream); P(9,4,4,1,PAL.cream); P(4,5,1,1,PAL.gold); P(10,5,1,1,PAL.gold); }
        if(nb(0,1)!=="#"){ P(0,13,16,3,dark(PAL.brown,.2)); P(0,15,16,1,PAL.ink); }
        if(isWall&&r()<.2) P(1,11,2,2,PAL.leaf);
        break; }
      case "c": { P(0,0,16,16,PAL.red);
        for(let y=1;y<14;y+=4){ for(let x=((y>>2)%2)*2;x<16;x+=4){ P(x,y,3,1,PAL.coral); P(x,y+2,4,1,dark(PAL.red,.35)); } }
        P(0,14,16,2,PAL.ink); P(0,13,16,1,dark(PAL.red,.5));
        break; }
      case "w": { P(0,0,16,16,PAL.sand);
        for(let y=0;y<16;y+=4){ P(0,y+3,16,1,"#BE9E6E"); const o=((y>>2)%2)*8+(seed.length%4); P(o%16,y,1,3,"#BE9E6E"); }
        if(nb(0,-1)==="#"){ P(0,0,16,3,dark(PAL.sand,.25)); }
        break; }
      case "=": { P(0,0,16,16,PAL.sea); P((frame%4)*3,5,3,1,PAL.aqua);
        P(1,0,14,16,PAL.brown); for(let y=0;y<16;y+=3){ P(1,y,14,1,dark(PAL.brown,.35)); P(2,y+1,12,1,light(PAL.brown,.15)); }
        P(1,0,1,16,PAL.ink); P(14,0,1,16,PAL.ink); break; }
      case "1": { // 広場外れ・遊歩道：背の高い草（揺れる2コマ）＋金の縁札
        P(0,0,16,16,PAL.forest); const sw=(frame>>1)%2;
        for(let i=0;i<9;i++){ const x=Math.floor(r()*15), y=3+Math.floor(r()*11); P(x+(y<8?sw:0),y-3,1,4,PAL.leaf); P(x+1,y-1,1,3,"#7E9A63"); P(x,y,2,1,dark(PAL.forest,.3)); }
        if(nb(0,-1)!=="1"){ for(let x=1;x<16;x+=4) P(x,0,2,1,PAL.gold); }
        if(nb(-1,0)!=="1"){ for(let y=1;y<16;y+=4) P(0,y,1,2,PAL.gold); }
        break; }
      case "2": { // 通り・倉庫街：石畳と雨だれ
        P(0,0,16,16,PAL.slate);
        for(let y=0;y<16;y+=4) for(let x=((y>>2)%2)*4-4;x<16;x+=8){ P(x+1,y+1,6,2,PAL.mist); P(x+1,y+1,6,1,light(PAL.mist,.25)); }
        if(r()<.35){ const x=2+Math.floor(r()*9),y=3+Math.floor(r()*9); P(x,y,4,2,PAL.sea); P(x+1,y,1,1,PAL.aqua); }
        { const d=(frame+seed.length)%4; P(5+d*2,(d*4+2)%16,1,2,PAL.aqua); }
        if(nb(0,-1)!=="2"){ for(let x=0;x<16;x+=4) P(x+1,0,2,1,PAL.coral); }
        break; }
      case "3": { // 丘・段丘：夕景の草地と等高線
        P(0,0,16,16,PAL.violet);
        for(let y=2;y<16;y+=5) for(let x=0;x<16;x++) P(x,y+((x>>2)%2),1,1,"#8B7DB0");
        for(let i=0;i<3;i++){ const x=Math.floor(r()*14),y=Math.floor(r()*14); P(x,y,2,1,dark(PAL.violet,.3)); }
        if(r()<.25){ const x=2+Math.floor(r()*11),y=2+Math.floor(r()*11); P(x,y,3,2,PAL.mist); P(x,y,2,1,light(PAL.mist,.3)); }
        if((frame+seed.length)%4===0) P(seed.length%14,(seed.length*3)%14,1,1,PAL.gold);
        break; }
      default: P(0,0,16,16,PAL.ink);
    }
  }
  function drawFootRoad(g,x,y,mask,type){if(!['A','U'].includes(type))return;const p=(a,b,w,h,c)=>px(g,x+a,y+b,w,h,c),edge=type==='A'?'#bac4ae':'#d2bb83',fill=type==='A'?'#687780':'#b39b6b';p(0,0,16,16,'#79945c');p(3,3,10,10,edge);p(4,4,8,8,fill);for(const[bit,a,b,w,h]of [[1,3,0,10,8],[2,8,3,8,10],[4,3,8,10,8],[8,0,3,8,10]])if(mask&bit){p(a,b,w,h,edge);p(a+(bit===1||bit===4?1:0),b+(bit===2||bit===8?1:0),w-(bit===1||bit===4?2:0),h-(bit===2||bit===8?2:0),fill);}if(type==='A'){if(mask&5)p(7,1,1,3,'#f0d68c');if(mask&10)p(1,7,3,1,'#f0d68c');}else{p(6,5,2,1,'#deca98');p(8,10,2,1,'#8b815e');}}
  function drawTransport(g,x,y,t,crossing){const p=(a,b,w,h,c)=>px(g,x+a,y+b,w,h,c);for(const type of ['highway','rail']){const mask=t[type];if(!mask)continue;if(t[type+'Water']){for(const[bit,a,b,w,h]of [[1,7,0,2,7],[2,9,7,7,2],[4,7,9,2,7],[8,0,7,7,2]])if(mask&bit){p(a,b,w,h,type==='rail'?'#5c99a5':'#b8bdb0');}p(6,6,4,4,type==='rail'?'#487f90':'#586d76');continue;}const outer=type==='rail'?4:10,inner=type==='rail'?2:7,a=8-outer/2,b=8-inner/2;p(a,a,outer,outer,type==='rail'?'#574f46':'#253d4c');for(const[bit,dx,dy,w,h]of [[1,a,0,outer,8],[2,8,a,8,outer],[4,a,8,outer,8],[8,0,a,8,outer]])if(mask&bit)p(dx,dy,w,h,type==='rail'?'#574f46':'#253d4c');p(b,b,inner,inner,type==='rail'?'#cfd6c8':'#627785');for(const[bit,dx,dy,w,h]of [[1,b,0,inner,8],[2,8,b,8,inner],[4,b,8,inner,8],[8,0,b,8,inner]])if(mask&bit)p(dx,dy,w,h,type==='rail'?'#cfd6c8':'#627785');if(type==='rail'){if(mask&5)for(let y=1;y<16;y+=4)p(5,y,6,1,'#6b6251');if(mask&10)for(let x=1;x<16;x+=4)p(x,5,1,6,'#6b6251');}else{if(mask&5)p(7,2,1,3,'#e8dba9');if(mask&10)p(2,7,3,1,'#e8dba9');}}if(crossing){p(1,12,3,2,'#f3cf64');p(11,12,3,2,'#f3cf64');p(2,11,1,4,'#374653');p(12,11,1,4,'#374653');}}
  function roadSign(direction){const key='direction-board:'+direction;if(cache[key])return cache[key];const[c,g]=mk(16,24),p=(x,y,w,h,col)=>px(g,x,y,w,h,col);p(7,12,2,12,'#8d7552');p(1,4,14,10,'#e2d1a4');p(1,4,14,1,'#f3e5c1');p(3,8,9,2,'#465d62');if(direction===2){p(10,6,2,6,'#465d62');p(12,7,2,4,'#465d62');}else if(direction===8){p(2,6,2,6,'#465d62');p(1,7,2,4,'#465d62');}else{p(7,6,2,6,'#465d62');p(direction===1?5:6,direction===1?5:11,5,2,'#465d62');}return cache[key]=c;}

  const worldChunks=new Map();
  function worldChunk(cx,cy){const m=MAPS.WORLD,key=m.layoutKey+':'+cx+':'+cy;if(worldChunks.has(key)){const c=worldChunks.get(key);worldChunks.delete(key);worldChunks.set(key,c);return c;}const[c,g]=mk(256,256),at=(x,y)=>m.tiles[y]?.[x]||'~';for(let yy=0;yy<16;yy++)for(let xx=0;xx<16;xx++){const x=cx*16+xx,y=cy*16+yy;const k=x+','+y,t=at(x,y),base=['L','H'].includes(t)?m.transportBase[k]||'G':t;drawTile(g,xx*16,yy*16,base,(dx,dy)=>at(x+dx,y+dy),0,'WORLD'+x+','+y);if(Object.hasOwn(m.walkRoadIndex,k))drawFootRoad(g,xx*16,yy*16,m.walkRoadIndex[k],t);if(m.transportIndex[k])drawTransport(g,xx*16,yy*16,m.transportIndex[k],Object.hasOwn(m.walkRoadIndex,k));}worldChunks.set(key,c);while(worldChunks.size>40)worldChunks.delete(worldChunks.keys().next().value);return c;}
  function drawWorld(g,cam,vw,vh){for(let y=Math.max(0,Math.floor(cam.y/256));y<=Math.floor((cam.y+vh-1)/256);y++)for(let x=Math.max(0,Math.floor(cam.x/256));x<=Math.floor((cam.x+vw-1)/256);x++)if(x*16<MAPS.WORLD.w&&y*16<MAPS.WORLD.h)g.drawImage(worldChunk(x,y),x*256-cam.x,y*256-cam.y);}
  function worldCacheStats(){return {chunks:worldChunks.size,limit:40,chunkPixels:256*256,bytes:worldChunks.size*256*256*4};}
  function scenicObject(style){const key='scenic:'+style;if(cache[key])return cache[key];const[c,g]=mk(32,40),p=(x,y,w,h,color)=>px(g,x,y,w,h,color);p(3,34,26,4,'#152c35aa');if(style==='palace'){p(5,21,23,15,'#b54d3d');p(8,25,3,5,'#e3b66e');p(21,25,3,5,'#e3b66e');p(14,27,6,9,'#75453a');p(1,18,30,4,'#da7952');p(5,14,22,4,'#c86243');p(10,10,12,4,'#e4a05d');p(7,8,18,3,'#ba513d');p(14,3,5,5,'#d7a96a');}else if(style==='mountain'||style==='volcano'){for(let i=0;i<24;i++){const n=Math.floor(i*.55);p(15-n,7+i,n*2+2,1,i<7?'#e6e8df':i%3===0?'#84918b':'#586e6e');}if(style==='volcano'){p(11,8,11,3,'#554b4d');p(13,9,6,2,'#db8d63');p(15,2,2,5,'#d2d4c8');}}else if(style==='shrine'){p(4,8,24,4,'#d57b57');p(1,6,30,3,'#b94b42');p(7,12,3,24,'#b94b42');p(23,12,3,24,'#b94b42');p(8,18,17,3,'#df9b6c');p(12,30,8,6,'#65a3ae');}else if(style==='lake'){for(let i=0;i<10;i++)p(9-i/2,12+i*2,11+i,2,i%2?'#78b7be':'#4a91a5');p(12,9,7,2,'#b5dfd0');}else if(style==='dune'){for(let y=16;y<36;y++)p(1, y,30,1,y%5===0?'#c59455':'#dfbf7d');p(12,14,2,7,'#b28350');p(14,13,2,6,'#f1da9c');}else{p(7,19,19,17,'#e2ddc6');p(9,23,4,6,'#638589');p(20,23,3,6,'#638589');p(14,28,5,8,'#455864');const roof=style==='village'?'#9b7753':style==='clock'?'#b37b65':'#506877';p(3,16,27,4,roof);p(7,11,19,5,roof);p(10,8,13,3,roof);if(style==='castle'){p(11,8,11,12,'#f5edcf');p(7,6,19,4,'#506877');p(11,3,11,3,'#506877');}if(style==='clock'){p(13,7,8,10,'#ead9ad');p(15,10,4,4,'#596d70');p(16,10,1,3,'#f5edcf');}}return cache[key]=c;}
  function ship(){const key='national-ship';if(cache[key])return cache[key];const[c,g]=mk(16,24);px(g,1,16,14,5,'#e0d4b2');px(g,3,20,10,2,'#8a5a4e');px(g,4,9,8,7,'#f1e7cd');px(g,7,5,3,4,'#bc705a');px(g,5,11,2,2,'#538296');px(g,10,11,2,2,'#538296');return cache[key]=c;}

  /* マップ全体を1枚へ事前描画（水と草の4コマ） */
  function mapLayer(mapId, frame){
    if(mapId==='WORLD')return worldChunk(0,0);
    const key=`m${mapId}:${MAPS[mapId].layoutKey||"base"}:${frame%4}`; if(cache[key]) return cache[key];
    const m=MAPS[mapId]; const [c,g]=mk(m.w*16,m.h*16);
    const at=(x,y)=> (x<0||y<0||x>=m.w||y>=m.h) ? (m.kind==="in"?"#":"T") : m.tiles[y][x];
    for(let y=0;y<m.h;y++) for(let x=0;x<m.w;x++) drawTile(g,x*16,y*16,at(x,y),(dx,dy)=>at(x+dx,y+dy),frame%4,`${mapId}${x},${y}`);
    cache[key]=c; return c;
  }
  function tile(t, frame){ const key=`t${t}${frame}`; if(cache[key]) return cache[key]; const [c,g]=mk(16,16); drawTile(g,0,0,t,()=>t,frame,"x"+t); cache[key]=c; return c; }

  /* ---- 人物 16×24（dir 0下 1上 2左 3右／frame 0～3の歩行） ---- */
  function person(id, hair, coat, dir, frame, opt={}){
    frame = frame%4;
    const key=`p${id}${hair}${coat}${dir}${frame}${opt.long?1:0}${opt.ribbon||""}`; if(cache[key]) return cache[key];
    const [c,g]=mk(16,24);
    if(dir===3){ const src=person(id,hair,coat,2,frame,opt); g.translate(16,0); g.scale(-1,1); g.drawImage(src,0,0); cache[key]=c; return c; }
    const step = frame===1?1: frame===3?-1:0; // 1:左足前 -1:右足前
    const bob = step?1:0;
    const skin=PAL.skin, skinS=dark(PAL.skin,.18), coatS=dark(coat,.28), coatL=light(coat,.2), hairL=light(hair,.25), pants=PAL.navy, shoe=PAL.brown;
    const Y=bob; // 歩行中は1ドット上下
    // 脚
    if(dir===2){
      px(g,6+step,18-0,2,4,pants); px(g,8-step,18,2,4,dark(pants,.3)); px(g,6+step,22,3,1,shoe); px(g,8-step,22,2,1,dark(shoe));
    } else {
      px(g,5,18,2,4-(step===1?1:0),pants); px(g,9,18,2,4-(step===-1?1:0),pants);
      px(g,5,22-(step===1?1:0),2,1,shoe); px(g,9,22-(step===-1?1:0),2,1,shoe);
    }
    // 胴と腕
    px(g,4,11-Y+1,8,7,coat); px(g,4,11-Y+1,8,1,coatL); px(g,10,12-Y+1,2,6,coatS);
    if(dir===2){ px(g,6+step*-1,13-Y+1,2,4,coatS); px(g,6+step*-1,17-Y+1,2,1,skin); }
    else {
      px(g,3,12-Y+1+(step===1?1:0),1,5,coat); px(g,12,12-Y+1+(step===-1?1:0),1,5,coatS);
      px(g,3,17-Y+1+(step===1?1:0),1,1,skin); px(g,12,17-Y+1+(step===-1?1:0),1,1,skinS);
      if(dir===0){ px(g,7,12-Y+1,2,2,light(coat,.45)); }
    }
    // ベルトと金具、靴のつや（v5.36 描き込み追加）
    px(g,4,16-Y+1,8,1,dark(coat,.45)); if(dir===0) px(g,7,16-Y+1,2,1,PAL.gold);
    if(dir!==2){ px(g,5,22-(step===1?1:0),1,1,light(shoe,.35)); px(g,9,22-(step===-1?1:0),1,1,light(shoe,.35)); }
    // 頭
    const hy=3-Y+1;
    px(g,5,hy+1,6,7,skin); px(g,10,hy+2,1,5,skinS);
    px(g,4,hy-1,8,3,hair); px(g,5,hy-2,6,1,hair); px(g,5,hy-1,3,1,hairL);
    if(dir===0){
      px(g,4,hy+1,1,3,hair); px(g,11,hy+1,1,3,hair); px(g,5,hy+1,6,1,hair); px(g,6,hy+2,1,1,hair); px(g,8,hy-1,2,1,light(hair,.5));
      px(g,6,hy+4,1,2,PAL.ink); px(g,9,hy+4,1,2,PAL.ink); px(g,6,hy+4,1,1,PAL.navy);
      px(g,5,hy+6,1,1,PAL.coral); px(g,10,hy+6,1,1,PAL.coral); px(g,7,hy+7,2,1,dark(PAL.coral,.2));
      if(opt.long){ px(g,4,hy+4,1,6,hair); px(g,11,hy+4,1,6,hair); px(g,3,hy+5,1,4,dark(hair,.2)); px(g,12,hy+5,1,4,dark(hair,.2)); }
    } else if(dir===1){
      px(g,4,hy+1,8,6,hair); px(g,5,hy+1,3,1,hairL); px(g,10,hy+2,1,4,dark(hair,.25));
      if(opt.long){ px(g,4,hy+7,8,4,hair); px(g,10,hy+7,2,4,dark(hair,.25)); } else px(g,5,hy+7,6,1,dark(hair,.2));
    } else {
      px(g,7,hy+1,5,6,hair); px(g,4,hy+1,2,1,hair); px(g,8,hy+1,2,1,hairL);
      px(g,5,hy+4,1,2,PAL.ink); px(g,4,hy+5,1,1,skin); px(g,5,hy+6,1,1,PAL.coral);
      if(opt.long){ px(g,8,hy+7,4,4,hair); px(g,11,hy+6,1,5,dark(hair,.25)); }
    }
    if(opt.ribbon){ const rx = dir===2?9:dir===1?4:9; px(g,rx,hy-2,3,2,opt.ribbon); px(g,rx+1,hy-2,1,2,dark(opt.ribbon,.3)); }
    outline(c);
    // 影（輪郭の外）
    g.globalCompositeOperation="destination-over"; px(g,4,22,8,2,"rgba(16,24,32,.35)"); g.globalCompositeOperation="source-over";
    cache[key]=c; return c;
  }

  /* ---- 物体 16×24 ---- */
  function object(type, frame){
    frame=frame%4;
    const key=`o${type}${frame}`; if(cache[key]) return cache[key];
    const [c,g]=mk(16,24); let ol=true;
    switch(type){
      case "box": px(g,2,13,12,9,PAL.brown); px(g,2,13,12,1,light(PAL.brown,.3)); px(g,2,11,12,3,PAL.gold); px(g,2,11,12,1,light(PAL.gold,.4)); px(g,7,13,2,4,PAL.cream); px(g,11,14,2,7,dark(PAL.brown));
        if(frame%2) px(g,12,9,1,1,PAL.cream); break;
      case "boxOpen": px(g,2,14,12,8,PAL.brown); px(g,3,15,10,2,dark(PAL.brown,.5)); px(g,1,8,14,3,PAL.gold); px(g,1,8,14,1,light(PAL.gold,.4)); break;
      case "station": ol=false;px(g,0,8,16,16,PAL.slate);px(g,0,5,16,4,PAL.sea);px(g,2,10,12,5,PAL.cream);px(g,4,11,2,2,PAL.navy);px(g,10,11,2,2,PAL.navy);px(g,6,17,4,7,PAL.ink);px(g,0,23,16,1,PAL.gold);break;
      case "sign": px(g,7,14,2,9,PAL.brown); px(g,1,7,14,8,PAL.cream); px(g,1,7,14,1,light(PAL.cream,.5)); px(g,3,9,10,1,PAL.slate); px(g,3,11,7,1,PAL.slate); px(g,11,11,2,2,PAL.red); break;
      case "bench": px(g,1,14,14,3,PAL.brown); px(g,1,14,14,1,light(PAL.brown,.3)); px(g,2,17,2,5,dark(PAL.brown)); px(g,12,17,2,5,dark(PAL.brown)); px(g,1,10,14,2,PAL.sand); break;
      case "tower": ol=false; px(g,7,0,2,24,PAL.mist); px(g,8,0,1,24,dark(PAL.mist,.3)); for(let y=3;y<24;y+=5){ px(g,4,y,8,1,PAL.mist); px(g,5,y+1,1,3,PAL.slate); px(g,10,y+1,1,3,PAL.slate); }
        px(g,6,0,4,2,frame%2?PAL.coral:PAL.red); if(frame%2){ px(g,4,0,1,1,PAL.gold); px(g,11,1,1,1,PAL.gold); } break;
      case "boss": ol=false; for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2+frame*0.5; px(g,7+Math.round(Math.cos(a)*6),16+Math.round(Math.sin(a)*4),2,2,i%2?PAL.gold:PAL.coral); } px(g,7,15,2,2,PAL.cream); break;
      case "gate": px(g,2,7,2,16,PAL.red); px(g,12,7,2,16,PAL.red); px(g,0,5,16,2,PAL.ink); px(g,1,4,14,2,PAL.red); px(g,1,4,14,1,PAL.coral); px(g,4,9,8,4,PAL.cream); px(g,5,10,6,1,PAL.slate); px(g,5,12,4,1,PAL.slate); break;
      case "rest": px(g,1,13,14,9,PAL.violet); px(g,1,13,14,1,light(PAL.violet,.3)); px(g,1,11,6,4,PAL.cream); px(g,8,16,7,1,dark(PAL.violet,.3)); px(g,1,21,14,1,dark(PAL.violet,.5)); break;
      case "shelf": px(g,1,3,14,19,PAL.brown); for(let y=8;y<22;y+=5) px(g,2,y,12,1,dark(PAL.brown,.5)); px(g,3,4,3,4,PAL.coral); px(g,8,5,2,3,PAL.gold); px(g,9,9,3,4,PAL.aqua); px(g,3,15,4,3,PAL.cream); px(g,10,15,2,3,PAL.violet); break;
      case "board": px(g,1,5,14,13,PAL.forest); px(g,1,5,14,1,PAL.brown); px(g,0,4,16,1,PAL.brown); px(g,3,7,4,4,PAL.cream); px(g,9,8,4,3,PAL.gold); px(g,4,13,7,1,PAL.cream); px(g,7,18,2,5,PAL.brown); break;
      case "door": px(g,3,4,10,20,PAL.brown); px(g,4,5,8,18,dark(PAL.brown,.35)); px(g,5,6,6,6,PAL.navy); px(g,5,6,6,1,PAL.sea); px(g,10,15,1,2,PAL.gold); break;
      case "shop": ol=false; px(g,0,9,16,5,PAL.sand); px(g,0,9,16,1,light(PAL.sand,.4)); px(g,0,14,16,1,PAL.ink); for(let x=0;x<16;x+=4){ px(g,x,3,2,5,PAL.red); px(g,x+2,3,2,5,PAL.cream); } px(g,0,8,16,1,PAL.ink);
        px(g,2,10,2,2,PAL.coral); px(g,6,10,3,2,PAL.aqua); px(g,11,10,2,2,PAL.gold); break;
      case "inn": ol=false; px(g,0,9,16,5,PAL.brown); px(g,0,9,16,1,light(PAL.brown,.4)); px(g,0,14,16,1,PAL.ink);
        for(let x=0;x<16;x+=4){ px(g,x,2,3,7,PAL.navy); px(g,x+1,3,1,5,PAL.sea); } px(g,0,1,16,1,PAL.ink);
        px(g,6,3,4,4,PAL.cream); px(g,7,4,2,1,PAL.red); px(g,7,5,1,1,PAL.red);
        px(g,13,10,2,3,frame%2?PAL.gold:PAL.coral); break;
      default: px(g,4,10,8,8,PAL.gold);
    }
    if(ol) outline(c);
    cache[key]=c; return c;
  }

  /* ---- ノイズ体 32×32（ボス64×64）：輪郭×属性の模様×エリア小物、3段の陰影 ---- */
  const SHAPES = {
    "反響体":"ring","風環体":"ring","回転体":"ring","光膜体":"panel","投影体":"panel","文字体":"glyph",
    "水紋体":"drop","微粒体":"cloud","鉱殻体":"crystal","火花体":"spark","容器体":"jar","機材体":"box","紙積体":"box",
    "灯籠体":"lantern","配線体":"coil","布帯体":"ribbon","紙片体":"sheet","歯車体":"gear","音符体":"note"
  };
  const ATTR_COL = { "音":[PAL.violet,PAL.cream], "光":[PAL.gold,PAL.cream], "電":[PAL.aqua,PAL.gold], "熱":[PAL.red,PAL.gold],
    "水":[PAL.sea,PAL.aqua], "風":[PAL.leaf,PAL.cream], "土":[PAL.brown,PAL.sand], "無":[PAL.slate,PAL.mist] };
  function inside(shape,x,y,S){
    const u=(x+0.5)/S*2-1, v=(y+0.5)/S*2-1;
    switch(shape){
      case "ring": { const d=Math.hypot(u,v*1.1); return d<0.86 && d>0.34; }
      case "panel": return Math.abs(u)<0.74 && Math.abs(v)<0.62 && !(v>0.45&&Math.abs(u)>0.5);
      case "glyph": return (Math.abs(u)<0.78&&Math.abs(v+0.45)<0.17)||(Math.abs(u)<0.17&&Math.abs(v)<0.78)||(Math.abs(u-0.38)<0.16&&v>0&&v<0.78)||(Math.abs(v-0.2)<0.15&&Math.abs(u)<0.58);
      case "drop": return Math.hypot(u,(v-0.18)*1.05)<0.64 || (Math.abs(u)<0.64*(1-(v+0.85)/0.6) && v<-0.2 && v>-0.88);
      case "cloud": return Math.hypot(u+0.36,v)<0.44||Math.hypot(u-0.36,v)<0.44||Math.hypot(u,v+0.26)<0.47||Math.hypot(u,v-0.2)<0.4;
      case "crystal": return Math.abs(u)*1.1+Math.abs(v)*0.75<0.8;
      case "spark": { const a=Math.atan2(v,u), d=Math.hypot(u,v); return d < 0.44+0.34*Math.abs(Math.cos(a*3)); }
      case "jar": return (Math.abs(u)<0.62&&v>-0.35&&v<0.78) || (Math.abs(u)<0.32&&v<=-0.35&&v>-0.72);
      case "box": return Math.abs(u)<0.72&&Math.abs(v)<0.64;
      case "lantern": return (Math.hypot(u*0.8,v*0.62)<0.56) || (Math.abs(u)<0.13&&v<-0.6&&v>-0.88);
      case "coil": { const d=Math.hypot(u,v); const a=Math.atan2(v,u); return d<0.84 && (d<0.28 || Math.abs(((d*5 - a/Math.PI) % 2 + 2)%2 - 1) < 0.62); }
      case "ribbon": return Math.abs(v - 0.35*Math.sin(u*3.2)) < 0.28 && Math.abs(u)<0.88;
      case "sheet": return Math.abs(u+v*0.25)<0.62 && Math.abs(v)<0.74 && !(u>0.3&&v<-0.4);
      case "gear": { const a=Math.atan2(v,u), d=Math.hypot(u,v); return d<(Math.cos(a*8)>0?0.82:0.68) && d>0.2; }
      case "note": return Math.hypot(u+0.25,(v-0.45)*1.3)<0.36 || (Math.abs(u-0.04)<0.12&&v>-0.78&&v<0.45) || (Math.abs(v+0.7)<0.12&&u>0&&u<0.58);
      default: return Math.hypot(u,v)<0.7;
    }
  }
  const DECOR = {
    "KY01-A1":g=>{ px(g,2,2,1,7,PAL.ink); px(g,3,2,4,3,PAL.red); px(g,3,2,4,1,PAL.coral); },
    "KY01-A2":g=>{ px(g,1,2,9,2,PAL.red); px(g,1,4,9,1,PAL.ink); px(g,2,5,1,2,PAL.aqua); px(g,6,6,1,2,PAL.aqua); },
    "KY01-A3":g=>{ px(g,3,1,1,7,PAL.mist); px(g,1,3,5,1,PAL.mist); px(g,2,1,3,1,PAL.coral); },
    "KY02-A1":g=>{ px(g,2,2,5,1,PAL.sand); px(g,3,3,3,2,PAL.sand); px(g,26,2,3,3,PAL.gold); px(g,27,3,1,1,PAL.cream); },
    "KY02-A2":g=>{ px(g,1,1,7,6,PAL.brown); px(g,1,1,7,1,PAL.sand); px(g,4,1,1,6,dark(PAL.brown,.4)); px(g,2,3,2,2,PAL.cream); },
    "KY02-A3":g=>{ for(let i=0;i<5;i++) px(g,1+i,6-i,1,1,PAL.gold); px(g,1,6,6,1,PAL.gold); px(g,1,7,2,2,PAL.cream); }
  };
  function enemy(profileId, species, attr, area, frame, size=32, boss=false){
    frame=frame%2;
    const key=`e${profileId}${area}${frame}${size}`; if(cache[key]) return cache[key];
    const [c,g]=mk(size,size); const S=size;
    const BD=boss&&BOSSES[profileId]; const shape=boss?(BD&&BD.shape?BD.shape:(profileId==="LB01"?"cloud":"lantern")):(SHAPES[species]||"drop");
    const [base,accent]=boss?(BD&&BD.col?BD.col:(profileId==="LB01"?[PAL.violet,PAL.cream]:[PAL.red,PAL.gold])):(ATTR_COL[attr]||ATTR_COL["無"]);
    const hi=light(base,.35), sh=dark(base,.35), off=frame;
    const ins=(x,y)=> x>=0&&y>=0&&x<S&&y<S && inside(shape,x,y-off,S);
    // 陰影（左上から光）
    for(let y=0;y<S;y++) for(let x=0;x<S;x++){
      if(!ins(x,y)) continue;
      let col=base;
      const lightSide = !ins(x-2,y-2), darkSide = !ins(x+2,y+2);
      if(lightSide&&!darkSide) col=hi; else if(darkSide&&!lightSide) col=sh;
      const u=x/S, v=(y-off)/S;
      switch(attr){
        case "音": if(Math.round(Math.hypot(u-.5,v-.5)*S)%5===0) col=accent; break;
        case "光": if((x+y+frame)%7===0) col=accent; break;
        case "電": if(((x>>1)+(y>>1)+frame)%4===0 && y%4<2) col=accent; break;
        case "熱": if(y < S*0.45 && (x*7+y*3+frame*5)%11===0) col=accent; break;
        case "水": if((y+Math.round(2*Math.sin(x/3+frame)))%6===0) col=accent; break;
        case "風": if((x-y+64+frame*2)%9===0) col=accent; break;
        case "土": if(x%6===0||y%6===0) col=dark(base,.45); break;
        default: if(x%5===2&&y%5===2) col=accent;
      }
      if(boss && (x+y+frame)%9===0) col=accent;
      px(g,x,y,1,1,col);
    }
    // 光沢
    for(let y=0;y<S;y++){ let done=false; for(let x=0;x<S;x++){ if(ins(x,y)&&ins(x+1,y)&&ins(x,y+1)&&!ins(x-1,y-1)&&y>S*0.15){ px(g,x+1,y+1,Math.max(1,S/16),Math.max(1,S/32),PAL.cream); done=true; break; } } if(done) break; }
    // 目
    const ey=Math.floor(S*0.42)+off, ex=Math.floor(S*0.34), es=Math.max(2,S/16);
    const eye=(x)=>{ if(ins(x,ey)&&ins(x+es,ey)&&ins(x,ey+es)){ px(g,x,ey,es,es+1,PAL.cream); px(g,x+(frame?es/2:0),ey+es/2,es/2,es/2+1,PAL.ink); } };
    eye(ex); eye(S-ex-es);
    if(!boss&&String(profileId).startsWith('RG:')){const v=Number(String(profileId).split(':')[2]),u=S/32,y=3+off;g.save();g.scale(u,u);const kind=String(profileId).split(':')[3];if(kind==='bento'){px(g,5,y+2,22,11,PAL.red);px(g,7,y+3,9,8,PAL.cream);px(g,17,y+4,8,6,PAL.gold);for(let k=0;k<3;k++)px(g,18+k*2,y+3,1,6,PAL.cream);}else if(kind==='dago'){px(g,4,y+3,24,10,PAL.slate);px(g,6,y+4,20,7,PAL.sand);for(let k=0;k<4;k++){px(g,7+k*5,y+5,3,2,PAL.brown);px(g,8+k*5,y+8,2,1,PAL.leaf);}}else if(kind==='manju'){for(let k=0;k<3;k++){px(g,5+k*8,y+4-(k%2)*3,7,6,PAL.sand);px(g,6+k*8,y+3-(k%2)*3,5,2,PAL.cream);}}else if(kind==='squid'){for(let k=0;k<5;k++)px(g,8+k*3,y+7+(k%2),2,7,PAL.cream);px(g,10,y+2,12,7,PAL.cream);px(g,13,y,6,3,PAL.coral);px(g,12,y+5,2,2,PAL.ink);px(g,18,y+5,2,2,PAL.ink);}else if(kind==='grill'){px(g,5,y+4,22,9,PAL.slate);for(let k=0;k<4;k++){px(g,7+k*5,y+5,4,5,PAL.sand);px(g,8+k*5,y+6,2,2,PAL.brown);}}else if(kind==='stew'){px(g,5,y+5,22,8,PAL.brown);px(g,7,y+4,18,3,PAL.cream);for(let k=0;k<4;k++)px(g,8+k*4,y+4,2,2,k%2?PAL.leaf:PAL.coral);px(g,9,y,2,3,PAL.mist);px(g,19,y,2,3,PAL.mist);}else if(kind==='ramen'||kind==='bowl'){px(g,6,y+6,20,3,PAL.coral);px(g,9,y+9,14,3,PAL.cream);for(let k=0;k<4;k++)px(g,9+k*4,y+4,2,3,PAL.gold);px(g,23,y,1,8,PAL.sand);px(g,25,y,1,8,PAL.sand);px(g,10,y,2,3,PAL.mist);}else if(kind==='candy'){px(g,10,y+2,12,8,PAL.coral);px(g,5,y,5,4,PAL.gold);px(g,22,y+8,5,4,PAL.gold);px(g,14,y+3,3,6,PAL.cream);}else if(v===0){px(g,6,y+5,20,3,PAL.cream);px(g,8,y+8,16,3,PAL.coral);for(let k=0;k<3;k++)px(g,10+k*5,y,2,4,PAL.mist);}else if(v===1){px(g,7,y+2,18,8,PAL.sand);px(g,10,y,12,2,PAL.cream);px(g,12,y+4,8,2,PAL.gold);}else if(v===2){px(g,6,y+2,20,7,PAL.leaf);px(g,9,y,14,2,PAL.aqua);px(g,15,y,2,11,PAL.cream);}else if(v===3){px(g,15,y,2,15,PAL.sand);for(let k=0;k<3;k++)px(g,11,y+k*4,10,3,k%2?PAL.coral:PAL.gold);}else{px(g,7,y+5,18,5,PAL.cream);px(g,10,y+2,12,3,PAL.coral);px(g,14,y,4,2,PAL.gold);}g.restore();}
    outline(c);
    if(!boss){ (DECOR[area]||(()=>{}))(g); }
    else { for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+frame*.4; px(g,S/2+Math.round(Math.cos(a)*S*0.46)-1,S/2+Math.round(Math.sin(a)*S*0.46)-1,3,3,i%2?PAL.gold:PAL.coral); } }
    cache[key]=c; return c;
  }
  /* 白く光る被弾コマ */
  function flashOf(img){ const k=img; if(img._flash) return img._flash; const [c,g]=mk(img.width,img.height); g.drawImage(img,0,0); g.globalCompositeOperation="source-in"; px(g,0,0,c.width,c.height,PAL.cream); img._flash=c; return c; }

  /* ---- 戦闘の背景 160×64（エリアごと、帯の面塗りとディザ） ---- */
  function band(g,y,h,c1,c2){ px(g,0,y,160,h,c1); for(let x=0;x<160;x+=2) for(let k=0;k<2;k++) px(g,x+(k%2),y+h-2+k,1,1,c2); }
  function stageKind(g, kind, sil, r, frame){
    switch(kind){
      case "forest": for(let i=0;i<12;i++){ const x=i*14+Math.floor(r()*6), h=14+Math.floor(r()*14); px(g,x+5,34-h,3,h,dark(PAL.brown,.3)); px(g,x,34-h-6,13,10,dark(PAL.forest,.2)); px(g,x+2,34-h-10,9,6,PAL.leaf); } break;
      case "market": for(let i=0;i<6;i++){ px(g,i*28,16,24,18,dark(PAL.brown,.35)); px(g,i*28-2,13,28,4,i%2?PAL.coral:PAL.gold); px(g,i*28+3,22,18,3,PAL.cream); } break;
      case "castle": px(g,0,26,160,8,dark(PAL.slate,.3)); px(g,96,18,40,16,dark(PAL.slate,.1)); px(g,102,10,28,8,PAL.cream); px(g,98,8,36,3,PAL.ink); px(g,108,3,16,7,PAL.cream); px(g,105,1,22,3,PAL.ink); px(g,112,12,3,4,PAL.ink); px(g,120,12,3,4,PAL.ink); break;
      case "river": px(g,0,26,160,8,PAL.sea); for(let i=0;i<10;i++) px(g,(i*19+frame*3)%160,28+(i%3),7,1,PAL.aqua); for(let i=0;i<5;i++){ px(g,i*36,16,26,10,sil); px(g,i*36-2,14,30,2,PAL.brown); } break;
      case "town": for(let i=0;i<7;i++){ const h=12+Math.floor(r()*10); px(g,i*24,34-h,21,h,sil); px(g,i*24-1,34-h-2,23,3,PAL.brown); px(g,i*24+5,34-h+5,4,4,PAL.gold); } break;
      case "sky": for(let i=0;i<4;i++){ const x=20+i*38, y=4+((i*7+frame)%8); px(g,x,y,16,14,[PAL.coral,PAL.gold,PAL.aqua,PAL.violet][i]); px(g,x+2,y-2,12,2,[PAL.coral,PAL.gold,PAL.aqua,PAL.violet][i]); px(g,x+5,y+16,6,4,PAL.brown); } px(g,0,30,160,4,PAL.leaf); break;
      case "sea": px(g,0,24,160,10,PAL.sea); for(let i=0;i<10;i++) px(g,(i*21+frame*2)%160,27+(i%3)*2,8,1,PAL.aqua); for(let i=0;i<5;i++){ const x=10+i*34+Math.floor(r()*8); px(g,x,18,14,6,dark(PAL.forest,.2)); px(g,x+3,15,8,3,PAL.leaf); } break;
      case "hill": px(g,0,22,70,12,sil); px(g,50,16,60,18,dark(sil,.1)); px(g,100,24,60,10,sil); px(g,78,4,2,14,PAL.mist); px(g,74,8,10,1,PAL.mist); px(g,77,2,4,2,frame%2?PAL.coral:PAL.red); break;
      case "night": for(let i=0;i<20;i++) px(g,Math.floor(r()*160),Math.floor(r()*18),1,1,PAL.cream); for(let i=0;i<9;i++){ const h=8+Math.floor(r()*16); px(g,i*18,34-h,15,h,PAL.ink); for(let k=0;k<4;k++) px(g,i*18+2+k*3,34-h+3+((i+k)%3)*3,1,1,(k+frame)%3?PAL.gold:PAL.coral); } break;
      case "volcano": px(g,40,10,80,24,dark(PAL.brown,.4)); px(g,60,6,40,6,dark(PAL.brown,.3)); for(let i=0;i<8;i++) px(g,72+Math.floor(r()*16)-((frame+i)%4),6-i*1,6,2,PAL.mist); px(g,74,8,12,2,PAL.coral); break;
      case "field": px(g,0,26,160,8,PAL.leaf); px(g,0,20,90,8,dark(PAL.leaf,.25)); px(g,70,16,90,12,dark(PAL.leaf,.35)); for(let i=0;i<14;i++) px(g,(i*13+frame)%160,28+(i%3),2,1,PAL.cream); break;
      case "onsen": for(let i=0;i<6;i++){ px(g,i*28,18,22,16,sil); px(g,i*28-2,16,26,2,PAL.brown); } for(let i=0;i<10;i++){ const x=(i*17)%160, y=14-((frame*2+i*3)%12); px(g,x,y,4,3,PAL.mist); px(g,x+1,y-2,2,2,PAL.cream); } break;
      case "city": for(let i=0;i<10;i++){ const h=14+Math.floor(r()*18); px(g,i*16,34-h,14,h,sil); for(let y=34-h+3;y<32;y+=4) px(g,i*16+3,y,8,1,(y+frame)%3?PAL.gold:PAL.aqua); } break;
      case "beach": px(g,0,22,160,6,PAL.sea); for(let i=0;i<8;i++) px(g,(i*23+frame*2)%160,24,6,1,PAL.aqua); px(g,0,28,160,6,PAL.sand); for(let i=0;i<4;i++){ const x=16+i*42; px(g,x,10,2,18,PAL.brown); px(g,x-6,8,14,3,PAL.leaf); px(g,x-3,6,8,2,PAL.leaf); } break;
      default: break;
    }
  }
  function stage(areaId, frame){
    frame=frame%4; const key=`s${areaId}${frame}`; if(cache[key]) return cache[key];
    const [c,g]=mk(160,64); const r=seeded(areaId);
    const sky = { "KY01-A1":[PAL.sea,PAL.aqua,PAL.cream], "KY01-A2":[PAL.slate,PAL.mist,PAL.mist], "KY01-A3":[PAL.violet,PAL.coral,PAL.gold],
      "KY02-A1":[PAL.navy,PAL.sea,PAL.aqua], "KY02-A2":[PAL.slate,PAL.violet,PAL.mist], "KY02-A3":[PAL.ink,PAL.navy,PAL.violet] }[areaId] || (typeof AREA_SKY!=="undefined"&&AREA_SKY[areaId]) || [PAL.navy,PAL.slate,PAL.mist];
    band(g,0,14,sky[0],sky[1]); band(g,14,10,sky[1],sky[2]); band(g,24,10,sky[2],sky[2]);
    if(areaId==="KY02-A3"||areaId==="KY01-A3"){ for(let i=0;i<14;i++) px(g,Math.floor(r()*160),Math.floor(r()*20),1,1,PAL.cream); }
    // Three restrained pixel silhouettes add distance without hiding the battle foreground.
    for(let layer=0;layer<3;layer++){const color=mix(sky[1],sky[0],0.25+layer*0.16);for(let x=0;x<160;x+=8){const top=12+layer*5+Math.round(Math.sin(x/23+layer)*3);px(g,x,top,8,34-top,color);}}
    const sil=dark(sky[0],.55);
    switch(areaId){
      case "KY01-A1": for(let i=0;i<9;i++){ const h=8+Math.floor(r()*14); px(g,i*18,34-h,15,h,sil); px(g,i*18+3,34-h+3,2,2,PAL.gold); } px(g,20,22,2,12,PAL.ink); px(g,17,21,8,2,PAL.gold); break;
      case "KY01-A2": for(let i=0;i<6;i++){ px(g,i*28,12,24,22,dark(PAL.brown,.3)); px(g,i*28-2,10,28,3,PAL.red); px(g,i*28+4,18,6,6,PAL.gold); } for(let k=0;k<20;k++) px(g,(k*17+frame*3)%160,(k*11+frame*5)%34,1,2,PAL.aqua); break;
      case "KY01-A3": px(g,0,26,160,8,dark(PAL.violet,.3)); px(g,120,2,2,30,PAL.mist); for(let y=6;y<32;y+=6) px(g,116,y,10,1,PAL.mist); px(g,119,0,4,3,frame%2?PAL.coral:PAL.red); break;
      case "KY02-A1": px(g,0,28,160,6,PAL.sea); for(let i=0;i<8;i++) px(g,(i*23+frame*2)%160,30,6,1,PAL.aqua); px(g,30,22,22,6,PAL.ink); px(g,38,14,2,8,PAL.ink); px(g,100,24,16,4,PAL.ink); break;
      case "KY02-A2": for(let i=0;i<5;i++){ px(g,i*34,10,30,24,dark(PAL.slate,.4)); px(g,i*34,10,30,2,PAL.mist); px(g,i*34+10,20,10,14,PAL.ink); } px(g,140,0,2,30,PAL.gold); px(g,120,2,26,2,PAL.gold); break;
      case "KY02-A3": px(g,0,24,160,10,dark(PAL.forest,.4)); px(g,78,4,8,26,PAL.cream); px(g,78,4,8,3,PAL.red); px(g,79,1,6,3,PAL.gold);
        { const a=frame*0.6; for(let k=0;k<30;k++){ const t=k/30; px(g,82+Math.round(Math.cos(a)*70*t),5+Math.round(Math.sin(a)*8*t),1,1,PAL.gold); } } break;
      default: stageKind(g, (typeof STAGE_KIND!=="undefined"&&STAGE_KIND[areaId])||"", sil, r, frame); break;
    }
    // 地面（遠近の線）
    const ground = areaId.endsWith("A2")?PAL.slate: areaId.endsWith("A3")?dark(PAL.violet,.2): PAL.forest;
    px(g,0,34,160,30,ground); for(let y=36,k=1;y<64;y+=k,k++) px(g,0,y,160,1,dark(ground,.25));
    for(let x=-40;x<=200;x+=24){ for(let y=34;y<64;y++){ const xx=Math.round(80+(x-80)*(1+(y-34)/12)); if(xx>=0&&xx<160) px(g,xx,y,1,1,dark(ground,.25)); } }
    for(let i=0;i<18;i++){const x=Math.floor(r()*160),y=36+Math.floor(r()*26);px(g,x,y,2,1,light(ground,0.13));}
    // Horizon edge and sparse foreground tufts preserve the original 160 x 64 grid.
    px(g,0,34,160,1,light(ground,0.22));for(let i=0;i<9;i++){const x=(i*23+7)%160;px(g,x,60,1,3,dark(ground,0.38));px(g,x+1,59,1,3,dark(ground,0.3));}
    cache[key]=c; return c;
  }
  return { tile, mapLayer, drawWorld, worldCacheStats, scenicObject, ship, roadSign, person, object, enemy, flashOf, stage };
})();

