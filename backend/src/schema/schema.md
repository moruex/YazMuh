Okay, here's a breakdown of the functions (GraphQL Queries and Mutations) defined in each file and how to use them:

**`movie.js`**

*   **Queries:**
    *   `movie(id: ID!)`: Fetches a single movie using its unique ID.
    *   `movies(limit: Int, offset: Int, sortBy: String, sortDirection: String, genreId: ID, search: String)`: Fetches a list of movies. Allows pagination (`limit`, `offset`), sorting (`sortBy`, `sortDirection`), filtering by genre (`genreId`), and searching by title (`search`).
    *   `movieCount(genreId: ID, search: String)`: Counts the total number of movies, optionally filtered by genre (`genreId`) or title search (`search`).
*   **Mutations (Require Admin Login):**
    *   `createMovie(input: MovieInput!)`: Creates a new movie with the provided details (`title`, `releaseDate`, etc.).
    *   `updateMovie(id: ID!, input: MovieUpdateInput!)`: Updates an existing movie (identified by `id`) with new details.
    *   `deleteMovie(id: ID!)`: Deletes a movie using its unique ID.

---

**`comment.js`**

*   **Queries:**
    *   `comments(movie_id: ID!, limit: Int, offset: Int)`: Fetches top-level comments for a specific movie (`movie_id`), with pagination (`limit`, `offset`).
    *   `comment(id: ID!)`: Fetches a single comment by its unique ID (including its replies).
*   **Mutations (Require Login):**
    *   `createComment(input: CommentInput!)`: Creates a new comment or reply for a movie. Requires `movieId`, `content`, and optionally `parent_comment_id`.
    *   `updateComment(id: ID!, input: CommentUpdateInput!)`: Updates the `content` of an existing comment. Requires ownership or admin rights.
    *   `deleteComment(id: ID!)`: Deletes a comment. Requires ownership or admin rights. Note: May delete replies depending on DB setup (CASCADE).
    *   `likeComment(id: ID!)`: Adds the current user's like to a comment.
    *   `unlikeComment(id: ID!)`: Removes the current user's like from a comment.

---

**`index.js`**

*   This file combines all the type definitions and resolvers from other files into a single executable GraphQL schema. It doesn't define any new user-facing functions itself.

---

**`genre.js`**

*   **Queries:**
    *   `genre(id: ID!)`: Fetches a single genre by its unique ID.
    *   `genres`: Fetches a list of all available genres.
*   **Mutations (Require Admin Login):**
    *   `createGenre(input: GenreInput!)`: Creates a new genre.
    *   `updateGenre(id: ID!, input: GenreInput!)`: Updates an existing genre (identified by `id`).
    *   `deleteGenre(id: ID!)`: Deletes a genre using its unique ID.

---

**`news.js`**

*   **Queries:**
    *   `newsArticle(id: ID!)`: Fetches a single news article by its unique ID.
    *   `newsList(limit: Int, offset: Int, movieId: ID)`: Fetches a list of news articles, with pagination (`limit`, `offset`), optionally filtered by an associated movie (`movieId`).
*   **Mutations (Require Admin Login):**
    *   `createNews(input: NewsInput!)`: Creates a new news article, potentially linking it to movies specified in `movie_ids`.
    *   `updateNews(id: ID!, input: NewsUpdateInput!)`: Updates an existing news article's details and/or its associated movie links.
    *   `deleteNews(id: ID!)`: Deletes a news article and its movie associations.

---

**`quiz.js`**

*   **Queries:**
    *   `quizQuestions(limit: Int)`: Fetches a specified number (`limit`, default 5) of random quiz questions, including their possible answers.
    *   `userQuizResults(userId: ID!)`: Fetches the quiz results (question answered, answer chosen) submitted by a specific user.
*   **Mutations:**
    *   `createQuizQuestion(input: QuizQuestionInput!)`: Creates a new quiz question along with its possible answers (requires admin login). Input requires `question_text` and an array of `answers`, where exactly one answer must have `is_correct: true`.
    *   `submitQuizResult(input: QuizResultInput!)`: Allows a logged-in user to submit their chosen answer (`answerId`) to a specific quiz question (`questionId`) (requires login). Prevents answering the same question twice.

---

**`person.js`**

*   **Queries:**
    *   `person(id: ID!)`: Fetches a single person (actor, director, etc.) by their unique ID, including their roles in movies.
    *   `persons(limit: Int, offset: Int, search: String)`: Fetches a list of persons, with pagination (`limit`, `offset`) and name search (`search`).
*   **Mutations (Require Admin Login):**
    *   `createPerson(input: PersonInput!)`: Creates a new person entry (e.g., actor, director).
    *   `updatePerson(id: ID!, input: PersonInput!)`: Updates an existing person's details (identified by `id`).
    *   `deletePerson(id: ID!)`: Deletes a person entry using their unique ID.

---

**`scalars.js`**

*   This file defines custom GraphQL scalar types (`Date`, `DateTime`, `ByteArray`) used in other schema definitions. It doesn't define any user-facing functions (Queries/Mutations). `ByteArray` is used for handling binary data (like images) usually transferred as Base64 strings.

---

**`user.js`**

*   **Queries:**
    *   `me`: Fetches the profile of the currently logged-in user (requires login). Includes their lists, ratings, and comments.
    *   `user(id: ID!)`: Fetches a specific user's public profile by their ID. Includes their lists, ratings, and comments.
    *   `users(limit: Int, offset: Int)`: Fetches a list of users with pagination.
    *   `userList(userId: ID!, listType: ListType!)`: Fetches a specific movie list (`FAVORITES`, `WATCHED`, `WATCHLIST`) for a given user, including the movies in that list.
*   **Mutations:**
    *   `registerUser(input: UserInput!)`: Creates a new user account. Requires `username`, `email`, `password`, etc. Returns an authentication token and user data. Also creates default empty movie lists for the user.
    *   `loginUser(input: LoginInput!)`: Logs in a user using `email` and `password`. Returns an authentication token and user data.
    *   `updateUser(input: UserUpdateInput!)`: Updates the profile (name, bio, password, etc.) of the currently logged-in user (requires login).
    *   `rateMovie(input: RatingInput!)`: Allows the logged-in user to add or update their rating (1-10) for a movie (`movie_id`) (requires login).
    *   `deleteRating(movie_id: ID!)`: Allows the logged-in user to remove their rating for a specific movie (requires login).
    *   `addMovieToList(movie_id: ID!, listType: ListType!)`: Adds a movie to one of the logged-in user's lists (`FAVORITES`, `WATCHED`, `WATCHLIST`) (requires login).
    *   `removeMovieFromList(movie_id: ID!, listType: ListType!)`: Removes a movie from one of the logged-in user's lists (requires login).
    