import express from "express";
import dotenv from "dotenv";
import spotifyRoutes from "./routes/spotify.js";

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

app.use("/spotify", spotifyRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
