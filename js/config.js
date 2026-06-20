// ========================= 平衡設定（集中所有可調數值）=========================
// 想調整全遊戲的數值平衡，改這裡就好，不必再翻各個 scene / state 檔案。
// 純內容資料（武器、技能、陣形、敵人組合…）仍放在 data.js。
const CFG = {
  // 升級曲線：每級所需經驗 = base + level*perLevel
  xp: { base:80, perLevel:40 },

  // 戰後獲得經驗：王戰固定 boss；一般戰 = base + 風險*perRisk
  battleXp: { boss:200, base:40, perRisk:25 },

  // 後勤：工匠（學徒1/師傅2/大師3）與領隊聘僱
  staff: {
    craftsman: [ {cost:200, repReq:0, name:'學徒工匠'}, {cost:600, repReq:4, name:'師傅工匠'}, {cost:1400, repReq:8, name:'大師工匠'} ],
    leader:    { cost:350, repReq:2, name:'領隊' },
  },

  // 聲望：遺物數 >= thresholds 對應 Tier 3/2/1；各 Tier 的開局贊助
  reputation: {
    thresholds:[6,3,1],
  },

  // 戰鬥
  battle: {
    postHealAlive:0.10,    // 戰後：存活者回復的最大 HP 比例
    postHealRevive:0.15,   // 戰後：陣亡者以此比例復活
    healThreshold:0.75,    // 牧師：隊友血量低於此比例才補
    healVariance:6,        // 治療量隨機上浮 (heal ~ heal+N)
    bossRelicValue:500,    // 王戰固定掉落遺物的價值
  },

  // 掉落：機率與價值（tier 由風險與目的地階級決定）
  loot: {
    relicChanceBase:0.08, relicChancePerRisk:0.06,   // 遺物掉落機率 = base + 風險*perRisk + 祝福遺物率
    relicValueBase:200,   relicValuePerTier:120,
    valuableBase:30,      valuablePerTier:40,
    gearBase:25,          gearPerTier:25,             // 武器/防具
    consumBase:15,        consumPerTier:15,           // 道具
  },

  // 敵人強度縮放：scale = (1+層數*layerScale)*(1+(階級-1)*tierScale)；王戰用 bossTierScale
  // v0.7 平衡：壓低 layer 斜率（緩和開局深層/精英過硬）、拉高 tier 斜率（讓中後期不再無腦輾壓）
  enemy: { depthScale:0.9, tierScale:0.40, bossTierScale:0.50 },   // depthScale：探險 0→100% 額外強度（1.2→0.9 收斂後段）


  // v0.9 雙軌經濟（數值為架構草案，平衡期再調）
  gold: { stipendBase:40, stipendPerParty:20, sellRate:0.7, battleBase:16, battlePerRisk:12 },   // 出發補給金＋一般戰鬥掉金=（battleBase+風險*perRisk）×目的地階級
  autoSip: { hpFrac:0.30, cooldownMs:2500 },   // 戰鬥中最低血隊員 < hpFrac 時自動喝最弱的補血藥水（冷卻 cooldownMs）
  repCost: { partySlot:[3,5,8,12], craftsman:[2,4,6], leader:3, upgradeBase:2, upgradePerCraft:2 },
  repEarn: { perRelic:3, perReturn:1 },   // 帶回新遺物 +3、平安折返 +1
};
