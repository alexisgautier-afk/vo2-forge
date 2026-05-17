-- BA agent columns
alter table tickets
  add column if not exists assignee_agent text
    check (assignee_agent in ('coding', 'qa', 'pm', 'specs', 'ba')),
  add column if not exists rejection_comment text;

-- Replace status constraint with full lifecycle
alter table tickets
  drop constraint if exists tickets_status_check;

alter table tickets
  add constraint tickets_status_check check (
    status in (
      'draft',
      'pending_approval',
      'approved',
      'rejected',
      'planned',
      'in_progress',
      'review',
      'lead_review',
      'ready_for_uat',
      'ready_for_prod'
    )
  );
