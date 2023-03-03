export function quantile(values: number[], percent: number): number {
  if (values.length == 0)
    return 0;

  if (values.length == 1 || percent <= 0)
    return values[0];
  
  if (percent >= 1)
    return values[values.length - 1];

  const index = (values.length - 1) * percent;
  const indexFloor = Math.floor(index);
  const valueLow = values[indexFloor];
  const valueHigh = values[indexFloor + 1];

  return lerp(valueLow, valueHigh, index - indexFloor);
}

export function lerp(start: number, end: number, delta: number) {
  return delta * (end - start) + start;
}
