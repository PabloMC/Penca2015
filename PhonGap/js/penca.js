/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var db;
var logueado = false;
var nombre = "";
var userId = "";
var globalvar;
var mail = "";
var pass = "";
var country1;
var country2;
var codCountry1;
var codCountry2;
var cantApuestas = 0;
var puntosObtenidos = 0;
$(document).ready(iniciar);
$(document).on('click', '#apostar', apostar);
$(document).on('click', '#btnLogIn', registro);
$(document).on('click', '.validar', validarApuesta);
$(document).on('click', '#editarApuesta', cargarEdicionApuesta);
$(document).on('click', '#editBet', editBet);
$(document).on('pagebeforeshow', '#login', chequearLogin);
$(document).on('pagebeforeshow', '#userBets', cargarApuestas);
$(document).on('pagebeforeshow', '#matches', cargarPartidos);
$(document).on('pagebeforeshow', '#perfil', function () {
    $.ajax({
        url: "http://app.uy/ort/api/bets/getByUser.php",
        success: actualizarPuntaje,
        dataType: "json",
        data: {
            user_id: userId
        },
        type: "get",
        error: detectarErrores
    });
    
});
$(document).on("swiperight swipeleft", "body", mostrarPanel);
function mostrarPanel(e) {

    if (e.type === "swipeleft") {
        $("#panel").panel("open");
    }
}
$(".switch").on("change", buscarJugadores);
function iniciar() {
    db = window.openDatabase("PencaCA", "1.0", "Penca Copa America", 4 * 1024 * 1024);
    db.transaction(buscarTabla, errores);
    logIn();
    cargarPartidos();
    $("body>[data-role='panel'").panel().enhanceWithin();
    $("#panel").trigger("updatelayout");
    db.transaction(buscarPartidos);
    chequearIdMatch();
}
function buscarTabla(tx) {

    tx.executeSql("CREATE TABLE IF NOT EXISTS USUARIOS(id VARCHAR PRIMARY KEY, nombre VARCHAR, email VARCHAR, pass VARCHAR)");
    tx.executeSql("CREATE TABLE IF NOT EXISTS APUESTAS(id VARCHAR PRIMARY KEY, match_id varchar, country1 varchar, country2 varchar, result_country1 varchar, result_country2 varchar, best_player varchar, first_goal_player varchar, first_yellow_card_player varchar, first_red_card_player varchar, date varchar, points INTEGER)");
    tx.executeSql("CREATE TABLE IF NOT EXISTS PARTIDOS(id VARCHAR PRIMARY KEY, pais1 varchar, cod1 varchar, pais2 varchar, cod2 varchar, fecha varchar, hora varchar, grupo varchar)");
    tx.executeSql("CREATE TABLE IF NOT EXISTS PLAYERS(cod VARCHAR PRIMARY KEY, nombre VARCHAR, codpais VARCHAR)");
	
    //tx.executeSql("create table if not exists datosUsuario (id integer primary key, nombre varchar, email varchar, pass varchar, _id varchar)");

//	tx.executeSql("Drop table USUARIOS");
//	tx.executeSql("Drop table PARTIDOS");

}



function detectarErrores(dev) {
    alert("detectarErrores " + dev.msg);
}

function errores(e) {
    alert("errores " + e.code);
}

function exitoIngreso() {
    alert("Exito");
}
function registro() {

    var nombre = $("#txtNombre").val();
    var email = $("#txtMail").val();
    var pass = md5($("#txtPass").val());
    $.ajax({
        url: "http://app.uy/ort/api/users/register.php",
        success: guardarDatosUsuario,
        //beforeSend: antesDeEnviar,

        dataType: "json",
        data: {
            name: nombre,
            mail: email,
            password: pass
        },
        type: "get",
        error: detectarErrores
    });
}
function exitoIngreso(dev) {
    alert(dev.msg);
    db.transaction(guardarDatosUsuario, errores);
}
function guardarDatosUsuario(dev, tx) {

    db.transaction(function (tx) {
        var nombre = $("#txtNombre").val();
        var email = $("#txtMail").val();
        var pass = md5($("#txtPass").val());
        var id = dev._id;
        alert(id);
        tx.executeSql("insert into USUARIOS (id, nombre, email, pass)  VALUES (?,?,?,?)", [id, nombre, email, pass]);
    });
}

function cargarPartidos() {

    $.ajax({
        url: "http://app.uy/ort/api/matches/get.php",
        success: ingresarPartidos,
        dataType: "json",
        type: "get",
        error: detectarErrores
    });
    //db.transaction(ingresarPartidos,errores,exitoIngreso);
}

function ingresarPartidos(dev) {
    var cant = dev.records.length;
    db.transaction(function (tx) {
        for (i = 0; i < cant; i++) {
            var id = dev.records[i]._id;
            var pais1 = dev.records[i].country1.name;
            var cod1 = dev.records[i].country1.code;
            var pais2 = dev.records[i].country2.name;
            var cod2 = dev.records[i].country2.code;
            var fecha = dev.records[i].date;
            var hora = dev.records[i].hour;
            var grupo = dev.records[i].group;
            var existe = 0;
            tx.executeSql("INSERT INTO PARTIDOS (id , pais1 , cod1 , pais2 , cod2 , fecha , hora , grupo ) VALUES (?,?,?,?,?,?,?,?)", [id, pais1, cod1, pais2, cod2, fecha, hora, grupo]);
            //alert(id);
        }
    });
}
function buscarPartidos(tx) {
    alert("buscar Partidos");
    tx.executeSql("SELECT * FROM PARTIDOS", [], mostrarPartidos);
}
function mostrarPartidos(tx, dev) {
    alert("mostrar Partidos");
    $("#tblMatches").html("");
    var cant = dev.rows.length;
    alert("partidos " + cant);
    for (i = 0; i < cant; i++) {
        $("#tblMatches").append(
                "<tr>\n\
                    <td>" + dev.rows[i].grupo + "</td>\n\
                    <td><h4 class='ui-li-heading'><span class='country1'>" + dev.rows[i].pais1 + "</span> vs <span class='country2'>" + dev.rows[i].pais2 + "</span></h4></td>\n\
                    <td>" + dev.rows[i].fecha + "</td><td>" + dev.rows[i].hora + "</td>\n\
                    <td><button data-icon='forward' data-iconpos='notext' class='bet' matchId=" + dev.rows[i].id + ">bet</button></td>\n\
                </tr>"
                );
    }
    $("#table-custom-2").trigger('create');
    $(".bet").click(filtrarPartidosPorId);
}

function filtrarPartidosPorId(tx) {
    globalvar = 0;
    var id = $(this).attr("matchId");
    alert("Match " + id);
    db.transaction(function (tx) {
        tx.executeSql("SELECT * FROM PARTIDOS WHERE id = ?",
                [id],
                function (tx, results) {
                    var len = results.rows.length;
                    var id = results.rows.item(0).id;
                    msg = len;
                    globalvar = msg;
                    if (globalvar > 0)
                    {
                        alert("Match found: " + id);
                        
                        $("#idPartido").html(id);
                        $("#cod1").html(results.rows.item(0).pais1);
                        $("#cod2").html(results.rows.item(0).pais2);

                        codCountry1 = results.rows.item(0).cod1;
                        country1 = results.rows.item(0).pais1;
                        codCountry2 = results.rows.item(0).cod2;
                        country2 = results.rows.item(0).pais2;
                        $("#bestC1").val(codCountry1);
                        $("#bestC2").val(codCountry2);
                        $("#bestC1").attr("data-on-text=" + country1 + "");
                        $("#bestC2").text(country2);
                        loadPlayers(codCountry1);
			loadPlayers(codCountry2);
                    }
                    else
                    {
                        alert("MATCH NOT FOUND");
                    }
                }, null);
    }, errores, empezarApuesta);
}
function empezarApuesta() {
    $(":mobile-pagecontainer").pagecontainer("change", "#bets");
    chequearIdMatch();
    chequearLogin();
}
function loadPlayers(cod) {

    $.ajax({
          url: "http://app.uy/ort/api/players/getByCountry.php?code=" + cod,
          success: guardarJugadores,
          dataType: "json",
          type: "get",
          error: detectarErrores
     });
}
function guardarJugadores(dev){
	var cant = dev.players.length;
	 db.transaction(function (tx) {
	 	for (i = 0; i < cant; i++) {
			var cod =  dev.players[i].code;
			var nombre = dev.players[i].name;
			var codpais = cod.substring(0, 2);
		 	tx.executeSql("Insert into players (cod , nombre , codpais ) values (?,?,?)",[cod, nombre, codpais]);
		 }
	 });
	 db.transaction(filtrarJugadoresCod);
}
function filtrarJugadoresCod() {

    $("#bestPlayer").html("");
    $("#firstGoal").empty();
    $("#firstYellow").empty();
    $("#firstRed").empty();
   
	db.transaction(function (tx) {
        tx.executeSql("SELECT * FROM PLAYERS WHERE codpais = ? or codpais = ?",
                [codCountry1,codCountry2],
                function (tx, results) {
                    var len = results.rows.length;
                    for (i = 0; i < len; i++) {
                        $("#bestPlayer").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                        $("#firstGoal").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                        $("#firstYellow").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                        $("#firstRed").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                    }
                }, errores);
    },errores);
    $("#bestPlayer").trigger('create');
    $("#firstGoal").trigger('create');
    $("#firstYellow").trigger('create');
    $("#firstRed").trigger('create');
}
function chequearIdMatch() {
    var id = $("#idPartido").html();
    if (id === "Match ID") {
        $("#apostar").addClass('ui-disabled');
    } else {
        $("#apostar").removeClass('ui-disabled');
    }

}
function apostar() {
    var user_id = $("#userId").html();
    var idMatch = $("#idPartido").html();
    var golesCod1 = $("#golesCod1").val();
    var golesCod2 = $("#golesCod2").val();
    var bestPlayer = $("#bestPlayer").val();
    var firstGoal = $("#firstGoal").val();
    var firstYellow = $("#firstYellow").val();
    var firstRed = $("#firstRed").val();
    $.ajax({
        url: "http://app.uy/ort/api/bets/new.php",
        success: buscarApuestas,
        dataType: "json",
        data: {user_id: user_id,
            match_id: idMatch,
            result_country1: golesCod1,
            result_country2: golesCod2,
            best_player_code: bestPlayer,
            first_goal_player_code: firstGoal,
            first_yellow_card_player_code: firstYellow,
            first_red_card_player_code: firstRed
        },
        type: "get",
        error: detectarErrores

    });
}

function logIn() {
    globalvar = 0;
    db.transaction(function (tx) {
        tx.executeSql("SELECT * FROM USUARIOS",
                [],
                function (tx, results) {
                    var len = results.rows.length;
                    userId = results.rows.item(0).id;
                    nombre = results.rows.item(0).nombre;
                    mail = results.rows.item(0).email;
                    pass = results.rows.item(0).pass;
                    msg = len;
                    globalvar = msg;
                    if (globalvar > 0)
                    {
                        alert("User found: " + userId);
                        logueado = true;
                        $.ajax({
                            url: "http://app.uy/ort/api/users/login.php",
                            success: cargarDatosUsuario,
                            dataType: "json",
                            data: {
                                mail: mail,
                                password: pass
                            },
                            type: "get",
                            error: detectarErrores
                        });
                    }
                    else
                    {
                        logueado = false;
                        alert("USER NOT FOUND");
                        $(":mobile-pagecontainer").pagecontainer("change", "#logIn");
                    }
                });
    });
}
function cargarDatosUsuario(dev) {
    $(":mobile-pagecontainer").pagecontainer("change", "#Inicio");
    $("#username").html(nombre);
    $("#userId").html(userId);
}
function logOff(tx) {
    tx.executeSql("Delete * From Usuarios", [], exitoLogOff);
}
function exitoLogOff() {
    logueado = false;
}
function chequearLogin() {
    alert("cuequeando login");
    alert(logueado);
    if (logueado === true) {
        $("#txtNombre").val(nombre);
        $("#txtMail").val(mail);
        $("#txtPass").val(pass);
        $("#btnLogIn").addClass('ui-disabled');
    }
    else {
        $("#btnLogIn").removeClass('ui-disabled');
    }
}

function buscarApuestas() {
    alert("apuesta realizada");
    var user_id = userId;
    $.ajax({
        url: "http://app.uy/ort/api/bets/getByUser.php",
        success: guardarApuestas,
        dataType: "json",
        data: {
            user_id: user_id
        },
        type: "get",
        error: detectarErrores
    });
}
function guardarApuestas(dev) {
    var len = dev.bets.length;
    var last = len - 1;
    var id = dev.bets[last]._id;
    var match_id = dev.bets[last].match_id;
    var result_country1 = $("#golesCod1").val();
    var result_country2 = $("#golesCod2").val();
    var bestPlayer = $("#bestPlayer option:selected").html();
    var firstGoal = $("#firstGoal option:selected").html();
    var firstYellow = $("#firstYellow option:selected").html();
    var firstRed = $("#firstRed option:selected").html();
    var date = dev.bets[last].date;
    var points = parseInt(dev.bets[last].points);
    alert(date + points);
    db.transaction(function (tx) {
        tx.executeSql("INSERT INTO APUESTAS (id , match_id , country1 , country2 , result_country1 , result_country2 , best_player , first_goal_player , first_yellow_card_player , first_red_card_player , date , points ) values (?,?,?,?,?,?,?,?,?,?,?,?)", [id, match_id, country1, country2, result_country1, result_country2, bestPlayer, firstGoal, firstYellow, firstRed, date, points], cargarApuestas, errores);
    });
}
function cargarApuestas() {
    alert("cargando apuestas");
    db.transaction(buscarApuestasLocal);
}
function buscarApuestasLocal(tx) {
    tx.executeSql("SELECT * FROM APUESTAS", [], mostrarApuestas);
}

function mostrarApuestas(tx, res) {
    $("#betsbyuser").empty();
    var len = res.rows.length;
    for (i = 0; i < len; i++) {
        var betId = res.rows.item(i).id;
        var partido = res.rows.item(i).country1 + " vs " + res.rows.item(i).country2;
        var res1 = res.rows.item(i).country1 + " - " + res.rows.item(i).result_country1;
        var res2 = res.rows.item(i).country2 + " - " + res.rows.item(i).result_country2;
        var best = res.rows.item(i).best_player;
        var goal = res.rows.item(i).first_goal_player;
        var yellow = res.rows.item(i).first_yellow_card_player;
        var red = res.rows.item(i).first_red_card_player;
        var date = res.rows.item(i).date;
        var points = res.rows.item(i).points;
        $("#betsbyuser").append(
                "<div data-role='collapsible'>\n\
                    <h3>" + partido + "</h3>\n\
                    <p>" + res1 + "</p>\n\
                    <p>" + res2 + "</p>\n\
                    <p>Mejor jugador: " + best + "</p>\n\
                    <p>Primer gol: " + goal + "</p>\n\
                    <p>Primera Amarilla: " + yellow + " </p>\n\
                     <p>Primera Roja: " + red + "</p>\n\
                    <p>Fecha:  " + date + "</p>\n\
                    <p>Puntos: " + points + "</p>\n\
                    <div data-role='controlgroup' data-type='horizontal'>\n\
                      <button data-icon='info' data-iconpos='left' class='validar' match=" + betId + ">Validar</button>\n\
                      <button data-icon='gear' data-iconpos='right' id='editarApuesta'  match=" + betId + " betid="+ betId +">Editar</button>\n\
                    </div>\n\
              </div>"
                );
    }
    $("#betsbyuser").trigger('create');
    $("#editarApuesta").click(cargarEdicionApuesta);
}
function validarApuesta() {
    var id = $(this).attr("match");
    $.ajax({
        url: "http://app.uy/ort/api/matches/validate_automatic.php",
        success: actualizarPuntos,
        dataType: "json",
        data: {
            bet_id: id
        },
        type: "get",
        error: detectarErrores
    });
}
function actualizarPuntos() {

    $.ajax({
        url: "http://app.uy/ort/api/bets/getByUser.php",
        success: actualizarPuntaje,
        dataType: "json",
        data: {
            user_id: userId
        },
        type: "get",
        error: detectarErrores
    });
}
function actualizarPuntaje(dev) {
    var len = dev.bets.length;
    alert("len " + len);
    for (i = 0; i < len; i++) {
        var points = dev.bets[i].points;
        var betId = dev.bets[i]._id;
        alert(points + " " + betId);
        db.transaction(function (tx) {
            tx.executeSql("UPDATE APUESTAS SET points = ? WHERE id = ?", [points, betId]);
        });
    }
   redirect("userBets");
}
function redirect(page){
    $(":mobile-pagecontainer").pagecontainer("change", page);
}
function perfil(dev) {
    puntosObtenidos = 0;
    var len = dev.bets.length;
    cantApuestas = len;
    for (i = 0; i < len; i++) {
        puntosObtenidos += dev.bets[i].points;
    }
    $("#cantApuestas").html(len + " apuestas");
    $("#puntos").html(puntosObtenidos + " puntos");
}
function buscarJugadores() {
    var cod = $(this).val();
    $.ajax({
        url: "http://app.uy/ort/api/players/getByCountry.php",
        success: actualizarJugadores,
        dataType: "json",
        data: code = cod,
        type: "get",
        error: detectarErrores
    });

}
function actualizarJugadores(dev) {
    var tipo = $(this).attr("tipo");

    var cant = dev.players.length;
    if (tipo === "best") {
        for (i = 0; i < cant; i++) {
            $("#bestPlayer").append("<option value=" + dev.players[i].code + ">" + dev.players[i].name + "</option>");
        }
        $("#bestPlayer").trigger('create');
    } else if (tipo === "goal") {
        for (i = 0; i < cant; i++) {

            $("#firstGoal").append("<option value=" + dev.players[i].code + ">" + dev.players[i].name + "</option>");
        }
        $("#firstGoal").trigger('create');
    } else if (tipo === "yellow") {
        for (i = 0; i < cant; i++) {

            $("#firstYellow").append("<option value=" + dev.players[i].code + ">" + dev.players[i].name + "</option>");
        }
        $("#firstYellow").trigger('create');
    } else if (tipo === "red") {
        for (i = 0; i < cant; i++) {

            $("#firstRed").append("<option value=" + dev.players[i].code + ">" + dev.players[i].name + "</option>");
        }

        $("#firstRed").trigger('create');
    }
}
function  cargarEdicionApuesta(){
   var id = $(this).attr("match");
   redirect(user)
   var cod1 = $(this).attr("cod1");
   var cod2 = $(this).attr("cod2");
   db.transaction(function (tx) {
        tx.executeSql("SELECT * FROM PLAYERS WHERE codpais = ? or codpais = ?",
                [cod1,cod2],
                function (tx, results) {
                    var len = results.rows.length;
                    for (i = 0; i < len; i++) {
                        var playerName = db.transaction(buscarJugadorPorCod(results.rows.item(i).cod));
                        alert(playerName);
                        $("#editbestPlayer").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                        $("#editfirstGoal").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                        $("#editfirstYellow").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                        $("#editfirstRed").append("<option value=" + results.rows.item(i).cod + ">" + results.rows.item(i).nombre + "</option>");
                    }
                }, errores);
    },buscarApuestaId(id));
}
function editBet(){
    var id = $(this).attr("betId");
    var golesCod1 = $("#editgolesCod1").val();
    var golesCod2 = $("#editgolesCod2").val();
    var bestPlayer = $("#editbestPlayer").val();
    var firstGoal = $("#editfirstGoal").val();
    var firstYellow = $("#editfirstYellow").val();
    var firstRed = $("#editfirstRed").val();
     $.ajax({
        url: "http://app.uy/ort/api/bets/edit.php",
        success: actualizarPuntos,
        dataType: "json",
        data: {
            bet_id: id,
            result_country1: golesCod1,
            result_country2: golesCod2,
            best_player_code: bestPlayer,
            first_goal_player_code: firstGoal,
            first_yellow_card_player_code: firstYellow,
            first_red_card_player_code: firstRed
        },
        type: "get",
        error: detectarErrores
    });  
    
}
function buscarApuestaId(id){
    db.transaction(function (tx) {
        tx.executeSql("SELECT * FROM APUESTAS WHERE id = ?",
                [id],
                function (tx, results) {
                   // var len = results.rows.length;
                        $("#editbestPlayer").find("option[value="+results.rows.item(0).cod+"]").attr("selected",true);
                        $("#editfirstGoal").find("option[value="+results.rows.item(0).cod+"]").attr("selected",true);;
                        $("#editfirstYellow").find("option[value="+results.rows.item(0).cod+"]").attr("selected",true);;
                        $("#editfirstRed").find("option[value="+results.rows.item(0).cod+"]").attr("selected",true);
                    
                }, errores);
    },errores);
    
}
function buscarJugadorPorCod(cod,tx){
    tx.executeSql("SELECT nombre FROM PLAYERS WHERR cod = ?",[cod]);
    
}