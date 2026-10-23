// Core: helpers, sound, modal, on-screen keyboard, title screen, navigation.
(function(){
"use strict";
var A = window.A;
var $ = A.$ = function(id){ return document.getElementById(id); };
A.el = function(tag, cls, text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; };
A.esc = function(s){ return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); };
A.shuffle = function(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), t=a[i]; a[i]=a[j]; a[j]=t; } return a; };
A.store = {
  get:function(k,d){ try{ var v=localStorage.getItem("pa_"+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set:function(k,v){ try{ localStorage.setItem("pa_"+k, JSON.stringify(v)); }catch(e){} }
};

// ---------- word lists (shared by SPLICE + WORDLE) ----------
A.VALID = new Set();
(function(){ var S=window.VALID||""; for(var i=0;i+5<=S.length;i+=5) A.VALID.add(S.substr(i,5)); })();
A.COMMON = [];
(function(){ var S=window.COMMON||""; for(var i=0;i+5<=S.length;i+=5){ var w=S.substr(i,5); if(A.VALID.has(w)) A.COMMON.push(w); } })();
// Words we don't want as answers (school-safe + odd ones)
A.BLOCK = new Set("sperm penis whore bitch pussy dildo boobs booty horny sexes sexed slutt nazis rapes raped rapist bongs drugs crack semen pubic anals anally fucks shits dicks cocks tits hooch crapy crap gonad".split(" "));

// ---------- normalise text for answer matching ----------
A.norm = function(s){
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/&/g," and ").replace(/^\s*git\s+/,"").replace(/^\s*(the|a|an)\s+/,"")
    .replace(/[^a-z0-9+#]/g,"");
};
A.lev = function(a,b){
  if(Math.abs(a.length-b.length)>2) return 9;
  var prev=[], cur=[], i, j;
  for(j=0;j<=b.length;j++) prev[j]=j;
  for(i=1;i<=a.length;i++){ cur=[i]; for(j=1;j<=b.length;j++) cur[j]=Math.min(prev[j]+1, cur[j-1]+1, prev[j-1]+(a[i-1]===b[j-1]?0:1)); prev=cur; }
  return prev[b.length];
};

// ---------- sound (tiny WebAudio synth) ----------
var actx=null, muted = A.store.get("muted", false);
A.sfx = function(kind){
  if(muted) return;
  try{
    if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==="suspended") actx.resume();
    var seq = {
      key:[[660,0.03,"square",0.03]], bad:[[180,0.12,"sawtooth",0.06],[140,0.14,"sawtooth",0.05]],
      good:[[523,0.08,"square",0.05],[784,0.12,"square",0.05]], win:[[523,0.1,"square",0.05],[659,0.1,"square",0.05],[784,0.1,"square",0.05],[1047,0.22,"square",0.05]],
      lose:[[392,0.14,"triangle",0.07],[330,0.14,"triangle",0.07],[262,0.3,"triangle",0.07]], tick:[[1200,0.02,"square",0.02]],
      boot:[[220,0.06,"square",0.04],[330,0.06,"square",0.04],[440,0.06,"square",0.04],[880,0.18,"square",0.04]],
      flip:[[440,0.04,"triangle",0.04]], sel:[[880,0.03,"square",0.025]]
    }[kind] || [];
    var t = actx.currentTime;
    seq.forEach(function(n){
      var o=actx.createOscillator(), g=actx.createGain();
      o.type=n[2]; o.frequency.value=n[0]; g.gain.setValueAtTime(n[3],t); g.gain.exponentialRampToValueAtTime(0.0001,t+n[1]);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+n[1]+0.02); t+=n[1]*0.9;
    });
  }catch(e){}
};
function syncSound(){ $("bSound").textContent = muted ? "Sound off" : "Sound on"; $("tSub").textContent = "works offline · sound " + (muted?"off":"on"); }

// ---------- fullscreen ----------
A.fullscreen = function(){ var d=document.documentElement; try{ if(!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen().catch(function(){}); }catch(e){} };

// ---------- modal ----------
var modalOnKey = null;
A.modal = function(html, onKey){
  $("modalCard").innerHTML = html; $("modal").classList.add("show"); modalOnKey = onKey || null;
  var b = $("modalCard").querySelector(".btn.hot") || $("modalCard").querySelector(".btn"); if(b) setTimeout(function(){ b.focus(); }, 30);
};
A.closeModal = function(){ $("modal").classList.remove("show"); modalOnKey = null; };
A.modalOpen = function(){ return $("modal").classList.contains("show"); };

// ---------- on-screen keyboard ----------
A.keyboard = function(container, onKey){
  var rows=["qwertyuiop","asdfghjkl","zxcvbnm"], keys={};
  container.innerHTML="";
  rows.forEach(function(r,ri){
    var row=A.el("div","krow");
    if(ri===2){ var en=A.el("button","key wide","Enter"); en.addEventListener("click",function(){ onKey("ENTER"); }); row.appendChild(en); }
    for(var i=0;i<r.length;i++){ (function(ch){ var k=A.el("button","key",ch); k.addEventListener("click",function(){ onKey(ch); }); keys[ch]=k; row.appendChild(k); })(r[i]); }
    if(ri===2){ var dl=A.el("button","key wide","Del"); dl.addEventListener("click",function(){ onKey("DEL"); }); row.appendChild(dl); }
    container.appendChild(row);
  });
  return {
    paint:function(state){ for(var ch in keys){ keys[ch].className="key"+(state[ch]?" "+state[ch]:""); } }
  };
};
// letter feedback, wordle rules (handles repeat letters)
A.score = function(guess, target){
  var res=["miss","miss","miss","miss","miss"], left={}, i;
  for(i=0;i<5;i++) if(guess[i]!==target[i]) left[target[i]]=(left[target[i]]||0)+1;
  for(i=0;i<5;i++) if(guess[i]===target[i]) res[i]="hit";
  for(i=0;i<5;i++) if(res[i]!=="hit" && left[guess[i]]>0){ res[i]="near"; left[guess[i]]--; }
  return res;
};
A.mergeKeys = function(state, word, res){
  for(var i=0;i<5;i++){ var L=word[i], s=res[i], p=state[L];
    if(s==="hit") state[L]="hit"; else if(s==="near" && p!=="hit") state[L]="near"; else if(s==="miss" && !p) state[L]="miss"; }
};
A.miniGrid = function(rows){ // rows: arrays of class names
  return '<div class="mini">'+rows.map(function(r){ return '<div class="mr">'+r.map(function(c){ return '<i class="'+c+'"></i>'; }).join("")+'</div>'; }).join("")+'</div>';
};

// ---------- logo canvases ----------
function drawLogo(cv, s, progress, t){
  var text = "PICO//ARCADE", w = A.textWidth(text, s), h = 7*s;
  cv.width = w + 2*s; cv.height = h + 3*s;
  var c = cv.getContext("2d"); c.clearRect(0,0,cv.width,cv.height);
  // chromatic offset layers, then main
  var reveal = progress==null ? 1 : progress;
  for(var i=0;i<text.length;i++){
    var p = Math.max(0, Math.min(1, reveal*text.length*1.4 - i*1.0));
    if(p<=0) continue;
    var ch=text[i], x=s+i*6*s, dy = Math.round((1-p)*-24*s/4);
    var jitter = (t && Math.random()<0.015) ? s : 0;
    A.drawText(c, ch, x+s+jitter, s+dy+s, s, "rgba(61,224,200,0.55)");
    A.drawText(c, ch, x-s, s+dy, s, "rgba(255,79,154,0.55)");
    A.drawText(c, ch, x, s+dy, s, i<4 ? A.PAL.ink : (i<6 ? A.PAL.clawd : A.PAL.ink));
  }
}

// ---------- title screen ----------
var titleState = "armed"; // armed -> booting -> ready -> gone
var bootTimer = null, logoAnim = null, bootAt = 0;
function titleArmed(){
  titleState="armed";
  $("title").className="armed"; $("title").classList.remove("hidden");
  $("boot").textContent=""; $("tClawd").classList.add("hidden");
  $("tPrompt").innerHTML='Click anywhere to go fullscreen';
  var lc=$("logo"); drawLogo(lc, logoScale(), 1, 0); lc.style.opacity=".35";
  A.City.stop(); A.City.still();
}
function logoScale(){ return Math.max(3, Math.min(10, Math.floor(Math.min(window.innerWidth*0.9/71, window.innerHeight*0.16/7)))); }

function titleBoot(){
  titleState="booting"; bootAt=performance.now(); A.fullscreen(); A.sfx("boot");
  $("title").className="live"; A.City.start();
  var lc=$("logo"); lc.style.opacity="1";
  var lines = [
    "> waking clawd ................ ok",
    "> loading word-net ............ "+A.VALID.size.toLocaleString()+" words",
    "> loading uplink prompts ...... "+A.TRIVIA.length+" prompts",
    "> loading link groups ......... "+A.LINKS.length+" groups",
    "> network ..................... not needed"
  ];
  var li=0, ci=0, out="";
  $("boot").textContent="";
  clearInterval(bootTimer);
  bootTimer = setInterval(function(){
    if(li>=lines.length){ clearInterval(bootTimer); return; }
    out += lines[li][ci++]; if(ci>=lines[li].length){ out+="\n"; li++; ci=0; A.sfx("tick"); }
    $("boot").textContent = out;
  }, 14);
  var start=performance.now();
  cancelAnimationFrame(logoAnim);
  (function anim(now){
    if(titleState==="gone") return;
    var p=Math.min(1,(now-start)/1100);
    drawLogo(lc, logoScale(), p, now);
    if(p>=1 && titleState==="booting"){ titleReady(); }
    logoAnim = requestAnimationFrame(anim);
  })(start);
}
function titleReady(){
  titleState="ready";
  var img=$("tClawd"); img.src = A.clawdDataURL(6,"stand",{armsUp:true}); img.classList.remove("hidden");
  var flip=false; clearInterval(img._t); img._t=setInterval(function(){ flip=!flip; img.src=A.clawdDataURL(6, flip?"walkA":"stand",{armsUp:!flip}); }, 420);
  $("tPrompt").innerHTML='<span class="blink">Press <span class="kbd">Space</span> or click to play</span>';
}
function titleGo(){
  if(titleState!=="ready" && titleState!=="booting") return;
  if(performance.now()-bootAt < 600) return; // let the intro play
  titleState="gone"; clearInterval(bootTimer); clearInterval($("tClawd")._t);
  var w=$("wipe"); w.classList.remove("go"); void w.offsetWidth; w.classList.add("go");
  A.sfx("good");
  setTimeout(function(){ $("title").classList.add("hidden"); $("app").classList.remove("hidden"); A.show(A.current||"uplink"); }, 270);
  setTimeout(function(){ w.classList.remove("go"); }, 600);
}
A.toTitle = function(){ A.closeModal(); $("app").classList.add("hidden"); titleArmed(); };

$("title").addEventListener("click", function(){
  if(titleState==="armed") titleBoot();
  else titleGo();
});

// ---------- navigation ----------
A.games = {};
A.current = null;
A.show = function(id){
  var prev = A.games[A.current]; if(prev && prev.leave && A.current!==id) prev.leave();
  A.current = id;
  document.querySelectorAll(".nav").forEach(function(n){ n.classList.toggle("on", n.dataset.game===id); });
  document.querySelectorAll(".view").forEach(function(v){ v.classList.toggle("hidden", v.id!=="v-"+id); });
  $("path").textContent = "~/arcade/"+id;
  $("stat").textContent = "";
  var g = A.games[id]; if(g && g.enter) g.enter();
};
document.querySelectorAll(".nav").forEach(function(n){ n.addEventListener("click", function(){ A.sfx("sel"); A.show(n.dataset.game); }); });
$("bSound").addEventListener("click", function(){ muted=!muted; A.store.set("muted",muted); syncSound(); A.sfx("sel"); });
$("bFull").addEventListener("click", function(){ if(document.fullscreenElement) document.exitFullscreen(); else A.fullscreen(); });
$("bTitle").addEventListener("click", A.toTitle);
$("modal").addEventListener("click", function(e){ if(e.target===$("modal")) A.closeModal(); });

// ---------- global keys ----------
document.addEventListener("keydown", function(e){
  if(!$("title").classList.contains("hidden")){
    if(e.key===" "||e.key==="Enter"){ e.preventDefault(); if(titleState==="armed") titleBoot(); else titleGo(); }
    return;
  }
  if(A.modalOpen()){
    if(e.key==="Escape"){ A.closeModal(); return; }
    if(modalOnKey && modalOnKey(e)!==false) return;
    return;
  }
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  var g = A.games[A.current]; if(g && g.key) g.key(e);
});

// ---------- boot ----------
A.boot = function(){
  syncSound();
  A.City.init($("city"));
  var bl=$("brandLogo"); drawLogo(bl, 2, 1, 0);
  var bc=$("brandClawd"), f=false; bc.src=A.clawdDataURL(3,"stand"); setInterval(function(){ f=!f; bc.src=A.clawdDataURL(3, f?"walkA":"walkB"); }, 500);
  Object.keys(A.games).forEach(function(k){ if(A.games[k].init) A.games[k].init(); });
  titleArmed();
  window.addEventListener("resize", function(){ if(titleState==="armed") drawLogo($("logo"), logoScale(), 1, 0); });
  if("serviceWorker" in navigator && location.protocol.indexOf("http")===0){ navigator.serviceWorker.register("sw.js").catch(function(){}); }
};
})();
