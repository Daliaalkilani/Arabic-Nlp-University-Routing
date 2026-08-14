"""
🌟 تعديل بسيط على دالة login() الموجودة بالفعل بـ routes.py
أضيفي فرع الأدمن هذا بعد فرع 'employee' ضمن نفس الدالة login، بدون أي تغيير آخر:
"""

            elif user.role == 'employee':
                employee_details = Employee.query.filter_by(user_id=user.id).first()
                if employee_details:
                    user_info["fullName"] = employee_details.full_name
                    user_info["office"] = employee_details.office_dept
                    user_info["employeeId"] = employee_details.id

            # 🌟 الإضافة الجديدة: فرع الأدمن (لا يوجد له جدول بيانات إضافي، فقط دور بالنظام)
            elif user.role == 'admin':
                user_info["fullName"] = "مدير النظام"
