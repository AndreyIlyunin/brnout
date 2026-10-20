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
  G.state='playing';showOv(null);
  updateCamera(0.016,true);
}
function hostStartGame(){
  LOBBY=LOBBY.slice(0,4);
  var seed=(R()*1e9)|0;
  buildMap(seed);
  initPlayersFromLobby();
  resetWorld();
  NET.mode='host';NET.myId='me';NET.started=true;
  G.state='playing';showOv(null);
  updateCamera(0.016,true);
  broadcast({t:'start',seed:seed});
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
  NET.mode='guest';NET.myId=NET.peer.id;NET.started=true;
  G.state='playing';showOv(null);
  updateCamera(0.016,true);
}

// ============================== networking ==============================
var BROKER=null;
try{var _qp=new URL(location.href).searchParams.get('broker');if(_qp)BROKER=_qp;}catch(e){}
function peerOpts(){
  if(!BROKER)return {debug:0};
  var h=BROKER.split(':');
  return {host:h[0],port:parseInt(h[1]||'9000',10),path:'/peerserver',secure:false};
}
function lobbyRender(){
  var el;
  if(NET.mode==='host')el=document.getElementById('lobbyList');
  else el=document.getElementById('lobbyList2');
  var html='';
  for(var i=0;i<LOBBY.length;i++){
    html+='<div><span style="color:'+PCOLORS[i]+'">●</span> '+(CLS[LOBBY[i].cls]?CLS[LOBBY[i].cls].name:LOBBY[i].cls)+(LOBBY[i].id==='me'?' (вы — хост)':'')+'</div>';
  }
  el.innerHTML=html;
  document.getElementById('bstart').textContent='Начать спринт ('+LOBBY.length+'/4)';
}
function hostCreate(cb,tries){
  tries=tries||0;
  var code=genCode();
  var p=new Peer('bo-'+code,peerOpts());
  NET.peer=p;
  p.on('open',function(){
    NET.code=code;NET.mode='host';
    document.getElementById('roomCode').textContent=code;
    LOBBY=[{id:'me',cls:NET.cls}];
    lobbyRender();
    cb(null,code);
  });
  p.on('error',function(err){
    if(err.type==='unavailable-id'&&tries<5){p.destroy();hostCreate(cb,tries+1);}
    else if(!NET.code){cb(err.type||'error');}
  });
  p.on('connection',function(c){
    if(LOBBY.length>=4){c.on('open',function(){c.send({t:'full'});setTimeout(function(){c.close();},500);});return;}
    c.on('data',function(d){hostOnMsg(c,d);});
    c.on('open',function(){
      // PeerJS may re-offer and open a second channel for the same peer: keep the first
      for(var i=0;i<NET.conns.length;i++){var ex=NET.conns[i];if(ex!==c&&ex.peer===c.peer){try{c.close();}catch(e){}return;}}
      NET.conns.push(c);
    });
    c.on('close',function(){hostDropConn(c);});
  });
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
    pl.ix=d.x;pl.iy=d.y;pl.aim=d.a;pl.f1=!!d.f1;pl.f2=!!d.f2;pl.sk=!!d.sk;pl.sk2=!!d.s2;pl.cf=!!d.cf;
  }
  if(d.t==='coin'){
    var pc=null;
    for(i=0;i<G.players.length;i++)if(G.players[i].id===c.peer)pc=G.players[i];
    if(pc)pc.coins=(pc.coins||0)+1;
  }
  if(d.t==='leave'){hostDropConn(c);try{c.close();}catch(e){}}
}
function hostDropConn(c){
  var i;
  for(i=NET.conns.length-1;i>=0;i--)if(NET.conns[i]===c)NET.conns.splice(i,1);
  for(i=LOBBY.length-1;i>=0;i--)if(LOBBY[i].id===c.peer)LOBBY.splice(i,1);
  for(i=G.players.length-1;i>=0;i--)if(G.players[i].id===c.peer)G.players.splice(i,1);
  lobbyRender();
}
function guestJoin(code,cb){
  var p=new Peer(peerOpts());
  NET.peer=p;
  var done=false,opened=false;
  p.on('open',function(){
    if(opened)return; opened=true;
    var c=p.connect('bo-'+code,{reliable:true});
    NET.hostConn=c;
    c.on('open',function(){
      done=true;
      c.send({t:'hi',cls:NET.cls});
      cb(null,'connected');
    });
    c.on('data',function(d){guestOnMsg(d);});
    c.on('close',function(){
      if(done)netLost('Хост отключился');
      else cb('peer-unavailable');
    });
    setTimeout(function(){if(!done&&!c.open)cb('timeout');},8000);
  });
  p.on('error',function(err){
    if(!done)cb(err.type||'error');
  });
}
function guestOnMsg(d){
  if(!d)return;
  if(d.t==='full'){netLost('Комната заполнена');return;}
  if(d.t==='lobby'){
    LOBBY=d.list.map(function(l,i){return{id:l.me?NET.peer.id:'p'+i,cls:l.cls};});
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
    html+='<div><span style="color:'+PCOLORS[i]+'">●</span> '+(CLS[LOBBY[i].cls]?CLS[LOBBY[i].cls].name:LOBBY[i].cls)+(LOBBY[i].id===NET.peer.id?' (вы)':'')+'</div>';
  }
  el.innerHTML=html;
}
function netLost(reason){
  if(G.state==='playing'||G.state==='paused')G.state='menu';
  destroyNet();
  document.getElementById('netStatus').textContent=reason||'Соединение потеряно';
  showOv('bwait');
}
function destroyNet(){
  try{if(NET.peer)NET.peer.destroy();}catch(e){}
  NET.peer=null;NET.conns=[];NET.hostConn=null;NET.started=false;NET.code='';
  NET.mode='solo';NET.myId='me';
}
