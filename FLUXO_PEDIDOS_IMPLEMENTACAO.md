# Fluxo de pedidos — registro de implementação

## Escopo executado

Esta rodada cobre as 19 funcionalidades aprovadas para o núcleo de pedidos/vendas. A funcionalidade 20, integrações com loja online e canais externos, permanece fora do escopo.

## Auditoria da arquitetura existente

A aplicação usa `client/src/lib/localStore.ts` como fonte de persistência local e reatividade, com páginas de domínio em `client/src/pages/ManagerDashboard.tsx` e `client/src/pages/ResellerDashboard.tsx`. O catálogo e a rede de revendedoras já possuem features isoladas em `client/src/features/catalog/` e `client/src/features/resellers/`. A navegação é materializada por `AppShell` e `shared/sectionRegistry.ts`.

Antes desta rodada, o fluxo de pedidos da revendedora criava objetos mínimos diretamente dentro da tela, com `resellerId`, itens simplificados, total, comissão, status e data. O contrato não permitia venda direta e não guardava snapshot de nome/preço do item, forma de pagamento, cliente, observações ou histórico. A nova implementação centraliza criação e transições em `localStore.ts` e compartilha regras auxiliares em `client/src/features/orders/orderDomain.ts`.

## Decisões operacionais

- Todo registro comercial é um `Order`.
- A origem pode ser `direct` ou `reseller`.
- `resellerId` é opcional e obrigatório somente quando a origem é `reseller`.
- Cada item preserva nome, preço unitário, quantidade e subtotal no momento da criação.
- A criação valida catálogo, disponibilidade, quantidade, itens e revendedora.
- O estoque é baixado uma única vez no registro e restaurado em cancelamento integral.
- A comissão é calculada somente para pedidos de revendedora e a taxa é congelada no pedido.
- O total é calculado a partir dos itens; a interface não é fonte de confiança.
- O custo-base permanece fora do pedido e fora das telas da revendedora.
- Cancelamento é lógico e preserva o pedido e seu histórico.

## Critérios de aceite

1. A gestora consegue registrar venda direta sem revendedora.
2. A gestora consegue registrar pedido associado a uma revendedora.
3. O fluxo permite múltiplas peças e quantidades limitadas pelo estoque.
4. O resumo mostra quantidade, total e dados essenciais antes da confirmação.
5. O pedido aparece na lista gerencial e na visão da revendedora responsável.
6. Pedido direto gera comissão zero; pedido intermediado registra comissão conforme a taxa vigente.
7. Cancelamento restaura estoque sem apagar o histórico.
8. Filtros de pedido funcionam por busca, status e origem.
9. Testes, typecheck, build e validação visual permanecem aprovados.
