import React, { useState } from 'react';
import { X } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../../services/firebase';

export default function ProfileModal({ userData, onClose, onUpdate }) {
    const [regName, setRegName] = useState(userData.firstName || '');
    const [regSurname, setRegSurname] = useState(userData.lastName || '');
    const [regPhone, setRegPhone] = useState(userData.phone || '');
    const [regCompany, setRegCompany] = useState(userData.company || '');
    const [regRole, setRegRole] = useState(userData.jobTitle || '');
    const [photoUrl, setPhotoUrl] = useState(userData.photoUrl || '');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) { // Limit 500KB
                alert("La imagen es muy pesada (max 500kb)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const fullName = `${regName} ${regSurname}`;
        const update = {
            firstName: regName,
            lastName: regSurname,
            fullName,
            displayName: fullName,
            phone: regPhone,
            company: regCompany,
            jobTitle: regRole,
            photoUrl: photoUrl
        };

        try {
            // No actualizamos auth.currentUser.photoURL porque Base64 es muy largo para Firebase Auth.
            // Usamos Firestore como fuente de verdad para la imagen.
            await updateProfile(auth.currentUser, { displayName: fullName });

            await updateDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'profile', 'info'), update);

            // Actualizar datos públicos necesarios para el directorio
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members_index', auth.currentUser.uid), {
                displayName: fullName,
                company: update.company,
                jobTitle: update.jobTitle,
                photoUrl: update.photoUrl,
                phone: update.phone,
                email: auth.currentUser.email
            });

            onUpdate(update);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error al guardar: " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Editar Perfil</h3><button onClick={onClose}><X /></button></div>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <div className="relative group cursor-pointer w-24 h-24">
                            <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-100 shadow-sm flex items-center justify-center">
                                {photoUrl ? <img src={photoUrl} alt="Perfil" className="w-full h-full object-cover" /> : <span className="text-2xl text-slate-400 font-bold">{regName?.charAt(0)}</span>}
                            </div>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition pointer-events-none font-bold">Cambiar</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                            <input className="w-full p-2 border rounded-lg text-sm" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Nombre" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Apellido</label>
                            <input className="w-full p-2 border rounded-lg text-sm" value={regSurname} onChange={e => setRegSurname(e.target.value)} placeholder="Apellido" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Correo Electrónico</label>
                        <input className="w-full p-2 border rounded-lg text-sm bg-slate-100 text-slate-500" value={auth.currentUser?.email} disabled />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Teléfono (Privado)</label>
                        <input className="w-full p-2 border rounded-lg text-sm" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="+56 9..." />
                        <p className="text-[10px] text-slate-400 mt-0.5">Solo visible por administradores.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Empresa actual</label>
                            <input className="w-full p-2 border rounded-lg text-sm" value={regCompany} onChange={e => setRegCompany(e.target.value)} placeholder="Ej: Constructora X" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cargo / Puesto</label>
                            <input className="w-full p-2 border rounded-lg text-sm" value={regRole} onChange={e => setRegRole(e.target.value)} placeholder="Ej: Jefe de Obras" />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg mt-2">Guardar Cambios</button>
                </form>
            </div>
        </div>
    );
}
