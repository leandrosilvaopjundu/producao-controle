import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trash2, Plus, Save, Clock, Calculator, FileDown } from 'lucide-react'
import { salvarRegistro } from '../services/firebaseService.js'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const OperatorDashboard = () => {
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    operador: '',
    visto: '',
    hp: '00:00',
    toneladas: '',
    turno: '',
    horarioTurno: '',
    siloSelecionado: ''
  })

  const [paradas, setParadas] = useState([])
  const [novaParada, setNovaParada] = useState({
    inicio: '',
    fim: '',
    motivo: '',
    observacao: '' // MODIFICAÇÃO 4: Campo de observação adicionado
  })

  // MODIFICAÇÃO 4: Campos de estoque iniciam vazios (sem zero)
  const [silos, setSilos] = useState([
    { id: 1, nome: 'Silo 1 - CN #09', estoque: '', horasTrabalhadas: '' },
    { id: 2, nome: 'Silo 2 - CN #09', estoque: '', horasTrabalhadas: '' },
    { id: 3, nome: 'Silo 3 - CE #09', estoque: '', horasTrabalhadas: '' },
    { id: 4, nome: 'Silo 4 - CE #16', estoque: '', horasTrabalhadas: '' },
    { id: 5, nome: 'Silo 5 CN #09', estoque: '', horasTrabalhadas: '' }
  ])

  const [testeZeroGraos, setTesteZeroGraos] = useState([])
  const [novoTeste, setNovoTeste] = useState({
    horario: '',
    status: 'Sim',
    resultado: ''
  })

  const [observacoes, setObservacoes] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  const turnos = [
    { value: '1', label: 'Turno 1 (00h05 às 07h52)', duracao: '7h47', hp: '07:47' },
    { value: '2', label: 'Turno 2 (07h45 às 16h05)', duracao: '8h20', hp: '08:20' },
    { value: '3', label: 'Turno 3 (16h05 às 00h08)', duracao: '8h03', hp: '08:03' }
  ]

  // MODIFICAÇÃO 4: Novos motivos de parada e alteração
  const motivosParada = [
    'Diálogo de segurança',
    'Manutenção',
    'Limpeza',
    'Inspeção',
    'Verificação',
    'Parada na alimentação',
    'Troca de turno',
    'Intervalo', // Alterado de "Lanche/Almoço"
    'Engaiolamento', // Novo
    'Checklist', // Novo
    'Medição de Silos', // Novo
    'Outros'
  ]

  // Logo da empresa atualizada
  const logoJundu = 'data:image/png;base64,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'

  useEffect(() => {
    if (formData.turno) {
      const turnoSelecionado = turnos.find(t => t.value === formData.turno)
      if (turnoSelecionado) {
        setFormData(prev => ({
          ...prev,
          hp: turnoSelecionado.hp
        }))
      }
    }
  }, [formData.turno])

  const formatarData = (data) => {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

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
      
      setNovaParada({ inicio: '', fim: '', motivo: '', observacao: '' })
    }
  }

  const removerParada = (id) => {
    setParadas(prev => prev.filter(parada => parada.id !== id))
  }

  const adicionarTesteZeroGraos = () => {
    if (novoTeste.horario) {
      setTesteZeroGraos(prev => [{
        id: Date.now(),
        ...novoTeste
      }, ...prev])
      
      setNovoTeste({ horario: '', status: 'Sim', resultado: '' })
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

  const calcularProducaoPorHora = () => {
    const tempoEfetivo = calcularTempoEfetivo()
    const toneladas = parseFloat(formData.toneladas) || 0
    
    if (tempoEfetivo === '00:00' || toneladas === 0) return '0.00'
    
    const [horas, minutos] = tempoEfetivo.split(':')
    const tempoEfetivoHoras = parseInt(horas) + (parseInt(minutos) / 60)
    
    const producaoPorHora = toneladas / tempoEfetivoHoras
    return producaoPorHora.toFixed(2)
  }

  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const reportElement = document.createElement('div')
      reportElement.style.position = 'absolute'
      reportElement.style.left = '-9999px'
      reportElement.style.top = '0'
      reportElement.style.width = '794px'
      reportElement.style.padding = '40px'
      reportElement.style.backgroundColor = 'white'
      reportElement.style.fontFamily = 'Arial, sans-serif'
      reportElement.style.fontSize = '12px'
      reportElement.style.lineHeight = '1.4'
      
      const totalTestes = testeZeroGraos.length
      const testesOrdenados = [...testeZeroGraos].reverse()
      const linhasTesteZeroGrao = Math.ceil(totalTestes / 3) || 1
      
      reportElement.innerHTML = `
        <div style="border: 2px solid #000; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 10px;">
            <div style="border: 1px solid #000; padding: 10px; width: 120px; height: 60px; display: flex; align-items: center; justify-content: center;">
              <img src="${logoJundu}" alt="JUNDU" style="max-width: 100px; max-height: 50px; object-fit: contain;" />
            </div>
            <div style="font-size: 16px; font-weight: bold; text-align: center; flex: 1;">
              Controle Diário da Britagem / Moagem
            </div>
            <div style="border: 1px solid #000; padding: 5px; text-align: center;">
              <div>código: FOSJ17</div>
              <div>rev. 11</div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <div style="border: 1px solid #000; padding: 5px; flex: 1;">
              <strong>Operador (es):</strong> ${formData.operador || ''}
            </div>
            <div style="border: 1px solid #000; padding: 5px; width: 80px;">
              <strong>Visto:</strong> ${formData.visto || ''}
            </div>
            <div style="border: 1px solid #000; padding: 5px; width: 80px;">
              <strong>HP:</strong> ${formData.hp || ''}
            </div>
            <div style="border: 1px solid #000; padding: 5px; width: 100px;">
              <strong>Turno:</strong> ${formData.turno || ''}
            </div>
            <div style="border: 1px solid #000; padding: 5px; width: 120px;">
              <strong>Data:</strong> ${formatarData(formData.data) || ''}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Estoque de Produto</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Quantidade</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Silo 1 - CN #09</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Silo 2 - CN #09</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Silo 3 - CE #09</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Silo 4 - CE #16</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Silo 5 CN #09</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">Ton.</td>
                  ${silos.map(silo => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.estoque || '0'}</td>`).join('')}
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">Horas Trabalhadas</td>
                  ${silos.map(silo => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.horasTrabalhadas || '00:00'}</td>`).join('')}
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Teste Zero Grão</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 15%;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 18%;" colspan="2">Análise</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 15%;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 18%;" colspan="2">Análise</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 15%;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 19%;" colspan="2">Análise</th>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px;"></th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px; width: 9%;">Status</th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px; width: 9%;">Resultado</th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px;"></th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px; width: 9%;">Status</th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px; width: 9%;">Resultado</th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px;"></th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px; width: 9%;">Status</th>
                  <th style="border: 1px solid #000; padding: 3px; background-color: #f0f0f0; font-size: 10px; width: 10%;">Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({length: linhasTesteZeroGrao}, (_, i) => {
                  const teste1 = testesOrdenados[i * 3] || {}
                  const teste2 = testesOrdenados[i * 3 + 1] || {}
                  const teste3 = testesOrdenados[i * 3 + 2] || {}
                  return `
                    <tr>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste1.horario || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste1.status || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste1.resultado || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste2.horario || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste2.status || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste2.resultado || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste3.horario || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste3.status || ''}</td>
                      <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste3.resultado || ''}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Paradas Operacionais</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Início</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Fim</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Duração</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Motivos</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Observação</th>
                </tr>
              </thead>
              <tbody>
                ${paradas.map(parada => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.inicio}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.fim}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.duracao}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${parada.motivo}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${parada.observacao || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 5px;">* Observações / Atuações no Processo:</div>
            <div style="border: 1px solid #000; padding: 10px; min-height: 60px;">
              ${observacoes || ''}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between;">
            <div style="font-weight: bold;">Tempo Efetivo de Trabalho: ${calcularTempoEfetivo()}</div>
            <div style="font-weight: bold;">Produção por Hora: ${calcularProducaoPorHora()} t/h</div>
          </div>
        </div>
      `

      document.body.appendChild(reportElement)

      if (selectedFormat === 'pdf') {
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })

        document.body.removeChild(reportElement)

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 210
        const pageHeight = 295
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        let position = 0

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        const nomeArquivo = `controle_producao_${formatarData(formData.data).replace(/\//g, '_')}_turno${formData.turno}.pdf`
        pdf.save(nomeArquivo)
      } else {
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })

        document.body.removeChild(reportElement)

        const link = document.createElement('a')
        link.download = `controle_producao_${formatarData(formData.data).replace(/\//g, '_')}_turno${formData.turno}.jpg`
        link.href = canvas.toDataURL('image/jpeg', 0.9)
        link.click()
      }

    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const salvarDados = async () => {
    try {
      const dadosCompletos = {
        ...formData,
        silos,
        paradas,
        testeZeroGraos,
        observacoes,
        tempoEfetivo: calcularTempoEfetivo(),
        producaoPorHora: calcularProducaoPorHora(),
        timestamp: new Date().toISOString()
      }

      await salvarRegistro(dadosCompletos)
      alert('Dados salvos com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      alert('Erro ao salvar dados. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Controle de Produção</h1>
          <p className="text-gray-600">Controle Diário da Britagem / Moagem</p>
        </div>

        {/* MODIFICAÇÃO 4: Nome corrigido */}
        <Card>
          <CardHeader>
            <CardTitle>🔒 Registro de Produção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <Label htmlFor="operador">Operador(es)</Label>
                <Input
                  id="operador"
                  value={formData.operador}
                  onChange={(e) => handleInputChange('operador', e.target.value)}
                  placeholder="Nome do operador"
                />
              </div>
              <div>
                <Label htmlFor="visto">Visto</Label>
                <Input
                  id="visto"
                  value={formData.visto}
                  onChange={(e) => handleInputChange('visto', e.target.value)}
                  placeholder="Visto"
                />
              </div>
              <div>
                <Label htmlFor="hp">HP</Label>
                <Input
                  id="hp"
                  value={formData.hp}
                  onChange={(e) => handleInputChange('hp', e.target.value)}
                  placeholder="HP"
                />
              </div>
              <div>
                <Label htmlFor="turno">Turno</Label>
                <Select value={formData.turno} onValueChange={(value) => handleInputChange('turno', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {turnos.map((turno) => (
                      <SelectItem key={turno.value} value={turno.value}>
                        {turno.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="toneladas">Toneladas</Label>
                <Input
                  id="toneladas"
                  type="number"
                  value={formData.toneladas}
                  onChange={(e) => handleInputChange('toneladas', e.target.value)}
                  placeholder="Toneladas produzidas"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>📦 Estoque de Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {silos.map((silo) => (
                  <div key={silo.id} className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">{silo.nome}</Label>
                    <Input
                      type="number"
                      placeholder="Ton."
                      value={silo.estoque}
                      onChange={(e) => handleSiloChange(silo.id, 'estoque', e.target.value)}
                    />
                    <Input
                      type="time"
                      placeholder="Horas"
                      value={silo.horasTrabalhadas}
                      onChange={(e) => handleSiloChange(silo.id, 'horasTrabalhadas', e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🧪 Teste Zero Grãos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="time"
                    placeholder="Horário"
                    value={novoTeste.horario}
                    onChange={(e) => setNovoTeste(prev => ({ ...prev, horario: e.target.value }))}
                  />
                  <Select 
                    value={novoTeste.status} 
                    onValueChange={(value) => setNovoTeste(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Resultado"
                    value={novoTeste.resultado}
                    onChange={(e) => setNovoTeste(prev => ({ ...prev, resultado: e.target.value }))}
                  />
                  <Button onClick={adicionarTesteZeroGraos} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="border rounded-md p-2 max-h-64 overflow-y-auto">
                  {testeZeroGraos.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum teste adicionado</p>
                  ) : (
                    <div className="space-y-2">
                      {testeZeroGraos.map((teste) => (
                        <div key={teste.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex space-x-4">
                            <span className="font-medium">{teste.horario}</span>
                            <Badge variant={teste.status === 'Sim' ? 'default' : 'destructive'}>
                              {teste.status}
                            </Badge>
                            <span>{teste.resultado}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerTesteZeroGraos(teste.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MODIFICAÇÃO 4: Paradas com campo de observação */}
        <Card>
          <CardHeader>
            <CardTitle>⏸️ Paradas Operacionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input
                  type="time"
                  placeholder="Início"
                  value={novaParada.inicio}
                  onChange={(e) => setNovaParada(prev => ({ ...prev, inicio: e.target.value }))}
                />
                <Input
                  type="time"
                  placeholder="Fim"
                  value={novaParada.fim}
                  onChange={(e) => setNovaParada(prev => ({ ...prev, fim: e.target.value }))}
                />
                <Select 
                  value={novaParada.motivo} 
                  onValueChange={(value) => setNovaParada(prev => ({ ...prev, motivo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivosParada.map((motivo) => (
                      <SelectItem key={motivo} value={motivo}>
                        {motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Observação"
                  value={novaParada.observacao}
                  onChange={(e) => setNovaParada(prev => ({ ...prev, observacao: e.target.value }))}
                />
                <Button onClick={adicionarParada} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
              
              <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                {paradas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhuma parada registrada</p>
                ) : (
                  <div className="space-y-2">
                    {paradas.map((parada) => (
                      <div key={parada.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex space-x-4 items-center">
                          <span>{parada.inicio} - {parada.fim}</span>
                          <Badge variant="outline">{parada.duracao}</Badge>
                          <span className="font-medium">{parada.motivo}</span>
                          {parada.observacao && <span className="text-sm text-gray-600">({parada.observacao})</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerParada(parada.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📝 Observações / Atuações no Processo</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Digite suas observações aqui..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📄 Resumo e Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{calcularTempoEfetivo()}</div>
                <div className="text-sm text-gray-600">Tempo Efetivo</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{calcularProducaoPorHora()}</div>
                <div className="text-sm text-gray-600">Ton/Hora</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{paradas.length}</div>
                <div className="text-sm text-gray-600">Paradas</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={salvarDados} className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Salvar Dados
              </Button>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="formato">Formato:</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={generateReport} 
                disabled={isGenerating}
                variant="outline"
                className="flex items-center"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {isGenerating ? 'Gerando...' : `Gerar Relatório ${selectedFormat.toUpperCase()}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default OperatorDashboard

