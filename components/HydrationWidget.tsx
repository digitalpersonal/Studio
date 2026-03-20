import React, { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';

export const HydrationWidget: React.FC = () => {
  const [cups, setCups] = useState(0);
  const goal = 8; // Meta diária de copos

  useEffect(() => {
    const saved = localStorage.getItem('hydration_cups');
    if (saved) setCups(parseInt(saved, 10));
  }, []);

  const addCup = () => {
    const newCups = cups + 1;
    setCups(newCups);
    localStorage.setItem('hydration_cups', newCups.toString());
  };

  const removeCup = () => {
    const newCups = Math.max(0, cups - 1);
    setCups(newCups);
    localStorage.setItem('hydration_cups', newCups.toString());
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-[2rem] flex flex-col justify-center shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Droplets size={14}/> Hidratação
        </h3>
        <span className="text-blue-500 font-black text-xs">{cups} / {goal} copos</span>
      </div>
      <div className="w-full bg-dark-900 h-2 rounded-full overflow-hidden mb-4">
        <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, (cups / goal) * 100)}%` }} />
      </div>
      <div className="flex gap-2">
        <button onClick={removeCup} className="flex-1 py-2 bg-dark-800 text-slate-400 rounded-xl hover:bg-dark-700 text-xs font-bold">-</button>
        <button onClick={addCup} className="flex-2 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-xs font-bold">+</button>
      </div>
    </div>
  );
};
