<!-- url: ipfs://bafkreiahx3jprc45ouy7ushvdapd3zv42iq3rxnvev3eddr2m2swfinhu4 -->
# SIPO

**Proposal:** Dingo a Production-Grade Block Producer in Go by Blink Labs
**Vote:** Yes
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes YES on Dingo: a Production-Grade Block Producer in Go by Blink Labs.

SIPO supports this proposal as a strategically important investment in Cardano's node diversity and long-term network resilience. Having already voted YES on Amaru (Rust implementation), SIPO's support for Dingo (Go implementation) follows the same principled logic: a multi-client architecture with three independent implementations — Haskell, Rust, and Go — is the proven model for critical blockchain infrastructure.

Why SIPO votes YES

1. Node diversity requires more than two implementations
SIPO voted YES on Amaru because node diversity is essential for network resilience. That reasoning applies equally to Dingo. Ethereum's multi-client architecture has repeatedly saved the network from catastrophic failures — most recently in March 2026, when a Prysm bug after the Fusaka upgrade caused a 25% drop in validator participation, coming within 9% of finality loss. The network survived because other clients continued operating. Cardano currently depends on a single Haskell implementation for block production. Haskell + Rust + Go provides the kind of defense-in-depth that Ethereum's experience proves necessary.

2. Go is the industry standard for blockchain nodes
Go powers Geth (Ethereum), btcd (Bitcoin), CometBFT (50+ Cosmos chains), AvalancheGo, Algorand, and Filecoin. With over 5 million active developers and a 7th-place TIOBE ranking, Go opens Cardano's node internals to a massive developer pool. This is not about replacing Haskell — it is about making Cardano accessible to the developers who build the world's networked systems.

3. Demonstrated engineering velocity
Blink Labs has merged 1,290+ non-dependency PRs in the past twelve months, with 593 in the last quarter alone — accelerating. With 2-3 engineers, that is approximately 36 PRs per person per month. Dingo passes 314/314 Amaru conformance tests and achieves 100% Plutus V1/V2/V3 conformance. These are objectively verifiable metrics, not promises.

4. Leios co-implementation strengthens the specification
Dingo's plan to implement CIP-0164 Linear Leios alongside IO Engineering is strategically valuable beyond node diversity. When two teams implement the same protocol in two different languages, ambiguities in the specification surface faster. Go's concurrency model (goroutines and channels) is well-suited for the pipeline concurrency Leios requires.

5. Cost efficiency and honest pricing
At 6,900,000 ADA ($2,070,000 at $0.30/ADA), this proposal is approximately 32% less than Amaru's 10,142,000 ADA request. The $250,000 per FTE is market-rate. Other treasury-funded implementations priced at $0.50/ADA — at which rate this proposal would be only 4,140,000 ADA.

6. Sound governance structure
Funds are held in the audited SundaeSwap treasury smart contracts with an independent oversight board (Pi Lanningham / SundaeSwap, Santiago Carmuega / TxPipe, Lucas Rosa / Aiken-Midnight). Auto-abstain DRep delegation, no SPO delegation, failsafe sweep at contract expiration. Monthly updates, quarterly detailed reports, and a public transaction journal.

Expectations

- Q2 testnet block production as a hard gate: Clear, publicly documented gating criteria with reproducible evidence.
- Team scaling execution: Early reporting on recruitment of 3 Go developers to reach 4 FTE capacity.
- Differentiation from Amaru: Both teams should articulate distinct value propositions and share infrastructure where possible.
- Mainnet storage validation: Transparent reporting on Q3 storage scalability testing at ~100M UTxOs / ~500 GB.
- Post-funding sustainability: A clear maintenance plan after the 12-month treasury funding concludes.
- Security audit transparency: Full publication of findings and remediation of all critical issues before any mainnet recommendation.
- Contingency discipline: The 15% contingency must remain a risk buffer with transparent accounting.

Node diversity is not a luxury — it is infrastructure insurance. Combined with Amaru, the total node diversity investment of approximately 17M ADA represents less than 5% of the NCL — a proportionate allocation for one of Cardano's most important long-term resilience strategies.

For these reasons, SIPO DRep votes YES.



SIPODRepとして、本提案「Dingo: a Production-Grade Block Producer in Go by Blink Labs」に賛成（YES）を投じます。

SIPOは本提案を、Cardanoのノード多様性と長期的なネットワーク強靭性に対する戦略的投資として支持します。すでにAmaru（Rust実装）にYESを投じたSIPOが、Dingo（Go実装）を支持するのは同じ原則的論理の延長です：Haskell・Rust・Goの3つの独立した実装によるマルチクライアント体制こそ、重要なブロックチェーンインフラで実証されたモデルです。

SIPOがYESと判断する理由

1. ノード多様性には2実装では足りない
SIPOはネットワーク強靭性にノード多様性が不可欠という理由でAmaruにYESを投じました。同じ論理はDingoにも等しく適用されます。Ethereumのマルチクライアント体制は、壊滅的な障害からネットワークを繰り返し救ってきました。直近では2026年3月、Fusakaアップグレード後のPrysmバグによりバリデータ参加率が25%低下し、ファイナリティ喪失まで残り9%という危険水域に達しました。他のクライアントが稼働を継続したためネットワークは存続しました。Cardanoは現在ブロック生成においてHaskell単一実装に依存しています。Haskell + Rust + Goの組み合わせこそ、Ethereumの経験が必要性を証明した多層防御を実現します。

2. Goはブロックチェーンノードの業界標準言語
GoはGeth（Ethereum）、btcd（Bitcoin）、CometBFT（50以上のCosmosチェーン）、AvalancheGo、Algorand、Filecoinを動かしています。500万人以上のアクティブ開発者とTIOBE指数7位というポジションにより、GoはCardanoのノード内部を膨大な開発者プールに開放します。これはHaskellの置き換えではなく、世界のネットワークシステムを構築している開発者へのアクセシビリティの拡大です。

3. 実証された開発ベロシティ
Blink Labsは過去12ヶ月で1,290以上の非依存PRをマージし、直近四半期だけで593件と加速しています。2-3名のエンジニアで月約36 PR/人のペースです。Dingoは314/314のAmaruコンフォーマンステストに合格し、Plutus V1/V2/V3の100%準拠を達成しています。これらは約束ではなく、客観的に検証可能な指標です。

4. Leios並行実装が仕様品質を高める
DingoがIO EngineeringとともにCIP-0164 Linear Leiosを並行実装する計画は、ノード多様性を超えた戦略的価値があります。2つのチームが同じプロトコルを2つの異なる言語で実装すると、仕様の曖昧さがより早く浮上します。Goの並行処理モデル（goroutineとchannel）はLeiosが必要とするパイプライン並行処理に適しています。

5. コスト効率と誠実な価格設定
6,900,000 ADA（$0.30/ADAで$2,070,000）は、Amaruの10,142,000 ADA申請と比較して約32%低額です。FTE単価$250,000は市場水準です。他のトレジャリー資金実装が$0.50/ADAで価格設定した中、同水準なら4,140,000 ADAに相当します。

6. 健全なガバナンス構造
資金は監査済みSundaeSwapトレジャリーSmart Contractに保持され、独立Oversight Board（Pi Lanningham / SundaeSwap、Santiago Carmuega / TxPipe、Lucas Rosa / Aiken-Midnight）が監督します。Auto-abstain DRep委任、SPO委任なし、契約満了時の自動sweepが契約レベルで強制されます。

期待事項

- Q2テストネットブロック生成をハードゲートとして：明確で公開されたゲート条件と再現可能な証跡を期待します。
- チームスケーリングの実行：4 FTE体制に向けた3名のGo開発者採用進捗の早期報告を求めます。
- Amaruとの差別化：両チームがそれぞれの独自価値を明示し、可能であればインフラを共有することを期待します。
- メインネットストレージの検証：Q3における約1億UTxO/約500GBでのストレージスケーラビリティテストの透明な報告を求めます。
- 資金終了後の持続可能性：12ヶ月のTreasury資金終了後の明確なメンテナンス計画を求めます。
- セキュリティ監査の透明性：結果の完全公開とメインネット推奨前の全重大問題の是正を期待します。
- コンティンジェンシーの規律：15%のコンティンジェンシーはリスクバッファであり、透明な会計を維持すべきです。

ノード多様性は贅沢品ではなくインフラ保険です。Amaruと合わせたノード多様性への総投資額約17M ADAはNCLの5%未満であり、Cardanoの最も重要な長期的強靭性戦略の一つとして適切な配分です。

以上の理由により、SIPO DRepとして本提案に賛成（YES）を投じます。
