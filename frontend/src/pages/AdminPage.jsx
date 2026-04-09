import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import styles from './AdminPage.module.css';

export default function AdminPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
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

  useEffect(() => {
    fetchTickets();

    // Подключение WebSocket
    const socket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });
    socketRef.current = socket;

    // Авторефреш при новом тикете или обновлении
    socket.on('ticket_updated', () => {
      fetchTickets();
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openChat = async (ticket) => {
    if (activeTicket) {
      socketRef.current.emit('leave_ticket', activeTicket.id);
    }
    setActiveTicket(ticket);
    socketRef.current.emit('join_ticket', ticket.id);
    try {
      const res = await api.get(`/support/${ticket.id}/messages`);
      setMessages(res.data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  const closeChat = () => {
    if (activeTicket) socketRef.current.emit('leave_ticket', activeTicket.id);
    setActiveTicket(null);
    setMessages([]);
  };

  const sendMessage = () => {
    if (!inputMsg.trim() || !activeTicket) return;
    socketRef.current.emit('send_message', { ticketId: activeTicket.id, message: inputMsg });
    setInputMsg('');
  };

  const toggleStatus = async (ticket) => {
    const newStatus = ticket.status === 'open' ? 'closed' : 'open';
    try {
      const res = await api.patch(`/support/admin/${ticket.id}`, { status: newStatus });
      setTickets(prev => prev.map(t => t.id === ticket.id ? res.data.ticket : t));
      if (activeTicket?.id === ticket.id) setActiveTicket(res.data.ticket);
    } catch (e) {
      alert('Ошибка при обновлении статуса');
    }
  };

  const formatDate = (iso) => new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
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
        <div className={styles.layout}>
          {/* Левая колонка — список тикетов */}
          <div className={styles.ticketsList}>
            <div className={styles.hero}>
              <h1 className={styles.heroTitle}>Тикеты</h1>
              <div className={styles.stats}>
                <div className={styles.stat}><span className={styles.statNum}>{tickets.length}</span><span className={styles.statLabel}>всего</span></div>
                <div className={styles.stat}><span className={`${styles.statNum} ${styles.openNum}`}>{openCount}</span><span className={styles.statLabel}>открытых</span></div>
                <div className={styles.stat}><span className={`${styles.statNum} ${styles.closedNum}`}>{closedCount}</span><span className={styles.statLabel}>закрытых</span></div>
              </div>
            </div>

            <div className={styles.filters}>
              {['all', 'open', 'closed'].map(f => (
                <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Все' : f === 'open' ? 'Открытые' : 'Закрытые'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={styles.loading}><div className={styles.spinner} /></div>
            ) : filtered.length === 0 ? (
              <div className={styles.empty}><p>Тикетов нет</p></div>
            ) : (
              <div className={styles.list}>
                {filtered.map(ticket => (
                  <div
                    key={ticket.id}
                    className={`${styles.ticket} ${styles[ticket.status]} ${activeTicket?.id === ticket.id ? styles.ticketActive : ''}`}
                    onClick={() => openChat(ticket)}
                  >
                    <div className={styles.ticketHeader}>
                      <span className={styles.ticketId}>#{ticket.id}</span>
                      <span className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                        {ticket.status === 'open' ? 'Открыто' : 'Закрыто'}
                      </span>
                      <span className={styles.ticketDate}>{formatDate(ticket.created_at)}</span>
                    </div>
                    <span className={styles.ticketEmail}>{ticket.user_email}</span>
                    <p className={styles.ticketMessage}>{ticket.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка — чат */}
          <div className={styles.chatPanel}>
            {!activeTicket ? (
              <div className={styles.chatEmpty}>
                <span className={styles.chatEmptyIcon}>💬</span>
                <p>Выберите тикет чтобы открыть чат</p>
              </div>
            ) : (
              <>
                <div className={styles.chatHeader}>
                  <div>
                    <span className={styles.chatTitle}>#{activeTicket.id} — {activeTicket.user_email}</span>
                  </div>
                  <div className={styles.chatActions}>
                    <button
                      className={`${styles.actionBtn} ${activeTicket.status === 'open' ? styles.closeBtn : styles.reopenBtn}`}
                      onClick={() => toggleStatus(activeTicket)}
                    >
                      {activeTicket.status === 'open' ? '✓ Закрыть' : '↺ Открыть'}
                    </button>
                    <button className={styles.closeChatBtn} onClick={closeChat}>✕</button>
                  </div>
                </div>

                <div className={styles.chatMessages}>
                  <div className={styles.ticketOriginal}>
                    <span className={styles.originalLabel}>Обращение:</span>
                    <p>{activeTicket.message}</p>
                  </div>
                  {messages.map(msg => (
                    <div key={msg.id} className={`${styles.msg} ${msg.sender_email === email ? styles.msgMine : styles.msgOther}`}>
                      <span className={styles.msgSender}>{msg.sender_email === email ? 'Вы' : msg.sender_email}</span>
                      <p className={styles.msgText}>{msg.message}</p>
                      <span className={styles.msgTime}>{formatDate(msg.created_at)}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className={styles.chatInput}>
                  <input
                    className={styles.input}
                    placeholder="Написать ответ..."
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <button className={styles.sendBtn} onClick={sendMessage}>Отправить</button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
