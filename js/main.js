// ============================================================
// 個性心理学 動物キャラナビ メインロジック (main.js)
// ============================================================

let myDiagnosisResult = null; // 自分の診断結果を保持

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
  renderAnimalsGrid();
  setupParticles();
});

// パーティクル背景のセットアップ
function setupParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  // 浮遊する小さな光の粒をランダムに配置
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 6 + 4 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = Math.random() > 0.5 ? 'rgba(236, 72, 153, 0.3)' : 'rgba(167, 139, 250, 0.3)';
    particle.style.borderRadius = '50%';
    particle.style.top = Math.random() * 100 + 'vh';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.animation = `floating ${Math.random() * 5 + 5}s infinite ease-in-out`;
    particle.style.animationDelay = Math.random() * 3 + 's';
    container.appendChild(particle);
  }
}

// 自分の診断を実行
function runMyDiagnosis() {
  const year = parseInt(document.getElementById('myYear').value);
  const month = parseInt(document.getElementById('myMonth').value);
  const day = parseInt(document.getElementById('myDay').value);

  if (!validateDate(year, month, day)) {
    alert('正しい生年月日を入力してください（1926年〜2010年）');
    return;
  }

  myDiagnosisResult = diagnose(year, month, day);
  showMyResult(myDiagnosisResult);
  
  // 診断成功したら自動的に結果位置までスクロール
  setTimeout(() => {
    document.getElementById('myResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// 自分の結果表示
function showMyResult(res) {
  const resultArea = document.getElementById('myResult');
  resultArea.style.display = 'block';

  document.getElementById('myCharNumber').innerText = `No.${res.number}`;
  document.getElementById('myGroupBadge').innerText = `${res.group.emoji} ${res.group.name}`;
  document.getElementById('myAnimalIcon').innerText = res.profile.emoji;
  document.getElementById('myCharName').innerText = res.name;
  document.getElementById('myAnimalName').innerText = `${res.animal}タイプ`;
  document.getElementById('myCharSpell').innerText = `魔力属性: ${res.spell} 🌟`;
  document.getElementById('myKeyword').innerText = `✨ 「${res.profile.keyword}」`;

  // 詳細プロフィール設定
  document.getElementById('myPersonality').innerText = res.profile.personality;
  document.getElementById('myLove').innerText = res.profile.love;
  document.getElementById('myMoney').innerText = res.profile.money;
  document.getElementById('myVocation').innerText = res.profile.vocation;
  document.getElementById('myLucky').innerText = res.profile.lucky;

  // 結果カードのボーダー色変更
  const card = document.getElementById('myResultCard');
  card.style.borderColor = res.group.color;
  card.style.boxShadow = `0 30px 70px rgba(0, 0, 0, 0.4), 0 0 30px ${res.group.color}33`;
}

// 推しの診断 & 相性チェックを実行
function runOshiDiagnosis() {
  if (!myDiagnosisResult) {
    alert('まずは上の「STEP 01」でご自身のキャラを診断してください！');
    document.getElementById('diagnosis').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const oshiName = document.getElementById('oshiName').value.trim() || '推し';
  const year = parseInt(document.getElementById('oshiYear').value);
  const month = parseInt(document.getElementById('oshiMonth').value);
  const day = parseInt(document.getElementById('oshiDay').value);

  if (!validateDate(year, month, day)) {
    alert('推しの正しい生年月日を入力してください（1926年〜2010年）');
    return;
  }

  const oshiRes = diagnose(year, month, day);
  showOshiResult(oshiRes, oshiName);

  // 相性を計算
  calculateAndShowCompatibility(myDiagnosisResult, oshiRes, oshiName);

  setTimeout(() => {
    document.getElementById('oshiResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// 推しの結果表示
function showOshiResult(res, oshiName) {
  const resultArea = document.getElementById('oshiResult');
  resultArea.style.display = 'block';

  document.getElementById('oshiNameLabel').innerText = `💖 ${oshiName} のキャラ`;
  document.getElementById('oshiCharNumber').innerText = `No.${res.number}`;
  document.getElementById('oshiGroupBadge').innerText = `${res.group.emoji} ${res.group.name}`;
  document.getElementById('oshiAnimalIcon').innerText = res.profile.emoji;
  document.getElementById('oshiCharName').innerText = res.name;
  document.getElementById('oshiAnimalName').innerText = `${res.animal}タイプ`;
  document.getElementById('oshiKeyword').innerText = `✨ 「${res.profile.keyword}」`;

  // 詳細プロフィール設定
  document.getElementById('oshiPersonality').innerText = res.profile.personality;
  document.getElementById('oshiCatchphrase').innerText = `「${res.profile.catchphrase}」と言ってあげると大喜び！`;

  // 推し結果カードのボーダー色変更
  const card = document.getElementById('oshiResultCard');
  card.style.borderColor = res.group.color;
}

// 相性計算と結果表示
function calculateAndShowCompatibility(my, oshi, oshiName) {
  const compatCard = document.getElementById('compatCard');
  compatCard.style.display = 'block';

  // グループの勝ち負け関係を算出
  const compat = getGroupCompatibility(my.group.id, oshi.group.id);

  // 得点に少しゆらぎ（キャラごとの相性補正）を入れてプレミアム感を演出
  // 同一グループ: 100点
  // 勝ち関係: 85点〜95点
  // 負け関係: 75点〜85点
  let finalScore = compat.score;
  if (my.group.id !== oshi.group.id) {
    const seed = (my.number * oshi.number) % 15; // 再現性のあるランダム値
    finalScore = compat.score === 80 ? 80 + seed : 85 + (seed % 10);
  }

  // グループ名表示
  document.getElementById('myGroupItem').innerHTML = `${my.group.emoji} あなた<br><small>(${my.group.name})</small>`;
  document.getElementById('oshiGroupItem').innerHTML = `${oshi.group.emoji} ${oshiName}<br><small>(${oshi.group.name})</small>`;

  document.getElementById('compatScore').innerText = `${finalScore}点`;
  document.getElementById('compatLabel').innerText = compat.label;
  
  // 相性詳細テキストの編集
  let desc = `あなた(${my.group.name})と${oshiName}さん(${oshi.group.name})は、`;
  if (my.group.id === oshi.group.id) {
    desc += `価値観がピッタリ同じ「最高のソウルメイト」！言葉がなくても通じ合える、最強に心地よい関係です✨`;
  } else if (compat.score === 80) {
    desc += `あなたが${oshiName}さんを自然とリードする関係。あなたの頼もしい姿に、${oshiName}さんは大きな安心感を抱くはずです🏆`;
  } else {
    desc += `あなたが${oshiName}さんの圧倒的な世界観や感性に惹かれる関係。刺激的で、いつでもあなたにトキメキを与えてくれる憧れの人です💫`;
  }
  document.getElementById('compatDesc').innerText = desc;

  // 攻略のヒント
  let tip = `${oshiName}さんは【${oshi.animal}】タイプ。`;
  tip += `プライドをくすぐる「${oshi.profile.catchphrase}」という褒め言葉が効果絶大です！`;
  tip += `また、${oshiName}さんは${oshi.profile.personality.substring(0, 45)}...という特徴があるので、そこを優しくフォローしてあげると急接近できますよ🎯`;
  document.getElementById('compatTip').innerText = tip;
}

// 12キャラ一覧の動的生成
function renderAnimalsGrid(filterGroup = 'all') {
  const grid = document.getElementById('animalsGrid');
  if (!grid) return;

  grid.innerHTML = ''; // クリア

  for (const [animalName, p] of Object.entries(ANIMAL_PROFILES)) {
    if (filterGroup !== 'all' && p.group !== filterGroup) continue;

    const groupObj = GROUPS[p.group];
    const card = document.createElement('div');
    card.className = 'animal-card';
    card.style.setProperty('--border-color', groupObj.color);

    card.innerHTML = `
      <span class="card-emoji">${p.emoji}</span>
      <h3 class="card-title">${animalName}</h3>
      <span class="card-group" style="background:${groupObj.color}22; color:${groupObj.color}">${groupObj.emoji} ${groupObj.name}</span>
      <p class="card-desc">${p.personality.substring(0, 50)}...</p>
    `;

    // クリックしたときにそのキャラの説明をアラート風ダイアログで表示、またはフォームに設定できるようにする
    card.addEventListener('click', () => {
      alert(`【${animalName}の取扱説明書】\n\n◆ 特徴:\n${p.personality}\n\n◆ 恋愛運:\n${p.love}\n\n◆ 喜ぶ魔法の言葉:\n「${p.catchphrase}」`);
    });

    grid.appendChild(card);
  }
}

// フィルター切り替え
function filterAnimals(group) {
  // ボタンのアクティブ切り替え
  const buttons = ['all', 'Moon', 'Earth', 'Sun'];
  buttons.forEach(b => {
    const btn = document.getElementById(`filter${b}`);
    if (btn) btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`filter${group.charAt(0) + group.slice(1).toLowerCase()}`);
  if (activeBtn) activeBtn.classList.add('active');

  renderAnimalsGrid(group);
}

// 日付バリデーション
function validateDate(y, m, d) {
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  if (y < 1920 || y > 2026) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;

  // 月の日数整合性チェック
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// 結果のSNSシェア
function shareResult(type) {
  let shareText = '';
  
  if (type === 'my') {
    if (!myDiagnosisResult) return;
    shareText = `【動物キャラナビ診断】\n私の個性心理学キャラは『No.${myDiagnosisResult.number} ${myDiagnosisResult.name}』でした！✨\n属性: ${myDiagnosisResult.group.name} 🌙\nキーワード: 「${myDiagnosisResult.profile.keyword}」\n#動物キャラナビ #個性心理学 #推し活相性診断\n`;
  } else {
    const oshiName = document.getElementById('oshiName').value.trim() || '推し';
    const compatScore = document.getElementById('compatScore').innerText;
    const compatLabel = document.getElementById('compatLabel').innerText;
    shareText = `【推し活×個性心理学】\n私と${oshiName}さんの相性診断結果は…『${compatScore} (${compatLabel})』でした！💖\nお互いのキャラ:\n私: ${myDiagnosisResult.name}\n${oshiName}さん: ${document.getElementById('oshiCharName').innerText}\n#動物キャラナビ #推し活相性診断 #個性心理学\n`;
  }

  // クリップボードにコピー
  navigator.clipboard.writeText(shareText).then(() => {
    alert('診断結果をクリップボードにコピーしました！\nThreadsやXに貼り付けてシェアしてね 🚀');
  }).catch(err => {
    console.error('Copy failed: ', err);
    // 代替策としてプロンプト表示
    prompt('結果をコピーしてシェアしてください：', shareText);
  });
}
