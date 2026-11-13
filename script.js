(() => {
  "use strict";

  const config = window.BIRTHDAY;
  const $ = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fallbackPhoto = "assets/photo-placeholder.svg";
  const state = { unlocked: false, candles: new Set(), cut: false, progress: 0, drag: null, viewer: 0 };
  const announce = (text) => { $("siteStatus").textContent = text; };
  const scrollTo = (element) => element.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
  const pinLength = String(config.password).length;
  $("passwordInput").maxLength = pinLength;
  $("pinHint").textContent = config.passwordHint || "Hint: The day you were Born";
  for (let i = 0; i < pinLength; i += 1) $("pinDots").append(document.createElement("span"));
  function syncPin() {
    const length = $("passwordInput").value.length;
    [...$("pinDots").children].forEach((dot, i) => dot.classList.toggle("is-filled", i < length));
    $("pinStatus").textContent = `${length} dari ${pinLength} angka sudah dimasukkan.`;
  }
  function editPin(value) {
    if (state.unlocked) return;
    $("passwordInput").value = value.replace(/\D/g, "").slice(0, pinLength);
    $("passwordInput").removeAttribute("aria-invalid");
    $("passwordForm").classList.remove("pin-error", "shake");
    $("gateMessage").textContent = "";
    $("gateMessage").classList.remove("is-error");
    syncPin();
  }
  document.querySelectorAll("[data-digit]").forEach((button) => {
    button.addEventListener("click", () => editPin($("passwordInput").value + button.dataset.digit));
  });
  $("pinDelete").addEventListener("click", () => editPin($("passwordInput").value.slice(0, -1)));
  $("passwordGate").addEventListener("keydown", (event) => {
    if (state.unlocked || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      editPin($("passwordInput").value + event.key);
    } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "Escape") {
      event.preventDefault();
      editPin(event.key === "Backspace" ? $("passwordInput").value.slice(0, -1) : "");
    } else if (event.key === "Enter") {
      event.preventDefault();
      $("passwordForm").requestSubmit();
    }
  });
  $("passwordGate").addEventListener("paste", (event) => {
    if (state.unlocked) return;
    event.preventDefault();
    editPin(event.clipboardData?.getData("text") || "");
  });
  syncPin();
  document.querySelector('[data-digit="1"]').focus({ preventScroll: true });

  function photo(image, source, alt) {
    image.alt = alt;
    image.classList.remove("is-placeholder");
    image.onerror = () => {
      image.onerror = null;
      image.classList.add("is-placeholder");
      image.alt = `${alt} — tempat foto belum diisi`;
      image.src = fallbackPhoto;
    };
    image.src = source || fallbackPhoto;
  }

  document.querySelectorAll("[data-recipient]").forEach((node) => { node.textContent = config.recipient; });
  document.querySelectorAll("[data-sender]").forEach((node) => { node.textContent = config.sender; });
  document.querySelectorAll("[data-age]").forEach((node) => { node.textContent = config.age; });
  $("heroMessage").textContent = config.heroMessage;
  photo($("coverPhoto"), config.coverPhoto, `Foto bersama ${config.recipient}`);
  photo($("letterPhoto"), config.letterPhoto, "Satu kenangan kita");
  photo($("closingPhoto"), config.closingPhoto, "");
  config.letter.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    $("letterParagraphs").append(paragraph);
  });

  // The highlight follows the pointer without tilting the form or moving input.
  $("passwordForm").addEventListener("pointermove", (event) => {
    if (reducedMotion.matches || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--shine-x", `${(event.clientX - rect.left) / rect.width * 100}%`);
    event.currentTarget.style.setProperty("--shine-y", `${(event.clientY - rect.top) / rect.height * 100}%`);
  });
  $("passwordForm").addEventListener("pointerleave", (event) => {
    event.currentTarget.style.removeProperty("--shine-x");
    event.currentTarget.style.removeProperty("--shine-y");
  });

  $("passwordForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.unlocked) return;
    if ($("passwordInput").value.length !== pinLength) {
      $("gateMessage").textContent = `Masukkan ${pinLength} angka terlebih dahulu.`;
      return;
    }
    if ($("passwordInput").value !== String(config.password)) {
      $("gateMessage").textContent = "Belum tepat, sayang. Coba sekali lagi, ya.";
      $("gateMessage").classList.add("is-error");
      $("passwordInput").setAttribute("aria-invalid", "true");
      $("passwordForm").classList.remove("shake");
      void $("passwordForm").offsetWidth;
      $("passwordForm").classList.add("shake");
      $("passwordForm").classList.add("pin-error");
      $("passwordInput").value = "";
      syncPin();
      document.querySelector('[data-digit="1"]').focus({ preventScroll: true });
      return;
    }
    state.unlocked = true;
    // Called inside the user's submit gesture, before any timer or animation.
    window.birthdayMusic?.unlock();
    $("gateMessage").textContent = "Kejutan ini milikmu. Selamat datang ♡";
    $("gateMessage").classList.remove("is-error");
    $("passwordInput").removeAttribute("aria-invalid");
    $("birthdayPage").hidden = false;
    $("birthdayPage").inert = false;
    $("passwordGate").classList.add("is-leaving");
    $("passwordGate").inert = true;
    document.body.classList.remove("is-locked");
    window.scrollTo({ top: 0, behavior: "instant" });
    $("heroTitle").focus({ preventScroll: true });
    window.setTimeout(() => { $("passwordGate").hidden = true; }, reducedMotion.matches ? 0 : 500);
    updateReading();
  });

  $("heroLetter").addEventListener("click", () => {
    scrollTo($(state.cut ? "letter" : "cake"));
    if (!state.cut) announce("Padamkan kedua lilin, lalu potong kuenya untuk membuka surat.");
  });

  function extinguish(button) {
    const digit = button.dataset.candle;
    if (state.candles.has(digit) || !state.unlocked) return;
    state.candles.add(digit);
    button.classList.add("is-out");
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", `Lilin angka ${digit} sudah padam`);
    if (state.candles.size === 2) {
      $("cakeCard").dataset.step = "cut";
      $("candleStep").className = "is-done";
      $("cutStep").className = "is-current";
      $("cakeInstruction").textContent = "Lilin sudah padam! Sekarang tarik tombol panah perlahan sampai ujung kanan untuk memotong kue.";
      $("cutLabel").textContent = "Swipe right →";
      $("cutSlider").classList.remove("is-disabled");
      $("cutSlider").setAttribute("aria-disabled", "false");
      announce("Kedua lilin sudah padam. Geser tombol potong kue dari kiri ke kanan.");
    } else {
      $("cakeInstruction").textContent = "Satu lilin sudah padam. Usap api yang satu lagi, ya ♡";
    }
  }

  document.querySelectorAll(".flame-hit").forEach((button) => {
    let gesture = null;
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") gesture = { x: event.clientX, y: event.clientY, distance: 0, id: event.pointerId };
    });
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || state.candles.has(button.dataset.candle)) return;
      event.preventDefault();
      gesture = { x: event.clientX, y: event.clientY, distance: 0, id: event.pointerId };
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointermove", (event) => {
      if (!gesture || gesture.id !== event.pointerId || state.candles.has(button.dataset.candle)) return;
      const rect = button.getBoundingClientRect();
      const distance = Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y);
      if (event.clientX >= rect.left - 14 && event.clientX <= rect.right + 14 && event.clientY >= rect.top - 14 && event.clientY <= rect.bottom + 14) {
        gesture.distance += distance;
      }
      gesture.x = event.clientX;
      gesture.y = event.clientY;
      if (gesture.distance >= 23) extinguish(button);
    });
    const end = (event) => {
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
      gesture = null;
    };
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("pointerleave", (event) => {
      if (!button.hasPointerCapture(event.pointerId)) gesture = null;
    });
    button.addEventListener("click", (event) => {
      if (event.detail === 0) extinguish(button);
    });
  });

  const slider = $("cutSlider");
  const thumb = $("cutThumb");
  const travel = () => Math.max(1, slider.clientWidth - 60);

  function setCutProgress(progress) {
    state.progress = clamp(progress, 0, 1);
    $("cakeCard").style.setProperty("--cut", state.progress);
    $("cakeCard").style.setProperty("--split", clamp((state.progress - .65) / .35, 0, 1));
    $("cakeCard").style.setProperty("--knife-opacity", Math.min(1, state.progress * 5));
    thumb.style.transform = `translateX(${travel() * state.progress}px)`;
    slider.setAttribute("aria-valuenow", String(Math.round(state.progress * 100)));
    slider.setAttribute("aria-valuetext", `${Math.round(state.progress * 100)} persen terpotong`);
  }

  function completeCut() {
    if (state.cut || state.candles.size !== 2) return;
    state.cut = true;
    setCutProgress(1);
    slider.setAttribute("aria-disabled", "true");
    $("cakeInstruction").textContent = "Kuenya sudah terpotong. Semoga harapanmu tumbuh jadi kenyataan ♡";
    window.setTimeout(() => {
      $("cakeCard").classList.add("is-cut");
      $("cakeCard").dataset.step = "done";
      $("cutStep").className = "is-done";
      $("letterStep").className = "is-current";
      $("cakeContinue").hidden = false;
      $("afterCake").hidden = false;
      $("afterCake").inert = false;
      $("cakeFootnote").textContent = "now, a little letter from my heart.";
      if (document.activeElement === slider) $("cakeContinue").focus({ preventScroll: true });
      const rect = $("cakeScene").getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 50);
      announce("Kue terpotong. Surat, permohonan, dan scrapbook sekarang terbuka.");
      updateReading();
    }, reducedMotion.matches ? 0 : 550);
  }

  slider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || state.candles.size !== 2 || state.cut || state.drag) return;
    const rect = thumb.getBoundingClientRect();
    if (event.clientX < rect.left - 8 || event.clientX > rect.right + 8 || event.clientY < rect.top - 8 || event.clientY > rect.bottom + 8) return;
    event.preventDefault();
    slider.focus({ preventScroll: true });
    state.drag = { id: event.pointerId, startX: event.clientX, startProgress: state.progress };
    slider.classList.add("is-dragging");
    slider.setPointerCapture(event.pointerId);
  });
  slider.addEventListener("pointermove", (event) => {
    if (!state.drag || state.drag.id !== event.pointerId) return;
    event.preventDefault();
    setCutProgress(state.drag.startProgress + (event.clientX - state.drag.startX) / travel());
  });

  function endCut(event, cancelled = false) {
    if (!state.drag || (event && event.pointerId !== state.drag.id)) return;
    const pointerId = state.drag.id;
    state.drag = null;
    slider.classList.remove("is-dragging");
    if (slider.hasPointerCapture(pointerId)) slider.releasePointerCapture(pointerId);
    if (!cancelled && state.progress >= .97) completeCut();
    else setCutProgress(0);
  }
  slider.addEventListener("pointerup", (event) => endCut(event));
  slider.addEventListener("pointercancel", (event) => endCut(event, true));
  slider.addEventListener("lostpointercapture", (event) => endCut(event, true));
  slider.addEventListener("keydown", (event) => {
    if (state.candles.size !== 2 || state.cut) return;
    const actions = { ArrowRight: state.progress + .1, ArrowUp: state.progress + .1, ArrowLeft: state.progress - .1, ArrowDown: state.progress - .1, Home: 0, End: 1 };
    if (!(event.key in actions)) return;
    event.preventDefault();
    setCutProgress(actions[event.key]);
    if (state.progress >= .999) completeCut();
  });

  $("openLetter").addEventListener("click", () => {
    if (!state.cut || $("openLetter").disabled) return;
    $("openLetter").disabled = true;
    $("openLetter").classList.add("is-opening");
    $("openLetter").setAttribute("aria-expanded", "true");
    window.setTimeout(() => {
      $("openLetter").hidden = true;
      $("letterPaper").hidden = false;
      $("letterPaper").tabIndex = -1;
      $("letterPaper").focus({ preventScroll: true });
      $("letterStep").className = "is-done";
      announce("Surat cinta sudah terbuka.");
      updateReading();
    }, reducedMotion.matches ? 0 : 950);
  });

  config.wishes.forEach((wish, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wish-bubble";
    button.textContent = `${wish.symbol}  ${wish.label}`;
    button.style.setProperty("--delay", `${index * -.63}s`);
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-controls", "wishCard");
    button.addEventListener("click", () => {
      document.querySelectorAll(".wish-bubble").forEach((bubble) => bubble.setAttribute("aria-pressed", String(bubble === button)));
      $("wishSymbol").textContent = wish.symbol;
      $("wishTitle").textContent = wish.title;
      $("wishMessage").textContent = wish.message;
      $("wishEyebrow").textContent = wish.label;
      button.classList.remove("is-popping");
      $("wishCard").classList.remove("is-revealing");
      void button.offsetWidth;
      button.classList.add("is-popping");
      $("wishCard").classList.add("is-revealing");
      const rect = button.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 16);
      window.setTimeout(() => { button.classList.remove("is-popping"); }, 450);
      if (window.innerWidth <= 650) $("wishCard").scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "nearest" });
    });
    $("wishBubbles").append(button);
  });
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const memories = config.memories;
  const photosOf = (memory) => {
    const list = Array.isArray(memory.photos) ? memory.photos : [memory.photo];
    return list.filter(Boolean);
  };
  const gallery = memories.flatMap((memory, memoryIndex) =>
    photosOf(memory).map((source, slot) => ({ source, memoryIndex, slot })));
  const memoryCountNode = $("memoryCount");
  if (memoryCountNode) memoryCountNode.textContent = gallery.length;
  const numberOf = (index) => String(index + 1).padStart(2, "0");

  const sparkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#spark-icon"/></svg>';
  const expandIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6m0-6-7 7M10 20H4v-6m0 6 7-7"/></svg>';
  const heartIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#heart-icon"/></svg>';
  function createCard(shot, galleryIndex) {
    const memory = memories[shot.memoryIndex];
    const number = numberOf(galleryIndex);
    const card = element("article", "memory-card");
    const frame = element("div", "memory-frame");
    const image = element("img");
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;
    photo(image, shot.source, `${memory.title}, foto ${number}`);
    const badge = element("span", "memory-badge");
    badge.innerHTML = sparkIcon;
    badge.append(`MEMORY ${number}`);
    const expand = element("button", "memory-expand");
    expand.type = "button";
    expand.setAttribute("aria-label", `Perbesar foto ${number}: ${memory.title}`);
    expand.innerHTML = expandIcon;
    expand.addEventListener("click", (event) => { event.stopPropagation(); openPhoto(galleryIndex, expand); });
    frame.addEventListener("click", () => openPhoto(galleryIndex, expand));
    frame.append(image, badge, expand);
    const foot = element("div", "memory-foot");
    const like = element("button", "memory-like");
    like.type = "button";
    like.setAttribute("aria-pressed", "false");
    like.setAttribute("aria-label", `Sukai foto ${number}`);
    like.innerHTML = heartIcon;
    like.addEventListener("click", () => {
      const on = like.getAttribute("aria-pressed") !== "true";
      like.setAttribute("aria-pressed", String(on));
      if (on) {
        const rect = like.getBoundingClientRect();
        burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
      }
    });
    foot.append(element("p", "", memory.note), like);
    card.append(frame, foot);
    return card;
  }
  $("memoryGrid").replaceChildren(...gallery.map((shot, index) => createCard(shot, index)));

  const viewer = $("photoViewer");
  let viewerTrigger = null;
  function showPhoto(index) {
    state.viewer = (index + gallery.length) % gallery.length;
    const shot = gallery[state.viewer];
    const memory = memories[shot.memoryIndex];
    const number = String(state.viewer + 1).padStart(2, "0");
    $("viewerTitle").textContent = memory.title;
    $("viewerCaption").textContent = memory.caption;
    $("viewerNote").textContent = memory.note;
    $("viewerCount").textContent = `PHOTO ${number} / ${gallery.length}`;
    $("viewerPosition").textContent = `${number} / ${gallery.length}`;
    photo($("viewerImage"), shot.source, memory.title);
  }
  function openPhoto(index, trigger) {
    viewerTrigger = trigger;
    showPhoto(index);
    document.body.classList.add("photo-open");
    viewer.showModal();
    viewer.scrollTop = 0;
    $("closeViewer").focus({ preventScroll: true });
  }
  $("closeViewer").addEventListener("click", () => viewer.close());
  $("previousPhoto").addEventListener("click", () => showPhoto(state.viewer - 1));
  $("nextPhoto").addEventListener("click", () => showPhoto(state.viewer + 1));
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(state.viewer + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  viewer.addEventListener("click", (event) => {
    const rect = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
  });
  viewer.addEventListener("close", () => {
    document.body.classList.remove("photo-open");
    viewerTrigger?.focus({ preventScroll: true });
  });

  const heartCanvas = $("heartBackground");
  const heartContext = heartCanvas.getContext("2d");
  const celebrationCanvas = $("celebrationCanvas");
  const partyContext = celebrationCanvas.getContext("2d");
  let width = window.innerWidth;
  let height = window.innerHeight;
  let hearts = [];
  let particles = [];
  let ambientFrame = 0;
  let partyFrame = 0;
  let lastAmbient = 0;
  let lastParty = 0;

  function heartPath(context, size) {
    context.beginPath();
    context.moveTo(0, size * .5);
    context.bezierCurveTo(-size * 1.2, -size * .25, -size * .55, -size, 0, -size * .4);
    context.bezierCurveTo(size * .55, -size, size * 1.2, -size * .25, 0, size * .5);
    context.closePath();
  }
  function starPath(context, size) {
    context.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 - Math.PI / 2;
      const radius = i % 2 ? size * .26 : size;
      if (i === 0) context.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    context.closePath();
  }
  function flower(context, size, color) {
    context.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      context.beginPath();
      context.ellipse(Math.cos(angle) * size * .48, Math.sin(angle) * size * .48, size * .48, size * .32, angle, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = "#ffefd1";
    context.beginPath();
    context.arc(0, 0, size * .21, 0, Math.PI * 2);
    context.fill();
  }
  function resizeCanvases() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    [[heartCanvas, heartContext], [celebrationCanvas, partyContext]].forEach(([canvas, context]) => {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    hearts = Array.from({ length: width < 650 ? 19 : 31 }, () => ({ x: Math.random() * width, y: Math.random() * height, size: 4 + Math.random() * 8, speed: 7 + Math.random() * 14, phase: Math.random() * Math.PI * 2, alpha: .11 + Math.random() * .14 }));
    if (reducedMotion.matches) drawAmbient(performance.now());
  }
  function drawAmbient(time) {
    const dt = Math.min((time - (lastAmbient || time)) / 1000, .04);
    lastAmbient = time;
    heartContext.clearRect(0, 0, width, height);
    hearts.forEach((heart) => {
      if (!reducedMotion.matches) {
        heart.y -= heart.speed * dt;
        if (heart.y < -25) heart.y = height + 25;
      }
      heartContext.save();
      heartContext.translate(heart.x + Math.sin(time * .00045 + heart.phase) * 12, heart.y);
      heartContext.rotate(Math.sin(heart.phase) * .3);
      heartContext.globalAlpha = heart.alpha;
      heartContext.fillStyle = "#c4839e";
      heartPath(heartContext, heart.size);
      heartContext.fill();
      heartContext.restore();
    });
    if (!document.hidden && !reducedMotion.matches) ambientFrame = requestAnimationFrame(drawAmbient);
    else ambientFrame = 0;
  }
  function burst(x, y, count = 90) {
    const colors = ["#f3b6cb", "#ffe7ad", "#fff2e7", "#cd8eac", "#edb7b9", "#eedbb0"];
    const now = performance.now();
    const total = reducedMotion.matches ? Math.min(count, 18) : count;
    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 95 + Math.random() * 225;
      particles.push({
        x: reducedMotion.matches ? x + (Math.random() - .5) * 200 : x,
        y: reducedMotion.matches ? y + (Math.random() - .5) * 130 : y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 125,
        size: 5 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * 3,
        color: colors[i % colors.length],
        type: i % 3,
        born: now,
        life: reducedMotion.matches ? 1050 : 2100 + Math.random() * 1200
      });
    }
    particles = particles.slice(-260);
    if (!partyFrame && !document.hidden) {
      lastParty = 0;
      partyFrame = requestAnimationFrame(drawParty);
    }
  }
  function drawParty(time) {
    const dt = Math.min((time - (lastParty || time)) / 1000, .04);
    lastParty = time;
    partyContext.clearRect(0, 0, width, height);
    particles = particles.filter((particle) => time - particle.born < particle.life);
    particles.forEach((particle) => {
      const progress = (time - particle.born) / particle.life;
      if (!reducedMotion.matches) {
        particle.vy += 175 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.rotation += particle.spin * dt;
      }
      partyContext.save();
      partyContext.translate(particle.x, particle.y);
      partyContext.rotate(particle.rotation);
      partyContext.globalAlpha = Math.min(1, (1 - progress) * 2) * (particle.type === 1 ? .65 + Math.sin(time * .013 + particle.born) * .35 : 1);
      partyContext.fillStyle = particle.color;
      if (particle.type === 0) {
        heartPath(partyContext, particle.size);
        partyContext.fill();
      } else if (particle.type === 1) {
        partyContext.shadowColor = "#ffefd3";
        partyContext.shadowBlur = 12;
        starPath(partyContext, particle.size);
        partyContext.fill();
      } else flower(partyContext, particle.size, particle.color);
      partyContext.restore();
    });
    if (particles.length && !document.hidden) partyFrame = requestAnimationFrame(drawParty);
    else { partyFrame = 0; partyContext.clearRect(0, 0, width, height); }
  }

  let celebrationTimers = [];
  function showGift(choice) {
    const flowers = choice === "flowers";
    celebrationTimers.forEach(clearTimeout);
    celebrationTimers = [];
    $("giftResult").hidden = false;
    $("flowerResult").hidden = !flowers;
    $("catResult").hidden = flowers;
    $("flowerYes").setAttribute("aria-pressed", String(flowers));
    $("flowerNo").setAttribute("aria-pressed", String(!flowers));
    $("giftStatus").textContent = flowers ? "Bunga untukmu mulai tumbuh dan mekar." : "Si meong muncul untuk menemanimu.";
    if (flowers) {
      window.birthdayFlowers.play();
    } else {
      window.birthdayFlowers.stop();
      particles = [];
      cancelAnimationFrame(partyFrame);
      partyFrame = 0;
      partyContext.clearRect(0, 0, width, height);
    }
    updateReading();
    $("giftResult").scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "nearest" });
  }
  $("flowerYes").addEventListener("click", () => showGift("flowers"));
  $("flowerNo").addEventListener("click", () => showGift("cat"));
  $("replayFlowers").addEventListener("click", () => window.birthdayFlowers.play());

  let readingFrame = 0;
  function updateReading() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    $("readingProgress").style.transform = `scaleX(${available > 0 ? clamp(window.scrollY / available, 0, 1) : 0})`;
    readingFrame = 0;
  }
  window.addEventListener("scroll", () => {
    if (!readingFrame) readingFrame = requestAnimationFrame(updateReading);
  }, { passive: true });
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      endCut(null, true);
      if (!state.cut) setCutProgress(state.progress);
      resizeCanvases();
      updateReading();
    }, 100);
  }, { passive: true });
  function motionState() {
    cancelAnimationFrame(ambientFrame);
    cancelAnimationFrame(partyFrame);
    ambientFrame = 0;
    partyFrame = 0;
    lastAmbient = 0;
    lastParty = 0;
    if (!document.hidden) {
      drawAmbient(performance.now());
      if (particles.length) partyFrame = requestAnimationFrame(drawParty);
    } else {
      endCut(null, true);
      particles = [];
      partyContext.clearRect(0, 0, width, height);
      celebrationTimers.forEach(clearTimeout);
    }
  }
  document.addEventListener("visibilitychange", motionState);
  reducedMotion.addEventListener("change", motionState);
  resizeCanvases();
  motionState();
})();