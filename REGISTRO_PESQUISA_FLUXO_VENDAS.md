# Registro de pesquisa — fluxo de vendas

## Achados principais

1. Um OMS centraliza o ciclo do pedido, desde captura até pagamento, estoque, processamento, entrega e devolução. A fonte reforça a necessidade de transparência do status e visão end-to-end.
2. Em operações com múltiplos canais, a arquitetura recomendada é unificar os dados de pedidos, estoque e atendimento em uma fonte central, em vez de criar fluxos isolados por canal.
3. A atribuição de canal/origem é importante para identificar se a venda veio de loja online, atendimento direto ou revendedora; no contexto Fernanda Fortes, isso deve coexistir com uma revendedora responsável opcional.
4. A rastreabilidade deve preservar itens, quantidades, valor, pagamento, status, cliente e responsável pela venda, porque esses dados sustentam estoque, comissões, histórico e relatórios.

## Fontes

- https://www.salesforce.com/commerce/order-management/system/ — Salesforce, “What is an Order Management System?”
- https://www.shopify.com/enterprise/blog/omnichannel-order-management — Shopify Plus, “Omnichannel Order Management”
- https://www.cin7.com/blog/multichannel-order-management-system/ — Cin7, “A Multichannel Order Management Platform”

## Decisão preliminar

Recomenda-se um modelo híbrido com núcleo operacional em “Pedidos” e atalhos contextuais em “Revendedoras”. A entidade principal deve ser o pedido/venda; revendedora, cliente, canal e itens são dimensões associadas. Isso evita duplicar registros e mantém comissões, estoque e histórico no mesmo fluxo.
