
import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();

const PORT = Number(process.env.PORT || 5000);
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "5mb" }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Fields Gemini must extract from the PDF.
const propertySchema = {
  type: "object",
  properties: {
    documentType: { type: "string" },
    propertyId: { type: "string" },
    ownerName: { type: "string" },
    propertyAddress: { type: "string" },
    surveyNumber: { type: "string" },
    plotNumber: { type: "string" },
    village: { type: "string" },
    taluka: { type: "string" },
    district: { type: "string" },
    state: { type: "string" },
    registrationNumber: { type: "string" },
    registrationDate: { type: "string" },
    landArea: { type: "string" },
    notes: { type: "string" },
  },
  required: [
    "documentType",
    "propertyId",
    "ownerName",
    "propertyAddress",
    "surveyNumber",
    "plotNumber",
    "village",
    "taluka",
    "district",
    "state",
    "registrationNumber",
    "registrationDate",
    "landArea",
    "notes",
  ],
};

// Health check.
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(ai),
    model: MODEL,
  });
});

// Normalize text for basic mismatch comparison.
function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Compare submitted form values with extracted fields.
// These are warnings, not proof of fraud or invalid ownership.
function findMismatches(submitted = {}, extracted = {}) {
  const mismatches = [];

  const checks = [
    {
      key: "propertyId",
      label: "Property ID",
      extractedKeys: [
        "propertyId",
        "surveyNumber",
        "plotNumber",
      ],
    },
    {
      key: "ownerName",
      label: "Owner name",
      extractedKeys: ["ownerName"],
    },
    {
      key: "address",
      label: "Property address",
      extractedKeys: [
        "propertyAddress",
        "village",
        "taluka",
        "district",
        "state",
      ],
    },
  ];

  for (const check of checks) {
    const submittedValue = String(submitted[check.key] ?? "").trim();

    if (!submittedValue) continue;

    const extractedValues = check.extractedKeys
      .map((key) => extracted[key])
      .filter((value) => value != null && String(value).trim() !== "")
      .map(String);

    if (extractedValues.length === 0) continue;

    const submittedNormalized = normalize(submittedValue);
    const extractedNormalized = normalize(extractedValues.join(" "));

    if (
      submittedNormalized &&
      extractedNormalized &&
      !extractedNormalized.includes(submittedNormalized) &&
      !submittedNormalized.includes(extractedNormalized)
    ) {
      mismatches.push({
        field: check.label,
        submitted: submittedValue,
        extracted: extractedValues.join(", "),
        reason:
          "The submitted value may differ from the extracted text. Manual review is required.",
      });
    }
  }

  return mismatches;
}

// Extract structured data from an uploaded property PDF.
app.post("/api/extract", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error:
          "Gemini API is not configured. Check GEMINI_API_KEY in backend/.env and restart the backend.",
      });
    }

    const { fileData, submitted } = req.body || {};

    const prefix = "data:application/pdf;base64,";

    if (
      typeof fileData !== "string" ||
      !fileData.startsWith(prefix)
    ) {
      return res.status(400).json({
        error: "Upload a valid PDF file.",
      });
    }

    const base64 = fileData.slice(prefix.length);

    // Reject empty or oversized files.
    if (!base64 || !Buffer.from(base64, "base64").length) {
      return res.status(400).json({
        error: "The uploaded PDF is empty or invalid.",
      });
    }

    const pdfBuffer = Buffer.from(base64, "base64");

    if (pdfBuffer.length > 2 * 1024 * 1024) {
      return res.status(413).json({
        error: "PDF must be 2 MB or smaller for this prototype.",
      });
    }

    // Basic PDF signature check.
    if (pdfBuffer.subarray(0, 5).toString() !== "%PDF-") {
      return res.status(400).json({
        error: "The uploaded file does not appear to be a valid PDF.",
      });
    }

    const prompt = `
You extract information from property documents for human review.

Extract the fields specified in the required JSON schema.
Use an empty string for any field not clearly found in the PDF.
Preserve names, numbers, dates, and addresses as written in the document.
Do not guess missing values.
Do not treat form values as evidence about what the PDF contains.
Do not claim the document is genuine, legally valid, government verified,
or proof of ownership.

Form values for later comparison:
${JSON.stringify({
  propertyId: submitted?.propertyId || "",
  ownerName: submitted?.ownerName || "",
  address: submitted?.address || "",
  documentType: submitted?.documentType || "",
})}
`;

    console.log(`Starting Gemini extraction using ${MODEL}`);

    const result = await ai.interactions.create({
      model: MODEL,
      store: false,
      input: [
        {
          type: "text",
          text: prompt,
        },
        {
          type: "document",
          data: base64,
          mime_type: "application/pdf",
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: propertySchema,
      },
    });

    const rawText = result.output_text;

    if (!rawText) {
      console.error(
        "Gemini returned no text. Status:",
        result.status
      );
      console.error(
        "Gemini steps:",
        JSON.stringify(result.steps ?? [])
      );

      return res.status(502).json({
        error:
          "Gemini returned no text. Check the backend terminal for details.",
      });
    }

    let extractedData;

    try {
      extractedData = JSON.parse(rawText);
    } catch (parseError) {
      console.error("Gemini JSON parsing failed:", parseError.message);
      console.error("Gemini response:", rawText.slice(0, 1000));

      return res.status(502).json({
        error:
          "Gemini returned invalid JSON. Check the backend terminal.",
      });
    }

    if (
      !extractedData ||
      typeof extractedData !== "object" ||
      Array.isArray(extractedData)
    ) {
      return res.status(502).json({
        error: "Gemini returned an unexpected data format.",
      });
    }

    const mismatches = findMismatches(
      submitted || {},
      extractedData
    );

    console.log("Gemini extraction completed successfully.");

    return res.json({
      extractedData,
      mismatches,
      extractionStatus: "completed",
      verificationStatus: "pending",
      notice:
        "AI extraction is advisory only. It does not verify ownership or connect to government records.",
    });
  } catch (error) {
    // Keep detailed provider errors in the backend terminal.
    console.error(
      "Gemini extraction error:",
      error?.message || error
    );

    if (error?.status) {
      console.error("Provider status:", error.status);
    }

    return res.status(500).json({
      error:
        "Gemini extraction failed. Check the backend terminal for the exact API error.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`OWNITY Gemini API listening on http://localhost:${PORT}`);
  console.log(`Gemini model: ${MODEL}`);
  console.log(`Gemini configured: ${Boolean(ai)}`);
});
