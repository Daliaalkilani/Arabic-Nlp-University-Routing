import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import EmployeeLogin from './EmployeeLogin';
import EmployeeRegister from './EmployeeRegister';
import StudentLogin from './StudentLogin';
import StudentRegister from './StudentRegister';
import AdminLogin from './AdminLogin'; // نافذة دخول مدير النظام
import AboutPage from './AboutPage'; // صفحة "عن النظام" المستقلة
import ContactPage from './ContactPage'; // صفحة "تواصل معنا" المستقلة
import StudentDash from './StudentDash'; // لوحة تحكم الطالب الذكية
import OfficeDashboard from './OfficeDashboard'; // لوحة تحكم الموظف المخصصة (المكتب الرقمي)
import AdminDashboard from './AdminDashboard'; // لوحة تحكم مدير النظام الكاملة
import ThemeToggle from './ThemeToggle'; // 🌙 زر تبديل الوضع الليلي/النهاري

// 1. مكون التنقل المشترك (Navbar) — روابط حقيقية بدل نوافذ منبثقة
const Navbar = () => (
  <nav className="navbar navbar-expand-lg navbar-custom">
    <div className="container-fluid">
      <Link className="navbar-brand" to="/">
        <i className="bi bi-mortarboard-fill"></i> نظام معلومات الطلاب
      </Link>
      <button className="navbar-toggler bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto align-items-lg-center">
          <li className="nav-item"><Link className="nav-link" to="/">الرئيسية</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/about">عن النظام</Link></li>
          <li className="nav-item"><Link className="nav-link" to="/contact">تواصل معنا</Link></li>
        </ul>
      </div>
    </div>
  </nav>
);

// 2. مكون الصفحة الرئيسية (MainHome) مع الكروت والنوافذ المنبثقة
const MainHome = () => {
  // حالات التحكم في النوافذ المنبثقة للطالب والموظف
  const [empLoginOpen, setEmpLoginOpen] = useState(false);
  const [empRegOpen, setEmpRegOpen] = useState(false);
  const [stuLoginOpen, setStuLoginOpen] = useState(false);
  const [stuRegOpen, setStuRegOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false); // حالة نافذة دخول الأدمن

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="hero text-center py-5">
        <h1>مرحبًا بك في نظام معلومات الطلاب</h1>
        <p>
          نظام ذكي (AI) يساعد في تحليل استفسارات الطلاب وتسهيل توجيهها للمكاتب المختصة.
        </p>
      </section>

      {/* Cards Section — بطاقتين فقط: الطالب والموظف */}
      <div className="cards-container">
        {/* بطاقة الطالب */}
        <div className="card-box">
          <div className="card-icon"><i className="bi bi-person"></i></div>
          <h3>بوابة الطالب</h3>
          <p>الاطلاع على المعلومات الأكاديمية وإرسال الاستفسارات لتحليلها وتحديد المكتب المناسب لها.</p>
          
          <button 
            className="btn btn-primary btn-custom mb-3" 
            onClick={() => setStuLoginOpen(true)}
          >
            تسجيل دخول الطالب
          </button>
          
          <div className="auth-footer-text">
            <small>ليس لديك حساب؟</small>
            <button 
              className="btn-register-link" 
              onClick={() => setStuRegOpen(true)}
            >
              إنشاء حساب طالب جديد
            </button>
          </div>
        </div>

        {/* بطاقة الموظف */}
        <div className="card-box">
          <div className="card-icon"><i className="bi bi-briefcase"></i></div>
          <h3>بوابة الموظف</h3>
          <p>الوصول إلى لوحة التحكم الخاصة بالمكتب ومراجعة الاستفسارات والرد عليها رسمياً.</p>
          
          <button 
            className="btn btn-primary btn-custom mb-3" 
            onClick={() => setEmpLoginOpen(true)}
          >
            تسجيل دخول الموظف
          </button>
          
          <div className="auth-footer-text">
            <small>ليس لديك حساب?</small>
            <button 
              className="btn-register-link" 
              onClick={() => setEmpRegOpen(true)}
            >
              إنشاء حساب موظف جديد
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="features">
        <h2 className="text-center mb-4">مميزات النظام الذكي</h2>
        <div className="features-grid">
          <FeatureItem icon="bi-cpu" title="تحليل ذكي" desc="استخدام نماذج Transformers لتحليل الاستفسار واقتراح المكتب المناسب على الموظف." />
          <FeatureItem icon="bi-shield-lock" title="خصوصية وأمان" desc="حماية بيانات الطلاب بأعلى معايير التشفير." />
          <FeatureItem icon="bi-lightning-charge" title="سرعة الاستجابة" desc="تقليل وقت الانتظار من خلال الأتمتة الذكية." />
        </div>
      </section>

      {/* رابط دخول الإدارة - غير بارز عمداً، مخصص لمدير النظام فقط */}
      <div style={{ textAlign: 'center', margin: '10px 0 40px' }}>
        <button
          onClick={() => setAdminLoginOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.85rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          دخول الإدارة
        </button>
      </div>

      {/* استدعاء النوافذ المنبثقة (Modals) بالترتيب والألوان الزرقاء الموحدة */}
      <EmployeeLogin isOpen={empLoginOpen} onClose={() => setEmpLoginOpen(false)} />
      <EmployeeRegister isOpen={empRegOpen} onClose={() => setEmpRegOpen(false)} />
      <StudentLogin isOpen={stuLoginOpen} onClose={() => setStuLoginOpen(false)} />
      <StudentRegister isOpen={stuRegOpen} onClose={() => setStuRegOpen(false)} />
      <AdminLogin isOpen={adminLoginOpen} onClose={() => setAdminLoginOpen(false)} />
    </>
  );
};

// مكون فرعي للمميزات
const FeatureItem = ({ icon, title, desc }) => (
  <div className="feature-item">
    <div className="feature-circle"><i className={`bi ${icon}`}></i></div>
    <h5>{title}</h5>
    <p>{desc}</p>
  </div>
);

// 3. المكون الرئيسي والتوجيهي للمشروع بأكمله (App)
function App() {
  return (
    <div dir="rtl">
      {/* 🌙 زر عائم واحد للوضع الليلي/النهاري — ظاهر بكل صفحات الموقع تلقائياً */}
      <ThemeToggle />

      <Router>
        <Routes>
          {/* 1. مسار الصفحة الرئيسية للموقع */}
          <Route path="/" element={<MainHome />} />

          {/* صفحات مستقلة: عن النظام / تواصل معنا (بدل النوافذ المنبثقة) */}
          <Route path="/about" element={<><Navbar /><AboutPage /></>} />
          <Route path="/contact" element={<><Navbar /><ContactPage /></>} />
          
          {/* 2. مسار لوحة الاستفسارات الذكية الخاصة بالطالب */}
          <Route path="/dashboard" element={<StudentDash />} />
          
          {/* 3. مسار لوحة التحكم الخاصة بالموظف (المكتب الرقمي المقفل) */}
          <Route path="/employee-dashboard" element={<OfficeDashboard />} />

          {/* 4. مسار لوحة تحكم مدير النظام (الإدارة الكاملة) */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
