const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
          hint: "Crie PIPEDRIVE_API_TOKEN e PIPEDRIVE_COMPANY_DOMAIN (somente o subdomínio). Depois faça Clear cache and deploy.",
        }),
      };
    }

    const url = `https://${domain}.pipedrive.com/api/v1/persons?api_token=${encodeURIComponent(token)}`;

    const payload = {
      name,
      email: [{ value: email, primary: true }],
      phone: phone ? [{ value: phone, primary: true }] : [],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          ok: false,
          error: data?.error || `HTTP ${response.status}`,
          hint: "Se o erro for de autenticação, revise o token. Se for domínio, revise PIPEDRIVE_COMPANY_DOMAIN.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, person: data.data }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: false,
        error: err.message,
        hint: "Se continuar 'fetch failed', confira NODE_VERSION=18 no netlify.toml e confirme o domínio do Pipedrive (subdomínio). Depois faça Clear cache and deploy.",
      }),
    };
  }
}
