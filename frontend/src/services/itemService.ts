import type { Item, ProgressoMensal, TipoItem } from '../types'

async function validarResposta(response: Response): Promise<Response> {
  if (!response.ok) {
    throw new Error(`Erro ao acessar a API: ${response.status} ${response.statusText}`)
  }

  return response
}

export async function getProgresso(anoMes: string): Promise<ProgressoMensal> {
  const response = await fetch(`/api/progresso/${encodeURIComponent(anoMes)}`)
  await validarResposta(response)

  return response.json() as Promise<ProgressoMensal>
}

export async function getItens(tipo: TipoItem, anoMes: string): Promise<Item[]> {
  const params = new URLSearchParams({ tipo, anoMes })
  const response = await fetch(`/api/itens?${params.toString()}`)
  await validarResposta(response)

  return response.json() as Promise<Item[]>
}

export async function toggleCurtida(id: number, anoMes: string): Promise<void> {
  const response = await fetch(
    `/api/itens/${id}/toggle-curtida`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anoMes }),
    },
  )
  await validarResposta(response)
}
