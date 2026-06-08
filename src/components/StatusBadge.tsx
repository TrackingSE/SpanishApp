import type { NodeProgress, NodeStatus } from '../types';
import { STATE_LABEL } from '../lib/adaptive';

const toneByStatus: Record<NodeStatus, string> = {
  locked: 'tag-ink',
  ready: 'tag-ochre',
  learning: 'tag-ochre',
  usable: 'tag-moss',
  passed: 'tag-moss',
};

export function StatusBadge({ status }: { status: NodeStatus }) {
  return <span className={`tag ${toneByStatus[status]}`}>{STATE_LABEL[status]}</span>;
}

/** Status plus due / weak overlay tags, in priority order. */
export function NodeTags({ progress }: { progress?: NodeProgress }) {
  if (!progress) return <span className="tag tag-ink">blocked</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <StatusBadge status={progress.status} />
      {progress.weak && <span className="tag tag-rust">weak</span>}
      {progress.due && <span className="tag tag-ochre">due</span>}
    </span>
  );
}
