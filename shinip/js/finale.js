/* 07 최종 추론·엔딩 (prd.md 5단계) — case01-logic.md 9~11절, dialogue.md 4·6절
   흐름: 신원 확인 → (정체 인식 실패) 엔딩 1 / (정체 인식) C13 최종 추론 모드 → 확인 창 → 최종 선택 → 엔딩
   엔딩: 연출 → 결과 화면(하단 슬로건만) → 공동 연출(엔딩별 하단 문구 + 슬로건 블록, 한 번) → 엔딩 수집 (R-66) */
window.R01 = window.R01 || {};
(function (R) {
  const { h, button, modal, toast } = R.ui;
  const L = R.logic, P = R.pages, T = R.TEXT, F = R.FINALE;
  const commit = (fn) => R.app.commit(fn);
  const reduced = () => document.body.classList.contains('reduced'); // 허브 설정 또는 기기 설정 (main.js applyReduced)
  const typeLabel = (c) => (c.type === 'cctv' ? 'CCTV' : '문서');

  /* 줄을 하나씩 보여 준다 (연출 줄이기 설정이면 한 번에). 끝나면 onDone */
  function reveal(box, items, gap, onDone) {
    if (reduced()) { items.forEach((el) => box.append(el)); if (onDone) onDone(); return; }
    let i = 0;
    (function next() {
      if (!box.isConnected && i > 0) return;
      if (i < items.length) { box.append(items[i]); i += 1; setTimeout(next, gap); } else if (onDone) onDone();
    })();
  }

  /* ---------- 신원 확인 (9절 3~5단계) ---------- */
  let scanDone = false;
  function scanView(s) {
    const box = h('div', { class: 'scan-lines' });
    const act = h('div', { class: 'row end' });
    const wrap = h('section', { class: 'fin' },
      h('p', { class: 'step mono' }, F.scan.label), h('h2', null, '최종 추론'), box, act);
    setTimeout(() => reveal(box, F.scan.lines.map((t) => h('p', { class: 'mono' }, '> ' + t)), 700, () => {
      act.append(s.identity_revealed
        ? button('계속', () => { scanDone = true; R.app.render(); }, { primary: true })
        : button(F.scan.toResult, () => commit((st) => { if (L.resolveEnding1(st)) R.store.recordEnding(1, st.investigation_grade); }), { primary: true }));
    }), 0);
    return wrap;
  }

  /* ---------- C13 최종 추론 모드 (D28~D31) ---------- */
  let pick = null;
  let c13Tab = 'all';
  function c13View(s) {
    const done = !!s.connection_C13;
    const tried = (k) => s.tried_pairs.includes(L.pairKey('06G', k));
    const g = L.clue('06G');
    // 후보 = 획득한 원자료 전체, 06-G·NEW 카드 제외, 획득 순서, 탭 유지 (D28·D29)
    const cands = L.c13Candidates(s).map(L.clue)
      .filter((c) => c13Tab === 'all' || (c13Tab === 'cctv' ? c.type === 'cctv' : c.type === 'doc'));
    const rows = cands.map((c) => {
      const t = tried(c.key);
      return h('button', { type: 'button', class: 'c13-row' + (t ? ' tried' : '') + (pick === c.key ? ' on' : ''),
        disabled: done || t, onClick: () => { pick = c.key; R.app.render(); } },
      h('span', { class: 'arch-title' }, c.name), h('span', { class: 'arch-meta' }, typeLabel(c)));
    });
    const compare = () => {
      if (!pick) return;
      let res = null;
      commit((st) => { res = L.c13Try(st, pick); });
      pick = null;
      if (res && res.result === 'wrong') toast(T.wrongPair);
      R.app.render();
    };
    const toChoice = () => modal({   // D29: 상태와 관계없이 항상 같은 확인 창
      lines: [T.toFinalConfirm],
      buttons: [{ label: T.toFinalConfirmCancel }, { label: T.toFinalConfirmOk, primary: true, onClick: () => commit((st) => L.finishC13(st)) }]
    });
    return h('section', { class: 'fin' },
      h('p', { class: 'step mono' }, 'FINAL INFERENCE'),
      h('h2', null, '최종 추론'),
      h('div', { class: 'c13' },
        h('div', { class: 'c13-slots' },
          h('button', { type: 'button', class: 'c13-pin', onClick: () => P.showEvidence(g) },
            h('span', { class: 'mono new-mat' }, T.newMaterial), h('strong', null, g.name)),
          h('span', { class: 'combo-plus' }, '+'),
          h('div', { class: 'slot' + (pick ? ' full' : '') }, pick ? h('span', { class: 'slot-name' }, L.clue(pick).name) : h('span', { class: 'muted' }, '—'))),
        done
          ? h('div', { class: 'c13-done' }, h('p', { class: 'mono accent' }, '[ ' + T.c13Done + ' ]'), T.c13Result.map((t) => h('p', null, t)))
          : [h('div', { class: 'side-tabs' }, [['all', '전체'], ['doc', '문서'], ['cctv', 'CCTV']].map(([k, l]) =>
              h('button', { type: 'button', class: c13Tab === k ? 'on' : '', onClick: () => { c13Tab = k; R.app.render(); } }, l))),
            h('div', { class: 'c13-list' }, rows)],
        h('div', { class: 'row end' },
          done ? null : button('대조하기', compare, { disabled: !pick }),
          button(T.toFinalChoice, toChoice, { primary: true }))));
  }

  /* ---------- 최종 선택 (9절) ---------- */
  function choiceView(s) {
    const choose = (c) => commit((st) => { if (L.finalChoice(st, c)) R.store.recordEnding(st.ending_id, st.investigation_grade); });
    return h('section', { class: 'fin fin-choice' },
      h('div', { class: 'choice-text' }, T.finalChoice.map((t) => h('p', { class: 'mono' }, t))),
      h('div', { class: 'row center' },
        button(T.choiceTransfer, () => choose('transfer'), { primary: true }),
        button(T.choiceDisconnect, () => choose('disconnect'), { disabled: !s.disconnect_eligible })),
      s.disconnect_eligible ? null : h('p', { class: 'muted center' }, T.disconnectDisabled));
  }

  P['07'] = function (s) {
    // 조합 0개로 최종 추론에 들어온 기록(수정 전에 저장된 것 포함)은 바로 엔딩 1 (D41)
    if (!s.identity_revealed && L.connCount(s) === 0 && !s.ending_evaluation) {
      setTimeout(() => commit((st) => { if (L.resolveEnding1(st)) R.store.recordEnding(1, st.investigation_grade); }), 0);
      return h('section', { class: 'fin' });
    }
    if (!s.identity_revealed || (!scanDone && !s.c13_step_done)) return scanView(s);
    if (!s.c13_step_done) return c13View(s);
    return choiceView(s);
  };

  /* ---------- 엔딩 연출 (10절) ---------- */
  function seq1(s, box, done) {
    const Q = R.ENDING_SEQ[1];
    const lacking = s.investigation_grade === 'INCOMPLETE';   // R-74: 래미가 일부 항목을 ‘데이터 부족’으로
    const items = F.dataItems.map((t, i) => h('p', { class: 'seq-row' }, h('span', null, t),
      h('span', { class: 'mono ' + (lacking && i >= 3 ? 'warn' : 'accent') }, lacking && i >= 3 ? F.lacking : F.collected)));
    box.append(h('p', { class: 'seq-title' }, Q.title));
    reveal(box, items.concat([h('p', { class: 'seq-human mono' }, Q.human)]), 650, done);
  }
  function progress(box, label, onEnd) {
    const bar = h('span', { class: 'seq-bar-in' });
    const pct = h('span', { class: 'mono' }, '0%');
    box.append(h('div', { class: 'seq-progress' }, h('p', null, label, ' ', pct), h('span', { class: 'seq-bar' }, bar)));
    if (reduced()) { bar.style.width = '100%'; pct.textContent = '100%'; onEnd(); return; }
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 4); bar.style.width = p + '%'; pct.textContent = p + '%';
      if (p >= 100) { clearInterval(t); setTimeout(onEnd, 300); }
    }, 60);
  }
  function seq2(s, box, done) {
    const Q = R.ENDING_SEQ[2];
    progress(box, Q.progress, () => reveal(box, [
      h('p', { class: 'seq-row' }, h('span', null, s.player_name + ' · ' + R.OPENING.employeeNo), h('span', { class: 'mono warn' }, Q.deactivated)),
      h('p', { class: 'seq-row' }, h('span', null, s.player_name), h('span', { class: 'mono accent' }, Q.created))
    ], 900, done));
  }
  function seq3(s, box, done) {
    const Q = R.ENDING_SEQ[3];
    box.append(h('div', { class: 'seq-note mono' }, R.ENDING_TEXT[3].note.map((t) => h('p', null, t))));  // R-63: 연출 화면 안에서만
    const name = h('strong', null, s.player_name);
    const me = h('p', { class: 'seq-row' }, h('span', null, name, ' · ' + R.OPENING.employeeNo), h('span', { class: 'mono' }, ''));
    setTimeout(() => progress(box, Q.progress, () => {
      box.append(h('p', { class: 'seq-title' }, Q.users),
        ...['A', 'B', 'C'].map((w) => h('p', { class: 'seq-row' }, h('span', null, R.STAFF[w].name + ' · ' + R.STAFF[w].role), h('span', null, ''))),
        
        me);
      const step2 = () => { name.textContent = 'NULL'; me.classList.add('nulled'); };
      const step3 = () => { me.classList.add('deleted'); me.lastChild.textContent = Q.deleted; box.closest('.ending-screen').classList.add('glitch'); done(); };
      if (reduced()) { step2(); step3(); } else { setTimeout(step2, 900); setTimeout(step3, 1900); }
    }), reduced() ? 0 : 1600);
  }

  let endPhase = 'seq';
  let endFor = null;
  P.ending = function (s) {
    if (endFor !== s.ending_id) { endFor = s.ending_id; endPhase = 'seq'; }
    const E = R.ENDING_TEXT[s.ending_id];
    if (endPhase === 'seq') {
      const box = h('div', { class: 'seq' });
      const act = h('div', { class: 'row end' });
      const wrap = h('section', { class: 'ending-screen' }, h('p', { class: 'step mono' }, E.sub), box, act);
      const fn = { 1: seq1, 2: seq2, 3: seq3 }[s.ending_id];
      setTimeout(() => fn(s, box, () => act.append(button(F.toJoint, () => { endPhase = 'result'; R.app.render(); }, { primary: true }))), 0);
      return wrap;
    }
    if (endPhase === 'result') {
      const g = s.investigation_grade;
      const extra = g === 'COMPLETE' ? R.GRADE_EXTRA[s.ending_id]
        .replace('{clues}', s.clue_order.length).replace('{tries}', s.tried_pairs.length).replace('{talks}', s.rami_log.length) : null;
      const less = g === 'INCOMPLETE' && s.ending_id !== 3 ? (s.ending_id === 1 ? '일부 항목: ' + F.lacking : '이전 결과 일부: ' + F.unknown) : null;
      const view = h('section', { class: 'ending-screen end-result' },
        h('h2', { class: 'end-head' }, E.head), h('p', { class: 'mono muted' }, E.sub),
        h('div', { class: 'end-body' }, E.body.map((t) => h('p', null, t))),
        h('div', { class: 'end-rami' }, h('span', { class: 'mono' }, 'RAMI SYSTEM MESSAGE'), E.rami.map((t) => h('p', null, '“' + t + '”'))),
        h('div', { class: 'end-grade' }, h('span', null, '조사 완성도'), h('strong', { class: 'mono' }, R.GRADE_LABEL[g]),
          extra ? h('p', { class: 'small' }, extra) : null, less ? h('p', { class: 'small warn' }, less) : null),
        h('p', { class: 'end-slogan mono' }, F.slogan),                  // R-66: 결과 화면 하단에는 슬로건만
        s.ending_id === 1 ? null : h('div', { class: 'row end' }, button(F.toJoint, () => { endPhase = 'joint'; R.app.render(); }, { primary: true })));
      if (s.ending_id === 1) {                                           // R-68: 결과 화면 직후 자동 로그아웃
        // 결과 화면을 7초 보여 준 뒤 ‘로그아웃되었습니다.’를 화면 가운데 4초 → 공동 연출
        setTimeout(() => {
          if (endPhase !== 'result' || R.app.state.page !== 'ending') return;
          const over = h('div', { class: 'logout-over', role: 'status' }, h('p', { class: 'mono' }, 'LOGOUT'), h('strong', null, F.logout));
          document.body.append(over);
          setTimeout(() => { over.remove(); if (endPhase === 'result' && R.app.state.page === 'ending') { endPhase = 'joint'; R.app.render(); } }, 4000);
        }, 7000);
      }
      return view;
    }
    // 공동 연출: 엔딩별 하단 문구 + 슬로건 블록 (한 번)
    return h('section', { class: 'ending-screen end-joint' },
      h('div', { class: 'joint-after' }, E.after.map((t) => h('p', null, t))),
      h('div', { class: 'joint-block' }, F.joint.map((t, i) => h('p', { class: i === 0 || i === 3 ? 'mono' : '' }, t))),
      h('div', { class: 'row center' }, button(F.toCollection, () => { endPhase = 'seq'; commit((st) => { st.page = 'collection'; }); }, { primary: true })));
  };
})(window.R01);
