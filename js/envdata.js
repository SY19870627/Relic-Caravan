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
};
// 目的地 → 可能出現的物件（重複＝權重）。王戰另外固定出「祭壇」。
const OBJECTS_BY_DEST = [
  ['statue','fence','tree','campfire','statue'],          // 0 近郊遺跡
  ['fence','pit','campfire','tree','pit'],                // 1 枯骨峽谷
  ['pool','statue','campfire','pool'],                    // 2 沉沒神城（水坑）
  ['rift','lava','statue','rift','pit'],                  // 3 虛空裂隙（空間裂縫）
  ['pit','lava','campfire','pit'],                        // 4 燔流沙漠
  ['pool','bog','tree','pool'],                           // 5 綠洲水澤
  ['tree','bog','statue','tree'],                         // 6 翠冠叢林
  ['bog','lava','tree','pit','bog'],                      // 7 蝕心雨林
];

// ---- v3.2 場景編排用族群清單（沿用 data.js 任務族群；缺時退回基本清單）----
const ENV_CAMPERS = (typeof Q_GOBLIN!=='undefined')? Q_GOBLIN.slice() : ['goblin','goblinArcher'];             // 會紮營圍火的人形族
const ENV_BONES   = (typeof Q_BONE  !=='undefined')? Q_BONE.slice()   : ['skeleton','skeletonArcher','boneBrute'];   // 從地底爬出的骸骨族
const ENV_GHOSTS  = (typeof Q_UNDEAD!=='undefined')? Q_UNDEAD.slice() : ['necromancer','wraith','banshee','lich'];   // 聚集石像的幽魂族
const ENV_SEA     = (typeof Q_SEA   !=='undefined')? Q_SEA.slice()   : ['drowned','drownedArcher','tidePriest'];     // 自水坑湧出的深水族
const ENV_VOID    = (typeof Q_VOID  !=='undefined')? Q_VOID.slice()  : ['voidling','voidArcher','voidSeer'];         // 自空間裂縫竄出的虛空族
const ENV_GROVE_DESTS = [0,5,6,7];   // 有林相的目的地：巨木穿插於兩軍之間（近郊遺跡/綠洲/叢林/雨林）

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
  SKILLS.priest.push({ name:'祈禱', role:'active', type:'pray', cd:16000, uses:1, tier:2, icon:'sparkle',
    desc:'向當前天氣的神祉祈禱，降下神蹟（每場 1 次；場上有神聖物件時神蹟升階）' });
  SKILLS.ranger.push({ name:'回風', role:'active', type:'gale', cd:9000, uses:2, dur:3000, tier:2, icon:'arrows',
    desc:'颳起回風：全體敵人降速數秒；瀕死的敵人會被吹入地坑（若場上有地坑）' });
  const aff=(pool,name,o)=>{ const s=pool.find(x=>x.name===name); if(s) Object.assign(s,o); };
  aff(SKILLS.mage,  '火球', { affinity:['fire'] });          // 場上有火源 → 引燃連鎖
  aff(SKILLS.mage,  '炎爆', { affinity:['fire'] });
  aff(SKILLS.ranger,'爆裂箭', { affinity:['fire'] });
  aff(SKILLS.mage,  '冰封',     { weatherAffinity:'rain' });  // 雨天：暈眩範圍化（每場一次）
  aff(SKILLS.mage,  '連環施法', { weatherAffinity:'rain' });  // 雨天：雨水導電，追加段數 +1（每場一次）
  aff(SKILLS.mage,  '靈魂震爆', { affinity:['void'] });        // v3.3 空間裂縫：空間魔法增幅（傷害↑，裂縫耐久 −1）
  aff(SKILLS.mage,  '隕石術',   { affinity:['void'] });        // v3.3 空間裂縫：暈眩時間延長（裂縫耐久 −1）
  SKILLS.rogue.push({ name:'移形換位', role:'passive', type:'treeSwap', tier:2, icon:'sparkle',
    desc:'受攻擊瞬間與場上巨木換位——攻擊落空（MISS），巨木代承一擊、耐久 −1' });   // v3.3 盜賊新被動
})();
