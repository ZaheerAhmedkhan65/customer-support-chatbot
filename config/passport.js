// === config/passport.js ===
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database'); // Make sure this path is correct
require('dotenv').config();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  // In GoogleStrategy
async (accessToken, refreshToken, profile, done) => {  // Add missing params
        try {
          const email = profile.emails[0].value;
          const [users] = await pool.query(
            'SELECT * FROM users WHERE google_id = ? OR email = ?', 
            [profile.id, email]
          );
      
          // Existing user (update if needed)
          if (users.length > 0) {
            const user = users[0];
            if (!user.google_id) {
              await pool.query(
                'UPDATE users SET google_id = ?, profile_photo = ? WHERE id = ?',
                [profile.id, profile.photos[0]?.value, user.id]  // Optional chaining for photos
              );
              user.google_id = profile.id;
            }
            return done(null, user);
          }

          const org_id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      
          // New user
          const [result] = await pool.query(
            'INSERT INTO users (org_id, google_id, name, password, email, profile_photo, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              org_id,
              profile.id,
              profile.displayName,
              null, // Password will be null for Google users
              email,
              profile.photos[0]?.value,
              true  // Google emails are verified
            ]
          );
          return done(null, {
            id: result.insertId,
            org_id,
            google_id: profile.id,
            name: profile.displayName,
            email,
            profile_photo: profile.photos[0]?.value,
            email_verified: true
          });
        } catch (error) {
          done(error);
        }
      }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// In config/passport.js
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return done(new Error('User not found'));
    }
    done(null, users[0]);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;