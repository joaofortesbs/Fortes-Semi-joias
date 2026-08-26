# Fernanda Fortes — Plano estratégico da seção Financeiro

**Autor:** Manus AI  
**Data de referência da pesquisa:** 26 de agosto de 2026  
**Público principal:** gestora da operação de joias e semijoias  
**Status:** especificação estratégica para descoberta e priorização; não é ainda uma implementação técnica

## 1. Resposta curta: qual dor a seção deve resolver?

A plataforma não precisa começar com um “ERP financeiro” genérico. A dor mais provável da gestora é não conseguir responder, com confiança e em poucos minutos, a quatro perguntas operacionais:

> **Quanto dinheiro entrou de verdade? Quanto ainda vou receber? O que preciso pagar e quando? Quanto sobra depois de custo, comissão, desconto e devolução?**

Hoje a operação registra vendas, status de pagamento, comissão, estoque e custo-base de produto, mas não possui uma camada financeira que transforme esses eventos em **caixa previsto, caixa confirmado, compromissos e margem**. Essa lacuna cria a sensação conhecida de “vendi bastante, mas o dinheiro não aparece”. A seção Financeiro deve ser um **cockpit de decisão da gestora**, conectado ao catálogo, pedidos, revendedoras e clientes — não uma tela isolada de lançamentos.

A recomendação é começar por um produto de **controle financeiro operacional da rede**, com foco em contas a receber, contas a pagar, comissões, consignação, margem e conciliação manual assistida. DRE contábil completa, integração bancária profunda, emissão de cobrança, antecipação de recebíveis e fiscal devem ser evoluções posteriores.

## 2. Como a dor aparece na linguagem das operações

A pesquisa pública não substitui entrevistas com as gestoras da Fernanda Fortes; portanto, os itens abaixo são **hipóteses fundamentadas**, não afirmações sobre todas as usuárias. As fontes do próprio segmento descrevem a dor de maneira recorrente: vender sem saber quanto foi efetivamente recebido, quem ainda não pagou, qual é o lucro real e quais produtos continuam valendo a pena [1]. Outra fonte descreve uma operação que controla vendas, recebimentos parcelados e pagamentos a fornecedores em listas mensais separadas, usando caderno ou planilha [2].

| Como a dor tende a ser expressa | O problema de produto por trás | Consequência para a gestora |
|---|---|---|
| “Eu vendo, mas não sei quanto realmente entrou.” | Faturamento e recebimento não são entidades distintas. | Caixa superestimado e decisões de compra erradas. |
| “Tenho que cobrar cada cliente ou revendedora no WhatsApp.” | Não existe agenda de vencimentos, status e próxima ação. | Inadimplência e cobrança dependente de memória. |
| “O dinheiro entra, mas já está comprometido.” | Comissão, custo, fornecedor e parcela futura não estão vinculados ao recebimento. | A gestora confunde saldo disponível com lucro. |
| “Não sei se essa peça dá lucro depois do desconto.” | Custo-base, frete, taxa, comissão e desconto não formam margem líquida. | Promoções corroem margem sem visibilidade. |
| “Tenho mercadoria fora com revendedoras e não sei o que virou venda.” | Consignação não fecha ciclo com estoque, venda, devolução e repasse. | Capital parado, extravio e repasse incorreto. |
| “Cada mês tem uma lista diferente.” | Parcelas a receber e a pagar não possuem calendário financeiro único. | Acúmulo de compromissos e baixa manual inconsistente. |
| “A planilha funciona até ficar grande.” | Registro manual sem fonte única, histórico e automação de status. | Retrabalho, duplicidade e baixa de pagamento esquecida. |

A principal inversão estratégica é esta: **não começar perguntando quais relatórios a gestora quer ver**, mas quais decisões ela precisa tomar. A tela deve ajudá-la a decidir se pode comprar, repor, pagar, repassar, cobrar, conceder desconto ou segurar uma venda.

## 3. Como as gestoras resolvem hoje

### 3.1 Caderno e listas mensais

O método mais simples separa vendas, recebimentos e pagamentos por mês. Para uma venda parcelada, a gestora anota cada parcela no mês em que deve ser recebida; para fornecedores, anota a parcela que vence em cada mês. O modelo é compreensível, mas não oferece vínculo automático entre pedido, cliente, revendedora, peça, comissão, custo e baixa de pagamento [2].

### 3.2 Planilha de vendas

A planilha mais estruturada costuma possuir abas de produtos, vendas, clientes e relatórios. O fluxo esperado é cadastrar custo, preço e estoque; registrar data, cliente, produto, quantidade e forma de pagamento; acompanhar saldo devedor; e visualizar faturamento, lucro e produtos mais vendidos [1]. A planilha atende ao registro inicial, mas força a gestora a manter fórmulas, filtros, cópias mensais e reconciliação manual.

### 3.3 WhatsApp e memória operacional

A cobrança e a confirmação de pagamento frequentemente ficam distribuídas em conversas. Isso é útil como canal de relacionamento, mas frágil como sistema de controle: o WhatsApp contém evidência de conversa, não necessariamente uma visão consolidada de vencidos, pagos, parciais e próximos passos. A Fernanda Fortes deve registrar o evento financeiro e, no futuro, permitir uma ação de comunicação — nunca transformar uma mensagem enviada em pagamento confirmado.

### 3.4 Ferramentas generalistas

Conta Azul representa o padrão de ERP financeiro generalista: integra contas bancárias, importa extratos, faz matching de transações e baixa contas a pagar/receber, alimentando relatórios e fluxo de caixa [5]. Asaas representa a camada de execução de cobrança: Pix, cartão, link, boleto, notificações, consulta de crédito, antecipação de recebíveis e API [6]. Essas ferramentas resolvem automação financeira ampla, mas não nascem do ciclo específico de peça consignada → venda → comissão → recebimento → repasse.

## 4. O que os benchmarks específicos resolvem

### 4.1 Gestão Joias

O Gestão Joias estrutura sua proposta em nove módulos integrados. O módulo de Gestão Financeira comunica contas a pagar, contas a receber, fluxo de caixa e DRE; ao redor dele estão PDV, maletas consignadas, revendedoras, estoque, relatórios, fiscal e IA [3]. A lição é de integração: o financeiro é mais útil quando recebe eventos do restante da operação.

### 4.2 WM10

O WM10 explicita uma operação de maior volume: sacola consignada por revendedora, itens consignados, conversão automática em venda, performance por revendedora, sangria e fechamento de caixa, crediário próprio, carnê, inadimplência, análise de crédito e cobrança automatizada. Também destaca reajuste em lote conforme o custo do banho, controle de margem e histórico de alterações [4]. A lição é que recebimento, crédito e margem são tratados como extensão do giro e da rede comercial.

### 4.3 Jueri

O Jueri se posiciona para consignado, varejo e atacado. Comunica controle do que foi enviado, vendido, devolvido ou trocado por revendedora; comissões progressivas para revendedoras e líderes; catálogo; garantia digital; integrações com lojas e marketplaces; e WhatsApp [7]. A lição é que o evento financeiro depende do relacionamento e do estado físico da peça.

### 4.4 Soften

A Soften descreve como problemas do setor o estoque confuso, margens reduzidas por descontos, gestão financeira desorganizada com entradas, saídas e consignações sem registro preciso, e falta de controle sobre o que foi entregue, vendido ou devolvido [8]. A lição é que margem e consignação devem aparecer na definição do Financeiro desde o início, mesmo que a DRE seja posterior.

### 4.5 Comparação de mecanismos

| Benchmark | Núcleo de valor | Mecanismo financeiro observado | Limite/oportunidade para Fernanda Fortes |
|---|---|---|---|
| Gestão Joias | ERP vertical para joalheria | Pagar, receber, caixa, DRE, maletas, revendedoras e relatórios integrados | Diferenciar pelo cockpit simples e orientado ao relacionamento da rede. |
| WM10 | Alto giro e omnichannel | Crediário, cobrança, inadimplência, caixa, margem, crédito e consignado | Não copiar complexidade antes de provar o fluxo essencial. |
| Jueri | Rede consignada e omnichannel | Ciclo enviado/vendido/devolvido/trocado e comissão progressiva | Explorar repasse e fechamento por revendedora como núcleo. |
| Soften | ERP verticalizado | Custos, precificação, entradas/saídas e consignação | Usar margem e consignação como contexto, não só contabilidade. |
| Conta Azul | Financeiro generalista | Extrato, matching, baixa automática, relatórios e fluxo de caixa | Integrar depois; primeiro modelar eventos da operação. |
| Asaas | Execução de cobrança | Meios de pagamento, cobrança automatizada e antecipação | Ser camada futura de cobrança, não fonte inicial de verdade. |

## 5. Tese de produto recomendada

A nova seção deve se chamar **Financeiro** e ter uma promessa operacional clara:

> **“Saiba o que entrou, o que está para entrar e o que já tem destino — sem separar sua operação em outra planilha.”**

O objeto principal não deve ser “lançamento contábil”. Deve ser o **compromisso financeiro rastreável**, originado de um pedido, uma compra, uma comissão, uma consignação ou uma despesa operacional. Cada compromisso precisa ter origem, vencimento, valor, status, responsável e histórico.

A seção deve usar três estados de verdade em toda a experiência:

| Estado | Significado | Exemplo |
|---|---|---|
| **Previsto** | Deveria acontecer segundo pedido, parcela ou compromisso. | Parcela de R$ 150 com vencimento em 10/09. |
| **Confirmado** | Foi efetivamente recebido ou pago, com data e meio. | Pix recebido em 09/09. |
| **Comprometido** | Está reservado para uma obrigação ou repasse. | Comissão devida e custo de reposição já alocado. |

Sem esses estados, a gestora continuará vendo faturamento como se fosse caixa e saldo como se fosse lucro.

## 6. Escopo funcional tangível

### 6.1 Visão “Hoje”

A primeira tela deve responder o que exige atenção agora. O cabeçalho mostra período selecionável e quatro indicadores, sem números fictícios quando não houver dados:

| Indicador | Regra de negócio | Ação associada |
|---|---|---|
| A receber nos próximos 7 dias | Soma de parcelas previstas não pagas com vencimento no intervalo. | Abrir recebíveis filtrados. |
| Em atraso | Soma de parcelas vencidas não pagas. | Abrir cobrança prioritária. |
| A pagar nos próximos 7 dias | Soma de compromissos de fornecedor/despesa vencendo no intervalo. | Abrir pagamentos. |
| Caixa confirmado no período | Entradas confirmadas menos saídas confirmadas. | Abrir fluxo detalhado. |

Abaixo, a tela apresenta uma agenda de vencimentos e um bloco “precisa de atenção” com atrasos, repasses de comissão pendentes, consignações sem fechamento e lançamentos sem categoria.

### 6.2 Receber

A lista de recebíveis deve agrupar por **cliente, revendedora, pedido e vencimento**, com filtros por status, período, origem e responsável. Cada item deve permitir registrar pagamento total ou parcial, informar meio, data de recebimento e observação. O sistema não deve transformar “pedido entregue” automaticamente em “recebido”.

O detalhe de um recebível deve exibir a origem operacional: pedido, cliente, revendedora, itens, valor bruto, descontos, comissão, parcelas, pagamentos confirmados e saldo restante. A ação primária é **Registrar recebimento**; a ação secundária futura pode ser **Enviar lembrete**, mediante integração explicitamente configurada.

### 6.3 Pagar

A gestora deve registrar compromissos recorrentes e avulsos, principalmente fornecedor, frete, embalagem, taxa de pagamento, manutenção, marketing e outras despesas da operação. Cada compromisso contém categoria, fornecedor, vencimento, valor, recorrência opcional, centro de responsabilidade e status.

O sistema deve permitir parcelar uma compra ou despesa e mostrar o calendário mensal. O objetivo não é substituir a contabilidade: é evitar que contas futuras desapareçam em conversas, recibos ou memória.

### 6.4 Comissões e repasses

O Financeiro deve reaproveitar a comissão já calculada nos pedidos, mas separar três conceitos: **comissão calculada**, **comissão aprovada** e **comissão paga**. O fechamento por revendedora deve exibir vendas elegíveis, devoluções/cancelamentos, comissão bruta, ajustes, valor líquido e data de repasse.

A regra recomendada para o MVP é não marcar a comissão como paga quando o pedido é apenas criado. A gestora deve aprovar ou pagar o repasse conforme a política comercial definida. Essa separação elimina um risco comum: tratar comissão potencial como obrigação já liquidada ou pagar antes de receber.

### 6.5 Margem e rentabilidade

A visão de margem deve ser contextual ao catálogo e aos pedidos. Para cada peça, coleção, pedido ou revendedora, calcular:

`margem operacional estimada = venda líquida – custo-base – desconto – taxa de pagamento – comissão`

Frete, quebra, devolução e impostos devem ser campos configuráveis ou explicitamente marcados como não incluídos; não devem ser inventados. A interface deve distinguir “margem conhecida” de “margem incompleta”. Isso é mais confiável do que mostrar um percentual preciso baseado em dados ausentes.

### 6.6 Fluxo de caixa

O fluxo de caixa mensal deve separar barras ou linhas de entradas previstas, entradas confirmadas, saídas previstas e saídas confirmadas. O primeiro release pode ser uma tabela agrupada por dia/semana; gráfico é secundário. O foco é permitir que a gestora identifique semanas de aperto antes que elas aconteçam.

## 7. Modelo de domínio proposto

A base atual, em `client/src/lib/localStore.ts`, possui `Order`, `PaymentStatus`, `PaymentMethod`, `commission`, `commissionRate`, `saleDate`, `Product`, custo privado e `Store`, mas não possui parcela, vencimento, conta financeira, recebimento, despesa ou repasse como entidades independentes. O Financeiro deve evoluir esse modelo sem sobrecarregar `Order`.

| Entidade | Campos essenciais | Relações |
|---|---|---|
| `FinancialAccount` | id, nome, tipo, saldo inicial opcional, ativo | Conta caixa, banco ou carteira; sem armazenar credenciais bancárias. |
| `Receivable` | id, sourceType, sourceId, customerId, resellerId, orderId, amount, dueDate, status | Nasce de pedido/condição de pagamento. |
| `ReceivableInstallment` | id, receivableId, sequence, dueDate, amount, paidAmount, status | Permite parcial e parcelamento. |
| `PaymentSettlement` | id, installmentId, accountId, amount, receivedAt, method, reference | Representa dinheiro confirmado. |
| `Payable` | id, category, supplierName, description, amount, dueDate, recurrence, status | Compra, fornecedor ou despesa operacional. |
| `CommissionLedger` | id, resellerId, orderId, grossAmount, adjustments, netAmount, status | Calculada, aprovada, paga ou estornada. |
| `ConsignmentSettlement` | id, resellerId, period, sentValue, soldValue, returnedValue, commission, payableAmount, status | Fecha o ciclo da maleta/sacola quando existir. |
| `FinancialCategory` | id, name, direction, active | Entrada, saída, comissão, custo, taxa ou transferência. |

Todos os valores persistidos devem ser tratados com precisão monetária e timestamps UTC no backend. A implementação server-side deve aplicar autorização por gestora/organização; a revendedora não deve acessar custo-base, caixa global, contas a pagar ou margem consolidada.

## 8. MVP recomendado

### Entram no MVP

1. Dashboard “Hoje” com previsto, confirmado, comprometido e atrasado.
2. Contas a receber por pedido/cliente/revendedora, com parcelas e baixa manual parcial ou total.
3. Contas a pagar simples com categorias, vencimentos, parcelas e baixa.
4. Livro de comissões calculadas, aprovadas e pagas.
5. Fluxo de caixa previsto versus confirmado por período.
6. Margem estimada por pedido e produto quando custo-base estiver disponível.
7. Histórico de alterações, filtros, exportação CSV e estados vazios honestos.
8. Permissão exclusiva da gestora e trilha de auditoria mínima.

### Ficam fora do primeiro release

Integração bancária, matching automático de extrato, boleto/Pix gerado pela plataforma, cobrança automática, antecipação de recebíveis, score de crédito, DRE contábil, emissão fiscal, multiempresa avançado e conciliação de cartão. Esses itens têm valor, mas dependem de fonte de dados e integrações mais maduras.

## 9. Fluxos críticos da gestora

### Fechamento de venda

Ao criar um pedido, o sistema deve criar o recebível previsto conforme a condição de pagamento, sem marcar recebimento automaticamente. Se a venda for por revendedora, também cria comissão calculada e compromisso de repasse condicionado à regra comercial.

### Registro de recebimento

A gestora abre um recebível, confirma o valor e o meio, registra o pagamento parcial ou total e escolhe a conta que recebeu. O status muda para pago somente quando o saldo estiver zerado. O pedido pode continuar entregue enquanto o financeiro mostra saldo em aberto — são dimensões diferentes.

### Fechamento de revendedora

A gestora filtra a revendedora e o período, confere pedidos, devoluções, valores recebidos e comissão. Ao aprovar, o sistema congela o cálculo daquele ciclo. Ao pagar, registra conta de saída, data e comprovante opcional futuro.

### Compra de reposição

A gestora registra fornecedor, peças ou categoria, custo, frete, condições e parcelas. O custo-base do catálogo pode ser atualizado em uma ação separada e auditável; não deve mudar silenciosamente porque uma conta a pagar foi cadastrada.

### Cobrança de atraso

A tela mostra atraso, origem, valor, última tentativa e próxima ação. O sistema deve permitir registrar contato realizado. Não deve alegar que o cliente foi notificado sem integração de comunicação comprovável.

## 10. Métricas de sucesso

O sucesso inicial não deve ser “quantidade de gráficos”. Deve ser a redução da incerteza e do retrabalho da gestora. Recomenda-se medir:

| Métrica | Definição | Sinal de sucesso |
|---|---|---|
| Cobertura de recebíveis | Percentual de pedidos com condição/parcela financeira válida. | Cresce sem aumentar correções manuais. |
| Taxa de baixa | Recebíveis pagos que foram registrados como confirmados. | Aproxima-se do comportamento real da operação. |
| Valor vencido sem ação | Soma de atrasados sem contato, acordo ou baixa. | Cai ao longo dos ciclos. |
| Tempo de fechamento | Tempo para fechar um período de pedidos/comissões. | Cai comparado à planilha. |
| Divergência de comissão | Diferença entre cálculo esperado e valor aprovado/pago. | Reduz e fica explicável. |
| Margem incompleta | Pedidos com custo ou taxa ausente. | Cai à medida que a base melhora. |
| Adoção semanal | Gestoras que consultam a visão Hoje e registram eventos. | Uso recorrente em rotina de fechamento. |

Não se devem prometer percentuais de redução de inadimplência ou horas economizadas antes de medir uma linha de base própria.

## 11. Riscos e decisões de segurança

O maior risco é construir uma tela bonita sobre dados financeiros incompletos. Se o sistema não conhece vencimento, parcela, custo, taxa ou confirmação, deve exibir “não informado” ou “estimativa”, não inventar precisão.

O segundo risco é misturar persistência local e server-side. O Financeiro deve nascer server-first, com isolamento por gestora/organização, idempotência, histórico de alterações e proteção para valores privados. O `localStorage` pode ser fallback de protótipo, mas não deve ser a fonte de verdade de caixa, pagamentos ou comissões em produção.

O terceiro risco é usar integração bancária ou cobrança antes de resolver o domínio. A conciliação automática só é confiável quando o sistema já possui compromissos bem formados. A cobrança automática exige consentimento, configuração de canal, tratamento de falha e trilha de auditoria.

O quarto risco é expor dados à revendedora. A revendedora deve visualizar apenas seus pedidos, seus repasses e eventualmente seus próprios recebíveis; nunca o caixa global, custo-base, despesas da gestora ou margem consolidada da rede.

## 12. Plano de descoberta antes de construir

A pesquisa pública revelou padrões, mas ainda não provou a dor específica da Fernanda Fortes. Antes de implementar o MVP, conduzir cinco entrevistas de 30 minutos com gestoras, observando um fechamento real de semana ou mês. Pedir que mostrem o caderno, planilha, WhatsApp e sistema atual, sem solicitar dados financeiros sensíveis; usar dados anonimizados.

As perguntas centrais são: “qual foi a última vez em que você achou que tinha dinheiro e não tinha?”, “como sabe quem precisa pagar hoje?”, “como fecha a comissão de uma revendedora?”, “o que acontece quando há devolução?”, “como sabe se uma promoção deu lucro?”, “qual informação você procura primeiro na planilha?” e “qual ação você tomaria se a plataforma avisasse que o caixa ficará negativo em duas semanas?”.

A decisão de construir deve ser tomada quando pelo menos três das cinco gestoras relatarem o mesmo fluxo quebrado, mostrarem um workaround comparável e aceitarem testar um protótipo com seus próprios dados anonimizados.

## 13. Backlog priorizado

| Prioridade | Item | Motivo |
|---|---|---|
| P0 | Definir política de recebimento, comissão, devolução e vencimento com a gestora. | Sem regra, o sistema apenas automatiza ambiguidade. |
| P0 | Criar modelo server-side de recebíveis, parcelas, baixa e histórico. | É a fonte do problema caixa versus venda. |
| P0 | Criar visão Hoje e lista de atrasados. | Entrega valor operacional imediato. |
| P0 | Separar comissão calculada/aprovada/paga. | Evita erro de repasse e conflito com a rede. |
| P1 | Contas a pagar e calendário de compromissos. | Fecha a visão de capital de giro. |
| P1 | Margem estimada por pedido/produto. | Conecta Financeiro ao Catálogo e preço. |
| P1 | Exportação e fechamento mensal auditável. | Facilita conferência e confiança. |
| P1 | Eventos de consignação e fechamento por revendedora. | Diferencial vertical da operação. |
| P2 | Integração de cobrança por provedor. | Reduz trabalho, mas depende de domínio validado. |
| P2 | Conciliação bancária e cartão. | Automatiza confirmação, mas exige integração segura. |
| P2 | DRE e relatórios avançados. | Útil após a base operacional estar confiável. |
| P3 | IA para previsão, cobrança e recomendação de mix. | Só depois de dados históricos suficientes. |

## 14. Recomendação final

A seção Financeiro deve ser construída como **controle de compromissos e decisões da rede**, não como uma réplica reduzida de Conta Azul. O primeiro release deve fazer a gestora sentir três ganhos concretos: saber o que vence e está atrasado, fechar comissões sem depender de cálculo paralelo e entender quanto sobra depois dos custos conhecidos.

A plataforma já tem os eventos essenciais — pedidos, clientes, revendedoras, produtos, estoque, status de pagamento, comissão e custo privado. O próximo passo não é adicionar gráficos: é transformar esses eventos em entidades financeiras rastreáveis, com vencimento, confirmação, compromisso e permissão. Se esse fundamento for correto, integrações bancárias, cobrança, DRE e previsões poderão ser adicionadas sem reescrever o produto.

## Referências

[1]: https://blog.gazinsemijoias.com.br/dicas-de-vendas/planilha-vendas-revendedoras-semijoias/ "Gazin Semijoias — Planilha de Vendas para Revendedora de Semijoias"

[2]: https://vivacita.com.br/o-guia-completo-do-controle-financeiro-na-revenda-de-semijoias/ "Vivacità — O guia completo do controle financeiro na revenda de semijoias"

[3]: https://gestaojoias.com.br/funcionalidades "Gestão Joias — Funcionalidades"

[4]: https://www.wm10.com.br/erp-para-bijuterias "WM10 — ERP para Bijuterias e Semijoias"

[5]: https://contaazul.com/funcionalidades/conciliacao-bancaria/ "Conta Azul — Conciliação bancária automática para PMEs"

[6]: https://www.asaas.com/ "Asaas — Conta digital PJ e cobranças"

[7]: https://jueri.com.br/post/jueri-o-melhor-sistema-para-semijoias-consignado-varejo-e-atacado "Jueri — Sistema para Semijoias Consignado, Varejo e Atacado"

[8]: https://www.softensistemas.com.br/sistema-para-loja-semijoias "Soften — Sistema para Loja de Semi Joias"
