'use strict';
// ============================== procedural office map ==============================
// Tile dungeon: rooms + corridors, seeded => identical on all peers. Among Us / Diablo vibe.
var TILE=56,GW=30,GH=30;
var MAP_W=GW*TILE,MAP_H=GH*TILE;
var MAPSEED=1;
var grid=null;      // 1 = floor
var ROOMS=[];       // {x,y,w,h,type} px
var WALLS=[];       // merged wall rects (collide + minimap)
var FURN=[];        // furniture rects (collide)
var OBST=[];        // WALLS + FURN
var LIGHTS=[],COFFEES=[],SPAWNS=[];
var floorCv=null,mmCv=null;

function buildMap(seed){
  MAPSEED=seed>>>0;if(!MAPSEED)MAPSEED=1;
  _seed=MAPSEED;
  MAPTHEME=THEMES[(rnd()*THEMES.length)|0]; // тема детерминирована сидом
  grid=[];ROOMS=[];WALLS=[];FURN=[];OBST=[];LIGHTS=[];COFFEES=[];SPAWNS=[];
  var i,j,x,y;
  for(j=0;j<GH;j++){grid[j]=[];for(i=0;i<GW;i++)grid[j][i]=0;}
  // --- place rooms (plus two small WC rooms)
  var roomsT=[],want=14,tries=0;
  while(roomsT.length<want-2&&tries<500){
    tries++;
    var tw=7+((rnd()*5)|0),th=5+((rnd()*3)|0);
    var tx=2+((rnd()*(GW-tw-4))|0),ty=2+((rnd()*(GH-th-4))|0);
    var ok=true;
    for(var r=0;r<roomsT.length;r++){var o=roomsT[r];
      if(tx<o.x+o.w+2&&tx+tw+2>o.x&&ty<o.y+o.h+2&&ty+th+2>o.y){ok=false;break;}
    }
    if(ok)roomsT.push({x:tx,y:ty,w:tw,h:th,type:'office'});
  }
  for(i=0;i<2;i++){
    tries=0;
    while(tries<300){
      tries++;
      var tw2=3,th2=3;
      var tx2=2+((rnd()*(GW-tw2-4))|0),ty2=2+((rnd()*(GH-th2-4))|0);
      var ok2=true;
      for(r=0;r<roomsT.length;r++){var o2=roomsT[r];
        if(tx2<o2.x+o2.w+2&&tx2+tw2+2>o2.x&&ty2<o2.y+o2.h+2&&ty2+th2+2>o2.y){ok2=false;break;}
      }
      if(ok2){roomsT.push({x:tx2,y:ty2,w:tw2,h:th2,type:'wc'});break;}
    }
  }
  // --- carve rooms
  for(r=0;r<roomsT.length;r++){var rm=roomsT[r];
    for(j=rm.y;j<rm.y+rm.h;j++)for(i=rm.x;i<rm.x+rm.w;i++)grid[j][i]=1;
    ROOMS.push({x:rm.x*TILE,y:rm.y*TILE,w:rm.w*TILE,h:rm.h*TILE,tx:rm.x,ty:rm.y,tw:rm.w,th:rm.h,type:rm.type});
  }
  // --- corridors: connect each room to nearest already-connected (prim-ish) + 2 loops
  var connected=[0];
  function carveCorr(a,b,wd){
    var ax=(ROOMS[a].tx+ROOMS[a].tw/2)|0,ay=(ROOMS[a].ty+ROOMS[a].th/2)|0;
    var bx=(ROOMS[b].tx+ROOMS[b].tw/2)|0,by=(ROOMS[b].ty+ROOMS[b].th/2)|0;
    function hor(x1,x2,yy){for(var xx=Math.min(x1,x2);xx<=Math.max(x1,x2);xx++)for(var k=0;k<wd;k++){var yv=yy+k;if(yv>0&&yv<GH-1&&xx>0&&xx<GW-1)grid[yv][xx]=1;}}
    function ver(y1,y2,xx){for(var yy=Math.min(y1,y2);yy<=Math.max(y1,y2);yy++)for(var k=0;k<wd;k++){var xv=xx+k;if(yy>0&&yy<GH-1&&xv>0&&xv<GW-1)grid[yy][xv]=1;}}
    // честная буква L: сегменты проходят через центры обеих комнат — связь гарантирована
    if(rnd()<0.5){hor(ax,bx,ay);ver(ay,by,bx);}
    else{ver(ay,by,ax);hor(ax,bx,by);}
  }
  for(i=1;i<ROOMS.length;i++){
    var best=0,bd=1e9;
    for(j=0;j<connected.length;j++){
      var c=connected[j];
      var d=Math.abs(ROOMS[c].tx-ROOMS[i].tx)+Math.abs(ROOMS[c].ty-ROOMS[i].ty);
      if(d<bd){bd=d;best=c;}
    }
    carveCorr(i,best,2);
    connected.push(i);
  }
  for(i=0;i<1&&ROOMS.length>4;i++){
    carveCorr((rnd()*ROOMS.length)|0,(rnd()*ROOMS.length)|0,2);
  }
  // --- connectivity repair: no isolated rooms allowed
    var lobbyR=ROOMS[0];
  for(var d5=1e9,i5=1;i5<ROOMS.length;i5++){
    var dd5=ROOMS[i5].tx*ROOMS[i5].tx+ROOMS[i5].ty*ROOMS[i5].ty;
    if(dd5<d5){d5=dd5;lobbyR=ROOMS[i5];}
  }
  var lc=roomCenter(lobbyR);
  for(var guard=0;guard<10;guard++){
    var seen2=floodFrom(lc[0],lc[1]);
    var iso=null;
    for(i5=0;i5<ROOMS.length;i5++){
      var rc2=roomCenter(ROOMS[i5]);
      if(!seen2[rc2[0]+','+rc2[1]]){iso=ROOMS[i5];break;}
    }
    if(!iso)break;
    var tgt=null,bd3=1e9;
    for(i5=0;i5<ROOMS.length;i5++){
      if(ROOMS[i5]===iso)continue;
      var rc3=roomCenter(ROOMS[i5]);
      if(!seen2[rc3[0]+','+rc3[1]])continue;
      var d6=Math.abs(rc3[0]-roomCenter(iso)[0])+Math.abs(rc3[1]-roomCenter(iso)[1]);
      if(d6<bd3){bd3=d6;tgt=ROOMS[i5];}
    }
    if(!tgt)break;
    carveCorr(ROOMS.indexOf(iso),ROOMS.indexOf(tgt),2);
  }
  // --- room types
  var byArea=ROOMS.slice().sort(function(a,b){return b.w*b.h-a.w*a.h;});
  byArea[0].type='openspace';
  var lobby=ROOMS[0],ld=1e9;
  for(i=0;i<ROOMS.length;i++){
    var d2=ROOMS[i].x*ROOMS[i].x+ROOMS[i].y*ROOMS[i].y;
    if(d2<ld&&ROOMS[i]!==byArea[0]&&ROOMS[i].type!=='wc'){ld=d2;lobby=ROOMS[i];}
  }
  lobby.type='lobby';
  var assigned=0;
  for(i=0;i<byArea.length;i++){
    var rr2=byArea[i];
    if(rr2.type!=='office')continue;
    if(assigned===0||assigned===3){rr2.type='meeting';}
    else if(assigned===1||assigned===4){rr2.type='pantry';} // кладовки рано: кофе гарантирован
    assigned++;
  }
  // --- furniture + coffee + lights + spawn points
  var fid=1;
  for(i=0;i<ROOMS.length;i++)fid=furnishRoom(ROOMS[i],fid);
  for(i=0;i<FURN.length;i++)FURN[i].hp=FPROPS[FURN[i].t].hp;
  // страховка: кладовок не оказалось — крупнейшая комната становится кладовкой
  var hasPantry=false;
  for(var rp=0;rp<ROOMS.length;rp++)if(ROOMS[rp].type==='pantry')hasPantry=true;
  if(!hasPantry){
    var big=ROOMS[0];
    for(rp=1;rp<ROOMS.length;rp++)if(ROOMS[rp].w*ROOMS[rp].h>big.w*big.h&&ROOMS[rp].type!=='lobby'&&ROOMS[rp].type!=='wc')big=ROOMS[rp];
    if(big.type!=='lobby'&&big.type!=='wc')big.type='pantry';
  }
  // coffee machines: 1-2 for the whole office (user request), one per pantry max
  var pantries=[];
  for(i=0;i<ROOMS.length;i++)if(ROOMS[i].type==='pantry')pantries.push(ROOMS[i]);
  for(i=0;i<Math.min(2,pantries.length);i++)COFFEES.push({x:pantries[i].x+pantries[i].w/2,y:pantries[i].y+70,charges:3,t:0});
  SPAWNS.push({x:lobby.x+lobby.w/2,y:lobby.y+lobby.h/2,tag:'ресепшн'});
  for(i=0;i<ROOMS.length;i++)if(ROOMS[i].type==='openspace'){
    var osx=ROOMS[i].x+ROOMS[i].w/2,osy=ROOMS[i].y+ROOMS[i].h/2;
    var osBlocked=false; // OBST ещё не собран — проверяем мебель напрямую
    for(var fo=0;fo<FURN.length;fo++){var fo2=FURN[fo];
      var fcx=Math.max(fo2.x,Math.min(osx,fo2.x+fo2.w)),fcy=Math.max(fo2.y,Math.min(osy,fo2.y+fo2.h));
      if((osx-fcx)*(osx-fcx)+(osy-fcy)*(osy-fcy)<18*18){osBlocked=true;break;}
    }
    if(osBlocked){osy=ROOMS[i].y+24;osx=ROOMS[i].x+24;}
    SPAWNS.push({x:osx,y:osy,tag:'опенспейс'});
  }
  for(i=0;i<ROOMS.length;i++)if(ROOMS[i].type==='wc')SPAWNS.push({x:ROOMS[i].x+ROOMS[i].w/2,y:ROOMS[i].y+ROOMS[i].h/2,tag:'уборная'});
  for(i=0;i<COFFEES.length;i++)SPAWNS.push({x:COFFEES[i].x,y:COFFEES[i].y+50,tag:'кофепоинт'});
  // corridor lights
  for(j=1;j<GH-1;j++)for(i=1;i<GW-1;i++){
    if(grid[j][i]&&!roomAtTile(i,j)){
      if((i*7+j*13)%5===0&&rnd()<0.5){
        var dead=rnd()<0.25,dim=dead?0:(rnd()<0.3?0.5:1);
        LIGHTS.push({x:i*TILE+TILE/2,y:j*TILE+TILE/2,dead:dead,dim:dim,ph:rnd()*10,sd:rnd()*100,sput:0});
      }
    }
  }
  // --- thin walls: strips on the void side of every floor tile edge
  var WT=26;
  for(j=0;j<GH;j++)for(i=0;i<GW;i++){
    if(!grid[j][i])continue;
    var L=(i>0?grid[j][i-1]:0),Rr=(i<GW-1?grid[j][i+1]:0),U=(j>0?grid[j-1][i]:0),D=(j<GH-1?grid[j+1][i]:0);
    if(!L)WALLS.push({x:i*TILE-WT,y:j*TILE,w:WT,h:TILE,dir:0});
    if(!Rr)WALLS.push({x:(i+1)*TILE,y:j*TILE,w:WT,h:TILE,dir:1});
    if(!U)WALLS.push({x:i*TILE,y:j*TILE-WT,w:TILE,h:WT,dir:2});
    if(!D)WALLS.push({x:i*TILE,y:(j+1)*TILE,w:TILE,h:WT,dir:3});
  }
  resetFog();
  rebuildObst();
  validateSpawns();
  prerenderFloor();
  buildMinimapBase();
}

// ---- гарантия досягаемости: спавны и кофе только в связной зоне, свободной от мебели ----
var REACH=new Uint8Array(GW*GH); // структурно досягаемые тайлы (стены+мебель)
var REACH_LIST=[];                // центры таких тайлов — безопасный фолбэк спавна
function tileFree(tx,ty,r){
  if(!grid[ty]||!grid[ty][tx])return false;
  return !blockedAt(tx*TILE+TILE/2,ty*TILE+TILE/2,r);
}
function buildReach(){
  REACH.fill(0);REACH_LIST.length=0;
  var c0=roomCenter(lobbyRoom()),sx=c0[0],sy=c0[1];
  if(!tileFree(sx,sy,16)){ // центр лобби может быть занят мебелью — ищем ближайший свободный
    search: for(var r2=1;r2<6;r2++)
      for(var dy=-r2;dy<=r2;dy++)for(var dx=-r2;dx<=r2;dx++){
        var xx=sx+dx,yy=sy+dy;
        if(xx>=0&&yy>=0&&xx<GW&&yy<GH&&tileFree(xx,yy,16)){sx=xx;sy=yy;break search;}
      }
  }
  var q=[sx+sy*GW];REACH[sx+sy*GW]=1;
  for(var head=0;head<q.length;head++){
    var cur=q[head],cx=cur%GW,cy=(cur/GW)|0;
    REACH_LIST.push({x:cx*TILE+TILE/2,y:cy*TILE+TILE/2});
    for(var k=0;k<4;k++){
      var nx=cx+(k===0?1:(k===1?-1:0)),ny=cy+(k===2?1:(k===3?-1:0));
      if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
      var ni=nx+ny*GW;
      if(REACH[ni]||!grid[ny][nx]||!tileFree(nx,ny,16))continue;
      REACH[ni]=1;q.push(ni);
    }
  }
}
function snapReachable(p){ // ближайший досягаемый свободный тайл-центр
  var tx=clamp((p.x/TILE)|0,0,GW-1),ty=clamp((p.y/TILE)|0,0,GH-1);
  if(REACH[tx+ty*GW]&&!blockedAt(p.x,p.y,16))return{x:p.x,y:p.y};
  var best=null,bd=1e18;
  for(var i=0;i<REACH_LIST.length;i++){
    var t=REACH_LIST[i],dd=(t.x-p.x)*(t.x-p.x)+(t.y-p.y)*(t.y-p.y);
    if(dd<bd){bd=dd;best=t;}
  }
  return best?{x:best.x,y:best.y}:{x:p.x,y:p.y};
}
function reachOK(x,y){
  var tx=clamp((x/TILE)|0,0,GW-1),ty=clamp((y/TILE)|0,0,GH-1);
  return !!REACH[tx+ty*GW];
}
function validateSpawns(){
  buildReach();
  for(var i=0;i<SPAWNS.length;i++){
    var sn=snapReachable(SPAWNS[i]);
    SPAWNS[i]={x:sn.x,y:sn.y,tag:SPAWNS[i].tag};
  }
  for(i=0;i<COFFEES.length;i++){
    var cc=snapReachable(COFFEES[i]);
    COFFEES[i].x=cc.x;COFFEES[i].y=cc.y;
  }
}
function rebuildObst(){
  OBST.length=0;
  for(var i=0;i<WALLS.length;i++)OBST.push(WALLS[i]);
  for(i=0;i<FURN.length;i++){var f=FURN[i];
    if(!f.dead&&FPROPS[f.t].solid)OBST.push(f);
  }
}
function roomAtTile(i,j){
  for(var r=0;r<ROOMS.length;r++){var rm=ROOMS[r];
    if(i>=rm.tx&&i<rm.tx+rm.tw&&j>=rm.ty&&j<rm.ty+rm.th)return rm;
  }
  return null;
}
// furniture properties: solid = blocks movement; hp > 0 = destructible
var FPROPS={
  desk:{solid:1,hp:40},rtable:{solid:1,hp:60},cabinet:{solid:1,hp:30},stall:{solid:1,hp:50},
  printer:{solid:1,hp:30},cooler:{solid:0,hp:25},
  cstand:{solid:0,hp:0},sink:{solid:0,hp:0},rstand:{solid:0,hp:0},plant:{solid:0,hp:0}
};
function furnRoom(rm,type){return rm.type===type;}
// placement with overlap protection: мебель не налезает друг на друга
function placeFurn(rm,fid,t,x,y,w,h,margin){
  margin=margin||10;
  for(var k=0;k<8;k++){
    var ok=true;
    if(x<rm.x+8||x+w>rm.x+rm.w-8||y<rm.y+8||y+h>rm.y+rm.h-8)ok=false;
    if(ok)for(var f=0;f<FURN.length;f++){var o=FURN[f];
      if(x<o.x+o.w+margin&&x+w+margin>o.x&&y<o.y+o.h+margin&&y+h+margin>o.y){ok=false;break;}
    }
    if(ok){FURN.push({id:fid++,t:t,x:x,y:y,w:w,h:h});return fid;}
    x=rm.x+12+((rnd()*(rm.w-w-24))|0);
    y=rm.y+12+((rnd()*(rm.h-h-24))|0);
  }
  return fid;
}
function furnishRoom(rm,fid){
  var i,j;
  // ceiling lights in room
  for(j=rm.ty;j<rm.ty+rm.th;j+=3)for(i=rm.tx;i<rm.tx+rm.tw;i+=3){
    var dead=rnd()<0.22,dim=dead?0:(rnd()<0.3?0.5:1);
    LIGHTS.push({x:i*TILE+TILE*1.5,y:j*TILE+TILE*1.5,dead:dead,dim:dim,ph:rnd()*10,sd:rnd()*100,sput:0});
  }
  if(furnRoom(rm,'openspace')){
    for(j=rm.y+80;j<rm.y+rm.h-60;j+=130){
      for(i=rm.x+60;i<rm.x+rm.w-160;i+=210){
        if(rnd()<0.15)continue;
        fid=placeFurn(rm,fid,'desk',i,j,118,46);
      }
    }
    var np2=1+((rnd()*2)|0);
    for(i=0;i<np2;i++)fid=placeFurn(rm,fid,'printer',rm.x+20+rnd()*(rm.w-80),rm.y+14+rnd()*(rm.h-62),44,38);
  }else if(furnRoom(rm,'office')){
    var n=1+((rnd()*2)|0);
    for(i=0;i<n;i++){
      var dx2=rm.x+60+rnd()*(rm.w-260),dy2=rm.y+60+rnd()*(rm.h-160);
      fid=placeFurn(rm,fid,'desk',dx2,dy2,118,46);
    }
    if(rnd()<0.6)fid=placeFurn(rm,fid,'printer',rm.x+16+rnd()*(rm.w-80),rm.y+16+rnd()*(rm.h-62),44,38);
    if(rnd()<0.5)fid=placeFurn(rm,fid,'cabinet',rm.x+20,rm.y+rm.h-56,64,28);
  }else if(furnRoom(rm,'meeting')){
    fid=placeFurn(rm,fid,'rtable',rm.x+rm.w/2-45,rm.y+rm.h/2-28,90,56,14);
  }else if(furnRoom(rm,'pantry')){
    fid=placeFurn(rm,fid,'cstand',rm.x+rm.w/2-25,rm.y+16,50,38);
    fid=placeFurn(rm,fid,'cooler',rm.x+rm.w-46,rm.y+rm.h-50,26,26);
  }else if(furnRoom(rm,'lobby')){
    fid=placeFurn(rm,fid,'rstand',rm.x+rm.w/2-36,rm.y+30,72,32);
  }else if(furnRoom(rm,'wc')){
    // сантехника — фиксированные позиции, рандом-ретраи здесь не нужны
    FURN.push({id:fid++,t:'sink',x:rm.x+10,y:rm.y+rm.h-26,w:48,h:20});
    FURN.push({id:fid++,t:'sink',x:rm.x+rm.w-58,y:rm.y+rm.h-26,w:48,h:20});
    FURN.push({id:fid++,t:'stall',x:rm.x+8,y:rm.y+8,w:(rm.w-28)/2,h:34});
    FURN.push({id:fid++,t:'stall',x:rm.x+rm.w/2+6,y:rm.y+8,w:(rm.w-28)/2,h:34});
  }
  if(rm.type!=='wc'&&rnd()<0.6)fid=placeFurn(rm,fid,'plant',rm.x+24+rnd()*(rm.w-54),rm.y+24+rnd()*(rm.h-54),22,22,6);
  return fid;
}
function prerenderFloor(){
  floorCv=document.createElement('canvas');floorCv.width=MAP_W;floorCv.height=MAP_H;
  var c=floorCv.getContext('2d');
  var i,j,rm;
  // void
  c.fillStyle='#06080c';c.fillRect(0,0,MAP_W,MAP_H);
  // floors + walls per tile
  for(j=0;j<GH;j++)for(i=0;i<GW;i++){
    var x=i*TILE,y=j*TILE;
    if(grid[j][i]){
      rm=roomAtTile(i,j);
      var base=MAPTHEME.floor,alt=MAPTHEME.alt;
      if(rm){
        if(rm.type==='pantry'){base=shade(MAPTHEME.floor,6);alt=shade(MAPTHEME.alt,6);}
        else if(rm.type==='meeting'){base=shade(MAPTHEME.floor,-4);alt=shade(MAPTHEME.alt,-4);}
        else if(rm.type==='lobby'){base=shade(MAPTHEME.floor,8);alt=shade(MAPTHEME.alt,8);}
        else if(rm.type==='wc'){base=shade(MAPTHEME.floor,14);alt=shade(MAPTHEME.alt,14);}
      }else{base=MAPTHEME.corr;alt=MAPTHEME.corrAlt;}
      c.fillStyle=((i+j)%2===0)?base:alt;
      c.fillRect(x,y,TILE,TILE);
      if(!rm){ // corridor seams
        c.strokeStyle='rgba(0,0,0,0.18)';c.lineWidth=1;
        c.strokeRect(x+0.5,y+0.5,TILE-1,TILE-1);
      }
    }
  }
  // --- псевдо-3D: фронты стен (высота), затем верхние грани ---
  var EH=12,wi,w3;
  for(wi=0;wi<WALLS.length;wi++){w3=WALLS[wi];
    c.fillStyle=shade(MAPTHEME.wall,-6);
    c.fillRect(w3.x,w3.y+w3.h-1,w3.w,EH);
    c.fillStyle=shade(MAPTHEME.wallIn,-8);
    c.fillRect(w3.x+1,w3.y+w3.h,w3.w-2,EH-2);
    // отблеск неона на низе фронта
    c.fillStyle='rgba(232,58,156,0.10)';
    c.fillRect(w3.x+1,w3.y+w3.h+EH-3,w3.w-2,2);
  }
  // --- псевдо-3D: фронты мебели ---
  for(wi=0;wi<FURN.length;wi++){var f3=FURN[wi];
    c.fillStyle='rgba(0,0,0,0.42)';
    c.fillRect(f3.x+2,f3.y+f3.h-1,f3.w,9);
  }
  // coffee stains — irregular splatters, not circles
  // верхние грани стен (после фронтов, поверх)
  for(wi=0;wi<WALLS.length;wi++){w3=WALLS[wi];
    c.fillStyle=shade(MAPTHEME.wall,6);c.fillRect(w3.x,w3.y,w3.w,w3.h);
    c.fillStyle=MAPTHEME.wallIn;c.fillRect(w3.x+1,w3.y+1,w3.w-2,w3.h-2);
    var neon=rnd();
    c.fillStyle=neon<0.10?MAPTHEME.neonA:(neon<0.20?MAPTHEME.neonB:MAPTHEME.steel);
    if(w3.dir===0)c.fillRect(w3.x+w3.w-3,w3.y,3,w3.h);
    else if(w3.dir===1)c.fillRect(w3.x,w3.y,3,w3.h);
    else if(w3.dir===2)c.fillRect(w3.x,w3.y+w3.h-3,w3.w,3);
    else c.fillRect(w3.x,w3.y,w3.w,3);
    c.fillStyle='rgba(0,0,0,0.25)';
    if(w3.h>w3.w)c.fillRect(w3.x,w3.y,2,w3.h);else c.fillRect(w3.x,w3.y,w3.w,2);
  }
  // coffee stains — irregular splatters, not circles
  for(i=0;i<40;i++){
    var sx=0,sy=0,tries=0;
    do{sx=40+rnd()*(MAP_W-80);sy=40+rnd()*(MAP_H-80);tries++;}
    while(tries<20&&!floorOpenAt(sx,sy));
    var al=0.16+rnd()*0.26;
    // random walk of blobs + a couple of far drips
    var bx=sx,by=sy,dir=rnd()*TAU;
    for(var bl=0;bl<6;bl++){
      var br2=4+rnd()*9;
      c.fillStyle='rgba(58,42,24,'+(al*(1-bl*0.1)).toFixed(3)+')';
      c.beginPath();
      c.moveTo(bx+br2,by);
      for(var an=0;an<TAU;an+=0.5){
        var wob=br2*(0.62+rnd()*0.55);
        c.lineTo(bx+Math.cos(an+dir)*wob,by+Math.sin(an+dir)*wob*0.8);
      }
      c.closePath();c.fill();
      dir+=(rnd()-0.5)*1.4;
      bx+=Math.cos(dir)*(4+rnd()*8);by+=Math.sin(dir)*(3+rnd()*6);
    }
    for(var dp=0;dp<2;dp++){
      var dx3=(rnd()-0.5)*36,dy3=(rnd()-0.5)*26;
      c.fillStyle='rgba(58,42,24,'+(al*0.7).toFixed(3)+')';
      c.beginPath();c.ellipse(sx+dx3,sy+dy3,1.5+rnd()*3,1.5+rnd()*3,rnd()*3,0,TAU);c.fill();
    }
  }
  // furniture decals
  for(i=0;i<FURN.length;i++)drawFurnDecal(c,FURN[i]);
  // wall decals: whiteboards/posters on room top walls
  for(i=0;i<ROOMS.length;i++){
    rm=ROOMS[i];
    if(rm.type==='meeting'||(rm.type==='office'&&(i%2===0))){
      var wx=rm.x+30,wy=rm.y+2;
      c.fillStyle='#d8dce2';c.fillRect(wx,wy,120,26);
      c.strokeStyle='#9aa0a8';c.lineWidth=2;c.strokeRect(wx,wy,120,26);
      c.strokeStyle='#7a828c';c.lineWidth=1.5;
      c.beginPath();c.moveTo(wx+8,wy+8);c.lineTo(wx+60,wy+8);c.moveTo(wx+8,wy+16);c.lineTo(wx+90,wy+16);c.stroke();
      if(rm.type==='meeting'){c.fillStyle='#c23b32';c.font='bold 10px Arial';c.fillText('OKR?',wx+96,wy+18);}
    }
    if(rm.type==='lobby'){
      c.fillStyle='#2c3540';c.fillRect(rm.x+rm.w/2-70,rm.y+2,140,34);
      c.fillStyle='#c9d1d9';c.font='bold 13px Arial';c.textAlign='center';
      c.fillText('WE ARE A FAMILY',rm.x+rm.w/2,rm.y+24);c.textAlign='left';
    }
  }
}
function floorOpenAt(x,y){
  var i=(x/TILE)|0,j=(y/TILE)|0;
  if(i<0||j<0||i>=GW||j>=GH)return false;
  if(!grid[j][i])return false;
  for(var k=0;k<FURN.length;k++){var f=FURN[k];
    if(x>f.x-8&&x<f.x+f.w+8&&y>f.y-8&&y<f.y+f.h+8)return false;
  }
  return true;
}
function drawFurnDecal(c,f){
  if(f.t==='desk'){
    c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(f.x+4,f.y+6,f.w,f.h);
    c.fillStyle='#3a404c';c.fillRect(f.x,f.y,f.w,f.h);
    c.fillStyle='#454c59';c.fillRect(f.x,f.y,f.w,6);
    c.strokeStyle='#22262e';c.lineWidth=2;c.strokeRect(f.x,f.y,f.w,f.h);
    c.fillStyle='#14171c';c.fillRect(f.x+12,f.y+12,36,26);
    c.fillStyle='rgba(150,190,220,0.25)';c.fillRect(f.x+14,f.y+14,32,22);
    c.fillStyle='#14171c';c.fillRect(f.x+27,f.y+38,6,8);
    c.fillStyle='rgba(220,224,230,0.7)';c.save();c.translate(f.x+95,f.y+30);c.rotate(0.2);c.fillRect(-9,-6,18,12);c.restore();
    c.fillStyle='rgba(210,214,222,0.5)';c.save();c.translate(f.x+110,f.y+40);c.rotate(-0.3);c.fillRect(-8,-5,16,10);c.restore();
    c.fillStyle='#6f4a23';c.beginPath();c.arc(f.x+72,f.y+20,5,0,TAU);c.fill();
    chair(c,f.x+75,f.y+92);chair(c,f.x+40,f.y-24);
  }else if(f.t==='rtable'){
    c.fillStyle='rgba(0,0,0,0.3)';c.beginPath();c.ellipse(f.x+f.w/2+4,f.y+f.h/2+5,f.w/2,f.h/2,0,0,TAU);c.fill();
    c.fillStyle='#4a4238';c.beginPath();c.ellipse(f.x+f.w/2,f.y+f.h/2,f.w/2,f.h/2,0,0,TAU);c.fill();
    c.strokeStyle='#2c261f';c.lineWidth=2;c.stroke();
    c.fillStyle='rgba(220,224,230,0.55)';c.fillRect(f.x+f.w/2-16,f.y+f.h/2-9,26,18);
    c.fillStyle='#6f4a23';c.beginPath();c.arc(f.x+f.w/2+26,f.y+f.h/2+4,6,0,TAU);c.fill();
    chair(c,f.x-26,f.y+f.h/2);chair(c,f.x+f.w+26,f.y+f.h/2);chair(c,f.x+f.w/2,f.y-26);chair(c,f.x+f.w/2,f.y+f.h+26);
  }else if(f.t==='printer'){
    c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(f.x+3,f.y+4,f.w,f.h);
    c.fillStyle='#565e6a';rr(c,f.x,f.y,f.w,f.h,3);c.fill();
    c.fillStyle='#3a4049';c.fillRect(f.x+6,f.y+6,f.w-12,14);
    c.fillStyle='#22262e';c.fillRect(f.x+6,f.y+26,f.w-12,8);
    c.fillStyle='rgba(220,224,230,0.7)';c.fillRect(f.x+16,f.y+28,f.w-32,2);
    c.fillStyle='#8bd17c';c.fillRect(f.x+f.w-12,f.y+8,3,3);
  }else if(f.t==='cstand'){
    c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(f.x+4,f.y+6,f.w,f.h);
    c.fillStyle='#3d434e';c.fillRect(f.x,f.y,f.w,f.h);
    c.fillStyle='#4d5462';c.fillRect(f.x,f.y,f.w,7);
    c.strokeStyle='#22262e';c.lineWidth=2;c.strokeRect(f.x,f.y,f.w,f.h);
    // coffee machine
    c.fillStyle='#22262e';c.fillRect(f.x+f.w/2-24,f.y-34,48,34);
    c.fillStyle='#3a4049';c.fillRect(f.x+f.w/2-18,f.y-28,36,16);
    c.fillStyle='#3fb950';c.fillRect(f.x+f.w/2-14,f.y-26,5,3);
  }else if(f.t==='cabinet'){
    c.fillStyle='#39404b';c.fillRect(f.x,f.y,f.w,f.h);
    c.strokeStyle='#20242b';c.lineWidth=2;c.strokeRect(f.x,f.y,f.w,f.h);
    c.strokeStyle='#282e38';c.beginPath();
    for(var k=1;k<3;k++){c.moveTo(f.x+k*f.w/3,f.y+4);c.lineTo(f.x+k*f.w/3,f.y+f.h-4);}
    c.stroke();
  }else if(f.t==='plant'){
    c.fillStyle='#4a3a26';c.fillRect(f.x-4,f.y-4,f.w+8,f.h+4);
    c.fillStyle='#2f4a33';c.beginPath();c.arc(f.x+2,f.y,10,0,TAU);c.arc(f.x+f.w-2,f.y,10,0,TAU);c.arc(f.x+f.w/2,f.y-10,11,0,TAU);c.fill();
    c.fillStyle='#3a5a40';c.beginPath();c.arc(f.x+f.w/2,f.y,7,0,TAU);c.fill();
  }else if(f.t==='cooler'){
    c.fillStyle='#4d5462';c.fillRect(f.x,f.y,f.w,f.h);
    c.fillStyle='#7aa2c8';c.fillRect(f.x+5,f.y+4,f.w-10,12);
    c.fillStyle='#22262e';c.fillRect(f.x+4,f.y+18,f.w-8,8);
  }else if(f.t==='rstand'){
    c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(f.x+3,f.y+4,f.w,f.h);
    c.fillStyle='#423a30';c.fillRect(f.x,f.y,f.w,f.h);
    c.fillStyle='#544a3d';c.fillRect(f.x,f.y,f.w,6);
    c.strokeStyle='#2c261f';c.lineWidth=2;c.strokeRect(f.x,f.y,f.w,f.h);
    c.fillStyle='#8bd17c';c.font='bold 9px Arial';c.textAlign='center';
    c.fillText('RECEPTION',f.x+f.w/2,f.y+f.h/2+3);c.textAlign='left';
  }else if(f.t==='stall'){
    c.fillStyle='#3d4650';c.fillRect(f.x,f.y,f.w,f.h);
    c.strokeStyle='#22262e';c.lineWidth=2;c.strokeRect(f.x,f.y,f.w,f.h);
    c.fillStyle='#2a3038';c.fillRect(f.x+f.w-9,f.y+6,4,f.h-12);
    c.fillStyle='#c9d1d9';c.fillRect(f.x+f.w/2-2,f.y+f.h/2-2,4,4);
  }else if(f.t==='sink'){
    c.fillStyle='#454c56';c.fillRect(f.x,f.y,f.w,f.h);
    c.strokeStyle='#22262e';c.lineWidth=2;c.strokeRect(f.x,f.y,f.w,f.h);
    var ns=Math.max(2,(f.w/56)|0);
    for(var sk=0;sk<ns;sk++){
      var sx2=f.x+10+sk*(f.w-20)/ns;
      c.fillStyle='#5c6570';c.beginPath();c.ellipse(sx2+14,f.y+f.h/2,12,8,0,0,TAU);c.fill();
      c.fillStyle='#7aa2c8';c.beginPath();c.ellipse(sx2+14,f.y+f.h/2,8,5,0,0,TAU);c.fill();
      c.fillStyle='#8b949e';c.fillRect(sx2+12,f.y-6,4,8);
    }
  }
  function chair(cx2,cy2){c.fillStyle='#2c313b';c.beginPath();c.arc(cx2,cy2,13,0,TAU);c.fill();c.strokeStyle='#1c2027';c.lineWidth=3;c.beginPath();c.arc(cx2,cy2,13,0,TAU);c.stroke();}
}
function buildMinimapBase(){
  mmCv=document.createElement('canvas');
  var mmw=200,mmh=Math.round(mmw*MAP_H/MAP_W);
  mmCv.width=mmw;mmCv.height=mmh;
  var c=mmCv.getContext('2d'),sc=mmw/MAP_W;
  c.fillStyle='rgba(8,10,14,0.9)';c.fillRect(0,0,mmw,mmh);
  // floor tiles
  for(var j=0;j<GH;j++)for(var i=0;i<GW;i++){
    if(!grid[j][i])continue;
    var rm=roomAtTile(i,j);
    c.fillStyle=rm?(rm.type==='pantry'?'#2e3a33':(rm.type==='meeting'?'#33302a':'#2a3038')):'#232830';
    c.fillRect(i*TILE*sc,j*TILE*sc,TILE*sc+0.5,TILE*sc+0.5);
  }
  // walls
  c.fillStyle='#454e5c';
  for(i=0;i<WALLS.length;i++){var w=WALLS[i];c.fillRect(w.x*sc,w.y*sc,Math.max(1,w.w*sc),Math.max(1,w.h*sc));}
}

// связность: флуд от комнаты, центр комнаты, список недостижимых (от лобби)
function floodFrom(tx,ty){
  var seen={},q=[[tx,ty]];
  seen[tx+','+ty]=1;
  while(q.length){
    var cur=q.pop(),x=cur[0],y=cur[1];
    var nb=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];
    for(var n=0;n<4;n++){var nx=nb[n][0],ny=nb[n][1];
      if(nx<0||ny<0||nx>=GW||ny>=GH||!grid[ny][nx])continue;
      var k=nx+','+ny;
      if(!seen[k]){seen[k]=1;q.push([nx,ny]);}
    }
  }
  return seen;
}
function roomCenter(rm){return[rm.tx+((rm.tw/2)|0),rm.ty+((rm.th/2)|0)];}
function lobbyRoom(){
  for(var i=0;i<ROOMS.length;i++)if(ROOMS[i].type==='lobby')return ROOMS[i];
  return ROOMS[0];
}
function unreachableRooms(){
  var lb=lobbyRoom();
  var seen=floodFrom.apply(null,roomCenter(lb));
  var bad=[];
  for(var i=0;i<ROOMS.length;i++){
    var c=roomCenter(ROOMS[i]);
    if(!seen[c[0]+','+c[1]])bad.push(ROOMS[i]);
  }
  return bad;
}


// ---- flow-field: поле расстояний до игрока (BFS по тайлам), мобы идут по градиенту ----
var FLOW={d:new Int16Array(GW*GH),tx:-1,ty:-1,t:0};
function computeFlow(px,py){
  var d=FLOW.d;
  for(var i=0;i<d.length;i++)d[i]=-1;
  var sx=clamp((px/TILE)|0,0,GW-1),sy=clamp((py/TILE)|0,0,GH-1);
  if(!grid[sy][sx]){
    search: for(var r2=1;r2<5;r2++)
      for(var dy=-r2;dy<=r2;dy++)for(var dx=-r2;dx<=r2;dx++){
        var yy=sy+dy,xx=sx+dx;
        if(yy>=0&&yy<GH&&xx>=0&&xx<GW&&grid[yy][xx]){sy=yy;sx=xx;break search;}
      }
  }
  var q=[sx+sy*GW];d[sx+sy*GW]=0;
  for(var head=0;head<q.length;head++){
    var c=q[head],cx=c%GW,cy=(c/GW)|0,dc=d[c]+1;
    for(var k=0;k<4;k++){
      var nx=cx+(k===0?1:(k===1?-1:0)),ny=cy+(k===2?1:(k===3?-1:0));
      if(nx<0||ny<0||nx>=GW||ny>=GH||!grid[ny][nx])continue;
      var ni=nx+ny*GW;
      if(d[ni]===-1){d[ni]=dc;q.push(ni);}
    }
  }
}
function flowDir(x,y){
  var cx=clamp((x/TILE)|0,0,GW-1),cy=clamp((y/TILE)|0,0,GH-1);
  var here=FLOW.d[cx+cy*GW];
  if(here===-1)return null;
  var best=here,bx=cx,by=cy;
  for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    var nx=cx+dx,ny=cy+dy;
    if(nx<0||ny<0||nx>=GW||ny>=GH||!grid[ny][nx])continue;
    if(dx&&dy&&(!grid[cy][nx]||!grid[ny][cx]))continue;
    var nd=FLOW.d[nx+ny*GW];
    if(nd!==-1&&nd<best){best=nd;bx=nx;by=ny;}
  }
  if(bx===cx&&by===cy)return null;
  return Math.atan2((by+0.5)*TILE-y,(bx+0.5)*TILE-x);
}


// ---- темы локаций: каждый спринт — новый офис в своей стилистике ----
var THEMES=[
 {name:'Пурпурный опенспейс',floor:'#171226',alt:'#1b1630',corr:'#120e20',corrAlt:'#150f28',wall:'#0d0a18',wallIn:'#181231',neonA:'#e83a9c',neonB:'#1fc4ae',steel:'#41336a'},
 {name:'Ретро-архив',floor:'#1c1424',alt:'#221832',corr:'#150f1e',corrAlt:'#191226',wall:'#0d0916',wallIn:'#1a1230',neonA:'#ff8a3d',neonB:'#c43ed8',steel:'#4e3660'},
 {name:'Фиолетовый корпоратив',floor:'#131028',alt:'#171340',corr:'#0e0b20',corrAlt:'#110e2c',wall:'#0a0818',wallIn:'#161244',neonA:'#7a6aff',neonB:'#2ab8d8',steel:'#302c62'},
 {name:'Мятная лаборатория',floor:'#122020',alt:'#16282a',corr:'#0d181a',corrAlt:'#101e20',wall:'#081212',wallIn:'#123032',neonA:'#2ee8a8',neonB:'#b8e83a',steel:'#24504a'},
 {name:'Розовая тревога',floor:'#1e0f1c',alt:'#251424',corr:'#170b16',corrAlt:'#1c0e1b',wall:'#0e0710',wallIn:'#221028',neonA:'#ff2a7a',neonB:'#ff8a3d',steel:'#5c2450'}
];
var MAPTHEME=THEMES[0];

// имя темы по сиду без постройки карты (первый rnd() после посева = выбор темы)
function themeNameFor(seed){
  _seed=(seed>>>0)||1;
  return THEMES[(rnd()*THEMES.length)|0].name;
}

// ---- туман войны (герои-3 стиль): терра инкогнита + затемнённая обстановка + обзор ----
var FOG={explored:new Uint8Array(GW*GH),vis:new Uint8Array(GW*GH),t:0};
var SIGHT_TILES=5.5; // радиус обзора в тайлах
function segHitsRect(x1,y1,x2,y2,r){
  var dx=x2-x1,dy=y2-y1,t0=0,t1=1;
  var px=[-dx,dx,-dy,dy],qx=[x1-r.x,r.x+r.w-x1,y1-r.y,r.y+r.h-y1];
  for(var i=0;i<4;i++){
    if(px[i]===0){if(qx[i]<0)return false;}
    else{var tt=qx[i]/px[i];
      if(px[i]<0){if(tt>t1)return false;if(tt>t0)t0=tt;}
      else{if(tt<t0)return false;if(tt<t1)t1=tt;}
    }
  }
  return true;
}
function losClear(x1,y1,x2,y2){
  for(var i=0;i<WALLS.length;i++){
    if(segHitsRect(x1,y1,x2,y2,WALLS[i]))return false;
  }
  return true;
}
function resetFog(){
  for(var i=0;i<GW*GH;i++){FOG.explored[i]=0;FOG.vis[i]=0;}
}
function computeVis(px,py){
  for(var i=0;i<GW*GH;i++)FOG.vis[i]=0;
  var cx=(px/TILE)|0,cy=(py/TILE)|0;
  var R=SIGHT_TILES;
  for(var dy=-6;dy<=6;dy++)for(var dx=-6;dx<=6;dx++){
    var tx=cx+dx,ty=cy+dy;
    if(tx<0||ty<0||tx>=GW||ty>=GH)continue;
    if(dx*dx+dy*dy>R*R)continue;
    if(!grid[ty][tx])continue;
    var tcx=(tx+0.5)*TILE,tcy=(ty+0.5)*TILE;
    // угол тайла чуть ближе к игроку — смягчает «ступеньки» у кромок
    var mx=tcx+(px-tcx)*0.15,my=tcy+(py-tcy)*0.15;
    if(losClear(px,py,mx,my)){
      var ti=tx+ty*GW;
      FOG.vis[ti]=1;FOG.explored[ti]=1;
    }
  }
}
function tileVis(x,y){
  var tx=(x/TILE)|0,ty=(y/TILE)|0;
  if(tx<0||ty<0||tx>=GW||ty>=GH)return 0;
  return FOG.vis[tx+ty*GW];
}
function tileExplored(x,y){
  var tx=(x/TILE)|0,ty=(y/TILE)|0;
  if(tx<0||ty<0||tx>=GW||ty>=GH)return 0;
  return FOG.explored[tx+ty*GW];
}

function blockedAt(x,y,r){
  if(x<r||x>MAP_W-r||y<r||y>MAP_H-r)return true;
  for(var i=0;i<OBST.length;i++){var o=OBST[i];
    var cx=clamp(x,o.x,o.x+o.w),cy=clamp(y,o.y,o.y+o.h),dx=x-cx,dy=y-cy;
    if(dx*dx+dy*dy<r*r)return true;
  }return false;
}
function freeSpotNear(x,y,minD,maxD,r){
  for(var t=0;t<80;t++){
    var px=40+r+R()*(MAP_W-80-2*r),py=40+r+R()*(MAP_H-80-2*r);
    var d=Math.hypot(px-x,py-y);
    if(d>=minD&&d<=maxD&&!blockedAt(px,py,r+8))return{x:px,y:py};
  }
  return{x:clamp(x+300,60,MAP_W-60),y:clamp(y,60,MAP_H-60)};
}
function lobbySpawn(){
  for(var i=0;i<ROOMS.length;i++)if(ROOMS[i].type==='lobby')return ROOMS[i];
  return ROOMS[0]||{x:MAP_W/2,y:MAP_H/2,w:200,h:200};
}
function bossArena(){
  var best=ROOMS[0];
  for(var i=1;i<ROOMS.length;i++)if(ROOMS[i].w*ROOMS[i].h>best.w*best.h)best=ROOMS[i];
  return best;
}

// ============================== movement ==============================
function collideMove(e,dx,dy){
  e.x+=dx;e.y+=dy;
  e.x=clamp(e.x,e.r,MAP_W-e.r);e.y=clamp(e.y,e.r,MAP_H-e.r);
  for(var i=0;i<OBST.length;i++){var o=OBST[i];
    var cx=clamp(e.x,o.x,o.x+o.w),cy=clamp(e.y,o.y,o.y+o.h),ddx=e.x-cx,ddy=e.y-cy;
    var d2=ddx*ddx+ddy*ddy;
    if(d2<e.r*e.r){
      var d=Math.sqrt(d2);
      if(d<0.001){e.y=o.y-e.r;continue;}
      var push=e.r-d;e.x+=ddx/d*push;e.y+=ddy/d*push;
    }
  }
}
function inZone(x,y){
  for(var i=0;i<G.zones.length;i++){var z=G.zones[i];if(x>z.x&&x<z.x+z.w&&y>z.y&&y<z.y+z.h)return true;}
  return false;
}
