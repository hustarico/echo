import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as apiRegister } from '../services/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRegister(username, password);
      login(data.jwt, username);
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Echo</h1>
        <p style={styles.subtitle}>Create a new account</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login" style={{ color: '#7c6df0' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
    background: '#0f0f0f'
  },
  card: {
    background: '#1a1a2e', padding: '40px', borderRadius: '12px', width: '360px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  title: {
    fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '4px',
    color: '#7c6df0'
  },
  subtitle: {
    textAlign: 'center', color: '#888', marginBottom: '24px', fontSize: '14px'
  },
  error: {
    background: '#3d1f1f', border: '1px solid #6b2b2b', color: '#ff6b6b',
    padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '12px 14px', borderRadius: '8px', border: '1px solid #333',
    background: '#16213e', color: '#e0e0e0', fontSize: '14px', outline: 'none'
  },
  button: {
    padding: '12px', borderRadius: '8px', border: 'none', background: '#7c6df0',
    color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '4px'
  },
  link: { textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#888' }
};
