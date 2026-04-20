import React, { useEffect, useState } from 'react';
import api from '../api';
import styles from './ReactionsBar.module.css';

const ReactionsBar = ({ postId, currentEmail, onReactionChanged }) => {
  const [reactions, setReactions] = useState({});
  const [userReactions, setUserReactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const VALID_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  useEffect(() => {
    fetchReactions();
  }, [postId]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      const [reactionsRes, userRes] = await Promise.all([
        api.get(`/reactions/${postId}`),
        currentEmail ? api.get(`/reactions/${postId}/user`) : Promise.resolve({ data: { userReactions: [] } })
      ]);
      setReactions(reactionsRes.data);
      setUserReactions(userRes.data.userReactions || []);
    } catch (err) {
      console.error('Ошибка загрузки реакций:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReactionClick = async (reactionType) => {
    if (!currentEmail) {
      alert('Войдите, чтобы добавить реакцию');
      return;
    }

    try {
      await api.post(`/reactions/${postId}/${reactionType}`);
      await fetchReactions();
      if (onReactionChanged) onReactionChanged();
    } catch (err) {
      console.error('Ошибка при добавлении реакции:', err);
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactions).reduce((sum, count) => sum + count, 0);
  };

  if (loading) {
    return <div className={styles.loading}>⏳</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.reactionButtons}>
        {VALID_REACTIONS.map(emoji => {
          const count = reactions[emoji] || 0;
          const isActive = userReactions.includes(emoji);

          return (
            <button
              key={emoji}
              className={`${styles.reactionBtn} ${isActive ? styles.active : ''}`}
              onClick={() => handleReactionClick(emoji)}
              title={`${emoji} ${count} ${count === 1 ? 'реакция' : 'реакций'}`}
            >
              <span className={styles.emoji}>{emoji}</span>
              {count > 0 && <span className={styles.count}>{count}</span>}
            </button>
          );
        })}
      </div>
      {getTotalReactions() > 0 && (
        <div className={styles.total}>
          Всего реакций: {getTotalReactions()}
        </div>
      )}
    </div>
  );
};

export default ReactionsBar;
