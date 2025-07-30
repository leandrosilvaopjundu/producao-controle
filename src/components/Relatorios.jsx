import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Filter, RotateCcw, FileText, TrendingUp, Clock, Users } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

const Relatorios = () => {
  const [registros, setRegistros] = useState([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    turno: 'todos'
  });

  // Carregar registros do Firebase
  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    try {
      setLoading(true);
      const registrosRef = collection(db, 'registros');
      const q = query(registrosRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const registrosData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        registrosData.push({
          id: doc.id,
          ...data,
          // Garantir que a data esteja no formato correto
          data: data.data || new Date(data.timestamp?.toDate()).toISOString().split('T')[0],
          turno: data.turno || '1'
        });
      });
      
      console.log('Registros carregados:', registrosData);
      setRegistros(registrosData);
      setRegistrosFiltrados(registrosData); // Mostrar todos por padrão
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    let registrosFiltrados = [...registros];

    // Filtro por data
    if (filtros.dataInicio) {
      registrosFiltrados = registrosFiltrados.filter(registro => {
        const dataRegistro = new Date(registro.data);
        const dataInicio = new Date(filtros.dataInicio);
        return dataRegistro >= dataInicio;
      });
    }

    if (filtros.dataFim) {
      registrosFiltrados = registrosFiltrados.filter(registro => {
        const dataRegistro = new Date(registro.data);
        const dataFim = new Date(filtros.dataFim);
        return dataRegistro <= dataFim;
      });
    }

    // Filtro por turno
    if (filtros.turno !== 'todos') {
      registrosFiltrados = registrosFiltrados.filter(registro => 
        registro.turno?.toString() === filtros.turno
      );
    }

    console.log('Filtros aplicados:', filtros);
    console.log('Registros filtrados:', registrosFiltrados);
    setRegistrosFiltrados(registrosFiltrados);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      turno: 'todos'
    });
    setRegistrosFiltrados(registros); // Mostrar todos os registros
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    if (registrosFiltrados.length === 0) {
      return {
        totalRegistros: 0,
        producaoTotal: 0,
        totalParadas: 0,
        producaoMedia: 0
      };
    }

    const totalRegistros = registrosFiltrados.length;
    const producaoTotal = registrosFiltrados.reduce((total, registro) => {
      return total + (parseFloat(registro.toneladas) || 0);
    }, 0);

    const totalParadas = registrosFiltrados.reduce((total, registro) => {
      return total + (parseInt(registro.numeroParadas) || 0);
    }, 0);

    const producaoMedia = registrosFiltrados.reduce((total, registro) => {
      return total + (parseFloat(registro.producaoPorHora) || 0);
    }, 0) / totalRegistros;

    return {
      totalRegistros,
      producaoTotal: producaoTotal.toFixed(1),
      totalParadas,
      producaoMedia: producaoMedia.toFixed(2)
    };
  };

  // Preparar dados para o gráfico
  const prepararDadosGrafico = () => {
    const dadosPorData = {};
    
    registrosFiltrados.forEach(registro => {
      const data = registro.data;
      if (!dadosPorData[data]) {
        dadosPorData[data] = 0;
      }
      dadosPorData[data] += parseFloat(registro.toneladas) || 0;
    });

    return Object.entries(dadosPorData)
      .map(([data, producao]) => ({
        data: new Date(data).toLocaleDateString('pt-BR'),
        producao: producao
      }))
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  };

  const estatisticas = calcularEstatisticas();
  const dadosGrafico = prepararDadosGrafico();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Data Início</label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                placeholder="dd/mm/aaaa"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Data Fim</label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                placeholder="dd/mm/aaaa"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Turno</label>
              <Select value={filtros.turno} onValueChange={(value) => setFiltros(prev => ({ ...prev, turno: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Turnos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Turnos</SelectItem>
                  <SelectItem value="1">Turno 1</SelectItem>
                  <SelectItem value="2">Turno 2</SelectItem>
                  <SelectItem value="3">Turno 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button variant="outline" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Registros</p>
                <p className="text-2xl font-bold">{estatisticas.totalRegistros}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produção Total</p>
                <p className="text-2xl font-bold">{estatisticas.producaoTotal}t</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Paradas</p>
                <p className="text-2xl font-bold">{estatisticas.totalParadas}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produção Média/h</p>
                <p className="text-2xl font-bold">{estatisticas.producaoMedia}t/h</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Produção por Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosGrafico.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}t`, 'Produção']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="producao" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado encontrado para o período selecionado</p>
                <p className="text-sm">Ajuste os filtros para visualizar os dados</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p><strong>Total de registros carregados:</strong> {registros.length}</p>
              <p><strong>Registros após filtros:</strong> {registrosFiltrados.length}</p>
              <p><strong>Filtros ativos:</strong> {JSON.stringify(filtros)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Relatorios;

