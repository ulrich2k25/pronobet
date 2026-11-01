import "server-only";

export type HistoricalFixture = {
  fixture: {
    date: string;
    status: {
      short: string;
    };
  };
  teams: {
    home: { id: number };
    away: { id: number };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type Venue = "home" | "away";

type TeamStats = {
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  averageScored: number;
  averageConceded: number;
};

export type StatisticalPrediction = {
  match: string;
  probs: {
    home: number;
    draw: number;
    away: number;
  };
  tip: string;
  confidence: number;
  expectedGoals: {
    home: number;
    away: number;
  };
  sample: {
    homeMatches: number;
    awayMatches: number;
  };
  model: "poisson-goals-v1";
};

const COMPLETED_STATUSES = new Set(["FT", "AET", "PEN"]);

function getVenueStats(
  fixtures: HistoricalFixture[],
  teamId: number,
  venue: Venue
): TeamStats {
  const valid = fixtures
    .filter((match) => {
      if (!COMPLETED_STATUSES.has(match.fixture?.status?.short)) {
        return false;
      }

      const homeId = match.teams?.home?.id;
      const awayId = match.teams?.away?.id;

      const isCorrectVenue =
        venue === "home"
          ? homeId === teamId
          : awayId === teamId;

      const homeGoals = match.goals?.home;
      const awayGoals = match.goals?.away;

      return (
        isCorrectVenue &&
        typeof homeGoals === "number" &&
        typeof awayGoals === "number" &&
        Number.isInteger(homeGoals) &&
        Number.isInteger(awayGoals) &&
        homeGoals >= 0 &&
        awayGoals >= 0 &&
        Date.parse(match.fixture.date) < Date.now()
      );
    })
    .sort(
      (a, b) =>
        Date.parse(b.fixture.date) - Date.parse(a.fixture.date)
    );

  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const match of valid) {
    if (venue === "home") {
      goalsFor += match.goals.home!;
      goalsAgainst += match.goals.away!;
    } else {
      goalsFor += match.goals.away!;
      goalsAgainst += match.goals.home!;
    }
  }

  const played = valid.length;

  return {
    played,
    goalsFor,
    goalsAgainst,
    averageScored: played > 0 ? goalsFor / played : 0,
    averageConceded: played > 0 ? goalsAgainst / played : 0,
  };
}

function poissonDistribution(lambda: number, maxGoals = 15) {
  const probabilities: number[] = [];

  probabilities[0] = Math.exp(-lambda);

  for (let goals = 1; goals <= maxGoals; goals++) {
    probabilities[goals] =
      (probabilities[goals - 1] * lambda) / goals;
  }

  return probabilities;
}

export function calculateStatisticalPrediction(input: {
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeFixtures: HistoricalFixture[];
  awayFixtures: HistoricalFixture[];
}): StatisticalPrediction | null {
  const {
    homeTeamId,
    awayTeamId,
    homeTeamName,
    awayTeamName,
    homeFixtures,
    awayFixtures,
  } = input;

  if (
    !Number.isInteger(homeTeamId) ||
    !Number.isInteger(awayTeamId) ||
    homeTeamId <= 0 ||
    awayTeamId <= 0 ||
    homeTeamId === awayTeamId
  ) {
    return null;
  }

  const home = getVenueStats(
    homeFixtures,
    homeTeamId,
    "home"
  );

  const away = getVenueStats(
    awayFixtures,
    awayTeamId,
    "away"
  );

  // Refuser les estimations si les echantillons sont trop petits.
  if (home.played < 3 || away.played < 3) {
    return null;
  }

  // Buts moyens estimes a partir des donnees observees.
  const expectedHomeGoals =
    (home.averageScored + away.averageConceded) / 2;

  const expectedAwayGoals =
    (away.averageScored + home.averageConceded) / 2;

  const homeDistribution = poissonDistribution(expectedHomeGoals);
  const awayDistribution = poissonDistribution(expectedAwayGoals);

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;

  for (let h = 0; h < homeDistribution.length; h++) {
    for (let a = 0; a < awayDistribution.length; a++) {
      const probability =
        homeDistribution[h] * awayDistribution[a];

      if (h > a) {
        homeWin += probability;
      } else if (h === a) {
        draw += probability;
      } else {
        awayWin += probability;
      }
    }
  }

  // Normaliser les probabilites pour obtenir un total de 100 %.
  const total = homeWin + draw + awayWin;

  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }

  const probs = {
    home: homeWin / total,
    draw: draw / total,
    away: awayWin / total,
  };

  const highest = Math.max(
    probs.home,
    probs.draw,
    probs.away
  );

  const tip =
    probs.home === highest
      ? `Victoire ${homeTeamName}`
      : probs.away === highest
        ? `Victoire ${awayTeamName}`
        : "Match nul";

  return {
    match: `${homeTeamName} vs ${awayTeamName}`,
    probs,
    tip,
    confidence: highest,
    expectedGoals: {
      home: expectedHomeGoals,
      away: expectedAwayGoals,
    },
    sample: {
      homeMatches: home.played,
      awayMatches: away.played,
    },
    model: "poisson-goals-v1",
  };
}