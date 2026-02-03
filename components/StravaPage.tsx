
import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Share2, Zap, CheckCircle2, XCircle, BarChart, Trophy, Power, Loader2, Info, BookOpen, ChevronDown, User as UserIcon, GraduationCap, Shield, ArrowLeft } from 'lucide-react';

interface StravaPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  onUpdateUser: (user: User) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const StravaPage: React.FC<StravaPageProps> = ({ currentUser, onNavigate, onUpdateUser, addToast }) => {
  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="text-center">
        <img src="https://digitalfreeshop.com.br/logostudio/strava.png" alt="Strava" className="w-24 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Integração Strava</h2>
      </header>

      <div className="bg-dark-950 p-12 rounded-[2.5rem] border border-dark-800 text-center">
          <button className="bg-brand-600 text-white py-5 px-10 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 mx-auto">
            <Share2 size={20} /> Conectar com Strava
          </button>
      </div>
    </div>
  );
};
