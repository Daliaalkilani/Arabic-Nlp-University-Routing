import React from 'react';
import InfoPage from './InfoPage';

const ContactPage = () => {
  return (
    <InfoPage icon="bi-headset" title="تواصل معنا">
      <p>لأي استفسار تقني متعلق بالمنصة، يمكنكم التواصل معنا عبر:</p>
      <div className="contact-line">
        <i className="bi bi-envelope-fill"></i> support@univ.edu
      </div>
      <div className="contact-line">
        <i className="bi bi-telephone-fill"></i> 06-xxxxxxx (الدعم التقني)
      </div>
      <div className="contact-line">
        <i className="bi bi-geo-alt-fill"></i> عمادة شؤون الطلاب - الجامعة
      </div>
      <p>
        أما بخصوص الاستفسارات الأكاديمية أو الإدارية، فيرجى إرسالها مباشرة من خلال حسابك على المنصة
        ليصلكم الرد الرسمي من المكتب المختص من خلال خيار طلب خدمة.
      </p>
      <p>
        أما الاستفسارات العامة المتعلقة باللوائح والأنظمة الجامعية، فيمكن الحصول على إجابة فورية من خلال
        خيار "الاستفسار عن اللوائح والانظمة" داخل النظام.
      </p>
    </InfoPage>
  );
};

export default ContactPage;
