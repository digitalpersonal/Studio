
import React, { useState } from 'react';
import { User, UserRole, ViewState } from '../types';
import { BookOpen, ChevronDown, User as UserIcon, GraduationCap, Shield, Share2, Calendar, DollarSign, Activity, Camera, BarChart3, ArrowLeft } from 'lucide-react';

interface HelpCenterPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(currentUser.role);

  return (
    <div className="space-y-8 animate-fade-in">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="text-center">
        <BookOpen size={48} className="mx-auto text-brand-500 mb-4" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Central de Ajuda</h2>
      </header>

      <div className="bg-dark-950 rounded-[2rem] border border-dark-800 shadow-xl overflow-hidden p-10 text-center">
          <p className="text-slate-500 uppercase font-black text-xs">Selecione um tópico de ajuda acima.</p>
      </div>
    </div>
  );
};
