export function CheckoutReturnNotice({
  active,
  message,
}: {
  active: boolean;
  message: string;
}) {
  return (
    <p role="status" className="rounded-xl border border-aqua/20 bg-aqua/5 p-4 text-sm text-aqua">
      {message}
    </p>
  );
}
