'use strict';
// ============================== state ==============================
var CLS={
  mgr:{name:'менеджер',weapon:'tickets',
    s1:{n:'тикет',cd:0.36,cost:0},s2:{n:'жир панч',cd:0.55,cost:6},
    ult:{n:'созвон',cd:8,cost:35},sk:{n:'АСАП',cd:10,cost:25}},
  dev:{name:'сеньор-прогер',weapon:'keyboard',
    s1:{n:'клава',cd:0.42,cost:0},s2:{n:'хоткей',cd:0.85,cost:10},
    ult:{n:'звук клавы',cd:7,cost:30},sk:{n:'легаси-код',cd:9,cost:25}},
  mkt:{name:'маркетолог',weapon:'plane',
    s1:{n:'бренд-самолёт',cd:0.3,cost:0},s2:{n:'воронка',cd:0.9,cost:8},
    ult:{n:'ребрендинг',cd:12,cost:35},sk:{n:'таргетинг',cd:9,cost:20}},
  dsn:{name:'дизайнер',weapon:'stylus',
    s1:{n:'стилус',cd:0.28,cost:0},s2:{n:'критика',cd:1.0,cost:8},
    ult:{n:'мудборд',cd:10,cost:35},sk:{n:'пиксель-перфект',cd:6,cost:15}}
};
var NET={mode:'solo',peer:null,conns:[],hostConn:null,code:'',myId:'me',snapT:0,events:[],cls:'mgr',lastSent:0,started:false};
var PCOLORS=['#e6edf3','#d29922','#7aa2c8','#3fb950'];
var G={state:'menu',t:0,players:[],mobs:[],projs:[],fx:[],texts:[],pickups:[],zones:[],
  boss:null,wave:0,waveState:'calm',waveT:1.5,rushT:0,spawnQ:[],spawnT:0,okr:0,grade:1,
  killsI:0,killsD:0,bossN:0,winShown:false,winT:0,shake:0,hitStop:0,msg:'',msgT:0,caption:'',capT:8,
  combo:0,comboT:0,
  camX:0,camY:0,zoom:1,mobSeq:0,pkSeq:0};
var COMBONAMES=['','синергия!','пролистал инбокс!','закрыл спринт!','переработал!','тимлид года!','выгорел красиво!','легенда офиса!','машина задач!','БОГ ВЫГОРАНИЯ!'];
var KILLQUOTES=['отчислен','нашёл работу получше','ушёл на обед','передумал гореть','сбегал в Дубай','отпуск за свой счёт','это не его роль'];
var SPRINTNAMES=['обычный спринт','спринт горящих дедлайнов','квартальный отчёт','пятничный деплой','аудит недели','хакатон ночами','планёрка без конца'];
var HRPHRASES=['HR передаёт: «мы ценим каждого». Кроме вас.','Ваш грейд перенесён в архив. Вместе с вами.','Соболезнуем. Письмо о закрытии задач уже отправлено.','На вашем месте уже видят другого. Он моложе.'];
var LOBBY=[];
function localPlayer(){
  var pool=(NET.mode==='guest')?VIEW.players:G.players;
  for(var i=0;i<pool.length;i++)if(pool[i].id===NET.myId)return pool[i];
  return pool[0];
}
// looks presets — hooks for future customization (skin/hair/outfit per seat)
var LOOKS=[
 {skin:'#e8c39e',hair:'#3a2a1a',hs:0,shirt:'#2c3e57',accent:'#8b2020'},
 {skin:'#d9b48f',hair:'#1e1a16',hs:1,shirt:'#2f3136',accent:'#5a616e'},
 {skin:'#f0d0b0',hair:'#7a4a20',hs:2,shirt:'#3d2f4f',accent:'#8a6d3b'},
 {skin:'#c99a75',hair:'#101010',hs:3,shirt:'#314a3c',accent:'#9ab4a0'},
 {skin:'#e8c39e',hair:'#c9c9c9',hs:2,shirt:'#5a2a2a',accent:'#d29922'},
 {skin:'#d9b48f',hair:'#5a3a1a',hs:1,shirt:'#2a3a4a',accent:'#7aa2c8'},
 {skin:'#f0d0b0',hair:'#2a2a2a',hs:0,shirt:'#43352a',accent:'#8bd17c'},
 {skin:'#c99a75',hair:'#8a2a2a',hs:2,shirt:'#333a45',accent:'#e07050'}
];
var HOODIES=[ // intern variants
 {skin:'#e8c39e',hair:'#3a2a1a',hs:1,shirt:'#4a4130',accent:'#6b5a3a'},
 {skin:'#d9b48f',hair:'#20180f',hs:1,shirt:'#39424a',accent:'#54606a'},
 {skin:'#f0d0b0',hair:'#6a3a1a',hs:0,shirt:'#4a3a44',accent:'#6a4a5a'},
 {skin:'#c99a75',hair:'#111111',hs:2,shirt:'#3a4a3a',accent:'#4a6a4a'}
];
// signature class skins — каждый класс узнаваем; место в лобби варьирует тон кожи
var SKINS=['#e8c39e','#d9b48f','#f0d0b0','#c99a75'];
var CLSLOOKS={
 mgr:{hair:'#3a2a1a',hs:0,shirt:'#2c3e57',accent:'#8b2020'},            // костюм + галстук
 dev:{hair:'#1e1a16',hs:1,shirt:'#2f3136',accent:'#5a616e'},            // тёмное худи с капюшоном
 mkt:{hair:'#6a3a1a',hs:2,shirt:'#5a3a6a',accent:'#c8a2e0'},            // пиджак + шарф
 dsn:{hair:'#6e3a52',hs:2,shirt:'#9c6b8e',accent:'#5fd0c0'}             // зумер-модница: сдержанная слива + бирюза
};
function classLook(cls,seat){
  var L={};
  for(var k in CLSLOOKS[cls]||CLSLOOKS.mgr)L[k]=CLSLOOKS[cls][k];
  L.skin=SKINS[(seat||0)%SKINS.length];
  return L;
}
function newPlayer(id,cls){
  var lb=lobbySpawn();
  return{id:id,cls:cls,x:lb.x+lb.w/2+(R()*120-60),y:lb.y+lb.h/2+(R()*120-60),r:18,spd:210,spdMult:1,dmgMult:1,
    burnout:0,coffee:60,coffeeMax:100,face:0,coins:0,
    cd1:0,cd2:0,cdQ:0,cdS:0,shield:0,qT:0,qPulse:0,haste:0,castT:0,inv:0,flash:0,heart:0,kx:0,ky:0,step:0,atkT:0,
    dead:false,respT:0,
    ix:0,iy:0,aim:0,f1:false,f2:false,sk:false,sk2:false,cf:false,
    look:LOOKS[0],moving:false};
}

// ---------- имена мобов ----------
var MOBNAMES={
  intern:['стажёр-ибшник','стажёр-фронтендер','стажёр-QA','стажёр-аналитик'],
  deadline:['дедлайн: релиз','дедлайн: демо','дедлайн: аудит']
};
function mobName(m){
  if(m.type==='boss')return'РЕГЛЯТОРКА / АУДИТ';
  var list=MOBNAMES[m.type]||MOBNAMES.intern;
  return list[(m.tint||0)%list.length];
}

// ---------- музыкальные данные (движок в music.js) ----------
// новая гармония: 8 тактов Am Em F Dm | Am G F E (андalusийский спуск — мрак)
var PROG=[
  [45,[52,57,60,64]],[40,[52,55,59,64]],[41,[53,57,60,65]],[38,[50,57,62,65]],
  [45,[52,57,60,64]],[43,[50,55,59,62]],[41,[53,57,60,65]],[40,[52,56,59,64]]
];
// мелодия: ниже, протяжнее, нисходящие линии
var MEL=[
  [0,0,76,4],[0,6,74,2],[0,8,72,5],[0,15,71,1],
  [1,0,71,3],[1,4,67,2],[1,6,64,2],[1,8,67,5],
  [2,0,69,3],[2,4,72,2],[2,6,74,2],[2,8,72,5],
  [3,0,74,3],[3,4,72,2],[3,6,71,2],[3,8,69,5],
  [4,0,76,4],[4,6,74,2],[4,8,77,4],[4,14,76,1],
  [5,0,79,3],[5,4,74,2],[5,6,71,2],[5,8,67,6],
  [6,0,69,3],[6,4,72,2],[6,6,77,2],[6,8,81,4],[6,14,79,1],
  [7,0,80,2],[7,2,79,2],[7,4,76,4],[7,8,71,4],[7,12,68,3]
];
// ритм-паттерны (16 шагов)
var BPAT=[{s:0,n:0,l:3},{s:3,n:0,l:1},{s:6,n:7,l:2},{s:8,n:0,l:3},{s:10,n:0,l:1},{s:12,n:3,l:2},{s:14,n:12,l:1}];
var ARPPAT=[1,0,1,0,1,0,1,1,1,0,1,0,1,1,1,0];
var MBPM=88;
function mtof(m){return 440*Math.pow(2,(m-69)/12);}
function musicInit(){
  if(!AC||MUS.bus)return;
  MUS.bus=AC.createGain();MUS.bus.gain.value=0.5;MUS.bus.connect(master);
  var d=AC.createDelay(1.0);d.delayTime.value=0.29;
  var fb=AC.createGain();fb.gain.value=0.42;
  var df=AC.createBiquadFilter();df.type='lowpass';df.frequency.value=1800;
  d.connect(df);df.connect(fb);fb.connect(d);
  var dg=AC.createGain();dg.gain.value=0.5;
  d.connect(dg);dg.connect(MUS.bus);
  MUS.dly=d;
}
function startMusic(){
  if(!AC)return;
  musicInit();
  if(MUS.on)return;
  MUS.on=true;MUS.next=AC.currentTime+0.1;MUS.step=0;MUS.chord=0;
  MUS.timer=setInterval(musicTick,50);
}
function stopMusic(){
  MUS.on=false;
  if(MUS.timer){clearInterval(MUS.timer);MUS.timer=null;}
}
