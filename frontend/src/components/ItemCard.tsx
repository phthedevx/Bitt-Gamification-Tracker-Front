import { Check, Copy, Heart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Item } from '../types'

interface ItemCardProps {
  item: Item
  onToggleCurtida: (item: Item) => Promise<void>
}

export function ItemCard({ item, onToggleCurtida }: ItemCardProps) {
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(temporizador.current)
  }, [])

  async function copiarConteudo() {
    await navigator.clipboard.writeText(`${item.titulo}\n\n${item.conteudo}`)
    setCopiado(true)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setCopiado(false), 1800)
  }

  async function alternarCurtida() {
    setSalvando(true)
    try {
      await onToggleCurtida(item)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug text-white">{item.titulo}</h3>
        <button
          type="button"
          onClick={alternarCurtida}
          disabled={salvando}
          className={`shrink-0 rounded-xl border p-2 transition disabled:cursor-wait disabled:opacity-60 ${
            item.curtido
              ? 'border-pink-500/40 bg-pink-500/15 text-pink-400'
              : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-pink-500/40 hover:text-pink-400'
          }`}
          aria-label={item.curtido ? 'Remover curtida' : 'Curtir item'}
          aria-pressed={item.curtido}
        >
          <Heart
            className={`h-5 w-5 ${item.curtido ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <p className="mb-5 flex-1 whitespace-pre-line text-sm leading-6 text-slate-400">
        {item.conteudo}
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
