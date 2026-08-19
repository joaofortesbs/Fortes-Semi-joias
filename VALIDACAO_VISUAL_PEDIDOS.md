# Validação visual do fluxo de Pedidos

A validação foi executada em 19 de agosto de 2026 com dados sintéticos explicitamente identificados apenas para teste visual, sem qualquer dado demonstrativo na aplicação entregue.

## Desktop

A seção Pedidos autenticada foi aberta em viewport de 1440 × 900. O modal de registro exibiu corretamente as opções Pedido detalhado e Venda geral, origem da venda, descrição e valor agregado, cliente, contato, data, pagamento, situação, observações, referência de comprovante e resumo com total em BRL. A hierarquia dourada/champagne foi preservada e não houve corte horizontal.

## Mobile

O fluxo autenticado foi aberto em viewport de 390 × 844, iniciando pela seção Revendedoras e acionando o botão Novo pedido do card da revendedora. O evento navegou para Pedidos e abriu o modal contextual com a revendedora vinculada. O modal apresentou título, fechamento, escolha do tipo de registro, origem, mensagem de comissão, item do catálogo, quantidade, cliente, contato e data em largura adaptada. O modal é rolável verticalmente para os campos abaixo da dobra; não houve overflow horizontal nem sobreposição dos controles críticos.

## Resultado

A validação visual específica do fluxo de Pedidos foi concluída em desktop e mobile. A captura mobile priorizou a primeira dobra, pois o formulário é deliberadamente rolável em telas pequenas.
