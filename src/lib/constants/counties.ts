export const WV_COUNTIES = [
  'BARBOUR',
  'BERKELEY',
  'BOONE',
  'BRAXTON',
  'BROOKE',
  'CABELL',
  'CALHOUN',
  'CLAY',
  'DODDRIDGE',
  'FAYETTE',
  'GILMER',
  'GRANT',
  'GREENBRIER',
  'HAMPSHIRE',
  'HANCOCK',
  'HARDY',
  'HARRISON',
  'JACKSON',
  'JEFFERSON',
  'KANAWHA',
  'LEWIS',
  'LINCOLN',
  'LOGAN',
  'MARION',
  'MARSHALL',
  'MASON',
  'MCDOWELL',
  'MERCER',
  'MINERAL',
  'MINGO',
  'MONONGALIA',
  'MONROE',
  'MORGAN',
  'NICHOLAS',
  'OHIO',
  'PENDLETON',
  'PLEASANTS',
  'POCAHONTAS',
  'PRESTON',
  'PUTNAM',
  'RALEIGH',
  'RANDOLPH',
  'RITCHIE',
  'ROANE',
  'SUMMERS',
  'TAYLOR',
  'TUCKER',
  'TYLER',
  'UPSHUR',
  'WAYNE',
  'WEBSTER',
  'WETZEL',
  'WIRT',
  'WOOD',
  'WYOMING',
] as const;

export type WVCounty = (typeof WV_COUNTIES)[number];

export const ACTIVE_DISPATCH_COUNTIES: WVCounty[] = ['GREENBRIER', 'KANAWHA'];

export function isDispatchActiveInCounty(county: string): boolean {
  return ACTIVE_DISPATCH_COUNTIES.includes(county as WVCounty);
}

export function formatCountyName(county: string): string {
  return county
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
