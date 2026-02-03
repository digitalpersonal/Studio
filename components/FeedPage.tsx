
import React, { useState, useEffect, useRef } from 'react';
import { Post, User, UserRole, Comment, ViewState } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Camera, Send, Heart, Loader2, MessageCircle, X, 
  Image as ImageIcon, Sparkles, Mic, MicOff, Info, 
  Trash2, ChevronRight, User as UserIcon, Calendar, Clock, ArrowLeft
} from 'lucide-react';

interface FeedPageProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ currentUser, onNavigate, addToast }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await SupabaseService.getPosts();
      setPosts(data);
    } catch (e) { addToast("Erro ao carregar feed.", "error"); } finally { setLoading(false); }
  };

  const handleLike = async (postId: string) => {
    try {
      const updatedPost = await SupabaseService.addLikeToPost(postId, currentUser.id);
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    } catch (e) { addToast("Erro ao curtir.", "error"); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20 printable-area">
      <button 
        onClick={() => onNavigate('DASHBOARD')}
        className="flex items-center gap-2 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-2 transition-colors no-print"
      >
        <ArrowLeft size={14} /> Voltar ao Início
      </button>

      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Comunidade</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Compartilhe sua evolução</p>
        </div>
        <div className="bg-brand-500/10 p-2 rounded-full text-brand-500"><Sparkles size={20} /></div>
      </header>

      <div className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-2xl no-print">
         <form onSubmit={e => e.preventDefault()} className="space-y-4">
            <div className="flex gap-4">
              <img src={currentUser.avatarUrl} className="w-12 h-12 rounded-2xl border border-dark-800" />
              <textarea placeholder="No que está pensando?" className="flex-1 bg-transparent text-white focus:outline-none resize-none pt-2 text-sm"></textarea>
            </div>
            <button className="w-full bg-brand-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">Publicar</button>
         </form>
      </div>

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl space-y-4 group">
            <div className="flex items-center gap-3">
                <img src={post.userAvatar} className="w-10 h-10 rounded-xl object-cover" />
                <p className="text-white font-bold text-sm">{post.userName}</p>
            </div>
            {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-3xl border border-dark-800" />}
            <p className="text-slate-300 text-sm">{post.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
