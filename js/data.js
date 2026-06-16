// ========================= 資料 =========================
const PAL = {
  '.':null, K:'#140d18',
  S:'#e6b48c', s:'#c98f6a', W:'#c9cfda', M:'#eef1f6', n:'#474e5e',
  G:'#e7c14a', C:'#c23b3b', c:'#822626', B:'#6e4a2a', b:'#4d3019',
  g:'#83b154', e:'#5a7d33', R:'#e9dca6', r:'#c7b577',
  o:'#9c6b34', i:'#d9d2b0', q:'#6fd0e0', H:'#2f7d46', h:'#1f5631',
  A:'#ff5a4a', t:'#8a8f9c', T:'#5b606e',
  u:'#8a6fd0', U:'#4f3a8f',
};
const SPRITES = {
  warrior:["...KKKKK....","..KWWWWWK...","..KWnnnWK...","..KSSSSSK...","..KSKSKSK...","..KSSSSSK...","...KSSSK....",".GCCCCCG.M..","WKCCCCCK.M..","WKCCCCCK.M..","WKBBBBBK.M..",".KcccccK....",".KccKccK....",".KnnKnnK....",".KK..KK.....","............"],
  ranger:["...HHHHH....","..HHHHHHH...","..HhSSShH...","..HSSSSSH...","..HSKSKSH...","..HhSSShH...","...hSSSh....","..HHHHHHo...",".KHHHHHKoi..",".KHhhhHKoi..",".KBhhhBKoi..",".KhhhhhK.o..",".KhhKhhK....",".KnnKnnK....",".KK..KK.....","............"],
  priest:["...GGGGG....","..GRRRRRG...","..GRSSSRG...","..RSSSSSR...","..RSKSKSR...","..RrSSSrR...","...RSSSR.q..","..GRRRRRGo..",".KRRRRRKo...",".KRrrrRKo...",".KRrrrRKo...",".KrrrrrKo...",".KrrKrrK....",".KnnKnnK....",".KK..KK.....","............"],
  goblin:["............","...ggggg....","..gggggggg..","..geggggeg..","..gAgggAgg..","..gggggggg..","...geeeg....","..gggggg.M..",".KggggggKM..",".KgeggegK...",".KBBBBBBK...",".KbbKbbK....",".KeeKeeK....",".KKK.KKK....","............","............"],
  goblinArcher:["............","...ggggg....","..gggggggg..","..geggggeg..","..gAgggAgg..","..gggggggg..","...geeeg....","..ggggggo...",".KggggggKoi.",".KgeggegKoi.",".KBBBBBBK.o.",".KbbKbbK....",".KeeKeeK....",".KKK.KKK....","............","............"],
  guardian:["............",".TTTTTTTTTT.",".TttttttttT.",".TtAttttAtT.",".TttttttttT.",".TtTTTTTTtT.",".TttttttttT.",".TttttttttT.","TTTttttttTTT","TTTttttttTTT",".TttttttttT.",".TttttttttT.",".TttttttttT.",".TTT..TTT...",".KKK..KKK...","............"],
  mage:[".....K......","....KuK.....","...KuuuK....","..KuuuuuK...","...KSSSK....","...SKSKS....","...KSSSK.q..","..KuuuuuKo..",".KuUUUUuKo..",".KuUUUUuKo..",".KuUUUUuK...",".KuuuuuuK...",".KuuuKuuK...",".KnnKKnnK...",".KK....KK...","............"],
};
const GLYPH = {
  '0':["111","101","101","101","111"],'1':["010","110","010","010","111"],'2':["111","001","111","100","111"],'3':["111","001","111","001","111"],'4':["101","101","111","001","001"],'5':["111","100","111","001","111"],'6':["111","100","111","101","111"],'7':["111","001","010","010","010"],'8':["111","101","111","101","111"],'9':["111","101","111","001","111"],'-':["000","000","111","000","000"],'+':["000","010","111","010","000"],
};
// 裝備目錄（不限量）
// 武器：atkSeq = 傷害表，依序循環輸出固定 ATK（第三次回到第一個）
const WEAPONS = [
  // starter:true 才會出現在整備目錄；其餘為地城掉落專屬
  {name:'鐵劍', atkSeq:[14,18], heal:0, lvReq:1, starter:true},
  {name:'雙手斧', atkSeq:[20,28], heal:0, lvReq:3, starter:true},
  {name:'獵弓', atkSeq:[18,20,22], heal:0, lvReq:2, starter:true},
  {name:'短弓', atkSeq:[16,18,20], heal:0, lvReq:1, starter:true},
  {name:'橡木杖', atkSeq:[10,12], heal:8, lvReq:1, starter:true},
  {name:'聖光杖', atkSeq:[14,16], heal:14, lvReq:3, starter:true},
  {name:'火花杖', atkSeq:[9,11], heal:0, lvReq:1, starter:true, magic:true},   // 法師起手（範圍魔法）
  // 掉落專屬（靠探險取得，整備目錄看不到）
  {name:'匕首', atkSeq:[12,13,14,16], heal:0, lvReq:2},
  {name:'雙刃劍', atkSeq:[18,22,26], heal:0, lvReq:3},
  {name:'巨劍', atkSeq:[26,34], heal:0, lvReq:4},
  {name:'戰弓', atkSeq:[22,24,26,28], heal:0, lvReq:4},
  {name:'神息法杖', atkSeq:[18,20], heal:20, lvReq:4},
  {name:'烈焰法杖', atkSeq:[14,18], heal:0, lvReq:3, magic:true},
];
// 防具：固定 DEF
const ARMORS = [
  {name:'布衣', def:1, hp:8, lvReq:1, starter:true}, {name:'皮甲', def:3, hp:12, lvReq:1, starter:true},
  {name:'鎖子甲', def:6, hp:22, lvReq:3, starter:true}, {name:'法袍', def:2, hp:16, lvReq:2, starter:true},
  // 掉落專屬
  {name:'精鋼板甲', def:9, hp:30, lvReq:4},
  {name:'守護重盔', def:7, hp:26, lvReq:3},
  {name:'法師長袍', def:3, hp:20, lvReq:2},
  {name:'龍鱗甲', def:11, hp:36, lvReq:5},
];
// 遺物名稱池（依風險階級 1-4），增加每趟收集的變化
const RELIC_NAMES = [
  ['破碎神像','鏽蝕神牌','殘缺護符'],
  ['古神之眼','低語石板','遺忘之鈴'],
  ['失落聖徽','永燃聖燭','星辰碎核'],
  ['創世殘頁','神王冠冕','時之沙漏','虛空之心'],
];
// 世界地圖目的地：travel＝抵達需消耗的食物、tier＝危險/遺物階級、repReq＝解鎖所需聲望（遺物數）
const DESTINATIONS = [
  {name:'近郊遺跡', travel:1, tier:1, repReq:0, desc:'最近的失落神殿，新手起點。'},
  {name:'枯骨峽谷', travel:2, tier:2, repReq:2, desc:'更深的古文明遺跡，怪物更兇、寶物更好。'},
  {name:'沉沒神城', travel:3, tier:3, repReq:5, desc:'水下失落都城，遺物階級高，路途遙遠。'},
  {name:'虛空裂隙', travel:4, tier:4, repReq:9, desc:'舊神沉眠之地，極兇極富，唯強者可歸。'},
];
// 遺物祝福差異化：每件遺物依名稱對應一種加成類型；未列出者為 all（通用）
const RELIC_BOON = {
  '破碎神像':'atk','鏽蝕神牌':'def','殘缺護符':'hp',
  '古神之眼':'drop','低語石板':'atk','遺忘之鈴':'heal',
  '失落聖徽':'def','永燃聖燭':'hp','星辰碎核':'atk',
  '創世殘頁':'drop','神王冠冕':'atk','時之沙漏':'food','虛空之心':'hp',
};
const BOON_LABEL = {atk:'攻', def:'防', hp:'血', heal:'治療', drop:'遺物率', food:'食物', all:'全能'};

// 隊員羈絆：成員皆在隊（固定班底恆成立）時給對應加成
const BONDS = [
  {name:'以信護盾', members:['warrior','priest'], def:3, desc:'戰士與牧師：彼此 DEF +3'},
  {name:'掩護射擊', members:['warrior','ranger'], atk:4, desc:'戰士掩護：戰士與遊俠 ATK +4'},
  {name:'神諭指引', members:['priest','ranger'], heal:5, hp:8, desc:'牧師與遊俠：治療 +5、HP +8'},
];

// 隊形（取代固定羈絆）：每隊形固定站位（像素座標）＋每站位加減成；row 決定被鎖定權重
const FORMATIONS = [
  { name:'基礎三角', desc:'攻守均衡的基本站位，戰士在前扛傷', slots:{
     warrior:{x:330,y:360,row:'front', def:3},
     ranger :{x:200,y:255,row:'back',  atk:4},
     priest :{x:200,y:440,row:'back',  heal:5, hp:8}, mage:{x:130,y:360,row:'back', atk:3} } },
  { name:'護駕', desc:'戰士遊俠雙前排護住後方牧師，火力全開但前排吃傷', slots:{
     warrior:{x:340,y:300,row:'front', atk:4},
     ranger :{x:340,y:420,row:'front', atk:8, def:-2},
     priest :{x:190,y:360,row:'back',  heal:6}, mage:{x:150,y:280,row:'back', atk:5} } },
  { name:'警戒前行', desc:'謹慎推進、重防禦，輸出較低', slots:{
     warrior:{x:300,y:360,row:'front', def:6},
     ranger :{x:170,y:260,row:'back',  def:3, atk:-2},
     priest :{x:170,y:460,row:'back',  heal:4, def:3}, mage:{x:150,y:360,row:'back', def:2, atk:2} } },
  { name:'急行軍', desc:'全員拉開散開，傷害被均攤', slots:{
     warrior:{x:280,y:360,row:'mid',  def:2},
     ranger :{x:160,y:300,row:'back', atk:6},
     priest :{x:160,y:420,row:'back', heal:5}, mage:{x:130,y:360,row:'back', atk:5} } },
  { name:'守護方陣', desc:'極致防禦，戰士死守前方（需聲望 3）', repReq:3, slots:{
     warrior:{x:320,y:360,row:'front', def:9},
     ranger :{x:185,y:265,row:'back',  def:3},
     priest :{x:185,y:455,row:'back',  heal:5, hp:12, def:3}, mage:{x:150,y:360,row:'back', def:3, hp:8} } },
  { name:'突擊縱列', desc:'全員壓上猛攻，極高輸出但極脆（需聲望 5）', repReq:5, slots:{
     warrior:{x:345,y:300,row:'front', atk:6},
     ranger :{x:360,y:360,row:'front', atk:12, def:-3},
     priest :{x:330,y:420,row:'front', heal:5, def:-2}, mage:{x:355,y:475,row:'front', atk:8, def:-3} } },
];
const ROW_WEIGHT = { front:3.2, mid:1.6, back:1 };   // 敵人選目標的權重：前排越容易被集火
const WAGONS = [
  {name:'輕便馬車', food:9, slots:4, desc:'跑得遠，裝得少'},
  {name:'標準篷車', food:7, slots:6, desc:'均衡'},
  {name:'重載貨車', food:5, slots:9, desc:'裝得多，跑不遠'},
];
// 職業：等級決定血量（growthHp/級）與可穿戴裝備；ATK 來自武器、DEF 來自防具
const HERO_BASE = [
  {sprite:'warrior', name:'戰士', hp:95, interval:1300, ranged:false, healer:false, defWeapon:0, defArmor:1, growthHp:16},
  {sprite:'ranger',  name:'遊俠', hp:58, interval:1000, ranged:true,  healer:false, defWeapon:3, defArmor:1, growthHp:10},
  {sprite:'priest',  name:'牧師', hp:62, interval:1500, ranged:true,  healer:true,  defWeapon:4, defArmor:0, growthHp:11},
  {sprite:'mage',    name:'法師', hp:54, interval:1700, ranged:true,  healer:false, defWeapon:6, defArmor:0, growthHp:9, aoe:true},
];
// 寶箱物品池（依風險階級 1-4）
const LOOT = {
  valuable:['碎銀錢袋','古青銅幣','寶石原石','黃金聖盃','失落王冠'],
  consum:['治療藥水','解毒劑','聖水','回復卷軸','復活之種'],
};
const SCALE = 4;
const TH = { bg:'#0e0a14', panel:0x1d1528, panel2:0x2a2038, gold:'#e7c14a', goldN:0xe7c14a, cyan:'#6fd0e0', red:'#ff6b6b', green:'#7dff9a', text:'#d8cdb8', dim:'#8a7f9a' };

// 地圖節點外觀 / 圖示 / 角色簡介
const NODE_INFO = {
  start:{ch:'起',col:0x6a6a7a}, battle:{ch:'戰',col:0xc23b3b}, chest:{ch:'寶',col:0xe7c14a},
  elite:{ch:'精',col:0x9a5ad0}, relic:{ch:'遺',col:0x6fd0e0}, event:{ch:'？',col:0x4f8f6f},
};
const KIND_ICON = {'貴重物品':'💎','道具':'🧪','武器':'⚔','防具':'🛡','遺物':'🏛'};
const BIO = {
  warrior:'教團護衛，前排扛傷護隊。', ranger:'山野嚮導，後排高速集火。', priest:'唯一聽見神諭者，後排治療續航。',
  goblin:'成群行動的綠皮掠奪者，數量是威脅。', goblinArcher:'躲後排放冷箭，脆弱但傷害高。',
  guardian:'古文明留下的石像守衛，堅硬沉重、傷害驚人。',
  mage:'教團法師，後排施放範圍魔法，一次掃蕩成群敵人。',
};
// 技能：依職業等級解鎖，戰鬥中自動觸發
// 主動技能：cd（毫秒冷卻）+ uses（每場次數上限）；冷卻好且還有次數時，下一次行動自動觸發
const SKILLS = {
  warrior:[ {lv:2,name:'敲暈',type:'stun',cd:5000,uses:2,dur:1500,desc:'CD 5 秒・每場 2 次：擊暈敵人 1.5 秒'},
            {lv:4,name:'堅守',type:'passiveDef',def:2,desc:'被動：DEF +2'},
            {lv:6,name:'強擊',type:'crit',cd:7000,uses:2,mult:1.8,desc:'CD 7 秒・每場 2 次：重擊（傷害 ×1.8）'},
            {lv:8,name:'鐵骨',type:'passiveHp',hp:40,desc:'被動：HP +40'} ],
  ranger:[  {lv:2,name:'連射',type:'doubleHit',cd:4000,uses:3,desc:'CD 4 秒・每場 3 次：追加一擊'},
            {lv:4,name:'弱點射擊',type:'crit',cd:6000,uses:2,mult:2,desc:'CD 6 秒・每場 2 次：暴擊傷害×2'},
            {lv:6,name:'鷹眼',type:'passiveAtk',atk:5,desc:'被動：ATK +5'},
            {lv:8,name:'震懾箭',type:'stun',cd:6000,uses:2,dur:1000,desc:'CD 6 秒・每場 2 次：擊暈敵人 1 秒'} ],
  priest:[  {lv:2,name:'群體治療',type:'groupHeal',cd:8000,uses:2,desc:'CD 8 秒・每場 2 次：改為全隊治療'},
            {lv:4,name:'聖療',type:'healBoost',amt:6,desc:'被動：治療量 +6'},
            {lv:6,name:'聖盾',type:'passiveDef',def:4,desc:'被動：DEF +4'},
            {lv:8,name:'神恩',type:'healBoost',amt:8,desc:'被動：治療量 +8'} ],
  mage:[    {lv:2,name:'炎爆',type:'crit',cd:5000,uses:2,mult:1.8,desc:'CD 5 秒・每場 2 次：法術暴擊 ×1.8'},
            {lv:4,name:'護體罩',type:'passiveHp',hp:24,desc:'被動：HP +24'},
            {lv:6,name:'奧術精通',type:'passiveAtk',atk:4,desc:'被動：ATK +4'},
            {lv:8,name:'連環施法',type:'doubleHit',cd:5000,uses:2,desc:'CD 5 秒・每場 2 次：追加一次施法'} ],
};
