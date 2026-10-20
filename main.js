/* Las Palmeras — interacciones (IIFE, sin módulos) */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function initSplash() {
    var splash = document.querySelector("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 500);
    else window.addEventListener("load", function () { setTimeout(hide, 350); });
    setTimeout(hide, 3500);
  }

  function initNav() {
    var nav = document.querySelector("[data-nav]");
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle("is-solid", window.scrollY > 30); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = nav.querySelector(".nav-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      nav.querySelectorAll(".nav-links a").forEach(function (a) {
        a.addEventListener("click", function () {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  function initReveals() {
    var els = document.querySelectorAll(".reveal:not([data-split])");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  function initHeroParallax() {
    var bg = document.querySelector("[data-parallax]");
    if (!bg) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        bg.style.transform = "scale(1.06) translate3d(0," + (y * 0.18).toFixed(1) + "px,0)";
        ticking = false;
      });
    }, { passive: true });
  }

  /* Inicio: carrusel "De nuestra cocina" — flechas + avance automático */
  function initCarousel() {
    var root = document.querySelector("[data-carousel]");
    if (!root || root.dataset.bound) return;
    root.dataset.bound = "1";
    var track = root.querySelector("[data-carousel-track]");
    var bar = root.querySelector("[data-carousel-bar]");
    var prev = document.querySelector("[data-carousel-prev]");
    var next = document.querySelector("[data-carousel-next]");
    var INTERVAL = 3200;   // ms entre pasos automáticos
    var IDLE = 7000;       // ms de pausa tras tocarlo el usuario
    var timer = null, resumeAt = 0, inView = false;

    var step = function () {
      var item = track.querySelector(".taste-item");
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    };
    var maxScroll = function () { return track.scrollWidth - track.clientWidth; };
    var go = function (dir) {
      var max = maxScroll();
      if (dir > 0 && track.scrollLeft >= max - 4) track.scrollTo({ left: 0, behavior: "smooth" });
      else if (dir < 0 && track.scrollLeft <= 4) track.scrollTo({ left: max, behavior: "smooth" });
      else track.scrollBy({ left: dir * step(), behavior: "smooth" });
    };
    var userTouched = function () { resumeAt = Date.now() + IDLE; };

    var updateBar = function () {
      var max = maxScroll();
      var visible = track.clientWidth / track.scrollWidth;
      var frac = max > 0 ? track.scrollLeft / max : 0;
      if (bar) {
        bar.style.width = (visible * 100).toFixed(2) + "%";
        bar.style.transform = "translateX(" + (frac * (1 - visible) / visible * 100).toFixed(2) + "%)";
      }
      root.classList.toggle("is-scrolled", track.scrollLeft > 4);
    };

    if (prev) prev.addEventListener("click", function () { userTouched(); go(-1); });
    if (next) next.addEventListener("click", function () { userTouched(); go(1); });
    ["pointerdown", "touchstart", "wheel"].forEach(function (ev) {
      track.addEventListener(ev, userTouched, { passive: true });
    });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); userTouched(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); userTouched(); go(-1); }
    });
    track.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0.01 }).observe(root);
    } else inView = true;

    timer = setInterval(function () {
      if (!inView || document.hidden || Date.now() < resumeAt) return;
      go(1);
    }, INTERVAL);
    updateBar();
  }

  /* Carta: pestaña activa según la sección visible */
  function initMenuSpy() {
    var tabs = document.querySelectorAll("[data-menu-tabs] a");
    if (!tabs.length) return;
    var map = {};
    tabs.forEach(function (t) { map[t.getAttribute("href").slice(1)] = t; });
    var setActive = function (id) {
      tabs.forEach(function (t) { t.classList.remove("is-active"); });
      var tab = map[id];
      if (!tab) return;
      tab.classList.add("is-active");
      var bar = tab.parentElement;
      var left = tab.offsetLeft - bar.clientWidth / 2 + tab.clientWidth / 2;
      bar.scrollTo({ left: left, behavior: "smooth" });
    };
    var sections = document.querySelectorAll(".menu-section[id]");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: "-35% 0px -60% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* Carta: filtro de alérgenos */
  function initAllergens() {
    var chips = document.querySelectorAll("[data-allergen]");
    if (!chips.length) return;
    var note = document.querySelector("[data-allergen-note]");
    var dishes = document.querySelectorAll(".dish");
    var active = {};
    var update = function () {
      var keys = Object.keys(active).filter(function (k) { return active[k]; });
      var hidden = 0;
      dishes.forEach(function (d) {
        var tags = (d.getAttribute("data-a") || "").split(" ");
        var excluded = keys.some(function (k) { return tags.indexOf(k) !== -1; });
        d.classList.toggle("is-excluded", excluded);
        if (excluded) hidden++;
      });
      if (note) {
        note.textContent = keys.length
          ? hidden + " platos contienen los alérgenos marcados y aparecen tachados."
          : "Marca un alérgeno para señalar los platos que lo contienen.";
      }
    };
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var k = c.getAttribute("data-allergen");
        active[k] = !active[k];
        c.setAttribute("aria-pressed", active[k] ? "true" : "false");
        update();
      });
    });
  }

  /* Promociones: tilt suave + lightbox */
  function initTilt() {
    if (matchMedia("(hover: none)").matches) return;
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(1100px) rotateY(" + (x * 6).toFixed(2) + "deg) rotateX(" + (-y * 6).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseout", function (e) {
        if (!card.contains(e.relatedTarget)) card.style.transform = "";
      });
    });
  }

  function initLightbox() {
    var dlg = document.querySelector("[data-lightbox]");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var img = dlg.querySelector("img");
    document.querySelectorAll("[data-zoom]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.querySelector("img");
        img.src = src.currentSrc || src.src;
        img.alt = src.alt;
        dlg.showModal();
      });
    });
    dlg.querySelector("button").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }

  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initHeroParallax, "initHeroParallax");
    safe(initCarousel, "initCarousel");
    safe(initMenuSpy, "initMenuSpy");
    safe(initAllergens, "initAllergens");
    safe(initTilt, "initTilt");
    safe(initLightbox, "initLightbox");
    safe(initYear, "initYear");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
