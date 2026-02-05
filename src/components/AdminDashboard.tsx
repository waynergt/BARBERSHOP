import { useEffect, useState } from 'react';
import { obtenerTodasLasCitas, cancelarCita, type Cita } from '../services/citas';
import { toast } from 'sonner';

const horaValor = (horaStr: string) => {
  if (!horaStr) return 0;
  const [time, modifier] = horaStr.split(' ');
  const [rawHours, minutes] = time.split(':').map(Number);
  
  let hours = rawHours;
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  
  return (hours * 100) + minutes;
};

export default function AdminDashboard() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [citaParaCancelar, setCitaParaCancelar] = useState<string | null>(null);
  
  // CAMBIO CLAVE: Ahora guardamos cuáles están "Expandidas" (Abiertas).
  // Como inicia vacío {}, todo estará cerrado por defecto.
  const [fechasExpandidas, setFechasExpandidas] = useState<Record<string, boolean>>({});

  useEffect(() => { cargarCitas(); }, []);
  
  const cargarCitas = async () => {
    try {
      const data = await obtenerTodasLasCitas();
      const citasOrdenadas = data.sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        return horaValor(a.hora) - horaValor(b.hora);
      });
      setCitas(citasOrdenadas);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar la lista");
    } finally {
      setLoading(false);
    }
  };

  const solicitarCancelacion = (id: string) => setCitaParaCancelar(id);

  const confirmarCancelacion = async () => {
    if (!citaParaCancelar) return;
    try {
      await cancelarCita(citaParaCancelar);
      setCitas(prev => prev.map(c => c.id === citaParaCancelar ? { ...c, estado: 'cancelada' } : c));
      toast.success("Cita cancelada correctamente");
    } catch (error) {
      console.error("Error al cancelar:", error);
      toast.error("No se pudo cancelar");
    } finally {
      setCitaParaCancelar(null);
    }
  };

  // Función para abrir/cerrar (invierte el estado actual de esa fecha)
  const toggleFecha = (fecha: string) => {
    setFechasExpandidas(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  const hoy = new Date().toISOString().split('T')[0];
  const totalHoy = citas.filter(c => c.fecha === hoy && c.estado !== 'cancelada').length;
  const totalPendientes = citas.filter(c => c.estado !== 'cancelada').length;
  const totalCanceladas = citas.filter(c => c.estado === 'cancelada').length;

  const citasPorFecha = citas.reduce<Record<string, Cita[]>>((grupos, cita) => {
    const fecha = cita.fecha;
    if (!grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(cita);
    return grupos;
  }, {});

  const formatearFecha = (fechaStr: string) => {
    if (fechaStr === hoy) return "HOY";
    const fecha = new Date(`${fechaStr}T00:00:00`); 
    return fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans text-gray-200 pb-20">
      
      {citaParaCancelar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-red-900/50 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">¿Cancelar Cita?</h3>
            <p className="text-zinc-400 text-sm mb-6">El horario quedará libre nuevamente.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCitaParaCancelar(null)} className="px-4 py-2 rounded text-sm text-zinc-300 hover:bg-zinc-800">Volver</button>
              <button onClick={confirmarCancelacion} className="px-4 py-2 rounded text-sm font-bold bg-red-700 text-white hover:bg-red-600">Sí, Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">PANEL DE CONTROL</h1>
          <button onClick={cargarCitas} className="bg-zinc-800 hover:bg-zinc-700 text-xs uppercase font-bold py-2 px-4 rounded transition-colors border border-zinc-700">
            ↻ Actualizar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
            <span className="text-2xl font-bold text-white block">{totalHoy}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Citas Hoy</span>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
            <span className="text-2xl font-bold text-emerald-400 block">{totalPendientes}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Activas</span>
          </div>
          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
            <span className="text-2xl font-bold text-red-400 block">{totalCanceladas}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Canceladas</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 animate-pulse">Cargando agenda...</div>
        ) : (
          <div className="space-y-4">
            {Object.keys(citasPorFecha).length === 0 && <p className="text-center text-zinc-600">No hay citas registradas aún.</p>}
            
            {Object.keys(citasPorFecha).map((fecha) => {
              // Ahora: si es true está abierto, si es false/undefined está cerrado.
              const isExpanded = fechasExpandidas[fecha];

              return (
                <div key={fecha} className="relative group">
                  
                  {/* BOTÓN DE ENCABEZADO */}
                  <button 
                    onClick={() => toggleFecha(fecha)}
                    className={`
                      sticky top-0 z-10 w-full backdrop-blur py-3 mb-1 border-b flex items-center justify-between transition-all px-3 rounded-lg cursor-pointer
                      ${isExpanded ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950/80 border-zinc-800 hover:bg-zinc-900/50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* El indicador: Rojo si está abierto, Gris si está cerrado */}
                      <div className={`w-2 h-2 rounded-full transition-colors ${isExpanded ? 'bg-red-500' : 'bg-zinc-700'}`}></div>
                      
                      <h2 className={`text-lg font-bold capitalize ${isExpanded ? 'text-white' : 'text-zinc-400'}`}>
                        {formatearFecha(fecha)}
                      </h2>
                      
                      <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                        {citasPorFecha[fecha].length}
                      </span>
                    </div>

                    {/* FLECHA: Apunta abajo si está abierto (0deg), a la derecha si cerrado (-90deg) */}
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {/* CONTENEDOR DESPLEGABLE */}
                  <div className={`grid gap-3 pl-4 border-l-2 border-zinc-900 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-500 opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}>
                    {citasPorFecha[fecha].map((cita) => {
                      const isCancelled = cita.estado === 'cancelada';
                      return (
                        <div 
                          key={cita.id} 
                          className={`
                            relative p-4 rounded-lg flex justify-between items-center transition-all
                            ${isCancelled 
                              ? 'bg-zinc-900/30 border border-transparent opacity-50' 
                              : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600 shadow-lg'}
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`
                               px-3 py-2 rounded font-mono font-bold text-sm
                               ${isCancelled ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-950 text-red-500 border border-zinc-800'}
                            `}>
                              {cita.hora}
                            </div>
                            <div>
                              <h3 className={`font-bold ${isCancelled ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                {cita.clienteNombre}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="text-xs text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                   {cita.telefono}
                                 </span>
                                 {isCancelled && <span className="text-[10px] text-red-500 font-bold border border-red-900/30 bg-red-900/10 px-2 rounded">CANCELADA</span>}
                              </div>
                            </div>
                          </div>

                          {!isCancelled && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (cita.id) solicitarCancelacion(cita.id);
                              }}
                              className="text-zinc-500 hover:text-red-500 p-2 hover:bg-zinc-800 rounded-full transition-colors"
                              title="Cancelar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}