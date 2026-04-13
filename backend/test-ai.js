const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function check() {
  try {
    // Try Explicit v1 API
    console.log("Checking gemini-1.5-flash with v1 API...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
    const result = await model.generateContent("Hi");
    console.log("SUCCESS with v1 API!");
  } catch (e) {
    console.log("FAILED v1 API:", e.message);
  }
}

check();
