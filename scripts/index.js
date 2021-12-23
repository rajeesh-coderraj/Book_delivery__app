
function toPaddedHexString(i) {
    return ("00" + i.toString(16)).substr(-2);
}

function buildSelectApdu(aid) {
    var SELECT_APDU_HEADER = '00A40400';

    // Format: [CLASS | INSTRUCTION | PARAMETER 1 | PARAMETER 2 | LENGTH | DATA]
    var aidByteLength = toPaddedHexString(aid.length / 2);
    var data = SELECT_APDU_HEADER + aidByteLength + aid;
    return data.toLowerCase();
}

function eventFire(el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

function openbrowser(link) {
    cordova.InAppBrowser.open(link, '_system', 'location=yes');
}

function go_and_run(keytested, keytestedb, ev) {
    var last = globals.buttonPosition;
    var page = phonon.navigator().currentPage;

    if (keytestedb == 38) {
        // PAGE UP
        if (globals.buttonPosition > 0) {
            globals.buttonPosition--;
        }
        ev.preventDefault();
    }

    if (keytestedb == 40) {
        // PAGE DOWN
        globals.buttonPosition++;
        ev.preventDefault();
    }

    if (keytestedb == 39) {
        // PAGE RIGHT
        ev.preventDefault();
        if (page == 'settings' && globals.buttonMenu == 'clickablesettingslibrary') {
            var pos = document.getElementsByClassName('clickablesettingslibrary').item(globals.buttonPosition);
            pos.style.border = "0px none";
            globals.buttonMenu = '';
            globals.buttonPosition = 0;
            eventFire(pos, 'touchstart');
            eventFire(pos, 'touchend');
            return;
        }

        if (page == 'settings' && globals.buttonMenu == 'clickablesettingscalendar') {
            var pos = document.getElementsByClassName('clickablesettingscalendar').item(globals.buttonPosition);
            pos.style.border = "0px none";
            globals.buttonMenu = '';
            globals.buttonPosition = 4;
            eventFire(pos, 'touchstart');
            eventFire(pos, 'touchend');
            return;
        }

        if (page == 'settings' && globals.buttonMenu == 'clickablesettingsnfc') {
            var pos = document.getElementsByClassName('clickablesettingsnfc').item(globals.buttonPosition);
            pos.style.border = "0px none";
            globals.buttonMenu = '';
            globals.buttonPosition = 5;
            eventFire(pos, 'touchstart');
            eventFire(pos, 'touchend');
            return;
        }


        if (page == 'settings' && globals.buttonMenu == '') {
            if (globals.buttonPosition == 0 || globals.buttonPosition == 4) {
                var pos = document.getElementsByClassName('clickablesettings').item(globals.buttonPosition);
                pos.style.border = "0px none";
                eventFire(pos, 'touchend');
                if (globals.buttonPosition == 0) {
                    globals.buttonMenu = 'clickablesettingslibrary';
                } else {
                    globals.buttonMenu = 'clickablesettingscalendar';
                }
                globals.buttonPosition = -1;
            } 

            if (globals.buttonPosition == 3 || globals.buttonPosition == 6 || globals.buttonPosition == 7) {
                var pos = document.getElementsByClassName('clickablesettings').item(globals.buttonPosition);
                pos.style.border = "0px none";
                eventFire(pos, 'touchstart');
                eventFire(pos, 'touchend');
            }

            return;
        }

        if (page == 'reservations') {
            if (globals.buttonPosition == 0 || globals.buttonPosition == 1) {
                var pos = document.getElementsByClassName('clickablereservations').item(globals.buttonPosition);
                 eventFire(pos, 'touchstart');
                 eventFire(pos, 'touchend');
            }
        }

        if (page == 'searchonline') {
            var search = document.getElementById('searchResult').style.display;
            if (search != 'none') {
                var pos = document.getElementsByClassName('clickableresults').item(globals.buttonPosition);
                var eltype = pos.tagName.toString().toUpperCase();
                if (eltype == 'BUTTON' || eltype == 'A') {
                    eventFire(pos, 'touchstart');
                    eventFire(pos, 'touchend');
                    pos.click();
                }
                
            } else {
                var pos = document.getElementsByClassName('clickablesearch').item(globals.buttonPosition);
                if (globals.buttonPosition < 7) {
                    pos.focus();
                } else {
                    eventFire(pos, 'touchstart');
                    eventFire(pos, 'touchend');
                }
            }
            return;
        }

        if (page == 'proposition') {
            var pos = document.getElementsByClassName('clickableproposition').item(globals.buttonPosition);
            if (globals.buttonPosition < 5) {
                pos.focus();
            } else {
                eventFire(pos, 'touchstart');
                eventFire(pos, 'touchend');
            }

            return;
        }


        if (page == 'home') {
            if (globals.buttonPosition >= 0) {
                var pos = document.getElementsByClassName('clickablebutton').item(globals.buttonPosition);
                pos.style.border = "0px none";
                var href = pos.getAttribute('href');
                var name = href.substring(2, href.length);
                
                if (name.length > 1) {
                    phonon.navigator().changePage(name);
                } else {
                    pos.click();  
                }
            }

            return;
        }
    }
    
    /* MOVE UP AND DOWN */

    var tagname = document.getElementsByClassName('app-active').item(0).tagName.toString().toUpperCase();

    if (page == 'settings') {
        var field = globals.buttonMenu;
        if (globals.buttonMenu == '') {
            field = 'clickablesettings';
        } else {
            document.getElementsByClassName(field).item(0).parentNode.parentNode.scrollTop = globals.buttonPosition * 40;
        }

        if (globals.buttonPosition > document.getElementsByClassName(field).length - 1) {
            globals.buttonPosition = 0;
        }

        if (last >= 0) {
            var clickablebuttonOld = document.getElementsByClassName(field).item(last);
            clickablebuttonOld.style.border = "0px none";
        }

        var clickablebutton = document.getElementsByClassName(field).item(globals.buttonPosition);
        if (clickablebutton) {
            clickablebutton.style.border = "2px solid red";
            clickablebutton.focus();
        }
    }
 
    if (page == 'home' || page == 'reservations' || page == 'searchonline' || page == 'userinfo' || page == 'proposition') {

        var field = 'clickablebutton';
        var mymethod = '';

        if (page == 'reservations') {
            field = 'clickablereservations';
        }

        if (page == 'searchonline') {
            field = 'clickablesearch';
            mymethod = 'searchContent';
            var search = document.getElementById('searchResult').style.display;
            if (search != 'none') {
                field = 'clickableresults';
                mymethod = ''; //searchResult';
            }
        }

        if (page == 'userinfo') {
            field = 'clickableuserinfo';
            mymethod = 'userinfosettings';
        }

        if (page == 'proposition') {
            field = 'clickableproposition';
            mymethod = 'propositionSettings';
        }
        
        if (globals.buttonPosition > document.getElementsByClassName(field).length - 1) {
            globals.buttonPosition--;
        }

        if (last >= 0) {
            var clickablebuttonOld = document.getElementsByClassName(field).item(last);
            clickablebuttonOld.style.border = "0px none";
        }

        var clickablebutton = document.getElementsByClassName(field).item(globals.buttonPosition);
        if (clickablebutton) {
            clickablebutton.style.border = "2px solid red";

            if (mymethod == '') {
                clickablebutton.focus();
            } else {
                document.getElementById(mymethod).scrollTop = globals.buttonPosition * 40;
            }
        }
    }
    
}

function downloadopenbrowser(link,name) {

    var trans;

    phonon.i18n().get(['error', 'pleaseWait', 'ContactingServer'], function (values) {
        trans = values;
    });

    cordova.plugin.pDialog.init({
        theme: 'HOLO_DARK',
        progressStyle: 'SPINNER',
        cancelable: false,
        title: trans.pleaseWait,
        message: trans.ContactingServer
    });

    var ft = new FileTransfer();
    var fileURL = cordova.file.externalApplicationStorageDirectory+name;
    ft.download(encodeURI(link), fileURL,
        function (entry) {
            // ok entry.toURL()
            cordova.plugin.pDialog.dismiss();
            openbrowser(entry.toURL());
    }, function (error)
    {
        // error
        cordova.plugin.pDialog.dismiss();
        phonon.alert(trans['error']+':' + error.code, 'Error');
    }, null);
}

(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    document.addEventListener("backbutton", onBackKeyDown, false);

    phonon.options({
        navigator: {
            defaultPage: 'home',
            hashPrefix: '!', // default !pagename
            animatePages: true,
            enableBrowserBackButton: true,
            templateRootDirectory: './tpl',
            useHash: true
        },
        i18n: {
            directory: './i18n/',
            localeFallback: 'en',
            localePreferred: 'en'
        }
    });


    var app = phonon.navigator();

    // one second delay
    var beforeOnline = function () {
        window, setTimeout(onOnline, 1000)
    };

    var onOnline = function () {
        if (globals.myuser.length > 0 && globals.autorefresh == true) {
            initLoading();
            globals.getReservations();
            globals.getIssues(null);
            globals.getPayments();
            globals.getUserInfo();
            globals.autorefresh = false;
        }
    };

    var loadingData = function (e) {
        if (globals.loadingFire[0] > 0 && globals.loadingFire[1] > 0 && globals.loadingFire[2] > 0 && globals.loadingFire[3] > 0) {
            cordova.plugin.pDialog.dismiss();
            if (globals.loadingFire[5] == 1) {
                navigator.vibrate(1000);
            }
            globals.loadingFire = [0, 0, 0, 0, 0, 0];
        }
    };

    var initLoading = function () {
        var trans = {
            'ContactingServer': 'Connecting to server',
            'pleaseWait': 'Please wait'
        };

        phonon.i18n().get(['ContactingServer', 'pleaseWait'], function (values) {
            trans = values;
        });
        
        cordova.plugin.pDialog.init({
            theme: 'HOLO_DARK',
            progressStyle: 'SPINNER',
            cancelable: false,
            title: trans.pleaseWait,
            message: trans.ContactingServer
        });
        
    };
    /*
    var onCommandNFC = function (command) {
        console.log(command);
        var commandAsBytes = new Uint8Array(command);
        var commandAsString = hce.util.byteArrayToHexString(commandAsBytes);
        var code = globals.userinfo['USERINFO_cardnumber'];
        var code2 = globals.userinfo['USERINFO_userid'];

        if (code2 * 1 > 0) {
            code = code2;
        }

        var mycode = code.toString().substr(2, 10);

        var SELECT_APDU = buildSelectApdu(mycode);


        //alert(commandAsString);
        console.log('received command ' + commandAsString);
        console.log('expecting        ' + SELECT_APDU);

        if (SELECT_APDU === commandAsString) {
            var accountNumberAsBytes = hce.util.stringToBytes(accountNumber.value);
            var data = hce.util.concatenateBuffers(accountNumberAsBytes, app.okCommand);

            console.log('Sending ' + hce.util.byteArrayToHexString(data));
            hce.sendResponse(data);
        } else {
            console.log('UNKNOWN CMD SW');
            hce.sendResponse(app.unknownCommand);
        }

    };

    var onDeactivated = function(reason) {
        console.log('Deactivated ' + reason);
    }
    */

    var onSuccessCalendar = function (calendar) {
        globals.calendars = calendar;
    };

    // Back button (hardware)
    function onBackKeyDown() {
        if (phonon.navigator().currentPage == 'home') {
            navigator.app.exitApp();
        }
        else {
            phonon.navigator().changePage('home');
        }
    }

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener( 'resume', onResume.bind( this ), false );
        document.addEventListener("loadingData", loadingData, false);

        // get version
        cordova.getAppVersion.getVersionNumber().then(function (version) {
            globals.appVersion = version;
        });
        cordova.getAppVersion.getAppName().then(function (name) {
            globals.appName = name;
        });

        // Let's go!

        phonon.i18n().bind();

        if (phonon.i18n().getLocale() == 'pl' || phonon.i18n().getLocale() == 'pl-PL') {
            phonon.updateLocale('pl');
        }

        if (phonon.i18n().getLocale() == 'cs' || phonon.i18n().getLocale() == 'cs-CZ') {
            phonon.updateLocale('cs');
        }

        if (phonon.i18n().getLocale() == 'cz' || phonon.i18n().getLocale() == 'cz-CZ') {
            phonon.updateLocale('cs');
        }


        var trans = {};

        phonon.i18n().get(['noissues', 'bookClipboard', 'areYouSure', 'renewIssue', 'scanningFailed'], function (values) {
            trans = values;
        });


        /**
         * The activity scope is not mandatory.
         * For the home page, we do not need to perform actions during
         * page events such as onCreate, onReady, etc
        */
        app.on({ page: 'home', preventClose: false, content: null });

        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.

        app.on({ page: 'circulation', preventClose: true, content: 'circulation.html', readyDelay: 1 }, function (activity) {
            var onLoadIss = function () {
                var res1 = '';
                globals.buttonPosition = -1;

                for (var i = 0; i < globals.issues.length; i++) {

                    var days = Math.round((new Date(globals.issues[i].datedue).getTime() - new Date(globals.issues[i].borrowdate).getTime()) / (1000 * 60 * 60 * 24));
                    var left = Math.round((new Date(globals.issues[i].datedue).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                    res1 += '<li class="padded-list card-1">';
                    res1 += '<h4 style="margin-top: 1rem; line-height: 110%;"><a onclick="openbrowser(this.getAttribute(\'data-link\')); return false;" data-link="' + globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-detail.pl?bib=' + globals.issues[i].biblionumber + '">' + (i + 1) + '. ' + globals.issues[i].title + '';
                    res1 += ''+globals.issues[i].author+'</a></h4>';
                    res1 += '<table border="0" style="border: 0 none;"><tr><td style="border: 0 none;"><i class="material-icons" style="margin-top: -10px;">&#xE855;</i></td><td style="border: 0 none;"><b>' + globals.issues[i].borrowdate + '</td><td style="border: 0 none;"><i class="material-icons" style="margin-top: -10px;">&#xE425;</i></td><td style="border: 0 none;"><b>' + globals.issues[i].datedue + '</b></td></tr></table>';
                    res1 += '' + globals.branches[globals.issues[i].branchcode] + ' [' + globals.issues[i].itemcallnumber + ']';
                    res1 += '<div style="float: right; margin-top: 20px; position: relative;" class="mycircle" data-left="' + left + '" data-days="' + days + '"><span class="mycirclespan">' + left + '</span></div>';
                    res1 += '<div style="width: 100%;"><div style="float: left; "><a href="#" class="clicklink" title="' + i + '"><img src="images/copy18.png" class="with-circle" /></a></div>';

                    if (globals.issues[i].status == 1 && globals.issues[i].oversum == 0) {
                        res1 += '<div style="margin-left: 15px; float: left;"><a href="#" class="clickrenew" style="float: right;" title="' + i + '"><img src="images/renew18.png" class="with-circle" /></a></div>';
                    }

                    res1 += '</div></li>';
                }

                if (globals.issues.length == 0) {
                    res1 = '<li>' + trans['noissues'] + '</li>';
                }

                $('#issuesList1').html(res1);
                $('.mycircle').each(function (t) {
                    var t = 100 * $(this).attr('data-left') / $(this).attr('data-days');
                    if (t < 0)
                    { t = 0; }

                    $(this).circleProgress({
                        value: 1 - (t / 100),
                        size: 70,
                        startAngle: Math.PI/2,
                        fill: {
                            gradient: ["green", "#7CFC00", "orange", "#FF7F50", "red"]
                        }
                    });
                });

                $('a.clickrenew').on('click', function () {
                    var i = $(this).attr('title');
                    var confirm = phonon.confirm(trans['areYouSure'], trans['renewIssue']);
                    confirm.on('confirm', function () {
                        globals.renewItem(globals.issues[i].itemnumber, onLoadIss);
                        phonon.navigator().changePage('home');
                    });
                });

                $('a.clicklink').on('click', function ()
                {
                    var i = $(this).attr('title');
                    cordova.plugins.clipboard.copy(globals.issues[i].title + ' ' + globals.issues[i].author);
                    var indicator = phonon.indicator(trans['bookClipboard'], false);
                    window.setTimeout(function () {
                        indicator.close();
                    }, 2000);
                })

            };

            activity.onClose(function (self) {
                self.close();
            });

            activity.onReady(function () {
                database.loadIssues(onLoadIss);
            });
        });

        app.on({ page: 'reservations', preventClose: true, content: 'reservations.html', readyDelay: 1 }, function (activity) {
            var onLoadRes = function ()
            {
                var res1 = '';
                var res2 = '';
                var res3 = '';
                var r1 = 0;
                var r2 = 0;
                var r3 = 0;
                for (var i = 0; i < globals.reservations.length; i++) {
                    if (globals.reservations[i].res == 0) {
                        res1 += '<p><b>' + globals.reservations[i].time + '</b><br />' + globals.reservations[i].title + '<br /><b>' + globals.reservations[i].barcode + '</b><br />' + globals.reservations[i].branch + '</p><hr style="width: 90%;" />';
                        r1++;
                    } else {
                        res2 += '<p><b>' + globals.reservations[i].time + '</b><br />' + globals.reservations[i].title + '<br /><b>' + globals.reservations[i].barcode + '</b><br />' + globals.reservations[i].branch + '</p><hr style="width: 90%;" />';
                        r2++;
                    }
                }
                
                if (res1.length < 5) {
                    res1 = '<p>--</p>';
                }

                if (res2.length < 5) {
                    res2 = '<p>--</p>';
                }

                if (res3.length < 5) {
                    res3 = '<p>--</p>';
                }

                $('#reservList1').html(res1);
                $('#reservList2').html(res2);
                $('#reservList3').html(res3);

                if (globals.community == 0) {
                    $("#suspendedholds").css('display', 'none');
                }

                var old1 = $('#reservList1a').html().replace(/\[[0-9]*\]/gi, "");
                var old2 = $('#reservList2a').html().replace(/\[[0-9]*\]/gi, "");
                var old3 = $('#reservList3a').html().replace(/\[[0-9]*\]/gi, "");

                $('#reservList1a').html(old1 + ' [' + (r1) + ']');
                $('#reservList2a').html(old2 + ' [' + (r2) + ']');
                $('#reservList3a').html(old3 + ' [' + (r3) + ']');


                var totalHeight = 10;
                $("#reservList1").children().each(function () {
                    totalHeight += $(this).outerHeight(true); // true = include margins
                });
                $('#reservList1').css('height', totalHeight+'px');

                totalHeight = 10;
                $("#reservList2").children().each(function () {
                    totalHeight += $(this).outerHeight(true); // true = include margins
                });

                $('#reservList2').css('height', totalHeight + 'px');

                totalHeight = 10;
                $("#reservList3").children().each(function () {
                    totalHeight += $(this).outerHeight(true); // true = include margins
                });

                $('#reservList3').css('height', totalHeight + 'px');
            };
            activity.onClose(function (self) {
                self.close();
            });

            activity.onReady(function () {
                globals.buttonPosition = -1;
                database.loadReservations(onLoadRes);
            });
        });

        app.on({ page: 'history', preventClose: true, content: 'history.html', readyDelay: 1 }, function (activity) {
            var onLoadRes = function () {
            };
            activity.onClose(function (self) {
                self.close();
            });

            activity.onReady(function () {
                globals.buttonPosition = -1;
            });
        });

        app.on({ page: 'payments', preventClose: true, content: 'payments.html', readyDelay: 1 }, function (activity) {
            var onPay = function () {
                $('#payments').html('' + globals.payments + globals.mypayment);
            };

            activity.onClose(function (self) {
                self.close();
            });

            activity.onReady(function () {
                globals.buttonPosition = -1;
                database.loadPayments(onPay);

            });
        });

        app.on({ page: 'about', preventClose: true, content: 'about.html', readyDelay: 1 }, function (activity) {

            activity.onClose(function (self) {
                self.close();
            });

            activity.onReady(function () {
                globals.buttonPosition = -1;
                $('#aboutName').html(globals.appName);
                $('#aboutVersion').html(globals.appVersion);
                $('#protocolVersion').html(globals.protocolVersion);
                $('#yourLibrary').html(globals.mylibrary);
            });
        });

          app.on({ page: 'makeorder', preventClose: true, content: 'makeorder.html', readyDelay: 1 }, function (activity) {

              var onReservation = function () {
                  var itemnumber = $('#makeorder_button').attr('data-id');
                  var page = $('#makeorder_button').attr('data-page');
                  globals.doReservation(itemnumber, page);
              };

            activity.onClose(function (self) {
                self.close();
            });

              activity.onCreate(function () {
                  globals.buttonPosition = -1;
                document.querySelector('.makereservation').on('tap', onReservation);
            });
          });

          app.on({ page: 'displayer', preventClose: true, content: 'displayer.html', readyDelay: 1 }, function (activity) {
               
              activity.onClose(function (self) {
                  self.close();
              });

              activity.onCreate(function () {
              });
          });

          app.on({ page: 'userinfo', preventClose: true, content: 'userinfo.html', readyDelay: 1 }, function (activity) {

              var onUserInfo = function () {
                  //globals.userinfo
                  $('#input-namesurname').val(globals.userinfo['USERINFO_firstname'] + ' ' + globals.userinfo['USERINFO_surname']);
                  $('#input-expiredtime').val(globals.userinfo['USERINFO_expiry']);
                  $('#input-email').val(globals.userinfo['USERINFO_emailaddress']);
                  $('#input-street').val(globals.userinfo['USERINFO_physstreet']);
                  $('#input-city').val(globals.userinfo['USERINFO_streetcity']);
                  $('#input-postcode').val(globals.userinfo['USERINFO_homezipcode']);
                  $('#input-phone').val(globals.userinfo['USERINFO_phone']);
                  $('#input-mobilephone').val(globals.userinfo['USERINFO_phoneday']);
              };

              activity.onClose(function (self) {
                  self.close();
              });

              activity.onReady(function () {
                  globals.buttonPosition = -1;
                  database.loadUserInfo(onUserInfo);
              });

              activity.onCreate(function () {

              });
          });

          app.on({ page: 'myid', preventClose: true, content: 'myid.html', readyDelay: 1 }, function (activity) {

              var onMyId = function () {
                  //globals.userinfo
                  $('#myid_name').html(globals.userinfo['USERINFO_firstname'] + ' ' + globals.userinfo['USERINFO_surname']);
                  $('#myid_library').html(globals.branches[globals.userinfo['USERINFO_branchcode']]);
                  $('#myid_dates').html(globals.userinfo['USERINFO_dateenrolled'] + ' - ' + globals.userinfo['USERINFO_expiry']);
                  var code = globals.userinfo['USERINFO_cardnumber'];
                  var code2 = globals.userinfo['USERINFO_userid'];

                  if (code2 * 1 > 0)
                  {
                      code = code2;
                  }

                  if (code * 1 > 0 && code.length == 13) {
                      $("#ean").EAN13(code);
                  } else {
                      $("#ean").JsBarcode(code, {
                          format: "CODE128",
                          displayValue: true,
                          fontSize: 24,
                          lineColor: "#000000"
                      });

                  };
              };
              
              activity.onClose(function (self) {
                  self.close();
              });

              activity.onReady(function () {
                  globals.buttonPosition = -1;
                  database.loadUserInfo(onMyId);
              });

              activity.onCreate(function () {
         
              });
          });



        app.on({ page: 'searchonline', preventClose: true, content: 'searchonline.html', readyDelay: 1 }, function (activity) {
            var onSearch = function () {
                var title = $('#search-title').val();
                var author = $('#search-author').val();
                var isbn = $('#search-isbn').val();
                var ukd = $('#search-ukd').val();
                var subjects = $('#search-subjects').val();
                var signature = $('#search-signature').val();
                var publication = $('#search-publicationyear').val();

                globals.findMe(title, author, isbn, ukd, subjects, signature, publication);
            };

            activity.onClose(function (self) {
                self.close();
            });

            activity.onCreate(function () {
                globals.buttonPosition = -1;
                document.querySelector('.search').on('tap', onSearch);
            });
        });

        app.on({ page: 'searchbarcodeonline', preventClose: true, content: 'searchbarcodeonline.html', readyDelay: 1 }, function (activity) {
            var onSearchBarcode = function () {
                cordova.plugins.barcodeScanner.scan(
                function (result) {
                    if (result.text.length > 1) {
                        globals.findBarcode(result.text, result.format);
                    }
                }, 
                function (error) {
                    phonon.alert(trans.scanningFailed + error, 'Error');
                }
                );
            };

            activity.onClose(function (self) {
                self.close();
            });

            activity.onCreate(function () {
                globals.buttonPosition = -1;
                document.querySelector('.searchBarcode').on('tap', onSearchBarcode);
            });
        });


        app.on({ page: 'proposition', preventClose: true, content: 'proposition.html', readyDelay: 1 }, function (activity) {
            var onProposition = function () {
                globals.sendProposition();
            };

            activity.onClose(function (self) {
                self.close();
            });

            activity.onCreate(function () {
                globals.buttonPosition = -1;
                document.querySelector('.proposition').on('tap', onProposition);
            });
        });

        app.on({ page: 'settings', preventClose: true, content: 'settings.html', readyDelay: 1 }, function (activity) {
            var onLibrary = function (evt) {
                var target = evt.target;
                var el = document.getElementById('libraryselector');
                var sl = document.querySelector('.libval');

                if (target.getAttribute('data-order')) {
                    el.innerHTML = target.innerHTML;
                    sl.value = target.getAttribute('option');
                }
            };

            var onCalendar = function (evt) {
                var target = evt.target;
                var el = document.getElementById('calendarsselector');
                var sl = document.querySelector('.libvalc');

                if (target.getAttribute('data-order')) {
                    el.innerHTML = target.innerHTML;
                    sl.value = target.getAttribute('option');
                }
            };


            var onNFC = function (evt) {
                var target = evt.target;
                var el = document.getElementById('nfcselector');
                var sl = document.querySelector('.libvalcnfc');

                if (target.getAttribute('data-order')) {
                    el.innerHTML = target.innerHTML;
                    sl.value = target.getAttribute('option');
                }
            };


            var onTest = function (self) {
                var myuser = $('#input-login').val();
                var mypassword = $('#input-password').val();
                var mylibrary = $('#input-library').val();
                globals.testConnection(myuser, mypassword, mylibrary);
            }

            var onSave = function (self) {
                database.queryok = false;
                var myuser      = $('#input-login').val();
                var mypassword  = $('#input-password').val();
                var mylibrary   = $('#input-library').val();
                var mycalendar = $('#input-calendars').val();
                var nfc = $('#input-nfc').val();

                if (mycalendar > 0)
                {
                    window.plugins.calendar.requestReadWritePermission();
                }

                database.saveUserSettings(myuser, mypassword, mylibrary, mycalendar, nfc);
                phonon.navigator().changePage('home');
                var internet = navigator.connection.type;

                if (internet == "none") {
                } else {
                    globals.loadingFire[5] = 1;
                    setTimeout(onOnline, 2000);
                }
            }

            var onCancel = function (self) {
                phonon.navigator().changePage('home');
            }

            activity.onClose(function (self) {
                self.close();
            });

            activity.onReady(function () {
                globals.buttonPosition = -1;
                globals.loadSettings();
            });

            activity.onCreate(function () {
                document.querySelector('.popoverl').on('tap', onLibrary);
                document.querySelector('.popoverc').on('tap', onCalendar);
                document.querySelector('.popovern').on('tap', onNFC);
                document.querySelector('.save').on('tap', onSave);
                document.querySelector('.cancel').on('tap', onCancel);
                document.querySelector('.test').on('tap', onTest);
                globals.loadSettings();
            });
        });

        /* *************** INITIALIZATION ****************/

        phonon.navigator().start();
        window.plugins.uniqueDeviceID.get(globals.uniqueSucc, null);
        database.intialize();
        database.openDatabase();
        var loadedData = database.loadUserSettings();
        database.getUpdateTime();
        database.loadBranches();

        var SELECT_OK_SW = '9000';
        var UNKNOWN_CMD_SW = '0000';
        /*
        if (globals.nfc == 1) {
            // register to receive APDU commands
            hce.registerCommandCallback(onCommandNFC);

            // register to for deactivated callback
            hce.registerDeactivatedCallback(onDeactivated);

            app.okCommand = hce.util.hexStringToByteArray(SELECT_OK_SW);
            app.unknownCommand = hce.util.hexStringToByteArray(UNKNOWN_CMD_SW);
        }
        */
        // ask only if settings available (for Android v6 and up)
        if (loadedData == true)
        {
            // Calendar #[{"id":"1", "name":"first"}, ..] 
            window.plugins.calendar.listCalendars(onSuccessCalendar, null);
        }

        // timer 5 minutes [autorefresh]
        window.setInterval(function () { globals.autorefresh = true; }, 1000 * 60 * 2);

        $('#homebutton').on('click', function (t)
        {
            phonon.navigator().changePage('myid');
        });

        $('#refreshdata').on('click', function (t) {
            var internet = navigator.connection.type;
            if (internet == "none") {
                phonon.alert('Aktualizacja nieudana, włącz dostęp to Internetu!', 'Problem');
            } else {
                initLoading();
                globals.loadingFire[5]=1;
                globals.getReservations();
                globals.getIssues(null);
                globals.getPayments();
                globals.getUserInfo();
                database.getUpdateTime();
            }
        });

        $('#exit').on('click', function (t) {
            navigator.app.exitApp();
        });

        document.addEventListener("online", beforeOnline, false);
        var internet = navigator.connection.type;
        globals.fireOnline = onOnline;

        if (internet == "none") {
            $('#lastupdate').html('Brak internetu!');
        } else {
            globals.loadingFire[5]=1;
            setTimeout(onOnline, 3000);
        }
    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };

} )();