"""
🌟 إضافة بسيطة على routes.py — مسار عام وآمن (بدون بيانات حساسة)
يُستخدم فقط لتغذية العداد الحي بالصفحة الرئيسية.
أضيفيه بنفس مكان مسارات الأدمن، داخل init_routes(app):
"""

    @app.route('/api/public/stats', methods=['GET'])
    def public_stats():
        try:
            total_queries = QueryTask.query.count()
            replied_count = QueryTask.query.filter_by(status='replied').count()
            total_students = Student.query.count()

            return jsonify({
                "totalQueries": total_queries,
                "repliedCount": replied_count,
                "totalStudents": total_students
            }), 200
        except Exception as e:
            return jsonify({"message": f"حدث خطأ: {str(e)}"}), 500
