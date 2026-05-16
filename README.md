# Carteira Economica IA

Plataforma profissional de diagnostico e planejamento financeiro pessoal. A V1 ja nasce como um cockpit financeiro: dashboard executivo, score de saude financeira, diagnostico por regras, cartoes, faturas, parcelas futuras, importacao Excel, plano de acao, simulacao e PDF executivo.

## Stack

- React + TypeScript + Vite
- Chart.js / react-chartjs-2 para BI visual
- read-excel-file para leitura local de Excel e parser CSV simples para extratos
- jsPDF + AutoTable para relatorio executivo
- Supabase Auth, Postgres, Edge Functions e RLS
- Lucide React para iconografia de produto

## Rodar localmente

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
```

## Supabase

1. Crie um projeto no Supabase.
2. Execute o schema em `supabase/schema.sql`.
3. Copie `.env.example` para `.env.local`.
4. Preencha:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

O app agora exige Supabase configurado para operar como produto. Sem as variaveis `.env.local`, ele exibe uma tela de configuracao obrigatoria em vez de usar dados demo.

## Modulos entregues

- Dashboard executivo com KPIs, score, risco e projecao
- Login, cadastro, confirmacao por e-mail via Supabase, reset de senha, controle de sessao e logout
- Protecao de acesso: dados carregados apenas para `auth.uid()` do usuario logado
- Cadastro financeiro inicial quando o usuario ainda nao possui perfil
- Servicos Supabase em `src/services/*` para Auth, perfil, transacoes, cartoes, faturas, parcelas, importacoes, diagnosticos, planos e relatorios
- Receitas e despesas classificadas por essencialidade
- Modulo de cartoes com limite, fatura, vencimento, crescimento e risco
- Faturas e parcelas futuras com visao mes a mes
- Importador Excel/CSV com lote em `import_batches`, mapeamento, validacao, duplicidade e persistencia
- Diagnostico financeiro por regras tecnicas
- Plano de acao priorizado por impacto e prazo
- Metas financeiras e alertas inteligentes
- Simulador de corte mensal e renda extra
- Relatorio PDF com leitura executiva
- Schema Supabase com tabelas, enums, indices, auditoria, qualidade de dados, logs de IA e RLS por usuario
- Estrutura inicial de IA em `src/ai/*` e Edge Functions em `supabase/functions/*`

## Conceito visual

O conceito de referencia gerado para a direcao visual esta em:

`docs/concepts/dashboard-concept.png`

## Roadmap recomendado

1. Conectar Auth Supabase e persistencia real por usuario.
2. Salvar importacoes, transacoes, cartoes, faturas e diagnosticos no Postgres.
3. Criar Edge Functions para classificacao automatica, diagnostico e relatorios.
4. Adicionar IA classificadora, IA diagnostica, IA consultora e IA de simulacao.
5. Implementar o corpo real das Edge Functions com chamada ao modelo de IA e logs em `ai_logs`.
6. Separar jsPDF e o parser de Excel em chunks com importacao dinamica.
7. Adicionar planos, assinatura, painel administrativo e limites de uso.
8. Publicar no GitHub e fazer deploy na Vercel.

## Build em outro sistema operacional

Se o projeto for copiado entre Windows/Linux/macOS com `node_modules`, reinstale dependencias no destino:

```bash
rmdir /s /q node_modules
npm install
npm run build
```
