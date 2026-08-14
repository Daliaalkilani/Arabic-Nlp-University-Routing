import React, { useState, useEffect, useRef } from 'react';
import './ChatThread.css';

// 🌟 عنوان صريح لسيرفر Flask، عشان الصور تحمّل صح حتى لو ما في proxy معرّف بـ Vite
const API_BASE = 'http://127.0.0.1:5000';

/**
 * 🌟 مكوّن محادثة مشترك بين الطالب والموظف (أسلوب واتساب)
 * props:
 *   queryId       -> معرّف المحادثة (QueryTask.id)
 *   currentRole   -> 'student' أو 'employee' (مين فاتح المحادثة هلق)
 *   currentUserId -> studentId أو employeeId الحالي
 *   onClose       -> دالة إغلاق المودال
 *   headerTitle   -> عنوان المودال (اسم الطرف التاني)
 *   headerSubtitle-> نص فرعي (المكتب أو التخصص...)
 */
const ChatThread = ({ queryId, currentRole, currentUserId, onClose, headerTitle, headerSubtitle }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/queries/${queryId}/messages`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (e) {
      // خطأ صامت بالتحديث التلقائي حتى ما نزعج المستخدم بكل مرة
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // 🌟 تحديث تلقائي خفيف كل 4 ثواني لإحساس محادثة حية بدون إعادة تحميل يدوية
    const interval = setInterval(() => fetchMessages(true), 4000);
    return () => clearInterval(interval);
  }, [queryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');

    if (!text.trim() && !image) return;

    setSending(true);
    const formData = new FormData();
    formData.append('senderRole', currentRole);
    formData.append('senderId', currentUserId);
    formData.append('text', text.trim());
    if (image) formData.append('image', image);

    try {
      const res = await fetch(`/api/queries/${queryId}/messages`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setText('');
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchMessages(true);
      } else {
        setError(data.message || 'تعذر إرسال الرسالة');
      }
    } catch (e) {
      setError('تعذر الاتصال بالسيرفر');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-card" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <button type="button" className="chat-close" onClick={onClose}>&times;</button>
          <div className="chat-header-avatar">
            <i className="bi bi-chat-dots-fill"></i>
          </div>
          <div>
            <h5>{headerTitle}</h5>
            {headerSubtitle && <span className="chat-header-sub">{headerSubtitle}</span>}
          </div>
        </div>

        <div className="chat-body">
          {loading ? (
            <div className="chat-empty">⏳ جاري تحميل المحادثة...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">لا توجد رسائل بعد.</div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`chat-bubble-row ${m.senderRole === currentRole ? 'mine' : 'theirs'}`}>
                <div className="chat-bubble">
                  {!m.text && !m.imageFile && null}
                  {m.senderRole !== currentRole && (
                    <span className="chat-bubble-sender">{m.senderName}</span>
                  )}
                  {m.imageFile && (
                    <a href={`${API_BASE}/uploads/${m.imageFile}`} target="_blank" rel="noopener noreferrer" className="chat-image-link">
                      <img src={`${API_BASE}/uploads/${m.imageFile}`} alt="مرفق" className="chat-image" />
                    </a>
                  )}
                  {m.text && <p>{m.text}</p>}
                  <span className="chat-bubble-time">{m.createdAt}</span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef}></div>
        </div>

        {error && <div className="chat-error">{error}</div>}

        <form className="chat-input-row" onSubmit={handleSend}>
          <label className="chat-attach-btn">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0] || null)}
            />
            <i className="bi bi-image-fill"></i>
          </label>

          <input
            type="text"
            className="chat-text-input"
            placeholder={image ? `${image.name} — اكتبي رسالة (اختياري)...` : 'اكتبي رسالتك هنا...'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button type="submit" className="chat-send-btn" disabled={sending || (!text.trim() && !image)}>
            <i className="bi bi-send-fill"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatThread;
