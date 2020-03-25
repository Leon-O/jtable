/************************************************************************
* CREATE RECORD extension for jTable                                    *
*************************************************************************/
(function ($) {

	 //Reference to base object members
	 var base = {
	 	 _create: $.hik.jtable.prototype._create,
	 	 _formatModalWindow: $.hik.jtable.prototype._formatModalWindow
	 };

	 //extension members
	 $.extend(true, $.hik.jtable.prototype, {

	 	 /************************************************************************
		 * DEFAULT OPTIONS / EVENTS                                              *
		 *************************************************************************/
	 	 options: {

	 	 	 //Events
	 	 	 recordAdded: function (event, data) { },

	 	 	 //Localization
	 	 	 messages: {
	 	 	 	 addNewRecord: 'Add new record'
	 	 	 }
	 	 },

	 	 /************************************************************************
		 * PRIVATE FIELDS                                                        *
		 *************************************************************************/

	 	 _$addRecordDiv: null, //Reference to the adding new record dialog div (jQuery object)

	 	 /************************************************************************
		 * CONSTRUCTOR                                                           *
		 *************************************************************************/

	 	 /* Overrides base method to do create-specific constructions.
		 *************************************************************************/
	 	 _create: function () {
	 	 	 base._create.apply(this, arguments);

	 	 	 if (!this.options.actions.createAction) {
	 	 	 	 return;
	 	 	 }

	 	 	 this._createAddRecordDialogDiv();
	 	 },

	 	 /* Creates and prepares add new record dialog div
		 *************************************************************************/
	 	 _createAddRecordDialogDiv: function () {
	 	 	 var self = this;

	 	 	 //Create a div for dialog and add to container element
	 	 	 self._$addRecordDiv = $("<div />")
					 .appendTo(self._$mainContainer);

	 	 	 //Prepare dialog
	 	 	 self._$addRecordDiv.addClass("modal fade");
	 	 	 self._$addRecordDiv.css({
	 	 	 	 width: "auto"
	 	 	 });

	 	 	 self._$addRecordDiv.append("<div class=\"modal-dialog modal-lg\">" +
									 "<div class=\"modal-content\">" +
									 "<div class=\"modal-header\">" +
									 "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>" +
									 "<h4>" + self.options.messages.addNewRecord + "</h4></div>" +
									 "<div class=\"modal-body\"></div>" +
									 "<div class=\"modal-footer\">" +
									 "<button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">" + self.options.messages.cancel + "</button>" +
									 "<button type=\"button\" id=\"AddRecordDialogSaveButton\" class=\"btn btn-primary\">" + self.options.messages.save +
									 "</button></div></div></div>");
	 	 	 self._$addRecordDiv.find("#AddRecordDialogSaveButton").click(function (event) {
	 	 	 	 self._onSaveClickedOnCreateForm();
	 	 	 });

	 	 	 self._formatModalWindow(self._$addRecordDiv);

	 	 	 self._$addRecordDiv.on("hidden.bs.modal", function (event) {
	 	 	 	 var $addRecordForm = self._$addRecordDiv.find("form").first();
	 	 	 	 var $saveButton = self._$addRecordDiv.find("#AddRecordDialogSaveButton").first();
	 	 	 	 self._trigger("formClosed", null, { form: $addRecordForm, formType: "create" });
	 	 	 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
	 	 	 	 $addRecordForm.remove();
	 	 	 });

	 	 	 self._$addRecordDiv.on('keyup',function(evt) {
	 	 	 	 if (evt.keyCode == 27) {
	 	 	 	 	self._$addRecordDiv.modal('hide');
	 	 	 	 }
	 	 	 });

	 	 	 if (self.options.addRecordButton) {
	 	 	 	 //If user supplied a button, bind the click event to show dialog form
	 	 	 	 self.options.addRecordButton.click(function (e) {
	 	 	 	 	 e.preventDefault();
	 	 	 	 	 self._showAddRecordForm();
	 	 	 	 });
	 	 	 } else {
	 	 	 	 //If user did not supplied a button, create a 'add record button' toolbar item.
	 	 	 	 self._addToolBarItem({
	 	 	 	 	 icon: "glyphicon-plus",
	 	 	 	 	 cssClass: 'btn-default',
	 	 	 	 	 text: self.options.messages.addNewRecord,
	 	 	 	 	 click: function () {
	 	 	 	 	 	 self._showAddRecordForm();
	 	 	 	 	 }
	 	 	 	 });
	 	 	 }
	 	 },

	 	 _onSaveClickedOnCreateForm: function () {
	 	 	 var self = this;

	 	 	 var $saveButton = self._$addRecordDiv.parent().find('#AddRecordDialogSaveButton');
	 	 	 var $addRecordForm = self._$addRecordDiv.find('form');

	 	 	 if (self._trigger("formSubmitting", null, { form: $addRecordForm, formType: 'create' }) != false) {
	 	 	 	 self._setEnabledOfDialogButton($saveButton, false, self.options.messages.saving);
	 	 	 	 self._saveAddRecordForm($addRecordForm, $saveButton);
	 	 	 }
	 	 },

	 	 /************************************************************************
		 * PUBLIC METHODS                                                        *
		 *************************************************************************/

	 	 /* Shows add new record dialog form.
		 *************************************************************************/
	 	 showCreateForm: function () {
	 	 	 this._showAddRecordForm();
	 	 },

	 	 /* Adds a new record to the table (optionally to the server also)
		 *************************************************************************/
	 	 addRecord: function (options) {
	 	 	 var self = this;
	 	 	 options = $.extend({
	 	 	 	 clientOnly: false,
	 	 	 	 animationsEnabled: self.options.animationsEnabled,
	 	 	 	 success: function () { },
	 	 	 	 error: function () { }
	 	 	 }, options);

	 	 	 if (!options.record) {
	 	 	 	 self._logWarn('options parameter in addRecord method must contain a record property.');
	 	 	 	 return;
	 	 	 }

	 	 	 if (options.clientOnly) {
	 	 	 	 self._addRow(
						 self._createRowFromRecord(options.record), {
						 	 isNewRow: true,
						 	 animationsEnabled: options.animationsEnabled
						 });

	 	 	 	 options.success();
	 	 	 	 return;
	 	 	 }

	 	 	 var completeAddRecord = function (data) {
	 	 	 	 if (data.Result != 'OK') {
	 	 	 	 	 self._showError(data.Message);
	 	 	 	 	 options.error(data);
	 	 	 	 	 return;
	 	 	 	 }

	 	 	 	 if (!data.Record) {
	 	 	 	 	 self._logError('Server must return the created Record object.');
	 	 	 	 	 options.error(data);
	 	 	 	 	 return;
	 	 	 	 }

	 	 	 	 self._onRecordAdded(data);
	 	 	 	 self._addRow(
						 self._createRowFromRecord(data.Record), {
						 	 isNewRow: true,
						 	 animationsEnabled: options.animationsEnabled
						 });

	 	 	 	 options.success(data);
	 	 	 };

	 	 	 //createAction may be a function, check if it is
	 	 	 if (!options.url && $.isFunction(self.options.actions.createAction)) {

	 	 	 	 //Execute the function
	 	 	 	 var funcResult = self.options.actions.createAction($.param(options.record));

	 	 	 	 //Check if result is a jQuery Deferred object
	 	 	 	 if (self._isDeferredObject(funcResult)) {
	 	 	 	 	 //Wait promise
	 	 	 	 	 funcResult.done(function (data) {
	 	 	 	 	 	 completeAddRecord(data);
	 	 	 	 	 }).fail(function () {
	 	 	 	 	 	 self._showError(self.options.messages.serverCommunicationError);
	 	 	 	 	 	 options.error();
	 	 	 	 	 });
	 	 	 	 } else { //assume it returned the creation result
	 	 	 	 	 completeAddRecord(funcResult);
	 	 	 	 }

	 	 	 } else { //Assume it's a URL string

	 	 	 	 //Make an Ajax call to create record
	 	 	 	 self._submitFormUsingAjax(
						 options.url || self.options.actions.createAction,
						 $.param(options.record),
						 function (data) {
						 	 completeAddRecord(data);
						 },
						 function () {
						 	 self._showError(self.options.messages.serverCommunicationError);
						 	 options.error();
						 });

	 	 	 }
	 	 },

	 	 /************************************************************************
		 * PRIVATE METHODS                                                       *
		 *************************************************************************/

	 	 /* Shows add new record dialog form.
		 *************************************************************************/
	 	 _showAddRecordForm: function () {
	 	 	 var self = this;

	 	 	 //Create add new record form
	 	 	 var $addRecordForm = $("<form></form>"),
					 $rowRecordsContainers;

	 	 	 	 $rowRecordsContainers = $("<div class=\"row\" ></div>").appendTo($addRecordForm);

	 	 	 //Create input elements
	 	 	 for (var i = 0; i < self._fieldList.length; i++) {

	 	 	 	 var fieldName = self._fieldList[i];
	 	 	 	 var field = self.options.fields[fieldName];

	 	 	 	 //Do not create input for fields that is key and not specially marked as creatable
	 	 	 	 if (field.key == true && field.create != true) {
	 	 	 	 	 continue;
	 	 	 	 }

	 	 	 	 //Do not create input for fields that are not creatable
	 	 	 	 if (field.create == false) {
	 	 	 	 	 continue;
	 	 	 	 }

	 	 	 	 if (field.type == 'hidden') {
	 	 	 	 	 $addRecordForm.append(self._createInputForHidden(fieldName, field.defaultValue));
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

	 	 	 	 //Create input element
	 	 	 	 $fieldContainer.append(
						 self._createInputForRecordField({
						 	 fieldName: fieldName,
						 	 formType: 'create',
						 	 form: $addRecordForm
						 }));
	 	 	 }

	 	 	 self._makeCascadeDropDowns($addRecordForm, undefined, 'create');

	 	 	 $addRecordForm.submit(function () {
	 	 	 	 self._onSaveClickedOnCreateForm();
	 	 	 	 return false;
	 	 	 });

	 	 	 //Open the form
	 	 	 self._$addRecordDiv.find(".modal-body").html($addRecordForm);
	 	 	 self._$addRecordDiv.modal("show");
	 	 	 self._trigger("formCreated", null, { form: $addRecordForm, formType: 'create' });
	 	 },

	 	 /* Saves new added record to the server and updates table.
		 *************************************************************************/
	 	 _saveAddRecordForm: function ($addRecordForm, $saveButton) {
	 	 	 var self = this;

	 	 	 var completeAddRecord = function (data) {
	 	 	 	 if (data.Result != 'OK') {
	 	 	 	 	 self._showError(data.Message);
	 	 	 	 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
	 	 	 	 	 return;
	 	 	 	 }

	 	 	 	 if (!data.Record) {
	 	 	 	 	 self._logError('Server must return the created Record object.');
	 	 	 	 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
	 	 	 	 	 return;
	 	 	 	 }

	 	 	 	 self._onRecordAdded(data);
	 	 	 	 self._addRow(
						 self._createRowFromRecord(data.Record), {
						 	 isNewRow: true
						 });
	 	 	 	 self._$addRecordDiv.modal("hide");
	 	 	 };

	 	 	 $addRecordForm.data('submitting', true); //TODO: Why it's used, can remove? Check it.

	 	 	 //createAction may be a function, check if it is
	 	 	 if ($.isFunction(self.options.actions.createAction)) {

	 	 	 	 //Execute the function
	 	 	 	 var funcResult = self.options.actions.createAction($addRecordForm.serialize());

	 	 	 	 //Check if result is a jQuery Deferred object
	 	 	 	 if (self._isDeferredObject(funcResult)) {
	 	 	 	 	 //Wait promise
	 	 	 	 	 funcResult.done(function (data) {
	 	 	 	 	 	 completeAddRecord(data);
	 	 	 	 	 }).fail(function () {
	 	 	 	 	 	 self._showError(self.options.messages.serverCommunicationError);
	 	 	 	 	 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
	 	 	 	 	 });
	 	 	 	 } else { //assume it returned the creation result
	 	 	 	 	 completeAddRecord(funcResult);
	 	 	 	 }

	 	 	 } else { //Assume it's a URL string

	 	 	 	 //Make an Ajax call to create record
	 	 	 	 self._submitFormUsingAjax(
						 self.options.actions.createAction,
						 $addRecordForm.serialize(),
						 function (data) {
						 	 completeAddRecord(data);
						 },
						 function () {
						 	 self._showError(self.options.messages.serverCommunicationError);
						 	 self._setEnabledOfDialogButton($saveButton, true, self.options.messages.save);
						 });
	 	 	 }
	 	 },

	 	 _onRecordAdded: function (data) {
	 	 	 this._trigger("recordAdded", null, { record: data.Record, serverResponse: data });
	 	 }

	 });

})(jQuery);