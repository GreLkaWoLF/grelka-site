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
      if (dist < 130) {
        p.x += dx / 1100;
        p.y += dy / 1100;
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
