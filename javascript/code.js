function ElevatorSystemModel(numElevators, numFloors) {
    var self = this;
    self.NumElevators = ko.observable(numElevators);
    self.NumFloors = ko.observable(numFloors);
    self.CostStop = ko.observable(1.5);
    self.CostStart = ko.observable(1.5);
    self.CostByFloor = ko.observable(2);
    self.ListRequest = ko.observableArray();
    self.ListElevator = ko.observableArray();
    self.Init = function fnInit() {
        if (self.NumElevators() && self.NumFloors() && self.NumElevators() > 0 && self.NumFloors() > 0) {
            var ListElevators = new Array();
            for (var i = 1; i <= self.NumElevators(); i++) {
                ListElevators.push(new Elevator(i, i, self.NumFloors(), true, 1));
            }
            var LstRequest = new Array();
            for (var i = 1; i <= self.NumFloors(); i++) {
                LstRequest.push(new Request(i, i, true));
            }
            self.ListElevator(ListElevators);
            self.ListRequest(LstRequest.reverse());
        }
    };
    self.SendRequest = function fnSendRequest(Salary) {
        //if (self.SalaryRangeSelected() != Salary) {
        //    self.SalaryRangeList().filter(function (obj) { return obj.Selected() == true; }).map(function (item) { item.Selected(false); });
        //    self.SalaryRangeList().filter(function (obj) { return obj == Salary; }).map(function (item) { item.Selected(true); });
        //    self.SalaryRangeSelected(Salary);
        //    self.SalaryRange(Salary.Name);
        console.log(Salary.Id);
    };
    self.MoveCar = function fnMoveCar(car, floor) {
        const myCars = this.ListElevator();
        const deferred = $.Deferred();
        var CarItem = self.ListElevator().filter(function (carItem) { return carItem.Id == car; })[0];
        debugger;
        if (CarItem && CarItem.moving()) {
            return deferred.reject();
        }
        if ((floor < 1) || (floor > self.NumFloors())) {
            return deferred.reject();
        }
        CarItem.moving(true);
        console.log("Start Move Elevator " + car.toString());
        $(`#elevator${car} .car`).animate({ bottom: `${(floor - 1) * 23}px` }, {
            duration: 500 * Math.abs(CarItem.CurrentFloor().Id - floor),
            easing: 'swing',
            complete() {
                CarItem.CurrentFloor(CarItem.LstFloors().filter(function (item) { return item.Id == floor; })[0]);
                CarItem.moving(false);
                console.log("Stop Move Elevator " + car.toString());
                return deferred.resolve();
            }
        }).delay(75);
        $(`#elevator${car} .car > div`).animate({ top: `${(-368 + (floor * 23))}px` }, {
            duration: 500 * Math.abs(CarItem.CurrentFloor().Id - floor),
            easing: 'swing'
        }).delay(75);
        return deferred;
    };
    self.EnableSystem = ko.observable(true);
}

function Elevator(id, name, FloorNumber, bussy, currentFloor) {
    var SelfItem = this;
    SelfItem.Id = id;
    SelfItem.Name = name;
    SelfItem.FloorsCount = ko.observable(FloorNumber);
    SelfItem.Bussy = ko.observable(bussy);
    SelfItem.moving = ko.observable(false);
    SelfItem.CurrentFloor = ko.observable();
    var ListFlors = new Array();
    for (var i = 1; i <= SelfItem.FloorsCount(); i++) {
        ListFlors.push(new Floor(i, i, false));
    }
    SelfItem.LstFloors = ko.observableArray(ListFlors.reverse());
    SelfItem.CurrentFloor(SelfItem.LstFloors()[0]);
}

function Floor(id, name, checked) {
    var selfFloor = this;
    selfFloor.Id = id;
    selfFloor.Name = name;
    selfFloor.Bussy = ko.observable(checked);
}

function Request(id, name, enabled) {
    var selfRequest = this;
    selfRequest.Id = id;
    selfRequest.Name = name;
    selfRequest.Enabled = ko.observable(enabled);
    selfRequest.CarAsigned = ko.observable();
}

window.InitializeViewModel = function fnInitializeViewModel() {
    ko.options.useOnlyNativeEvents = true;
    if (typeof (window.ElevatorSystemManager) == "undefined") { window.ElevatorSystemManager = new ElevatorSystemModel(6, 16); };
    window.ElevatorSystemManager.Init();
    if (!!ko.dataFor(document.getElementById("ElevatorSystem")) == false) { ko.applyBindings(window.ElevatorSystemManager); }
}

window.InitializeViewModel();

class ElevatorModelView {
    constructor() {
        this.floors = 16;
        this.cars = [{ floor: 1, moving: false },
        { floor: 1, moving: false },
        { floor: 1, moving: false },
        { floor: 1, moving: false },
        { floor: 1, moving: false },
        { floor: 1, moving: false }];

        const me = this;

        const buttons = ((() => {
            const result = [];
            for (let floor = 16; floor >= 1; floor--) {
                result.push(`\
                <div id = 'button-floor-${floor}' class='button-floor'>
                      <button class='button up' data-floor='${floor}'><div class='up'></div></button>
                      <button class='button down' data-floor='${floor}'><div class='down'></div></button>
                </div>\
                `);
            }
            return result;
        })()).join('');

        $('#buttons').empty().append($(buttons)).off('click').on('click', 'button', function () {
            console.log("Call Click Bottom");
            if ($(this).hasClass('on')) { return; }
            $(this).toggleClass('on');
            return $(me).trigger('pressed', [{ floor: parseInt($(this)[0].dataset.floor), dir: $(this).children().hasClass('up') ? 'up' : 'down' }]);
        });
    }

    clearButton(floor, dir) {
        console.log("Call clearButton");
        return $(`#button-floor-${floor} > button > div.${dir}`).parent().removeClass('on');
    }

    firstIdleCar() {
        console.log("Call firstIdleCar");
        return ((() => {
            const result = [];
            for (let i = 0; i < this.cars.length; i++) {
                const car = this.cars[i];
                if (!car.moving) {
                    result.push(i + 1);
                }
            }
            return result;
        })())[0];
    }

    closestIdleCar(floor) {
        console.log("Call closestIdleCar");
        let a;
        console.log(`Finding closest car to ${floor} from `, this.cars);
        const nonmoving = ((() => {
            const result = [];
            for (let i = 0; i < this.cars.length; i++) {
                const car = this.cars[i];
                if (!car.moving) {
                    result.push([i + 1, Math.abs(floor - car.floor)]);
                }
            }
            return result;
        })());

        const closest = nonmoving.reduce(function (a, b) { if (a[1] <= b[1]) { return a; } else { return b; } });
        const lowest = ((() => {
            console.log("Call lowest");
            const result1 = [];
            for (a of Array.from(nonmoving)) {
                if (a[1] === closest[1]) {
                    result1.push(a[0]);
                }
            }
            return result1;
        })());

        console.log(`Closest car to ${floor} is ${closest} from ${nonmoving}`);
        return lowest[Math.floor(Math.random() * lowest.length)];
    }

    moveCar(car, floor) {
        console.log("Call moveCar");
        const myCars = this.cars;
        const deferred = $.Deferred();
        if (this.cars[car - 1].moving) {
            return deferred.reject();
        }
        if ((floor < 1) || (floor > this.floors)) {
            return deferred.reject();
        }
        this.cars[car - 1].moving = true;
        console.log("Start Move Elevator " + car.toString());
        $(`#elevator${car} .car`)
            .animate({ bottom: `${(floor - 1) * 23}px` }, {
                duration: 500 * Math.abs(myCars[car - 1].floor - floor),
                easing: 'swing',
                complete() {
                    myCars[car - 1].floor = floor;
                    myCars[car - 1].moving = false;
                    console.log("Stop Move Elevator " + car.toString());
                    return deferred.resolve();
                }
            }).delay(75);
        $(`#elevator${car} .car > div`)
            .animate({ top: `${(-368 + (floor * 23))}px` }, {
                duration: 500 * Math.abs(myCars[car - 1].floor - floor),
                easing: 'swing'
            }).delay(75);
        return deferred;
    };
}

const modelView = new ElevatorModelView();

$(modelView).on('pressed', function (e, { floor, dir }) {
    console.log(`Pressed ${floor}-${dir}`);
    return modelView.moveCar(modelView.closestIdleCar(floor), floor).then(() => modelView.clearButton(floor, dir));
});

modelView.moveCar(1, 16);
modelView.moveCar(2, 4);
modelView.moveCar(3, 8);
modelView.moveCar(4, 9);
modelView.moveCar(5, 12);
modelView.moveCar(6, 1);