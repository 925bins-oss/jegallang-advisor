
(() => {
  const $ = (selector) => document.querySelector(selector);
  const cfg = window.APP_CONFIG || {};
  const supabaseLib = window.supabase;

  const paper = $(".paper");
  if (!paper) return;

  // 기존 화면 디자인을 유지하면서 계정 및 개인 기록 영역 추가
  const panel = document.createElement("section");
  panel.id = "advisorAccount";
  panel.style.cssText =
    "margin:24px 0;padding:20px;background:#ead9b8;" +
    "border:1px solid #b99b68;border-radius:6px";

  panel.innerHTML = `
    <h2 style="margin-top:0">참모실 계정과 개인 기록</h2>
    <p id="accountStatus">연결 상태를 확인하고 있습니다.</p>

    <div id="authFields">
      <label for="advisorEmail">이메일</label>
      <input id="advisorEmail" type="email" autocomplete="email"
        style="display:block;width:100%;box-sizing:border-box;padding:10px;margin:6px 0 12px">

      <label for="advisorPassword">비밀번호 (6자 이상)</label>
      <input id="advisorPassword" type="password"
        autocomplete="current-password"
        style="display:block;width:100%;box-sizing:border-box;padding:10px;margin:6px 0 12px">

      <button id="advisorSignup" type="button">가입하기</button>
      <button id="advisorLogin" type="button">로그인</button>
    </div>

    <div id="memberFields" hidden>
      <h3>나의 개인 메모</h3>
      <p>메모를 작성하고 저장하면 다음 로그인 때도 불러올 수 있습니다.</p>

      <label for="advisorNote">메모 내용</label>
      <textarea id="advisorNote" rows="5"
        placeholder="기획 아이디어, 오늘 할 일, 참모에게 기억시키고 싶은 내용을 적으세요."
        style="display:block;box-sizing:border-box;width:100%;padding:10px;margin:8px 0"></textarea>

      <button id="saveNote" type="button">메모 저장</button>

      <hr style="margin:20px 0;border:0;border-top:1px solid #b99b68">

      <h3>오늘의 상소문</h3>
      <p>현재 화면의 한마디와 조언을 날짜별로 저장합니다.</p>
      <button id="saveLetter" type="button">오늘의 상소문 기록 저장</button>

      <p id="saveStatus" aria-live="polite"></p>

      <hr style="margin:20px 0;border:0;border-top:1px solid #b99b68">

      <h3>저장된 상소문 기록</h3>
      <p>날짜를 누르면 저장된 상소문 전체 내용을 확인할 수 있습니다.</p>
      <button id="refreshHistory" type="button">기록 새로고침</button>
      <ul id="letterHistory" style="padding-left:22px"></ul>

      <section id="letterDetail"
        style="display:none;margin-top:20px;padding:18px;background:#f8eedb;border:1px solid #b99b68;border-radius:6px">
        <h3 id="detailDate"></h3>

        <h4>오늘의 한마디</h4>
        <p id="detailQuote" style="white-space:pre-wrap"></p>

        <h4>GPT 활용 조언</h4>
        <div id="detailGpt" style="white-space:pre-wrap;overflow-wrap:anywhere"></div>

        <h4>사업·생활 조언</h4>
        <div id="detailBusiness" style="white-space:pre-wrap;overflow-wrap:anywhere"></div>

        <button id="closeLetterDetail" type="button"
          style="margin-top:16px">상소문 닫기</button>
      </section>

      <hr style="margin:20px 0;border:0;border-top:1px solid #b99b68">

      <button id="advisorLogout" type="button" class="alt">로그아웃</button>
    </div>

    <p class="small">
      개인 기록은 로그인한 계정에 저장됩니다.
      AI 자동 생성은 아직 연결되지 않았으며, 이 화면은 AI API를 호출하지 않습니다.
    </p>
  `;

  paper.prepend(panel);

  const status = $("#accountStatus");
  const memberFields = $("#memberFields");
  const authFields = $("#authFields");
  const saveStatus = $("#saveStatus");

  if (
    !supabaseLib ||
    !cfg.SUPABASE_URL ||
    !cfg.SUPABASE_ANON_KEY ||
    cfg.SUPABASE_URL.includes("YOUR-")
  ) {
    status.textContent =
      "Supabase 설정을 확인해 주세요. 계정 기능은 아직 사용할 수 없습니다.";
    return;
  }

  const sb = supabaseLib.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

  let currentUser = null;
  let busy = false;

  function setStatus(message) {
    status.textContent = message;
  }

  function setSaveStatus(message) {
    saveStatus.textContent = message;
  }

  function setBusy(value) {
    busy = value;

    [
      "advisorSignup",
      "advisorLogin",
      "saveNote",
      "saveLetter",
      "advisorLogout",
      "refreshHistory"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = value;
    });
  }

  function getToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  function sectionText(ribbon) {
    if (!ribbon) return "";

    const pieces = [];
    let node = ribbon.nextElementSibling;

    while (node && !node.classList.contains("ribbon")) {
      if (node.id !== "advisorAccount") {
        pieces.push(node.innerText || node.textContent || "");
      }

      node = node.nextElementSibling;
    }

    return pieces.join("\n\n").trim();
  }

  function currentLetter() {
    const ribbons = paper.querySelectorAll(".ribbon");

    return {
      user_id: currentUser.id,
      letter_date: getToday(),
      daily_quote: $("#heroQuote")?.textContent?.trim() || "",
      gpt_advice: sectionText(ribbons[0]),
      business_advice: sectionText(ribbons[1]),
      updated_at: new Date().toISOString()
    };
  }

  // 개인 메모 불러오기
  async function loadNotes() {
    const noteField = $("#advisorNote");

    const { data, error } = await sb
      .from("advisor_notes")
      .select("note")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (error) {
      setSaveStatus("메모를 불러오지 못했습니다: " + error.message);
      return;
    }

    noteField.value = data?.note || "";
  }

  // 저장된 상소문 목록 불러오기
  async function loadHistory() {
    const list = $("#letterHistory");
    const detail = $("#letterDetail");

    list.replaceChildren();
    detail.style.display = "none";

    const { data, error } = await sb
      .from("daily_letters")
      .select("letter_date,daily_quote,gpt_advice,business_advice")
      .eq("user_id", currentUser.id)
      .order("letter_date", { ascending: false })
      .limit(30);

    if (error) {
      const item = document.createElement("li");
      item.textContent = "기록을 불러오지 못했습니다: " + error.message;
      list.append(item);
      return;
    }

    if (!data || data.length === 0) {
      const item = document.createElement("li");
      item.textContent = "아직 저장된 상소문이 없습니다.";
      list.append(item);
      return;
    }

    for (const row of data) {
      const item = document.createElement("li");
      item.style.marginBottom = "10px";

      const button = document.createElement("button");
      button.type = "button";
      button.style.cssText =
        "text-align:left;white-space:normal;max-width:100%;cursor:pointer";

      button.textContent =
        `${row.letter_date} — ${row.daily_quote || "오늘의 상소문"}`;

      button.onclick = () => {
        $("#detailDate").textContent = row.letter_date + " 상소문";

        $("#detailQuote").textContent =
          row.daily_quote || "저장된 내용이 없습니다.";

        $("#detailGpt").textContent =
          row.gpt_advice || "저장된 내용이 없습니다.";

        $("#detailBusiness").textContent =
          row.business_advice || "저장된 내용이 없습니다.";

        detail.style.display = "block";
        detail.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      };

      item.append(button);
      list.append(item);
    }
  }

  // 로그인 상태에 따라 화면 갱신
  async function refreshAccount() {
    const { data, error } = await sb.auth.getSession();

    if (error) {
      setStatus("로그인 상태 확인 실패: " + error.message);
      return;
    }

    currentUser = data.session?.user || null;
    authFields.hidden = !!currentUser;
    memberFields.hidden = !currentUser;

    if (!currentUser) {
      setStatus("로그인하면 개인 메모와 상소문을 저장하고 확인할 수 있습니다.");
      $("#advisorNote").value = "";
      $("#letterHistory").replaceChildren();
      $("#letterDetail").style.display = "none";
      setSaveStatus("");
      return;
    }

    setStatus("로그인됨: " + currentUser.email);
    await loadNotes();
    await loadHistory();
  }

  // 회원가입
  $("#advisorSignup").onclick = async () => {
    if (busy) return;

    const email = $("#advisorEmail").value.trim();
    const password = $("#advisorPassword").value;

    if (!email || password.length < 6) {
      alert("이메일을 입력하고 비밀번호를 6자 이상 설정해 주세요.");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.href.split("#")[0]
        }
      });

      if (error) throw error;

      if (data.session) {
        await refreshAccount();
        alert("가입 및 로그인이 완료되었습니다.");
      } else {
        alert("가입 요청이 접수되었습니다. 이메일 인증이 필요할 수 있습니다.");
      }
    } catch (error) {
      alert("가입 실패: " + error.message);
    } finally {
      setBusy(false);
    }
  };

  // 로그인
  $("#advisorLogin").onclick = async () => {
    if (busy) return;

    setBusy(true);

    try {
      const { error } = await sb.auth.signInWithPassword({
        email: $("#advisorEmail").value.trim(),
        password: $("#advisorPassword").value
      });

      if (error) throw error;

      await refreshAccount();
    } catch (error) {
      alert("로그인 실패: " + error.message);
    } finally {
      setBusy(false);
    }
  };

  // 로그아웃
  $("#advisorLogout").onclick = async () => {
    if (busy) return;

    setBusy(true);

    try {
      const { error } = await sb.auth.signOut();
      if (error) throw error;

      await refreshAccount();
    } catch (error) {
      alert("로그아웃 실패: " + error.message);
    } finally {
      setBusy(false);
    }
  };

  // 개인 메모 저장
  $("#saveNote").onclick = async () => {
    if (!currentUser || busy) return;

    setBusy(true);
    setSaveStatus("메모를 저장하고 있습니다.");

    try {
      const { error } = await sb.from("advisor_notes").upsert({
        user_id: currentUser.id,
        note: $("#advisorNote").value,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      setSaveStatus("메모 저장 완료");
    } catch (error) {
      setSaveStatus("메모 저장 실패: " + error.message);
    } finally {
      setBusy(false);
    }
  };

  // 오늘의 상소문 저장
  $("#saveLetter").onclick = async () => {
    if (!currentUser || busy) return;

    setBusy(true);
    setSaveStatus("오늘의 상소문을 저장하고 있습니다.");

    try {
      const { error } = await sb
        .from("daily_letters")
        .upsert(currentLetter(), {
          onConflict: "user_id,letter_date"
        });

      if (error) throw error;

      setSaveStatus("오늘의 상소문 저장 완료");
      await loadHistory();
    } catch (error) {
      setSaveStatus(
        "상소문 저장 실패: " + error.message +
        " (daily_letters의 RLS 정책과 열 이름을 확인해 주세요.)"
      );
    } finally {
      setBusy(false);
    }
  };

  // 저장 기록 새로고침
  $("#refreshHistory").onclick = async () => {
    if (!currentUser || busy) return;

    setBusy(true);

    try {
      await loadHistory();
    } finally {
      setBusy(false);
    }
  };

  // 상소문 상세 보기 닫기
  $("#closeLetterDetail").onclick = () => {
    $("#letterDetail").style.display = "none";
  };

  // 인증 변경 감지
  sb.auth.onAuthStateChange(() => {
    setTimeout(() => refreshAccount(), 0);
  });

  refreshAccount();
})();
