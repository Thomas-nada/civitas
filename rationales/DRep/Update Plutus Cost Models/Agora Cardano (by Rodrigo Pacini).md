<!-- url: https://most-brass-sun.quicknode-ipfs.com/ipfs/QmeMLWJrJHXqwfYRKnVHc3tmtn5PyS8tiGQaN1KujGEycV -->
# Agora Cardano (by Rodrigo Pacini)

**Proposal:** Update Plutus Cost Models
**Vote:** Abstain
**Voter ID:** `drep1yt9dq806jcm56wzhnv2yrf6gcyq7h4gap8gxewfykk0dtfs7vf843`

---

# Governance Action Report [EN]

## 1. Introduction

This governance action proposes to update the Plutus V3 Cost Model through a Parameter Update governance action. The update enables the new Plutus primitives that will become available after the van Rossem hard fork to Protocol Version 11, enables all Plutus primitives in Plutus V1 and V2 as well as Plutus V3, and changes settings for some existing Plutus primitives.

The new primitives will not become available under Protocol Version 10. They will only become available after the hard fork to Protocol Version 11. However, changes to existing primitives will take effect immediately upon enactment of this governance action.

The governance action states that the changes were recommended by Intersect’s Parameter Committee, confirmed by Intersect’s Technical Steering Committee, and tested through equivalent changes enacted on SanchoNet, Preview, and Preprod. The proposal also states that benchmarking results were obtained for the new primitives and that changes to existing primitives were benchmarked. The update introduces primitives related to cryptography, list manipulation, array operations, and value and data manipulation, and declares consistency with the relevant Cardano Constitution guardrails for Plutus cost model updates.

## 2. Governance Action Analysis

### Positive aspects

This is a highly technical protocol parameter update, and Agora does not have the technical expertise required to independently evaluate the correctness of the proposed Plutus cost model changes, the benchmarking assumptions, or the potential compatibility effects on existing applications.

For that reason, Agora must rely substantially on the expertise of the relevant technical committees and the individuals involved in reviewing and discussing the proposed changes. The process appears to have received broad support from the technical bodies involved, and the proposal states that the update was recommended by Intersect’s Parameter Committee, confirmed by the Technical Steering Committee, and deployed on SanchoNet, Preview, and Preprod before mainnet submission. The proposal also states that the cost model changes are based on benchmarking and are intended to support the Plutus primitives associated with Protocol Version 11.

### Risks and concerns

Agora does not feel comfortable voting YES because there are unresolved concerns that cannot be independently assessed. The proposal itself makes clear that, while the new primitives will only become available after the Van Rossem hard fork, changes to existing primitives will take effect immediately upon enactment of this governance action. This creates a different risk profile from a purely future-facing activation step.

There are also concerns raised in the broader review process regarding backward compatibility, potential effects on existing applications, and whether some changes should have been introduced through a new Plutus version rather than through the current update path. One external rationale argues that the changes should be proposed under Plutus V4 instead of as an extension of Plutus V3, citing backward compatibility concerns and possible downstream transaction-builder issues. Another rationale explicitly notes reliance on the Intersect Parameter and Technical Steering Committees while requesting an update from those teams if backward compatibility issues require resolution.

The TSC meeting notes also indicate that there was awareness of risks related to increasing costs, careful testing, timing pressure, and the possibility of retracting the governance action if issues were found before enactment. In addition, some supporting communication material appears to be access-restricted, which is not ideal for material intended to support public governance decision-making.

## 3. Vote and Rationale

Vote: ABSTAIN.

Given these uncertainties, Agora does not believe a YES vote would be responsible. At the same time, Agora also does not believe a NO vote is justified, because there was strong support from the technical participants involved in the process, and there is not sufficient technical basis to conclude that the action should be blocked.

Therefore, Agora will abstain.

This abstention reflects uncertainty and limits of technical competence, not opposition to the objective of improving Plutus or supporting the Van Rossem hard fork. For highly technical governance actions where there is broad expert support but also unresolved compatibility or process concerns that cannot be independently evaluated, abstention is the most responsible position.

Conditions or signals that could change the vote: an update from the Intersect Parameter and Technical Steering Committees if backward compatibility issues require resolution.

## 4. Conclusion

The governance action has broad technical support and is tied to Plutus improvements for Protocol Version 11, but unresolved compatibility and process concerns remain outside Agora’s independent technical capacity to evaluate. A YES vote would not be responsible, while a NO vote would not be justified. The resulting position is ABSTAIN.

---

# Relatório de Ação de Governança [PT-BR]

## 1. Introdução

Esta ação de governança propõe atualizar o Modelo de Custo do Plutus V3 por meio de uma ação de governança de Atualização de Parâmetros. A atualização habilita os novos primitivos Plutus que ficarão disponíveis após o hard fork Van Rossem para a Versão de Protocolo 11, habilita todos os primitivos Plutus em Plutus V1 e V2, além de Plutus V3, e altera configurações de alguns primitivos Plutus existentes.

Os novos primitivos não ficarão disponíveis na Versão de Protocolo 10. Eles somente ficarão disponíveis após o hard fork para a Versão de Protocolo 11. No entanto, as mudanças em primitivos existentes entrarão em vigor imediatamente após a promulgação desta ação de governança.

A ação de governança afirma que as mudanças foram recomendadas pelo Comitê de Parâmetros da Intersect, confirmadas pelo Comitê Técnico Diretor da Intersect e testadas por meio de mudanças equivalentes promulgadas na SanchoNet, Preview e Preprod. A proposta também afirma que resultados de benchmarking foram obtidos para os novos primitivos e que as mudanças em primitivos existentes foram submetidas a benchmarking. A atualização introduz primitivos relacionados a criptografia, manipulação de listas, operações com arrays e manipulação de valores e dados, e declara consistência com os guardrails relevantes da Constituição da Cardano para atualizações do modelo de custo do Plutus.

## 2. Análise da Ação de Governança

### Aspectos positivos

Esta é uma atualização de parâmetro de protocolo altamente técnica, e a Agora não possui a expertise técnica necessária para avaliar independentemente a correção das mudanças propostas no modelo de custo do Plutus, as premissas de benchmarking ou os potenciais efeitos de compatibilidade sobre aplicações existentes.

Por esse motivo, a Agora deve se apoiar substancialmente na expertise dos comitês técnicos relevantes e dos indivíduos envolvidos na revisão e discussão das mudanças propostas. O processo parece ter recebido amplo apoio dos órgãos técnicos envolvidos, e a proposta afirma que a atualização foi recomendada pelo Comitê de Parâmetros da Intersect, confirmada pelo Comitê Técnico Diretor e implantada na SanchoNet, Preview e Preprod antes da submissão à mainnet. A proposta também afirma que as mudanças no modelo de custo são baseadas em benchmarking e têm como objetivo dar suporte aos primitivos Plutus associados à Versão de Protocolo 11.

### Riscos e preocupações

A Agora não se sente confortável em votar YES porque há preocupações não resolvidas que não podem ser avaliadas independentemente. A própria proposta deixa claro que, embora os novos primitivos somente fiquem disponíveis após o hard fork Van Rossem, as mudanças em primitivos existentes entrarão em vigor imediatamente após a promulgação desta ação de governança. Isso cria um perfil de risco diferente de uma etapa de ativação puramente voltada ao futuro.

Também há preocupações levantadas no processo mais amplo de revisão a respeito de compatibilidade retroativa, potenciais efeitos sobre aplicações existentes e se algumas mudanças deveriam ter sido introduzidas por meio de uma nova versão do Plutus, em vez do caminho atual de atualização. Um rationale externo argumenta que as mudanças deveriam ser propostas sob Plutus V4, em vez de como uma extensão do Plutus V3, citando preocupações de compatibilidade retroativa e possíveis problemas downstream em transaction builders. Outro rationale observa explicitamente a confiança depositada nos Comitês de Parâmetros e Técnico Diretor da Intersect, ao mesmo tempo em que solicita uma atualização desses times caso problemas de compatibilidade retroativa precisem ser resolvidos.

As notas da reunião do TSC também indicam que havia consciência de riscos relacionados ao aumento de custos, testes cuidadosos, pressão de timing e possibilidade de retrair a ação de governança se problemas fossem encontrados antes da promulgação. Além disso, parte do material de comunicação de suporte parece ter acesso restrito, o que não é ideal para materiais destinados a apoiar a tomada de decisão pública em governança.

## 3. Voto e Justificativa

Voto: ABSTAIN.

Dadas essas incertezas, a Agora não acredita que um voto YES seria responsável. Ao mesmo tempo, a Agora também não acredita que um voto NO seja justificado, porque houve forte apoio dos participantes técnicos envolvidos no processo, e não há base técnica suficiente para concluir que a ação deve ser bloqueada.

Portanto, a Agora se absterá.

Esta abstenção reflete incerteza e limites de competência técnica, não oposição ao objetivo de melhorar o Plutus ou apoiar o hard fork Van Rossem. Para ações de governança altamente técnicas em que há amplo apoio especializado, mas também preocupações de compatibilidade ou processo não resolvidas que não podem ser avaliadas independentemente, a abstenção é a posição mais responsável.

Condições ou sinais que poderiam alterar o voto: uma atualização dos Comitês de Parâmetros e Técnico Diretor da Intersect caso problemas de compatibilidade retroativa precisem ser resolvidos.

## 4. Conclusão

A ação de governança possui amplo apoio técnico e está ligada a melhorias do Plutus para a Versão de Protocolo 11, mas permanecem preocupações de compatibilidade e processo fora da capacidade técnica independente de avaliação da Agora. Um voto YES não seria responsável, enquanto um voto NO não seria justificado. A posição resultante é ABSTAIN.
