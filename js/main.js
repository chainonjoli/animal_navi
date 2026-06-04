// ============================================================
// 動物キャラナビ — main.js
// SPA ルーティング + コアロジック + アニメーション
// ============================================================

// ---- State ----
window.myDiagnosisResult = null;
window.oshiDiagnosisResult = null;

// ---- 初期化 ----
document.addEventListener('DOMContentLoaded', () => {
  setupParticles();
  setupScrollReveal();
  handleHashRoute();
  window.addEventListener('hashchange', handleHashRoute);
});

// ---- SPA ルーティング ----
function navigateTo(pageId) {
  window.location.hash = pageId;
}

function handleHashRoute() {
  const hash = window.location.hash.replace('#', '') || 'top';
  const validPages = ['top', 'diagnosis', 'oshi', 'gpts'];
  const targetPage = validPages.includes(hash) ? hash : 'top';

  // ページ表示切り替え
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${targetPage}`);
  if (page) {
    page.classList.add('active');
    // ページトップへスクロール
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ナビアクティブ更新
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === targetPage);
  });

  // ページ固有の処理
  if (targetPage === 'oshi') {
    updateOshiPageState();
  }
  if (targetPage === 'gpts') {
    updateGptsSummary();
  }

  // スクロールリビール再チェック
  setTimeout(triggerScrollReveal, 100);
}

// ---- 推しページの状態管理 ----
function updateOshiPageState() {
  const hasDiagnosis = !!window.myDiagnosisResult;
  const needDiag = document.getElementById('oshiNeedDiagnosis');
  const form = document.getElementById('oshiForm');

  if (hasDiagnosis) {
    needDiag.classList.add('hidden');
    form.classList.remove('hidden');
  } else {
    needDiag.classList.remove('hidden');
    form.classList.add('hidden');
  }
}

// ---- GPTs サマリー更新 ----
function updateGptsSummary() {
  const summaryCard = document.getElementById('gptsSummary');
  if (!summaryCard) return;

  if (window.myDiagnosisResult) {
    summaryCard.classList.remove('hidden');
    const my = window.myDiagnosisResult;
    document.getElementById('gptsMySummary').textContent =
      `No.${my.number} ${my.name}（${my.groupData.emoji} ${my.groupData.name}）`;
  }

  const oshiSummaryItem = document.getElementById('gptsSummaryOshi');
  if (window.oshiDiagnosisResult && oshiSummaryItem) {
    oshiSummaryItem.classList.remove('hidden');
    const oshi = window.oshiDiagnosisResult;
    const oshiName = document.getElementById('oshiName')?.value?.trim() || '推し';
    document.getElementById('gptsOshiSummary').textContent =
      `${oshiName}: No.${oshi.number} ${oshi.name}（${oshi.groupData.emoji} ${oshi.groupData.name}）`;
  }
}

// ---- 自分の診断 ----
function runMyDiagnosis() {
  const year = parseInt(document.getElementById('myYear').value);
  const month = parseInt(document.getElementById('myMonth').value);
  const day = parseInt(document.getElementById('myDay').value);

  if (!validateDate(year, month, day)) {
    showToast('正しい生年月日を入力してください');
    return;
  }

  showLoading();

  setTimeout(() => {
    window.myDiagnosisResult = diagnose(year, month, day);
    showMyResult(window.myDiagnosisResult);
    hideLoading();
    document.getElementById('myResult').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('myResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    updateGptsSummary();
  }, 800);
}

// ---- 自分の結果表示 ----
function showMyResult(res) {
  document.getElementById('myCharNumber').textContent = `No.${res.number}`;

  const badge = document.getElementById('myGroupBadge');
  badge.textContent = `${res.groupData.emoji} ${res.groupData.name}`;
  badge.className = `char-group-badge ${res.groupData.cssClass}`;

  document.getElementById('myAnimalIcon').textContent = res.profile.emoji;
  document.getElementById('myCharName').textContent = res.name;
  document.getElementById('myAnimalName').textContent = `${res.animal}タイプ`;
  document.getElementById('myCharSpell').textContent = `✦ 魔力属性: ${res.spell}`;
  document.getElementById('myKeyword').textContent = `✨ 「${res.profile.keyword}」`;
  document.getElementById('myPersonality').textContent = res.profile.personality;
  document.getElementById('myLove').textContent = res.profile.love;
  document.getElementById('myVocation').textContent = res.profile.vocation;
  document.getElementById('myLucky').textContent = res.profile.lucky;
}

// ---- バリデーション ----
function validateDate(y, m, d) {
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  if (y < 1920 || y > 2026) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// ---- ローディング ----
function showLoading() {
  document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}

// ---- Toast通知 ----
function showToast(message) {
  // 既存のtoastを削除
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: rgba(255, 45, 120, 0.95);
    color: #fff;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 700;
    z-index: 3000;
    box-shadow: 0 8px 24px rgba(255, 45, 120, 0.3);
    opacity: 0;
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
    text-align: center;
    max-width: 320px;
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ---- シェア ----
function shareResult(type) {
  let text = '';

  if (type === 'my' && window.myDiagnosisResult) {
    const r = window.myDiagnosisResult;
    text = `【動物キャラナビ診断】\n私のキャラは『No.${r.number} ${r.name}』✨\n${r.groupData.emoji} ${r.groupData.name}\nキーワード: 「${r.profile.keyword}」\n\n#動物キャラナビ #個性心理学 #推し活\n`;
  } else if (type === 'oshi' && window.oshiDiagnosisResult) {
    const oshiName = document.getElementById('oshiName')?.value?.trim() || '推し';
    const score = document.getElementById('compatScore')?.textContent || '';
    text = `【推し活×個性心理学】\n私と${oshiName}の相性: ${score}点！\n私: ${window.myDiagnosisResult.name}\n${oshiName}: ${window.oshiDiagnosisResult.name}\n\n#動物キャラナビ #推し活相性 #個性心理学\n`;
  }

  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    showToast('コピーしました！SNSでシェアしてね 📤');
  }).catch(() => {
    prompt('結果をコピーしてシェアしてください：', text);
  });
}

// ---- パーティクル背景 ----
function setupParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const colors = [
    'rgba(255, 45, 120, 0.3)',
    'rgba(180, 77, 255, 0.25)',
    'rgba(212, 168, 83, 0.2)',
    'rgba(255, 255, 255, 0.1)',
  ];

  for (let i = 0; i < 25; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 5 + 3;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    particle.style.setProperty('--duration', (Math.random() * 6 + 6) + 's');
    particle.style.setProperty('--delay', (Math.random() * 5) + 's');
    container.appendChild(particle);
  }
}

// ---- スクロールリビール ----
function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

function triggerScrollReveal() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      el.classList.add('visible');
    }
  });
}
