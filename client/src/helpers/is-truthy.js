export const isTruthy = (value)=>{
  const truthyValues = [
    '1',
    'enabled',
    'ok',
    'on',
    'true',
    'yes',
  ]

  if (value===true) return true;
  const normalizedValue=(value||"").toString().toLowerCase();
  return truthyValues.includes(normalizedValue);
}