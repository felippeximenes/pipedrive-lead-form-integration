function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * ✅ Chamada “profissional”:
 * Frontend -> Netlify Function -> Pipedrive API
 * (token fica no servidor/ENV, não no navegador)
 */
async function createPersonViaFunction({ name, email, phone }) {
  const res = await fetch("/.netlify/functions/createPerson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone }),
  });

  // tenta ler resposta como JSON
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Erro HTTP ${res.status}`);
  }

  return data.person; // pessoa criada (retorno da function)
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

      // ✅ trocamos a chamada direta pra API pela Function
      const person = await createPersonViaFunction({ name, email, phone });

      status.innerHTML = `<span class="ok">OK! Pessoa criada no Pipedrive (id: ${person.id}).</span>`;
    } catch (err) {
      status.innerHTML = `<span class="err">Falhou: ${err.message}</span>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.blur();
    }
  });
});
