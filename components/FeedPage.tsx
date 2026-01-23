
import React, { useState, useEffect, useRef } from 'react';
import { Post, User, UserRole, Comment } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { 
  Camera, Send, Heart, Loader2, MessageCircle, X, 
  Image as ImageIcon, Sparkles, Mic, MicOff, Info, 
  Trash2, ChevronRight, User as UserIcon, Calendar, Clock
} from 'lucide-react';

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
  const [isListening, setIsListening] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await SupabaseService.getPosts();
      setPosts(data);
    } catch (error: any) {
      addToast(`Erro ao carregar mural: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const updatedPost = await SupabaseService.addLikeToPost(postId, currentUser.id);
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
      if (selectedPost?.id === postId) setSelectedPost(updatedPost);
    } catch (e) {
      addToast("Erro ao processar curtida", "error");
    }
  };

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
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("Erro no Canvas");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
      };
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption && !selectedImage) return;
    setPostSubmitting(true);
    try {
      let compressedBase64 = '';
      if (selectedImage) compressedBase64 = await compressImage(selectedImage);
      const addedPost = await SupabaseService.addPost({
        userId: currentUser.id,
        imageUrl: compressedBase64,
        caption: newPostCaption,
        timestamp: new Date().toISOString(), 
      });
      setPosts(prev => [addedPost, ...prev]);
      setNewPostCaption(''); setSelectedImage(null); setPreviewUrl(null);
      addToast("Publicado com sucesso!", "success");
    } catch (error: any) {
      addToast(`Falha: ${error.message}`, "error");
    } finally {
      setPostSubmitting(false);
    }
  };

  const toggleVoiceCaption = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addToast("Ditado não disponível.", "info");
    if (isListening) { setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => { setNewPostCaption(prev => prev + " " + e.results[0][0].transcript); setIsListening(false); };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Comunidade</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Compartilhe sua evolução</p>
        </div>
        <div className="bg-brand-500/10 p-2 rounded-full text-brand-500"><Sparkles size={20} /></div>
      </header>

      {/* Criar Post */}
      <div className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-2xl">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="flex gap-4">
            <img src={String(currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${String(currentUser.name)}`)} className="w-12 h-12 rounded-2xl object-cover border border-dark-800" />
            <div className="flex-1 relative">
              <textarea
                className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none resize-none pt-2 text-sm leading-relaxed pr-10"
                placeholder={`No que está pensando, ${String(currentUser.name).split(' ')[0]}?`}
                value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} rows={2}
              ></textarea>
              <button type="button" onClick={toggleVoiceCaption} className={`absolute right-0 top-2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:text-brand-500'}`}>
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>
          {previewUrl && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-dark-800 bg-dark-900 group">
              <img src={previewUrl} className="w-full h-auto max-h-[350px] object-cover" />
              <button type="button" onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full shadow-2xl"><X size={20} /></button>
            </div>
          )}
          <div className="flex items-center gap-3">
             {!previewUrl && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-dark-900 border border-dark-800 rounded-xl text-slate-400 hover:text-brand-500 transition-all text-[10px] font-bold uppercase">
                  <Camera size={16}/> Foto
                </button>
             )}
             <button type="submit" disabled={postSubmitting} className="flex-1 bg-brand-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center justify-center gap-2">
                {postSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Publicar
             </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setSelectedImage(file); setPreviewUrl(URL.createObjectURL(file)); } }} />
        </form>
      </div>

      {/* Lista de Posts */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl space-y-4 animate-fade-in group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.userAvatar} className="w-10 h-10 rounded-xl object-cover border border-dark-800" />
                <div>
                  <p className="text-white font-bold text-sm">{post.userName}</p>
                  <p className="text-slate-500 text-[9px] font-bold uppercase">{new Date(post.timestamp).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
            {post.imageUrl && (
              <div onClick={() => setSelectedPost(post)} className="w-full rounded-3xl overflow-hidden bg-dark-900 border border-dark-800 cursor-pointer relative group">
                <img src={post.imageUrl} className="w-full h-auto object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-black text-xs uppercase tracking-widest border-2 border-white px-4 py-2 rounded-full">Ver Detalhes</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-6 px-1">
                <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1.5 text-xs font-bold transition-all ${post.likes.includes(currentUser.id) ? 'text-red-500 scale-110' : 'text-slate-500 hover:text-red-400'}`}>
                    <Heart size={20} fill={post.likes.includes(currentUser.id) ? "currentColor" : "none"} />
                    {post.likes.length}
                </button>
                <button onClick={() => setSelectedPost(post)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-500">
                    <MessageCircle size={20} />
                    {post.comments?.length || 0}
                </button>
            </div>
            {post.caption && <p className="text-slate-300 text-sm leading-relaxed px-1 line-clamp-2">{post.caption}</p>}
          </div>
        ))}
      </div>

      {/* MODAL DE DETALHES */}
      {selectedPost && (
        <PostDetailModal 
          post={selectedPost} 
          currentUser={currentUser} 
          onClose={() => setSelectedPost(null)}
          onLike={() => handleLike(selectedPost.id)}
          addToast={addToast}
          onUpdate={(updated) => {
              setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
              setSelectedPost(updated);
          }}
        />
      )}
    </div>
  );
};

const PostDetailModal = ({ post, currentUser, onClose, onLike, addToast, onUpdate }: { post: Post, currentUser: User, onClose: () => void, onLike: () => void, addToast: any, onUpdate: (p: Post) => void }) => {
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const comment = await SupabaseService.addComment(post.id, currentUser.id, newComment);
            const updatedPost = { ...post, comments: [...(post.comments || []), comment] };
            onUpdate(updatedPost);
            setNewComment('');
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
        } catch (e) {
            addToast("Erro ao comentar", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/95 backdrop-blur-md p-4 pt-12 animate-fade-in">
            <div className="bg-dark-900 border border-dark-700 rounded-[2.5rem] w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-dark-950/80 text-white rounded-full hover:bg-white hover:text-black transition-all shadow-xl">
                    <X size={24} />
                </button>

                {/* Esquerda: Imagem */}
                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden border-r border-dark-800">
                    <img src={post.imageUrl} className="max-w-full max-h-full object-contain" alt="Post" />
                </div>

                {/* Direita: Interações */}
                <div className="w-full md:w-[400px] flex flex-col bg-dark-950 h-full">
                    {/* Header */}
                    <div className="p-6 border-b border-dark-800 bg-dark-900/50">
                        <div className="flex items-center gap-4">
                            <img src={post.userAvatar} className="w-12 h-12 rounded-2xl border border-dark-800 object-cover" />
                            <div>
                                <p className="text-white font-black uppercase text-sm tracking-tighter">{post.userName}</p>
                                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase">
                                    <Clock size={12}/> {new Date(post.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    <span className="opacity-30">•</span>
                                    <Calendar size={12}/> {new Date(post.timestamp).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>
                        {post.caption && (
                            <p className="mt-4 text-slate-300 text-sm leading-relaxed border-l-2 border-brand-500/30 pl-4 italic">
                                {post.caption}
                            </p>
                        )}
                    </div>

                    {/* Likes & Estatísticas */}
                    <div className="p-4 border-b border-dark-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={onLike} className={`p-2 rounded-xl transition-all ${post.likes.includes(currentUser.id) ? 'bg-red-500/20 text-red-500' : 'bg-dark-900 text-slate-400 hover:text-red-400'}`}>
                                <Heart size={20} fill={post.likes.includes(currentUser.id) ? "currentColor" : "none"} />
                            </button>
                            <div className="flex -space-x-2">
                                {post.likes.slice(0, 3).map((l, i) => (
                                    <div key={i} className="w-7 h-7 rounded-full bg-dark-800 border-2 border-dark-950 flex items-center justify-center">
                                        <UserIcon size={12} className="text-slate-500" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase">
                                {post.likes.length} Curtidas
                            </p>
                        </div>
                    </div>

                    {/* Comentários */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map(c => (
                                <div key={c.id} className="flex gap-4 group">
                                    <img src={c.userAvatar} className="w-9 h-9 rounded-xl border border-dark-800 shrink-0" />
                                    <div className="flex-1">
                                        <div className="bg-dark-900 p-4 rounded-2xl rounded-tl-none border border-dark-800 relative">
                                            <p className="text-brand-500 font-black text-[9px] uppercase tracking-widest mb-1">{c.userName}</p>
                                            <p className="text-slate-200 text-sm leading-relaxed">{c.content}</p>
                                        </div>
                                        <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 ml-1">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale space-y-3">
                                <MessageCircle size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Nenhum comentário ainda.<br/>Seja o primeiro!</p>
                            </div>
                        )}
                    </div>

                    {/* Input de Comentário */}
                    <div className="p-6 bg-dark-900 border-t border-dark-800">
                        <form onSubmit={handleSendComment} className="relative">
                            <input 
                                className="w-full bg-dark-950 border border-dark-800 rounded-2xl p-4 pr-14 text-white focus:border-brand-500 outline-none text-sm placeholder:text-slate-600"
                                placeholder="Adicionar comentário..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                disabled={sending}
                            />
                            <button 
                                type="submit"
                                disabled={sending || !newComment.trim()}
                                className="absolute right-2 top-2 p-2 text-brand-500 hover:text-brand-400 disabled:opacity-20"
                            >
                                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={24} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
