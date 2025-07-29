import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trash2, Plus, Save, LogOut } from 'lucide-react'
import ReportGenerator from './ReportGenerator.jsx'

const OperatorDashboard = ({ user, onLogout }) => {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    operador: user.username,
    toneladas: '',
    turno: '',
    horarioInicio: '',
    siloSelecionado: ''
  })

  const [paradas, setParadas] = useState([])
  const [novaParada, setNovaParada] = useState({
    inicio: '',
    fim: '',
    motivo: ''
  })

  const [silos, setSilos] = useState([
    { id: 1, nome: 'Silo 1', estoque: 0, horasTrabalhadas: 0 },
    { id: 2, nome: 'Silo 2', estoque: 0, horasTrabalhadas: 0 },
    { id: 3, nome: 'Silo 3', estoque: 0, horasTrabalhadas: 0 },
    { id: 4, nome: 'Silo 4', estoque: 0, horasTrabalhadas: 0 },
    { id: 5, nome: 'Silo 5', estoque: 0, horasTrabalhadas: 0 }
  ])

  const [observacoes, setObservacoes] = useState('')

  const turnos = [
    { value: '1', label: 'Turno 1 (00h05 às 07h52)', duracao: '7h47' },
    { value: '2', label: 'Turno 2 (07h45 às 16h05)', duracao: '8h20' },
    { value: '3', label: 'Turno 3 (16h05 às 00h08)', duracao: '8h03' }
  ]

  const motivosParada = [
    'Diálogo de segurança',
    'Manutenção',
    'Limpeza',
    'Inspeção',
    'Verificação',
    'Paradas na alimentação',
    'Intervalo',
    'Engaiolamento de pedras no britador',
    'Medição dos silos',
    'Troca de turnos'
  ]

  const calcularDuracao = (inicio, fim) => {
    if (!inicio || !fim) return ''
    
    const [horaInicio, minutoInicio] = inicio.split(':').map(Number)
    const [horaFim, minutoFim] = fim.split(':').map(Number)
    
    let totalMinutos = (horaFim * 60 + minutoFim) - (horaInicio * 60 + minutoInicio)
    
    if (totalMinutos < 0) {
      totalMinutos += 24 * 60 // Adiciona 24 horas se passou da meia-noite
    }
    
    const horas = Math.floor(totalMinutos / 60)
    const minutos = totalMinutos % 60
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
  }

  const adicionarParada = () => {
    if (novaParada.inicio && novaParada.fim && novaParada.motivo) {
      const duracao = calcularDuracao(novaParada.inicio, novaParada.fim)
      setParadas([...paradas, { ...novaParada, duracao, id: Date.now() }])
      setNovaParada({ inicio: '', fim: '', motivo: '' })
    }
  }

  const removerParada = (id) => {
    setParadas(paradas.filter(p => p.id !== id))
  }

  const calcularTempoEfetivo = () => {
    const turnoSelecionado = turnos.find(t => t.value === formData.turno)
    if (!turnoSelecionado) return '00:00'
    
    const duracaoTurno = turnoSelecionado.duracao
    const [horasTurno, minutosTurno] = duracaoTurno.split('h').map(str => parseInt(str) || 0)
    const totalMinutosTurno = horasTurno * 60 + minutosTurno
    
    const totalMinutosParadas = paradas.reduce((total, parada) => {
      const [horas, minutos] = parada.duracao.split(':').map(Number)
      return total + (horas * 60 + minutos)
    }, 0)
    
    const tempoEfetivoMinutos = totalMinutosTurno - totalMinutosParadas
    const horas = Math.floor(tempoEfetivoMinutos / 60)
    const minutos = tempoEfetivoMinutos % 60
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
  }

  const salvarDados = () => {
    const dados = {
      formData,
      paradas,
      silos,
      observacoes,
      tempoEfetivo: calcularTempoEfetivo(),
      timestamp: new Date().toISOString()
    }
    
    // Simular salvamento (em um sistema real, enviaria para o backend)
    localStorage.setItem('controle-producao', JSON.stringify(dados))
    alert('Dados salvos com sucesso!')
  }

  // Auto-save a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      salvarDados()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [formData, paradas, silos, observacoes])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">JUNDU</h1>
            <p className="text-slate-300">Controle Diário da Britagem / Moagem</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-slate-300">Operador</p>
            </div>
            <Button variant="outline" onClick={onLogout} className="text-slate-800">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Dados do Operador */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Operador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({...formData, data: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="operador">Operador</Label>
                <Input
                  id="operador"
                  value={formData.operador}
                  disabled
                  className="bg-slate-100"
                />
              </div>
              
              <div>
                <Label htmlFor="toneladas">Toneladas Produzidas</Label>
                <Input
                  id="toneladas"
                  type="number"
                  value={formData.toneladas}
                  onChange={(e) => setFormData({...formData, toneladas: e.target.value})}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="turno">Turno</Label>
                <Select value={formData.turno} onValueChange={(value) => setFormData({...formData, turno: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {turnos.map(turno => (
                      <SelectItem key={turno.value} value={turno.value}>
                        {turno.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="horarioInicio">Horário de Início</Label>
                <Input
                  id="horarioInicio"
                  type="time"
                  value={formData.horarioInicio}
                  onChange={(e) => setFormData({...formData, horarioInicio: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estoque de Produto (Silos) */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque de Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {silos.map(silo => (
                <div key={silo.id} className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-medium text-sm">{silo.nome}</h3>
                  <div>
                    <Label className="text-xs">Toneladas</Label>
                    <Input
                      type="number"
                      value={silo.estoque}
                      onChange={(e) => {
                        const novosSilos = silos.map(s => 
                          s.id === silo.id ? {...s, estoque: parseFloat(e.target.value) || 0} : s
                        )
                        setSilos(novosSilos)
                      }}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Horas Trabalhadas</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={silo.horasTrabalhadas}
                      onChange={(e) => {
                        const novosSilos = silos.map(s => 
                          s.id === silo.id ? {...s, horasTrabalhadas: parseFloat(e.target.value) || 0} : s
                        )
                        setSilos(novosSilos)
                      }}
                      className="h-8"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Paradas Operacionais */}
        <Card>
          <CardHeader>
            <CardTitle>Paradas Operacionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Adicionar Nova Parada */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="inicioParada">Início</Label>
                <Input
                  id="inicioParada"
                  type="time"
                  value={novaParada.inicio}
                  onChange={(e) => setNovaParada({...novaParada, inicio: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="fimParada">Fim</Label>
                <Input
                  id="fimParada"
                  type="time"
                  value={novaParada.fim}
                  onChange={(e) => setNovaParada({...novaParada, fim: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="motivoParada">Motivo</Label>
                <Select value={novaParada.motivo} onValueChange={(value) => setNovaParada({...novaParada, motivo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosParada.map(motivo => (
                      <SelectItem key={motivo} value={motivo}>
                        {motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={adicionarParada} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Lista de Paradas */}
            {paradas.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Paradas Registradas:</h4>
                {paradas.map(parada => (
                  <div key={parada.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex gap-4">
                      <Badge variant="outline">{parada.inicio} - {parada.fim}</Badge>
                      <Badge variant="secondary">{parada.duracao}</Badge>
                      <span className="text-sm">{parada.motivo}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removerParada(parada.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Tempo Efetivo */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Tempo Efetivo de Trabalho:</span>
                <Badge variant="default" className="bg-green-600 text-lg px-3 py-1">
                  {calcularTempoEfetivo()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações / Atuações no Processo</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite suas observações sobre o processo..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Gerador de Relatório */}
        <ReportGenerator 
          formData={formData}
          paradas={paradas}
          silos={silos}
          observacoes={observacoes}
          tempoEfetivo={calcularTempoEfetivo()}
          user={user}
        />

        {/* Botão Salvar */}
        <div className="flex justify-center">
          <Button onClick={salvarDados} size="lg" className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Salvar Dados
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OperatorDashboard

