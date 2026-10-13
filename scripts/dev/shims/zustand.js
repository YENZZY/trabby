exports.create = () => (init) => { let state; const set = (p) => { const n = typeof p === 'function' ? p(state) : p; state = { ...state, ...n }; };
  state = init(set, () => state); const hook = (sel) => (sel ? sel(state) : state); hook.getState = () => state; hook.setState = set; return hook; };
