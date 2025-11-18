import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

let accessToken = null;
let tokenExpiresAt = 0;

async function requestClientToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiresAt - 60000) return accessToken; // reuse if >1min remaining

  const tokenUrl = "https://accounts.spotify.com/api/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");

  const res = await axios.post(tokenUrl, params.toString(), {
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  accessToken = res.data.access_token;
  tokenExpiresAt = Date.now() + (res.data.expires_in * 1000);
  return accessToken;
}

export async function spotifyGet(path, params = {}) {
  const token = await requestClientToken();
  const url = path.startsWith("http") ? path : `https://api.spotify.com/v1/${path}`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return res.data;
}
