# 🇿🇼 Vant Flow: Strategic Use Cases for Zimbabwean Holdings & Subsidiaries

This document outlines how **Vant Flow** can be leveraged across a diversified Zimbabwean Holdings Company to digitize paper-intensive processes, enforce hierarchical governance, and ensure regulatory agility.

---

## 🏢 1. Group-Wide Infrastructure (Shared Services)

These processes apply to the Holding company and all subsidiaries to ensure a unified standard of governance.

### A. Hierarchical Approvals (Fuel, Expenses, Contracts)
- **The Process**: Requests for fuel coupons, petty cash, or contract sign-offs that require multi-level approval (e.g., Manager -> Head of Dept -> Finance).
- **Vant Flow Fit**:
    - **Hidden/ReadOnly Logic**: Fields like "Finance Approval Code" are hidden from the requester but shown to the Finance user using `frm.set_df_property`.
    - **Digital Signatures**: The **Signature** field provides a "Paperless" sign-off at every level.
    - **Audit Trail**: Every revision to the "Approval" metadata is preserved.

### B. Procurement & Supplier Invoicing
- **The Process**: Suppliers submitting invoices for payment.
- **Vant Flow Fit**:
    - **Attach Field**: Suppliers upload PDFs of tax clearances and invoices.
    - **Tables**: Use a table for "Line Items" where the **Client Script** automatically calculates the Total (including VAT/IMTT) in real-time.
    - **Validation**: `regex` fields ensure the "Tax Invoice Number" follows ZIMRA formats.

### C. SnT (Subsistence & Travel) Forms
- **The Process**: Employees requesting funds for travel, per diems, and mileage.
- **Vant Flow Fit**:
    - **Tables**: Log daily mileage or meal costs.
    - **Scripts**: Automatically calculate mileage rates based on current fuel price metadata.
    - **Attach**: Snap photos of fuel receipts or tollgate tickets.

---

## 🏦 2. Banking & Microfinance Subsidiary

### A. Digital Account Opening & KYC
- **Process**: Transitioning from massive physical forms to a digital-first experience.
- **Vant Flow Fit**:
    - **Stepper Flow**: Step 1: Personal (National ID, Title). Step 2: Addresses (Proof of Residence attach). Step 3: Source of Wealth.
    - **Dynamic Dependency**: If "Source of Wealth" is "Employment," show the "Employer Name" and "Payslip Attach" fields.

### B. Microfinance Loan Applications
- **Process**: Field agents visiting markets or small-scale farmers to register loan applications.
- **Vant Flow Fit**:
    - **Enhanced Tables**: Capture "Current Assets" (e.g., livestock, equipment) with specialized previews.
    - **Performant Rendering**: Vant Flow's lightweight JSON ensures the form loads quickly on mobile tablets in areas with limited 3G/4G connectivity.

### C. Branch-Level Sign-offs & Registers
- **Process**: Daily vault opening registers, security sign-offs, and petty cash logs.
- **Vant Flow Fit**:
    - **Signature Pad**: High-density signing for "Dual Control" (two officers sign same form).
    - **Select Fields**: Standardized branch lists and officer roles.

---

## 🏗️ 3. Land & Development Unit

### A. Asset Management & Site Inspections
- **Process**: Inspecting construction progress or managing land parcels.
- **Vant Flow Fit**:
    - **Attach (Multi-file)**: Upload progress photos of buildings or land survey diagrams.
    - **Text Editor**: Detailed "Site Inspection Reports" with rich formatting for emphasis on risks or defects.

### B. Sales & Lease Agreements
- **Process**: Prospective buyers signing up for stand purchases (Residential/Commercial).
- **Vant Flow Fit**:
    - **Signature**: Legally binding digital signatures for initial "Offer Letters."
    - **Stepper**: Walk the buyer through the complex process of Terms & Conditions, Payment Plans, and Documentation.

---

## 📄 4. Insurance & Leasing Subsidiaries

### A. Insurance Claims Management
- **Process**: Clients reporting motor accidents or crop damage.
- **Vant Flow Fit**:
    - **Attach Field**: Uploading police report scans and accident photos.
    - **Tables**: Listing "Damaged Parts" with estimated repair costs.
    - **Client Scripts**: Automatically fetch "Policy Details" based on a `Policy_Number` Link field to validate coverage.

### B. Leasing Agreement Approvals
- **Process**: Vehicle or equipment leasing for corporate clients.
- **Vant Flow Fit**:
    - **Conditional Visibility**: Show "Guarantor Details" only if the "Risk Assessment" score (calculated via script) is below a certain threshold.
    - **Wait/Processing**: Use `frm.set_intro` to notify the user if their leasing application is "Pending Assessment."

---

## 📅 5. Corporate Governance (Meetings)

### A. Board & Committee Meeting Minutes
- **Process**: Standardized capturing of meeting agendas and minutes.
- **Vant Flow Fit**:
    - **Text Editor**: High-quality rich text for capturing "Matters Arising" and "Action Items."
    - **Tables**: List attendees with "Present/Apologies" status.
    - **Attach**: Link Board Packs or supporting PDFs directly to the meeting form.

---

## 🔄 6. Complex Workflow & State Management

In banking and governance, a form is rarely a "one-and-done" submission. It is a living document that moves through a lifecycle.

### A. The "Back-and-Forth" (Query & Revisions)
- **The Scenario**: An Expenditure Claim is submitted, but the Auditor finds an error. They "Query" it back to the Creator.
- **Vant Flow Fit**:
    - **Intro Banners**: Use `frm.set_intro("REJECTED: Please verify the VAT calculation on Row 3.", "red")` when the status is 'Challenged'.
    - **Dynamic Editability**: A script can ensure that when the file is with the Auditor, all fields are `read_only`, except for a "Comments" field. When sent back, the specific "Amount" fields become editable again.

### B. Group Approvals & Quorum (Committee Review)
- **The Scenario**: A large Corporate Loan requires 3 out of 5 Credit Committee members to sign off.
- **Vant Flow Fit**:
    - **Consensus Table**: A table where each member's vote and signature is captured.
    - **Scripted Gatekeeping**: The `submit` button remains hidden (`frm.set_df_property('submit', 'hidden', 1)`) until the script calculates that the "Approval Count" in the signatures table meets the required threshold.

### C. Hierarchical Handoffs (The "Digital File")
- **The Scenario**: A Land Development proposal starts with a Surveyor, moves to a Planner, then to an ESG (Environmental & Social Governance) Officer, and finally the Board.
- **Vant Flow Fit**:
    - **State-Based Sections**: Use one large form schema. The Surveyor sees Section 1. Once they sign and "Forward," Section 1 becomes `read_only` and Section 2 (Planning) becomes `hidden = false`.
    - **Context Awareness**: The `frm` can detect the current user's role and automatically prepare the UI for their specific task in the chain.

---

## 🧩 Summary of Advantages for the Holdings Group

1.  **Unified Frontend Stack**: One Vant Flow library can power the internal workflows for Banking, Insurance, and Construction, reducing developer "context switching."
2.  **Regulatory Speed**: When the group needs to add a "ZIMRA Compliance" field across all subsidiaries, it's a 5-minute update to the JSON schema, not a re-release of 5 different apps.
3.  **Low Friction**: Replaces thousands of actual sheets of paper with searchable, auditable digital data.
4.  **Security (The Enclave)**: The sandboxed scripts ensure that sensitive data from the Banking division isn't accidentally leaked into the Leasing division's scripts—even if they share the same infrastructure.
