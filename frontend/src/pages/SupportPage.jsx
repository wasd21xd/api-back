import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import styles from './SupportPage.module.css';

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get('/support');
        setTickets(res.data.tickets);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();

    const socket = io('http://localhost:3000', {
      auth: { token: localStorage.getItem('token') }
    });
    socketRef.current = socket;

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/support', { message });
      setTickets(prev => [res.data.ticket, ...prev]);
      setMessage('');
    } catch (e) {
      alert('Ошибка при отправке');
    } finally {
      setSending(false);
    }
  };

  const openChat = async (ticket) => {
    if (activeTicket) socketRef.current.emit('leave_ticket', activeTicket.id);
    setActiveTicket(ticket);
    socketRef.current.emit('join_ticket', ticket.id);
    try {
      const res = await api.get(`/support/${ticket.id}/messages`);
      setMessages(res.data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = () => {
    if (!inputMsg.trim() || !activeTicket) return;
    socketRef.current.emit('send_message', { ticketId: activeTicket.id, message: inputMsg });
    setInputMsg('');
  };

  const formatDate = (iso) => new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>✦</span>
            <span className={styles.brandName}>Поддержка</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.emailBadge}>{email}</span>
            <button onClick={() => navigate('/')} className={styles.backBtn}>← Лента</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>Техподдержка</h1>
          <p className={styles.heroSub}>Опишите проблему — мы поможем</p>
        </div>

        <div className={styles.form}>
          <textarea
            className={styles.textarea}
            placeholder="Опишите вашу проблему или вопрос..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
          />
          <button className={styles.sendBtn} onClick={handleSubmit} disabled={sending || !message.trim()}>
            {sending ? 'Отправка...' : 'Отправить обращение'}
          </button>
        </div>

        <h2 className={styles.listTitle}>Мои обращения</h2>

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : tickets.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✦</div>
            <p>Обращений пока нет</p>
          </div>
        ) : (
          <div className={styles.layout}>
            <div className={styles.list}>
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`${styles.ticket} ${activeTicket?.id === ticket.id ? styles.ticketActive : ''}`}
                  onClick={() => openChat(ticket)}
                >
                  <div className={styles.ticketHeader}>
                    <span className={styles.ticketId}>#{ticket.id}</span>
                    <span className={`${styles.status} ${styles[ticket.status]}`}>
                      {ticket.status === 'open' ? 'Открыто' : 'Закрыто'}
                    </span>
                    <span className={styles.ticketDate}>{formatDate(ticket.created_at)}</span>
                  </div>
                  <p className={styles.ticketMessage}>{ticket.message}</p>
                </div>
              ))}
            </div>

            {activeTicket && (
              <div className={styles.chatPanel}>
                <div className={styles.chatHeader}>
                  <span className={styles.chatTitle}>Чат по обращению #{activeTicket.id}</span>
                  <button className={styles.closeChatBtn} onClick={() => { socketRef.current.emit('leave_ticket', activeTicket.id); setActiveTicket(null); setMessages([]); }}>✕</button>
                </div>
                <div className={styles.chatMessages}>
                  <div className={styles.ticketOriginal}>
                    <span className={styles.originalLabel}>Ваше обращение:</span>
                    <p>{activeTicket.message}</p>
                  </div>
                  {messages.map(msg => (
                    <div key={msg.id} className={`${styles.msg} ${msg.sender_email === email ? styles.msgMine : styles.msgOther}`}>
                      <span className={styles.msgSender}>{msg.sender_email === email ? 'Вы' : 'Поддержка'}</span>
                      <p className={styles.msgText}>{msg.message}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className={styles.chatInput}>
                  <input
                    className={styles.input}
                    placeholder="Написать сообщение..."
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  />
                  <button className={styles.sendMsgBtn} onClick={sendMessage}>Отправить</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
