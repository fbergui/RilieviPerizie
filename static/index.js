"use strict";

const urlGoogle = "https://maps.googleapis.com/maps/api";
let allPerizie = [];
let sPhoto = "";
let newPerizie = [];
let perizieEdit = ["username","data","coords","description"];
let strReq =" ";
let sede;

$(document).ready(function () {


    let scriptGoogle = document.createElement('script');
    scriptGoogle.type = 'text/javascript';
    scriptGoogle.src = urlGoogle + '/js?libraries=geometry&v=3&key=' + MAP_KEY;
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
    caricaPerizie(false);

    
    /******************TEST**********************/

    $("#main").hide();
    $("#login").show();
    $("#main>div:eq(0)").show();
    $("#main>div:eq(1)").hide();


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


    $("#divRicercaPerizia>button").on("click",function () {
        if($("#divRicercaPerizia>input").val()!='')
        caricaPerizie(true,{username:$("#divRicercaPerizia>input").val()});
        else
        caricaPerizie(false)
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
    $("#btnCloseModalPer").on("click", function () {
        $("#formPerizia").modal('hide');
    });

    function caricaMappa() {
        let _mappa = $("#mdlMap")[0]

        $('#formMappa').modal('show');
        
        sede = new google.maps.LatLng(44.55595580490406, 7.736023895321979);
        let mapOptions = {'center': sede,'zoom': 17,'width':700};
        let map = new google.maps.Map(_mappa, mapOptions);
        map.setCenter(sede);
        new google.maps.Marker({
            map: map,
            position: sede
        });

        let lastWindow=null;

        for (let perizia of allPerizie) {

            sPhoto="";
            let position = new google.maps.LatLng(perizia.coords.lat, perizia.coords.lng);

            let marker = new google.maps.Marker({
                map: map,
                position: position
            });

            

            for (let photo of perizia.photos) {
              sPhoto += `<br> <img src="${photo.url}"> <p class = "infoWindow"> Descrizione : ${photo.comment}</p>`
            }

            let infoWindowOption = {
                content: `          
                <hr>
                <div >
                <p  class = "infoWindow"><b>Data perizia:</b> ${perizia.data.split("T")[0]}</p>
                <p  class = "infoWindow"><b>Perito utente:</b> ${perizia.idOperatore}</p>
                <p  class = "infoWindow"><b>Descrizione:</b> ${perizia.description}</p>
                <p  class = "infoWindow"><b>Foto perizia:</b><br>`+sPhoto+`
                </div>
                <hr>
                <style>
                .infoWindow {
                    margin-top:20px;
                    font-family: 'Roboto', sans-serif;
                    color : #000;
                }
                </style>
                `,
                width: 700,
              };
        
              let infoWindow = new google.maps.InfoWindow(infoWindowOption);
              marker.addListener("click", function () {
                if (lastWindow) lastWindow.close();
                infoWindow.open(map, this);
                lastWindow=infoWindow;

                sPhoto="";
               });

                return map;
        }
    }

    $("#btnMappa").on("click",function () {
        caricaMappa();
    })

    $("#btnConfermaPerizia").on("click",function () {
      let _id =  $("#mdlModificaPerizia>table>tbody>tr:eq(0)>td:eq(1)>label").text()

      let upd = {photos:[]}
      let i =0;

      $('input', $('#mdlModificaPerizia')).each(function () {
        if(i==4 || i==6)
        {
            upd.photos.push({"comment":$(this).val(),"url": perizieEdit[i+1]})
            i++;
        }
        else
        upd[perizieEdit[i]] = $(this).val();
        i++;

        });
      let req = inviaRichiesta("POST","/api/updatePerizie",{_id:_id, upd:upd})
      req.fail(errore);
      req.done(function (data) {
        console.log(data)
        alert("Modifica completata")
        $('#formPerizia').modal('hide');
        caricaPerizie(false);
      })
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

    function caricaPerizie(ricerca,params) {
        _tablePerizie.empty();

        if(ricerca == false)
        {
            strReq = "/api/perizie";
            params={};
        }
        else
        {
            strReq = "/api/ricercaPerizie";
        }
        let reqq = inviaRichiesta("POST", strReq ,params);
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
                        $("<button>").addClass("btn btn-primary").text("Modifica")
                        .on("click",function () {
                            $('#formPerizia').modal('show');

                        $("#mdlModificaPerizia>table>tbody>tr:eq(0)>td:eq(1)>label").text(perizia._id);
                        $("#mdlModificaPerizia>table>tbody>tr:eq(1)>td:eq(1)>input").val(perizia.idOperatore)
                        $("#mdlModificaPerizia>table>tbody>tr:eq(2)>td:eq(1)>input").val(perizia.data.split("T")[0])
                        $("#mdlModificaPerizia>table>tbody>tr:eq(3)>td:eq(1)>input").val(perizia.coords.lat +" "+ perizia.coords.lng)
                        $("#mdlModificaPerizia>table>tbody>tr:eq(4)>td:eq(1)>input").val(perizia.description)
                        let i=0;
                        for (let photo of perizia.photos) {
                            i++;
                            if($("#mdlModificaPerizia>table>tbody tr").length > perizia.photos.length+4)
                            {
                                for(let i=0;i<perizia.photos.length;i++)
                                {
                                    $("#mdlModificaPerizia>table>tbody>tr:last-child").remove();
                                }
                                perizieEdit=["username","data","coords","description"];
                            }
                            perizieEdit.push(photo.comment)
                            perizieEdit.push(photo.url)
                            let _tr = $("<tr>").appendTo($("#mdlModificaPerizia>table>tbody"))
                            let _td1 = $("<td>").appendTo(_tr)
                            let _td2=  $("<td>").appendTo(_tr)
                            $("<label>").text("Immagine N°"+i+":").appendTo(_td1)
                            $("<input>").prop({type:"text",class:"form-control"}).val(photo.comment).appendTo(_td2)
                        }
                            
                        }).appendTo(_td)
                        _td = $("<td>").appendTo(_tr)
                        $("<button>").addClass("btn btn-primary").text("Vedi Percorso")
                        .on("click",function () {
                            let map = caricaMappa();

                            let destinazione = new google.maps.LatLng(parseFloat(perizia.coords.lat), parseFloat(perizia.coords.lng));

                            let directionsService = new google.maps.DirectionsService();
                            let routesOptions = {
                            origin: sede,
                            destination: destinazione,
                            travelMode: google.maps.TravelMode.DRIVING, // default
                            provideRouteAlternatives:true, // default=false
                            avoidTolls:false}

                            let renderOptions = {
                                polylineOptions: {
                                strokeColor : "#3498db", // colore del percorso
                                strokeWeight : 6, // spessore
                                zIndex : 100 // posizionamento
                                }
                            }

                            directionsService.route(routesOptions, function(directionsRoutes){
                                if (directionsRoutes.status == google.maps.DirectionsStatus.OK)
                                {
                                    let directionsRenderer = new google.maps.DirectionsRenderer(renderOptions)
                                    directionsRenderer.setMap(map) // Collego il renderer alla mappa
                                    directionsRenderer.setRouteIndex(0)
                                    directionsRenderer.setDirections(directionsRoutes)
                                }
                                let tempo = google.maps.geometry.spherical.computeDistanceBetween (sede, destinazione);
                                alert("Tempo stimato: "+Math.floor(tempo/60) +" minuti")
                                });
                                
                                
 
                                
                            
                        }).appendTo(_td)
                    }
                })
        
    }


    
});