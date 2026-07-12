// ============================================================
// データ整合性テスト — node tests/data-test.js で実行
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = {};
vm.createContext(ctx);
const source = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
// const宣言はコンテキストに載らないため、評価結果として取り出す
const { CHARACTER_TABLE, ANIMAL_PROFILES, GROUPS, getCharacterNumber, diagnose, getGroupCompatibility } =
  vm.runInContext(source + '\n;({ CHARACTER_TABLE, ANIMAL_PROFILES, GROUPS, getCharacterNumber, diagnose, getGroupCompatibility });', ctx);

let failures = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ ${msg}`);
  } else {
    console.error(`  ❌ ${msg}`);
    failures++;
  }
}

console.log('▼ キャラクターテーブル');
assert(CHARACTER_TABLE.length === 60, 'テーブルは60件');
assert(CHARACTER_TABLE.every((c, i) => c.n === i + 1), 'No.1〜60が順番に並んでいる');
assert(new Set(CHARACTER_TABLE.map(c => c.name)).size === 60, 'キャラクター名に重複がない');

console.log('▼ 動物プロフィール');
const animals = Object.keys(ANIMAL_PROFILES);
assert(animals.length === 12, '動物は12種類');
for (const animal of animals) {
  const p = ANIMAL_PROFILES[animal];
  const tableNums = CHARACTER_TABLE.filter(c => c.animal === animal).map(c => c.n);
  assert(
    JSON.stringify([...p.subTypes].sort((a, b) => a - b)) === JSON.stringify(tableNums),
    `${animal} の subTypes がテーブルと一致 (${tableNums.join(',')})`
  );
  assert(GROUPS[p.group].members.includes(animal), `${animal} は ${p.group} グループのメンバー`);
  assert(CHARACTER_TABLE.filter(c => c.animal === animal).every(c => c.group === p.group),
    `${animal} のテーブル上のグループが一致`);
}

console.log('▼ グループ定義');
const allMembers = Object.values(GROUPS).flatMap(g => g.members);
assert(allMembers.length === 12 && new Set(allMembers).size === 12, '3グループで12動物をカバー');

console.log('▼ 診断ロジック');
assert(getCharacterNumber(1926, 1, 1) === 27, '基準日 1926-01-01 は No.27');
// 60日周期であること
assert(getCharacterNumber(1990, 1, 1) === getCharacterNumber(1990, 3, 2), '60日で一周する（1990-01-01 と 60日後）');
assert(getCharacterNumber(2000, 2, 28) !== getCharacterNumber(2000, 2, 29), 'うるう日で番号が進む');
for (const [y, m, d] of [[1920, 1, 1], [1999, 12, 31], [2026, 7, 12]]) {
  const n = getCharacterNumber(y, m, d);
  assert(n >= 1 && n <= 60, `${y}-${m}-${d} の番号が1〜60の範囲 (No.${n})`);
}
const r = diagnose(1995, 4, 1);
assert(r.profile && r.groupData && r.name, 'diagnose() が完全な結果を返す');

console.log('▼ 相性ロジック');
assert(getGroupCompatibility('MOON', 'MOON').score === 95, '同グループは95点');
assert(getGroupCompatibility('MOON', 'EARTH').label.includes('リード'), '月→地球は「リード」');
assert(getGroupCompatibility('EARTH', 'MOON').label.includes('ついていきたい'), '地球→月は「ついていきたい」');

console.log('');
if (failures > 0) {
  console.error(`${failures} 件のテストが失敗しました`);
  process.exit(1);
}
console.log('すべてのテストに合格しました 🎉');
