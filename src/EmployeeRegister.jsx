import React, { useState } from 'react';
import './Auth.css';
import Toast from './Toast';

const EmployeeRegister = ({ isOpen, onClose }) => {
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }
  const [fullName, setFullName] = useState('');
  const [office, setOffice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 1. متغير جديد لحفظ الملف المختار ومتغير لحفظ اسمه للواجهة
  const [verificationFile, setVerificationFile] = useState(null);
  const [fileName, setFileName] = useState('اختر ملفاً أو اسحبه إلى هنا');

  if (!isOpen) return null;

  const resetFields = () => {
    setFullName('');
    setOffice('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setVerificationFile(null);
    setFileName('اختر ملفاً أو اسحبه إلى هنا');
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  // 2. دالة التقاط الملف عند تحديده من الجهاز
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // التقاط أول ملف مختار
    if (file) {
      setVerificationFile(file);   // حفظ الملف الفعلي في الـ State
      setFileName(file.name);      // تحديث النص ليظهر اسم الملف للمستخدم
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من صيغة الإيميل الجامعي
    const emailPattern = /^[^\s@]+@uni\.edu$/i;
    if (!emailPattern.test(email)) {
      setToast({ type: 'error', message: 'البريد الإلكتروني يجب أن يكون بصيغة xxxxxx@uni.edu' });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ type: 'error', message: 'كلمات المرور غير متطابقة!' });
      return;
    }

    if (!verificationFile) {
      setToast({ type: 'error', message: 'الرجاء إرفاق وثيقة تأكيد الانتساب أولاً!' });
      return;
    }

    // ملاحظة ذكية: بما أننا نرسل ملفاً (صورة أو PDF)، لا يمكننا استخدام JSON عادي.
    // يجب أن نستخدم FormData وهو المعيار العالمي لرفع الملفات مع النصوص للسيرفر.
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('officeDept', office);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('verificationFile', verificationFile); // إرسال الملف الفعلي هنا

    try {
      const response = await fetch('http://127.0.0.1:5000/api/register/employee', {
        method: 'POST',
        body: formData, // نرسل الـ formData مباشرة بدون JSON.stringify وبدون Headers صلبة
      });

      const result = await response.json();

      if (response.ok) {
        setToast({ type: 'success', message: result.message });
        resetFields();
        setTimeout(onClose, 1800);
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
      <div className="auth-card register-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={handleClose}>&times;</button>
        
        <div className="auth-header">
          <i className="bi bi-person-plus-fill" style={{ color: '#0d6efd', fontSize: '65px' }}></i>
          <h2 style={{ fontWeight: '700' }}>حساب موظف جديد</h2>
          <p>يرجى إدخال بياناتك بدقة للانضمام للنظام</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div className="col-md-6">
              <div className="input-group-custom">
                <label>الاسم الكامل</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أدخل اسمك الثلاثي" 
                  required 
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group-custom">
                <label>المكتب التابع له</label>
                <select 
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  required
                >
                  <option value="">اختر المكتب...</option>
                  <option value="students">مكتب شؤون الطلاب</option>
                  <option value="exams">مكتب الامتحانات</option>
                  <option value="finance">مكتب المالية</option>
                  <option value="it">مكتب المعلوماتية</option>
                </select>
              </div>
            </div>
          </div>

          <div className="input-group-custom">
            <label>البريد الإلكتروني الجامعي</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@uni.edu" 
              required 
            />
          </div>

          <div className="row">
            <div className="col-md-6">
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
            </div>
            <div className="col-md-6">
              <div className="input-group-custom">
                <label>تأكيد كلمة المرور</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* تعديل حقل الرفع ليصبح تفاعلياً ويلقط الحركات */}
          <div className="input-group-custom">
            <label>وثيقة تأكيد الانتساب (ID أو قرار تعيين)</label>
            <div className="file-upload-wrapper">
              <input 
                type="file" 
                id="univ-doc" 
                hidden 
                onChange={handleFileChange} // ربط حدث الاختيار هنا
                accept="image/*,.pdf"       // تحديد أنواع الملفات المدعومة (صور أو pdf)
              />
              <label htmlFor="univ-doc" className="file-upload-label" style={{ cursor: 'pointer' }}>
                <i className="bi bi-cloud-arrow-up-fill" style={{ color: '#0d6efd' }}></i>
                {/* هنا يظهر اسم الملف تلقائياً بعد اختياره لإشعار المستخدم بالنجاح */}
                <span>{fileName}</span> 
              </label>
            </div>
          </div>

          <button type="submit" className="auth-btn" style={{ backgroundColor: '#0d6efd' }}>
            إنشاء الحساب
          </button>
        </form>

        <div className="auth-footer">
          <span>لديك حساب بالفعل؟</span>
          <a href="/login" style={{ color: '#0d6efd' }}>تسجيل الدخول</a>
        </div>
      </div>
      </div>
    </>
  );
};

export default EmployeeRegister;