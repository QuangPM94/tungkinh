// ===== Trạng thái =====
const STORAGE_KEY = "congduc";
let merit = Number(localStorage.getItem(STORAGE_KEY)) || 0;
let autoTimer = null;

function saveMerit() {
  try {
    localStorage.setItem(STORAGE_KEY, String(merit));
  } catch (e) {
    /* trình duyệt chặn localStorage -> bỏ qua, vẫn chạy bình thường */
  }
}

// ===== Phần tử DOM =====
const meritCountEl = document.getElementById("meritCount");
const woodfishEl = document.getElementById("woodfish");
const malletEl = document.getElementById("mallet");
const floatLayer = document.getElementById("floatLayer");
const btnTap = document.getElementById("btnTap");
const btnAuto = document.getElementById("btnAuto");

// Hiển thị công đức đã lưu từ lần trước
meritCountEl.textContent = merit;

// ===== Âm thanh =====
// Nếu sau này có file âm thanh thật: bỏ comment thẻ <audio id="knockSound"> trong index.html.
// Khi chưa có file, ta tổng hợp tiếng "cốc" bằng Web Audio API để dùng tạm.
const audioEl = document.getElementById("knockSound");
let audioCtx = null;

function ensureAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

// Tiếng gõ mõ tổng hợp tạm: 1 xung gỗ ngắn
function playSynthKnock() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.6, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playKnock() {
  if (audioEl) {
    // Có file âm thanh thật -> phát file
    audioEl.currentTime = 0;
    audioEl.play().catch(() => {});
  } else {
    // Chưa có file -> phát tiếng tổng hợp
    ensureAudioCtx();
    playSynthKnock();
  }
}

// ===== Hành động gõ =====
function knock() {
  merit += 1;
  meritCountEl.textContent = merit;
  saveMerit();

  // hiệu ứng số nảy lên
  meritCountEl.classList.remove("bump");
  void meritCountEl.offsetWidth; // reset animation
  meritCountEl.classList.add("bump");

  // hiệu ứng mõ + dùi
  woodfishEl.classList.remove("hit");
  malletEl.classList.remove("strike");
  void woodfishEl.offsetWidth;
  woodfishEl.classList.add("hit");
  malletEl.classList.add("strike");

  spawnFloatMerit();
  playKnock();
}

// Hiện chữ "+1 công đức" bay lên
function spawnFloatMerit() {
  const el = document.createElement("div");
  el.className = "float-merit";
  el.textContent = "+1 công đức";
  el.style.left = 45 + Math.random() * 10 + "%";
  floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ===== Auto gõ =====
function toggleAuto() {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
    btnAuto.classList.remove("active");
    btnAuto.textContent = "Auto gõ";
  } else {
    ensureAudioCtx();
    knock(); // gõ ngay nhịp đầu
    autoTimer = setInterval(knock, 600);
    btnAuto.classList.add("active");
    btnAuto.textContent = "Dừng";
  }
}

// ===== Sự kiện =====
btnTap.addEventListener("click", () => {
  ensureAudioCtx();
  knock();
});
woodfishEl.addEventListener("click", () => {
  ensureAudioCtx();
  knock();
});
btnAuto.addEventListener("click", toggleAuto);
