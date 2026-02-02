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
        m.company?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        className="pl-10 pr-4 py-2 border rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        placeholder="Buscar miembro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                    <div key={member.uid} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                            {member.displayName?.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                {member.displayName}
                                <HelmetBadge rank={member.rank} size={16} />
                            </h4>
                            <p className="text-xs text-slate-500">{member.company || 'Independiente'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
