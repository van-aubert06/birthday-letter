/* A layered SVG bouquet drawn in code, with the growth order from the video.
   No video player, remote images, libraries, or canvas image sprites are used. */
(() => {
  "use strict";
  const scene = document.getElementById("bloomScene");
  const mount = document.getElementById("bloomMount");
  const canvas = document.getElementById("flowerDust");
  const context = canvas.getContext("2d");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const ns = "http://www.w3.org/2000/svg";
  let running = false;
  let visible = true;
  let frame = 0;
  let lastFrame = 0;
  let dust = [];
  let seed = 73;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function svgNode(tag, attrs = {}, parent) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (parent) parent.append(node);
    return node;
  }
  function path(parent, d, fill, attrs = {}) { return svgNode("path", { d, fill, ...attrs }, parent); }
  function group(parent, attrs = {}) { return svgNode("g", attrs, parent); }
  const svg = svgNode("svg", { viewBox: "0 0 620 745", xmlns: ns, focusable: "false", "aria-hidden": "true" }, mount);
  // Object-space gradients keep the highlights attached to each moving petal.
  const defs = svgNode("defs", {}, svg);
  defs.innerHTML = `
    <radialGradient id="fl-gold"><stop stop-color="#bd8740"/><stop offset=".27" stop-color="#eac261"/><stop offset=".72" stop-color="#fbe9a0"/><stop offset="1" stop-color="#fff1b4"/></radialGradient>
    <linearGradient id="fl-gold-back" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#b88d45"/><stop offset=".48" stop-color="#e3c573"/><stop offset="1" stop-color="#fff0b1"/></linearGradient>
    <radialGradient id="fl-disc"><stop stop-color="#6d5037"/><stop offset=".8" stop-color="#6e4b30"/><stop offset="1" stop-color="#a47742"/></radialGradient>
    <linearGradient id="fl-rose" x1="0" y1=".95" x2=".75" y2="0"><stop stop-color="#943e69"/><stop offset=".48" stop-color="#d074a0"/><stop offset=".86" stop-color="#efa6c5"/><stop offset="1" stop-color="#f9bfd3"/></linearGradient>
    <linearGradient id="fl-rose-light" x1=".12" y1=".9" x2=".65" y2=".05"><stop stop-color="#a64774"/><stop offset=".46" stop-color="#df84ae"/><stop offset="1" stop-color="#ffd0e0"/></linearGradient>
    <linearGradient id="fl-rose-fold" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#f6b4ce"/><stop offset=".4" stop-color="#d579a3"/><stop offset="1" stop-color="#9b3e6d"/></linearGradient>
    <radialGradient id="fl-peony" cx=".35" cy=".2" r=".95"><stop stop-color="#fff1e4"/><stop offset=".5" stop-color="#f1c4ca"/><stop offset=".8" stop-color="#d492a6"/><stop offset="1" stop-color="#b47189"/></radialGradient>
    <linearGradient id="fl-lily" x1=".2" y1="0" x2=".65" y2="1"><stop stop-color="#fff0f6"/><stop offset=".48" stop-color="#f0bed6"/><stop offset=".76" stop-color="#e8a9cb"/><stop offset="1" stop-color="#c77eae"/></linearGradient>
    <linearGradient id="fl-lily-back" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9dce9"/><stop offset="1" stop-color="#dba0c6"/></linearGradient>
    <linearGradient id="fl-tulip" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="#f5d5ff"/><stop offset=".42" stop-color="#c493e2"/><stop offset="1" stop-color="#8356a4"/></linearGradient>
    <linearGradient id="fl-tulip-side" x1=".1" y1=".2" x2="1" y2=".8"><stop stop-color="#b47fd4"/><stop offset=".5" stop-color="#d7abea"/><stop offset="1" stop-color="#9361ba"/></linearGradient>
    <linearGradient id="fl-bell" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#ecd7a9"/><stop offset=".2" stop-color="#bcb4d7"/><stop offset=".5" stop-color="#dac9ee"/><stop offset=".85" stop-color="#a992c9"/><stop offset="1" stop-color="#e9d4af"/></linearGradient>
    <linearGradient id="fl-leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#83d3a6"/><stop offset=".5" stop-color="#4b9e81"/><stop offset="1" stop-color="#246251"/></linearGradient>
    <linearGradient id="fl-leaf-dark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#69b88e"/><stop offset=".55" stop-color="#368775"/><stop offset="1" stop-color="#204c4c"/></linearGradient>
    <linearGradient id="fl-stem" x1="0" y1="1" x2=".5" y2="0"><stop stop-color="#4e7362"/><stop offset=".5" stop-color="#76ad75"/><stop offset="1" stop-color="#54957b"/></linearGradient>
    <radialGradient id="fl-daisy"><stop stop-color="#ddcbb4"/><stop offset=".45" stop-color="#f8f0de"/><stop offset="1" stop-color="#fff6e9"/></radialGradient>
    <radialGradient id="fl-pollen"><stop stop-color="#fff0a9"/><stop offset=".65" stop-color="#dac17b"/><stop offset="1" stop-color="#ad8b4f"/></radialGradient>
    <linearGradient id="fl-paper-back" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8c729e"/><stop offset=".45" stop-color="#69547e"/><stop offset="1" stop-color="#a78bb5"/></linearGradient>
    <linearGradient id="fl-paper-front" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#d8c9e5"/><stop offset=".55" stop-color="#a897c4"/><stop offset="1" stop-color="#7e6a9c"/></linearGradient>
    <linearGradient id="fl-paper-fold" x1="1" y1="0" x2="0" y2="1"><stop stop-color="#d4c3e4"/><stop offset=".55" stop-color="#8d76a8"/><stop offset="1" stop-color="#b5a0c8"/></linearGradient>
    <linearGradient id="fl-ribbon" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#ffe2eb"/><stop offset=".32" stop-color="#e9b3cb"/><stop offset=".67" stop-color="#bd7d9e"/><stop offset="1" stop-color="#f3cbdc"/></linearGradient>
    <linearGradient id="fl-ribbon-light" x1="1" y1="0" x2="0" y2="1"><stop stop-color="#ffe6ef"/><stop offset=".45" stop-color="#d596b5"/><stop offset="1" stop-color="#f9d2e2"/></linearGradient>
    <radialGradient id="fl-glow"><stop stop-color="#ffeec6" stop-opacity=".3"/><stop offset="1" stop-color="#ffeec6" stop-opacity="0"/></radialGradient>`;

  // Tiny stars remain behind the wrapping. Foreground dust follows the pointer.
  const stars = group(svg);
  for (let i = 0; i < 95; i += 1) {
    const x = 15 + random() * 590, y = 15 + random() * 690;
    const size = i % 8 === 0 ? 2.8 + random() * 3 : .6 + random() * 1.1;
    const star = group(stars, { class: "fl-starlight", opacity: .35 + random() * .5, style: `--duration:${2.3 + random() * 3}s;--twinkle-delay:${-random() * 5}s` });
    if (size > 2.5) {
      svgNode("circle", { cx: x, cy: y, r: size * 3, fill: "url(#fl-glow)" }, star);
      path(star, `M${x} ${y-size}Q${x+size*.3} ${y-size*.3} ${x+size} ${y}Q${x+size*.3} ${y+size*.3} ${x} ${y+size}Q${x-size*.3} ${y+size*.3} ${x-size} ${y}Q${x-size*.3} ${y-size*.3} ${x} ${y-size}`, "#e5d4b0");
    } else svgNode("circle", { cx: x, cy: y, r: size, fill: "#c6adb9", opacity: .42 }, star);
  }
  svgNode("ellipse", { cx: 309, cy: 729, rx: 136, ry: 14, fill: "#795a8730" }, svg);
  const bouquet = group(svg, { class: "fl-sway" });
  const paperBack = group(bouquet, { class: "fl-paper" });
  [
    ["M311 611 153 321 203 304 255 377 222 279 278 267 311 305 344 261 383 281 365 385 409 301 463 336 403 456 502 385 343 628 348 708 281 723Z", "url(#fl-paper-back)"],
    ["M161 322 287 593 279 707 222 692 243 589Z", "#8f78a5"],
    ["M224 279 302 598 321 608 282 266Z", "#90769e55"],
    ["M383 281 318 605 344 709 364 616 463 336Z", "#b6a0c050"],
    ["M309 607 344 616 343 708 284 722Z", "#9d85ac"]
  ].forEach(([d, fill]) => path(paperBack, d, fill));

  const stems = group(bouquet), foliage = group(bouquet), blossoms = group(bouquet);
  function stem(x, y, delay, bend = 0, strokeWidth = 3.2) {
    path(stems, `M310 602 Q${(310+x)/2+bend} ${Math.max(y+80,430)} ${x} ${y}`, "none", { stroke: "url(#fl-stem)", "stroke-width": strokeWidth, "stroke-linecap": "round", class: "fl-stem", pathLength: 1, style: `--delay:${delay}s` });
  }
  function leaf(x, y, angle, length, width, delay, dark = false) {
    const anchor = group(foliage, { transform: `translate(${x} ${y}) rotate(${angle})` });
    const grow = group(anchor, { class: "fl-grow", style: `--delay:${delay}s` });
    path(grow, `M0 0C${-width} ${-length*.2} ${-width} ${-length*.78} 0 ${-length}C${width*.9} ${-length*.75} ${width*.8} ${-length*.25} 0 0Z`, dark ? "url(#fl-leaf-dark)" : "url(#fl-leaf)");
    path(grow, `M0-2Q${-width*.15} ${-length*.5} 0 ${-length*.91}`, "none", { stroke: "#c4edb8", "stroke-width": .8, opacity: .32 });
  }
  [
    [276,150,-48,66,20,1.5],[289,206,-43,68,24,1.65],[287,282,-29,64,20,1.95],
    [398,180,-38,62,21,1.6],[395,220,15,60,18,1.9],[376,283,-32,65,20,2.05],
    [195,309,-58,67,22,1.8],[215,369,-64,74,24,2.0],[259,427,-27,75,27,2.15],
    [401,342,50,70,26,2.0],[443,325,50,90,30,1.85],[427,399,72,64,24,2.25],
    [321,487,39,68,22,2.05],[340,523,67,69,22,2.3],[273,502,-62,62,23,2.3],
    [116,357,-48,73,26,1.75],[101,395,-74,76,27,1.95],[132,437,-69,68,25,2.1],
    [95,310,-41,64,26,1.65],[85,282,-56,52,19,1.45],[342,184,35,55,18,1.7]
  ].forEach((args, i) => leaf(...args, i % 3 === 0));
  // Fern-like side branches and small oval leaves, visible before blooming.
  [[161,282,-15],[452,319,24],[87,390,-20],[485,471,45]].forEach(([x,y,bend], branch) => {
    stem(x,y,.75+branch*.12,bend,2);
    for (let i=0;i<6;i+=1) {
      const t=i/6, lx=x+(310-x)*t*.42, ly=y+(602-y)*t*.44;
      leaf(lx,ly,-64,22+i*2,11,1.1+branch*.14+i*.13,true);
      leaf(lx+4,ly+9,68,24+i*2,12,1.2+branch*.14+i*.13);
    }
  });

  function head(x, y, size, angle, delay, name) {
    stem(x,y,.65 + delay*.14,(x-310)*.18, name === "sunflower" ? 4 : 3);
    const anchor = group(blossoms, { transform: `translate(${x} ${y}) rotate(${angle}) scale(${size})`, "data-flower": name });
    return group(anchor, { class: "fl-head", style: `--delay:${delay}s` });
  }
  function petal(parent, angle, d, fill, index = 0) {
    const turned = group(parent, { transform: `rotate(${angle})` });
    return path(turned,d,fill,{ class: "fl-petal", style: `--petal-delay:${index * .018}s` });
  }
  function sunflower(x,y,size,delay) {
    const g=head(x,y,size,0,delay,"sunflower");
    for(let ring=0;ring<2;ring+=1) {
      const count=ring===0?24:21;
      for(let i=0;i<count;i+=1) {
        const r=ring===0?65:60;
        petal(g,i*360/count+ring*7,`M-6-15C-17-30-12-${r-9} 0-${r}C7-${r-16} 18-32 7-16Z`,ring===0?"url(#fl-gold-back)":"url(#fl-gold)",i%4);
      }
    }
    svgNode("circle",{r:24.5,fill:"url(#fl-disc)"},g);
    for(let i=0;i<215;i+=1) {
      const a=i*2.399963, r=23*Math.sqrt(i/215);
      svgNode("ellipse",{cx:Math.cos(a)*r,cy:Math.sin(a)*r,rx:.65,ry:1.05,fill:i%3===0?"#ebcb82":"#c4a067",opacity:.65+random()*.3,transform:`rotate(${a*180/Math.PI} ${Math.cos(a)*r} ${Math.sin(a)*r})`},g);
    }
  }
  function rose(x,y,size,angle,delay) {
    const g=head(x,y,size,angle,delay,"rose");
    svgNode("circle",{r:57,fill:"#b45b85"},g);
    const outline="M-9-5C-28-11-49-39-37-56C-23-76 8-71 22-57C39-56 56-33 41-16C26-2 12 2-9-5Z";
    for(let ring=0;ring<4;ring+=1) {
      const scale=[1,.79,.56,.34][ring], count=[7,7,6,5][ring];
      const layer=group(g,{transform:`rotate(${ring*29}) scale(${scale})`});
      for(let i=0;i<count;i+=1) {
        const wrap=group(layer,{transform:`rotate(${i*360/count})`});
        path(wrap,outline,i%2?"url(#fl-rose)":"url(#fl-rose-light)",{class:"fl-petal",style:`--petal-delay:${ring*.08+i*.014}s`});
        path(wrap,"M-37-53C-16-68 11-62 24-46C15-51 0-44-4-27C-10-42-24-54-37-53Z","url(#fl-rose-fold)",{opacity:.8});
      }
    }
    path(g,"M-11 4C-21-12 0-25 13-13C26 1 3 15-7 5C-15-3 2-12 7-5C12 3-2 7-3 0","none",{stroke:"#f7bed5","stroke-width":3.2,"stroke-linecap":"round"});
  }
  function lily(x,y,size,angle,delay) {
    const g=head(x,y,size,angle,delay,"lily");
    [0,120,240,60,180,300].forEach((a,i)=>{
      const r=i<3?79:73;
      const rot=group(g,{transform:`rotate(${a})`});
      path(rot,`M0 8C-27-8-34-39 0-${r}C18-${r-24} 34-17 0 8Z`,i<3?"url(#fl-lily-back)":"url(#fl-lily)",{class:"fl-petal",style:`--petal-delay:${i*.09}s`});
      path(rot,`M0 4Q-1-32 0-${r-9}`,"none",{stroke:"#bb78a5","stroke-width":.8,opacity:.35});
      for(let j=0;j<7;j+=1)svgNode("circle",{cx:(random()-.5)*20,cy:-12-random()*22,r:.8,fill:"#b4769c",opacity:.42},rot);
    });
    for(let i=0;i<7;i+=1){const a=i*Math.PI*2/7;const xx=Math.cos(a)*22, yy=Math.sin(a)*22;
      path(g,`M0 5Q${xx*.7} ${yy*.3} ${xx} ${yy}`,"none",{stroke:"#c7b370","stroke-width":1.1});
      svgNode("ellipse",{cx:xx,cy:yy,rx:2.6,ry:1.7,fill:"#e5cd88",transform:`rotate(${a*180/Math.PI} ${xx} ${yy})`},g);
    }
    svgNode("circle",{r:4.5,fill:"url(#fl-pollen)"},g);
    // The two little lavender bells rest against the lower lily petals.
    [0,18].forEach((offset,i)=>{
      path(g,`M0 5Q${offset+5} 12 ${offset+8} 21`,"none",{stroke:"#b6a66f","stroke-width":1.1});
      const bell=group(g,{transform:`translate(${offset+8} ${23-i*3}) rotate(${-12+i*4})`});
      path(bell,"M-8 0Q-11 10-9 23Q0 28 9 23L8 3Q0-9-8 0Z","url(#fl-bell)",{stroke:"#ae93b8","stroke-width":.7});
      path(bell,"M-5 2Q-8 12-5 21","none",{stroke:"#fff0da","stroke-width":1.4,opacity:.65});
    });
  }
  function tulip(x,y,size,angle,delay) {
    const g=head(x,y,size,angle,delay,"tulip");
    path(g,"M0 44C-44 22-49-15-29-29C-25-49-5-51 6-39C18-53 43-40 42-24C67 9 22 41 0 44Z","url(#fl-tulip-side)");
    path(g,"M0 43C-32 14-40-18-17-36C9-49 17-13 0 43Z","url(#fl-tulip)",{class:"fl-petal"});
    path(g,"M0 43C8 0-1-42 23-40C50-34 44 20 0 43Z","url(#fl-tulip-side)",{class:"fl-petal",style:"--petal-delay:.12s"});
    path(g,"M0 43C-26 21-37-7-25-26C-2-58 35-12 0 43Z","url(#fl-tulip)",{class:"fl-petal",style:"--petal-delay:.22s"});
    path(g,"M-22-22Q-27 5-10 26","none",{stroke:"#f5dcff","stroke-width":3.3,opacity:.65,"stroke-linecap":"round"});
    path(g,"M0 44Q28 12 24-24","none",{stroke:"#ead0f5","stroke-width":1.2,opacity:.5});
    path(g,"M-25 34Q-11 48 0 48Q15 43 26 28","none",{stroke:"#78a685","stroke-width":2});
  }
  function daisy(x,y,size,angle,delay) {
    const g=head(x,y,size,angle,delay,"daisy");
    for(let ring=0;ring<2;ring+=1)for(let i=0;i<13;i+=1){
      const r=group(g,{transform:`rotate(${i*360/13+ring*13}) scale(${ring? .86:1})`});
      svgNode("ellipse",{cx:0,cy:-19,rx:7.2,ry:18,fill:"url(#fl-daisy)",class:"fl-petal",style:`--petal-delay:${i%4*.05}s`},r);
    }
    svgNode("circle",{r:9,fill:"url(#fl-pollen)"},g);
    for(let i=0;i<22;i+=1){const a=i*2.39996, r=Math.sqrt(i/22)*7;svgNode("circle",{cx:Math.cos(a)*r,cy:Math.sin(a)*r,r:.7,fill:"#f7dfa0"},g);}
  }
  function peony(x,y,size,angle,delay) {
    const g=head(x,y,size,angle,delay,"peony");
    for(let ring=0;ring<3;ring+=1) {
      const layer=group(g,{transform:`rotate(${ring*31}) scale(${1-ring*.21})`});
      for(let i=0;i<7;i+=1)petal(layer,i*360/7,"M-8 5C-42-1-41-29-22-42C-2-64 26-46 25-23C35-3 10 15-8 5Z","url(#fl-peony)",i);
    }
    svgNode("circle",{r:8,fill:"#b28e60"},g);
    for(let i=0;i<32;i+=1){const a=i*2.39996,r=Math.sqrt(i/32)*7.2;svgNode("circle",{cx:Math.cos(a)*r,cy:Math.sin(a)*r,r:1,fill:i%2?"#f7e4a5":"#dcca8a"},g);}
  }

  // Rendering order follows depth: lower flowers sit in front of the stems.
  tulip(404,132,.95,7,2.35);
  daisy(100,164,1,-12,3.05);
  lily(200,201,1,-13,2.8);
  sunflower(300,112,.95,2.55);
  tulip(80,272,.81,-21,2.8);
  peony(468,242,1.0,15,3.1);
  rose(329,254,.99,-9,3.25);
  daisy(249,312,.94,12,3.35);
  rose(159,373,.93,-28,3.5);
  lily(409,355,.98,15,3.35);
  daisy(477,441,1.08,14,3.9);
  peony(238,481,.91,8,3.6);
  daisy(359,491,.97,-9,3.8);
  sunflower(300,408,1.02,3.65);
  // Small white blossoms on airy side stems, as in the reference.
  [[43,426],[59,433],[108,202],[453,315]].forEach(([x,y],i)=>{stem(x,y,1.3+i*.1,(x-310)*.15,1.1);daisy(x,y,.23,0,3+i*.17);});

  const front = group(bouquet, { class: "fl-paper" });
  [
    ["M88 419 309 590 222 686 228 583Z", "url(#fl-paper-front)"],
    ["M88 419 309 590 118 458Z", "#c5b6d7"],
    ["M127 434 309 590 240 531Z", "#dfd0e7"],
    ["M513 385 340 611 282 711 299 590Z", "url(#fl-paper-fold)"],
    ["M513 385 326 591 475 450Z", "#b4a0d0"],
    ["M493 409 329 591 373 542Z", "#d1c1e4"],
    ["M309 594 335 608 335 695 283 712Z", "#8f79a8"],
    ["M309 597 285 705 332 693", "none"]
  ].forEach(([d,fill])=>path(front,d,fill,fill==="none"?{stroke:"#dfcdeb","stroke-width":1.5,opacity:.6}:{}));
  const ribbon=group(bouquet,{class:"fl-ribbon"});
  path(ribbon,"M301 592Q281 656 253 701L220 684Q268 638 293 589Z","url(#fl-ribbon)");
  path(ribbon,"M318 592Q346 645 393 672L372 680 371 706Q331 682 307 604Z","url(#fl-ribbon-light)");
  path(ribbon,"M303 587C258 540 188 535 213 576C228 607 273 617 307 599Z","url(#fl-ribbon)",{stroke:"#f2c5d9","stroke-width":1});
  path(ribbon,"M304 593C274 567 225 548 217 563C237 574 271 590 304 600Z","url(#fl-ribbon-light)",{opacity:.7});
  path(ribbon,"M310 589C349 542 415 533 417 557C425 586 359 612 315 601Z","url(#fl-ribbon-light)",{stroke:"#f5cddc","stroke-width":1});
  path(ribbon,"M316 590C354 557 403 545 409 555Q365 570 316 600Z","url(#fl-ribbon)",{opacity:.75});
  path(ribbon,"M293 584Q310 577 329 584L329 606Q311 615 296 607Z","url(#fl-ribbon-light)",{stroke:"#f8dae6","stroke-width":.6});
  path(ribbon,"M309 598C293 587 304 581 309 589C315 581 325 589 309 598Z","#fff4dc");

  // Pointer sparkles are bounded to this scene and stop when hidden.
  const dustColors=["#ffe2a1","#ffd1e5","#b9e9ff","#c2f5df","#f0d0ff"];
  function resize() {
    const rect=scene.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(rect.width*dpr));
    canvas.height=Math.max(1,Math.round(rect.height*dpr));
    context.setTransform(dpr,0,0,dpr,0,0);
  }
  function addDust(x,y,count) {
    if(motion.matches || !running || !visible) return;
    for(let i=0;i<count;i+=1)dust.push({x,y,vx:(Math.random()-.5)*38,vy:-10-Math.random()*35,size:2+Math.random()*4.5,life:.65+Math.random()*.85,max:1.5,color:dustColors[Math.floor(Math.random()*dustColors.length)],angle:Math.random()*6.28});
    if(dust.length>100)dust.splice(0,dust.length-100);
    if(!frame)frame=requestAnimationFrame(drawDust);
  }
  function drawDust(time) {
    frame=0;
    if(!running||!visible||document.hidden||motion.matches){dust=[];context.clearRect(0,0,canvas.width,canvas.height);lastFrame=0;return;}
    const dt=Math.min((time-(lastFrame||time))/1000,.045);lastFrame=time;
    context.clearRect(0,0,canvas.width,canvas.height);
    dust=dust.filter(p=>p.life>0);
    for(const p of dust){
      p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=13*dt;
      context.save();context.translate(p.x,p.y);context.rotate(p.angle);context.globalAlpha=Math.min(1,p.life/.55);context.fillStyle=p.color;context.shadowColor=p.color;context.shadowBlur=7;
      context.beginPath();
      for(let j=0;j<8;j++){const a=j*Math.PI/4;const r=j%2?p.size*.24:p.size;const x=Math.cos(a)*r,y=Math.sin(a)*r;j?context.lineTo(x,y):context.moveTo(x,y);}
      context.closePath();context.fill();context.restore();
    }
    if(dust.length)frame=requestAnimationFrame(drawDust);else lastFrame=0;
  }
  let lastPointer=0;
  scene.addEventListener("pointermove",event=>{
    if(event.timeStamp-lastPointer<24)return;lastPointer=event.timeStamp;
    const rect=scene.getBoundingClientRect();addDust(event.clientX-rect.left,event.clientY-rect.top,3);
  });
  scene.addEventListener("pointerdown",event=>{const rect=scene.getBoundingClientRect();addDust(event.clientX-rect.left,event.clientY-rect.top,12);});
  function pauseState(){
    scene.classList.toggle("is-paused",document.hidden||!visible);
    if(document.hidden||!visible){cancelAnimationFrame(frame);frame=0;lastFrame=0;dust=[];context.clearRect(0,0,canvas.width,canvas.height);}
  }
  if("IntersectionObserver" in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;pauseState();},{threshold:0}).observe(scene);
  document.addEventListener("visibilitychange",pauseState);
  motion.addEventListener("change",()=>{if(motion.matches){cancelAnimationFrame(frame);frame=0;dust=[];context.clearRect(0,0,canvas.width,canvas.height);}});
  if("ResizeObserver" in window)new ResizeObserver(resize).observe(scene);else window.addEventListener("resize",resize);
  window.birthdayFlowers={
    play(){
      this.stop();
      running=true;
      scene.classList.remove("is-growing");
      void scene.getBoundingClientRect();
      scene.classList.add("is-growing");
      resize();pauseState();
    },
    stop(){
      running=false;
      cancelAnimationFrame(frame);frame=0;lastFrame=0;dust=[];
      scene.classList.remove("is-growing");
      context.clearRect(0,0,canvas.width,canvas.height);
    }
  };
})();
