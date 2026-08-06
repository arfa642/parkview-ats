import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdLockOutline, MdPersonOutline } from 'react-icons/md';
import logoDark from '../assets/pvatsld.png';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, users } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  const fillCredentials = () => {};

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <img src={logoDark} alt="PVC ATS Logo" className="login-logo" />
          </div>
          <h2>Welcome Back</h2>
          <p>Please sign in to your account</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <span className="input-icon"><MdPersonOutline /></span>
            <select 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            >
              <option value="" disabled>Select User Account</option>
              {users && users.map(user => (
                <option key={user.id} value={user.username}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <span className="input-icon"><MdLockOutline /></span>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? <span className="loader"></span> : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
}
