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
  funds:0, stash:[], relics:[],
  facilities:{ temple:1, outfit:1 },
  wagon:0, wagonUp:[0,0,0], formation:0,
  horse:1,                       // 馬匹：0力量/1均衡/2耐力（預設均衡）
  materials:{}, ingredients:{},  // 新資源：素材（強化）、食材（料理）
  staff:{ craftsman:0, leader:0 },// 後勤：工匠階級0-3、領隊0/1
  upgrades:{},                   // 項目化強化已解鎖項目 {id:true}
  discovered:{},                 // 收藏圖鑑：曾取得過的物品名稱
  owned:{},                      // 已擁有的武器/防具（唯一，不計數量）
}; }
let GUILD = defaultGuild();

// 五個職業槽：unlocked＝是否已加入出戰、tier＝占位者階級（決定等級上限）、level/xp、weapon/armor、skills（隨機雙技能，Phase D）
function newRosterSlot(unlocked){ return {unlocked:!!unlocked, tier:0, level:1, xp:0, weapon:null, armor:null, skills:null}; }
function defaultRoster(){ return [ newRosterSlot(true), newRosterSlot(false), newRosterSlot(false), newRosterSlot(false), newRosterSlot(false) ]; }
let ROSTER = defaultRoster();   // 開局只有戰士；其餘於招募所解鎖
function ensureRoster(){ while(ROSTER.length<CLASS_ORDER.length) ROSTER.push(newRosterSlot(false));
  ROSTER.forEach((r,i)=>{ if(r.unlocked==null)r.unlocked=false; if(r.tier==null)r.tier=0; if(r.level==null)r.level=1; if(r.xp==null)r.xp=0;
    if(r.unlocked && !Array.isArray(r.skills)) rollRecruitSkills(i); }); }
function activeRoster(){ const out=[]; ROSTER.forEach((r,i)=>{ if(r.unlocked) out.push(i); }); return out.length?out:[0]; }

let BATTLE_SPEED = 1;   // 戰鬥速度倍率（1/2/4），跨場記住

// ---- 存檔持久化（localStorage）。SAVE_KEY 升 v2：舊檔不遷移、直接以新結構重置 ----
const SAVE_KEY = 'relicCaravanSave_v3';   // v0.8 去數據化改版：結構變動，舊檔不遷移、直接重置
function saveGuild(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify({GUILD,ROSTER})); }catch(e){} }
function loadGuild(){ try{
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));
  if(s&&s.GUILD){
    GUILD=Object.assign(defaultGuild(), s.GUILD);
    if(!GUILD.facilities) GUILD.facilities={temple:1,outfit:1};
    if(!GUILD.materials) GUILD.materials={};
    if(!GUILD.ingredients) GUILD.ingredients={};
    if(!GUILD.staff) GUILD.staff={craftsman:0,leader:0};
    if(!GUILD.upgrades) GUILD.upgrades={};
    if(!GUILD.discovered) GUILD.discovered={};
    if(!GUILD.owned) GUILD.owned={};
    if(GUILD.horse==null) GUILD.horse=1;
    if(GUILD.wagon==null) GUILD.wagon=0;
    if(!Array.isArray(GUILD.wagonUp)) GUILD.wagonUp=[0,0,0];
    if(GUILD.formation==null||GUILD.formation>=FORMATIONS.length) GUILD.formation=0;
    if(Array.isArray(s.ROSTER)&&s.ROSTER.length>=1){ ROSTER=s.ROSTER; ensureRoster(); }
  }
}catch(e){} }
function resetSave(){ try{ localStorage.removeItem(SAVE_KEY); localStorage.removeItem('relicCaravanSave_v2'); localStorage.removeItem('relicCaravanSave_v1'); }catch(e){}
  GUILD=defaultGuild(); ROSTER=defaultRoster(); ensureRoster(); }
loadGuild(); ensureRoster();

// ---- 素材 / 食材 資源存取（名稱→數量）----
function addMaterial(name,n){ GUILD.materials[name]=(GUILD.materials[name]||0)+(n||1); }
function addIngredient(name,n){ GUILD.ingredients[name]=(GUILD.ingredients[name]||0)+(n||1); }
function matCount(name){ return GUILD.materials[name]||0; }
function ingCount(name){ return GUILD.ingredients[name]||0; }

// ---- 設施：神殿（遺物槽＋祝福）、整備所（補給/貨格上限）----
function templeSlots(){ return 1 + GUILD.facilities.temple; }     // Lv1 = 2 槽
// ---- 馬匹（單馬車＋選馬）＋ 工匠項目化強化：最終食物/貨格 ----
function upgradeEffectTotal(){ let food=0,slots=0; UPGRADES.forEach(u=>{ if(GUILD.upgrades&&GUILD.upgrades[u.id]){ food+=u.effect.food||0; slots+=u.effect.slots||0; } }); return {food,slots}; }
function wagonStats(){ const h=HORSES[GUILD.horse]||HORSES[1]; const up=upgradeEffectTotal();
  return { name:'探險馬車', horse:h.name, horseDesc:h.desc, food:h.food+up.food, slots:h.slots+up.slots, upFood:up.food, upSlots:up.slots }; }
function upgradeOwned(id){ return !!(GUILD.upgrades&&GUILD.upgrades[id]); }
function canBuyUpgrade(u){ if(upgradeOwned(u.id)) return false; if(craftsmanTier()<u.craftReq) return false; if(GUILD.funds<u.cost.funds) return false;
  const m=u.cost.mats||{}; for(const k in m){ if(matCount(k)<m[k]) return false; } return true; }
function buyUpgrade(u){ if(!canBuyUpgrade(u)) return false; GUILD.funds-=u.cost.funds; const m=u.cost.mats||{}; for(const k in m){ GUILD.materials[k]=(GUILD.materials[k]||0)-m[k]; } GUILD.upgrades[u.id]=true; saveGuild(); return true; }
function upgradeCostText(u){ const parts=['＄'+u.cost.funds]; const m=u.cost.mats||{}; for(const k in m){ const md=MATERIAL_BY_ID[k]; parts.push(`${md?md.icon:''}${md?md.name:k}×${m[k]}`); } return parts.join(' '); }
// 素材／食材 掉落物件（探險中入貨車，結算自動入庫；全滅則失）
function makeMaterialItem(di){ const m=MATERIAL_BY_DEST[di]; if(!m) return null; return {kind:'素材', matId:m.id, name:m.name, icon:m.icon, value:20}; }
function makeIngredientItem(di){ const g=INGREDIENT_BY_DEST[di]; if(!g) return null; return {kind:'食材', ingId:g.id, name:g.name, icon:g.icon, value:12}; }

// ---- 領隊・料理：消耗食材（公會庫存）產生補血／本趟增益 ----
function recipeNeedText(r){ return Object.keys(r.need).map(k=>{ const g=INGREDIENT_BY_ID[k]; return `${g?g.icon:''}${g?g.name:k}×${r.need[k]}`; }).join(' '); }
// 可料理：有領隊，或工匠強化「隨車鍋」(campstove) 解鎖後也能煮
function canCook(r){ if(!hasLeader() && !hasCampstove()) return false; for(const k in r.need){ if(ingCount(k)<r.need[k]) return false; } return true; }
function cook(r){ if(!canCook(r)) return null; for(const k in r.need){ GUILD.ingredients[k]-=r.need[k]; } saveGuild();
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
  const e={atk:0,def:0,hp:0,heal:0,drop:0,food:0,extraLoot:0, firstHitCrit:false, reviveOnce:false, noFoodDrain:false, fullHealAfterBattle:false,
    // v0.8 規則型旗標
    splash:false, startShield:0, regen:0, killCrit:false, healToShield:false, lastStand:false, firstDeathHeal:0, firstStrikeAoe:false, soloBoost:false, lifesteal:0};
  (GUILD.relics||[]).forEach(id=>{ const r=RELIC_BY_ID[id]; if(!r) return; const ef=r.effect||{};
    for(const k in ef){ if(typeof ef[k]==='boolean'){ e[k]=e[k]||ef[k]; } else { e[k]=(e[k]||0)+ef[k]; } } });
  return e;
}
// 遺物效果摘要（數值＋規則名稱），給大廳/整備顯示
function relicSummary(e){
  e=e||relicEffects(); const p=[];
  if(e.atk)p.push('ATK+'+e.atk); if(e.def)p.push('DEF+'+e.def); if(e.hp)p.push('HP+'+e.hp);
  if(e.heal)p.push('治療+'+e.heal); if(e.drop)p.push('遺物率+'+Math.round(e.drop*100)+'%'); if(e.extraLoot)p.push('額外掉落+'+e.extraLoot);
  if(e.firstHitCrit)p.push('首擊必暴'); if(e.reviveOnce)p.push('復活一次'); if(e.noFoodDrain)p.push('不耗食物'); if(e.fullHealAfterBattle)p.push('戰後全回');
  if(e.splash)p.push('濺射'); if(e.startShield)p.push('開場護盾'+e.startShield); if(e.regen)p.push('行動回復'+Math.round(e.regen*100)+'%');
  if(e.killCrit)p.push('擊殺爆擊'); if(e.healToShield)p.push('治療轉盾'); if(e.lastStand)p.push('背水');
  if(e.firstDeathHeal)p.push('陣亡回援'+Math.round(e.firstDeathHeal*100)+'%'); if(e.firstStrikeAoe)p.push('首擊全體');
  if(e.soloBoost)p.push('寡兵越強'); if(e.lifesteal)p.push('吸血'+Math.round(e.lifesteal*100)+'%');
  return p.length?p.join('　'):'（尚無）';
}
// 相容別名：舊呼叫點仍可用（內容已改為遺物即時效果）
function guildBlessing(){ return relicEffects(); }
function blessingSummary(e){ return relicSummary(e); }
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
function reputation(){ return GUILD.relics.length; }
function reputationTier(){ const r=reputation(), th=CFG.reputation.thresholds; return r>=th[0]?3:(r>=th[1]?2:(r>=th[2]?1:0)); }
function sponsorship(){ return CFG.reputation.sponsorship[reputationTier()]; }

// ---- 隊員羈絆：成員皆在隊時生效（固定班底恆成立），回傳該 sprite 的加成 ----
// 隊員羈絆（v0.8）：改為戰鬥行為觸發，bondBonus 已停用（保留空殼避免舊呼叫出錯）。
function bondBonus(sprite){ return {atk:0,def:0,hp:0,heal:0}; }
function activeBonds(){ const act=new Set(activeRoster().map(i=>CLASS_ORDER[i])); return BONDS.filter(b=>b.members.every(m=>act.has(m))); }
// 某羈絆觸發（healInvuln/stunMark/killCdCut）是否生效：兩名成員都在出戰名單
function bondTriggerActive(trigger){ const act=new Set(activeRoster().map(i=>CLASS_ORDER[i]));
  return BONDS.some(b=>b.trigger===trigger && b.members.every(m=>act.has(m))); }

// ---- v0.8 馬匹專屬功能 ----
function horseFeature(){ const h=HORSES[GUILD.horse]; return h?h.feature:null; }
// ---- v0.8 工匠功能解鎖（項目化強化中 effect.feature 型）----
function hasUpgradeFeature(f){ return UPGRADES.some(u=>u.effect&&u.effect.feature===f&&upgradeOwned(u.id)); }
function hasCampstove(){ return hasUpgradeFeature('campstove'); }
function hasAutotrap(){ return hasUpgradeFeature('autotrap'); }
function hasDeck2(){ return hasUpgradeFeature('deck2'); }
function hasLedger(){ return hasUpgradeFeature('ledger'); }
// ---- v0.8 占位者升階功能位（累計）----
function tierPerk(i){ const t=(ROSTER[i]&&ROSTER[i].tier)||0; const arr=(CFG.recruit.tierPerks)||[]; return arr[Math.min(t,arr.length-1)]||{}; }
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

// ---- 戰鬥成員：職業槽招募／升階／等級上限 ----
function classDef(i){ return CFG.recruit.classes[CLASS_ORDER[i]]; }   // warrior 無此設定(=null)
function classCap(i){ const caps=CFG.recruit.tierCaps; return caps[Math.min(ROSTER[i].tier||0, caps.length-1)]; }
function canRecruitClass(i){ const d=classDef(i); if(!d||ROSTER[i].unlocked) return false; return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function recruitClass(i){ const d=classDef(i); if(!d||ROSTER[i].unlocked) return false;
  if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; ROSTER[i].unlocked=true; ROSTER[i].tier=0; ROSTER[i].level=1; ROSTER[i].xp=0;
  rollRecruitSkills(i); saveGuild(); return true; }
function tierUpDef(i){ const t=ROSTER[i].tier||0; return CFG.recruit.tierUp[t]; }   // t=0→升tier1、t=1→升tier2
function canTierUp(i){ if(!ROSTER[i].unlocked) return false; const d=tierUpDef(i); if(!d) return false;
  return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function tierUpClass(i){ const d=tierUpDef(i); if(!d) return false; if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; ROSTER[i].tier=(ROSTER[i].tier||0)+1; saveGuild(); return true; }
// 隨機雙技能（Phase D 用；此處先建立資料：從該職業技能池抽 2 個）
function rollRecruitSkills(i){ const pool=(SKILLS[CLASS_ORDER[i]]||[]).slice();
  if(pool.length<=2){ ROSTER[i].skills=pool.map(s=>s.name); return; }
  // 保證至少一個低階(≤Lv4)技能，避免「兩個都高階→長期沒技能」的爛抽
  const low=pool.filter(s=>s.lv<=4);
  const first=(low.length?low:pool)[Math.floor(Math.random()*(low.length?low.length:pool.length))];
  const remain=pool.filter(s=>s.name!==first.name);
  const second=remain[Math.floor(Math.random()*remain.length)];
  ROSTER[i].skills=[first.name, second.name]; }

// ---- 後勤：工匠（階級0-3）與領隊 ----
function craftsmanTier(){ return GUILD.staff.craftsman||0; }
function craftsmanNextDef(){ const t=craftsmanTier(); return CFG.staff.craftsman[t]; }   // t=0→學徒…
function canUpgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function upgradeCraftsman(){ const d=craftsmanNextDef(); if(!d) return false; if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; GUILD.staff.craftsman=craftsmanTier()+1; saveGuild(); return true; }
function hasLeader(){ return (GUILD.staff.leader||0)>0; }
function canHireLeader(){ if(hasLeader()) return false; const d=CFG.staff.leader; return GUILD.funds>=d.cost && reputation()>=d.repReq; }
function hireLeader(){ if(hasLeader()) return false; const d=CFG.staff.leader; if(GUILD.funds<d.cost||reputation()<d.repReq) return false;
  GUILD.funds-=d.cost; GUILD.staff.leader=1; saveGuild(); return true; }

function xpNeed(lv){ return CFG.xp.base + lv*CFG.xp.perLevel; }
function gainXP(amount){
  const ups=[];
  activeRoster().forEach(i=>{ const r=ROSTER[i], cap=classCap(i); r.xp+=amount;
    while(r.level<cap && r.xp>=xpNeed(r.level)){ r.xp-=xpNeed(r.level); r.level++; ups.push(`${HERO_BASE[i].name} → Lv${r.level}`);
      (SKILLS[HERO_BASE[i].sprite]||[]).filter(s=>s.lv===r.level).forEach(s=>ups.push(`🎓 ${HERO_BASE[i].name} 習得「${s.name}」`));
      const pk=perkAtLevel(r.level); if(pk) ups.push(`✨ ${HERO_BASE[i].name} ${pk.label}`); }
    if(r.level>=cap){ r.xp=Math.min(r.xp, xpNeed(r.level)-1); }   // 達上限：經驗封頂、不再升
  });
  return ups;
}
function initRun(){
  RUN = {
    wagon: null,
    heroes: activeRoster().map(idx=>{ const h=HERO_BASE[idx];
      // 還原上次的配裝（跨輪保存）；找不到才用預設起手裝
      const wName=ROSTER[idx]&&ROSTER[idx].weapon, aName=ROSTER[idx]&&ROSTER[idx].armor;
      const weapon = WEAPONS.find(w=>w.name===wName) || WEAPONS[h.defWeapon];
      const armor  = ARMORS.find(a=>a.name===aName) || ARMORS[h.defArmor];
      return {...h, idx, weapon, armor, hp:0};
    }),
    cargo: [], food: 0, slots: 0,
    map: null, encounter:null, isBoss:false,
    cookBuff:{atk:0,def:0},
    // v0.8 本趟一次性旗標（料理／馬匹／工匠功能）
    cookShield:0, reviveCharge:0, cookFirstCrit:false,
    trampleUsed:false, starveImmuneUsed:false, deckExpanded:false,
  };
}
// 保存目前配裝（武器/防具名稱）到 ROSTER，跨輪不重置
function persistLoadout(){ if(!RUN) return; RUN.heroes.forEach(h=>{ if(ROSTER[h.idx]){ ROSTER[h.idx].weapon=h.weapon.name; ROSTER[h.idx].armor=h.armor.name; } }); saveGuild(); }
function heroStat(h){
  const lv=ROSTER[h.idx].level;
  const rolled=ROSTER[h.idx].skills;   // 招募預抽的雙技能（名稱陣列）；達等級才生效
  let sk=(SKILLS[h.sprite]||[]).filter(s=>lv>=s.lv);
  if(Array.isArray(rolled)) sk=sk.filter(s=>rolled.includes(s.name));
  let pdef=0, healB=0, patk=0, phpB=0;
  sk.forEach(s=>{ if(s.type==='passiveDef') pdef+=s.def; if(s.type==='healBoost') healB+=s.amt;
    if(s.type==='passiveAtk') patk+=(s.atk||0); if(s.type==='passiveHp') phpB+=(s.hp||0); });
  const bl=guildBlessing();   // 遺物即時效果（數值部分；規則部分由戰鬥讀取）
  const bo=formationMod(h.sprite); // 隊形站位加減成（取代固定羈絆）
  // 遺物・神王冠冕（寡兵越強）：每空一個出戰席位，全隊 ATK/DEF +3、HP +20
  let soloA=0,soloD=0,soloH=0;
  if(bl.soloBoost){ const empty=Math.max(0, CLASS_ORDER.length - activeRoster().length); soloA=3*empty; soloD=3*empty; soloH=20*empty; }
  const baseHp=HERO_BASE[h.idx].hp;   // 基礎血量取自職業設定（h.hp 是「當前血量」會變動，不能拿來算上限）
  // 攻防來源：武器/防具 ＋ 被動技能 ＋ 遺物 ＋ 寡兵；角色本身無基礎攻防，純等級只給 HP
  return {
    level:  lv,
    maxHp:  baseHp + h.growthHp*(lv-1) + h.armor.hp + bl.hp + bo.hp + phpB + soloH,
    atkSeq: h.weapon.atkSeq.map(a=>a+bl.atk+bo.atk+patk+soloA),
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
  (GUILD.stash||[]).forEach(it=>{ if(it&&it.name){ GUILD.discovered[it.name]=true; if(it.kind==='武器'||it.kind==='防具') GUILD.owned[it.name]=true; } });
  (ROSTER||[]).forEach(r=>{ own(r&&r.weapon); own(r&&r.armor); });
  if(typeof RUN!=='undefined' && RUN){ (RUN.cargo||[]).forEach(it=>{ if(it&&it.name) GUILD.discovered[it.name]=true; });
    (RUN.heroes||[]).forEach(h=>{ if(h.weapon) own(h.weapon.name); if(h.armor) own(h.armor.name); }); }
  saveGuild();
}