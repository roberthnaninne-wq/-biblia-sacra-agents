const https = require("https");
const querystring = require("querystring");

const AUTHORIZED_NUMBER = "+5531999394759";

const CORPUS = `CORPUS: Biblia Sacra Vulgata — 5 volumes digitalizados pela UNESP (Brasil)
VOL I (634p): AT — Gênesis ao Levítico. "In principio creavit Deus Caelum et terram" (Gn 1:1)
VOL II (616p): AT — Reis, Crônicas, Esdras, Neemias, Tobias, Judite, Ester, Jó.
VOL III (506p): Missale Romanum (Ed. IX, Pustet, Ratisbona 1924, canto gregoriano) + Livros Sapienciais.
VOL IV (452p): Ezequiel (visão da merkavá), Miquéias, Profetas Menores.
VOL V (530p): NT — Mateus, Marcos, Lucas, João.
TRADIÇÃO: São Jerônimo (347-420 d.C.), Belém. Concílio de Trento (1545-63). Edição Clementina (1592).`;

const AGENTS = [
  {
    id: "historicus", name: "HISTORICUS", icon: "⚔",
    sys: `Você é HISTORICUS — especialista em história dos textos sagrados.\n${CORPUS}\nAnalise a dimensão histórica: origens (Jerônimo, Belém, Império Romano tardio), Concílio de Trento, edição Clementina 1592, Missale Romanum 1924, digitalização UNESP. Cite exemplos dos textos. Responda em português, 250-280 palavras.`
  },
  {
    id: "linguisticus", name: "LINGUISTICUS", icon: "Λ",
    sys: `Você é LINGUISTICUS — especialista em filologia e linguística histórica.\n${CORPUS}\nAnalise: latim eclesiástico de Jerônimo, hebraísmos na sintaxe latina, grecismos do NT koinê, aramaísmos ("Abba","Pascha"), neologismos teológicos ("incarnatio","salvator"). Cite latim com tradução. Responda em português, 250-280 palavras.`
  },
  {
    id: "narrativus", name: "NARRATIVUS", icon: "∞",
    sys: `Você é NARRATIVUS — especialista em teoria literária e narratologia.\n${CORPUS}\nAnalise: gêneros (mito Gn1-11, saga patriarcal, profecia, evangelho), estruturas (quiasmo, inclusio, tipologia), narrador onisciente divino, intertextualidade Mateus-AT, Missale como drama ritual. Responda em português, 250-280 palavras.`
  },
  {
    id: "anthropologicus", name: "ANTHROPOLOGICUS", icon: "◉",
    sys: `Você é ANTHROPOLOGICUS — especialista em antropologia social e cultural.\n${CORPUS}\nAnalise: sociedade patriarcal semítica, nomadismo vs. sedentarismo, parentesco (levirato, endogamia), sistema levítico como código social, monarquia de Salomão, identidade judaica no exílio (Ez 18), Palestina sob Roma. Responda em português, 250-280 palavras.`
  },
  {
    id: "theologicus", name: "THEOLOGICUS", icon: "✦",
    sys: `Você é THEOLOGICUS — especialista em teologia bíblica e hermenêutica.\n${CORPUS}\nAnalise: teologia da criação (creatio ex nihilo, imago Dei), alianças progressivas (Noé→Abraão→Moisés→Davi→Nova), nomes divinos e escolhas de Jerônimo, teologia do Templo, cristologia mateana (Emmanuel Mt 1:23), Missale e teologia sacramental. Responda em português, 250-280 palavras.`
  },
  {
    id: "artis", name: "ARTIS", icon: "✿",
    sys: `Você é ARTIS — especialista em história da arte, musicologia e iconografia.\n${CORPUS}\nAnalise: Bíblia como geradora de arte ocidental por 2000 anos, Missale e canto gregoriano (neumas, modos eclesiásticos), Bíblias iluminadas medievais, tipografia Pustet 1924, iconografia bíblica (Michelangelo, Rembrandt), Cântico e música (Palestrina, Bach), visão de Ezequiel e arte visionária. Responda em português, 250-280 palavras.`
  }
];

const SYNTH_SYS = `Você é SYNTHESIS — orquestrador do Colégio da Biblia Sacra Vulgata.\n${CORPUS}\nSintetize análises de 6 especialistas em duas rodadas. Produza visão integrada de 280-320 palavras em português: convergências, tensões produtivas, tese unificada, novos horizontes investigativos.`;

function callClaude(system, userMsg, maxTokens = 900) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMsg }]
    });
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data).content?.[0]?.text || "Erro."); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sendWA(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const postData = querystring.stringify({ From: from, To: `whatsapp:${to}`, Body: body });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.twilio.com",
      path: `/2010-04-01/Accounts/${sid}/Messages.json`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
        "Authorization": "Basic " + Buffer.from(`${sid}:${token}`).toString("base64")
      }
    }, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function runIndividual(agent, question, to) {
  await sendWA(to, `${agent.icon} *${agent.name}* analisando...\n\n_"${question.slice(0, 80)}"_`);
  const response = await callClaude(agent.sys, question);
  await sendWA(to, `${agent.icon} *${agent.name}*\n\n${response}`);
}

async function runCollective(question, to) {
  await sendWA(to,
    `📖 *Colégio Biblia Sacra Vulgata*\n\n` +
    `*Questão:* ${question}\n\n` +
    `⟳ _Fase 1 — 6 agentes analisando em paralelo..._`
  );

  const p1 = await Promise.all(
    AGENTS.map(ag => callClaude(ag.sys, question).then(r => ({ agent: ag, response: r })))
  );

  const p1Preview = p1.map(r => `${r.agent.icon} *${r.agent.name}*:\n${r.response.slice(0, 180)}...`).join("\n\n");
  await sendWA(to, `✅ *Fase 1 Concluída*\n\n${p1Preview.slice(0, 1500)}\n\n⟳ _Fase 2 — Debate coletivo..._`);

  const ctx = p1.map(r => `[${r.agent.name}]:\n${r.response}`).join("\n\n---\n\n");

  const p2 = await Promise.all(
    AGENTS.map(ag =>
      callClaude(
        `Você é o Agente ${ag.name} no debate coletivo do Colégio Biblia Sacra Vulgata.\n${CORPUS}\nAprofunde sua perspectiva à luz das análises dos colegas. Identifique convergências e o que sua especialidade acrescenta de único. Responda em português, 180-220 palavras.`,
        `QUESTÃO: ${question}\n\nANÁLISES DOS COLEGAS:\n${ctx}`
      ).then(r => ({ agent: ag, response: r }))
    )
  );

  await sendWA(to, `⟳ _Sintetizando perspectivas..._`);

  const allCtx =
    `QUESTÃO: ${question}\n\n` +
    `FASE 1 — ANÁLISES INDIVIDUAIS:\n${p1.map(r => `[${r.agent.name}]: ${r.response}`).join("\n\n")}\n\n` +
    `FASE 2 — DEBATE COLETIVO:\n${p2.map(r => `[${r.agent.name}]: ${r.response}`).join("\n\n")}`;

  const synthesis = await callClaude(SYNTH_SYS, allCtx, 800);

  await sendWA(to, `◈ *SYNTHESIS — Visão Integrada do Colégio*\n\n${synthesis}`);
  await sendWA(to,
    `✦ *Análise concluída.*\n\n` +
    `6 agentes · 2 rodadas · síntese integrada\n\n` +
    `_Use o app web para gerar o Documento HTML completo._\n\n` +
    `Digite *!ajuda* para ver todos os comandos.`
  );
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  let bodyStr = "";
  if (typeof req.body === "string") bodyStr = req.body;
  else if (req.body && typeof req.body === "object") bodyStr = querystring.stringify(req.body);

  const params = querystring.parse(bodyStr);
  const from = (params.From || "").replace("whatsapp:", "");
  const msg = (params.Body || "").trim();

  if (from !== AUTHORIZED_NUMBER) return res.status(200).send("<Response></Response>");
  res.status(200).send("<Response></Response>");
  if (!msg) return;

  try {
    const lower = msg.toLowerCase();

    if (lower === "!ajuda" || lower === "!help") {
      await sendWA(from,
        `📖 *Biblia Sacra Vulgata — Colégio de Agentes*\n\n` +
        `*Comandos:*\n\n` +
        `!coletivo [pergunta]\n→ Pipeline completo (6 agentes + debate + síntese)\n\n` +
        `!historicus [pergunta] → análise histórica\n` +
        `!linguisticus [pergunta] → análise linguística\n` +
        `!narrativus [pergunta] → análise literária\n` +
        `!anthropologicus [pergunta] → análise antropológica\n` +
        `!theologicus [pergunta] → análise teológica\n` +
        `!artis [pergunta] → análise artística\n\n` +
        `_Mensagem sem prefixo = modo coletivo automático_`
      );
      return;
    }

    const agentMatch = AGENTS.find(a => lower.startsWith(`!${a.id}`));
    if (agentMatch) {
      const q = msg.slice(agentMatch.id.length + 1).trim() || "Apresente-se e descreva sua especialidade na análise da Biblia Sacra Vulgata.";
      await runIndividual(agentMatch, q, from);
      return;
    }

    const question = lower.startsWith("!coletivo ") ? msg.slice(10).trim() : msg;
    if (question) await runCollective(question, from);

  } catch (err) {
    console.error("Erro:", err);
    try { await sendWA(from, `⚠ Erro: ${err.message}`); } catch (_) { }
  }
};
