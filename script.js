function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("leadForm");
  const status = document.getElementById("status");
  const output = document.getElementById("output");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();

    // Validação simples (Step 1)
    if (name.length < 2) {
      status.innerHTML = `<span class="err">Nome inválido.</span>`;
      return;
    }
    if (!isValidEmail(email)) {
      status.innerHTML = `<span class="err">Email inválido.</span>`;
      return;
    }

    // Payload que vamos usar no Step 2 (API do Pipedrive)
    const leadPayload = {
      name,
      email,
      phone: phone || null,
      source: "web_form_step_1",
      created_at: new Date().toISOString(),
    };

    output.textContent = JSON.stringify(leadPayload, null, 2);
    status.innerHTML = `<span class="ok">Payload gerado com sucesso (sem enviar para API ainda).</span>`;

    // Só pra não ficar travado no form
    submitBtn.blur();
  });
});
