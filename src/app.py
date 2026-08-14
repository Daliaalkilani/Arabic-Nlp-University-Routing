import os
import torch
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForQuestionAnswering, pipeline
from arabert.preprocess import ArabertPreprocessor

from models import db, bcrypt
from routes import init_routes

# ==========================================
# إعداد التطبيق
# ==========================================
app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Flask is working 🚀"

# إعداد قاعدة البيانات
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(BASE_DIR, 'university_portal.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# تهيئة الإضافات
db.init_app(app)
bcrypt.init_app(app)

# ==========================================
# تحميل نموذج الذكاء الاصطناعي
# ==========================================
MODEL_PATH = os.path.join(BASE_DIR, "arabert_model")
model_name = "aubmindlab/bert-base-arabertv02"

print("⏳ جاري تحميل نموذج الذكاء الاصطناعي...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
ai_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

# ⚠️ مهم جداً: نفس المعالج المستخدم أثناء التدريب
arabert_prep = ArabertPreprocessor(model_name=model_name)

# تحديد الجهاز (CPU أو GPU)
device = "cuda" if torch.cuda.is_available() else "cpu"
ai_model.to(device)
ai_model.eval()

# استخراج id2label مباشرة من النموذج المحفوظ (هذا هو الصح، لا تعيد بناءه)
id2label = ai_model.config.id2label

print("✅ تم تحميل النموذج بنجاح!")
print(f"📋 الأقسام المتاحة: {list(id2label.values())}")

# ==========================================
# دالة التصنيف الذكي
# ==========================================
def predict_department(query_text: str) -> str:
    cleaned_text = arabert_prep.preprocess(query_text)

    inputs = tokenizer(
        cleaned_text,
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128
    )

    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = ai_model(**inputs)
        logits = outputs.logits
        predicted_class_id = logits.argmax(dim=-1).item()

    predicted_label = id2label[predicted_class_id]

    print(f"[AI] النص: {query_text[:50]}...")
    print(f"[AI] بعد التنظيف: {cleaned_text[:50]}...")
    print(f"[AI] التصنيف: {predicted_label}")

    return predicted_label

app.predict_department = predict_department

# ==========================================
# 🧾 تحميل قواعد المعرفة الثابتة (Contexts) لميزة الاستفسارات العامة
# ==========================================
QA_CONTEXTS_DIR = os.path.join(BASE_DIR, "qa_contexts")

QA_CONTEXT_FILES = {
    "Exams": "Exams_Context.txt",
    "Student Affairs": "StudentAffairs_Context.txt",
    "Financial Affairs": "FinancialAffairs_Context.txt",
    "IT Office": "ITOffice_Context.txt",
}

QA_CONTEXTS = {}
for _label, _filename in QA_CONTEXT_FILES.items():
    with open(os.path.join(QA_CONTEXTS_DIR, _filename), encoding="utf-8") as _f:
        QA_CONTEXTS[_label] = _f.read().strip()

print(f"[AI] تم تحميل السياقات الثابتة: {list(QA_CONTEXTS.keys())}")

# ==========================================
# 🧠 تحميل نموذج الإجابة على الأسئلة (Question Answering)
# ==========================================
QA_MODEL_NAME = "ZeyadAhmed/AraElectra-Arabic-SQuADv2-QA"

print("⏳ جاري تحميل نموذج الإجابة على الأسئلة (QA)...")

qa_tokenizer = AutoTokenizer.from_pretrained(QA_MODEL_NAME)
qa_model = AutoModelForQuestionAnswering.from_pretrained(QA_MODEL_NAME)
qa_model.to(device)
qa_model.eval()

qa_pipeline = pipeline(
    "question-answering",
    model=qa_model,
    tokenizer=qa_tokenizer,
    device=0 if device == "cuda" else -1
)

print("✅ تم تحميل نموذج QA بنجاح!")

# ==========================================
# 🧠 دالة الإجابة على الاستفسارات العامة (اللوائح والأنظمة)
# ==========================================
def answer_regulation_question(query_text: str) -> dict:
    predicted_office = predict_department(query_text)

    # 🛠️ معالج تطبيع مبني على نفس فكرة add_query بـ routes.py، مع تصحيح ترتيب الفحص:
    # ⚠️ "Financial Affairs".lower() يحتوي على الكلمة الفرعية "affair"، لذلك يجب فحص 'financial' قبل 'affair'
    # وإلا يُصنَّف أي استفسار مالي خطأً كـ "Student Affairs" (نفس هذا الالتباس موجود حالياً بمسار add_query).
    predicted_cleaned = str(predicted_office).strip().lower()

    if 'exam' in predicted_cleaned:
        final_office = "Exams"
    elif 'financial' in predicted_cleaned or 'finance' in predicted_cleaned or 'money' in predicted_cleaned:
        final_office = "Financial Affairs"
    elif 'student' in predicted_cleaned or 'affair' in predicted_cleaned:
        final_office = "Student Affairs"
    elif 'it' in predicted_cleaned or 'office' in predicted_cleaned or 'info' in predicted_cleaned:
        final_office = "IT Office"
    else:
        final_office = "Student Affairs"

    context = QA_CONTEXTS[final_office]
    result = qa_pipeline(question=query_text, context=context)

    print(f"[AI-QA] السؤال: {query_text[:50]}...")
    print(f"[AI-QA] القسم المتوقع: {final_office}")
    print(f"[AI-QA] الإجابة: {str(result.get('answer'))[:80]}... (score={result.get('score'):.3f})")

    return {"officeDept": final_office, "answer": result["answer"]}

app.answer_regulation_question = answer_regulation_question

# ==========================================
# تسجيل المسارات وتشغيل التطبيق
# ==========================================
init_routes(app)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)