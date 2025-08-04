import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Relatorios = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    turno: 'todos'
  });
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);

  // Cores para o gráfico de pizza
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  // Carregar registros do Firebase
  useEffect(() => {
    const carregarRegistros = async () => {
      try {
        console.log('Carregando registros do Firebase...');
        const q = query(collection(db, 'registros'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const registrosData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          registrosData.push({
            id: doc.id,
            ...data
          });
        });
        
        console.log('Registros carregados:', registrosData);
        setRegistros(registrosData);
        setRegistrosFiltrados(registrosData);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar registros:', error);
        setLoading(false);
      }
    };

    carregarRegistros();
  }, []);

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
        registro.turno === parseInt(filtros.turno)
      );
    }

    setRegistrosFiltrados(registrosFiltrados);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      turno: 'todos'
    });
    setRegistrosFiltrados(registros);
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    if (registrosFiltrados.length === 0) {
      return {
        totalRegistros: 0,
        producaoTotal: 0,
        totalParadas: 0,
        producaoMediaPorHora: 0
      };
    }

    const producaoTotal = registrosFiltrados.reduce((total, registro) => {
      return total + (parseFloat(registro.toneladas) || 0);
    }, 0);

    const totalParadas = registrosFiltrados.reduce((total, registro) => {
      return total + (registro.paradas ? registro.paradas.length : 0);
    }, 0);

    const producaoMediaPorHora = registrosFiltrados.reduce((total, registro) => {
      return total + (parseFloat(registro.producaoPorHora) || 0);
    }, 0) / registrosFiltrados.length;

    return {
      totalRegistros: registrosFiltrados.length,
      producaoTotal: producaoTotal.toFixed(1),
      totalParadas,
      producaoMediaPorHora: producaoMediaPorHora.toFixed(2)
    };
  };

  // Preparar dados para o gráfico de barras
  const prepararDadosGrafico = () => {
    return registrosFiltrados.map(registro => ({
      data: new Date(registro.data).toLocaleDateString('pt-BR'),
      producao: parseFloat(registro.toneladas) || 0,
      operador: registro.operador || 'N/A'
    }));
  };

  // Preparar dados para o gráfico de pizza das paradas
  const prepararDadosGraficoPizza = () => {
    const dadosParadas = {};
    let totalMinutos = 0;

    registrosFiltrados.forEach(registro => {
      if (registro.paradas && Array.isArray(registro.paradas)) {
        registro.paradas.forEach(parada => {
          const motivo = parada.motivo || 'Não especificado';
          
          // Calcular duração em minutos
          let minutos = 0;
          if (parada.duracao) {
            const [h, m] = parada.duracao.split(':').map(Number);
            minutos = h * 60 + m;
          }

          if (dadosParadas[motivo]) {
            dadosParadas[motivo] += minutos;
          } else {
            dadosParadas[motivo] = minutos;
          }
          
          totalMinutos += minutos;
        });
      }
    });

    // Converter para formato do gráfico
    return Object.entries(dadosParadas).map(([motivo, minutos]) => ({
      name: motivo,
      value: minutos,
      porcentagem: totalMinutos > 0 ? ((minutos / totalMinutos) * 100).toFixed(1) : 0,
      tempo: `${Math.floor(minutos / 60)}h${(minutos % 60).toString().padStart(2, '0')}m`
    })).sort((a, b) => b.value - a.value); // Ordenar por tempo decrescente
  };

  const estatisticas = calcularEstatisticas();
  const dadosGrafico = prepararDadosGrafico();
  const dadosGraficoPizza = prepararDadosGraficoPizza();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando relatórios...</div>
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-2">Nenhum relatório encontrado</h2>
        <p className="text-gray-600 mb-4">Ainda não há dados salvos para exibir relatórios.</p>
        <p className="text-sm text-gray-500">
          Vá para a aba "Novo Registro" e salve alguns dados para visualizar os relatórios aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📊 Relatórios de Produção</h1>
        <div className="text-sm text-gray-500">
          {registrosFiltrados.length} de {registros.length} registros
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Turno</label>
              <select
                value={filtros.turno}
                onChange={(e) => setFiltros({...filtros, turno: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="todos">Todos os turnos</option>
                <option value="1">Turno 1</option>
                <option value="2">Turno 2</option>
                <option value="3">Turno 3</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                Aplicar Filtros
              </Button>
              <Button onClick={limparFiltros} variant="outline">
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
            <div className="text-2xl font-bold text-blue-600">{estatisticas.totalRegistros}</div>
            <div className="text-sm text-gray-600">Total de Registros</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{estatisticas.producaoTotal}t</div>
            <div className="text-sm text-gray-600">Produção Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{estatisticas.totalParadas}</div>
            <div className="text-sm text-gray-600">Total de Paradas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">{estatisticas.producaoMediaPorHora}t/h</div>
            <div className="text-sm text-gray-600">Produção Média/h</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Produção por Data */}
        <Card>
          <CardHeader>
            <CardTitle>📈 Gráfico de Produção por Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value}t`, 'Produção']}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Bar dataKey="producao" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza das Paradas */}
        <Card>
          <CardHeader>
            <CardTitle>🍕 Distribuição de Paradas Operacionais</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosGraficoPizza.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGraficoPizza}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, porcentagem }) => `${name}: ${porcentagem}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosGraficoPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${Math.floor(value / 60)}h${(value % 60).toString().padStart(2, '0')}m`, 'Tempo']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Nenhuma parada registrada no período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada das paradas (se houver dados) */}
      {dadosGraficoPizza.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Detalhamento das Paradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Motivo da Parada</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Tempo Total</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Porcentagem</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosGraficoPizza.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.tempo}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.porcentagem}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Registros Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {registrosFiltrados.map((registro) => (
              <div key={registro.id} className="border rounded p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <strong>Data:</strong> {new Date(registro.data).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <strong>Operador:</strong> {registro.operador || 'N/A'}
                  </div>
                  <div>
                    <strong>Turno:</strong> {registro.turno || 'N/A'}
                  </div>
                  <div>
                    <strong>Produção:</strong> {registro.toneladas || 0}t
                  </div>
                  <div>
                    <strong>Tempo Efetivo:</strong> {registro.tempoEfetivo || 'N/A'}
                  </div>
                  <div>
                    <strong>Produção/h:</strong> {registro.producaoPorHora || 0}t/h
                  </div>
                  <div>
                    <strong>Paradas:</strong> {registro.paradas ? registro.paradas.length : 0}
                  </div>
                  <div>
                    <strong>Visto:</strong> {registro.visto || 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;

