export type TipoItem = 'DICA' | 'RECEITA'

export type CategoriaTarefa =
  | 'TREINO'
  | 'AGUA'
  | 'ALIMENTACAO'
  | 'LEITURA'
  | 'SONO'
  | 'OUTRA'

export interface Item {
  id: number
  nome: string
  tipo: TipoItem
  curtido: boolean
}

export interface ProgressoDiario {
  data: string
  dicasCurtidas: number
  receitasCurtidas: number
  metaDicas: number
  metaReceitas: number
}

export interface TarefaDiaria {
  id: number
  titulo: string
  categoria: CategoriaTarefa
  concluida: boolean
  dataRegistro?: string
}
