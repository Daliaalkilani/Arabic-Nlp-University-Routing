# Smart University Student Inquiry System

## Professional Project Summary

This repository presents a mature, production-oriented university inquiry platform designed for Arabic-speaking students.
It combines a React-based user interface, a Flask REST API, and Arabic NLP model evaluation to deliver accurate inquiry routing and contextual knowledge support.

### Executive Summary

- Built for university administration and student support teams.
- Automates Arabic inquiry classification into four operational domains.
- Uses AraBERTv2 for the highest classification accuracy in internal model comparison.
- Supports Arabic question answering with AraElectra for policy and regulation inquiries.

### Model selection and performance

The system evaluates three Arabic transformer models for classification:

- `aubmindlab/bert-base-arabertv02` (AraBERTv2)
- `UBC-NLP/MARBERTv2`
- `UBC-NLP/ARBERTv2`

Based on internal validation, `aubmindlab/bert-base-arabertv02` was selected for production inference.
This choice reflects the strongest results on classification accuracy, precision, recall, and F1 score across the university inquiry dataset.

For knowledge-based question answering, the application uses:

- `ZeyadAhmed/AraElectra-Arabic-SQuADv2-QA`

### Solution overview

The system enables students to submit Arabic inquiries and automatically:

- classifies each inquiry into one of four university functions
- routes requests to the appropriate office
- delivers a student-facing dashboard for inquiry tracking
- provides staff dashboards for request management and approval
- supports direct Arabic QA for rules and policy questions

### Business value

- Reduces manual workload and operational bottlenecks
- Improves response speed and support consistency
- Enhances satisfaction for Arabic-speaking students
- Gives administrators real-time visibility into request flow
- Demonstrates a research-backed Arabic NLP solution in a real workflow

### Deployment

```bash
npm install
python -m pip install -r src/requirements-flask.txt
python src/run.py
npm run dev
```

> Recommended: run Python dependencies inside a virtual environment.

### Technology stack

- Front-end: React 19 + Vite
- Styling: Bootstrap 5
- Routing: React Router DOM
- Back-end: Flask
- Database: SQLite with SQLAlchemy
- Security: Flask-Bcrypt
- AI: PyTorch + Hugging Face Transformers

### Project structure

- `package.json` — front-end scripts and dependencies
- `src/main.jsx` — React application bootstrap
- `src/App.jsx` — main application routes and layout
- `src/app.py` — Flask application setup and model loading
- `src/routes.py` — API endpoints for registration and inquiries
- `src/models.py` — database schema models
- `src/requirements-flask.txt` — Python dependency list
- `src/arabert_model/` — local Arabic model files
- `src/qa_contexts/` — knowledge contexts for QA responses

### Important notes

- Keep `src/arabert_model` and `src/qa_contexts` in place for full functionality.
- Set `app.config['SECRET_KEY']` in `src/app.py` before production deployment.
- Supported upload formats: `png`, `jpg`, `jpeg`, `pdf`.

---

## النسخة العربية

### ملخص احترافي للمشروع

هذا المستودع يعرض نظام استفسارات طلابي جامعي احترافي موجه للطلاب المتحدثين بالعربية.
يجمع المشروع بين واجهة React، وخادم Flask، وتقييم نماذج NLP عربية لتوجيه الاستفسارات بدقة ودعم معرفة سياقية.

### ملخص تنفيذي

- مصمم لدعم فرق الجامعة والإدارة
- يصنف الاستفسارات العربية تلقائياً إلى أربعة مجالات تشغيلية
- يستخدم AraBERTv2 لتحقيق أعلى دقة تصنيف في مقارنة النماذج الداخلية
- يدعم الإجابة الذكية عن الأسئلة التنظيمية باستخدام AraElectra

### اختيار النموذج والأداء

نقوم بتقييم ثلاثة نماذج عربية للتصنيف:

- `aubmindlab/bert-base-arabertv02` (AraBERTv2)
- `UBC-NLP/MARBERTv2`
- `UBC-NLP/ARBERTv2`

تم اختيار `aubmindlab/bert-base-arabertv02` للتشغيل الفعلي، لأنه سجل أفضل أداء في الدقة والدقة النوعية والاستدعاء وF1 على بيانات الاستفسارات الجامعية.

لأغراض الإجابة عن الأسئلة المعرفية، يستخدم التطبيق:

- `ZeyadAhmed/AraElectra-Arabic-SQuADv2-QA`

### نظرة عامة على الحل

يسمح النظام للطلاب بتقديم استفسارات عربية ثم:

- يصنف كل استفسار إلى أحد الأقسام الأربعة
- يوجه الطلبات إلى المكتب المناسب
- يوفر لوحة متابعة للطلاب لحالة الاستفسار
- يدعم لوحات للموظفين لإدارة الطلبات والموافقة
- يدعم الإجابة العربية الذكية عن الأسئلة التنظيمية

### القيمة العملية

- يقلل من العمل اليدوي والاختناقات التشغيلية
- يحسن سرعة الاستجابة واتساق الدعم
- يعزز رضا الطلاب المتحدثين بالعربية
- يمنح الإدارة رؤية فورية لتدفق الطلبات
- يوضح حل NLP عربي مدعوماً بالبحث في بيئة عملية

### التشغيل

```bash
npm install
python -m pip install -r src/requirements-flask.txt
python src/run.py
npm run dev
```

> يُنصح باستخدام بيئة افتراضية Python لعزل التبعيات.

### بنية التكنولوجيا

- الواجهة الأمامية: React 19 + Vite
- التصميم: Bootstrap 5
- التوجيه: React Router DOM
- الواجهة الخلفية: Flask
- قاعدة البيانات: SQLite مع SQLAlchemy
- الأمان: Flask-Bcrypt
- الذكاء الاصطناعي: PyTorch + Hugging Face Transformers

### بنية المشروع

- `package.json` — تبعيات وسكربتات الواجهة الأمامية
- `src/main.jsx` — نقطة الانطلاق لتطبيق React
- `src/App.jsx` — التطبيق الرئيسي والرواتر
- `src/app.py` — إعداد Flask وتحميل النموذج
- `src/routes.py` — واجهات API للتسجيل والاستفسارات
- `src/models.py` — نماذج مخطط قاعدة البيانات
- `src/requirements-flask.txt` — تبعيات Python
- `src/arabert_model/` — ملفات النموذج العربية المحلية
- `src/qa_contexts/` — سياقات المعرفة لميزة الإجابة

### ملاحظات مهمة

- احتفظ بمجلد `src/arabert_model` و`src/qa_contexts` في مكانهما لضمان عمل النظام الكامل.
- اضبط `app.config['SECRET_KEY']` في `src/app.py` قبل نشره في الإنتاج.
- صيغ الملفات المدعومة للتحميل: `png`, `jpg`, `jpeg`, `pdf`.
