const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function pipedrivePost({ domain, token, path, payload }) {
  const url = `https://${domain}.pipedrive.com/api/v1/${path}?api_token=${encodeURIComponent(
    token
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || data?.success === false) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(`Pipedrive error on ${path}: ${msg}`);
  }

  return data.data;
}

export async function handler(event) {
  // Preflight (CORS)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  // Só POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Method Not Allowed" }),
    };
  }

  try {
    const { name, email, phone } = JSON.parse(event.body || "{}");

    if (!name || !email) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ ok: false, error: "Nome e email são obrigatórios." }),
      };
    }

    const token = process.env.PIPEDRIVE_API_TOKEN;
    const domain = process.env.PIPEDRIVE_COMPANY_DOMAIN;

    if (!token || !domain) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          ok: false,
          error: "ENV faltando no Netlify",
          hint: "Configure PIPEDRIVE_API_TOKEN e PIPEDRIVE_COMPANY_DOMAIN (apenas subdomínio). Depois faça um novo deploy.",
        }),
      };
    }

    // 1) Cria Pessoa
    const personPayload = {
      name,
      email: [{ value: email, primary: true }],
      phone: phone ? [{ value: phone, primary: true }] : [],
    };

    const person = await pipedrivePost({
      domain,
      token,
      path: "persons",
      payload: personPayload,
    });

    // 2) Cria Deal associado à Pessoa
    const dealPayload = {
      title: `Lead - ${name}`,
      person_id: person.id,
      // você pode setar value/currency se quiser:
      // value: 0,
      // currency: "BRL",
    };

    const deal = await pipedrivePost({
      domain,
      token,
      path: "deals",
      payload: dealPayload,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, person, deal }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: false,
        error: err.message,
        hint: "Se falhar, confira o domínio (subdomínio) e o token nas ENV do Netlify e veja os logs da Function.",
      }),
    };
  }
}
