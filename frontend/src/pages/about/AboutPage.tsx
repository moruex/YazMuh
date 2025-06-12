// src/pages/about/AboutPage.tsx
import React from 'react';
import './AboutPage.css';
import Footer from '@components/app/Footer';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <>
            <div className="about-page">
                <div className="about-container">
                    <h1 className="about-heading">{t('aboutMovieQ')}</h1>

                    <section className="about-section">
                        <h2>{t('ourMission')}</h2>
                        <p>{t('aboutMissionText')}</p>
                    </section>

                    <section className="about-section">
                        <h2>{t('whatWeOffer')}</h2>
                        <ul>
                            <li>{t('aboutOffer1')}</li>
                            <li>{t('aboutOffer2')}</li>
                            <li>{t('aboutOffer3')}</li>
                            <li>{t('aboutOffer4')}</li>
                            <li>{t('aboutOffer5')}</li>
                            <li>{t('aboutOffer6')}</li>
                            <li>{t('aboutOffer7')}</li>
                            <li>{t('aboutOffer8')}</li>
                        </ul>
                        <p>{t('aboutEnjoyTool')}</p>
                    </section>

                    <section className="about-section">
                        <h2>{t('projectDetails')}</h2>
                        <p><strong>{t('category')}</strong> {t('categoryValue')}</p>
                        <p><strong>{t('inspiredBy')}</strong> <a href="https://imdb.com" target="_blank" rel="noopener noreferrer">imdb.com</a>, <a href="https://rottentomatoes.com" target="_blank" rel="noopener noreferrer">rottentomatoes.com</a>, <a href="https://rezka.ag" target="_blank" rel="noopener noreferrer">rezka.ag</a></p>
                        <p><strong>{t('website')}</strong> movieq.com.tr</p>
                    </section>

                    <section className="about-section">
                        <h2>{t('createdBy')}</h2>
                        <div className='university'>
                            <img src="/sdu.svg" alt="Suleyman Demirel University Logo" className="ab-logo" />
                            {t('sduName')}
                        </div>
                        <ul>
                            <li><a href='https://github.com/crusinistaken'>Semih Çantal</a></li>
                            <li><a href='https://github.com/akifbnc'>Akif Tarık Binici</a></li>
                            <li><a href='https://github.com/ylyas2004'>Ylyas Yylkybayev</a></li>
                            <li><a href='https://github.com/moruex'>Furkan Sayar</a></li>
                            <li><a href='https://github.com/akin1176'>Abdullah Kural</a></li>
                        </ul>
                    </section>

                </div>
            </div>
            <Footer />
        </>
    );
};

export default AboutPage;
