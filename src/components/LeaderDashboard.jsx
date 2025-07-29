import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { LogOut, Download, Filter } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const LeaderDashboard = ({ user, onLogout }) => {
  const [dadosProducao, setDadosProducao] = useState([])
  const [filtroData, setFiltroData] = useState('')

  // Dados simulados para demonstração
  const dadosSimulados = [
    {
      data: '2025-01-20',
      operador: 'Leandro',
      turno: 3,
      toneladas: 333,
      tempoEfetivo: '6:27',
      paradas: [
        { motivo: 'DDS Checklist', duracao: '00:35' },
        { motivo: 'Limpeza da moagem', duracao: '00:05' },
        { motivo: 'Janta', duracao: '01:00' },
        { motivo: 'Eng. BVOI', duracao: '00:15' },
        { motivo: 'Medição dos silos', duracao: '00:10' },
        { motivo: 'Troca ou enceramento de turno', duracao: '00:10' }
      ]
    },
    {
      data: '2025-01-19',
      operador: 'Leandro',
      turno: 2,
      toneladas: 280,
      tempoEfetivo: '7:15',
      paradas: [
        { motivo: 'Diálogo de segurança', duracao: '00:30' },
        { motivo: 'Manutenção', duracao: '00:45' },
        { motivo: 'Intervalo', duracao: '00:30' }
      ]
    },
    {
      data: '2025-01-18',
      operador: 'Leandro',
      turno: 1,
      toneladas: 310,
      tempoEfetivo: '6:50',
      paradas: [
        { motivo: 'Diálogo de segurança', duracao: '00:25' },
        { motivo: 'Limpeza', duracao: '00:20' },
        { motivo: 'Medição dos silos', duracao: '00:12' }
      ]
    }
  ]

  useEffect(() => {
    // Carregar dados salvos do localStorage
    const dadosSalvos = localStorage.getItem('controle-producao')
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos)
      setDadosProducao([dados, ...dadosSimulados])
    } else {
      setDadosProducao(dadosSimulados)
    }
  }, [])

  const dadosGraficoProducao = dadosProducao.map(item => ({
    data: item.data,
    toneladas: item.toneladas || item.formData?.toneladas || 0,
    operador: item.operador || item.formData?.operador || 'N/A'
  }))

  const dadosGraficoParadas = dadosProducao.reduce((acc, item) => {
    const paradas = item.paradas || []
    paradas.forEach(parada => {
      const motivo = parada.motivo
      const duracao = parada.duracao
      const [horas, minutos] = duracao.split(':').map(Number)
      const totalMinutos = horas * 60 + minutos
      
      const existente = acc.find(p => p.motivo === motivo)
      if (existente) {
        existente.tempo += totalMinutos
      } else {
        acc.push({ motivo, tempo: totalMinutos })
      }
    })
    return acc
  }, [])

  const cores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0']

  const exportarRelatorio = () => {
    const relatorio = dadosProducao.map(item => ({
      Data: item.data || item.formData?.data,
      Operador: item.operador || item.formData?.operador,
      Turno: item.turno || item.formData?.turno,
      Toneladas: item.toneladas || item.formData?.toneladas,
      'Tempo Efetivo': item.tempoEfetivo,
      'Total de Paradas': item.paradas?.length || 0
    }))
    
    console.log('Relatório exportado:', relatorio)
    alert('Relatório exportado! (Verifique o console para ver os dados)')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">JUNDU</h1>
            <p className="text-slate-300">Relatórios e Análises de Produção</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-slate-300 capitalize">{user.userType}</p>
            </div>
            <Button variant="outline" onClick={onLogout} className="text-slate-800">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dadosProducao.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Produção Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dadosProducao.reduce((total, item) => 
                  total + (item.toneladas || item.formData?.toneladas || 0), 0
                )} t
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Média por Turno</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dadosProducao.length > 0 
                  ? Math.round(dadosProducao.reduce((total, item) => 
                      total + (item.toneladas || item.formData?.toneladas || 0), 0
                    ) / dadosProducao.length)
                  : 0
                } t
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Operadores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(dadosProducao.map(item => 
                  item.operador || item.formData?.operador
                )).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle>Controles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={exportarRelatorio} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Produção */}
        <Card>
          <CardHeader>
            <CardTitle>Produção por Data</CardTitle>
            <CardDescription>Toneladas produzidas por turno</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoProducao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="toneladas" fill="#8884d8" name="Toneladas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Paradas */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Paradas</CardTitle>
            <CardDescription>Tempo total por motivo de parada (em minutos)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficoParadas}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ motivo, tempo }) => `${motivo}: ${tempo}min`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="tempo"
                >
                  {dadosGraficoParadas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela de Registros */}
        <Card>
          <CardHeader>
            <CardTitle>Registros Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left">Data</th>
                    <th className="border border-slate-300 p-2 text-left">Operador</th>
                    <th className="border border-slate-300 p-2 text-left">Turno</th>
                    <th className="border border-slate-300 p-2 text-left">Toneladas</th>
                    <th className="border border-slate-300 p-2 text-left">Tempo Efetivo</th>
                    <th className="border border-slate-300 p-2 text-left">Paradas</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosProducao.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-2">
                        {item.data || item.formData?.data}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {item.operador || item.formData?.operador}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {item.turno || item.formData?.turno}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {item.toneladas || item.formData?.toneladas || 0}
                      </td>
                      <td className="border border-slate-300 p-2">
                        {item.tempoEfetivo || 'N/A'}
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div className="flex flex-wrap gap-1">
                          {(item.paradas || []).map((parada, pIndex) => (
                            <Badge key={pIndex} variant="outline" className="text-xs">
                              {parada.motivo} ({parada.duracao})
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LeaderDashboard

