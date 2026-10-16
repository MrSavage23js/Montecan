/* =========================================================
   MONTECAN · Hike & Hound — interacciones y animaciones
   ========================================================= */

// WhatsApp de Montecan (formato internacional, sin + ni espacios)
const WHATSAPP = "525559028396";
// API key de CallMeBot para avisos automáticos (vacía = abrir WhatsApp del cliente)
const CALLMEBOT_KEY = "";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

$("#year").textContent = new Date().getFullYear();

/* ---------- Formulario → WhatsApp ---------- */
$("#reserva-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const f = new FormData(form);

  if (!CALLMEBOT_KEY) {
    const msg =
      `¡Hola Montecan! 🐾\n` +
      `Soy ${f.get("nombre")}.\n` +
      `Mi perro: ${f.get("perro")}\n` +
      `Me interesa: ${f.get("servicio")}` +
      (f.get("mensaje") ? `\n\n${f.get("mensaje")}` : "");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    return;
  }

  const aviso =
    `🐾 Nueva reserva Montecan\n` +
    `Nombre: ${f.get("nombre")}\n` +
    `Perro: ${f.get("perro")}\n` +
    `Servicio: ${f.get("servicio")}` +
    (f.get("mensaje") ? `\nNotas: ${f.get("mensaje")}` : "");
  const btn = $("button[type=submit] span", form);
  const original = btn.textContent;
  form.querySelector("button").disabled = true;
  btn.textContent = "Enviando…";
  try {
    // CallMeBot no manda cabeceras CORS: la petición sale igual, solo no podemos leer la respuesta
    await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP}&apikey=${CALLMEBOT_KEY}&text=${encodeURIComponent(aviso)}`,
      { mode: "no-cors" }
    );
    form.reset();
    btn.textContent = "¡Listo! Te contactamos pronto 🐾";
  } catch {
    btn.textContent = "No se pudo enviar, escríbenos por WhatsApp";
  }
  setTimeout(() => {
    btn.textContent = original;
    form.querySelector("button").disabled = false;
  }, 5000);
});

/* ---------- Menú móvil ---------- */
const burger = $(".nav__burger");
const toggleMenu = (open) => {
  document.body.classList.toggle("menu-open", open);
  burger.setAttribute("aria-expanded", open);
  $(".menu").setAttribute("aria-hidden", !open);
};
burger.addEventListener("click", () => toggleMenu(!document.body.classList.contains("menu-open")));
$$(".menu a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

/* ---------- Sin GSAP: mostrar todo y salir ---------- */
if (!window.gsap || !window.ScrollTrigger) {
  document.documentElement.classList.remove("js");
  $(".loader").remove();
  document.body.classList.remove("is-loading");
  throw new Error("GSAP no disponible — modo estático");
}

gsap.registerPlugin(ScrollTrigger);

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (window.Lenis && !reduceMotion) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: 0, duration: 1.6 }) : target.scrollIntoView({ behavior: "smooth" });
  })
);

/* ---------- Utilidades ---------- */
// Divide un título en palabras con máscara, conservando los <span class="hand"> y los <br>
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(document.createTextNode(" "));
          const outer = document.createElement("span");
          outer.className = "line";
          outer.style.display = "inline-block";
          const inner = document.createElement("span");
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BR") {
        walk(child);
      }
    });
  };
  walk(el);
  return $$(".line > span", el);
}

// Prepara los paths de un isotipo para “dibujarse”
function prepDraw(svgWrap) {
  const paths = $$("path", svgWrap);
  paths.forEach((p) => {
    const len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  return paths;
}

/* ---------- Preloader ---------- */
const loaderPaths = prepDraw($(".loader__iso"));
const counter = { v: 0 };
const intro = gsap.timeline({ defaults: { ease: "power3.inOut" } });

intro
  .to(loaderPaths, { strokeDashoffset: 0, duration: 1.8, stagger: 0.04 }, 0)
  .to(counter, {
    v: 100, duration: 2, ease: "power2.inOut",
    onUpdate: () => ($(".loader__count span").textContent = Math.round(counter.v)),
  }, 0)
  .to(loaderPaths, { fillOpacity: 1, duration: 0.5 }, 1.6)
  .to(".loader__iso", { scale: 0.9, opacity: 0, duration: 0.6 }, 2.3)
  .to(".loader__count", { yPercent: 100, opacity: 0, duration: 0.5 }, 2.3)
  .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, 2.5)
  .add(() => {
    $(".loader").remove();
    document.body.classList.remove("is-loading");
    lenis && lenis.start();
  });

/* ---------- Hero ---------- */
const heroLead = splitWords($(".hero__lead"));
gsap.set(".hero__wordmark path", { yPercent: 120, opacity: 0 });
gsap.set([".hero__eyebrow", ".hero__sub", ".hero__actions", ".nav"], { opacity: 0, y: 30 });
gsap.set(heroLead, { yPercent: 110 });
gsap.set(".hero__img", { scale: 1.25 });

intro
  .to(".hero__img", { scale: 1, duration: 2.2, ease: "expo.out" }, 2.6)
  .to(".hero__wordmark path", { yPercent: 0, opacity: 1, duration: 1.3, stagger: 0.06, ease: "expo.out" }, 2.8)
  .to(".hero__eyebrow", { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 3.0)
  .to(".hero__sub", { opacity: 0.9, y: 0, duration: 1, ease: "expo.out" }, 3.2)
  .to(heroLead, { yPercent: 0, duration: 1, stagger: 0.015, ease: "expo.out" }, 3.3)
  .to(".hero__actions", { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 3.5)
  .to(".nav", { opacity: 1, y: 0, duration: 1, ease: "expo.out" }, 3.5);

gsap.to(".hero__img", {
  yPercent: 12, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
});
gsap.to(".hero__content", {
  yPercent: -18, opacity: 0.2, ease: "none",
  scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
});

/* ---------- Nav: aparece/oculta según dirección ---------- */
const nav = $(".nav");
ScrollTrigger.create({
  start: "top -80",
  onUpdate: (self) => {
    nav.classList.toggle("is-scrolled", self.scroll() > window.innerHeight * 0.85);
    nav.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 400 && !document.body.classList.contains("menu-open"));
  },
});

/* ---------- Títulos por palabras ---------- */
$$(".title.split").forEach((t) => {
  const words = splitWords(t);
  gsap.from(words, {
    yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.05, ease: "expo.out",
    scrollTrigger: { trigger: t, start: "top 85%" },
  });
});

/* ---------- Revelados genéricos ---------- */
$$(".reveal, .section-head .body, .eyebrow:not(.hero__eyebrow)").forEach((el) =>
  gsap.from(el, {
    y: 40, opacity: 0, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: el, start: "top 90%" },
  })
);

$$(".img-reveal").forEach((fig) => {
  const img = $("img", fig);
  gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 85%" } })
    .to(fig, { clipPath: "inset(0% 0 0 0)", duration: 1.5, ease: "expo.inOut" })
    .from(img, { scale: 1.35, duration: 1.8, ease: "expo.out" }, 0.1);
});

/* ---------- Isotipos que se dibujan con el scroll ---------- */
$$("[data-scroll-draw]").forEach((wrap) => {
  const paths = prepDraw(wrap);
  gsap.timeline({
    scrollTrigger: { trigger: wrap, start: "top 80%", end: "center 45%", scrub: 1 },
  })
    .to(paths, { strokeDashoffset: 0, stagger: 0.02, ease: "none" })
    .to(paths, { fillOpacity: 1, ease: "none", duration: 0.3 });
});

/* ---------- Valores: parallax de imágenes ---------- */
$$(".value-card__img img").forEach((img) =>
  gsap.fromTo(img, { yPercent: -10 }, {
    yPercent: 0, ease: "none",
    scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
  })
);
$$(".value-card__body").forEach((b) =>
  gsap.from(b.children, {
    y: 30, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out",
    scrollTrigger: { trigger: b, start: "top 88%" },
  })
);

/* ---------- Servicios: filas + preview que sigue al mouse ---------- */
gsap.from(".service", {
  y: 50, opacity: 0, stagger: 0.1, duration: 1.1, ease: "expo.out",
  scrollTrigger: { trigger: ".service-list", start: "top 80%" },
});

if (finePointer) {
  const preview = $(".service-preview");
  const previewImg = $("img", preview);
  const px = gsap.quickTo(preview, "x", { duration: 0.6, ease: "power3" });
  const py = gsap.quickTo(preview, "y", { duration: 0.6, ease: "power3" });
  window.addEventListener("mousemove", (e) => { px(e.clientX); py(e.clientY); });

  $$(".service").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      previewImg.src = row.dataset.img;
      gsap.to(preview, { opacity: 1, scale: 1, rotate: gsap.utils.random(-6, 6), duration: 0.5, ease: "expo.out" });
    });
    row.addEventListener("mouseleave", () => gsap.to(preview, { opacity: 0, scale: 0.6, duration: 0.4, ease: "power3.in" }));
  });
}

/* ---------- Un día: scroll horizontal (solo escritorio) ---------- */
const mm = gsap.matchMedia();
mm.add("(min-width: 861px)", () => {
  const track = $(".day__track");
  const distance = () => track.scrollWidth - (window.innerWidth - track.getBoundingClientRect().left) + 40;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".day", start: "top top", end: () => "+=" + distance(),
      pin: ".day__pin", scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
  tl.to(track, { x: () => -distance(), ease: "none" }, 0)
    .to(".day__progress span", { scaleX: 1, ease: "none" }, 0);
  $$(".day-card img").forEach((img) =>
    gsap.fromTo(img, { scale: 1.25 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: img, containerAnimation: tl, start: "left right", end: "right left", scrub: true },
    })
  );
});

/* ---------- Contadores ---------- */
$$("[data-count]").forEach((el) => {
  const obj = { v: 0 };
  gsap.to(obj, {
    v: +el.dataset.count, duration: 2.2, ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 88%" },
    onUpdate: () => (el.textContent = Math.round(obj.v)),
  });
});

/* ---------- Galería con velocidades distintas ---------- */
$$(".g[data-speed]").forEach((g) =>
  gsap.fromTo(g, { y: () => -g.dataset.speed * window.innerHeight }, {
    y: () => g.dataset.speed * window.innerHeight, ease: "none",
    scrollTrigger: { trigger: ".gallery__grid", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
  })
);

/* ---------- FAQ: abrir/cerrar animado ---------- */
$$(".faq__item").forEach((d) => {
  const summary = $("summary", d);
  const body = $(".faq__answer", d);
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (d.open) {
      gsap.to(body, { height: 0, opacity: 0, duration: 0.5, ease: "power3.inOut", onComplete: () => (d.open = false) });
    } else {
      d.open = true;
      gsap.fromTo(body, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: 0.6, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
    }
  });
});

/* ---------- CTA ---------- */
gsap.fromTo(".cta__bg img", { yPercent: -10 }, {
  yPercent: 5, ease: "none",
  scrollTrigger: { trigger: ".cta", start: "top bottom", end: "bottom top", scrub: true },
});
gsap.from(".form .field, .form .btn", {
  y: 30, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out",
  scrollTrigger: { trigger: ".form", start: "top 85%" },
});

/* ---------- Footer: logo gigante letra por letra ---------- */
gsap.from(".footer__logo path", {
  yPercent: 100, opacity: 0, stagger: 0.04, duration: 1.2, ease: "expo.out",
  scrollTrigger: { trigger: ".footer__logo", start: "top 95%" },
});

/* ---------- Cursor personalizado ---------- */
if (finePointer) {
  const cursor = $(".cursor");
  const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
  const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
  window.addEventListener("mousemove", (e) => { cx(e.clientX); cy(e.clientY); cursor.style.opacity = 1; });
  document.addEventListener("mouseleave", () => (cursor.style.opacity = 0));
  $$("[data-cursor], .g, .day-card").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      $(".cursor__label").textContent = el.dataset.cursor || "Ver";
      cursor.classList.add("is-big");
    });
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-big"));
  });

  /* Botones magnéticos */
  $$(".magnetic").forEach((btn) => {
    const mx = gsap.quickTo(btn, "x", { duration: 0.6, ease: "elastic.out(1, .4)" });
    const my = gsap.quickTo(btn, "y", { duration: 0.6, ease: "elastic.out(1, .4)" });
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.4);
    });
    btn.addEventListener("mouseleave", () => { mx(0); my(0); });
  });
}

window.addEventListener("load", () => ScrollTrigger.refresh());
