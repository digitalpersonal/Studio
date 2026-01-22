
import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Camera, Send, Heart, Loader2, MessageCircle, Link, Image as ImageIcon, X, Upload } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data = await SupabaseService.getPosts();
        setPosts(data);
      } catch (error: any) {
        console.error("Erro ao carregar posts:", error.message || JSON.stringify(error));
        addToast(`Erro ao carregar o feed: ${error.message || JSON.stringify(error)}`, "error");
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
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("Não foi possível obter contexto do canvas");
          
          ctx.drawImage(img, 0, 0, width, height);
          // 0.6 de qualidade para JPEG garante um tamanho de arquivo muito pequeno
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
        addToast("Por favor, selecione apenas arquivos de imagem.", "error");
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
      if (selectedImage) {
        compressedBase64 = await compressImage(selectedImage);
      }

      const newPost: Omit<Post, 'id' | 'userName' | 'userAvatar' | 'likes'> & { userId: string } = {
        userId: currentUser.id,
        imageUrl: compressedBase64,
        caption: newPostCaption,
        timestamp: new Date().toISOString(), 
      };

      const addedPost = await SupabaseService.addPost(newPost);
      setPosts(prev => [addedPost, ...prev]);
      
      // Limpar formulário
      setNewPostCaption('');
      setSelectedImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      addToast("Post publicado com sucesso!", "success");
    } catch (error: any) {
      console.error("Erro ao criar post:", error.message || JSON.stringify(error));
      addToast(`Erro ao publicar o post: ${error.message || JSON.stringify(error)}`, "error");
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const updatedPost = await SupabaseService.addLikeToPost(postId, currentUser.id);
      setPosts(prev => prev.map(p => (p.id === postId ? updatedPost : p)));
    } catch (error: any) {
      console.error("Erro ao curtir post:", error.message || JSON.stringify(error));
      addToast(`Erro ao curtir/descurtir o post: ${error.message || JSON.stringify(error)}`, "error");
    }
  };

  const formatPostTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    if (diffSeconds < 60) {
      return `${diffSeconds} segundos atrás`;
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else if (diffSeconds < 2592000) { 
      const days = Math.floor(diffSeconds / 86400);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Comunidade</h2>
          <p className="text-slate-400 text-sm">Compartilhe seu progresso e inspire outros alunos.</p>
        </div>
      </header>

      {/* New Post Creator */}
      <div className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl">
        <h3 className="text-xl font-bold text-white mb-4">Criar Novo Post</h3>
        <form onSubmit={handleCreatePost} className="space-y-4">
          <textarea
            className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-brand-500 outline-none resize-none"
            placeholder="No que você está pensando? Compartilhe seu treino, conquistas ou dicas..."
            value={newPostCaption}
            onChange={e => setNewPostCaption(e.target.value)}
          ></textarea>
          
          {/* Image Preview and Upload Area */}
          <div className="space-y-3">
            {previewUrl ? (
              <div className="relative w-full max-h-64 rounded-2xl overflow-hidden border border-dark-700 bg-dark-900">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <button 
                  type="button"
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-10 border-2 border-dashed border-dark-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-brand-500 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all"
              >
                <div className="p-3 bg-dark-900 rounded-full">
                  <Camera size={24} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Adicionar Foto</span>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <button
            type="submit"
            disabled={postSubmitting}
            className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {postSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Send size={18} className="mr-2" />}
            Publicar Post
          </button>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="bg-dark-950 p-6 rounded-3xl border border-dark-800 shadow-xl space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <img src={String(post.userAvatar || `https://ui-avatars.com/api/?name=${String(post.userName)}`)} className="w-10 h-10 rounded-full border border-dark-800" alt={String(post.userName)} />
                <div>
                  <p className="text-white font-bold">{String(post.userName)}</p>
                  <p className="text-slate-500 text-xs">{formatPostTimestamp(post.timestamp)}</p>
                </div>
              </div>
              {post.imageUrl && (
                <div className="w-full rounded-2xl overflow-hidden mb-4 bg-dark-900 border border-dark-800">
                  <img src={String(post.imageUrl)} alt="Conteúdo do post" className="w-full h-auto max-h-[500px] object-contain mx-auto" loading="lazy" />
                </div>
              )}
              <p className="text-slate-300 text-sm whitespace-pre-line">{String(post.caption)}</p>

              <div className="flex items-center gap-4 pt-4 border-t border-dark-800">
                <button 
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-1 text-sm font-bold transition-colors ${
                    post.likes?.includes(currentUser.id) ? 'text-red-500' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  <Heart size={18} fill={post.likes?.includes(currentUser.id) ? 'currentColor' : 'none'} />
                  <span>{String(post.likes?.length || 0)}</span>
                </button>
                <div className="flex items-center gap-1 text-slate-500 text-sm font-bold">
                  <MessageCircle size={18} />
                  <span>0</span> 
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic">Nenhum post no feed ainda. Seja o primeiro a compartilhar!</p>
        )}
      </div>
    </div>
  );
};
