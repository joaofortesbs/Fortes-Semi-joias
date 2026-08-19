
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

- [ ] Salvar checkpoint final após as correções de SKU, moeda, estoque padrão e toggle de loja
