/// <reference path="database.js" />

var globals = {
    urls: {
        'BGUS': 'https://sslkatalog.bg.szczecin.pl',
        'BPGW': 'http://koha.womgorz.edu.pl',
        'UTH': 'https://katalog.uth.edu.pl',
        'ASP': 'http://katalog.asp.katowice.pl',
        'MBPK': 'https://kohambp.pl',
        'UJD': 'https://www.katalog.bu.ujd.edu.pl',
        'ROZTOKY': 'https://www.knihovna.roztoky.cz',
        'TEST': 'http://212.14.16.131:8094',
        'WSD': 'https://biblio.wsd.rzeszow.pl'
    },
    myuser: '',
    mypassword: '',
    mylibrary: '',
    mycalendar: '',
    nfc: 0,
    community: 0,
    mypayment: 'PLN',
    reservations: [],
    issues: [],
    payments: 0,
    fireOnline: null,
    resultsPage: 0,
    resultCdx: 0,
    searchOnlineCdx: 0,
    loadingFire: [0, 0, 0, 0, 0, 0],
    uuid: '',
    appVersion: '',
    appName: '',
    protocolVersion: '',
    calendars: [],
    userinfo: {},
    reminders: [],
    accordion: 0,
    autorefresh: true,
    branches: [],
    buttonPosition: -1,
    buttonMenu: '',
    /*
        Sprawdz uprawnienia zgodnie z wymaganiami w Android 6
    */

    permission: function() {
        var permissions = window.plugins.permissions;

        var checkPermissionCallback = function(status) {
            if (!status.hasPermission) {
                var errorCallback = function () {
                    console.warn('Camera permission is not turned on');
                }

                permissions.requestPermission(function (status) {
                    if (!status.hasPermission) errorCallback();
                }, errorCallback, permissions.CAMERA);
            }
        }

        permissions.hasPermission(checkPermissionCallback, null, permissions.CAMERA);
    },
    fixZero: function (fzero) {
        if (fzero < 10)
            return '0' + fzero;
        return fzero;
    },
    uniqueSucc: function(uuid) {
        globals.uuid = uuid;
    },
    newResults: function() {
        $('#searchContent').css('display', 'block');
        $('#searchResult').css('display', 'none');
        globals.resultsPage = 0;
    },
    showResults: function () {
        $('#searchContent').css('display', 'none');
        $('#searchResult').css('display', 'block');
        database.loadResult();
    },
    launchEvent: function (x) {
        globals.loadingFire[x]++;
        var myEvent = new CustomEvent("loadingData");
        document.dispatchEvent(myEvent);
    },
    sendProposition: function () {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!',
            'pleaseWait': 'Please Wait...',
            'error': 'Error',
            'ContactingServer': 'Contacting Server...',
            'titleRequired': 'Field title required!',
            'authorRequired': 'Field author required!'
        };

        phonon.i18n().get(['error', 'authorRequired', 'titleRequired', 'loginOK', 'loginBAD', 'connectionBAD', 'pleaseWait', 'ContactingServer'], function (values) {
            trans = values;
        });


        var title = $("#input-title").val();
        var author = $("#input-author").val();
        var isbn = $("#input-isbn").val();
        var publicationyear = $("#input-publicationyear").val();
        var www = $("#input-link").val();

        if (title.length < 3) {
            phonon.alert(trans.titleRequired, trans.error);
            return false;
        }

        if (author.length < 3) {
            phonon.alert(trans.authorRequired, trans.error);
            return false;
        }

        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'PROPOSITION', uuid: globals.uuid, title: title, author: author, isbn: isbn, publicationyear: publicationyear, www:www },
            dataType: 'json',
            success: function (res, textStatus, jqXHR) {
                if (res.send == 1) {
                    cordova.plugin.pDialog.dismiss();
                    $("#input-title").val('');
                    $("#input-author").val('');
                    $("#input-isbn").val('');
                    $("#input-publicationyear").val('');
                    $("#input-link").val('');
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, 'Error');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, 'Error');
            }
        });

    },
    renewItem: function (itemnumber, execFunc) {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!',
            'pleaseWait': 'Please Wait...',
            'ContactingServer': 'Contacting Server...'
        };

        phonon.i18n().get(['loginOK', 'loginBAD', 'connectionBAD', 'pleaseWait', 'ContactingServer'], function (values) {
            trans = values;
        });

        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'RENEW', uuid: globals.uuid, itemnumber: itemnumber },
            dataType: 'json',
            success: function (res, textStatus, jqXHR) {
                cordova.plugin.pDialog.dismiss();
                if (res.result == 1) {
                    globals.getIssues(execFunc);
                } else {
                    phonon.alert(trans.loginBAD, 'Error');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, 'Error');
            }
        });

    },
    findBarcode: function (text, format) {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!',
            'pleaseWait': 'Please Wait...',
            'ContactingServer': 'Contacting Server...'
        };

        phonon.i18n().get(['notforloan', 'barcode', 'issuedReturnDate', 'reservedSince', 'issuedAt', 'available', 'availability', 'status', 'branch', 'itemcallnumber', 'items', 'loginOK', 'loginBAD', 'connectionBAD', 'pleaseWait', 'ContactingServer'], function (values) {
            trans = values;
        });

        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'SEARCH', one: 1, barcode: text, format: format, uuid: globals.uuid },
            dataType: 'json',
            success: function (res, textStatus, jqXHR) {
                if (res.result == 1) {
                    cordova.plugin.pDialog.dismiss();
                    globals.protocolVersion = res.version;
                    var output = '';
                    var record = res.records[0];

                    output += '<h2 style="text-align: center;">' + text + '</h2><hr />';

                    if (res.records.length > 0) {

                        output += '<h3>' + record.title + '</h3><h4>' + record.subtitle + '</h4>';

                        output += '<h5>';

                        if (record.author.length > 1) {
                            output += '' + record.author + '';
                        }
                        else {
                            output += '' + record.responsibility + '';
                        }

                        if (record.publicationyear.toString().length > 1) {
                            output += '<br />' + record.publishercode + ' ' + record.place + ' ' + record.publicationyear + '';
                        }

                        output += '</h5>';

                        if (record.cover.length > 1) {
                            output += '<p>&nbsp;</p><div style="width: 100%; text-align: center;"><img src="' + record.cover + '" style="" /></div><p>&nbsp;</p>';
                        }

                        output += '<table style="width: 100%;"><thead><tr><th>' + trans['itemcallnumber'] + '</th><th>'+trans['barcode']+'</th></tr></thead>';
                        output += '<tbody><tr><td>' + record.itemcallnumber + '</td><td>' + record.barcode + '</td></tr><td colspan="2">' + record.branchname + '</td></tr>';
                        output += '<tr><td colspan="2">' + record.branchaddress + '</td></tr></tbody>';

                        if (record.date_due.toString().length > 1)
                        {
                            output += '<thead><tr><th colspan="2"><b>' + trans['issuedReturnDate'] + ' ' + record.date_due + '</b></th></tr></thead>'
                        }

                        if (record.notforloan > 0)
                        {
                            output += '<thead><tr><th colspan="2"><p><b>' + trans['notforloan'] + '</b></p></th></tr></thead>';
                        }

                        output += '</table>';

                        output += '<p>&nbsp;</p>';
                        output += '<h3>'+trans['items']+'</h3>';
                        output += '<table style="width: 100%;">';
                        output += '<thead><tr>';
                        output += '<th>' + trans['itemcallnumber'] + '</th><th>' + trans['branch'] + '</th><th>' + trans['status'] + '</th><th>' + trans['availability'] + '</th>';
                        output += '</tr></thead>';
                        output += '<tbody>';

                        database.saveItems(record.items, record.biblionumber);

                        for (var f = 0; f < record.items.length; f++) {
                            
                            output += '<tr>';
                            output += '<td>'+record.items[f].itemcallnumber+'</td>';

                            if (Object.keys(globals.branches).length > 0) {
                                output += '<td><a href="#" class="branchdescription with-circle" title="' + globals.branches[record.items[f].branch] + '">' + record.items[f].branch + '</a></td>';
                            } else {
                                output += '<td>' + record.items[f].branch + '</td>';
                            };


                            output += '<td>' + record.items[f].istatus.lib + '</td>';
                            var stat = trans['available'];
                            var button = 1;

                            if (record.items[f].issued.toString().length > 2)
                            {
                                stat = trans['issuedAt'] + ' ' + record.items[f].issued;
                                button = 0;
                            }

                            if (record.items[f].reserved.toString().length > 2) {
                                stat = trans['reservedSince'] + ' ' + record.items[f].reserved;
                                button = 0;
                            }

                            if (button == 1 && record.items[f].status < 1 && record.items[f].istatus.hoursto > 0) {
                                output += '<td><a href="#" class="makeorder" data-id="' + record.items[f].itemnumber + '"><i class="material-icons with-circle">&#xE02E;</i></a></td>';
                            } else {
                                output += '<td>' + stat + '</td>';
                            }

                            output += '</tr>';
                        }
                        output += '</tbody>';
                        output += '</table>';

                    }

                    $('#resultsListBarcode').html(output);
                    $('a.makeorder').on('click', function () { globals.makeReserve($(this).attr('data-id'), 'searchbarcodeonline'); });
                    $('a.branchdescription').on('click', function () { var alert = phonon.alert($(this).attr('title'), trans.branch, false, trans.ok); });

                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, 'Error');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, 'Error');
            }
        });

    },
    findMe: function (title, author, isbn, ukd, subjects, signature, publication) {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!',
            'pleaseWait': 'Please Wait...',
            'ContactingServer': 'Contacting Server...'
        };

        phonon.i18n().get(['loginOK', 'loginBAD', 'connectionBAD', 'pleaseWait', 'ContactingServer'], function (values) {
            trans = values;
        });

        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: {
                login: globals.myuser, password: globals.mypassword,
                command: 'SEARCH', title: title, author: author, uuid: globals.uuid,
                isbn: isbn, ukd: ukd, subjects: subjects, signature: signature, pyear: publication
            },
            dataType: 'json',
            success: function (res, textStatus, jqXHR) {
                if (res.result == 1) {
                    globals.protocolVersion = res.version;
                    globals.searchOnlineCdx = res.cdx;
                    database.addResults(res, globals.showResults);
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, 'Error');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, 'Error');
            }
        });

    },
    loadSettings: function () {

        var trans = [];
        phonon.i18n().get(['disableCalendar'], function (values) {
            trans = values;
        });

        /* DISABLED - maybe in future
        if (globals.calendars.length > 0) {
            var options = '<option value="">' + trans['disableCalendar'] + '</option>';
            for (var i = 0; i < globals.calendars.length; i++) {
                if (globals.calendars[i].name.length > 1) {
                    options += '<option value="' + globals.calendars[i].id + '">' + globals.calendars[i].name + '</option>';
                }
            }
            $('#calendars').html(options);
        }
        */

        if (globals.myuser.length > 0) {
            $('#input-login').val(globals.myuser);
        }

        if (globals.nfc.length > 0) {
            $('#input-nfc').val(globals.nfc);
            var el = document.getElementById('nfcselector');
            var els = $('#btn-nfc').find('li');
            for (var i = 0; i < els.length; i++) {
                if (els.eq(i).children().eq(0).attr('option') == globals.nfc) {
                    el.innerHTML = els.eq(i).children().eq(0).html();
                }

            }
        }

        if (globals.mycalendar.toString().length > 0) {
            $('#input-calendars').val(globals.mycalendar);
            var el = document.getElementById('calendarsselector');
            var els = $('#btn-calendars').find('li');
            for (var i = 0; i < els.length; i++) {
                if (els.eq(i).children().eq(0).attr('option') == globals.mycalendar) {
                    el.innerHTML = els.eq(i).children().eq(0).html();
                }

            }
        }

        if (globals.mypassword.length > 0) {
            $('#input-password').val(globals.mypassword);
        }

        if (globals.mylibrary.length > 0) {
            $('#input-library').val(globals.mylibrary);
            var el = document.getElementById('libraryselector');
            var els = $('#btn-popover').find('li');
            for (var i = 0; i < els.length; i++) {
                if (els.eq(i).children().eq(0).attr('option') == globals.mylibrary) {
                    el.innerHTML = els.eq(i).children().eq(0).html();
                }

            }

        }

    },
    getUserInfo: function () {
        phonon.i18n().get(['loginOK', 'loginBAD', 'connectionBAD', 'errorUserInfo'], function (values) {
            trans = values;
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'USERINFO', uuid: globals.uuid },
            dataType: 'json',
            timeout: 5000,
            success: function (res, textStatus, jqXHR) {
                globals.launchEvent(3);
                if (res.result == 1) {
                    database.addUserInfo(res);
                    database.setUpdateTime();
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, trans.errorUserInfo);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                globals.launchEvent(3);
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, trans.errorUserInfo);
            }
        });



    },
    getPayments: function () {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!'
        };

        phonon.i18n().get(['loginOK', 'loginBAD', 'connectionBAD', 'errorPayments'], function (values) {
            trans = values;
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'PAYMENTS', uuid: globals.uuid },
            dataType: 'json',
            timeout: 5000,
            success: function (res, textStatus, jqXHR) {
                globals.launchEvent(2);
                if (res.result == 1) {
                    database.addPayments(res);
                    database.setUpdateTime();
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, trans.errorPayments);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                globals.launchEvent(2);
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, trans.errorPayments);
            }
        });

    },
    getReservations: function () {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!',
            'suspendHold': 'Suspended holds',
            'holds': 'Holds'
        };

        phonon.i18n().get(['loginOK', 'loginBAD', 'connectionBAD', 'errorReservations', 'suspendHold', 'holds'], function (values) {
            trans = values;
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'RESERVATIONS', uuid: globals.uuid },
            dataType: 'json',
            timeout: 5000,
            success: function (res, textStatus, jqXHR) {

                /* community version */
                if (res.hasOwnProperty('community')) {
                    globals.community = 1;
                };

                globals.protocolVersion = res.version;
                globals.launchEvent(0);
                if (res.result == 1) {
                    database.addReservations(res);
                    database.setUpdateTime();
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, trans.errorReservations);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                globals.launchEvent(0);
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, trans.errorReservations);
            }
        });

    },

    getIssues: function (execFunc) {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!'
        };

        phonon.i18n().get(['loginOK', 'loginBAD', 'connectionBAD', 'errorIssues'], function (values) {
            trans = values;
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'ISSUES', uuid: globals.uuid },
            dataType: 'json',
            timeout: 5000,
            success: function (res, textStatus, jqXHR) {
                globals.launchEvent(1);
                globals.protocolVersion = res.version;
                if (res.result == 1) {
                    database.addIssues(res, execFunc);
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, trans.errorIssues);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                globals.launchEvent(1);
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, trans.errorIssues);
            }
        });


    },

    makeReserve: function (itemnumber,mypage) {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!'
        };

        phonon.i18n().get(['problem', 'reserveSorry', 'loginOK', 'loginBAD', 'connectionBAD', 'errorOrder'], function (values) {
            trans = values;
        });

        phonon.navigator().changePage('makeorder');

        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, command: 'CANRESERVE', uuid: globals.uuid, itemnumber: itemnumber },
            dataType: 'json',
            timeout: 5000,
            success: function (res, textStatus, jqXHR) {
                globals.protocolVersion = res.version;
                if (res.result == 1) {
                    cordova.plugin.pDialog.dismiss();
                    if (res.record.length > 0) {
                        if (res.resstatus.noreserve == 0) {
                            database.db.transaction(function (tx) {
                                tx.executeSql("select * from resultsItems WHERE itemnumber = ?", [itemnumber], function (tx, rez) {
                                    if (rez.rows.length > 0) {
                                        $('#makeorder_itemcallnumber').html(res.record[0].itemcallnumber);
                                        $('#makeorder_title').html(res.record[0].title + ' ' + res.record[0].subtitle);
                                        $('#makeorder_status').html(rez.rows.item(0).libtype);
                                        $('#makeorder_button').attr('data-id', itemnumber);
                                        $('#makeorder_button').attr('data-page', mypage);

                                        if (Object.keys(globals.branches).length > 0) {
                                            $('#makeorder_branch').html(globals.branches[res.record[0].holdingbranch]);
                                        };
                                    }
                                });
                            });

                        } else {
                            var alert = phonon.alert(trans.reserveSorry, trans.problem);
                            alert.on('confirm', function () {
                                window.setTimeout(function () {
                                    phonon.navigator().changePage(mypage);
                                }, 500);
                            });
                        }
                    }
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, trans.errorOrder);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                globals.launchEvent(1);
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, trans.errorOrder);
            }
        });

    },
    doReservation: function (itemnumber, page) {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!',
            'ContactingServer': 'Connecting to server',
            'pleaseWait': 'Please wait'
        };

        phonon.i18n().get(['issuedFail', 'issuedOk', 'ContactingServer', 'pleaseWait', 'loginOK', 'loginBAD', 'connectionBAD', 'error'], function (values) {
            trans = values;
        });

        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });

        $.ajax({
            type: "POST",
            url: globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: globals.myuser, password: globals.mypassword, uuid: globals.uuid, command: 'RESERVENOW', itemnumber: itemnumber },
            dataType: 'json',
            success: function (res, textStatus, jqXHR) {
                globals.protocolVersion = res.version; 
                if (res.result == 1) {
                    cordova.plugin.pDialog.dismiss();
                    if (res.resstatus.noreserve == 0) {
                        if (res.issues == 1) {
                            var alert = phonon.alert(trans.issuedOk, 'Info');
                            alert.on('confirm', function () {
                                window.setTimeout(function () {
                                    phonon.navigator().changePage('searchonline');
                                }, 1500);
                                globals.autorefresh = true;
                                globals.fireOnline();
                            });
                        } else {
                            var alert = phonon.alert(trans.issuedFail, 'Info');
                            alert.on('confirm', function () {
                                phonon.navigator().changePage('searchonline');
                            });
                        }
                    } else {
                        var alert = phonon.alert(trans.issuedFailReserved, 'Info');
                        alert.on('confirm', function () {
                            phonon.navigator().changePage(page);
                        });

                    }
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, trans.error);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, trans.error);
            }
        });
  
    },

    testConnection: function (mylogin, mypassword, mylibrary) {
        var trans = {
            'loginOK': 'Login and password is ok',
            'loginBAD': 'Password incorrect',
            'connectionBAD': 'Connection error!',
            'ContactingServer': 'Connecting to server',
            'pleaseWait': 'Please wait'
        };

        phonon.i18n().get(['ContactingServer', 'pleaseWait', 'loginOK', 'loginBAD', 'connectionBAD'], function (values) {
            trans = values;
        });

        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });

        $.ajax({
            type: "POST",
            url: globals.urls[mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            data: { login: mylogin, password: mypassword, uuid: globals.uuid },
            dataType: 'json',
            success: function (res, textStatus, jqXHR) {
                globals.protocolVersion = res.version;
                if (res.result == 1) {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginOK, 'Info');
                } else {
                    cordova.plugin.pDialog.dismiss();
                    phonon.alert(trans.loginBAD, 'Error');
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                cordova.plugin.pDialog.dismiss();
                phonon.alert(trans.connectionBAD, 'Error');
            }
        });
        /*
        var req = phonon.ajax({
            method: 'POST',
            url: globals.urls[mylibrary] + '/cgi-bin/koha/opac-mobile.pl',
            //crossDomain: true,
            dataType: 'json',
            //contentType: '',
            data: {login: mylogin, password: mypassword}, 
            success: function (res, xhr) {

                if (res.result == 1) {
                    phonon.alert(trans.loginOK, 'Info');
                } else {
                    phonon.alert(trans.loginBAD, 'Error');

                }
            },
    error: function(res, flagError, xhr) {
        phonon.alert(trans.connectionBAD, 'Error');
    }
        });
        */
    }
}