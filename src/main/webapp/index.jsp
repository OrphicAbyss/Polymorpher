<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>

<html data-ng-app>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Polymorpher - Online Coding</title>

        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Bootstrap -->
        <link href="css/bootstrap.css" rel="stylesheet" media="screen">
        <link href="css/bootstrap-responsive.css" rel="stylesheet">

        <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.js"></script>
        <script src="js/ui-bootstrap-tpls-0.3.0.js"></script>
        <script src="js/coder.js"></script>
        <style>
            .code {
                width: 99%;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="navbar">
                <div class="navbar-inner">
                    <a class="brand">Polymorpher</a>
                    <p class="navbar-text">An online coding platform</p>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="well" data-ng-controller="Ctrl">
                <p><b>Code</b><br/>
                    <textarea class="code" data-ng-model="code" rows="10"></textarea>
                </p>
                <p><b>Assemble</b><br/>
                    <span class="output" data-ng-bind-html-unsafe="codeView()"></span>
                </p>
                <p><b>Machine</b><br/>
                    <span class="output" data-ng-bind-html-unsafe="machineView()"></span>
                </p>
            </div>
        </div>
    </body>
</html>
