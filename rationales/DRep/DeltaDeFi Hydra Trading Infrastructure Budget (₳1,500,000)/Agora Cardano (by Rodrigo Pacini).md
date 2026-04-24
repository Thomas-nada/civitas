<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmXcjaN8DWb6BsRHwUbqmsub9RHcXYhiFBX8MVqa9zZyrz -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** DeltaDeFi Hydra Trading Infrastructure Budget (₳1,500,000)
**Vote:** No
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

# Governance Action Report (EN)

## 1. Introduction

This Budget Info Action asks dReps and the Cardano community to signal support for a ₳1,500,000, 6-month budget to harden and scale DeltaDeFi, a Hydra-based, low-latency order-book exchange intended to provide a “CEX-grade” trading venue for ADA and Cardano native tokens (CNTs). The budget targets three tracks:

- Hardening the existing beta Hydra spot DEX into a production-grade venue (security reviews/audits, risk controls, monitoring/incident response, API stability, and a public status page)
- Scaling Hydra/indexing infrastructure and integrations so DeltaDeFi can be used as ecosystem infrastructure
- Delivering a Vision 2030 KPI Measurement Programme consisting of a baseline report, a public KPI dashboard, and a final 6-month progress report

The split is 80% for trading infrastructure and 20% for the KPI programme, plus ₳100,000 for administration and independent audit.

Funds are proposed to be released in three phases (start, month 3, month 6) and administered via a 4-of-6 multisig under a proposed DeltaDeFi Administration Committee, with a stated fund return policy if the project is stopped.

No treasury withdrawal is executed by this action; it only signals whether this budget direction is desirable in principle.

## 2. Governance Action Analysis

### Scope of what is being assessed

The proposal positions DeltaDeFi as a trading “venue” delivering a “CEX-grade” experience (low latency, fast execution, order book) using Hydra for throughput/latency, plus a data/dashboard layer to measure market quality.

The request is large (₳1.5M) and the text attempts to anchor part of its framing and KPIs to Cardano Vision 2030 (still under vote/refinement).

The institutional focus of this review is:

- Use-case coherence
- Centralization risk
- Treasury justification
- KPI adequacy/ambition
- Budget transparency
- Evidence of demand and liquidity
- Track record

### Upsides

#### A plausible Hydra use case

Low-latency and high-frequency trading applications are among cases where Hydra can be a natural fit: L2 absorbs fast operations (orders/cancellations/market data), while L1 acts as the settlement and security layer.

The L2 throughput KPI (order-of-magnitude L2 transactions) can serve as a practical demonstration of a Hydra use case in production, provided the metric is well-defined and resistant to “inflating numbers”.

#### Execution capacity and public, verifiable evidence (track record)

Two prior proposals related to DeltaDeFi (Catalyst, total ~₳500k) were identified as completed with publicly verifiable evidence:

- A functional MVP/testnet and open-source repositories (smart contracts/scripts and backend)
- Open-source SDKs in multiple languages with demos, plus a Python trading bot with a public session

This reduces “non-delivery” risk within the specific DeltaDeFi scope and reinforces engineering capability, documentation quality, and the ability to publish public artifacts.

Additionally, the team (SIDAN Lab) has a broader history of participation in Catalyst and ecosystem initiatives, with other deliveries and contributions beyond the two proposals directly tied to DeltaDeFi.

#### Tooling reputation (Mesh and documentation standards)

The team has a strong technical reputation in the ecosystem, including relevant contributions in developer tooling (e.g., Mesh), with a history of delivery and documentation.

This track record is an institutional strength: it increases confidence in implementation quality and the ability to produce reusable documentation and repositories.

#### An attempt at “observable DeFi” via baselines/dashboards

The proposal attempts to tie execution to market quality metrics (spread, slippage, CEX gap, etc.) and promises baselines/dashboards/reports.

Even if the product does not become a market leader, a public standard to measure “market quality” could benefit the ecosystem, as long as the methodology is clear, auditable, and reusable.

### Negative aspects

#### “CEX-grade venue” is a strong claim, but under-specified

“CEX-grade” implies strict operational requirements (observability, resilience, failover, SLOs, incident response, operational security, API stability, market data integrity).

The text uses the term as framing, but no explicit set of requirements/acceptance criteria was observed defining what “CEX-grade” means in operational metrics.

Without a definition, the term risks becoming aspirational marketing rather than a verifiable target.

#### Technical architecture and “feature scope” are insufficiently described

Even though a Catalyst-funded testnet already exists, this is a new, treasury-scale proposal. The proposal does not provide sufficient technical detail on:

- Which concrete features will be implemented (real increments vs generic “hardening”)
- The platform design in this new phase (matching, data infrastructure, indexers, Hydra integration)
- The operating model and technical governance in production

This matters because risk assessment (centralization, security, replicability, community participation) depends on design.

Without a clear technical scope, the proposal asks for trust where it should provide specification and evidence.

Minimum expectation: a technical appendix (or set of appendices) covering architecture, components, interfaces, and user-facing trust implications.

#### KPIs are insufficient to justify the scale of the investment

Targets for TVL, active traders, monthly volume, and revenue appear low relative to the ₳1.5M request, with a risk of delivering a “functional pilot” that later becomes a precedent for a larger follow-up request.

There is also the historical context: after years of funding DeFi-related proposals by multiple teams and contributors with resources from the treasury, mainly through Project Catalyst, the standard should be raised and recurring subsidies should not be extended indefinitely for products that should become financially sustainable and profitable without requiring repeated returns to Catalyst.

Under this context, “signs of life” are no longer an adequate KPI for large checks. The bar should be impact and sustainability, not mere functionality.

Metrics such as “protocol revenue” (e.g., 10k ADA/year) were interpreted as particularly weak to justify the allocation, even considering externalities.

#### Positive externalities are plausible but not operationalized

Possible arguments include: improved price discovery, lower slippage, reduced friction for broader DeFi, market-quality benchmarking, reduced reliance on CEX as a price source.

However, these effects were not translated into convincing, measurable KPIs (e.g., on-chain market share, share of volume on strategic pairs, spread/depth targets, integration targets with aggregators/routers, presence targets in relevant execution flows).

Without operationalization, externalities become difficult to audit.

#### Using Cardano Vision 2030 as an anchor before ratification/refinement

The proposal references Vision 2030, but the document is still under vote and its KPIs are explicitly subject to refinement.

This is seen as institutional premature anchoring: it creates an alignment framing without ensuring adherence to final KPIs that may be formalized/refined later.

Aligning with the roadmap is conceptually positive. The issue is using a “moving document” as a rhetorical pillar to justify treasury allocation without revisitable commitments.

### Risks and concerns

#### Conceptual tension: “DEX” vs potentially centralized architecture

A relevant conceptual critique applies: an order-book model with off-chain matching (potentially operated by infrastructure controlled by a single operator) can exhibit centralized characteristics, even if custody remains non-custodial.

This creates semantic misalignment risk: self-identifying as a DEX while core elements (matching/data infrastructure) may function as centralized services.

For an ecosystem that values decentralization, the proposal should be more explicit:

- Which components are permissionless
- Which are operated by the team
- Which are replicable by third parties
- What the progressive decentralization path is

#### Trust model / Hydra topology / user risk are poorly explained

Even for an L2 trading product, the trust model must be explicit:

- Who runs the Hydra Head?
- Must users be head participants, or are they “clients” of operators?
- What are the failure modes (operator offline, partial collusion, network partition)?
- Is there unilateral exit to L1 if the operator goes down?

Without this, the proposal leaves a gray zone where the user may be in a system that should be trust-minimized but becomes trust-shifted.

#### Decentralization and community participation as a counterbalance to centralization

Across several Cardano DEX designs, centralization is sometimes mitigated via infrastructure operated by third parties (e.g., SPOs acting as batchers/relayers/operators, depending on the design).

Here, it is unclear whether an analogous mechanism exists or whether there is any auditable path to broaden participation and reduce operational concentration. Without that, the system risks reinforcing a central bottleneck.

#### Structural dependency on liquidity and market makers: insufficient evidence

The proposal suggests improving market quality and attracting professional traders, but no robust evidence was observed of:

- Structured interviews/research with market makers
- LOIs/pilots/commitments (even non-binding)
- A clear diagnosis of MM blockers on Cardano (stablecoin rails, settlement risk, infra, operational compliance, etc.)
- A concrete liquidity bootstrapping strategy that does not rely on ongoing treasury funding

This is critical because a “CEX-grade venue” without liquidity becomes a “well-built but empty product”, and Cardano DeFi history already shows a risk of chronic treasury dependence.

#### Throughput analysis: unclear math and unit definition (risk of “inflating the KPI”)

A throughput section was identified that mixes:

- A “theoretical L1 tx/month ceiling” (derived from TPS)
- A “gap” to reach a target (3x)
- The “contribution” of an L2 transactions KPI as a percentage of that gap

Problems:

- The “gap” (e.g., 18M) is not transparently derived
- Assumptions and rounding are not stated
- There may be a unit mismatch: L1 throughput is used to give weight to L2 transactions, which only makes sense if the KPI formally considers “L1+L2 activity”, not only L1

Without a clear methodology, the section reads as quantitative narrative rather than evidence.

### Transparency and accountability failures

#### Budget: insufficient granularity for any treasury standard

Even with a macro split (Hydra/trading infra; baseline+dashboard; admin+audit), the proposal lacks minimal breakdown:

- Headcount by function and time allocation
- Cost/rate assumptions
- Monthly burn rate
- Infrastructure/observability costs (cloud, indexers, storage, data)
- Independent audit scope and cost (what is audited, by whom, criteria)
- Contingency and risks

This prevents proportionality evaluation and overlap identification with previously funded work.

#### KPI Measurement Program / dashboards: high cost and potential redundancy with ecosystem solutions

Allocating ~20% of the budget to dashboards is difficult to justify given analytics solutions already being developed/adopted in the ecosystem (e.g., Dune and related tooling), which can produce many of the metrics (TVL, volume, MAU, transactions) with lower marginal cost and public reusability.

If additional analytics are needed, a neutral, ecosystem-wide initiative would be more appropriate than embedding a large dashboards line into a single venue’s budget.

#### Responsibility mapping and technical workstreams

Without a breakdown, it is unclear whether critical areas (SRE/ops, security, data infra, indexing, matching engine, etc.) have sufficient capacity. Therefore, it is not possible to judge whether “CEX-grade” is achievable within the proposed time and budget.

#### Evidence and annexes are incomplete for the requested amount

Even with the track record identified, the GA does not appear to have fully attached/referenced:

- Links and IDs for prior proposals
- Consolidated evidence of what was delivered
- A structured “already paid vs new ask” diff
- Organized learnings and technical gaps

For ₳1.5M, the evidence package should be substantially stronger.

### Institutional considerations on the Treasury

#### Public goods vs subsidizing private commercial models

The treasury should prioritize public goods, open source, and common infrastructure, avoiding recurring funding of profit-oriented private businesses without clear terms.

Subsidy can be justified as a strategic initial contribution, but not as chronic dependence.

#### Lack of clear policy and “narratives to legitimize withdrawals”

The lack of shared policy encourages proposals to fit narratives (e.g., Vision 2030) to legitimize large withdrawals. The larger the check, the higher the accountability requirements should be:

- Ambitious KPIs
- Granular budgets
- Demand evidence
- Technical transparency

#### What is “Unknown” and must be explicitly marked

- Evidence of real demand from market makers and professional traders via API (method, LOIs, pilots)
- A concrete liquidity bootstrapping plan without chronic treasury dependence
- Operational definition of “CEX-grade” (SLOs, uptime, incident response, status page)
- Rigorous methodology for market-quality KPIs (baseline, attribution, verification, auditability)
- Formal methodology for throughput analysis (gap, assumptions, L1 vs L2 unit)
- Budget breakdown and team allocation by workstream
- Progressive decentralization plan and community participation (what is centralized today and how it evolves)
- Technical scope of this new phase: new features and architectural changes vs generic “hardening”

#### Objective questions and requirements for the proposer

- Full budget pack: headcount/rates/monthly burn/infra/audit scope/contingency
- “Delivered vs new” map: what was funded in Catalyst vs what is requested now and why
- “CEX-grade” definition: measurable SLOs and acceptance criteria (p95 latency, uptime, error budgets, failover, incident playbooks)
- Liquidity/MM: structured evidence, blockers, and commitment signals (or acquisition plan)
- KPI revisions: targets calibrated to the amount, including market quality (spread/depth/slippage), relative adoption (on-chain market share), and sustainability
- Throughput methodology: fix units, derive the gap transparently, and add anti-inflation criteria for L2 transactions
- Technical architecture: appendices with design and user-facing trust implications
- Decentralization: clarify what is permissionless/replicable by third parties and whether there is a participation mechanism (e.g., external operators) to counterbalance centralization

## 3. Vote and Rationale

**Vote: NO**

There is technical merit and real delivery track record: the team ships artifacts and demonstrates engineering capability. The Hydra trading use case is plausible and could serve as a production proof point.

However, the current package fails basic requirements to justify treasury-scale support: low-impact KPIs, insufficient budget detail, weak demand and liquidity evidence, and missing technical detail needed to assess centralization, trust model, and community participation. The dashboards/KPI measurement line also appears expensive and potentially redundant.

Alignment with Vision 2030 is conceptually positive but institutionally weak due to reliance on a moving document and refinable KPIs, which can function as rhetorical framing without revisitable commitments.

## 4. Conclusion

Technical merit and delivery capability are present, and the Hydra trading use case is plausible as a production proof point. Treasury-scale support is not justified under the current package due to low-impact KPIs, insufficient budget granularity, weak liquidity/market-maker demand evidence, and missing technical detail needed to evaluate centralization and the trust model.

# Relatório de Ação de Governança (PT-BR)

## 1. Introdução

Esta Budget Info Action solicita que dReps e a comunidade Cardano sinalizem apoio a um orçamento de ₳1.500.000 por 6 meses para reforçar e escalar a DeltaDeFi, uma exchange de livro de ordens baseada em Hydra, de baixa latência, destinada a oferecer um “venue” de negociação com padrão “CEX-grade” para ADA e ativos nativos da Cardano (CNTs). O orçamento mira três frentes:

- Endurecimento da Hydra spot DEX atualmente em beta para um nível de produção (revisões/auditorias de segurança, controles de risco, monitoramento/resposta a incidentes, estabilidade de API e uma página pública de status)
- Escalonamento de infraestrutura de Hydra/indexação e integrações para que a DeltaDeFi possa ser usada como infraestrutura do ecossistema
- Entrega de um Programa de Mensuração de KPIs da Visão 2030 composto por um relatório de baseline, um dashboard público de KPIs e um relatório final de progresso ao fim de 6 meses

A divisão proposta é 80% para infraestrutura de trading e 20% para o programa de KPIs, além de ₳100.000 para administração e auditoria independente.

Os fundos são propostos para liberação em três fases (início, mês 3, mês 6) e administração via multisig 4-de-6 sob um Comitê de Administração da DeltaDeFi proposto, com uma política declarada de devolução de fundos caso o projeto seja interrompido.

Nenhum saque do tesouro é executado por esta ação; ela apenas sinaliza se essa direção orçamentária é desejável em princípio.

## 2. Análise da Ação de Governança

### Escopo do que está sendo avaliado

A proposta posiciona a DeltaDeFi como um “venue” de negociação entregando uma experiência “CEX-grade” (baixa latência, execução rápida, livro de ordens) usando Hydra para throughput/latência, além de uma camada de dados/dashboard para mensurar qualidade de mercado.

O pedido é grande (₳1,5M) e o texto tenta ancorar parte do seu framing e KPIs à Visão 2030 da Cardano (ainda em votação/refinamento).

O foco institucional desta revisão é:

- Coerência do caso de uso
- Risco de centralização
- Justificativa de tesouro
- Adequação/ambição de KPIs
- Transparência orçamentária
- Evidência de demanda e liquidez
- Histórico de entregas

### Pontos favoráveis

#### Um caso de uso plausível para Hydra

Aplicações de trading de baixa latência e alta frequência estão entre os casos em que Hydra pode ser um encaixe natural: a L2 absorve operações rápidas (ordens/cancelamentos/dados de mercado), enquanto a L1 atua como camada de liquidação e segurança.

O KPI de throughput em L2 (ordem de grandeza de transações em L2) pode servir como uma demonstração prática de um caso de uso de Hydra em produção, desde que a métrica seja bem definida e resistente a “inflar números”.

#### Capacidade de execução e evidências públicas e verificáveis (histórico)

Duas propostas anteriores relacionadas à DeltaDeFi (Catalyst, total ~₳500k) foram identificadas como concluídas com evidência publicamente verificável:

- Um MVP/testnet funcional e repositórios open source (contratos/scripts e backend)
- SDKs open source em múltiplas linguagens com demos, além de um bot de trading em Python com uma sessão pública

Isso reduz o risco de “não entrega” dentro do escopo específico da DeltaDeFi e reforça capacidade de engenharia, qualidade de documentação e habilidade de publicar artefatos públicos.

Além disso, a equipe (SIDAN Lab) tem histórico mais amplo de participação no Catalyst e em iniciativas do ecossistema, com outras entregas e contribuições além das duas propostas diretamente ligadas à DeltaDeFi.

#### Reputação em tooling (Mesh e padrões de documentação)

A equipe tem forte reputação técnica no ecossistema, incluindo contribuições relevantes em tooling para desenvolvedores (ex.: Mesh), com histórico de entrega e documentação.

Esse track record é uma força institucional: aumenta a confiança na qualidade de implementação e na capacidade de produzir documentação e repositórios reutilizáveis.

#### Uma tentativa de “DeFi observável” via baselines/dashboards

A proposta tenta vincular execução a métricas de qualidade de mercado (spread, slippage, gap vs CEX, etc.) e promete baselines/dashboards/relatórios.

Mesmo que o produto não se torne líder de mercado, um padrão público para mensurar “qualidade de mercado” poderia beneficiar o ecossistema, desde que a metodologia seja clara, auditável e reutilizável.

### Aspectos negativos

#### “CEX-grade” é uma afirmação forte, mas subespecificada

“CEX-grade” implica requisitos operacionais rígidos (observabilidade, resiliência, failover, SLOs, resposta a incidentes, segurança operacional, estabilidade de API, integridade de dados de mercado).

O texto usa o termo como framing, mas não foi observado um conjunto explícito de requisitos/critérios de aceitação definindo o que “CEX-grade” significa em métricas operacionais.

Sem uma definição, o termo corre o risco de virar marketing aspiracional em vez de um alvo verificável.

#### Arquitetura técnica e “escopo de features” são descritos de forma insuficiente

Embora já exista um testnet financiado pelo Catalyst, esta é uma nova proposta em escala de tesouro. A proposta não fornece detalhe técnico suficiente sobre:

- Quais features concretas serão implementadas (incrementos reais vs “hardening” genérico)
- O design da plataforma nesta nova fase (matching, infraestrutura de dados, indexers, integração com Hydra)
- O modelo operacional e a governança técnica em produção

Isso importa porque a avaliação de risco (centralização, segurança, replicabilidade, participação comunitária) depende do design.

Sem um escopo técnico claro, a proposta pede confiança onde deveria haver especificação e evidência.

Expectativa mínima: um apêndice técnico (ou conjunto de apêndices) cobrindo arquitetura, componentes, interfaces e implicações de confiança para o usuário.

#### KPIs são insuficientes para justificar a escala do investimento

Metas de TVL, traders ativos, volume mensal e receita parecem baixas em relação ao pedido de ₳1,5M, com risco de entregar um “piloto funcional” que depois vire precedente para um follow-up maior.

Há também um contexto histórico: após anos de financiamento de propostas ligadas a DeFi por múltiplos times e contribuidores com recursos do tesouro, principalmente através do Project Catalyst, é hora de elevar o padrão e evitar subsídios recorrentes e indefinidos para produtos que deveriam se tornar financeiramente sustentáveis e lucrativos sem depender de retornos sucessivos ao Catalyst.

Nesse cenário, “sinais de vida” não são mais um KPI adequado para cheques grandes. A barra deveria ser impacto e sustentabilidade, não mera funcionalidade.

Métricas como “receita de protocolo” (ex.: 10k ADA/ano) foram interpretadas como particularmente fracas para justificar a alocação, mesmo considerando externalidades.

#### Externalidades positivas são plausíveis, mas não operacionalizadas

Possíveis argumentos incluem: melhor descoberta de preço, menor slippage, menos fricção para DeFi mais amplo, benchmarking de qualidade de mercado, menor dependência de CEX como fonte de preço.

No entanto, esses efeitos não foram traduzidos em KPIs convincentes e mensuráveis (ex.: market share on-chain, participação de volume em pares estratégicos, metas de spread/profundidade, metas de integração com agregadores/routers, metas de presença em fluxos relevantes de execução).

Sem operacionalização, externalidades ficam difíceis de auditar.

#### Uso da Visão 2030 como âncora antes de ratificação/refinamento

A proposta referencia a Visão 2030, mas o documento ainda está em votação e seus KPIs são explicitamente sujeitos a refinamento.

Isso é visto como uma ancoragem institucional prematura: cria um framing de alinhamento sem assegurar aderência aos KPIs finais que podem ser formalizados/refinados depois.

Alinhar com o roadmap é conceitualmente positivo. O problema é usar um “documento em movimento” como pilar retórico para justificar alocação do tesouro sem compromissos revisáveis.

### Riscos e preocupações

#### Tensão conceitual: “DEX” vs arquitetura potencialmente centralizada

Uma crítica conceitual relevante se aplica: um modelo de livro de ordens com matching off-chain (potencialmente operado por infraestrutura controlada por um único operador) pode exibir características centralizadas, mesmo que a custódia permaneça não custodial.

Isso cria risco de desalinhamento semântico: autoidentificar-se como DEX enquanto elementos centrais (matching/infra de dados) podem funcionar como serviços centralizados.

Para um ecossistema que valoriza descentralização, a proposta deveria ser mais explícita:

- Quais componentes são permissionless
- Quais são operados pela equipe
- Quais são replicáveis por terceiros
- Qual é o caminho de descentralização progressiva

#### Modelo de confiança / topologia Hydra / risco ao usuário são pouco explicados

Mesmo para um produto de trading em L2, o modelo de confiança deve ser explícito:

- Quem roda a Hydra Head?
- Usuários precisam ser participantes da head ou são “clientes” de operadores?
- Quais são os modos de falha (operador offline, colusão parcial, partição de rede)?
- Existe saída unilateral para L1 se o operador cair?

Sem isso, a proposta deixa uma zona cinzenta em que o usuário pode estar em um sistema que deveria ser trust-minimized, mas se torna trust-shifted.

#### Descentralização e participação comunitária como contrapeso à centralização

Em vários designs de DEX na Cardano, a centralização às vezes é mitigada via infraestrutura operada por terceiros (ex.: SPOs atuando como batchers/relayers/operadores, dependendo do design).

Aqui, não está claro se existe um mecanismo análogo ou se há algum caminho auditável para ampliar participação e reduzir concentração operacional. Sem isso, o sistema pode reforçar um gargalo central.

#### Dependência estrutural de liquidez e market makers: evidência insuficiente

A proposta sugere melhorar qualidade de mercado e atrair traders profissionais, mas não foi observada evidência robusta de:

- Entrevistas/pesquisa estruturada com market makers
- LOIs/pilotos/compromissos (mesmo não vinculantes)
- Diagnóstico claro de blockers para MM na Cardano (rails de stablecoin, risco de settlement, infra, compliance operacional etc.)
- Estratégia concreta de bootstrap de liquidez que não dependa de funding recorrente do tesouro

Isso é crítico porque um “venue CEX-grade” sem liquidez vira um “produto bem construído porém vazio”, e o histórico de DeFi na Cardano já mostra risco de dependência crônica do tesouro.

#### Análise de throughput: matemática e definição de unidade pouco claras (risco de “inflar o KPI”)

Foi identificada uma seção de throughput que mistura:

- Um “teto teórico de tx/mês em L1” (derivado de TPS)
- Um “gap” para chegar a uma meta (3x)
- A “contribuição” de um KPI de transações em L2 como porcentagem desse gap

Problemas:

- O “gap” (ex.: 18M) não é derivado de forma transparente
- Premissas e arredondamentos não são declarados
- Pode haver mismatch de unidade: throughput de L1 é usado para dar peso a transações de L2, o que só faz sentido se o KPI formal considerar “atividade L1+L2”, não apenas L1

Sem metodologia clara, a seção parece narrativa quantitativa em vez de evidência.

### Falhas de transparência e accountability

#### Orçamento: granularidade insuficiente para qualquer padrão de tesouro

Mesmo com divisão macro (infra de trading; baseline+dashboard; admin+audit), a proposta carece de breakdown mínimo:

- Headcount por função e alocação de tempo
- Premissas de custo/taxa
- Burn rate mensal
- Custos de infraestrutura/observabilidade (cloud, indexers, storage, dados)
- Escopo e custo de auditoria independente (o que é auditado, por quem, critérios)
- Contingência e riscos

Isso impede avaliar proporcionalidade e identificar sobreposições com trabalho previamente financiado.

#### Programa de mensuração de KPIs / dashboards: alto custo e potencial redundância com soluções do ecossistema

Alocar ~20% do orçamento para dashboards é difícil de justificar dado que soluções de analytics já estão sendo desenvolvidas/adotadas no ecossistema (ex.: Dune e tooling relacionado), que podem produzir muitas das métricas (TVL, volume, MAU, transações) com menor custo marginal e maior reusabilidade pública.

Se analytics adicionais forem necessários, uma iniciativa neutra e de escopo ecossistêmico seria mais apropriada do que embutir uma linha grande de dashboards no orçamento de um único venue.

#### Mapeamento de responsabilidades e frentes técnicas

Sem um breakdown, não está claro se áreas críticas (SRE/ops, segurança, infra de dados, indexação, matching engine etc.) têm capacidade suficiente. Portanto, não é possível julgar se “CEX-grade” é atingível no tempo e orçamento propostos.

#### Evidências e anexos são incompletos para o valor solicitado

Mesmo com o track record identificado, a GA não parece ter anexado/referenciado integralmente:

- Links e IDs das propostas anteriores
- Evidência consolidada do que foi entregue
- Um diff estruturado de “já pago vs novo pedido”
- Aprendizados e gaps técnicos organizados

Para ₳1,5M, o pacote de evidência deveria ser substancialmente mais forte.

### Considerações institucionais sobre o Tesouro

#### Bens públicos vs subsidiar modelos comerciais privados

O tesouro deveria priorizar bens públicos, open source e infraestrutura comum, evitando financiar de forma recorrente negócios privados orientados a lucro sem termos claros.

Subsídio pode ser justificável como contribuição estratégica inicial, mas não como dependência crônica.

#### Ausência de política clara e “narrativas para legitimar saques”

A falta de política compartilhada incentiva propostas a se encaixarem em narrativas (ex.: Visão 2030) para legitimar grandes saques. Quanto maior o cheque, maiores devem ser os requisitos de accountability:

- KPIs ambiciosos
- Orçamento granular
- Evidência de demanda
- Transparência técnica

#### O que é “Unknown” e deve ser explicitamente marcado

- Evidência de demanda real de market makers e traders profissionais via API (método, LOIs, pilotos)
- Plano concreto de bootstrap de liquidez sem dependência crônica do tesouro
- Definição operacional de “CEX-grade” (SLOs, uptime, resposta a incidentes, status page)
- Metodologia rigorosa para KPIs de qualidade de mercado (baseline, atribuição, verificação, auditabilidade)
- Metodologia formal para análise de throughput (gap, premissas, unidade L1 vs L2)
- Breakdown orçamentário e alocação de equipe por workstream
- Plano de descentralização progressiva e participação comunitária (o que é centralizado hoje e como evolui)
- Escopo técnico desta nova fase: features novas e mudanças arquiteturais vs “hardening” genérico

#### Perguntas e requisitos objetivos ao proponente

- Pacote completo de orçamento: headcount/taxas/burn mensal/infra/escopo de auditoria/contingência
- Mapa “entregue vs novo”: o que foi financiado no Catalyst vs o que é pedido agora e por quê
- Definição de “CEX-grade”: SLOs e critérios de aceitação mensuráveis (p95, uptime, error budgets, failover, playbooks de incidente)
- Liquidez/MM: evidência estruturada, blockers e sinais de compromisso (ou plano de aquisição)
- Revisão de KPIs: metas calibradas ao valor, incluindo qualidade de mercado (spread/profundidade/slippage), adoção relativa (market share on-chain) e sustentabilidade
- Metodologia de throughput: corrigir unidades, derivar o gap de forma transparente e adicionar critérios anti-inflação para transações em L2
- Arquitetura técnica: apêndices com design e implicações de confiança para o usuário
- Descentralização: esclarecer o que é permissionless/replicável por terceiros e se existe mecanismo de participação (ex.: operadores externos) para contrabalançar centralização

## 3. Voto e Justificativa

**Voto: NÃO**

Há mérito técnico e histórico real de entregas: a equipe entrega artefatos e demonstra capacidade de engenharia. O caso de uso de trading em Hydra é plausível
