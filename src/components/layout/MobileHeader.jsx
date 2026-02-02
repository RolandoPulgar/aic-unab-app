import React from 'react';
import { HardHat, Menu, X, Newspaper, MessageSquare, Store, FileText, Image as ImageIcon, Users, LogOut } from 'lucide-react';

export default function MobileHeader({ mobileMenuOpen, setMobileMenuOpen, view, setView, userData, logout }) {
    const isStudent = userData?.role === 'Estudiante';
    const canViewDirectory = userData?.canViewDirectory || userData?.isAdmin;

    const MenuBtn = ({ icon: Icon, label, active, onClick }) => (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Icon size={20} /> {label}
        </button>
    );

    return (
        <>
            <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-2"><HardHat className="text-amber-400" /><span className="font-bold">AIC-UNAB</span></div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded hover:bg-slate-800 transition">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>
            {mobileMenuOpen && (
                <div className="md:hidden bg-slate-900 text-slate-300 fixed top-16 left-0 w-full h-[calc(100vh-4rem)] z-40 overflow-y-auto border-t border-slate-800">
                    <nav className="p-4 space-y-2">
                        <MenuBtn active={view === 'dashboard'} onClick={() => { setView('dashboard'); setMobileMenuOpen(false) }} icon={Newspaper} label="Novedades" />
                        <MenuBtn active={view === 'forum'} onClick={() => { setView('forum'); setMobileMenuOpen(false) }} icon={MessageSquare} label="Foro" />

                        {!isStudent && (
                            <>
                                <MenuBtn active={view === 'showcase'} onClick={() => { setView('showcase'); setMobileMenuOpen(false) }} icon={Store} label="Vitrina" />
                                <MenuBtn active={view === 'tenders'} onClick={() => { setView('tenders'); setMobileMenuOpen(false) }} icon={FileText} label="Licitaciones" />
                            </>
                        )}

                        <MenuBtn active={view === 'gallery'} onClick={() => { setView('gallery'); setMobileMenuOpen(false) }} icon={ImageIcon} label="Galería" />

                        {!isStudent && canViewDirectory && (
                            <MenuBtn active={view === 'members'} onClick={() => { setView('members'); setMobileMenuOpen(false) }} icon={Users} label="Directorio" />
                        )}

                        <div className="pt-4 mt-4 border-t border-slate-800">
                            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden border border-slate-600">
                                    {userData?.photoUrl ? (
                                        <img src={userData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                                    ) : (
                                        userData?.displayName?.charAt(0)
                                    )}
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <p className="text-sm font-medium text-white truncate">{userData?.displayName}</p>
                                    <p className="text-xs text-slate-500 capitalize">{userData?.rank}</p>
                                </div>
                            </div>
                            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition text-sm font-medium">
                                <LogOut size={20} /> Salir
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
}
