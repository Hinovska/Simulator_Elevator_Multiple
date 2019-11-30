/*Modelo principal del sistema de acsensores*/
function ElevatorSystemModel(numElevators, numFloors) {
    var self = this;
    //Numero de Ascensores
    self.NumElevators = ko.observable(numElevators);
    //Munero de Pisos
    self.NumFloors = ko.observable(numFloors);
    //Costo de Enegia al Detener el Ascensor
    self.CostStop = ko.observable(1);
    //Costo de Enegia al Arrancar el Ascensor
    self.CostStart = ko.observable(1);
    //Costo de Enegia de desplazamiento pos piso del ascensor
    self.CostByFloor = ko.observable(0.5);
    //Listado de Botones de Solicitud en cada piso
    self.ListRequest = ko.observableArray();
    //Listado de elevadores del sistema
    self.ListElevator = ko.observableArray();
    //Listdo de letras del abcedario utilizado para nombrar los ascensores
    self.ListAlphabet = ko.observableArray();
    //Metodo de inicializacion de parametrizacion
    self.Init = function fnInit() {
        self.ListAlphabet(self.GetAlphabet("A", "Z"));
        if (self.NumElevators() && self.NumFloors() && self.NumElevators() > 0 && self.NumFloors() > 0) {
            var ListElevators = new Array();
            for (var i = 1; i <= self.NumElevators(); i++) {
                ListElevators.push(new Elevator(i, self.ListAlphabet()[(i - 1 + self.ListAlphabet().length) % self.ListAlphabet().length], self.NumFloors(), true, 1));
            }
            var LstRequest = new Array();
            for (var i = 1; i <= self.NumFloors(); i++) {
                LstRequest.push(new Request(i, i, false, self.NumFloors()));
            }
            self.ListElevator(ListElevators);
            self.ListRequest(LstRequest.reverse());
            self.EnableSystem(true);
        }
    };
    //Metodo de envio de Ascensor para atender solicitud de usuario en deterinado piso
    self.SendRequest = function fnSendRequest(Elevator, Floor, FloorEnd) {
        //console.log("Sending Elevator " + Elevator.Name + " to "+ Floor + " trans to "+ FloorEnd);
        self.ListRequest().filter((x) => { return x.Id == Floor; }).map((y) => { y.CarAsigned(Elevator.Name + " al piso " + FloorEnd); });
        self.MoveCar(Elevator.Id, Floor, function () {
            self.MoveCar(Elevator.Id, FloorEnd);
            self.ListRequest().filter((x) => { return x.Id == Floor; }).map((y) => { y.CarAsigned(""); });
        });
    };
    //Metodo para calcular la energia necesaria para mover acsensor desde un piso a otro
    self.CalulateCostMove = function fnCalulateCostMove(StartFloor, EndFloor) {
        if (typeof (StartFloor) != "undefined" && !isNaN(StartFloor) && Number(StartFloor) <= self.NumFloors() && Number(StartFloor) > 0
            && typeof (EndFloor) != "undefined" && !isNaN(EndFloor) && Number(EndFloor) <= self.NumFloors() && Number(EndFloor) > 0) {
            var iCostTrans = 0;
            var iRequest = Number(StartFloor);
            var iDestine = Number(EndFloor);
            var Direction = (Number(iDestine) > Number(iRequest)) ? "Up" : (Number(iDestine) < Number(iRequest)) ? "Down" : "Static";
            switch (Direction) {
                case "Up":
                    iCostTrans = self.CostStop() + self.CostStart() + ((iDestine - iRequest) * self.CostByFloor());
                    break;
                case "Down":
                    iCostTrans = self.CostStop() + self.CostStart() + ((iRequest - iDestine) * self.CostByFloor());
                    break;
                default:
                    iCostTrans = 0;
                    break;
            }
        }
        return iCostTrans;
    };
    //Metodo para la apertura de las opciones de pisos de destino al usuario en cada uno de los pisos
    self.OpenOptions = function fnOpenOptions(Request) {
        if (Request.Enabled()) {
            self.ListRequest().filter((opt) => { return opt.Enabled(); }).map((tet) => { tet.Enabled(false); });
            Request.Enabled(false);
        }
        else {
            self.ListRequest().filter((opt) => { return opt.Enabled(); }).map((tet) => { tet.Enabled(false); });
            Request.Enabled(true);
        }
    };
    //Metodo que evalua la mejor opcion de ascensor para atender la solicitud de un usuario especifico
    //Busca el ascensor mas cercano para el usuario
    self.SaveRequest = function fnSendRequest(Request, Destination) {
        var CostTrans = self.CalulateCostMove(Request, Destination);
        //console.log("Cost Transport User:" + CostTrans);
        var ElevatorData = new Array();
        self.ListElevator().filter((elev) => { return elev.moving() == false && elev.Emergency() != true; }).map((car) => {
            var CurrentFloor = car.CurrentFloor().Id;
            var iCostReceive = self.CalulateCostMove(CurrentFloor, Request);
            ElevatorData.push({ data: car.Id, cost: iCostReceive });
        });
        if (ElevatorData.length > 0) {
            //console.log(ElevatorData);
            ElevatorData = ElevatorData.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
            //console.log(ElevatorData);
            if (typeof (ElevatorData) != "undefined") {
                self.SendRequest(self.ListElevator().filter((best) => { return best.Id == ElevatorData.data; })[0], Request, Destination);
            }
        }
    };
    //Metodo para mover el ascensor graficamente desde un piso a otro
    self.MoveCar = function fnMoveCar(car, floor, fnCallBack) {
        const deferred = $.Deferred();
        self.ListElevator().filter(function (carItem) { return carItem.Id == car && carItem.Emergency() != true; }).map((CarItem) => {
            if (CarItem && CarItem.moving()) {
                return deferred.reject();
            }
            if ((floor < 1) || (floor > self.NumFloors())) {
                return deferred.reject();
            }
            CarItem.moving(true);
            CarItem.StartTime(Date.now());
            CarItem.TimeService(undefined);
            //console.log("Start Move Elevator " + CarItem.Name);
            $(`#elevator${CarItem.Id} .car`).animate({ bottom: `${(floor - 1) * 23}px` }, {
                duration: 500 * Math.abs(CarItem.CurrentFloor().Id - floor),
                easing: 'swing',
                complete() {
                    CarItem.CurrentFloor(CarItem.LstFloors().filter(function (item) { return item.Id == floor; })[0]);
                    CarItem.moving(false);
                    //console.log("Stop Move Elevator " + CarItem.Name);
                    if (typeof (fnCallBack) === "function") {
                        setTimeout(fnCallBack, 1000);
                        CarItem.Bussy(true);
                    }
                    else {
                        CarItem.Bussy(false);
                        if (CarItem.StartTime()){
                            CarItem.TimeService((Date.now() - CarItem.StartTime())/1000);
                            CarItem.StartTime(undefined);
                        }
                    }
                    return deferred.resolve();
                }
            }).delay(75);
            $(`#elevator${CarItem.Id} .car > div`).animate({ top: `${(-368 + (floor * 23))}px` }, {
                duration: 500 * Math.abs(CarItem.CurrentFloor().Id - floor),
                easing: 'swing'
            }).delay(75);
        });
        return deferred;
    };
    //Metodo que construye el array para nombrar los ascesores con letras especificas
    self.GetAlphabet = function genCharArray(charA, charZ) {
        var a = [], i = charA.charCodeAt(0), j = charZ.charCodeAt(0);
        for (; i <= j; ++i) {
            a.push(String.fromCharCode(i));
        }
        return a;
    };
    //Metodo para obtener numero aleatorio
    self.GetRandomNumber = function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    self.EnableSystem = ko.observable(false);
}

//Clase base para la creacion de objetos tipo Elevador
function Elevator(id, name, FloorNumber, bussy, currentFloor) {
    var SelfItem = this;
    SelfItem.Id = id;
    SelfItem.Name = name;
    SelfItem.FloorsCount = ko.observable(FloorNumber);
    //SelfItem.Bussy = ko.observable(bussy)
    SelfItem.Bussy = ko.observable().extend({ TimerService: bussy });
    SelfItem.moving = ko.observable(false);
    SelfItem.CurrentFloor = ko.observable();
    SelfItem.Emergency = ko.observable(false);
    SelfItem.countDown = ko.observable(0);
    SelfItem.StartTime = ko.observable();
    SelfItem.TimeService = ko.observable();
    SelfItem.Timer = 0;
    var ListFlors = new Array();
    for (var i = 1; i <= SelfItem.FloorsCount(); i++) {
        ListFlors.push(new Floor(i, i, false));
    }
    SelfItem.LstFloors = ko.observableArray(ListFlors.reverse());
    SelfItem.CurrentFloor(SelfItem.LstFloors()[SelfItem.LstFloors().length - 1]);
    SelfItem.LabelName = ko.pureComputed(function () {
        var ListAdverts = SelfItem.Id;
        return ListAdverts;
    }, SelfItem);
    //SelfItem.LabelcountDown = ko.pureComputed(function () {
    //    var timeSpam = (SelfItem.countDown() > 0) ? SelfItem.countDown() + " ms" : "--";
    //    return timeSpam;
    //}, SelfItem);
    SelfItem.SetEmergency = function fnSetEmergency(Elevator) {
        if (typeof (Elevator) != "undefined") {
            Elevator.Emergency((Elevator.Emergency()) ? false : true);
        }
    };
    //SelfItem.StartTimer = function fnStartTimer() {
    //    SelfItem.countDown(0);
    //    SelfItem.RunTimer();
    //};
    //SelfItem.StopTimer = function fnStopTimer() {
    //    SelfItem.countDown(0);
    //    clearInterval(SelfItem.Timer);
    //};
    //SelfItem.RunTimer = function fnRunTimer() {
    //    SelfItem.Timer = setInterval(function () {
    //        SelfItem.countDown(SelfItem.countDown() + 1);
    //        if (SelfItem.Bussy() != true) {
    //            SelfItem.StopTimer();
    //        }
    //        else {
    //            SelfItem.RunTimer();
    //        }
    //    }, 100);
    //}
}

//Clase base para la creacion de objetos tipo Piso
function Floor(id, name, checked) {
    var selfFloor = this;
    selfFloor.Id = id;
    selfFloor.Name = name;
    selfFloor.Bussy = ko.observable(checked);
}

//Clase base para la creacion de objetos tipo solicitud de servicio de ascensor
function Request(id, name, enabled, numFloors) {
    var selfRequest = this;
    selfRequest.Id = id;
    selfRequest.Name = name;
    selfRequest.Enabled = ko.observable(enabled);
    var ListOptions = new Array();
    for (var i = 1; i <= numFloors; i++) {
        ListOptions.push(new Floor(i, i, true));
    }
    selfRequest.LstFloorsOption = ko.observableArray(ListOptions.filter((a) => { return a.Id != id; }));
    selfRequest.CarAsigned = ko.observable();
    selfRequest.PushRequest = function fnDefineDireccion(Floor) {
        if (typeof (Floor) != "undefined" && Floor.hasOwnProperty("Id")) {
            //console.log("Request:" + selfRequest.Id + "|Destine:" + Floor.Id);
            window.ElevatorSystemManager.SaveRequest(selfRequest.Id, Floor.Id);
        }
    };
    selfRequest.ElevatorGoing = ko.pureComputed(function () {
        var ElevatorName = (typeof (selfRequest.CarAsigned()) == "string" && selfRequest.CarAsigned().length > 0) ? "Toma el elevador " + selfRequest.CarAsigned() : "";
        return ElevatorName;
    }, selfRequest);
}


ko.bindingHandlers.timer = {
    update: function (element, valueAccessor) {
        var sec = $(element).text();
        var timer = setInterval(function () {
            $(element).text(--sec);
            if (sec == 0) {
                clearInterval(timer);
            }
        }, 1000);
    }
};

ko.extenders.TimerService = function (target) {
    //Creacion de Computed que intecepta al observable extendido [target]
    var result = ko.pureComputed({
        read: function () {
            console.log("Read Value: " + target());
            return (typeof (target()) != "undefined") ? target() : false;
        },
        write: function (newValue) {
            if (typeof (newValue) != "undefined") {
                var current = target();
                var valueToWrite = newValue;
                //Validacion si en realidad cambio su valor
                if (valueToWrite !== current) {
                    target(valueToWrite);
                    if (valueToWrite === true){
                      console.log("Shot Timer Agent");
                    }
                }
                else {
                    //Si el valor ingresado es diferente, forzamos notificacion a campo actual.
                    if (newValue !== current) {
                        console.log("Value Changed 2");
                        target.notifySubscribers(valueToWrite);
                    }
                }
            }
        }
    }).extend({ notify: 'always' });

    //Utilizcion del Compute creado para fromatear al target actual
    result(target());

    //Retorno del nuevo obserbable.
    return result;
};

//Metodo para la inicializacion de Modilo de sistema de ascensores
window.InitializeViewModel = function fnInitializeViewModel() {
    ko.options.useOnlyNativeEvents = true;
    if (typeof (window.ElevatorSystemManager) == "undefined") { window.ElevatorSystemManager = new ElevatorSystemModel(6, 16); };
    window.ElevatorSystemManager.Init();
    if (!!ko.dataFor(document.getElementById("ElevatorSystem")) == false) { ko.applyBindings(window.ElevatorSystemManager); }
}
window.InitializeViewModel();

//window.ElevatorSystemManager.MoveCar(1,7);
window.ElevatorSystemManager.MoveCar(1, window.ElevatorSystemManager.GetRandomNumber(1, 16));
//modelView.moveCar(1, 16);
//window.ElevatorSystemManager.MoveCar(2,4);
window.ElevatorSystemManager.MoveCar(2, window.ElevatorSystemManager.GetRandomNumber(1, 16));
//modelView.moveCar(2, 4);
//window.ElevatorSystemManager.MoveCar(3,8);
window.ElevatorSystemManager.MoveCar(3, window.ElevatorSystemManager.GetRandomNumber(1, 16));
//modelView.moveCar(3, 8);
//window.ElevatorSystemManager.MoveCar(4,9);
window.ElevatorSystemManager.MoveCar(4, window.ElevatorSystemManager.GetRandomNumber(1, 16));
//modelView.moveCar(4, 9);
//window.ElevatorSystemManager.MoveCar(5,12);
window.ElevatorSystemManager.MoveCar(5, window.ElevatorSystemManager.GetRandomNumber(1, 16));
//modelView.moveCar(5, 12);
//window.ElevatorSystemManager.MoveCar(6,1);
window.ElevatorSystemManager.MoveCar(6, window.ElevatorSystemManager.GetRandomNumber(1, 16));
