import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDash.css';
import Toast from './Toast';
import ChatThread from './ChatThread';

const StudentDash = () => {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem('user')) || { fullName: 'الطالب', studentId: null };
  
  const [activeTab, setActiveTab] = useState('ask');
  const [queryText, setQueryText] = useState('');
  const [queryImage, setQueryImage] = useState(null);
  const [historyQueries, setHistoryQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null); // معرّف المحادثة المفتوحة حالياً (أو null)

  // 🌟 حالات اختيار نوع الاستفسار: طلب خدمة (المسار القديم) أو استفسار عن اللوائح والأنظمة (QA مباشر)
  const [inquiryType, setInquiryType] = useState(null); // null | 'service' | 'regulation'
  const [regulationQuestion, setRegulationQuestion] = useState('');
  const [regulationLoading, setRegulationLoading] = useState(false);
  const [regulationAnswer, setRegulationAnswer] = useState(null); // { officeDept, answer } | null

  // 🌟 حالات صفحة "الإعدادات" (الملف الشخصي + تغيير كلمة المرور)
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  const officeNamesMapping = {
    'Student Affairs': 'شؤون الطلاب',
    'Exams': 'مكتب الامتحانات',
    'Financial Affairs': 'مكتب المالية',
    'IT Office': 'مكتب المعلوماتية'
  };

  const fetchStudentHistory = async () => {
    if (!storedUser.studentId) return;
    try {
      const res = await fetch(`/api/queries/student/${storedUser.studentId}`);
      const data = await res.json();
      if (res.ok) {
        setHistoryQueries(data.queries || []);
      } else {
        setToast({ type: 'error', message: data.message || 'تعذر جلب سجل الاستفسارات' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'تعذر الاتصال بالسيرفر لجلب سجل الاستفسارات' });
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchStudentHistory();
    }
    if (activeTab === 'settings') {
      fetchProfile();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    if (!storedUser.studentId) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/student/profile/${storedUser.studentId}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'تعذر جلب بيانات الملف الشخصي، تأكدي من تشغيل السيرفر' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setToast({ type: 'error', message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين!' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: storedUser.studentId,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'حدث خطأ أثناء تغيير كلمة المرور، تأكدي من تشغيل السيرفر' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!queryText.trim()) {
      setToast({ type: 'error', message: 'الرجاء كتابة استفسارك أولاً!' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('studentId', storedUser.studentId);
    formData.append('queryText', queryText);
    if (queryImage) formData.append('image', queryImage);

    try {
      const response = await fetch('/api/queries/add', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        const englishDept = data.predictedDept;
        const arabicDept = officeNamesMapping[englishDept] || englishDept;

        setToast({ type: 'success', message: `تم تحليل استفسارك بنجاح، واقتُرح إرساله إلى: ${arabicDept}. سيقوم الموظف المختص بمراجعته والرد عليك.` });
        setQueryText('');
        setQueryImage(null);
        setActiveTab('history'); 
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'تعذر الاتصال بالسيرفر، تأكدي من أن مشروع الـ Flask يعمل بنجاح!' });
    } finally {
      setLoading(false);
    }
  };

  const handleAskRegulation = async (e) => {
    e.preventDefault();
    if (!regulationQuestion.trim()) {
      setToast({ type: 'error', message: 'الرجاء كتابة استفسارك أولاً!' });
      return;
    }

    setRegulationLoading(true);
    setRegulationAnswer(null);

    try {
      const response = await fetch('/api/queries/ask-regulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText: regulationQuestion })
      });

      const data = await response.json();
      if (response.ok) {
        setRegulationAnswer({ officeDept: data.officeDept, answer: data.answer });
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'تعذر الاتصال بالسيرفر، تأكدي من أن مشروع الـ Flask يعمل بنجاح!' });
    } finally {
      setRegulationLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      {activeChatId && (
        <ChatThread
          queryId={activeChatId}
          currentRole="student"
          currentUserId={storedUser.studentId}
          onClose={() => { setActiveChatId(null); fetchStudentHistory(); }}
          headerTitle={officeNamesMapping[historyQueries.find(q => q.id === activeChatId)?.officeDept] || 'المكتب المختص'}
          headerSubtitle="محادثتك مع الموظف المختص"
        />
      )}
      <div className="dash-container" dir="rtl">
      <aside className="sidebar">
        <div className="sidebar-header">
          <i className="bi bi-robot"></i>
          <span className="portal-brand">بوابة الطالب</span>
        </div>
        <ul className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'ask' ? 'active' : ''}`} 
            onClick={() => setActiveTab('ask')}
            style={{cursor: 'pointer'}}
          >
            <i className="bi bi-chat-square-text-fill"></i> <span>اسأل الروبوت</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} 
            onClick={() => setActiveTab('history')}
            style={{cursor: 'pointer'}}
          >
            <i className="bi bi-collection-fill"></i> <span>سجل الاستفسارات</span>
          </li>
          <li 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('settings')}
            style={{cursor: 'pointer'}}
          >
            <i className="bi bi-gear-fill"></i> <span>الإعدادات</span>
          </li>
        </ul>
        
        <div 
          className="nav-item mt-auto text-danger" 
          style={{borderTop: '1px solid #f1f5f9', paddingTop: '20px', cursor: 'pointer'}}
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i> <span>تسجيل الخروج</span>
        </div>
      </aside>

      <main className="main-content">
        <div className="glass-header">
          <div className="text-content">
            <h1 className="fw-bold">أهلاً بك، {storedUser.fullName}  ✨</h1>
            <p>اكتب استفسارك وسيتم توجيهه إلى المكتب المختص للرد عليه.</p>
          </div>
          <div className="robot-img-container">
            <img 
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png" 
              alt="AI Assistant" 
            />
          </div>
        </div>

        {activeTab === 'ask' && (
          <section className="query-section">
            {inquiryType === null && (
              <>
                <h4 className="fw-bold">بماذا يمكنني مساعدتك اليوم؟</h4>
                <div className="inquiry-choice-grid">
                  <button className="inquiry-choice-btn" onClick={() => setInquiryType('service')}>
                    <i className="bi bi-headset"></i>
                    <span>طلب خدمة</span>
                    <small>سيتم تحليل استفسارك وتوجيهه إلى الموظف المختص للرد عليه</small>
                  </button>
                  <button className="inquiry-choice-btn" onClick={() => setInquiryType('regulation')}>
                    <i className="bi bi-journal-text"></i>
                    <span>استفسار عن اللوائح والأنظمة</span>
                    <small>ستحصل على إجابة فورية من النظام دون الحاجة لانتظار الموظف</small>
                  </button>
                </div>
              </>
            )}

            {inquiryType === 'service' && (
              <>
                <button className="inquiry-back-btn" onClick={() => setInquiryType(null)}>
                  <i className="bi bi-arrow-right"></i> رجوع
                </button>
                <h4 className="fw-bold">بماذا يمكنني مساعدتك اليوم؟</h4>
                <div className="input-wrapper">
                  <textarea
                    placeholder="اكتب سؤالك هنا بالتفصيل، وسيقوم النظام بتحليله واقتراح المكتب المناسب له ليتولى الموظف المختص مراجعته والرد عليك..."
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    disabled={loading}
                  ></textarea>

                  <div className="action-bar">
                    <div className="upload-options">
                      <label className="upload-button">
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => setQueryImage(e.target.files[0] || null)}
                        />
                        <i className="bi bi-image-fill"></i>
                        <span>{queryImage ? queryImage.name : 'إرفاق صورة'}</span>
                      </label>
                    </div>

                    <button className="send-btn" onClick={handleSendQuery} disabled={loading}>
                      {loading ? 'جاري التحليل ذكياً...' : 'إرسال الطلب'}
                      <i className="bi bi-send-check-fill ms-2"></i>
                    </button>
                  </div>
                </div>
              </>
            )}

            {inquiryType === 'regulation' && (
              <>
                <button
                  className="inquiry-back-btn"
                  onClick={() => { setInquiryType(null); setRegulationAnswer(null); }}
                >
                  <i className="bi bi-arrow-right"></i> رجوع
                </button>
                <h4 className="fw-bold">استفسار عن اللوائح والأنظمة</h4>
                <div className="input-wrapper">
                  <textarea
                    placeholder="اكتب استفسارك عن اللوائح والأنظمة الجامعية، وسيقوم النظام بالإجابة عليك مباشرة..."
                    value={regulationQuestion}
                    onChange={(e) => setRegulationQuestion(e.target.value)}
                    disabled={regulationLoading}
                  ></textarea>

                  <div className="action-bar">
                    <div></div>
                    <button className="send-btn" onClick={handleAskRegulation} disabled={regulationLoading}>
                      {regulationLoading ? 'جاري البحث عن الإجابة...' : 'إرسال الاستفسار'}
                      <i className="bi bi-send-check-fill ms-2"></i>
                    </button>
                  </div>
                </div>

                {regulationAnswer && (
                  <div className="qa-answer-card">
                    <span className="conv-office-badge">
                      📍 {officeNamesMapping[regulationAnswer.officeDept] || regulationAnswer.officeDept}
                    </span>
                    <p className="qa-answer-text">{regulationAnswer.answer}</p>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'history' && (
          <section className="history-section mt-4">
            <h4 className="fw-bold mb-3">📋 محادثاتك مع المكاتب المختصة</h4>
            <div className="query-history-list">
              {historyQueries.length > 0 ? (
                historyQueries.map((item) => (
                  <div
                    key={item.id}
                    className="conv-card"
                    onClick={() => setActiveChatId(item.id)}
                  >
                    <div className="conv-card-icon">
                      <i className="bi bi-chat-dots-fill"></i>
                      {item.status === 'pending' && item.lastSenderRole === 'employee' && (
                        <span className="conv-dot"></span>
                      )}
                    </div>
                    <div className="conv-card-body">
                      <div className="conv-card-top">
                        <span className="conv-office-badge">📍 {officeNamesMapping[item.officeDept] || item.officeDept}</span>
                        <span className={`conv-status-badge ${item.status === 'replied' ? 'replied' : 'pending'}`}>
                          {item.status === 'replied' ? '🟢 بانتظار ردك' : '🟡 قيد المتابعة'}
                        </span>
                      </div>
                      <p className="conv-preview">
                        {item.lastSenderRole === 'employee' ? '👤 الموظف: ' : '🙋‍♀️ أنتِ: '}
                        {item.lastMessagePreview || item.queryText}
                      </p>
                      <span className="conv-count">{item.messageCount} رسالة بالمحادثة</span>
                    </div>
                    <i className="bi bi-chevron-left conv-arrow"></i>
                  </div>
                ))
              ) : (
                <div className="text-center py-5 text-muted" style={{background: '#ffffff', borderRadius: '20px'}}>
                  <i className="bi bi-folder-x fs-1 text-secondary d-block mb-2"></i>
                  لا يوجد لديك استفسارات مسجلة في النظام حالياً.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="settings-section">
            <h4 className="fw-bold mb-1">⚙️ الإعدادات</h4>
            <p className="text-muted mb-4 settings-subtitle">بيانات حسابك وإدارة كلمة المرور</p>

            <div className="settings-card">
              <h5 className="settings-card-title"><i className="bi bi-person-badge-fill"></i> الملف الشخصي</h5>
              {profileLoading ? (
                <p className="text-muted">⏳ جاري تحميل بياناتك...</p>
              ) : profile ? (
                <div className="profile-grid">
                  <div className="profile-field">
                    <span className="profile-label">الاسم الكامل</span>
                    <span className="profile-value">{profile.fullName}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">التخصص</span>
                    <span className="profile-value">{profile.major}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">الرقم الجامعي</span>
                    <span className="profile-value">{profile.universityId}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-label">البريد الإلكتروني</span>
                    <span className="profile-value">{profile.email}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted">تعذر عرض بيانات الملف الشخصي.</p>
              )}
            </div>

            <div className="settings-card">
              <h5 className="settings-card-title"><i className="bi bi-shield-lock-fill"></i> تغيير كلمة المرور</h5>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="password-field">
                  <label>كلمة المرور الحالية</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="password-field">
                  <label>كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="password-field">
                  <label>تأكيد كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button type="submit" className="password-save-btn" disabled={passwordSaving}>
                  {passwordSaving ? 'جاري الحفظ...' : (<><i className="bi bi-check-circle-fill"></i> حفظ كلمة المرور</>)}
                </button>
              </form>
            </div>
          </section>
        )}

        <div className="mt-4 p-3 d-flex align-items-center gap-3" style={{background: '#ffffff', borderRadius: '20px', border: '1px solid #edf2f7'}}>
          <i className="bi bi-shield-check text-success fs-4"></i>
          <span className="text-muted fs-6">استفسارك محمي ومشفر، وسيتم الرد عليه من قبل القسم المختص بعد مراجعته من الموظف المسؤول.</span>
        </div>
      </main>
      </div>
    </>
  );
};

export default StudentDash;
