'use strict';
// ============================== waves & combat ==============================
function msg(t,d){G.msg=t;G.msgT=d||3;NET.events.push({k:'msg',t:t,d:d||3});}
function floatText(x,y,text,color,size){if(G.texts.length>40)G.texts.shift();G.texts.push({x:x,y:y,text:text,color:color||'#dfe6ee',size:size||13,t:0,life:1.1,vy:-34});NET.events.push({k:'txt',x:Math.round(x),y:Math.round(y),t:text,c:color||'#dfe6ee',s:size||13});}
function startWave(){
  G.wave++;
  var w=G.wave;
  G.spawnQ.length=0;
  var sprintName=SPRINTNAMES[(R()*SPRINTNAMES.length)|0];
  var ni=Math.min(3+2*w,20),nd=w>=2?Math.min(1+(w-2)*2,8):0;
  var bossWave=(w===5)||(w>5&&(w-5)%5===0);
  if(bossWave){ni=Math.min(ni,5);nd=Math.min(nd,2);spawnBoss();}
  for(var i=0;i<ni;i++)G.spawnQ.push('intern');
  for(i=0;i<nd;i++)G.spawnQ.push('deadline');
  for(i=G.spawnQ.length-1;i>0;i--){var j=(R()*(i+1))|0;var tmp=G.spawnQ[i];G.spawnQ[i]=G.spawnQ[j];G.spawnQ[j]=tmp;}
  G.spawnT=0.22;
  if(bossWave)msg('СПРИНТ '+w+' · АУДИТ НАЧИНАЕТСЯ',4);
  else msg('Спринт '+w+' · '+sprintName+': '+ni+' стажёров'+(nd?', '+nd+' дедлайнов':'')+'. ДЕДЛАЙН УСКОРЯЕТСЯ!');
  G.rushT=4;
}
function spawnMob(type){
  var elite=type==='intern'&&R()<0.12;
  // спавн на ресепшене/в уборных/у кофепоинтов: вне зоны видимости, в дистанции 320-900
  var p0=null;
  if(SPAWNS.length){
    var tries=0,pick=null;
    var vw=cv.width/(DPR*G.zoom),vh=cv.height/(DPR*G.zoom);
    function bandOK(c){
      var dMin=1e9;
      for(var pi=0;pi<G.players.length;pi++){
        if(G.players[pi].dead)continue;
        var dd=Math.hypot(G.players[pi].x-c.x,G.players[pi].y-c.y);
        if(dd<dMin)dMin=dd;
      }
      return dMin>320&&dMin<900;
    }
    function offscreen(c){
      var sx=c.x-G.camX,sy=c.y-G.camY;
      return sx<-80||sx>vw+80||sy<-80||sy>vh+80;
    }
    while(tries<24&&!pick){ // сперва — за кадром
      tries++;
      var cand=SPAWNS[(R()*SPAWNS.length)|0];
      if(bandOK(cand)&&offscreen(cand))pick=cand;
    }
    tries=0;
    while(tries<20&&!pick){ // не вышло — хоть в дистанции
      tries++;
      var cand2=SPAWNS[(R()*SPAWNS.length)|0];
      if(bandOK(cand2))pick=cand2;
    }
    if(!pick)pick=SPAWNS[(R()*SPAWNS.length)|0];
    p0={x:pick.x+(R()*70-35),y:pick.y+(R()*70-35)};
    if(blockedAt(p0.x,p0.y,18))p0=freeSpotNear(pick.x,pick.y,0,200,16);
    NET.events.push({k:'spawn',x:Math.round(p0.x),y:Math.round(p0.y),tag:pick.tag});
    G.fx.push({type:'ring',x:p0.x,y:p0.y,rad:26,radMax:8,t:0,life:0.5,purple:1});
  }else{
    var anyP=G.players.length?G.players[0]:{x:MAP_W/2,y:MAP_H/2};
    var near2=nearestPlayerTo({x:MAP_W/2,y:MAP_H/2});
    p0=freeSpotNear((near2||anyP).x,(near2||anyP).y,430,900,16);
  }
  var w=G.wave;
  if(type==='intern'){
    G.mobs.push({id:++G.mobSeq,type:'intern',x:p0.x,y:p0.y,r:elite?19:15,hp:(16+2*w)*(elite?2.5:1),hpMax:(16+2*w)*(elite?2.5:1),spd:(55+R()*22+w*2)*(elite?0.92:1),elite:elite?1:0,
      stun:0,kx:0,ky:0,cd:R(),wt:0,wx:0,wy:0,face:0,aggro:false,said:false,tint:(R()*4)|0,emb:0,tilt:R()*6,step:0,fade:0.5,
      cf:0,ch:0,chTick:0,chDmg:0,chSrc:-1,mk:0});
  }else{
    G.mobs.push({id:++G.mobSeq,type:'deadline',x:p0.x,y:p0.y,r:13,hp:9+1.5*w,hpMax:9+1.5*w,spd:150+R()*30,
      stun:0,kx:0,ky:0,cd:0,face:0,tint:(R()*3)|0,emb:0,tilt:R()*6,step:0,elite:0,
      cf:0,ch:0,chTick:0,chDmg:0,chSrc:-1,mk:0});
    if(R()<0.3)floatText(p0.x,p0.y-20,['ДО РЕЛИЗА 3 ЧАСА','ПРОД ПОЛЁГ','ГОРИТ','DEMO ЧЕРЕЗ 10 МИНУТ'][(R()*4)|0],'#e07050',12);
  }
  if(elite){
    floatText(p0.x,p0.y-38,'ЭЛИТНЫЙ стажёр-«скала»','#c88a4a',12);
    SFX.grade();
  }
}
function spawnBoss(){
  var arena=bossArena();
  var p0=nearestAlivePlayer()||{x:MAP_W/2,y:MAP_H/2};
  var p=freeSpotNear(arena.x+arena.w/2,arena.y+arena.h/2,300,900,50);
  G.bossN++;
  bossStinger();
  G.boss={type:'boss',x:p.x,y:p.y,r:44,hp:1100*(1+0.4*(G.bossN-1)),hpMax:1100*(1+0.4*(G.bossN-1)),spd:40,phase:1,
    atkCd:2.5,summonCd:8,tapeCd:11,windup:0,wuT:0,tx:0,ty:0,face:0,cd:0,step:0};
}
function spendCoffee(p,n){
  if(p.coffee<n){floatText(p.x,p.y-30,'НЕ ХВАТАЕТ КОФЕ','#d29922',12);return false;}
  p.coffee-=n;return true;
}
function addBurnout(p,n){
  if(p.shield>0){floatText(p.x,p.y-30,'заблокировано созвоном','#7aa2c8',12);return;}
  if(p.inv>0)return;
  if(G.combo>2)floatText(p.x,p.y-52,'комбо сброшено','#8b949e',10);
  G.combo=0;G.comboT=0;
  p.burnout+=n;p.inv=0.4;p.flash=1;G.shake+=4;SFX.thump();
  floatText(p.x,p.y-34,'+'+Math.round(n)+' выгорания','#e5534b',14);
  if(p.burnout>=100){
    p.dead=true;p.respT=0;
    floatText(p.x,p.y-40,'сгорел(а)','#e5534b',16);
    var anyAlive=false,i;
    for(i=0;i<G.players.length;i++)if(!G.players[i].dead)anyAlive=true;
    if(!anyAlive)gameOver();
  }
}
function damageMob(m,dmg,kx,ky,stun){
  if(m.mk>0)dmg*=1.5; // «в таргете»
  dmg*=(1+0.04*(G.combo||0)); // комбо разгоняет урон
  var crit=R()<0.15;
  if(crit)dmg*=2.2;
  m.hp-=dmg;
  if(m.type!=='boss'){m.kx+=(kx||0);m.ky+=(ky||0);if(stun)m.stun=Math.max(m.stun,stun);}
  if(crit){
    if(m.type==='boss'){
      var pn=4+((R()*3)|0);
      critBurst(m.x,m.y-20,pn);
      NET.events.push({k:'plates',x:Math.round(m.x),y:Math.round(m.y-20),n:pn});
    }else{
      floatText(m.x+(R()*14-7),m.y-m.r-8,'КРИТ '+Math.round(dmg),'#ff8a5c',15);
    }
    G.shake+=2;G.hitStop=Math.max(G.hitStop,0.045);
    NET.events.push({k:'hs',v:0.045});
    G.fx.push({type:'flash',x:m.x,y:m.y,r:36,t:0,life:0.18});
    SFX.crit();
  }else{
    floatText(m.x+(R()*14-7),m.y-m.r-6,''+Math.round(dmg),'#dfe6ee',12);
    SFX.hit();
  }
  if(m.hp<=0&&!m.dead){m.dead=true;killMob(m);}
}
// ---- destructible furniture ----
function paintDestroy(f){
  var c=floorCv.getContext('2d');
  c.fillStyle='#20242c';c.fillRect(f.x-3,f.y-3,f.w+6,f.h+6);
  c.fillStyle='rgba(10,8,6,0.5)';
  c.beginPath();c.ellipse(f.x+f.w/2,f.y+f.h/2,f.w*0.62,f.h*0.62+8,0,0,TAU);c.fill();
  for(var j=0;j<8;j++){
    c.fillStyle='rgba(70,60,45,0.85)';
    c.save();c.translate(f.x+R()*f.w,f.y+R()*f.h);c.rotate(R()*3);
    c.fillRect(-8-R()*6,-2,14+R()*8,3+R()*2);
    c.restore();
  }
  c.fillStyle='rgba(223,230,238,0.4)';
  for(j=0;j<4;j++)c.fillRect(f.x+R()*f.w,f.y+R()*f.h,6,4);
}
function destroyFurn(f){
  if(f.dead)return;
  f.dead=true;rebuildObst();
  G.shake+=5;G.hitStop=Math.max(G.hitStop,0.06);
  NET.events.push({k:'furn',x:Math.round(f.x+f.w/2),y:Math.round(f.y+f.h/2),tp:f.t});
  NET.events.push({k:'hs',v:0.06});
  SFX.explode();
  paintDestroy(f);
  for(var j=0;j<12;j++)G.fx.push({type:'paper',x:f.x+f.w/2,y:f.y+f.h/2,vx:R()*240-120,vy:R()*240-120,rot:R()*3,vr:R()*8-4,t:0,life:0.8+R()*0.5});
  for(j=0;j<8;j++)G.fx.push({type:'ember',x:f.x+R()*f.w,y:f.y+R()*f.h,vx:R()*140-70,vy:-40-R()*70,t:0,life:0.6,r:2+R()*3});
  if(f.t==='desk'||f.t==='rtable')spawnHalves(f);
  if(f.t==='cooler'){
    spawnWater(f.x+f.w/2,f.y+f.h/2);
    floatText(f.x,f.y-10,'кулер пробит!','#7aa2c8',12);
  }
  if(f.t==='printer'){
    for(var pji=PFX.length-1;pji>=0;pji--)if(Math.hypot(PFX[pji].x-f.x-f.w/2,PFX[pji].y-f.y-f.h/2)<40)PFX.splice(pji,1);
    for(j=0;j<24;j++){var pa=R()*TAU,ps2=80+R()*260;
      G.fx.push({type:'paper',x:f.x+f.w/2,y:f.y+f.h/2,vx:Math.cos(pa)*ps2,vy:Math.sin(pa)*ps2-60,rot:R()*3,vr:R()*10-5,t:0,life:1.4+R()*1.2});}
  }
  if(R()<0.22)dropPickup(f.x+f.w/2,f.y+f.h/2,'coffee');
  floatText(f.x+f.w/2,f.y-4,'разрушено','#b09a72',11);
}
function damageFurn(f,dmg){
  if(f.dead||FPROPS[f.t].hp<=0)return;
  f.hp-=dmg;
  floatText(f.x+f.w/2+(R()*10-5),f.y-2,'-'+Math.round(dmg),'#b09a72',11);
  SFX.crack();
  if(f.t==='printer'&&!f.jet){f.jet=1;spawnPrinterJet(f.x+f.w/2,f.y+f.h/2);}
  if(f.hp<=0)destroyFurn(f);
}
function aoeFurn(x,y,r,dmg){
  for(var i=0;i<FURN.length;i++){var f=FURN[i];
    if(f.dead||FPROPS[f.t].hp<=0)continue;
    var cx=clamp(x,f.x,f.x+f.w),cy=clamp(y,f.y,f.y+f.h);
    if(Math.hypot(x-cx,y-cy)<r)damageFurn(f,dmg);
  }
}
function furnInArc(pl,arc,rad,dmg){
  for(var i=0;i<FURN.length;i++){var f=FURN[i];
    if(f.dead||FPROPS[f.t].hp<=0)continue;
    var cx=clamp(pl.x,f.x,f.x+f.w),cy=clamp(pl.y,f.y,f.y+f.h);
    var dx=cx-pl.x,dy=cy-pl.y;
    if(dx*dx+dy*dy<(rad+12)*(rad+12)&&Math.abs(angDiff(pl.aim,Math.atan2(dy||0.001,dx||0.001)))<arc/2)
      damageFurn(f,dmg);
  }
}
// диабло-смерть: стон, улетающая душа с выдохом, горсть монет
function dramaOfDeath(x,y,tp,elite){
  var pitch=tp==='deadline'?0.75:(elite?0.6:1.15+R()*0.25);
  SFX.deathCry(pitch);
  spawnDebris({kind:'soul',x:x,y:y-6,pitch:pitch,elite:elite,t:0,life:1.35});
  setTimeout(function(){SFX.soulSigh(pitch*(elite?0.7:1));},120);
  spawnCoinBurst(x,y,2+((R()*3)|0)+(elite?2:0));
}
function killMob(m){
  NET.events.push({k:'die',x:Math.round(m.x),y:Math.round(m.y),tp:m.type,elite:m.elite?1:0});
  // комбо: серия убийств без получения урона
  G.combo=Math.min(9,(G.combo||0)+1);G.comboT=3;
  if(G.combo>=2){
    var cn=COMBONAMES[G.combo];
    floatText(m.x,m.y-46,'×'+G.combo+' '+cn,'#ffcf5c',13);
    if(G.combo>=3)spawnDebris({kind:'coin',x:m.x,y:m.y-8,vx:R()*120-60,vy:-140,vr:0,floorY:m.y+16,g:900,phys:1,coined:1,t:0,life:8});
  }
  if(R()<0.25)floatText(m.x+R()*20-10,m.y-28,KILLQUOTES[(R()*KILLQUOTES.length)|0],'#8b949e',10);
  if(m.elite){
    for(var ek=0;ek<3;ek++)spawnDebris({kind:'coin',x:m.x+R()*24-12,y:m.y-10,vx:R()*180-90,vy:-160-R()*120,vr:0,floorY:m.y+20+R()*20,g:900,phys:1,coined:1,t:0,life:8});
    if(R()<0.5)dropPickup(m.x,m.y,'coffee');
    floatText(m.x,m.y-60,'элитный уволился красиво','#c88a4a',12);
  }
  if(m.type==='intern'){G.killsI++;addOkr(1);}
  else if(m.type==='deadline'){G.killsD++;addOkr(2);}
  else if(m.type==='boss'){
    SFX.deathCry(0.5);
    spawnDebris({kind:'soul',x:m.x,y:m.y-10,pitch:0.55,elite:1,t:0,life:2.2});
    setTimeout(function(){SFX.soulSigh(0.55);},150);
  }
  if(m.type!=='boss')dramaOfDeath(m.x,m.y,m.type,m.elite);
  else if(m.type==='boss'){
    G.okr+=10;msg('Аудит завершён. Замечаний нет.',3.5);SFX.explode();G.shake+=10;
    for(var i=0;i<16;i++)spawnDebris({kind:'coin',x:m.x+R()*60-30,y:m.y+R()*40-20,vx:R()*300-150,vy:-180-R()*200,vr:0,floorY:m.y+30+R()*60,g:1000,phys:1,coined:1,t:0,life:9});
    for(var i=0;i<3;i++)dropPickup(m.x+R()*60-30,m.y+R()*60-30,'coffee');
    dropPickup(m.x,m.y,['espresso','desk','cert'][(R()*3)|0]);
    dropPickup(m.x+20,m.y,['espresso','desk','cert'][(R()*3)|0]);
    if(!G.winShown){G.winShown=true;G.winT=1.6;}
    G.boss=null;return;
  }
  for(var j=0;j<12;j++)G.fx.push({type:'paper',x:m.x,y:m.y,vx:R()*240-120,vy:R()*240-120,rot:R()*3,vr:R()*8-4,t:0,life:0.7+R()*0.5});
  for(j=0;j<5;j++)G.fx.push({type:'spark2',x:m.x,y:m.y,t:0,life:0.3,a:R()*TAU});
  G.shake+=2;G.hitStop=Math.max(G.hitStop,0.04);
  NET.events.push({k:'hs',v:0.04});
  if(R()<0.30)dropPickup(m.x,m.y,'coffee');
  if(R()<0.035)dropPickup(m.x,m.y,['espresso','desk','cert'][(R()*3)|0]);
  SFX.splat();
}
function dropPickup(x,y,kind){
  x=clamp(x,60,MAP_W-60);y=clamp(y,60,MAP_H-60);
  G.pickups.push({id:++G.pkSeq,x:x,y:y,kind:kind,t:0,life:25});
}
function addOkr(n){
  G.okr+=n;
  var i;
  for(i=0;i<G.players.length;i++){var p=G.players[i];
    while(G.okr>=15*G.grade){
      G.grade++;p.spdMult+=0.04;
      floatText(p.x,p.y-40,'ПОВЫШЕНИЕ! ГРЕЙД '+G.grade,'#3fb950',15);
      SFX.grade();
    }
  }
}
function meleeArc(pl,arc,rad,dmg,knock,stun){
  var hit=false,i;
  for(i=0;i<G.mobs.length;i++){var m=G.mobs[i];
    var d=dist(pl,m);
    if(d<rad+m.r&&Math.abs(angDiff(pl.aim,angTo(pl,m)))<arc/2){
      var a=angTo(pl,m);damageMob(m,dmg*pl.dmgMult,Math.cos(a)*knock,Math.sin(a)*knock,stun);hit=true;
    }
  }
  if(G.boss){var m2=G.boss,d2=dist(pl,m2);
    if(d2<rad+m2.r&&Math.abs(angDiff(pl.aim,angTo(pl,m2)))<arc/2){
      damageMob(m2,dmg*pl.dmgMult,0,0,0);hit=true;
    }
  }
  furnInArc(pl,arc,rad,dmg*pl.dmgMult);
  return hit;
}
