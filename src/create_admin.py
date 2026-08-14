"""
🌟 سكربت لمرة واحدة لإنشاء حساب الأدمن الأول
بما إن الأدمن ما بنبغي يكون عندو نموذج تسجيل عام بالموقع (لأسباب أمنية)،
هذا السكربت بينشئ حساب الأدمن مباشرة بقاعدة البيانات.

طريقة الاستخدام:
    python create_admin.py

تأكدي إنك تشغليه من نفس مجلد المشروع (وين موجود app.py)
"""

import sys
from app import app
from models import db, User, bcrypt

def create_admin(email, password):
    with app.app_context():
        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"⚠️  يوجد مستخدم بهذا البريد بالفعل: {email}")
            return

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_admin = User(email=email, password=hashed_password, role='admin')
        db.session.add(new_admin)
        db.session.commit()
        print(f"✅ تم إنشاء حساب الأدمن بنجاح! البريد: {email}")

if __name__ == '__main__':
    print("=== إنشاء حساب أدمن جديد ===")
    email = input("📧 البريد الإلكتروني للأدمن: ").strip()
    password = input("🔑 كلمة المرور: ").strip()

    if not email or not password:
        print("❌ يجب إدخال البريد وكلمة المرور!")
        sys.exit(1)

    create_admin(email, password)
