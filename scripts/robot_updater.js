// -----------------------------------------------------
// ROBOT ACTUALIZADOR DE CONTENIDOS AIC-UNAB (Versión ES Module)
// -----------------------------------------------------

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';

// Truco para leer el archivo JSON en modo moderno
const require = createRequire(import.meta.url);

let serviceAccount;
try {
  serviceAccount = require('./service-account.json');
} catch (e) {
  console.error("❌ ERROR CRÍTICO: No se encontró el archivo 'service-account.json'.");
  console.error("1. Ve a Firebase Console -> Configuración del proyecto -> Cuentas de servicio.");
  console.error("2. Genera una nueva clave privada.");
  console.error("3. Guarda el archivo descargado en la carpeta 'scripts' con el nombre 'service-account.json'.");
  process.exit(1);
}

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const appId = 'aic_unab_portal_v1';

// --- DATOS NUEVOS A INYECTAR ---

const NOTICIAS_FRESCAS = [
  {
    id: Date.now().toString(),
    source: 'CChC',
    category: 'Informe',
    title: 'Informe MACh: Inversión en infraestructura pública crecería 5% este año',
    date: new Date().toLocaleDateString('es-CL'),
    url: 'https://cchc.cl',
    type: 'news',
    timestamp: FieldValue.serverTimestamp()
  },
  {
    id: (Date.now() + 1).toString(),
    source: 'MOP',
    category: 'Vialidad',
    title: 'Se aprueba trazado definitivo para nueva autopista orbital',
    date: new Date().toLocaleDateString('es-CL'),
    url: 'https://mop.cl',
    type: 'news',
    timestamp: FieldValue.serverTimestamp()
  },
  {
    id: (Date.now() + 2).toString(),
    source: 'Diario Financiero',
    category: 'Mercado',
    title: `Resumen de mercados: ${new Date().toLocaleDateString('es-CL')}`,
    date: 'Hace 1 hora',
    url: 'https://df.cl',
    type: 'news',
    timestamp: FieldValue.serverTimestamp()
  }
];

const LICITACIONES_NUEVAS = [
  {
    id: '5501-15-LR26',
    title: 'Reposición Hospital de Alta Complejidad Zona Norte',
    region: 'Metropolitana',
    amount: '2.500.000 UTM',
    closingDate: '30/12/2026',
    type: 'tender',
    url: 'https://mercadopublico.cl'
  },
  {
    id: '3320-05-LP26',
    title: 'Pavimentación Básica Ruta J-60, Tramo Costa',
    region: 'Maule',
    amount: '45.000 UTM',
    closingDate: '15/10/2026',
    type: 'tender',
    url: 'https://mercadopublico.cl'
  }
];

async function ejecutarRobot() {
  console.log('🤖 Robot iniciado. Conectando a la base de datos AIC-UNAB...');

  const batch = db.batch();
  const collectionRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('market_news');

  // 1. Agregar Noticias
  console.log('📰 Procesando noticias...');
  NOTICIAS_FRESCAS.forEach(noticia => {
    const docRef = collectionRef.doc(noticia.id);
    batch.set(docRef, noticia);
    console.log(`   + Agregando: ${noticia.title}`);
  });

  // 2. Agregar Licitaciones
  console.log('🏗️ Procesando licitaciones...');
  LICITACIONES_NUEVAS.forEach(licitacion => {
    const docRef = collectionRef.doc(licitacion.id);
    // Añadimos timestamp manualmente aquí para las licitaciones también
    batch.set(docRef, { ...licitacion, timestamp: FieldValue.serverTimestamp() });
    console.log(`   + Agregando: ${licitacion.title}`);
  });

  // 3. Enviar todo a la nube
  try {
    await batch.commit();
    console.log('✅ ¡Éxito! La base de datos ha sido actualizada.');
    console.log('   Ve a tu página web y recárgala para ver los cambios.');
  } catch (error) {
    console.error('❌ Error al actualizar:', error);
  }

  process.exit();
}

// Ejecutar
ejecutarRobot();