"""
🌟 سكربت ترقية لمرة واحدة: إضافة عمود is_approved لجدول employee الموجود
بدون فقدان أي بيانات حالية.

كل الموظفين الموجودين مسبقاً (المسجلين قبل هذا التحديث) سيتم اعتبارهم
"موافق عليهم" تلقائياً (is_approved = 1)، حتى لا تنقطع حساباتهم الحالية.
أي موظف جديد بعد اليوم سيكون افتراضياً "بانتظار الموافقة" (is_approved = 0).

طريقة الاستخدام:
    python upgrade_db_add_approval.py

شغليه من نفس مجلد university_portal.db، بعد ما توقفي تشغيل Flask.
"""

import sqlite3

conn = sqlite3.connect('university_portal.db')
cur = conn.cursor()

# تحقق إذا كان العمود موجود مسبقاً (لتجنب تكرار التنفيذ بالغلط)
cur.execute("PRAGMA table_info(employee)")
columns = [row[1] for row in cur.fetchall()]

if 'is_approved' in columns:
    print("⚠️ العمود is_approved موجود مسبقاً، لا حاجة لتشغيل السكربت مرة أخرى.")
else:
    cur.execute("ALTER TABLE employee ADD COLUMN is_approved BOOLEAN DEFAULT 0")
    # الموظفون المسجلون مسبقاً يعتبرون موافق عليهم تلقائياً
    cur.execute("UPDATE employee SET is_approved = 1")
    conn.commit()
    print("✅ تم تحديث قاعدة البيانات بنجاح! الموظفون الحاليون اعتُبروا موافَق عليهم تلقائياً.")

conn.close()
