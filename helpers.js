// Generate random 6 digit string
const generateRandomString = () => {
  return Math.random().toString(36).slice(2).substring(0,6);
};

// user lookup helper function
const getUserByEmail = (email, database) => {
  for (const user_id in database) {
    if (database[user_id].email === email) {
      return database[user_id];
    }
  }
  return null;
};

// Returns URLs for the specific user
const urlsForUser = (id, database) => {
  const keys = Object.keys(database);
  let userURLs = {};
  for (const key of keys) {
    if (database[key].userID === id) {
      userURLs[key] = database[key];
    }
  }
  return userURLs;
};


module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};