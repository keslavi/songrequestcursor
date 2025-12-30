import fs from "fs";
import path from "path";
import { normalizeTitle, manualOverrides, isLooseMatch } from "./song-data.mjs";

const rootDir = path.resolve(".");
const songlistPath = path.join(rootDir, "doc", "Songlist-final.tab");
const defaultListPath = path.join(rootDir, "client", "doc", "defaultList.tab");
const ff2Path = path.join(rootDir, "client", "doc", "ff2.tab");

const readTabAsMap = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return new Map();
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const [header, ...lines] = raw.split(/\r?\n/).filter(Boolean);
  const map = new Map();

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;

    const [key, title, bpm, artist, genre, decade, ug, lyrics] = parts;
    if (!title) continue;
    const normalized = normalizeTitle(title);
    if (!normalized) continue;

    const entry = {
      key: key ?? "",
      title: title ?? "",
      bpm: bpm ?? "",
      artist: artist ?? "",
      genre: genre ?? "",
      decade: decade ?? "",
      ug: ug ?? "",
      lyrics: lyrics ?? ""
    };

    if (!map.has(normalized)) {
      map.set(normalized, entry);
    }
  }

  return map;
};

const findEntry = (map, normalized) => {
  if (!normalized) return null;
  if (map.has(normalized)) {
    return map.get(normalized);
  }

  for (const [key, value] of map.entries()) {
    if (isLooseMatch(key, normalized)) {
      return value;
    }
  }

  return null;
};

const findManualOverride = (normalized) => {
  if (!normalized) return null;
  if (manualOverrides.has(normalized)) {
    return manualOverrides.get(normalized);
  }

  for (const [key, value] of manualOverrides.entries()) {
    if (isLooseMatch(key, normalized)) {
      return value;
    }
  }

  return null;
};

const computeDecade = (decade, year) => {
  const normalizedDecade = (decade || "").trim();
  if (normalizedDecade) {
    if (/^\d{4}s$/i.test(normalizedDecade)) {
      return normalizedDecade;
    }
    if (/^\d{4}$/.test(normalizedDecade)) {
      return `${normalizedDecade.slice(0, 3)}0s`;
    }
    return normalizedDecade;
  }

  const normalizedYear = (year || "").trim();
  if (/^\d{4}$/.test(normalizedYear)) {
    return `${normalizedYear.slice(0, 3)}0s`;
  }

  return "";
};

const songMap = readTabAsMap(songlistPath);
const defaultMap = readTabAsMap(defaultListPath);

console.log(`Loaded ${songMap.size} songlist entries and ${defaultMap.size} default entries.`);

const ff2Raw = fs.readFileSync(ff2Path, "utf8");
const ff2Lines = ff2Raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const [, ...rows] = ff2Lines; // skip existing header
const header = "Key\tSong Title\tBPM\tArtist\tGenre\tDecade\tUltimate Guitar Link\tLyrics Link";

const outputRows = [header];

let matchedSonglist = 0;
let matchedDefault = 0;
let matchedManual = 0;
let unmatched = 0;

for (const row of rows) {
  const parts = row.split("\t");
  if (parts.length < 2) {
    continue;
  }

  let title = "";
  let artist = "";
  let genre = "";
  let year = "";
  let decadeRaw = "";
  let existingKey = "";
  let existingBpm = "";
  let existingUg = "";
  let existingLyrics = "";

  if (parts.length >= 8) {
    [existingKey, title, existingBpm, artist = "", genre = "", decadeRaw = "", existingUg = "", existingLyrics = ""] = parts;
  } else {
    [title, artist = "", genre = "", year = "", decadeRaw = ""] = parts;
  }

  const normalized = normalizeTitle(title);

  const fallbackDecade = computeDecade(decadeRaw, year);

  let data = findEntry(songMap, normalized);
  if (data) {
    matchedSonglist += 1;
  } else {
    data = findEntry(defaultMap, normalized);
    if (data) {
      matchedDefault += 1;
    }
  }

  if (!data) {
    const override = findManualOverride(normalized);
    if (override) {
      matchedManual += 1;
      data = {
        key: override.key ?? "",
        title: title,
        bpm: override.bpm ?? "",
        artist,
        genre,
        decade: fallbackDecade,
        ug: override.ug ?? "",
        lyrics: override.lyrics ?? ""
      };
    }
  }

  if (!data) {
    if (unmatched < 5) {
      console.warn(`Unmatched: "${title}" -> ${normalized}`);
    }
    unmatched += 1;
    outputRows.push([
      existingKey,
      title,
      existingBpm,
      artist,
      genre,
      fallbackDecade,
      existingUg,
      existingLyrics
    ].join("\t"));
    continue;
  }

  outputRows.push([
    data.key ?? existingKey ?? "",
    data.title ?? title,
    data.bpm ?? existingBpm ?? "",
    data.artist ?? artist,
    data.genre ?? genre,
    computeDecade(data.decade, year) || fallbackDecade,
    data.ug ?? existingUg ?? "",
    data.lyrics ?? existingLyrics ?? ""
  ].join("\t"));
}

fs.writeFileSync(ff2Path, `${outputRows.join("\n")}\n`, "utf8");

console.log(
  `Updated ${rows.length} entries in ${path.relative(rootDir, ff2Path)} (songlist: ${matchedSonglist}, default list: ${matchedDefault}, manual: ${matchedManual}, unmatched: ${unmatched}).`
);
