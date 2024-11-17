const {fetchEncryptedFilesFromS3} = require("../utils/s3utils");
const { encryptModel } = require("../utils/encryptionUtils.js");
const { generateModelHash, signModelHash } = require("../utils/hashUtils.js");  

const crypto = require("crypto");
exports.getAllEncryptedModels = async (req, res, next) => {
  try {
    const modelKey = "antispofing.onnx"; 

    const { modelFile } = await fetchEncryptedFilesFromS3(
      modelKey
    );

    console.log("Decrypted model file:", modelFile);

    const publicKeyBase64 = req.body.publicKey;
        if (!publicKeyBase64) {
            return res.status(400).json({ message: "Public key is required" });
        }

        const { encryptedModel, encryptedAesKey, iv } = encryptModel(modelFile, publicKeyBase64);

        const modelHash = await generateModelHash(modelFile); // Add await here

        const signedHash = signModelHash(modelHash);
        console.log(signedHash);
        res.status(200).json({
            message: "Model encrypted and signed successfully",
            encryptedModel: encryptedModel.toString("base64"),
            encryptedAesKey: encryptedAesKey.toString("base64"),
            iv: iv.toString("base64"), 
            signedHash: signedHash,  
        });
  } catch (error) {
    console.error("Error fetching and decrypting models:", error);
    res.status(500).json({ error: "Failed to fetch and decrypt models." });
  }
};
