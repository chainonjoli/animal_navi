/**
 * 12のアニマル気質AIマネジメント・コンパニオン
 * Google Apps Script (GAS) バックエンドスクリプト (code.gs)
 * 
 * 役割:
 * 1. WebアプリUIの配信 (doGet)
 * 2. スプレッドシート連携（メンバー・グループ情報の読み書き）
 * 3. OpenAI / Gemini API との通信
 * 4. APIキーのセキュアな保存 (UserProperties)
 */

// ---- Webアプリ公開用エントリーポイント ----
function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('推しナビAI — 12のアニマル気質で占う「推し」との相性診断')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 外部ファイルをHTMLにインクルードするためのヘルパー
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================
// 📊 スプレッドシート連携（データ管理）
// ============================================================

/**
 * スプレッドシートの準備と初期化
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('メンバー管理');
  if (!sheet) {
    sheet = ss.insertSheet('メンバー管理');
    // ヘッダーの設定: 生年月日は絶対に保存しない！
    sheet.appendRow(['名前', '本質特性コード', '本質キャラクター名', '表面キャラクター', 'メモ・役割']);
    // ヘッダーのデザインを少し綺麗にする
    sheet.getRange('A1:E1').setBackground('#f8fafc').setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setColumnWidth(1, 150); // 名前
    sheet.setColumnWidth(2, 120); // 本質特性コード
    sheet.setColumnWidth(3, 200); // 本質キャラクター名
    sheet.setColumnWidth(4, 180); // 表面キャラクター
    sheet.setColumnWidth(5, 300); // メモ・役割
  }
  return sheet;
}

/**
 * メンバー一覧を取得する
 */
function getMembers() {
  const sheet = getOrCreateSheet();
  
  // 既存のシートが古いヘッダーの場合は自動で新しいヘッダーに変換する
  const headerRange = sheet.getRange(1, 1, 1, 5);
  const headerValues = headerRange.getValues()[0];
  if (headerValues[1] === '生年月日') {
    // 古いスキーマを新しいセキュアなスキーマに書き換える
    headerRange.setValues([['名前', '本質特性コード', '本質キャラクター名', '表面キャラクター', 'メモ・役割']]);
    sheet.getRange('A1:E1').setBackground('#f8fafc').setFontWeight('bold').setHorizontalAlignment('center');
  }

  const data = sheet.getDataRange().getValues();
  const members = [];
  
  // 2行目から読み込み
  for (let i = 1; i < data.length; i++) {
    const name = data[i][0];
    let essentialNumberRaw = data[i][1];
    const essentialName = data[i][2] || '';
    const surfaceCharRaw = data[i][3] || '';
    const memo = data[i][4] || '';
    
    if (!name) continue;
    
    // 生年月日データが入っている古い行への対策：数値でない場合は安全なデフォルト値にする
    let essentialNumber = parseInt(essentialNumberRaw, 10);
    if (isNaN(essentialNumber) || essentialNumber < 1 || essentialNumber > 60) {
      essentialNumber = 12; // 安全なデフォルト値 (人気者のゾウ)
    }
    
    // 表面キャラクター文字列 "黒ひょう (冠帯)" から動物名と運星を分離する
    let surfaceAnimal = "黒ひょう";
    let surfaceJui = "冠帯";
    if (surfaceCharRaw) {
      const match = surfaceCharRaw.match(/^([^\s（(]+)\s*[(（]([^)）]+)[)）]/);
      if (match) {
        surfaceAnimal = match[1];
        surfaceJui = match[2];
      } else {
        surfaceAnimal = surfaceCharRaw;
      }
    }
    
    members.push({
      index: i, // 行番号
      name: name,
      essentialNumber: essentialNumber,
      surfaceAnimal: surfaceAnimal,
      surfaceJui: surfaceJui,
      memo: memo
    });
  }
  
  return members;
}

/**
 * 新規メンバーを追加する
 * 生年月日は受け取らず、あらかじめフロントで計算した特性値を受け取る！
 */
function addMember(name, essentialNumber, essentialName, surfaceAnimal, surfaceJui, memo) {
  const sheet = getOrCreateSheet();
  
  sheet.appendRow([
    name,
    essentialNumber,
    essentialName,
    `${surfaceAnimal} (${surfaceJui})`,
    memo || ''
  ]);
  
  return getMembers(); // 最新のリストを返す
}

/**
 * メンバーを削除する
 */
function deleteMember(index) {
  const sheet = getOrCreateSheet();
  sheet.deleteRow(index + 1);
  return getMembers();
}

/**
 * グループ管理シートの準備と初期化
 */
function getOrCreateGroupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('グループ管理');
  if (!sheet) {
    sheet = ss.insertSheet('グループ管理');
    sheet.appendRow(['グループ名', '診断タイプ', 'メンバーデータ(JSON)', '作成日時']);
    sheet.getRange('A1:D1').setBackground('#f8fafc').setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setColumnWidth(1, 180); // グループ名
    sheet.setColumnWidth(2, 150); // 診断タイプ
    sheet.setColumnWidth(3, 400); // メンバーデータ(JSON)
    sheet.setColumnWidth(4, 180); // 作成日時
  }
  return sheet;
}

/**
 * グループ一覧を取得する
 */
function getGroups() {
  const sheet = getOrCreateGroupSheet();
  const data = sheet.getDataRange().getValues();
  const groups = [];
  
  for (let i = 1; i < data.length; i++) {
    const name = data[i][0];
    const type = data[i][1];
    const membersJson = data[i][2];
    
    if (!name) continue;
    
    let members = [];
    try {
      members = JSON.parse(membersJson);
    } catch(e) {
      console.error("JSONのパースに失敗しました:", e);
    }
    
    groups.push({
      index: i, // 行番号
      name: name,
      type: type,
      members: members
    });
  }
  
  return groups;
}

/**
 * グループを新規追加する
 */
function addGroup(name, type, membersJson) {
  const sheet = getOrCreateGroupSheet();
  sheet.appendRow([
    name,
    type,
    membersJson,
    new Date()
  ]);
  return getGroups();
}

/**
 * グループを削除する
 */
function deleteGroup(index) {
  const sheet = getOrCreateGroupSheet();
  sheet.deleteRow(index + 1);
  return getGroups();
}

// ============================================================
// 🔐 セキュアなAPIキー管理 (UserProperties)
// ============================================================

/**
 * APIキーの保存
 */
function saveApiKeys(openaiKey, geminiKey) {
  const props = PropertiesService.getUserProperties();
  if (openaiKey !== undefined) {
    props.setProperty('OPENAI_API_KEY', openaiKey.trim());
  }
  if (geminiKey !== undefined) {
    props.setProperty('GEMINI_API_KEY', geminiKey.trim());
  }
  return { success: true };
}

/**
 * APIキーの設定有無ステータスを取得 (セキュリティのためキー自体はフロントに返さない)
 */
function getApiKeyStatus() {
  const props = PropertiesService.getUserProperties();
  return {
    openai: !!props.getProperty('OPENAI_API_KEY'),
    gemini: !!props.getProperty('GEMINI_API_KEY')
  };
}

// ============================================================
// 🤖 AIチャット通信処理 (OpenAI & Gemini 両対応)
// ============================================================

/**
 * AIとのチャット対話を実行する
 * @param {Object} memberOrGroup 選択された部下またはグループのデータオブジェクト
 * @param {string} userMessage 相談内容
 * @param {string} provider 'openai' または 'gemini'
 * @param {Array} chatHistory 過去のチャット履歴 [{role: 'user'|'assistant', content: '...'}]
 */
function chatWithAI(memberOrGroup, userMessage, provider, chatHistory) {
  const props = PropertiesService.getUserProperties();
  const history = chatHistory || [];
  
  // 1. システムプロンプトの構築（個人かグループかで切り分け）
  let systemPrompt = '';
  if (memberOrGroup.isGroup) {
    systemPrompt = buildGroupSystemPrompt(memberOrGroup);
  } else {
    systemPrompt = buildSystemPrompt(memberOrGroup);
  }
  
  if (provider === 'openai') {
    const apiKey = props.getProperty('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OpenAIのAPIキーが設定されていません。チャットの右上「⚙️設定」から設定してください。');
    return callOpenAI(apiKey, systemPrompt, userMessage, history);
  } else if (provider === 'gemini') {
    const apiKey = props.getProperty('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GeminiのAPIキーが設定されていません。チャットの右上「⚙️設定」から設定してください。');
    return callGemini(apiKey, systemPrompt, userMessage, history);
  } else {
    throw new Error('未対応のAIプロバイダーです。');
  }
}

/**
 * 相談者と対象者（推し・お相手）の行動特性ギャップに基づくシステムプロンプトの動的生成
 */
function buildSystemPrompt(member) {
  const ess = member.essential;
  const surf = member.surface;
  
  // 自分の情報（マウントされている前提。ない場合は未設定）
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

/**
 * グループメンバー全員の本質特性に基づくシステムプロンプトの動的生成
 */
function buildGroupSystemPrompt(group) {
  const typeLabel = group.type === 'oshi' ? '推しグループ' : 'チーム（家族/友人/職場）';
  
  // メンバーリストのテキスト化
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
   相談内容（メンバーのモチベーション向上、意見調整、応援方法など）に対し、個々の本質特性に響く具体的コミュニケーション方法や、役割分担の提案。

以下の構成で回答してください：
1. **グループ全体のアニマル気質プロファイリング**: グループ全体の雰囲気、SUN/MOON/EARTHの比率からわかるグループの力学を解説。
2. **メンバー間のキー相性・シナジー分析**: 特に相乗効果の高いコンビや、対立・すれ違いが起きやすいポイントと、その対処法を具体的に解説。
3. **このグループを活性化するアプローチ・メッセージ例**: 会話やメッセージで使える、メンバー全員が納得する具体的な声かけやアプローチのテンプレート。

【重要：コンバージョン導線の挿入】
回答の最後の段落に、自然な流れで「このグループ全員の関係性マップ、一生モノの相性PDF診断レポート」を紹介し、必ず [PREMIUM_LINK] という文字列（大カッコを含む）のみを新しい行に出力してください。フロントエンドでこのタグが綺麗な購入バナーに自動変換されます。

回答は、親しみやすく、グループの活動や関係性を心から応援するような、プロフェッショナルでエモいトーン（日本語）で、Markdown形式で美しく出力してください。`;
}

// ============================================================
// 📞 OpenAI API 通信
// ============================================================
function callOpenAI(apiKey, systemPrompt, userMessage, history) {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  // メッセージの構築 (履歴を含める)
  const messages = [{ role: 'system', content: systemPrompt }];
  
  // 過去の履歴をマージ (直近6件程度に制限してトークン節約)
  const recentHistory = history.slice(-6);
  recentHistory.forEach(msg => {
    messages.push({ role: msg.role, content: msg.content });
  });
  
  // 最新のユーザーメッセージを追加
  messages.push({ role: 'user', content: userMessage });
  
  const payload = {
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.7
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    const errorJson = JSON.parse(responseText);
    throw new Error('OpenAI API Error: ' + (errorJson.error ? errorJson.error.message : responseText));
  }
  
  const resData = JSON.parse(responseText);
  return resData.choices[0].message.content;
}

// ============================================================
// 📞 Gemini API 通信
// ============================================================
function callGemini(apiKey, systemPrompt, userMessage, history) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
  
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
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  if (responseCode !== 200) {
    try {
      const errorJson = JSON.parse(responseText);
      throw new Error('Gemini API Error: ' + (errorJson.error ? errorJson.error.message : responseText));
    } catch(e) {
      throw new Error('Gemini API Error (HTTP ' + responseCode + '): ' + responseText);
    }
  }
  
  const resData = JSON.parse(responseText);
  return resData.candidates[0].content.parts[0].text;
}
