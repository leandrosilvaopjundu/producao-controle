// Serviço Firebase para operações de dados
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'registros';

// Função para salvar registro (exportação individual)
export const salvarRegistro = async (dados) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...dados,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      id: docRef.id,
      message: "Registro salvo com sucesso no Firebase!"
    };
  } catch (error) {
    console.error("Erro ao salvar registro:", error);
    throw new Error(`Erro ao salvar: ${error.message}`);
  }
};

// Função para listar registros (exportação individual)
export const listarRegistros = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('timestamp', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const registros = [];
    
    querySnapshot.forEach((doc) => {
      registros.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return registros;
  } catch (error) {
    console.error("Erro ao listar registros:", error);
    throw new Error(`Erro ao carregar registros: ${error.message}`);
  }
};

export const firebaseService = {
  // Salvar registro
  async salvarRegistro(dados) {
    return await salvarRegistro(dados);
  },

  // Listar todos os registros
  async listarRegistros() {
    return await listarRegistros();
  },

  // Buscar registro por ID
  async buscarRegistro(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error("Registro não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar registro:", error);
      throw new Error(`Erro ao buscar registro: ${error.message}`);
    }
  },

  // Calcular estatísticas
  async calcularEstatisticas() {
    try {
      const registros = await this.listarRegistros();
      
      const totalRegistros = registros.length;
      const totalToneladas = registros.reduce((sum, reg) => {
        return sum + (parseFloat(reg.toneladas_produzidas) || 0);
      }, 0);
      
      return {
        total_registros: totalRegistros,
        total_toneladas: totalToneladas,
        media_toneladas: totalRegistros > 0 ? totalToneladas / totalRegistros : 0
      };
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  }
};

