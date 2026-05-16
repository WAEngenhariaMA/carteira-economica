# Product Spec - Carteira Economica IA

## Posicionamento

Carteira Economica IA e uma plataforma de inteligencia financeira pessoal. O produto interpreta dados financeiros baguncados e transforma em decisao: risco, diagnostico, plano de acao, simulacao e relatorio.

## Camadas

### Entrada de dados

- Lancamento manual de receitas, despesas, cartoes, faturas, parcelas, dividas, investimentos e metas.
- Importacao de planilhas Excel, CSV, faturas e extratos.
- Mapeamento assistido de data, descricao, valor, categoria, subcategoria, cartao, banco, parcela, competencia e tipo.
- Validacao antes da gravacao no Supabase.

### Inteligencia financeira

- Classificacao em essencial, importante, superfluo e impulsivo.
- Identificacao de recorrencia, parcelas, dividas renegociaveis e gastos cortaveis.
- Indicadores de renda comprometida, indice de endividamento, peso de cartoes, saldo projetado, economia potencial, capacidade de poupanca e risco futuro.
- Score de saude financeira com niveis: excelente, saudavel, atencao, risco, critico e emergencia.
- Regra 50/30/20 adaptada ao momento financeiro.

### Tomada de decisao

- Diagnostico por regras tecnicas.
- Plano de acao com prioridade, horizonte, dificuldade, status e economia estimada.
- Simulacoes de corte mensal, renda extra, quitacao, renegociacao e congelamento de cartao.
- Alertas de fatura, saldo negativo, categorias estouradas, parcelas futuras e dados incompletos.
- PDF executivo com narrativa consultiva.

## IA planejada

- IA classificadora: categoriza lancamentos e detecta essencialidade.
- IA diagnostica: interpreta indicadores e descreve causa raiz.
- IA consultora: transforma achados em plano de acao.
- IA simuladora: compara cenarios futuros.
- IA de relatorio: redige analise executiva em linguagem profissional.

## Modelo de produto

- Plano gratuito limitado.
- Plano pessoal.
- Plano familia.
- Plano consultor financeiro.
- Plano premium com IA completa e relatorios recorrentes.

## Decisoes tecnicas da V1

- Frontend React com rotas internas protegidas por autenticacao Supabase.
- Dados financeiros carregados via servicos Supabase, filtrados por usuario e competencia.
- Motores financeiros locais em `src/lib/financeEngine.ts`.
- Supabase schema completo em `supabase/schema.sql`.
- PDF gerado no cliente para acelerar validacao.
- Importacao Excel/CSV local com validacao, duplicidade, lote auditavel e persistencia.
- Edge Functions preparadas para IA sem expor chave secreta no navegador.
