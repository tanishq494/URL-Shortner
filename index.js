const express = require('express');
const path = require('path');
const { connectToMongoDb } = require('./connect');
const URL = require('./models/url');
const cookieParser = require("cookie-parser");
const { restrictToLoggedinUserOnly, checkAuth } = require("./middlewares/auth");

const urlRoute = require('./routes/urlRouter');
const staticRoute = require('./routes/staticRouter');
const userRoute = require('./routes/userRouter');

const app = express();
const PORT = 5001;

app.use(express.json());
app.use(express.urlencoded({ extended:false }));
app.use(cookieParser());

// MongoDB connection
connectToMongoDb("mongodb://localhost:27017/urlShortner")
    .then(() => console.log("MongoDB connected"));


app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// Routes
app.use('/url', restrictToLoggedinUserOnly, urlRoute);
app.use('/user', userRoute);
app.use('/', checkAuth, staticRoute);

app.get('/:shortId', async(req, res) => {
    const { shortId } = req.params;

    const entry = await URL.findOneAndUpdate(
        { shortId: shortId },
        {
            $push: {
                visitHistory: {
                    timestamp: Date.now(),
                },
            },
        },
        { new: true }
    );

    if (!entry) {
        return res.status(404).json({ error: "Short URL not found" });
    }

    let redirectUrl = entry.redirectUrl;
    if (!/^https?:\/\//i.test(redirectUrl)) {
        redirectUrl = 'https://' + redirectUrl;
    } 

    return res.redirect(redirectUrl);
})

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})