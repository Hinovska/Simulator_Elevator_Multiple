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
                if ($(this).hasClass('on')) { return; }
                $(this).toggleClass('on');
                return $(me).trigger('pressed', [{ floor: parseInt($(this)[0].dataset.floor), dir: $(this).children().hasClass('up') ? 'up' : 'down' }]);
            });
    }

    clearButton(floor, dir) {
        return $(`#button-floor-${floor} > button > div.${dir}`).parent().removeClass('on');
    }

    firstIdleCar() {
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
            })
            .delay(75);
        $(`#elevator${car} .car > div`)
            .animate({ top: `${(-368 + (floor * 23))}px` }, {
                duration: 500 * Math.abs(myCars[car - 1].floor - floor),
                easing: 'swing'
            })
            .delay(75);
        return deferred;
    }
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