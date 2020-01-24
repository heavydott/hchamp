$(document).ready(function() {
    let data = getSaveGame();

    if(!data.teamList) {
        $('#continue').addClass('disabled');
    }

    function getSaveGame() {
        let promData = window.localStorage.getItem('h-champ');
        let data = {};
        if(promData) {
            data = JSON.parse(promData);
        } else {
            data = {};
        }
        return data;
    }

    function setSaveGame(data) {
        window.localStorage.setItem('h-champ', JSON.stringify(data));
    }

    console.log(getSaveGame());

    // choose new game event
    $('#new-game').on('click', function() {
        let sure = confirm('Уверены?');
        if(sure) {
            window.localStorage.removeItem('h-champ');
            setSaveGame({});
            console.log(getSaveGame());
            $('#first').removeClass('active');
            $('#enter-teams').addClass('active');
        }
    });

    // choose continue event
    $('#continue').on('click', function() {
        $('#first').removeClass('active');
        $('#main').addClass('active');
        drawTable(data);
        drawSchedule(data);
    });

    // favorite event
    $('.favorite').on('click', function() {
        if($(this).hasClass('active')) {
            $(this).removeClass('active');
            $(this).html('<i class="fa fa-heart-o" aria-hidden="true"></i>');
        } else {
            $(this).addClass('active');
            $(this).html('<i class="fa fa-heart" aria-hidden="true"></i>');
        }
    });

    // add team event
    $('#another').on('click', function() {
        let listInput = $('#enter-teams-inputs input.enter-team');
        let listInputMark = $('#enter-teams-inputs input.enter-team-mark');

        $('#enter-teams-inputs').append('<div class="enter-team-wrap" data-id="' + listInput.length + '">' +
                '<input type="text" class="enter-team" placeholder="' + (listInput.length + 1) + '">' +
                '<input type="text" class="enter-team-mark" placeholder="' + (listInput.length + 1) + '">' +
                '<div class="favorite"><i class="fa fa-heart-o" aria-hidden="true"></i></div>' +
            '</div>');

        $('#enter-teams-inputs .enter-team-wrap[data-id=' + listInput.length + '] input.enter-team').focus();

        // favorite event
        $('.favorite').off('click').on('click', function() {
            if($(this).hasClass('active')) {
                $(this).removeClass('active');
                $(this).html('<i class="fa fa-heart-o" aria-hidden="true"></i>');
            } else {
                $(this).addClass('active');
                $(this).html('<i class="fa fa-heart" aria-hidden="true"></i>');
            }
        });

        if(listInput.length == 8) {
            $('#toss').show();
        } else {
            $('#toss').hide();
        }
    });

    $('#do').on('click', function() {
        data = getSaveGame();
        let playoffFlag = true;

        for(let i = 0; i < data.teamList.length; i++) {
            let team;
            let allMatches = $('#schedule .group .goals input[data-id=' + data.teamList[i].id + ']');
            data.teamList[i].play = {
                'matches': 0,
                'win': 0,
                'none': 0,
                'lose': 0,
                'goalIn': 0,
                'goalOut': 0,
                'points': 0
            };

            allMatches.each(function() {
                if($(this).val()) {

                    team = setMatches(data.teamList[i], data.teamList[i].id, $(this).parents('.goals'));

                    if(team) {
                        data.teamList[i] = team;
                        for(let j = 0; j < data.groups.length; j++) {
                            for(let k = 0; k < data.groups[j].length; k++) {
                                if(data.groups[j][k].id == team.id) {
                                    data.groups[j][k] = team;
                                }
                            }
                        }

                        let t = $(this).hasClass('g1') ? 't1' : ($(this).hasClass('g2') ? 't2' : '');
                        let g = $(this).hasClass('g1') ? 'g1' : ($(this).hasClass('g2') ? 'g2' : '');
                        let gt = parseInt($(this).parents('.group').data('id'));
                        let mt = parseInt($(this).parents('.match').data('id'));
                        data.matches.group[gt][mt][t] = team;
                        data.matches.group[gt][mt][g] = parseInt($(this).val());
                    }
                }
            });

            if(data.teamList[i].play.matches != 3) {
                playoffFlag = false;
            }
        }

        for(let i = 0; i < data.groups.length; i++) {
            data.groups[i] = data.groups[i].sort(compareR);
        }

        setSaveGame(data);

        if(playoffFlag) {
            if(!data.playoff) {
                tossPlayoff(data);
            } else {
                let playoffMatches = $('#group .playoff .goals');

                playoffMatches.each(function() {
                    let id = $(this).parents('.match').data('id');
                    let g1 = parseInt($(this).find('.g1').val());
                    let g2 = parseInt($(this).find('.g2').val());
                    let successFlag = $(this).parents('.match').find('.success').hasClass('active') ? true : false;

                    if(successFlag) {
                        if(id[0] == 'u') {
                            data.matches.playoff.upper[id].g1 = g1;
                            data.matches.playoff.upper[id].g2 = g2;
                            data.matches.playoff.upper[id].success = successFlag;
                        } else if(id[0] == 'l') {
                            data.matches.playoff.lower[id].g1 = g1;
                            data.matches.playoff.lower[id].g2 = g2;
                            data.matches.playoff.lower[id].success = successFlag;
                        }
                    }
                });

                setSaveGame(data);

                setPlayoff(data);
            }

            drawSchedule(data);
        }

        drawTable(data);
    });

    $('#toss').on('click', function() {
        let teamList = [];
        let team;
        let teamListDOM = $('#enter-teams-inputs .enter-team-wrap');

        teamListDOM.each(function() {
            let name = $(this).find('.enter-team').val();
            let mark = parseInt($(this).find('.enter-team-mark').val());
            if(name || mark) {team = {};
                team.id = $(this).data('id');
                if(name) {
                    team.name = name;
                } else {
                    alert('Введите название команды');
                }
                if(mark) {
                    team.mark = (mark > 50 || mark < 1) ? 50 : mark;
                } else {
                    team.mark = Math.floor(Math.random() * 51) + 1;
                }
                if($(this).find('.favorite').hasClass('active')) {
                    team.favorite = true;
                } else {
                    team.favorite = false;
                }

                teamList.push(team);
            }
        });

        data.teamList = teamList;

        setSaveGame(data);

        tossTable(data);

        $('#enter-teams').removeClass('active');
        $('#main').addClass('active');
    });

    // function for toss the table
    function tossTable(data) {
        let countGroups = data.teamList.length / 4;
        let groups = [];

        for(let i = 0; i < countGroups; i++) {
            groups.push([]);
        }

        data.groups = groups;
        setSaveGame(data);

        for(let i = 0; i < data.teamList.length; i++) {
            data.teamList[i].play = {
                'matches': 0,
                'win': 0,
                'none': 0,
                'lose': 0,
                'goalIn': 0,
                'goalOut': 0,
                'points': 0
            };
            data.teamList[i].sortPoints = 0;
            data.teamList[i].sortPoints2 = 0;
            data.teamList[i].sortPoints3 = 0;
            let random = randomInt(countGroups);
            setGroups(countGroups, data.teamList[i], random);
        }

        setSaveGame(data);

        drawTable(data);

        tossSchedule(data);
    }

    // function for toss the schedule
    function tossSchedule(data) {
        data.matches = {};
        data.matches.group = [];

        for(let i = 0; i < data.groups.length; i++) {
            data.matches.group.push([]);

            for(let j = 0; j < data.groups[i].length; j++) {
                for(let k = j + 1; k < data.groups[i].length; k++) {
                    data.matches.group[i].push({
                        t1: data.groups[i][j],
                        t2: data.groups[i][k],
                        g1: 0,
                        g2: 0
                    });
                }
            }

            data.matches.group[i] = data.matches.group[i].sort(function(){
                return Math.random() - 0.5;
            });
        }

        setSaveGame(data);

        drawSchedule(data);
    }

    // function for random integer
    function randomInt(max) {
        let rand = 1 - 0.5 + Math.random() * (max - 1 + 1);
        return Math.round(rand);
    }

    // function for set groups
    function setGroups(countGroups, team, random) {
        if(data.groups[random - 1].length < 4) {
            data.groups[random - 1].push(team);
        } else {
            setGroups(countGroups, team, randomInt(countGroups));
        }
    }

    // function for draw table
    function drawTable(data) {
        let container = $('#table');
        let code = '';

        for(let i = 0; i < data.groups.length; i++) {
            code += '<div class="group" data-id="' + i + '">' +
                        '<table cellspacing="0" border="0" class="group-body">' +
                            '<colgroup>' +
                                '<col width="50%">' +
                                '<col width="7%">' +
                                '<col width="7%">' +
                                '<col width="7%">' +
                                '<col width="7%">' +
                                '<col width="15%">' +
                                '<col width="7%">' +
                            '</colgroup>' +
                            '<thead>' +
                                '<tr>' +
                                    '<th class="name">Группа ' + (i + 1) + '</th>' +
                                    '<th class="matches">И</th>' +
                                    '<th class="win">В</th>' +
                                    '<th class="none">Н</th>' +
                                    '<th class="lose">П</th>' +
                                    '<th class="goals">З-П</th>' +
                                    '<th class="points">О</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>';

            for(let j = 0; j < data.groups[i].length; j++) {
                code += '<tr class="team-item" data-id="' + i + '">' +
                            '<td class="team name" data-id="' + data.groups[i][j].id + '">' + data.groups[i][j].name + '</td>' +
                            '<td class="team matches">' + data.groups[i][j].play.matches + '</td>' +
                            '<td class="team win">' + data.groups[i][j].play.win + '</td>' +
                            '<td class="team none">' + data.groups[i][j].play.none + '</td>' +
                            '<td class="team lose">' + data.groups[i][j].play.lose + '</td>' +
                            '<td class="team goals">' + data.groups[i][j].play.goalIn + '-' + data.groups[i][j].play.goalOut + '</td>' +
                            '<td class="team points">' + data.groups[i][j].play.points + '</td>' +
                        '</tr>';
            }

            code += '</tbody>' +
                '</table>' +
                '</div>';
        }

        if(data.matches && data.matches.playoff) {
            code += drawPlayoffTable(data.matches.playoff);
        }

        container.html(code);
    }

    // function for draw schedule
    function drawSchedule(data) {
        let container = $('#schedule #group');
        let code = '';

        for(let i = 0; i < data.matches.group.length; i++) {
            code += '<div class="group" data-id="' + i + '">' +
                '<div class="title">Группа ' + (i + 1) + '</div>';

            for(let j = 0; j < data.matches.group[i].length; j++) {
                code += drawMatch(data.matches.group[i][j], j, i);
            }

            code += '</div>';
        }

        if(data.matches.playoff) {
            // setPlayoff(data);

            code += '<div class="playoff">' +
                '<div class="title">Плей-офф</div>';

            if(data.matches.playoff.lower.l1) {
                code += drawMatch(data.matches.playoff.lower.l1, 'l1', '');
            }
            if(data.matches.playoff.lower.l2) {
                code += drawMatch(data.matches.playoff.lower.l2, 'l2', '');
            }

            if(data.matches.playoff.upper.u1) {
                code += drawMatch(data.matches.playoff.upper.u1, 'u1', '');
            }
            if(data.matches.playoff.upper.u2) {
                code += drawMatch(data.matches.playoff.upper.u2, 'u2', '');
            }

            if(data.matches.playoff.lower.l3) {
                code += drawMatch(data.matches.playoff.lower.l3, 'l3', '');
            }
            if(data.matches.playoff.lower.l4) {
                code += drawMatch(data.matches.playoff.lower.l4, 'l4', '');
            }

            if(data.matches.playoff.upper.u3) {
                code += drawMatch(data.matches.playoff.upper.u3, 'u3', '');
            }

            if(data.matches.playoff.lower.l5) {
                code += drawMatch(data.matches.playoff.lower.l5, 'l5', '');
            }
            if(data.matches.playoff.lower.l6) {
                code += drawMatch(data.matches.playoff.lower.l6, 'l6', '');
            }

            if(data.matches.playoff.upper.u4) {
                code += drawMatch(data.matches.playoff.upper.u4, 'u4', '');

                if(data.matches.playoff.upper.u4.success) {
                    code += '<div id="winner">' +
                        ((data.matches.playoff.upper.u4.g1 > data.matches.playoff.upper.u4.g2) ? data.matches.playoff.upper.u4.t1.name : data.matches.playoff.upper.u4.t2.name) + ' победитель' +
                            '</div>';
                }
            }

            code += '</div>';
        }

        container.html(code);

        $('.do-random').on('click', function() {
            let containerMatch = $(this).parents('.match');
            let teamId1 = containerMatch.find('.t1').data('id');
            let teamId2 = containerMatch.find('.t2').data('id');
            let teamMark1, teamMark2, addG1, addG2, g1, g2;

            for(let i = 0; i < data.teamList.length; i++) {
                if(data.teamList[i].id == parseInt(teamId1)) {
                    teamMark1 = data.teamList[i].mark;
                }
                if(data.teamList[i].id == parseInt(teamId2)) {
                    teamMark2 = data.teamList[i].mark;
                }
            }

            teamMark1 = parseInt(teamMark1 / 10);
            teamMark2 = parseInt(teamMark2 / 10);

            if(teamMark1 < teamMark2) {
                g1 = Math.floor(Math.random() * (1 + 1));
                g2 = teamMark2 - teamMark1;
            } else if(teamMark2 < teamMark1) {
                g2 = Math.floor(Math.random() * (1 + 1));
                g1 = teamMark1 - teamMark2;
            } else {
                g1 = parseInt(teamMark1 / 2);
                g2 = parseInt(teamMark2 / 2);
            }

            containerMatch.find('.g1').val(g1);
            containerMatch.find('.g2').val(g2);
        });

        $('.success').on('click', function() {
            let group = parseInt($(this).data('group'));
            let match = $(this).data('match');

            // console.log();
            if(group == 0 || group == 1) {
                data.matches.group[group][match].success = true;
            } else {
                let id = match[0];
                if(id == 'u') {
                    data.matches.playoff.upper[match].success == true;
                } else if(id == 'l') {
                    data.matches.playoff.lower[match].success == true;
                }
            }

            $(this).addClass('active');

            setSaveGame(data);
        });
    }

    function drawMatch(match, matchId, groupId) {
        let code = '';
        let value1 = match.success ? 'value="' + match.g1 + '"' : false;
        let value2 = match.success ? 'value="' + match.g2 + '"' : false;
        let active = match.success ? 'active' : '';
        code += '<div class="match" data-id="' + matchId + '">' +
                    '<div class="t1" data-id="' + match.t1.id + '">' + match.t1.name + '</div>' +
                    '<div class="goals">' +
                        '<input type="text" class="g1" placeholder="0" data-id="' + match.t1.id + '" ' + (value1 ? value1 : '') + '>:' +
                        '<input type="text" class="g2" placeholder="0" data-id="' + match.t2.id + '" ' + (value2 ? value2 : '') + '>' +
                    '</div>' +
                    '<div class="t2" data-id="' + match.t2.id + '">' + match.t2.name + '</div>' +
                    '<div class="do-random" data-group="' + groupId + '" data-match="' + matchId + '">Случайный счет</div>' +
                    '<div class="success ' + active + '" data-group="' + groupId + '" data-match="' + matchId + '">Готово</div>' +
                '</div>';

        return code;
    }

    // function for set win/none/lose/goals/points
    function setMatches(team, id, goalsContainer) {
        let currGoals = goalsContainer.find('input[data-id=' + id + ']').val();
        let versGoals = goalsContainer.find('input:not([data-id=' + id + '])').val();

        if(currGoals && versGoals) {
            team.play.matches++;
            team.play.goalIn += parseInt(currGoals);
            team.play.goalOut += parseInt(versGoals);

            if(currGoals > versGoals) {
                team.play.win++;
                team.play.points += 3;
            } else if(currGoals == versGoals) {
                team.play.none++;
                team.play.points += 1;
            } else {
                team.play.lose++;
            }

            team.sortPoints = team.play.points;
            team.sortPoints2 = team.play.goalIn - team.play.goalOut;
            team.sortPoints3 = team.play.goalIn;
        } else {
            alert('Заполните счет');
        }

        return team;
    }

    // function for srot groups
    function compareR(a, b) {
        if (a.sortPoints > b.sortPoints)
            return -1;
        if (a.sortPoints < b.sortPoints)
            return 1;
        if (a.sortPoints2 > b.sortPoints2)
            return -1;
        if (a.sortPoints2 < b.sortPoints2)
            return 1;
        if (a.sortPoints3 > b.sortPoints3)
            return -1;
        if (a.sortPoints3 < b.sortPoints3)
            return 1;
        return 0;
    }

    // function for toss play-off
    function tossPlayoff(data) {
        let addUp = [];
        let addLo = [];
        data.playoff = {
            upper: [],
            lower: []
        };

        for(let i = 0; i < data.groups.length; i++) {
            for(let j = 0; j < 2; j++) {
                addUp.push(data.groups[i][j]);
            }

            for(let j = 2; j < 4; j++) {
                addLo.push(data.groups[i][j]);
            }
        }

        addUp = addUp.sort(function(){
            return Math.random() - 0.5;
        });

        addLo = addLo.sort(function(){
            return Math.random() - 0.5;
        });

        for(let i = 0; i < addUp.length; i++) {
            data.playoff.upper.push(addUp[i]);
        }

        for(let i = 0; i < addLo.length; i++) {
            data.playoff.lower.push(addLo[i]);
        }

        setSaveGame(data);

        setPlayoff(data);
    }

    // function for set play-off schedule
    function setPlayoff(data) {
        // debugger;
        if(!data.matches.playoff)
            data.matches.playoff = {
                upper: {},
                lower: {}
            };

        if(!data.matches.playoff.upper.u1)
            data.matches.playoff.upper.u1 = {
                t1: data.playoff.upper[0],
                t2: data.playoff.upper[1],
                g1: 0,
                g2: 0,
                success: false
            };

        if(!data.matches.playoff.upper.u2)
            data.matches.playoff.upper.u2 = {
                t1: data.playoff.upper[2],
                t2: data.playoff.upper[3],
                g1: 0,
                g2: 0,
                success: false
            };

        if(!data.matches.playoff.upper.u3)
            data.matches.playoff.upper.u3 = false;

        if(!data.matches.playoff.upper.u4)
            data.matches.playoff.upper.u4 = false;

        if(!data.matches.playoff.lower.l1)
            data.matches.playoff.lower.l1 = {
                t1: data.playoff.lower[2],
                t2: data.playoff.lower[3],
                g1: 0,
                g2: 0,
                success: false
            };

        if(!data.matches.playoff.lower.l2)
            data.matches.playoff.lower.l2 = {
                t1: data.playoff.lower[0],
                t2: data.playoff.lower[1],
                g1: 0,
                g2: 0,
                success: false
            };

        if(!data.matches.playoff.lower.l3)
            data.matches.playoff.lower.l3 = false;

        if(!data.matches.playoff.lower.l4)
            data.matches.playoff.lower.l4 = false;

        if(!data.matches.playoff.lower.l5)
            data.matches.playoff.lower.l5 = false;

        if(!data.matches.playoff.lower.l6)
            data.matches.playoff.lower.l6 = false;

        if(data.matches.playoff.upper.u1.success && data.matches.playoff.upper.u2.success) {
            if(!data.matches.playoff.upper.u3)
                data.matches.playoff.upper.u3 = {
                    t1: getWinner(data.matches.playoff.upper.u1),
                    t2: getWinner(data.matches.playoff.upper.u2),
                    g1: 0,
                    g2: 0,
                    success: false
                };
        }
        if(data.matches.playoff.upper.u3.success && data.matches.playoff.lower.l6.success) {
            if(!data.matches.playoff.upper.u4)
                data.matches.playoff.upper.u4 = {
                    t1: getWinner(data.matches.playoff.upper.u3),
                    t2: getWinner(data.matches.playoff.lower.l6),
                    g1: 0,
                    g2: 0,
                    success: false
                };
        }
        if(data.matches.playoff.lower.l1.success && data.matches.playoff.upper.u2.success) {
            if(!data.matches.playoff.lower.l3)
                data.matches.playoff.lower.l3 = {
                    t1: getLoser(data.matches.playoff.upper.u2),
                    t2: getWinner(data.matches.playoff.lower.l1),
                    g1: 0,
                    g2: 0,
                    success: false
                };
        }
        if(data.matches.playoff.lower.l2.success && data.matches.playoff.upper.u1.success) {
            if(!data.matches.playoff.lower.l4)
                data.matches.playoff.lower.l4 = {
                    t1: getLoser(data.matches.playoff.upper.u1),
                    t2: getWinner(data.matches.playoff.lower.l2),
                    g1: 0,
                    g2: 0,
                    success: false
                };
        }
        if(data.matches.playoff.lower.l3.success && data.matches.playoff.lower.l4.success) {
            if(!data.matches.playoff.lower.l5)
                data.matches.playoff.lower.l5 = {
                    t1: getWinner(data.matches.playoff.lower.l3),
                    t2: getWinner(data.matches.playoff.lower.l4),
                    g1: 0,
                    g2: 0,
                    success: false
                };
        }
        if(data.matches.playoff.lower.l5.success && data.matches.playoff.upper.u3.success) {
            if(!data.matches.playoff.lower.l6)
                data.matches.playoff.lower.l6 = {
                    t1: getWinner(data.matches.playoff.lower.l5),
                    t2: getLoser(data.matches.playoff.upper.u3),
                    g1: 0,
                    g2: 0,
                    success: false
                };
        }

        setSaveGame(data);
    }

    // function for get winner
    function getWinner(match) {
        return (match.g1 > match.g2) ? match.t1 : match.t2;
    }

    // function for get loser
    function getLoser(match) {
        return (match.g1 > match.g2) ? match.t2 : match.t1;
    }

    function drawPlayoffTable(matches) {
        let code = '<div class="cont"><div class="title">Плей-офф</div><div class="scroll">' +
            '   <table id="playoff-table">' +
            '        <colgroup>' +
            '           <col width="8%">' +
            '           <col width="3%">' +
            '           <col width="3,5%">' +
            '           <col width="3,5%">' +
            '           <col width="8%">' +
            '           <col width="3%">' +
            '           <col width="3,5%">' +
            '           <col width="3,5%">' +
            '           <col width="8%">' +
            '           <col width="3%">' +
            '           <col width="3,5%">' +
            '           <col width="3,5%">' +
            '           <col width="8%">' +
            '           <col width="3%">' +
            '           <col width="3,5%">' +
            '           <col width="3,5%">' +
            '           <col width="8%">' +
            '           <col width="3%">' +
            '           <col width="3,5%">' +
            '           <col width="3,5%">' +
            '           <col width="10%">' +
            '        </colgroup>' +
            '        <tbody>' +
            '            <tr>' +
            '                <td colspan="21">Верхняя ветка</td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="up1t1">' + ((matches.upper.u1) ? matches.upper.u1.t1.name : '') + '</td>' +
            '                <td data-id="up1g1">' + ((matches.upper.u1) ? matches.upper.u1.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="up1t2">' + ((matches.upper.u1) ? matches.upper.u1.t2.name : '') + '</td>' +
            '                <td data-id="up1g2">' + ((matches.upper.u1) ? matches.upper.u1.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bb bl"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td data-id="up3t1">' + ((matches.upper.u3) ? matches.upper.u3.t1.name : '') + '</td>' +
            '                <td data-id="up3g1">' + ((matches.upper.u3) ? matches.upper.u3.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td data-id="up4t1">' + ((matches.upper.u4) ? matches.upper.u4.t1.name : '') + '</td>' +
            '                <td data-id="up4g1">' + ((matches.upper.u4) ? matches.upper.u4.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td data-id="winner" rowspan="2">' + ((matches.upper.u4 && matches.upper.u4.success) ? getWinner(matches.upper.u4).name : '') + '</td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td data-id="up3t2">' + ((matches.upper.u3) ? matches.upper.u3.t2.name : '') + '</td>' +
            '                <td data-id="up3g2">' + ((matches.upper.u3) ? matches.upper.u3.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td data-id="up4t2">' + ((matches.upper.u4) ? matches.upper.u4.t2.name : '') + '</td>' +
            '                <td data-id="up4g2">' + ((matches.upper.u4) ? matches.upper.u4.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="up2t1">' + ((matches.upper.u2) ? matches.upper.u2.t1.name : '') + '</td>' +
            '                <td data-id="up2g1">' + ((matches.upper.u2) ? matches.upper.u2.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="up2t2">' + ((matches.upper.u2) ? matches.upper.u2.t2.name : '') + '</td>' +
            '                <td data-id="up2g2">' + ((matches.upper.u2) ? matches.upper.u2.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td colspan="21">Нижняя ветка</td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="lo1t1">' + ((matches.lower.l1) ? matches.lower.l1.t1.name : '') + '</td>' +
            '                <td data-id="lo1g1">' + ((matches.lower.l1) ? matches.lower.l1.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td data-id="lo3t1">' + ((matches.lower.l3) ? matches.lower.l3.t1.name : '') + '</td>' +
            '                <td data-id="lo3g1">' + ((matches.lower.l3) ? matches.lower.l3.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="lo1t2">' + ((matches.lower.l1) ? matches.lower.l1.t2.name : '') + '</td>' +
            '                <td data-id="lo1g2">' + ((matches.lower.l1) ? matches.lower.l1.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td data-id="lo3t2">' + ((matches.lower.l3) ? matches.lower.l3.t2.name : '') + '</td>' +
            '                <td data-id="lo3t2">' + ((matches.lower.l3) ? matches.lower.l3.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bb bl"></td>' +
            '                <td data-id="lo5t1">' + ((matches.lower.l5) ? matches.lower.l5.t1.name : '') + '</td>' +
            '                <td data-id="lo5g1">' + ((matches.lower.l5) ? matches.lower.l5.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td data-id="lo6t1">' + ((matches.lower.l6) ? matches.lower.l6.t1.name : '') + '</td>' +
            '                <td data-id="lo6t1">' + ((matches.lower.l6) ? matches.lower.l6.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td class="bl"></td>' +
            '                <td data-id="lo5t2">' + ((matches.lower.l5) ? matches.lower.l5.t2.name : '') + '</td>' +
            '                <td data-id="lo5g2">' + ((matches.lower.l5) ? matches.lower.l5.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td data-id="lo6t2">' + ((matches.lower.l6) ? matches.lower.l6.t2.name : '') + '</td>' +
            '                <td data-id="lo6g2">' + ((matches.lower.l6) ? matches.lower.l6.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="lo2t1">' + ((matches.lower.l2) ? matches.lower.l2.t1.name : '') + '</td>' +
            '                <td data-id="lo2g1">' + ((matches.lower.l2) ? matches.lower.l2.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bb"></td>' +
            '                <td data-id="lo4t1">' + ((matches.lower.l4) ? matches.lower.l4.t1.name : '') + '</td>' +
            '                <td data-id="lo4g1">' + ((matches.lower.l4) ? matches.lower.l4.g1 : '') + '</td>' +
            '                <td class="bb"></td>' +
            '                <td class="bl"></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '            <tr>' +
            '                <td data-id="lo2t2">' + ((matches.lower.l2) ? matches.lower.l2.t2.name : '') + '</td>' +
            '                <td data-id="lo2g2">' + ((matches.lower.l2) ? matches.lower.l2.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td data-id="lo4t2">' + ((matches.lower.l4) ? matches.lower.l4.t2.name : '') + '</td>' +
            '                <td data-id="lo4g2">' + ((matches.lower.l4) ? matches.lower.l4.g2 : '') + '</td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '                <td></td>' +
            '            </tr>' +
            '        </tbody>' +
            '    </table>' +
            '</div></div>';

        return code;
    }
});
