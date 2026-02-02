import React, { useState } from 'react';
import { HardHat } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, appId } from '../../services/firebase';

export default function LandingPage({ onLoginSuccess }) {
    const [authMode, setAuthMode] = useState('login');

    // Estados formulario
    const [regName, setRegName] = useState('');
    const [regSurname, setRegSurname] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regCompany, setRegCompany] = useState('');
    const [regRole, setRegRole] = useState('');
    const [regType, setRegType] = useState('Ingeniero');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        try {
            if (authMode === 'login') {
                const userCredential = await signInWithEmailAndPassword(auth, regEmail, regPassword);
                // El listener en App.jsx manejará la redirección, pero podemos notificar si es necesario
            } else if (authMode === 'register') {
                const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
                const fullName = `${regName} ${regSurname}`;
                await updateProfile(cred.user, { displayName: fullName });
                const isStudent = regType === 'Estudiante';
                const newProfile = {
                    uid: cred.user.uid, firstName: regName, lastName: regSurname, fullName, displayName: fullName,
                    email: regEmail, phone: regPhone, company: isStudent ? 'UNAB' : regCompany, jobTitle: isStudent ? 'Alumno' : regRole,
                    role: isStudent ? 'Estudiante' : 'Ingeniero Constructor', rank: isStudent ? 'estudiante' : 'blanco',
                    points: 0, photoUrl: '', courses: '', isAdmin: false, canViewDirectory: false, joinedAt: new Date().toISOString()
                };
                await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'profile', 'info'), newProfile);
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members_index', cred.user.uid), { displayName: fullName, company: newProfile.company, rank: newProfile.rank, photoUrl: '', uid: cred.user.uid });

                // No necesitamos llamar a onLoginSuccess manualmente si App.jsx escucha onAuthStateChanged, 
                // pero reseteamos el modo para limpiar.
            } else if (authMode === 'recovery') {
                await sendPasswordResetEmail(auth, regEmail);
                alert('Correo enviado');
                setAuthMode('login');
            }
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-slate-800">
            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
                <div className="bg-slate-900 text-white p-10 md:w-1/2 flex flex-col justify-center relative"><div className="relative z-10"><div className="flex items-center gap-3 mb-6"><HardHat className="text-amber-400" size={32} /><span className="text-2xl font-bold">AIC-UNAB</span></div><h1 className="text-4xl font-extrabold mb-4">Red de Ingenieros</h1><p className="text-slate-400">Comunidad oficial.</p></div></div>
                <div className="p-10 md:w-1/2 flex flex-col justify-center">
                    <h2 className="text-2xl font-bold mb-6">{authMode === 'login' ? 'Iniciar Sesión' : authMode === 'register' ? 'Crear Cuenta' : 'Recuperar'}</h2>
                    <form onSubmit={handleAuthAction} className="space-y-4">
                        {authMode === 'register' && (
                            <div className="space-y-3">
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-2"><button type="button" onClick={() => setRegType('Ingeniero')} className={`flex-1 py-1.5 text-xs font-bold rounded ${regType === 'Ingeniero' ? 'bg-white shadow' : ''}`}>Ingeniero</button><button type="button" onClick={() => setRegType('Estudiante')} className={`flex-1 py-1.5 text-xs font-bold rounded ${regType === 'Estudiante' ? 'bg-white shadow' : ''}`}>Estudiante</button></div>
                                <div className="grid grid-cols-2 gap-2"><input className="p-3 border rounded text-sm" placeholder="Nombre" value={regName} onChange={e => setRegName(e.target.value)} required /><input className="p-3 border rounded text-sm" placeholder="Apellido" value={regSurname} onChange={e => setRegSurname(e.target.value)} required /></div>
                                <input className="w-full p-3 border rounded text-sm" placeholder="Teléfono" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                                {regType === 'Ingeniero' && <div className="grid grid-cols-2 gap-2"><input className="p-3 border rounded text-sm" placeholder="Empresa" value={regCompany} onChange={e => setRegCompany(e.target.value)} /><input className="p-3 border rounded text-sm" placeholder="Cargo" value={regRole} onChange={e => setRegRole(e.target.value)} /></div>}
                            </div>
                        )}
                        <div className="space-y-3"><input type="email" className="w-full p-3 border rounded text-sm" placeholder="Correo" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />{authMode !== 'recovery' && <input type="password" className="w-full p-3 border rounded text-sm" placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />}</div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded font-bold hover:bg-slate-800">{authMode === 'login' ? 'Entrar' : 'Enviar'}</button>
                    </form>
                    <div className="mt-4 text-center text-sm">{authMode === 'login' ? <><button onClick={() => setAuthMode('register')} className="text-blue-600 font-bold">Regístrate</button><br /><button onClick={() => setAuthMode('recovery')} className="text-slate-400 text-xs mt-2">¿Olvidaste tu clave?</button></> : <button onClick={() => setAuthMode('login')} className="text-blue-600 font-bold">Volver</button>}</div>
                </div>
            </div>
        </div>
    );
}
