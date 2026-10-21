'use strict';
// ============================== loop ==============================
var lastT=0;
function loop(ts){
  var dt=Math.min(0.05,(ts-lastT)/1000||0.016);
  lastT=ts;
  if(G.state==='playing'&&!MUS.on)startMusic();
  if(G.state!=='playing'&&G.state!=='win'&&MUS.on)stopMusic();
  if(G.state==='playing'||G.state==='win'||NET.mode==='guest'){
    keysToInput();
    refreshAim();
    if(NET.mode!=='guest'){
      var me=localPlayer();
      if(me){me.ix=INPUT.ix;me.iy=INPUT.iy;me.aim=INPUT.aim;me.f1=INPUT.f1||INPUT.f1Tap;INPUT.f1Tap=false;me.ult=INPUT.ultTap;INPUT.ultTap=false;me.fk=INPUT.fk;me.f2=INPUT.f2;me.sk=INPUT.sk;me.sk2=INPUT.sk2;me.cf=INPUT.cf;INPUT.cf=false;}
    }else guestLocalAttackCosmetics();
    try{update(dt);updateCamera(dt,false);}
    catch(e){console.error('update:',e);}
  }
  try{render();}catch(e){console.error('render:',e);}
  requestAnimationFrame(loop);
}

// ============================== menu wiring ==============================
function $(id){return document.getElementById(id);}
var menuMode='solo';
var selCls='mgr';
function refreshMenuUI(){
  var cards=['bmgr','bdev','bmkt','dsn'];
  for(var i=0;i<cards.length;i++){
    var el=document.getElementById(cards[i]);
    if(el)el.classList.toggle('sel',cards[i]==='b'+selCls);
  }
  $('mSolo').classList.toggle('on',menuMode==='solo');
  $('mCoop').classList.toggle('on',menuMode==='coop');
  $('mStart').textContent=menuMode==='solo'?'НАЧАТЬ СМЕНУ':'В КОМНАТУ →';
}
function selectClass(cls){
  selCls=cls;
  NET.cls=cls;
  refreshMenuUI();
}
var _cards=[['bmgr','mgr'],['bdev','dev'],['bmkt','mkt'],['bdsn','dsn']];
for(var _ci=0;_ci<_cards.length;_ci++)(function(cid,cls){
  document.getElementById(cid).addEventListener('click',function(){selectClass(cls);});
})(_cards[_ci][0],_cards[_ci][1]);
$('mSolo').addEventListener('click',function(){menuMode='solo';refreshMenuUI();});
$('mCoop').addEventListener('click',function(){menuMode='coop';refreshMenuUI();});
$('mStart').addEventListener('click',function(){
  audioInit();
  if(menuMode==='solo')startLocal();
  else showOv('bcoop');
});
$('mSettings').addEventListener('click',function(){showOv('bset');});
$('bsetBack').addEventListener('click',function(){showOv('bmenu');});
refreshMenuUI();
renderClassPreviews();
$('cHost').addEventListener('click',function(){
  showOv('bhost');
  $('roomCode').textContent='…';
  hostCreate(function(err){
    if(err){$('roomCode').textContent='ошибка: '+err;return;}
    audioInit();startAmbient();
  });
});
$('cJoin').addEventListener('click',function(){showOv('bjoin');$('joinErr').textContent='';});
$('bjoinGo').addEventListener('click',function(){
  var code=$('joinCode').value.trim().toLowerCase();
  if(code.length!==5){$('joinErr').textContent='Код из 5 символов';return;}
  showOv('bwait');
  $('netStatus').textContent='Подключение…';
  guestJoin(code,function(err){
    if(err){
      $('netStatus').textContent='';
      showOv('bjoin');
      $('joinErr').textContent=err==='peer-unavailable'?'Комната не найдена':(err==='timeout'?'Таймаут подключения':'Ошибка: '+err);
      destroyNet();
    }else{
      audioInit();startAmbient();
      $('netStatus').textContent='Подключено. Ждём лобби…';
    }
  });
});
$('bLeaveWait').addEventListener('click',function(){
  try{if(NET.hostConn)NET.hostConn.send({t:'leave'});}catch(e){}
  destroyNet();LOBBY=[];showOv('bmenu');
});
$('bstart').addEventListener('click',function(){if(NET.mode==='host')hostStartGame();});
$('bresume').addEventListener('click',function(){togglePause();});
$('brestart').addEventListener('click',function(){
  if(NET.mode==='host')hostStartGame();
  else startLocal();
});
$('bmute').addEventListener('click',function(){
  muted=!muted;
  applyVolumes();
  $('bmute').textContent='Звук: '+(muted?'выкл':'вкл');
});
function sndUI(id,key){
  var el=$(id);if(!el)return;
  el.value=Math.round(SET[key]*100);
  var lab=$(id+'V');
  if(lab)lab.textContent=Math.round(SET[key]*100)+'%';
  el.addEventListener('input',function(){
    SET[key]=el.value/100;applyVolumes();saveVolumes();
    if(lab)lab.textContent=el.value+'%';
  });
}
sndUI('sndMaster','master');sndUI('sndMusic','music');sndUI('sndSfx','sfx');
$('bleave').addEventListener('click',function(){
  try{if(NET.hostConn)NET.hostConn.send({t:'leave'});}catch(e){}
  try{broadcast({t:'stt',s:'dead'});}catch(e){}
  destroyNet();LOBBY=[];G.state='menu';VIEW.players=[];VIEW.mobs=[];VIEW.boss=null;
  showOv('bmenu');
});
$('bagain').addEventListener('click',function(){
  if(NET.mode==='host')hostStartGame();
  else if(NET.mode==='solo')startLocal();
});
$('bmenu2').addEventListener('click',function(){
  destroyNet();LOBBY=[];G.state='menu';VIEW.players=[];VIEW.mobs=[];VIEW.boss=null;
  showOv('bmenu');
});
$('bcontinue').addEventListener('click',function(){
  if(NET.mode==='guest')return;
  G.state='playing';showOv(null);G.fadeT=0.9;
});
window.addEventListener('blur',function(){
  INPUT.f1=false;INPUT.f2=false;INPUT.sk=false;
  keys={};
});

// ============================== init ==============================
function resize(){
  var r=root.getBoundingClientRect();
  DPR=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.max(320,Math.round(r.width*DPR));
  cv.height=Math.max(240,Math.round(r.height*DPR));
  ctx.imageSmoothingEnabled=true;
  bhud.width=Math.max(320,Math.round(r.width*DPR));
  bhud.height=Math.max(240,Math.round(r.height*DPR));
  G.zoom=clamp(r.width/900,0.55,1.15);
  drawPost.vg=null;
}
window.addEventListener('resize',resize);
if(window.ResizeObserver){new ResizeObserver(resize).observe(root);}
makeGrain();
buildMap(20261020);
for(var mi=0;mi<GW*GH;mi++)FOG.explored[mi]=1; // фон меню: офис виден до старта
resize();
window.__bo={G:G,NET:NET,VIEW:VIEW,INPUT:INPUT,startLocal:startLocal,hostStartGame:hostStartGame,buildMap:buildMap,
  spawns:function(){return SPAWNS;},rooms:function(){return ROOMS;},blockedAt:blockedAt,
  furn:function(){return FURN;},obst:function(){return OBST;},coffees:function(){return COFFEES;},damageFurn:damageFurn,damageMob:damageMob,
  debris:function(){return DEBRIS;},water:function(){return WATER;},pfx:function(){return PFX;},spawnStone:spawnStone,spawnWater:spawnWater,
  connCheck:function(){return unreachableRooms().length;},
  connDetail:function(){
    var bad=unreachableRooms();
    var out={badRooms:[],gridDump:[]};
    for(var i=0;i<bad.length;i++)
      out.badRooms.push({i:ROOMS.indexOf(bad[i]),t:bad[i].type,cx:bad[i].tx+((bad[i].tw/2)|0),cy:bad[i].ty+((bad[i].th/2)|0)});
    if(out.badRooms.length){
      var lb=lobbyRoom();
      var seen=floodFrom.apply(null,roomCenter(lb));
      var b0=out.badRooms[0];
      for(var yy=Math.max(0,b0.cy-3);yy<=Math.min(GH-1,b0.cy+3);yy++){
        var row='';
        for(var xx=Math.max(0,b0.cx-5);xx<=Math.min(GW-1,b0.cx+5);xx++)
          row+=grid[yy][xx]?(seen[xx+','+yy]?'o':'x'):'#';
        out.gridDump.push(row);
      }
    }
    return out;
  },
  spawns:function(){return SPAWNS;},rooms:function(){return ROOMS;},blockedAt:blockedAt,
  furn:function(){return FURN;},obst:function(){return OBST;},coffees:function(){return COFFEES;},damageFurn:damageFurn,damageMob:damageMob,
  debris:function(){return DEBRIS;},water:function(){return WATER;},pfx:function(){return PFX;},spawnStone:spawnStone,spawnWater:spawnWater,
  step:function(n){
    for(var i=0;i<(n||1);i++){
      if(NET.mode!=='guest'){
        var me=localPlayer();
        if(me){me.ix=INPUT.ix;me.iy=INPUT.iy;me.aim=INPUT.aim;me.f1=INPUT.f1||INPUT.f1Tap;INPUT.f1Tap=false;me.ult=INPUT.ultTap;INPUT.ultTap=false;me.fk=INPUT.fk;me.f2=INPUT.f2;me.sk=INPUT.sk;me.sk2=INPUT.sk2;me.cf=INPUT.cf;INPUT.cf=false;}
      }
      update(1/60);
    }
  }};
requestAnimationFrame(loop);
