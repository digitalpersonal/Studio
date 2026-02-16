
import React, { useState, useEffect, useRef } from 'react';
import { Post, User, UserRole, Comment } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { ImageService } from '../services/imageService';
import { 
  Send, Heart, Loader2, MessageCircle, X, 
  Image as ImageIcon, Sparkles, Mic, MicOff, 
  Trash2, Clock, Upload, CheckCircle2, 
  Filter, Search
} from 'lucide-react';

interface FeedPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ currentUser, addToast }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [compressedImageBase64, setCompressedImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    // Inscrição Realtime para atualizações em tempo real no mural
    const unsubscribe = SupabaseService.subscribe((table) => {
        if (table === 'posts' || table === 'post_comments') {
            fetchPosts(false);
        }
    });
    return () => unsubscribe();
  }, []);

  const fetchPosts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await SupabaseService.getPosts();
      setPosts(data);
    } catch (error: any) {
      addToast(`Erro ao carregar mural.`, "error");
    } finally {
      if (showLoading) setLoading(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      // TRATAMENTO DE IMAGEM PARA OCUPAR O MENOR ESPAÇO POSSÍVEL:
      // Redimensiona para 1080px e qualidade 0.6 JPEG (Equilíbrio perfeito peso/visual)
      const base64 = await ImageService.compressImage(file, 1080, 0.6);
      setCompressedImageBase64(base64);
      addToast("Foto otimizada com sucesso!", "success");
    } catch (error) {
      addToast("Erro ao processar imagem.", "error");
    } finally {
      setIsProcessingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption.trim() && !compressedImageBase64) {
      addToast("Escreva algo ou anexe uma foto.", "info");
      return;
    }
    
    setPostSubmitting(true);
    try {
      const addedPost = await SupabaseService.addPost({
        userId: currentUser.id,
        imageUrl: compressedImageBase64 || '',
        caption: newPostCaption,
        timestamp: new Date().toISOString(), 
      });
      
      setPosts(prev => [addedPost, ...prev]);
      setNewPostCaption(''); 
      setCompressedImageBase64(null);
      addToast("Publicado no mural!", "success");
    } catch (error: any) {
      addToast(`Falha ao publicar.`, "error");
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
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-20 printable-area">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Comunidade</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Postagens e Evoluções</p>
        </div>
        <div className="bg-brand-500/10 p-2 rounded-full text-brand-500"><Sparkles size={20} /></div>
      </header>

      {/* CRIAR POST - OTIMIZADO PARA MENOR ESPAÇO */}
      <div className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-2xl no-print">
        <form onSubmit={handleCreatePost} className="space-y-5">
          <div className="flex gap-4">
            <img 
              src={String(currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${String(currentUser.name)}`)} 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-dark-800 shadow-lg" 
            />
            <div className="flex-1 relative">
              <textarea
                className="w-full bg-transparent text-white placeholder:text-slate-700 focus:outline-none resize-none pt-2 text-sm leading-relaxed pr-10"
                placeholder={`No que está pensando, ${String(currentUser.name).split(' ')[0]}?`}
                value={newPostCaption} 
                onChange={e => setNewPostCaption(e.target.value)} 
                rows={2}
              ></textarea>
              <button 
                type="button" 
                onClick={toggleVoiceCaption} 
                className={`absolute right-0 top-2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'text-slate-500 hover:text-brand-500'}`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>

          {/* PREVIEW E INDICADOR DE COMPRESSÃO */}
          {isProcessingImage ? (
            <div className="w-full h-40 bg-dark-900 rounded-3xl border-2 border-dashed border-brand-500/30 flex flex-col items-center justify-center gap-3 animate-pulse">
                <Loader2 className="text-brand-500 animate-spin" size={32} />
                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Tratando imagem para economizar espaço...</p>
            </div>
          ) : compressedImageBase64 ? (
            <div className="relative w-full rounded-3xl overflow-hidden border border-dark-800 bg-dark-900 group">
              <img src={compressedImageBase64} className="w-full h-auto max-h-[350px] object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button" 
                    onClick={() => setCompressedImageBase64(null)} 
                    className="p-4 bg-red-600 text-white rounded-2xl shadow-2xl hover:scale-110 transition-transform"
                  >
                    <Trash2 size={24} />
                  </button>
              </div>
              <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg border border-emerald-400">
                  <CheckCircle2 size={10}/> Otimizada para o Banco
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
             <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={isProcessingImage}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border-2 ${compressedImageBase64 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-dark-900 border-dark-800 text-slate-500 hover:border-brand-500/50 hover:text-brand-500'}`}
             >
                {compressedImageBase64 ? <CheckCircle2 size={16}/> : <Upload size={16}/>}
                {compressedImageBase64 ? 'Trocar Foto' : 'Selecionar Foto'}
             </button>
             
             <button 
                type="submit" 
                disabled={postSubmitting || isProcessingImage || (!newPostCaption.trim() && !compressedImageBase64)} 
                className="flex-1 bg-brand-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
             >
                {postSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                {postSubmitting ? 'Publicando...' : 'Postar Agora'}
             </button>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </form>
      </div>

      {/* FEED DE POSTAGENS */}
      <div className="space-y-6">
        {posts.length > 0 ? posts.map(post => (
          <div key={post.id} className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-xl space-y-4 animate-fade-in group hover:border-brand-500/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={post.userAvatar} className="w-10 h-10 rounded-xl object-cover border border-dark-800" />
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{post.userName}</p>
                  <div className="flex items-center gap-2 text-slate-600 text-[9px] font-bold uppercase">
                    <Clock size={10}/> {new Date(post.timestamp).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
            
            {post.imageUrl && (
              <div 
                onClick={() => setSelectedPost(post)} 
                className="w-full rounded-[2rem] overflow-hidden bg-dark-900 border border-dark-800 cursor-pointer relative group/img"
              >
                <img src={post.imageUrl} className="w-full h-auto object-cover transition-transform duration-700 group-hover/img:scale-105" loading="lazy" />
              </div>
            )}

            <div className="flex items-center gap-6 px-1 no-print">
                <button 
                  onClick={() => handleLike(post.id)} 
                  className={`flex items-center gap-2 text-xs font-black transition-all ${post.likes.includes(currentUser.id) ? 'text-red-500 scale-110' : 'text-slate-500 hover:text-red-400'}`}
                >
                    <Heart size={22} fill={post.likes.includes(currentUser.id) ? "currentColor" : "none"} />
                    {post.likes.length}
                </button>
                <button 
                  onClick={() => setSelectedPost(post)} 
                  className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-brand-500 transition-all"
                >
                    <MessageCircle size={22} />
                    {post.comments?.length || 0}
                </button>
            </div>
            
            {post.caption && (
                <p className="text-slate-300 text-sm leading-relaxed px-1">
                    {post.caption}
                </p>
            )}
          </div>
        )) : (
            <div className="py-24 text-center bg-dark-950/50 rounded-[3rem] border-2 border-dashed border-dark-800">
                <ImageIcon size={40} className="mx-auto text-dark-800 mb-4" />
                <p className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Nenhuma postagem ainda.</p>
            </div>
        )}
      </div>

      {/* MODAL DETALHE (COMENTÁRIOS) */}
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

const PostDetailModal = ({ post, currentUser, onClose, onLike, addToast, onUpdate }: any) => {
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSending(true);
        try {
            const comment = await SupabaseService.addComment(post.id, currentUser.id, newComment);
            const updatedPost = { ...post, comments: [...(post.comments || []), comment] };
            onUpdate(updatedPost);
            setNewComment('');
        } catch (e) {
            addToast("Erro ao comentar", "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in no-print">
            <div className="bg-dark-900 border border-dark-700 rounded-[2.5rem] w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-dark-950/80 text-white rounded-full transition-all hover:bg-white hover:text-black">
                  <X size={24} />
                </button>
                <div className="flex-1 bg-black flex items-center justify-center">
                    <img src={post.imageUrl} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="w-full md:w-[400px] flex flex-col bg-dark-950">
                    <div className="p-6 border-b border-dark-800">
                        <div className="flex items-center gap-3">
                            <img src={post.userAvatar} className="w-10 h-10 rounded-xl border border-dark-800" />
                            <p className="text-white font-black uppercase text-xs tracking-tighter">{post.userName}</p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {post.comments && post.comments.length > 0 ? post.comments.map((c: any) => (
                            <div key={c.id} className="space-y-1">
                                <p className="text-brand-500 font-black text-[9px] uppercase tracking-widest">{c.userName}</p>
                                <p className="text-slate-300 text-sm leading-relaxed">{c.content}</p>
                            </div>
                        )) : (
                          <p className="text-center text-slate-700 font-bold uppercase text-[9px] py-10">Nenhum comentário ainda.</p>
                        )}
                    </div>
                    <form onSubmit={handleSendComment} className="p-6 bg-dark-900 border-t border-dark-800">
                        <div className="relative">
                            <input 
                                className="w-full bg-dark-950 border border-dark-800 rounded-xl p-4 text-white text-sm focus:border-brand-500 outline-none"
                                placeholder="Comentar..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                            />
                            <button type="submit" disabled={sending || !newComment.trim()} className="absolute right-2 top-2 p-2 text-brand-500 disabled:opacity-30">
                                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={24} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
