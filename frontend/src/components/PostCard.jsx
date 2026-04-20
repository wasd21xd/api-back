import styles from './PostCard.module.css';

const COLORS = ['#7c6aff', '#ff6a9b', '#4dffb4', '#ffd166', '#06d6a0'];

export default function PostCard({ post, index, currentEmail, onEdit, onDelete, onTagClick, onCardClick }) {
  const isOwner = post.authorEmail === currentEmail;
  const color = COLORS[index % COLORS.length];
  const date = new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  return (
    <div className={styles.card} style={{ '--accent-color': color, animationDelay: `${index * 0.05}s` }}>
      <div className={styles.top}>
        <div className={styles.dot} />
        <span className={styles.date}>{date}</span>
        {isOwner && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <button onClick={onEdit} className={styles.editBtn} title="Редактировать">✎</button>
            <button onClick={onDelete} className={styles.deleteBtn} title="Удалить">✕</button>
          </div>
        )}
      </div>
      <h2 
        className={styles.title}
        onClick={onCardClick}
        style={{ cursor: onCardClick ? 'pointer' : 'default' }}
      >
        {post.title}
      </h2>
      <p 
        className={styles.content}
        onClick={onCardClick}
        style={{ cursor: onCardClick ? 'pointer' : 'default' }}
      >
        {post.content}
      </p>
      {post.tags && post.tags.length > 0 && (
        <div className={styles.tags}>
          {post.tags.map(tag => (
            <span 
              key={tag.id} 
              className={styles.tag}
              onClick={() => onTagClick && onTagClick(tag.name)}
              style={{ cursor: onTagClick ? 'pointer' : 'default' }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        <span className={styles.author}>{post.authorEmail.split('@')[0]}</span>
      </div>
    </div>
  );
}
