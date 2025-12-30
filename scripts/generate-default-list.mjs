import fs from "fs";
import path from "path";
import { normalizeTitle, manualOverrides, isLooseMatch } from "./song-data.mjs";

const rootDir = path.resolve(".");
const songlistPath = path.join(rootDir, "doc", "Songlist-final.tab");
const ffListPath = path.join(rootDir, "client", "doc", "ffList.tab");
const defaultListPath = path.join(rootDir, "client", "doc", "defaultList.tab");

const songlistRaw = fs.readFileSync(songlistPath, "utf8");
const [headerLine, ...songLines] = songlistRaw.split(/\r?\n/).filter(Boolean);

const songMap = new Map();
for (const line of songLines) {
  const [key, title, bpm, artist, genre, decade, ug, lyrics] = line.split("\t");
  if (!title) continue;
  const normalized = normalizeTitle(title);
  if (!songMap.has(normalized)) {
    songMap.set(normalized, { line, data: { key, title, bpm, artist, genre, decade, ug, lyrics } });
  }
}

const ffRaw = fs.readFileSync(ffListPath, "utf8");
const ffLines = ffRaw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const outputRows = [];
const missingRows = [];


for (const line of ffLines) {
  const parts = line.split("\t");
  if (parts.length < 2) continue;
  const [title, artist = "", genre = "", year = "", decade = "", action = ""] = parts;
  const normalized = normalizeTitle(title);

  const matchedEntry = (() => {
    if (songMap.has(normalized)) {
      return songMap.get(normalized);
    }

    for (const [key, entry] of songMap.entries()) {
      if (isLooseMatch(key, normalized)) {
        return entry;
      }
    }
    return null;
  })();

  if (matchedEntry) {
    outputRows.push(matchedEntry.line);
  } else {
    const normalizedDecade = decade ? (decade.endsWith("s") ? decade : `${decade}s`) : "";
    const override = manualOverrides.get(normalized) || null;
    const row = [
      override?.key ?? "",
      title,
      override?.bpm ?? "",
      artist,
      genre,
      normalizedDecade,
      override?.ug ?? "",
      override?.lyrics ?? ""
    ].join("\t");
    missingRows.push(row);
  }
}

const allRows = [headerLine, ...outputRows, ...missingRows];
fs.writeFileSync(defaultListPath, allRows.join("\n") + "\n", "utf8");

console.log(`Wrote ${outputRows.length} matched songs and ${missingRows.length} new entries to ${path.relative(rootDir, defaultListPath)}`);
