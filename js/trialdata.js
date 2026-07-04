// ========================= v4.4 單人晉升試煉 · 資料（依《試煉關卡重設計_v0.1》全面重做）=========================
// 鐵律：關卡 N 為「打這關時手上擁有的技能組 R(N-1)」量身打造。怪物全部改用「試煉幻影傀儡」系列，
// 數值反推自各職業單人 DPS/EHP；每職業獨立縮放表；每關標注「鑰匙」（敗北畫面提示）。

// ---- 傀儡像素圖（構裝體風格：石/藤/玻璃/鐵/光影＋符文眼）----
Object.assign(SPRITES, {
  strawGolem:["............","...RRRRR....","..RrRRrRR...","..RRKRKRR...","...RRRRR....","..RRRRRRR...",".RRoRRRoRR..",".RRRRRRRRR..","..RRRRRRR...","..RrR.RrR...","..oo...oo...","............"],
  vineGolem:["....gg......","..gHHHHg....","..HgKgKH....","..HHHHHH....",".gHHeeHHg...","gHHHHHHHHg..","gHeHHHHeHg..",".HHHHHHHH...","..HHeeHH....","..Hg..gH....","..ee...ee...","............"],
  glassGolem:["....qq......","..qIqqIq....","..qKqqKq....","..IqqqqI....","..qqWWqq....",".qIqqqqIq...",".qqqWWqqq...","..Iqqqqq....","..qq..qq....","..I....I....","............"],
  ironGolem:["..jjjjjj....",".jwwwwwwj...",".jwKwwKwj...",".jwwwwwwj...","jjjjjjjjjj..","jwwjwwjwwj..","jwwwwwwwwj..","jjwwwwwwjj..",".jwwjjwwj...",".jjj..jjj...","............"],
  swarmWisp:["............","....YY......","...YFFY.....","..YFKKFY....","..YFFFFY....","...YFFY.....","....YY......","...Y..Y.....","............"],
  regenGolem:["...tttt.....","..tlltlt....","..tKllKt....","..tlllll....",".tlltlllt...","tllllllllt..","tlHllllHlt..",".tllllllt...","..tlHHlt....","..tt..tt....","............"],
  chargeGolem:["...tttt.....","..tFAFAt....","..tKAAKt....","..tAFAFt....",".ttAAAAtt...","ttFAFAFAtt..","ttAAAAAAtt..",".tAFAFAFt...","..tttttt....","..tt..tt....","............"],
  thornGolem:[".e..gg..e...","..egHHge....","..HgKgKH....",".eHHHHHe....","e.HHHHHH.e..",".gHeHHeHg...","egHHHHHHge..",".HHHHHHHH...","..He..eH....","..e....e....","............"],
  burnZealot:["....FF......","...FYYF.....","..FYKKYF....","..FYYYYF....","...FFFF.....","..FAFFAF....",".FAFFFFAF...",".FFFAAFFF...","..FFFFFF....","..FA..AF....","..F....F....","............"],
  lifeLeech:["....nn......","..nnxxnn....","..nxKKxn....","..nxxxxn....","...nxxn.....","..nnxxnn....",".nxxxxxxn...",".nxnxxnxn...","..nxxxxn....","..nn..nn....","............"],
  galeWisp:["............","...qWWq.....","..qWKWWq....","..WWWWWW....","...qWWq.....","..q.WW.q....","....WW......","...W..W.....","............"],
  voidWalker:["....zz......","..zxPPxz....","..zPKKPz....","..zPPPPz....",".zzPPPPzz...","zxPPPPPPxz..","zPPxPPxPPz..",".zPPPPPPz...","..zP..Pz....","..zz..zz....","............"],
});

// ---- 傀儡數值表（考題本體；scaleEnemy × 各職業階段 mul 後上場）----
const TRIAL_MOBS = {
  straw:  {sprite:'strawGolem', name:'草紮傀儡', hp:40,  atkSeq:[6,8],   def:0,  interval:2000, row:'front'},
  vine:   {sprite:'vineGolem',  name:'藤蔓傀儡', hp:70,  atkSeq:[22],    def:2,  interval:2800, row:'front'},
  glass:  {sprite:'glassGolem', name:'玻璃傀儡', hp:26,  atkSeq:[18,22], def:0,  interval:1500, row:'mid'},
  iron:   {sprite:'ironGolem',  name:'鐵殼傀儡', hp:90,  atkSeq:[10,12], def:25, interval:2200, row:'front'},
  wisp:   {sprite:'swarmWisp',  name:'蜂群傀儡', hp:14,  atkSeq:[5,6],   def:0,  interval:1400, row:'mid'},
  regen:  {sprite:'regenGolem', name:'自癒傀儡', hp:120, atkSeq:[10],    def:3,  interval:2000, healer:true, heal:10, row:'front'},
  charge: {sprite:'chargeGolem',name:'蓄能傀儡', hp:60,  atkSeq:[34],    def:2,  interval:4200, charge:true, row:'mid'},
  thorn:  {sprite:'thornGolem', name:'荊棘傀儡', hp:60,  atkSeq:[12],    def:4,  interval:2400, row:'front', skills:[{name:'荊棘',type:'reflect',frac:0.30}]},
  zealot: {sprite:'burnZealot', name:'燃燒狂徒', hp:80,  atkSeq:[14,16], def:0,  interval:1500, selfBurn:true, row:'front'},
  leech:  {sprite:'lifeLeech',  name:'暗影竊命者', hp:55, atkSeq:[10,12], def:2, interval:1600, row:'mid', skills:[{name:'竊命',type:'lifesteal',frac:0.6}]},
  gale:   {sprite:'galeWisp',   name:'迅風傀儡', hp:30,  atkSeq:[3,4],   def:0,  interval:700,  row:'mid'},
  walker: {sprite:'voidWalker', name:'亡域行者', hp:65,  atkSeq:[12,14], def:3,  interval:1800, row:'front'},
  // 關主（boss:true → 大體型）
  bossVine:  {sprite:'vineGolem',  name:'大藤蔓',   hp:160, atkSeq:[30],    def:3,  interval:3000, boss:true, row:'front'},
  bossGlass: {sprite:'glassGolem', name:'大玻璃',   hp:60,  atkSeq:[26,30], def:0,  interval:1300, boss:true, row:'front'},
  bossZealot:{sprite:'burnZealot', name:'大狂徒',   hp:200, atkSeq:[18,20], def:0,  interval:1400, boss:true, selfBurn:true, row:'front'},
  bossIron:  {sprite:'ironGolem',  name:'鐵殼巨像', hp:200, atkSeq:[14,16], def:25, interval:2400, boss:true, row:'front'},
  bossRune:  {sprite:'voidWalker', name:'符文巨像', hp:180, atkSeq:[12,14], def:6,  interval:1800, boss:true, row:'front'},
  bossOwl:   {sprite:'galeWisp',   name:'峽谷梟主', hp:170, atkSeq:[16,18], def:2,  interval:1500, boss:true, row:'front'},
  bossShade: {sprite:'lifeLeech',  name:'影主',     hp:150, atkSeq:[20,24], def:2,  interval:1400, boss:true, row:'front', skills:[{name:'竊命',type:'lifesteal',frac:0.5}]},
  bossHallow:{sprite:'regenGolem', name:'聖所之影', hp:150, atkSeq:[14,16], def:3,  interval:1700, boss:true, row:'front', skills:[{name:'震懾',type:'stun',cd:8000,uses:3,dur:1200}]},
};

// ---- 試煉場專屬戰鬥背景（battle.js create 時 lazy 生成 trialWall_/trialFloor_ + 職業）----
const TRIAL_BG = {
  warrior:{wall:{base:'#5a4632',b1:'#7a6244',b2:'#6a5238',hi:'#a8845a'}, floor:{base:'#8a6f47',tile:'#a08153',hi:'#c9a86a'}},   // 石鬥技場
  rogue:  {wall:{base:'#141a2e',b1:'#22304e',b2:'#1a2540',hi:'#4a5f8f'}, floor:{base:'#10141f',tile:'#1c2436',hi:'#33415f'}},   // 月夜庭園
  priest: {wall:{base:'#3a2c1a',b1:'#5e4526',b2:'#4c381f',hi:'#e0b060'}, floor:{base:'#2c2114',tile:'#463420',hi:'#8a6a34'}},   // 燭光聖所
  mage:   {wall:{base:'#1c1030',b1:'#32205a',b2:'#281847',hi:'#8a5fd0'}, floor:{base:'#140b22',tile:'#241440',hi:'#5a3a96'}},   // 符文穹頂
  ranger: {wall:{base:'#4a3520',b1:'#6a4c2c',b2:'#5a4026',hi:'#d08a4a'}, floor:{base:'#3a2a18',tile:'#523c22',hi:'#8a6234'}},   // 風峽獵場
};

// ---- 關卡定義：fights＝每場戰鬥的波次（依戰鬥順序）、boss＝關主波、mul＝該關縮放、key＝鑰匙（敗北提示）----
const _W1={type:'tree',x:452,y:250}, _W2={type:'tree',x:448,y:452}, _CF={type:'campfire',x:452,y:250}, _ST={type:'statue',x:455,y:245},
      _PL={type:'pool',x:452,y:400}, _RF={type:'rift',x:522,y:300}, _PT={type:'pit',x:452,y:400}, _PT2={type:'pit',x:562,y:438},
      _FE={type:'fence',x:448,y:452}, _LV={type:'lava',x:452,y:400}, _AL={type:'altar',x:455,y:245};
const _R=(a)=>[a,a,a,a,a];   // 每波沿用同一物件配置
const TRIAL_DEFS = {
  warrior:{ name:'力之試煉場', dest:0, stages:[
    { title:'見習之錘', weather:'clear', mul:0.9, plan:['battle','camp','battle'], key:'戰吼（越殘血越兇）＋棘刺反彈',
      fights:[ [['straw']], [['vine']] ], boss:[['bossVine']], objs:_R([_CF]),
      hint:'💡 藤蔓傀儡出手慢但極痛——棘刺會反彈牠的重擊，殘血時戰吼加成更高！' },
    { title:'正式之盾', weather:'clear', mul:1.0, plan:['battle','battle','camp','battle'], key:'熊人變身扛傷＋拔樹清群',
      fights:[ [['wisp','wisp','wisp']], [['straw','wisp','wisp']], [['wisp','wisp','wisp','wisp']] ], boss:[['bossVine']], objs:_R([_W1,_W2]) },
    { title:'菁英之怒', weather:'rain', mul:1.1, plan:['battle','battle','camp','battle'], key:'大吼打斷蓄能＋不屈保底',
      fights:[ [['charge']], [['charge','glass']], [['charge','charge']] ], boss:[['bossVine']], objs:_R([_W1,_CF]) },
    { title:'大師之壁', weather:'fog', mul:1.2, plan:['battle','battle','camp','battle','battle'], key:'破甲＋牛頭人穿透鐵殼',
      fights:[ [['iron']], [['iron','glass']], [['iron','iron']], [['iron','charge']] ], boss:[['bossIron']], objs:_R([_W1,_FE]) } ]},
  rogue:{ name:'影之試煉場', dest:1, stages:[
    { title:'見習之刃', weather:'fog', mul:0.8, plan:['battle','camp','battle'], key:'霧影暴擊先手＋韌性翻盤',
      fights:[ [['glass']], [['glass','glass']] ], boss:[['bossGlass']], objs:_R([_ST]),
      hint:'💡 玻璃傀儡誰先出手誰贏——濃霧讓你的每一擊都可能暴擊，掩體在場背刺必暴！' },
    { title:'正式之影', weather:'fog', mul:0.9, plan:['battle','battle','camp','battle'], key:'割喉暈眩＋暗殺處決自癒者',
      fights:[ [['regen']], [['glass','glass']], [['regen']] ], boss:[['bossGlass']], objs:_R([_ST,_W2]) },
    { title:'菁英之毒', weather:'clear', mul:1.0, plan:['battle','battle','camp','battle'], key:'移形換位躲重擊（巨木代承）',
      fights:[ [['thorn']], [['vine','glass']], [['thorn','vine']] ], boss:[['bossShade']], objs:_R([_W1,_W2]) },
    { title:'大師之殺', weather:'fog', mul:1.1, plan:['battle','battle','camp','battle','battle'], key:'狂暴連擊＋嗜血以戰養戰',
      fights:[ [['walker','walker']], [['walker','leech']], [['walker','walker','leech']], [['walker','walker','walker']] ], boss:[['bossShade']], objs:_R([_ST,_PT]) } ]},
  priest:{ name:'祈之試煉場', dest:2, stages:[
    { title:'見習之禱', weather:'rain', mul:0.6, plan:['battle','camp','battle'], key:'撐住——敵人會自己燒死（群療＋聖療）',
      fights:[ [['zealot']], [['zealot','zealot']] ], boss:[['bossZealot']], objs:_R([_LV]),
      hint:'💡 燃燒狂徒會自燃掉血——你不用打贏牠，只要奶住自己撐到牠燒完！岩漿只燒前排。' },
    { title:'正式之光', weather:'clear', mul:0.75, plan:['battle','battle','camp','battle'], key:'阿加托斯 +ATK（單人＝輸出翻倍）＋聖盾抵吸血',
      fights:[ [['leech']], [['leech','zealot']], [['leech','leech']] ], boss:[['bossZealot']], objs:_R([_ST]) },
    { title:'菁英之風', weather:'snow', mul:0.9, plan:['battle','battle','camp','battle'], key:'祈禱→凜冬遲滯，迅風變無害',
      fights:[ [['gale','gale']], [['gale','gale','gale']], [['gale','zealot','gale']] ], boss:[['bossZealot']], objs:_R([_ST]) },
    { title:'大師之冬', weather:'snow', mul:1.0, plan:['battle','battle','camp','battle','battle'], key:'卡科斯雙減＋神恩自解震懾',
      fights:[ [['charge']], [['charge','gale']], [['leech','charge']], [['charge','charge']] ], boss:[['bossHallow']], objs:_R([_AL]) } ]},
  mage:{ name:'法之試煉場', dest:3, stages:[
    { title:'見習之火', weather:'clear', mul:0.7, plan:['battle','camp','battle'], key:'火球 AoE＋營火引燃連鎖',
      fights:[ [['wisp','wisp','wisp','wisp']], [['wisp','wisp','wisp','wisp']] ], boss:[['bossRune']], objs:_R([_CF]),
      hint:'💡 蜂群傀儡血少量多——火球天生範圍傷害，命中時營火還會引燃連鎖轟全場！' },
    { title:'正式之魂', weather:'rain', mul:0.85, plan:['battle','battle','camp','battle'], key:'靈魂震爆真傷壓過自癒＋炎爆延燒',
      fights:[ [['regen']], [['wisp','wisp','regen']], [['regen','regen']] ], boss:[['bossRune']], objs:_R([_CF,_PL]) },
    { title:'菁英之凍', weather:'rain', mul:1.0, plan:['battle','battle','camp','battle'], key:'冰封（雨天範圍化）凍快攻＋連環導電',
      fights:[ [['gale','gale']], [['gale','glass','gale']], [['gale','gale','gale']] ], boss:[['bossRune']], objs:_R([_PL]) },
    { title:'大師之爆', weather:'clear', mul:1.1, plan:['battle','battle','camp','battle','battle'], key:'隕石全暈全傷＋裂縫空間增幅',
      fights:[ [['wisp','wisp','wisp','wisp']], [['walker','wisp','wisp']], [['walker','walker','wisp','wisp']], [['iron','wisp','wisp']] ], boss:[['bossRune']], objs:_R([_RF,_LV]) } ]},
  ranger:{ name:'獵之試煉場', dest:4, stages:[
    { title:'見習之弓', weather:'clear', mul:0.7, plan:['battle','camp','battle'], key:'射速競賽＋補刀連射收尾',
      fights:[ [['vine']], [['vine','straw']] ], boss:[['bossVine']], objs:_R([_CF]),
      hint:'💡 藤蔓傀儡走得慢打得痛——在被摸到前射倒牠；補刀連射會自動收掉殘血！' },
    { title:'正式之靈', weather:'wind', mul:0.85, plan:['battle','battle','camp','battle'], key:'火精靈點殺自癒者＋爆裂箭引燃',
      fights:[ [['regen']], [['regen','straw']], [['regen','glass']] ], boss:[['bossOwl']], objs:_R([_CF]) },
    { title:'菁英之風', weather:'wind', mul:1.0, plan:['battle','battle','camp','battle'], key:'回風吹殘血入坑＋精靈羈絆加速',
      fights:[ [['wisp','wisp','wisp','wisp']], [['gale','wisp','wisp']], [['wisp','wisp','wisp','wisp','wisp']] ], boss:[['bossOwl']], objs:_R([_PT,_PT2]) },
    { title:'大師之獵', weather:'fog', mul:1.1, plan:['battle','battle','camp','battle','battle'], key:'火/風精靈切換：點殺與清場',
      fights:[ [['walker','walker']], [['walker','wisp','wisp']], [['regen','walker']], [['walker','walker','walker']] ], boss:[['bossOwl']], objs:_R([_PT,_CF]) } ]},
};
// ---- v4.5 試煉場招牌互動物件：每場一件、與職業核心動詞綁定 ----
Object.assign(SPRITES, {
  warGong:  ["....KKKK....","...KGGGGK...","..KGoGGoGK..","..KGGGGGGK..","..KGoGGoGK..","...KGGGGK...","....KKKK....","..B..KK..B..","..B.KKKK.B..","..BBBBBBBB..","...B....B..."],
  stoneLantern:["...tttt.....","..tTTTTt....","..tYYYYt....","..tYKKYt....","..tYYYYt....","..tTTTTt....","...tttt.....","....tt......","...tttt.....","..tTTTTt....","..tttttt...."],
  wishCandles:["............","..F..F..F...","..Y..Y..Y...","..M..M..M...","..M..M..M...","..M..M..M...",".BBBBBBBBB..",".BbBBBBbBB..","..BBBBBBB..."],
  arcTower: ["....qq......","...qIIq.....","..qIuuIq....","..qIuuIq....","...qIIq.....","...quuq.....","...tttt.....","..tTTTTt....","..tttttt....",".tTTTTTTt..."],
  windTotem:["...oWWo.....","..oBBBBo....","..oBKKBo....","..oBBBBo....","..gBooBg....","..oBBBBo....","..oBKKBo....","..oBBBBo....","...oBBo.....","...gggg....."],
});
Object.assign(BATTLE_OBJECTS, {
  gong:    { sprite:'warGong',      name:'鬥技銅鑼', icon:'🔔', tags:['gong'],   dur:2, scl:4 },   // 戰吼共鳴：全敵出手延遲
  lantern: { sprite:'stoneLantern', name:'石燈籠',   icon:'🏮', tags:['lantern'],dur:1, scl:4 },   // 盜賊吹燈：全場入暗、暗中暴擊率大增
  candles: { sprite:'wishCandles',  name:'祈願燭台', icon:'🕯', tags:['candle'], dur:3, scl:4, renew:'candle' },   // 每次治療點亮一燭；點滿三燭降小神蹟後重燃
  crystal: { sprite:'arcTower',     name:'奧術水晶塔', icon:'🔮', tags:['zap'],  dur:4, scl:4, aura:'zap' },       // 魔力協奏：週期電擊隨機敵人
  totem:   { sprite:'windTotem',    name:'獵風圖騰', icon:'🌀', tags:['haste'],  dur:3, scl:4, aura:'hastePulse' },// 順風脈衝：週期為我方全體加速
});
// 每關每波自動加掛該職業的招牌物件（我方側，單人試煉不會撞位）
const TRIAL_SIGN={ warrior:{type:'gong',x:346,y:236}, rogue:{type:'lantern',x:350,y:236}, priest:{type:'candles',x:348,y:240},
                   mage:{type:'crystal',x:350,y:236}, ranger:{type:'totem',x:350,y:238} };
Object.keys(TRIAL_DEFS).forEach(sp=>{ const sig=TRIAL_SIGN[sp];
  TRIAL_DEFS[sp].stages.forEach(sd=>{ sd.objs=(sd.objs||[]).map(w=>w.concat([sig])); }); });

// 該階解鎖的技能清單（簡報與晉升結算共用）
function trialStageSkills(sprite, stage){ return (SKILLS[sprite]||[]).filter(s=>(s.rank||0)===stage); }
