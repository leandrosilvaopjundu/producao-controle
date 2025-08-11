import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trash2, Plus, Save, FileDown, Edit, RefreshCw } from 'lucide-react'
// Importar funções do nosso serviço Firebase unificado. O serviço lida com
// salvando e atualizando documentos do Firestore e enviando PDFs para o Firebase
// Armazenamento. Como este componente está localizado dentro de `src/components`,
// Precisamos percorrer um diretório e entrar em `services/firebaseService.js`.
// Ajuste o caminho relativo se a estrutura do seu projeto for diferente.
import { salvarRegistro, atualizarRegistro } from '../services/firebaseService.js'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// URL base do backend: utiliza a variável de ambiente ``VITE_BACKEND_URL`` se
// estiver definida. Caso contrário, assume o domínio público do serviço
// hospedado no Render. O valor é usado para enviar o PDF gerado ao
// servidor e receber um link permanente. Em produção, defina
// ``VITE_BACKEND_URL`` nas variáveis de ambiente do Vercel com o domínio do
// backend (por exemplo, ``https://producao-controle-backend.onrender.com``).
// No ambiente de desenvolvimento local, você ainda pode sobrescrever
// ``VITE_BACKEND_URL`` para ``http://localhost:5000``.
const backendBaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL
    ? import.meta.env.VITE_BACKEND_URL
    : 'https://producao-controle-backend.onrender.com'

  // A URL base para o backend é definida na constante ``backendBaseUrl`` acima.
  // Certifique‑se de definir ``VITE_BACKEND_URL`` no Vercel para evitar
  // apontar para localhost em produção. Caso contrário, o link gerado para
  // o PDF poderá ficar inacessível.


/**
 * Componente OperatorDashboard com checklist de equipamentos integrado.
 *
 * Este componente mantém todas as funcionalidades originais do relatório de produção,
 * incluindo registro de paradas, estoque, testes de zero grãos, observações e resumo.
 * Foi adicionado um card para checklist de equipamentos logo após as observações,
 * permitindo selecionar equipamentos, definir situação e adicionar observações.
 * Os itens do checklist são salvos junto com o registro e são renderizados
 * em uma tabela no PDF/JPG gerado, posicionada após o resumo operacional.
 */
const OperatorDashboard_FUNCTION = ({ dadosEdicao, onNovoRegistro }) => {
  // Estados originais para controle de edição
  const [modoEdicao, setModoEdicao] = useState(false)
  const [idRegistroEdicao, setIdRegistroEdicao] = useState(null)

  // Novo estado para armazenar o PDF gerado em formato Data URI.  Isso
  // permite persistir o PDF no Firestore mesmo sem utilizar o Firebase
  // Storage.  Note que armazenar PDFs no Firestore consome a cota de
  // tamanho por documento (1 MiB); se seus relatórios ficarem maiores que
  // isso, será necessário buscar outra solução.
  const [pdfData, setPdfData] = useState(null)

  // Novo estado para armazenar a URL pública do PDF após envio ao backend.
  // Se definido, esse link será salvo no Firestore e exibido no Histórico.
  const [pdfUrl, setPdfUrl] = useState(null)

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    operador: '',
    visto: '',
    hp: '00:00',
    toneladas: '',
    turno: '',
    horarioTurno: '',
    siloSelecionado: '',
    horasExtras: '00:00'
  })

  const [paradas, setParadas] = useState([])
  const [novaParada, setNovaParada] = useState({
    inicio: '',
    fim: '',
    motivo: '',
    observacao: ''
  })

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

  // A aplicação não utiliza mais o backend para geração de PDFs. O PDF é
  // construído no próprio navegador usando html2canvas e jsPDF, como na
  // versão original. Portanto, não precisamos definir a URL do backend aqui.

  // Novo: estados para checklist de equipamentos
  const [checklistItems, setChecklistItems] = useState([])
  const [novoChecklistItem, setNovoChecklistItem] = useState({
    equipamento: '',
    situacao: '',
    observacao: ''
  })

  // Descrição do equipamento selecionado para exibir o "O que verificar"
  const [descricaoEquipamento, setDescricaoEquipamento] = useState('')

  // Lista de turnos disponíveis
  const turnos = [
    { value: '1', label: 'Turno 1 (00h05 às 07h52)', duracao: '7h47', hp: '07:47' },
    { value: '2', label: 'Turno 2 (07h45 às 16h05)', duracao: '8h20', hp: '08:20' },
    { value: '3', label: 'Turno 3 (16h05 às 00h08)', duracao: '8h03', hp: '08:03' }
  ]

  // Motivos de paradas possíveis
  const motivosParada = [
    'DDS / EHS',
    'Manutenção',
    'Limpeza',
    'Inspeção',
    'Verificação',
    'Parada na alimentação',
    'Troca de turno',
    'Intervalo',
    'Engaiolamento',
    'Checklist',
    'Medição de Silos',
    'Outros',
    'Início do Processo'
  ]

  // Lista de equipamentos para seleção no checklist
  // Agora cada equipamento possui também a descrição de "O que verificar"
  const equipamentosChecklist = [
    {
      nome: 'Alimentador vibratório',
      verificacao: 'Conservação da chaparia, polias, correias e rolamentos.'
    },
    {
      nome: 'Britador de mandíbulas',
      verificacao: 'Conservação da chaparia, polias, correias, mancais, rolamentos e trincas.'
    },
    {
      nome: 'Compressor',
      verificacao: 'Tubulação e registros, estado de mangueiras e conexões, funcionamento dos marcadores, correias, vazamentos.'
    },
    {
      nome: 'Elevador de canecas',
      verificacao: 'Estrutura do equipamento, conservação e vedação dos flanges, do tapete, roletes de guia, correias, polias, canecas, mancais, rolos de tração e retorno.'
    },
    {
      nome: 'Moinho de martelo',
      verificacao: 'Correias, mancais e rolamentos, fixação do moinho e dos mancais, vazamento de pó na carcaça do moinho.'
    },
    {
      nome: 'Peneiras',
      verificacao: 'Estrutura do equipamento, conservação da chaparia, das molas, correias e polias, fixação e desgaste na bica de descarga, rolamentos.'
    },
    {
      nome: 'Rosca transportadora',
      verificacao: 'Fixação, chaparia, trincas, limpeza da rosca, rolamentos, mancais, vibração e vazamentos.'
    },
    {
      nome: 'Transp. de correias',
      verificacao: 'Redutor, conservação das polias, correias, acoplamentos, mancais, rolamentos, rolos de tração, roletes, raspadores, alinhamento da correia.'
    },
    {
      nome: 'Silos',
      verificacao: 'Luz de alerta, sirene e corda de medição.'
    },
    {
      nome: 'Exaustor',
      verificacao: 'Descarga, rolamentos, mancais, vazamentos.'
    },
    {
      nome: 'Escalpe',
      verificacao: 'Rolamentos, acoplamentos, vazamentos.'
    }
  ]

  // Situações possíveis para cada item do checklist
  const situacoesChecklist = ['OK', 'Vazamento', 'Limpeza', 'Verificar']

  // Logo em base64 (mesmo do relatório original)
  const logoJundu = 'data:image/png;base64,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'

  /**
   * Prepara os dados para a tabela de distribuição de paradas.
   * Retorna um array com nome do motivo, valor em minutos, tempo formatado e porcentagem.
   */
  const prepararDadosGraficoPizza = () => {
    const resumoPorMotivo = paradas.reduce((acc, parada) => {
      const [h, m] = parada.duracao.split(':')
      const duracaoMinutos = parseInt(h) * 60 + parseInt(m)
      acc[parada.motivo] = (acc[parada.motivo] || 0) + duracaoMinutos
      return acc
    }, {})

    const totalMinutosParadas = Object.values(resumoPorMotivo).reduce((sum, val) => sum + val, 0)

    return Object.keys(resumoPorMotivo).map(motivo => {
      const duracaoMinutos = resumoPorMotivo[motivo]
      const porcentagem = ((duracaoMinutos / totalMinutosParadas) * 100).toFixed(1)
      const horas = Math.floor(duracaoMinutos / 60)
      const minutos = duracaoMinutos % 60
      const tempoFormatado = `${horas.toString().padStart(2, '0')}h${minutos.toString().padStart(2, '0')}m`
      return {
        name: motivo,
        value: duracaoMinutos,
        tempo: tempoFormatado,
        porcentagem: parseFloat(porcentagem)
      }
    })
  }

  // Carregar dados de edição quando houver
  useEffect(() => {
    if (dadosEdicao) {
      setModoEdicao(true)
      setIdRegistroEdicao(dadosEdicao.id)
      // Carregar dados do formulário
      setFormData({
        data: dadosEdicao.data || new Date().toISOString().split('T')[0],
        operador: dadosEdicao.operador || '',
        visto: dadosEdicao.visto || '',
        hp: dadosEdicao.hp || '00:00',
        toneladas: dadosEdicao.toneladas || '',
        turno: dadosEdicao.turno || '',
        horarioTurno: dadosEdicao.horarioTurno || '',
        siloSelecionado: dadosEdicao.siloSelecionado || '',
        horasExtras: dadosEdicao.horasExtras || '00:00'
      })
      // Carregar silos
      if (dadosEdicao.silos) {
        setSilos(dadosEdicao.silos)
      }
      // Carregar paradas
      if (dadosEdicao.paradas) {
        setParadas(dadosEdicao.paradas)
      }
      // Carregar testes zero grãos
      if (dadosEdicao.testeZeroGraos) {
        setTesteZeroGraos(dadosEdicao.testeZeroGraos)
      }
      // Carregar observações
      if (dadosEdicao.observacoes) {
        setObservacoes(dadosEdicao.observacoes)
      }
      // Carregar checklist (se existir)
      if (dadosEdicao.checklist) {
        setChecklistItems(dadosEdicao.checklist)
      }
    } else {
      setModoEdicao(false)
      setIdRegistroEdicao(null)
      setChecklistItems([])
    }
  }, [dadosEdicao])

  // Atualizar HP quando turno é selecionado
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

  // Formatar data (yyyy-mm-dd -> dd/mm/yyyy)
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
    setSilos(prev => prev.map(silo => (silo.id === siloId ? { ...silo, [field]: value } : silo)))
  }

  // Adiciona parada à lista
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
      setParadas(prev => [...prev, { id: Date.now(), ...novaParada, duracao }])
      setNovaParada({ inicio: '', fim: '', motivo: '', observacao: '' })
    }
  }

  const removerParada = (id) => {
    setParadas(prev => prev.filter(parada => parada.id !== id))
  }

  // Adiciona teste zero grãos à lista (novoTeste é inserido no início para exibir em ordem decrescente)
  const adicionarTesteZeroGraos = () => {
    if (novoTeste.horario) {
      setTesteZeroGraos(prev => [{ id: Date.now(), ...novoTeste }, ...prev])
      setNovoTeste({ horario: '', status: 'Sim', resultado: '' })
    }
  }

  const removerTesteZeroGraos = (id) => {
    setTesteZeroGraos(prev => prev.filter(teste => teste.id !== id))
  }

  // Adiciona item de checklist
  const adicionarItemChecklist = () => {
    if (novoChecklistItem.equipamento && novoChecklistItem.situacao) {
      setChecklistItems(prev => [...prev, { ...novoChecklistItem, id: Date.now() }])
      setNovoChecklistItem({ equipamento: '', situacao: '', observacao: '' })
    }
  }

  const removerItemChecklist = (id) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id))
  }

  // Calcula tempo efetivo descontando paradas
  const calcularTempoEfetivo = () => {
    const turnoSelecionado = turnos.find(t => t.value === formData.turno)
    if (!turnoSelecionado) return '00:00'
    const [horas, minutos] = turnoSelecionado.duracao.replace('h', ':').split(':')
    let totalMinutosTurno = parseInt(horas) * 60 + parseInt(minutos)
    if (formData.horasExtras && formData.horasExtras !== '00:00') {
      const [horasExtras, minutosExtras] = formData.horasExtras.split(':')
      totalMinutosTurno += parseInt(horasExtras) * 60 + parseInt(minutosExtras)
    }
    const totalMinutosParadas = paradas.reduce((total, parada) => {
      const [h, m] = parada.duracao.split(':')
      return total + (parseInt(h) * 60 + parseInt(m))
    }, 0)
    const tempoEfetivoMinutos = totalMinutosTurno - totalMinutosParadas
    const horasEfetivas = Math.floor(tempoEfetivoMinutos / 60)
    const minutosEfetivos = tempoEfetivoMinutos % 60
    return `${horasEfetivas.toString().padStart(2, '0')}:${minutosEfetivos.toString().padStart(2, '0')}`
  }

  // Calcula produção por hora
  const calcularProducaoPorHora = () => {
    const tempoEfetivo = calcularTempoEfetivo()
    const toneladas = parseFloat(formData.toneladas) || 0
    if (tempoEfetivo === '00:00' || toneladas === 0) return '0.00'
    const [horas, minutos] = tempoEfetivo.split(':')
    const tempoEfetivoHoras = parseInt(horas) + parseInt(minutos) / 60
    const producaoPorHora = toneladas / tempoEfetivoHoras
    return producaoPorHora.toFixed(2)
  }

  // Calcula resumo de paradas: total de paradas e tempo total
  const calcularResumoParadas = () => {
    const totalParadas = paradas.length
    const totalMinutosParadas = paradas.reduce((total, parada) => {
      const [h, m] = parada.duracao.split(':')
      return total + (parseInt(h) * 60 + parseInt(m))
    }, 0)
    const horasParadas = Math.floor(totalMinutosParadas / 60)
    const minutosParadas = totalMinutosParadas % 60
    const tempoTotalParadas = `${horasParadas.toString().padStart(2, '0')}:${minutosParadas.toString().padStart(2, '0')}`
    return { totalParadas, tempoTotalParadas }
  }

  // Geração do relatório (PDF ou JPG) com quebra automática de páginas
  const generateReport = async () => {
    setIsGenerating(true)
    try {
      // Cria um elemento para renderizar o conteúdo do relatório (para PDF ou JPG).
      const reportElement = document.createElement('div')
      reportElement.style.position = 'absolute'
      reportElement.style.left = '-9999px'
      reportElement.style.top = '0'
      reportElement.style.width = '794px' // A4 width
      reportElement.style.padding = '40px'
      reportElement.style.backgroundColor = 'white'
      reportElement.style.fontFamily = 'Arial, sans-serif'
      reportElement.style.fontSize = '12px'
      reportElement.style.lineHeight = '1.4'

      const totalTestes = testeZeroGraos.length
      const testesOrdenados = [...testeZeroGraos].reverse()
      const linhasTesteZeroGrao = Math.ceil(totalTestes / 3) || 1
      const resumoParadas = calcularResumoParadas()
      const dadosGraficoPizza = prepararDadosGraficoPizza()

      let graficoPizzaHTML = ''
      if (dadosGraficoPizza.length > 0) {
        graficoPizzaHTML = `
          <div style="margin-bottom: 20px; page-break-inside: avoid;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Distribuição de Paradas Operacionais</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Motivo</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Tempo</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">%</th>
                </tr>
              </thead>
              <tbody>
                ${dadosGraficoPizza
                  .map(
                    (item) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px;">${item.name}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${item.tempo}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${item.porcentagem}%</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `
      }

      reportElement.innerHTML = `
        <div style="border: 2px solid #000; padding: 20px;">
          <!-- Cabeçalho -->
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
          <!-- Dados do Operador -->
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
          <!-- Horas Extras -->
          ${formData.horasExtras && formData.horasExtras !== '00:00' ? `
          <div style="margin-bottom: 20px; border: 1px solid #000; padding: 10px; background-color: #f9f9f9;">
            <strong>Horas Extras:</strong> ${formData.horasExtras}
          </div>
          ` : ''}
          <!-- Estoque de Produto -->
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
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">Estoque (t)</td>
                  ${silos
                    .map(
                      (silo) => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.estoque || ''}</td>`
                    )
                    .join('')}
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">Horas Trabalhadas</td>
                  ${silos
                    .map(
                      (silo) => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.horasTrabalhadas || ''}</td>`
                    )
                    .join('')}
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Teste Zero Grãos -->
          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Teste Zero Grãos</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Análise</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Resultado</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Análise</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Resultado</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Análise</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${Array.from({ length: linhasTesteZeroGrao }, (_, i) => {
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
          <!-- Paradas Operacionais -->
          ${paradas.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Paradas Operacionais</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Início</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Fim</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Duração</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Motivo</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Observação</th>
                </tr>
              </thead>
              <tbody>
                ${paradas
                  .map(
                    (parada) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.inicio}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.fim}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.duracao}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${parada.motivo}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${parada.observacao || ''}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          <!-- Distribuição de Paradas -->
          ${graficoPizzaHTML}
          <!-- Observações -->
          ${observacoes
            ? `
          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Observações / Atuações no Processo</div>
            <div style="border: 1px solid #000; padding: 10px; min-height: 60px;">${observacoes}</div>
          </div>
          `
            : ''}
          <!-- Resumo Operacional -->
          <div style="margin-bottom: 20px; border: 1px solid #000; padding: 15px; background-color: #f9f9f9;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Resumo Operacional</div>
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div>
                <div style="font-weight: bold; color: #2563eb;">Tempo Efetivo</div>
                <div style="font-size: 18px;">${calcularTempoEfetivo()}</div>
              </div>
              <div>
                <div style="font-weight: bold; color: #16a34a;">Produção Total</div>
                <div style="font-size: 18px;">${formData.toneladas || 0}t</div>
              </div>
              <div>
                <div style="font-weight: bold; color: #dc2626;">Total de Paradas</div>
                <div style="font-size: 18px;">${resumoParadas.totalParadas} (${resumoParadas.tempoTotalParadas})</div>
              </div>
              <div>
                <div style="font-weight: bold; color: #7c3aed;">Produção/Hora</div>
                <div style="font-size: 18px;">${calcularProducaoPorHora()}t/h</div>
              </div>
            </div>
          </div>
          <!-- Checklist de Equipamentos -->
          ${checklistItems.length > 0
            ? `
          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Checklist de Equipamentos</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Equipamento</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Situação</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Observação</th>
                </tr>
              </thead>
              <tbody>
                ${checklistItems
                  .map(
                    (item) => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px;">${item.equipamento}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${item.situacao}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${item.observacao || ''}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          `
            : ''}
        </div>
      `
      // Adiciona o elemento ao DOM para permitir captura
      document.body.appendChild(reportElement)
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (selectedFormat === 'pdf') {
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
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
        const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '_')
        const nomeArquivo = `controle_producao_${dataAtual}_turno${formData.turno || 'X'}.pdf`
        // Salva o PDF localmente no navegador, para que o usuário tenha uma cópia imediata.
        pdf.save(nomeArquivo)
        // Tenta enviar o PDF ao backend para obter uma URL permanente. Caso ocorra
        // qualquer erro, continua exibindo o PDF localmente através de data URI.
        try {
          const pdfBlob = pdf.output('blob')
          const formDataUpload = new FormData()
          formDataUpload.append('file', pdfBlob, nomeArquivo)
          const response = await fetch(`${backendBaseUrl}/api/upload-pdf`, {
            method: 'POST',
            body: formDataUpload
          })
          const result = await response.json()
          if (response.ok && result && result.url) {
            // Armazena o link retornado pelo servidor para salvar no Firestore
            setPdfUrl(result.url)
            // Também salva a versão em base64 para compatibilidade com registros antigos
            const dataUri = pdf.output('datauristring')
            setPdfData(dataUri)
            // Abre o PDF hospedado no backend em uma nova aba
            window.open(result.url)
            alert('PDF gerado e enviado ao servidor! Ele será salvo junto com o registro.')
          } else {
            console.error('Falha ao enviar PDF ao backend:', result.error || response.statusText)
            // Se não houver link, cai no fallback base64
            const dataUri = pdf.output('datauristring')
            setPdfData(dataUri)
            window.open(dataUri)
            alert('PDF gerado localmente. Houve falha ao enviar ao servidor; o link não estará disponível.')
          }
        } catch (err) {
          console.error('Erro ao enviar PDF ao backend:', err)
          // Fallback: gera data URI e abre localmente
          try {
            const dataUri = pdf.output('datauristring')
            setPdfData(dataUri)
            window.open(dataUri)
            alert('PDF gerado! Ele será salvo junto com o registro.')
          } catch (convErr) {
            console.error('Erro ao converter PDF para base64:', convErr)
            alert('Erro ao gerar o PDF. O relatório será salvo sem o PDF anexado.')
          }
        }
      } else {
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
        const link = document.createElement('a')
        link.download = `controle_producao_${new Date()
          .toLocaleDateString('pt-BR')
          .replace(/\//g, '_')}_turno${formData.turno || 'X'}.jpg`
        link.href = canvas.toDataURL('image/jpeg', 0.9)
        link.click()
      }
      document.body.removeChild(reportElement)
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Salva ou atualiza dados no Firebase
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
        resumoParadas: calcularResumoParadas(),
        checklist: checklistItems,
        // Incluímos o PDF apenas se houver uma URL ou Data URI.  A prioridade
        // é salvar ``pdfUrl`` (link retornado pelo backend); caso não exista,
        // utiliza-se ``pdfData`` como fallback. Se nenhum dos dois estiver
        // disponível, o campo não é adicionado.
        ...(pdfUrl ? { pdfUrl } : pdfData ? { pdfData } : {}),
        timestamp: new Date().toISOString()
      }
      if (modoEdicao && idRegistroEdicao) {
        // Atualiza o registro existente
        await atualizarRegistro(idRegistroEdicao, dadosCompletos)
        alert('Registro atualizado com sucesso!')
        // Em modo edição não limpamos o formulário, permanecendo com os dados na tela
        // Também não chamamos onNovoRegistro para manter o modo de edição ativo
      } else {
        // Salva um novo registro
        await salvarRegistro(dadosCompletos)
        alert('Registro salvo com sucesso!')
        // Limpa formulário após salvar um novo registro
        setFormData({
          data: new Date().toISOString().split('T')[0],
          operador: '',
          visto: '',
          hp: '00:00',
          toneladas: '',
          turno: '',
          horarioTurno: '',
          siloSelecionado: '',
          horasExtras: '00:00'
        })
        setParadas([])
        setSilos([
          { id: 1, nome: 'Silo 1 - CN #09', estoque: '', horasTrabalhadas: '' },
          { id: 2, nome: 'Silo 2 - CN #09', estoque: '', horasTrabalhadas: '' },
          { id: 3, nome: 'Silo 3 - CE #09', estoque: '', horasTrabalhadas: '' },
          { id: 4, nome: 'Silo 4 - CE #16', estoque: '', horasTrabalhadas: '' },
          { id: 5, nome: 'Silo 5 CN #09', estoque: '', horasTrabalhadas: '' }
        ])
        setTesteZeroGraos([])
        setObservacoes('')
        setChecklistItems([])
        if (onNovoRegistro) {
          onNovoRegistro()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      alert('Erro ao salvar dados. Tente novamente.')
    }
  }

  // Cancela edição
  const cancelarEdicao = () => {
    if (onNovoRegistro) {
      onNovoRegistro()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {modoEdicao ? '✏️ Editando Registro' : '📝 Novo Registro'}
        </h1>
        <p className="text-gray-600">Controle Diário da Britagem / Moagem</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🔒 Registro de Produção</span>
            {modoEdicao && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <Edit className="w-3 h-3 mr-1" />
                  Modo Edição
                </Badge>
                <Button variant="outline" size="sm" onClick={cancelarEdicao} className="text-gray-600">
                  <RefreshCw className="w-4 h-4 mr-1" /> Novo Registro
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Seção de entrada de dados: data, operador, visto, HP, horas extras */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <div className="col-span-1">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={formData.data} onChange={(e) => handleInputChange('data', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="operador">Operador(es)</Label>
              <Input id="operador" value={formData.operador} onChange={(e) => handleInputChange('operador', e.target.value)} placeholder="Nome do operador" />
            </div>
            <div className="col-span-1">
              <Label htmlFor="visto">Visto</Label>
              <Input id="visto" value={formData.visto} onChange={(e) => handleInputChange('visto', e.target.value)} placeholder="Visto" />
            </div>
            <div className="col-span-1">
              <Label htmlFor="hp">HP</Label>
              <Input id="hp" value={formData.hp} onChange={(e) => handleInputChange('hp', e.target.value)} placeholder="HP" />
            </div>
            <div className="col-span-1">
              <Label htmlFor="horasExtras">Horas Extras</Label>
              <Input id="horasExtras" type="time" value={formData.horasExtras} onChange={(e) => handleInputChange('horasExtras', e.target.value)} placeholder="00:00" />
            </div>
          </div>
          {/* Seção turno e toneladas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="turno">Turno</Label>
              <Select value={formData.turno} onValueChange={(value) => handleInputChange('turno', value)}>
                <SelectTrigger className="w-full">
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
              <Input id="toneladas" type="number" value={formData.toneladas} onChange={(e) => handleInputChange('toneladas', e.target.value)} placeholder="Toneladas produzidas" />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Estoque e Teste Zero Grãos */}
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
                  <Input type="number" placeholder="Ton." value={silo.estoque} onChange={(e) => handleSiloChange(silo.id, 'estoque', e.target.value)} />
                  <Input type="time" placeholder="Horas" value={silo.horasTrabalhadas} onChange={(e) => handleSiloChange(silo.id, 'horasTrabalhadas', e.target.value)} />
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
                <Input type="time" placeholder="Horário" value={novoTeste.horario} onChange={(e) => setNovoTeste((prev) => ({ ...prev, horario: e.target.value }))} />
                <Select value={novoTeste.status} onValueChange={(value) => setNovoTeste((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Resultado" value={novoTeste.resultado} onChange={(e) => setNovoTeste((prev) => ({ ...prev, resultado: e.target.value }))} />
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
                          <Badge variant={teste.status === 'Sim' ? 'default' : 'destructive'}>{teste.status}</Badge>
                          <span>{teste.resultado}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removerTesteZeroGraos(teste.id)}>
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
      {/* Paradas Operacionais */}
      <Card>
        <CardHeader>
          <CardTitle>⏸️ Paradas Operacionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <Input type="time" placeholder="Início" value={novaParada.inicio} onChange={(e) => setNovaParada((prev) => ({ ...prev, inicio: e.target.value }))} />
              <Input type="time" placeholder="Fim" value={novaParada.fim} onChange={(e) => setNovaParada((prev) => ({ ...prev, fim: e.target.value }))} />
              <Select value={novaParada.motivo} onValueChange={(value) => setNovaParada((prev) => ({ ...prev, motivo: value }))}>
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
              <Input placeholder="Observação" value={novaParada.observacao} onChange={(e) => setNovaParada((prev) => ({ ...prev, observacao: e.target.value }))} />
              <Button onClick={adicionarParada} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Adicionar
              </Button>
            </div>
            <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
              {paradas.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum parada registrada</p>
              ) : (
                <div className="space-y-2">
                  {paradas.map((parada) => (
                    <div key={parada.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex space-x-4 items-center">
                        <span>
                          {parada.inicio} - {parada.fim}
                        </span>
                        <Badge variant="outline">{parada.duracao}</Badge>
                        <span className="font-medium">{parada.motivo}</span>
                        {parada.observacao && <span className="text-sm text-gray-600">({parada.observacao})</span>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removerParada(parada.id)}>
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
      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Observações / Atuações no Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Digite suas observações aqui..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={4} />
        </CardContent>
      </Card>
      {/* Checklist de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Checklist de Equipamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Select
                value={novoChecklistItem.equipamento}
                onValueChange={(value) => {
                  // Atualiza o equipamento selecionado no checklist
                  setNovoChecklistItem((prev) => ({ ...prev, equipamento: value }))
                  // Define a descrição do equipamento selecionado
                  const eqObj = equipamentosChecklist.find((e) => e.nome === value)
                  setDescricaoEquipamento(eqObj ? eqObj.verificacao : '')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipamentosChecklist.map((equip) => (
                    <SelectItem key={equip.nome} value={equip.nome}>
                      {equip.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={novoChecklistItem.situacao} onValueChange={(value) => setNovoChecklistItem((prev) => ({ ...prev, situacao: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  {situacoesChecklist.map((sit) => (
                    <SelectItem key={sit} value={sit}>
                      {sit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Observação (opcional)" value={novoChecklistItem.observacao} onChange={(e) => setNovoChecklistItem((prev) => ({ ...prev, observacao: e.target.value }))} />
              <Button onClick={adicionarItemChecklist} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Mostrar descrição do equipamento selecionado */}
            {descricaoEquipamento && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">O que verificar:</span>{' '}
                {descricaoEquipamento}
              </div>
            )}
            <div className="border rounded-md p-2 max-h-64 overflow-y-auto">
              {checklistItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum item adicionado</p>
              ) : (
                <div className="space-y-2">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex space-x-4 items-center">
                        <span className="font-medium">{item.equipamento}</span>
                        <Badge variant={item.situacao === 'OK' ? 'default' : 'destructive'}>{item.situacao}</Badge>
                        {item.observacao && <span className="text-sm text-gray-600">({item.observacao})</span>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removerItemChecklist(item.id)}>
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
      {/* Resumo Operacional e ações: seleção do formato, botões de gerar e salvar */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Resumo Operacional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{calcularTempoEfetivo()}</div>
              <div className="text-sm text-gray-600">Tempo Efetivo</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formData.toneladas || 0}t</div>
              <div className="text-sm text-gray-600">Produção Total</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{calcularResumoParadas().totalParadas}</div>
              <div className="text-sm text-gray-600">Total de Paradas</div>
              <div className="text-xs text-gray-500">({calcularResumoParadas().tempoTotalParadas})</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{calcularProducaoPorHora()}t/h</div>
              <div className="text-sm text-gray-600">Produção/Hora</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="formato">Formato do Relatório</Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <Button onClick={generateReport} disabled={isGenerating} className="flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                {isGenerating ? 'Gerando...' : `Gerar ${selectedFormat.toUpperCase()}`}
              </Button>
              <Button onClick={salvarDados} variant={modoEdicao ? 'default' : 'outline'} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {modoEdicao ? 'Atualizar Registro' : 'Salvar Dados'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OperatorDashboard_FUNCTION
