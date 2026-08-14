import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import Toast from './Toast';

const AdminLogin = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  if (!isOpen) return null;

  const resetFields = () => {
    setEmail('');
    setPassword('');
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.user.role !== 'admin') {
          setToast({ type: 'error', message: 'هذا الحساب لا يملك صلاحيات الإدارة!' });
          resetFields();
          return;
        }

        localStorage.setItem('user', JSON.stringify(result.user));
        handleClose();
        navigate('/admin-dashboard');
      } else {
        setToast({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error("Error:", error);
      setToast({ type: 'error', message: 'حدث خطأ في الاتصال بالسيرفر، تأكد من تشغيل Flask' });
    }
  };

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="modal-overlay" onClick={handleClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={handleClose}>&times;</button>

        {/* 🌟 نفس هوية الألوان الموحدة المستخدمة بنوافذ تسجيل دخول الطالب والموظف (#0d6efd) */}
        <div className="auth-header">
          <i className="bi bi-shield-lock-fill" style={{ color: '#0d6efd', fontSize: '65px' }}></i>
          <h2 style={{ color: '#052c65', fontWeight: '700' }}>دخول مدير النظام</h2>
          <p>هذه البوابة مخصصة لإدارة النظام فقط</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <div className="input-group-custom">
            <label>البريد الإلكتروني</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@uni.edu"
              required
            />
          </div>

          <div className="input-group-custom">
            <label>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="auth-btn" style={{ backgroundColor: '#0d6efd' }}>
            تسجيل الدخول
          </button>
        </form>
      </div>
      </div>
    </>
  );
};

export default AdminLogin;
