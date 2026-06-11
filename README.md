AURA — Assistente Universitária de Respostas Acadêmicas


Assistente de IA por voz desenvolvido para a secretaria acadêmica da FATEC Zona Sul, capaz de responder dúvidas de alunos em linguagem natural, 24 horas por dia.




Sobre o Projeto

A AURA nasceu da necessidade de reduzir a sobrecarga da secretaria acadêmica e oferecer aos alunos um canal de atendimento rápido, preciso e sempre disponível.

Em vez de esperar na fila ou ligar no horário comercial, o aluno simplesmente fala com a AURA — que responde com voz feminina natural em português, como se fosse uma atendente real.

Desenvolvido por: Arthur Brilhante & Júlio César Conceição Santos
Instituição: FATEC Zona Sul
Curso: Análise e Desenvolvimento de Sistemas
Demo: https://aura-frontend.onrender.com


Funcionalidades


Atendimento por voz 100% em português brasileiro
Respostas sobre grade horária, professores e disciplinas
Calendário acadêmico e datas importantes
Solicitação de documentos (declaração de matrícula, histórico)
Orientações sobre trancamento e transferência de curso
Informações sobre estágio obrigatório
Interface responsiva (desktop e mobile)
Disponível 24/7 sem intervenção humana



Stack Tecnológico

CamadaTecnologiaFrontendNext.js + Framer MotionBackendFastAPIBanco de dadosPostgreSQL + RedisIAClaude via GroqVoz (TTS)ElevenLabsVoz (STT)Web Speech APIDeployRender (cloud)


Arquitetura

Usuário (voz)
     ↓
Web Speech API (captura a fala)
     ↓
FastAPI Backend
     ↓
Claude via Groq (processa a pergunta)
     ↓
ElevenLabs TTS (gera áudio em português)
     ↓
Usuário ouve a resposta


Como Rodar Localmente

Pré-requisitos


Python 3.10+
Node.js 18+
PostgreSQL
Redis


1. Clone o repositório

bashgit clone https://github.com/seu-usuario/aura.git
cd aura

2. Configure as variáveis de ambiente

Crie um arquivo .env na raiz do projeto:

envANTHROPIC_API_KEY=sua_chave_aqui
GROQ_API_KEY=sua_chave_aqui
ELEVENLABS_API_KEY=sua_chave_aqui
DATABASE_URL=postgresql://usuario:senha@localhost:5432/aura
REDIS_URL=redis://localhost:6379

3. Instale as dependências do backend

bashcd backend
pip install -r requirements.txt
uvicorn main:app --reload

4. Instale as dependências do frontend

bashcd frontend
npm install
npm run dev

5. Acesse

http://localhost:3000


Base de Conhecimento

A AURA responde com base em informações estruturadas da FATEC Zona Sul:


✅ Professores e disciplinas do curso de ADS
✅ Calendário acadêmico 2026
✅ Procedimentos e documentos acadêmicos
✅ Coordenadores e contatos institucionais
⚙️ Expansível para GTI, Logística e Marketing



Impacto Esperado


Redução de ~80% no tempo de atendimento presencial
Disponibilidade 24/7 sem custo operacional adicional
Modelo replicável para outras unidades FATEC



Próximos Passos


Integração com o sistema SIGA
Testes com grupo piloto de alunos
Coleta de feedback e ajustes
Deploy em produção na FATEC
Expansão para outros cursos e unidades



Licença

Este projeto foi desenvolvido para fins acadêmicos na FATEC Zona Sul.
