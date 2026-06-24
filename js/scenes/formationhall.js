// ========================= 隊形（選擇陣形） =========================
class FormationHall extends Phaser.Scene {
  constructor(){ super('FormationHall'); }

  create(data){
    this.from=(data&&data.from)||'GuildHall';
    this.listTop=122;
    this.listX=165;
    this.listW=230;
    this.rowH=40;
    this.rowGap=8;
    this.visibleRows=9;
    this.scroll=0;

    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(1.35,1.35).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    sceneHeader(this,'隊 形','選擇陣形：站位固定，各位置有加減成；前排易被集火、後排較安全',{accent:'gold', size:25});
    button(this, 96, 26, 150, 28, '← 返回', ()=>this.scene.start(this.from), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.repText=txt(this,200,86,'',13,TH.gold);

    const listHit=this.add.rectangle(this.listX, this.listTop+(this.visibleRows-1)*(this.rowH+this.rowGap)/2, this.listW+38, this.visibleRows*(this.rowH+this.rowGap), 0xffffff, 0.001).setInteractive();
    listHit.on('wheel',(pointer,dx,dy)=>this.scrollBy(dy>0?1:-1));

    this.ensureSelectedVisible();
    this.render();
  }

  maxScroll(){
    return Math.max(0, FORMATIONS.length-this.visibleRows);
  }

  clampScroll(){
    this.scroll=Math.max(0, Math.min(this.maxScroll(), this.scroll||0));
  }

  scrollBy(delta){
    const old=this.scroll||0;
    this.scroll=old+delta;
    this.clampScroll();
    if(this.scroll!==old) this.render();
  }

  ensureSelectedVisible(){
    const cur=GUILD.formation||0;
    if(cur<this.scroll) this.scroll=cur;
    if(cur>=this.scroll+this.visibleRows) this.scroll=cur-this.visibleRows+1;
    this.clampScroll();
  }

  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy());
    this._ui=[];
    const add=o=>{this._ui.push(o);return o;};
    const cur=GUILD.formation||0;
    this.clampScroll();

    if(this.repText) this.repText.setText('⭐ 聲望 '+reputation()+'（可花費）　·　🔒 隊形需用聲望解鎖');
    this.renderList(add, cur);
    this.renderPreview(add);
  }

  renderList(add, cur){
    const pitch=this.rowH+this.rowGap;
    const end=Math.min(FORMATIONS.length, this.scroll+this.visibleRows);
    for(let i=this.scroll;i<end;i++){
      const f=FORMATIONS[i], unlocked=formationUnlocked(i);
      const y=this.listTop+(i-this.scroll)*pitch;
      const label=unlocked?f.name:'🔒 '+f.name+'　⭐'+formationCost(i);
      const b=add(button(this, this.listX, y, this.listW, this.rowH, label, ()=>{
        if(!formationUnlocked(i)){
          if(!canUnlockFormation(i)){ this.flash('聲望不足，需 ⭐'+formationCost(i)); return; }
          unlockFormation(i);
          this.flash('已解鎖隊形：'+f.name, TH.green);
          this.render();
          return;
        }
        GUILD.formation=i;
        saveGuild();
        this.ensureSelectedVisible();
        this.render();
      }, {size:15,fill:0x4a3f63,stroke:0x7a6f93,hover:0x6a5d8a}));
      if(b._hit) b._hit.on('wheel',(pointer,dx,dy)=>this.scrollBy(dy>0?1:-1));
      b.bg.setStrokeStyle(i===cur?3:2, !unlocked?0x8a7a3a:(i===cur?0xe7c14a:0x7a6f93));
      b.setAlpha(unlocked?1:0.85);
    }
    this.renderScrollbar(add);
  }

  renderScrollbar(add){
    const max=this.maxScroll();
    const trackX=this.listX+this.listW/2+18;
    const trackTop=this.listTop-this.rowH/2;
    const trackH=this.visibleRows*(this.rowH+this.rowGap)-this.rowGap;
    const g=add(this.add.graphics());
    g.fillStyle(0x000000,0.35);
    g.fillRoundedRect(trackX-4, trackTop, 8, trackH, 4);
    g.lineStyle(1,0x7a6f93,0.75);
    g.strokeRoundedRect(trackX-4, trackTop, 8, trackH, 4);
    const thumbH=max<=0 ? trackH : Math.max(34, trackH*(this.visibleRows/FORMATIONS.length));
    const thumbY=trackTop+(max<=0?0:(trackH-thumbH)*(this.scroll/max));
    g.fillStyle(0xe7c14a,0.9);
    g.fillRoundedRect(trackX-4, thumbY, 8, thumbH, 4);
  }

  renderPreview(add){
    const f=currentFormation();
    add(this.add.rectangle(620,300,500,400,TH.panel).setStrokeStyle(2,0x5a8cd0));
    add(txt(this,620,128,f.name,20,TH.gold));
    add(txt(this,620,154,f.desc,12,TH.dim));
    add(txt(this,792,256,'敵 ▶',12,'#ff8a8a'));

    const info={
      warrior:['戰',0xc23b3b,'戰士'],
      ranger:['俠',0x83b154,'遊俠'],
      priest:['牧',0xe7c14a,'牧師'],
      mage:['法',0x8a6fd0,'法師'],
      rogue:['盜',0x4f8f6f,'盜賊']
    };
    const sprites=activeRoster().map(i=>HERO_BASE[i].sprite).filter(sp=>f.slots[sp]);
    sprites.forEach(sp=>{
      const s=formationSlot(sp), c=info[sp];
      const px=620+(s.x-250)*0.6, py=256+(s.y-360)*0.5;
      add(this.add.circle(px,py,16,c[1]).setStrokeStyle(2,0x140d18));
      add(txt(this,px,py,c[0],14,'#fff'));
    });

    const rowName={front:'前排',mid:'中排',back:'後排'};
    let y=362;
    sprites.forEach(sp=>{
      const s=f.slots[sp];
      const mods=[];
      if(s.atk) mods.push('ATK'+(s.atk>0?'+':'')+s.atk);
      if(s.def) mods.push('DEF'+(s.def>0?'+':'')+s.def);
      if(s.hp) mods.push('HP'+(s.hp>0?'+':'')+s.hp);
      if(s.heal) mods.push('治療'+(s.heal>0?'+':'')+s.heal);
      add(txt(this,620,y,info[sp][2]+'　'+rowName[s.row]+'　'+(mods.join(' · ')||'無加成'),12,TH.text));
      y+=21;
    });
    add(txt(this,620,478,'✓ 目前選用',13,'#5ad06a'));
  }

  flash(msg,color){
    if(this._f) this._f.destroy();
    this._f=txt(this,this.scale.width/2,500,msg,14,color||TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:900,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }});
  }
}
