import React, { useState } from 'react';
import {
    Briefcase, Search, Globe, Phone, Mail, Plus, X,
    Trash2, ExternalLink, MapPin, Building
} from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../../services/firebase';

export default function Showcase({ userData, showcaseItems = [] }) {
    const [activeTab, setActiveTab] = useState('services'); // 'services' | 'jobs'
    const [isCreating, setIsCreating] = useState(false);

    // Form States
    const [title, setTitle] = useState(''); // Nombre Fantasía o Título Oferta
    const [description, setDescription] = useState(''); // Servicios o Qué se necesita
    const [imageUrl, setImageUrl] = useState('');
    const [contactWeb, setContactWeb] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        const newItem = {
            type: activeTab, // 'services' or 'jobs'
            title,
            description,
            imageUrl: imageUrl || 'https://via.placeholder.com/300?text=Sin+Imagen', // Placeholder por defecto
            authorName: userData.displayName,
            authorId: userData.uid || 'unknown', // Fallback
            authorPhoto: userData.photoUrl || '',
            createdAt: serverTimestamp(),
            contact: activeTab === 'services' ? {
                web: contactWeb,
                phone: contactPhone,
                email: contactEmail
            } : null
        };

        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'showcase'), newItem);
            setIsCreating(false);
            // Reset form
            setTitle(''); setDescription(''); setImageUrl('');
            setContactWeb(''); setContactPhone(''); setContactEmail('');
        } catch (error) {
            console.error("Error creating showcase item:", error);
            alert("Error al publicar. Intenta nuevamente.");
        }
    };

    const handleDelete = async (itemId) => {
        if (window.confirm('¿Estás seguro de eliminar esta publicación?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'showcase', itemId));
        }
    };

    const filteredItems = showcaseItems.filter(item => item.type === activeTab);

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Header y Pestañas */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-200 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Vitrina</h2>
                    <p className="text-slate-500">Destaca tus servicios u ofrece oportunidades</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'services' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Building size={16} /> Ofrecen Servicios
                    </button>
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'jobs' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Briefcase size={16} /> Ofrecen Trabajo
                    </button>
                </div>

                <button onClick={() => setIsCreating(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shrink-0">
                    <Plus size={18} /> Publicar {activeTab === 'services' ? 'Servicio' : 'Aviso'}
                </button>
            </div>

            {/* Formulario de Creación */}
            {isCreating && (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                        <h3 className="font-bold text-xl text-slate-800">
                            {activeTab === 'services' ? 'Publicar Mis Servicios' : 'Publicar Oferta de Trabajo'}
                        </h3>
                        <button onClick={() => setIsCreating(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition"><X className="text-slate-500" size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    {activeTab === 'services' ? 'Nombre de Fantasía / Empresa' : 'Título del Aviso'}
                                </label>
                                <input className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    value={title} onChange={e => setTitle(e.target.value)} placeholder={activeTab === 'services' ? "Ej: Constructora AIC SpA" : "Ej: Se busca Jefe de Obra"} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Imagen (Logo/Foto) - Max 1MB</label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full bg-slate-50 p-2 rounded-xl border border-slate-200 text-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 1024 * 1024) {
                                                    alert("La imagen es muy pesada (Max 1MB)");
                                                    return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => setImageUrl(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    {imageUrl && <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0"><img src={imageUrl} className="w-full h-full object-cover" /></div>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                {activeTab === 'services' ? 'Descripción de Servicios' : 'Detalle de lo que se necesita cotizar'}
                            </label>
                            <textarea className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100"
                                value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe aquí..." />
                        </div>

                        {activeTab === 'services' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sitio Web</label>
                                    <input className="w-full bg-white p-2 rounded-lg border border-slate-200 text-sm" value={contactWeb} onChange={e => setContactWeb(e.target.value)} placeholder="www.miempresa.cl" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono/WhatsApp</label>
                                    <input className="w-full bg-white p-2 rounded-lg border border-slate-200 text-sm" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+569..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                                    <input className="w-full bg-white p-2 rounded-lg border border-slate-200 text-sm" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contacto@..." />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={!title || !description} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
                                Publicar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Grid de Tarjetas */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        {activeTab === 'services' ? <Building size={40} /> : <Briefcase size={40} />}
                    </div>
                    <h3 className="text-slate-500 font-medium">Aún no hay publicaciones en esta sección</h3>
                    <p className="text-slate-400 text-sm mt-1 mb-6">Sé el primero en publicar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                    {filteredItems.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col h-[450px] group relative">
                            {/* Admin Actions */}
                            {(userData.isAdmin || userData.uid === item.authorId) && (
                                <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 z-10 bg-white/90 p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition shadow-sm border border-slate-100">
                                    <Trash2 size={16} />
                                </button>
                            )}

                            {/* Header del Autor */}
                            <div className="p-4 flex items-center gap-3 border-b border-slate-50 bg-slate-50/50">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 border-2 border-white shadow-sm overflow-hidden">
                                    {item.authorPhoto ? <img src={item.authorPhoto} className="w-full h-full object-cover" /> : item.authorName?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 text-sm truncate">{item.title}</p>
                                    <p className="text-xs text-slate-500 truncate">Publicado por {item.authorName}</p>
                                </div>
                            </div>

                            {/* Imagen Principal */}
                            <div className="h-48 w-full bg-slate-200 relative overflow-hidden group-hover:opacity-95 transition">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=AIC+UNAB'} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition duration-300"></div>
                            </div>

                            {/* Cuerpo */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h4 className="font-bold text-slate-700 uppercase text-xs tracking-wider mb-2 flex items-center gap-1">
                                    {item.type === 'services' ? <><Building size={12} /> Servicios</> : <><Search size={12} /> Se Necesita</>}
                                </h4>
                                <p className="text-slate-600 text-sm leading-relaxed line-clamp-4 flex-1">
                                    {item.description}
                                </p>
                            </div>

                            {/* Footer de Contacto (Solo Servicios) */}
                            {item.type === 'services' && item.contact && (
                                <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2">
                                    {item.contact.web && (
                                        <a href={item.contact.web.startsWith('http') ? item.contact.web : `https://${item.contact.web}`} target="_blank" rel="noopener noreferrer"
                                            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50 border border-slate-200 transition text-xs font-bold gap-1">
                                            <Globe size={16} /> Web
                                        </a>
                                    )}
                                    {item.contact.phone && (
                                        <a href={`tel:${item.contact.phone}`}
                                            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white text-green-600 hover:bg-green-50 border border-slate-200 transition text-xs font-bold gap-1">
                                            <Phone size={16} /> Llama
                                        </a>
                                    )}
                                    {item.contact.email && (
                                        <a href={`mailto:${item.contact.email}`}
                                            className="flex flex-col items-center justify-center p-2 rounded-lg bg-white text-purple-600 hover:bg-purple-50 border border-slate-200 transition text-xs font-bold gap-1">
                                            <Mail size={16} /> Mail
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Footer Jobs (Simple) */}
                            {item.type === 'jobs' && (
                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                                    <button className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition">
                                        <Mail size={16} /> Contactar al autor
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
