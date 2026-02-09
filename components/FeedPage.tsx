
import React, { useState, useEffect, useRef } from 'react';
import { Post, User, UserRole, Comment } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { ImageService } from '../services/imageService';
import { 
  Camera, Send, Heart, Loader2, MessageCircle, X, 
  Image as ImageIcon, Sparkles, Mic, MicOff, Info, 
  Trash2, ChevronRight, User as UserIcon, Calendar, Clock,
  UploadCloud, CheckCircle2
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      // Comprime para 1080px (padrão Feed) com 60% de qualidade
      // Isso funciona tanto para foto tirada na hora quanto para arquivo do notebook
      const base64 = await ImageService.compressImage(file, 1080, 0.6);
      setCompressedImageBase64(base64);
    } catch (error) {
      console.error("Erro ao processar imagem do feed:", error);
      addToast("Não foi possível otimizar esta foto. Tente outra.", "error");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption && !compressedImageBase64) return;
    
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
      addToast("Publicado com sucesso!", "success");
    } catch (error: any) {
      addToast(`Falha ao publicar: ${error.message}`, "error");
    } finally {
      setPostSubmitting(false);
    }
  };

  const toggleVoiceCaption = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return addToast("Ditado não disponível neste navegador.", "info");
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
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Comunidade</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">A energia do Studio em um só lugar</p>
        </div>
        <div className="bg-brand-500/10 p-2 rounded-full text-brand-500"><Sparkles size={20} /></div>
      </header>

      {/* CRIAR POST - Otimizado para Mobile e Desktop */}
      <div className="bg-dark-950 p-6 rounded-[2.5rem] border border-dark-800 shadow-2xl no-print">
        <form onSubmit={handleCreatePost} className="space-y-5">
          <div className="flex gap-4">
            <img 
              src={String(currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${String(currentUser.name)}`)} 
              className="w-12 h-12 rounded-2xl object-cover border-2 border-dark-800 shadow-lg" 
            />
            <div className="flex-1 relative">
              <textarea
                className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none resize-none pt-2 text-sm leading-relaxed pr-10"
                placeholder={`No que está pensando, ${String(currentUser.name).split(' ')[0]}?`}
                value={newPostCaption} 
                onChange={e => setNewPostCaption(e.target.value)} 
                rows={2}
              ></textarea>
              <button 
                type="button" 
                onClick={toggleVoiceCaption} 
                className={`absolute right-0 top-2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-brand-500'}`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
          </div>

          {/* ÁREA DE PREVIEW / PROCESSAMENTO */}
          {isProcessingImage ? (
            <div className="w-full h-48 bg-dark-900 rounded-3xl border-2 border-dashed border-dark-700 flex flex-col items-center justify-center gap-3 animate-pulse">
                <Loader2 className="text-brand-500 animate-spin" size={32} />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Otimizando sua foto...</p>
            </div>
          ) : compressedImageBase64 ? (
            <div className="relative w-full rounded-3xl overflow-hidden border border-dark-800 bg-dark-900 group">
              <img src={compressedImageBase64} className="w-full h-auto max-h-[400px] object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    type="button" 
                    onClick={() => setCompressedImageBase64(null)} 
                    className="p-4 bg-red-600 text-white rounded-2xl shadow-2xl hover:scale-110 transition-transform flex items-center gap-2"
                  >
                    <Trash2 size={20} /> <span className="text-xs font-black uppercase">Remover</span>
                  </button>
              </div>
              <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg">
                  <CheckCircle2 size={10}/> Imagem Otimizada
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
             <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border-2 ${compressedImageBase64 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-dark-900 border-dark-800 text-slate-400 hover:border-brand-500/50 hover:text-brand-500'}`}
             >
                {compressedImageBase64 ? <CheckCircle2 size={16}/> : <Camera size={16}/>}
                {compressedImageBase64 ? 'Trocar Foto' : 'Adicionar Foto'}
             </button>
             
             <button 
                type="submit" 
                disabled={postSubmitting || isProcessingImage || (!newPostCaption && !compressedImageBase64)} 
                className="flex-1 bg-brand-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 hover:bg-brand-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale"
             >
                {postSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                {postSubmitting ? 'Enviando...' : 'Publicar no Mural'}
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
                <img src={post.userAvatar} className="w-10 h-10 rounded-xl object-cover border border-dark-800 shadow-sm" />
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{post.userName}</p>
                  <div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-tighter">
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
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center no-print">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest border-2 border-white/50 px-6 py-2.5 rounded-full backdrop-blur-sm">Expandir Foto</span>
                </div>
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
                <p className="text-slate-300 text-sm leading-relaxed px-1 line-clamp-3 group-hover:line-clamp-none transition-all">
                    {post.caption}
                </p>
            )}
          </div>
        )) : (
            <div className="py-24 text-center bg-dark-950/50 rounded-[3rem] border-2 border-dashed border-dark-800">
                <div className="w-20 h-20 bg-dark-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-dark-800 text-slate-700">
                    <ImageIcon size={40} />
                </div>
                <h3 className="text-slate-500 font-black uppercase text-sm tracking-widest">Mural Silencioso</h3>
                <p className="text-slate-700 text-xs mt-2">Seja o primeiro a compartilhar o treino de hoje!</p>
            </div>
        )}
      </div>

      {/* MODAL DE DETALHES (COMENTÁRIOS) */}
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

// ... (PostDetailModal permanece o mesmo do arquivo original fornecido pelo usuário)

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in no-print">
            <div className="bg-dark-900 border border-dark-700 rounded-[2.5rem] w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-dark-950/80 text-white rounded-full hover:bg-white hover:text-black transition-all shadow-xl">
                    <X size={24} />
                </button>

                <div className="flex-1 bg-black flex items-center justify-center overflow-hidden border-r border-dark-800">
                    <img src={post.imageUrl} className="max-w-full max-h-full object-contain" alt="Post" />
                </div>

                <div className="w-full md:w-[400px] flex flex-col bg-dark-950 h-full">
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

                    <div className="p-4 border-b border-dark-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={onLike} className={`p-2 rounded-xl transition-all ${post.likes.includes(currentUser.id) ? 'bg-red-500/20 text-red-500' : 'bg-dark-900 text-slate-400 hover:text-red-400'}`}>
                                <Heart size={20} fill={post.likes.includes(currentUser.id) ? "currentColor" : "none"} />
                            </button>
                            <p className="text-[10px] font-black text-slate-500 uppercase">
                                {post.likes.length} Curtidas
                            </p>
                        </div>
                    </div>

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
