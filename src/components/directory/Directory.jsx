import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../../services/firebase';
import HelmetBadge from '../shared/HelmetBadge';

export default function Directory({ userData }) {
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'members_index'), (s) => {
            setMembers(s.docs.map(d => d.data()));
        });
        return () => unsub();
    }, []);

    const filteredMembers = members.filter(m =>
        m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Users size={24} /></div>
                    <h2 className="text-2xl font-bold text-slate-800">Directorio de Miembros</h2>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="pl-10 pr-4 py-2 border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 w-64"
                        placeholder="Buscar por nombre, cargo o empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member) => (
                    <div key={member.uid} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 flex items-center justify-center">
                            {member.photoUrl ? (
                                <img src={member.photoUrl} alt={member.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-slate-400 text-xl">{member.displayName?.charAt(0)}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-slate-900 truncate">
                                    {member.displayName}
                                </h4>
                                <HelmetBadge rank={member.rank} size={16} />
                            </div>

                            {member.jobTitle && (
                                <p className="text-sm font-medium text-slate-700 truncate mb-0.5">{member.jobTitle}</p>
                            )}

                            <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                {member.company || 'Profesional Independiente'}
                            </p>

                            {userData?.isAdmin && (
                                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                                    {member.email && <p className="text-xs text-blue-600 truncate">📧 {member.email}</p>}
                                    {member.phone && <p className="text-xs text-green-600 truncate">📞 {member.phone}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {filteredMembers.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    No se encontraron miembros para "{searchTerm}"
                </div>
            )}
        </div>
    );
}
