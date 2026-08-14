from app import app

# مشغّل الخادم الخلفي (بدون إعادة التحميل التلقائي حتى لا تُحمَّل نماذج الذكاء مرتين)
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, use_reloader=False)
