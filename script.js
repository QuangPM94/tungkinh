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
const btnReset = document.getElementById("btnReset");
const badgeEl = document.getElementById("badge");
const celebrateEl = document.getElementById("celebrate");

// ===== Huy hiệu công đức =====
const TIERS = [
  { at: 100, icon: "🪷", name: "Sơ Phát Tâm" },
  { at: 1000, icon: "🌟", name: "Tinh Tấn" },
  { at: 10000, icon: "🏆", name: "Công Đức Viên Mãn" },
];

// Mốc cao nhất đã đạt với giá trị hiện tại
function currentTier(value) {
  let reached = null;
  for (const tier of TIERS) {
    if (value >= tier.at) reached = tier;
  }
  return reached;
}

// Hiện huy hiệu theo công đức hiện tại
function renderBadge() {
  const tier = currentTier(merit);
  if (tier) {
    badgeEl.innerHTML = `<span class="badge__icon">${tier.icon}</span>${tier.name}`;
    badgeEl.classList.add("show");
  } else {
    badgeEl.textContent = "";
    badgeEl.classList.remove("show");
  }
}

// Hiệu ứng chúc mừng khi vừa đạt mốc mới
function celebrate(tier) {
  celebrateEl.innerHTML =
    `<div class="celebrate__icon">${tier.icon}</div>` +
    `<div class="celebrate__big">Đạt mốc ${tier.at.toLocaleString("vi-VN")} công đức!</div>` +
    `<div class="celebrate__name">${tier.name}</div>`;
  celebrateEl.classList.remove("show");
  void celebrateEl.offsetWidth; // reset animation
  celebrateEl.classList.add("show");
}

// Hiển thị công đức + huy hiệu đã lưu từ lần trước
meritCountEl.textContent = merit;
renderBadge();

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

// iOS/Android chặn âm thanh cho tới khi người dùng chạm lần đầu.
// Hàm này "mở khoá" audio ngay ở thao tác chạm/bấm đầu tiên.
let audioUnlocked = false;
function unlockAudio() {
  ensureAudioCtx();
  if (audioCtx && !audioUnlocked) {
    // phát 1 buffer câm cực ngắn để đánh thức audio trên iOS
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.connect(audioCtx.destination);
    src.start(0);
    audioUnlocked = true;
  }
  if (audioEl) {
    // mở khoá thẻ <audio> (nếu dùng file thật)
    audioEl
      .play()
      .then(() => {
        audioEl.pause();
        audioEl.currentTime = 0;
      })
      .catch(() => {});
  }
}
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("touchstart", unlockAudio, { once: true });

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
  const tierBefore = currentTier(merit);
  merit += 1;
  meritCountEl.textContent = merit;
  saveMerit();

  // vừa vượt qua một mốc -> chúc mừng + cập nhật huy hiệu
  const tierAfter = currentTier(merit);
  if (tierAfter && tierAfter !== tierBefore) {
    celebrate(tierAfter);
    renderBadge();
  }

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
function stopAuto() {
  if (!autoTimer) return;
  clearInterval(autoTimer);
  autoTimer = null;
  btnAuto.classList.remove("active");
  btnAuto.textContent = "Auto gõ";
}

function toggleAuto() {
  if (autoTimer) {
    stopAuto();
  } else {
    ensureAudioCtx();
    knock(); // gõ ngay nhịp đầu
    autoTimer = setInterval(knock, 600);
    btnAuto.classList.add("active");
    btnAuto.textContent = "Dừng";
  }
}

// ===== Reset công đức =====
function resetMerit() {
  if (!confirm("Xoá toàn bộ công đức về 0?")) return;
  stopAuto();
  merit = 0;
  meritCountEl.textContent = merit;
  saveMerit();
  renderBadge();
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
btnReset.addEventListener("click", resetMerit);
