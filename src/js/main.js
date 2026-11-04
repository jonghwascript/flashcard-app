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
  const findAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
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

  // 문자열 자식은 텍스트 노드로 들어가므로 사용자 입력을 HTML로 해석하지 않는다
  function h(tag, attributes = {}, ...children) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
    element.append(...children);
    return element;
  }

  const icon = (name, size) =>
    h('img', { src: `./images/icon-${name}.svg`, alt: '', width: size, height: size });

  // ------------------------------------------
  // 데이터: 불러오기·저장·숙련 상태
  // ------------------------------------------
  function isValidCard(card) {
    return (
      card !== null &&
      typeof card === 'object' &&
      ['id', 'question', 'answer', 'category'].every(
        (key) => typeof card[key] === 'string',
      ) &&
      Number.isInteger(card.knownCount) &&
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
    let id;
    do {
      id = `fc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    } while (state.cards.some((card) => card.id === id));
    return id;
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

  function updateCard(id, patch) {
    return state.cards.map((card) => (card.id === id ? { ...card, ...patch } : card));
  }

  // ------------------------------------------
  // 파생 값: 필터 결과, 통계, 카테고리
  // ------------------------------------------
  function getFilteredCards(filter) {
    let cards = state.cards;
    if (filter.categories.size) {
      cards = cards.filter((card) => filter.categories.has(card.category));
    }
    if (filter.hideMastered) {
      cards = cards.filter((card) => getStatus(card) !== 'mastered');
    }
    if (filter.order) {
      // 섞은 뒤에 생긴 카드는 원래 목록 순서대로 끝에 붙인다
      const position = new Map(filter.order.map((id, i) => [id, i]));
      cards = cards
        .map((card, i) => ({
          card,
          rank: position.has(card.id) ? position.get(card.id) : filter.order.length + i,
        }))
        .sort((a, b) => a.rank - b.rank)
        .map(({ card }) => card);
    }
    return cards;
  }

  function getStats() {
    const stats = { total: state.cards.length, mastered: 0, 'in-progress': 0, 'not-started': 0 };
    state.cards.forEach((card) => {
      stats[getStatus(card)] += 1;
    });
    return stats;
  }

  function getCategories() {
    const counts = new Map();
    state.cards.forEach((card) => {
      counts.set(card.category, (counts.get(card.category) || 0) + 1);
    });
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function getCurrentCard() {
    const set = getFilteredCards(state.filters.study);
    return set.length ? set[Math.min(state.filters.study.index, set.length - 1)] : null;
  }

  // ------------------------------------------
  // 상태 변경
  // ------------------------------------------
  function setFilter(scope, patch) {
    Object.assign(state.filters[scope], patch);
    render();
  }

  // 필터가 바뀌면 원래 순서의 처음부터 다시 본다
  function resetPosition() {
    return { order: null, index: 0, flipped: false, visible: PAGE_SIZE };
  }

  // 카드 목록이 바뀌는 모든 조작(숙련도·생성·수정·삭제)은 여기를 거친다
  function commitCards(nextCards) {
    const study = state.filters.study;
    const current = getCurrentCard();

    state.cards = nextCards;
    state.loadFailed = false;
    save();

    // 카드가 하나도 남지 않은 카테고리는 선택에서 뺀다
    const names = new Set(nextCards.map((card) => card.category));
    Object.values(state.filters).forEach((filter) => {
      filter.categories = new Set([...filter.categories].filter((name) => names.has(name)));
    });

    // 보던 카드가 남아 있으면 그 카드를, 아니면 같은 위치의 다음 카드(마지막이면 첫 카드)를 보여 준다
    const set = getFilteredCards(study);
    const position = current ? set.findIndex((card) => card.id === current.id) : -1;
    if (position >= 0) {
      study.index = position;
    } else {
      if (study.index >= set.length) study.index = 0;
      study.flipped = false;
    }
    render();
  }

  function announce(message) {
    // 같은 문구가 반복돼도 읽히도록 비운 뒤 다시 채운다
    setText('live-region', '');
    window.setTimeout(() => setText('live-region', message), 50);
  }

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

  function renderView() {
    findAll('.c-view-toggle__button').forEach((button) => {
      const current = button.dataset.view === state.view;
      button.classList.toggle('is-current', current);
      button.setAttribute('aria-pressed', String(current));
    });
    find('#study-view').hidden = state.view !== 'study';
    find('#all-cards-view').hidden = state.view !== 'all';
  }

  const categorySignatures = { study: '', all: '' };

  function renderFilter(scope) {
    const filter = state.filters[scope];
    const root = scopeRoot(scope);
    const list = byJs('category-list', root);
    const categories = getCategories();
    const signature = JSON.stringify(categories);

    // 목록 구성이 바뀔 때만 다시 만들어 체크박스 포커스를 잃지 않게 한다
    if (signature !== categorySignatures[scope]) {
      categorySignatures[scope] = signature;
      list.replaceChildren(
        ...categories.map(({ name, count }) =>
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
              h('span', {}, `${name} `, h('span', { class: 'c-category-filter__count' }, `(${count})`)),
            ),
          ),
        ),
      );
    }

    findAll('input', list).forEach((input) => {
      input.checked = filter.categories.has(input.value);
    });
    find('[data-action="toggle-categories"]', root).setAttribute('aria-expanded', String(filter.open));
    byJs('category-panel', root).hidden = !filter.open;
    find('[data-action="toggle-hide-mastered"]', root).checked = filter.hideMastered;
  }

  function renderStatus(card) {
    if (getStatus(card) === 'mastered') {
      return h(
        'span',
        { class: 'c-mastered-badge' },
        icon('mastered', 16),
        h('span', {}, 'Mastered'),
        h('span', {}, `${MAX_KNOWN}/${MAX_KNOWN}`),
      );
    }
    return h(
      'span',
      { class: 'c-progress' },
      h(
        'span',
        { class: 'c-progress__track', 'aria-hidden': 'true' },
        h('span', { class: `c-progress__bar c-progress__bar--${card.knownCount}` }),
      ),
      h('span', {}, h('span', { class: 'u-sr-only' }, 'Progress: '), `${card.knownCount}/${MAX_KNOWN}`),
    );
  }

  function renderStudy() {
    const study = state.filters.study;
    const set = getFilteredCards(study);
    const noCards = !state.loadFailed && state.cards.length === 0;
    const caughtUp = !state.loadFailed && !noCards && set.length === 0;

    setHidden('load-error', !state.loadFailed);
    setHidden('empty-no-cards', !noCards);
    setHidden('empty-caught-up', !caughtUp);
    setHidden('study-content', set.length === 0);
    if (!set.length) return;

    study.index = Math.min(study.index, set.length - 1);
    const card = set[study.index];
    const mastered = getStatus(card) === 'mastered';

    setText('card-category', card.category);
    setText('card-question', card.question);
    setText('card-answer', card.answer);
    findAll(jsSelector('card-status')).forEach((element) => {
      element.replaceChildren(renderStatus(card));
    });
    setText('card-counter', `Card ${study.index + 1} of ${set.length}`);

    findAll(jsSelector('flashcard')).forEach((element) => {
      element.classList.toggle('is-flipped', study.flipped);
      element.setAttribute('aria-pressed', String(study.flipped));
    });
    findAll('.c-flashcard__face--front').forEach((face) => {
      face.setAttribute('aria-hidden', String(study.flipped));
    });
    findAll('.c-flashcard__face--back').forEach((face) => {
      face.setAttribute('aria-hidden', String(!study.flipped));
    });

    findAll('[data-action="know"]').forEach((button) => {
      button.classList.toggle('is-disabled', mastered);
      button.setAttribute('aria-disabled', String(mastered));
    });
    setText('know-label', mastered ? 'Already Mastered' : 'I Know This');
  }

  function renderGridCard(card, i) {
    const titleId = `grid-card-${i}-title`;
    const menuId = `grid-card-${i}-menu`;

    return h(
      'li',
      { class: 'c-card-grid__item l-card-grid__item' },
      h(
        'article',
        { class: 'c-grid-card l-grid-card', 'aria-labelledby': titleId },
        h('h3', { class: 'c-grid-card__question', id: titleId }, card.question),
        h(
          'div',
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
          h('div', { class: 'c-grid-card__status l-grid-card__status' }, renderStatus(card)),
          h(
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
            h(
              'ul',
              { class: 'c-card-menu__list l-card-menu__list', role: 'list', id: menuId, hidden: '' },
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

  function renderAllCards() {
    const filter = state.filters.all;
    const list = getFilteredCards(filter);
    const hasCards = state.cards.length > 0;
    const grid = byJs('card-grid');

    setHidden('all-load-error', !state.loadFailed);
    setHidden('all-toolbar', !hasCards);
    setHidden('all-empty-no-cards', state.loadFailed || hasCards);
    setHidden('all-empty-caught-up', !hasCards || list.length > 0);
    setHidden('pagination', list.length <= filter.visible);

    grid.hidden = list.length === 0;

    // 보이는 카드 내용이 바뀔 때만 다시 그린다. 메뉴를 여닫을 때 버튼이 교체되면 클릭·포커스가 끊긴다
    const visibleCards = list.slice(0, filter.visible);
    const signature = JSON.stringify(visibleCards);
    if (signature !== gridSignature) {
      gridSignature = signature;

      // 다시 그리기 전에 그리드 안의 포커스 위치를 기억했다가 되돌린다
      const active = document.activeElement;
      const focused = grid.contains(active)
        ? { id: active.getAttribute('data-card-id'), action: active.getAttribute('data-action') }
        : null;

      grid.replaceChildren(...visibleCards.map(renderGridCard));

      if (focused && focused.id) {
        find(`${byCardId(focused.id)}[data-action="${focused.action}"]`, grid)?.focus();
      }
    }

    findAll('[data-action="toggle-card-menu"]', grid).forEach((button) => {
      const open = button.getAttribute('data-card-id') === state.openMenuId;
      button.setAttribute('aria-expanded', String(open));
      document.getElementById(button.getAttribute('aria-controls')).hidden = !open;
    });
  }

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

  const fieldOf = (form, field) => find(`[name="${field}"]`, form);

  function readForm(form) {
    return {
      question: fieldOf(form, 'question').value,
      answer: fieldOf(form, 'answer').value,
      category: fieldOf(form, 'category').value,
    };
  }

  function validateCard(values) {
    const errors = {};
    Object.keys(ERROR_MESSAGES).forEach((field) => {
      if (!values[field].trim()) errors[field] = ERROR_MESSAGES[field];
    });
    return errors;
  }

  function showFieldError(form, field, message) {
    const control = fieldOf(form, field);
    const error = find(`[data-error-for="${field}"]`, form);
    error.hidden = !message;
    findAll(jsSelector('error-text'), error).forEach((text) => {
      text.textContent = message || '';
    });
    if (message) {
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
    Object.keys(ERROR_MESSAGES).forEach((field) => showFieldError(form, field, errors[field]));
    submittedForms.add(form);

    const first = Object.keys(ERROR_MESSAGES).find((field) => errors[field]);
    if (first) fieldOf(form, first).focus();
    return !first;
  }

  function resetForm(form) {
    form.reset();
    submittedForms.delete(form);
    Object.keys(ERROR_MESSAGES).forEach((field) => showFieldError(form, field, null));
  }

  // ------------------------------------------
  // 대화상자
  // ------------------------------------------
  const dialog = {
    cardId: null,
    returnFocus: null, // 닫힌 뒤 포커스를 줄 요소를 고르는 함수. 없으면 메뉴 버튼
  };

  function menuButton(id) {
    if (id === null) return null;
    return find(`${byCardId(id)}[data-action="toggle-card-menu"]`, byJs('card-grid'));
  }

  function openDialog(name, cardId) {
    const card = state.cards.find((item) => item.id === cardId);
    if (!card) return;

    dialog.cardId = cardId;
    dialog.returnFocus = null;
    state.openMenuId = null;
    render();

    const element = document.getElementById(`${name}-dialog`);
    if (name === 'edit') {
      const form = byJs('card-form', element);
      resetForm(form);
      fieldOf(form, 'question').value = card.question;
      fieldOf(form, 'answer').value = card.answer;
      fieldOf(form, 'category').value = card.category;
    }
    element.showModal();
    find(name === 'edit' ? '[name="question"]' : '[data-action="close-dialog"]', element)?.focus();
  }

  function closeDialog(element, returnFocus) {
    dialog.returnFocus = returnFocus || null;
    element.close();
  }

  // 삭제한 카드 자리에 온 다음 카드 → 이전 카드 → 빈 상태 제목 순서로 포커스를 준다
  function focusAfterDelete(index) {
    const buttons = findAll('[data-action="toggle-card-menu"]', byJs('card-grid'));
    if (buttons.length) {
      buttons.at(Math.min(index, buttons.length - 1)).focus();
    } else {
      find('#all-cards-view .c-empty-state:not([hidden]) [tabindex="-1"]')?.focus();
    }
  }

  // ------------------------------------------
  // 토스트
  // ------------------------------------------
  const toast = { timer: null, hovered: false, focused: false };

  function startToastTimer() {
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(hideToast, TOAST_DURATION);
  }

  function showToast(message) {
    setText('toast-message', message);
    byJs('toast').hidden = false;
    // 토스트 자체는 live 영역이 아니다. 안내는 공용 live 영역 한 곳에서만 한다
    announce(message);
    if (!toast.hovered && !toast.focused) startToastTimer();
  }

  function hideToast() {
    window.clearTimeout(toast.timer);
    const element = byJs('toast');
    const hadFocus = element.contains(document.activeElement);
    element.hidden = true;
    toast.hovered = false;
    toast.focused = false;
    // 닫기 버튼에 있던 포커스가 사라지지 않도록 현재 보기 제목으로 옮긴다
    if (hadFocus) find(state.view === 'all' ? '#all-cards-title' : '#study-view-title')?.focus();
  }

  // ------------------------------------------
  // 이벤트 (위임: 다시 그린 요소에도 그대로 동작)
  // ------------------------------------------
  const scopeOf = (element) => element.closest('[data-scope]')?.dataset.scope;

  const actions = {
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

    flip() {
      const card = getCurrentCard();
      if (!card) return;
      setFilter('study', { flipped: !state.filters.study.flipped });
      announce(state.filters.study.flipped ? `Answer: ${card.answer}` : `Question: ${card.question}`);
    },

    know() {
      const card = getCurrentCard();
      if (!card || getStatus(card) === 'mastered') return;
      const knownCount = card.knownCount + 1;
      commitCards(updateCard(card.id, { knownCount }));
      announce(knownCount === MAX_KNOWN ? 'Card mastered.' : `Progress: ${knownCount} of ${MAX_KNOWN}.`);
    },

    reset() {
      const card = getCurrentCard();
      if (!card) return;
      commitCards(updateCard(card.id, { knownCount: 0 }));
      announce('Progress reset.');
    },

    prev() {
      move(-1);
    },

    next() {
      move(1);
    },

    shuffle(button) {
      const scope = scopeOf(button);
      const set = getFilteredCards(state.filters[scope]);
      if (!set.length) return;
      setFilter(scope, { ...resetPosition(), order: shuffle(set.map((card) => card.id)) });
      announce(scope === 'study' ? `Cards shuffled. Card 1 of ${set.length}.` : 'Cards shuffled.');
    },

    'toggle-categories'(button) {
      const scope = scopeOf(button);
      setFilter(scope, { open: !state.filters[scope].open });
    },

    'toggle-card-menu'(button) {
      const id = button.getAttribute('data-card-id');
      state.openMenuId = state.openMenuId === id ? null : id;
      render();
    },

    'edit-card'(button) {
      openDialog('edit', button.getAttribute('data-card-id'));
    },

    'delete-card'(button) {
      openDialog('delete', button.getAttribute('data-card-id'));
    },

    'confirm-delete'(button) {
      const id = dialog.cardId;
      const index = getFilteredCards(state.filters.all).findIndex((card) => card.id === id);
      closeDialog(button.closest('dialog'), () => focusAfterDelete(index));
      commitCards(state.cards.filter((card) => card.id !== id));
      showToast('Card deleted.');
    },

    'close-dialog'(button) {
      closeDialog(button.closest('dialog'));
    },

    'load-more'() {
      const filter = state.filters.all;
      const first = filter.visible;
      setFilter('all', { visible: filter.visible + PAGE_SIZE });
      findAll('[data-action="toggle-card-menu"]', byJs('card-grid'))[first]?.focus();
    },

    'dismiss-toast'() {
      hideToast();
    },
  };

  function move(step) {
    const study = state.filters.study;
    const set = getFilteredCards(study);
    if (!set.length) return;
    const index = (study.index + step + set.length) % set.length;
    setFilter('study', { index, flipped: false });
    announce(`Card ${index + 1} of ${set.length}: ${set[index].question}`);
  }

  function submitCard(form) {
    if (!checkForm(form)) return;
    const values = readForm(form);

    if (form.dataset.form === 'create') {
      const card = {
        id: createId(),
        question: values.question.trim(),
        answer: values.answer.trim(),
        category: normalizeCategory(values.category),
        knownCount: 0,
      };
      commitCards([...state.cards, card]);
      resetForm(form);
      showToast('Card created successfully.');
      return;
    }

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

  function closeCategories(scope, { restoreFocus }) {
    if (!state.filters[scope].open) return false;
    setFilter(scope, { open: false });
    if (restoreFocus) find('[data-action="toggle-categories"]', scopeRoot(scope))?.focus();
    return true;
  }

  const elementTarget = (event) => (event.target instanceof Element ? event.target : null);

  function bindEvents() {
    // 실행 동작을 먼저 처리한 뒤, 아래의 바깥 클릭 처리가 열림 상태를 정리한다
    document.addEventListener('click', (event) => {
      const button = elementTarget(event)?.closest('[data-action]');
      const action = button && actions[button.dataset.action];
      if (action) action(button);
    });

    document.addEventListener('change', (event) => {
      const input = elementTarget(event);
      if (!input) return;

      if (input.matches('[data-action="toggle-category"]')) {
        const scope = scopeOf(input);
        const categories = new Set(state.filters[scope].categories);
        if (input.checked) categories.add(input.value);
        else categories.delete(input.value);
        setFilter(scope, { categories, ...resetPosition() });
      } else if (input.matches('[data-action="toggle-hide-mastered"]')) {
        setFilter(scopeOf(input), { hideMastered: input.checked, ...resetPosition() });
      }
    });

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

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || find('dialog[open]')) return;
      if (closeMenu({ restoreFocus: true })) return;
      ['study', 'all'].some((scope) => closeCategories(scope, { restoreFocus: true }));
    });

    // 바깥을 클릭하거나 Tab으로 벗어나면 카드 메뉴와 카테고리 패널을 닫는다
    const closeOutside = (event) => {
      const target = elementTarget(event);
      const menu = target?.closest('[data-js="card-menu"]');
      const inOpenMenu =
        menu?.querySelector('[data-action="toggle-card-menu"]')?.getAttribute('data-card-id') ===
        state.openMenuId;
      if (!inOpenMenu) closeMenu({ restoreFocus: false });
      ['study', 'all'].forEach((scope) => {
        if (!target?.closest(`[data-scope="${scope}"] [data-js="category-filter"]`)) {
          closeCategories(scope, { restoreFocus: false });
        }
      });
    };
    document.addEventListener('click', closeOutside);
    document.addEventListener('focusin', closeOutside);

    // 대화상자: 오버레이(dialog 자신) 클릭으로 닫고, 닫힌 뒤 포커스를 돌려준다
    findAll('dialog').forEach((element) => {
      element.addEventListener('click', (event) => {
        if (event.target === element) closeDialog(element);
      });
      element.addEventListener('close', () => {
        const form = byJs('card-form', element);
        if (form) resetForm(form);
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
      if (toastElement.contains(event.relatedTarget)) return;
      toast.focused = false;
      if (!toast.hovered && !toastElement.hidden) startToastTimer();
    });
  }

  async function init() {
    bindEvents();
    try {
      state.cards = await loadCards();
    } catch (error) {
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
