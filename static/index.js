"use strict";

const urlGoogle = "https://maps.googleapis.com/maps/api";
let allPerizie = [];

$(document).ready(function () {


    let scriptGoogle = document.createElement('script');
    scriptGoogle.type = 'text/javascript';
    scriptGoogle.src = urlGoogle + '/js?v=3&key=' + MAP_KEY;
    document.body.appendChild(scriptGoogle);
    
    let _alertPw = $("#login>div:eq(3)");
    let _btnLogin = $("#login>div:eq(4)>button");
    let _txtPwLogin = $("#login>div:eq(1)>input");
    let _txtUserLogin = $("#login>div:eq(0)>input");
    let _chkShowPw = $("#login>div:eq(2)>input");
    _alertPw.hide();
    
    _txtPwLogin.val("admin");
    _txtUserLogin.val("admin");
    let _tableUtenti = $("#mainTable>tbody");
    let _tablePerizie = $("#perizieTable>tbody")

    
    caricaUtenti();
    caricaPerizie();

    //$("#main>div:eq(0)").show();
    //$("#main>div:eq(1)").hide();
    
    /******************TEST**********************/

    $("#main").show();
    $("#login").hide();
    $("#main>div:eq(0)").hide();
    $("#main>div:eq(1)").show();


    /***************************************************/
    /*********************Generatore********************/

   /* const names = ["John", "Jane", "Bob", "Emily", "Jessica", "Michael", "Sarah", "David", "Emily", "Jacob", "Nicholas", "Isabella", "Ethan", "Aria", "Madison", "Matthew", "Olivia", "Joshua", "Hannah"];
    const surnames = ["Smith", "Doe", "Williams", "Johnson", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson"];
    const usernames = ["johndoe23", "katiejones", "chrisb87", "bobbym44", "ashleyt96", "mattd43", "sarahm22", "jenniferg", "davids57", "mikew88", "juliak21", "tylerr11", "emmam33", "bradpitt", "jenniferl", "chrisw77", "jimmyj96", "samanthab", "roberts44", "jennifert"];

    const utenti = [];

    for (let i = 0; i < 50; i++) {
        let name = names[i%20];
        let surname = surnames[i%20];
        utenti.push({
            "username": usernames[i] || "user"+i,
            "password": usernames[i] || "user"+i,
            "name": name,
            "surname": surname,
            "email": name+"."+surname+"@perizie.it",
            "role": "user"
        });
    }*/
    

    /***************************************************/

    //Change on Utenti and Perizie tabs
    $(".nav-tabs>li:eq(0)>a").on("click",function () {
        $("#main>div:eq(0)").show();
        $("#main>div:eq(1)").hide();
    })
    $(".nav-tabs>li:eq(1)>a").on("click",function () {
        $("#main>div:eq(0)").hide();
        $("#main>div:eq(1)").show();
    })



    _chkShowPw.on("click", function () {
        _txtPwLogin.attr("type", _chkShowPw.prop("checked") ? "text" : "password");
    });

    _btnLogin.on("click", function () {

        let username = _txtUserLogin.val();
        let password = _txtPwLogin.val();
        let req = inviaRichiesta("POST", "/api/login", { "username": username, "password": password });
        req.fail(errore);
        req.done(function (data) {

            if(data.ris=="ok")
            {
                $("#login").hide();
                $("#main").show();

                caricaUtenti();
            }
            else
            _alertPw.show();
        });

    });

    $("#cmbRicercaUtenti").on("change",function () {
        
    });

    $("#btnConferma").on("click",function () {

        let utente = 
        {
            username: $("#mdlAggiungi>table>tbody>tr:eq(0)>td:eq(1)>input").val(),
            password: "password",
            name :$("#mdlAggiungi>table>tbody>tr:eq(1)>td:eq(1)>input").val(),
            surname: $("#mdlAggiungi>table>tbody>tr:eq(2)>td:eq(1)>input").val(),
            email: $("#mdlAggiungi>table>tbody>tr:eq(3)>td:eq(1)>input").val(),
            role: $("#mdlAggiungi>table>tbody>tr:eq(4)>td:eq(1)>input").val(),
        }

        console.log(utente);

        let req = inviaRichiesta("POST","/api/aggiungiUtente",utente)
        req.fail(errore);
        req.done(function (data) {
            alert("Utente aggiunto correttamente");
        })
    })

    $("#btnAggiungi").on("click",function () {
        $('#formUtente').modal('show');
    });

    $("#btnCloseModal").on("click", function () {
        $('#formUtente').modal('hide');
    });
    $("#btnCloseModalMappa").on("click", function () {
        $("#formMappa").modal('hide');
    });

    $("#btnMappa").on("click",function () {
        let _mappa = $("#mdlMap")[0]

        $('#formMappa').modal('show');
        
        let sede = new google.maps.LatLng(44.55595580490406, 7.736023895321979);
        let mapOptions = {'center': sede,'zoom': 17};
        let map = new google.maps.Map(_mappa, mapOptions);
        map.setCenter(sede);
        new google.maps.Marker({
            map: map,
            position: sede
        });

        for (let perizia of allPerizie) {

            console.log(allPerizie)
            let position = new google.maps.LatLng(perizia.coords.lat, perizia.coords.lng);

            let marker = new google.maps.Marker({
                map: map,
                position: position
            });

            let infoWindowOption = {
                content: `          
                <hr>
                <div >
                <p  class = "infoWindow"><b>Data Perizia:</b> ${perizia.data.split("T")[0]}</p>
                <p  class = "infoWindow"><b>Perito:</b> ${perizia.idOperatore}</p>
                <p  class = "infoWindow"><b>Descrizione:</b> ${perizia.description}</p>
                <p  class = "infoWindow"><b>Descrizione:</b> ${perizia.description}</p>
                </div>
                <hr>
                <button class='percorso'>Visualizza percorso</button>
                <style>
                .infoWindow {
                    font-family: 'Roboto', sans-serif;
                    color : #000;
                }
                </style>
                `,
                width: 150,
              };
        
              let infoWindow = new google.maps.InfoWindow(infoWindowOption);
              marker.addListener("click", function () {
                infoWindow.open(map, marker);
               });
            
        }

        

        
        
        
    })


    function caricaUtenti() {

        let reqq = inviaRichiesta("POST", "/api/utenti", {});
                reqq.fail(errore);
                reqq.done(function (data) {
                   
                    for (let utente of data) {
                        let _tr = $("<tr>").appendTo(_tableUtenti);
                        $("<td>").text(utente._id).appendTo(_tr)
                        $("<td>").text(utente.username).appendTo(_tr)
                        $("<td>").text(utente.name).appendTo(_tr)
                        $("<td>").text(utente.surname).appendTo(_tr)
                        $("<td>").text(utente.email).appendTo(_tr)
                        $("<td>").text(utente.role).appendTo(_tr)
                        let _td = $("<td>").appendTo(_tr)
                        $("<button>").addClass("btn btn-primary").text("Modifica").appendTo(_td)
                    }
                })
    }

    function caricaPerizie() {
        let reqq = inviaRichiesta("POST", "/api/perizie", {});
                reqq.fail(errore);
                reqq.done(function (data) {
                    allPerizie = data;
                    for (let perizia of data) {
                        let _tr = $("<tr>").appendTo(_tablePerizie);
                        $("<td>").text(perizia._id).appendTo(_tr)
                        $("<td>").text(perizia.idOperatore).appendTo(_tr)
                        $("<td>").text(perizia.data.split("T")[0]).appendTo(_tr)
                        $("<td>").text(perizia.coords.lat +" "+ perizia.coords.lng).appendTo(_tr)
                        $("<td>").text(perizia.description).appendTo(_tr)
                        let _td = $("<td>").appendTo(_tr)
                        $("<button>").addClass("btn btn-primary").text("Visualizza foto").appendTo(_td)
                        _td = $("<td>").appendTo(_tr)
                        $("<button>").addClass("btn btn-primary").text("Modifica").appendTo(_td)
                        _td = $("<td>").appendTo(_tr)
                        $("<button>").addClass("btn btn-primary").text("Mostra percorso").appendTo(_td)
                    }
                })
    }

    
});