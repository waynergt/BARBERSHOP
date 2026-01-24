import { useState, useEffect } from 'react';
import { crearCita, obtenerHorariosOcupados } from '../services/citas'; 
import { toast } from 'sonner';

export default function BookingBarber() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservedSlots, setReservedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- HORARIOS ---
  const morningSlots = ['09:00', '09:45', '10:30', '11:15'];
  const afternoonSlots = ['13:15', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45', '18:30', '19:15', '20:00'];
  const allTimes = [...morningSlots, ...afternoonSlots];

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setReservedSlots([]);
      try {
        const ocupados = await obtenerHorariosOcupados(date);
        setReservedSlots(ocupados);
      } catch (error) {
        console.error("Error cargando horarios:", error);
        toast.error("Error al cargar disponibilidad");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [date]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name || !phone) return;

    setSubmitting(true);
    try {
      await crearCita({ clienteNombre: name, telefono: phone, fecha: date, hora: selectedSlot });
      toast.success(`¡Reserva confirmada a las ${selectedSlot}!`, { description: 'Te esperamos en la barbería.', duration: 5000 });
      setReservedSlots([...reservedSlots, selectedSlot]);
      setSelectedSlot(null);
      setName('');
      setPhone('');
    } catch (error) {
      console.error("Error reservando:", error);
      toast.error("Hubo un error al reservar", { description: "Es posible que alguien haya ganado el lugar." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // CAMBIO 1: min-h-dvh para que la barra del navegador no tape nada
    <div className="min-h-dvh bg-zinc-950 text-gray-200 flex flex-col items-center py-8 px-4 font-sans">
      
      <div className="max-w-md w-full mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">JBARBER SHOP</h1>
        <p className="text-zinc-500 uppercase text-xs tracking-[0.2em]">Reserva tu estilo</p>
      </div>

      <div className="max-w-md w-full bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-2xl">
        
        <div className="mb-6">
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Selecciona una fecha</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
            // CAMBIO 2: text-base en móviles evita el zoom automático en iPhone
            // touch-manipulation mejora la respuesta al dedo
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 outline-none focus:border-red-700 transition-colors text-base appearance-none"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Horarios Disponibles</h2>
          {loading && <span className="text-xs text-zinc-500 animate-pulse">Cargando...</span>}
        </div>

        {/* CAMBIO 3: Grid de 3 columnas es perfecto para pulgares. touch-manipulation añadido */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {allTimes.map((time) => {
            const isReserved = reservedSlots.includes(time);
            const isSelected = selectedSlot === time;

            return (
              <button
                key={time}
                disabled={isReserved || loading}
                onClick={() => setSelectedSlot(time)}
                className={`
                  py-3 px-1 rounded-lg text-sm font-medium transition-all duration-200 border relative touch-manipulation
                  ${isReserved 
                    ? 'bg-zinc-950/50 text-zinc-700 border-transparent cursor-not-allowed decoration-zinc-800' 
                    : isSelected
                      ? 'bg-red-700 text-white border-red-700 shadow-[0_0_15px_rgba(185,28,28,0.4)] scale-105 z-10'
                      : 'bg-zinc-800 text-gray-300 border-zinc-700 active:scale-95' // Efecto al presionar con el dedo
                  }
                `}
              >
                {time}
                {isReserved && <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-zinc-700 rotate-[-15deg]"></div>
                </div>}
              </button>
            );
          })}
        </div>

        {selectedSlot && (
          <form onSubmit={handleBooking} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 space-y-3">
              <p className="text-sm text-gray-400 mb-2">
                Reservando para las <span className="text-white font-bold">{selectedSlot}</span>
              </p>
              
              <input 
                type="text" 
                placeholder="Tu Nombre" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                // CAMBIO 4: text-base para evitar zoom
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-3 text-base focus:border-red-700 outline-none"
              />
              
              <input 
                type="tel" 
                placeholder="Tu Teléfono" 
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                // CAMBIO 4: text-base para evitar zoom
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-3 text-base focus:border-red-700 outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={submitting}
              // CAMBIO 5: active:scale-95 da sensación táctil al presionar
              className={`
                w-full py-4 rounded-lg font-bold tracking-wide uppercase transition-all touch-manipulation active:scale-95
                ${submitting 
                  ? 'bg-zinc-700 text-zinc-400 cursor-wait' 
                  : 'bg-white text-black shadow-lg'}
              `}
            >
              {submitting ? 'Confirmando...' : 'Confirmar Reserva'}
            </button>
          </form>
        )}
        
        {!selectedSlot && (
           <div className="text-center py-4 text-zinc-600 text-sm">
             Selecciona un horario
           </div>
        )}

      </div>
      
      <p className="mt-8 text-xs text-zinc-600 mb-10">
        Almuerzo: 12:30 PM - 1:10 PM
      </p>
    </div>
  );
}