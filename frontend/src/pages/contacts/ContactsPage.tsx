import React, { useState } from 'react';
import './ContactsPage.css';
import Footer from '@components/app/Footer';

const ContactsPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 

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
                    <h1 className="contact-heading">Contact Us</h1>
                    <p className="contact-intro">
                        Have questions, suggestions, or feedback? We'd love to hear from you! Fill out the form below, and we'll get back to you as soon as possible.
                    </p>

                    {isSubmitted ? (
                        <div className="contact-thank-you">
                            Thank you for your message! We'll be in touch soon.
                        </div>
                    ) : (
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="contact-form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Your Name"
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="your.email@example.com"
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder="What is this regarding?"
                                />
                            </div>
                            <div className="contact-form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={6}
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    placeholder="Your detailed message..."
                                />
                            </div>
                            <button type="submit" className="contact-submit-button" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}

                    <div className="contact-alternative">
                        <h2>Other Ways to Reach Us</h2>
                        <p>
                            For general inquiries, you can also reach out to us at: <a href="mailto:support@movieq.com">movieq3231@gmail.com</a>
                        </p>
                        {}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default ContactsPage;
