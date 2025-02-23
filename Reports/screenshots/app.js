var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "575981428104a1ebfd7cb20346758bbb",
        "instanceId": 22052,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584705646009,
                "type": ""
            }
        ],
        "screenShotFile": "009100b6-00b0-00ce-006b-00ab001b008e.png",
        "timestamp": 1584705645335,
        "duration": 753
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "575981428104a1ebfd7cb20346758bbb",
        "instanceId": 22052,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ba00f0-002a-00a5-001f-007400020026.png",
        "timestamp": 1584705646803,
        "duration": 2556
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "575981428104a1ebfd7cb20346758bbb",
        "instanceId": 22052,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "007c001d-0013-00a6-00ea-005a000c0084.png",
        "timestamp": 1584705649661,
        "duration": 357
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "575981428104a1ebfd7cb20346758bbb",
        "instanceId": 22052,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d1004c-004e-008b-0052-00e500ec00c0.png",
        "timestamp": 1584705650435,
        "duration": 484
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "81c3d7271bc8fadb54cbce244fb5e73a",
        "instanceId": 23524,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584705838426,
                "type": ""
            }
        ],
        "screenShotFile": "00ed0017-00c5-0029-0042-00ba00e20050.png",
        "timestamp": 1584705838048,
        "duration": 597
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "81c3d7271bc8fadb54cbce244fb5e73a",
        "instanceId": 23524,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ce00e5-006c-00ef-0004-007c00bd0029.png",
        "timestamp": 1584705839496,
        "duration": 2525
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "81c3d7271bc8fadb54cbce244fb5e73a",
        "instanceId": 23524,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "0068004f-002a-007e-001e-0004006e00d6.png",
        "timestamp": 1584705842409,
        "duration": 489
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "81c3d7271bc8fadb54cbce244fb5e73a",
        "instanceId": 23524,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00d700b2-00c0-006c-0037-00c100cc0016.png",
        "timestamp": 1584705843357,
        "duration": 557
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9cd9165c607ff32415af8243765c9024",
        "instanceId": 23056,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584705906825,
                "type": ""
            }
        ],
        "screenShotFile": "0099008a-00f6-00ba-00dd-00e7008c004f.png",
        "timestamp": 1584705906471,
        "duration": 570
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9cd9165c607ff32415af8243765c9024",
        "instanceId": 23056,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "006d00a9-0084-0001-00e6-00a900a400eb.png",
        "timestamp": 1584705907832,
        "duration": 2540
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "9cd9165c607ff32415af8243765c9024",
        "instanceId": 23056,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "001200ab-00d6-003a-00c7-007000e7006f.png",
        "timestamp": 1584705910676,
        "duration": 417
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "9cd9165c607ff32415af8243765c9024",
        "instanceId": 23056,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002f00ab-00c1-00d8-0021-00bc005d0063.png",
        "timestamp": 1584705911505,
        "duration": 609
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fc1ce73004ef200ecd303d86906fbf00",
        "instanceId": 3288,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584705956505,
                "type": ""
            }
        ],
        "screenShotFile": "00730078-0008-00f0-00fe-00d300ed0049.png",
        "timestamp": 1584705956198,
        "duration": 579
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fc1ce73004ef200ecd303d86906fbf00",
        "instanceId": 3288,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002a000a-008e-008d-00f7-006700110010.png",
        "timestamp": 1584705957425,
        "duration": 2554
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "fc1ce73004ef200ecd303d86906fbf00",
        "instanceId": 3288,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "006b0092-00aa-0005-0007-005000b4000a.png",
        "timestamp": 1584705960273,
        "duration": 428
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "fc1ce73004ef200ecd303d86906fbf00",
        "instanceId": 3288,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fd00a8-0040-0053-0045-0020006900e4.png",
        "timestamp": 1584705961117,
        "duration": 423
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "e52937ca3a6877b04807a2aec01e5a3f",
        "instanceId": 5308,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584706052326,
                "type": ""
            }
        ],
        "screenShotFile": "00b90052-002c-004e-00b8-005400990036.png",
        "timestamp": 1584706051952,
        "duration": 481
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "e52937ca3a6877b04807a2aec01e5a3f",
        "instanceId": 5308,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00440061-00ca-00f9-0076-00b100c900e8.png",
        "timestamp": 1584706053205,
        "duration": 2540
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "e52937ca3a6877b04807a2aec01e5a3f",
        "instanceId": 5308,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "005a0025-005b-00ad-0051-00e200660033.png",
        "timestamp": 1584706056084,
        "duration": 580
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "e52937ca3a6877b04807a2aec01e5a3f",
        "instanceId": 5308,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00130000-009a-0058-00cc-00e000240074.png",
        "timestamp": 1584706057114,
        "duration": 544
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "dc54bb822b969212376e220395ab3d57",
        "instanceId": 23516,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584706313924,
                "type": ""
            }
        ],
        "screenShotFile": "006e00b1-00a6-007a-0050-00f600da0089.png",
        "timestamp": 1584706312596,
        "duration": 1366
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "dc54bb822b969212376e220395ab3d57",
        "instanceId": 23516,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002400ab-0065-00c6-00d9-00c000260061.png",
        "timestamp": 1584706314820,
        "duration": 2801
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "dc54bb822b969212376e220395ab3d57",
        "instanceId": 23516,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00a90042-0032-00a4-0052-008900f60034.png",
        "timestamp": 1584706317914,
        "duration": 434
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "dc54bb822b969212376e220395ab3d57",
        "instanceId": 23516,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "002800a3-0038-0080-0021-0098001c00b8.png",
        "timestamp": 1584706318745,
        "duration": 537
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "30f26e12f35eb1b2be9ca7d9e7c5b497",
        "instanceId": 20068,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584941707523,
                "type": ""
            }
        ],
        "screenShotFile": "007100df-00b3-00a8-00dc-00b700300049.png",
        "timestamp": 1584941706457,
        "duration": 1076
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "30f26e12f35eb1b2be9ca7d9e7c5b497",
        "instanceId": 20068,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00070099-0014-0042-000d-0083006000f0.png",
        "timestamp": 1584941708664,
        "duration": 3095
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "30f26e12f35eb1b2be9ca7d9e7c5b497",
        "instanceId": 20068,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00a800c3-000a-00dc-000b-00fb00e00033.png",
        "timestamp": 1584941712258,
        "duration": 617
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "30f26e12f35eb1b2be9ca7d9e7c5b497",
        "instanceId": 20068,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00e00003-00fd-00a7-0059-0052006c00f6.png",
        "timestamp": 1584941713597,
        "duration": 690
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "349278a39cea78f3cbc2a8deb5d3a12b",
        "instanceId": 16220,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584951871204,
                "type": ""
            }
        ],
        "screenShotFile": "00ec002d-00d8-0038-00ea-0044001e0013.png",
        "timestamp": 1584951870171,
        "duration": 1264
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "349278a39cea78f3cbc2a8deb5d3a12b",
        "instanceId": 16220,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1584951872650,
        "duration": 2778
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "349278a39cea78f3cbc2a8deb5d3a12b",
        "instanceId": 16220,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown",
            "Failed: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: WebDriver.navigate().to(data:text/html,<html></html>)\n    at thenableWebDriverProxy.schedule (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at Navigation.to (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:1133:25)\n    at thenableWebDriverProxy.get (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:988:28)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:675:32\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run beforeEach in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:8:3)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:2:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)",
            "WebDriverError: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Protractor.waitForAngular() - Locator: by.binding(\"latest\")\n    at thenableWebDriverProxy.schedule (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at ProtractorBrowser.executeAsyncScript_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:425:28)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:456:33\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as getText] (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as getText] (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:25)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"should add four and six\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Function.next.fail (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4274:9)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:25:3)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:2:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [],
        "timestamp": 1584951889553,
        "duration": 28070
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "349278a39cea78f3cbc2a8deb5d3a12b",
        "instanceId": 16220,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown",
            "Failed: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "WebDriverError: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: WebDriver.navigate().to(data:text/html,<html></html>)\n    at thenableWebDriverProxy.schedule (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at Navigation.to (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:1133:25)\n    at thenableWebDriverProxy.get (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:988:28)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:675:32\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run beforeEach in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:8:3)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:2:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)",
            "WebDriverError: chrome not reachable\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.101', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Protractor.waitForAngular() - Locator: by.model(\"first\")\n    at thenableWebDriverProxy.schedule (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at ProtractorBrowser.executeAsyncScript_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:425:28)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:456:33\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)Error\n    at ElementArrayFinder.applyAction_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:459:27)\n    at ElementArrayFinder.<computed> [as sendKeys] (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:91:29)\n    at ElementFinder.<computed> [as sendKeys] (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\element.js:831:22)\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:31:17)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\nFrom: Task: Run it(\"should read the value from an input\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at Function.next.fail (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4274:9)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:30:3)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:2:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [],
        "timestamp": 1584951931691,
        "duration": 28058
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "52e9273538084d025374d86cd276e75f",
        "instanceId": 12004,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1584952494923,
                "type": ""
            }
        ],
        "screenShotFile": "0068000b-0056-001e-00f4-00710007002a.png",
        "timestamp": 1584952494248,
        "duration": 901
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "52e9273538084d025374d86cd276e75f",
        "instanceId": 12004,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00ce002d-00a8-0005-0004-000c00c2008f.png",
        "timestamp": 1584952495802,
        "duration": 2624
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "52e9273538084d025374d86cd276e75f",
        "instanceId": 12004,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00a4006f-0098-00f2-003f-005700e90065.png",
        "timestamp": 1584952498772,
        "duration": 347
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "52e9273538084d025374d86cd276e75f",
        "instanceId": 12004,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00b20008-0016-00f1-0015-00ea009100b9.png",
        "timestamp": 1584952499544,
        "duration": 629
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4ca286bb28b8793ef6fb74eed3e82e3d",
        "instanceId": 17944,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1585031233448,
                "type": ""
            }
        ],
        "screenShotFile": "00f10059-00f5-0016-007e-00bd00cb006f.png",
        "timestamp": 1585031232214,
        "duration": 1598
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4ca286bb28b8793ef6fb74eed3e82e3d",
        "instanceId": 17944,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "000a0027-0059-001e-005c-003400ad0010.png",
        "timestamp": 1585031235832,
        "duration": 2922
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "4ca286bb28b8793ef6fb74eed3e82e3d",
        "instanceId": 17944,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00d10004-00d0-00af-007a-0093009c0059.png",
        "timestamp": 1585031239243,
        "duration": 743
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "4ca286bb28b8793ef6fb74eed3e82e3d",
        "instanceId": 17944,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "008c000a-003d-00c6-00a7-0004005d00e8.png",
        "timestamp": 1585031240813,
        "duration": 796
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "537986e53b6887bb05f2f7a1bb40a74b",
        "instanceId": 16896,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1585031473546,
                "type": ""
            }
        ],
        "screenShotFile": "009f00e4-002e-008c-00ef-00af00bb00eb.png",
        "timestamp": 1585031472734,
        "duration": 1073
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "537986e53b6887bb05f2f7a1bb40a74b",
        "instanceId": 16896,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00df0095-003d-0097-00fc-002a004f00d4.png",
        "timestamp": 1585031474882,
        "duration": 3072
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "537986e53b6887bb05f2f7a1bb40a74b",
        "instanceId": 16896,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00be0088-00e3-002c-00c7-0095003c0094.png",
        "timestamp": 1585031478524,
        "duration": 697
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "537986e53b6887bb05f2f7a1bb40a74b",
        "instanceId": 16896,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "007f0026-00cd-0083-00b3-00d800d100cb.png",
        "timestamp": 1585031479858,
        "duration": 701
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8731cc24ba6fd7d9c6f6c3f10d768fdb",
        "instanceId": 15016,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1585047589327,
                "type": ""
            }
        ],
        "screenShotFile": "00da0013-001d-0075-00d0-0051003300a0.png",
        "timestamp": 1585047588922,
        "duration": 843
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8731cc24ba6fd7d9c6f6c3f10d768fdb",
        "instanceId": 15016,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00330077-0063-009b-0030-00c7003200d9.png",
        "timestamp": 1585047592307,
        "duration": 2726
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "8731cc24ba6fd7d9c6f6c3f10d768fdb",
        "instanceId": 15016,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00b60009-00e3-00a7-00e1-00a700f80007.png",
        "timestamp": 1585047595347,
        "duration": 514
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "8731cc24ba6fd7d9c6f6c3f10d768fdb",
        "instanceId": 15016,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00fd00fc-00bb-00df-0053-00f7005700a1.png",
        "timestamp": 1585047596296,
        "duration": 613
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "d54e48a448bc4f18618316cc286f6cc5",
        "instanceId": 1040,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1585205471018,
                "type": ""
            }
        ],
        "screenShotFile": "00230030-00f6-004d-00b4-0047001400da.png",
        "timestamp": 1585205470607,
        "duration": 641
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "d54e48a448bc4f18618316cc286f6cc5",
        "instanceId": 1040,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00380087-0085-0037-0036-004700ca0098.png",
        "timestamp": 1585205472169,
        "duration": 2738
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "d54e48a448bc4f18618316cc286f6cc5",
        "instanceId": 1040,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00a700ff-002d-0018-00de-003c00480043.png",
        "timestamp": 1585205475216,
        "duration": 442
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "d54e48a448bc4f18618316cc286f6cc5",
        "instanceId": 1040,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "00590017-0068-0049-003d-0018004100aa.png",
        "timestamp": 1585205476045,
        "duration": 449
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "d8694ca0d6d67d5b356c61be8e3b5dfa",
        "instanceId": 10348,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: Angular could not be found on the page https://yahoo.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://yahoo.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:720:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208454524,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208454550,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208454559,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208454564,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://yahoo.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208455461,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at https://yahoo.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208455461,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://analytics.yahoo.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208456115,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://yimg.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208456320,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://tribalfusion.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208457775,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at https://gumgum.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208458313,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at https://simpli.fi/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208458743,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://zorosrv.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208458743,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://subscription.omnithrottle.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208459273,
                "type": ""
            }
        ],
        "screenShotFile": "00cf0042-007b-0025-004b-00f700d70088.png",
        "timestamp": 1585208452626,
        "duration": 12997
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "d8694ca0d6d67d5b356c61be8e3b5dfa",
        "instanceId": 10348,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: Angular could not be found on the page https://https//www.facebook.com/.com. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://https//www.facebook.com/.com. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:720:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest1.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest1.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ff007d-00de-007a-00b4-006800880001.png",
        "timestamp": 1585208466462,
        "duration": 12840
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "3953bc071bf4ab96aca940a10eab3661",
        "instanceId": 6100,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: Angular could not be found on the page https://yahoo.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://yahoo.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:720:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208527844,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208527859,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208527870,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://s.yimg.com/rq/darla/3-24-1/js/g-r-min.js 0 Unrecognized feature: 'vr'.",
                "timestamp": 1585208527879,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://yahoo.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208529276,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at https://yahoo.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208529276,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://analytics.yahoo.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208529931,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://yimg.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208530153,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://tribalfusion.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208531698,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at https://simpli.fi/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208532016,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at https://gumgum.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208532016,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://zorosrv.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208532022,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://in.yahoo.com/?p=us - A cookie associated with a cross-site resource at http://subscription.omnithrottle.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208532942,
                "type": ""
            }
        ],
        "screenShotFile": "0051003c-0018-0075-005e-00fb009600ba.png",
        "timestamp": 1585208525837,
        "duration": 13801
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "3953bc071bf4ab96aca940a10eab3661",
        "instanceId": 6100,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: Angular could not be found on the page https://www.facebook.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://www.facebook.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:720:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest1.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Smoketest1.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.facebook.com/ - [DOM] Found 2 elements with non-unique id #locale: (More info: https://goo.gl/9p2vKq) %o %o",
                "timestamp": 1585208541643,
                "type": ""
            }
        ],
        "screenShotFile": "002000ef-002b-0015-0062-0096009e0059.png",
        "timestamp": 1585208540404,
        "duration": 13152
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "cb6a70231ec3ff9603ad0b2a0d2d92a4",
        "instanceId": 19496,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: Angular could not be found on the page https://wikipedia.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://wikipedia.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:720:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Regression.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Regression.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "0099001b-0064-00ac-00bc-000300fb0095.png",
        "timestamp": 1585208626265,
        "duration": 13718
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "cb6a70231ec3ff9603ad0b2a0d2d92a4",
        "instanceId": 19496,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: invalid element state: Failed to execute 'replace' on 'Location': 'rnet.xoriant.com/saml_login' is not a valid URL.\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.102', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown"
        ],
        "trace": [
            "InvalidElementStateError: invalid element state: Failed to execute 'replace' on 'Location': 'rnet.xoriant.com/saml_login' is not a valid URL.\n  (Session info: chrome=80.0.3987.149)\nBuild info: version: '3.141.59', revision: 'e82be7d358', time: '2018-11-14T08:25:53'\nSystem info: host: 'LAPTOP-CFRGULJ0', ip: '192.168.0.102', os.name: 'Windows 10', os.arch: 'x86', os.version: '10.0', java.version: '1.8.0_241'\nDriver info: driver.version: unknown\n    at Object.checkLegacyResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\error.js:546:15)\n    at parseHttpResponse (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:509:13)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\http.js:441:30\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Protractor.get(rnet.xoriant.com/saml_login) - reset url\n    at thenableWebDriverProxy.schedule (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\webdriver.js:807:17)\n    at ProtractorBrowser.executeScriptWithDescription (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:404:28)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:679:25\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Regression1.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Regression1.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00ae00f5-00ff-00ba-003d-009a00a9005f.png",
        "timestamp": 1585208640355,
        "duration": 249
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "096dcf9898e03ab797cb98af2b3c571f",
        "instanceId": 19428,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: Angular could not be found on the page https://wikipedia.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://wikipedia.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:720:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Regression.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Regression.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [],
        "screenShotFile": "00b000ac-006e-0075-0050-00c5000d0002.png",
        "timestamp": 1585208682507,
        "duration": 11462
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "096dcf9898e03ab797cb98af2b3c571f",
        "instanceId": 19428,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL."
        ],
        "trace": [
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at listOnTimeout (internal/timers.js:549:17)\n    at processTimers (internal/timers.js:492:7)",
            "Error: Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL.\n    at Timeout._onTimeout (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4281:23)\n    at listOnTimeout (internal/timers.js:549:17)\n    at processTimers (internal/timers.js:492:7)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://adfs.xoriant.com/adfs/ls/?SAMLRequest=fZHNbsIwEIRfJfI9sTF%2FiQVItByKRFUEaQ%2B9VMZeiqXETr1OxePXJK0KF07Wzu432h3PUNZVI5ZtONkdfLWAITnXlUXRNeak9VY4iQaFlTWgCErsl88bwTMmGu%2BCU64iV8h9QiKCD8ZZkqxXc%2FIB02KiVM5gUmh95HBQ44LpfJDLgSr4UPOcSQVc5UCSN%2FAYyTmJRhFHbGFtMUgbosQ4S9kw5ZOSTcVoJMajd5Ks4jXGytBRpxAaFJRKfcTs7LyJYKZc3Qm0QkqS5d92j85iW4Pfg%2F82Cl53m38%2BohbCjQOauqngcj2tnW4ryJpTQ7sa%2B5enUmGnajjKtgopNiTZ%2Fub3YKw29vN%2BdId%2BCMVTWW7T7cu%2BJIvZxVt0UfjFnQVn9Hqwr24%2FffED&RelayState=https%3A%2F%2Fxornet.xoriant.com%2Fsaml_login 316 Error parsing a meta element's content: ';' is not a valid key-value pair separator. Please use ',' instead.",
                "timestamp": 1585208756488,
                "type": ""
            }
        ],
        "screenShotFile": "00c4004d-0019-00e9-0015-00b500c30008.png",
        "timestamp": 1585208694416,
        "duration": 60009
    },
    {
        "description": "should add a Name as GURU99|Enter GURU99 Name",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "3025defa25f0555da5032fad07cef5a7",
        "instanceId": 17772,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Failed: Angular could not be found on the page https://gmail.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load"
        ],
        "trace": [
            "Error: Angular could not be found on the page https://gmail.com/. If this is not an Angular application, you may need to turn off waiting for Angular.\n                          Please see \n                          https://github.com/angular/protractor/blob/master/docs/timeouts.md#waiting-for-angular-on-page-load\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\built\\browser.js:720:27\n    at ManagedPromise.invokeCallback_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1376:14)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2927:27\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7\n    at processTicksAndRejections (internal/process/task_queues.js:97:5)\nFrom: Task: Run it(\"should add a Name as GURU99\") in control flow\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:94:19)\n    at attempt (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4297:26)\n    at QueueRunner.run (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4217:20)\n    at runNext (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4257:20)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4264:13\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4172:9\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:64:48\n    at ControlFlow.emit (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\events.js:62:21)\n    at ControlFlow.shutdown_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2674:10)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2599:53\nFrom asynchronous test: \nError\n    at Suite.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test.js:2:2)\n    at addSpecsToSuite (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1107:25)\n    at Env.describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:1074:7)\n    at describe (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasmine-core\\lib\\jasmine-core\\jasmine.js:4399:18)\n    at Object.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test.js:1:1)\n    at Module._compile (internal/modules/cjs/loader.js:1158:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1178:10)\n    at Module.load (internal/modules/cjs/loader.js:1002:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:901:14)"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://accounts.google.com/signin/v2/identifier?service=mail&passive=true&rm=false&continue=https%3A%2F%2Fmail.google.com%2Fmail%2F&ss=1&scc=1&ltmpl=default&ltmplcache=2&emr=1&osid=1&flowName=GlifWebSignIn&flowEntry=ServiceLogin - A cookie associated with a cross-site resource at http://accounts.youtube.com/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.",
                "timestamp": 1585208850744,
                "type": ""
            }
        ],
        "screenShotFile": "009c008f-0077-0065-0059-005a00a800dd.png",
        "timestamp": 1585208848628,
        "duration": 12237
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "3025defa25f0555da5032fad07cef5a7",
        "instanceId": 17772,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1585208861603,
                "type": ""
            }
        ],
        "screenShotFile": "0008005f-00c1-00de-0088-002c00ad0082.png",
        "timestamp": 1585208861206,
        "duration": 599
    },
    {
        "description": "should add one and two|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "3025defa25f0555da5032fad07cef5a7",
        "instanceId": 17772,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "009c0003-00fd-0014-00a9-006400e6005a.png",
        "timestamp": 1585208862393,
        "duration": 2569
    },
    {
        "description": "should add four and six|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "3025defa25f0555da5032fad07cef5a7",
        "instanceId": 17772,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '10'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\Test1.js:27:36)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [],
        "screenShotFile": "00fd0012-0058-0079-00c6-009b00e3006c.png",
        "timestamp": 1585208865263,
        "duration": 421
    },
    {
        "description": "should read the value from an input|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "3025defa25f0555da5032fad07cef5a7",
        "instanceId": 17772,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "0037000a-00d7-007a-0050-0049004600e4.png",
        "timestamp": 1585208866056,
        "duration": 494
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": true,
        "pending": false,
        "os": "windows",
        "sessionId": "3479e960600a193377a4468475b2e05f",
        "instanceId": 12896,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1585309816953,
                "type": ""
            }
        ],
        "screenShotFile": "00aa0009-00b1-007d-0025-00ff0005000b.png",
        "timestamp": 1585309816002,
        "duration": 4116
    },
    {
        "description": "should have a title|Protractor Demo App",
        "passed": false,
        "pending": false,
        "os": "windows",
        "sessionId": "43bb3f894b67cebc1afc7ef25ad0ca28",
        "instanceId": 200,
        "browser": {
            "name": "chrome",
            "version": "80.0.3987.149"
        },
        "message": [
            "Expected '0' to equal '55'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\Komal Purohit\\eclipse-workspace\\POC_Project\\ReadDataFromExcel.js:41:39)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\Komal Purohit\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "http://juliemr.github.io/favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)",
                "timestamp": 1585310011401,
                "type": ""
            }
        ],
        "screenShotFile": "0000001d-0055-0087-0090-009500cb0098.png",
        "timestamp": 1585310011016,
        "duration": 1781
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
