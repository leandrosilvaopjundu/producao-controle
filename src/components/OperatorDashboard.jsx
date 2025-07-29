import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trash2, Plus, Save, Clock, Calculator } from 'lucide-react'
import ReportGenerator from './ReportGenerator.jsx'
import { salvarRegistro } from '../services/firebaseService.js'

const OperatorDashboard = () => {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    operador: '',
    visto: '', // Novo campo Visto
    hp: '08:03', // Campo HP com valor padrão
    toneladas: '',
    turno: '',
    horarioTurno: '',
    siloSelecionado: ''
  })

  const [paradas, setParadas] = useState([])
  const [novaParada, setNovaParada] = useState({
    inicio: '',
    fim: '',
    motivo: ''
  })

  const [silos, setSilos] = useState([
    { id: 1, nome: 'Silo 1 - CN #09', estoque: 0, horasTrabalhadas: '' },
    { id: 2, nome: 'Silo 2 - CN #09', estoque: 0, horasTrabalhadas: '' },
    { id: 3, nome: 'Silo 3 - CE #09', estoque: 0, horasTrabalhadas: '' },
    { id: 4, nome: 'Silo 4 - CE #16', estoque: 0, horasTrabalhadas: '' },
    { id: 5, nome: 'Silo 5 CN #09', estoque: 0, horasTrabalhadas: '' }
  ])

  const [testeZeroGraos, setTesteZeroGraos] = useState([])
  const [novoTeste, setNovoTeste] = useState({
    horario: '',
    status: 'OK'
  })

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
    'Parada na alimentação',
    'Troca de turno',
    'Lanche/Almoço',
    'Outros'
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSiloChange = (siloId, field, value) => {
    setSilos(prev => prev.map(silo => 
      silo.id === siloId ? { ...silo, [field]: value } : silo
    ))
  }

  const adicionarParada = () => {
    if (novaParada.inicio && novaParada.fim && novaParada.motivo) {
      const inicio = new Date(`2000-01-01T${novaParada.inicio}:00`)
      const fim = new Date(`2000-01-01T${novaParada.fim}:00`)
      
      if (fim < inicio) {
        fim.setDate(fim.getDate() + 1)
      }
      
      const duracaoMs = fim - inicio
      const horas = Math.floor(duracaoMs / (1000 * 60 * 60))
      const minutos = Math.floor((duracaoMs % (1000 * 60 * 60)) / (1000 * 60))
      const duracao = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`

      setParadas(prev => [...prev, {
        id: Date.now(),
        ...novaParada,
        duracao
      }])
      
      setNovaParada({ inicio: '', fim: '', motivo: '' })
    }
  }

  const removerParada = (id) => {
    setParadas(prev => prev.filter(parada => parada.id !== id))
  }

  const adicionarTesteZeroGraos = () => {
    if (novoTeste.horario) {
      setTesteZeroGraos(prev => [...prev, {
        id: Date.now(),
        ...novoTeste
      }])
      
      setNovoTeste({ horario: '', status: 'OK' })
    }
  }

  const removerTesteZeroGraos = (id) => {
    setTesteZeroGraos(prev => prev.filter(teste => teste.id !== id))
  }

  const calcularTempoEfetivo = () => {
    const turnoSelecionado = turnos.find(t => t.value === formData.turno)
    if (!turnoSelecionado) return '00:00'

    const duracaoTurno = turnoSelecionado.duracao
    const [horas, minutos] = duracaoTurno.replace('h', ':').split(':')
    const totalMinutosTurno = parseInt(horas) * 60 + parseInt(minutos)

    const totalMinutosParadas = paradas.reduce((total, parada) => {
      const [h, m] = parada.duracao.split(':')
      return total + (parseInt(h) * 60 + parseInt(m))
    }, 0)

    const tempoEfetivoMinutos = totalMinutosTurno - totalMinutosParadas
    const horasEfetivas = Math.floor(tempoEfetivoMinutos / 60)
    const minutosEfetivos = tempoEfetivoMinutos % 60

    return `${horasEfetivas.toString().padStart(2, '0')}:${minutosEfetivos.toString().padStart(2, '0')}`
  }

  // Nova função para calcular produção por hora
  const calcularProducaoPorHora = () => {
    const tempoEfetivo = calcularTempoEfetivo()
    const toneladas = parseFloat(formData.toneladas) || 0
    
    if (tempoEfetivo === '00:00' || toneladas === 0) return '0.00'
    
    const [horas, minutos] = tempoEfetivo.split(':')
    const tempoEfetivoHoras = parseInt(horas) + (parseInt(minutos) / 60)
    
    const producaoPorHora = toneladas / tempoEfetivoHoras
    return producaoPorHora.toFixed(2)
  }

  const salvarDados = async () => {
    const dadosParaSalvar = {
      ...formData,
      silos,
      paradas,
      testeZeroGraos,
      observacoes,
      tempoEfetivo: calcularTempoEfetivo(),
      producaoPorHora: calcularProducaoPorHora(),
      timestamp: new Date().toISOString()
    }

    try {
      // Salvar no Firebase
      await salvarRegistro(dadosParaSalvar)

      // Salvar no localStorage para histórico (mantido para compatibilidade ou offline)
      const historico = JSON.parse(localStorage.getItem("controle-producao-historico") || "[]");
      historico.push(dadosParaSalvar);
      localStorage.setItem("controle-producao-historico", JSON.stringify(historico));

      // Salvar dados atuais no localStorage
      localStorage.setItem("controle-producao-atual", JSON.stringify(dadosParaSalvar));

      alert("Registro salvo com sucesso no Firebase!");

    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert(`Erro ao salvar registro: ${error.message}`);
    }
  };

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
                placeholder="Visto do supervisor"
                value={formData.visto}
                onChange={(e) => handleInputChange('visto', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="hp">HP (Horas Previstas)</Label>
              <Input
                id="hp"
                type="time"
                value={formData.hp}
                onChange={(e) => handleInputChange('hp', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="turno">Turno</Label>
              <Select value={formData.turno} onValueChange={(value) => handleInputChange('turno', value)}>
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
                <div>
                  <Label className="font-medium">{silo.nome}</Label>
                </div>
                <div>
                  <Label htmlFor={`estoque-${silo.id}`}>Toneladas</Label>
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
                  <Label htmlFor={`horas-${silo.id}`}>Horas Trabalhadas (HH:MM)</Label>
                  <Input
                    id={`horas-${silo.id}`}
                    type="time"
                    value={silo.horasTrabalhadas}
                    onChange={(e) => handleSiloChange(silo.id, 'horasTrabalhadas', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teste Zero Grãos */}
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
              <div className="space-y-2">
                {testeZeroGraos.map(teste => (
                  <div key={teste.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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

          {paradas.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Paradas Registradas:</h4>
              <div className="space-y-2">
                {paradas.map(parada => (
                  <div key={parada.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{parada.inicio} - {parada.fim}</Badge>
                      <Badge variant="secondary">{parada.duracao}</Badge>
                      <span className="text-sm text-gray-600">{parada.motivo}</span>
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
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo Efetivo de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Tempo Efetivo</div>
              <div className="text-2xl font-bold text-blue-800">{calcularTempoEfetivo()}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Produção por Hora
              </div>
              <div className="text-2xl font-bold text-green-800">{calcularProducaoPorHora()} t/h</div>
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
            <Save className="h-5 w-5 mr-2" />
            Salvar Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default OperatorDashboard

