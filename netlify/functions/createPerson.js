/**
 * Netlify Function
 * Cria uma Pessoa (Lead) no Pipedrive
 *
 * Fluxo:
 * Frontend -> /.netlify/functions/createPerson -> Pipedrive API
 *
 * Variáveis de ambiente necessárias:
 * - PIPEDRIVE_API_TOKEN
 * - PIPEDRIVE_COMPANY_DOMAIN
 */

export async function handler(event) {
  // Aceita apenas POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const { name, email, phone } = JSON.parse(event.body || "{}");

    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Nome e email são obrigatórios." }),
      };
    }

    const token = process.env.PIPEDRIVE_API_TOKEN;
    const domain = process.env.PIPEDRIVE_COMPANY_DOMAIN;

    if (!token || !domain) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Variáveis de ambiente do Pipedrive não configuradas.",
        }),
      };
    }

    const url = `https://${domain}.pipedrive.com/api/v1/persons?api_token=${encodeURIComponent(
      token
    )}`;

    const payload = {
      name,
      email: [{ value: email, primary: true }],
      phone: phone ? [{ value: phone, primary: true }] : [],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || "Erro ao criar pessoa no Pipedrive");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        person: data.data,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message,
      }),
    };
  }
}
