# Relic Caravan（遺物商隊）

Phaser 3.80.1 的單機網頁 Roguelite。`index.html` 用傳統 `<script>` 依序載入
`js/` 下的模組（config → data → state → ui → scenes/* → main）。一趟完整 run：
公會大廳 → 出發整備 → 世界地圖 → 地城路線（Slay-the-Spire 式節點圖）→ 自動戰鬥 → 帶回遺物。
平衡數值集中在 `js/config.js`；純資料在 `js/data.js`。

---

## VM 視覺測試（在虛擬機跑遊戲、看畫面、據此優化）

可以在無頭 Chromium 裡把遊戲完整跑起來、自動點擊、截圖回來檢視，再依畫面改程式碼並重跑驗證。
工具在 `tools/vm-test/runner.js`（此檔會持久保存；`outputs` 暫存區每次工作階段會清空）。

### 一次性環境設定
在 **outputs 暫存目錄**（cwd，bash 路徑 `/sessions/<id>/mnt/outputs`）執行：

```bash
npm install @sparticuz/chromium@123 puppeteer-core@22 phaser@3.80.1
```

說明 / 踩過的雷：
- **Playwright 不能用**：它的瀏覽器下載 CDN 被沙盒網路 allowlist 擋掉（403）。
  改用 `@sparticuz/chromium`——它把無頭 Chromium 二進位包在 npm tarball 裡，
  而 npm registry 在 allowlist 內，所以裝得起來。搭配 `puppeteer-core`。
- **遊戲的 Phaser CDN 也被擋**（`cdn.jsdelivr.net` → ERR_EMPTY_RESPONSE，
  畫面會報 "Phaser is not defined"）。所以從 npm 裝同版 `phaser@3.80.1`，
  在 runner 裡用 **request interception** 攔截任何含 "phaser" 的請求、回傳本機檔案。
  **不需要修改 `index.html`**。

### 執行
```bash
# 把 runner 複製到 outputs（讓它找得到 node_modules），再跑
cp /sessions/<id>/mnt/Relic-Caravan/tools/vm-test/runner.js .
node runner.js /sessions/<id>/mnt/Relic-Caravan steps.json runner.log
```

如果單次執行超過 45s（首次啟動較慢），改成背景執行再輪詢：
```bash
nohup node runner.js <gameRoot> steps.json runner.log >/dev/null 2>&1 &
sleep 25 && cat runner.log && ls -la *.png
```

### steps.json 格式（依序執行）
視窗固定 1000×660，`click` 座標就是這個視窗的 CSS 像素。
```json
[ {"wait":1500},
  {"click":[503,616]},
  {"key":"Enter"},
  {"shot":"01.png"} ]
```

### 看截圖
截圖存在 outputs；用 **Read 工具搭配 Windows 路徑** 才讀得到（bash 的 `/sessions/...`
路徑 Read 工具看不到）。例：
`C:\Users\nelso\AppData\Roaming\Claude\local-agent-mode-sessions\<...>\outputs\01.png`
要拿給使用者看，就複製到 `Relic-Caravan\` 底下某資料夾再用 present_files。

### 重要行為
- **每次 `node runner.js` 都是全新遊戲**（從公會大廳開始、狀態歸零）。
  要到深層場景，必須在同一份 steps.json 裡把前面所有點擊一起重放。
- **地城路線圖是隨機生成**：節點位置每跑一次都不同，深層節點不要寫死座標，
  必要時先截圖看當下版面再決定下一步點哪。

### 已知流程座標（從公會大廳起算，可重放到戰鬥）
| 步驟 | 點擊座標 | 到達畫面 |
|------|----------|----------|
| 公會大廳「前往整備出發」 | `[503,616]` | 出發整備 |
| 整備「出發探險」 | `[503,588]` | 世界地圖 |
| 世界地圖「近郊遺跡 ▶前往」 | `[813,197]` | 地城路線圖 |
| 路線圖：點離「家」相鄰的節點 | 視當次版面而定 | 進入該節點（戰鬥/事件…）|
| 戰鬥右上「速度」鈕（加速跑完）| `[915,90]` | — |

### 沙盒注意
截圖中字串前出現的 `□`（tofu 方框）多半是**沙盒缺 emoji 字型**所致，
使用者的 Windows（Segoe UI Emoji）會正常顯示成圖示——**那不是 bug**，
評估畫面問題時要排除這類假象。
