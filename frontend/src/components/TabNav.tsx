import { ClipboardCheck, Lightbulb, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TipoItem } from '../types'

export type AbaAtiva = TipoItem | 'CHECKLIST'

interface TabNavProps {
  abaAtiva: AbaAtiva
  onAbaChange: (aba: AbaAtiva) => void
}

interface Aba {
  id: AbaAtiva
  rotulo: string
  Icone: LucideIcon
}

const abas: Aba[] = [
  { id: 'DICA', rotulo: 'Dicas', Icone: Lightbulb },
  { id: 'RECEITA', rotulo: 'Receitas', Icone: Utensils },
  { id: 'CHECKLIST', rotulo: 'Checklist Diário', Icone: ClipboardCheck },
]

export function TabNav({ abaAtiva, onAbaChange }: TabNavProps) {
  return (
    <nav
      className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5"
      aria-label="Navegação principal"
    >
      {abas.map(({ id, rotulo, Icone }) => {
        const ativa = abaAtiva === id

        return (
          <button
            key={id}
            type="button"
            onClick={() => onAbaChange(id)}
            className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition sm:px-4 sm:text-sm ${
              ativa
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
            aria-current={ativa ? 'page' : undefined}
          >
            <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{rotulo}</span>
          </button>
        )
      })}
    </nav>
  )
}
