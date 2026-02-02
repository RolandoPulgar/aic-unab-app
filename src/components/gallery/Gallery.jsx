import React, { useState } from 'react';
import {
    Image as ImageIcon, Heart, MessageCircle, Plus, X,
    Trash2, Send, MoreVertical, Camera
} from 'lucide-react';
import {
    collection, addDoc, deleteDoc, doc, updateDoc,
    arrayUnion, arrayRemove, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db, appId } from '../../services/firebase';

export default function Gallery({ userData, galleryImages = [] }) {
    const [isUploading, setIsUploading] = useState(false);

    // Upload States
    const [description, setDescription] = useState('');
    const [uploadPhotos, setUploadPhotos] = useState([]); // Array of Base64 strings

    // Comment States
    const [activeCommentId, setActiveCommentId] = useState(null); // ID of post with open comments
    const [commentText, setCommentText] = useState('');

    // --- Actions ---

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + uploadPhotos.length > 2) {
            alert("Solo puedes subir un máximo de 2 fotos por proyecto.");
            return;
        }

        files.forEach(file => {
            if (file.size > 1024 * 1024 * 2) { // 2MB limit
                alert(`La imagen ${file.name} es muy pesada (Max 2MB).`);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadPhotos(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setUploadPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim() || uploadPhotos.length === 0) return;

        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), {
                authorName: userData.displayName,
                authorId: userData.uid,
                authorPhoto: userData.photoUrl || '',
                description: description,
                images: uploadPhotos,
                likes: 0,
                likesBy: [],
                comments: [],
                createdAt: serverTimestamp()
            });
            setIsUploading(false);
            setDescription('');
            setUploadPhotos([]);
        } catch (error) {
            console.error("Error posting to gallery:", error);
            alert("Error al publicar. Intenta nuevamente.");
        }
    };

    const handleDelete = async (postId) => {
        if (window.confirm("¿Seguro que quieres eliminar este proyecto?")) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', postId));
        }
    };

    const handleLike = async (post) => {
        const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'gallery', post.id);
        const isLiked = post.likesBy?.includes(userData.uid);

        if (isLiked) {
            await updateDoc(postRef, {
                likes: (post.likes || 1) - 1,
                likesBy: arrayRemove(userData.uid)
            });
        } else {
            await updateDoc(postRef, {
                likes: (post.likes || 0) + 1,
                likesBy: arrayUnion(userData.uid)
            });
        }
    };

    const handleComment = async (e, postId) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'gallery', postId);
        const newComment = {
            id: Date.now().toString(),
            authorName: userData.displayName,
            authorId: userData.uid,
            authorPhoto: userData.photoUrl || '',
            text: commentText,
            createdAt: new Date().toISOString() // Helper for simple display
        };

        await updateDoc(postRef, {
            comments: arrayUnion(newComment)
        });
        setCommentText('');
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col pb-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight font-serif">Galería de Proyectos</h2>
                    <p className="text-slate-500 italic">La excelencia en ingeniería, en imágenes.</p>
                </div>
                <button
                    onClick={() => setIsUploading(true)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg shrink-0"
                >
                    <Plus size={18} /> Nuevo Proyecto
                </button>
            </div>

            {/* Creation Modal */}
            {isUploading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-slate-800">Publicar Proyecto</h3>
                            <button onClick={() => setIsUploading(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descripción del Proyecto</label>
                                <textarea
                                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-700"
                                    placeholder="Cuéntanos sobre los desafíos y logros de esta obra..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fotografías ({uploadPhotos.length}/2)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {uploadPhotos.map((photo, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group shadow-md">
                                            <img src={photo} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removePhoto(idx)}
                                                className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {uploadPhotos.length < 2 && (
                                        <label className="border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition gap-2 text-slate-400">
                                            <Camera size={24} />
                                            <span className="text-xs font-bold">Agregar Foto</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex justify-end">
                            <button
                                onClick={handleSubmit}
                                disabled={!description || uploadPhotos.length === 0}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Publicar en Galería
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Gallery Feed */}
            <div className="space-y-12">
                {galleryImages.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-slate-500 font-medium">La galería está vacía</h3>
                        <p className="text-slate-400 text-sm mt-1">Sé el primero en mostrar tu trabajo.</p>
                    </div>
                ) : (
                    galleryImages.map(post => (
                        <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow duration-500 group">
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-white shadow-sm">
                                        {post.authorPhoto ? <img src={post.authorPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{post.authorName?.charAt(0)}</div>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{post.authorName}</p>
                                        <p className="text-xs text-slate-400">Ingeniero Constructor</p>
                                    </div>
                                </div>
                                {(userData.isAdmin || post.authorId === userData.uid) && (
                                    <button onClick={() => handleDelete(post.id)} className="text-slate-300 hover:text-red-500 transition p-2"><Trash2 size={18} /></button>
                                )}
                            </div>

                            {/* Images Grid - 1 or 2 */}
                            <div className={`grid ${post.images?.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5 bg-slate-50`}>
                                {post.images?.map((img, idx) => (
                                    <div key={idx} className="aspect-[4/3] relative overflow-hidden cursor-pointer" onClick={() => window.open(img, '_blank')}>
                                        <img src={img} className="w-full h-full object-cover transition duration-700 hover:scale-105" />
                                    </div>
                                ))}
                            </div>

                            {/* Content & Actions */}
                            <div className="p-6">
                                <div className="flex items-center gap-6 mb-4">
                                    <button
                                        onClick={() => handleLike(post)}
                                        className={`flex items-center gap-2 text-sm font-bold transition-all ${post.likesBy?.includes(userData.uid) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                                    >
                                        <Heart size={24} fill={post.likesBy?.includes(userData.uid) ? "currentColor" : "none"} />
                                        {post.likes || 0}
                                    </button>
                                    <button
                                        onClick={() => setActiveCommentId(activeCommentId === post.id ? null : post.id)}
                                        className={`flex items-center gap-2 text-sm font-bold transition-all ${activeCommentId === post.id ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                                    >
                                        <MessageCircle size={24} />
                                        {post.comments?.length || 0}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-slate-700 leading-relaxed font-serif text-lg">
                                        <span className="font-sans font-bold text-slate-900 text-sm mr-2">{post.authorName}</span>
                                        {post.description}
                                    </p>

                                    {/* Comments Section */}
                                    {activeCommentId === post.id && (
                                        <div className="pt-4 mt-4 border-t border-slate-50 animate-in slide-in-from-top-2">
                                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                {post.comments?.map((comment, idx) => (
                                                    <div key={idx} className="flex gap-3 text-sm">
                                                        <div className="font-bold text-slate-800 shrink-0">{comment.authorName}</div>
                                                        <div className="text-slate-600">{comment.text}</div>
                                                    </div>
                                                ))}
                                                {(!post.comments || post.comments.length === 0) && (
                                                    <p className="text-slate-300 text-sm italic text-center">Sé el primero en comentar.</p>
                                                )}
                                            </div>

                                            <form onSubmit={(e) => handleComment(e, post.id)} className="flex gap-3 items-center">
                                                <input
                                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
                                                    placeholder="Añadir un comentario..."
                                                    value={commentText}
                                                    onChange={e => setCommentText(e.target.value)}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!commentText.trim()}
                                                    className="text-blue-600 font-bold p-2 hover:bg-blue-50 rounded-full transition disabled:opacity-50"
                                                >
                                                    <Send size={20} />
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
