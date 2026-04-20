import { useState, useEffect } from 'react';
import api from '../api';
import styles from './PostModal.module.css';

export default function PostModal({ post, onClose, onSaved }) {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [selectedTags, setSelectedTags] = useState(post?.tags?.map(t => t.id) || []);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!post;

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get('/posts/tags/list');
        setAllTags(res.data.tags);
      } catch (err) {
        console.error('Ошибка при загрузке тегов', err);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (isEdit) {
        const res = await api.put(`/posts/${post.id}`, { 
          title, 
          content,
          tagIds: selectedTags 
        });
        onSaved(res.data.post, true);
      } else {
        const res = await api.post('/posts', { 
          title, 
          content,
          tagIds: selectedTags 
        });
        onSaved(res.data.post, false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? 'Редактировать пост' : 'Новый пост'}</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Заголовок</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="О чём этот пост?" required />
          </div>
          <div className={styles.field}>
            <label>Текст</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Напишите что-нибудь..." rows={6} required />
          </div>
          
          <div className={styles.field}>
            <label>Теги</label>
            <div className={styles.tagsGrid}>
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  className={`${styles.tagBtn} ${selectedTags.includes(tag.id) ? styles.tagBtnActive : ''}`}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.btns}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Отмена</button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? '...' : isEdit ? 'Сохранить' : 'Опубликовать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
