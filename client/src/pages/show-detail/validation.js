import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
  song: yup.string().trim(),
  songNotInList: yup.string().trim(),
  dedication: yup.string().trim(),
  tipAmount: yup
    .number()
    .typeError('Tip amount must be a number')
    .min(1, 'Tip amount must be at least $1')
    .max(1000, 'Tip amount cannot exceed $1000')
    .required('Tip amount is required'),
}).test('one-song-required', 'Please select or enter exactly one song', function(value) {
  const hasSong = value.song && value.song.trim();
  const hasSongNotInList = value.songNotInList && value.songNotInList.trim();
  
  // Must have exactly one (XOR logic)
  return (hasSong && !hasSongNotInList) || (!hasSong && hasSongNotInList);
});

export const resolver = yupResolver(schema); 