'use strict';
// ============================== overlays ==============================
var OVERLAYS=['bmenu','bset','bcoop','bjoin','bhost','bwait','bpause','bdead','bwin'];
function showOv(id){
  for(var i=0;i<OVERLAYS.length;i++){var el=document.getElementById(OVERLAYS[i]);if(el)el.classList.add('bghidden');}
  if(id)document.getElementById(id).classList.remove('bghidden');
}
function showDeadStats(st){
  var meL=localPlayer();
  st=st||{sprint:Math.max(0,G.wave-1),okr:G.okr,ki:G.killsI,kd:G.killsD,gr:G.grade,co:(meL?meL.coins:0)||0};
  document.getElementById('dSprint').textContent=st.sprint;
  document.getElementById('dOkr').textContent=st.okr;
  document.getElementById('dCoins').textContent=st.co||0;
  document.getElementById('dIntern').textContent=st.ki;
  document.getElementById('dDeadline').textContent=st.kd;
  document.getElementById('dGrade').textContent=st.gr;
  // leaderboard: score = OKR*10 + плашки*5
  var board=document.getElementById('dBoard');
  var players=worldPool('players');
  if(players.length>1){
    var rows=players.map(function(p,i){
      return{name:(CLS[p.cls]?CLS[p.cls].name:p.cls),co:p.coins||0,okr:G.okr,me:p.id===NET.myId,pi:i};
    }).map(function(r){r.score=r.okr*10+r.co*5;return r;})
      .sort(function(a,b){return b.score-a.score;});
    var html='<div style="text-align:center;color:#8b949e;font-size:11px;margin-bottom:4px">ЛИДЕРБОРД</div>';
    for(var i2=0;i2<rows.length;i2++){var r2=rows[i2];
      html+='<div class="row'+(r2.me?' me':'')+'"><span>'+(i2+1)+'. '+r2.name+(r2.me?' (вы)':'')+'</span><span><b>'+r2.score+'</b> · '+r2.co+' плашек</span></div>';
    }
    board.innerHTML=html;
    board.classList.remove('hidden');
  }else board.classList.add('hidden');
  var again=document.getElementById('bagain');
  if(NET.mode==='guest')again.classList.add('hidden');
  else again.classList.remove('hidden');
  document.getElementById('dHr').textContent=HRPHRASES[(Math.random()*HRPHRASES.length)|0];
  showOv('bdead');
}
function togglePause(){
  if(G.state==='playing'){
    G.state='paused';showOv('bpause');
    if(NET.mode==='host')broadcast({t:'stt',s:'paused'});
  }else if(G.state==='paused'){
    G.state='playing';showOv(null);
    if(NET.mode==='host')broadcast({t:'stt',s:'playing'});
  }else if(NET.mode==='guest'){
    if(!document.getElementById('bpause').classList.contains('bghidden'))showOv(null);
    else showOv('bpause');
  }
}
