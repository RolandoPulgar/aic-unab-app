import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import {
  collection, onSnapshot, query, orderBy,
  doc, getDoc, updateDoc, where, increment
} from 'firebase/firestore';
import { auth, db, appId } from './services/firebase';

// Components
import ErrorBoundary from './components/shared/ErrorBoundary';
import LandingPage from './components/auth/LandingPage';
import Sidebar from './components/layout/Sidebar';
import MobileHeader from './components/layout/MobileHeader';
import Dashboard from './components/dashboard/Dashboard';
import Forum from './components/forum/Forum';
import Showcase from './components/showcase/Showcase';
import Gallery from './components/gallery/Gallery';
import Tenders from './components/tenders/Tenders';
import Directory from './components/directory/Directory';
import ProfileModal from './components/profile/ProfileModal';

// Constants
import { DEFAULT_MARKET_NEWS, DEFAULT_ECONOMIC, DEFAULT_TENDERS } from './constants';

function AppContent() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('landing');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Datos Globales
  const [marketNews, setMarketNews] = useState(DEFAULT_MARKET_NEWS);
  const [economicIndicators, setEconomicIndicators] = useState(DEFAULT_ECONOMIC);
  const [tenders, setTenders] = useState(DEFAULT_TENDERS);
  const [showcaseItems, setShowcaseItems] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);

  // Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const snap = await getDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'info'));
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            setView('dashboard');
          } else {
            setUserData(null); setView('landing');
          }
        } catch (e) { console.error(e); setUserData(null); }
      } else {
        setUserData(null); setView('landing');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listeners de Datos Globales
  useEffect(() => {
    if (!user) return;

    // Noticias
    const unsubNews = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'market_news'), where('type', '==', 'news')), (s) => {
      if (!s.empty) {
        const newsData = s.docs.map(d => d.data()).sort((a, b) => {
          const timeA = a.timestamp ? a.timestamp.seconds : parseInt(a.id);
          const timeB = b.timestamp ? b.timestamp.seconds : parseInt(b.id);
          return timeB - timeA;
        });
        setMarketNews(newsData);
      }
    });

    // Licitaciones
    const unsubTenders = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'market_news'), where('type', '==', 'tender')), (s) => {
      if (!s.empty) setTenders(s.docs.map(d => d.data()));
    });

    // Indicadores
    const unsubIndicators = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'market_indicators', 'current'), (s) => {
      if (s.exists()) setEconomicIndicators(s.data().items);
    });

    let unsubShowcase = () => { }, unsubGallery = () => { };
    if (userData && userData.role !== 'Estudiante') {
      unsubShowcase = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'showcase'), orderBy('createdAt', 'desc')), (s) => setShowcaseItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      unsubGallery = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), orderBy('createdAt', 'desc')), (s) => setGalleryImages(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
    return () => { unsubNews(); unsubTenders(); unsubIndicators(); unsubShowcase(); unsubGallery(); };
  }, [user, userData?.role]);

  const logout = async () => { await signOut(auth); setUserData(null); setView('landing'); };

  const toggleAdminMode = async () => {
    if (!user) return;
    const newStatus = !userData.isAdmin;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info'), { isAdmin: newStatus, canViewDirectory: newStatus });
    setUserData(p => ({ ...p, isAdmin: newStatus, canViewDirectory: newStatus }));
  };

  const addPoints = async (amount) => {
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
    const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'members_index', user.uid);
    const newPoints = (userData.points || 0) + amount;
    let newRank = userData.rank;
    if (userData.role !== 'Estudiante') {
      if (newPoints < 500) newRank = 'blanco';
      else if (newPoints >= 500 && newPoints < 1000) newRank = 'plata';
      else if (newPoints >= 1000) newRank = 'oro';
    }
    await updateDoc(userRef, { points: increment(amount), rank: newRank });
    if (newRank !== userData.rank) { await updateDoc(memberRef, { rank: newRank }); }
    setUserData(prev => ({ ...prev, points: newPoints, rank: newRank }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-600">Cargando...</div>;

  if (!userData && view === 'landing') {
    return <LandingPage />;
  }
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifica tu Correo</h2>
          <p className="text-slate-600 mb-6 font-medium">Hemos enviado un enlace de confirmación a <br /><span className="text-slate-800 font-bold">{user.email}</span>.</p>
          <p className="text-slate-400 text-sm mb-8">Por favor valida tu cuenta para acceder a la Red de Ingenieros.</p>

          <div className="space-y-3">
            <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
              Ya verifiqué mi correo
            </button>
            <button onClick={async () => {
              try {
                auth.languageCode = 'es'; // Forzar español
                await sendEmailVerification(user);
                alert('Correo reenviado. Revisa tu bandeja de Spam.');
              } catch (e) {
                alert('Error al reenviar (espera unos minutos): ' + e.message);
              }
            }} className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-100 transition">
              Reenviar correo
            </button>
            <button onClick={logout} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-slate-800">
      <Sidebar
        view={view}
        setView={setView}
        userData={userData}
        logout={logout}
        openProfileEditor={() => setShowProfileModal(true)}
        toggleAdminMode={toggleAdminMode}
      />

      <MobileHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        view={view}
        setView={setView}
        userData={userData}
        logout={logout}
      />

      <main className="flex-1 p-4 md:p-8 bg-slate-50 relative">
        {showProfileModal && (
          <ProfileModal
            userData={userData}
            onClose={() => setShowProfileModal(false)}
            onUpdate={(updatedDeps) => setUserData(prev => ({ ...prev, ...updatedDeps }))}
          />
        )}

        {view === 'dashboard' && <Dashboard userData={userData} economicIndicators={economicIndicators} marketNews={marketNews} />}
        {view === 'forum' && <Forum user={user} userData={userData} addPoints={addPoints} />}
        {view === 'showcase' && <Showcase userData={userData} showcaseItems={showcaseItems} />}
        {view === 'tenders' && <Tenders userData={userData} tenders={tenders} />}
        {view === 'gallery' && <Gallery userData={userData} galleryImages={galleryImages} />}
        {view === 'members' && <Directory userData={userData} />}
      </main>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppContent /></ErrorBoundary>;
}