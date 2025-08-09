import React, { useState, useEffect } from 'react'
import { firebaseService } from '../services/firebaseService'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { Calendar, Clock, User, Package, AlertCircle, CheckCircle, RefreshCw, Eye, EyeOff, Edit } from 'lucide-react'

const HistoricoRegistros = ({ onEditarRegistro }) => {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const carregarRegistros = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const dados = await firebaseService.listarRegistros()
      setRegistros(dados)
    } catch (err) {
      setError(err.message)
      console.error('Erro ao carregar registros:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarRegistros()
  }, [])

  const formatarData = (timestamp) => {
    if (!timestamp) return 'Data não disponível'
    
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Data inválida'
    }
  }

  const calcularProducaoHora = (toneladas, tempoEfetivo) => {
    // Primeiro tenta usar o valor já calculado do Firebase
    if (toneladas && typeof toneladas === 'string' && toneladas.includes('.')) {
      return parseFloat(toneladas).toFixed(2)
    }
    
    if (!toneladas || !tempoEfetivo) return '0.00'
    
    try {
      const [horas, minutos] = tempoEfetivo.split(':').map(Number)
      const totalHoras = horas + (minutos / 60)
      
      if (totalHoras === 0) return '0.00'
      
      const producaoHora = parseFloat(toneladas) / totalHoras
      return producaoHora.toFixed(2)
    } catch (error) {
      return '0.00'
    }
  }

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  // NOVA FUNCIONALIDADE: Editar registro
  const editarRegistro = (registro) => {
    if (onEditarRegistro) {
      // Preparar dados do registro para edição
      const dadosParaEdicao = {
        id: registro.id,
        data: registro.data || new Date().toISOString().split('T')[0],
        operador: registro.operador || '',
        visto: registro.visto || '',
        hp: registro.hp || '00:00',
        toneladas: registro.toneladas || '',
        turno: registro.turno || '',
        horarioTurno: registro.horarioTurno || '',
        siloSelecionado: registro.siloSelecionado || '',
        horasExtras: registro.horasExtras || '00:00',
        silos: registro.silos || [
          { id: 1, nome: 'Silo 1 - CN #09', estoque: '', horasTrabalhadas: '' },
          { id: 2, nome: 'Silo 2 - CN #09', estoque: '', horasTrabalhadas: '' },
          { id: 3, nome: 'Silo 3 - CE #09', estoque: '', horasTrabalhadas: '' },
          { id: 4, nome: 'Silo 4 - CE #16', estoque: '', horasTrabalhadas: '' },
          { id: 5, nome: 'Silo 5 CN #09', estoque: '', horasTrabalhadas: '' }
        ],
        paradas: registro.paradas || [],
        testeZeroGraos: registro.testeZeroGraos || [],
        observacoes: registro.observacoes || '',
        // Incluir checklist de equipamentos para edição
        checklist: registro.checklist || []
      }
      
      // Chamar função de callback para editar
      onEditarRegistro(dadosParaEdicao)
      
      // Mostrar mensagem de confirmação
      alert('Registro carregado para edição! Vá para a aba "Novo Registro" para fazer as alterações.')
    } else {
      alert('Funcionalidade de edição não está disponível. Verifique se o componente pai está configurado corretamente.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-lg font-medium">Carregando registros do Firebase...</p>
        <p className="text-sm text-gray-500">Conectando com o banco de dados</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-red-700">Erro ao carregar registros</h3>
        <p className="text-sm text-gray-600 text-center max-w-md">{error}</p>
        <Button 
          onClick={carregarRegistros}
          variant="outline"
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Histórico de Registros</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-sm">
            {registros.length} registros encontrados
          </Badge>
          <Button 
            onClick={carregarRegistros}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {registros.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Package className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">Nenhum registro encontrado</h3>
            <p className="text-sm text-gray-500 text-center">
              Ainda não há registros salvos no sistema. Comece criando um novo registro na aba "Novo Registro".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {registros.map((registro) => (
            <Card key={registro.id} className="transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">
                        {formatarData(registro.timestamp)}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{registro.operador || 'Operador não informado'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Package className="h-4 w-4" />
                          <span>{registro.toneladas || '0'} toneladas</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{registro.tempoEfetivo || '00:00'}</span>
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-sm font-medium">
                      {registro.producaoPorHora || calcularProducaoHora(registro.toneladas, registro.tempoEfetivo)} t/h
                    </Badge>
                    {/* NOVO: Botão de Editar */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editarRegistro(registro)}
                      className="text-green-600 hover:text-green-800 border-green-300 hover:border-green-500"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(registro.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {expandedId === registro.id ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Ocultar detalhes
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalhes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedId === registro.id && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Informações Básicas</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Data:</span> {registro.data || 'Não informado'}</p>
                        <p><span className="font-medium">Operador:</span> {registro.operador || 'Não informado'}</p>
                        <p><span className="font-medium">Visto:</span> {registro.visto || 'Não informado'}</p>
                        <p><span className="font-medium">Turno:</span> {registro.turno || 'Não informado'}</p>
                        <p><span className="font-medium">HP:</span> {registro.hp || 'Não informado'}</p>
                        {registro.horasExtras && registro.horasExtras !== '00:00' && (
                          <p><span className="font-medium">Horas Extras:</span> {registro.horasExtras}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Produção</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Toneladas:</span> {registro.toneladas || '0'}</p>
                        <p><span className="font-medium">Tempo Efetivo:</span> {registro.tempoEfetivo || '00:00'}</p>
                        <p><span className="font-medium">Produção/Hora:</span> {registro.producaoPorHora || calcularProducaoHora(registro.toneladas, registro.tempoEfetivo)} t/h</p>
                        {registro.paradas && registro.paradas.length > 0 && (
                          <p><span className="font-medium">Paradas:</span> {registro.paradas.length}</p>
                        )}
                        {registro.testeZeroGraos && registro.testeZeroGraos.length > 0 && (
                          <p><span className="font-medium">Testes Zero Grãos:</span> {registro.testeZeroGraos.length}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Sistema</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">ID:</span> {registro.id}</p>
                        <p><span className="font-medium">Timestamp:</span> {formatarData(registro.timestamp)}</p>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">Salvo no Firebase</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mostrar detalhes dos silos se existirem */}
                  {registro.silos && registro.silos.some(silo => silo.estoque || silo.horasTrabalhadas) && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Estoque de Silos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {registro.silos.filter(silo => silo.estoque || silo.horasTrabalhadas).map((silo, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded">
                            <p className="font-medium">{silo.nome}</p>
                            {silo.estoque && <p>Estoque: {silo.estoque}t</p>}
                            {silo.horasTrabalhadas && <p>Horas: {silo.horasTrabalhadas}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mostrar paradas se existirem */}
                  {registro.paradas && registro.paradas.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Paradas Operacionais</h4>
                      <div className="space-y-1 text-sm">
                        {registro.paradas.map((parada, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded">
                            <p><span className="font-medium">Horário:</span> {parada.inicio} - {parada.fim} ({parada.duracao})</p>
                            <p><span className="font-medium">Motivo:</span> {parada.motivo}</p>
                            {parada.observacao && <p><span className="font-medium">Observação:</span> {parada.observacao}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mostrar checklist de equipamentos se existirem */}
                  {registro.checklist && registro.checklist.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Checklist de Equipamentos</h4>
                      <div className="flex flex-wrap gap-2">
                        {registro.checklist.map((item, index) => (
                          <Badge
                            key={index}
                            variant={item.situacao === 'OK' ? 'default' : 'destructive'}
                          >
                            {item.equipamento} - {item.situacao}
                          </Badge>
                        ))}
                      </div>
                      {registro.checklist.some(item => item.observacao) && (
                        <div className="mt-2 space-y-1 text-sm">
                          {registro.checklist.map((item, idx) => (
                            item.observacao ? (
                              <p key={idx}>
                                <span className="font-medium">{item.equipamento}:</span> {item.observacao}
                              </p>
                            ) : null
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {registro.observacoes && (
                    <div className="mt-4 space-y-2">
                      <h4 className="font-semibold text-sm text-gray-700">Observações</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded-md">{registro.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistoricoRegistros

