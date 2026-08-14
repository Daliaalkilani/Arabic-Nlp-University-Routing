import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import Toast from './Toast';

const API = 'http://127.0.0.1:5000';

const officeMeta = {
  'Student Affairs': { label: 'شؤون الطلاب', color: 'var(--office-students)' },
  'Exams': { label: 'مكتب الامتحانات', color: 'var(--office-exams)' },
  'Financial Affairs': { label: 'مكتب المالية', color: 'var(--office-finance)' },
  'IT Office': { label: 'مكتب المعلوماتية', color: 'var(--office-it)' },
};

const dayLabels = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

// ===== مخطط دائري لتوزيع الاستفسارات حسب القسم (يشابه المرجع) =====
const DeptDonut = ({ officeCounts }) => {
  const entries = Object.keys(officeMeta).map(key => ({
    key, label: officeMeta[key].label, color: officeMeta[key].color,
    value: officeCounts[key] || 0
  }));
  const realTotal = entries.reduce((sum, e) => sum + e.value, 0);
  const total = Math.max(1, realTotal); // 🌟 محمي من القسمة على صفر بالحسابات فقط، ما بينعرض
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="a-donut-wrap">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="#eef1f7" strokeWidth="24" />
        {entries.map((e, i) => {
          const fraction = e.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const rotation = (cumulative / total) * 360;
          cumulative += e.value;
          return (
            <circle
              key={i}
              cx="90" cy="90" r={radius} fill="none"
              stroke={e.color} strokeWidth="24"
              strokeDasharray={`${dash} ${gap}`}
              transform={`rotate(${rotation - 90} 90 90)`}
              style={{ transition: 'stroke-dasharray .6s ease' }}
            />
          );
        })}
        <text x="90" y="84" textAnchor="middle" fontSize="13" fill="var(--admin-muted)" fontWeight="700">إجمالي</text>
        <text x="90" y="106" textAnchor="middle" fontSize="24" fontWeight="800" fill="var(--admin-navy)">{realTotal}</text>
      </svg>
      <div className="a-donut-legend">
        {entries.map((e, i) => {
          const pct = Math.round((e.value / total) * 100);
          return (
            <div className="a-donut-legend-item" key={i}>
              <span className="a-gauge-dot" style={{ background: e.color }}></span>
              {e.label} <span className="count">{pct}% ({e.value})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===== مخطط خطي للاستفسارات اليومية (آخر 7 أيام) =====
const DailyLineChart = ({ dailyTrend }) => {
  const data = dailyTrend && dailyTrend.length ? dailyTrend : [...Array(7)].map(() => ({ date: '', count: 0 }));
  const max = Math.max(1, ...data.map(d => d.count));
  const W = 560, H = 170, padX = 24;
  const stepX = (W - padX * 2) / (data.length - 1 || 1);

  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = H - (d.count / max) * (H - 20) - 6;
    return { x, y, count: d.count, date: d.date };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg className="a-trend-svg" viewBox={`0 0 ${W} ${H + 30}`} preserveAspectRatio="xMidYMid meet">
      <path d={pathD} fill="none" stroke="var(--admin-blue)" strokeWidth="2.5" />
      {points.map((p, i) => {
        const d = p.date ? new Date(p.date) : null;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke="var(--admin-blue)" strokeWidth="2.5" />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--admin-navy)">{p.count}</text>
            <text x={p.x} y={H + 22} textAnchor="middle" fontSize="10.5" fill="var(--admin-muted)">
              {d ? dayLabels[d.getDay()] : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ===== كرت إحصائية ملوّن مع نسبة التغيير الشهري (يشابه المرجع) =====
const ColorStat = ({ color, icon, label, value, delta }) => {
  const up = delta >= 0;
  return (
    <div className="a-color-card" style={{ background: color }}>
      <div className="a-color-card-icon"><i className={`bi ${icon}`}></i></div>
      <div className="a-color-card-num">{value}</div>
      <div className="a-color-card-label">{label}</div>
      {typeof delta === 'number' && (
        <div className={`a-color-card-delta ${up ? 'up' : 'down'}`}>
          <i className={`bi ${up ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}`}></i>
          {Math.abs(delta)}% من الشهر الماضي
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem('user')) || { fullName: 'مدير النظام' };

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [queries, setQueries] = useState([]);
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [queryFilter, setQueryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/admin/stats`);
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (e) {
      console.error('خطأ أثناء جلب الإحصائيات:', e);
    }
  };

  const fetchQueries = async () => {
    try {
      const res = await fetch(`${API}/api/admin/queries`);
      const data = await res.json();
      if (res.ok) setQueries(data.queries || []);
    } catch (e) {
      console.error('خطأ أثناء جلب الاستفسارات:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/admin/users`);
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setEmployees(data.employees || []);
      }
    } catch (e) {
      console.error('خطأ أثناء جلب المستخدمين:', e);
    }
  };

  const fetchPendingEmployees = async () => {
    try {
      const res = await fetch(`${API}/api/admin/employees/pending`);
      const data = await res.json();
      if (res.ok) setPendingEmployees(data.employees || []);
    } catch (e) {
      console.error('خطأ أثناء جلب طلبات الموظفين:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchQueries(), fetchUsers(), fetchPendingEmployees()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueries();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteUser = async (type, id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${type}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        fetchUsers();
        fetchStats();
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'حدث خطأ أثناء الحذف!' });
    }
  };

  const handleApproveEmployee = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/employees/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        fetchPendingEmployees();
        fetchUsers();
        fetchStats();
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'حدث خطأ أثناء الموافقة!' });
    }
  };

  const handleRejectEmployee = async (id) => {
    if (!window.confirm('هل أنت متأكد من رفض وحذف هذا الطلب؟')) return;
    try {
      const res = await fetch(`${API}/api/admin/employees/${id}/reject`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        fetchPendingEmployees();
        fetchUsers();
        fetchStats();
      } else {
        setToast({ type: 'error', message: data.message });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'حدث خطأ أثناء الرفض!' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredQueries = queryFilter === 'all'
    ? queries
    : queries.filter(q => q.status === queryFilter);

  const officeCounts = stats?.officeCounts || {};
  const maxOfficeCount = Math.max(1, ...Object.values(officeCounts));

  const PRESSURE_LOW_MAX = 20;
  const PRESSURE_MID_MAX = 50;

  const pressureTag = (count) => {
    if (count <= PRESSURE_LOW_MAX) return { cls: 'a-pressure-low', text: '✅ ضغط منخفض' };
    if (count <= PRESSURE_MID_MAX) return { cls: 'a-pressure-mid', text: '⚠️ ضغط متوسط' };
    return { cls: 'a-pressure-high', text: '🔥 ضغط مرتفع' };
  };

  const deltas = stats?.deltas || {};

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="admin-shell" dir="rtl">
      <aside className="a-sidebar">
        <div className="a-brand">
          <i className="bi bi-grid-1x2-fill"></i>
          <span>إدارة النظام</span>
        </div>
        <ul className="a-nav">
          <li
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => { setActiveTab('overview'); fetchStats(); }}
          >
            <i className="bi bi-speedometer2"></i> نظرة عامة وإحصائيات
          </li>
          <li
            className={activeTab === 'queries' ? 'active' : ''}
            onClick={() => { setActiveTab('queries'); fetchQueries(); fetchStats(); }}
          >
            <i className="bi bi-chat-square-dots-fill"></i> إدارة الاستفسارات
          </li>
          <li
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => { setActiveTab('users'); fetchUsers(); fetchPendingEmployees(); }}
          >
            <i className="bi bi-people-fill"></i> إدارة المستخدمين
            {pendingEmployees.length > 0 && (
              <span className="a-nav-badge">{pendingEmployees.length}</span>
            )}
          </li>
        </ul>
        <div className="a-logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i> تسجيل الخروج
        </div>
      </aside>

      <main className="a-main">
        <div className="a-topbar">
          <div>
            <h2>أهلاً، {storedUser.fullName} 👋</h2>
            <p>هذه لوحة التحكم الكاملة لإدارة منصة الاستفسارات الذكية.</p>
          </div>
          <div className="a-admin-chip">
            <i className="bi bi-shield-lock-fill"></i> صلاحيات مدير النظام
          </div>
        </div>

        {loading ? (
          <div className="a-panel a-empty"><p>⏳ جاري تحميل البيانات...</p></div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="a-color-grid">
                  <ColorStat
                    color="linear-gradient(135deg,#2f6fed,#1d4fc4)"
                    icon="bi-chat-square-text-fill"
                    label="إجمالي الاستفسارات"
                    value={stats?.totalQueries ?? 0}
                    delta={deltas.total ?? 0}
                  />
                  <ColorStat
                    color="linear-gradient(135deg,#f59e0b,#d97706)"
                    icon="bi-hourglass-split"
                    label="لم يتم الرد"
                    value={stats?.pendingCount ?? 0}
                    delta={deltas.pending ?? 0}
                  />
                  <ColorStat
                    color="linear-gradient(135deg,#06b6d4,#0891b2)"
                    icon="bi-arrow-left-right"
                    label="أُعيد توجيهها يدوياً"
                    value={stats?.redirectedCount ?? 0}
                    delta={deltas.redirected ?? 0}
                  />
                  <ColorStat
                    color="linear-gradient(135deg,#10b981,#059669)"
                    icon="bi-check2-circle"
                    label="تم الرد عليها"
                    value={stats?.repliedCount ?? 0}
                    delta={deltas.replied ?? 0}
                  />
                </div>

                <div className="a-charts-row">
                  <div className="a-panel">
                    <div className="a-panel-head">
                      <h4>🥯 توزيع الاستفسارات حسب القسم</h4>
                    </div>
                    <DeptDonut officeCounts={officeCounts} />
                  </div>

                  <div className="a-panel">
                    <div className="a-panel-head">
                      <h4>📈 الاستفسارات اليومية</h4>
                      <span>آخر 7 أيام</span>
                    </div>
                    <DailyLineChart dailyTrend={stats?.dailyTrend} />
                  </div>
                </div>

                <div className="a-panel">
                  <div className="a-panel-head">
                    <h4>🌡️ مؤشر الضغط على المكاتب</h4>
                    <span>توزيع الاستفسارات حسب المكتب — لمعرفة أين الحمل أكبر حالياً</span>
                  </div>
                  {Object.keys(officeMeta).map((key) => {
                    const count = officeCounts[key] || 0;
                    const meta = officeMeta[key];
                    const pct = (count / maxOfficeCount) * 100;
                    const tag = pressureTag(count);
                    return (
                      <div className="a-gauge-row" key={key}>
                        <div className="a-gauge-label">
                          <span className="a-gauge-dot" style={{ background: meta.color }}></span>
                          {meta.label}
                        </div>
                        <div className="a-gauge-track">
                          <div className="a-gauge-fill" style={{ width: `${pct}%`, background: meta.color }}></div>
                        </div>
                        <div className="a-gauge-count">
                          {count} <small>استفسار</small>
                        </div>
                        <span className={`a-pressure-tag ${tag.cls}`}>{tag.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="a-panel">
                  <div className="a-panel-head">
                    <h4>🕓 آخر الاستفسارات</h4>
                    <span onClick={() => setActiveTab('queries')} style={{ cursor: 'pointer', color: 'var(--admin-blue)', fontWeight: 700 }}>
                      عرض الكل ←
                    </span>
                  </div>
                  {stats?.recentQueries?.length > 0 ? (
                    <div className="a-table-wrap">
                      <table className="a-table">
                        <thead>
                          <tr>
                            <th>المستخدم</th>
                            <th>القسم (AI)</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentQueries.map(q => (
                            <tr key={q.id}>
                              <td>{q.studentName}</td>
                              <td>
                                <span className="a-ai-tag">{officeMeta[q.officeDept]?.label || q.officeDept}</span>
                              </td>
                              <td>
                                <span className={`a-badge ${q.status}`}>
                                  {q.status === 'replied' ? '🟢 تم الرد' : '🟡 جديدة'}
                                </span>
                              </td>
                              <td>{q.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="a-empty"><i className="bi bi-inbox"></i>لا يوجد استفسارات حتى الآن.</div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'queries' && (
              <div className="a-panel">
                <div className="a-panel-head">
                  <h4>📋 جميع الاستفسارات في النظام</h4>
                  <span>{filteredQueries.length} استفسار</span>
                </div>
                <div className="a-tabs">
                  {[
                    { key: 'all', label: 'الكل' },
                    { key: 'pending', label: 'قيد الانتظار' },
                    { key: 'replied', label: 'تم الرد' },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`a-tab-btn ${queryFilter === f.key ? 'active' : ''}`}
                      onClick={() => setQueryFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {filteredQueries.length > 0 ? (
                  <div className="a-table-wrap">
                    <table className="a-table">
                      <thead>
                        <tr>
                          <th>الطالب</th>
                          <th>نص الاستفسار</th>
                          <th>المكتب الموجه إليه</th>
                          <th>الحالة</th>
                          <th>تصحيح يدوي؟</th>
                          <th>التاريخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQueries.map(q => (
                          <tr key={q.id}>
                            <td>{q.studentName}</td>
                            <td style={{ maxWidth: 280 }}>{q.queryText}</td>
                            <td>{officeMeta[q.officeDept]?.label || q.officeDept}</td>
                            <td>
                              <span className={`a-badge ${q.status}`}>
                                {q.status === 'replied' ? '🟢 تم الرد' : '🟡 معلق'}
                              </span>
                            </td>
                            <td>{q.isRedirected ? '🛡️ نعم' : '—'}</td>
                            <td>{q.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="a-empty">
                    <i className="bi bi-inbox"></i>
                    لا يوجد استفسارات مطابقة لهذا الفلتر.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <>
                <div className="a-panel">
                  <div className="a-panel-head">
                    <h4>🆕 طلبات تسجيل موظفين بانتظار الموافقة</h4>
                    <span>{pendingEmployees.length} طلب</span>
                  </div>
                  {pendingEmployees.length > 0 ? (
                    <div className="a-table-wrap">
                      <table className="a-table">
                        <thead>
                          <tr>
                            <th>الاسم الكامل</th>
                            <th>البريد الإلكتروني</th>
                            <th>المكتب</th>
                            <th>وثيقة التحقق</th>
                            <th>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingEmployees.map(e => (
                            <tr key={e.id}>
                              <td>{e.fullName}</td>
                              <td>{e.email}</td>
                              <td>{officeMeta[e.officeDept]?.label || e.officeDept}</td>
                              <td>
                                {e.verificationFile ? (
                                  <a href={`${API}/uploads/${e.verificationFile}`} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-file-earmark-text"></i> عرض الملف
                                  </a>
                                ) : '—'}
                              </td>
                              <td className="a-row-actions">
                                <button onClick={() => handleApproveEmployee(e.id)} style={{ color: '#15803d' }}>
                                  <i className="bi bi-check-circle-fill"></i> موافقة
                                </button>
                                <button className="danger" onClick={() => handleRejectEmployee(e.id)}>
                                  <i className="bi bi-x-circle-fill"></i> رفض
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="a-empty"><i className="bi bi-check2-all"></i>لا يوجد طلبات بانتظار الموافقة حالياً.</div>
                  )}
                </div>

                <div className="a-panel">
                  <div className="a-panel-head">
                    <h4>🎓 الطلاب المسجلون</h4>
                    <span>{students.length} طالب</span>
                  </div>
                  {students.length > 0 ? (
                    <div className="a-table-wrap">
                      <table className="a-table">
                        <thead>
                          <tr>
                            <th>الاسم الكامل</th>
                            <th>البريد الإلكتروني</th>
                            <th>التخصص</th>
                            <th>الرقم الجامعي</th>
                            <th>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(s => (
                            <tr key={s.id}>
                              <td>{s.fullName}</td>
                              <td>{s.email}</td>
                              <td>{s.major}</td>
                              <td>{s.universityId}</td>
                              <td className="a-row-actions">
                                <button className="danger" onClick={() => handleDeleteUser('student', s.id)}>
                                  <i className="bi bi-trash3-fill"></i> حذف
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="a-empty"><i className="bi bi-person-x"></i>لا يوجد طلاب مسجلون بعد.</div>
                  )}
                </div>

                <div className="a-panel">
                  <div className="a-panel-head">
                    <h4>🧑‍💼 الموظفون المفعّلون</h4>
                    <span>{employees.filter(e => e.isApproved).length} موظف</span>
                  </div>
                  {employees.filter(e => e.isApproved).length > 0 ? (
                    <div className="a-table-wrap">
                      <table className="a-table">
                        <thead>
                          <tr>
                            <th>الاسم الكامل</th>
                            <th>البريد الإلكتروني</th>
                            <th>المكتب</th>
                            <th>وثيقة التحقق</th>
                            <th>إجراءات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.filter(e => e.isApproved).map(e => (
                            <tr key={e.id}>
                              <td>{e.fullName}</td>
                              <td>{e.email}</td>
                              <td>{officeMeta[e.officeDept]?.label || e.officeDept}</td>
                              <td>
                                {e.verificationFile ? (
                                  <a href={`${API}/uploads/${e.verificationFile}`} target="_blank" rel="noopener noreferrer">
                                    <i className="bi bi-file-earmark-text"></i> عرض الملف
                                  </a>
                                ) : '—'}
                              </td>
                              <td className="a-row-actions">
                                <button className="danger" onClick={() => handleDeleteUser('employee', e.id)}>
                                  <i className="bi bi-trash3-fill"></i> حذف
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="a-empty"><i className="bi bi-person-x"></i>لا يوجد موظفون مفعّلون بعد.</div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
      </div>
    </>
  );
};

export default AdminDashboard;
