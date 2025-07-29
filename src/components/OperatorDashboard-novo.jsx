import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trash2, Plus, Save, Clock } from 'lucide-react'
import ReportGenerator from './ReportGenerator.jsx'

const OperatorDashboard = () => {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    operador: '',
    toneladas: '',
    turno: '',
    horarioTurno: '', // Novo campo para horário do turno em HH:MM
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
    resultado: '',
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
      
      setNovoTeste({ horario: '', resultado: '', status: 'OK' })
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

  const salvarDados = () => {
    const dados = {
      ...formData,
      silos,
      paradas,
      testeZeroGraos,
      observacoes,
      tempoEfetivo: calcularTempoEfetivo(),
      timestamp: new Date().toISOString()
    }
    
    console.log('Dados salvos:', dados)
    
    // Aqui você pode implementar a lógica para salvar no localStorage ou enviar para um servidor
    localStorage.setItem('controle-producao', JSON.stringify(dados))
    
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {turnos.map(turno => (
                    <SelectItem key={turno.value} value={turno.value}>
                      {turno.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="horarioTurno">Horário de Turno de Trabalho</Label>
              <Input
                id="horarioTurno"
                type="time"
                value={formData.horarioTurno}
                onChange={(e) => handleInputChange('horarioTurno', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estoque de Produto */}
      <Card>
        <CardHeader>
          <CardTitle>Estoque de Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Quantidade</th>
                  <th className="border border-gray-300 p-2 text-left">Ton.</th>
                  <th className="border border-gray-300 p-2 text-left">Horas Trabalhadas</th>
                </tr>
              </thead>
              <tbody>
                {silos.map(silo => (
                  <tr key={silo.id}>
                    <td className="border border-gray-300 p-2 font-medium">{silo.nome}</td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={silo.estoque}
                        onChange={(e) => handleSiloChange(silo.id, 'estoque', e.target.value)}
                        className="w-full"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="time"
                        value={silo.horasTrabalhadas}
                        onChange={(e) => handleSiloChange(silo.id, 'horasTrabalhadas', e.target.value)}
                        className="w-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Teste Zero Grãos */}
      <Card>
        <CardHeader>
          <CardTitle>Teste Zero Grãos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Horário</th>
                  <th className="border border-gray-300 p-2 text-left">Resultado</th>
                  <th className="border border-gray-300 p-2 text-left">Status</th>
                  <th className="border border-gray-300 p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {testeZeroGraos.map(teste => (
                  <tr key={teste.id}>
                    <td className="border border-gray-300 p-2">{teste.horario}</td>
                    <td className="border border-gray-300 p-2">{teste.resultado}</td>
                    <td className="border border-gray-300 p-2">
                      <Badge variant={teste.status === 'OK' ? 'default' : 'destructive'}>
                        {teste.status}
                      </Badge>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerTesteZeroGraos(teste.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="horarioTeste">Horário</Label>
              <Input
                id="horarioTeste"
                type="time"
                value={novoTeste.horario}
                onChange={(e) => setNovoTeste(prev => ({ ...prev, horario: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="resultadoTeste">Resultado</Label>
              <Input
                id="resultadoTeste"
                placeholder="Digite o resultado"
                value={novoTeste.resultado}
                onChange={(e) => setNovoTeste(prev => ({ ...prev, resultado: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="statusTeste">Status</Label>
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
            <Button onClick={adicionarTesteZeroGraos} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Paradas Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle>Paradas Operacionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Início</th>
                  <th className="border border-gray-300 p-2 text-left">Fim</th>
                  <th className="border border-gray-300 p-2 text-left">Duração</th>
                  <th className="border border-gray-300 p-2 text-left">Motivos</th>
                  <th className="border border-gray-300 p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paradas.map(parada => (
                  <tr key={parada.id}>
                    <td className="border border-gray-300 p-2">{parada.inicio}</td>
                    <td className="border border-gray-300 p-2">{parada.fim}</td>
                    <td className="border border-gray-300 p-2">{parada.duracao}</td>
                    <td className="border border-gray-300 p-2">{parada.motivo}</td>
                    <td className="border border-gray-300 p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removerParada(parada.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="inicioParada">Início</Label>
              <Input
                id="inicioParada"
                type="time"
                value={novaParada.inicio}
                onChange={(e) => setNovaParada(prev => ({ ...prev, inicio: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="fimParada">Fim</Label>
              <Input
                id="fimParada"
                type="time"
                value={novaParada.fim}
                onChange={(e) => setNovaParada(prev => ({ ...prev, fim: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="motivoParada">Motivo</Label>
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
            <Button onClick={adicionarParada} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Parada
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tempo Efetivo de Trabalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo Efetivo de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {calcularTempoEfetivo()}
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
            placeholder="Digite suas observações sobre o processo..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Gerador de Relatório */}
      <ReportGenerator 
        formData={{
          ...formData,
          silos,
          paradas,
          testeZeroGraos,
          observacoes,
          tempoEfetivo: calcularTempoEfetivo()
        }}
      />

      {/* Botão Salvar */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={salvarDados} className="w-full flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar Dados
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default OperatorDashboard

