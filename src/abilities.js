'use strict';
// ============================== actions ==============================
function tryPrimary(p){
  if(p.cd1>0)return;
  var C=CLS[p.cls];
  if(p.cls==='mgr'||p.cls==='mkt'){
    p.cd1=C.s1.cd;p.atkT=0.18;
    var a=p.aim,spd=p.cls==='mgr'?470:540;
    var pk2=p.cls==='mgr'?'ticket':['tw','tg','ig'][(R()*3)|0]; // твит / телеграм / инстаграм
    G.projs.push({id:++G.pkSeq,kind:pk2,x:p.x+Math.cos(a)*22,y:p.y+Math.sin(a)*22,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg:(p.cls==='mgr'?9:8)*p.dmgMult,life:1.5,rot:R()*TAU});
    if(p.cls==='mgr'){SFX.whoosh();SFX.stapler();}
    else{SFX.notif();}
  }else{
    p.cd1=C.s1.cd;p.atkT=0.18;
    var arc=p.cls==='dsn'?110:130,rad=p.cls==='dsn'?74:86;
    G.fx.push({type:'slash',x:p.x,y:p.y,a:p.aim,arc:arc*Math.PI/180,rad:rad,t:0,life:0.16});
    NET.events.push({k:'slash',x:Math.round(p.x),y:Math.round(p.y),a:p.aim,arc:arc,rad:rad});
    SFX.swing();
    if(p.cls==='dev'&&R()<0.6)SFX.clack();
    meleeArc(p,arc*Math.PI/180,rad,p.cls==='dsn'?11:14,p.cls==='dsn'?120:150,0);
  }
}
function trySecondary(p){
  if(p.cd2>0)return;
  var C=CLS[p.cls];
  if(p.cls==='mgr'){
    if(!spendCoffee(p,C.s2.cost))return;
    p.cd2=C.s2.cd;p.atkT=0.2;
    G.fx.push({type:'slash',x:p.x,y:p.y,a:p.aim,arc:100*Math.PI/180,rad:80,t:0,life:0.18,big:true});
    NET.events.push({k:'slash',x:Math.round(p.x),y:Math.round(p.y),a:p.aim,arc:100,rad:80,big:1});
    SFX.thudFlesh();
    meleeArc(p,100*Math.PI/180,80,22,280,0);
  }else if(p.cls==='dev'){
    if(!spendCoffee(p,C.s2.cost))return;
    p.cd2=C.s2.cd;p.atkT=0.2;
    G.fx.push({type:'ring',x:p.x,y:p.y,rad:10,radMax:100,t:0,life:0.3});
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:100});
    G.shake+=4;SFX.slam();
    for(var i=0;i<G.mobs.length;i++){var m=G.mobs[i];
      if(dist(p,m)<100+m.r){var a=angTo(p,m);damageMob(m,30*p.dmgMult,Math.cos(a)*360,Math.sin(a)*360,0.8);}
    }
    if(G.boss&&dist(p,G.boss)<100+G.boss.r)damageMob(G.boss,30*p.dmgMult,0,0,0);
    aoeFurn(p.x,p.y,110,30*p.dmgMult);
  }else if(p.cls==='mkt'){
    if(!spendCoffee(p,C.s2.cost))return;
    p.cd2=C.s2.cd;p.atkT=0.25;p.castT=0.3;
    // funnel: pull enemies from a cone toward the marketer
    G.fx.push({type:'ring',x:p.x,y:p.y,rad:240,radMax:40,t:0,life:0.35,purple:true});
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:240,rv:40,purple:1});
    SFX.whoosh();
    for(i=0;i<G.mobs.length;i++){var m2=G.mobs[i];
      var d2=dist(p,m2);
      if(d2<260+m2.r&&Math.abs(angDiff(p.aim,angTo(p,m2)))<0.9){
        var a2=angTo(m2,p);
        m2.kx+=Math.cos(a2)*300;m2.ky+=Math.sin(a2)*300;
        damageMob(m2,6*p.dmgMult,0,0,0);
      }
    }
    if(G.boss&&dist(p,G.boss)<260+G.boss.r&&Math.abs(angDiff(p.aim,angTo(p,G.boss)))<0.9)damageMob(G.boss,6*p.dmgMult,0,0,0);
  }else{ // dsn критика: wide push wave
    if(!spendCoffee(p,C.s2.cost))return;
    p.cd2=C.s2.cd;p.atkT=0.25;
    G.fx.push({type:'slash',x:p.x,y:p.y,a:p.aim,arc:200*Math.PI/180,rad:95,t:0,life:0.2,big:true});
    NET.events.push({k:'slash',x:Math.round(p.x),y:Math.round(p.y),a:p.aim,arc:200,rad:95,big:1});
    G.shake+=3;SFX.bell();SFX.slam();
    meleeArc(p,200*Math.PI/180,95,10,430,0);
  }
}
function trySkill(p){ // ульта (ПРОБЕЛ)
  if(p.cdQ>0||p.qT>0)return;
  var C=CLS[p.cls];
  if(p.cls==='mgr'){
    if(!spendCoffee(p,C.ult.cost))return;
    p.shield=4.5;p.cdQ=C.ult.cd;p.castT=0.5;
    G.fx.push({type:'ring',x:p.x,y:p.y,rad:20,radMax:300,t:0,life:0.5,blue:true});
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:300,blue:1});
    floatText(p.x,p.y-40,'«у меня созвон»','#7aa2c8',15);
    SFX.ring();
  }else if(p.cls==='dev'){
    if(!spendCoffee(p,C.ult.cost))return;
    p.qT=3.2;p.qPulse=0;p.cdQ=C.ult.cd;p.castT=0.5;
    floatText(p.x,p.y-40,'клац-клац-клац','#d29922',15);
    SFX.clacks(14);
  }else if(p.cls==='mkt'){
    if(!spendCoffee(p,C.ult.cost))return;
    p.cdQ=C.ult.cd;p.castT=0.5;
    var hit=0;
    for(var i=0;i<G.mobs.length;i++){var m=G.mobs[i];
      if(dist(p,m)<420+m.r){m.cf=4;m.aggro=false;hit++;}
    }
    G.fx.push({type:'ring',x:p.x,y:p.y,rad:30,radMax:420,t:0,life:0.6,purple:true});
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:420,purple:1});
    floatText(p.x,p.y-40,'РЕБРЕНДИНГ!','#c8a2e0',16);
    SFX.grade();
    if(hit)floatText(p.x,p.y-58,'мобы в замешательстве','#c8a2e0',11);
  }else{ // dsn мудборд
    if(!spendCoffee(p,C.ult.cost))return;
    p.cdQ=C.ult.cd;p.castT=0.6;
    G.fx.push({type:'ring',x:p.x,y:p.y,rad:20,radMax:330,t:0,life:0.5,yellow:true});
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:330,yellow:1});
    var cols=['#e5534b','#d29922','#7aa2c8','#3fb950','#c8a2e0'];
    for(i=0;i<10;i++){
      var sa=R()*TAU,sr2=60+R()*250;
      G.fx.push({type:'paint',x:p.x+Math.cos(sa)*sr2,y:p.y+Math.sin(sa)*sr2,r:6+R()*10,col:cols[(R()*5)|0],t:0,life:0.8+R()*0.5});
    }
    G.shake+=6;SFX.slam();SFX.clacks(6);
    for(i=0;i<G.mobs.length;i++){var m3=G.mobs[i];
      if(dist(p,m3)<330+m3.r)damageMob(m3,20*p.dmgMult,0,0,1.3);
    }
    if(G.boss&&dist(p,G.boss)<330+G.boss.r)damageMob(G.boss,20*p.dmgMult,0,0,0);
    aoeFurn(p.x,p.y,340,20*p.dmgMult);
    floatText(p.x,p.y-40,'мудборд!!','#d29922',16);
  }
}
function trySkill2(p){ // Q-скил
  if(p.cdS>0)return;
  var C=CLS[p.cls];
  if(p.cls==='mgr'){ // АСАП: haste self + nearby allies
    if(!spendCoffee(p,C.sk.cost))return;
    p.cdS=C.sk.cd;p.castT=0.4;
    var buffed=0;
    for(var i=0;i<G.players.length;i++){var pl=G.players[i];
      if(pl.dead)continue;
      if(dist(p,pl)<230||pl===p){
        pl.haste=3.5;buffed++;
        G.fx.push({type:'ring',x:pl.x,y:pl.y,rad:8,radMax:52,t:0,life:0.4,green:true});
        NET.events.push({k:'ring',x:Math.round(pl.x),y:Math.round(pl.y),rm:52,green:1});
        floatText(pl.x,pl.y-34,'АСАП!','#8bd17c',13);
      }
    }
    floatText(p.x,p.y-52,'команда ускорена ('+buffed+')','#8bd17c',11);
    SFX.grade();
  }else if(p.cls==='dev'){ // легаси-код: chains + mental DoT
    if(!spendCoffee(p,C.sk.cost))return;
    p.cdS=C.sk.cd;p.castT=0.5;
    var seat=-1;
    for(i=0;i<G.players.length;i++)if(G.players[i]===p)seat=i;
    var chained=0,dmg=4*p.dmgMult;
    for(i=0;i<G.mobs.length&&chained<6;i++){var m=G.mobs[i];
      if(dist(p,m)<320+m.r&&m.ch<=0){
        m.ch=4;m.chTick=0;m.chDmg=dmg;m.chSrc=seat;chained++;
        floatText(m.x,m.y-20,'легаси','#a08c5a',11);
      }
    }
    G.fx.push({type:'ring',x:p.x,y:p.y,rad:20,radMax:320,t:0,life:0.4,yellow:true});
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:320,yellow:1});
    SFX.clacks(8);SFX.slam();
    if(!chained)floatText(p.x,p.y-36,'не нашлось целей','#8b949e',11);
  }else if(p.cls==='mkt'){ // таргетинг: mark = +50% damage taken
    if(!spendCoffee(p,C.sk.cost))return;
    p.cdS=C.sk.cd;p.castT=0.4;
    var marked=0;
    for(i=0;i<G.mobs.length&&marked<5;i++){var m2=G.mobs[i];
      if(dist(p,m2)<360+m2.r&&m2.mk<=0){
        m2.mk=5;marked++;
        floatText(m2.x,m2.y-20,'в таргете','#e07050',11);
      }
    }
    G.fx.push({type:'ring',x:p.x,y:p.y,rad:20,radMax:360,t:0,life:0.4,red:true});
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:360,red:1});
    SFX.ring();
    if(!marked)floatText(p.x,p.y-36,'аудитория не найдена','#8b949e',11);
  }else{ // dsn пиксель-перфект: dash
    if(!spendCoffee(p,C.sk.cost))return;
    p.cdS=C.sk.cd;p.inv=Math.max(p.inv,0.4);
    var a=p.aim,stepLen=5,total=170;
    for(var st=0;st<total;st+=stepLen){
      var nx=p.x+Math.cos(a)*stepLen,ny=p.y+Math.sin(a)*stepLen;
      if(blockedAt(nx,ny,p.r))break; // рывок не проходит сквозь стены
      G.fx.push({type:'ghost',x:p.x,y:p.y,face:p.face,cls:p.cls,t:0,life:0.3+st*0.001});
      p.x=nx;p.y=ny;
    }
    NET.events.push({k:'ring',x:Math.round(p.x),y:Math.round(p.y),rm:40,green:1});
    SFX.whoosh();
    floatText(p.x,p.y-36,'пиксель-перфект','#8bd17c',12);
  }
}
function drinkCoffee(p,cp){
  cp.charges--;cp.t=45;
  p.burnout=Math.max(0,p.burnout-25);
  p.coffee=Math.min(p.coffeeMax,p.coffee+45);
  floatText(p.x,p.y-34,'+кофе, −выгорание','#8bd17c',14);
  SFX.slurp();
  G.fx.push({type:'ring',x:p.x,y:p.y,rad:8,radMax:56,t:0,life:0.4,green:true});
}
