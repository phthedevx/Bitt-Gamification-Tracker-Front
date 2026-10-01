import "@testing-library/jest-dom/vitest";
/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ItemCard } from './ItemCard'

describe('ItemCard', () => {
  const mockItem = { id: 1, nome: 'Dica X', tipo: 'DICA' as const, curtido: false }

  it('permite curtir quando não está curtido e podeCurtir é true', async () => {
    const onCurtir = vi.fn()
    render(<ItemCard item={mockItem} podeCurtir={true} onCurtir={onCurtir} />)

    const btn = screen.getByRole('button', { name: /Curtir/i })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onCurtir).toHaveBeenCalledWith(mockItem)
  })

  it('coração imutável: não permite descurtir (já curtido)', () => {
    const onCurtir = vi.fn()
    render(<ItemCard item={{ ...mockItem, curtido: true }} podeCurtir={true} onCurtir={onCurtir} />)

    const btn = screen.getByRole('button', { name: /já curtido/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onCurtir).not.toHaveBeenCalled()
  })

  it('bloqueia curtida fora da competência (podeCurtir=false)', () => {
    const onCurtir = vi.fn()
    render(<ItemCard item={mockItem} podeCurtir={false} onCurtir={onCurtir} />)

    const btn = screen.getByRole('button', { name: /Não é possível curtir/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onCurtir).not.toHaveBeenCalled()
  })
})
