(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // Smooth scroll reveal
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -70px 0px" });

  $$("[data-reveal]").forEach((node) => revealObserver.observe(node));

  // Ambient sky: stars, fireflies, wisps and soft constellation lines
  const canvas = $("#ambience");
  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let burst = [];

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(64, Math.floor((width * height) / 15000));
    particles = Array.from({ length: count }, () => createParticle(true));
  }

  function createParticle(randomY = false) {
    const roll = Math.random();
    const type = roll > 0.88 ? "ember" : roll > 0.52 ? "star" : "wisp";
    const isEmber = type === "ember";
    const isStar = type === "star";

    return {
      type,
      x: Math.random() * width,
      y: randomY ? Math.random() * height : height + Math.random() * 90,
      vx: isStar ? (Math.random() - 0.5) * 0.05 : (Math.random() - 0.5) * 0.24,
      vy: isStar ? (Math.random() - 0.5) * 0.04 : -(0.06 + Math.random() * (isEmber ? 0.32 : 0.18)),
      r: isStar ? 0.8 + Math.random() * 1.3 : isEmber ? 1.2 + Math.random() * 2.3 : 1.1 + Math.random() * 2.6,
      a: isStar ? 0.18 + Math.random() * 0.42 : isEmber ? 0.18 + Math.random() * 0.26 : 0.10 + Math.random() * 0.22,
      tw: Math.random() * Math.PI * 2
    };
  }

  function createBurst(x, y) {
    for (let i = 0; i < 34; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.9 + Math.random() * 3.1;
      burst.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 48 + Math.random() * 24,
        age: 0,
        r: 1 + Math.random() * 2.8
      });
    }
  }

  function drawConstellations() {
    const stars = particles.filter((p) => p.type === "star");
    ctx.lineWidth = 1;

    for (let i = 0; i < stars.length; i++) {
      const a = stars[i];
      for (let j = i + 1; j < stars.length; j++) {
        const b = stars[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 92) {
          const alpha = (1 - dist / 92) * 0.12;
          ctx.strokeStyle = `rgba(116, 199, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  function drawAmbience() {
    ctx.clearRect(0, 0, width, height);
    drawConstellations();

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.tw += 0.016;

      const dx = p.x - mouse.x;
const dy = p.y - mouse.y;
const dist = Math.hypot(dx, dy);

if (dist < 180) {
  const force = (180 - dist) / 180;
  const angleX = dx / (dist || 1);
  const angleY = dy / (dist || 1);

  p.x += angleX * force * 7;
  p.y += angleY * force * 7;
}

      if (p.y < -30 || p.y > height + 30 || p.x < -40 || p.x > width + 40) {
        Object.assign(p, createParticle(false));
      }

      const alpha = Math.max(0.02, p.a + Math.sin(p.tw) * 0.08);
      const color = p.type === "ember"
        ? `rgba(240, 179, 90, ${alpha})`
        : p.type === "wisp"
          ? `rgba(116, 199, 255, ${alpha * 0.82})`
          : `rgba(190, 225, 255, ${alpha})`;

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.shadowColor = p.type === "ember" ? "rgba(240, 179, 90, 0.58)" : "rgba(30, 155, 255, 0.72)";
      ctx.shadowBlur = p.type === "star" ? 10 : 18;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (let i = burst.length - 1; i >= 0; i--) {
      const b = burst[i];
      b.age++;
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.965;
      b.vy *= 0.965;
      const alpha = Math.max(0, 1 - b.age / b.life);

      ctx.beginPath();
      ctx.fillStyle = `rgba(116, 199, 255, ${alpha * 0.75})`;
      ctx.shadowColor = "rgba(30, 155, 255, 0.8)";
      ctx.shadowBlur = 18;
      ctx.arc(b.x, b.y, b.r * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (b.age >= b.life) burst.splice(i, 1);
    }

    requestAnimationFrame(drawAmbience);
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
  window.addEventListener("pointerleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  resizeCanvas();
  drawAmbience();

  // Mood widget
  const moods = [
    {
      title: "🎮 Игровой стрим",
      text: "Проходим, обсуждаем, иногда героически страдаем с боссами."
    },
    {
      title: "🎬 Киновечер",
      text: "Смотрим вместе, делимся эмоциями и отдыхаем после дня."
    },
    {
      title: "☕ Посиделки",
      text: "Болтаем обо всём: игры, персонажи, фандом, идеи и просто жизнь."
    },
    {
      title: "🌙 Тихий ночной эфир",
      text: "Спокойный вайб, мягкий голос, тёмный экран и уютная стая рядом."
    }
  ];

  let moodIndex = 0;
  const moodTitle = $("#moodTitle");
  const moodText = $("#moodText");

  function setMood(nextIndex) {
    moodIndex = (nextIndex + moods.length) % moods.length;

    moodTitle.animate(
      [{ opacity: 0, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 260 }
    );
    moodText.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });

    moodTitle.textContent = moods[moodIndex].title;
    moodText.textContent = moods[moodIndex].text;

    $$(".signal-chip").forEach((chip) => {
      chip.classList.toggle("active", Number(chip.dataset.mood) === moodIndex);
    });
  }

  $("#moodNext")?.addEventListener("click", () => setMood(moodIndex + 1));

  $$(".signal-chip").forEach((chip) => {
    chip.addEventListener("click", () => setMood(Number(chip.dataset.mood)));
  });

  setInterval(() => setMood(moodIndex + 1), 10000);

  // Toast helper
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  // Portrait easter egg: 5 clicks = howl welcome
  const portrait = $("#wolfPortrait");
  const counter = $("#clickCounter");
  let clicks = 0;
  let clickTimer = null;

  function playHowl() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ac = new AudioCtx();
      const now = ac.currentTime;

      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const filter = ac.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.22);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.95);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(780, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);

      osc.connect(filter).connect(gain).connect(ac.destination);
      osc.start(now);
      osc.stop(now + 1.1);

      setTimeout(() => ac.close(), 1400);
    } catch (_) {
      // Audio is optional.
    }
  }

  function howlAt(x, y, message = "Аууу~ добро пожаловать в стаю 🐾") {
    portrait?.classList.add("howl");
    document.body.classList.add("signal-pulse");
    createBurst(x || window.innerWidth / 2, y || window.innerHeight / 2);
    showToast(message);
    playHowl();

    setTimeout(() => {
      portrait?.classList.remove("howl");
      document.body.classList.remove("signal-pulse");
    }, 2300);
  }

  portrait?.addEventListener("click", (event) => {
    clicks++;
    counter.textContent = `${clicks} / 5`;
    counter.classList.add("show");

    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      clicks = 0;
      counter.classList.remove("show");
      counter.textContent = "0 / 5";
    }, 1600);

    if (clicks >= 5) {
      clicks = 0;
      counter.textContent = "0 / 5";
      counter.classList.remove("show");
      howlAt(event.clientX, event.clientY);
    }
  });

  $("#packSignal")?.addEventListener("click", (event) => {
    howlAt(event.clientX, event.clientY, "Сигнал принят. Стая рядом 💙");
  });

  // Chat command copy
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Команда ${text} скопирована`);
    } catch (_) {
      showToast(`Команда: ${text}`);
    }
  }

  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copy));
  });

  // Warm oracle
  const oraclePhrases = [
    "Тихий зритель — тоже часть стаи.",
    "Сегодня можно просто отдохнуть. Этого достаточно.",
    "Если день был тяжёлый — устраивайся ближе к огню.",
    "Не обязательно быть громким, чтобы быть своим.",
    "Синий свет глаз — это маяк домой.",
    "Логово открыто. Чай тёплый. Чат живой.",
    "Победы приятны, но уют важнее."
  ];

  $("#oracleBtn")?.addEventListener("click", () => {
    const text = oraclePhrases[Math.floor(Math.random() * oraclePhrases.length)];
    const oracleText = $("#oracleText");
    oracleText.textContent = text;
    oracleText.animate(
      [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 280 }
    );
  });

  // Enhanced gallery: filters, feature card, 3D hover and keyboard lightbox navigation
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxDescription = $("#lightboxDescription");
  const lightboxCounter = $("#lightboxCounter");
  const galleryItems = $$(".gallery-item");
  let visibleGalleryItems = [...galleryItems];
  let activeGalleryIndex = 0;

  function padGalleryNumber(number) {
    return String(number).padStart(2, "0");
  }

  function setFeatureFromItem(item) {
    const featureImg = $("#galleryFeatureImg");
    const featureTitle = $("#galleryFeatureTitle");
    const featureDesc = $("#galleryFeatureDesc");
    const featureBtn = $("#galleryFeatureBtn");
    const featureOpen = $("#galleryFeatureOpen");
    if (!item || !featureImg) return;

    featureImg.src = item.dataset.full;
    featureImg.alt = `${item.dataset.title} — GreLka`;
    featureTitle.textContent = item.dataset.title;
    featureDesc.textContent = item.dataset.desc;
    featureBtn.dataset.galleryIndex = item.dataset.galleryIndex;
    featureOpen.dataset.galleryIndex = item.dataset.galleryIndex;

    featureImg.animate(
      [{ opacity: 0, transform: "scale(1.025)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 360, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
  }

  function refreshVisibleGalleryItems() {
    visibleGalleryItems = galleryItems.filter((item) => !item.classList.contains("is-hidden"));
  }

  function openLightboxByItem(item) {
    if (!item || !lightbox) return;
    refreshVisibleGalleryItems();
    activeGalleryIndex = Math.max(0, visibleGalleryItems.indexOf(item));

    lightboxImg.src = item.dataset.full;
    lightboxImg.alt = `${item.dataset.title} — GreLka`;
    lightboxCaption.textContent = item.dataset.title;
    lightboxDescription.textContent = item.dataset.desc;
    lightboxCounter.textContent = `${padGalleryNumber(activeGalleryIndex + 1)} / ${padGalleryNumber(visibleGalleryItems.length)}`;
    lightbox.classList.add("show");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function openLightboxByIndex(index) {
    const item = galleryItems.find((node) => node.dataset.galleryIndex === String(index));
    openLightboxByItem(item);
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  function moveLightbox(direction) {
    if (!lightbox?.classList.contains("show") || !visibleGalleryItems.length) return;
    activeGalleryIndex = (activeGalleryIndex + direction + visibleGalleryItems.length) % visibleGalleryItems.length;
    const item = visibleGalleryItems[activeGalleryIndex];

    lightboxImg.animate(
      [{ opacity: 0, transform: "scale(0.985)" }, { opacity: 1, transform: "scale(1)" }],
      { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" }
    );
    lightboxImg.src = item.dataset.full;
    lightboxImg.alt = `${item.dataset.title} — GreLka`;
    lightboxCaption.textContent = item.dataset.title;
    lightboxDescription.textContent = item.dataset.desc;
    lightboxCounter.textContent = `${padGalleryNumber(activeGalleryIndex + 1)} / ${padGalleryNumber(visibleGalleryItems.length)}`;
    setFeatureFromItem(item);
  }

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      setFeatureFromItem(item);
      openLightboxByItem(item);
    });

    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * 7;
      const ry = (px - 0.5) * 9;
      item.style.setProperty("--rx", `${rx}deg`);
      item.style.setProperty("--ry", `${ry}deg`);
      item.style.setProperty("--gx", `${px * 100}%`);
      item.style.setProperty("--gy", `${py * 100}%`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--rx", "0deg");
      item.style.setProperty("--ry", "0deg");
      item.style.setProperty("--gx", "50%");
      item.style.setProperty("--gy", "50%");
    });
  });

  $$(".gallery-filter").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      $$(".gallery-filter").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");

      galleryItems.forEach((item, index) => {
        const show = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("is-hidden", !show);
        if (show) {
          item.classList.remove("filter-pop");
          void item.offsetWidth;
          item.classList.add("filter-pop");
          item.style.animationDelay = `${Math.min(index * 28, 180)}ms`;
        }
      });

      refreshVisibleGalleryItems();
      setFeatureFromItem(visibleGalleryItems[0]);
      showToast(filter === "all" ? "Показаны все кадры GreLka" : "Галерея мягко перестроилась");
    });
  });

  [$("#galleryFeatureBtn"), $("#galleryFeatureOpen")].forEach((button) => {
    button?.addEventListener("click", () => openLightboxByIndex(button.dataset.galleryIndex));
  });

  $("#galleryFeatureOpen")?.addEventListener("pointermove", (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--fx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    event.currentTarget.style.setProperty("--fy", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });

  $("#lightboxClose")?.addEventListener("click", closeLightbox);
  $("#lightboxPrev")?.addEventListener("click", () => moveLightbox(-1));
  $("#lightboxNext")?.addEventListener("click", () => moveLightbox(1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });

  // Type WOLF anywhere for a hidden greeting
  let typed = "";
  window.addEventListener("keydown", (event) => {
    if (event.key.length !== 1) return;
    typed = (typed + event.key.toUpperCase()).slice(-4);
    if (typed === "WOLF") {
      typed = "";
      howlAt(window.innerWidth / 2, window.innerHeight / 2, "Стая услышала зов. Хорошего стрима, GreLka 💙");
    }
  });

  // Footer to top button
  $("#toTop")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();



/* ================================================================
   V7 · Wolf Tetris easter egg. Progress is saved per visitor in localStorage.
   ================================================================ */
(() => {
  "use strict";

  const shroud = document.getElementById("tetrisShroud");
  const openBtn = document.getElementById("tetrisOpenBtn");
  const closeBtn = document.getElementById("tetrisClose");
  const canvas = document.getElementById("tetrisCanvas");
  const nextCanvas = document.getElementById("tetrisNext");
  if (!shroud || !openBtn || !canvas || !nextCanvas) return;

  const ctx = canvas.getContext("2d");
  const nctx = nextCanvas.getContext("2d");
  const scoreEl = document.getElementById("tetrisScore");
  const bestEl = document.getElementById("tetrisBest");
  const linesEl = document.getElementById("tetrisLines");
  const progressEl = document.getElementById("tetrisProgress");
  const progressText = document.getElementById("tetrisProgressText");
  const overlay = document.getElementById("tetrisOverlay");
  const overlayTitle = document.getElementById("tetrisOverlayTitle");
  const overlayText = document.getElementById("tetrisOverlayText");
  const startBtn = document.getElementById("tetrisStart");
  const pauseBtn = document.getElementById("tetrisPause");
  const resetBestBtn = document.getElementById("tetrisResetBest");

  const COLS = 10, ROWS = 20, BLOCK = 30, NEXT_BLOCK = 24;
  const STORAGE_KEY = "grelka-wolf-tetris-progress-v1";
  const SHAPES = {
    I: [[1, 1, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]],
    O: [[1, 1], [1, 1]], S: [[0, 1, 1], [1, 1, 0]], T: [[0, 1, 0], [1, 1, 1]], Z: [[1, 1, 0], [0, 1, 1]]
  };
  const COLORS = { I: "#74c7ff", J: "#1e9bff", L: "#f0b35a", O: "#ffd166", S: "#56f2c3", T: "#8b7cff", Z: "#ff5a7a" };
  let board = [], current = null, next = null, score = 0, lines = 0, level = 1, best = 0, games = 0;
  let running = false, paused = false, over = false, lastTime = 0, dropCounter = 0, rafId = null;

  const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const randomType = () => Object.keys(SHAPES)[Math.floor(Math.random() * Object.keys(SHAPES).length)];
  const clone = m => m.map(r => r.slice());
  const makePiece = (type = randomType()) => ({ type, matrix: clone(SHAPES[type]), x: Math.floor((COLS - SHAPES[type][0].length) / 2), y: 0 });
  const interval = () => Math.max(110, 760 - (level - 1) * 58);

  function loadProgress(){ try{ const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"); best=Number(s.best||0); games=Number(s.games||0); }catch(_){ best=0; games=0; } bestEl.textContent=best; }
  function saveProgress(){ localStorage.setItem(STORAGE_KEY, JSON.stringify({ best, lastScore:score, lastLines:lines, games, updatedAt:new Date().toISOString() })); }
  function showOverlay(title,text){ overlayTitle.textContent=title; overlayText.textContent=text; overlay.classList.remove("hidden"); }
  function hideOverlay(){ overlay.classList.add("hidden"); }

  function collide(piece, ox=0, oy=0, matrix=piece.matrix){
    for(let y=0;y<matrix.length;y++) for(let x=0;x<matrix[y].length;x++){
      if(!matrix[y][x]) continue; const nx=piece.x+x+ox, ny=piece.y+y+oy;
      if(nx<0 || nx>=COLS || ny>=ROWS) return true;
      if(ny>=0 && board[ny][nx]) return true;
    }
    return false;
  }
  function merge(piece){ piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(v){ const by=piece.y+y,bx=piece.x+x; if(by>=0&&by<ROWS&&bx>=0&&bx<COLS) board[by][bx]=piece.type; }})); }
  function clearLines(){
    let cleared=0;
    outer: for(let y=ROWS-1;y>=0;y--){ for(let x=0;x<COLS;x++) if(!board[y][x]) continue outer; board.splice(y,1); board.unshift(Array(COLS).fill(0)); cleared++; y++; }
    if(cleared){ score += [0,100,300,500,800][cleared]*level; lines += cleared; level = Math.floor(lines/10)+1; flashBoard(); }
  }
  function spawn(){ current=next; current.x=Math.floor((COLS-current.matrix[0].length)/2); current.y=0; next=makePiece(); if(collide(current)) endGame(); }
  function lock(){ merge(current); clearLines(); spawn(); updateUI(); draw(); }
  function softDrop(){ if(!running||paused||over) return; if(!collide(current,0,1)){ current.y++; score++; } else lock(); updateUI(); }
  function hardDrop(){ if(!running||paused||over) return; let d=0; while(!collide(current,0,1)){ current.y++; d++; } score += d*2; lock(); }
  function rotateMatrix(m){ return m[0].map((_,i)=>m.map(row=>row[i]).reverse()); }
  function rotatePiece(){ if(!running||paused||over) return; const r=rotateMatrix(current.matrix); for(const k of [0,-1,1,-2,2]) if(!collide(current,k,0,r)){ current.matrix=r; current.x+=k; draw(); return; } }
  function movePiece(dir){ if(!running||paused||over) return; if(!collide(current,dir,0)){ current.x+=dir; draw(); } }

  function updateUI(){
    scoreEl.textContent=score; linesEl.textContent=lines;
    if(score>best){ best=score; bestEl.textContent=best; saveProgress(); }
    const target=Math.max(best,1000); const pct=best===0?Math.min(100,Math.round(score/target*100)):Math.min(100,Math.round(score/best*100));
    progressEl.style.width=pct+"%"; progressText.textContent=pct+"%"; drawNext();
  }
  function endGame(){ running=false; over=true; cancelAnimationFrame(rafId); if(score>best){best=score; bestEl.textContent=best;} saveProgress(); showOverlay("Игра окончена",`Счёт: ${score}. Рекорд сохранён в браузере.`); updateUI(); }
  function resetGame(){ board=emptyBoard(); score=0; lines=0; level=1; current=makePiece(); next=makePiece(); running=true; paused=false; over=false; dropCounter=0; lastTime=0; games++; updateUI(); hideOverlay(); draw(); cancelAnimationFrame(rafId); rafId=requestAnimationFrame(loop); }
  function togglePause(){ if(!running||over) return; paused=!paused; if(paused){ showOverlay("Пауза","Нажми P или кнопку «Пауза», чтобы продолжить."); pauseBtn.textContent="Продолжить"; } else { hideOverlay(); pauseBtn.textContent="Пауза"; lastTime=0; rafId=requestAnimationFrame(loop); } }

  function drawBlock(context,x,y,size,color,alpha=1){
    context.save(); context.globalAlpha=alpha; const px=x*size, py=y*size;
    const g=context.createLinearGradient(px,py,px+size,py+size); g.addColorStop(0,"#fff"); g.addColorStop(.08,color); g.addColorStop(1,"#07101b");
    context.fillStyle=g; context.fillRect(px+1,py+1,size-2,size-2); context.strokeStyle="rgba(237,246,255,.18)"; context.strokeRect(px+1.5,py+1.5,size-3,size-3); context.restore();
  }
  function drawGrid(){ ctx.strokeStyle="rgba(116,199,255,.07)"; ctx.lineWidth=1; for(let x=1;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*BLOCK,0);ctx.lineTo(x*BLOCK,canvas.height);ctx.stroke();} for(let y=1;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*BLOCK);ctx.lineTo(canvas.width,y*BLOCK);ctx.stroke();} }
  function drawGhost(){ if(!current) return; const g={type:current.type,matrix:current.matrix,x:current.x,y:current.y}; while(!collide(g,0,1)) g.y++; g.matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(v) drawBlock(ctx,g.x+x,g.y+y,BLOCK,COLORS[g.type],.18); })); }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height); const bg=ctx.createLinearGradient(0,0,0,canvas.height); bg.addColorStop(0,"#07101b"); bg.addColorStop(1,"#030508"); ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height); drawGrid();
    board.forEach((row,y)=>row.forEach((t,x)=>{ if(t) drawBlock(ctx,x,y,BLOCK,COLORS[t]); })); drawGhost();
    if(current) current.matrix.forEach((row,y)=>row.forEach((v,x)=>{ if(v) drawBlock(ctx,current.x+x,current.y+y,BLOCK,COLORS[current.type]); }));
    ctx.fillStyle="rgba(116,199,255,.12)"; ctx.font="700 11px JetBrains Mono, monospace"; ctx.fillText("GRELKA DEN",10,18);
  }
  function drawNext(){
    nctx.clearRect(0,0,nextCanvas.width,nextCanvas.height); nctx.fillStyle="rgba(5,7,11,.74)"; nctx.fillRect(0,0,nextCanvas.width,nextCanvas.height); if(!next) return;
    const m=next.matrix,w=m[0].length,h=m.length,ox=Math.floor((nextCanvas.width/NEXT_BLOCK-w)/2),oy=Math.floor((nextCanvas.height/NEXT_BLOCK-h)/2);
    m.forEach((row,y)=>row.forEach((v,x)=>{ if(v) drawBlock(nctx,ox+x,oy+y,NEXT_BLOCK,COLORS[next.type]); }));
  }
  function flashBoard(){ canvas.animate([{filter:"brightness(1)"},{filter:"brightness(1.35) drop-shadow(0 0 22px rgba(116,199,255,.42))"},{filter:"brightness(1)"}],{duration:280,easing:"ease-out"}); }
  function loop(time=0){ if(!running||paused||over) return; const delta=time-lastTime; lastTime=time; dropCounter+=delta; if(dropCounter>interval()){ softDrop(); dropCounter=0; } draw(); rafId=requestAnimationFrame(loop); }
  function openTetris(){ shroud.classList.add("show"); shroud.setAttribute("aria-hidden","false"); document.body.classList.add("tetris-open"); draw(); drawNext(); }
  function closeTetris(){ shroud.classList.remove("show"); shroud.setAttribute("aria-hidden","true"); document.body.classList.remove("tetris-open"); if(running&&!over){ paused=true; pauseBtn.textContent="Продолжить"; showOverlay("Пауза","Игра поставлена на паузу."); } }
  function control(a){ if(a==="left") movePiece(-1); if(a==="right") movePiece(1); if(a==="rotate") rotatePiece(); if(a==="down") softDrop(); if(a==="drop") hardDrop(); }

  openBtn.addEventListener("click", openTetris); closeBtn?.addEventListener("click", closeTetris); shroud.addEventListener("click",e=>{ if(e.target===shroud) closeTetris(); });
  startBtn?.addEventListener("click",()=>{ resetGame(); startBtn.textContent="Заново"; pauseBtn.textContent="Пауза"; }); pauseBtn?.addEventListener("click",togglePause);
  resetBestBtn?.addEventListener("click",()=>{ best=0; bestEl.textContent="0"; saveProgress(); updateUI(); });
  document.querySelectorAll("[data-tetris-control]").forEach(b=>b.addEventListener("click",()=>control(b.dataset.tetrisControl)));
  window.addEventListener("keydown",e=>{ if(!shroud.classList.contains("show")) return; if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key)) e.preventDefault(); if(e.key==="Escape") closeTetris(); if(e.key==="ArrowLeft") movePiece(-1); if(e.key==="ArrowRight") movePiece(1); if(e.key==="ArrowUp") rotatePiece(); if(e.key==="ArrowDown") softDrop(); if(e.key===" ") hardDrop(); if(e.key.toLowerCase()==="p"||e.key.toLowerCase()==="з") togglePause(); });

  loadProgress(); board=emptyBoard(); current=makePiece(); next=makePiece(); showOverlay("Нажми старт","Управление: ← → двигать, ↑ повернуть, ↓ ускорить, Space — падение, P — пауза."); updateUI(); draw();
})();
