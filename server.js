const express = require('express');
const cors = require('cors');
const path = require('path');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public')); // Serve frontend from /public

const APP_ID = process.env.APP_ID;
const APP_CERTIFICATE = process.env.APP_CERTIFICATE;
const PORT = process.env.PORT || 5000;

app.get('/token', (req, res) => {
    const channelName = req.query.channel;
    const uid = req.query.uid || 0;
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTime + expirationTimeInSeconds;

    if (!APP_ID || !APP_CERTIFICATE) {
        return res.status(500).json({ error: "Missing Agora credentials" });
    }

    const token = RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpiredTs);
    res.json({ token });
});

// Serve index.html for any unknown route (for frontend)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
