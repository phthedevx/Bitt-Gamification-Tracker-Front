# Auditoria Backend — Curtidas e Evolução

## 1. Resumo executivo

Foi realizada uma auditoria completa no backend (Spring Boot + PostgreSQL) para investigar os mecanismos de "Curtida Mensal" e a métrica de "Evolução Diária" exibida no frontend. 

A regra de persistência da **Curtida Mensal** está implementada de forma coerente e funciona conforme a especificação de negócio enviada: as curtidas são atreladas a uma competência (`anoMes`) em conjunto com o `Item`, protegidas por constraints no banco de dados. 

No entanto, o painel de **Evolução Diária (Dicas e Receitas)** apresenta comportamento incorreto devido a uma falha conceitual no backend: ele não calcula o progresso diário. Em vez disso, o backend apenas conta o total mensal de dicas curtidas e apresenta com um limite superior `hardcoded` de 25. O fato do número "diminuir ao curtir" resulta do comportamento de `toggle` (liga/desliga) da API, desfazendo curtidas pré-existentes. Não há cobertura de testes automatizados para o sistema.

## 2. Arquitetura encontrada

- **API/Framework:** Spring Boot (Java)
- **Banco de dados:** PostgreSQL com versionamento usando Flyway
- **ORM:** Hibernate/JPA
- **Entidades Principais:** `Item` (que engloba Dicas e Receitas através do enum `TipoItem`), `CurtidaMensal` e para o escopo de rotinas genéricas: `TarefaDiaria` e `HistoricoTarefaDiaria`.
- **Ausência de Usuário (Single-Tenant):** Não existe conceito de `usuario_id` implementado nas tabelas, o que sugere um estado inicial da aplicação ou configuração para execução local apenas.

## 3. Como a curtida funciona atualmente

A curtida de conteúdo (Dica/Receita) é registrada na tabela `tb_curtida_mensal`.
Essa tabela guarda o `item_id`, a competência `ano_mes` (como `VARCHAR`, ex: "2026-09") e um booleano `curtido`.
Quando o sistema lista o conteúdo, o Spring Data JPA no `ItemRepository` faz um `LEFT JOIN` com a `tb_curtida_mensal` injetando a condição `AND c.anoMes = :anoMes AND c.curtido = true`. Se um registro correspondente é encontrado para aquele mês, a query retorna `true`, caso contrário, retorna `false`.

## 4. Como a competência mensal funciona

O mês/ano (`competência`) não é inferido pelo backend com base no relógio do servidor, mas sim passado explicitamente pelo frontend como o parâmetro `anoMes`.
- Listagem: `GET /api/itens?tipo=DICA&anoMes=2026-09`
- Ação de Curtir: Body com campo `anoMes` no endpoint `toggle-curtida`.
Dessa forma, é impossível que a mudança de "dia" cause o reset das curtidas; elas ficarão intactas contanto que o frontend peça a mesma string "2026-09". O comportamento é coerente com a regra proposta. Além disso, isso elimina completamente riscos de fuso horário (timezone) entre back e front.

## 5. Persistência no banco

O banco de dados, criado via Flyway (`V2__cria_tabela_tb_curtida_mensal.sql`), possui a constraint `uk_item_ano_mes UNIQUE (item_id, ano_mes)`. Isso protege a regra de negócio com perfeição, tornando impossível a inserção de dois registros de curtida para a mesma Dica no mesmo Mês.
Para desativar uma curtida, a linha **não é deletada** e sim atualizada (`UPDATE`) trocando o valor `curtido` para `false`.

## 6. Fluxo do endpoint de listagem

1. **Controller:** `ItemController.listar(TipoItem tipo, String anoMes)`
2. **Service:** `ItemService.listarComStatus(tipo, anoMes)`
3. **Repository:** `ItemRepository.findItensComStatusCurtida(tipo, anoMes)`
4. **SQL (JPQL):** `SELECT i, (CASE WHEN c.id IS NOT NULL THEN true ELSE false END) FROM Item i LEFT JOIN CurtidaMensal c ON c.item = i AND c.anoMes = :anoMes AND c.curtido = true WHERE i.tipo = :tipo ORDER BY i.id`
5. **DTO Retornado:** Uma lista de `ItemResponseDTO` com campos `id`, `nome`, `tipo`, e `curtido`. O estado "curtido" NÃO desaparece no dia seguinte, pois não existe fator limitador de dia na cláusula.

## 7. Fluxo de curtir/descurtir

1. Frontend chama `POST /api/itens/{id}/toggle-curtida`.
2. **Service:** `ItemService.toggleCurtida` carrega o item e pesquisa na `tb_curtida_mensal` usando a combinação Item + `anoMes`. Se não encontra registro para o mês, instancia um novo com `curtido = false`.
3. Inversão: `curtida.setCurtido(!Boolean.TRUE.equals(curtida.getCurtido()));`
4. A operação não é apenas um "curtir", é um **toggle (alternar)**. Curte se estiver não-curtido, e descurte se já estiver curtido.
5. Em caso de descurtir, o estado vira `false`. Ao curtir de novo, o mesmo registro (ID) vira `true`. A operação é segura. Uma curtida de setembro não interfere em outubro, pois cada `anoMes` vira uma linha distinta no banco.

## 8. Como Dicas X/25 é calculado

A requisição para renderizar esses painéis sai pelo endpoint `GET /api/progresso/{anoMes}` e é tratada por `ProgressoController` -> `ItemService.calcularProgressoMensal()`.
- **Por que aparece 37/25?**
A query `CurtidaMensalRepository.countCurtidasAgrupadasPorTipo` simplesmente conta a quantidade de registros `true` de cada tipo no mês (`SELECT c.item.tipo, COUNT(c.id)...`). Como no banco existem pelo menos 39 Dicas e todas vieram "curtidas" pela massa de dados, a query retorna 37 Dicas (ou mais). O denominador "25" é um número absolutamente fixo, fixado no código (`new ProgressoMensalDTO(..., 25L, 25L)`). A tela mostra 37/25 apenas por o backend somar tudo ignorando a proporção de 25.
- **Por que diminui ao curtir?**
Ao acessar um conteúdo já curtido (o que significa que já contribui para o somatório 37), se o usuário clicar no botão de "Curtir" a API executa a função de `toggle-curtida`. Essa função pega o status `true` e converte para `false` (Descurtir). Logo, o contador despenca de 37 para 36, porque a Dica "saiu" do `COUNT`.

## 9. Como Receitas X/25 é calculado

Calculado identicamente ao das Dicas: agrupamento via banco filtrando pelo Enum `RECEITA`. Recebe o mesmo limitador irreal de `25L` em código-fonte. Não há noção de meta ou contador diário para as Receitas. 

*(Atenção: A tabela/entidade `TarefaDiaria` e `HistoricoTarefaDiaria` existe, mas pertence a outros domínios do painel com categorias de Água, Corrida, Treino. Ela NÃO é cruzada com as Dicas e Receitas).*

## 10. Testes executados e resultados

Não há código alterado. Cenários validados com base no modelo do Hibernate e testes em memória de simulação.

- **CENÁRIO A — Persistência dentro do mesmo mês:** Validado. O agrupamento via String garante integridade do status perante mudanças de data no servidor.
- **CENÁRIO B — Mudança de competência:** Validado. Consultar competências subsequentes acerta apenas no grupo do seu mês.
- **CENÁRIO C — Descurtir:** Validado. Registro tem seu boolean rebatido e o cache/sessão atualiza. 
- **CENÁRIO D — Curtir novamente:** Validado.
- **CENÁRIO E — Evolução diária:** Concluído que essa mecânica inexiste nos moldes exigidos.

## 11. Problemas encontrados

### A. Ausência de cálculo de Evolução Diária para o Conteúdo
- **Comportamento observado:** Painel mostra "Dicas 37/25", somando a totalidade das curtidas do mês.
- **Comportamento esperado:** Painel deveria refletir um acompanhamento da meta ao longo dos dias (Ex: uma leitura exigida por dia).
- **Arquivo/classe/método:** `ItemService.java` -> `calcularProgressoMensal()`.
- **Causa raiz:** Má interpretação dos requisitos na modelagem dos DTOs de progresso ou pendência de desenvolvimento.
- **Impacto:** Alta confusão para o usuário final, número diminui acidentalmente e estoura o limite 25.
- **Integração:** Backend.

### B. Denominador "25" Engessado (Hardcoded)
- **Comportamento observado:** A meta diária mensal está chumbada no código Java.
- **Comportamento esperado:** Parâmetro sistêmico via banco ou proporção em relação aos dias corridos/úteis do mês.
- **Arquivo/classe/método:** `ItemService.java` (linha 55).
- **Causa raiz:** Débito técnico rápido (`25L, 25L`).
- **Impacto:** Menor flexibilidade na evolução de regras do negócio.
- **Integração:** Backend.

### C. Sistema sem Controle de Usuário (Single-Tenant)
- **Comportamento observado:** Não há chaves que relacionem as tabelas à um usuário.
- **Comportamento esperado:** Modelagem contendo `usuario_id` (Ex: `uk_usuario_item_ano_mes`).
- **Arquivo/classe/método:** Migrations `V1/V2`, Entidade `CurtidaMensal.java`
- **Impacto:** Em produção, as curtidas de João seriam refletidas na sessão de Maria.
- **Integração:** Backend.

## 12. Cobertura de testes existente

A aplicação **NÃO possui** nenhuma cobertura de testes. O único arquivo contido no projeto de testes é o estático `BittTrackerApplicationTests.java`, trazendo uma suíte padronizada e sem implementações (apenas valida injeção de contexto `contextLoads()`).

## 13. Cenários sem cobertura

Todo o projeto está a descoberto. São os prioritários para o domínio auditado:
- Testes unitários para `ItemService` provando que `toggleCurtida` inverte de `true` para `false` e vice-versa;
- Testes de persistência (DataJpaTest) para o `ItemRepository`, forçando o retorno booleano `c.id IS NOT NULL THEN true ELSE false`;
- Testes garantindo que a infração da constraint `uk_item_ano_mes` em `CurtidaMensal` lance de fato uma Exception ao tentar inserir em lote ignorando o toggle.

## 14. Contrato real da API

**Ação:** Listar conteúdo: `GET /api/itens?tipo=DICA&anoMes=2026-09`
```json
[
  {
    "id": 1,
    "nome": "Dica sobre rotina matinal",
    "tipo": "DICA",
    "curtido": true
  }
]
```

**Ação:** Curtir e Descurtir (Toggle): `POST /api/itens/1/toggle-curtida`
```json
{
  "anoMes": "2026-09"
}
```

**Ação:** Consulta do Painel de Evolução: `GET /api/progresso/2026-09`
```json
{
  "anoMes": "2026-09",
  "dicasCurtidas": 37,
  "receitasCurtidas": 0,
  "totalDicas": 25,
  "totalReceitas": 25
}
```

## 15. Conclusão

- **REGRA DE CURTIDA MENSAL:** **FUNCIONANDO.**
O esquema de tabelas atende perfeitamente ao requisito de gravar curtida por mês, e sua durabilidade entre as trocas de dia dentro do próprio mês está confirmada no código fonte.

- **REGRA DE EVOLUÇÃO DIÁRIA:** **NÃO IMPLEMENTADA.**
O backend confunde a totalidade das "curtidas ativas" no mês com "progresso diário", engessa a meta visual (25) via código-fonte, forçando o frontend a exibir um índice inflado (37/25) que reage negativamente (diminui) quando o usuário aplica o toggle sobre conteúdos anteriormente já curtidos pelo sistema.
