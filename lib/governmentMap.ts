import type { ChapterId } from './chapters';

export type MapStage = 'instrument' | 'deliberate' | 'record';
export type MapRegion = 'za' | 'natal' | 'emalahleni';
export type MapTopic = 'infrastructure' | 'service' | 'water';
export type ProvinceCode = 'LIM' | 'NW' | 'GP' | 'MP' | 'NC' | 'FS' | 'KZN' | 'WC' | 'EC';

export type MapVoice = {
  id: string;
  chapterId?: Extract<ChapterId, 'natal' | 'emalahleni'>;
  province: ProvinceCode;
  place: string;
  lng: number;
  lat: number;
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
  { name: string; chapterId?: Extract<ChapterId, 'natal' | 'emalahleni'> }
> = {
  LIM: { name: 'Limpopo' },
  NW: { name: 'North West' },
  GP: { name: 'Gauteng' },
  MP: { name: 'Mpumalanga', chapterId: 'emalahleni' },
  NC: { name: 'Northern Cape' },
  FS: { name: 'Free State' },
  KZN: { name: 'KwaZulu-Natal', chapterId: 'natal' },
  WC: { name: 'Western Cape' },
  EC: { name: 'Eastern Cape' },
};

export const PROVINCES_GEO_URL = '/geo/za-provinces.json';

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
    lng: 30.38,
    lat: -29.6,
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
    lng: 31.02,
    lat: -29.86,
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
    lng: 32.04,
    lat: -28.78,
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
    lng: 29.93,
    lat: -27.76,
    quote: 'The call centre logs tickets that never leave the municipality.',
    stage: 'deliberate',
    topic: 'service',
    picture: P.b,
  },
  {
    id: 'gqeberha',
    province: 'EC',
    place: 'Gqeberha',
    lng: 25.6,
    lat: -33.96,
    quote: 'The harbour clinic still uses a generator. The new office next door has lights all night.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.b,
  },
  {
    id: 'amathole',
    province: 'EC',
    place: 'Amathole',
    lng: 27.39,
    lat: -32.78,
    quote: 'EPWP crews paint the school, then leave. The gutters fail before the next term.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.a,
  },
  {
    id: 'mthatha',
    province: 'EC',
    place: 'Mthatha',
    lng: 28.78,
    lat: -31.59,
    quote: 'The municipal tanker is the water policy. The reservoir is a rumour.',
    stage: 'record',
    topic: 'water',
    picture: P.d,
  },
  {
    id: 'makhanda',
    province: 'EC',
    place: 'Makhanda',
    lng: 26.53,
    lat: -33.31,
    quote: 'A government building that cannot open on Monday is not a heritage site. It is a closed service.',
    stage: 'deliberate',
    topic: 'service',
    picture: P.c,
  },
  {
    id: 'polokwane',
    province: 'LIM',
    place: 'Polokwane',
    lng: 29.45,
    lat: -23.9,
    quote: 'The road to the pension pay-point is the service. If it washes away, the grant does not arrive.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.c,
  },
  {
    id: 'gaza',
    province: 'LIM',
    place: 'Giyani',
    lng: 30.72,
    lat: -23.31,
    quote: 'The dam wall was promised. The river we use is the one that is still here.',
    stage: 'deliberate',
    topic: 'water',
    picture: P.a,
  },
  {
    id: 'mahikeng',
    province: 'NW',
    place: 'Mahikeng',
    lng: 25.64,
    lat: -25.86,
    quote: 'A broken pump in the village does not appear on the provincial dashboard.',
    stage: 'record',
    topic: 'water',
    picture: P.b,
  },
  {
    id: 'rustenburg',
    province: 'NW',
    place: 'Rustenburg',
    lng: 27.24,
    lat: -25.65,
    quote: 'Hostel maintenance is public works, even when the mine says it is not.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.d,
  },
  {
    id: 'johannesburg',
    province: 'GP',
    place: 'Johannesburg',
    lng: 28.05,
    lat: -26.2,
    quote: 'The taxi rank is the clinic queue — we wait in both.',
    stage: 'instrument',
    topic: 'service',
    picture: P.a,
  },
  {
    id: 'tshwane',
    province: 'GP',
    place: 'Tshwane',
    lng: 28.19,
    lat: -25.75,
    quote: 'A government building that leaks is the same story as a house that leaks.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.c,
  },
  {
    id: 'emalahleni',
    chapterId: 'emalahleni',
    province: 'MP',
    place: 'eMalahleni',
    lng: 29.2,
    lat: -25.87,
    quote: 'They counted us on the day. They did not count us in the year.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.d,
  },
  {
    id: 'nelspruit',
    chapterId: 'emalahleni',
    province: 'MP',
    place: 'Mbombela',
    lng: 30.98,
    lat: -25.47,
    quote: 'A local welder who is not on the supplier list is not a local benefit.',
    stage: 'record',
    topic: 'infrastructure',
    picture: P.b,
  },
  {
    id: 'kimberley',
    province: 'NC',
    place: 'Kimberley',
    lng: 24.77,
    lat: -28.73,
    quote: 'The borehole is the office. If it fails, the town fails.',
    stage: 'instrument',
    topic: 'water',
    picture: P.a,
  },
  {
    id: 'upington',
    province: 'NC',
    place: 'Upington',
    lng: 21.26,
    lat: -28.45,
    quote: 'The clinic roof has to know this heat. Maintenance is not a coastal specification.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.c,
  },
  {
    id: 'bloemfontein',
    province: 'FS',
    place: 'Bloemfontein',
    lng: 26.21,
    lat: -29.12,
    quote: 'Rental stock sits empty while the waiting list grows.',
    stage: 'record',
    topic: 'service',
    picture: P.d,
  },
  {
    id: 'welkom',
    province: 'FS',
    place: 'Welkom',
    lng: 26.73,
    lat: -27.98,
    quote: 'A sinkhole is an infrastructure file, not only a mine file.',
    stage: 'instrument',
    topic: 'infrastructure',
    picture: P.b,
  },
  {
    id: 'cape-town',
    province: 'WC',
    place: 'Cape Town',
    lng: 18.42,
    lat: -33.93,
    quote: 'Firebreaks around state land are public works, even when the mountain is the neighbour.',
    stage: 'deliberate',
    topic: 'infrastructure',
    picture: P.a,
  },
  {
    id: 'beaufort',
    province: 'WC',
    place: 'Beaufort West',
    lng: 22.58,
    lat: -32.35,
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
