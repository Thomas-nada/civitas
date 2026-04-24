<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmRrDmydduarWiENLrYcfK7Q94ZU72rQKFWzcBjbe7eLDQ -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Cardano Budget Process Framework (facilitated by Intersect)
**Vote:** No
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

## English

### 1. Introduction

This Governance Information Action formalizes the Intersect Budget Process Framework for 2026 and future cycles, until modified. It does not approve spending directly. Instead, it defines the process through which Treasury-funded activities may be prepared, reviewed, consolidated, and later advanced.

The framework establishes a five-stage annual cycle. Before the process can begin, three prerequisites must already be active on-chain: a strategic vision and strategy, an approved Budget Process Metadata Info Action, and an active Net Change Limit (NCL). It then sets rules for proposal submission, structured data requirements, off-chain review and polling through Ekklesia, consolidation into Treasury Withdrawal Governance Actions, and execution and monitoring where Intersect acts as Administrator.

Its stated purpose is to improve consistency, transparency, predictability, and accountability in ecosystem budgeting, while aligning proposals with shared strategic priorities and providing a structured path from budget planning to Treasury execution.

### 2. Governance Action Review

## Upsides

### 2.1) The framework provides a necessary coordination layer for ecosystem budgeting

One of my strongest criticisms of prior NCL-related Governance Actions was precisely the absence of a non-binding coordination mechanism capable of mapping ecosystem funding needs before a spending ceiling is set. In my view, establishing an NCL in isolation, without first coordinating expected budget demand, strategic priorities, and treasury posture, is backwards.

That is why I see the core purpose of this Info Action as genuinely positive and necessary.

Cardano should not rely exclusively on independent actors submitting Treasury funding requests in an uncoordinated way while expecting the community to somehow infer priorities and trade-offs in real time. The ecosystem does not currently have the decision-making capacity to prioritize spending coherently without some form of structured coordination. There are too many variables, too many competing demands, and too much asymmetry in information.

Now that Cardano Vision 2030 / Cardano 2030 has been approved as a community-endorsed strategic reference,[2] the ecosystem finally has a shared “north star.” That makes a coordination framework not just useful, but essential. Without a shared strategic reference and a process to map expected budget needs against it, discussions around Treasury spending, and Treasury-related governance actions more broadly, become far more arbitrary than they should be.

From that perspective, this framework fills a gap that has existed for too long. Even if it still needs important improvements, its core function is valuable: it creates a non-binding coordination layer through which projected funding needs, strategic alignment, and community priorities can be surfaced before Treasury allocations are finalized.

Given that Intersect is currently the only actor attempting to operationalize this role at ecosystem level, I consider this framework a crucial instrument for Cardano at this stage. My criticisms of the proposal are therefore not a rejection of its purpose, but a recognition that this coordination layer is important enough that it should be made more robust before becoming the reference process for Treasury allocation.

### 2.2) The framework also gets an important design choice right: standardization and comparability (“apples-to-apples”)

Beyond the need for a coordination layer itself, one of the strongest aspects of this framework is its attempt to make proposals more comparable. If the ecosystem wants to coordinate a serious budget cycle, standardization is not optional. Without a common structure, proposals become difficult to compare, reviewers fall back on narrative persuasion, and selection becomes inconsistent and political. Intersect’s own recap of the 2025 cycle explicitly identified these problems, including inconsistent formats, multiple tools, difficulty comparing initiatives objectively, heavy review workload, and weak linkage between proposals and strategy.

#### Why tying proposals to Cardano Vision 2030 / Cardano 2030 pillars + KPIs is a real upgrade

Requiring proposers to state which strategic pillar(s) they are targeting and to connect their proposal to measurable ecosystem KPIs is one of the few scalable ways to anchor selection to shared outcomes instead of vague intuition. The framework explicitly encourages alignment with the Cardano Vision 2030 / Cardano 2030 strategic framework and asks proposers to identify measurable outcomes through KPIs.

This is also consistent with the already endorsed Info Action *“Cardano 2030: Vision, Mission, Strategy Framework and KPIs”* being used as a shared reference point for long-term direction and measurement.

#### Why “work package-based budgeting” helps (when implemented with clear boundaries)

The requirement to structure budgets around work packages, including scope, objectives, metrics, and cost breakdown by category, improves comparability and makes it harder to hide vague scope behind a single headline number. It also supports benchmarking across proposals: reviewers can compare expected value and cost structure more directly when proposals use the same logic.

That said, this still needs tighter definitions elsewhere in the framework to avoid bundling ambiguity. But as a budget transparency tool, work-package budgeting is the correct direction.

#### Why this matters institutionally

The goal is not to force “alignment theater.” The goal is to create a shared evaluation grammar so DReps can ask more consistent questions:

- Which Cardano 2030 pillar does this advance?
- Which KPI does it claim to affect, and by what mechanism?
- Is the scope broken down into components that are reviewable and comparable?

That is a much healthier baseline than simply asking whether something “sounds good for Cardano.”

## Downsides

### 2.3) Bundling risk remains unresolved, and the current “work package” framing may enable it

#### “Bundling” (what I mean here, and why it matters)

In this context, bundling is when multiple distinct workstreams, deliverables, or initiatives are packaged together and presented as a single unit for review or approval. The core risk is not necessarily bad intent. The risk is structural: when one package contains many different items, decision-makers are often pushed into an all-or-nothing choice.

A useful analogy is how unrelated or controversial provisions sometimes get inserted into large legislative bills as “riders” or hidden clauses. The bill may contain essential parts that most people support, but it can also carry additional items that receive less scrutiny because they are embedded inside a larger must-pass package. Even without malicious intent, the practical effect is reduced visibility and weaker item-by-item accountability.

The same dynamic applies to budget packages. When proposals are bundled, each sub-item may have been produced by different people, using different assumptions and methodologies, with varying levels of rigor and evidence. As a result, quality is uneven across the bundle: strong components can effectively carry weaker components, and reviewers cannot apply consistent scrutiny to every part under time constraints. This distorts merit-based evaluation, increases governance noise, and makes it harder to reject low-quality items without also blocking genuinely valuable work.

In the 2025 cycle, bundling repeatedly appeared as a practical failure mode: DReps were pressured into accepting “package deals” where rejecting weak components meant blocking higher-value components that happened to be bundled alongside them.

This framework does not clearly address that failure mode. More importantly, the way “work packages” are described can reasonably be read as enabling bundling within proposals, unless the framework explicitly restricts what a work package is and how it may be used.

The implied structure appears to allow multiple layers of aggregation:

`work package → proposal → consolidation into TWGAs (and potentially into multiple on-chain brackets based on support levels)`

That creates a risk of “compound compromise”: bundling inside a proposal, and bundling again at the consolidation stage.

This may not be the intended design. However, the current text leaves enough ambiguity that it should be clarified. If work packages are meant to improve budget transparency and review granularity, the framework should explicitly define:

- What qualifies as a work package, including scope boundaries, dependency requirements, and separability
- What does not qualify, such as unrelated streams combined for convenience
- When proposals should be split into separate submissions rather than bundled

If bundling is not intended, the Info Action should be rewritten to make that unambiguous and to establish a clear anti-bundling posture as a process expectation.

### 2.4) The framework depends heavily on “deep review” by DReps, but that assumption is unsustainable and unreliable

A framework is only as strong as its operating assumptions. This one relies on DReps performing a “Deep Review” stage to validate accuracy, compliance, and strategic alignment, an approach that has proven unsustainable and unreliable in practice over the last two years.

In practice, the 2025 cycle showed that review quality varies widely across DReps and that workload spikes lead to shortcuts. Many DReps do not consistently publish detailed rationales, and only a small subset performs deep, systematic analysis at scale. Under higher volume, this gap becomes more significant.

The Cardano ecosystem is effectively asking DReps to evaluate a large volume of proposals within a short time span, and those proposals should be assessed with at least a minimum standard of rigor, individually, on their own merits.

**No sampling, no skimming, no guesswork.**

Anything less is unacceptable, in my view, for a framework coordinating the allocation of tens of millions of dollars from a Treasury that is not infinite.

It is already clear that DReps face serious review overload during these stages. Treating bundling as a solution to that overload is not acceptable in my view. Bundling does not fix the underlying capacity problem; it mostly hides it. In that context, bundling is likely to incentivize shortcuts: incomplete review, limited scrutiny, and decisions driven more by packaging convenience than by merit.

This is a structural risk: the framework increases standardization and volume management, but it does not address the incentive and capacity constraints that determine whether “deep review” is realistic.

If the process intends to rely on deep review, it should include credible mechanisms to support it, such as:

- Incentive and reputation mechanisms that reward diligent review, not necessarily “funding” alone, so that DReps who invest dozens of hours into serious analysis receive something in return, such as reputation signals and/or optional funding mechanisms. The goal here is incentive alignment, not necessarily “paying DReps,” so this should not be framed as compensation by default
- Clear, non-binding review standards and minimum expectations, explicitly framed as guidance rather than enforceable rules, so the process does not pretend “deep review” exists when it often doesn’t. At minimum, the framework should define what “review” means in practice and what is acceptable when time is constrained. Examples of minimum expectations that should be discussed and documented
- Default behavior when a DRep cannot review: should “NO” be treated as a default when a DRep had no time to assess a proposal, or should the default be ABSTAIN / explicit non-participation? If some DReps have been using “NO” as a workload coping mechanism, the framework should address whether that is considered valid practice, since it materially changes the meaning of “NO.”
- Rationale expectations: should votes be expected to include at least a short rationale, even if non-binding? If the framework depends on review quality, requiring some minimal justification is the only way to distinguish “reviewed NO” from “unreviewed NO.”
- Minimum scrutiny threshold: what is the minimum a proposal should pass before it is treated as “reviewed”? For example, confirming scope clarity, deliverable specificity, budget structure sanity, and KPI claims being measurable rather than decorative
- Adopting a lightweight review template: a standardized checklist-style review format, even if optional, would reduce variance and make it easier for the community to compare assessments. This also makes it harder for “deep review” to degrade into partial reading and guesswork while still looking legitimate

#### Workload reality check

In the prior cycle, 194 proposals were submitted on Ekklesia.[3] With an off-chain advancement threshold that requires ≥67% support from participating DRep stake, the implied operating assumption is not simply that “someone” will review the backlog, but that a large share of DReps must engage with a large share of proposals for the process to function as designed. If many DReps do not meaningfully review most proposals, achieving that level of support becomes harder, and the system either incentivizes shallow, high-speed voting or fails to advance items consistently.

This tension should be addressed explicitly through workload-aware process design, such as structured division of review responsibilities by theme, SME recommendation layers, or staged triage, rather than assuming broad, deep engagement at scale under time pressure.

#### Suggestion (a workable precedent already exists)

A practical way to reduce overload without relying on bundling is to add a structured “subject-matter recommendation” layer inside the framework. A precedent already exists: in Fund 14, the Cardano Foundation introduced a pilot for an upcoming “Catalyst Representative” role, where subject-matter experts reviewed proposals within their domains and published recommendations to help voters navigate high proposal volume, while the Foundation explicitly did not vote on those recommendations.[4][5]

**Pilot context:**

> Read the full article: https://cardanofoundation.org/blog/catalyst-f14

A similar mechanism could be adapted for the ecosystem budget process: create an opt-in “Representative / SME Review” track where qualified experts, from established organizations and from the wider community, publish standardized, evidence-based reviews and shortlists by theme, such as Infrastructure, Governance tooling, Developer Growth, DeFi, and Interoperability, etc. This would not replace DRep judgment, but it would provide a credible, workload-aware way to improve diligence, reduce shallow voting, and help DReps focus attention where it matters.

Without these supports, KPI-based strategic alignment risks turning into a shallow compliance exercise rather than meaningful evaluation.

### 2.5) The framework is underspecified on NCL usage, contingencies, and emergency capacity

The framework describes allocating proposals in rank order up to the available Net Change Limit (NCL), but it does not clearly state what happens if the annual process consumes the available NCL capacity.

That creates a basic governance and risk-management question: what is the intended pathway for genuinely emergent or unforeseen needs during the same fiscal window?

The current framing also implies an additional operating assumption: that any project or proposer seeking Treasury funding within the current NCL period will either:

- Participate through this Intersect-facilitated pipeline
- Submit independently in parallel before Intersect completes its consolidation and TWGA submissions

If the practical intent is to consume the available NCL through the annual cycle, then there is little or no remaining fiscal space for anything outside that pipeline, unless a new NCL is proposed later.

Is that deliberate? If so, why? If not, what is the intended buffer?

If the process implicitly aims to “fill the NCL” through the annual budget cycle, then, unless a reserve is explicitly planned, the system is left with a limited set of options when emergencies arise:

- Defer or reject emergent initiatives regardless of urgency
- Treat “submit a new NCL” as the default escape valve

The second outcome is particularly concerning because it risks normalizing repeated NCL expansions whenever the ceiling becomes inconvenient, which undermines the credibility of the NCL as a coordination and discipline instrument.

I’m not opposed to coordination. The issue is that the current text does not explain the rationale for this apparent design choice, nor does it clearly describe how non-planned spending, emergencies, or time-sensitive opportunities are meant to be handled.

If the intent is not to consume the full NCL, the framework should say so explicitly and document a minimal policy posture, even if non-binding, such as:

- Whether a contingency / reserve margin is expected
- What qualifies as “emergent” versus “annual-cycle” spending
- How exceptions should be handled without turning NCL revision into routine practice

### 2.6) Requiring an “active NCL” upfront risks separating the spending ceiling from real budget demand

The framework treats an active Net Change Limit (NCL) as a prerequisite for launching the annual budget process. Constitutionally, that may be necessary. Strategically, however, it creates a sequencing problem: the spending ceiling is effectively locked in before the ecosystem has produced a structured view of funding demand for that same period.

If the purpose of this framework is to coordinate budgeting, the process should make the relationship between demand and the ceiling more explicit. Otherwise, the ecosystem ends up operating under a cap that may be justified mainly by inflow heuristics, for example “how much entered the treasury last year,” rather than by a deliberate budgeting posture.

A more coherent approach would include an explicit step that:

- Maps expected ecosystem funding needs for the relevant fiscal window, using standardized submissions and comparable data
- Evaluates that demand against strategic priorities, such as Vision 2030, and an explicit treasury policy posture, for example preserve principal versus runway control versus controlled drawdown
- Uses that structured view to inform what an appropriate NCL should be for the period, even if the final NCL still requires a separate on-chain action

Without that linkage, the budget process risks becoming a “best effort within whatever cap already exists,” instead of a coordinated system where the cap is set with clear reference to both strategy and realistic demand.

### 2.7) Submission contribution and minimum request thresholds reduce spam, but introduce access and incentive trade-offs

A submission contribution, a 1,000 ADA donation to the Treasury, can reduce low-effort submissions and spam. However, it may also exclude smaller or early-stage contributors who have credible ideas but limited capital. This becomes even more important in the current context: with Project Catalyst Funds 15 and 16 cancelled, community-level funding pathways are more constrained and many contributors are effectively “hungry” for viable routes to participate. In that environment, adding a fixed 1,000 ADA gate will predictably impose a cost on small contributors and reduce inclusivity.

If inclusion matters, the framework should clarify whether any support or alternative mechanism exists to cover this contribution for vetted cases. I’m not prescribing a specific design here, but even a basic pathway, such as some form of vetting or sponsorship model, would be better than treating the fee as an unavoidable barrier that smaller ecosystem contributors must simply absorb.

Similarly, a 100,000 ADA minimum request threshold may simplify workload management, but it can also create incentives for budget inflation to meet the floor. Even if this is acceptable pragmatically, it should be acknowledged explicitly as a trade-off, since it may discourage smaller, high-ROI initiatives and encourage unnecessary padding.

### 2.8) Missing linked public discussion: not acceptable for something that wants to be the ecosystem’s reference

For a framework that wants to become the ecosystem’s reference process, not having a formal linked discussion, whether on GovTool, a forum, or supporting sources, is not acceptable.

If the text claims broad consultation, then it should show:

- Sources
- Meeting notes
- Threads
- Records
- Budget Committee decisions
- What feedback was actually incorporated

Without that, social legitimacy is weak and the community is left in “trust me” mode.

### 3. Vote and Rationale

**Vote: NO**

The core purpose is positive and necessary. A coordination layer for ecosystem budgeting is needed, especially now that a shared strategic reference exists through Cardano Vision 2030 / Cardano 2030. A non-binding process that surfaces projected funding needs, strategic alignment, and community priorities before Treasury allocations are finalized fills a long-standing institutional gap.

Standardization and comparability also move in the right direction. Tying proposals to strategic pillars and KPIs and requiring work package-based budgeting improves the baseline for more consistent questions and better comparison across proposals.

Important structural weaknesses remain. Bundling risk is not clearly constrained and may be enabled by the current work package framing. Dependence on deep review by DReps is not realistic under present workload, incentive, and capacity conditions. NCL usage, contingency posture, and emergency capacity remain underspecified. An active NCL is required before the ecosystem has produced a structured view of funding demand for the same period, creating a sequencing problem between the ceiling and real budget needs.

The purpose is not rejected. The coordination function is considered important enough that the framework should be made more robust before becoming the reference process for Treasury allocation. A NO vote is therefore maintained until these issues are addressed. At minimum, these themes should be openly discussed and commented on, with an explanation of why they will not be addressed if that is the chosen path, especially given that roughly one year has already passed since the 2025 budget cycle.

Clearer anti-bundling definitions, more credible workload-aware review support, and a clearer policy posture on contingency, reserve space, and the relationship between demand and the NCL would directly address the most important weaknesses identified.

---

## Português

### 1. Introdução

Esta Governance Information Action formaliza o Intersect Budget Process Framework para 2026 e ciclos futuros, até que seja modificado. Ela não aprova gastos diretamente. Em vez disso, define o processo por meio do qual atividades financiadas pelo Tesouro podem ser preparadas, revisadas, consolidadas e posteriormente levadas adiante.

O framework estabelece um ciclo anual de cinco etapas. Antes que o processo possa começar, três pré-requisitos já devem estar ativos on-chain: uma visão e estratégia estratégicas, uma Budget Process Metadata Info Action aprovada e um Net Change Limit (NCL) ativo. Em seguida, ele define regras para submissão de propostas, exigências de dados estruturados, revisão e votação off-chain via Ekklesia, consolidação em Treasury Withdrawal Governance Actions, e execução e monitoramento com a Intersect atuando como Administradora.

Seu propósito declarado é melhorar a consistência, a transparência, a previsibilidade e a accountability no orçamento do ecossistema, ao mesmo tempo em que alinha propostas a prioridades estratégicas compartilhadas e fornece um caminho estruturado desde o planejamento orçamentário até a execução via Tesouro.

### 2. Revisão da Governance Action

## Pontos positivos

### 2.1) O framework fornece uma camada de coordenação necessária para o orçamento do ecossistema

Uma das minhas críticas mais fortes a Governance Actions anteriores relacionadas ao NCL foi precisamente a ausência de um mecanismo de coordenação não vinculante capaz de mapear as necessidades de financiamento do ecossistema antes que um teto de gastos fosse definido. Na minha visão, estabelecer um NCL de forma isolada, sem antes coordenar a demanda orçamentária esperada, as prioridades estratégicas e a postura do Tesouro, é inverter a lógica.

É por isso que vejo o propósito central desta Info Action como genuinamente positivo e necessário.

A Cardano não deveria depender exclusivamente de atores independentes submetendo pedidos de financiamento ao Tesouro de forma descoordenada, enquanto se espera que a comunidade de alguma forma infira prioridades e trade-offs em tempo real. O ecossistema atualmente não tem capacidade decisória para priorizar gastos de forma coerente sem algum tipo de coordenação estruturada. Há variáveis demais, demandas concorrentes demais e assimetria de informação demais.

Agora que o Cardano Vision 2030 / Cardano 2030 foi aprovado como uma referência estratégica endossada pela comunidade,[2] o ecossistema finalmente tem uma “estrela do norte” compartilhada. Isso torna um framework de coordenação não apenas útil, mas essencial. Sem uma referência estratégica comum e um processo para mapear as necessidades orçamentárias esperadas em relação a ela, as discussões sobre gastos do Tesouro, e sobre Governance Actions relacionadas ao Tesouro de forma mais ampla, tornam-se muito mais arbitrárias do que deveriam ser.

Sob essa perspectiva, este framework preenche uma lacuna que existe há tempo demais. Mesmo que ainda precise de melhorias importantes, sua função central é valiosa: ele cria uma camada de coordenação não vinculante por meio da qual necessidades projetadas de financiamento, alinhamento estratégico e prioridades da comunidade podem ser trazidos à tona antes que as alocações do Tesouro sejam finalizadas.

Considerando que a Intersect é atualmente o único ator tentando operacionalizar esse papel em nível de ecossistema, considero este framework um instrumento crucial para a Cardano neste estágio. Minhas críticas à proposta, portanto, não são uma rejeição do seu propósito, mas um reconhecimento de que essa camada de coordenação é importante o suficiente para que deva ser tornada mais robusta antes de se tornar o processo de referência para alocação do Tesouro.

### 2.2) O framework também acerta em uma escolha importante de design: padronização e comparabilidade (“comparar maçãs com maçãs”)

Além da necessidade de uma camada de coordenação em si, um dos aspectos mais fortes deste framework é sua tentativa de tornar as propostas mais comparáveis. Se o ecossistema quer coordenar um ciclo orçamentário sério, padronização não é opcional. Sem uma estrutura comum, as propostas se tornam difíceis de comparar, os revisores recorrem à persuasão narrativa, e a seleção se torna inconsistente e política. O próprio recap da Intersect sobre o ciclo de 2025 identificou explicitamente esses problemas, incluindo formatos inconsistentes, múltiplas ferramentas, dificuldade de comparar iniciativas objetivamente, carga pesada de revisão e ligação fraca entre propostas e estratégia.

#### Por que vincular propostas aos pilares do Cardano Vision 2030 / Cardano 2030 + KPIs é um avanço real

Exigir que os proponentes indiquem qual(is) pilar(es) estratégico(s) estão mirando e conectem sua proposta a KPIs mensuráveis do ecossistema é uma das poucas maneiras escaláveis de ancorar a seleção em resultados compartilhados, em vez de intuição vaga. O framework encoraja explicitamente o alinhamento com o framework estratégico Cardano Vision 2030 / Cardano 2030 e solicita que os proponentes identifiquem resultados mensuráveis por meio de KPIs.

Isso também é consistente com a Info Action já endossada *“Cardano 2030: Vision, Mission, Strategy Framework and KPIs”* sendo usada como um ponto de referência compartilhado para direção e mensuração de longo prazo.

#### Por que o “orçamento baseado em work packages” ajuda (quando implementado com limites claros)

A exigência de estruturar orçamentos em torno de work packages, incluindo escopo, objetivos, métricas e detalhamento de custos por categoria, melhora a comparabilidade e dificulta esconder escopo vago atrás de um único número principal. Isso também apoia benchmarking entre propostas: revisores podem comparar valor esperado e estrutura de custos de forma mais direta quando as propostas usam a mesma lógica.

Dito isso, isso ainda precisa de definições mais rígidas em outras partes do framework para evitar ambiguidade de bundling. Mas, como ferramenta de transparência orçamentária, o orçamento baseado em work packages é a direção correta.

#### Por que isso importa institucionalmente

O objetivo não é forçar “teatro de alinhamento”. O objetivo é criar uma gramática de avaliação compartilhada para que dReps possam fazer perguntas mais consistentes:

- Qual pilar do Cardano 2030 esta proposta avança?
- Qual KPI ela afirma afetar, e por qual mecanismo?
- O escopo está dividido em componentes que podem ser revisados e comparados?

Esse é um ponto de partida muito mais saudável do que simplesmente perguntar se algo “parece bom para a Cardano”.

## Pontos negativos

### 2.3) O risco de bundling continua sem solução, e o framing atual de “work package” pode habilitá-lo

#### “Bundling” (o que quero dizer com isso e por que importa)

Neste contexto, bundling é quando múltiplas frentes de trabalho, entregáveis ou iniciativas distintas são empacotadas juntas e apresentadas como uma única unidade para revisão ou aprovação. O risco central não é necessariamente má intenção. O risco é estrutural: quando um pacote contém muitos itens diferentes, os tomadores de decisão muitas vezes são empurrados para uma escolha de tudo ou nada.

Uma analogia útil é a forma como dispositivos não relacionados ou controversos às vezes são inseridos em grandes projetos legislativos como “riders” ou cláusulas escondidas. O projeto pode conter partes essenciais que a maioria das pessoas apoia, mas também pode carregar itens adicionais que recebem menos escrutínio porque estão embutidos dentro de um pacote maior que “precisa passar”. Mesmo sem intenção maliciosa, o efeito prático é menor visibilidade e accountability mais fraca item por item.

A mesma dinâmica se aplica a pacotes orçamentários. Quando propostas são empacotadas, cada subitem pode ter sido produzido por pessoas diferentes, usando premissas e metodologias diferentes, com níveis variados de rigor e evidência. Como resultado, a qualidade é desigual dentro do bundle: componentes fortes podem, na prática, sustentar componentes mais fracos, e revisores não conseguem aplicar escrutínio consistente a cada parte sob restrições de tempo. Isso distorce a avaliação baseada em mérito, aumenta o ruído de governança e dificulta rejeitar itens de baixa qualidade sem também bloquear trabalho genuinamente valioso.

No ciclo de 2025, o bundling apareceu repetidamente como um modo prático de falha: dReps foram pressionados a aceitar “package deals” em que rejeitar componentes fracos significava bloquear componentes de maior valor que haviam sido agrupados junto deles.

Este framework não trata claramente desse modo de falha. Mais importante ainda, a forma como os “work packages” são descritos pode ser razoavelmente lida como permitindo bundling dentro das propostas, a menos que o framework restrinja explicitamente o que é um work package e como ele pode ser usado.

A estrutura implícita parece permitir múltiplas camadas de agregação:

`work package → proposal → consolidação em TWGAs (e potencialmente em múltiplas faixas on-chain com base em níveis de apoio)`

Isso cria um risco de “compromisso composto”: bundling dentro de uma proposta, e bundling novamente na etapa de consolidação.

Esse pode não ser o design pretendido. No entanto, o texto atual deixa ambiguidade suficiente para que isso deva ser esclarecido. Se work packages têm a intenção de melhorar a transparência orçamentária e a granularidade da revisão, o framework deveria definir explicitamente:

- O que se qualifica como um work package, incluindo limites de escopo, requisitos de dependência e separabilidade
- O que não se qualifica, como fluxos não relacionados combinados por conveniência
- Quando propostas devem ser divididas em submissões separadas em vez de agrupadas

Se bundling não é a intenção, a Info Action deveria ser reescrita para tornar isso inequívoco e estabelecer uma postura antibundling clara como expectativa processual.

### 2.4) O framework depende fortemente de “deep review” por dReps, mas essa premissa é insustentável e pouco confiável

Um framework é tão forte quanto suas premissas operacionais. Este depende de dReps realizando uma etapa de “Deep Review” para validar precisão, conformidade e alinhamento estratégico, uma abordagem que se mostrou insustentável e pouco confiável na prática ao longo dos últimos dois anos.

Na prática, o ciclo de 2025 mostrou que a qualidade das revisões varia amplamente entre os dReps e que picos de carga de trabalho levam a atalhos. Muitos dReps não publicam racionales detalhados de forma consistente, e apenas um pequeno subconjunto realiza análise profunda e sistemática em escala. Com volume maior, essa lacuna se torna ainda mais significativa.

O ecossistema Cardano está efetivamente pedindo que dReps avaliem um grande volume de propostas em um curto intervalo de tempo, e essas propostas deveriam ser avaliadas com pelo menos um padrão mínimo de rigor, individualmente, por seus próprios méritos.

**Sem amostragem, sem leitura superficial, sem chute.**

Qualquer coisa abaixo disso é inaceitável, na minha visão, para um framework que coordena a alocação de dezenas de milhões de dólares de um Tesouro que não é infinito.

Já está claro que os dReps enfrentam séria sobrecarga de revisão durante essas etapas. Tratar bundling como solução para essa sobrecarga não é aceitável, na minha visão. Bundling não resolve o problema subjacente de capacidade; ele principalmente o esconde. Nesse contexto, bundling tende a incentivar atalhos: revisão incompleta, escrutínio limitado e decisões guiadas mais pela conveniência do empacotamento do que pelo mérito.

Esse é um risco estrutural: o framework aumenta padronização e gestão de volume, mas não enfrenta as restrições de incentivo e capacidade que determinam se “deep review” é realista.

Se o processo pretende depender de deep review, deveria incluir mecanismos críveis para apoiá-la, como:

- Mecanismos de incentivo e reputação que recompensem revisão diligente, não necessariamente apenas “financiamento”, para que dReps que investem dezenas de horas em análise séria recebam algo em troca, como sinais reputacionais e/ou mecanismos opcionais de funding. O objetivo aqui é alinhamento de incentivos, não necessariamente “pagar dReps”, então isso não deveria ser enquadrado como compensação por padrão
- Padrões de revisão e expectativas mínimas claros e não vinculantes, explicitamente apresentados como orientação e não como regras executáveis, para que o processo não finja que “deep review” existe quando muitas vezes não existe. No mínimo, o framework deveria definir o que “review” significa na prática e o que é aceitável quando o tempo é limitado. Exemplos de expectativas mínimas que deveriam ser discutidas e documentadas
- Comportamento padrão quando um dRep não consegue revisar: “NO” deveria ser tratado como padrão quando um dRep não teve tempo de avaliar uma proposta, ou o padrão deveria ser ABSTAIN / não participação explícita? Se alguns dReps têm usado “NO” como mecanismo para lidar com sobrecarga, o framework deveria abordar se isso é considerado uma prática válida, já que isso altera materialmente o significado de “NO.”
- Expectativas de rationale: deveria se esperar que votos incluam ao menos uma rationale curta, mesmo que não vinculante? Se o framework depende da qualidade da revisão, exigir alguma justificativa mínima é a única forma de distinguir “NO revisado” de “NO não revisado”.
- Limiar mínimo de escrutínio: qual é o mínimo que uma proposta deveria cumprir antes de ser tratada como “reviewed”? Por exemplo, confirmar clareza de escopo, especificidade dos entregáveis, sanidade da estrutura orçamentária e que as alegações de KPI sejam mensuráveis e não meramente decorativas
- Adoção de um template de revisão leve: um formato padronizado de revisão em estilo checklist, mesmo que opcional, reduziria variância e tornaria mais fácil para a comunidade comparar avaliações. Isso também dificulta que “deep review” degrade para leitura parcial e adivinhação, ainda parecendo legítimo

#### Checagem de realidade da carga de trabalho

No ciclo anterior, 194 propostas foram submetidas no Ekklesia.[3] Com um limiar de avanço off-chain que exige ≥67% de apoio do stake participante de dReps, a premissa operacional implícita não é simplesmente que “alguém” vai revisar o backlog, mas que uma grande parcela dos dReps precisa se engajar com uma grande parcela das propostas para que o processo funcione como desenhado. Se muitos dReps não revisarem de forma significativa a maioria das propostas, atingir esse nível de apoio se torna mais difícil, e o sistema ou incentiva votação superficial e acelerada, ou falha em avançar itens de forma consistente.

Essa tensão deveria ser abordada explicitamente por meio de um design de processo atento à carga de trabalho, como divisão estruturada de responsabilidades de revisão por tema, camadas de recomendação por especialistas (SMEs), ou triagem em etapas, em vez de assumir engajamento amplo e profundo em escala sob pressão de tempo.

#### Sugestão (já existe um precedente viável)

Uma forma prática de reduzir sobrecarga sem depender de bundling é adicionar ao framework uma camada estruturada de “recomendação por assunto”. Já existe um precedente: no Fund 14, a Cardano Foundation introduziu um piloto para um futuro papel de “Catalyst Representative”, em que especialistas por área revisaram propostas dentro de seus domínios e publicaram recomendações para ajudar votantes a navegar um alto volume de propostas, enquanto a Foundation explicitamente não votou com base nessas recomendações.[4][5]

**Contexto do piloto:**

> Leia o artigo completo: https://cardanofoundation.org/blog/catalyst-f14

Um mecanismo semelhante poderia ser adaptado para o processo orçamentário do ecossistema: criar uma trilha opcional de “Representative / SME Review” em que especialistas qualificados, tanto de organizações estabelecidas quanto da comunidade em geral, publiquem revisões e shortlists padronizadas e baseadas em evidências por tema, como Infraestrutura, ferramentas de Governança, crescimento de desenvolvedores, DeFi e Interoperabilidade, etc. Isso não substituiria o julgamento dos dReps, mas forneceria uma forma crível e consciente da carga de trabalho de melhorar a diligência, reduzir votação superficial e ajudar dReps a concentrar atenção onde isso mais importa.

Sem esses apoios, o alinhamento estratégico baseado em KPIs corre o risco de virar um exercício superficial de conformidade em vez de avaliação significativa.

### 2.5) O framework é pouco específico sobre uso do NCL, contingências e capacidade de emergência

O framework descreve a alocação de propostas em ordem de classificação até o limite disponível do Net Change Limit (NCL), mas não afirma claramente o que acontece se o processo anual consumir toda a capacidade disponível do NCL.

Isso cria uma questão básica de governança e gestão de risco: qual é o caminho pretendido para necessidades genuinamente emergentes ou imprevistas durante a mesma janela fiscal?

O framing atual também implica uma premissa operacional adicional: que qualquer projeto ou proponente buscando financiamento do Tesouro dentro do período atual do NCL irá:

- Participar por meio desse pipeline facilitado pela Intersect
- Submeter de forma independente em paralelo antes que a Intersect conclua sua consolidação e submissões de TWGAs

Se a intenção prática é consumir o NCL disponível por meio do ciclo anual, então há pouco ou nenhum espaço fiscal restante para qualquer coisa fora desse pipeline, a menos que um novo NCL seja proposto depois.

Isso é deliberado? Se sim, por quê? Se não, qual é o buffer pretendido?

Se o processo implicitamente pretende “preencher o NCL” por meio do ciclo orçamentário anual, então, a menos que uma reserva seja explicitamente planejada, o sistema fica com um conjunto limitado de opções quando emergências surgem:

- Adiar ou rejeitar iniciativas emergentes independentemente da urgência
- Tratar “submeter um novo NCL” como a válvula de escape padrão

O segundo resultado é particularmente preocupante porque corre o risco de normalizar expansões repetidas do NCL sempre que o teto se tornar inconveniente, o que enfraquece a credibilidade do NCL como instrumento de coordenação e disciplina.

Eu não sou contra coordenação. O problema é que o texto atual não explica a lógica por trás dessa aparente escolha de design, nem descreve claramente como gastos não planejados, emergências ou oportunidades sensíveis ao tempo devem ser tratados.

Se a intenção não é consumir todo o NCL, o framework deveria dizer isso explicitamente e documentar uma postura mínima de política, ainda que não vinculante, como:

- Se se espera uma margem de contingência / reserva
- O que se qualifica como gasto “emergente” versus gasto de “ciclo anual”
- Como exceções devem ser tratadas sem transformar revisão de NCL em prática rotineira

### 2.6) Exigir um “NCL ativo” de antemão corre o risco de separar o teto de gastos da demanda orçamentária real

O framework trata um Net Change Limit (NCL) ativo como pré-requisito para iniciar o processo orçamentário anual. Constitucionalmente, isso pode ser necessário. Estrategicamente, porém, isso cria um problema de sequência: o teto de gastos fica efetivamente travado antes que o ecossistema tenha produzido uma visão estruturada da demanda de financiamento para esse mesmo período.

Se o propósito deste framework é coordenar o orçamento, o processo deveria tornar mais explícita a relação entre demanda e teto. Caso contrário, o ecossistema acaba operando sob um limite que pode ser justificado principalmente por heurísticas de entrada, por exemplo “quanto entrou no Tesouro no ano passado”, em vez de uma postura orçamentária deliberada.

Uma abordagem mais coerente incluiria uma etapa explícita que:

- Mapeie as necessidades esperadas de financiamento do ecossistema para a janela fiscal relevante, usando submissões padronizadas e dados comparáveis
- Avalie essa demanda em relação a prioridades estratégicas, como Vision 2030, e a uma postura explícita de política do Tesouro, por exemplo preservar principal versus controle de runway versus redução controlada
- Use essa visão estruturada para informar qual NCL seria apropriado para o período, mesmo que o NCL final ainda exija uma ação on-chain separada

Sem essa ligação, o processo orçamentário corre o risco de se tornar um “melhor esforço dentro de qualquer teto que já exista”, em vez de um sistema coordenado em que o teto é definido com referência clara tanto à estratégia quanto à demanda realista.

### 2.7) Taxa de submissão e limiares mínimos de pedido reduzem spam, mas introduzem trade-offs de acesso e incentivo

Uma taxa de submissão, uma doação de 1.000 ADA ao Tesouro, pode reduzir submissões de baixo esforço e spam. No entanto, ela também pode excluir contribuidores menores ou em estágio inicial que tenham ideias críveis, mas capital limitado. Isso se torna ainda mais importante no contexto atual: com os Project Catalyst Funds 15 e 16 cancelados, os caminhos de financiamento em nível comunitário estão mais restritos e muitos contribuidores estão efetivamente “com fome” de rotas viáveis para participar. Nesse ambiente, adicionar uma barreira fixa de 1.000 ADA previsivelmente impõe um custo a pequenos contribuidores e reduz inclusão.

Se inclusão importa, o framework deveria esclarecer se existe algum suporte ou mecanismo alternativo para cobrir essa contribuição em casos validados. Não estou prescrevendo um design específico aqui, mas até mesmo um caminho básico, como algum tipo de modelo de triagem ou patrocínio, seria melhor do que tratar a taxa como uma barreira inevitável que contribuidores menores simplesmente precisam absorver.

Da mesma forma, um limiar mínimo de pedido de 100.000 ADA pode simplificar a gestão da carga de trabalho, mas também pode criar incentivos para inflação orçamentária a fim de atingir o piso. Mesmo que isso seja aceitável pragmaticamente, deveria ser reconhecido explicitamente como um trade-off, já que pode desestimular iniciativas menores com alto ROI e incentivar padding desnecessário.

### 2.8) Ausência de discussão pública vinculada: inaceitável para algo que quer ser a referência do ecossistema

Para um framework que quer se tornar o processo de referência do ecossistema, não ter uma discussão formal vinculada, seja no GovTool, em um fórum ou em fontes de apoio, é inaceitável.

Se o texto alega ampla consulta, então deveria mostrar:

- Fontes
- Notas de reunião
- Threads
- Registros
- Decisões do Budget Committee
- Que feedback foi efetivamente incorporado

Sem isso, a legitimidade social é fraca e a comunidade fica no modo “confia em mim”.

### 3. Voto e rationale

**Voto: NÃO**

O propósito central é positivo e necessário. Uma camada de coordenação para o orçamento do ecossistema é necessária, especialmente agora que existe uma referência estratégica compartilhada por meio do Cardano Vision 2030 / Cardano 2030. Um processo não vinculante que traga à tona necessidades projetadas de financiamento, alinhamento estratégico e prioridades da comunidade antes que as alocações do Tesouro sejam finalizadas preenche uma lacuna institucional de longa data.

Padronização e comparabilidade também caminham na direção certa. Vincular propostas a pilares estratégicos e KPIs, e exigir orçamento baseado em work packages, melhora a base para perguntas mais consistentes e melhor comparação entre propostas.

Permanecem fraquezas estruturais importantes. O risco de bundling não está claramente restringido e pode ser habilitado pelo framing atual de work package. A dependência de deep review por dReps não é realista sob as condições atuais de carga de trabalho, incentivos e capacidade. Uso do NCL, postura de contingência e capacidade de emergência permanecem pouco especificados. Um NCL ativo é exigido antes que o ecossistema tenha produzido uma visão estruturada da demanda de financiamento para o mesmo período, criando um problema de sequência entre o teto e as necessidades orçamentárias reais.

O propósito não está sendo rejeitado. A função de coordenação é considerada importante o suficiente para que o framework deva se tornar mais robusto antes de se tornar o processo de referência para alocação do Tesouro. Um voto **NÃO**, portanto, é mantido até que esses problemas sejam tratados. No mínimo, esses temas deveriam ser abertamente discutidos e comentados, com explicação sobre por que não serão tratados caso esse seja o caminho escolhido, especialmente considerando que aproximadamente um ano já se passou desde o ciclo orçamentário de 2025.

Definições antibundling mais claras, apoio de revisão mais crível e atento à carga de trabalho, e uma postura mais clara sobre contingência, espaço de reserva e a relação entre demanda e o NCL tratariam diretamente das fraquezas mais importantes identificadas.

---

## References

[1] Intersect, “Building a 2026 Ecosystem Budget for Cardano”  
https://intersectmbo.org/news/building-a-2026-ecosystem-budget-for-cardano

[2] Proposal Examiner, “Cardano 2030: Vision, Mission, Strategy Framework and KPIs”  
https://proposalexaminer.cardanofoundation.org/proposals/gov_action18fd7jwa06fksmwumlcvlft8v4guvaa672qsp6xgenekvs4kmvcqsq8cqks4

[3] Ekklesia, "2025 Cardano Budget Reconciliation"  
https://2025budget.intersectmbo.org/ballots/680d1b63565577986442d123/proposals

[4] Cardano Foundation, “Cardano Foundation’s Project Catalyst F14 Participation”  
https://cardanofoundation.org/blog/catalyst-f14

[5] Cardano Foundation (X / Twitter), Representative pilot context post  
https://x.com/Cardano_CF/status/1965439772689924605?s=20
