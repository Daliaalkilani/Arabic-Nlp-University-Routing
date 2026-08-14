/*import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
*/
/*
import React from 'react'
import ReactDOM from 'react-dom/client'
import Register from './Register.jsx' // تأكدي أن هذا السطر موجود
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Register />
  </React.StrictMode>,
)
*/
/*
import React from 'react'
import ReactDOM from 'react-dom/client'
import Login from './Login.jsx' // استيراد صفحة تسجيل الدخول الجديدة
import './index.css' // التنسيقات العامة إذا كانت موجودة

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Login /> 
  </React.StrictMode>,
)
*/
/*
import React from 'react'
import ReactDOM from 'react-dom/client'
import StudentDash from './StudentDash.jsx' // استدعاء صفحة لوحة التحكم
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StudentDash /> 
  </React.StrictMode>,
)
*/

/*
import React from 'react'
import ReactDOM from 'react-dom/client'
// 1. استيراد الملف الجديد (تأكدي من المسار)
import OfficeDashboard from './OfficeDashboard' 
import './index.css' // أو ملف التنسيق العام

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  
    <OfficeDashboard /> 
  </React.StrictMode>,
)
  */
/*
import React from 'react'
import ReactDOM from 'react-dom/client'
// 1. استيراد صفحة إنشاء الحساب
import EmployeeRegister from './EmployeeRegister' 
// تأكدي من استيراد ملف التنسيق العام أو أيقونات بوتستراب إذا لم تكن مضافة
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  
    <EmployeeRegister /> 
  </React.StrictMode>,
)

*/
/*
import React from 'react'
import ReactDOM from 'react-dom/client'
// 1. استيراد صفحة تسجيل الدخول (تأكدي من صحة المسار)
import EmployeeLogin from './EmployeeLogin' 
import './index.css' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>

    <EmployeeLogin /> 
  </React.StrictMode>,
)
*/
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // استدعاء المكون الرئيسي الذي يحتوي على الأزرار والنوافذ
import './index.css'
import './darkMode.css' // 🌙 تنسيقات الوضع الليلي (لازم تنستورد بعد كل ملفات CSS التانية)

// تأكدي من استيراد مكتبة الـ Bootstrap إذا كنتِ تعتمدين عليها في التنسيقات العامة
import 'bootstrap/dist/css/bootstrap.min.css'

// 🌙 تفعيل الوضع الليلي فوراً قبل ما الموقع يترندر، حتى ما يصير "ومضة" بيضاء لحظة التحميل
const savedTheme = localStorage.getItem('theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
