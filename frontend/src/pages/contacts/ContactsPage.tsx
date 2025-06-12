import React, { useState } from 'react';
import './ContactsPage.css';
import Footer from '@components/app/Footer';
import { useTranslation } from 'react-i18next';

const ContactsPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const { t } = useTranslation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true); 
        
        console.log('Form data submitted:', formData);
        
        setTimeout(() => {
            setIsSubmitted(true);
            setIsSubmitting(false); 
            setFormData({ name: '', email: '', subject: '', message: '' }); 
            
            setTimeout(() => setIsSubmitted(false), 5000);
        }, 1500); 
    };

    return (
        <>
            <div className="contact-page">
                <div className="contact-container">
                    <h1 className="contact-heading">{t('contactUs')}</h1>
                    <p className="contact-intro">
                        {t('contactIntro')}
                    </p>

                    {isSubmitted ? (
                        <div className="contact-thank-you">
                            {t('contactThankYou')}
                        </div>
                    ) : (
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="contact-form-group">
                                <label htmlFor="name">{t('name')}</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('yourName')}
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="email">{t('email')}</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('yourEmail')}
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="subject">{t('subject')}</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('subjectPlaceholder')}
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="message">{t('message')}</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('messagePlaceholder')}
                                />
                            </div>
                            <button type="submit" className="contact-submit-button" disabled={isSubmitting}>
                                {isSubmitting ? t('sending') : t('sendMessage')}
                            </button>
                        </form>
                    )}

                    <div className="contact-alternative">
                        <h2>{t('otherWaysToReachUs')}</h2>
                        <p>
                            {t('generalInquiries')} <a href="mailto:support@movieq.com">movieq3231@gmail.com</a>
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ContactsPage;
