// WORDLE: classic 6-guess word game, unlimited rounds.
(function(){
"use strict";
var A = window.A, $ = A.$;
var ANSWERS=null, target="", rows=[], input="", done=false, kb=null, keyState={};

function pool(){
  if(ANSWERS) return ANSWERS;
  // common words, skipping most plurals and blocked words
  ANSWERS = A.COMMON.filter(function(w){ return !A.BLOCK.has(w) && !(/[^s]s$/.test(w) && !/(us|is|ss)$/.test(w)); });
  return ANSWERS;
}
function start(){
  A.closeModal(); var p=pool(), recent=A.store.get("wdRecent",[]);
  do { target=p[Math.floor(Math.random()*p.length)]; } while(recent.indexOf(target)>=0 && recent.length<p.length);
  recent.push(target); A.store.set("wdRecent", recent.slice(-300));
  rows=[]; input=""; done=false; keyState={}; msg(""); render();
}
function msg(s){ $("wdMsg").textContent=s; }
function render(){
  var b=$("wdBoard"); b.innerHTML="";
  for(var r=0;r<6;r++){
    var row=A.el("div","trow");
    for(var i=0;i<5;i++){
      var cls="tile", ch="";
      if(r<rows.length){ cls+=" "+rows[r].r[i]; ch=rows[r].w[i]; }
      else if(r===rows.length && !done){ ch=input[i]||""; if(ch) cls+=" typing"; }
      row.appendChild(A.el("div",cls,ch));
    }
    b.appendChild(row);
  }
  kb.paint(keyState);
  var st=A.store.get("wdStats",{played:0,won:0,streak:0});
  $("stat").textContent="streak "+st.streak+" · won "+st.won+"/"+st.played;
}
function press(k){
  if(done) return;
  if(k==="ENTER") return commit();
  if(k==="DEL"){ input=input.slice(0,-1); render(); return; }
  if(/^[a-z]$/.test(k) && input.length<5){ input+=k; A.sfx("key"); render(); var row=$("wdBoard").children[rows.length]; if(row) row.children[input.length-1].classList.add("pop"); }
}
function commit(){
  var row=$("wdBoard").children[rows.length];
  function bad(s){ msg(s); A.sfx("bad"); row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake"); }
  if(input.length<5) return bad("Need 5 letters");
  if(!A.VALID.has(input)) return bad("Not in the word list");
  var res=A.score(input,target); rows.push({w:input,r:res}); A.mergeKeys(keyState,input,res);
  var won = input===target; input=""; msg(""); A.sfx("flip"); render();
  var just=$("wdBoard").children[rows.length-1]; Array.prototype.forEach.call(just.children,function(t,i){ t.style.animationDelay=(i*70)+"ms"; t.classList.add("flip"); });
  if(won || rows.length===6){ done=true; setTimeout(function(){ end(won); }, 520); }
}
function end(won){
  var st=A.store.get("wdStats",{played:0,won:0,streak:0,best:0});
  st.played++; if(won){ st.won++; st.streak++; st.best=Math.max(st.best||0,st.streak); } else st.streak=0;
  A.store.set("wdStats",st); render();
  A.sfx(won?"win":"lose");
  var title = won ? (["GENIUS","MAGNIFICENT","IMPRESSIVE","SPLENDID","GREAT","PHEW"][rows.length-1]) : "OUT OF GUESSES";
  A.modal(
    '<div class="kick">Wordle · unlimited</div><h2>'+title+'</h2>'+
    '<div class="score"><div class="n">'+(won?rows.length:"X")+'<span style="font-size:22px">/6</span></div><div class="u"><b>'+target.toUpperCase()+'</b>streak '+st.streak+' · best '+(st.best||0)+'<br>won '+st.won+' of '+st.played+'</div></div>'+
    A.miniGrid(rows.map(function(r){ return r.r; }))+
    '<div class="cardbtns"><button class="btn hot" id="wdAgain">Next word</button><button class="btn" id="wdClose">Look at board</button></div>'+
    '<div class="hint">Enter: next word · Esc: close</div>',
    function(e){ if(e.key==="Enter"){ e.preventDefault(); start(); } }
  );
  $("wdAgain").addEventListener("click", start); $("wdClose").addEventListener("click", A.closeModal);
}
A.games.wordle = {
  _debug:function(){ return target; },
  init:function(){ kb=A.keyboard($("wdKb"), press); $("wdNew").addEventListener("click", start); },
  enter:function(){ if(!target) start(); else render(); },
  key:function(e){
    if(e.key==="Enter"){ e.preventDefault(); if(done) start(); else press("ENTER"); }
    else if(e.key==="Backspace"){ e.preventDefault(); press("DEL"); }
    else if(/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
  }
};
})();
