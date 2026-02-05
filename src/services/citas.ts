import { db } from "../firebase/config";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  orderBy,
  deleteDoc,
  doc,
  updateDoc 
} from "firebase/firestore";

export interface Cita {
  id?: string;
  clienteNombre: string;
  fecha: string; 
  hora: string;  
  telefono?: string;
  estado?: 'confirmada' | 'cancelada';
  motivoCancelacion?: string; // <--- NUEVO CAMPO
}

const COLLECTION_NAME = "citas";

// 1. Guardar nueva cita
export const crearCita = async (cita: Cita) => {
  try {
    const ocupado = await verificarDisponibilidad(cita.fecha, cita.hora);
    if (ocupado) throw new Error("Este horario ya fue reservado.");

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...cita,
      estado: 'confirmada', 
      creadoEn: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error al crear cita: ", e);
    throw e;
  }
};

// 2. Obtener horarios ocupados
export const obtenerHorariosOcupados = async (fecha: string): Promise<string[]> => {
  const q = query(
    collection(db, COLLECTION_NAME), 
    where("fecha", "==", fecha)
  );
  
  const querySnapshot = await getDocs(q);
  
  const horariosOcupados = querySnapshot.docs
    .map(doc => doc.data() as Cita)
    .filter(cita => cita.estado !== 'cancelada') 
    .map(cita => cita.hora);

  return horariosOcupados;
};

// 3. Verificar disponibilidad
const verificarDisponibilidad = async (fecha: string, hora: string): Promise<boolean> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("fecha", "==", fecha),
    where("hora", "==", hora)
  );
  const snapshot = await getDocs(q);
  
  const citasEnEsaHora = snapshot.docs.map(doc => doc.data() as Cita);
  const hayCitaActiva = citasEnEsaHora.some(cita => cita.estado !== 'cancelada');
  
  return hayCitaActiva;
};

// 4. Ver TODAS las reservas
export const obtenerTodasLasCitas = async (): Promise<Cita[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("fecha", "asc"), 
    orderBy("hora", "asc")   
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  } as Cita));
};

// 5. Cancelar cita con motivo
export const cancelarCita = async (id: string, motivo?: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    // Actualizamos estado y motivo
    await updateDoc(docRef, {
      estado: 'cancelada',
      motivoCancelacion: motivo || "Sin motivo especificado"
    });
  } catch (error) {
    console.error("Error cancelando:", error);
    throw error;
  }
};

// (Opcional) Eliminar definitivamente
export const eliminarCita = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};