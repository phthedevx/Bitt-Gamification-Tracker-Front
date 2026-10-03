import "@testing-library/jest-dom/vitest";
/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChecklistDiario } from './ChecklistDiario'
import type { TarefaDiaria } from '../types'

describe('ChecklistDiario', () => {
  const tarefaMock: TarefaDiaria = {
    id: 1,
    nome: 'Humor/Diário',
    categoria: 'OUTRO',
    pontos: 15,
    concluido: false
  }

  const tarefaConcluidaMock: TarefaDiaria = {
    ...tarefaMock,
    concluido: true,
    dataRegistro: '2026-10-02'
  }

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ao clicar numa tarefa, envia o contrato correto e atualiza o estado', async () => {
    // Mock GET inicial
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [tarefaMock],
    })

    const onDataChange = vi.fn()
    render(<ChecklistDiario data="2026-10-02" onDataChange={onDataChange} />)

    // Aguarda carregar
    expect(await screen.findByText('Humor/Diário')).toBeInTheDocument()
    expect(screen.getByText('0 de 1 tarefas concluídas')).toBeInTheDocument()

    // Botão da tarefa
    const button = screen.getByRole('button', { name: /Humor\/Diário/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    // Mock POST
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    fireEvent.click(button)

    // Verifica chamada da API
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/tarefas-diarias/1/toggle-conclusao',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataRegistro: '2026-10-02' })
      })
    )

    // Verifica atualização otimista/estado após
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getByText('1 de 1 tarefas concluídas')).toBeInTheDocument()
  })

  it('erro HTTP não marca tarefa como concluída falsamente', async () => {
    // Mock GET inicial
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [tarefaMock],
    })

    const onDataChange = vi.fn()
    render(<ChecklistDiario data="2026-10-02" onDataChange={onDataChange} />)

    expect(await screen.findByText('Humor/Diário')).toBeInTheDocument()

    // Mock POST falho
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
    })

    const button = screen.getByRole('button', { name: /Humor\/Diário/i })
    fireEvent.click(button)

    // Aguarda erro aparecer
    expect(await screen.findByText('Não foi possível atualizar a tarefa. Tente novamente.')).toBeInTheDocument()
    
    // Verifica que não mudou estado
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('0 de 1 tarefas concluídas')).toBeInTheDocument()
  })

  it('testa troca de data (02/10 -> 03/10 -> 02/10)', async () => {
    // 02/10 tem tarefa concluída
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [tarefaConcluidaMock],
    })
    
    const { rerender } = render(<ChecklistDiario data="2026-10-02" onDataChange={vi.fn()} />)
    
    expect(await screen.findByText('1 de 1 tarefas concluídas')).toBeInTheDocument()
    
    // 03/10 tem tarefa não concluída
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [tarefaMock],
    })
    
    rerender(<ChecklistDiario data="2026-10-03" onDataChange={vi.fn()} />)
    expect(await screen.findByText('0 de 1 tarefas concluídas')).toBeInTheDocument()

    // Volta 02/10
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [tarefaConcluidaMock],
    })
    
    rerender(<ChecklistDiario data="2026-10-02" onDataChange={vi.fn()} />)
    expect(await screen.findByText('1 de 1 tarefas concluídas')).toBeInTheDocument()
  })
})
