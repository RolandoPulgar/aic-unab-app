// -----------------------------------------------------
// ROBOT ACTUALIZADOR DE CONTENIDOS AIC-UNAB (Versión RSS Real + Limpieza)
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

    // Procesar noticias del feed
    for (const item of feed.items) {
      if (count >= 15) break; // Solo procesar las necesarias por ahora

      const uniqueId = generateId(item.link);

      // Intentar rescatar imagen de enclosure o content
      let imageUrl = null;
      if (item.enclosure && item.enclosure.url) {
        imageUrl = item.enclosure.url;
      } else if (item.content && item.content.match(/src="([^"]+)"/)) {
        imageUrl = item.content.match(/src="([^"]+)"/)[1];
      }

      // Si no hay imagen, asignamos una aleatoria de construcción de Unsplash
      if (!imageUrl) {
        const placehoderImages = [
          'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1590644365607-1c5a38fcbc60?q=80&w=600&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1535732820275-9ffd998cac22?q=80&w=600&auto=format&fit=crop'
        ];
        // Usamos el hash para elegir siempre la misma imagen para la misma noticia y evitar parpadeos
        const index = parseInt(uniqueId.substring(0, 8), 16) % placehoderImages.length;
        imageUrl = placehoderImages[index];
      }

      const noticia = {
        id: uniqueId,
        source: item.creator || item.source || 'Google News',
        category: 'Construcción',
        title: item.title,
        date: new Date(item.pubDate).toLocaleDateString('es-CL'),
        isoDate: new Date(item.pubDate).toISOString(), // Para ordenar correctamente
        url: item.link,
        image: imageUrl,
        type: 'news',
        timestamp: FieldValue.serverTimestamp()
      };

      const docRef = collectionRef.doc(uniqueId);
      batch.set(docRef, noticia, { merge: true });
      count++;
    }

    await batch.commit();
    console.log(`✅ Se actualizaron/insertaron noticias nuevas.`);

    // --- LIMPIEZA DE ANTIGUAS/DUPLICADAS ---
    console.log('🧹 Iniciando limpieza de noticias antiguas...');
    const snapshot = await collectionRef.get();
    const docs = [];
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    // Ordenar por isoDate (descendente: recientes primero)
    // Si no tiene isoDate (antiguas), usamos timestamp o fecha nula (se irán al fondo y se borrarán)
    docs.sort((a, b) => {
      const dateA = a.isoDate ? new Date(a.isoDate) : new Date(0);
      const dateB = b.isoDate ? new Date(b.isoDate) : new Date(0);
      return dateB - dateA; // Descendente
    });

    // Mantener solo las 15 primeras, borrar el resto
    if (docs.length > 15) {
      const deleteBatch = db.batch();
      const toDelete = docs.slice(15);

      for (const doc of toDelete) {
        deleteBatch.delete(collectionRef.doc(doc.id));
      }

      await deleteBatch.commit();
      console.log(`🗑️ Se eliminaron ${toDelete.length} noticias antiguas/duplicadas.`);
    } else {
      console.log('✅ Cantidad de noticias en rango aceptable.');
    }

  } catch (error) {
    console.error('❌ Error al procesar RSS:', error);
  }

  process.exit();
}