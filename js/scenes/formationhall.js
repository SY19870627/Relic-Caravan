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
    this.repText=txt(this,200,86,'',13,TH.gold);
    this.listBtns=FORMATIONS.map((f,i)=> button(this, 165, 124+i*48, 230, 40, f.name, ()=>{
        if(!formationUnlocked(i)){
          if(!canUnlockFormation(i)){ this.flash(`聲望不足，需 ⭐${formationCost(i)}`); return; }
          unlockFormation(i); this.flash(`已解鎖隊形：${f.name}`,TH.green); this.render(); return;
        }
        GUILD.formation=i; saveGuild(); this.render();
      }, {size:15,fill:0x4a3f63,stroke:0x7a6f93,hover:0x6a5d8a}));
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const add=o=>{this._ui.push(o);return o;};
    const cur=GUILD.formation||0;
    if(this.repText) this.repText.setText('⭐ 聲望 '+reputation()+'（可花費）　·　🔒 隊形需用聲望解鎖');
    this.listBtns.forEach((b,i)=>{ const unlocked=formationUnlocked(i);
      b.bg.setStrokeStyle(i===cur?3:2, !unlocked?0x8a7a3a:(i===cur?0xe7c14a:0x7a6f93)); b.setAlpha(unlocked?1:0.85);
      b.label.setText(unlocked?FORMATIONS[i].name:`🔒 ${FORMATIONS[i].name}　⭐${formationCost(i)}`);
    });
    const f=currentFormation();
    add(this.add.rectangle(620,300,500,400,TH.panel).setStrokeStyle(2,0x5a8cd0));
    add(txt(this,620,128,f.name,20,TH.gold));
    add(txt(this,620,154,f.desc,12,TH.dim));
    // 站位預覽（小人按座標排出，越右越靠近敵人）
    add(txt(this,792,256,'敵 ▶',12,'#ff8a8a'));
    const info={warrior:['戰',0xc23b3b,'戰士'],ranger:['俠',0x83b154,'遊俠'],priest:['牧',0xe7c14a,'牧師'],mage:['法',0x8a6fd0,'法師'],rogue:['盜',0x4f8f6f,'盜賊']};
    // 依目前在隊成員顯示（招募法師後才出現法師站位）
    const sprites=activeRoster().map(i=>HERO_BASE[i].sprite).filter(sp=>f.slots[sp]);
    sprites.forEach(sp=>{ const s=formationSlot(sp), c=info[sp];   // 動態站位（依目前人數）
      const px=620+(s.x-250)*0.6, py=256+(s.y-360)*0.5;
      add(this.add.circle(px,py,16,c[1]).setStrokeStyle(2,0x140d18));
      add(txt(this,px,py,c[0],14,'#fff'));
    });
    // 各站位加減成
    const rowName={front:'前排',mid:'中排',back:'後排'};
    let y=362;
    sprites.forEach(sp=>{ const s=f.slots[sp];
      const mods=[]; if(s.atk)mods.push('ATK'+(s.atk>0?'+':'')+s.atk); if(s.def)mods.push('DEF'+(s.def>0?'+':'')+s.def);
      if(s.hp)mods.push('HP'+(s.hp>0?'+':'')+s.hp); if(s.heal)mods.push('治療'+(s.heal>0?'+':'')+s.heal);
      add(txt(this,620,y,`${info[sp][2]}　${rowName[s.row]}　${mods.join('・')||'—'}`,12,TH.text)); y+=21;
    });
    add(txt(this,620,478,'✓ 目前選用',13,'#5ad06a'));
  }
  flash(msg){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,500,msg,14,TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:900,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
