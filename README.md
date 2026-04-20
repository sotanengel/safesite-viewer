# SafeSite Viewer

住所を入力するだけで、その土地の**災害リスクと立地特性**を 1 画面で直感的に把握できる Web アプリ。

住宅購入・賃貸契約・旅行先選定などの意思決定を支援します。

## 機能（Phase 1）

- 地理院タイルベースの地図（標準/淡色/航空写真）
- ハザードレイヤー: 洪水・土砂災害・津波・地震動 ON/OFF + 透過度調整
- 住所検索 → 地図ジャンプ
- クリック地点のリスクサマリパネル
- 最寄り避難所・病院・学校の表示
- パーマリンク共有

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone git@github.com:sotanengel/safesite-viewer.git
cd safesite-viewer

# 環境変数ファイルを作成
cp .env.example .env.local
# .env.local に API キーを設定

# 依存インストール (Takumi Guard 経由)
npm install

# 開発サーバー起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

## 技術スタック

| 層 | 技術 |
|---|---|
| フロント | Next.js (App Router) / React 19 / TypeScript |
| 地図 | MapLibre GL JS |
| スタイル | Tailwind CSS v4 |
| 状態管理 | Zustand |
| BFF | Next.js API Routes |
| サプライチェーン | Takumi Guard (npm proxy) |

## データソースと出典

- [国土地理院 地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)（出典表示必須）
- [国土交通省 ハザードマップポータル](https://disaportal.gsi.go.jp/)
- [J-SHIS Map (防災科学技術研究所)](https://www.j-shis.bosai.go.jp/)
- [国土数値情報](https://nlftp.mlit.go.jp/ksj/)（出典「国土交通省」）
- [産総研 活断層データベース](https://gbank.gsj.jp/activefault/)

## 免責事項

本アプリは参考情報の提供を目的としており、不動産取引における法令上の重要事項説明の代替となるものではありません。
