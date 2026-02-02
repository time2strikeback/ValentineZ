const zone = document.getElementById("zone");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const result = document.getElementById("result");
const noResult = document.getElementById("noResult");
const hint = document.getElementById("hint");

const DEFAULT_NAME = "Aleena"; // change this default if you want
const VALENTINE_OF = "Linto";

function sanitizeName(value) {
  if (!value) return "";
  const cleaned = String(value)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 32);
}

function getNameFromUrl() {
  try {
    const raw = new URLSearchParams(window.location.search).get("name");
    return sanitizeName(raw);
  } catch {
    return "";
  }
}

const NAME = getNameFromUrl() || DEFAULT_NAME;

const questionEl = document.getElementById("question");
if (questionEl) questionEl.textContent = `${NAME} will you be my valentine?`;

const subEl = document.getElementById("sub");
const artEl = document.querySelector(".art");

const yesTitle = document.getElementById("yesTitle");
if (yesTitle) yesTitle.textContent = `Congratulations! You're now ${VALENTINE_OF}'s Valentine!`;

const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

/* ---------- CONFETTI ---------- */
const confettiCanvas = document.getElementById("confettiCanvas");

function setIntroVisible(isVisible) {
  const display = isVisible ? "" : "none";
  if (artEl) artEl.style.display = display;
  if (questionEl) questionEl.style.display = display;
  if (subEl) subEl.style.display = display;
}

function setRestartVisible(isVisible) {
  // removed (restart buttons are inside result sections now)
}

function resetUI() {
  setIntroVisible(true);
  zone.style.display = "";
  hint.style.display = "";
  if (result) result.style.display = "none";
  if (noResult) noResult.style.display = "none";

  yesScale = 1;
  layoutButtons();
  resizeConfettiCanvas();

  const ctx = confettiCanvas?.getContext?.("2d");
  if (ctx) ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function debounce(fn, delayMs) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delayMs);
  };
}

function resizeConfettiCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  confettiCanvas.width = Math.floor(window.innerWidth * dpr);
  confettiCanvas.height = Math.floor(window.innerHeight * dpr);
  confettiCanvas.style.width = "100vw";
  confettiCanvas.style.height = "100vh";
}

const onResize = debounce(() => {
  resizeConfettiCanvas();
  layoutButtons();
}, 120);

resizeConfettiCanvas();
window.addEventListener("resize", onResize, { passive: true });
window.addEventListener("orientationchange", onResize, { passive: true });

let confettiInstance = null;
function getConfetti() {
  if (prefersReducedMotion) return null;
  if (!window.confetti) return null;
  if (!confettiInstance) {
    confettiInstance = window.confetti.create(confettiCanvas, {
      resize: false,
      useWorker: true
    });
  }
  return confettiInstance;
}

function fullScreenConfetti() {
  const c = getConfetti();
  if (!c) return;

  const end = Date.now() + 1400;
  (function frame() {
    c({
      particleCount: 10,
      spread: 90,
      startVelocity: 42,
      ticks: 170,
      origin: { x: Math.random(), y: Math.random() * 0.28 }
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  setTimeout(() => {
    c({
      particleCount: 260,
      spread: 140,
      startVelocity: 58,
      ticks: 210,
      origin: { x: 0.5, y: 0.55 }
    });
  }, 260);
}

/* ---------- BUTTON LAYOUT / SCALE ---------- */
let yesScale = 1;
function applyYesTransform() {
  yesBtn.style.transform = `translate(-50%, -50%) scale(${yesScale})`;
}

function growYes() {
  yesScale = Math.min(2.2, yesScale + 0.1);
  applyYesTransform();
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function setButtonCenter(btn, cx, cy) {
  btn.style.left = cx + "px";
  btn.style.top = cy + "px";
}

function getZoneRects() {
  const z = zone.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();
  return { z, b };
}

function layoutButtons() {
  // Place buttons using stable px center coordinates (prevents transform/percent mixing bugs)
  const z = zone.getBoundingClientRect();
  const yes = yesBtn.getBoundingClientRect();
  const no = noBtn.getBoundingClientRect();

  const padding = 12;
  const yesCx = clamp(z.width * 0.32, padding + yes.width / 2, z.width - padding - yes.width / 2);
  const noCx  = clamp(z.width * 0.72, padding + no.width / 2,  z.width - padding - no.width / 2);
  const cy    = z.height * 0.50;

  setButtonCenter(yesBtn, yesCx, cy);
  setButtonCenter(noBtn, noCx, cy);

  applyYesTransform();
  noBtn.style.transform = "translate(-50%, -50%)";
}

layoutButtons();
document.querySelectorAll(".restartBtn").forEach((btn) => btn.addEventListener("click", resetUI));

/* ---------- NO BUTTON RUNS AWAY (NO STICKING) ---------- */
let rafPending = false;
let lastPointer = { x: 0, y: 0 };

function clientToZone(clientX, clientY) {
  const z = zone.getBoundingClientRect();
  return { x: clientX - z.left, y: clientY - z.top, z };
}

function dodgeFromPointer() {
  rafPending = false;

  const { x, y, z } = clientToZone(lastPointer.x, lastPointer.y);
  const b = noBtn.getBoundingClientRect();

  const noCenterX = (parseFloat(noBtn.style.left) || (b.left - z.left + b.width / 2));
  const noCenterY = (parseFloat(noBtn.style.top)  || (b.top  - z.top  + b.height / 2));

  let dx = noCenterX - x;
  let dy = noCenterY - y;

  // If cursor lands exactly on center, pick a random direction (prevents "stuck" zero-vector)
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    const a = Math.random() * Math.PI * 2;
    dx = Math.cos(a);
    dy = Math.sin(a);
  }

  const mag = Math.hypot(dx, dy) || 1;
  dx /= mag;
  dy /= mag;

  const push = 170;
  const padding = 12;

  let nextCx = noCenterX + dx * push;
  let nextCy = noCenterY + dy * push;

  // Keep it inside the zone
  const minX = padding + b.width / 2;
  const maxX = z.width - padding - b.width / 2;
  const minY = padding + b.height / 2;
  const maxY = z.height - padding - b.height / 2;

  nextCx = clamp(nextCx, minX, maxX);
  nextCy = clamp(nextCy, minY, maxY);

  // If we got fully clamped (no movement), jump somewhere random inside the zone.
  if (Math.abs(nextCx - noCenterX) < 0.5 && Math.abs(nextCy - noCenterY) < 0.5) {
    nextCx = clamp(padding + b.width / 2 + Math.random() * (z.width - padding * 2 - b.width), minX, maxX);
    nextCy = clamp(padding + b.height / 2 + Math.random() * (z.height - padding * 2 - b.height), minY, maxY);
  }

  setButtonCenter(noBtn, nextCx, nextCy);
  noBtn.style.transform = "translate(-50%, -50%)";

  growYes();
}

function requestDodge(clientX, clientY) {
  lastPointer.x = clientX;
  lastPointer.y = clientY;
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(dodgeFromPointer);
}

function maybeDodge(clientX, clientY) {
  const b = noBtn.getBoundingClientRect();
  const d = Math.hypot((b.left + b.width / 2) - clientX, (b.top + b.height / 2) - clientY);
  if (d < 140) requestDodge(clientX, clientY);
}

// Dodge only on move so the button is still clickable.
zone.addEventListener("pointermove", (e) => maybeDodge(e.clientX, e.clientY), { passive: true });
noBtn.addEventListener("pointermove", (e) => requestDodge(e.clientX, e.clientY), { passive: true });

// Mobile: there is usually no hover, so also dodge on touch taps near the No button.
// Important: don't dodge when the user taps directly on the No button, so it can still be clicked.
zone.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  maybeDodge(e.clientX, e.clientY);
});

/* ---------- YES CLICK ---------- */
yesBtn.addEventListener("click", () => {
  setIntroVisible(false);
  zone.style.display = "none";
  hint.style.display = "none";
  result.style.display = "block";
  if (noResult) noResult.style.display = "none";
  resizeConfettiCanvas();
  fullScreenConfetti();
});

// Make "No" impossible to click: any attempt dodges.
noBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  requestDodge(e.clientX, e.clientY);
});

noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const b = noBtn.getBoundingClientRect();
  requestDodge(b.left + b.width / 2, b.top + b.height / 2);
});

function updateFullscreenBtn() {
  if (!fullscreenBtn) return;
  fullscreenBtn.textContent = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
}

// Fullscreen toggle removed
