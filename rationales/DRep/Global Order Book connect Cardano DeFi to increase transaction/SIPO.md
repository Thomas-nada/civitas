<!-- url: ipfs://bafkreiedyu3qjtxggwacsqi5ee5aun5ezpkzimeb7bpy737wp3zwet52ku -->
# SIPO

**Proposal:** Global Order Book connect Cardano DeFi to increase transaction
**Vote:** No
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes NO on the treasury withdrawal "Global Order Book connect Cardano DeFi to increase transaction" (3,333,000 ada), and invites a narrower resubmission.

This is a vote against the structure of the request, not against the team. Dano Finance has a real delivery record on Cardano - the Danogo protocol since 2023, the daken and stdlib Aiken libraries, and continuing public development. The proposal came through the Intersect Budget 2026 process, its scope was reduced from that version, and its accountability design is sound: milestone gating, security review before mainnet, unused funds returned, Minswap Labs as budget administrator, and 5% of protocol fees returned to the Treasury for twelve months. SIPO records all of this as creditable.

SIPO's objection is that the public-good case and the proposer's own product build are bundled into a single, non-separable request. Of the 3,300,000 ada delivery budget, 300,000 funds the DeFi Kernel registry and 1,000,000 funds the SDK - the components that serve the whole ecosystem. The remaining 2,000,000, roughly 61%, funds two new standalone protocols belonging to the proposer: a Spot Leverage Order Book and an American Options market-making protocol. A proposal whose stated purpose is to reduce fragmentation devotes most of its budget to adding two more venues, and DReps cannot approve the shared infrastructure without also funding the proposer's product line.

Two further points bear on the ecosystem case. The DeFi Kernel's three rules - permissionless, composable, discoverable - restate CIP-0089, Distributed DApps and Beacon Tokens, which is already an active CIP; four of the eight contracts currently in the registry are that CIP author's own reference implementations. Building a registry and an SDK on top of CIP-89 is legitimate and useful work, but it should be presented as that rather than as a new standard. And the first rule, requiring that no batcher be involved, structurally excludes the batcher-based automated market makers that hold most of Cardano's DeFi liquidity today, which limits how much fragmentation this standard can actually resolve. Separately, the American Options work package overlaps cardano-options, an existing CIP-89 options protocol that the proposal's own registry lists.

Adoption evidence is thin. The registry repository has received no commits since 8 April 2026 and has no forks, no pull requests, no issues, and no external submission; the website loads that same static file set. Fund control is the weakest class among the withdrawals before DReps this epoch: the on-chain recipient is a single key credential at stake1u9h9w7ssk3zne7mchccz8kugsncn2muhx2p2v26s9gysyqquxfv3z, not a script, and not a milestone-gated treasury contract.

SIPO would support a resubmission limited to the registry and the SDK - the components that are genuinely shared infrastructure - paid to a script-controlled recipient and accompanied by evidence of adoption, meaning independent protocols that have actually submitted to the registry rather than been listed in it. A shared SDK for CIP-89-style contracts is a real gap in Cardano's tooling and is worth funding on its own terms. This vote is SIPO DRep's recorded position.

---

SIPO DRep は、トレジャリー引き出し提案「Global Order Book connect Cardano DeFi to increase transaction」（3,333,000 ADA）に反対（NO）を投じ、範囲を絞った再提出を促します。

これは要求の構造に対する反対であり、チームに対する反対ではありません。Dano Finance は Cardano における実績を持つ開発体です。2023 年からの Danogo プロトコル、Aiken ライブラリ daken および stdlib、そして継続的な公開開発があります。本提案は Intersect Budget 2026 プロセスを経ており、その版から範囲が縮小されています。アカウンタビリティ設計も健全です。マイルストーンゲート、メインネット前のセキュリティレビュー、未使用資金の返還、予算管理者としての Minswap Labs、そしてプロトコル手数料の 5% を 12 ヶ月間 国庫へ還流させる設計。SIPO はこれらをいずれも評価すべき点として記録します。

SIPO の反対理由は、公共財としての論拠と提案者自身のプロダクト開発が、分離不能な一つの要求に束ねられている点にあります。3,300,000 ADA の実施予算のうち、DeFi Kernel レジストリが 300,000 ADA、SDK が 1,000,000 ADA で、これらがエコシステム全体に資する部分です。残る 2,000,000 ADA、約 61% は、提案者に帰属する新規の独立プロトコル 2 本、すなわち Spot Leverage Order Book と American Options のマーケットメイキングプロトコルに充てられます。断片化の解消を目的として掲げる提案が、予算の大半を新たな取引の場を 2 つ増やすことに充てており、DRep は提案者のプロダクトラインを同時に資金供与することなしに共通インフラだけを承認することができません。

エコシステム上の論拠について、さらに 2 点あります。DeFi Kernel の 3 ルール（パーミッションレス、コンポーザブル、ディスカバラブル）は、既に有効な CIP である CIP-0089「Distributed DApps & Beacon Tokens」を言い換えたものです。現在レジストリに掲載されている 8 件の contract のうち 4 件は、その CIP 作者自身の参照実装です。CIP-89 の上にレジストリと SDK を構築すること自体は正当かつ有用な仕事ですが、新しい標準としてではなく、そのようなものとして提示されるべきです。また第一のルールであるバッチャー不要という要件は、現在 Cardano の DeFi 流動性の大半を保持しているバッチャー方式の AMM を構造上除外します。これは本標準が実際に解消し得る断片化の範囲を限定します。加えて American Options のワークパッケージは、本提案自身のレジストリが掲載している既存の CIP-89 オプションプロトコル cardano-options と重複します。

採用の実証も乏しい状況です。レジストリのリポジトリは 2026 年 4 月 8 日以降 commit がなく、fork も pull request も issue も外部からの提出もありません。ウェブサイトは同じ静的ファイル群を読み込んでいるだけです。資金統制は、本エポックで DRep の前にある引き出しの中で最も弱い類型です。オンチェーン受領先は script ではなく単一鍵の credential（stake1u9h9w7ssk3zne7mchccz8kugsncn2muhx2p2v26s9gysyqquxfv3z）であり、マイルストーンゲートを備えた treasury contract でもありません。

SIPO は、真に共通インフラである レジストリと SDK に限定した再提出であれば支持します。その際は script 統制下の受領先とし、採用の実証、すなわちレジストリに掲載されただけでなく実際に自ら提出した独立プロトコルの存在を伴うことを求めます。CIP-89 型の contract に対する共通 SDK は Cardano のツーリングにおける実在のギャップであり、それ単独で資金供与に値します。本投票は SIPO DRep の記録上の立場表明です。
