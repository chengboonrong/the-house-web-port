/** Generic deterministic interaction engine. Not reconstructed game behavior. */
export interface Step { target: string; visual: string; narration: string }
export interface GameState { index: number; status: 'ready' | 'playing' | 'complete' }
export const initialState: GameState = { index: 0, status: 'ready' };
export function begin(): GameState { return { index: 0, status: 'playing' }; }
export function advance(state: GameState, target: string, steps: readonly Step[]): GameState {
  if (state.status !== 'playing') return state;
  const current = steps[state.index];
  if (!current || current.target !== target) return state;
  const index = state.index + 1;
  return { index, status: index >= steps.length ? 'complete' : 'playing' };
}
