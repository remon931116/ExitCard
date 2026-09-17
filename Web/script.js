// ==============================
// ExitCard - script.js
// ==============================


// ==============================
// 1. Reminder
// ==============================

const reminderCourseInput = document.querySelector("#reminder-course");
const reminderInput = document.querySelector("#reminder-text");
const addReminderButton = document.querySelector("#add-reminder");
const reminderList = document.querySelector("#reminder-list");

let reminders =
    JSON.parse(localStorage.getItem("reminders")) || [
        {
            course: "體育",
            text: "記得帶水壺"
        }
    ];


function saveReminders() {
    localStorage.setItem("reminders", JSON.stringify(reminders));
}


function showReminders() {

    reminderList.innerHTML = "";

    reminders.forEach(function (reminder, index) {

        const reminderDiv = document.createElement("div");

        reminderDiv.className = "reminder";

        reminderDiv.innerHTML = `
            <span>${reminder.course}</span>
            <span>${reminder.text}</span>
            <button class="delete-button reminder-delete"
                    data-index="${index}">
                ×
            </button>
        `;

        reminderList.appendChild(reminderDiv);
    });
}


addReminderButton.addEventListener("click", function () {

    const course = reminderCourseInput.value.trim();
    const text = reminderInput.value.trim();

    if (course === "" || text === "") {
        alert("請輸入課程 / 事項與提醒內容");
        return;
    }

    reminders.push({
        course: course,
        text: text
    });

    saveReminders();
    showReminders();

    reminderCourseInput.value = "";
    reminderInput.value = "";
});


reminderList.addEventListener("click", function (event) {

    if (event.target.classList.contains("reminder-delete")) {

        const index = Number(event.target.dataset.index);

        reminders.splice(index, 1);

        saveReminders();
        showReminders();
    }
});



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

            return a.course.time.localeCompare(
                b.course.time
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
                ${item.course.time}
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
function drawExitCard() {
    const canvas = document.querySelector("#epaper-canvas");
    const ctx = canvas.getContext("2d");

    // 白底
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 300);

    // 黑字
    ctx.fillStyle = "black";

    // 標題
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillText("ExitCard", 20, 35);

    const dateText =
        document.querySelector("#selected-date-title").textContent;

    ctx.font = "16px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(dateText, 380, 35);

    ctx.textAlign = "left";

    // 分隔線
    ctx.beginPath();
    ctx.moveTo(20, 50);
    ctx.lineTo(380, 50);
    ctx.stroke();

    // TODAY
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillText("TODAY", 20, 80);

    let y = 105;

    const courses =
        document.querySelectorAll("#course-list .course");

    ctx.font = '16px "Microsoft JhengHei", Arial, sans-serif';

    if (courses.length === 0) {
        ctx.fillText("今天沒有課程", 20, y);
        y += 25;
    } else {
        courses.forEach(function (course) {
            const spans = course.querySelectorAll("span");

            if (spans.length >= 2) {
                const text =
                    spans[0].textContent.trim() +
                    "  " +
                    spans[1].textContent.trim();

                ctx.fillText(text, 20, y);

                y += 25;
            }
        });
    }

    // Reminder
    y += 10;

    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(380, y);
    ctx.stroke();

    y += 30;

    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillText("REMINDER", 20, y);

    y += 25;

    ctx.font = '16px "Microsoft JhengHei", Arial, sans-serif';

    const reminders =
        document.querySelectorAll("#reminder-list .reminder");

    if (reminders.length === 0) {
        ctx.fillText("沒有提醒", 20, y);
    } else {
        reminders.forEach(function (reminder) {
            const spans = reminder.querySelectorAll("span");

            if (spans.length >= 2 && y < 290) {
                const text =
                    spans[0].textContent.trim() +
                    "  " +
                    spans[1].textContent.trim();

                ctx.fillText(text, 20, y);

                y += 24;
            }
        });
    }
}
function syncExitCard() {
    const syncTextInput = document.querySelector("#sync-text");
    const syncForm = document.querySelector("#sync-form");

    const dateText =
        document.querySelector("#selected-date-title").textContent;

    const courseTexts = [];

    document.querySelectorAll("#course-list .course")
        .forEach(function (course) {
            const spans = course.querySelectorAll("span");

            if (spans.length >= 2) {
                courseTexts.push(
                    spans[0].textContent.trim() +
                    " " +
                    spans[1].textContent.trim()
                );
            }
        });

    const reminderTexts = [];

    document.querySelectorAll("#reminder-list .reminder")
        .forEach(function (reminder) {
            const spans = reminder.querySelectorAll("span");

            if (spans.length >= 2) {
                reminderTexts.push(
                    spans[0].textContent.trim() +
                    " " +
                    spans[1].textContent.trim()
                );
            }
        });

    let text = "ExitCard " + dateText + "\n\n";

    text += "TODAY\n";

    if (courseTexts.length === 0) {
        text += "No Course\n";
    } else {
        text += courseTexts.join("\n") + "\n";
    }

    text += "\nREMINDER\n";

    if (reminderTexts.length === 0) {
        text += "No Reminder";
    } else {
        text += reminderTexts.join("\n");
    }

    syncTextInput.value = text;

    syncForm.submit();
}
function syncFrameToExitCard() {

    // 先把最新課表 / Reminder 畫到 Canvas
    drawExitCard();

    const canvas =
        document.querySelector("#epaper-canvas");

    const ctx =
        canvas.getContext("2d");

    const imageData =
        ctx.getImageData(0, 0, 400, 300);

    const pixels = imageData.data;

    // 400 x 300 / 8 = 15000 bytes
    const bitmap =
        new Uint8Array(15000);

    for (let y = 0; y < 300; y++) {

        for (let x = 0; x < 400; x++) {

            const pixelIndex =
                (y * 400 + x) * 4;

            const r = pixels[pixelIndex];
            const g = pixels[pixelIndex + 1];
            const b = pixels[pixelIndex + 2];

            // 判斷黑 / 白
            const brightness =
                (r + g + b) / 3;

            if (brightness < 180) {

                const byteIndex =
                    y * 50 +
                    Math.floor(x / 8);

                const bit =
                    7 - (x % 8);

                bitmap[byteIndex] |=
                    (1 << bit);
            }
        }
    }

    // Uint8Array → Base64
    let binary = "";

    for (let i = 0; i < bitmap.length; i++) {
        binary +=
            String.fromCharCode(bitmap[i]);
    }

    const base64 =
        btoa(binary);

    // 用表單送到 CrowPanel
    const form =
        document.createElement("form");

    form.method = "POST";

    form.action =
        "http://192.168.0.92/frame";

    form.target =
        "sync-frame";

    const input =
        document.createElement("input");

    input.type = "hidden";
    input.name = "frame";
    input.value = base64;

    form.appendChild(input);

    document.body.appendChild(form);

    form.submit();

    form.remove();
}