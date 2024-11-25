const { combineAndSign } = require("../utils/hashUtils.js");
const { getEncryptedModelsAndHashes, fetchModelVersions } = require("../utils/processModel");
const { encryptAesKey } = require("../utils/encryptionUtils");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

exports.getAllEncryptedModels = async (req, res, next) => {
  try {
    console.log("req recieved-------------");
    const modelVersions = await fetchModelVersions();

    const publicKeyBase64 = req.body.publicKey;
    if (!publicKeyBase64) {
      return res.status(400).json({ message: "Public key is required" });
    }

    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const {encryptedModels,hashes} = await getEncryptedModelsAndHashes(modelVersions, aesKey, iv);

    const signedHash = await combineAndSign(hashes);
    console.log("Signed hash:", signedHash);
    const encryptedAesKey = encryptAesKey(aesKey, publicKeyBase64);

    res.status(200).json({
      message: "Models encrypted and signed successfully",
      encryptedModels,
      encryptedAesKey: encryptedAesKey.toString("base64"),
      iv: iv.toString("base64"),
      signedCombinedHash: signedHash,
    });
  } catch (error) {
    console.error("Error fetching and processing models:", error);
    res.status(500).json({ error: "Failed to fetch and process models." });
  }
};


exports.getPublicVerificationKey = async (req, res, next) => {
  try {
    const publicKey = fs.readFileSync(path.join(__dirname, "../digital_signature_keys/public_key.pem"), "utf8");
    res.status(200).json({ publicKey: publicKey });
  } catch (error) {
    console.error("Error fetching public key:", error);
    res.status(500).json({ error: "Failed to fetch public key." });
  }
}
