var app = angular.module('myApp', ['ngRoute', 'ngCookies']);
function message(_recipient, _recipient_img, _sender, _sender_img, _title, _description, _created_at, _important){
	this.recipient = _recipient;
	this.recipient_img = _recipient_img;
	this.sender = _sender;
	this.sender_img = _sender_img;
	this.messageTitle = _title;
	this.description = _description;
	this.created_at = _created_at;
	this.important = _important;
};
function user(_username, _password, _firstname, _lastname, _email, _phone, _loc) {
	this.username = _username;
	this.password = _password;
	this.firstname = _firstname;
	this.lastname = _lastname;
	this.email = _email;
	this.location = _loc;
	this.phone = _phone;
};
function updateValidation(_users, _username, _id){
	var validation = true;
	_users.forEach(function(user, index){
		if (user.username === _username && _id !== index.toString()) validation = false;
	});
	return validation;
};
app.service('dataInit', function dataInit(){
	this.users = localStorage.getItem("UserInfo")?JSON.parse(localStorage.getItem("UserInfo")):[];
	this.messages = JSON.parse(localStorage.getItem("MessageInfo"));
});

app.service('setData', function setData(){
	this.setUsers = function(users){
		if (typeof(Storage) !== "undefined") localStorage.setItem("UserInfo", JSON.stringify(users));
	};
	this.setMessages = function(messages){
		if (typeof(Storage) !== "undefined") localStorage.setItem("MessageInfo", JSON.stringify(messages));
	};
	this.setProfileInputTexts = function(users, id){
		var uu = new user(users[id].username, users[id].password, users[id].firstname, users[id].firstname, users[id].lastname, 
		users[id].email, users[id].phone, users[id].loc);
		return uu;
	};
	this.setMessageDetails = function(messages, id){
		var mm = new  message(messages[id].recipient, messages[id].recipient_img, messages[id].sender, messages[id].sender_img, messages[id].title, 
		messages[id].description, messages[id].created_at, messages[id].important==="1"?"Yes":"No");
		return mm;
	};
});

app.service('messageAction', function messageAction($location, setData){
	this.actionReply = function($scope, $routeParams, users, user_id, messages){
		$scope.items.push({
			message : users[user_id].username + " => " + $scope.responseMessage
		});
		messages[$routeParams.id]["reply"] = $scope.items;
		setData.setMessages(messages);
		$scope.responseMessage = "";
	};
	this.actionMark = function($scope, $routeParams, messages){
		if ($scope.mark_unmark === "Mark"){
			messages[$routeParams.id].important = "1";
			setData.setMessages(messages);
			$scope.message.important = "Yes";
			$scope.mark_unmark = "Unmark";
		}
		else{
			messages[$routeParams.id].important = "0";
			setData.setMessages(messages);
			$scope.message.important = "No";
			$scope.mark_unmark = "Mark";
		}
	};
	this.actionDelete = function(messages, message_id){
		messages.splice(message_id, 1);
		setData.setMessages(messages);
		$location.path('/message');
	}
});

app.config(function($routeProvider){
	$routeProvider
	.when('/',{
		redirectTo:'/login'
	})
	.when('/login',{
		templateUrl:'login.html',
		controller:'loginCtrl'
	})
	.when('/signup',{
		templateUrl:'signup.html',
		controller:'signupCtrl'
	})
	.when('/home', {
		templateUrl:'home.html',
		controller:'homeCtrl'
	})
	.when('/home/:id', {
		templateUrl:'home.html',
		controller:'homeCtrl'
	})
	.when('/profile', {
		templateUrl:'profile.html',
		controller:'profileCtrl'
	})
	.when('/message', {
		templateUrl:'message.html',
		controller:'messageCtrl'
	})
	.when('/message_detail/:id', {
		templateUrl:'message_detail.html',
		controller:'message_detailCtrl'
	})
	.otherwise({
		redirectTo:'/login'
	});
});

app.run(function($window, $http, $cookieStore) {
	if (localStorage.getItem("MessageInfo") === null){
		$http({
			'method':'GET',
			'url':'data.json'
		})
		.then(function(success_reponse){
			messages = success_reponse.data;
			if(typeof(Storage)!== "undefined") localStorage.setItem("MessageInfo", JSON.stringify(messages));
		},
		function(err_response){
			console.log(err_response);
		});
	};
	
});

app.controller("loginCtrl", function($scope, $rootScope, $location, $cookieStore, dataInit){
	var users = dataInit.users;
	$rootScope.display = false;
	$scope.tryLogin = function(){
		var validation = false;
		$scope.alert = "";
		if ($scope.username && $scope.password){
			users.forEach(function(user, index){
				if (user.username === $scope.username && user.password === $scope.password){
					validation = true;
					$cookieStore.put('id', index);
					$location.path('/home/' + index);
				}
			})
			if (validation === false) $scope.alert = "Invalid Username or Password";
		};
	}
});

app.controller("signupCtrl", function($scope, $rootScope, $location, $cookieStore, dataInit, setData){
	$rootScope.display = false;
	var users = dataInit.users;
	$scope.trySignup = function(){
		var validation = true;
		$scope.alert = "";
		if ($scope.username && $scope.password && $scope.firstname && $scope.lastname && $scope.email && $scope.phone && $scope.location){
			users.forEach(function(user){
				if (user.username === $scope.username){
					validation = false;
					$scope.alert = "Username Already existed";
				}
			})
			if (validation === true){
				var newUser = new user($scope.username, $scope.password, $scope.firstname, $scope.lastname, $scope.email, $scope.phone, $scope.location);
				users.push(newUser);
				var id = users.length - 1;
				users[id] = newUser;
				$cookieStore.put('id', id);
				setData.setUsers(users);
				$location.path('/home/' + id);
			}
		};
	}
});

app.controller("homeCtrl", function($scope, $rootScope, $routeParams, $cookieStore, dataInit){
	var users = dataInit.users;
	var messages = dataInit.messages;
	var id = $cookieStore.get('id');
	$rootScope.display = true;
	if(typeof($routeParams.id) !== "undefined"){
		id = $routeParams.id;
		$cookieStore.put('id', id);
	}
	$scope.user = users[id].username;
	
});

app.controller("profileCtrl", function($scope, $rootScope, $cookieStore, dataInit, setData){
	var users = dataInit.users;
	var messages = dataInit.messages;
	var id = $cookieStore.get('id');
	$rootScope.display = true;
	$scope.user = setData.setProfileInputTexts(users, id);
	$scope.readOnly = true;
	$scope.buttonValue = "Edit";
	$scope.buttonClick = function(){
		if($scope.buttonValue === "Edit"){
			$scope.buttonValue = "Save";
			$scope.readOnly = false;
		}
		else if($scope.user.username && $scope.user.password && $scope.user.firstname && $scope.user.lastname && $scope.user.email && $scope.user.location && $scope.user.phone){
			$scope.alert = "";
			if (updateValidation(users, $scope.user.username, id)){
				$scope.buttonValue = "Edit";
				$scope.readOnly = true;
				users[id] = new user($scope.user.username, $scope.user.password, $scope.user.firstname, $scope.user.lastname, $scope.user.email, $scope.user.phone, $scope.user.location);
				users[id] = users[id];
				setData.setUsers(users);
			}
			else{
				$scope.alert = "Username Already Existed";
			}
		}
	};
	$scope.resetClick = function(){
		$scope.user = setData.setProfileInputTexts(users, id);
	}
});


app.controller("messageCtrl", function($scope, $rootScope, $cookieStore, dataInit, setData){
	var users = dataInit.users;
	var messages = dataInit.messages;
	var id = $cookieStore.get('id');
	$rootScope.display = true;
	$scope.messages = messages;
	if ($scope.messages.length === 0) $scope.noMessage = "No Message Available...";
	else $scope.noMessage = "";
});

app.controller("message_detailCtrl", function($scope, $location, $routeParams, $rootScope, $cookieStore, dataInit, setData, messageAction){
	var users = dataInit.users;
	var messages = dataInit.messages;
	var id = $cookieStore.get('id');
	$rootScope.display = true;
	$scope.responseMessage = "";
	$scope.message = setData.setMessageDetails(messages, $routeParams.id);
	if (messages[$routeParams.id].important === "1") $scope.mark_unmark = "Unmark";
	else $scope.mark_unmark = "Mark";
	$scope.items = typeof(messages[$routeParams.id].reply) !== "undefined" ? messages[$routeParams.id].reply : [];
	$scope.reply = function(){
		messageAction.actionReply($scope, $routeParams, users, id, messages);
	}
	$scope.mark = function(){
		messageAction.actionMark($scope, $routeParams, messages);
	}
	$scope.delete = function(){
		messageAction.actionDelete(messages, $routeParams.id);
	}
});