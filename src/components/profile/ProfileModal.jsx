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

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const fullName = `${regName} ${regSurname}`;
        const update = { firstName: regName, lastName: regSurname, fullName, displayName: fullName, phone: regPhone, company: regCompany, jobTitle: regRole };
        try {
            await updateProfile(auth.currentUser, { displayName: fullName });
            await updateDoc(doc(db, 'artifacts', appId, 'users', auth.currentUser.uid, 'profile', 'info'), update);
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members_index', auth.currentUser.uid), { displayName: fullName, company: update.company });
            onUpdate(update);
            onClose();
        } catch (e) { alert("Error al guardar"); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Editar Perfil</h3><button onClick={onClose}><X /></button></div>
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2"><input className="p-2 border rounded" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Nombre" /><input className="p-2 border rounded" value={regSurname} onChange={e => setRegSurname(e.target.value)} placeholder="Apellido" /></div>
                    <input className="w-full p-2 border rounded" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="Teléfono" />
                    <div className="grid grid-cols-2 gap-2"><input className="p-2 border rounded" value={regCompany} onChange={e => setRegCompany(e.target.value)} placeholder="Empresa" /><input className="p-2 border rounded" value={regRole} onChange={e => setRegRole(e.target.value)} placeholder="Cargo" /></div>
                    <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold">Guardar</button>
                </form>
            </div>
        </div>
    );
}
