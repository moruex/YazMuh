import { useTranslation } from 'react-i18next';

const MovieCardPlaceholder = () => {
  const { t } = useTranslation();
  return (
    <div className="hm-movie-placeholder">
      <div className="hm-placeholder-content">
        <div className="hm-placeholder-icon">
          🎬
        </div>
        <div className="hm-placeholder-text">
          {t("comingSoon")}
        </div>
      </div>
    </div>
  );
};

export default MovieCardPlaceholder;