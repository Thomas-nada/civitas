<!-- url: ipfs://bafkreiaio6o7pfbhabkcsancry2ldydctff67jf2fd4moqg5pls4wboluu -->
# SIPO

**Proposal:** Update Plutus Cost Models
**Vote:** Yes
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes YES on Update Plutus Cost Models.

Governance Action ID: gov_action1eqhnsdyf3exhp5mqt7sdjtl7xy69wqg8tvg854psns2jt72cra3qqrcnr8r
Legacy Governance Action ID (CIP-105): c82f3834898e4d70d3605fa0d92ffe31345701075b107a54309c1525f9581f62#0
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-06-10

This parameter-change action, proposed by Intersect's Parameter Committee and confirmed by the Technical Steering Committee, updates the Plutus cost models across Plutus V1, V2, and V3. It does three things: it sets the cost-model parameters for the new Plutus primitives that become available after the van Rossem hard fork to Protocol Version 11 — including modular exponentiation (CIP-0109), multi-scalar multiplication over BLS12-381 (CIP-0133), dropList (CIP-0132), the Array builtin type (CIP-0138), and MaryEraValue (CIP-0153); it makes primitives previously limited to Plutus V3 available in V1 and V2; and it adjusts the settings of some existing primitives based on published benchmarking data, with those adjustments taking effect on enactment.

SIPO supports this action for four reasons. First, it follows the proper institutional route: recommendation by the Parameter Committee in publicly minuted meetings, confirmation by the Technical Steering Committee, and a fully published evidence trail — benchmarking workflows, measurement data, methodology documentation, and a parameter diff — that any DRep can verify. This is the standard process that has accompanied cost-model updates at previous protocol upgrades without incident. Second, it is the enabling switch for capabilities SIPO has consistently supported: without these settings, the post-quantum- and zero-knowledge-relevant primitives arriving with Protocol Version 11 — the foundations for ZK rollups, proof aggregation, and cryptographic verification on Cardano — would remain unusable even after the hard fork. This action is the technical substrate beneath research and platform work SIPO has voted to fund this cycle. Third, the risk profile is acceptable and well mitigated: the principal risk of a cost model — underpricing that lets scripts consume more resources than they pay for — is addressed by the published benchmarking process, while overpricing is correctable by a subsequent parameter update; the immediate repricing of existing primitives is routine, benchmark-driven recalibration of the kind performed at every recent upgrade. Fourth, the sequencing logic favours approval: enacting this action before the mainnet hard fork is harmless if the hard fork is delayed, while rejecting it would leave new primitives unusable when the hard fork arrives.

SIPO notes two expectations: that the Parameter Committee continues to publish benchmarking data and parameter diffs at this standard for future cost-model changes, and that post-enactment behaviour of the repriced primitives is monitored, with prompt corrective parameter actions if anomalies emerge. This action requests no treasury funds, raises no conflict of interest, and presents no recusal grounds for SIPO. This vote is SIPO DRep's recorded position.

---

SIPO DRep として、本提案「Update Plutus Cost Models」に賛成（YES）を投じます。

Governance Action ID: gov_action1eqhnsdyf3exhp5mqt7sdjtl7xy69wqg8tvg854psns2jt72cra3qqrcnr8r
Legacy Governance Action ID (CIP-105): c82f3834898e4d70d3605fa0d92ffe31345701075b107a54309c1525f9581f62#0
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-06-10

本パラメータ変更アクションは、Intersect の Parameter Committee が提案し Technical Steering Committee が確認したもので、Plutus V1・V2・V3 の cost model を更新します。内容は 3 つです。第一に、van Rossem ハードフォーク（Protocol Version 11）後に利用可能になる新しい Plutus プリミティブ — べき剰余（CIP-0109）、BLS12-381 上の multi-scalar multiplication（CIP-0133）、dropList（CIP-0132）、Array 組込型（CIP-0138）、MaryEraValue（CIP-0153）— の cost model パラメータを設定すること。第二に、これまで Plutus V3 に限定されていたプリミティブを V1・V2 でも利用可能にすること。第三に、公開されたベンチマークデータに基づき既存プリミティブの設定を調整することです（この調整は可決と同時に発効します）。

SIPO は 4 つの理由で本アクションを支持します。第一に、正規の制度ルートを踏んでいることです。公開議事録のある Parameter Committee の勧告、Technical Steering Committee の確認、そして誰でも検証できる完全公開のエビデンス — ベンチマークワークフロー・計測データ・手法文書・パラメータ diff — が揃っています。これは過去のプロトコルアップグレードでも事故なく実施されてきた標準プロセスです。第二に、本アクションは SIPO が一貫して支持してきた能力群の「有効化スイッチ」です。これらの設定がなければ、Protocol Version 11 とともに届くポスト量子・ゼロ知識関連のプリミティブ — Cardano 上の ZK rollup・証明集約・暗号検証の土台 — はハードフォーク後も使えないままです。本アクションは、SIPO が今期資金面で支持してきた研究・プラットフォーム群の下にある技術的基盤です。第三に、リスクプロファイルが許容範囲で、よく緩和されています。cost model の本質的リスク — スクリプトが課金以上のリソースを消費する過小課金 — は公開ベンチマークプロセスで対処され、過大課金は後続のパラメータ更新で修正可能です。既存プリミティブの即時再価格化は、直近のアップグレードごとに行われてきたベンチマーク準拠の定常的な再調整です。第四に、順序の論理が承認を支持します。メインネットのハードフォークより先に本アクションが発効しても、ハードフォークが遅延すれば無害である一方、否決すればハードフォーク到来時に新プリミティブが使えなくなります。

SIPO は 2 つの期待事項を記します。Parameter Committee が今後の cost model 変更でも本件と同水準のベンチマークデータとパラメータ diff の公開を継続すること、そして再価格化された既存プリミティブの発効後の挙動を監視し、異常があれば速やかに修正のパラメータアクションを講じることです。本アクションは Treasury 資金を要求せず、利益相反はなく、SIPO に recusal 事由もありません。本投票は SIPO DRep の記録上の立場表明です。
