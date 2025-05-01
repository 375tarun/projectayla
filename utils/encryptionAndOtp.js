import crypto from "crypto";

export const generateOTP = () => {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return "" + otp;
};

export const encryptRefreshToken = (token) => {
    const secretKey = process.env.ENCRYPTION_SECRET_KEY;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(secretKey), iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    return `${iv.toString("hex")}:${encrypted}`;
};

export const decryptRefreshToken = (encryptedToken) => {
    const [ivHex, encrypted] = encryptedToken.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const secretKey = process.env.ENCRYPTION_SECRET_KEY;
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(secretKey),
        iv
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};