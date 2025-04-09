# Use Node 20.19.0

nvm install 20.19.0
nvm use 20.19.0

npm install
npm run dev

movieq-backend/
├── database/
│   ├── schema.sql          # Database schema
│   └── triggers.sql        # Database triggers/functions
├── src/
│   ├── index.js            # Main server file
│   ├── config.js           # Configuration
│   ├── context.js          # GraphQL context
│   ├── schema/
│   │   ├── index.js        # Schema aggregator
│   │   ├── user.js         # User types/resolvers
│   │   ├── movie.js        # Movie types/resolvers
│   │   ├── genre.js        # Genre types/resolvers
│   │   ├── person.js       # Person types/resolvers
│   │   ├── comment.js      # Comment types/resolvers
│   │   ├── news.js         # News types/resolvers
│   │   ├── quiz.js         # Quiz types/resolvers
│   │   └── scalars.js      # Custom scalars
│   ├── utils/
│       ├── auth.js         # Auth utilities
│       └── helpers.js      # Helper functions
├── .env                    # Environment variables
└── package.json            # Project dependencies