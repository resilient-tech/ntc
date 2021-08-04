import frappe

from frappe.model.document import Document


@frappe.whitelist()
def update_status_for_edit(doctype, docname, user, reason):
    doc = frappe.get_doc(doctype, docname)

    for ptype in ("cancel", "amend"):
        frappe.has_permission(doctype, ptype, doc, throw=True)

    values = {
        "docstatus": 0,
    }

    for d in doc.get_all_children():
        d.db_set(values)

    status_field = doc.meta.get_field("status")
    if status_field and "Draft" in status_field.options.split("\n"):
        values["status"] = "Draft"

    doc.db_set(values)

    comment = frappe.new_doc("Comment")
    comment.flags.ignore_permissions = 1
    comment.reference_doctype = doctype
    comment.update(
        {
            "comment_type": "Edit",
            "doc.comment_email": user,
            "reference_name": docname,
            "content": 'edited this document. Reason for edit: <b><span style="color: #da6666">'
            + reason
            + "</span></b>",
        }
    )
    comment.insert()
