# Auditoria completa — Fernanda Semi Joias

**Data da auditoria:** 25 de agosto de 2026  
**Base auditada:** repositório privado [`joaofortesbs/Fortes-Semi-joias`](https://github.com/joaofortesbs/Fortes-Semi-joias), branch `main`, commit de origem `9ef551d`  
**Workspace:** `fernanda-semi-joias-import`  
**Autor:** Manus AI

## 1. Sumário executivo

A base foi clonada com autenticação GitHub gerenciada e integrada ao workspace por um merge explícito de históricos não relacionados. O histórico do repositório de origem permanece disponível no histórico Git local por meio do remoto `fortessource`; a integração foi registrada no commit `b0f5062`.

A plataforma está em um estágio avançado de protótipo funcional: a experiência pública e as principais telas de gestora e revendedora estão implementadas, há regras de domínio para catálogo, clientes, pedidos, estoque, comissão, convites, notificações e transições de status, e existe uma camada inicial de persistência no servidor para custos privados e pedidos. Entretanto, a maior parte da operação comercial ainda usa `localStorage` no navegador, enquanto o backend, Drizzle e Supabase estão parcialmente preparados. Isso significa que a interface parece mais madura do que a fundação operacional necessária para um SaaS multiusuário em produção.

> **Diagnóstico central:** não é seguro tratar a plataforma atual como um sistema comercial definitivo. Ela é adequada para validação de experiência e domínio, mas a próxima evolução deve priorizar uma única fonte de verdade no servidor, autenticação real para os papéis de negócio, isolamento multi-tenant, autorização por organização e trilha de auditoria antes de ampliar a superfície funcional.

A direção visual é coerente com uma marca de semijoias sofisticada: fundo quente, verde profundo, dourado contido, tipografia editorial serifada e composição arejada. A recomendação não é “embelezar” genericamente a aplicação. É transformar essa estética em um sistema de marca mais próprio, carregando sinais de catálogo, peça, relacionamento e inteligência operacional para dentro das telas autenticadas.

## 2. Integração e preservação

A origem foi clonada em `/home/ubuntu/Fortes-Semi-joias-source` e adicionada ao workspace como remoto local `fortessource`. A árvore funcional do repositório foi integrada ao projeto gerenciado. Foram preservados os diretórios `client`, `server`, `shared`, `drizzle`, `supabase`, `docs`, `scripts`, `patches` e a documentação de rollout, além dos commits da origem acessíveis pelo remoto e pelo histórico importado.

O merge exigiu apenas a resolução do arquivo de journal do Drizzle; a versão do repositório auditado foi mantida. O artefato de migração criado pelo scaffold, que não fazia parte da origem, foi removido para evitar duas histórias de migração concorrentes. O backlog desta auditoria foi reincorporado ao `todo.md` sem apagar o histórico documental que já existia no arquivo.

| Evidência | Resultado |
|---|---|
| Repositório privado | Clone concluído via sessão GitHub gerenciada, sem exposição de token |
| Branch de origem | `main` |
| Commit de origem | `9ef551d` |
| Commit de integração | `b0f5062` |
| Remoto de preservação | `fortessource` |
| Arquivos funcionais da origem | 172 arquivos na cópia clonada |
| Estado do workspace | Árvore integrada; documentação e backlog atualizados |

## 3. Inventário técnico

| Camada | Implementação observada | Avaliação |
|---|---|---|
| Frontend | React 19, TypeScript, Vite 7 | Adequado para evolução; a composição ainda concentra telas grandes |
| UI | Tailwind CSS 4, Radix UI, shadcn/ui, Lucide | Bom conjunto de primitives e identidade visual consistente |
| Navegação | Estado de seção em `App.tsx` e `AppShell`, com Wouter disponível | O fluxo autenticado funciona como shell de seções; não há roteamento de URLs de negócio robusto |
| Backend | Express, tRPC 11, camada Manus | Infraestrutura pronta, mas cobertura comercial parcial |
| Estado remoto | TanStack Query/tRPC preparados | Não são a fonte usada pela maioria dos fluxos atuais |
| Persistência local | `client/src/lib/localStore.ts` com `localStorage` | Principal fonte atual de usuários, clientes, produtos, pedidos e notificações |
| Banco relacional | Drizzle com MySQL/TiDB | Schema técnico contém usuários, custos privados e pedidos; cobertura ainda incompleta |
| Supabase | Migração SQL extensa com DDD, RLS e entidades comerciais | Desenho de destino promissor, mas não é a fonte efetiva do frontend atual |
| Autenticação | Fluxo local por e-mail/nome e senha; Manus OAuth preparado no core | Há divergência crítica entre autenticação de protótipo e autenticação de produção |
| Storage | `server/storage.ts` com presign de PUT/GET e proxy `/manus-storage/` | Fundação disponível; não há fluxo de upload comercial completo |
| Testes | Vitest, 11 arquivos, regras e contratos | 66 testes passam fora do teste de credenciais; faltam E2E confiáveis no ambiente atual |
| Build | Vite + esbuild | Passa; bundle inicial acima de 500 kB exige otimização posterior |

As dependências são amplas e incluem bibliotecas que a arquitetura preparada ainda não explora integralmente, como tRPC no frontend, Recharts e primitives de interação. O `package.json` possui configuração `pnpm` embutida que a versão atual do pnpm reporta como ignorada; essa configuração deve ser migrada para o arquivo suportado pela versão adotada, especialmente porque inclui patch e override do Wouter.

## 4. Rotas, telas e componentes

A entrada pública alterna entre `LandingPage` e `AuthPage`. Depois do login local, `AppShell` fornece navegação lateral, perfil, notificações e seleção de seção. A gestora acessa `ManagerDashboard`, com áreas de painel, catálogo, revendedoras e pedidos. A revendedora acessa `ResellerDashboard`, com catálogo disponível, criação de pedidos e acompanhamento do próprio fluxo.

As features mais isoladas estão em `client/src/features/catalog`, `client/src/features/orders` e `client/src/features/resellers`. A aplicação também preserva componentes reutilizáveis de layout, estados vazios, diálogo, mapa, chat e primitives Radix/shadcn. O ponto fraco não é a ausência de componentes; é a fronteira de responsabilidade: `ManagerDashboard`, `ResellerDashboard` e especialmente `localStore.ts` ainda conhecem regras, persistência e efeitos colaterais simultaneamente.

| Área | Cobertura observada | Lacuna principal |
|---|---|---|
| Landing | Proposta de valor, benefícios, como funciona e CTAs | Ainda usa linguagem relativamente genérica e poucos sinais proprietários de marca |
| Cadastro/login | Seleção de gestora/revendedora, campos básicos, aprovação local | Senha e sessão vivem no cliente; não é autenticação de produção |
| Painel | Métricas derivadas, pedidos recentes, histórico e estados vazios | Métricas não são uma visão server-side auditável e dependem do store local |
| Catálogo | Produtos, preço, estoque, status, custo privado, coleções, filtros e visualização | Imagem é apenas referência opcional; não existe galeria/upload/controle de mídia completo |
| Revendedoras | Cadastro, busca, cidade, status de convite, edição e exclusão | Convites não estão apoiados em identidade, organização e autorização persistentes |
| Clientes | Criação e seleção reutilizável em pedido | Entidade existe apenas localmente |
| Pedidos | Venda direta/por revendedora, detalhada/geral, itens, cliente, pagamento, status e histórico | Criação e atualização ainda não são transacionais no fluxo principal |
| Notificações | Eventos locais e marcação de leitura | Não há entrega multiusuário nem persistência efetiva por destinatário |
| Comissões | Cálculo local com taxa da revendedora | Falta registro financeiro imutável e regra server-side |

## 5. Estado e persistência

`localStore.ts` define os tipos `LocalUser`, `Customer`, `Product`, `Collection`, `Order`, `Notification` e seus status. O armazenamento usa a chave `fernanda-fortes-saas-store-v2-real-data`. O código normaliza uma versão legada de produtos e move `costBase` para um mapa privado em memória, o que reduz a exposição visual imediata, mas não oferece proteção real contra inspeção ou alteração no navegador.

A criação de pedido calcula total e comissão, baixa estoque, cria notificação e aplica uma chave de idempotência local por `requestId`. A atualização de status valida uma sequência de estados e recompõe estoque em cancelamento. Essas regras são valiosas como especificação de domínio e estão cobertas por testes, mas a implementação client-side continua manipulável e vulnerável a concorrência, perda de dados, alteração de relógio e divergência entre dispositivos.

No servidor, `server/db.ts` possui helpers para usuário, custo privado e pedidos persistidos. `server/routers.ts` expõe `productPrivate` e `orders` com `adminProcedure`, mas a política técnica `admin` não é equivalente aos papéis de negócio `gestora` e `revendedora`. Além disso, o frontend auditado não está migrado para consumir todos esses procedimentos; existe, portanto, uma ponte parcial entre o protótipo local e o backend.

## 6. Banco, Supabase e autorização

O `drizzle/schema.ts` atual contém `users`, `private_product_costs` e `orders`, com isolamento por `ownerOpenId` nos helpers principais. O SQL em `supabase/migrations/20260819205000_initial_fernanda_fortes.sql` descreve um modelo muito mais completo, incluindo perfis, organizações, memberships, revendedoras, convites, clientes, produtos, mídias, variações, tags, coleções, pedidos, itens, histórico de status, pagamentos, movimentos de estoque, notificações, preferências, auditoria e chaves de idempotência.

A migração Supabase também declara RLS e funções privadas de verificação de pertencimento. Isso é uma boa direção, mas a simples existência da migração não prova que ela está aplicada ao projeto correto nem que o frontend e o servidor estão usando essas tabelas. Nesta auditoria, o teste de conectividade REST retornou HTTP 401. A atualização de credenciais foi recusada; por isso, a integração Supabase permanece **não validada** e não deve ser tratada como pronta.

| Risco | Severidade | Por que importa |
|---|---:|---|
| Senha em `localStorage` | Crítica | Qualquer script com acesso à origem pode ler credenciais; não atende produção |
| Papel e aprovação no cliente | Crítica | O usuário pode alterar o estado local e contornar regras de acesso |
| Ausência de `organizationId` no runtime principal | Crítica | Redes de gestoras não estão isoladas como tenants reais |
| Regras de pedido e estoque no cliente | Alta | Concorrência e adulteração podem gerar estoque e financeiro incorretos |
| Backend comercial parcial | Alta | Procedures não cobrem clientes, produtos, revendedoras e notificações de ponta a ponta |
| Supabase não validado | Alta | Não há prova operacional de que URL, chave e projeto estejam coerentes |
| RLS não testado no ambiente real | Alta | O desenho existe no SQL, mas sua eficácia depende de aplicação e sessão corretas |
| `payload` de pedido amplo | Média | Um JSON sem contrato granular dificulta consultas, auditoria e evolução |

## 7. Arquivos de produtos e comprovantes

A auditoria confirmou necessidade de imagens de produtos: `Product.imageUrl` existe no domínio e o catálogo prevê referência visual. Também existe `Order.proofReference`, mas o roteiro visual explicitamente verifica que o campo de referência de comprovante não aparece no modal atual. Portanto, existe intenção de domínio, não um fluxo entregue de comprovante.

A base possui `server/storage.ts`, que faz presign de upload e download por meio do storage gerenciado. A estratégia correta é manter bytes no storage e somente chave, mime type, tamanho, alt text, ordem e vínculo autorizado no banco. Para comprovantes, o objeto deve ser privado, com acesso mediado por pedido, organização e papel; não se deve colocar a chave em um campo livre exposto ao cliente nem transformar o arquivo em URL pública permanente.

| Arquivo | Situação atual | Decisão recomendada |
|---|---|---|
| Foto de produto | Campo `imageUrl` opcional e representação visual abstrata | Implementar galeria via storage, metadados e fallback somente após fonte de verdade server-side |
| Comprovante de pedido | `proofReference` existe no tipo, mas o fluxo atual o oculta | Criar upload privado associado ao pedido, com autorização por gestora/revendedora e URL temporária |
| Bytes no banco | Não observado | Manter a decisão correta: nunca persistir bytes em coluna relacional |
| Exclusão | Storage não oferece delete direto no helper | Usar remoção de referência e política de retenção; documentar lifecycle e orphan cleanup futuro |

## 8. Validações executadas

A instalação com lockfile passou. O typecheck passou sem erros. O build de produção passou e gerou cliente e servidor empacotados, mas emitiu o aviso de chunk frontend acima de 500 kB. A suíte completa encontrou 67 testes, dos quais 66 passaram e 1 falhou por credencial Supabase: primeiro por variáveis ausentes e, após a configuração segura, por HTTP 401. Excluindo somente esse teste bloqueado, 66 de 66 testes passaram.

A inspeção visual da landing desktop confirmou uma experiência sofisticada, contrastada e responsiva no primeiro viewport. O fluxo de cadastro abriu corretamente e exibiu seleção de perfil, campos básicos, aviso de aprovação de revendedoras e caminho de login. Não foram criadas contas, pedidos ou outros dados artificiais durante a auditoria. Os scripts visuais existentes usam fixtures sintéticos e uma URL de preview fixa, logo não podem ser considerados evidência de validação de produção sem parametrização e isolamento explícito.

| Validação | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | Passou |
| `pnpm check` | Passou |
| `pnpm build` | Passou com aviso de chunk grande |
| `pnpm test` completo | 66 passaram; 1 falhou por Supabase HTTP 401 |
| Testes sem credencial Supabase | 66 passaram |
| Landing desktop | Visualmente aprovada para o estado público auditado |
| Cadastro público | Aberto e inspecionado sem submissão |
| Fluxos autenticados reais | Não concluídos sem criar dados ou credenciais de teste |
| Supabase REST | Não validado; HTTP 401 |

## 9. Backlog priorizado

### P0 — bloqueios de segurança e verdade dos dados

A primeira prioridade é remover senha, sessão, aprovação, estoque, comissão e autorização do `localStorage`. O servidor deve se tornar a fonte de verdade e todas as operações comerciais devem usar procedures protegidas, com validação Zod, transação e autorização por organização. Em paralelo, é necessário confirmar o projeto Supabase correto e decidir formalmente se o runtime definitivo será Supabase ou Drizzle/MySQL/TiDB; manter dois bancos de destino sem um plano de autoridade é uma decisão ruim.

Também é necessário implementar organizações e memberships, mapear `gestora` e `revendedora` para políticas reais, congelar comissão no pedido, persistir histórico de status e emitir auditoria para preço, estoque, aprovação, pedido e comissão. O teste Supabase 401 permanece bloqueado até credenciais públicas válidas serem fornecidas.

### P1 — migração de domínio e confiabilidade operacional

A segunda prioridade é separar `localStore.ts` em adapter temporário, tipos compartilhados, services de domínio, repositories e routers por feature. O domínio de pedidos deve ser executado no servidor com idempotência persistida, baixa/estorno de estoque transacional e contratos de item/pagamento/histórico em tabelas próprias. Clientes, produtos, coleções, revendedoras, notificações e comissões precisam de persistência server-side coerente.

A suíte deve ganhar testes de autorização entre organizações, integração dos routers e E2E parametrizados por ambiente. Os scripts visuais precisam receber a URL por variável, sinalizar fixtures sintéticos e deixar de depender de um preview histórico fixo.

### P2 — arquivos, experiência e performance

Somente depois de P0 e P1, implementar upload de fotos de produtos e comprovantes privados no storage gerenciado. Validar tamanho, MIME, extensão, nome seguro, alt text, ordenação, limites, autorização e URLs temporárias. Adicionar estados de upload, retry, progresso, fallback, lazy loading e tratamento de erro.

Na experiência, manter a paleta creme, verde profundo e dourado discreto, mas tornar a marca mais própria e levar os sinais de catálogo, peça, comissão, pedido e relacionamento para as telas internas. A landing pode ganhar composição editorial assimétrica e linguagem mais específica do mercado. Em performance, dividir o bundle por rota/feature e migrar a configuração `pnpm` para o formato aceito pela versão do gerenciador.

## 10. Critério de prontidão para produção

A plataforma só deve ser considerada pronta para operação real quando uma gestora e uma revendedora puderem usar contas autenticadas de verdade, em dispositivos distintos, com dados isolados por organização; quando pedidos, estoque, comissão, clientes, catálogo e notificações persistirem no backend; quando as regras não puderem ser contornadas pelo navegador; quando RLS/autorização forem testados; quando imagens e comprovantes tiverem storage privado e acesso temporário; e quando build, typecheck, testes, integração e fluxos críticos passarem em um ambiente configurado sem credenciais compartilhadas no código.

Até lá, a recomendação é posicionar a base como **protótipo funcional auditado**, não como sistema financeiro/comercial em produção. Essa distinção é desconfortável, mas evita construir novas camadas sobre uma fonte de verdade insegura.

## Referências internas

[1]: https://github.com/joaofortesbs/Fortes-Semi-joias "Repositório privado Fortes-Semi-joias"
[2]: ./ARQUITETURA_ATUAL_E_MELHORIAS.md "Auditoria arquitetural já existente no repositório"
[3]: ./FLUXO_PEDIDOS_IMPLEMENTACAO.md "Implementação do fluxo de pedidos"
[4]: ./docs/RESULTADO_SCHEMA_SUPABASE.md "Resultado documentado do schema Supabase"
[5]: ./server/storage.ts "Adaptador de storage gerenciado"
[6]: ./client/src/lib/localStore.ts "Store local e regras comerciais atuais"
