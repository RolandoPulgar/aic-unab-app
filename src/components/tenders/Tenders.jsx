import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

const RestrictedAccess = () => (
    <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-slate-500 font-bold">Sección Exclusiva para Ingenieros Titulados</p>
        <p className="text-xs text-slate-400 mt-2">Los estudiantes no tienen acceso a licitaciones.</p>
    </div>
);

export default function Tenders({ userData, tenders }) {
    const isStudent = userData?.role === 'Estudiante';

    if (isStudent) return <RestrictedAccess />;

    return (
        <div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                <div className="flex items-start gap-3">
                    <FileText className="text-orange-500 mt-1 flex-shrink-0" />
                    <div><h4 className="font-bold text-orange-800 text-sm">Integración Mercado Público</h4><p className="text-orange-700 text-xs mt-1">Licitaciones activas: <strong>Construcción y Obras Civiles</strong>.</p></div>
                </div>
            </div>
            <div className="md:hidden space-y-4">
                {tenders.map((tender, i) => (<div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200"><h4 className="font-bold text-slate-800 mb-2">{tender.title}</h4></div>))}
            </div>
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200"><tr><th className="p-4">ID</th><th className="p-4">Publicado</th><th className="p-4">Nombre del Proyecto</th><th className="p-4">Región</th><th className="p-4">Tipo</th><th className="p-4">Monto Est.</th><th className="p-4">Cierre</th><th className="p-4">Acción</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {tenders.map((tender, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-mono text-xs text-slate-500">{tender.id}</td>
                                    <td className="p-4 text-slate-600 text-sm">{tender.publishDate || '-'}</td>
                                    <td className="p-4 font-semibold text-slate-800">{tender.title}</td>
                                    <td className="p-4 text-slate-600">{tender.region}</td>
                                    <td className="p-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">{tender.type}</span></td>
                                    <td className="p-4 text-slate-700">{tender.amount}</td>
                                    <td className="p-4 text-red-600 font-bold">{tender.closingDate}</td>
                                    <td className="p-4"><button className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium">Ver <ExternalLink size={14} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
