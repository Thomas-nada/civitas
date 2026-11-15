<!-- url: https://dreptalk.com/vote-rationale/ccffc6d4262475123583b845c9e6ee616ade103f9974453b81cea5ddfc0b13d8.json -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Cardano Strategic Copper Reserve ₳22M RWA Tokenization
**Vote:** No
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

# Governance Action Review [EN]

**Cardano Strategic Copper Reserve | ₳22M RWA Tokenization**

## 1. Introduction

The Cardano Strategic Copper Reserve requests a one-time ₳22,000,000 Treasury Withdrawal to Toto Finance Inc., the U.S.-based recipient and accountable administrator. The initiative would acquire independently verified COMEX Grade 1 copper cathodes in a COMEX-approved U.S. warehouse and tokenize the metal as CuTT, with one token economically representing one verified pound of copper.

Canonical CuTT would be issued on Ethereum. The entire Treasury-funded tranche would be locked in Ethereum escrow, with matching bridged tokens held on Cardano as its only active representation. The intended deliverables include tokenization infrastructure, reserve reconciliation, public reporting and developer documentation.

Of the requested funding, ₳14,724,409 would purchase copper. The remainder would fund technology and project management, operations and assurance, execution, and independent oversight. An 18–24-month holding period would be followed by liquidation, with all realized net physical-sale proceeds and unused or unearned funds returned to the Treasury by month 36. Recovery of the original ADA principal and profit are not guaranteed.

Legal, custody, audit and security arrangements are pre-deployment requirements. Independent oversight has not been contracted; a U.S. PwC member firm is the preferred prospective provider.

## 2. Governance Action Analysis

### Negative aspects

**Insufficient budget justification**

Only ₳14,724,409, equivalent to 66.93% of the funding, would be allocated to copper acquisition.

| Category | Amount |
| --- | ---: |
| Copper acquisition | ₳14,724,409 |
| Execution and acquisition | ₳441,732 |
| Operations, custody and assurance | ₳3,533,859 |
| Technology development and management — Toto Finance | ₳2,640,000 |
| Independent oversight | ₳660,000 |
| **Total** | **₳22,000,000** |

The ₳2.64 million allocated to Toto Finance is particularly problematic. Although there are five milestones with associated amounts and deliverables, there is insufficient breakdown of working hours, personnel, compensation, individual component costs, commercial quotations or pricing methodology.

The percentage distribution across milestones does not demonstrate the economic reasonableness of the amounts. The same problem extends to aggregated operational categories, even though some external expenses have specific caps.

There is no sufficiently detailed financial basis to conclude that the requested funding represents an efficient use of public resources.

The possibility that a bridge may be expensive does not resolve this deficiency. Both the reasonableness of the cost and the necessity and value of the funded component must be demonstrated.

**Ethereum-first architecture and lack of strategic justification**

The proposed architecture uses Ethereum as the canonical origin of CuTT. CuTT would be issued as an ERC-20 on Ethereum. The tokens corresponding to Treasury-funded copper would be locked in Ethereum escrow, and equivalent representations would be issued as native assets on Cardano. The Treasury-funded tranche would remain in a reserve wallet on Cardano, with token burning and reconciliation during copper liquidation.

The components actually implemented on Cardano include a mint/burn policy, transfer adapter, custody mechanisms, reconciliation, a dashboard, documentation and possible reporting integrations. Canonical issuance and escrow would remain on Ethereum.

Why fund a specialized bridge to bring Cardano a representation of an asset that could, in principle, be issued directly on Cardano?

A cross-chain implementation is not necessarily simple or inexpensive. Secure bridges may require sophisticated engineering, audits and complex verification mechanisms. The problem is that this complexity must be justified.

The proposal does not convincingly demonstrate why native issuance on Cardano would be inadequate, which advantages would offset the additional costs and risks of the chosen architecture, or why the Treasury should fund an Ethereum-centered solution.

Native issuance would be an architectural alternative to examine; its technical superiority has not been formally demonstrated.

The Treasury would be paying for the complexity of an architecture whose strategic necessity has not been established.

**Questionable public value of the technological deliverables**

The proposal presents tokenization infrastructure, reporting, reconciliation and documentation as contributions to the Cardano ecosystem. However, much of this infrastructure appears directly tied to CuTT’s operational needs.

A specialized bridge for this asset does not automatically amount to generic cross-chain infrastructure. Likewise, a reserve dashboard and auditing tools are expected requirements for an operation administering public resources and physical assets. Their existence alone does not constitute a significant technological contribution.

There is insufficient demonstration that the code would be made fully available under an open-source license, that the infrastructure could be reused independently of Toto Finance, or that other projects would have practical conditions for using it. There is also insufficient demonstration of adoption or third-party reuse targets, or of the components’ continued economic relevance after liquidation of the reserve.

Even making the code available would not automatically demonstrate the existence of a meaningful public good. Software utility must be evaluated through its applicability, independence, potential for reuse and concrete contribution to the ecosystem, rather than simply its existence.

**Absence of performance and impact KPIs**

The proposal includes a table titled *Performance Metrics*, but its indicators are essentially operational requirements, compliance controls and acceptance criteria. These include maintaining 1:1 physical backing, monthly reconciliations and periodic audits, segregation and control of funds, compliance with budget limits, milestone completion, and full copper liquidation and closure of obligations by month 36.

These requirements are important for controlling execution, but they do not demonstrate economic performance, adoption or strategic success.

| Dimension | Identified target |
| --- | --- |
| Transaction volume on Cardano | Unknown |
| Number of users or active wallets | Unknown |
| Additional network transactions | Unknown |
| Transaction fees generated | Unknown |
| DEX liquidity | Unknown |
| TVL actually used in DeFi | Unknown |
| Adopted DeFi integrations | Unknown |
| Projects reusing the infrastructure | Unknown |
| Commercial revenue generated for the Treasury | No revenue share provided |

The absence of these targets is particularly significant because the Treasury-funded tranche would remain in reserve, without unilateral authorization for use in DeFi involving exposure to losses.

The proposal therefore does not even present a convincing mechanism for generating relevant economic activity on Cardano from the funded asset itself.

Completion of deliverables does not equal strategic success. Toto Finance could build and audit the bridge, issue the corresponding tokens on Cardano, maintain backing and publish reports, complete every milestone, and close the operation according to schedule, while still producing virtually irrelevant economic activity for Cardano.

There is no contradiction between technically correct execution and a strategically unsuccessful investment.

The proposal does not establish economic performance or ecosystem impact KPIs that would allow an evaluation of whether the public investment achieved results proportionate to its funding. The controls presented are predominantly execution and compliance obligations, rather than measures of investment success.

### Risks and concerns

**Economic asymmetry and private appropriation of benefits**

The Treasury would assume the risks associated with copper acquisition, custody and liquidation, ADA/USD fluctuations, technological implementation and operational execution.

Toto Finance would receive compensation for development and execution, while also being able to develop CuTT commercially and retain its platform revenues. The Treasury would receive no equity, royalties or share of the venture’s commercial revenues.

This does not mean a complete absence of potential financial return: the Treasury would be entitled to the net proceeds from copper sales and could benefit from copper appreciation.

However, assuming full budget expenditure and a constant ADA/USD exchange rate, copper would need to appreciate by approximately **49.4% merely to recover the total amount originally withdrawn from the Treasury**.

Toto Finance could receive up to ₳3,360,023 in the specified compensation and margins, subject to actual execution conditions.

The Treasury would assume significant financial exposure to enable a private commercial activity, without a proportional share in the commercial value potentially created. The distribution of risks and benefits is deeply unbalanced.

**Interconnected deficiencies**

The objection to the Ethereum-first architecture must not be reduced to a criticism of price. A bridge could, under certain circumstances, justify substantial investment. However, its necessity, utility and expected results would need to be demonstrated.

There is no convincing justification for issuing originally on Ethereum instead of using Cardano as the canonical blockchain. There is insufficient granularity to evaluate the ₳2.64 million allocated to development and management. The infrastructure is specialized for CuTT, without sufficient demonstration of independent reuse or broad technological benefit. There are no targets for adoption, transactions, liquidity or revenue generation for Cardano.

The result is a proposal requiring substantial resources to deliver technological infrastructure without establishing criteria capable of demonstrating its economic relevance to the funding ecosystem. This combination is more serious than any individual deficiency.

**Use of the TOTO token**

The proposal conditionally permits ADA → TOTO → USD conversion to pay certain operational expenses, although suppliers receive USD and direct payment is possible.

The mechanism serves as a demonstration of TOTO token utility. This introduces additional risks and costs associated with conversions, liquidity and exposure to an asset linked to the proposer itself.

The operation also reinforces the concern about using public resources to develop and demonstrate private commercial applications.

## 3. Vote and Rationale

**Vote: NO**

The proposal presents an unacceptable combination of insufficiently substantiated budgeting, an asymmetric distribution of risks and benefits, an inadequately justified technological architecture, and an absence of indicators capable of demonstrating economic value for Cardano.

The Treasury would finance copper acquisition and the development of infrastructure associated with a private commercial product whose canonical issuance would occur on Ethereum. Cardano would receive a bridged representation of the asset, accompanied by custody, reconciliation and reporting mechanisms.

The technological investment is not accompanied by a convincing justification for the cross-chain architecture, demonstration of independent infrastructure reuse, or targets for adoption and economic activity on Cardano.

Rejection does not depend on demonstrating that the project is technically unviable. Even if all deliverables are completed, the strategic benefit that would justify committing ₳22 million from the Treasury remains undemonstrated.

The proposal is profoundly unsuitable for funding by the Cardano Treasury. There is no need to develop every possible objection when the structural deficiencies are already sufficient to support a vote against it.

## 4. Conclusion

The cross-chain architecture introduces costs and risks whose necessity has not been convincingly justified. The planned deliverables can be completed in full without producing significant economic benefits for the ecosystem. There is insufficient justification for committing ₳22 million from the Treasury under these conditions.

---

# Relatório de Ação de Governança [PT]

**Cardano Strategic Copper Reserve | ₳22 milhões para tokenização de ativos do mundo real**

## 1. Introdução

A Cardano Strategic Copper Reserve solicita uma retirada única de ₳22.000.000 do Tesouro para a Toto Finance Inc., destinatária sediada nos Estados Unidos e administradora responsável. A iniciativa adquiriria cátodos de cobre COMEX Grade 1 verificados independentemente, em um armazém aprovado pela COMEX nos Estados Unidos, e tokenizaria o metal como CuTT, com cada token representando economicamente uma libra verificada de cobre.

O CuTT canônico seria emitido na Ethereum. Toda a tranche financiada pelo Tesouro seria bloqueada em escrow na Ethereum, com tokens equivalentes transferidos por bridge mantidos na Cardano como sua única representação ativa. Os entregáveis previstos incluem infraestrutura de tokenização, reconciliação de reservas, relatórios públicos e documentação para desenvolvedores.

Do financiamento solicitado, ₳14.724.409 seriam destinados à compra de cobre. O restante financiaria tecnologia e gestão do projeto, operações e assurance, execução e supervisão independente. Um período de manutenção de 18–24 meses seria seguido pela liquidação, com todos os recursos líquidos realizados na venda física e os valores não utilizados ou não devidos devolvidos ao Tesouro até o mês 36. A recuperação do principal original em ADA e o lucro não são garantidos.

Os arranjos jurídicos, de custódia, auditoria e segurança são requisitos anteriores à implantação. A supervisão independente não foi contratada; uma firma membro da PwC nos Estados Unidos é a prestadora potencial preferencial.

## 2. Análise da Ação de Governança

### Aspectos negativos

**Justificativa orçamentária insuficiente**

Apenas ₳14.724.409, equivalentes a 66,93% do financiamento, seriam destinados à aquisição de cobre.

| Categoria | Valor |
| --- | ---: |
| Aquisição de cobre | ₳14.724.409 |
| Execução e aquisição | ₳441.732 |
| Operações, custódia e assurance | ₳3.533.859 |
| Desenvolvimento tecnológico e gestão — Toto Finance | ₳2.640.000 |
| Supervisão independente | ₳660.000 |
| **Total** | **₳22.000.000** |

Os ₳2,64 milhões destinados à Toto Finance são especialmente problemáticos. Embora existam cinco milestones com valores e entregáveis associados, não há discriminação suficiente de horas de trabalho, profissionais, remuneração, custos individuais de componentes, propostas comerciais ou metodologia de precificação.

A distribuição percentual entre milestones não demonstra a razoabilidade econômica dos valores. O mesmo problema se estende a categorias operacionais agregadas, ainda que algumas despesas externas tenham tetos específicos.

Não existe base financeira suficientemente detalhada para concluir que o financiamento solicitado representa uma utilização eficiente dos recursos públicos.

A possibilidade de uma bridge custar caro não resolve essa deficiência. É necessário demonstrar tanto a razoabilidade do custo quanto a necessidade e o valor do componente financiado.

**Arquitetura Ethereum-first e ausência de justificativa estratégica**

A arquitetura proposta utiliza a Ethereum como origem canônica do CuTT. O CuTT seria emitido como ERC-20 na Ethereum. Os tokens correspondentes ao cobre financiado pelo Tesouro seriam bloqueados em escrow na Ethereum, e representações equivalentes seriam emitidas como native assets na Cardano. A tranche financiada pelo Tesouro permaneceria em uma carteira de reserva na Cardano, com queima e reconciliação dos tokens durante a liquidação do cobre.

Os componentes efetivamente implementados na Cardano incluem política de mint/burn, adaptador de transferência, mecanismos de custódia, reconciliação, dashboard, documentação e possíveis integrações de reporting. A emissão canônica e o escrow permaneceriam na Ethereum.

Por que financiar uma bridge especializada para trazer à Cardano a representação de um ativo que poderia, em princípio, ser emitido diretamente na própria Cardano?

Uma implementação cross-chain não é necessariamente simples ou barata. Bridges seguras podem exigir engenharia sofisticada, auditorias e mecanismos complexos de verificação. O problema é que essa complexidade precisa ser justificada.

A proposta não demonstra convincentemente por que a emissão nativa na Cardano seria inadequada, quais vantagens compensariam os custos e riscos adicionais da arquitetura escolhida ou por que o Tesouro deveria financiar uma solução centrada na Ethereum.

A emissão nativa seria uma alternativa arquitetural a ser examinada; sua superioridade técnica não foi formalmente demonstrada.

O Tesouro estaria pagando pela complexidade de uma arquitetura cuja necessidade estratégica não foi estabelecida.

**Valor público questionável dos entregáveis tecnológicos**

A proposta apresenta infraestrutura de tokenização, reporting, reconciliação e documentação como contribuições ao ecossistema Cardano. Entretanto, grande parte dessa infraestrutura parece diretamente vinculada às necessidades operacionais do CuTT.

Uma bridge especializada para esse ativo não equivale automaticamente a uma infraestrutura cross-chain genérica. Da mesma forma, um dashboard de reservas e ferramentas de auditoria são requisitos esperados de uma operação que administra recursos públicos e ativos físicos. Sua existência não constitui, isoladamente, uma contrapartida tecnológica significativa.

Não há demonstração suficiente de que o código seria integralmente disponibilizado sob licença open source, de que a infraestrutura poderia ser reutilizada independentemente da Toto Finance ou de que outros projetos teriam condições práticas de utilizá-la. Também não há demonstração suficiente de metas de adoção ou reutilização por terceiros, nem da continuidade da relevância econômica dos componentes após a liquidação da reserva.

Mesmo uma eventual disponibilização do código não demonstraria automaticamente a existência de um bem público relevante. A utilidade do software deve ser avaliada por sua aplicabilidade, independência, possibilidade de reutilização e contribuição concreta ao ecossistema, não simplesmente por sua existência.

**Ausência de KPIs de desempenho e impacto**

A proposta apresenta uma tabela denominada *Performance Metrics*, mas seus indicadores são essencialmente requisitos operacionais, controles de conformidade e critérios de aceitação. Entre eles estão a manutenção do lastro físico 1:1, reconciliações mensais e auditorias periódicas, segregação e controle dos recursos, respeito aos limites orçamentários, cumprimento dos milestones e liquidação integral do cobre e encerramento das obrigações até o mês 36.

Essas exigências são importantes para controlar a execução, mas não demonstram desempenho econômico, adoção ou sucesso estratégico.

| Dimensão | Meta identificada |
| --- | --- |
| Volume transacionado na Cardano | Unknown |
| Número de usuários ou carteiras ativas | Unknown |
| Transações adicionais na rede | Unknown |
| Taxas de transação geradas | Unknown |
| Liquidez em DEXs | Unknown |
| TVL efetivamente utilizado em DeFi | Unknown |
| Integrações DeFi adotadas | Unknown |
| Projetos reutilizando a infraestrutura | Unknown |
| Receita comercial gerada para o Tesouro | Nenhuma participação prevista |

A ausência dessas metas é especialmente significativa porque a tranche financiada pelo Tesouro permaneceria em reserva, sem autorização unilateral para utilização em DeFi com exposição a perdas.

Portanto, a proposta sequer apresenta um mecanismo convincente de geração de atividade econômica relevante na Cardano a partir do próprio ativo financiado.

Cumprimento de entregáveis não equivale a sucesso estratégico. A Toto Finance poderia construir e auditar a bridge, emitir os tokens correspondentes na Cardano, manter o lastro e publicar os relatórios, cumprir todos os milestones e encerrar a operação conforme o cronograma, e, ainda assim, produzir atividade econômica praticamente irrelevante para Cardano.

Não há contradição entre uma execução tecnicamente correta e um investimento estrategicamente malsucedido.

A proposta não estabelece KPIs de desempenho econômico ou impacto no ecossistema que permitam avaliar se o investimento público alcançou resultados proporcionais ao financiamento. Os controles apresentados são predominantemente obrigações de execução e conformidade, não medidas de sucesso do investimento.

### Riscos e preocupações

**Assimetria econômica e apropriação privada de benefícios**

O Tesouro assumiria os riscos relacionados à aquisição, custódia e liquidação do cobre, à variação ADA/USD, à implementação tecnológica e à execução operacional.

A Toto Finance receberia remuneração pelo desenvolvimento e pela execução, além de poder desenvolver comercialmente o CuTT e conservar as receitas de sua plataforma. O Tesouro não receberia participação societária, royalties ou participação nas receitas comerciais do empreendimento.

Isso não significa ausência absoluta de potencial retorno financeiro: o Tesouro teria direito aos recursos líquidos obtidos com a venda do cobre e poderia beneficiar-se de sua valorização.

Entretanto, considerando o orçamento integral e ADA/USD constante, seria necessária uma valorização aproximada de **49,4% do cobre apenas para recuperar o valor total originalmente retirado do Tesouro**.

A Toto Finance poderia receber até ₳3.360.023 em remuneração e margens previstas, sujeitas às condições efetivas de execução.

O Tesouro assumiria uma exposição financeira significativa para viabilizar uma atividade comercial privada, sem participação proporcional no valor comercial potencialmente criado. A distribuição de riscos e benefícios é profundamente desequilibrada.

**Deficiências interligadas**

A objeção à arquitetura Ethereum-first não deve ser reduzida a uma crítica de preço. Uma bridge poderia, em determinadas circunstâncias, justificar investimentos elevados. Entretanto, seria necessário demonstrar sua necessidade, sua utilidade e os resultados esperados.

Não há justificativa convincente para emitir originalmente na Ethereum em vez de utilizar Cardano como blockchain canônica. Não há granularidade suficiente para avaliar os ₳2,64 milhões destinados ao desenvolvimento e à gestão. A infraestrutura é especializada no CuTT, sem comprovação suficiente de reutilização independente ou benefício tecnológico amplo. Não há metas de adoção, transações, liquidez ou geração de receitas para Cardano.

O resultado é uma proposta que exige recursos substanciais para entregar infraestrutura tecnológica sem estabelecer critérios que permitam demonstrar sua relevância econômica para o ecossistema financiador. Essa combinação é mais grave do que qualquer deficiência isolada.

**Utilização do token TOTO**

A proposta permite, sob condições, a conversão ADA → TOTO → USD para pagamento de determinadas despesas operacionais, embora os fornecedores recebam USD e exista a possibilidade de pagamento direto.

O mecanismo serve como demonstração de utilidade do token TOTO. Isso introduz riscos e custos adicionais associados a conversões, liquidez e exposição a um ativo vinculado ao próprio proponente.

A operação também reforça o questionamento sobre a utilização de recursos públicos para desenvolver e demonstrar aplicações comerciais privadas.

## 3. Voto e Fundamentação

**Voto: NÃO**

A proposta apresenta uma combinação inaceitável de orçamento insuficientemente fundamentado, distribuição assimétrica de riscos e benefícios, arquitetura tecnológica inadequadamente justificada e ausência de indicadores capazes de demonstrar valor econômico para Cardano.

O Tesouro financiaria a aquisição de cobre e o desenvolvimento de infraestrutura associada a um produto comercial privado cuja emissão canônica ocorreria na Ethereum. Cardano receberia uma representação bridged do ativo, acompanhada de mecanismos de custódia, reconciliação e reporting.

O investimento tecnológico não está acompanhado de justificativa convincente para a escolha da arquitetura cross-chain, demonstração de reutilização independente da infraestrutura ou metas de adoção e atividade econômica na Cardano.

A rejeição não depende de demonstrar que o projeto é tecnicamente inviável. Mesmo que todos os entregáveis sejam concluídos, permanece sem demonstração o benefício estratégico que justificaria comprometer ₳22 milhões do Tesouro.

A proposta é profundamente inadequada para financiamento pelo Tesouro Cardano. Não há necessidade de desenvolver todas as possíveis objeções quando as deficiências estruturais já são suficientes para sustentar o voto contrário.

## 4. Conclusão

A arquitetura cross-chain introduz custos e riscos cuja necessidade não foi convincentemente justificada. Os entregáveis previstos podem ser integralmente concluídos sem produzir benefícios econômicos significativos para o ecossistema. Não há justificativa suficiente para comprometer ₳22 milhões do Tesouro nessas condições.
