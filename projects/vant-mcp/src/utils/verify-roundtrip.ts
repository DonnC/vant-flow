import type { DocumentColumn, DocumentDefinition, DocumentField, DocumentSection } from "vant-flow";
import { VantSchemaBuilder } from "./schema-builder.js";

const builder = new VantSchemaBuilder();

const prompt = "Loan Application with Principal amount, Interest rate:Float, and Date born:Date.";
console.log(`Original Prompt: "${prompt}"`);

const schema: DocumentDefinition = builder.buildFromPrompt(prompt);
console.log("\n--- Generated Schema (Names/Types) ---");
const sections: DocumentSection[] = schema.sections || (schema.steps ? schema.steps.flatMap((s: { sections: DocumentSection[] }) => s.sections) : []);
sections.forEach((sec: DocumentSection) => {
    sec.columns.forEach((col: DocumentColumn) => {
        col.fields.forEach((f: DocumentField) => {
            console.log(` - ${f.label}: ${f.fieldtype}`);
        });
    });
});

const summary = builder.generateSummary(schema);
console.log("\n--- Generated natural language description ---");
console.log(summary);
