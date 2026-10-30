
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.PORT || 3000;

function validIBAN(value) {
  const iban = value.replace(/\s/g, "").toUpperCase();

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban))
    return false;

  const moved = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;

  for (const character of moved) {
    const digits = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - 55)
      : character;

    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {

  if (req.method === "GET" && req.url === "/") {
    const file = path.join(__dirname, "index.html");

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });

    fs.createReadStream(file).pipe(res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/transfers") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 10000) req.destroy();
    });

    req.on("end", () => {
      let data;

      try {
        data = JSON.parse(body);
      } catch {
        return sendJSON(res, 400, {
          error: "Données JSON invalides."
        });
      }

      const { beneficiaryName, iban, amount, currency } = data;

      if (
        typeof beneficiaryName !== "string" ||
        !beneficiaryName.trim() ||
        beneficiaryName.length > 100 ||
        typeof iban !== "string" ||
        !validIBAN(iban) ||
        typeof amount !== "string" ||
        !/^\d+(\.\d{2})$/.test(amount) ||
        currency !== "EUR"
      ) {
        return sendJSON(res, 400, {
          error: "Informations du transfert invalides."
        });
      }

      const cents = Math.round(Number(amount) * 100);

      if (!Number.isSafeInteger(cents) ||
          cents < 100 || cents > 1000000) {
        return sendJSON(res, 400, {
          error: "Montant autorisé : de 1 à 10 000 €."
        });
      }

      // À intégrer avec un prestataire agréé :
      // 1. Authentifier l'utilisateur.
      // 2. Vérifier son identité et le bénéficiaire.
      // 3. Créer une opération côté prestataire.
      // 4. Obtenir une URL de paiement sécurisée.
      // 5. Vérifier les webhooks signés.
      // 6. Déclencher le versement autorisé.
      //
      // Ne jamais considérer le retour du navigateur
      // comme une preuve de paiement.

      return sendJSON(res, 503, {
        error: "Le paiement réel n'est pas encore activé. " +
          "Un prestataire agréé doit être configuré."
      });
    });

    return;
  }

  sendJSON(res, 404, { error: "Page introuvable." });
});

server.listen(PORT, () => {
  console.log(`EuroTransfer : http://localhost:${PORT}`);
});
