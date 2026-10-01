import "@testing-library/jest-dom/vitest";
/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CatalogoItens } from './CatalogoItens'
import * as itemService from '../services/itemService'

describe('CatalogoItens', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('filtro Apenas não curtidos remove da lista após sucesso da curtida', async () => {
    vi.spyOn(itemService, 'getItens').mockResolvedValue([
      { id: 1, nome: 'Dica X', tipo: 'DICA', curtido: false }
    ])
    vi.spyOn(itemService, 'curtir').mockResolvedValue(undefined)
    
    const onCurtida = vi.fn()
    render(
      <CatalogoItens 
        dataAtual="2026-10-01" 
        anoMes="2026-10" 
        tipoAtivo="DICA" 
        onTipoChange={vi.fn()} 
        onCurtida={onCurtida} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Dica X')).toBeInTheDocument()
    })

    // Ativa filtro
    const checkbox = screen.getByLabelText(/Apenas não curtidos/i)
    fireEvent.click(checkbox)

    const btnCurtir = screen.getByRole('button', { name: /Curtir Dica X/i })
    fireEvent.click(btnCurtir)

    await waitFor(() => {
      expect(screen.queryByText('Dica X')).not.toBeInTheDocument()
      expect(itemService.curtir).toHaveBeenCalledWith(1, '2026-10', '2026-10-01')
      expect(onCurtida).toHaveBeenCalled()
    })

    // Desativa filtro
    fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.getByText('Dica X')).toBeInTheDocument()
    })
    
    // Agora o botão deve estar disabled
    const btnCurtido = screen.getByRole('button', { name: /já curtido/i })
    expect(btnCurtido).toBeDisabled()
  })

  it('não permite curtir se for mês diferente do atual', async () => {
    vi.spyOn(itemService, 'getItens').mockResolvedValue([
      { id: 1, nome: 'Dica Y', tipo: 'DICA', curtido: false }
    ])
    
    const onCurtida = vi.fn()
    render(
      <CatalogoItens 
        dataAtual="2026-10-01" 
        anoMes="2026-09" 
        tipoAtivo="DICA" 
        onTipoChange={vi.fn()} 
        onCurtida={onCurtida} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Dica Y')).toBeInTheDocument()
    })

    const btnCurtir = screen.getByRole('button', { name: /Não é possível curtir/i })
    expect(btnCurtir).toBeDisabled()
  })

  it('cobre nova curtida ao mudar competência', async () => {
    // Cenário: em Outubro o item vem curtido. Em Novembro vem não curtido e é curtido novamente.
    vi.spyOn(itemService, 'getItens').mockImplementation(async (_tipo, anoMes) => {
      if (anoMes === '2026-10') {
        return [{ id: 10, nome: 'Cafeína', tipo: 'DICA', curtido: true }]
      }
      if (anoMes === '2026-11') {
        return [{ id: 10, nome: 'Cafeína', tipo: 'DICA', curtido: false }]
      }
      return []
    })

    const curtirMock = vi.spyOn(itemService, 'curtir').mockResolvedValue(undefined)
    const onCurtida = vi.fn()
    
    // Renderiza em outubro (hoje 2026-11-03, mas vemos outubro histórico)
    const { rerender } = render(
      <CatalogoItens 
        dataAtual="2026-11-03" 
        anoMes="2026-10" 
        tipoAtivo="DICA" 
        onTipoChange={vi.fn()} 
        onCurtida={onCurtida} 
      />
    )

    await waitFor(() => {
      // Já está curtido em outubro, então o botão está marcado
      expect(screen.getByRole('button', { name: /já curtido/i })).toBeDisabled()
    })

    // Troca para novembro
    rerender(
      <CatalogoItens 
        dataAtual="2026-11-03" 
        anoMes="2026-11" 
        tipoAtivo="DICA" 
        onTipoChange={vi.fn()} 
        onCurtida={onCurtida} 
      />
    )

    await waitFor(() => {
      // Agora o botão pode ser clicado, pois curtido=false vindo da API
      const btnCurtir = screen.getByRole('button', { name: /Curtir Cafeína/i })
      expect(btnCurtir).not.toBeDisabled()
      
      // Realiza a curtida
      fireEvent.click(btnCurtir)
    })

    await waitFor(() => {
      // Garante que enviou POST válido para novembro
      expect(curtirMock).toHaveBeenCalledWith(10, '2026-11', '2026-11-03')
      expect(onCurtida).toHaveBeenCalled()
      
      // O botão passa a ficar desabilitado como já curtido
      expect(screen.getByRole('button', { name: /já curtido/i })).toBeDisabled()
    })
  })
})
