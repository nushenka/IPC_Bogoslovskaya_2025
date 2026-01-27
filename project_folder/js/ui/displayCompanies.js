export function displayCompanies(companies, player) {
  const root = document.getElementById("companyList");
  root.innerHTML = "";

  companies.forEach((company) => {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";

    const btn = document.createElement("button");
    btn.textContent = "Купить";
    btn.onclick = () => {
      if (!company.buy(player)) {
        alert("Нельзя купить компанию");
      }
      displayCompanies(companies, player);
    };

    div.innerHTML = `
      <h3>${company.name}</h3>
      <p>Цена: ${company.price}</p>
      <p>${company.ownedByPlayer ? "✅ Куплена" : "❌ Не куплена"}</p>
    `;

    div.appendChild(btn);
    root.appendChild(div);
  });
}
