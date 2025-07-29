import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username && password && userType) {
      onLogin({ username, userType })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800">JUNDU</CardTitle>
          <CardDescription>Controle Diário da Britagem / Moagem</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userType">Tipo de Usuário</Label>
              <Select value={userType} onValueChange={setUserType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="lider">Líder</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="diretor">Diretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-700">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm

