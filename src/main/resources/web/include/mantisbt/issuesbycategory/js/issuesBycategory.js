/*
 * Copyright 2020 XEBIALABS
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
'use strict';

(function () {

    var mantisbtTileViewController = function($scope, ptService, XlrTileHelper) {
        
        var vm = this;

        vm.tileConfigurationIsPopulated = tileConfigurationIsPopulated;

        vm.issuesSummaryData = {
            count: 0,
            categories: []
        };

        vm.issues=[];
        
        vm.colors = {};
        vm.colors.plugins = '#ffd025';
        vm.colors.other = '#009cd8';
        vm.colors.administration = '#991C71';
        vm.colors.security = '#008771';
        vm.colors.auditing = '#CC0099';
        vm.colors.feature = '#FF9933'
        vm.colors.ui = '#FF0000'

        vm.chartOptions = {
            topTitleText: function(data){
                return data.count;
            },
            bottomTitleText: function(data){
                if(data.count > 1){
                    return "categories";
                } else {
                    return "category";
                }
            },
            series: function (data) {
                var result= [];
                data.categories.forEach(function(item, index, array){
                    result.push({
                        y: item.count,
                        name: item.category,
                        color: vm.colors[item.category]
                    })
                });
                return [{ data: result }]; 
                },
            showLegend: false,
            donutThickness: '60%'
        };

        vm.gridOptions = {
            enableFiltering: false,
            columnDefs:[{ 
                field: 'id',
                displayName: 'ID',
                cellTemplate: '<div><a ng-href="{{row.entity.url}}">{{row.entity.id}}</a></div>',
                enableColumnMenu: false
            },{ 
                field: 'project',
                displayName: 'Project',
                cellTemplate: '<div><a ng-href="{{row.entity.url}}">{{row.entity.project}}</a></div>',
                enableColumnMenu: false
            },{ 
                field: 'summary',
                displayName: 'Summary',
                enableColumnMenu: false
            },{ 
                field: 'category',
                displayName: 'Category',
                enableColumnMenu: false
            },{ 
                field: 'status',
                displayName: 'Status',
                enableColumnMenu: false
            },{ 
                field: 'severity',
                displayName: 'Severity',
                enableColumnMenu: false
            }
        ],
            data: []
        };
    
        function tileConfigurationIsPopulated() {
            const config = vm.tile.properties;
            if (!_.isEmpty(config.issueIds.variable) && !_.isEmpty(config.mantisbtServer)) {
                return true;
            }
            if (!_.isEmpty(config.issueIds.value) && !_.isEmpty(config.mantisbtServer)) {
                return true;
            }
            return false;
        }
        
        function refresh() {
            load({params: {refresh: true}});
        }
        
        function load(config) {
            if (vm.tileConfigurationIsPopulated()) {
                vm.loading = true;
                ptService.executeQuery(vm.tile.id, config).then(
                    function(response) {
                        mapResponseToUi(response);
                    })
                    .finally(
                        function() {
                            vm.loading = false;
                    });
            }
        }
        
        function mapResponseToUi(response) {
            var data = response.data.data;
            vm.issues = data.issues;

            vm.issuesSummaryData = {
                count: data.count,
                categories: data.categories,
            };

            vm.issuesSummaryData.categories.forEach(function(value, index) {
                vm.issuesSummaryData.categories[index].color = vm.colors[value.category];
            });

            vm.issues.forEach(function(issue, index){
                vm.gridOptions.data[index] = {
                    id: issue['id'],
                    project: issue['project'],
                    summary: issue['summary'],
                    category: issue['category'],
                    status: issue['status'],
                    severity: issue['severity'],
                    url: 'http://localhost:8989/view.php?id=' + issue['id']
                };
            });

        }
        
        vm.$onInit = function () {
            if ($scope.xlrDashboard) {
                // summary page
                vm.release = $scope.xlrDashboard.release;
                vm.tile = $scope.xlrTile.tile;
                if (vm.tile.properties == null) {
                    vm.config = vm.tile.configurationProperties;
                } else {
                    // new style since 7.0
                    vm.config = vm.tile.properties;
                }
            } else {
                // detail page
                vm.release = $scope.xlrTileDetailsCtrl.release;
                vm.tile = $scope.xlrTileDetailsCtrl.tile;
            }
            load();
        };
        vm.refresh = refresh;

    };
    
    var mantisbtService = function(Backend) {
        function executeQuery(tileId, config) {
            return Backend.get("tiles/" + tileId + "/data", config);
        }
        return   {
            executeQuery : executeQuery
        };
    }
    
    mantisbtService.$inject = ['Backend'];
    mantisbtTileViewController.$inject = ['$scope', 'xlrelease.mantisbt.mantisbtService', 'XlrTileHelper'];
    
    angular.module('xlrelease.mantisbt.tile', [])
        .service('xlrelease.mantisbt.mantisbtService', mantisbtService)
        .controller('mantisbt.TileViewController', mantisbtTileViewController);
    
})();