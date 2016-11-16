var umfp = (function(options) {

    return {

        setOptions: function(options) {
            umfp.options = options;
            umfp.options.loginUrl = umfp.options.baseUrl + '/login';
            umfp.options.signupUrl = umfp.options.baseUrl + '/signup';
            umfp.options.getUsersUrl = umfp.options.baseUrl + '/users';
            umfp.options.updateUserStatusUrl = umfp.options.baseUrl + '/updateUserStatus';
            umfp.options.getRolesUrl = umfp.options.baseUrl + '/roles';
            umfp.options.updateUserRoleUrl = umfp.options.baseUrl + '/updateUserRoles';
            umfp.options.umfpBasePath = umfp.options.umfpBasePath || '/bower_components/umpack-express-front/dist_front/js/';
        },

        isLogedIn: function() {
            var accessToken = Cookies.get('accessToken');
            if (!accessToken)
                return umfp.showLogin();
            return accessToken;
        },

        showLogin: function() {

            var modal = $("<div class='modal fade' id='loginModal' tabindex='-1' role='dialog'></div>");

            $("body").append(modal);

            $("#loginModal").load(umfp.options.umfpBasePath + "loginModal-template.html", function() {

                
                $("#loginModal").modal("show");

                $("div.login-modal-footer > button.login-button").click(loginButton_click);

                $("#loginModal").on("hide.bs.modal", function(e) {
                    if (umfp.options.afterClose)
                        umfp.options.afterClose();
                });

                $("#loginModal-Title").text(umfp.options.loginPopupTitle);
            });

            function loginButton_click() {
                var userLoginData = {
                    userName: $("div.login-modal-content > input[name='userName']").val(),
                    password: $("div.login-modal-content > input[name='password']").val()
                }

                $.ajax({
                    type: 'POST',
                    url: umfp.options.loginUrl,
                    data: userLoginData,
                    success: function(result) {
                        $("#loginModal").modal('hide');
                        Cookies.set('accessToken', result);
                        window.location.href = umfp.options.loginSuccessRedirectionUrl;

                        if (umfp.options.afterLogin)
                            umfp.options.afterLogin();

                    },
                    error: function(err) {

                        $("div.login-modal-content > div.response-message-box").text(err.responseJSON.message);
                    }

                });
            }


        },

        logout: function() {
            Cookies.remove('accessToken');
            umfp.showLogin();
        },

        getAuthorizationHeader: function() {
            return { 'authorization': umfp.getAccessToken() };
        },

        getAccessToken: function() {
            return Cookies.get('accessToken');
        },

        showSignUp: function() {

            var modal = $("<div class='modal fade' id='signupModal' tabindex='-1' role='dialog'></div>");

            $("body").append(modal);

            $("#signupModal").load(umfp.options.umfpBasePath + "signupModal-template.html", function() {

                $("#signupModal").modal('show');

                $("div.signup-modal-footer > button.signup-button").click(signUpButton_click);

                $("#signupModal-Title").text(umfp.options.signupPopupTitle);
            });

            function signUpButton_click() {

                var userSignupData = {
                    userName: $("div.signup-modal-content > input[name='userName']").val(),
                    password: $("div.signup-modal-content > input[name='password']").val(),
                    rePassword: $("div.signup-modal-content > input[name='rePassword']").val(),
                    firstName: $("div.signup-modal-content > input[name='firstName']").val(),
                    lastName: $("div.signup-modal-content > input[name='lastName']").val(),
                    email: $("div.signup-modal-content > input[name='email']").val(),
                    phone: $("div.signup-modal-content > input[name='phone']").val(),
                    address: $("div.signup-modal-content > input[name='address']").val(),
                    additionalInfo: $("div.signup-modal-content > input[name='additionalInfo']").val()

                }

                $.ajax({
                    type: 'POST',
                    url: umfp.options.signupUrl,
                    data: userSignupData,
                    success: function(result) {
                        $("#signupModal").modal('hide');
                    },
                    error: function(err) {
                        $("div.signup-modal-content > div.response-message-box").text(err.responseJSON.message);
                    }

                });
            }

        },

        showRoleManager: function() {
            var modal = $("<div class='modal fade' id='roleManagerModal' tabindex='-1' role='dialog'></div>");

            $("body").append(modal);

            $("#roleManagerModal").load(umfp.options.umfpBasePath + "userRoleManagementModal-template.html", function() {

                $("#roleManagerModal").modal('show');

                loadUserList();
                loadRoleList();
                $("label > input[name='userIsActivated']").click(activateUserCheckBox_Click);
                $("span.search-button-span > button.search-user-button").click(userSearch_click);
                $("div.input-group > input[name='searchUser']").keypress(userSearch_keypress);

                $("#userRoleModal-Title").text(umfp.options.roleManagerPopupTitle);
            });

            function activateUserCheckBox_Click() {

                if (!umfp.selectedUserItem || !umfp.selectedUserItem.data()) {
                    hadnelValidation('firstly select user from list');
                    return;
                }

                var userData = umfp.selectedUserItem.data();

                $.ajax({
                    type: 'POST',
                    url: umfp.options.updateUserStatusUrl,
                    headers: umfp.getAuthorizationHeader(),
                    data: { id: userData.id, userName: userData.userName, isActivated: this.checked },
                    success: function(result) {
                        umfp.selectedUserItem.data(result);
                        updateUserElementBadge(umfp.selectedUserItem);

                    },
                    error: function(err) {
                        handleServerError(err);
                    }
                });
            }

            function loadUserList() {

                $.ajax({
                    type: 'GET',
                    url: umfp.options.getUsersUrl,
                    headers: umfp.getAuthorizationHeader(),
                    success: function(result) {

                        populateUsers(result);
                    },
                    error: function(err) {
                        handleServerError(err);
                    }

                });
            }

            function loadRoleList() {

                $.ajax({
                    url: umfp.options.getRolesUrl,
                    headers: umfp.getAuthorizationHeader(),
                    type: 'GET',
                    success: function(result) {
                        populateRoles(result);
                    },
                    error: function(err) {
                        handleServerError(err);
                    }
                });
            }

            function updateUserElementBadge(element) {

                var data = element.data();

                if (data.isActivated) {
                    element.find(".status-badge").remove();
                    return;
                }

                appendBadgeOnUserItem(element);
            }

            function appendBadgeOnUserItem(item) {

                var statusBadge = $("<span class='badge status-badge'>Disabled</span>");
                item.append(statusBadge);
                statusBadge.click(false);
            }

            function populateUsers(userList) {

                userList.forEach(function(item) {

                    var listItme = $("<button type='button' class='list-group-item user-list-item'></button>").text(item.userName);

                    if (!item.isActivated)
                        appendBadgeOnUserItem(listItme);

                    listItme.data(item);

                    $("div.list-group.user-list").append(listItme);

                    listItme.click(userListItem_click);

                });
            }

            function userListItem_click(e) {

                var target = $(e.target);

                umfp.selectedUserItem = target;

                var userItem = target.data();

                $("input[name='userIsActivated']").prop("checked", false);

                if (userItem.isActivated)
                    $("input[name='userIsActivated']").prop("checked", true);

                showSelectedUserRoles();
            }

            function populateRoles(roleList) {

                roleList.forEach(function(item) {

                    var listItme = $("<li class='list-group-item'></li>");
                    var label = $("<label></label>").text(item.name + ' : ');
                    var checkbox = $("<input type='checkbox' class='role-checkbox'>");
                    listItme.append(label);
                    listItme.append(checkbox);
                    $("ul.list-group.role-list").append(listItme);

                    checkbox.data(item);
                    checkbox.click(roleCheckBox_click);
                })
            }

            function roleCheckBox_click(e) {

                if (!umfp.selectedUserItem || !umfp.selectedUserItem.data()) {
                    hadnelValidation('firstly select user from list');
                    return;
                }


                var target = $(e.target);
                var roleData = target.data();
                var userData = umfp.selectedUserItem.data();

                $.ajax({
                    type: 'POST',
                    url: umfp.options.updateUserRoleUrl,
                    headers: umfp.getAuthorizationHeader(),
                    data: { userId: userData.id, roleName: roleData.name, enable: this.checked },
                    success: function(result) {

                        umfp.selectedUserItem.data(result);

                    },
                    error: function(err) {
                        handleServerError(err);
                    }
                });

            }

            function showSelectedUserRoles() {

                if (!umfp.selectedUserItem || !umfp.selectedUserItem.data()) {
                    hadnelValidation('firstly select user from list');
                    return;
                }

                var userData = umfp.selectedUserItem.data();

                $("ul.list-group.role-list > li").each(function() {
                    var roleCheckBox = $(this).find(".role-checkbox");
                    var roleName = roleCheckBox.data().name;
                    var roleIndex = userData.roles.indexOf(roleName);
                    roleCheckBox.prop("checked", false);
                    if (roleIndex !== -1)
                        roleCheckBox.prop("checked", true);


                });
            }

            function userSearch_click() {
                filterUsersBySearchWord();
            }

            function userSearch_keypress(e) {

                var key = e.which;

                if (key == 13)
                    filterUsersBySearchWord();
            }

            function filterUsersBySearchWord() {

                var searchWord = $("div.input-group > input[name='searchUser']").val();

                $("button.list-group-item.user-list-item").hide();
                $("button.list-group-item.user-list-item").filter(function() {

                    return ($(this).data().userName.includes(searchWord));

                }).show();

            }



            function handleServerError(error) {

                $("div.responseMessge").text(error.responseJSON.message);

            }

            function hadnelValidation(message) {

                $("div.responseMessge").text(message);

            }

        }

    }

})();
