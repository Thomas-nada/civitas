<!-- url: https://coffeepool.jp/wp-content/uploads/voting/rationale-2026minpoolcost-75.json -->
# hix_coffeepool☕️

**Proposal:** Reduce minPoolCost to 75 ada
**Vote:** No
**Voter ID:** `drep1ygnh2uf4wkc8ldgfxwz7rzuga3m8jtqew9xh5g3n587mg6g3ge0sj`

---

I am voting NO on this Parameter Change reducing minPoolCost from 170 ADA to 75 ADA.

I agree with the problem this proposal identifies. Block rewards have fallen from roughly 1,800 ADA at Shelley launch to around 300 ADA today, while infrastructure costs have risen. Small pool operators are under genuine and worsening pressure, and the delegator penalty on single-block pools is a real structural distortion. The concern is legitimate.

But minPoolCost is a distribution parameter, not a supply parameter. It determines how a pool's rewards are split between the operator and delegators. It does not increase the reward pool by a single ADA. Lowering it moves income from operators to delegators, in the hope that improved advertised return on staking attracts delegation that does not currently exist. The total available to the ecosystem is unchanged either way.

Ironically, the proposal itself concedes that this measure will have limited effect. minPoolCost was already halved from 340 to 170 ADA in 2023, yet the proposal reports that of 1,614 active pools, 873 operators (54%) remain below the delegation threshold associated with consistent block production, acknowledging that the 2023 reduction did not resolve the underlying structural pressure. The proposal further projects that even after this reduction, the delegator penalty on single-block pools reaches 100% by around epoch 758 in February 2028. The proposal describes itself as a stopgap, and that description is accurate. That is precisely why I cannot support it as a response to the problem it identifies.

The proposal is framed entirely in ADA-denominated ratios, restoring the delegator penalty from roughly 52.8% toward 25%. It never states what the resulting income is in the currency operators actually pay their costs in. For a pool producing one block per epoch, 170 ADA per epoch is roughly 12,410 ADA per year, and 75 ADA per epoch is roughly 5,475 ADA per year. At recent ADA prices, that is on the order of 50 to 165 US dollars per month at the current floor, and 23 to 73 US dollars per month at the proposed floor. At that level many SPOs will be unable to operate even a minimal block producer with relays. The current setting is already below viability for these operators. The proposed setting is not a smaller version of the same problem; it is outside the range in which the question is meaningful. Margin income does not close this gap: for a pool at the floor producing one block per epoch, margin on the residual reward amounts to a few ADA per epoch.

This exposes the deeper issue. The proposal optimises an ADA-denominated ratio while the binding constraint on operators is denominated in fiat. Cardano's monetary design assumed that declining reserve emission would be offset by increasing scarcity supporting the price of ADA. Over the period I have measured, that relationship does not hold: reward per block and ADA price have declined together, and the precondition of the design has been undermined. Reserve emission reduces new supply and works toward scarcity, while Treasury withdrawals release ADA into circulation and work against it. When the second exceeds the first, the mechanism that was supposed to support operator economics through price does not operate. No adjustment to the split between operators and delegators addresses this.

There is a further consequence that sits beyond this action but bears on it. Falling reward levels weaken the incentive to hold ADA in self-custody. ADA moved to custodial venues such as centralised exchanges is, in current practice, either delegated by the custodian rather than by its owner, or removed from effective delegation altogether. Declining effective delegation therefore carries a governance concentration risk, not only an SPO income risk. Cardano provides no self-correcting mechanism here: because pool rewards are calculated against total supply rather than active stake, undistributed rewards return to the reserve and the yield for remaining delegators does not rise as participation falls. Nothing pulls participation back on its own.

Before lowering the fee floor again, the ecosystem should answer why rewards continue to decline and whether that trajectory is acceptable. Specifically, whether the 20% Treasury allocation of monetary expansion remains appropriate given the observed effect of Treasury withdrawals on circulating supply, and how the transition from reserve emission to fee-based sustainability will be managed. This proposal treats those answers as given and optimises around them.

I would support a reduction in minPoolCost, or its replacement by a proportional minPoolMargin under CIP-0023, as part of a package that also addresses the size of the reward pool. Presented on its own, this change lowers the floor on operator income without improving operator viability, and defers the question that actually determines whether small pools survive.

For these reasons I vote NO.

---

[Japanese version follows / 日本語版]

minPoolCostを170 ADAから75 ADAへ引き下げる本パラメータ変更案に対し、反対票を投じます。

本提案が指摘する問題については同意します。Shelleyローンチ時に約1,800 ADAあったブロック報酬は現在約300 ADAまで低下し、一方でインフラコストは上昇しています。小規模プールオペレーターが実際に、そして悪化する圧力にさらされていること、1ブロックプールにおける委任者ペナルティが構造的な歪みであることは事実です。問題意識そのものは正当だと考えます。

しかしminPoolCostは分配のパラメータであって、供給のパラメータではありません。プールの報酬をオペレーターと委任者の間でどう分けるかを決めるだけであり、報酬の総額を1 ADAも増やしません。引き下げは、オペレーターから委任者へ収入を移し、表示上のリターン改善によって、現在存在していない委任を呼び込むことを期待するものです。エコシステムが受け取る総額は、どちらに転んでも変わりません。

皮肉なことに、本提案自身がこの提案があまり効果がないことを認めています。2023年に、minPoolCostを340 ADAから170 ADAへ半減する施策も行われましたが、現在も1614のアクティブプールのうち873オペレーター（54%）が安定的なブロック生成に必要な委任量の閾値を下回ったままとなっていることを明記しており、つまり2023年の引き下げは根本的な構造的圧力が解消しなかったことを認識しています。そして本提案においても、今回の引き下げを行ってもなお、1ブロックプールの委任者ペナルティが2028年2月頃、エポック758あたりで100%に達すると見込んでいます。本提案は自らを応急措置と位置づけており、その記述は確かにその通りです。そしてそれこそが、本提案を、それ自身が指摘する問題への回答として支持できない理由です。

本提案は全体がADA建ての比率で構成されており、委任者ペナルティを約52.8%から25%へ戻すと説明しています。しかし、その結果としてオペレーターが得る収入が、実際にコストを支払う通貨でいくらになるのかは一度も示されていません。1エポックに1ブロックを生成するプールの場合、170 ADAは年間約12,410 ADA、75 ADAは年間約5,475 ADAです。近時のADA価格では、現行フロアで月あたり概ね50〜165米ドル、提案されるフロアで月あたり概ね23〜73米ドルとなります。ブロックプロデューサーとリレーという最小構成であっても、この金額では多くのSPOが運用できなくなるでしょう。つまり現行の設定がすでに採算ラインを下回っており、提案される設定は同じ問題の程度が小さい版ではなく、議論が成立する範囲の外にあります。マージン収入はこの差を埋めません。フロアにいる1ブロックプールの場合、残余報酬に対するマージンは1エポックあたり数ADAにとどまります。

ここに、より深い問題が表れています。本提案はADA建ての比率を最適化していますが、オペレーターを実際に制約しているのは法定通貨建てのコストです。Cardanoの通貨設計は、リザーブからの新規供給が減少することで希少性が高まり、ADA価格がそれを補うという前提に立っていました。私が計測した期間において、この関係は成立していません。ブロックあたり報酬とADA価格は、ともに低下しており、設計の前提条件が損なわれています。リザーブ減衰は新規供給を減らし希少性を高める方向に働きますが、トレジャリー引き出しはADAを流通に放出し、それを打ち消す方向に働いています。後者が前者を上回るとき、価格を通じてオペレーターの採算を支えるはずだった機構は機能しません。オペレーターと委任者のあいだの分配をどう調整しても、これには作用しません。

本アクションの範囲を超えますが、関連する帰結がもう一つあります。報酬水準の低下は、ADAを自己管理下で保有し続ける動機を弱めます。そして現在、CEXなどのカストディアルな場所に移されたADAは、保有者本人ではなくカストディアンによって委任される、もしくは有効委任から解除されることが多いのが現状です。したがって実効委任率の低下は、SPOの収入の問題であると同時に、ガバナンス集中のリスクでもあります。そしてCardanoには、ここに自己修正の機構がありません。プールの報酬はアクティブステークではなく総供給量に対して計算されるため、未配分の報酬はリザーブに戻り、参加率が下がっても残った委任者の利回りは上昇しません。参加を自然に引き戻す力がどこにも存在しないということです。

手数料フロアを再び引き下げる前に、エコシステムはなぜ報酬が低下し続けているのか、そしてその軌道が許容できるものなのかに答えるべきです。具体的には、トレジャリー引き出しが流通供給に与えている観測された影響を踏まえたうえで、金融拡大の20%をトレジャリーに配分するという設定が今も妥当なのか、そしてリザーブ由来の発行から手数料による持続可能性への移行をどう管理するのか、という問いです。本提案はこれらの答えを所与のものとし、その周辺を最適化しています。

報酬プールの規模そのものに対処する施策とあわせて提示されるのであれば、minPoolCostの引き下げ、あるいはCIP-0023によるminPoolMarginへの置き換えを支持します。しかし単独で提示された本変更は、オペレーターの収入の下限を引き下げるだけで、オペレーターの存続可能性を改善せず、小規模プールが生き残れるかどうかを実際に決定づける問いを先送りしています。

以上の理由により、反対票を投じます。
