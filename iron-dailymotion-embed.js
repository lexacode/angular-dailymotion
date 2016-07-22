angular.module('ironDailymotionEmbed', []).factory('ironDailymotionService', ['$http', '$q', '$window', '$document', function ($http, $q, $window, $document) {
    'use strict';
    var dm;
    return {
        loadSdk: function () {
            if (!$window.DM) {
                var deferred = $q.defer();
                // Handler when the Dailymotion SDK is ready.
                $window.dmAsyncInit = function () {
                    $window.DM.init({apiKey: '', status: true, cookie: true});
                    deferred.resolve($window.DM);
                };
                // Loading the Dailymotion SDK
                (function () {
                    var e = $document[0].createElement('script');
                    e.async = true;
                    e.src = 'https://api.dmcdn.net/all.js';

                    var s = $document[0].getElementsByTagName('script')[0];
                    s.parentNode.insertBefore(e, s);
                }());
                dm = deferred.promise;
            } else {
                dm = $window.DM;
            }
            return $q.when(dm);
        },
        getVideo: function (videoId, fields) {
            if (angular.isString(fields)) {
                fields = [fields];
            }
            if (angular.isArray(fields)) {
                fields = fields.join(',');
            }
            return $http.get('https://api.dailymotion.com/video/' + videoId, {
                params: {fields: fields}
            }).then(function (response) {
                return response.data;
            });
        }
    };
}]).directive('ironDailymotionEmbed', [function () {
    return {
        restrict: 'E',
        scope: {},
        bindToController: {
            videoId: '=',
            player: '=?',
            onApiready: '&',
            onPlay: '&',
            onPause: '&',
            onEnd: '&',
            onSeeked: '&'
        },
        controllerAs: '$ctrl',
        controller: ['$element', '$rootScope', 'ironDailymotionService', function ($element, $rootScope, ironDailymotionService) {
            var $ctrl = this;
            // Load the SDK for use the Player API.
            ironDailymotionService.loadSdk().then(function (DM) {
                // Exposed player
                $ctrl.player = DM.player($element[0], {
                    video: $ctrl.videoId
                });

                // Register event listeners for next events
                angular.forEach([
                    'apiready',
                    'play',
                    'pause',
                    'end',
                    'seeked'
                ], function (event) {
                    $ctrl.player.addEventListener(event, function (event) {
                        // Handle messages received from the player
                        $rootScope.$apply(function () {
                            // converts 'pause' event name to onPause handler name.
                            $ctrl['on' + event.type.substr(0, 1).toUpperCase() + event.type.substr(1)]({data: event});
                        });
                    });
                });
            });
        }]
    };
}]);
