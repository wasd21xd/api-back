import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard';
import PostModal from '../components/PostModal';
import PostDetail from '../components/PostDetail';
import styles from './FeedPage.module.css';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const navigate = useNavigate();
  const email = localStorage.getItem('email');
  const isAdmin = email === import.meta.env.VITE_ADMIN_EMAIL;

  const fetchTags = async () => {
    try {
      const res = await api.get('/posts/tags/list');
      setAllTags(res.data.tags);
    } catch (e) {
      console.error('Ошибка при загрузке тегов', e);
    }
  };

  const fetchPosts = async (tags = [], sort = 'newest') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (tags.length > 0) {
        tags.forEach(tag => params.append('tags', tag));
      }
      params.append('sortBy', sort);
      
      const res = await api.get(`/posts?${params.toString()}`);
      setPosts(res.data.posts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTags();
    fetchPosts(selectedTags, sortBy); 
  }, []);

  useEffect(() => {
    fetchPosts(selectedTags, sortBy);
  }, [selectedTags, sortBy]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пост?')) return;
    await api.delete(`/posts/${id}`);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleTagToggle = (tagName) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSaved = (post, isEdit) => {
    if (isEdit) {
      setPosts(prev => prev.map(p => p.id === post.id ? post : p));
    } else {
      setPosts(prev => [post, ...prev]);
    }
    setShowModal(false);
    setEditPost(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>✦</span>
            <span className={styles.brandName}>Posts</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.emailBadge}>{email}</span>
            <button onClick={() => navigate('/profile')} className={styles.logoutBtn}>👤 Профиль</button>
            <button onClick={() => navigate('/support')} className={styles.logoutBtn}>Поддержка</button>
            {isAdmin && (
              <button onClick={() => navigate('/admin')} className={styles.logoutBtn}>Админ</button>
            )}
            <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Лента постов</h1>
          <p className={styles.heroSub}>{posts.length} {posts.length === 1 ? 'пост' : 'постов'}</p>
          <button className={styles.newBtn} onClick={() => setShowModal(true)}>
            <span>+</span> Новый пост
          </button>
        </div>

        {/* Фильтры и сортировка */}
        <div className={styles.controls}>
          <div className={styles.sortControl}>
            <label>Сортировка:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
              <option value="newest">Новые</option>
              <option value="oldest">Старые</option>
              <option value="updated">Обновленные</option>
            </select>
          </div>

          <div className={styles.tagsFilter}>
            <p className={styles.tagsLabel}>Теги:</p>
            <div className={styles.tagsList}>
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  className={`${styles.tagFilter} ${selectedTags.includes(tag.name) ? styles.tagFilterActive : ''}`}
                  onClick={() => handleTagToggle(tag.name)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <button 
              className={styles.clearFilters}
              onClick={() => setSelectedTags([])}
            >
              ✕ Очистить фильтры
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : posts.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✦</div>
            <p>Постов пока нет</p>
            <button onClick={() => setShowModal(true)}>Создать первый</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
                currentEmail={email}
                onEdit={() => { setEditPost(post); setShowModal(true); }}
                onDelete={() => handleDelete(post.id)}
                onTagClick={handleTagToggle}
                onCardClick={() => { setSelectedPost(post); setShowDetail(true); }}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <PostModal
          post={editPost}
          onClose={() => { setShowModal(false); setEditPost(null); }}
          onSaved={handleSaved}
        />
      )}

      {showDetail && selectedPost && (
        <PostDetail
          post={selectedPost}
          currentEmail={email}
          onClose={() => { setShowDetail(false); setSelectedPost(null); }}
          onEdit={() => { 
            setShowDetail(false); 
            setEditPost(selectedPost); 
            setShowModal(true); 
          }}
          onDelete={() => { 
            handleDelete(selectedPost.id);
            setShowDetail(false); 
            setSelectedPost(null); 
          }}
        />
      )}
    </div>
  );
}
