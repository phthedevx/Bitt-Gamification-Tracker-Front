import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { CatalogoItens } from './components/CatalogoItens'
import { ChecklistDiario } from './components/ChecklistDiario'
import { HeaderProgresso } from './components/HeaderProgresso'
import { TabNav } from './components/TabNav'
import type { AbaAtiva } from './components/TabNav'
import { getProgresso } from './services/itemService'
import type { ProgressoMensal } from './types'

function formatarDataLocal(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function App() {
  const dataAtual = formatarDataLocal(new Date())
  const [anoMes, setAnoMes] = useState(dataAtual.slice(0, 7))
  const [dataChecklist, setDataChecklist] = useState(dataAtual)
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('DICA')
  const [progresso, setProgresso] = useState<ProgressoMensal | null>(null)
  const [carregandoProgresso, setCarregandoProgresso] = useState(true)
  const [erroProgresso, setErroProgresso] = useState<string | null>(null)

  const carregarProgresso = useCallback(async () => {
    setCarregandoProgresso(true)
    setErroProgresso(null)

    try {
      const dados = await getProgresso(anoMes)
      setProgresso(dados)
    } catch {
      setProgresso(null)
      setErroProgresso('Não foi possível carregar o progresso desta competência.')
    } finally {
      setCarregandoProgresso(false)
    }
  }, [anoMes])

  useEffect(() => {
    void carregarProgresso()
  }, [carregarProgresso])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.12),_transparent_35%)]">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <HeaderProgresso
          anoMes={anoMes}
          progresso={progresso}
          carregando={carregandoProgresso}
          onAnoMesChange={setAnoMes}
        />

        {erroProgresso && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {erroProgresso}
          </p>
        )}

        <TabNav abaAtiva={abaAtiva} onAbaChange={setAbaAtiva} />

        <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-4 sm:p-6">
          {abaAtiva === 'CHECKLIST' ? (
            <ChecklistDiario data={dataChecklist} onDataChange={setDataChecklist} />
          ) : (
            <CatalogoItens
              anoMes={anoMes}
              tipoAtivo={abaAtiva}
              onTipoChange={setAbaAtiva}
              onCurtidaAlternada={carregarProgresso}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
