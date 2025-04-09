// src/pages/about/AboutPage.tsx
import React from 'react';
import './AboutPage.css';
import Footer from '@components/app/Footer';

const AboutPage: React.FC = () => {
    return (
        <>
            <div className="about-page">
                <div className="about-container">
                    <h1 className="about-heading">About MovieQ</h1>

                    <section className="about-section">
                        <h2>Our Mission</h2>
                        <p>
                            MovieQ is a user-friendly movie review platform designed for film enthusiasts. Our goal is to create a space where you can discover, discuss, and organize your cinematic journey.
                        </p>
                    </section>

                    <section className="about-section">
                        <h2>What We Offer</h2>
                        <ul>
                            <li>Stay updated on both new releases and classic films.</li>
                            <li>Rate movies and read reviews from fellow users.</li>
                            <li>Leave your own comments and engage in discussions.</li>
                            <li>Build and manage your personal watchlist.</li>
                            <li>Mark films you've already seen.</li>
                            <li>Curate a list of your favorite movies.</li>
                            <li>Follow the latest movie news and developments.</li>
                            <li>Easily find films using our advanced filtering system.</li>
                        </ul>
                        <p>
                            If you're a movie lover, we believe you'll find MovieQ a valuable and enjoyable tool!
                        </p>
                    </section>

                    <section className="about-section">
                        <h2>Project Details</h2>
                        <p><strong>Category:</strong> Film Platform & Community</p>
                        <p><strong>Inspired By:</strong> <a href="https://imdb.com" target="_blank" rel="noopener noreferrer">imdb.com</a>, <a href="https://rottentomatoes.com" target="_blank" rel="noopener noreferrer">rottentomatoes.com</a>, <a href="https://rezka.ag" target="_blank" rel="noopener noreferrer">rezka.ag</a></p>
                        <p><strong>Website:</strong> movieq.com.tr</p>
                    </section>

                    <section className="about-section">
                        <h2>Created By</h2>
                        <div className='university'>
                            <img src="/src/assets/flags/sdu.svg" alt="Suleyman Demirel University Logo" className="ab-logo" />
                            Suleyman Demirel University
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
