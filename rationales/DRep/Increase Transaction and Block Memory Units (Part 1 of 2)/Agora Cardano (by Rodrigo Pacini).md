<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/Qmdh9GBBJKgBWPQ5toQ5mz9uMkMb3kJpycxqLb4Xxc4WUm -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Increase Transaction and Block Memory Units (Part 1 of 2)
**Vote:** Yes
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

RATIONALE[EN]

## 1. Introduction

A Parameter Update governance action is proposed to increase Plutus script memory unit limits for both per-transaction and per-block execution. The proposed parameter changes are: **maxTxExecutionUnits[memory]** from **14,000,000** to **16,500,000**, and **maxBlockExecutionUnits[memory]** from **62,000,000** to **72,000,000**. The intent is to increase flexibility for DApp developers by allowing more work to fit within the execution budget, while keeping per-transaction and per-block limits consistent. No other protocol parameters or Plutus cost model settings are proposed to change.

The change is presented as the first part of a two-step plan toward an overall 25% increase, with a later governance action expected to propose **17,500,000** (tx) and **77,500,000** (block), no less than two epochs after enactment. The change was recommended by Intersect’s Parameter Committee on **2025-05-08** and ratified by Intersect’s Technical Steering Committee on **2025-10-01**. Equivalent changes were enacted on Preview (October 2025) and PreProd (November 2025). The governance action states no specific security concerns, and reports benchmarking indicating adequate headroom and maintained Praos timing guarantees.

## 2. Governance Action Analysis

### Positive aspects

Less friction for developers, without changing how Plutus works. The main upside is practical: today, some projects can do what they need, but only by splitting logic into multiple steps, adding workarounds, or over-optimizing scripts in ways that hurt UX and increase complexity. Raising the per-transaction memory limit helps reduce that friction. This does not change Plutus semantics, the cost model, or consensus rules. It just allows slightly more work to fit inside the allowed execution "budget". “Budget” here means the network’s execution allowance: the maximum memory/time Plutus scripts may consume per transaction and per block. Raising it lets scripts do more work, but uses more computational capacity.


More execution capacity per block, without distorting block composition. The proposal keeps a consistent relationship between per-transaction and per-block limits. The point is not “cram more transactions per block”, but allow more expressive scripts per transaction while keeping overall block-level constraints coherent.

Technical evidence exists and is consistent across node versions. This proposal is supported by tests and benchmarking across node versions 10.2, 10.3, and more recently 10.6. These tests were run in a controlled and reproducible environment, using a synthetic worst-case workload where scripts deliberately consume 100% of the allowed memory budget under each tested configuration, including the increased limits. Across versions, results are consistent: the main impact shows up as increased block adoption time (validation and processing), while end-to-end propagation remains largely stable thanks to pipelining and early header announcements. In other words, the risk is not about larger blocks or diffusion failures, but about extra computation per block. This shows up as a performance cost, not a threat to consensus safety or Praos timing.

A staged change is a governance positive. Presenting this as Part 1 of a staged update signals restraint. It shows awareness that parameter changes should be incremental and observed, not pushed in one shot. It also creates a window (even if imperfect) to compare expectations vs reality before the next step.

Incremental rollout is a real operational win for SPO diversity. Even when a parameter change is “conservative”, the network still needs to absorb it across hundreds of SPOs running different setups and operating under different constraints. Doing this in stages (Part 1 → observe → Part 2) reduces the chance of sudden disruption, gives operators time to validate their configs, and makes the transition smoother across the long tail of SPO infrastructure. In other words: the staged approach isn’t just “nice governance framing”, it’s a practical way to avoid forcing heterogeneous operators to adapt overnight.

### Negative aspects

A practical “one-way door”, especially at the transaction level. The most significant downside is not short-term breakage, but asymmetry over time. While parameters are technically reversible, once applications and users begin to rely on higher per-transaction limits, reverting becomes socially and economically costly. Contracts and UX may implicitly depend on the new parameters setup, and reduction could break flows or degrade UX. Rollback might be feasible in the short term, there is a reversion plan in principle, which is positive, its feasibility is highly time-sensitive. If degradation is detected late, rollback becomes politically and operationally difficult.

Post-enactment monitoring is not expressed as clear public thresholds. Monitoring of the blockchain already exists and has existed for years. But the GA itself doesn’t clearly define “what would be bad enough to stop or revert”. Without explicit metrics and thresholds mentioned in the Governance Action, future debates risk turning into perception vs authority instead of objective signals.

More adoption-time pressure in the tail, especially under peak load. The most plausible technical downside is higher block adoption time per node. This doesn’t change raw geographic latency, but it adds processing time, which can amplify tail effects under load. In edge regions or weaker infra, that could marginally worsen adoption timing during busy periods. In practice, this is largely mitigated by normal SPO best practices (multiple relays, good peering, redundancy), so it’s more an operational consideration than a centralization alarm.

Demand signaling is still the weak. The attached survey (22 responses) shows support, especially for the per-transaction change, but it’s not strong evidence of ecosystem-wide demand. It helps, but it doesn’t prove scale. Stronger signals like real failure patterns, common blockers, or usage data would have reduced how much we’re relying on expert judgment.

Headroom exists, but it is weakly specified — and mistakes become hard to undo over time. The proposal relies on the idea that the network has sufficient spare capacity (“headroom”) to absorb a 25% increase in Plutus memory limits with manageable performance cost. Benchmarks and past observations support that this increase stays well within safe operating ranges today. However, the governance action does not clearly define where that margin ends: which metrics matter most, what level of degradation would be considered unacceptable, or what concrete signals would trigger concern. This matters because increasing execution limits is, over time, a practical one-way door. While rollback may be feasible shortly after enactment, once applications begin to rely on higher per-transaction budgets, reducing limits can break UX and established flows. If headroom is overestimated or conditions change and issues are detected late, reversal becomes politically and operationally costly. The risk is not immediate failure, but late discovery turning an adjustable parameter into a sticky decision without clear exit criteria. That said, multiple people directly involved with the governance action, including technical experts reached out to, indicated that available headroom is substantially larger than what this change consumes, and that the current execution budget is set very conservatively. Based on that guidance, this downside is viewed as less concerning for this increment. It is still kept because this change does consume part of a finite execution budget, and whenever capacity is spent, it is good practice to explicitly weigh the trade-off rather than treat headroom as unlimited by default.

## 3. Vote and Rationale

Vote: **YES**

After weighing the evidence, support is given for a YES vote for this governance action, for bounded reasons. The increase is conservative, staged, and supported by benchmarking and test validation. The main measurable impact is understood (adoption time), and the available data frames it as a performance cost that appears manageable, not a systemic risk.

At the same time, this is not a blank check for future increases. Execution budgets are easier to raise than to reduce later, especially once the ecosystem adapts. For that reason, Part 2 is expected to strengthen the “institutional discipline” side: clearer post-enactment observations, with concrete metrics and criteria for what would count as unacceptable degradation. Supporting Part 1 should raise the bar for Part 2, not lower it.

## 4. Conclusion

A YES vote is supported on the basis of a conservative, staged increase with benchmarking and test validation, with adoption time identified as the primary measurable impact and treated as a manageable performance cost rather than a systemic risk. Future increases are expected to be conditioned by clearer post-enactment observations, with concrete metrics and criteria for unacceptable degradation, given the practical “one-way door” dynamics of execution budget increases.

---

JUSTIFICATIVA[PT]

## 1. Introdução

Uma governance action de Parameter Update é proposta para aumentar os limites de unidades de memória de scripts Plutus, tanto por transação quanto por bloco. As mudanças de parâmetro propostas são: **maxTxExecutionUnits[memory]** de **14.000.000** para **16.500.000**, e **maxBlockExecutionUnits[memory]** de **62.000.000** para **72.000.000**. A intenção é aumentar a flexibilidade para desenvolvedores de DApps ao permitir que mais trabalho caiba dentro do orçamento de execução, mantendo consistentes os limites por transação e por bloco. Nenhum outro parâmetro de protocolo ou configuração do cost model do Plutus é proposto para mudança.

A mudança é apresentada como a primeira parte de um plano em duas etapas rumo a um aumento total de 25%, com uma governance action posterior esperada para propor **17.500.000** (tx) e **77.500.000** (bloco), não menos que dois epochs após a promulgação. A mudança foi recomendada pelo Parameter Committee da Intersect em **2025-05-08** e ratificada pelo Technical Steering Committee da Intersect em **2025-10-01**. Mudanças equivalentes foram promulgadas na Preview (outubro de 2025) e na PreProd (novembro de 2025). A governance action afirma não haver preocupações específicas de segurança e relata benchmarking indicando headroom adequado e garantias de timing do Praos mantidas.

## 2. Análise da Governance Action

### Aspectos positivos

Menos fricção para desenvolvedores, sem mudar como o Plutus funciona. O principal ganho é prático: hoje, alguns projetos conseguem fazer o que precisam, mas apenas dividindo a lógica em múltiplas etapas, adicionando workarounds, ou hiper-otimizando scripts de formas que prejudicam a UX e aumentam a complexidade. Aumentar o limite de memória por transação ajuda a reduzir essa fricção. Isso não muda a semântica do Plutus, o cost model, nem as regras de consenso. Apenas permite que um pouco mais de trabalho caiba dentro do “orçamento” de execução permitido. “Orçamento” aqui significa a margem de execução da rede: o máximo de memória/tempo que scripts Plutus podem consumir por transação e por bloco. Aumentar isso permite que scripts façam mais trabalho, mas consome mais capacidade computacional.

Mais capacidade de execução por bloco, sem distorcer a composição do bloco. A proposta mantém uma relação consistente entre os limites por transação e por bloco. O ponto não é “enfiar mais transações por bloco”, mas permitir scripts mais expressivos por transação, mantendo coerentes as restrições em nível de bloco.

Evidência técnica existe e é consistente entre versões de nó. Esta proposta é suportada por testes e benchmarking nas versões de nó 10.2, 10.3 e, mais recentemente, 10.6. Esses testes foram executados em um ambiente controlado e reprodutível, usando uma carga sintética de pior caso em que os scripts deliberadamente consomem 100% do orçamento de memória permitido sob cada configuração testada, incluindo os limites aumentados. Entre versões, os resultados são consistentes: o principal impacto aparece como aumento do tempo de adoção do bloco (validação e processamento), enquanto a propagação ponta a ponta permanece em grande parte estável graças a pipelining e anúncios antecipados de header. Em outras palavras, o risco não é sobre blocos maiores ou falhas de difusão, mas sobre computação extra por bloco. Isso aparece como um custo de performance, não como uma ameaça à segurança de consenso ou ao timing do Praos.

Uma mudança em etapas é um positivo de governança. Apresentar isso como Parte 1 de uma atualização em etapas sinaliza contenção. Mostra consciência de que mudanças de parâmetros devem ser incrementais e observadas, não empurradas de uma vez. Também cria uma janela (ainda que imperfeita) para comparar expectativa vs realidade antes do próximo passo.

Rollout incremental é um ganho operacional real para a diversidade de SPOs. Mesmo quando uma mudança de parâmetro é “conservadora”, a rede ainda precisa absorvê-la através de centenas de SPOs rodando setups diferentes e operando sob restrições diferentes. Fazer isso em etapas (Parte 1 → observar → Parte 2) reduz a chance de disrupção súbita, dá tempo para operadores validarem suas configs, e torna a transição mais suave ao longo da cauda longa da infraestrutura de SPOs. Em outras palavras: a abordagem em etapas não é só “um bom framing de governança”, é uma forma prática de evitar forçar operadores heterogêneos a se adaptar de um dia para o outro.

### Aspectos negativos

Uma “porta de mão única” prática, especialmente no nível de transação. O downside mais significativo não é quebra de curto prazo, mas assimetria ao longo do tempo. Embora parâmetros sejam tecnicamente reversíveis, uma vez que aplicações e usuários comecem a depender de limites maiores por transação, reverter se torna social e economicamente custoso. Contratos e UX podem depender implicitamente da nova configuração de parâmetros, e a redução pode quebrar fluxos ou degradar a UX. Rollback pode ser viável no curto prazo, há um plano de reversão em princípio, o que é positivo, sua viabilidade é altamente sensível ao tempo. Se a degradação for detectada tarde, rollback se torna politicamente e operacionalmente difícil.

Monitoramento pós-promulgação não é expresso como limiares públicos claros. O monitoramento da blockchain já existe e existe há anos. Mas a própria GA não define claramente “o que seria ruim o suficiente para parar ou reverter”. Sem métricas e limiares explícitos mencionados na Governance Action, debates futuros correm o risco de virar percepção vs autoridade em vez de sinais objetivos.

Mais pressão de tempo de adoção na cauda, especialmente sob carga de pico. O downside técnico mais plausível é um tempo de adoção de bloco maior por nó. Isso não muda a latência geográfica bruta, mas adiciona tempo de processamento, o que pode amplificar efeitos de cauda sob carga. Em regiões de borda ou infraestrutura mais fraca, isso poderia piorar marginalmente o timing de adoção durante períodos de alta atividade. Na prática, isso é amplamente mitigado por boas práticas normais de SPOs (múltiplos relays, bom peering, redundância), então é mais uma consideração operacional do que um alarme de centralização.

Sinalização de demanda ainda é fraca. O survey anexado (22 respostas) mostra suporte, especialmente para a mudança por transação, mas não é evidência forte de demanda em escala de ecossistema. Ajuda, mas não prova escala. Sinais mais fortes como padrões reais de falha, bloqueios comuns, ou dados de uso teriam reduzido o quanto se está confiando em julgamento de especialistas.

Headroom existe, mas é fracamente especificado — e erros ficam difíceis de desfazer ao longo do tempo. A proposta depende da ideia de que a rede tem capacidade ociosa suficiente (“headroom”) para absorver um aumento de 25% nos limites de memória do Plutus com custo de performance administrável. Benchmarks e observações passadas suportam que esse aumento fica bem dentro de faixas operacionais seguras hoje. No entanto, a governance action não define claramente onde essa margem termina: quais métricas importam mais, qual nível de degradação seria considerado inaceitável, ou quais sinais concretos disparariam preocupação. Isso importa porque aumentar limites de execução é, ao longo do tempo, uma porta de mão única prática. Embora rollback possa ser viável logo após a promulgação, uma vez que aplicações comecem a depender de orçamentos maiores por transação, reduzir limites pode quebrar UX e fluxos estabelecidos. Se o headroom for superestimado ou condições mudarem e problemas forem detectados tarde, a reversão se torna politicamente e operacionalmente custosa. O risco não é falha imediata, mas descoberta tardia transformando um parâmetro ajustável em uma decisão “grudenta” sem critérios claros de saída. Dito isso, múltiplas pessoas diretamente envolvidas com a governance action, incluindo especialistas técnicos contatados, indicaram que o headroom disponível é substancialmente maior do que o que essa mudança consome, e que o orçamento atual de execução é definido de forma muito conservadora. Com base nessa orientação, esse downside é visto como menos preocupante para este incremento. Ele ainda é mantido porque esta mudança consome parte de um orçamento de execução finito, e sempre que capacidade é gasta, é boa prática ponderar explicitamente o trade-off em vez de tratar headroom como ilimitado por padrão.

## 3. Voto e Justificativa

Voto: **YES**

Depois de ponderar as evidências, o apoio é dado a um voto YES para esta governance action, por razões delimitadas. O aumento é conservador, em etapas, e suportado por benchmarking e validação em testes. O principal impacto mensurável é entendido (tempo de adoção), e os dados disponíveis o enquadram como um custo de performance que parece administrável, não um risco sistêmico.

Ao mesmo tempo, isso não é um cheque em branco para aumentos futuros. Orçamentos de execução são mais fáceis de aumentar do que de reduzir depois, especialmente uma vez que o ecossistema se adapta. Por essa razão, espera-se que a Parte 2 fortaleça o lado de “disciplina institucional”: observações pós-promulgação mais claras, com métricas concretas e critérios para o que contaria como degradação inaceitável. Apoiar a Parte 1 deve elevar a barra para a Parte 2, não baixá-la.

## 4. Conclusão

Um voto YES é apoiado com base em um aumento conservador e em etapas, com benchmarking e validação em testes, com tempo de adoção identificado como o principal impacto mensurável e tratado como um custo de performance administrável em vez de um risco sistêmico. Aumentos futuros são esperados como condicionados por observações pós-promulgação mais claras, com métricas concretas e critérios para degradação inaceitável, dadas as dinâmicas práticas de “porta de mão única” de aumentos de orçamento de execução.
