import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-3xl font-bold mb-3">Access Restricted</h1>
        <p className="text-gray-400 mb-8">
          This platform is limited to administrators only. Contact your administrator if you believe this is an error.
        </p>
        <Link href="/signin" className="btn-primary">Sign In with a different account</Link>
      </div>
    </div>
  );
}
