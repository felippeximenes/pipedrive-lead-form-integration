function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createPersonInPipedrive({ name, email, phone }) {
  const token = window.PIPE_DRIVE_API_TOKEN;
  const domain = window.PIPE_DRIVE_COMPANY_DOMAIN;

  if (!token || !domain) {
    throw new Error("Config faltando: token ou domain (config.js).");
  }

  const url = `https://${domain}.pipedrive.com/api/v1/persons?api_token=${encodeURIComponent(token)}`;

  const payload = {
    name,
    email: email ? [{ value: email, primary: true }] : [],
    phone: phone ? [{ value: phone, primary: true }] : [],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }

  return data?.data; // pessoa criada
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("leadForm");
  const status = document.getElementById("status");
  const output = document.getElementById("output");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();

    if (name.length < 2) {
      status.innerHTML = `<span class="err">Nome inválido.</span>`;
      return;
    }
    if (!isValidEmail(email)) {
      status.innerHTML = `<span class="err">Email inválido.</span>`;
      return;
    }

    const leadPayload = {
      name,
      email,
      phone: phone || null,
      source: "web_form_step_2",
      created_at: new Date().toISOString(),
    };

    output.textContent = JSON.stringify(leadPayload, null, 2);

    try {
      submitBtn.disabled = true;
      status.innerHTML = `Enviando para o Pipedrive...`;

      const person = await createPersonInPipedrive({ name, email, phone });

      status.innerHTML = `<span class="ok">OK! Pessoa criada no Pipedrive (id: ${person.id}).</span>`;
    } catch (err) {
      status.innerHTML = `<span class="err">Falhou: ${err.message}</span>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.blur();
    }
  });
});
