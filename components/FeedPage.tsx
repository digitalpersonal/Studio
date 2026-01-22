
import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Camera, Send, Heart, Loader2, MessageCircle, Share2, X, Upload, Facebook, Copy, Check } from 'lucide-react';

interface FeedPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ currentUser, addToast }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data = await SupabaseService.getPosts();
        setPosts(data);
      } catch (error: any) {
        addToast(`Erro ao carregar o feed.`, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [addToast]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("Canvas context error");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast("Selecione apenas imagens.", "error");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption && !selectedImage) {
      addToast("O post não pode estar vazio!", "info");
      return;
    }
    setPostSubmitting(true);
    try {
      let compressedBase64 = '';
      if (selectedImage) compressedBase64 = await compressImage(selectedImage);
      const newPost: Omit<Post, 'id' | 'userName' | 'userAvatar' | 'likes'> & { userId: string } = {
        userId: currentUser.id,
        imageUrl: compressedBase64,
        caption: newPostCaption,
        timestamp: new Date().toISOString(), 
      };
      const addedPost = await SupabaseService.addPost(newPost);
      setPosts(prev => [addedPost, ...prev]);
      setNewPostCaption('');
      setSelectedImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      addToast("Post publicado!", "success");
    } catch (error: any) {
      addToast(`Erro ao publicar post.`, "error");
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const updatedPost = await SupabaseService.addLikeToPost(postId, currentUser.id);
      setPosts(prev => prev.map(p => (p.id === postId ? updatedPost : p)));
    } catch (error: any) {}
  };

  const shareSocial = (platform: 'whatsapp' | 'facebook' | 'copy', post: Post) => {
    const shareUrl = window.location.href; // URL do app
    const text = `Confira esta postagem de ${post.userName} no Studio: "${post.caption.substring(0, 50)}..."\n\nVeja mais em: `;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + shareUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    } else {
      navigator.clipboard.writeText(`${text} ${shareUrl}`);
      setCopiedId(post.id);
      addToast("Link copiado para a área de transferência!", "success");
      setTimeout(() => setCopiedId(null), 2000);
    }
    setSharingPost(null);
  };

  const formatPostTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return `agora`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m atrás`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[500px]"><Loader2 className="animate-spin text-brand-500" size={48} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold text-white">Comunidade Studio</h2>
        <p className="text-slate-400 text-sm">Compartilhe sua rotina e motive seus colegas!</p>
      </header>

      <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea
            className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-brand-500 outline-none resize-none"
            placeholder="O que você treinou hoje?"
            value={newPostCaption}
            onChange={e => setNewPostCaption(e.target.value)}
          ></textarea>
          <div className="space-y-3">
            {previewUrl ? (
              <div className="relative w-full max-h-64 rounded-2xl overflow-hidden border border-dark-700 bg-dark-900">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <button type="button" onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full"><X size={16} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-6 border-2 border-dashed border-dark-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-brand-500 transition-all">
                <Camera size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Adicionar Foto</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <button type="submit" disabled={postSubmitting} className="w-full bg-brand-600 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center shadow-lg shadow-brand-600/20">
            {postSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="mr-2" />} Publicar
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <img src={String(post.userAvatar || `https://ui-avatars.com/api/?name=${String(post.userName)}`)} className="w-10 h-10 rounded-full border border-dark-800" />
              <div>
                <p className="text-white font-bold">{String(post.userName)}</p>
                <p className="text-slate-500 text-[10px] uppercase font-bold">{formatPostTimestamp(post.timestamp)}</p>
              </div>
            </div>
            {post.imageUrl && (
              <div className="w-full rounded-2xl overflow-hidden mb-2 bg-dark-900 border border-dark-800">
                <img src={String(post.imageUrl)} className="w-full h-auto max-h-[500px] object-contain mx-auto" loading="lazy" />
              </div>
            )}
            <p className="text-slate-300 text-sm">{String(post.caption)}</p>

            <div className="flex items-center gap-6 pt-4 border-t border-dark-800">
              <button onClick={() => handleLikePost(post.id)} className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${post.likes?.includes(currentUser.id) ? 'text-red-500' : 'text-slate-500 hover:text-white'}`}>
                <Heart size={18} fill={post.likes?.includes(currentUser.id) ? 'currentColor' : 'none'} />
                <span>{String(post.likes?.length || 0)}</span>
              </button>
              <button onClick={() => setSharingPost(post)} className="flex items-center gap-1.5 text-slate-500 hover:text-brand-500 font-bold transition-colors">
                <Share2 size={18} />
                <span className="text-sm">Compartilhar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Compartilhamento */}
      {sharingPost && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-dark-900 border border-dark-700 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 space-y-6 relative">
            <button onClick={() => setSharingPost(null)} className="absolute top-6 right-6 text-slate-500"><X size={24}/></button>
            <div className="text-center">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Compartilhar Postagem</h3>
              <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-widest">Espalhe o movimento!</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => shareSocial('whatsapp', sharingPost)} className="flex flex-col items-center gap-2 group">
                <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all"><Send size={24}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">WhatsApp</span>
              </button>
              <button onClick={() => shareSocial('facebook', sharingPost)} className="flex flex-col items-center gap-2 group">
                <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Facebook size={24}/></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Facebook</span>
              </button>
              <button onClick={() => shareSocial('copy', sharingPost)} className="flex flex-col items-center gap-2 group">
                <div className="p-4 bg-brand-500/10 text-brand-500 rounded-2xl group-hover:bg-brand-500 group-hover:text-white transition-all">
                  {copiedId ? <Check size={24}/> : <Copy size={24}/>}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Link/Insta</span>
              </button>
            </div>
            <button onClick={() => setSharingPost(null)} className="w-full py-4 bg-dark-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};
