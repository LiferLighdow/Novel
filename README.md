# Lifer_Lighdow 原創小說（靜態閱讀器）

一個以純前端（HTML/CSS/Vanilla JS）實作的輕量小說閱讀器，支援本地新增/編輯小說、章節管理、閱讀設定與離線資料儲存（LocalStorage）。

## 主要功能一覽

- 書庫視圖（網格 / 列表切換）
- 搜尋（書名 / 作者）與分類篩選
- 閱讀器：章節導航、閱讀進度、書籤
- 閱讀設定：字體大小、行高、字體、最大寬度
- 本地儲存：所有書籍、閱讀進度、書籤與設定都儲存在 LocalStorage
- 支援以 HTML 格式撰寫章節內容

## 最近變更與已修正的問題

- 移除首頁靜態空狀態，改由 `app.js` 動態渲染，避免重複內容。
- 修正分類篩選按鈕的性能問題：按鈕事件改為只在初始化時綁定，避免事件疊加導致越選越卡。
- 修正右下角「+」新增按鈕無回應的問題（已加入相容 wrapper，並確保呼叫正確的上傳 modal）。
- 將在 `app.js` 中動態注入的 CSS 移回 `styles.css`，統一樣式管理。
- 移除開發用的 `console.log`，清理輸出。

這些修正已體現在目前的程式碼中，若要查看變更細節請檢視 `app.js` 與 `styles.css` 的最近 commit 或差異。

## 檔案說明

```
novel/
├── index.html        # 主頁（入口）
├── styles.css        # 全局樣式
├── app.js            # 應用邏輯（渲染、事件、LocalStorage）
├── README.md         # 說明文件（本檔案）
└── novels/           # 內建小說（HTML 檔）與封面資料夾
```

內建小說放在 `novels/`，檔名會在 `app.js` 中載入（範例：`novels/影夜.html`）。若你想直接新增靜態小說檔案，請確保每個 HTML 檔內含適當的章節標記（例如 `.chapter` 與 `.content`），或使用 UI 的「+」按鈕建立。

## 開發與維護建議

- 把大量重複的 inline SVG 與模板抽成共用函式或 SVG sprite，可減少檔案大小並提升維護性。
- 將 modal 與 card 的 template 抽成小函式，降低錯誤重複綁定的風險。
- 若需要跨瀏覽器更穩定的本地測試，使用簡單的 Node 或 Python HTTP server。

## 常見問題（FAQ）

Q: 點了「+」沒反應？

A: 已修正。若仍無反應，請檢查瀏覽器 Console（F12）是否有錯誤，或確認是否以 HTTP 伺服器方式啟動以避免 fetch 權限問題。

Q: 如何匯出或備份資料？

A: 所有數據儲存在 LocalStorage，你可以在瀏覽器開發者工具的 Application（或 Storage）面板找到 `novel-reader-books`、`novel-reader-settings` 等鍵值，手動匯出或複製。

Q: 如何新增內建小說（HTML 檔）？

A: 將 `.html` 檔放到 `novels/` 資料夾，檔名需與 `app.js` 中 `loadBuiltInNovels()` 列表相符，或修改 `app.js` 對應的檔名清單。

## 如何貢獻

- 歡迎開 issue 或 pull request。簡單的貢獻方向：
  - 抽離共用 icon 與模板
  - 加入自動化測試或 lint
  - 改善封面生成的字型處理（中文斷行優化）

## 授權

本專案採用 MIT 授權。

---

如果你要我把 README 再改成更簡潔的版本、或加上操作截圖與開發流程（例如如何在 VS Code 調試），我可以接著幫你補上。

Enjoy reading! 📚
