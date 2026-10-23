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
var climb = {shown:0, target:0};

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
  total=0; climb.target=0; climb.shown=0; setAlt();
  renderCats();
}

function startRun(){
  round=0; total=0; results=[]; climb.target=0;
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
  total += pts; climb.target = Math.min(TOWER, total);
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

// ---------- tower view ----------
var tw, tctx, towerT=0;
function setAlt(){ $("upAlt").textContent=Math.round(climb.shown)+" m"; $("upRank").textContent=rankFor(Math.round(climb.shown)); }
function drawTower(now){
  requestAnimationFrame(drawTower);
  if(A.current!=="uplink" || $("app").classList.contains("hidden")) return;
  var cw = tw.clientWidth, ch = tw.clientHeight; if(!cw||!ch) return;
  var s = 3, W = Math.ceil(cw/s), H = Math.ceil(ch/s);
  if(tw.width!==W||tw.height!==H){ tw.width=W; tw.height=H; }
  var c=tctx, P=A.PAL, t=now/1000;
  if(climb.shown < climb.target) climb.shown = Math.min(climb.target, climb.shown + Math.max(0.6,(climb.target-climb.shown)*0.04));
  if(climb.shown > climb.target) climb.shown = climb.target;
  setAlt();
  // 1 metre = 0.5 px; camera keeps Clawd ~60% down the view
  var mpx = 0.5, groundY = H - 8, cy = groundY - climb.shown*mpx, cam = Math.max(0, (H*0.6) - cy);
  c.fillStyle="#0a0818"; c.fillRect(0,0,W,H);
  // distant stars drift with camera
  for(var i=0;i<30;i++){ var sx=(i*37)%W, sy=((i*53 + cam*0.2)%H); c.fillStyle=(i%3?"#3b3470":"#8f86d8"); c.fillRect(sx,sy|0,1,1); }
  var tx = Math.floor(W/2)-14, tw2=28, topY = groundY - TOWER*mpx + cam;
  // tower body
  c.fillStyle="#17132e"; c.fillRect(tx, topY, tw2, groundY+cam-topY);
  c.fillStyle="#211b42"; c.fillRect(tx, topY, 2, groundY+cam-topY);
  // windows
  for(var y=topY+6; y<groundY+cam; y+=6){ if(y<-6||y>H) continue; for(var x=tx+5; x<tx+tw2-3; x+=5){ var on=((x*7+Math.floor(y-cam)*3)%11)<4; c.fillStyle=on?(((x+y)%3)?P.amber:P.teal):"#100d22"; c.fillRect(x,Math.floor(y),2,3); } }
  // floor markers every 100m
  for(var m=100;m<=TOWER;m+=100){ var my=Math.floor(groundY - m*mpx + cam); if(my<0||my>H) continue; c.fillStyle="#3a3270"; c.fillRect(tx-4,my,tw2+8,1); A.drawText(c, String(m), tx+tw2+2, my-8, 1, m<=climb.shown?P.amber:"#4a4380"); }
  // antenna + beacon at the top
  c.fillStyle="#2a2450"; c.fillRect(tx+13, topY-24, 2, 24); c.fillRect(tx+9, topY-14, 10, 1);
  if(Math.sin(t*4)>0){ c.fillStyle=P.red; c.fillRect(tx+13, topY-26, 2, 2); }
  if(climb.shown>=600){ c.globalAlpha=0.25+0.15*Math.sin(t*6); c.fillStyle=P.teal; c.beginPath(); c.arc(tx+14, topY-25, 10, 0, 6.29); c.fill(); c.globalAlpha=1; }
  // ground
  c.fillStyle="#07060f"; c.fillRect(0, groundY+cam, W, H);
  // Clawd on the tower face
  var moving = climb.shown < climb.target;
  var fr = moving ? (Math.floor(t*8)%2?"climbA":"climbB") : "stand";
  A.drawClawd(c, tx+8, Math.floor(cy+cam-10), 1, fr, {armsUp: moving, blink:(t%3)<0.12});
  // rain
  c.fillStyle="rgba(160,170,255,0.22)"; for(var r=0;r<26;r++){ var rx=(r*29 + t*20)%W, ry=(r*41 + t*110)%H; c.fillRect(rx|0, ry|0, 1, 3); }
}

// ---------- game hooks ----------
A.games.uplink = {
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
