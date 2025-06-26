import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
  song1: yup.string().trim(),
  song2: yup.string().trim(),
  song3: yup.string().trim(),
  dedication: yup.string().trim(),
  tipAmount: yup
    .number()
    .typeError('Tip amount must be a number')
    .min(1, 'Tip amount must be at least $1')
    .max(1000, 'Tip amount cannot exceed $1000')
    .required('Tip amount is required'),
}).test('at-least-one-song', 'Please enter at least one song', function(value) {
  const songs = [value.song1, value.song2, value.song3].filter(song => song && song.trim());
  return songs.length > 0;
});

export const resolver = yupResolver(schema); 