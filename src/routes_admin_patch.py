"""
🌟 إضافات على routes.py لدعم لوحة تحكم الأدمن
أضيفي هاد الكود داخل دالة init_routes(app) — بعد آخر مسار موجود (get_student_queries)
"""

    # =========================================================================
    # 🛠️ مسارات لوحة تحكم الأدمن (إحصائيات + إدارة شاملة)
    # =========================================================================

    # 📊 أ) إحصائيات شاملة عن النظام (الكروت + مؤشر الضغط على المكاتب)
    @app.route('/api/admin/stats', methods=['GET'])
    def admin_stats():
        try:
            total_queries = QueryTask.query.count()
            pending_count = QueryTask.query.filter_by(status='pending').count()
            replied_count = QueryTask.query.filter_by(status='replied').count()
            redirected_count = QueryTask.query.filter_by(is_redirected=True).count()
            total_students = Student.query.count()
            total_employees = Employee.query.count()

            # عدد الاستفسارات لكل مكتب (لمؤشر الضغط)
            office_counts = {}
            all_offices = ['Student Affairs', 'Exams', 'Financial Affairs', 'IT Office']
            for office in all_offices:
                office_counts[office] = QueryTask.query.filter_by(office_dept=office).count()

            return jsonify({
                "totalQueries": total_queries,
                "pendingCount": pending_count,
                "repliedCount": replied_count,
                "redirectedCount": redirected_count,
                "totalStudents": total_students,
                "totalEmployees": total_employees,
                "officeCounts": office_counts
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
