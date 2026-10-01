import { Lightbulb, Trophy, Utensils } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ProgressoDiario } from '../types'

interface HeaderProgressoProps {
  anoMes: string
  progresso: ProgressoDiario | null
  carregando?: boolean
  onAnoMesChange: (anoMes: string) => void
}

interface BarraProgressoProps {
  titulo: string
  atual: number
  meta: number
  cor: string
  Icone: LucideIcon
}

function BarraProgresso({ titulo, atual, meta, cor, Icone }: BarraProgressoProps) {
  const percentual = meta > 0 ? Math.min(100, Math.max(0, (atual / meta) * 100)) : 0

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Icone className="h-4 w-4" aria-hidden="true" />
          <span>{titulo}</span>
        </div>
        <span className="text-sm font-bold text-white">
          {atual}/{meta}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={`Progresso de ${titulo}`}
        aria-valuemin={0}
        aria-valuemax={meta}
        aria-valuenow={atual}
      >
        <div
          className={`h-full rounded-full ${cor} transition-[width] duration-500`}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  )
}

export function HeaderProgresso({
  anoMes,
  progresso,
  carregando = false,
  onAnoMesChange,
}: HeaderProgressoProps) {
  return (
    <header className="rounded-3xl border border-slate-800 bg-slate-900/50 p-5 shadow-2xl shadow-cyan-950/20 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-cyan-400">
            <Trophy className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">
              Progresso Diário
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Bitt Gamification Tracker
          </h1>
        </div>

        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Competência
          <input
            type="month"
            value={anoMes}
            onChange={(event) => onAnoMesChange(event.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
          />
        </label>
      </div>

      <div className={`grid gap-3 sm:grid-cols-2 ${carregando ? 'animate-pulse' : ''}`}>
        <BarraProgresso
          titulo="Dicas"
          atual={progresso?.dicasCurtidas ?? 0}
          meta={progresso?.metaDicas ?? 25}
          cor="bg-gradient-to-r from-cyan-500 to-blue-500"
          Icone={Lightbulb}
        />
        <BarraProgresso
          titulo="Receitas"
          atual={progresso?.receitasCurtidas ?? 0}
          meta={progresso?.metaReceitas ?? 25}
          cor="bg-gradient-to-r from-fuchsia-500 to-violet-500"
          Icone={Utensils}
        />
      </div>
    </header>
  )
}
