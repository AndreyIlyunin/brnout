'use strict';
// ============================== game start ==============================
function initPlayersFromLobby(){
  G.players=[];
  for(var i=0;i<LOBBY.length;i++){
    var p=newPlayer(LOBBY[i].id,LOBBY[i].cls);
    p.look=classLook(LOBBY[i].cls,i);
    G.players.push(p);
  }
}
function startLocal(){
  LOBBY=[{id:'me',cls:NET.cls}];
  var seed=(R()*1e9)|0;
  buildMap(seed);
  initPlayersFromLobby();
  resetWorld();
  NET.mode='solo';NET.myId='me';
  G.state='playing';showOv(null);G.fadeT=0.9;
  updateCamera(0.016,true);
}
function hostStartGame(){
  LOBBY=LOBBY.slice(0,4);
  var seed=(R()*1e9)|0;
  buildMap(seed);
  initPlayersFromLobby();
  resetWorld();
  NET.mode='host';NET.myId='me';NET.started=true;
  G.state='playing';showOv(null);G.fadeT=0.9;
  updateCamera(0.016,true);
  relayBroadcast({t:'start',seed:seed});
  msg('Команда собрана. Спринт 1 начинается.');
}
function resetWorld(){
  G.mobs.length=0;G.projs.length=0;G.fx.length=0;G.texts.length=0;G.pickups.length=0;G.zones.length=0;
  G.boss=null;G.wave=0;G.waveState='calm';G.waveT=2;G.spawnQ.length=0;
  G.okr=0;G.grade=1;G.killsI=0;G.killsD=0;G.bossN=0;G.winShown=false;G.winT=0;
  G.shake=0;G.hitStop=0;G.msg='';G.msgT=0;G.capT=10;G.caption='';
  NET.events=[];
}
function guestStart(seed){
  buildMap(seed);
  VIEW.players=[];VIEW.mobs=[];VIEW.projs=[];VIEW.boss=null;
  G.fx.length=0;G.texts.length=0;
  resetWorld();
  NET.mode='guest';NET.myId=guestPid;NET.started=true;
  G.state='playing';showOv(null);G.fadeT=0.9;
  updateCamera(0.016,true);
}

// ============================== релей-транспорт (mini-MQTT) ==============================
// WebRTC P2P из РФ не проходит (STUN/TURN заблокированы), поэтому кооп идёт
// через публичный MQTT-брокер: он же сигналинг, он же релей — NAT перестаёт иметь значение.
// Топики: RELAY_PRE+code/h — хост→гости, RELAY_PRE+code/g — гости→хост.
var RELAY_PRE='brnt4/';
var relay=null,guestPid=null;
var hostHbIv=null,hostSweepIv=null,hostSnapIv=null,guestHbIv=null,guestInIv=null,guestWatchIv=null;
function relayH(code){return RELAY_PRE+code+'/h';}
function relayG(code){return RELAY_PRE+code+'/g';}
function relayKill(){
  if(hostHbIv){clearInterval(hostHbIv);hostHbIv=null;}
  if(hostSweepIv){clearInterval(hostSweepIv);hostSweepIv=null;}
  if(hostSnapIv){clearInterval(hostSnapIv);hostSnapIv=null;}
  if(guestHbIv){clearInterval(guestHbIv);guestHbIv=null;}
  if(guestInIv){clearInterval(guestInIv);guestInIv=null;}
  if(guestWatchIv){clearInterval(guestWatchIv);guestWatchIv=null;}
  if(relay){try{relay.cli.destroy();}catch(e){}relay=null;}
}
function lobbyRender(){
  var el;
  if(NET.mode==='host')el=document.getElementById('lobbyList');
  else el=document.getElementById('lobbyList2');
  var html='';
  for(var i=0;i<LOBBY.length;i++){
    html+='<div><span style="color:'+PCOLORS[i]+'">●</span> '+(CLS[LOBBY[i].cls]?CLS[LOBBY[i].cls].name:'???')+(LOBBY[i].id==='me'?' (вы — хост)':'')+'</div>';
  }
  el.innerHTML=html; /*safe: строки только из CLS/PCOLORS*/
  document.getElementById('bstart').textContent='Начать спринт ('+LOBBY.length+'/4)';
}
// широковещательно хосту→всем (без адресации): снапшоты и статусные сообщения
function relayBroadcast(d){
  if(relay&&NET.mode==='host')relay.publish(relayH(NET.code),JSON.stringify({d:d}));
}
function hostCreate(cb){
  var code=genCode();
  var brokerName='…';
  var cli=mqttClient({
    clientId:'brnt-h-'+code+'-'+((R()*1e9)|0).toString(36),
    sub:relayG(code),
    onReady:function(name){
      brokerName=name;
      relay={cli:cli,publish:function(topic,str){cli.publish(topic,str);}};
      NET.code=code;NET.mode='host';
      NET.peer={destroy:function(){relayKill();}};
      document.getElementById('roomCode').textContent=code;
      LOBBY=[{id:'me',cls:NET.cls}];
      lobbyRender();
      // пульс комнаты: гости в лобби понимают, что хост жив
      hostHbIv=setInterval(function(){relayBroadcast({t:'hb',n:LOBBY.length,st:NET.started});},2000);
      // гости молчат дольше 9с (вышел, метро, экран погас) — убираем из комнаты
      hostSweepIv=setInterval(hostSweep,3000);
      // снапшоты по таймеру, а не в rAF: фон вкладки хоста не должен замораживать гостей
      hostSnapIv=setInterval(function(){if(NET.mode==='host'&&NET.started&&G.state==='playing')sendSnapshot();},125);
      cb(null,code);
    },
    onMsg:function(topic,str){
      var o=null;try{o=JSON.parse(str);}catch(e){return;}
      if(o&&o.pid&&o.d)hostOnRelay(o.pid,o.d);
    },
    onDown:function(reason){
      if(relay){netLost('Связь с комнатой потеряна ('+brokerName+')');}
      else cb(reason==='nobroker'?'nobroker':'broker-down');
    }
  });
}
function hostOnRelay(pid,d){
  var c=null,i;
  for(i=0;i<NET.conns.length;i++)if(NET.conns[i].peer===pid)c=NET.conns[i];
  if(d.t==='bye'){if(c)hostDropConn(c);return;}
  if(!c){
    if(LOBBY.length>=4)return; // полная комната: даже коннект-фасад не создаём
    c={peer:pid,open:true,last:performance.now(),
       send:function(m){if(relay)relay.publish(relayH(NET.code),JSON.stringify({to:pid,d:m}));},
       close:function(){}};
    NET.conns.push(c);
  }
  c.last=performance.now();
  hostOnMsg(c,d);
}
function hostSweep(){
  var now=performance.now();
  for(var i=NET.conns.length-1;i>=0;i--)
    if(now-NET.conns[i].last>13000)hostDropConn(NET.conns[i]);
}
function hostOnMsg(c,d){
  if(!d)return;
  var i;
  if(d.t==='hi'){
    for(i=0;i<LOBBY.length;i++)if(LOBBY[i].id===c.peer)LOBBY.splice(i,1);
    if(LOBBY.length>=4){c.send({t:'full'});return;}
    var ncls=CLS[d.cls]?d.cls:'mgr';
    LOBBY.push({id:c.peer,cls:ncls});
    lobbyRender();
    c.send({t:'lobby',list:LOBBY.map(function(l){return{cls:l.cls,me:l.id===c.peer};}),started:NET.started});
    if(NET.started){
      var np=newPlayer(c.peer,ncls);
      np.look=classLook(ncls,G.players.length);
      G.players.push(np);
      floatText(np.x,np.y-40,'новый сотрудник в чате','#8bd17c',13);
      c.send({t:'start',seed:MAPSEED});
    }
  }
  if(d.t==='in'){
    var pl=null;
    for(i=0;i<G.players.length;i++)if(G.players[i].id===c.peer)pl=G.players[i];
    if(!pl)return;
    pl.ix=d.x;pl.iy=d.y;pl.aim=d.a;pl.f1=!!d.f1;pl.f2=!!d.f2;pl.sk=!!d.sk;pl.sk2=!!d.s2;pl.fk=!!d.fk;pl.cf=!!d.cf;
    if(d.u)pl.ult=true; // ульта по тапу R
  }
  if(d.t==='coin'){
    var pc=null;
    for(i=0;i<G.players.length;i++)if(G.players[i].id===c.peer)pc=G.players[i];
    if(pc)pc.coins=(pc.coins||0)+1;
  }
  if(d.t==='leave'){hostDropConn(c);}
}
function hostDropConn(c){
  var i;
  for(i=NET.conns.length-1;i>=0;i--)if(NET.conns[i]===c)NET.conns.splice(i,1);
  for(i=LOBBY.length-1;i>=0;i--)if(LOBBY[i].id===c.peer)LOBBY.splice(i,1);
  for(i=G.players.length-1;i>=0;i--)if(G.players[i].id===c.peer)G.players.splice(i,1);
  lobbyRender();
}
function guestJoin(code,cb){
  var done=false;
  guestPid='p'+((R()*1e9)|0).toString(36);
  var cli=mqttClient({
    clientId:'brnt-g-'+code+'-'+guestPid.slice(1),
    sub:relayH(code),
    onReady:function(){
      relay={cli:cli,publish:function(topic,str){cli.publish(topic,str);}};
      NET.peer={destroy:function(){relayKill();}};
      NET.hostConn={open:true,
        send:function(m){if(relay)relay.publish(relayG(code),JSON.stringify({pid:guestPid,d:m}));},
        close:function(){}};
      NET.lastRecv=performance.now();
      NET.hostConn.send({t:'hi',cls:NET.cls});
      // первые hi бывают теряются (подписка хоста ещё не раскварцована на кластере) — повторяем, пока не придёт лобби
      setTimeout(function(){if(!NET.started&&!LOBBY.length&&NET.hostConn)NET.hostConn.send({t:'hi',cls:NET.cls});},1500);
      setTimeout(function(){if(!NET.started&&!LOBBY.length&&NET.hostConn)NET.hostConn.send({t:'hi',cls:NET.cls});},3500);
      // инпут гостя — по таймеру, а не в rAF: сетевой такт не зависит от видимости вкладки
      guestInIv=setInterval(function(){
        if(!NET.hostConn||NET.mode!=='guest')return;
        NET.hostConn.send({t:'in',x:Math.round(INPUT.ix*100)/100,y:Math.round(INPUT.iy*100)/100,
          a:Math.round(INPUT.aim*100)/100,f1:(INPUT.f1||INPUT.f1Tap)?1:0,f2:INPUT.f2?1:0,sk:INPUT.sk?1:0,s2:INPUT.sk2?1:0,fk:INPUT.fk?1:0,cf:INPUT.cf?1:0,u:(INPUT.ultTap?1:0)});
        INPUT.f1Tap=false;INPUT.ultTap=false;
      },100);
      // в лобби (не в игре) гость подаёт голос каждые 2с, чтобы хост его не вымел
      guestHbIv=setInterval(function(){if(NET.hostConn)NET.hostConn.send({t:'hb'});},2000);
      // хост жив, пока идут его пульс/снапшоты/лобби: тишина 8с = потеря
      guestWatchIv=setInterval(function(){
        if(performance.now()-NET.lastRecv>8000)netLost('Хост не отвечает — проверьте код комнаты');
      },2000);
      done=true;
      cb(null,'connected');
    },
    onMsg:function(topic,str){
      var o=null;try{o=JSON.parse(str);}catch(e){return;}
      if(!o)return;
      if(o.to&&o.to!==guestPid)return; // адресовано не нам
      NET.lastRecv=performance.now();
      if(o.d)guestOnMsg(o.d);
    },
    onDown:function(reason){
      if(done)netLost(reason==='nobroker'?'Брокеры недоступны':'Связь с комнатой потеряна');
      else cb(reason==='nobroker'?'nobroker':'broker-down');
    }
  });
}
function guestOnMsg(d){
  if(!d)return;
  if(d.t==='full'){netLost('Комната заполнена');return;}
  if(d.t==='map'){
    buildMap(d.seed);
    VIEW.mobs.length=0;VIEW.projs.length=0;VIEW.pickups.length=0;VIEW.zones.length=0;
    G.fx.length=0;G.texts.length=0;
    DEBRIS.length=0;WATER.length=0;PFX.length=0;STONES.length=0;
    G.waveState='calm';G.interT=0;G.fadeT=0.9;
  }
  if(d.t==='inter'){
    G.waveState='cleared';G.interT=d.d;G.nextTheme=d.th;G.interStats=d.st;
  }
  if(d.t==='lobby'){
    LOBBY=d.list.map(function(l,i){return{id:l.me?guestPid:'p'+i,cls:l.cls};});
    document.getElementById('netStatus').textContent='В лобби. Ждём хоста…';
    lobbyRenderGuest();
  }
  if(d.t==='start'){guestStart(d.seed||1);}
  if(d.t==='st'){NET.started=true;guestApplySnapshot(d);}
  if(d.t==='stt'){
    if(d.s==='paused')VIEW.paused=true;
    if(d.s==='playing'&&G.state==='paused'){G.state='playing';showOv(null);VIEW.paused=false;}
  }
  if(d.t==='over')showDeadStats(d.stats);
}
function lobbyRenderGuest(){
  var el=document.getElementById('lobbyList2');
  var html='';
  for(var i=0;i<LOBBY.length;i++){
    html+='<div><span style="color:'+PCOLORS[i]+'">●</span> '+(CLS[LOBBY[i].cls]?CLS[LOBBY[i].cls].name:'???')+(LOBBY[i].id===guestPid?' (вы)':'')+'</div>';
  }
  el.innerHTML=html; /*safe: строки только из CLS/PCOLORS*/
}
function netLost(reason){
  if(G.state==='playing'||G.state==='paused')G.state='menu';
  destroyNet();
  document.getElementById('netStatus').textContent=reason||'Соединение потеряно';
  showOv('bwait');
}
function destroyNet(){
  relayKill();
  NET.peer=null;NET.conns=[];NET.hostConn=null;NET.started=false;NET.code='';
  NET.mode='solo';NET.myId='me';guestPid=null;
}
// ============================== инвайт-ссылка ==============================
function inviteLink(){
  return location.origin+location.pathname+'?join='+(NET.code||'');
}
function shareInvite(btn){
  if(!NET.code||!btn)return;
  var url=inviteLink();
  function ok(){btn.textContent='Ссылка скопирована ✓';setTimeout(function(){btn.textContent='Поделиться ссылкой';},2200);}
  if(navigator.share){
    navigator.share({title:'brnout: corporate hell',text:'Заходи в комнату '+NET.code,url:url}).then(ok,ok);
    return;
  }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(ok,function(){fallbackCopy(url);ok();});
    return;
  }
  fallbackCopy(url);ok();
}
function fallbackCopy(url){
  var i=document.createElement('input');
  i.value=url;i.style.position='fixed';i.style.opacity='0';
  document.body.appendChild(i);i.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(i);
}
