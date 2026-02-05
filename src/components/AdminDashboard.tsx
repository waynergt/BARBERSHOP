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
  
  // Estados para cancelar con motivo
  const [citaParaCancelar, setCitaParaCancelar] = useState<string | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');

  // Estados de Interfaz
  const [fechasExpandidas, setFechasExpandidas] = useState<Record<string, boolean>>({});
  const [busqueda, setBusqueda] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false); // <--- NUEVO: Para mostrar/ocultar el pasado

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

  const solicitarCancelacion = (id: string) => {
    setCitaParaCancelar(id);
    setMotivoCancelacion('');
  };

  const confirmarCancelacion = async () => {
    if (!citaParaCancelar) return;
    try {
      await cancelarCita(citaParaCancelar, motivoCancelacion);
      setCitas(prev => prev.map(c => 
        c.id === citaParaCancelar 
          ? { ...c, estado: 'cancelada', motivoCancelacion: motivoCancelacion || "Sin motivo especificado" } 
          : c
      ));
      toast.success("Cita cancelada correctamente");
    } catch (error) {
      console.error("Error al cancelar:", error);
      toast.error("No se pudo cancelar");
    } finally {
      setCitaParaCancelar(null);
      setMotivoCancelacion('');
    }
  };

  const toggleFecha = (fecha: string) => {
    setFechasExpandidas(prev => ({ ...prev, [fecha]: !prev[fecha] }));
  };

  // --- LÓGICA DE FILTRADO Y AGRUPACIÓN ---

  const citasFiltradas = busqueda 
    ? citas.filter(c => 
        c.telefono?.includes(busqueda) || 
        c.clienteNombre.toLowerCase().includes(busqueda.toLowerCase())
      )
    : citas;

  const citasPorFecha = citasFiltradas.reduce<Record<string, Cita[]>>((grupos, cita) => {
    const fecha = cita.fecha;
    if (!grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(cita);
    return grupos;
  }, {});

  // SEPARACIÓN DE FECHAS (Pasado vs Futuro)
  const hoy = new Date().toISOString().split('T')[0];
  const todasLasFechas = Object.keys(citasPorFecha).sort(); // Ordenadas cronológicamente

  // Si hay búsqueda, mostramos todo junto. Si no, separamos.
  const fechasFuturas = busqueda ? todasLasFechas : todasLasFechas.filter(f => f >= hoy);
  const fechasPasadas = busqueda ? [] : todasLasFechas.filter(f => f < hoy);

  // --- MÉTRICAS ---
  const totalHoy = citas.filter(c => c.fecha === hoy && c.estado !== 'cancelada').length;
  const totalPendientes = citas.filter(c => c.estado !== 'cancelada').length;
  const totalCanceladas = citas.filter(c => c.estado === 'cancelada').length;

  const busquedaTotal = citasFiltradas.length;
  const busquedaCanceladas = citasFiltradas.filter(c => c.estado === 'cancelada').length;
  const busquedaEfectivas = busquedaTotal - busquedaCanceladas;

  const formatearFecha = (fechaStr: string) => {
    if (fechaStr === hoy) return "HOY";
    const fecha = new Date(`${fechaStr}T00:00:00`); 
    return fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Componente reutilizable para renderizar un grupo de fechas
  const RenderGrupoFechas = ({ fechas }: { fechas: string[] }) => (
    <>
      {fechas.map((fecha) => {
        const isExpanded = busqueda ? true : fechasExpandidas[fecha];
        return (
          <div key={fecha} className="relative group mb-4">
            <button 
              onClick={() => toggleFecha(fecha)}
              className={`
                sticky top-0 z-10 w-full backdrop-blur py-3 mb-1 border-b flex items-center justify-between transition-all px-3 rounded-lg cursor-pointer
                ${isExpanded ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950/80 border-zinc-800 hover:bg-zinc-900/50'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full transition-colors ${isExpanded ? 'bg-red-500' : 'bg-zinc-700'}`}></div>
                <h2 className={`text-lg font-bold capitalize ${isExpanded ? 'text-white' : 'text-zinc-400'}`}>
                  {formatearFecha(fecha)}
                </h2>
                <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  {citasPorFecha[fecha].length}
                </span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <div className={`grid gap-3 pl-4 border-l-2 border-zinc-900 transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-500 opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}>
              {citasPorFecha[fecha].map((cita) => {
                const isCancelled = cita.estado === 'cancelada';
                return (
                  <div key={cita.id} className={`relative p-4 rounded-lg flex justify-between items-center transition-all ${isCancelled ? 'bg-zinc-900/30 border border-transparent opacity-50' : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600 shadow-lg'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-2 rounded font-mono font-bold text-sm ${isCancelled ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-950 text-red-500 border border-zinc-800'}`}>{cita.hora}</div>
                      <div>
                        <h3 className={`font-bold ${isCancelled ? 'text-zinc-500 line-through' : 'text-white'}`}>{cita.clienteNombre}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                           <span className={`text-xs px-2 py-0.5 rounded border w-fit ${busqueda && cita.telefono?.includes(busqueda) ? 'bg-yellow-900/30 text-yellow-500 border-yellow-800' : 'text-zinc-500 bg-zinc-950 border-zinc-800'}`}>{cita.telefono}</span>
                           {isCancelled && (
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-red-500 font-bold border border-red-900/30 bg-red-900/10 px-2 rounded">CANCELADA</span>
                                {cita.motivoCancelacion && <span className="text-[10px] text-zinc-500 italic max-w-50 truncate">"{cita.motivoCancelacion}"</span>}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                    {!isCancelled && (
                      <button onClick={(e) => { e.stopPropagation(); if (cita.id) solicitarCancelacion(cita.id); }} className="text-zinc-500 hover:text-red-500 p-2 hover:bg-zinc-800 rounded-full transition-colors" title="Cancelar Cita">
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
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans text-gray-200 pb-20">
      
      {citaParaCancelar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Cancelar Cita</h3>
            <p className="text-zinc-400 text-sm mb-4">¿Por qué se cancela esta cita?</p>
            <textarea value={motivoCancelacion} onChange={(e) => setMotivoCancelacion(e.target.value)} placeholder="Escribe un motivo (Opcional)..." className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-red-600 outline-none resize-none h-24 mb-6 placeholder:text-zinc-600" autoFocus />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCitaParaCancelar(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 transition-colors">Volver</button>
              <button onClick={confirmarCancelacion} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-700 text-white hover:bg-red-600 shadow-lg shadow-red-900/20 transition-all active:scale-95">Confirmar Cancelación</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">PANEL DE CONTROL</h1>
          <button onClick={cargarCitas} className="bg-zinc-800 hover:bg-zinc-700 text-xs uppercase font-bold py-2 px-4 rounded transition-colors border border-zinc-700">
            ↻ Actualizar
          </button>
        </div>

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <input 
            type="text" 
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              if(e.target.value) {
                const todasAbiertas = Object.keys(citasPorFecha).reduce((acc, fecha) => ({...acc, [fecha]: true}), {});
                setFechasExpandidas(todasAbiertas);
                setMostrarHistorial(true); // Al buscar, expandimos todo
              } else {
                setFechasExpandidas({});
                setMostrarHistorial(false); // Al limpiar, ocultamos historial
              }
            }}
            placeholder="Buscar por celular o nombre..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all placeholder:text-zinc-600"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {!busqueda ? (
            <>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                <span className="text-2xl font-bold text-white block">{totalHoy}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Citas Hoy</span>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                <span className="text-2xl font-bold text-emerald-400 block">{totalPendientes}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Activas Global</span>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                <span className="text-2xl font-bold text-red-400 block">{totalCanceladas}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Canceladas Global</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-800/50 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <span className="text-2xl font-bold text-blue-200 block">{busquedaTotal}</span>
                <span className="text-xs text-blue-400 uppercase tracking-wider font-bold">Historial Total</span>
              </div>
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                <span className="text-2xl font-bold text-white block">{busquedaEfectivas}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Asistidas</span>
              </div>
              <div className="bg-red-900/20 p-4 rounded-xl border border-red-800/50 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                <span className="text-2xl font-bold text-red-400 block">{busquedaCanceladas}</span>
                <span className="text-xs text-red-400 uppercase tracking-wider font-bold">Canceladas</span>
              </div>
            </>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 animate-pulse">Cargando agenda...</div>
        ) : (
          <div className="space-y-4">
            {todasLasFechas.length === 0 && (
              <div className="text-center py-10 bg-zinc-900/50 rounded-xl border border-zinc-800 border-dashed">
                <p className="text-zinc-500">
                  {busqueda ? `No se encontraron citas para "${busqueda}"` : "No hay citas registradas aún."}
                </p>
              </div>
            )}
            
            {/* 1. SECCIÓN DE CITAS FUTURAS Y HOY (Siempre visibles) */}
            <RenderGrupoFechas fechas={fechasFuturas} />

            {/* 2. SECCIÓN DE HISTORIAL (Oculta por defecto, a menos que busques) */}
            {!busqueda && fechasPasadas.length > 0 && (
              <div className="mt-12 pt-8 border-t border-zinc-900">
                <button 
                  onClick={() => setMostrarHistorial(!mostrarHistorial)}
                  className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mx-auto text-sm font-medium"
                >
                  {mostrarHistorial ? 'Ocultar' : 'Ver'} Historial Anterior ({fechasPasadas.length} días pasados)
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${mostrarHistorial ? 'rotate-180' : 'rotate-0'}`}><path d="m6 9 6 6 6-6"/></svg>
                </button>

                <div className={`transition-all duration-500 overflow-hidden ${mostrarHistorial ? 'max-h-1250 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
                   <RenderGrupoFechas fechas={fechasPasadas} />
                </div>
              </div>
            )}

            {/* Si estamos buscando, simplemente mostramos el historial mezclado arriba, o lo forzamos aquí si quedó algo suelto */}
            {busqueda && fechasPasadas.length > 0 && (
               <RenderGrupoFechas fechas={fechasPasadas} />
            )}

          </div>
        )}
      </div>
    </div>
  );
}