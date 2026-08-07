<!-- url: ipfs://bafkreidck4dzmf7dyzzhwdvp6wnosq72v47i5hqzw6uv4fyk2xwy4q4mae -->
# SIPO

**Proposal:** Reduce minPoolCost to 75 ada and increase Plutus Memory Limits (Part 2)
**Vote:** Yes
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes YES on the parameter update reducing minPoolCost to 75 ada and completing the increase to Plutus memory limits.

The action bundles two changes that Intersect's Parameter Committee had previously recommended separately. The first reduces minPoolCost from 170,000,000 lovelace to 75,000,000 lovelace, a decrease of about 56 percent. The second raises maxTxExecutionUnits[memory] from 16,500,000 to 17,500,000 units and maxBlockExecutionUnits[memory] from 72,000,000 to 77,500,000 units, completing a cumulative 25 percent increase that could not be made in one step because guardrails MTEU-M-04 and MBEU-M-03 cap how far either parameter may rise in a single action. The Technical Steering Committee ratified the minPoolCost reduction on 9 July 2026. No other parameters and no Plutus cost model settings are changed.

SIPO takes the Plutus limits to be uncontentious. They complete a target the Parameter Committee recommended and the Technical Steering Committee ratified, and the two-step path is a consequence of the guardrails working as designed rather than of any disagreement about the destination.

On minPoolCost, SIPO finds the evidence persuasive. The parameter was calibrated at Shelley launch against an ada price, an inflation schedule, and an estimate of operating costs that have all since moved. Gross rewards have fallen from roughly 1,800 ada per block to around 300 as the reserve depletes, so a fixed floor that was tolerable in 2020 now consumes a disproportionate share of what a small pool earns. At approximately 300 ada per block, the floor takes about 57 percent of a single-block pool's gross reward at 170 ada, and about 25 percent at 75. The delegator penalty on single-block pools, which the 2023 reduction from 340 ada brought down to roughly 28 percent, has climbed back to roughly 53 percent and is projected to reach 100 percent around epoch 758 if nothing changes. A floor that trends toward consuming the entire reward of a small pool is not a neutral setting. It is a gradual exclusion.

SIPO also weighs the reversal in IO Research's assessment. The original case for a high fixed-fee floor was that it deters Sybil-style stake fragmentation. IO Research now assesses that a high floor favours such fragmentation by large operators rather than deterring it, because an operator with scale can absorb a fixed cost across many pools while an independent operator cannot. When the evidence for a parameter's original justification reverses, the parameter should be revisited. That is what this action does.

SIPO states its own position plainly rather than leaving it to be inferred. SIPO operates stake pools, and every one of them declares a fixed cost of 340 ada, twice the current floor. SIPO is therefore not at the floor, and this reduction produces no mechanical change to SIPO's own revenue. SIPO is not making a sacrifice here and does not present this vote as one. SIPO supports the change because small-pool viability is a precondition for a distributed operator set, and a distributed operator set is what makes this network worth operating in.

SIPO records one reservation, directed at what follows rather than at this action. The proposal presents the reduction as a prerequisite step toward a future increase in stakePoolTargetNum, on the reasoning that smaller pools must be economically viable before raising k can be effective. SIPO accepts that reasoning as far as it goes. It does not follow that SIPO supports any particular value of k. Raising k lowers the saturation point proportionally, and a large increase would place pools that are presently well within saturation above it, redistributing delegation and affecting operators who have done nothing wrong. That is a separate question with its own evidence, and SIPO expects it to arrive as its own governance action accompanied by a published saturation analysis, rather than to be treated as settled by this vote. A Yes here is support for repairing small-pool economics. It is not a proxy vote on k.

This vote is SIPO DRep's recorded position.

---

SIPO DRep は、minPoolCost を 75 ADA に引き下げ、Plutus メモリ上限の引き上げを完了させるパラメータ更新に賛成（YES）を投じます。

本アクションは、Intersect の Parameter Committee がこれまで個別に推奨してきた 2 つの変更を束ねたものです。第一に、minPoolCost を 170,000,000 lovelace から 75,000,000 lovelace へ、約 56% 引き下げます。第二に、maxTxExecutionUnits[memory] を 16,500,000 から 17,500,000 ユニットへ、maxBlockExecutionUnits[memory] を 72,000,000 から 77,500,000 ユニットへ引き上げ、累積 25% の増加を完了させます。この増加を一度に行えなかったのは、ガードレール MTEU-M-04 および MBEU-M-03 が、単一のアクションで各パラメータを引き上げられる幅を制限しているためです。Technical Steering Committee は 2026 年 7 月 9 日に minPoolCost の引き下げを批准しました。他のパラメータおよび Plutus コストモデルの設定は変更されません。

SIPO は、Plutus 上限側を争点とは考えません。これは Parameter Committee が推奨し Technical Steering Committee が批准した目標値を完成させるものであり、2 段階になったのは目的地についての意見の相違ではなく、ガードレールが設計どおりに機能した結果です。

minPoolCost について、SIPO は提示された証拠に説得力を認めます。本パラメータは Shelley ローンチ時に、当時の ADA 価格、当時のインフレスケジュール、そして当時の運用コスト見積りに対して較正されました。その 3 つはいずれもその後変化しています。リザーブの枯渇に伴い、ブロックあたりの総報酬は約 1,800 ADA から約 300 ADA へ低下しました。したがって 2020 年には許容できた固定下限が、いまや小規模プールの稼得に対して不釣り合いな割合を占めています。ブロックあたり約 300 ADA の水準では、1 ブロックプールの総報酬に占める下限の割合は、170 ADA で約 57%、75 ADA で約 25% です。単一ブロックプールにおける委任者ペナルティは、2023 年の 340 ADA からの引き下げによって約 28% まで低下しましたが、その後 約 53% まで戻っており、何も手を打たなければエポック 758 前後で 100% に達すると予測されています。小規模プールの報酬を丸ごと飲み込む方向へ推移する下限は、中立的な設定ではありません。それは緩やかな排除です。

SIPO は、IO Research の評価が反転した点も重く見ます。高い固定費下限を設ける当初の論拠は、Sybil 型のステーク分割を抑止することにありました。IO Research は現在、高い下限はそうした分割を抑止するどころか、大規模事業者による分割をむしろ助長すると評価しています。規模を持つ事業者は固定費を多数のプールに分散して吸収できる一方、独立系の事業者にはそれができないからです。あるパラメータの当初の正当化根拠が、証拠によって覆されたのであれば、そのパラメータは見直されるべきです。本アクションはそれを行うものです。

SIPO は自らの立場を、推測に委ねるのではなく明確に述べます。SIPO はステークプールを運営しており、そのいずれもが固定費として 340 ADA を宣言しています。これは現行の下限の 2 倍です。したがって SIPO は下限に張り付いておらず、本引き下げは SIPO 自身の収益に機械的な変化をもたらしません。**SIPO はここで犠牲を払っておらず、本投票をそのように装いません。** SIPO が本変更を支持するのは、小規模プールの成立可能性が分散した運営者層の前提条件であり、分散した運営者層こそがこのネットワークを運営するに値するものにしているからです。

SIPO は 1 点の留保を記録します。これは本アクションに対してではなく、その先に向けられたものです。本提案は、この引き下げを stakePoolTargetNum の将来的な引き上げに向けた前提条件と位置づけています。k を引き上げても、小規模プールが経済的に成立していなければ効果がない、という論理です。SIPO はその論理をその限りにおいて受け入れます。しかしそこから、SIPO が特定の k の値を支持するという帰結は導かれません。k の引き上げは飽和点を比例して引き下げます。大幅な引き上げは、現在は飽和に十分な余裕を持つプールを飽和の上側に置き、委任を再配分し、何ら落ち度のない運営者に影響を及ぼします。これはそれ自体の証拠を伴う別個の問題であり、SIPO は、それが本投票によって決着済みとして扱われるのではなく、公開された飽和分析を伴う独立したガバナンスアクションとして提出されることを期待します。ここでの賛成は、小規模プールの経済性を修復することへの支持です。k に対する代理投票ではありません。

本投票は SIPO DRep の記録上の立場表明です。
