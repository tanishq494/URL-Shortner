
const UrlModel = require('../models/url');
const shortid = require('shortid');

function normalizeUrl(rawUrl) {
    const trimmedUrl = (rawUrl || '').trim();
    if (!trimmedUrl) {
        return null;
    }

    const withProtocol = /^https?:\/\//i.test(trimmedUrl)
        ? trimmedUrl
        : `https://${trimmedUrl}`;

    try {
        const parsedUrl = new URL(withProtocol);
        return parsedUrl.toString();
    } catch {
        return null;
    }
}

const handleGenerateNewShortUrl = async(req, res) => {
    const body = req.body;
    if(!body || !body.url) return res.status(400).json({ error: "url is required" });
    const normalizedUrl = normalizeUrl(body.url);
    if (!normalizedUrl) {
        return res.status(400).json({ error: "Please enter a valid URL" });
    }

    const existingUrl = await UrlModel.findOne({
        redirectUrl: normalizedUrl,
        createdBy: req.user._id,
    });

    if (existingUrl) {
        const allUrls = await UrlModel.find({ createdBy: req.user._id });
        return res.render("home", {
            shortId: existingUrl.shortId,
            urls: allUrls,
        });
    }

    const shortID = shortid();

    await UrlModel.create({
        shortId: shortID,
        redirectUrl: normalizedUrl,
        createdBy: req.user._id,
    });

    const allUrls = await UrlModel.find({ createdBy: req.user._id });

    return res.render("home", {
        shortId: shortID,
        urls: allUrls,
    })
}


const handleGetAnalytics = async(req, res) => {
    const shortId = req.params.shortId;
    const result = await UrlModel.findOne({ shortId});
    return res.json({
        totalClicks: result.visitHistory.length,
        analytics: result.visitHistory,
    });
}

module.exports = {
    handleGenerateNewShortUrl,
    handleGetAnalytics,
}