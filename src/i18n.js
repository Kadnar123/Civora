import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "home": "Home",
      "report_issue": "Report Issue",
      "my_reports": "My Reports",
      "admin_dash": "Admin Dash",
      "login": "Login",
      "logout": "Logout",
      "submit_report_title": "Report an Issue",
    }
  },
  hi: {
    translation: {
      "home": "होम",
      "report_issue": "समस्या दर्ज करें",
      "my_reports": "मेरी शिकायतें",
      "admin_dash": "प्रशासन डैशबोर्ड",
      "login": "लॉग इन",
      "logout": "लॉग आउट",
      "submit_report_title": "समस्या दर्ज करें",
    }
  },
  mr: {
    translation: {
      "home": "मुख्यपृष्ठ",
      "report_issue": "तक्रार नोंदवा",
      "my_reports": "माझ्या तक्रारी",
      "admin_dash": "प्रशासन डॅशबोर्ड",
      "login": "लॉग इन",
      "logout": "लॉग आउट",
      "submit_report_title": "समस्या नोंदवा",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
