// ========================= 關於（開發者資訊） =========================
// 標題列的「關於」連結與右下角的 i 按鈕都會開啟同一個視窗；點 ✕ 或視窗外的暗處關閉
(function(){
  const dlg=document.getElementById('aboutDlg');
  const open=()=>dlg.classList.add('open');
  const close=()=>dlg.classList.remove('open');
  document.getElementById('aboutLink').addEventListener('click',open);
  document.getElementById('aboutBtn').addEventListener('click',open);
  document.getElementById('aboutClose').addEventListener('click',close);
  dlg.addEventListener('click',e=>{ if(e.target===dlg) close(); });
})();
