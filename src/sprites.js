'use strict';
// ============================== sprites (GTA2-style layered humanoids) ==============================
// пиксельный рендер моделей: рисуем в мелкий оффскрин, блиним крупными чанками.
// Мир, свет и тексты остаются чёткими — чанки только у персонажей.
var SPRCV=document.createElement('canvas');SPRCV.width=160;SPRCV.height=160;
var SPRC=SPRCV.getContext('2d');
var SPR_SCALE=0.5; // 1 модельный пиксель = 2 мировых
function pixWrap(o,fn){
  var sc=o.scale||1;
  SPRC.setTransform(1,0,0,1,0,0);
  SPRC.clearRect(0,0,160,160);
  SPRC.save();
  SPRC.translate(80,80);
  SPRC.scale(SPR_SCALE*sc,SPR_SCALE*sc);
  var o2={};for(var k in o)o2[k]=o[k];
  o2.x=0;o2.y=0;o2.scale=1;
  fn(SPRC,o2);
  SPRC.restore();
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(SPRCV,Math.round(o.x-80),Math.round(o.y-80));
  ctx.restore();
}
function drawHumanoid(c,o){
  if(c===ctx){pixWrap(o,drawHumanoidBody);return;}
  drawHumanoidBody(c,o);
}
function drawHumanoidBody(c,o){
  var s=o.scale||1,L=o.look,f=o.face||0;
  var frenzy=o.casting==='type';
  var cast=o.castT>0;
  c.save();c.translate(o.x,o.y);
  c.fillStyle='rgba(0,0,0,0.38)';c.beginPath();c.ellipse(2*s,4*s,14*s,9*s,0,0,TAU);c.fill();
  // haste trail
  if(o.haste>0){
    c.strokeStyle='rgba(139,209,124,'+(0.3+0.15*Math.sin(G.t*14))+')';c.lineWidth=2;
    c.beginPath();c.arc(0,0,19*s,0,TAU);c.stroke();
  }
  c.rotate(f+Math.PI/2);
  var mv=o.moving?1:0;
  var ph=(o.step||0)*TAU;
  var sw=Math.sin(ph)*3*mv,sway=Math.sin(ph)*0.07*mv;
  c.rotate(sway);
  if(frenzy)c.rotate(Math.sin(G.t*26)*0.04);
  // ноги + обувь: стопы шагают ВДОЛЬ направления движения (−y = вперёд)
  var sexy=o.cls==='dsn';
  var stepF=Math.sin(ph)*3.5*mv;
  if(o.cls==='dev'){
    // джинсы
    c.fillStyle='#3d5a80';
    rr(c,-7*s,2*s,5.6*s,8*s,2*s);c.fill();
    rr(c,1.4*s,2*s,5.6*s,8*s,2*s);c.fill();
    c.fillStyle='rgba(255,255,255,0.12)';
    c.fillRect(-5.6*s,4*s,1.6*s,4*s);c.fillRect(3.2*s,4*s,1.6*s,4*s);
    // белые кросы с тёмной подошвой
    c.fillStyle='#e8e8ee';
    rr(c,-7.6*s,9*s+stepF*s,6.8*s,4.6*s,2.2*s);c.fill();
    rr(c,0.8*s,9*s-stepF*s,6.8*s,4.6*s,2.2*s);c.fill();
    c.fillStyle='#23262e';
    c.fillRect(-7.6*s,12.2*s+stepF*s,6.8*s,1.4*s);c.fillRect(0.8*s,12.2*s-stepF*s,6.8*s,1.4*s);
    c.fillStyle=L.accent;
    c.fillRect(-6.2*s,10*s+stepF*s,4.4*s,1.2*s);c.fillRect(2.2*s,10*s-stepF*s,4.4*s,1.2*s);
  }else if(o.cls==='mgr'){
    // брюки со стрелками
    c.fillStyle='#2f3542';
    rr(c,-6.9*s,2*s,5.2*s,8.6*s,2*s);c.fill();
    rr(c,1.7*s,2*s,5.2*s,8.6*s,2*s);c.fill();
    c.strokeStyle='rgba(255,255,255,0.16)';c.lineWidth=1;
    c.beginPath();c.moveTo(-4.3*s,3*s);c.lineTo(-4.3*s,9.6*s);c.moveTo(4.3*s,3*s);c.lineTo(4.3*s,9.6*s);c.stroke();
    // остроносые туфли с бликом и пряжкой
    c.fillStyle='#3a2a1a';
    c.beginPath();
    c.moveTo(-6.9*s,9.4*s+stepF*s);c.lineTo(-1.1*s,9.4*s+stepF*s);
    c.lineTo(-0.2*s,11.6*s+stepF*s);c.lineTo(-7.8*s,11.6*s+stepF*s);c.closePath();c.fill();
    c.beginPath();
    c.moveTo(1.1*s,9.4*s-stepF*s);c.lineTo(6.9*s,9.4*s-stepF*s);
    c.lineTo(7.8*s,11.6*s-stepF*s);c.lineTo(0.2*s,11.6*s-stepF*s);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,0.18)';
    c.fillRect(-6*s,9.9*s+stepF*s,3.4*s,1*s);c.fillRect(2.6*s,9.9*s-stepF*s,3.4*s,1*s);
    c.fillStyle='#ffcf5c';
    c.fillRect(-4.4*s,10.4*s+stepF*s,1.2*s,1*s);c.fillRect(3.2*s,10.4*s-stepF*s,1.2*s,1*s);
  }else if(o.cls==='mkt'){
    // чиносы + замшевые броги с перфорацией
    c.fillStyle='#7a6848';
    rr(c,-6.9*s,2*s,5.2*s,8.6*s,2*s);c.fill();
    rr(c,1.7*s,2*s,5.2*s,8.6*s,2*s);c.fill();
    c.fillStyle='#5d4f36';
    c.fillRect(-6.9*s,8*s,5.2*s,2.6*s);c.fillRect(1.7*s,8*s,5.2*s,2.6*s);
    c.fillStyle='#8a5a2a';
    c.beginPath();c.moveTo(-6.9*s,9.4*s+stepF*s);c.lineTo(-1.3*s,9.4*s+stepF*s);c.lineTo(-0.4*s,11.5*s+stepF*s);c.lineTo(-7.6*s,11.5*s+stepF*s);c.closePath();c.fill();
    c.beginPath();c.moveTo(1.3*s,9.4*s-stepF*s);c.lineTo(6.9*s,9.4*s-stepF*s);c.lineTo(7.6*s,11.5*s-stepF*s);c.lineTo(0.4*s,11.5*s-stepF*s);c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,0.35)';
    c.fillRect(-5.6*s,10.2*s+stepF*s,0.9*s,0.9*s);c.fillRect(-4*s,10.2*s+stepF*s,0.9*s,0.9*s);
    c.fillRect(3.2*s,10.2*s-stepF*s,0.9*s,0.9*s);c.fillRect(4.8*s,10.2*s-stepF*s,0.9*s,0.9*s);
  }else if(sexy){
    // сапожки на каблучке
    c.fillStyle='#241d2e';
    rr(c,-7*s,5*s+stepF*s,6*s,7*s,2*s);c.fill();
    rr(c,1*s,5*s-stepF*s,6*s,7*s,2*s);c.fill();
    c.fillRect(-7*s,11*s+stepF*s,1.5*s,2.6*s);
    c.fillRect(5.5*s,11*s-stepF*s,1.5*s,2.6*s);
  }else{
    // остальные (интерны): джинсы + простые кросы
    c.fillStyle='#43506b';
    rr(c,-7*s,2*s,5.6*s,8*s,2*s);c.fill();
    rr(c,1.4*s,2*s,5.6*s,8*s,2*s);c.fill();
    c.fillStyle='#d8d8de';
    rr(c,-7.4*s,9*s+stepF*s,6.6*s,4.4*s,2*s);c.fill();
    rr(c,0.8*s,9*s-stepF*s,6.6*s,4.4*s,2*s);c.fill();
    c.fillStyle='#2a2d34';
    c.fillRect(-7.4*s,12*s+stepF*s,6.6*s,1.4*s);c.fillRect(0.8*s,12*s-stepF*s,6.6*s,1.4*s);
  }
  // torso — дизайнер: цельное платье А-силуэта
  if(sexy){
    var gs=c.createLinearGradient(-11*s,0,11*s,0);
    gs.addColorStop(0,shade(L.shirt,-24));gs.addColorStop(0.5,L.shirt);gs.addColorStop(1,shade(L.shirt,-24));
    c.fillStyle=gs;
    c.beginPath();
    c.moveTo(-8.5*s,-10*s);c.lineTo(8.5*s,-10*s);
    c.lineTo(12*s,7*s);c.lineTo(-12*s,7*s);c.closePath();c.fill();
    c.strokeStyle='rgba(0,0,0,0.4)';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#241d2e';c.fillRect(-9.6*s,-3*s,19.2*s,2*s);       // пояс
    c.fillStyle=L.accent;c.fillRect(-1.6*s,-3.5*s,3.2*s,3*s);      // пряжка
    c.fillStyle=shade(L.shirt,26);                                  // воротник
    c.beginPath();c.moveTo(-4*s,-10*s);c.lineTo(0,-6.4*s);c.lineTo(4*s,-10*s);c.closePath();c.fill();
    c.strokeStyle=L.accent;c.lineWidth=1.1*s;                       // кайма подола
    c.beginPath();c.moveTo(-10.4*s,4.8*s);c.lineTo(10.4*s,4.8*s);c.stroke();
    c.fillStyle='#8a4a5e';                                          // сумочка
    rr(c,9*s,-2*s,4.6*s,6*s,1.5*s);c.fill();
    c.strokeStyle='rgba(0,0,0,0.35)';c.lineWidth=0.8*s;
    c.beginPath();c.arc(11.3*s,-2*s,3*s,Math.PI,TAU);c.stroke();
  }else{
    var g1=c.createLinearGradient(-12*s,0,12*s,0);
    g1.addColorStop(0,shade(L.shirt,-22));g1.addColorStop(0.5,L.shirt);g1.addColorStop(1,shade(L.shirt,-22));
    c.fillStyle=g1;
    rr(c,-12*s,-10*s,24*s,19*s,8*s);c.fill();
    c.strokeStyle='rgba(0,0,0,0.45)';c.lineWidth=1.5;c.stroke();
    c.fillStyle='rgba(255,255,255,0.1)';c.fillRect(-9*s,-10*s,18*s,2.2*s); // блик по плечам
  }
  if(o.cls==='mkt'){ // пиджак: лацканы + платок
    c.fillStyle=shade(L.shirt,-32);
    c.beginPath();c.moveTo(-6*s,-10*s);c.lineTo(-1*s,-2*s);c.lineTo(-7.6*s,-1*s);c.closePath();c.fill();
    c.beginPath();c.moveTo(6*s,-10*s);c.lineTo(1*s,-2*s);c.lineTo(7.6*s,-1*s);c.closePath();c.fill();
    c.strokeStyle='rgba(0,0,0,0.35)';c.lineWidth=1;
    c.beginPath();c.moveTo(-6*s,-10*s);c.lineTo(-1*s,-2*s);c.moveTo(6*s,-10*s);c.lineTo(1*s,-2*s);c.stroke();
    c.fillStyle='rgba(255,255,255,0.16)';c.fillRect(-9*s,-7.5*s,2.4*s,2.4*s);
  }
  if(o.cls==='intern'){ // рюкзак с проекта
    c.fillStyle=shade(L.shirt,-26);
    rr(c,-7.5*s,0.5*s,15*s,7*s,2.5*s);c.fill();
    c.strokeStyle='rgba(0,0,0,0.4)';c.lineWidth=1.2;
    rr(c,-7.5*s,0.5*s,15*s,7*s,2.5*s);c.stroke();
    c.fillStyle=L.accent;c.fillRect(-7.5*s,2.6*s,15*s,1.4*s);
    c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(-2.4*s,4.4*s,4.8*s,2.2*s);
  }
  // accent: галстук / шнурки худи
  if(o.cls==='mgr'||o.bossTie){
    // комично длинный галстук — развевается ниже пояса
    var flut=Math.sin(G.t*7)*1.6*s+Math.sin(ph)*1*s*mv;
    c.fillStyle=L.accent;
    c.beginPath();
    c.moveTo(0,-10*s);
    c.lineTo(2.7*s+flut*0.3,-1*s);
    c.lineTo(3.4*s+flut,6*s);
    c.lineTo(0.6*s+flut,7.4*s);
    c.lineTo(-0.6*s+flut*0.8,6*s);
    c.lineTo(-2.7*s+flut*0.3,-1*s);
    c.closePath();c.fill();
    c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(-0.8*s+flut*0.6,2*s,1.6*s,2.4*s); // узор
    if(o.cls==='mgr'){ // воротник рубашки + бейдж на груди
      c.fillStyle='rgba(255,255,255,0.75)';
      c.beginPath();c.moveTo(-4.5*s,-10*s);c.lineTo(-1.2*s,-7.6*s);c.lineTo(-4*s,-6.2*s);c.closePath();c.fill();
      c.beginPath();c.moveTo(4.5*s,-10*s);c.lineTo(1.2*s,-7.6*s);c.lineTo(4*s,-6.2*s);c.closePath();c.fill();
      c.strokeStyle='#8b949e';c.lineWidth=0.8*s;
      c.beginPath();c.moveTo(5*s,-9*s);c.lineTo(4*s,-5.4*s);c.stroke();
      c.fillStyle='#d8dce2';rr(c,2.9*s,-5.6*s,3.4*s,2.6*s,0.6*s);c.fill();
      c.fillStyle='#c23b32';c.fillRect(3.1*s,-5.3*s,1.2*s,0.9*s);
      c.fillStyle='#6e7681';c.fillRect(4.5*s,-5.2*s,1.5*s,0.5*s);
    }
  }else{
    c.strokeStyle=L.accent;c.lineWidth=1.6;c.lineCap='round';
    c.beginPath();c.moveTo(-2*s,-8*s);c.lineTo(-2.4*s,-3*s);c.moveTo(2*s,-8*s);c.lineTo(2.4*s,-3*s);c.stroke();
  }
  // arms toward hold point; frenzy = alternating hammering
  function arm(sx,side){
    var hy2=-15*s;
    if(frenzy)hy2=-14*s+Math.sin(G.t*30+side*Math.PI)*3.5*s;
    if(cast)hy2=-17*s;
    c.strokeStyle=shade(L.shirt,-10);c.lineWidth=5*s;c.lineCap='round';
    c.beginPath();c.moveTo(sx,-6*s);c.quadraticCurveTo(sx*1.15,-13*s,sx*0.22,hy2);c.stroke();
    c.fillStyle=L.skin;c.beginPath();c.arc(sx*0.22,hy2,2.6*s,0,TAU);c.fill();
  }
  arm(sexy?-8.5*s:-11*s,0);arm(sexy?8.5*s:11*s,1);
  // head
  c.fillStyle=L.skin;c.beginPath();c.arc(0,-3*s,7.5*s,0,TAU);c.fill();
  c.strokeStyle='rgba(0,0,0,0.25)';c.lineWidth=1;c.stroke();
  c.fillStyle='rgba(255,255,255,0.15)'; // световой блик на голове
  c.beginPath();c.arc(-1.8*s,-4.6*s,5.2*s,Math.PI*1.05,Math.PI*1.7);c.lineTo(-1.8*s,-4.6*s);c.closePath();c.fill();
  if(sexy){
    // чёлка-полумесяц спереди + высокий хвост НАЗАД
    c.fillStyle=L.hair;
    c.beginPath();
    c.arc(0,-3.2*s,7.4*s,Math.PI,TAU,false);
    c.arc(0,-3.2*s,4.4*s,TAU,Math.PI,true);
    c.closePath();c.fill();
    c.beginPath();c.arc(0,1.4*s,3.6*s,0,TAU);c.fill();
    c.beginPath();
    c.moveTo(1.6*s,2.2*s);
    c.quadraticCurveTo(4.6*s,4.6*s,3.6*s,8.4*s);
    c.quadraticCurveTo(1.6*s,5.8*s,0.2*s,3*s);
    c.closePath();c.fill();
    c.fillStyle=L.accent;
    c.beginPath();c.arc(0,0.4*s,1.3*s,0,TAU);c.fill();
  }else
  {c.fillStyle=L.hair;
  if(L.hs===0){
    c.beginPath();c.arc(0,-3*s,7.5*s,Math.PI*0.15,Math.PI*0.85,false);
    c.arc(0,-4*s,4.6*s,Math.PI*0.85,Math.PI*0.15,true);c.closePath();c.fill();
  }else if(L.hs===1){
    c.beginPath();c.arc(0,-2.4*s,8.2*s,0,TAU);c.fill();
    c.fillStyle=shade(L.shirt,14);c.beginPath();c.arc(0,-6.4*s,4.4*s,0,TAU);c.fill();
  }else if(L.hs===2){
    c.beginPath();c.arc(0,1.8*s,3.6*s,0,TAU);c.fill();
    c.beginPath();c.arc(0,-4*s,7.5*s,Math.PI*0.1,Math.PI*0.9,false);c.lineTo(0,-4*s);c.closePath();c.fill();
  }else{
    c.fillStyle='#8a2a2a';c.beginPath();c.arc(0,-4.4*s,6.9*s,Math.PI,TAU);c.fill();
    c.fillStyle='#22262e';c.fillRect(-7*s,-5.4*s,14*s,2*s);
  }}
  if(o.cls==='dsn'){ // дизайнер: чокер, визор, серьга, румянец
    c.fillStyle='#241d2e';
    c.fillRect(-3.4*s,-10*s,6.8*s,1.6*s);
    c.fillStyle='#1a1d22';
    rr(c,-6.8*s,-5*s,13.6*s,3.2*s,1.6*s);c.fill();
    c.fillStyle='rgba(95,208,192,0.9)';
    c.fillRect(-5.6*s,-4.6*s,4.4*s,2.4*s);
    c.fillRect(1.2*s,-4.6*s,4.4*s,2.4*s);
    c.fillStyle='rgba(212,106,142,0.5)';
    c.beginPath();c.arc(-4.6*s,-0.4*s,1.1*s,0,TAU);c.arc(4.6*s,-0.4*s,1.1*s,0,TAU);c.fill();
    c.fillStyle='#ffcf5c';c.beginPath();c.arc(7*s,0.4*s,1.2*s,0,TAU);c.fill();
  }else if(o.cls==='dev'){ // мистер робот: завязки капюшона + круги под глазами
    c.strokeStyle=L.accent;c.lineWidth=1.3*s;c.lineCap='round';
    c.beginPath();c.moveTo(-2.2*s,-9.2*s);c.lineTo(-2.8*s,-5.6*s);c.moveTo(2.2*s,-9.2*s);c.lineTo(2.8*s,-5.6*s);c.stroke();
    c.fillStyle=L.accent;
    c.beginPath();c.arc(-2.8*s,-5.2*s,0.9*s,0,TAU);c.arc(2.8*s,-5.2*s,0.9*s,0,TAU);c.fill();
    c.fillStyle='rgba(20,18,26,0.5)';
    c.beginPath();c.ellipse(-3.4*s,-1.4*s,1.9*s,1*s,0,0,TAU);c.ellipse(3.4*s,-1.4*s,1.9*s,1*s,0,0,TAU);c.fill();
  }else if(o.cls==='mkt'){ // шарф маркетолога
    c.fillStyle=L.accent;
    rr(c,-6.8*s,-10.8*s,13.6*s,3.8*s,1.5*s);c.fill();
    c.fillRect(3.6*s,-9.2*s,2.8*s,6.4*s);
    c.fillStyle='rgba(0,0,0,0.2)';c.fillRect(3.6*s,-9.2*s,2.8*s,1.2*s);
  }
  c.restore();
  // off-hand phone during shield
  if(o.shieldOn){
    c.save();c.translate(o.x+Math.cos(f+1.9)*13,o.y+Math.sin(f+1.9)*13);c.rotate(f+1.2);
    c.fillStyle='#22262e';rr(c,-3,-6,6,11,1);c.fill();
    c.fillStyle='#3fb950';c.fillRect(-2,-4,4,6);
    c.restore();
  }
  // weapon at hold point (world space, in front)
  if(o.weapon)drawWeapon(c,o,s);
}
// JIRA-значок (Atlassian): голубой шеврон-стрела
function drawJiraIcon(c,sc){
  c.save();c.scale(sc,sc);
  c.fillStyle='#2684FF';
  c.beginPath();
  c.moveTo(-4.6,2.6);c.lineTo(-1.6,-5.4);c.lineTo(0.8,-5.4);c.lineTo(-2.2,2.6);
  c.closePath();c.fill();
  c.fillStyle='#0052CC';
  c.beginPath();
  c.moveTo(-1,2.6);c.lineTo(2.6,-2.2);c.lineTo(4.8,-2.2);c.lineTo(2.9,2.6);
  c.closePath();c.fill();
  c.fillStyle='#2684FF';
  c.fillRect(-2.6,4,8,1.8);
  c.restore();
}
function drawWeapon(c,o,s){
  var f=o.face||0;
  var hx=o.x+Math.cos(f)*15*s,hy=o.y+Math.sin(f)*15*s;
  var frenzy=o.casting==='type';
  var swing=(o.atkT||0)>0?(o.atkT/0.2)*1.1:0;
  var cast=o.castT>0;
  c.save();c.translate(hx,hy);c.rotate(f+Math.PI/2+(swing?Math.sin(swing*3)*0.5:0));
  if(frenzy)c.rotate(Math.sin(G.t*44)*0.13);
  if(o.weapon==='keyboard'){
    c.translate(0,-6*s);
    c.rotate(-0.5+swing+(cast?-0.9:0));
    c.fillStyle='#3d4148';rr(c,-16*s,-8*s,32*s,15*s,2*s);c.fill();
    c.strokeStyle='#20242a';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#23262c';
    for(var ky=-5*s;ky<=5*s;ky+=3.4*s)for(var kx=-13*s;kx<=11*s;kx+=4.2*s)c.fillRect(kx,ky,3*s,2.4*s);
    c.strokeStyle='#d29922';c.lineWidth=1.4;
    c.strokeRect(-16*s,-8*s,32*s,15*s);
    if(frenzy){
      var ky2=((G.t*16)|0)%2?-5*s:5*s;
      c.fillStyle='#d29922';c.fillRect(-2*s,ky2-1.5*s,5*s,3*s);
      c.fillStyle='rgba(210,153,34,0.5)';
      c.beginPath();c.arc(-9*s,ky2,2.5*s,0,TAU);c.arc(9*s,ky2,2*s,0,TAU);c.fill();
    }
  }else if(o.weapon==='tickets'){
    // один крупный билет с жираф-логотипом
    c.rotate(-0.25+swing*0.5);
    c.fillStyle='#f2e6c8';rr(c,-6*s,-20*s,12*s,19*s,1.5*s);c.fill();
    c.strokeStyle='#b9a86f';c.lineWidth=1;rr(c,-6*s,-20*s,12*s,19*s,1.5*s);c.stroke();
    c.fillStyle='#c23b32';c.fillRect(-6*s,-20*s,12*s,3.4*s);
    c.strokeStyle='rgba(0,0,0,0.28)';c.setLineDash([1.5,1.5]);
    c.beginPath();c.moveTo(3.4*s,-16.6*s);c.lineTo(3.4*s,-1*s);c.stroke();
    c.setLineDash([]);
    c.save();c.translate(-0.6*s,-8.5*s);
    drawJiraIcon(c,0.95*s);
    c.restore();
  }else if(o.weapon==='plane'){ // твит-птичка в руке
    c.rotate(-0.2+swing*0.8);
    c.scale(0.85,0.85);
    c.fillStyle='#1d9bf0';
    c.beginPath();c.ellipse(0,0,6,4.6,-0.2,0,TAU);c.fill();
    c.beginPath();c.arc(4,-2.2,2.6,0,TAU);c.fill();
    c.fillStyle='#e8f6ff';
    c.beginPath();c.moveTo(6.4,-2.9);c.lineTo(9.2,-2);c.lineTo(6.2,-1.2);c.closePath();c.fill();
    c.beginPath();c.moveTo(-0.8,-0.8);c.quadraticCurveTo(-6,-5,-1.6,2.2);c.closePath();c.fill();
    c.fillStyle='#0c2a40';c.beginPath();c.arc(4.6,-2.6,0.8,0,TAU);c.fill();
  }else if(o.weapon==='stylus'){
    c.rotate(-0.4+swing*1.2);
    c.fillStyle='#e07030';rr(c,-2*s,-16*s,4*s,18*s,2*s);c.fill();
    c.fillStyle='#c9d1d9';c.beginPath();c.moveTo(-2*s,-16*s);c.lineTo(0,-21*s);c.lineTo(2*s,-16*s);c.closePath();c.fill();
    c.fillStyle='#22262e';c.fillRect(-2.5*s,0,5*s,3*s);
  }else if(o.weapon==='laptop'){
    c.fillStyle='#33383f';rr(c,-8*s,-7*s,16*s,12*s,1.5*s);c.fill();
    c.fillStyle='rgba(150,190,220,0.5)';c.fillRect(-6*s,-5*s,12*s,8*s);
    c.fillStyle='#22262c';c.fillRect(-2*s,5*s,4*s,2*s);
  }else if(o.weapon==='stamp'){
    c.fillStyle='#3a4049';c.fillRect(-3*s,-26*s,6*s,20*s);
    c.fillStyle='#c23b32';rr(c,-9*s,-10*s,18*s,10*s,2*s);c.fill();
    c.fillStyle='#e8e2d0';c.fillRect(-6*s,-8*s,12*s,3*s);
  }
  c.restore();
}
function drawPlayer(p,isMe){
  if(!p||p.dead)return;
  drawHumanoid(ctx,{x:p.x,y:p.y,face:p.face,step:p.step,look:p.look,cls:p.cls,scale:1.35,moving:p.moving,atkT:p.atkT,
    weapon:CLS[p.cls]?CLS[p.cls].weapon:'laptop',casting:(p.cls==='dev'&&p.qT>0)?'type':null,
    castT:p.castT||0,haste:p.haste||0,shieldOn:p.shield>0});
  if(!isMe){
    var pool=worldPool('players'),pi=0;
    for(var i=0;i<pool.length;i++)if(pool[i]===p)pi=i;
    ctx.strokeStyle=PCOLORS[pi%4];ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,21,0,TAU);ctx.stroke();
  }
  if(p.flash>0){ctx.fillStyle='rgba(229,83,75,'+(p.flash*0.5)+')';ctx.beginPath();ctx.arc(p.x,p.y,18,0,TAU);ctx.fill();}
  if(p.shield>0){
    var al=0.25+0.1*Math.sin(G.t*8);
    ctx.strokeStyle='rgba(122,162,200,'+(p.shield<1?p.shield*(al+0.15):(al+0.15))+')';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(p.x,p.y,300,0,TAU);ctx.stroke();
    if(isMe){
      ctx.fillStyle='rgba(200,220,240,0.8)';ctx.font='10px Arial';ctx.textAlign='center';
      ctx.fillText('☎ созвон…',p.x,p.y-34);ctx.textAlign='left';
    }
  }
}
function drawIntern(m,remote){
  var L=HOODIES[(m.tint||0)%HOODIES.length];
  var wob=Math.sin(G.t*2.4+(m.tilt||0))*0.12;
  var elite=m.elite;
  drawHumanoid(ctx,{x:m.x,y:m.y,face:(m.face||0)+wob,step:remote?G.t*2.6:(m.step||m.tilt||0),look:L,cls:'intern',scale:elite?1.55:1.15,moving:true,
    weapon:'laptop',casting:(m.cf>0)?'type':null});
  if(elite){
    ctx.strokeStyle='rgba(200,120,60,'+(0.5+0.3*Math.sin(G.t*6))+')';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(m.x,m.y,20,0,TAU);ctx.stroke();
    ctx.strokeStyle='rgba(255,200,140,0.25)';
    ctx.beginPath();ctx.arc(m.x,m.y,26,0,TAU);ctx.stroke();
  }
  if(m.stun>0){
    for(var i=0;i<3;i++){
      var a=G.t*4+i*TAU/3;
      ctx.fillStyle='#d29922';ctx.font='bold 12px Arial';ctx.textAlign='center';
      ctx.fillText('?',m.x+Math.cos(a)*14,m.y-16+Math.sin(a)*5);
      ctx.textAlign='left';
    }
  }
  if(m.cf>0){ // ребрендинг: dizzy spiral
    ctx.save();ctx.translate(m.x,m.y-26);
    ctx.strokeStyle='rgba(200,162,224,0.85)';ctx.lineWidth=1.6;
    ctx.beginPath();
    for(var t2=0;t2<4.5;t2+=0.15){
      var r2=1+t2*2;
      var px=Math.cos(t2+G.t*3)*r2,py=Math.sin(t2+G.t*3)*r2*0.5;
      if(t2===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.stroke();ctx.restore();
  }
  var hpF=remote?m.hpF:(m.hp/m.hpMax);
  if(hpF!==undefined&&hpF<1){
    ctx.fillStyle='#1a1e24';ctx.fillRect(m.x-12,m.y-24,24,3);
    ctx.fillStyle='#c23b32';ctx.fillRect(m.x-12,m.y-24,24*Math.max(0,hpF),3);
  }
}
function drawDeadline(m,remote){
  var t=G.t+(m.tilt||0);
  var hpF=remote?(m.hpF===undefined?1:m.hpF):(m.hp/m.hpMax);
  ctx.save();ctx.translate(m.x,m.y);ctx.scale(1.3,1.3);
  ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(2,5,11,7,0,0,TAU);ctx.fill();
  ctx.rotate(Math.sin(t*9)*0.12);
  for(var k=2;k>=0;k--){
    ctx.save();ctx.rotate((k-1)*0.22);
    var w=19-k*2,h=24-k*2;
    ctx.fillStyle=k===0?'#efe9db':'#e4ddcb';
    ctx.fillRect(-w/2,-h/2-2,w,h);
    ctx.strokeStyle='#b9b2a0';ctx.lineWidth=1;ctx.strokeRect(-w/2,-h/2-2,w,h);
    ctx.strokeStyle='rgba(90,90,100,0.5)';
    ctx.beginPath();
    for(var ln=1;ln<6;ln++){ctx.moveTo(-w/2+3,-h/2-2+ln*3.4);ctx.lineTo(w/2-3,-h/2-2+ln*3.4);}
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle='#c23b32';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText('!!',0,-2);ctx.textAlign='left';
  if(hpF<0.55){
    ctx.fillStyle='rgba(30,26,22,0.85)';
    ctx.beginPath();ctx.moveTo(7,-13);ctx.lineTo(11,-13);ctx.lineTo(11,-9);ctx.closePath();ctx.fill();
  }
  // flames
  for(var i=0;i<4;i++){
    var fx=-7+i*4.6;
    var h=7+Math.sin(t*11+i*1.7)*4;
    ctx.fillStyle='rgba(255,120,30,0.85)';
    ctx.beginPath();ctx.moveTo(fx-3,-14);ctx.quadraticCurveTo(fx-2,-14-h,fx,-15-h);ctx.quadraticCurveTo(fx+2,-14-h,fx+3,-14);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,210,90,0.8)';
    ctx.beginPath();ctx.moveTo(fx-1.4,-14);ctx.quadraticCurveTo(fx-0.7,-14-h*0.55,fx,-14.6-h*0.55);ctx.quadraticCurveTo(fx+0.7,-14-h*0.55,fx+1.4,-14);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
function drawBoss(b,remote){
  var look={skin:'#c9b8a3',hair:'#b9bcc2',hs:0,shirt:'#232a33',accent:'#8b2020'};
  var hpF=remote?(b.hpF||0):clamp(b.hp/b.hpMax,0,1);
  var wu=b.windup>0?Math.min(1,(b.wuT||0)/1.0):0;
  drawHumanoid(ctx,{x:b.x,y:b.y,face:b.face,step:b.step||0,look:look,cls:'mgr',scale:2.85,moving:true,atkT:wu>0?0.2:0,
    weapon:wu>0?null:'stamp',bossTie:true});
  // glasses
  var gd=14;
  ctx.save();ctx.translate(b.x+Math.cos(b.face)*gd*1.2,b.y+Math.sin(b.face)*gd*1.2);ctx.rotate(b.face+Math.PI/2);
  ctx.strokeStyle=remote&&b.phase===2?'#e5534b':'#9aa4af';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(-5*s2(),0,4.5,0,TAU);ctx.arc(5*s2(),0,4.5,0,TAU);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-1,0);ctx.lineTo(1,0);ctx.stroke();
  if(remote&&b.phase===2){
    ctx.fillStyle='#e5534b';
    ctx.beginPath();ctx.arc(-5*s2(),0,2,0,TAU);ctx.fill();
    ctx.beginPath();ctx.arc(5*s2(),0,2,0,TAU);ctx.fill();
  }
  ctx.restore();
  // folder stack
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.face||0)+0.3);
  ctx.fillStyle='#8a6d3b';rr(ctx,-10,-62,22,14,2);ctx.fill();
  ctx.fillStyle='#d8dce2';ctx.fillRect(-7,-60,16,2);
  ctx.restore();
  // портфель в левой руке + пуговицы костюма
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.face||0)-1.6);
  ctx.fillStyle='#5a4028';rr(ctx,20*s2()*0.8,-7*s2()*0.8,13*s2()*0.8,14*s2()*0.8,3);ctx.fill();
  ctx.strokeStyle='#3a2a1a';ctx.lineWidth=2.5;
  rr(ctx,20*s2()*0.8,-7*s2()*0.8,13*s2()*0.8,14*s2()*0.8,3);ctx.stroke();
  ctx.strokeStyle='#c9a35a';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(23*s2()*0.8,0,3,Math.PI*1.2,Math.PI*1.8);ctx.stroke();
  ctx.restore();
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate((b.face||0)+Math.PI/2);
  ctx.fillStyle='#c9a35a';
  ctx.fillRect(-8*s2()*0.5,-2,3,3);ctx.fillRect(5*s2()*0.5,-2,3,3);
  ctx.restore();
  // raised stamp during windup
  if(wu>0){
    var sy=-70+wu*38;
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.face+Math.PI/2);
    ctx.fillStyle='#3a4049';ctx.fillRect(-3,sy-16,6,18);
    ctx.fillStyle='#c23b32';rr(ctx,-12,sy-6,24,12,3);ctx.fill();
    ctx.fillStyle='#e8e2d0';ctx.fillRect(-8,sy-3,16,4);
    ctx.restore();
  }
}
function s2(){return 2.6;}


// ===== SA-стайл пиксельные портреты (30x24, чанки 5x5) =====
// легенда: . нет, H/h волосы, S/s кожа, E глаза/очки, e блик, m рот, n нос,
// W рубашка, C/c одежда, A акцент, b аксессуар, r румянец
var PORTRAITS={
mgr:[
"..............................",
".......HHHHHHHHHHHH...........",
"......HHHHHHHHHHHHHH..........",
".....HHHHhHHHHHHHHHH..........",
".....HHhSSSSSSSSShHH..........",
"....HHhSSSSSSSSSSShH..........",
"....HHSSSSSSSSSSSSHb..........",
"....HHSSSSSSSSSSSSSb..........",
".....HSSSSSSSSSSSSSS..........",
".....SSEnSSSSSSSnESS..........",
".....SEEEESSSSEEEEES..........",
".....SSEESSSSSSEESS...........",
".....SSSSSSSSSSSSSS...........",
"......SSSSSnnSSSSS............",
"......SSSSSSSSSSSS............",
"......SSSSSmmmmmSS............",
".......SSSSSmmSSSS............",
"........SSSSSSSSS.............",
".........sssssss..............",
"...WWWWW.WssssW.WWWWW.........",
"..WWWWWWWWssssWWWWWWWW........",
".CCCCWWWWWWWAAWWWWWWCCC.......",
".CCCCCWWWWWAAAAWWWWWCCCC......",
".CCCCCWWWWWAAAAWWWWWCCCC......"],
dev:[
"..............................",
".....CCCCCCCCCCCCCC...........",
"....CCCCCCCCCCCCCCCC..........",
"...CCCCCCCCCCCCCCCCCC.........",
"...CCCCCCCCCCCCCCCCCC.........",
"...CCCcSSSSSSSSSScCCC.........",
"..CCCcSSSSSSSSSSSScCC.........",
"..CCCcSSSSSSSSSSSSSCC.........",
"..CCCcSSSSSSSSSSSSSCC.........",
"..CCCcSSEESSSSSSEESCC.........",
"..CCCcSEEEESSSSEEEESC.........",
"..CCCcSSEESSSSSSEESCC.........",
"..CCCcSSSSSSnnSSSSCC..........",
"..CCCcuSSSSSSSSSuCC...........",
"..CCCcSuSSSSSSSSuCC...........",
"..CCCcSSSSSmmmSSSSC...........",
"..CCCccSSSSSSSSSccC...........",
"...CCCccSSSSSSSccCC...........",
"....CCCccssssscCCCT...........",
"...CCCCCCCcsssCCCCCT..........",
"..CCCCCCCCWWWWCCCCCCT.........",
".CCCCCCCWWWWWWWWCCCCT.........",
".CCCCCCWWWWccWWWWCCCT.........",
".CCCCCCWWWkkkkWWWCCCT........."],
mkt:[
"..............................",
".......HHHHHHHHHHHH...........",
"......HHHHHHHHHHHHHH..........",
".....HHHHHHHHHHHHHHHH.........",
".....HHhSSSSSSSSShHH..........",
"....HHhSSSSSSSSSSShH..........",
"....HHSSSSSSSSSSSSHH..........",
"....HHSEEEESSSSEEEEH..........",
"....HSEeEEeESSeEEeESH.........",
"....HSEEEESSSSEEEESH..........",
"....HSEEEESSSSEEEESH..........",
"....HHSEEEESSSSEEEH...........",
".....HSSSSSnnSSSSSH...........",
".....SSSSSSSSSSSSSS...........",
".....SSSSSmmmmSSSSS...........",
"......SSSSSmmSSSSS............",
".......SSSSSSSSSS.............",
"........ssssssss..............",
"...CCCCC.WssssW.CCCCC.........",
"..CCCCCCCWssWWCCCCCC..........",
".AACCCCCWWWWWWCCCCCA..........",
"AAACCCCCWWWWWWCCCCCAAA........",
"AAACCCCCWWWWWWCCCCCAAA........",
".AACCCCCWWWWWWCCCCCAA........."],
dsn:[
"..............................",
".......HHHHHHHHHHHH.HH........",
"......HHHHHHHHHHHHHHHH........",
".....HHHHHHHHHHHHHHHHH........",
".....HHhSSSSSSSSShHHHH........",
"....HHhSSSSSSSSSSShHHH........",
"....HHSSSSSSSSSSSSHHA.........",
"....HHSSSSSSSSSSSSSHA.........",
".....HSSSSSSSSSSSSS...........",
".....SSEEEEEEEEEESS...........",
".....SEeEEeEEEeEEeES..........",
".....SSEEEEEEEEEESS...........",
".....SSSSSSnnSSSSSS...........",
".....SSrSSSSSSSSrSS...........",
"......SSSSSSSSSSSS............",
"......SSSSSmmSSSSS............",
".......SSSSSSSSSS.............",
"........ssssssss..............",
"....CCCCC.WssssW.CCCCC........",
"...CCCCCCCWssWWCCCCCC.........",
"..ACCCCCCCCCAAAAAAAAAA........",
".AACCCCCCCCCAAAAAAAAAAA.......",
".AAACCCCCCCCrrAAAAAAAAA.......",
"..AACCCCCCCCCAAAAAAAAA........"]
};
var PPAL={
 mgr:{H:'#3a2a1a',h:'#241a10',S:'#e8c39e',s:'#c9a077',E:'#1e1a16',e:'#f2ede2',m:'#7a3b30',n:'#c9a077',W:'#dfe6ee',C:'#2c4e57',c:'#1f3641',A:'#8b2020',b:'#42e0ff',T:'#454c59',k:'#8bd17c'},
 dev:{H:'#1e1a16',h:'#141210',S:'#d9b48f',s:'#a8875f',E:'#5fd0c2',e:'#c8fff5',m:'#5a3b2c',n:'#a8875f',W:'#8b949e',C:'#26282e',c:'#1b1d21',A:'#5a616e',b:'#8bd17c',T:'#8a6d3b',u:'#14161c',k:'#454c59'},
 mkt:{H:'#6a3a1a',h:'#4a2812',S:'#f0d0b0',s:'#d0aa84',E:'#c8a2e0',e:'#f2ede2',m:'#7a4b30',n:'#d0aa84',W:'#dfe6ee',C:'#5a3a6a',c:'#41294e',A:'#c8a2e0',b:'#e8f6ff',T:'#8a6d3b',k:'#454c59'},
 dsn:{H:'#6e3a52',h:'#4e2838',S:'#f0d0b0',s:'#d0aa84',E:'#1a1d22',e:'#5fd0c2',m:'#b04a5e',n:'#d0aa84',W:'#dfe6ee',C:'#9c6b8e',c:'#6e4a60',A:'#5fd0c0',b:'#ffcf5c',r:'#d46a8e',T:'#8a6d3b',k:'#454c59'}
};
function drawPortrait(id,cls){
  var el=document.getElementById(id);
  if(!el)return;
  var c=el.getContext('2d');
  var W=el.width,H=el.height;
  c.clearRect(0,0,W,H);
  c.imageSmoothingEnabled=false;
  var map=PORTRAITS[cls],pal=PPAL[cls];
  var rows=map.length,cols=map[0].length;
  var px=W/cols,py=H/rows; // 150/30=5, 120/24=5
  // фон: аура класса + символика (чанками той же сетки)
  var glow={mgr:'42,224,255',dev:'95,208,194',mkt:'200,162,224',dsn:'95,208,192'}[cls];
  var g=c.createRadialGradient(W/2,H*0.42,6,W/2,H*0.42,H*0.75);
  g.addColorStop(0,'rgba('+glow+',0.16)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=g;c.fillRect(0,0,W,H);
  var rngP={mgr:1,dev:2,mkt:3,dsn:4}[cls];
  var rs=function(){rngP=(rngP*1103515245+12345)&0x7fffffff;return rngP/0x7fffffff;};
  if(cls==='dev'){ // падающие цифры матрицы
    c.font='bold '+Math.round(px*1.6)+'px monospace';
    for(var k=0;k<14;k++){
      var dx=(rs()*cols)|0,dy=(rs()*rows)|0;
      c.fillStyle=rs()<0.5?'rgba(42,138,58,0.5)':'rgba(66,224,255,0.35)';
      c.fillText(rs()<0.5?'1':'0',dx*px,dy*py+py);
    }
  }else if(cls==='mgr'){ // растущий график
    c.fillStyle='rgba(66,224,255,0.4)';
    for(var b2=0;b2<5;b2++)c.fillRect((4+b2*4)*px,H-(4+b2*3)*py,px*2,py*(1+b2*0.6));
    c.strokeStyle='rgba(66,224,255,0.7)';c.lineWidth=px*0.6;
    c.beginPath();c.moveTo(3*px,H-4*py);c.lineTo(W-3*px,4*py);c.stroke();
    c.beginPath();c.moveTo(W-5*px,3*py);c.lineTo(W-3*px,4*py);c.lineTo(W-6*px,6*py);c.stroke();
  }else if(cls==='mkt'){ // воронка + стрелка
    c.fillStyle='rgba(200,162,224,0.30)';
    c.beginPath();c.moveTo(4*px,3*py);c.lineTo(W-4*px,3*py);c.lineTo(W/2+px*2,10*py);c.lineTo(W/2+px*2,14*py);c.lineTo(W/2-px*2,14*py);c.lineTo(W/2-px*2,10*py);c.closePath();c.fill();
  }else{ // палитра дизайнера
    var sw=['#e5534b','#d29922','#3fb950','#42e0ff','#c8a2e0'];
    for(var s2=0;s2<5;s2++){c.fillStyle=sw[s2];c.globalAlpha=0.55;c.fillRect((4+s2*4.6)*px,H-3.4*py,px*3,py*1.6);}
    c.globalAlpha=1;
  }
  // сам портрет
  for(var y2=0;y2<rows;y2++){
    var line=map[y2];
    for(var x2=0;x2<cols;x2++){
      var ch=line[x2];
      if(ch==='.'||ch===' ')continue;
      var col=pal[ch];
      if(!col)continue;
      c.fillStyle=col;
      c.fillRect(Math.round(x2*px),Math.round(y2*py),Math.ceil(px),Math.ceil(py));
    }
  }
  // пиксельная рамка-скан для стиля
  c.fillStyle='rgba(0,0,0,0.18)';
  for(var sy=0;sy<H;sy+=3)c.fillRect(0,sy,W,1);
}
function renderClassPreviews(){
  var ids=[['mdl-mgr','mgr'],['mdl-dev','dev'],['mdl-mkt','mkt'],['mdl-dsn','dsn']];
  for(var i=0;i<ids.length;i++)drawPortrait(ids[i][0],ids[i][1]);
}
