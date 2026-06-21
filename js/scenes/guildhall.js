// ========================= 公會大廳（v0.9 重塑：遺物圖鑑為主角）=========================
class GuildHall extends Phaser.Scene {
  constructor(){ super('GuildHall'); }
  create(){
    sceneBg(this,{glow:0xb98bff, glowX:this.scale.width/2});
    sceneHeader(this,'公會大廳','',{accent:'gold'});
    this.render();
  }
  effectChips(){
    const e=relicEffects(), out=[];
    const add=(label,acc)=>out.push({label,accent:acc,size:11,h:22});
    if(e.atk)add('ATK +'+e.atk,'gold'); if(e.def)add('DEF +'+e.def,'blue'); if(e.hp)add('HP +'+e.hp,'green');
    if(e.heal)add('治療 +'+e.heal,'green'); if(e.drop)add('遺物率 +'+Math.round(e.drop*100)+'%','violet'); if(e.extraLoot)add('額外掉落 +'+e.extraLoot,'gold');
    if(e.firstHitCrit)add('首擊必暴','gold'); if(e.reviveOnce)add('復活一次','green'); if(e.firstHitBlock)add('洞察格擋','blue');
    if(e.fullHealAfterBattle)add('戰後全回','green'); if(e.splash)add('濺射','ember'); if(e.startShield)add('開場護盾 '+e.startShield,'blue');
    if(e.regen)add('行動回復 '+Math.round(e.regen*100)+'%','green'); if(e.killCrit)add('擊殺爆擊','gold'); if(e.healToShield)add('治療轉盾','blue');
    if(e.lastStand)add('背水','red'); if(e.firstDeathHeal)add('陣亡回援 '+Math.round(e.firstDeathHeal*100)+'%','green'); if(e.firstStrikeAoe)add('首擊全體','violet');
    if(e.soloBoost)add('寡兵越強','violet'); if(e.lifesteal)add('吸血 '+Math.round(e.lifesteal*100)+'%','red');
    return out;
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    if(this._rdet) this._rdet.forEach(o=>o.destroy());
    this._ui=[]; this._rdet=[]; const W=this.scale.width, add=o=>{this._ui.push(o);return o;};

    add(button(this, 68, 20, 112, 26, '重置存檔', ()=>{ resetSave(); initRun(); this.render(); }, {size:11, fill:UI.lineSoftN, stroke:0x6b4a4a, color:UI.dim, icon:'refresh', iconSize:12, radius:8}));
    add(button(this, W-76, 20, 128, 26, '作弊：+資源', ()=>{
      addRep(20); const left=RELIC_CATALOG.filter(r=>!GUILD.relics.includes(r.id));
      if(left.length) GUILD.relics.push(Phaser.Utils.Array.GetRandom(left).id);
      const w=Phaser.Utils.Array.GetRandom(WEAPONS); ownGear(w.name);
      saveGuild(); this.render();
    }, {size:11, fill:UI.lineSoftN, stroke:0x6b4a6b, color:UI.dim, icon:'bug', iconSize:12, radius:8}));

    // 資源列（含隊形 / 隊伍提示）
    const specs=[
      {label:'⭐ 聲望 '+reputation(), accent:'gold', icon:'star', size:12, h:26},
      {label:'遺物 '+GUILD.relics.length+'/'+relicTotalCount(), accent:'violet', icon:'relic', size:12, h:26},
      {label:'隊伍 '+partySizeCap()+'/5 人', accent:'teal', icon:'person', size:12, h:26},
      {label:'隊形 · '+currentFormation().name, accent:'violet', icon:'formation', size:12, h:26},
    ];
    const chips=specs.map(s=>chip(this,0,0,s)); const gap=10; let tot=chips.reduce((a,c)=>a+c.w,0)+gap*(chips.length-1);
    let cx=W/2-tot/2; chips.forEach(c=>{ c.setX(cx); c.setY(62); add(c); cx+=c.w+gap; });

    // ====== 遺物收藏（v2.3：每地城 1 件首領遺物，一次顯示 8 格、依世界分組）======
    const P=add(panel(this, W/2, 213, 868, 246, {accent:'violet', title:'遺物收藏', icon:'relic', titleSize:16}));
    const banked=GUILD.relics.filter(id=>RELIC_BY_ID[id]).length;
    add(txt(this, P.left+22, P.bodyTop+6, '每個地城擊敗首領可獲得 1 件專屬遺物　·　已收集 '+banked+' / '+relicTotalCount()+'　·　收進收藏後每趟永久生效', 11.5, UI.dim, 0, 0.5));
    const sz=48, slotGap=14, groupGap=46, slotY=P.bodyTop+72;
    const groups=[]; for(let w=0;w<WORLD_COUNT;w++) groups.push(destsOfWorld(w));
    const gW=g=>g.length*sz+(g.length-1)*slotGap;
    const totalW=groups.reduce((a,g)=>a+gW(g),0)+groupGap*Math.max(0,groups.length-1);
    let gx=W/2-totalW/2;
    groups.forEach((g,wi)=>{
      const wm=WORLD_META[wi]||{name:'世界 '+(wi+1)};
      add(txt(this, gx+gW(g)/2, P.bodyTop+34, wm.name, 12, accent(wm.accent||'gold').hex, 0.5));
      g.forEach((di,i)=>{ const x=gx+i*(sz+slotGap)+sz/2, d=DESTINATIONS[di], r=(RELICS_BY_DEST[di]||[])[0];
        if(r) this.relicSlot(x, slotY, sz, r);
        add(txt(this, x, slotY+sz/2+13, d?d.name:'', 9.5, accent(tierAccentName(d?d.tier:1)).hex, 0.5)); });
      gx+=gW(g)+groupGap;
    });
    // 詳細列（預設顯示生效效果，滑過遺物顯示該遺物）
    this.rdetY=P.bodyTop+126; this._rdet=[];
    this.showRelicDetail(null);

    // ====== 導覽卡（3 欄：新增「任務/懸賞」入口）======
    const cw=270, ch=58, gp=14, cxL=W/2-(cw+gp), cxM=W/2, cxR=W/2+(cw+gp), row1=372, row2=438;
    const cards=[
      {x:cxL, y:row1, accent:'teal', icon:'recruit', title:'招募所', desc:'解鎖出戰隊員、聘僱後勤', s:'RecruitHall'},
      {x:cxM, y:row1, accent:'violet', icon:'formation', title:'隊形', desc:'選擇站位與前後排加成', s:'FormationHall'},
      {x:cxR, y:row1, accent:'gold', icon:'star', title:'任務 / 懸賞', desc:'達成條件領聲望與稱號', s:'QuestHall'},
      {x:W/2-(cw+gp)/2, y:row2, accent:'ember', icon:'wagon', title:'商隊工坊', desc:'選馬車、強化貨格', s:'WagonHall'},
      {x:W/2+(cw+gp)/2, y:row2, accent:'blue', icon:'bag', title:'圖鑑', desc:'收藏：武器／防具／道具', s:'WarehouseHall'},
    ];
    cards.forEach(c=> add(navCard(this, c.x, c.y, cw, ch, {accent:c.accent, icon:c.icon, title:c.title, desc:c.desc, onClick:c.onClick||(()=>this.scene.start(c.s))})));

    add(button(this, W/2, 510, 330, 46, '前往整備出發', ()=>this.scene.start('Outfit'), {variant:'go', size:18, icon:'play', iconSize:18}));
  }
  relicSlot(x,y,sz,r){
    const got=relicCollected(r.id), ac=got?accent('violet'):accent('slate');
    const g=this._ui[this._ui.length]=this.add.graphics(); // track
    g.fillStyle(0x000000,0.3); g.fillRoundedRect(x-sz/2,y-sz/2+3,sz,sz,9);
    g.fillStyle(got?UI.raisedN:UI.panelN, got?1:0.55); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    if(got){ g.fillStyle(ac.deep,0.4); g.fillRoundedRect(x-sz/2,y-sz/2,sz,sz*0.5,9); }
    g.lineStyle(2, got?ac.num:UI.lineN, got?0.95:0.35); g.strokeRoundedRect(x-sz/2,y-sz/2,sz,sz,9);
    if(got) this._ui.push(txt(this, x, y, r.icon, sz*0.5, '#fff'));
    else this._ui.push(txt(this, x, y, '?', sz*0.42, UI.faint));
    const hit=this.add.rectangle(x,y,sz,sz,0xffffff,0.001).setInteractive({useHandCursor:true}); this._ui.push(hit);
    hit.on('pointerover',()=>this.showRelicDetail(r)); hit.on('pointerout',()=>this.showRelicDetail(null));
  }
  showRelicDetail(r){
    if(this._rdet) this._rdet.forEach(o=>o.destroy()); this._rdet=[];
    const W=this.scale.width, y=this.rdetY, lx=24+22, add=o=>{this._rdet.push(o);return o;};
    if(!r){
      add(txt(this, W/2, y+18, '把游標移到上方遺物格，查看該遺物的效果與產地', 12, UI.faint));
      return;
    }
    const got=relicCollected(r.id), ac=got?accent('violet'):accent('slate'), d=DESTINATIONS[r.dest];
    add(this.add.graphics().fillStyle(ac.deep,0.5).fillRoundedRect(24,y-2,44,44,9));
    add(txt(this, 46, y+20, got?r.icon:'?', got?24:22, got?'#fff':UI.faint));
    add(txt(this, 80, y+8, got?r.name:'？？？', 15, ac.hex, 0, 0.5));
    add(txt(this, 80, y+28, (got?'':'尚未尋得 ・ ')+'產地：'+(d?d.name:'')+' '+'★'.repeat(r.dest+1), 11, UI.dim, 0, 0.5));
    add(txt(this, 250, y+8, got? r.desc : '在「'+(d?d.name:'')+'」探索取得、帶回收藏後永久生效。', 11.5, got?UI.text:UI.faint, 0).setWordWrapWidth(W-250-30));
  }
  flash(msg){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,486,msg,14,UI.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:800,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
