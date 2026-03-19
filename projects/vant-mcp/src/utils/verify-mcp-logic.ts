import { VantSchemaBuilder } from "./schema-builder.js";

const builder = new VantSchemaBuilder();

const runTest = (prompt: string) => {
    console.log(`\n--- PROMPT: "${prompt}" ---`);
    try {
        const schema = builder.buildFromPrompt(prompt);
        console.log(`Title: ${schema.name}`);
        console.log(`Is Stepper: ${schema.is_stepper}`);
        if (schema.steps) {
            console.log(`Steps: ${schema.steps.length}`);
            schema.steps.forEach((s: any) => {
                console.log(` - Step: ${s.title} (${s.sections.length} sections)`);
                s.sections.forEach((sec: any) => {
                    console.log(`   - Section: ${sec.label} (${sec.columns[0].fields.length} fields)`);
                    sec.columns[0].fields.forEach((f: any) => console.log(`     - Field: ${f.label} (${f.fieldtype})`));
                });
            });
        } else {
            console.log(`Sections: ${schema.sections.length}`);
            schema.sections.forEach((sec: any) => {
                console.log(` - Section: ${sec.label} (${sec.columns[0].fields.length} fields)`);
                sec.columns[0].fields.forEach((f: any) => console.log(`     - Field: ${f.label} (${f.fieldtype})`));
            });
        }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    }
};

const tests = [
    "Forex purchase request with Currency selector, Amount, and specific Bank selection.",
    "3-step Employee Onboarding with Personal info, then Bank details, and finally Documents upload.",
    "Bug report with Title, Component dropdown, and Screenshot upload.",
    "Subscription form with Email, Password, and Plan choice."
];

tests.forEach(runTest);
