const $ = (s) => document.querySelector(s);

const audio = $("#weddingAudio");
const intro = $("#intro");
const openInvitation = $("#openInvitation");
const main = $("#mainContent");
const musicBtn = $("#musicBtn");
const pauseBtn = $("#pauseScroll");
const progressBar = $("#progressBar");
const loader = $("#loader");

let autoScrollStarted = false;
let autoScrollPaused = false;
let raf = null;
let resumeTimer = null;
const SPEED = 50;

window.addEventListener("load", () => {
  setTimeout(() => loader?.classList.add("done"), 450);
});

// تشغيل الموسيقى يتم من نفس ضغطة المستخدم على زر فتح الدعوة،
// لذلك يعمل بشكل موثوق في Chrome/Safari/Android/iPhone قدر الإمكان.
function startMusic() {
  if (!audio) return;
  audio.volume = 0.55;
  audio.muted = false;

  const playPromise = audio.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise
      .then(() => musicBtn?.classList.remove("paused"))
      .catch(() => {
        // بعض المتصفحات قد تمنع التشغيل؛ الضغط على زر الموسيقى لاحقًا يعيد المحاولة.
        musicBtn?.classList.add("paused");
      });
  }
}

function scrollLoop() {
  let last = performance.now();

  const step = (now) => {
    if (!autoScrollStarted) {
      raf = null;
      return;
    }

    if (autoScrollPaused) {
      last = now;
      raf = requestAnimationFrame(step);
      return;
    }

    const dt = Math.min(now - last, 32);
    last = now;
    window.scrollBy(0, SPEED * dt / 1000);

    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) {
      autoScrollStarted = false;
      raf = null;
      pauseBtn?.classList.remove("visible");
      if (pauseBtn) pauseBtn.querySelector("span").textContent = "Ⅱ";
      return;
    }

    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
}

function startAutoScroll() {
  if (autoScrollStarted) return;
  autoScrollStarted = true;
  autoScrollPaused = false;
  pauseBtn?.classList.add("visible");
  setTimeout(() => {
    if (autoScrollStarted) scrollLoop();
  }, 700);
}

function pauseAutoScroll() {
  if (!autoScrollStarted) return;
  autoScrollPaused = true;
  if (pauseBtn) pauseBtn.querySelector("span").textContent = "▶";
  clearTimeout(resumeTimer);
  resumeTimer = setTimeout(resumeAutoScroll, 1800);
}

function resumeAutoScroll() {
  if (!autoScrollStarted) return;
  autoScrollPaused = false;
  if (pauseBtn) pauseBtn.querySelector("span").textContent = "Ⅱ";
  if (!raf) scrollLoop();
}

["wheel", "touchstart", "pointerdown", "keydown"].forEach((eventName) => {
  addEventListener(eventName, () => {
    if (autoScrollStarted) pauseAutoScroll();
  }, { passive: true });
});

pauseBtn?.addEventListener("click", () => {
  if (!autoScrollStarted) {
    startAutoScroll();
    return;
  }

  clearTimeout(resumeTimer);
  if (autoScrollPaused) {
    resumeAutoScroll();
  } else {
    autoScrollPaused = true;
    pauseBtn.querySelector("span").textContent = "▶";
  }
});

openInvitation?.addEventListener("click", () => {
  intro?.classList.add("closed");
  main?.classList.remove("hidden");
  musicBtn?.classList.add("visible");
  if (progressBar?.parentElement) progressBar.parentElement.style.opacity = "1";

  // مهم: تشغيل الصوت داخل تفاعل المستخدم نفسه.
  startMusic();

  setTimeout(() => {
    document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("visible"));
    startAutoScroll();
  }, 320);
});

musicBtn?.addEventListener("click", () => {
  if (!audio) return;
  if (audio.paused) {
    startMusic();
  } else {
    audio.pause();
    musicBtn.classList.add("paused");
  }
});

function updateProgress() {
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
}
addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress, { passive: true });

const weddingDate = new Date("2026-08-26T20:00:00+03:00").getTime();
function countdown() {
  const d = weddingDate - Date.now();
  if (d <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.textContent = "00";
    });
    return;
  }
  $("#days").textContent = String(Math.floor(d / 86400000)).padStart(2, "0");
  $("#hours").textContent = String(Math.floor(d / 3600000) % 24).padStart(2, "0");
  $("#minutes").textContent = String(Math.floor(d / 60000) % 60).padStart(2, "0");
  $("#seconds").textContent = String(Math.floor(d / 1000) % 60).padStart(2, "0");
}
countdown();
setInterval(countdown, 1000);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal, .reveal-section").forEach((el) => observer.observe(el));

const lightbox = $("#lightbox");
const lightboxImage = $("#lightboxImage");

document.querySelectorAll(".photo-card").forEach((card) => {
  card.addEventListener("click", () => {
    const src = card.dataset.img;
    if (!src || !lightboxImage) return;
    lightboxImage.src = src;
    lightbox?.classList.add("open");
    document.body.style.overflow = "hidden";
  });
});

function closeLightbox() {
  lightbox?.classList.remove("open");
  document.body.style.overflow = "";
}

$("#lightboxClose")?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

const modal = $("#rsvpModal");
function closeModal() {
  modal?.classList.remove("open");
  document.body.style.overflow = "";
}

$("#rsvpOpen")?.addEventListener("click", () => {
  modal?.classList.add("open");
  document.body.style.overflow = "hidden";
});
$("#modalClose")?.addEventListener("click", closeModal);
$("#modalBackdrop")?.addEventListener("click", closeModal);

document.querySelectorAll(".rsvp-options button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const response = btn.dataset.response;
    localStorage.setItem("salahYasmineRSVP", response);
    $("#confirmMessage").textContent = "تم تسجيل اختيارك على هذا الجهاز ♥";
    document.querySelectorAll(".rsvp-options button").forEach((b) => b.style.opacity = ".55");
    btn.style.opacity = "1";
  });
});

const saved = localStorage.getItem("salahYasmineRSVP");
if (saved && $("#confirmMessage")) {
  $("#confirmMessage").textContent = "اختيارك السابق: " + saved;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLightbox();
    closeModal();
  }
});
