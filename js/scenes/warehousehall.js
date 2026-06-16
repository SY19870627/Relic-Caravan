// ========================= 倉庫所（查看持有物品） =========================
class WarehouseHall extends Phaser.Scene {
  constructor(){ super('WarehouseHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'倉 庫',24,TH.gold);
    txt(this,W/2,48,'查看公會保留下來的物品（探險結算時選「保留」會進倉庫）',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});

    const stash=GUILD.stash||[];
    const totalVal=stash.reduce((a,b)=>a+(b.value||0),0);
    txt(this,W/2,82,`共 ${stash.length} 件　總價值 ＄${totalVal}　|　🏛 神殿遺物 ${GUILD.relics.length} 件（已供奉）`,13,TH.gold);

    this.add.rectangle(W/2,330,820,470,TH.panel).setStrokeStyle(2,0x3a3150);
    const kinds=[['武器','⚔','#9fe8ff'],['防具','🛡','#9fd0a0'],['貴重物品','💎','#cdeecd'],['道具','🧪','#ffd6a0']];
    let y=130;
    kinds.forEach(([k,icon,col])=>{
      const items=stash.filter(it=>it.kind===k);
      const counts={}; items.forEach(it=>counts[it.name]=(counts[it.name]||0)+1);
      const names=Object.keys(counts);
      const list=names.length? names.map(n=>`${n}×${counts[n]}`).join('　') : '（無）';
      txt(this,90,y,`${icon} ${k}（${items.length} 件）`,15,col,0);
      txt(this,110,y+24,list,12, names.length?TH.text:TH.dim, 0).setWordWrapWidth(780);
      y+=72;
    });
    if(!stash.length) txt(this,W/2,y+10,'倉庫目前是空的——探險結算時把物品選「保留」就會收進這裡。',12,TH.dim);
  }
}
