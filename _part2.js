(function(){
  "use strict";
  // ---- fullscreen (try on load + on first gesture) ----
  function goFullscreen(){ const el=document.documentElement; if(!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(function(){}); }
  try{ goFullscreen(); }catch(e){}
  window.addEventListener("pointerdown", goFullscreen, {once:false});
  document.getElementById("bFull").addEventListener("click", function(){ if(document.fullscreenElement){ document.exitFullscreen(); } else { goFullscreen(); } });

  // ---- parse word data ----
  var VALID = new Set();
  (function(){ var S=window.VALID||""; for(var i=0;i+5<=S.length;i+=5) VALID.add(S.substr(i,5)); })();
  var COMMON = [];
  (function(){ var S=window.COMMON||""; for(var i=0;i+5<=S.length;i+=5){ var w=S.substr(i,5); if(VALID.has(w)) COMMON.push(w); } })();

  // ---- ladder graph via wildcard buckets ----
  var buckets = new Map();
  function buildBuckets(){
    VALID.forEach(function(w){
      for(var i=0;i<5;i++){ var k=w.slice(0,i)+"*"+w.slice(i+1); var a=buckets.get(k); if(!a){a=[];buckets.set(k,a);} a.push(w); }
    });
  }
  function neighbors(w){ var r=[]; for(var i=0;i<5;i++){ var a=buckets.get(w.slice(0,i)+"*"+w.slice(i+1)); if(a) for(var j=0;j<a.length;j++) if(a[j]!==w) r.push(a[j]); } return r; }

  function bfs(target){
    var dist=new Map(); dist.set(target,0); var q=[target], h=0;
    while(h<q.length){ var w=q[h++]; var d=dist.get(w); var ns=neighbors(w); for(var i=0;i<ns.length;i++){ if(!dist.has(ns[i])){ dist.set(ns[i],d+1); q.push(ns[i]); } } }
    return dist;
  }

  // ---- seeded RNG ----
  function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function dailyNumber(){ var ep=Date.UTC(2025,0,1); var now=new Date(); var today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()); return Math.floor((today-ep)/86400000)+1; }

  function makePuzzle(seed){
    var rng=mulberry32(seed>>>0);
    for(var attempt=0; attempt<120; attempt++){
      var target=COMMON[Math.floor(rng()*COMMON.length)];
      if(!target) continue;
      if(neighbors(target).length===0) continue;
      var dist=bfs(target);
      var byD={};
      for(var i=0;i<COMMON.length;i++){ var d=dist.get(COMMON[i]); if(d>=3 && d<=6){ (byD[d]=byD[d]||[]).push(COMMON[i]); } }
      var order=[4,5,3,6];
      for(var o=0;o<order.length;o++){ var D=order[o], arr=byD[D]; if(arr && arr.length){ var start=arr[Math.floor(rng()*arr.length)]; return {start:start,target:target,par:D}; } }
    }
    return {start:"stone",target:"crane",par:4}; // extreme fallback
  }

  // ---- scoring ----
  function diff1(a,b){ var d=0; for(var i=0;i<5;i++){ if(a[i]!==b[i]){ d++; if(d>1) return false; } } return d===1; }
  function score(guess,target){
    var res=["absent","absent","absent","absent","absent"], tc={}, i;
    for(i=0;i<5;i++) tc[target[i]]=(tc[target[i]]||0)+1;
    for(i=0;i<5;i++) if(guess[i]===target[i]){ res[i]="correct"; tc[guess[i]]--; }
    for(i=0;i<5;i++) if(res[i]==="absent" && tc[guess[i]]>0){ res[i]="present"; tc[guess[i]]--; }
    return res;
  }

  // ---- state ----
  var mode="daily", puzzle=null, chain=[], input="", finished=false, keyState={}, puzzleId=0;
  function cur(){ return chain[chain.length-1].word; }

  function startPuzzle(m, seed, id){
    mode=m; puzzleId=id;
    puzzle=makePuzzle(seed);
    chain=[{word:puzzle.start, res:score(puzzle.start, puzzle.target)}];
    input=""; finished=false; keyState={};
    applyKeyStates();
    document.getElementById("modeline").textContent = (m==="daily") ? ("DAILY #"+id+"  ·  "+new Date().toISOString().slice(0,10)) : ("UNLIMITED  ·  PAR "+puzzle.par);
    document.getElementById("bDaily").classList.toggle("on", m==="daily");
    document.getElementById("bUnlim").classList.toggle("on", m==="unlimited");
    document.getElementById("bNew").style.display = (m==="unlimited") ? "" : "none";
    msg("SOURCE: "+puzzle.start.toUpperCase()+"  ·  PAR "+puzzle.par);
    render();
  }

  function applyKeyStates(){
    keyState={};
    for(var c=0;c<chain.length;c++){ var w=chain[c].word, r=chain[c].res; for(var i=0;i<5;i++){ var L=w[i], s=r[i], prev=keyState[L];
      if(s==="correct") keyState[L]="correct";
      else if(s==="present" && prev!=="correct") keyState[L]="present";
      else if(s==="absent" && !prev) keyState[L]="absent";
    } }
  }

  // ---- rendering ----
  var boardEl=document.getElementById("board"), inputEl=document.getElementById("input"), lockEl=document.getElementById("lock"), kbEl=document.getElementById("kb");

  function render(){
    // target lock aid: greens discovered
    var locked=["","","","",""];
    for(var c=0;c<chain.length;c++){ var w=chain[c].word,r=chain[c].res; for(var i=0;i<5;i++) if(r[i]==="correct") locked[i]=w[i]; }
    lockEl.innerHTML="";
    for(i=0;i<5;i++){ var s=document.createElement("div"); s.className="slot"+(locked[i]?"":" blank"); s.textContent=locked[i]?locked[i].toUpperCase():"·"; lockEl.appendChild(s); }
    // chain
    boardEl.innerHTML="";
    for(c=0;c<chain.length;c++){
      var row=document.createElement("div"); row.className="row"+(c===chain.length-1 && !finished ? " cur":"");
      for(i=0;i<5;i++){ var t=document.createElement("div"); var cls = c===0 ? "start" : chain[c].res[i]; t.className="tile "+cls; t.textContent=chain[c].word[i].toUpperCase(); row.appendChild(t); }
      boardEl.appendChild(row);
    }
    boardEl.scrollTop=boardEl.scrollHeight;
    // input row
    inputEl.innerHTML="";
    for(i=0;i<5;i++){ var it=document.createElement("div"); it.className="tile"+(input[i]?" typing":""); it.textContent=input[i]?input[i].toUpperCase():""; inputEl.appendChild(it); }
    // keyboard
    renderKeyboard();
  }

  var KROWS=["qwertyuiop","asdfghjkl","zxcvbnm"];
  function renderKeyboard(){
    kbEl.innerHTML="";
    for(var r=0;r<3;r++){
      var row=document.createElement("div"); row.className="krow";
      if(r===2){ row.appendChild(mkKey("ENTER",true)); }
      var letters=KROWS[r];
      for(var i=0;i<letters.length;i++) row.appendChild(mkKey(letters[i],false));
      if(r===2){ row.appendChild(mkKey("DEL",true)); }
      kbEl.appendChild(row);
    }
  }
  function mkKey(label,wide){
    var k=document.createElement("div"); k.className="key"+(wide?" wide":"");
    if(!wide && keyState[label]) k.className+=" "+keyState[label];
    k.textContent=label.length===1?label.toUpperCase():label;
    k.addEventListener("click", function(){ onKey(label); });
    return k;
  }

  // ---- input handling ----
  function msg(s){ document.getElementById("msg").textContent=s; }
  function flashMsg(s){ msg(s); }

  function onKey(label){
    goFullscreen();
    if(finished) return;
    if(label==="ENTER"){ commit(); return; }
    if(label==="DEL"){ input=input.slice(0,-1); render(); return; }
    if(/^[a-z]$/.test(label)){ if(input.length<5){ input+=label; render(); } }
  }

  function commit(){
    if(input.length<5){ flashMsg("NEED 5 LETTERS"); return; }
    if(!VALID.has(input)){ flashMsg("NOT IN DATABASE"); shakeInput(); return; }
    if(!diff1(input,cur())){ flashMsg("CHANGE EXACTLY ONE LETTER"); shakeInput(); return; }
    var r=score(input,puzzle.target);
    chain.push({word:input, res:r});
    applyKeyStates();
    var done = (input===puzzle.target);
    input="";
    if(done){ finished=true; render(); win(); }
    else { msg(""); render(); }
  }

  function shakeInput(){ inputEl.animate([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}],{duration:220}); }

  function undo(){ if(finished) return; if(chain.length>1){ chain.pop(); applyKeyStates(); input=""; msg("STEPPED BACK"); render(); } }

  // ---- win + share ----
  function win(){
    var steps=chain.length-1;
    document.getElementById("winSteps").textContent=steps;
    document.getElementById("winPar").textContent=puzzle.par;
    var verdict = steps<=puzzle.par ? "PERFECT SPLICE" : (steps<=puzzle.par+2 ? "CLEAN SPLICE" : "SPLICED");
    document.getElementById("winTitle").textContent=verdict;
    document.getElementById("winPath").innerHTML="<span style='color:var(--cyan);font-family:\"Courier New\",monospace'>"+puzzle.start.toUpperCase()+" &rarr; "+puzzle.target.toUpperCase()+"</span>";
    var emo={correct:"🟩",present:"🟨",absent:"⬛"};
    var g="";
    for(var c=0;c<chain.length;c++){ for(var i=0;i<5;i++) g+=emo[chain[c].res[i]]; g+="\n"; }
    document.getElementById("winGrid").textContent=g;
    document.getElementById("bWinNew").style.display = (mode==="unlimited")?"":"none";
    document.getElementById("win").classList.add("show");
  }
  function shareText(){
    var emo={correct:"🟩",present:"🟨",absent:"⬛"};
    var head = mode==="daily" ? ("SPLICE Daily #"+puzzleId) : "SPLICE Unlimited";
    var steps=chain.length-1;
    var s=head+"  "+steps+" steps (par "+puzzle.par+")\n";
    for(var c=0;c<chain.length;c++){ for(var i=0;i<5;i++) s+=emo[chain[c].res[i]]; s+="\n"; }
    s+="playdaily? "+location.origin+location.pathname;
    return s;
  }

  // ---- buttons ----
  document.getElementById("bUndo").addEventListener("click", undo);
  document.getElementById("bDaily").addEventListener("click", function(){ var n=dailyNumber(); startPuzzle("daily", _seed(n), n); });
  document.getElementById("bUnlim").addEventListener("click", function(){ var id=(Math.random()*1e9)|0; startPuzzle("unlimited", id, id); });
  document.getElementById("bNew").addEventListener("click", function(){ var id=(Math.random()*1e9)|0; startPuzzle("unlimited", id, id); });
  document.getElementById("bWinNew").addEventListener("click", function(){ document.getElementById("win").classList.remove("show"); var id=(Math.random()*1e9)|0; startPuzzle("unlimited", id, id); });
  document.getElementById("bHelp").addEventListener("click", function(){ document.getElementById("help").classList.add("show"); });
  document.getElementById("bHelpClose").addEventListener("click", function(){ document.getElementById("help").classList.remove("show"); try{localStorage.setItem("splice_seen","1");}catch(e){} });
  document.getElementById("bWinClose").addEventListener("click", function(){ document.getElementById("win").classList.remove("show"); });
  document.getElementById("bShare").addEventListener("click", function(){
    var txt=shareText();
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){ document.getElementById("bShare").textContent="COPIED!"; setTimeout(function(){document.getElementById("bShare").textContent="Share";},1500); }).catch(function(){ prompt("Copy your result:", txt); }); }
    else prompt("Copy your result:", txt);
  });

  // deterministic daily seed scramble
  function _seed(n){ return (n*2654435761 ^ 0x9e3779b9)>>>0; }

  document.addEventListener("keydown", function(e){
    if(document.getElementById("help").classList.contains("show") || document.getElementById("win").classList.contains("show")){
      if(e.key==="Escape"){ document.getElementById("help").classList.remove("show"); document.getElementById("win").classList.remove("show"); }
      return;
    }
    var k=e.key;
    if(k==="Enter"){ onKey("ENTER"); e.preventDefault(); }
    else if(k==="Backspace"){ onKey("DEL"); e.preventDefault(); }
    else if(/^[a-zA-Z]$/.test(k)){ onKey(k.toLowerCase()); }
  });

  // ---- boot ----
  msg("DECRYPTING WORD-NET...");
  setTimeout(function(){
    buildBuckets();
    var n=dailyNumber();
    startPuzzle("daily", _seed(n), n);
    try{ if(!localStorage.getItem("splice_seen")) document.getElementById("help").classList.add("show"); }catch(e){ document.getElementById("help").classList.add("show"); }
  }, 30);
})();
</script>
</body>
</html>
