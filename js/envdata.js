// ========================= v3.0 戰場環境系統 · 資料模組 =========================
// 物件像素圖、物件目錄與目的地配表、天氣擴充（晴/雨/霧/風/雪）、天氣神祉、技能親和。
// 載入順序：data.js 之後（擴充 SPRITES / WEATHERS / SKILLS）、state.js 之前。
// 設計稿：《戰場環境系統_設計稿》v0.2 —— 天氣不可改變、戰鬥全自動、物件純戰術價值。

// ---- 物件像素圖（沿用 data.js 的 PAL 調色盤與字串網格格式）----
Object.assign(SPRITES, {
  // 巨木：站立物件（可投擲/掩體）
  tree:["....HHHH....","...HHHHHH...","..HHgHHHgH..",".HHHHHHHHHH.",".HgHHHgHHHh.",".HHHHHHHHhh.","..hHHgHHhh..","...hhHHhh...","....KBBK....","....KBBK....","....KBbK....","...KBBbbK...","..KbbBbbbK..","............"],
  // 圍籬：站立物件（物件坦，敵方近戰首擊先打它）
  fence:["................","..K...........K.",".KBK...KBK...KBK",".KBKoooKBKoooKBK",".KBBBBBBBBBBBBBK",".KBK...KBK...KBK",".KBKoooKBKoooKBK",".KBBBBBBBBBBBBBK",".KbK...KbK...KbK",".KKK...KKK...KKK"],
  // 石像：站立物件（掩體＋神聖）
  statue:["....tttt....","...tttttt...","...tTjjTt...","...tjGGjt...","...tjjjjt...","....tttt....","...tttttt...","..ttTttTtt..",".tttttttttt.",".tTtttttTtt.","..tttttttt..","..tTttttTt..",".tttttttttt.","tTTTTTTTTTTt","tttttttttttt"],
  // 祭壇：站立物件（神聖・王房限定）
  altar:["............","....KGGK....","...KGYYGK...","...KGYYGK...","....KGGK....","...tttttt...","..tTttttTt..","...tttttt...","...tTttTt...","...tttttt...","..tttttttt..",".tTTTTTTTTt.",".tttttttttt.","............"],
  // 地面水澤／危險地形（貼地繪製，寬版）
  waterpool:["......wwwwww......","...wwqqqZqqqww....",".wwqZqqIqqqZqqww..","wqqqqZZqIqZZqqqqw.",".wwqIqqZZZqqIqww..","...wwqqqqqqww.....","......wwww........"],
  // 空間裂縫：懸浮的紫色裂口（虛空裂隙）
  voidrift:["....Kx....","...KxzK...","...KxxK...","..KxzzxK..","..KzxPzK..",".KxzPPzxK.",".KzPIPPzK.",".KxPPPzxK.","..KzxPzK..","..KxzzxK..","...KxxK...","...KzxK...","....Kx....","....Kz...."],
  // 烤肉：架在木叉上的肉串（營火旁，哥布林會跑去吃）
  roast:["............","...CCcC.....","..CcCCcC....","..cCCCcC....","...cCCc.....",".KKKKKKKKK..","...b...b....","...b...b....","..bb...bb..."],
  lavapool:["....KKKKKKKKKKKK....","..KKccFFAFFFFAcKK...",".KcFFAAYFAAFYAFFcK..","KcAFYYAFFAYYFAAFFcK.",".KcFAAFYAAAFYFAcK...","..KKcFFAAFFAAcKK....","....KKKKKKKKKK......"],
  pit:["....KKKKKKKKKK....","..KKnnnnnnnnnnKK..",".KnnKKKKKKKKKKnnK.","KnKKKKKKKKKKKKKKnK",".KnnKKKKKKKKKKnnK.","..KKnnnnnnnnnnKK..","....KKKKKKKKKK...."],
  bogpool:["....LLLLLLLLLLLL....","..LLeeggeeeeggeeLL..",".LegguegeeeguggeegL.","LeggeeuggeegguueggeL",".LeguggeeuggeguggeL.","..LLeeggeeeggeeLL...","....LLLLLLLLLL......"],
  // v4.7 新互動物件：蜂巢（中立騷擾）／酒桶（紮營敵人會去喝）
  beehive:["....BB......","...oooo.....","..oYooYo....","..oooooo....","..oYooYo....","...oooo.....","....oo......","...Y..Y....."],
  aleKeg:["...BBBB.....","..BbbbbB....","..oBBBBo....","..BbbbbB....","..BbbbbB....","..oBBBBo....","..BbbbbB....","...BBBB....."],
  // v5.6 沙漠棲地：動物遺骨（胡狼窩）／枯樹（禿鷹巢）／沙坑（沙蟲・沙蠍穴）
  bonePile:["............","....j..M....","..Mjjjj.j...",".jMjMMjjM...","..jjMjjjj...",".Mjjjjj.M...","..j.Mjj.....","...jjj......"],
  carcassSpr:["............","............","....ss......","..sssssss...",".sDsssssss..","..ssssssss..","...ss..ss...","............"],
  // v6.0 水澤生態：澤獸屍體（澤馬/澤鱷）＋寄生蟲
  marshCarcassSpr:["..............","..............","....HH........","..HHHHHHHg....",".HgHHHHHHHHg..","..HHHHHHHHH...","...HH..HH.....",".............."],
  parasiteSpr:["............","...ee.......","..eLee......",".eeKLee.....","..eLeeee....",".ee.ee.ee...","..e..e..e...","............"],
  deadTree:["....b..b....",".b..B..b....","..b.B.b.....","...bBb..B...","....BB.b....","....BBb.....","....BB......","....BB......","....BB......","...bBBb.....","..bbBBbb...."],
  sandPit:["....DDDDDDDDDD....","..DDaammmmaaDD....",".DaammmmmmmaaD....","DaammmmmmmmaaD....",".DaammmmmmaaD.....","..DDaaaaaaDD......","....DDDDDD........"],
  // v5.0 武器架／防具架／幽焰營火
  weaponRack:["..B......B..","..B.W..t.B..","..BWW..ttB..","..B.W..t.B..","..B.W..t.B..","..BWWW.ttB..","..BBBBBBBB..","..B......B..","..Bb....bB.."],
  armorRack:["....BB......","...jjjj.....","..jwwwwj....","..jwjjwj....","..jwwwwj....","...jwwj.....","....BB......","....BB......","...bBBb....."],
  cyanFire:["............","......I.....",".....IZI....",".....ZqZ....","....IZqZI...","....ZZqZZ...","...IZZqZZI..","...ZZZZZZZ..","....ZZZZZ...","..K......K..",".bBBBBBBBBb.","..bBBBBBBb..","...KK..KK...","............"],
});

// ---- 物件目錄（v3.1 定案：物件不承受攻擊）----
// dur＝「觸發耐久度」：每被技能利用一次消耗 1，歸零碎裂消失；dur:0＝地形（恆存、不可利用耗盡）。
// tags 供技能親和比對；ground＝貼地地形；aura＝週期效果（地形光環，不耗耐久）。
const BATTLE_OBJECTS = {
  campfire:{ sprite:'campfire', name:'營火', icon:'🔥', tags:['fire'],               dur:3, scl:4 },   // 引燃連鎖/小憩 各耗 1
  tree:    { sprite:'tree',     name:'巨木', icon:'🌲', tags:['throwable','cover'],  dur:1, scl:4 },   // 拔樹投擲＝整棵消耗
  fence:   { sprite:'fence',    name:'圍籬', icon:'🚧', tags:['cover'],              dur:2, scl:4 },   // 掩體：背刺每次耗 1
  statue:  { sprite:'statue',   name:'石像', icon:'🗿', tags:['cover','sacred'],     dur:3, scl:4 },   // 掩體＋祈禱升階共用耐久
  altar:   { sprite:'altar',    name:'祭壇', icon:'⛩', tags:['sacred'],             dur:2, scl:4 },   // 王房限定
  pool:    { sprite:'waterpool',name:'水坑', icon:'💧', tags:['water'],              dur:2, ground:true, scl:4 },   // 水源共鳴（替代雨天親和）每次耗 1；沉沒神城生物由此湧出
  rift:    { sprite:'voidrift', name:'空間裂縫', icon:'🌀', tags:['void'],           dur:2, scl:4, float:true },    // 空間魔法增幅；虛空生物由此竄出
  roast:   { sprite:'roast',    name:'烤肉', icon:'🍖', tags:['food'],               dur:2, scl:4 },                // 營火旁；受傷的紮營敵人會跑去吃（回血、耗 1）
  lava:    { sprite:'lavapool', name:'岩漿', icon:'🌋', tags:['fire','hazard'],      dur:0, ground:true, scl:4, aura:'burn' },
  pit:     { sprite:'pit',      name:'地坑', icon:'🕳', tags:['pit','hazard'],       dur:2, ground:true, scl:4 },   // 每吹落一敵耗 1
  bog:     { sprite:'bogpool',  name:'毒沼', icon:'☣', tags:['poison','hazard'],    dur:0, ground:true, scl:4, aura:'poison' },
  // v4.7 新互動物件
  hive:    { sprite:'beehive',  name:'蜂巢', icon:'🐝', tags:['hive'],               dur:2, scl:4, aura:'sting' },   // 中立：週期螫刺隨機單位（敵我皆然），螫兩次後墜落
  keg:     { sprite:'aleKeg',   name:'酒桶', icon:'🍺', tags:['keg'],                dur:2, scl:4 },                 // 受傷的紮營敵人會去暢飲：回血但爛醉降速
  // v5.6 沙漠棲地物件（湧現巢穴；沙坑兼具地坑功能——回風可把敵人吹回去）
  carcass: { sprite:'carcassSpr', name:'胡狼屍體', icon:'💀', tags:['carrion'],     dur:1, scl:4 },   // v5.7 胡狼死後留下；禿鷹食之回滿血
  marshcarcass:{ sprite:'marshCarcassSpr', name:'澤獸屍體', icon:'💀', tags:['carrion'], dur:3, scl:4 },   // v6.0 澤馬/澤鱷死後留下；孵化開始後每秒 1 隻寄生蟲（耐久 3＝共 3 隻）
  bonepile:{ sprite:'bonePile', name:'動物遺骨', icon:'🦴', tags:['bones'],          dur:0, scl:4 },
  deadtree:{ sprite:'deadTree', name:'枯樹',     icon:'🌵', tags:['cover'],          dur:2, scl:4 },   // 兼掩體：盜賊可藉其背刺
  sandpit: { sprite:'sandPit',  name:'沙坑',     icon:'🕳', tags:['pit','hazard'],   dur:2, ground:true, scl:4 },
  // v5.0 新物件（不在地圖預告——留給玩家自己發現）
  rackW:   { sprite:'weaponRack', name:'武器架', icon:'⚔', tags:['rackW'],           dur:2, scl:4 },   // 我方行動時順手抄起利刃：本場 ATK +5（每架限 2 人份）
  rackA:   { sprite:'armorRack',  name:'防具架', icon:'🛡', tags:['rackA'],          dur:2, scl:4 },   // 我方行動時披上備用甲：本場 DEF +4、護盾 +12（限 2 人份）
  cyanfire:{ sprite:'cyanFire',   name:'幽焰營火', icon:'🔵', tags:['fire'],         dur:3, scl:4 },   // 魔力之火：引燃連鎖傷害 ×1.5；波次小憩改回「護盾」
};
// 目的地 → 可能出現的物件（重複＝權重）。王戰另外固定出「祭壇」。
const OBJECTS_BY_DEST = [
  ['statue','fence','tree','campfire','statue','keg','rackW'],    // 0 近郊遺跡
  ['fence','pit','campfire','tree','pit','keg','rackA'],          // 1 枯骨峽谷
  ['pool','statue','campfire','pool','cyanfire','rackA'],         // 2 沉沒神城（水坑/幽焰）
  ['rift','lava','statue','rift','pit','cyanfire'],               // 3 虛空裂隙（空間裂縫/幽焰）
  ['sandpit','lava','campfire','deadtree','pool','bonepile'],   // 4 燔流沙漠（v5.6 棲地物件；沙坑取代地坑）
  ['pool','bog','tree','pool','hive'],                    // 5 綠洲水澤
  ['tree','bog','statue','tree','hive'],                  // 6 翠冠叢林
  ['bog','lava','tree','pit','bog'],                      // 7 蝕心雨林
];

// ---- v3.2 場景編排用族群清單（沿用 data.js 任務族群；缺時退回基本清單）----
const ENV_CAMPERS = (typeof Q_GOBLIN!=='undefined')? Q_GOBLIN.slice() : ['goblin','goblinArcher'];             // 會紮營圍火的人形族
const ENV_BONES   = (typeof Q_BONE  !=='undefined')? Q_BONE.slice()   : ['skeleton','skeletonArcher','boneBrute'];   // 從地底爬出的骸骨族
const ENV_GHOSTS  = (typeof Q_UNDEAD!=='undefined')? Q_UNDEAD.slice() : ['necromancer','wraith','banshee','lich'];   // 聚集石像的幽魂族
const ENV_SEA     = (typeof Q_SEA   !=='undefined')? Q_SEA.slice()   : ['drowned','drownedArcher','tidePriest'];     // 自水坑湧出的深水族
const ENV_VOID    = (typeof Q_VOID  !=='undefined')? Q_VOID.slice()  : ['voidling','voidArcher','voidSeer'];         // 自空間裂縫竄出的虛空族
const ENV_GROVE_DESTS = [0,5,6,7];   // 有林相的目的地：巨木穿插於兩軍之間（近郊遺跡/綠洲/叢林/雨林）
const ENV_BEASTS = ['jackal','vulture','crocodile','cobra','jaguar','jungleApe','marshHippo','dartFrog','sandScorpion','hornViper','sandWyrm','dragonfly','mantis'];   // v4.7 野獸族：低血會跑去水坑喝水
// v6.0 澤生寄生蟲（動態生成的新怪：自澤獸屍體破體而出）
const ENV_PARASITE = { sprite:'parasiteSpr', name:'澤生寄生蟲', hp:18, atkSeq:[5,7], def:0, interval:1100, row:'mid' };

// ---- 天氣擴充：新增 強風/雪；補全既有 雨/霧 的環境註記（數值效果照舊由 eff 提供）----
WEATHERS.push(
  { id:'wind', name:'強風', icon:'🌬', note:'強風：雙方遠程減弱；召喚精靈強化' },
  { id:'snow', name:'雪',   icon:'❄',  note:'雪：全場出手變慢' },
);
{ const _r=WEATHER_BY_ID; WEATHERS.forEach(w=>{ _r[w.id]=w; });
  if(_r.rain) _r.rain.note='雨：雙方 ATK -2；水冰強化、火焰減弱';
  if(_r.fog)  _r.fog.note ='霧：敵方 DEF +2；遠程減弱、盜賊如魚得水'; }
// 目的地 → 天氣配比（重複＝權重）。每場開戰擲定、整場固定、不可改變（v0.2 定案）。
const WEATHER_SETS = [
  ['clear','clear','clear','rain','rain','fog','fog'],    // 0 近郊遺跡
  ['clear','clear','clear','wind','wind','fog'],          // 1 枯骨峽谷
  ['rain','rain','rain','fog','fog','clear','clear'],     // 2 沉沒神城
  ['fog','fog','fog','snow','snow','clear','clear'],      // 3 虛空裂隙（虛空寒霧）
  ['clear','clear','clear','clear','wind','wind','wind'], // 4 燔流沙漠（無雨）
  ['clear','clear','clear','rain','rain','rain'],         // 5 綠洲水澤
  ['rain','rain','rain','fog','fog','clear','clear'],     // 6 翠冠叢林
  ['rain','rain','rain','rain','fog','fog','fog'],        // 7 蝕心雨林
];
function rollWeather(di){ const set=WEATHER_SETS[di]||['clear']; return set[Math.floor(Math.random()*set.length)]; }
// 天氣神祉（牧師「祈禱」讀取當前天氣 → 降下對應神蹟；場上有 sacred 物件時升階）
const WEATHER_DEITY = {
  clear:{ name:'日神・輝陽', miracle:'輝陽祝火', desc:'全隊 ATK 提升' },
  rain: { name:'雨神・沛霖', miracle:'沛霖甘霖', desc:'全隊回復生命' },
  fog:  { name:'霧神・匿影', miracle:'匿影神隱', desc:'全隊迴避下一次攻擊' },
  wind: { name:'風神・迅哮', miracle:'迅哮加速', desc:'全隊出手加速' },
  snow: { name:'雪神・凜冬', miracle:'凜冬遲滯', desc:'全體敵人降速' },
};

// ---- 技能擴充：新主動技（牧師・祈禱／遊俠・回風）＋ 既有技能掛上環境/天氣親和 ----
(function(){
  SKILLS.priest.push({ name:'祈禱', rank:2, role:'active', type:'pray', cd:16000, uses:1, tier:2, icon:'sparkle',
    desc:'向當前天氣的神祉祈禱，降下神蹟（每場 1 次；場上有神聖物件時神蹟升階）' });
  SKILLS.ranger.push({ name:'回風', rank:2, role:'active', type:'gale', cd:9000, uses:2, dur:3000, tier:2, icon:'arrows',
    desc:'颳起回風：全體敵人降速數秒；瀕死的敵人會被吹入地坑（若場上有地坑）' });
  const aff=(pool,name,o)=>{ const s=pool.find(x=>x.name===name); if(s) Object.assign(s,o); };
  aff(SKILLS.mage,  '火球', { affinity:['fire'] });          // 場上有火源 → 引燃連鎖
  aff(SKILLS.mage,  '炎爆', { affinity:['fire'] });
  aff(SKILLS.ranger,'爆裂箭', { affinity:['fire'] });
  aff(SKILLS.mage,  '冰封',     { weatherAffinity:'rain' });  // 雨天：暈眩範圍化（每場一次）
  aff(SKILLS.mage,  '連環施法', { weatherAffinity:'rain' });  // 雨天：雨水導電，追加段數 +1（每場一次）
  aff(SKILLS.mage,  '靈魂震爆', { affinity:['void'] });        // v3.3 空間裂縫：空間魔法增幅（傷害↑，裂縫耐久 −1）
  aff(SKILLS.mage,  '隕石術',   { affinity:['void'] });        // v3.3 空間裂縫：暈眩時間延長（裂縫耐久 −1）
  SKILLS.rogue.push({ name:'移形換位', rank:2, role:'passive', type:'treeSwap', tier:2, icon:'sparkle',
    desc:'受攻擊瞬間與場上巨木換位——攻擊落空（MISS），巨木代承一擊、耐久 −1' });   // v3.3 盜賊新被動
})();
