// ========================= 全域狀態 =========================
let RUN = null;

// 職業槽索引（對應 HERO_BASE 順序）：戰士0 遊俠1 牧師2 法師3 盜賊4
const SPRITE_INDEX = {}; HERO_BASE.forEach((h,i)=>{ SPRITE_INDEX[h.sprite]=i; });
const CLASS_ORDER = HERO_BASE.map(h=>h.sprite);   // ['warrior','ranger','priest','mage','rogue']

// ---- v0.9 職業裝備限制：武器依職業、防具依重量 ----
const WEAPON_CLASS = { '鐵劍':'warrior','雙手斧':'warrior','雙刃劍':'warrior','巨劍':'warrior',
  '短弓':'ranger','獵弓':'ranger','戰弓':'ranger', '橡木杖':'priest','聖光杖':'priest','神息法杖':'priest',
  '火花杖':'mage','烈焰法杖':'mage', '短刃':'rogue','匕首':'rogue' };
const ARMOR_CLASSES = { '布衣':['warrior','ranger','priest','mage','rogue'], '皮甲':['warrior','ranger','rogue'],
  '鎖子甲':['warrior'], '法袍':['priest','mage'], '精鋼板甲':['warrior'], '守護重盔':['warrior'],
  '法師長袍':['priest','mage'], '龍鱗甲':['warrior'] };
const CLASS_LABEL = { warrior:'戰士', ranger:'遊俠', priest:'牧師', mage:'法師', rogue:'盜賊' };
function weaponClassOK(sprite,w){ if(!w) return true; const c=WEAPON_CLASS[w.name]; return !c || c===sprite; }
function armorClassOK(sprite,a){ if(!a) return true; const cs=ARMOR_CLASSES[a.name]; return !cs || cs.includes(sprite); }
function gearClassOK(sprite,item){ if(!item) return true; const g=item.gear||item;
  if(item.kind==='武器'|| (g&&g.atkSeq)) return weaponClassOK(sprite,g);
  if(item.kind==='防具'|| (g&&g.def!==undefined&&!g.atkSeq)) return armorClassOK(sprite,g);
  return true; }
function weaponClassLabel(w){ const c=WEAPON_CLASS[w.name]; return c?CLASS_LABEL[c]:'通用'; }
function armorClassLabel(a){ const cs=ARMOR_CLASSES[a.name]; return (!cs||cs.length>=5)?'通用':cs.map(x=>CLASS_LABEL[x]).join('/'); }

// 跨輪保存的公會狀態
function defaultGuild(){ return {
  settings:{ autoSip:true },
  relics:[], reputation:0, repEarned:0, partySize:1,   // reputation 可花費、repEarned 累計門檻；partySize 1→5
  formation:0,
  formationsUnlocked:{},        // 已用聲望解鎖的隊形索引（基礎三角 cost0 永遠可用）
  horse:0,                       // 馬匹：純貨格（後勤）：0均衡6(預設)/1耐力9/2力量12
  horsesUnlocked:{},            // 已用聲望解鎖的馬匹索引（普通馬／均衡馬 cost0 永遠可用）
  materials:{},                 // 素材（工坊強化用，跨趟保留）；食材改為每趟隨身、不入公會
  staff:{ craftsman:0, leader:0 },// 後勤：工匠階級0-3、領隊0/1
  upgrades:{},                   // 項目化強化已解鎖項目 {id:true}
  discovered:{},                 // 收藏圖鑑：曾取得過的物品名稱
  owned:{},                      // 已擁有的武器/防具（唯一，不計數量）
}; }
let GUILD = defaultGuild();

// 五個職業槽：unlocked＝是否已加入出戰、tier＝占位者階級（決定等級上限）、level/xp、weapon/armor、skills（隨機雙技能，Phase D）
function newRosterSlot(unlocked){ return {unlocked:!!unlocked, tier:0, level:1, xp:0, weapon:null, armor:null, skills:null}; }
function defaultRoster(){ return [ newRosterSlot(true), newRosterSlot(true), newRosterSlot(true), newRosterSlot(true), newRosterSlot(true) ]; }   // v0.9：五職業固定皆可用，由 partySize 決定帶幾個
let ROSTER = defaultRoster();   // 開局只有戰士；其餘於招募所解鎖
function ensureRoster(){ while(ROSTER.length<CLASS_ORDER.length) ROSTER.push(newRosterSlot(false));
  ROSTER.forEach((r,i)=>{ if(r.unlocked==null)r.unlocked=false; if(r.tier==null)r.tier=0; if(r.level==null)r.level=1; if(r.xp==null)r.xp=0;
    if(r.unlocked && !Array.isArray(r.skills)) r.skills=[]; }); }
function activeRoster(){ const out=[]; ROSTER.forEach((r,i)=>{ if(r.unlocked) out.push(i); }); const list=out.length?out:[0]; return list.slice(0, Math.max(1, GUILD.partySize||1)); }

let BATTLE_SPEED = 1;   // 戰鬥速度倍率（1/2/4），跨場記住
let TARGET_ORDER = ['lowHp','healer','back','front','lowDef','status'];   // 我方鎖定優先序（由上到下），跨場記住

// ---- 存檔持久化（localStorage）。SAVE_KEY 升 v2：舊檔不遷移、直接以新結構重置 ----
const SAVE_KEY = 'relicCaravanSave_v4';   // v0.9 roguelike：只持久化公會資產；隊伍免洗、跑地城不存檔
// 只持久化「公會資產」。ROSTER 僅存永久部分（解鎖、起始裝階 tier）；本趟 level/xp/裝備/技能不存。
function saveGuild(){ try{
  const slim = ROSTER.map(r=>({unlocked:!!r.unlocked, tier:r.tier||0}));
  localStorage.setItem(SAVE_KEY, JSON.stringify({GUILD, ROSTER:slim}));
}catch(e){} }
function loadGuild(){ try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(s&&s.GUILD){
    GUILD=Object.assign(defaultGuild(), s.GUILD);    if(!GUILD.materials) GUILD.materials={};    if(!GUILD.staff) GUILD.staff={craftsman:0,leader:0};
    if(!GUILD.upgrades) GUILD.upgrades={};
    if(!GUILD.discovered) GUILD.discovered={};
    if(!GUILD.owned) GUILD.owned={};
    if(!GUILD.formationsUnlocked) GUILD.formationsUnlocked={};
    if(!GUILD.horsesUnlocked) GUILD.horsesUnlocked={};
    if(!GUILD.settings) GUILD.settings={autoSip:true};
    if(GUILD.horse==null||GUILD.horse>=HORSES.length) GUILD.horse=0;    if(GUILD.partySize==null) GUILD.partySize=1;
    if(GUILD.reputation==null) GUILD.reputation=0;
    if(GUILD.repEarned==null) GUILD.repEarned=GUILD.reputation||0;    if(GUILD.formation==null||GUILD.formation>=FORMATIONS.length) GUILD.formation=0;
    if(Array.isArray(s.ROSTER)&&s.ROSTER.length>=1){
      ROSTER = s.ROSTER.map(r=>{ const slot=newRosterSlot(!!r.unlocked); slot.tier=(r&&r.tier)||0; return slot; });
      ensureRoster();
    }
  }
}catch(e){} }
function resetSave(){ try{ ['relicCaravanSave_v4','relicCaravanSave_v3','relicCaravanSave_v2','relicCaravanSave_v1'].forEach(k=>localStorage.removeItem(k)); }catch(e){}
  GUILD=defaultGuild(); ROSTER=defaultRoster(); ensureRoster(); }
loadGuild(); ensureRoster();

// ---- 素材 / 食材 資源存取（名稱→數量）----
function addMaterial(name,n){ GUILD.materials[name]=(GUILD.materials[name]||0)+(n||1); }
function matCount(name){ return GUILD.materials[name]||0; }
// 食材：每趟隨身（貨車），料理直接消耗，不入公會
function cargoIngCount(id){ const c=(typeof RUN!=='undefined'&&RUN&&RUN.cargo)?RUN.cargo:[]; return c.filter(it=>it.kind==='食材'&&it.ingId===id).length; }

// ---- 馬匹（單馬車＋選馬）＋ 工匠項目化強化：最終食物/貨格 ----
function upgradeEffectTotal(){ let slots=0; UPGRADES.forEach(u=>{ if(GUILD.upgrades&&GUILD.upgrades[u.id]){ slots+=u.effect.slots||0; } }); return {slots}; }
function wagonStats(){ const h=HORSES[GUILD.horse]||HORSES[0]; const up=upgradeEffectTotal();
  return { name:'探險馬車', horse:h.name, horseDesc:h.desc, slots:h.slots+up.slots, upSlots:up.slots }; }
function upgradeOwned(id){ return !!(GUILD.upgrades&&GUILD.upgrades[id]); }
function upgradeRepCost(u){ return CFG.repCost.upgradeBase + CFG.repCost.upgradePerCraft*(u.craftReq||0); }
function canBuyUpgrade(u){ if(upgradeOwned(u.id)) return false; if(craftsmanTier()<u.craftReq) return false; if(!canSpendRep(upgradeRepCost(u))) return false;
  const m=u.cost.mats||{}; for(const k in m){ if(matCount(k)<m[k]) return false; } return true; }
function buyUpgrade(u){ if(!canBuyUpgrade(u)) return false; spendRep(upgradeRepCost(u)); const m=u.cost.mats||{}; for(const k in m){ GUILD.materials[k]=(GUILD.materials[k]||0)-m[k]; } GUILD.upgrades[u.id]=true; saveGuild(); return true; }
function upgradeCostText(u){ const parts=['⭐'+upgradeRepCost(u)]; const m=u.cost.mats||{}; for(const k in m){ const md=MATERIAL_BY_ID[k]; parts.push(`${md?md.icon:''}${md?md.name:k}×${m[k]}`); } return parts.join(' '); }
// 掉落物件（探險中入貨車）。素材：結算自動入庫；食材：每趟隨身、料理消耗、不入庫；全滅則失
function makeMaterialItem(di){ const m=MATERIAL_BY_DEST[di]; if(!m) return null; return {kind:'素材', matId:m.id, name:m.name, icon:m.icon, value:20}; }
function makeIngredientItem(di){ const g=INGREDIENT_BY_DEST[di]; if(!g) return null; return {kind:'食材', ingId:g.id, name:g.name, icon:g.icon, value:12}; }

// ---- 領隊・料理：消耗食材（公會庫存）產生補血／本趟增益 ----
function recipeNeedText(r){ return Object.keys(r.need).map(k=>{ const g=INGREDIENT_BY_ID[k]; return `${g?g.icon:''}${g?g.name:k}×${r.need[k]}`; }).join(' '); }
// 可料理：有領隊，或工匠強化「隨車鍋」(campstove) 解鎖後也能煮
function canCook(r){ if(!hasLeader() && !hasCampstove()) return false; for(const k in r.need){ if(cargoIngCount(k)<r.need[k]) return false; } return true; }
function cook(r){ if(!canCook(r)) return null; for(const k in r.need){ let need=r.need[k]; for(let i=RUN.cargo.length-1;i>=0&&need>0;i--){ if(RUN.cargo[i].kind==='食材'&&RUN.cargo[i].ingId===k){ RUN.cargo.splice(i,1); need--; } } }
  let msg='料理「'+r.name+'」：';
  if(r.heal && RUN){ let n=0; RUN.heroes.forEach(h=>{ if(h.hp>0){ const mx=heroStat(h).maxHp; const b=h.hp; h.hp=Math.min(mx,h.hp+Math.round(mx*r.heal)); if(h.hp>b)n++; } }); msg+=`回復 ${n} 人 `; }
  // v0.8：buff 從數值改成一次性功能（下一場戰鬥生效）
  if(r.grant && RUN){
    if(r.grant==='shield'){ RUN.cookShield=(RUN.cookShield||0)+(r.amt||20); msg+=`下場開場護盾 +${r.amt||20}`; }
    else if(r.grant==='revive'){ RUN.reviveCharge=(RUN.reviveCharge||0)+1; msg+='下場 +1 次陣亡復活'; }
    else if(r.grant==='firstCrit'){ RUN.cookFirstCrit=true; msg+='下場全隊首擊必暴'; }
  }
  return msg; }

// ---- 遺物效果：已收集的遺物即時、永久生效（取代神殿供奉）----
// 數值加成累加；規則型旗標 OR 起來。供 heroStat / 戰鬥 / 地圖讀取。
function relicEffects(){
  const e={atk:0,def:0,hp:0,heal:0,drop:0,extraLoot:0, firstHitCrit:false, reviveOnce:false, fullHealAfterBattle:false,
    // v0.8 規則型旗標
    splash:false, startShield:0, regen:0, killCrit:false, healToShield:false, lastStand:false, firstDeathHeal:0, firstStrikeAoe:false, soloBoost:false, lifesteal:0, firstHitBlock:false};
  (GUILD.relics||[]).forEach(id=>{ const r=RELIC_BY_ID[id]; if(!r) return; const ef=r.effect||{};
    for(const k in ef){ if(typeof ef[k]==='boolean'){ e[k]=e[k]||ef[k]; } else { e[k]=(e[k]||0)+ef[k]; } } });
  return e;
}
// 遺物效果摘要（數值＋規則名稱），給大廳/整備顯示
function relicCollected(id){ return (GUILD.relics||[]).includes(id); }
function relicTotalCount(){ return RELIC_CATALOG.length; }
// 本趟目的地尚未收集的遺物（排除已入庫＋本趟貨車已撿到的，避免重複）
function uncollectedRelicsForDest(di){
  const banked=new Set(GUILD.relics||[]);
  const inCargo=new Set(((RUN&&RUN.cargo)||[]).filter(it=>it.kind==='遺物').map(it=>it.relicId));
  return (RELICS_BY_DEST[di]||[]).filter(r=>!banked.has(r.id)&&!inCargo.has(r.id));
}
function makeRelicItem(r){ return {kind:'遺物', relicId:r.id, name:r.name, icon:r.icon, desc:r.desc, value:CFG.loot.relicValueBase+(r.dest+1)*CFG.loot.relicValuePerTier}; }
function rollRelicForDest(di){ const pool=uncollectedRelicsForDest(di); if(!pool.length) return null; return makeRelicItem(Phaser.Utils.Array.GetRandom(pool)); }

// ---- 聲望與贊助：聲望 = 神殿遺物數，分級發放開局物資 ----
// v0.9 雙軌經濟：⭐聲望＝可花費的公會升級貨幣（reputation 餘額）；repEarned＝歷史累計（門檻判定，不被花掉）
function reputation(){ return GUILD.reputation||0; }
function repEarned(){ return GUILD.repEarned||0; }
function addRep(n){ n=n||0; GUILD.reputation=(GUILD.reputation||0)+n; GUILD.repEarned=(GUILD.repEarned||0)+n; }
function spendRep(n){ n=n||0; if((GUILD.reputation||0)<n) return false; GUILD.reputation-=n; return true; }
function canSpendRep(n){ return (GUILD.reputation||0)>=(n||0); }
function reputationTier(){ const r=repEarned(), th=CFG.reputation.thresholds; return r>=th[0]?3:(r>=th[1]?2:(r>=th[2]?1:0)); }
function addGold(n){ if(typeof RUN!=='undefined'&&RUN) RUN.gold=(RUN.gold||0)+(n||0); }
function spendGold(n){ if(typeof RUN==='undefined'||!RUN||(RUN.gold||0)<(n||0)) return false; RUN.gold-=(n||0); return true; }
function partySizeCap(){ return GUILD.partySize||1; }
function partySlotCost(){ const arr=CFG.repCost.partySlot||[]; const cur=GUILD.partySize||1; return arr[cur-1]; }
function canUnlockPartySlot(){ const cur=GUILD.partySize||1; if(cur>=5) return false; const c=partySlotCost(); return c!=null && canSpendRep(c); }
function unlockPartySlot(){ if(!canUnlockPartySlot()) return false; spendRep(partySlotCost()); GUILD.partySize=(GUILD.partySize||1)+1; saveGuild(); return true; }
// ---- 隊形解鎖（除基礎三角 cost0 外，其餘用聲望買斷）----
function formationCost(i){ const f=FORMATIONS[i]; return (f&&f.cost)||0; }
function formationUnlocked(i){ if(formationCost(i)<=0) return true; return !!(GUILD.formationsUnlocked&&GUILD.formationsUnlocked[i]); }
function canUnlockFormation(i){ return !formationUnlocked(i) && canSpendRep(formationCost(i)); }
function unlockFormation(i){ if(!canUnlockFormation(i)) return false; spendRep(formationCost(i)); if(!GUILD.formationsUnlocked) GUILD.formationsUnlocked={}; GUILD.formationsUnlocked[i]=true; saveGuild(); return true; }
// ---- 馬匹解鎖（普通馬／均衡馬 cost0 免費，耐力/力量用聲望買斷）----
function horseCost(i){ const h=HORSES[i]; return (h&&h.cost)||0; }
function horseUnlocked(i){ if(horseCost(i)<=0) return true; return !!(GUILD.horsesUnlocked&&GUILD.horsesUnlocked[i]); }
function canUnlockHorse(i){ return !horseUnlocked(i) && canSpendRep(horseCost(i)); }
function unlockHorse(i){ if(!canUnlockHorse(i)) return false; spendRep(horseCost(i)); if(!GUILD.horsesUnlocked) GUILD.horsesUnlocked={}; GUILD.horsesUnlocked[i]=true; saveGuild(); return true; }

// 某羈絆觸發（healInvuln/stunMark/killCdCut）是否生效：兩名成員都在出戰名單
function bondTriggerActive(trigger){ const act=new Set(activeRoster().map(i=>CLASS_ORDER[i]));
  return BONDS.some(b=>b.trigger===trigger && b.members.every(m=>act.has(m))); }

// ---- v0.8 馬匹專屬功能 ----
// ---- v0.8 工匠功能解鎖（項目化強化中 effect.feature 型）----
function hasUpgradeFeature(f){ return UPGRADES.some(u=>u.effect&&u.effect.feature===f&&upgradeOwned(u.id)); }
function hasCampstove(){ return hasUpgradeFeature('campstove'); }
function hasDeck2(){ return hasUpgradeFeature('deck2'); }
// ---- v0.8 升級 perk（依等級自動獲得功能，取代純堆血）----
const PERKS = { 3:{id:'swift',label:'疾行：出手速度 +12%'}, 5:{id:'startShield',label:'護身：每場開場護盾 +12'}, 7:{id:'extraUse',label:'熟練：技能每場多 1 次使用'} };
function perkAtLevel(lv){ return PERKS[lv]||null; }
function heroPerks(i){ const lv=(ROSTER[i]&&ROSTER[i].level)||1; const out={intervalMul:1, startShield:0, useBonus:0};
  Object.keys(PERKS).forEach(k=>{ if(lv>=+k){ const p=PERKS[k]; if(p.id==='swift')out.intervalMul*=0.88; if(p.id==='startShield')out.startShield+=12; if(p.id==='extraUse')out.useBonus+=1; } });
  return out; }

// ---- 隊形：站位（座標＋row）與站位加減成（取代固定羈絆）----
function currentFormation(){ return FORMATIONS[GUILD.formation||0] || FORMATIONS[0]; }
// 站位按「目前出戰人數」動態排列：每個職業的 row（前/中/後）決定 X，同排成員依人數平均分配 Y。
// 這樣 1~5 人都能排得好看，並修掉舊版「多人共用一套站位、多餘 slot 被忽略」的問題。
function formationLayout(){
  const f=currentFormation();
  const present=activeRoster().map(i=>HERO_BASE[i].sprite).filter(sp=>f.slots&&f.slots[sp]);
  const rowX={front:335, mid:250, back:165};
  const byRow={front:[],mid:[],back:[]};
  present.forEach(sp=>{ const r=(f.slots[sp].row)||'back'; (byRow[r]=byRow[r]||[]).push(sp); });
  const out={};
  ['front','mid','back'].forEach(row=>{ const arr=byRow[row]||[]; const n=arr.length;
    arr.forEach((sp,k)=>{ const y = n<=1?360 : Math.round(248 + k*(224/(n-1)));
      out[sp]={x:rowX[row]||200, y, row}; }); });
  return out;
}
function formationSlot(sprite){ const f=currentFormation(); const base=(f.slots&&f.slots[sprite])||{row:'back'};
  const pos=formationLayout()[sprite];
  return Object.assign({x:200,y:360,row:base.row||'back'}, base, pos||{}); }
function formationMod(sprite){ const s=(currentFormation().slots||{})[sprite]||{}; return {atk:s.atk||0, def:s.def||0, hp:s.hp||0, heal:s.heal||0}; }


// ---- 後勤：工匠（階級0-3）與領隊 ----
function craftsmanTier(){ return GUILD.staff.craftsman||0; }
function craftsmanNextDef(){ const t=craftsmanTier(); return CFG.staff.craftsman[t]; }   // t=0→學徒…
function canUpgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; const c=(CFG.repCost.craftsman||[])[craftsmanTier()]; return c!=null && canSpendRep(c); }
function upgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; const c=(CFG.repCost.craftsman||[])[craftsmanTier()]; if(c==null||!spendRep(c)) return false; GUILD.staff.craftsman=craftsmanTier()+1; saveGuild(); return true; }
function hasLeader(){ return (GUILD.staff.leader||0)>0; }
function canHireLeader(){ if(hasLeader()) return false; return canSpendRep(CFG.repCost.leader); }
function hireLeader(){ if(hasLeader()) return false; if(!spendRep(CFG.repCost.leader)) return false; GUILD.staff.leader=1; saveGuild(); return true; }

function xpNeed(lv){ return CFG.xp.base + lv*CFG.xp.perLevel; }
function gainXP(amount){
  const ups=[];
  if(RUN && !Array.isArray(RUN.pendingLevelups)) RUN.pendingLevelups=[];
  activeRoster().forEach(i=>{ const r=ROSTER[i]; r.xp+=amount;   // v1.0：等級無上限
    while(r.xp>=xpNeed(r.level)){ r.xp-=xpNeed(r.level); r.level++; ups.push(`${HERO_BASE[i].name} → Lv${r.level}`);
      if(RUN) RUN.pendingLevelups.push(i);   // 每升一級＝一次升級三選一（戰後結算抉擇）
      const pk=perkAtLevel(r.level); if(pk) ups.push(`✨ ${HERO_BASE[i].name} ${pk.label}`); }
  });
  return ups;
}
// ---- v0.9 升級三選一：技能取得/強化，每人最多 2 個技能槽 ----
function skillWithPlus(base, plus){ if(!plus) return base; const s=Object.assign({}, base);
  if(s.cd!==undefined){ s.uses=(s.uses||1)+plus; s.cd=Math.max(800, Math.round(s.cd*Math.pow(0.85,plus))); }
  if(s.mult!==undefined) s.mult=+(s.mult+0.2*plus).toFixed(2);
  if(s.frac!==undefined) s.frac=+(s.frac+0.1*plus).toFixed(2);
  if(s.amt!==undefined) s.amt=s.amt+4*plus;
  if(s.dur!==undefined) s.dur=s.dur+200*plus;
  s.plus=plus; return s; }
function equippedSkills(idx){ return Array.isArray(ROSTER[idx]&&ROSTER[idx].skills)?ROSTER[idx].skills:[]; }
// 回傳本次升級的 3 個選項：2 個新技能 ＋ 1 個強化已裝（無已裝則補第 3 個新技能）
function rollLevelChoices(idx){
  const sprite=HERO_BASE[idx].sprite, pool=(SKILLS[sprite]||[]);
  const eq=equippedSkills(idx);
  const avail=pool.filter(s=>!eq.includes(s.name)).slice();
  for(let i=avail.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=avail[i]; avail[i]=avail[j]; avail[j]=t; }
  const choices=[];
  avail.slice(0,2).forEach(s=>choices.push({type:'newSkill', name:s.name, label:'習得：'+s.name, desc:s.desc||''}));
  if(eq.length){ const up=eq[Math.floor(Math.random()*eq.length)]; choices.push({type:'upgrade', name:up, label:'強化：'+up, desc:'多 1 次使用 / 縮短冷卻 / 加強效果'}); }
  else if(avail[2]){ const s=avail[2]; choices.push({type:'newSkill', name:s.name, label:'習得：'+s.name, desc:s.desc||''}); }
  return choices;
}
// 套用一個升級選項；newSkill 滿 2 格時用 replaceName 指定替換（預設替換第 1 個）
function applyLevelChoice(idx, choice, replaceName){
  if(!choice||!ROSTER[idx]) return false;
  if(!Array.isArray(ROSTER[idx].skills)) ROSTER[idx].skills=[];
  if(!ROSTER[idx].skillPlus) ROSTER[idx].skillPlus={};
  if(choice.type==='upgrade'){ ROSTER[idx].skillPlus[choice.name]=(ROSTER[idx].skillPlus[choice.name]||0)+1; return true; }
  if(choice.type==='newSkill'){ const sk=ROSTER[idx].skills;
    if(sk.includes(choice.name)) return false;
    if(sk.length<2){ sk.push(choice.name); return true; }
    let ri = replaceName? sk.indexOf(replaceName) : 0; if(ri<0) ri=0; sk[ri]=choice.name; return true; }
  return false;
}
// ---- v1.0 遠征：單一戰鬥畫面，依「探險 %」推進的線性遭遇序列 ----
// Stage 2：戰鬥／精英／寶箱／營火／商人／事件，尾端接遺物守衛者（王）。
function initExpedition(){
  const t=(RUN&&RUN.destTier)||1;
  const plan=[]; const add=(type,n)=>{ for(let i=0;i<n;i++) plan.push(type); };
  add('battle', 4+t); add('elite', Math.max(0,t-1));
  add('chest', 1+Math.floor(t/2)); add('event', 1+Math.floor(t/2));
  add('camp', 1+(t>=3?1:0)); add('shop', 1);
  for(let i=plan.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const tmp=plan[i]; plan[i]=plan[j]; plan[j]=tmp; }
  if(plan[0]!=='battle'){ const bi=plan.indexOf('battle'); if(bi>0){ const tmp=plan[0]; plan[0]=plan[bi]; plan[bi]=tmp; } }  // 開場保證戰鬥
  RUN.exped={ pct:0, plan, i:0 };
}
function initRun(){
  RUN = {
    wagon: null,
    heroes: activeRoster().map(idx=>{ const h=HERO_BASE[idx];
      // 免洗隊伍：每趟重置為 Lv1、職業起始裝、技能清空（技能改由地城升級取得，P2）
      ROSTER[idx].level=1; ROSTER[idx].xp=0; ROSTER[idx].skills=[]; ROSTER[idx].skillPlus={};
      const weapon = startKitWeapon(idx);
      const armor  = startKitArmor(idx);
      ROSTER[idx].weapon=weapon.name; ROSTER[idx].armor=armor.name;
      return {...h, idx, weapon, armor, hp:0};
    }),
    cargo: [], slots: 0, gold: (CFG.gold? CFG.gold.stipendBase + (Math.max(1,(GUILD.partySize||1))-1)*CFG.gold.stipendPerParty : 0),
    isBoss:false,
    // v0.8 本趟一次性旗標（料理／馬匹／工匠功能）
    cookShield:0, reviveCharge:0, cookFirstCrit:false, pendingLevelups:[], _lvChoices:null, _lvReplace:null,
    deckExpanded:false,
  };
}
// 起始裝：免洗隊每趟出發的基礎武防（P4 將依該職業 tier 升級）
function startKitWeapon(idx){ const h=HERO_BASE[idx]; return WEAPONS[h.defWeapon]; }
function startKitArmor(idx){ const h=HERO_BASE[idx]; return ARMORS[h.defArmor]; }
function heroStat(h){
  const lv=ROSTER[h.idx].level;
  // v0.9：技能＝本趟由升級三選一取得（最多 2 個，存 ROSTER.skills 名稱）；skillPlus 為強化次數
  const equipped = Array.isArray(ROSTER[h.idx].skills)? ROSTER[h.idx].skills : [];
  const plusMap = ROSTER[h.idx].skillPlus || {};
  let sk = equipped.map(name=>{ const base=(SKILLS[h.sprite]||[]).find(s=>s.name===name); return base? skillWithPlus(base, plusMap[name]||0) : null; }).filter(Boolean);
  let pdef=0, healB=0, patk=0, phpB=0;
  const bl=relicEffects();   // 遺物即時效果（數值部分；規則部分由戰鬥讀取）
  const bo=formationMod(h.sprite); // 隊形站位加減成（取代固定羈絆）
  // 遺物・神王冠冕（寡兵越強）：每空一個出戰席位，全隊 ATK/DEF +3、HP +20
  let soloA=0,soloD=0,soloH=0;
  if(bl.soloBoost){ const empty=Math.max(0, CLASS_ORDER.length - activeRoster().length); soloA=3*empty; soloD=3*empty; soloH=20*empty; }
  const baseHp=HERO_BASE[h.idx].hp;   // 基礎血量取自職業設定（h.hp 是「當前血量」會變動，不能拿來算上限）
  // 攻防來源：武器/防具 ＋ 被動技能 ＋ 遺物 ＋ 寡兵；角色本身無基礎攻防，純等級只給 HP
  return {
    level:  lv,
    maxHp:  baseHp + h.growthHp*(lv-1) + h.armor.hp + bl.hp + bo.hp + phpB + soloH,
    atkSeq: h.weapon.atkSeq.map(a=>a+bl.atk+bo.atk+patk+soloA+(h.growthAtk||0)*(lv-1)),
    def:    h.armor.def + pdef + bl.def + bo.def + soloD,
    heal:   (h.weapon.heal? h.weapon.heal + healB + bo.heal + bl.heal : 0),
    skills: sk,
    weaponTrait: h.weapon.trait||null, armorTrait: h.armor.trait||null,   // v0.8 裝備特性（戰鬥讀取）
  };
}


// ---- v0.9 物品圖鑑：每件物品的圖示與色彩、發現追蹤 ----
const ITEM_ICON = {
  // 武器
  '鐵劍':['sword','teal'], '雙手斧':['axe','teal'], '獵弓':['bow','teal'], '短弓':['bow','teal'],
  '橡木杖':['staff','green'], '聖光杖':['staff','gold'], '火花杖':['magestaff','violet'], '短刃':['dagger','teal'],
  '匕首':['dagger','blue'], '雙刃劍':['dualblade','gold'], '巨劍':['greatsword','gold'], '戰弓':['bow','gold'],
  '神息法杖':['staff','green'], '烈焰法杖':['magestaff','red'],
  // 防具
  '布衣':['robe','slate'], '皮甲':['armor','teal'], '鎖子甲':['armor','blue'], '法袍':['robe','violet'],
  '精鋼板甲':['armor','gold'], '守護重盔':['helmet','gold'], '法師長袍':['robe','violet'], '龍鱗甲':['armor','red'],
  // 道具
  '治療藥水':['potion','red'], '解毒劑':['potion','green'], '聖水':['potion','blue'], '回復卷軸':['scroll','gold'], '復活之種':['seed','violet'],
  // 貴重物品
  '碎銀錢袋':['coin','slate'], '古青銅幣':['coin','teal'], '寶石原石':['gem','blue'], '黃金聖盃':['coin','gold'], '失落王冠':['gem','gold'],
};
// ---- 技能圖示：依機制給專屬 icon、依類型上色 ----
const SKILL_ICON = {
  '敲暈':'stun','震懾箭':'stun','割喉':'stun',
  '強擊':'smash','弱點射擊':'target','鷹眼':'eye','炎爆':'fireball','偷襲':'dagger','致命':'skull',
  '連射':'arrows','連刺':'dagger','連環施法':'sparkle',
  '群體治療':'heal','聖療':'heal','聖盾':'shield','神恩':'sparkle',
  '堅守':'reflect','鐵骨':'fortify','護體罩':'ward','奧術精通':'sparkle',
};
function skillVisual(s){ const name=(typeof s==='string')?s:(s&&s.name), type=(s&&s.type)||'';
  const icon = SKILL_ICON[name] || ({stun:'stun',crit:'smash',doubleHit:'arrows',groupHeal:'heal'}[type]) || 'sparkle';
  let acc='violet';
  if(type==='stun') acc='gold';
  else if(type==='crit'||type==='critVsFull'||type==='critVsStunned') acc='red';
  else if(type==='doubleHit') acc='blue';
  else if(type==='groupHeal'||type==='critHealLow'||type==='shieldOnHeal'||type==='cleanseOnHeal') acc='green';
  else if(type==='reflect'||type==='lowHpDef'||type==='deathSave') acc='blue';
  return {icon, accent:acc};
}
function itemVisual(name){ const v=ITEM_ICON[name]; return v? {icon:v[0], accent:v[1]} : {icon:'box', accent:'slate'}; }
const CONSUM_INFO = {
  '治療藥水':'回復全隊 30% HP', '解毒劑':'回復全隊 20% HP', '聖水':'回復全隊 50% HP',
  '回復卷軸':'回復全隊 60% HP', '復活之種':'復活陣亡成員（50% HP）',
};
// ---- 圖鑑：發現追蹤 ----
function discover(name){ if(!name) return; if(!GUILD.discovered) GUILD.discovered={}; if(!GUILD.discovered[name]){ GUILD.discovered[name]=true; saveGuild(); } }
// ---- 武器/防具唯一擁有：起手裝備永遠擁有；掉落取得後永久可裝；重複只能賣出 ----
function gearOwned(name){ const w=WEAPONS.find(x=>x.name===name); if(w&&w.starter) return true; const a=ARMORS.find(x=>x.name===name); if(a&&a.starter) return true; return !!(GUILD.owned&&GUILD.owned[name]); }
function ownGear(name){ if(!GUILD.owned) GUILD.owned={}; GUILD.owned[name]=true; discover(name); saveGuild(); }
function itemDiscovered(name){ if(GUILD.discovered && GUILD.discovered[name]) return true;
  const w=WEAPONS.find(x=>x.name===name); if(w&&w.starter) return true; const a=ARMORS.find(x=>x.name===name); if(a&&a.starter) return true; return false; }
// 把目前持有／裝備中／貨車內的物品補登為已發現（回溯既有存檔）
function syncDiscovered(){ if(!GUILD.discovered) GUILD.discovered={}; if(!GUILD.owned) GUILD.owned={};
  const own=(n)=>{ if(!n) return; GUILD.owned[n]=true; GUILD.discovered[n]=true; };
  (ROSTER||[]).forEach(r=>{ own(r&&r.weapon); own(r&&r.armor); });
  if(typeof RUN!=='undefined' && RUN){ (RUN.cargo||[]).forEach(it=>{ if(it&&it.name) GUILD.discovered[it.name]=true; });
    (RUN.heroes||[]).forEach(h=>{ if(h.weapon) own(h.weapon.name); if(h.armor) own(h.armor.name); }); }
  saveGuild();
}
