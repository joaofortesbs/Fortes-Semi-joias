# Referências externas — Plano mestre Supabase

## Supabase Auth migration

URL: https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0

Pontos usados: migração de Auth é uma operação de alto impacto; estratégias rolling e one-off têm trade-offs de downtime, dupla manutenção e necessidade de novo login. O fluxo geral é exportar dados do provedor antigo e importar no Supabase Auth. Para usuários com senha, a documentação recomenda abordagem híbrida/rolling quando aplicável; o Admin API pode criar usuários com `password_hash`, `email_confirm` e metadados. Supabase Auth usa `auth.users` e `auth.identities`; `raw_user_meta_data` é para dados que o usuário pode atualizar, enquanto `raw_app_meta_data` é apropriado para metadados não editáveis como controle de acesso. Dados volumosos devem ficar em tabelas próprias, não em metadata do JWT.

## Supabase database migrations

URL: https://supabase.com/docs/guides/deployment/database-migrations

Pontos usados: migrations devem ser versionadas em `supabase/migrations`; mudanças remotas não devem ser feitas diretamente pelo Dashboard após adoção de migrations, pois quebram o histórico. O fluxo recomendado é criar migration, aplicar/testar localmente, fazer `db reset`, e então `db push`. O histórico aplicado fica em `supabase_migrations.schema_migrations`. `db pull` é o caminho para capturar alterações remotas existentes antes de continuar. CI/CD e staging separado são recomendados para produção.

## Supabase environments

URL: https://supabase.com/docs/guides/deployment/managing-environments

Pontos usados: manter projetos separados de staging e produção; usar GitHub Actions/CI para aplicar migrations; guardar token, project ID e database password como secrets criptografados; testar migrations em ambiente local/staging antes da release.

## Supabase RLS

URL: https://supabase.com/docs/guides/database/postgres/row-level-security

Pontos usados: toda tabela exposta no schema público deve ter RLS habilitado; grants e policies são camadas separadas; policies não revogam grants automaticamente. `service_role` ignora RLS e deve permanecer server-side. `auth.uid()` retorna null sem autenticação, portanto policies devem testar autenticação explicitamente. RLS pode usar `auth.uid()` e funções auxiliares para isolamento por tenant.

## Supabase Auth overview

URL: https://supabase.com/docs/guides/auth

Pontos usados: Supabase Auth usa JWTs e integra com Postgres/RLS; dados de domínio devem se relacionar com `auth.users`, normalmente por uma tabela pública de perfil/membros.

## PostgreSQL constraints

URL: https://www.postgresql.org/docs/current/ddl-constraints.html

Pontos usados: utilizar `NOT NULL`, `CHECK`, `UNIQUE`, PKs e FKs para garantir integridade; constraints são preferíveis a validações apenas na aplicação para regras estruturais.
