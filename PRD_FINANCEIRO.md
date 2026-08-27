# PRD — Seção Financeiro

## Fernanda Fortes | Plataforma de gestão para redes de semijoias

**Versão:** 1.0  
**Status:** Aprovado para discussão e planejamento técnico; **nenhuma implementação está incluída neste documento**.  
**Público primário:** Gestora da operação.  
**Perfis afetados:** Gestora, Revendedora e Administrador de plataforma.  
**Data:** 26 de agosto de 2026.  
**Documentos de origem:** `PLANO_SECAO_FINANCEIRO.md`, `pesquisa_financeiro_achados.md`, `todo.md` e a arquitetura vigente do workspace.

> **Decisão central:** Financeiro será um cockpit operacional da rede — não uma réplica genérica de ERP contábil. O produto deve responder, com rastreabilidade, **o que estava previsto, o que foi confirmado e o que já está comprometido**.

---

## 1. Resumo executivo

A plataforma Fernanda Fortes já organiza produtos, catálogo, clientes, pedidos, revendedoras, estoque, status de pagamento, comissões e custo-base privado. O que falta é transformar esses eventos operacionais em uma visão financeira confiável para a gestora. Hoje, uma venda pode existir sem parcelas, vencimento, baixa, conta de recebimento, compromisso de comissão ou vínculo explícito com caixa. Isso impede a gestora de saber quanto entrou de verdade, quanto ainda receberá, o que precisa pagar e quanto sobra depois de custo, desconto e comissão.

A nova seção **Financeiro** será adicionada à sidebar lateral esquerda da área autenticada da gestora. No MVP, ela terá seis superfícies: **Visão Hoje**, **Receber**, **Pagar**, **Comissões e repasses**, **Margem** e **Fluxo de caixa**. A entrada será exclusiva da gestora; a revendedora não verá o caixa global, contas a pagar, custo-base ou margem consolidada da rede.

O MVP deve começar por recebíveis e calendário de compromissos porque são o ponto de maior risco operacional: vendas parceladas, clientes ou revendedoras em atraso, fornecedores a pagar, comissões devidas e capital de giro. A seção não deve começar com integração bancária, cobrança automática, DRE contábil ou inteligência artificial. Essas capacidades dependem de um domínio financeiro bem definido e de credenciais/integrações ainda não validadas.

A recomendação de posicionamento é:

> **“Saiba o que entrou, o que está para entrar e o que já tem destino — sem separar sua operação em outra planilha.”**

---

## 2. Contexto da plataforma atual

### 2.1 O que já existe

A implementação atual possui um shell autenticado com sidebar esquerda em `client/src/components/AppShell.tsx`. A navegação é derivada de `SECTION_REGISTRY`, em `shared/sectionRegistry.ts`, e o painel da gestora roteia as seções no `ManagerDashboard.tsx`. Portanto, Financeiro deve ser tratado como uma seção de primeiro nível, e não como uma subpágina escondida dentro de Painel ou Pedidos.

O domínio atual em `client/src/lib/localStore.ts` possui `Order`, `PaymentMethod`, `PaymentStatus`, `commission`, `commissionRate`, `saleDate`, `Product`, custo privado de produto e `Store`. O pedido tem status operacional e situação de pagamento, mas ainda não possui um modelo independente para parcelas, vencimentos, liquidações, contas financeiras, despesas, repasses ou fechamento de consignação.

A persistência remota atual possui isolamento por organização e regras para distinguir gestora/owner de revendedora no servidor. Essa base deve ser reutilizada. O Financeiro não deve depender de decisões feitas apenas na UI ou de filtros no `localStorage`.

### 2.2 O que ainda não existe

Não há, como entidades financeiras independentes, contas de caixa/banco, contas a receber, parcelas, pagamentos confirmados, contas a pagar, categorias, ledger de comissões, fechamento de consignação ou trilha financeira de auditoria. Também não há validação autenticada concluída do Supabase: tentativas anteriores retornaram HTTP 401. O PRD define os requisitos de RLS e isolamento, mas não declara que a configuração atual já está validada.

### 2.3 Evidência de mercado

Fontes públicas do segmento descrevem a operação manual com caderno, planilhas mensais e WhatsApp: registrar vendas, parcelas a receber, pagamentos a fornecedores, clientes inadimplentes e lucro [1][2]. Benchmarks específicos comunicam contas a pagar/receber, fluxo de caixa, DRE, consignação, comissões, crediário, inadimplência, margem e performance por revendedora [3][4][5][6]. Ferramentas generalistas, como Conta Azul e Asaas, adicionam conciliação bancária, baixa automática, cobrança multicanal e antecipação [7][8].

Essas evidências sustentam a oportunidade, mas não substituem entrevistas com as gestoras da Fernanda Fortes. As regras comerciais do MVP devem ser confirmadas antes de congelar o schema definitivo.

---

## 3. Problema

### 3.1 Problema principal

A gestora não possui uma fonte única e operacionalmente confiável para entender a diferença entre **venda realizada**, **dinheiro recebido**, **valor comprometido**, **comissão devida**, **custo da mercadoria** e **lucro estimado**.

### 3.2 Problemas secundários

| ID | Problema | Sintoma atual | Risco |
|---|---|---|---|
| P-01 | Recebimento não é modelado como parcela | Pedido pode estar pago ou pendente sem vencimento e baixa detalhados | Caixa superestimado e cobrança esquecida |
| P-02 | Contas a pagar ficam fora do fluxo da operação | Fornecedor, frete e despesa aparecem em listas, conversas ou memória | Falta de capital de giro |
| P-03 | Comissão é confundida com pagamento | Comissão calculada pode ser tratada como já liquidada | Repasse incorreto e conflito com revendedora |
| P-04 | Consignação não fecha ciclo financeiro | Peça enviada, vendida, devolvida e repassada não formam um fechamento único | Capital parado, extravio e divergência |
| P-05 | Margem não considera todos os componentes | Custo-base existe, mas desconto, taxa, frete e comissão podem ficar fora | Promoção que destrói lucro |
| P-06 | Cobrança depende de memória | WhatsApp e planilha não produzem fila de ação | Inadimplência e retrabalho |
| P-07 | Venda e caixa são exibidos como se fossem iguais | Faturamento vira proxy de disponibilidade | Compra e retirada mal dimensionadas |

### 3.3 Hipótese a validar

> Se a gestora tiver uma visão diária de vencimentos, uma lista confiável de recebíveis e um fechamento explícito de comissões, ela reduzirá o uso de planilhas paralelas e tomará decisões de compra, cobrança e repasse com mais segurança.

Essa hipótese só será considerada confirmada depois de entrevistas com pelo menos cinco gestoras e observação de um fechamento real de semana ou mês.

---

## 4. Persona e jobs-to-be-done

### 4.1 Persona primária: gestora

A gestora administra a operação, cadastra produtos, acompanha estoque, recebe pedidos, aprova revendedoras, define comissão, coordena consignação, compra mercadoria, cobra clientes e revendedoras, paga fornecedores e decide quando pode reinvestir ou retirar dinheiro. Ela precisa de clareza e velocidade, não de terminologia contábil excessiva.

### 4.2 Jobs-to-be-done

| Job | Situação | Resultado desejado |
|---|---|---|
| Fechar o dia | Depois de vendas e movimentações | Saber o que entrou, ficou pendente e exige ação |
| Preparar a semana | Antes de comprar ou pagar | Ver compromissos, vencimentos e caixa confirmado |
| Cobrar | Quando há atraso | Saber quem, quanto, desde quando e qual é a próxima ação |
| Fechar revendedora | Ao encerrar um ciclo de consignação | Conferir vendas, devoluções, comissão e repasse |
| Comprar reposição | Antes de fazer pedido ao fornecedor | Ver margem, giro, caixa futuro e parcelas a pagar |
| Fazer promoção | Antes de conceder desconto | Saber se a margem conhecida continua positiva |
| Pagar comissão | No ciclo acordado | Pagar apenas o valor aprovado e rastreável |
| Explicar um número | Quando há divergência | Abrir a origem, histórico e cálculo do valor |

### 4.3 Perfis secundários

A **revendedora** poderá, em uma evolução posterior, consultar apenas seus próprios pedidos, recebimentos ou repasses. No MVP, não terá uma seção Financeiro global. O **administrador de plataforma** poderá ter acesso técnico/operacional conforme o modelo de suporte, sem acesso desnecessário ao conteúdo financeiro de organizações.

---

## 5. Objetivos e não objetivos

### 5.1 Objetivos do MVP

1. Dar à gestora uma visão confiável de recebimentos, pagamentos e compromissos próximos.
2. Separar venda registrada de dinheiro confirmado.
3. Permitir parcelas, pagamentos parciais, baixa total e histórico.
4. Tornar comissão calculada, aprovada e paga estados diferentes.
5. Conectar margem conhecida aos dados de custo, desconto, taxa e comissão.
6. Criar uma primeira fonte financeira server-side por organização.
7. Reduzir fechamento paralelo em planilha sem inventar precisão quando faltarem dados.
8. Manter a experiência coerente com a plataforma elegante, clara e refinada.

### 5.2 Não objetivos do MVP

O MVP não substituirá contador, sistema fiscal, banco, adquirente ou plataforma de cobrança. Não incluirá, inicialmente, conciliação bancária automática, emissão de boleto/Pix, score de crédito, negativação, antecipação de recebíveis, DRE contábil completa, integração com marketplace, multiempresa avançado ou previsões por IA.

---

## 6. Informação e navegação

### 6.1 Entrada na sidebar

Adicionar o item **Financeiro** ao `SECTION_REGISTRY` com:

| Propriedade | Requisito |
|---|---|
| `id` | `financeiro` |
| `label` | `Financeiro` |
| `managerLabel` | `Financeiro` |
| `resellerLabel` | Não disponível no MVP |
| `icon` | Ícone financeiro consistente com o conjunto existente, sem criar linguagem visual paralela |
| `roles` | `gestora` e, se o contrato exigir, somente o perfil gestor equivalente |
| Posição | Depois de `Pedidos` e antes de `Revendedoras`, salvo validação de uso que indique outra prioridade |

A posição deve refletir o fluxo mental da gestora: ver operação, catálogo, pedidos, dinheiro, rede. Como Financeiro é sensível, a entrada não deve aparecer para revendedoras.

### 6.2 Sidebar expandida e colapsada

Na sidebar expandida, o item exibe ícone e label. Na sidebar colapsada, o ícone precisa possuir nome acessível, tooltip e estado ativo inequívoco. O item ativo deve usar o mesmo tratamento visual das demais seções, com contraste suficiente nos temas claro e escuro.

### 6.3 Mobile

No mobile, Financeiro deve aparecer no mesmo menu/Sheet usado pelas outras seções da gestora, sem criar uma navegação paralela. O fechamento do menu deve ocorrer após a seleção. O título contextual do AppShell deve atualizar para “Financeiro”.

### 6.4 Arquitetura interna

A seção terá uma navegação secundária de abas ou segmentos, persistida apenas na URL/estado de rota, com as seguintes opções:

1. **Hoje** — alertas e visão executiva do período.
2. **Receber** — contas a receber e parcelas.
3. **Pagar** — compromissos e despesas.
4. **Comissões** — cálculo, aprovação e repasse.
5. **Margem** — rentabilidade conhecida.
6. **Fluxo de caixa** — entradas e saídas por período.

A aba não deve esconder o contexto da seção. O título “Financeiro” permanece no cabeçalho; a aba ativa comunica o recorte.

---

## 7. Conceitos de produto

### 7.1 Três verdades financeiras

| Estado | Definição | Pode compor caixa confirmado? | Exemplo |
|---|---|---:|---|
| **Previsto** | Evento esperado por pedido, parcela ou compromisso | Não | Parcela vence em 10/09 |
| **Confirmado** | Valor efetivamente recebido ou pago | Sim | Pix identificado em 09/09 |
| **Comprometido** | Valor que já tem uma obrigação ou destino | Não como entrada; sim como alerta | Comissão aprovada a repassar |

A interface deve sempre rotular o estado. “Total de vendas” não pode ocupar o mesmo lugar visual que “caixa confirmado”.

### 7.2 Direções financeiras

- **Entrada:** dinheiro que a organização espera receber ou recebeu.
- **Saída:** dinheiro que a organização espera pagar ou pagou.
- **Transferência:** movimento entre contas da própria organização; não é receita nem despesa.
- **Ajuste:** correção controlada com motivo, autor e histórico.

### 7.3 Origem do lançamento

Todo lançamento deve identificar se nasceu de pedido, parcela, compra, fornecedor, comissão, consignação, taxa, frete, despesa operacional ou lançamento manual. Lançamentos manuais devem ser claramente marcados como manuais.

---

## 8. Escopo funcional do MVP

### 8.1 Visão Hoje

A visão Hoje é a tela padrão ao entrar em Financeiro. Deve mostrar o período selecionado, que por padrão é o dia atual ou os próximos sete dias, e quatro indicadores:

| Indicador | Cálculo | Clique |
|---|---|---|
| A receber nos próximos 7 dias | Parcelas previstas, abertas, com vencimento no intervalo | Abre Receber filtrado |
| Em atraso | Parcelas vencidas e não liquidadas | Abre Receber em atraso |
| A pagar nos próximos 7 dias | Parcelas/compromissos abertos com vencimento no intervalo | Abre Pagar filtrado |
| Caixa confirmado no período | Liquidações de entrada menos liquidações de saída | Abre Fluxo de caixa |

Abaixo, exibir uma agenda de vencimentos e um bloco **Precisa de atenção** com atrasos, comissões aprovadas ainda não pagas, consignações abertas além do prazo e lançamentos sem categoria.

Sem dados, exibir estado vazio honesto: “Ainda não há movimentações financeiras registradas.” A ação principal deve ser “Registrar primeiro compromisso” ou “Ver pedidos”, conforme a origem disponível.

### 8.2 Receber

A lista de recebíveis deve suportar busca e filtros por status, vencimento, cliente, revendedora, pedido, método e origem. Cada linha apresenta de forma compacta: pessoa responsável, pedido/origem, parcela, vencimento, valor previsto, valor recebido, saldo e status.

Ações permitidas:

- Abrir detalhe.
- Registrar recebimento total.
- Registrar recebimento parcial.
- Editar vencimento ou observação conforme permissão e política.
- Marcar como incobrável somente com motivo e confirmação, se essa regra for aprovada.
- Registrar contato de cobrança, sem afirmar que a mensagem foi entregue se não houver integração.

O detalhe deve mostrar a origem operacional, itens, valor bruto, desconto, condição, parcelas, pagamentos confirmados, saldo e histórico de alterações. Pedido entregue não altera automaticamente o status para recebido.

### 8.3 Pagar

A lista de contas a pagar deve contemplar fornecedor, compra de reposição, frete, embalagem, taxa de pagamento, marketing, manutenção e despesas operacionais. Cada lançamento possui categoria, fornecedor, descrição, valor, vencimento, recorrência opcional, conta de saída, status e observação.

Ações permitidas:

- Criar compromisso avulso.
- Criar compromisso parcelado.
- Registrar pagamento total ou parcial.
- Alterar vencimento com histórico.
- Cancelar compromisso futuro com motivo.
- Duplicar compromisso recorrente como rascunho, sem marcar como pago.

### 8.4 Comissões e repasses

A seção deve distinguir:

1. **Calculada:** derivada do pedido e da taxa vigente.
2. **Aprovada:** revisada pela gestora e congelada para o ciclo.
3. **Paga:** liquidação registrada em uma conta de saída.
4. **Estornada:** revertida por cancelamento, devolução ou ajuste autorizado.

O fechamento por revendedora e período exibe vendas elegíveis, cancelamentos, devoluções, base de cálculo, comissão bruta, ajustes, comissão líquida, valor pago e saldo. Não permitir pagamento de valor sem origem ou sem autorização.

### 8.5 Margem

A margem deve ser apresentada como **margem operacional estimada** quando algum componente estiver ausente. Fórmula conceitual:

`venda líquida – custo-base – desconto – taxa de pagamento – comissão – outros custos conhecidos`

Frete, imposto, quebra e devolução só entram se existirem como dados configurados. Se o custo-base estiver ausente, a UI deve exibir “custo não informado” e não um percentual inventado.

Filtros: período, produto, coleção, pedido, canal, revendedora e categoria. A visão pode mostrar margem por pedido ou produto, mas não deve sugerir precisão contábil.

### 8.6 Fluxo de caixa

O fluxo de caixa apresenta entradas e saídas por dia ou semana, separando previsto de confirmado. Deve permitir navegar por período, abrir os lançamentos do grupo e exportar CSV. O primeiro release pode usar tabela agrupada; gráficos são complementares.

O saldo projetado deve ser explicitamente denominado **saldo previsto**, nunca saldo bancário, quando não houver conciliação externa.

---

## 9. Requisitos funcionais

| ID | Prioridade | Requisito | Critério de aceite resumido |
|---|---:|---|---|
| FR-001 | P0 | Exibir Financeiro na sidebar da gestora | Item aparece com estado ativo, label contextual e acesso por teclado; não aparece para revendedora. |
| FR-002 | P0 | Abrir visão Hoje | Gestora vê indicadores derivados de dados reais, período e alertas acionáveis. |
| FR-003 | P0 | Gerar recebível a partir de pedido | Pedido com condição de pagamento cria previsão idempotente; não cria recebimento confirmado. |
| FR-004 | P0 | Suportar parcelas | Pedido parcelado cria parcelas com sequência, vencimento, valor e saldo. |
| FR-005 | P0 | Registrar recebimento total/parcial | Valor, data, conta e método ficam registrados; saldo e status são recalculados. |
| FR-006 | P0 | Listar atrasados | Parcelas vencidas abertas aparecem com dias de atraso e origem. |
| FR-007 | P0 | Criar conta a pagar | Gestora registra categoria, valor, vencimento, fornecedor e recorrência opcional. |
| FR-008 | P0 | Registrar pagamento | Pagamento reduz saldo aberto e aparece no caixa confirmado. |
| FR-009 | P0 | Separar comissão por estado | Calculada, aprovada, paga e estornada têm regras e visual distintos. |
| FR-010 | P0 | Fechar comissão por período | Gestora revisa, aprova e congela o ciclo com histórico. |
| FR-011 | P1 | Exibir margem estimada | Fórmula mostra somente componentes conhecidos e sinaliza lacunas. |
| FR-012 | P1 | Exibir fluxo previsto/confirmado | Entradas e saídas aparecem agrupadas, com origem abrível. |
| FR-013 | P1 | Exportar dados | Gestora exporta lista filtrada em CSV, respeitando a permissão. |
| FR-014 | P1 | Registrar histórico | Alterações críticas mostram autor, data, valor anterior, valor novo e motivo. |
| FR-015 | P1 | Fechar consignação | Ciclo por revendedora registra enviado, vendido, devolvido, comissão e saldo. |
| FR-016 | P1 | Registrar ação de cobrança | Contato possui data, canal, observação e próximo passo; não simula entrega. |
| FR-017 | P2 | Integrar cobrança | Provedor cria cobrança e retorna status por webhook idempotente. |
| FR-018 | P2 | Conciliar banco/cartão | Extrato é comparado com lançamentos sem duplicar liquidações. |
| FR-019 | P2 | Gerar DRE | Relatório contábil exige categorias e política de competência aprovadas. |
| FR-020 | P3 | Recomendar por IA | Só entra após histórico suficiente, consentimento e avaliação de risco. |

---

## 10. Regras de negócio

### 10.1 Pedidos e recebíveis

**BR-001.** A criação de um pedido não significa recebimento. O sistema cria previsão somente quando houver condição financeira suficiente para definir valor e vencimento.

**BR-002.** Pedido à vista pode ter uma parcela com vencimento na data combinada; ainda assim permanece aberto até a liquidação, salvo configuração explícita de confirmação imediata para um meio validado.

**BR-003.** Pedido parcelado deve manter a soma das parcelas igual ao valor financeiro da venda, com tratamento determinístico de centavos na última parcela.

**BR-004.** Pagamento parcial nunca pode gerar saldo negativo. Valores acima do saldo exigem confirmação como ajuste ou rejeição.

**BR-005.** Cancelamento ou devolução não apaga o histórico. Deve gerar estorno ou ajuste vinculado ao evento original.

**BR-006.** Um pedido não pode gerar recebíveis duplicados ao ser reprocessado. A geração precisa ser idempotente por organização e pedido/condição.

### 10.2 Contas a pagar

**BR-007.** Conta a pagar parcelada deve possuir compromisso pai e parcelas filhas ou uma estrutura equivalente que permita rastrear a origem.

**BR-008.** Transferência entre contas não entra como receita/despesa e não altera margem.

**BR-009.** Conta cancelada não pode ser paga sem reabertura autorizada e registro do motivo.

**BR-010.** Despesas sem categoria ficam visíveis em alerta e não devem desaparecer dos relatórios.

### 10.3 Comissões

**BR-011.** Comissão é calculada com a regra vigente no pedido, preservando a taxa aplicada como snapshot histórico.

**BR-012.** Alterar a taxa futura não recalcula pedidos antigos automaticamente.

**BR-013.** Comissão de pedido cancelado ou devolvido deve ser estornada conforme a política comercial e permanecer rastreável.

**BR-014.** Comissão aprovada não pode ser editada silenciosamente. Ajuste exige motivo e histórico.

**BR-015.** Comissão paga depende de uma liquidação de saída; marcar como paga sem transação é proibido.

### 10.4 Margem

**BR-016.** Margem conhecida não equivale a lucro líquido contábil.

**BR-017.** Custo ausente, taxa ausente ou imposto desconhecido deve reduzir o nível de confiança do cálculo, não ser preenchido por estimativa silenciosa.

**BR-018.** Desconto deve ser aplicado antes da comissão quando a política comercial definir comissão sobre venda líquida; a política precisa ser configurável e documentada.

### 10.5 Datas e moeda

**BR-019.** Persistir timestamps em UTC no servidor e exibir no fuso da usuária.

**BR-020.** Valores monetários devem usar representação decimal segura ou centavos inteiros; não depender de aritmética binária sem normalização.

**BR-021.** A moeda do MVP é BRL e a formatação segue `pt-BR`.

---

## 11. Fluxos ponta a ponta

### 11.1 Criação de pedido com recebimento futuro

1. Gestora ou revendedora cria pedido conforme a permissão existente.
2. O sistema registra pedido e estoque conforme as regras atuais.
3. A gestora informa ou confirma condição de pagamento.
4. O serviço financeiro cria uma previsão de recebível e suas parcelas.
5. A tela do pedido mostra “recebimento pendente” sem alterar o status operacional do pedido.
6. A visão Hoje passa a considerar os vencimentos.

**Falhas a tratar:** condição ausente, parcela com valor inconsistente, reprocessamento do pedido e organização inválida.

### 11.2 Registro de pagamento parcial

1. Gestora abre Receber e seleciona a parcela.
2. Clica em “Registrar recebimento”.
3. Informa valor, data, meio, conta de entrada e referência opcional.
4. O sistema valida valor maior que zero e menor ou igual ao saldo.
5. Cria liquidação idempotente.
6. Recalcula saldo e status: aberto, parcial ou pago.
7. Atualiza fluxo de caixa confirmado e histórico.

### 11.3 Fechamento de comissão

1. Gestora escolhe revendedora e período.
2. Sistema lista pedidos elegíveis, devoluções, cancelamentos e taxa snapshot.
3. Gestora revisa diferenças e registra ajustes se necessários.
4. Clica em “Aprovar fechamento”.
5. Sistema congela o ciclo e cria obrigação de comissão.
6. No pagamento, a gestora escolhe conta de saída e registra liquidação.
7. Sistema atualiza para pago e mantém recibo/histórico para consulta.

### 11.4 Compra parcelada de fornecedor

1. Gestora cria conta a pagar com fornecedor e categoria.
2. Informa valor total, vencimento inicial, quantidade de parcelas e intervalo.
3. Sistema gera parcelas com soma exata do total.
4. Cada parcela aparece no calendário e na visão Hoje.
5. Pagamentos parciais ou totais são registrados contra a parcela.
6. O custo do catálogo só muda através do fluxo de produto, com histórico próprio.

### 11.5 Cobrança de atraso

1. Gestora abre o filtro “Em atraso”.
2. Vê pessoa, pedido, valor, vencimento, dias de atraso e última ação.
3. Registra contato e próxima ação ou usa um canal integrado, se disponível.
4. O sistema não marca como pago nem como notificado sem evidência correspondente.
5. Ao receber, registra a liquidação e encerra a pendência.

### 11.6 Cancelamento ou devolução

1. Evento operacional é registrado no pedido/consignação.
2. Sistema calcula impacto financeiro previsto, comissão e estoque.
3. Cria estorno ou ajuste vinculado, sem apagar a origem.
4. Atualiza saldo aberto e histórico.
5. Se já houve pagamento, o sistema exige regra de crédito/reembolso aprovada; não inventa devolução automática.

---

## 12. Modelo de dados conceitual

A implementação não deve sobrecarregar `Order` com todas as responsabilidades financeiras. O domínio proposto é:

| Entidade | Campos mínimos | Observações |
|---|---|---|
| `FinancialAccount` | `id`, `organizationId`, `name`, `type`, `openingBalance?`, `active`, timestamps | Caixa, banco, carteira ou conta digital; sem credenciais bancárias. |
| `FinancialCategory` | `id`, `organizationId`, `name`, `direction`, `active` | Entrada, saída, comissão, custo, taxa, transferência. |
| `Receivable` | `id`, `organizationId`, `sourceType`, `sourceId`, `orderId?`, `customerId?`, `resellerId?`, `totalAmount`, `status` | Compromisso de entrada originado na operação. |
| `ReceivableInstallment` | `id`, `receivableId`, `sequence`, `dueDate`, `amount`, `paidAmount`, `status` | Permite parcial e parcelamento. |
| `PaymentSettlement` | `id`, `organizationId`, `installmentId?`, `payableInstallmentId?`, `accountId`, `amount`, `settledAt`, `method`, `reference?` | Representa dinheiro confirmado; deve ser idempotente. |
| `Payable` | `id`, `organizationId`, `sourceType`, `sourceId?`, `categoryId`, `supplierName?`, `description`, `totalAmount`, `status` | Compromisso de saída. |
| `PayableInstallment` | `id`, `payableId`, `sequence`, `dueDate`, `amount`, `paidAmount`, `status` | Calendário de pagamento. |
| `CommissionLedger` | `id`, `organizationId`, `resellerId`, `orderId?`, `period`, `baseAmount`, `rate`, `grossAmount`, `adjustments`, `netAmount`, `status` | Preserva snapshot da regra aplicada. |
| `ConsignmentSettlement` | `id`, `organizationId`, `resellerId`, `period`, `sentValue`, `soldValue`, `returnedValue`, `commission`, `payableAmount`, `status` | Fecha ciclo de peças fora da operação. |
| `FinancialActionLog` | `id`, `organizationId`, `actorId`, `entityType`, `entityId`, `action`, `before`, `after`, `reason`, timestamp | Auditoria de alterações críticas. |
| `CollectionRequest` | `id`, `organizationId`, `receivableId`, `channel`, `sentAt?`, `status`, `nextActionAt?` | Só entra quando houver comunicação integrada ou registro manual explícito. |

### 12.1 Relacionamentos principais

- Organização possui contas, categorias, recebíveis, pagamentos, despesas e logs.
- Pedido pode originar um recebível e itens de comissão, mas não é apagado quando o financeiro muda.
- Recebível possui uma ou mais parcelas.
- Parcela possui zero ou mais liquidações parciais.
- Conta financeira recebe ou paga liquidações.
- Revendedora pode estar associada ao pedido, à comissão e ao fechamento de consignação.
- Toda entidade financeira deve carregar `organizationId` e ser validada no servidor.

### 12.2 Migração a partir do domínio atual

1. Manter `paymentStatus` e `paymentMethod` no pedido para compatibilidade de leitura.
2. Criar um adaptador que interprete pedidos existentes sem parcela como um recebível legado não parcelado.
3. Não inventar data de vencimento para registros antigos; usar estado “vencimento não informado” até correção manual.
4. Preservar `commission` e `commissionRate` como snapshot histórico ao gerar o ledger.
5. Manter custo privado fora do payload de revendedora.
6. Migrar para server-side antes de habilitar o Financeiro em produção.

---

## 13. Contratos de API conceituais

Os nomes abaixo são contratos de planejamento; a nomenclatura final deve seguir a convenção atual do servidor.

| Procedimento | Tipo | Entrada | Saída |
|---|---|---|---|
| `finance.overview` | Query protegida | período, filtros | KPIs, alertas e agenda |
| `finance.receivables.list` | Query protegida | status, período, pessoa, página | lista paginada e totais |
| `finance.receivables.get` | Query protegida | id | origem, parcelas, liquidações e histórico |
| `finance.receivables.settle` | Mutation protegida | parcela, valor, conta, data, idempotencyKey | liquidação e saldo atualizado |
| `finance.payables.list` | Query protegida | status, período, categoria | lista paginada e totais |
| `finance.payables.create` | Mutation admin/gestora | compromisso, parcelas | conta a pagar criada |
| `finance.payables.settle` | Mutation admin/gestora | parcela, valor, conta, data | pagamento confirmado |
| `finance.commissions.preview` | Query gestora | revendedora, período | cálculo detalhado não congelado |
| `finance.commissions.approve` | Mutation gestora | período, itens, versão | ciclo congelado |
| `finance.commissions.pay` | Mutation gestora | ciclo, conta, data | comissão paga |
| `finance.margin.list` | Query gestora | período, produto, coleção, revendedora | margem estimada e nível de confiança |
| `finance.cashflow` | Query gestora | período, granularidade | previsto/confirmado por grupo |
| `finance.audit.list` | Query autorizada | entidade, período | histórico de alterações |

Todas as mutations críticas devem aceitar chave idempotente, validar organização no servidor e retornar erro tipado compreensível para a UI.

---

## 14. Permissões, RLS e segurança

### 14.1 Matriz de acesso

| Recurso | Gestora da organização | Revendedora | Administrador de plataforma |
|---|---:|---:|---:|
| Visão Hoje da organização | Ler | Não | Suporte controlado |
| Caixa confirmado global | Ler | Não | Não por padrão |
| Contas a pagar | Criar/ler/editar/pagar | Não | Não por padrão |
| Recebíveis próprios da rede | Criar/ler/baixar | Não no MVP | Não por padrão |
| Pedidos próprios da revendedora | Ler conforme regra existente | Ler próprios | Suporte controlado |
| Comissão própria | Ler após publicação futura | Ler própria | Não por padrão |
| Comissão de toda a rede | Ler/aprovar/pagar | Não | Não por padrão |
| Custo-base | Ler | Não | Não por padrão |
| Margem consolidada | Ler | Não | Não por padrão |
| Auditoria financeira | Ler | Não | Suporte justificado |
| Configuração de categorias | Criar/editar | Não | Não por padrão |

### 14.2 Regras de RLS/server-side

- Toda query filtra por `organizationId` derivado do ator autenticado, nunca por um valor confiado enviado pelo cliente.
- A gestora só acessa organizações em que possui vínculo de gestão.
- A revendedora não pode alterar ou consultar IDs de recursos financeiros da organização inteira.
- IDs estrangeiros devem retornar erro de autorização ou recurso não encontrado, sem revelar existência.
- Valores privados não podem ser enviados ao bundle ou payload da revendedora por “ocultação visual”.
- Logs de auditoria não podem ser editáveis pela UI comum.
- Segredos bancários, tokens de provedor e chaves `service_role` não podem entrar no cliente.
- Webhooks futuros devem validar assinatura, organização, evento e idempotência.

### 14.3 Comprovantes

Comprovantes de pagamento podem ser necessários, mas não devem ser implementados como caminho local permanente. A arquitetura futura deve armazenar bytes em storage gerenciado, manter metadados e autorização no banco, gerar URLs temporárias e impedir acesso entre organizações. O MVP pode aceitar uma referência textual ou deixar o comprovante fora do fluxo até o storage estar configurado corretamente.

A validação Supabase atual está bloqueada por HTTP 401; portanto, antes da implementação deve haver uma tarefa de confirmação do projeto correto, credenciais públicas válidas e políticas aplicadas.

---

## 15. Especificação UX/UI

### 15.1 Direção visual

Financeiro deve parecer parte da Fernanda Fortes: sofisticado, silencioso, elegante e funcional. A sofisticação virá de hierarquia, tipografia, ritmo, contraste e conteúdo; não de gradientes, brilho ou excesso de cards. A paleta existente deve ser reutilizada com tokens semânticos para claro e escuro.

A prioridade visual deve ser:

1. estado financeiro e período;
2. ação necessária;
3. valor e vencimento;
4. origem e contexto;
5. detalhe e histórico.

### 15.2 Wireframe textual da visão Hoje

```text
Sidebar
  Painel
  Catálogo
  Pedidos
  Financeiro  [ativo]
  Revendedoras

Cabeçalho: Financeiro                         [período] [ações]
Subnavegação: Hoje | Receber | Pagar | Comissões | Margem | Fluxo de caixa

A receber em 7 dias     Em atraso       A pagar em 7 dias      Caixa confirmado
R$ ...                   R$ ...          R$ ...                 R$ ...

Precisa de atenção                         Agenda financeira
- 3 parcelas vencidas                       26/08  Entrada prevista ...
- 1 comissão aprovada                       27/08  Fornecedor ...
- 1 consignação a fechar                    28/08  Parcela ...

[Registrar compromisso] [Ver pedidos] [Exportar]
```

A composição final não precisa reproduzir literalmente o wireframe. O requisito é que a tela conduza a decisões sem esconder ausência de dados.

### 15.3 Tabelas e filtros

Tabelas devem ter cabeçalho persistente, coluna de status textual, ordenação por vencimento e ações acessíveis. Em mobile, cada linha pode virar um item empilhado com valor, vencimento e ação primária; não exigir rolagem horizontal para descobrir atraso ou status.

Filtros devem ser removíveis individualmente, manter o resultado visível e ter estado “nenhum resultado para estes filtros”. Busca deve aceitar nome de pessoa, pedido ou descrição, sem transformar texto livre em filtro inseguro.

### 15.4 Estados obrigatórios

| Estado | Tratamento |
|---|---|
| Loading | Skeleton local da tabela/KPI; não bloquear a sidebar inteira. |
| Vazio absoluto | Explicar que ainda não há lançamentos e apontar próximo passo. |
| Vazio filtrado | Informar que filtros não retornaram resultados e oferecer limpar filtros. |
| Erro | Explicar falha, manter filtros e oferecer tentar novamente. |
| Sem custo | Exibir margem incompleta, não zero como se fosse lucro. |
| Atrasado | Texto “Em atraso”, dias e ação; cor não é único indicador. |
| Parcial | Mostrar pago, saldo e progresso textual. |
| Salvando | Desabilitar apenas ação em processamento e comunicar resultado. |
| Sem permissão | Não renderizar dados; explicar acesso sem revelar conteúdo. |
| Conflito | Informar que os dados mudaram e pedir recarregamento/revisão. |

### 15.5 Acessibilidade e temas

- Usar elementos nativos ou primitives existentes para tabs, tabelas, menus e dialogs.
- Garantir `focus-visible`, ordem de foco, retorno de foco e acionamento por Enter/Space.
- Associar labels a campos de valor, data, conta, categoria e motivo.
- Não usar somente vermelho/verde para status; combinar texto, ícone e estrutura.
- Validar contraste, placeholders, bordas e estados disabled nos temas claro e escuro.
- Respeitar `prefers-reduced-motion`.
- Testar 320, 768, 1024 e 1440 pixels, além de desktop e mobile representativos.

---

## 16. Métricas e instrumentação

### 16.1 Métricas de produto

| Métrica | Fórmula/definição | Meta inicial a validar |
|---|---|---|
| Cobertura de recebíveis | Pedidos com condição financeira válida / pedidos elegíveis | Aumentar semanalmente sem correções manuais excessivas |
| Taxa de baixa | Recebíveis confirmados com liquidação registrada | Aproximar-se do fechamento real |
| Valor vencido sem ação | Atrasados sem contato, acordo ou próxima ação | Redução após adoção |
| Tempo de fechamento | Tempo entre abrir e aprovar ciclo de comissão | Menor que o processo atual medido |
| Divergência de comissão | Ajustes / comissão calculada | Reduzir e explicar toda divergência |
| Margem incompleta | Itens sem custo/taxa suficiente | Reduzir progressivamente |
| Uso da visão Hoje | Gestoras que consultam e executam uma ação por semana | Validar retenção operacional |

Não declarar percentuais de redução de inadimplência, horas poupadas ou aumento de lucro antes de medir baseline próprio.

### 16.2 Eventos de instrumentação

Eventos devem evitar valores sensíveis no payload analítico. Registrar apenas organização anonimizada, papel, ação, seção e resultado:

- `finance_section_viewed`
- `finance_overview_filter_changed`
- `finance_receivable_opened`
- `finance_settlement_created`
- `finance_payable_created`
- `finance_commission_previewed`
- `finance_commission_approved`
- `finance_commission_paid`
- `finance_export_requested`
- `finance_error_shown`

---

## 17. Roadmap e dependências

### Fase 0 — Descoberta e política

Confirmar cinco entrevistas, mapear regras reais de comissão, pagamento, devolução, consignação, taxas, frete, imposto e retirada da gestora. Definir o que significa “recebido” em cada meio. Confirmar projeto Supabase e RLS antes de qualquer dado real.

### Fase 1 — Fundamento P0

Criar schema server-side, categorias, contas financeiras, recebíveis, parcelas, liquidações, contas a pagar e histórico. Adicionar Financeiro à sidebar somente quando a autorização e a persistência estiverem prontas.

### Fase 2 — Operação P0/P1

Entregar Visão Hoje, Receber, Pagar, comissões calculadas/aprovadas/pagas e fechamento por revendedora. Conectar pedido e comissão sem alterar silenciosamente os estados operacionais atuais.

### Fase 3 — Decisão e confiança P1

Entregar margem estimada, fluxo previsto/confirmado, exportação, alertas de dados incompletos e fechamento auditável de consignação.

### Fase 4 — Integrações P2

Avaliar cobrança, conciliação bancária, cartão, storage de comprovantes e integrações externas somente após domínio, permissões e baseline de uso.

### Fase 5 — Inteligência P3

Considerar previsão de caixa, recomendações de compra, priorização de cobrança e IA apenas com histórico suficiente, explicabilidade, consentimento e mecanismos de revisão.

---

## 18. Rollout

### Critérios para começar o desenvolvimento

- Política de comissão e recebimento validada com a gestora.
- Projeto Supabase correto confirmado e RLS testável.
- Schema financeiro revisado por produto e engenharia.
- Definição de organização/tenant aprovada.
- Decisão sobre pedidos antigos e ausência de vencimento tomada.
- Baseline do processo atual medido em pelo menos três fechamentos.

### Rollout recomendado

1. Implementar atrás de feature flag para uma gestora interna.
2. Importar apenas dados reais selecionados e anonimizados em ambiente de validação.
3. Comparar o fechamento do Financeiro com a planilha atual sem apagar a fonte anterior.
4. Corrigir divergências e acompanhar logs por um ciclo completo.
5. Expandir para um pequeno grupo de gestoras.
6. Só remover a planilha paralela depois de um período de confiança acordado.

### Rollback

Se houver divergência financeira, indisponibilidade ou falha de autorização, desabilitar a feature flag e preservar as entidades criadas para investigação. Nunca apagar lançamentos como forma de rollback.

---

## 19. Plano de testes para a futura implementação

### 19.1 Unitários

- Soma de parcelas e tratamento de centavos.
- Pagamento parcial, total e excesso.
- Transições de status.
- Cálculo de comissão com snapshot de taxa.
- Estorno de comissão.
- Margem conhecida versus incompleta.
- Separação entre previsto, confirmado e comprometido.
- Idempotência de geração de recebível e liquidação.

### 19.2 Integração

- Pedido cria recebível uma única vez.
- Pedido cancelado cria impacto de estoque e estorno financeiro coerente.
- Fechamento de comissão cria obrigação e depois liquidação.
- Conta a pagar aparece no calendário e no fluxo.
- Organização A não acessa dados da organização B.
- Revendedora não recebe custo-base ou caixa global.
- Falha remota não confirma operação local como liquidada.

### 19.3 UI e acessibilidade

- Navegação da sidebar e atualização do título.
- Financeiro invisível para revendedora.
- Foco e teclado em tabs, tabelas, filtros, dialogs e ações.
- Estados loading, vazio, erro, parcial, atraso e sem permissão.
- Desktop/mobile e temas claro/escuro.
- Ausência de overflow e textos cortados.

### 19.4 Segurança

- RLS validado por organização e papel.
- IDs estrangeiros rejeitados.
- Segredos fora do cliente.
- Webhook futuro assinado e idempotente.
- Exportação respeita autorização.
- Dados analíticos não contêm valores ou identificadores sensíveis desnecessários.

---

## 20. Critérios de aceite do PRD e da implementação

### 20.1 Aceite do PRD

O PRD está pronto para planejamento técnico quando produto, design e engenharia conseguirem responder, sem interpretação adicional:

- Quem pode entrar em Financeiro?
- Qual evento cria um recebível?
- Quando um valor é previsto, confirmado ou comprometido?
- Como uma parcela parcial muda o saldo?
- Como comissão vira obrigação e depois pagamento?
- Como devolução e cancelamento afetam caixa e comissão?
- Quais dados são obrigatórios e quais podem faltar?
- Onde o custo-base é protegido?
- Como RLS impede acesso entre organizações?
- O que fica fora do MVP?
- Como testar e reverter sem apagar dados?

### 20.2 Aceite da implementação futura

A implementação será aceita somente se:

1. Financeiro aparecer na sidebar correta e respeitar o papel da usuária.
2. A visão Hoje usar dados reais ou estado vazio honesto, sem seeds fictícios.
3. Recebíveis possuírem origem, vencimento, parcela, status e histórico.
4. Liquidações atualizarem saldo e fluxo sem duplicidade.
5. Contas a pagar e comissões possuírem ciclo completo de criação a pagamento.
6. Margem sinalizar dados incompletos.
7. RLS/isolamento for comprovado por testes.
8. Typecheck, build, testes Vitest e validação visual passarem.
9. Não existirem erros de console ou falhas silenciosas em fluxos críticos.
10. A documentação de migração e rollback estiver disponível.

---

## 21. Decisões abertas

| ID | Decisão | Dono sugerido | Quando decidir |
|---|---|---|---|
| D-01 | Comissão é calculada sobre venda bruta ou líquida? | Gestora + produto | Antes do schema de comissão |
| D-02 | Quando nasce o vencimento de venda à vista? | Gestora + produto | Antes do gerador de parcelas |
| D-03 | Pedido entregue pode gerar previsão automaticamente? | Produto + engenharia | Antes da integração pedido-financeiro |
| D-04 | Qual política de devolução e estorno? | Gestora | Antes de fechar comissões |
| D-05 | Quais contas financeiras a gestora quer acompanhar? | Gestora | Antes da Visão Hoje |
| D-06 | Há consignação por maleta, sacola ou outro ciclo? | Gestora | Antes do fechamento P1 |
| D-07 | Quais custos entram na margem? | Gestora + produto | Antes do módulo Margem |
| D-08 | O Financeiro terá exportação desde o MVP? | Produto | Planejamento P0/P1 |
| D-09 | Qual Supabase é o ambiente oficial? | Infra/owner | Antes de dados reais |
| D-10 | Storage de comprovantes entra em P1 ou P2? | Produto + segurança | Após validar necessidade |
| D-11 | Haverá visibilidade financeira futura para revendedora? | Produto + gestora | Após entrevistas |
| D-12 | Quando integrar cobrança ou conciliação? | Produto + finanças | Após baseline e domínio estável |

---

## 22. Roteiro de entrevistas de validação

Realizar cinco entrevistas de 30 minutos com gestoras, preferencialmente observando uma rotina real de fechamento. Não solicitar credenciais nem dados financeiros identificáveis; pedir valores anonimizados ou apenas demonstrar estrutura.

Perguntas essenciais:

1. Qual foi a última vez em que você achou que tinha dinheiro e não tinha?
2. Como você sabe quem precisa pagar hoje?
3. Como registra uma venda parcelada?
4. Como fecha a comissão de uma revendedora?
5. O que acontece quando há devolução ou troca?
6. Como decide se pode comprar reposição?
7. Como sabe se uma promoção deu lucro?
8. Onde ficam fornecedores, fretes e despesas?
9. O que fica no WhatsApp e não chega à planilha?
10. Qual tela você abriria primeiro em uma segunda-feira?

Confirmar a hipótese quando ao menos três gestoras apresentarem o mesmo fluxo quebrado, um workaround comparável e disposição de testar um protótipo com dados anonimizados.

---

## 23. Glossário

| Termo | Definição |
|---|---|
| Recebível | Compromisso de entrada que a organização espera receber. |
| Parcela | Divisão de um recebível ou pagamento com vencimento próprio. |
| Liquidação | Registro do dinheiro efetivamente recebido ou pago. |
| Previsto | Evento esperado, mas ainda não confirmado. |
| Confirmado | Evento cuja entrada/saída foi registrada como realizada. |
| Comprometido | Valor reservado ou devido a uma obrigação. |
| Conta a pagar | Compromisso de saída para fornecedor ou despesa. |
| Comissão calculada | Valor derivado da regra aplicada ao pedido. |
| Comissão aprovada | Valor revisado e congelado para repasse. |
| Comissão paga | Valor liquidado para a revendedora. |
| Margem estimada | Resultado operacional com os componentes conhecidos, não DRE contábil. |
| Consignação | Peças em posse de revendedora até venda, devolução ou troca. |
| Fechamento | Processo de conferir e congelar um ciclo financeiro/comercial. |
| RLS | Row Level Security; políticas de acesso por linha no banco. |

---

## 24. Referências

[1]: https://blog.gazinsemijoias.com.br/dicas-de-vendas/planilha-vendas-revendedoras-semijoias/ "Gazin Semijoias — Planilha de Vendas para Revendedora de Semijoias"

[2]: https://vivacita.com.br/o-guia-completo-do-controle-financeiro-na-revenda-de-semijoias/ "Vivacità — O guia completo do controle financeiro na revenda de semijoias"

[3]: https://gestaojoias.com.br/funcionalidades "Gestão Joias — Funcionalidades"

[4]: https://www.wm10.com.br/erp-para-bijuterias "WM10 — ERP para Bijuterias e Semijoias"

[5]: https://jueri.com.br/post/jueri-o-melhor-sistema-para-semijoias-consignado-varejo-e-atacado "Jueri — Sistema para Semijoias Consignado, Varejo e Atacado"

[6]: https://www.softensistemas.com.br/sistema-para-loja-semijoias "Soften — Sistema para Loja de Semi Joias"

[7]: https://contaazul.com/funcionalidades/conciliacao-bancaria/ "Conta Azul — Conciliação bancária automática para PMEs"

[8]: https://www.asaas.com/ "Asaas — Conta digital PJ e cobranças"

---

## 25. Próximo passo aprovado

Após aprovação deste PRD, a execução deverá começar por uma etapa técnica separada: confirmar credenciais e RLS do Supabase, fechar as decisões D-01 a D-10, atualizar o `todo.md` com o escopo de implementação, gerar o schema financeiro, aplicar migração controlada, escrever testes Vitest e somente então adicionar Financeiro à sidebar e à experiência da gestora.

**Este documento não autoriza implementação automática de integrações bancárias, cobrança, DRE ou storage de comprovantes.**
