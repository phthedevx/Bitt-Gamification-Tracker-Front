import "@testing-library/jest-dom/vitest";
/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HeaderProgresso } from './HeaderProgresso'

describe('HeaderProgresso', () => {
  it('exibe metas e dicas de acordo com objeto retornado pela API', () => {
    const progresso = {
      data: '2026-10-01',
      dicasCurtidas: 3,
      receitasCurtidas: 2,
      metaDicas: 20,
      metaReceitas: 15
    }

    render(
      <HeaderProgresso
        anoMes="2026-10"
        progresso={progresso}
        onAnoMesChange={vi.fn()}
      />
    )

    expect(screen.getByText('3/20')).toBeInTheDocument()
    expect(screen.getByText('2/15')).toBeInTheDocument()
    expect(screen.getByText(/Progresso Diário/i)).toBeInTheDocument()
  })

  it('exibe 0/25 como padrão na ausência de progresso', () => {
    render(
      <HeaderProgresso
        anoMes="2026-10"
        progresso={null}
        onAnoMesChange={vi.fn()}
      />
    )

    const itens = screen.getAllByText('0/25')
    expect(itens).toHaveLength(2)
  })
})
