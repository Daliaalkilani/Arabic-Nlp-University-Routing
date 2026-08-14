import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import Toast from './Toast';

const StudentRegister = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  // 1. تعريف المتغيرات (States) لتخزين البيانات من الحقول
  const [fullName, setFullName] = useState('');
  const [major, setMajor] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  if (!isOpen) return null;

  // دالة لتنظيف الحقول (تصفيرها)
  const resetFields = () => {
    setFullName('');
    setMajor('');
    setUniversityId('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // 2. دالة إرسال البيانات للسيرفر
  const handleRegister = async (e) => {
    e.preventDefault();

    // التحقق من صيغة الإيميل الجامعي
    const emailPattern = /^[^\s@]+@uni\.edu$/i;
    if (!emailPattern.test(email)) {
      setToast({ type: 'error', message: 'البريد الإلكتروني يجب أن يكون بصيغة xxxxxx@uni.edu' });
      return;
    }

    // التحقق من تطابق كلمات المرور
    if (password !== confirmPassword) {
      setToast({ type: 'error', message: 'كلمات المرور غير متطابقة!' });
      return;
    }

    const studentData = {
      fullName: fullName,
      major: major,
      universityId: universityId,
      email: email,
      password: password
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (response.ok) {
        // 🌟 (البند 5) تسجيل دخول تلقائي بنفس البيانات بعد نجاح إنشاء الحساب.
        // واجهة إنشاء الحساب لا تُعيد توكناً، لذلك نستدعي واجهة تسجيل الدخول تلقائياً.
        try {
          const loginResponse = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const loginResult = await loginResponse.json();

          if (loginResponse.ok && loginResult.user) {
            // تخزين الجلسة بنفس مفتاح وآلية تسجيل الدخول العادي حتى تتطابق حالة المستخدم
            localStorage.setItem('user', JSON.stringify(loginResult.user));

            const studentName = loginResult.user.fullName || fullName || 'الطالب';
            setToast({ type: 'success', message: `مرحباً، ${studentName}` });
            resetFields();

            // الانتقال المباشر إلى لوحة الاستفسارات دون الحاجة لتسجيل الدخول يدوياً
            setTimeout(() => {
              onClose();
              navigate('/dashboard');
            }, 1800);
          } else {
            // فشل الدخول التلقائي → توجيه المستخدم لتسجيل الدخول يدوياً مع إبلاغه بنجاح الإنشاء
            setToast({ type: 'error', message: 'تم إنشاء حسابك بنجاح، يرجى تسجيل الدخول للمتابعة.' });
            resetFields();
            setTimeout(onClose, 2200);
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          setToast({ type: 'error', message: 'تم إنشاء حسابك بنجاح، يرجى تسجيل الدخول للمتابعة.' });
          resetFields();
          setTimeout(onClose, 2200);
        }
      } else {
        setToast({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error("Error:", error);
      setToast({ type: 'error', message: 'حدث خطأ في الاتصال بالسيرفر، تأكد من تشغيل Flask' });
    }
  };

  // دالة إغلاق مخصصة تضمن تصفير الحقول حتى لو أغلقنا النافذة دون تسجيل
  const handleClose = () => {
    resetFields();
    onClose();
  };

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="modal-overlay" onClick={handleClose}>
      <div className="auth-card register-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={handleClose}>&times;</button>
        <div className="auth-header" style={{textAlign: 'center', marginBottom: '30px'}}>
          <i className="bi bi-person-plus-fill" style={{fontSize: '50px', color: '#0d6efd'}}></i>
          <h2 style={{fontWeight: '700'}}>حساب طالب جديد</h2>
        </div>

        <form onSubmit={handleRegister} noValidate>
          <div style={{display: 'flex', gap: '15px'}}>
            <div style={{flex: 1}} className="input-group-custom">
              <label>الاسم الكامل</label>
              <input 
                type="text" 
                placeholder="الاسم كما في الهوية" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required 
              />
            </div>
            <div style={{flex: 1}} className="input-group-custom">
              <label>الكلية / التخصص</label>
              <input 
                type="text" 
                placeholder="مثال: هندسة البرمجيات" 
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required 
              />
            </div>
          </div>

          <div style={{display: 'flex', gap: '15px'}}>
            <div style={{flex: 1}} className="input-group-custom">
              <label>الرقم الجامعي</label>
              <input 
                type="text" 
                placeholder="ID الخاص بك" 
                value={universityId}
                onChange={(e) => setUniversityId(e.target.value)}
                required 
              />
            </div>
            <div style={{flex: 1}} className="input-group-custom">
              <label>البريد الإلكتروني</label>
              <input 
                type="text" 
                placeholder="student@uni.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div style={{display: 'flex', gap: '15px'}}>
            <div style={{flex: 1}} className="input-group-custom">
              <label>كلمة المرور</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <div style={{flex: 1}} className="input-group-custom">
              <label>تأكيد الكلمة</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="auth-btn">إنشاء حسابي</button>
        </form>
      </div>
      </div>
    </>
  );
};

export default StudentRegister;