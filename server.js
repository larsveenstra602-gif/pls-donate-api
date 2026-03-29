const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("PLS DONATE API is running on Render!");
});

// Get gamepasses by universeId (BESTE METHODE)
app.get("/gamepasses", async (req, res) => {
  try {
    const universeId = req.query.universeId;

    if (!universeId) {
      return res.status(400).json({ error: "Missing universeId" });
    }

    console.log("Fetching gamepasses for universeId:", universeId);

    // Roblox endpoint voor gamepasses van universe
    const url = `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`;

    const response = await axios.get(url);

    const rawPasses = response.data?.data || [];

    const passes = rawPasses
      .filter(pass => pass.price !== null && pass.price > 0)
      .map(pass => ({
        GamePassId: pass.id,
        Name: pass.name,
        Price: pass.price
      }))
      .sort((a, b) => a.Price - b.Price);

    console.log("Found passes:", passes);

    res.json(passes);
  } catch (error) {
    console.error("Error fetching gamepasses:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch gamepasses",
      details: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
