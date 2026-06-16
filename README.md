# 🎓 Arabic Student Inquiry Classification using BERT Models

## 📖 Overview
This project presents a high-accuracy Natural Language Processing (NLP) system for automatically classifying Arabic student inquiries in university environments.

The system is specifically designed to handle **hybrid Arabic text**, combining:
- Modern Standard Arabic (MSA)
- Syrian dialect

It classifies inquiries into four categories:
- Financial Affairs
- Student Affairs
- IT Office
- Exams

---

## 🧠 Models Used
The following pre-trained Arabic BERT models were fine-tuned and compared:

- AraBERTv2
- MARBERTv2
- ARBERTv2

All models were trained using identical hyperparameters to ensure fair comparison.

---

## ⚙️ Methodology

- Dataset size: **2000 real student inquiries**
- Balanced classes: **500 per category**
- Training approach: **Full Fine-Tuning**
- Evaluation: **Stratified 5-Fold Cross Validation**
- Early Stopping: **Patience = 2**

---

## 📊 Results

| Model       | Accuracy | F1-score |
|------------|---------|---------|
| AraBERTv2  | 92.45%  | 0.9243  |
| MARBERTv2  | 91.95%  | 0.9195  |
| ARBERTv2   | 91.05%  | 0.9100  |

AraBERT achieved the best performance across all evaluation metrics.

---

## 📁 Dataset

The dataset consists of real student inquiries collected from:
- University administrative offices
- Facebook student groups
- WhatsApp academic groups

It reflects real-world challenges:
- Dialect variation
- Spelling inconsistencies
- Short-text ambiguity

---

## 🛠️ Technologies Used

- Python
- PyTorch
- HuggingFace Transformers
- Scikit-learn
- Google Colab (T4 GPU)

---

## 🚀 How to Run

```bash
pip install -r requirements.txt
python train.py
