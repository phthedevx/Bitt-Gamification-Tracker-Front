import type { TarefaDiaria } from '../types'

async function validarResposta(response: Response): Promise<Response> {
  if (!response.ok) {
    throw new Error(`Erro ao acessar a API: ${response.status} ${response.statusText}`)
  }

  return response
}

export async function getTarefasDiarias(data: string): Promise<TarefaDiaria[]> {
  const params = new URLSearchParams({ data })
  const response = await fetch(`/api/tarefas-diarias?${params.toString()}`)
  await validarResposta(response)

  return response.json() as Promise<TarefaDiaria[]>
}

export async function toggleTarefa(
  id: number,
  dataRegistro: string,
): Promise<void> {
  const params = new URLSearchParams({ dataRegistro })
  const response = await fetch(
    `/api/tarefas-diarias/${id}/toggle-conclusao?${params.toString()}`,
    { method: 'POST' },
  )
  await validarResposta(response)
}
