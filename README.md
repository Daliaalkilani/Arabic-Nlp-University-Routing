# 🚀 Arabic Student Inquiry Classification using BERT Models

## 📖 Overview

This project presents a robust Natural Language Processing (NLP) system for the automatic classification of Arabic student inquiries within university environments.

Unlike clean benchmark datasets, this system is designed for **real-world noisy Arabic text**, where language includes informal phrasing, dialect mixing, and spelling inconsistencies.

The dataset reflects a **hybrid linguistic structure**, combining:

- Modern Standard Arabic (MSA)  
- Syrian colloquial dialect  
- Informal expressions  

The model classifies each inquiry into one of four administrative categories:

| Label | Description |
|------|------------|
| Financial Affairs | Tuition, payments, discounts, fees |
| Student Affairs | Registration, GPA, graduation |
| IT Office | Technical issues, systems, accounts |
| Exams | Schedules, grades, appeals |

---

## 🧠 Models Used

The following pretrained Transformer models were fine-tuned and compared:

- **AraBERTv2** → optimized for Modern Standard Arabic  
- **MARBERTv2** → trained on dialect-rich social media data  
- **ARBERTv2** → trained on large-scale Arabic corpora  

All models were trained under identical conditions to ensure fair comparison.

---

## ⚙️ Methodology

- Dataset size: **2000 real student inquiries**  
- Class distribution: **Balanced (500 per class)**  
- Training approach: **Full Fine-Tuning**  
- Evaluation: **Stratified 5-Fold Cross Validation**  
- Early stopping: **Patience = 2**  
- Random seed for reproducibility  

This setup ensures reliable evaluation and minimizes bias.

---

## 📊 Results

| Model       | Accuracy | F1-score |
|------------|---------|---------|
| **AraBERTv2**  | **92.45%**  | **0.9243**  |
| MARBERTv2  | 91.95%  | 0.9195  |
| ARBERTv2   | 91.05%  | 0.9100  |

AraBERTv2 achieved the best overall performance.

---

## 📁 Dataset

The dataset consists of real student inquiries collected from:

- University administrative offices  
- Facebook student groups  
- WhatsApp academic groups  

### Key Characteristics

- Hybrid Arabic (MSA + dialect)  
- Spelling inconsistencies  
- Short and ambiguous queries  
- Real-world noise  

---

## 🧩 Challenges

This task includes several NLP challenges:

- Lexical overlap between classes  
- Extremely short texts (e.g., "الدفع كيف؟")  
- Dialect variation  
- Orthographic inconsistency  
- Context ambiguity  

---

## 🛠️ Technologies Used

- Python  
- PyTorch  
- HuggingFace Transformers  
- Scikit-learn  
- Google Colab (T4 GPU)

---

## ▶️ Usage

```bash
git clone https://github.com/Daliaalkilani/Arabic-Nlp-University-Routing.git
cd your-Arabic-Nlp-University-Routing
