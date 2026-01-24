// src/components/Login.tsx
import { useState } from 'react';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: () => void; // Función que avisa al padre que ya entramos
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const ADMIN_PASSWORD = "admin123"; // Tu contraseña

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      // Guardamos una "marca" en el navegador
      localStorage.setItem('isAdmin', 'true'); 
      onLogin();
    } else {
      setError('Contraseña incorrecta');
      toast.error("Acceso denegado");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Acceso Administrativo</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="password" 
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 text-white p-3 rounded focus:border-red-700 outline-none transition-colors"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button 
            type="submit"
            className="w-full bg-red-700 text-white font-bold py-3 rounded hover:bg-red-800 transition-colors shadow-lg"
          >
            Ingresar
          </button>
          
          <a href="/" className="block text-center text-zinc-500 text-sm py-2 hover:text-zinc-300">
            ← Volver a la web
          </a>
        </form>
      </div>
    </div>
  );
}