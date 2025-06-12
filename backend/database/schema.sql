--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-06-10 10:40:00

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
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- CREATE SCHEMA public;


--
-- TOC entry 887 (class 1247 OID 18878)
-- Name: admin_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_role AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'CONTENT_MODERATOR'
);


--
-- TOC entry 890 (class 1247 OID 18886)
-- Name: role_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_type AS ENUM (
    'actor',
    'director',
    'writer',
    'producer',
    'cinematographer',
    'composer'
);

--
-- TOC entry 255 (class 1255 OID 18899)
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


--
-- TOC entry 257 (class 1255 OID 18901)
-- Name: update_comment_likes_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_comment_likes_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_comment_id INTEGER;
BEGIN
   IF (TG_OP = 'DELETE') THEN
        v_comment_id = OLD.comment_id;
        UPDATE public.comments SET likes_count = likes_count - 1
        WHERE id = v_comment_id AND likes_count > 0;
        RETURN OLD;
   ELSIF (TG_OP = 'INSERT') THEN
        v_comment_id = NEW.comment_id;
        UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = v_comment_id;
        RETURN NEW;
   END IF;
   RETURN NULL;
END;
$$;


--
-- TOC entry 258 (class 1255 OID 18902)
-- Name: update_movie_avg_rating(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_movie_avg_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_movie_id INTEGER;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_movie_id := OLD.movie_id;
  ELSE
    v_movie_id := NEW.movie_id;
  END IF;

  UPDATE public.movies
  SET movieq_rating = COALESCE(
                      (SELECT AVG(rating)::numeric(3,2) FROM public.user_ratings WHERE movie_id = v_movie_id),
                      0.00
                   )
  WHERE id = v_movie_id;

  RETURN NULL; -- For AFTER triggers
END;
$$;


--
-- TOC entry 219 (class 1259 OID 18912)
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.admin_role DEFAULT 'ADMIN'::public.admin_role NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 18916)
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5172 (class 0 OID 0)
-- Dependencies: 220
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- TOC entry 233 (class 1259 OID 18967)
-- Name: censorship_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.censorship_reasons (
    reason_code character varying(50) NOT NULL,
    description text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 18973)
-- Name: comment_censorship_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_censorship_log (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    admin_id integer NOT NULL,
    reason_code character varying(50) NOT NULL,
    admin_notes text,
    action_taken_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    original_content_snapshot text
);


--
-- TOC entry 235 (class 1259 OID 18979)
-- Name: comment_censorship_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_censorship_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 235
-- Name: comment_censorship_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_censorship_log_id_seq OWNED BY public.comment_censorship_log.id;


--
-- TOC entry 231 (class 1259 OID 18961)
-- Name: comment_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 18965)
-- Name: comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 232
-- Name: comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_likes_id_seq OWNED BY public.comment_likes.id;


--
-- TOC entry 229 (class 1259 OID 18950)
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    movie_id integer NOT NULL,
    content text NOT NULL,
    parent_comment_id integer,
    likes_count integer DEFAULT 0 NOT NULL,
    is_currently_censored boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 18959)
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 230
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- TOC entry 223 (class 1259 OID 18925)
-- Name: genres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.genres (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    image_url character varying(255),
    is_collection boolean DEFAULT false,
    slug character varying(255) NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 18931)
-- Name: genres_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.genres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 224
-- Name: genres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.genres_id_seq OWNED BY public.genres.id;


--
-- TOC entry 227 (class 1259 OID 18944)
-- Name: movie_crew; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movie_crew (
    movie_id integer NOT NULL,
    person_id integer NOT NULL,
    role public.role_type NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 18947)
-- Name: movie_genres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movie_genres (
    movie_id integer NOT NULL,
    genre_id integer NOT NULL
);


--
-- TOC entry 252 (class 1259 OID 19292)
-- Name: movie_person_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movie_person_roles (
    id integer NOT NULL,
    movie_id integer NOT NULL,
    person_id integer NOT NULL,
    role_type text NOT NULL,
    character_name text,
    "order" integer,
    job text,
    department text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 251 (class 1259 OID 19291)
-- Name: movie_person_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movie_person_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 251
-- Name: movie_person_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movie_person_roles_id_seq OWNED BY public.movie_person_roles.id;


--
-- TOC entry 225 (class 1259 OID 18933)
-- Name: movies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movies (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    release_date date,
    plot_summary text,
    poster_url character varying(255),
    duration_minutes integer,
    trailer_url character varying(255),
    movieq_rating numeric(3,2) DEFAULT 0.00,
    imdb_rating numeric(3,1) DEFAULT 0.0,
    letterboxd_rating numeric(3,1) DEFAULT 0.0,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    slug character varying(255) NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 18942)
-- Name: movies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 226
-- Name: movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movies_id_seq OWNED BY public.movies.id;


--
-- TOC entry 236 (class 1259 OID 18981)
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    short_content text,
    content text NOT NULL,
    author_id integer,
    image_url character varying(255),
    published_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 18988)
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 237
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- TOC entry 238 (class 1259 OID 18990)
-- Name: news_movies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_movies (
    news_id integer NOT NULL,
    movie_id integer NOT NULL
);


--
-- TOC entry 221 (class 1259 OID 18918)
-- Name: persons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persons (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    bio text,
    birth_date date,
    profile_image_url character varying(255),
    slug character varying(255) NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 18923)
-- Name: persons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.persons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 222
-- Name: persons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.persons_id_seq OWNED BY public.persons.id;


--
-- TOC entry 241 (class 1259 OID 19002)
-- Name: quiz_choices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_choices (
    id integer NOT NULL,
    question_id integer NOT NULL,
    choice_text character varying(255) NOT NULL,
    image_url character varying(255)
);


--
-- TOC entry 242 (class 1259 OID 19007)
-- Name: quiz_choices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_choices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 242
-- Name: quiz_choices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_choices_id_seq OWNED BY public.quiz_choices.id;


--
-- TOC entry 239 (class 1259 OID 18993)
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id integer NOT NULL,
    question_text text NOT NULL,
    allowed_choices_count integer DEFAULT 1 NOT NULL,
    CONSTRAINT quiz_questions_allowed_choices_count_check CHECK ((allowed_choices_count >= 1))
);


--
-- TOC entry 240 (class 1259 OID 19000)
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 240
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- TOC entry 249 (class 1259 OID 19047)
-- Name: recommendation_section_movies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommendation_section_movies (
    id integer NOT NULL,
    section_id integer NOT NULL,
    movie_id integer NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 250 (class 1259 OID 19052)
-- Name: recommendation_section_movies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recommendation_section_movies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 250
-- Name: recommendation_section_movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recommendation_section_movies_id_seq OWNED BY public.recommendation_section_movies.id;


--
-- TOC entry 247 (class 1259 OID 19036)
-- Name: recommendation_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recommendation_sections (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    section_type character varying(50) NOT NULL,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT recommendation_sections_section_type_check CHECK (((section_type)::text = ANY (ARRAY[('ADMIN_DEFINED'::character varying)::text, ('LATEST'::character varying)::text, ('POPULAR'::character varying)::text, ('MOST_RATED'::character varying)::text, ('MOST_COMMENTED'::character varying)::text])))
);


--
-- TOC entry 248 (class 1259 OID 19045)
-- Name: recommendation_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recommendation_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 248
-- Name: recommendation_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recommendation_sections_id_seq OWNED BY public.recommendation_sections.id;


--
-- TOC entry 254 (class 1259 OID 19304)
-- Name: user_movie_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_movie_lists (
    id integer NOT NULL,
    user_id integer NOT NULL,
    movie_id integer NOT NULL,
    list_type character varying(20) NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT user_movie_lists_list_type_check CHECK (((list_type)::text = ANY ((ARRAY['FAVORITES'::character varying, 'WATCHED'::character varying, 'WATCHLIST'::character varying])::text[])))
);


--
-- TOC entry 253 (class 1259 OID 19303)
-- Name: user_movie_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_movie_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 253
-- Name: user_movie_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_movie_lists_id_seq OWNED BY public.user_movie_lists.id;


--
-- TOC entry 243 (class 1259 OID 19009)
-- Name: user_quiz_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_quiz_answers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    question_id integer NOT NULL,
    choice_id integer NOT NULL,
    answered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 244 (class 1259 OID 19013)
-- Name: user_quiz_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_quiz_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 244
-- Name: user_quiz_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_quiz_answers_id_seq OWNED BY public.user_quiz_answers.id;


--
-- TOC entry 245 (class 1259 OID 19028)
-- Name: user_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_ratings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    movie_id integer NOT NULL,
    rating integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT user_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 10)))
);


--
-- TOC entry 246 (class 1259 OID 19034)
-- Name: user_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 246
-- Name: user_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_ratings_id_seq OWNED BY public.user_ratings.id;


--
-- TOC entry 217 (class 1259 OID 18903)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    avatar_url character varying(255),
    bio text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 18910)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4851 (class 2604 OID 18917)
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- TOC entry 4869 (class 2604 OID 18980)
-- Name: comment_censorship_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_censorship_log ALTER COLUMN id SET DEFAULT nextval('public.comment_censorship_log_id_seq'::regclass);


--
-- TOC entry 4866 (class 2604 OID 18966)
-- Name: comment_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes ALTER COLUMN id SET DEFAULT nextval('public.comment_likes_id_seq'::regclass);


--
-- TOC entry 4861 (class 2604 OID 18960)
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- TOC entry 4854 (class 2604 OID 18932)
-- Name: genres id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genres ALTER COLUMN id SET DEFAULT nextval('public.genres_id_seq'::regclass);


--
-- TOC entry 4889 (class 2604 OID 19295)
-- Name: movie_person_roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_person_roles ALTER COLUMN id SET DEFAULT nextval('public.movie_person_roles_id_seq'::regclass);


--
-- TOC entry 4856 (class 2604 OID 18943)
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- TOC entry 4871 (class 2604 OID 18989)
-- Name: news id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- TOC entry 4853 (class 2604 OID 18924)
-- Name: persons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persons ALTER COLUMN id SET DEFAULT nextval('public.persons_id_seq'::regclass);


--
-- TOC entry 4876 (class 2604 OID 19008)
-- Name: quiz_choices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_choices ALTER COLUMN id SET DEFAULT nextval('public.quiz_choices_id_seq'::regclass);


--
-- TOC entry 4874 (class 2604 OID 19001)
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 19053)
-- Name: recommendation_section_movies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_section_movies ALTER COLUMN id SET DEFAULT nextval('public.recommendation_section_movies_id_seq'::regclass);


--
-- TOC entry 4882 (class 2604 OID 19046)
-- Name: recommendation_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_sections ALTER COLUMN id SET DEFAULT nextval('public.recommendation_sections_id_seq'::regclass);


--
-- TOC entry 4891 (class 2604 OID 19307)
-- Name: user_movie_lists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_movie_lists ALTER COLUMN id SET DEFAULT nextval('public.user_movie_lists_id_seq'::regclass);


--
-- TOC entry 4877 (class 2604 OID 19014)
-- Name: user_quiz_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers ALTER COLUMN id SET DEFAULT nextval('public.user_quiz_answers_id_seq'::regclass);


--
-- TOC entry 4879 (class 2604 OID 19035)
-- Name: user_ratings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ratings ALTER COLUMN id SET DEFAULT nextval('public.user_ratings_id_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 18911)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4904 (class 2606 OID 19057)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 4906 (class 2606 OID 19103)
-- Name: admins admins_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);


--
-- TOC entry 4908 (class 2606 OID 19101)
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- TOC entry 4938 (class 2606 OID 19073)
-- Name: censorship_reasons censorship_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.censorship_reasons
    ADD CONSTRAINT censorship_reasons_pkey PRIMARY KEY (reason_code);


--
-- TOC entry 4940 (class 2606 OID 19075)
-- Name: comment_censorship_log comment_censorship_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_censorship_log
    ADD CONSTRAINT comment_censorship_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4932 (class 2606 OID 19071)
-- Name: comment_likes comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4934 (class 2606 OID 19107)
-- Name: comment_likes comment_likes_user_id_comment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_comment_id_key UNIQUE (user_id, comment_id);


--
-- TOC entry 4927 (class 2606 OID 19069)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4913 (class 2606 OID 19105)
-- Name: genres genres_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_name_key UNIQUE (name);


--
-- TOC entry 4915 (class 2606 OID 19061)
-- Name: genres genres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_pkey PRIMARY KEY (id);


--
-- TOC entry 4921 (class 2606 OID 19065)
-- Name: movie_crew movie_crew_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_crew
    ADD CONSTRAINT movie_crew_pkey PRIMARY KEY (movie_id, person_id, role);


--
-- TOC entry 4925 (class 2606 OID 19067)
-- Name: movie_genres movie_genres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT movie_genres_pkey PRIMARY KEY (movie_id, genre_id);


--
-- TOC entry 4980 (class 2606 OID 19302)
-- Name: movie_person_roles movie_person_roles_movie_id_person_id_role_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_person_roles
    ADD CONSTRAINT movie_person_roles_movie_id_person_id_role_type_key UNIQUE (movie_id, person_id, role_type);


--
-- TOC entry 4982 (class 2606 OID 19300)
-- Name: movie_person_roles movie_person_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_person_roles
    ADD CONSTRAINT movie_person_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 4917 (class 2606 OID 19063)
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- TOC entry 4950 (class 2606 OID 19079)
-- Name: news_movies news_movies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_movies
    ADD CONSTRAINT news_movies_pkey PRIMARY KEY (news_id, movie_id);


--
-- TOC entry 4946 (class 2606 OID 19077)
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- TOC entry 4911 (class 2606 OID 19059)
-- Name: persons persons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persons
    ADD CONSTRAINT persons_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 2606 OID 19083)
-- Name: quiz_choices quiz_choices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_choices
    ADD CONSTRAINT quiz_choices_pkey PRIMARY KEY (id);


--
-- TOC entry 4952 (class 2606 OID 19081)
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 4976 (class 2606 OID 19095)
-- Name: recommendation_section_movies recommendation_section_movies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_section_movies
    ADD CONSTRAINT recommendation_section_movies_pkey PRIMARY KEY (id);


--
-- TOC entry 4978 (class 2606 OID 19115)
-- Name: recommendation_section_movies recommendation_section_movies_section_id_movie_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_section_movies
    ADD CONSTRAINT recommendation_section_movies_section_id_movie_id_key UNIQUE (section_id, movie_id);


--
-- TOC entry 4970 (class 2606 OID 19093)
-- Name: recommendation_sections recommendation_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_sections
    ADD CONSTRAINT recommendation_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 4972 (class 2606 OID 19113)
-- Name: recommendation_sections recommendation_sections_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_sections
    ADD CONSTRAINT recommendation_sections_title_key UNIQUE (title);


--
-- TOC entry 4984 (class 2606 OID 19311)
-- Name: user_movie_lists user_movie_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_movie_lists
    ADD CONSTRAINT user_movie_lists_pkey PRIMARY KEY (id);


--
-- TOC entry 4986 (class 2606 OID 19313)
-- Name: user_movie_lists user_movie_lists_user_id_movie_id_list_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_movie_lists
    ADD CONSTRAINT user_movie_lists_user_id_movie_id_list_type_key UNIQUE (user_id, movie_id, list_type);


--
-- TOC entry 4960 (class 2606 OID 19085)
-- Name: user_quiz_answers user_quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 4962 (class 2606 OID 19117)
-- Name: user_quiz_answers user_quiz_answers_user_id_question_id_choice_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_user_id_question_id_choice_id_key UNIQUE (user_id, question_id, choice_id);


--
-- TOC entry 4966 (class 2606 OID 19091)
-- Name: user_ratings user_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ratings
    ADD CONSTRAINT user_ratings_pkey PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 19111)
-- Name: user_ratings user_ratings_user_id_movie_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ratings
    ADD CONSTRAINT user_ratings_user_id_movie_id_key UNIQUE (user_id, movie_id);


--
-- TOC entry 4898 (class 2606 OID 19099)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4900 (class 2606 OID 19055)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4902 (class 2606 OID 19097)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4909 (class 1259 OID 19262)
-- Name: idx_admins_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admins_user_id ON public.admins USING btree (user_id);


--
-- TOC entry 4941 (class 1259 OID 19273)
-- Name: idx_comment_censorship_log_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_censorship_log_admin_id ON public.comment_censorship_log USING btree (admin_id);


--
-- TOC entry 4942 (class 1259 OID 19272)
-- Name: idx_comment_censorship_log_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_censorship_log_comment_id ON public.comment_censorship_log USING btree (comment_id);


--
-- TOC entry 4943 (class 1259 OID 19274)
-- Name: idx_comment_censorship_log_reason_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_censorship_log_reason_code ON public.comment_censorship_log USING btree (reason_code);


--
-- TOC entry 4935 (class 1259 OID 19271)
-- Name: idx_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes USING btree (comment_id);


--
-- TOC entry 4936 (class 1259 OID 19270)
-- Name: idx_comment_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comment_likes_user_id ON public.comment_likes USING btree (user_id);


--
-- TOC entry 4928 (class 1259 OID 19268)
-- Name: idx_comments_movie_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_movie_id ON public.comments USING btree (movie_id);


--
-- TOC entry 4929 (class 1259 OID 19269)
-- Name: idx_comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_comment_id);


--
-- TOC entry 4930 (class 1259 OID 19267)
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);


--
-- TOC entry 4918 (class 1259 OID 19263)
-- Name: idx_movie_crew_movie_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_crew_movie_id ON public.movie_crew USING btree (movie_id);


--
-- TOC entry 4919 (class 1259 OID 19264)
-- Name: idx_movie_crew_person_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_crew_person_id ON public.movie_crew USING btree (person_id);


--
-- TOC entry 4922 (class 1259 OID 19266)
-- Name: idx_movie_genres_genre_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_genres_genre_id ON public.movie_genres USING btree (genre_id);


--
-- TOC entry 4923 (class 1259 OID 19265)
-- Name: idx_movie_genres_movie_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movie_genres_movie_id ON public.movie_genres USING btree (movie_id);


--
-- TOC entry 4944 (class 1259 OID 19275)
-- Name: idx_news_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_author_id ON public.news USING btree (author_id);


--
-- TOC entry 4947 (class 1259 OID 19277)
-- Name: idx_news_movies_movie_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_movies_movie_id ON public.news_movies USING btree (movie_id);


--
-- TOC entry 4948 (class 1259 OID 19276)
-- Name: idx_news_movies_news_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_movies_news_id ON public.news_movies USING btree (news_id);


--
-- TOC entry 4953 (class 1259 OID 19278)
-- Name: idx_quiz_choices_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_choices_question_id ON public.quiz_choices USING btree (question_id);


--
-- TOC entry 4973 (class 1259 OID 19288)
-- Name: idx_recommendation_section_movies_movie_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommendation_section_movies_movie_id ON public.recommendation_section_movies USING btree (movie_id);


--
-- TOC entry 4974 (class 1259 OID 19287)
-- Name: idx_recommendation_section_movies_section_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommendation_section_movies_section_id ON public.recommendation_section_movies USING btree (section_id);


--
-- TOC entry 4956 (class 1259 OID 19281)
-- Name: idx_user_quiz_answers_choice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quiz_answers_choice_id ON public.user_quiz_answers USING btree (choice_id);


--
-- TOC entry 4957 (class 1259 OID 19280)
-- Name: idx_user_quiz_answers_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quiz_answers_question_id ON public.user_quiz_answers USING btree (question_id);


--
-- TOC entry 4958 (class 1259 OID 19279)
-- Name: idx_user_quiz_answers_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quiz_answers_user_id ON public.user_quiz_answers USING btree (user_id);


--
-- TOC entry 4963 (class 1259 OID 19286)
-- Name: idx_user_ratings_movie_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_ratings_movie_id ON public.user_ratings USING btree (movie_id);


--
-- TOC entry 4964 (class 1259 OID 19285)
-- Name: idx_user_ratings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_ratings_user_id ON public.user_ratings USING btree (user_id);

--
-- TOC entry 5016 (class 2620 OID 19254)
-- Name: comments set_timestamp_comments; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp_comments BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5015 (class 2620 OID 19255)
-- Name: movies set_timestamp_movies; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp_movies BEFORE UPDATE ON public.movies FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5018 (class 2620 OID 19256)
-- Name: news set_timestamp_news; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp_news BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5021 (class 2620 OID 19258)
-- Name: recommendation_sections set_timestamp_recommendation_sections; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp_recommendation_sections BEFORE UPDATE ON public.recommendation_sections FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5019 (class 2620 OID 19257)
-- Name: user_ratings set_timestamp_user_ratings; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp_user_ratings BEFORE UPDATE ON public.user_ratings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5014 (class 2620 OID 19253)
-- Name: users set_timestamp_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- TOC entry 5017 (class 2620 OID 19260)
-- Name: comment_likes update_likes_count_on_comment_like; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_likes_count_on_comment_like AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();


--
-- TOC entry 5020 (class 2620 OID 19261)
-- Name: user_ratings update_movie_rating_after_user_rating; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_movie_rating_after_user_rating AFTER INSERT OR DELETE OR UPDATE ON public.user_ratings FOR EACH ROW EXECUTE FUNCTION public.update_movie_avg_rating();


--
-- TOC entry 4987 (class 2606 OID 19118)
-- Name: admins admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 4997 (class 2606 OID 19173)
-- Name: comment_censorship_log comment_censorship_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_censorship_log
    ADD CONSTRAINT comment_censorship_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE RESTRICT;


--
-- TOC entry 4998 (class 2606 OID 19168)
-- Name: comment_censorship_log comment_censorship_log_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_censorship_log
    ADD CONSTRAINT comment_censorship_log_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- TOC entry 4999 (class 2606 OID 19178)
-- Name: comment_censorship_log comment_censorship_log_reason_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_censorship_log
    ADD CONSTRAINT comment_censorship_log_reason_code_fkey FOREIGN KEY (reason_code) REFERENCES public.censorship_reasons(reason_code);


--
-- TOC entry 4995 (class 2606 OID 19163)
-- Name: comment_likes comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- TOC entry 4996 (class 2606 OID 19158)
-- Name: comment_likes comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_likes
    ADD CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4992 (class 2606 OID 19148)
-- Name: comments comments_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- TOC entry 4993 (class 2606 OID 19153)
-- Name: comments comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- TOC entry 4994 (class 2606 OID 19143)
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4988 (class 2606 OID 19123)
-- Name: movie_crew movie_crew_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_crew
    ADD CONSTRAINT movie_crew_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- TOC entry 4989 (class 2606 OID 19128)
-- Name: movie_crew movie_crew_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_crew
    ADD CONSTRAINT movie_crew_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id) ON DELETE CASCADE;


--
-- TOC entry 4990 (class 2606 OID 19138)
-- Name: movie_genres movie_genres_genre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT movie_genres_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.genres(id) ON DELETE CASCADE;


--
-- TOC entry 4991 (class 2606 OID 19133)
-- Name: movie_genres movie_genres_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT movie_genres_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- TOC entry 5000 (class 2606 OID 19183)
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5001 (class 2606 OID 19193)
-- Name: news_movies news_movies_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_movies
    ADD CONSTRAINT news_movies_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- TOC entry 5002 (class 2606 OID 19188)
-- Name: news_movies news_movies_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_movies
    ADD CONSTRAINT news_movies_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(id) ON DELETE CASCADE;


--
-- TOC entry 5003 (class 2606 OID 19198)
-- Name: quiz_choices quiz_choices_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_choices
    ADD CONSTRAINT quiz_choices_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- TOC entry 5009 (class 2606 OID 19248)
-- Name: recommendation_section_movies recommendation_section_movies_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_section_movies
    ADD CONSTRAINT recommendation_section_movies_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 19243)
-- Name: recommendation_section_movies recommendation_section_movies_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recommendation_section_movies
    ADD CONSTRAINT recommendation_section_movies_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.recommendation_sections(id) ON DELETE CASCADE;


--
-- TOC entry 5011 (class 2606 OID 19319)
-- Name: user_movie_lists user_movie_lists_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_movie_lists
    ADD CONSTRAINT user_movie_lists_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 19314)
-- Name: user_movie_lists user_movie_lists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_movie_lists
    ADD CONSTRAINT user_movie_lists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5004 (class 2606 OID 19213)
-- Name: user_quiz_answers user_quiz_answers_choice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_choice_id_fkey FOREIGN KEY (choice_id) REFERENCES public.quiz_choices(id) ON DELETE CASCADE;


--
-- TOC entry 5005 (class 2606 OID 19208)
-- Name: user_quiz_answers user_quiz_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- TOC entry 5006 (class 2606 OID 19203)
-- Name: user_quiz_answers user_quiz_answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quiz_answers
    ADD CONSTRAINT user_quiz_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5007 (class 2606 OID 19238)
-- Name: user_ratings user_ratings_movie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ratings
    ADD CONSTRAINT user_ratings_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;


--
-- TOC entry 5008 (class 2606 OID 19233)
-- Name: user_ratings user_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_ratings
    ADD CONSTRAINT user_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-06-10 10:40:00

--
-- PostgreSQL database dump complete
--

