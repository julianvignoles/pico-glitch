// Pixel art: 5x7 font, Clawd sprite, and the animated night-city backdrop.
(function(){
"use strict";
var A = window.A;

// ---------- palette ----------
var P = A.PAL = {
  night:"#0b0a1a", sky1:"#120d2b", sky2:"#23143f", sky3:"#3d1d4f", haze:"#6a2a55",
  far:"#191433", farWin:"#3b2f63", mid:"#110e25", near:"#08071a",
  amber:"#ffb547", warm:"#ffd27a", teal:"#3de0c8", pink:"#ff4f9a", violet:"#9b7bff",
  clawd:"#d97757", clawdDark:"#a9573c", ink:"#ece6d6", red:"#ff3b3b", moon:"#f3e6c8"
};

// ---------- 5x7 font ----------
var G = {
A:".###.#...##...#######...##...##...#",B:"####.#...##...#####.#...##...#####.",C:".###.#...##....#....#....#...#.###.",
D:"####.#...##...##...##...##...#####.",E:"######....#....####.#....#....#####",F:"######....#....####.#....#....#....",
G:".###.#...##....#.####...##...#.####",H:"#...##...##...#######...##...##...#",I:".###...#....#....#....#....#...###.",
J:"..###...#....#....#....#.#..#..##..",K:"#...##..#.#.#..##...#.#..#..#.#...#",L:"#....#....#....#....#....#....#####",
M:"#...###.###.#.##.#.##...##...##...#",N:"#...##...###..##.#.##..###...##...#",O:".###.#...##...##...##...##...#.###.",
P:"####.#...##...#####.#....#....#....",Q:".###.#...##...##...##.#.##..#..##.#",R:"####.#...##...#####.#.#..#..#.#...#",
S:".#####....#.....###.....#....#####.",T:"#####..#....#....#....#....#....#..",U:"#...##...##...##...##...##...#.###.",
V:"#...##...##...##...##...#.#.#...#..",W:"#...##...##...##.#.##.#.##.#.#.#.#.",X:"#...##...#.#.#...#...#.#.#...##...#",
Y:"#...##...#.#.#...#....#....#....#..",Z:"#####....#...#...#...#...#....#####",
"0":".###.#...##..###.#.###..##...#.###.","1":"..#...##....#....#....#....#...###.","2":".###.#...#....#...#...#...#...#####",
"3":"####.....#....#.###.....#....#####.","4":"...#...##..#.#.#..#.#####...#....#.","5":"######....####.....#....##...#.###.",
"6":".###.#....#....####.#...##...#.###.","7":"#####....#...#...#...#....#....#...","8":".###.#...##...#.###.#...##...#.###.",
"9":".###.#...##...#.####....#....#.###.","/":"....#....#...#...#...#...#....#....",">":"#.....#.....#.....#...#...#...#....",
"_":"..............................#####","-":"...............#####...............","!":"..#....#....#....#....#.........#..",
".":"................................#..",":":".......#..............#............"," ":"...................................",
"+":"......#....#..#####..#....#........","?":".###.#...#....#...#...#.........#..","*":"......#.#..###..#####.###..#.#.....",
"<":"....#...#...#...#.....#.....#.....#","=":"..........#####.....#####.........."
};
A.textWidth = function(str, s){ return str.length*6*s - s; };
A.drawText = function(ctx, str, x, y, s, color){
  ctx.fillStyle = color; str = String(str).toUpperCase();
  for(var c=0;c<str.length;c++){
    var g = G[str[c]] || G[" "];
    for(var i=0;i<35;i++) if(g.charCodeAt(i)===35) ctx.fillRect(x+(c*6+(i%5))*s, y+((i/5)|0)*s, s, s);
  }
};
A.glyph = function(ch){ return G[ch] || G[" "]; };

// ---------- Clawd (the little orange Claude Code guy) ----------
// 13x9 body. O = orange, D = shade, K = eye. Legs are drawn per frame.
var CLAWD_BODY = [
  "..OOOOOOOOO..",
  "..OOOOOOOOO..",
  "..OOKOOOKOO..",
  "..OOKOOOKOO..",
  "OOOOOOOOOOOOO",
  "OOOOOOOOOOOOO",
  "..OOOOOOOOO..",
  "..DDDDDDDDD.."
];
var LEGS = {
  stand:["..O.O...O.O..","..O.O...O.O.."],
  walkA:["..O.O...O.O..",".O...O.O...O."],
  walkB:["...O.O.O.O...","...O.O.O.O..."],
  climbA:["..O.......O..","..O..........",],
  climbB:["..O.......O..","..........O.."]
};
A.drawClawd = function(ctx, x, y, s, frame, opts){
  opts = opts||{};
  var body = CLAWD_BODY, legs = LEGS[frame] || LEGS.stand;
  var blink = opts.blink;
  for(var r=0;r<body.length;r++){
    for(var c=0;c<13;c++){
      var ch = body[r][c]; if(ch===".") continue;
      if(ch==="K" && blink){ ch = (r===3)?"K":"O"; }
      ctx.fillStyle = ch==="O"?P.clawd : ch==="D"?P.clawdDark : "#1a0f0c";
      // arms raised when climbing / cheering
      var ry = r;
      if(opts.armsUp && r>=4 && r<=5 && (c<2||c>10)) ry = r-3;
      ctx.fillRect(x+(opts.flip?12-c:c)*s, y+ry*s, s, s);
    }
  }
  ctx.fillStyle = P.clawd;
  for(var lr=0;lr<2;lr++) for(var lc=0;lc<13;lc++) if(legs[lr][lc]==="O") ctx.fillRect(x+(opts.flip?12-lc:lc)*s, y+(8+lr)*s, s, s);
};
A.clawdDataURL = function(scale, frame, opts){
  var cv=document.createElement("canvas"); cv.width=13*scale; cv.height=10*scale;
  A.drawClawd(cv.getContext("2d"),0,0,scale,frame||"stand",opts); return cv.toDataURL();
};

// ---------- seeded rng ----------
A.rng = function(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; };

// ---------- night city ----------
// Built for smooth motion on slow laptops (Chromebooks): every layer is its own
// small pixel-art canvas, drawn rarely, and slid around with CSS transforms,
// which the GPU handles. Per frame we only update a handful of transforms.
// Positions are rounded to whole screen pixels so the art stays crisp.
var City = A.City = {};
var root, VW=0, VH=0, W=320, H=180, scale=4, running=false, t0=0, last=0, slowAt=-1;
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var sky=null, layers=[], cars=[], blimp=null, walker=null, rain=null, stars=[], skyBase=null;
var SIGN_WORDS = ["RAMEN","24H","HOTEL","OPEN","NOODLE","ARCADE","BAR","SHIP IT","> _","TACO","PHO","CAFE","LOFT","DINER","GYM","CLIMB","BOULDER","KARAOKE"];
var NEON = [P.pink,P.teal,P.amber,P.violet,P.clawd];

function mk(w, h, cssScale){
  var c=document.createElement("canvas"); c.width=Math.max(1,Math.ceil(w)); c.height=Math.max(1,Math.ceil(h));
  c.style.width=(c.width*cssScale)+"px"; c.style.height=(c.height*cssScale)+"px";
  root.appendChild(c); return c;
}
function move(el, x, y){ el.style.transform = "translate3d("+Math.round(x)+"px,"+Math.round(y)+"px,0)"; }

function resize(){
  VW = window.innerWidth; VH = window.innerHeight;
  scale = Math.max(2, Math.round(VH/200));
  W = Math.ceil(VW/scale); H = Math.ceil(VH/scale);
  build();
}

function build(){
  var r = A.rng(1337);
  root.innerHTML = "";
  // ---- sky (gradient + moon baked; stars and searchlights redrawn a few times a second)
  skyBase = document.createElement("canvas"); skyBase.width=W; skyBase.height=H;
  var sc = skyBase.getContext("2d");
  var bands = [P.night,P.sky1,P.sky2,P.sky3,P.haze], bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(var y=0;y<H;y++){
    var f = Math.pow(y/H,1.6)*(bands.length-1), i=Math.floor(f), fr=f-i;
    for(var x=0;x<W;x++){ sc.fillStyle = bands[(fr*16 > bayer[(y%4)*4+(x%4)]) ? Math.min(i+1,bands.length-1) : i]; sc.fillRect(x,y,1,1); }
  }
  var mx=Math.floor(W*0.78), my=Math.floor(H*0.16), mr=Math.max(7,Math.floor(H*0.06));
  sc.fillStyle="rgba(243,230,200,0.06)"; sc.beginPath(); sc.arc(mx,my,mr*2.2,0,6.29); sc.fill();
  sc.fillStyle=P.moon; for(var yy=-mr;yy<=mr;yy++){ var hw=Math.floor(Math.sqrt(mr*mr-yy*yy)); sc.fillRect(mx-hw,my+yy,hw*2,1); }
  sc.fillStyle="#d9c9a6"; sc.fillRect(mx-3,my-2,3,2); sc.fillRect(mx+2,my+3,2,2); sc.fillRect(mx-1,my+4,1,1);
  stars = []; for(var s=0;s<Math.floor(W*H/900);s++) stars.push({x:Math.floor(r()*W), y:Math.floor(r()*H*0.45), p:r()*6.28});
  sky = mk(W, H, scale);

  // ---- far skyline, then flying cars + blimp, then mid skyline, haze, near rooftops
  var far = mkLayer(r, {base:H*0.42, var:H*0.22, wmin:10, wmax:22, color:P.far, win:P.farWin, winRate:0.12, speed:1.2, signs:false});
  blimp = {x: W*0.7, cv: mk(58, 18, scale)};
  cars = []; for(var c=0;c<5;c++) cars.push(newCar(r, true));
  var mid = mkLayer(r, {base:H*0.30, var:H*0.25, wmin:14, wmax:30, color:P.mid, win:null, winRate:0.30, speed:3, signs:true});
  var haze = document.createElement("div"); haze.style.cssText="position:absolute;left:0;right:0;bottom:0;height:28%;background:rgba(106,42,85,0.10)"; root.appendChild(haze);
  var near = mkLayer(r, {base:H*0.14, var:H*0.06, wmin:26, wmax:50, color:P.near, win:null, winRate:0.10, speed:6, signs:false, roof:true});
  layers = [far, mid, near];
  // ---- Clawd walking the rooftops
  walker = {x:-20, dir:1, hop:0, idle:0, key:"", cv: mk(28, 24, scale)};
  // ---- rain: one pre-drawn sheet that slides down and wraps
  rain = null;
  if(!reduce){
    var tile = 160*scale, rc = document.createElement("canvas");
    rc.width = VW + 120; rc.height = VH + tile;
    rc.style.width = rc.width+"px"; rc.style.height = rc.height+"px"; rc.style.imageRendering="auto";
    var g = rc.getContext("2d"); g.fillStyle = "rgba(160,170,255,0.26)";
    var n = Math.floor(rc.width*tile/9000), pw = Math.max(1, scale-2);
    for(var d=0; d<n; d++){
      var dx = Math.floor(r()*rc.width), dy = Math.floor(r()*tile), len = (2+Math.floor(r()*4))*scale;
      for(var rep=dy-tile; rep<rc.height; rep+=tile) g.fillRect(dx, rep, pw, len);
    }
    root.appendChild(rc); rain = {cv:rc, tile:tile};
  }
  drawSlow(0);
}

function mkLayer(r, o){
  var tileW = Math.max(W*2, 480), L = {o:o, tileW:tileW, bld:[], live:[], tile:null, cv:null};
  var x = 0;
  while(x < tileW){
    var w = Math.floor(o.wmin + r()*(o.wmax-o.wmin));
    if(x + w > tileW) w = tileW - x;
    var h = Math.floor(o.base + r()*o.var);
    var b = {x:x, w:w, h:h, wins:[], ant: r()<0.35, tower: r()<0.2, sign:null, tank:o.roof && r()<0.35, ac:o.roof && r()<0.5};
    for(var wy=H-h+4; wy<H-2; wy+=4) for(var wx=x+2; wx<x+w-2; wx+=3){
      if(r()<o.winRate) b.wins.push({x:wx,y:wy, c: o.win || (r()<0.75 ? (r()<0.6?P.amber:P.warm) : P.teal), f: r()<0.08 ? r()*10 : -1});
    }
    if(o.signs && r()<0.45 && w>=14){
      // signs must fit their building so neighbours never cut them off
      var fitsH = SIGN_WORDS.filter(function(s){ return A.textWidth(s,1)+4 <= w-2; });
      var fitsV = SIGN_WORDS.filter(function(s){ return s.indexOf(" ")<0 && s.length<=6 && s.length*8+1 <= h*0.6; });
      var vertical = fitsV.length && (r()<0.5 || !fitsH.length);
      var list = vertical ? fitsV : fitsH;
      if(list.length){
        var word = list[Math.floor(r()*list.length)];
        b.sign = {word:word, vertical:vertical, color:NEON[Math.floor(r()*NEON.length)], y: H-h+6+Math.floor(r()*Math.max(1,h*0.4)), ph:r()*10, flick:r()<0.25};
      }
    }
    L.bld.push(b); x += w + (o.roof ? Math.floor(r()*6) : (r()<0.3?1:0));
  }
  bakeLayer(L);
  // visible canvas holds two copies of the tile side by side, so sliding wraps seamlessly
  L.cv = mk(tileW*2, H+12, scale);
  L.cv.style.top = (-12*scale)+"px";
  return L;
}

// Pre-draw everything about a layer that never changes. Blinking bits go in L.live.
function bakeLayer(L){
  var o=L.o, c=document.createElement("canvas"); c.width=L.tileW; c.height=H+12;
  var g=c.getContext("2d"); g.translate(0,12);
  L.bld.forEach(function(b,i){
    var bx=b.x;
    g.fillStyle=o.color; g.fillRect(bx, H-b.h, b.w, b.h);
    if(b.tower) g.fillRect(bx+Math.floor(b.w/2)-2, H-b.h-6, 4, 6);
    if(b.ant){ g.fillRect(bx+3, H-b.h-10, 1, 10); L.live.push({k:"ant", x:bx+3, y:H-b.h-11, ph:i}); }
    if(b.tank){ g.fillRect(bx+b.w-12, H-b.h-9, 8, 6); g.fillRect(bx+b.w-11, H-b.h-3, 1, 3); g.fillRect(bx+b.w-6, H-b.h-3, 1, 3); }
    if(b.ac){ g.fillStyle="#141128"; g.fillRect(bx+4, H-b.h-3, 6, 3); }
    b.wins.forEach(function(wn){
      g.fillStyle=wn.c; g.fillRect(wn.x, wn.y, 1, 2);
      if(wn.f>=0) L.live.push({k:"win", x:wn.x, y:wn.y, ph:wn.f, c:o.color});
    });
    if(b.sign){
      var s=b.sign, sw, sh, sx;
      if(s.vertical){ sw=7; sh=s.word.length*8+1; sx=bx+2; } else { sw=A.textWidth(s.word,1)+4; sh=11; sx=bx+Math.max(1,Math.floor((b.w-sw)/2)); }
      g.globalAlpha=0.18; g.fillStyle=s.color; g.fillRect(sx-2,s.y-2,sw+4,sh+4); g.globalAlpha=1;
      g.fillStyle="#07060f"; g.fillRect(sx, s.y, sw, sh);
      g.fillStyle=s.color; g.fillRect(sx,s.y,sw,1); g.fillRect(sx,s.y+sh-1,sw,1);
      if(s.vertical){ for(var k=0;k<s.word.length;k++) A.drawText(g, s.word[k], sx+1, s.y+2+k*8, 1, s.color); }
      else A.drawText(g, s.word, sx+2, s.y+2, 1, s.color);
      if(s.flick) L.live.push({k:"sign", x:sx, y:s.y, w:sw, h:sh, ph:s.ph});
    }
  });
  L.tile=c;
}

function newCar(r, anywhere){
  var dir = r()<0.5?1:-1, col = r()<0.5?P.teal:P.pink;
  var car = {x: anywhere ? r()*W : (dir>0?-18:W+18), y: Math.floor(H*0.18 + r()*H*0.38), v:(14+r()*22)*dir, cv:null};
  var cv = car.cv = mk(16, 3, scale), g = cv.getContext("2d");
  // body at one end, light trail behind it
  var bx = dir>0 ? 11 : 0, tx = dir>0 ? 0 : 6;
  g.globalAlpha=0.35; g.fillStyle=col; g.fillRect(tx, 2, 10, 1); g.globalAlpha=1;
  g.fillStyle="#1b1733"; g.fillRect(bx,1,5,2); g.fillStyle="#2c2650"; g.fillRect(bx+1,0,3,1);
  g.fillStyle = dir>0 ? P.warm : P.red; g.fillRect(dir>0 ? bx+4 : bx, 1, 1, 1);
  // keep the car in its layer slot: insert right after the blimp canvas
  if(blimp && blimp.cv.nextSibling) root.insertBefore(cv, blimp.cv.nextSibling);
  return car;
}

// Things that only need a few redraws per second: twinkles, blinking windows,
// flickering signs, the blimp's scrolling text.
function drawSlow(t){
  var g = sky.getContext("2d");
  g.drawImage(skyBase,0,0);
  for(var i=0;i<stars.length;i++){ var s=stars[i]; g.fillStyle = Math.sin(t*1.5+s.p)>0.3 ? "#cfc6ff" : "#5d55a0"; g.fillRect(s.x,s.y,1,1); }
  g.globalAlpha=0.05; g.fillStyle=P.teal;
  for(var k=0;k<2;k++){ var a=Math.sin(t*0.22+k*2)*0.5 + (k?0.4:-0.4), sx=W*(k?0.7:0.25);
    g.beginPath(); g.moveTo(sx,H); g.lineTo(sx+Math.sin(a)*H*1.4-14, H-Math.cos(a)*H*1.4); g.lineTo(sx+Math.sin(a)*H*1.4+14, H-Math.cos(a)*H*1.4); g.fill(); }
  g.globalAlpha=1;
  layers.forEach(function(L){
    var lg = L.cv.getContext("2d");
    lg.drawImage(L.tile, 0, 0); lg.drawImage(L.tile, L.tileW, 0);
    for(var rep=0; rep<2; rep++){
      var ox = rep*L.tileW;
      for(var j=0;j<L.live.length;j++){
        var e=L.live[j];
        if(e.k==="ant"){ if(Math.sin(t*3+e.ph)>0.2){ lg.fillStyle=P.red; lg.fillRect(ox+e.x, e.y+12, 1, 1); } }
        else if(e.k==="win"){ if(Math.sin(t*0.7+e.ph)>0.6){ lg.fillStyle=e.c; lg.fillRect(ox+e.x, e.y+12, 1, 2); } }
        else if(e.k==="sign"){ if(!(Math.sin(t*9+e.ph)>-0.7 || Math.sin(t*1.3+e.ph)>0)){ lg.fillStyle="rgba(7,6,15,0.85)"; lg.fillRect(ox+e.x+1, e.y+13, e.w-2, e.h-2); } }
      }
    }
  });
  // blimp
  var bg = blimp.cv.getContext("2d"); bg.clearRect(0,0,58,18);
  bg.fillStyle="#24203f";
  bg.fillRect(4,2,44,1); bg.fillRect(1,3,50,1); bg.fillRect(0,4,52,9); bg.fillRect(1,13,50,1); bg.fillRect(4,14,44,1);
  bg.fillRect(50,0,6,3); bg.fillRect(50,13,6,3); bg.fillRect(20,15,12,3);
  bg.fillStyle="#07060f"; bg.fillRect(4,5,42,7);
  var msg = "  SHIP IT  //  STAY CURIOUS  //  TOUCH GRASS  //  ", off = Math.floor(t*10) % (msg.length*6);
  bg.save(); bg.beginPath(); bg.rect(4,5,42,7); bg.clip(); A.drawText(bg, msg+msg, 4-off, 5, 1, P.amber); bg.restore();
  if(Math.sin(t*4)>0){ bg.fillStyle=P.red; bg.fillRect(55,0,1,1); }
}

function drawWalker(t){
  var w = walker, jy = w.hop>0 ? Math.sin((0.5-w.hop)/0.5*Math.PI)*8 : 0;
  var walking = w.idle<=0, fr = walking ? (Math.floor(t*6)%2 ? "walkA":"walkB") : "stand";
  var blink = (t % 3.2) < 0.12, key = fr+(blink?1:0)+(w.dir<0?1:0)+(jy>4?1:0)+(walking?1:0)+(Math.sin(t*6)>0?1:0);
  if(key!==w.key){
    w.key=key; var g=w.cv.getContext("2d"); g.clearRect(0,0,28,24);
    A.drawClawd(g, 0, 12, 1, fr, {flip: w.dir<0, blink:blink, armsUp: jy>4});
    if(!walking){ // little terminal thought bubble
      g.fillStyle="#07060f"; g.fillRect(13,0,13,9); g.fillStyle=P.teal; g.fillRect(13,0,13,1);
      g.fillStyle=P.ink; g.fillRect(15,3,1,1); g.fillRect(16,4,1,1); g.fillRect(15,5,1,1);
      if(Math.sin(t*6)>0) g.fillRect(18,6,4,1);
    }
  }
  move(w.cv, w.x*scale, (H-24-jy)*scale);
}

function update(t, dt){
  // a few redraws per second for blinking things
  var slow = Math.floor(t*8);
  if(slow!==slowAt){ slowAt=slow; drawSlow(t); }
  // slide layers (GPU)
  layers.forEach(function(L){ move(L.cv, -((t*L.o.speed) % L.tileW)*scale, 0); });
  blimp.x -= dt*5; if(blimp.x < -60) blimp.x = W + 30;
  move(blimp.cv, blimp.x*scale, Math.floor(H*0.12)*scale);
  for(var c=0;c<cars.length;c++){
    var car=cars[c]; car.x += car.v*dt;
    if(car.x>W+20 || car.x<-20){ root.removeChild(car.cv); cars[c]=car=newCar(Math.random,false); }
    move(car.cv, (car.x-(car.v>0?11:0))*scale, car.y*scale);
  }
  var w=walker;
  if(w.idle>0) w.idle-=dt;
  else { w.x += w.dir*dt*12; if(Math.random()<dt*0.12) w.idle = 1.5+Math.random()*2; if(w.hop<=0 && Math.random()<dt*0.25) w.hop = 0.5; }
  if(w.hop>0) w.hop -= dt;
  if(w.x > W+20) w.dir=-1; if(w.x < -30) w.dir=1;
  drawWalker(t);
  if(rain) move(rain.cv, -((t*14*scale) % 120), ((t*120*scale) % rain.tile) - rain.tile);
}

function frame(now){
  if(!running) return;
  requestAnimationFrame(frame);
  var dt = Math.min(0.05, (now-last)/1000 || 0.016); last = now;
  var t = (now - t0)/1000 * (reduce ? 0.25 : 1);
  update(t, reduce ? dt*0.25 : dt);
}

City.init = function(el){
  root = el;
  resize(); update(0,0);
  var rt=null; window.addEventListener("resize", function(){ clearTimeout(rt); rt=setTimeout(function(){ resize(); update((performance.now()-t0)/1000,0); }, 120); });
};
City.start = function(){ if(running) return; running=true; t0=performance.now(); last=t0; requestAnimationFrame(frame); };
City.stop = function(){ running=false; };
City.still = function(){ slowAt=-1; update(0,0); };
})();
