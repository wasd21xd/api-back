import React, { useState } from 'react';
import styles from './PostDetail.module.css';
import ReactionsBar from './ReactionsBar';
import CommentInput from './CommentInput';
import CommentsList from './CommentsList';

const PostDetail = ({ post, currentEmail, onClose, onEdit, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const isOwner = post.authorEmail === currentEmail;

  const handleCommentAdded = (comment) => {
    setCommentCount(prev => prev + 1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{post.title}</h2>
            <span className={styles.date}>{formatDate(post.createdAt)}</span>
          </div>
          {isOwner && (
            <div className={styles.actions}>
              <button onClick={onEdit} className={styles.editBtn} title="Редактировать">✎ Редактировать</button>
              <button onClick={onDelete} className={styles.deleteBtn} title="Удалить">🗑️ Удалить</button>
            </div>
          )}
        </div>

        <div className={styles.content}>
          <p className={styles.text}>{post.content}</p>

          {post.tags && post.tags.length > 0 && (
            <div className={styles.tags}>
              {post.tags.map(tag => (
                <span key={tag.id} className={styles.tag}>#{tag.name}</span>
              ))}
            </div>
          )}
        </div>

        <div className={styles.authorInfo}>
          <span className={styles.author}>Автор: <strong>{post.authorEmail}</strong></span>
        </div>

        {/* Реакции */}
        <ReactionsBar 
          postId={post.id} 
          currentEmail={currentEmail}
          onReactionChanged={() => {}}
        />

        {/* Комментарии */}
        <div className={styles.commentsSection}>
          <button 
            className={styles.toggleCommentsBtn}
            onClick={() => setShowComments(!showComments)}
          >
            {showComments ? '▼' : '▶'} Комментарии (скоро будут обновлены)
          </button>

          {showComments && currentEmail && (
            <>
              <CommentInput 
                postId={post.id}
                onCommentAdded={handleCommentAdded}
              />
              <CommentsList 
                postId={post.id}
                currentEmail={currentEmail}
              />
            </>
          )}

          {showComments && !currentEmail && (
            <div className={styles.needLogin}>
              Войдите, чтобы оставить комментарий
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
