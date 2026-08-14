from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

# تعريف الكائنات الأساسية
db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    """جدول المستخدمين الأساسي (لإدارة تسجيل الدخول وحماية الحسابات)"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    # الطول 200 لأن تشفير Bcrypt ينتج نصاً هاش طويلاً جداً لحماية كلمة المرور
    password = db.Column(db.String(200), nullable=False) 
    role = db.Column(db.String(20), nullable=False) # يتضمن قيمتين فقط: 'student' أو 'employee'


class Student(db.Model):
    """جدول بيانات الطلاب الأكاديمية (مرتبط بجدول المستخدمين الأساسي)"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False) # الاسم الكامل للطالب
    major = db.Column(db.String(100), nullable=False)     # التخصص الدراسي (برمجيات، شبكات، إلخ)
    university_id = db.Column(db.String(50), unique=True, nullable=False) # الرقم الجامعي الفريد

    # علاقة عكسية اختيارية للوصول للمستخدم الأساسي من كائن الطالب بسهولة
    user = db.relationship('User', backref=db.backref('student_profile', uselist=False))


class Employee(db.Model):
    """جدول بيانات الموظفين الإدارية (مرتبط بجدول المستخدمين الأساسي)"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False) # الاسم الكامل للموظف
    office_dept = db.Column(db.String(100), nullable=False) # المكتب أو القسم (شؤون الطلاب، الامتحانات، المالية، المعلوماتية)
    verification_file = db.Column(db.String(200)) # اسم أو مسار ملف وثيقة التحقق المرفوعة

    # 🌟 هل وافقت الإدارة على هذا الحساب؟ (False = بانتظار المراجعة من الأدمن)
    is_approved = db.Column(db.Boolean, default=False, nullable=False)

    # علاقة عكسية اختيارية للوصول للمستخدم الأساسي من كائن الموظف بسهولة
    user = db.relationship('User', backref=db.backref('employee_profile', uselist=False))


class QueryTask(db.Model):
    """
    🌟 جدول الاستفسارات والطلبات المطور والذكي
    يقوم بتنظيم وإدارة الاستفسارات الموجهة للمكاتب بواسطة نموذج الذكاء الاصطناعي
    """
    __tablename__ = 'query_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # ربط الاستفسار بالطالب الذي أرسله (باستخدام معرف جدول Student الأكاديمي)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    
    # القسم أو المكتب الموجه إليه الاستفسار (يتم تحديثه بناءً على تصنيف الـ NLP أو تعديل الموظف)
    office_dept = db.Column(db.String(100), nullable=False)
    
    # نص الاستفسار المرسل من الطالب
    query_text = db.Column(db.Text, nullable=False)
    
    # نص الرد الرسمي من الموظف المختص
    reply_text = db.Column(db.Text, nullable=True)
    
    # 🌟 [حقل جديد]: اسم أو مسار ملف المرفق (صورة أو مستند PDF) الذي يرسله الموظف مع الرد للطلب
    reply_file = db.Column(db.String(250), nullable=True)
    
    # ربط الاستفسار بالموظف الذي قام بكتابة الرد (يكون فارغاً Null حتى يقوم موظف بالرد)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=True)
    
    # حالة الطلب في النظام: 'pending' (معلق) أو 'replied' (تم الرد عليه)
    status = db.Column(db.String(50), default='pending', nullable=False)
    
    # 🌟 [حقل جديد]: صمام الأمان لمعرفة إذا تم تعديل التوجيه يدوياً بسبب خطأ الذكاء الاصطناعي
    is_redirected = db.Column(db.Boolean, default=False, nullable=False)
    
    # توقيت تسجيل وإرسال الاستفسار تلقائياً
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    # 🔗 علاقات ربط قواعد البيانات لتسهيل عمليات الاستعلام (Queries)
    student = db.relationship('Student', backref=db.backref('queries', lazy=True))
    employee = db.relationship('Employee', backref=db.backref('replies', lazy=True))


class Message(db.Model):
    """
    🌟 جدول رسائل المحادثة — يخلي كل استفسار (QueryTask) محادثة مفتوحة
    فيها أكتر من رسالة برد الاتجاهين (طالب ↔ موظف)، بدل رد واحد بس
    """
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)

    # ربط الرسالة بالمحادثة (الاستفسار) يلي تنتمي إلها
    query_id = db.Column(db.Integer, db.ForeignKey('query_tasks.id'), nullable=False)

    # مين المرسل: 'student' أو 'employee'
    sender_role = db.Column(db.String(20), nullable=False)

    # اسم المرسل (نخزنه مباشرة لسهولة العرض بدون جوين إضافي)
    sender_name = db.Column(db.String(100), nullable=False)

    # نص الرسالة (اختياري لو الرسالة صورة بس بدون نص)
    text = db.Column(db.Text, nullable=True)

    # 🌟 مسار صورة مرفقة مع الرسالة (اختياري)
    image_file = db.Column(db.String(250), nullable=True)

    created_at = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    query_task = db.relationship('QueryTask', backref=db.backref('messages', lazy=True, order_by='Message.created_at'))