(() => {
  "use strict";

  const items = window.GRELKA_GALLERY || [];
  if (!items.length) return;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const stageImage = $("#stageImage");
  const stageTitle = $("#stageTitle");
  const stageDesc = $("#stageDesc");
  const stageTag = $("#stageTag");
  const stageCounter = $("#stageCounter");
  const progress = $("#galleryProgress");

  const filmTrack = $("#filmTrack");
  const filmViewport = $("#filmViewport");
  const album = $("#galleryAlbum");

  const lightbox = $("#galleryLightbox");
  const lightboxImg = $("#galleryLightboxImg");
  const lightboxTitle = $("#galleryLightboxTitle");
  const lightboxDesc = $("#galleryLightboxDesc");
  const lightboxCounter = $("#galleryLightboxCounter");

  let active = 0;
  let visible = items.map((_, index) => index);
  let isAnimating = false;

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function toast(message) {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove("show"), 2100);
  }

  function visiblePosition(index = active) {
    const position = visible.indexOf(index);
    return position >= 0 ? position : 0;
  }

  function createFilmstrip() {
    filmTrack.innerHTML = items.map((item, index) => `
      <button class="film-thumb${index === active ? " active" : ""}" data-gallery-pick="${index}" aria-label="Показать кадр: ${item.title}">
        <img src="${item.thumb}" alt="${item.title} — миниатюра" loading="lazy" />
        <span>${pad(index + 1)}</span>
      </button>
    `).join("");
  }

  function createAlbum() {
    album.innerHTML = items.map((item, index) => `
      <button class="clean-album-card" data-gallery-pick="${index}" data-category="${item.category}" style="--delay:${index * 35}ms">
        <span class="clean-album-image">
          <img src="${item.thumb}" alt="${item.title} — GreLka" loading="lazy" />
        </span>
        <span class="clean-album-caption">
          <em>${item.tag}</em>
          <strong>${item.title}</strong>
        </span>
      </button>
    `).join("");
  }

  function updateActiveClasses() {
    $$("[data-gallery-pick]").forEach((node) => {
      node.classList.toggle("active", Number(node.dataset.galleryPick) === active);
    });
  }

  function scrollThumbIntoView() {
    const thumb = $(`.film-thumb[data-gallery-pick="${active}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function setStageContent(index) {
    const item = items[index];
    const position = visiblePosition(index);

    stageImage.src = item.full;
    stageImage.alt = `${item.title} — GreLka`;
    stageTitle.textContent = item.title;
    stageDesc.textContent = item.desc;
    stageTag.textContent = item.tag;
    stageCounter.textContent = `${pad(position + 1)} / ${pad(visible.length)}`;
    progress.style.width = `${((position + 1) / visible.length) * 100}%`;
  }

  async function setActive(index, direction = 1) {
    if (isAnimating || !items[index]) return;

    const oldIndex = active;
    active = index;
    updateActiveClasses();

    if (oldIndex === index) {
      setStageContent(index);
      scrollThumbIntoView();
      return;
    }

    isAnimating = true;
    const outX = direction >= 0 ? -34 : 34;
    const inX = direction >= 0 ? 42 : -42;

    const out = stageImage.animate([
      { opacity: 1, transform: "translateX(0) scale(1)", filter: "blur(0px) brightness(1)" },
      { opacity: 0, transform: `translateX(${outX}px) scale(.985)`, filter: "blur(8px) brightness(.75)" }
    ], {
      duration: 220,
      easing: "cubic-bezier(.2,.8,.2,1)",
      fill: "forwards"
    });

    $(".clean-stage-card")?.animate([
      { boxShadow: "0 34px 110px rgba(0,0,0,.48), 0 0 0 rgba(30,155,255,0)" },
      { boxShadow: "0 34px 110px rgba(0,0,0,.48), 0 0 56px rgba(30,155,255,.24)" },
      { boxShadow: "0 34px 110px rgba(0,0,0,.48), 0 0 0 rgba(30,155,255,0)" }
    ], { duration: 520, easing: "ease-out" });

    await out.finished.catch(() => {});

    setStageContent(index);

    stageTitle.animate([
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" });

    stageDesc.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 340, easing: "ease-out" });

    await stageImage.animate([
      { opacity: 0, transform: `translateX(${inX}px) scale(1.018)`, filter: "blur(8px) brightness(1.14)" },
      { opacity: 1, transform: "translateX(0) scale(1)", filter: "blur(0px) brightness(1)" }
    ], {
      duration: 420,
      easing: "cubic-bezier(.16,1,.3,1)",
      fill: "forwards"
    }).finished.catch(() => {});

    isAnimating = false;
    scrollThumbIntoView();
  }

  function move(step) {
    const position = visiblePosition();
    const nextPosition = (position + step + visible.length) % visible.length;
    setActive(visible[nextPosition], step);
  }

  function openLightbox(index = active) {
    const item = items[index];
    if (!item) return;

    active = index;
    const position = visiblePosition(index);

    lightboxImg.src = item.full;
    lightboxImg.alt = `${item.title} — GreLka`;
    lightboxTitle.textContent = item.title;
    lightboxDesc.textContent = item.desc;
    lightboxCounter.textContent = `${pad(position + 1)} / ${pad(visible.length)}`;

    lightbox.classList.add("show");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    lightboxImg.animate([
      { opacity: 0, transform: "scale(.975) translateY(12px)", filter: "blur(6px)" },
      { opacity: 1, transform: "scale(1) translateY(0)", filter: "blur(0px)" }
    ], { duration: 360, easing: "cubic-bezier(.16,1,.3,1)" });
  }

  function closeLightbox() {
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function moveLightbox(step) {
    const position = visiblePosition();
    const nextPosition = (position + step + visible.length) % visible.length;
    active = visible[nextPosition];

    const item = items[active];
    const x = step > 0 ? -34 : 34;

    lightboxImg.animate([
      { opacity: 1, transform: "translateX(0) scale(1)", filter: "blur(0px)" },
      { opacity: 0, transform: `translateX(${x}px) scale(.985)`, filter: "blur(6px)" }
    ], { duration: 170, easing: "ease-in", fill: "forwards" }).finished.catch(() => {}).then(() => {
      lightboxImg.src = item.full;
      lightboxImg.alt = `${item.title} — GreLka`;
      lightboxTitle.textContent = item.title;
      lightboxDesc.textContent = item.desc;
      lightboxCounter.textContent = `${pad(nextPosition + 1)} / ${pad(visible.length)}`;
      setStageContent(active);
      updateActiveClasses();
      scrollThumbIntoView();

      lightboxImg.animate([
        { opacity: 0, transform: `translateX(${-x}px) scale(1.012)`, filter: "blur(6px)" },
        { opacity: 1, transform: "translateX(0) scale(1)", filter: "blur(0px)" }
      ], { duration: 290, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
    });
  }

  function applyFilter(filter) {
    visible = [];

    $$(".clean-album-card").forEach((card, index) => {
      const show = filter === "all" || items[index].category === filter;
      card.classList.toggle("hidden", !show);
      if (show) visible.push(index);
    });

    $$(".film-thumb").forEach((thumb, index) => {
      const show = filter === "all" || items[index].category === filter;
      thumb.classList.toggle("hidden", !show);
    });

    if (!visible.length) visible = items.map((_, index) => index);

    const next = visible.includes(active) ? active : visible[0];
    setActive(next, 1);

    const label = filter === "all" ? "Все кадры" : items.find((item) => item.category === filter)?.filter || "Фильтр";
    toast(`Фильтр: ${label}`);
  }

  createFilmstrip();
  createAlbum();

  filmTrack.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-pick]");
    if (!button) return;
    const next = Number(button.dataset.galleryPick);
    setActive(next, next >= active ? 1 : -1);
  });

  album.addEventListener("click", (event) => {
    const card = event.target.closest("[data-gallery-pick]");
    if (!card) return;
    const next = Number(card.dataset.galleryPick);
    setActive(next, next >= active ? 1 : -1);
    openLightbox(next);
  });

  album.addEventListener("pointermove", (event) => {
    const card = event.target.closest(".clean-album-card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });

  $$(".clean-filter").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".clean-filter").forEach((node) => node.classList.remove("active"));
      button.classList.add("active");
      applyFilter(button.dataset.filter);
    });
  });

  $("#stagePrev")?.addEventListener("click", () => move(-1));
  $("#stageNext")?.addEventListener("click", () => move(1));
  $("#filmPrev")?.addEventListener("click", () => filmViewport.scrollBy({ left: -360, behavior: "smooth" }));
  $("#filmNext")?.addEventListener("click", () => filmViewport.scrollBy({ left: 360, behavior: "smooth" }));

  $("#openStageLightbox")?.addEventListener("click", () => openLightbox(active));

  $(".clean-stage")?.addEventListener("click", (event) => {
    if (event.target.closest(".clean-arrow")) return;
    openLightbox(active);
  });

  $("#galleryToTop")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("#shuffleGallery")?.addEventListener("click", () => {
    if (visible.length < 2) return;
    let next = active;
    while (next === active) {
      next = visible[Math.floor(Math.random() * visible.length)];
    }
    setActive(next, next > active ? 1 : -1);
  });

  $("#galleryLightboxClose")?.addEventListener("click", closeLightbox);
  $("#galleryLightboxPrev")?.addEventListener("click", () => moveLightbox(-1));
  $("#galleryLightboxNext")?.addEventListener("click", () => moveLightbox(1));

  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    const opened = lightbox?.classList.contains("show");
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") opened ? moveLightbox(-1) : move(-1);
    if (event.key === "ArrowRight") opened ? moveLightbox(1) : move(1);
  });

  let touchStart = 0;
  $(".clean-stage")?.addEventListener("touchstart", (event) => {
    touchStart = event.touches[0].clientX;
  }, { passive: true });

  $(".clean-stage")?.addEventListener("touchend", (event) => {
    const diff = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 46) move(diff < 0 ? 1 : -1);
  }, { passive: true });

  setStageContent(0);
  updateActiveClasses();
})();
