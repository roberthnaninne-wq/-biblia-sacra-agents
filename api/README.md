# Biblia Sacra Vulgata — Colégio de Agentes

## Estrutura do Projeto
```
biblia-sacra-agents/
├── api/
│   └── whatsapp.js   ← webhook WhatsApp
├── vercel.json
├── package.json
└── README.md
```

## Variáveis de Ambiente (Vercel → Settings → Environment Variables)

| Variável | Valor |
|---|---|
| ANTHROPIC_API_KEY | sk-ant-api03-4TZVE7XQxHbZs7jOJ9JZgo3Qmdr9kdyEXUZGub2YyTR812V93S3u1NlwYGTSGdDgA4KIz4b42eiFamZ9Fs2aWA-Q77nnAAA |
| TWILIO_ACCOUNT_SID | ACeab430e04a17172df33e2dbff9062af3 |
| TWILIO_AUTH_TOKEN | 1e8b686a3f81598c0c82fb1da535856a |
| TWILIO_WHATSAPP_FROM | whatsapp:+14155238886 |

## Webhook Twilio
Após o deploy, configure no Twilio:
- URL: https://SEU-PROJETO.vercel.app/api/whatsapp
- Método: HTTP POST

## Comandos WhatsApp
- !coletivo [pergunta] — pipeline completo
- !historicus / !linguisticus / !narrativus / !anthropologicus / !theologicus / !artis [pergunta]
- !ajuda — lista todos os comandos
- Sem prefixo = modo coletivo automático
