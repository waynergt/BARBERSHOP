import { useState, useEffect } from 'react';
import { crearCita, obtenerHorariosOcupados } from '../services/citas'; 
import { toast } from 'sonner';
import logoImg from '../assets/logo.png'; 

const BACKGROUND_IMAGE_URL = "https://images.unsplash.com/photo-1503951914875-452162b7f342?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
const NUMERO_BARBERO = "50256927575"; // Cambia esto por el número real del barbero (con código de país, sin signos ni espacios)

// 👇 INTERRUPTOR DE EMERGENCIA (Cambiar a false cuando ya pueda trabajar)
const MODO_EMERGENCIA = true; 

export default function BookingBarber() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservedSlots, setReservedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const morningSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'];
  const afternoonSlots = ['02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'];
  const allTimes = [...morningSlots, ...afternoonSlots];

  useEffect(() => {
    if (MODO_EMERGENCIA) return; // Si está en emergencia, no cargamos horarios para ahorrar datos
    const fetchSlots = async () => {
      setLoading(true);
      setReservedSlots([]);
      try {
        const ocupados = await obtenerHorariosOcupados(date);
        setReservedSlots(ocupados);
      } catch (error) {
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
      toast.success(`¡Reserva confirmada a las ${selectedSlot}!`, { description: 'Abriendo WhatsApp...', duration: 4000 });
      setReservedSlots([...reservedSlots, selectedSlot]);
      
      const mensaje = `Hola, soy *${name}*. 👋\nAcabo de reservar mi corte en la web para el día *${date}* a las *${selectedSlot}*.\nMi número es: ${phone}. ¡Nos vemos! 💈`;
      const urlWhatsApp = `https://wa.me/${NUMERO_BARBERO}?text=${encodeURIComponent(mensaje)}`;
      
      setTimeout(() => { window.location.href = urlWhatsApp; }, 500);
      cerrarModal();
    } catch (error) {
      toast.error("Hubo un error al reservar");
    } finally {
      setSubmitting(false);
    }
  };

  const cerrarModal = () => { setSelectedSlot(null); setName(''); setPhone(''); };

  return (
    <div className="min-h-dvh relative flex flex-col items-center py-8 px-4 font-sans text-gray-200 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed transform scale-105" style={{ backgroundImage: `url('${BACKGROUND_IMAGE_URL}')` }}></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/85 to-zinc-950/95 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="max-w-md w-full mb-8 text-center flex flex-col items-center animate-in fade-in slide-in-from-top-5 duration-700">
          <img src={logoImg} alt="Logo JBarber Shop" className="w-32 md:w-40 mb-4 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]" />
          <p className="text-zinc-400 uppercase text-xs tracking-[0.3em] font-medium">Reserva tu estilo</p>
        </div>

        {/* LÓGICA DE EMERGENCIA */}
        {MODO_EMERGENCIA ? (
          <div className="max-w-md w-full bg-red-950/40 border border-red-500/30 p-8 rounded-2xl shadow-2xl mb-10 text-center backdrop-blur-md animate-in zoom-in-95 duration-500">
             <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/50">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
             </div>
             <h2 className="text-xl font-bold text-white mb-3">Aviso Importante</h2>
             <p className="text-zinc-300 text-sm leading-relaxed mb-2">
               Por motivos de fuerza mayor (salud), nuestro barbero <span className="font-bold text-red-400">JosStyle30Dc</span> no estara disponible <span className="font-bold text-red-400">hasta nuevo aviso</span>.
             </p>
             <p className="text-zinc-400 text-xs mt-4">Agradecemos tu comprensión. Nos vemos pronto.</p>
          </div>
        ) : (
          <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-800/50 shadow-2xl mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 ml-1">Selecciona una fecha</label>
              <div className="relative">
                <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }} className="w-full bg-zinc-950/50 border border-zinc-700/50 text-white rounded-xl p-3 outline-none focus:border-red-700/80 focus:ring-1 focus:ring-red-700/50 transition-all text-base appearance-none relative z-10" />
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-3.5 text-zinc-500 pointer-events-none z-0 opacity-50"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
            </div>
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Horarios Disponibles</h2>
              {loading && <span className="text-xs text-red-400/80 animate-pulse font-medium">Cargando...</span>}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {allTimes.map((time) => {
                const isReserved = reservedSlots.includes(time);
                return (
                  <button key={time} disabled={isReserved || loading} onClick={() => setSelectedSlot(time)} className={`py-3 px-1 rounded-xl text-sm font-bold transition-all duration-300 border relative touch-manipulation overflow-hidden group ${isReserved ? 'bg-zinc-950/30 text-zinc-600 border-transparent cursor-not-allowed decoration-zinc-700' : 'bg-zinc-800/50 text-gray-200 border-zinc-700/50 hover:bg-zinc-700/80 hover:border-red-900/30 hover:text-white active:scale-95'}`}>
                    <span className="relative z-10">{time}</span>
                    {isReserved && <div className="absolute inset-0 flex items-center justify-center z-0 bg-zinc-950/40"><div className="w-[120%] h-px bg-zinc-700/80 rotate-[-20deg]"></div></div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="w-full max-w-xs flex flex-col items-center mb-8 animate-in fade-in delay-300 duration-700">
          <div className="flex items-center w-full gap-4 mb-5 opacity-60">
             <div className="h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent flex-1"></div>
             <span className="text-[10px] text-zinc-400 font-bold tracking-[0.3em] uppercase whitespace-nowrap">Síguenos</span>
             <div className="h-px bg-gradient-to-r from-transparent via-zinc-500 to-transparent flex-1"></div>
          </div>
          <div className="flex gap-8 p-4 bg-zinc-900/30 rounded-full backdrop-blur-sm border border-white/5 shadow-lg">
            <a href="https://www.facebook.com/share/1C43CofA7q/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition-all transform hover:scale-110 hover:-translate-y-1 duration-300"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
            <a href="https://www.instagram.com/josue_del_cid_?igsh=MW91Y2V6bzYzbDJ6OQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-pink-400 transition-all transform hover:scale-110 hover:-translate-y-1 duration-300"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg></a>
            <a href="https://www.tiktok.com/@josue_barber_502" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-all transform hover:scale-110 hover:-translate-y-1 duration-300"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></a>
          </div>
        </div>
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900/95 border border-zinc-700/50 rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 bg-zinc-800/50 rounded-full transition-colors hover:bg-zinc-700"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
            <h3 className="text-xl font-bold text-white mb-1 tracking-tight">Confirma tu cita</h3>
            <p className="text-zinc-400 text-sm mb-6">Reservando para las <span className="text-red-500 font-black text-base ml-1">{selectedSlot}</span></p>
            <form onSubmit={handleBooking} className="space-y-5">
              <div className="space-y-2 group">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider group-focus-within:text-red-500/80 transition-colors ml-1">Tu Nombre</label>
                <input type="text" placeholder="Ej: Juan Pérez" required autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 text-white rounded-xl p-4 text-base focus:border-red-600/80 focus:ring-2 focus:ring-red-900/20 outline-none transition-all placeholder:text-zinc-600/50" />
              </div>
              <div className="space-y-2 group">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider group-focus-within:text-red-500/80 transition-colors ml-1">Tu Teléfono</label>
                <input type="tel" placeholder="Ej: 5555-5555" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 text-white rounded-xl p-4 text-base focus:border-red-600/80 focus:ring-2 focus:ring-red-900/20 outline-none transition-all placeholder:text-zinc-600/50" />
              </div>
              <div className="pt-3 flex gap-3">
                <button type="button" onClick={cerrarModal} className="flex-1 py-3.5 rounded-xl font-bold text-sm text-zinc-400 hover:bg-zinc-800/80 hover:text-white transition-colors border border-transparent hover:border-zinc-700/50">Cancelar</button>
                <button type="submit" disabled={submitting} className={`flex-[2] py-3.5 rounded-xl font-black tracking-wider uppercase text-sm transition-all active:scale-95 relative overflow-hidden group ${submitting ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/30 hover:shadow-red-700/40 hover:from-red-600 hover:to-red-500'}`}>
                  <span className="relative z-10">{submitting ? 'Confirmando...' : 'Confirmar Reserva'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}