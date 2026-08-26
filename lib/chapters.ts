import {
  DataEssay,
  QuestionType,
  Survey,
  Utterance,
  Vote,
  VoteValue,
} from '../types';
import { PRECINCT_FUNCTIONS } from './brand';

export type ChapterId = 'natal' | 'cape' | 'kenya';
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
    lead: 'Departmental records. The civic bridge is to the state.',
    summary:
      'Infrastructure, service delivery, and the file that ward and Pretoria should read together.',
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

export type Chapter = {
  id: ChapterId;
  audience: ChapterAudience;
  fileNo: string;
  title: string;
  shortTitle: string;
  theme: string;
  region: string;
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
  title: 'Natal Precinct Records — infrastructure & service delivery',
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
  title: 'Cape Precinct Records — climate observations & adaptation',
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
  title: 'Kenya Records — views on AI in low-resource, culturally rich settings',
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
    'For DPWI and municipal authorities, the useful number is not a satisfaction score. It is whether people still believe a report will produce a visit. Natal Precinct Records is built to watch that belief move — before and after deliberation, and before the next handover.',
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
    'Cape Precinct Records treats community observation as the first instrument, not the appendix. The civic bridge is to regional policy — if the essay can carry vernacular and informal gauges without translating them out of existence.',
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
    'Kenya Records is an elicitation and a survey of subjective view — efficacy as lived, not as a vendor slide. The civic bridge is to regulators and ministries who need those views before a deployment is copied from a high-connectivity pilot.',
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

const natalData = corpus('chapter-natal', natalLines, natalBlocs);
const capeData = corpus('chapter-cape', capeLines, capeBlocs);
const kenyaData = corpus('chapter-kenya', kenyaLines, kenyaBlocs);

export const CHAPTERS: Chapter[] = [
  {
    id: 'natal',
    audience: 'government',
    fileNo: 'KZN-PW-2026-01',
    title: 'Natal Precinct Records',
    shortTitle: 'Public Works',
    theme: 'Infrastructure feedback & service delivery sentiment',
    region: 'KwaZulu-Natal',
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
    id: 'cape',
    audience: 'development',
    fileNo: 'EC-CR-2026-02',
    title: 'Cape Precinct Records',
    shortTitle: 'Climate Resilience',
    theme: 'Community observation & adaptation',
    region: 'Eastern Cape',
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
    id: 'kenya',
    audience: 'technology',
    fileNo: 'KE-AI-2026-03',
    title: 'Kenya Records',
    shortTitle: 'AI and Views',
    theme: 'Subjective views on AI — efficacy and impact',
    region: 'Kenya',
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
];

export const CHAPTER_BY_ID: Record<ChapterId, Chapter> = {
  natal: CHAPTERS[0],
  cape: CHAPTERS[1],
  kenya: CHAPTERS[2],
};

export const GOVERNMENT_CHAPTERS = CHAPTERS.filter((c) => c.audience === 'government');
export const DEVELOPMENT_CHAPTERS = CHAPTERS.filter((c) => c.audience === 'development');
export const TECHNOLOGY_CHAPTERS = CHAPTERS.filter((c) => c.audience === 'technology');

export const chaptersForKind = (kind: DemoKind) => CHAPTERS.filter((c) => c.audience === kind);

export const isChapterId = (value: string | null): value is ChapterId =>
  value === 'natal' || value === 'cape' || value === 'kenya';

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

export const demoKindForChapter = (id: ChapterId): DemoKind => CHAPTER_BY_ID[id].audience;

export const belongsToKind = (id: ChapterId, kind: DemoKind) => demoKindForChapter(id) === kind;
