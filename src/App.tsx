import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
// CORRECCIÓN FINAL: Agregamos 'type' antes de ReactNode
import { type ReactNode } from 'react';

import BookingBarber from './components/BookingBarber';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';

// Componente para proteger la ruta de Admin
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAdmin') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      {/* El Toaster siempre visible en todas las páginas */}
      <Toaster position="top-center" richColors theme="dark" />

      <Routes>
        {/* RUTA 1: La Barbería (Página Principal) */}
        <Route path="/" element={
          <>
            <BookingBarber />
            {/* Botón flotante para ir al admin */}
            <a href="/login" className="fixed bottom-2 right-2 text-zinc-800 text-xs p-2 hover:text-zinc-600 transition-colors z-50">
              Admin
            </a>
          </>
        } />

        {/* RUTA 2: El Login */}
        <Route path="/login" element={
          <IsAlreadyLoggedIn>
             <Login onLogin={() => window.location.href = "/admin"} />
          </IsAlreadyLoggedIn>
        } />

        {/* RUTA 3: El Panel (Protegido) */}
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

// Layout del Admin con botón de salir
function AdminLayout() {
  const handleLogout = () => {
    localStorage.removeItem('isAdmin'); 
    window.location.href = "/"; 
  };

  return (
    <>
      <AdminDashboard />
      <button 
        onClick={handleLogout}
        className="fixed bottom-6 right-6 bg-zinc-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-900 text-sm font-bold border border-zinc-700 z-50"
      >
        Cerrar Sesión
      </button>
    </>
  );
}

// Redirección si ya está logueado
const IsAlreadyLoggedIn = ({ children }: { children: ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAdmin') === 'true';
  return isAuthenticated ? <Navigate to="/admin" /> : <>{children}</>;
}

export default App;