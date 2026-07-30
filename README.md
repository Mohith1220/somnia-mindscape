# Somnia Insight

MASTER PROMPT — BUILD A WORLD-CLASS AI SLEEP & NEUROLOGICAL HEALTH ANALYSIS FRONTEND

Build a complete, visually exceptional, premium, production-quality frontend for an AI-powered healthcare machine learning platform.

PROJECT TITLE:
Sleep Disorder Diagnosis Using Machine Learning

PRODUCT / UI NAME:
SOMNIA AI

TAGLINE:
Decode Your Sleep. Understand Your Health.

PRODUCT PURPOSE:
SOMNIA AI is an intelligent health screening platform that analyzes EEG-derived statistical features using machine learning to identify patterns associated with:

Normal

Insomnia

Sleep Apnea

Seizure Activity

The primary ML model is Random Forest, with SVM and Logistic Regression used for model comparison.

IMPORTANT PRODUCT POSITIONING:
This is an AI-assisted screening and analysis platform, NOT a replacement for professional medical diagnosis.

The frontend must feel like a premium, venture-backed AI healthcare SaaS product—not a student project, generic admin dashboard, Bootstrap template, or basic ML prediction form.

The entire experience must be polished enough for:

Client demonstrations

Final-year project presentation

Investor-style product demonstrations

Portfolio presentation

Live ML integration later

The demo must have ZERO visible unfinished sections.

If real backend functionality is unavailable, use realistic, deterministic mock data so every interaction works flawlessly.

Never display:

Lorem ipsum

"Coming soon"

Empty charts

Broken buttons

Placeholder images

Non-functional navigation

Random meaningless numbers

Developer/debug information

Every visible button must perform a meaningful action.

DESIGN PHILOSOPHY

Create a premium visual experience inspired by high-end health-tech, medical intelligence, and modern AI platforms.

The design should combine:

Apple-level visual restraint

Premium health-tech aesthetics

Modern AI product interfaces

Sophisticated data visualization

Clinical trust and credibility

Subtle futuristic elements

DO NOT create a generic dashboard.

Avoid:

Excessive gradients

Excessive glassmorphism

Cheap neon effects

Random glowing objects

Huge empty spaces

Cartoon medical illustrations

Generic stock photography

Over-animation

Overloaded dashboards

Template-looking layouts

The product should feel sophisticated, calm, intelligent, clinical, and trustworthy.

TECHNOLOGY

Use:

React

TypeScript

Tailwind CSS

shadcn/ui where appropriate

Framer Motion for premium micro-interactions

Recharts for analytics and model charts

Lucide icons

Create clean, reusable, component-based architecture.

The frontend must be fully responsive.

Optimize primarily for desktop/laptop product demonstrations while maintaining excellent tablet and mobile responsiveness.

DESIGN SYSTEM

DEFAULT THEME:
Premium dark health-tech interface.

BACKGROUND:
Deep near-black/navy.

SURFACES:
Layered dark navy/slate cards.

PRIMARY ACCENT:
Sophisticated cyan/teal.

SECONDARY ACCENT:
Use subtle blue when necessary.

TEXT:
Soft white for primary content.
Muted blue-gray for secondary content.

STATUS SYSTEM:
Normal / Low Risk = Green
Moderate = Amber
High = Orange
Critical = Red

Do not overuse status colors outside their semantic meaning.

TYPOGRAPHY:
Use Inter, Geist, or Manrope.

Headlines should be bold but elegant.

Body typography must prioritize readability.

Use generous but controlled spacing.

Cards should have:

Subtle borders

Soft shadows

Restrained glass effects

Premium hover states

Consistent border radius

GLOBAL NAVIGATION

Create a sticky premium navigation bar.

Left:
SOMNIA AI logo and wordmark.

Navigation:
Home
AI Analysis
Results
Analytics
Technology
About

Right:
Theme toggle
"Start Analysis" CTA

On mobile, create an elegant animated navigation drawer.

Active page/section must be clearly indicated.

PAGE 1 — CINEMATIC LANDING PAGE

Create a full-screen premium hero.

Main headline:

"Decode Your Sleep.
Understand Your Health."

Supporting text:

"AI-powered analysis of sleep and neurological patterns for intelligent early-stage health screening."

Primary CTA:
Start AI Analysis

Secondary CTA:
Explore Technology

Create a sophisticated animated EEG waveform in the hero background.

The waveform must remain subtle and must not reduce text readability.

Add a small status indicator:

"AI Analysis System Online"

Below the hero, create four elegant capability cards:

AI-Powered Analysis
Multi-Condition Screening
Explainable Predictions
Rapid Results

Add subtle scroll-based animations.

The landing page should immediately communicate:
AI + Healthcare + Sleep + Neurological Intelligence.

PAGE 2 — AI ANALYSIS STUDIO

Title:

AI Analysis Studio

Subtitle:

"Upload EEG data or enter extracted signal features to begin intelligent pattern analysis."

Create two analysis modes using premium tabs.

TAB 1:
EEG Data Upload

Create a large drag-and-drop upload area.

Display:

"Upload EEG Data"

"Drag and drop your EEG dataset or browse your device."

Include:
Upload icon
File name
File size
Upload progress
Success state
Remove file action

For the demo, allow a sample/demo dataset to be loaded using:

"Use Demo EEG Sample"

When selected, display:

demo_sleep_signal.csv
EEG Dataset
Ready for Analysis

Add:
Analyze EEG Data button

TAB 2:
Manual Feature Analysis

Create five professionally designed inputs:

EEG Mean
EEG Standard Deviation
EEG Variance
Minimum Amplitude
Maximum Amplitude

Include:
Input validation
Tooltips explaining each feature
Reset button
Load Demo Values button
Analyze Features button

Demo values must produce deterministic results.

PAGE 3 — CINEMATIC AI PROCESSING EXPERIENCE

When the user clicks Analyze, transition into a premium full-screen or large modal processing experience.

Do NOT use a generic loading spinner.

Display:

"Analyzing Neural Patterns"

Show an animated EEG waveform.

Create four processing stages:

01
Signal Processing

02
Feature Extraction

03
Pattern Recognition

04
AI Classification

Animate each stage sequentially.

Show realistic status messages:

"Reading EEG signal data..."

"Extracting statistical signal characteristics..."

"Evaluating neurological patterns..."

"Running Random Forest classifier..."

"Calculating prediction confidence..."

"Generating health insights..."

The sequence should last approximately 3–4 seconds in demo mode.

Finish with:

"ANALYSIS COMPLETE"

Then smoothly transition to the results dashboard.

PAGE 4 — HEALTH INTELLIGENCE RESULTS

Create a visually exceptional result dashboard.

Top section:

"AI Health Intelligence Report"

Show:
Unique Analysis ID
Current date/time
Analysis status: Complete

MAIN RESULT CARD:

Detected Condition:
SLEEP APNEA

Prediction Confidence:
91.4%

Risk Assessment:
MODERATE

Use an animated confidence ring.

Add a subtle statement:

"The analyzed signal contains patterns associated with Sleep Apnea."

Clearly show:

"AI-assisted screening result — not a medical diagnosis."

CLASS PROBABILITY VISUALIZATION

Create a premium probability distribution component.

Normal:
3.2%

Insomnia:
4.1%

Sleep Apnea:
91.4%

Seizure Activity:
1.3%

Use animated horizontal probability bars.

Highlight Sleep Apnea as the predicted class.

Probabilities must add to exactly 100%.

SLEEP INTELLIGENCE SECTION

Create a large radial visualization.

Sleep Intelligence Score:
68 / 100

Status:
MODERATE

IMPORTANT:
Clearly label this as a "Demo Wellness Indicator" if it is not backed by a validated clinical formula.

Below it create three demo indicators:

Signal Stability
82%

Pattern Consistency
74%

Risk Index
28%

These must be labeled as "Demo-derived indicators" so they are not presented as validated medical metrics.

EEG SIGNAL EXPLORER

Create a premium interactive EEG visualization.

Title:
Neural Signal Explorer

Tabs:
Raw Signal
Processed Signal
Feature Analysis

For the demo:
Generate a deterministic realistic-looking waveform visualization.

Do not use random data that changes every render.

Add:
Zoom controls
Time axis
Amplitude axis
Hover tooltip
Reset view

Below the graph display five feature cards:

Mean
Standard Deviation
Variance
Minimum Amplitude
Maximum Amplitude

Use realistic demo values.

Create a small visual comparison showing where each analyzed feature lies relative to a demo reference range.

Clearly label reference ranges as illustrative/demo data unless they come from validated clinical sources.

EXPLAINABLE AI SECTION

Create a premium section:

"Why did the AI make this prediction?"

Subtitle:

"Feature contribution analysis provides insight into the factors influencing the model's classification."

Create an animated horizontal feature-importance chart.

Demo values:

Signal Variance — 31%
Maximum Amplitude — 24%
Standard Deviation — 21%
Minimum Amplitude — 15%
Mean — 9%

Total must equal 100%.

Display:

Top Contributing Feature:
Signal Variance

Add an explanation card:

"Signal variance had the strongest influence on this classification based on the model's feature contribution analysis."

Clearly distinguish feature importance from medical causation.

AI HEALTH INSIGHTS

Create three premium insight cards.

CARD 1:
Pattern Insight

"The analyzed signal demonstrates characteristics associated with disrupted sleep stability."

CARD 2:
Risk Insight

"The model identified patterns associated with Sleep Apnea with high prediction confidence."

CARD 3:
Recommended Next Step

"Consider discussing this screening result with a qualified healthcare or sleep specialist for appropriate clinical evaluation."

Use professional icons.

Do not make definitive medical claims.

GENERAL RECOMMENDATIONS

Create a section:

"General Wellness Recommendations"

For Sleep Apnea demo result:

Maintain healthy sleep habits

Consider side sleeping when appropriate

Maintain a healthy lifestyle and weight

Avoid sleep deprivation

Consider professional sleep evaluation

Add:

"These recommendations provide general educational information and should not replace professional medical advice."

REPORT ACTIONS

Add functional buttons:

Download Report
Print Report
Run New Analysis

"Download Report" should generate or download a polished demo report if possible.

"Print Report" should trigger a print-friendly report view.

"Run New Analysis" should return to AI Analysis Studio and reset analysis state.

PAGE 5 — MODEL INTELLIGENCE LAB

Create a dedicated analytics page.

Title:

Model Intelligence Lab

Subtitle:

"Explore model performance, classification metrics, and evaluation results."

Top metric cards:

Best Performing Model:
Random Forest

Model Accuracy:
92.4%

Models Evaluated:
3

Detection Classes:
4

IMPORTANT:
Label 92.4% as "Reported Project Accuracy" if it is sourced from project documentation rather than live evaluation.

MODEL PERFORMANCE COMPARISON

Create a premium interactive comparison chart.

Models:

Random Forest
SVM
Logistic Regression

Metrics:

Accuracy
Precision
Recall
F1 Score

Use deterministic demo values.

Random Forest should visually appear as the best-performing model.

Add a selector to switch between metrics.

Do not use misleading chart scales.

CONFUSION MATRIX

Create an interactive 4x4 confusion matrix.

Classes:

Normal
Insomnia
Sleep Apnea
Seizure

Use realistic deterministic demo values.

Add hover tooltips.

Add a short explanation:

"The confusion matrix compares actual classifications with model predictions and helps identify where classification errors occur."

DETECTED CONDITION DISTRIBUTION

Create a donut chart or elegant bar visualization.

Categories:

Normal
Insomnia
Sleep Apnea
Seizure

Use deterministic demo dataset values.

Display:
Count
Percentage

Ensure percentages equal 100%.

PAGE 6 — TECHNOLOGY / HOW IT WORKS

Create an elegant visual ML pipeline.

Data Collection
↓
Data Preprocessing
↓
Feature Extraction
↓
Feature Scaling
↓
Machine Learning Classification
↓
Risk Assessment
↓
AI Insights

Animate the pipeline as the user scrolls.

Create individual technology cards for:

Random Forest
SVM
Logistic Regression

Mark:

Random Forest
"Primary Classification Model"

Explain each model in simple professional language.

Add a "Feature Engineering" section explaining the five EEG-derived statistical features:

Mean
Standard Deviation
Variance
Minimum
Maximum

PAGE 7 — CONDITIONS

Create a section:

"Conditions Screened by SOMNIA AI"

Create four interactive cards.

Normal Sleep

"Patterns that do not indicate the screened abnormalities."

Insomnia

"Patterns potentially associated with disrupted or insufficient sleep."

Sleep Apnea

"Patterns potentially associated with sleep-related breathing disturbances."

Seizure Activity

"Patterns potentially associated with abnormal neurological signal activity."

Clicking a card should open a premium side panel or modal with:

Overview
Common indicators
Why early screening matters

Use educational wording only.

Do not present the application as a definitive diagnostic tool.

PAGE 8 — ANALYSIS HISTORY

Create a premium history dashboard using deterministic demo records.

Columns:

Analysis ID
Date
Detected Condition
Confidence
Risk
Action

Example records:

SA-2026-0718-001
Sleep Apnea
91.4%
Moderate

SA-2026-0712-002
Normal
94.2%
Low

SA-2026-0704-003
Insomnia
87.6%
Medium

SA-2026-0628-004
Normal
96.1%
Low

Clicking "View" must open the corresponding analysis detail.

Add:
Search
Condition filter
Risk filter
Date sorting

PAGE 9 — ABOUT

Create a premium About page.

Explain:

SOMNIA AI explores how machine learning can support early screening of sleep and neurological patterns using EEG-derived statistical features.

Include:

Mission

Technology

Machine Learning Approach

Responsible AI

Medical Disclaimer

Add a prominent disclaimer:

"SOMNIA AI is designed for educational, research, and AI-assisted screening purposes. Results generated by this system should not be interpreted as a confirmed medical diagnosis. Always consult a qualified healthcare professional for medical evaluation and treatment."

DEMO MODE

Create a sophisticated Demo Mode.

Allow users to select:

Normal Sample
Insomnia Sample
Sleep Apnea Sample
Seizure Sample

Each demo must have deterministic:

Input features
EEG waveform
Prediction
Confidence
Class probabilities
Risk level
Insights
Recommendations

Create consistent demo scenarios.

Example:

NORMAL
Prediction: Normal
Confidence: 96.1%
Risk: Low

INSOMNIA
Prediction: Insomnia
Confidence: 88.7%
Risk: Medium

SLEEP APNEA
Prediction: Sleep Apnea
Confidence: 91.4%
Risk: Moderate

SEIZURE
Prediction: Seizure
Confidence: 94.8%
Risk: Critical

Do not randomly change these values.

Demo Mode must be easy to reset.

INTERACTION & MOTION

Use Framer Motion thoughtfully.

Add:

Smooth page transitions
Animated metric counters
Animated confidence rings
Progress animations
Chart entrance animations
Subtle card hover effects
Button micro-interactions
Smooth tab transitions
EEG waveform animation
Processing sequence animations

Animations must feel premium and intentional.

Never sacrifice usability for animation.

Respect prefers-reduced-motion.

RESPONSIVE DESIGN

The entire application must work perfectly on:

Large desktop
Laptop
Tablet
Mobile

On mobile:

Stack analytics cards
Make charts horizontally scrollable only when necessary
Use touch-friendly controls
Use a premium navigation drawer
Maintain readable typography
Avoid overflowing charts

ACCESSIBILITY

Ensure:

Strong text contrast
Keyboard navigation
Visible focus states
ARIA labels where needed
Semantic HTML
Accessible form labels
Status is never communicated by color alone

DEMO DATA ARCHITECTURE

Create a centralized demo data configuration.

Do not scatter hardcoded values across components.

Create structured objects for:

Demo patient/sample scenarios
Model metrics
Feature values
Feature importance
Class probabilities
History records
Recommendations
Risk levels

This architecture must make it easy to replace demo data with real backend API responses later.

Create a clean service abstraction such as:

analysisService

Demo implementation:
demoAnalysisService

Future implementation:
apiAnalysisService

UI components should consume the same response interface regardless of whether data comes from demo mode or a real API.

FINAL QUALITY REQUIREMENTS

Before considering the application complete:

Verify every navigation item works.

Verify every CTA works.

Verify Demo Mode works for all four conditions.

Verify analysis processing animation works.

Verify results change correctly based on selected demo.

Verify all probabilities total 100%.

Verify charts render correctly.

Verify mobile responsiveness.

Verify dark/light theme if implemented.

Verify no placeholder text exists.

Verify no broken buttons exist.

Verify no console errors.

Verify no horizontal page overflow.

Verify loading, empty, success, and error states.

Verify medical disclaimer is visible where appropriate.

Verify demo metrics are clearly distinguished from validated clinical metrics.

Verify all animations remain smooth and professional.

The final product must look and behave like a polished premium AI healthcare SaaS platform.

The user should never feel they are looking at a student ML project.

The first impression should be:

"This looks like a real AI healthcare product."

Prioritize exceptional visual hierarchy, flawless interaction design, premium typography, meaningful data visualization, and a coherent end-to-end user journey.

Build the complete frontend experience now.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://somnia-mindscape.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2c22411e-192d-4418-bfe3-d3014b3654ce).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
