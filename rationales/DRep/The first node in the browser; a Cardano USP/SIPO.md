<!-- url: ipfs://bafkreidh56cqlnhdvowsw6dvw4xgktittbheoqvfqdjyb4aq6vxarno6cu -->
# SIPO

**Proposal:** The first node in the browser; a Cardano USP
**Vote:** Yes
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes YES on The first node in the browser; a Cardano USP (Gerolamo).

Governance Action ID: gov_action1guz68e8zkwphcdc8wnp40cclkv92qgnel7xnffmsmp2ljp09qtwqq596k4c
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-05-13

Context: This is the resubmission of the browser-light-node half of HLabs's original 2026 Budget, on which SIPO voted YES (with binding expectations) on 2026-04-10. The original ₳8.0M single proposal narrowly missed DRep ratification at 66.78%. HLabs split the work into two independently-votable proposals and reduced the combined ask by approximately 30% in USD terms. The Gerolamo half is now materially strengthened by the published EC-0014-25 retrospective, which did not exist at the time of the original April 10 vote.

Why SIPO votes YES

1. Gerolamo is a Cardano-only structural USP. eUTxO state stays local to the transaction, block sizes are bounded, Praos is verifiable on light resources, and Plutus scripts are pure functions over a deterministic CEK machine — together making Cardano the only major chain where a fully-validating in-browser node is technically realistic. Ethereum, Solana, and account-based chains would have to cripple validation (revert to SPV / trusted-RPC) or redesign their base layer. Gerolamo is the artifact that turns this latent advantage into a shipped product.

2. Gerolamo extends SIPO's node-diversity doctrine to a fourth axis. SIPO voted YES on Amaru (Rust) and Dingo (Go) on Haskell single-implementation-risk grounds (Ethereum Prysm 2026-03 is the canonical reference). Gerolamo adds TypeScript / WebAssembly — but explicitly as a complementary light-node implementation for dApps and wallets, not a block producer. The proposal scopes block production and server-side relay roles as out-of-scope and notes that adding them would require an additional ~$500k audit plus at least one additional FTE. This is the strongest possible structural answer to a node-diversity concern.

3. Documented prior-funding track record (material change from April 10). HLabs's first treasury-funded work EC-0014-25 Gerolamo (₳578,571) is now retrospectively documented at IPFS QmZVw...e9c: 11 of 13 planned items fully shipped, 2 in progress. The project was effectively underfunded by more than half in USD terms (ADA/USD 0.7 → under 0.3) — HLabs still delivered. Browser compatibility was scoped as in-progress under EC-0014-25; that is precisely the scope of this resubmission.

4. Five SIPO expectations from 2026-04-10 are addressed.
- Monthly velocity transparency: same standard as Pebble (Monthly Lightweight Updates, Quarterly Reports, Public Transaction Journal).
- HF readiness in light-node context: M1 (Q2 2026) delivers browser storage layer (IndexedDB), networking layer (Ouroboros mini-protocols over Web Workers / WebSockets), and a public preprod sync from a browser context. HF coherence by M2 is added as a binding expectation below.
- Past Catalyst accountability: covered by the EC-0014-25 retrospective above.
- Contingency 25% → 15%, refundable, contract-enforced failsafe sweep.
- Production-readiness criteria committed (≥15 peers / ≥24 hours stable peer-set at M4, sync across ≥3 separate browser sessions, verification on at least one non-Chromium engine with screencast).

5. Governance and budget discipline identical to SIPO's approved standard. SundaeLabs treasury-contracts (TxPipe + MLabs audited), Independent Oversight Board (Carmuega / TxPipe, Rosa / Aiken, Gianelloni / BlinkLabs), auto-abstain DRep delegation on escrow, no SPO delegation, single-board-member pause, failsafe sweep. $0.25 ADA/USD conservative versus the original 0.35.

Binding operational expectations SIPO attaches to this YES

- Hard-fork coherence for the browser light node demonstrated by M2 (Q3 2026): Gerolamo must sync a public Plutus V4 testnet to tip from a browser context, run logged and committed. Failure to demonstrate this should pause M2 disbursement until evidence is supplied.
- Production-readiness criteria met with reproducible, third-party-verifiable evidence: ≥24-hour stable peer-set with ≥15 peers, sync across ≥3 separate browser sessions, verification on a non-Chromium engine with screencast committed to the repo, integration / API documentation published.
- Scope containment binding: any pivot toward block production, server-side relay roles, or full-node use cases returns as a separate governance action with its own audit plan, not be absorbed into this ask.
- Adoption indicator reported with named integrations: the ≥3 wallet / dApp integrations should be reported quarterly with project names, integration commit / release links, and consenting projects' confirmation. Anonymous counts are not sufficient.
- Mithril integration reaches a documented completion state during this funding period (tagged release demonstrating Mithril-anchored bootstrap from a browser context, plus a public benchmark on initial-sync time savings). This is the natural completion of work begun under EC-0014-25.
- Trustless bridge primitives spillover documented at the M4 hand-off: which verification primitives developed for Gerolamo (succinct certificates, cheap header validation, embeddable verifiers, partial state proofs) are reusable for trustless bridges, L2 verifiers, and dApp-side verification.
- Contingency drawdown publicly justified in quarterly reports and the public transaction journal; unused contingency swept back to the Cardano treasury via the SundaeLabs failsafe.
- Independent Oversight Committee reviews published in a stable, quarter-over-quarter comparable format covering milestone progress, KPI trends, delays with reasons, and the next quarter's critical path.

Closing

This resubmission is a coherent and structurally improved version of the browser-light-node half of the original ask, materially strengthened by the EC-0014-25 retrospective. The underlying public-good case — turning Cardano's eUTxO-native architectural property into a shippable, fully-validating browser node that dApps and wallets can rely on without trusted backends, while producing verification primitives that compound across the bridges and L2 roadmap — has not weakened. The fourth axis of node diversity (Haskell / Rust / Go / TypeScript-WASM) extends a doctrine SIPO has already endorsed twice. SIPO's YES is conditional on the expectations above being treated as binding operational commitments and verified by the Independent Oversight Committee before each disbursement.

For these reasons, SIPO DRep votes YES.

---

SIPO DRepとして、本提案「The first node in the browser; a Cardano USP (Gerolamo)」に賛成（YES）を投じます。

Governance Action ID: gov_action1guz68e8zkwphcdc8wnp40cclkv92qgnel7xnffmsmp2ljp09qtwqq596k4c
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-05-13

背景：本提案は、2026-04-10にSIPOが期待事項付きでYESを投じた当初HLabs 2026 Budgetのブラウザ軽量ノード部分の再提出です。当初₳8.0Mの単一提案はDRep批准66.78%で67%閾値に僅差で届きませんでした。HLabsはコミュニティフィードバックを反映し、2つの独立投票可能な提案に分割、合計請求額をUSD換算で約30%削減しました。Gerolamo側は加えて、当初4月10日投票時には存在していなかったEC-0014-25回顧録の公開により実質的に強化されています。

SIPOがYESと判断する理由

1. GerolamoはCardano固有の構造的USP。eUTxOステートはトランザクションにローカル、ブロックサイズは限定的、Praosは軽量リソースで検証可能、PlutusスクリプトはCEKマシン上の純粋関数 — これらにより、Cardanoは完全検証ブラウザノードが技術的に現実的な唯一の主要チェーン。Ethereum・Solana・アカウントベースチェーンは検証を骨抜き（SPV / trusted-RPCに退化）にするかベースレイヤーを再設計するしかない。Gerolamoはこの潜在的優位性を出荷可能なプロダクトに変換するアーティファクト。

2. GerolamoはSIPOのノード多様性ドクトリンを第4軸へ拡張。SIPOはAmaru（Rust）とDingo（Go）にHaskell単一実装リスク（2026-03 Ethereum Prysmインシデントが典型）の論理でYES投票。GerolamoはTypeScript / WebAssemblyを追加するが、明示的にdApp / ウォレット用補完軽量ノードとして、ブロックプロデューサーではなくスコープ。提案はブロック生成・サーバーサイドリレー役割を本スコープから明示的に除外し、追加には約$500k監査と少なくとも追加1 FTEが必要と注記。これはノード多様性懸念に対する最強の構造的回答。

3. 文書化された過去ファンディング・トラックレコード（4月10日投票からの実質的変化）。HLabsの初トレジャリーファンディング作業EC-0014-25 Gerolamo（₳578,571）の回顧録（IPFS QmZVw...e9c）：計画13項目中11項目完納、2項目進行中。ADA/USDが0.7から0.3以下に下落し実効ファンディングが半分以下になったにもかかわらず履行。Browser compatibilityはEC-0014-25下で進行中スコープされており、これが本再提出のスコープそのもの。

4. 2026-04-10投票時の5期待事項が対応：
- 月次ベロシティ透明性：Pebbleと同標準（Monthly Lightweight Updates、四半期レポート、公開トランザクションジャーナル）。
- 軽量ノード文脈でのHF対応：M1（Q2 2026）でブラウザストレージ層（IndexedDB）、ネットワーキング層（Ouroboros mini-protocols over Web Workers / WebSockets）、ブラウザコンテキストからのpreprod sync配送。M2までのHF整合性は下記の拘束力ある期待事項として追加。
- 過去Catalyst説明責任：上記EC-0014-25回顧録でカバー。
- コンティンジェンシー25%→15%、返還可能、契約強制failsafe sweep。
- プロダクションレディネス基準コミット（M4時点で≥15ピア・≥24時間安定peer-set、≥3別個ブラウザセッションでの同期、screencast付き非Chromiumエンジン検証）。

5. ガバナンス・予算規律はSIPO承認標準と一致。SundaeLabs treasury-contracts（TxPipe + MLabs監査済み）、Independent Oversight Board（Carmuega / TxPipe、Rosa / Aiken、Gianelloni / BlinkLabs）、エスクローAuto-abstain DRep委任、SPO委任不可、単一ボードメンバー一時停止可、failsafe sweep。$0.25 ADA/USDは当初0.35に対して保守的。

SIPOが本YESに付す拘束力ある運用上の期待事項

- ブラウザ軽量ノードのHF整合性をM2（Q3 2026）までに実証：Gerolamoはブラウザコンテキストから公開Plutus V4テストネットをtipまで同期、runをログ記録・コミット。本実証失敗時は証跡提供までM2支払を一時停止。
- プロダクションレディネス基準は再現可能・第三者検証可能な証跡で達成：≥15ピアとの≥24時間安定peer-set、≥3別個ブラウザセッションでのtipまでの同期、非Chromiumエンジンでの検証＋screencastリポジトリコミット、integration / APIドキュメント公開。
- スコープ封じ込めは拘束力：ブロック生成・サーバーサイドリレー・フルノード用途への方向転換は独自監査計画をもつ別個ガバナンスアクションとして戻すこと。
- 採用指標は名前付き統合で報告：≥3 wallet / dApp統合をプロジェクト名、統合コミット / リリースリンク、統合プロジェクト側からの同意確認とともに四半期ごとに報告。匿名カウント不可。
- Mithril統合は本期間中に文書化された完了状態（ブラウザコンテキストからのMithrilアンカーbootstrapを実証するタグ付きリリース＋初期同期時間削減の公開ベンチマーク）。EC-0014-25下で開始された作業の自然な完了。
- Trustless Bridgeプリミティブ波及をM4 hand-offで文書化：Gerolamo向け検証プリミティブ（succinct certificates、cheap header validation、embeddable verifiers、partial state proofs）のうちbridge、L2 verifier、dApp側検証に再利用可能なものを明示。
- コンティンジェンシー使用は四半期レポートおよびトランザクションジャーナルで公開正当化、未使用分はSundaeLabs failsafeでCardanoトレジャリーへ返却。
- Independent Oversight Committeeレビューを、マイルストーン進捗・KPI推移・遅延理由・次四半期クリティカルパスを四半期間で比較可能な安定フォーマットで公開。

結び

本再提出は、当初askのブラウザ軽量ノード部分の首尾一貫した構造的改善版であり、EC-0014-25回顧録により強化されている。公共財ケース — CardanoのeUTxO特性を、信頼バックエンドなしの出荷可能な完全検証ブラウザノードに変換し、bridge・L2ロードマップに複合する検証プリミティブを生み出すこと — は弱まっていない。ノード多様性の第4軸（Haskell / Rust / Go / TypeScript-WASM）はSIPO既承認ドクトリンを拡張する。SIPOのYESは、上記期待事項が拘束力ある運用上のコミットメントとして扱われ、各支払前にIndependent Oversight Committeeによって検証されることを条件とする。

以上の理由により、SIPO DRepとして本提案に賛成（YES）を投じます。
