// ========================================
// ExitCard TKU Connector - popup.js
// ========================================

const readBtn =
    document.getElementById("readBtn");

const applyBtn =
    document.getElementById("applyBtn");

const status =
    document.getElementById("status");

const resultBox =
    document.getElementById("result");


// ========================================
// 1. 讀取淡江課表
// ========================================

readBtn.addEventListener("click", async function () {

    try {

        // 找目前開啟的分頁
        const [tab] =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });


        // 確認現在是在淡江個人課表
        if (
            !tab ||
            !tab.url ||
            !tab.url.includes("TMWC090_result.aspx")
        ) {

            status.textContent =
                "❌ 請先開啟淡江個人課表";

            return;
        }


        status.textContent =
            "讀取中...";


        // 在淡江課表頁面讀取 HTML
        const results =
            await chrome.scripting.executeScript({

                target: {
                    tabId: tab.id
                },

                func: function () {

                    const table =
                        document.querySelector("#Table1");


                    if (!table) {

                        return {
                            error: "找不到課表 Table1"
                        };

                    }


                    // 星期一～星期日
                    const schedule = {

                        day1: [],
                        day2: [],
                        day3: [],
                        day4: [],
                        day5: [],
                        day6: [],
                        day7: []

                    };


                    const rows =
                        Array.from(table.rows);


                    rows.forEach(function (row) {

                        const cells =
                            Array.from(row.cells);


                        // 節次 + 星期一～日
                        if (cells.length < 8) {
                            return;
                        }


                        // 第一格 = 節次
                        const period =
                            cells[0]
                                .innerText
                                .trim();


                        // 跳過表頭
                        if (
                            !period ||
                            period.includes("節次") ||
                            period.includes("星期")
                        ) {

                            return;

                        }


                        // day 1～7
                        for (
                            let day = 1;
                            day <= 7;
                            day++
                        ) {

                            const cell =
                                cells[day];


                            // 課名連結
                            const courseLink =
                                cell.querySelector(
                                    "a.a-blue"
                                );


                            // 沒課
                            if (!courseLink) {
                                continue;
                            }


                            const course =
                                courseLink
                                    .innerText
                                    .trim();


                            // 取得整格文字
                            const lines =
                                cell.innerText
                                    .split("\n")
                                    .map(function (text) {

                                        return text.trim();

                                    })
                                    .filter(function (text) {

                                        return text !== "";

                                    });


                            // 找課名的位置
                            const courseIndex =
                                lines.indexOf(course);


                            let info = "";


                            // 課名下一行通常是 老師_教室
                            if (
                                courseIndex !== -1 &&
                                lines[courseIndex + 1]
                            ) {

                                info =
                                    lines[
                                        courseIndex + 1
                                    ];

                            }


                            let teacher = "";
                            let room = "";


                            // 例如：
                            // 顏玉郁_E231
                            if (info.includes("_")) {

                                const parts =
                                    info.split("_");


                                teacher =
                                    parts[0]
                                        .trim();


                                room =
                                    parts
                                        .slice(1)
                                        .join("_")
                                        .trim();

                            }


                            schedule[
                                "day" + day
                            ].push({

                                period: period,
                                course: course,
                                teacher: teacher,
                                room: room

                            });

                        }

                    });


                    return schedule;

                }

            });


        // 確認有拿到資料
        if (
            !results ||
            !results[0] ||
            !results[0].result
        ) {

            throw new Error(
                "沒有取得課表資料"
            );

        }


        const schedule =
            results[0].result;


        if (schedule.error) {

            throw new Error(
                schedule.error
            );

        }


        // ========================================
        // 存在擴充功能自己的 localStorage
        // 不存帳密、不存 Cookie
        // ========================================

        localStorage.setItem(
            "tkuSchedule",
            JSON.stringify(schedule)
        );


        status.textContent =
            "✅ 淡江課表讀取成功";


        resultBox.textContent =
            JSON.stringify(
                schedule,
                null,
                2
            );


    } catch (error) {

        status.textContent =
            "❌ " + error.message;

        console.error(error);

    }

});


// ========================================
// 2. 套用到 ExitCard 網站
// ========================================

applyBtn.addEventListener("click", async function () {

    try {

        // 讀取剛才存好的淡江課表
        const savedSchedule =
            localStorage.getItem(
                "tkuSchedule"
            );


        if (!savedSchedule) {

            status.textContent =
                "❌ 請先讀取淡江課表";

            return;

        }


        const schedule =
            JSON.parse(savedSchedule);


        // ========================================
        // 淡江節次文字 → 數字
        // ========================================

        const periodMap = {

            "一": 1,
            "二": 2,
            "三": 3,
            "四": 4,
            "五": 5,
            "六": 6,
            "七": 7,
            "八": 8,
            "九": 9,
            "十": 10,
            "十一": 11,
            "十二": 12,
            "十三": 13,
            "十四": 14

        };


        // ========================================
        // 轉成 ExitCard 原本 courses 格式
        // ========================================

        const courses = [];


        for (
            let day = 1;
            day <= 7;
            day++
        ) {

            const dayCourses =
                schedule[
                    "day" + day
                ] || [];


            dayCourses.forEach(
                function (item) {

                    const number =
                        periodMap[
                            item.period
                        ] ||
                        item.period;


                    courses.push({

                        day: day,

                        time:
                            "第" +
                            number +
                            "節",

                        name:
                            item.course,

                        room:
                            item.room,

                        teacher:
                            item.teacher,

                        period:
                            number

                    });

                }
            );

        }


        // ========================================
        // 找目前 ExitCard 網站分頁
        // ========================================

        const [tab] =
            await chrome.tabs.query({
                active: true,
                currentWindow: true
            });


        if (!tab) {

            throw new Error(
                "找不到 ExitCard 網站分頁"
            );

        }


        // ========================================
        // 把資料存進 ExitCard 網站 localStorage
        // ========================================

        await chrome.scripting.executeScript({

            target: {
                tabId: tab.id
            },

            world: "MAIN",

            func: function (courses) {

                localStorage.setItem(
                    "courses",
                    JSON.stringify(courses)
                );


                // 重新整理 ExitCard
                location.reload();

            },

            args: [
                courses
            ]

        });


        status.textContent =
            "✅ 已套用到 ExitCard";


    } catch (error) {

        status.textContent =
            "❌ " + error.message;

        console.error(error);

    }

});