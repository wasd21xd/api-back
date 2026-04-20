import React, { useEffect, useState } from 'react';
import api from '../api';
import styles from './CommentsList.module.css';

const CommentsList = ({ postId, currentEmail, onCommentAdded }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const LIMIT = 10;

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comments/${postId}?limit=${LIMIT}&offset=0`);
      setComments(response.data.comments);
      setHasMore(response.data.comments.length === LIMIT);
      setOffset(0);
    } catch (err) {
      console.error('Ошибка загрузки комментариев:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const newOffset = offset + LIMIT;
      const response = await api.get(`/comments/${postId}?limit=${LIMIT}&offset=${newOffset}`);
      setComments([...comments, ...response.data.comments]);
      setOffset(newOffset);
      setHasMore(response.data.comments.length === LIMIT);
    } catch (err) {
      console.error('Ошибка загрузки дополнительных комментариев:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${postId}/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      alert('Не удалось удалить комментарий');
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    try {
      const response = await api.put(`/comments/${postId}/${commentId}`, {
        content: newContent
      });
      setComments(comments.map(c => c.id === commentId ? response.data : c));
      setEditingId(null);
      setEditText('');
    } catch (err) {
      alert('Не удалось обновить комментарий');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка комментариев...</div>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Комментарии ({comments.length})</h3>

      {comments.length === 0 ? (
        <div className={styles.empty}>Нет комментариев. Будьте первым!</div>
      ) : (
        <div className={styles.commentsList}>
          {comments.map(comment => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.header}>
                <span className={styles.author}>{comment.author_email}</span>
                <span className={styles.date}>{formatDate(comment.created_at)}</span>
              </div>

              {editingId === comment.id ? (
                <div className={styles.editForm}>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Отредактировать комментарий..."
                    rows={3}
                  />
                  <div className={styles.editButtons}>
                    <button
                      className={styles.saveBtn}
                      onClick={() => handleEditComment(comment.id, editText)}
                    >
                      ✓ Сохранить
                    </button>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => {
                        setEditingId(null);
                        setEditText('');
                      }}
                    >
                      ✕ Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className={styles.content}>{comment.content}</p>

                  {currentEmail === comment.author_email && (
                    <div className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.content);
                        }}
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {hasMore && (
            <button className={styles.loadMoreBtn} onClick={loadMore}>
              Загрузить еще комментарии
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentsList;
