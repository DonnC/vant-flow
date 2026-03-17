import { VantSchemaBuilder } from "./schema-builder.js";

const builder = new VantSchemaBuilder();

const prompt = "Loan Application with Principal amount, Interest rate:Float, and Date born:Date.";
console.log(`Original Prompt: "${prompt}"`);

const schema = builder.buildFromPrompt(prompt);
console.log("\n--- Generated Schema (Names/Types) ---");
const sections = schema.sections || (schema.steps ? schema.steps.flatMap(s => s.sections) : []);
sections.forEach(sec => {
    sec.columns.forEach(col => {
        col.fields.forEach(f => {
            console.log(` - ${f.label}: ${f.fieldtype}`);
        });
    });
});

const summary = builder.generateSummary(schema);
console.log("\n--- Generated natural language description ---");
console.log(summary);
