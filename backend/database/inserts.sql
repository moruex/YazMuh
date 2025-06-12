--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-06-10 10:37:36

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5118 (class 0 OID 18903)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (0, 'Ylyas', 'Yylkybayev', 'ylyas04', 'itisylyas2004@gmail.com', '1234', 'https://lh3.googleusercontent.com/ogw/AF2bZyhG0xthRbEA0XtfJZSOSbPYMNwToUnm_TPaiFdRxac6EpA=s512-c-mo', '1234', '2025-05-14 17:33:13.979887+03', '2025-05-15 14:34:19.605324+03');
INSERT INTO public.users VALUES (1, 'Admin', 'Admin', 'admin', 'admin@gmail.com', '$2b$12$/.Oqw7TjcB7/kd1zsjyjdeE01RFRMF6X3PWv5MeINR2ID.Qlpn0i6', 'https://lh3.googleusercontent.com/ogw/AF2bZyhG0xthRbEA0XtfJZSOSbPYMNwToUnm_TPaiFdRxac6EpA=s512-c-mo', 'Admin', '2025-05-15 14:39:09.469156+03', '2025-05-15 14:39:09.469156+03');
INSERT INTO public.users VALUES (2, NULL, NULL, 'ylyas01', 'yylkybayewylyas@gmail.com', '$2a$12$stu/hnaVJx6wKGt0p2Ixz.bqdrBk9Yx8wgMOvJtMS..KiGKg0BKqe', NULL, NULL, '2025-05-28 22:10:53.266456+03', '2025-05-28 22:10:53.266456+03');
INSERT INTO public.users VALUES (3, NULL, NULL, 'user', 'user@gmail.com', '$2a$12$xZALqJdIjwSz8UDohDOktOUNmUJTlg/O4j4FZMEdi98N9hhrpWV3u', 'https://upload.wikimedia.org/wikipedia/tr/3/30/NarutoUzumaki.jpg', NULL, '2025-06-09 13:22:48.89573+03', '2025-06-09 14:57:05.050578+03');


--
-- TOC entry 5120 (class 0 OID 18912)
-- Dependencies: 219
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admins VALUES (0, 0, 'ylyas04', '$2b$12$kiUs7tIZ4zIoR1QTWJssPO699nIx1N2hdTGINR.GVFbmpL4w1aFTK', 'SUPER_ADMIN');
INSERT INTO public.admins VALUES (2, 1, 'admin', '$2b$12$6egAo2hEpWVQq6N52bTr5.HoQ2IPzqegqJZuWA74IdXv1Ut0uJqaG', 'ADMIN');


--
-- TOC entry 5134 (class 0 OID 18967)
-- Dependencies: 233
-- Data for Name: censorship_reasons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.censorship_reasons VALUES ('0', 'Spoiler', true);
INSERT INTO public.censorship_reasons VALUES ('1', 'Inappropriate Language', true);


--
-- TOC entry 5126 (class 0 OID 18933)
-- Dependencies: 225
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.movies VALUES (7, 'wfegfv', '2025-05-28', 'dbfgvc', 'hgfb', 0, 'fdghmgnbvc', 8.00, 0.0, 0.0, '2025-06-09 18:46:07.290007+03', 'wfegfv');
INSERT INTO public.movies VALUES (5, 'The Shawshank Redemption', '1994-06-11', 'A banker convicted of uxoricide forms a friendship over a quarter century with a hardened convict, while maintaining his innocence and trying to remain hopeful through simple compassion.', 'https://images.squarespace-cdn.com/content/v1/657716dc6cd59d329f8cc943/1702303456952-89SVMRXKDUZ65S4279HJ/TSRL+Poster.jpg', 142, 'https://youtu.be/PLl99DlL6b4?si=h9jCF1SApKvrPRqS', 8.00, 9.3, 8.8, '2025-06-09 18:54:41.449149+03', 'the-shawshank-redemption');
INSERT INTO public.movies VALUES (6, 'The Godfather', '1972-06-04', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', 'https://m.media-amazon.com/images/M/MV5BNGEwYjgwOGQtYjg5ZS00Njc1LTk2ZGEtM2QwZWQ2NjdhZTE5XkEyXkFqcGc@._V1_QL75_UY281_CR4,0,190,281_.jpg', 175, 'https://youtu.be/UaVTIH8mujA?si=ZfAER0MZJN5H9Mgv', 8.50, 9.2, 9.0, '2025-06-09 18:54:41.449149+03', 'the-godfather');
INSERT INTO public.movies VALUES (3, 'Venom 3', '2025-04-24', 'Venom 3', 'https://static.hdrezka.ac/i/2025/1/14/d8b79442a1034sd97p69e.jpg', 210, '', 7.00, 9.0, 9.0, '2025-06-09 18:57:55.000375+03', 'venom-3');


--
-- TOC entry 5130 (class 0 OID 18950)
-- Dependencies: 229
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.comments VALUES (0, 0, 3, 'Hello', NULL, 6, false, '2025-05-15 16:21:11.940146+03', '2025-05-15 16:21:11.940146+03');
INSERT INTO public.comments VALUES (1, 2, 6, 'hello i am ylyas04', NULL, 0, false, '2025-05-28 22:47:56.712611+03', '2025-05-28 22:47:56.712611+03');
INSERT INTO public.comments VALUES (4, 2, 5, 'How are you?', NULL, 0, false, '2025-05-28 22:49:23.450139+03', '2025-05-28 22:49:23.450139+03');
INSERT INTO public.comments VALUES (3, 2, 3, 'Hi', NULL, 0, true, '2025-05-28 22:49:04.080194+03', '2025-05-28 22:54:13.329974+03');
INSERT INTO public.comments VALUES (5, 3, 6, 'hi ylyas!', NULL, 0, false, '2025-06-09 13:23:53.630308+03', '2025-06-09 13:23:53.630308+03');


--
-- TOC entry 5135 (class 0 OID 18973)
-- Dependencies: 234
-- Data for Name: comment_censorship_log; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.comment_censorship_log VALUES (1, 3, 0, '0', NULL, '2025-05-28 22:54:13.329974+03', 'Hi');


--
-- TOC entry 5132 (class 0 OID 18961)
-- Dependencies: 231
-- Data for Name: comment_likes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5124 (class 0 OID 18925)
-- Dependencies: 223
-- Data for Name: genres; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.genres VALUES (3, '2025 Movies', '', 'https://static.hdrezka.ac/i/2024/7/22/nd054a71c1e0fxi19u99m.jpg', true, '2025-movies');
INSERT INTO public.genres VALUES (4, 'Family', '', '', false, 'family');
INSERT INTO public.genres VALUES (1, 'Comedy', '', '', false, 'comedy');
INSERT INTO public.genres VALUES (5, 'Action', '', '', false, 'action');
INSERT INTO public.genres VALUES (6, 'Animation', '', '', false, 'animation');
INSERT INTO public.genres VALUES (7, 'Documentary', '', '', false, 'documentary');
INSERT INTO public.genres VALUES (8, 'Science Fiction', '', '', false, 'science-fiction');
INSERT INTO public.genres VALUES (9, 'Biography', '', '', false, 'biography');
INSERT INTO public.genres VALUES (12, 'Romance', '', '', false, 'romance');
INSERT INTO public.genres VALUES (13, 'Horror', '', '', false, 'horror');
INSERT INTO public.genres VALUES (14, 'Adventure', '', '', false, 'adventure');
INSERT INTO public.genres VALUES (15, 'Thriller', '', '', false, 'thriller');
INSERT INTO public.genres VALUES (10, 'Drama', '', '', false, 'drama');
INSERT INTO public.genres VALUES (11, 'Fantasy', '', '', false, 'fantasy');


--
-- TOC entry 5122 (class 0 OID 18918)
-- Dependencies: 221
-- Data for Name: persons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.persons VALUES (8, 'Tim Robbins', 'Born in West Covina, California, but raised in New York City, Tim Robbins is the son of former The Highwaymen singer Gil Robbins and actress Mary Robbins (née Bledsoe). Robbins studied drama at UCLA, where he graduated with honors in 1981. ', '2025-06-19', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRPSAHPPPKqjoW1B5LQSY5bd4IipXkHCs_Ew&s', 'tim-robbins');
INSERT INTO public.persons VALUES (5, 'Tom Hardy', 'Hello man', '1977-09-16', 'https://static.hdrezka.ac/i/2016/3/10/q4cc01fedbec8tk54v94z.jpg', 'tom-hardy');
INSERT INTO public.persons VALUES (9, 'Frank Darabont', 'Three-time Oscar nominee Frank Darabont was born in a refugee camp in 1959 in Montbeliard, France, the son of Hungarian parents who had fled Budapest during the failed 1956 Hungarian revolution. Brought to America as an infant, he settled with his family in Los Angeles and attended Hollywood High School. His first job in movies was as a production assistant on the 1981 low-budget film, Hell Night (1981), starring Linda Blair. He spent the next six years working in the art department as a set dresser and in set construction while struggling to establish himself as a writer. His first produced writing credit (shared) was on the 1987 film, A Nightmare on Elm Street 3: Dream Warriors (1987), directed by Chuck Russell. Darabont is one of only six filmmakers in history with the unique distinction of having his first two feature films receive nominations for the Best Picture Academy Award: 1994''s The Shawshank Redemption (1994) (with a total of seven nominations) and 1999''s The Green Mile (1999) (four nominations). Darabont himself collected Oscar nominations for Best Adapted Screenplay for each film (both based on works by Stephen King), as well as nominations for both films from the Director''s Guild of America, and a nomination from the Writers Guild of America for The Shawshank Redemption (1994). ', NULL, NULL, 'frank-darabont');
INSERT INTO public.persons VALUES (7, 'Morgan Freeman', 'With an authoritative voice and calm demeanor, this ever popular American actor has grown into one of the most respected figures in modern US cinema. Morgan was born on June 1, 1937 in Memphis, Tennessee, to Mayme Edna (Revere), a teacher, and Morgan Porterfield Freeman, a barber. The young Freeman attended Los Angeles City College before serving several years in the US Air Force as a mechanic between 1955 and 1959. His first dramatic arts exposure was on the stage including appearing in an all-African American production of the exuberant musical Hello, Dolly!.', '1990-07-02', 'https://m.media-amazon.com/images/M/MV5BMTc0MDMyMzI2OF5BMl5BanBnXkFtZTcwMzM2OTk1MQ@@._V1_.jpg', 'morgan-freeman');


--
-- TOC entry 5128 (class 0 OID 18944)
-- Dependencies: 227
-- Data for Name: movie_crew; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5129 (class 0 OID 18947)
-- Dependencies: 228
-- Data for Name: movie_genres; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.movie_genres VALUES (3, 1);
INSERT INTO public.movie_genres VALUES (5, 10);
INSERT INTO public.movie_genres VALUES (6, 10);
INSERT INTO public.movie_genres VALUES (6, 5);
INSERT INTO public.movie_genres VALUES (7, 5);


--
-- TOC entry 5153 (class 0 OID 19292)
-- Dependencies: 252
-- Data for Name: movie_person_roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.movie_person_roles VALUES (15, 3, 6, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-14 21:19:30.090216+03');
INSERT INTO public.movie_person_roles VALUES (22, 4, 5, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-14 21:20:06.966601+03');
INSERT INTO public.movie_person_roles VALUES (23, 5, 7, 'ACTOR', NULL, 1, NULL, NULL, '2025-05-21 16:56:33.542937+03');
INSERT INTO public.movie_person_roles VALUES (26, 5, 8, 'ACTOR', NULL, 2, NULL, NULL, '2025-05-21 16:56:33.571444+03');
INSERT INTO public.movie_person_roles VALUES (24, 5, 9, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-21 16:56:33.546666+03');
INSERT INTO public.movie_person_roles VALUES (29, 7, 8, 'ACTOR', NULL, 1, NULL, NULL, '2025-05-28 17:15:42.919344+03');
INSERT INTO public.movie_person_roles VALUES (30, 7, 7, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-28 17:15:42.925254+03');
INSERT INTO public.movie_person_roles VALUES (31, 6, 9, 'ACTOR', NULL, 1, NULL, NULL, '2025-05-28 17:38:31.519531+03');
INSERT INTO public.movie_person_roles VALUES (35, 6, 8, 'ACTOR', NULL, 2, NULL, NULL, '2025-05-28 17:38:31.588295+03');
INSERT INTO public.movie_person_roles VALUES (38, 6, 7, 'ACTOR', NULL, 3, NULL, NULL, '2025-05-28 17:38:31.614386+03');
INSERT INTO public.movie_person_roles VALUES (39, 6, 5, 'ACTOR', NULL, 4, NULL, NULL, '2025-05-28 17:38:31.624737+03');
INSERT INTO public.movie_person_roles VALUES (32, 6, 9, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-28 17:38:31.528324+03');
INSERT INTO public.movie_person_roles VALUES (34, 6, 7, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-28 17:38:31.586498+03');
INSERT INTO public.movie_person_roles VALUES (36, 6, 8, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-28 17:38:31.600881+03');
INSERT INTO public.movie_person_roles VALUES (37, 6, 5, 'CREW', NULL, NULL, 'Director', 'Directing', '2025-05-28 17:38:31.610027+03');
INSERT INTO public.movie_person_roles VALUES (47, 3, 5, 'ACTOR', NULL, 1, NULL, NULL, '2025-05-28 22:51:25.749767+03');


--
-- TOC entry 5137 (class 0 OID 18981)
-- Dependencies: 236
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.news VALUES (0, 'Hello', 'Hello', 'Hello', NULL, 'Hello', '2025-05-15 15:21:18.78179+03', '2025-05-15 15:21:18.78179+03');
INSERT INTO public.news VALUES (1, 'Sci-Fi Epic "Nebula Rising" Breaks Box Office Records', 'Interstellar adventure film earns $350M in opening weekend', 'Director Lena Zhao''s space opera "Nebula Rising" has shattered expectations with record-breaking global earnings. The film''s groundbreaking visual effects and emotional storyline about generational space colonists have resonated with audiences worldwide. Industry analysts predict it could surpass $1B within 3 weeks.', NULL, 'https://example.com/nebula_rising.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (2, 'Vintage Hollywood Biopic Enters Awards Season Race', 'Renowned actor transforms into classic film legend', 'The upcoming biopic "Silver Screen Magic" featuring Daniel Thorne as 1940s superstar Robert Vance is generating Oscar buzz after early screenings. Costume designers recreated 37 iconic outfits from Vance''s films using original techniques. The film releases November 15.', NULL, 'https://example.com/silver_screen.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (3, 'Animated Sequel "Paws & Claws 3" Releases First Trailer', 'Beloved animal heroes return for new adventure', 'Studio Animax unveiled the first trailer for the third installment of their hit franchise, featuring new voice cast members. This time, the furry heroes face climate challenges in the Arctic while discovering ancient animal civilizations. Environmental themes dominate this chapter.', NULL, 'https://example.com/paws_claws3.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (4, 'Classic 80s Fantasy Film Gets Modern Reimagining', 'Practical effects meet CGI in "Labyrinth Rebom"', 'Director Chloe Finch confirms her remake will honor the practical puppetry of the 1986 original while expanding the magical universe. Casting announcements reveal Grammy-winning artist Maya Rivera as the Goblin Queen. Production begins this fall in Prague.', NULL, 'https://example.com/labyrinth_remake.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (5, 'Documentary Exposes Golden Age of Hong Kong Cinema', 'Forgotten martial arts masters finally get recognition', '"Dragon Shadows" explores the 1970s-90s Hong Kong film explosion through never-before-seen footage and interviews. The film reveals how stunt performers revolutionized action choreography while working with minimal safety equipment. Premiering at Cannes next month.', NULL, 'https://example.com/dragon_shadows.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (6, 'Marvel Announces Phase 6 Villain Casting', 'Oscar-winner joins superhero universe as cosmic threat', 'After months of speculation, Kevin Feige confirmed Javier Rodriguez will play the reality-warping antagonist in the upcoming "Avengers: Secret Wars". Rodriguez''s theater background brings new depth to the role. Filming begins January 2026.', NULL, 'https://example.com/marvel_villain.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (7, 'Indie Horror "Whispering Pines" Becomes Cult Hit', 'Micro-budget film terrifies festival audiences', 'Made for just $120,000, this psychological thriller about paranatural investigators in Appalachia has secured worldwide distribution after winning Best Feature at ScreamFest. Critics praise its atmospheric tension and authentic folk horror elements.', NULL, 'https://example.com/whispering_pines.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (8, 'Historic Movie Palace Reopens After Restoration', '1927 Grand Cinema returns to original splendor', 'After a 5-year, $45M renovation, Los Angeles'' iconic movie theater reopened with a premiere of "Singing in the Rain". The restoration included recreating the original atmospheric ceiling with twinkling stars and cloud machines. Public tours begin next week.', NULL, 'https://example.com/movie_palace.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (9, 'Rom-Com Revival Hits Streaming Platforms', 'New wave of romantic films dominates digital charts', 'Platforms report 300% increase in rom-com viewership as films like "The Paris Misunderstanding" and "Wedding Crashers 2" break records. Analysts attribute this to post-pandemic demand for uplifting content. Several theatrical releases now fast-tracked.', NULL, 'https://example.com/romcom_revival.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');
INSERT INTO public.news VALUES (10, 'Method Actor Hospitalized After Extreme Preparation', 'Star lost 60 pounds for prison drama role', 'During filming of "Stone Walls", actor Ethan Blackwell required medical intervention after extreme weight loss for his role as a death row inmate. The incident has reignited debates about acting techniques and studio duty of care. The film''s release may be delayed.', NULL, 'https://example.com/method_actor.jpg', '2025-05-28 18:13:32.513586+03', '2025-05-28 18:13:32.513586+03');


--
-- TOC entry 5139 (class 0 OID 18990)
-- Dependencies: 238
-- Data for Name: news_movies; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5140 (class 0 OID 18993)
-- Dependencies: 239
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quiz_questions VALUES (1, 'Who are you?123456', 1);
INSERT INTO public.quiz_questions VALUES (8, 'Who are you?132456u', 1);
INSERT INTO public.quiz_questions VALUES (7, 'Who are you?', 1);


--
-- TOC entry 5142 (class 0 OID 19002)
-- Dependencies: 241
-- Data for Name: quiz_choices; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.quiz_choices VALUES (11, 1, 'gbfvdc', 'https://static.hdrezka.ac/i/2020/12/26/na1c844e25dabbb53r41x.jpg');
INSERT INTO public.quiz_choices VALUES (12, 1, 'gbfvdc456', 'https://static.hdrezka.ac/i/2024/7/22/nd054a71c1e0fxi19u99m.jpg');
INSERT INTO public.quiz_choices VALUES (13, 8, 'ertgfd', 'https://static.hdrezka.ac/i/2024/7/22/nd054a71c1e0fxi19u99m.jpg');
INSERT INTO public.quiz_choices VALUES (14, 7, 'gbfvdc', 'https://static.hdrezka.ac/i/2024/7/22/nd054a71c1e0fxi19u99m.jpg');


--
-- TOC entry 5148 (class 0 OID 19036)
-- Dependencies: 247
-- Data for Name: recommendation_sections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.recommendation_sections VALUES (0, 'Popular', 'POPULAR', NULL, 0, true, '2025-05-15 15:07:29.081825+03');
INSERT INTO public.recommendation_sections VALUES (2, 'From Admin', 'ADMIN_DEFINED', NULL, 2, true, '2025-05-28 17:30:11.787804+03');
INSERT INTO public.recommendation_sections VALUES (4, 'Most Commented', 'MOST_COMMENTED', NULL, 4, true, '2025-05-28 23:25:28.648262+03');
INSERT INTO public.recommendation_sections VALUES (5, 'Most Rated', 'MOST_RATED', NULL, 5, true, '2025-05-28 23:25:36.868795+03');
INSERT INTO public.recommendation_sections VALUES (1, 'Latest', 'LATEST', NULL, 1, true, '2025-05-28 23:46:24.44497+03');


--
-- TOC entry 5150 (class 0 OID 19047)
-- Dependencies: 249
-- Data for Name: recommendation_section_movies; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.recommendation_section_movies VALUES (3, 0, 3, 1, '2025-05-15 15:07:21.996483+03');
INSERT INTO public.recommendation_section_movies VALUES (6, 1, 5, 1, '2025-05-28 17:05:56.951752+03');
INSERT INTO public.recommendation_section_movies VALUES (10, 2, 6, 0, '2025-05-28 17:30:11.784425+03');
INSERT INTO public.recommendation_section_movies VALUES (11, 4, 3, 0, '2025-05-28 23:25:28.57083+03');
INSERT INTO public.recommendation_section_movies VALUES (12, 4, 5, 1, '2025-05-28 23:25:28.644328+03');
INSERT INTO public.recommendation_section_movies VALUES (13, 5, 5, 0, '2025-05-28 23:25:36.785502+03');
INSERT INTO public.recommendation_section_movies VALUES (14, 5, 6, 1, '2025-05-28 23:25:36.864288+03');
INSERT INTO public.recommendation_section_movies VALUES (15, 1, 6, 1, '2025-05-28 23:46:20.817963+03');
INSERT INTO public.recommendation_section_movies VALUES (16, 1, 3, 2, '2025-05-28 23:46:24.440783+03');


--
-- TOC entry 5155 (class 0 OID 19304)
-- Dependencies: 254
-- Data for Name: user_movie_lists; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_movie_lists VALUES (4, 3, 3, 'WATCHLIST', '2025-06-09 18:26:48.321175+03');
INSERT INTO public.user_movie_lists VALUES (5, 3, 5, 'WATCHLIST', '2025-06-09 18:27:03.593545+03');
INSERT INTO public.user_movie_lists VALUES (8, 3, 5, 'FAVORITES', '2025-06-09 19:01:02.884078+03');
INSERT INTO public.user_movie_lists VALUES (9, 3, 6, 'WATCHED', '2025-06-09 19:23:24.486038+03');


--
-- TOC entry 5144 (class 0 OID 19009)
-- Dependencies: 243
-- Data for Name: user_quiz_answers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5146 (class 0 OID 19028)
-- Dependencies: 245
-- Data for Name: user_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_ratings VALUES (44, 2, 6, 9, '2025-05-28 22:42:53.519123+03', '2025-06-09 18:54:41.449149+03');
INSERT INTO public.user_ratings VALUES (75, 3, 5, 8, '2025-06-09 17:41:18.526358+03', '2025-06-09 18:54:41.449149+03');
INSERT INTO public.user_ratings VALUES (94, 3, 6, 8, '2025-06-09 18:51:30.121079+03', '2025-06-09 18:54:41.449149+03');
INSERT INTO public.user_ratings VALUES (96, 3, 3, 7, '2025-06-09 18:57:55.000375+03', '2025-06-09 18:57:55.000375+03');


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 220
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admins_id_seq', 2, true);


--
-- TOC entry 5162 (class 0 OID 0)
-- Dependencies: 235
-- Name: comment_censorship_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comment_censorship_log_id_seq', 1, true);


--
-- TOC entry 5163 (class 0 OID 0)
-- Dependencies: 232
-- Name: comment_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comment_likes_id_seq', 1, false);


--
-- TOC entry 5164 (class 0 OID 0)
-- Dependencies: 230
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 5, true);


--
-- TOC entry 5165 (class 0 OID 0)
-- Dependencies: 224
-- Name: genres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.genres_id_seq', 15, true);


--
-- TOC entry 5166 (class 0 OID 0)
-- Dependencies: 251
-- Name: movie_person_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movie_person_roles_id_seq', 48, true);


--
-- TOC entry 5167 (class 0 OID 0)
-- Dependencies: 226
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movies_id_seq', 7, true);


--
-- TOC entry 5168 (class 0 OID 0)
-- Dependencies: 237
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_id_seq', 1, false);


--
-- TOC entry 5169 (class 0 OID 0)
-- Dependencies: 222
-- Name: persons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.persons_id_seq', 10, true);


--
-- TOC entry 5170 (class 0 OID 0)
-- Dependencies: 242
-- Name: quiz_choices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_choices_id_seq', 14, true);


--
-- TOC entry 5171 (class 0 OID 0)
-- Dependencies: 240
-- Name: quiz_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_questions_id_seq', 8, true);


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 250
-- Name: recommendation_section_movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recommendation_section_movies_id_seq', 16, true);


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 248
-- Name: recommendation_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recommendation_sections_id_seq', 1, false);


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 253
-- Name: user_movie_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_movie_lists_id_seq', 9, true);


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 244
-- Name: user_quiz_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_quiz_answers_id_seq', 1, false);


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 246
-- Name: user_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_ratings_id_seq', 96, true);


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


-- Completed on 2025-06-10 10:37:37

--
-- PostgreSQL database dump complete
--

