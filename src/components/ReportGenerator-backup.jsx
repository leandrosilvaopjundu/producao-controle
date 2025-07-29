import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { FileText, Image, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const ReportGenerator = ({ formData, paradas, silos, observacoes, tempoEfetivo, user }) => {
  const [formato, setFormato] = useState('')
  const [gerando, setGerando] = useState(false)

  const turnos = [
    { value: '1', label: 'Turno 1 (00h05 às 07h52)', duracao: '7h47' },
    { value: '2', label: 'Turno 2 (07h45 às 16h05)', duracao: '8h20' },
    { value: '3', label: 'Turno 3 (16h05 às 00h08)', duracao: '8h03' }
  ]

  const formatarData = (data) => {
    const date = new Date(data + 'T00:00:00')
    return date.toLocaleDateString('pt-BR')
  }

  const criarElementoRelatorio = () => {
    // Criar elemento temporário para renderização
    const elemento = document.createElement('div')
    elemento.style.width = '210mm'
    elemento.style.minHeight = '297mm'
    elemento.style.padding = '20mm'
    elemento.style.backgroundColor = 'white'
    elemento.style.fontFamily = 'Arial, sans-serif'
    elemento.style.fontSize = '12px'
    elemento.style.position = 'absolute'
    elemento.style.left = '-9999px'
    elemento.style.top = '0'

    const turnoSelecionado = turnos.find(t => t.value === formData.turno)

    elemento.innerHTML = `
      <div style="border: 2px solid #000; padding: 10px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 15%; text-align: center; font-weight: bold; font-size: 16px;">
              JUNDU
            </td>
            <td style="border: 1px solid #000; padding: 8px; width: 60%; text-align: center; font-weight: bold; font-size: 14px;">
              Controle Diário da Britagem / Moagem
            </td>
            <td style="border: 1px solid #000; padding: 8px; width: 25%; text-align: center;">
              <div>código: FOSJ17</div>
              <div>rev. 11</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="border: 2px solid #000; padding: 10px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #000; padding: 5px; width: 30%;">
              <strong>Operador (os):</strong> ${formData.operador || ''}
            </td>
            <td style="border: 1px solid #000; padding: 5px; width: 15%;">
              <strong>Visto:</strong> ✓
            </td>
            <td style="border: 1px solid #000; padding: 5px; width: 15%;">
              <strong>HP:</strong> ${formData.horarioInicio || ''}
            </td>
            <td style="border: 1px solid #000; padding: 5px; width: 20%;">
              <strong>Turno:</strong> ${formData.turno}°
            </td>
            <td style="border: 1px solid #000; padding: 5px; width: 20%;">
              <strong>Data:</strong> ${formatarData(formData.data)}
            </td>
          </tr>
        </table>
      </div>

      <div style="border: 2px solid #000; padding: 10px; margin-bottom: 20px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Estoque de Produto</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Quantidade</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Silo 1 - CN #09</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Silo 2 - CN #09</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Silo 3 - CE #09</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Silo 4 - CE #16</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Silo 5 CN #09</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Ton.</td>
            ${silos.map(silo => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.estoque || '0'}</td>`).join('')}
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Horas Trabalhadas</td>
            ${silos.map(silo => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.horasTrabalhadas || '-'}</td>`).join('')}
          </tr>
        </table>
      </div>

      <div style="border: 2px solid #000; padding: 10px; margin-bottom: 20px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Teste Zero Grão</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Horário</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;" colspan="2">Resultado</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Horário</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;" colspan="2">Resultado</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Horário</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;" colspan="2">Resultado</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">Horário</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;" colspan="2">Resultado</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">OK</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">R*</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">OK</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">R*</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">OK</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">R*</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">OK</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">R*</td>
          </tr>
          ${Array.from({length: 7}, (_, i) => `
            <tr>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;"></td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="border: 2px solid #000; padding: 10px; margin-bottom: 20px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Paradas Operacionais</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; width: 15%;">Início</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; width: 15%;">Fim</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; width: 15%;">Duração</td>
            <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; width: 55%;">Motivos</td>
          </tr>
          ${paradas.map(parada => `
            <tr>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.inicio}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.fim}</td>
              <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.duracao}</td>
              <td style="border: 1px solid #000; padding: 5px;">${parada.motivo}</td>
            </tr>
          `).join('')}
          ${Array.from({length: Math.max(0, 10 - paradas.length)}, () => `
            <tr>
              <td style="border: 1px solid #000; padding: 5px; height: 25px;"></td>
              <td style="border: 1px solid #000; padding: 5px;"></td>
              <td style="border: 1px solid #000; padding: 5px;"></td>
              <td style="border: 1px solid #000; padding: 5px;"></td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="border: 2px solid #000; padding: 10px; margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">* Observações / Atuações no Processo:</div>
        <div style="min-height: 100px; padding: 10px; border: 1px solid #ccc;">
          ${observacoes || ''}
        </div>
        <div style="margin-top: 10px;">
          <strong>Tempo Efetivo de Trabalho:</strong> ${tempoEfetivo}
        </div>
        <div style="margin-top: 5px;">
          <strong>Toneladas Produzidas:</strong> ${formData.toneladas || '0'}T
        </div>
      </div>

      <div style="text-align: center; font-size: 10px; margin-top: 20px;">
        g:\\ehscorporativo\\formularios\\form_iso\\sjdr\\controle diário da britagem-moagem.doc
      </div>
    `

    return elemento
  }

  const gerarPDF = async () => {
    setGerando(true)
    try {
      const elemento = criarElementoRelatorio()
      document.body.appendChild(elemento)

      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      document.body.removeChild(elemento)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 297
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

      const nomeArquivo = `controle-producao-${formatarData(formData.data).replace(/\//g, '-')}.pdf`
      pdf.save(nomeArquivo)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  const gerarJPG = async () => {
    setGerando(true)
    try {
      const elemento = criarElementoRelatorio()
      document.body.appendChild(elemento)

      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      document.body.removeChild(elemento)

      const link = document.createElement('a')
      link.download = `controle-producao-${formatarData(formData.data).replace(/\//g, '-')}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.9)
      link.click()
    } catch (error) {
      console.error('Erro ao gerar JPG:', error)
      alert('Erro ao gerar JPG. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  const gerarRelatorio = () => {
    if (!formato) {
      alert('Por favor, selecione um formato de arquivo.')
      return
    }

    if (formato === 'pdf') {
      gerarPDF()
    } else if (formato === 'jpg') {
      gerarJPG()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Gerar Relatório
        </CardTitle>
        <CardDescription>
          Gere um relatório com os dados preenchidos no formato PDF ou JPG
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Formato do Arquivo</label>
          <Select value={formato} onValueChange={setFormato}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF - Documento
                </div>
              </SelectItem>
              <SelectItem value="jpg">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  JPG - Imagem
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={gerarRelatorio} 
          disabled={!formato || gerando}
          className="w-full"
          size="lg"
        >
          {gerando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Gerando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Gerar e Baixar Relatório
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ReportGenerator

