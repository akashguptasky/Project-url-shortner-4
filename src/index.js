require('dotenv').config()
const express = require('express')
const path = require('path')
const route = require('../route/route')
const mongoose = require('mongoose')

const app = express();

// Detect the correct https protocol when behind the Codespaces/reverse proxy
app.set('trust proxy', true)

app.use(express.json());

// Serve the frontend (public folder) - UI and API on the same port
app.use(express.static(path.join(__dirname, '..', 'public')));


// MONGO_URI comes from an env var (set it in .env / a Codespaces secret).
// The old cluster was deleted - set a new free MongoDB Atlas URI here.
// .trim() removes stray spaces/newlines from copy-paste that break the connection string.
const MONGO_URI = (process.env.MONGO_URI || "").trim()
if (!MONGO_URI) {
    console.log("⚠️  MONGO_URI is not set! Add MONGO_URI to your .env file or the DB won't connect.")
} else {
    mongoose.connect(MONGO_URI, { useNewUrlParser: true })
        .then(() => console.log("MongoDb is connected"))
        .catch(err => console.log("Mongo connection error:", err.message))
}


app.use('/',route);

const PORT = process.env.PORT || 3000;
app.listen(PORT, function(){
    console.log('express app running on port ' + PORT)
})
