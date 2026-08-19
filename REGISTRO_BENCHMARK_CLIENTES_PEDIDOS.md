# Benchmark de clientes e pedidos

## Fontes consultadas

1. Salesforce — Operational Customer Profile: https://www.salesforce.com/blog/operational-customer-profile/
2. Microsoft Dynamics 365 Customer Insights — Customer profiles: https://learn.microsoft.com/en-us/dynamics365/customer-insights/data/customer-profiles
3. Baymard — Orders Overview UX benchmark: https://baymard.com/ecommerce-design-examples/62-orders-overview
4. monday.com — CRM with order management: https://monday.com/blog/crm-and-sales/crm-with-order-management/

## Achados relevantes

O padrão recorrente é manter uma visão unificada entre cliente e pedido, com um perfil operacional que reúne dados básicos, histórico de compras e atividades relacionadas. Salesforce descreve o perfil operacional como uma representação detalhada das interações do cliente, incluindo histórico de compras, dados demográficos, preferências e engajamentos. A principal implicação para a Fernanda Fortes é que o histórico deve ser derivado dos pedidos ligados a um `customerId`, e não duplicado manualmente em uma tela de clientes.

Microsoft Dynamics 365 apresenta clientes como cards pesquisáveis e filtráveis; ao abrir um card, o operador acessa detalhes do perfil e uma linha do tempo cronológica de atividades. Para o MVP da Fernanda Fortes, a alternativa proporcional é um painel ou modal leve acionado a partir de Pedidos, exibindo dados cadastrais, total de pedidos, valor acumulado e lista cronológica de pedidos. Não é necessário criar uma seção completa de CRM nesta rodada.

Baymard destaca que uma visão de pedidos precisa atender várias intenções além de acompanhar pedidos abertos: consultar histórico, editar pedidos, cancelar e revisar detalhes. A recomendação prática é manter ações essenciais no card, com inspeção para informações completas e edição controlada. Isso apoia adicionar o nome do cliente no card, filtro por cliente e uma inspeção contextual sem sobrecarregar a listagem.

monday.com reforça a integração entre dados de cliente, processamento de pedidos, inventário e reporting em uma fonte de verdade operacional. Para este projeto, isso significa que o catálogo deve ser lido do mesmo store reativo que alimenta o modal de pedido, e o painel deve derivar métricas dos pedidos e produtos atuais, evitando valores fixos ou snapshots isolados.

## Decisão de UX para clientes

Não criar uma seção lateral independente de Clientes neste momento. Implementar um histórico leve dentro de Pedidos: filtro por cliente registrado, nome do cliente no card e um painel de cliente aberto a partir do filtro ou do card. O painel deve mostrar contato, quantidade de pedidos, valor acumulado, última compra e pedidos relacionados. A arquitetura deve manter o modelo `Customer` separado e permitir evoluir para uma seção completa posteriormente.
