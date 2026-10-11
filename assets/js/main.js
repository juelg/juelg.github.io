// Small progressive enhancements; the page is fully usable without JS.
(function () {
  const root = document.documentElement;

  // ---- Theme toggle (persisted per visitor) ----
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // ---- Nav border on scroll ----
  const nav = document.querySelector(".nav");
  const onScroll = () => nav && nav.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Paper filters ----
  const filters = document.querySelectorAll(".filter");
  const papers = document.querySelectorAll(".paper");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      papers.forEach((p) => {
        const tags = (p.dataset.tags || "").split(" ");
        p.classList.toggle("is-hidden", f !== "all" && !tags.includes(f));
      });
    });
  });

  // ---- Media galleries: thumbnails swap the main media ----
  document.querySelectorAll(".paper-media, .sw-media").forEach((media) => {
    const main = media.querySelector(".media-main");
    const thumbs = media.querySelectorAll(".media-thumb");
    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        main.dataset.manual = "1"; // user took over: stop the automatic figure -> video switch
        clearTimeout(main._stageTimer);
        thumbs.forEach((t) => t.classList.toggle("is-active", t === thumb));
        const { src, type, alt, fit, poster, controls } = thumb.dataset;
        main.className = "media-main" + (fit ? " " + fit : "");
        let el;
        if (type === "video") {
          el = document.createElement("video");
          if (controls) {
            // Narrated video: user starts it, with sound and controls.
            Object.assign(el, { src, controls: true, playsInline: true });
          } else {
            Object.assign(el, { src, autoplay: true, muted: true, loop: true, playsInline: true });
            el.setAttribute("muted", "");
          }
          el.setAttribute("playsinline", "");
          if (poster) el.poster = poster;
        } else if (type === "youtube") {
          el = document.createElement("iframe");
          el.src = `https://www.youtube-nocookie.com/embed/${src}?autoplay=1&mute=1&rel=0`;
          el.allow = "autoplay; encrypted-media; picture-in-picture";
          el.allowFullscreen = true;
          el.title = alt || "Video";
          Object.assign(el.style, { position: "absolute", inset: "0", width: "100%", height: "100%", border: "0" });
        } else {
          el = document.createElement("img");
          el.src = src;
          el.alt = alt || "";
        }
        main.replaceChildren(el);
      });
    });
  });

  // ---- Lazy videos: load when near the viewport, play only while visible ----
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) {
        if (v.dataset.src && !v.getAttribute("src")) v.src = v.dataset.src;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { rootMargin: "200px 0px", threshold: 0.01 });
  const observeVideos = () => document.querySelectorAll("video[data-src], video[autoplay]:not([controls])").forEach((v) => {
    if (!v.dataset.observed) { v.dataset.observed = "1"; videoObserver.observe(v); }
  });
  observeVideos();
  new MutationObserver(observeVideos).observe(document.body, { childList: true, subtree: true });

  // ---- Staged media: show the paper figure first; once the card has been in view
  //      for a moment, fade over to the video. ----
  const STAGE_DELAY = 2200; // ms
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stageObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const main = e.target;
      const video = main.querySelector(".stage-video");
      if (!video || main.dataset.manual) return;
      if (e.isIntersecting) {
        if (main.classList.contains("is-video")) { if (video.play) video.play().catch(() => {}); return; }
        const isImg = video.tagName === "IMG"; // animated WebP/GIF instead of a <video>
        if (!video.getAttribute("src")) { video.src = video.dataset.stageSrc; if (!isImg) video.load(); }
        if (reducedMotion) return; // keep the figure; videos stay one click away
        main.style.setProperty("--stage-delay", STAGE_DELAY + "ms");
        main.classList.add("is-counting");
        main._stageTimer = setTimeout(() => {
          const show = () => {
            main.classList.add("is-video");
            if (!isImg) video.play().catch(() => {});
            // keep a thumbnail strip (if any) in sync
            const media = main.closest(".paper-media");
            media && media.querySelectorAll(".media-thumb").forEach((t) =>
              t.classList.toggle("is-active", t.dataset.src === video.dataset.stageSrc));
          };
          const ready = isImg ? video.complete && video.naturalWidth > 0 : video.readyState >= 2;
          ready ? show() : video.addEventListener(isImg ? "load" : "loadeddata", show, { once: true });
        }, STAGE_DELAY);
      } else {
        clearTimeout(main._stageTimer);
        main.classList.remove("is-counting");
        if (video.pause) video.pause();
      }
    });
  }, { threshold: 0.55 });
  document.querySelectorAll(".media-main.staged").forEach((m) => stageObserver.observe(m));

  // ---- BibTeX toggle + copy ----
  document.querySelectorAll("[data-bibtex]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = document.getElementById(btn.dataset.bibtex);
      const open = box.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.parentElement.querySelector("pre").innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied!";
      } catch (e) {
        btn.textContent = "Press Ctrl+C";
      }
      setTimeout(() => (btn.textContent = "Copy"), 1600);
    });
  });

  // ---- Reveal on scroll ----
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

  // ---- Footer year ----
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
