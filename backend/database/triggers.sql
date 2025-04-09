-- trigger.sql

-- ==================================
-- Timestamp Trigger Function (Handles only UPDATE)
-- ==================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- Apply Timestamp Triggers
-- ==================================
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_movies BEFORE UPDATE ON movies FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_admins BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_comments BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_news BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_ratings BEFORE UPDATE ON user_ratings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_genres BEFORE UPDATE ON genres FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_persons BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_recommendation_sections BEFORE UPDATE ON recommendation_sections FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ==================================
-- Movie Average Rating Trigger
-- ==================================
CREATE OR REPLACE FUNCTION update_movie_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_movie_id INTEGER;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_movie_id := OLD.movie_id;
  ELSE
    v_movie_id := NEW.movie_id;
  END IF;

  -- Your existing logic for calculating avg_rating
  UPDATE movies
  SET avg_rating = COALESCE(
                      (SELECT AVG(rating)::numeric FROM user_ratings WHERE movie_id = v_movie_id),
                      0.0
                   )
  WHERE id = v_movie_id;

  RETURN NULL; -- For AFTER triggers
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_movie_rating_after_user_rating
AFTER INSERT OR UPDATE OR DELETE ON user_ratings
FOR EACH ROW EXECUTE FUNCTION update_movie_avg_rating();


-- ==================================
-- Default User Lists Trigger
-- ==================================
CREATE OR REPLACE FUNCTION create_default_user_lists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_lists (user_id, list_type, created_at) VALUES
    (NEW.id, 'favorites', NOW()),
    (NEW.id, 'watched', NOW()),
    (NEW.id, 'watchlist', NOW());
  RETURN NEW; -- Return value ignored for AFTER trigger but required
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_lists_for_new_user
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_default_user_lists();

-- ==================================
-- Comment Likes Count Trigger
-- ==================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_id INTEGER;
BEGIN
   IF (TG_OP = 'DELETE') THEN
        v_comment_id = OLD.comment_id;
        UPDATE comments SET likes_count = likes_count - 1
        WHERE id = v_comment_id AND likes_count > 0; -- Prevent going below 0
        RETURN OLD;
   ELSIF (TG_OP = 'INSERT') THEN
        v_comment_id = NEW.comment_id;
        UPDATE comments SET likes_count = likes_count + 1 WHERE id = v_comment_id;
        RETURN NEW;
   END IF;
   RETURN NULL; -- Should not happen for INSERT/DELETE but good practice
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count_on_comment_like
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();