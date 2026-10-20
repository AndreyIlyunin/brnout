'use strict';
// ============================== camera ==============================
function updateCamera(dt,snap){
  var me=localPlayer();
  if(!me)return;
  var Wc=cv.width/(DPR*G.zoom),Hc=cv.height/(DPR*G.zoom);
  var tx=me.x-Wc/2,ty=me.y-Hc/2;
  tx=(Wc>=MAP_W)?(MAP_W-Wc)/2:clamp(tx,0,MAP_W-Wc);
  ty=(Hc>=MAP_H)?(MAP_H-Hc)/2:clamp(ty,0,MAP_H-Hc);
  if(snap){G.camX=tx;G.camY=ty;}
  else{G.camX+=(tx-G.camX)*Math.min(1,dt*8);G.camY+=(ty-G.camY)*Math.min(1,dt*8);}
  if(G.shake>0){var sh=G.shake/3;G.camX+=R()*sh-sh/2;G.camY+=R()*sh-sh/2;}
}

// ============================== render ==============================
var DPR=1;
var lightCv=document.createElement('canvas'),lctx=lightCv.getContext('2d');
var grainCv=null;
function makeGrain(){
  grainCv=document.createElement('canvas');grainCv.width=160;grainCv.height=160;
  var c=grainCv.getContext('2d'),img=c.createImageData(160,160);
  for(var i=0;i<img.data.length;i+=4){var v=(Math.random()*255)|0;img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v;img.data[i+3]=30;}
  c.putImageData(img,0,0);
}
function worldPool(sel){
  if(NET.mode==='guest')return VIEW[sel];
  return G[sel];
}
function applyWorldT(){ctx.setTransform(DPR*G.zoom,0,0,DPR*G.zoom,-G.camX*DPR*G.zoom,-G.camY*DPR*G.zoom);}
function applyScreenT(){ctx.setTransform(DPR,0,0,DPR,0,0);}
function drawWorld(){
  var mobs=worldPool('mobs'),players=worldPool('players'),projs=worldPool('projs'),
      pickups=(NET.mode==='guest')?VIEW.pickups:G.pickups,zones=(NET.mode==='guest')?VIEW.zones:G.zones,
      boss=(NET.mode==='guest')?VIEW.boss:G.boss;
  applyScreenT();
  var W=cv.width/DPR,H=cv.height/DPR;
  ctx.fillStyle='#05070a';ctx.fillRect(0,0,W,H);
  applyWorldT();
  ctx.drawImage(floorCv,0,0);
  drawChaos();
  var i;
  for(i=0;i<zones.length;i++){var z=zones[i];
    var life=(NET.mode==='guest')?(1-z.tl/7):(1-z.t/z.life);
    var al=Math.min(0.28,0.45*Math.max(0,life));
    ctx.fillStyle='rgba(180,40,40,'+al+')';ctx.fillRect(z.x,z.y,z.w,z.h);
    ctx.strokeStyle='rgba(220,70,60,0.6)';ctx.lineWidth=2;ctx.strokeRect(z.x,z.y,z.w,z.h);
    ctx.fillStyle='rgba(255,120,110,0.85)';ctx.font='10px Arial';ctx.fillText('НЕ СОГЛАСОВАНО',z.x+6,z.y+14);
  }
  var cf=(NET.mode==='guest')?VIEW.coffee:null;
  for(i=0;i<COFFEES.length;i++)drawCoffeePoint(COFFEES[i],cf?cf[i]:COFFEES[i].charges);
  for(i=0;i<pickups.length;i++)drawPickup(pickups[i]);
  if(boss&&boss.windup>0){
    var rad=150+20*(boss.phase||1);
    ctx.fillStyle='rgba(200,60,50,'+(0.15+0.1*Math.sin(G.t*12))+')';
    ctx.beginPath();ctx.arc(boss.tx,boss.ty,rad,0,TAU);ctx.fill();
    ctx.strokeStyle='rgba(230,90,80,0.7)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(boss.tx,boss.ty,rad,0,TAU);ctx.stroke();
  }
  for(i=0;i<G.fx.length;i++){var f=G.fx[i];
    if(f.type==='stamp'&&f.t<1.2){
      ctx.save();ctx.translate(f.x,f.y);ctx.rotate(-0.12);
      ctx.strokeStyle='rgba(200,60,50,'+(0.8*(1-f.t/5))+')';ctx.lineWidth=4;
      var r2=f.rad*0.8;ctx.strokeRect(-r2,-r2*0.5,r2*2,r2);
      ctx.fillStyle='rgba(200,60,50,'+(0.7*(1-f.t/5))+')';ctx.font='bold '+Math.round(r2*0.3)+'px Arial';
      ctx.textAlign='center';ctx.fillText('СВЕДЕНО',0,8);ctx.textAlign='left';ctx.restore();
    }
  }
  for(i=0;i<mobs.length;i++){
    if(mobs[i].type==='deadline')drawDeadline(mobs[i],NET.mode==='guest');
    else drawIntern(mobs[i],NET.mode==='guest');
  }
  // легаси-цепи + метки таргетинга на всех мобах
  var playersAll=worldPool('players');
  for(i=0;i<mobs.length;i++){var mc=mobs[i];
    if(mc.mk>0){
      var pl2=0.5+0.5*Math.sin(G.t*6);
      ctx.strokeStyle='rgba(224,112,80,'+(0.5+0.4*pl2)+')';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(mc.x,mc.y,mc.r+7,0,TAU);ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mc.x-mc.r-14,mc.y);ctx.lineTo(mc.x-mc.r-6,mc.y);ctx.moveTo(mc.x+mc.r+6,mc.y);ctx.lineTo(mc.x+mc.r+14,mc.y);
      ctx.moveTo(mc.x,mc.y-mc.r-14);ctx.lineTo(mc.x,mc.y-mc.r-6);ctx.moveTo(mc.x,mc.y+mc.r+6);ctx.lineTo(mc.x,mc.y+mc.r+14);
      ctx.stroke();
    }
    if(mc.ch>0){
      var src=playersAll[(mc.chS===undefined||mc.chS<0)?0:mc.chS%playersAll.length];
      if(src){
        ctx.strokeStyle='rgba(160,140,90,'+(0.4+0.2*Math.sin(G.t*5+i))+')';
        ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(src.x,src.y);
        var segs=5;
        for(var sg=1;sg<segs;sg++){
          var tt=sg/segs;
          var nx=src.x+(mc.x-src.x)*tt,ny=src.y+(mc.y-src.y)*tt;
          var sag=Math.sin(tt*Math.PI)*16+Math.sin(G.t*6+sg*2+i)*4;
          var dxn=-(mc.y-src.y),dyn=(mc.x-src.x);
          var dl=Math.hypot(dxn,dyn)||1;
          ctx.lineTo(nx+dxn/dl*sag,ny+dyn/dl*sag);
        }
        ctx.lineTo(mc.x,mc.y);
        ctx.stroke();
        ctx.fillStyle='rgba(160,140,90,0.8)';
        ctx.beginPath();ctx.arc(mc.x,mc.y-4,3,0,TAU);ctx.fill();
      }
    }
  }
  if(boss)drawBoss(boss,NET.mode==='guest');
  for(i=0;i<players.length;i++)drawPlayer(players[i],players[i].id===NET.myId);
  for(i=0;i<projs.length;i++){var pj=projs[i];
    ctx.save();ctx.translate(pj.x,pj.y);ctx.rotate(pj.rot||0);
    if(pj.kind==='plane'){
      var fa=Math.atan2(pj.vy,pj.vx);
      ctx.rotate(fa-pj.rot);
      ctx.fillStyle='#e8e2d0';
      ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,5);ctx.lineTo(-3,0);ctx.lineTo(-7,-5);ctx.closePath();ctx.fill();
      ctx.fillStyle='#c23b32';ctx.beginPath();ctx.arc(1,0,2.4,0,TAU);ctx.fill();
    }else{
      // билет с жирафом: летит вдоль движения, слегка покачиваясь
      var fa2=Math.atan2(pj.vy,pj.vx);
      ctx.rotate(fa2-pj.rot+Math.sin((pj.rot||0)*3+G.t*8)*0.18);
      ctx.fillStyle='#f2e6c8';rr(ctx,-11,-6.5,22,13,2);ctx.fill();
      ctx.strokeStyle='#b9a86f';ctx.lineWidth=1;rr(ctx,-11,-6.5,22,13,2);ctx.stroke();
      ctx.fillStyle='#c23b32';ctx.fillRect(-11,-6.5,22,3.2);
      ctx.strokeStyle='rgba(0,0,0,0.28)';ctx.setLineDash([1.5,1.5]);
      ctx.beginPath();ctx.moveTo(6.6,-3.3);ctx.lineTo(6.6,6.5);ctx.stroke();
      ctx.setLineDash([]);
      ctx.save();ctx.translate(-2,0.5);
      drawJiraIcon(ctx,1.05);
      ctx.restore();
    }
    ctx.restore();
  }
  for(i=0;i<G.fx.length;i++)drawFx(G.fx[i]);
  drawDebris();
  drawHoverTag();
  for(i=0;i<G.texts.length;i++){var t=G.texts[i];
    ctx.globalAlpha=1-t.t/t.life;
    ctx.font='bold '+t.size+'px Arial';ctx.fillStyle=t.color;
    ctx.textAlign='center';ctx.fillText(t.text,t.x,t.y);ctx.textAlign='left';
    ctx.globalAlpha=1;
  }
}
function drawCoffeePoint(cp,charges){
  var bob=Math.sin(G.t*2+cp.x)*2;
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.ellipse(cp.x,cp.y+8,22,10,0,0,TAU);ctx.fill();
  ctx.fillStyle='#3a404c';rr(ctx,cp.x-20,cp.y-6,40,14,3);ctx.fill();
  ctx.fillStyle='#22262e';ctx.fillRect(cp.x-13,cp.y-36,26,32);
  ctx.fillStyle='#3a4049';ctx.fillRect(cp.x-9,cp.y-30,18,14);
  ctx.fillStyle=charges>0?'#3fb950':'#555';ctx.fillRect(cp.x-7,cp.y-27,4,3);
  ctx.fillStyle='#c9d1d9';ctx.fillRect(cp.x+7,cp.y-30,3,20);
  for(var i=0;i<charges;i++){
    ctx.fillStyle='#d8dce2';ctx.fillRect(cp.x-16+i*7,cp.y-14+bob*0.3,5,8);
  }
  if(charges===0){
    ctx.fillStyle='rgba(139,148,158,0.7)';ctx.font='10px Arial';ctx.textAlign='center';
    ctx.fillText('кофе закончился…',cp.x,cp.y-46);ctx.textAlign='left';
  }
  var me=localPlayer();
  if(me&&charges>0&&dist(me,cp)<60&&!me.dead){
    ctx.fillStyle='#e6edf3';ctx.font='bold 12px Arial';ctx.textAlign='center';
    ctx.fillText(isTouch?'КОФЕ':'E — кофе',cp.x,cp.y-50);ctx.textAlign='left';
  }
}
function drawPickup(pk){
  var age=(NET.mode==='guest')?G.t:pk.t;
  var bob=Math.sin(age*3)*3,al=(NET.mode==='guest')?1:(pk.life<3?(Math.sin(pk.t*12)*0.5+0.5):1);
  ctx.globalAlpha=al;
  var y=pk.y+bob;
  if(pk.kind==='coffee'){
    ctx.fillStyle='#d8dce2';rr(ctx,pk.x-6,y-8,12,14,2);ctx.fill();
    ctx.strokeStyle='#d8dce2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(pk.x+8,y-1,4,-1.2,1.2);ctx.stroke();
    ctx.fillStyle='#6f4a23';ctx.fillRect(pk.x-4,y-2,8,6);
  }else{
    ctx.fillStyle=pk.kind==='espresso'?'#6f4a23':(pk.kind==='desk'?'#4a6da7':'#3fb950');
    rr(ctx,pk.x-9,y-9,18,18,3);ctx.fill();
    ctx.fillStyle='#0d1117';ctx.font='bold 12px Arial';ctx.textAlign='center';
    ctx.fillText(pk.kind==='espresso'?'Э':(pk.kind==='desk'?'С':'Ц'),pk.x,y+4);ctx.textAlign='left';
  }
  ctx.globalAlpha=1;
}
function drawFx(f){
  var k=f.t/f.life;
  if(f.type==='slash'){
    ctx.strokeStyle='rgba(223,230,238,'+(0.9*(1-k))+')';
    ctx.lineWidth=(f.big?7:4)*(1-k*0.5);
    ctx.beginPath();ctx.arc(f.x,f.y,f.rad*0.85,f.a-f.arc/2,f.a+f.arc/2);ctx.stroke();
  }else if(f.type==='ring'){
    var r=f.rad+((f.radMax-f.rad)*k);
    var col=f.blue?'122,162,200':(f.green?'139,209,124':(f.purple?'200,162,224':(f.red?'224,112,80':(f.orange?'255,140,40':(f.yellow?'210,153,34':'223,230,238')))));
    ctx.strokeStyle='rgba('+col+','+(0.8*(1-k))+')';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(f.x,f.y,r,0,TAU);ctx.stroke();
  }else if(f.type==='paper'){
    ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot);
    ctx.fillStyle='rgba(223,230,238,'+(1-k)+')';ctx.fillRect(-5,-3,10,6);ctx.restore();
  }else if(f.type==='ember'){
    ctx.fillStyle='rgba(255,150,50,'+(0.7*(1-k))+')';
    ctx.beginPath();ctx.arc(f.x,f.y,(f.r||3)*(1-k*0.5),0,TAU);ctx.fill();
  }else if(f.type==='paint'){
    ctx.globalAlpha=0.5*(1-k);
    ctx.fillStyle=f.col;
    ctx.beginPath();
    ctx.moveTo(f.x+f.r,f.y);
    for(var an=0;an<TAU;an+=0.6){
      var wob2=f.r*(0.6+Math.sin(an*7+f.r)*0.3);
      ctx.lineTo(f.x+Math.cos(an)*wob2,f.y+Math.sin(an)*wob2*0.8);
    }
    ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;
  }else if(f.type==='ghost'){
    ctx.globalAlpha=0.35*(1-k);
    ctx.fillStyle='#8bd17c';
    ctx.beginPath();ctx.arc(f.x,f.y,13,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(f.x,f.y-14,7,0,TAU);ctx.fill();
    ctx.globalAlpha=1;
  }else if(f.type==='flash'){
    ctx.globalCompositeOperation='lighter';
    var g3=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.r*(0.5+k));
    g3.addColorStop(0,'rgba(255,250,220,'+(0.8*(1-k))+')');
    g3.addColorStop(1,'rgba(255,250,220,0)');
    ctx.fillStyle=g3;ctx.beginPath();ctx.arc(f.x,f.y,f.r*(0.5+k),0,TAU);ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }else if(f.type==='spark2'){
    ctx.strokeStyle='rgba(235,240,248,'+(0.8*(1-k))+')';ctx.lineWidth=2;
    var rr3=20+k*46;
    ctx.beginPath();ctx.moveTo(f.x+Math.cos(f.a)*rr3*0.4,f.y+Math.sin(f.a)*rr3*0.4);
    ctx.lineTo(f.x+Math.cos(f.a)*rr3,f.y+Math.sin(f.a)*rr3);ctx.stroke();
  }
}
function drawLighting(){
  var sc=0.5;
  if(lightCv.width!==Math.round(cv.width*sc)||lightCv.height!==Math.round(cv.height*sc)){lightCv.width=Math.round(cv.width*sc);lightCv.height=Math.round(cv.height*sc);}
  lctx.setTransform(1,0,0,1,0,0);
  lctx.clearRect(0,0,lightCv.width,lightCv.height);
  lctx.fillStyle='rgba(2,4,9,0.88)';lctx.fillRect(0,0,lightCv.width,lightCv.height);
  lctx.globalCompositeOperation='destination-out';
  lctx.setTransform(DPR*G.zoom*sc,0,0,DPR*G.zoom*sc,-G.camX*DPR*G.zoom*sc,-G.camY*DPR*G.zoom*sc);
  function hole(x,y,r,i2){
    var g=lctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba(0,0,0,'+i2+')');g.addColorStop(1,'rgba(0,0,0,0)');
    lctx.fillStyle=g;lctx.beginPath();lctx.arc(x,y,r,0,TAU);lctx.fill();
  }
  var i;
  for(i=0;i<LIGHTS.length;i++){var L=LIGHTS[i];
    if(L.dead)continue;
    var inten=L.dim*(0.82+0.18*Math.sin(G.t*7+L.ph)+0.08*Math.sin(G.t*23+L.sd*7));
    if(L.sput>0){L.sput-=1/60;inten*=(Math.sin(G.t*60+L.sd)>0?1:0.15);}
    else if(R()<0.0015)L.sput=0.25+R()*0.3;
    if(inten>0.03)hole(L.x,L.y,160*Math.min(1,inten+0.2),Math.min(1,inten+0.15));
  }
  var players=worldPool('players');
  for(i=0;i<players.length;i++)if(!players[i].dead)hole(players[i].x,players[i].y,190,0.85);
  for(i=0;i<COFFEES.length;i++)if(COFFEES[i].charges>0)hole(COFFEES[i].x,COFFEES[i].y,90,0.5+0.1*Math.sin(G.t*3));
  var mobs=worldPool('mobs');
  for(i=0;i<mobs.length;i++)if(mobs[i].type==='deadline')hole(mobs[i].x,mobs[i].y,70,0.5);
  lctx.globalCompositeOperation='source-over';
  applyScreenT();
  ctx.drawImage(lightCv,0,0,cv.width/DPR,cv.height/DPR);
}
function drawGlows(){
  applyWorldT();
  ctx.globalCompositeOperation='lighter';
  function glow(x,y,r,col,a){
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
  }
  var mobs=worldPool('mobs');
  for(var i=0;i<mobs.length;i++)if(mobs[i].type==='deadline')glow(mobs[i].x,mobs[i].y,60,'rgba(255,130,30,A)',0.10+0.03*Math.sin(G.t*9));
  for(i=0;i<G.fx.length;i++){var f=G.fx[i];
    if(f.type==='ember')glow(f.x,f.y,14,'rgba(255,150,50,A)',0.25*(1-f.t/f.life));
  }
  for(i=0;i<COFFEES.length;i++)if(COFFEES[i].charges>0)glow(COFFEES[i].x,COFFEES[i].y,70,'rgba(80,220,120,A)',0.07);
  ctx.globalCompositeOperation='source-over';
}
function drawPost(){
  applyScreenT();
  var W=cv.width/DPR,H=cv.height/DPR;
  if(!drawPost.vg||drawPost.vgW!==W||drawPost.vgH!==H){
    var g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.72);
    g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0.72)');
    drawPost.vg=g;drawPost.vgW=W;drawPost.vgH=H;
  }
  ctx.fillStyle=drawPost.vg;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=0.5;
  ctx.translate(-R()*160,-R()*160);
  ctx.fillStyle=ctx.createPattern(grainCv,'repeat');
  ctx.fillRect(0,0,W+160,H+160);
  ctx.restore();
  var me=localPlayer();
  if(me&&me.burnout>65&&!me.dead){
    var a=Math.min(0.3,(me.burnout-65)/35*0.3)*(0.7+0.3*Math.sin(G.t*6));
    var g2=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.7);
    g2.addColorStop(0,'rgba(180,30,30,0)');g2.addColorStop(1,'rgba(180,30,30,'+a+')');
    ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);
  }
}
function drawCup(x,y,s,fill){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.strokeStyle='#c9d1d9';ctx.lineWidth=2;
  ctx.fillStyle='#12161c';rr(ctx,-14,-18,28,34,4);ctx.fill();ctx.stroke();
  var fh=30*clamp(fill,0,1);
  ctx.fillStyle='#6f4a23';ctx.fillRect(-12,14-fh,24,fh);
  if(fill>0.05){ctx.fillStyle='#8a5a2b';ctx.fillRect(-12,14-fh,24,2);}
  ctx.beginPath();ctx.arc(16,-2,7,-1.3,1.3);ctx.stroke();
  if(fill>0.25){
    ctx.strokeStyle='rgba(200,200,200,0.35)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(-5,-22);ctx.quadraticCurveTo(-8,-28,-5,-34);
    ctx.moveTo(5,-22);ctx.quadraticCurveTo(2,-28,5,-34);ctx.stroke();
  }
  ctx.restore();
}
function drawHUD(){
  applyScreenT();
  var W=cv.width/DPR,H=cv.height/DPR,p=localPlayer();
  if(!p)return;
  ctx.textAlign='left';
  var narrow=W<640;
  var bx=16,by=H-58,bw=narrow?130:210,bh=18;
  ctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,bx-8,by-26,narrow?bw+96:bw+120,bh+40,6);ctx.fill();
  var jit=p.burnout>70?R()*3-1.5:0;
  ctx.font='bold 11px Arial';ctx.fillStyle=p.burnout>70?'#e5534b':'#8b949e';
  ctx.fillText('ВЫГОРАНИЕ',bx,by-12);
  ctx.fillStyle='#12161c';rr(ctx,bx,by,bw,bh,3);ctx.fill();
  ctx.strokeStyle='#333b47';ctx.lineWidth=1;rr(ctx,bx,by,bw,bh,3);ctx.stroke();
  var fillW=bw*clamp(p.burnout/100,0,1);
  if(fillW>2){
    ctx.save();rr(ctx,bx,by,bw,bh,3);ctx.clip();
    var grad=ctx.createLinearGradient(bx,0,bx+bw,0);
    grad.addColorStop(0,'#6b7280');grad.addColorStop(0.5,'#b45309');grad.addColorStop(1,'#dc2626');
    ctx.fillStyle=grad;ctx.fillRect(bx+jit,by+jit*0.5,fillW,bh);ctx.restore();
  }
  ctx.font='bold 13px Arial';ctx.fillStyle='#e6edf3';
  ctx.fillText(Math.round(p.burnout)+'%',bx+bw+8,by+14);
  drawCup(bx+bw+(narrow?42:58),by+10,narrow?0.85:1.05,p.coffee/(p.coffeeMax||100));
  ctx.font='bold 11px Arial';ctx.fillStyle='#8b949e';
  ctx.fillText(narrow?('☕'+Math.round(p.coffee)):('КОФЕ '+Math.round(p.coffee)),bx+bw+(narrow?64:80),by+38);
  var sy=isTouch?100:H-70;
  var C=CLS[p.cls]||CLS.mgr;
  var slots=[
    {n:C.s1.n,cd:p.cd1||0,cdm:C.s1.cd,cost:C.s1.cost},
    {n:C.s2.n,cd:p.cd2||0,cdm:C.s2.cd,cost:C.s2.cost},
    {n:C.ult.n,cd:Math.max(p.cdQ||0,p.qT||0),cdm:C.ult.cd,cost:C.ult.cost},
    {n:C.sk.n,cd:p.cdS||0,cdm:C.sk.cd,cost:C.sk.cost}
  ];
  var slotW=isTouch?66:86,gap=isTouch?6:8;
  var sx0=isTouch?12:W/2-((slots.length*(slotW+gap)-8)/2);
  for(var i=0;i<slots.length;i++){var s=slots[i],x=sx0+i*(slotW+gap);
    ctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,x,sy,slotW,52,6);ctx.fill();
    ctx.strokeStyle='#333b47';rr(ctx,x,sy,slotW,52,6);ctx.stroke();
    if(s.cd>0){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(x,sy,slotW,52*Math.min(1,s.cd/s.cdm));}
    ctx.font='bold 10px Arial';ctx.fillStyle='#d29922';ctx.textAlign='center';
    ctx.fillText(isTouch?['АТК','ПРИЁМ','УЛЬТА','СКИЛ'][i]:'['+['ЛКМ','ПКМ','ПРОБЕЛ','Q'][i]+']',x+slotW/2,sy+16);
    ctx.font='10px Arial';ctx.fillStyle='#c9d1d9';
    ctx.fillText(s.n,x+slotW/2,sy+30);
    ctx.font='9px Arial';ctx.fillStyle=s.cost>0&&p.coffee<s.cost?'#e5534b':'#6e7681';
    ctx.fillText(s.cost>0?s.cost+' ☕':'—',x+slotW/2,sy+44);
    ctx.textAlign='left';
  }
  if(p.haste>0){
    ctx.fillStyle='rgba(139,209,124,'+(0.7+0.3*Math.sin(G.t*10))+')';ctx.font='bold 11px Arial';
    ctx.fillText('АСАП! +55%',bx+bw+(narrow?64:80),by-6);
  }
  if(isTouch&&localNearCoffee())document.getElementById('btnCoffee').classList.remove('hidden');
  else document.getElementById('btnCoffee').classList.add('hidden');
  ctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,12,12,190,52,6);ctx.fill();
  ctx.font='bold 14px Arial';ctx.fillStyle='#e6edf3';
  ctx.fillText('СПРИНТ '+G.wave,24,34);
  var remG=(NET.mode==='guest')?VIEW.mobs.length:(G.spawnQ.length+G.mobs.length);
  ctx.font='11px Arial';ctx.fillStyle='#8b949e';
  ctx.fillText('задач в очереди: '+remG,24,52);
  ctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,W-160,12,148,52,6);ctx.fill();
  ctx.font='bold 14px Arial';ctx.fillStyle='#d29922';
  ctx.fillText('OKR: '+G.okr,W-148,34);
  ctx.font='11px Arial';ctx.fillStyle='#8b949e';
  ctx.fillText('грейд '+G.grade+' · ✦ '+(p.coins||0),W-148,52);
  // комбо-счётчик
  if(G.combo>1){
    var cbs=1+0.1*Math.sin(G.t*12);
    ctx.save();
    ctx.translate(W/2,86);
    ctx.scale(cbs,cbs);
    ctx.font='bold 22px Arial';
    ctx.fillStyle='rgba(255,207,92,'+(0.75+0.25*Math.sin(G.t*9))+')';
    ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=3;
    ctx.textAlign='center';
    var cbt='×'+G.combo+' '+(COMBONAMES[G.combo]||'');
    ctx.strokeText(cbt,0,0);
    ctx.fillText(cbt,0,0);
    ctx.restore();
    ctx.textAlign='left';
    // таймер-полоса
    ctx.fillStyle='rgba(10,13,18,0.6)';rr(ctx,W/2-40,96,80,5,2);ctx.fill();
    ctx.fillStyle='#ffcf5c';ctx.fillRect(W/2-40,96,80*clamp(G.comboT/3,0,1),5);
  }
  if(p.adr){
    ctx.fillStyle='rgba(229,83,75,'+(0.6+0.4*Math.sin(G.t*10))+')';
    ctx.font='bold 12px Arial';
    ctx.fillText('ПЕРЕДОЗ КОФЕИНА: +20% скор, +25% урон',bx,by-34);
  }
  var players=worldPool('players');
  if(players.length>1){
    var tw=0;
    for(var j=0;j<players.length;j++)if(players[j].id!==NET.myId)tw++;
    var tx0=W/2-(tw*110)/2,drawn=0;
    for(j=0;j<players.length;j++){var tp=players[j];
      if(tp.id===NET.myId)continue;
      var x0=tx0+drawn*110;drawn++;
      ctx.fillStyle='rgba(10,13,18,0.7)';rr(ctx,x0,10,104,26,4);ctx.fill();
      var pi=0;
      for(var q=0;q<players.length;q++)if(players[q]===tp)pi=q;
      ctx.fillStyle=PCOLORS[pi%4];ctx.fillRect(x0+6,16,6,6);
      ctx.fillStyle='#12161c';ctx.fillRect(x0+18,22,80,6);
      ctx.fillStyle=tp.dead?'#444':'#c23b32';ctx.fillRect(x0+18,22,80*clamp(tp.burnout/100,0,1),6);
      if(tp.dead){ctx.fillStyle='#8b949e';ctx.font='9px Arial';ctx.fillText('сгорел',x0+20,20);}
      ctx.fillStyle='#8bd17c';ctx.fillRect(x0+18,16,80*clamp(tp.coffee/(tp.coffeeMax||100),0,1),3);
    }
  }
  var boss=(NET.mode==='guest')?VIEW.boss:G.boss;
  if(boss){
    var hpF=(NET.mode==='guest')?(boss.hpF||0):clamp(boss.hp/boss.hpMax,0,1);
    var bbw=380,bbx=W/2-bbw/2,bby=54;
    ctx.fillStyle='rgba(10,13,18,0.8)';rr(ctx,bbx-10,bby-6,bbw+20,40,6);ctx.fill();
    ctx.font='bold 12px Arial';ctx.fillStyle='#e5534b';ctx.textAlign='center';
    ctx.fillText('РЕГЛЯТОРКА / АУДИТ'+(G.bossN>1?' (повторный, с правками)':''),W/2,bby+10);ctx.textAlign='left';
    ctx.fillStyle='#12161c';rr(ctx,bbx,bby+16,bbw,12,2);ctx.fill();
    ctx.fillStyle='#c23b32';ctx.save();rr(ctx,bbx,bby+16,bbw,12,2);ctx.clip();
    ctx.fillRect(bbx,bby+16,bbw*hpF,12);ctx.restore();
  }
  if(G.msgT>0){
    ctx.globalAlpha=Math.min(1,G.msgT);ctx.font='bold 15px Arial';ctx.fillStyle='#e6edf3';ctx.textAlign='center';
    ctx.fillText(G.msg,W/2,H*0.24);ctx.textAlign='left';ctx.globalAlpha=1;
  }
  if(p.dead){
    ctx.fillStyle='rgba(10,13,18,0.8)';rr(ctx,W/2-130,H/2-20,260,44,6);ctx.fill();
    ctx.fillStyle='#e5534b';ctx.font='bold 14px Arial';ctx.textAlign='center';
    ctx.fillText('ВЫ СГОРЕЛИ. Возрождение после спринта.',W/2,H/2+6);ctx.textAlign='left';
  }
  if(G.caption){
    ctx.globalAlpha=Math.min(0.75,G.capT*0.3);ctx.font='italic 12px Arial';ctx.fillStyle='#6e7681';
    if(isTouch){ctx.textAlign='left';ctx.fillText(G.caption,16,H-96);}
    else{ctx.textAlign='center';ctx.fillText(G.caption,W/2,H-12);}
    ctx.textAlign='left';ctx.globalAlpha=1;
  }
  if(NET.mode!=='solo'){
    ctx.fillStyle='rgba(139,148,158,0.8)';ctx.font='10px Arial';
    ctx.fillText(NET.mode==='host'?'P2P-ХОСТ · код '+NET.code:'P2P-КЛИЕНТ',W-160,74);
  }
  if(VIEW.paused&&NET.mode==='guest'){
    ctx.fillStyle='rgba(5,7,10,0.6)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#d29922';ctx.font='bold 20px Arial';ctx.textAlign='center';
    ctx.fillText('ХОСТ НА ПАУЗЕ',W/2,H/2);ctx.textAlign='left';
  }
  drawMinimap();
}
function localNearCoffee(){
  var me=localPlayer();
  if(!me)return false;
  var cf=(NET.mode==='guest')?VIEW.coffee:null;
  for(var i=0;i<COFFEES.length;i++){
    var ch=cf?(cf[i]!==undefined?cf[i]:0):COFFEES[i].charges;
    if(ch>0&&dist(me,COFFEES[i])<60)return true;
  }
  return false;
}
function drawMinimap(){
  applyScreenT();
  var W=cv.width/DPR,H=cv.height/DPR;
  var mw=200,mh=mmCv.height*(mw/mmCv.width);
  if(mh>190){mw=mw*190/mh;mh=190;}
  if(isTouch)mw=Math.min(mw,150),mh=mh*(mw/200);
  // touch mode: minimap moves top-right so the joystick never covers it
  var mx=W-mw-14,my=isTouch?76:H-mh-14;
  ctx.globalAlpha=0.92;
  ctx.fillStyle='rgba(10,13,18,0.85)';rr(ctx,mx-6,my-6,mw+12,mh+12,4);ctx.fill();
  ctx.strokeStyle='#333b47';ctx.lineWidth=1;rr(ctx,mx-6,my-6,mw+12,mh+12,4);ctx.stroke();
  ctx.drawImage(mmCv,mx,my,mw,mh);
  ctx.globalAlpha=1;
  var sc=mw/MAP_W;
  var cf=(NET.mode==='guest')?VIEW.coffee:null;
  for(var i=0;i<COFFEES.length;i++){
    var ch=cf?(cf[i]!==undefined?cf[i]:0):COFFEES[i].charges;
    ctx.fillStyle=ch>0?'#3fb950':'#444c56';
    ctx.fillRect(mx+COFFEES[i].x*sc-2,my+COFFEES[i].y*sc-2,4,4);
  }
  var mobs=worldPool('mobs');
  ctx.fillStyle='#c23b32';
  for(i=0;i<mobs.length;i++)ctx.fillRect(mx+mobs[i].x*sc-1,my+mobs[i].y*sc-1,2.5,2.5);
  var boss=(NET.mode==='guest')?VIEW.boss:G.boss;
  if(boss){ctx.fillStyle='#e5534b';ctx.beginPath();ctx.arc(mx+boss.x*sc,my+boss.y*sc,4,0,TAU);ctx.fill();}
  var players=worldPool('players');
  for(i=0;i<players.length;i++){
    ctx.fillStyle=players[i].id===NET.myId?'#e6edf3':PCOLORS[i%4];
    if(players[i].dead)ctx.fillStyle='#555';
    ctx.beginPath();ctx.arc(mx+players[i].x*sc,my+players[i].y*sc,3,0,TAU);ctx.fill();
  }
}
function render(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,cv.width,cv.height);
  if(localPlayer()||VIEW.players.length){
    drawWorld();drawGlows();drawLighting();drawPost();drawHUD();
  }else{
    applyScreenT();
    ctx.fillStyle='#05070a';ctx.fillRect(0,0,cv.width/DPR,cv.height/DPR);
  }
}
