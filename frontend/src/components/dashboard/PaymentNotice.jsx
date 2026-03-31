export default function PaymentNotice() {
  return (
    <section className="rounded-[28px] border border-dashed border-amber-300 bg-amber-50/80 p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Payments</p>
      <h3 className="mt-2 text-2xl font-extrabold text-slate-950">Payment section reserved for Razorpay</h3>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        Fee and payment inputs are intentionally disabled for now. Once your Razorpay setup is ready,
        we can plug payment collection, transaction history, and receipt downloads into this section.
      </p>
    </section>
  );
}
