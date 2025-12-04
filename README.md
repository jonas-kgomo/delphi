# Delphi - Semantic AI Survey Builder & Interviewer

<div align="center"> 

<img width="892" height="1121" alt="Screenshot 2025-12-04 at 21 56 41" src="https://github.com/user-attachments/assets/902a76d4-3d95-4b0e-90c0-ceacc2a18f6d" />
<img width="1054" height="1273" alt="Screenshot 2025-12-04 at 21 57 02" src="https://github.com/user-attachments/assets/13dba786-a579-440b-8551-f146c88bb4e3" />
</div>

Delphi is a next-generation survey platform that uses Generative AI to bridge the gap between abstract research goals and structured data collection. Instead of manually dragging and dropping fields, you simply tell Delphi what you want to learn, and it builds a methodology-sound survey for you. It then conducts these surveys via a conversational, empathetic AI interface.

## Key Features

### 🧠 Semantic Survey Generation
Input a high-level research goal (e.g., "Assess malaria awareness in rural regions"), and Delphi uses the **Gemini 2.5 Flash** model to generate a structured survey. It intelligently selects question types:
- **Matrix**: Groups related questions with shared scales.
- **Linear Scale**: For quantitative ratings.
- **Multiple Choice**: For categorical data.
- **Open Text**: For qualitative insights.

### 💬 Conversational Interviewer
Delphi doesn't just display a form; it acts as an interviewer.
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

1.  **Define Goal**: Type your research question into the Builder.
2.  **Refine Context**: Set the Domain, Audience, and Region.
3.  **Generate**: Delphi drafts questions, which you can edit, delete, or add to.
4.  **Interview**: Preview the survey as a respondent. The AI conducts the interview, collecting structured data in a conversational flow.
