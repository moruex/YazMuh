import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Footer from '@components/app/Footer';
import { Movie } from '@src/types/Movie';
import { personService, PersonDetailData, PersonMovieRole } from '@src/services/personService';
import './PersonPage.css';
import { useTranslation } from 'react-i18next';

// Movie Card Component
const MovieCard: React.FC<{ movie: Movie; renderTitle: React.ReactNode }> = ({ movie, renderTitle }) => {
  const { t } = useTranslation();
  const displayYear = movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : t('unknown'));

  return (
    <div className="pd-credits-card">
      <Link to={`/movies/${movie.id}`}>
        <div className="pd-credits-poster-container">
          <img
            src={movie.posterUrl || movie.poster_url || "https://placehold.co/300x450?text=" + t('noPoster')}
            alt={movie.title}
          />
          {movie.rating !== undefined && (
            <div className="pd-credits-rating-badge">
              {movie.rating.toFixed(1)}
            </div>
          )}
        </div>
        <div className="pd-credits-info">
          <h3 title={movie.title}>{renderTitle}</h3>
          <p>{displayYear}</p>
        </div>
      </Link>
    </div>
  );
};

// Main Page Component
const PersonDetailsPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [person, setPerson] = useState<PersonDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [actorRoles, setActorRoles] = useState<PersonMovieRole[]>([]);
  const [directorRoles, setDirectorRoles] = useState<PersonMovieRole[]>([]);
  const [loadingActorRoles, setLoadingActorRoles] = useState<boolean>(false);
  const [loadingDirectorRoles, setLoadingDirectorRoles] = useState<boolean>(false);

  const [actorOffset, setActorOffset] = useState<number>(0);
  const [directorOffset, setDirectorOffset] = useState<number>(0);
  const [hasMoreActorRoles, setHasMoreActorRoles] = useState<boolean>(true);
  const [hasMoreDirectorRoles, setHasMoreDirectorRoles] = useState<boolean>(true);
  const limit = 12;

  const { t } = useTranslation();

  // Helper to format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return t('notAvailable');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  useEffect(() => {
    if (!identifier) {
      setError(t('personIdentifierMissing'));
      setLoading(false);
      return;
    }
    const fetchPersonData = async () => {
      setLoading(true);
      setError(null);
      setPerson(null);
      setActorRoles([]);
      setDirectorRoles([]);
      setActorOffset(0);
      setDirectorOffset(0);
      setHasMoreActorRoles(true);
      setHasMoreDirectorRoles(true);
      try {
        const isNumericId = /^\d+$/.test(identifier);
        const params = isNumericId ? { id: identifier } : { slug: identifier };
        const data = await personService.getPersonDetails(params);
        if (data) {
          setPerson(data);
          fetchActorRoles(data.id, 0);
          fetchDirectorRoles(data.id, 0);
        } else {
          setError(t('personNotFound'));
        }
      } catch (err: any) {
        setError(t('failedToLoadPersonDetails'));
      } finally {
        setLoading(false);
      }
    };
    fetchPersonData();
  }, [identifier]);

  const fetchActorRoles = async (personId: string, currentOffset: number) => {
    setLoadingActorRoles(true);
    try {
      const roles = await personService.getPersonActorRoles(personId, limit, currentOffset);
      if (roles.length > 0) {
        setActorRoles(prev => [...prev, ...roles]);
        setActorOffset(currentOffset + roles.length);
      }
      if (roles.length < limit) setHasMoreActorRoles(false);
    } catch (error) { console.error('Error fetching actor roles:', error); }
    finally { setLoadingActorRoles(false); }
  };

  const fetchDirectorRoles = async (personId: string, currentOffset: number) => {
    setLoadingDirectorRoles(true);
    try {
      const roles = await personService.getPersonDirectorRoles(personId, limit, currentOffset);
      if (roles.length > 0) {
        setDirectorRoles(prev => [...prev, ...roles]);
        setDirectorOffset(currentOffset + roles.length);
      }
      if (roles.length < limit) setHasMoreDirectorRoles(false);
    } catch (error) { console.error('Error fetching director roles:', error); }
    finally { setLoadingDirectorRoles(false); }
  };

  const handleLoadMoreActorRoles = () => { if (person?.id) fetchActorRoles(person.id, actorOffset); };
  const handleLoadMoreDirectorRoles = () => { if (person?.id) fetchDirectorRoles(person.id, directorOffset); };

  // Convert roles to movie objects and deduplicate them
  const actorMoviesMap = new Map<string, Movie>();
  actorRoles.forEach(role => {
    const movie = {
      ...role.movie,
      rating: role.movie.movieq_rating ?? undefined,
      slug: role.movie.slug ?? undefined,
      posterUrl: role.movie.poster_url,
      year: role.movie.release_date ? new Date(role.movie.release_date).getFullYear() : undefined
    };
    actorMoviesMap.set(movie.id, movie);
  });
  const actorMovies = Array.from(actorMoviesMap.values());

  // Do the same for director movies
  const directorMoviesMap = new Map<string, Movie>();
  directorRoles.forEach(role => {
    const movie = {
      ...role.movie,
      rating: role.movie.movieq_rating ?? undefined,
      slug: role.movie.slug ?? undefined,
      posterUrl: role.movie.poster_url,
      year: role.movie.release_date ? new Date(role.movie.release_date).getFullYear() : undefined
    };
    directorMoviesMap.set(movie.id, movie);
  });
  const directorMovies = Array.from(directorMoviesMap.values());

  if (loading) return <div className="pd-page-status">{t('loading')}</div>;
  if (error) return <div className="pd-page-status-error">{t('error')}: {error}</div>;
  if (!person) return <div className="pd-page-status">{t('personNotFound')}</div>;

  return (
    <div className="pd-page">
      <div className="pd-person-detail-container">
        <header className="pd-person-header">
          <h1 className="pd-person-name">{person.name}</h1>
        </header>
        <main className="pd-person-content">
          <div className="pd-person-profile-image">
            <img
              src={person.profile_image_url || "https://placehold.co/350x525?text=" + t('noImage')}
              alt={person.name}
            />
          </div>
          <div className="pd-person-info">
            <div className="pd-person-basic-info">
              <div className="pd-detail-row">
                <span className="pd-detail-label">{t('born')}:</span>
                <span className="pd-detail-value">{formatDate(person.birthday)}</span>
              </div>
            </div>
            <div className="pd-person-bio">
              <h2 className='pd-credits-section-title'>{t('biography')}</h2>
              <p>{person.biography || t('noBiographyAvailable', { name: person.name })}</p>
            </div>
          </div>
        </main>
        {(actorMovies.length > 0) && (
          <section className="pd-credits-section">
            <h2 className='pd-credits-section-title'>{t('asActor')}</h2>
            <div className="pd-credits-container">
              {actorMovies.map((movie) => <MovieCard key={`actor-${movie.id}`} movie={movie} renderTitle={movie.title} />)}
            </div>
            {loadingActorRoles && <div className="pd-loading-more">{t('loading')}</div>}
            {hasMoreActorRoles && !loadingActorRoles && (
              <button
                className="pd-load-more-button"
                onClick={handleLoadMoreActorRoles}
              >
                {t('loadMore')}
              </button>
            )}
          </section>
        )}
        {(directorMovies.length > 0) && (
          <section className="pd-credits-section">
            <h2 className='pd-credits-section-title'>{t('asDirector')}</h2>
            <div className="pd-credits-container">
              {directorMovies.map((movie) => <MovieCard key={`director-${movie.id}`} movie={movie} renderTitle={movie.title} />)}
            </div>
            {loadingDirectorRoles && <div className="pd-loading-more">{t('loading')}</div>}
            {hasMoreDirectorRoles && !loadingDirectorRoles && (
              <button
                className="pd-load-more-button"
                onClick={handleLoadMoreDirectorRoles}
              >
                {t('loadMore')}
              </button>
            )}
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PersonDetailsPage;