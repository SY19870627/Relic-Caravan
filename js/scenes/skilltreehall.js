// ========================= 職業規劃器（大改版・職業規劃器）=========================
// 配置出戰 build：1 大招 + 3 主動小招 + 任意被動（被動不佔槽）。
// Lv1–20 配置 = 一串「習得/升級」動作（順序＝等級）；地城內升級時 gainXP 依此自動發放。
// 點數成本：習得 = tier(1/2/3)；升級第 n 次 = n 點。可花總額 = classPointCap（基底＋活著回來累加）。
class SkillTreeHall extends Phaser.Scene {
  constructor(){ super('SkillTreeHall'); }
  create(data){
    this.from=(data&&data.from)||'GuildHall';
    this.sprite=(data&&data.sprite)||'warrior';
    sceneBg(this,{glow:0xa98bff});
    sceneHeader(this,'職業規劃','選職業配技能 build：1 大招 + 3 主動小招 + 任意被動（升級照表自動發招）',{accent:'violet'});
    if(!GUILD.classPlans) GUILD.classPlans={};
    if(!GUILD.classPlans[this.sprite] || !Array.isArray(GUILD.classPlans[this.sprite].slots)) GUILD.classPlans[this.sprite]={slots:[]};
    button(this, 86, 30, 150, 30, '返回大廳', ()=>this.scene.start(this.from), {variant:'info', size:13, icon:'home', iconSize:13});
    button(this, this.scale.width-92, 30, 150, 30, '重置配置', ()=>{ GUILD.classPlans[this.sprite].slots=[]; saveGuild(); this.render(); }, {variant:'gold', size:12, icon:'refresh', iconSize:12});
    this.ROLE_ACC={ultimate:'gold', active:'blue', passive:'violet'};
    this.ROLE_LABEL={ultimate:'大招', active:'主動', passive:'被動'};
    this.render();
  }
  // ---- 資料存取 ----
  actions(){ return GUILD.classPlans[this.sprite].slots; }
  pool(){ return SKILLS[this.sprite]||[]; }
  skillObj(name){ return this.pool().find(s=>s.name===name)||null; }
  learnedNames(){ const out=[]; this.actions().forEach(a=>{ if(a.act==='learn' && out.indexOf(a.skill)<0) out.push(a.skill); }); return out; }
  rankOf(name){ let r=0; this.actions().forEach(a=>{ if(a.skill!==name) return; if(a.act==='learn') r=Math.max(r,1); else if(a.act==='upgrade') r++; }); return r; }
  roleCounts(){ const c={ultimate:0,active:0,passive:0}; this.learnedNames().forEach(n=>{ const s=this.skillObj(n); const role=(s&&s.role)||'active'; c[role]=(c[role]||0)+1; }); return c; }
  cap(){ return classPointCap(this.sprite); }
  spent(){ return planSpent(this.sprite); }
  // ---- 編輯動作（即時存檔）----
  addLearn(name){ const s=this.skillObj(name); if(!s) return;
    if(this.learnedNames().indexOf(name)>=0){ this.flash('已習得'); return; }
    if(this.actions().length>=20){ this.flash('已達 Lv20 上限'); return; }
    const c=this.roleCounts();
    if(s.role==='ultimate'&&c.ultimate>=1){ this.flash('大招只能裝 1 個'); return; }
    if(s.role==='active'&&c.active>=3){ this.flash('主動小招最多 3 個'); return; }
    if(this.spent()+skillLearnCost(this.sprite,name)>this.cap()){ this.flash('點數不足'); return; }
    this.actions().push({act:'learn',skill:name}); saveGuild(); this.render(); }
  addUpgrade(name){ if(this.learnedNames().indexOf(name)<0){ this.flash('先習得才能升級'); return; }
    if(this.actions().length>=20){ this.flash('已達 Lv20 上限'); return; }
    if(this.spent()+upgradeStepCost(this.rankOf(name))>this.cap()){ this.flash('點數不足'); return; }
    this.actions().push({act:'upgrade',skill:name}); saveGuild(); this.render(); }
  removeAt(i){ const a=this.actions(), act=a[i]; if(!act) return;
    if(act.act==='learn'){ GUILD.classPlans[this.sprite].slots=a.filter(x=>x.skill!==act.skill); }   // 移除習得＝連同其升級一起拿掉
    else { a.splice(i,1); }
    saveGuild(); this.render(); }
  // ---- 繪製 ----
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const add=o=>{ this._ui.push(o); return o; };
    const cap=this.cap(), spent=this.spent(), c=this.roleCounts(), valid=planValid(this.sprite);

    // ===== 職業切換分頁（已解鎖職業）=====
    const W=this.scale.width;
    const unlocked=CLASS_ORDER.filter((sp,i)=>ROSTER[i]&&ROSTER[i].unlocked);
    const tw=92, tg=8, ttot=unlocked.length*tw+(unlocked.length-1)*tg, tx=W/2-ttot/2+tw/2;
    unlocked.forEach((sp,i)=>{ const on=sp===this.sprite;
      add(button(this, tx+i*(tw+tg), 72, tw, 24, CLASS_LABEL[sp], ()=>{ this.sprite=sp;
        if(!GUILD.classPlans[sp]||!Array.isArray(GUILD.classPlans[sp].slots)) GUILD.classPlans[sp]={slots:[]};
        this.render(); }, {accent: on?'violet':'slate', size:12})); });

    // ===== 左：技能池 =====
    add(panel(this, 238, 314, 452, 456, {accent:'violet', title:'技能池（點選加入配置）', icon:'sparkle', titleSize:14}));
    let y=156;
    ['ultimate','active','passive'].forEach(role=>{
      const ac=accent(this.ROLE_ACC[role]);
      const capTxt = role==='ultimate'?'裝 1':(role==='active'?'裝 3':'不限');
      add(txt(this, 26, y, this.ROLE_LABEL[role]+'　('+capTxt+')', 14, ac.hex, 0, 0.5)); y+=23;
      this.pool().filter(s=>s.role===role).forEach(s=>{ this.poolRow(add, y, s); y+=23; });
      y+=6;
    });

    // ===== 右：出戰配置 =====
    add(panel(this, 676, 314, 432, 456, {accent:'gold', title:'出戰配置（Lv1–20）', icon:'star', titleSize:14}));
    // 點數條
    add(statBar(this, 478, 162, 396, 16, spent, Math.max(cap,1), {accent: valid?'green':'red'}));
    add(txt(this, 676, 162, '點數 '+spent+' / '+cap, 11, UI.white));
    add(txt(this, 478, 184, '大招 '+c.ultimate+'/1　主動 '+c.active+'/3　被動 '+c.passive+'　動作 '+this.actions().length+'/20', 10.5, UI.dim, 0));
    add(txt(this, 478, 202, valid?'✓ 可出戰':'✗ 超出點數上限', 11, valid?UI.green:UI.red, 0));
    // Lv1–20 動作列
    const acts=this.actions();
    if(!acts.length){ add(txt(this, 676, 320, '從左側技能池點選技能，加入 Lv1–20 配置', 11, UI.faint)); }
    const seen={};
    acts.forEach((a,i)=>{ const yy=224+i*15; const s=this.skillObj(a.skill); const ac=accent(this.ROLE_ACC[(s&&s.role)||'active']);
      let label;
      if(a.act==='learn'){ seen[a.skill]=1; label='習得 '+a.skill; }
      else { seen[a.skill]=(seen[a.skill]||1)+1; label=a.skill+' +'+(seen[a.skill]-1); }
      add(txt(this, 476, yy, 'Lv'+(i+1), 10, UI.dim, 0, 0.5));
      add(txt(this, 512, yy, label, 10.5, ac.hex, 0, 0.5));
      const hit=this.add.rectangle(874, yy, 18, 14, 0xffffff, 0.001).setInteractive({useHandCursor:true}); add(hit);
      add(txt(this, 874, yy, '✕', 11, UI.red));
      hit.on('pointerdown',()=>this.removeAt(i));
    });
  }
  poolRow(add, y, s){
    const learned=this.learnedNames().indexOf(s.name)>=0, rank=this.rankOf(s.name), ac=accent(this.ROLE_ACC[s.role]);
    const rect=this.add.rectangle(238, y, 436, 21, learned?ac.deep:UI.panelHiN, learned?0.6:0.95).setStrokeStyle(1.2, ac.num, learned?1:0.55).setInteractive({useHandCursor:true});
    add(rect);
    add(icon(this, 26, y, skillVisual(s).icon, 16, ac.num));
    add(txt(this, 42, y, s.name, 14, learned?ac.hex:UI.white, 0, 0.5));
    let d=s.desc||''; if(d.length>15) d=d.slice(0,14)+'…';
    add(txt(this, 134, y, d, 11, UI.dim, 0, 0.5));
    const right = learned ? ('Lv'+rank+' ▲升級') : ('費 '+(s.tier||1));
    add(txt(this, 452, y, right, 11.5, learned?UI.green:UI.dim, 1, 0.5));
    rect.on('pointerdown',()=>{ if(learned) this.addUpgrade(s.name); else this.addLearn(s.name); });
  }
  flash(msg, col){ if(this._f) this._f.destroy();
    this._f=txt(this, this.scale.width/2, 540, msg, 13, col||UI.red).setDepth(99).setStroke('#000',3);
    this.tweens.add({targets:this._f, alpha:0, delay:900, duration:500, onComplete:()=>{ if(this._f){ this._f.destroy(); this._f=null; } }}); }
}
