# Database Design Document (DDD)
## Fernanda Fortes Semijoias — Persistência externa no Supabase

**Versão:** 1.0 — diagnóstico e desenho, sem migração executada  
**Data:** 19 de agosto de 2026  
**Responsável:** Manus AI  
**Escopo:** mapear os dados atuais da plataforma, propor o modelo relacional no Supabase, definir segurança, integridade, auditoria e estratégia de migração.

> Este documento é um desenho técnico aplicável. Ele não cria tabelas, não altera o banco atual e não configura secrets. A implementação deverá ocorrer somente após a aprovação do modelo e a definição da estratégia de autenticação.

---

## 1. Resumo executivo

A plataforma atual possui quatro seções operacionais oficiais: **Painel, Catálogo, Pedidos e Revendedoras**. O estado de negócio ainda é mantido principalmente em `localStorage`, por meio de `client/src/lib/localStore.ts`, enquanto o backend já possui uma persistência parcial em Drizzle/MySQL para usuários autenticados, custos privados de produtos e uma representação compacta de pedidos.

O principal risco arquitetural atual é haver duas fontes de verdade: o `localStore` contém o catálogo, clientes, revendedoras, coleções, notificações e o modelo completo de pedidos; o backend contém somente parte desses dados. A migração deve transformar o Supabase em **fonte única de verdade dos dados de negócio**, mantendo o frontend como consumidor de consultas e mutações protegidas.

A proposta adota **PostgreSQL do Supabase**, UUIDs, `numeric(12,2)` para valores monetários, timestamps em UTC, `jsonb` apenas para payloads legados/metadados flexíveis, normalização de itens de pedido e coleções, e isolamento por **organização/conta da gestora**. Cada linha operacional deverá possuir `organization_id`, direta ou indiretamente, para permitir RLS e crescimento multi-tenant.

---

## 2. Leitura arquitetural inicial

### 2.1 Estado funcional observado

| Área | Comportamento atual | Dados usados | Persistência atual | Persistência necessária |
|---|---|---|---|---|
| Autenticação | Login/OAuth Manus, sessão local e usuário atual | identidade, papel, nome, e-mail, sessão | Manus Auth + `localStorage`/tabela `users` parcial | Supabase Auth ou estratégia híbrida explicitamente escolhida; perfil e membros da conta no Supabase |
| Painel | Métricas derivadas de pedidos, produtos e revendedoras | vendas, total de pedidos, revendedoras ativas, unidades, histórico e filtros | cálculo em memória a partir do store | não duplicar métricas básicas; consultar dados normalizados e, se necessário, criar views/materialized views |
| Catálogo | CRUD de peças | nome, categoria, preço, estoque, status, imagem, descrição, variações, tags, coleção, showInStore | `localStorage`; custo-base parcialmente em backend | produtos, mídia, variações, tags, coleções, custos privados e histórico de estoque |
| Pedidos | venda detalhada ou venda geral | origem, tipo, revendedora, cliente, itens, total, comissão, pagamento, data, status e histórico | `localStorage`; pedido resumido em tabela backend com `payload` JSON | pedidos e itens relacionais, snapshots, eventos, pagamentos e idempotência |
| Revendedoras | registro direto ou convite, filtros, edição, exclusão e inspeção | nome, cidade, status, link, ativa, comissão | `localStorage` | perfis, membros da organização, perfil de revendedora e convites |
| Clientes | cadastro e seleção em pedidos | nome, telefone, e-mail, timestamps | `localStorage` | clientes por organização, histórico derivado de pedidos e proteção de PII |
| Coleções | agrupamento personalizado de produtos | nome, descrição, IDs de produtos, timestamps | `localStorage` | coleções e tabela de associação N:N |
| Notificações | novas vendas, aprovação e mudança de status | título, mensagem, lido, data | `localStorage` | notificações por usuário/organização |
| Comissões | cálculo embutido no pedido, seção removida da navegação | valor e percentual da comissão | no pedido/localStore | manter no pedido como snapshot; não recriar seção removida |

### 2.2 Fonte de verdade atual

O tipo `Store` atual contém `users`, `customers`, `products`, `orders`, `notifications`, `collections` e `sessionUserId`. O contrato de produto público exclui o `costBase`; esse dado é mantido em metadados privados. O contrato de pedido contém snapshots de nome/contato do cliente, itens com nome/preço/subtotal, comissão, histórico de status e campos legados de leitura.

O backend atual usa `ownerOpenId` como escopo nas tabelas Drizzle existentes. Essa decisão é útil para a fase de transição, mas não é suficiente como modelo definitivo: uma conta de negócio deve existir como entidade própria, e usuários devem ser associados a ela por uma tabela de membros. Isso permite uma futura segunda gestora, administradores, revendedoras vinculadas a mais de uma operação e regras de acesso consistentes.

### 2.3 Decisão de autenticação ainda necessária

Há duas estratégias válidas, que não devem ser misturadas sem decisão explícita:

1. **Supabase como banco, Manus Auth mantido:** o backend continua validando a sessão Manus e traduz `openId` para `profiles.auth_subject`. É a opção de menor risco para a próxima migração.
2. **Supabase Auth como identidade principal:** usuários passam a existir em `auth.users`, com `profiles.id = auth.users.id`, e RLS usa `auth.uid()`. É a opção mais nativa para acesso direto via Supabase e políticas de linha.

Este DDD recomenda **Supabase Auth como destino**, mas a implementação deve começar em modo híbrido/ponte para não interromper os usuários atuais. Supabase Auth fornece JWTs e integra a autenticação com RLS; as políticas devem ser aplicadas no banco, não apenas no frontend [1].

---

## 3. Mapeamento completo de dados atuais

### 3.1 Classificação dos campos

| Classificação | Significado no DDD |
|---|---|
| Obrigatório | necessário para criar a entidade com integridade operacional |
| Opcional | pode ser nulo ou ausente sem invalidar o registro |
| Derivado | calculado a partir de outras tabelas; não deve ser fonte duplicada sem justificativa |
| Snapshot | cópia histórica intencional de um dado que pode mudar depois |
| Sensível | credencial, PII, token, custo privado ou dado que exige RLS restritivo |
| Legado | mantido apenas para compatibilidade com dados já existentes |

### 3.2 Identidade, conta e membros

**Entidades atuais:** `LocalUser`, `sessionUserId`, tabela Drizzle `users` e contexto `ctx.user`.

| Dado atual | Destino sugerido | Classificação | Regra |
|---|---|---|---|
| `id` | `profiles.id` ou `auth.users.id` | obrigatório | UUID estável; preservar o ID quando possível na migração |
| `openId` Manus | `profiles.auth_subject` | opcional/sensível | necessário no modo híbrido; único por provedor |
| `name` | `profiles.full_name` | obrigatório | normalizar espaços |
| `email` | `profiles.email` | obrigatório para login; opcional para registro direto | normalizar lowercase; não duplicar entre identidades |
| `phone` | `profiles.phone` | opcional/PII | armazenar em formato normalizado e exibir mascarado quando necessário |
| `city` | `profiles.city` ou `reseller_profiles.city` | opcional | no modelo final, cidade operacional da revendedora fica no perfil de revendedora |
| `role` | `organization_members.role` | obrigatório | `owner`, `manager`, `reseller`; não depender somente de campo global |
| `password` | Supabase Auth | sensível | nunca migrar senha em texto do `localStore`; exigir redefinição ou fluxo de convite |
| `active` | `organization_members.is_active` | obrigatório | registro direto sem convite pode ser ativo conforme regra de negócio |
| `commissionRate` | `reseller_profiles.commission_rate` | obrigatório com default 0 | percentual entre 0 e 100 |
| `createdAt` | `profiles.created_at` | obrigatório | UTC |
| `lastSignedIn` | `profiles.last_signed_in_at` | opcional | origem do backend atual |
| `loginMethod` | `profiles.login_method` | opcional | histórico do provedor de login |
| `sessionUserId` | sessão do provedor | derivado | não persistir como estado de negócio na organização |

### 3.3 Revendedoras e convites

A aplicação trata a revendedora como um usuário especializado. No modelo externo, separar identidade, associação à organização e dados comerciais reduz acoplamento.

| Campo | Destino | Classificação |
|---|---|---|
| nome | `profiles.full_name` | obrigatório |
| cidade | `reseller_profiles.city` | obrigatório no registro atual |
| telefone/e-mail | `profiles.phone`, `profiles.email` | opcional/PII |
| status ativo | `organization_members.is_active` | obrigatório |
| status do convite | `reseller_invites.status` e estado derivado do membro | obrigatório |
| link de convite | não armazenar link puro; armazenar `token_hash` e gerar URL no momento de uso | sensível |
| data de criação | `organization_members.created_at` | obrigatório |
| percentual de comissão | `reseller_profiles.commission_rate` | obrigatório |
| visualização grade/lista | preferência de usuário, opcional | derivado de UX |
| busca/filtros | estado de UI, opcional | não é dado operacional |

**Regra importante:** revendedora registrada diretamente, com `invite_status = not_invited`, deve contar como ativa para o Painel se `organization_members.is_active = true` ou se a regra operacional aprovada considerar todo registro direto ativo. Convites pendentes não devem ser contados como membros ativos até a regra de ativação definida.

### 3.4 Clientes

| Campo atual | Destino | Classificação |
|---|---|---|
| `id` | `customers.id` | obrigatório |
| `name` | `customers.full_name` | obrigatório |
| `phone` | `customers.phone` | obrigatório no fluxo atual/PII |
| `email` | `customers.email` | opcional/PII |
| `createdAt` | `customers.created_at` | obrigatório |
| `updatedAt` | `customers.updated_at` | obrigatório |
| quantidade de pedidos | view/consulta | derivado |
| total comprado/LTV | view/consulta | derivado; não salvar como valor manual |
| último pedido | view/consulta | derivado |

A unicidade atual é lógica por nome + telefone. No Supabase, usar índice único funcional ou coluna normalizada `phone_normalized`, combinada com `organization_id`, para evitar que clientes de organizações diferentes colidam.

### 3.5 Produtos e catálogo

| Campo atual | Destino | Classificação |
|---|---|---|
| `id` | `products.id` | obrigatório |
| `name` | `products.name` | obrigatório |
| `category` | `products.category` ou `categories.name` | obrigatório no fluxo atual |
| `price` | `products.sale_price` | obrigatório |
| `stock` | `products.stock_on_hand` ou razão por movimentos | obrigatório na transição; derivável no futuro |
| `status` | `products.status` | obrigatório; `available/unavailable` |
| `accent` | `products.accent_color` | opcional, apresentação |
| `imageUrl` | `product_media.storage_key/public_url` | opcional; arquivo fora do banco |
| `description` | `products.description` | opcional |
| `variations` | `product_variations` e `variation_options` | opcional |
| `showInStore` | `products.show_in_store` | obrigatório com default false |
| `tags` | `tags` + `product_tags` | opcional |
| `collection` | `collection_products` | opcional, normalizado |
| `createdAt`/`updatedAt` | `products.created_at`/`updated_at` | obrigatório |
| `costBase` | `product_private_costs.cost_base` | sensível; nunca no payload público |

**Estoque:** para a primeira migração, preservar `stock_on_hand`. Para produção, recomenda-se criar `inventory_movements` e derivar o saldo, evitando perda de rastreabilidade em vendas, cancelamentos e ajustes manuais.

### 3.6 Coleções

| Campo | Destino | Classificação |
|---|---|---|
| `id` | `collections.id` | obrigatório |
| `name` | `collections.name` | obrigatório |
| `description` | `collections.description` | opcional |
| `productIds` | `collection_products.product_id` | obrigatório na associação |
| `createdAt`/`updatedAt` | respectivas colunas | obrigatório |
| quantidade de peças | view/contagem do join | derivado |

A coleção é N:N por desenho, mesmo que o modelo atual permita um único `product.collection`. Isso permite que uma peça participe de uma campanha, uma linha sazonal e uma curadoria sem duplicação.

### 3.7 Pedidos e vendas

O pedido é a principal entidade financeira/operacional. Deve deixar de depender de `payload` JSON como fonte principal.

| Campo atual | Destino | Classificação |
|---|---|---|
| `id` | `orders.id` | obrigatório |
| `requestId` | `idempotency_keys.request_id` ou `orders.request_id` | obrigatório para operações idempotentes |
| `origin` | `orders.origin` | obrigatório; `direct/reseller` |
| `entryType` | `orders.entry_type` | obrigatório; `detailed/general` |
| `resellerId` | `orders.reseller_member_id` | opcional conforme origem |
| `customerId` | `orders.customer_id` | opcional |
| `customerName`/`customerContact` | `orders.customer_name_snapshot`/`customer_phone_snapshot` | snapshot legado/histórico |
| `items` | `order_items` | obrigatório em venda detalhada; item sintético em venda geral |
| `total` | `orders.total_amount` | obrigatório |
| `commission` | `orders.commission_amount` | snapshot derivado no momento da venda |
| `commissionRate` | `orders.commission_rate` | snapshot |
| `status` | `orders.status` | obrigatório |
| `paymentMethod` | `orders.payment_method` | obrigatório |
| `paymentStatus` | `orders.payment_status` | obrigatório |
| `saleDate` | `orders.sale_date` | obrigatório |
| `notes` | não expor no novo fluxo; `orders.legacy_notes` se houver dado legado | legado/sensível |
| `proofReference` | não expor no novo fluxo; `orders.legacy_proof_reference` se necessário | legado |
| `createdAt`/`updatedAt` | respectivas colunas | obrigatório |
| `history` | `order_status_history` | obrigatório para rastreabilidade |

**Venda geral:** deve usar `entry_type = general`, preservar `manual_description` e criar um `order_item` sintético com `product_id = null`, `item_type = general`, nome/descrição e preço unitário igual ao valor total. Não deve baixar estoque de produto.

**Pedido detalhado:** usa itens reais, baixa estoque, preserva nome e preço do produto no momento da venda e relaciona o produto por FK quando ainda existir.

### 3.8 Itens de pedido

Campos necessários: `id`, `order_id`, `product_id` opcional, `item_type`, `product_name_snapshot`, `unit_price`, `quantity`, `subtotal`, `created_at`. `product_id` pode ser nulo para venda geral ou para produto removido posteriormente. O snapshot é obrigatório para preservar a leitura histórica mesmo que o nome ou preço do catálogo mude.

### 3.9 Pagamentos

O fluxo atual armazena um método e uma situação de pagamento diretamente no pedido. Para preservar o comportamento atual sem bloquear evolução, manter esses campos em `orders` na primeira fase e criar `order_payments` como tabela preparada para múltiplos pagamentos. A primeira migração poderá inserir no máximo um pagamento por pedido.

Campos preparados: `id`, `organization_id`, `order_id`, `method`, `status`, `amount`, `paid_at`, `external_reference` opcional e timestamps. `external_reference` não deve receber dados de cartão ou segredo.

### 3.10 Histórico e eventos

O `history` atual registra status, instante e, opcionalmente, quem realizou a alteração. Isso deve virar `order_status_history` com `from_status`, `to_status`, `changed_by`, `changed_at` e `metadata`.

Para rastreabilidade ampla, criar `audit_events` com organização, ator, ação, entidade, ID da entidade, antes/depois em JSONB, request ID, IP opcional protegido e timestamp. O log não deve substituir o histórico de domínio; ele complementa o histórico de negócio.

### 3.11 Notificações

Campos atuais: `id`, `title`, `message`, `read`, `createdAt`. O modelo externo deve incluir `organization_id`, `recipient_user_id`, `type`, `entity_type`, `entity_id`, `title`, `message`, `read_at`, `created_at` e `metadata`. O booleano `read` pode ser derivado de `read_at IS NOT NULL`.

### 3.12 Painel e filtros

As métricas atuais são derivadas e não devem ser armazenadas como números editáveis:

| Métrica | Fonte |
|---|---|
| Vendas registradas | soma de `orders.total_amount` não cancelados no intervalo |
| Total de pedidos | contagem de pedidos não cancelados no intervalo |
| Revendedoras ativas | membros com papel revendedora e regra de ativação satisfeita |
| Unidades disponíveis | produtos disponíveis com estoque positivo; futuramente saldo de inventário |
| Histórico de vendas | agregação temporal dos pedidos por `sale_date` |
| Pedidos recentes | ordenação de pedidos válidos por `sale_date` |
| LTV de cliente | soma de pedidos válidos agrupados por `customer_id` |

O filtro temporal atual aceita `1m`, `6m`, `12m`, `all` e `custom(from,to)`. Ele é estado de apresentação. Pode ser salvo em `user_preferences` para reabrir a última escolha, mas o resultado deve sempre ser recalculado a partir dos pedidos.

---

## 4. Regras de modelagem e integridade

### 4.1 Multi-tenant

A unidade de isolamento é `organizations`. A conta da gestora é a organização inicial. Todas as entidades de negócio devem carregar `organization_id`, exceto `profiles` e tabelas puramente ligadas a `auth.users`.

A associação entre pessoa e organização fica em `organization_members`. A mesma pessoa pode ser membro de uma ou mais organizações no futuro, e o papel é contextual à organização. Revendedora é uma especialização do membro, não um segundo usuário duplicado.

### 4.2 Cardinalidades principais

| Relação | Cardinalidade |
|---|---|
| Organização → membros | 1:N |
| Perfil → membros | 1:N potencial |
| Membro revendedora → pedidos | 1:N |
| Organização → produtos | 1:N |
| Produto → custo privado | 1:0..1 por organização |
| Organização → coleções | 1:N |
| Coleção ↔ produto | N:N |
| Organização → clientes | 1:N |
| Cliente → pedidos | 1:N opcional |
| Pedido → itens | 1:N |
| Pedido → histórico de status | 1:N |
| Pedido → pagamentos | 1:N, inicialmente 0..1 |
| Produto → mídia | 1:N |
| Usuário → notificações | 1:N |

### 4.3 Enums recomendados

Usar enums PostgreSQL ou tabelas de referência se os valores precisarem ser administráveis. Para a primeira versão, enums são adequados para: `member_role`, `invite_status`, `product_status`, `order_origin`, `order_entry_type`, `order_status`, `payment_method`, `payment_status`, `audit_action` e `media_kind`.

### 4.4 Constraints de negócio

1. `products.sale_price >= 0`, `products.stock_on_hand >= 0`, `commission_rate BETWEEN 0 AND 100`.
2. `orders.total_amount >= 0`, `orders.commission_amount >= 0`, `orders.commission_rate BETWEEN 0 AND 100`.
3. Pedido com `origin = reseller` exige `reseller_member_id` pertencente à mesma organização.
4. Pedido com `origin = direct` deve ter `reseller_member_id IS NULL`.
5. Pedido detalhado exige pelo menos um item real; venda geral exige descrição e valor positivo.
6. Item detalhado exige `product_id IS NOT NULL`; item geral exige `product_id IS NULL` e `item_type = general`.
7. `order_items.quantity > 0`, `unit_price >= 0` e `subtotal >= 0`.
8. `request_id` deve ser único por organização para impedir duplicidade de criação.
9. Nome de produto deve ser único por organização, com comparação normalizada.
10. Nome de coleção deve ser único por organização.
11. Associação coleção-produto deve ser única por par.
12. Chaves estrangeiras devem usar `ON DELETE RESTRICT` para pedidos e itens; produto removido deve ser soft delete ou manter FK nula, nunca apagar o histórico.
13. Dados financeiros devem usar `numeric(12,2)`, nunca `float`.
14. Todos os timestamps de persistência devem ser `timestamptz` em UTC.

PostgreSQL recomenda constraints explícitas para limitar valores, unicidade e integridade referencial; elas devem ser preferidas a validações exclusivamente no cliente [2].

---

## 5. Database Design Document — tabelas propostas

### 5.1 `profiles`

**Objetivo:** espelhar dados de apresentação e identidade da pessoa autenticada.

| Coluna | Tipo sugerido | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK, FK `auth.users(id)` | destino recomendado |
| `auth_subject` | text | sim | UNIQUE por provedor | compatibilidade Manus Auth |
| `full_name` | text | não | índice opcional trigram | nome atual |
| `email` | citext | sim | índice único se aplicável | e-mail normalizado |
| `phone` | text | sim | índice opcional | PII |
| `login_method` | text | sim | — | origem da autenticação |
| `last_signed_in_at` | timestamptz | sim | — | telemetria operacional |
| `created_at` | timestamptz | não | — | default now |
| `updated_at` | timestamptz | não | — | trigger de atualização |

### 5.2 `organizations`

**Objetivo:** representar a conta/operação da gestora.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK | identificador tenant |
| `name` | text | não | — | Fernanda Fortes Semijoias |
| `slug` | text | não | UNIQUE | URL/chave amigável futura |
| `owner_profile_id` | uuid | não | FK profiles | gestora principal |
| `timezone` | text | não | — | default `America/Sao_Paulo` |
| `currency` | char(3) | não | CHECK BRL inicialmente | moeda da operação |
| `created_at` | timestamptz | não | — | — |
| `updated_at` | timestamptz | não | — | — |

### 5.3 `organization_members`

**Objetivo:** associação contextual entre perfis e contas.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK | — |
| `organization_id` | uuid | não | FK; índice | tenant |
| `profile_id` | uuid | não | FK; índice | pessoa |
| `role` | member_role | não | índice composto | owner/manager/reseller |
| `is_active` | boolean | não | índice parcial | regra do Painel |
| `created_at` | timestamptz | não | — | — |
| `updated_at` | timestamptz | não | — | — |

Constraint: UNIQUE (`organization_id`, `profile_id`).

### 5.4 `reseller_profiles`

**Objetivo:** dados comerciais específicos da revendedora.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `member_id` | uuid | não | PK/FK organization_members | deve apontar para role reseller |
| `city` | text | não | índice por organização/cidade | campo atual obrigatório |
| `commission_rate` | numeric(5,2) | não | CHECK 0–100 | default 0 |
| `invite_status` | invite_status | não | índice | not_invited/pending/accepted/expired |
| `created_at` | timestamptz | não | — | — |
| `updated_at` | timestamptz | não | — | — |

### 5.5 `reseller_invites`

**Objetivo:** representar convites sem armazenar token puro.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK | — |
| `organization_id` | uuid | não | FK/índice | — |
| `member_id` | uuid | sim | FK | pode ser pré-convite |
| `email` | citext | sim | índice | se houver |
| `token_hash` | text | não | UNIQUE | nunca guardar token puro |
| `status` | invite_status | não | índice | — |
| `expires_at` | timestamptz | sim | índice | — |
| `accepted_at` | timestamptz | sim | — | — |
| `created_by` | uuid | não | FK profiles | gestora |
| `created_at` | timestamptz | não | — | — |

### 5.6 `customers`

**Objetivo:** cadastro persistente e reutilizável de clientes.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK | — |
| `organization_id` | uuid | não | FK/índice | tenant |
| `full_name` | text | não | índice opcional | — |
| `phone` | text | não | — | PII |
| `phone_normalized` | text | não | UNIQUE composto | deduplicação |
| `email` | citext | sim | — | PII |
| `created_at` | timestamptz | não | — | — |
| `updated_at` | timestamptz | não | — | — |
| `deleted_at` | timestamptz | sim | índice parcial | soft delete |

### 5.7 `products`

**Objetivo:** catálogo operacional público da organização.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK | — |
| `organization_id` | uuid | não | FK/índice | tenant |
| `name` | text | não | UNIQUE composto normalizado | — |
| `name_normalized` | text | não | índice único | — |
| `category` | text | não | índice | — |
| `description` | text | sim | — | — |
| `sale_price` | numeric(12,2) | não | CHECK >= 0 | — |
| `stock_on_hand` | integer | não | CHECK >= 0 | saldo de transição |
| `status` | product_status | não | índice | available/unavailable |
| `accent_color` | text | sim | — | apresentação |
| `show_in_store` | boolean | não | índice parcial | default false |
| `created_at` | timestamptz | não | — | — |
| `updated_at` | timestamptz | não | — | — |
| `deleted_at` | timestamptz | sim | índice parcial | soft delete |

### 5.8 `product_private_costs`

**Objetivo:** armazenar custo-base isolado para a gestora.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `organization_id` | uuid | não | FK/índice | — |
| `product_id` | uuid | não | FK | — |
| `cost_base` | numeric(12,2) | não | CHECK >= 0 | nunca retornar para revendedora |
| `created_at` | timestamptz | não | — | — |
| `updated_at` | timestamptz | não | — | — |

PK composta (`organization_id`, `product_id`).

### 5.9 `product_media`

**Objetivo:** guardar metadados de imagens; bytes ficam no Storage, não no PostgreSQL. O banco deve salvar `storage_bucket`, `storage_path`, `public_url` quando aplicável, MIME, tamanho e ordem. Essa separação segue o padrão de guardar a referência no banco e os bytes no storage [3].

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK | — |
| `organization_id` | uuid | não | FK/índice | — |
| `product_id` | uuid | não | FK/índice | — |
| `kind` | media_kind | não | — | primary/gallery |
| `storage_bucket` | text | não | — | Supabase Storage |
| `storage_path` | text | não | UNIQUE | — |
| `mime_type` | text | não | — | image/* |
| `byte_size` | bigint | sim | CHECK >= 0 | — |
| `sort_order` | integer | não | — | default 0 |
| `created_at` | timestamptz | não | — | — |

### 5.10 `collections` e `collection_products`

`collections`: `id uuid PK`, `organization_id uuid FK`, `name text NOT NULL`, `name_normalized text NOT NULL`, `description text`, `created_at`, `updated_at`, `deleted_at`. Índice UNIQUE (`organization_id`, `name_normalized`).

`collection_products`: `collection_id uuid FK`, `product_id uuid FK`, `created_at`; PK composta (`collection_id`, `product_id`). Usar `ON DELETE CASCADE` somente nesta tabela de associação.

### 5.11 `product_variations`, `product_variation_options`, `tags` e `product_tags`

`product_variations`: `id`, `organization_id`, `product_id`, `name`, `sort_order`, timestamps.  
`product_variation_options`: `id`, `variation_id`, `label`, `sort_order`, timestamps.  
`tags`: `id`, `organization_id`, `name`, `name_normalized`, UNIQUE por organização.  
`product_tags`: PK composta (`product_id`, `tag_id`).

Essa normalização representa o contrato atual `variations: { name, options[] }` e `tags?: string[]` sem perder a capacidade de busca e edição futura.

### 5.12 `orders`

**Objetivo:** entidade transacional principal.

| Coluna | Tipo | Nulo | Chave/índice | Observação |
|---|---|---:|---|---|
| `id` | uuid | não | PK | preservar IDs locais quando válidos |
| `organization_id` | uuid | não | FK/índice | tenant |
| `created_by_profile_id` | uuid | não | FK | ator da criação |
| `reseller_member_id` | uuid | sim | FK/índice | obrigatório se origin reseller |
| `customer_id` | uuid | sim | FK/índice | — |
| `origin` | order_origin | não | índice | direct/reseller |
| `entry_type` | order_entry_type | não | índice | detailed/general |
| `status` | order_status | não | índice composto | — |
| `payment_method` | payment_method | não | — | — |
| `payment_status` | payment_status | não | índice | — |
| `sale_date` | timestamptz | não | índice composto | filtro do Painel |
| `manual_description` | text | sim | — | venda geral |
| `total_amount` | numeric(12,2) | não | CHECK >= 0 | — |
| `commission_amount` | numeric(12,2) | não | CHECK >= 0 | snapshot |
| `commission_rate` | numeric(5,2) | não | CHECK 0–100 | snapshot |
| `customer_name_snapshot` | text | sim | — | legado/histórico |
| `customer_phone_snapshot` | text | sim | — | legado/PII |
| `legacy_payload` | jsonb | sim | GIN apenas se necessário | compatibilidade temporária |
| `request_id` | uuid/text | sim | UNIQUE composto | idempotência |
| `created_at` | timestamptz | não | — | — |
| `updated_at` | timestamptz | não | — | — |
| `cancelled_at` | timestamptz | sim | — | — |

Índices prioritários: (`organization_id`, `sale_date DESC`), (`organization_id`, `status`), (`organization_id`, `reseller_member_id`, `sale_date DESC`), (`organization_id`, `customer_id`, `sale_date DESC`).

### 5.13 `order_items`

`id uuid PK`, `order_id uuid FK`, `product_id uuid FK NULL`, `item_type text NOT NULL`, `product_name_snapshot text NOT NULL`, `unit_price numeric(12,2)`, `quantity integer`, `subtotal numeric(12,2)`, `created_at`.  
CHECKS: `quantity > 0`, valores não negativos, `item_type = general` exige `product_id IS NULL`, `item_type = product` exige `product_id IS NOT NULL`.

### 5.14 `order_status_history`

`id uuid PK`, `organization_id uuid FK`, `order_id uuid FK`, `from_status order_status NULL`, `to_status order_status`, `changed_by_profile_id uuid FK`, `changed_at timestamptz`, `metadata jsonb`. Índice (`order_id`, `changed_at`).

### 5.15 `order_payments`

`id uuid PK`, `organization_id uuid FK`, `order_id uuid FK`, `method payment_method`, `status payment_status`, `amount numeric(12,2)`, `paid_at timestamptz`, `external_reference text NULL`, `created_at`, `updated_at`. Não armazenar PAN, CVV ou credenciais de gateway.

### 5.16 `inventory_movements`

Tabela recomendada para a segunda etapa de estoque, mas já prevista no DDD: `id`, `organization_id`, `product_id`, `order_id NULL`, `movement_type` (`sale`, `cancellation`, `manual_adjustment`, `initial_balance`), `quantity_delta`, `reason`, `created_by`, `created_at`. O saldo poderá ser uma view agregada. A migração inicial pode preencher apenas `initial_balance` e movimentos de pedidos posteriores.

### 5.17 `notifications`

`id uuid PK`, `organization_id uuid FK`, `recipient_profile_id uuid FK`, `type text`, `entity_type text NULL`, `entity_id uuid NULL`, `title text`, `message text`, `read_at timestamptz NULL`, `metadata jsonb`, `created_at`. Índice (`recipient_profile_id`, `read_at`, `created_at DESC`).

### 5.18 `organization_settings` e `user_preferences`

`organization_settings`: conta, timezone, moeda, percentual padrão de comissão, regras de estoque, política de convite e configurações futuras de loja. Deve ter uma linha por organização.

`user_preferences`: organização, usuário, preferências de Painel, última janela temporal, modo grade/lista de Revendedoras, densidade visual e filtros não sensíveis. Essas informações são preferências, não fatos de negócio.

### 5.19 `audit_events`

`id uuid PK`, `organization_id uuid FK`, `actor_profile_id uuid NULL`, `action text`, `entity_type text`, `entity_id uuid NULL`, `request_id text NULL`, `before_data jsonb NULL`, `after_data jsonb NULL`, `metadata jsonb`, `created_at`. Índices por organização/data e entidade. Retenção deve ser definida antes da produção.

### 5.20 `idempotency_keys`

`organization_id`, `request_id`, `operation`, `response_reference`, `created_at`, `expires_at`, com PK/UNIQUE (`organization_id`, `request_id`, `operation`). É mais flexível que depender somente do ID do pedido e protege reenvios de criação, upload e mutações futuras.

---

## 6. Views e consultas do Painel

Não persistir cards como números manuais. Criar views ou funções SQL protegidas:

1. `v_dashboard_sales_summary`: soma e contagem por organização e janela.
2. `v_dashboard_sales_history`: agregação por dia/mês, com `period_label`, `order_count`, `sales_total`.
3. `v_dashboard_active_resellers`: membros ativos com regra de registro direto sem convite.
4. `v_customer_ltv`: pedidos válidos por cliente, quantidade, total e última compra.
5. `v_product_inventory`: saldo atual e estoque disponível.

A função de consulta deve receber `organization_id` implicitamente pelo usuário autenticado e `from_date`, `to_date`. Para todo o período, omitir o limite inicial; para personalizado, validar `from <= to`. Pedidos cancelados ficam fora das métricas de vendas e total de pedidos, conforme o comportamento atual.

---

## 7. Segurança e RLS

RLS deve estar habilitado em toda tabela exposta no schema público. A documentação oficial do Supabase destaca que RLS deve ser combinado com Auth e que grants e policies são camadas diferentes; portanto, a migração deverá revogar grants excessivos, conceder apenas o necessário e criar políticas testadas [1].

### Políticas de alto nível

| Papel | Pode ler | Pode escrever |
|---|---|---|
| Gestora/owner | todos os dados da própria organização, inclusive custos privados | catálogo, coleções, clientes, pedidos, revendedoras, configurações |
| Revendedora | catálogo público, próprios pedidos, próprio perfil, clientes permitidos conforme regra | próprios pedidos; nunca custo-base; sem alterar estoque diretamente |
| Anônimo | landing e conteúdo explicitamente público | nada |
| Service role | operações server-side de migração/administrativas | somente backend seguro; nunca expor no browser |

As policies devem resolver a organização do usuário por uma função segura, por exemplo `current_user_organization_ids()`, baseada em `auth.uid()` e `organization_members`. Para Manus Auth em modo híbrido, o backend deve fazer a tradução de `openId` para um UUID interno e não expor service role no cliente.

Acesso a `product_private_costs` deve exigir papel owner/manager. Acesso a `audit_events` deve ser somente de gestores autorizados. Convites devem expor apenas dados necessários e nunca o hash/token em consultas públicas.

---

## 8. Estratégia de persistência e migração

### Fase 0 — decisão e preparação

Aprovar o modelo, decidir entre manter Manus Auth ou migrar para Supabase Auth, configurar projeto separado de staging e definir timezone/slug da organização inicial. Não executar migração diretamente em produção.

### Fase 1 — schema e segurança

Criar migrations versionadas para enums, tabelas, índices, constraints, triggers de `updated_at`, funções de escopo e RLS. Testar policies com usuários owner, manager, reseller e anon. Grants e policies devem ser versionados juntos [1].

### Fase 2 — camada de compatibilidade

Criar adaptador server-side com contratos equivalentes a `getStore`, `createProduct`, `createOrder`, `updateOrderStatus`, `createCustomer`, `createReseller` e CRUD de coleções. O frontend não deve acessar Supabase diretamente de forma espalhada; o tRPC deve continuar como contrato principal durante a transição.

### Fase 3 — exportação e transformação

Exportar o `localStorage` atual por usuário/conta para um JSON versionado. Validar contagens, duplicidades, IDs e datas. Transformar:

- `users` em `profiles`, `organizations`, `organization_members` e `reseller_profiles`;
- `products` em `products`, `product_media`, variações, tags e associações;
- `privateProductMeta` e `private_product_costs` em custos privados por organização;
- `collections.productIds` em `collections` + `collection_products`;
- `customers` em clientes por organização;
- `orders.items` em `orders` + `order_items` + `order_status_history`;
- `notifications` em notificações por destinatário;
- `sessionUserId` em sessão do provedor, nunca em tabela de negócio.

### Fase 4 — dual-read controlado

Por um período curto, escrever no Supabase e manter leitura local como fallback somente para recuperação. Comparar hashes/contagens entre fontes. Não permitir que duas fontes escrevam o mesmo registro sem idempotência.

### Fase 5 — cutover

Ativar leitura do Supabase para uma conta interna, validar criação de produto, pedido detalhado, venda geral, cancelamento, revendedora direta, convite, cliente, coleção e métricas. Depois ampliar progressivamente. Desativar escrita no `localStorage` após a confirmação.

### Fase 6 — saneamento

Manter `legacy_payload` e snapshots pelo tempo de retenção definido; depois remover campos temporários em migration posterior. Não apagar dados financeiros nem pedidos históricos para “limpar” o modelo.

---

## 9. Riscos e decisões de migração

| Risco | Impacto | Mitigação |
|---|---|---|
| Senhas no localStore | crítico | não migrar texto; exigir redefinição/convite |
| IDs locais não UUID | alto | preservar como `legacy_id` e gerar UUID estável quando necessário |
| Custos privados em memória | alto | recuperar somente backend; marcar ausentes como pendentes de revisão |
| Pedido resumido no backend | alto | usar localStore como fonte de migração apenas após reconciliação |
| Produto apagado com pedido histórico | alto | soft delete e snapshots de item |
| Duplicidade entre contas | médio | impor `organization_id` em todas as constraints |
| RLS incompleto | crítico | testes automatizados por papel e ambiente staging |
| Uploads apontando para URLs temporárias | médio | migrar para Storage e salvar `storage_path` |
| Datas sem timezone | médio | converter e registrar a origem; usar `timestamptz` |
| Mudança de Auth | alto | iniciar com ponte Manus→profile ou executar migração de identidade planejada |
| Métricas duplicadas | médio | calcular por views/functions; não importar cards como fatos |

---

## 10. Critérios de aceite da próxima fase

A implementação da integração só será considerada pronta quando:

1. nenhuma tabela operacional puder receber dados sem `organization_id` aplicável;
2. owner/manager/reseller/anon forem isolados por RLS e testes de policy;
3. cadastro/edição de produto, custo privado, coleção, cliente, revendedora e pedido funcionarem via tRPC;
4. venda geral por revendedora persistir `reseller_member_id`;
5. pedido detalhado persistir itens, snapshots, estoque e histórico;
6. cancelamento registrar evento e reverter estoque sem duplicação;
7. idempotência impedir pedidos duplicados;
8. Painel reproduzir os totais atuais para as mesmas datas;
9. nenhum custo-base ou token de convite aparecer em payload de revendedora;
10. migração produzir relatório de contagem por entidade, rejeições e registros pendentes;
11. testes Vitest cobrirem contratos, transformação e autorização;
12. o ambiente de staging for validado antes do cutover de produção.

---

## 11. Informações, secrets e acessos necessários para a próxima fase

Conforme solicitado, estes dados **não foram configurados nesta etapa**. Para implementar a próxima fase, serão necessários:

| Item | Obrigatório | Uso | Observação de segurança |
|---|---:|---|---|
| `SUPABASE_URL` | sim | URL do projeto Supabase | pode ser pública no cliente, mas será cadastrada via configuração segura |
| `SUPABASE_ANON_KEY` ou publishable key | sim | cliente/browser com RLS | nunca substitui as policies |
| `SUPABASE_SERVICE_ROLE_KEY` | sim para migração/backend | operações server-side e migração controlada | nunca deve ir para `VITE_*` nem para o browser |
| `SUPABASE_PROJECT_REF` | recomendado | CLI/migrations e identificação do projeto | não é segredo, mas evita apontar para o projeto errado |
| URL de staging | recomendado | validação isolada | pode ser o mesmo projeto em schema separado, preferencialmente projeto separado |
| Decisão de autenticação | sim | manter Manus Auth ou migrar para Supabase Auth | esta é uma decisão arquitetural, não uma secret |
| Redirect URLs/Auth providers | se migrar Auth | login, convite e recuperação | configurar no painel Supabase |
| Export do localStorage | sim para migrar dados atuais | arquivo JSON por conta/usuário | enviar somente por canal seguro; contém PII |
| Política de retenção | recomendado | auditoria, notificações e dados pessoais | definir antes de produção |

**Não envie `SUPABASE_SERVICE_ROLE_KEY` em mensagem comum.** Quando você confirmar a estratégia de autenticação, as credenciais devem ser cadastradas pelo mecanismo seguro de secrets do projeto. A próxima ação recomendada é fornecer primeiro a decisão: **(A) manter Manus Auth e usar Supabase apenas como banco; ou (B) migrar a identidade para Supabase Auth**.

---

## Referências

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security — Supabase, “Row Level Security”. Consulta sobre RLS, Auth, grants, policies e proteção por linha.

[2]: https://www.postgresql.org/docs/current/ddl-constraints.html — PostgreSQL Documentation, “Constraints”. Consulta sobre NOT NULL, CHECK, UNIQUE, chaves e integridade relacional.

[3]: https://supabase.com/docs/guides/storage — Supabase, “Storage”. Consulta sobre separação entre arquivos armazenados e metadados de aplicação.

[4]: https://supabase.com/docs/guides/auth — Supabase, “Auth”. Consulta sobre autenticação, JWT e integração com RLS.
