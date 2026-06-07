export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Lab not found</h1>
      <p className="text-muted-foreground mt-2">
        This subdomain does not match an active dental lab tenant.
      </p>
    </div>
  );
}
