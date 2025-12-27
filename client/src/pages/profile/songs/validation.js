import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
  songname: yup
    .string()
    .trim()
    .required("Song name is required")
    .min(1, "Song name must be at least 1 character")
    .max(200, "Song name must be less than 200 characters"),
  artist: yup
    .string()
    .trim()
    .required("Artist is required")
    .min(1, "Artist must be at least 1 character")
    .max(200, "Artist must be less than 200 characters"),
  year: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 5, `Year must be ${new Date().getFullYear() + 5} or earlier`),
  tags: yup
    .array()
    .of(yup.string().trim()),
  key: yup
    .string()
    .trim()
    .max(10, "Key must be less than 10 characters"),
  bpm: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .min(1, "BPM must be at least 1")
    .max(500, "BPM must be less than 500"),
  notes: yup
    .string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters"),
  link1: yup
    .string()
    .trim()
    .url("Must be a valid URL")
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  link2: yup
    .string()
    .trim()
    .url("Must be a valid URL")
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
});

export const resolver = yupResolver(schema);

