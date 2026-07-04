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
    // v1.6 裝備取得（保證拿得到）— 想調回更稀有就改這裡
    pickValuable:0.32, pickArmor:0.28, pickWeapon:0.28,   // 通用掉落權重：貴重/防具/武器（其餘為道具；原本武器只有 0.16）
    battleGearChance:0.30, battleGearWeaponBias:0.60,      // 一般戰鬥掉裝機率＋其中武器佔比（原本一般戰鬥完全不掉裝）
    chestMaterialChance:0.22, chestWeaponBias:0.55,        // 寶箱給素材的機率（原 0.34）／給裝備時武器佔比
  },
  // v1.6 商店：各階級每趟商店數、類型偏向裝備、每趟第一間保證裝備商
  // v1.7 類型權重：藥水商 / 流浪商人(綜合商) / 其餘平分給 武器商・防具商
  shop: { perTier:[1,2,2,2,2,2,3,3], potionWeight:0.22, merchantWeight:0.26, guaranteeGearFirst:true },   // v2.2：擴到 8 階（第二世界 tier 5-8）

  // 敵人強度縮放：scale = (1+層數*layerScale)*(1+(階級-1)*tierScale)；王戰用 bossTierScale
  // v0.7 平衡：壓低 layer 斜率（緩和開局深層/精英過硬）、拉高 tier 斜率（讓中後期不再無腦輾壓）
  enemy: { depthScale:0.9, tierScale:0.40, bossTierScale:0.50 },   // depthScale：探險 0→100% 額外強度（1.2→0.9 收斂後段）


  // v0.9 雙軌經濟（數值為架構草案，平衡期再調）
  gold: { stipendBase:40, stipendPerParty:20, sellRate:0.7, battleBase:16, battlePerRisk:12 },   // 出發補給金＋一般戰鬥掉金=（battleBase+風險*perRisk）×目的地階級
  autoSip: { hpFrac:0.30, cooldownMs:2500 },   // 戰鬥中最低血隊員 < hpFrac 時自動喝最弱的補血藥水（冷卻 cooldownMs）
  repCost: { partySlot:[3,5,8,12], craftsman:[2,4,6], leader:3, upgradeBase:2, upgradePerCraft:2 },
  repEarn: { perRelic:3, perReturn:1 },   // 帶回新遺物 +3、平安折返 +1

  // ===== v3.4 清晰節奏模式（可開關，GUILD.settings.pacing；預設開）=====
  pacing: {
    beatMs:170,        // A 行動節拍器：全場兩次「起手」的最短間隔（遊戲毫秒，隨倍率縮放）——同一瞬間只有一人出手
    ultFreezeMs:360,   // C 大招定格：大招施放瞬間全場停頓（實際時長會除以速度倍率）
    ultZoom:1.14,      // C 大招定格：施法者放大脈動倍率
    quietFx:true,      // B 降噪：普攻不閃屏不震動、微傷害跳字縮小、技能名氣泡只留大招
  },

  // ===== v3.0 戰場環境系統（物件×天氣×技能協同）——所有可調數值集中於此 =====
  env: {
    spawnNone:0.35, spawnOne:0.40,               // 每場物件數：0 / 1 / 2 個的機率（其餘為 2 個）
    campfireChain:{ base:8, perTier:2, rainMul:0.5 },   // 火系技能引燃火源 → 全敵環境傷害；雨天減半
    treeThrowMult:1.6,                            // 變身戰士拔樹投擲：全敵 ATK×此倍率（消耗樹木）
    backstabMult:1.7,                             // 盜賊藉掩體背刺：必定暴擊的倍率
    fogRogueCrit:0.25, fogCritMult:1.7,           // 濃霧：盜賊每擊追加暴擊機率／倍率
    fogRangedMul:0.8,  windRangedMul:0.85,        // 濃霧/強風：雙方遠程（非精靈）傷害倍率
    windSummonMul:1.25,                           // 強風：召喚精靈攻擊倍率
    snowIntervalMul:1.12,                         // 雪：全場出手間隔倍率（變慢）
    rainFireMul:0.75,                             // 雨：火系技能傷害倍率（削弱）
    galeSlowMul:1.35, galeSlowMs:3000, pitHpFrac:0.20,   // 回風：降速倍率/時長；地坑：吹落的殘血門檻
    lavaBurnBase:3, lavaBurnPerTier:1, lavaEveryMs:2600, lavaAbsorbAtk:4,   // 岩漿：週期灼燒（敵我前排）；火法師改吸收+ATK
    bogEveryMs:3200, poisonTickMs:2000, poisonDmgPerStack:3, poisonMaxStacks:5,   // 毒沼疊毒與毒 DoT 結算
    campfireRestFrac:0.06,                        // 波次清空且營火存活：全隊回血比例
    // v3.2 場景編排（vignette）：物件＝遭遇現場的敘事，由該波敵人組成決定演出
    vig:{ campChance:0.6, pitChance:0.6, shrineChance:0.7, groveChance:0.5, groveMax:3,
          poolChance:0.6, riftChance:0.6,         // v3.3：水坑湧出／空間裂縫竄出
          startleMs:900,                          // 營火驚動：敵人首次出手延遲（我方先手窗口）
          campRadius:86 },                        // 圍火圈坐半徑
    voidAmpMult:1.35, voidStunMul:1.4,            // v3.3 空間裂縫增幅：空間魔法傷害倍率／隕石暈眩時長倍率
    roastHealFrac:0.15, roastHpFrac:0.55, roastCdMs:6000,   // v3.3 烤肉：回血比例／低於此血量會去吃／每敵冷卻
    pray:{ atkAmt:6, atkDur:5000, healFrac:0.22, dodgeCharges:1, hasteMul:0.8, hasteMs:5000, slowMs:5000, upMul:1.6 },   // 祈禱神蹟數值；upMul＝神像升階倍率
  },
};
