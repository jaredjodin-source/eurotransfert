
const {getToken} = require("../lib/mangopay");

module.exports = async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");

  const origin = process.env.FRONTEND_ORIGIN;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin",origin);
    res.setHeader("Vary","Origin");
  }

  if(req.method!=="GET") {
    return res.status(405).json({
      error:"Méthode non autorisée"
    });
  }

  try {
    await getToken();

    return res.status(200).json({
      connected:true,
      provider:"Mangopay",
      transfersEnabled:false
    });
  } catch(error) {
    console.error("Mangopay health check failed");

    return res.status(503).json({
      connected:false,
      error:"Connexion bancaire indisponible"
    });
  }
};
