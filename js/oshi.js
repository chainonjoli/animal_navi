// ============================================================
// 推し相性ページ — oshi.js
// レーダーチャート描画 + 3軸相性計算 + テキスト生成
// ============================================================

// ---- 推し診断の実行 ----
function runOshiDiagnosis() {
  if (!window.myDiagnosisResult) {
    navigateTo('diagnosis');
    return;
  }

  const oshiName = document.getElementById('oshiName').value.trim() || '推し';
  const year = parseInt(document.getElementById('oshiYear').value);
  const month = parseInt(document.getElementById('oshiMonth').value);
  const day = parseInt(document.getElementById('oshiDay').value);

  if (!validateDate(year, month, day)) {
    showToast('推しの正しい生年月日を入力してください');
    return;
  }

  showLoading();

  setTimeout(() => {
    const oshiRes = diagnose(year, month, day);
    window.oshiDiagnosisResult = oshiRes;
    showOshiResult(oshiRes, oshiName);
    calculateAndShowCompatibility(window.myDiagnosisResult, oshiRes, oshiName);
    hideLoading();

    document.getElementById('oshiResult').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('oshiResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    updateGptsSummary();
  }, 800);
}

// ---- 推しキャラ結果表示 ----
function showOshiResult(res, oshiName) {
  document.getElementById('oshiResultLabel').textContent = `💖 ${oshiName} のキャラ`;
  document.getElementById('oshiCharNumber').textContent = `No.${res.number}`;

  const badge = document.getElementById('oshiGroupBadge');
  badge.textContent = `${res.groupData.emoji} ${res.groupData.name}`;
  badge.className = `char-group-badge ${res.groupData.cssClass}`;

  document.getElementById('oshiAnimalIcon').textContent = res.profile.emoji;
  document.getElementById('oshiCharName').textContent = res.name;
  document.getElementById('oshiAnimalName').textContent = `${res.animal}タイプ`;
  document.getElementById('oshiKeyword').textContent = `✨ 「${res.profile.keyword}」`;
  document.getElementById('oshiPersonality').textContent = res.profile.personality;
  document.getElementById('oshiOshiText').textContent = res.profile.oshiText;
}

// ---- 相性計算と表示 ----
function calculateAndShowCompatibility(my, oshi, oshiName) {
  const compat = getGroupCompatibility(my.groupData.id, oshi.groupData.id);
  const detail = getCompatDetail(my.groupData.id, oshi.groupData.id);

  // スコア計算（キャラ固有の揺らぎ付き）
  const seed = (my.number * 7 + oshi.number * 13) % 20;
  const atmosphereScore = Math.min(99, compat.baseAtmosphere + (seed % 12));
  const roleScore = Math.min(99, compat.baseRole + ((seed * 3) % 14));
  const emotionScore = Math.min(99, compat.baseEmotion + ((seed * 5) % 10));
  const totalScore = Math.round((atmosphereScore + roleScore + emotionScore) / 3);

  // VS表示
  document.getElementById('compatMyEmoji').textContent = my.profile.emoji;
  document.getElementById('compatMyGroup').textContent = my.groupData.name;
  document.getElementById('compatOshiEmoji').textContent = oshi.profile.emoji;
  document.getElementById('compatOshiName').textContent = oshiName;
  document.getElementById('compatOshiGroup').textContent = oshi.groupData.name;

  // スコア表示
  animateScore('compatScore', totalScore);
  document.getElementById('compatLabel').textContent = compat.label;

  // 3軸スコア
  animateScore('axisAtmosphere', atmosphereScore);
  animateScore('axisRole', roleScore);
  animateScore('axisEmotion', emotionScore);

  // レーダーチャート描画
  drawRadarChart(atmosphereScore, roleScore, emotionScore);

  // 詳細テキスト
  const detailsContainer = document.getElementById('compatDetails');
  detailsContainer.innerHTML = `
    <div class="compat-detail-block">
      <div class="compat-detail-title">🌬️ 空気感</div>
      <div class="compat-detail-text">${detail.atmosphere}</div>
    </div>
    <div class="compat-detail-block">
      <div class="compat-detail-title">⚖️ 役割バランス</div>
      <div class="compat-detail-text">${detail.roleBalance}</div>
    </div>
    <div class="compat-detail-block">
      <div class="compat-detail-title">💗 感情相性</div>
      <div class="compat-detail-text">${detail.emotionalFit}</div>
    </div>
    <div class="compat-detail-block" style="border-left-color: var(--pink);">
      <div class="compat-detail-title" style="color: var(--brown);">🎤 推し活的に刺さるポイント</div>
      <div class="compat-detail-text">${detail.oshiComment}</div>
    </div>
  `;

  // ヒント
  const tip = `${oshiName}さんは【${oshi.animal}】タイプ。「${oshi.profile.catchphrase}」という一言が効果絶大！また、${oshi.profile.personality.substring(0, 50)}…という特徴を優しくフォローしてあげると距離が縮まります。`;
  document.getElementById('compatTip').textContent = tip;
}

// ---- スコアアニメーション ----
function animateScore(elementId, target) {
  const el = document.getElementById(elementId);
  let current = 0;
  const duration = 800;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    current = Math.round(eased * target);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ---- レーダーチャート（Canvas） ----
function drawRadarChart(atmosphere, role, emotion) {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const maxRadius = size * 0.38;

  ctx.clearRect(0, 0, size, size);

  const labels = ['空気感', '役割バランス', '感情相性'];
  const values = [atmosphere, role, emotion];
  const angles = labels.map((_, i) => (Math.PI * 2 * i) / 3 - Math.PI / 2);

  // 背景グリッド
  for (let level = 1; level <= 5; level++) {
    const r = (maxRadius * level) / 5;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = angles[i % 3];
      const x = center + r * Math.cos(a);
      const y = center + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(123, 102, 88, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 軸線
  angles.forEach(a => {
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + maxRadius * Math.cos(a), center + maxRadius * Math.sin(a));
    ctx.strokeStyle = 'rgba(123, 102, 88, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // データエリア
  ctx.beginPath();
  values.forEach((v, i) => {
    const r = (maxRadius * v) / 100;
    const x = center + r * Math.cos(angles[i]);
    const y = center + r * Math.sin(angles[i]);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();

  // グラデーションフィル
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, maxRadius);
  gradient.addColorStop(0, 'rgba(217, 166, 161, 0.35)'); // ダスティピンク
  gradient.addColorStop(1, 'rgba(168, 178, 161, 0.25)'); // セージグリーン
  ctx.fillStyle = gradient;
  ctx.fill();

  // ボーダー
  ctx.strokeStyle = 'rgba(217, 166, 161, 0.8)'; // ダスティピンクボーダー
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // データポイント
  values.forEach((v, i) => {
    const r = (maxRadius * v) / 100;
    const x = center + r * Math.cos(angles[i]);
    const y = center + r * Math.sin(angles[i]);

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#A8B2A1'; // セージグリーン
    ctx.fill();
    ctx.strokeStyle = '#F6F1EA'; // ウォームアイボリー
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // ラベル
  ctx.font = '700 20px "Zen Kaku Gothic New", sans-serif';
  ctx.fillStyle = '#7B6658'; // スモーキーブラウン
  ctx.textAlign = 'center';

  labels.forEach((label, i) => {
    const r = maxRadius + 32;
    const x = center + r * Math.cos(angles[i]);
    const y = center + r * Math.sin(angles[i]);
    ctx.fillText(label, x, y + 6);
  });
}
