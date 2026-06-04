/* ============================================================
 * 12のアニマル気質AIマネジメント・コンパニオン
 * フロントエンドUI制御ロジック (main.js)
 * ============================================================ */

// 状態管理
let members = [];
let groups = [];
let activeMember = null;
let activeGroup = null;
let currentTab = 'personal'; // 'personal' または 'group'
let chatHistories = {}; // チャット履歴 { 'member_x' or 'group_y': [{role, content}] }
let apiKeyStatus = { openai: false, gemini: false };
let isLocalMock = false; // ローカルでのデモ動作モード

// 読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
  detectEnvironment();
  loadInitialData();
  setupEventListeners();
  initGroupFormRows(); // グループ登録用の初期メンバー行を準備
});

// 匿名メンバーデータから詳細キャラクターデータを復元する（生年月日を完全に持たないセキュア設計）
function mountMemberDetails(rawMember) {
  const charNum = rawMember.essentialNumber;
  const surfaceAnimal = rawMember.surfaceAnimal;
  const surfaceJui = rawMember.surfaceJui;
  
  const essentialData = CHARACTER_TABLE[charNum - 1];
  const essentialProfile = ANIMAL_PROFILES[essentialData.animal];
  const surfaceProfile = ANIMAL_PROFILES[surfaceAnimal];
  
  return {
    index: rawMember.index,
    name: rawMember.name,
    isTemporary: rawMember.isTemporary || false, // 一時使い切り診断フラグ
    essential: {
      number: charNum,
      animal: essentialData.animal,
      name: essentialData.name,
      spell: essentialData.spell,
      group: GROUPS[essentialData.group],
      profile: essentialProfile
    },
    surface: {
      animal: surfaceAnimal,
      jui: surfaceJui,
      group: GROUPS[surfaceProfile.group],
      profile: surfaceProfile
    },
    memo: rawMember.memo
  };
}

// 匿名グループデータから詳細メンバー情報を復元する
function mountGroupDetails(rawGroup) {
  const mountedMembers = rawGroup.members.map(m => {
    const details = diagnoseByNumber(m.essentialNumber);
    return {
      name: m.name,
      essentialNumber: parseInt(m.essentialNumber, 10),
      essential: details.essential,
      memo: m.memo || ''
    };
  });

  return {
    index: rawGroup.index,
    name: rawGroup.name,
    type: rawGroup.type, // 'oshi' または 'team'
    members: mountedMembers
  };
}

// 実行環境の検出 (GAS上か、ローカルファイルブラウザか)
function detectEnvironment() {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    isLocalMock = false;
    console.log("GAS環境を検出しました。ライブデータを接続します。");
  } else {
    isLocalMock = true;
    console.log("ローカル環境を検出しました。モックデータで動作します。");
    // ローカルデモ用のダミーデータを挿入
    members = getLocalMockMembers();
    groups = getLocalMockGroups();
  }
}

// 初期データのロード
function loadInitialData() {
  // 保存されている自分の生年月日があればフォームに復元
  const savedMyBirth = localStorage.getItem('myBirthDate');
  if (savedMyBirth) {
    const myBirthInputs = ['quickMyBirthDate', 'myBirthDate'];
    myBirthInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = savedMyBirth;
    });
  }

  if (isLocalMock) {
    // ローカル環境のAPIキーステータス検出 (localStorageから安全に読み込み)
    apiKeyStatus.openai = !!localStorage.getItem('openai_api_key');
    apiKeyStatus.gemini = !!localStorage.getItem('gemini_api_key');

    renderMemberList();
    renderGroupList();
    updateApiKeyIndicators();
  } else {
    // GASバックエンドからデータを取得
    showGlobalLoading(true);
    
    // APIキーステータスの取得
    google.script.run
      .withSuccessHandler(status => {
        apiKeyStatus = status;
        updateApiKeyIndicators();
      })
      .getApiKeyStatus();
      
    // メンバー一覧の取得
    google.script.run
      .withSuccessHandler(data => {
        members = data.map(mountMemberDetails);
        renderMemberList();
        showGlobalLoading(false);
      })
      .withFailureHandler(err => {
        alert("データの取得に失敗しました: " + err.message);
        showGlobalLoading(false);
      })
      .getMembers();

    // グループ一覧の取得
    google.script.run
      .withSuccessHandler(data => {
        groups = data.map(mountGroupDetails);
        renderGroupList();
      })
      .getGroups();
  }
}

// イベントリスナーのセットアップ
function setupEventListeners() {
  // メッセージ送信
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 設定モーダルの開閉
  document.getElementById('settingsBtn').addEventListener('click', showSettingsModal);
  document.getElementById('closeSettings').addEventListener('click', hideSettingsModal);
  
  // メンバー追加モーダルの開閉
  document.getElementById('addMemberBtn').addEventListener('click', showAddMemberModal);
  document.getElementById('closeAddMember').addEventListener('click', hideAddMemberModal);
  
  // グループ登録モーダルの開閉
  document.getElementById('addGroupBtn').addEventListener('click', showAddGroupModal);
  document.getElementById('closeAddGroup').addEventListener('click', hideAddGroupModal);
  document.getElementById('addMemberRowBtn').addEventListener('click', () => addMemberRow());

  // タブ切り替え
  document.getElementById('tabPersonal').addEventListener('click', () => switchTab('personal'));
  document.getElementById('tabGroup').addEventListener('click', () => switchTab('group'));

  // クイック一時診断
  document.getElementById('quickDiagBtn').addEventListener('click', runQuickDiagnostic);
  
  // フォーム送信
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
  document.getElementById('addMemberForm').addEventListener('submit', submitAddMember);
  document.getElementById('addGroupForm').addEventListener('submit', submitAddGroup);
}

// ============================================================
// 👥 タブ切り替え制御
// ============================================================
function switchTab(tab) {
  currentTab = tab;
  
  // タブボタンのアクティブ状態切り替え
  document.getElementById('tabPersonal').classList.toggle('active', tab === 'personal');
  document.getElementById('tabGroup').classList.toggle('active', tab === 'group');
  
  // リストセクションの表示切り替え
  document.getElementById('personalSection').classList.toggle('active', tab === 'personal');
  document.getElementById('groupSection').classList.toggle('active', tab === 'group');

  // チャット画面のリセット（未選択状態にする）
  resetChatDisplay();
}

function resetChatDisplay() {
  activeMember = null;
  activeGroup = null;
  
  // アバターや名前の表示リセット
  document.getElementById('activeAvatar').innerText = '🔮';
  document.getElementById('activeName').innerText = 'お相手を選択して相性を占う';
  document.getElementById('activeBadges').innerHTML = '';
  
  // チャット入力欄とチャットメッセージを非表示にし、ウェルカム画面を表示
  document.getElementById('chatMessages').style.display = 'none';
  document.getElementById('chatInputArea').style.display = 'none';
  document.getElementById('welcomeScreen').style.display = 'flex';
  
  // リストのアクティブ背景を解除するため再描画
  renderMemberList();
  renderGroupList();
}

// ============================================================
// 👥 メンバーリスト描画 ＆ 管理
// ============================================================

function renderMemberList() {
  const container = document.getElementById('memberList');
  container.innerHTML = '';
  
  if (members.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
        登録されたお相手がまだいません。<br>下のボタンから追加してください。
      </div>
    `;
    return;
  }
  
  members.forEach(member => {
    const item = document.createElement('div');
    item.className = `member-item ${activeMember && activeMember.index === member.index ? 'active' : ''}`;
    
    // アイテムクリックで選択
    item.onclick = (e) => {
      if (e.target.closest('.delete-btn')) return;
      selectMember(member);
    };
    
    item.innerHTML = `
      <div class="member-avatar">${member.essential.profile.emoji}</div>
      <div class="member-info">
        <div class="member-name">${member.name}</div>
        <div class="member-meta">
          <span>本質: ${member.essential.animal}</span>
          <span>•</span>
          <span>表面: ${member.surface.animal}</span>
        </div>
      </div>
      <button class="delete-btn" title="削除" onclick="deleteMemberHandler(${member.index})">×</button>
    `;
    container.appendChild(item);
  });
}

function selectMember(member) {
  // 自分自身の特性データを localStorage の生年月日情報から算出・結合する
  const savedMyBirth = localStorage.getItem('myBirthDate');
  if (savedMyBirth) {
    const myYear = parseInt(savedMyBirth.substring(0,4));
    const myMonth = parseInt(savedMyBirth.substring(5,7));
    const myDay = parseInt(savedMyBirth.substring(8,10));
    const myDetails = diagnoseDetails(myYear, myMonth, myDay);
    member.myEssential = myDetails.essential;
    member.mySurface = myDetails.surface;
  } else {
    // 登録がない場合は仮データ
    member.myEssential = { number: 0, animal: '未設定', name: '自分' };
    member.mySurface = { animal: '未設定' };
  }

  activeMember = member;
  activeGroup = null;
  
  renderMemberList(); // アクティブ状態の背景を反映
  renderGroupList();
  
  // チャットヘッダーの更新
  document.getElementById('activeAvatar').innerText = member.essential.profile.emoji;
  document.getElementById('activeName').innerText = `${member.name} 💖 あなた の相性診断`;
  
  const badgeArea = document.getElementById('activeBadges');
  badgeArea.innerHTML = `
    <span class="badge badge-essential" style="background-color: rgba(139, 92, 246, 0.05); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.12);">
      本質: ${member.essential.name}
    </span>
    <span class="badge badge-surface" style="background-color: rgba(6, 182, 212, 0.05); color: #06b6d4; border: 1px solid rgba(6, 182, 212, 0.12);">
      表面: ${member.surface.animal} (${member.surface.jui})
    </span>
  `;
  
  // 表示の切り替え
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('chatMessages').style.display = 'block';
  document.getElementById('chatInputArea').style.display = 'block';
  
  renderChatMessages();
}

function deleteMemberHandler(index) {
  if (!confirm("本当にこのメンバーを削除しますか？")) return;
  
  if (isLocalMock) {
    members = members.filter(m => m.index !== index);
    renderMemberList();
    if (activeMember && activeMember.index === index) {
      resetChatDisplay();
    }
  } else {
    showGlobalLoading(true);
    google.script.run
      .withSuccessHandler(data => {
        members = data.map(mountMemberDetails);
        renderMemberList();
        if (activeMember && activeMember.index === index) {
          resetChatDisplay();
        }
        showGlobalLoading(false);
      })
      .withFailureHandler(err => {
        alert("削除に失敗しました: " + err.message);
        showGlobalLoading(false);
      })
      .deleteMember(index);
  }
}

// ============================================================
// 👥 グループリスト描画 ＆ 管理
// ============================================================

function renderGroupList() {
  const container = document.getElementById('groupList');
  container.innerHTML = '';
  
  if (groups.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
        登録されたグループがありません。<br>下のボタンから追加してください。
      </div>
    `;
    return;
  }
  
  groups.forEach(group => {
    const item = document.createElement('div');
    item.className = `member-item ${activeGroup && activeGroup.index === group.index ? 'active' : ''}`;
    
    item.onclick = (e) => {
      if (e.target.closest('.delete-btn')) return;
      selectGroup(group);
    };
    
    // グループメンバーの絵文字を並べる
    const emojis = group.members.map(m => m.essential.profile.emoji).join('');
    const typeLabel = group.type === 'oshi' ? '👑 推し' : '💼 チーム';
    
    item.innerHTML = `
      <div class="member-avatar">👥</div>
      <div class="member-info">
        <div class="member-name">${group.name}</div>
        <div class="member-meta">
          <span>${typeLabel}</span>
          <span>•</span>
          <span style="font-size: 10px; letter-spacing: 1px;">${emojis}</span>
        </div>
      </div>
      <button class="delete-btn" title="削除" onclick="deleteGroupHandler(${group.index})">×</button>
    `;
    container.appendChild(item);
  });
}

function selectGroup(group) {
  activeGroup = group;
  activeMember = null;
  
  renderMemberList();
  renderGroupList();
  
  // チャットヘッダーの更新
  document.getElementById('activeAvatar').innerText = '👥';
  document.getElementById('activeName').innerText = `${group.name} 🌟 全体相性診断`;
  
  // メンバー全員のバッジをヘッダーに配置
  const badgeArea = document.getElementById('activeBadges');
  badgeArea.innerHTML = '';
  group.members.forEach(m => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.style.cssText = `background-color: rgba(139, 92, 246, 0.05); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.12); font-size: 10px; padding: 2px 6px;`;
    badge.innerText = `${m.name} (${m.essential.animal})`;
    badgeArea.appendChild(badge);
  });
  
  // 表示の切り替え
  document.getElementById('welcomeScreen').style.display = 'none';
  document.getElementById('chatMessages').style.display = 'block';
  document.getElementById('chatInputArea').style.display = 'block';
  
  renderChatMessages();
}

function deleteGroupHandler(index) {
  if (!confirm("本当にこのグループを削除しますか？")) return;
  
  if (isLocalMock) {
    groups = groups.filter(g => g.index !== index);
    renderGroupList();
    if (activeGroup && activeGroup.index === index) {
      resetChatDisplay();
    }
  } else {
    showGlobalLoading(true);
    google.script.run
      .withSuccessHandler(data => {
        groups = data.map(mountGroupDetails);
        renderGroupList();
        if (activeGroup && activeGroup.index === index) {
          resetChatDisplay();
        }
        showGlobalLoading(false);
      })
      .withFailureHandler(err => {
        alert("グループの削除に失敗しました: " + err.message);
        showGlobalLoading(false);
      })
      .deleteGroup(index);
  }
}

// ============================================================
// 👥 グループモーダル内フォーム動的制御
// ============================================================

function initGroupFormRows() {
  const container = document.getElementById('groupMembersContainer');
  if (!container) return;
  container.innerHTML = '';
  addMemberRow();
  addMemberRow();
}

function addMemberRow() {
  const container = document.getElementById('groupMembersContainer');
  if (!container) return;
  const rowCount = container.children.length;
  
  const row = document.createElement('div');
  row.className = 'group-member-row';
  row.dataset.index = rowCount;
  
  // アニマル番号 1〜60 のセレクトオプション生成
  let optionsHtml = '<option value="" disabled selected>選択してください</option>';
  CHARACTER_TABLE.forEach(char => {
    optionsHtml += `<option value="${char.n}">${char.n}: ${char.name} (${char.group})</option>`;
  });
  
  row.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
      <label class="form-label" style="font-size: 10px;">名前 / 仮名</label>
      <input type="text" class="form-input member-name-input" placeholder="例: メンバー${String.fromCharCode(65 + rowCount)}" required style="height: 32px; font-size: 12px; padding: 4px 8px;">
    </div>
    <div style="flex: 1.5; display: flex; flex-direction: column; gap: 4px;">
      <label class="form-label" style="font-size: 10px;">アニマル番号 (1〜60)</label>
      <select class="form-input member-num-input" required style="height: 32px; font-size: 12px; padding: 4px 8px;">
        ${optionsHtml}
      </select>
    </div>
    <div style="flex: 1.5; display: flex; flex-direction: column; gap: 4px;">
      <label class="form-label" style="font-size: 10px;">メモ (任意)</label>
      <input type="text" class="form-input member-memo-input" placeholder="例: リーダー役" style="height: 32px; font-size: 12px; padding: 4px 8px;">
    </div>
    <button type="button" class="remove-member-row-btn" onclick="removeMemberRow(this)">×</button>
  `;
  
  container.appendChild(row);
  updateRemoveButtonsVisibility();
}

function removeMemberRow(button) {
  const container = document.getElementById('groupMembersContainer');
  if (container.children.length <= 2) {
    alert("グループ診断には最低2名のメンバーが必要です。");
    return;
  }
  const row = button.closest('.group-member-row');
  row.remove();
  updateRemoveButtonsVisibility();
}

function updateRemoveButtonsVisibility() {
  const container = document.getElementById('groupMembersContainer');
  if (!container) return;
  const buttons = container.querySelectorAll('.remove-member-row-btn');
  buttons.forEach(btn => {
    btn.style.display = container.children.length <= 2 ? 'none' : 'flex';
  });
}

// ============================================================
// 👥 モーダル表示制御
// ============================================================

function showAddMemberModal() {
  document.getElementById('addMemberModal').classList.add('active');
}
function hideAddMemberModal() {
  document.getElementById('addMemberModal').classList.remove('active');
  document.getElementById('addMemberForm').reset();
}

function showAddGroupModal() {
  document.getElementById('addGroupModal').classList.add('active');
  initGroupFormRows(); // モーダルを開くたびに入力欄を初期状態にリセット
}
function hideAddGroupModal() {
  document.getElementById('addGroupModal').classList.remove('active');
  document.getElementById('addGroupForm').reset();
}

// ============================================================
// 👥 診断実行 ＆ 新規登録処理
// ============================================================

function runQuickDiagnostic() {
  const myNameInput = document.getElementById('quickMyName');
  const myBirthInput = document.getElementById('quickMyBirthDate');
  const oshiNameInput = document.getElementById('quickOshiName');
  const oshiBirthInput = document.getElementById('quickOshiBirthDate');
  
  const myName = myNameInput.value.trim() || 'あなた';
  const myBirth = myBirthInput.value;
  const oshiName = oshiNameInput.value.trim() || '推しメン';
  const oshiBirth = oshiBirthInput.value;
  
  if (!myBirth || !oshiBirth) {
    alert("自分とお相手の生年月日を両方入力してください。");
    return;
  }
  
  // 自分の生年月日をブラウザに安全にキャッシュ
  localStorage.setItem('myBirthDate', myBirth);
  
  // 自分の診断
  const myYear = parseInt(myBirth.substring(0,4));
  const myMonth = parseInt(myBirth.substring(5,7));
  const myDay = parseInt(myBirth.substring(8,10));
  const myDetails = diagnoseDetails(myYear, myMonth, myDay);
  
  // 相手の診断
  const oshiYear = parseInt(oshiBirth.substring(0,4));
  const oshiMonth = parseInt(oshiBirth.substring(5,7));
  const oshiDay = parseInt(oshiBirth.substring(8,10));
  const oshiDetails = diagnoseDetails(oshiYear, oshiMonth, oshiDay);
  
  // 一時セッションメンバーオブジェクトの構築
  const tempMember = {
    index: 'temp_' + Date.now(), // 一時的な一意キー
    name: oshiName + ' [一時]',
    isTemporary: true,
    myEssential: myDetails.essential,
    mySurface: myDetails.surface,
    essential: oshiDetails.essential,
    surface: oshiDetails.surface,
    memo: 'その場限りの一時セッション診断'
  };
  
  // アクティブメンバーに設定して画面遷移
  switchTab('personal');
  selectMember(tempMember);
  
  // 診断後は入力欄をリセット（プライバシー保護）
  oshiBirthInput.value = '';
}

function submitAddMember(e) {
  e.preventDefault();
  
  const myBirth = document.getElementById('myBirthDate').value;
  const name = document.getElementById('newName').value.trim();
  const birthDate = document.getElementById('newBirthDate').value;
  const memo = document.getElementById('newMemo').value.trim();
  
  if (!myBirth || !name || !birthDate) {
    alert("すべての生年月日とお名前を入力してください。");
    return;
  }
  
  // 自分の生年月日をブラウザに保存
  localStorage.setItem('myBirthDate', myBirth);
  
  const year = parseInt(birthDate.substring(0,4));
  const month = parseInt(birthDate.substring(5,7));
  const day = parseInt(birthDate.substring(8,10));
  
  // 相手の特性を算出
  const details = diagnoseDetails(year, month, day);
  
  if (isLocalMock) {
    const newMember = {
      index: members.length + 1,
      name: name,
      essentialNumber: details.essential.number,
      surfaceAnimal: details.surface.animal,
      surfaceJui: details.surface.jui,
      memo: memo
    };
    members.push(mountMemberDetails(newMember));
    renderMemberList();
    selectMember(members[members.length - 1]);
    hideAddMemberModal();
  } else {
    showGlobalLoading(true);
    google.script.run
      .withSuccessHandler(data => {
        members = data.map(mountMemberDetails);
        renderMemberList();
        // 追加したメンバーを自動選択
        const added = members.find(m => m.name === name);
        if (added) selectMember(added);
        hideAddMemberModal();
        showGlobalLoading(false);
      })
      .withFailureHandler(err => {
        alert("登録に失敗しました: " + err.message);
        showGlobalLoading(false);
      })
      .addMember(name, details.essential.number, details.essential.name, details.surface.animal, details.surface.jui, memo);
  }
}

function submitAddGroup(e) {
  e.preventDefault();
  
  const name = document.getElementById('newGroupName').value.trim();
  const type = document.getElementById('newGroupType').value;
  
  // メンバー行からデータを収集
  const rows = document.querySelectorAll('.group-member-row');
  const groupMembers = [];
  
  for (let row of rows) {
    const memberName = row.querySelector('.member-name-input').value.trim();
    const charNum = row.querySelector('.member-num-input').value;
    const memberMemo = row.querySelector('.member-memo-input').value.trim();
    
    if (!memberName || !charNum) {
      alert("すべてのメンバーの名前と動物番号を入力してください。");
      return;
    }
    
    groupMembers.push({
      name: memberName,
      essentialNumber: parseInt(charNum, 10),
      memo: memberMemo
    });
  }
  
  if (groupMembers.length < 2) {
    alert("グループ診断には最低2名のメンバーが必要です。");
    return;
  }
  
  if (isLocalMock) {
    const newGroup = {
      index: groups.length + 1,
      name: name,
      type: type,
      members: groupMembers
    };
    groups.push(mountGroupDetails(newGroup));
    renderGroupList();
    selectGroup(groups[groups.length - 1]);
    hideAddGroupModal();
  } else {
    showGlobalLoading(true);
    google.script.run
      .withSuccessHandler(data => {
        groups = data.map(mountGroupDetails);
        renderGroupList();
        const added = groups.find(g => g.name === name);
        if (added) selectGroup(added);
        hideAddGroupModal();
        showGlobalLoading(false);
      })
      .withFailureHandler(err => {
        alert("グループの登録に失敗しました: " + err.message);
        showGlobalLoading(false);
      })
      .addGroup(name, type, JSON.stringify(groupMembers));
  }
}

// ============================================================
// 🤖 ローカル直接 API 診断ロジック ＆ プロンプト生成 (フロントエンド移植)
// ============================================================

// フロントエンド用システムプロンプト生成関数 (個人)
function buildSystemPromptLocal(member) {
  const ess = member.essential;
  const surf = member.surface;
  
  const myEss = member.myEssential || { number: 0, animal: '未設定', name: '自分' };
  
  return `あなたは12のアニマル気質診断、心理分析の最高峰スペシャリストであり、気になる「推し」や「お相手」とのコミュニケーションを円滑にする親しみやすいAI診断パートナーです。
相談者（ユーザー）は、登録されたお相手（推し、または気になる人）との相性や効果的な関わり方、仲良くなる方法について悩んでいます。

現在の診断対象ペア情報は以下の通りです：
---
■ 相談者（あなた）の本質特性:
   - 特性タイプ: No.${myEss.number || '未設定'} ${myEss.name || ''} (シンボル: ${myEss.animal || '未設定'})

■ お相手（推し・気になる人）: ${member.name} さん
■ お相手の深層モチベーション（本音・本来の欲求特性・価値観の根底）:
   - 特性タイプ: No.${ess.number} ${ess.name} (シンボル: ${ess.animal})
   - 所属グループ: ${ess.group.name} (${ess.group.emoji})
   - 深層の心理特徴: ${ess.profile.personality}
   - 主な動機付け・価値観: "${ess.profile.keyword}"

■ お相手の表層行動スタイル（外向きの態度・第一印象・コミュニケーションの窓口）:
   - スタイルタイプ: ${surf.animal} (意思決定特性: ${surf.jui})
   - 所属グループ: ${surf.group.name} (${surf.group.emoji})
   - 表層の行動特徴: ${surf.profile.personality}
   - 表層的な行動観: "${surf.profile.keyword}"

■ お相手との関係性やメモ: ${member.memo || '特になし'}
---

【本質特性と表層スタイルのギャップ分析】
お相手は、公の場や第一印象（表層スタイル）では「${surf.animal}」の特性を見せます。
しかし、本音や本当に求めていること（深層モチベーション）では「${ess.animal}」の価値観が根底にあります。
例えば、表向きは${surf.profile.keyword}のように見えても、本音では${ess.profile.keyword}を求めているというギャップが存在します。

【あなたの任務】
相談者からの質問（例：メッセージの送り方、喜ぶプレゼント、仲良くなるきっかけなど）に対し、相談者の本質（${myEss.animal}）とお相手の本音（${ess.animal}）・建前（${surf.animal}）をふまえた、具体的で心が温まる実践的なアプローチを提案してください。

以下の構成で回答してください：
1. **二人の特性・相性分析**: あなた（${myEss.animal}）とお相手（本質: ${ess.animal} / 表面: ${surf.animal}）の価値観のズレや、なぜ魅力的に感じるのか・どうすれ違いやすいかを解説。
2. **お相手を惹きつける具体的なアプローチ**: お相手が本音で喜ぶ関わり方や、メッセージの送り方、効果的な褒め言葉。
3. **エモくて即効性のある声かけ/メッセージ例**: ファンレターやLINE等でそのまま使える、お相手の心に響く「具体的なメッセージテンプレート」。

【重要：コンバージョン導線の挿入】
ユーザーが「もっと深く知りたい」と思った時のために、回答の最後の段落に、自然な流れで「一生モノのプレミアム個別鑑定書（詳細PDF）」を紹介し、必ず [PREMIUM_LINK] という文字列（大カッコを含む）のみを新しい行に出力してください。フロントエンドでこのタグが綺麗な購入バナーに自動変換されます。

回答は、親しみやすく相談者の恋心や推し活を温かく応援するような、プロフェッショナルでエモいトーン（日本語）で、Markdown形式で美しく出力してください。`;
}

// フロントエンド用システムプロンプト生成関数 (グループ)
function buildGroupSystemPromptLocal(group) {
  const typeLabel = group.type === 'oshi' ? '推しグループ' : 'チーム（家族/友人/職場）';
  
  let membersText = '';
  group.members.forEach((m, idx) => {
    membersText += `■ メンバー ${idx + 1}: ${m.name}\n`;
    membersText += `   - 特性タイプ: No.${m.essential.number} ${m.essential.name} (本質: ${m.essential.animal})\n`;
    membersText += `   - 所属グループ: ${m.essential.group.name} (${m.essential.group.emoji})\n`;
    membersText += `   - 本質特徴: ${m.essential.profile.personality}\n`;
    membersText += `   - モチベーション・価値観: "${m.essential.profile.keyword}"\n`;
    if (m.memo) {
      membersText += `   - 役割・メモ: ${m.memo}\n`;
    }
    membersText += `\n`;
  });
  
  return `あなたは12のアニマル気質診断、組織心理学、そして相性診断の最高峰スペシャリストです。
相談者（ユーザー）は、自身が登録した${typeLabel}である「${group.name}」のメンバー同士の関係性、全体のバランス、より良いコミュニケーションやアプローチ方法について相談しています。

グループ名: ${group.name}
診断タイプ: ${typeLabel}

登録されているグループメンバーの情報は以下の通りです：
---
${membersText}
---

【分析・アプローチの指示】
12のアニマル気質の理論に基づき、メンバーそれぞれの本質特性や所属グループ（SUN / MOON / EARTH）のバランスを多角的に分析し、以下のポイントをふまえてアドバイスを構成してください。
1. **グループ全体の特性とエネルギーバランス**:
   SUN（太陽 = 感性・直感）、MOON（月 = 人情・調和）、EARTH（地球 = 現実・成果）の構成比率から見るグループ全体の雰囲気やダイナミクス。
2. **メンバー間の相性・シナジー（相生・相剋の関係）**:
   特に注目すべきコンビ・関係性や、うまく連携するためのヒント、意思疎通で注意すべきギャップ。
3. **グループワーク・人間関係を最大化するための具体的アドバイス**:
   相談内容（メンバーのモチベーション向上、意見調整、応援方法など）に対し、個々の本質特性に響く具体的なコミュニケーション方法や、役割分担の提案。

以下の構成で回答してください：
1. **グループ全体のアニマル気質プロファイリング**: グループ全体の雰囲気、SUN/MOON/EARTHの比率からわかるグループの力学を解説。
2. **メンバー間のキー相性・シナジー分析**: 特に相乗効果の高いコンビや、対立・すれ違いが起きやすいポイントと、その対処法を具体的に解説。
3. **このグループを活性化するアプローチ・メッセージ例**: 会話やメッセージで使える、メンバー全員が納得する具体的な声かけやアプローチのテンプレート。

【重要：コンバージョン導線の挿入】
回答の最後の段落に、自然な流れで「このグループ全員の関係性マップ、一生モノの相性PDF診断レポート」を紹介し、必ず [PREMIUM_LINK] という文字列（大カッコを含む）のみを新しい行に出力してください。フロントエンドでこのタグが綺麗な購入バナーに自動変換されます。

回答は、親しみやすく、グループの活動や関係性を心から応援するような、プロフェッショナルでエモいトーン（日本語）で、Markdown形式で美しく出力してください。`;
}

// OpenAI 直接 API 呼び出し (fetch)
async function callOpenAIDirect(apiKey, systemPrompt, userMessage, history) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const messages = [{ role: 'system', content: systemPrompt }];
  const recentHistory = history.slice(-6);
  recentHistory.forEach(msg => {
    messages.push({ role: msg.role, content: msg.content });
  });
  messages.push({ role: 'user', content: userMessage });
  
  const payload = {
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.7
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(errorJson.error ? errorJson.error.message : 'OpenAI直接通信に失敗しました。');
  }
  
  const resData = await response.json();
  return resData.choices[0].message.content;
}

// Gemini 直接 API 呼び出し (fetch)
async function callGeminiDirect(apiKey, systemPrompt, userMessage, history) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const contents = [];
  const recentHistory = history.slice(-6);
  recentHistory.forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });
  
  const payload = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature: 0.7
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error ? errorJson.error.message : errorText);
    } catch(e) {
      throw new Error(`Gemini直接通信に失敗しました (HTTP ${response.status})`);
    }
  }
  
  const resData = await response.json();
  return resData.candidates[0].content.parts[0].text;
}

// ============================================================
// 💬 チャット画面描画 ＆ メッセージ管理
// ============================================================

function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';
  
  const activeObj = activeMember || activeGroup;
  if (!activeObj) return;
  
  const activeKey = activeMember ? `member_${activeMember.index}` : `group_${activeGroup.index}`;
  const history = chatHistories[activeKey] || [];
  
  if (history.length === 0) {
    let greetText = '';
    
    if (activeMember) {
      // 個人診断の挨拶メッセージ
      greetText = `はじめまして！あなたと**${activeMember.name}さん**の相性を12のアニマル気質で紐解き、関係性を深めるアプローチ方法をご提案します。💖
      
お相手（${activeMember.name}さん）は、表に見せる行動スタイル（表層行動スタイル）が**『${activeMember.surface.animal}タイプ』**で、本音や意思決定の基準（深層モチベーション）が**『${activeMember.essential.animal}タイプ』**となっています。
      
二人の特性ギャップをふまえ、お相手に喜ばれるコミュニケーション方法、ファンレターやメッセージの書き方、心の距離を縮めるコツなど何でもお気軽に相談してくださいね！
      
[PREMIUM_LINK]`;
    } else {
      // グループ診断の挨拶メッセージ
      const typeLabel = activeGroup.type === 'oshi' ? '推しグループ' : 'チーム';
      const listItems = activeGroup.members.map(m => `* **${m.name}さん**: ${m.essential.name} (本質: ${m.essential.animal} / ${m.essential.group.emoji} ${m.essential.group.name})`).join('\n');
      
      // グループグループ（SUN/MOON/EARTH）の構成を集計
      const groupCounts = { SUN: 0, MOON: 0, EARTH: 0 };
      activeGroup.members.forEach(m => {
        if (m.essential.group.id in groupCounts) {
          groupCounts[m.essential.group.id]++;
        }
      });
      
      let atmosphereDesc = '';
      if (groupCounts.SUN > groupCounts.MOON && groupCounts.SUN > groupCounts.EARTH) {
        atmosphereDesc = '「太陽（SUN）チーム」が多めで、直感的でエネルギーが高く、常に新鮮なワクワクを求める華やかでダイナミックな雰囲気を持っています。☀️';
      } else if (groupCounts.MOON > groupCounts.SUN && groupCounts.MOON > groupCounts.EARTH) {
        atmosphereDesc = '「月（MOON）チーム」が多めで、人情味にあふれ、調和や全体のチームワークを非常に大切にするアットホームで温かい雰囲気を持っています。🌙';
      } else if (groupCounts.EARTH > groupCounts.SUN && groupCounts.EARTH > groupCounts.MOON) {
        atmosphereDesc = '「地球（EARTH）チーム」が多めで、非常に現実的で効率性や形になる成果を重んじる、地に足がついた実力派のプロフェッショナルな雰囲気を持っています。🌏';
      } else {
        atmosphereDesc = 'SUN・MOON・EARTHの各グループのバランスが非常に均等で、それぞれの特性が交じり合い、多様な視点とシナジーが生まれやすい黄金バランスを持っています。⚖️';
      }
      
      greetText = `はじめまして！登録された${typeLabel}**『${activeGroup.name}』**メンバー全員の特性を12のアニマル気質で分析し、チームの相性やより良い関係づくりのためのアプローチをご提案します。🌟
      
■ **登録メンバー特性一覧**
${listItems}
      
■ **グループ全体の雰囲気分析**
本質特性グループの比率から見ると、このグループは${atmosphereDesc}
      
グループ全体をまとめるコツや、メンバー間の対立・すれ違い対策、推しグループ内でのコンビ・トリオの相性など、知りたいことを何でもご相談ください！
      
[PREMIUM_LINK]`;
    }
    
    addMessageBubble('ai', greetText, false);
    return;
  }
  
  history.forEach(msg => {
    addMessageBubble(msg.role === 'user' ? 'user' : 'ai', msg.content, false);
  });
  
  scrollToBottom();
}

function addMessageBubble(sender, text, shouldScroll = true) {
  const container = document.getElementById('chatMessages');
  const row = document.createElement('div');
  row.className = `message-row ${sender}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  
  if (sender === 'user') {
    avatar.innerText = '👤';
  } else {
    avatar.innerText = activeMember ? activeMember.essential.profile.emoji : '👥';
  }
  
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = parseMarkdown(text);
  
  row.appendChild(avatar);
  row.appendChild(bubble);
  container.appendChild(row);
  
  if (shouldScroll) {
    scrollToBottom();
  }
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || (!activeMember && !activeGroup)) return;
  
  // 送信中の状態制御
  input.value = '';
  setSendingState(true);
  
  const activeKey = activeMember ? `member_${activeMember.index}` : `group_${activeGroup.index}`;
  
  // ユーザーメッセージの表示と履歴保存
  addMessageBubble('user', text);
  if (!chatHistories[activeKey]) {
    chatHistories[activeKey] = [];
  }
  chatHistories[activeKey].push({ role: 'user', content: text });
  
  // AIプロバイダー（OpenAI or Gemini）の取得
  const provider = document.getElementById('aiModelSelector').value;
  
  if (isLocalMock) {
    // 🟢 ローカル直接API通信の判定（localStorageからキーを取得）
    const localOpenAIKey = localStorage.getItem('openai_api_key');
    const localGeminiKey = localStorage.getItem('gemini_api_key');
    const activeKeyToken = provider === 'openai' ? localOpenAIKey : localGeminiKey;
    
    if (activeKeyToken) {
      // 🟢 本物の API 通信を実行！
      const systemPrompt = activeMember ? buildSystemPromptLocal(activeMember) : buildGroupSystemPromptLocal(activeGroup);
      const apiCall = provider === 'openai' 
        ? callOpenAIDirect(activeKeyToken, systemPrompt, text, chatHistories[activeKey].slice(0, -1))
        : callGeminiDirect(activeKeyToken, systemPrompt, text, chatHistories[activeKey].slice(0, -1));
        
      apiCall
        .then(reply => {
          addMessageBubble('ai', reply);
          chatHistories[activeKey].push({ role: 'assistant', content: reply });
          setSendingState(false);
        })
        .catch(err => {
          addMessageBubble('ai', `⚠️ API通信エラーが発生しました:\n${err.message}\n\n※APIキーの設定、利用制限、またはブラウザのネットワーク接続を確認してください。`);
          setSendingState(false);
        });
    } else {
      // 🟡 キーがない場合はダミーの体験モック応答にフォールバック
      setTimeout(() => {
        let mockReply = '';
        
        if (activeMember) {
          mockReply = `（※体験デモモード：APIキーが設定されていないため、疑似診断をお届けします。右上「⚙️設定」からAPIキーを入力すると、本物のAI相性診断を開始できます！）
        
### 💡 二人の本質特性 ＆ ギャップ相性分析
お相手（${activeMember.name}さん）は、表向き見せる態度が**【${activeMember.surface.animal}】**で、本音（深層モチベーション）が**【${activeMember.essential.animal}】**です。
一見、${activeMember.surface.animal}のようにスマートに振る舞っているかもしれませんが、実は本音では${activeMember.essential.animal}のようなこだわりや熱いパッション、あるいは甘えん坊な一面を秘めています。
あなたの持つ本質特性と照らし合わせると、お相手の「建前」に振り回されず、「本音の求めているもの」をそっと満たしてあげることで、他の人とは一味違う特別な存在として距離を縮めることができます。

### 🎯 距離を縮める具体的なアプローチ
1. **コミュニケーションのコツ**: 表向きのリアクション（${activeMember.surface.animal}）が薄くても心配しないでください。お相手の本音（${activeMember.essential.animal}）に響く言葉（「いつも独自の視点が素敵ですね」「陰ながらのこだわりを見ていました」など）をかけることで、一気に心を許してくれるようになります。
2. **メッセージ（ファンレターやSNS等）のポイント**: お相手の本質キーワードである「${activeMember.essential.animal}」の特性を意識して、形式的ではない、相手の感性やディテールにフォーカスした内容を送るのが最も効果的です。

### 💬 すぐに使えるメッセージ例
> 「${activeMember.name}さん、先日の〇〇でのこだわり、本当に素敵でした！お相手のセンスやこだわりを具体的に褒める言葉を入れてみてください。驚くほど好印象になります！」
        
[PREMIUM_LINK]`;
        } else {
          const typeLabel = activeGroup.type === 'oshi' ? '推しグループ' : 'チーム';
          mockReply = `（※体験デモモード：APIキーが設定されていないため、疑似診断をお届けします。右上「⚙️設定」からAPIキーを入力すると、本物のAI相性診断を開始できます！）
        
### 💡 グループ『${activeGroup.name}』の相性・シナジー分析
12のアニマル気質の本質特性から見ると、この${typeLabel}には非常に多様で個性的なメンバーが集まっています。
特に、メンバー同士の「グループ属性（SUN/MOON/EARTH）」の関係性を見ると、全体の力学が非常に興味深いです。

### 🎯 チームワークを高める（または応援する）ためのポイント
1. **役割分担の黄金比**: SUNグループの直感的エネルギーと、EARTHグループの着実な実行力、MOONグループのチームワーク調和能力がそれぞれ連動することで、誰か一人が無理をすることなく、非常に大きな成果を引き出すことができます。
2. **関係性の注意点**: 感覚で突き進むSUNタイプのメンバーと、計画的な進捗を好むEARTHタイプのメンバーの間で、意思疎通のズレが発生することがあります。その際は、人情派のMOONタイプのメンバーが仲立ちをすることで、衝突を避けて円滑なチームビルディングを行えます。

### 💬 グループ全体へのおすすめアプローチ
* **ミーティングや会話の場**: 最初に全体のビジョン（SUN向け）を語り、その後で具体的なタスクや数字（EARTH向け）を詰め、最後に皆の納得感や心のケア（MOON向け）を確認する順番で進行すると、メンバー全員の満足度が極限まで高まります。
        
[PREMIUM_LINK]`;
        }
        
        addMessageBubble('ai', mockReply);
        chatHistories[activeKey].push({ role: 'assistant', content: mockReply });
        setSendingState(false);
      }, 1500);
    }
  } else {
    // GASバックエンドAI呼び出し
    const targetPayload = activeMember ? activeMember : activeGroup;
    const payload = JSON.parse(JSON.stringify(targetPayload));
    payload.isGroup = !!activeGroup;
    
    google.script.run
      .withSuccessHandler(reply => {
        addMessageBubble('ai', reply);
        chatHistories[activeKey].push({ role: 'assistant', content: reply });
        setSendingState(false);
      })
      .withFailureHandler(err => {
        addMessageBubble('ai', `⚠️ エラーが発生しました:\n${err.message}`);
        setSendingState(false);
      })
      .chatWithAI(payload, text, provider, chatHistories[activeKey]);
  }
}

// 簡易Markdownパーサー
function parseMarkdown(text) {
  let html = text;
  
  // プレミアムリンクプレースホルダーの置き換え
  const premiumCardHtml = `
    <div class="purchase-card">
      <div class="purchase-card-title">🔮 プレミアム詳細鑑定書のご案内</div>
      <div class="purchase-card-desc">
        メンバー全員の深層心理の相性、一生モノの関係性シナジーマップ、具体的なアプローチ方法を網羅した「一生モノのプレミアム関係性診断レポート(PDF)」をご用意しています。より深い分析をご希望の方は、ぜひ以下から詳細をご確認ください。
      </div>
      <a href="https://line.me/R/ti/p/@your_line_id" target="_blank" class="purchase-card-btn" id="premiumLinkChat">
        詳細・購入はこちら（LINE公式へ）
      </a>
    </div>
  `;
  html = html.replace(/\[PREMIUM_LINK\]/g, premiumCardHtml);

  // 引用符 (blockquote) の変換
  html = html.replace(/^>\s+(.*)$/gmi, '<blockquote>$1</blockquote>');
  
  // 太字の変換
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 見出し (h3) の変換
  html = html.replace(/^###\s+(.*)$/gmi, '<h3>$1</h3>');
  
  // リストの変換
  html = html.replace(/^\*\s+(.*)$/gmi, '<li>$1</li>');
  
  // 改行の変換
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// ============================================================
// ⚙️ 設定（APIキー登録）
// ============================================================

function showSettingsModal() {
  document.getElementById('settingsModal').classList.add('active');
  
  // GAS環境の場合、現在の保存ステータスを読み込む
  if (!isLocalMock) {
    google.script.run
      .withSuccessHandler(status => {
        apiKeyStatus = status;
        updateApiKeyIndicators();
      })
      .getApiKeyStatus();
  }
}

function hideSettingsModal() {
  document.getElementById('settingsModal').classList.remove('active');
  document.getElementById('settingsForm').reset();
}

function saveSettings(e) {
  e.preventDefault();
  
  const openaiKey = document.getElementById('openaiKeyInput').value.trim();
  const geminiKey = document.getElementById('geminiKeyInput').value.trim();
  
  if (!openaiKey && !geminiKey) {
    alert("キーが入力されていません。");
    return;
  }
  
  if (isLocalMock) {
    if (openaiKey) {
      localStorage.setItem('openai_api_key', openaiKey);
      apiKeyStatus.openai = true;
    }
    if (geminiKey) {
      localStorage.setItem('gemini_api_key', geminiKey);
      apiKeyStatus.gemini = true;
    }
    updateApiKeyIndicators();
    alert("APIキーをお使いのブラウザ（localStorage）に安全に保存しました！");
    hideSettingsModal();
  } else {
    showGlobalLoading(true);
    google.script.run
      .withSuccessHandler(() => {
        if (openaiKey) apiKeyStatus.openai = true;
        if (geminiKey) apiKeyStatus.gemini = true;
        updateApiKeyIndicators();
        alert("APIキーを安全に保存しました！");
        hideSettingsModal();
        showGlobalLoading(false);
      })
      .withFailureHandler(err => {
        alert("APIキーの保存に失敗しました: " + err.message);
        showGlobalLoading(false);
      })
      .saveApiKeys(openaiKey, geminiKey);
  }
}

function updateApiKeyIndicators() {
  const openaiIndicator = document.getElementById('openaiIndicator');
  const geminiIndicator = document.getElementById('geminiIndicator');
  
  if (apiKeyStatus.openai) {
    openaiIndicator.innerHTML = '<span style="color: #34d399">🟢 登録済み</span>';
  } else {
    openaiIndicator.innerHTML = '<span style="color: #f87171">🔴 未登録</span>';
  }
  
  if (apiKeyStatus.gemini) {
    geminiIndicator.innerHTML = '<span style="color: #34d399">🟢 登録済み</span>';
  } else {
    geminiIndicator.innerHTML = '<span style="color: #f87171">🔴 未登録</span>';
  }
}

// ============================================================
// 🛠️ 画面ユーティリティ
// ============================================================

function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

function setSendingState(sending) {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  
  if (sending) {
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<div class="spinner"></div>';
  } else {
    input.disabled = false;
    sendBtn.disabled = false;
    sendBtn.innerHTML = '⚡';
    input.focus();
  }
}

function showGlobalLoading(show) {
  console.log("Global loading state: " + show);
}

// ローカル用のモックデータ生成 (個人)
function getLocalMockMembers() {
  return [
    {
      index: 1,
      name: "推しメンAさん",
      essentialNumber: 12,
      surfaceAnimal: "黒ひょう",
      surfaceJui: "冠帯",
      memo: "ファンとして応援している大好きなアイドル。ステージ上ではカリスマ感があるが、本質的な性格や喜ぶアプローチ知りたい。"
    },
    {
      index: 2,
      name: "気になるあの人",
      essentialNumber: 45,
      surfaceAnimal: "こじか",
      surfaceJui: "養",
      memo: "最近よく話す気になる人。人見知りでデリケートな一面があるが、もっと仲良くなる方法を分析したい。"
    }
  ].map(mountMemberDetails);
}

// ローカル用のモックデータ生成 (グループ)
function getLocalMockGroups() {
  return [
    {
      index: 1,
      name: "推しナビ５",
      type: "oshi",
      members: [
        { name: "メンバーA", essentialNumber: 12, memo: "センター担当、人気者" },
        { name: "メンバーB", essentialNumber: 24, memo: "クールで職人肌な性格" },
        { name: "メンバーC", essentialNumber: 43, memo: "リーダーでしっかり者" }
      ]
    },
    {
      index: 2,
      name: "開発チーム",
      type: "team",
      members: [
        { name: "自分", essentialNumber: 5, memo: "ディレクター" },
        { name: "山田さん", essentialNumber: 36, memo: "メインエンジニア" },
        { name: "佐藤さん", essentialNumber: 52, memo: "デザイナー" }
      ]
    }
  ].map(mountGroupDetails);
}
