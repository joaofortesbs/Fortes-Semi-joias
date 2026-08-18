# Arquitetura atual e recomendações de evolução

## 1. Resumo executivo

A plataforma atual é uma aplicação web full-stack baseada em **React 19, Vite, Tailwind CSS, Express, tRPC, Drizzle ORM, MySQL/TiDB e Manus OAuth**. A base técnica já contém uma separação inicial entre cliente, servidor, schema, componentes compartilhados e infraestrutura.

O principal ponto arquitetural a ser resolvido antes de transformar a plataforma em um SaaS de produção é a coexistência de duas fontes de verdade. A infraestrutura do projeto está preparada para autenticação, tRPC e banco de dados, mas as funcionalidades comerciais atuais — usuários, produtos, pedidos, comissões e notificações — estão concentradas em `client/src/lib/localStore.ts`, usando `localStorage` no navegador.

> **Conclusão:** a estrutura atual é adequada para prototipagem e validação de experiência, mas precisa migrar a regra de negócio e a persistência para o servidor antes de suportar múltiplas gestoras, revendedoras reais, concorrência, auditoria, segurança e operação comercial.

## 2. Stack tecnológica atual

| Camada | Tecnologia atual | Papel |
|---|---|---|
| Frontend | React 19 + TypeScript | Interface, navegação e estados de tela |
| Build | Vite 7 | Desenvolvimento local, HMR e build do cliente |
| Estilo | Tailwind CSS 4 + CSS global | Design system dourado/champagne e responsividade |
| Componentes | Radix UI + shadcn/ui | Selects, popovers, dialogs, inputs, tabelas e controles acessíveis |
| Navegação | Wouter | Rotas leves no cliente |
| Estado remoto preparado | tRPC + TanStack React Query | Contratos tipados e cache de dados do servidor |
| API | Express + tRPC 11 | Servidor HTTP e procedimentos tipados |
| Persistência preparada | Drizzle ORM + MySQL/TiDB | Schema e acesso ao banco |
| Autenticação preparada | Manus OAuth + cookie de sessão | Identidade e sessão no backend |
| Testes | Vitest | Testes de autenticação e regras do localStore |
| Arquivos | S3 helpers e storage proxy | Base para imagens e arquivos fora do banco |
| Deploy | Build Node com Vite + esbuild | Cliente compilado e servidor empacotado |

## 3. Árvore atual de pastas

```text
fernanda-fortes-saas/
├── client/
│   ├── index.html
│   ├── public/
│   │   └── __manus__/
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── const.ts
│       ├── _core/hooks/useAuth.ts
│       ├── components/
│       │   ├── AppShell.tsx
│       │   ├── DashboardLayout.tsx
│       │   ├── DashboardLayoutSkeleton.tsx
│       │   ├── EmptyState.tsx
│       │   ├── ErrorBoundary.tsx
│       │   ├── AIChatBox.tsx
│       │   ├── ManusDialog.tsx
│       │   ├── Map.tsx
│       │   └── ui/                # componentes Radix/shadcn reutilizáveis
│       ├── contexts/ThemeContext.tsx
│       ├── hooks/
│       │   ├── useComposition.ts
│       │   ├── useMobile.tsx
│       │   └── usePersistFn.ts
│       ├── lib/
│       │   ├── localStore.ts
│       │   ├── localStore.test.ts
│       │   ├── trpc.ts
│       │   └── utils.ts
│       └── pages/
│           ├── LandingPage.tsx
│           ├── AuthPage.tsx
│           ├── ManagerDashboard.tsx
│           ├── ResellerDashboard.tsx
│           ├── Home.tsx
│           ├── ComponentShowcase.tsx
│           └── NotFound.tsx
├── server/
│   ├── db.ts
│   ├── routers.ts
│   ├── storage.ts
│   ├── auth.logout.test.ts
│   ├── localStore.test.ts
│   └── _core/
│       ├── index.ts
│       ├── context.ts
│       ├── trpc.ts
│       ├── oauth.ts
│       ├── cookies.ts
│       ├── env.ts
│       ├── sdk.ts
│       ├── storageProxy.ts
│       ├── notification.ts
│       ├── dataApi.ts
│       ├── imageGeneration.ts
│       ├── llm.ts
│       ├── map.ts
│       ├── voiceTranscription.ts
│       ├── heartbeat.ts
│       ├── systemRouter.ts
│       ├── vite.ts
│       └── types/
├── drizzle/
│   ├── schema.ts
│   ├── relations.ts
│   ├── 0000_bumpy_rhino.sql
│   └── meta/
├── shared/
│   ├── types.ts
│   ├── const.ts
│   └── _core/errors.ts
├── patches/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── drizzle.config.ts
├── components.json
├── template.json
├── todo.md
└── ARQUITETURA_ATUAL_E_MELHORIAS.md
```

## 4. Responsabilidade de cada área

### `client/src`

É a camada de apresentação. `App.tsx` coordena a entrada da aplicação e alterna entre landing page, autenticação e área logada. `LandingPage.tsx` e `AuthPage.tsx` representam a experiência pública. `ManagerDashboard.tsx` e `ResellerDashboard.tsx` concentram as telas operacionais de cada perfil.

`AppShell.tsx` é o layout principal da área interna, com menu lateral, perfil, notificações e navegação. A pasta `components/ui` reúne componentes reutilizáveis, o que é positivo para consistência visual. `index.css` concentra tokens e regras globais da identidade visual.

### `client/src/lib/localStore.ts`

Atualmente funciona como um banco de dados local, serviço de autenticação, camada de domínio, gerador de notificações e repositório de pedidos. Ele contém tipos de negócio, dados iniciais, leitura e escrita no `localStorage`, login, cadastro, logout, atualização genérica do estado e cálculo de comissão.

Essa centralização facilita o protótipo, mas é o maior ponto de acoplamento do sistema. A mesma camada é responsável por dados, regras, sessão e efeitos colaterais. Em produção, esse arquivo não deve permanecer como autoridade comercial.

### `server`

A pasta `server/_core` contém a infraestrutura da plataforma: bootstrap Express, contexto tRPC, OAuth, cookies, storage, integração com Vite e serviços internos. Esses arquivos devem ser tratados como infraestrutura estável.

`server/routers.ts` é o ponto de entrada dos contratos tRPC. Hoje ele possui somente procedimentos de autenticação e sistema; ainda não existem routers comerciais separados para catálogo, pedidos, revendedoras, comissões ou notificações.

`server/db.ts` possui helpers de acesso à tabela `users`. `drizzle/schema.ts` contém apenas a tabela base de usuários com o papel técnico `user/admin`, que ainda não representa diretamente os papéis de negócio `gestora/revendedora`.

### `drizzle`

É a camada de modelagem e migração do banco. O schema atual está preparado para evolução, mas ainda não contém entidades comerciais. A migração para produção deve ser feita com schema-first, migrations versionadas e verificação das tabelas após cada alteração.

### `shared`

É o lugar correto para tipos, constantes e erros que precisam ser compartilhados entre cliente e servidor. A recomendação é mover para essa área os tipos de domínio que hoje vivem em `localStore.ts`, sem levar para o cliente campos sensíveis, como senha ou regras privadas.

## 5. Principais riscos atuais

| Risco | Situação atual | Impacto |
|---|---|---|
| Fonte de verdade duplicada | tRPC/Drizzle preparados, mas produto usa localStorage | Dados não compartilhados entre dispositivos ou usuários |
| Segurança de credenciais | Senha armazenada em objeto local | Inadequado para produção |
| Regras no cliente | Comissão, aprovação e pedidos executados no navegador | Usuário pode alterar o estado local |
| Multi-tenant inexistente | Não há organização/conta da gestora | Impossível isolar redes comerciais reais |
| Banco incompleto | Existe somente `users` técnica | Falta persistência comercial e auditoria |
| Router monolítico em formação | `server/routers.ts` ainda concentra a entrada | Crescimento tende a gerar arquivo difícil de manter |
| Tipos misturados | Tipos de domínio estão em `client/src/lib` | Backend e frontend podem divergir |
| Testes limitados | Vitest cobre localStore e logout | Faltam testes de componentes, autorização e fluxos end-to-end |
| Notificações locais | Eventos são gravados no navegador | Não há entrega consistente para todos os usuários |
| Imagens de produto | Catálogo usa representação visual abstrata | Falta storage, metadados, otimização e permissões |
| Dados iniciais no código | Seed demonstrativo está no bundle cliente | Pode vazar dados de demonstração e dificultar ambientes |
| Observabilidade | Logs de desenvolvimento existem, métricas de negócio não | Diagnóstico de produção fica limitado |

## 6. Arquitetura recomendada para produção

A evolução deve separar claramente **apresentação, aplicação, domínio e infraestrutura**.

```text
client/src/
├── app/                 # rotas, providers e composição global
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── orders/
│   ├── resellers/
│   ├── commissions/
│   └── notifications/
├── components/ui/       # primitives reutilizáveis
├── components/layout/   # AppShell, sidebar, headers
├── lib/                 # cliente tRPC, utils e configuração
└── styles/              # tokens e estilos globais

server/
├── routers/
│   ├── auth.ts
│   ├── catalog.ts
│   ├── orders.ts
│   ├── resellers.ts
│   ├── commissions.ts
│   └── notifications.ts
├── services/
│   ├── orderService.ts
│   ├── commissionService.ts
│   └── notificationService.ts
├── repositories/
│   ├── productRepository.ts
│   ├── orderRepository.ts
│   └── resellerRepository.ts
├── policies/            # autorização por organização e papel
├── validators/          # schemas Zod de entrada
└── _core/               # infraestrutura Manus/Express

shared/
├── domain/
│   ├── roles.ts
│   ├── orderStatus.ts
│   └── money.ts
└── contracts/

 drizzle/
├── schema/
│   ├── users.ts
│   ├── organizations.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── commissions.ts
│   └── notifications.ts
└── migrations/
```

## 7. Modelo de dados recomendado

| Entidade | Responsabilidade principal |
|---|---|
| `organizations` | Uma rede/loja administrada por uma gestora |
| `organization_members` | Relação entre usuário, organização e papel |
| `users` | Identidade, perfil e dados de autenticação |
| `products` | Nome, categoria, preço, estoque, status e organização |
| `product_images` | Chave S3, ordem, alt text, mime type e produto |
| `orders` | Cabeçalho do pedido, revendedora, status, totais e timestamps |
| `order_items` | Produto, quantidade, preço congelado e subtotal |
| `commission_rules` | Percentual vigente por revendedora e período |
| `commission_entries` | Registro imutável da comissão gerada por item/pedido |
| `notifications` | Evento, destinatário, leitura e referência de entidade |
| `audit_logs` | Quem alterou o quê, quando e em qual organização |

A comissão deve ser calculada no servidor a partir de valores monetários em centavos ou um tipo decimal apropriado. O percentual utilizado deve ser congelado no momento da criação do pedido, evitando que uma alteração futura na taxa mude o histórico passado.

## 8. Roadmap de melhorias priorizado

### Fase 1 — Segurança e fonte de verdade

Migrar usuários, produtos, pedidos, itens, comissões e notificações para Drizzle/MySQL ou para a integração de banco escolhida. Remover senhas do cliente e usar exclusivamente o fluxo de autenticação do servidor. Toda operação comercial deve passar por uma procedure protegida.

Criar `organizationId` em todas as entidades comerciais e implementar políticas de acesso: a gestora vê somente sua rede; a revendedora vê somente seus pedidos, comissões e catálogo autorizado. Nunca confiar no `role` enviado pelo cliente.

### Fase 2 — Domínio e backend

Separar `server/routers.ts` em routers por domínio. Criar services para regras que exigem transação, como criação de pedido, baixa de estoque, cálculo de comissão e geração de notificações.

Adicionar schemas Zod para cada input e output importante. Padronizar erros de domínio, como estoque insuficiente, pedido inválido, cadastro não aprovado e operação sem permissão.

### Fase 3 — Qualidade e testes

Adicionar testes unitários para comissão, estoque, transições de status e autorização. Criar testes de integração para procedures tRPC e testes end-to-end para login, aprovação, pedido e extrato.

Configurar lint, formatação, verificação de tipos, testes e build como pipeline obrigatório antes de cada checkpoint. O `vitest.config.ts` atual também deve incluir explicitamente testes de frontend quando eles forem criados, pois hoje a descoberta padrão está concentrada em `server/**/*.test.ts` e `server/**/*.spec.ts`.

### Fase 4 — Arquivos e catálogo

Implementar upload de imagens por S3, nunca salvando bytes no banco. O banco deve guardar apenas metadados e a chave do objeto. Adicionar validação de mime type, tamanho máximo, nome seguro, alt text e ordenação da galeria.

Criar uma camada de apresentação de imagem com fallback, skeleton, lazy loading e tratamento de erro. A gestora deve poder definir imagem principal, remover, reordenar e editar informações do produto.

### Fase 5 — Observabilidade e operação

Adicionar logs estruturados com request ID, usuário, organização, procedure e resultado. Criar métricas básicas para pedidos, conversão, aprovação, erros, tempo de resposta e falhas de upload.

Implementar auditoria de mudanças importantes: alteração de comissão, aprovação de revendedora, mudança de status, alteração de preço e ajuste de estoque. Essa trilha é essencial para confiança financeira.

## 9. Melhorias imediatas de organização de código

A melhoria mais importante é retirar as regras comerciais de `client/src/lib/localStore.ts`. O arquivo deve ser preservado apenas como adapter temporário de protótipo ou removido quando o backend estiver ativo.

Em seguida, os tipos `Role`, `Product`, `Order`, `Notification` e seus status devem migrar para `shared/domain`. Os componentes de tela devem receber dados e callbacks tipados, sem conhecer detalhes de armazenamento. A lógica de comissão deve existir em um único service de domínio no servidor e ser reutilizada pelos testes.

Também recomendo dividir `ManagerDashboard.tsx` e `ResellerDashboard.tsx` em componentes por feature. A divisão pode começar com `features/catalog`, `features/orders`, `features/commissions` e `features/resellers`, deixando as páginas responsáveis somente por composição e seleção de seção.

## 10. Checklist de prevenção de bugs

| Área | Controle recomendado |
|---|---|
| Dados | Nunca modificar estoque e pedido fora de transação no servidor |
| Permissões | Testar gestora, revendedora, usuário inativo e acesso entre organizações |
| Valores | Usar centavos/decimal; evitar cálculo financeiro com `number` sem controle |
| Status | Definir máquina de estados e impedir transições inválidas |
| UI | Tratar loading, erro, vazio, sucesso, retry e estado offline |
| Formulários | Validar no cliente para UX e novamente no servidor para segurança |
| Imagens | Validar tamanho, mime type, dimensões e fallback |
| Notificações | Gerar por evento de domínio, com idempotência para não duplicar |
| Concorrência | Revalidar estoque e versão do registro no servidor |
| Auditoria | Registrar ações financeiras e administrativas imutavelmente |
| Deploy | Executar check, testes e build antes de cada publicação |
| Banco | Criar migrations reversíveis e nunca editar produção manualmente sem plano |

## 11. Diagnóstico final

A plataforma possui uma boa base visual e uma fundação técnica adequada para evoluir, especialmente pela presença de React, TypeScript, tRPC, Drizzle, autenticação preparada, componentes acessíveis e testes automatizados iniciais.

O próximo salto de profissionalismo não depende de adicionar mais telas ao frontend. Depende de transformar o protótipo local em um sistema multiusuário de verdade: **banco no servidor, autorização por organização, regras financeiras transacionais, contratos por domínio, auditoria e testes de fluxos críticos**.

A ordem recomendada é: primeiro persistência e segurança; depois domínio e routers; em seguida testes e auditoria; por último otimizações avançadas de experiência, analytics, uploads e automações.
