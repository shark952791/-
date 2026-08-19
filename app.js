/* =========================================================
   槐安庙线上服务平台 · 交互脚本
   ---------------------------------------------------------
   设计说明（开发者备注）：
   本文件刻意把“可变内容”与“可变行为”抽离到 HUAIAN.config 与
   HUAIAN.hooks，方便后续剧情阶段逐步“污染”这个原本正常的网站。
   所有动态文本、客服话术、历史内容、公告均集中管理。
   后续接入异常/线索/不可靠叙事时，只需修改 config 或注册 hook，
   无需重写结构。
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- 状态存储（LocalStorage） ---------------- */
  var LS_KEY = "huai_an_miao_state_v1";
  var store = {
    data: {
      visits: 0,                 // 本地访问计数
      pageLog: [],               // 页面访问记录（含时间）
      reservations: [],          // 预约记录
      repayments: [],            // 还愿记录
      prayers: [],               // 祈愿记录
      feedback: [],              // 意见反馈
      progress: {},              // 玩家进度（后续剧情用）
      flags: {}                  // 后续剧情开关
    },
    load: function () {
      try {
        var raw = localStorage.getItem(LS_KEY);
        if (raw) this.data = Object.assign(this.data, JSON.parse(raw));
      } catch (e) {}
      return this.data;
    },
    save: function () {
      try { localStorage.setItem(LS_KEY, JSON.stringify(this.data)); } catch (e) {}
    }
  };
  store.load();

  /* ---------------- 可动态修改的配置（污染入口） ---------------- */
  var config = {
    siteName: "槐安庙",
    // 顶部滚动公告（数组，可任意增删 / 后续被剧情替换）
    announcements: [
      "温馨提示：近期香客较多，请提前预约入庙时间。",
      "本庙于每月初一、十五举行常规祈福法会，欢迎参加。",
      "游客服务中心现已开通在线客服，解答预约与还愿相关问题。",
      "周边文创商城支付功能建设中，敬请期待。"
    ],
    // 历史时间轴（保留大量可替换文本，后续逐步替换成真实线索）
    history: [
      { time: "清代", text: "据地方志零星记载，槐安庙或与清代民间祠庙活动相关，具体始建年代尚有不同说法。" },
      { time: "民国", text: "民国民间信众曾集资修缮，庙产于战乱中几经波折，香火未绝。" },
      { time: "1950年代", text: "庙宇一度改作他用，部分建筑得以保留。" },
      { time: "1980年代", text: "当地信众自发恢复祭祀活动，逐步修缮主殿。" },
      { time: "2000年代", text: "槐安庙正式登记为民间信仰活动场所，开放日常参拜。" },
      { time: "至今", text: "现已开通线上预约、还愿与祈福服务，方便远方信众。" }
    ],
    // 商城商品（低分辨率实拍图，尺寸刻意不完全一致）
    shop: [
      { img: "assets/shop/01.jpg", name: "平安符", price: "￥18" },
      { img: "assets/shop/02.jpg", name: "祈福红绳", price: "￥12" },
      { img: "assets/shop/03.jpg", name: "香囊（安神）", price: "￥25" },
      { img: "assets/shop/04.jpg", name: "祈福牌", price: "￥15" },
      { img: "assets/shop/05.jpg", name: "纪念香（束）", price: "￥20" },
      { img: "assets/shop/06.jpg", name: "小型摆件", price: "￥38" },
      { img: "assets/shop/07.jpg", name: "庙宇纪念册", price: "￥48" },
      { img: "assets/shop/08.jpg", name: "年画文创", price: "￥22" }
    ],
    // 客服话术（规则型，后续可扩展为剧情互动窗口）
    cs: {
      greeting: "您好，欢迎来到槐安庙，请问有什么可以帮助您的？",
      quickQuestions: ["如何预约？", "怎么还愿？", "开放时间？", "可以临时入庙吗？", "有什么需要注意的？"],
      // 关键词 -> 回复（命中任一关键词即返回）
      replies: [
        { keys: ["预约", "入庙", "参拜", "ticket", "约"], answer: "您好，近期香客较多，建议您提前一天在【在线预约】页面选择日期与时段进行预约。" },
        { keys: ["还愿", "还愿"], answer: "请在【还愿服务】页面选择还愿事项并提交还愿预约，庙方将为您安排。" },
        { keys: ["开放", "时间", "几点"], answer: "槐安庙每日 08:00 - 18:00 开放，除夕及特殊法会另行公告。" },
        { keys: ["临时", "直接", "没约"], answer: "为保障礼佛秩序，建议提前预约；若当日名额未满，亦可现场登记入庙。" },
        { keys: ["注意", "禁忌", "规矩", "事项"], answer: "入庙请衣着整洁、轻声细语，殿内勿拍照喧哗，香火以三支为敬。" },
        { keys: ["祈福", "许愿", "求"], answer: "您可在【祈福服务】页面填写祈愿类型与内容，庙方将统一登记于祈愿簿。" },
        { keys: ["电话", "联系", "地址"], answer: "预约咨询电话 400-000-0000，地址：临安市槐安镇槐荫山路 1 号。" },
        { keys: ["商城", "买", "商品", "周边"], answer: "周边文创暂仅展示，支付功能建设中，敬请期待。" },
        { keys: ["历史", "来历", "介绍"], answer: "槐安庙历史悠久，具体始建年代尚有不同说法，您可在【庙宇介绍】页面查看。" }
      ],
      fallback: "您的问题我已记录，稍后由庙方工作人员为您回复。若急需帮助，可拨打预约咨询电话 400-000-0000。"
    },
    // ===== 历年还愿记录（前期正常，越往后越出现少量异常；林女士为隐藏主线） =====
    records: [
      { id:"r01", date:"2019-03-14", name:"张女士", want:"家人平安", wish:"家中老人病重，愿其转危为安。", result:"家中老人转危为安", way:"香火、供果", note:"", detail:"香客所述愿望已如愿，依约以香火、供果还愿，庙方为其登记于还愿簿。" },
      { id:"r02", date:"2019-09-02", name:"李先生", want:"事业", wish:"希望顺利换个称心的工作。", result:"顺利换工作", way:"捐香油", note:"", detail:"香客所述愿望已如愿，以捐香油还愿。" },
      { id:"r03", date:"2020-01-20", name:"王同学", want:"学业", wish:"备考研究生，愿能上岸。", result:"考研上岸", way:"供灯", note:"", detail:"香客所述愿望已如愿，以供灯还愿，并送来手写谢卡一张。" },
      { id:"r04", date:"2020-06-21", name:"陈先生", want:"求子", wish:"婚后数年未育，愿得子。", result:"次年得子", way:"供灯、香火", note:"", detail:"香客所述愿望已如愿，次年初得子，以供灯、香火还愿。" },
      { id:"r05", date:"2021-04-11", name:"赵女士", want:"婚姻", wish:"与伴侣争执冷战，愿重修于好。", result:"与伴侣和好", way:"木牌、香火", note:"", detail:"香客所述愿望已如愿，以木牌、香火还愿。" },
      { id:"r06", date:"2021-09-02", name:"王先生", want:"事业", wish:"愿年内得以升职。", result:"升职", way:"捐香油", note:"", detail:"香客所述愿望已如愿，以捐香油还愿。" },
      { id:"r07", date:"2022-02-08", name:"刘女士", want:"家人平安", wish:"家人将动大手术，愿顺利平安。", result:"家人手术顺利", way:"香火、供果", note:"", detail:"香客所述愿望已如愿，以香火、供果还愿，并捐助供品若干。" },
      { id:"r08", date:"2022-11-18", name:"林女士", want:"家人平安", wish:"（未详述）", result:"如愿", way:"传名", note:"已完成第一次还愿。", detail:"该香客以「传名」作为还愿方式，具体含义庙方未予详述。备注原文：「香客本人希望让更多有缘人知晓槐安庙。」" },
      { id:"r09", date:"2024-05-30", name:"孙先生", want:"生意", wish:"小本生意艰难，愿能好转。", result:"店铺渐有起色", way:"捐香油、木牌", note:"", detail:"香客所述愿望已如愿，以捐香油、木牌还愿。" },
      { id:"r10", date:"2024-12-12", name:"周女士", want:"健康", wish:"体弱多病，愿身体好转。", result:"身体较往年好转", way:"供灯、香火", note:"", detail:"香客所述愿望已如愿，以供灯、香火还愿。" },
      { id:"r11", date:"2025-03-15", name:"吴女士", want:"出行", wish:"远行前，愿一路平安。", result:"旅途平安", way:"香火", note:"", detail:"香客所述愿望已如愿，以香火还愿。" },
      { id:"r12", date:"2025-10-07", name:"林女士", want:"家人平安", wish:"（未详述）", result:"（未详述）", way:"传名、引荐有缘人", note:"持续更新中。", detail:"该香客多次以「传名」「引荐有缘人」方式还愿。备注原文：「希望后来人也能知道这里。」" },
      { id:"r13", date:"2026-07-09", name:"郑同学", want:"学业", wish:"愿录取理想学校。", result:"已被录取", way:"供灯", note:"", detail:"香客所述愿望已如愿，以供灯还愿，并附来录取通知截图（已存档）。" },
      { id:"r14", date:"2026-12-03", name:"林女士", want:"（未公开）", wish:"（未公开）", result:"（未公开）", way:"传名", note:"本记录最后更新日期为 2026-12-03。", detail:"本记录最后更新日期为 2026-12-03，晚于当前。详细内容暂未公开。" }
    ],
    // ===== 香客祈福故事（温和生活化为主，少量异常；林女士一条暗藏网站创建线索；部分故事措辞高度相似） =====
    stories: [
      { tag:"求学", text:"去年孩子高考前，我带他来槐安庙拜了一次。本来没抱太大希望，没想到最后真的考上了。后来特意回来还愿。", by:"一位母亲" },
      { tag:"家人平安", text:"那段时间家里出了很多事情，每天都觉得撑不下去了。后来朋友带我来了一次，事情竟然一件一件解决了。", by:"匿名香客" },
      { tag:"婚姻", text:"我和先生总是在吵架，去年冬天来这里求了一次，后来我们的关系慢慢缓和了。现在偶尔还会一起来。", by:"周姓香客" },
      { tag:"生意", text:"创业那阵子压力特别大，每个月都来上一次香。生意虽然没有大富大贵，但一直稳稳当当地，我很知足。", by:"孙先生" },
      { tag:"疾病康复", text:"外婆生病那两年，我几乎每周都来。她走的时候很安详，我心里也踏实了些。谢谢槐安庙陪我走过那段日子。", by:"吴女士" },
      { tag:"出行", text:"一个人来这座城市工作，周末常常不知道去哪。后来发现了槐安庙，就当是个能安静待一会儿的地方。", by:"匿名香客" },
      { tag:"寻人", text:"和走失多年的老同学，竟然是通过这里认识的香客重新联系上的。世界有时候很小。", by:"林女士" },
      { tag:"传名", text:"我第一次来槐安庙是很久以前的事了。后来我许下了一个很重要的愿望，愿望实现之后，我就开始想，能为这里做点什么。于是我从帮忙整理一些资料开始，一点点把网站搭了起来。", by:"林女士" },
      { tag:"", text:"愿望实现得比我想象中快。", by:"匿名香客" },
      { tag:"", text:"当时我只是随口说了一句，没想到真的应验了。", by:"匿名香客" },
      { tag:"", text:"后来我才知道，原来还愿并不是那么简单。", by:"匿名香客" },
      { tag:"", text:"如果只是想求一个愿望，我建议你想清楚之后再来。", by:"匿名香客" },
      { tag:"家人平安", text:"朋友带我来的，说来这里很灵。我本来不信，后来……有些事不好细说，但确实不一样了。", by:"匿名香客" }
    ],
    // ===== 香客评价（五星正常为主；少量异常；部分已删除/注销/无法显示，制造异常感） =====
    reviews: [
      { stars:"★★★★★", text:"环境很清静，周末带父母来拜了一次，老人家很喜欢。", by:"临安本地" },
      { stars:"★★★★★", text:"真的很灵，朋友推荐过来的。", by:"匿名" },
      { stars:"★★★★☆", text:"第一次来，找了很久，导航不是特别准确。", by:"自驾客" },
      { stars:"★★★★★", text:"去年许的愿已经实现了，今年特意回来还愿。", by:"陈先生" },
      { stars:"★★★★★", text:"庙里的人很亲切，香火也便宜，不会硬推销。", by:"常来香客" },
      { stars:"★★★★☆", text:"地方有点偏，但来了之后觉得挺值的，心静。", by:"外地游客" },
      { stars:"★☆☆☆☆", text:"别去。", by:"匿名" },
      { stars:"★★★★★", text:"灵验是真的，但有些事情还是不要问。", by:"匿名" },
      { stars:"★★★☆☆", text:"这里以前不是这样的。", by:"林女士" },
      { stars:"★★★★★", text:"", hidden:"该留言无法显示" },
      { stars:"★★★★☆", text:"", hidden:"用户已删除", status:"（账号已注销）" },
      { stars:"★★★★★", text:"香火很正，礼佛流程清楚，适合带长辈来。", by:"王女士", status:"（该用户已注销）" }
    ],
    // ===== 还愿方式（常规与「传名」等并置，初次出现均不作解释） =====
    repayWays: {
      normal: ["香火", "供果", "供灯", "木牌", "香油"],
      other: ["传名", "引荐有缘人", "留名", "广而告之"]
    },
    // ===== 关于本站（网站沿革；暗含「由香客逐步搭建」的线索，不点破） =====
    aboutText: "槐安庙线上服务平台自 2019 年起逐步上线。早期内容较为简单，仅有庙宇简介与预约入口；其后逐年增补，陆续加入神明介绍、灵验故事、香客评价、还愿记录与在线祈福等栏目。网站由管理处与多位热心香客、义工共同维护，其中尤以一位林姓香客贡献良多——她自帮忙整理资料始，参与了本站诸多早期内容的搭建。我们感谢每一位让槐安之名得以远播的有缘人。",
    todayBase: 127,
    baseVisits: 183742
  };

  /* ---------------- 钩子系统（后续剧情污染用） ---------------- */
  var hooks = {};
  function on(evt, fn) { (hooks[evt] = hooks[evt] || []).push(fn); }
  function emit(evt, payload) {
    (hooks[evt] || []).forEach(function (fn) {
      try { fn(payload || {}); } catch (e) { /* 单钩子异常不影响主流程 */ }
    });
  }

  /* ---------------- 工具函数 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n, len) { n = String(n); while (n.length < len) n = "0" + n; return n; }
  function fmtDate(d) {
    var w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
    return (d.getMonth() + 1) + "月" + d.getDate() + "日(周" + w + ")";
  }
  function todayISO(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2);
  }

  /* ---------------- 路由（hash） ---------------- */
  var routes = {
    home: "view-home",
    reserve: "view-reserve",
    repay: "view-repay",
    pray: "view-pray",
    history: "view-history",
    shop: "view-shop",
    contact: "view-contact",
    record: "view-record",
    story: "view-story",
    review: "view-review",
    about: "view-about"
  };

  function navigate() {
    var hash = location.hash.replace(/^#\/?/, "") || "home";
    var viewId = routes[hash] || "view-404";
    $all(".view").forEach(function (v) { v.classList.add("hidden"); });
    var el = document.getElementById(viewId);
    if (el) el.classList.remove("hidden");

    // 导航高亮
    $all(".nav-link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === hash);
    });

    // 记录页面访问（后续剧情可用：隐藏内容、访问次数触发等）
    if (routes[hash]) {
      store.data.pageLog.push({ route: hash, t: Date.now() });
      if (store.data.pageLog.length > 200) store.data.pageLog = store.data.pageLog.slice(-200);
      store.save();
      emit("pageView", { route: hash });
      bumpToday();
      renderTodayVisits();
    }
    window.scrollTo(0, 0);
  }

  /* ---------------- 顶部公告注入 ---------------- */
  function renderAnnouncements() {
    var track = $("#announce-track");
    if (!track) return;
    track.innerHTML = config.announcements.map(function (t) {
      return "<span>" + t + "</span>";
    }).join("");
    // 站内公告列表（带「新」标记）
    var nl = $("#notice-list");
    if (nl) {
      nl.innerHTML = config.announcements.map(function (t, i) {
        var badge = i < 2 ? '<img class="new-badge" src="assets/dec/new.gif" alt="新" />' : '';
        return "<li>" + badge + t + "</li>";
      }).join("");
    }
  }

  /* ---------------- 日期 / 时段 生成 ---------------- */
  // 以日期为种子的伪随机，保证同一天刷新结果稳定
  function seedRand(seedStr) {
    var h = 2166136261;
    for (var i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  function buildDates(containerId, onPick) {
    var box = document.getElementById(containerId);
    if (!box) return;
    box.innerHTML = "";
    var selected = null;
    for (var i = 1; i <= 14; i++) {
      var d = new Date(); d.setDate(d.getDate() + i);
      var iso = todayISO(d);
      var rnd = seedRand(iso);
      var roll = rnd();
      var status, cls, label;
      if (roll < 0.18) { status = "full"; cls = "full"; label = "已约满"; }
      else if (roll < 0.45) { status = "low"; cls = "low"; label = "余票较少"; }
      else { status = "ok"; cls = "ok"; label = "余票充足"; }

      var cell = document.createElement("div");
      cell.className = "date-cell" + (cls === "full" ? " full" : "");
      cell.innerHTML = '<div class="date-day">' + fmtDate(d) + '</div>' +
        '<div class="date-status st-' + cls + '">' + label + '</div>';
      if (cls !== "full") {
        (function (isoVal, cellEl) {
          cell.addEventListener("click", function () {
            if (selected) selected.classList.remove("selected");
            cellEl.classList.add("selected");
            selected = cellEl;
            onPick(isoVal);
          });
        })(iso, cell);
      }
      box.appendChild(cell);
    }
  }

  function buildSlots(containerId, onPick) {
    var box = document.getElementById(containerId);
    if (!box) return;
    var times = [
      { t: "08:00-10:00", left: 126 },
      { t: "10:00-12:00", left: 82 },
      { t: "12:00-14:00", left: 23 },
      { t: "14:00-16:00", left: 0 },
      { t: "16:00-18:00", left: 7 }
    ];
    box.innerHTML = "";
    var selected = null;
    times.forEach(function (s) {
      var full = s.left <= 0;
      var cell = document.createElement("div");
      cell.className = "slot-cell" + (full ? " full" : "");
      cell.innerHTML = '<div class="slot-time">' + s.t + '</div>' +
        '<div class="slot-left">' + (full ? "已约满" : "剩余 " + s.left) + '</div>';
      if (!full) {
        cell.addEventListener("click", function () {
          if (selected) selected.classList.remove("selected");
          cell.classList.add("selected");
          selected = cell;
          onPick(s.t);
        });
      }
      box.appendChild(cell);
    });
  }

  /* ---------------- 预约流程 ---------------- */
  var reserveState = { date: null, slot: null };
  function initReserve() {
    buildDates("reserve-dates", function (iso) {
      reserveState.date = iso; updateReserveSummary();
    });
    buildSlots("reserve-slots", function (t) {
      reserveState.slot = t; updateReserveSummary();
    });
    var form = $("#reserve-form");
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!reserveState.date || !reserveState.slot) {
          alert("请先选择预约日期与时段。");
          return;
        }
        var name = $("#r-name").value.trim();
        var phone = $("#r-phone").value.trim();
        var id4 = $("#r-id4").value.trim();
        var count = $("#r-count").value;
        var first = (form.querySelector('input[name=first]:checked') || {}).value || "是";
        if (!name || !/^1\d{10}$/.test(phone) || !/^[\dXx]{4}$/.test(id4)) {
          alert("请完整、正确地填写姓名、手机号与身份证后四位。");
          return;
        }
        var no = "HA" + (new Date().getFullYear()) + pad(Math.floor(Math.random() * 10000), 4);
        var rec = { no: no, name: name, phone: phone, date: reserveState.date, slot: reserveState.slot, count: count, first: first, t: Date.now() };
        store.data.reservations.push(rec);
        store.save();
        emit("reserveSubmit", rec);
        showReserveSuccess(rec);
      });
    }
  }
  function updateReserveSummary() {
    var s = $("#r-summary");
    if (s) s.textContent = (reserveState.date || "未选") + " / " + (reserveState.slot || "未选");
  }
  function showReserveSuccess(rec) {
    openModal("预约成功",
      '<p>您的参拜预约已提交，请于入庙当日出示预约编号。</p>' +
      '<div class="qr-box">' + fakeQR(rec.no) + '</div>' +
      '<div class="qr-num">预约编号：' + rec.no + '</div>' +
      '<p style="font-size:12px;color:#6a4a2a;margin-top:8px">（二维码为示意占位，正式功能建设中）</p>',
      "完成");
  }

  /* ---------------- 还愿流程 ---------------- */
  var repayState = { date: null };
  function initRepay() {
    buildDates("repay-dates", function (iso) {
      repayState.date = iso;
      var s = $("#p-summary"); if (s) s.textContent = iso;
    });
    var form = $("#repay-form");
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!repayState.date) { alert("请选择还愿日期。"); return; }
        var type = (form.querySelector('input[name=repayType]:checked') || {}).value || "其他";
        var name = $("#p-name").value.trim();
        var phone = $("#p-phone").value.trim();
        if (!name || !/^1\d{10}$/.test(phone)) { alert("请填写姓名与正确手机号。"); return; }
        var rec = { type: type, name: name, phone: phone, date: repayState.date, t: Date.now() };
        store.data.repayments.push(rec);
        store.save();
        emit("repaySubmit", rec);
        openModal("还愿预约已提交",
          "<p>您提交的「" + type + "」还愿预约已登记。</p>" +
          "<p>庙方将另行短信通知具体安排，请保持手机畅通。</p>" +
          '<p style="font-size:12px;color:#6a4a2a">预约编号：HA' + Date.now().toString().slice(-8) + "</p>",
          "完成");
      });
    }
  }

  /* ---------------- 祈福流程 ---------------- */
  function initPray() {
    var form = $("#pray-form");
    if (form && !form._bound) {
      form._bound = true;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var type = $("#y-type").value;
        var name = $("#y-name").value.trim();
        var content = $("#y-content").value.trim();
        if (!name) { alert("请填写祈愿人姓名。"); return; }
        var rec = { type: type, name: name, content: content, t: Date.now() };
        store.data.prayers.push(rec);
        store.save();
        emit("praySubmit", rec);
        // 不同祈愿类型返回不同结果（当前统一提示，后续可分支）
        openModal("祈愿已登记",
          "<p>您的祈愿已登记于槐安庙祈愿簿。</p>" +
          "<p>诚心所至，心愿自成。庙方将于初一十五代为诵念。</p>",
          "完成");
      });
    }
  }

  /* ---------------- 历史时间轴 ---------------- */
  function renderHistory() {
    var box = $("#history-timeline");
    if (!box) return;
    box.innerHTML = config.history.map(function (h) {
      return '<div class="tl-item"><div class="tl-time">' + h.time + '</div><div class="tl-text">' + h.text + '</div></div>';
    }).join("");
  }

  /* ---------------- 商城 ---------------- */
  function renderShop() {
    var box = $("#shop-grid");
    if (!box) return;
    box.innerHTML = config.shop.map(function (g) {
      return '<div class="shop-card">' +
        '<div class="shop-thumb"><img class="shop-img" src="' + g.img + '" alt="' + g.name + '" /></div>' +
        '<div class="shop-name">' + g.name + '</div>' +
        '<div class="shop-price">' + g.price + '</div>' +
        '<button class="btn btn-gold btn-sm" data-name="' + g.name + '">立即购买</button>' +
        '</div>';
    }).join("");
    $all(".shop-card button", box).forEach(function (b) {
      b.addEventListener("click", function () {
        var name = b.getAttribute("data-name");
        openModal("商品详情 · " + name,
          "<p>「" + name + "」为庙方虔心筹备之吉祥物，寓意平安顺遂。</p>" +
          "<p>支付功能建设中，暂不支持在线购买。</p>",
          "知道了");
      });
    });
  }

  /* ---------------- 历年还愿记录 ---------------- */
  function renderRecords() {
    var box = $("#record-list");
    if (!box) return;
    var head = '<tr class="record-head"><th>日期</th><th>香客</th><th>所求</th><th>还愿方式</th><th>愿望结果</th><th></th></tr>';
    box.innerHTML = head + config.records.map(function (r) {
      return '<tr class="record-row">' +
        '<td>' + r.date + '</td>' +
        '<td>' + r.name + '</td>' +
        '<td>' + r.want + '</td>' +
        '<td>' + r.way + '</td>' +
        '<td>' + r.result + '</td>' +
        '<td><a href="javascript:void(0)" class="rec-detail-link" data-id="' + r.id + '">详情»</a></td>' +
        '</tr>';
    }).join("");
    $all(".rec-detail-link", box).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("data-id");
        var rec = config.records.filter(function (x) { return x.id === id; })[0];
        if (rec) showRecordDetail(rec);
      });
    });
  }
  function showRecordDetail(rec) {
    var html = '<div class="record-detail">' +
      '<p><b>日期：</b>' + rec.date + '</p>' +
      '<p><b>香客：</b>' + rec.name + '</p>' +
      '<p><b>所求：</b>' + rec.want + '</p>' +
      '<p><b>许愿内容：</b>' + rec.wish + '</p>' +
      '<p><b>愿望结果：</b>' + rec.result + '</p>' +
      '<p><b>还愿方式：</b>' + rec.way + '</p>' +
      (rec.note ? '<p><b>备注：</b>' + rec.note + '</p>' : '') +
      '<div class="record-detail-note">' + rec.detail + '</div>' +
      '</div>';
    openModal("还愿记录 · 详情", html, "关闭");
  }

  /* ---------------- 香客祈福故事 ---------------- */
  function renderStories() {
    var box = $("#story-list");
    if (!box) return;
    box.innerHTML = config.stories.map(function (s) {
      var tag = s.tag ? '<span class="story-tag">[' + s.tag + ']</span> ' : '';
      return '<li class="story-item">' +
        '<p class="story-text">' + tag + s.text + '</p>' +
        (s.by ? '<div class="story-by">—— ' + s.by + '</div>' : '') +
        '</li>';
    }).join("");
  }

  /* ---------------- 香客评价 ---------------- */
  function renderReviews() {
    var box = $("#review-list");
    if (!box) return;
    box.innerHTML = config.reviews.map(function (r) {
      if (r.hidden) {
        return '<li class="review-item review-hidden">' +
          (r.stars ? '<span class="stars">' + r.stars + '</span> ' : '') +
          '<span class="review-hidden-text">' + r.hidden + '</span>' +
          (r.status ? ' <span class="review-status">' + r.status + '</span>' : '') +
          '</li>';
      }
      return '<li class="review-item">' +
        (r.stars ? '<span class="stars">' + r.stars + '</span> ' : '') +
        '<span class="review-text">' + r.text + '</span>' +
        (r.by ? ' <span class="review-by">—— ' + r.by + '</span>' : '') +
        (r.status ? ' <span class="review-status">' + r.status + '</span>' : '') +
        '</li>';
    }).join("");
  }

  /* ---------------- 还愿方式 ---------------- */
  function renderRepayWays() {
    var box = $("#repay-ways");
    if (!box) return;
    box.innerHTML =
      '<p class="repay-way-line"><b>常见还愿方式：</b>' + config.repayWays.normal.join("、") + '。</p>' +
      '<p class="repay-way-line"><b>另有：</b>' + config.repayWays.other.join("、") + '（依香客所愿，庙方不予强定）。</p>';
  }

  /* ---------------- 关于本站 ---------------- */
  function renderAbout() {
    var el = $("#about-text");
    if (el) el.textContent = config.aboutText;
  }

  /* ---------------- 今日访问人数（第四面墙暗示） ---------------- */
  function bumpToday() {
    var d = todayISO(new Date());
    if (store.data.todayDate !== d) { store.data.todayDate = d; store.data.todayN = 0; }
    store.data.todayN = Math.min((store.data.todayN || 0) + 1, 99);
    store.save();
  }
  function renderTodayVisits() {
    var n = store.data.todayN || 0;
    var total = config.todayBase + n;
    ["record", "story", "review"].forEach(function (k) {
      var el = document.getElementById("today-visits-" + k);
      if (!el) return;
      var s = "今日访问人数：" + total;
      if (k === "review" && n >= 3) s += "　|　今日新增香客：1";
      el.textContent = s;
    });
  }

  /* ---------------- 联系我们 / 反馈 ---------------- */
  function initContact() {
    var fb = $("#feedback-form");
    if (fb && !fb._bound) {
      fb._bound = true;
      fb.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = $("#fb-text").value.trim();
        if (!text) { alert("请填写您的意见或建议。"); return; }
        store.data.feedback.push({ name: $("#fb-name").value.trim(), text: text, t: Date.now() });
        store.save();
        emit("feedbackSubmit", { text: text });
        $("#fb-text").value = "";
        alert("感谢您的反馈，我们已收到！");
        $("#feedback-box").style.display = "none";
      });
    }
  }

  /* ---------------- 在线客服（规则型） ---------------- */
  function initCS() {
    var btn = $("#cs-button"), panel = $("#cs-panel");
    btn.addEventListener("click", function () {
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) $("#cs-input").focus();
    });
    $("#cs-close").addEventListener("click", function () { panel.classList.add("hidden"); });

    // 快捷问题
    var quick = $("#cs-quick");
    quick.innerHTML = config.cs.quickQuestions.map(function (q) {
      return '<button type="button">' + q + '</button>';
    }).join("");
    $all("button", quick).forEach(function (b) {
      b.addEventListener("click", function () { sendCS(b.textContent); });
    });

    // 自动问候
    appendCS(config.cs.greeting, "bot");

    $("#cs-send").addEventListener("click", function () {
      var inp = $("#cs-input"); var v = inp.value.trim();
      if (!v) return; sendCS(v); inp.value = "";
    });
    $("#cs-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { $("#cs-send").click(); }
    });
  }
  function appendCS(text, who) {
    var body = $("#cs-body");
    var div = document.createElement("div");
    div.className = "cs-msg " + (who === "user" ? "cs-user" : "cs-bot");
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
  function sendCS(text) {
    appendCS(text, "user");
    // 关键词匹配（后续可改为异步 / 剧情分支）
    var hit = config.cs.fallback;
    for (var i = 0; i < config.cs.replies.length; i++) {
      var r = config.cs.replies[i];
      for (var j = 0; j < r.keys.length; j++) {
        if (text.indexOf(r.keys[j]) !== -1) { hit = r.answer; break; }
      }
      if (hit !== config.cs.fallback) break;
    }
    var payload = { text: text, answer: hit };
    emit("csMessage", payload);   // 后续：异常回答 / 时间相关回答 / 隐藏关键词
    setTimeout(function () { appendCS(hit, "bot"); }, 350);
  }

  /* ---------------- 弹窗 ---------------- */
  function openModal(title, bodyHTML, btnText) {
    var root = $("#modal-root");
    root.innerHTML =
      '<div class="modal-mask"><div class="modal-box">' +
      '<div class="modal-head">' + title + '</div>' +
      '<div class="modal-body">' + bodyHTML + '</div>' +
      '<div class="modal-foot"><button class="btn btn-red" id="modal-ok">' + (btnText || "完成") + '</button></div>' +
      '</div></div>';
    $(".modal-mask").addEventListener("click", function (e) {
      if (e.target.classList.contains("modal-mask")) closeModal();
    });
    $("#modal-ok").addEventListener("click", closeModal);
  }
  function closeModal() { $("#modal-root").innerHTML = ""; }

  /* ---------------- 假二维码（占位） ---------------- */
  function fakeQR(seed) {
    var N = 21, cells = "";
    function isFinder(x, y) {
      function f(ox, oy) { return x >= ox && x < ox + 7 && y >= oy && y < oy + 7; }
      return f(0, 0) || f(N - 7, 0) || f(0, N - 7);
    }
    function finderOn(x, y) {
      function g(ox, oy) {
        var lx = x - ox, ly = y - oy;
        if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return true;
        if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) return true;
        return false;
      }
      if (x < 7 && y < 7) return g(0, 0);
      if (x >= N - 7 && y < 7) return g(N - 7, 0);
      if (x < 7 && y >= N - 7) return g(0, N - 7);
      return false;
    }
    var rnd = seedRand(seed);
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var on = isFinder(x, y) ? finderOn(x, y) : (rnd() > 0.5);
        if (on) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    }
    return '<svg viewBox="0 0 ' + N + ' ' + N + '" width="160" height="160" shape-rendering="crispEdges">' +
      '<rect width="' + N + '" height="' + N + '" fill="#fff"/><g fill="#000">' + cells + '</g></svg>';
  }

  /* ---------------- 访问计数 ---------------- */
  function renderVisitCount() {
    store.data.visits += 1;
    store.save();
    var total = config.baseVisits + store.data.visits;
    var el = $("#visit-count");
    if (el) el.textContent = pad(total, 9);
  }

  /* ---------------- URL 参数读取（后续剧情用） ---------------- */
  function readUrlParams() {
    var p = new URLSearchParams(location.search);
    if (p.get("ref")) {
      store.data.progress.referrer = p.get("ref");
      store.save();
      emit("urlParam", { ref: p.get("ref") });
    }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    renderAnnouncements();
    renderHistory();
    renderShop();
    renderRecords();
    renderStories();
    renderReviews();
    renderRepayWays();
    renderAbout();
    renderTodayVisits();
    initReserve();
    initRepay();
    initPray();
    initContact();
    initCS();
    renderVisitCount();
    readUrlParams();

    window.addEventListener("hashchange", navigate);
    navigate();

    // 对外暴露，方便后续剧情阶段接管 / 污染
    window.HUAIAN = {
      config: config,
      store: store,
      on: on,
      emit: emit,
      navigate: navigate,
      renderAnnouncements: renderAnnouncements,
      renderHistory: renderHistory,
      renderShop: renderShop,
      renderRecords: renderRecords,
      renderStories: renderStories,
      renderReviews: renderReviews,
      renderRepayWays: renderRepayWays,
      renderAbout: renderAbout,
      renderTodayVisits: renderTodayVisits
    };
    emit("boot", {});

    /* === 后续剧情污染示例（默认关闭，仅留接口） ===
       HUAIAN.on("pageView", function(p){
         // 例如：当玩家第 N 次访问历史页，注入异常文本
       });
       HUAIAN.on("csMessage", function(p){
         // 例如：特定关键词触发隐藏回答
       });
    */
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }

})();
