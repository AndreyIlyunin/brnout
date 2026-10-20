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
    ctx.globalAlpha=1-Math.max(0,mobs[i].fade||0); // проявление после спавна
    if(mobs[i].type==='deadline')drawDeadline(mobs[i],NET.mode==='guest');
    else drawIntern(mobs[i],NET.mode==='guest');
    ctx.globalAlpha=1;
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
  if(lightCv.width!==Math.max(2,Math.round(cv.width*sc))||lightCv.height!==Math.max(2,Math.round(cv.height*sc))){lightCv.width=Math.max(2,Math.round(cv.width*sc));lightCv.height=Math.max(2,Math.round(cv.height*sc));}
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
  for(var gi=0;gi<mobs.length;gi++)if(mobs[gi].type==='deadline')glow(mobs[gi].x,mobs[gi].y,60,'rgba(255,130,30,A)',0.10+0.03*Math.sin(G.t*9));
  // уютные лампы: тёплые и холодные
  for(gi=0;gi<LIGHTS.length;gi++){var L2=LIGHTS[gi];
    if(L2.dead)continue;
    if(gi%2)glow(L2.x,L2.y,84,'rgba(255,190,110,A)',0.045);
    else glow(L2.x,L2.y,92,'rgba(110,212,224,A)',0.035);
  }
  for(gi=0;gi<G.fx.length;gi++){var f=G.fx[gi];
    if(f.type==='ember')glow(f.x,f.y,14,'rgba(255,150,50,A)',0.25*(1-f.t/f.life));
  }
  for(gi=0;gi<COFFEES.length;gi++)if(COFFEES[gi].charges>0)glow(COFFEES[gi].x,COFFEES[gi].y,70,'rgba(80,220,120,A)',0.07);
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
function pixFont(px,bold){
  return (bold?'700 ':'400 ')+px+'px "Pixelify Sans",Arial,sans-serif';
}
function drawCup(x,y,s,fill){
  hctx.save();hctx.translate(x,y);hctx.scale(s,s);
  hctx.strokeStyle='#c9d1d9';hctx.lineWidth=2;
  hctx.fillStyle='#12161c';rr(ctx,-14,-18,28,34,4);hctx.fill();hctx.stroke();
  var fh=30*clamp(fill,0,1);
  hctx.fillStyle='#6f4a23';hctx.fillRect(-12,14-fh,24,fh);
  if(fill>0.05){hctx.fillStyle='#8a5a2b';hctx.fillRect(-12,14-fh,24,2);}
  hctx.beginPath();hctx.arc(16,-2,7,-1.3,1.3);hctx.stroke();
  if(fill>0.25){
    hctx.strokeStyle='rgba(200,200,200,0.35)';hctx.lineWidth=1.5;
    hctx.beginPath();hctx.moveTo(-5,-22);hctx.quadraticCurveTo(-8,-28,-5,-34);
    hctx.moveTo(5,-22);hctx.quadraticCurveTo(2,-28,5,-34);hctx.stroke();
  }
  hctx.restore();
}
function drawHUD(){
  hctx.setTransform(DPR,0,0,DPR,0,0);
  var W=bhud.width/DPR,H=bhud.height/DPR,p=localPlayer();
  if(!p)return;
  hctx.textAlign='left';
  var narrow=W<640;
  var bx=16,by=H-58,bw=narrow?130:210,bh=18;
  hctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,bx-8,by-26,narrow?bw+96:bw+120,bh+40,6);hctx.fill();
  var jit=p.burnout>70?R()*3-1.5:0;
  hctx.font=pixFont(13,true);hctx.fillStyle=p.burnout>70?'#e5534b':'#8b949e';
  hctx.fillText('ВЫГОРАНИЕ',bx,by-12);
  hctx.fillStyle='#12161c';rr(ctx,bx,by,bw,bh,3);hctx.fill();
  hctx.strokeStyle='#333b47';hctx.lineWidth=1;rr(ctx,bx,by,bw,bh,3);hctx.stroke();
  var fillW=bw*clamp(p.burnout/100,0,1);
  if(fillW>2){
    hctx.save();rr(ctx,bx,by,bw,bh,3);hctx.clip();
    var grad=hctx.createLinearGradient(bx,0,bx+bw,0);
    grad.addColorStop(0,'#6b7280');grad.addColorStop(0.5,'#b45309');grad.addColorStop(1,'#dc2626');
    hctx.fillStyle=grad;hctx.fillRect(bx+jit,by+jit*0.5,fillW,bh);hctx.restore();
  }
  hctx.font=pixFont(15,true);hctx.fillStyle='#e6edf3';
  hctx.fillText(Math.round(p.burnout)+'%',bx+bw+8,by+14);
  drawCup(bx+bw+(narrow?42:58),by+10,narrow?0.85:1.05,p.coffee/(p.coffeeMax||100));
  hctx.font=pixFont(13,true);hctx.fillStyle='#8b949e';
  hctx.fillText(narrow?('☕'+Math.round(p.coffee)):('КОФЕ '+Math.round(p.coffee)),bx+bw+(narrow?64:80),by+38);
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
    hctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,x,sy,slotW,52,6);hctx.fill();
    hctx.strokeStyle='#333b47';rr(ctx,x,sy,slotW,52,6);hctx.stroke();
    if(s.cd>0){hctx.fillStyle='rgba(0,0,0,0.6)';hctx.fillRect(x,sy,slotW,52*Math.min(1,s.cd/s.cdm));}
    hctx.font=pixFont(11,true);hctx.fillStyle='#d29922';hctx.textAlign='center';
    hctx.fillText(isTouch?['АТК','ПРИЁМ','УЛЬТА','СКИЛ'][i]:'['+['ЛКМ','ПКМ','ПРОБЕЛ','Q'][i]+']',x+slotW/2,sy+16);
    hctx.font=pixFont(11);hctx.fillStyle='#c9d1d9';
    hctx.fillText(s.n,x+slotW/2,sy+30);
    hctx.font=pixFont(10);hctx.fillStyle=s.cost>0&&p.coffee<s.cost?'#e5534b':'#6e7681';
    hctx.fillText(s.cost>0?s.cost+' ☕':'—',x+slotW/2,sy+44);
    hctx.textAlign='left';
  }
  if(p.haste>0){
    hctx.fillStyle='rgba(139,209,124,'+(0.7+0.3*Math.sin(G.t*10))+')';hctx.font='bold 11px Arial';
    hctx.fillText('АСАП! +55%',bx+bw+(narrow?64:80),by-6);
  }
  if(isTouch&&localNearCoffee())document.getElementById('btnCoffee').classList.remove('hidden');
  else document.getElementById('btnCoffee').classList.add('hidden');
  hctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,12,12,190,52,6);hctx.fill();
  hctx.font=pixFont(16,true);hctx.fillStyle='#e6edf3';
  hctx.fillText('СПРИНТ '+G.wave,24,34);
  var remG=(NET.mode==='guest')?VIEW.mobs.length:(G.spawnQ.length+G.mobs.length);
  hctx.font=pixFont(12);hctx.fillStyle='#8b949e';
  hctx.fillText('задач в очереди: '+remG,24,52);
  hctx.fillStyle='rgba(10,13,18,0.75)';rr(ctx,W-160,12,148,52,6);hctx.fill();
  hctx.font=pixFont(16,true);hctx.fillStyle='#d29922';
  hctx.fillText('OKR: '+G.okr,W-148,34);
  hctx.font=pixFont(12);hctx.fillStyle='#8b949e';
  hctx.fillText('грейд '+G.grade+' · ✦ '+(p.coins||0),W-148,52);
  // комбо-счётчик
  if(G.combo>1){
    var cbs=1+0.1*Math.sin(G.t*12);
    hctx.save();
    hctx.translate(W/2,86);
    hctx.scale(cbs,cbs);
    hctx.font=pixFont(24,true);
    hctx.fillStyle='rgba(255,207,92,'+(0.75+0.25*Math.sin(G.t*9))+')';
    hctx.strokeStyle='rgba(0,0,0,0.6)';hctx.lineWidth=3;
    hctx.textAlign='center';
    var cbt='×'+G.combo+' '+(COMBONAMES[G.combo]||'');
    hctx.strokeText(cbt,0,0);
    hctx.fillText(cbt,0,0);
    hctx.restore();
    hctx.textAlign='left';
    // таймер-полоса
    hctx.fillStyle='rgba(10,13,18,0.6)';rr(ctx,W/2-40,96,80,5,2);hctx.fill();
    hctx.fillStyle='#ffcf5c';hctx.fillRect(W/2-40,96,80*clamp(G.comboT/3,0,1),5);
  }
  if(p.adr){
    hctx.fillStyle='rgba(229,83,75,'+(0.6+0.4*Math.sin(G.t*10))+')';
    hctx.font='bold 12px Arial';
    hctx.fillText('ПЕРЕДОЗ КОФЕИНА: +20% скор, +25% урон',bx,by-34);
  }
  var players=worldPool('players');
  if(players.length>1){
    var tw=0;
    for(var j=0;j<players.length;j++)if(players[j].id!==NET.myId)tw++;
    var tx0=W/2-(tw*110)/2,drawn=0;
    for(j=0;j<players.length;j++){var tp=players[j];
      if(tp.id===NET.myId)continue;
      var x0=tx0+drawn*110;drawn++;
      hctx.fillStyle='rgba(10,13,18,0.7)';rr(ctx,x0,10,104,26,4);hctx.fill();
      var pi=0;
      for(var q=0;q<players.length;q++)if(players[q]===tp)pi=q;
      hctx.fillStyle=PCOLORS[pi%4];hctx.fillRect(x0+6,16,6,6);
      hctx.fillStyle='#12161c';hctx.fillRect(x0+18,22,80,6);
      hctx.fillStyle=tp.dead?'#444':'#c23b32';hctx.fillRect(x0+18,22,80*clamp(tp.burnout/100,0,1),6);
      if(tp.dead){hctx.fillStyle='#8b949e';hctx.font='9px Arial';hctx.fillText('сгорел',x0+20,20);}
      hctx.fillStyle='#8bd17c';hctx.fillRect(x0+18,16,80*clamp(tp.coffee/(tp.coffeeMax||100),0,1),3);
    }
  }
  var boss=(NET.mode==='guest')?VIEW.boss:G.boss;
  if(boss){
    var hpF=(NET.mode==='guest')?(boss.hpF||0):clamp(boss.hp/boss.hpMax,0,1);
    var bbw=380,bbx=W/2-bbw/2,bby=54;
    hctx.fillStyle='rgba(10,13,18,0.8)';rr(ctx,bbx-10,bby-6,bbw+20,40,6);hctx.fill();
    hctx.font=pixFont(13,true);hctx.fillStyle='#e5534b';hctx.textAlign='center';
    hctx.fillText('РЕГЛЯТОРКА / АУДИТ'+(G.bossN>1?' (повторный, с правками)':''),W/2,bby+10);hctx.textAlign='left';
    hctx.fillStyle='#12161c';rr(ctx,bbx,bby+16,bbw,12,2);hctx.fill();
    hctx.fillStyle='#c23b32';hctx.save();rr(ctx,bbx,bby+16,bbw,12,2);hctx.clip();
    hctx.fillRect(bbx,bby+16,bbw*hpF,12);hctx.restore();
  }
  if(G.msgT>0){
    hctx.globalAlpha=Math.min(1,G.msgT);hctx.font=pixFont(17,true);hctx.fillStyle='#e6edf3';hctx.textAlign='center';
    hctx.fillText(G.msg,W/2,H*0.24);hctx.textAlign='left';hctx.globalAlpha=1;
  }
  if(p.dead){
    hctx.fillStyle='rgba(10,13,18,0.8)';rr(ctx,W/2-130,H/2-20,260,44,6);hctx.fill();
    hctx.fillStyle='#e5534b';hctx.font='bold 14px Arial';hctx.textAlign='center';
    hctx.fillText('ВЫ СГОРЕЛИ. Возрождение после спринта.',W/2,H/2+6);hctx.textAlign='left';
  }
  if(G.caption){
    hctx.globalAlpha=Math.min(0.8,G.capT*0.3);hctx.font=pixFont(12);hctx.fillStyle='#7d8590';
    if(isTouch){hctx.textAlign='left';hctx.fillText(G.caption,16,H-96);}
    else{hctx.textAlign='center';hctx.fillText(G.caption,W/2,H-12);}
    hctx.textAlign='left';hctx.globalAlpha=1;
  }
  if(NET.mode!=='solo'){
    hctx.fillStyle='rgba(139,148,158,0.8)';hctx.font='10px Arial';
    hctx.fillText(NET.mode==='host'?'P2P-ХОСТ · код '+NET.code:'P2P-КЛИЕНТ',W-160,74);
  }
  if(VIEW.paused&&NET.mode==='guest'){
    hctx.fillStyle='rgba(5,7,10,0.6)';hctx.fillRect(0,0,W,H);
    hctx.fillStyle='#d29922';hctx.font='bold 20px Arial';hctx.textAlign='center';
    hctx.fillText('ХОСТ НА ПАУЗЕ',W/2,H/2);hctx.textAlign='left';
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
  hctx.setTransform(DPR,0,0,DPR,0,0);
  var W=bhud.width/DPR,H=bhud.height/DPR;
  var mw=200,mh=mmCv.height*(mw/mmCv.width);
  if(mh>190){mw=mw*190/mh;mh=190;}
  if(isTouch)mw=Math.min(mw,150),mh=mh*(mw/200);
  // touch mode: minimap moves top-right so the joystick never covers it
  var mx=W-mw-14,my=isTouch?76:H-mh-14;
  hctx.globalAlpha=0.92;
  hctx.fillStyle='rgba(10,13,18,0.85)';rr(ctx,mx-6,my-6,mw+12,mh+12,4);hctx.fill();
  hctx.strokeStyle='#333b47';hctx.lineWidth=1;rr(ctx,mx-6,my-6,mw+12,mh+12,4);hctx.stroke();
  hctx.drawImage(mmCv,mx,my,mw,mh);
  hctx.globalAlpha=1;
  var sc=mw/MAP_W;
  var cf=(NET.mode==='guest')?VIEW.coffee:null;
  for(var i=0;i<COFFEES.length;i++){
    var ch=cf?(cf[i]!==undefined?cf[i]:0):COFFEES[i].charges;
    hctx.fillStyle=ch>0?'#3fb950':'#444c56';
    hctx.fillRect(mx+COFFEES[i].x*sc-2,my+COFFEES[i].y*sc-2,4,4);
  }
  var mobs=worldPool('mobs');
  hctx.fillStyle='#c23b32';
  for(i=0;i<mobs.length;i++)hctx.fillRect(mx+mobs[i].x*sc-1,my+mobs[i].y*sc-1,2.5,2.5);
  var boss=(NET.mode==='guest')?VIEW.boss:G.boss;
  if(boss){hctx.fillStyle='#e5534b';hctx.beginPath();hctx.arc(mx+boss.x*sc,my+boss.y*sc,4,0,TAU);hctx.fill();}
  var players=worldPool('players');
  for(i=0;i<players.length;i++){
    hctx.fillStyle=players[i].id===NET.myId?'#e6edf3':PCOLORS[i%4];
    if(players[i].dead)hctx.fillStyle='#555';
    hctx.beginPath();hctx.arc(mx+players[i].x*sc,my+players[i].y*sc,3,0,TAU);hctx.fill();
  }
}
function render(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,cv.width,cv.height);
  hctx.setTransform(DPR,0,0,DPR,0,0);
  hctx.clearRect(0,0,bhud.width/DPR,bhud.height/DPR);
  if(localPlayer()||VIEW.players.length){
    drawWorld();drawGlows();drawLighting();drawPost();
    drawHUD();
  }else{
    applyScreenT();
    ctx.fillStyle='#05070a';ctx.fillRect(0,0,cv.width,cv.height);
  }
}
