
(() => {
  "use strict";

  // 한국 시간 기준 오늘 날짜
  function getToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
  }

  // 날짜별로 보여 줄 미리 작성된 상소문
  // 새로운 글을 추가하려면 아래 letters 배열에 항목을 더하면 됩니다.
  const letters = [
    {
      title: "작은 실험으로 길을 찾으시오",
      gpt: `
        <h2>첫째, 질문을 작게 나누시오</h2>
        <p>큰 문제를 한 번에 해결하려 하지 마시오. 현재 상황, 원하는 결과, 지켜야 할 조건을 각각 적고 한 가지씩 검토하시오.</p>
        <h2>둘째, 답변을 검증하시오</h2>
        <p>중요한 사실은 공식 자료와 대조하고, 확인된 사실과 추측을 구분하시오. 답변이 그럴듯하다는 이유만으로 결론을 내리지 마시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>지금 해결하려는 문제를 한 문장으로 쓰고, 확인이 필요한 사실 세 가지를 적으시오.</p></div>
      `,
      business: `
        <h2>첫째, 고객의 불편부터 찾으시오</h2>
        <p>기능을 더하기 전에 이용자가 거래를 망설이는 순간을 관찰하시오. 창작자와 의뢰자가 겪는 문제는 서로 다를 수 있소.</p>
        <h2>둘째, 작은 규모로 검증하시오</h2>
        <p>서브컬처 커미션 서비스라면 실제 이용자에게 주문 조건, AI 사용 공개, 수정과 환불 절차에 관한 의견을 물으시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>창작자 또는 의뢰자 한 명에게 최근 거래에서 가장 불편했던 순간을 물어보시오.</p></div>
      `
    },
    {
      title: "기록이 쌓이면 판단이 선명해지오",
      gpt: `
        <h2>첫째, 결론의 근거를 기록하시오</h2>
        <p>좋은 답을 얻었다면 결론만 보관하지 말고 그 결론을 뒷받침하는 근거와 아직 모르는 점도 함께 적으시오.</p>
        <h2>둘째, 반대 관점을 물으시오</h2>
        <p>자신의 생각을 지지하는 이유뿐 아니라 실패할 가능성, 반례, 추가로 확인할 자료를 요청하시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>최근 내린 결정 하나를 골라 근거와 위험을 각각 세 가지씩 적으시오.</p></div>
      `,
      business: `
        <h2>첫째, 가설과 사실을 구분하시오</h2>
        <p>이용자가 어떤 기능을 원할 것이라는 생각은 아직 가설이오. 인터뷰와 실제 행동으로 확인하기 전에는 확정된 수요로 여기지 마시오.</p>
        <h2>둘째, 바꾼 이유를 남기시오</h2>
        <p>정책이나 기능을 변경할 때는 어떤 문제가 있었고 어떤 근거로 바꾸었는지 기록하시오. 기록은 이후의 운영 기준이 되오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>서비스 기획에서 아직 검증하지 않은 가설 하나를 골라 확인 방법을 정하시오.</p></div>
      `
    },
    {
      title: "모든 기능보다 중요한 한 가지",
      gpt: `
        <h2>첫째, 원하는 결과를 먼저 정하시오</h2>
        <p>도구를 사용하기 전에 무엇을 결정하거나 완성하려는지 명확히 하시오. 목적이 분명하면 불필요한 작업을 줄일 수 있소.</p>
        <h2>둘째, 결과를 단계별로 개선하시오</h2>
        <p>초안을 받고 부족한 점을 지적한 뒤 다시 수정하도록 요청하시오. 한 번의 답변을 완성본으로 여기지 마시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>오늘 끝내야 할 일 하나를 정하고, 완료 여부를 판단할 기준을 쓰시오.</p></div>
      `,
      business: `
        <h2>첫째, 핵심 고객을 좁히시오</h2>
        <p>모든 창작자와 의뢰자를 동시에 만족시키려 하지 마시오. 가장 자주 겪는 문제를 가진 집단부터 관찰하시오.</p>
        <h2>둘째, 기능의 우선순위를 정하시오</h2>
        <p>주문 조건의 명확성, 작업 진행 확인, AI 사용 공개, 분쟁 처리 중 이용자의 불편을 가장 크게 줄일 기능부터 검토하시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>현재 기획 중인 기능을 세 가지 고르고, 고객 불편을 줄이는 효과에 따라 순위를 매기시오.</p></div>
      `
    },
    {
      title: "신뢰는 구체적인 약속에서 시작되오",
      gpt: `
        <h2>첫째, 모호한 표현을 줄이시오</h2>
        <p>요청을 작성할 때 범위, 기한, 결과물 형식을 구체적으로 밝히시오. 불확실한 조건은 임의로 채우지 말고 질문하도록 하시오.</p>
        <h2>둘째, 중요한 내용은 재확인하시오</h2>
        <p>금액, 정책, 일정과 같이 결과에 큰 영향을 주는 정보는 신뢰할 수 있는 출처로 검토하시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>최근 작성한 요청에서 해석이 달라질 수 있는 표현 하나를 찾아 구체적으로 고치시오.</p></div>
      `,
      business: `
        <h2>첫째, 거래 조건을 사전에 공개하시오</h2>
        <p>작업 범위, 납기, 수정 횟수, 이용 권한, 취소와 환불 조건은 거래 전에 이해할 수 있어야 하오.</p>
        <h2>둘째, 문제가 생겼을 때의 절차를 정하시오</h2>
        <p>신고 접수, 자료 확인, 당사자 의견 청취, 결정 안내와 이의 제기 과정을 설계하시오. 기준이 명확할수록 불필요한 오해를 줄일 수 있소.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>이용자가 거래 전에 반드시 알아야 할 조건 다섯 가지를 목록으로 작성하시오.</p></div>
      `
    },
    {
      title: "불안을 확인할 질문으로 바꾸시오",
      gpt: `
        <h2>첫째, 걱정의 원인을 나누시오</h2>
        <p>막연한 불안은 행동으로 옮기기 어렵소. 실제로 확인할 수 있는 문제와 아직 알 수 없는 문제를 구분하시오.</p>
        <h2>둘째, 가장 저렴한 검증부터 하시오</h2>
        <p>큰 결정을 내리기 전에 작은 시험이나 추가 조사를 통해 위험을 줄일 방법을 찾으시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>가장 걱정되는 문제 하나를 쓰고, 오늘 확인할 수 있는 사실을 하나 찾으시오.</p></div>
      `,
      business: `
        <h2>첫째, 경쟁사의 실제 조건을 비교하시오</h2>
        <p>경쟁사가 많다는 사실만으로 사업의 가능성을 단정하지 마시오. 공식 기능 안내와 이용 조건을 비교하고, 아직 해결되지 않은 불편을 찾으시오.</p>
        <h2>둘째, 고객 반응으로 방향을 조정하시오</h2>
        <p>처음 세운 기획은 검증을 위한 출발점이오. 실제 이용자의 반응을 보고 바꿀 부분과 유지할 부분을 구분하시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>경쟁 서비스 하나를 골라 장점, 불편, 공식 자료로 확인할 항목을 각각 적으시오.</p></div>
      `
    },
    {
      title: "꾸준함은 기록과 함께 강해지오",
      gpt: `
        <h2>첫째, 완벽한 계획보다 실행 가능한 계획을 세우시오</h2>
        <p>오늘 할 수 있는 작은 행동을 정하고 끝까지 마무리하시오. 계획의 크기보다 실제로 실행했는지가 중요하오.</p>
        <h2>둘째, 하루를 돌아보시오</h2>
        <p>무엇을 했는지, 무엇을 배웠는지, 내일 무엇을 바꿀지 짧게 기록하시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>오늘 완료한 일 하나와 내일 시작할 일 하나를 기록하시오.</p></div>
      `,
      business: `
        <h2>첫째, 작은 운영 실험을 반복하시오</h2>
        <p>서비스를 한꺼번에 완성하려 하기보다 이용자 한 집단의 문제를 해결하는 작은 실험부터 진행하시오.</p>
        <h2>둘째, 결과를 다음 결정에 반영하시오</h2>
        <p>인터뷰 내용, 거래 취소 사유, 반복 문의와 같은 기록을 모아 다음 개발의 우선순위를 정하시오. 수치와 반응을 확인하기 전에 성공을 단정하지 마시오.</p>
        <div class="callout"><b>오늘의 실행 명령</b><p>다음 일주일 안에 실행할 수 있는 가장 작은 고객 검증 실험 하나를 정하시오.</p></div>
      `
    }
  ];

  const date = getToday();
  const start = new Date("2026-01-01T00:00:00+09:00");
  const current = new Date(`${date}T00:00:00+09:00`);
  const elapsed = Math.floor((current - start) / 86400000);
  const index = ((elapsed % letters.length) + letters.length) % letters.length;
  const letter = letters[index];

  const paper = document.querySelector(".paper");
  if (!paper) return;

  const ribbons = [...paper.querySelectorAll(".ribbon")];
  const firstRibbon = ribbons[0];
  const secondRibbon = ribbons[1];
  const chatRibbon = ribbons.find(el => el.textContent.includes("참모와 대화"));

  if (!firstRibbon || !secondRibbon || !chatRibbon) return;

  // 제목과 본문만 교체하고 계정/메모 기능은 건드리지 않습니다.
  firstRibbon.textContent = "첫 번째 상소 · 참모의 계책";
  secondRibbon.textContent = "두 번째 상소 · 사업과 삶의 방향";

  function replaceBetween(startNode, endNode, html) {
    let node = startNode.nextElementSibling;
    while (node && node !== endNode) {
      const next = node.nextElementSibling;
      node.remove();
      node = next;
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    endNode.parentNode.insertBefore(wrapper, endNode);
    while (wrapper.firstChild) {
      endNode.parentNode.insertBefore(wrapper.firstChild, endNode);
    }
    wrapper.remove();
  }

  replaceBetween(
    firstRibbon,
    secondRibbon,
    `<h2>${letter.title}</h2>${letter.gpt}`
  );

  replaceBetween(
    secondRibbon,
    chatRibbon,
    `<h2>${letter.title}</h2>${letter.business}`
  );

  // 상소문 기록 저장 기능에서 오늘 날짜가 한국 시간으로 처리됩니다.
  const dateLabel = document.getElementById("date");
  if (dateLabel) {
    dateLabel.textContent = `${date} · 오늘의 계책`;
  }
})();
