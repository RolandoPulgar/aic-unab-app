import React from 'react';
import { HardHat, Menu, X, Newspaper, LogOut } from 'lucide-react';

export default function MobileHeader({ mobileMenuOpen, setMobileMenuOpen, view, setView, logout }) {
    const MenuBtn = ({ icon: Icon, label, active, onClick }) => (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-sm font-medium ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Icon size={20} /> {label}
        </button>
    );

    return (
        <>
            <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2"><HardHat className="text-amber-400" /><span className="font-bold">AIC-UNAB</span></div>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
            </div>
            {mobileMenuOpen && (
                <div className="md:hidden bg-slate-900 text-slate-300 p-4 absolute top-16 left-0 w-full h-screen z-40">
                    <nav className="space-y-4">
                        <MenuBtn active={view === 'dashboard'} onClick={() => { setView('dashboard'); setMobileMenuOpen(false) }} icon={Newspaper} label="Inicio" />
                        <button onClick={logout} className="text-red-400 w-full text-left p-2">Salir</button>
                    </nav>
                </div>
            )}
        </>
    );
}
