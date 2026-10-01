import type { Item, ProgressoDiario, TipoItem } from '../types'

async function validarResposta(response: Response): Promise<Response> {
  if (!response.ok) {
    throw new Error(`Erro ao acessar a API: ${response.status} ${response.statusText}`)
  }

  return response
}

export async function getProgresso(data: string): Promise<ProgressoDiario> {
  const params = new URLSearchParams({ data })
  const response = await fetch(`/api/progresso?${params.toString()}`)
  await validarResposta(response)

  return response.json() as Promise<ProgressoDiario>
}

export async function getItens(tipo: TipoItem, anoMes: string): Promise<Item[]> {
  const params = new URLSearchParams({ tipo, anoMes })
  const response = await fetch(`/api/itens?${params.toString()}`)
  await validarResposta(response)

  return response.json() as Promise<Item[]>
}

export async function curtir(id: number, anoMes: string, data: string): Promise<void> {
  const response = await fetch(
    `/api/itens/${id}/curtida`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anoMes, data }),
    },
  )
  await validarResposta(response)
}
