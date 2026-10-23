// UPLINK: name-a-thing trivia where rare answers score more (Krillion-style).
// Clawd climbs a night-city tower one metre per point.
(function(){
"use strict";
var A = window.A, $ = A.$;
var ROUNDS = 7, TIME = 25, PENALTY = 3, TOWER = 700;

// ---------- prepare prompts ----------
var PROMPTS = A.TRIVIA.map(function(row){
  var list = row[2].split("|").map(function(s){ var names=s.split(","); return {show:names[0], keys:names.map(A.norm).filter(Boolean)}; });
  var n = list.length;
  list.forEach(function(a,i){
    if(i===n-1) a.pts=100;
    else if(i<3) a.pts=10;
    else a.pts=Math.round(15 + 70*Math.pow((i-3)/Math.max(1,n-4), 0.85));
    a.rank=i;
  });
  return {cat:row[0], q:row[1], list:list};
});
function tier(p){ return p>=100?"rarest answer":p>=70?"rare":p>=40?"deep cut":p>15?"solid":"obvious"; }
function tierColor(p){ return p>=100?"var(--pink)":p>=70?"var(--violet)":p>=40?"var(--teal)":"var(--dim)"; }
var RANKS = [[0,"street level"],[100,"fire escape"],[200,"rooftop"],[300,"water tower"],[400,"the spire"],[500,"antenna mast"],[600,"uplink established"]];
function rankFor(m){ var r=RANKS[0][1]; RANKS.forEach(function(x){ if(m>=x[0]) r=x[1]; }); return r; }

// ---------- state ----------
var cat = A.store.get("upCat","mix"), state="lobby", round=0, total=0, results=[], cur=null, timeLeft=0, tickT=null, tried=null, bags={}, nextT=null;
var climb = {shown:0, target:0, from:0, start:0, dur:1, slip:0};

function bag(c){
  if(!bags[c] || !bags[c].length){
    bags[c] = A.shuffle(PROMPTS.filter(function(p){ return c==="mix" || p.cat===c; }).slice());
  }
  return bags[c].pop();
}

// ---------- category chips ----------
function renderCats(){
  var box=$("upCats"); box.innerHTML="";
  function chip(id,label,star){
    var b=A.el("button","chip"+(star?" star":"")+(cat===id?" on":""), (star?"★ ":"")+label);
    b.addEventListener("click",function(){ if(state==="ask"||state==="reveal") return; cat=id; A.store.set("upCat",cat); A.sfx("sel"); renderCats(); lobby(); });
    if(state==="ask"||state==="reveal") b.setAttribute("aria-disabled","true");
    box.appendChild(b);
  }
  A.CATS.filter(function(c){return c.star;}).forEach(function(c){ chip(c.id,c.name,true); });
  box.appendChild(A.el("span","sep"));
  chip("mix","Mix everything");
  A.CATS.filter(function(c){return !c.star;}).forEach(function(c){ chip(c.id,c.name,false); });
}
function catName(id){ if(id==="mix") return "Mix"; for(var i=0;i<A.CATS.length;i++) if(A.CATS[i].id===id) return A.CATS[i].name; return id; }

// ---------- lobby ----------
function lobby(){
  state="lobby"; clearInterval(tickT); clearTimeout(nextT);
  $("upLobby").classList.remove("hidden"); $("upPlay").classList.add("hidden");
  var n = PROMPTS.filter(function(p){ return cat==="mix"||p.cat===cat; }).length;
  var best = A.store.get("upBest_"+cat, 0);
  $("upLobby").innerHTML =
    '<div class="big">'+A.esc(catName(cat))+' · '+n+' prompts</div>'+
    ROUNDS+' prompts per climb, '+TIME+' seconds each. One right answer ends the prompt.<br>'+
    'Obvious answers pay <b>10</b>. Deep cuts pay up to <b>85</b>. The single rarest answer pays <b>100</b>.<br>'+
    'Wrong answers cost '+PENALTY+' seconds. Spelling can be a letter off.<br><br>'+
    (best? 'Best climb here: <b style="color:var(--amber)">'+best+' m</b><br><br>' : '')+
    '<button class="btn hot" id="upStart">Start climb</button> <span class="info" style="margin-left:8px">or press Enter</span>';
  $("upStart").addEventListener("click", startRun);
  $("upRound").textContent="Ready"; $("upCat").textContent=catName(cat); $("upPts").textContent="0 m";
  total=0; resetClimb();
  renderCats();
}

function startRun(){
  round=0; total=0; results=[]; resetClimb();
  $("upLobby").classList.add("hidden"); $("upPlay").classList.remove("hidden");
  A.sfx("good"); nextPrompt();
}

function nextPrompt(){
  clearTimeout(nextT);
  if(round>=ROUNDS){ finish(); return; }
  round++; cur = bag(cat); tried = new Set(); timeLeft=TIME; state="ask";
  renderCats();
  $("upRound").textContent="Prompt "+round+"/"+ROUNDS; $("upCat").textContent=catName(cur.cat);
  $("upQ").innerHTML='<span class="qc">'+A.esc(catName(cur.cat))+'</span>'+A.esc(cur.q);
  $("upLog").innerHTML='<div class="info">'+cur.list.length+' answers on file. Type one and press Enter.</div>';
  var inp=$("upIn"); inp.value=""; inp.disabled=false; setTimeout(function(){ inp.focus(); },20);
  $("upTimer").classList.remove("low"); drawTimer();
  runClock();
}
function runClock(){
  clearInterval(tickT);
  tickT=setInterval(function(){ timeLeft-=0.1; if(timeLeft<=0){ timeLeft=0; drawTimer(); clearInterval(tickT); resolve(null); } else drawTimer(); }, 100);
}
function drawTimer(){
  var t=$("upTimer"); t.firstChild.style.width=(timeLeft/TIME*100)+"%"; t.classList.toggle("low", timeLeft<6);
}
function log(html, cls){ var d=A.el("div",cls||""); d.innerHTML=html; $("upLog").appendChild(d); $("upLog").scrollTop=$("upLog").scrollHeight; }

function match(text){
  var k=A.norm(text); if(!k) return null;
  var list=cur.list, i, j;
  for(i=0;i<list.length;i++) for(j=0;j<list[i].keys.length;j++) if(list[i].keys[j]===k) return list[i];
  if(k.length<5) return null;
  var best=null, bd=9, lim = k.length>=8?2:1;
  for(i=0;i<list.length;i++) for(j=0;j<list[i].keys.length;j++){ var key=list[i].keys[j]; if(key.length<4) continue; var d=A.lev(k,key); if(d<bd){ bd=d; best=list[i]; } }
  return bd<=lim ? best : null;
}

function submit(){
  if(state!=="ask") return;
  var inp=$("upIn"), text=inp.value.trim(); if(!text) return;
  inp.value="";
  var hit=match(text);
  if(hit){ resolve(hit, text); return; }
  var k=A.norm(text);
  if(tried.has(k)){ log('&gt; '+A.esc(text)+' <span class="info">already tried</span>'); return; }
  tried.add(k);
  timeLeft=Math.max(0,timeLeft-PENALTY); drawTimer(); A.sfx("bad");
  log('&gt; '+A.esc(text)+' <span class="bad">not on the list · -'+PENALTY+'s</span>');
  inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake");
  if(timeLeft<=0){ clearInterval(tickT); resolve(null); }
}

function resolve(hit, typed){
  if(state!=="ask") return;
  state="reveal"; clearInterval(tickT); $("upIn").disabled=true;
  var pts = hit ? hit.pts : 0;
  total += pts; startClimb(pts);
  results.push({q:cur.q, a: hit?hit.show:null, pts:pts});
  var list=cur.list, rarest=list[list.length-1];
  var common=list.slice(0,3).map(function(a){return "<b>"+A.esc(a.show)+"</b>";}).join(", ");
  var html = '<div class="reveal">';
  if(hit){ A.sfx(pts>=70?"win":"good");
    html += '<span class="pts">+'+pts+'</span><span class="tier" style="color:'+tierColor(pts)+'">'+tier(pts)+'</span>'+
            '<div>&gt; '+A.esc(hit.show)+(A.norm(typed)!==hit.keys[0] && hit.keys.indexOf(A.norm(typed))<0 ? ' <span class="info">(close enough to "'+A.esc(typed)+'")</span>':'')+'</div>';
  } else { A.sfx("lose"); html += '<span class="pts" style="color:var(--pink)">+0</span><span class="tier" style="color:var(--pink)">time out</span>'; }
  html += '<div class="others">Most common: '+common+'<br>Rarest: <b style="color:var(--pink)">'+A.esc(rarest.show)+'</b></div></div>';
  html += '<div class="info">'+(round<ROUNDS?'Enter for the next prompt':'Enter to see your climb')+'</div>';
  log(html);
  $("upPts").textContent=total+" m";
  nextT=setTimeout(function(){ if(state==="reveal") advance(); }, 6000);
}
function advance(){ clearTimeout(nextT); if(round>=ROUNDS) finish(); else nextPrompt(); }

function finish(){
  state="done"; clearInterval(tickT); clearTimeout(nextT); renderCats();
  var key="upBest_"+cat, best=A.store.get(key,0), isBest = total>best;
  if(isBest) A.store.set(key,total);
  var rows = results.map(function(r){ return '<tr><td class="qq">'+A.esc(r.q.replace(/^Name an? /,""))+'</td><td class="a'+(r.a?'':' x')+'">'+(r.a?A.esc(r.a):'no answer')+'</td><td class="p">+'+r.pts+'</td></tr>'; }).join("");
  var max = ROUNDS*100;
  A.sfx(total>=300?"win":"good");
  A.modal(
    '<div class="kick">Uplink · '+A.esc(catName(cat))+'</div><h2>'+A.esc(rankFor(total).toUpperCase())+'</h2>'+
    '<div class="score"><div class="n">'+total+'<span style="font-size:22px"> m</span></div><div class="u"><b>'+results.filter(function(r){return r.a;}).length+' of '+ROUNDS+' answered</b>out of '+max+' m possible'+(isBest?'<br><span style="color:var(--teal)">new best for this category</span>':(best?'<br>best here: '+best+' m':''))+'</div></div>'+
    '<table class="runs">'+rows+'</table>'+
    '<div class="cardbtns"><button class="btn hot" id="upAgain">Climb again</button><button class="btn" id="upCatBtn">Change category</button></div>'+
    '<div class="hint">Enter: climb again · Esc: close</div>',
    function(e){ if(e.key==="Enter"){ e.preventDefault(); again(); } }
  );
  $("upAgain").addEventListener("click", again);
  $("upCatBtn").addEventListener("click", function(){ A.closeModal(); lobby(); });
}
function again(){ A.closeModal(); startRun(); }

// ---------- tower view + climb animation ----------
// Drawn on a full-size canvas in chunky 3px art pixels. The camera and Clawd
// move on whole screen pixels, so the climb glides instead of stepping.
var tw, tctx, S = 3, MPX = 0.5;          // MPX: art pixels per metre
var pops = [], banner = null, lineOff = 0, lastNow = 0, cam = 0, lastShown = 0;
function ease(x){ return x<0.5 ? 4*x*x*x : 1-Math.pow(-2*x+2,3)/2; }
function resetClimb(){ climb.shown=climb.target=climb.from=0; climb.slip=0; climb.dur=1; climb.start=0; pops=[]; banner=null; cam=0; lastShown=0; setAlt(); }
function startClimb(pts){
  var now = performance.now();
  climb.from = climb.shown; climb.target = Math.min(TOWER, total);
  climb.start = now; climb.dur = pts ? 1100 + pts*13 : 1;
  if(pts) pops.push({text:"+"+pts, color: pts>=100?A.PAL.pink : pts>=70?A.PAL.violet : pts>=40?A.PAL.teal : A.PAL.amber, born:now, alt:climb.target, big:pts>=70});
  else { climb.slip = now; pops.push({text:"SLIP!", color:A.PAL.pink, born:now, alt:climb.shown, big:false}); }
}
function setAlt(){
  var m=Math.round(climb.shown), el=$("upAlt");
  el.textContent=m+" m"; $("upRank").textContent=rankFor(m);
  el.classList.toggle("ticking", climb.shown < climb.target);
}
function wrapWords(text, maxW){
  var out=[], line="";
  text.split(" ").forEach(function(w){ var t=line?line+" "+w:w; if(A.textWidth(t,1)>maxW && line){ out.push(line); line=w; } else line=t; });
  if(line) out.push(line); return out;
}

function drawTower(now){
  requestAnimationFrame(drawTower);
  var dt = Math.min(0.05, (now-lastNow)/1000 || 0.016); lastNow = now;
  if(A.current!=="uplink" || $("app").classList.contains("hidden")) return;
  var cw = tw.clientWidth, ch = tw.clientHeight; if(!cw||!ch) return;
  if(tw.width!==cw||tw.height!==ch){ tw.width=cw; tw.height=ch; tctx.imageSmoothingEnabled=false; }
  var c=tctx, P=A.PAL, t=now/1000, W=cw/S, H=ch/S;

  // --- climb progress ---
  var p = climb.dur ? Math.min(1, (now-climb.start)/climb.dur) : 1;
  var prev = climb.shown;
  climb.shown = climb.from + (climb.target-climb.from)*ease(p);
  var speed = Math.abs(climb.shown-prev)/Math.max(dt,0.001);        // metres per second
  // milestones: every 100 m crossed pops a banner
  for(var m=100;m<=TOWER;m+=100) if(lastShown < m && climb.shown >= m){ banner={m:m, born:now}; A.sfx("good"); }
  if(Math.floor(climb.shown/20) > Math.floor(lastShown/20)) A.sfx("tick");
  lastShown = climb.shown;
  setAlt();
  // slip wobble on timeouts
  var slipY = 0, slipX = 0;
  if(climb.slip){ var sp=(now-climb.slip)/900; if(sp<1){ slipY = Math.min(climb.shown*MPX, Math.sin(sp*Math.PI)*6); slipX = Math.sin(sp*40)*(1-sp)*2; } else climb.slip=0; }

  // --- camera: keep Clawd ~62% down the view, eased ---
  var groundY = H - 10, cy = groundY - climb.shown*MPX + slipY;
  var want = Math.max(0, H*0.62 - cy);
  cam += (want - cam) * Math.min(1, dt*8);
  var camPx = Math.round(cam*S)/S;                       // snap to a screen pixel
  function world(){ c.setTransform(S,0,0,S,0,Math.round(cam*S)); }
  function screen(){ c.setTransform(S,0,0,S,0,0); }

  // --- backdrop ---
  c.setTransform(1,0,0,1,0,0);
  var grd=c.createLinearGradient(0,0,0,ch); grd.addColorStop(0,"#0a0818"); grd.addColorStop(1,"#1d1236"); c.fillStyle=grd; c.fillRect(0,0,cw,ch);
  screen();
  for(var i=0;i<40;i++){ var sx=(i*37)%W, sy=(i*53 + camPx*0.25)%H; c.fillStyle=(i%3?"#3b3470":"#8f86d8"); c.fillRect(Math.floor(sx), Math.round(sy*S)/S, 1, 1); }
  // distant skyline drifts slower than the tower (parallax)
  c.fillStyle="#140f2a";
  for(var b=0;b<8;b++){ var bh=30+((b*47)%40), bx=(b*W/7)-6; c.fillRect(Math.floor(bx), Math.round((H-bh+camPx*0.4)*S)/S, Math.floor(W/8), bh+200); }

  // --- speed lines while climbing ---
  lineOff += speed*MPX*dt*2.2;
  if(speed>3){
    c.globalAlpha=Math.min(0.55, speed/220);
    for(var l=0;l<14;l++){
      var lx = (l*13.7)%W, side = (lx > W/2-16 && lx < W/2+16) ? (lx < W/2 ? -18 : 18) : 0;
      var ly = ((l*29.3 + lineOff) % (H+20)) - 20, len = 4 + Math.min(16, speed/12);
      c.fillStyle = l%3 ? "#7c74c8" : P.teal; c.fillRect(Math.floor(lx+side), Math.round(ly*S)/S, 1/S*2, len);
    }
    c.globalAlpha=1;
  }

  // --- the tower ---
  world();
  var tx = Math.floor(W/2)-14, tw2=28, topY = groundY - TOWER*MPX;
  c.fillStyle="#17132e"; c.fillRect(tx, topY, tw2, groundY-topY);
  c.fillStyle="#211b42"; c.fillRect(tx, topY, 2, groundY-topY); c.fillRect(tx+tw2-1, topY, 1, groundY-topY);
  var view0 = -cam-4, view1 = -cam+H+4;
  for(var y=topY+6; y<groundY; y+=6){
    if(y<view0||y>view1) continue;
    var altHere = (groundY - y)/MPX;
    for(var x=tx+5; x<tx+tw2-3; x+=5){
      var seed=((x*7+Math.floor(y)*3)%11), passed = altHere <= climb.shown;
      var on = passed ? seed<7 : seed<2;
      c.fillStyle = on ? (passed ? ((x+Math.floor(y))%3 ? P.amber : P.teal) : "#3a3166") : "#100d22";
      c.fillRect(x, y, 2, 3);
    }
  }
  // floor markers every 100 m
  for(var mm=100; mm<=TOWER; mm+=100){
    var my = groundY - mm*MPX; if(my<view0||my>view1) continue;
    var hit = mm<=climb.shown, flash = banner && banner.m===mm && now-banner.born<600;
    c.fillStyle = flash ? "#ffffff" : hit ? P.amber : "#3a3270"; c.fillRect(tx-4, my, tw2+8, 1);
    A.drawText(c, String(mm), tx+tw2+3, my-8, 1, hit ? P.amber : "#4a4380");
  }
  // antenna + beacon
  c.fillStyle="#2a2450"; c.fillRect(tx+13, topY-24, 2, 24); c.fillRect(tx+9, topY-14, 10, 1);
  if(Math.sin(t*4)>0){ c.fillStyle=P.red; c.fillRect(tx+13, topY-26, 2, 2); }
  if(climb.shown>=600){ c.globalAlpha=0.25+0.15*Math.sin(t*6); c.fillStyle=P.teal; c.beginPath(); c.arc(tx+14, topY-25, 12, 0, 6.29); c.fill(); c.globalAlpha=1; }
  // street
  c.fillStyle="#07060f"; c.fillRect(-10, groundY, W+20, 80);
  c.fillStyle="#2a2450"; c.fillRect(-10, groundY, W+20, 1);

  // --- Clawd ---
  var moving = climb.shown < climb.target - 0.01;
  var rate = moving ? Math.max(6, Math.min(16, speed/10)) : 0;
  var fr = moving ? (Math.floor(t*rate)%2 ? "climbA":"climbB") : (climb.slip ? "climbB" : "stand");
  var cx = Math.round((tx+8+slipX)*S)/S, cyy = Math.round((cy-10)*S)/S;
  if(moving){ c.globalAlpha=0.25; A.drawClawd(c, cx, cyy+3, 1, fr, {armsUp:true}); c.globalAlpha=1; }   // motion smear
  A.drawClawd(c, cx, cyy, 1, fr, {armsUp: moving, blink:(t%3)<0.12});
  if(!moving && climb.shown>=TOWER){ c.fillStyle=P.amber; c.fillRect(cx+6, cyy-6, 1, 5); c.fillRect(cx+7, cyy-6, 3, 2); }  // flag at the top

  // --- popups (+points) rise from Clawd and fade ---
  pops = pops.filter(function(pp){ return now-pp.born < 2400; });
  pops.forEach(function(pp){
    var age=Math.max(0,(now-pp.born)/2400), sc=pp.big?2:1, txt=pp.text, w=A.textWidth(txt,sc);
    var py = groundY - Math.min(pp.alt, climb.shown)*MPX - (pp.big?30:22) - age*22;
    c.globalAlpha = age<0.75 ? 1 : (1-age)/0.25;
    A.drawText(c, txt, Math.round((tx+14-w/2+1)*S)/S, Math.round((py+1)*S)/S, sc, "#07060f");
    A.drawText(c, txt, Math.round((tx+14-w/2)*S)/S, Math.round(py*S)/S, sc, pp.color);
    c.globalAlpha=1;
  });

  // --- milestone banner (screen-fixed) ---
  screen();
  if(banner){
    var age2=(now-banner.born)/1800;
    if(age2>=1) banner=null;
    else {
      var slide = age2<0.15 ? (1-age2/0.15) : age2>0.85 ? -(age2-0.85)/0.15 : 0;
      var lines = wrapWords(rankFor(banner.m).toUpperCase(), W-8), bh2 = 22 + lines.length*8;
      var by = Math.round((10 + slide*-30)*S)/S;
      c.fillStyle="rgba(7,6,15,0.88)"; c.fillRect(0, by, W, bh2);
      c.fillStyle=P.clawd; c.fillRect(0, by, W, 1); c.fillRect(0, by+bh2-1, W, 1);
      var big=banner.m+" M", bw=A.textWidth(big,2);
      A.drawText(c, big, Math.floor((W-bw)/2), by+4, 2, P.amber);
      lines.forEach(function(ln,k){ A.drawText(c, ln, Math.floor((W-A.textWidth(ln,1))/2), by+20+k*8, 1, P.ink); });
    }
  }
  // rain
  c.fillStyle="rgba(160,170,255,0.22)";
  for(var r=0;r<30;r++){ var rx=(r*29.3 + t*18)%W, ry=(r*41.7 + t*120 + camPx*0.6)%H; c.fillRect(Math.round(rx*S)/S, Math.round(ry*S)/S, 1/S*2, 3); }
  c.setTransform(1,0,0,1,0,0);
}


// ---------- game hooks ----------
A.games.uplink = {
  _debug:function(){ return {pops:pops, climb:climb, banner:banner}; },
  init:function(){
    tw=$("tower"); tctx=tw.getContext("2d"); requestAnimationFrame(drawTower);
    $("upIn").addEventListener("keydown", function(e){ if(e.key==="Enter"){ e.preventDefault(); e.stopPropagation(); submit(); } });
    lobby();
  },
  enter:function(){ $("stat").textContent=""; if(state==="ask"){ runClock(); setTimeout(function(){ $("upIn").focus(); },20); } },
  leave:function(){ clearInterval(tickT); clearTimeout(nextT); },
  key:function(e){
    if(e.target===$("upIn")) return;
    if(e.key==="Enter"){ e.preventDefault(); if(state==="lobby") startRun(); else if(state==="reveal") advance(); }
    else if(state==="ask" && e.key.length===1){ $("upIn").focus(); }
  }
};
})();
