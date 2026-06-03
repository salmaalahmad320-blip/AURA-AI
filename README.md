# AURA AI - Futuristic AI-Powered Educational Assistant

A comprehensive web application that combines cutting-edge AI technologies with an immersive futuristic UI to create the ultimate educational companion.

## 🚀 Features

### Core AI Capabilities
- **Intelligent Chat**: Powered by OpenAI GPT-4o-mini for natural conversations
- **Lecture Summarization**: AI-powered content summarization for educational materials
- **Multi-language Translation**: Real-time translation between multiple languages
- **Interactive Quiz Generation**: Automatically create quizzes from any content

### Voice & Speech Features
- **Speech-to-Text**: Voice input using Web Speech API
- **Text-to-Speech**: AI-powered voice responses
- **Azure Speech Integration**: Ready for advanced speech processing (placeholders included)

### Modern UI/UX
- **Dark Futuristic Theme**: Neon blue glowing effects with glassmorphism
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: CSS animations and transitions
- **Intuitive Navigation**: Clean sidebar navigation with section-based layout

## 🛠️ Technology Stack

### Backend
- **FastAPI**: High-performance async web framework
- **OpenAI API**: GPT-4o-mini for AI interactions
- **Azure AI Services**: Ready for Speech and Translation services
- **Python-dotenv**: Environment variable management

### Frontend
- **HTML5**: Semantic markup with modern structure
- **CSS3**: Custom properties, animations, and responsive design
- **Vanilla JavaScript**: No frameworks, pure JavaScript with modern ES6+
- **Web Speech API**: Browser-native speech recognition and synthesis

## 📋 Prerequisites

- Python 3.8+
- OpenAI API key
- Azure Speech Services key + region (required for audio transcription)
- **ffmpeg** — مطلوب لتحويل صيغ الصوت (MP3, MP4, OGG…) قبل إرسالها لـ Azure

  | نظام التشغيل | أمر التثبيت |
  |---|---|
  | Windows | `winget install ffmpeg` أو `choco install ffmpeg` |
  | macOS | `brew install ffmpeg` |
  | Ubuntu/Debian | `sudo apt install ffmpeg` |

  > إذا كنت ستستخدم ملفات WAV فقط، يمكنك تخطّي ffmpeg.

- Modern web browser (Chrome أو Edge موصى بهما)

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AURA-AI
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   - Copy `.env` file and update with your API keys:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   AZURE_SPEECH_KEY=your_azure_speech_key_here
   AZURE_SPEECH_REGION=your_azure_region_here
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

6. **Open in browser**
   - Navigate to `http://127.0.0.1:8000`

## 📁 Project Structure

```
AURA-AI/
├── main.py                 # FastAPI backend application
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables (configure with your keys)
├── templates/
│   └── index.html         # Main HTML template
├── static/
│   ├── style.css          # Futuristic CSS styling
│   └── app.js            # Frontend JavaScript logic
└── README.md             # This file
```

## 🎯 Usage

### Basic Interaction
1. **Voice Input**: Click the microphone button to speak your questions
2. **Text Input**: Type your questions in the input field
3. **AI Chat**: Get intelligent responses from the AI assistant
4. **Navigation**: Use the sidebar to access different features

### Features Overview

#### AI Chat
- Natural language conversations
- Educational content assistance
- Context-aware responses

#### Lecture Summary
- Paste lecture content
- Get concise AI-generated summaries
- Perfect for study aids

#### Translation
- Support for multiple languages
- Real-time translation
- Easy language swapping

#### Quiz Generation
- Generate questions from any content
- Multiple choice format
- Instant scoring and feedback

## 🔧 API Endpoints

- `GET /` - Main application interface
- `POST /chat` - AI chat with GPT-4o-mini
- `POST /summary` - Generate content summaries
- `POST /translate` - Multi-language translation
- `POST /quiz` - Generate interactive quizzes
- `POST /speech-to-text` - Speech recognition (placeholder)
- `POST /text-to-speech` - Text-to-speech (placeholder)

## 🎨 Customization

### Styling
- Modify `static/style.css` for theme changes
- CSS custom properties for easy color customization
- Responsive breakpoints in media queries

### AI Behavior
- Adjust temperature and token limits in `main.py`
- Modify system prompts for different AI personalities
- Add new endpoints for additional features

## 🔒 Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Consider implementing rate limiting for production use
- Validate and sanitize all user inputs

## 🚧 Future Enhancements

- [ ] Azure Speech Services integration
- [ ] User authentication and session management
- [ ] Progress tracking and analytics
- [ ] Mobile app development
- [ ] Additional AI models integration
- [ ] Custom voice training
- [ ] Multi-user collaboration features

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support and questions, please open an issue on the GitHub repository.

---

**Built with ❤️ using FastAPI, OpenAI, and modern web technologies**