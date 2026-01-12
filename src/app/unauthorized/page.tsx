import Link from 'next/link';

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; debug?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason;
  const debug = params.debug;

  const messages: Record<string, string> = {
    sysop_required: 'This page requires SYSOP access. Contact terry@proveniq.io if you believe this is an error.',
    moderator_required: 'This page requires Moderator access.',
    not_active: 'Your volunteer account is not yet active. Please wait for approval.',
  };

  const message = reason ? messages[reason] || 'You do not have permission to access this page.' : 'You do not have permission to access this page.';

  let debugData = null;
  if (debug) {
    try {
      debugData = JSON.parse(decodeURIComponent(debug));
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="text-6xl">🔒</div>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-zinc-400">{message}</p>
        {debugData && (
          <pre className="text-left text-xs bg-zinc-900 p-3 rounded overflow-auto max-w-full">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        )}
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-800 px-4 text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
