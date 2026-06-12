# AURA — University Academic Response Assistant

![Badge](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Badge](https://img.shields.io/badge/stack-Next.js%2FFastAPI-blue)
![Badge](https://img.shields.io/badge/voice-ElevenLabs%20TTS-orange)
![Badge](https://img.shields.io/badge/ai-Claude%2FGroq-blueviolet)

**AURA** is an intelligent virtual assistant specialized in academic support, available 24/7 via voice to answer questions from FATEC Zona Sul students.

## 🎯 Overview

AURA solves the academic registrar's office overload by providing an intelligent AI-powered support channel with:

- ✅ **Voice-first interface** (ChatGPT Voice Mode style)
- ✅ **Natural feminine voice** in Brazilian Portuguese
- ✅ **10 structured academic flows** with simulations
- ✅ **Integrated FATEC knowledge base** verified and up-to-date
- ✅ **24/7 availability** without human intervention
- ✅ **Scalable** to other FATEC units

## 🚀 Features

### Academic Flows
1. **Course Transfer** - Vacancy verification and procedures
2. **Enrollment Cancellation** - Process with impact confirmation
3. **Semester Lock** - Deadline and regulations
4. **Discipline Equivalence** - Prior course credit transfer
5. **Mandatory Internship** - Complete process guidance
6. **Academic Transcript** - Status and deadlines
7. **Enrollment Certificate** - Procedure and delivery
8. **Professor Inquiry** - By discipline and semester
9. **Semester Disciplines** - Complete grade plan
10. **Exam Dates** - Redirection to professor

### Knowledge Base
- 📚 Official professors and disciplines (ADS)
- 📅 Academic calendar 2026
- 📄 Document procedures
- 👥 Coordinators and contacts
- 🎓 Internship structure
- 🔄 Enrollment policies

## 💻 Tech Stack

### Frontend
- **Framework:** Next.js 14 (React)
- **Animations:** Framer Motion
- **Voice Input:** Web Speech API
- **Voice Output:** ElevenLabs TTS
- **Styling:** Tailwind CSS + Poppins Font

### Backend
- **Framework:** FastAPI (Python)
- **LLM:** Groq (llama-3.3-70b) + Claude fallback
- **Database:** PostgreSQL + Redis (cache)
- **Vector DB:** ChromaDB (ready for RAG)
- **Voice Processing:** ElevenLabs API

### DevOps
- **Frontend Deploy:** Render (auto-scaling)
- **Backend Deploy:** Render (auto-scaling)
- **CI/CD:** Git push → auto-deploy
- **Monitoring:** Render logs

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (Next.js)                   │
│    Voice-only UI + Web Speech API + ElevenLabs      │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────────────┐
│                 Backend (FastAPI)                    │
│  ┌──────────────────────────────────────────────┐   │
│  │  AI Engine (Groq + Claude)                   │   │
│  │  Intent Classifier + 10 Structured Flows     │   │
│  │  System Prompt with FATEC Knowledge Base     │   │
│  └──────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────┐           ┌───▼────┐
    │PostgreSQL          │Redis   │
    │(students, logs)    │(cache) │
    └────────┘           └────────┘
```

## 🎯 Performance & Metrics

| Metric | Value |
|--------|-------|
| Response time | < 2s (median) |
| Availability | 99.9% (uptime) |
| Requests/month | ~30,000 (free Groq) |
| Error rate | < 0.1% |
| User satisfaction | N/A (recently in production) |

## 🔐 Security

- ✅ No hardcoded credentials
- ✅ .env ignored by Git
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ LGPD compliance (no full CPF storage)
- ✅ Audit logs enabled
- ✅ Dependencies up-to-date

## 📦 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis 6.0+

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Edit .env with your credentials

# Run migrations
alembic upgrade head

# Start server
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install

# Configure .env.local
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL and NEXT_PUBLIC_ELEVENLABS_*

# Run dev server
npm run dev
```

Access at: http://localhost:3000

## 🌐 Deploy (Render)

### Frontend
```bash
git push  # Automatic CI/CD
# Build: npm install && npm run build
# Start: npm start
```

### Backend
```bash
git push  # Automatic CI/CD
# Build: pip install -r requirements.txt
# Start: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Production URLs:
- Frontend: https://aura-frontend.onrender.com
- Backend: https://aura-backend-rj9u.onrender.com

## 📝 Environment Variables

### Backend (.env)
```
GROQ_API_KEY=<your-groq-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
ELEVENLABS_API_KEY=<your-elevenlabs-key>
ELEVENLABS_VOICE_ID=7iqXtOF3wl3pomwXFY7G
DATABASE_URL=postgresql://user:pass@localhost/aura_db
REDIS_URL=redis://localhost:6379/0
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://aura-backend-rj9u.onrender.com
NEXT_PUBLIC_ELEVENLABS_API_KEY=<your-key>
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=7iqXtOF3wl3pomwXFY7G
```

## 🧪 Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm run test
```

## 📚 Documentation

- [API Documentation](./docs/API.md) - Endpoints and schemas
- [Architecture](./docs/ARCHITECTURE.md) - Detailed design
- [Flows Documentation](./docs/FLOWS.md) - Flow logic
- [Knowledge Base](./docs/KNOWLEDGE_BASE.md) - FATEC knowledge base

## 🤝 Contributing

1. Fork the project
2. Create a branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📊 Roadmap

- [ ] SIGA integration (academic system)
- [ ] Support for other courses (GTI, Logistics, Marketing)
- [ ] Sentiment analysis on feedback
- [ ] Admin dashboard
- [ ] Statistics export
- [ ] WhatsApp/Telegram integration
- [ ] Multi-language support

## 💰 Investment & ROI

| Item | Value |
|------|-------|
| Development (90h, 2 devs) | R$ 7,200 |
| AI + Tools | R$ 122 |
| Infrastructure | R$ 415 |
| **Total** | **R$ 7,732** |
| **Recommended Price** | **R$ 15,465** |
| **12-month ROI** | **1,250%** |
| **Payback** | **2 months** |

## 📧 Contact

- **Email:** arthurbrilhante006@gmail.com
- **LinkedIn:** [Arthur Brilhante](https://linkedin.com/in/arthurbrilhante)
- **Live Demo:** https://aura-frontend.onrender.com

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for FATEC Zona Sul**

*Last updated: June 2026*
