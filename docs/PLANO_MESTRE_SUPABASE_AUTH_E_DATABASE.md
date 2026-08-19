# Plano Mestre de Arquitetura e Migração
## Fernanda Fortes Semijoias — Supabase Database + Supabase Auth

**Versão:** 2.0 — plano executivo e técnico consolidado  
**Data:** 19 de agosto de 2026  
**Responsável:** Manus AI  
**Status:** pronto para aprovação e execução por fases; nenhuma migration ou migração de identidade foi executada neste documento.

> **Decisão arquitetural:** o Supabase será a fonte principal de dados e a autenticação será migrada para o Supabase Auth. O projeto só deve sair do estado atual quando schema, RLS, sessões, importação de dados e rollback tiverem sido validados em staging.

---

## 1. Objetivo e resultado esperado

O objetivo é substituir a arquitetura híbrida atual por uma arquitetura centralizada, profissional e auditável, na qual o **Supabase Auth** seja responsável pela identidade e sessões, o **Supabase Postgres** seja a fonte única de verdade dos dados de negócio, o **Supabase Storage** armazene imagens e o backend tRPC permaneça como camada de domínio e compatibilidade para o frontend React.

O resultado final deverá permitir que a gestora e as revendedoras utilizem a plataforma em múltiplos dispositivos, sem depender de `localStorage` para fatos de negócio. Produtos, estoques, coleções, clientes, pedidos, itens, pagamentos, convites, membros, notificações e históricos deverão sobreviver a logout, troca de navegador e reinício do dispositivo.

O Painel deverá calcular métricas a partir de dados persistidos. O frontend poderá manter cache e estado transitório, mas não poderá ser a única fonte de verdade para criação, edição, exclusão, estoque, status ou autenticação.

---

## 2. Estado atual: leitura arquitetural

### 2.1 Camadas existentes

| Camada | Situação atual | Consequência |
|---|---|---|
| Frontend | React 19, Tailwind 4, tRPC client, páginas de Gestora e Revendedora | boa separação visual, mas parte dos contratos ainda conversa com store local |
| Backend | Express + tRPC 11 + Drizzle/MySQL parcial | autenticação e algumas mutações já têm proteção, porém o domínio completo não está no servidor |
| Auth | Manus OAuth/sessão atual, `ctx.user`, `openId` | não está alinhado ao `auth.uid()` do Supabase RLS |
| Persistência de negócio | `localStorage` em `client/src/lib/localStore.ts` | dados ficam presos ao navegador e podem divergir entre dispositivos |
| Banco atual | `users`, `private_product_costs`, `orders` compacta com `payload` JSON | insuficiente para consultas relacionais, RLS e relatórios confiáveis |
| Catálogo | produtos, imagem, preço, estoque, status, variações, tags, coleção, `showInStore` | precisa de tabelas e Storage próprios |
| Pedidos | detalhado/geral, cliente, revendedora, pagamento, status, histórico, comissão | precisa sair do payload opaco e virar modelo relacional |
| Revendedoras | registros diretos e convites, `active`, `inviteStatus`, cidade e comissão | precisa separar perfil, membro da organização e convite |
| Painel | métricas derivadas e filtros temporais | deve consultar views/funções sobre dados persistidos |

### 2.2 Fonte de verdade atual

O `Store` local contém `users`, `customers`, `products`, `orders`, `notifications`, `collections` e `sessionUserId`. O backend persiste somente parte dos usuários, custos privados e pedidos compactos. Portanto, o primeiro problema não é “conectar o Supabase ao frontend”; é **eliminar a duplicidade sem perder o histórico local**.

O contrato atual também possui dados com naturezas diferentes misturados no mesmo objeto: fatos de negócio, snapshots históricos, estado de UI, dados sensíveis e campos legados. O plano separa essas categorias antes de migrar.

### 2.3 Problemas e riscos atuais

| Risco | Severidade | Efeito |
|---|---:|---|
| localStorage como fonte de negócio | crítica | perda, divergência e ausência de sincronização entre dispositivos |
| pedidos em `payload` JSON | alta | consultas frágeis, dificuldade de auditoria e filtros lentos |
| `ownerOpenId` como tenant implícito | alta | não representa organização e dificulta crescimento multiusuário |
| Manus Auth fora do Supabase Auth | alta | RLS não consegue usar diretamente `auth.uid()` |
| estoque salvo apenas como saldo | alta | cancelamentos e ajustes não têm trilha completa |
| custo-base próximo do catálogo público | alta | risco de vazamento para revendedoras |
| tokens de convite em URL | alta | exposição indevida se token puro for persistido |
| ausência de RLS central | crítica | autorização depende excessivamente do backend/UI |
| datas e IDs legados heterogêneos | média | risco de filtros incorretos e colisões na migração |
| alterações remotas sem migration versionada | alta | ambientes podem divergir e rollback fica incerto |

---

## 3. Arquitetura alvo

### 3.1 Fluxo de requisição

```text
Supabase Auth
    │ JWT com auth.uid()
    ▼
React 19 + cache/query layer
    │ sessão Supabase, sem service role
    ▼
tRPC / Express — camada de domínio
    │ validação Zod, idempotência, regras de estoque/status
    ▼
Supabase Postgres + RLS
    │ organization_id, constraints, views e funções
    ├── Supabase Storage: imagens e arquivos
    └── audit_events / order_status_history
```

O frontend não deve espalhar queries Supabase em todas as páginas. O tRPC continuará sendo o contrato principal da aplicação durante a migração, porque concentra validação, compatibilidade e regras de negócio. O backend usará um cliente Supabase server-side com o token do usuário para operações normais e um cliente administrativo com service role apenas em rotinas controladas de migração/bootstrapping.

### 3.2 Fonte única de verdade

| Tipo de dado | Fonte final | Cache permitido |
|---|---|---|
| identidade/sessão | Supabase Auth | cache da sessão, nunca identidade fictícia |
| perfil/membro/papel | `profiles` + `organization_members` | query cache |
| produtos | `products` | cache invalidável |
| imagens | Supabase Storage + `product_media` | URL cache |
| custo-base | `product_private_costs` | somente gestora e server-side |
| pedidos/itens | `orders` + `order_items` | cache invalidável |
| estoque | `inventory_movements` e saldo de transição | cache, nunca escrita local isolada |
| clientes | `customers` | cache |
| coleções | `collections` + `collection_products` | cache |
| notificações | `notifications` | cache com marcação lida |
| métricas | views/functions sobre tabelas | cache curto, nunca edição manual |
| filtros e modo de visualização | `user_preferences` opcional | estado local transitório |

### 3.3 Princípios não negociáveis

1. **Supabase Auth é a identidade.** Não haverá nova autenticação paralela como fonte oficial depois do cutover.
2. **RLS é defesa de profundidade.** O backend continuará autorizando, mas o banco também bloqueará linhas fora do tenant.
3. **Toda operação crítica é idempotente.** Criar pedido, reduzir estoque, aceitar convite e migrar usuário não pode duplicar efeitos.
4. **Valores monetários usam `numeric(12,2)`.** Não usar `float`.
5. **Histórico financeiro usa snapshots.** Alterar produto ou cliente não altera a leitura de um pedido antigo.
6. **Soft delete para entidades referenciadas.** Produtos, clientes e membros não devem desaparecer fisicamente de um pedido histórico.
7. **Migrations são código.** Nenhuma alteração estrutural deve ser feita diretamente em produção pelo Dashboard depois do primeiro deploy versionado.
8. **Secrets nunca vão para o browser.** A service role só existe no servidor/rotinas seguras.

---

## 4. Database Design Document consolidado

### 4.1 Domínio de identidade e tenant

#### `auth.users` e `auth.identities`

Gerenciados pelo Supabase Auth. Não criar cópia de senha no schema público. Configurar e-mail/OTP ou password conforme o fluxo aprovado. Metadados JWT devem ser mínimos; papel e vínculo de organização devem ser consultados em tabelas próprias ou claims controladas.

#### `profiles`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK e FK para `auth.users.id` |
| `full_name` | text | NOT NULL |
| `email` | citext/text | opcional conforme provider; normalizado |
| `phone` | text | opcional e protegido |
| `auth_subject_legacy` | text | opcional, para rastrear Manus `openId` |
| `login_method` | text | opcional |
| `last_signed_in_at` | timestamptz | opcional |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | trigger |

#### `organizations`

Representa a conta operacional da gestora.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | NOT NULL |
| `slug` | text | UNIQUE |
| `owner_profile_id` | uuid | FK profiles |
| `timezone` | text | default `America/Sao_Paulo` |
| `currency` | char(3) | default `BRL`, CHECK |
| `created_at`, `updated_at` | timestamptz | NOT NULL |

#### `organization_members`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK, índice |
| `profile_id` | uuid | FK, índice |
| `role` | enum | `owner`, `manager`, `reseller` |
| `is_active` | boolean | default true |
| `created_at`, `updated_at` | timestamptz | NOT NULL |

UNIQUE (`organization_id`, `profile_id`). O papel é contextual à organização, não um campo global confiável.

#### `reseller_profiles`

| Campo | Tipo | Regra |
|---|---|---|
| `member_id` | uuid | PK/FK member |
| `city` | text | NOT NULL no fluxo atual |
| `commission_rate` | numeric(5,2) | CHECK 0–100 |
| `invite_status` | enum | `not_invited`, `pending`, `accepted`, `expired` |
| `created_at`, `updated_at` | timestamptz | NOT NULL |

#### `reseller_invites`

`id`, `organization_id`, `member_id`, `email`, `token_hash`, `status`, `expires_at`, `accepted_at`, `created_by`, timestamps. Persistir hash, nunca token puro. Link deve ser de uso único ou invalidável.

### 4.2 Catálogo e Storage

#### `products`

`id`, `organization_id`, `name`, `name_normalized`, `category`, `description`, `sale_price numeric(12,2)`, `stock_on_hand integer`, `status`, `accent_color`, `show_in_store boolean`, timestamps e `deleted_at`.

Constraints: preço/estoque não negativos; nome normalizado único por organização; soft delete.

#### `product_private_costs`

PK composta (`organization_id`, `product_id`), `cost_base numeric(12,2)`, timestamps. RLS restrito a owner/manager.

#### `product_media`

`id`, `organization_id`, `product_id`, `storage_bucket`, `storage_path`, `kind`, `mime_type`, `byte_size`, `sort_order`, timestamps. O arquivo fica no Supabase Storage; o banco guarda metadados e path.

#### `product_variations`, `product_variation_options`, `tags`, `product_tags`

Normalizam as variações e etiquetas atuais. Cada associação deve ser única e pertencer à organização do produto.

#### `collections`, `collection_products`

Coleções possuem nome, descrição e timestamps. A associação é N:N por PK composta. A quantidade de peças é derivada, não um contador manual.

#### `inventory_movements`

`id`, `organization_id`, `product_id`, `order_id`, `movement_type`, `quantity_delta`, `reason`, `created_by`, `created_at`. A primeira migração preserva `stock_on_hand` e cria movimento `initial_balance`; novos pedidos/cancelamentos geram movimentos atômicos.

### 4.3 Pedidos, clientes e pagamentos

#### `customers`

`id`, `organization_id`, `full_name`, `phone`, `phone_normalized`, `email`, timestamps e `deleted_at`. UNIQUE (`organization_id`, `phone_normalized`) quando o telefone existir.

#### `orders`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | FK, NOT NULL |
| `created_by_profile_id` | uuid | FK |
| `reseller_member_id` | uuid | nullable; obrigatório se origin reseller |
| `customer_id` | uuid | nullable |
| `origin` | enum | `direct`, `reseller` |
| `entry_type` | enum | `detailed`, `general` |
| `status` | enum | pending, approved, paid, separating, shipped, delivered, cancelled |
| `payment_method` | enum | pix, cash, card, transfer, other |
| `payment_status` | enum | pending, paid, partially_paid, refunded |
| `sale_date` | timestamptz | filtro do Painel |
| `manual_description` | text | venda geral |
| `total_amount` | numeric(12,2) | CHECK >= 0 |
| `commission_amount` | numeric(12,2) | snapshot |
| `commission_rate` | numeric(5,2) | snapshot 0–100 |
| `customer_name_snapshot` | text | histórico |
| `customer_phone_snapshot` | text | histórico/PII |
| `legacy_payload` | jsonb | somente transição |
| `request_id` | text/uuid | UNIQUE por organização/operação |
| timestamps | timestamptz | NOT NULL |
| `cancelled_at` | timestamptz | nullable |

Índices: organização/data, organização/status, organização/revendedora/data, organização/cliente/data.

#### `order_items`

`id`, `order_id`, `product_id nullable`, `item_type`, `product_name_snapshot`, `unit_price`, `quantity`, `subtotal`, timestamps. Venda detalhada usa item real; venda geral usa item sintético sem `product_id` e não movimenta estoque.

#### `order_status_history`

`id`, `organization_id`, `order_id`, `from_status`, `to_status`, `changed_by_profile_id`, `changed_at`, `metadata`. Preserva a linha do tempo.

#### `order_payments`

`id`, `organization_id`, `order_id`, `method`, `status`, `amount`, `paid_at`, `external_reference`, timestamps. Não armazenar dados de cartão.

### 4.4 Auxiliares, governança e preferências

#### `notifications`

`id`, organização, destinatário, tipo, entidade relacionada, título, mensagem, `read_at`, metadata, timestamps.

#### `organization_settings`

Timezone, moeda, comissão padrão, regras de convite/estoque, configuração futura da loja online.

#### `user_preferences`

Última janela temporal do Painel, modo grade/lista de Revendedoras e preferências de UI. Nunca usar para fatos de negócio.

#### `audit_events`

Ator, ação, entidade, antes/depois JSONB, request ID, metadata, timestamps. Não substituir o histórico específico de pedido.

#### `idempotency_keys`

Organização, request, operação, referência de resposta, criação e expiração. Impede duplicidade de mutações críticas.

### 4.5 Dados derivados e views

Não persistir números do Painel como fatos editáveis. Criar views/funções:

| View/função | Resultado |
|---|---|
| `v_dashboard_sales_summary` | vendas e quantidade no intervalo |
| `v_dashboard_sales_history` | total e quantidade por dia/mês |
| `v_dashboard_active_resellers` | membros ativos, incluindo registro direto sem convite |
| `v_customer_ltv` | pedidos, total e última compra |
| `v_product_inventory` | saldo disponível |

Pedidos cancelados ficam fora das métricas de venda e total, conforme a regra operacional atual. O intervalo customizado deve validar `from <= to`; “todo o tempo” omite limite inicial.

---

## 5. Plano de Supabase Auth

### 5.1 Fluxo final de cadastro e login

1. Usuário acessa cadastro/login.
2. Frontend chama `supabase.auth.signUp`, `signInWithPassword`, OTP ou provider aprovado.
3. Supabase Auth cria/recupera `auth.users` e emite sessão JWT.
4. Trigger ou rotina idempotente cria `profiles`.
5. Onboarding cria ou aceita uma `organization`.
6. `organization_members` associa o perfil ao tenant com papel contextual.
7. Backend valida a sessão e consulta os memberships permitidos.
8. RLS usa `auth.uid()` e funções de membership para filtrar linhas.
9. Frontend recebe estado de sessão via listener e invalida caches no login/logout.

### 5.2 Onboarding da gestora

A primeira conta deve criar uma organização com nome, slug, timezone `America/Sao_Paulo` e moeda BRL. O primeiro membro recebe `owner`. A UI não deve considerar um usuário autenticado “pronto” antes de existir profile e membership.

### 5.3 Onboarding da revendedora

Há dois fluxos:

- **Registro direto:** gestora cria profile/membership e `reseller_profiles` com `invite_status = not_invited`; `is_active = true` conforme a regra já aprovada.
- **Convite:** gestora cria token hash e convite pendente; a revendedora acessa link, cria/associa sua conta Supabase Auth, o backend valida o token, cria membership, marca accepted e invalida o convite.

Não permitir que um convite aceite crie um segundo profile quando já existir identidade com o mesmo e-mail; a operação deve ser idempotente e exigir confirmação do vínculo.

### 5.4 Migração de usuários Manus

O Manus `openId` deve ser guardado temporariamente como `auth_subject_legacy`. Como a aplicação atual não fornece senha migrável no `localStorage`, não inventar credenciais nem tentar copiar senha. Usar um dos fluxos:

1. Importar somente identidades cujo provedor ofereça dados compatíveis e hashes suportados.
2. Criar usuários Supabase confirmados quando houver prova de posse do e-mail.
3. Enviar magic link ou exigir redefinição de senha.
4. Manter tabela de correspondência `legacy_auth_subject → supabase_user_id` até concluir a reconciliação.

A migração pode ser rolling, reduzindo downtime, ou one-off, mais simples porém com novo login para todos. A escolha deve considerar o número de usuários reais, disponibilidade de e-mail e necessidade de continuidade.

### 5.5 Sessões e logout

Remover manipulação manual de cookies Manus após o cutover. Usar `onAuthStateChange`, refresh de sessão e logout Supabase. O backend deve rejeitar JWT expirado e nunca confiar em papel vindo somente do frontend. A revogação de acesso deve atualizar membership e, se necessário, invalidar sessões por política operacional.

---

## 6. RLS e autorização

### 6.1 Princípio

Toda tabela no schema exposto precisa de RLS. Grants e policies devem ser configurados juntos; policy não revoga grant automaticamente. O papel `service_role` ignora RLS e ficará exclusivamente server-side.

### 6.2 Funções auxiliares

Criar funções SQL seguras, com `search_path` controlado:

- `current_profile_id()` retorna `auth.uid()`;
- `is_org_member(org_id uuid)` verifica membership ativo;
- `has_org_role(org_id uuid, roles member_role[])` verifica owner/manager;
- `can_manage_orders(org_id uuid)` separa gestora de revendedora;
- `can_read_private_cost(org_id uuid)` restringe custo-base.

Evitar repetir joins complexos em cada policy sem teste. Funções devem ser pequenas, determinísticas e cobertas por testes de policy.

### 6.3 Matriz de acesso

| Recurso | Owner/Manager | Revendedora | Anônimo |
|---|---|---|---|
| profiles próprios | CRUD limitado | CRUD limitado | nenhum |
| organization/member | CRUD | leitura do próprio vínculo | nenhum |
| products públicos | CRUD | leitura | somente futuro showInStore público |
| private costs | leitura/escrita | nenhum | nenhum |
| collections | CRUD | leitura conforme catálogo | nenhum |
| customers | CRUD conforme regra | próprios/permitidos | nenhum |
| orders | CRUD/status da organização | criar/ler próprios conforme regra | nenhum |
| audit events | leitura restrita | nenhum | nenhum |
| notifications | próprias | próprias | nenhum |

### 6.4 Proteções complementares

RLS não substitui validações Zod, constraints, autorização tRPC, rate limit de convite, verificação de e-mail, logs e segregação de secrets. Não expor `SUPABASE_SERVICE_ROLE_KEY` nem em variáveis `VITE_*`.

---

## 7. Plano de migração end-to-end

### Fase 0 — aprovação e congelamento

**Entrada:** plano aprovado, projeto Supabase correto, decisão de e-mail/Auth, backup local.  
**Ações:** congelar mudanças estruturais do domínio; documentar contagens esperadas; definir timezone, slug, papéis, políticas de cancelamento e retenção.  
**Saída:** checklist assinado e ambiente de staging disponível.

### Fase 1 — projetos e ambientes

Criar/confirmar projetos Supabase separados para staging e produção. Inicializar `supabase/`, vincular project ref e capturar schema existente com `db pull` se houver alterações já feitas no Dashboard. A partir daí, mudanças devem passar por migrations versionadas. Configurar CI para testar migrations localmente e aplicar em staging antes de produção.

### Fase 2 — schema base

Criar migrations em ordem:

1. extensões, tipos e funções auxiliares;
2. profiles, organizations e members;
3. reseller profiles/invites e customers;
4. products, costs, media, variations, tags e collections;
5. orders, items, payments e status history;
6. inventory movements;
7. notifications, preferences, settings, audit e idempotency;
8. views/funções do Painel;
9. grants, RLS e testes de policies.

Aplicar localmente com reset/rebuild e verificar schema gerado.

### Fase 3 — Storage

Criar bucket privado para imagens de catálogo. Definir path por organização/produto. Upload passa pelo backend ou por signed upload autorizado; `product_media` recebe apenas o path e metadados. Não armazenar bytes em Postgres. URLs públicas somente para itens explicitamente `show_in_store` no futuro.

### Fase 4 — Auth e perfil

Implementar cliente Supabase Auth, provider de sessão, callback, recuperação de senha, cadastro e logout. Criar trigger/rotina idempotente de profile. Adaptar `useAuth` para o novo contrato. Adicionar onboarding que bloqueia telas operacionais até existir membership.

### Fase 5 — camada de domínio backend

Substituir helpers Drizzle de dados de negócio por repositórios Supabase. Manter tRPC e contratos semânticos. Cada mutation deve:

1. validar input;
2. resolver usuário/organização;
3. verificar autorização;
4. iniciar transação/RPC quando houver várias tabelas;
5. aplicar idempotência;
6. escrever auditoria/histórico;
7. invalidar cache;
8. retornar DTO sanitizado.

Pedidos detalhados devem criar itens e movimentos de estoque atomicamente. Venda geral cria item sintético, não baixa produto. Status e cancelamento devem preservar histórico.

### Fase 6 — adaptador do frontend

Criar hooks/repositories para leitura remota. Manter `localStore` apenas como camada de migração/fallback temporário, não como gravação primária. Remover seeds e dados demonstrativos. Adaptar:

- Painel para views/funções de métricas;
- Catálogo para produtos/media/costs/collections;
- Pedidos para orders/items/customers/payments;
- Revendedoras para members/reseller_profiles/invites;
- notificações para tabela remota;
- filtros e modos de visualização para preferências opcionais.

### Fase 7 — exportação e transformação local

Gerar um export JSON versionado do `localStorage` por conta. Não sobrescrever o arquivo original. Validar:

- quantidade de usuários, produtos, clientes, coleções, revendedoras, pedidos e notificações;
- IDs duplicados;
- datas inválidas;
- valores negativos;
- pedidos sem itens;
- produtos com imagem local/URL inválida;
- custos privados ausentes;
- referências de produto/cliente/revendedora inexistentes.

Gerar relatório de rejeitados e não descartar silenciosamente nenhum registro.

### Fase 8 — migração de dados

Migrar em ordem de dependência: profiles → organizations → members → reseller profiles/invites → customers → products → costs/media → tags/variations/collections → orders → items → payments/history → inventory → notifications/preferences/audit. Preservar IDs em `legacy_id` quando necessário, criar snapshots e registrar cada lote em tabela de migration runs.

### Fase 9 — reconciliação

Comparar origem e destino por contagem, soma financeira, IDs, hashes de campos críticos e relações. Conferir manualmente uma amostra de cada tipo de pedido, incluindo venda geral, pedido com revendedora, cliente, cancelado e item sem produto atual.

### Fase 10 — dual-read e canário

Para uma organização de teste, escrever no Supabase e ler do Supabase. Manter o store antigo somente para comparação. Validar login, logout, troca de senha, convite, cadastro direto, produto, coleção, cliente, pedido, cancelamento, métricas e upload.

### Fase 11 — cutover gradual

Liberar por feature flag/organização. Primeiro owner interno, depois gestora real, depois revendedora. Monitorar erros de Auth, RLS, latência, duplicidade e divergência de métricas. Expandir somente após critérios de aceite.

### Fase 12 — encerramento do legado

Desabilitar escritas de negócio no localStore. Manter export imutável para auditoria e recuperação pelo período definido. Remover dependências Manus Auth da aplicação somente após a janela de rollback expirar.

---

## 8. Impactos por camada

### 8.1 Frontend

| Arquivo/área | Mudança |
|---|---|
| `useAuth` | trocar contexto Manus por sessão Supabase; estados loading/error/session |
| `localStore` | tornar adaptador de migração/cache temporário, não fonte primária |
| `ManagerDashboard` | consumir métricas remotas e filtros por datas |
| `ResellerDashboard` | consumir catálogo e pedidos autorizados |
| `CatalogSection` | CRUD remoto, Storage e custos privados segregados |
| `ResellersSection` | members, profiles e invites remotos |
| modal de pedidos | mutation transacional e atualização otimista somente com rollback |
| notificações | query/mutation remota e `read_at` |
| roteamento | proteger rotas pela sessão e membership, não por flag local |

### 8.2 Backend

Substituir `ctx.user.openId` como único escopo por `ctx.auth.userId` + resolved organization. Adicionar cliente Supabase server-side, repositórios, RPCs transacionais, validação de claims, auditoria, idempotência e DTOs sem dados privados. Remover `payload` como fonte primária, mantendo-o apenas durante a transição.

### 8.3 UX

O usuário deve perceber continuidade: login persistente, feedback de salvamento, estados de sincronização, erro recuperável e indicação clara quando uma sessão expirou. Não mostrar “salvo” antes da confirmação do Supabase. Em falha de rede, preservar o formulário, não criar registro local silencioso e oferecer tentar novamente.

### 8.4 Storage e cache

Imagens usam upload autorizado e metadados no banco. Query cache deve ser invalidado depois de mutations. Não guardar tokens, custos ou dados financeiros sensíveis em localStorage. O cache pode guardar dados não sensíveis por curto prazo, mas deve ser limpo no logout/troca de usuário.

---

## 9. Testes e validação

### 9.1 Testes de banco/RLS

Criar usuários de teste owner, manager, reseller, usuário de outra organização e anon. Validar select/insert/update/delete por tabela. Testar que revendedora não acessa custo-base, organização alheia, pedido alheio ou dados de auditoria.

### 9.2 Testes de Auth

Cobrir cadastro, confirmação, login, logout, sessão renovada, sessão expirada, recuperação de senha, usuário duplicado, convite expirado, convite usado duas vezes e revogação de membership.

### 9.3 Testes de migração

Cobrir transformação determinística, rerun idempotente, relatório de rejeitados, preservação de IDs/snapshots, valores monetários, timezone e relações. Rodar migração duas vezes e provar que não duplica dados.

### 9.4 Testes de domínio

Cobrir produto/custo privado, coleção, cliente, revendedora direta, convite, venda detalhada, venda geral, pagamento, status, cancelamento, estoque, comissão, filtros temporais e métricas.

### 9.5 Testes de integração/UI

Validar desktop/mobile, teclado, estados loading/error/empty, card de pedido, seletor de catálogo, filtros do Painel, upload, troca de sessão e redirecionamento de rota protegida. Nenhum teste visual substitui os testes Vitest/RLS.

### 9.6 Observabilidade

Registrar request ID, usuário, organização, operação, duração, erro sanitizado e referência de auditoria. Nunca registrar tokens, senha, service role, custo-base em logs de revendedora ou PII completa sem necessidade.

---

## 10. Rollout, rollback e recuperação

### 10.1 Rollout

| Gate | Condição de avanço |
|---|---|
| G0 | decisão de Auth e credenciais válidas |
| G1 | migrations reproduzíveis em local/staging |
| G2 | RLS testado por papel e tenant |
| G3 | dados migrados e reconciliados |
| G4 | Auth canário funcionando |
| G5 | CRUD e pedidos canário funcionando |
| G6 | Painel reproduzindo métricas |
| G7 | cutover ampliado sem erros críticos |
| G8 | legado somente leitura e encerramento aprovado |

### 10.2 Rollback de aplicação

Manter feature flag para voltar a uma versão anterior do frontend/backend. Não fazer rollback destrutivo de schema sem migration reversa. Se o Supabase estiver indisponível antes do cutover total, bloquear novas escritas com mensagem clara e preservar formulários em memória da sessão; não reativar escrita local concorrente automaticamente.

### 10.3 Rollback de dados

Migrations devem ser aditivas sempre que possível. Para erro de transformação, corrigir o transformador e rerodar lote idempotente. Para dados incorretos já publicados, usar audit trail e scripts compensatórios; não apagar tabelas inteiras. Manter backup/export antes do cutover.

### 10.4 Rollback de Auth

Durante a janela rolling, manter mapeamento Manus→Supabase e comunicação clara de login. Se a autenticação Supabase falhar, permitir somente fluxo de recuperação planejado, nunca duas sessões gravando o mesmo domínio sem regra de precedência. Após desligar Manus, rollback de Auth exige restaurar versão da aplicação e confirmar que as identidades Supabase continuam preservadas.

---

## 11. Ordem exata de execução futura

1. Confirmar projeto Supabase correto e corrigir o 401 atual.
2. Confirmar domínio, e-mail transacional, providers e estratégia de senha/OTP.
3. Criar staging e configurar secrets por ambiente.
4. Inicializar Supabase CLI e capturar schema remoto, se houver.
5. Criar migrations base, enums, funções e RLS.
6. Gerar tipos TypeScript a partir do schema.
7. Implementar cliente server/browser e sessão Supabase.
8. Implementar profile, organização e onboarding.
9. Implementar repositórios e procedures protegidas.
10. Implementar Storage e mídia.
11. Implementar catálogo, coleções e custos privados.
12. Implementar clientes, revendedoras e convites.
13. Implementar pedidos, itens, pagamentos, estoque e histórico.
14. Implementar notificações, auditoria e idempotência.
15. Implementar views/funções do Painel.
16. Criar exportador e transformador do localStore.
17. Migrar staging e reconciliar.
18. Executar testes de Auth, RLS, domínio, migração e UI.
19. Fazer canário por organização.
20. Fazer cutover gradual.
21. Desligar escritas locais e Manus Auth após janela de segurança.
22. Documentar operação, backup, monitoramento e recuperação.

---

## 12. Critérios de pronto

A migração só estará pronta quando o usuário puder entrar com Supabase Auth, recuperar sessão, acessar apenas sua organização, cadastrar/editar produto, visualizar custo somente como gestora, criar coleção, registrar revendedora direta ou por convite, cadastrar cliente, criar venda detalhada ou geral, controlar pagamento/status/estoque, consultar Painel filtrado e receber notificações sem depender de localStorage.

Além disso, todas as migrations deverão ser reproduzíveis; RLS deverá ser validado por papel; dados migrados deverão bater com o relatório de origem; pedidos históricos deverão manter snapshots; não poderá haver duplicidade em reruns; secrets deverão estar segregados; e o rollback documentado deverá ser executável em staging.

---

## 13. Aprovações e fornecimentos pendentes

| Item | Necessário antes de implementar |
|---|---:|
| URL correta do projeto Supabase | sim; a última validação retornou 401 |
| `SUPABASE_ANON_KEY`/publishable key correta | sim |
| `SUPABASE_SERVICE_ROLE_KEY` correta | sim, server-side/migração |
| `SUPABASE_PROJECT_REF` | recomendado |
| projeto staging separado | recomendado; obrigatório antes do cutover |
| método de login | aprovar password, magic link/OTP e providers |
| configuração SMTP | necessária para confirmação, recovery e convites |
| decisão sobre usuários existentes | importação assistida, redefinição ou convite |
| export do localStorage | necessário para migrar dados reais |
| política de retenção/privacidade | necessária antes de produção |
| janela de migração | necessária para definir rolling vs one-off |
| aprovação do DDD e dos enums | obrigatória antes da primeira migration |

**Bloqueio atual:** as credenciais configuradas anteriormente retornaram HTTP 401 no endpoint REST. Não iniciar migration, importação de usuários ou alteração do provedor enquanto URL/chaves não forem confirmadas no projeto correto.

---

## Referências oficiais

[1]: https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0 — Supabase, estratégia de migração de provedor Auth, importação de usuários e metadados.

[2]: https://supabase.com/docs/guides/deployment/database-migrations — Supabase, migrations versionadas, `db pull`, `db reset`, `db push` e histórico de schema.

[3]: https://supabase.com/docs/guides/deployment/managing-environments — Supabase, ambientes separados, CI/CD e secrets de deploy.

[4]: https://supabase.com/docs/guides/database/postgres/row-level-security — Supabase, RLS, grants, policies, `auth.uid()` e service role.

[5]: https://supabase.com/docs/guides/auth — Supabase, Auth, JWT e integração com Postgres/RLS.

[6]: https://www.postgresql.org/docs/current/ddl-constraints.html — PostgreSQL, constraints, chaves e integridade referencial.
