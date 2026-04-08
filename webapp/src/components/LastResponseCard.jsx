export default function LastResponseCard({ latestResponse }) {
  return (
    <section className="card">
      <h2>Last API Response</h2>
      <pre>{latestResponse}</pre>
    </section>
  );
}
