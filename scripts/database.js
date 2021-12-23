
var database = {
    intialize: function () {
        this.db = null;
        this.isok = false;
        this.queryok = false;
    },

    onSuccess: function (transaction, resultSet) {
        database.isok = true;
    },

    onError: function (transaction, error) {
        var alert = phonon.alert('Error: ' + error.message, 'Error', true, 'OK');
        alert.on('confirm', function () { });
    },

    openDatabase: function () {
        var dbSize = 5 * 1024 * 1024; // 5MB
        // open database
        database.db = window.sqlitePlugin.openDatabase({ name: "koha.db", androidDatabaseImplementation: 2 }, function (db) {
            database.isok = true;
            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS user(id INTEGER PRIMARY KEY ASC, myuser TEXT, mypassword TEXT, mycalendar INTEGER, mylibrary TEXT)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS reservations(id INTEGER PRIMARY KEY ASC, barcode TEXT, title TEXT, branch TEXT, mtimestamp TEXT, res INTEGER)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS settings(setkey TEXT PRIMARY KEY ASC, setval TEXT, mypassword TEXT)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS issues(id INTEGER PRIMARY KEY ASC, status INTEGER, itemcallnumber TEXT, biblionumber INTEGER, itemtype TEXT, branchcode TEXT, barcode TEXT, author TEXT, datedue TEXT, title TEXT, borrowdate TEXT, overdueprice REAL, overdue REAL, oversum REAL, itemnumber INTEGER)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS calendars(id TEXT PRIMARY KEY ASC, itemnumber INTEGER, datedue TEXT, borrowdate TEXT)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS branches(branchcode TEXT PRIMARY KEY ASC, branchname TEXT)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS results(biblionumber INTEGER PRIMARY KEY ASC, title TEXT, subtitle TEXT, itemtype TEXT, isbn TEXT, author TEXT, publicationyear INTEGER, responsibility TEXT, branches TEXT, place TEXT)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS resultsItems(itemnumber INTEGER PRIMARY KEY ASC, biblionumber INTEGER, status INTEGER, itemcallnumber TEXT, branch TEXT, issued TEXT, reserved TEXT, cloud TEXT, overdueprice TEXT, libtype TEXT, other TEXT, FOREIGN KEY (biblionumber) REFERENCES results(biblionumber))", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS biblioImage(biblionumber INTEGER PRIMARY KEY ASC,  coverimage BLOB, smallimage BLOB, image BLOB, textVersion TEXT, pdfversion BLOB,iscover INTEGER, ispdf INTEGER)", [],
                        database.onSuccess, database.onError);
            });

            db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS paymentsBranch(branchcode TEXT PRIMARY KEY ASC, amount TEXT)", [],
                        database.onSuccess, database.onError);
            });

        });
    },

    setUpdateTime: function () {
        var d = new Date();
        var mydate = globals.fixZero(d.getHours()) + ':' + globals.fixZero(d.getMinutes()) + ':' + globals.fixZero(d.getSeconds()) + ' ' + globals.fixZero(d.getFullYear()) + '/' + globals.fixZero(d.getMonth()+1) + '/' + globals.fixZero(d.getDate());

        database.db.transaction(function (tx) {
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("UPDATETIME", ?)', [mydate]);
        }, null, function () {
            database.queryok = true;
            database.getUpdateTime();
        });

    },
    getUpdateTime: function () {
        var trans = { 'lastUpdate': 'last update' };

        phonon.i18n().get(['lastUpdate'], function (values) {
            trans = values;
        });

        database.db.transaction(function (tx) {
            tx.executeSql("select setval from settings where setkey = 'UPDATETIME'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    $('#lastupdate').html(trans['lastUpdate']+' '+res.rows.item(0).setval);
                }
            });
        });
    },
    saveUserSettings: function (myuser, mypassword, mylibrary, mycalendar, nfc) {

        globals.myuser      = myuser;
        globals.mypassword  = mypassword;
        globals.mylibrary   = mylibrary;
        globals.mycalendar = mycalendar;
        globals.nfc = nfc;

        database.db.transaction(function (tx) {
            tx.executeSql('REPLACE INTO user (id, myuser, mypassword, mylibrary, mycalendar) VALUES (1, ?, ?, ?, ?)', [myuser, mypassword, mylibrary, mycalendar]);
        }, function() {
            database.queryok = true;

        });

        database.db.transaction(function (tx) {
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("NFC", ?)', [nfc]);
        }, null, function () {
            database.queryok = true;
        });

    },
    loadUserSettings: function () {
        var z = 0;
        var resultFunc = true;


        database.db.transaction(function (tx) {
            tx.executeSql("select setkey,setval from settings where setkey LIKE 'NFC'", [], function (tx, res) {
                if (res.rows.length > 0) {
                        globals.nfc = res.rows.item(0).setval;
                }
            });
        });

        database.db.transaction(function (tx) {
            tx.executeSql("select id,itemnumber, datedue, borrowdate from calendars", [], function (tx, res) {
                for (var i=0; i<res.rows.length; i++) {
                    var datedue = res.rows.item(i).datedue.toString().split('-');
                    var d1 = new Date(datedue[0], datedue[1] * 1 - 1, datedue[2], 0, 00, 0, 0, 0);
                    var d2 = new Date();
                    if ((d1.getTime() + (1000 * 24 * 30)) > (d2.getTime())) {
                        globals.reminders[z] = {
                            itemnumber: res.rows.item(i).itemnumber, datedue: res.rows.item(i).datedue,
                            borrowdate: res.rows.item(i).borrowdate
                        }

                        z++;
                    }
                }
            });

            tx.executeSql("select myuser, mypassword, mylibrary, mycalendar from user where id = 1", [], function (tx, res) {
                if (res.rows.length > 0) {
                    globals.myuser = res.rows.item(0).myuser;
                    globals.mypassword = res.rows.item(0).mypassword;
                    globals.mylibrary = res.rows.item(0).mylibrary;
                    globals.mycalendar = res.rows.item(0).mycalendar;
                } else {
                    // redirect to settings page
                    phonon.navigator().changePage('settings');
                    resultFunc = false;
                }
            }, function ()
            {
                // redirect to settings page
                phonon.navigator().changePage('settings');
                resultFunc = false;
            });
        });

        return resultFunc;
    },
    loadBranches: function() {
        globals.branches = [];
        database.db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM branches', [], function (tx, results) {
            for (i = 0; i < results.rows.length; i++) {
                globals.branches[results.rows.item(i).branchcode.toString().toUpperCase()] = results.rows.item(i).branchname;
            }
        });

        }, null, null);

    },
    loadIssues: function (funcCall) {
        globals.issues = [];
        globals.branches = [];

        database.db.transaction(function (tx) {
            var i = 0;
            tx.executeSql('SELECT * FROM issues ORDER BY title', [], function (tx, results) {
                for (i = 0; i < results.rows.length; i++) {
                    globals.issues[i] = {
                        status: results.rows.item(i).status, itemtype: results.rows.item(i).itemtype, branchcode: results.rows.item(i).branchcode, author: results.rows.item(i).author,
                        datedue: results.rows.item(i).datedue, title: results.rows.item(i).title, borrowdate: results.rows.item(i).borrowdate,
                        overdueprice: results.rows.item(i).overdueprice, overdue: results.rows.item(i).overdue, oversum: results.rows.item(i).oversum,
                        biblionumber: results.rows.item(i).biblionumber, itemcallnumber: results.rows.item(i).itemcallnumber,
                        itemnumber: results.rows.item(i).itemnumber
                    };

                };

                var old = $('#circCalc').html().replace(/\[[0-9]*\]/gi, "");
                $('#circCalc').html(old + ' [' + (results.rows.length) + ']');

            });

            tx.executeSql('SELECT * FROM branches', [], function (tx, results) {
                for (i = 0; i < results.rows.length; i++) {
                    globals.branches[results.rows.item(i).branchcode.toString().toUpperCase()] = results.rows.item(i).branchname;
                }
            });

        },null,funcCall);

    },
    loadUserInfo: function (funcCall) {
        database.db.transaction(function (tx) {
            tx.executeSql("select setkey,setval from settings where setkey LIKE 'USERINFO_%'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    for (var a = 0; a < res.rows.length; a++) {
                        globals.userinfo[res.rows.item(a).setkey] = res.rows.item(a).setval;
                    }
                }
            });
        }, null, funcCall);


    },
    loadPayments: function (funcCall) {
        globals.payments = 0;
        var trans;

        phonon.i18n().get(['branch', 'amount', 'accruedPenalties'], function (values) {
            trans = values;
        });

        database.db.transaction(function (tx) {
            tx.executeSql("select setval from settings where setkey = 'PAYMENTS'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    globals.payments = res.rows.item(0).setval;
                    var old = $('#payCalc').html().replace(/\[[0-9\/A-Z \.]*\]/gi, "");
                    $('#payCalc').html(old + ' [' + globals.payments + globals.mypayment + ']');
                }
            });

            var res = '';
            res += '<table style="width: 100%;">';
            res += '<thead><tr>';
            res += '<th colspan="3">' + trans['accruedPenalties'] + '</th></tr><tr>';
            res += '<th colspan="2">' + trans['branch'] + '</th><th>' + trans['amount'] + '</th>';
            res += '</tr></thead>';
            res += '<tbody>';

            tx.executeSql('SELECT * FROM paymentsBranch', [], function (tx, results) {
                for (i = 0; i < results.rows.length; i++) {
                    res += '<tr><td>' + globals.branches[results.rows.item(i).branchcode] + '</td><td>' + results.rows.item(i).branchcode + '</td><td>' + results.rows.item(i).amount + '</td></tr>';
                };
                res += '</tbody></table>';
                $('#paymentsBranch').html(res);
            });


        }, null, funcCall);

    },
    loadReservations: function (funcCall) {
        globals.reservations = [];
        database.db.transaction(function (tx) {
            var i = 0;
            tx.executeSql('SELECT * FROM reservations ORDER BY title', [], function (tx, results) {
                var cdx = [0, 0, 0];

                for (i = 0; i < results.rows.length; i++) {
                    globals.reservations[i] = {
                        barcode: results.rows.item(i).barcode, title: results.rows.item(i).title, branch: results.rows.item(i).branch, res: results.rows.item(i).res, time: results.rows.item(i).mtimestamp
                    };
                    cdx[results.rows.item(i).res]++;
                }

                var old = $('#resCalc').html().replace(/\[[0-9\/ ]*\]/gi, "");
                $('#resCalc').html(old + ' [' + cdx[1] + ' / ' + cdx[0] + ']');
            });

        },null,funcCall);
    },

    loadResult: function () {
        var trans = {
            'next': 'Next',
            'prev': 'Prev',
            'search': 'Search',
            'results': 'Results'
        };

        var counter = 0;
        var myVar = 0;
        var myVar1 = 0;
        var queue = [];
        var i = 0;
        var but = '';
        var results;
        var resultok = 0;

        phonon.i18n().get(['ok', 'branch', 'notforloan', 'barcode', 'issuedReturnDate', 'reservedSince', 'issuedAt', 'available', 'availability', 'status', 'branch', 'itemcallnumber', 'items', 'next', 'prev', 'search', 'results'], function (values) {
            trans = values;
        });

        var res = '<h4 style="text-align: center;">' + trans['results'] + ' ' + globals.searchOnlineCdx + '</h4><hr /><br />';


        database.db.transaction(function (tx) {
            tx.executeSql('SELECT results.*, biblioImage.iscover, biblioImage.ispdf FROM results LEFT OUTER JOIN biblioImage ON biblioImage.biblionumber = results.biblionumber ORDER BY title LIMIT 20 OFFSET ' + (globals.resultsPage * 20), [], function (rx, mresults) {
                results = mresults;
                resultok = 1;
            });
        }, function () {
            // error
            cordova.plugin.pDialog.dismiss();
            phonon.alert('error!!', 'error ');
        }, function () {


            var zresults = [];

            database.db.transaction(function (px) {

                for (var i = 0; i < results.rows.length; i++) {
                    if (results.rows.item(i).biblionumber * 1 > 0) {
                        zresults[results.rows.item(i).biblionumber] = {};
                        px.executeSql('SELECT * FROM resultsItems WHERE biblionumber = ? ORDER BY branch', [results.rows.item(i).biblionumber], function (wx, sresults) {
                            if (sresults.rows.length > 0) {
                                zresults[sresults.rows.item(0).biblionumber] = sresults;
                            };
                        });
                    };
                };


            }, function (err) { cordova.plugin.pDialog.dismiss(); phonon.alert('error!!','error #'+err); }, function () {
                database.queryok = true;
                cordova.plugin.pDialog.dismiss();

                
                for (var i = 0; i < results.rows.length; i++)
                {
                    var author = results.rows.item(i).author;
                    if (author.length < 2) {
                        author = results.rows.item(i).responsibility;
                    }

                    res += '<li class="divider clickableresults" onclick="openbrowser(this.getAttribute(\'data-link\')); return false;" data-link="' + globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-detail.pl?bib=' + results.rows.item(i).biblionumber + '">' + ((globals.resultsPage * 20) + i + 1) + '. ' + results.rows.item(i).title + ' ' + results.rows.item(i).subtitle + '</a></li>';

                    if (author.length > 1) {
                        res += '<li class="padded-list">' + author + '</li>';
                    }

                    res += '<li class="padded-list">' + results.rows.item(i).place + ' ' + results.rows.item(i).publicationyear;
                    res += '</li>';

                    var links = '';
                    if (results.rows.item(i).iscover > 0) {
                        links += ' <div style="margin-left:10px; float: right;"><a class="previewmaker" data-link="' + globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-showpic.pl?big=1&bibid=' + results.rows.item(i).biblionumber + '"><i class="material-icons with-circle">&#xE3B6;</i></a></div>';
                    }

                    if (results.rows.item(i).ispdf > 0) {
                        links += ' <div style="margin-left:10px; float: right;"><a onclick="downloadopenbrowser(this.getAttribute(\'data-link\'),\'preview.pdf\'); return false;" data-link="' + globals.urls[globals.mylibrary] + '/cgi-bin/koha/opac-showfile.pl?mobile=145&t=1&bibid=' + results.rows.item(i).biblionumber + '"><i class="material-icons with-circle">&#xE415;</i></a></div>';
                    }


                    if (results.rows.item(i).isbn.length > 2) {
                        res += '<li class="padded-list">ISBN: ' + results.rows.item(i).isbn + links + '</li>';
                    }else {
                        if (links.length > 2) {
                            res += '<li class="padded-list">' + links + '</li>';

                        }
                    }

                    wresults = zresults[results.rows.item(i).biblionumber];

                    if (wresults.hasOwnProperty('rows') == true) {
                        if (wresults.rows.length > 0) {

                            res += '<li><i class="pull-right icon icon-expand-more"></i>';
                            res += '<i class="material-icons" style="float: left; margin-right: 8px; margin-top: 12px; vertical-align: -12px;">&#xE431;</i> <a href="#myid' + i + '" class="padded-list clickableresults">' + trans['items'] + ' ' + results.rows.item(i).branches + '</a>';
                            res += '<div class="accordion-content">';

                            res += '<table style="width: 100%; margin-left: -10px;">';
                            res += '<thead><tr>';
                            res += '<th>' + trans['itemcallnumber'] + '</th><th>' + trans['branch'] + '</th><th>' + trans['status'] + '</th><th>' + trans['availability'] + '</th>';
                            res += '</tr></thead>';
                            res += '<tbody>';
                            for (var o = 0; o < wresults.rows.length; o++) {
                                res += '<tr>';
                                res += '<td>' + wresults.rows.item(o).itemcallnumber + '</td>';

                                if (Object.keys(globals.branches).length > 0) {
                                    res += '<td><a href="#" class="branchdescription with-circle" title="' + globals.branches[wresults.rows.item(o).branch.toString().toUpperCase()] + '">' + wresults.rows.item(o).branch + '</a></td>';
                                } else {
                                    res += '<td>' + wresults.rows.item(o).branch + '</td>';
                                };

                                res += '<td style="word-wrap: break-word;">' + wresults.rows.item(o).libtype + '</td>';

                                var stat = trans['available'];
                                var button = 1;

                                if (wresults.rows.item(o).issued.toString().length > 2) {
                                    stat = trans['issuedAt'] + ' ' + wresults.rows.item(o).issued;
                                    button = 0;
                                }

                                if (wresults.rows.item(o).reserved.toString().length > 2) {
                                    stat = trans['reservedSince'] + ' ' + wresults.rows.item(o).reserved;
                                    button = 0;
                                }

                                var r = wresults.rows.item(o).other.toString().split(';');
                                if (button == 1 && wresults.rows.item(o).status < 1 && (r[1] * 1) > 0) {
                                    res += '<td><a href="#" class="makeorder" data-id="'+wresults.rows.item(o).itemnumber+'"><i class="material-icons with-circle">&#xE02E;</i></a></td>';
                                } else {
                                    res += '<td>' + stat + '</td>';
                                }
                                res += '</tr>';

                            };
                            res += '</tbody>';
                            res += '</table>';

                            res += '</div>';
                            res += '</li>';
                        };
                    };
                }



                but += '<table style="width: 100%; border: 0px none;" border="0"><tr>';
                but += '<td style="width: 33%;">'

                if (globals.resultsPage > 0) {
                    but += '<button style="width: 100%;" class="btn  primary prev" data-order="prev" onClick="globals.resultsPage--;globals.showResults(); return false">' + trans['prev'] + '</button>';
                }

                but += '</td>'

                but += '<td style="width: 33%; text-align: center;"><button style="width: 100%;" class="btn  primary newsearch clickableresults" data-order="newsearch" onClick="globals.newResults(); return false">' + trans['search'] + '</button></td>';

                but += '<td style="width: 33%;">'
                if (((globals.resultsPage + 1) * 20) < globals.resultCdx) {
                    but += '<button style="width: 100%;" class="btn  primary next clickableresults" data-order="next" onClick="globals.resultsPage++;globals.showResults(); return false">' + trans['next'] + '</button>';
                }
                but += '</td>'
                but += '</tr></table>';
                
                $('#searchButtons').html(but);
                $('#resultsList').html(res);
                $('#searchResult').animate({ scrollTop: 0 }, 'fast');
                $('a.makeorder').on('click', function () { globals.makeReserve($(this).attr('data-id'), 'searchonline'); })
                $('a.branchdescription').on('click', function () { var alert = phonon.alert($(this).attr('title'), trans.branch, false, trans.ok); });
                $('a.previewmaker').on('click', function () {

                    phonon.navigator().changePage('displayer');
                    var filesrc = $(this).attr('data-link');
                    window.setTimeout(function () {

                        $('#viewierLoader').css('display', 'block');
                        var res = '<div style="text-align: center; width: 100%; height: 100%;"><img id="viewierimage" src="' + filesrc + '" /></div>';
                        $('#viewierContent').html(res);

                        var tmpImg = new Image();
                        tmpImg.src = filesrc;
                        tmpImg.onload = function () {
                            $('#viewierLoader').css('display', 'none');
                            var x = this.width;
                            var y = this.height;

                            if (x > screen.width)
                            {
                                var newx = screen.width - 10;

                                $('#viewierimage').css('width', newx+'px');
                                $('#viewierimage').css('height', 'auto');

                            }
                        };

                    },500);
                });

            });
        });
    },
    saveItems: function (data,biblionumber) {
        database.db.transaction(function (tx) {

            for (var it = 0; it < data.length; it++) {
                var p = data[it];

                if (data[it].wthdrawn.toString().length < 1) {
                    tx.executeSql('INSERT OR IGNORE INTO resultsItems (itemnumber, biblionumber, status, itemcallnumber, branch, issued, reserved, cloud, overdueprice, libtype, other) VALUES (?,?,?,?,?,?,?,?,?,?,?) ',
                        [p.itemnumber, biblionumber, p.status, p.itemcallnumber, p.branch, p.issued, p.reserved, p.istatus.cloudtext, p.istatus.overdueprice, p.istatus.lib, (p.istatus.penaltyType + ';' + p.istatus.hoursto)]);
                };

            };
        });

    },
    addResults: function (data, funcCall) {
        globals.resultCdx = 0;
        database.db.transaction(function (tx) {

            tx.executeSql('DELETE FROM results');
            tx.executeSql('DELETE FROM biblioImage');
            tx.executeSql('DELETE FROM resultsItems');

            for (var i = 0; i < data.records.length; i++) {
                tx.executeSql('INSERT INTO results (biblionumber, title, subtitle, author, isbn, itemtype, publicationyear,branches,place,responsibility) VALUES (?,?,?,?,?,?,?,?,?,?)',
                    [data.records[i].biblionumber, data.records[i].title, data.records[i].subtitle, data.records[i].author, data.records[i].isbn, data.records[i].itemtype, data.records[i].publicationyear, data.records[i].branches, data.records[i].place, data.records[i].responsibility]);

                if (data.records[i].cover > 0 || data.records[i].pdfversion > 0) {
                    tx.executeSql('INSERT INTO biblioImage (biblionumber, iscover, ispdf) VALUES (?,?,?)',
                        [data.records[i].biblionumber, data.records[i].cover, data.records[i].pdfversion]);
                }

                for (var it = 0; it < data.records[i].items.length; it++) {
                    var p = data.records[i].items[it];
                    if (p.wthdrawn.toString().length < 1) {
                        tx.executeSql('INSERT INTO resultsItems (itemnumber, biblionumber, status, itemcallnumber, branch, issued, reserved, cloud, overdueprice, libtype, other) VALUES (?,?,?,?,?,?,?,?,?,?,?) ',
                            [p.itemnumber, data.records[i].biblionumber, p.status, p.itemcallnumber, p.branch, p.issued, p.reserved, p.istatus.cloudtext, p.istatus.overdueprice, p.istatus.lib, (p.istatus.penaltyType + ';' + p.istatus.hoursto)]);
                    };
                };
            };
            globals.resultCdx = data.records.length;
        }, function (error) {
            cordova.plugin.pDialog.dismiss();
            phonon.alert('error!!', 'error :'+error.code);
        }, function () {
            database.queryok = true;
            funcCall();
        });

    },
    saveReminders: function () {
        database.db.transaction(function (tx) {
            tx.executeSql('DELETE FROM calendars');
            for (var i = 0; i < globals.reminders.length; i++) {
                tx.executeSql('INSERT INTO calendars (id, itemnumber, datedue, borrowdate) VALUES (?,?,?,?)', [globals.reminders[i].itemnumber+'_'+globals.reminders[i].datedue+'_'+globals.reminders[i].borrowdate,globals.reminders[i].itemnumber,globals.reminders[i].datedue,globals.reminders[i].borrowdate]);
            }
        });

    },
    addIssues: function (data, execFunc) {

        var trans;

        phonon.i18n().get(['library', 'savedtocalendar', 'removedfromcalendar'], function (values) {
            trans = values;
        });

        var successCal = function () {
            var indicator = phonon.indicator(trans['savedtocalendar'], false);
            window.setTimeout(function () {
                indicator.close();
            }, 1000);
        };

        var successCalRem = function () {
            var indicator = phonon.indicator(trans['removedfromcalendar'], false);
            window.setTimeout(function () {
                indicator.close();
            }, 1000);
        };

        var errorCal = function (error) {
            window.alert('calendar error ' + error);
        };

        database.db.transaction(function (tx) {
            tx.executeSql('DELETE FROM issues'); 
            for (var i = 0; i < data.issues.length; i++) {
                tx.executeSql('INSERT INTO issues (itemnumber, biblionumber, itemcallnumber, status, itemtype, branchcode, barcode, author, datedue, title, borrowdate, overdueprice, overdue, oversum) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [data.issues[i].itemnumber, data.issues[i].biblionumber, data.issues[i].itemcallnumber, data.issues[i].status, data.issues[i].itemtype, data.issues[i].branchcodei, data.issues[i].barcode, data.issues[i].author, data.issues[i].datedue, data.issues[i].title, data.issues[i].borrowdate, data.issues[i].overdueprice, data.issues[i].overdue, data.issues[i].oversum]);

                if (globals.mycalendar == 1) {
                    var foundYes = -1;
                    for (var z = globals.reminders.length - 1; z >= 0; z--) {
                        if (globals.reminders[z].itemnumber == data.issues[i].itemnumber &&
                            globals.reminders[z].datedue == data.issues[i].datedue &&
                            globals.reminders[z].borrowdate == data.issues[i].borrowdate) {
                            foundYes = z;
                            break;
                        }
                    }
                    if (foundYes == -1) {
                        var title = trans['library'] + ': ' + data.issues[i].title;
                        var eventLocation = globals.mylibrary;
                        var notes = '' + data.issues[i].borrowdate + ' = ' + data.issues[i].datedue;
                        var datedue = data.issues[i].datedue.toString().split('-');
                        var startDate = new Date(datedue[0], datedue[1] * 1 - 1, datedue[2], 8, 00, 0, 0, 0);
                        var endDate = new Date(datedue[0], datedue[1] * 1 - 1, datedue[2], 18, 00, 0, 0, 0);
                        var today = new Date();

                        if (endDate > today) {
                           window.plugins.calendar.createEvent(title, eventLocation, notes, startDate, endDate, successCal, errorCal);
                           globals.reminders[globals.reminders.length] = { itemnumber: data.issues[i].itemnumber, datedue: data.issues[i].datedue, borrowdate: data.issues[i].borrowdate };
                        }
                    }
                    else
                    {
                        var title = trans['library'] + ': ' + data.issues[i].title;
                        var eventLocation = globals.mylibrary;
                        var notes = '' + data.issues[i].borrowdate + ' = ' + data.issues[i].datedue;
                        var datedue = data.issues[i].datedue.toString().split('-');
                        var startDate = new Date(datedue[0], datedue[1] * 1 - 1, datedue[2], 8, 00, 0, 0, 0);
                        var endDate = new Date(datedue[0], datedue[1] * 1 - 1, datedue[2], 18, 00, 0, 0, 0);
                        var today = new Date();

                        if (endDate < today)
                        {
                            globals.reminders.splice(foundYes, 1);
                            window.plugins.calendar.deleteEvent(title, eventLocation, notes, startDate, endDate, successCalRem, errorCal);
                        }
                    }
                }
            };

            database.saveReminders();

            if (execFunc != null) {
                database.loadIssues(execFunc);
            };

            var old = $('#circCalc').html().replace(/\[[0-9]*\]/gi, "");
            $('#circCalc').html(old + ' [' + (data.issues.length) + ']');

            tx.executeSql('DELETE FROM branches');
            for (var i = 0; i < data.branches.length; i++) {
                tx.executeSql('INSERT INTO branches (branchcode, branchname) VALUES (?,?)',[data.branches[i].branchcode, data.branches[i].branchname]);
                globals.branches[data.branches[i].branchcode] = data.branches[i].branchname;
            };
        }, null, function () {
            database.queryok = true;
        });

    },
    addUserInfo: function (data) {
        database.db.transaction(function (tx) {

            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_firstname", ?)', [data.data.firstname]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_surname", ?)', [data.data.surname]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_cardnumber", ?)', [data.data.cardnumber]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_expiry", ?)', [data.data.expiry]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_dateenrolled", ?)', [data.data.dateenrolled]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_branchcode", ?)', [data.data.branchcode]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_userid", ?)', [data.data.userid]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_emailaddress", ?)', [data.data.emailaddress]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_physstreet", ?)', [data.data.physstreet]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_streetcity", ?)', [data.data.streetcity]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_homezipcode", ?)', [data.data.homezipcode]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_phone", ?)', [data.data.phone]);
            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("USERINFO_phoneday", ?)', [data.data.phoneday]);
        }, null, function () {
            database.queryok = true;
            database.getUpdateTime();
        });

    },
    addPayments: function (data) {
        database.db.transaction(function (tx) {
            if (data.hasOwnProperty('currency')) {
                globals.mypayment = data.currency;
            }

            tx.executeSql('REPLACE INTO settings (setkey,setval) VALUES ("PAYMENTS", ?)', [data.total]);
            var old = $('#payCalc').html().replace(/\[[0-9\/A-Z \.]*\]/gi, "");
            $('#payCalc').html(old + ' [' + data.total + globals.mypayment + ']');

            tx.executeSql('DELETE FROM paymentsBranch');
            for (var i = 0; i < data.branches.length; i++) {
                tx.executeSql('INSERT INTO paymentsBranch (branchcode, amount) VALUES (?,?)', [data.branches[i].branchcode, data.branches[i].amount]);
            };


        }, null, function () {
            database.queryok = true;
            database.getUpdateTime();
        });

    },
    addReservations: function (data) {
        database.db.transaction(function (tx) {
            tx.executeSql('DELETE FROM reservations');
            for (var i = 0; i < data.waiting_ok.length; i++) {
                tx.executeSql('INSERT INTO reservations (barcode, title, branch, mtimestamp, res) VALUES (?,?,?,?, 1)', [data.waiting_ok[i].barcode, data.waiting_ok[i].title, data.waiting_ok[i].branch, data.waiting_ok[i].timestamp]);
            };

            for (var i = 0; i < data.waiting.length; i++) {
                tx.executeSql('INSERT INTO reservations (barcode, title, branch, mtimestamp, res) VALUES (?,?,?,?, 0)', [data.waiting[i].barcode, data.waiting[i].title, data.waiting[i].branch, data.waiting[i].timestamp]);
            }

            if (data.hasOwnProperty('suspend')) {
                for (var i = 0; i < data.suspend.length; i++) {
                    tx.executeSql('INSERT INTO reservations (barcode, title, branch, mtimestamp, res) VALUES (?,?,?,?, 2)', [data.suspend[i].barcode, data.suspend[i].title, data.suspend[i].branch, data.suspend[i].timestamp]);
                }
            }

            var old = $('#resCalc').html().replace(/\[[0-9\/ ]*\]/gi, "");
            $('#resCalc').html(old + ' [' + (data.waiting_ok.length) + ' / ' + data.waiting.length + ']');


        }, null, function () {
            database.queryok = true;
        });

    }


}