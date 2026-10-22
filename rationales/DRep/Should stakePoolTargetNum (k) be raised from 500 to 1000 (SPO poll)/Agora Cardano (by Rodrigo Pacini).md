<!-- url: https://dreptalk.com/vote-rationale/0c3f7d1b53ef7b8e3e257f6a199b393305de423d9033d792eda8f6f2e5c68d3d.json -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Should stakePoolTargetNum (k) be raised from 500 to 1000 (SPO poll)
**Vote:** Yes
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

# Governance Action Review [EN]

**Governance Action:** Should stakePoolTargetNum (k) be raised from 500 to 1000? (SPO poll)

**Type:** Info Action

**Vote: YES**

## 1. Introduction

This Info Action seeks to determine whether Cardano Stake Pool Operators (SPOs) support proceeding with a subsequent Parameter Change Governance Action to increase `stakePoolTargetNum` (`k`) from 500 to 1000.

The parameter determines the target number of fully saturated pools in Cardano's reward mechanism. Increasing `k` would halve the relative saturation point, from 0.2% to 0.1% of circulating ADA, changing the economic incentives associated with stake delegation without increasing the total rewards available.

The initiative follows a 2023 SPO poll that combined changes to `k` and `minPoolCost`. This consultation isolates `k` to obtain a specific mandate.

SPO votes are weighted by stake under CIP-1694 voting semantics. More than 50% of applicable active SPO voting stake must explicitly support the proposal to establish the intended mandate. Abstentions are excluded from active voting stake, while registered stake that does not vote effectively counts against reaching the threshold.

DReps may participate and provide voting rationales, but their votes do not determine whether the SPO mandate has been established.

As an Info Action, the proposal does not directly modify protocol parameters. A successful result would establish support for proceeding with a separate Parameter Change Governance Action. The majority standard is an interpretative criterion for the consultation, not the formal on-chain ratification threshold for Info Actions.

## 2. Governance Action Analysis

### Positive aspects

The increase of `stakePoolTargetNum` from 500 to 1000 offers an opportunity to change economic incentives that have contributed to preserving the existing distribution of delegated stake.

One of the central problems is delegator inertia. Once ADA holders delegate their stake to an operator, they may remain with that operator for years without reconsidering their choice, even when alternatives exist. This persistence can result from convenience, trust in the operator, limited monitoring of rewards, insufficient incentives to move, poor visibility of alternatives, or the experience provided by staking wallets.

The *Staking Census*, published in June 2026 by IOG's Cardano Business Unit, identified approximately 42% of the delegations examined as long-lasting, remaining unchanged for more than 201 epochs. The study also identified a substantial decline in delegation-switching frequency compared with earlier periods.

These findings reinforce the relevance of inertia, although they do not establish precisely how delegators would respond to a change in `k`.

Increasing the parameter would approximately halve the economically relevant saturation threshold. Pools operating near the previous threshold could become oversaturated, reducing the potential rewards available to their delegators relative to otherwise comparable unsaturated pools.

Delegators would consequently have a financial incentive to reconsider decisions made under different economic conditions.

The protocol would not compel anyone to change pools. Nevertheless, the economic conditions sustaining previous delegation decisions would change.

This incentive to reconsider existing delegations has value in itself. It creates an opportunity to disrupt behavioral inertia that otherwise contributes to preserving the current distribution of stake.

Importantly, established operators would not necessarily retain all the stake delegated to them.

Multi-pool operators do not constitute a homogeneous group. There is a fundamental distinction between institutions that directly control substantial amounts of ADA delegated to their own pools and operators that depend primarily on delegations from independent community members.

Institutions controlling their own stake could respond to a lower saturation threshold by registering additional pools and redistributing their stake internally. They possess greater autonomy over these decisions.

Community-dependent multi-pool operators face different circumstances. They cannot unilaterally determine where independent delegators will move their ADA.

Registering additional pools does not guarantee that existing delegators will follow. Some may choose independent operators, others may select different established operators, and others may remain with their original pools.

Consequently, the assumption that established multi-pool operators would automatically preserve their economic positions through operational fragmentation is not guaranteed.

This uncertainty creates a genuine opportunity for redistribution.

Smaller independent pools could particularly benefit from this process.

Pools operating substantially below the existing saturation threshold may remain below the new threshold after the change. Their current delegated stake would not disappear as a direct consequence of increasing `k`, and they would not automatically incur a new saturation penalty.

At the same time, these operators could become alternatives for delegators leaving pools affected by the reduced threshold.

Smaller operators could therefore preserve their existing delegation bases while gaining an opportunity to attract additional stake.

This potential benefit is particularly relevant given the economic difficulties experienced by independent SPOs over several years.

A favorable outcome would involve some delegators moving from oversaturated pools toward independent or less concentrated operators. Such movements could distribute stake among more economically independent entities, improve the competitiveness of smaller pools, reduce concentration in block-production power, and partially counteract years of economic consolidation.

This is the outcome regarded as more likely, or at least sufficiently likely to justify supporting the change.

The potential benefits do not depend on `k=1000` serving as a definitive solution to decentralization.

Complementary reforms could strengthen the incentives created by increasing `k`.

Changes to the pledge mechanism, including approaches associated with CIP-0050, could make the expansion of multi-pool operations less economically attractive by strengthening the relationship between operators' committed capital and staking rewards.

However, the present protocol does not impose a universally high minimum pledge requirement for every newly registered pool. Increasing `k` alone would not automatically require multi-pool operators to commit substantial additional quantities of ADA.

Any benefits from pledge reform would depend on the specific mechanism implemented.

Reducing `minPoolCost` is another potentially complementary measure. At the time of the deliberation, this parameter stood at 170 ADA. A separate Governance Action proposed reducing it to 75 ADA but expired in October 2026 without securing approval. An earlier attempt combining this reduction with changes to Plutus memory limits had also expired.

Reducing `minPoolCost` could provide SPOs with additional economic flexibility, while increasing `k` would alter saturation incentives and create opportunities for redistribution.

The measures address different aspects of the staking economy and need not be implemented together.

Support for increasing `k` is independent of prior approval of either reform. A future proposal to reduce `minPoolCost` would also receive support.

### Negative aspects

The maintenance of `k=500` for almost six years has contributed to preserving an economic environment that disproportionately favors operators who consolidated their positions during Cardano's earlier staking periods.

The parameter was initially set at 150 with the introduction of Shelley in 2020. It increased to 500 on December 6, 2020, during epoch 234.

A subsequent increase to 1000 had already been contemplated for March 2021. However, implementation was postponed amid concerns about staking incentives, particularly the possibility that established operators would respond by creating additional pools.

By October 2026, no further increase had occurred.

Cardano has therefore spent almost six years discussing changes to staking incentives without implementing the previously contemplated evolution of `k`.

During this period, established operators had opportunities to accumulate capital, delegated stake, operational infrastructure, reputation, market share, and the capacity to operate multiple pools.

Many of these advantages developed when rewards distributed from Cardano's reserves were substantially larger.

As reserve emissions progressively decline, newcomers face less favorable economic conditions than those encountered by operators who entered and consolidated their positions earlier.

These historical advantages do not imply that established operators obtained them improperly. Nevertheless, their timing and accumulated market positions create structural differences in competitive opportunities.

The current system tends to preserve these positions while many smaller operators struggle to achieve economically sustainable operations.

Numerous independent SPOs have left the ecosystem over the years, while others continue operating with limited profitability or losses.

The *Staking Census* identified a reduction in the segment of independent single-pool operators, from 555 pools representing 39.1% of stake to 291 pools representing 24.4%, within its methodological scope.

The study also identified growth in multi-pool operations, substantial stake concentration among institutional entities and established operators, and delegation behavior that often remains relatively insensitive to small economic differences.

These observations support the existence of structural concentration trends. They do not establish `k=500` as their sole cause.

Nevertheless, maintaining the parameter unchanged is not neutral. It preserves an existing structure of opportunities whose historical development has already produced significant problems.

The consequences of inaction must be evaluated alongside the risks of changing the parameter.

Over the years during which `k` remained unchanged, independent operators lost relative participation, multi-pool operations expanded, reserve emissions declined, and smaller SPOs experienced economic difficulties. Some operators exited the ecosystem, while delegator inertia helped preserve previous allocations of stake.

These developments cannot be attributed exclusively to `k`. They nevertheless form part of the economic environment in which the decision must now be made.

The possibility that established operators could preserve their positions after an increase does not, by itself, justify preserving the present conditions indefinitely.

After almost six years, further postponement also requires convincing justification.

There are additional concerns about Cardano's existing concentration of block-production power.

An entity-adjusted measurement identified during the deliberation indicated a Nakamoto coefficient of approximately 13–14, using a threshold of around 50% of stake and grouping pools under common economic control.

This estimate differs substantially from calculations based solely on individual pool identifiers.

A single operator controlling ten pools does not represent ten economically independent entities. Increasing the number of registered pools therefore does not, by itself, demonstrate improved decentralization.

The estimate requires methodological qualification, particularly regarding how affiliated operators are identified and grouped. Moreover, an exact historical decline in the Nakamoto coefficient has not been established using a consistent time-series methodology.

The current level of entity-level concentration nonetheless raises concerns.

There is an institutional tension between Cardano's emphasis on decentralization and the prolonged resistance to changes that could influence the economic distribution of block-production power.

Cardano has also supported initiatives to measure decentralization, including the Edinburgh Decentralisation Index. Measuring decentralization is important, but decentralization must also influence decisions affecting the actual distribution of power.

This issue extends to the broader hierarchy of ecosystem priorities.

During 2025 and 2026, Cardano funded initiatives to develop alternative node implementations, including Amaru in Rust and Dingo in Go.

Their approved 2026 Treasury withdrawals totaled ₳17,042,000, consisting of ₳10,142,000 for Amaru and ₳6,900,000 for Dingo.

The first alternative implementation provides a meaningful benefit by reducing dependence on a single software implementation and creating opportunities for technological diversity. Accordingly, the initial Amaru Governance Action received support.

However, the additional benefit of financing a second alternative implementation is less compelling when compared with other unresolved ecosystem problems.

Moving from one node implementation to two has a clearer justification in terms of reducing technological dependence. Moving from two implementations to three may produce a smaller marginal benefit that must be evaluated against competing priorities.

A third implementation is not inherently useless. The concern is whether additional technological redundancy deserves such priority while other fundamental economic and institutional problems remain insufficiently addressed.

The comparison does not equate software diversity with the decentralization of stake.

Software diversity addresses dependence on particular implementations and the risk of correlated software failures. Changes to `k` target economic incentives affecting stake distribution.

They are distinct dimensions of decentralization and resilience.

The institutional concern is the apparent difference in willingness to pursue these objectives under uncertainty.

Substantial resources have been allocated to technological diversity based on expected benefits, while changes intended to address economic concentration have faced prolonged resistance.

There is no established evidence that exactly the same governance participants supported Amaru and Dingo while opposing an increase in `k`; the decisions also involve different voting procedures and electorates.

Furthermore, alternative node implementations require Treasury funding, whereas changing `k` does not directly involve an equivalent development budget.

The comparison concerns institutional priorities and willingness to accept uncertainty, not direct financial equivalence.

Cardano's long-term economic sustainability presents an additional and potentially more fundamental challenge.

Blockchain utilization remains low, resulting in limited transaction-fee revenue. At the same time, emissions from reserves continue declining.

The *Staking Census* estimated that transaction fees accounted for approximately 0.2% of the rewards distributed per epoch during the period examined, demonstrating the network's substantial dependence on reserve emissions at that time.

This creates a fundamental question about the long-term financing of network security and decentralized operation if on-chain economic activity does not generate sufficient revenue.

A blockchain may possess several technologically independent node implementations and still face substantial economic difficulties if its utilization remains inadequate.

The purpose of a blockchain includes its effective use. Technological resilience and redundancy are important, but they cannot replace demand, economic activity, and sustainability.

Increasing `k` does not directly resolve insufficient transaction-fee revenue. Stake concentration and network revenue are distinct structural problems.

Both, however, deserve significant attention when determining governance priorities.

### Risks and concerns

Increasing `k` does not guarantee greater decentralization among economically independent operators.

The immediate protocol-level effects are identifiable, but the subsequent behavior of delegators and operators cannot be determined in advance.

Delegators affected by the reduced saturation threshold could remain with their original pools, move to another pool controlled by the same operator, select an independent pool, move to a different established operator, or disregard the economic incentive indefinitely.

Their decisions could be influenced by wallet interfaces, pool-ranking systems, perceived reliability, reputation, profitability, and the visibility of alternatives.

Different wallets could encourage different outcomes. Some might highlight additional pools affiliated with the original operator, while others might prioritize profitability, saturation levels, or the discovery of independent alternatives.

No outcome can be presumed for all participants.

Likewise, multi-pool operators possess different degrees of control over their delegated stake.

Operators controlling substantial quantities of their own ADA could establish additional pools and redistribute stake internally.

However, this response could introduce additional operating expenses, administrative complexity, pledge-related considerations, and reputational exposure.

Expanding an institution's own pool infrastructure rather than supporting community operators could also generate criticism.

These potential frictions do not establish that such operators would behave improperly, nor do they guarantee meaningful redistribution.

For community-dependent operators, establishing new pools does not ensure that independent delegators will follow.

Several broad outcomes remain possible.

Under a positive scenario, delegators redistribute stake toward independent or less concentrated operators, improving their competitive positions and potentially reducing economic concentration.

Under an approximately neutral scenario, established operators register additional pools and retain most existing delegations. The registered pool count increases, but concentration among economic entities remains largely unchanged.

This would represent a disappointing outcome in relation to the objective of redistributing stake, although it is not necessarily the worst technically possible result.

Under a negative scenario, delegation movements could benefit other established operators, concentration could persist or increase, or additional economic pressures could affect some operations.

These possibilities are acknowledged. However, the available arguments do not establish that the negative scenario is sufficiently probable to justify indefinitely maintaining `k=500`.

The current structure already produces costs, and the potential benefits of redistribution justify accepting uncertainty.

Smaller independent pools also require careful consideration.

Remaining below the new saturation threshold would prevent an automatic saturation penalty, but it would not guarantee unchanged profitability.

The level of reserve emissions, total delegated stake, reward distribution, pool performance, declared fees, and other components of the rewards mechanism would remain relevant.

Moreover, some established independent or community-operated pools could move above the new threshold despite having built their delegation bases through years of reliability, performance, reputation, and community engagement.

Therefore, increasing `k` should not imply that every smaller or independent operator would be economically unaffected.

The progressive decline of reserve emissions also creates a legitimate concern about SPO profitability.

Increasing the target number of economically relevant pools while total rewards decline could introduce additional financial pressure.

However, using declining emissions as a sufficient reason to postpone increasing `k` creates a temporal problem.

Reserve emissions will continue declining. If this is enough to reject the change today, the same argument could be repeated indefinitely, potentially under even less favorable future economic conditions.

Delaying reform does not necessarily improve the conditions for implementing it.

A legitimate economic concern should not become a permanent justification for preserving an unsatisfactory status quo.

Technical objections concerning pledge incentives also deserve recognition.

IOG research published in 2026 raised concerns that increasing `k` without first addressing structural weaknesses in pledge incentives and multi-pool expansion could predominantly create additional opportunities for established operators.

These objections identify relevant limitations of an isolated parameter change.

Stronger pledge incentives could complement the increase in `k` and reduce the attractiveness of expanding multi-pool operations. Nevertheless, the existing protocol does not automatically require substantial additional pledge for every newly established pool.

The support for `k=1000` is not conditional upon implementing these reforms first.

Similarly, the failure of earlier proposals to reduce `minPoolCost` does not justify rejecting this initiative. Both changes can be supported independently.

Simulations could provide useful information about potential outcomes, assumptions, and sensitivity to different variables.

However, models cannot predict with certainty the individual choices of millions of participants, and a live protocol change cannot be isolated from all other economic, technological, and behavioral developments.

The absence of simulations capable of establishing an exact future distribution of stake is not a condition for withholding support.

This does not diminish the value of technical investigation. It recognizes that governance decisions frequently involve irreducible uncertainty.

A similar uncertainty applies to alternative node implementations. Funding their development cannot establish in advance how many SPOs will adopt Amaru or Dingo, how widely those implementations will be distributed, or how much measurable resilience they will ultimately provide.

Neither software diversity nor increasing `k` automatically guarantees the intended structural outcome.

The presence of uncertainty does not, by itself, invalidate either initiative. Expected benefits, risks, costs, alternatives, and the consequences of inaction must be evaluated together.

The economic interests of participants must also be acknowledged.

Changing `k` affects the incentives and potentially the revenues of different SPOs. Operators benefiting from existing conditions therefore have material interests in the debate.

This does not mean that all opposition originates from private economic interests. Legitimate technical objections exist concerning reward calculations, pledge, operating profitability, and the ability of multi-pool operators to expand.

Nevertheless, distributive changes can encounter resistance because they alter established advantages.

Governance decisions must account for the interests of all ecosystem participants, including smaller operators facing entry barriers or difficulties maintaining economically viable operations.

No improper motivation should be attributed to particular operators without evidence.

## 3. Vote and Rationale

**Vote: YES**

The increase of `stakePoolTargetNum` from 500 to 1000 is supported as an opportunity to address an unsatisfactory economic structure that has remained largely unchanged for almost six years.

The current environment favors established operators, while independent pools have lost relative participation and face increasingly difficult economic conditions.

Reducing the saturation threshold would encourage delegators to reconsider long-standing decisions. This could disrupt inertia and create opportunities for a more decentralized distribution of stake.

Established multi-pool operators cannot necessarily preserve all their delegations by registering additional pools, particularly when they depend on independent community delegators. Smaller operators could retain their existing delegation bases and potentially attract redistributed stake.

The outcome is uncertain, but the opportunity for improvement is sufficiently significant to justify the risks. Maintaining `k=500` also has consequences, and further postponement does not resolve existing concentration or economic difficulties.

Simulations, prior pledge reforms, and reductions in `minPoolCost` are not conditions for support. Such measures may be useful or complementary, but they are not prerequisites.

The decision also reflects concerns about institutional priorities. Technological redundancy remains valuable, but additional node implementations cannot substitute for addressing stake concentration, low network utilization, and long-term economic sustainability.

The YES vote supports establishing a mandate to proceed toward `k=1000` through the appropriate subsequent governance process. It does not imply that the Info Action itself changes the parameter or that the eventual outcome is guaranteed.

## 4. Conclusion

Increasing `k` offers an opportunity to challenge economic inertia and established advantages while potentially improving the distribution of stake among independent operators.

Although greater decentralization is not guaranteed, the risks of change must be weighed against the accumulated consequences of maintaining the current system. The prolonged absence of reform and the structural difficulties already observed justify a YES vote.

---

# Revisão de Ação de Governança [PT]

**Ação de Governança:** Should stakePoolTargetNum (k) be raised from 500 to 1000? (SPO poll)

**Tipo:** Info Action

**Voto: YES**

## 1. Introdução

Esta Info Action busca determinar se os Stake Pool Operators (SPOs) da Cardano apoiam o avanço de uma futura Governance Action de alteração de parâmetro para aumentar o `stakePoolTargetNum` (`k`) de 500 para 1000.

O parâmetro determina o número-alvo de pools totalmente saturadas no mecanismo de recompensas da Cardano. Aumentar `k` reduziria pela metade o ponto relativo de saturação, de 0,2% para 0,1% da quantidade circulante de ADA, alterando os incentivos econômicos associados à delegação de stake sem aumentar o total de recompensas disponíveis.

A iniciativa sucede uma consulta aos SPOs realizada em 2023, que combinava alterações em `k` e `minPoolCost`. A consulta atual isola o parâmetro `k` para obter um mandato específico.

Os votos dos SPOs são ponderados pelo stake, seguindo as regras da CIP-1694. Mais de 50% do stake ativo aplicável à votação dos SPOs deve apoiar explicitamente a proposta para estabelecer o mandato pretendido. As abstenções são excluídas do stake ativo, enquanto o stake registrado que não participa efetivamente conta contra o alcance do limiar.

Os dReps podem participar e apresentar justificativas de voto, mas seus votos não determinam se o mandato dos SPOs foi estabelecido.

Por ser uma Info Action, a proposta não modifica diretamente os parâmetros do protocolo. Um resultado favorável estabeleceria apoio para avançar com uma Governance Action específica de alteração de parâmetro. O critério de maioria serve para interpretar a consulta e não constitui o limiar formal de ratificação on-chain das Info Actions.

## 2. Análise da Ação de Governança

### Aspectos positivos

O aumento de `stakePoolTargetNum` de 500 para 1000 oferece uma oportunidade de modificar incentivos econômicos que contribuíram para preservar a distribuição existente do stake delegado.

Um dos problemas centrais é a inércia dos delegadores. Depois que os detentores de ADA delegam seu stake a um operador, podem permanecer com ele durante anos sem reconsiderar sua escolha, mesmo quando existem alternativas. Essa persistência pode resultar da conveniência, da confiança no operador, do acompanhamento limitado das recompensas, da insuficiência de incentivos para mudar, da baixa visibilidade de alternativas ou da experiência oferecida pelas carteiras de staking.

O estudo *Staking Census*, publicado em junho de 2026 pela Cardano Business Unit da IOG, identificou aproximadamente 42% das delegações examinadas como duradouras, permanecendo inalteradas por mais de 201 epochs. O estudo também identificou uma redução substancial na frequência de mudanças de delegação em comparação com períodos anteriores.

Esses resultados reforçam a relevância da inércia, embora não estabeleçam precisamente como os delegadores reagiriam a uma alteração em `k`.

O aumento do parâmetro reduziria aproximadamente pela metade o limite de saturação economicamente relevante. Pools que operam próximas do limite anterior poderiam ficar saturadas acima do novo limite, reduzindo as recompensas potenciais disponíveis aos seus delegadores em comparação com pools não saturadas que apresentem condições equivalentes.

Consequentemente, os delegadores teriam um incentivo financeiro para reconsiderar decisões tomadas sob condições econômicas diferentes.

O protocolo não obrigaria ninguém a mudar de pool. Entretanto, as condições econômicas que sustentaram as decisões anteriores de delegação seriam modificadas.

Esse incentivo à reconsideração das delegações existentes possui valor por si só. Ele cria uma oportunidade de romper a inércia comportamental que, de outra forma, contribui para preservar a distribuição atual do stake.

É importante destacar que os operadores estabelecidos não necessariamente conseguiriam preservar todo o stake delegado a eles.

Operadores de múltiplas pools não constituem um grupo homogêneo. Existe uma distinção fundamental entre instituições que controlam diretamente quantidades substanciais de ADA delegadas às suas próprias pools e operadores que dependem principalmente das delegações de membros independentes da comunidade.

Instituições que controlam seu próprio stake poderiam responder à redução do limite de saturação registrando pools adicionais e redistribuindo internamente suas delegações. Elas possuem maior autonomia sobre essas decisões.

Operadores de múltiplas pools dependentes da comunidade enfrentam circunstâncias diferentes. Eles não podem determinar unilateralmente para onde os delegadores independentes movimentarão seu ADA.

Registrar pools adicionais não garante que os delegadores existentes migrarão para elas. Alguns poderão escolher operadores independentes, outros poderão selecionar diferentes operadores estabelecidos, enquanto outros poderão permanecer em suas pools originais.

Consequentemente, não existe garantia de que operadores estabelecidos com múltiplas pools preservariam automaticamente suas posições econômicas por meio da fragmentação operacional.

Essa incerteza cria uma oportunidade real de redistribuição.

Pools pequenas e independentes poderiam se beneficiar particularmente desse processo.

Pools que operam substancialmente abaixo do limite atual de saturação podem permanecer abaixo do novo limite após a alteração. Seu stake delegado atual não desapareceria como consequência direta do aumento de `k`, e elas não sofreriam automaticamente uma nova penalidade por saturação.

Ao mesmo tempo, esses operadores poderiam se tornar alternativas para delegadores que deixassem pools afetadas pela redução do limite.

Assim, operadores menores poderiam preservar suas bases existentes de delegação enquanto ganhariam uma oportunidade de atrair stake adicional.

Esse benefício potencial é particularmente relevante diante das dificuldades econômicas enfrentadas por SPOs independentes ao longo de vários anos.

Um resultado favorável envolveria a migração de parte dos delegadores de pools saturadas para operadores independentes ou menos concentrados. Esses movimentos poderiam distribuir stake entre mais entidades economicamente independentes, melhorar a competitividade de pools pequenas, reduzir a concentração do poder de produção de blocos e contrabalançar parcialmente anos de consolidação econômica.

Esse é o resultado considerado mais provável ou, pelo menos, suficientemente provável para justificar o apoio à mudança.

Os benefícios potenciais não dependem de `k=1000` funcionar como uma solução definitiva para a descentralização.

Reformas complementares poderiam fortalecer os incentivos criados pelo aumento de `k`.

Alterações no mecanismo de pledge, incluindo abordagens associadas à CIP-0050, poderiam tornar a expansão de operações com múltiplas pools menos atraente economicamente, fortalecendo a relação entre o capital comprometido pelos operadores e as recompensas de staking.

Entretanto, o protocolo atual não impõe um requisito universalmente elevado de pledge mínimo para cada nova pool registrada. O aumento de `k`, isoladamente, não obrigaria automaticamente operadores de múltiplas pools a comprometer quantidades adicionais substanciais de ADA.

Quaisquer benefícios de uma reforma do pledge dependeriam do mecanismo específico implementado.

A redução do `minPoolCost` representa outra medida potencialmente complementar. No momento da deliberação, esse parâmetro estava em 170 ADA. Uma Governance Action independente propôs sua redução para 75 ADA, mas expirou em outubro de 2026 sem obter aprovação. Uma tentativa anterior, que combinava essa redução com alterações nos limites de memória do Plutus, também havia expirado.

A redução do `minPoolCost` poderia proporcionar maior flexibilidade econômica aos SPOs, enquanto o aumento de `k` modificaria os incentivos de saturação e criaria oportunidades de redistribuição.

As medidas abordam diferentes aspectos da economia do staking e não precisam ser implementadas conjuntamente.

O apoio ao aumento de `k` independe da aprovação prévia de qualquer uma dessas reformas. Uma futura proposta de redução do `minPoolCost` também receberia apoio.

### Aspectos negativos

A manutenção de `k=500` durante quase seis anos contribuiu para preservar um ambiente econômico que favorece desproporcionalmente os operadores que consolidaram suas posições durante os primeiros períodos do staking na Cardano.

O parâmetro foi inicialmente estabelecido em 150 com a introdução de Shelley, em 2020. Foi aumentado para 500 em 6 de dezembro de 2020, durante a epoch 234.

Um aumento posterior para 1000 já havia sido contemplado para março de 2021. Entretanto, sua implementação foi adiada devido a preocupações com os incentivos de staking, particularmente a possibilidade de operadores estabelecidos responderem criando pools adicionais.

Até outubro de 2026, nenhum novo aumento havia ocorrido.

Portanto, a Cardano passou praticamente seis anos discutindo mudanças nos incentivos de staking sem implementar a evolução anteriormente contemplada para `k`.

Durante esse período, operadores estabelecidos tiveram oportunidades de acumular capital, stake delegado, infraestrutura operacional, reputação, participação de mercado e capacidade de administrar múltiplas pools.

Muitas dessas vantagens se desenvolveram quando as recompensas distribuídas a partir das reservas da Cardano eram substancialmente maiores.

À medida que as emissões provenientes das reservas diminuem progressivamente, novos participantes enfrentam condições econômicas menos favoráveis do que aquelas encontradas pelos operadores que ingressaram e consolidaram suas posições anteriormente.

Essas vantagens históricas não significam que os operadores estabelecidos as tenham obtido indevidamente. Entretanto, o momento de entrada e as posições de mercado acumuladas criam diferenças estruturais nas oportunidades competitivas.

O sistema atual tende a preservar essas posições, enquanto muitos operadores menores enfrentam dificuldades para alcançar operações economicamente sustentáveis.

Numerosos SPOs independentes abandonaram o ecossistema ao longo dos anos, enquanto outros continuam operando com rentabilidade limitada ou prejuízo.

O *Staking Census* identificou uma redução no segmento de operadores independentes de uma única pool, de 555 pools representando 39,1% do stake para 291 pools representando 24,4%, dentro de seu recorte metodológico.

O estudo também identificou crescimento das operações com múltiplas pools, concentração significativa de stake entre entidades institucionais e operadores estabelecidos, além de comportamentos de delegação frequentemente pouco sensíveis a pequenas diferenças econômicas.

Essas observações sustentam a existência de tendências estruturais de concentração. Elas não estabelecem `k=500` como sua única causa.

Entretanto, manter o parâmetro inalterado não é uma decisão neutra. Significa preservar uma estrutura existente de oportunidades cuja evolução histórica já produziu problemas significativos.

As consequências da inação precisam ser avaliadas juntamente com os riscos de modificar o parâmetro.

Durante os anos em que `k` permaneceu inalterado, operadores independentes perderam participação relativa, operações com múltiplas pools se expandiram, as emissões provenientes das reservas diminuíram e SPOs menores enfrentaram dificuldades econômicas. Alguns operadores abandonaram o ecossistema, enquanto a inércia dos delegadores contribuiu para preservar distribuições anteriores de stake.

Esses acontecimentos não podem ser atribuídos exclusivamente a `k`. Entretanto, fazem parte do ambiente econômico no qual a decisão atual precisa ser tomada.

A possibilidade de operadores estabelecidos preservarem suas posições após um aumento não justifica, por si só, a manutenção indefinida das condições atuais.

Depois de quase seis anos, novos adiamentos também exigem uma justificativa convincente.

Existem preocupações adicionais relacionadas à concentração atual do poder de produção de blocos na Cardano.

Uma medição ajustada por entidade, identificada durante a deliberação, indicou um coeficiente de Nakamoto de aproximadamente 13–14, utilizando um limiar próximo de 50% do stake e agrupando pools sob controle econômico comum.

Essa estimativa difere substancialmente dos cálculos baseados exclusivamente em identificadores individuais de pools.

Um único operador que controla dez pools não representa dez entidades economicamente independentes. Portanto, o aumento do número de pools registradas não demonstra, por si só, uma melhora na descentralização.

A estimativa exige qualificação metodológica, particularmente quanto à identificação e ao agrupamento de operadores relacionados. Além disso, uma queda histórica exata do coeficiente de Nakamoto não foi estabelecida por meio de uma série temporal metodologicamente consistente.

Ainda assim, o nível atual de concentração por entidade gera preocupações.

Existe uma tensão institucional entre a ênfase da Cardano na descentralização e a resistência prolongada a mudanças que poderiam influenciar a distribuição econômica do poder de produção de blocos.

A Cardano também apoiou iniciativas de mensuração da descentralização, incluindo o Edinburgh Decentralisation Index. Medir a descentralização é importante, mas ela também precisa influenciar decisões que afetam a distribuição efetiva de poder.

Essa questão se estende à hierarquia mais ampla de prioridades do ecossistema.

Durante 2025 e 2026, a Cardano financiou iniciativas de desenvolvimento de implementações alternativas do node, incluindo Amaru, em Rust, e Dingo, em Go.

As retiradas aprovadas do Tesouro em 2026 totalizaram ₳17.042.000, sendo ₳10.142.000 para Amaru e ₳6.900.000 para Dingo.

A primeira implementação alternativa oferece um benefício relevante ao reduzir a dependência de uma única implementação de software e criar oportunidades de diversidade tecnológica. Por essa razão, a Governance Action inicial da Amaru recebeu apoio.

Entretanto, o benefício adicional de financiar uma segunda implementação alternativa é menos convincente quando comparado com outros problemas ainda não resolvidos no ecossistema.

A transição de uma implementação de node para duas possui uma justificativa mais clara em termos de redução da dependência tecnológica. A transição de duas implementações para três pode produzir um benefício marginal menor, que precisa ser avaliado diante de prioridades concorrentes.

Uma terceira implementação não é inerentemente inútil. A preocupação é se a redundância tecnológica adicional merece tamanha prioridade enquanto outros problemas econômicos e institucionais fundamentais permanecem insuficientemente enfrentados.

A comparação não equipara diversidade de software à descentralização do stake.

A diversidade de software enfrenta a dependência de determinadas implementações e o risco de falhas de software correlacionadas. Alterações em `k` procuram modificar incentivos econômicos que influenciam a distribuição do stake.

São dimensões distintas da descentralização e da resiliência.

A preocupação institucional é a aparente diferença na disposição para perseguir esses objetivos sob incerteza.

Recursos substanciais foram destinados à diversidade tecnológica com base em benefícios esperados, enquanto mudanças destinadas a enfrentar a concentração econômica encontraram resistência prolongada.

Não existem evidências estabelecidas de que exatamente os mesmos participantes da governança apoiaram Amaru e Dingo enquanto se opuseram ao aumento de `k`. As decisões também envolvem diferentes procedimentos de votação e eleitorados.

Além disso, implementações alternativas do node exigem financiamento do Tesouro, enquanto a alteração de `k` não envolve diretamente um orçamento equivalente de desenvolvimento.

A comparação diz respeito às prioridades institucionais e à disposição para aceitar incertezas, não a uma equivalência financeira direta.

A sustentabilidade econômica da Cardano no longo prazo apresenta um desafio adicional e potencialmente mais fundamental.

A utilização da blockchain permanece baixa, resultando em receitas limitadas provenientes de taxas de transação. Ao mesmo tempo, as emissões provenientes das reservas continuam diminuindo.

O *Staking Census* estimou que as taxas de transação representavam aproximadamente 0,2% das recompensas distribuídas por epoch durante o período examinado, demonstrando a dependência substancial da rede em relação às emissões das reservas naquele momento.

Isso cria uma questão fundamental sobre o financiamento da segurança e da operação descentralizada da rede no longo prazo, caso a atividade econômica on-chain não produza receitas suficientes.

Uma blockchain pode possuir diversas implementações de node tecnologicamente independentes e ainda enfrentar dificuldades econômicas substanciais caso sua utilização permaneça insuficiente.

O propósito de uma blockchain inclui sua utilização efetiva. A resiliência e a redundância tecnológica são importantes, mas não podem substituir demanda, atividade econômica e sustentabilidade.

O aumento de `k` não resolve diretamente a arrecadação insuficiente de taxas de transação. A concentração do stake e a receita da rede são problemas estruturais distintos.

Ambos, entretanto, merecem atenção significativa na definição das prioridades de governança.

### Riscos e preocupações

O aumento de `k` não garante maior descentralização entre operadores economicamente independentes.

Os efeitos imediatos sobre o protocolo são identificáveis, mas o comportamento posterior dos delegadores e operadores não pode ser determinado antecipadamente.

Delegadores afetados pela redução do limite de saturação poderiam permanecer em suas pools originais, migrar para outra pool controlada pelo mesmo operador, selecionar uma pool independente, migrar para outro operador estabelecido ou ignorar o incentivo econômico por tempo indeterminado.

Suas decisões poderiam ser influenciadas pelas interfaces das carteiras, pelos sistemas de classificação de pools, pela percepção de confiabilidade, reputação, rentabilidade e visibilidade de alternativas.

Diferentes carteiras poderiam incentivar resultados diferentes. Algumas poderiam destacar pools adicionais vinculadas ao operador original, enquanto outras poderiam priorizar rentabilidade, níveis de saturação ou descoberta de alternativas independentes.

Nenhum resultado pode ser presumido para todos os participantes.

Da mesma forma, operadores de múltiplas pools possuem diferentes graus de controle sobre o stake delegado.

Operadores que controlam quantidades substanciais de ADA própria poderiam estabelecer pools adicionais e redistribuir internamente seu stake.

Entretanto, essa resposta poderia introduzir despesas operacionais adicionais, maior complexidade administrativa, considerações relacionadas ao pledge e exposição reputacional.

A expansão da infraestrutura própria de pools de uma instituição, em vez do apoio a operadores comunitários, também poderia gerar críticas.

Essas possíveis fricções não estabelecem que tais operadores agiriam indevidamente, nem garantem uma redistribuição significativa.

Para operadores dependentes da comunidade, estabelecer novas pools não assegura que delegadores independentes os acompanharão.

Vários resultados gerais permanecem possíveis.

Em um cenário positivo, delegadores redistribuem stake para operadores independentes ou menos concentrados, melhorando suas posições competitivas e potencialmente reduzindo a concentração econômica.

Em um cenário aproximadamente neutro, operadores estabelecidos registram pools adicionais e preservam a maior parte das delegações existentes. O número de pools registradas aumenta, mas a concentração entre entidades econômicas permanece amplamente inalterada.

Esse seria um resultado desfavorável em relação ao objetivo de redistribuir stake, embora não necessariamente o pior resultado tecnicamente possível.

Em um cenário negativo, movimentos de delegação poderiam beneficiar outros operadores estabelecidos, a concentração poderia persistir ou aumentar, ou pressões econômicas adicionais poderiam afetar algumas operações.

Essas possibilidades são reconhecidas. Entretanto, os argumentos disponíveis não estabelecem que o cenário negativo seja suficientemente provável para justificar a manutenção indefinida de `k=500`.

A estrutura atual já produz custos, e os benefícios potenciais da redistribuição justificam aceitar a incerteza.

Pools pequenas e independentes também exigem atenção cuidadosa.

Permanecer abaixo do novo limite de saturação impediria uma penalidade automática por saturação, mas não garantiria rentabilidade inalterada.

O nível das emissões provenientes das reservas, o total de stake delegado, a distribuição das recompensas, o desempenho das pools, as taxas declaradas e outros componentes do mecanismo de recompensas continuariam relevantes.

Além disso, algumas pools independentes ou comunitárias estabelecidas poderiam ultrapassar o novo limite, apesar de terem construído suas bases de delegação durante anos de confiabilidade, desempenho, reputação e envolvimento comunitário.

Portanto, o aumento de `k` não deve implicar que todos os operadores pequenos ou independentes permaneceriam economicamente inalterados.

A redução progressiva das emissões provenientes das reservas também cria uma preocupação legítima em relação à rentabilidade dos SPOs.

Aumentar o número-alvo de pools economicamente relevantes enquanto as recompensas totais diminuem poderia introduzir pressões financeiras adicionais.

Entretanto, utilizar a redução das emissões como motivo suficiente para adiar o aumento de `k` cria um problema temporal.

As emissões provenientes das reservas continuarão diminuindo. Se isso for suficiente para rejeitar a mudança hoje, o mesmo argumento poderá ser repetido indefinidamente, potencialmente sob condições econômicas futuras ainda menos favoráveis.

Adiar a reforma não melhora necessariamente as condições para sua implementação.

Uma preocupação econômica legítima não deve se transformar em justificativa permanente para preservar um status quo insatisfatório.

Objeções técnicas relacionadas aos incentivos de pledge também merecem reconhecimento.

Pesquisas publicadas pela IOG em 2026 levantaram preocupações de que o aumento de `k`, sem corrigir previamente fragilidades estruturais nos incentivos de pledge e na expansão de operações com múltiplas pools, poderia criar oportunidades adicionais predominantemente para operadores estabelecidos.

Essas objeções identificam limitações relevantes de uma alteração isolada do parâmetro.

Incentivos mais fortes associados ao pledge poderiam complementar o aumento de `k` e reduzir a atratividade da expansão de operações com múltiplas pools. Entretanto, o protocolo atual não exige automaticamente um aporte substancial de pledge adicional para cada nova pool estabelecida.

O apoio a `k=1000` não está condicionado à implementação prévia dessas reformas.

Da mesma forma, a ausência de aprovação das propostas anteriores de redução do `minPoolCost` não justifica rejeitar esta iniciativa. Ambas as mudanças podem receber apoio independentemente.

Simulações poderiam oferecer informações úteis sobre resultados potenciais, premissas e sensibilidade a diferentes variáveis.

Entretanto, modelos não conseguem prever com certeza as escolhas individuais de milhões de participantes, e uma alteração de protocolo em uma rede em funcionamento não pode ser isolada de todos os demais acontecimentos econômicos, tecnológicos e comportamentais.

A ausência de simulações capazes de estabelecer uma distribuição futura exata do stake não constitui condição para negar apoio.

Isso não diminui o valor da investigação técnica. Reconhece que decisões de governança frequentemente envolvem incertezas que não podem ser eliminadas.

Incerteza semelhante se aplica às implementações alternativas do node. O financiamento de seu desenvolvimento não permite estabelecer antecipadamente quantos SPOs adotarão Amaru ou Dingo, quão amplamente essas implementações serão distribuídas ou quanta resiliência mensurável proporcionarão.

Nem a diversidade de software nem o aumento de `k` garantem automaticamente o resultado estrutural pretendido.

A presença de incerteza não invalida, por si só, nenhuma dessas iniciativas. Benefícios esperados, riscos, custos, alternativas e consequências da inação precisam ser avaliados em conjunto.

Os interesses econômicos dos participantes também precisam ser reconhecidos.

A alteração de `k` afeta os incentivos e potencialmente as receitas de diferentes SPOs. Portanto, operadores beneficiados pelas condições existentes possuem interesses materiais no debate.

Isso não significa que toda oposição tenha origem em interesses econômicos particulares. Existem objeções técnicas legítimas relacionadas ao cálculo das recompensas, ao pledge, à rentabilidade operacional e à capacidade de expansão de operadores de múltiplas pools.

Entretanto, mudanças distributivas podem enfrentar resistência justamente porque alteram vantagens consolidadas.

As decisões de governança precisam considerar os interesses de todos os participantes do ecossistema, inclusive operadores menores que enfrentam barreiras de entrada ou dificuldades para manter operações economicamente viáveis.

Nenhuma motivação indevida deve ser atribuída a operadores específicos sem evidências.

## 3. Voto e Justificativa

**Voto: YES**

O aumento de `stakePoolTargetNum` de 500 para 1000 recebe apoio como uma oportunidade de enfrentar uma estrutura econômica insatisfatória que permaneceu praticamente inalterada durante quase seis anos.

O ambiente atual favorece operadores estabelecidos, enquanto pools independentes perderam participação relativa e enfrentam condições econômicas cada vez mais difíceis.

A redução do limite de saturação incentivaria delegadores a reconsiderar decisões mantidas durante anos. Isso poderia romper a inércia e criar oportunidades para uma distribuição mais descentralizada do stake.

Operadores estabelecidos com múltiplas pools não necessariamente conseguiriam preservar todas as suas delegações registrando pools adicionais, particularmente quando dependem de delegadores independentes da comunidade. Operadores menores poderiam preservar suas bases existentes de delegação e potencialmente atrair stake redistribuído.

O resultado é incerto, mas a oportunidade de melhoria é suficientemente significativa para justificar os riscos. Manter `k=500` também possui consequências, e novos adiamentos não resolvem a concentração existente nem as dificuldades econômicas.

Simulações, reformas prévias do pledge e reduções do `minPoolCost` não constituem condições para o apoio. Essas medidas podem ser úteis ou complementares, mas não são pré-requisitos.

A decisão também reflete preocupações com as prioridades institucionais. A redundância tecnológica permanece valiosa, mas implementações adicionais do node não podem substituir o enfrentamento da concentração do stake, da baixa utilização da rede e da sustentabilidade econômica no longo prazo.

O voto YES apoia o estabelecimento de um mandato para avançar em direção a `k=1000` por meio do processo de governança subsequente apropriado. Não implica que a própria Info Action altere o parâmetro ou que o resultado final seja garantido.

## 4. Conclusão

O aumento de `k` oferece uma oportunidade de enfrentar a inércia econômica e as vantagens consolidadas, potencialmente melhorando a distribuição do stake entre operadores independentes.

Embora uma maior descentralização não seja garantida, os riscos da mudança precisam ser ponderados diante das consequências acumuladas da manutenção do sistema atual. A prolongada ausência de reformas e as dificuldades estruturais já observadas justificam o voto YES.
