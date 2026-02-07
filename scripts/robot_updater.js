// -----------------------------------------------------
// ROBOT ACTUALIZADOR DE CONTENIDOS AIC-UNAB
// Genera Noticias (RSS Google) + Licitaciones Simuladas (20 diarias)
// -----------------------------------------------------

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import Parser from 'rss-parser';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const parser = new Parser();

// Configuración de Feeds
const FEED_URL = 'https://news.google.com/rss/search?q=construccion+chile+when:1d&hl=es-419&gl=CL&ceid=CL:es-419';

let serviceAccount;
try {
  serviceAccount = require('./service-account.json');
} catch (e) {
  console.error("❌ ERROR CRÍTICO AL CARGAR CONFIGURACIÓN:", e);
  process.exit(1);
}

// Inicializar Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const appId = 'aic_unab_portal_v1';

function generateId(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// --- GENERADOR DE LICITACIONES ---
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const REGIONS = ['Metropolitana', 'Valparaíso', 'O\'Higgins'];
const TYPES = ['Obra Pública', 'Vialidad', 'Edificación', 'Mantención', 'Remodelación', 'Infraestructura'];
const PREFIXES = ['Construcción', 'Remodelación', 'Mantención', 'Mejoramiento', 'Reposición', 'Habilitación', 'Conservación', 'Restauración'];
const OBJECTS = ['Escuela Básica', 'CESFAM', 'Ruta', 'Plaza', 'Sede Social', 'Pavimentación Participativa', 'Edificio Consistorial', 'Multicancha', 'Red de Alcantarillado', 'Jardín Infantil'];

function generateTenders(count = 20) {
  const tenders = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const region = getRandomItem(REGIONS);
    const type = getRandomItem(TYPES);
    const title = `${getRandomItem(PREFIXES)} ${getRandomItem(OBJECTS)} ${getRandomItem(['Sector Norte', 'Etapa II', 'Tramo 3', 'Global Mixta', ''])} - ${region}`;

    // Fechas
    const publishDate = new Date(); // Hoy
    const closingDate = new Date();
    closingDate.setDate(today.getDate() + getRandomInt(15, 60)); // Cierre entre 15 y 60 días

    const idCode = `${getRandomInt(1000, 9999)}-${getRandomInt(10, 99)}-L${['P', 'Q', 'R'][getRandomInt(0, 2)]}${today.getFullYear().toString().slice(-2)}`;

    tenders.push({
      id: idCode, // Usaremos este ID como docId también
      title: title.trim(),
      region: region,
      type: type,
      amount: `${getRandomInt(1000, 50000).toLocaleString('es-CL')} UTM`,
      closingDate: closingDate.toLocaleDateString('es-CL'),
      publishDate: publishDate.toLocaleDateString('es-CL'),
      url: '#',
      category: 'Inversión Pública',
      source: 'Mercado Público',
      typeDoc: 'tender', // Para diferenciar de 'news' en el campo 'type' (pero usaremos 'type' del objeto para UI, 'market_news' usa type para filtrar)
      // Ajuste: En la app se filtra por 'type' == 'tender'
    });
  }
  return tenders;
}

async function ejecutarRobot() {
  console.log('🤖 Robot iniciado...');

  const batch = db.batch();
  const collectionRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('market_news');

  // 1. PROCESAR NOTICIAS (RSS)
  try {
    const feed = await parser.parseURL(FEED_URL);
    console.log(`📡 Noticias obtenidas: ${feed.items.length}`);

    let newsCount = 0;
    for (const item of feed.items) {
      if (newsCount >= 10) break;
      const uniqueId = generateId(item.link);

      let imageUrl = null;
      if (item.enclosure?.url) imageUrl = item.enclosure.url;
      else if (item.content?.match(/src="([^"]+)"/)) imageUrl = item.content.match(/src="([^"]+)"/)[1];

      if (!imageUrl) {
        const placehoderImages = [
          'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop'
        ];
        imageUrl = placehoderImages[parseInt(uniqueId.substring(0, 8), 16) % placehoderImages.length];
      }

      const noticia = {
        id: uniqueId,
        source: item.creator || item.source || 'Google News',
        category: 'Construcción',
        title: item.title,
        date: new Date(item.pubDate).toLocaleDateString('es-CL'),
        isoDate: new Date(item.pubDate).toISOString(),
        url: item.link,
        image: imageUrl,
        type: 'news', // Importante para filtro
        timestamp: FieldValue.serverTimestamp()
      };
      batch.set(collectionRef.doc(uniqueId), noticia, { merge: true });
      newsCount++;
    }
    console.log('📰 Noticias preparadas para batch.');

  } catch (error) {
    console.error('❌ Error RSS:', error);
  }

  // 2. PROCESAR LICITACIONES (GENERACIÓN)
  try {
    // Primero, limpiar licitaciones antiguas si es necesario (Opcional, pero para mantener limpio hoy borraremos las 'tender' viejas para regenerar las "del día")
    // Para simplificar, simplemente escribiremos las nuevas. Si queremos "limpiar" visualmente, podríamos borrar todo lo que sea type='tender' primero.

    // Obtener tenders existentes para borrar (limpieza diaria)
    const tendersSnapshot = await collectionRef.where('type', '==', 'tender').get();
    tendersSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    console.log(`🗑️ Licitaciones antiguas marcadas para eliminación: ${tendersSnapshot.size}`);

    // Generar nuevas
    const newTenders = generateTenders(20);
    newTenders.forEach(tender => {
      const docRef = collectionRef.doc(tender.id);
      // Mapear al formato que espera la app
      const tenderData = {
        id: tender.id,
        title: tender.title,
        region: tender.region,
        amount: tender.amount,
        closingDate: tender.closingDate,
        publishDate: tender.publishDate,
        type: 'tender', // Esto es CLAVE para que la app lo lea como licitación
        timestamp: FieldValue.serverTimestamp(),
        // Campos extra para consistencia
        category: 'Licitación',
        source: 'Mercado Público',
        url: 'https://www.mercadopublico.cl'
      };
      batch.set(docRef, tenderData);
    });
    console.log(`🏗️ Generadas ${newTenders.length} licitaciones nuevas.`);

  } catch (error) {
    console.error('❌ Error generando licitaciones:', error);
  }

  // 3. COMMIT FINAL
  try {
    await batch.commit();
    console.log('✅ BATCH COMPLETADO EXITOSAMENTE.');
  } catch (e) {
    console.error('❌ Error en commit:', e);
  }

  process.exit();
}

ejecutarRobot();