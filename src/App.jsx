import { useState } from 'react'
import OperatorDashboard from './components/OperatorDashboard'
import Relatorios from './components/Relatorios'
import HistoricoRegistros from './components/HistoricoRegistros'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Edit, RefreshCw } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('novo-registro')
  
  // NOVA FUNCIONALIDADE: Estado para gerenciar edição de registros
  const [dadosEdicao, setDadosEdicao] = useState(null)

  // NOVA FUNÇÃO: Lidar com a edição de um registro
  const handleEditarRegistro = (dadosRegistro) => {
    setDadosEdicao(dadosRegistro)
    setActiveTab('novo-registro') // Muda para a aba "Novo Registro"
  }

  // NOVA FUNÇÃO: Limpar os dados de edição (quando criar um novo registro)
  const handleNovoRegistro = () => {
    setDadosEdicao(null)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'novo-registro':
        return (
          <OperatorDashboard 
            dadosEdicao={dadosEdicao} 
            onNovoRegistro={handleNovoRegistro}
          />
        )
      case 'relatorios':
        return <Relatorios />
      case 'historico':
        return (
          <HistoricoRegistros 
            onEditarRegistro={handleEditarRegistro}
          />
        )
      default:
        return (
          <OperatorDashboard 
            dadosEdicao={dadosEdicao} 
            onNovoRegistro={handleNovoRegistro}
          />
        )
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
              onClick={() => window.location.reload()}
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

      {/* NOVO: Indicador de modo de edição */}
      {dadosEdicao && activeTab === 'novo-registro' && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mx-4 mt-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-700">
                  <strong>Modo de Edição:</strong> Você está editando o registro do dia {dadosEdicao.data} - {dadosEdicao.operador}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNovoRegistro}
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Cancelar Edição
            </Button>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6">
        {renderContent()}
      </main>
    </div>
  )
}

export default App

