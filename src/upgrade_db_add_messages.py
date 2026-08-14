"""
🌟 سكربت ترقية لمرة واحدة: إضافة جدول messages لدعم المحادثة المفتوحة
بين الطالب والموظف (بدل استفسار واحد ورد واحد بس).

كمان بينقل تلقائياً كل الاستفسارات والردود القديمة الموجودة عندك حالياً
لتصير أول رسالتين بكل محادثة، حتى ما تضيع ولا محادثة قديمة.

طريقة الاستخدام:
    python upgrade_db_add_messages.py

شغليه من نفس مجلد university_portal.db، بعد ما توقفي تشغيل Flask.
"""

import sqlite3
from datetime import datetime

conn = sqlite3.connect('university_portal.db')
cur = conn.cursor()

# 1) إنشاء جدول الرسائل لو مش موجود
cur.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query_id INTEGER NOT NULL,
        sender_role VARCHAR(20) NOT NULL,
        sender_name VARCHAR(100) NOT NULL,
        text TEXT,
        image_file VARCHAR(250),
        created_at DATETIME NOT NULL,
        FOREIGN KEY (query_id) REFERENCES query_tasks (id)
    )
""")

# 2) نقل كل استفسار قديم عنده query_text ليصير أول رسالة بالمحادثة (لو ما انضافت قبل)
cur.execute("""
    SELECT qt.id, qt.query_text, qt.created_at, s.full_name
    FROM query_tasks qt
    JOIN student s ON s.id = qt.student_id
""")
old_queries = cur.fetchall()

migrated_first = 0
for query_id, query_text, created_at, student_name in old_queries:
    cur.execute("SELECT COUNT(*) FROM messages WHERE query_id = ?", (query_id,))
    if cur.fetchone()[0] == 0 and query_text:
        cur.execute(
            "INSERT INTO messages (query_id, sender_role, sender_name, text, created_at) VALUES (?, 'student', ?, ?, ?)",
            (query_id, student_name, query_text, created_at or datetime.utcnow().isoformat())
        )
        migrated_first += 1

# 3) نقل كل رد قديم (reply_text / reply_file) ليصير ثاني رسالة بالمحادثة
cur.execute("""
    SELECT qt.id, qt.reply_text, qt.reply_file, qt.created_at, e.full_name
    FROM query_tasks qt
    LEFT JOIN employee e ON e.id = qt.employee_id
    WHERE qt.reply_text IS NOT NULL OR qt.reply_file IS NOT NULL
""")
old_replies = cur.fetchall()

migrated_replies = 0
for query_id, reply_text, reply_file, created_at, employee_name in old_replies:
    cur.execute(
        "SELECT COUNT(*) FROM messages WHERE query_id = ? AND sender_role = 'employee'",
        (query_id,)
    )
    if cur.fetchone()[0] == 0:
        cur.execute(
            "INSERT INTO messages (query_id, sender_role, sender_name, text, image_file, created_at) VALUES (?, 'employee', ?, ?, ?, ?)",
            (query_id, employee_name or "الموظف المختص", reply_text, reply_file, created_at or datetime.utcnow().isoformat())
        )
        migrated_replies += 1

conn.commit()
conn.close()

print(f"✅ تم إنشاء جدول messages بنجاح!")
print(f"📨 تم نقل {migrated_first} استفسار قديم كأول رسالة بكل محادثة.")
print(f"📨 تم نقل {migrated_replies} رد قديم كثاني رسالة بكل محادثة.")
