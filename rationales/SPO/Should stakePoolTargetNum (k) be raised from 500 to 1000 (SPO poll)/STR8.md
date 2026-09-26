<!-- url: https://gateway.pinata.cloud/ipfs/bafkreifthguhkiwwlqjsxe3lyledrd4h3brdyqpvs7bwgy44wnxaxud3au -->
# STR8

**Proposal:** Should stakePoolTargetNum (k) be raised from 500 to 1000 (SPO poll)
**Vote:** No
**Voter ID:** `pool1qqqqdktl6pq46td0mwut0qn30g7nlue0sete9wxl0hwsq37wrw8`

---

# Vote rationale — NO

I strongly oppose raising `stakePoolTargetNum (k)` from 500 to 1000 at this time.

My reasons, in no particular order:

- I do not see sufficient evidence that doubling `k` will materially improve entity-level decentralization. Lowering the saturation point does not directly help small pools below saturation. Any benefit depends on displaced stake actually redelegating to independent pools that need it. Neil Davies' analysis makes this distinction particularly clearly.

- I do not believe displaced stake will necessarily flow to independent community pools. Large custodians and multi-pool operators can simply redistribute stake among additional pools under their own control. That increases the pool count without necessarily increasing the number of independent entities controlling consensus.

- Delegated stake is sticky. A substantial amount of stake does not move readily even when incentives change. That makes the assumption that billions of ADA will efficiently redistribute to the operators who need it highly uncertain.

- I would personally be pushed toward operating a second pool. I have spent years building trust and organically attracting delegation to my pool. If `k` is doubled, my pool would become oversaturated and I would effectively be forced to establish another pool to avoid losing the result of years of work. Even then, there is no certainty that my delegators would follow me to that second pool. Large custodial or enterprise operators with direct control over delegation do not face the same problem.

- This illustrates one of my fundamental concerns with the proposal: it can incentivize existing successful operators to split into additional pools rather than creating genuinely new independent operators. The previous `k` increase was subsequently associated with substantial multi-pool expansion, and Neil's paper cites later analysis concluding that it did not produce a proportional increase in independent entities.

- Cardano infrastructure is already becoming more demanding. From my participation in the Musashi/Leios testnet, I am seeing increasing hardware and operational requirements ahead. I strongly oppose increasing the overall infrastructure footprint and operator cost without a demonstrated decentralization benefit. Increasing `k` is itself expected to encourage additional pools and nodes to be operated.

- **We have not exhausted the current `k=500` setting.** `k` represents an idealized equilibrium target for saturation-scale pools, yet Cardano is still far from an equilibrium of 500 saturated pools. With roughly 21.4B ADA of active stake, only about 285 pools could currently be fully saturated at the `k=500` saturation point, while the network already has around 1,600 active pools. To me, this strongly suggests that the problem is not a shortage of available pool capacity, but that delegation is not reaching the long tail of existing pools. Doubling `k` risks making that long tail even longer, further fragmenting available delegation and making sustainable operation harder for more pools, without addressing why stake remains concentrated.

- Protocol evolution such as Leios will further increase operational demands, while the network has not demonstrated that its decentralization problem is caused by an insufficiently high `k`.

- The historical evidence does not convince me. The previous increase from `k=150` to `k=500` coincided with major changes in ADA price, rapid delegation growth, and IOG block production winding down as Cardano became increasingly decentralized, making it difficult to isolate the effect of `k` itself.

- I would rather address the underlying decentralization and economic problems directly. Sustainable pool economics (`minMargin` 5-10%), effective pledge mechanisms such as CIP-50 or related approaches, pool alliances, and measures addressing inactive and undelegated stake all target the actual problems more directly.

## A note on this Info Action itself

I submitted this Info Action because I wanted a clear assessment of SPO sentiment using the established CIP-1694 SPO voting semantics.

When I created the Info Action, the draft material available to me linked the advocacy paper arguing for `k=1000`, but I did not have access to the corresponding detailed paper arguing against it. To preserve neutrality, I could not reasonably reproduce an advocacy section containing only the pro paper, so I omitted that section and instead tried to present the substantive arguments from both perspectives as neutrally as possible.

I only became aware of Neil Davies' detailed case against raising `k` after submitting this Info Action. Having now read it in full, I greatly appreciate the work and analysis that went into it and agree with many of its arguments. Had both the pro and contra advocacy papers been available to me when I created this poll, I would have included both as paired references.

I therefore want to explicitly thank Neil Davies (PNSol) for his work and encourage SPOs and DReps considering this question to read his analysis:

https://docs.google.com/document/d/1qwOc91ENr8Vi7Faw1hnWpJaMWxXnYhoX25Sm8bal0l8

For these reasons, I vote **NO** on raising `stakePoolTargetNum` from 500 to 1000.
