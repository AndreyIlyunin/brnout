'use strict';
// ============================== audio ==============================
var AC=null,master=null,muted=false,amb=null;
// настройки звука: общий / музыка / эффекты (persist в localStorage)
var SET={master:0.8,music:0.55,sfx:0.8};
try{var _s=JSON.parse(localStorage.getItem('brnt_snd')||'null');if(_s)for(var _k in SET)if(typeof _s[_k]==='number')SET[_k]=_s[_k];}catch(e){}
var sfxBus=null,musGain=null;
function applyVolumes(){
  if(master)master.gain.value=muted?0:SET.master;
  if(sfxBus)sfxBus.gain.value=SET.sfx;
  if(musGain)musGain.gain.value=SET.music;
}
function saveVolumes(){try{localStorage.setItem('brnt_snd',JSON.stringify(SET));}catch(e){}}
function audioInit(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain();
    sfxBus=AC.createGain();
    musGain=AC.createGain();
    sfxBus.connect(master);musGain.connect(master);master.connect(AC.destination);
    applyVolumes();
  }catch(e){}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f,dur,type,vol,slide,delay){
  if(!AC||muted)return;delay=delay||0;
  var t0=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(24,f+slide),t0+dur);
  g.gain.setValueAtTime(vol||0.2,t0);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(sfxBus||master);o.start(t0);o.stop(t0+dur+0.03);
}
function noiz(dur,vol,freq,q,delay){
  if(!AC||muted)return;delay=delay||0;
  var t0=AC.currentTime+delay,len=Math.max(1,(dur*AC.sampleRate)|0);
  var buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);
  for(var i=0;i<len;i++)d[i]=Math.random()*2-1;
  var n=AC.createBufferSource();n.buffer=buf;
  var f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=freq||800;f.Q.value=q||1;
  var g=AC.createGain();g.gain.setValueAtTime(vol||0.2,t0);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  n.connect(f);f.connect(g);g.connect(sfxBus||master);n.start(t0);n.stop(t0+dur+0.03);
}
var SFX={
  deathCry:function(pitch){ // диаблоподобный предсмертный стон
    if(!AC||muted)return;
    var t0=AC.currentTime,f0=(pitch||1)*185;
    var o=AC.createOscillator(),g=AC.createGain(),fl=AC.createBiquadFilter();
    o.type='sawtooth';
    o.frequency.setValueAtTime(f0,t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(40,f0*0.42),t0+0.38);
    var lfo=AC.createOscillator(),lg=AC.createGain();
    lfo.frequency.value=6.3;lg.gain.value=14;
    lfo.connect(lg);lg.connect(o.detune);
    fl.type='bandpass';fl.frequency.value=680;fl.Q.value=1.1;
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(0.15,t0+0.03);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+0.42);
    o.connect(fl);fl.connect(g);g.connect(sfxBus||master);
    o.start(t0);o.stop(t0+0.46);lfo.start(t0);lfo.stop(t0+0.46);
  },
  soulSigh:function(pitch){ // улетающая душа: выдох «аааах»
    if(!AC||muted)return;
    var t0=AC.currentTime,p=(pitch||1);
    noiz(0.55,0.11,850,0.8);
    var o=AC.createOscillator(),g=AC.createGain();
    o.type='triangle';
    o.frequency.setValueAtTime(p*520,t0+0.05);
    o.frequency.exponentialRampToValueAtTime(Math.max(90,p*150),t0+0.55);
    g.gain.setValueAtTime(0.0001,t0+0.05);
    g.gain.exponentialRampToValueAtTime(0.15,t0+0.13);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+0.62);
    o.connect(g);g.connect(sfxBus||master);
    o.start(t0+0.05);o.stop(t0+0.66);
    tone(p*262,0.55,'sine',0.08,-150,0.05);
    tone(p*392,0.45,'sine',0.055,-190,0.08);
  },
  whisper:function(){ // мистический шёпот опенспейса
    if(!AC||muted)return;
    var t0=AC.currentTime;
    for(var i=0;i<3;i++){
      var o=AC.createOscillator(),g=AC.createGain();
      o.type='sine';o.frequency.value=196+i*2.5+R()*5;
      g.gain.setValueAtTime(0.0001,t0);
      g.gain.linearRampToValueAtTime(0.011,t0+1.3);
      g.gain.linearRampToValueAtTime(0.0001,t0+2.8);
      o.connect(g);g.connect(sfxBus||master);
      o.start(t0);o.stop(t0+2.9);
    }
    noiz(1.8,0.013,560,0.5);
  },
  pickup:function(){tone(760,0.07,'triangle',0.15);tone(1140,0.1,'triangle',0.12,0,0.05);},
  crit:function(){tone(880,0.08,'square',0.16);tone(1320,0.12,'square',0.13,0,0.05);noiz(0.06,0.15,1800,2);},
  crack:function(){noiz(0.08,0.2,450,1.2);tone(180,0.07,'square',0.1,-60);},
  swing:function(){noiz(0.12,0.25,900,1.5);},
  clack:function(){noiz(0.03,0.22,2600,6);tone(1600+R()*700,0.03,'square',0.05);},
  clacks:function(n){for(var i=0;i<n;i++)setTimeout(function(){SFX.clack();},i*55+R()*30);},
  whoosh:function(){noiz(0.16,0.13,650,2);},
  hit:function(){tone(120,0.12,'sine',0.28,-60);noiz(0.05,0.12,320,1);},
  thump:function(){tone(90,0.18,'sine',0.4,-40);},
  slurp:function(){tone(520,0.26,'sine',0.16,-280);tone(320,0.2,'triangle',0.1,-120,0.06);},
  ring:function(){tone(425,0.13,'sine',0.22);tone(425,0.13,'sine',0.22,0,0.18);tone(425,0.4,'sine',0.22,0,0.36);},
  slam:function(){noiz(0.4,0.5,130,0.8);tone(60,0.4,'sine',0.5,-30);},
  splat:function(){noiz(0.14,0.2,520,1);},
  heart:function(){tone(55,0.12,'sine',0.45,-8);tone(50,0.14,'sine',0.35,-8,0.16);},
  grade:function(){tone(392,0.12,'triangle',0.18);tone(311,0.14,'triangle',0.18,0,0.13);tone(262,0.3,'triangle',0.18,0,0.27);},
  dry:function(){tone(200,0.06,'square',0.09,-50);},
  explode:function(){noiz(0.3,0.4,220,0.7);tone(70,0.3,'sine',0.4,-30);},
  die:function(){tone(220,1.3,'sawtooth',0.22,-170);tone(110,1.6,'sawtooth',0.15,-80,0.1);}
};
function startAmbient(){
  if(!AC||amb)return;
  var o1=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),f=AC.createBiquadFilter();
  o1.type='sawtooth';o1.frequency.value=55;o2.type='sawtooth';o2.frequency.value=55.7;
  f.type='lowpass';f.frequency.value=150;g.gain.value=0.045;
  o1.connect(f);o2.connect(f);f.connect(g);g.connect(musGain||master);
  o1.start();o2.start();amb={o1:o1,o2:o2,g:g};
}
