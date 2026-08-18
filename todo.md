
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
