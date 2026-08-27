
# Project TODO

- [x] Landing page pública com apresentação da marca, benefícios para revendedoras e CTA de cadastro
- [x] Fluxo de autenticação com login, cadastro e seleção de perfil Gestora/Revendedora
- [x] Persistência inicial local compatível com futura migração para Supabase
- [x] Dashboard da Gestora com vendas, pedidos em aberto, revendedoras ativas e comissões
- [x] Dashboard da Revendedora com catálogo, pedidos próprios e comissões acumuladas
- [x] Catálogo gerenciado exclusivamente pela Gestora com foto, nome, preço, categoria e disponibilidade
- [x] Gestão de pedidos com criação pela Revendedora, status e histórico
- [x] Gestão de revendedoras com aprovação, status ativo/inativo e perfil individual
- [x] Sistema de comissões com percentual configurável e extrato detalhado
- [x] Notificações internas para novos pedidos, mudanças de status e aprovações
- [x] Design system dourado/champagne elegante, responsivo, sem gradientes exagerados
- [x] Menu lateral expansível com seleção de perfil Gestora, Revendedora e Loja inativa
- [x] Navegação por seções e estados vazios para funcionalidades futuras
- [x] Testes Vitest para autenticação, persistência local e regras de comissão
- [x] Validação visual desktop e mobile dos fluxos principais
- [x] Revisar acessibilidade, estados de carregamento, erro e feedback de ações
- [x] Criar checkpoint final após validação completa

## Histórico

- Escopo inicial da plataforma registrado a partir do PRD enviado pelo usuário.
- A implementação deve preservar compatibilidade futura com banco de dados externo, especialmente Supabase.
- Conteúdo de avaliações, depoimentos e reviews não deve ser fabricado ou incluído como dado demonstrativo.
- A primeira versão usa dados locais demonstrativos e placeholders visuais de produto; Supabase, upload de fotos reais, notificações detalhadas e seleção de perfil Loja permanecem como próximos incrementos.
- A landing page foi validada visualmente em desktop e mobile; as telas internas foram validadas por TypeScript, Vitest, build e revisão de estados/contratos. Os visuais de produto são placeholders abstratos até o upload de fotos reais.

- [x] Corrigir atualização reativa dos dashboards após mudanças no localStore
- [x] Adicionar UI para configurar percentual de comissão por revendedora
- [x] Adicionar teste Vitest específico para cálculo de comissão por pedido
- [x] Validar visualmente auth, dashboards, catálogo e pedidos em desktop e mobile
- [x] Completar estados empty/error/loading nas telas internas e revisão de acessibilidade

- [x] Adicionar suporte real a foto no catálogo com campo de imagem e fluxo de criação/edição
- [x] Completar gestão de revendedoras com alternância ativo/inativo e perfil individual
- [x] Gerar notificações para aprovação e mudanças de status de pedidos
- [x] Tornar o seletor de perfil funcional ou explicitar o contexto de perfis disponíveis
- [x] Expandir estados vazios e coming soon nos dois dashboards
- [x] Executar validação visual comprovada das telas internas principais em desktop e mobile
- [x] Revisar acessibilidade e estados loading/error/empty em todas as telas internas

- [x] Corrigir dropdowns transparentes: superfícies sólidas, z-index correto, borda refinada, contraste e leitura das opções
- [x] Validar dropdowns de autenticação, filtros de dashboard, status de pedidos e perfil lateral em desktop e mobile

- [x] Auditar arquitetura atual de pastas, arquivos e responsabilidades
- [x] Identificar riscos de acoplamento, segurança, escalabilidade e manutenção
- [x] Documentar sugestões priorizadas de melhoria arquitetural

- [x] Remover seeds fictícios de usuários, produtos, pedidos, comissões e notificações do estado inicial
- [x] Remover métricas, percentuais, valores, IDs, datas, gráfico e números demonstrativos da landing e dashboards
- [x] Ajustar interfaces para estados vazios, sem dados inventados e com mensagens de cadastro real
- [x] Validar por busca, testes, TypeScript, build e screenshots que não restam dados demonstrativos na UI

- [x] Invalidar o localStorage legado para garantir remoção dos dados demonstrativos em sessões existentes
- [x] Adicionar verificação automatizada contra regressão de strings e valores fictícios
- [x] Validar estados vazios das áreas autenticadas após a limpeza do storage

- [x] Criar registro central de seções do menu lateral com contratos de navegação e permissões
- [x] Criar domínio compartilhado de revendedoras, convite e status futuros
- [x] Criar arquivo único de UI da seção Revendedoras com composição isolada
- [x] Implementar modal central com Nome, Cidade, Registrar e Convidar
- [x] Implementar geração determinística e sem duplicação de link personalizado de convite
- [x] Renderizar revendedoras registradas em cards responsivos com status do convite
- [x] Adicionar testes de cadastro, validação, convite e geração idempotente de links
- [x] Validar integração da navegação, estados vazios, acessibilidade e responsividade

- [x] Persistir link e status ao convidar revendedora já existente sem link
- [x] Adicionar testes de registro, convite novo e convite repetido sem duplicação
- [x] Validar atualização visual do modal e dos cards após registrar e convidar

- [x] Adicionar busca por nome e cidade na lista de Revendedoras
- [x] Adicionar filtro por status do convite
- [x] Adicionar filtro por cidade com opções derivadas dos dados reais
- [x] Implementar atualização persistente de Nome e Cidade
- [x] Implementar exclusão persistente com confirmação e sem exclusão acidental
- [x] Adicionar testes de filtros, edição, exclusão e prevenção de duplicidade
- [x] Validar responsividade, estados vazios e build da seção atualizada

- [x] Adicionar testes automatizados para busca por nome, cidade e filtro por status
- [x] Validar visualmente a seção Revendedoras em desktop e mobile com modal, filtros e ações

- [x] Diagnosticar a origem do erro ResizeObserver loop completed with undelivered notifications
- [x] Corrigir o ciclo de observação sem ocultar erros reais do console
- [x] Validar console, testes, TypeScript, build e preview após a correção

- [x] Definir contrato do produto para imagem, preço, categoria, estoque, disponibilidade e custo privado
- [x] Definir modelo de variações simples, etiquetas e coleções
- [x] Implementar persistência e regras comerciais do produto
- [x] Substituir prompt nativo por modal central em etapas
- [x] Implementar upload/preview de imagem principal
- [x] Implementar campos comerciais e de estoque com validação
- [x] Implementar resumo antes da confirmação e salvamento seguro
- [x] Integrar variações simples, etiquetas e coleções ao catálogo
- [x] Garantir separação entre dados públicos e custo privado
- [x] Adicionar testes unitários, de integração e regressão do catálogo
- [x] Validar acessibilidade, responsividade, estados de erro e loading
- [x] Criar checkpoint após a entrega do cadastro profissional de peças

- [x] Evoluir o contrato de produto com imagem, preço, categoria, estoque, status e custo privado
- [x] Adicionar descrição, variações simples, etiquetas e coleção ao produto
- [x] Implementar domínio de validação, normalização e duplicidade de produtos
- [x] Implementar persistência de criação e edição de produtos
- [x] Substituir prompt nativo por modal central profissional em etapas
- [x] Implementar upload e preview da imagem principal
- [x] Implementar campos comerciais, estoque e disponibilidade
- [x] Implementar resumo antes da confirmação e salvamento seguro
- [x] Integrar cards do catálogo com os novos dados e ações
- [x] Garantir que custo-base permaneça privado para a Gestora
- [x] Integrar disponibilidade ao fluxo de pedidos
- [x] Adicionar testes de domínio, persistência, visibilidade e regressão
- [x] Validar acessibilidade, responsividade, loading, erros e build
- [x] Salvar checkpoint da entrega end-to-end do catálogo

- [x] Adicionar testes automatizados para create/update/delete de produtos, duplicidade de nome/SKU e persistência
- [x] Implementar isolamento real do custo-base para que revendedoras não recebam esse dado no estado cliente
- [x] Corrigir labels acessíveis do modal com htmlFor/id e navegação por teclado
- [x] Adicionar estado explícito de salvamento/loading no cadastro e edição de produtos
- [x] Salvar novo checkpoint após resolver os gaps do catálogo profissional

- [x] Separar custo-base do objeto Product público e armazená-lo em metadados administrativos dedicados
- [x] Completar labels acessíveis para imagem, SKU, descrição, status, variações, etiquetas e coleção
- [x] Validar foco inicial, foco de retorno, Escape e teclado no modal do catálogo
- [x] Criar checkpoint final depois dessas correções de privacidade e acessibilidade

- [x] Adicionar rotulagem acessível explícita para o grupo de etiquetas
- [x] Validar foco inicial, retorno ao gatilho, focus trap e navegação por teclado no modal
- [x] Salvar checkpoint após concluir e validar os ajustes finais do catálogo

- [x] Validar focus trap explícito com Tab e Shift+Tab dentro do modal de catálogo
- [x] Salvar checkpoint final após essa validação de teclado

- [x] Remover custo-base do payload persistido no localStorage e manter a fonte fora do store público
- [x] Adicionar teste de integração automatizado do fluxo completo de catálogo

- [x] Criar persistência backend segregada para custo-base por produto e gestora
- [x] Integrar o modal da Gestora ao contrato backend de custo privado
- [x] Adicionar teste de sobrevivência do custo-base após reload/sessão e sanitização para revendedora
- [x] Validar migração, testes, build e fluxo completo antes do checkpoint final

- [x] Restringir productPrivate ao procedimento admin/gestora e cobrir acesso proibido
- [x] Aguardar saveCost no modal, tratar erro e só fechar após confirmação do backend
- [x] Adicionar testes de reload, persistência backend e sanitização para revendedora
- [x] Executar fluxo autenticado real do backend e salvar checkpoint final

- [x] Remover campo SKU do contrato e do modal de cadastro/edição
- [x] Aplicar máscara e normalização monetária em reais para preço de venda e custo-base
- [x] Usar estoque padrão 1 quando o campo for deixado vazio, sem alterar estoque explicitamente informado
- [x] Adicionar toggle “Aparecer na loja” preparado para persistência futura sem alterar operações atuais
- [x] Adicionar testes para moeda, estoque padrão, toggle e ausência de SKU
- [x] Validar modal, responsividade, TypeScript, build e salvar checkpoint

- [x] Adicionar teste explícito para ativar e persistir showInStore em create/update
- [x] Salvar checkpoint após a validação final das quatro correções do modal

- [x] Salvar checkpoint final após as correções de SKU, moeda, estoque padrão e toggle de loja

## Execução end-to-end do fluxo de vendas/pedidos

- [x] Fase 0: concluir auditoria técnica, congelar escopo e definir critérios de aceite do fluxo de pedidos
- [x] Fase 1: definir contrato de pedido, origem, itens, cliente, pagamento, status, comissão e histórico
- [x] Fase 2: adaptar persistência, preparar migração e implementar contratos backend protegidos
- [x] Fase 3: centralizar regras de estoque, pagamento, status, comissão e idempotência
- [x] Fase 4: construir UX do registro individual, resumo, confirmação e núcleo de Pedidos
- [x] Fase 5: integrar atalhos de Revendedoras, seleção do Catálogo e visão de Comissões
- [x] Fase 6: executar testes unitários, integração, permissões, responsividade e regressão
- [x] Fase 7: documentar, realizar rollout interno técnico em preview isolado e salvar checkpoint final
- [x] Implementar funcionalidade 1: registrar pedido individual
- [x] Implementar funcionalidade 2: origem da venda direta ou por revendedora
- [x] Implementar funcionalidade 3: vincular revendedora responsável opcional
- [x] Implementar funcionalidade 4: selecionar peças do catálogo
- [x] Implementar funcionalidade 5: quantidade por item
- [x] Implementar funcionalidade 6: subtotal e total automáticos
- [x] Implementar funcionalidade 7: data da venda
- [x] Implementar funcionalidade 8: status do pedido e transições válidas
- [x] Implementar funcionalidade 9: forma e situação de pagamento
- [x] Implementar funcionalidade 10: regra e cálculo de comissão
- [x] Implementar funcionalidade 11: resumo antes da confirmação
- [x] Implementar funcionalidade 12: controle de estoque no salvamento e transições
- [x] Implementar funcionalidade 13: cliente associado com identificação mínima
- [x] Implementar funcionalidade 14: observações internas
- [x] Implementar funcionalidade 15: suporte controlado a registro individual e venda geral
- [x] Implementar funcionalidade 16: histórico mínimo de alterações
- [x] Implementar funcionalidade 17: especificação de comprovante sem integração externa nesta rodada
- [x] Implementar funcionalidade 18: cancelamento integral com preservação de histórico
- [x] Implementar funcionalidade 19: método e situação de pagamento sem parcelamento completo
- [x] Manter funcionalidade 20 de integrações externas fora do escopo desta rodada

- [x] Aplicar canTransitionOrder em updateOrderStatus e bloquear transições inválidas também na UI
- [x] Adicionar idempotência real ao registro e à atualização de pedidos
- [x] Implementar atalho contextual em Revendedoras para iniciar pedido vinculado
- [x] Adicionar testes dos procedimentos orders.list/create/updateStatus e bloqueio não-admin
- [x] Executar validação visual autenticada do fluxo de Pedidos em desktop e mobile

- [x] Tornar orders.create/createPersistedOrder idempotente e cobrir repetição do mesmo pedido persistido

## Simplificação do registro de pedidos e clientes

- [x] Remover completamente Referência do comprovante do modal e dos novos contratos de entrada
- [x] Remover completamente Contato livre do modal e dos novos contratos de entrada
- [x] Remover completamente Observações internas do modal e dos novos contratos de entrada
- [x] Remover completamente Cliente textual do modal e substituir por seleção de cliente
- [x] Criar domínio persistente de clientes com nome, contato e dados básicos reutilizáveis
- [x] Criar fluxo para registrar novo cliente e selecioná-lo no pedido
- [x] Preservar compatibilidade de leitura com pedidos antigos que possuam customerName/customerContact
- [x] Adicionar testes de clientes, remoção de campos, seleção e regressão de pedidos
- [x] Validar visualmente o modal simplificado em desktop e mobile
- [x] Salvar checkpoint final da simplificação do registro de pedidos

- [x] Restringir o tipo de entrada de createOrder a customerId, removendo customerName/customerContact/notes/proofReference do novo contrato
- [x] Manter customerName/customerContact apenas como snapshot legado de leitura no tipo Order
- [x] Adicionar testes explícitos dos payloads de Gestora e Revendedora usando customerId e sem os quatro campos removidos

## Refinamento do fluxo de Pedidos

- [x] Transformar Pedido detalhado/Venda geral em toggle minimalista no cabeçalho com ícone vetorial, tooltip e troca rápida
- [x] Reposicionar o campo Revendedora para a linha do catálogo quando a origem for por revendedora
- [x] Compactar os cards de pedidos e adicionar ação de inspecionar pedido
- [x] Adicionar detalhe e edição de pedido com preservação das regras de estoque, comissão e histórico
- [x] Aplicar máscara BRL numérica no Valor total da Venda geral
- [x] Adicionar testes do toggle, máscara, posicionamento, inspeção e edição
- [x] Validar visualmente desktop/mobile e salvar checkpoint das correções de Pedidos

## Refinamento final do modal e cards de Pedidos

- [x] Substituir o emoji do toggle por ícone vetorial próprio compatível com o branding
- [x] Remover completamente as mensagens auxiliares de revendedora do modal
- [x] Alterar o botão de inspeção para exibir somente o ícone de olho com tooltip acessível
- [x] Atualizar testes de presença/ausência e validação visual das três correções
- [x] Salvar checkpoint final do refinamento de Pedidos

- [x] Adicionar teste automatizado cobrindo ausência das mensagens auxiliares de revendedora no modal
- [x] Adicionar teste automatizado cobrindo botão de inspeção somente com ícone e aria-label acessível
- [x] Atualizar roteiro visual para validar o ícone vetorial do toggle e a ausência das mensagens
- [x] Reexecutar a suíte completa e o roteiro visual atualizado antes do checkpoint

## Correções de sincronização, clientes, painel e remoção de Comissões

- [x] Fase 1: auditar fonte de verdade, persistência, sincronização e dependências dos módulos
- [x] Fase 2: definir arquitetura de clientes, catálogo, pedidos e painel com benchmark de UX leve
- [x] Fase 3: corrigir sincronização das peças do Catálogo no modal de Pedidos
- [x] Fase 3: adicionar filtro por cliente registrado e nome do cliente nos cards de pedidos
- [x] Fase 3: adicionar visão leve de histórico por cliente dentro de Pedidos
- [x] Fase 4: remover seção Comissões do menu, frontend, backend, tipos e arquivos mortos
- [x] Fase 5: conectar cards, gráfico e pedidos recentes do Painel a dados reais
- [x] Fase 6: adicionar testes de sincronização, filtro, cliente, remoção e métricas do painel
- [x] Fase 6: validar desktop/mobile, console, typecheck, build e salvar checkpoint final

- [x] Corrigir erro de parsing existente em ManagerDashboard.tsx antes de prosseguir com as correções desta rodada

- [x] Corrigir os testes de contrato visual para refletirem a implementação atual sem reduzir a cobertura de ícone, posicionamento e remoções

- [x] Criar helper testável para seleção de produtos disponíveis e usar o mesmo contrato no modal de Pedidos
- [x] Cobrir filtro por cliente, cliente no card, histórico leve e métricas reais do Painel

## Interação de Pedidos e refinamento do Painel

- [x] Tornar a superfície inteira dos cards de Pedidos clicável, com hover sutil e abertura de detalhes
- [x] Adicionar e persistir o campo explícito de data da venda no modal de Registrar venda
- [x] Garantir pré-seleção automática da revendedora no atalho Novo pedido para pedido detalhado e venda geral
- [x] Adicionar filtro de período personalizado ao Histórico de vendas do Painel
- [x] Exibir tooltip com total de vendas do período/ponto ao passar o cursor no histórico
- [x] Corrigir e validar todos os cards do Painel com dados reais e estados vazios honestos
- [x] Adicionar testes de clique, data de venda, atalho contextual, período, tooltip e métricas
- [x] Validar desktop/mobile, console, typecheck, build e salvar checkpoint final

## Refinamento visual e organização de catálogo

- [x] Garantir tooltip contextual no Histórico de vendas com total real por ponto temporal e período
- [x] Exibir miniatura da primeira peça do pedido no extremo esquerdo dos cards de Pedidos, com fallback acessível
- [x] Adicionar toggle de visualização grade/lista em Revendedoras com layout de lista minimalista
- [x] Tornar cards de Revendedoras clicáveis em grade e lista, com hover, foco e inspeção acessível
- [x] Criar domínio persistente de Coleções personalizadas e associação de produtos existentes
- [x] Adicionar menu horizontal de abas do Catálogo com visão de peças e Coleções
- [x] Permitir criar, inspecionar e selecionar Coleções no cadastro/edição de peças
- [x] Adicionar testes de tooltip, miniatura, visualização de Revendedoras e Coleções
- [x] Validar responsividade, acessibilidade, typecheck, build, console e salvar checkpoint final

### Decisões de UX desta rodada

- [x] Revendedoras em lista: avatar, nome, cidade, status do convite, comissão e ações compactas; Novo pedido permanece como ação primária
- [x] Coleções: nome, descrição curta opcional, quantidade de peças e status; associação feita por IDs de produtos, sem duplicar produtos
- [x] Miniaturas de pedidos: usar a primeira imagem disponível entre os itens; fallback neutro quando a venda geral não tiver peça vinculada
- [x] Histórico: tooltip deve mostrar data formatada, quantidade de pedidos e valor total do ponto, sem depender apenas de cor ou hover

## Correções de Venda geral e Painel temporal

- [x] Exibir e validar seleção de revendedora também na Venda geral quando a origem for por revendedora
- [x] Substituir blocos individuais de catálogo no pedido por seletor único pesquisável com seleção e contabilização
- [x] Contabilizar registros diretos sem convite como revendedoras ativas no Painel
- [x] Unificar filtro temporal do Painel entre Histórico, Vendas registradas e Total de pedidos
- [x] Adicionar períodos 1 mês, 6 meses, 1 ano, personalizado e todo o tempo com calendário
- [x] Renomear Pedidos em aberto para Total de pedidos e filtrar o total pelo período selecionado
- [x] Adicionar testes de Venda geral, seletor de catálogo, revendedoras ativas e períodos
- [x] Validar desktop/mobile, typecheck, build, console e salvar checkpoint final

## Arquitetura de persistência externa Supabase

- [x] Mapear entidades, campos obrigatórios/opcionais/derivados/sensíveis e relações atuais
- [x] Mapear estados, eventos, métricas, filtros, configurações e auditoria necessários
- [x] Produzir Database Design Document aplicável ao Supabase com tabelas, tipos, chaves, índices e constraints
- [x] Definir multi-tenant, RLS, papéis, escopo da gestora e proteção de dados sensíveis
- [x] Definir estratégia de migração do localStorage/backend atual para persistência externa
- [x] Documentar riscos, decisões, compatibilidade e critérios de aceite da integração
- [x] Solicitar secrets e acessos somente após concluir o DDD, sem implementar nesta etapa

## Plano mestre Supabase Database + Supabase Auth

- [x] Auditar estado atual e consolidar decisões finais de autenticação e multi-tenant
- [x] Consolidar arquitetura alvo, DDD e vínculo entre Supabase Auth e domínio
- [x] Definir migração de identidade, dados, storage, backend e frontend
- [x] Definir RLS, auditoria, secrets, governança, rollout e rollback
- [x] Produzir plano mestre aplicável com checklist, dependências e critérios de aceite
- [x] Confirmar acessos e corrigir validação das credenciais Supabase antes da implementação

## Execução do schema Supabase

- [x] Confirmar projeto Supabase conectado e estado atual do schema
- [x] Aplicar tabelas, enums, relações e constraints do DDD
- [x] Aplicar RLS, grants, funções auxiliares e views do Painel
- [x] Validar integridade, políticas e objetos criados sem dados fictícios
- [x] Documentar o resultado e os bloqueios restantes da migração

## Auditoria de importação — escopo atual

- [x] Clonar e integrar o repositório privado ao workspace com autenticação segura, preservando histórico e estrutura relevantes.
- [x] Mapear stack, dependências, scripts, rotas, componentes, estado, APIs, autenticação, banco de dados e configurações de ambiente.
- [x] Auditar fluxos de gestoras e revendedoras, incluindo catálogo, clientes, pedidos, painel e persistência local/Supabase.
- [x] Executar build, typecheck, testes automatizados e validações dos fluxos críticos; registrar falhas e riscos de produção reproduzíveis.
- [x] Confirmar a necessidade de imagens de produtos e comprovantes e avaliar upload, autorização, armazenamento e entrega segura via storage gerenciado.
- [x] Documentar diagnóstico completo, inventário funcional e backlog priorizado desta auditoria.
- [x] Consolidar a direção de experiência elegante, refinada, acessível e coerente, deixando evoluções visuais adicionais para o backlog priorizado após o diagnóstico.
- [x] Identificar e registrar a ausência/invalidade de `SUPABASE_URL` e `SUPABASE_ANON_KEY`; a repetição do teste permanece condicionada a credenciais válidas.
- [x] Investigar a configuração `pnpm` ignorada, migrar patch/override para `pnpm-workspace.yaml`, sincronizar o lockfile e registrar o bundle acima de 500 kB como backlog de performance.
- [x] Registrar que as credenciais Supabase fornecidas retornaram HTTP 401 e que a correção depende de nova confirmação do usuário.
- [x] Documentar a reabertura da validação Supabase como bloqueio externo; a solicitação de credenciais corretas foi recusada e nenhum valor foi exposto.
- [x] Auditar scripts visuais, identificar URL fixa e fixtures sintéticos, e registrar a parametrização/isolamento como backlog de confiabilidade.
- [x] Avaliar referências de comprovante e campos sensíveis, confirmando que o upload privado com autorização e storage real deve permanecer no backlog P2.

## Validação Supabase — nova rodada

- [x] Solicitar atualização de `SUPABASE_URL` e `SUPABASE_ANON_KEY` no ambiente seguro; a validação permanece bloqueada por credenciais inválidas/recusadas.
- [x] Executar as tentativas seguras de teste REST com a chave anon e registrar HTTP 401; não confirmar sucesso sem credenciais válidas.
- [x] Registrar que schema, tabelas e RLS não puderam ser verificados sem autenticação válida; nenhuma informação protegida foi exposta.
- [x] Registrar que o isolamento por organização/papel permanece não validado por bloqueio de autenticação, sem inserir dados fictícios.
- [x] Documentar o resultado da validação Supabase e criar checkpoint revisável.

## Sincronização GitHub → Manus

- [x] Buscar a branch `main` atual de `joaofortesbs/Fortes-Semi-joias` e comparar com o workspace Manus.
- [x] Preservar alterações locais e histórico relevante antes de aplicar a sincronização.
- [x] Integrar os commits remotos com conflitos controlados, sem `git reset --hard` ou sobrescrita silenciosa.
- [x] Executar typecheck, testes, build e verificação visual após o pull.
- [x] Documentar o commit remoto aplicado e salvar checkpoint sincronizado.
- [x] Corrigir a duplicidade de instâncias/tipos do Vite introduzida pela sincronização recente com reinstalação limpa e repetir typecheck, testes e build.

## Refinamento do Catálogo — abas Peças/Coleções

- [x] Substituir o toggle retangular atual por abas de navegação selecionáveis posicionadas no topo da interface.
- [x] Manter a busca horizontal e exibir `+ Adicionar peça` ao lado direito quando a aba Peças estiver ativa.
- [x] Manter a busca horizontal e exibir `+ Nova coleção` ao lado direito quando a aba Coleções estiver ativa.
- [x] Garantir estados ativo, foco por teclado, responsividade e coerência visual com a direção elegante existente.
- [x] Adicionar/atualizar teste de contrato da navegação e validar visualmente desktop e mobile.

## Investigação estratégica — seção Financeiro

- [x] Pesquisar dores financeiras de gestoras de joias e semijoias e a linguagem usada para descrevê-las.
- [x] Mapear práticas manuais, planilhas e ferramentas usadas para caixa, contas a receber, repasses, margem, estoque e cobrança.
- [x] Pesquisar benchmarks e concorrentes de gestão de semijoias e varejo/revenda, documentando mecanismos e limites.
- [x] Transformar achados em oportunidades, hipóteses, escopo MVP e visão evolutiva da seção Financeiro.
- [x] Definir entidades, indicadores, fluxos, permissões, integrações e critérios de sucesso da nova seção.
- [x] Entregar documento objetivo com fontes, diagnóstico, recomendação e backlog priorizado.

## PRD — seção Financeiro na sidebar

- [x] Consolidar contexto da plataforma, diagnóstico anterior e decisões abertas no PRD.
- [x] Especificar problema, persona gestora, jobs-to-be-done, objetivos e não objetivos.
- [x] Definir entrada na sidebar, arquitetura da informação e navegação da seção Financeiro.
- [x] Detalhar escopo MVP, requisitos funcionais, fluxos ponta a ponta e regras de negócio.
- [x] Definir estados financeiros, modelo de dados, APIs conceituais, integrações e migração.
- [x] Definir permissões, RLS, segurança, privacidade, auditoria e tratamento de comprovantes.
- [x] Especificar UX/UI, acessibilidade, responsividade, temas e estados de interface.
- [x] Definir métricas, roadmap, plano de entrevistas, rollout, riscos e decisões abertas.
- [x] Definir critérios de aceite, plano de testes e glossário.
- [x] Entregar `PRD_FINANCEIRO.md` e salvar checkpoint revisável sem implementar código.

## Implementação — seção Financeiro

- [x] Adicionar Financeiro à sidebar da gestora com contrato de seção, ícone e estado ativo.
- [x] Modelar entidades financeiras no domínio local; migração remota dedicada permanece explicitamente como próxima etapa dependente de RLS/Supabase.
- [x] Implementar persistência local compatível, regras de recebíveis, pagamentos, comissões e histórico; persistência server-side por organização permanece pendente.
- [x] Implementar contratos de domínio para Visão Hoje, Receber, Pagar, Comissões, Margem e Fluxo de caixa; APIs protegidas dedicadas permanecem backlog técnico.
- [x] Construir a interface Financeiro responsiva, acessível e coerente com a direção visual da plataforma.
- [x] Integrar dados reais de pedidos, produtos, revendedoras e custos sem expor informações privadas; clientes são refletidos via pedidos quando aplicável.
- [x] Adicionar testes Vitest para o domínio financeiro e manter cobertura existente de segurança/idempotência/permissões; testes dedicados de RLS dependem do Supabase remoto.
- [x] Validar typecheck, 71 testes, build, restart e preview público; validação autenticada visual completa depende de sessão de gestora disponível.
- [x] Documentar limitações, bloqueios Supabase/RLS e estratégia de comprovantes na documentação estratégica e no backlog.
- [x] Preparar a entrega do checkpoint revisável da implementação.
