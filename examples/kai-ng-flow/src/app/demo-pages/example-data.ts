import { DocumentDefinition } from 'vant-flow';

export const EXAMPLE_DOCUMENT: DocumentDefinition = {
    "name": "Quality Inspection Report",
    "module": "Quality Management",
    "version": "1.2.0",
    "description": "Comprehensive quality control report for manufacturing batches. Tracks inspections, defect logs, and clearance status.",
    "intro_text": "<b>Quality Assurance Protocol:</b> Ensure all batches are inspected against the <i>ISO-9001</i> standard. Document any deviations in the Defect Log section.",
    "intro_color": "blue",
    "sections": [
        {
            "id": "sec_gen",
            "label": "General Information",
            "columns_count": 2,
            "columns": [
                {
                    "id": "c1",
                    "fields": [
                        {
                            "id": "f_inspector",
                            "fieldname": "inspector_name",
                            "fieldtype": "Data",
                            "label": "Lead Inspector",
                            "mandatory": true,
                            "placeholder": "Enter full name"
                        },
                        {
                            "id": "f_batch",
                            "fieldname": "batch_id",
                            "fieldtype": "Data",
                            "label": "Batch ID",
                            "mandatory": true,
                            "regex": "^QC-[A-Z]{2}-[0-9]{4}$",
                            "description": "Format: QC-XX-0000"
                        }
                    ]
                },
                {
                    "id": "c2",
                    "fields": [
                        {
                            "id": "f_date",
                            "fieldname": "inspection_date",
                            "fieldtype": "Date",
                            "label": "Inspection Date"
                        },
                        {
                            "id": "f_shift",
                            "fieldname": "shift",
                            "fieldtype": "Select",
                            "label": "Work Shift",
                            "options": "Morning\nAfternoon\nNight",
                            "default": "Morning"
                        }
                    ]
                }
            ]
        },
        {
            "id": "sec_params",
            "label": "Inspection Parameters",
            "columns_count": 2,
            "columns": [
                {
                    "id": "c31",
                    "fields": [
                        {
                            "id": "f_visual",
                            "fieldname": "visual_check",
                            "fieldtype": "Check",
                            "label": "Visual Inspection Passed",
                            "default": true
                        },
                        {
                            "id": "f_dimen",
                            "fieldname": "dimensions_check",
                            "fieldtype": "Check",
                            "label": "Dimensional Accuracy Verified",
                            "default": true
                        }
                    ]
                },
                {
                    "id": "c32",
                    "fields": [
                        {
                            "id": "f_score",
                            "fieldname": "quality_score",
                            "fieldtype": "Int",
                            "label": "Overall Quality Score (0-100)",
                            "default": 100,
                            "description": "Calculated based on detected issues."
                        }
                    ]
                }
            ]
        },
        {
            "id": "sec_defects",
            "label": "Defect Log",
            "columns_count": 1,
            "columns": [
                {
                    "id": "c41",
                    "fields": [
                        {
                            "id": "f_defect_table",
                            "fieldname": "defect_log",
                            "fieldtype": "Table",
                            "label": "Detected Defects",
                            "table_fields": [
                                {
                                    "id": "tc1",
                                    "fieldname": "defect_type",
                                    "label": "Type",
                                    "fieldtype": "Select",
                                    "options": "Surface Scratch\nColor Mismatch\nStructural Crack\nFunctional Failure",
                                    "mandatory": true
                                },
                                {
                                    "id": "tc2",
                                    "fieldname": "severity",
                                    "label": "Severity",
                                    "fieldtype": "Select",
                                    "options": "Low\nMedium\nHigh\nCritical",
                                    "default": "Low"
                                },
                                {
                                    "id": "tc3",
                                    "fieldname": "resolved",
                                    "label": "Auto-Fix Attempted",
                                    "fieldtype": "Check"
                                },
                                {
                                    "id": "id_6_9mh5t",
                                    "fieldname": "detected_at",
                                    "label": "Detected At",
                                    "fieldtype": "Date",
                                    "mandatory": true
                                },
                                {
                                    "id": "id_7_cjhht",
                                    "fieldname": "auto_fix_result",
                                    "label": "Auto-fix Result",
                                    "fieldtype": "Text"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": "sec_clearance",
            "label": "Security Clearance",
            "depends_on": "doc.quality_score < 80",
            "columns_count": 1,
            "columns": [
                {
                    "id": "c51",
                    "fields": [
                        {
                            "id": "id_5_ivn34",
                            "fieldname": "clearance_request",
                            "fieldtype": "Text Editor",
                            "label": "Clearance Request",
                            "hidden": false,
                            "read_only": false,
                            "mandatory": true,
                            "options": "<p>Provide reason for clearance...</p>"
                        },
                        {
                            "id": "f_clearance",
                            "fieldname": "btn_request_clearance",
                            "fieldtype": "Button",
                            "label": "Request Override Clearance",
                            "options": "danger"
                        }
                    ]
                }
            ]
        }
    ],
    "actions": {
        "save": { "label": "Save Progress", "visible": true, "type": "secondary" },
        "submit": { "label": "Approve Batch", "visible": true, "type": "primary" }
    },
    "client_script": `frm.on('refresh', (val, frm) => {
    frm.msgprint('Quality Inspection System initialized.', 'info');
});

frm.on('quality_score', (val, frm) => {
    if (val < 50) {
        frm.set_intro('CRITICAL QUALITY LEVEL: Batch rejection recommended.', 'red');
    } else if (val < 80) {
        frm.set_intro('CAUTION: Manual clearance required for score < 80.', 'orange');
    } else {
        frm.set_intro(null);
    }
});

frm.on('btn_request_clearance', (val, frm) => {
    frm.prompt([
        { label: 'Supervisor Name', fieldname: 'supervisor', fieldtype: 'Data', mandatory: 1 },
        { label: 'Clearance Code', fieldname: 'code', fieldtype: 'Password', mandatory: 1 }
    ], (res) => {
        frm.msgprint('Clearance requested by ' + res.supervisor);
        frm.set_intro('OVERRIDE APPROVED: Batch marked for conditional release.', 'green');
    }, 'Manager Clearance');
});`
};
