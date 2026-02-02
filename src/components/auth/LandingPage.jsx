import React, { useState } from 'react';
import { HardHat, CheckCircle2, ChevronRight, Building2, Users, Briefcase } from 'lucide-react';
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
                await signInWithEmailAndPassword(auth, regEmail, regPassword);
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
            } else if (authMode === 'recovery') {
                await sendPasswordResetEmail(auth, regEmail);
                alert('Correo enviado. Revisa tu bandeja de entrada.');
                setAuthMode('login');
            }
        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
        }
    };

    return (
        <div className="min-h-screen flex font-sans text-slate-800 relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop"
                    className="w-full h-full object-cover"
                    alt="Construction Site"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-blue-900/40"></div>
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-center min-h-screen gap-12 lg:gap-24 py-10">

                {/* Left Side: Value Proposition */}
                <div className="flex-1 text-white space-y-8 animate-in slide-in-from-left-4 duration-700">
                    <div>
                        <div className="flex items-center gap-3 mb-4 bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                            <HardHat className="text-amber-400" size={24} />
                            <span className="font-bold tracking-wide text-sm uppercase">Comunidad Oficial</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-4">
                            Red de Ingenieros <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Constructores UNAB</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-300 max-w-xl leading-relaxed">
                            La plataforma definitiva para conectar, colaborar y crecer profesionalmente. Exclusivo para titulados y alumnos.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-300 border border-blue-500/30"><Building2 size={24} /></div>
                            <div>
                                <h3 className="font-bold text-lg">Licitaciones al Día</h3>
                                <p className="text-slate-400 text-sm">Accede a oportunidades de negocio actualizadas diariamente.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-500/20 rounded-xl text-green-300 border border-green-500/30"><Briefcase size={24} /></div>
                            <div>
                                <h3 className="font-bold text-lg">Vitrina Laboral</h3>
                                <p className="text-slate-400 text-sm">Ofertas de empleo y servicios de colegas verificados.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-300 border border-purple-500/30"><Users size={24} /></div>
                            <div>
                                <h3 className="font-bold text-lg">Networking Real</h3>
                                <p className="text-slate-400 text-sm">Conecta directamente con ingenieros de tu generación.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Card */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-right-4 duration-700 delay-100 flex-shrink-0">
                    <div className="p-8 lg:p-10">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                                {authMode === 'login' ? 'Bienvenido' : authMode === 'register' ? 'Únete a la Red' : 'Recuperar Cuenta'}
                            </h2>
                            <p className="text-slate-500 text-sm">
                                {authMode === 'login' ? 'Ingresa tus credenciales para acceder.' : 'Completa tus datos para registrarte.'}
                            </p>
                        </div>

                        <form onSubmit={handleAuthAction} className="space-y-4">
                            {authMode === 'register' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                                        <button type="button" onClick={() => setRegType('Ingeniero')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${regType === 'Ingeniero' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Ingeniero</button>
                                        <button type="button" onClick={() => setRegType('Estudiante')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${regType === 'Estudiante' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Estudiante</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre" value={regName} onChange={e => setRegName(e.target.value)} required />
                                        <input className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Apellido" value={regSurname} onChange={e => setRegSurname(e.target.value)} required />
                                    </div>
                                    <input className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Teléfono" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                                    {regType === 'Ingeniero' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <input className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Empresa" value={regCompany} onChange={e => setRegCompany(e.target.value)} />
                                            <input className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cargo" value={regRole} onChange={e => setRegRole(e.target.value)} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4">
                                <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Correo electrónico" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                                {authMode !== 'recovery' && <input type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />}
                            </div>

                            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg flex justify-center items-center gap-2 group">
                                {authMode === 'login' ? 'Iniciar Sesión' : authMode === 'register' ? 'Crear Cuenta' : 'Enviar Correo'}
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            {authMode === 'login' ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-500">¿Aún no eres miembro?</p>
                                    <button onClick={() => setAuthMode('register')} className="text-blue-600 font-bold hover:underline">Solicitar Acceso</button>
                                    <div className="pt-2">
                                        <button onClick={() => setAuthMode('recovery')} className="text-xs text-slate-400 hover:text-slate-600">Recuperar contraseña</button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setAuthMode('login')} className="text-slate-500 font-bold hover:text-slate-800 text-sm">Volver al inicio</button>
                            )}
                        </div>
                    </div>
                    {/* Decorative bottom bar */}
                    <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-blue-600"></div>
                </div>
            </div>
        </div>
    );
}
