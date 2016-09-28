/**
 * Knowage, Open Source Business Intelligence suite
 * Copyright (C) 2016 Engineering Ingegneria Informatica S.p.A.
 * 
 * Knowage is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Knowage is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var datasetModule = angular.module('datasetModule', ['ngMaterial','angular-list-detail', 'sbiModule', 'angular_table']);

datasetModule.config(['$mdThemingProvider', function($mdThemingProvider) {
	$mdThemingProvider.theme('knowage')
	$mdThemingProvider.setDefaultTheme('knowage');
}]);

datasetModule.controller('datasetController', ["$scope","$log", "sbiModule_translate", "sbiModule_restServices", "sbiModule_messaging", "$mdDialog", datasetFunction]);

function datasetFunction($scope, $log, sbiModule_translate, sbiModule_restServices, sbiModule_messaging, $mdDialog){
	
	translate = sbiModule_translate;
	var translate = translate;
	
	$scope.dataSetListColumns = [
	    {"label":translate.load("sbi.generic.name"),"name":"name"},
	    {"label":translate.load("sbi.generic.label"),"name":"label"},
	    {"label":translate.load("sbi.generic.type"), "name":"dsTypeCd"},
	    {"label":translate.load("sbi.ds.numDocs"), "name":"usedByNDocs"}
    ];
	
	$scope.selectedDatasetVersion = null;
	
	/**
	 * The 'datasetsListPersisted' is the initial and DB aligned dataset list (collection) is needed when dealing with not
	 * yet saved dataset items (when cloning existing or creating new datasets, as well as when performing their removal
	 * from the AT). The 'datasetsListTemp' contains the current AT state.
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.datasetsListTemp = [];
	$scope.datasetsListPersisted = [];
	
	/*
	 * 	service that loads all datasets
	 *   																	
	 */
	$scope.loadAllDatasets = function(){
		sbiModule_restServices.promiseGet("1.0/datasets","")
			.then(function(response) {
				$scope.datasetsListTemp = response.data.root;
				$scope.datasetsListPersisted = angular.copy($scope.datasetsListTemp);
			}, function(response) {
				sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
			});
	}
	
	$scope.loadAllDatasets();	
	
	/**
	 * Speed-menu option configuration for deleting of a dataset.
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.manageDataset = 
	[
	 	// Delete the dataset.
	 	{
	 		label: translate.load("sbi.ds.deletedataset"),
		 	icon:'fa fa-trash' ,
		 	backgroundColor:'transparent',
	   
		 	action: function(item,event) {
		 				 		
		 		if (item.label!="..." && item.label!="") {
		 			
		 			var confirm = $mdDialog.confirm()
		 	          .title(translate.load('sbi.ds.deletedataset'))
		 	          .targetEvent(event)	 	          
		 	          .textContent(translate.format(translate.load('sbi.ds.deletedataset.msg'), item.label))
		 	          .ariaLabel("Delete dataset")
		 	          .ok(translate.load("sbi.general.yes"))
		 	          .cancel(translate.load("sbi.general.No"));
		 			
		 			$mdDialog
		 				.show(confirm)
		 				.then(
		 						
		 						function() {
		 							
		 							sbiModule_restServices.promiseDelete("1.0/datasets", item.label, "/")
			 							.then(
			 									function(response) {
			 					
			 						   				sbiModule_messaging.showSuccessMessage(translate.format(translate.load('sbi.ds.deletedataset.success'), item.label));
			 						   				
			 						   				// If the dataset that is deleted is selected, deselect it and hence close its details.
			 						   				if ($scope.selectedDataSet && $scope.selectedDataSet.label == item.label) {
			 						   					$scope.selectedDataSet = null;			   					
			 						   				}
			 						   				
			 						   				// Find the dataset, that is deleted on the server-side, in the array of all datasets and remove it from the array.
			 						   				for (var i=0; i<$scope.datasetsListTemp.length; i++) {			   					
			 						   					if ($scope.datasetsListTemp[i].label == item.label) {
			 						   						$scope.datasetsListTemp.splice(i,1);
			 						   					}			   					
			 						   				}
			 						
			 						   			}, 
			 						   			
			 						   			function(response) {	
			 						   				
			 						   				// If there is a message that is provided when attempting to delete a dataset that is used in some documents.
				 					   				if (response.data && response.data.errors && Array.isArray(response.data.errors)) {
				 					   					sbiModule_messaging.showErrorMessage(response.data.errors[0].message);
				 					   				}
				 					   				else {
				 					   					sbiModule_messaging.showErrorMessage(translate.format(translate.load('sbi.ds.deletedataset.error'), item.label));
				 					   				}
			 						   				
			 						   			}
			 								);
		 							
		 						},
		 						
		 						function() {
		 							
		 						}
		 						
	 						);
			 		}
		 			else {
		 						 				
		 				var confirm = $mdDialog.confirm()
			 	          .title(translate.load('sbi.ds.deletedataset'))
			 	          .targetEvent(event)	 	          
			 	          .textContent(translate.load('sbi.ds.deletedataset.notsaved.msg'))
			 	          .ariaLabel("Delete dataset")
			 	          .ok(translate.load("sbi.general.yes"))
			 	          .cancel(translate.load("sbi.general.No"));
			 			
			 			$mdDialog
			 				.show(confirm)
			 				.then(		 						
			 						function() { 			 							
			 							$scope.datasetsListTemp.splice($scope.datasetsListTemp.length-1,1);			 					 		
			 						}, 
			 						
			 						function(){} 
		 						);
		 				
		 			}
		 		}
	 			
		 	} ,
		 	
		 	// Clone the dataset.
		 	{
		 		label: translate.load("sbi.ds.clone.tooltip"),
			 	icon:'fa fa-files-o' , // alternative: 'fa fa-clone'
			 	backgroundColor:'transparent',
		   
			 	action: function(item,event) {
			 		
			 		var datasetClone = angular.copy(item);	
			 		
			 		datasetClone.label = "...";
			 		datasetClone.dsVersions = [];
			 		datasetClone.usedByNDocs = 0;
			 		$scope.datasetsListTemp.push(datasetClone);
			 		$scope.selectedDataSet = $scope.datasetsListTemp[$scope.datasetsListTemp.length-1];
		 			
			 	} 
		 	}
 		 	
	 ];
	
	/**
	 * Speed-menu option configuration for deleting of a dataset version.
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.manageVersion = 
	[ 
	 	// Speed-menu option for deleting a dataset version.
     	{	           
			label: translate.load("sbi.ds.deleteVersion"),
	 		icon:'fa fa-trash' ,
	 		backgroundColor:'transparent',
	           
	 		action: function(item,event) {
	 				 			
	 			var confirm = $mdDialog.confirm()
	 	          .title(translate.load('sbi.ds.version.delete.title'))
	 	          .targetEvent(event)	 	          
	 	          .textContent(translate.format(translate.load('sbi.ds.version.delete.msg'), item.versNum))
	 	          .ariaLabel("Delete dataset version")
	 	          .ok(translate.load("sbi.general.yes"))
	 	          .cancel(translate.load("sbi.general.No"));
	 			
	 			$mdDialog
	 				.show(confirm)
	 				.then(
	 						
	 					function() {
	 						
	 						sbiModule_restServices.promiseDelete("1.0/datasets", $scope.selectedDataSet.id+"/version/"+item.versNum,"/")
		 		   				.then(
		 		   						function(response) {
		 		   						
		 					   				sbiModule_messaging.showSuccessMessage(translate.format(translate.load('sbi.ds.version.delete.success'), item.versNum));
		 					   				
		 					   				for (var j=0; j<$scope.datasetsListTemp.length; j++) {
		 					   					
		 					   					if ($scope.selectedDataSet.id == $scope.datasetsListTemp[j].id) {
		 					
		 					   						for (var i=0; i<$scope.selectedDataSet.dsVersions.length; i++) {
		 					   							
		 					   							if (item.versNum == $scope.selectedDataSet.dsVersions[i].versNum) {		 					   								
		 					   								// Remove the dataset's version from the collection of all datasets (the array in the left angular-table).
		 					   								$scope.datasetsListTemp[j].dsVersions.splice(i,1);
		 					   								// Remove the version from the currently selected dataset (the item in the left angular-table).
		 					   								$scope.selectedDataSet.dsVersions.splice(i,1);//		 					   								
		 					   								break;
		 					   								
		 					   							}
		 					   								
		 					   						}
		 					   						
		 					   					}
		 					   				}   				
		 	   
		 					   			}, 
		 					   			
		 					   			function(response) {	
		 					   				sbiModule_messaging.showErrorMessage(translate.format(translate.load('sbi.ds.version.delete.error'), item.versNum));
		 					   			}
		 			   			);
	 						
	 					},
	 					
	 					function() {
	 					}
	 				
	 				);
	 			
           }
     	
     	},
     	
     	// Speed-menu option for restoring a dataset version.
     	{
     		label: translate.load('sbi.ds.restore'),
     		icon:'fa fa-retweet' ,
	 		backgroundColor:'transparent',     		
     		
     		action: function(item,event) {
     			
     			var confirm = $mdDialog.confirm()
	 	          .title(translate.load('sbi.ds.version.restore.title'))
	 	          .targetEvent(event)	 	          
	 	          .textContent(translate.format(translate.load('sbi.ds.version.restore.msg'), item.versNum))
	 	          .ariaLabel("Restore dataset version")
	 	          .ok(translate.load("sbi.general.yes"))
	 	          .cancel(translate.load("sbi.general.No"));
	 			
	 			$mdDialog
	 				.show(confirm)
	 				.then(	 						
		 					function() {
		 						
		 						sbiModule_restServices.promiseGet("1.0/datasets", $scope.selectedDataSet.id + "/restore", "versionId=" + item.versNum)
			 		   				.then(
			 		   						function(response) {
			 		   						
			 					   				sbiModule_messaging.showSuccessMessage(translate.format(translate.load('sbi.ds.version.restore.success'), item.versNum),500);
			 					   				
			 					   				for (var i=0; i<$scope.datasetsListTemp.length; i++) {
			 					   					
			 					   					if ($scope.selectedDataSet.id == $scope.datasetsListTemp[i].id) {			 					   						
			 					   						// Remove the dataset's version from the collection of all datasets (the array in the left angular-table).
	 					   								$scope.datasetsListTemp[i] = response.data[0];
	 					   								// Remove the version from the currently selected dataset (the item in the left angular-table).
	 					   								$scope.selectedDataSet = response.data[0];			 					   						
			 					   					}
			 					   					
			 					   				}   				
			 	   
			 					   			}, 
			 					   			
			 					   			function(response) {
			 					   				//sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
			 					   				sbiModule_messaging.showErrorMessage(translate.format(translate.load('sbi.ds.version.restore.error'), item.versNum));
			 					   			}
			 			   			);
		 					},
		 					
		 					function() {
		 						
		 					}		 					
	 					);
     			
     		}
     	
     	}
     	
   ];
	
	// @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	$scope.deleteAllDatasetVersions = function() {
				
		if ($scope.selectedDataSet.dsVersions && Array.isArray($scope.selectedDataSet.dsVersions) && $scope.selectedDataSet.dsVersions.length>0) {
						
			var confirm = $mdDialog.confirm()
	          .title(translate.load('sbi.ds.allversions.delete.title')) 	          
	          .textContent(translate.load('sbi.ds.allversions.delete.msg'))
	          .ariaLabel("Delete all dataset versions")
	          .ok(translate.load("sbi.general.yes"))
	          .cancel(translate.load("sbi.general.No"));
			
			$mdDialog
				.show(confirm)
				.then(	 						
						function() {
			
							sbiModule_restServices.promiseDelete("1.0/datasets", $scope.selectedDataSet.id+"/allversions","/")
								.then(
										function(response) {
										
							   				sbiModule_messaging.showSuccessMessage(translate.load('sbi.ds.allversions.delete.success'));
							   				
							   				for (var j=0; j<=$scope.datasetsListTemp.length; j++) {
							   					
							   					if ($scope.datasetsListTemp[j] && $scope.selectedDataSet && $scope.selectedDataSet.id == $scope.datasetsListTemp[j].id) {	
							   						$scope.datasetsListTemp[j].dsVersions.splice(0,$scope.selectedDataSet.dsVersions.length);
													$scope.selectedDataSet.dsVersions.splice(0,$scope.selectedDataSet.dsVersions.length);	   						
							   					}
							   				}	
					
							   			}, 
							   			
							   			function(response) {							   				
							   				sbiModule_messaging.showErrorMessage(translate.load('sbi.ds.allversions.delete.error'));
							   			}
								);
						},
						
						function() {
							
						}
					);
			
		}
		else {
			
			$mdDialog
				.show(
						$mdDialog.alert()
					        .clickOutsideToClose(true)
					        .title('Dataset has no versions to delete')
					        .textContent('There are not dataset versions to delete for the selected dataset')
					        .ariaLabel('Dataset versions do not exist')
					        .ok('Ok')
				    );
			
		}
		
	}
	
	// @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	$scope.selectDatasetVersion = function(item) {			
		$scope.selectedDatasetVersion = item;
	}
	
	/*
	 * 	service that loads all data sources
	 *   																	
	 */
	$scope.loadAllDataSources = function(){
		sbiModule_restServices.promiseGet("2.0/datasources", "")
		.then(function(response) {
			$scope.dataSourceList = response.data;
		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
		});
	}
	
	$scope.loadAllDataSources();
	
	/*
	 * 	@GET service that gets domain types for
	 *  scope 																	
	 */
	$scope.getDomainTypeScope = function(){	
		sbiModule_restServices.promiseGet("domains","listValueDescriptionByType","DOMAIN_TYPE=DS_SCOPE")
		.then(function(response) {
			$scope.scopeList = response.data;
		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
		});
	}
	
	$scope.getDomainTypeScope();
	
	/*
	 * 	@GET service that gets domain types for
	 *  category 																	
	 */
	$scope.getDomainTypeCategory = function(){	
		sbiModule_restServices.promiseGet("domains","listValueDescriptionByType","DOMAIN_TYPE=CATEGORY_TYPE")
		.then(function(response) {
			$scope.categoryList = response.data;
		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message,'Error');
		});
	}
	
	$scope.getDomainTypeCategory();
	
	/*
	 * 	@GET service that gets domain types for
	 *  dataset types 																	
	 */
	$scope.getDomainTypeDataset = function(){	
		sbiModule_restServices.promiseGet("domains", "listValueDescriptionByType","DOMAIN_TYPE=DATA_SET_TYPE")
		.then(function(response) {
			$scope.datasetTypeList = response.data;
		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
		});
	}
	
	$scope.getDomainTypeDataset();
	
	 /**
	  * Adds variable map(name,value) object to scenario property array variable.
	  */
	 $scope.addParameters = function(){ 
			var param={};
			if($scope.selectedDataSet.parameters==undefined){
				$scope.selectedDataSet.parameters = [];
			}
			$scope.selectedDataSet.parameters.push(param);
			console.log($scope.selectedDataSet.parameters);
			return param;
	 }
	 
	 /**
	  * Removes selected variable from array property of $scope.scenario object.
	  */
	 $scope.removeParameter=function(param){
			var index=$scope.selectedDataSet.parameters.indexOf(param);		
			$scope.selectedDataSet.parameters.splice(index, 1);
			console.log($scope.selectedDataSet.parameters);
	 }
	
	$scope.loadDataSet = function(item) {
//		$log.info(item);
		$scope.selectedDataSet = angular.copy(item);
	};
	
	$scope.createNewDataSet = function() {
//		$log.info("create");
		
		var object = {
				actions: "",
				catTypeId:"",
				catTypeVn:"",
				dataSource:"",
				dateIn:"",
				description:"",
				dsTypeCd:"",
				dsVersions:"",
				id:"",
				isPersisted:"",
				isPersistedHDFS:"",
				label:"",
				meta:"",
				name:"",
				owner:"",
				pars:"",
				persistTableName:"",
				pivotIsNumRows:"",
				query:"",
				queryScript:"",
				queryScriptLanguage:"",
				scopeCd:"",
				scopeId:"",
				usedByNDocs:"",
				userIn:"",
				versNum:""
		}
		
		$scope.datasetsListTemp.push(object);
		$scope.selectedDataSet = $scope.datasetsListTemp[$scope.datasetsListTemp.length-1];
		
	};
	
	$scope.saveDataSet = function() {
		$log.info("save");
		// TODO: reset the $scope.datasetsListPersisted value as well
	};
	
	$scope.cancelDataSet = function() {
//		$log.info("cancel");
		$scope.selectedDataSet = null; // Reset the selection (none dataset item will be selected) (danristo)
	};
	
	$scope.previewDataset = function () {
		console.log("info")
	}
	
};