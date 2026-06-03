# AURA AI - Futuristic AI-Powered Educational Assistant

AURA AI is an AI-powered educational assistant that transforms lecture recordings and transcripts into organized study materials. The project combines FastAPI, OpenAI, Azure Speech Services, and a futuristic web interface to help students summarize lectures, generate quizzes, translate content, and ask questions based on lecture material.

## 🚀 Features

### Core AI Capabilities
- **Lecture Summarization**: Generates structured summaries from lecture text
- **Key Concepts Extraction**: Extracts important concepts from educational content
- **Interactive Quiz Generation**: Creates multiple-choice questions from lecture material
- **AI Chat Assistant**: Answers questions based only on the provided lecture content
- **Multi-language Translation**: Translates generated content into another language

### Voice & Speech Features
- **Audio Upload**: Supports lecture recordings and audio/video files
- **Speech-to-Text**: Uses Azure Speech Services for transcription
- **Audio Conversion**: Uses pydub and ffmpeg to convert supported audio formats before transcription

### Modern UI/UX
- **Dark Futuristic Theme**
- **Glassmorphism UI**
- **Responsive Design**
- **Smooth Animations**
- **Simple Student-Friendly Workflow**

## 🛠️ Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **Uvicorn**: ASGI server for running FastAPI
- **OpenAI GPT-4o-mini**: Used for summaries, quizzes, translation, and chat
- **Azure Cognitive Services Speech**: Used for audio transcription
- **pydub**: Used for audio processing and conversion
- **python-dotenv**: Loads environment variables securely
- **Jinja2**: Renders the HTML template

### Frontend
- **HTML5**
- **CSS3**
- **Vanilla JavaScript**
- **Font Awesome**
- **Responsive UI Design**

## 📋 Prerequisites

Before running the project, make sure you have:

- Python 3.8+
- OpenAI API key
- Azure Speech Services key and region
- ffmpeg installed on your system
- A modern browser such as Chrome or Edge

### Installing ffmpeg

| Operating System | Installation Command |
|---|---|
| Windows | `winget install ffmpeg` or `choco install ffmpeg` |
| macOS | `brew install ffmpeg` |
| Ubuntu/Debian | `sudo apt install ffmpeg` |

> If you only use WAV files, ffmpeg may not be required, but installing it is recommended for full audio format support.

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/salmaalahmad320-blip/AURA-AI.git
cd AURA-AI
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

```bash
# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the root directory based on `.env.example`.

```env
OPENAI_API_KEY=your_openai_api_key_here
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region_here
```

> Never commit your real `.env` file to GitHub.

### 5. Run the application

```bash
python main.py
```

Or:

```bash
uvicorn main:app --reload
```

### 6. Open the app in your browser

```text
http://127.0.0.1:8000
```

## 📁 Project Structure

```text
AURA-AI/
├── main.py                 # FastAPI backend application
├── prompts.py              # GPT system prompts
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variables template
├── .gitignore
├── templates/
│   └── index.html          # Main frontend template
└── static/
    ├── style.css           # Futuristic UI styling
    └── app.js              # Frontend JavaScript logic
```

## 🎯 Usage

### Upload a lecture recording
1. Open the app in the browser
2. Choose the upload recording tab
3. Upload an audio or video lecture file
4. Select the recording language
5. Convert it into study material

### Paste lecture text
1. Choose the paste text tab
2. Paste lecture content
3. Generate study material directly

### Use generated study tools
- Read the AI-generated summary
- Review key concepts
- Solve the generated quiz
- Regenerate new questions
- Ask the chatbot questions based only on the lecture content
- Translate the summary when needed

## 🔧 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Main application page |
| `/transcribe` | POST | Converts uploaded audio/video into text using Azure Speech |
| `/summary` | POST | Generates summary, key points, and concepts |
| `/quiz` | POST | Generates multiple-choice quiz questions |
| `/chat` | POST | Answers questions based on lecture content only |
| `/translate` | POST | Translates text into a target language |

## 🔒 Security Notes

- Do not upload `.env` to GitHub
- Keep OpenAI and Azure API keys private
- Use `.env.example` to show required variables without exposing secrets
- All AI requests should go through the backend
- Validate and sanitize user inputs before production deployment

## 🚧 Future Enhancements

- Add user authentication
- Save lecture history
- Add student progress tracking
- Improve multilingual support
- Add PDF export for generated study material
- Deploy the project online
- Add analytics dashboard
- Improve quiz difficulty control

## 📝 Requirements

```text
fastapi==0.104.1
uvicorn[standard]==0.24.0
jinja2==3.1.2
python-multipart==0.0.6
openai==1.3.5
python-dotenv==1.0.0
azure-cognitiveservices-speech==1.32.1
pydub==0.25.1
```

## 👩‍💻 Author

Developed by **Salma Alahmad**

AI and Data Science Student  
Graduation Project 2025–2026

## 📌 Project Purpose

AURA AI was developed as an educational AI project to support students by converting lecture content into useful study resources. It reduces the time spent rewriting notes and helps students review faster through summaries, concepts, quizzes, translation, and lecture-based chat.

---

**Built with ❤️ using FastAPI, OpenAI, Azure Speech Services, and modern web technologies**
