/************************************************************************
* EDIT RECORD extension for jTable                                      *
*************************************************************************/
(function ($) {

	 //Reference to base object members
	 var base = {
	 	 _create: $.hik.jtable.prototype._create,
	 	 _addColumnsToHeaderRow: $.hik.jtable.prototype._addColumnsToHeaderRow,
	 	 _addCellsToRowUsingRecord: $.hik.jtable.prototype._addCellsToRowUsingRecord,
		 _formatModalWindow: $.hik.jtable.prototype._formatModalWindow
	 };

	 //extension members
	 $.extend(true, $.hik.jtable.prototype, {

	 	 /************************************************************************
		 * DEFAULT OPTIONS / EVENTS                                              *
		 *************************************************************************/
	 	 options: {

	 	 	 //Events
	 	 	 recordUpdated: function (event, data) { },
	 	 	 rowUpdated: function (event, data) { },

	 	 	 //Localization
	 	 	 messages: {
	 	 	 	 editRecord: 'Edit Record'
	 	 	 }
	 	 },

	 	 /************************************************************************
		 * PRIVATE FIELDS                                                        *
		 *************************************************************************/

	 	 _$editDiv: null, //Reference to the editing dialog div (jQuery object)
	 	 _$editingRow: null, //Reference to currently editing row (jQuery object)

	 	 /************************************************************************
		 * CONSTRUCTOR AND INITIALIZATION METHODS                                *
		 *************************************************************************/

	 	 /* Overrides base method to do editing-specific constructions.
		 *************************************************************************/
	 	 _create: function () {
	 	 	 base._create.apply(this, arguments);

	 	 	 if (!this.options.actions.updateAction) {
	 	 	 	 return;
	 	 	 }

	 	 	 this._createEditDialogDiv();
	 	 },

	 	 /* Creates and prepares edit dialog div
		 *************************************************************************/
	 	 _createEditDialogDiv: function () {
	 	 	 var self = this;

	 	 	 //Create a div for dialog and add to container element
	 	 	 self._$editDiv = $('<div></div>')
					 .appendTo(self._$mainContainer);

	 	 	 //Prepare dialog
	 	 	 self._$editDiv.addClass("modal fade");
	 	 	 self._$editDiv.css({
	 	 	 	 width: "auto"
	 	 	 });
	 	 	 self._$editDiv.append("<div class=\"modal-dialog modal-lg\">" +
									 "<div class=\"modal-content\">" +
									 "<div class=\"modal-header\">" +
									 "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>" +
									 "<h4>" + self.options.messages.editRecord + "</h4></div>" +
									 "<div class=\"modal-body\"></div>" +
									 "<div class=\"modal-footer\">" +
									 "<button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">" + self.options.messages.cancel + "</button>" +
									 "<button type=\"button\" id=\"EditDialogSaveButton\" class=\"btn btn-primary\">" + self.options.messages.save +
									 "</button></div></div></div>");
	 	 	 self._$editDiv.find("#EditDialogSaveButton").click(function (event) {
	 	 	 	 self._onSaveClickedOnEditForm();
	 	 	 });

	 	 	 self._formatModalWindow(self._$editDiv);

	 	 	 self._$editDiv.on("hidden.bs.modal", function (event) {
	 	 	 	 var $editForm = self._$editDiv.find("form:first");
	 	 	 	 var $saveButton = $("#EditDialogSaveButton");
	 	 	 	 self._trigger("formClosed", null, { form: $editForm, formType: "edit", row: self._$editingRow });
	 	 	 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
	 	 	 	 $editForm.remove();
	 	 	 });

	 	 	 self._$editDiv.on('keyup',function(evt) {
	 	 	 	 if (evt.keyCode == 27) {
	 	 	 	 	self._$editDiv.modal('hide');
	 	 	 	 }
	 	 	 });
	 	 },

	 	 /* Saves editing form to server.
		 *************************************************************************/
	 	 _onSaveClickedOnEditForm: function () {
	 	 	 var self = this;

	 	 	 //row maybe removed by another source, if so, do nothing
	 	 	 if (self._$editingRow.hasClass('jtable-row-removed')) {
	 	 	 	 self._$editDiv.modal("hide");
	 	 	 	 return;
	 	 	 }

	 	 	 var $saveButton = self._$editDiv.parent().find('#EditDialogSaveButton');
	 	 	 var $editForm = self._$editDiv.find('form');
	 	 	 if (self._trigger("formSubmitting", null, { form: $editForm, formType: 'edit', row: self._$editingRow }) != false) {
	 	 	 	 self._setEnabledOfDialogButton($saveButton, false, self.options.messages.saving);
	 	 	 	 self._saveEditForm($editForm, $saveButton);
	 	 	 }
	 	 },

	 	 /************************************************************************
		 * PUBLIC METHODS                                                        *
		 *************************************************************************/

	 	 /* Updates a record on the table (optionally on the server also)
		 *************************************************************************/
	 	 updateRecord: function (options) {
	 	 	 var self = this;
	 	 	 options = $.extend({
	 	 	 	 clientOnly: false,
	 	 	 	 animationsEnabled: self.options.animationsEnabled,
	 	 	 	 success: function () { },
	 	 	 	 error: function () { }
	 	 	 }, options);

	 	 	 if (!options.record) {
	 	 	 	 self._logWarn('options parameter in updateRecord method must contain a record property.');
	 	 	 	 return;
	 	 	 }

	 	 	 var key = self._getKeyValueOfRecord(options.record);
	 	 	 if (key == undefined || key == null) {
	 	 	 	 self._logWarn('options parameter in updateRecord method must contain a record that contains the key field property.');
	 	 	 	 return;
	 	 	 }

	 	 	 var $updatingRow = self.getRowByKey(key);
	 	 	 if ($updatingRow == null) {
	 	 	 	 self._logWarn('Can not found any row by key "' + key + '" on the table. Updating row must be visible on the table.');
	 	 	 	 return;
	 	 	 }

	 	 	 if (options.clientOnly) {
	 	 	 	 $.extend($updatingRow.data('record'), options.record);
	 	 	 	 self._updateRowTexts($updatingRow);
	 	 	 	 self._onRecordUpdated($updatingRow, null);
	 	 	 	 if (options.animationsEnabled) {
	 	 	 	 	 self._showUpdateAnimationForRow($updatingRow);
	 	 	 	 }

	 	 	 	 options.success();
	 	 	 	 return;
	 	 	 }

	 	 	 var completeEdit = function (data) {
	 	 	 	 if (data.Result != 'OK') {
	 	 	 	 	 self._showError(data.Message);
	 	 	 	 	 options.error(data);
	 	 	 	 	 return;
	 	 	 	 }

	 	 	 	 $.extend($updatingRow.data('record'), options.record);
	 	 	 	 self._updateRecordValuesFromServerResponse($updatingRow.data('record'), data);

	 	 	 	 self._updateRowTexts($updatingRow);
	 	 	 	 self._onRecordUpdated($updatingRow, data);
	 	 	 	 if (options.animationsEnabled) {
	 	 	 	 	 self._showUpdateAnimationForRow($updatingRow);
	 	 	 	 }

	 	 	 	 options.success(data);
	 	 	 };

	 	 	 //updateAction may be a function, check if it is
	 	 	 if (!options.url && $.isFunction(self.options.actions.updateAction)) {

	 	 	 	 //Execute the function
	 	 	 	 var funcResult = self.options.actions.updateAction($.param(options.record));

	 	 	 	 //Check if result is a jQuery Deferred object
	 	 	 	 if (self._isDeferredObject(funcResult)) {
	 	 	 	 	 //Wait promise
	 	 	 	 	 funcResult.done(function (data) {
	 	 	 	 	 	 completeEdit(data);
	 	 	 	 	 }).fail(function () {
	 	 	 	 	 	 self._showError(self.options.messages.serverCommunicationError);
	 	 	 	 	 	 options.error();
	 	 	 	 	 });
	 	 	 	 } else { //assume it returned the creation result
	 	 	 	 	 completeEdit(funcResult);
	 	 	 	 }

	 	 	 } else { //Assume it's a URL string

	 	 	 	 //Make an Ajax call to create record
	 	 	 	 self._submitFormUsingAjax(
						 options.url || self.options.actions.updateAction,
						 $.param(options.record),
						 function (data) {
						 	 completeEdit(data);
						 },
						 function () {
						 	 self._showError(self.options.messages.serverCommunicationError);
						 	 options.error();
						 });

	 	 	 }
	 	 },

	 	 /************************************************************************
		 * OVERRIDED METHODS                                                     *
		 *************************************************************************/

	 	 /* Overrides base method to add a 'editing column cell' to header row.
		 *************************************************************************/
	 	 _addColumnsToHeaderRow: function ($tr) {
	 	 	 base._addColumnsToHeaderRow.apply(this, arguments);
	 	 	 if (this.options.actions.updateAction != undefined) {
	 	 	 	 $tr.append(this._createEmptyCommandHeader());
	 	 	 }
	 	 },

	 	 /* Overrides base method to add a 'edit command cell' to a row.
		 *************************************************************************/
	 	 _addCellsToRowUsingRecord: function ($row) {
	 	 	 var self = this;
	 	 	 base._addCellsToRowUsingRecord.apply(this, arguments);

	 	 	 if (self.options.actions.updateAction != undefined) {
	 	 	 	 var $span = $('<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>');
	 	 	 	 var $button = $('<button type="button" title="' + self.options.messages.editRecord + '"></button>')
						 .addClass('btn btn-xs btn-info')
						 .append($span)
						 .click(function (e) {
						 	 e.preventDefault();
						 	 e.stopPropagation();
						 	 self._showEditForm($row);
						 });
	 	 	 	 $('<td />')
						 .append($button)
						 .appendTo($row);
	 	 	 }
	 	 },

	 	 /************************************************************************
		 * PRIVATE METHODS                                                       *
		 *************************************************************************/

	 	 /* Shows edit form for a row.
		 *************************************************************************/
	 	 _showEditForm: function ($tableRow) {
	 	 	 var self = this;
	 	 	 var record = $tableRow.data('record');

	 	 	 //Create edit form
	 	 	 var $editForm = $("<form></form>"),
							 $rowRecordsContainers;

	 	 	 $rowRecordsContainers = $("<div class=\"row\" ></div>").appendTo($editForm);

	 	 	 //Create input fields
	 	 	 for (var i = 0; i < self._fieldList.length; i++) {

	 	 	 	 var fieldName = self._fieldList[i];
	 	 	 	 var field = self.options.fields[fieldName];
	 	 	 	 var fieldValue = record[fieldName];

	 	 	 	 if (field.key == true) {
	 	 	 	 	 if (field.edit != true) {
	 	 	 	 	 	 //Create hidden field for key
	 	 	 	 	 	 $editForm.append(self._createInputForHidden(fieldName, fieldValue));
	 	 	 	 	 	 continue;
	 	 	 	 	 } else {
	 	 	 	 	 	 //Create a special hidden field for key (since key is be editable)
	 	 	 	 	 	 $editForm.append(self._createInputForHidden('jtRecordKey', fieldValue));
	 	 	 	 	 }
	 	 	 	 }

	 	 	 	 //Do not create element for non-editable fields
	 	 	 	 if (field.edit == false) {
	 	 	 	 	 continue;
	 	 	 	 }

	 	 	 	 //Hidden field
	 	 	 	 if (field.type == 'hidden') {
	 	 	 	 	 $editForm.append(self._createInputForHidden(fieldName, fieldValue));
	 	 	 	 	 continue;
	 	 	 	 }

	 	 	 	 if (field.divClass === undefined) {
	 	 	 	 	 field.divClass = "col-md-12";
	 	 	 	 }

	 	 	 	 //Create a container div for this input field and add to form
	 	 	 	 var $fieldContainer = $("<div />").addClass("form-group")
                    .addClass(field.divClass)
                    .appendTo($rowRecordsContainers);

	 	 	 	 //Create a label for input 
	 	 	 	 $fieldContainer.append(self._createInputLabelForRecordField(fieldName));
	 	 	 	 $fieldContainer.append(field.nextItem);

	 	 	 	 //Create input element with it's current value
	 	 	 	 var currentValue = self._getValueForRecordField(record, fieldName);
	 	 	 	 $fieldContainer.append(
						 self._createInputForRecordField({
						 	 fieldName: fieldName,
						 	 value: currentValue,
						 	 record: record,
						 	 formType: 'edit',
						 	 form: $editForm
						 }));
	 	 	 }

	 	 	 self._makeCascadeDropDowns($editForm, record, 'edit');

	 	 	 $editForm.submit(function () {
	 	 	 	 self._onSaveClickedOnEditForm();
	 	 	 	 return false;
	 	 	 });

	 	 	 //Open dialog
	 	 	 self._$editingRow = $tableRow;
	 	 	 self._$editDiv.find(".modal-body").html($editForm);
	 	 	 self._$editDiv.modal("show");
	 	 	 self._trigger("formCreated", null, { form: $editForm, formType: 'edit', record: record, row: $tableRow });
	 	 },

	 	 /* Saves editing form to the server and updates the record on the table.
		 *************************************************************************/
	 	 _saveEditForm: function ($editForm, $saveButton) {
	 	 	 var self = this;

	 	 	 var completeEdit = function (data) {
	 	 	 	 if (data.Result != 'OK') {
	 	 	 	 	 self._showError(data.Message);
	 	 	 	 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
	 	 	 	 	 return;
	 	 	 	 }

	 	 	 	 var record = self._$editingRow.data('record');

	 	 	 	 self._updateRecordValuesFromForm(record, $editForm);
	 	 	 	 self._updateRecordValuesFromServerResponse(record, data);
	 	 	 	 self._updateRowTexts(self._$editingRow);

	 	 	 	 self._$editingRow.attr('data-record-key', self._getKeyValueOfRecord(record));

	 	 	 	 self._onRecordUpdated(self._$editingRow, data);

	 	 	 	 if (self.options.animationsEnabled) {
	 	 	 	 	 self._showUpdateAnimationForRow(self._$editingRow);
	 	 	 	 }

	 	 	 	 self._$editDiv.modal("hide");
	 	 	 };


	 	 	 //updateAction may be a function, check if it is
	 	 	 if ($.isFunction(self.options.actions.updateAction)) {

	 	 	 	 //Execute the function
	 	 	 	 var funcResult = self.options.actions.updateAction($editForm.serialize());

	 	 	 	 //Check if result is a jQuery Deferred object
	 	 	 	 if (self._isDeferredObject(funcResult)) {
	 	 	 	 	 //Wait promise
	 	 	 	 	 funcResult.done(function (data) {
	 	 	 	 	 	 completeEdit(data);
	 	 	 	 	 }).fail(function () {
	 	 	 	 	 	 self._showError(self.options.messages.serverCommunicationError);
	 	 	 	 	 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
	 	 	 	 	 });
	 	 	 	 } else { //assume it returned the creation result
	 	 	 	 	 completeEdit(funcResult);
	 	 	 	 }

	 	 	 } else { //Assume it's a URL string

	 	 	 	 //Make an Ajax call to update record
	 	 	 	 self._submitFormUsingAjax(
						 self.options.actions.updateAction,
						 $editForm.serialize(),
						 function (data) {
						 	 completeEdit(data);
						 },
						 function () {
						 	 self._showError(self.options.messages.serverCommunicationError);
						 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
						 });
	 	 	 }

	 	 },

	 	 /* This method ensures updating of current record with server response,
		 * if server sends a Record object as response to updateAction.
		 *************************************************************************/
	 	 _updateRecordValuesFromServerResponse: function (record, serverResponse) {
	 	 	 if (!serverResponse || !serverResponse.Record) {
	 	 	 	 return;
	 	 	 }

	 	 	 $.extend(true, record, serverResponse.Record);
	 	 },

	 	 /* Gets text for a field of a record according to it's type.
		 *************************************************************************/
	 	 _getValueForRecordField: function (record, fieldName) {
	 	 	 var field = this.options.fields[fieldName];
	 	 	 var fieldValue = record[fieldName];
	 	 	 if (field.type == 'date') {
	 	 	 	 return this._getDisplayTextForDateRecordField(field, fieldValue);
	 	 	 } else {
	 	 	 	 return fieldValue;
	 	 	 }
	 	 },

	 	 /* Updates cells of a table row's text values from row's record values.
		 *************************************************************************/
	 	 _updateRowTexts: function ($tableRow) {
	 	 	 var record = $tableRow.data('record');
	 	 	 var $columns = $tableRow.find('td');
	 	 	 for (var i = 0; i < this._columnList.length; i++) {
	 	 	 	 var displayItem = this._getDisplayTextForRecordField(record, this._columnList[i]);
	 	 	 	 if ((displayItem === 0)) displayItem = "0";
	 	 	 	 $columns.eq(this._firstDataColumnOffset + i).html(displayItem || '');
	 	 	 }

	 	 	 this._onRowUpdated($tableRow);
	 	 },

	 	 /* Shows 'updated' animation for a table row.
		 *************************************************************************/
	 	 _showUpdateAnimationForRow: function ($tableRow) {
	 	 	 var className = 'jtable-row-updated';
	 	 	 if (this.options.jqueryuiTheme) {
	 	 	 	 className = className + ' ui-state-highlight';
	 	 	 }

	 	 	 $tableRow.stop(true, true).addClass(className, 'slow', '', function () {
	 	 	 	 $tableRow.removeClass(className, 5000);
	 	 	 });
	 	 },

	 	 /************************************************************************
		 * EVENT RAISING METHODS                                                 *
		 *************************************************************************/

	 	 _onRowUpdated: function ($row) {
	 	 	 this._trigger("rowUpdated", null, { row: $row, record: $row.data('record') });
	 	 },

	 	 _onRecordUpdated: function ($row, data) {
	 	 	 this._trigger("recordUpdated", null, { record: $row.data('record'), row: $row, serverResponse: data });
	 	 }

	 });

})(jQuery);