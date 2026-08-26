# The Precinct — precinct.city

Four civic tools in one place: deliberative polling, community survey, active elicitation, and a civic bridge.

## Precinct for Government

Departmental demonstration for South African partners. Lead file for DPWI ([publicworks.gov.za](http://publicworks.gov.za/)). Synthetic pilots — not official statistics.

| File | Record | Open |
|------|--------|------|
| KZN-PW-2026-01 | Natal Precinct Records — Public Works, KwaZulu-Natal | `?chapter=natal` |

Index: `?demo=government` (`?demo=publicworks` still works)

The file: **Brief** (the prompt) → **Instrument** (composed questions + model interviews) → **Deliberate** → **Record** (filled consensus page). Climate and AI are not part of this briefing.

### Experimental examples

Same idea as the tech-conference template in the builder — not the Public Works demo.

| File | Record | Open |
|------|--------|------|
| EC-CR-2026-02 | Cape Precinct Records — Climate Resilience, Eastern Cape | `?demo=climate` or `?chapter=cape` |
| KE-AI-2026-03 | Kenya Records — AI and Views | `?demo=ai` or `?chapter=kenya` |

## Running the app 







## Key Features



### 🧠 Semantic Survey Generation

Input a high-level research goal (e.g., "Assess malaria awareness in rural regions"), and The Precinct uses the **Gemini 2.5 Flash** model to generate a structured survey. It intelligently selects question types:

- **Matrix**: Groups related questions with shared scales.
- **Linear Scale**: For quantitative ratings.
- **Multiple Choice**: For categorical data.
- **Open Text**: For qualitative insights.



### 💬 Conversational Interviewer

The Precinct doesn't just display a form; it acts as an interviewer.

- **Natural Conversation**: The AI introduces questions conversationally.
- **Rich UI Injection**: While the chat feels natural, the answers are collected via structured UI elements (Buttons, Sliders, Grids) injected directly into the chat stream, ensuring data quality.
- **Context Awareness**: The AI acknowledges previous answers before moving to the next topic.



### 🎛️ Intricate Context Control

Tailor the survey generation with specific parameters:

- **Domain**: Scientific, Medical, Political, Market Research, etc.
- **Target Audience**: Specify who is taking the survey (e.g., "US Adults", "Medical Professionals").
- **Region**: Localize the context (e.g., "California", "Global").
- **Tone**: Adjust the interviewer's personality (Formal, Empathetic, Casual).





## Tech Stack

- **Frontend**: React 19, Tailwind CSS (Minimalist 'Stone' Theme)
- **AI Integration**: Google GenAI SDK (Gemini 2.5 Flash)
- **Icons**: Lucide React
- **Typography**: Merriweather (Serif) & Inter (Sans)



## How It Works

1. **Define Goal**: Type your research question into the Builder.
2. **Refine Context**: Set the Domain, Audience, and Region.
3. **Generate**: The Precinct drafts questions, which you can edit, delete, or add to.
4. **Interview**: Preview the survey as a respondent. The AI conducts the interview, collecting structured data in a conversational flow.

