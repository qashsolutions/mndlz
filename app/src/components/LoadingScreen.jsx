export default function LoadingScreen({ message = 'Loading data...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  );
}
