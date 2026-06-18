// ========================= 公會大廳（v0.9 重塑）=========================
class GuildHall extends Phaser.Scene {
  constructor(){ super('GuildHall'); }
  create(){
    sceneBg(this,{glow:0xb98bff, glowX:this.scale.width/2});
    sceneHeader(this,'公會大廳','',{accent:'gold'});
    this.render();
  }
  effectChips(){
    const e=relicEffects(), out=[];
    const add=(label,acc)=>out.push({label,accent:acc,size:11,h:23});
    if(e.atk)add('ATK +'+e.atk,'gold'); if(e.def)add('DEF +'+e.def,'blue'); if(e.hp)add('HP +'+e.hp,'green');
    if(e.heal)add('治療 +'+e.heal,'green'); if(e.drop)add('遺物率 +'+Math.round(e.drop*100)+'%','violet'); if(e.extraLoot)add('額外掉落 +'+e.extraLoot,'gold');
    if(e.firstHitCrit)add('首擊必暴','gold'); if(e.reviveOnce)add('復活一次','green'); if(e.noFoodDrain)add('不耗食物','ember');
    if(e.fullHealAfterBattle)add('戰後全回','green'); if(e.splash)add('濺射','ember'); if(e.startShield)add('開場護盾 '+e.startShield,'blue');
    if(e.regen)add('行動回復 '+Math.round(e.regen*100)+'%','green'); if(e.killCrit)add('擊殺爆擊','gold'); if(e.healToShield)add('治療轉盾','blue');
    if(e.lastStand)add('背水','red'); if(e.firstDeathHeal)add('陣亡回援 '+Math.round(e.firstDeathHeal*100)+'%','green'); if(e.firstStrikeAoe)add('首擊全體','violet');
    if(e.soloBoost)add('寡兵越強','violet'); if(e.lifesteal)add('吸血 '+Math.round(e.lifesteal*100)+'%','red');
    return out;
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    this._ui=[]; const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const sp=sponsorship();

    add(button(this, 68, 20, 112, 26, '重置存檔', ()=>{ resetSave(); initRun(); this.render(); }, {size:11, fill:UI.lineSoftN, stroke:0x6b4a4a, color:UI.dim, icon:'refresh', iconSize:12, radius:8}));
    add(button(this, W-76, 20, 128, 26, '作弊：+資源', ()=>{
      GUILD.funds+=500; const left=RELIC_CATALOG.filter(r=>!GUILD.relics.includes(r.id));
      if(left.length) GUILD.relics.push(Phaser.Utils.Array.GetRandom(left).id);
      const w=Phaser.Utils.Array.GetRandom(WEAPONS); GUILD.stash.push({kind:'武器',name:w.name,icon:'⚔',value:50,gear:w});
      saveGuild(); this.render();
    }, {size:11, fill:UI.lineSoftN, stroke:0x6b4a6b, color:UI.dim, icon:'bug', iconSize:12, radius:8}));

    // ---- 單列資源（含隊形 / 隊伍提示）----
    const specs=[
      {label:'＄ '+GUILD.funds, accent:'gold', icon:'coin', size:12, h:26},
      {label:'遺物 '+GUILD.relics.length+'/'+relicTotalCount(), accent:'violet', icon:'relic', size:12, h:26},
      {label:'倉庫 '+GUILD.stash.length, accent:'teal', icon:'bag', size:12, h:26},
      {label:'聲望 '+reputation()+' · T'+reputationTier(), accent:'gold', icon:'star', size:12, h:26},
    ];
    if(activeRoster().length<3) specs.push({label:'缺人！招募所湊滿 3 人', accent:'ember', icon:'recruit', size:12, h:26, filled:true, textColor:UI.white});
    else specs.push({label:'隊形 · '+currentFormation().name, accent:'violet', icon:'formation', size:12, h:26});
    const chips=specs.map(s=>chip(this,0,0,s)); const gap=10; let tot=chips.reduce((a,c)=>a+c.w,0)+gap*(chips.length-1);
    let cx=W/2-tot/2; chips.forEach(c=>{ c.setX(cx); c.setY(62); add(c); cx+=c.w+gap; });

    // ====== 面板 ======
    const pTop=92, pH=256, pcy=pTop+pH/2;     // 92..348, center 220
    const pL=add(panel(this, 232, pcy, 416, pH, {accent:'violet', title:'遺物收藏', icon:'relic', titleSize:16}));
    add(txt(this, pL.left+20, pL.bodyTop+4, '已收集 '+GUILD.relics.length+' / '+relicTotalCount()+' 件　即時生效', 12, UI.text, 0));
    add(txt(this, pL.left+20, pL.bodyTop+30, '生效效果', 11, UI.dim, 0));
    const fx=this.effectChips();
    if(fx.length){ const used=[]; chipRow(this, pL.left+20, pL.bodyTop+54, fx, {maxWidth:372, gap:9, lineH:28, parent:used}); used.forEach(add); }
    else add(txt(this, 232, pL.bodyTop+54, '（尚無遺物——去地城帶回吧）', 12, UI.faint));
    add(txt(this, 232, pcy+pH/2-16, '每關有固定遺物清單，收齊為止；已得不再掉落', 10.5, UI.faint).setWordWrapWidth(384));

    const ws=wagonStats();
    const pR=add(panel(this, 668, pcy, 416, pH, {accent:'ember', title:'商隊 ・ 補給', icon:'wagon', titleSize:16}));
    const rx=pR.left+20;
    add(chip(this, rx, pR.bodyTop+8, {label:'馬匹 · '+ws.horse, accent:'ember', icon:'wagon', size:12, h:24}));
    add(chip(this, rx+154, pR.bodyTop+8, {label:'工匠 '+['未聘僱','學徒','師傅','大師'][craftsmanTier()], accent:'gold', icon:'gear', size:12, h:24}));
    add(chip(this, rx, pR.bodyTop+42, {label:'本趟食物 '+ws.food, accent:'green', icon:'flame', size:12, h:24}));
    add(chip(this, rx+154, pR.bodyTop+42, {label:'貨格 '+ws.slots, accent:'teal', icon:'box', size:12, h:24}));
    add(divider(this, 668, pR.bodyTop+74, 376, UI.lineN, 0.5));
    add(txt(this, rx, pR.bodyTop+94, '聲望贊助　Tier '+reputationTier(), 12, UI.gold, 0));
    add(txt(this, rx, pR.bodyTop+116, '出發時　食物 +'+sp.food+'　資金 +'+sp.funds, 11, UI.dim, 0));
    add(button(this, 668, pcy+pH/2-30, 372, 38, '管理商隊（選馬 ・ 強化）', ()=>this.scene.start('WagonHall'), {variant:'ember', size:14, icon:'wagon'}));

    // ====== 導覽卡 ======
    const cw=278, ch=58, gx=16+cw/2, midx=W/2, ex=W-16-cw/2, row1=396, row2=460;
    const cards=[
      {x:gx, y:row1, accent:'teal', icon:'person', title:'角色所', desc:'查看技能、調整武器與防具', s:'CharacterHall'},
      {x:midx, y:row1, accent:'teal', icon:'recruit', title:'招募所', desc:'招募新成員、占位者升階', s:'RecruitHall'},
      {x:ex, y:row1, accent:'violet', icon:'formation', title:'隊形', desc:'選擇站位與前後排加成', s:'FormationHall'},
      {x:gx, y:row2, accent:'teal', icon:'dumbbell', title:'訓練所', desc:'花資金換取全隊經驗', s:'TrainingHall'},
      {x:midx, y:row2, accent:'gold', icon:'bag', title:'倉庫', desc:'查看持有的物品與裝備', s:'WarehouseHall'},
      {x:ex, y:row2, accent:'gold', icon:'scales', title:'商會', desc:'賣出倉庫物品換取資金', s:'MerchantHall'},
    ];
    cards.forEach(c=> add(navCard(this, c.x, c.y, cw, ch, {accent:c.accent, icon:c.icon, title:c.title, desc:c.desc, onClick:()=>this.scene.start(c.s)})));

    add(button(this, W/2, 524, 330, 46, '前往整備出發', ()=>this.scene.start('Outfit'), {variant:'go', size:18, icon:'play', iconSize:18}));
  }
  flash(msg){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,498,msg,14,UI.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:800,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
