import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import './ContactsPage.css';
import Footer from '@components/app/Footer';
const ContactsPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => (Object.assign(Object.assign({}, prevState), { [name]: value })));
    };
    const handleSubmit = (e) => {
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
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "contact-page", children: _jsxs("div", { className: "contact-container", children: [_jsx("h1", { className: "contact-heading", children: "Contact Us" }), _jsx("p", { className: "contact-intro", children: "Have questions, suggestions, or feedback? We'd love to hear from you! Fill out the form below, and we'll get back to you as soon as possible." }), isSubmitted ? (_jsx("div", { className: "contact-thank-you", children: "Thank you for your message! We'll be in touch soon." })) : (_jsxs("form", { className: "contact-form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "contact-form-group", children: [_jsx("label", { htmlFor: "name", children: "Name" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleChange, required: true, placeholder: "Your Name" })] }), _jsxs("div", { className: "contact-form-group", children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleChange, required: true, placeholder: "your.email@example.com" })] }), _jsxs("div", { className: "contact-form-group", children: [_jsx("label", { htmlFor: "subject", children: "Subject" }), _jsx("input", { type: "text", id: "subject", name: "subject", value: formData.subject, onChange: handleChange, required: true, placeholder: "What is this regarding?" })] }), _jsxs("div", { className: "contact-form-group", children: [_jsx("label", { htmlFor: "message", children: "Message" }), _jsx("textarea", { id: "message", name: "message", rows: 6, value: formData.message, onChange: handleChange, required: true, placeholder: "Your detailed message..." })] }), _jsx("button", { type: "submit", className: "contact-submit-button", disabled: isSubmitting, children: isSubmitting ? 'Sending...' : 'Send Message' })] })), _jsxs("div", { className: "contact-alternative", children: [_jsx("h2", { children: "Other Ways to Reach Us" }), _jsxs("p", { children: ["For general inquiries, you can also reach out to us at: ", _jsx("a", { href: "mailto:support@movieq.com", children: "movieq3231@gmail.com" })] })] })] }) }), _jsx(Footer, {})] }));
};
export default ContactsPage;
