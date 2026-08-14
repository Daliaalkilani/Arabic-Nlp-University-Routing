import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import Toast from './Toast';

const StudentLogin = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // إشعار موحّد: { type: 'success' | 'error', message }
  const [toast, setToast] = useState(null);

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

    const loginData = {
      email: email,
      password: password
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok) {
        
        /* 🌟 الفحص السحري لسد الثغرة ومنع الموظف من الدخول كطالب 🌟 */
        // ملاحظة: تأكدي إن كانت القيمة المخزنة في قاعدة البيانات هي 'student' أو عدليها بما يناسب كودك
        if (result.user.role && result.user.role !== 'student') {
          setToast({ type: 'error', message: 'عذراً! هذا الحساب مسجل كموظف، يرجى تسجيل الدخول من بوابة الموظفين فقط.' });
          resetFields();
          return; // إيقاف الدالة فوراً ومنعه من الانتقال للداشبورد
        }

        // 1. حفظ بيانات الطالب في الذاكرة (لن يتم الوصول هنا إلا إذا كان المستخدم طالباً فعلاً)
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // 2. رسالة ترحيب بسيطة باسم الطالب
        const studentName = result.user.fullName || 'الطالب';
        setToast({ type: 'success', message: `مرحباً، ${studentName}` });

        // تأخير الانتقال لمدة ثانيتين ونصف لتستمتعي بشكل الرسالة وهي بالأسفل
        setTimeout(() => {
          handleClose();
          navigate('/dashboard'); 
        }, 2500);

      } else {
        setToast({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error("Error:", error);
      setToast({ type: 'error', message: 'حدث خطأ في الاتصال بالسيرفر، تأكدي من تشغيل Flask' });
    }
  };

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="modal-overlay" onClick={handleClose}>
        <div className="auth-card" onClick={(e) => e.stopPropagation()}>
          <button className="close-modal" onClick={handleClose}>&times;</button>
          
          <div className="auth-header">
            <i className="bi bi-box-arrow-in-right" style={{ color: '#0d6efd', fontSize: '65px' }}></i>
            <h2 style={{ fontWeight: '700' }}>تسجيل دخول الطالب</h2>
            <p>أهلاً بك مجدداً، يرجى إدخال بياناتك للدخول إلى لوحتك الذكية</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="input-group-custom">
              <label>البريد الإلكتروني الجامعي</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@uni.edu" 
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

export default StudentLogin;