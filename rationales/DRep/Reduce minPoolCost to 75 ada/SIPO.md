<!-- url: ipfs://bafkreibqwixxyjhkgxz6i5cml676byn2d3i5irvz2z74rkowrgykatb7de -->
# SIPO

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** Abstain
**Voter ID:** `drep1yffld2866p00cyg3ejjdewtvazgah7jjgk0s9m7m5ytmmdq33v3zh`

---

SIPO DRep votes ABSTAIN on the parameter update reducing minPoolCost from 170 ada to 75 ada.

This is a constructive abstention. SIPO supports the direction of repairing small-pool economics, and on 7 August voted Yes on the earlier action that bundled this same reduction with the Plutus memory increase. Since then SIPO has looked more closely at what the previous reduction actually achieved, at whom a further reduction would reach, and at the sequencing the underlying research recommends. On that evidence SIPO does not oppose this change, but does not endorse it in this form.

First, the 2023 reduction from 340 ada to 170 ada did not change the structure it was meant to change. The Input Output Research SPO incentives report (November 2025) finds that 340 ada remains the most common fixed cost at every pool size, that the reduction did not cause a market-wide fee reduction, and that it instead split the market into incumbents at 340 ada and challengers at 170 ada. The proposal itself states that the 2023 reduction alone did not resolve the underlying structural pressure. SIPO's own reading of the ledger on 15 September is consistent with this. Among 2,672 pools with active stake, 1,747 declare 340 ada and hold 67.6 percent of active stake, while 503 declare 170 ada and hold 22.7 percent, including pools run by large institutional operators.

Second, the benefit of a further reduction is narrow. Using epoch 653 averages of about 290.7 ada per block, ignoring pledge effects and block variance, and assuming a zero margin, the change materially moves delegator returns only for pools of roughly 0.5 to 3 million ada. At 1 million ada, delegator return rises from about 0.90 percent to 1.60 percent. At 10 million ada, it rises from about 2.02 percent to 2.09 percent. Pools in the 0.5 to 3 million ada band number 342 and hold about 2.2 percent of active stake. Pools below 0.5 million ada expect fewer than one block every two epochs, and a lower floor does not change that. For operators at the floor, fixed-fee income falls from 12,410 ada to 5,475 ada a year.

Third, the sequencing departs from the research. The same report concludes that minPoolCost should be lowered to zero or removed, but suggests pairing that with a minimum margin parameter to prevent a race to the bottom on fees, and recommends that the minimum margin proposal be analysed with a corresponding reduction or elimination of the fixed cost considered alongside it. The proposal describes the long-term trajectory as zero, or replacement by the proportional minPoolMargin of CIP-23. This action takes the fixed-cost step on its own, before that safeguard exists. The proposal's own reversion plan also notes that a later revert cannot compel pools that have lowered their cost to raise it again, so the step is effectively one-way.

SIPO states its own position plainly. Each of SIPO's pools declares a fixed cost of 340 ada, so this change has no mechanical effect on SIPO's revenue. SIPO is also on the incumbent side of the market described above. A No from SIPO could reasonably be read as protecting incumbents, and blocking a change that carries no direct cost to SIPO is not a position SIPO wants to take on these grounds. An abstention records the concern without casting that weight against the proposal. Because this is an economic parameter, stake pool operators have no vote on it, which is correct under the guardrails. As an operator that is also a DRep, SIPO records the operator-side concern here.

SIPO would vote Yes on a proposal that pairs a reduction of the fixed cost with a minimum margin mechanism, or on one that arrives with a published model of operator income by pool size showing that independent operators remain viable at the new floor.

This vote is SIPO DRep's recorded position.

---

SIPO DRep は、minPoolCost を 170 ADA から 75 ADA へ引き下げるパラメータ更新に、棄権（ABSTAIN）を投じます。

これは建設的な棄権です。SIPO は小規模プールの経済性を立て直すという方向を支持しており、8 月 7 日には、同じ引き下げを Plutus メモリ上限の引き上げと束ねた前回のアクションに賛成しました。その後 SIPO は、前回の引き下げが実際に何をもたらしたのか、さらなる引き下げが誰に届くのか、そして根拠となる研究がどの順序を勧めているのかを、あらためて確認しました。その結果、SIPO は本変更に反対はしませんが、この形のままでは支持もしません。

第一に、2023 年の 340 ADA から 170 ADA への引き下げは、変えようとした構造を変えていません。Input Output Research の SPO インセンティブ報告（2025 年 11 月）は、340 ADA があらゆるプール規模で依然として最も多い固定費設定であること、引き下げが市場全体の手数料低下を起こさなかったこと、そして市場が 340 ADA の既存勢力と 170 ADA の挑戦者に二分されたことを示しています。提案自身も、2023 年の引き下げだけでは根本的な構造的圧力は解消されなかったと述べています。9 月 15 日に SIPO が台帳を確認した結果も、これと整合します。アクティブステークを持つ 2,672 プールのうち、340 ADA を宣言するのは 1,747 プールでアクティブステークの 67.6%、170 ADA は 503 プールで 22.7% です。後者には、大規模な機関系事業者が運営するプールも含まれます。

第二に、さらなる引き下げの効果が及ぶ範囲は狭いです。エポック 653 の平均である 1 ブロックあたり約 290.7 ADA を用い、pledge の効果とブロック数のばらつきを無視し、マージン 0% と仮定すると、委任者の利回りが意味のある幅で動くのは、おおむね 50 万〜300 万 ADA のプールに限られます。100 万 ADA のプールでは約 0.90% から 1.60% へ上がりますが、1,000 万 ADA のプールでは約 2.02% から 2.09% です。50 万〜300 万 ADA の帯にあるプールは 342 で、アクティブステークの約 2.2% です。50 万 ADA 未満のプールは 2 エポックに 1 ブロックも見込めず、下限を下げてもその状況は変わりません。下限に張り付く運営者の固定費収入は、年 12,410 ADA から 5,475 ADA に減ります。

第三に、順序が研究の勧めと異なります。同じ報告は、minPoolCost は 0 に下げるか廃止すべきだとしつつ、手数料の底なし競争を防ぐために最低マージンという新しいパラメータと組み合わせることを示し、最低マージン案を分析する際に、固定費の引き下げや廃止もあわせて検討するよう勧告しています。提案自身も、長期の行き先をゼロ、または CIP-23 の比例型 minPoolMargin による置き換えと記しています。本アクションは、その安全装置がまだない段階で、固定費の一歩だけを先に進めます。さらに提案の Reversion Plan は、後から元に戻しても、すでに固定費を下げたプールに引き上げを強制できないと述べており、この一歩は実質的に一方通行です。

SIPO は自らの立場を明示します。SIPO のプールはいずれも固定費として 340 ADA を宣言しており、本変更は SIPO の収益に機械的な影響を与えません。同時に SIPO は、上で述べた市場の既存勢力の側にいます。SIPO の反対票は既存勢力の防衛と受け取られても不思議ではなく、SIPO に直接のコストが生じない変更をこれらの理由で止めることは、SIPO の取りたい立場ではありません。棄権は、懸念を記録しつつ、その重みを提案への反対には投じない選択です。本件は経済パラメータであり、ガードレール上、SPO の投票対象ではありません。これは正しい設計です。そのうえで、SPO でもある DRep として、SIPO は運営者側の懸念をここに記録します。

固定費の引き下げを最低マージンの仕組みと組み合わせた提案、または新しい下限でも独立系の運営者が成り立つことを示す、プール規模別の運営者収入モデルを伴う提案であれば、SIPO は賛成を投じます。

本投票は SIPO DRep の記録上の立場表明です。
