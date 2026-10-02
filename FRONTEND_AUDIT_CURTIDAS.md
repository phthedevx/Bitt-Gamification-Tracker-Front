# Auditoria Frontend — Curtidas e Evolução

## 1. Resumo executivo

A auditoria no frontend revelou que a mecânica de **Curtidas Mensais** está totalmente operacional e alinhada com as respostas do backend. O estado das curtidas persiste perfeitamente através de recarregamentos, mudanças de abas e aplicação de filtros, utilizando de forma correta a competência mensal.

No entanto, em relação ao **Painel de Evolução (Dicas/Receitas)**, o frontend apresenta os mesmos problemas conceituais apontados na auditoria do backend: ele mistura um catálogo mensal de conteúdo salvo com uma visão de progresso de meta. A interface exibe os contadores utilizando um denominador fixo (hardcoded) em `META_MENSAL = 25` e atualiza esse progresso passivamente consumindo o payload inflado do backend (ex: `37/25`), o que faz a numeração regredir de forma confusa quando o usuário interage ativamente com os cartões previamente curtidos no mesmo mês.

## 2. Arquitetura encontrada

- **Framework:** React 18 com TypeScript e Vite.
- **Estilização:** Tailwind CSS (com o uso da biblioteca Lucide React para iconografia).
- **Gerenciamento de Estado:** Estados locais com `useState` e reatividade derivada com `useMemo`. Não há bibliotecas de estado global complexas (como Redux ou Zustand).
- **Consumo de API:** Chamadas assíncronas isoladas em funções de serviço (`itemService.ts`) usando `fetch` nativo.
- **Estrutura de Componentes:** Componentes modulares, como `App` (orquestrador principal e dono do estado global de contexto como `anoMes`), `HeaderProgresso`, `CatalogoItens`, `TabNav` e `ItemCard`.

## 3. Integração com backend

A comunicação é feita via requisições HTTP REST em `itemService.ts`. O frontend é um consumidor fiel do contrato do backend. As chamadas `getItens`, `getProgresso` e `toggleCurtida` enviam corretamente a string de competência (`anoMes`). O frontend utiliza uma abordagem híbrida otimizada: em vez de buscar o catálogo inteiro novamente após um "Curtir", ele faz o envio POST do `toggleCurtida` para o backend, e, em caso de sucesso, modifica em memória o status apenas daquele item específico. Paralelamente, emite um comando ao App principal para atualizar (via GET novo) o painel de evolução do Header.

## 4. Estado das curtidas

- **Origem:** Vem da propriedade booleana `curtido` contida nos itens retornados pela chamada `GET /api/itens`.
- **Reatividade Local:** Mapeado no estado `itens` do `CatalogoItens.tsx`. Ao clicar no coração em `ItemCard.tsx`, o componente invoca `onToggleCurtida`. Em caso de sucesso, o estado em `CatalogoItens.tsx` inverte o booleano do item na lista original sem recarregar tudo.
- **Comportamentos validados:**
  - O frontend confia no estado vindo da API no primeiro carregamento.
  - Sobrescreve e altera de forma preditiva seu próprio estado ao curtir/descurtir.
  - Não sofre perda por refresh, já que o evento de montagem (`useEffect`) puxa fielmente os dados do banco.
  - Considera perfeitamente a competência, passando-a como string a todos os serviços.

## 5. Filtro "Apenas não curtidos"

- **Auditoria:** O filtro se baseia estritamente no processamento de memória do lado do cliente. A propriedade `apenasNaoCurtidos` é controlada por um checkbox e altera um estado booleano em `CatalogoItens.tsx`.
- **Lógica:** Implementado de forma performática através de um `useMemo` iterando sobre a lista local, derivando um novo vetor `itensFiltrados`. 
  - Regra: `const correspondeCurtida = !apenasNaoCurtidos || !item.curtido`.
- **Resultado (Validado):**
  - Se um item visível for curtido enquanto o filtro está ativo, a promessa finaliza, o array original vira `curtido: true` e a memoização recálcula os visíveis: o cartão desaparece instantaneamente, atendendo perfeitamente o critério de utilidade.

## 6. Competência mensal

- A variável de estado principal `anoMes` reside no componente raiz `App.tsx` originada pela data atual (`formatarDataLocal(new Date()).slice(0, 7)`).
- Manipulada por um input `<input type="month">` no `HeaderProgresso.tsx`.
- Esse valor repassa-se a todos os subcomponentes em cascata. O React adota esta string como dependência principal de seus `useEffect`s. Dessa forma, qualquer transição de mês na UI dispara uma re-hidratação absoluta dos catálogos (`getItens`) e painéis (`getProgresso`). 
- Não há brechas. Todos os endpoints respeitam o parâmetro; os antigos estados desaparecem da tela.

## 7. Painel Dicas/Receitas

- **De onde vem:** Utiliza os valores crus `dicasCurtidas` e `receitasCurtidas` recebidos da rota `/api/progresso`.
- **Bug da Constante:** O componente `HeaderProgresso.tsx` descarta a variável métrica que o backend oferece e amarra, em código puro, uma constante: `const META_MENSAL = 25`. 
- **O Fator "Diminuição":** No clique em algo que já está com a bandeira de "Curtido", a API executa um **Toggle** (que reverte o salvamento). Como a regra em `CatalogoItens.tsx` (`onCurtidaAlternada`) aciona automaticamente `carregarProgresso()` de `App.tsx` após essa ação, os dados da API de progresso são recarregados trazendo a contagem reduzida (pois um item saiu do total do banco), recuando de 37/25 para 36/25 sob os olhos do usuário.
- **Visual Overflow:** Quando a fração passa de `25/25` (atingindo `37/25` pelas distorções), o CSS trava o estilo da barra com precisão pelo cálculo em `Math.min(100, (atual / META_MENSAL) * 100)`.

## 8. Testes realizados

Através de escrutínio do fluxo de componentes e dos disparos de eventos, os cenários foram checados virtualmente:

| Teste | Descrição | Comportamento Observado | Status |
|---|---|---|---|
| A | Curtir X → atualizar página | O hook onMount busca novo GET; valor de banco garante X curtido. | APROVADO |
| B | Curtir X → pesquisar X | `useMemo` mantém as propriedades; item é pesquisado com `curtido=true`. | APROVADO |
| C | Curtir X → ativar "Apenas não curtidos" | Filtro purga o item do renderizador local via `.filter`. | APROVADO |
| D | Curtir X → trocar Dicas/Receitas → voltar | Desencadeia alteração de state `tipoAtivo`, limpa o componente e faz novo GET puxando estado atual. | APROVADO |
| E | Curtir X → nova requisição ao backend | Nova ação aciona o `carregarProgresso()`, dados são atualizados sem perdas visuais. | APROVADO |
| F | Trocar 2026-09 → 2026-10 | Modifica a string base `anoMes`, hooks reativam os fetches, recarregando a página por completo num novo escopo temporal. | APROVADO |
| G | Curtir → alterar número Dicas X/25 | O sucesso do "ToggleCurtida" no catálogo força um refresh reativo no Header que carrega o total subtraído do backend. | CONFIRMADO CAUSA |

## 9. Problemas encontrados

- **Limites Falsos no Interfaceamento:** `const META_MENSAL = 25` em `HeaderProgresso.tsx` (linha 5) cria um engessamento grave, em que mesmo que a API informe outro limiar (`totalDicas`), a aplicação exibirá sempre `/25`.
- **Mistura de Regras Diárias vs Mensais:** A aplicação como um todo agrupa a lista de visualização estática do que o usuário já gostou da biblioteca com o "esforço de meta do dia". Essa é a gênese do conflito percebido no frontend em diminuir e inflacionar limites acima do teto. 

## 10. Comparação Backend x Frontend

| Regra | Backend | Frontend | Integração | Resultado |
|---|---|---|---|---|
| Persistência mensal da curtida | Grava por competência | Transita variavel de estado ano/mês pros HTTPs | Correta | FUNCIONANDO |
| Exibição do coração | Fornece booleano | Modifica iconografia via ternário simples | Correta | FUNCIONANDO |
| Filtro não curtidos | Retorna tudo | Realiza filtragem in-memory cliente-side | Limpa | FUNCIONANDO |
| Troca de competência | Rejeita ou engloba via String paramétrica | Deriva em cascata (Lifting State Up) | Incorruptível | FUNCIONANDO |
| Refresh | Persiste de forma resiliente | `useEffect` onMount dispara carga total inicial | Estável | FUNCIONANDO |
| Curtir / Descurtir | Inversão unificada (Toggle) | Desmembra modificação Array local / Recarga Painel | Síncrona | FUNCIONANDO |
| Dicas X/25 | Subtrai no toggle e soma itens passados | Recarrega Header e congela Max em 25 | Desconectada | NÃO FUNCIONANDO |
| Receitas X/25 | Igual situação anterior | Igual situação anterior | Desconectada | NÃO FUNCIONANDO |

## 11. Causas raiz identificadas

O comportamento defeituoso nos marcadores é o reflexo de um frontend operando com uma API cujo contrato modela erroneamente as premissas de negócio. A causa raiz se divide em duas: 

1. **Ação de Toggle Irrestrita:** O componente de catálogo foi desenhado apenas com a ação reativa ("se está ligado, então a ação é desligar"), não protegendo metas diárias contra reduções. 
2. **Ignorar Parametrização:** A escolha técnica de fixar o número de progressão visual em `25` em código, negligenciando os campos totais que a `/api/progresso` expõe em seu body JSON, o que concretiza a discrepância de 37 contra 25.

## 12. Cobertura de testes

A pasta `src` da aplicação React não possui ferramentas de teste configuradas (como Vitest ou Jest) e os arquivos com extensão `.spec.tsx` ou `.test.ts` são inexistentes. Todas as suposições devem ser checadas no contexto do navegador de forma manual.

## 13. Recomendações para correção

1. **Remoção das Constantes:** Atualizar o `HeaderProgresso.tsx` para usar `progresso?.totalDicas` e `progresso?.totalReceitas` no lugar do teto artificial de 25 no front.
2. **Ajuste de Domínio UI:** Reformular a aba de Checklist e os painéis de topo. O "Catálogo" deve apenas exibir conteúdos. Se a intenção é contabilizar os acessos do dia e exibir metas como em "Você atingiu 3/5 dicas curtidas hoje", a aplicação inteira precisará enviar não apenas a competência (`anoMes`), mas a Data atual exata (`YYYY-MM-DD`).
3. **Introduzir Automação de Qualidade:** Adicionar Vitest + React Testing Library focados nos fluxos críticos do `ItemCard.tsx` e `CatalogoItens.tsx` (que encapsulam as lógicas de filtro in-memory).

## 14. Conclusão

O ecossistema frontend desta aplicação é maduro, escrito em padrões bem aceitos (estado extraído, separação de responsabilidades e efeitos colaterais restritos) para garantir alta manutenibilidade.

As **regras das curtidas em si e a competência de meses se provaram eficientes e totalmente funcionais.**

O foco de instabilidade diagnosticado foca integralmente em toda a esfera de **Evolução de progresso (Não implementada funcionalmente / Defeituosa)**, onde o frontend funciona com "hardcodes" estéticos em cima do retorno conceitualmente bugado do backend. Um alinhamento arquitetônico de negócios, aliado a refatorações do contrato da API em relação aos totais diários, corrigirá definitivamente a anomalia visual identificada.
