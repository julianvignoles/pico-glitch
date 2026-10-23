// CONNECTIONS: find four groups of four. Puzzles are generated from the group pool.
(function(){
"use strict";
var A = window.A, $ = A.$;
var GROUPS = A.LINKS.map(function(g){
  var words=g[2].split(" ").filter(Boolean);
  var all=new Set(words.concat((g[3]||"").split(" ").filter(Boolean)));
  return {lv:g[0], name:g[1], words:words, all:all};
});
var pz=null, left=[], sel=[], solved=[], lives=4, guesses=[], done=false, recent=[];

function make(){
  for(var attempt=0; attempt<400; attempt++){
    var pick=[];
    for(var lv=1; lv<=4; lv++){
      var opts=GROUPS.filter(function(g){ return g.lv===lv && recent.indexOf(g.name)<0; });
      if(!opts.length) opts=GROUPS.filter(function(g){ return g.lv===lv; });
      pick.push(opts[Math.floor(Math.random()*opts.length)]);
    }
    var ok=true, out=[], used=new Set();
    for(var i=0;i<4 && ok;i++){
      // a word is safe only if no other chosen group could also claim it
      var safe=pick[i].words.filter(function(w){ return !used.has(w) && pick.every(function(o,j){ return j===i || !o.all.has(w); }); });
      if(safe.length<4){ ok=false; break; }
      var four=A.shuffle(safe.slice()).slice(0,4); four.forEach(function(w){ used.add(w); });
      out.push({lv:pick[i].lv, name:pick[i].name, words:four});
    }
    if(ok){ pick.forEach(function(p){ recent.push(p.name); }); recent=recent.slice(-24); return out; }
  }
  return null;
}
function start(){
  A.closeModal(); pz=make(); sel=[]; solved=[]; lives=4; guesses=[]; done=false;
  left=A.shuffle(pz.reduce(function(a,g){ return a.concat(g.words); },[]));
  msg(""); render();
}
function msg(s){ $("lkMsg").textContent=s; }
function groupOf(w){ for(var i=0;i<pz.length;i++) if(pz[i].words.indexOf(w)>=0) return pz[i]; }
function render(){
  var sv=$("lkSolved"); sv.innerHTML="";
  solved.forEach(function(g){ var d=A.el("div","lband lv"+g.lv); d.innerHTML="<b>"+A.esc(g.name)+"</b><span>"+g.words.join(", ")+"</span>"; sv.appendChild(d); });
  var gr=$("lkGrid"); gr.innerHTML="";
  left.forEach(function(w){
    var c=A.el("button","lcard"+(sel.indexOf(w)>=0?" sel":""), w);
    if(w.length>9) c.style.fontSize="12px"; else if(w.length>7) c.style.fontSize="14px"; else c.style.fontSize="16px";
    c.addEventListener("click",function(){ toggle(w); });
    gr.appendChild(c);
  });
  var lv=$("lkLives"); lv.innerHTML="Mistakes left&nbsp;";
  for(var i=0;i<4;i++) lv.appendChild(A.el("i", i<lives?"":"gone"));
  $("lkSubmit").setAttribute("aria-disabled", sel.length===4&&!done ? "false":"true");
  $("lkClear").setAttribute("aria-disabled", sel.length&&!done ? "false":"true");
  var st=A.store.get("lkStats",{played:0,won:0});
  $("stat").textContent="solved "+st.won+"/"+st.played;
}
function toggle(w){
  if(done) return;
  var i=sel.indexOf(w);
  if(i>=0) sel.splice(i,1); else if(sel.length<4) sel.push(w); else return;
  A.sfx("sel"); msg(""); render();
}
function submit(){
  if(done || sel.length!==4) return;
  var key=sel.slice().sort().join("|");
  if(guesses.indexOf(key)>=0){ msg("Already guessed"); return; }
  guesses.push(key);
  var g=groupOf(sel[0]);
  if(sel.every(function(w){ return groupOf(w)===g; })){
    solved.push(g); left=left.filter(function(w){ return g.words.indexOf(w)<0; }); sel=[]; A.sfx("good");
    if(solved.length===4){ done=true; render(); setTimeout(function(){ end(true); }, 500); return; }
    render(); return;
  }
  // count the biggest overlap with one group for "one away"
  var best=0; pz.forEach(function(p){ var n=sel.filter(function(w){ return p.words.indexOf(w)>=0; }).length; if(n>best) best=n; });
  lives--; A.sfx("bad");
  msg(best===3 ? "One away…" : "Not a group");
  render();
  var g2=$("lkGrid"); g2.classList.remove("shake"); void g2.offsetWidth; g2.classList.add("shake");
  if(lives<=0){ done=true; setTimeout(function(){ pz.forEach(function(p){ if(solved.indexOf(p)<0) solved.push(p); }); left=[]; sel=[]; render(); end(false); }, 600); }
}
function end(won){
  var st=A.store.get("lkStats",{played:0,won:0}); st.played++; if(won) st.won++; A.store.set("lkStats",st); render();
  A.sfx(won?"win":"lose");
  var rows = guesses.map(function(k){ return k.split("|").map(function(w){ return "l"+groupOf(w).lv; }); });
  var mistakes = 4-lives;
  A.modal(
    '<div class="kick">Connections · unlimited</div><h2>'+(won ? (mistakes===0?"PERFECT":"SOLVED") : "NEXT TIME")+'</h2>'+
    '<div class="score"><div class="n">'+(won?(4-mistakes):0)+'<span style="font-size:22px">/4</span></div><div class="u"><b>'+(won?"lives left":"groups missed")+'</b>'+mistakes+' mistake'+(mistakes===1?"":"s")+'<br>solved '+st.won+' of '+st.played+'</div></div>'+
    A.miniGrid(rows)+
    pz.map(function(p){ return '<p><b style="color:var(--'+["","amber","teal","pink","violet"][p.lv]+')">'+A.esc(p.name)+'</b>: '+p.words.join(", ")+'</p>'; }).join("")+
    '<div class="cardbtns"><button class="btn hot" id="lkAgain">New puzzle</button><button class="btn" id="lkClose">Look at board</button></div>'+
    '<div class="hint">Enter: new puzzle · Esc: close</div>',
    function(e){ if(e.key==="Enter"){ e.preventDefault(); start(); } }
  );
  $("lkAgain").addEventListener("click", start); $("lkClose").addEventListener("click", A.closeModal);
}
A.games.links = {
  init:function(){
    $("lkNew").addEventListener("click", start);
    $("lkShuffle").addEventListener("click", function(){ if(!done){ A.shuffle(left); A.sfx("sel"); render(); } });
    $("lkClear").addEventListener("click", function(){ sel=[]; render(); });
    $("lkSubmit").addEventListener("click", submit);
  },
  enter:function(){ if(!pz) start(); else render(); },
  key:function(e){ if(e.key==="Enter"){ e.preventDefault(); if(done) start(); else submit(); } }
};
})();
