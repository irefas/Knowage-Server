/**
 * @authors Giovanni Luca Ulivo (GiovanniLuca.Ulivo@eng.it)
 * v1.0.2
 * 
 */
var scripts = document.getElementsByTagName("script");
var currentScriptPath = scripts[scripts.length - 1].src;

////load daff.js
//var script = document.createElement('script');
//script.type = 'text/javascript';
//script.src = currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1) + 'utils/daff.js';
//document.getElementsByTagName('head')[0].appendChild(script);

angular.module('angular_table', ['ngMaterial', 'angularUtils.directives.dirPagination', 'ng-context-menu', 'ui.tree'])
        .directive('angularTable',
                function ($compile) {
                    return {
                        templateUrl: currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1) + 'template/angular-table.html',
                        transclude: true,
                        controller: TableControllerFunction,
                        priority: 1000,
                        scope: {
                            ngModel: '=',
                            id: "@",
                            columns: "=?", //items to display. if not defined list all element ordering by name
                            columnsSearch: "=?", // columns where search
                            showSearchBar: '=', //default false
                            searchFunction: '&',
                            pageChangedFunction: "&",
                            totalItemCount: "=?", //if not present, create a non sync pagination and page change function is not necessary
                            currentPageNumber: "=?",
                            noPagination: "=?", //not create pagination and  totalItemCount and pageChangedFunction are not necessary
                            clickFunction: "&", //function to call when click into element list
                            menuOption: "=?", //menu to open with right click
                            speedMenuOption: "=?", //speed menu to open with  button at the end of item
                            selectedItem: "=?", //optional to get the selected  item value
                            highlightsSelectedItem: "=?",
                            multiSelect: "=?",
                            scopeFunctions: "=?",
                            dragEnabled: "=?",
                            dragDropOptions: "=?",
                            enableClone: "=?",
                            showEmptyPlaceholder: "=?",
                            noDropEnabled: "=?",
                            allowEdit: "=?",
                            editFunction: "&?",
                            allowEditFunction: "&?",
                            hideTableHead: "=?",
                            fullWidth:"=?",
                            comparisonColumn:"=?",
                            initialSorting:"=?",
                            initialSortingAsc:"=?",
                            visibleRowFunction:"&",
                            sortableColumn:"=?",
                            changeDetector:"@?"
                        },
                        compile: function (tElement, tAttrs, transclude) {
                            return {
                                pre: function preLink(scope, element, attrs, ctrl, transclud) {
                                    if (attrs.dragEnabled && (attrs.dragEnabled == true || attrs.dragEnabled == "true")) {
                                        var table = angular.element(element[0].querySelector("table.principalTable"))
                                        table.attr('ui-tree', "dragDropOptions");
                                        table.attr('drag-delay', "600");
                                        table.attr('data-clone-enabled', "enableClone");
                                        table.attr('data-empty-placeholder-enabled', "showEmptyPlaceholder");
                                        table.attr('data-nodrop-enabled', "noDropEnabled");


                                        $compile(table)(scope)
                                        var body = angular.element(table[0].querySelector("tbody"));
                                        body.attr('ui-tree-nodes', "");
                                        body.attr('ng-model', "ngModel");
                                        
                                        scope.DandDEnabled=true;
                                    }else{
                                    	scope.DandDEnabled=false;
                                    }
                                   
                                },
                                post: function postLink(scope, element, attrs, ctrl, transclud) {

                                    //TODO ngModel obbligatorio
                                	scope.internalTableConfiguration={};

                                    var id = "";
                                    if (attrs.id) {
                                        id = attrs.id;
                                    }else{
                                    	id = "at"+(new Date()).getTime();
                                    	scope.id=id;
                                    }
                                    
                                    var template = angular.element(element[0]);
                                    template.addClass(id + "ItemBox");
                                    template.addClass("layout-column");


                                    var table = angular.element(template[0].querySelector("table.principalTable"));
                                    var thead = angular.element(table[0].querySelector("thead"));
                                    var tbody = angular.element(table[0].querySelector("tbody"));
                                    var footerBox = angular.element(template[0].querySelector("angular-table-footer"));

                                    //create the head
                                    thead.attr('angular-table-head', "");
                                    //create tbody
                                    tbody.attr('angular-table-body', "");
                                    
                                    if(scope.DandDEnabled){
                                    	tbody.attr('no-drag-and-drop', true);
                                    }

                                    scope.initializeColumns = function (noCompile) {
                                        //create the column of the table. If attrs.column is present load only this column, else load all the columns
                                        scope.tableColumns = [];
 
                                        if ((attrs.multiSelect && (attrs.multiSelect == true || attrs.multiSelect == "true")) || scope.multiSelect == true){
                                            scope.tableColumns.push({label: "--MULTISELECT--", name: "--MULTISELECT--", size: "30px"});
                                            thead.attr('multi-select', true);
                                            tbody.attr('multi-select', true);
                                        }

                                        if (scope.DandDEnabled) {
                                            scope.tableColumns.push({label: "", name: "--DRAG_AND_DROP--", size: "1px"});
                                        }  
                                        
                                        if(scope.internalTableConfiguration.rowDetail==true){
                                        	debugger
                                        	scope.tableColumns.push({label: "", name: "--ROW_DETAIL--", size: "30px"});
                                        }
                                        
                                        
                                        if (attrs.columnsSearch) {
                                            var colSearch = scope.columnsSearch;
                                            if (Object.prototype.toString.call(colSearch) == "[object String]") {
                                                //if is a string, convert it to object
                                                scope.columnsSearch = JSON.parse(colSearch);
                                            }
                                        }

                                        if (attrs.columns) {
                                            var col = scope.columns;
                                            if (Object.prototype.toString.call(col) == "[object String]") {
                                                //if is a string, convert it to object
                                                col = JSON.parse(col);
                                            }

                                            for (var i in col) {
                                                var tmpColData = {};
                                                if (Object.prototype.toString.call(col[i]) == "[object Object]") {
                                                    //json of parameter like name, label,size
                                                    tmpColData.name = col[i].name || "---";
                                                    tmpColData.label = col[i].label || tmpColData.name;
                                                    tmpColData.size = col[i].size || "";
                                                    tmpColData.editable = (col[i].editable && scope.allowEdit) || false;
                                                    tmpColData.comparatorFunction=col[i].comparatorFunction;
                                                    tmpColData.comparatorColumn=col[i].comparatorColumn;
                                                    tmpColData.transformer=col[i].transformer;
                                                    tmpColData.customClass=col[i].customClass;
                                                    tmpColData.hideTooltip=col[i].hideTooltip;
                                                    tmpColData.style=col[i].style;
                                                } else {
                                                    //only the col name
                                                    tmpColData.label = col[i];
                                                    tmpColData.name = col[i];
                                                    tmpColData.size = "";
                                                    tmpColData.editable = scope.allowEdit || false;
//                                                    tmpColData.comparatorFunction=col[i].comparatorFunction;
//                                                    tmpColData.transformer=col[i].transformer;
                                                }

                                                scope.tableColumns.push(tmpColData);
                                            }
                                        } else {
                                            //load all
                                            var firstValue = scope.ngModel[0];
                                            if (firstValue != undefined) {
                                                for (var key in firstValue) {
                                                    var tmpColData = {};
                                                    tmpColData.label = key;
                                                    tmpColData.name = key;
                                                    tmpColData.size = "";
                                                    tmpColData.editable = key;
                                                    scope.tableColumns.push(tmpColData);
                                                }
                                            }
                                        }
                                        //add speed menu column at the end of the table
                                        if (attrs.speedMenuOption) {
                                            var speedSize = scope.speedMenuOption.length > 3 ? 30 : (scope.speedMenuOption.length * 30 || 30);
                                            scope.tableColumns.push({label: "", name: "--SPEEDMENU--", size: speedSize + "px"});
                                            thead.attr('speed-menu-option', true);
                                            tbody.attr('speed-menu-option', true);
                                        }
                                        //if contextMenu is enabled 
                                        tbody.attr('menu-option', attrs.menuOption!=undefined);
                                        

                                        if (noCompile != true) {
                                            $compile(thead)(scope);
//								$compile(tbody)(scope);
                                        }
                                    };

                                    scope.initializeColumns(true);
                                    
                                    //check for pagination
                                    var paginBox = angular.element(footerBox[0].querySelector("dir-pagination-controls"));
                                    if(attrs.noPagination && (attrs.noPagination == true || attrs.noPagination == "true")){
                                    	tbody.attr('pagination-type', "none");
                                    	paginBox.remove();
                                    }else{
                                    	 if (!attrs.totalItemCount) {
                                    		 tbody.attr('pagination-type', "local");
                                    		 tbody.attr('current-page-number', scope.currentPageNumber);
                                    		 scope.totalItemCount = undefined;
                                             paginBox.removeAttr("on-page-change");
                                    	 }else{
                                    		 tbody.attr('pagination-type', "backend");
                                    	 }
                                    }
                                    
                                    //check for change-detector
                                    scope.enableChangeDetector=attrs.changeDetector!=undefined;
                                    

                                    $compile(thead)(scope);
                                    $compile(tbody)(scope);

                                    //add search tab
                                    if (!attrs.showSearchBar || attrs.showSearchBar == false || attrs.showSearchBar == "false") {
//                                        angular.element(template[0].querySelector(".tableSearchBar")).css("display", "none");
                                    	  angular.element(template[0].querySelector("angular-table-actions")).css("display", "none");
                                    }

                                    
                                    if (!attrs.searchFunction) {
                                        scope.localSearch = true;
                                    }
                                   

                                    if (attrs.multiSelect) {
                                        if (!attrs.selectedItem) {
                                            scope.selectedItem = [];
                                        }
                                    }

                                    
									
                                    if(attrs.hasOwnProperty("fullWidth") || (attrs.hasOwnProperty("noPagination") && attrs.noPagination==true)){
										scope.getPrincipalTableHeadWidth=function(){
											var elem = angular.element(document.querySelector('angular-table.' + scope.id + 'ItemBox #angularTableContentBox .principalTable thead'))[0];
										 	  return elem == undefined ? null : elem.offsetWidth;
										}
                                    	  
										scope.$watch(function(){return scope.getPrincipalTableHeadWidth()}
                                    		  , function (newValue, oldValue) {
	                                        	if(newValue!=oldValue){
	                                        		scope.loadTheadColumn();
	                                        	}
											}, true);
                                    }

                                    transclude(scope, function (clone, scope) {
                                        angular.element(element[0]).append(clone);
                                    });

                                    
                                    
                                }
                            };
                        }
                    };
                })
        .directive('angularTableHead',
                function ($compile) {
                    return {
                        templateUrl: 'headThTemplate.html',
                        transclude: true,
                        controller: TableHeaderControllerFunction,
                        link: function (scope, element, attrs, ctrl, transclude) {
                        }
                    };
                })
        .directive('angularTableBody',
                function ($compile) {
                    return {
                        templateUrl: 'bodyTemplate.html',
                        transclude: true,
                        controller: TableBodyControllerFunction,
                        priority: 100,
                        compile: function (tElement, tAttrs, transclude) {
                        	var tr=tElement.find("tr");
                        	var td=tElement.find("td");
                        	if(!angular.equals(tAttrs.menuOption,"true")){
                        		//remove the contextMenu
                        		td.removeAttr("data-target");
                        		td.removeAttr("context-menu");
                        		angular.element(tElement[0].querySelector(".dropdown_menu_list")).remove()
                        	}
                        	
                            if (tAttrs.noDragAndDrop != "true") {
                               tr.removeAttr('ui-tree-node');
                               angular.element(td[0].querySelector("i[ui-tree-handle]")).remove();
                            }
                            
                            //check for pagination
                            if(angular.equals(tAttrs.paginationType,"none")){
                            	var repeatAttr=tr.attr("dir-paginate").replace("| itemsPerPage:itemsPerPage","");
                            	tr.attr("ng-repeat",repeatAttr);
                                tr.removeAttr("dir-paginate")
                                tr.removeAttr("total-items")
                                tr.removeAttr("pagination-id")
                                tr.removeAttr("current-page")
                            }else if(angular.equals(tAttrs.paginationType,"local")){
                            	tr.removeAttr('total-items');
                            	if (tAttrs.currentPageNumber == null) {
                            		tr.removeAttr('current-page');
                            	}
                            }else if(angular.equals(tAttrs.paginationType,"backend")){
                            }
                            
                            return {
                                pre: function preLink(scope, element, attrs, ctrl, transclud) {
                                	if(scope.rowDetailTemplate!=undefined){
                                		tr.attr("angular-table-row-detail","");
                                	}
                                }
                                    
                            }
                        }
                            
                    };
                })
        .directive('angularTableFooter',
                function ($compile) {
                    return {
                        template: "<div ng-transclude></div>",
                        transclude: true,
                        link: function (scope, element, attrs, ctrl, transclude) {

                        }
                    };
                })
        .directive('actionBackgroundColor',
                function ($compile) {
                    return {
                        link: function (scope, element, attrs, ctrl, transclude) {
                            element.css("background-color", attrs.actionBackgroundColor);
                        }
                    };
                })
        .directive('actionColor',
                function ($compile) {
                    return {
                        link: function (scope, element, attrs, ctrl, transclude) {
                            element.css("color", attrs.actionColor);
                        }
                    };
                })
        .directive('dynamichtml', function ($compile) {
            return {
                restrict: 'A',
                replace: true,
                link: function (scope, ele, attrs) {
                    var watch=scope.$watch(attrs.dynamichtml, function (html) {
                    	if(html!=undefined){
                    		ele.html(html);
                    		$compile(ele.contents())(scope);
                    		watch();
                    	}
                    });
                }
            };
        })
        .directive('queueTable',function ($compile) {
                    return {
                        template: '',
                        replace: true,
                        transclude: true,
                        link: function (scope, element, attrs, ctrl, transclude) {
                            transclude(scope, function (clone, scope) {
                                var contElem = angular.element(element.parent())[0].querySelector("#queueTableContent");
                                angular.element(contElem).append(clone);
                            });
                            transclude(scope, function (clone, scope) {
                                var fidexContElem = angular.element(element.parent())[0].querySelector("#fixedAngularTableContentBox");
                                angular.element(fidexContElem).append(clone);
                            });

                            //enable watch to block on the bottom the foot row if scroll is enabled
                            scope.$watch(function () {
                                var elem = angular.element(document.querySelector('angular-table.' + scope.id + 'ItemBox #angularTableContentBox'))[0];
                                return elem == undefined ? undefined : {scroll: elem.scrollHeight, heigth: elem.offsetHeight};
                            }, function (newValue, oldValue) {
                                if (newValue != oldValue) { 
                                    if (newValue.scroll > newValue.heigth) {
                                        angular.element(document.querySelector('angular-table.' + scope.id + 'ItemBox')).addClass("absoluteTfoot");
                                    } else {
                                        angular.element(document.querySelector('angular-table.' + scope.id + 'ItemBox')).removeClass("absoluteTfoot")

                                    }
                                }

                            }, true);
                        }
                    };
                })
          .directive('rowDetail',function ($compile) {
            return {
                template: '',
                replace: true,
                transclude: true,
                link: function (scope, element, attrs, ctrl, transclude) {
                    transclude(scope, function (clone, scope) {
                    	scope.internalTableConfiguration.rowDetail=true;
                    	scope.rowDetailTemplate=clone.html();
                    	angular.element(element.parent())[0].querySelector("#angularTableContentBox").style.overflow="auto";
                    	 scope.initializeColumns(false)
//                                var contElem = angular.element(element.parent())[0].querySelector("table.principalTable tbody");
//                                angular.element(contElem).append(clone);
                    });
                    
                }
            };
        })
        .directive('angularTableRowDetail',function ($compile) {
        	return {
        		template: '',
        		restrict: 'A',
        		replace: false,
        		link: function (scope, element, attrs, ctrl, transclude) {
        			var clon=scope.rowDetailTemplate;
        			element.after("<tr/>").next().html(clon)
        			element.next().attr("ng-if","visible");
        			$compile(element.next())(element.scope());
        			
        		}
        	};
        })
        
        .filter('filterBySpecificColumns', function () {
            return function (items, columnsSearch, searchTerm, localSearch) {
                if (searchTerm == undefined || searchTerm == "") {
                    return items;
                }
                var filtered = [];
                for (var item in items) {
                    if (columnsSearch != undefined && columnsSearch.length != 0) {
                        for (var cols in columnsSearch) {
                        	var tmpSearchItem=""
                        	if(angular.isObject(columnsSearch[cols])){
                        		if(columnsSearch[cols].transformer!=undefined){
                        			tmpSearchItem=columnsSearch[cols].transformer(items[item],columnsSearch[cols].name);
                        		}else{
                        			tmpSearchItem=items[item][columnsSearch[cols].name];
                        		}
                        	}else{
                        		tmpSearchItem=items[item][columnsSearch[cols]]
                        	}
                        	
                        	
                            if (tmpSearchItem!= undefined) {
                                if (tmpSearchItem.toString().toUpperCase().indexOf(searchTerm.toUpperCase()) !== -1) {
                                    filtered.push(items[item]);
                                    break;
                                }
                            }
                        };
                    } else {
                        if (JSON.stringify(items[item]) != undefined) {
                            if (JSON.stringify(items[item]).toString().toUpperCase().indexOf(searchTerm.toUpperCase()) !== -1) {
                                filtered.push(items[item]);
                            }
                        }
                    }
                }
                ;
                return filtered;
            };
        })
        .filter('customOrdering', function ($filter) {
        
	        return function(items, column , reverse, tableColumns ,initialSorting,initialSortingAsc) {
	        	function getfiltered(){
	        		var tmp=[];
	        		angular.forEach(items, function(item) {
			            tmp.push(item);
			          });
	        		return tmp;
	        	}
	        	
	        	if(column==undefined && initialSorting!=undefined){
	        		for(var i=0;i<tableColumns.length;i++){
	        			if(tableColumns[i].name== initialSorting){
	        				column=tableColumns[i];
	        				if(initialSortingAsc!=undefined){
	        					if(initialSortingAsc==true){
	        						reverse=true;
	        					}
	        				}
	        				break;
	        			}
	        		}
	        	}
		          if(column!=undefined && column.comparatorFunction!=undefined ){
		        	  var filtered = getfiltered();
			          filtered.sort(function (a, b) {   
			        	  return column.comparatorFunction(a,b);
			          });
			          if(reverse){
			        	  filtered.reverse();
			          }
			          return filtered;
		        }else if(column!=undefined && column.comparatorColumn!=undefined ){
		        	return	$filter('orderBy')(items, column.comparatorColumn , reverse)
		        }else{ 
		        	if(column!=undefined){
		        		var str = JSON.stringify(column.name);
		        		return	$filter('orderBy')(items, str , reverse)
		        	}else{
		        		 var filtered = getfiltered();
		        		 if(reverse){
				        	  filtered.reverse();
				          }
				          return filtered;
		        	}
		        	
		        }
	        };
        });


function TableControllerFunction($scope, $timeout) {
    $scope.currentPageNumber = 1;
    $scope.tmpWordSearch = "";
    $scope.prevSearch = "";
    $scope.localSearch = false;
    $scope.searchFastVal = "";
    $scope.column_ordering;
    $scope.reverse_col_ord = false;
    $scope.internal_column_ordering;
    $scope.internal_reverse_col_ord = false;
    $scope.itemsPerPage=3; //initial value

    $scope.getDynamicValue=function(item,row,column){
    	if(item==null || item==undefined) return ;
    	
    	return angular.isFunction(item) ? item(row,column) : item;
    }
    
    $scope.searchItem = function (searchVal) {
        if ($scope.localSearch) {
            $scope.searchFastVal = searchVal;
        } else {
            $scope.tmpWordSearch = searchVal;
            $timeout(function () {
                if ($scope.tmpWordSearch != searchVal || $scope.prevSearch == searchVal) {
                    return;
                }
                $scope.prevSearch = searchVal;
                $scope.searchFunction({
                    searchValue: searchVal,
                    itemsPerPage: $scope.itemsPerPage,
                    currentPageNumber: $scope.currentPageNumber,
                    columnsSearch: $scope.columnsSearch,
                    columnOrdering: $scope.column_ordering,
                    reverseOrdering: $scope.reverse_col_ord
                });

            }, 1000);
        }
    };

    // pagination item
    $scope.changeWordItemPP = function () {

    	if($scope.box==undefined){
    		var box = angular.element(document.querySelector('angular-table.' + $scope.id + 'ItemBox'))[0]
    		if (box == undefined) {
    			return;
    		}
    		$scope.box=box;
    	}
    	
    	if($scope.tableContainer==undefined){
    		var tableContainer = angular.element(document.querySelector('angular-table.' + $scope.id + 'ItemBox #angularFullTableContentBox'))[0];
    		if (tableContainer != undefined) {
    			$scope.tableContainer=tableContainer;
    		}
    	}
    	
    	if($scope.headButton==undefined){
    		var headButton = angular.element(document.querySelector('angular-table.' + $scope.id + 'ItemBox table.fakeTable thead'))[0];
    		if (headButton != undefined) {
    			$scope.headButton=headButton;
    		}
    	}
    	
    	if($scope.listItemTemplBox==undefined){
    		var listItemTemplBox = angular.element(document.querySelector('angular-table.' + $scope.id + 'ItemBox table.principalTable tbody tr'))[0];
    		if (listItemTemplBox != undefined) {
    			$scope.listItemTemplBox=listItemTemplBox;
    		}
    	}


    	var tableContainerHeight = $scope.tableContainer == undefined ? 32 : $scope.tableContainer.offsetHeight;
        var headButtonHeight = $scope.headButton == undefined ? 0 : $scope.headButton.offsetHeight;
        var listItemTemplBoxHeight = $scope.listItemTemplBox == undefined ? 32 : $scope.listItemTemplBox.offsetHeight;


        var nit = parseInt((tableContainerHeight - headButtonHeight) / listItemTemplBoxHeight);

        $scope.itemsPerPage = (nit <= 0 || isNaN(nit)) ? 0 : nit;
        if (firstLoad) {
            $scope.pageChangedFunction({
                searchValue: "",
                itemsPerPage: $scope.itemsPerPage,
                currentPageNumber: $scope.currentPageNumber,
                columnsSearch: $scope.columnsSearch,
                columnOrdering: $scope.column_ordering,
                reverseOrdering: $scope.reverse_col_ord
            });
            firstLoad = false;
        }
    };
    var firstLoad = true;
    $timeout(function () {
        if ($scope.noPagination != true) {
            $scope.changeWordItemPP();
        }
    }, 0);

  
    $scope.$watch(function(){
    	 var elem = angular.element(document.querySelector('angular-table.' + $scope.id + 'ItemBox'))[0];
         var boxHeight= elem == undefined ? null : elem.offsetHeight;
         var itemNumber= $scope.ngModel==undefined ? 0 : $scope.ngModel.length;
         
         if($scope.enableChangeDetector){
        	 return {items:itemNumber,height:boxHeight,ngModel:$scope.ngModel};
         }else{
        	 return {items:itemNumber,height:boxHeight};
         }
         
//    	return {items:itemNumber,height:boxHeight};
    }, function(newValue,oldValue){
    	if ($scope.noPagination != true &&( newValue.items != 0 ||  newValue.height != 0)) {
	    	if(newValue!=oldValue){
	    		$timeout(function(){
	    			$scope.changeWordItemPP();
	    			},0) 
	    	}
    	}
    	
    	if($scope.enableChangeDetector && !angular.equals(oldValue.ngModel,newValue.ngModel)){
    		$scope.changeDetectorFunction(newValue.ngModel,oldValue.ngModel);
   		 	$timeout(function(){
   		 		$scope.clearChangeItemStyle();
   		 	},7000)
   	}
    },true);
    
    $scope.$watchCollection('columns', function (newValue, oldValue) {
        if (!angular.equals(newValue, oldValue)) {
            $scope.initializeColumns();
        }
    });
    
    
   
$scope.loadTheadColumn=function(){
 
    $timeout(function(){
    	var width=$scope.getPrincipalTableHeadWidth();
    	var tableContentBox=angular.element(document.querySelectorAll('angular-table.' + $scope.id + 'ItemBox #angularTableContentBox'));
    	var fakeDiv = angular.element(document.querySelectorAll('angular-table.' + $scope.id + 'ItemBox .faketable th>div'));
        var principalThDiv = angular.element(document.querySelectorAll('angular-table.' + $scope.id + 'ItemBox .principalTable th>div'));
        for(var i=0;i<principalThDiv.length;i++){
//        	console.log(principalThDiv[i])
        	angular.element(fakeDiv[i]).css("width",angular.element(principalThDiv[i])[0].offsetWidth+"px");
        }
        if(tableContentBox[0].offsetWidth!=width){
        	tableContentBox.css("width",width+"px");
        }
    },0)
    

}
 
	$scope.isVisibleRowFunction=function(row){
		
		if(row==undefined){
			return true;
		}
		var isVisible =$scope.visibleRowFunction({item:row}) ;
		
		return isVisible == undefined ? true : isVisible;
	}
	
	 $scope.clearChangeItemStyle=function(){
		 $scope.getChangedValueStyle=undefined;
		 $scope.detectorMap=angular.copy(emptyDetectorMap); 
    }
	 var emptyDetectorMap={edit:{},add:[]}
	 $scope.detectorMap=angular.copy(emptyDetectorMap); 
	 $scope.changeDetectorFunction=function(newVal,oldVal){
		 if(oldVal==undefined || oldVal.length==0){
			 return;
		 }
		 
		 var table1 = new daff.TableView(jsonToTable(oldVal));
		 var table2 = new daff.TableView(jsonToTable(newVal));
		 var data_diff = [];
		 var table_diff = new daff.TableView(data_diff);
		 var alignment = daff.compareTables(table1,table2).align();
		 var flags = new daff.CompareFlags();
		 flags.show_unchanged=true
		 var highlighter = new daff.TableDiff(alignment,flags);
		 highlighter.hilite(table_diff);
		 
		 var decIndex=0;
		 var columnArray=[];
		 angular.forEach(data_diff, function(value, index) {
			 if(!angular.equals(value[0],"@@") && !angular.equals(value[0],"!")){
				 var currRow=newVal[index-decIndex];
				 if(angular.equals(value[0],"->")){
					 //edited row
//					 $scope.detectorMap.edit.push(currRow);
					 
					 for(var i=1;i<value.length;i++){
						 
						 if(angular.isString(value[i]) && value[i].split("->").length>1){
							 $scope.columns[i];
							 if($scope.detectorMap.edit[columnArray[i]]==undefined){
								 $scope.detectorMap.edit[columnArray[i]]=[];
							 }
							 $scope.detectorMap.edit[columnArray[i]].push(currRow);
						 }
					 }
					 
					 
					 $scope.detectorMap.edit.hasOwnProperty()
				 }else if(angular.equals(value[0],"---")) {
					 //removed row
					 decIndex++;
				 }else if(angular.equals(value[0],"+++")){
					 //added row
					 $scope.detectorMap.add.push(currRow);
				 }
			 }else{

				 if(angular.equals(value[0],"@@")){
					 //create column array
					 for(var i=0;i<value.length;i++){
						 columnArray.push(value[i]);
					 }
				 }
				 
				 decIndex++;
			 }
		 });
		 if(!angular.equals($scope.detectorMap,emptyDetectorMap)){
			 $scope.getChangedValueStyle=function(row,col){
				 var rind= $scope.detectorMap.edit[col]==undefined ? -1:  $scope.detectorMap.edit[col].indexOf(row);
				 if(rind!=-1){
					 return "editCell";
				 }
				 var rind= $scope.detectorMap.add.indexOf(row);
				 if(rind!=-1){
					 return "addCell";
				 }
			 }
		 }else{
			 $scope.getChangedValueStyle=undefined;
		 }
	 }
	 
	 $scope.getChangedValueStyle=undefined;
	 
	 function jsonToTable(jsarr){
		 var toRet=[]
		 angular.forEach(jsarr, function(arrValue, arrKey) {
			 var tmpToRet=[];
			 if(arrKey==0){
			 //create the first item with column name
			 var colname=[];
			 angular.forEach(arrValue, function(colVal, colName) {
					 this.push(colName)
				},colname);
			 this.push(colname);
			 }
			 
			 //create all row
			 angular.forEach(arrValue, function(objValue, objKey) {
					 this.push(objValue)
				},tmpToRet);
			 this.push(tmpToRet);
			},toRet);
		 return toRet;
		 
	 }
}

function TableBodyControllerFunction($scope) {
	
    $scope.clickItem = function (row, cell, evt,index) {
        if ($scope.multiSelect) {
            $scope.toggleMultiSelect(row, evt);
        } else {
            $scope.selectedItem = row;
        }

        $scope.clickFunction({
            item: row,
            cell: cell,
            listId: $scope.id,
            row: row,
            column: cell,
            index:index,
            evt:evt
        });
    };

    $scope.toggleMultiSelect = function (row, evt) {
        evt.stopPropagation();
        var index = $scope.indexInList($scope.selectedItem, row);
        if (index > -1) {
            $scope.selectedItem.splice(index, 1);
        } else {
            $scope.selectedItem.push(row);
        }
    };

    $scope.indexInList = function (list, item) {
        for (var i = 0; i < list.length; i++) {
        	if($scope.comparisonColumn==undefined){
	            if (angular.equals(list[i], item)) {
	                return i;
	            }
        	}else{
        		 if (angular.equals(list[i][$scope.comparisonColumn], item[$scope.comparisonColumn])) {
 	                return i;
 	            }
        	}
        }
        return -1;
    };

    $scope.isSelected = function (item) {
        if ($scope.multiSelect) {
            return $scope.indexInList($scope.selectedItem, item) > -1;

        } else {
            return angular.equals($scope.selectedItem, item);
        }

    };

    var oldObject = [];
    $scope.editingMap = {};

    $scope.checkIfEditable = function (row, column, cell, evt) {
        var allowEdit = $scope.allowEdit && column.editable;
        if ($scope.allowEditFunction) {
            allowEdit = allowEdit && $scope.allowEditFunction({
                item: row,
                cell: cell,
                listId: $scope.id,
                row: row,
                column: column
            });
        }
        return allowEdit;
    };

    $scope.startEdit = function (row, column, cell, evt) {
        var allowEdit = $scope.checkIfEditable(row, column, cell, evt);
        if (allowEdit && oldObject.length < 1) {
            oldObject.push(angular.copy(row));
            row.editing = true;
        }
    };

    $scope.doneEdit = function (row, column, cell, evt) {
        if (row.editing) {
            row.editing = undefined;
            var oldObj = oldObject.pop();
            if (!angular.equals(row, oldObj)) {
                if ($scope.editFunction) {
                    var response = $scope.editFunction({
                        item: row,
                        itemOld: oldObj,
                        cell: cell,
                        listId: $scope.id,
                        row: row,
                        column: cell
                    });
                    //check which type is the response. Could be either boolean or promise
                    if (typeof response == "boolean" && response == false) {
                        for (var k in row) {
                            row[k] = angular.copy(oldObject.row[k]);
                        }
                    } else if (typeof response == "object" && typeof response.then == "function") {
                        response.then(
                                function () {
                                },
                                function () {
                                    for (var k in row) {
                                        row[k] = angular.copy(oldObj[k]);
                                    }
                                }
                        );
                    }
                }
            }
        }
    };
    $scope.showRowDetail=function(ev){
    	var vis= angular.element(ev.currentTarget.parentElement.parentElement).scope().visible;
    	angular.element(ev.currentTarget.parentElement.parentElement).scope().visible = (vis!=true);
    }
}

function TableHeaderControllerFunction($scope, $timeout) {
    $scope.multiSelectVal = false;
    $scope.selectAll = function () {
        $scope.multiSelectVal = !$scope.multiSelectVal;
        var template = angular.element(document.querySelector("angular-table." + $scope.id + "ItemBox"));
        var table = angular.element(template[0].querySelector("table.principalTable"));
        var tbody = angular.element(table[0].querySelector("tbody"));
        var rows = tbody[0].children;

        var j = 0;
        for (var i = 0; i < rows.length; i++) {
            $timeout(function () {
                var checkCol = angular.element(rows[j].querySelector('td'));
                j++;

                if (checkCol[0].querySelector('md-checkbox').checked != $scope.multiSelectVal) {
                    checkCol.triggerHandler('click');
                }
            }, 0);

        }
    };

    $scope.orderBy = function (column) {
    	
    	if($scope.sortableColumn!=undefined && $scope.sortableColumn.indexOf(column.name)==-1){
    		return
    	}
    	
        if ($scope.column_ordering!=undefined && $scope.column_ordering.name == column.name) {
            $scope.reverse_col_ord = !$scope.reverse_col_ord;
        } else {
            $scope.column_ordering = column;
            $scope.reverse_col_ord = false;
        }

        if ($scope.localSearch) {
            $scope.internal_column_ordering = $scope.column_ordering;
            $scope.internal_reverse_col_ord = $scope.reverse_col_ord;
        } else {
            $scope.searchFunction({
                searchValue: $scope.prevSearch,
                itemsPerPage: $scope.itemsPerPage,
                columnsSearch: $scope.columnsSearch,
                columnOrdering: $scope.column_ordering,
                reverseOrdering: $scope.reverse_col_ord
            });
        }
    };
    
    $scope.getColumnValue=function(row,columnName,columnTransformationText){
    	
    	var splname=columnName.split(".");
    	var toReturn="";
    	if(splname.length>1){
    		var tmpVal=row[splname[0]];
    		for(var i=1;i<splname.length;i++){
    			if(tmpVal!=null && tmpVal!=undefined){
    				 tmpVal=tmpVal[splname[i]];
    			}
//    			else{
//    				return "";
//    				}
    			
    		}
    		toReturn= tmpVal;
    	}else{
    		toReturn= row[columnName];
    	}
    	
    	if(columnTransformationText==undefined){
    		return toReturn;
    	}else{
    		//apply filter
    		return columnTransformationText(toReturn,row,columnName);
    	}
    }
}