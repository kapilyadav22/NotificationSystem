export default function AlertBar({ type, message, visible }) {
  if (!visible || !message) {
    return null;
  }

  const title = type === "success" ? "Success" : type === "error" ? "Failure" : "Info";
  return (
    <section className={`alert-bar ${type}`} role="status" aria-live="polite">
      <strong>{title}</strong>
      <span>{message}</span>
    </section>
  );
}
