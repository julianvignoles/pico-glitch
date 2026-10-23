// SPLICE: word ladder toward a hidden target with wordle-style hints. Unlimited.
(function(){
"use strict";
var A = window.A, $ = A.$;
// Par is measured on a graph of everyday words only, so the par route is one
// a person could actually find. Any valid word is still allowed while playing,
// so beating par with obscure words is possible.
var buckets = null, ANSWERS = null;

function build(){
  if(buckets) return;
  ANSWERS = A.COMMON.filter(function(w){ return !A.BLOCK.has(w); });
  buckets = new Map();
  ANSWERS.forEach(function(w){ for(var i=0;i<5;i++){ var k=w.slice(0,i)+"*"+w.slice(i+1), a=buckets.get(k); if(!a){a=[];buckets.set(k,a);} a.push(w); } });
}
function neighbors(w){ var r=[]; for(var i=0;i<5;i++){ var a=buckets.get(w.slice(0,i)+"*"+w.slice(i+1)); if(a) for(var j=0;j<a.length;j++) if(a[j]!==w) r.push(a[j]); } return r; }
function bfs(target){
  var dist=new Map([[target,0]]), q=[target], h=0;
  while(h<q.length){ var w=q[h++], d=dist.get(w), ns=neighbors(w); for(var i=0;i<ns.length;i++) if(!dist.has(ns[i])){ dist.set(ns[i],d+1); q.push(ns[i]); } }
  return dist;
}
function solve(start, dist){
  var path=[start], cur=start;
  while(dist.get(cur)>0){ cur=neighbors(cur).filter(function(n){ return dist.get(n)===dist.get(cur)-1; })[0]; path.push(cur); }
  return path;
}
function makePuzzle(){
  for(var attempt=0; attempt<300; attempt++){
    var target = ANSWERS[Math.floor(Math.random()*ANSWERS.length)];
    if(neighbors(target).length<2) continue;
    var dist = bfs(target), pool=[];
    for(var i=0;i<ANSWERS.length;i++){ var d=dist.get(ANSWERS[i]); if(d>=3 && d<=5) pool.push(ANSWERS[i]); }
    if(!pool.length) continue;
    var start = pool[Math.floor(Math.random()*pool.length)];
    return {start:start, target:target, par:dist.get(start), dist:dist};
  }
  return {start:"stone", target:"crane", par:4, dist:bfs("crane")};
}
function diff1(a,b){ var d=0; for(var i=0;i<5;i++) if(a[i]!==b[i] && ++d>1) return false; return d===1; }

var pz=null, chain=[], input="", done=false, keyState={}, kb=null;

function start(){
  build(); A.closeModal();
  pz = makePuzzle(); chain=[{w:pz.start, r:A.score(pz.start,pz.target)}]; input=""; done=false; keyState={};
  msg("Start: "+pz.start.toUpperCase()+" · par "+pz.par+" steps");
  render();
}
function msg(s){ $("spMsg").textContent=s; }
function render(){
  var locked=["","","","",""];
  chain.forEach(function(c){ for(var i=0;i<5;i++) if(c.r[i]==="hit") locked[i]=c.w[i]; });
  var lk=$("spLock"); lk.innerHTML="<span>TARGET&nbsp;</span>";
  locked.forEach(function(L){ lk.appendChild(A.el("div","slot"+(L?"":" blank"), L?L.toUpperCase():"·")); });
  var b=$("spBoard"); b.innerHTML="";
  chain.forEach(function(c,ci){
    var row=A.el("div","trow");
    for(var i=0;i<5;i++) row.appendChild(A.el("div","tile "+(ci===0?"src":c.r[i]), c.w[i]));
    b.appendChild(row);
  });
  b.scrollTop=b.scrollHeight;
  var inp=$("spInput"); inp.innerHTML="";
  for(var i=0;i<5;i++) inp.appendChild(A.el("div","tile"+(input[i]?" typing":""), input[i]||""));
  inp.style.visibility = done ? "hidden" : "visible";
  keyState={}; chain.forEach(function(c){ A.mergeKeys(keyState,c.w,c.r); }); kb.paint(keyState);
  $("stat").textContent = "steps "+(chain.length-1)+" · par "+pz.par;
}
function press(k){
  if(done) return;
  if(k==="ENTER") return commit();
  if(k==="DEL"){ input=input.slice(0,-1); render(); return; }
  if(/^[a-z]$/.test(k) && input.length<5){ input+=k; A.sfx("key"); render(); var t=$("spInput").children[input.length-1]; if(t) t.classList.add("pop"); }
}
function bad(s){ msg(s); A.sfx("bad"); var r=$("spInput"); r.classList.remove("shake"); void r.offsetWidth; r.classList.add("shake"); }
function commit(){
  var last=chain[chain.length-1].w;
  if(input.length<5) return bad("Need 5 letters");
  if(!A.VALID.has(input)) return bad("Not in the word list");
  if(!diff1(input,last)) return bad("Change exactly one letter from "+last.toUpperCase());
  if(chain.some(function(c){ return c.w===input; })) return bad("Already used "+input.toUpperCase());
  chain.push({w:input, r:A.score(input,pz.target)}); A.sfx("flip");
  var won = input===pz.target; input="";
  msg("");
  render();
  var row=$("spBoard").lastChild; if(row) Array.prototype.forEach.call(row.children,function(t,i){ t.style.animationDelay=(i*60)+"ms"; t.classList.add("flip"); });
  if(won){ done=true; setTimeout(function(){ end(true); }, 450); }
}
function undo(){ if(done||chain.length<2) return; chain.pop(); input=""; msg("Stepped back"); render(); }
function giveUp(){ if(done) return; done=true; render(); end(false); }

function end(won){
  var steps=chain.length-1, over=steps-pz.par;
  var title = !won ? "SIGNAL LOST" : over<=0 ? "PERFECT SPLICE" : over<=2 ? "CLEAN SPLICE" : "SPLICED";
  var path = solve(pz.start, pz.dist).map(function(w){ return w.toUpperCase(); }).join(" → ");
  var grid = A.miniGrid(chain.map(function(c,ci){ return ci===0 ? ["src","src","src","src","src"] : c.r; }));
  var line = won ? (over<0 ? (-over)+" under par!" : over===0 ? "Matched par." : over+" step"+(over===1?"":"s")+" over par.") : "Target was "+pz.target.toUpperCase()+".";
  if(won){ A.sfx(over<=0?"win":"good"); var s=A.store.get("spSolved",0)+1; A.store.set("spSolved",s); } else A.sfx("lose");
  A.modal(
    '<div class="kick">Splice · '+pz.start.toUpperCase()+' → '+pz.target.toUpperCase()+'</div><h2>'+title+'</h2>'+
    '<div class="score"><div class="n">'+(won?steps:"–")+'</div><div class="u"><b>'+(won?"steps":"unsolved")+'</b>par '+pz.par+'<br>'+line+'</div></div>'+
    grid+
    '<p>A shortest route: <b>'+path+'</b></p>'+
    '<div class="cardbtns"><button class="btn hot" id="spAgain">New puzzle</button><button class="btn" id="spClose">Look at board</button></div>'+
    '<div class="hint">Enter: new puzzle · Esc: close</div>',
    function(e){ if(e.key==="Enter"){ e.preventDefault(); start(); } }
  );
  $("spAgain").addEventListener("click", start);
  $("spClose").addEventListener("click", A.closeModal);
}
function help(){
  A.modal('<div class="kick">How to play</div><h2>SPLICE</h2>'+
    '<p>Rewrite the <b>start word</b> into a <b>hidden target</b>, changing <b>one letter per step</b>. Every step has to be a real 5-letter word.</p>'+
    '<p>Each step is scored against the target: <b style="color:var(--hit)">teal</b> = right letter, right spot. <b style="color:var(--near)">amber</b> = in the word, wrong spot. Dark = not in the word.</p>'+
    '<p><b>Par</b> is the fewest steps possible. Undo steps back; Give up shows the target and a shortest route.</p>'+
    '<div class="cardbtns"><button class="btn hot" id="spOk">Got it</button></div>',
    function(e){ if(e.key==="Enter"){ e.preventDefault(); A.closeModal(); } });
  $("spOk").addEventListener("click", A.closeModal);
}

A.games.splice = {
  _debug:function(){ return pz; },
  init:function(){
    kb = A.keyboard($("spKb"), press);
    $("spUndo").addEventListener("click", undo); $("spGive").addEventListener("click", giveUp);
    $("spNew").addEventListener("click", start); $("spHelp").addEventListener("click", help);
  },
  enter:function(){
    if(!pz){ msg("Building word graph…"); setTimeout(function(){ start(); if(!A.store.get("spSeen",false)){ A.store.set("spSeen",true); help(); } }, 20); }
    else render();
  },
  key:function(e){
    if(e.key==="Enter"){ e.preventDefault(); press("ENTER"); }
    else if(e.key==="Backspace"){ e.preventDefault(); press("DEL"); }
    else if(/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
  }
};
})();
