const LOOPS_API_KEY = Deno.env.get('LOOPS_API_KEY') || '';
const LOOPS_BASE = 'https://app.loops.so/api/v1';

const headers = () => ({
  'Authorization': `Bearer ${LOOPS_API_KEY}`,
  'Content-Type': 'application/json',
});

export async function syncLoopsContact(data: {
  email: string;
  firstName?: string;
  plan?: string;
  createdAt?: string;
  userId?: string;
}) {
  const body: Record<string, any> = { email: data.email };
  if (data.firstName) body.firstName = data.firstName;
  if (data.plan) body.plan = data.plan;
  if (data.createdAt) body.createdAt = data.createdAt;
  if (data.userId) body.userId = data.userId;

  const res = await fetch(`${LOOPS_BASE}/contacts/update`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const result = await res.text();
  console.log(`Loops contact sync for ${data.email}: ${res.status} ${result}`);
  return { status: res.status, result };
}

export async function sendLoopsTransactional(opts: {
  transactionalId: string;
  email: string;
  dataVariables?: Record<string, string>;
}) {
  const body: Record<string, any> = {
    transactionalId: opts.transactionalId,
    email: opts.email,
  };
  if (opts.dataVariables) body.dataVariables = opts.dataVariables;

  const res = await fetch(`${LOOPS_BASE}/transactional`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  const result = await res.text();
  console.log(`Loops transactional ${opts.transactionalId} to ${opts.email}: ${res.status} ${result}`);
  return { status: res.status, result };
}
