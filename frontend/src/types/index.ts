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
  titulo: string
  conteudo: string
  tipo: TipoItem
  curtido: boolean
}

export interface ProgressoMensal {
  anoMes: string
  dicasCurtidas: number
  receitasCurtidas: number
}

export interface TarefaDiaria {
  id: number
  titulo: string
  categoria: CategoriaTarefa
  concluida: boolean
  dataRegistro?: string
}
