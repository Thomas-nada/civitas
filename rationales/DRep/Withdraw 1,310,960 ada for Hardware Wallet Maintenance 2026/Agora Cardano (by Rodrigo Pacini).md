<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmSNf2MVnEtrLwqVwVBcJWdW9v6Vvyo97ZV2PLjDQMmvjf -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Withdraw 1,310,960 ada for Hardware Wallet Maintenance 2026
**Vote:** No
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

## Review Methodology Disclaimer [EN]

Due not only to the unusually high volume of Treasury Withdrawal Governance Actions and budget proposals submitted in mid 2026, but also to the lack of meaningful incentives for DReps to perform proposal analysis work, it is not feasible to apply my full standard review framework and reporting template to every proposal.

My standard analysis process usually requires approximately four hours of work per Governance Action. During that process, I research the proposal, review supporting materials, compare different perspectives from DReps and other ecosystem participants, and weigh both positive and negative arguments before reaching a reasonably qualified decision. Even with the use of artificial intelligence to automate parts of the workflow and improve productivity, a responsible evaluation still requires substantial human review, judgment, and contextual understanding.

In addition, this work does not end with the vote itself. It also involves writing and publishing rationales, preparing reports or summaries, communicating the reasoning publicly, and socializing the analysis through public channels and social media. This creates a significant workload, especially when dozens of proposals must be reviewed in a short period.

At present, this work carries no clear financial incentive and only limited reputational incentive, despite requiring substantial time, attention, and accountability. In practice, it is not sustainable to dedicate near full-time effort over several weeks or months to this activity without any form of compensation or institutional support.

Since I have a clear standard for my work and do not want to lower the quality of my judgment, I will reduce the scope of my analysis where necessary rather than rush decisions or produce superficial rationales. This means prioritizing focused due diligence over exhaustive review.

Under these constraints, my methodology during this period will focus on identifying critical strategic, operational, governance, reputational, or execution-related risks that could materially compromise a proposal’s viability, accountability, or successful delivery. In practical terms, this means narrowing my research toward the most critical gaps that may make approval unjustifiable. Where such a serious risk is identified, I may use it as the basis for a rejection vote.

This approach also helps reduce review overload: proposals with clear and material gaps would likely require rework regardless, so voting against them when those gaps are significant can be a responsible way to preserve review capacity while maintaining minimum due diligence.

Examples of such high-priority concerns may include, but are not limited to:

- Serious delivery failures in previous funded proposals;
- Significant unresolved delays in ongoing work;
- Major reputational or accountability issues within the ecosystem;
- Lack of credible execution capacity;
- Structural governance or transparency concerns;
- Severe budgetary or coordination risks.

Where I do not have sufficient time for a deeper evaluation, and no significant red flags or imminent execution risks are identified, I may abstain rather than issue an underdeveloped approval or rejection rationale.

This does not mean that other dimensions of proposal quality are unimportant. It means that, under current constraints, I will prioritize a narrower but still responsible review scope that preserves minimum due diligence, avoids rushed decisions, and keeps the quality of my judgment at an acceptable standard.

# Governance Action Report - Hardware Wallet Maintenance 2026

## 1. Introduction

This Treasury Withdrawal funds Hardware Wallet Maintenance 2026. It requests 12 months of funding for production maintenance of Cardano hardware-wallet support: Ledger and Trezor compatibility updates, maintenance of supporting interoperability libraries and `cardano-hw-cli`, developer support for ecosystem integrators, support for integration paths involving externally maintained components where shared hardware-wallet flows intersect, and vendor-required product or security audits where firmware or app changes trigger them. This is a continuity proposal for an already-proven Cardano access layer, not a request to build a new wallet product. The requested budget is 1,310,960 ADA, equivalent to USD 314,630 at an ADA/USD conversion rate of USD 0.24. VacuumLabs is the proposer and Intersect is the administrator. The delivery model is capped time and materials, with milestone claims every eight weeks, public progress reporting, and evidence-backed acceptance. Any portion of the approved cap not consumed by delivered work will remain unclaimed, and any audit reserve not required by vendor-triggered audit conditions will not be drawn.

## 2. Governance Action Analysis

### Positive aspects

The maintenance of hardware-wallet integrations has evident strategic importance for the Cardano ecosystem. Compatibility with devices such as Ledger and Trezor is not merely a convenience for individual users, but forms part of a sensitive layer of security, custody, and network access. If these integrations fail to keep pace with Cardano protocol updates, firmware changes, new device models, or changes to manufacturers’ applications, users may face difficulties signing transactions, moving assets, participating in governance, or interacting with wallets and decentralized applications.

For this reason, there is relevant alignment with Cardano Vision 2030. Primary alignment is with Pillar 1, Infrastructure & Research Excellence, because the work seeks to preserve security, interoperability, reliability, and operational continuity. There is also secondary alignment with Pillar 2, Adoption & Utility, because a secure and compatible user experience is a necessary condition for users and applications to use Cardano in practice. Hardware-wallet infrastructure that ceases to function properly harms both existing users and the development of new integrations.

VacuumLabs’ specific experience must also be recognized. The company states that it has worked with Cardano hardware-wallet integrations since 2018 and maintains components related to Ledger, Trezor, `cardano-hw-cli`, and interoperability libraries. Agora is not aware of another team that currently performs the same function comprehensively within the ecosystem. This does not establish that VacuumLabs is technically the only team capable of performing the work, but it demonstrates that, in practice, there is a relevant dependency on its accumulated knowledge and operational continuity.

The preventive nature of the maintenance must also be recognized: correcting incompatibilities before they affect users may be safer and less costly than reacting only after a production failure.

Another favorable aspect is that blockchain ecosystems funding hardware-wallet integrations does not appear to be unique to Cardano. There are examples of foundations, grant programs, and community funds from other networks financing the development or maintenance of applications and integrations for Ledger and other devices. Therefore, it would not be correct to reject the proposal solely on the argument that a blockchain should never fund this type of work. In some cases, this is protocol-specific infrastructure that would not be economically maintained by the manufacturer without some support from the interested ecosystem.

The proposal’s financial model also includes some protections. The work follows a capped time-and-materials model rather than constituting an automatic entitlement to receive the entire approved amount. The proposal states that unused capacity will remain undrawn and that the audit reserve will not be consumed if no audit is required. Accountability cycles are also planned every eight weeks, presenting hours consumed, pull requests, releases, tests, fixes, documentation, and any audit evidence. These mechanisms partially reduce the risk of full payment for work that was not actually performed.

### Negative aspects

Despite these merits, an institutional issue is not adequately explained. Ledger and Trezor are commercial, for-profit companies. Their products are sold to users who wish to store and move various assets, including ADA and Cardano Native Tokens. Although the available information does not make it possible to determine what portion of their sales comes specifically from Cardano users, it is reasonable to state that these users generate revenue for the manufacturers.

For this reason, there should be a clearer explanation of the division of responsibilities and costs. It is not sufficiently demonstrated how much of the work is financed directly by Ledger or Trezor, how much is performed by employees of those companies, how much is VacuumLabs’ technical responsibility, and how much must be subsidized by the Cardano Treasury. It is also unclear whether there is any form of co-funding or contribution from the manufacturers.

If the Cardano ecosystem fully funds all updates, fixes, tests, integrations, and audits required for commercial products to continue functioning, a comfortable situation is created for the manufacturers: compatibility-specific expenses may be socialized while sales revenue remains private. This does not mean that no Treasury contribution is legitimate. It only means that funding should be accompanied by transparency regarding which responsibilities are public, which are commercial, and why the Treasury should assume a particular share.

The proposal should distinguish, for example, between maintenance of Cardano-side components that function as public infrastructure, changes required within manufacturers’ applications, support requested by commercial wallets, specific third-party integrations, and audits imposed by the vendors themselves. Without this separation, it is not possible to understand whether the Treasury is funding an indispensable public good, subsidizing obligations of private companies, or doing both simultaneously.

However, this is not the main reason for the opposing vote. The decisive objection is the lack of budget granularity.

The budget divides development costs into only two broad items. The first allocates 845,208 ADA, equivalent to approximately USD 202,850, for 156 person-days of compatibility updates, release engineering, and integration maintenance. The second allocates 281,736 ADA, equivalent to approximately USD 67,617, for 52 person-days of incident response, developer support, and partner integration support. Together, these items represent 208 person-days, presented as 0.8 annualized FTE. There is also a USD 35,000 reserve for external audits and the Intersect administration fee.

This information provides some quantification, but remains too superficial for an adequate value-for-money evaluation. The proposal does not state how many people will work on it, what roles they will perform, the seniority of each professional, how much time will be allocated to development, support, management, coordination, or testing, or the hourly or daily rate for each category.

It is also not explained whether the amount includes corporate overhead, profit, administrative management, incident availability, charges, equipment, or other expenses. It is not possible to identify whether the 208 person-days correspond predominantly to the work of highly specialized senior developers, a combination of professionals with different experience levels, or a broader team structure.

Using eight hours per person-day solely as an estimate, the 208 days would correspond to 1,664 hours. The USD 270,467 allocated to the two development items would result in an approximate implicit cost of USD 162.54 per hour, or about USD 1,300 per person-day.

This amount cannot automatically be interpreted as an individual salary. It may represent a blended rate that includes salaries, charges, administration, corporate profit, management, and other costs. However, this is precisely the problem: the proposal does not provide enough information to determine what the amount represents.

The implicit hourly rate appears high and has already been questioned by other dReps, but there is not enough data to conclude definitively that it is inflated. There is also not enough data to conclude that it is reasonable. The lack of granularity prevents both proper validation and proper challenge of the budget.

Merely stating 0.6 FTE for one broad set of activities and 0.2 FTE for another does not permit evaluation of allocation efficiency. It is unknown whether one person will work part-time throughout the year, several people will work during different periods, a team will remain available on demand, or some combination of these models will be used. The historical volume of incidents and updates that justifies this capacity is also unknown.

A comparison with the previous cycle should be presented: approved budget, amount actually consumed, number of people involved, hours used, releases produced, incidents handled, audits performed, and scope delivered. Without this basis, it is not possible to determine whether the 208 person-days represent a realistic projection, an excessive reserve, or a reduction compared with the previous effort.

The milestones also do not resolve this deficiency. The six eight-week cycles present practically the same deliverables and completion criteria. All contain generic references to pull requests, releases, fixes, tests, reports, audits where applicable, and budget consumption. This structure may make sense for unpredictable maintenance, but it does not establish sufficiently specific commitments before execution.

The proposal mentions incident response, remediation time, compatibility coverage, and audit turnaround, but does not define concrete targets. There is no specific response time for priority incidents, maximum mitigation period, minimum coverage of devices and versions, expected number of releases, or defined window for completing audits. The indicators are relevant, but remain without clear thresholds for success or failure.

### Risks and concerns

The dependency on VacuumLabs increases the risk of not funding any form of maintenance. Abruptly interrupting the work without an alternative team prepared could create an operational gap. If incompatible changes occur in the protocol or manufacturers’ products, there may be no other provider immediately able to respond, test, coordinate audits, and publish updates.

In its current version, it is not possible to determine whether the requested amounts correspond to acceptable market prices, include an excessive margin, whether the projected capacity is proportional to demand, or whether some costs should be borne by the commercial manufacturers. The information asymmetry is too significant for public resources to be approved safely.

## 3. Vote and Rationale

**Vote: NO**

The position is not opposed to hardware-wallet maintenance, to VacuumLabs as a team, or to the principle of using the Treasury to fund strategic infrastructure. The proposal has potential value, strategic alignment, and a plausible continuity justification. Other ecosystems also fund similar work, and abandoning a security layer without an operational alternative would be risky.

The decisive objection is the lack of budget granularity. The strategic importance of the work does not remove the obligation to justify its price, and classification as critical infrastructure cannot authorize approval of a budget without sufficient information about its composition. The vote is conditioned on the insufficiency of the information provided and is not a definitive rejection of the work.

The vote would be converted to YES if a more granular budget were provided, containing at least the team composition, roles, seniority levels, hours or days by activity, hourly or daily rates, applicable overhead, demand estimates, a comparison with the previous cycle, and an explanation of the division of costs among VacuumLabs, Ledger, Trezor, and the Cardano ecosystem. If that documentation demonstrated that compensation is within reasonable market parameters and that there is no unjustified cost inflation, the proposal’s strategic relevance would be sufficient to justify approval.

## 4. Conclusion

The strategic importance of hardware-wallet maintenance does not compensate for the inability to evaluate the budget adequately. Until the requested costs, projected capacity, market parameters, and division of responsibilities with commercial manufacturers are demonstrated with sufficient granularity, the information asymmetry remains too significant for approval of public resources.

---

## Nota sobre metodologia e escopo de análise [PT]

Devido não apenas ao volume excepcionalmente alto de Treasury Withdrawal Governance Actions e propostas orçamentárias submetidas no meio de 2026, mas também à falta de incentivos significativos para que DReps realizem o trabalho de análise de propostas, não é viável aplicar meu framework completo de revisão e meu template padrão de relatório a todas as propostas.

Meu processo padrão de análise normalmente exige aproximadamente quatro horas de trabalho por Governance Action. Durante esse processo, eu pesquiso a proposta, reviso materiais de suporte, comparo diferentes perspectivas de DReps e de outros participantes do ecossistema, e peso argumentos positivos e negativos antes de chegar a uma decisão razoavelmente qualificada. Mesmo com o uso de inteligência artificial para automatizar partes do fluxo de trabalho e aumentar a produtividade, uma avaliação responsável ainda exige revisão humana substancial, julgamento e entendimento contextual.

Além disso, esse trabalho não termina no voto em si. Ele também envolve escrever e publicar rationales, preparar relatórios ou resumos, comunicar publicamente a justificativa e socializar a análise por meio de canais públicos e mídias sociais. Isso cria uma carga de trabalho significativa, especialmente quando dezenas de propostas precisam ser avaliadas em um curto período.

Atualmente, esse trabalho não possui incentivo financeiro claro e oferece apenas incentivo reputacional limitado, apesar de exigir tempo, atenção e responsabilidade substanciais. Na prática, não é sustentável dedicar um esforço próximo de tempo integral durante várias semanas ou meses a essa atividade sem qualquer forma de compensação ou apoio institucional.

Como tenho um padrão claro para o meu trabalho e não quero reduzir a qualidade do meu julgamento, irei reduzir o escopo da minha análise quando necessário, em vez de tomar decisões apressadas ou produzir justificativas superficiais. Isso significa priorizar uma diligência focada em vez de uma revisão exaustiva.

Sob essas restrições, minha metodologia durante este período se concentrará em identificar riscos críticos estratégicos, operacionais, de governança, reputacionais ou relacionados à execução que possam comprometer materialmente a viabilidade, a accountability ou a entrega bem-sucedida de uma proposta. Na prática, isso significa concentrar minha pesquisa nos gaps mais críticos que possam tornar a aprovação injustificável. Quando um risco sério desse tipo for identificado, poderei usá-lo como base para um voto de rejeição.

Essa abordagem também ajuda a reduzir a sobrecarga de revisão: propostas com gaps claros e materiais provavelmente exigiriam retrabalho de qualquer forma, então votar contra elas quando esses gaps forem significativos pode ser uma forma responsável de preservar capacidade de análise enquanto se mantém uma diligência mínima.

Exemplos dessas preocupações de alta prioridade podem incluir, mas não se limitam a:

- Falhas graves de entrega em propostas anteriormente financiadas;
- Atrasos significativos e não resolvidos em trabalhos em andamento;
- Problemas graves de reputação ou accountability dentro do ecossistema;
- Falta de capacidade crível de execução;
- Preocupações estruturais de governança ou transparência;
- Riscos severos de orçamento ou coordenação.

Quando eu não tiver tempo suficiente para uma avaliação mais profunda, e nenhum alerta significativo ou risco iminente de execução for identificado, poderei me abster em vez de emitir uma justificativa de aprovação ou rejeição pouco desenvolvida.

Isso não significa que outras dimensões da qualidade de uma proposta não sejam importantes. Significa que, sob as restrições atuais, priorizarei um escopo de revisão mais estreito, mas ainda responsável, que preserve uma diligência mínima, evite decisões apressadas e mantenha a qualidade do meu julgamento em um padrão aceitável.

# Relatório de Ação de Governança - Hardware Wallet Maintenance 2026

## 1. Introdução

Esta Retirada do Tesouro financia a Hardware Wallet Maintenance 2026. São solicitados 12 meses de financiamento para a manutenção em produção do suporte a hardware wallets da Cardano: atualizações de compatibilidade com Ledger e Trezor, manutenção das bibliotecas de interoperabilidade de suporte e do `cardano-hw-cli`, suporte a desenvolvedores para integradores do ecossistema, suporte a caminhos de integração que envolvam componentes mantidos externamente quando houver interseção com fluxos compartilhados de hardware wallets e auditorias de produto ou segurança exigidas pelos fabricantes quando alterações de firmware ou aplicativos as tornarem necessárias. Esta é uma proposta de continuidade para uma camada de acesso da Cardano já comprovada, e não uma solicitação para construir um novo produto de wallet. O orçamento solicitado é de 1.310.960 ADA, equivalente a US$ 314.630 com uma taxa de conversão ADA/USD de US$ 0,24. A VacuumLabs é a proponente e a Intersect é a administradora. O modelo de execução é capped time and materials, com solicitações de milestone a cada oito semanas, prestação pública de contas e aceitação baseada em evidências. Qualquer parcela do limite aprovado que não seja consumida por trabalho entregue permanecerá sem saque, e qualquer reserva para auditorias que não seja necessária por condições impostas pelos fabricantes não será utilizada.

## 2. Análise da Ação de Governança

### Aspectos positivos

A proposta de manutenção das integrações de hardware wallets possui importância estratégica evidente para o ecossistema Cardano. A compatibilidade com dispositivos como Ledger e Trezor não representa apenas uma conveniência para usuários individuais, mas integra uma camada sensível de segurança, custódia e acesso à rede. Caso essas integrações deixem de acompanhar atualizações do protocolo Cardano, alterações de firmware, novos modelos de dispositivos ou mudanças nos aplicativos dos fabricantes, usuários podem enfrentar dificuldades para assinar transações, movimentar ativos, participar da governança ou interagir com wallets e aplicações descentralizadas.

Por essa razão, existe um alinhamento relevante com o Cardano Vision 2030. O alinhamento primário ocorre com o Pilar 1, Infrastructure & Research Excellence, porque o trabalho busca preservar segurança, interoperabilidade, confiabilidade e continuidade operacional. Existe também alinhamento secundário com o Pilar 2, Adoption & Utility, pois uma experiência de uso segura e compatível é uma condição necessária para que usuários e aplicações consigam utilizar a Cardano de maneira prática. Uma infraestrutura de hardware wallets que deixa de funcionar adequadamente prejudica tanto usuários existentes quanto o desenvolvimento de novas integrações.

Também deve ser reconhecida a experiência específica da VacuumLabs. A empresa afirma trabalhar com integrações de hardware wallets na Cardano desde 2018 e manter componentes relacionados a Ledger, Trezor, `cardano-hw-cli` e bibliotecas de interoperabilidade. Agora não tem conhecimento de outro time que atualmente exerça a mesma função de maneira abrangente no ecossistema. Isso não permite afirmar que a VacuumLabs seja tecnicamente a única equipe capaz de realizar esse trabalho, mas demonstra que existe, na prática, uma dependência relevante de seu conhecimento acumulado e de sua continuidade operacional.

A natureza preventiva da manutenção também deve ser reconhecida: corrigir incompatibilidades antes que elas afetem usuários pode ser mais seguro e menos custoso do que reagir somente depois de uma falha em produção.

Outro aspecto favorável é que o financiamento de integrações com hardware wallets por ecossistemas blockchain não parece ser uma particularidade da Cardano. Existem exemplos de fundações, grant programs e fundos comunitários de outras redes financiando o desenvolvimento ou a manutenção de aplicativos e integrações para Ledger e outros dispositivos. Portanto, não seria correto rejeitar a proposta apenas com o argumento de que uma blockchain jamais deveria financiar esse tipo de trabalho. Em alguns casos, trata-se de uma infraestrutura específica do protocolo que não seria economicamente mantida pelo fabricante sem algum suporte do ecossistema interessado.

O modelo financeiro da proposta também possui algumas proteções. O trabalho segue um modelo capped time and materials, e não constitui um direito automático ao recebimento integral do valor aprovado. A proposta afirma que capacidade não utilizada permanecerá sem saque e que a reserva para auditorias não será consumida caso nenhuma auditoria seja necessária. Também estão previstos ciclos de prestação de contas a cada oito semanas, com apresentação de horas consumidas, pull requests, releases, testes, correções, documentação e eventuais evidências de auditoria. Esses mecanismos reduzem parcialmente o risco de pagamento integral por trabalho que não tenha sido efetivamente realizado.

### Aspectos negativos

Apesar desses méritos, existe uma questão institucional que não é adequadamente explicada. Ledger e Trezor são empresas comerciais com fins lucrativos. Seus produtos são vendidos a usuários que desejam armazenar e movimentar diversos ativos, incluindo ADA e Cardano Native Tokens. Embora não seja possível determinar, com as informações disponíveis, qual parcela de suas vendas decorre especificamente de usuários da Cardano, é razoável afirmar que esses usuários geram receita para os fabricantes.

Por isso, deveria haver uma explicação mais clara sobre a divisão de responsabilidades e custos. Não está suficientemente demonstrado quanto do trabalho é financiado diretamente pela Ledger ou pela Trezor, quanto é realizado por funcionários internos dessas empresas, quanto é responsabilidade técnica da VacuumLabs e quanto precisa ser subsidiado pela tesouraria da Cardano. Também não está claro se existe algum tipo de cofinanciamento ou contribuição dos fabricantes.

Se o ecossistema Cardano financiar integralmente todas as atualizações, correções, testes, integrações e auditorias necessárias para que os produtos comerciais continuem funcionando, cria-se uma situação confortável para os fabricantes: as despesas específicas de compatibilidade podem ser socializadas, enquanto as receitas das vendas permanecem privadas. Isso não significa que nenhuma contribuição da tesouraria seja legítima. Significa apenas que o financiamento deveria ser acompanhado de transparência sobre quais responsabilidades são públicas, quais são comerciais e por que o Tesouro deve assumir determinada parcela.

A proposta deveria distinguir, por exemplo, entre a manutenção de componentes Cardano-side que funcionam como infraestrutura pública, alterações necessárias dentro dos aplicativos dos fabricantes, suporte solicitado por wallets comerciais, integrações específicas de terceiros e auditorias impostas pelos próprios vendors. Sem essa separação, não é possível compreender se o Tesouro está financiando um bem público indispensável, subsidiando obrigações de empresas privadas ou fazendo ambas as coisas simultaneamente.

No entanto, essa não é a principal razão do voto contrário. A objeção decisiva é a falta de granularidade do orçamento.

O orçamento divide os custos de desenvolvimento em apenas dois itens amplos. O primeiro destina 845.208 ADA, equivalentes a aproximadamente US$ 202.850, para 156 person-days de atualizações de compatibilidade, release engineering e manutenção de integrações. O segundo destina 281.736 ADA, equivalentes a aproximadamente US$ 67.617, para 52 person-days de incident response, developer support e partner integration support. Em conjunto, esses itens representam 208 person-days, apresentados como 0,8 FTE anualizado. Há ainda uma reserva de US$ 35.000 para auditorias externas e a taxa administrativa da Intersect.

Essas informações oferecem alguma quantificação, mas continuam superficiais demais para uma avaliação adequada de value for money. Não é informado quantas pessoas trabalharão na proposta, quais funções exercerão, qual será a senioridade de cada profissional, quanto tempo será destinado a desenvolvimento, suporte, gestão, coordenação ou testes, nem qual será o hourly rate ou daily rate por categoria.

Também não é explicado se o valor inclui overhead corporativo, lucro, gestão administrativa, disponibilidade para incidentes, encargos, equipamentos ou outras despesas. Não é possível identificar se os 208 person-days correspondem predominantemente ao trabalho de desenvolvedores seniores altamente especializados, a uma combinação de profissionais com diferentes níveis de experiência ou a uma estrutura mais ampla de equipe.

Considerando, apenas como estimativa, oito horas por person-day, os 208 dias corresponderiam a 1.664 horas. Os US$ 270.467 destinados aos dois itens de desenvolvimento resultariam em um custo implícito aproximado de US$ 162,54 por hora, ou cerca de US$ 1.300 por person-day.

Esse valor não pode ser interpretado automaticamente como salário individual. Pode representar um blended rate que inclui salários, encargos, administração, lucro empresarial, gestão e outros custos. Contudo, esse é precisamente o problema: a proposta não fornece informações suficientes para determinar o que o valor representa.

O hourly rate implícito parece elevado e já foi questionado por outros dReps, mas não existem dados suficientes para concluir definitivamente que esteja inflado. Também não existem dados suficientes para concluir que seja razoável. A ausência de granularidade impede tanto a validação quanto a contestação adequada do orçamento.

Apenas informar 0,6 FTE para um conjunto amplo de atividades e 0,2 FTE para outro não permite avaliar a eficiência da alocação. Não se sabe se haverá uma única pessoa trabalhando parcialmente durante todo o ano, várias pessoas trabalhando em períodos diferentes, uma equipe disponível sob demanda ou alguma combinação desses modelos. Também não se sabe qual volume histórico de incidentes e atualizações justifica essa capacidade.

Seria importante apresentar uma comparação com o ciclo anterior: orçamento aprovado, valor efetivamente consumido, número de pessoas envolvidas, horas utilizadas, releases produzidos, incidentes tratados, auditorias realizadas e escopo entregue. Sem essa base, não é possível determinar se os 208 person-days representam uma projeção realista, uma reserva excessiva ou uma redução em relação ao esforço anterior.

Os milestones também não resolvem essa deficiência. Os seis ciclos de oito semanas apresentam praticamente os mesmos entregáveis e critérios de conclusão. Em todos aparecem referências genéricas a pull requests, releases, correções, testes, relatórios, auditorias quando aplicáveis e consumo do orçamento. Essa estrutura pode fazer sentido para manutenção imprevisível, mas não estabelece compromissos suficientemente específicos antes da execução.

A proposta menciona incident response, tempo de remediação, cobertura de compatibilidade e audit turnaround, mas não define alvos concretos. Não existe um prazo específico de resposta para incidentes prioritários, prazo máximo para mitigação, cobertura mínima de dispositivos e versões, quantidade esperada de releases ou janela definida para conclusão de auditorias. Os indicadores são relevantes, mas permanecem sem thresholds claros de sucesso ou fracasso.

### Riscos e preocupações

Essa dependência aumenta o risco de não financiar qualquer forma de manutenção. Interromper abruptamente o trabalho sem uma equipe alternativa preparada poderia gerar um vazio operacional. Caso ocorram mudanças incompatíveis no protocolo ou nos produtos dos fabricantes, talvez não exista outro fornecedor imediatamente apto a responder, testar, coordenar auditorias e publicar atualizações.

Na versão atual, não é possível determinar se os valores solicitados correspondem a preços de mercado aceitáveis, se incluem uma margem excessiva, se a capacidade projetada é proporcional à demanda ou se existem custos que deveriam ser assumidos pelos fabricantes comerciais. A assimetria de informação é significativa demais para que os recursos públicos sejam aprovados com segurança.

## 3. Voto e Justificativa

**Voto: NO**

A posição não é contrária à manutenção de hardware wallets, à VacuumLabs como equipe ou ao princípio de utilizar a tesouraria para financiar infraestrutura estratégica. A proposta possui valor potencial, alinhamento estratégico e uma justificativa plausível de continuidade. Outros ecossistemas também financiam trabalhos semelhantes, e seria arriscado abandonar uma camada de segurança sem alternativa operacional.

A objeção decisiva é a falta de granularidade do orçamento. A importância estratégica do trabalho não elimina a obrigação de justificar o preço, e a classificação de uma atividade como infraestrutura crítica não pode funcionar como autorização para aprovar um orçamento sem informações suficientes sobre sua composição. O voto está condicionado à insuficiência das informações apresentadas e não constitui uma rejeição definitiva ao trabalho.

O voto seria convertido para YES caso fosse disponibilizado um orçamento mais granular, contendo ao menos a composição da equipe, as funções, níveis de senioridade, quantidade de horas ou dias por atividade, hourly ou daily rates, overhead aplicável, estimativas de demanda, comparação com o ciclo anterior e uma explicação sobre a divisão de custos entre VacuumLabs, Ledger, Trezor e o ecossistema Cardano. Caso essa documentação demonstrasse que as compensações estão dentro de parâmetros de mercado razoáveis e que não há inflação injustificada dos custos, a relevância estratégica da proposta seria suficiente para justificar a aprovação.

## 4. Conclusão

A importância estratégica da manutenção de hardware wallets não compensa a impossibilidade de avaliar adequadamente o orçamento. Até que os custos solicitados, a capacidade projetada, os parâmetros de mercado e a divisão de responsabilidades com os fabricantes comerciais sejam demonstrados com granularidade suficiente, a assimetria de informação permanece significativa demais para a aprovação de recursos públicos.
