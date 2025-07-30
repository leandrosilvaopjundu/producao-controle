import { useState } from 'react'
import OperatorDashboard from './components/OperatorDashboard'
import Relatorios from './components/Relatorios'
import HistoricoRegistros from './components/HistoricoRegistros'
import { Button } from './components/ui/button'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('novo-registro')

  const renderContent = () => {
    switch (activeTab) {
      case 'novo-registro':
        return <OperatorDashboard />
      case 'relatorios':
        return <Relatorios />
      case 'historico':
        return <HistoricoRegistros />
      default:
        return <OperatorDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-slate-700 text-white p-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          📊 Sistema de Produtividade - Mineração
        </h1>
      </header>

      {/* Navegação por abas */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <Button
              variant={activeTab === 'novo-registro' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('novo-registro')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
            >
              ➕ Novo Registro
            </Button>
            <Button
              variant={activeTab === 'relatorios' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('relatorios')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
            >
              📊 Relatórios
            </Button>
            <Button
              variant={activeTab === 'historico' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('historico')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
            >
              📋 Histórico
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
