# Carteira Econômica IA

Plataforma profissional de diagnóstico e planejamento financeiro pessoal. A V1 já nasce como um cockpit financeiro: painel executivo, score de saúde financeira, diagnóstico por regras, cartões, faturas, parcelas futuras, importação Excel, plano de ação, simulação e PDF executivo.

## Tecnologias

- React + TypeScript + Vite
- Chart.js / react-chartjs-2 para BI visual
- read-excel-file para leitura local de Excel e parser CSV simples para extratos
- jsPDF + AutoTable para relatório executivo
- Supabase Auth, Postgres, Funções de borda (Edge Functions) e RLS
- Lucide React para iconografia de produto

## Rodar localmente

```bash
npm install
npm run dev
```

Compilação de produção:

```bash
npm run build
```

## Supabase

1. Crie um projeto no Supabase.
2. Execute o schema em `supabase/schema.sql`.
3. Copie `.env.example` para `.env.local`.
4. Preencha:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

O app agora exige Supabase configurado para operar como produto. Sem as variáveis `.env.local`, ele exibe uma tela de configuração obrigatória em vez de usar dados demo.

## Módulos entregues

- Painel executivo com KPIs, score, risco e projeção
- Acesso, cadastro, confirmação por e-mail via Supabase, redefinição de senha, controle de sessão e logout
- Proteção de acesso: dados carregados apenas para `auth.uid()` do usuário logado
- Cadastro financeiro inicial quando o usuário ainda não possui perfil
- Serviços Supabase em `src/services/*` para Auth, perfil, transações, cartões, faturas, parcelas, importações, diagnósticos, planos e relatórios
- Receitas e despesas classificadas por essencialidade
- Módulo de cartões com limite, fatura, vencimento, crescimento e risco
- Faturas e parcelas futuras com visão mês a mês
- Importador Excel/CSV com lote em `import_batches`, mapeamento, validação, duplicidade e persistência
- Diagnóstico financeiro por regras técnicas
- Plano de ação priorizado por impacto e prazo
- Metas financeiras e alertas inteligentes
- Simulador de corte mensal e renda extra
- Relatório PDF com leitura executiva
- Schema Supabase com tabelas, enums, índices, auditoria, qualidade de dados, logs de IA e RLS por usuário
- Estrutura inicial de IA em `src/ai/*` e funções de borda em `supabase/functions/*`

## Conceito visual

O conceito de referência gerado para a direção visual está em:

`docs/concepts/dashboard-concept.png`

## Roteiro recomendado

1. Conectar Auth Supabase e persistência real por usuário.
2. Salvar importações, transações, cartões, faturas e diagnósticos no Postgres.
3. Criar funções de borda para classificação automática, diagnóstico e relatórios.
4. Adicionar IA classificadora, IA diagnóstica, IA consultora e IA de simulação.
5. Implementar o corpo real das funções de borda com chamada ao modelo de IA e logs em `ai_logs`.
6. Separar jsPDF e o parser de Excel em chunks com importação dinâmica.
7. Adicionar planos, assinatura, painel administrativo e limites de uso.
8. Publicar no GitHub e fazer deploy na Vercel.

## Compilação em outro sistema operacional

Se o projeto for copiado entre Windows/Linux/macOS com `node_modules`, reinstale dependências no destino:

```bash
rmdir /s /q node_modules
npm install
npm run build
```
