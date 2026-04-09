import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support/admin/all');
      setTickets(res.data.tickets);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const toggleStatus = async (ticket) => {
    const newStatus = ticket.status === 'open' ? 'closed' : 'open';
    try {
      const res = await api.patch(`/support/admin/${ticket.id}`, { status: newStatus });
      setTickets(prev => prev.map(t => t.id === ticket.id ? res.data.ticket : t));
    } catch (e) {
      alert('Ошибка при обновлении статуса');
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
  const openCount = tickets.filter(t => t.status === 'open').length;
  const closedCount = tickets.filter(t => t.status === 'closed').length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>⚙</span>
            <span className={styles.brandName}>Админ-панель</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.emailBadge}>{email}</span>
            <button onClick={() => navigate('/')} className={styles.backBtn}>← Лента</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Тикеты поддержки</h1>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{tickets.length}</span>
              <span className={styles.statLabel}>всего</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNum} ${styles.openNum}`}>{openCount}</span>
              <span className={styles.statLabel}>открытых</span>
            </div>
            <div className={styles.stat}>
              <span className={`${styles.statNum} ${styles.closedNum}`}>{closedCount}</span>
              <span className={styles.statLabel}>закрытых</span>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          {['all', 'open', 'closed'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Все' : f === 'open' ? 'Открытые' : 'Закрытые'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⚙</div>
            <p>Тикетов нет</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(ticket => (
              <div key={ticket.id} className={`${styles.ticket} ${styles[ticket.status]}`}>
                <div className={styles.ticketHeader}>
                  <span className={styles.ticketId}>#{ticket.id}</span>
                  <span className={styles.ticketEmail}>{ticket.user_email}</span>
                  <span className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                    {ticket.status === 'open' ? 'Открыто' : 'Закрыто'}
                  </span>
                  <span className={styles.ticketDate}>{formatDate(ticket.created_at)}</span>
                </div>
                <p className={styles.ticketMessage}>{ticket.message}</p>
                <button
                  className={`${styles.actionBtn} ${ticket.status === 'open' ? styles.closeBtn : styles.reopenBtn}`}
                  onClick={() => toggleStatus(ticket)}
                >
                  {ticket.status === 'open' ? '✓ Закрыть тикет' : '↺ Переоткрыть'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
