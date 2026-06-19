// ========================= 資料 =========================
const PAL = {
  '.':null, K:'#140d18',
  S:'#e6b48c', s:'#c98f6a', W:'#c9cfda', M:'#eef1f6', n:'#474e5e',
  G:'#e7c14a', C:'#c23b3b', c:'#822626', B:'#6e4a2a', b:'#4d3019',
  g:'#83b154', e:'#5a7d33', R:'#e9dca6', r:'#c7b577',
  o:'#9c6b34', i:'#d9d2b0', q:'#6fd0e0', H:'#2f7d46', h:'#1f5631',
  A:'#ff5a4a', t:'#8a8f9c', T:'#5b606e',
  u:'#8a6fd0', U:'#4f3a8f',
  F:'#ff9a3a', Y:'#ffe27a', P:'#caa6ff',
};
const SPRITES = {
  warrior:["...KKKKK....","..KWWWWWK...","..KWnnnWK...","..KSSSSSK...","..KSKSKSK...","..KSSSSSK...","...KSSSK....",".GCCCCCG.M..","WKCCCCCK.M..","WKCCCCCK.M..","WKBBBBBK.M..",".KcccccK....",".KccKccK....",".KnnKnnK....",".KK..KK.....","............"],
  ranger:["...HHHHH....","..HHHHHHH...","..HhSSShH...","..HSSSSSH...","..HSKSKSH...","..HhSSShH...","...hSSSh....","..HHHHHHo...",".KHHHHHKoi..",".KHhhhHKoi..",".KBhhhBKoi..",".KhhhhhK.o..",".KhhKhhK....",".KnnKnnK....",".KK..KK.....","............"],
  priest:["...GGGGG....","..GRRRRRG...","..GRSSSRG...","..RSSSSSR...","..RSKSKSR...","..RrSSSrR...","...RSSSR.q..","..GRRRRRGo..",".KRRRRRKo...",".KRrrrRKo...",".KRrrrRKo...",".KrrrrrKo...",".KrrKrrK....",".KnnKnnK....",".KK..KK.....","............"],
  goblin:["............","...ggggg....","..gggggggg..","..geggggeg..","..gAgggAgg..","..gggggggg..","...geeeg....","..gggggg.M..",".KggggggKM..",".KgeggegK...",".KBBBBBBK...",".KbbKbbK....",".KeeKeeK....",".KKK.KKK....","............","............"],
  goblinArcher:["............","...ggggg....","..gggggggg..","..geggggeg..","..gAgggAgg..","..gggggggg..","...geeeg....","..ggggggo...",".KggggggKoi.",".KgeggegKoi.",".KBBBBBBK.o.",".KbbKbbK....",".KeeKeeK....",".KKK.KKK....","............","............"],
  guardian:["............",".TTTTTTTTTT.",".TttttttttT.",".TtAttttAtT.",".TttttttttT.",".TtTTTTTTtT.",".TttttttttT.",".TttttttttT.","TTTttttttTTT","TTTttttttTTT",".TttttttttT.",".TttttttttT.",".TttttttttT.",".TTT..TTT...",".KKK..KKK...","............"],
  mage:[".....K......","....KuK.....","...KuuuK....","..KuuuuuK...","...KSSSK....","...SKSKS....","...KSSSK.q..","..KuuuuuKo..",".KuUUUUuKo..",".KuUUUUuKo..",".KuUUUUuK...",".KuuuuuuK...",".KuuuKuuK...",".KnnKKnnK...",".KK....KK...","............"],
  rogue:["............","...nnnnn....","..nnTTTnn...","..nTtttTn...","..nTSSSTn...","..nSASASn...","...nSSSn....","..eehhheeM..",".KehhhhheKM.",".KehhhhheK..",".KhhhhhhhK..",".KhhhbhhhK..",".KhhhKhhhK..",".KnnK.KnnK..",".KK....KK...","............"],
  chest:["............","............","...KKKKKK...","..KGGGGGGK..",".KGYYYYYYGK.",".KGBBBBBBGK.",".KKKKKKKKKK.",".KBBBKKBBBK.",".KBBBKiKBBK.",".KBBBKKBBBK.",".KGYYYYYYGK.","..KGGGGGGK..","...KKKKKK...","............"],
  campfire:["............","......Y.....",".....YFY....",".....FAF....","....YFAFY...","....FFAFF...","...YFFAFFY..","...FFFFFFF..","....FFFFF...","..K......K..",".bBBBBBBBBb.","..bBBBBBBb..","...KK..KK...","............"],
  merchant:["...KKKK.....","..KuuuuK....",".KuUUUUuK...",".KuSSSSuK...",".KuSKKSuK...",".KuSSSSuK...","..KuSSuK....",".KUUUUUUK.G.","KUUUUUUUUKGY","KUUbbbUUUKG.","KUUUUUUUUK..",".KUUUUUUK...",".KUU..UUK...",".KK....KK...","............"],
  mystery:["......M.....","....M.q.....",".....KqK....","....KquqK...","...KquUqK...","...quUPUq...","...KqUPqK...","....KquK....",".....KqK....",".....KuK....","...tTTTTt...","..tTTTTTTt..","...tTTTTt...","............"],
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
  {name:'短刃', atkSeq:[10,12,14], heal:0, lvReq:1, starter:true},   // 盜賊起手（快速三段）
  // 掉落專屬（靠探險取得，整備目錄看不到）；v0.8：給「特性」trait 而非只是更大的數字，換裝＝換打法
  {name:'匕首', atkSeq:[12,13,14,16], heal:0, lvReq:2, trait:{lifesteal:0.15}, traitDesc:'吸血 15%'},
  {name:'雙刃劍', atkSeq:[18,22,26], heal:0, lvReq:3, trait:{pierce:0.4}, traitDesc:'破甲：無視 40% 防禦'},
  {name:'巨劍', atkSeq:[26,34], heal:0, lvReq:4, trait:{pierce:0.5}, traitDesc:'破甲：無視 50% 防禦'},
  {name:'戰弓', atkSeq:[22,24,26,28], heal:0, lvReq:4, trait:{stunCycle:4}, traitDesc:'每第 4 擊暈眩 0.8 秒'},
  {name:'神息法杖', atkSeq:[18,20], heal:20, lvReq:4, trait:{lifesteal:0.10}, traitDesc:'吸血 10%'},
  {name:'烈焰法杖', atkSeq:[14,18], heal:0, lvReq:3, magic:true, trait:{pierce:0.3}, traitDesc:'破甲：無視 30% 防禦'},
];
// 防具：固定 DEF
const ARMORS = [
  {name:'布衣', def:1, hp:8, lvReq:1, starter:true}, {name:'皮甲', def:3, hp:12, lvReq:1, starter:true},
  {name:'鎖子甲', def:6, hp:22, lvReq:3, starter:true}, {name:'法袍', def:2, hp:16, lvReq:2, starter:true},
  // 掉落專屬；v0.8：給「特性」trait
  {name:'精鋼板甲', def:9, hp:30, lvReq:4, trait:{startShield:20}, traitDesc:'每場開場護盾 +20'},
  {name:'守護重盔', def:7, hp:26, lvReq:3, trait:{thorns:0.15}, traitDesc:'反甲：反彈 15% 受到的傷害'},
  {name:'法師長袍', def:3, hp:20, lvReq:2, trait:{startShield:12}, traitDesc:'每場開場護盾 +12'},
  {name:'龍鱗甲', def:11, hp:36, lvReq:5, trait:{thorns:0.25}, traitDesc:'反甲：反彈 25% 受到的傷害'},
];
// 世界地圖目的地：tier＝危險/遺物階級、repReq＝解鎖所需聲望（遺物種類數）
const DESTINATIONS = [
  {name:'近郊遺跡', tier:1, repReq:0, desc:'最近的失落神殿，新手起點。'},
  {name:'枯骨峽谷', tier:2, repReq:2, desc:'更深的古文明遺跡，怪物更兇、寶物更好。'},
  {name:'沉沒神城', tier:3, repReq:5, desc:'水下失落都城，遺物階級高，路途遙遠。'},
  {name:'虛空裂隙', tier:4, repReq:9, desc:'舊神沉眠之地，極兇極富，唯強者可歸。'},
];
// ===== 遺物目錄（每關固定清單、收齊為止、已得不再掉）=====
// v0.8 去數據化：每件遺物 = 一條「規則」。原本的純數值一律改成改變戰鬥/探索規則的功能。
// 規則旗標：firstHitCrit 首擊必暴｜reviveOnce 每場復活一次｜fullHealAfterBattle 戰後全回
//   splash 每3擊濺射全體｜startShield 開場護盾(數值)｜regen 行動回復(比例)｜killCrit 擊殺後下一擊必暴
//   healToShield 治療溢出轉護盾｜lastStand 低血DEF翻倍+免暈｜firstDeathHeal 首位陣亡全隊回援(比例)
//   firstStrikeAoe 首次攻擊打全體｜soloBoost 寡兵越強｜lifesteal 吸血(比例)
const RELIC_CATALOG = [
  // 近郊遺跡（dest 0）
  {id:'idol',  name:'破碎神像', icon:'🗿', dest:0, desc:'碎裂的舊神石像，殘留戰意。每位成員每第 3 次攻擊，對全部敵人造成濺射傷害。', effect:{splash:true}},
  {id:'plate', name:'鏽蝕神牌', icon:'🛡', dest:0, desc:'斑駁的護身神牌。每場戰鬥開始，全隊獲得可吸收 18 點傷害的護盾。', effect:{startShield:18}},
  {id:'charm', name:'殘缺護符', icon:'🧿', dest:0, desc:'半枚護符，護佑生機。非治療成員每次行動回復 4% 最大生命。', effect:{regen:0.04}},
  {id:'eye',   name:'古神之眼', icon:'👁', dest:0, desc:'窺見寶藏所在。每場戰鬥額外掉落 1 件戰利品。', effect:{extraLoot:1}},
  // 枯骨峽谷（dest 1）
  {id:'tablet',name:'低語石板', icon:'⚔', dest:1, desc:'低語著殺意的石板。擊殺敵人後，該成員下一次攻擊必定暴擊。', effect:{killCrit:true}},
  {id:'bell',  name:'遺忘之鈴', icon:'🔔', dest:1, desc:'清音安撫傷者。治療超過生命上限的部分轉為護盾。', effect:{healToShield:true}},
  {id:'candle',name:'永燃聖燭', icon:'🔥', dest:1, desc:'聖火灼敵。每位成員本場「首次攻擊必定暴擊」。', effect:{firstHitCrit:true}},
  {id:'bonecrest',name:'枯骨王徽', icon:'💀', dest:1, desc:'枯骨之王的徽記。成員生命低於 25% 時，DEF 翻倍且免疫暈眩。', effect:{lastStand:true}},
  // 沉沒神城（dest 2）
  {id:'emblem',name:'失落聖徽', icon:'🎖', dest:2, desc:'失落教團的聖徽。每場戰鬥首位成員陣亡時，全隊立即回復 30% 生命。', effect:{firstDeathHeal:0.30}},
  {id:'core',  name:'星辰碎核', icon:'☄', dest:2, desc:'墜星的碎核。每位成員本場第一次攻擊，改為打擊全部敵人。', effect:{firstStrikeAoe:true}},
  {id:'crown', name:'潮汐之冠', icon:'🌊', dest:2, desc:'海神的冠冕。每場戰鬥開場，全隊獲得可吸收 25 點傷害的護盾。', effect:{startShield:25}},
  {id:'glass', name:'時之沙漏', icon:'⏳', dest:2, desc:'逆轉須臾。每場戰鬥首位陣亡的我方「復活一次」（半血）。', effect:{reviveOnce:true}},
  // 虛空裂隙（dest 3）
  {id:'diadem',name:'神王冠冕', icon:'👑', dest:3, desc:'神王的冠冕。出戰人數越少越強：每空一個出戰席位，全隊 ATK/DEF +3、HP +20。', effect:{soloBoost:true}},
  {id:'page',  name:'創世殘頁', icon:'📜', dest:3, desc:'創世之書的殘頁。遺物掉落率 +10%、每場額外掉落 1 件。', effect:{drop:0.10, extraLoot:1}},
  {id:'heart', name:'虛空之心', icon:'💜', dest:3, desc:'跳動的虛空之心。成員造成傷害時，回復其中 25% 為自身生命。', effect:{lifesteal:0.25}},
  {id:'wheel', name:'永恆之輪', icon:'♾', dest:3, desc:'生生不息。每場戰鬥勝利後「全隊完全回復」。', effect:{fullHealAfterBattle:true}},
];
const RELIC_BY_ID={}; RELIC_CATALOG.forEach(r=>{ RELIC_BY_ID[r.id]=r; });
const RELICS_BY_DEST=[[],[],[],[]]; RELIC_CATALOG.forEach(r=>{ (RELICS_BY_DEST[r.dest]=RELICS_BY_DEST[r.dest]||[]).push(r); });

// 隊員羈絆（v0.8）：從「恆成立的隱形加值」改成「戰鬥中行為觸發」的功能，兩名成員都在出戰名單時生效。
// trigger：healInvuln 牧師治療戰士→短暫無敵｜stunMark 戰士暈敵→遊俠對該敵必暴｜killCdCut 遊俠擊殺→減牧師CD
const BONDS = [
  {name:'以信護盾', members:['warrior','priest'], trigger:'healInvuln', desc:'牧師治療戰士時，戰士獲得 1 秒無敵'},
  {name:'掩護射擊', members:['warrior','ranger'], trigger:'stunMark',   desc:'戰士暈眩敵人後，遊俠對該敵的下一擊必定暴擊'},
  {name:'神諭指引', members:['priest','ranger'], trigger:'killCdCut',  desc:'遊俠擊殺敵人時，牧師所有技能冷卻 -1.5 秒'},
];

// 隊形（取代固定羈絆）：每隊形固定站位（像素座標）＋每站位加減成；row 決定被鎖定權重
const FORMATIONS = [
  { name:'基礎三角', desc:'攻守均衡的基本站位，戰士在前扛傷', slots:{
     warrior:{x:330,y:360,row:'front', def:3},
     ranger :{x:200,y:255,row:'back',  atk:4},
     priest :{x:200,y:440,row:'back',  heal:5, hp:8}, mage:{x:130,y:360,row:'back', atk:3}, rogue:{x:265,y:255,row:'mid', atk:3} } },
  { name:'護駕', desc:'戰士遊俠雙前排護住後方牧師，火力全開但前排吃傷', slots:{
     warrior:{x:340,y:300,row:'front', atk:4},
     ranger :{x:340,y:420,row:'front', atk:8, def:-2},
     priest :{x:190,y:360,row:'back',  heal:6}, mage:{x:150,y:280,row:'back', atk:5}, rogue:{x:300,y:240,row:'mid', atk:6, def:-1} } },
  { name:'警戒前行', desc:'謹慎推進、重防禦，輸出較低', slots:{
     warrior:{x:300,y:360,row:'front', def:6},
     ranger :{x:170,y:260,row:'back',  def:3, atk:-2},
     priest :{x:170,y:460,row:'back',  heal:4, def:3}, mage:{x:150,y:360,row:'back', def:2, atk:2}, rogue:{x:235,y:255,row:'mid', def:2, atk:1} } },
  { name:'急行軍', desc:'全員拉開散開，傷害被均攤', slots:{
     warrior:{x:280,y:360,row:'mid',  def:2},
     ranger :{x:160,y:300,row:'back', atk:6},
     priest :{x:160,y:420,row:'back', heal:5}, mage:{x:130,y:360,row:'back', atk:5}, rogue:{x:235,y:300,row:'mid', atk:5} } },
  { name:'守護方陣', desc:'極致防禦，戰士死守前方（需聲望 3）', repReq:3, slots:{
     warrior:{x:320,y:360,row:'front', def:9},
     ranger :{x:185,y:265,row:'back',  def:3},
     priest :{x:185,y:455,row:'back',  heal:5, hp:12, def:3}, mage:{x:150,y:360,row:'back', def:3, hp:8}, rogue:{x:240,y:255,row:'mid', def:3, hp:6} } },
  { name:'突擊縱列', desc:'全員壓上猛攻，極高輸出但極脆（需聲望 5）', repReq:5, slots:{
     warrior:{x:345,y:300,row:'front', atk:6},
     ranger :{x:360,y:360,row:'front', atk:12, def:-3},
     priest :{x:330,y:420,row:'front', heal:5, def:-2}, mage:{x:355,y:475,row:'front', atk:8, def:-3}, rogue:{x:380,y:240,row:'front', atk:11, def:-3} } },
];
const ROW_WEIGHT = { front:3.2, mid:1.6, back:1 };   // 敵人選目標的權重：前排越容易被集火
// ===== 馬匹（單一馬車＋選馬）=====
// 三隻馬各有專屬功能（feature）與不同貨格數，讓選馬＝選旅途玩法。
const HORSES = [
  {name:'力量馬', slots:4, feature:'vanguard',   desc:'先鋒衝鋒：每場戰鬥開場全隊 +20 護盾；貨格較少（4）'},
  {name:'均衡馬', slots:6, feature:'initiative', desc:'攻守折中：每場戰鬥我方先攻一輪（敵人慢半拍出手）；貨格 6'},
  {name:'耐力馬', slots:9, feature:'recovery',   desc:'耐久長征：每場戰後存活成員多回復 12% HP；貨格最多（9）'},
];
// ===== 素材（強化用）：特定關出特定素材 =====
const MATERIALS = [
  {id:'wood',    name:'堅木',   icon:'🪵', dest:0},
  {id:'iron',    name:'精鐵',   icon:'⛓', dest:1},
  {id:'crystal', name:'海晶',   icon:'🔷', dest:2},
  {id:'voidore', name:'虛空礦', icon:'🟣', dest:3},
];
const MATERIAL_BY_ID={}; MATERIALS.forEach(m=>{ MATERIAL_BY_ID[m.id]=m; });
const MATERIAL_BY_DEST={}; MATERIALS.forEach(m=>{ MATERIAL_BY_DEST[m.dest]=m; });
// ===== 食材（料理用）：特定關出特定食材 =====
const INGREDIENTS = [
  {id:'herb',  name:'野菜',   icon:'🌿', dest:0},
  {id:'meat',  name:'獸肉',   icon:'🍖', dest:1},
  {id:'fish',  name:'深海魚', icon:'🐟', dest:2},
  {id:'spice', name:'異香料', icon:'🌶', dest:3},
];
const INGREDIENT_BY_ID={}; INGREDIENTS.forEach(m=>{ INGREDIENT_BY_ID[m.id]=m; });
const INGREDIENT_BY_DEST={}; INGREDIENTS.forEach(m=>{ INGREDIENT_BY_DEST[m.dest]=m; });
// ===== 節點天氣（影響移動成本與戰鬥；可在地城神殿祈禱轉晴）=====
const WEATHERS = [
  {id:'clear', name:'晴',  icon:'☀'},
  {id:'rain',  name:'雨',  icon:'🌧', eff:{allAtk:-2}, note:'雨：雙方 ATK -2'},
  {id:'fog',   name:'霧',  icon:'🌫', eff:{enemyDef:2}, note:'霧：敵方 DEF +2'},
];
const WEATHER_BY_ID={}; WEATHERS.forEach(w=>{ WEATHER_BY_ID[w.id]=w; });
// ===== 料理：食材→補血／增益（營火休息時；需領隊或工匠強化「隨車鍋」）=====
// v0.8：料理 buff 從純 ATK/DEF 數值，改成「一次性功能」(grant)，保留補血。
// grant：shield 下場開場護盾(amt)｜revive 下場一次陣亡復活充能｜firstCrit 下場全隊首擊必暴
const RECIPES = [
  {id:'soup',  name:'野菜湯',     need:{herb:1},          desc:'全隊立即回復 30% HP',                     heal:0.30},
  {id:'bbq',   name:'獸肉燒烤',   need:{meat:1},          desc:'下一場戰鬥全隊開場獲得 20 點護盾',         grant:'shield', amt:20},
  {id:'fish',  name:'深海魚料理', need:{fish:1},          desc:'全隊回復 50% HP，並獲得一次「陣亡復活」充能', heal:0.50, grant:'revive'},
  {id:'feast', name:'異香料盛宴', need:{spice:1,meat:1},  desc:'全隊回復 40% HP，下一場戰鬥全隊首擊必暴',   heal:0.40, grant:'firstCrit'},
];
// ===== 項目化強化（工匠解鎖，一次性）：cat 馬車/整備所；craftReq 工匠階級門檻 =====
// 保留容量強化（貨格 +2/+3），其餘為「解鎖新功能」(effect.feature)。
// feature：deck2 清掉精英戰後 +3 貨格｜campstove 無領隊也能在營火料理
const UPGRADES = [
  // 馬車類
  {id:'rack1',    cat:'wagon',  name:'加固貨架',   craftReq:1, effect:{slots:2},            cost:{mats:{wood:2}},             desc:'貨格 +2'},
  {id:'deck2',    cat:'wagon',  name:'貨車第二層', craftReq:2, effect:{feature:'deck2'},    cost:{mats:{iron:2}},             desc:'清掉精英戰後開啟，貨格 +3（高風險，全滅照噴）'},
  // 整備所類（共用工匠）
  {id:'feedbag',  cat:'outfit', name:'加大車廂', craftReq:1, effect:{slots:2},             cost:{mats:{wood:2}},             desc:'貨格 +2'},
  {id:'campstove',cat:'outfit', name:'隨車鍋',     craftReq:2, effect:{feature:'campstove'},cost:{mats:{iron:1,crystal:1}},   desc:'無領隊也能在途中烹煮料理'},
];
// 職業：等級決定血量（growthHp/級）與可穿戴裝備；ATK 來自武器、DEF 來自防具
// 每級：growthHp 加血、growthAtk 加攻擊（升級兼顧生存與輸出）；另由升級 perk（state.js heroPerks）給功能。
const HERO_BASE = [
  {sprite:'warrior', name:'戰士', hp:95, interval:1300, ranged:false, healer:false, defWeapon:0, defArmor:1, growthHp:10, growthAtk:3},
  {sprite:'ranger',  name:'遊俠', hp:58, interval:1000, ranged:true,  healer:false, defWeapon:3, defArmor:1, growthHp:6, growthAtk:2},
  {sprite:'priest',  name:'牧師', hp:62, interval:1500, ranged:true,  healer:true,  defWeapon:4, defArmor:0, growthHp:7, growthAtk:2},
  {sprite:'mage',    name:'法師', hp:54, interval:1700, ranged:true,  healer:false, defWeapon:6, defArmor:0, growthHp:6, aoe:true, growthAtk:3},
  {sprite:'rogue',   name:'盜賊', hp:60, interval:900,  ranged:false, healer:false, defWeapon:7, defArmor:1, growthHp:6, growthAtk:2},
];
// 寶箱物品池（依風險階級 1-4）
const LOOT = {
  valuable:['碎銀錢袋','古青銅幣','寶石原石','黃金聖盃','失落王冠'],
  consum:['治療藥水','解毒劑','聖水','回復卷軸','復活之種'],
};
const SCALE = 4;
const TH = { bg:'#0e0a14', panel:0x1d1528, panel2:0x2a2038, gold:'#e7c14a', goldN:0xe7c14a, cyan:'#6fd0e0', red:'#ff6b6b', green:'#7dff9a', text:'#d8cdb8', dim:'#8a7f9a' };

// 角色簡介
const BIO = {
  warrior:'教團護衛，前排扛傷護隊。', ranger:'山野嚮導，後排高速集火。', priest:'唯一聽見神諭者，後排治療續航。',
  goblin:'成群行動的綠皮掠奪者，數量是威脅。', goblinArcher:'躲後排放冷箭，脆弱但傷害高。',
  guardian:'古文明留下的石像守衛，堅硬沉重、傷害驚人。',
  mage:'教團法師，後排施放範圍魔法，一次掃蕩成群敵人。',
  rogue:'教團暗影，高速近戰，靠偷襲與連刺見血、割喉收割。',
};
// 技能：依職業等級解鎖，戰鬥中自動觸發
// 主動技能：cd（毫秒冷卻）+ uses（每場次數上限）；冷卻好且還有次數時，下一次行動自動觸發
// v0.8：原本純 +stat 的被動，全部改成「條件觸發」的被動（一樣自動、不用操作，但改變打法）。
// 條件型被動 type：reflect 反傷｜lowHpDef 低血DEF翻倍｜critVsFull 對滿血必暴｜critHealLow 對半血以下治療翻倍
//   shieldOnHeal 被治療者得護盾｜cleanseOnHeal 治療解暈｜deathSave 每場免死一次｜aoeBonus 多目標追加全體｜critVsStunned 對暈必暴
const SKILLS = {
  warrior:[ {lv:2,name:'敲暈',type:'stun',cd:5000,uses:2,dur:1500,desc:'CD 5 秒・每場 2 次：擊暈敵人 1.5 秒'},
            {lv:4,name:'堅守',type:'reflect',frac:0.25,desc:'被動：被攻擊時，反彈 25% 傷害給攻擊者'},
            {lv:6,name:'強擊',type:'crit',cd:7000,uses:2,mult:1.8,desc:'CD 7 秒・每場 2 次：重擊（傷害 ×1.8）'},
            {lv:8,name:'鐵骨',type:'lowHpDef',desc:'被動：生命低於 30% 時，DEF 翻倍'} ],
  ranger:[  {lv:2,name:'連射',type:'doubleHit',cd:4000,uses:3,desc:'CD 4 秒・每場 3 次：追加一擊'},
            {lv:4,name:'弱點射擊',type:'crit',cd:6000,uses:2,mult:2,desc:'CD 6 秒・每場 2 次：暴擊傷害×2'},
            {lv:6,name:'鷹眼',type:'critVsFull',desc:'被動：攻擊滿血敵人時必定暴擊'},
            {lv:8,name:'震懾箭',type:'stun',cd:6000,uses:2,dur:1000,desc:'CD 6 秒・每場 2 次：擊暈敵人 1 秒'} ],
  priest:[  {lv:2,name:'群體治療',type:'groupHeal',cd:8000,uses:2,desc:'CD 8 秒・每場 2 次：改為全隊治療'},
            {lv:4,name:'聖療',type:'critHealLow',desc:'被動：治療生命低於半血的對象時，治療量翻倍'},
            {lv:6,name:'聖盾',type:'shieldOnHeal',amt:12,desc:'被動：被治療的對象獲得 12 點護盾'},
            {lv:8,name:'神恩',type:'cleanseOnHeal',desc:'被動：治療的同時解除對象的暈眩'} ],
  mage:[    {lv:2,name:'炎爆',type:'crit',cd:5000,uses:2,mult:1.8,desc:'CD 5 秒・每場 2 次：法術暴擊 ×1.8'},
            {lv:4,name:'護體罩',type:'deathSave',desc:'被動：每場第一次受致命傷免死，殘留 1 HP'},
            {lv:6,name:'奧術精通',type:'aoeBonus',desc:'被動：範圍法術命中 2 個以上敵人時，追加一輪全體傷害'},
            {lv:8,name:'連環施法',type:'doubleHit',cd:5000,uses:2,desc:'CD 5 秒・每場 2 次：追加一次施法'} ],
  rogue:[   {lv:2,name:'偷襲',type:'crit',cd:4500,uses:3,mult:1.9,desc:'CD 4.5 秒・每場 3 次：偷襲暴擊 ×1.9'},
            {lv:4,name:'連刺',type:'doubleHit',cd:4000,uses:3,desc:'CD 4 秒・每場 3 次：追加一擊'},
            {lv:6,name:'致命',type:'critVsStunned',desc:'被動：攻擊被暈眩的敵人時必定暴擊'},
            {lv:8,name:'割喉',type:'stun',cd:6000,uses:2,dur:1200,desc:'CD 6 秒・每場 2 次：割喉擊暈 1.2 秒'} ],
};
