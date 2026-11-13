(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  /* ------------------------------------------------------------------------
     Header, scroll progress and active navigation
     ------------------------------------------------------------------------ */

  const header = $("#header");
  const progressBar = $("#progressBar");
  let scrollTicking = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    if (header) {
      header.classList.toggle("is-scrolled", scrollTop > 12);
    }

    if (progressBar) {
      const progress = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollUI);
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollUI();

  const navToggle = $(".nav-toggle");

  const closeNav = () => {
    if (!header) return;
    header.classList.remove("nav-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "打开菜单");
    }
  };

  if (navToggle && header) {
    navToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "关闭菜单" : "打开菜单");
    });

    $$(".site-nav a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !header.classList.contains("nav-open")) return;
      if (!header.contains(target)) closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  if ("IntersectionObserver" in window) {
    const navLinks = new Map(
      $$(".site-nav a")
        .map((link) => [link.getAttribute("href")?.replace("#", ""), link])
        .filter(([id]) => id)
    );
    const sections = $$("main section[id]");

    if (sections.length && navLinks.size) {
      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((link) => link.classList.remove("is-active"));
            navLinks.get(entry.target.id)?.classList.add("is-active");
          });
        },
        { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
      );

      sections.forEach((section) => navObserver.observe(section));
    }
  }

  /* ------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------ */

  const revealElements = $$(".reveal");

  if (!("IntersectionObserver" in window) || reduceMotion.matches) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  /* ------------------------------------------------------------------------
     Lollipop inventory
     ------------------------------------------------------------------------ */

  const STORAGE_KEY = "ggbond-lollipops-v1";
  const counters = $$("[data-count]");
  const stockLabels = $$("[data-stock]");
  let count = 0;

  try {
    const saved = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    if (Number.isFinite(saved) && saved > 0) count = saved;
  } catch {
    /* localStorage can be unavailable in private mode — the site still works. */
  }

  const formatCount = (value) =>
    value < 1000 ? String(value).padStart(3, "0") : new Intl.NumberFormat("zh-CN").format(value);

  const stockLabel = (value) => {
    if (value === 0) return "告急";
    if (value < 10) return "偏紧";
    if (value < 50) return "充足";
    return "溢出";
  };

  const renderFeed = () => {
    counters.forEach((element) => {
      element.textContent = formatCount(count);
    });
    stockLabels.forEach((element) => {
      element.textContent = stockLabel(count);
    });
    $$("[data-feed]").forEach((button) => {
      button.setAttribute("aria-label", `投喂棒棒糖，当前已投喂 ${count} 根`);
    });
  };

  renderFeed();

  const toast = $("#toast");
  let toastTimer = 0;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  };

  const spawnSweet = (button) => {
    if (reduceMotion.matches) return;

    const rect = button.getBoundingClientRect();
    const sweet = document.createElement("span");
    sweet.className = "sweet-pop";
    sweet.textContent = "🍭";
    sweet.setAttribute("aria-hidden", "true");
    sweet.style.left = `${rect.left + rect.width / 2}px`;
    sweet.style.top = `${rect.top + rect.height / 2}px`;
    sweet.style.setProperty("--drift", `${(Math.random() * 2 - 1) * 90}px`);

    document.body.appendChild(sweet);
    sweet.addEventListener("animationend", () => sweet.remove(), { once: true });
  };

  const ordinaryMessages = [
    "糖分 +1，战斗力暂时 +5%。",
    "已收到。世界安全了一点。",
    "这根不错，再来一根？",
    "检测到糖分超标，但英雄说没关系。",
    "投喂成功，反派已被甜到。",
    "谢谢老板，祝你今天不加班。",
    "库存更新。英雄心情：很好。"
  ];

  const milestoneMessages = {
    1: "第一根！合作愉快，世界有救了。",
    10: "十根了。今天的世界，稳了。",
    25: "库存健康，可以挑战一个中等规模的反派。",
    50: "五十根。五灵王看了都想跟你合作。",
    100: "童话世界年度最佳投喂官，就是你。"
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const feedButton = target.closest("[data-feed]");
    if (feedButton) {
      count += 1;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(count));
      } catch {
        /* Ignore storage failures. */
      }
      renderFeed();
      spawnSweet(feedButton);
      showToast(
        milestoneMessages[count] ||
          ordinaryMessages[Math.floor(Math.random() * ordinaryMessages.length)]
      );
      return;
    }

    const printButton = target.closest("[data-print]");
    if (printButton) {
      window.print();
    }
  });

  /* ------------------------------------------------------------------------
     Cursor glow + a very small portrait tilt
     ------------------------------------------------------------------------ */

  if (finePointer.matches && !reduceMotion.matches) {
    let glowFrame = 0;
    let pointerX = window.innerWidth * 0.7;
    let pointerY = window.innerHeight * 0.2;

    document.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (glowFrame) return;
        glowFrame = window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--mx", `${pointerX}px`);
          document.documentElement.style.setProperty("--my", `${pointerY}px`);
          glowFrame = 0;
        });
      },
      { passive: true }
    );

    const art = $(".hero-art");
    const portrait = $(".portrait");

    if (art && portrait) {
      art.addEventListener(
        "pointermove",
        (event) => {
          const rect = art.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;

          portrait.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
          portrait.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
        },
        { passive: true }
      );

      art.addEventListener("pointerleave", () => {
        portrait.style.setProperty("--rx", "0deg");
        portrait.style.setProperty("--ry", "0deg");
      });
    }
  }

  /* ------------------------------------------------------------------------
     Tiny housekeeping
     ------------------------------------------------------------------------ */

  $$("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
})();
