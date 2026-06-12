<!-- url: https://ipfs.io/ipfs/Qmbb1MrHfn1scG9H22CGWyqqHGFf5V6ypHGiJ4oYD3hnFR -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Cardano dOSPO and OMF Program
**Vote:** No
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

# Governance Action Report [EN]

## 1. Introduction

Cardano’s infrastructure depends on open-source software maintained by small teams and individual contributors, often without formal support, succession planning, or continuity funding. The Cardano dOSPO and Open Maintenance Framework proposal seeks to establish a community-governed, data-driven open-source sustainment architecture funded through a direct Treasury withdrawal.

The proposal requests 12,000,000 ADA over 36 months. It would be operated by an independent entity and overseen by two advisory councils: an External Open Source Advisory Council and a Technical Community Advisory Council. The program includes four main components: a Maintenance Fund for long-term retainer funding of high-risk infrastructure, a Maintainer Development program for structured mentor–mentee pipelines, a CodeForUs bounty program for targeted delivery work, and an Ecosystem Activation Reserve for contributor entry programs.

Selection is intended to follow published dependency centrality data rather than relationships. Reporting would be public and quarterly. The operator would be replaceable by community governance, and all programs include explicit sunset criteria.

## 2. Governance Action Analysis

### Positive aspects

Open-source maintenance, contributor sustainability, dependency risk, bus-factor reduction, and long-term ecosystem resilience are real and important issues for Cardano.

Cardano depends on open-source infrastructure across protocol libraries, developer tooling, wallet SDKs, indexers, shared CI infrastructure, and other components that are often maintained by small teams or individual contributors. A more systematic approach to identifying and supporting critical open-source dependencies is directionally valuable.

This proposal is significantly more structured than most Treasury Withdrawal Governance Actions. It contains work packages, milestones, budget categories, councils, reporting mechanisms, retainers, contributor pathways, several metrics and KPIs, bounty programs, ecosystem activation components, and a broader institutional design. Compared to many proposals, this is clearly more developed and more thoughtful.

In Work Package 2, the Tier 1, Tier 2, and Tier 3 retainer allocations are defensible. These are allocations to support open-source projects over medium or long periods, and the proposed ranges appear broadly reasonable for maintenance work. The idea of funding high-centrality, low-bus-factor projects through retainers makes sense, especially if the selection process is genuinely based on dependency risk rather than visibility, relationships, or lobbying capacity.

A strong argument exists in favor of the general initiative. Looking at already funded TWGAs such as Amaru, Dingo, and Pebble, as well as Intersect budget proposals with high approval percentages such as proposals from TxPipe and MLabs, the Cardano community has a real appetite for funding technical infrastructure and open-source work, especially for independent teams outside the founding entities.

The strongest argument for the OMF is not simply that Cardano does not fund open source. It does. The stronger argument is that Cardano tends to fund visible teams, while less visible but still important maintainers may remain unsupported. A data-driven fund based on dependency centrality, bus factor, and ecosystem risk could help correct that imbalance.

Another positive aspect is that the proposal is led by someone outside the founding entities. In a budget cycle where founding entities and adjacent organizations dominate a significant share of allocated funding, supporting independent ecosystem coordination can help preserve a healthier level of decentralization. Cardano should not rely only on founding entities or their surrounding institutional orbit to maintain critical infrastructure.

The concept is strong. The problem is real. The proposal is more detailed than most. The Tier 1, Tier 2, and Tier 3 retainer logic seems broadly reasonable. The independent nature of the initiative is positive. The idea of supporting less visible open-source contributors is valuable.

### Negative aspects

The current average quality of budget disclosure across TWGAs is unfortunately very low. Therefore, being better than average does not necessarily mean the proposal is sufficiently precise for a 12,000,000 ADA, 36-month Treasury withdrawal. This proposal is less poor than many others in terms of budget structure, but it still lacks important details needed to properly assess whether several allocations are coherent.

A central concern is that many budget lines do not provide enough information about expected workload, FTEs, hourly rates, time commitment, or operational assumptions. This makes it difficult to judge proportionality between cost and expected work.

In Work Package 3, the Maintainer Development Program defines participant stipends and program durations, but it does not clearly define the expected volume of work. The Core Infrastructure track appears to involve six-month participation with an average stipend of 17,500 ADA. The Tooling and DApp layer track appears to involve four-month participation with an average stipend of 10,000 ADA. However, without knowing whether participants are expected to contribute 5 hours per week, 15 hours per week, 20 hours per week, or something closer to full-time work, it is not possible to determine whether these stipends are low, reasonable, or excessive.

The proposal describes progression through a contributor ladder, documented check-ins, completion rates, and conversion to Trusted Committer status. These are useful concepts, but they do not replace a clear estimate of expected workload. A program of this size should define, at minimum, expected weekly commitment, contribution expectations, milestone criteria, conditions for continued stipend eligibility, and the difference between participation, completion, and meaningful technical contribution.

This issue is not limited to WP3. Similar concerns appear in WP4 and WP5, although the amounts are smaller. In WP4, the bounty structure is understandable, but it would still benefit from more information about the expected number of bounties, average bounty size, complexity tiers, evaluation process, and expected work volume. In WP5, the Summer of Code, hackathons, activation events, operations, and reserve are directionally reasonable, but the proposal would be stronger with more detail about staffing, event scope, operational workload, and how reserve funds would be activated.

The Technical Services and Program Management lines in WP2 are less convincing. The proposal allocates 900,000 ADA to technical services, including dependency audits, annual refreshes, SBOM generation, CHAOSS-aligned dashboard work, and hosting. It also allocates 300,000 ADA to WP2 program management, reporting, and council facilitation. These are activities where more precise estimates should be feasible. The proposal should provide assumptions about FTEs, hourly rates, months of work, technical scope, infrastructure costs, dashboard maintenance, and the distinction between technical execution and program administration.

As currently presented, these lines feel more like top-down estimates than bottom-up cost calculations. That reduces confidence. These costs are not necessarily excessive, but there is not enough information to judge them properly.

Work Package 1 raises similar concerns. Governance infrastructure, operational capacity, legal support, reporting, and advisory councils are understandable needs. Operations are not objectionable as a category. A program of this nature cannot run without management, administration, compliance, reporting, and coordination. However, the WP1 budget also lacks sufficient granularity. Staffing, operational costs, advisory council compensation, legal support, tooling, and governance facilitation should be broken down with clearer assumptions about roles, time commitment, rates, and overlap with program-specific management lines in other work packages.

This matters because WP1 funds the institutional layer, while WP2 and WP3 also contain program management and technical service lines. Without a clearer separation of responsibilities, it is difficult to know whether management costs are properly scoped or partially duplicated across work packages.

The proposal still lacks enough precision around workload, FTEs, hourly rates, technical service costs, project management costs, WP1 operations, WP3 stipends, and the expected volume of work in several program areas.

### Risks and concerns

The largest structural concern is the 36-month duration. This is a significant problem because it exceeds the practical time horizon of the current Net Change Limit. Even if technically allowed, committing funds for three years creates unnecessary opportunity costs in a limited-budget environment. A one-year version of the proposal, aligned with the remaining period of the current NCL, would be much more favorable.

Reserving or locking funds for long periods is not a good practice unless there is an exceptionally strong justification. Many teams could construct narratives to justify longer funding windows. If Cardano normalizes large multi-year withdrawals on the basis that a program “needs time,” it may create a concerning precedent for future Treasury governance.

A 12-month version would allow the program to prove its model while reducing risk. It could focus on forming the legal entity, constituting the councils, publishing conflict-of-interest policies, completing the dependency audit, publishing the scoring methodology, identifying the highest-risk dependencies, testing a limited retainer cohort, and demonstrating the reporting process. After that, a larger follow-up proposal would be easier to evaluate.

The ecosystem already appears willing to fund infrastructure and open-source development. This partially weakens the case that a dedicated Open Maintenance Fund is absolutely necessary. However, this willingness seems strongest for established teams with reputation, outreach capacity, strong social networks, and the ability to mobilize support. That does not necessarily solve the problem for lower-visibility maintainers or contributors who may be doing valuable open-source work without the same public reach or governance presence.

For that argument to be persuasive, the proposal could establish stronger safeguards to prevent the fund from being captured by already established and well-connected teams. If the same large or highly visible teams end up consuming most of the funding, the program would lose part of its justification. The proposal should include clearer safeguards such as entity-level caps, anti-double-funding rules, disclosure of other Treasury or Intersect funding received, conflict-of-interest policies, and prioritization criteria for underfunded critical dependencies.

Independence from founding entities is not enough by itself. An independent entity can also become a gatekeeper if its processes, budget, councils, selection methodology, and accountability mechanisms are not sufficiently clear. Supporting decentralization requires more than funding someone outside the usual institutions. It requires strong design.

The 36-month funding period is too long relative to the current NCL environment and creates opportunity costs that could have been avoided with a phased approach.

## 3. Vote and Rationale

Vote: NO.

The position is supportive of the problem statement and general direction, but critical of the current proposal design. The current position on the Cardano dOSPO and OMF Program is not based on rejecting the problem the proposal is trying to solve. Open-source maintenance, contributor sustainability, dependency risk, bus-factor reduction, and long-term ecosystem resilience are real and important issues for Cardano.

The proposal is directionally valuable but not sufficiently mature at its current scale and duration. The concept is strong. The problem is real. The proposal is more detailed than most. The Tier 1, Tier 2, and Tier 3 retainer logic seems broadly reasonable. The independent nature of the initiative is positive. The idea of supporting less visible open-source contributors is valuable.

However, the proposal still lacks enough precision around workload, FTEs, hourly rates, technical service costs, project management costs, WP1 operations, WP3 stipends, and the expected volume of work in several program areas. The 36-month funding period is also too long relative to the current NCL environment and creates opportunity costs that could have been avoided with a phased approach.

The preferred version would be a smaller 12-month pilot. That version should prove the governance model, publish the dependency methodology, establish the legal entity and councils, run a limited first cohort, test the retainer mechanism, demonstrate public reporting, and then return to the Treasury for renewal or expansion based on evidence.

There is no comfort in fully endorsing a 12,000,000 ADA, 36-month withdrawal without more granular cost assumptions and a shorter proof-of-concept phase, but the concept is positive and the vote would change to YES if the points above can be sorted out.

## 4. Conclusion

The proposal addresses a real and important problem for Cardano and presents a stronger structure than most Treasury Withdrawal Governance Actions. However, the current 12,000,000 ADA, 36-month design lacks sufficient budget granularity, workload assumptions, and phased risk control. A smaller 12-month pilot would be a more acceptable path.

# Relatório de Ação de Governança [PT]

## 1. Introdução

A infraestrutura da Cardano depende de software open-source mantido por pequenas equipes e contribuidores individuais, frequentemente sem suporte formal, planejamento de sucessão ou financiamento de continuidade. A proposta Cardano dOSPO e Open Maintenance Framework busca estabelecer uma arquitetura de sustentação open-source governada pela comunidade e orientada por dados, financiada por uma retirada direta do Tesouro.

A proposta solicita 12.000.000 ADA ao longo de 36 meses. Ela seria operada por uma entidade independente e supervisionada por dois conselhos consultivos: um External Open Source Advisory Council e um Technical Community Advisory Council. O programa inclui quatro componentes principais: um Maintenance Fund para financiamento de longo prazo por retainers de infraestrutura de alto risco, um Maintainer Development Program para pipelines estruturados de mentoria, um programa de bounties CodeForUs para entregas específicas e uma Ecosystem Activation Reserve para programas de entrada de contribuidores.

A seleção deve seguir dados publicados de centralidade de dependências, e não relações. O reporting seria público e trimestral. O operador poderia ser substituído por governança comunitária, e todos os programas incluem critérios explícitos de sunset.

## 2. Análise da Ação Governamental

### Aspectos positivos

Manutenção open-source, sustentabilidade de contribuidores, risco de dependências, redução de bus factor e resiliência de longo prazo do ecossistema são questões reais e importantes para a Cardano.

A Cardano depende de infraestrutura open-source em bibliotecas de protocolo, ferramentas de desenvolvimento, wallet SDKs, indexadores, infraestrutura compartilhada de CI e outros componentes que frequentemente são mantidos por pequenas equipes ou contribuidores individuais. Uma abordagem mais sistemática para identificar e apoiar dependências open-source críticas é direcionalmente valiosa.

Esta proposta é significativamente mais estruturada do que a maioria das Treasury Withdrawal Governance Actions. Ela contém work packages, milestones, categorias orçamentárias, conselhos, mecanismos de reporting, retainers, caminhos de contribuição, várias métricas e KPIs, programas de bounty, componentes de ativação do ecossistema e um desenho institucional mais amplo. Em comparação com muitas propostas, esta é claramente mais desenvolvida e mais cuidadosa.

No Work Package 2, as alocações de retainers Tier 1, Tier 2 e Tier 3 são defensáveis. Essas são alocações para apoiar projetos open-source por períodos médios ou longos, e as faixas propostas parecem amplamente razoáveis para trabalho de manutenção. A ideia de financiar projetos de alta centralidade e baixo bus factor por meio de retainers faz sentido, especialmente se o processo de seleção for genuinamente baseado em risco de dependência, e não em visibilidade, relações ou capacidade de lobby.

Há um argumento forte em favor da iniciativa geral. Observando TWGAs já financiadas, como Amaru, Dingo e Pebble, bem como propostas de orçamento da Intersect com altos percentuais de aprovação, como propostas da TxPipe e MLabs, fica claro que a comunidade Cardano tem apetite real por financiar infraestrutura técnica e trabalho open-source, especialmente para equipes independentes fora das entidades fundadoras.

O argumento mais forte para o OMF não é simplesmente que a Cardano não financia open source. Ela financia. O argumento mais forte é que a Cardano tende a financiar equipes visíveis, enquanto mantenedores menos visíveis, mas ainda importantes, podem permanecer sem suporte. Um fundo orientado por dados, baseado em centralidade de dependências, bus factor e risco ao ecossistema, poderia ajudar a corrigir esse desequilíbrio.

Outro aspecto positivo é que a proposta é liderada por alguém fora das entidades fundadoras. Em um ciclo orçamentário no qual entidades fundadoras e organizações adjacentes dominam uma parcela significativa do financiamento alocado, apoiar coordenação independente no ecossistema pode ajudar a preservar um nível mais saudável de descentralização. A Cardano não deveria depender apenas de entidades fundadoras ou de seu entorno institucional para manter infraestrutura crítica.

O conceito é forte. O problema é real. A proposta é mais detalhada do que a maioria. A lógica dos retainers Tier 1, Tier 2 e Tier 3 parece amplamente razoável. A natureza independente da iniciativa é positiva. A ideia de apoiar contribuidores open-source menos visíveis é valiosa.

### Aspectos negativos

A qualidade média atual de disclosure orçamentário entre TWGAs infelizmente é muito baixa. Portanto, ser melhor do que a média não significa necessariamente que a proposta seja suficientemente precisa para uma retirada do Tesouro de 12.000.000 ADA por 36 meses. Esta proposta é menos pobre do que muitas outras em termos de estrutura orçamentária, mas ainda carece de detalhes importantes necessários para avaliar adequadamente se várias alocações são coerentes.

Uma preocupação central é que muitas linhas orçamentárias não fornecem informação suficiente sobre workload esperado, FTEs, hourly rates, comprometimento de tempo ou premissas operacionais. Isso torna difícil julgar a proporcionalidade entre custo e trabalho esperado.

No Work Package 3, por exemplo, o Maintainer Development Program define stipends de participantes e durações do programa, mas não define claramente o volume esperado de trabalho. A trilha Core Infrastructure parece envolver participação de seis meses com stipend médio de 17.500 ADA. A trilha Tooling and DApp layer parece envolver participação de quatro meses com stipend médio de 10.000 ADA. No entanto, sem saber se os participantes devem contribuir 5 horas por semana, 15 horas por semana, 20 horas por semana ou algo mais próximo de trabalho em tempo integral, não é possível determinar se esses stipends são baixos, razoáveis ou excessivos.

A proposta descreve progressão por uma contributor ladder, check-ins documentados, completion rates e conversão para Trusted Committer status. Esses são conceitos úteis, mas não substituem uma estimativa clara do workload esperado. Um programa desse tamanho deveria definir, no mínimo, comprometimento semanal esperado, expectativas de contribuição, critérios de milestone, condições para elegibilidade contínua ao stipend e a diferença entre participação, completion e contribuição técnica significativa.

Esse problema não se limita ao WP3. Preocupações similares aparecem no WP4 e no WP5, embora os valores sejam menores. No WP4, a estrutura de bounty é compreensível, mas ainda se beneficiaria de mais informação sobre o número esperado de bounties, tamanho médio dos bounties, tiers de complexidade, processo de avaliação e volume esperado de trabalho. No WP5, Summer of Code, hackathons, eventos de ativação, operações e reserva são direcionalmente razoáveis, mas a proposta seria mais forte com mais detalhes sobre staffing, escopo dos eventos, workload operacional e como os fundos de reserva seriam ativados.

As linhas de Technical Services e Program Management no WP2 são menos convincentes. A proposta aloca 900.000 ADA para technical services, incluindo dependency audits, annual refreshes, geração de SBOM, trabalho de dashboard alinhado ao CHAOSS e hosting. Ela também aloca 300.000 ADA para WP2 program management, reporting e facilitação do conselho. Essas são atividades em que estimativas mais precisas deveriam ser viáveis. A proposta deveria fornecer premissas sobre FTEs, hourly rates, meses de trabalho, escopo técnico, custos de infraestrutura, manutenção do dashboard e a distinção entre execução técnica e administração do programa.

Como apresentadas atualmente, essas linhas parecem mais estimativas top-down do que cálculos de custo bottom-up. Isso reduz a confiança. Esses custos não são necessariamente excessivos, mas não há informação suficiente para julgá-los adequadamente.

O Work Package 1 levanta preocupações similares. Infraestrutura de governança, capacidade operacional, suporte jurídico, reporting e conselhos consultivos são necessidades compreensíveis. Operações não são uma categoria objetável. Um programa dessa natureza não pode funcionar sem gestão, administração, compliance, reporting e coordenação. No entanto, o orçamento do WP1 também carece de granularidade suficiente. Staffing, custos operacionais, compensação dos conselhos consultivos, suporte jurídico, tooling e facilitação de governança deveriam ser detalhados com premissas mais claras sobre papéis, comprometimento de tempo, rates e sobreposição com linhas de gestão específicas de programa em outros work packages.

Isso importa porque o WP1 financia a camada institucional, enquanto WP2 e WP3 também contêm linhas de program management e technical services. Sem uma separação mais clara de responsabilidades, é difícil saber se os custos de gestão estão adequadamente escopados ou parcialmente duplicados entre work packages.

A proposta ainda carece de precisão suficiente sobre workload, FTEs, hourly rates, custos de technical services, custos de project management, operações do WP1, stipends do WP3 e volume esperado de trabalho em várias áreas do programa.

### Riscos e preocupações

A maior preocupação estrutural é a duração de 36 meses. Isso é um problema significativo porque excede o horizonte temporal prático do Net Change Limit atual. Mesmo que seja tecnicamente permitido, comprometer fundos por três anos cria custos de oportunidade desnecessários em um ambiente de orçamento limitado. Uma versão de um ano da proposta, alinhada ao período restante do NCL atual, seria muito mais favorável.

Reservar ou travar fundos por longos períodos não é uma boa prática, salvo quando há uma justificativa excepcionalmente forte. Muitas equipes poderiam construir narrativas para justificar janelas de financiamento mais longas. Se a Cardano normalizar grandes retiradas plurianuais com base na ideia de que um programa “precisa de tempo”, isso pode criar um precedente preocupante para a governança futura do Tesouro.

Uma versão de 12 meses permitiria que o programa provasse seu modelo enquanto reduziria riscos. Ela poderia focar em formar a entidade legal, constituir os conselhos, publicar políticas de conflito de interesse, concluir o dependency audit, publicar a metodologia de scoring, identificar as dependências de maior risco, testar uma coorte limitada de retainers e demonstrar o processo de reporting. Depois disso, uma proposta maior de follow-up seria mais fácil de avaliar.

O ecossistema já parece disposto a financiar infraestrutura e desenvolvimento open-source. Isso enfraquece parcialmente o argumento de que um Open Maintenance Fund dedicado é absolutamente necessário. No entanto, essa disposição parece mais forte para equipes estabelecidas, com reputação, capacidade de outreach, redes sociais fortes e capacidade de mobilizar apoio. Isso não resolve necessariamente o problema de mantenedores ou contribuidores de menor visibilidade que podem estar realizando trabalho open-source valioso sem o mesmo alcance público ou presença na governança.

Para que esse argumento seja persuasivo, a proposta poderia estabelecer salvaguardas mais fortes para impedir que o fundo seja capturado por equipes já estabelecidas e bem conectadas. Se as mesmas equipes grandes ou altamente visíveis acabarem consumindo a maior parte do financiamento, o programa perderia parte de sua justificativa. A proposta deveria incluir salvaguardas mais claras, como limites por entidade, regras anti-double-funding, disclosure de outros financiamentos recebidos do Tesouro ou da Intersect, políticas de conflito de interesse e critérios de priorização para dependências críticas subfinanciadas.

Independência em relação às entidades fundadoras não é suficiente por si só. Uma entidade independente também pode se tornar gatekeeper se seus processos, orçamento, conselhos, metodologia de seleção e mecanismos de accountability não forem suficientemente claros. Apoiar descentralização exige mais do que financiar alguém fora das instituições usuais. Exige desenho forte.

O período de financiamento de 36 meses é longo demais em relação ao ambiente atual do NCL e cria custos de oportunidade que poderiam ter sido evitados com uma abordagem faseada.

## 3. Voto e Fundamentação

Voto: NO.

A posição é favorável ao problem statement e à direção geral, mas crítica ao desenho atual da proposta. A posição atual sobre o Cardano dOSPO and OMF Program não se baseia em rejeitar o problema que a proposta tenta resolver. Manutenção open-source, sustentabilidade de contribuidores, risco de dependências, redução de bus factor e resiliência de longo prazo do ecossistema são questões reais e importantes para a Cardano.

A proposta é direcionalmente valiosa, mas não suficientemente madura em sua escala e duração atuais. O conceito é forte. O problema é real. A proposta é mais detalhada do que a maioria. A lógica dos retainers Tier 1, Tier 2 e Tier 3 parece amplamente razoável. A natureza independente da iniciativa é positiva. A ideia de apoiar contribuidores open-source menos visíveis é valiosa.

No entanto, a proposta ainda carece de precisão suficiente sobre workload, FTEs, hourly rates, custos de technical services, custos de project management, operações do WP1, stipends do WP3 e volume esperado de trabalho em várias áreas do programa. O período de financiamento de 36 meses também é longo demais em relação ao ambiente atual do NCL e cria custos de oportunidade que poderiam ter sido evitados com uma abordagem faseada.

A versão preferida seria um piloto menor de 12 meses. Essa versão deveria provar o modelo de governança, publicar a metodologia de dependências, estabelecer a entidade legal e os conselhos, executar uma primeira coorte limitada, testar o mecanismo de retainer, demonstrar reporting público e depois retornar ao Tesouro para renovação ou expansão com base em evidências.

Não há conforto em endossar plenamente uma retirada de 12.000.000 ADA por 36 meses sem premissas de custo mais granulares e uma fase de proof-of-concept mais curta, mas o conceito é positivo e o voto mudaria para YES se os pontos acima puderem ser resolvidos.

## 4. Conclusão

A proposta aborda um problema real e importante para a Cardano e apresenta uma estrutura mais forte do que a maioria das Treasury Withdrawal Governance Actions. No entanto, o desenho atual de 12.000.000 ADA por 36 meses carece de granularidade orçamentária suficiente, premissas de workload e controle de risco faseado. Um piloto menor de 12 meses seria um caminho mais aceitável.
