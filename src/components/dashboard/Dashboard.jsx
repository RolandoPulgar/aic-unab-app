import React from 'react';
import { HardHat, Award, Globe, ExternalLink } from 'lucide-react';

export default function Dashboard({ userData, economicIndicators, marketNews }) {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10"><h2 className="text-2xl font-bold mb-2">Hola, {userData.displayName}</h2><p className="text-slate-300">Aquí tienes el resumen del sector para hoy.</p></div>
                <HardHat className="absolute -right-6 -bottom-6 text-slate-800 opacity-30" size={120} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {economicIndicators.map((ind, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase">{ind.name}</span><span className="text-lg font-bold text-slate-800 my-1">{ind.value}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ind.trend.startsWith('+') ? 'bg-green-100 text-green-700' : ind.trend.startsWith('-') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{ind.trend}</span>
                    </div>
                ))}
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={20} className="text-blue-600" /> Noticias del Rubro</h3>
                        <div className="space-y-4">
                            {marketNews.map((news, i) => (
                                <a key={i} href={news.url} target="_blank" rel="noopener noreferrer" className="block border-b border-slate-100 pb-4 last:border-0 last:pb-0 hover:bg-slate-50 p-2 -mx-2 rounded transition cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{news.category}</span><span className="text-xs text-slate-400">{news.date}</span></div>
                                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition">{news.title}</h4>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-400"><span>Fuente: {news.source}</span><ExternalLink size={10} /></div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"><h3 className="font-bold text-slate-800 mb-4">Tus Estadísticas</h3><div className="text-center py-4"><div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 text-blue-600 mb-2"><Award size={32} /></div><p className="text-3xl font-bold text-slate-900">{userData.points}</p><p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Puntos</p></div></div>
                </div>
            </div>
        </div>
    );
}
