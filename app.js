const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

dbPath = path.join(__dirname, "cricketMatchDetails.db");
let dataBase = null;

const initializerDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializerDbAndServer();

const convertPlayerToResponseObject = (Object) => {
  return {
    playerId: Object.player_id,
    playerName: Object.player_name,
  };
};

const convertMatchToResponseObject = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

/// API get all players

app.get("/players/", async (request, response) => {
  const getAllPlayers = `
    SELECT 
        *
    FROM 
        player_details
    ;`;
  const playersArray = await dataBase.all(getAllPlayers);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerToResponseObject(eachPlayer))
  );
});

/// API get player based on playerId

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
        *
    FROM 
        player_details
    WHERE 
        player_id = ${playerId}
    ;`;
  const players = await dataBase.get(getPlayerQuery);
  response.send(convertPlayerToResponseObject(players));
});

/// API update player details based on playerId

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE 
        player_details
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId}
    ;`;
  await dataBase.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

/// API get match details based on specific Id

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
        *
    FROM 
        match_details
    WHERE 
        match_id = ${matchId}
    ;`;
  const matchDetails = await dataBase.get(getMatchQuery);
  response.send(convertMatchToResponseObject(matchDetails));
});

//// get match details based on playerId

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchDetails = `
    SELECT 
        *
    FROM 
        player_match_score NATURAL JOIN match_details 
    WHERE 
        player_id = ${playerId}
    ;`;
  const matchArray = await dataBase.all(getMatchDetails);
  response.send(
    matchArray.map((eachMatch) => convertMatchToResponseObject(eachMatch))
  );
});

/// get player details based on matchId

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetails = `
    SELECT 
        * 
    FROM 
        player_match_score NATURAL JOIN 
        player_details 
    WHERE 
        match_id = ${matchId}
    `;
  const playerDetails = await dataBase.all(getPlayerDetails);
  response.send(
    playerDetails.map((eachPlayers) =>
      convertPlayerToResponseObject(eachPlayers)
    )
  );
});

/// API get totalscores based on playerId

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getTotalScoreDetails = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM 
        player_match_score NATURAL JOIN 
        player_details 
    WHERE 
        player_id = ${playerId}
    ;`;
  const totalScoreArray = await dataBase.get(getTotalScoreDetails);
  response.send(totalScoreArray);
});

module.exports = app;
