export type TipoItem = 'DICA' | 'RECEITA'

export type CategoriaTarefa =
  | 'TREINO'
  | 'CORRIDA'
  | 'POSTAGEM'
  | 'AGUA'
  | 'OUTRO'

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
  nome: string
  pontos: number
  categoria: CategoriaTarefa
  concluido: boolean
  dataRegistro?: string
}
