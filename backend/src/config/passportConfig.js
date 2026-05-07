import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // If not, check if a user with the same email exists
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        
        if (!email) {
          return done(new Error("No email found from Google profile"), null);
        }

        user = await User.findOne({ email: email });

        if (user) {
          // Link Google ID to existing account
          user.googleId = profile.id;
          user.isGoogleUser = true;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          isGoogleUser: true,
          password: Math.random().toString(36).slice(-8) + "A1@", // Dummy strong password in case schema requires it
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// We don't really need serialize/deserialize if we're using JWT, 
// but passport expects them if sessions are enabled.
// Since we use JWT, we'll handle the token generation in the controller.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
