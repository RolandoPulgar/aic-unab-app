import React from 'react';
import { Store } from 'lucide-react';

export default function Showcase({ userData, showcaseItems }) {
    const isStudent = userData?.role === 'Estudiante';
    if (isStudent) return <div className="text-center py-20 text-slate-400">Acceso Restringido</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Store size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-800">Vitrina de Negocios</h2>
            </div>

            {showcaseItems.length === 0 ? (
                <div className="text-center py-20 text-slate-400">Vitrina Activa - No hay items aún.</div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {showcaseItems.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold">{item.title}</h3>
                            <p className="text-slate-600 text-sm">{item.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
