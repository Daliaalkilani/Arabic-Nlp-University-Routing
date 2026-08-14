import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OfficeDashboard.css';
import Toast from './Toast';
import ChatThread from './ChatThread';

const OfficeDashboard = () => {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem('user')) || {};
  
  const employeeName = storedUser.fullName || 'زميلنا العزيز';
  const employeeOffice = storedUser.office || 'Student Affairs'; 
  const employeeId = storedUser.employeeId || null;

  const [selectedOffice, setSelectedOffice] = useState(employeeOffice);
  const [queries, setQueries] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [activeQuery, setActiveQuery] = useState(null); 
  const [activeChatQuery, setActiveChatQuery] = useState(null); // المحادثة المفتوحة حالياً (أو null)
  const [targetOffice, setTargetOffice] = useState('');
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [officeDropdownOpen, setOfficeDropdownOpen] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  const officeNamesMapping = {
    'Student Affairs': 'شؤون الطلاب',
    'Exams': 'مكتب الامتحانات',
    'Financial Affairs': 'مكتب المالية',
    'IT Office': 'مكتب المعلوماتية'
  };

  // 🌟 نفس ألوان وأيقونات المكاتب المستخدمة بلوحة الأدمن — حتى تبقى الهوية موحّدة بكل الموقع
  const officeMeta = {
    'Student Affairs': { color: '#0d6efd', icon: 'bi-people-fill' },
    'Exams': { color: '#f59e0b', icon: 'bi-file-earmark-text-fill' },
    'Financial Affairs': { color: '#8b5cf6', icon: 'bi-cash-stack' },
    'IT Office': { color: '#10b981', icon: 'bi-cpu-fill' }
  };

  useEffect(() => {
    if (storedUser.office) {
      setSelectedOffice(storedUser.office);
    }
  }, [storedUser.office]);

  const fetchOfficeQueries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/queries/employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officeDept: selectedOffice }) 
      });
      const data = await response.json();
      if (response.ok) {
        // 🌟 تعرض هون المحادثات يلي لسا محتاجة انتباه الموظف (آخر رسالة فيها من الطالب)
        const pendingQueries = data.queries.filter(q => q.status === 'pending');
        setQueries(pendingQueries);
      } else {
        setToast({ type: 'error', message: data.message || 'تعذر جلب المحادثات' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'تعذر الاتصال بالسيرفر' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOffice) {
      fetchOfficeQueries();
    }
  }, [selectedOffice]);

  const handleRedirectQuery = async (e) => {
    e.preventDefault();
    if (!targetOffice) return;

    try {
      const response = await fetch('/api/queries/redirect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryId: activeQuery.id,
          newOffice: targetOffice 
        })
      });
      const data = await response.json();
      if (response.ok) {
        setToast({ type: 'success', message: data.message });
        setShowRedirectModal(false);
        setTargetOffice('');
        setOfficeDropdownOpen(false);
        fetchOfficeQueries();
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'حدث خطأ أثناء إعادة التوجيه!' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {activeChatQuery && (
        <ChatThread
          queryId={activeChatQuery.id}
          currentRole="employee"
          currentUserId={employeeId}
          onClose={() => { setActiveChatQuery(null); fetchOfficeQueries(); }}
          headerTitle={activeChatQuery.studentName}
          headerSubtitle={`${activeChatQuery.major || ''} — ${officeNamesMapping[selectedOffice] || selectedOffice}`}
        />
      )}

      <div className="admin-dash" dir="rtl">
      <aside className="admin-sidebar">
        <div className="brand">نظام إدارة المكاتب</div>
        
        <ul className="admin-nav">
          <li className={selectedOffice === 'Student Affairs' ? 'active disabled-nav-item' : 'disabled-nav-item'}>
            <i className="bi bi-people-fill"></i> شؤون الطلاب
          </li>
          <li className={selectedOffice === 'Exams' ? 'active disabled-nav-item' : 'disabled-nav-item'}>
            <i className="bi bi-file-earmark-ruled-fill"></i> مكتب الامتحانات
          </li>
          <li className={selectedOffice === 'Financial Affairs' ? 'active disabled-nav-item' : 'disabled-nav-item'}>
            <i className="bi bi-wallet2"></i> مكتب المالية
          </li>
          <li className={selectedOffice === 'IT Office' ? 'active disabled-nav-item' : 'disabled-nav-item'}>
            <i className="bi bi-pc-display-horizontal"></i> مكتب المعلوماتية
          </li>
        </ul>

        <div className="nav-item mt-auto logout-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <i className="bi bi-box-arrow-right"></i> <span>تسجيل الخروج</span>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-info">
            <h4>المحادثات الواردة: <span className="office-badge">{officeNamesMapping[selectedOffice] || selectedOffice}</span></h4>
            <p className="text-muted small">هذه المحادثات اقترح نموذج الذكاء الاصطناعي AraBERT توجيهها لمكتبكِ، وتبقى مراجعتها والرد عليها مسؤوليتكِ.</p>
          </div>
          <div className="user-profile">
            <i className="bi bi-person-circle me-2" style={{ color: '#0d6efd' }}></i>
            أهلاً، {employeeName} ({officeNamesMapping[selectedOffice] || selectedOffice})
          </div>
        </header>

        <div className="query-list">
          {loading ? (
            <div className="empty-state"><p>⏳ جاري جلب وتحديث قائمة المحادثات...</p></div>
          ) : queries.length > 0 ? (
            queries.map(query => (
              <div key={query.id} className="query-item">
                <div className="query-info">
                  <span className="student-name">
                    <i className="bi bi-person-fill me-1"></i> {query.studentName}
                    {query.major && <span className="student-major"> — {query.major}</span>}
                  </span>
                </div>
                <div className="query-text">
                  {query.lastSenderRole === 'employee' ? '👤 أنتِ: ' : '🙋 الطالب: '}
                  "{query.lastMessagePreview || query.queryText}"
                </div>
                <div className="query-actions">
                  <button className="reply-btn" onClick={() => setActiveChatQuery(query)}>
                    <i className="bi bi-chat-dots-fill"></i> فتح المحادثة ({query.messageCount})
                  </button>
                  <button className="archive-btn" onClick={() => { setActiveQuery(query); setShowRedirectModal(true); setOfficeDropdownOpen(false); setTargetOffice(''); }}>
                    <i className="bi bi-arrow-left-right"></i> تحويل لقسم آخر
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <i className="bi bi-check2-all fs-1 text-success"></i>
              <p>لا يوجد محادثات جديدة تحتاج ردكِ بهذا المكتب حالياً.</p>
            </div>
          )}
        </div>

        {showRedirectModal && activeQuery && (
          <div className="of-modal-overlay" onClick={() => setShowRedirectModal(false)}>
            <div className="of-modal-card" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="of-modal-close" onClick={() => setShowRedirectModal(false)}>&times;</button>

              <div className="of-modal-header">
                <div className="of-modal-icon of-modal-icon-redirect">
                  <i className="bi bi-signpost-split-fill"></i>
                </div>
                <div>
                  <h5>إعادة توجيه الاستفسار</h5>
                  <span className="of-modal-student">صمام الأمان لتصحيح خطأ توجيه الذكاء الاصطناعي</span>
                </div>
              </div>

              <form onSubmit={handleRedirectQuery}>
                <label className="of-field-label">المكتب المستهدف</label>

                {/* 🌟 قائمة منسدلة مخصّصة بألوان وأيقونات كل مكتب بدل select العادي */}
                <div className="of-office-picker">
                  <button
                    type="button"
                    className={`of-office-trigger ${officeDropdownOpen ? 'open' : ''}`}
                    onClick={() => setOfficeDropdownOpen((o) => !o)}
                  >
                    {targetOffice ? (
                      <span className="of-office-trigger-selected">
                        <span className="of-office-dot" style={{ background: officeMeta[targetOffice]?.color }}>
                          <i className={`bi ${officeMeta[targetOffice]?.icon}`}></i>
                        </span>
                        {officeNamesMapping[targetOffice]}
                      </span>
                    ) : (
                      <span className="of-office-placeholder">اختاري المكتب المستهدف...</span>
                    )}
                    <i className={`bi bi-chevron-down of-office-chevron ${officeDropdownOpen ? 'flipped' : ''}`}></i>
                  </button>

                  {officeDropdownOpen && (
                    <div className="of-office-menu">
                      {Object.keys(officeNamesMapping).filter(o => o !== selectedOffice).map(officeKey => (
                        <button
                          type="button"
                          key={officeKey}
                          className={`of-office-option ${targetOffice === officeKey ? 'selected' : ''}`}
                          onClick={() => { setTargetOffice(officeKey); setOfficeDropdownOpen(false); }}
                          style={{ '--office-color': officeMeta[officeKey]?.color }}
                        >
                          <span className="of-office-dot" style={{ background: officeMeta[officeKey]?.color }}>
                            <i className={`bi ${officeMeta[officeKey]?.icon}`}></i>
                          </span>
                          {officeNamesMapping[officeKey]}
                          {targetOffice === officeKey && <i className="bi bi-check-lg of-office-check"></i>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="of-modal-actions">
                  <button type="button" className="of-btn of-btn-ghost" onClick={() => setShowRedirectModal(false)}>
                    إلغاء
                  </button>
                  <button type="submit" className="of-btn of-btn-warning" disabled={!targetOffice}>
                    <i className="bi bi-arrow-left-right"></i> تأكيد النقل
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      </div>
    </>
  );
};

export default OfficeDashboard;
