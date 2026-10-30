
function validIBAN(value) {
  if(typeof value!=="string")return false;

  const iban=value.replace(/\s/g,"").toUpperCase();

  const lengths={
    AT:20,BE:16,BG:22,CH:21,CY:28,CZ:24,
    DE:22,DK:18,EE:20,ES:24,FI:18,FR:27,
    GB:22,GR:27,HR:21,HU:28,IE:22,IS:26,
    IT:27,LI:21,LT:20,LU:20,LV:21,MC:27,
    MT:31,NL:18,NO:15,PL:28,PT:25,RO:24,
    SE:24,SI:19,SK:24,SM:27
  };

  if(!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban))
    return false;

  if(lengths[iban.slice(0,2)]!==iban.length)
    return false;

  const rearranged=iban.slice(4)+iban.slice(0,4);
  let remainder=0;

  for(const char of rearranged) {
    const digits=/[A-Z]/.test(char)
      ? String(char.charCodeAt(0)-55)
      : char;

    for(const digit of digits) {
      remainder=(remainder*10+Number(digit))%97;
    }
  }

  return remainder===1;
}

module.exports=async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");

  const origin=process.env.FRONTEND_ORIGIN;

  if(origin) {
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Vary","Origin");
    res.setHeader(
      "Access-Control-Allow-Methods","POST, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers","Content-Type"
    );
  }

  if(req.method==="OPTIONS")
    return res.status(204).end();

  if(req.method!=="POST")
    return res.status(405).json({
      error:"Méthode non autorisée"
    });

  const data=req.body;

  if(!data || typeof data!=="object" ||
     Array.isArray(data)) {
    return res.status(400).json({
      error:"Données invalides"
    });
  }

  const {
    holder,beneficiary,iban,amountCents,currency
  }=data;

  if(
    typeof holder!=="string" ||
    holder.trim().length<2 ||
    holder.length>100 ||
    typeof beneficiary!=="string" ||
    beneficiary.trim().length<2 ||
    beneficiary.length>100 ||
    !validIBAN(iban) ||
    !Number.isSafeInteger(amountCents) ||
    amountCents<100 ||
    amountCents>1000000 ||
    currency!=="EUR"
  ) {
    return res.status(400).json({
      error:"Informations du transfert invalides"
    });
  }

  // Aucun débit n'est effectué ici.
  // Ne pas activer les paiements avant :
  // - l'approbation Mangopay du parcours
  // - l'authentification des utilisateurs
  // - les contrôles KYC et antifraude
  // - une base de données transactionnelle
  // - la gestion des webhooks et remboursements
  // - l'enregistrement SCA des bénéficiaires
  // - la prévention des doubles paiements

  return res.status(503).json({
    status:"TRANSFERS_NOT_ENABLED",
    error:
      "Le serveur fonctionne, mais les transferts " +
      "réels ne sont pas encore autorisés."
  });
};
