// ========================= 隊形（選擇陣形） =========================
class FormationHall extends Phaser.Scene {
  constructor(){ super('FormationHall'); }
  create(data){
    this.from=(data&&data.from)||'GuildHall';
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'隊 形',24,TH.gold);
    txt(this,W/2,48,'選擇陣形：站位固定，各位置有加減成；前排易被集火、後排被保護',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 返回', ()=>this.scene.start(this.from), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.listBtns=FORMATIONS.map((f,i)=> button(this, 165, 118+i*50, 230, 42, f.name, ()=>{
        if(reputation()<(f.repReq||0)){ this.flash(`需聲望 ${f.repReq} 才能使用`); return; }
        GUILD.formation=i; saveGuild(); this.render();
      }, {size:15,fill:0x4a3f63,stroke:0x7a6f93,hover:0x6a5d8a}));
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const add=o=>{this._ui.push(o);return o;};
    const cur=GUILD.formation||0, rep=reputation();
    this.listBtns.forEach((b,i)=>{ const locked=rep<(FORMATIONS[i].repReq||0);
      b.bg.setStrokeStyle(i===cur?3:2, locked?0x8a3a3a:(i===cur?0xe7c14a:0x7a6f93)); b.setAlpha(locked?0.5:1);
      b.label.setText(locked?`🔒 ${FORMATIONS[i].name}`:FORMATIONS[i].name);
    });
    const f=currentFormation();
    add(this.add.rectangle(620,300,500,400,TH.panel).setStrokeStyle(2,0x5a8cd0));
    add(txt(this,620,128,f.name,20,TH.gold));
    add(txt(this,620,154,f.desc,12,TH.dim));
    // 站位預覽（小人按座標排出，越右越靠近敵人）
    add(txt(this,792,256,'敵 ▶',12,'#ff8a8a'));
    const info={warrior:['戰',0xc23b3b,'戰士'],ranger:['俠',0x83b154,'遊俠'],priest:['牧',0xe7c14a,'牧師'],mage:['法',0x8a6fd0,'法師']};
    // 依目前在隊成員顯示（招募法師後才出現法師站位）
    const sprites=activeRoster().map(i=>HERO_BASE[i].sprite).filter(sp=>f.slots[sp]);
    sprites.forEach(sp=>{ const s=f.slots[sp];
      const px=620+(s.x-250)*0.5, py=256+(s.y-357)*0.45, c=info[sp];
      add(this.add.circle(px,py,16,c[1]).setStrokeStyle(2,0x140d18));
      add(txt(this,px,py,c[0],14,'#fff'));
    });
    // 各站位加減成
    const rowName={front:'前排',mid:'中排',back:'後排'};
    let y=372;
    sprites.forEach(sp=>{ const s=f.slots[sp];
      const mods=[]; if(s.atk)mods.push('ATK'+(s.atk>0?'+':'')+s.atk); if(s.def)mods.push('DEF'+(s.def>0?'+':'')+s.def);
      if(s.hp)mods.push('HP'+(s.hp>0?'+':'')+s.hp); if(s.heal)mods.push('治療'+(s.heal>0?'+':'')+s.heal);
      add(txt(this,620,y,`${info[sp][2]}　${rowName[s.row]}　${mods.join('・')||'—'}`,13,TH.text)); y+=24;
    });
    add(txt(this,620,472,'✓ 目前選用',13,'#5ad06a'));
  }
  flash(msg){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,500,msg,14,TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:900,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
