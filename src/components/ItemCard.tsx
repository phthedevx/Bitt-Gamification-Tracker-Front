import { Check, Copy, Heart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Item } from '../types'

interface ItemCardProps {
  item: Item
  podeCurtir: boolean
  onCurtir: (item: Item) => Promise<void>
}

export function ItemCard({ item, podeCurtir, onCurtir }: ItemCardProps) {
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(temporizador.current)
  }, [])

  async function copiarConteudo() {
    await navigator.clipboard.writeText(item.nome)
    setCopiado(true)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setCopiado(false), 1800)
  }

  async function curtirItem() {
    if (item.curtido || !podeCurtir) return
    setSalvando(true)
    try {
      await onCurtir(item)
    } finally {
      setSalvando(false)
    }
  }

  const botaoDesabilitado = salvando || item.curtido || !podeCurtir

  let ariaLabel = `Curtir ${item.nome}`
  if (item.curtido) {
    ariaLabel = `${item.nome} já curtido nesta competência`
  } else if (!podeCurtir) {
    ariaLabel = 'Não é possível curtir itens fora da competência atual'
  }

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/40">
      <div className="mb-3 flex items-start justify-end gap-3">
        <button
          type="button"
          onClick={curtirItem}
          disabled={botaoDesabilitado}
          className={`shrink-0 rounded-xl border p-2 transition ${
            salvando ? 'cursor-wait opacity-60' : ''
          } ${
            item.curtido
              ? 'cursor-default border-pink-500/40 bg-pink-500/15 text-pink-400 opacity-100'
              : !podeCurtir
                ? 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600 opacity-50'
                : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-pink-500/40 hover:text-pink-400'
          }`}
          aria-label={ariaLabel}
          aria-pressed={item.curtido}
        >
          <Heart
            className={`h-5 w-5 ${item.curtido ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <p className="mb-5 flex-1 whitespace-pre-line text-sm leading-6 text-slate-400">
        {item.nome}
      </p>

      <button
        type="button"
        onClick={copiarConteudo}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      >
        {copiado ? (
          <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {copiado ? 'Copiado!' : 'Copiar conteúdo'}
      </button>
    </article>
  )
}
