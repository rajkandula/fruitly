export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_#dcfce7_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_left,_#ffedd5_0%,_transparent_50%)]" />
      <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
        <div className="w-full max-w-md animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
