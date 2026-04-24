<!-- url: ipfs://bafkreibmgrc7f7zn7who2m7uz5eor3s7nf6zb4oiecc52xrqeju2gun5da -->
# SIPO

**Proposal:** Pebble + Gerolamo - HLabs 2026 Budget
**Vote:** Yes
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes YES on Pebble + Gerolamo - HLabs 2026 Budget.

SIPO supports this proposal as a coherent extension of its node-diversity doctrine and as a targeted public-good investment in Cardano's TypeScript layer. Having voted YES on Amaru (Rust) and Dingo (Go) on the basis that multi-client architecture is infrastructure insurance, SIPO now votes YES on HLabs — not because this funds a fourth block-producing implementation, but because it addresses three complementary needs that neither Amaru nor Dingo cover: (1) a browser-native light node that lets dApps and wallets escape centralized indexer dependency, (2) an imperative smart-contract language that opens Cardano to the 17M+ TypeScript/JavaScript developer pool, and (3) sustained maintenance of foundational TypeScript tooling that a significant portion of Cardano's developer ecosystem already depends on.

Why SIPO votes YES

1. Gerolamo is complementary, not redundant, to Amaru and Dingo. It is explicitly designed as a TypeScript light node for browsers, dApps, and wallets — not a block-producing node. This is structurally missing from Cardano today. Most dApps currently rely on centralized indexers or third-party APIs, reintroducing the trust assumptions decentralization is meant to eliminate. A production-ready browser node lets dApps verify UTxO states without external services, and lets light wallets offer Daedalus-level verification with light-wallet UX. SPOs can deploy Gerolamo as a relay alongside Haskell, adding codebase diversity at the relay layer. This is a different category of value from Amaru/Dingo's block-producing ambitions.

2. Pebble expands the developer funnel without fragmenting it. Aiken materially improved the Cardano smart-contract experience for developers with FP familiarity, and SIPO considers Aiken a central success. Pebble targets a different profile: engineers fluent in TypeScript/JavaScript/Solidity-style imperative syntax — the largest developer community in the world. The choice is not Aiken vs Pebble; it is Cardano having multiple legitimate on-ramps, all compiling to optimized UPLC. This directly supports Cardano 2030 Pillar 2 (A.3 Developer Experience — Education & migration).

3. Hard-fork tooling maintenance is non-optional public-good infrastructure. cardano-ledger-ts, ouroboros-miniprotocols-ts, plutus-machine, and uplc are load-bearing for a substantial share of Cardano's TypeScript ecosystem. When a hard fork changes protocol parameters, these libraries must be updated promptly, or downstream projects face breaking changes or silent correctness bugs. Funding 1.5 FTE for sustained maintenance is one of the highest-leverage line items in this proposal.

4. Governance structure matches the standard SIPO has already endorsed. Funds are held in SundaeLabs treasury-contracts — the same audited escrow Amaru and Dingo use, audited by TxPipe and MLabs. The independent oversight board (Santiago Carmuega/TxPipe, Lucas Rosa/Aiken-Midnight, Chris Gianelloni/BlinkLabs-Dingo) has no stake in HLabs and direct technical credibility in Cardano infrastructure. Auto-abstain DRep delegation, no SPO delegation, failsafe sweep at contract expiration. Same standard SIPO has already approved twice.

5. Cardano 2030 alignment is concrete, not rhetorical. Maps directly to two formal 2030 KPIs (alternative full-node clients, monthly uptime via hard-fork maintenance) and Pillar 2 A.3. Measurable adoption indicators committed: Gerolamo (≥10 SPOs as relay, ≥3 browser-based wallet/dApp integrations in 12 months); Pebble (≥20 developers onboarded, 100% documentation, ≥3 e2e tutorials).

Expectations (YES with clear conditions)

SIPO's YES is conditional on delivery and treasury usage remaining strictly accountable:

- Monthly velocity transparency across Gerolamo, Pebble, and tooling-maintenance repositories
- Q2 hard-fork readiness as the first hard gate: all HLabs-maintained TypeScript libraries updated for the upcoming intra-era hard fork
- Gerolamo production-readiness criteria met with reproducible evidence (sync from genesis to tip on mainnet, initial sync ≤48h on commodity hardware, stable connections with ≥15 peers for ≥24h, block propagation within 2x of Haskell baseline, rollback recovery up to k=2160)
- Pebble adoption indicators reported with evidence (npm downloads, GitHub stars, Discord members, published tutorial URLs), not self-assessed claims
- Complementarity with Aiken maintained in practice: no adversarial tone or marketing, active interoperability collaboration where reasonable
- 25% contingency buffer as risk policy, not discretionary expansion: transparent accounting for any drawdown, unused funds swept to treasury at contract expiration
- Scope containment on Gerolamo block production: any future pivot must come as a separate governance action with its own audit plan and budget
- Quarterly reporting in a stable format with KPI continuity, comparable across quarters — same discipline SIPO asked of Amaru and Dingo
- Past delivery accountability: public closeout of past Catalyst-funded work alongside quarterly reporting

SIPO views this proposal as a logical extension of its node-diversity and public-good infrastructure doctrine. Gerolamo addresses a structural gap in Cardano's dApp and wallet architecture that neither Haskell Node, Amaru, nor Dingo is positioned to fill. Pebble opens an additional on-ramp complementing rather than replacing Aiken. Hard-fork tooling maintenance protects a layer already heavily used. SIPO's YES is not a vote of confidence in HLabs abstracted from deliverables — it is a vote that this specific scope, at this specific budget level, under this specific governance structure, is worth funding, subject to the expectations above being treated as binding operational commitments.

---

SIPO DRepとして、本提案「Pebble + Gerolamo - HLabs 2026 Budget」に賛成（YES）を投じます。

SIPOは本提案を、既に支持してきたノード多様性ドクトリンの自然な延長、およびCardano TypeScript層への公共財投資として支持します。Amaru（Rust）とDingo（Go）にYESを投じた論理の延長でHLabs提案にもYESを投じますが、これは「4つ目のブロック生成ノード」を資金提供するからではありません。AmaruもDingoもカバーしていない3つの相補的領域に投資するものだからです：(1) dApp/ウォレットが中央集権インデクサ依存から脱却できるブラウザネイティブ軽量ノード、(2) 1700万人超のTS/JS開発者プールをCardanoに開く命令型スマコン言語、(3) 既に大量に使われているCardano TypeScript基盤ライブラリ群の継続メンテナンス。

SIPOがYESと判断する理由

1. GerolamoはAmaru・Dingoと競合ではなく補完関係。明示的にブラウザ・dApp・ウォレット向けTypeScript軽量ノードとして設計され、ブロック生成ノードではありません。現状の大半のdAppは中央集権インデクサに依存し、分散化が排除すべきはずの信頼前提を再導入しています。プロダクション品質のブラウザノードがあれば、dAppは外部サービスに依存せずUTxO検証を行え、ライトウォレットは軽量UXのままDaedalus級の検証性を提供できます。SPOは既存Haskell構成と並列にリレーとして展開でき、リレー層のコードベース多様性にも寄与します。Amaru/Dingoのブロック生成志向とは異なるカテゴリの価値です。

2. Pebbleは開発者ファネルを拡大するが分断しない。AikenはRust/関数型慣れした開発者にとっての障壁を大きく下げた中心的成功事例です。Pebbleは異なる層、すなわちTS/JS/Solidity系の命令型構文に慣れたエンジニア（世界最大の開発者コミュニティ）を狙います。Aiken対Pebbleではなく、異なるバックグラウンドを持つ開発者への複数の正統な入口を持つことが本質です。両者とも最適化されたUPLCへコンパイルされます。Cardano 2030 Pillar 2（A.3 Developer Experience — Education & migration）と直接整合します。

3. ハードフォーク維持は選択可能ではない公共財。cardano-ledger-ts、ouroboros-miniprotocols-ts、plutus-machine、uplc は、Cardano TypeScript開発者エコシステムの相当部分にとって基盤となるライブラリ群です。ハードフォーク時に速やかに更新されなければ、下流プロジェクトはビルド破壊や静かな正しさのバグに直面します。1.5 FTEでこのリスクを回避できることは、本提案中最も高レバレッジな投資の一つです。

4. ガバナンス構造はSIPOが既に承認した標準と一致。資金はSundaeLabs treasury-contracts（Amaru/Dingoと同じ監査済みエスクロー、TxPipe/MLabs監査）に保持されます。独立監視ボード（Santiago Carmuega/TxPipe、Lucas Rosa/Aiken-Midnight、Chris Gianelloni/BlinkLabs-Dingo）はHLabsに持分を持たず、Cardanoインフラへの直接的な技術的信頼性があります。Auto-abstain DRep委任、SPO委任禁止、契約満了時failsafe sweep。SIPOが既に二度承認した標準と同一です。

5. Cardano 2030との整合は具体的。形式化された2つの2030 KPI（代替フルノードクライアント、ハードフォークメンテナンス経由の月次稼働率）およびPillar 2 A.3に直接マッピング。Gerolamo採用目標（12ヶ月で10以上のSPOリレー、3以上のブラウザ統合）とPebble目標（20以上の開発者、100%文書化、3以上のチュートリアル）が公開指標として提示されており、HLabs自己報告とは独立した評価基準が存在します。

SIPOの期待事項（YESには明確な条件が伴う）

SIPOのYESはデリバリーとTreasury運用が厳格に説明責任を伴うことを前提とし、以下を明示的な運用コミットメントとして期待します：

- 月次ベロシティの公開（Gerolamo・Pebble・ツーリング全リポジトリ）
- Q2ハードフォーク対応を最初のハードゲートとして。HLabs維持全TSライブラリがintra-era HFに対応
- Gerolamoプロダクションレディネス5基準の達成（mainnet同期、初期同期48h以内、15ピア24h、Haskellの2倍以内レイテンシ、k=2160ロールバック復旧）を再現可能な証跡とともに
- Pebble採用指標を証跡ベース（npmダウンロード、GitHubスター、Discord、公開URL）で四半期報告
- Aikenとの補完関係を実務で維持。対立的トーンを避け、相互運用性に協力
- 25%コンティンジェンシーはリスクポリシーであり裁量拡張予算ではない。使用時は透明会計、未使用分はfailsafe sweepでTreasury返却
- Gerolamoブロック生成へのスコープ封じ込め。将来のブロック生成は別個のガバナンスアクションとして提出
- 四半期報告の安定フォーマットとKPI連続性。Amaru・Dingoに求めたのと同じ規律
- 過去Catalyst資金案件の公開総括を本提案四半期報告と並行して実施

SIPOは本提案をノード多様性と公共財インフラに関するドクトリンの論理的延長として評価します。Gerolamoは、Haskell Node・Amaru・Dingoのいずれも埋められないdApp/ウォレットアーキテクチャの構造的ギャップに対応します。Pebbleは世界最大の開発者コミュニティに向けた追加入口を開き、Aikenを置き換えるのではなく補完します。ハードフォーク維持は既に大量に使われているエコシステム層を保護します。SIPOのYESは、HLabsという組織への抽象的信認票ではなく、本特定スコープ・特定予算・特定ガバナンス構造での資金提供の価値を認める判断票です。ただし上記期待事項が拘束力のある運用コミットメントとして扱われることを条件とします。

以上の理由により、SIPO DRepとして本提案に賛成（YES）を投じます。
