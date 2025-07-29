import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'
import { FileDown, FileImage } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const ReportGenerator = ({ formData }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

  // Função para formatar data de YYYY-MM-DD para DD/MM/YYYY
  const formatarData = (data) => {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      // Aguardar um pouco para garantir que o DOM esteja pronto
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Criar elemento temporário para renderização
      const reportElement = document.createElement('div')
      reportElement.style.position = 'absolute'
      reportElement.style.left = '-9999px'
      reportElement.style.top = '0'
      reportElement.style.width = '794px' // A4 width in pixels at 96 DPI
      reportElement.style.padding = '40px'
      reportElement.style.backgroundColor = 'white'
      reportElement.style.fontFamily = 'Arial, sans-serif'
      reportElement.style.fontSize = '12px'
      reportElement.style.lineHeight = '1.4'
      
      // Conteúdo do relatório
      reportElement.innerHTML = `
        <div style="border: 2px solid #000; padding: 20px;">
          <!-- Cabeçalho -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #000; padding-bottom: 10px;">
            <div style="font-size: 18px; font-weight: bold; border: 1px solid #000; padding: 10px;">
              JUNDU
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
              <strong>HP:</strong> ${(() => {
                const duracoesTurnos = {
                  '1': '7:47',
                  '2': '8:20', 
                  '3': '8:03'
                }
                return duracoesTurnos[formData.turno] || '--:--'
              })()}
            </div>
            <div style="border: 1px solid #000; padding: 5px; width: 100px;">
              <strong>Turno:</strong> ${formData.turno || ''}
            </div>
            <div style="border: 1px solid #000; padding: 5px; width: 120px;">
              <strong>Data:</strong> ${formatarData(formData.data) || ''}
            </div>
          </div>

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
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">Ton.</td>
                  ${formData.silos?.map(silo => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.estoque || '0'}</td>`).join('') || '<td colspan="5" style="border: 1px solid #000; padding: 5px;">-</td>'}
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">Horas Trabalhadas</td>
                  ${formData.silos?.map(silo => `<td style="border: 1px solid #000; padding: 5px; text-align: center;">${silo.horasTrabalhadas || '-'}</td>`).join('') || '<td colspan="5" style="border: 1px solid #000; padding: 5px;">-</td>'}
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Teste Zero Grão - Layout Vertical -->
          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Teste Zero Grão</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 20%;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 20%;">Resultado</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 20%;">R</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 20%;">Horário</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0; width: 20%;">Resultado</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  if (!formData.testeZeroGraos || formData.testeZeroGraos.length === 0) {
                    // Se não há testes, mostrar 10 linhas vazias
                    return Array.from({ length: 10 }, () => `
                      <tr>
                        <td style="border: 1px solid #000; padding: 5px; height: 25px;"></td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                      </tr>
                    `).join('')
                  }
                  
                  // Organizar testes em duas colunas (horário/resultado/R | horário/resultado)
                  const testes = formData.testeZeroGraos
                  const linhas = []
                  const maxLinhas = Math.max(10, Math.ceil(testes.length / 2)) // Mínimo 10 linhas
                  
                  for (let i = 0; i < maxLinhas; i++) {
                    const teste1 = testes[i * 2]
                    const teste2 = testes[i * 2 + 1]
                    
                    let linha = '<tr>'
                    
                    // Primeira coluna (Horário, Resultado, R)
                    if (teste1) {
                      linha += `
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste1.horario}</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste1.status}</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste1.r || ''}</td>
                      `
                    } else {
                      linha += `
                        <td style="border: 1px solid #000; padding: 5px; height: 25px;"></td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                      `
                    }
                    
                    // Segunda coluna (Horário, Resultado)
                    if (teste2) {
                      linha += `
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste2.horario}</td>
                        <td style="border: 1px solid #000; padding: 5px; text-align: center;">${teste2.status}</td>
                      `
                    } else {
                      linha += `
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                        <td style="border: 1px solid #000; padding: 5px;"></td>
                      `
                    }
                    
                    linha += '</tr>'
                    linhas.push(linha)
                  }
                  
                  return linhas.join('')
                })()}
              </tbody>
            </table>
          </div>

          <!-- Paradas Operacionais -->
          <div style="margin-bottom: 20px;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">Paradas Operacionais</div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Início</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Fim</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Duração</th>
                  <th style="border: 1px solid #000; padding: 5px; background-color: #f0f0f0;">Motivos</th>
                </tr>
              </thead>
              <tbody>
                ${formData.paradas?.map(parada => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.inicio}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.fim}</td>
                    <td style="border: 1px solid #000; padding: 5px; text-align: center;">${parada.duracao}</td>
                    <td style="border: 1px solid #000; padding: 5px;">${parada.motivo}</td>
                  </tr>
                `).join('') || Array.from({ length: 10 }, () => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px; height: 25px;"></td>
                    <td style="border: 1px solid #000; padding: 5px;"></td>
                    <td style="border: 1px solid #000; padding: 5px;"></td>
                    <td style="border: 1px solid #000; padding: 5px;"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Observações -->
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 5px;">* Observações / Atuações no Processo:</div>
            <div style="border: 1px solid #000; padding: 10px; min-height: 100px;">
              ${formData.observacoes || ''}
            </div>
          </div>

          <!-- Tempo Efetivo e Produção por Hora -->
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 20px;">
            <div>Tempo Efetivo de Trabalho: ${formData.tempoEfetivo || '00:00'}</div>
            <div>Produção por Hora: ${formData.producaoPorHora || '0.00'} t/h</div>
          </div>
        </div>
      `
      
      document.body.appendChild(reportElement)
      
      if (selectedFormat === 'pdf') {
        // Gerar PDF
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
        
        const fileName = `controle-producao-${formatarData(formData.data) || 'sem-data'}.pdf`
        pdf.save(fileName)
        
      } else {
        // Gerar JPG
        const canvas = await html2canvas(reportElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `controle-producao-${formatarData(formData.data) || 'sem-data'}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.95)
      }
      
      document.body.removeChild(reportElement)
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      alert(`Erro ao gerar ${selectedFormat.toUpperCase()}. Tente novamente.`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📄 Gerar Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gere um relatório com os dados preenchidos no formato PDF ou JPG
        </p>
        
        <div>
          <Label htmlFor="formato">Formato do Arquivo</Label>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  PDF - Documento
                </div>
              </SelectItem>
              <SelectItem value="jpg">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  JPG - Imagem
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={generateReport} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? 'Gerando...' : `Gerar e Baixar Relatório ${selectedFormat.toUpperCase()}`}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ReportGenerator

