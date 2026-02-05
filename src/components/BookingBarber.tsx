import { useState, useEffect } from 'react';
import { crearCita, obtenerHorariosOcupados } from '../services/citas'; 
import { toast } from 'sonner';

// Asegúrate de que la ruta del logo sea correcta
import logoImg from '../assets/logo.png'; 

export default function BookingBarber() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservedSlots, setReservedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- HORARIOS ---
  const morningSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'
  ];

  const afternoonSlots = [
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', 
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', 
    '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', 
    '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', 
    '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
  ];

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
    <div className="min-h-dvh bg-zinc-950 text-gray-200 flex flex-col items-center py-8 px-4 font-sans">
      
      {/* SECCIÓN DEL LOGO */}
      <div className="max-w-md w-full mb-8 text-center flex flex-col items-center">
        <img 
          src={logoImg} 
          alt="Logo JBarber Shop" 
          className="w-32 md:w-40 mb-4 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
        />
        <p className="text-zinc-500 uppercase text-xs tracking-[0.2em]">Reserva tu estilo</p>
      </div>

      <div className="max-w-md w-full bg-zinc-900 p-5 rounded-xl border border-zinc-800 shadow-2xl mb-10">
        
        <div className="mb-6">
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Selecciona una fecha</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
            className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg p-3 outline-none focus:border-red-700 transition-colors text-base appearance-none"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Horarios Disponibles</h2>
          {loading && <span className="text-xs text-zinc-500 animate-pulse">Cargando...</span>}
        </div>

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
                      : 'bg-zinc-800 text-gray-300 border-zinc-700 active:scale-95'
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
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-3 text-base focus:border-red-700 outline-none"
              />
              
              <input 
                type="tel" 
                placeholder="Tu Teléfono" 
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-3 text-base focus:border-red-700 outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={submitting}
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
      
      {/* --- SECCIÓN REDES SOCIALES --- */}
      <div className="w-full max-w-xs flex flex-col items-center mb-8">
        
        {/* LETRERO DECORATIVO */}
        <div className="flex items-center w-full gap-4 mb-5 opacity-70">
           <div className="h-px bg-zinc-700 flex-1"></div>
           <span className="text-xs text-zinc-400 font-bold tracking-[0.2em] uppercase whitespace-nowrap">Síguenos</span>
           <div className="h-px bg-zinc-700 flex-1"></div>
        </div>

        <div className="flex gap-8">
          {/* Facebook */}
          <a 
            href="https://www.facebook.com/share/1C43CofA7q/?mibextid=wwXIfr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-blue-500 transition-colors transform hover:scale-110 duration-200"
            aria-label="Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>

          {/* Instagram */}
          <a 
            href="https://www.instagram.com/josue_del_cid_?igsh=MW91Y2V6bzYzbDJ6OQ%3D%3D&utm_source=qr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-pink-500 transition-colors transform hover:scale-110 duration-200"
            aria-label="Instagram"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>

          {/* TikTok */}
          <a 
            href="https://www.tiktok.com/@josue_barber_502" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-white transition-colors transform hover:scale-110 duration-200"
            aria-label="TikTok"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
          </a>
        </div>
      </div>

      {/* PIE DE PÁGINA */}
      <p className="text-xs text-zinc-600 mb-10 text-center leading-relaxed">
        Horario de Almuerzo: 1:00 PM - 2:00 PM
        <br/>
        <span className="opacity-50">Última cita: 11:30 PM, Cerramos a medianoche.</span>
      </p>
    </div>
  );
}