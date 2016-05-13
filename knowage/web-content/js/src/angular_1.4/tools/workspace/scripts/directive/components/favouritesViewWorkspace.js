angular
	.module('favourites_view_workspace', [])

	/**
	 * The HTML content of the Favorites view (favorite documents).
	 * @author Nikola Simović (nsimovic, nikola.simovic@mht.net)
	 */
	.directive('favoritesViewWorkspace', function () {
		 return {
		      restrict: 'E',
		      replace: 'true',
		      templateUrl: '/knowage/js/src/angular_1.4/tools/workspace/templates/favoritesViewWorkspace.html',
		      controller: favouritesController
		  };
	})

function favouritesController($scope,sbiModule_restServices,sbiModule_translate,sbiModule_user,$documentViewer){

	$scope.loadFavoriteDocumentExecutionsForUser =function(){
		sbiModule_restServices.promiseGet("2.0/favorites","")
		.then(function(response) {
			angular.copy(response.data,$scope.favoriteDocumentsList);
			$scope.favoriteDocumentsInitial = $scope.favoriteDocumentsList;
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.browser.folder.load.error'));
		});
	}
	$scope.loadFavoriteDocumentExecutionsForUser();

	$scope.deleteFavoriteDocumentExecutionById = function(doc) {
		sbiModule_restServices.promiseDelete("2.0/favorites",doc.id)
		.then(function(response) {
			$scope.loadFavoriteDocumentExecutionsForUser();
		},function(response) {
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.browser.folder.load.error'));
		});
	}
	
	$scope.favoriteSpeedMenu=[{
		label : sbiModule_translate.load('sbi.generic.run'),
		icon:'fa fa-play-circle' ,
		backgroundColor:'transparent',	
		action : function(item,event) {
			$scope.executeFavorite(item);
		}
	} ];
	
	$scope.executeFavorite = function(document) {	
		$documentViewer.openDocument(document.objId, document.documentLabel, document.documentName);
	}

}
