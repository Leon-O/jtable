/************************************************************************
* SORTING extension for jTable                                          *
*************************************************************************/
(function ($) {

	 //Reference to base object members
	 var base = {
	 	 _initializeFields: $.hik.jtable.prototype._initializeFields,
	 	 _normalizeFieldOptions: $.hik.jtable.prototype._normalizeFieldOptions,
	 	 _createHeaderCellForField: $.hik.jtable.prototype._createHeaderCellForField,
	 	 _createRecordLoadUrl: $.hik.jtable.prototype._createRecordLoadUrl,
	 	 _createJtParamsForLoading: $.hik.jtable.prototype._createJtParamsForLoading
	 };

	 //extension members
	 $.extend(true, $.hik.jtable.prototype, {

	 	 /************************************************************************
		 * DEFAULT OPTIONS / EVENTS                                              *
		 *************************************************************************/
	 	 options: {
	 	 	 sorting: false,
	 	 	 multiSorting: false,
	 	 	 defaultSorting: ''
	 	 },

	 	 /************************************************************************
		 * PRIVATE FIELDS                                                        *
		 *************************************************************************/

	 	 _lastSorting: null, //Last sorting of the table

	 	 /************************************************************************
		 * OVERRIDED METHODS                                                     *
		 *************************************************************************/

	 	 /* Overrides base method to create sorting array.
		 *************************************************************************/
	 	 _initializeFields: function () {
	 	 	 base._initializeFields.apply(this, arguments);

	 	 	 this._lastSorting = [];
	 	 	 if (this.options.sorting) {
	 	 	 	 this._buildDefaultSortingArray();
	 	 	 }
	 	 },

	 	 /* Overrides _normalizeFieldOptions method to normalize sorting option for fields.
		 *************************************************************************/
	 	 _normalizeFieldOptions: function (fieldName, props) {
	 	 	 base._normalizeFieldOptions.apply(this, arguments);
	 	 	 props.sorting = (props.sorting != false);
	 	 },

	 	 /* Overrides _createHeaderCellForField to make columns sortable.
		 *************************************************************************/
	 	 _createHeaderCellForField: function (fieldName, field) {
	 	 	 var $headerCell = base._createHeaderCellForField.apply(this, arguments);
	 	 	 if (this.options.sorting && field.sorting) {
	 	 	 	 this._makeColumnSortable($headerCell, fieldName);
	 	 	 }

	 	 	 return $headerCell;
	 	 },

	 	 /* Overrides _createRecordLoadUrl to add sorting specific info to URL.
		 *************************************************************************/
	 	 _createRecordLoadUrl: function () {
	 	 	 var loadUrl = base._createRecordLoadUrl.apply(this, arguments);
	 	 	 loadUrl = this._addSortingInfoToUrl(loadUrl);
	 	 	 return loadUrl;
	 	 },

	 	 /************************************************************************
		 * PRIVATE METHODS                                                       *
		 *************************************************************************/

	 	 /* Builds the sorting array according to defaultSorting string
		 *************************************************************************/
	 	 _buildDefaultSortingArray: function () {
	 	 	 var self = this;

	 	 	 $.each(self.options.defaultSorting.split(","), function (orderIndex, orderValue) {
	 	 	 	 $.each(self.options.fields, function (fieldName, fieldProps) {
	 	 	 	 	 if (fieldProps.sorting) {
	 	 	 	 	 	 var colOffset = orderValue.indexOf(fieldName);
	 	 	 	 	 	 if (colOffset > -1) {
	 	 	 	 	 	 	 if (orderValue.toUpperCase().indexOf(' DESC', colOffset) > -1) {
	 	 	 	 	 	 	 	 self._lastSorting.push({
	 	 	 	 	 	 	 	 	 fieldName: fieldName,
	 	 	 	 	 	 	 	 	 sortOrder: 'DESC'
	 	 	 	 	 	 	 	 });
	 	 	 	 	 	 	 } else {
	 	 	 	 	 	 	 	 self._lastSorting.push({
	 	 	 	 	 	 	 	 	 fieldName: fieldName,
	 	 	 	 	 	 	 	 	 sortOrder: 'ASC'
	 	 	 	 	 	 	 	 });
	 	 	 	 	 	 	 }
	 	 	 	 	 	 }
	 	 	 	 	 }
	 	 	 	 });
	 	 	 });
	 	 },

	 	 /* Makes a column sortable.
		 *************************************************************************/
	 	 _makeColumnSortable: function ($columnHeader, fieldName) {
	 	 	 var self = this;
	 	 	 var $colspan = $("<span aria-hidden=\"true\" style=\"margin-right: 7px;\"></span>").addClass("glyphicon glyphicon-sort");

	 	 	 $columnHeader.append($colspan)
					 .click(function (e) {
					 	 e.preventDefault();

					 	 if (!self.options.multiSorting || !e.ctrlKey) {
					 	 	 self._lastSorting = []; //clear previous sorting
					 	 }

					 	 self._sortTableByColumn($columnHeader);
					 });

	 	 	 $columnHeader.css({ "cursor": "pointer" });

	 	 	 //Set default sorting
	 	 	 $.each(this._lastSorting, function (sortIndex, sortField) {
	 	 	 	 if (sortField.fieldName == fieldName) {
	 	 	 	 	 $columnHeader.children().removeClass("glyphicon-sort");

	 	 	 	 	 if (sortField.sortOrder == 'DESC') {
	 	 	 	 	 	 $columnHeader.children().addClass('glyphicon-sort-by-attributes-alt');
	 	 	 	 	 } else {
	 	 	 	 	 	 $columnHeader.children().addClass('glyphicon-sort-by-attributes');
	 	 	 	 	 }
	 	 	 	 }
	 	 	 	 else {
	 	 	 	 	 $columnHeader.children().addClass("glyphicon-sort");
	 	 	 	 }
	 	 	 });
	 	 },

	 	 /* Sorts table according to a column header.
		 *************************************************************************/
	 	 _sortTableByColumn: function ($columnHeader) {
	 	 	 //Remove sorting styles from all columns except this one
	 	 	 if (this._lastSorting.length == 0) {
	 	 	 	 $columnHeader.siblings().children().addClass("glyphicon-sort");
	 	 	 	 $columnHeader.siblings().children().removeClass('glyphicon-sort-by-attributes glyphicon-sort-by-attributes-alt');
	 	 	 }

	 	 	 //If current sorting list includes this column, remove it from the list
	 	 	 for (var i = 0; i < this._lastSorting.length; i++) {
	 	 	 	 if (this._lastSorting[i].fieldName == $columnHeader.data('fieldName')) {
	 	 	 	 	 this._lastSorting.splice(i--, 1);
	 	 	 	 }
	 	 	 }

	 	 	 //Sort ASC or DESC according to current sorting state
	 	 	 if ($columnHeader.children().hasClass('glyphicon-sort-by-attributes')) {
	 	 	 	 $columnHeader.children().removeClass('glyphicon-sort-by-attributes').addClass('glyphicon-sort-by-attributes-alt');
	 	 	 	 this._lastSorting.push({
	 	 	 	 	 'fieldName': $columnHeader.data('fieldName'),
	 	 	 	 	 sortOrder: 'DESC'
	 	 	 	 });
	 	 	 } else {
	 	 	 	 $columnHeader.children().removeClass('glyphicon-sort-by-attributes-alt').addClass('glyphicon-sort-by-attributes');
	 	 	 	 this._lastSorting.push({
	 	 	 	 	 'fieldName': $columnHeader.data('fieldName'),
	 	 	 	 	 sortOrder: 'ASC'
	 	 	 	 });
	 	 	 }

	 	 	 //Load current page again
	 	 	 this._reloadTable();
	 	 },

	 	 /* Adds jtSorting parameter to a URL as query string.
		 *************************************************************************/
	 	 _addSortingInfoToUrl: function (url) {
	 	 	 if (!this.options.sorting || this._lastSorting.length == 0) {
	 	 	 	 return url;
	 	 	 }

	 	 	 var sorting = [];
	 	 	 $.each(this._lastSorting, function (idx, value) {
	 	 	 	 sorting.push(value.fieldName + ' ' + value.sortOrder);
	 	 	 });

	 	 	 return (url + (url.indexOf('?') < 0 ? '?' : '&') + 'jtSorting=' + sorting.join(","));
	 	 },

	 	 /* Overrides _createJtParamsForLoading method to add sorging parameters to jtParams object.
		 *************************************************************************/
	 	 _createJtParamsForLoading: function () {
	 	 	 var jtParams = base._createJtParamsForLoading.apply(this, arguments);

	 	 	 if (this.options.sorting && this._lastSorting.length) {
	 	 	 	 var sorting = [];
	 	 	 	 $.each(this._lastSorting, function (idx, value) {
	 	 	 	 	 sorting.push(value.fieldName + ' ' + value.sortOrder);
	 	 	 	 });

	 	 	 	 jtParams.jtSorting = sorting.join(",");
	 	 	 }

	 	 	 return jtParams;
	 	 }

	 });

})(jQuery);