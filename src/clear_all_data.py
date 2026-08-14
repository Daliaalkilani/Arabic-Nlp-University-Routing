"""
🌟 سكربت لمسح كل بيانات قاعدة البيانات والبدء من جديد
بيحافظ على:
  - بنية الجداول نفسها (ما بيحذف الجداول، بس البيانات جواها)
  - حسابات الأدمن (role='admin') — حتى ما تضطري تعيدي إنشاء حساب الأدمن من جديد

بيمسح بالكامل:
  - كل الطلاب والموظفين وحساباتهم
  - كل الاستفسارات (المحادثات) وكل الرسائل جواها
  - بيصفر عداد الـ ID لكل جدول ممسوح، فأول سجل جديد بيرجع يبلش من 1

⚠️ تحذير: هاد الإجراء نهائي وما فيه تراجع! تأكدي إنك ما محتاجة أي بيانات موجودة حالياً
قبل ما تشغلي هالسكربت (أو خدي نسخة احتياطية من ملف university_portal.db قبل).

طريقة الاستخدام:
    python clear_all_data.py

شغليه من نفس مجلد university_portal.db، بعد ما توقفي تشغيل Flask.
"""

import sqlite3

DB_PATH = 'university_portal.db'

print("=" * 60)
print("⚠️  تحذير: هالسكربت رح يمسح كل البيانات التالية نهائياً:")
print("   - كل حسابات الطلاب والموظفين")
print("   - كل الاستفسارات (المحادثات) وكل الرسائل جواها")
print("   ✅ حسابات الأدمن رح تبقى محفوظة")
print("=" * 60)
confirm = input("\nاكتبي 'نعم' بالضبط للمتابعة، أو أي شي تاني للإلغاء: ").strip()

if confirm != 'نعم':
    print("❌ تم إلغاء العملية، ما تغيّر أي شي.")
    exit()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# 1) مسح الرسائل أولاً (لأنها مرتبطة بالاستفسارات)
cur.execute("DELETE FROM messages")
messages_deleted = cur.rowcount

# 2) مسح الاستفسارات (المحادثات)
cur.execute("DELETE FROM query_tasks")
queries_deleted = cur.rowcount

# 3) مسح الموظفين
cur.execute("DELETE FROM employee")
employees_deleted = cur.rowcount

# 4) مسح الطلاب
cur.execute("DELETE FROM student")
students_deleted = cur.rowcount

# 5) مسح حسابات المستخدمين ما عدا الأدمن
cur.execute("DELETE FROM user WHERE role != 'admin'")
users_deleted = cur.rowcount

# 6) تصفير عداد الـ ID لكل جدول انمسح بالكامل (لو الجدول موجود أصلاً)
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'")
if cur.fetchone():
    for table in ('messages', 'query_tasks', 'employee', 'student'):
        cur.execute("DELETE FROM sqlite_sequence WHERE name = ?", (table,))

conn.commit()
conn.close()

print("\n✅ تم مسح البيانات بنجاح!")
print(f"   📨 رسائل محذوفة: {messages_deleted}")
print(f"   📋 استفسارات محذوفة: {queries_deleted}")
print(f"   👨‍💼 موظفين محذوفين: {employees_deleted}")
print(f"   🎓 طلاب محذوفين: {students_deleted}")
print(f"   👤 حسابات مستخدمين محذوفة: {users_deleted}")
print("\n💡 حسابات الأدمن بقيت محفوظة، وقاعدة البيانات جاهزة تستقبل بيانات جديدة من الصفر.")
