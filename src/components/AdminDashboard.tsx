import { useEffect, useState } from 'react';
import { obtenerTodasLasCitas, cancelarCita, type Cita } from '../services/citas';
// Importamos toast para notificaciones
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADO PARA EL MODAL DE CONFIRMACIÓN ---
  // Guardamos el ID de la cita que se quiere cancelar. Si es null, el modal está cerrado.
  const [citaParaCancelar, setCitaParaCancelar] = useState<string | null>(null);

  useEffect(() => { cargarCitas(); }, []);
  
  const cargarCitas = async () => {
      try {
        const data = await obtenerTodasLasCitas();
        setCitas(data);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar la lista de citas");
      } finally {
        setLoading(false);
      }
  };

  // 1. CUANDO PRESIONA EL BOTÓN "CANCELAR" (Solo abrimos el modal)
  const solicitarCancelacion = (id: string) => {
    setCitaParaCancelar(id); 
  };

  // 2. CUANDO CONFIRMA EN EL MODAL (Acción real)
  const confirmarCancelacion = async () => {
    if (!citaParaCancelar) return;

    try {
      await cancelarCita(citaParaCancelar);
      
      setCitas(prev => prev.map(cita => {
        if (cita.id === citaParaCancelar) {
          return { ...cita, estado: 'cancelada' };
        }
        return cita;
      }));
      
      toast.success("Cita cancelada correctamente");
      
    } catch (error) {
      console.error("Error cancelando:", error);
      toast.error("No se pudo cancelar la cita");
    } finally {
      // Cerramos el modal
      setCitaParaCancelar(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 font-sans text-gray-200 relative">
      
      {/* --- MODAL PERSONALIZADO DE CONFIRMACIÓN --- */}
      {citaParaCancelar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-red-900/50 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 scale-in-95 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">¿Cancelar Cita?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              El horario quedará disponible para otros clientes nuevamente.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setCitaParaCancelar(null)} // Cerrar sin hacer nada
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Volver
              </button>
              <button 
                onClick={confirmarCancelacion} // Ejecutar la acción
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-700 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(185,28,28,0.4)] transition-all"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONTENIDO NORMAL --- */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">PANEL DE ADMINISTRACIÓN</h1>
          <button onClick={cargarCitas} className="bg-zinc-800 hover:bg-zinc-700 text-xs uppercase font-bold py-2 px-4 rounded transition-colors">
            Actualizar Lista
          </button>
        </div>

        {!loading && (
          <div className="grid gap-4">
            {citas.map((cita) => {
              const isCancelled = cita.estado === 'cancelada';
              return (
                <div 
                  key={cita.id} 
                  className={`
                    p-4 rounded-r-xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors border-l-4
                    ${isCancelled ? 'bg-zinc-900/40 border-zinc-700 opacity-60' : 'bg-zinc-900 border-red-700 hover:bg-zinc-800/80'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg text-center min-w-20 ${isCancelled ? 'bg-zinc-800' : 'bg-zinc-950'}`}>
                      <span className="block text-xs text-zinc-500 uppercase font-bold">Hora</span>
                      <span className={`text-xl font-bold ${isCancelled ? 'text-zinc-500 line-through' : 'text-white'}`}>{cita.hora}</span>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400 font-medium uppercase tracking-wider">{cita.fecha}</p>
                      <h3 className={`text-lg font-bold ${isCancelled ? 'text-zinc-500 line-through' : 'text-white'}`}>{cita.clienteNombre}</h3>
                      {isCancelled && <span className="text-xs text-red-500 font-bold uppercase tracking-widest">[CANCELADA]</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-2 bg-zinc-950/50 px-3 py-2 rounded-lg border border-zinc-800">
                       <span className="text-zinc-500 text-xs">TEL:</span>
                       <span className="text-gray-300 font-mono text-sm">{cita.telefono}</span>
                    </div>

                    {!isCancelled && (
                      <button 
                        onClick={() => cita.id && solicitarCancelacion(cita.id)} // CAMBIADO: Llama al modal
                        className="bg-yellow-900/20 text-yellow-600 p-2 rounded-lg hover:bg-yellow-600 hover:text-white transition-all border border-yellow-900/30"
                        title="Cancelar Reserva"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
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