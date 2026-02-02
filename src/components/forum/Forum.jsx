import React, { useState, useEffect } from 'react';
import {
    Plus, X, ChevronRight, ChevronLeft, User, Clock,
    Pencil, Trash2, Save, ThumbsUp, Send, Sparkles, Loader2,
    ScrollText, Briefcase, FileQuestion, GraduationCap, MessageSquare, Pin
} from 'lucide-react';
import {
    collection, addDoc, onSnapshot, query, orderBy,
    doc, updateDoc, increment, arrayUnion, arrayRemove,
    deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db, appId } from '../../services/firebase';
import { callGemini } from '../../services/ai';

const FORUM_CATEGORIES = [
    { id: 'rules', label: 'Reglas y Anuncios', icon: ScrollText, restricted: true }, // admin only usually, but let's keep logic simple
    { id: 'presentations', label: 'Presentaciones', icon: User, restricted: false },
    { id: 'jobs', label: 'Empleos', icon: Briefcase, restricted: true },
    { id: 'business', label: 'Negocios', icon: Briefcase, restricted: true },
    { id: 'data', label: 'Solicitud de Datos', icon: FileQuestion, restricted: true },
    { id: 'students', label: 'Zona Estudiantes', icon: GraduationCap, restricted: false },
];

const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Icon = ({ icon: IconComponent, ...props }) => <IconComponent {...props} />;

export default function Forum({ user, userData, addPoints }) {
    const [posts, setPosts] = useState([]);
    const [forumCategory, setForumCategory] = useState('rules');
    const [selectedPost, setSelectedPost] = useState(null);
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Presentation States
    const [presSpecialty, setPresSpecialty] = useState('Ingeniero Constructor');
    const [presBackground, setPresBackground] = useState('');
    const [presTools, setPresTools] = useState('');
    const [presObjective, setPresObjective] = useState('');

    // Edit states
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editText, setEditText] = useState('');
    const [replyText, setReplyText] = useState('');
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editReplyText, setEditReplyText] = useState('');

    const isStudent = userData?.role === 'Estudiante';
    const visibleCategories = isStudent ? FORUM_CATEGORIES.filter(c => !c.restricted) : FORUM_CATEGORIES;

    useEffect(() => {
        if (isStudent && forumCategory !== 'students') {
            setForumCategory('students');
        }
    }, [isStudent]);

    // Aplicar título automático para presentaciones
    useEffect(() => {
        if (isCreatingPost && forumCategory === 'presentations') {
            setNewPostTitle(`Presentación: ${userData.displayName || ''}`);
        } else if (isCreatingPost && forumCategory !== 'presentations' && newPostTitle.startsWith('Presentación:')) {
            setNewPostTitle('');
        }
    }, [isCreatingPost, forumCategory, userData]);

    // Listeners
    useEffect(() => {
        // Ordenamos por fecha descendente en la query básica
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'forum_posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (s) => {
            const newPosts = s.docs.map(d => ({ id: d.id, ...d.data() }));

            // Ordenamiento manual: Primero fijados (isPinned), luego fecha
            newPosts.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // Si ambos son iguales en pin, ya vienen ordenados por fecha de la query, pero aseguramos
                return b.createdAt - a.createdAt;
            });

            setPosts(newPosts);
            if (selectedPost) {
                const updated = newPosts.find(p => p.id === selectedPost.id);
                if (updated) setSelectedPost(updated);
            }
        });
        return () => unsubscribe();
    }, [selectedPost?.id]);

    const getCategoryCount = (catId) => posts.filter(p => p.category === catId).length;

    const handlePostSubmit = async (e) => {
        e.preventDefault();

        let finalContent = newPostContent;
        let finalTitle = newPostTitle;

        if (forumCategory === 'presentations') {
            if (!presBackground.trim() || !presObjective.trim()) return;
            finalContent = `Hola Colegas,\n\n` +
                `**Nombre:** ${userData.displayName}\n` +
                `**Especialidad:** ${presSpecialty}\n\n` +
                `**Mi Background:** ${presBackground}\n\n` +
                `**Herramientas que domino:**\n${presTools}\n\n` +
                `**Objetivo en el foro:** ${presObjective}\n\n` +
                `Un saludo.`;
        } else {
            if (!newPostContent.trim() || !newPostTitle.trim()) return;
        }

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'forum_posts'), {
            title: finalTitle, content: finalContent,
            authorName: userData.displayName, authorRank: userData.rank, authorId: user.uid,
            authorCompany: userData.company, authorPhoto: userData.photoUrl || '',
            category: forumCategory, createdAt: serverTimestamp(), likes: 0, likesBy: [], replies: [],
            isPinned: false
        });
        setNewPostTitle(''); setNewPostContent('');
        setPresBackground(''); setPresTools(''); setPresObjective('');
        setIsCreatingPost(false); await addPoints(10);
    };

    const handleDeletePost = async (postId) => {
        if (window.confirm('¿Borrar tema completo?')) {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', postId));
            setSelectedPost(null);
        }
    };

    const handlePinPost = async (post) => {
        const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', post.id);
        await updateDoc(postRef, { isPinned: !post.isPinned });
    };

    const handleLikePost = async (post) => {
        if (!user) return;
        const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', post.id);
        const hasLiked = post.likesBy?.includes(user.uid);
        if (hasLiked) { await updateDoc(postRef, { likes: increment(-1), likesBy: arrayRemove(user.uid) }); }
        else { await updateDoc(postRef, { likes: increment(1), likesBy: arrayUnion(user.uid) }); }
    };

    const handleSaveEdit = async (postId) => {
        if (!editText.trim() || !editTitle.trim()) return;
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', postId), { title: editTitle, content: editText });
        setEditingId(null); setEditTitle(''); setEditText('');
    };

    const handleSendReply = async (postId) => {
        if (!replyText.trim()) return;
        const replyData = {
            id: crypto.randomUUID(),
            authorName: userData.displayName,
            authorId: user.uid,
            authorPhoto: userData.photoUrl || '', // Guardamos foto para la UI de participantes
            content: replyText,
            date: new Date().toISOString()
        };
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', postId), { replies: arrayUnion(replyData) });
        setReplyText('');
    };

    const handleDeleteReply = async (post, replyId) => {
        if (window.confirm('¿Eliminar respuesta?')) {
            const updatedReplies = post.replies.filter(r => r.id !== replyId);
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', post.id), { replies: updatedReplies });
        }
    };

    const handleSaveReplyEdit = async (post, replyId) => {
        if (!editReplyText.trim()) return;
        const updatedReplies = post.replies.map(r => r.id === replyId ? { ...r, content: editReplyText } : r);
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'forum_posts', post.id), { replies: updatedReplies });
        setEditingReplyId(null); setEditReplyText('');
    };

    const handleGenerateReply = async () => {
        setIsGenerating(true);
        const text = await callGemini(`Responde técnicamente a: "${selectedPost.content}".`);
        setReplyText(text); setIsGenerating(false);
    };

    // Función auxiliar para obtener participantes únicos (limitado a 3)
    const getParticipantPhotos = (replies) => {
        if (!replies || !Array.isArray(replies)) return [];
        const photos = replies.filter(r => r.authorPhoto).map(r => r.authorPhoto);
        return [...new Set(photos)].slice(0, 3);
    };

    return (
        <div className="max-w-5xl mx-auto h-full flex flex-col">
            {!selectedPost ? (
                <>
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Foros</h2>
                            <p className="text-slate-500">Comunidad de discusión</p>
                        </div>
                        <button onClick={() => setIsCreatingPost(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-lg btn-click-effect">
                            <Pencil size={18} /> Proponer un tema
                        </button>
                    </div>

                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        {visibleCategories.map(cat => (
                            <button key={cat.id} onClick={() => setForumCategory(cat.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${forumCategory === cat.id ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}>
                                <Icon icon={cat.icon} size={18} /> {cat.label}
                                {getCategoryCount(cat.id) > 0 && <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${forumCategory === cat.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>{getCategoryCount(cat.id)}</span>}
                            </button>
                        ))}
                    </div>

                    {isCreatingPost && (
                        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <h3 className="font-bold text-xl text-slate-800">{forumCategory === 'presentations' ? 'Crear Presentación' : 'Nuevo Tema'}</h3>
                                <button onClick={() => setIsCreatingPost(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition"><X className="text-slate-500" size={20} /></button>
                            </div>

                            {forumCategory === 'presentations' ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                                        <div className="font-bold text-slate-800">{userData.displayName}</div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Especialidad</label>
                                        <select className="w-full p-3 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-blue-100 outline-none" value={presSpecialty} onChange={(e) => setPresSpecialty(e.target.value)}>
                                            <option>Ingeniero Constructor</option>
                                            <option>Constructor Civil</option>
                                            <option>Estudiante</option>
                                            <option>Profesor</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mi Background</label>
                                        <textarea className="w-full p-3 rounded-xl border border-slate-200 bg-white h-24 resize-none focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Breve descripción de tu trayectoria..." value={presBackground} onChange={(e) => setPresBackground(e.target.value)} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Herramientas que domino</label>
                                        <textarea className="w-full p-3 rounded-xl border border-slate-200 bg-white h-20 resize-none focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Revit, AutoCAD, Python..." value={presTools} onChange={(e) => setPresTools(e.target.value)} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objetivo en el foro</label>
                                        <textarea className="w-full p-3 rounded-xl border border-slate-200 bg-white h-20 resize-none focus:ring-2 focus:ring-blue-100 outline-none" placeholder="Aportar conocimientos, aprender..." value={presObjective} onChange={(e) => setPresObjective(e.target.value)} />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button onClick={handlePostSubmit} disabled={!presBackground.trim() || !presObjective.trim()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">Publicar Presentación</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <input className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Título del tema..." value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} />
                                    <textarea className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 h-40 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Escribe tu mensaje..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
                                    <div className="flex justify-end"><button onClick={handlePostSubmit} disabled={!newPostContent.trim() || !newPostTitle.trim()} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">Publicar Tema</button></div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        {posts.filter(p => p.category === forumCategory || (!p.category && forumCategory === 'rules')).map(post => (
                            <div key={post.id} onClick={() => setSelectedPost(post)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition"></div>

                                <div className="flex items-start gap-5">
                                    {/* Avatar Grande a la Izquierda */}
                                    <div className="flex-shrink-0">
                                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xl text-slate-500 border-2 border-slate-50 overflow-hidden shadow-sm">
                                            {post.authorPhoto ? (
                                                <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                post.authorName?.charAt(0)
                                            )}
                                        </div>
                                    </div>

                                    {/* Contenido Central */}
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition leading-tight mb-1">{post.title || "Sin título"}</h4>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <span className="font-medium text-slate-600">por {post.authorName || 'Anónimo'}</span>
                                            {post.replies?.length > 0 && post.replies[post.replies.length - 1]?.date ? (
                                                <span className="text-slate-300">• último comentario hace {formatDate(new Date(post.replies[post.replies.length - 1].date))}</span>
                                            ) : (
                                                <span>• {formatDate(post.createdAt)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Métricas y Participantes (Derecha) */}
                                    <div className="flex flex-col items-end gap-3 self-center">
                                        <div className="flex items-center gap-3">
                                            {/* Caras de participantes */}
                                            {post.replies?.length > 0 && (
                                                <div className="flex -space-x-2 mr-2">
                                                    {getParticipantPhotos(post.replies).map((photo, i) => (
                                                        <div key={i} className="w-6 h-6 rounded-full border border-white overflow-hidden bg-slate-100">
                                                            {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-300"></div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center font-bold text-sm border border-slate-100 transition">
                                                {post.replies ? post.replies.length : 0}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-3 py-1 rounded-full text-xs font-bold group-hover:bg-slate-100 transition">
                                            <MessageSquare size={12} /> Comentar
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {posts.filter(p => p.category === forumCategory).length === 0 && (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <MessageSquare size={40} />
                            </div>
                            <h3 className="text-slate-500 font-medium">No hay temas en esta categoría</h3>
                            <p className="text-slate-400 text-sm mt-1">Sé el primero en iniciar la conversación.</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
                    <button onClick={() => setSelectedPost(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-4 transition"><ChevronLeft size={20} /> Volver al listado</button>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-6 relative">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                            <div>
                                {selectedPost.isPinned && <span className="mb-2 inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider"><Pin size={10} /> Tema Fijado</span>}
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">{selectedPost.title}</h1>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <User size={14} /> <span className="font-bold">{selectedPost.authorName}</span>
                                    <span>•</span>
                                    <Clock size={14} /> <span>{formatDate(selectedPost.createdAt)}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {userData.isAdmin && (
                                    <button onClick={() => handlePinPost(selectedPost)} className={`p-2 rounded-lg transition ${selectedPost.isPinned ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-slate-100 text-slate-400 hover:text-purple-600'}`} title={selectedPost.isPinned ? "Desfijar" : "Fijar tema"}>
                                        <Pin size={18} fill={selectedPost.isPinned ? "currentColor" : "none"} />
                                    </button>
                                )}
                                {(userData.isAdmin || selectedPost.authorId === user.uid) && !editingId && (
                                    <>
                                        <button onClick={() => { setEditingId(selectedPost.id); setEditTitle(selectedPost.title); setEditText(selectedPost.content); }} className="p-2 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition"><Pencil size={18} /></button>
                                        <button onClick={() => handleDeletePost(selectedPost.id)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition"><Trash2 size={18} /></button>
                                    </>
                                )}
                            </div>
                        </div>
                        {editingId === selectedPost.id ? (
                            <div className="mb-4">
                                <input className="w-full p-3 border rounded-xl bg-slate-50 font-bold text-lg mb-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                <textarea className="w-full p-4 border rounded-xl bg-slate-50 h-40 text-base" value={editText} onChange={(e) => setEditText(e.target.value)} />
                                <div className="flex gap-2 mt-3 justify-end">
                                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-slate-500 text-sm font-bold">Cancelar</button>
                                    <button onClick={() => handleSaveEdit(selectedPost.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Save size={16} /> Guardar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-lg mb-8">
                                {selectedPost.content}
                            </div>
                        )}
                        <div className="flex gap-4"><button onClick={() => handleLikePost(selectedPost)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${selectedPost.likesBy?.includes(user.uid) ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}><ThumbsUp size={18} fill={selectedPost.likesBy?.includes(user.uid) ? "currentColor" : "none"} /> {selectedPost.likes || 0} Me gusta</button></div>
                    </div>
                    <h3 className="font-bold text-slate-500 uppercase tracking-wide text-xs mb-4 ml-2">Respuestas ({selectedPost.replies?.length || 0})</h3>
                    <div className="space-y-4 mb-8">
                        {selectedPost.replies && selectedPost.replies.map((reply) => (
                            <div key={reply.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 relative group">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-xs text-slate-500 border border-slate-200">{reply.authorName.charAt(0)}</div>
                                        <span className="font-bold text-slate-800 text-sm">{reply.authorName}</span>
                                        <span className="text-slate-400 text-xs">• {formatDate(reply.date)}</span>
                                    </div>
                                    {(userData.isAdmin || reply.authorId === user.uid) && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            {editingReplyId === reply.id ? (
                                                <button onClick={() => handleSaveReplyEdit(selectedPost, reply.id)} className="text-green-600 hover:bg-green-100 p-1.5 rounded"><Save size={14} /></button>
                                            ) : (
                                                <button onClick={() => { setEditingReplyId(reply.id); setEditReplyText(reply.content) }} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-50"><Pencil size={14} /></button>
                                            )}
                                            <button onClick={() => handleDeleteReply(selectedPost, reply.id)} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"><Trash2 size={14} /></button>
                                        </div>
                                    )}
                                </div>
                                {editingReplyId === reply.id ? (
                                    <textarea className="w-full p-2 border rounded-lg bg-white text-sm" value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} />
                                ) : (
                                    <p className="text-slate-700 text-sm leading-relaxed pl-8">{reply.content}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky bottom-4">
                        <div className="relative">
                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-20 mb-2"
                                placeholder="Escribe una respuesta..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button onClick={handleGenerateReply} disabled={isGenerating} className="absolute bottom-4 right-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-purple-200 transition">{isGenerating ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />} IA</button>
                        </div>
                        <div className="flex justify-end"><button onClick={() => handleSendReply(selectedPost.id)} className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center justify-center hover:bg-slate-800 shadow-lg text-sm font-bold gap-2">Responder <Send size={16} /></button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
