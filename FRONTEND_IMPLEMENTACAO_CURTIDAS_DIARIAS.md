# Implementação Frontend — Curtidas Mensais e Progresso Diário

## 1. Resumo

A implementação frontend foi adaptada com sucesso para o novo contrato de progresso diário e curtidas mensais, em substituição ao modelo antigo (que era guiado por toggle e acumulação mensal confusa). Agora, a aplicação distingue corretamente a "Data Atual" (responsável pela marcação e contagem diária) da "Competência Mensal" (responsável por consultar o histórico e filtrar os conteúdos em si). O coração agora funciona de maneira estritamente "append-only" / imutável dentro de cada mês selecionado, oferecendo uma experiência mais clara de conclusão.

## 2. Contrato backend utilizado

- **`POST /api/itens/{id}/curtida`**: Endpoint idempotente e imutável de curtida, que exige payload unificado `{ anoMes, data }`.
- **`GET /api/progresso?data=YYYY-MM-DD`**: Novo endpoint diário para buscar dados do placar, com metas que agora vêm dinâmicas `metaDicas` e `metaReceitas`.
- **`GET /api/itens?tipo=DICA&anoMes=YYYY-MM`**: Contrato preexistente utilizado para recuperar o estado (agora protegido) de corações dentro da competência específica.

## 3. Alterações no itemService

O serviço foi expurgado de todos os rastros de "toggle".
- **`toggleCurtida` removido**: Substituído por `curtir(id, anoMes, data)`, garantindo payload aderente.
- **`getProgresso` adaptado**: Rota substituída de `/api/progresso/{anoMes}` para `/api/progresso?data={data}`.

## 4. Tratamento da data local

Foram desenvolvidos utilitários centralizados em `src/utils/date.ts` (`getLocalDateString` e `getLocalYearMonthString`) para utilizar especificamente os métodos de calendário locais (`getFullYear`, `getMonth`, `getDate`). Isso evita anomalias de fuso ao utilizar `toISOString()`, que causaria o vazamento da competência para dias do mês anterior por conta da diferença GMT-3 na data bruta.

## 5. Curtida mensal imutável

A interface `ItemCard` foi desvinculada do pressuposto que o usuário pode descurtir. 
- Quando `item.curtido = true`, o botão de coração é visualmente marcado e transita para um estado desabilitado (sem ação de click).
- Adicionou-se propriedades de `aria-label` que alertam o usuário de que a ação está concluída, em vez de "Curtir" novamente ou "Descurtir".

## 6. Progresso diário

No `App.tsx`, o hook base não responde mais à "Competência Mensal" visual. Ele está blindado via constante temporal do próprio dia.
A cada chamada bem-sucedida de curtida num item da competência, a função `carregarProgresso` faz a recarga utilizando a data de hoje, garantindo que o progresso sempre cresça independentemente das navegações pelo histórico.

## 7. Meta dinâmica

A constante arbitrária `META_MENSAL = 25` foi removida dos contadores. 
A `BarraProgresso` agora extrai os cálculos do teto retornado pelo `ProgressoDiario` (backend), adaptando para `progresso.metaDicas` ou preenchendo zeros amigavelmente se as dependências demorarem a responder.

## 8. Competência mensal

O controle `anoMes` no topo da tela não sofreu danos sistêmicos; ele continua gerenciando as guias. A diferença é que sua re-avaliação recarrega a exibição do catálogo de Dicas/Receitas isoladamente, não quebrando a meta exibida. Mudar de "Outubro" para "Novembro" carrega os corações correspondentes àquela listagem exata de servidor.

## 9. Competência histórica

Foi implementada uma trava de experiência do usuário: **Não é possível curtir itens quando a competência selecionada for diferente do mês relativo à data de hoje**.
O `CatalogoItens` avalia se `anoMes === mesAtual` e gera uma booleana `podeCurtir`. A lógica do botão no `ItemCard` a absorve, transformando o "cursor" em `not-allowed`, esmaecendo e prevenindo envios de requests sem sentido ou fora de contexto de tempo.

## 10. Filtros e busca

O filtro "Apenas não curtidos" continuou operacional. Uma vez que o fluxo foi unificado e não ocorre mais a inversão de estados indevidas, após a curtida otimista, o array sofre mutation pontual de `curtido: true` e a memoização do React expulsa o item visualmente com fluidez, tudo alinhado a pesquisa nativa.

## 11. Tratamento de loading

Um novo `state` (`salvando`) foi adicionado a cada `ItemCard`. 
Enquanto a `Promise` do `POST /curtida` aguarda o retorno, aquele componente específico desativa interações (`disabled: true` e cursor de `wait`), barrando completamente double-clicks destrutivos ao banco, sem bloquear ou congelar toda a tela.

## 12. Tratamento de erros

Se a rede travar ou o POST retornar erro HTTP 400/500, a promessa encerra rejeitada. Como o setter manual `setItens` com `curtido = true` só ocorre **após** o `await`, um desastre não converte falsamente a UI em curtida, mantendo-a desmarcada e disparando uma notificação textual leve já padronizada no catálogo (`setErro`).

## 13. Acessibilidade

O `ItemCard` recebeu labels semânticos atualizados que suportam leitores de tela:
- Card livre: "Curtir Dica Cafeína".
- Card finalizado: "Cafeína já curtido nesta competência".
- Card bloqueado via filtro histórico: "Não é possível curtir itens fora da competência atual".

## 14. Testes adicionados

A suíte `Vitest` em conjunto com a `@testing-library/react` (JSDOM) foi instalada.
O ambiente teve seu `setupTests.ts` providenciado.

- Testes de funções isoladas como `itemService` e formatações de utilidade (`date.ts`).
- Testes cobrindo fluxos no DOM: clique bloqueado, renderização baseada nas APIs e filtro de "Apenas não curtidos".

## 15. Resultado dos testes

A suíte validou as expectativas integralmente, atestando comportamento imutável no DOM. Todos os testes aprovados.

## 16. Resultado do build

Compilação do TypeScript não apontou erros após o ajuste das referências de Jest-DOM. O `vite build` empacotou com sucesso, apontando pacotes e tamanhos habituais.

## 17. Arquivos alterados

- `package.json` (Dependências do Vitest)
- `vitest.config.ts` (Configuração)
- `src/setupTests.ts` (Configuração)
- `src/utils/date.ts` (Helpers para fuso horário local)
- `src/types/index.ts` (Alterações em `ProgressoDiario`)
- `src/services/itemService.ts` (Refatoração de chamadas)
- `src/App.tsx` (Organização de datas e state calls)
- `src/components/HeaderProgresso.tsx` (Layout de limites dinâmicos)
- `src/components/CatalogoItens.tsx` (Envio de metadados e restrição)
- `src/components/ItemCard.tsx` (Gerência de loading, imutabilidade, a11y)
- (E 5 novos arquivos de testes associados aos componentes / utils supracitados).

## 18. Commits realizados

O versionamento foi planejado atomizado e seletivo, separando modificações visuais, utilitárias, tipagens e por fim a ampla cobertura via testes. Seguiu-se as normas de Conventional Commits.

## 19. Limitações ou decisões arquiteturais

A principal decisão baseia-se em preservar o React Memo como motor do filtro (o que já funcionava em O(n)). E mesmo tendo `React Context` ou `Redux` como possibilidades no front para espelhar a competência/data Atual, decidiu-se elevar a responsabilidade da state variable ("Lifting State Up") inteiramente até o `App.tsx` para assegurar fluxo unidirecional rígido de propriedades, não inserindo dependências pesadas de forma gratuita no sistema.
