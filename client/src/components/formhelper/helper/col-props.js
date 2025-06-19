import { useMemo } from 'react';

export const colProps = ({ size }) => {
  return useMemo(() => {
    if (size) return { size: size };
    return {};
  }, [size]); // Only recalculate when size changes
};