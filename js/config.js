// ========================= 平衡設定（集中所有可調數值）=========================
// 想調整全遊戲的數值平衡，改這裡就好，不必再翻各個 scene / state 檔案。
// 純內容資料（武器、技能、陣形、敵人組合…）仍放在 data.js。
const CFG = {
  // 升級曲線：每級所需經驗 = base + level*perLevel
  xp: { base:80, perLevel:40 },

  // 戰後獲得經驗：王戰固定 boss；一般戰 = base + 風險*perRisk
  battleXp: { boss:200, base:40, perRisk:25 },

  // 設施升級費用：cost = base + (目前等級-1)*step
  cost: {
    temple:  { base:120, step:120 },   // 神殿（+1 遺物槽）
    outfit:  { base:100, step:100 },   // 整備所（+1 食物/貨格）
    wagonUp: { base:80,  step:80  },   // 各馬車升級
  },

  // 招募：戰鬥成員職業槽。warrior 開局即有；其餘需 funds＋聲望(遺物種類數)門檻
  // tierCaps：占位者各階(0/1/2)的等級上限；tierUp：升階成本(funds)與聲望門檻
  recruit: {
    classes: {
      ranger: { cost:0,   repReq:0, name:'遊俠' },
      priest: { cost:0,   repReq:0, name:'牧師' },
      mage:   { cost:250, repReq:3, name:'法師' },
      rogue:  { cost:400, repReq:5, name:'盜賊' },
    },
    tierCaps: [5, 8, 12],                 // tier0→Lv5、tier1→Lv8、tier2→Lv12
    tierUp:   [ {cost:300, repReq:3}, {cost:700, repReq:6} ],  // 升 tier1 / tier2
  },

  // 後勤：工匠（學徒1/師傅2/大師3）與領隊聘僱
  staff: {
    craftsman: [ {cost:200, repReq:0, name:'學徒工匠'}, {cost:600, repReq:4, name:'師傅工匠'}, {cost:1400, repReq:8, name:'大師工匠'} ],
    leader:    { cost:350, repReq:2, name:'領隊' },
  },

  // 商會賣價 = 物品價值 × sellRate
  merchant: { sellRate:0.7 },

  // 訓練所方案：[名稱, 費用, 每人經驗, 顏色]
  training: { plans:[ ['輕度特訓',60,50,'#9fd0a0'], ['標準特訓',150,140,'#9fe8ff'], ['精英特訓',400,400,'#ffd24a'] ] },

  // 神殿祝福：每 valuePerTier 點遺物價值算 +1 階；各加成類型「每階」的量
  // all = 未指定類型的通用遺物（同時加少量攻防血）
  blessing: { valuePerTier:300, atk:2, def:2, hp:10, heal:3, drop:0.04, food:1, allAtk:1, allDef:1, allHp:6 },

  // 聲望：遺物數 >= thresholds 對應 Tier 3/2/1；各 Tier 的開局贊助
  reputation: {
    thresholds:[6,3,1],
    sponsorship:[ {food:0,funds:0}, {food:1,funds:20}, {food:2,funds:50}, {food:3,funds:100} ],
  },

  // 戰鬥
  battle: {
    postHealAlive:0.10,    // 戰後：存活者回復的最大 HP 比例
    postHealRevive:0.15,   // 戰後：陣亡者以此比例復活
    healThreshold:0.75,    // 牧師：隊友血量低於此比例才補
    healVariance:6,        // 治療量隨機上浮 (heal ~ heal+N)
    bossRelicValue:500,    // 王戰固定掉落遺物的價值
  },

  // 飢餓懲罰：糧食透支時，每次對全隊扣除的最大 HP 比例
  starve: { damage:0.15 },

  // 掉落：機率與價值（tier 由風險與目的地階級決定）
  loot: {
    relicChanceBase:0.08, relicChancePerRisk:0.06,   // 遺物掉落機率 = base + 風險*perRisk + 祝福遺物率
    relicValueBase:200,   relicValuePerTier:120,
    valuableBase:30,      valuablePerTier:40,
    gearBase:25,          gearPerTier:25,             // 武器/防具
    consumBase:15,        consumPerTier:15,           // 道具
  },

  // 敵人強度縮放：scale = (1+層數*layerScale)*(1+(階級-1)*tierScale)；王戰用 bossTierScale
  enemy: { layerScale:0.16, tierScale:0.22, bossTierScale:0.25 },

  // 地圖節點機率（每層 roll）：< battle 為戰鬥、< event 為事件、< chest 為寶箱，其餘為精英
  map: { battleRoll:0.42, eventRoll:0.62, chestRoll:0.84 },
};
