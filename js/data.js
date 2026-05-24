// ============================================================
// 動物キャラナビ — データベース
// 個性心理学60キャラクター + 相性詳細 + 役割分析 + 推し活テキスト
// ============================================================

// ---- グループ定義 ----
const GROUPS = {
  MOON: {
    id: 'MOON', name: '月グループ', emoji: '🌙',
    color: '#b08bfa', cssClass: 'moon',
    gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    description: '「誰と」を大切にする、心の絆を重んじるチーム。',
    trait: '人間関係重視',
    members: ['こじか', 'たぬき', '黒ひょう', 'ひつじ'],
  },
  EARTH: {
    id: 'EARTH', name: '地球グループ', emoji: '🌍',
    color: '#4dd4a0', cssClass: 'earth',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    description: '「何を」重視する、実力と実績のしっかり者チーム。',
    trait: '目標達成重視',
    members: ['猿', '虎', '子守熊', '狼'],
  },
  SUN: {
    id: 'SUN', name: '太陽グループ', emoji: '☀️',
    color: '#ffb347', cssClass: 'sun',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    description: '「どこで」にこだわる、直感と感性の天才チーム。',
    trait: '状況・場所重視',
    members: ['チータ', 'ライオン', 'ゾウ', 'ペガサス'],
  }
};

// ---- 全60キャラクターテーブル ----
const CHARACTER_TABLE = [
  { n:1,  animal:'チータ',  group:'SUN',   name:'長距離ランナーのチータ',       spell:'草花', jui:'沐浴' },
  { n:2,  animal:'たぬき',  group:'MOON',  name:'社交家のたぬき',               spell:'大樹', jui:'衰' },
  { n:3,  animal:'猿',      group:'EARTH', name:'落ち着きのない猿',             spell:'太陽', jui:'長生' },
  { n:4,  animal:'子守熊',  group:'EARTH', name:'フットワークの軽い子守熊',     spell:'ろうそく', jui:'病' },
  { n:5,  animal:'黒ひょう',group:'MOON',  name:'面倒見のいい黒ひょう',         spell:'山',   jui:'冠帯' },
  { n:6,  animal:'虎',      group:'EARTH', name:'愛情あふれる虎',               spell:'大地', jui:'帝旺' },
  { n:7,  animal:'チータ',  group:'SUN',   name:'全力疾走するチータ',           spell:'金属', jui:'沐浴' },
  { n:8,  animal:'たぬき',  group:'MOON',  name:'磨き上げられたたぬき',         spell:'宝石', jui:'衰' },
  { n:9,  animal:'猿',      group:'EARTH', name:'大きな志をもった猿',           spell:'海',   jui:'長生' },
  { n:10, animal:'子守熊',  group:'EARTH', name:'母性豊かな子守熊',             spell:'雨露', jui:'病' },
  { n:11, animal:'こじか',  group:'MOON',  name:'正直なこじか',                 spell:'草花', jui:'養' },
  { n:12, animal:'ゾウ',    group:'SUN',   name:'人気者のゾウ',                 spell:'大樹', jui:'死' },
  { n:13, animal:'狼',      group:'EARTH', name:'ネアカの狼',                   spell:'太陽', jui:'胎' },
  { n:14, animal:'ひつじ',  group:'MOON',  name:'協調性のないひつじ',           spell:'ろうそく', jui:'墓' },
  { n:15, animal:'猿',      group:'EARTH', name:'どっしりとした猿',             spell:'山',   jui:'長生' },
  { n:16, animal:'子守熊',  group:'EARTH', name:'コアラのなかの子守熊',         spell:'大地', jui:'病' },
  { n:17, animal:'こじか',  group:'MOON',  name:'強い意志をもったこじか',       spell:'金属', jui:'養' },
  { n:18, animal:'ゾウ',    group:'SUN',   name:'デリケートなゾウ',             spell:'宝石', jui:'死' },
  { n:19, animal:'狼',      group:'EARTH', name:'放浪の狼',                     spell:'海',   jui:'胎' },
  { n:20, animal:'ひつじ',  group:'MOON',  name:'物静かなひつじ',               spell:'雨露', jui:'墓' },
  { n:21, animal:'ペガサス',group:'SUN',   name:'落ち着きのあるペガサス',       spell:'草花', jui:'絶' },
  { n:22, animal:'ペガサス',group:'SUN',   name:'強靱な翼をもつペガサス',       spell:'大樹', jui:'絶' },
  { n:23, animal:'ひつじ',  group:'MOON',  name:'無邪気なひつじ',               spell:'太陽', jui:'墓' },
  { n:24, animal:'狼',      group:'EARTH', name:'クリエイティブな狼',           spell:'ろうそく', jui:'胎' },
  { n:25, animal:'狼',      group:'EARTH', name:'穏やかな狼',                   spell:'山',   jui:'胎' },
  { n:26, animal:'ひつじ',  group:'MOON',  name:'粘り強いひつじ',               spell:'大地', jui:'墓' },
  { n:27, animal:'ペガサス',group:'SUN',   name:'波乱に満ちたペガサス',         spell:'金属', jui:'絶' },
  { n:28, animal:'ペガサス',group:'SUN',   name:'優雅なペガサス',               spell:'宝石', jui:'絶' },
  { n:29, animal:'ひつじ',  group:'MOON',  name:'チャレンジ精神の旺盛なひつじ', spell:'海',   jui:'墓' },
  { n:30, animal:'狼',      group:'EARTH', name:'順応性のある狼',               spell:'雨露', jui:'胎' },
  { n:31, animal:'ゾウ',    group:'SUN',   name:'リーダーとなるゾウ',           spell:'草花', jui:'死' },
  { n:32, animal:'こじか',  group:'MOON',  name:'しっかり者のこじか',           spell:'大樹', jui:'養' },
  { n:33, animal:'子守熊',  group:'EARTH', name:'活動的な子守熊',               spell:'太陽', jui:'病' },
  { n:34, animal:'猿',      group:'EARTH', name:'気分屋の猿',                   spell:'ろうそく', jui:'長生' },
  { n:35, animal:'ひつじ',  group:'MOON',  name:'頼られると嬉しいひつじ',       spell:'山',   jui:'墓' },
  { n:36, animal:'狼',      group:'EARTH', name:'好感のもたれる狼',             spell:'大地', jui:'胎' },
  { n:37, animal:'ゾウ',    group:'SUN',   name:'まっしぐらに突き進むゾウ',     spell:'金属', jui:'死' },
  { n:38, animal:'こじか',  group:'MOON',  name:'華やかなこじか',               spell:'宝石', jui:'養' },
  { n:39, animal:'子守熊',  group:'EARTH', name:'夢とロマンの子守熊',           spell:'海',   jui:'病' },
  { n:40, animal:'猿',      group:'EARTH', name:'尽くす猿',                     spell:'雨露', jui:'長生' },
  { n:41, animal:'たぬき',  group:'MOON',  name:'大器晩成のたぬき',             spell:'草花', jui:'衰' },
  { n:42, animal:'チータ',  group:'SUN',   name:'足腰の強いチータ',             spell:'大樹', jui:'沐浴' },
  { n:43, animal:'虎',      group:'EARTH', name:'動きまわる虎',                 spell:'太陽', jui:'帝旺' },
  { n:44, animal:'黒ひょう',group:'MOON',  name:'情熱的な黒ひょう',             spell:'ろうそく', jui:'冠帯' },
  { n:45, animal:'子守熊',  group:'EARTH', name:'サービス精神旺盛な子守熊',     spell:'山',   jui:'病' },
  { n:46, animal:'猿',      group:'EARTH', name:'守りの猿',                     spell:'大地', jui:'長生' },
  { n:47, animal:'たぬき',  group:'MOON',  name:'人間味あふれるたぬき',         spell:'金属', jui:'衰' },
  { n:48, animal:'チータ',  group:'SUN',   name:'品格のあるチータ',             spell:'宝石', jui:'沐浴' },
  { n:49, animal:'虎',      group:'EARTH', name:'ゆったりとした悠然の虎',       spell:'海',   jui:'帝旺' },
  { n:50, animal:'黒ひょう',group:'MOON',  name:'落ち込みの激しい黒ひょう',     spell:'雨露', jui:'冠帯' },
  { n:51, animal:'ライオン',group:'SUN',   name:'我が道を行くライオン',         spell:'草花', jui:'建禄' },
  { n:52, animal:'ライオン',group:'SUN',   name:'統率力のあるライオン',         spell:'大樹', jui:'建禄' },
  { n:53, animal:'黒ひょう',group:'MOON',  name:'感情豊かな黒ひょう',           spell:'太陽', jui:'冠帯' },
  { n:54, animal:'虎',      group:'EARTH', name:'楽天的な虎',                   spell:'ろうそく', jui:'帝旺' },
  { n:55, animal:'虎',      group:'EARTH', name:'パワフルな虎',                 spell:'山',   jui:'帝旺' },
  { n:56, animal:'黒ひょう',group:'MOON',  name:'気取らない黒ひょう',           spell:'大地', jui:'冠帯' },
  { n:57, animal:'ライオン',group:'SUN',   name:'感情的なライオン',             spell:'金属', jui:'建禄' },
  { n:58, animal:'ライオン',group:'SUN',   name:'傷つきやすいライオン',         spell:'宝石', jui:'建禄' },
  { n:59, animal:'黒ひょう',group:'MOON',  name:'束縛を嫌う黒ひょう',           spell:'海',   jui:'冠帯' },
  { n:60, animal:'虎',      group:'EARTH', name:'慈悲深い虎',                   spell:'雨露', jui:'帝旺' },
];

// ---- 動物プロフィール（拡張版：役割スコア＋推し活テキスト付き） ----
const ANIMAL_PROFILES = {
  '狼': {
    emoji: '🐺', group: 'EARTH',
    keyword: '人は人、自分は自分',
    catchphrase: 'やっぱり変わってるね',
    personality: '独特の感性と職人気質。マイペースで天真爛漫な個人主義者。計画通りに進めることを好み、じっくり考えて行動する。',
    love: '自分のペースを乱さない相手が◎。最初は壁があるが、一度心を開くと深い絆を結ぶ。',
    money: '「ドカンと使うが無駄遣いなし」な職人タイプ。',
    vocation: 'クリエイター・プログラマー・専門職・コンサルタント',
    lucky: '好きなことにトコトン打ち込む',
    // 推し活テキスト
    oshiText: 'このタイプの推しは、独自の世界観が魅力。「みんなと同じ」が嫌いで、自分だけのスタイルを貫くからこそ、ファンは沼にハマる。ソロ活動やこだわりのパフォーマンスに注目！',
    // 役割スコア (10点満点)
    roles: { leader: 5, mood: 3, strategist: 8, healer: 4, charisma: 6 },
    subTypes: [13,19,24,25,30,36],
  },
  'こじか': {
    emoji: '🦌', group: 'MOON',
    keyword: '「和」が大事',
    catchphrase: 'どんなときも味方だよ',
    personality: '好奇心旺盛で天然なところがあるが、警戒心も強い。感情や感覚に正直で好き嫌いがハッキリ。子供や動物に好かれる。',
    love: '素直に気持ちを伝えるピュアな恋愛スタイル。押しに弱い一面も。',
    money: 'お金の計算も人任せ気味。金銭管理は少し甘め。',
    vocation: '保育士・心理カウンセラー・ペット関連・教師',
    lucky: '本物に接する（美術品・自然・その道の達人）',
    oshiText: 'このタイプの推しは、天然の愛されキャラ。素直なリアクションや純粋な言動にファンの母性（父性）が覚醒する。「守ってあげたい」と思わせる力がすごい。',
    roles: { leader: 3, mood: 6, strategist: 4, healer: 9, charisma: 5 },
    subTypes: [11,17,32,38],
  },
  '猿': {
    emoji: '🐒', group: 'EARTH',
    keyword: '人生楽しんだ者勝ち',
    catchphrase: '一緒にいると楽しい',
    personality: '愛嬌たっぷりの人気者。なんでもゲーム感覚で楽しみ、勝敗にこだわる。褒められたいから頑張るタイプ。',
    love: 'おだてに乗りやすい。「かわいいね」「スゴいね」が効果抜群！',
    money: '小銭大好き。割り勘は10円単位で几帳面。',
    vocation: 'サービス業・ゲームクリエイター・芸人・パティシエ',
    lucky: '瞑想。ひとりで静かに内観する時間が運気UP',
    oshiText: 'このタイプの推しは、圧倒的エンターテイナー。バラエティでの面白さ、ファンサの器用さ、マルチな才能が光る。「推してて楽しい！」を体現する存在。',
    roles: { leader: 5, mood: 9, strategist: 5, healer: 6, charisma: 7 },
    subTypes: [3,9,15,34,40,46],
  },
  'チータ': {
    emoji: '🐆', group: 'SUN',
    keyword: '生涯を通して華麗なハンター',
    catchphrase: 'キミならきっと成功する',
    personality: '成功願望が強く競争心も強い。何事も果敢に挑戦するが諦めも早い。切り替えが速く過去を引きずらない。',
    love: '「成功」が世界でいちばん好きな言葉。「キミならきっと成功する」が最高のプロポーズ。',
    money: '前向きな浪費家。衝動買いの達人だが後悔しない。',
    vocation: '芸能界・政治家・スポーツ選手・開業医・外交官',
    lucky: '恋愛成就。恋がうまくいくと万事うまくいく',
    oshiText: 'このタイプの推しは、スター性の塊。ステージに立った瞬間のオーラが段違い。「この人は絶対売れる」と直感させるパワーの持ち主。新しい挑戦をし続ける姿がファンを魅了する。',
    roles: { leader: 7, mood: 6, strategist: 5, healer: 3, charisma: 9 },
    subTypes: [1,7,42,48],
  },
  '黒ひょう': {
    emoji: '🐈‍⬛', group: 'MOON',
    keyword: 'スマートでおしゃれな自信家',
    catchphrase: 'センスいいね',
    personality: 'メンツやプライドを重んじる。おしゃれで美意識が高い。正義感が強く不正を許さない。',
    love: '「センスいいね」が最高の褒め言葉。努力は人に見せないクールな一面も。',
    money: '気がついたら「ない！」タイプ。お金は使ってこそ輝く。',
    vocation: 'アナウンサー・ファッションデザイナー・マスコミ・デザイナー',
    lucky: '人生の師を見つける。良き師との出会いで人生が変わる',
    oshiText: 'このタイプの推しは、ビジュアルとセンスの権化。ファッション誌の表紙が似合うし、一挙一動がスタイリッシュ。「推しの美意識を追いかけるのが楽しい」と思わせる存在。',
    roles: { leader: 7, mood: 5, strategist: 7, healer: 4, charisma: 8 },
    subTypes: [5,44,50,53,56,59],
  },
  'ライオン': {
    emoji: '🦁', group: 'SUN',
    keyword: 'オンリーワンよりナンバーワン',
    catchphrase: '特別な人だもん',
    personality: '徹底的にこだわる完璧主義者。責任感が強く、自分の味方は最後まで守る。王様扱いに弱い。',
    love: '「特別な人だもん」が最高の言葉。漠然と愛してくれる人を求める。',
    money: '「釣りはいらない」な大物感。節約も貯蓄もさらっとこなす。',
    vocation: '大手企業・国家公務員・警察官・上場企業・医師',
    lucky: '感性に響いたものを惜しみなく人に伝える',
    oshiText: 'このタイプの推しは、グループの王。存在そのものが「センター」。完璧を目指すストイックさと、仲間を守る兄貴分的な面に、ファンは「ついていきたい」と確信する。',
    roles: { leader: 10, mood: 5, strategist: 6, healer: 3, charisma: 10 },
    subTypes: [51,52,57,58],
  },
  '虎': {
    emoji: '🐯', group: 'EARTH',
    keyword: '有言実行',
    catchphrase: 'キミにしか相談できない',
    personality: '自由・平等・博愛主義。面倒見がよく、親分肌。仕事とプライベートをきっちり分ける。',
    love: '頼られると親分肌・姉御肌が爆発！「キミにしか相談できない」が一番刺さる。',
    money: 'マネーの虎。抜群の金銭感覚の持ち主。',
    vocation: '実業家・企業経営・会計士・プロスポーツ選手',
    lucky: '逆境がバネになる。逃げず、ひるまず、迎え撃って吉！',
    oshiText: 'このタイプの推しは、グループの大黒柱。後輩の面倒見がよく、ステージでは圧倒的パフォーマンスを見せる。「この人がいるから安心」とファンもメンバーも思える柱的存在。',
    roles: { leader: 8, mood: 6, strategist: 7, healer: 5, charisma: 7 },
    subTypes: [6,43,49,54,55,60],
  },
  'たぬき': {
    emoji: '🦝', group: 'MOON',
    keyword: '笑顔は敵をつくらない',
    catchphrase: '一緒にいるとほっとする',
    personality: 'どんな相手とも上手く合わせられる。いつも笑顔で場を和ませ、敵を作りにくい。',
    love: '「一緒にいるとほっとする」が一番のプロポーズ。じわじわ愛が深まるタイプ。',
    money: '財運があるのでお金はまわる。蓄える才能あり。',
    vocation: '司会者・アナウンサー・教師・コンサルタント',
    lucky: '人と会う。老若男女問わず交流すると運気UP',
    oshiText: 'このタイプの推しは、グループの潤滑油。メンバー間の空気を読んで場を和ませる天才。バラエティではMC力を発揮し、ファンからは「実は一番モテそう」と言われがち。',
    roles: { leader: 4, mood: 8, strategist: 6, healer: 8, charisma: 5 },
    subTypes: [2,8,41,47],
  },
  '子守熊': {
    emoji: '🐨', group: 'EARTH',
    keyword: '最後に勝つのは自分',
    catchphrase: '夢は叶うよ',
    personality: 'サービス精神旺盛で人が喜ぶ顔を見るのが好き。損得勘定に長け、倹約家で無駄が嫌い。',
    love: '先制攻撃が一番効果的。すぐに結論を出さないのでじっくり待って。',
    money: '経済観念抜群で財テクも得意。コツコツ型。',
    vocation: 'ミュージシャン・作曲家・声優・アロマセラピスト',
    lucky: '音楽や映画、美術に接していると才能が開花',
    oshiText: 'このタイプの推しは、隠れた才能の持ち主。パフォーマンスへのこだわりが強く、ファンが「推しの成長を見守りたい」と感じるタイプ。サービス精神が旺盛でファン思いなところも魅力。',
    roles: { leader: 4, mood: 6, strategist: 7, healer: 7, charisma: 4 },
    subTypes: [4,10,16,33,39,45],
  },
  'ゾウ': {
    emoji: '🐘', group: 'SUN',
    keyword: '根性だったら負けません',
    catchphrase: 'よく頑張ったね',
    personality: '努力家だが努力している姿は見せない。その道のプロ・職人を目指す。キレたら最も怖い。',
    love: '正面から堂々と攻めましょう。見てくれている人がいるとしみじみ嬉しい。',
    money: '一攫千金のギャンブラー精神。大きな数字に強い。',
    vocation: '国家公務員・政治家・警察官・医師・パイロット',
    lucky: '精神世界に触れる。努力や根性とは違う世界をのぞいてみる',
    oshiText: 'このタイプの推しは、努力を見せない天才肌。裏では誰よりも練習しているのに、表ではさらっとこなす。「この人、実は一番すごいのでは？」とファンが気づいたとき、沼の深さが倍増する。',
    roles: { leader: 7, mood: 4, strategist: 8, healer: 4, charisma: 6 },
    subTypes: [12,18,31,37],
  },
  'ひつじ': {
    emoji: '🐑', group: 'MOON',
    keyword: '仲よきことは美しきかな',
    catchphrase: 'みんなも行くよ',
    personality: '「みんな仲良く」がテーマ。寂しがり屋で一人ぼっちが嫌い。ものを集めるのが好きな情報収集家。',
    love: '「みんなも行くよ」が背中を押す魔法の言葉。フレンドリーな対応が基本。',
    money: '小銭より紙幣が好き。蓄財の達人。',
    vocation: '内科医・心理学者・冠婚葬祭業・カウンセラー',
    lucky: '先祖への感謝。お墓参りを大切にすると加護が強まる',
    oshiText: 'このタイプの推しは、グループの絆を象徴する存在。メンバー愛が深く、「みんなで一緒に」が口癖。ファンとの距離感も絶妙で、「推しているこちらが幸せになる」タイプ。',
    roles: { leader: 3, mood: 7, strategist: 5, healer: 8, charisma: 4 },
    subTypes: [14,20,23,26,29,35],
  },
  'ペガサス': {
    emoji: '🦄', group: 'SUN',
    keyword: '自由奔放',
    catchphrase: 'あなたの感性はスゴイ',
    personality: '感情の落差が激しい気分屋。天才肌で長所はすごいが後は平凡。外国人的な感性を持つ。',
    love: '「あなたの感性はスゴイ」が刺さる。具体的に何がスゴイかは言わなくてよい。',
    money: '財布にも羽が生えている。でもなぜかまわってくる。',
    vocation: '宇宙飛行士・CGクリエイター・アニメーター・パイロット',
    lucky: '多忙に過ごす。忙しく飛び回ることで才能が開花',
    oshiText: 'このタイプの推しは、規格外の天才。何をしでかすか予測不能で、それが最大の魅力。ステージでは別人のようにオーラが変わる。「推しの次の一手が読めない」というスリルがファンを惹きつける。',
    roles: { leader: 5, mood: 7, strategist: 4, healer: 5, charisma: 9 },
    subTypes: [21,22,27,28],
  },
};

// ---- 相性詳細データ ----
// グループ間 × 動物間 の多層的な相性テキスト
const COMPAT_GROUP_DETAIL = {
  // 同グループ
  'MOON_MOON': {
    atmosphere: '心で通じ合う、無言でも安心できる空気感。二人の間には言葉にならない絆がある。',
    roleBalance: 'お互いの気持ちを察し合えるので、自然と役割分担ができる。感情面で支え合える最高のパートナー。',
    emotionalFit: 'どちらも「人」を大切にするタイプ。共感力が高く、一緒にいるだけで心が満たされる関係。',
    oshiComment: '推しとあなたが同じ「月グループ」ということは、推しの気持ちに誰よりも寄り添えるということ。推しが辛い時、あなたの存在が一番の支えになるはず。',
  },
  'EARTH_EARTH': {
    atmosphere: '実力で認め合う、クールだけど熱い空気感。お互いのプロ意識を尊重し合う関係。',
    roleBalance: '目標に向かって一緒に走れる戦友タイプ。結果を出すことで信頼が深まる。',
    emotionalFit: '感情表現は控えめだけど、行動で示す深い愛情。「背中を見て育つ」関係性。',
    oshiComment: '推しとあなたは同じ地球グループ。推しの「結果で示す」姿勢に、あなたは本能的に共感できる。推しの努力を誰よりも理解できるのがあなた。',
  },
  'SUN_SUN': {
    atmosphere: '眩しすぎる二人。お互いが刺激になって、一緒にいると世界が広がる感覚。',
    roleBalance: '直感型同士で予測不能な化学反応。退屈とは無縁のエキサイティングな関係。',
    emotionalFit: '感性で繋がる二人。理屈ではなく「なんかわかる」で通じ合う。',
    oshiComment: '推しもあなたも太陽グループ！感性のアンテナが似ているから、推しの表現やパフォーマンスの意図を直感的に理解できるのが強み。',
  },
  // 異グループ
  'MOON_EARTH': {
    atmosphere: '月が地球を優しく包む、安心感のある空気。月グループの共感力と地球グループの安定感が絶妙。',
    roleBalance: '月が心のケアを、地球が行動力を担当。お互いの足りない部分を自然に補い合える。',
    emotionalFit: '月の繊細さを地球がどっしり受け止める。「この人といると安心する」と感じる関係。',
    oshiComment: '推しの実力主義な面を、あなたの共感力が包み込む関係。推しが頑張っている姿を「わかるよ」と肯定してあげられるのが、月グループのあなたの最大の武器。',
  },
  'EARTH_MOON': {
    atmosphere: '地球の安定感が月を安心させる。しっかり者×繊細さの好バランス。',
    roleBalance: 'あなたが頼れるリーダー役、推しは心の架け橋。二人でチームを組んだら最強。',
    emotionalFit: '推しの繊細な感性に、あなたの行動力が刺激を与える。「この人すごい」と尊敬される関係。',
    oshiComment: 'あなたの行動力と推しの感受性。推しはあなたのような「頼れるファン」の存在に、きっと支えられているはず。',
  },
  'MOON_SUN': {
    atmosphere: '月と太陽は惹かれ合う宿命。正反対だからこそ、お互いに新しい世界を見せてくれる。',
    roleBalance: '月が裏方でサポート、太陽がステージで輝く。「あなたがいるから輝ける」関係。',
    emotionalFit: '太陽の自由さに月が振り回されることも…でもそれが楽しい！新鮮な刺激が続く。',
    oshiComment: '推しの太陽のような輝きに、あなたは月のように惹かれている。推しの自由な表現を「すごい…」と見つめるあなたの視線が、実は推しのエネルギー源かも。',
  },
  'SUN_MOON': {
    atmosphere: '太陽が月を照らすように、あなたの存在が推しの心を温める関係。',
    roleBalance: 'あなたの直感力と推しの共感力。感性と感情の最強コンビ。',
    emotionalFit: '推しの優しさに、あなたの大胆さが加わると化学反応が起きる。互いに刺激的。',
    oshiComment: 'あなたの感性で推しの良さを「言語化」できるのが強み。推しの魅力を的確に伝えられるのは、同じ感覚派の太陽グループだからこそ。',
  },
  'EARTH_SUN': {
    atmosphere: '太陽のエネルギーを地球がしっかり受け止める。安定×情熱の絶妙な組み合わせ。',
    roleBalance: '地球の計画性と太陽の爆発力。「やろうと決めたことは必ず形にする」最強タッグ。',
    emotionalFit: '太陽のテンションに地球が合わせる場面も。でも「この人についていこう」と思える関係。',
    oshiComment: '推しのキラキラした感性を、あなたの地に足ついた視点でしっかり見守れる。推しが暴走しそうな時も「大丈夫」と支えられるのがあなた。',
  },
  'SUN_EARTH': {
    atmosphere: '太陽から見た地球は、安心できる故郷のような存在。推しの安定感があなたに安心を与える。',
    roleBalance: 'あなたの感性と推しの実行力。夢を語るあなたと、形にする推しの最高コンビ。',
    emotionalFit: '推しの堅実さに、あなたは「この人なら信じられる」と感じる。信頼ベースの関係。',
    oshiComment: '推しの有言実行な姿に惹かれているあなた。推しが約束を守る姿、努力を積み重ねる姿に感動できるのは、直感で本質を見抜く太陽グループだから。',
  },
};

// ---- 相性スコアとラベル ----
const COMPATIBILITY = {
  same:    { score: 95, label: '最高の仲間✨', baseAtmosphere: 90, baseRole: 88, baseEmotion: 95 },
  beats:   { score: 80, label: 'あなたがリード🏆', baseAtmosphere: 78, baseRole: 85, baseEmotion: 75 },
  losesTo: { score: 85, label: 'ついていきたい💫', baseAtmosphere: 82, baseRole: 80, baseEmotion: 88 },
};

function getGroupCompatibility(myGroup, theirGroup) {
  if (myGroup === theirGroup) return COMPATIBILITY.same;
  const groupJanken = { MOON: 'EARTH', EARTH: 'SUN', SUN: 'MOON' };
  if (groupJanken[myGroup] === theirGroup) return COMPATIBILITY.beats;
  return COMPATIBILITY.losesTo;
}

function getCompatDetail(myGroup, theirGroup) {
  const key = `${myGroup}_${theirGroup}`;
  return COMPAT_GROUP_DETAIL[key] || COMPAT_GROUP_DETAIL[`${myGroup}_${myGroup}`];
}

// ---- 診断関数 ----
function getCharacterNumber(year, month, day) {
  const base = new Date(1926, 0, 1);
  const target = new Date(year, month - 1, day);
  const diffMs = target.getTime() - base.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const idx0 = ((26 + diffDays) % 60 + 60) % 60;
  return idx0 + 1;
}

function diagnose(year, month, day) {
  const charNum = getCharacterNumber(year, month, day);
  const charData = CHARACTER_TABLE[charNum - 1];
  const profile = ANIMAL_PROFILES[charData.animal];
  return {
    number: charNum,
    ...charData,
    profile,
    groupData: GROUPS[charData.group],
  };
}

// ---- グループ分析用：役割マッチング ----
const ROLE_LABELS = {
  leader: { name: 'リーダー', emoji: '👑', desc: 'チームを率いる統率者' },
  mood: { name: 'ムードメーカー', emoji: '🎪', desc: '場の空気を作る人' },
  strategist: { name: '参謀', emoji: '🧠', desc: '戦略を考える知恵者' },
  healer: { name: '癒し担当', emoji: '💗', desc: 'みんなの心を癒す存在' },
  charisma: { name: 'カリスマ', emoji: '✨', desc: '人を惹きつけるオーラ' },
};

// ---- グループプリセット ----
const GROUP_PRESETS = {
  'King & Prince': [
    { name: '平野紫耀', year: 1997, month: 1, day: 29 },
    { name: '永瀬廉', year: 1999, month: 1, day: 23 },
    { name: '岸優太', year: 1995, month: 9, day: 29 },
    { name: '神宮寺勇太', year: 1997, month: 10, day: 30 },
    { name: '高橋海人', year: 1999, month: 4, day: 3 },
  ],
  'Number_i': [
    { name: '平野紫耀', year: 1997, month: 1, day: 29 },
    { name: '岸優太', year: 1995, month: 9, day: 29 },
    { name: '神宮寺勇太', year: 1997, month: 10, day: 30 },
  ],
  'Snow Man': [
    { name: '岩本照', year: 1993, month: 5, day: 17 },
    { name: '深澤辰哉', year: 1992, month: 5, day: 5 },
    { name: 'ラウール', year: 2003, month: 6, day: 27 },
    { name: '渡辺翔太', year: 1992, month: 11, day: 5 },
    { name: '向井康二', year: 1994, month: 6, day: 21 },
    { name: '阿部亮平', year: 1993, month: 11, day: 27 },
    { name: '目黒蓮', year: 1997, month: 2, day: 16 },
    { name: '宮舘涼太', year: 1993, month: 3, day: 25 },
    { name: '佐久間大介', year: 1992, month: 7, day: 5 },
  ],
};

// ---- 「なぜこのグループは尊いのか」テンプレート ----
function generatePreciousText(members, groupName) {
  const moonCount = members.filter(m => m.groupData.id === 'MOON').length;
  const earthCount = members.filter(m => m.groupData.id === 'EARTH').length;
  const sunCount = members.filter(m => m.groupData.id === 'SUN').length;
  const total = members.length;
  const name = groupName || 'このグループ';

  let texts = [];

  // バランス分析
  if (moonCount > 0 && earthCount > 0 && sunCount > 0) {
    texts.push(`${name}は月・地球・太陽の全グループが揃った"完全体"。心の絆（月）、実行力（地球）、感性（太陽）がバランスよく共存しているからこそ、どんな状況でも崩れない強さがある。`);
  } else if (moonCount === 0) {
    texts.push(`${name}は地球と太陽で構成された"攻めのグループ"。実行力と感性が爆発する代わりに、繊細な心のケアは自分たちで補い合う。それが逆に「男らしい絆」を感じさせる。`);
  } else if (earthCount === 0) {
    texts.push(`${name}は月と太陽で構成された"感性と共感のグループ"。実務より「空気感」や「世界観」で勝負するタイプ。ファンが惹かれるのは、彼らが作る「空間」そのもの。`);
  } else if (sunCount === 0) {
    texts.push(`${name}は月と地球で構成された"堅実な絆のグループ"。派手さより確実さ。でもそれが「安心して推せる」理由になっている。`);
  }

  // 役割の多様性
  const roles = members.map(m => m.profile.roles);
  const maxLeader = members.reduce((max, m) => m.profile.roles.leader > max.profile.roles.leader ? m : max, members[0]);
  const maxMood = members.reduce((max, m) => m.profile.roles.mood > max.profile.roles.mood ? m : max, members[0]);
  const maxHeal = members.reduce((max, m) => m.profile.roles.healer > max.profile.roles.healer ? m : max, members[0]);

  if (maxLeader !== maxMood) {
    texts.push(`統率力の${maxLeader.name || maxLeader.animal}と、場を和ませる${maxMood.name || maxMood.animal}。リーダーとムードメーカーが別々に存在するからこそ、チームとして最強のバランスが生まれる。`);
  }

  // 感動テキスト
  texts.push(`個性心理学の視点で見ると、${name}のメンバーは「出会うべくして出会った」組み合わせ。それぞれが持つ個性が、グループになった瞬間に化学反応を起こし、1+1を何倍にもする。だからファンは「このグループが好き」ではなく「このグループじゃないとダメ」になる。それが、${name}が尊い理由。`);

  return texts.join('\n\n');
}
