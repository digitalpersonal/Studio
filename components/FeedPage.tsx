

import React, { useState, useEffect } from 'react';
import { Post, User } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { Camera, Send, Heart, Loader2, MessageCircle, Link } from 'lucide-react';

interface FeedPageProps {
  currentUser: User;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ currentUser, addToast }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [postSubmitting, setPostSubmitting] = useState(false);

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption && !newPostImageUrl) {
      addToast("O post não pode estar vazio!", "info");
      return;
    }
    setPostSubmitting(true);
    try {
      const newPost: Omit<Post, 'id' | 'userName' | 'userAvatar' | 'likes'> & { userId: string } = {
        userId: currentUser.id,
        imageUrl: newPostImageUrl || '',
        caption: newPostCaption,
        timestamp: new Date().toISOString(), 
      };
      const addedPost = await SupabaseService.addPost(newPost);
      setPosts(prev => [addedPost, ...prev]);
      setNewPostCaption('');
      setNewPostImageUrl('');
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
            className="w-full h-24 bg-dark-900 border border-dark-700 rounded-xl p-3 text-white placeholder-slate-500 focus:border-brand-500 outline-none"
            placeholder="No que você está pensando? Compartilhe seu treino, conquistas ou dicas..."
            value={newPostCaption}
            onChange={e => setNewPostCaption(e.target.value)}
          ></textarea>
          <div className="relative">
            <Link size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
            <input
              type="url"
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 pl-10 text-white placeholder-slate-500 focus:border-brand-500 outline-none"
              placeholder="URL da imagem (opcional)"
              value={newPostImageUrl}
              onChange={e => setNewPostImageUrl(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={postSubmitting}
            className="w-full bg-brand-600 text-white px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <img src={String(post.imageUrl)} alt="Conteúdo do post" className="w-full h-auto max-h-96 object-cover rounded-2xl mb-4" />
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