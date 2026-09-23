<!-- url: https://dreptalk.com/vote-rationale/bcea9711c7a2ac4d016fc1cce12d675c18d8f07a3af011e53356438035905cd4.json -->
# CardanoLeo

**Proposal:** Should stakePoolTargetNum (k) be raised from 500 to 1000 (SPO poll)
**Vote:** No
**Voter ID:** `drep1y28xhrjxe496rnle8ln3slpggnp8leu3mn244ujrhwet0cc2vmte4`

---

**Vote: No**

**Rationale:**
The proposal’s own Section 7 correctly identifies a fundamental limitation: raising $k$ to 1000 cannot enforce whether redelegated stake moves to a genuinely independent operator or merely shifts to another pool managed by the same entity. What the proposal fails to address — and what warrants strict scrutiny — is *which of these two outcomes is actually more likely.*

Consider a multi-pool operator (MPO) currently running several pools near saturation. Halving the saturation threshold effectively doubles the required number of pool nodes, relays, and monitoring systems to retain the same total stake. This creates a tangible operational and financial burden, absorbed entirely by the SPO rather than the protocol. Meanwhile, when delegators receive an oversaturation warning, behavioral friction and brand familiarity strongly disincentivize them from researching unfamiliar, independent micro-pools. Instead, delegators will naturally follow the existing operator to their newly launched sibling pool.

If this friction-free transition is the default delegator response, lowering the saturation threshold fails to achieve the **entity-level decentralization** the proposal purports to deliver. It simply forces existing MPOs to shoulder higher infrastructure costs and subjects delegators to unnecessary redelegation friction, while leaving entity-level control fully concentrated.

This is not a hypothetical counterargument; it is the direct, predictable outcome of an inherent protocol design constraint acknowledged in the proposal itself: **the ledger cannot natively trace common entity control across distinct pool IDs.** A purely saturation-driven parameter change cannot mitigate this substitution effect.

If multi-pool concentration is the true structural problem, it must be targeted directly — whether through formal MPO identification frameworks, mandatory disclosure requirements, or margin and fee structures tied to an operator’s total aggregated stake rather than per-pool ID resets. Lowering the saturation threshold without addressing these underlying dynamics asks the ecosystem to absorb definitive costs (in operator overhead and user friction) for a decentralization benefit that cannot be verified and, in the case of MPOs, will not materialize.

I remain open to supporting future proposals that couple $k$ parameter adjustments with concrete, enforceable mechanisms designed to explicitly address multi-pool concentration.

---

**DRep Delegation Info**

* **CIP-1694 DRep ID:** `drep1y28xhrjxe496rnle8ln3slpggnp8leu3mn244ujrhwet0cc2vmte4`
* **Legacy DRep ID (CIP-105):** `drep13e4cu3kdfwsul7fluuv8c2zycfl70ywu64d0ysamk2m7xrv7rsv`

---

**投票：反對**

**反對理由：**
提案文件第 7 節已明確指出其核心局限：將 $k$ 值調升至 1000，並無法機制性地決定重新委託的權益會流向真正獨立的營運者，還是僅轉移至同一營運集團旗下的其他權益池（Pool）。然而，提案未能對這兩種情境的發生機率進行評估，而這恰恰是本次參數調整最應被嚴格審視之處。

試想一個現狀下有多個權益池接近飽和的多池營運商（MPO）。當飽和門檻減半，營運商若要維持相同的質押總量，所需維持的節點、Relay 與監控維運成本將近乎翻倍——此硬性成本完全由營運商吸收，協議本身並不承擔。另一方面，當委託人收到飽和警告時，受限於資訊不對稱與轉換摩擦，實務上極高機率會直接跟隨原營運商開設的新池，而非花費心力去研究並轉向陌生的獨立小池。*品牌熟悉度與最低操作阻力，均指向同一個行為路徑。*

若上述行為成為市場常態，單純調低飽和門檻便無法達成提案所訴求的「實體層級去中心化」（Entity-level Decentralization）；相反地，它僅是徒增既有多池營運商的維運負擔，並給予委託人一次不必要的重新委託操作，而實質控制權依然高度集中於同一實體手中。

這並非推測性的疑慮，而是提案自身提及卻未解決之缺口的直接且可預期後果：**鏈上帳本無法可靠地辨識跨 Pool ID 的共同控制關係**，因此純粹依賴飽和度的機制設計，根本無法阻止上述「同集團內替代效應」的發生。

若多池營運導致的集中化才是真正欲解決的痛點，應當採取直接對症下藥的配套措施——例如建立明確的多池識別機制、資訊揭露規範，或是讓成本與費率結構與營運商控制的「總質押量」掛鉤，而非以單一 Pool ID 為單位重複重置計算。在缺乏相關配套的情況下單純調低飽和門檻，無異於要求整個生態系吸收明確的真實成本（營運商的基礎設施支出與委託人的操作摩擦），去換取一個無法被保證、且在多池情境下極可能根本無法實現的去中心化幻象。

未來若有提案能將 $k$ 值的調整，與直接應對多池集中化問題的具體配套機制結合，我將樂於支持。

---

**DRep 委託資訊**

* **CIP-1694 DRep ID:** `drep1y28xhrjxe496rnle8ln3slpggnp8leu3mn244ujrhwet0cc2vmte4`
* **Legacy DRep ID (CIP-105):** `drep13e4cu3kdfwsul7fluuv8c2zycfl70ywu64d0ysamk2m7xrv7rsv`
