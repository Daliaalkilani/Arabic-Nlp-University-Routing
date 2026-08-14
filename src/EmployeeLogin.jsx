import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import Toast from './Toast';

const EmployeeLogin = ({ isOpen, onClose }) => {
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

    const loginData = { email, password };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (response.ok) {
        // التأكد من أن الحساب لموظف
        if (result.user.role !== 'employee') {
          setToast({ type: 'error', message: 'هذا الحساب خاص بالطلاب، يرجى استخدامه في بوابة الطالب.' });
          return;
        }

        // 1. 🌟 السحر هنا: حفظ كائن الـ user القادم من قاعدة البيانات كاملاً في المتصفح
        // تأكدي أن السيرفر في بايثون يرسل حقل المكتب داخل الـ user (مثلاً: result.user.office)
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // 2. رسالة ترحيب بسيطة باسم الموظف
        const employeeName = result.user.fullName || 'الموظف';
        setToast({ type: 'success', message: `مرحباً، ${employeeName}` });

        // تأخير الانتقال لثانيتين ونصف لتثبيت البيانات والتحويل الآمن
        setTimeout(() => {
          handleClose();
          navigate('/employee-dashboard'); 
        }, 2500);

      } else {
        // 🌟 هون بتنعرض أيضاً رسالة "حسابك بانتظار موافقة الإدارة" (403) لو الموظف لسا مو مقبول
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
            <h2 style={{ fontWeight: '700' }}>تسجيل دخول الموظف</h2>
            <p>مرحباً بعودتك، يرجى إدخال بياناتك الوظيفية للوصول للمكتب الرقمي</p>
          </div>

          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <div className="input-group-custom">
              <label>البريد الإلكتروني الوظيفي</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@uni.edu" 
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

export default EmployeeLogin;