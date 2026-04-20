import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userRes = await api.get('/profile/me');
      const devicesRes = await api.get('/profile/devices');
      
      setUser(userRes.data.user);
      setDevices(devicesRes.data.devices);
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Выйти со всех устройств? Вам придется заново авторизоваться.')) return;
    
    try {
      await api.post('/profile/logout-all-devices');
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      navigate('/login');
    } catch (err) {
      console.error('Error logging out all devices:', err);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!window.confirm('Удалить это устройство?')) return;
    
    try {
      await api.delete(`/profile/devices/${deviceId}`);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (err) {
      console.error('Error removing device:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCurrentDevice = (device) => {
    // Это примерная проверка - мож в реальности проверить через сессию
    return false;
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>👤</span>
            <span className={styles.brandName}>Профиль</span>
          </div>
          <button onClick={() => navigate('/feed')} className={styles.backBtn}>
            ← Вернуться в ленту
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Информация пользователя */}
        <section className={styles.userSection}>
          <h2 className={styles.sectionTitle}>👤 Аккаунт</h2>
          <div className={styles.card}>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={user?.email || ''} disabled />
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Выйти
            </button>
          </div>
        </section>

        {/* Список устройств */}
        <section className={styles.devicesSection}>
          <div className={styles.devicesHeader}>
            <h2 className={styles.sectionTitle}>📱 Устройства</h2>
            <p className={styles.devicesCount}>
              {devices.length} {devices.length === 1 ? 'устройство' : 'устройств'}
            </p>
          </div>

          {devices.length === 0 ? (
            <div className={styles.empty}>
              <p>Нет активных устройств</p>
            </div>
          ) : (
            <div className={styles.devicesList}>
              {devices.map((device) => (
                <div key={device.id} className={styles.deviceCard}>
                  <div className={styles.deviceInfo}>
                    <div className={styles.deviceNameRow}>
                      <span className={styles.deviceName}>{device.device_name}</span>
                      {isCurrentDevice(device) && (
                        <span className={styles.badge}>текущее</span>
                      )}
                    </div>
                    
                    <div className={styles.deviceDetails}>
                      <div className={styles.detail}>
                        <span className={styles.label}>Браузер:</span>
                        <span className={styles.value}>{device.browser}</span>
                      </div>
                      <div className={styles.detail}>
                        <span className={styles.label}>ОС:</span>
                        <span className={styles.value}>{device.os}</span>
                      </div>
                      <div className={styles.detail}>
                        <span className={styles.label}>IP:</span>
                        <span className={styles.value}>{device.ip_address}</span>
                      </div>
                    </div>

                    <div className={styles.timestamps}>
                      <div>
                        <span className={styles.timeLabel}>Добавлено:</span>
                        <span>{formatDate(device.created_at)}</span>
                      </div>
                      <div>
                        <span className={styles.timeLabel}>Последний вход:</span>
                        <span>{formatDate(device.last_seen)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    className={styles.removeBtn}
                    title="Удалить устройство"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {devices.length > 0 && (
            <button
              onClick={handleLogoutAllDevices}
              className={styles.logoutAllBtn}
            >
              Выйти со всех устройств
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
