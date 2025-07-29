// Configuração da API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Em produção, usar o mesmo domínio
  : 'http://localhost:5001' // Em desenvolvimento, usar o servidor Flask local

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Métodos para registros de produção
  async getRegistros(filters = {}) {
    const queryParams = new URLSearchParams()
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key])
      }
    })

    const endpoint = `/registros${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  async createRegistro(registroData) {
    return this.request('/registros', {
      method: 'POST',
      body: JSON.stringify(registroData),
    })
  }

  async getRegistro(id) {
    return this.request(`/registros/${id}`)
  }

  async updateRegistro(id, registroData) {
    return this.request(`/registros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(registroData),
    })
  }

  async deleteRegistro(id) {
    return this.request(`/registros/${id}`, {
      method: 'DELETE',
    })
  }

  async getEstatisticas(filters = {}) {
    const queryParams = new URLSearchParams()
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key])
      }
    })

    const endpoint = `/registros/estatisticas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }
}

export default new ApiService()

