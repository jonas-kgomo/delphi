import type { ChapterId } from './chapters';

export type MapStage = 'instrument' | 'deliberate' | 'record';
export type MapRegion = 'za' | 'natal';
export type MapTopic = 'infrastructure' | 'service' | 'water';
export type ProvinceCode = 'LIM' | 'NW' | 'GP' | 'MP' | 'NC' | 'FS' | 'KZN' | 'WC' | 'EC';

export type MapVoice = {
  id: string;
  chapterId?: Extract<ChapterId, 'natal'>;
  province: ProvinceCode;
  place: string;
  quote: string;
  stage: MapStage;
  topic: MapTopic;
  picture: string;
};

export const TOPIC_LABEL: Record<MapTopic, string> = {
  infrastructure: 'Public works',
  service: 'Service delivery',
  water: 'Water',
};

export const STAGE_LABEL: Record<MapStage, string> = {
  instrument: 'Instrument',
  deliberate: 'Deliberate',
  record: 'Record',
};

export const PROVINCE_META: Record<
  ProvinceCode,
  { name: string; chapterId?: Extract<ChapterId, 'natal'> }
> = {
  LIM: { name: 'Limpopo' },
  NW: { name: 'North West' },
  GP: { name: 'Gauteng' },
  MP: { name: 'Mpumalanga' },
  NC: { name: 'Northern Cape' },
  FS: { name: 'Free State' },
  KZN: { name: 'KwaZulu-Natal', chapterId: 'natal' },
  WC: { name: 'Western Cape' },
  EC: { name: 'Eastern Cape' },
};

/**
 * Multi-cell tilegram that reads as South Africa:
 * Limpopo north, NC the western mass, WC the south-west, EC the south,
 * KZN the eastern bulge, GP a small centre.
 */
export const PROVINCE_CELLS: { code: ProvinceCode; col: number; row: number; label?: boolean }[] = [
  { code: 'LIM', col: 1, row: 0, label: true },
  { code: 'LIM', col: 2, row: 0 },
  { code: 'NW', col: 0, row: 1, label: true },
  { code: 'GP', col: 1, row: 1, label: true },
  { code: 'MP', col: 2, row: 1, label: true },
  { code: 'NW', col: 0, row: 2 },
  { code: 'FS', col: 1, row: 2, label: true },
  { code: 'KZN', col: 2, row: 2, label: true },
  { code: 'KZN', col: 3, row: 2 },
  { code: 'NC', col: 0, row: 3, label: true },
  { code: 'FS', col: 1, row: 3 },
  { code: 'KZN', col: 2, row: 3 },
  { code: 'NC', col: 0, row: 4 },
  { code: 'WC', col: 1, row: 4, label: true },
  { code: 'EC', col: 2, row: 4, label: true },
  { code: 'EC', col: 3, row: 4 },
  { code: 'NC', col: 0, row: 5 },
  { code: 'WC', col: 1, row: 5 },
  { code: 'EC', col: 2, row: 5 },
];

const P = {
  a: '/portraits/a.jpg?v=3',
  b: '/portraits/b.jpg?v=3',
  c: '/portraits/c.jpg?v=3',
  d: '/portraits/d.jpg?v=3',
};

export const GOVERNMENT_MAP_VOICES: MapVoice[] = [
  {
    id: 'umgungundlovu',
    chapterId: 'natal',
    province: 'KZN',
    place: 'uMgungundlovu',
    quote: 'Clinic buildings fail before the road that serves them is finished.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.a,
  },
  {
    id: 'durban',
    chapterId: 'natal',
    province: 'KZN',
    place: 'eThekwini',
    quote: 'EPWP jobs should stay with the building — paint, drains, locks — not only new sod-turnings.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.d,
  },
  {
    id: 'richards-bay',
    chapterId: 'natal',
    province: 'KZN',
    place: 'Richards Bay',
    quote: 'We stopped calling because nothing comes. If a crew came once, the record would fill itself.',
    stage: 'record',
    topic: 'service',
    picture: P.c,
  },
  {
    id: 'newcastle',
    chapterId: 'natal',
    province: 'KZN',
    place: 'Newcastle',
    quote: 'The call centre logs tickets that never leave the municipality.',
    stage: 'deliberate',
    topic: 'service',
    picture: P.b,
  },
  {
    id: 'gqeberha',
    province: 'EC',
    place: 'Gqeberha',
    quote: 'The harbour clinic still uses a generator. The new office next door has lights all night.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.b,
  },
  {
    id: 'amathole',
    province: 'EC',
    place: 'Amathole',
    quote: 'EPWP crews paint the school, then leave. The gutters fail before the next term.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.a,
  },
  {
    id: 'mthatha',
    province: 'EC',
    place: 'Mthatha',
    quote: 'The municipal tanker is the water policy. The reservoir is a rumour.',
    stage: 'record',
    topic: 'water',
    picture: P.d,
  },
  {
    id: 'makhanda',
    province: 'EC',
    place: 'Makhanda',
    quote: 'A government building that cannot open on Monday is not a heritage site. It is a closed service.',
    stage: 'deliberate',
    topic: 'service',
    picture: P.c,
  },
  {
    id: 'polokwane',
    province: 'LIM',
    place: 'Polokwane',
    quote: 'The road to the pension pay-point is the service. If it washes away, the grant does not arrive.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.c,
  },
  {
    id: 'gaza',
    province: 'LIM',
    place: 'Giyani',
    quote: 'The dam wall was promised. The river we use is the one that is still here.',
    stage: 'deliberate',
    topic: 'water',
    picture: P.a,
  },
  {
    id: 'mahikeng',
    province: 'NW',
    place: 'Mahikeng',
    quote: 'A broken pump in the village does not appear on the provincial dashboard.',
    stage: 'record',
    topic: 'water',
    picture: P.b,
  },
  {
    id: 'rustenburg',
    province: 'NW',
    place: 'Rustenburg',
    quote: 'Hostel maintenance is public works, even when the mine says it is not.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.d,
  },
  {
    id: 'johannesburg',
    province: 'GP',
    place: 'Johannesburg',
    quote: 'The taxi rank is the clinic queue — we wait in both.',
    stage: 'instrument',
    topic: 'service',
    picture: P.a,
  },
  {
    id: 'tshwane',
    province: 'GP',
    place: 'Tshwane',
    quote: 'A government building that leaks is the same story as a house that leaks.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.c,
  },
  {
    id: 'emalahleni',
    province: 'MP',
    place: 'eMalahleni',
    quote: 'The clinic waits in the dust the same hours the office waits in town.',
    stage: 'instrument',
    topic: 'service',
    picture: P.d,
  },
  {
    id: 'nelspruit',
    province: 'MP',
    place: 'Mbombela',
    quote: 'The new office opened. The water tanker still comes on Thursdays.',
    stage: 'record',
    topic: 'water',
    picture: P.b,
  },
  {
    id: 'kimberley',
    province: 'NC',
    place: 'Kimberley',
    quote: 'The borehole is the office. If it fails, the town fails.',
    stage: 'instrument',
    topic: 'water',
    picture: P.a,
  },
  {
    id: 'upington',
    province: 'NC',
    place: 'Upington',
    quote: 'The clinic roof has to know this heat. Maintenance is not a coastal specification.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.c,
  },
  {
    id: 'bloemfontein',
    province: 'FS',
    place: 'Bloemfontein',
    quote: 'Rental stock sits empty while the waiting list grows.',
    stage: 'record',
    topic: 'service',
    picture: P.d,
  },
  {
    id: 'welkom',
    province: 'FS',
    place: 'Welkom',
    quote: 'A sinkhole is an infrastructure file, not only a mine file.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.b,
  },
  {
    id: 'cape-town',
    province: 'WC',
    place: 'Cape Town',
    quote: 'Firebreaks around state land are public works, even when the mountain is the neighbour.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.a,
  },
  {
    id: 'beaufort',
    province: 'WC',
    place: 'Beaufort West',
    quote: 'When the dam is a line in the mud, the town meeting is about water, not growth.',
    stage: 'instrument',
    topic: 'water',
    picture: P.c,
  },
];

export const voicesForRegion = (region: MapRegion): MapVoice[] => {
  if (region === 'za') return GOVERNMENT_MAP_VOICES;
  return GOVERNMENT_MAP_VOICES.filter((v) => v.chapterId === region);
};

export const voicesForTopic = (voices: MapVoice[], topic: MapTopic | 'all'): MapVoice[] => {
  if (topic === 'all') return voices;
  return voices.filter((v) => v.topic === topic);
};
