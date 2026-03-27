import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard';
import PostModal from '../components/PostModal';
import styles from './FeedPage.module.css';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data.posts.reverse());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

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
    </div>
  );
}
