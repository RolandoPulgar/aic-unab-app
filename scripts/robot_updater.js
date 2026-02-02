// -----------------------------------------------------
// ROBOT ACTUALIZADOR DE CONTENIDOS AIC-UNAB (Versión RSS Real)
// -----------------------------------------------------

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import Parser from 'rss-parser';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const parser = new Parser();

// Configuración de Feeds (Google News - Construcción Chile)
const FEED_URL = 'https://news.google.com/rss/search?q=construccion+chile+when:1d&hl=es-419&gl=CL&ceid=CL:es-419';

let serviceAccount;
try {
  serviceAccount = require('./service-account.json');
} catch (e) {
  console.error("❌ ERROR CRÍTICO: No se encontró el archivo 'service-account.json'.");
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

async function ejecutarRobot() {
  console.log('🤖 Robot iniciado. Conectando a RSS de Google News...');

  try {
    const feed = await parser.parseURL(FEED_URL);
    console.log(`📡 Feed obtenido: ${feed.title}`);

    const batch = db.batch();
    const collectionRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('market_news');

    let count = 0;

    // Procesar las primeras 10 noticias
    for (const item of feed.items.slice(0, 10)) {
      const uniqueId = generateId(item.link); // ID basado en URL para evitar duplicados

      // Intentar rescatar una imagen del contenido si existe, sino usar una genérica
      let imageUrl = null;
      if (item.content && item.content.includes('<img')) {
        const imgMatch = item.content.match(/src="([^"]+)"/);
        if (imgMatch) imageUrl = imgMatch[1];
      }

      const noticia = {
        id: uniqueId,
        source: item.creator || item.source || 'Google News',
        category: 'Construcción',
        title: item.title,
        date: new Date(item.pubDate).toLocaleDateString('es-CL'),
        url: item.link,
        image: imageUrl, // Nuevo campo de imagen
        type: 'news',
        timestamp: FieldValue.serverTimestamp() // Timestamp de guardado
      };

      const docRef = collectionRef.doc(uniqueId);
      batch.set(docRef, noticia, { merge: true }); // Merge evita borrar campos si existieran, y el ID único evita duplicados visuales
      console.log(`   + Preparando: ${item.title.substring(0, 50)}...`);
      count++;
    }

    if (count > 0) {
      await batch.commit();
      console.log(`✅ ¡Éxito! Se actualizaron ${count} noticias.`);
    } else {
      console.log('⚠️ No se encontraron noticias nuevas.');
    }

  } catch (error) {
    console.error('❌ Error al procesar RSS:', error);
  }

  process.exit();
}

// Ejecutar
ejecutarRobot();