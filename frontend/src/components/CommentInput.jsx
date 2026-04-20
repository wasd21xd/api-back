import React, { useState } from 'react';
import api from '../api';
import styles from './CommentInput.module.css';

const CommentInput = ({ postId, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Комментарий не может быть пустым');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.post(`/comments/${postId}`, { content });
      setContent('');
      onCommentAdded(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при отправке комментария');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError('');
          }}
          placeholder="Напишите комментарий..."
          rows={3}
          maxLength={1000}
          disabled={loading}
        />
        <div className={styles.footer}>
          <span className={styles.counter}>{content.length}/1000</span>
          <button type="submit" disabled={loading || !content.trim()}>
            {loading ? '⏳ Отправка...' : '✓ Отправить'}
          </button>
        </div>
      </form>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default CommentInput;
