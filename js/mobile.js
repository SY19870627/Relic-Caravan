// ========================= 手機與全螢幕 =========================
// 1. 全螢幕按鈕（瀏覽器支援 Fullscreen API 才顯示；iPhone Safari 不支援，改用「加入主畫面」）
// 2. 手機直拿時提示橫向，Android 進全螢幕後會嘗試鎖定橫向
// 3. 觸控上下滑動 → 轉成滾輪事件，讓原本只支援滑鼠滾輪的清單（隊形、料理、倉庫）也能用手指捲動
(function(){
  const root=document.documentElement;
  const fsBtn=document.getElementById('fsBtn');
  const hint=document.getElementById('rotateHint');
  const rotateFs=document.getElementById('rotateFs');
  const rotateSkip=document.getElementById('rotateSkip');

  const canFs=!!(root.requestFullscreen||root.webkitRequestFullscreen) && !!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
  const standalone=(window.matchMedia&&(matchMedia('(display-mode: fullscreen)').matches||matchMedia('(display-mode: standalone)').matches))||navigator.standalone===true;
  const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
  const ICON_IN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const ICON_OUT='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';

  const refreshScale=()=>{ setTimeout(()=>{ try{ window.__GAME && window.__GAME.scale.refresh(); }catch(_){} },150); };

  async function enterFs(){
    try{ await (root.requestFullscreen||root.webkitRequestFullscreen).call(root,{navigationUI:'hide'}); }catch(_){ return; }
    try{ if(screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); }catch(_){}
  }
  async function exitFs(){
    try{ await (document.exitFullscreen||document.webkitExitFullscreen).call(document); }catch(_){}
  }
  function syncFs(){
    const on=!!fsEl();
    fsBtn.innerHTML=on?ICON_OUT:ICON_IN;
    fsBtn.title=on?'離開全螢幕':'全螢幕'; fsBtn.setAttribute('aria-label',fsBtn.title);
    refreshScale();
  }
  if(canFs && !standalone){
    fsBtn.hidden=false; syncFs();
    fsBtn.addEventListener('click',()=>{ fsEl()?exitFs():enterFs(); });
    document.addEventListener('fullscreenchange',syncFs);
    document.addEventListener('webkitfullscreenchange',syncFs);
    rotateFs.hidden=false;
  }

  // 直拿提示：本次瀏覽關掉後就不再出現
  const dismiss=()=>{ document.body.classList.add('hint-dismissed'); try{ sessionStorage.setItem('rc_hint_dismissed','1'); }catch(_){} refreshScale(); };
  try{ if(sessionStorage.getItem('rc_hint_dismissed')==='1') document.body.classList.add('hint-dismissed'); }catch(_){}
  rotateSkip.addEventListener('click',dismiss);
  rotateFs.addEventListener('click',()=>{ dismiss(); enterFs(); });

  window.addEventListener('orientationchange',refreshScale);
  window.addEventListener('resize',refreshScale);
  document.addEventListener('gesturestart',e=>e.preventDefault());   // iOS：擋掉雙指縮放
  document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});

  // 觸控滑動 → 滾輪：手指每移動 STEP px 送出一次滾輪事件（手指往上滑＝清單往下捲）
  const STEP=36;
  let tracking=null;
  function attach(canvas){
    canvas.addEventListener('touchstart',e=>{
      if(e.touches.length!==1){ tracking=null; return; }
      const t=e.touches[0]; tracking={y:t.clientY,x:t.clientX,acc:0};
    },{passive:true});
    canvas.addEventListener('touchmove',e=>{
      if(!tracking||e.touches.length!==1) return;
      const t=e.touches[0]; tracking.acc+=tracking.y-t.clientY; tracking.y=t.clientY; tracking.x=t.clientX;
      while(Math.abs(tracking.acc)>=STEP){
        const dir=tracking.acc>0?1:-1; tracking.acc-=dir*STEP;
        canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:dir*100,deltaMode:0,clientX:tracking.x,clientY:tracking.y,bubbles:true,cancelable:true}));
      }
    },{passive:true});
    canvas.addEventListener('touchend',()=>{ tracking=null; },{passive:true});
    canvas.addEventListener('touchcancel',()=>{ tracking=null; },{passive:true});
  }
  (function waitCanvas(){
    const c=window.__GAME&&window.__GAME.canvas;
    if(c) attach(c); else setTimeout(waitCanvas,100);
  })();
})();
