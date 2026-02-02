import React from 'react';
import { HardHat, Newspaper, MessageSquare, Store, FileText, Image as ImageIcon, Users, LogOut, Pencil } from 'lucide-react';

export default function Sidebar({ view, setView, userData, logout, openProfileEditor, toggleAdminMode }) {
    const isStudent = userData?.role === 'Estudiante';
    const canViewDirectory = userData?.canViewDirectory || userData?.isAdmin;

    const MenuBtn = ({ icon: Icon, label, active, onClick }) => (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Icon size={20} /> {label}
        </button>
    );

    return (
        <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-slate-300 h-screen sticky top-0 border-r border-slate-800 z-10">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <HardHat className="text-amber-400" size={28} />
                <div><h1 className="font-bold text-white">AIC-UNAB</h1><span className="text-xs text-slate-500">Intranet</span></div>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <MenuBtn active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={Newspaper} label="Novedades" />
                <MenuBtn active={view === 'forum'} onClick={() => setView('forum')} icon={MessageSquare} label="Foro" />
                {!isStudent && (
                    <>
                        <MenuBtn active={view === 'showcase'} onClick={() => setView('showcase')} icon={Store} label="Vitrina" />
                        <MenuBtn active={view === 'tenders'} onClick={() => setView('tenders')} icon={FileText} label="Licitaciones" />
                    </>
                )}
                <MenuBtn active={view === 'gallery'} onClick={() => setView('gallery')} icon={ImageIcon} label="Galería" />
                {!isStudent && canViewDirectory && <MenuBtn active={view === 'members'} onClick={() => setView('members')} icon={Users} label="Directorio" />}
            </nav>
            <div className="p-4 border-t border-slate-800">
                <button onClick={openProfileEditor} className="w-full flex items-center gap-3 mb-4 p-2 rounded hover:bg-slate-800 text-left">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden border border-slate-600">
                        {userData.photoUrl ? (
                            <img src={userData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            userData.displayName?.charAt(0)
                        )}
                    </div>
                    <div className="overflow-hidden flex-1"><p className="text-sm font-medium text-white truncate">{userData.displayName}</p><p className="text-xs text-slate-500 capitalize">{userData.rank}</p></div>
                    <Pencil size={14} className="text-slate-500" />
                </button>
                {!isStudent && <button onClick={toggleAdminMode} className="text-xs text-slate-500 w-full text-left px-2 mb-2">[Simular Admin]</button>}
                <button onClick={logout} className="flex items-center gap-2 text-sm text-red-400 w-full p-2 hover:bg-red-900/20 rounded"><LogOut size={16} /> Salir</button>
            </div>
        </aside>
    );
}
