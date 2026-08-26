import {
  DataEssay,
  QuestionType,
  Survey,
  Utterance,
  Vote,
  VoteValue,
} from '../types';
import { PRECINCT_FUNCTIONS } from './brand';

export type ChapterId = 'natal' | 'emalahleni' | 'cape' | 'vhembe' | 'kenya' | 'lagos';
export type DemoKind = 'government' | 'development' | 'technology';
export type ChapterAudience = DemoKind;
export type FunctionWard = (typeof PRECINCT_FUNCTIONS)[number]['ward'];

export const DEMO_KINDS: DemoKind[] = ['government', 'development', 'technology'];

export const SECTORS: Record<
  DemoKind,
  { id: DemoKind; nav: string; navShort: string; eyebrow: string; title: string; lead: string; summary: string }
> = {
  government: {
    id: 'government',
    nav: 'Government',
    navShort: 'Gov',
    eyebrow: 'For government',
    title: 'Precinct for Government',
    lead: 'Surface where residents and the department already agree.',
    summary:
      'Infrastructure, service delivery, local economic benefit — the file that ward and Pretoria should read together.',
  },
  development: {
    id: 'development',
    nav: 'Development',
    navShort: 'Dev',
    eyebrow: 'For development',
    title: 'Precinct for Development',
    lead: 'Climate, health, livelihoods, and community programmes.',
    summary:
      'Records for places and people — adaptation, public health, and the informal knowledge that plans usually skip.',
  },
  technology: {
    id: 'technology',
    nav: 'Technology',
    navShort: 'Tech',
    eyebrow: 'For technology',
    title: 'Precinct for Technology',
    lead: 'How people meet tools — views, trust, and governance.',
    summary:
      'Subjective views on AI and digital services: what broke trust, who stays in the room, and who belongs in the governance brief.',
  },
};

export type PromptContext = {
  domain: string;
  audience: string;
  region: string;
  tone: string;
};

export type SeededMessage = {
  role: 'model' | 'user';
  text: string;
  questionId?: string;
};

export type SeededInterview = {
  name: string;
  place: string;
  picture: string;
  messages: SeededMessage[];
};

/** City sits aside the topic — never fuse them into “Cape Precinct Records”. */
export function makePrecinctLabel(city: string, topic: string) {
  return {
    city,
    topic,
    title: `${topic} Precinct`,
    label: `${city} · ${topic}`,
  };
}

export type Chapter = {
  id: ChapterId;
  audience: ChapterAudience;
  fileNo: string;
  /** Place name shown to the left of the topic */
  city: string;
  /** Subject of the precinct — Climate, Public Works, Local Benefit, Malaria, Digital ID */
  topic: string;
  title: string;
  /** Plain “Cape · Climate” for lists and SEO */
  label: string;
  shortTitle: string;
  theme: string;
  region: string;
  country: string;
  partner: string;
  partnerUrl?: string;
  preparedFor: string;
  summary: string;
  prompt: string;
  context: PromptContext;
  functions: FunctionWard[];
  survey: Survey;
  interviews: SeededInterview[];
  utterances: Utterance[];
  votes: Vote[];
  essay: DataEssay;
};

type Line = { text: string; reasons?: string[] };

const q = (id: string, text: string, type: QuestionType, extra: Partial<Survey['questions'][number]> = {}) => ({
  id,
  text,
  type,
  ...extra,
});

function corpus(surveyId: string, lines: Line[], blocs: VoteValue[][]): { utterances: Utterance[]; votes: Vote[] } {
  const base = 1_740_000_000_000;
  const utterances: Utterance[] = lines.map((line, i) => ({
    id: `${surveyId}-u${i}`,
    surveyId,
    text: line.text,
    source: 'extracted',
    authorId: 'seed',
    createdAt: base + i,
  }));
  const votes: Vote[] = [];
  blocs.forEach((pattern, vi) => {
    pattern.forEach((value, ui) => {
      const u = utterances[ui];
      if (!u) return;
      votes.push({
        id: `${surveyId}-v${vi}-${ui}`,
        utteranceId: u.id,
        surveyId,
        voterId: `${surveyId}-vtr-${vi}`,
        value,
        reason: vi < (lines[ui]?.reasons?.length || 0) ? lines[ui].reasons?.[vi] : undefined,
        createdAt: base + 100 + vi * 10 + ui,
      });
    });
  });
  return { utterances, votes };
}

const A = 'agree' as const;
const D = 'disagree' as const;
const P = 'pass' as const;

const natalLines: Line[] = [
  {
    text: 'Clinic buildings fail before the road that serves them is finished.',
    reasons: [
      'In uMgungundlovu the new wing already leaks, but the access road is still gravel.',
      'We see the same pattern on EPWP sites — the asset is handed over without a maintenance crew.',
    ],
  },
  {
    text: 'Expanded Public Works jobs should be tied to local maintenance, not only new builds.',
    reasons: ['People want work that keeps the clinic open, not another sod-turning.'],
  },
  {
    text: 'Residents will report faults if someone actually arrives.',
    reasons: ['We stopped calling because nothing comes. If a crew came once, the record would fill itself.'],
  },
  {
    text: 'Municipal call centres already collect this — another survey is a waste.',
    reasons: ['The call centre logs tickets that never leave the municipality.'],
  },
  {
    text: 'Tender delays hurt service more than the size of the budget.',
    reasons: ['The money was there. The contractor was not.'],
  },
  {
    text: 'Ward councillors should read the same infrastructure record as Pretoria.',
    reasons: ['If Pretoria sees a different file, the ward will keep waiting.'],
  },
];

const natalBlocs: VoteValue[][] = [
  [A, A, A, D, A, A],
  [A, A, A, D, A, A],
  [A, A, A, P, A, A],
  [A, A, D, D, A, A],
  [D, D, A, A, D, D],
  [D, P, A, A, D, D],
  [A, A, A, D, P, A],
  [A, D, A, D, A, A],
];

const capeLines: Line[] = [
  {
    text: 'Flood memory is held by elders, not by municipal GIS.',
    reasons: [
      'In Amathole they still name the years by the rivers, not by the disaster declaration.',
      'Our maps start in 2018. The stories start much earlier.',
    ],
  },
  {
    text: 'Adaptation often means moving livestock before moving houses.',
    reasons: ['We move the goats first. The house waits for the river to decide.'],
  },
  {
    text: 'National climate plans skip Eastern Cape vernacular — isiXhosa terms for wind and drought do not appear.',
    reasons: ['If the plan cannot say the weather, it cannot hear the response.'],
  },
  {
    text: 'People will not leave ancestral land for a resilience corridor.',
    reasons: ['A corridor that erases the homestead is not safety. It is a removal.'],
  },
  {
    text: 'Community rain gauges and shoreline marks should count as official observation.',
    reasons: ['We already mark the high-water line. The GIS does not.'],
  },
  {
    text: 'Adaptation money arrives after the season it was meant for.',
    reasons: ['By the time the grant lands, the goats have already moved.'],
  },
];

const capeBlocs: VoteValue[][] = [
  [A, A, A, A, A, A],
  [A, A, A, A, A, A],
  [A, A, A, D, A, A],
  [A, P, A, A, A, A],
  [D, D, D, D, P, A],
  [D, A, D, A, D, A],
  [A, A, A, P, A, A],
  [A, A, A, A, A, D],
];

const kenyaLines: Line[] = [
  {
    text: 'AI tools fail when they assume English and a constant data connection.',
    reasons: [
      'The kiosk dies when Safaricom dips. The clerk does not.',
      'Patients switch to Kiswahili mid-sentence. The model does not.',
    ],
  },
  {
    text: 'People trust a known clerk more than a chatbot, even when the chatbot is faster.',
    reasons: ['The clerk knows the family. The prompt does not.'],
  },
  {
    text: 'AI can help if it stays in the clinic — not if records leave for a cloud no one can name.',
    reasons: ['We will use it if the file stays in the room.'],
  },
  {
    text: 'Cultural knowledge is not unstructured data waiting to be extracted.',
    reasons: ['If it only counts when it is in English, it was never counted.'],
  },
  {
    text: 'Job-loss anxiety is real even when the tool is useful.',
    reasons: ['Faster triage does not tell me who still has a post next year.'],
  },
  {
    text: 'Tech governance must include people who will never open an app.',
    reasons: ['My mother will never log in. She still uses the clinic.'],
  },
];

const kenyaBlocs: VoteValue[][] = [
  [A, A, A, A, A, A],
  [A, A, A, A, A, A],
  [A, A, A, A, P, A],
  [A, D, A, A, A, A],
  [D, D, D, P, D, D],
  [D, A, D, D, A, P],
  [A, A, A, A, A, A],
  [A, A, A, A, D, A],
];

const natalSurvey: Survey = {
  id: 'chapter-natal',
  title: 'Public Works Precinct — infrastructure & service delivery',
  description:
    'KwaZulu-Natal pilot: citizen feedback on public buildings, roads to state assets, and local service delivery — for municipal authorities and the Department of Public Works and Infrastructure.',
  questions: [
    q('n0', 'Which public asset do you use most often in your ward?', QuestionType.MultipleChoice, {
      options: ['Clinic or hospital', 'School', 'Government office', 'Road to a state facility', 'EPWP / community works site', 'Other'],
    }),
    q('n1', 'How reliable is that asset in a typical month?', QuestionType.Scale, {
      minLabel: 'Usually closed or broken',
      maxLabel: 'Usually open and usable',
    }),
    q('n2', 'When something fails, what happens first?', QuestionType.MultipleChoice, {
      options: ['We wait', 'We call the municipality', 'We tell the councillor', 'We fix it ourselves', 'We stop using it'],
    }),
    q('n3', 'What would make you report a fault again?', QuestionType.LongText),
    q('n4', 'Should EPWP work prioritise maintenance of existing buildings over new construction?', QuestionType.YesNo),
    q('n5', 'Who should see this record?', QuestionType.Matrix, {
      rows: ['Ward councillor', 'Municipality', 'Provincial Public Works', 'National DPWI'],
      options: ['Must see it', 'Useful', 'Not needed'],
    }),
  ],
};

const capeSurvey: Survey = {
  id: 'chapter-cape',
  title: 'Climate Precinct — observations & adaptation',
  description:
    'Eastern Cape initiative: community-led observations of drought, flood, and coastal change, and the adaptation strategies people already practise.',
  questions: [
    q('c0', 'What change have you noticed most clearly in the last five years?', QuestionType.MultipleChoice, {
      options: ['Longer dry spells', 'Sudden floods', 'Coastal erosion', 'Wind / dust', 'Crop or livestock loss', 'Other'],
    }),
    q('c1', 'How prepared is your place for the next bad season?', QuestionType.Scale, {
      minLabel: 'Not prepared',
      maxLabel: 'We have a working plan',
    }),
    q('c2', 'Where does useful warning usually come from?', QuestionType.MultipleChoice, {
      options: ['Elders / neighbours', 'Radio', 'Municipality', 'WhatsApp groups', 'We find out too late'],
    }),
    q('c3', 'Describe one adaptation that already works — even if it is informal.', QuestionType.LongText),
    q('c4', 'Should community rain gauges and shoreline marks count as official observation?', QuestionType.YesNo),
    q('c5', 'What should regional policy protect first?', QuestionType.MultipleChoice, {
      options: ['Ancestral land', 'Livestock routes', 'Clinics and schools', 'Coastal settlements', 'Water points'],
    }),
  ],
};

const kenyaSurvey: Survey = {
  id: 'chapter-kenya',
  title: 'Subjective Views Precinct — AI in low-resource, culturally rich settings',
  description:
    'Public perceptions, workforce experience, and values around AI deployment — to inform equitable tech governance.',
  questions: [
    q('k0', 'Where have you met AI recently — if at all?', QuestionType.MultipleChoice, {
      options: ['Clinic or hospital', 'School', 'Government service', 'Phone / M-Pesa / apps', 'Workplace', 'I have not'],
    }),
    q('k1', 'When it worked, how useful was it?', QuestionType.Scale, {
      minLabel: 'Got in the way',
      maxLabel: 'Genuinely helped',
    }),
    q('k2', 'What broke trust fastest?', QuestionType.MultipleChoice, {
      options: ['Language', 'No connectivity', 'Records leaving the room', 'It replaced a person', 'It was wrong', 'I still trust it'],
    }),
    q('k3', 'In your own words: should this kind of tool be used where you live? Why?', QuestionType.LongText),
    q('k4', 'Should an AI system keep records on a local machine rather than a remote cloud?', QuestionType.YesNo),
    q('k5', 'Whose view must be in the governance room?', QuestionType.Matrix, {
      rows: ['Clerks and nurses', 'Patients / residents', 'Elders', 'National regulators', 'Vendors'],
      options: ['Must be present', 'Consulted', 'Optional'],
    }),
  ],
};

const natalEssay: DataEssay = {
  headline: 'The building is finished. The service is not.',
  lede:
    'Across KwaZulu-Natal wards in this pilot, people do not argue about whether the state should build. They argue about whether anyone returns after the ribbon. Sentiment tracks arrival of a crew, not the size of a tender.',
  coexistence:
    'Hope and fatigue sit in the same voice: residents will report again if a van comes once. The same person who says “another survey is a waste” still wants Pretoria and the ward to read one file.',
  methods:
    'Synthetic pilot record for demonstration. Eight constructed voter patterns on six statements distilled from interview themes. Consensus means similar support across groups; contested means groups pull apart. Not official DPWI statistics.',
  bridgeEssay:
    'A wide bridge holds on three points. First, EPWP labour should stay with the asset — paint, drains, locks — rather than only new builds. Second, fault reporting is not a civic virtue problem; it is a response problem. Third, the record should be shared: ward, municipality, province, and national Public Works reading the same page. That is the civic bridge this precinct is for.',
  tensionEssay:
    'Tension gathers around whether existing municipal call centres already do this work. One group treats a new record as duplication. Another treats the call centre as a drawer that never opens. A smaller split appears on whether councillors can be trusted with the same file as the department. The instrument does not resolve that; it makes the disagreement visible before a policy is copied from one municipality to the next.',
  closing:
    'For DPWI and municipal authorities, the useful number is not a satisfaction score. It is whether people still believe a report will produce a visit. Natal · Public Works Precinct is built to watch that belief move — before and after deliberation, and before the next handover.',
  bridges: [
    'Tie EPWP work to maintenance of existing state assets',
    'A single visit restores willingness to report',
    'Ward and national officials should read one infrastructure record',
  ],
  tensions: [
    'Is a new record duplication of the municipal call centre?',
    'Who may see the file — councillor, municipality, Pretoria?',
  ],
};

const capeEssay: DataEssay = {
  headline: 'The season is already in the language.',
  lede:
    'In the Eastern Cape, people are not waiting for a climate plan in order to adapt. They are moving livestock, marking shorelines, and naming drought in words that do not appear in the regional strategy.',
  coexistence:
    'Attachment to ancestral land and a clear-eyed account of flood and wind live in the same household. Refusal to relocate is not denial of risk. It is a different theory of what must be protected.',
  methods:
    'Synthetic pilot record for demonstration. Constructed votes on six community statements. Prepared to show how The Precinct would carry observation into a policy brief. Not an official climate inventory.',
  bridgeEssay:
    'Agreement is strong that informal observation should count: rain gauges, shoreline marks, elders’ flood years. Adaptation is described as a practice (move the herd, share water points) more often than as a document. Policy that cannot hear isiXhosa terms for wind and drought is, in this record, a policy that arrives after the season.',
  tensionEssay:
    'The hard split is relocation. “Resilience corridors” read to one group as safety and to another as dispossession. A second tension is time: money that arrives after the rains cannot be evaluated as if it arrived on time. Deliberation here is not a poll on belief in climate change. It is a structured argument about land, livestock, and whose marks count.',
  closing:
    'Cape · Climate Precinct treats community observation as the first instrument, not the appendix. The civic bridge is to regional policy — if the essay can carry vernacular and informal gauges without translating them out of existence.',
  bridges: [
    'Community gauges and shoreline marks as official observation',
    'Adaptation already practised: livestock, water, warning through neighbours',
    'Plans must use the language the weather is named in',
  ],
  tensions: [
    'Relocation versus remaining on ancestral land',
    'Finance timed to the season, not the fiscal year',
  ],
};

const kenyaEssay: DataEssay = {
  headline: 'Useful is not the same as welcome.',
  lede:
    'In this Kenya record, people judge AI first by language, current, and whether the file leaves the room. Efficacy is local. A tool that works in a clinic with a generator and a known clerk is not the same tool as a cloud that no one can name.',
  coexistence:
    'The same nurse who says the triage prompt is faster also says she will not let a record travel. Anxiety about jobs sits beside a request for the tool to stay. Subjective view is the data: this precinct is for values, not only for accuracy scores.',
  methods:
    'Synthetic pilot record for demonstration. Constructed deliberation on six statements about AI in low-resource, culturally dense settings. For equitable tech governance briefings. Not a national opinion poll.',
  bridgeEssay:
    'A broad bridge: systems that assume English and always-on data fail the places this record is about. Governance rooms that exclude people who will never open an app are incomplete. Cultural knowledge is refused as “unstructured data.” Where AI is accepted, it is accepted as a room-scale instrument — on a local machine, next to a person who is still there.',
  tensionEssay:
    'Trust in a chatbot versus a known clerk splits the room. One group will use a faster prompt; another treats the clerk as the institution. Job-loss fear is not dissolved by usefulness. The contested question is not “AI: yes or no.” It is who remains in the room, and who owns the file.',
  closing:
    'Kenya · Subjective Views Precinct is an elicitation and a survey of lived view — efficacy as lived, not as a vendor slide. The civic bridge is to regulators and ministries who need those views before a deployment is copied from a high-connectivity pilot.',
  bridges: [
    'Design for intermittent data and languages actually spoken',
    'Keep records in the room',
    'Governance must include people who will never open an app',
  ],
  tensions: [
    'Clerk versus chatbot as the face of the institution',
    'Usefulness does not cancel job-loss fear',
  ],
};

const PORTRAIT = {
  a: '/portraits/a.jpg?v=3',
  b: '/portraits/b.jpg?v=3',
  c: '/portraits/c.jpg?v=3',
  d: '/portraits/d.jpg?v=3',
};

const natalInterviews: SeededInterview[] = [
  {
    name: 'Nomsa Dlamini',
    place: 'uMgungundlovu',
    picture: PORTRAIT.a,
    messages: [
      {
        role: 'model',
        text: 'Nomsa — thank you for sitting with this. Which public asset do you use most often in your ward?',
        questionId: 'n0',
      },
      { role: 'user', text: 'Clinic or hospital', questionId: 'n0' },
      {
        role: 'model',
        text: 'The clinic, then. In a typical month, how reliable is it — from usually closed or broken, through to usually open and usable?',
        questionId: 'n1',
      },
      {
        role: 'user',
        text: 'Usually closed or broken. The new wing already leaks, and the access road is still gravel.',
        questionId: 'n1',
      },
      {
        role: 'model',
        text: 'When something fails there, what happens first?',
        questionId: 'n2',
      },
      { role: 'user', text: 'We call the municipality', questionId: 'n2' },
      {
        role: 'model',
        text: 'You still call. What would make you report a fault again?',
        questionId: 'n3',
      },
      {
        role: 'user',
        text: 'If a crew came once. We stopped calling because nothing comes. If someone arrived, the record would fill itself.',
        questionId: 'n3',
      },
      {
        role: 'model',
        text: 'Should EPWP work prioritise maintenance of existing buildings over new construction?',
        questionId: 'n4',
      },
      {
        role: 'user',
        text: 'Yes. People want work that keeps the clinic open, not another sod-turning.',
        questionId: 'n4',
      },
      {
        role: 'model',
        text: 'Last: who should see this record — ward councillor, municipality, provincial Public Works, national DPWI?',
        questionId: 'n5',
      },
      {
        role: 'user',
        text: 'Ward councillor must see it. Municipality useful. Provincial Public Works must see it. National DPWI must see it — one file, not four.',
        questionId: 'n5',
      },
    ],
  },
  {
    name: 'Sibusiso Mkhize',
    place: 'eThekwini',
    picture: PORTRAIT.d,
    messages: [
      {
        role: 'model',
        text: 'Sibusiso — which public asset do you use most often in the ward?',
        questionId: 'n0',
      },
      { role: 'user', text: 'EPWP / community works site', questionId: 'n0' },
      {
        role: 'model',
        text: 'And how reliable is that site in a typical month?',
        questionId: 'n1',
      },
      {
        role: 'user',
        text: 'Usually open and usable — until the contract ends. Then the drains wait.',
        questionId: 'n1',
      },
      {
        role: 'model',
        text: 'When something fails, what happens first?',
        questionId: 'n2',
      },
      { role: 'user', text: 'We tell the councillor', questionId: 'n2' },
      {
        role: 'model',
        text: 'What would make you report a fault again?',
        questionId: 'n3',
      },
      {
        role: 'user',
        text: 'If EPWP jobs stayed with the building — paint, drains, locks — not only new sod-turnings.',
        questionId: 'n3',
      },
      {
        role: 'model',
        text: 'Should EPWP work prioritise maintenance of existing buildings over new construction?',
        questionId: 'n4',
      },
      { role: 'user', text: 'Yes', questionId: 'n4' },
      {
        role: 'model',
        text: 'Who should see this record?',
        questionId: 'n5',
      },
      {
        role: 'user',
        text: 'Ward councillor must see it. Municipality must see it. Provincial Public Works useful. National DPWI must see it.',
        questionId: 'n5',
      },
    ],
  },
];

const capeInterviews: SeededInterview[] = [
  {
    name: 'Nomalanga Jola',
    place: 'Amathole',
    picture: PORTRAIT.a,
    messages: [
      {
        role: 'model',
        text: 'Nomalanga — what change have you noticed most clearly in the last five years?',
        questionId: 'c0',
      },
      { role: 'user', text: 'Longer dry spells', questionId: 'c0' },
      {
        role: 'model',
        text: 'How prepared is your place for the next bad season?',
        questionId: 'c1',
      },
      {
        role: 'user',
        text: 'Not prepared on paper. We move the goats first. The house waits for the river to decide.',
        questionId: 'c1',
      },
      {
        role: 'model',
        text: 'Where does useful warning usually come from?',
        questionId: 'c2',
      },
      { role: 'user', text: 'Elders / neighbours', questionId: 'c2' },
      {
        role: 'model',
        text: 'Describe one adaptation that already works — even if it is informal.',
        questionId: 'c3',
      },
      {
        role: 'user',
        text: 'We still name the years by the rivers, not by the disaster declaration. Share the water point before the municipality arrives.',
        questionId: 'c3',
      },
      {
        role: 'model',
        text: 'Should community rain gauges and shoreline marks count as official observation?',
        questionId: 'c4',
      },
      { role: 'user', text: 'Yes. We already mark the high-water line. The GIS does not.', questionId: 'c4' },
      {
        role: 'model',
        text: 'What should regional policy protect first?',
        questionId: 'c5',
      },
      { role: 'user', text: 'Ancestral land', questionId: 'c5' },
    ],
  },
  {
    name: 'Lulama Ntshanga',
    place: 'Gqeberha',
    picture: PORTRAIT.b,
    messages: [
      {
        role: 'model',
        text: 'Lulama — what change have you noticed most clearly?',
        questionId: 'c0',
      },
      { role: 'user', text: 'Coastal erosion', questionId: 'c0' },
      {
        role: 'model',
        text: 'How prepared is the place for the next bad season?',
        questionId: 'c1',
      },
      {
        role: 'user',
        text: 'We have a working plan on the municipality’s slide. On the shoreline, the marks move faster than the plan.',
        questionId: 'c1',
      },
      {
        role: 'model',
        text: 'Where does useful warning usually come from?',
        questionId: 'c2',
      },
      { role: 'user', text: 'WhatsApp groups', questionId: 'c2' },
      {
        role: 'model',
        text: 'One adaptation that already works?',
        questionId: 'c3',
      },
      {
        role: 'user',
        text: 'If the plan cannot say the weather in isiXhosa, it cannot hear the response. Neighbours warn in the language the wind is named in.',
        questionId: 'c3',
      },
      {
        role: 'model',
        text: 'Should community gauges and shoreline marks count as official observation?',
        questionId: 'c4',
      },
      { role: 'user', text: 'Yes', questionId: 'c4' },
      {
        role: 'model',
        text: 'What should regional policy protect first?',
        questionId: 'c5',
      },
      { role: 'user', text: 'Coastal settlements', questionId: 'c5' },
    ],
  },
];

const kenyaInterviews: SeededInterview[] = [
  {
    name: 'Amina Otieno',
    place: 'Kisumu',
    picture: PORTRAIT.c,
    messages: [
      {
        role: 'model',
        text: 'Amina — where have you met AI recently, if at all?',
        questionId: 'k0',
      },
      { role: 'user', text: 'Clinic or hospital', questionId: 'k0' },
      {
        role: 'model',
        text: 'When it worked, how useful was it — from got in the way, through to genuinely helped?',
        questionId: 'k1',
      },
      {
        role: 'user',
        text: 'Genuinely helped on triage. The kiosk dies when Safaricom dips. The clerk does not.',
        questionId: 'k1',
      },
      {
        role: 'model',
        text: 'What broke trust fastest?',
        questionId: 'k2',
      },
      { role: 'user', text: 'Records leaving the room', questionId: 'k2' },
      {
        role: 'model',
        text: 'In your own words: should this kind of tool be used where you live? Why?',
        questionId: 'k3',
      },
      {
        role: 'user',
        text: 'Yes if the file stays in the room. Patients switch to Kiswahili mid-sentence. The model does not. The clerk still knows the family.',
        questionId: 'k3',
      },
      {
        role: 'model',
        text: 'Should an AI system keep records on a local machine rather than a remote cloud?',
        questionId: 'k4',
      },
      { role: 'user', text: 'Yes', questionId: 'k4' },
      {
        role: 'model',
        text: 'Whose view must be in the governance room?',
        questionId: 'k5',
      },
      {
        role: 'user',
        text: 'Clerks and nurses must be present. Patients must be present. Elders consulted. National regulators consulted. Vendors optional.',
        questionId: 'k5',
      },
    ],
  },
  {
    name: 'David Mwangi',
    place: 'Nairobi',
    picture: PORTRAIT.d,
    messages: [
      {
        role: 'model',
        text: 'David — where have you met AI recently?',
        questionId: 'k0',
      },
      { role: 'user', text: 'Phone / M-Pesa / apps', questionId: 'k0' },
      {
        role: 'model',
        text: 'When it worked, how useful was it?',
        questionId: 'k1',
      },
      {
        role: 'user',
        text: 'Got in the way more than it helped. Faster is not the same as welcome.',
        questionId: 'k1',
      },
      {
        role: 'model',
        text: 'What broke trust fastest?',
        questionId: 'k2',
      },
      { role: 'user', text: 'It replaced a person', questionId: 'k2' },
      {
        role: 'model',
        text: 'Should this kind of tool be used where you live? Why?',
        questionId: 'k3',
      },
      {
        role: 'user',
        text: 'Job-loss anxiety is real even when the tool is useful. Faster triage does not tell me who still has a post next year. My mother will never log in. She still uses the clinic.',
        questionId: 'k3',
      },
      {
        role: 'model',
        text: 'Should records stay on a local machine rather than a remote cloud?',
        questionId: 'k4',
      },
      { role: 'user', text: 'Yes', questionId: 'k4' },
      {
        role: 'model',
        text: 'Whose view must be in the governance room?',
        questionId: 'k5',
      },
      {
        role: 'user',
        text: 'Clerks and nurses must be present. Patients consulted. Elders must be present. National regulators must be present. Vendors optional.',
        questionId: 'k5',
      },
    ],
  },
];

const emalahleniLines: Line[] = [
  {
    text: 'The project should create work for local people and local businesses — not only a speech at the fence.',
    reasons: [
      'In eMalahleni the trucks came from elsewhere. The dust stayed here.',
      'A local welder who is not on the supplier list is not a local benefit.',
    ],
  },
  {
    text: 'A contractor from elsewhere can still be required to hire and buy here.',
    reasons: ['The main contract can travel. The labour and the cement should not have to.'],
  },
  {
    text: 'Temporary site jobs are not opportunity unless a skill or a next contract stays.',
    reasons: ['Three months on the fence is a stipend. It is not a trade.'],
  },
  {
    text: 'What makes temporary employment last is a certificate, a supplier who is kept on, and maintenance after handover.',
    reasons: ['If the work dies when the ribbon is cut, the growth was a headcount on a slide.'],
  },
  {
    text: 'Job numbers at the sod-turning are not the same as work that remains.',
    reasons: ['They counted us on the day. They did not count us in the year.'],
  },
  {
    text: 'The department and the ward should read one file on who was hired and who was paid.',
    reasons: ['If Pretoria sees a different list to the street, the next tender will look the same.'],
  },
];

const emalahleniBlocs: VoteValue[][] = [
  [A, A, A, A, A, A],
  [A, A, A, A, A, A],
  [A, A, A, D, A, A],
  [A, A, A, A, P, A],
  [D, D, A, D, D, D],
  [D, A, D, A, D, A],
  [A, A, A, A, A, A],
  [A, P, A, A, A, A],
];

const vhembeLines: Line[] = [
  {
    text: 'Awareness is not the same as a net that is still whole.',
    reasons: [
      'We can recite the radio message. The net has holes from last season.',
      'The poster is in the clinic. The sleeping room is not.',
    ],
  },
  {
    text: 'People sleep outside in the heat; the net stays in the house.',
    reasons: ['The fever does not wait for a cooler night.'],
  },
  {
    text: 'Fever is treated at the spaza first. The clinic is a second trip.',
    reasons: ['Musina is far when the child is already hot. The shop is on the path.'],
  },
  {
    text: 'Seasonal workers bring the fever and leave before the spray team.',
    reasons: ['The calendar of work is not the calendar of indoor residual spray.'],
  },
  {
    text: 'Community spray should wait for the people, not only the programme month.',
    reasons: ['An empty house sprayed is a statistic, not a round.'],
  },
  {
    text: 'Cross-border movement is how the district lives — not a compliance problem.',
    reasons: ['Families cross to Zimbabwe and back. The parasite does not queue at Beitbridge.'],
  },
];

const vhembeBlocs: VoteValue[][] = [
  [A, A, A, A, A, A],
  [A, A, A, A, A, A],
  [A, A, A, A, P, A],
  [A, D, A, A, A, A],
  [D, D, D, P, D, D],
  [D, A, D, A, D, P],
  [A, A, A, A, A, A],
  [A, A, A, A, D, A],
];

const lagosLines: Line[] = [
  {
    text: 'A number that requires a trip to Ikeja is not national.',
    reasons: [
      'The market does not close so someone can sit in a capture centre.',
      'Transport to the centre costs more than the ID is supposed to save.',
    ],
  },
  {
    text: 'SIM-NIN linkage locked people out of the phone they already had.',
    reasons: ['The line died in the week we needed it for work.'],
  },
  {
    text: 'Biometrics fail on worn hands and on the elderly.',
    reasons: ['The scanner wants a print the work has already taken.'],
  },
  {
    text: 'People trust a known agent more than a portal.',
    reasons: ['The agent in Agege has a face. The website has a queue that never moves.'],
  },
  {
    text: 'Digital ID can help if it stays a credential — not a gate in front of every service.',
    reasons: ['A number that unlocks a clinic is different from a number that locks the clinic.'],
  },
  {
    text: 'Governance must include people who will never complete enrolment.',
    reasons: ['My mother will not finish the capture. She still needs the hospital.'],
  },
];

const lagosBlocs: VoteValue[][] = [
  [A, A, A, A, A, A],
  [A, A, A, A, A, A],
  [A, A, A, A, P, A],
  [A, D, A, A, A, A],
  [D, D, D, P, D, D],
  [D, A, D, D, A, P],
  [A, A, A, A, A, A],
  [A, A, A, A, D, A],
];

const emalahleniSurvey: Survey = {
  id: 'chapter-emalahleni',
  title: 'Local Benefit Precinct — workers, businesses, and work that outlasts the fence',
  description:
    'Mpumalanga pilot: how an infrastructure project should create opportunities for local workers and businesses, and what makes temporary employment lead to lasting opportunity — for municipal authorities and the Department of Public Works and Infrastructure.',
  questions: [
    q('e0', 'On the last public infrastructure project near you, who actually got the work?', QuestionType.MultipleChoice, {
      options: [
        'Local workers on the site',
        'Local businesses supplying the site',
        'A contractor from elsewhere',
        'EPWP / short contracts only',
        'I don’t know',
      ],
    }),
    q('e1', 'How much lasting opportunity did that project leave behind?', QuestionType.Scale, {
      minLabel: 'Gone when the fence came down',
      maxLabel: 'Skills and work that stayed',
    }),
    q('e2', 'What makes temporary employment lead to lasting opportunity?', QuestionType.MultipleChoice, {
      options: [
        'A trade or certificate',
        'A local supplier kept on',
        'Maintenance jobs after handover',
        'A chance to bid next time',
        'Nothing lasts',
      ],
    }),
    q(
      'e3',
      'How should this infrastructure project create opportunities for local workers and businesses?',
      QuestionType.LongText,
    ),
    q(
      'e4',
      'Should local labour and local suppliers be a condition of the tender — not only a speech at the sod-turning?',
      QuestionType.YesNo,
    ),
    q('e5', 'Who should see this record?', QuestionType.Matrix, {
      rows: ['Ward councillor', 'Municipality', 'Provincial Public Works', 'National DPWI'],
      options: ['Must see it', 'Useful', 'Not needed'],
    }),
  ],
};

const vhembeSurvey: Survey = {
  id: 'chapter-vhembe',
  title: 'Malaria Precinct — nets, fever, and the season the spray misses',
  description:
    'Vhembe District initiative: malaria awareness against the habits people actually keep — nets, first treatment, indoor spray, and cross-border work.',
  questions: [
    q('m0', 'What do you actually use to keep mosquitoes off at night?', QuestionType.MultipleChoice, {
      options: ['A net that is still whole', 'A net with holes', 'Coils / spray', 'We sleep outside / no net', 'The house was sprayed', 'Other'],
    }),
    q('m1', 'How prepared is the household for the next malaria season?', QuestionType.Scale, {
      minLabel: 'Not prepared',
      maxLabel: 'We have a working plan',
    }),
    q('m2', 'When someone has fever, where do you go first?', QuestionType.MultipleChoice, {
      options: ['Clinic or hospital', 'Spaza / chemist', 'Traditional healer', 'We wait', 'We cross the border for care'],
    }),
    q('m3', 'Describe one prevention habit that already works here — even if it is informal.', QuestionType.LongText),
    q('m4', 'Should indoor spraying wait until people are home, not only until the programme month?', QuestionType.YesNo),
    q('m5', 'What should the district protect first this season?', QuestionType.MultipleChoice, {
      options: ['Nets that last', 'Spray that meets the household', 'Clinic hours', 'Information in Tshivenda', 'Care for seasonal workers'],
    }),
  ],
};

const lagosSurvey: Survey = {
  id: 'chapter-lagos',
  title: 'Digital ID Precinct — enrolment, exclusion, and the number as a gate',
  description:
    'Lagos record of how people meet national identity systems: capture centres, SIM-NIN linkage, biometrics, and who is still a person without a number.',
  questions: [
    q('l0', 'Where have you met a national ID or NIN process recently — if at all?', QuestionType.MultipleChoice, {
      options: ['Capture centre', 'Bank or SIM registration', 'Government service', 'Workplace', 'Agent / tout', 'I have not'],
    }),
    q('l1', 'When it worked, how useful was it?', QuestionType.Scale, {
      minLabel: 'Locked me out',
      maxLabel: 'Genuinely helped',
    }),
    q('l2', 'What broke trust fastest?', QuestionType.MultipleChoice, {
      options: ['Distance / cost of the centre', 'SIM cut off', 'Biometrics failed', 'It replaced a person', 'A tout in the queue', 'I still trust it'],
    }),
    q('l3', 'In your own words: should this kind of ID be required where you live? Why?', QuestionType.LongText),
    q('l4', 'Should a digital ID stay a credential you carry — not a gate in front of every service?', QuestionType.YesNo),
    q('l5', 'Whose view must be in the governance room?', QuestionType.Matrix, {
      rows: ['Market traders and informal workers', 'Elderly people', 'Capture-centre staff', 'National regulators', 'Telecoms / banks'],
      options: ['Must be present', 'Consulted', 'Optional'],
    }),
  ],
};

const emalahleniEssay: DataEssay = {
  headline: 'The count on the day is not the work in the year.',
  lede:
    'In this Mpumalanga record, people do not argue about whether infrastructure should create jobs. Job creation and infrastructure-led growth are already departmental priorities. They argue about whether the work is local, and whether it lasts after the fence comes down.',
  coexistence:
    'Pride in a new building and a closed supplier list sit in the same town. The same person who took three months on the site still wants a certificate, a next bid, and maintenance that stays. Temporary employment is not refused. It is refused as the whole story.',
  methods:
    'Synthetic pilot record for demonstration. Eight constructed voter patterns on six statements distilled from interview themes. Consensus means similar support across groups; contested means groups pull apart. Not official DPWI employment statistics.',
  bridgeEssay:
    'A wide bridge holds on three points. First, local workers and local businesses should get the work, not only the speech. Second, a main contractor from elsewhere can still be required to hire and buy here. Third, temporary employment leads to lasting opportunity when a trade, a supplier list, and post-handover maintenance remain — and when the ward and Pretoria read one file on who was hired and who was paid.',
  tensionEssay:
    'Tension gathers around whether a headcount at the sod-turning counts as growth. One group treats EPWP months as a start. Another treats them as a closed loop: counted on the day, gone in the year. A smaller split appears on whether local-content conditions belong in the tender or only in the speech. The instrument does not resolve that; it makes the disagreement visible before the next contract is copied from one site to the next.',
  closing:
    'For DPWI and municipal authorities, the useful number is not jobs announced. It is whether people still believe the next project will leave work and suppliers behind. eMalahleni · Local Benefit Precinct is built to watch that belief move — before and after deliberation, and before the next handover.',
  bridges: [
    'Local hire and local supply, not only a speech at the fence',
    'Temporary work that leaves a trade, a supplier, or maintenance',
    'One file on who was hired and who was paid',
  ],
  tensions: [
    'Is a sod-turning headcount growth, or a count that does not last?',
    'Must local labour sit in the tender, or only in the speech?',
  ],
};

const vhembeEssay: DataEssay = {
  headline: 'The poster is not the net.',
  lede:
    'In Vhembe, people are not waiting for a malaria lecture in order to act. They are sleeping outside in the heat, treating fever at the spaza, and crossing Beitbridge for work — while the programme month arrives to empty houses.',
  coexistence:
    'Knowledge of the radio message and a torn net live in the same room. Refusal to stay indoors is not denial of risk. It is a different theory of heat, work, and who the spray team will actually find.',
  methods:
    'Synthetic pilot record for demonstration. Constructed votes on six community statements. Prepared to show how The Precinct would carry household practice into a district brief. Not an official malaria inventory.',
  bridgeEssay:
    'Agreement is strong that awareness is not coverage: a whole net, a spray round that meets the household, a clinic that is not a second trip after the shop. Prevention is described as a practice (who sleeps where, who is home for spray) more often than as a poster. Policy that cannot hear Tshivenda, or the calendar of seasonal work, is a policy that arrives after the fever.',
  tensionEssay:
    'The hard split is the border. Cross-border movement reads to one group as how the district lives, and to another as a compliance gap. A second tension is first treatment: the spaza is closer than the clinic, and that fact is either a failure of the facility or a working habit. Deliberation here is not a quiz on mosquitoes. It is a structured argument about nets, spray timing, and whose season counts.',
  closing:
    'Vhembe · Malaria Precinct treats household practice as the first instrument, not the appendix. The civic bridge is to the district programme — if the essay can carry informal treatment and border livelihoods without translating them into non-compliance.',
  bridges: [
    'A whole net, not a recalled message',
    'Spray rounds that wait for people to be home',
    'Information and care in the language and calendar of the district',
  ],
  tensions: [
    'Border movement as livelihood versus as a programme leak',
    'Spaza-first fever care versus the clinic as the only legitimate door',
  ],
};

const lagosEssay: DataEssay = {
  headline: 'A number is not the same as being seen.',
  lede:
    'In this Lagos record, people judge digital ID first by the cost of the centre, the dead SIM, and whether biometrics still work on a working hand. Enrolment is local. A credential that helps in a bank is not the same tool as a gate in front of the hospital.',
  coexistence:
    'The same trader who wants a number that works at the stall also says her mother will never finish capture. Anxiety about being locked out sits beside a request for the ID to stay a card you carry, not a checkpoint. Subjective view is the data.',
  methods:
    'Synthetic pilot record for demonstration. Constructed deliberation on six statements about national identity systems in a dense, informal city. For equitable digital-governance briefings. Not a national opinion poll.',
  bridgeEssay:
    'A broad bridge: systems that assume a free day and a trip to Ikeja fail the places this record is about. Governance rooms that exclude people who will never complete enrolment are incomplete. Worn hands and the elderly are refused as edge cases. Where digital ID is accepted, it is accepted as a credential — next to an agent who is still there — not as a lock on every service.',
  tensionEssay:
    'Trust in a portal versus a known agent splits the room. One group will use a faster capture; another treats the tout and the queue as the institution. SIM-NIN cut-offs are not dissolved by the usefulness of a verified line. The contested question is not “digital ID: yes or no.” It is who remains a person without a number, and who owns the gate.',
  closing:
    'Lagos · Digital ID Precinct is an elicitation of lived enrolment — efficacy as lived, not as a dashboard of NINs issued. The civic bridge is to regulators and ministries who need those views before a linkage is copied from a bank pilot to every clinic door.',
  bridges: [
    'Enrolment that does not require a lost working day',
    'Keep the ID a credential, not a gate',
    'Governance must include people who will never complete capture',
  ],
  tensions: [
    'Agent versus portal as the face of the state',
    'A verified SIM does not cancel the harm of a cut line',
  ],
};

const emalahleniInterviews: SeededInterview[] = [
  {
    name: 'Nandi Mahlangu',
    place: 'eMalahleni',
    picture: PORTRAIT.c,
    messages: [
      {
        role: 'model',
        text: 'Nandi — thank you for sitting with this. On the last public infrastructure project near you, who actually got the work?',
        questionId: 'e0',
      },
      { role: 'user', text: 'EPWP / short contracts only', questionId: 'e0' },
      {
        role: 'model',
        text: 'How much lasting opportunity did that project leave behind — from gone when the fence came down, through to skills and work that stayed?',
        questionId: 'e1',
      },
      {
        role: 'user',
        text: 'Gone when the fence came down. Three months on the site. They counted us on the day. They did not count us in the year.',
        questionId: 'e1',
      },
      {
        role: 'model',
        text: 'What makes temporary employment lead to lasting opportunity?',
        questionId: 'e2',
      },
      { role: 'user', text: 'A trade or certificate', questionId: 'e2' },
      {
        role: 'model',
        text: 'How should this infrastructure project create opportunities for local workers and businesses?',
        questionId: 'e3',
      },
      {
        role: 'user',
        text: 'Hire here. Train here. Leave maintenance jobs after handover. Temporary work is not opportunity unless a skill or a next contract stays.',
        questionId: 'e3',
      },
      {
        role: 'model',
        text: 'Should local labour and local suppliers be a condition of the tender — not only a speech at the sod-turning?',
        questionId: 'e4',
      },
      {
        role: 'user',
        text: 'Yes. The speech at the fence is not the work. If it is a departmental priority, it belongs in the tender.',
        questionId: 'e4',
      },
      {
        role: 'model',
        text: 'Last: who should see this record — ward councillor, municipality, provincial Public Works, national DPWI?',
        questionId: 'e5',
      },
      {
        role: 'user',
        text: 'Ward councillor must see it. Municipality must see it. Provincial Public Works useful. National DPWI must see it — one file on who was hired and who was paid.',
        questionId: 'e5',
      },
    ],
  },
  {
    name: 'Sello Nkosi',
    place: 'Mbombela',
    picture: PORTRAIT.b,
    messages: [
      {
        role: 'model',
        text: 'Sello — on the last public infrastructure project near you, who actually got the work?',
        questionId: 'e0',
      },
      { role: 'user', text: 'A contractor from elsewhere', questionId: 'e0' },
      {
        role: 'model',
        text: 'How much lasting opportunity did that project leave behind?',
        questionId: 'e1',
      },
      {
        role: 'user',
        text: 'Usually none for us. A local welder who is not on the supplier list is not a local benefit. The trucks came from elsewhere. The dust stayed here.',
        questionId: 'e1',
      },
      {
        role: 'model',
        text: 'What makes temporary employment lead to lasting opportunity?',
        questionId: 'e2',
      },
      { role: 'user', text: 'A local supplier kept on', questionId: 'e2' },
      {
        role: 'model',
        text: 'How should this infrastructure project create opportunities for local workers and businesses?',
        questionId: 'e3',
      },
      {
        role: 'user',
        text: 'The main contract can travel. The labour and the cement should not have to. Require the contractor to hire and buy here — then keep those suppliers on after handover.',
        questionId: 'e3',
      },
      {
        role: 'model',
        text: 'Should local labour and local suppliers be a condition of the tender, not only a speech at the sod-turning?',
        questionId: 'e4',
      },
      { role: 'user', text: 'Yes', questionId: 'e4' },
      {
        role: 'model',
        text: 'Who should see this record?',
        questionId: 'e5',
      },
      {
        role: 'user',
        text: 'Ward councillor must see it. Municipality must see it. Provincial Public Works must see it. National DPWI useful.',
        questionId: 'e5',
      },
    ],
  },
];

const vhembeInterviews: SeededInterview[] = [
  {
    name: 'Naledi Mudau',
    place: 'Thohoyandou',
    picture: PORTRAIT.a,
    messages: [
      {
        role: 'model',
        text: 'Naledi — what do you actually use to keep mosquitoes off at night?',
        questionId: 'm0',
      },
      { role: 'user', text: 'A net with holes', questionId: 'm0' },
      {
        role: 'model',
        text: 'How prepared is the household for the next malaria season?',
        questionId: 'm1',
      },
      {
        role: 'user',
        text: 'Not prepared. We can recite the radio message. The net has holes from last season. The poster is in the clinic. The sleeping room is not.',
        questionId: 'm1',
      },
      {
        role: 'model',
        text: 'When someone has fever, where do you go first?',
        questionId: 'm2',
      },
      { role: 'user', text: 'Spaza / chemist', questionId: 'm2' },
      {
        role: 'model',
        text: 'Describe one prevention habit that already works here — even if it is informal.',
        questionId: 'm3',
      },
      {
        role: 'user',
        text: 'We close the room before dark when we can. In the heat people sleep outside. The fever does not wait for a cooler night.',
        questionId: 'm3',
      },
      {
        role: 'model',
        text: 'Should indoor spraying wait until people are home, not only until the programme month?',
        questionId: 'm4',
      },
      {
        role: 'user',
        text: 'Yes. An empty house sprayed is a statistic, not a round. Seasonal workers leave before the spray team.',
        questionId: 'm4',
      },
      {
        role: 'model',
        text: 'What should the district protect first this season?',
        questionId: 'm5',
      },
      { role: 'user', text: 'Nets that last', questionId: 'm5' },
    ],
  },
  {
    name: 'Khathu Netshivhulana',
    place: 'Musina',
    picture: PORTRAIT.d,
    messages: [
      {
        role: 'model',
        text: 'Khathu — what do you actually use against mosquitoes at night?',
        questionId: 'm0',
      },
      { role: 'user', text: 'We sleep outside / no net', questionId: 'm0' },
      {
        role: 'model',
        text: 'How prepared is the household for the next malaria season?',
        questionId: 'm1',
      },
      {
        role: 'user',
        text: 'We have a working plan on the clinic wall. On the path, fever is treated at the spaza first. Musina is far when the child is already hot.',
        questionId: 'm1',
      },
      {
        role: 'model',
        text: 'When someone has fever, where do you go first?',
        questionId: 'm2',
      },
      { role: 'user', text: 'Clinic or hospital', questionId: 'm2' },
      {
        role: 'model',
        text: 'One prevention habit that already works?',
        questionId: 'm3',
      },
      {
        role: 'user',
        text: 'Families cross to Zimbabwe and back. The parasite does not queue at Beitbridge. Information has to be in Tshivenda, and the spray has to meet the people who are actually home.',
        questionId: 'm3',
      },
      {
        role: 'model',
        text: 'Should indoor spraying wait until people are home?',
        questionId: 'm4',
      },
      { role: 'user', text: 'Yes', questionId: 'm4' },
      {
        role: 'model',
        text: 'What should the district protect first this season?',
        questionId: 'm5',
      },
      { role: 'user', text: 'Care for seasonal workers', questionId: 'm5' },
    ],
  },
];

const lagosInterviews: SeededInterview[] = [
  {
    name: 'Funke Adeyemi',
    place: 'Agege',
    picture: PORTRAIT.a,
    messages: [
      {
        role: 'model',
        text: 'Funke — where have you met a national ID or NIN process recently, if at all?',
        questionId: 'l0',
      },
      { role: 'user', text: 'Agent / tout', questionId: 'l0' },
      {
        role: 'model',
        text: 'When it worked, how useful was it — from locked me out, through to genuinely helped?',
        questionId: 'l1',
      },
      {
        role: 'user',
        text: 'Locked me out more than it helped. The market does not close so someone can sit in a capture centre. Transport to Ikeja costs more than the ID is supposed to save.',
        questionId: 'l1',
      },
      {
        role: 'model',
        text: 'What broke trust fastest?',
        questionId: 'l2',
      },
      { role: 'user', text: 'Distance / cost of the centre', questionId: 'l2' },
      {
        role: 'model',
        text: 'In your own words: should this kind of ID be required where you live? Why?',
        questionId: 'l3',
      },
      {
        role: 'user',
        text: 'Only if it stays a credential, not a gate. The agent in Agege has a face. The website has a queue that never moves. My mother will not finish the capture. She still needs the hospital.',
        questionId: 'l3',
      },
      {
        role: 'model',
        text: 'Should a digital ID stay a credential you carry — not a gate in front of every service?',
        questionId: 'l4',
      },
      { role: 'user', text: 'Yes', questionId: 'l4' },
      {
        role: 'model',
        text: 'Whose view must be in the governance room?',
        questionId: 'l5',
      },
      {
        role: 'user',
        text: 'Market traders must be present. Elderly people must be present. Capture-centre staff consulted. National regulators consulted. Telecoms optional.',
        questionId: 'l5',
      },
    ],
  },
  {
    name: 'Chinedu Okonkwo',
    place: 'Yaba',
    picture: PORTRAIT.c,
    messages: [
      {
        role: 'model',
        text: 'Chinedu — where have you met a national ID or NIN process recently?',
        questionId: 'l0',
      },
      { role: 'user', text: 'Bank or SIM registration', questionId: 'l0' },
      {
        role: 'model',
        text: 'When it worked, how useful was it?',
        questionId: 'l1',
      },
      {
        role: 'user',
        text: 'Genuinely helped at the bank. Then the SIM-NIN linkage locked the phone in the week we needed it for work. Faster is not the same as welcome.',
        questionId: 'l1',
      },
      {
        role: 'model',
        text: 'What broke trust fastest?',
        questionId: 'l2',
      },
      { role: 'user', text: 'SIM cut off', questionId: 'l2' },
      {
        role: 'model',
        text: 'Should this kind of ID be required where you live? Why?',
        questionId: 'l3',
      },
      {
        role: 'user',
        text: 'A number that unlocks a clinic is different from a number that locks the clinic. Biometrics fail on worn hands. The scanner wants a print the work has already taken.',
        questionId: 'l3',
      },
      {
        role: 'model',
        text: 'Should the ID stay a credential rather than a gate in front of every service?',
        questionId: 'l4',
      },
      { role: 'user', text: 'Yes', questionId: 'l4' },
      {
        role: 'model',
        text: 'Whose view must be in the governance room?',
        questionId: 'l5',
      },
      {
        role: 'user',
        text: 'Market traders consulted. Elderly people must be present. Capture-centre staff must be present. National regulators must be present. Telecoms / banks consulted.',
        questionId: 'l5',
      },
    ],
  },
];

const natalData = corpus('chapter-natal', natalLines, natalBlocs);
const capeData = corpus('chapter-cape', capeLines, capeBlocs);
const kenyaData = corpus('chapter-kenya', kenyaLines, kenyaBlocs);
const emalahleniData = corpus('chapter-emalahleni', emalahleniLines, emalahleniBlocs);
const vhembeData = corpus('chapter-vhembe', vhembeLines, vhembeBlocs);
const lagosData = corpus('chapter-lagos', lagosLines, lagosBlocs);

export const CHAPTERS: Chapter[] = [
  {
    id: 'natal',
    audience: 'government',
    fileNo: 'KZN-PW-2026-01',
    ...makePrecinctLabel('Natal', 'Public Works'),
    shortTitle: 'Public Works',
    theme: 'What fails, who is told, whether anyone arrives.',
    region: 'KwaZulu-Natal',
    country: 'South Africa',
    partner: 'Department of Public Works and Infrastructure',
    partnerUrl: 'http://publicworks.gov.za/',
    preparedFor: 'DPWI · publicworks.gov.za',
    summary:
      'A KZN pilot tracking public infrastructure feedback and local service delivery sentiment — to bridge citizens and municipal authorities.',
    prompt:
      'Create a KwaZulu-Natal interview for the Department of Public Works and Infrastructure: how people experience clinics, schools, government offices, and the roads that serve them — what fails, who is told, whether anyone arrives, and whether EPWP work should stay with maintenance rather than only new builds. Deliberative, for a civic bridge from the ward to Pretoria. Not a satisfaction score. This is a Precinct pilot, not an official government publication.',
    context: {
      domain: 'Political Polling',
      audience: 'Residents using public buildings',
      region: 'KwaZulu-Natal',
      tone: 'Empathetic & Warm',
    },
    functions: ['Survey', 'Elicit', 'Deliberate', 'Bridge'],
    survey: natalSurvey,
    interviews: natalInterviews,
    ...natalData,
    essay: natalEssay,
  },
  {
    id: 'emalahleni',
    audience: 'government',
    fileNo: 'MP-LB-2026-04',
    ...makePrecinctLabel('eMalahleni', 'Local Benefit'),
    shortTitle: 'Local Benefit',
    theme: 'How infrastructure creates work that lasts for local people and businesses.',
    region: 'Mpumalanga',
    country: 'South Africa',
    partner: 'Department of Public Works and Infrastructure',
    partnerUrl: 'http://publicworks.gov.za/',
    preparedFor: 'DPWI · publicworks.gov.za',
    summary:
      'A Mpumalanga pilot on local economic benefit from infrastructure — who is hired, who is paid, and what makes temporary employment lead to lasting opportunity.',
    prompt:
      'Create a Mpumalanga interview for the Department of Public Works and Infrastructure: how should this infrastructure project create opportunities for local workers and businesses? Job creation and infrastructure-led growth are explicit departmental priorities. Ask what makes temporary employment lead to lasting opportunity — a trade, a local supplier kept on, maintenance after handover — and whether local labour belongs in the tender, not only in the speech. Deliberative, for a civic bridge from the ward to Pretoria. Not a jobs-announced score. This is a Precinct pilot, not an official government publication.',
    context: {
      domain: 'Political Polling',
      audience: 'Local workers and businesses near public infrastructure sites',
      region: 'Mpumalanga',
      tone: 'Empathetic & Warm',
    },
    functions: ['Survey', 'Elicit', 'Deliberate', 'Bridge'],
    survey: emalahleniSurvey,
    interviews: emalahleniInterviews,
    ...emalahleniData,
    essay: emalahleniEssay,
  },
  {
    id: 'cape',
    audience: 'development',
    fileNo: 'EC-CR-2026-02',
    ...makePrecinctLabel('Cape', 'Climate'),
    shortTitle: 'Climate',
    theme: 'Community observation & adaptation',
    region: 'Eastern Cape',
    country: 'South Africa',
    partner: 'Regional climate & municipal partners',
    preparedFor: 'Regional policy · Eastern Cape',
    summary:
      'Community-led observations and adaptation strategies for climate impacts in the Eastern Cape — to foster local resilience and inform regional policy.',
    prompt:
      'Create a community climate-resilience interview for the Eastern Cape: drought, flood, coastal change, informal adaptation (livestock, water points), and whether vernacular weather knowledge should count as official observation. Deliberative, not a yes/no on climate change. Precinct for Development — a synthetic pilot, not an official climate inventory.',
    context: {
      domain: 'Scientific Research',
      audience: 'Eastern Cape communities',
      region: 'Eastern Cape',
      tone: 'Empathetic & Warm',
    },
    functions: ['Elicit', 'Survey', 'Deliberate', 'Bridge'],
    survey: capeSurvey,
    interviews: capeInterviews,
    ...capeData,
    essay: capeEssay,
  },
  {
    id: 'vhembe',
    audience: 'development',
    fileNo: 'LP-MH-2026-05',
    ...makePrecinctLabel('Vhembe', 'Malaria'),
    shortTitle: 'Malaria',
    theme: 'Awareness is not a net that is still whole.',
    region: 'Vhembe District, Limpopo',
    country: 'South Africa',
    partner: 'District malaria programme · Limpopo',
    preparedFor: 'District health · Vhembe',
    summary:
      'Household practice against malaria in Vhembe — nets, first treatment, spray rounds, and cross-border work — to inform the district programme.',
    prompt:
      'Create a community malaria interview for Vhembe District, Limpopo: what people actually use at night, where fever is treated first, whether indoor spraying should wait for people to be home, and how seasonal and cross-border work meets the programme calendar. Deliberative, not a quiz on mosquitoes. Precinct for Development — a synthetic pilot, not an official malaria inventory.',
    context: {
      domain: 'Medical / Clinical',
      audience: 'Vhembe households',
      region: 'Vhembe District, Limpopo',
      tone: 'Empathetic & Warm',
    },
    functions: ['Elicit', 'Survey', 'Deliberate', 'Bridge'],
    survey: vhembeSurvey,
    interviews: vhembeInterviews,
    ...vhembeData,
    essay: vhembeEssay,
  },
  {
    id: 'kenya',
    audience: 'technology',
    fileNo: 'KE-AI-2026-03',
    ...makePrecinctLabel('Kenya', 'Subjective Views'),
    shortTitle: 'Subjective Views',
    theme: 'Lived views on AI — efficacy as lived, not a vendor slide.',
    region: 'Kenya',
    country: 'Kenya',
    partner: 'Equitable tech governance',
    preparedFor: 'Governance · low-resource, culturally rich settings',
    summary:
      'Insights into public perceptions, workforce experience, and societal values on AI deployment — to inform equitable tech governance.',
    prompt:
      'Create an interview on subjective views of AI in a low-resource, multilingual setting: where people met the tool, what broke trust (language, connectivity, records leaving the room), job-loss fear, and who must sit in the governance room. Values and efficacy as lived — not a model benchmark. Precinct for Technology — a synthetic pilot, not a national opinion poll.',
    context: {
      domain: 'General Inquiry',
      audience: 'Workers and residents in low-resource settings',
      region: 'Kenya',
      tone: 'Empathetic & Warm',
    },
    functions: ['Elicit', 'Survey', 'Deliberate', 'Bridge'],
    survey: kenyaSurvey,
    interviews: kenyaInterviews,
    ...kenyaData,
    essay: kenyaEssay,
  },
  {
    id: 'lagos',
    audience: 'technology',
    fileNo: 'NG-ID-2026-06',
    ...makePrecinctLabel('Lagos', 'Digital ID'),
    shortTitle: 'Digital ID',
    theme: 'Enrolment, exclusion, and who is still a person without a number.',
    region: 'Lagos',
    country: 'Nigeria',
    partner: 'Digital identity governance',
    preparedFor: 'Governance · enrolment and exclusion',
    summary:
      'How people in Lagos meet national identity systems — capture centres, SIM-NIN linkage, biometrics — to inform equitable digital governance.',
    prompt:
      'Create an interview on digital ID in Lagos: where people met NIN or SIM-NIN processes, what broke trust (distance to the centre, cut lines, failed biometrics), whether the ID should stay a credential rather than a gate, and who must sit in the governance room — including people who will never complete enrolment. Values and efficacy as lived — not a dashboard of numbers issued. Precinct for Technology — a synthetic pilot, not a national opinion poll.',
    context: {
      domain: 'General Inquiry',
      audience: 'Residents and informal workers in Lagos',
      region: 'Lagos, Nigeria',
      tone: 'Empathetic & Warm',
    },
    functions: ['Elicit', 'Survey', 'Deliberate', 'Bridge'],
    survey: lagosSurvey,
    interviews: lagosInterviews,
    ...lagosData,
    essay: lagosEssay,
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<
  ChapterId,
  Chapter
>;

export const GOVERNMENT_CHAPTERS = CHAPTERS.filter((c) => c.audience === 'government');
export const DEVELOPMENT_CHAPTERS = CHAPTERS.filter((c) => c.audience === 'development');
export const TECHNOLOGY_CHAPTERS = CHAPTERS.filter((c) => c.audience === 'technology');

export const chaptersForKind = (kind: DemoKind) => CHAPTERS.filter((c) => c.audience === kind);

export const isChapterId = (value: string | null): value is ChapterId =>
  !!value && Object.prototype.hasOwnProperty.call(CHAPTER_BY_ID, value);

export const isDemoKind = (value: string | null): value is DemoKind =>
  value === 'government' || value === 'development' || value === 'technology';

/** `publicworks` / `climate` / `ai` remain as aliases. */
export const parseDemoParam = (value: string | null): DemoKind | null => {
  if (!value) return null;
  if (value === 'government' || value === 'publicworks') return 'government';
  if (value === 'development' || value === 'climate') return 'development';
  if (value === 'technology' || value === 'ai') return 'technology';
  return null;
};

/** Path aliases so `/government` can carry its own OG HTML at build. */
export const parsePathKind = (pathname: string): DemoKind | null => {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/government' || p === '/publicworks') return 'government';
  if (p === '/development' || p === '/climate') return 'development';
  if (p === '/technology' || p === '/ai') return 'technology';
  return null;
};

export const demoKindForChapter = (id: ChapterId): DemoKind => CHAPTER_BY_ID[id].audience;

export const belongsToKind = (id: ChapterId, kind: DemoKind) => demoKindForChapter(id) === kind;
