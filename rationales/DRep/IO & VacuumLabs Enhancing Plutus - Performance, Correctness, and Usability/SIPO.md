<!-- url: ipfs://bafkreignoujhf2bknuayv7zp2n7vdav4eodzx2z56zkqvgmpvhyivyynvu -->
# SIPO

**Proposal:** IO & VacuumLabs Enhancing Plutus - Performance, Correctness, and Usability
**Vote:** Yes
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes YES on IO & VacuumLabs: Enhancing Plutus — Performance, Correctness, and Usability.

Governance Action ID: gov_action1w0shrfxqwv95kk0v4cn34wylz25a2cmqkq5jpc0e2yrahhqava3qvczhx6t
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-05-09

SIPO supports this proposal as a coherent investment in the foundation that every Cardano smart contract depends on. Plutus is the compilation target of Aiken, Pebble, Scalus, Futura, and Plinth — its quality and capabilities directly determine what developers can build, how cheap their contracts execute, and how confident the ecosystem can be in correctness as alt-clients and DApps proliferate. Three workstreams advance Plutus across performance (UPLC capabilities and primitives), correctness (formal specification, conformance, security audit), and usability (compiler architecture, dependency simplification). The co-venture with VacuumLabs distributes Plutus stewardship across organizations rather than concentrating it in IO.

Why SIPO votes YES

1. Plutus improvements compound across every smart-contract language and DApp on Cardano. Built-in casing on Data, multiIndexArray (CIP-156, already ratified), additional BuiltinValue functions (CIP-168), and scope-check investigation directly reduce execution costs for every Cardano DApp regardless of source language, since all compile to UPLC. Cheaper on-chain execution improves capital efficiency for DeFi, opens up application designs that are currently uneconomical, and translates directly into competitive parity with execution layers that today win on cost.

2. Property-based conformance testing is structural infrastructure for the node-diversity doctrine. The current Plutus conformance suite has 1,982 hand-written test cases. Property-based conformance extends this by generating test cases from formal specifications, giving alternative Plutus evaluator implementations far higher confidence that they agree with the canonical implementation across the entire program space. SIPO has voted YES on Amaru and Dingo on the basis that alternative full-node implementations are essential infrastructure insurance — those alt-clients require this property-based conformance framework to evolve safely as Plutus evolves.

3. Continuous security auditing of the Plutus evaluator is non-discretionary at Cardano's scale. As DeFi and high-value DApps deploy on Cardano, the cost of any evaluator or costing bug grows in proportion to TVL. Investing in structured manual review of the evaluator and costing code, plus formalization of programmatic built-in types and functions in the Plutus metatheory, prevents incidents that would otherwise be expensive both financially and in trust. Catching a subtle costing bug before deployment is orders of magnitude cheaper than responding to one in production.

4. VacuumLabs co-venture distributes Plutus stewardship beyond IO. Plutus has historically been near-exclusively maintained by IO. The VacuumLabs co-venture brings a specialist team with deep expertise in formal methods, security-critical Haskell development, and Cardano infrastructure to share maintenance responsibility. This is the same Pillar 5 stewardship-distribution pattern SIPO supported in HLabs Pebble + Gerolamo, IO Cardano Upgrades co-venture with Ensurable, IO Cardano Maintenance co-venture with Ensurable, and Cardano High Assurance with seven organizations. Plutus becoming maintained by a multi-org consortium is a structural improvement to ecosystem resilience.

5. Workstream 3 developer experience improvements are immediately actionable. Eliminating the GHC plugin requirement, multi-version GHC support, removing native C library dependencies (blst, secp256k1) from Plinth, and clearer source-level error messages reduce setup friction without requiring a hard fork. These ship and benefit developers immediately upon delivery — complementary to CBDE (under SIPO YES vote in this round) which addresses the same friction at the toolchain level.

Governance and oversight structure is identical to the standard SIPO has approved on Amaru, Dingo, HLabs Pebble + Gerolamo, DeFi Liquidity Budget, and Orion Fund (Sundae Labs treasury-contracts framework, Intersect administration, 5-entity Oversight Committee, multi-signature disbursement, refund clause). 86% Development allocation. Net Change Limit compliant.

Expectations (YES with binding operational commitments)

- CIP-168 ratification dependency reporting: CIP-0168 (BuiltinValue functions) is not yet ratified at the time of submission. SIPO expects monthly reporting on CIP-168 ratification progress as a hard dependency for Workstream 1 deliverables, with a clear path if material specification changes occur post-implementation start.

- Property-based conformance framework external alt-client adoption: The framework's value depends on alt-client (Amaru, Dingo, future implementations) adoption. SIPO expects publication of which alt-client teams are actively running the framework, with quarterly updates on test coverage and any alt-client / canonical disagreements surfaced.

- Security audit findings transparency: The systematic audit of Plutus evaluator and costing code is one of the most valuable deliverables. SIPO expects the Q1 2027 final audit report to be published publicly with all findings, risk assessments, and remediation status — not an executive-summary-only release.

- VacuumLabs responsibility split disclosure: The co-venture distributes work across IO and VacuumLabs. SIPO expects the responsibility split published by Q3 2026 milestone gate, including which workstreams VacuumLabs leads versus shares with IO.

- Hard-fork-dependent vs hard-fork-independent deliverable separation: Workstream 1 features (casing on Data, multiIndexArray, BuiltinValue functions) require Dijkstra HF activation; Workstream 2 conformance and audits are hard-fork-independent; Workstream 3 developer experience improvements ship without hard fork. SIPO expects clear separation in milestone reporting so the community can evaluate progress on each track independently.

Closing

Plutus is the foundation of every Cardano smart contract and the verification target of the High Assurance Initiative. Investing in Plutus performance, correctness, and usability improvements compounds across every language, every DApp, and every alt-client implementation. The VacuumLabs co-venture adds the structural improvement that Plutus stewardship is no longer concentrated in IO. With expectations above treated as binding operational commitments, SIPO DRep votes YES.

For these reasons, SIPO DRep votes YES.

---

SIPO DRepとして、本提案「IO & VacuumLabs: Enhancing Plutus — Performance, Correctness, and Usability」に賛成（YES）を投じます。

Governance Action ID: gov_action1w0shrfxqwv95kk0v4cn34wylz25a2cmqkq5jpc0e2yrahhqava3qvczhx6t
DRep: drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh
Date: 2026-05-09

SIPOは本提案を、全Cardano smart contractsが依拠する基盤への一貫した投資として支持します。PlutusはAiken、Pebble、Scalus、Futura、Plinthのコンパイル先であり、その品質と機能は開発者が何を構築できるか、契約がどれほど安価に実行できるか、そしてalt-clientsとDAppsが普及する中でエコシステムが正確性にどれほど自信を持てるかを直接決定します。3つのワークストリームがPlutusをperformance（UPLC capabilities and primitives）、correctness（formal specification、conformance、security audit）、usability（compiler architecture、dependency simplification）で前進させます。VacuumLabsとのco-ventureは、Plutus stewardshipをIOに集中させるのではなく組織間に分散します。

SIPOがYESと判断する理由

1. Plutus改善は全smart-contract言語と全Cardano DAppに対して複利的に効く。Builtin casing on Data、multiIndexArray（CIP-156、既批准）、追加BuiltinValue functions（CIP-168）、scope-check investigationは、ソース言語に関わらず全Cardano DAppの実行コストを直接削減します（全てUPLCにコンパイルされるため）。安価なオンチェーン実行はDeFiの資本効率を改善し、現在経済的に成立しないアプリケーション設計を可能にし、現状コストで勝つ実行レイヤーとの競争パリティに直結します。

2. Property-based conformance testingはノード多様性ドクトリンのための構造的インフラ。現在のPlutus conformance suiteは1,982の手書きテストケースを持ちます。Property-based conformanceはformal specificationsからテストケースを生成することでこれを拡張し、代替Plutus evaluator実装がプログラム空間全体にわたってcanonical実装と一致することへの遥かに高い信頼度を提供します。SIPOは代替フルノード実装が essential infrastructure insurance であるという基準でAmaruとDingoにYESを投じてきました — それらのalt-clientsは Plutus が進化する中で安全に進化するために本property-based conformance frameworkを必要とします。

3. Plutus evaluatorの継続的security auditingはCardanoの規模では非裁量的。DeFiと高価値DAppがCardanoにデプロイされる中で、evaluator や costing バグのコストはTVLに比例して成長します。evaluatorとcosting codeの構造化された手動レビュー、およびprogrammatic built-in typesとfunctionsのPlutus metatheoryへの formalization に投資することは、財務的にも信頼面でも高コストとなるインシデントを防ぎます。微妙なcostingバグをデプロイ前に捕捉することは、プロダクションで対応するより桁違いに安価です。

4. VacuumLabs co-ventureはIOを超えてPlutus stewardshipを分散する。PlutusはこれまでIOによってほぼ独占的に維持されてきました。VacuumLabs co-ventureは、formal methods、security-critical Haskell開発、Cardanoインフラの深い専門性を持つチームを maintenance 責任の共有に導入します。これはSIPOがHLabs Pebble + Gerolamo、Ensurable Systemsとの IO Cardano Upgrades co-venture、Ensurable Systemsとの IO Cardano Maintenance co-venture、7組織の Cardano High Assurance で支持したPillar 5 stewardship分散パターンと同じです。Plutusがmulti-org consortiumによって維持されるようになることは、エコシステムレジリエンスへの構造的改善です。

5. Workstream 3 developer experience改善は即座にactionable。GHC plugin要件の撤廃、multi-version GHC support、Plinthからnative C library依存（blst、secp256k1）の除去、source-level error messagesの明確化は、hard forkを必要とせずにセットアップ摩擦を減らします。これらはデリバリー時に即座にship・開発者に benefit します — 本ラウンドでSIPOがYESを投じるCBDEと相補的（toolchain levelで同じ摩擦に対応）。

ガバナンス・監視構造はSIPOがAmaru、Dingo、HLabs Pebble + Gerolamo、DeFi Liquidity Budget、Orion Fundで承認した標準と同一です。86% Development配分、Net Change Limit準拠。

期待事項（YESには拘束力のある運用上のコミットメントを伴う）

- CIP-168批准依存性の報告：CIP-0168（BuiltinValue functions）は提出時点で未批准。SIPOはWorkstream 1デリバリーのhard dependencyとしてCIP-168批准進捗の月次報告を期待します。実装開始後に大きな仕様変更が発生した場合の明確なパスを含めて。

- Property-based conformance frameworkの外部alt-client採用：フレームワークの価値はalt-client（Amaru、Dingo、将来の実装）採用に依存します。SIPOはどのalt-clientチームがフレームワークを能動的に実行しているかの公開、テストカバレッジとalt-client/canonicalの不一致が表面化した場合の四半期更新を期待します。

- Security audit findingsの透明性：Plutus evaluatorとcosting codeの系統的監査は最も価値のあるデリバリーの1つです。SIPOはQ1 2027最終監査レポートの全findings、リスク評価、remediation statusを伴う公開を期待します — executive summary のみのリリースではなく。

- VacuumLabs責任分担の開示：co-ventureはIOとVacuumLa
