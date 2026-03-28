const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');

dotenv.config();

const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 10000; 

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const swaggerOptions = {
    swaggerOptions: {
        withCredentials: true, 
    },
};

app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'chuzooooo',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport');

// SWAGGER ROUTE
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

app.use('/', require('./routes'));

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

    const displayUrl = process.env.NODE_ENV === 'production'
      ? 'https://ecommer-api341.onrender.com'
      : `http://localhost:${PORT}`;

    console.log(`Swagger Docs: ${displayUrl}/api-docs`);
    console.log(`Auth url: ${displayUrl}/auth/google`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});