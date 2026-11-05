// Flashcard app — Study Mode / All Cards
// 모든 조작은 상태 변경 → (카드가 바뀌면) save → render 순서로 처리해 화면과 데이터를 한 방향으로 맞춘다.
(function () {
  'use strict';

  const STORAGE_KEY = 'flashcard-app:cards';
  const STORAGE_VERSION = 1;
  const MAX_KNOWN = 5;
  const PAGE_SIZE = 12;
  const TOAST_DURATION = 5000;

  const ERROR_MESSAGES = {
    question: 'Please enter a question.',
    answer: 'Please enter an answer.',
    category: 'Please enter a category.',
  };

  // 보기마다 필터 규칙은 같고 상태는 따로 둔다 (Study는 index·flipped, All은 visible을 쓴다)
  function createFilter() {
    return {
      categories: new Set(),
      hideMastered: false,
      order: null, // Shuffle 결과(id 배열). 필터가 바뀌면 null로 되돌린다
      index: 0,
      flipped: false,
      visible: PAGE_SIZE,
      open: false, // 카테고리 패널
    };
  }

  const state = {
    cards: [],
    view: 'study',
    filters: { study: createFilter(), all: createFilter() },
    openMenuId: null, // 열린 카드 메뉴의 카드 id
    loadFailed: false,
  };

  // ------------------------------------------
  // DOM 도우미
  // ------------------------------------------
  const find = (selector, root = document) => root.querySelector(selector);
  const findAll = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));
  const jsSelector = (name) => `[data-js="${name}"]`;
  const byJs = (name, root) => find(jsSelector(name), root);
  const scopeRoot = (scope) => find(`[data-scope="${scope}"]`);
  const byCardId = (id) => `[data-card-id="${CSS.escape(id)}"]`;

  // 같은 data-js를 가진 요소가 여러 개여도 모두 갱신한다
  function setHidden(name, hidden) {
    findAll(jsSelector(name)).forEach((element) => {
      element.hidden = hidden;
    });
  }

  function setText(name, text) {
    findAll(jsSelector(name)).forEach((element) => {
      element.textContent = String(text);
    });
  }

  /**
   * 문자열 자식은 텍스트 노드로 들어가므로 사용자 입력을 HTML로 해석하지 않는다
   * @param {*} tag         생성할 HTML 태그 이름 (예: 'div', 'button', 'span').
   * @param {*} attributes  요소에 부여할 속성(Attribute) 키-값 객체. 기본값은 빈 객체.
   * @param  {...any} children (Rest 파라미터): 3번째 인자부터 전달되는 모든 값(텍스트 문자열, 다른 자식 DOM 요소들)
   * @returns
   */
  function h(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);

    // { id: 'toast-1', class: 'c-toast' } 같은 객체를 [['id', 'toast-1'], ['class', 'c-toast']] 형태의 키-값 쌍 배열로 변환
    Object.entries(attributes).forEach(([name, value]) =>
      element.setAttribute(name, value),
    );
    element.append(...children);
    return element;
  }

  const icon = (name, size) =>
    h('img', {
      src: `./images/icon-${name}.svg`,
      alt: '',
      width: size,
      height: size,
    });

  // ------------------------------------------
  // 데이터: 불러오기·저장·숙련 상태
  // ------------------------------------------
  function isValidCard(card) {
    return (
      card !== null &&
      typeof card === 'object' &&
      ['id', 'question', 'answer', 'category'].every(
        (key) => typeof card[key] === 'string' && card[key].trim() !== '',
      ) &&
      Number.isInteger(card.knownCount) && // 소수점이나 NaN, 문자열 형태의 숫자가 아닌 순수 정수(Integer)인지 확인
      card.knownCount >= 0 &&
      card.knownCount <= MAX_KNOWN
    );
  }

  function readStoredCards() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (
        data &&
        data.version === STORAGE_VERSION &&
        Array.isArray(data.cards) &&
        data.cards.every(isValidCard)
      ) {
        return data.cards;
      }
    } catch (error) {
      // 손상된 값이거나 저장소 접근이 막힌 경우: 초기 데이터로 시작한다
    }
    return null;
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORAGE_VERSION, cards: state.cards }),
      );
    } catch (error) {
      // 저장소를 쓸 수 없으면 이번 세션의 메모리 상태로만 계속 동작한다
    }
  }

  async function loadCards() {
    const stored = readStoredCards();
    if (stored) return stored;

    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`data.json ${response.status}`);
    const data = await response.json();
    return data.flashcards.filter(isValidCard);
  }

  function getStatus(card) {
    if (card.knownCount === 0) return 'not-started';
    if (card.knownCount >= MAX_KNOWN) return 'mastered';
    return 'in-progress';
  }

  function createId() {
    return `fc-${crypto.randomUUID()}`;
  }

  // 대소문자만 다른 기존 카테고리가 있으면 그 표기를 쓴다 (수정 중인 카드 자신은 비교에서 뺀다)
  function normalizeCategory(value, excludeId) {
    const name = value.trim();
    const match = state.cards.find(
      (card) =>
        card.id !== excludeId &&
        card.category.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    return match ? match.category : name;
  }

  /**
   * 일부 속성만 업데이트(Patch)한 새 배열을 반환
   * @param {*} id    수정하려는 카드의 고유 식별자 문자열
   * @param {*} patch 변경하거나 덮어씌울 속성들을 담은 객체입니다
   * @returns
   */
  function updateCard(id, patch) {
    return state.cards.map((card) =>
      // 기존 카드의 모든 속성을 펼침 연산자(...card)로 복사한 뒤 변경할 속성(...patch)을 뒤에 덮어써서 수정된 새 객체를 생성
      card.id === id ? { ...card, ...patch } : card,
    );
  }

  /**
   * 전체 카드 목록(state.cards)에 카테고리 선택, 마스터된 카드 숨김, 사용자 지정 정렬(셔플 순서)이라는
   * 3단계 필터링 및 정렬 조건을 순차적으로 적용하여 최종 표시할 카드 목록을 계산하는 함수
   * @param {*} filter
   * @returns
   */
  function getFilteredCards(filter) {
    let cards = state.cards;
    if (filter.categories.size) {
      //사용자가 하나 이상의 카테고리를 선택했을 때)
      //.has(card.category)를 사용하여 선택된 카테고리에 속한 카드만 남긴다.
      cards = cards.filter((card) => filter.categories.has(card.category));
    }
    if (filter.hideMastered) {
      //'mastered'(다 외움)가 아닌 카드만 남긴다.
      cards = cards.filter((card) => getStatus(card) !== 'mastered');
    }
    // 카드를 무작위로 섞었거나(Shuffle) 특정 순서로 나열해야 할 때
    // filter.order(카드 ID들의 배열)를 기준으로 정렬
    if (filter.order) {
      // 섞은 뒤에 생긴 카드는 원래 목록 순서대로 끝에 붙인다
      const position = new Map(filter.order.map((id, i) => [id, i]));
      cards = cards
        .map((card, i) => ({
          card,
          rank: position.has(card.id)
            ? position.get(card.id)
            : filter.order.length + i,
        }))
        .sort((a, b) => a.rank - b.rank)
        .map(({ card }) => card);
    }
    return cards;
  }

  function getStats() {
    const stats = {
      total: state.cards.length,
      mastered: 0,
      'in-progress': 0,
      'not-started': 0,
    };
    state.cards.forEach((card) => {
      stats[getStatus(card)] += 1;
    });
    return stats;
  }

  /**
   * 전체 카드(state.cards)를 순회하여 카테고리별 카드 개수를 집계하고,
   * 이를 카테고리 이름 오름차순(가나다/알파벳 순)으로 정렬된 객체 배열로 반환하는 함수
   * @returns
   */
  function getCategories() {
    const counts = new Map();
    state.cards.forEach((card) => {
      counts.set(card.category, (counts.get(card.category) || 0) + 1);
    });

    //Map을 배열로 변환 및 객체 형태로 매핑
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 현재 학습(Study) 모드에서 사용자에게 지금 보여줄 카드 1장을 반환하는 함수
   * @returns
   */
  function getCurrentCard() {
    // 학습 모드 필터 조건(선택한 카테고리, 마스터 카드 숨김, 셔플 순서 등)이 적용된 카드 목록 조회
    const set = getFilteredCards(state.filters.study);
    // 조건에 맞는 카드가 하나도 없으면(length === 0) null을 반환
    return set.length
      ? set[Math.min(state.filters.study.index, set.length - 1)] //현재 인덱스(state.filters.study.index)가 배열의 마지막 인덱스(set.length - 1)보다 크면, 자동으로 마지막 인덱스로 보정.
      : null;
  }

  // ------------------------------------------
  // 상태 변경
  // ------------------------------------------
  function setFilter(scope, patch) {
    state.filters = {
      ...state.filters,
      [scope]: { ...state.filters[scope], ...patch },
    };
    render();
  }

  // 필터가 바뀌면 원래 순서의 처음부터 다시 본다
  function resetPosition() {
    return { order: null, index: 0, flipped: false, visible: PAGE_SIZE };
  }

  /**
   * 애플리케이션 내에서 카드 데이터가 변경(추가, 수정, 삭제, 숙련도 업데이트 등)될 때 발생하는
   * 모든 후속 처리를 한곳에서 도맡는 중앙 집중식 동기화 함수
   * @param {*} nextCards
   */
  function commitCards(nextCards) {
    // 변경 작업이 일어나기 직전에 사용자가 화면에서 보고 있던 카드(current)를 미리 기억해 둔다.
    const study = state.filters.study;
    const current = getCurrentCard();

    // 새로운 카드 배열(nextCards)을 전역 상태에 덮어씁니다.
    state.cards = nextCards;
    // 로드 실패 플래그를 정상(false)으로 초기화
    state.loadFailed = false;
    // 브라우저 스토리지(LocalStorage 등)에 최신 데이터를 즉시 영구 저장
    save();

    // 카드가 삭제되거나 수정되어 특정 카테고리가 완전히 사라졌는데,
    // 필터에는 여전히 그 카테고리가 체크되어 있어 빈 화면이 노출되는 현상을 방지
    // 카드가 하나도 남지 않은 카테고리는 선택에서 뺀다
    const names = new Set(nextCards.map((card) => card.category));
    Object.values(state.filters).forEach((filter) => {
      filter.categories = new Set(
        [...filter.categories].filter((name) => names.has(name)),
      );
    });

    // 보던 카드가 남아 있으면 그 카드를, 아니면 같은 위치의 다음 카드(마지막이면 첫 카드)를 보여 준다
    // -1 : 보던 카드가 사라진 경우
    const set = getFilteredCards(study);
    const position = current
      ? set.findIndex((card) => card.id === current.id)
      : -1;
    if (position >= 0) {
      study.index = position;
    } else {
      if (study.index >= set.length) study.index = 0;
      // 새로운 카드를 보여주게 되므로 카드의 뒤집힘 상태를 앞면(study.flipped = false)으로 초기화
      study.flipped = false;
    }
    render();
  }

  /**
   * 웹 접근성(A11y, Accessibility)을 지원하기 위해 스크린 리더(화면 낭독기)에 실시간 변경 사항을 음성으로
   * 전달하는 라이브 영역(ARIA Live Region) 제어 함수
   * @param {*} message
   */
  function announce(message) {
    // 같은 문구가 반복돼도 읽히도록 비운 뒤 다시 채운다
    setText('live-region', '');
    window.setTimeout(() => setText('live-region', message), 50);
  }

  // 배열 요소를 무작위로 뒤섞는 표준 알고리즘인 피셔-예이츠 셔플(Fisher-Yates Shuffle)을 구현
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // ------------------------------------------
  // 렌더링
  // ------------------------------------------
  function render() {
    renderView();
    renderFilter('study');
    renderFilter('all');
    renderStudy();
    renderAllCards();
    renderStats();
  }

  /**
   * 현재 애플리케이션의 화면 모드(state.view)에 따라 상단 탭(토글 버튼)의 활성화 스타일과 웹 접근성 속성을 갱신하고,
   * 해당 뷰 컨테이너만 노출(나머지는 숨김)하는 뷰 전환 렌더링 함수
   */
  function renderView() {
    findAll('.c-view-toggle__button').forEach((button) => {
      const current = button.dataset.view === state.view;
      button.classList.toggle('is-current', current);
      // 토글 버튼이 현재 눌려있는 상태인지 스크린 리더에 알려주는 WAI-ARIA 접근성 표준 속성
      button.setAttribute('aria-pressed', String(current));
    });
    find('#study-view').hidden = state.view !== 'study';
    find('#all-cards-view').hidden = state.view !== 'all';
  }

  const categorySignatures = { study: '', all: '' };

  /**
   * 지정된 화면 영역(scope)의 카테고리 필터 UI를 렌더링하고 동기화하는 함수
   * @param {*} scope
   */
  function renderFilter(scope) {
    const filter = state.filters[scope];
    const root = scopeRoot(scope);
    const list = byJs('category-list', root);
    // 1. 시그니처(Signature)를 활용한 선택적 렌더링
    const categories = getCategories();
    const signature = JSON.stringify(categories);

    // 목록 구성이 바뀔 때만 다시 만들어 체크박스 포커스를 잃지 않게 한다
    if (signature !== categorySignatures[scope]) {
      categorySignatures[scope] = signature;
      list.replaceChildren(
        ...categories.map(({ name, count }) =>
          // 2. h() 함수를 이용한 카테고리 목록 DOM 빌드
          h(
            'li',
            { class: 'c-category-filter__item' },
            h(
              'label',
              { class: 'c-checkbox c-category-filter__option' },
              h('input', {
                class: 'c-checkbox__input',
                type: 'checkbox',
                'data-action': 'toggle-category',
                value: name,
              }),
              h(
                'span',
                {},
                `${name} `,
                h('span', { class: 'c-category-filter__count' }, `(${count})`),
              ),
            ),
          ),
        ),
      );
    }

    // 3. 체크박스 선택 상태 동기화
    findAll('input', list).forEach((input) => {
      input.checked = filter.categories.has(input.value);
    });
    // 4. 아코디언/패널 열림 및 옵션 상태 제어
    find('[data-action="toggle-categories"]', root).setAttribute(
      'aria-expanded',
      String(filter.open),
    );
    byJs('category-panel', root).hidden = !filter.open;
    find('[data-action="toggle-hide-mastered"]', root).checked =
      filter.hideMastered;
  }

  /**
   * 카드의 숙련도 상태에 따라 '완료 뱃지(Mastered Badge)' 또는 '진행률 프로그레스 바(Progress Bar)'
   * DOM 요소를 생성해 반환하는 렌더링 헬퍼 함수
   * @param {*} card
   * @returns
   */
  function renderStatus(card) {
    //1. 카드를 완전히 마스터했을 때
    if (getStatus(card) === 'mastered') {
      return h(
        'span',
        { class: 'c-mastered-badge' },
        // 아이콘 헬퍼 icon('mastered', 16)로 16px 크기의 완료 체크/트로피 아이콘을 넣습니다.
        icon('mastered', 16),
        h('span', {}, 'Mastered'),
        //텍스트 라벨 'Mastered'와 만점 수치(예: 5/5)를 포함한 뱃지 컴포넌트(.c-mastered-badge) 요소를 반환
        h('span', {}, `${MAX_KNOWN}/${MAX_KNOWN}`),
      );
    }
    //2. 아직 학습 중일 때 (진행률 게이지 표시)
    return h(
      'span',
      { class: 'c-progress' },
      h(
        'span',
        { class: 'c-progress__track', 'aria-hidden': 'true' },
        h('span', {
          class: `c-progress__bar c-progress__bar--${card.knownCount}`,
        }),
      ),
      h(
        'span',
        {},
        h('span', { class: 'u-sr-only' }, 'Progress: '),
        `${card.knownCount}/${MAX_KNOWN}`,
      ),
    );
  }

  /**
   * 학습(Study) 화면 전체의 예외 상태 분기 처리(에러·빈 화면),
   * 현재 카드 텍스트 갱신, 카드 뒤집힘(3D 플립) 상태 제어,
   * 그리고 버튼 비활성화 및 웹 접근성(A11y) 동기화를 담당하는 핵심 렌더링 함수
   * @returns
   */
  function renderStudy() {
    //카드를 보여주기 전에 4가지 UI 상태 중 하나만 화면에 띄우도록 상호 배타적으로 처리
    const study = state.filters.study;
    const set = getFilteredCards(study);
    const noCards = !state.loadFailed && state.cards.length === 0;          // 에러 없이 전체 등록된 카드가 0장
    const caughtUp = !state.loadFailed && !noCards && set.length === 0;     // 로컬 스토리지 등에서 불러오기 실패

    setHidden('load-error', !state.loadFailed);
    setHidden('empty-no-cards', !noCards);
    setHidden('empty-caught-up', !caughtUp);
    setHidden('study-content', set.length === 0);

    //카드를 렌더링할 수 없으므로 return으로 즉시 함수를 빠져나옵니다(Early Return)
    if (!set.length) return;

    //Math.min으로 안전하게 현재 카드를 가져옵니다
    study.index = Math.min(study.index, set.length - 1);
    const card = set[study.index];
    const mastered = getStatus(card) === 'mastered';

    //카테고리, 질문, 답변 텍스트를 각각 채워 넣습니다.
    setText('card-category', card.category);
    setText('card-question', card.question);
    setText('card-answer', card.answer);
    findAll(jsSelector('card-status')).forEach((element) => {
      //renderStatus(card)를 호출해 프로그레스 바 또는 마스터 뱃지 요소를 삽입합니다.
      element.replaceChildren(renderStatus(card));
    });
    setText('card-counter', `Card ${study.index + 1} of ${set.length}`);

    findAll(jsSelector('flashcard')).forEach((element) => {
      // CSS 3D 회전 애니메이션(transform: rotateY(...))을 발동
      element.classList.toggle('is-flipped', study.flipped);
      // 카드가 버튼 형태로 눌려 뒤집힌 상태인지를 보조 공학 기기에 알린다
      element.setAttribute('aria-pressed', String(study.flipped));
    });
    findAll('.c-flashcard__face--front').forEach((face) => {
      //카드가 앞면(study.flipped === false)일 때:
      //뒷면(--back)에 aria-hidden="true"를 걸어 정답이 미리 음성으로 읽히지 않게 숨깁니다.
      face.setAttribute('aria-hidden', String(study.flipped));
    });
    findAll('.c-flashcard__face--back').forEach((face) => {
      //카드가 뒷면(study.flipped === true)으로 뒤집히면:
      //앞면(--front)에 aria-hidden="true"를 걸어 화면 낭독기가 정답 면에만 집중하도록 만듭니다.
      face.setAttribute('aria-hidden', String(!study.flipped));
    });

    //카드가 이미 마스터(mastered === true)된 상태라면:
    findAll('[data-action="know"]').forEach((button) => {
      //.is-disabled 클래스를 추가해 반투명 및 금지 커서를 적용
      button.classList.toggle('is-disabled', mastered);
      //aria-disabled="true"를 붙여 스크린 리더에도 비활성화 버튼임을 전달
      button.setAttribute('aria-disabled', String(mastered));
    });
    //아직 학습 중이라면 'I Know This'로 표기하여 정상 작동 상태로 둔다
    setText('know-label', mastered ? 'Already Mastered' : 'I Know This');
  }

  /**
   * 전체 카드 목록 화면(state.view === 'all')의 격자(Grid) 뷰에서 개별 카드 1장을 DOM 트리로 조립하여
   * 반환하는 컴포넌트 렌더링 함수
   * <li class="c-card-grid__item l-card-grid__item">
    <article class="c-grid-card l-grid-card" aria-labelledby="grid-card-0-title">
      <h3 class="c-grid-card__question" id="grid-card-0-title">질문 내용</h3>

      <div class="c-grid-card__answer l-grid-card__answer">
        <p class="c-grid-card__answer-label">Answer:</p>
        <p>정답 내용</p>
      </div>

      <div class="c-grid-card__footer l-grid-card__footer">
        <div class="c-grid-card__tag l-grid-card__tag">
          <span class="c-tag">JavaScript</span>
        </div>
        <div class="c-grid-card__status l-grid-card__status">
          <!-- renderStatus(card)가 만든 진행률 바 -->
        </div>
        <div class="c-card-menu l-card-menu" data-js="card-menu">
          <button type="button" aria-expanded="false" aria-controls="grid-card-0-menu" aria-label="Actions for: 질문 내용" data-card-id="fc-1">
            <!-- 메뉴 아이콘 -->
          </button>
          <ul id="grid-card-0-menu" hidden>
            <li><button data-action="edit-card" data-card-id="fc-1">Edit</button></li>
            <li><button data-action="delete-card" data-card-id="fc-1">Delete</button></li>
          </ul>
        </div>
      </div>
    </article>
  </li>
   * @param {*} card
   * @param {*} i
   * @returns
   */
  function renderGridCard(card, i) {
    //고유 ID 생성 (접근성 라벨 매핑용)
    const titleId = `grid-card-${i}-title`;
    const menuId = `grid-card-${i}-menu`;


    return h(
      'li',
      { class: 'c-card-grid__item l-card-grid__item' },
      h(//시맨틱 마크업 및 제목 연결
        'article',
        { class: 'c-grid-card l-grid-card', 'aria-labelledby': titleId },
        h('h3', { class: 'c-grid-card__question', id: titleId }, card.question),
        h(
          'div',//질문/답변 및 푸터 메타데이터 구성
          { class: 'c-grid-card__answer l-grid-card__answer' },
          h('p', { class: 'c-grid-card__answer-label' }, 'Answer:'),
          h('p', {}, card.answer),
        ),
        h(
          'div',
          { class: 'c-grid-card__footer l-grid-card__footer' },
          h(
            'div',
            { class: 'c-grid-card__tag l-grid-card__tag' },
            h('span', { class: 'c-tag' }, card.category),
          ),
          h(
            'div',
            { class: 'c-grid-card__status l-grid-card__status' },
            renderStatus(card),
          ),
          h(//카드 액션 메뉴(드롭다운)와 접근성 연동
            'div',
            { class: 'c-card-menu l-card-menu', 'data-js': 'card-menu' },
            h(
              'button',
              {
                class: 'c-card-menu__toggle',
                type: 'button',
                'data-action': 'toggle-card-menu',
                'data-card-id': card.id,
                'aria-expanded': 'false',
                'aria-controls': menuId,
                'aria-label': `Actions for: ${card.question}`,
              },
              icon('menu', 24),
            ),
            h(//메뉴 목록과 액션 버튼 (Edit / Delete)
              'ul',
              {
                class: 'c-card-menu__list l-card-menu__list',
                role: 'list',
                id: menuId,
                hidden: '',
              },
              h(
                'li',
                {},
                h(
                  'button',
                  {
                    class: 'c-card-menu__item',
                    type: 'button',
                    'data-action': 'edit-card',
                    'data-card-id': card.id,
                  },
                  icon('edit', 16),
                  'Edit',
                ),
              ),
              h(
                'li',
                {},
                h(
                  'button',
                  {
                    class: 'c-card-menu__item',
                    type: 'button',
                    'data-action': 'delete-card',
                    'data-card-id': card.id,
                  },
                  icon('delete', 16),
                  'Delete',
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  let gridSignature = '';

  /**
   * 전체 카드 보기(all)' 뷰의 렌더링 함수
   */
  function renderAllCards() {
    // all 보기의 필터로 목록을 추린다. 전체 카드 유무와 필터 결과 유무는 따로 판단한다.
    const filter = state.filters.all;
    const list = getFilteredCards(filter);
    const hasCards = state.cards.length > 0;
    const grid = byJs('card-grid');

    // setHidden의 두 번째 인자가 true이면 숨긴다. 오류·빈 목록·더 보기 버튼을 상태에 맞춘다.
    setHidden('all-load-error', !state.loadFailed);
    setHidden('all-toolbar', !hasCards);
    setHidden('all-empty-no-cards', state.loadFailed || hasCards);
    setHidden('all-empty-caught-up', !hasCards || list.length > 0);
    setHidden('pagination', list.length <= filter.visible);

    grid.hidden = list.length === 0;

    // 보이는 카드 내용이 바뀔 때만 다시 그린다. 메뉴를 여닫을 때 버튼이 교체되면 클릭·포커스가 끊긴다
    const visibleCards = list.slice(0, filter.visible);
    // slice는 원본을 바꾸지 않고 표시할 개수만 가져온다.
    // JSON 문자열을 이전 값과 비교하면 카드 내용이나 순서가 달라졌는지 알 수 있다.
    const signature = JSON.stringify(visibleCards);
    if (signature !== gridSignature) {
      gridSignature = signature;

      // 다시 그리기 전에 그리드 안의 포커스 위치를 기억했다가 되돌린다
      const active = document.activeElement;
      const focused = grid.contains(active)
        ? {
            id: active.getAttribute('data-card-id'),
            action: active.getAttribute('data-action'),
          }
        : null;

      // map으로 카드마다 DOM 요소를 만들고, ...로 펼쳐 그리드의 자식으로 한꺼번에 넣는다.
      grid.replaceChildren(...visibleCards.map(renderGridCard));

      if (focused && focused.id) {
        find(
          `${byCardId(focused.id)}[data-action="${focused.action}"]`,
          grid,
        )?.focus();
      }
    }

    // 열린 메뉴의 카드 ID와 일치하는 버튼만 펼침 상태로 표시한다.
    // aria-expanded는 보조 기술에 상태를 알리고, hidden은 실제 메뉴 표시를 제어한다.
    findAll('[data-action="toggle-card-menu"]', grid).forEach((button) => {
      const open = button.getAttribute('data-card-id') === state.openMenuId;
      button.setAttribute('aria-expanded', String(open));
      document.getElementById(button.getAttribute('aria-controls')).hidden =
        !open;
    });
  }

  /**
   * 전체 플래시카드의 학습 통계 데이터(전체 카드 수, 마스터한 카드, 학습 중인 카드, 아직 시작하지 않은 카드)를
   * 계산하여 화면의 각 통계 숫자 영역에 텍스트로 주입하는 렌더링 함수
   */
  function renderStats() {
    const stats = getStats();
    setText('stat-total', stats.total);
    setText('stat-mastered', stats.mastered);
    setText('stat-in-progress', stats['in-progress']);
    setText('stat-not-started', stats['not-started']);
  }

  // ------------------------------------------
  // 폼 검증 (생성 폼·수정 대화상자 공용)
  // ------------------------------------------
  // 한 번이라도 제출을 시도한 폼. 이후 입력마다 해당 필드를 다시 검사한다
  const submittedForms = new WeakSet();

  // name 속성으로 입력란을 찾는다. form 안에서만 검색하므로 생성·수정 폼을 구분할 수 있다.
  const fieldOf = (form, field) => find(`[name="${field}"]`, form);

  // 입력값을 객체로 모은다. 여기서는 읽기만 하고, 공백 정리와 저장은 제출할 때 처리한다.
  function readForm(form) {
    return {
      question: fieldOf(form, 'question').value,
      answer: fieldOf(form, 'answer').value,
      category: fieldOf(form, 'category').value,
    };
  }

  // trim()으로 양끝 공백을 제거했을 때 비어 있으면 해당 필드의 오류 문구를 기록한다.
  // 반환 객체가 비어 있으면 모든 필수 입력값이 채워진 상태다.
  function validateCard(values) {
    const errors = {};
    Object.keys(ERROR_MESSAGES).forEach((field) => {
      if (!values[field].trim()) errors[field] = ERROR_MESSAGES[field];
    });
    return errors;
  }

  // 화면의 오류 문구와 입력란의 접근성 속성을 함께 갱신한다.
  function showFieldError(form, field, message) {
    const control = fieldOf(form, field);
    const error = find(`[data-error-for="${field}"]`, form);
    error.hidden = !message;
    findAll(jsSelector('error-text'), error).forEach((text) => {
      text.textContent = message || '';
    });
    if (message) {
      // 잘못된 입력임을 알리고, 오류 문구의 ID를 연결해 입력란과 함께 읽을 수 있게 한다.
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', error.id);
    } else {
      control.removeAttribute('aria-invalid');
      control.removeAttribute('aria-describedby');
    }
  }

  // 오류를 모두 표시하고 첫 오류 필드로 포커스를 옮긴다. 유효하면 true
  function checkForm(form) {
    const errors = validateCard(readForm(form));
    Object.keys(ERROR_MESSAGES).forEach((field) =>
      showFieldError(form, field, errors[field]),
    );
    submittedForms.add(form);

    // find는 조건을 만족하는 첫 필드 이름을 반환한다. 없으면 undefined이므로 !first는 true다.
    const first = Object.keys(ERROR_MESSAGES).find((field) => errors[field]);
    if (first) fieldOf(form, first).focus();
    return !first;
  }

  // 입력값뿐 아니라 제출 이력과 오류 표시도 지워, 다음 사용을 처음 상태에서 시작한다.
  function resetForm(form) {
    form.reset();
    submittedForms.delete(form);
    Object.keys(ERROR_MESSAGES).forEach((field) =>
      showFieldError(form, field, null),
    );
  }

  // ------------------------------------------
  // 대화상자
  // ------------------------------------------
  const dialog = {
    cardId: null,
    returnFocus: null, // 닫힌 뒤 포커스를 줄 요소를 고르는 함수. 없으면 메뉴 버튼
  };

  // 화면을 다시 그리면 기존 버튼이 사라질 수 있으므로, 카드 ID로 현재 버튼을 다시 찾는다.
  function menuButton(id) {
    if (id === null) return null;
    return find(
      `${byCardId(id)}[data-action="toggle-card-menu"]`,
      byJs('card-grid'),
    );
  }

  // name은 edit 또는 delete다. 대상 카드를 기억하고 해당 대화상자를 연다.
  function openDialog(name, cardId) {
    const card = state.cards.find((item) => item.id === cardId);
    if (!card) return;

    dialog.cardId = cardId;
    dialog.returnFocus = null;
    state.openMenuId = null;
    render();

    const element = document.getElementById(`${name}-dialog`);
    if (name === 'edit') {
      // 이전 오류와 입력을 초기화한 뒤, 수정할 카드의 값으로 폼을 채운다.
      const form = byJs('card-form', element);
      resetForm(form);
      fieldOf(form, 'question').value = card.question;
      fieldOf(form, 'answer').value = card.answer;
      fieldOf(form, 'category').value = card.category;
    }
    // 기본 dialog API로 모달을 열고, 수정은 질문 입력란에, 삭제는 취소 버튼에 포커스를 준다.
    element.showModal();
    find(
      name === 'edit' ? '[name="question"]' : '[data-action="close-dialog"]',
      element,
    )?.focus();
  }

  // returnFocus는 닫힌 후 실행할 선택적 함수다. 실제 포커스 복원은 close 이벤트에서 처리한다.
  function closeDialog(element, returnFocus) {
    dialog.returnFocus = returnFocus || null;
    element.close();
  }

  // 삭제한 카드 자리에 온 다음 카드 → 이전 카드 → 빈 상태 제목 순서로 포커스를 준다
  function focusAfterDelete(index) {
    const buttons = findAll(
      '[data-action="toggle-card-menu"]',
      byJs('card-grid'),
    );
    if (buttons.length) {
      buttons.at(Math.min(index, buttons.length - 1)).focus();
    } else {
      find(
        '#all-cards-view .c-empty-state:not([hidden]) [tabindex="-1"]',
      )?.focus();
    }
  }

  // ------------------------------------------
  // 토스트
  // ------------------------------------------
  // timer는 예약된 자동 닫힘의 ID다. 나머지 값은 사용자가 알림을 살펴보는 중인지 나타낸다.
  const toast = { timer: null, hovered: false, focused: false };

  // 기존 예약을 취소한 뒤 새로 예약해, 이전 타이머가 새 알림을 일찍 닫지 않도록 한다.
  function startToastTimer() {
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(hideToast, TOAST_DURATION);
  }

  // 토스트는 생성·수정·삭제 결과를 잠시 보여 주는 알림이다.
  function showToast(message) {
    setText('toast-message', message);
    byJs('toast').hidden = false;
    // 토스트 자체는 live 영역이 아니다. 안내는 공용 live 영역 한 곳에서만 한다
    announce(message);
    if (!toast.hovered && !toast.focused) startToastTimer();
  }

  // 자동 닫힘 예약과 사용자 상호작용 상태를 정리하고 알림을 숨긴다.
  function hideToast() {
    window.clearTimeout(toast.timer);
    const element = byJs('toast');
    const hadFocus = element.contains(document.activeElement);
    element.hidden = true;
    toast.hovered = false;
    toast.focused = false;
    // 닫기 버튼에 있던 포커스가 사라지지 않도록 현재 보기 제목으로 옮긴다
    if (hadFocus)
      find(
        state.view === 'all' ? '#all-cards-title' : '#study-view-title',
      )?.focus();
  }

  // ------------------------------------------
  // 이벤트 (위임: 다시 그린 요소에도 그대로 동작)
  // ------------------------------------------
  // closest는 자신부터 부모 방향으로 찾는다. data-scope가 study인지 all인지 알아낸다.
  // ?.는 일치하는 요소가 없을 때 오류 대신 undefined를 반환하게 한다.
  const scopeOf = (element) => element.closest('[data-scope]')?.dataset.scope;

  // HTML의 data-action 값과 실행 함수를 연결한 객체다.
  // 예: data-action="flip"을 클릭하면 아래의 actions.flip()을 실행한다.
  const actions = {
    // 보기 전환 시 열려 있던 필터와 카드 메뉴를 닫고 선택한 화면을 그린다.
    'show-view'(button) {
      const view = button.dataset.view;
      state.filters.study.open = false;
      state.filters.all.open = false;
      state.openMenuId = null;
      state.view = view;
      render();
      // 누른 버튼이 숨은 영역에 있었다면 보기 전환 버튼으로 포커스를 옮긴다
      if (button.closest('[hidden]')) {
        find(`.c-view-toggle__button[data-view="${view}"]`)?.focus();
      }
    },

    // 현재 카드의 앞면·뒷면을 전환한다. 카드가 없으면 return으로 실행을 끝낸다.
    flip() {
      const card = getCurrentCard();
      if (!card) return;
      // !는 true와 false를 뒤집는다. setFilter가 상태를 갱신하고 화면을 다시 그린다.
      setFilter('study', { flipped: !state.filters.study.flipped });
      announce(
        state.filters.study.flipped
          ? `Answer: ${card.answer}`
          : `Question: ${card.question}`,
      );
    },

    // 정답을 안다고 표시하면 학습 횟수를 1 올린다. 이미 마스터한 카드는 더 올리지 않는다.
    know() {
      const card = getCurrentCard();
      if (!card || getStatus(card) === 'mastered') return;
      const knownCount = card.knownCount + 1;
      commitCards(updateCard(card.id, { knownCount }));
      announce(
        knownCount === MAX_KNOWN
          ? 'Card mastered.'
          : `Progress: ${knownCount} of ${MAX_KNOWN}.`,
      );
    },

    // 현재 카드의 학습 횟수만 0으로 되돌린다.
    reset() {
      const card = getCurrentCard();
      if (!card) return;
      commitCards(updateCard(card.id, { knownCount: 0 }));
      announce('Progress reset.');
    },

    // 이동 규칙은 move에 모으고, 이전은 -1, 다음은 1을 전달한다.
    prev() {
      move(-1);
    },

    next() {
      move(1);
    },

    // 버튼이 속한 보기의 필터 결과를 섞고, 첫 카드부터 다시 보여 준다.
    shuffle(button) {
      const scope = scopeOf(button);
      const set = getFilteredCards(state.filters[scope]);
      if (!set.length) return;
      setFilter(scope, {
        ...resetPosition(),
        // 이 shuffle은 위에 선언한 배열 처리 함수다. 카드 데이터 대신 ID 순서를 저장한다.
        order: shuffle(set.map((card) => card.id)),
      });
      announce(
        scope === 'study'
          ? `Cards shuffled. Card 1 of ${set.length}.`
          : 'Cards shuffled.',
      );
    },

    // 해당 보기의 카테고리 패널 열림 상태를 반대로 바꾼다.
    'toggle-categories'(button) {
      const scope = scopeOf(button);
      setFilter(scope, { open: !state.filters[scope].open });
    },

    // 같은 메뉴를 누르면 닫고(null), 다른 카드의 메뉴를 누르면 그 카드 ID로 교체한다.
    'toggle-card-menu'(button) {
      const id = button.getAttribute('data-card-id');
      state.openMenuId = state.openMenuId === id ? null : id;
      render();
    },

    // 클릭한 버튼의 data-card-id로 수정·삭제 대상 카드를 지정한다.
    'edit-card'(button) {
      openDialog('edit', button.getAttribute('data-card-id'));
    },

    'delete-card'(button) {
      openDialog('delete', button.getAttribute('data-card-id'));
    },

    // 삭제 전 위치를 기억해, 삭제 후 가까운 카드로 키보드 포커스를 옮길 수 있게 한다.
    'confirm-delete'(button) {
      const id = dialog.cardId;
      const index = getFilteredCards(state.filters.all).findIndex(
        (card) => card.id === id,
      );
      closeDialog(button.closest('dialog'), () => focusAfterDelete(index));
      // filter는 삭제 대상 ID를 제외한 새 배열을 만든다. commitCards가 저장과 렌더링을 처리한다.
      commitCards(state.cards.filter((card) => card.id !== id));
      showToast('Card deleted.');
    },

    // 버튼을 포함하는 dialog를 찾아 닫는다.
    'close-dialog'(button) {
      closeDialog(button.closest('dialog'));
    },

    // 표시 개수를 한 페이지만큼 늘리고, 새로 나타난 첫 카드의 메뉴 버튼으로 포커스를 옮긴다.
    'load-more'() {
      const filter = state.filters.all;
      const first = filter.visible;
      setFilter('all', { visible: filter.visible + PAGE_SIZE });
      findAll('[data-action="toggle-card-menu"]', byJs('card-grid'))[
        first
      ]?.focus();
    },

    // 알림의 닫기 버튼도 자동 닫힘과 같은 정리 함수를 사용한다.
    'dismiss-toast'() {
      hideToast();
    },
  };

  // 필터로 추린 학습 목록 안에서 이동한다. 끝을 넘으면 반대쪽 끝으로 순환한다.
  function move(step) {
    const study = state.filters.study;
    const set = getFilteredCards(study);
    if (!set.length) return;
    // %는 나머지 연산이다. 길이를 먼저 더해 첫 카드에서 이전으로 가도 음수가 되지 않게 한다.
    const index = (study.index + step + set.length) % set.length;
    // 다른 카드는 항상 질문이 있는 앞면부터 보여 준다.
    setFilter('study', { index, flipped: false });
    announce(`Card ${index + 1} of ${set.length}: ${set[index].question}`);
  }

  // 생성 폼과 수정 폼의 공통 제출 처리다. 검증에 실패하면 저장하지 않는다.
  function submitCard(form) {
    if (!checkForm(form)) return;
    const values = readForm(form);

    if (form.dataset.form === 'create') {
      // 새 카드는 고유 ID와 학습 횟수 0으로 시작한다. 문자열 양끝 공백도 정리한다.
      const card = {
        id: createId(),
        question: values.question.trim(),
        answer: values.answer.trim(),
        category: normalizeCategory(values.category),
        knownCount: 0,
      };
      // ...state.cards로 기존 카드를 펼치고, 마지막에 새 카드를 추가한 배열을 만든다.
      commitCards([...state.cards, card]);
      resetForm(form);
      showToast('Card created successfully.');
      return;
    }

    // 생성 분기에서 return했으므로 여기부터는 기존 카드 수정이다.
    const id = dialog.cardId;
    closeDialog(form.closest('dialog'));
    commitCards(
      updateCard(id, {
        question: values.question.trim(),
        answer: values.answer.trim(),
        category: normalizeCategory(values.category, id),
      }),
    );
    // 포커스는 대화상자의 close 이벤트에서 이 카드의 메뉴 버튼으로 돌려준다
    showToast('Card updated successfully.');
  }

  // 가장 위에 열린 것 하나만 닫는다: 카드 메뉴 → 카테고리 패널 (대화상자의 Escape는 브라우저가 처리)
  function closeMenu({ restoreFocus }) {
    const id = state.openMenuId;
    if (id === null) return false;
    state.openMenuId = null;
    render();
    if (restoreFocus) menuButton(id)?.focus();
    return true;
  }

  // 패널이 열려 있을 때만 닫는다. 반환값으로 실제 닫힌 항목이 있는지 호출자에게 알린다.
  function closeCategories(scope, { restoreFocus }) {
    if (!state.filters[scope].open) return false;
    setFilter(scope, { open: false });
    if (restoreFocus)
      find('[data-action="toggle-categories"]', scopeRoot(scope))?.focus();
    return true;
  }

  // 이벤트 대상이 DOM 요소일 때만 반환해 closest나 matches를 안전하게 호출한다.
  const elementTarget = (event) =>
    event.target instanceof Element ? event.target : null;

  // document에서 자식의 이벤트를 받는 '이벤트 위임' 방식이다.
  // 카드 DOM을 새로 만들어도 각 버튼에 이벤트를 다시 등록할 필요가 없다.
  function bindEvents() {
    // 실행 동작을 먼저 처리한 뒤, 아래의 바깥 클릭 처리가 열림 상태를 정리한다
    document.addEventListener('click', (event) => {
      // 버튼 안의 아이콘을 클릭해도 closest로 data-action을 가진 부모 버튼을 찾는다.
      const button = elementTarget(event)?.closest('[data-action]');
      const action = button && actions[button.dataset.action];
      if (action) action(button);
    });

    // 체크박스의 선택이 바뀌면 해당 보기의 필터에 반영한다.
    document.addEventListener('change', (event) => {
      const input = elementTarget(event);
      if (!input) return;

      if (input.matches('[data-action="toggle-category"]')) {
        const scope = scopeOf(input);
        // Set은 중복 없는 값의 모음이다. 기존 선택을 복사한 뒤 체크 여부에 따라 추가·삭제한다.
        const categories = new Set(state.filters[scope].categories);
        if (input.checked) categories.add(input.value);
        else categories.delete(input.value);
        // 필터가 바뀌면 이전 페이지·셔플 순서를 초기화해 새 결과의 처음부터 보여 준다.
        setFilter(scope, { categories, ...resetPosition() });
      } else if (input.matches('[data-action="toggle-hide-mastered"]')) {
        setFilter(scopeOf(input), {
          hideMastered: input.checked,
          ...resetPosition(),
        });
      }
    });

    // 이 앱의 카드 폼만 처리한다. 기본 제출(페이지 이동)을 막고 JavaScript로 저장한다.
    document.addEventListener('submit', (event) => {
      const form = elementTarget(event);
      if (!form || !form.matches('[data-js="card-form"]')) return;
      event.preventDefault();
      submitCard(form);
    });

    // 한 번 제출한 폼만 입력할 때마다 그 필드를 다시 검사한다
    document.addEventListener('input', (event) => {
      const control = elementTarget(event);
      if (!control || !control.matches('[data-js="card-form"] [name]')) return;
      const form = control.closest('form');
      if (!submittedForms.has(form)) return;
      const field = control.name;
      showFieldError(form, field, validateCard(readForm(form))[field]);
    });

    // 모달이 열려 있으면 Escape 처리를 브라우저에 맡긴다. 그 외에는 메뉴부터 하나씩 닫는다.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || find('dialog[open]')) return;
      if (closeMenu({ restoreFocus: true })) return;
      // some은 콜백이 true를 반환하면 반복을 멈추므로 패널 하나를 닫으면 종료한다.
      ['study', 'all'].some((scope) =>
        closeCategories(scope, { restoreFocus: true }),
      );
    });

    // 바깥을 클릭하거나 Tab으로 벗어나면 카드 메뉴와 카테고리 패널을 닫는다
    const closeOutside = (event) => {
      const target = elementTarget(event);
      const menu = target?.closest('[data-js="card-menu"]');
      const inOpenMenu =
        menu
          ?.querySelector('[data-action="toggle-card-menu"]')
          ?.getAttribute('data-card-id') === state.openMenuId;
      // 바깥으로 이동한 사용자의 포커스를 다시 끌어오지 않도록 restoreFocus는 false로 둔다.
      if (!inOpenMenu) closeMenu({ restoreFocus: false });
      ['study', 'all'].forEach((scope) => {
        if (
          !target?.closest(
            `[data-scope="${scope}"] [data-js="category-filter"]`,
          )
        ) {
          closeCategories(scope, { restoreFocus: false });
        }
      });
    };
    document.addEventListener('click', closeOutside);
    // focusin은 자식의 포커스 이동도 부모로 전달되므로 document에서 감지할 수 있다.
    document.addEventListener('focusin', closeOutside);

    // 대화상자: 오버레이(dialog 자신) 클릭으로 닫고, 닫힌 뒤 포커스를 돌려준다
    findAll('dialog').forEach((element) => {
      element.addEventListener('click', (event) => {
        // 자식 콘텐츠 클릭은 제외하고, dialog 자체가 클릭 대상인 경우에만 닫는다.
        if (event.target === element) closeDialog(element);
      });
      element.addEventListener('close', () => {
        const form = byJs('card-form', element);
        if (form) resetForm(form);
        // 삭제했다면 지정한 후속 위치로, 그 외에는 원래 카드의 메뉴 버튼으로 돌아간다.
        if (dialog.returnFocus) dialog.returnFocus();
        else menuButton(dialog.cardId)?.focus();
        dialog.returnFocus = null;
      });
    });

    // 토스트: 마우스나 포커스가 있는 동안 자동 닫힘을 멈춘다
    const toastElement = byJs('toast');
    toastElement.addEventListener('mouseenter', () => {
      toast.hovered = true;
      window.clearTimeout(toast.timer);
    });
    toastElement.addEventListener('mouseleave', () => {
      toast.hovered = false;
      if (!toast.focused) startToastTimer();
    });
    toastElement.addEventListener('focusin', () => {
      toast.focused = true;
      window.clearTimeout(toast.timer);
    });
    toastElement.addEventListener('focusout', (event) => {
      // relatedTarget은 다음에 포커스를 받을 요소다. 알림 내부 이동이면 타이머를 멈춘 채 둔다.
      if (toastElement.contains(event.relatedTarget)) return;
      toast.focused = false;
      if (!toast.hovered && !toastElement.hidden) startToastTimer();
    });
  }

  // 앱 시작: 이벤트를 연결하고 카드를 불러온 뒤 현재 상태를 화면에 그린다.
  // async/await는 비동기 로딩 결과를 기다리되, 그동안 브라우저의 다른 작업은 막지 않는다.
  async function init() {
    bindEvents();
    try {
      state.cards = await loadCards();
    } catch (error) {
      // 불러오기에 실패해도 render를 실행해 사용자에게 오류 상태를 표시한다.
      state.loadFailed = true;
    }
    render();
  }

  // defer 스크립트는 DOM 해석 뒤에 실행되지만, 다른 방식으로 불러와도 동작하도록 한 번 더 확인한다
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
