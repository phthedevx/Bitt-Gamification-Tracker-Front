import { HeartOff, Lightbulb, LoaderCircle, Search, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getItens, toggleCurtida } from '../services/itemService'
import type { Item, TipoItem } from '../types'
import { ItemCard } from './ItemCard'

interface CatalogoItensProps {
  anoMes: string
  tipoAtivo: TipoItem
  onTipoChange: (tipo: TipoItem) => void
  onCurtidaAlternada: () => void | Promise<void>
}

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

export function CatalogoItens({
  anoMes,
  tipoAtivo,
  onTipoChange,
  onCurtidaAlternada,
}: CatalogoItensProps) {
  const [itens, setItens] = useState<Item[]>([])
  const [busca, setBusca] = useState('')
  const [apenasNaoCurtidos, setApenasNaoCurtidos] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let componenteAtivo = true

    setCarregando(true)
    setErro(null)

    getItens(tipoAtivo, anoMes)
      .then((dados) => {
        if (componenteAtivo) setItens(dados)
      })
      .catch(() => {
        if (componenteAtivo) setErro('Não foi possível carregar o catálogo.')
      })
      .finally(() => {
        if (componenteAtivo) setCarregando(false)
      })

    return () => {
      componenteAtivo = false
    }
  }, [anoMes, tipoAtivo])

  const itensFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca.trim())

    return itens.filter((item) => {
      const correspondeBusca =
        !termo ||
        normalizarTexto(item.nome).includes(termo)
      const correspondeCurtida = !apenasNaoCurtidos || !item.curtido

      return correspondeBusca && correspondeCurtida
    })
  }, [apenasNaoCurtidos, busca, itens])

  async function alternarCurtida(item: Item) {
    setErro(null)

    try {
      await toggleCurtida(item.id, anoMes)
      setItens((atuais) =>
        atuais.map((atual) =>
          atual.id === item.id ? { ...atual, curtido: !atual.curtido } : atual,
        ),
      )
      await onCurtidaAlternada()
    } catch {
      setErro('Não foi possível atualizar a curtida. Tente novamente.')
    }
  }

  return (
    <section aria-labelledby="titulo-catalogo">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            Catálogo mensal
          </p>
          <h2 id="titulo-catalogo" className="text-2xl font-black text-white">
            Conteúdos para evoluir
          </h2>
        </div>

        <div className="inline-flex w-full rounded-xl border border-slate-800 bg-slate-900 p-1 sm:w-auto">
          {(['DICA', 'RECEITA'] as const).map((tipo) => {
            const ativo = tipoAtivo === tipo
            const Icone = tipo === 'DICA' ? Lightbulb : Utensils

            return (
              <button
                key={tipo}
                type="button"
                onClick={() => onTipoChange(tipo)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
                  ativo
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                aria-pressed={ativo}
              >
                <Icone className="h-4 w-4" aria-hidden="true" />
                {tipo === 'DICA' ? 'Dicas' : 'Receitas'}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <span className="sr-only">Buscar no catálogo</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por título ou conteúdo..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300">
          <input
            type="checkbox"
            checked={apenasNaoCurtidos}
            onChange={(event) => setApenasNaoCurtidos(event.target.checked)}
            className="h-4 w-4 accent-cyan-500"
          />
          <HeartOff className="h-4 w-4" aria-hidden="true" />
          Apenas não curtidos
        </label>
      </div>

      {erro && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="flex min-h-48 items-center justify-center text-slate-400">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
          Carregando catálogo...
        </div>
      ) : itensFiltrados.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {itensFiltrados.map((item) => (
            <ItemCard key={item.id} item={item} onToggleCurtida={alternarCurtida} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center text-slate-500">
          Nenhum item corresponde aos filtros selecionados.
        </div>
      )}
    </section>
  )
}
