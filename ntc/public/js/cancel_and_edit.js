modifyMethod('frappe.ui.form.Toolbar', 'refresh', function () {
	const frm = this.frm;

	if (!frm.meta.is_submittable) return;

	const allow_edit = frm.perm[0].amend && frm.perm[0].cancel;
	if (frm.doc.docstatus != 1 || !allow_edit || frm.page.current_view_name == 'print') return;

	frm.page.set_primary_action('Edit', function () {
		const d = new frappe.ui.Dialog({
			title: 'Reason for Edit',
			fields: [
				{
					label: 'Reason',
					fieldname: 'reason',
					fieldtype: 'Small Text',
					reqd: 1,
				}
			],
			primary_action_label: 'Edit',
			primary_action(values) {
				d.hide();
				frm.validate_form_action('Cancel');
				frappe.validated = true;
				frm.script_manager.trigger("before_cancel").then(function () {
					async function after_cancel(r) {
						if (r.exc) {
							frm.handle_save_fail(btn, on_error);
							return;
						}

						frm.refresh();
						await frm.script_manager.trigger("after_cancel");

						frappe.call({
							method: 'ntc.api.cancel_and_edit.update_status_for_edit',
							args: {
								doctype: frm.doctype,
								docname: frm.docname,
								user: frappe.user.name,
								reason: values.reason,
							},
							callback() {
								frm.reload_doc();
							}
						});
					};
					frappe.ui.form.save(frm, "cancel", after_cancel);
				});
			}
		});

		d.show();

	})
});