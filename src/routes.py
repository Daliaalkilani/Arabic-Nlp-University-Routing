import os
import re
from flask import request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
# استيراد الجداول الحقيقية من ملف الموديلات
from models import db, User, Student, Employee, QueryTask, Message, bcrypt

# 🌟 نمط التحقق من الإيميل: لازم ينتهي حصراً بـ @uni.edu
EMAIL_PATTERN = re.compile(r'^[^\s@]+@uni\.edu$', re.IGNORECASE)

# تحديد مجلد لحفظ الملفات المرفوعة من الموظفين (الردود والمستندات)
UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    """دالة للتأكد من أن نوع الملف المرفوع مسموح به (صور أو PDF)"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_routes(app):

    # ---------------------------------------------------
    # 0. مسار عرض/تحميل الملفات المرفوعة (وثائق التحقق للموظفين + مرفقات الردود)
    # ---------------------------------------------------
    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        return send_from_directory(UPLOAD_FOLDER, filename)

    # ---------------------------------------------------
    # 1. مسار تسجيل حساب طالب جديد
    # ---------------------------------------------------
    @app.route('/api/register/student', methods=['POST'])
    def register_student():
        data = request.json
        if not EMAIL_PATTERN.match(data.get('email', '')):
            return jsonify({"message": "البريد الإلكتروني يجب أن يكون بصيغة xxxxxx@uni.edu"}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({"message": "هذا البريد الإلكتروني مسجل بالفعل!"}), 400

        if Student.query.filter_by(university_id=data['universityId']).first():
            return jsonify({"message": "هذا الرقم الجامعي مسجل بالفعل بحساب آخر!"}), 400

        try:
            hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
            new_user = User(email=data['email'], password=hashed_password, role='student')
            db.session.add(new_user)
            db.session.flush()

            new_student = Student(
                user_id=new_user.id,
                full_name=data['fullName'],
                major=data['major'],
                university_id=data['universityId']
            )
            db.session.add(new_student)
            db.session.commit()
            return jsonify({"message": "تم إنشاء حساب الطالب بنجاح!"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء التسجيل: {str(e)}"}), 500

    # ---------------------------------------------------
    # 2. مسار تسجيل حساب موظف جديد
    # ---------------------------------------------------
    @app.route('/api/register/employee', methods=['POST'])
    def register_employee():
        fullName = request.form.get('fullName')
        officeDept = request.form.get('officeDept')
        email = request.form.get('email')
        password = request.form.get('password')

        if not EMAIL_PATTERN.match(email or ''):
            return jsonify({"message": "البريد الإلكتروني يجب أن يكون بصيغة xxxxxx@uni.edu"}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({"message": "هذا البريد الإلكتروني مسجل بالفعل!"}), 400

        if 'verificationFile' not in request.files:
            return jsonify({"message": "الرجاء إرفاق وثيقة تأكيد الانتساب!"}), 400
            
        file = request.files['verificationFile']
        if file.filename == '':
            return jsonify({"message": "لم يتم اختيار أي ملف!"}), 400

        try:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{email.replace('@', '_').replace('.', '_')}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
            else:
                return jsonify({"message": "نوع الملف غير مدعوم! الرجاء رفع صورة أو ملف PDF"}), 400

            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
            new_user = User(email=email, password=hashed_password, role='employee')
            db.session.add(new_user)
            db.session.flush()

            new_employee = Employee(
                user_id=new_user.id,
                full_name=fullName,
                office_dept=officeDept,
                verification_file=unique_filename,
                is_approved=False  # 🌟 بانتظار موافقة الأدمن
            )
            db.session.add(new_employee)
            db.session.commit()
            return jsonify({"message": "تم إنشاء حسابك بنجاح! سيتم تفعيله بعد موافقة الإدارة، سنخبرك عند الموافقة."}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء تسجيل الموظف: {str(e)}"}), 500

    # ---------------------------------------------------
    # 3. مسار تسجيل الدخول (Login) للطرفين
    # ---------------------------------------------------
    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.json
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()

        if user and bcrypt.check_password_hash(user.password, password):
            user_info = {"role": user.role, "email": user.email}
            
            if user.role == 'student':
                student_details = Student.query.filter_by(user_id=user.id).first()
                if student_details:
                    user_info["fullName"] = student_details.full_name
                    user_info["studentId"] = student_details.id # إرسال الـ ID لربط الأسئلة به
            
            elif user.role == 'employee':
                employee_details = Employee.query.filter_by(user_id=user.id).first()
                if employee_details:
                    # 🌟 منع دخول الموظف قبل موافقة الأدمن على حسابه
                    if not employee_details.is_approved:
                        return jsonify({
                            "message": "حسابك بانتظار موافقة الإدارة، سيتم تفعيله قريباً."
                        }), 403
                    user_info["fullName"] = employee_details.full_name
                    user_info["office"] = employee_details.office_dept
                    user_info["employeeId"] = employee_details.id

            # 🌟 فرع الأدمن (لا يوجد له جدول بيانات إضافي، فقط دور بالنظام)
            elif user.role == 'admin':
                user_info["fullName"] = "مدير النظام"

            return jsonify({"message": "تم تسجيل الدخول بنجاح!", "user": user_info}), 200
        else:
            return jsonify({"message": "البريد الإلكتروني أو كلمة المرور غير صحيحة!"}), 401


    # =========================================================================
    # 🧠 المسارات الذكية الجديدة (الربط الفعلي مع الـ AraBERT والمرفقات وصمام الأمان)
    # =========================================================================

    # 📥 أ) مسار إرسال استفسار الطالب وتوجيهه تلقائياً بالذكاء الاصطناعي (نسخة موحدة محمية)
    @app.route('/api/queries/add', methods=['POST'])
    def add_query():
        # 🌟 صار الطلب FormData بدل JSON عشان نقدر نرفق صورة مع أول رسالة بالمحادثة
        student_id = request.form.get('studentId')
        query_text = request.form.get('queryText')

        if not query_text or not query_text.strip():
            return jsonify({"message": "لا يمكن إرسال استفسار فارغ!"}), 400

        student = Student.query.get(student_id)
        if not student:
            return jsonify({"message": "الطالب غير موجود!"}), 404

        try:
            # 🔮 التنبؤ الذكي بالمكتب المسؤول باستخدام AraBERT المحمل في السيرفر
            predicted_office = app.predict_department(query_text)

            # 🛠️ معالج وقائي ذكي: إجبار النتيجة على مطابقة الصيغ الجديدة المعتمدة
            predicted_cleaned = str(predicted_office).strip().lower()

            if 'exam' in predicted_cleaned:
                final_office = "Exams"
            elif 'student' in predicted_cleaned or 'affair' in predicted_cleaned:
                final_office = "Student Affairs"
            elif 'financial' in predicted_cleaned or 'finance' in predicted_cleaned or 'money' in predicted_cleaned:
                final_office = "Financial Affairs"
            elif 'it' in predicted_cleaned or 'office' in predicted_cleaned or 'info' in predicted_cleaned:
                final_office = "IT Office"
            else:
                final_office = "Student Affairs"  # خيار افتراضي احتياطي لحماية السيرفر

            # حفظ الاستفسار (المحادثة) بالصيغة النظيفة الموحدة
            new_task = QueryTask(
                student_id=student_id,
                office_dept=final_office,
                query_text=query_text,
                status='pending'
            )
            db.session.add(new_task)
            db.session.flush()  # لجلب new_task.id قبل الـ commit

            # 🌟 التقاط صورة اختيارية مرفقة مع أول رسالة بالمحادثة
            image_filename = None
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    image_filename = f"msg_{new_task.id}_{filename}"
                    file.save(os.path.join(UPLOAD_FOLDER, image_filename))

            # 🌟 أول رسالة بالمحادثة هي نص الاستفسار نفسه
            first_message = Message(
                query_id=new_task.id,
                sender_role='student',
                sender_name=student.full_name,
                text=query_text,
                image_file=image_filename
            )
            db.session.add(first_message)
            db.session.commit()

            return jsonify({
                "message": "تم إرسال استفسارك وتحليله بنجاح، وسيراجعه الموظف المختص قريباً!",
                "predictedDept": final_office,
                "queryId": new_task.id
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء معالجة الاستفسار: {str(e)}"}), 500


    # 📚 مسار الاستفسار عن اللوائح والأنظمة (QA مباشر عبر AraElectra، بدون تحويل لموظف)
    @app.route('/api/queries/ask-regulation', methods=['POST'])
    def ask_regulation():
        data = request.json
        query_text = data.get('queryText') if data else None

        if not query_text or not query_text.strip():
            return jsonify({"message": "لا يمكن إرسال استفسار فارغ!"}), 400

        try:
            result = app.answer_regulation_question(query_text)
            return jsonify({
                "officeDept": result["officeDept"],
                "answer": result["answer"]
            }), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ أثناء معالجة استفسارك: {str(e)}"}), 500


    # 📋 ب) مسار جلب الاستفسارات (المحادثات) الموجهة لمكتب الموظف الحالي
    @app.route('/api/queries/employee', methods=['POST'])
    def get_employee_queries():
        data = request.json
        office_dept = data.get('officeDept') 

        if not office_dept:
            return jsonify({"message": "القسم غير محدد!"}), 400

        try:
            client_cleaned = str(office_dept).strip().lower()
            if 'exam' in client_cleaned:
                search_office = "Exams"
            elif 'student' in client_cleaned or 'affair' in client_cleaned:
                search_office = "Student Affairs"
            elif 'financial' in client_cleaned or 'finance' in client_cleaned:
                search_office = "Financial Affairs"
            elif 'it' in client_cleaned or 'office' in client_cleaned:
                search_office = "IT Office"
            else:
                search_office = office_dept 

            queries = QueryTask.query.filter_by(office_dept=search_office).order_by(QueryTask.created_at.desc(), QueryTask.id.desc()).all()

            queries_list = []
            for q in queries:
                student = Student.query.get(q.student_id)
                last_msg = Message.query.filter_by(query_id=q.id).order_by(Message.created_at.desc()).first()
                queries_list.append({
                    "id": q.id,
                    "queryText": q.query_text,
                    "status": q.status,
                    "studentName": student.full_name if student else "طالب مجهول",
                    "major": student.major if student else "",
                    "messageCount": Message.query.filter_by(query_id=q.id).count(),
                    "lastMessagePreview": (last_msg.text[:60] if last_msg and last_msg.text else ("📷 صورة" if last_msg and last_msg.image_file else "")),
                    "lastSenderRole": last_msg.sender_role if last_msg else None,
                })
            return jsonify({"queries": queries_list}), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ أثناء جلب البيانات: {str(e)}"}), 500


    # 🛡️ ج) صمام الأمان: مسار إعادة التوجيه اليدوي في حال أخطأ نموذج الذكاء الاصطناعي
    @app.route('/api/queries/redirect', methods=['POST'])
    def redirect_query():
        data = request.json
        query_id = data.get('queryId')
        new_office = data.get('newOffice') 

        query_task = QueryTask.query.get(query_id)
        if not query_task:
            return jsonify({"message": "الاستفسار غير موجود!"}), 404

        try:
            query_task.office_dept = new_office
            query_task.is_redirected = True
            db.session.commit()
            return jsonify({"message": f"تم تصحيح مسار الاستفسار ونقله فوراً إلى مكتب {new_office}!"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء إعادة التوجيه اليدوي: {str(e)}"}), 500


    # =========================================================================
    # 💬 نظام المحادثة المفتوحة (WhatsApp-style) بين الطالب والموظف
    # =========================================================================

    # جلب كل رسائل محادثة معينة + معلومات أساسية عنها
    @app.route('/api/queries/<int:query_id>/messages', methods=['GET'])
    def get_query_messages(query_id):
        query_task = QueryTask.query.get(query_id)
        if not query_task:
            return jsonify({"message": "المحادثة غير موجودة!"}), 404

        try:
            student = Student.query.get(query_task.student_id)
            messages = Message.query.filter_by(query_id=query_id).order_by(Message.created_at.asc()).all()

            messages_list = [{
                "id": m.id,
                "senderRole": m.sender_role,
                "senderName": m.sender_name,
                "text": m.text,
                "imageFile": m.image_file,
                "createdAt": m.created_at.strftime('%Y-%m-%d %H:%M') if m.created_at else ""
            } for m in messages]

            return jsonify({
                "query": {
                    "id": query_task.id,
                    "officeDept": query_task.office_dept,
                    "status": query_task.status,
                    "studentName": student.full_name if student else "طالب مجهول",
                    "createdAt": query_task.created_at.strftime('%Y-%m-%d %H:%M') if query_task.created_at else ""
                },
                "messages": messages_list
            }), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ أثناء جلب المحادثة: {str(e)}"}), 500

    # إرسال رسالة جديدة بمحادثة معينة (من الطالب أو الموظف) مع إمكانية إرفاق صورة
    @app.route('/api/queries/<int:query_id>/messages', methods=['POST'])
    def post_query_message(query_id):
        query_task = QueryTask.query.get(query_id)
        if not query_task:
            return jsonify({"message": "المحادثة غير موجودة!"}), 404

        sender_role = request.form.get('senderRole')  # 'student' أو 'employee'
        sender_id = request.form.get('senderId')
        text = request.form.get('text', '').strip()

        if sender_role not in ('student', 'employee'):
            return jsonify({"message": "نوع المرسل غير صحيح!"}), 400

        try:
            # تحديد اسم المرسل والتحقق من صلاحيته على هالمحادثة تحديداً
            if sender_role == 'student':
                if str(query_task.student_id) != str(sender_id):
                    return jsonify({"message": "لا تملكين صلاحية الإرسال بهذه المحادثة!"}), 403
                sender = Student.query.get(sender_id)
                sender_name = sender.full_name if sender else "طالب"
            else:
                sender = Employee.query.get(sender_id)
                sender_name = sender.full_name if sender else "موظف"

            # التقاط صورة اختيارية مرفقة مع الرسالة
            image_filename = None
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename != '' and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    image_filename = f"msg_{query_id}_{sender_role}_{filename}"
                    file.save(os.path.join(UPLOAD_FOLDER, image_filename))

            if not text and not image_filename:
                return jsonify({"message": "لا يمكن إرسال رسالة فارغة!"}), 400

            new_message = Message(
                query_id=query_id,
                sender_role=sender_role,
                sender_name=sender_name,
                text=text or None,
                image_file=image_filename
            )
            db.session.add(new_message)

            # 🌟 تحديث حالة المحادثة حسب مين آخر مرسل:
            # الموظف رد → صارت "replied" (دور الطالب يرد لو بدو)
            # الطالب رد → ترجع "pending" (تحتاج انتباه الموظف من جديد)
            if sender_role == 'employee':
                query_task.status = 'replied'
                query_task.employee_id = sender_id
            else:
                query_task.status = 'pending'

            db.session.commit()

            return jsonify({
                "message": "تم إرسال الرسالة بنجاح!",
                "sentMessage": {
                    "id": new_message.id,
                    "senderRole": new_message.sender_role,
                    "senderName": new_message.sender_name,
                    "text": new_message.text,
                    "imageFile": new_message.image_file,
                    "createdAt": new_message.created_at.strftime('%Y-%m-%d %H:%M') if new_message.created_at else ""
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء إرسال الرسالة: {str(e)}"}), 500


    # ---------------------------------------------------
    # هـ) مسار جلب سجل الاستفسارات (المحادثات) الخاص بطالب معين
    # ---------------------------------------------------
    @app.route('/api/queries/student/<int:student_id>', methods=['GET'])
    def get_student_queries(student_id):
        try:
            queries = QueryTask.query.filter_by(student_id=student_id).order_by(QueryTask.created_at.desc(), QueryTask.id.desc()).all()
            queries_list = []
            for q in queries:
                last_msg = Message.query.filter_by(query_id=q.id).order_by(Message.created_at.desc()).first()
                queries_list.append({
                    "id": q.id,
                    "queryText": q.query_text,
                    "officeDept": q.office_dept,
                    "status": q.status,
                    "messageCount": Message.query.filter_by(query_id=q.id).count(),
                    "lastMessagePreview": (last_msg.text[:60] if last_msg and last_msg.text else ("📷 صورة" if last_msg and last_msg.image_file else "")),
                    "lastSenderRole": last_msg.sender_role if last_msg else None,
                })
            return jsonify({"queries": queries_list}), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ: {str(e)}"}), 500

    # ---------------------------------------------------
    # 📇 مسار جلب بيانات الملف الشخصي للطالب (صفحة الإعدادات)
    # ---------------------------------------------------
    @app.route('/api/student/profile/<int:student_id>', methods=['GET'])
    def get_student_profile(student_id):
        try:
            student = Student.query.get(student_id)
            if not student:
                return jsonify({"message": "الطالب غير موجود!"}), 404

            user = User.query.get(student.user_id)
            return jsonify({
                "fullName": student.full_name,
                "major": student.major,
                "universityId": student.university_id,
                "email": user.email if user else ""
            }), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ أثناء جلب البيانات: {str(e)}"}), 500

    # ---------------------------------------------------
    # 🔐 مسار تغيير كلمة مرور الطالب (صفحة الإعدادات)
    # ---------------------------------------------------
    @app.route('/api/student/change-password', methods=['POST'])
    def change_student_password():
        data = request.json
        student_id = data.get('studentId')
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        if not current_password or not new_password:
            return jsonify({"message": "الرجاء تعبئة كل الحقول!"}), 400

        if len(new_password) < 6:
            return jsonify({"message": "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل!"}), 400

        try:
            student = Student.query.get(student_id)
            if not student:
                return jsonify({"message": "الطالب غير موجود!"}), 404

            user = User.query.get(student.user_id)
            if not user or not bcrypt.check_password_hash(user.password, current_password):
                return jsonify({"message": "كلمة المرور الحالية غير صحيحة!"}), 401

            user.password = bcrypt.generate_password_hash(new_password).decode('utf-8')
            db.session.commit()
            return jsonify({"message": "تم تغيير كلمة المرور بنجاح!"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء تغيير كلمة المرور: {str(e)}"}), 500


    # =========================================================================
    # 🛠️ مسارات لوحة تحكم الأدمن (إحصائيات + إدارة شاملة) — هاي كانت ناقصة بالكامل
    # =========================================================================

    # 📊 أ) إحصائيات شاملة عن النظام (الكروت + مؤشر الضغط على المكاتب + مقارنة شهرية)
    @app.route('/api/admin/stats', methods=['GET'])
    def admin_stats():
        try:
            from datetime import datetime, timedelta

            total_queries = QueryTask.query.count()
            pending_count = QueryTask.query.filter_by(status='pending').count()
            replied_count = QueryTask.query.filter_by(status='replied').count()
            redirected_count = QueryTask.query.filter_by(is_redirected=True).count()
            total_students = Student.query.count()
            total_employees = Employee.query.count()
            pending_employees_count = Employee.query.filter_by(is_approved=False).count()

            # عدد الاستفسارات لكل مكتب (لمؤشر الضغط والمخطط الدائري)
            office_counts = {}
            all_offices = ['Student Affairs', 'Exams', 'Financial Affairs', 'IT Office']
            for office in all_offices:
                office_counts[office] = QueryTask.query.filter_by(office_dept=office).count()

            # 🌟 مقارنة هذا الشهر بالشهر الماضي (لنسب التغيير %+ بالكروت)
            now = datetime.utcnow()
            this_month_start = datetime(now.year, now.month, 1)
            if now.month == 1:
                last_month_start = datetime(now.year - 1, 12, 1)
            else:
                last_month_start = datetime(now.year, now.month - 1, 1)

            def percent_change(this_count, last_count):
                if last_count == 0:
                    return 100 if this_count > 0 else 0
                return round(((this_count - last_count) / last_count) * 100)

            this_month_total = QueryTask.query.filter(QueryTask.created_at >= this_month_start).count()
            last_month_total = QueryTask.query.filter(
                QueryTask.created_at >= last_month_start, QueryTask.created_at < this_month_start
            ).count()

            this_month_pending = QueryTask.query.filter(
                QueryTask.created_at >= this_month_start, QueryTask.status == 'pending'
            ).count()
            last_month_pending = QueryTask.query.filter(
                QueryTask.created_at >= last_month_start, QueryTask.created_at < this_month_start,
                QueryTask.status == 'pending'
            ).count()

            this_month_replied = QueryTask.query.filter(
                QueryTask.created_at >= this_month_start, QueryTask.status == 'replied'
            ).count()
            last_month_replied = QueryTask.query.filter(
                QueryTask.created_at >= last_month_start, QueryTask.created_at < this_month_start,
                QueryTask.status == 'replied'
            ).count()

            this_month_redirected = QueryTask.query.filter(
                QueryTask.created_at >= this_month_start, QueryTask.is_redirected == True
            ).count()
            last_month_redirected = QueryTask.query.filter(
                QueryTask.created_at >= last_month_start, QueryTask.created_at < this_month_start,
                QueryTask.is_redirected == True
            ).count()

            # 🌟 اتجاه آخر 7 أيام (لمخطط "الاستفسارات اليومية")
            daily_trend = []
            for i in range(6, -1, -1):
                day = (now - timedelta(days=i)).date()
                count = QueryTask.query.filter(
                    db.func.date(QueryTask.created_at) == day.isoformat()
                ).count()
                daily_trend.append({"date": day.isoformat(), "count": count})

            # 🌟 آخر 5 استفسارات (لجدول "آخر الاستفسارات" بالنظرة العامة)
            recent = QueryTask.query.order_by(QueryTask.created_at.desc()).limit(5).all()
            recent_queries = []
            for q in recent:
                student = Student.query.get(q.student_id)
                recent_queries.append({
                    "id": q.id,
                    "studentName": student.full_name if student else "طالب مجهول",
                    "officeDept": q.office_dept,
                    "status": q.status,
                    "createdAt": q.created_at.strftime('%Y-%m-%d %H:%M') if q.created_at else ""
                })

            return jsonify({
                "totalQueries": total_queries,
                "pendingCount": pending_count,
                "repliedCount": replied_count,
                "redirectedCount": redirected_count,
                "totalStudents": total_students,
                "totalEmployees": total_employees,
                "pendingEmployeesCount": pending_employees_count,
                "officeCounts": office_counts,
                "deltas": {
                    "total": percent_change(this_month_total, last_month_total),
                    "pending": percent_change(this_month_pending, last_month_pending),
                    "replied": percent_change(this_month_replied, last_month_replied),
                    "redirected": percent_change(this_month_redirected, last_month_redirected),
                },
                "dailyTrend": daily_trend,
                "recentQueries": recent_queries
            }), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ أثناء جلب الإحصائيات: {str(e)}"}), 500

    # 📋 ب) جلب كل الاستفسارات في النظام (بدون تحديد بمكتب واحد، للأدمن فقط)
    @app.route('/api/admin/queries', methods=['GET'])
    def admin_get_all_queries():
        try:
            queries = QueryTask.query.order_by(QueryTask.created_at.desc()).all()
            queries_list = []
            for q in queries:
                student = Student.query.get(q.student_id)
                queries_list.append({
                    "id": q.id,
                    "queryText": q.query_text,
                    "officeDept": q.office_dept,
                    "status": q.status,
                    "isRedirected": q.is_redirected,
                    "studentName": student.full_name if student else "طالب مجهول",
                    "createdAt": q.created_at.strftime('%Y-%m-%d %H:%M') if q.created_at else ""
                })
            return jsonify({"queries": queries_list}), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ أثناء جلب الاستفسارات: {str(e)}"}), 500

    # 👥 ج) جلب كل المستخدمين (طلاب + موظفين) مع بريدهم الإلكتروني
    @app.route('/api/admin/users', methods=['GET'])
    def admin_get_users():
        try:
            students = Student.query.all()
            students_list = []
            for s in students:
                students_list.append({
                    "id": s.id,
                    "fullName": s.full_name,
                    "major": s.major,
                    "universityId": s.university_id,
                    "email": s.user.email if s.user else ""
                })

            employees = Employee.query.all()
            employees_list = []
            for e in employees:
                employees_list.append({
                    "id": e.id,
                    "fullName": e.full_name,
                    "officeDept": e.office_dept,
                    "verificationFile": e.verification_file,
                    "isApproved": e.is_approved,
                    "email": e.user.email if e.user else ""
                })

            return jsonify({"students": students_list, "employees": employees_list}), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ أثناء جلب المستخدمين: {str(e)}"}), 500

    # 🗑️ د) حذف حساب طالب أو موظف (مع حذف المستخدم الأساسي المرتبط به)
    @app.route('/api/admin/users/<user_type>/<int:profile_id>', methods=['DELETE'])
    def admin_delete_user(user_type, profile_id):
        try:
            if user_type == 'student':
                profile = Student.query.get(profile_id)
                if not profile:
                    return jsonify({"message": "الطالب غير موجود!"}), 404
                # حذف استفسارات الطالب أولاً لتجنب مشاكل الترابط بقاعدة البيانات
                QueryTask.query.filter_by(student_id=profile.id).delete()
                user = User.query.get(profile.user_id)
                db.session.delete(profile)
                if user:
                    db.session.delete(user)

            elif user_type == 'employee':
                profile = Employee.query.get(profile_id)
                if not profile:
                    return jsonify({"message": "الموظف غير موجود!"}), 404
                user = User.query.get(profile.user_id)
                db.session.delete(profile)
                if user:
                    db.session.delete(user)
            else:
                return jsonify({"message": "نوع المستخدم غير صحيح!"}), 400

            db.session.commit()
            return jsonify({"message": "تم حذف الحساب بنجاح!"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء الحذف: {str(e)}"}), 500


    # =========================================================================
    # ✅ هـ) نظام موافقة الأدمن على حسابات الموظفين الجديدة
    # =========================================================================

    # جلب كل الموظفين بانتظار الموافقة فقط
    @app.route('/api/admin/employees/pending', methods=['GET'])
    def admin_get_pending_employees():
        try:
            pending = Employee.query.filter_by(is_approved=False).all()
            pending_list = []
            for e in pending:
                pending_list.append({
                    "id": e.id,
                    "fullName": e.full_name,
                    "officeDept": e.office_dept,
                    "verificationFile": e.verification_file,
                    "email": e.user.email if e.user else ""
                })
            return jsonify({"employees": pending_list}), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ: {str(e)}"}), 500

    # الموافقة على حساب موظف معيّن
    @app.route('/api/admin/employees/<int:employee_id>/approve', methods=['POST'])
    def admin_approve_employee(employee_id):
        try:
            employee = Employee.query.get(employee_id)
            if not employee:
                return jsonify({"message": "الموظف غير موجود!"}), 404

            employee.is_approved = True
            db.session.commit()
            return jsonify({"message": f"تم تفعيل حساب الموظف {employee.full_name} بنجاح!"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء الموافقة: {str(e)}"}), 500

    # رفض/حذف طلب موظف بانتظار الموافقة
    @app.route('/api/admin/employees/<int:employee_id>/reject', methods=['DELETE'])
    def admin_reject_employee(employee_id):
        try:
            employee = Employee.query.get(employee_id)
            if not employee:
                return jsonify({"message": "الموظف غير موجود!"}), 404

            user = User.query.get(employee.user_id)
            db.session.delete(employee)
            if user:
                db.session.delete(user)
            db.session.commit()
            return jsonify({"message": "تم رفض الطلب وحذفه بنجاح."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"حدث خطأ أثناء الرفض: {str(e)}"}), 500