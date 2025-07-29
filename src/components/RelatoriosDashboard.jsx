import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Filter, BarChart3, PieChart as PieChartIcon, Calendar, Clock } from 'lucide-react'

const RelatoriosDashboard = () => {
  const [historico, setHistorico] = useState([])
  const [dadosFiltrados, setDadosFiltrados] = useState([])
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    turno: 'todos'
  })

  useEffect(() => {
    // Carregar dados do localStorage
    const dados = JSON.parse(localStorage.getItem('controle-producao-historico') || '[]')
    setHistorico(dados)
    setDadosFiltrados(dados)
  }, [])

  const aplicarFiltros = () => {
    let dadosFiltered = [...historico]

    // Filtro por data
    if (filtros.dataInicio) {
      dadosFiltered = dadosFiltered.filter(item => item.data >= filtros.dataInicio)
    }
    if (filtros.dataFim) {
      dadosFiltered = dadosFiltered.filter(item => item.data <= filtros.dataFim)
    }

    // Filtro por turno
    if (filtros.turno !== 'todos') {
      dadosFiltered = dadosFiltered.filter(item => item.turno === filtros.turno)
    }

    setDadosFiltrados(dadosFiltered)
  }

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      turno: 'todos'
    })
    setDadosFiltrados(historico)
  }

  // Preparar dados para gráficos
  const prepararDadosMotivosParada = () => {
    const motivos = {}
    
    dadosFiltrados.forEach(item => {
      if (item.paradas) {
        item.paradas.forEach(parada => {
          if (motivos[parada.motivo]) {
            motivos[parada.motivo] += 1
          } else {
            motivos[parada.motivo] = 1
          }
        })
      }
    })

    return Object.entries(motivos).map(([motivo, quantidade]) => ({
      motivo,
      quantidade
    }))
  }

  const prepararDadosDuracaoParadas = () => {
    const duracoes = {}
    
    dadosFiltrados.forEach(item => {
      if (item.paradas) {
        item.paradas.forEach(parada => {
          const [horas, minutos] = parada.duracao.split(':').map(Number)
          const duracaoMinutos = horas * 60 + minutos
          
          if (duracoes[parada.motivo]) {
            duracoes[parada.motivo] += duracaoMinutos
          } else {
            duracoes[parada.motivo] = duracaoMinutos
          }
        })
      }
    })

    return Object.entries(duracoes).map(([motivo, minutos]) => ({
      motivo,
      duracao: Math.round(minutos / 60 * 100) / 100 // Converter para horas com 2 decimais
    }))
  }

  const prepararDadosProducao = () => {
    return dadosFiltrados.map(item => ({
      data: item.data,
      toneladas: parseFloat(item.toneladas) || 0,
      producaoPorHora: parseFloat(item.producaoPorHora) || 0,
      turno: `Turno ${item.turno}`
    }))
  }

  const dadosMotivosParada = prepararDadosMotivosParada()
  const dadosDuracaoParadas = prepararDadosDuracaoParadas()
  const dadosProducao = prepararDadosProducao()

  // Cores para os gráficos
  const CORES = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  const formatarData = (data) => {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  if (historico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Nenhum relatório encontrado</h2>
        <p className="text-gray-500 mb-4">
          Ainda não há dados salvos para exibir relatórios.
        </p>
        <p className="text-sm text-gray-400">
          Vá para a aba "Novo Registro" e salve alguns dados para visualizar os relatórios aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="turno">Turno</Label>
              <Select value={filtros.turno} onValueChange={(value) => setFiltros(prev => ({ ...prev, turno: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Turnos</SelectItem>
                  <SelectItem value="1">Turno 1</SelectItem>
                  <SelectItem value="2">Turno 2</SelectItem>
                  <SelectItem value="3">Turno 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-600">Total de Registros</div>
                <div className="text-2xl font-bold">{dadosFiltrados.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-600">Produção Total</div>
                <div className="text-2xl font-bold">
                  {dadosProducao.reduce((total, item) => total + item.toneladas, 0).toFixed(1)}t
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-sm text-gray-600">Total de Paradas</div>
                <div className="text-2xl font-bold">
                  {dadosFiltrados.reduce((total, item) => total + (item.paradas?.length || 0), 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-sm text-gray-600">Produção Média/h</div>
                <div className="text-2xl font-bold">
                  {dadosProducao.length > 0 
                    ? (dadosProducao.reduce((total, item) => total + item.producaoPorHora, 0) / dadosProducao.length).toFixed(2)
                    : '0.00'
                  }t/h
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Produção */}
      {dadosProducao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📈 Produção por Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosProducao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tickFormatter={formatarData} />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Data: ${formatarData(value)}`}
                  formatter={(value, name) => [
                    name === 'toneladas' ? `${value}t` : `${value}t/h`,
                    name === 'toneladas' ? 'Toneladas' : 'Produção/Hora'
                  ]}
                />
                <Bar dataKey="toneladas" fill="#0088FE" name="toneladas" />
                <Bar dataKey="producaoPorHora" fill="#00C49F" name="producaoPorHora" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráficos de Paradas */}
      {dadosMotivosParada.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Motivos de Parada */}
          <Card>
            <CardHeader>
              <CardTitle>🥧 Motivos de Parada (Quantidade)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosMotivosParada}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ motivo, quantidade }) => `${motivo}: ${quantidade}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {dadosMotivosParada.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Barras - Duração das Paradas */}
          <Card>
            <CardHeader>
              <CardTitle>⏱️ Duração das Paradas (Horas)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosDuracaoParadas} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="motivo" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value}h`, 'Duração']} />
                  <Bar dataKey="duracao" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Registros Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dadosFiltrados.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{formatarData(item.data)}</Badge>
                    <Badge>Turno {item.turno}</Badge>
                    <span className="font-medium">{item.operador}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Produção</div>
                    <div className="font-bold">{item.toneladas}t ({item.producaoPorHora}t/h)</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700">Paradas:</div>
                    {item.paradas?.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {item.paradas.map((parada, idx) => (
                          <li key={idx}>{parada.motivo} ({parada.duracao})</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">Nenhuma parada registrada</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Tempo Efetivo:</div>
                    <div>{item.tempoEfetivo}</div>
                    {item.testeZeroGraos?.length > 0 && (
                      <>
                        <div className="font-medium text-gray-700 mt-2">Testes Zero Grãos:</div>
                        <div>{item.testeZeroGraos.length} testes realizados</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RelatoriosDashboard

