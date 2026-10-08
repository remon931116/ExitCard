// ==============================
// ExitCard - script.js
// ==============================


// ==============================
// 1. Reminder
// ==============================

const reminderCourseInput =
    document.querySelector("#reminder-course");

const reminderTextInput =
    document.querySelector("#reminder-text");

const addFixedReminderButton =
    document.querySelector("#add-fixed-reminder");

const reminderDateInput =
    document.querySelector("#reminder-date");

const reminderOnceTextInput =
    document.querySelector("#reminder-once-text");

const addOnceReminderButton =
    document.querySelector("#add-once-reminder");

const reminderList =
    document.querySelector("#reminder-list");


let reminders =
    JSON.parse(
        localStorage.getItem("reminders")
    ) || [];


// 舊資料自動當成固定提醒
reminders = reminders.map(function (reminder) {

    if (!reminder.type && reminder.course) {

        return {
            type: "fixed",
            course: reminder.course,
            text: reminder.text
        };

    }

    return reminder;
});


function saveReminders() {

    localStorage.setItem(
        "reminders",
        JSON.stringify(reminders)
    );
}


function showReminders() {

    reminderList.innerHTML = "";

    reminders.forEach(function (reminder, index) {

        const reminderDiv =
            document.createElement("div");

        reminderDiv.className = "reminder";


        if (reminder.type === "fixed") {

            reminderDiv.innerHTML = `
            <span>${reminder.course}</span>
            <span>${reminder.text}</span>

            <button
                class="delete-button reminder-delete"
                data-index="${index}">
                ×
            </button>
        `;

        }


        if (reminder.type === "once") {

            reminderDiv.innerHTML = `
                <span>${reminder.date}</span>
                <span>${reminder.text}</span>

                <button
                    class="delete-button reminder-delete"
                    data-index="${index}">
                    ×
                </button>
            `;

        }


        reminderList.appendChild(
            reminderDiv
        );

    });
}


// 固定提醒
addFixedReminderButton.addEventListener(
    "click",
    function () {

        const course =
            reminderCourseInput.value.trim();

        const text =
            reminderTextInput.value.trim();


        if (course === "" || text === "") {

            alert("請輸入課程 / 標籤與提醒內容");

            return;
        }


        reminders.push({
            type: "fixed",
            course: course,
            text: text
        });


        saveReminders();
        showReminders();


        reminderCourseInput.value = "";
        reminderTextInput.value = "";
    }
);


// 一次性提醒
addOnceReminderButton.addEventListener(
    "click",
    function () {

        const date =
            reminderDateInput.value;

        const text =
            reminderOnceTextInput.value.trim();


        if (date === "" || text === "") {

            alert("請選擇日期並輸入提醒事項");

            return;
        }


        reminders.push({
            type: "once",
            date: date,
            text: text
        });


        saveReminders();
        showReminders();


        reminderDateInput.value = "";
        reminderOnceTextInput.value = "";
    }
);


// 刪除提醒
reminderList.addEventListener(
    "click",
    function (event) {

        if (
            event.target.classList.contains(
                "reminder-delete"
            )
        ) {

            const index =
                Number(
                    event.target.dataset.index
                );


            reminders.splice(
                index,
                1
            );


            saveReminders();
            showReminders();
        }
    }
);

// ==============================
// 2. 日期設定
// ==============================

let selectedDate = new Date();


function getDayNumber(date) {

    const day = date.getDay();

    // JavaScript 星期日 = 0
    // ExitCard 改成 星期一 = 1 ... 星期日 = 7
    return day === 0 ? 7 : day;
}


function getMonday(date) {

    const newDate = new Date(date);

    const day = newDate.getDay();

    const difference =
        day === 0 ? -6 : 1 - day;

    newDate.setDate(
        newDate.getDate() + difference
    );

    return newDate;
}


function isSameDate(date1, date2) {

    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}



// ==============================
// 3. 課表
// ==============================

const courseDayInput =
    document.querySelector("#course-day");

const courseTimeInput =
    document.querySelector("#course-time");

const courseNameInput =
    document.querySelector("#course-name");

const addCourseButton =
    document.querySelector("#add-course");

const courseList =
    document.querySelector("#course-list");


let courses =
    JSON.parse(localStorage.getItem("courses")) || [];


// 預設選今天星期幾
courseDayInput.value =
    getDayNumber(selectedDate);


function saveCourses() {

    localStorage.setItem(
        "courses",
        JSON.stringify(courses)
    );
}

function periodToTime(timeText) {

    const period =
        Number(
            timeText.match(/\d+/)?.[0]
        );

    const periodTimes = {
        1: "08:10",
        2: "09:10",
        3: "10:10",
        4: "11:10",
        5: "12:10",
        6: "13:10",
        7: "14:10",
        8: "15:10",
        9: "16:10",
        10: "17:10",
        11: "18:10",
        12: "19:10",
        13: "20:10",
        14: "21:10"
    };

    return periodTimes[period] || timeText;
}

function showCourses() {

    courseList.innerHTML = "";

    const selectedDay =
        getDayNumber(selectedDate);


    const selectedCourses = courses

        .map(function (course, index) {

            return {
                course: course,
                index: index
            };
        })

        .filter(function (item) {

            return (
                Number(item.course.day) ===
                selectedDay
            );
        })

        .sort(function (a, b) {

    const timeA =
        Number(
            a.course.time.match(/\d+/)?.[0] || 0
        );

    const timeB =
        Number(
            b.course.time.match(/\d+/)?.[0] || 0
        );

    return timeA - timeB;
})
    .filter(function (item, index, array) {

        return (
            array.findIndex(function (other) {

                return (
                    other.course.name ===
                    item.course.name
                );

            }) === index
        );
    });


    if (selectedCourses.length === 0) {

        courseList.innerHTML =
            "<p>這天沒有課程</p>";

        return;
    }


    selectedCourses.forEach(function (item) {

        const courseDiv =
            document.createElement("div");

        courseDiv.className = "course";

        courseDiv.innerHTML = `
            <span class="time">
                ${periodToTime(item.course.time)}
            </span>

            <span>
                ${item.course.name}
            </span>

            <button
                class="delete-button course-delete"
                data-index="${item.index}">
                ×
            </button>
        `;

        courseList.appendChild(courseDiv);
    });
}


addCourseButton.addEventListener(
    "click",
    function () {

        const day =
            courseDayInput.value;

        const time =
            courseTimeInput.value;

        const name =
            courseNameInput.value.trim();


        if (time === "" || name === "") {

            alert("請輸入時間與課程名稱");

            return;
        }


        courses.push({

            day: Number(day),

            time: time,

            name: name
        });


        saveCourses();

        showCourses();


        courseTimeInput.value = "";

        courseNameInput.value = "";
    }
);


courseList.addEventListener(
    "click",
    function (event) {

        if (
            event.target.classList.contains(
                "course-delete"
            )
        ) {

            const index =
                Number(
                    event.target.dataset.index
                );

            courses.splice(index, 1);

            saveCourses();

            showCourses();
        }
    }
);



// ==============================
// 4. 上方星期日期
// ==============================

const monthTitle =
    document.querySelector("#month-title");

const weekDays =
    document.querySelector("#week-days");

const prevWeekButton =
    document.querySelector("#prev-week");

const nextWeekButton =
    document.querySelector("#next-week");


function showWeek() {

    const monday =
        getMonday(selectedDate);


    monthTitle.textContent =
        selectedDate.toLocaleDateString(
            "en-US",
            {
                month: "long",
                year: "numeric"
            }
        );


    weekDays.innerHTML = "";


    for (let i = 0; i < 7; i++) {

        const date =
            new Date(monday);

        date.setDate(
            monday.getDate() + i
        );


        const day =
            document.createElement("span");


        day.className =
            "day-number";


        day.textContent =
            date.getDate();


        // 選中的日期加底線
        if (
            isSameDate(
                date,
                selectedDate
            )
        ) {

            day.classList.add(
                "today-date"
            );
        }


        // 點日期
        day.addEventListener(
            "click",
            function () {

                selectedDate =
                    new Date(date);


                // 新增課程的星期同步
                courseDayInput.value =
                    getDayNumber(selectedDate);


                showWeek();

                showCourses();

                showSelectedDateTitle();
            }
        );


        weekDays.appendChild(day);
    }
}



// ==============================
// 5. 左右切換星期
// ==============================

prevWeekButton.addEventListener(
    "click",
    function () {

        selectedDate.setDate(
            selectedDate.getDate() - 7
        );

        courseDayInput.value =
            getDayNumber(selectedDate);

        showWeek();

        showCourses();

        showSelectedDateTitle();
    }
);


nextWeekButton.addEventListener(
    "click",
    function () {

        selectedDate.setDate(
            selectedDate.getDate() + 7
        );

        courseDayInput.value =
            getDayNumber(selectedDate);

        showWeek();

        showCourses();

        showSelectedDateTitle();
    }
);



// ==============================
// 6. Today / 日期標題
// ==============================

function showSelectedDateTitle() {

    const title =
        document.querySelector(
            "#selected-date-title"
        );

    const today =
        new Date();


    if (
        isSameDate(
            selectedDate,
            today
        )
    ) {

        title.textContent =
            "Today";

    } else {

        title.textContent =
            (selectedDate.getMonth() + 1) +
            "/" +
            selectedDate.getDate();
    }
}



// ==============================
// 7. 第一次載入網頁
// ==============================
showReminders();

showWeek();

showCourses();

showSelectedDateTitle();
 // ==============================
// 8. 畫 ExitCard 電子紙畫面
// ==============================

function drawExitCard() {

    const canvas =
        document.querySelector("#epaper-canvas");

    const ctx =
        canvas.getContext("2d");


    // =========================
    // 白色背景
    // =========================

    ctx.fillStyle = "white";

    ctx.fillRect(
        0,
        0,
        400,
        300
    );


    ctx.fillStyle = "black";
    ctx.textAlign = "left";


    // =========================
    // ExitCard 標題
    // =========================

    ctx.font =
        "bold 26px Arial, sans-serif";

    ctx.fillStyle = "black";

    ctx.textAlign = "left";

    ctx.fillText(
        "課表",
        20,
        35
    );


    // =========================
    // 日期
    // =========================

    const weekNames = [
        "SUN",
        "MON",
        "TUE",
        "WED",
        "THU",
        "FRI",
        "SAT"
    ];


    const dateText =
        (selectedDate.getMonth() + 1) +
        "/" +
        selectedDate.getDate() +
        "  " +
        weekNames[
            selectedDate.getDay()
        ];


    ctx.font =
        '16px "Microsoft JhengHei", sans-serif';

    ctx.textAlign = "right";

    ctx.fillText(
        dateText,
        380,
        35
    );

    ctx.textAlign = "left";


    // =========================
    // 上方分隔線
    // =========================

    ctx.beginPath();

    ctx.moveTo(
        20,
        50
    );

    ctx.lineTo(
        380,
        50
    );

    ctx.lineWidth = 2;

    ctx.stroke();


    // =========================
    // TODAY 標題
    // =========================

    ctx.font =
        "bold 18px Arial, sans-serif";

    ctx.fillText(
        "TODAY",
        20,
        78
    );


    let y = 105;


    // =========================
    // 今天課程
    // =========================

    const courseElements =
        document.querySelectorAll(
            "#course-list .course"
        );


    const todayCourseNames = [];


    ctx.font =
        '17px "Microsoft JhengHei", sans-serif';


    if (courseElements.length === 0) {

        ctx.fillText(
            "今天沒有課程",
            20,
            y
        );

    } else {

        courseElements.forEach(
            function (course) {

                const spans =
                    course.querySelectorAll(
                        "span"
                    );


                if (
                    spans.length >= 2 &&
                    y < 190
                ) {

                    const time =
                        spans[0]
                            .textContent
                            .trim();


                    const name =
                        spans[1]
                            .textContent
                            .trim();


                    // 記住今天課名
                    todayCourseNames.push(
                        name
                    );


                    ctx.fillText(
                        time,
                        20,
                        y
                    );


                    ctx.fillText(
                        name,
                        105,
                        y
                    );


                    y += 24;
                }
            }
        );
    }


    // =========================
    // 中間分隔線
    // =========================

    const dividerY = 205;


    ctx.beginPath();

    ctx.moveTo(
        20,
        dividerY
    );

    ctx.lineTo(
        380,
        dividerY
    );

    ctx.lineWidth = 1;

    ctx.stroke();

    // =========================
    // REMINDER
    // =========================

    ctx.font =
        "bold 18px Arial, sans-serif";

    ctx.fillText(
        "REMINDER",
        20,
        232
    );

    y = 258;

// =========================
// 顯示今天指定日期的 Reminder
// =========================

const reminderElements =
    document.querySelectorAll(
        "#reminder-list .reminder"
    );


ctx.font =
    '16px "Microsoft JhengHei", sans-serif';


let reminderCount = 0;


// 今天日期 yyyy-mm-dd
const selectedDateKey =
    selectedDate.getFullYear() +
    "-" +
    String(
        selectedDate.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
        selectedDate.getDate()
    ).padStart(2, "0");

// =========================
// 固定提醒
// 今天有這堂課就顯示
// =========================

reminders.forEach(function (reminder) {

    if (
        reminder.type === "fixed" &&
        todayCourseNames.includes(reminder.course) &&
        y < 295
    ) {

        ctx.fillText(
            reminder.course,
            20,
            y
        );

        ctx.fillText(
            reminder.text,
            120,
            y
        );

        y += 24;

        reminderCount++;
    }

});


// =========================
// 一次性提醒
// 指定日期才顯示
// =========================

reminders.forEach(function (reminder) {

    if (
        reminder.type === "once" &&
        reminder.date === selectedDateKey &&
        y < 295
    ) {

        ctx.fillText(
            reminder.text,
            20,
            y
        );

        y += 24;

        reminderCount++;
    }

});


// 沒有任何提醒
if (reminderCount === 0) {

    ctx.fillText(
        "今天沒有提醒",
        20,
        y
    );
}

}
// ==============================
// 9. Canvas 轉成 Base64 bitmap
// ==============================

function canvasToBase64() {

    const canvas =
        document.querySelector(
            "#epaper-canvas"
        );


    const ctx =
        canvas.getContext("2d");


    const imageData =
        ctx.getImageData(
            0,
            0,
            400,
            300
        );


    const pixels =
        imageData.data;


    // 400 × 300 ÷ 8
    const bitmap =
        new Uint8Array(
            15000
        );


    for (
        let y = 0;
        y < 300;
        y++
    ) {

        for (
            let x = 0;
            x < 400;
            x++
        ) {

            const pixelIndex =
                (y * 400 + x) * 4;


            const r =
                pixels[
                    pixelIndex
                ];


            const g =
                pixels[
                    pixelIndex + 1
                ];


            const b =
                pixels[
                    pixelIndex + 2
                ];


            const brightness =
                (r + g + b) / 3;


            // 深色 → 黑色
            if (brightness < 180) {

                const byteIndex =
                    y * 50 +
                    Math.floor(
                        x / 8
                    );


                const bit =
                    7 -
                    (x % 8);


                bitmap[
                    byteIndex
                ] |=
                    (1 << bit);
            }
        }
    }


    // Uint8Array → binary
    let binary = "";


    for (
        let i = 0;
        i < bitmap.length;
        i++
    ) {

        binary +=
            String.fromCharCode(
                bitmap[i]
            );
    }


    // binary → Base64
    return btoa(
        binary
    );
}


// ==============================
// 10. 傳送某一天到 CrowPanel
// ==============================

function sendFrameToExitCard(
    day,
    base64
) {

    const form =
        document.createElement(
            "form"
        );


    form.method = "POST";


    form.action =
        "http://192.168.0.92/frame?day=" +
        day;


    form.target =
        "sync-frame";


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "hidden";

    input.name =
        "frame";

    input.value =
        base64;


    form.appendChild(
        input
    );


    document.body.appendChild(
        form
    );


    form.submit();


    form.remove();
}


// ==============================
// 11. 單日同步
// ==============================

function syncFrameToExitCard() {

    // 先畫目前選取日期
    drawExitCard();


    // Canvas → Base64
    const base64 =
        canvasToBase64();


    let day =
        selectedDate.getDay();


    // 星期日 0 → 7
    if (day === 0) {

        day = 7;
    }


    sendFrameToExitCard(
        day,
        base64
    );
}


// ==============================
// 12. 整週同步
// ==============================

async function syncWeekToExitCard() {

    // 找本週星期一
    const monday =
        getMonday(
            new Date()
        );


    // 星期一～星期日
    for (
        let day = 1;
        day <= 7;
        day++
    ) {

        const date =
            new Date(
                monday
            );


        date.setDate(
            monday.getDate() +
            (day - 1)
        );


        selectedDate =
            date;


        // 更新畫面資料
        showWeek();

        showCourses();

        showSelectedDateTitle();


        // 畫這一天
        drawExitCard();


        // Canvas → Base64
        const base64 =
            canvasToBase64();


        // 傳給 CrowPanel
        sendFrameToExitCard(
            day,
            base64
        );


        console.log(
            "同步星期：" +
            day
        );


        // 等 ESP32 處理完再傳下一張
        await new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    1500
                );
            }
        );
    }


    // =========================
    // 同步完成後回到今天
    // =========================

    selectedDate =
        new Date();


    courseDayInput.value =
        getDayNumber(
            selectedDate
        );


    showWeek();

    showCourses();

    showSelectedDateTitle();

    drawExitCard();


    alert(
        "一週課表已同步到 ExitCard！"
    );
}