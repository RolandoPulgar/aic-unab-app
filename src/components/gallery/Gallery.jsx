import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function Gallery({ galleryImages }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><ImageIcon size={24} /></div>
                <h2 className="text-2xl font-bold text-slate-800">Galería de Proyectos</h2>
            </div>

            {galleryImages.length === 0 ? (
                <div className="text-center py-20 text-slate-400">No hay imágenes en la galería.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImages.map((img) => (
                        <div key={img.id} className="relative group overflow-hidden rounded-xl bg-gray-100 aspect-square">
                            {img.url && <img src={img.url} alt={img.title} className="object-cover w-full h-full" />}
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition">
                                <p className="font-bold text-sm">{img.title}</p>
                                <p className="text-xs">{img.authorName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
