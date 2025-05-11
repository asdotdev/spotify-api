import axios from "axios";
import express from "express";
import querystring from "querystring";
import { getAccessToken, refreshAccessToken } from "../services/spotifyAuth.js";
import {
    simplifyFollowedArtists,
    simplifyNowPlaying,
    simplifyTopTracks,
} from "../utills/index.js";

const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const SCOPES = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-top-read",
    "user-follow-read",
    "streaming",
].join(" ");

// Step 1: Login and redirect to Spotify
router.get("/login", (req, res) => {
    const params = querystring.stringify({
        response_type: "code",
        client_id: CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
    });

    res.redirect(`https://accounts.spotify.com/authorize?${params}`);
});

// Step 2: Callback route
router.get("/callback", async (req, res) => {
    const code = req.query.code;
    try {
        const { access_token, refresh_token } = await getAccessToken(code);

        res.send(`
      <h3>Save this Refresh Token in your .env file:</h3>
      <pre>SPOTIFY_REFRESH_TOKEN=${refresh_token}</pre>
    `);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).send("Failed to get access token");
    }
});

router.get("/top-tracks", async (req, res) => {
    try {
        const accessToken = await refreshAccessToken(
            process.env.SPOTIFY_REFRESH_TOKEN
        );
        const response = await axios.get(
            "https://api.spotify.com/v1/me/top/tracks?limit=10",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const simplified = simplifyTopTracks(response.data.items);
        res.json(simplified);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch top tracks" });
    }
});

router.get("/", async (req, res) => {
    try {
        const accessToken = await refreshAccessToken(
            process.env.SPOTIFY_REFRESH_TOKEN
        );
        const response = await axios.get(
            "https://api.spotify.com/v1/me/player/currently-playing",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (response.status === 204 || !response.data) {
            return res.json({
                isPlaying: false,
                message: "No song currently playing",
            });
        }

        const simplified = simplifyNowPlaying(response.data);
        res.json(simplified);
    } catch (error) {
        console.error(
            "Error fetching now playing:",
            error.response?.data || error.message
        );
        res.status(500).json({ error: "Failed to fetch now playing track" });
    }
});

router.get("/followed-artists", async (req, res) => {
    try {
        const accessToken = await refreshAccessToken(
            process.env.SPOTIFY_REFRESH_TOKEN
        );
        const response = await axios.get(
            "https://api.spotify.com/v1/me/following?type=artist&limit=20",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const artists = simplifyFollowedArtists(response.data.artists.items);
        res.json(
            artists.length
                ? artists
                : {
                      message: "No Artists are followed",
                  }
        );
    } catch (error) {
        console.error(
            "Error fetching followed artists:",
            error.response?.data || error.message
        );
        res.status(500).json({ error: "Failed to fetch followed artists" });
    }
});

router.put("/pause", async (req, res) => {
    try {
        const accessToken = await refreshAccessToken(
            process.env.SPOTIFY_REFRESH_TOKEN
        );
        const response = await axios.put(
            "https://api.spotify.com/v1/me/player/pause",
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.json({ message: "Playback paused successfully" });
    } catch (error) {
        console.error(
            "Error pausing playback:",
            error.response?.data || error.message
        );
        if (error.response) {
            res.json(error.response.data);
        } else {
            res.status(500).json({ error: "Failed to pause playback" });
        }
    }
});

router.put("/play/:trackId", async (req, res) => {
    const { trackId } = req.params;

    try {
        const accessToken = await refreshAccessToken(
            process.env.SPOTIFY_REFRESH_TOKEN
        );
        const response = await axios.put(
            `https://api.spotify.com/v1/me/player/play`,
            {
                uris: [`spotify:track:${trackId}`],
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.json({ message: `Started playing track ${trackId}` });
    } catch (error) {
        console.error(
            "Error playing track:",
            error.response?.data || error.message
        );
        if (error.response) {
            res.json(error.response.data);
        } else {
            res.status(500).json({ error: "Failed to play track" });
        }
    }
});

export default router;
