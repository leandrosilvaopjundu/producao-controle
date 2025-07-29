import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Trash2, FileDown, Calendar, User, Clock } from 'lucide-react'

const HistoricoDashboard = () => {
  const [historico, setHistorico] = useState([])

  useEffect(() => {
    // Carregar histórico do localStorage
    const historicoSalvo = JSON.parse(localStorage.getItem('controle-producao-historico') || '[]')
    setHistorico(historicoSalvo.reverse()) // Mais recentes primeiro
  }, [])

  const formatarData = (data) => {
    if (!data) return ''
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const formatarTimestamp = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('pt-BR')
  }

  const removerRegistro = (index) => {
    if (confirm('Tem certeza que deseja remover este registro?')) {
      const novoHistorico = historico.filter((_, i) => i !== index)
      setHistorico(novoHistorico)
      localStorage.setItem('controle-producao-historico', JSON.stringify(novoHistorico.reverse()))
    }
  }

  const limparHistorico = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
      setHistorico([])
      localStorage.removeItem('controle-producao-historico')
    }
  }

  const exportarHistorico = () => {
    const dados = JSON.stringify(historico, null, 2)
    const blob = new Blob([dados], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historico-controle-producao-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Histórico de Registros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground">
              Os registros salvos aparecerão aqui. Comece criando um novo registro na aba "Novo Registro".
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              📋 Histórico de Registros
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportarHistorico}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="destructive" onClick={limparHistorico}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Histórico
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Total de registros: {historico.length}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {historico.map((registro, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{formatarData(registro.data)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span>{registro.operador || 'Não informado'}</span>
                  </div>
                  <Badge variant="outline">
                    Turno {registro.turno}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removerRegistro(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Toneladas Produzidas</div>
                  <div className="text-lg font-bold text-blue-600">
                    {registro.toneladas || '0'} t
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Tempo Efetivo</div>
                  <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {registro.tempoEfetivo || '00:00'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Produção/Hora</div>
                  <div className="text-lg font-bold text-purple-600">
                    {registro.producaoPorHora || '0.00'} t/h
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Paradas</div>
                  <div className="text-lg font-bold text-orange-600">
                    {registro.paradas?.length || 0}
                  </div>
                </div>
              </div>

              {registro.testeZeroGraos && registro.testeZeroGraos.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">Teste Zero Grãos</div>
                  <div className="flex flex-wrap gap-2">
                    {registro.testeZeroGraos.map((teste, i) => (
                      <Badge 
                        key={i} 
                        variant={teste.status === 'OK' ? 'default' : 'destructive'}
                      >
                        {teste.horario} - {teste.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {registro.observacoes && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-600 mb-1">Observações</div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {registro.observacoes}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                Salvo em: {formatarTimestamp(registro.timestamp)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default HistoricoDashboard

