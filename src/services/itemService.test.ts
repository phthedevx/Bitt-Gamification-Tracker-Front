import { describe, expect, it, vi, beforeEach } from 'vitest'
import { curtir, getItens, getProgresso } from './itemService'

describe('itemService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('curtir chama o endpoint com data e anoMes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response())
    await curtir(10, '2026-10', '2026-10-01')

    expect(fetchMock).toHaveBeenCalledWith('/api/itens/10/curtida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anoMes: '2026-10', data: '2026-10-01' })
    })
  })

  it('getProgresso chama o endpoint com data', async () => {
    const mockResponse = { data: '2026-10-01', dicasCurtidas: 3, receitasCurtidas: 0, metaDicas: 25, metaReceitas: 25 }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse))
    )
    
    const result = await getProgresso('2026-10-01')

    expect(fetchMock).toHaveBeenCalledWith('/api/progresso?data=2026-10-01')
    expect(result).toEqual(mockResponse)
  })

  it('getItens chama com anoMes e tipo', async () => {
    const mockResponse = [{ id: 1, nome: 'Teste', tipo: 'DICA', curtido: false }]
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse))
    )
    
    const result = await getItens('DICA', '2026-10')

    expect(fetchMock).toHaveBeenCalledWith('/api/itens?tipo=DICA&anoMes=2026-10')
    expect(result).toEqual(mockResponse)
  })
})
