import './sceneLoading.css';

/** Neutral, delayed loading cue; never substitute a different tile model while loading. */
export function SceneLoading() {
  return <div className="scene-loading" role="status"><span aria-hidden="true" /><small>3Dを準備しています</small></div>;
}
