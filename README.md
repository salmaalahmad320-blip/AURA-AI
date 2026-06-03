# AURA AI — محوّل المحاضرات إلى مواد دراسية

**AURA** (Automated Understanding & Review Assistant) is a graduation project that transforms lecture recordings and transcripts into comprehensive study materials using AI.

---

## المشكلة والحل

### المشكلة
طلاب الجامعة يقضون ساعات طويلة في إعادة استماع المحاضرات أو كتابة ملاحظات يدوية، مما يقلل وقت المراجعة والفهم.

### الحل
AURA يحوّل المحاضرة (ملف صوتي أو نص) تلقائياً إلى:
- ملخص منظّم
- مفاهيم أساسية
- اختبار تفاعلي
- مساعد ذكي مقيّد بمحتوى المحاضرة فقط

---

## المميزات

| الميزة | الوصف |
|--------|--------|
| **التفريغ الصوتي** | رفع ملف صوتي/فيديو → تحويل تلقائي إلى WAV PCM → تفريغ عبر Azure Speech |
| **الملخص** | ملخص + نقاط رئيسية + مفاهيم مهمة بالإنجليزية مع زر ترجمة للعربية |
| **المفاهيم الأساسية** | قائمة منظّمة بأبرز المفاهيم المستخرجة من المحاضرة |
| **الاختبار التفاعلي** | 5 أسئلة اختيار من متعدد مع تصحيح فوري وعرض النتيجة |
| **توليد أسئلة جديدة** | زر "أسئلة جديدة" يعيد توليد الاختبار بأسئلة مختلفة في كل مرة |
| **الترجمة** | ترجمة الملخص من الإنجليزية إلى العربية بنقرة واحدة |
| **الشات المقيّد** | مساعد ذكي يجيب على أسئلتك من محتوى المحاضرة فقط، لا يستخدم معرفة خارجية |

---

## المكدس التقني

### Backend
| المكتبة | الاستخدام |
|---------|-----------|
| **FastAPI** | إطار عمل Python async عالي الأداء |
| **Uvicorn** | خادم ASGI لتشغيل FastAPI |
| **OpenAI GPT-4o-mini** | توليد الملخص، الاختبار، الترجمة، الشات |
| **Azure Cognitive Services Speech** | تفريغ الملفات الصوتية إلى نص |
| **pydub** | تحويل الصوت إلى WAV PCM قبل إرساله لـ Azure |
| **ffmpeg** | محرك التحويل الصوتي (مطلوب على النظام) |
| **python-dotenv** | قراءة مفاتيح API من ملف `.env` |
| **Jinja2** | تقديم قالب HTML |

### Frontend
| التقنية | الاستخدام |
|---------|-----------|
| **HTML5 / CSS3** | هيكل الصفحة وتصميم glassmorphism داكن |
| **Vanilla JavaScript (ES6)** | منطق التطبيق بالكامل بدون أي إطار عمل |
| **Font Awesome** | أيقونات الواجهة |

---

## بنية المشروع

```
AURA-AI/
├── main.py                 # FastAPI backend — كل endpoints
├── prompts.py              # system prompts لـ GPT
├── requirements.txt        # مكتبات Python
├── .env                    # مفاتيح API (لا تُرفق في git)
├── .env.example            # قالب لمتغيرات البيئة
├── .gitignore
├── templates/
│   └── index.html          # الواجهة الرئيسية
└── static/
    ├── style.css           # تصميم داكن مستقبلي
    └── app.js              # منطق الواجهة
```

---

## API Endpoints

| الـ Endpoint | الطريقة | الوصف |
|-------------|---------|-------|
| `/` | GET | الصفحة الرئيسية |
| `/transcribe` | POST | رفع ملف صوتي → تفريغ عبر Azure Speech |
| `/summary` | POST | توليد ملخص + نقاط + مفاهيم |
| `/quiz` | POST | توليد 5 أسئلة اختيار من متعدد |
| `/chat` | POST | الإجابة على سؤال مقيّداً بالمحاضرة |
| `/translate` | POST | ترجمة نص إلى لغة محددة |

### تفاصيل الـ Endpoints

**`POST /transcribe`**
```
Content-Type: multipart/form-data
file: <audio/video file>
?language=ar-EG  (query param, default: en-US)

Response: { "text": "..." }
```

**`POST /summary`**
```json
{ "text": "...", "language": "en" }
Response: { "summary": "...", "key_points": [...], "important_concepts": [...] }
```

**`POST /quiz`**
```json
{ "text": "..." }
Response: { "questions": [{ "question": "...", "options": ["A","B","C","D"], "answer": 0 }] }
```

**`POST /chat`**
```json
{ "question": "...", "lecture_text": "..." }
Response: { "answer": "..." }
```

**`POST /translate`**
```json
{ "text": "...", "target_language": "Arabic" }
Response: { "translated_text": "..." }
```

---

## المتطلبات

### 1. Python 3.8+

### 2. ffmpeg (مطلوب للتحويل الصوتي)

pydub تعتمد على ffmpeg لتحويل ملفات MP3, MP4, OGG, M4A إلى WAV قبل إرسالها لـ Azure Speech.

| نظام التشغيل | أمر التثبيت |
|---|---|
| Windows | `winget install ffmpeg` أو `choco install ffmpeg` |
| macOS | `brew install ffmpeg` |
| Ubuntu/Debian | `sudo apt install ffmpeg` |

> إذا كنت ستستخدم ملفات WAV فقط يمكنك تخطّي ffmpeg، لكن يُنصح بتثبيته.

### 3. مفاتيح API مطلوبة

- **OpenAI API Key** — من [platform.openai.com](https://platform.openai.com)
- **Azure Speech Key + Region** — من [portal.azure.com](https://portal.azure.com) > Cognitive Services > Speech

---

## تشغيل المشروع

### الخطوة 1 — إنشاء بيئة افتراضية

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### الخطوة 2 — تثبيت المكتبات

```bash
pip install -r requirements.txt
```

### الخطوة 3 — إعداد ملف `.env`

أنشئ ملف `.env` في جذر المشروع وأضف مفاتيحك:

```env
OPENAI_API_KEY=your_openai_api_key_here
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region_here
```

### الخطوة 4 — تشغيل الخادم

```bash
uvicorn main:app --reload
```

### الخطوة 5 — فتح في المتصفح

```
http://127.0.0.1:8000
```

> يُنصح باستخدام Chrome أو Edge للحصول على أفضل تجربة.

---

## الاستخدام

1. **رفع محاضرة**: اختر تبويب "ارفع تسجيل"، اسحب ملفاً صوتياً أو فيديو، حدّد اللغة ثم اضغط "حوّل إلى مادة دراسية"
2. **لصق نص**: اختر تبويب "الصق نصاً"، الصق نص المحاضرة مباشرة
3. **الملخص**: يظهر تلقائياً — اضغط "اعرض بالعربي" للترجمة
4. **الاختبار**: أجب على الأسئلة ثم اضغط "تحقق من إجاباتي"، أو اضغط "أسئلة جديدة" لاختبار جديد
5. **الشات**: اكتب سؤالك في تبويب "شات" — الإجابات من محتوى المحاضرة فقط

---

## الأمان

- **لا ترفع ملف `.env`** إلى git أبداً — يحتوي على مفاتيح سرية
- مفاتيح API تبقى في الـ backend دائماً، الـ frontend لا يلمسها
- `.gitignore` يستثني `.env` و `.venv/` و `__pycache__/` تلقائياً
- جميع طلبات AI تمر عبر الـ backend لحماية المفاتيح

---

## الصيغ الصوتية المدعومة

WAV, MP3, MP4, M4A, OGG, FLAC, وأي صيغة يدعمها ffmpeg

---

## المتطلبات الكاملة (requirements.txt)

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
jinja2==3.1.2
python-multipart==0.0.6
openai==1.3.5
python-dotenv==1.0.0
azure-cognitiveservices-speech==1.32.1
pydub==0.25.1
```

---

## مشروع تخرج — كلية [اسم الكلية]

**الطالب:** [اسمك]  
**المشرف:** [اسم المشرف]  
**السنة الدراسية:** 2025–2026

---

*Built with FastAPI · OpenAI GPT-4o-mini · Azure Speech Services*
