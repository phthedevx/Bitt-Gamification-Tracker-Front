import { CalendarDays, CheckCircle2, Circle, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTarefasDiarias, toggleTarefa } from '../services/tarefaService'
import type { CategoriaTarefa, TarefaDiaria } from '../types'

interface ChecklistDiarioProps {
  data: string
  onDataChange: (data: string) => void
}

const estilosCategoria: Record<CategoriaTarefa, string> = {
  TREINO: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  CORRIDA: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  POSTAGEM: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  AGUA: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  OUTRO: 'border-slate-600 bg-slate-800 text-slate-300',
}

const rotulosCategoria: Record<CategoriaTarefa, string> = {
  TREINO: 'Treino',
  CORRIDA: 'Corrida',
  POSTAGEM: 'Postagem',
  AGUA: 'Água',
  OUTRO: 'Outro',
}

export function ChecklistDiario({ data, onDataChange }: ChecklistDiarioProps) {
  const [tarefas, setTarefas] = useState<TarefaDiaria[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvandoId, setSalvandoId] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let componenteAtivo = true

    setCarregando(true)
    setErro(null)

    getTarefasDiarias(data)
      .then((dados) => {
        if (componenteAtivo) setTarefas(dados)
      })
      .catch(() => {
        if (componenteAtivo) setErro('Não foi possível carregar as tarefas do dia.')
      })
      .finally(() => {
        if (componenteAtivo) setCarregando(false)
      })

    return () => {
      componenteAtivo = false
    }
  }, [data])

  async function alternarConclusao(tarefa: TarefaDiaria) {
    setSalvandoId(tarefa.id)
    setErro(null)

    try {
      await toggleTarefa(tarefa.id, data)
      setTarefas((atuais) =>
        atuais.map((atual) =>
          atual.id === tarefa.id
            ? { ...atual, concluido: !atual.concluido, dataRegistro: data }
            : atual,
        ),
      )
    } catch {
      setErro('Não foi possível atualizar a tarefa. Tente novamente.')
    } finally {
      setSalvandoId(null)
    }
  }

  const concluidas = tarefas.filter((tarefa) => tarefa.concluido).length

  return (
    <section aria-labelledby="titulo-checklist">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            Consistência diária
          </p>
          <h2 id="titulo-checklist" className="text-2xl font-black text-white">
            Checklist diário
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {concluidas} de {tarefas.length} tarefas concluídas
          </p>
        </div>

        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Data
          <span className="relative">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="date"
              value={data}
              onChange={(event) => onDataChange(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-10 pr-3 text-sm font-medium normal-case tracking-normal text-slate-100 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </span>
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
          Carregando tarefas...
        </div>
      ) : tarefas.length > 0 ? (
        <ul className="space-y-3">
          {tarefas.map((tarefa) => {
            const salvando = salvandoId === tarefa.id
            const categoria = estilosCategoria[tarefa.categoria]
              ? tarefa.categoria
              : 'OUTRO'

            return (
              <li key={tarefa.id}>
                <button
                  type="button"
                  onClick={() => alternarConclusao(tarefa)}
                  disabled={salvando}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-wait disabled:opacity-60 ${
                    tarefa.concluido
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                  aria-pressed={tarefa.concluido}
                >
                  {salvando ? (
                    <LoaderCircle
                      className="h-6 w-6 shrink-0 animate-spin text-cyan-400"
                      aria-hidden="true"
                    />
                  ) : tarefa.concluido ? (
                    <CheckCircle2
                      className="h-6 w-6 shrink-0 text-emerald-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <Circle className="h-6 w-6 shrink-0 text-slate-600" aria-hidden="true" />
                  )}

                  <span
                    className={`min-w-0 flex-1 font-semibold ${
                      tarefa.concluido ? 'text-slate-500 line-through' : 'text-slate-100'
                    }`}
                  >
                    {tarefa.nome}
                  </span>

                  <span className="text-sm font-bold text-slate-400">
                    {tarefa.pontos} pts
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${estilosCategoria[categoria]}`}
                  >
                    {rotulosCategoria[categoria]}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center text-slate-500">
          Nenhuma tarefa cadastrada para esta data.
        </div>
      )}
    </section>
  )
}
