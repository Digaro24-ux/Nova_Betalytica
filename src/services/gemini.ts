import { GoogleGenAI, Type } from "@google/genai";
import { collection, addDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PredictionResult {
  homeTeam: string;
  awayTeam: string;
  matchAnalysis: string;
  predictions: {
    gg_ng: { choice: "GG" | "NG"; confidence: number; reason: string };
    one_x_two: { choice: "1" | "X" | "2"; confidence: number; reason: string };
    over_under_2_5: { choice: "Over 2.5" | "Under 2.5"; confidence: number; reason: string };
    double_chance: { choice: "1X" | "X2" | "12"; confidence: number; reason: string };
    home_over_under: { choice: string; confidence: number; reason: string };
    away_over_under: { choice: string; confidence: number; reason: string };
    corner_range: { choice: "0-8" | "9-11" | "12+"; confidence: number; reason: string };
    draw_probability: { probability: number; reason: string };
  };
  h2hStats: {
    homeWins: number;
    awayWins: number;
    draws: number;
    lastFiveResults: string[];
    avgGoalsPerMatch: number;
    avgCornersPerMatch: number;
  };
  teamForm: {
    homeForm: string[];
    awayForm: string[];
    homeAverages: { goalsScored: number; goalsConceded: number; corners: number };
    awayAverages: { goalsScored: number; goalsConceded: number; corners: number };
  };
}

export async function getFootballPrediction(homeTeam: string, awayTeam: string): Promise<PredictionResult> {
  const prompt = `Perform an extremely detailed background check and predictive analysis for the football match between ${homeTeam} (Home) and ${awayTeam} (Away).
  
  Use Google Search to find:
  1. Past match records (Head-to-Head history).
  2. Recent form (last 5-10 matches for each team).
  3. Historical Goal averages and Goal range.
  4. Historical Corner averages and Corner range.
  5. Present team stats, injuries, and squad information.
  
  Provide predictions for:
  - GG/NG (Both Teams to Score)
  - 1X2 (Home Win, Draw, or Away Win)
  - Over/Under 2.5 Goals
  - Double Chance (1X, X2, 12)
  - Home Team Over/Under Goals
  - Away Team Over/Under Goals
  - Corner Range (0-8, 9-11, 12+)
  - Draw probability
  
  Return the result in a structured JSON format with specific historical averages for chart visualization.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          homeTeam: { type: Type.STRING },
          awayTeam: { type: Type.STRING },
          matchAnalysis: { type: Type.STRING },
          predictions: {
            type: Type.OBJECT,
            properties: {
              gg_ng: {
                type: Type.OBJECT,
                properties: {
                  choice: { type: Type.STRING, enum: ["GG", "NG"] },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["choice", "confidence", "reason"]
              },
              one_x_two: {
                type: Type.OBJECT,
                properties: {
                  choice: { type: Type.STRING, enum: ["1", "X", "2"] },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["choice", "confidence", "reason"]
              },
              over_under_2_5: {
                type: Type.OBJECT,
                properties: {
                  choice: { type: Type.STRING, enum: ["Over 2.5", "Under 2.5"] },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["choice", "confidence", "reason"]
              },
              double_chance: {
                type: Type.OBJECT,
                properties: {
                  choice: { type: Type.STRING, enum: ["1X", "X2", "12"] },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["choice", "confidence", "reason"]
              },
              home_over_under: {
                type: Type.OBJECT,
                properties: {
                  choice: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["choice", "confidence", "reason"]
              },
              away_over_under: {
                type: Type.OBJECT,
                properties: {
                  choice: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["choice", "confidence", "reason"]
              },
              corner_range: {
                type: Type.OBJECT,
                properties: {
                  choice: { type: Type.STRING, enum: ["0-8", "9-11", "12+"] },
                  confidence: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["choice", "confidence", "reason"]
              },
              draw_probability: {
                type: Type.OBJECT,
                properties: {
                  probability: { type: Type.NUMBER },
                  reason: { type: Type.STRING }
                },
                required: ["probability", "reason"]
              }
            },
            required: ["gg_ng", "one_x_two", "over_under_2_5", "double_chance", "home_over_under", "away_over_under", "corner_range", "draw_probability"]
          },
          h2hStats: {
            type: Type.OBJECT,
            properties: {
              homeWins: { type: Type.NUMBER },
              awayWins: { type: Type.NUMBER },
              draws: { type: Type.NUMBER },
              lastFiveResults: { type: Type.ARRAY, items: { type: Type.STRING } },
              avgGoalsPerMatch: { type: Type.NUMBER },
              avgCornersPerMatch: { type: Type.NUMBER }
            },
            required: ["homeWins", "awayWins", "draws", "lastFiveResults", "avgGoalsPerMatch", "avgCornersPerMatch"]
          },
          teamForm: {
            type: Type.OBJECT,
            properties: {
              homeForm: { type: Type.ARRAY, items: { type: Type.STRING } },
              awayForm: { type: Type.ARRAY, items: { type: Type.STRING } },
              homeAverages: {
                type: Type.OBJECT,
                properties: {
                  goalsScored: { type: Type.NUMBER },
                  goalsConceded: { type: Type.NUMBER },
                  corners: { type: Type.NUMBER }
                }
              },
              awayAverages: {
                type: Type.OBJECT,
                properties: {
                  goalsScored: { type: Type.NUMBER },
                  goalsConceded: { type: Type.NUMBER },
                  corners: { type: Type.NUMBER }
                }
              }
            },
            required: ["homeForm", "awayForm", "homeAverages", "awayAverages"]
          }
        },
        required: ["homeTeam", "awayTeam", "matchAnalysis", "predictions", "h2hStats", "teamForm"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function chatAboutMatch(message: string, context: PredictionResult | null, history: { role: 'user' | 'assistant'; content: string }[] = []): Promise<string> {
  const contextPrompt = context 
    ? `The user is asking about the following match: ${context.homeTeam} vs ${context.awayTeam}. 
       Analysis: ${context.matchAnalysis}. 
       Predictions: ${JSON.stringify(context.predictions)}. 
       H2H: ${JSON.stringify(context.h2hStats)}.`
    : "The user hasn't analyzed a match yet.";

  const historyParts = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [
      ...historyParts,
      { role: "user", parts: [{ text: `${contextPrompt}\nUser Message: ${message}` }] }
    ],
    config: {
      systemInstruction: "You are the Oracle AI Assistant for a football prediction app. Answer questions about matches, stats, and football history accurately and professionally."
    }
  });

  return response.text || "I'm sorry, I couldn't process that.";
}

export interface LeagueInfo {
  name: string;
  country: string;
  topTeams: string[];
  recentDynamic: string;
}

export async function getGlobalLeagues(): Promise<LeagueInfo[]> {
  const prompt = "Provide a summary of the top 5 global football leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1). For each league, include the common name, country, top 3 teams currently, and a brief description of the current league dynamic. Return as structured JSON.";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            country: { type: Type.STRING },
            topTeams: { type: Type.ARRAY, items: { type: Type.STRING } },
            recentDynamic: { type: Type.STRING }
          },
          required: ["name", "country", "topTeams", "recentDynamic"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export interface LiveMatch {
  home: string;
  away: string;
  score: string;
  status: string;
  minute?: string;
  league: string;
}

export async function getLiveStats(): Promise<LiveMatch[]> {
  const today = new Date().toISOString().split('T')[0];
  const prompt = `Find 10-15 significant live or recently concluded football match scores specifically for TODAY (${today}) from major global leagues. Return as a JSON array of objects with home team, away team, score, match status (e.g., Live, Finished), minute if live, and league name.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            home: { type: Type.STRING },
            away: { type: Type.STRING },
            score: { type: Type.STRING },
            status: { type: Type.STRING },
            minute: { type: Type.STRING },
            league: { type: Type.STRING }
          },
          required: ["home", "away", "score", "status", "league"]
        }
      }
    }
  });

  const matches: LiveMatch[] = JSON.parse(response.text);
  
  // Save to Reservoir (Firestore)
  try {
    const batch = matches.slice(0, 10); // Limit batch size for safety
    for (const match of batch) {
      // Avoid duplicates for today
      const q = query(
        collection(db, "live_stats"), 
        where("home", "==", match.home),
        where("away", "==", match.away),
        where("date", "==", today)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, "live_stats"), {
          ...match,
          date: today,
          timestamp: Date.now()
        });
      }
    }
  } catch (err) {
    console.error("Reservoir sync failed:", err);
  }

  return matches;
}

export async function getReservoirStats(): Promise<LiveMatch[]> {
  try {
    const q = query(
      collection(db, "live_stats"), 
      orderBy("timestamp", "desc"), 
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as LiveMatch);
  } catch (err) {
    console.error("Failed to fetch from reservoir:", err);
    return [];
  }
}
