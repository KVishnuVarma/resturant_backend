const express = require("express");
const axios = require("axios");
require("dotenv").config();  // This loads your .env variables

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
      {
        inputs: `<s>[INST] ${message} [/INST]`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
      }
    );

    const botReply = response.data?.[0]?.generated_text
      ?.replace(`<s>[INST] ${message} [/INST]`, "")
      .trim() || "Sorry, I didn't understand that.";

    res.json({ reply: botReply });

  } catch (error) {
    console.error("Chatbot Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Chatbot service failed." });
  }
});

module.exports = router;
