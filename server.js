const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!res.ok) {
    throw new Error(`Request failed ${res.status}: ${url}`);
  }

  return res.json();
}

async function getUserGames(userId) {
  const url = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50&sortOrder=Asc`;
  const data = await getJson(url);
  return data.data || [];
}

async function getGamepassesFromUniverse(universeId) {
  const url = `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`;
  const data = await getJson(url);
  return data.data || [];
}

function normalizeGamepasses(rawPasses) {
  const result = [];

  for (const pass of rawPasses) {
    const price = pass.price;

    if (typeof price === "number" && price > 0) {
      result.push({
        Name: pass.name || `Donate ${price}`,
        Price: price,
        GamePassId: pass.id
      });
    }
  }

  result.sort((a, b) => a.Price - b.Price);
  return result;
}

async function getUserGamepasses(userId) {
  const games = await getUserGames(userId);
  let allPasses = [];

  for (const game of games) {
    if (!game.id) continue;

    try {
      const passes = await getGamepassesFromUniverse(game.id);
      allPasses.push(...passes);
    } catch (err) {
      console.warn(`Failed to get passes for universe ${game.id}:`, err.message);
    }
  }

  const seen = new Set();
  const normalized = normalizeGamepasses(allPasses).filter(pass => {
    if (seen.has(pass.GamePassId)) return false;
    seen.add(pass.GamePassId);
    return true;
  });

  return normalized;
}

app.get("/", (req, res) => {
  res.send("PLS DONATE API is running on Render!");
});

app.get("/gamepasses", async (req, res) => {
  try {
    const userId = Number(req.query.userId);

    if (!userId || userId <= 0) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const passes = await getUserGamepasses(userId);
    return res.json(passes);
  } catch (err) {
    console.error("Error in /gamepasses:", err.message);
    return res.status(500).json({
      error: "Failed to fetch gamepasses",
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
