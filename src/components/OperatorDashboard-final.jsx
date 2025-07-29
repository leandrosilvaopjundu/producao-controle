import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Plus, Trash2, Save } from 'lucide-react'
import ReportGenerator from './ReportGenerator'

const OperatorDashboard = () => {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    operador: '',
    visto: '',
    turno: '',
    toneladas: ''
  })

  const [silos, setSilos] = useState([
    { id: 1, nome: 'Silo 1 - CN #09', estoque: '', horasTrabalhadas: '' },
    { id: 2, nome: 'Silo 2 - CN #09', estoque: '', horasTrabalhadas: '' },
    { id: 3, nome: 'Silo 3 - CE #09', estoque: '', horasTrabalhadas: '' },
    { id: 4, nome: 'Silo 4 - CE #16', estoque: '', horasTrabalhadas: '' },
    { id: 5, nome: 'Silo 5 - CN #09', estoque: '', horasTrabalhadas: '' }
  ])

  const [paradas, setParadas] = useState([])
  const [novaParada, setNovaParada] = useState({
    inicio: '',
    fim: '',
    motivo: '',
    duracao: ''
  })

  const [testeZeroGraos, setTesteZeroGraos] = useState([])
  const [novoTeste, setNovoTeste] = useState({
    horario: '',
    status: 'OK'
  })

  const [observacoes, setObservacoes] = useState('')

  const motivosParada = [
    'Diálogo de segurança',
    'Manutenção',
    'Limpeza',
    'Inspeção',
    'Verificação',
    'Parada na alimentação',
    'Troca de turno',
    'Intervalo',
    'Lanche/Almoço',
    'Outros'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSiloChange = (id, field, value) => {
    setSilos(prev => prev.map(silo => 
      silo.id === id ? { ...silo, [field]: value } : silo
    ))
  }

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

  useEffect(() => {
    if (novaParada.inicio && novaParada.fim) {
      const duracao = calcularDuracao(novaParada.inicio, novaParada.fim)
      setNovaParada(prev => ({ ...prev, duracao }))
    }
  }, [novaParada.inicio, novaParada.fim])

  const adicionarParada = () => {
    if (novaParada.inicio && novaParada.fim && novaParada.motivo) {
      const parada = {
        id: Date.now(),
        ...novaParada
      }
      setParadas(prev => [...prev, parada])
      setNovaParada({ inicio: '', fim: '', motivo: '', duracao: '' })
    }
  }

  const removerParada = (id) => {
    setParadas(prev => prev.filter(parada => parada.id !== id))
  }

  const adicionarTesteZeroGraos = () => {
    if (novoTeste.horario && novoTeste.status) {
      const teste = {
        id: Date.now(),
        ...novoTeste
      }
      setTesteZeroGraos(prev => [...prev, teste])
      setNovoTeste({ horario: '', status: 'OK' })
    }
  }

  const removerTesteZeroGraos = (id) => {
    setTesteZeroGraos(prev => prev.filter(teste => teste.id !== id))
  }

  const calcularTempoEfetivo = () => {
    const totalParadas = paradas.reduce((total, parada) => {
      if (parada.duracao) {
        const [horas, minutos] = parada.duracao.split(':').map(Number)
        return total + (horas * 60) + minutos
      }
      return total
    }, 0)

    // Tempo total do turno em minutos (assumindo 8 horas = 480 minutos)
    const tempoTotalTurno = 480
    const tempoEfetivo = tempoTotalTurno - totalParadas

    const horas = Math.floor(tempoEfetivo / 60)
    const minutos = tempoEfetivo % 60

    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
  }

  const calcularProducaoPorHora = () => {
    const toneladas = parseFloat(formData.toneladas) || 0
    const tempoEfetivo = calcularTempoEfetivo()
    
    if (!tempoEfetivo || toneladas === 0) return '0.00'
    
    const [horas, minutos] = tempoEfetivo.split(':').map(Number)
    const tempoEfetivoHoras = horas + (minutos / 60)
    
    if (tempoEfetivoHoras === 0) return '0.00'
    
    const producaoPorHora = toneladas / tempoEfetivoHoras
    return producaoPorHora.toFixed(2)
  }

  const salvarDados = () => {
    const dados = {
      ...formData,
      silos,
      paradas,
      testeZeroGraos,
      observacoes,
      tempoEfetivo: calcularTempoEfetivo(),
      producaoPorHora: calcularProducaoPorHora(),
      timestamp: new Date().toISOString()
    }
    
    console.log('Dados salvos:', dados)
    
    // Salvar no localStorage para histórico
    const historico = JSON.parse(localStorage.getItem('controle-producao-historico') || '[]')
    historico.push(dados)
    localStorage.setItem('controle-producao-historico', JSON.stringify(historico))
    
    // Salvar dados atuais
    localStorage.setItem('controle-producao-atual', JSON.stringify(dados))
    
    alert('Dados salvos com sucesso!')
  }

  return (
    <div className="space-y-6">
      {/* Registro de Produção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔒 Registro de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => handleInputChange('data', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="operador">Nome do Operador</Label>
              <Input
                id="operador"
                placeholder="Digite o nome do operador"
                value={formData.operador}
                onChange={(e) => handleInputChange('operador', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="visto">Visto</Label>
              <Input
                id="visto"
                placeholder="Visto do operador"
                value={formData.visto}
                onChange={(e) => handleInputChange('visto', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="toneladas">Toneladas Produzidas</Label>
              <Input
                id="toneladas"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.toneladas}
                onChange={(e) => handleInputChange('toneladas', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="turno">Turno</Label>
              <Select value={formData.turno} onValueChange={(value) => handleInputChange('turno', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Turno 1 (00:05 - 07:52)</SelectItem>
                  <SelectItem value="2">Turno 2 (07:45 - 16:05)</SelectItem>
                  <SelectItem value="3">Turno 3 (16:05 - 00:08)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estoque de Produto */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Estoque de Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {silos.map(silo => (
              <div key={silo.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="font-medium flex items-center">
                  {silo.nome}
                </div>
                <div>
                  <Label htmlFor={`estoque-${silo.id}`}>Quantidade (Ton.)</Label>
                  <Input
                    id={`estoque-${silo.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={silo.estoque}
                    onChange={(e) => handleSiloChange(silo.id, 'estoque', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`horas-${silo.id}`}>Horas Trabalhadas</Label>
                  <Input
                    id={`horas-${silo.id}`}
                    type="text"
                    placeholder="HH:MM"
                    pattern="[0-9]{2}:[0-9]{2}"
                    value={silo.horasTrabalhadas}
                    onChange={(e) => handleSiloChange(silo.id, 'horasTrabalhadas', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teste Zero Grãos com Rolagem */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste Zero Grãos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="teste-horario">Horário</Label>
              <Input
                id="teste-horario"
                type="time"
                value={novoTeste.horario}
                onChange={(e) => setNovoTeste(prev => ({ ...prev, horario: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="teste-status">Resultado</Label>
              <Select 
                value={novoTeste.status} 
                onValueChange={(value) => setNovoTeste(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OK">OK</SelectItem>
                  <SelectItem value="R">R</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={adicionarTesteZeroGraos} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Teste
              </Button>
            </div>
          </div>

          {testeZeroGraos.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Testes Registrados:</h4>
              {/* Área com rolagem para os testes */}
              <div 
                className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50"
                style={{ maxHeight: '16rem' }}
              >
                {testeZeroGraos.map(teste => (
                  <div key={teste.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{teste.horario}</Badge>
                      <Badge variant={teste.status === 'OK' ? 'default' : 'destructive'}>
                        {teste.status}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerTesteZeroGraos(teste.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paradas Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle>⏸️ Paradas Operacionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="inicio">Início</Label>
              <Input
                id="inicio"
                type="time"
                value={novaParada.inicio}
                onChange={(e) => setNovaParada(prev => ({ ...prev, inicio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="fim">Fim</Label>
              <Input
                id="fim"
                type="time"
                value={novaParada.fim}
                onChange={(e) => setNovaParada(prev => ({ ...prev, fim: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="motivo">Motivo</Label>
              <Select 
                value={novaParada.motivo} 
                onValueChange={(value) => setNovaParada(prev => ({ ...prev, motivo: value }))}
              >
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
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Parada
              </Button>
            </div>
          </div>

          {novaParada.duracao && (
            <div className="text-sm text-muted-foreground">
              Duração calculada: {novaParada.duracao}
            </div>
          )}

          {paradas.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Paradas Registradas:</h4>
              <div className="space-y-2">
                {paradas.map(parada => (
                  <div key={parada.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{parada.inicio} - {parada.fim}</Badge>
                      <Badge variant="secondary">{parada.duracao}</Badge>
                      <span className="text-sm">{parada.motivo}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removerParada(parada.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Observações / Atuações no Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Digite suas observações sobre o processo..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Tempo Efetivo e Produção por Hora */}
      <Card>
        <CardHeader>
          <CardTitle>⏱️ Tempo Efetivo de Trabalho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Tempo Efetivo</div>
              <div className="text-2xl font-bold text-blue-700">{calcularTempoEfetivo()}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Produção por Hora</div>
              <div className="text-2xl font-bold text-green-700">{calcularProducaoPorHora()} t/h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerador de Relatório */}
      <ReportGenerator formData={{
        ...formData,
        silos,
        paradas,
        testeZeroGraos,
        observacoes,
        tempoEfetivo: calcularTempoEfetivo(),
        producaoPorHora: calcularProducaoPorHora()
      }} />

      {/* Botão Salvar */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={salvarDados} className="w-full" size="lg">
            <Save className="h-4 w-4 mr-2" />
            Salvar Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default OperatorDashboard

