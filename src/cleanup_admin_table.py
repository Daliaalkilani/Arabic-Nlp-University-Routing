python cleanup_admin_table.py"""
🌟 سكربت لمرة واحدة لحذف جدول "admin" الفاضي القديم (بقايا تجربة سابقة)
لا علاقة له بالكود الحالي، وحذفه آمن 100% ولن يؤثر على باقي البيانات.

طريقة الاستخدام:
    python cleanup_admin_table.py

شغليه من نفس مجلد university_portal.db
"""

import sqlite3

conn = sqlite3.connect('university_portal.db')
cur = conn.cursor()

cur.execute("DROP TABLE IF EXISTS admin")
conn.commit()
conn.close()

print("✅ تم حذف جدول admin الفاضي القديم بنجاح. باقي الجداول والبيانات لم تتأثر.")
