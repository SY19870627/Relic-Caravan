// ========================= 商會（賣出倉庫物品換取資金） =========================
class MerchantHall extends Phaser.Scene {
  constructor(){ super('MerchantHall'); }
  create(){
    const W=this.scale.width,H=this.scale.height;
    this.add.tileSprite(0,0,W,H,'wall').setOrigin(0).setTileScale(2,2).setAlpha(0.5);
    this.add.rectangle(0,0,W,H,0x0e0a14,0.4).setOrigin(0);
    txt(this,W/2,26,'商 會',24,TH.gold);
    txt(this,W/2,48,'把倉庫裡用不到的物品賣給商會，換成公會資金',12,TH.dim);
    button(this, 96, 26, 150, 28, '← 公會大廳', ()=>this.scene.start('GuildHall'), {size:12,fill:0x3a4f6b,stroke:0x5a8cd0,hover:0x4c6c9c});
    this.render();
  }
  // 賣價：物品價值的 sellRate（最低 1）
  static price(it){ return Math.max(1, Math.round((it.value||0)*CFG.merchant.sellRate)); }
  sell(filterFn,label){
    const stash=GUILD.stash||[];
    const sold=stash.filter(filterFn);
    if(!sold.length){ this.flash('沒有可賣出的物品'); return; }
    const gain=sold.reduce((a,b)=>a+MerchantHall.price(b),0);
    GUILD.stash=stash.filter(it=>!filterFn(it));
    GUILD.funds+=gain; saveGuild();
    this.flash(`賣出 ${sold.length} 件${label||''} → ＄${gain}`,TH.green);
    this.render();
  }
  render(){
    if(this._ui) this._ui.forEach(o=>o.destroy()); this._ui=[];
    const W=this.scale.width, add=o=>{this._ui.push(o);return o;};
    const stash=GUILD.stash||[];
    const totalSell=stash.reduce((a,b)=>a+MerchantHall.price(b),0);
    add(txt(this,W/2,82,`公會資金 ＄${GUILD.funds}　|　倉庫 ${stash.length} 件　可賣得 ＄${totalSell}`,13,TH.gold));

    add(this.add.rectangle(W/2,318,820,420,TH.panel).setStrokeStyle(2,0x3a3150));
    const kinds=[['武器','⚔','#9fe8ff'],['防具','🛡','#9fd0a0'],['貴重物品','💎','#cdeecd'],['道具','🧪','#ffd6a0']];
    let y=128;
    kinds.forEach(([k,icon,col])=>{
      const items=stash.filter(it=>it.kind===k);
      const counts={}; items.forEach(it=>counts[it.name]=(counts[it.name]||0)+1);
      const names=Object.keys(counts);
      const list=names.length? names.map(n=>`${n}×${counts[n]}`).join('　') : '（無）';
      const sub=items.reduce((a,b)=>a+MerchantHall.price(b),0);
      add(txt(this,90,y,`${icon} ${k}（${items.length} 件）`,15,col,0));
      add(txt(this,110,y+24,list,12, names.length?TH.text:TH.dim, 0).setWordWrapWidth(620));
      const ok=items.length>0;
      add(button(this, 740, y+8, 130, 30, ok?`賣出 ＄${sub}`:'賣出', ()=>this.sell(it=>it.kind===k, k),
        {size:12, fill:ok?0x6b5a3a:0x33323a, stroke:ok?0xd0b05a:0x55555f, hover:ok?0x8c7a4c:0x33323a}));
      y+=84;
    });

    const okAll=stash.length>0;
    add(button(this, W/2, 500, 300, 40, okAll?`💰 全部賣出 ＄${totalSell}`:'全部賣出（倉庫是空的）', ()=>this.sell(()=>true,''),
      {size:15, fill:okAll?0x3a6b3a:0x33323a, stroke:okAll?0x5ad06a:0x55555f, hover:okAll?0x4c8c4c:0x33323a}));
    add(txt(this,W/2,536,`※ 賣價為物品價值的 ${Math.round(CFG.merchant.sellRate*100)}%；神殿遺物不在此販售（已供奉產生祝福）`,11,TH.dim));
  }
  flash(msg,col){ if(this._f) this._f.destroy(); this._f=txt(this,this.scale.width/2,470,msg,14,col||TH.red).setDepth(99);
    this.tweens.add({targets:this._f,alpha:0,delay:900,duration:500,onComplete:()=>{ if(this._f){this._f.destroy(); this._f=null;} }}); }
}
