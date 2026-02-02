import React from 'react';
import { HardHat } from 'lucide-react';

export default function HelmetBadge({ rank, size = 24 }) {
    let color = "text-slate-300"; let fill = "none";
    if (rank === 'estudiante') { color = "text-gray-400"; fill = "currentColor"; }
    else if (rank === 'blanco') { color = "text-slate-400"; fill = "none"; }
    else if (rank === 'plata') { color = "text-slate-500"; fill = "currentColor"; }
    else if (rank === 'oro') { color = "text-amber-400 drop-shadow-md"; fill = "gold"; }
    return <div className="flex items-center gap-1"><HardHat size={size} className={color} fill={rank === 'oro' || rank === 'plata' || rank === 'estudiante' ? 'currentColor' : 'none'} /></div>;
};
