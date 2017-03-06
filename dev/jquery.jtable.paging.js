/************************************************************************
* PAGING extension for jTable                                           *
*************************************************************************/
(function ($) {

	 //Reference to base object members
	 var base = {
	 	 load: $.hik.jtable.prototype.load,
	 	 _create: $.hik.jtable.prototype._create,
	 	 _setOption: $.hik.jtable.prototype._setOption,
	 	 _createRecordLoadUrl: $.hik.jtable.prototype._createRecordLoadUrl,
	 	 _createJtParamsForLoading: $.hik.jtable.prototype._createJtParamsForLoading,
	 	 _addRowToTable: $.hik.jtable.prototype._addRowToTable,
	 	 _addRow: $.hik.jtable.prototype._addRow,
	 	 _removeRowsFromTable: $.hik.jtable.prototype._removeRowsFromTable,
	 	 _onRecordsLoaded: $.hik.jtable.prototype._onRecordsLoaded,
	 	 _resizePanel: $.hik.jtable.prototype._resizePanel
	 };

	 //extension members
	 $.extend(true, $.hik.jtable.prototype, {

	 	 /************************************************************************
		 * DEFAULT OPTIONS / EVENTS                                              *
		 *************************************************************************/
	 	 options: {
	 	 	 paging: false,
	 	 	 pageList: 'normal', //possible values: 'minimal', 'normal'
	 	 	 pageSize: 10,
	 	 	 pageSizes: [10, 25, 50, 100, 250, 500],
	 	 	 pageSizeChangeArea: true,

	 	 	 messages: {
	 	 	 	 pagingInfo: 'Showing {0}-{1} of {2} entries',
	 	 	 	 pageSizeChangeLabel: 'Row count: '
	 	 	 }
	 	 },

	 	 /************************************************************************
		 * PRIVATE FIELDS                                                        *
		 *************************************************************************/

	 	 _$bottomPanel: null, //Reference to the panel at the bottom of the table (jQuery object)
	 	 _$pagingListArea: null, //Reference to the page list area in to bottom panel (jQuery object)
	 	 _$pageSizeChangeArea: null, //Reference to the page size change area in to bottom panel (jQuery object)
	 	 _$pageInfoSpan: null, //Reference to the paging info area in to bottom panel (jQuery object)
	 	 _totalRecordCount: 0, //Total count of records on all pages
	 	 _currentPageNo: 1, //Current page number

	 	 /************************************************************************
		 * CONSTRUCTOR AND INITIALIZING METHODS                                  *
		 *************************************************************************/

	 	 /* Overrides base method to do paging-specific constructions.
		 *************************************************************************/
	 	 _create: function () {
	 	 	 base._create.apply(this, arguments);
	 	 	 if (this.options.paging) {
	 	 	 	 this._loadPagingSettings();
	 	 	 	 this._createBottomPanel();
	 	 	 	 this._createPageListArea();
	 	 	 	 this._createPageSizeSelection();
	 	 	 }
	 	 },

	 	 /* Loads user preferences for paging.
		 *************************************************************************/
	 	 _loadPagingSettings: function () {
	 	 	 if (!this.options.saveUserPreferences) {
	 	 	 	 return;
	 	 	 }

	 	 	 var pageSize = this._getCookie('page-size');
	 	 	 if (pageSize) {
	 	 	 	 this.options.pageSize = this._normalizeNumber(pageSize, 1, 1000000, this.options.pageSize);
	 	 	 }
	 	 },

	 	 /* Creates bottom panel and adds to the page.
		 *************************************************************************/
	 	 _createBottomPanel: function () {
	 	 	 this._$bottomPanel = $('<div />')
					 .addClass('panel-footer')
					 .insertAfter(this._$table);

	 	 	 $('<div />').addClass('jtable-left-area').addClass("pull-left").css("margin-top", "5px").appendTo(this._$bottomPanel);
	 	 	 $('<div />').addClass('jtable-right-area').css({ "text-align": "right" }).appendTo(this._$bottomPanel);
	 	 },

	 	 /* Creates page list area.
		 *************************************************************************/
	 	 _createPageListArea: function () {
	 	 	 this._$pagingListArea = $('<ul></ul>')
					 .addClass('pagination pagination-sm')
					 .css({ "margin-top": "0", "margin-bottom": "0", })
					 .appendTo(this._$bottomPanel.find('.jtable-right-area'));

	 	 	 this._$pageInfoSpan = $('<span></span>')
					 .addClass('jtable-page-info')
					 .appendTo(this._$bottomPanel.find('.jtable-left-area'));
	 	 },

	 	 /* Creates page list change area.
		 *************************************************************************/
	 	 _createPageSizeSelection: function () {
	 	 	 var self = this;

	 	 	 if (!self.options.pageSizeChangeArea) {
	 	 	 	 return;
	 	 	 }

	 	 	 //Add current page size to page sizes list if not contains it
	 	 	 if (self._findIndexInArray(self.options.pageSize, self.options.pageSizes) < 0) {
	 	 	 	 self.options.pageSizes.push(parseInt(self.options.pageSize));
	 	 	 	 self.options.pageSizes.sort(function (a, b) { return a - b; });
	 	 	 }

	 	 	 //Add a span to contain page size change items
	 	 	 self._$pageSizeChangeArea = $('<div />')
			 .addClass("col-md-2")
					 .appendTo(self._$titleDiv.find('.panel-title'));

	 	 	 //Page size change combobox
	 	 	 var $pageSizeChangeCombobox = $('<select></select>').css({ "color": "black" }).appendTo(self._$pageSizeChangeArea);

	 	 	 //Page size label
	 	 	 self._$pageSizeChangeArea.append(self.options.messages.pageSizeChangeLabel).append($pageSizeChangeCombobox);

	 	 	 //Add page sizes to the combobox
	 	 	 for (var i = 0; i < self.options.pageSizes.length; i++) {
	 	 	 	 $pageSizeChangeCombobox.append('<option value="' + self.options.pageSizes[i] + '">' + self.options.pageSizes[i] + '</option>');
	 	 	 }

	 	 	 //Select current page size
	 	 	 $pageSizeChangeCombobox.val(self.options.pageSize);

	 	 	 //Change page size on combobox change
	 	 	 $pageSizeChangeCombobox.change(function () {
	 	 	 	 self._changePageSize(parseInt($(this).val()));
	 	 	 });
	 	 },

	 	 _resizePanel: function () {
	 	 	 base._resizePanel.apply(this, arguments);

	 	 	 if (this._$bottomPanel != null && this._$bottomPanel != undefined) {
	 	 	 	 this._$bottomPanel.css({ width: this._$table.width() });
	 	 	 }
	 	 },

	 	 /************************************************************************
		 * OVERRIDED METHODS                                                     *
		 *************************************************************************/

	 	 /* Overrides load method to set current page to 1.
		 *************************************************************************/
	 	 load: function () {
	 	 	 this._currentPageNo = 1;

	 	 	 base.load.apply(this, arguments);
	 	 	 this._resizePanel();
	 	 },

	 	 /* Used to change options dynamically after initialization.
		 *************************************************************************/
	 	 _setOption: function (key, value) {
	 	 	 base._setOption.apply(this, arguments);

	 	 	 if (key == 'pageSize') {
	 	 	 	 this._changePageSize(parseInt(value));
	 	 	 }
	 	 },

	 	 /* Changes current page size with given value.
		 *************************************************************************/
	 	 _changePageSize: function (pageSize) {
	 	 	 if (pageSize == this.options.pageSize) {
	 	 	 	 return;
	 	 	 }

	 	 	 this.options.pageSize = pageSize;

	 	 	 //Normalize current page
	 	 	 var pageCount = this._calculatePageCount();
	 	 	 if (this._currentPageNo > pageCount) {
	 	 	 	 this._currentPageNo = pageCount;
	 	 	 }
	 	 	 if (this._currentPageNo <= 0) {
	 	 	 	 this._currentPageNo = 1;
	 	 	 }

	 	 	 //if user sets one of the options on the combobox, then select it.
	 	 	 var $pageSizeChangeCombobox = this._$bottomPanel.find('.jtable-page-size-change select');
	 	 	 if ($pageSizeChangeCombobox.length > 0) {
	 	 	 	 if (parseInt($pageSizeChangeCombobox.val()) != pageSize) {
	 	 	 	 	 var selectedOption = $pageSizeChangeCombobox.find('option[value=' + pageSize + ']');
	 	 	 	 	 if (selectedOption.length > 0) {
	 	 	 	 	 	 $pageSizeChangeCombobox.val(pageSize);
	 	 	 	 	 }
	 	 	 	 }
	 	 	 }

	 	 	 this._savePagingSettings();
	 	 	 this._reloadTable();
	 	 },

	 	 /* Saves user preferences for paging
		 *************************************************************************/
	 	 _savePagingSettings: function () {
	 	 	 if (!this.options.saveUserPreferences) {
	 	 	 	 return;
	 	 	 }

	 	 	 this._setCookie('page-size', this.options.pageSize);
	 	 },

	 	 /* Overrides _createRecordLoadUrl method to add paging info to URL.
		 *************************************************************************/
	 	 _createRecordLoadUrl: function () {
	 	 	 var loadUrl = base._createRecordLoadUrl.apply(this, arguments);
	 	 	 loadUrl = this._addPagingInfoToUrl(loadUrl, this._currentPageNo);
	 	 	 return loadUrl;
	 	 },

	 	 /* Overrides _createJtParamsForLoading method to add paging parameters to jtParams object.
		 *************************************************************************/
	 	 _createJtParamsForLoading: function () {
	 	 	 var jtParams = base._createJtParamsForLoading.apply(this, arguments);

	 	 	 if (this.options.paging) {
	 	 	 	 jtParams.jtStartIndex = (this._currentPageNo - 1) * this.options.pageSize;
	 	 	 	 jtParams.jtPageSize = this.options.pageSize;
	 	 	 }

	 	 	 return jtParams;
	 	 },

	 	 /* Overrides _addRowToTable method to re-load table when a new row is created.
		 * NOTE: THIS METHOD IS DEPRECATED AND WILL BE REMOVED FROM FEATURE RELEASES.
		 * USE _addRow METHOD.
		 *************************************************************************/
	 	 _addRowToTable: function ($tableRow, index, isNewRow) {
	 	 	 if (isNewRow && this.options.paging) {
	 	 	 	 this._reloadTable();
	 	 	 	 return;
	 	 	 }

	 	 	 base._addRowToTable.apply(this, arguments);
	 	 },

	 	 /* Overrides _addRow method to re-load table when a new row is created.
		 *************************************************************************/
	 	 _addRow: function ($row, options) {
	 	 	 if (options && options.isNewRow && this.options.paging) {
	 	 	 	 this._reloadTable();
	 	 	 	 return;
	 	 	 }

	 	 	 base._addRow.apply(this, arguments);
	 	 },

	 	 /* Overrides _removeRowsFromTable method to re-load table when a row is removed from table.
		 *************************************************************************/
	 	 _removeRowsFromTable: function ($rows, reason) {
	 	 	 base._removeRowsFromTable.apply(this, arguments);

	 	 	 if (this.options.paging) {
	 	 	 	 if (this._$tableRows.length <= 0 && this._currentPageNo > 1) {
	 	 	 	 	 --this._currentPageNo;
	 	 	 	 }

	 	 	 	 this._reloadTable();
	 	 	 }
	 	 },

	 	 /* Overrides _onRecordsLoaded method to to do paging specific tasks.
		 *************************************************************************/
	 	 _onRecordsLoaded: function (data) {
	 	 	 if (this.options.paging) {
	 	 	 	 this._totalRecordCount = data.TotalRecordCount;
	 	 	 	 this._createPagingList();
	 	 	 	 this._createPagingInfo();
	 	 	 }

	 	 	 base._onRecordsLoaded.apply(this, arguments);
	 	 },

	 	 /************************************************************************
		 * PRIVATE METHODS                                                       *
		 *************************************************************************/

	 	 /* Adds jtStartIndex and jtPageSize parameters to a URL as query string.
		 *************************************************************************/
	 	 _addPagingInfoToUrl: function (url, pageNumber) {
	 	 	 if (!this.options.paging) {
	 	 	 	 return url;
	 	 	 }

	 	 	 var jtStartIndex = (pageNumber - 1) * this.options.pageSize;
	 	 	 var jtPageSize = this.options.pageSize;

	 	 	 return (url + (url.indexOf('?') < 0 ? '?' : '&') + 'jtStartIndex=' + jtStartIndex + '&jtPageSize=' + jtPageSize);
	 	 },

	 	 /* Creates and shows the page list.
		 *************************************************************************/
	 	 _createPagingList: function () {
	 	 	 if (this.options.pageSize <= 0) {
	 	 	 	 return;
	 	 	 }

	 	 	 this._$pagingListArea.empty();
	 	 	 if (this._totalRecordCount <= 0) {
	 	 	 	 return;
	 	 	 }

	 	 	 var pageCount = this._calculatePageCount();

	 	 	 this._createFirstAndPreviousPageButtons();
	 	 	 if (this.options.pageList == 'normal') {
	 	 	 	 this._createPageNumberButtons(this._calculatePageNumbers(pageCount));
	 	 	 }
	 	 	 this._createLastAndNextPageButtons(pageCount);
	 	 	 this._bindClickEventsToPageNumberButtons();
	 	 },

	 	 /* Creates and shows previous and first page links.
		 *************************************************************************/
	 	 _createFirstAndPreviousPageButtons: function () {
	 	 	 var $first = $('<li />')
					 .html("<a aria-label=\"First\" href=\"#\"><span aria-hidden=\"true\">&lt&lt</span></a>")
					 .data('pageNumber', 1)
					 .appendTo(this._$pagingListArea);

	 	 	 var $previous = $('<li />')
					 .html("<a aria-label=\"Previous\" href=\"#\"><span aria-hidden=\"true\">&lt</span></a>")
					 .data('pageNumber', this._currentPageNo - 1)
					 .appendTo(this._$pagingListArea);


	 	 	 if (this._currentPageNo <= 1) {
	 	 	 	 $first.addClass('disabled');
	 	 	 	 $previous.addClass('disabled');
	 	 	 }
	 	 },

	 	 /* Creates and shows next and last page links.
		 *************************************************************************/
	 	 _createLastAndNextPageButtons: function (pageCount) {
	 	 	 var $next = $('<li />')
					 .html("<a aria-label=\"Next\" href=\"#\"><span aria-hidden=\"true\">&gt</span></a>")
					 .data('pageNumber', this._currentPageNo + 1)
					 .appendTo(this._$pagingListArea);

	 	 	 var $last = $('<li />')
					 .html("<a aria-label=\"Last\" href=\"#\"><span aria-hidden=\"true\">&gt&gt</span></a>")
					 .data('pageNumber', pageCount)
					 .appendTo(this._$pagingListArea);


	 	 	 if (this._currentPageNo >= pageCount) {
	 	 	 	 $next.addClass('disabled');
	 	 	 	 $last.addClass('disabled');
	 	 	 }
	 	 },

	 	 /* Creates and shows page number links for given number array.
		 *************************************************************************/
	 	 _createPageNumberButtons: function (pageNumbers) {
	 	 	 var previousNumber = 0;
	 	 	 for (var i = 0; i < pageNumbers.length; i++) {
	 	 	 	 //Create "..." between page numbers if needed
	 	 	 	 if ((pageNumbers[i] - previousNumber) > 1) {
	 	 	 	 	 $('<li />')
							 .html("<a href=\"#\">...</a>")
							 .appendTo(this._$pagingListArea);
	 	 	 	 }

	 	 	 	 this._createPageNumberButton(pageNumbers[i]);
	 	 	 	 previousNumber = pageNumbers[i];
	 	 	 }
	 	 },

	 	 /* Creates a page number link and adds to paging area.
		 *************************************************************************/
	 	 _createPageNumberButton: function (pageNumber) {
	 	 	 var $pageNumber = $('<li />')
					 .html("<a href=\"#\">" + pageNumber + "</a>")
					 .data('pageNumber', pageNumber)
					 .appendTo(this._$pagingListArea);


	 	 	 if (this._currentPageNo == pageNumber) {
	 	 	 	 $pageNumber.addClass('active');
	 	 	 }
	 	 },

	 	 /* Calculates total page count according to page size and total record count.
		 *************************************************************************/
	 	 _calculatePageCount: function () {
	 	 	 var pageCount = Math.floor(this._totalRecordCount / this.options.pageSize);
	 	 	 if (this._totalRecordCount % this.options.pageSize != 0) {
	 	 	 	 ++pageCount;
	 	 	 }

	 	 	 return pageCount;
	 	 },

	 	 /* Calculates page numbers and returns an array of these numbers.
		 *************************************************************************/
	 	 _calculatePageNumbers: function (pageCount) {
	 	 	 if (pageCount <= 4) {
	 	 	 	 //Show all pages
	 	 	 	 var pageNumbers = [];
	 	 	 	 for (var i = 1; i <= pageCount; ++i) {
	 	 	 	 	 pageNumbers.push(i);
	 	 	 	 }

	 	 	 	 return pageNumbers;
	 	 	 } else {
	 	 	 	 //show first three, last three, current, previous and next page numbers
	 	 	 	 var shownPageNumbers = [1, 2, pageCount - 1, pageCount];
	 	 	 	 var previousPageNo = this._normalizeNumber(this._currentPageNo - 1, 1, pageCount, 1);
	 	 	 	 var nextPageNo = this._normalizeNumber(this._currentPageNo + 1, 1, pageCount, 1);

	 	 	 	 this._insertToArrayIfDoesNotExists(shownPageNumbers, previousPageNo);
	 	 	 	 this._insertToArrayIfDoesNotExists(shownPageNumbers, this._currentPageNo);
	 	 	 	 this._insertToArrayIfDoesNotExists(shownPageNumbers, nextPageNo);

	 	 	 	 shownPageNumbers.sort(function (a, b) { return a - b; });
	 	 	 	 return shownPageNumbers;
	 	 	 }
	 	 },

	 	 /* Creates and shows paging informations.
		 *************************************************************************/
	 	 _createPagingInfo: function () {
	 	 	 if (this._totalRecordCount <= 0) {
	 	 	 	 this._$pageInfoSpan.empty();
	 	 	 	 return;
	 	 	 }

	 	 	 var startNo = (this._currentPageNo - 1) * this.options.pageSize + 1;
	 	 	 var endNo = this._currentPageNo * this.options.pageSize;
	 	 	 endNo = this._normalizeNumber(endNo, startNo, this._totalRecordCount, 0);

	 	 	 if (endNo >= startNo) {
	 	 	 	 var pagingInfoMessage = this._formatString(this.options.messages.pagingInfo, startNo, endNo, this._totalRecordCount);
	 	 	 	 this._$pageInfoSpan.html(pagingInfoMessage);
	 	 	 }
	 	 },

	 	 /* Binds click events of all page links to change the page.
		 *************************************************************************/
	 	 _bindClickEventsToPageNumberButtons: function () {
	 	 	 var self = this;
	 	 	 self._$pagingListArea
					 .find('li')
					 .not('.disabled')
					 .not('.active')
					 .click(function (e) {
					 	 e.preventDefault();
					 	 self._changePage($(this).data('pageNumber'));
					 });
	 	 },

	 	 /* Changes current page to given value.
		 *************************************************************************/
	 	 _changePage: function (pageNo) {
	 	 	 if (pageNo == undefined) {
	 	 	 	 return;
	 	 	 }
	 	 	 pageNo = this._normalizeNumber(pageNo, 1, this._calculatePageCount(), 1);
	 	 	 if (pageNo == this._currentPageNo) {
	 	 	 	 return;
	 	 	 }

	 	 	 this._currentPageNo = pageNo;
	 	 	 this._reloadTable();
	 	 }

	 });

})(jQuery);