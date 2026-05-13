<!-- url: ipfs://bafkreieijgilvnsuodwek3ovwx2azkt4ubxzwqr3txu35jtbdh6fc5tkea -->
# SIPO

**Proposal:** Pebble & Ecosystem maintenance TypeScript core of Cardano
**Vote:** Yes
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes YES on Pebble & Ecosystem maintenance: TypeScript core of Cardano.

Governance Action ID: gov_action1ggr2uz7prwn5l84cdn2krwngfez0p7wluy4u3u3ez9pz5ls2whesqnsjly8
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-05-13

Context: This is the resubmission of the TypeScript / smart-contract-language half of HLabs's original 2026 Budget, on which SIPO voted YES (with binding expectations) on 2026-04-10. The original ₳8.0M single proposal narrowly missed DRep ratification at 66.78%. HLabs split the work into two independently-votable proposals and reduced the combined ask by approximately 30% in USD terms. SIPO has reviewed both resubmissions and votes YES on each individually.

Why SIPO votes YES

1. The five SIPO expectations from the 2026-04-10 vote are structurally addressed.
- Monthly velocity transparency: Monthly Lightweight Updates, Quarterly Detailed Reports, and a Public Transaction Journal committed in the HarmonicLabs/2026-treasury-proposal repository, matching the standard SIPO asked of Amaru and Dingo.
- Q2 hard-fork (Plutus V4) gate: M1.B is an independently-payable sub-milestone (₳210k), with CI-green Plutus V4 testnet snapshot for all four maintained libraries as the acceptance criterion. M1.A (Pebble) and M1.B (HF maintenance) can be co-signed and paid independently, so HLabs has no incentive to bundle or delay HF work.
- Past delivery accountability: the 2025 Retrospective (IPFS QmZVw...e9c) documents EC-0014-25 Gerolamo as 11/13 fully shipped and 2/13 in progress, despite ADA/USD dropping from ~0.7 to under 0.3 (effective funding cut by more than half). HLabs still delivered.
- Aiken complementarity: an explicit "Why Pebble and Aiken can coexist" section, a complementarity table mapping each to different developer profiles, and Lucas Rosa (Aiken / Midnight) on the Independent Oversight Board.
- 25% contingency discipline: reduced to 15% (10pp absolute reduction), structured as a refundable reserve with contract-enforced failsafe sweep back to the Cardano treasury at expiration.

2. Pebble expands the developer funnel without fragmenting it. Cardano Foundation surveys show TypeScript / JavaScript is the most-used language among Cardano developers. Pebble is TypeScript-shaped, imperative-first, targets UPLC, and its UPLC-CAPE benchmarks show strict improvement over Aiken at smaller script sizes. Aiken remains the FP-fluent option; Pebble opens the EVM / Web2 onramp. This directly supports Cardano 2030 Pillar 2 (A.3 Developer Experience — Education & migration).

3. Tooling maintenance is load-bearing public-good infrastructure. cardano-ledger-ts, ouroboros-miniprotocols-ts, plutus-machine, and uplc are direct or transitive dependencies of Mesh, Lucid Evolution, Midgard, and the long tail of TypeScript dApps and wallets. Skipping this funding does not save money; it pushes the cost to dozens of downstream teams who absorb it independently and inconsistently.

4. Governance and budget discipline match SIPO's approved standard. SundaeLabs treasury-contracts framework (independently audited by TxPipe and MLabs), Independent Oversight Board (Carmuega / TxPipe, Rosa / Aiken, Gianelloni / BlinkLabs), auto-abstain DRep delegation on escrow, no SPO delegation, single-board-member pause, contract-enforced failsafe sweep — identical to Amaru, Dingo, and the IO 9-proposal round of 2026-05-09. The $0.25 ADA/USD conversion rate is conservative versus the 0.35 used in the original April 10 submission, materially reducing ADA-denominated risk.

Binding operational expectations SIPO attaches to this YES

- M1.B HF readiness must produce CI-green Plutus V4 testnet snapshot evidence for all four maintained libraries within Q2 2026, published as tagged releases. Failure to ship this gate must pause M1.B until evidence is supplied; M1.A may continue independently.
- Pebble adoption indicators (≥20 developers, ≥3 tutorials, 100% documentation coverage) reported quarterly with primary evidence (npm downloads, GitHub stars, Discord counts, published tutorial URLs), not as a year-end claim.
- Aiken interoperability demonstrated through at least one concrete deliverable: shared Plutus blueprints, shared conformance tests, or a UPLC-CAPE category co-defined with the Aiken team.
- UPLC-CAPE participation extended to at least one new category beyond naive-recursion Fibonacci / Factorial by M2.
- Contingency drawdown publicly justified in each quarterly report and the public transaction journal; unused contingency swept back to the Cardano treasury via the SundaeLabs failsafe.
- Plutus V4 codegen (M2, Q3 2026) must enable end-to-end execution of a Pebble contract on a Plutus V4 preview / preprod node, with a committed log or tx link as acceptance evidence.
- Independent Oversight Committee reviews published in a stable, quarter-over-quarter comparable format covering milestone progress, KPI trends, delays with reasons, and the next quarter's critical path.
- Scope containment: any pivot outside Pebble language + the four named libraries should come back as a separate governance action with its own audit plan, not be absorbed into this ask.

Closing

This is a coherent and structurally improved resubmission. Every binding expectation SIPO attached to the original YES is addressed in the resubmitted text and milestone structure. The underlying public-good case — expanding Cardano's developer funnel through an imperative UPLC-targeted language and sustaining the TypeScript libraries the ecosystem already depends on — has not weakened. SIPO's YES is conditional on the expectations above being treated as binding operational commitments and verified by the Independent Oversight Committee before each disbursement.

For these reasons, SIPO DRep votes YES.

---

SIPO DRepとして、本提案「Pebble & Ecosystem maintenance: TypeScript core of Cardano」に賛成（YES）を投じます。

Governance Action ID: gov_action1ggr2uz7prwn5l84cdn2krwngfez0p7wluy4u3u3ez9pz5ls2whesqnsjly8
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-05-13

背景：本提案は、2026-04-10にSIPOが期待事項付きでYESを投じた当初HLabs 2026 BudgetのTypeScript / スマートコントラクト言語部分の再提出です。当初₳8.0Mの単一提案はDRep批准66.78%で67%閾値に僅差で届きませんでした。HLabsはコミュニティフィードバックを反映し、作業を2つの独立投票可能な提案に分割、合計請求額をUSD換算で約30%削減しました。SIPOは両再提出を精読し、それぞれに個別YESを投じます。

SIPOがYESと判断する理由

1. 2026-04-10投票時の5つの期待事項が構造的に対応されている。
- 月次ベロシティ透明性：Monthly Lightweight Updates、四半期詳細レポート、公開トランザクションジャーナルをHarmonicLabs/2026-treasury-proposal repoにコミット。SIPOがAmaru・Dingoに求めてきた標準と一致。
- Q2ハードフォーク（Plutus V4）ゲート：M1.Bが独立支払可能サブマイルストーン（₳210k）として分離。Acceptance Criterionは4ライブラリすべてについてPlutus V4テストネットスナップショットへのCIグリーン。M1.A（Pebble）とM1.B（HFメンテナンス）が独立して共同署名・支払可能で、HLabsにHF対応をPebbleとバンドル・遅延させるインセンティブなし。
- 過去デリバリー説明責任：2025 Retrospective（IPFS QmZVw...e9c）でEC-0014-25 Gerolamoが13項目中11項目完納、2項目進行中と記録。ADA/USDが約0.7から0.3以下に下落し実効ファンディングが半分以下になったにもかかわらず履行。
- Aiken補完関係：『Why Pebble and Aiken can coexist』セクションを明示、補完性テーブルで両者を異なる開発者プロファイル向けに位置づけ、Independent Oversight BoardにLucas Rosa氏（Aiken / Midnight）を配置。
- 25%コンティンジェンシー規律：15%へ削減（絶対値10ppダウン）、返還可能リザーブとして構造化、契約満了時の未使用分は契約レベル強制でCardanoトレジャリーへfailsafe sweep。

2. Pebbleは開発者ファネルを拡大するが分断はしない。Cardano Foundation調査ではTypeScript / JavaScriptがCardano開発者の最多使用言語。PebbleはTypeScript的、命令型優先、UPLCターゲットで、UPLC-CAPEベンチマークはAikenを上回るスクリプトサイズ縮小を示す。AikenはFP堪能組の選択肢を維持し、PebbleはEVM / Web2 onrampを開く。Cardano 2030 Pillar 2（A.3 Developer Experience — Education & migration）に直接対応。

3. ツーリングメンテナンスは負荷を担う公共財インフラ。cardano-ledger-ts、ouroboros-miniprotocols-ts、plutus-machine、uplc は Mesh、Lucid Evolution、Midgard、および多数のTypeScript dApp・ウォレットの直接または間接依存。ファンディングをスキップしてもコストは消えず、下流の数十チームに分散・吸収される。

4. ガバナンス・予算規律はSIPO承認標準と一致。SundaeLabs treasury-contractsフレームワーク（TxPipe + MLabs独立監査済み）、Independent Oversight Board（Carmuega / TxPipe、Rosa / Aiken、Gianelloni / BlinkLabs）、エスクローのAuto-abstain DRep委任、SPO委任不可、単一ボードメンバー一時停止可、契約強制failsafe sweep — Amaru・Dingo・IO 9提案ラウンド（2026-05-09）と同一。$0.25 ADA/USDレートは当初4月10日提出時の0.35に対して保守的で、ADA建てリスクを大幅に削減。

SIPOが本YESに付す拘束力ある運用上の期待事項

- M1.B HF対応：Q2 2026中に4ライブラリすべてについてPlutus V4テストネットスナップショットへのCIグリーン証跡をタグ付きリリースとして公開。本ゲート達成失敗時は証跡提供までM1.Bを一時停止すべきであり、M1.Aは独立して支払継続可。
- Pebble採用指標（≥20開発者、≥3チュートリアル、100%文書化）を四半期ごとに一次証跡（npm DL、GitHub star、Discordメンバー、公開チュートリアルURL）で報告。年末単一クレームは不可。
- Aiken相互運用性：共有Plutus blueprint、共有conformanceテスト、またはAikenチームと共同定義のUPLC-CAPEカテゴリのいずれかで具体デリバラブルを実証。
- UPLC-CAPE参加をM2までにnaive-recursion Fibonacci / Factorial以外の少なくとも1カテゴリへ拡張。
- コンティンジェンシー使用は各四半期レポートおよび公開トランザクションジャーナルで公開正当化、未使用分はSundaeLabs failsafeでCardanoトレジャリーへ返却。
- Plutus V4 codegen（M2、Q3 2026）はPlutus V4 preview / preprodノード上でのPebbleコントラクトのエンドツーエンド実行を実現、コミットログまたはtxリンクをAcceptance Evidenceとする。
- Independent Oversight Committeeレビューを、マイルストーン進捗・KPI推移・遅延理由・次四半期クリティカルパスを四半期間で比較可能な安定フォーマットで公開。
- スコープ封じ込め：Pebble言語+4ライブラリ外への方向転換は、独自の監査計画と予算をもつ別個のガバナンスアクションとして戻すこと。

結び

本提案は首尾一貫した構造的に改善された再提出。SIPOが当初YESに付した拘束力ある期待事項のすべてが、再提出されたテキストとマイルストーン構造で対応されている。基礎にある公共財ケース — 命令型UPLCターゲット言語を通じたCardano開発者ファネル拡大、およびエコシステムが既に依存しているTypeScriptライブラリの継続維持 — は弱まっていない。SIPOのYESは、上記期待事項が拘束力ある運用上のコミットメントとして扱われ、各支払前にIndependent Oversight Committeeによって検証されることを条件とする。

以上の理由により、SIPO DRepとして本提案に賛成（YES）を投じます。
