# Rollout interno do fluxo de Pedidos

## Escopo liberado

A versão atual está preparada para uso controlado pela gestora com registro de pedido detalhado ou venda geral, origem direta ou por revendedora, itens do catálogo, quantidades, totais, cliente, data, pagamento, observações, referência opcional de comprovante, estoque, comissão, histórico, cancelamento e filtros operacionais.

## Procedimento-piloto

A gestora deve iniciar com um pedido detalhado de venda direta, selecionar uma peça disponível, confirmar a quantidade, revisar o total e validar a baixa de estoque. Em seguida, deve testar um pedido vinculado a uma revendedora, verificando o percentual e o valor de comissão no pedido e na visão de Comissões. Depois, deve testar uma venda geral, confirmando que ela registra valor agregado sem baixar estoque de peça individual.

Para validar correções operacionais, deve ser criado um pedido pendente, avançado progressivamente pelos status permitidos e cancelado antes da entrega. O estoque deve ser restaurado no cancelamento e o pedido deve continuar visível no histórico. Tentativas de transição regressiva, duplo clique ou reenvio da mesma ação devem ser bloqueadas ou tratadas de forma idempotente.

## Limites desta rodada

A persistência local continua sendo a fonte de operação do frontend atual, enquanto o backend protegido e a tabela `orders` estão preparados para sincronização futura. A integração do frontend com canais externos, loja online, marketplaces e automações de importação permanece fora do escopo desta rodada.

Não devem ser usados dados fabricados como métricas, avaliações, depoimentos ou prova social. Os dados sintéticos utilizados nos roteiros visuais são isolados para teste automatizado e não fazem parte do estado inicial da plataforma.

## Checklist de saída

Os testes automatizados, typecheck e build devem permanecer aprovados. A validação visual deve cobrir a seção autenticada de Pedidos em desktop e mobile, além do modal de venda geral e do atalho contextual de Revendedoras. O checkpoint deve ser criado antes de qualquer publicação, e a publicação deve ser realizada manualmente pelo botão Publish da interface de gerenciamento quando a gestora aprovar a versão.
