// ============================================================
// グループ考察ページ — group.js
// メンバー入力 + 円グラフ + 役割分析 + インフォグラフィック
// ============================================================

let memberCount = 0;

// ---- 初期化 ----
function initGroupPage() {
  renderPresets();
  // 初期メンバー2行
  if (document.getElementById('memberList').children.length === 0) {
    addMemberRow();
    addMemberRow();
  }
}

// ---- プリセット描画 ----
function renderPresets() {
  const container = document.getElementById('presetChips');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(GROUP_PRESETS).forEach(name => {
    const chip = document.createElement('button');
    chip.className = 'preset-chip';
    chip.textContent = name;
    chip.onclick = () => loadPreset(name);
    container.appendChild(chip);
  });
}

// ---- プリセット読み込み ----
function loadPreset(name) {
  const preset = GROUP_PRESETS[name];
  if (!preset) return;

  document.getElementById('groupName').value = name;

  // メンバーリストをクリアして再生成
  const list = document.getElementById('memberList');
  list.innerHTML = '';
  memberCount = 0;

  preset.forEach(member => {
    addMemberRow(member.name, member.year, member.month, member.day);
  });
}

// ---- メンバー行追加 ----
function addMemberRow(name = '', year = '', month = '', day = '') {
  const list = document.getElementById('memberList');
  if (list.children.length >= 10) {
    showToast('メンバーは最大10人まで追加できます');
    return;
  }

  memberCount++;
  const row = document.createElement('div');
  row.className = 'member-row';
  row.innerHTML = `
    <input type="text" class="member-name" placeholder="名前" value="${name}">
    <div class="member-date-compact">
      <input type="number" class="member-year" placeholder="年" value="${year}" min="1920" max="2026">
      <span>/</span>
      <input type="number" class="member-month" placeholder="月" value="${month}" min="1" max="12">
      <span>/</span>
      <input type="number" class="member-day" placeholder="日" value="${day}" min="1" max="31">
    </div>
    <button class="btn-remove-member" onclick="removeMemberRow(this)">×</button>
  `;
  list.appendChild(row);
}

// ---- メンバー行削除 ----
function removeMemberRow(btn) {
  const row = btn.closest('.member-row');
  if (row) row.remove();
}

// ---- グループ分析実行 ----
function runGroupAnalysis() {
  const rows = document.querySelectorAll('#memberList .member-row');
  const members = [];

  rows.forEach(row => {
    const name = row.querySelector('.member-name').value.trim();
    const year = parseInt(row.querySelector('.member-year').value);
    const month = parseInt(row.querySelector('.member-month').value);
    const day = parseInt(row.querySelector('.member-day').value);

    if (validateDate(year, month, day)) {
      const result = diagnose(year, month, day);
      result.name = name || `メンバー${members.length + 1}`;
      members.push(result);
    }
  });

  if (members.length < 2) {
    showToast('2人以上のメンバーを入力してください');
    return;
  }

  showLoading();

  setTimeout(() => {
    renderGroupResult(members);
    hideLoading();
    document.getElementById('groupResult').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('groupResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, 1000);
}

// ---- グループ結果描画 ----
function renderGroupResult(members) {
  const groupName = document.getElementById('groupName').value.trim() || 'このグループ';

  // タイトル
  document.getElementById('groupResultTitle').textContent = `${groupName}の月太陽地球バランス`;

  // グループ集計
  const moonMembers = members.filter(m => m.groupData.id === 'MOON');
  const earthMembers = members.filter(m => m.groupData.id === 'EARTH');
  const sunMembers = members.filter(m => m.groupData.id === 'SUN');

  document.getElementById('moonCountLabel').textContent = moonMembers.length;
  document.getElementById('earthCountLabel').textContent = earthMembers.length;
  document.getElementById('sunCountLabel').textContent = sunMembers.length;

  // 円グラフ
  drawPieChart(moonMembers.length, earthMembers.length, sunMembers.length);

  // メンバーカード
  renderMemberCards(members);

  // 関係性フォーカス
  renderRelationshipFocus(members);

  // 役割分析
  renderRoleAnalysis(members);

  // なぜこのグループは尊いのか
  const preciousText = generatePreciousText(members, groupName);
  document.getElementById('preciousText').textContent = preciousText;
}

// ---- 関係性フォーカス（誰が軸？誰が空気を変える？） ----
function renderRelationshipFocus(members) {
  // 1. 軸（絶対的支柱）の選定
  const earthMembers = members.filter(m => m.groupData.id === 'EARTH');
  let axisMember = null;
  let axisDesc = '';

  if (earthMembers.length > 0) {
    // 地球グループでleader + strategistが最も高いメンバー
    axisMember = earthMembers.reduce((max, m) => {
      const score = m.profile.roles.leader + m.profile.roles.strategist;
      const maxScore = max.profile.roles.leader + max.profile.roles.strategist;
      return score > maxScore ? m : max;
    }, earthMembers[0]);
    axisDesc = `有言実行で物事を形にする地球グループの${axisMember.name}さんが全体の軸。ブレない安定感と冷静な判断力で、グループの精神的支柱となっています。`;
  } else {
    // 全体でleader + strategistが最も高いメンバー
    axisMember = members.reduce((max, m) => {
      const score = m.profile.roles.leader + m.profile.roles.strategist;
      const maxScore = max.profile.roles.leader + max.profile.roles.strategist;
      return score > maxScore ? m : max;
    }, members[0]);
    axisDesc = `高い実行力と知性を備えた${axisMember.name}さんがグループの軸。ここぞという時に頼りになる、チームの方向性を決定づける存在です。`;
  }

  // 2. 空気を変える存在の選定
  const sunMembers = members.filter(m => m.groupData.id === 'SUN');
  const moonMembers = members.filter(m => m.groupData.id === 'MOON');
  let changerMember = null;
  let changerDesc = '';

  if (sunMembers.length > 0) {
    // 太陽グループでcharisma + moodが最も高いメンバー（起爆剤）
    changerMember = sunMembers.reduce((max, m) => {
      const score = m.profile.roles.charisma + m.profile.roles.mood;
      const maxScore = max.profile.roles.charisma + max.profile.roles.mood;
      return score > maxScore ? m : max;
    }, sunMembers[0]);
    changerDesc = `感性とオーラにあふれる太陽グループの${changerMember.name}さんが起爆剤。その場のノリや圧倒的な華やかさで、グループの雰囲気を一瞬で変える力を持っています。`;
  } else if (moonMembers.length > 0) {
    // 月グループでhealer + moodが最も高いメンバー（癒やし）
    changerMember = moonMembers.reduce((max, m) => {
      const score = m.profile.roles.healer + m.profile.roles.mood;
      const maxScore = max.profile.roles.healer + max.profile.roles.mood;
      return score > maxScore ? m : max;
    }, moonMembers[0]);
    changerDesc = `共感力に優れた月グループの${changerMember.name}さんが癒やし・空気清浄機。メンバーに寄り添い、張り詰めた空気をほぐす柔らかな雰囲気作りでグループを支えます。`;
  } else {
    // 全体でmoodが最も高いメンバー
    changerMember = members.reduce((max, m) => {
      return m.profile.roles.mood > max.profile.roles.mood ? m : max;
    }, members[0]);
    changerDesc = `抜群の愛嬌とサービス精神を持つ${changerMember.name}さんがムードメーカー。常に楽しさを追求する姿勢で、グループに笑顔と活気を与える存在です。`;
  }

  // 反映
  document.getElementById('focusAxisMember').textContent = `${axisMember.profile.emoji} ${axisMember.name}`;
  document.getElementById('focusAxisDesc').textContent = axisDesc;
  document.getElementById('focusChangerMember').textContent = `${changerMember.profile.emoji} ${changerMember.name}`;
  document.getElementById('focusChangerDesc').textContent = changerDesc;
}

// ---- メンバーカード描画 ----
function renderMemberCards(members) {
  const container = document.getElementById('memberCards');
  container.innerHTML = '';

  members.forEach(m => {
    const card = document.createElement('div');
    card.className = 'member-card';

    const groupColors = {
      MOON: { bg: 'rgba(217, 166, 161, 0.12)', color: '#7B6658', border: 'rgba(217, 166, 161, 0.35)' },
      EARTH: { bg: 'rgba(168, 178, 161, 0.12)', color: '#7B6658', border: 'rgba(168, 178, 161, 0.3)' },
      SUN: { bg: 'rgba(200, 185, 160, 0.15)', color: '#7B6658', border: 'rgba(200, 185, 160, 0.45)' },
    };
    const gc = groupColors[m.groupData.id];

    card.innerHTML = `
      <div class="member-card-emoji">${m.profile.emoji}</div>
      <div class="member-card-name">${m.name}</div>
      <div class="member-card-char">${m.name.length > 0 ? m.animal + 'タイプ' : m.name}</div>
      <div class="member-card-group" style="background:${gc.bg};color:${gc.color};border:1px solid ${gc.border}">
        ${m.groupData.emoji} ${m.groupData.name}
      </div>
    `;
    container.appendChild(card);
  });
}

// ---- 役割分析 ----
function renderRoleAnalysis(members) {
  const container = document.getElementById('roleGrid');
  container.innerHTML = '';

  const roleKeys = ['leader', 'mood', 'strategist', 'healer', 'charisma'];

  roleKeys.forEach(key => {
    const roleInfo = ROLE_LABELS[key];
    // 最高スコアのメンバーを見つける
    const topMember = members.reduce((max, m) => {
      return m.profile.roles[key] > max.profile.roles[key] ? m : max;
    }, members[0]);

    const item = document.createElement('div');
    item.className = 'role-item';
    item.innerHTML = `
      <div class="role-icon">${roleInfo.emoji}</div>
      <div class="role-name">${roleInfo.name}</div>
      <div class="role-person">${topMember.name}</div>
    `;
    container.appendChild(item);
  });
}

// ---- 円グラフ（Canvas） ----
function drawPieChart(moon, earth, sun) {
  const canvas = document.getElementById('pieChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const radius = size * 0.4;
  const total = moon + earth + sun;

  ctx.clearRect(0, 0, size, size);

  if (total === 0) return;

  const segments = [
    { value: moon, color: '#D9A6A1', label: '月' },     // ダスティピンク
    { value: earth, color: '#A8B2A1', label: '地球' },    // セージグリーン
    { value: sun, color: '#C8B9A0', label: '太陽' },      // ニュアンスベージュ
  ].filter(s => s.value > 0);

  let startAngle = -Math.PI / 2;

  segments.forEach(segment => {
    const sliceAngle = (segment.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    // メインスライス
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.fill();

    // 白い境界線（ウォームアイボリー）
    ctx.strokeStyle = '#F6F1EA';
    ctx.lineWidth = 3;
    ctx.stroke();

    // ラベル
    if (segment.value > 0) {
      const midAngle = startAngle + sliceAngle / 2;
      const labelR = radius * 0.65;
      const lx = center + labelR * Math.cos(midAngle);
      const ly = center + labelR * Math.sin(midAngle);

      ctx.font = '700 24px "Zen Kaku Gothic New", sans-serif';
      ctx.fillStyle = '#7B6658';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 影（薄くする）
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.fillText(segment.value, lx, ly);
      ctx.shadowBlur = 0;
    }

    startAngle = endAngle;
  });

  // 中央の円（ドーナツ型・ウォームアイボリー）
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#F6F1EA';
  ctx.fill();

  // 中央テキスト
  ctx.font = '700 28px "Zen Kaku Gothic New", sans-serif';
  ctx.fillStyle = '#7B6658';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total, center, center - 10);

  ctx.font = '500 16px "Zen Kaku Gothic New", sans-serif';
  ctx.fillStyle = '#7B6658';
  ctx.fillText('人', center, center + 18);
}

// ---- グループ結果シェア ----
function shareGroupResult() {
  const groupName = document.getElementById('groupName').value.trim() || 'グループ';
  const preciousText = document.getElementById('preciousText').textContent;

  const text = `【推しグループ考察 by 動物キャラナビ】\n\n${groupName}の関係性を個性心理学で分析！\n\n${preciousText.substring(0, 150)}…\n\n#動物キャラナビ #推し活 #グループ考察\n`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('結果をコピーしました！SNSでシェアしてね 🚀');
  }).catch(() => {
    prompt('結果をコピーしてシェアしてください：', text);
  });
}
