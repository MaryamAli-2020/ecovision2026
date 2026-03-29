import PDFDocument from "pdfkit";
import type { ReportRequest } from "@ecovision/shared";

const formatValue = (value: number | null | undefined, digits = 1): string =>
  value === null || value === undefined ? "N/A" : value.toFixed(digits);

export const createPdfReport = async (payload: ReportRequest): Promise<Buffer> => {
  const city = payload.snapshot.cities.find((entry) => entry.id === payload.selectedCityId) ?? payload.snapshot.cities[0];
  const latest = city.timeSeries[city.timeSeries.length - 1];
  const doc = new PDFDocument({ margin: 48 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const completed = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(24).fillColor("#0f172a").text("EcoVision UAE 2026");
  doc.moveDown(0.25);
  doc.fontSize(13).fillColor("#334155").text("Multimodal AI & Generative Visual Analytics for Autonomous Climate Resilience");
  doc.moveDown();
  doc.fontSize(18).fillColor("#111827").text(`Climate Brief - ${city.city}`);
  doc.fontSize(11).fillColor("#475569").text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(13).fillColor("#0f172a").text("Dashboard Indicators", { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor("#1f2937");
  doc.text(`Risk level: ${city.riskLevel}`);
  doc.text(`SPI: ${formatValue(latest.spi)}`);
  doc.text(`NDVI: ${formatValue(latest.ndvi, 2)}`);
  doc.text(`Land surface temperature: ${formatValue(latest.lst)} °C`);
  doc.text(`Forecast value: ${formatValue(latest.forecast)}`);
  doc.text(`Forecast accuracy: ${formatValue(latest.forecastAccuracy, 0)}%`);
  doc.moveDown();

  doc.fontSize(13).fillColor("#0f172a").text("Summary", { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor("#1f2937").text(city.summaryText);
  doc.moveDown();

  doc.fontSize(13).fillColor("#0f172a").text("Recommended Action", { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor("#1f2937").text(city.policyNote);
  doc.moveDown();

  doc.fontSize(13).fillColor("#0f172a").text("Assistant Analysis", { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor("#1f2937").text(payload.assistantMessage);
  doc.moveDown();

  if (payload.question) {
    doc.fontSize(13).fillColor("#0f172a").text("User Prompt", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).fillColor("#1f2937").text(payload.question);
  }

  doc.end();
  return completed;
};
