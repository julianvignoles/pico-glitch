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
var City = A.City = {};
var cv, ctx, W=320, H=180, scale=4, running=false, t0=0, last=0, layers=[], cars=[], drops=[], stars=[];
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var sky = null, clawd = {x:-20, dir:1, hop:0, idle:0}, blimp = {x:400}, signs = [];
var SIGN_WORDS = ["RAMEN","24H","HOTEL","OPEN","NOODLE","ARCADE","BAR","SHIP IT","> _","TACO","PHO","CAFE","LOFT","DINER","GYM","CLIMB","BOULDER","KARAOKE"];
var NEON = [P.pink,P.teal,P.amber,P.violet,P.clawd];

function resize(){
  var vw = window.innerWidth, vh = window.innerHeight;
  scale = Math.max(2, Math.round(vh/200));
  W = Math.ceil(vw/scale); H = Math.ceil(vh/scale);
  cv.width = W; cv.height = H;
  build();
}

function build(){
  var r = A.rng(1337);
  // sky gradient with ordered dithering
  sky = document.createElement("canvas"); sky.width=W; sky.height=H;
  var sc = sky.getContext("2d");
  var bands = [P.night,P.sky1,P.sky2,P.sky3,P.haze];
  var bayer=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  for(var y=0;y<H;y++){
    var f = Math.pow(y/H,1.6)*(bands.length-1), i=Math.floor(f), fr=f-i;
    for(var x=0;x<W;x++){
      var b = (fr*16 > bayer[(y%4)*4+(x%4)]) ? Math.min(i+1,bands.length-1) : i;
      sc.fillStyle = bands[b]; sc.fillRect(x,y,1,1);
    }
  }
  stars = []; for(var s=0;s<Math.floor(W*H/900);s++) stars.push({x:Math.floor(r()*W), y:Math.floor(r()*H*0.45), p:r()*6.28, b:r()<0.15});
  // three building layers, each a tile 2x screen wide for seamless scrolling
  layers = [
    mkLayer(r, {base:H*0.42, var:H*0.22, wmin:10, wmax:22, color:P.far, win:P.farWin, winRate:0.12, speed:1.5, signs:false}),
    mkLayer(r, {base:H*0.30, var:H*0.25, wmin:14, wmax:30, color:P.mid, win:null, winRate:0.30, speed:4, signs:true}),
    mkLayer(r, {base:H*0.14, var:H*0.06, wmin:26, wmax:50, color:P.near, win:null, winRate:0.10, speed:9, signs:false, roof:true})
  ];
  cars=[]; for(var c=0;c<5;c++) cars.push(newCar(r, true));
  drops=[]; for(var d=0;d<Math.floor(W*H/260);d++) drops.push({x:r()*W, y:r()*H, l:2+Math.floor(r()*4), v:90+r()*60});
}

function mkLayer(r, o){
  var tileW = Math.max(W*2, 480), L = {o:o, tileW:tileW, bld:[], cache:null};
  var x = 0;
  while(x < tileW){
    var w = Math.floor(o.wmin + r()*(o.wmax-o.wmin));
    if(x + w > tileW) w = tileW - x;
    var h = Math.floor(o.base + r()*o.var);
    var b = {x:x, w:w, h:h, wins:[], ant: r()<0.35, tower: r()<0.2, sign:null, tank:o.roof && r()<0.35, ac:o.roof && r()<0.5};
    // windows
    for(var wy=H-h+4; wy<H-2; wy+=4) for(var wx=x+2; wx<x+w-2; wx+=3){
      if(r()<o.winRate) b.wins.push({x:wx,y:wy, c: o.win || (r()<0.75 ? (r()<0.6?P.amber:P.warm) : P.teal), f: r()<0.08 ? r()*10 : -1});
    }
    if(o.signs && r()<0.45 && w>=14){
      // signs must fit their building so neighbours never cut them off
      var fitsH = SIGN_WORDS.filter(function(s){ return A.textWidth(s,1)+4 <= w-2; });
      var fitsV = SIGN_WORDS.filter(function(s){ return s.indexOf(" ")<0 && s.length<=6 && s.length*8+1 <= h*0.6; });
      var vertical = fitsV.length && (r()<0.5 || !fitsH.length);
      var list = vertical ? fitsV : fitsH;
      if(!list.length){ L.bld.push(b); x += w; continue; }
      var word = list[Math.floor(r()*list.length)];
      b.sign = {word:word, vertical:vertical, color:NEON[Math.floor(r()*NEON.length)], y: H-h+6+Math.floor(r()*Math.max(1,h*0.4)), ph:r()*10, flick:r()<0.25};
    }
    L.bld.push(b); x += w + (o.roof ? Math.floor(r()*6) : (r()<0.3?1:0));
  }
  return L;
}

function newCar(r, anywhere){
  var dir = r()<0.5?1:-1;
  return {x: anywhere ? r()*W : (dir>0?-12:W+12), y: H*0.18 + r()*H*0.38, v:(18+r()*30)*dir, c: r()<0.5?P.teal:P.pink};
}

function drawLayer(L, t){
  var o=L.o, off = (t*o.speed) % L.tileW;
  for(var k=0;k<2;k++){
    var base = -off + k*L.tileW;
    for(var i=0;i<L.bld.length;i++){
      var b=L.bld[i], bx=Math.floor(base+b.x);
      if(bx > W || bx + b.w < 0) continue;
      ctx.fillStyle=o.color; ctx.fillRect(bx, H-b.h, b.w, b.h);
      if(b.tower){ ctx.fillRect(bx+Math.floor(b.w/2)-2, H-b.h-6, 4, 6); }
      if(b.ant){ ctx.fillRect(bx+3, H-b.h-10, 1, 10); if(Math.sin(t*3+i)>0.2){ ctx.fillStyle=P.red; ctx.fillRect(bx+3, H-b.h-11, 1, 1);} }
      if(b.tank){ ctx.fillStyle=o.color; ctx.fillRect(bx+b.w-12, H-b.h-9, 8, 6); ctx.fillRect(bx+b.w-11, H-b.h-3, 1, 3); ctx.fillRect(bx+b.w-6, H-b.h-3, 1, 3); }
      if(b.ac){ ctx.fillStyle="#141128"; ctx.fillRect(bx+4, H-b.h-3, 6, 3); }
      for(var w=0;w<b.wins.length;w++){
        var wn=b.wins[w];
        if(wn.f>=0 && Math.sin(t*0.7+wn.f)>0.6) continue;
        ctx.fillStyle=wn.c; ctx.fillRect(Math.floor(base+wn.x), wn.y, 1, 2);
      }
      if(b.sign) drawSign(b, bx, t);
    }
  }
}

function drawSign(b, bx, t){
  var s=b.sign, on = !s.flick || Math.sin(t*9+s.ph)>-0.7 || Math.sin(t*1.3+s.ph)>0;
  var x, y = s.y, w, h;
  if(s.vertical){ w=7; h=s.word.length*8+1; x=bx+2; } else { w=A.textWidth(s.word,1)+4; h=11; x=bx+Math.max(1,Math.floor((b.w-w)/2)); }
  ctx.fillStyle="#07060f"; ctx.fillRect(x, y, w, h);
  if(!on){ ctx.fillStyle="#2a2440"; ctx.fillRect(x,y,w,1); return; }
  ctx.globalAlpha=0.18; ctx.fillStyle=s.color; ctx.fillRect(x-2,y-2,w+4,h+4); ctx.globalAlpha=1;
  ctx.fillStyle=s.color; ctx.fillRect(x,y,w,1); ctx.fillRect(x,y+h-1,w,1);
  if(s.vertical){ for(var i=0;i<s.word.length;i++) A.drawText(ctx, s.word[i], x+1, y+2+i*8, 1, s.color); }
  else A.drawText(ctx, s.word, x+2, y+2, 1, s.color);
}

function frame(now){
  if(!running) return;
  requestAnimationFrame(frame);
  var t = (now - t0)/1000, dt = Math.min(0.05, (now-last)/1000 || 0.016); last = now;
  if(reduce) t *= 0.25;
  render(t, dt);
}

function render(t, dt){
  ctx.drawImage(sky,0,0);
  // stars
  for(var i=0;i<stars.length;i++){ var s=stars[i]; ctx.fillStyle = Math.sin(t*1.5+s.p)>0.3 ? "#cfc6ff" : "#5d55a0"; ctx.fillRect(s.x,s.y,1,1); }
  // moon
  var mx=Math.floor(W*0.78), my=Math.floor(H*0.16), mr=Math.max(7,Math.floor(H*0.06));
  ctx.fillStyle="rgba(243,230,200,0.08)"; ctx.beginPath(); ctx.arc(mx,my,mr*2.2,0,6.29); ctx.fill();
  ctx.fillStyle=P.moon; for(var yy=-mr;yy<=mr;yy++){ var hw=Math.floor(Math.sqrt(mr*mr-yy*yy)); ctx.fillRect(mx-hw,my+yy,hw*2,1); }
  ctx.fillStyle="#d9c9a6"; ctx.fillRect(mx-3,my-2,3,2); ctx.fillRect(mx+2,my+3,2,2); ctx.fillRect(mx-1,my+4,1,1);
  // searchlights
  ctx.globalAlpha=0.06; ctx.fillStyle=P.teal;
  for(var k=0;k<2;k++){ var a=Math.sin(t*0.25+k*2)*0.5 + (k?0.4:-0.4), sx=W*(k?0.7:0.25);
    ctx.beginPath(); ctx.moveTo(sx,H); ctx.lineTo(sx+Math.sin(a)*H*1.4-14, H-Math.cos(a)*H*1.4); ctx.lineTo(sx+Math.sin(a)*H*1.4+14, H-Math.cos(a)*H*1.4); ctx.fill(); }
  ctx.globalAlpha=1;
  drawLayer(layers[0], t);
  // blimp
  blimp.x -= dt*6; if(blimp.x < -90) blimp.x = W + 60;
  drawBlimp(Math.floor(blimp.x), Math.floor(H*0.12), t);
  // flying cars
  for(var c=0;c<cars.length;c++){ var car=cars[c]; car.x += car.v*dt;
    if(car.x>W+20 || car.x<-20){ cars[c]=newCar(Math.random,false); continue; }
    var cx=Math.floor(car.x), cy=Math.floor(car.y);
    ctx.globalAlpha=0.35; ctx.fillStyle=car.c; ctx.fillRect(car.v>0?cx-10:cx+5, cy+1, 10, 1); ctx.globalAlpha=1;
    ctx.fillStyle="#1b1733"; ctx.fillRect(cx,cy,5,2); ctx.fillStyle="#2c2650"; ctx.fillRect(cx+1,cy-1,3,1);
    ctx.fillStyle=car.v>0?P.warm:P.red; ctx.fillRect(car.v>0?cx+4:cx, cy, 1, 1);
  }
  drawLayer(layers[1], t);
  // haze between mid and near
  ctx.fillStyle="rgba(106,42,85,0.10)"; ctx.fillRect(0,H*0.72,W,H*0.28);
  drawLayer(layers[2], t);
  drawStreetClawd(t, dt);
  // rain
  if(!reduce){ ctx.fillStyle="rgba(160,170,255,0.28)";
    for(var d=0;d<drops.length;d++){ var dr=drops[d]; dr.y+=dr.v*dt; dr.x-=dr.v*dt*0.18; if(dr.y>H){dr.y=-5; dr.x=Math.random()*(W+20);} if(dr.x<0) dr.x+=W;
      for(var q=0;q<dr.l;q++) ctx.fillRect(Math.floor(dr.x - q*0.18), Math.floor(dr.y - q), 1, 1); } }
}

function drawBlimp(x, y, t){
  ctx.fillStyle="#24203f";
  ctx.fillRect(x+4,y,44,1); ctx.fillRect(x+1,y+1,50,1); ctx.fillRect(x,y+2,52,9); ctx.fillRect(x+1,y+11,50,1); ctx.fillRect(x+4,y+12,44,1);
  ctx.fillRect(x+50,y-2,6,3); ctx.fillRect(x+50,y+11,6,3);
  ctx.fillRect(x+20,y+13,12,3);
  ctx.fillStyle="#07060f"; ctx.fillRect(x+4,y+3,42,7);
  var msg = "  SHIP IT  //  STAY CURIOUS  //  TOUCH GRASS  //  ", off = Math.floor(t*10) % (msg.length*6);
  ctx.save(); ctx.beginPath(); ctx.rect(x+4,y+3,42,7); ctx.clip();
  A.drawText(ctx, msg+msg, x+4-off, y+3, 1, P.amber); ctx.restore();
  if(Math.sin(t*4)>0){ ctx.fillStyle=P.red; ctx.fillRect(x+55,y-2,1,1); }
}

function drawStreetClawd(t, dt){
  // Clawd strolls along the near rooftops, stops to look around, hops sometimes
  var groundY = H - 12;
  if(clawd.idle>0){ clawd.idle-=dt; }
  else {
    clawd.x += clawd.dir*dt*14;
    if(Math.random()<dt*0.12) clawd.idle = 1.5+Math.random()*2;
    if(clawd.hop<=0 && Math.random()<dt*0.25) clawd.hop = 0.5;
  }
  if(clawd.hop>0) clawd.hop -= dt;
  if(clawd.x > W+20){ clawd.dir=-1; }
  if(clawd.x < -30){ clawd.dir=1; }
  var jy = clawd.hop>0 ? Math.floor(Math.sin((0.5-clawd.hop)/0.5*Math.PI)*8) : 0;
  var walking = clawd.idle<=0;
  var fr = walking ? (Math.floor(t*6)%2 ? "walkA":"walkB") : "stand";
  var blink = (t % 3.2) < 0.12;
  ctx.fillStyle="rgba(0,0,0,0.5)"; ctx.fillRect(Math.floor(clawd.x)+2, groundY+10, 9, 1);
  A.drawClawd(ctx, Math.floor(clawd.x), groundY - jy, 1, fr, {flip: clawd.dir<0, blink:blink, armsUp: jy>4});
  if(!walking){ // little terminal thought bubble
    var bx=Math.floor(clawd.x)+12, by=groundY-12;
    ctx.fillStyle="#07060f"; ctx.fillRect(bx,by,13,9); ctx.fillStyle=P.teal; ctx.fillRect(bx,by,13,1);
    ctx.fillStyle=P.ink; ctx.fillRect(bx+2,by+3,1,1); ctx.fillRect(bx+3,by+4,1,1); ctx.fillRect(bx+2,by+5,1,1);
    if(Math.sin(t*6)>0) ctx.fillRect(bx+5,by+6,4,1);
  }
}

City.init = function(canvas){ cv=canvas; ctx=cv.getContext("2d"); resize(); window.addEventListener("resize", function(){ resize(); if(!running) render(0,0); }); render(0,0); };
City.start = function(){ if(running) return; running=true; t0=performance.now(); last=t0; requestAnimationFrame(frame); };
City.stop = function(){ running=false; };
City.still = function(){ render(0,0); };
})();
